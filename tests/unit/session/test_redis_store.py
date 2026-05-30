"""
Unit tests for RedisSessionStore (src/session/store.py).

Covers:
  - load: cache miss, valid JSON, corrupt JSON
  - save: success/failure from Lua eval, version increment
  - push_turn: pipeline calls, ltrim bound
  - load_turns: happy path, corrupt entry skipped
  - save_summary / load_summary: TTL and None on miss
"""
from __future__ import annotations

import json

import pytest
from unittest.mock import AsyncMock, MagicMock

from src.session.store import RedisSessionStore, SUMMARY_TTL


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_store(mock_redis) -> RedisSessionStore:
    return RedisSessionStore(redis_pool=mock_redis)


# ---------------------------------------------------------------------------
# load()
# ---------------------------------------------------------------------------

class TestLoad:
    """RedisSessionStore.load() — cache miss, parse, decode error."""

    async def test_load_returns_empty_dict_on_cache_miss(self):
        mock_redis = AsyncMock()
        mock_redis.get = AsyncMock(return_value=None)
        store = _make_store(mock_redis)

        result = await store.load('session-1')

        assert result == {}

    async def test_load_returns_parsed_json(self):
        payload = {'active_filters': {'city': 'Mumbai'}, 'version': 1}
        mock_redis = AsyncMock()
        mock_redis.get = AsyncMock(return_value=json.dumps(payload))
        store = _make_store(mock_redis)

        result = await store.load('session-1')

        assert result == payload

    async def test_load_returns_empty_on_decode_error(self):
        mock_redis = AsyncMock()
        mock_redis.get = AsyncMock(return_value=b'invalid json{')
        store = _make_store(mock_redis)

        result = await store.load('session-1')

        assert result == {}


# ---------------------------------------------------------------------------
# save()
# ---------------------------------------------------------------------------

class TestSave:
    """RedisSessionStore.save() — success, version conflict, version increment."""

    async def test_save_calls_eval_with_correct_args(self):
        mock_redis = AsyncMock()
        mock_redis.eval = AsyncMock(return_value=1)
        store = _make_store(mock_redis)

        result = await store.save('session-1', {'data': 'x'}, expected_version=0)

        assert result is True
        mock_redis.eval.assert_awaited_once()
        call_args = mock_redis.eval.call_args
        # Positional: (script, num_keys, key, expected_version, new_value, ttl)
        args = call_args.args
        assert args[1] == 1, "num_keys must be 1"
        assert args[2] == 'session:session-1', "key must match _SESSION_KEY template"
        assert args[3] == 0, "expected_version arg must match"

    async def test_save_returns_false_on_version_conflict(self):
        mock_redis = AsyncMock()
        mock_redis.eval = AsyncMock(return_value=0)
        store = _make_store(mock_redis)

        result = await store.save('session-1', {'data': 'x'}, expected_version=0)

        assert result is False

    async def test_save_increments_version(self):
        mock_redis = AsyncMock()
        mock_redis.eval = AsyncMock(return_value=1)
        store = _make_store(mock_redis)

        await store.save('session-1', {'some': 'data'}, expected_version=2)

        call_args = mock_redis.eval.call_args.args
        # new_value is the 5th positional arg (index 4)
        new_value_json = call_args[4]
        stored = json.loads(new_value_json)
        assert stored['version'] == 3, "version must be incremented to expected_version + 1"


# ---------------------------------------------------------------------------
# push_turn()
# ---------------------------------------------------------------------------

class TestPushTurn:
    """RedisSessionStore.push_turn() — pipeline calls, ltrim to 19."""

    async def test_push_turn_calls_pipeline(self):
        mock_pipe = MagicMock()
        mock_pipe.lpush = MagicMock()
        mock_pipe.ltrim = MagicMock()
        mock_pipe.expire = MagicMock()
        mock_pipe.execute = AsyncMock(return_value=[1, True, True])

        mock_redis = MagicMock()
        mock_redis.pipeline = MagicMock(return_value=mock_pipe)
        store = _make_store(mock_redis)

        await store.push_turn('conv-1', {'role': 'user', 'content': 'hello'})

        expected_key = 'conv:turns:conv-1'
        mock_pipe.lpush.assert_called_once()
        assert mock_pipe.lpush.call_args.args[0] == expected_key

        mock_pipe.ltrim.assert_called_once_with(expected_key, 0, 19)
        mock_pipe.execute.assert_awaited_once()


# ---------------------------------------------------------------------------
# load_turns()
# ---------------------------------------------------------------------------

class TestLoadTurns:
    """RedisSessionStore.load_turns() — happy path, corrupt entry skipped."""

    async def test_load_turns_returns_list(self):
        turn = {'role': 'user', 'content': 'hi'}
        mock_redis = AsyncMock()
        mock_redis.lrange = AsyncMock(return_value=[json.dumps(turn)])
        store = _make_store(mock_redis)

        result = await store.load_turns('conv-1')

        assert result == [turn]

    async def test_load_turns_skips_corrupt_entry(self):
        valid_a = json.dumps({'role': 'user', 'content': 'hello'}).encode()
        corrupt = b'corrupted{'
        valid_b = json.dumps({'role': 'bot', 'content': 'hi'}).encode()

        mock_redis = AsyncMock()
        mock_redis.lrange = AsyncMock(return_value=[valid_a, corrupt, valid_b])
        store = _make_store(mock_redis)

        result = await store.load_turns('conv-1')

        assert len(result) == 2
        assert result[0]['role'] == 'user'
        assert result[1]['role'] == 'bot'


# ---------------------------------------------------------------------------
# save_summary() / load_summary()
# ---------------------------------------------------------------------------

class TestSummary:
    """RedisSessionStore.save_summary() and load_summary()."""

    async def test_save_summary_sets_ttl(self):
        mock_redis = AsyncMock()
        mock_redis.setex = AsyncMock(return_value=True)
        store = _make_store(mock_redis)

        await store.save_summary('conv-1', 'Looking for 2BHK in Mumbai')

        mock_redis.setex.assert_awaited_once_with(
            'conv:summary:conv-1',
            SUMMARY_TTL,
            'Looking for 2BHK in Mumbai',
        )

    async def test_load_summary_returns_none_on_miss(self):
        mock_redis = AsyncMock()
        mock_redis.get = AsyncMock(return_value=None)
        store = _make_store(mock_redis)

        result = await store.load_summary('conv-1')

        assert result is None
