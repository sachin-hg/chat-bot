"""
Unit tests for summarize_conversation (src/pipeline/summarizer.py).

Covers:
  - Extractive summary returned when llm_adapter=None and turns exist
  - None returned when turns list is empty
  - None returned (non-fatal) when Redis raises an exception
  - LLM response capped at 1500 chars
  - _trigger_conversation_summary publishes a summarize_request Kafka event
"""
from __future__ import annotations

import json

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from src.pipeline.summarizer import summarize_conversation


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_mock_redis(turns=None, session=None):
    """Return an AsyncMock redis pool with lrange and get pre-configured."""
    mock_redis = AsyncMock()

    if turns is not None:
        mock_redis.lrange = AsyncMock(
            return_value=[json.dumps(t).encode() for t in turns]
        )
    else:
        mock_redis.lrange = AsyncMock(return_value=[])

    if session is not None:
        mock_redis.get = AsyncMock(return_value=json.dumps(session).encode())
    else:
        mock_redis.get = AsyncMock(return_value=None)

    mock_redis.setex = AsyncMock(return_value=True)
    return mock_redis


# ---------------------------------------------------------------------------
# summarize_conversation
# ---------------------------------------------------------------------------

class TestSummarizeConversation:
    """Core behaviour of summarize_conversation()."""

    async def test_summarize_conversation_returns_extractive_summary_without_llm(self):
        """Returns non-empty string for extractive path (llm_adapter=None)."""
        turns = [{'role': 'user', 'content': 'show 2bhk in bandra'}]
        session = {
            'active_filters': {'bhk': [2], 'city': 'Mumbai'},
            'session_id': 's1',
        }
        mock_redis = _make_mock_redis(turns=turns, session=session)

        result = await summarize_conversation('s1', mock_redis, llm_adapter=None)

        assert result is not None
        assert len(result) > 0

    async def test_summarize_conversation_returns_none_on_empty_turns(self):
        """Returns None when there are no conversation turns."""
        mock_redis = _make_mock_redis(turns=[])

        result = await summarize_conversation('s1', mock_redis, llm_adapter=None)

        assert result is None

    async def test_summarize_conversation_is_nonfatal_on_redis_error(self):
        """Returns None without raising when Redis throws."""
        mock_redis = AsyncMock()
        mock_redis.lrange = AsyncMock(side_effect=Exception('Redis connection refused'))

        result = await summarize_conversation('s1', mock_redis, llm_adapter=None)

        assert result is None

    async def test_summarize_conversation_caps_at_1500_chars(self):
        """LLM response exceeding 1500 chars is truncated to 1500."""
        turns = [{'role': 'user', 'content': 'show me flats'}]
        mock_redis = _make_mock_redis(turns=turns, session={'session_id': 's1', 'active_filters': {}})

        # Build a mock LLM adapter whose stream() produces a 2000-char response
        long_text = 'x' * 2000

        async def fake_stream(model, system, messages, tools, on_chunk, on_tool_use):
            await on_chunk(long_text)

        mock_llm = MagicMock()
        mock_llm.stream = fake_stream

        result = await summarize_conversation('s1', mock_redis, llm_adapter=mock_llm)

        assert result is not None
        assert len(result) <= 1500


# ---------------------------------------------------------------------------
# _trigger_conversation_summary
# ---------------------------------------------------------------------------

class TestTriggerConversationSummary:
    """_trigger_conversation_summary publishes a Kafka event."""

    async def test_trigger_at_turn_20(self):
        """_trigger_conversation_summary calls persist_to_kafka with summarize_request."""
        from src.pipeline.nodes.response import _trigger_conversation_summary

        with patch(
            'src.pipeline.nodes.response.persist_to_kafka',
            new_callable=AsyncMock,
        ) as mock_persist:
            await _trigger_conversation_summary('session-1')

        mock_persist.assert_awaited_once()
        call_args = mock_persist.call_args
        # First positional arg is session_id, second is the events list
        session_id_arg = call_args.args[0]
        events_arg = call_args.args[1]

        assert session_id_arg == 'session-1'
        assert isinstance(events_arg, list)
        assert len(events_arg) == 1
        assert events_arg[0]['type'] == 'summarize_request'
