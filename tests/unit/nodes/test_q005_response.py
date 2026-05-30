"""
CHAT-Q-005: Unit tests for response pipeline nodes.

Covers:
  summary_node        — Phase 1 deterministic summary emission
  validate_output_node — URL / phone / table stripping
  followup_node       — sequence numbers and COMPLETED close event
"""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, patch

from tests.unit.conftest import make_test_state

# ---------------------------------------------------------------------------
# Import nodes under test
# ---------------------------------------------------------------------------

from src.pipeline.nodes.response import (
    summary_node,
    validate_output_node,
    followup_node,
    SUMMARY_BUILDERS,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_emit_sse():
    """Returns (emit_sse callable, events list)."""
    events = []

    def emit_sse(event_type, data):
        events.append({'type': event_type, 'data': data})

    return emit_sse, events


def _minimal_session(session_id: str = 'test-123', **extra):
    base = {
        'session_id': session_id,
        'active_filters': {},
        'transaction_type': 'buy',
    }
    base.update(extra)
    return base


# ---------------------------------------------------------------------------
# Tests: summary_node
# ---------------------------------------------------------------------------

class TestSummaryNode:

    @pytest.mark.asyncio
    async def test_summary_node_emits_for_template_intent(self):
        """summary_node must emit message_delta for a registered (property_search, filter_search) intent."""
        emit_sse, events = _make_emit_sse()

        state = make_test_state(
            request_id='req-001',
            routing={'tier': '3a'},
            classification={
                'main_intent': 'property_search',
                'sub_intent': 'filter_search',
                'entities_mentioned': [],
            },
            session=_minimal_session(
                active_filters={'bhk': [2], 'city': 'Mumbai'},
                transaction_type='buy',
            ),
            resolved_entities={},
        )

        with patch('src.pipeline.nodes.response.persist_to_kafka', new=AsyncMock()):
            result = await summary_node(state, emit_sse)

        # At least one message_delta should have been emitted
        delta_events = [e for e in events if e['type'] == 'message_delta']
        assert delta_events, 'summary_node must emit at least one message_delta event'

        # result must indicate summary was emitted
        assert result.get('summary_emitted') is True, \
            "summary_node must return {'summary_emitted': True}"

    @pytest.mark.asyncio
    async def test_summary_node_skips_text_only_intent(self):
        """summary_node must return {} (no emission) for intents not in SUMMARY_BUILDERS."""
        emit_sse, events = _make_emit_sse()

        # property_detail/property_about is NOT in SUMMARY_BUILDERS
        assert ('property_detail', 'property_about') not in SUMMARY_BUILDERS

        state = make_test_state(
            routing={'tier': '3a'},
            classification={
                'main_intent': 'property_detail',
                'sub_intent': 'property_about',
                'entities_mentioned': [],
            },
            session=_minimal_session(),
            resolved_entities={},
        )

        result = await summary_node(state, emit_sse)

        assert result == {}, \
            'summary_node must return {} for text-only intents not in SUMMARY_BUILDERS'
        assert not events, 'No SSE events must be emitted for text-only intent'

    @pytest.mark.asyncio
    async def test_summary_node_eagerness_guard(self):
        """summary_node must skip when any entity confidence is below ENTITY_CONFIDENCE_THRESHOLD."""
        emit_sse, events = _make_emit_sse()

        state = make_test_state(
            routing={'tier': '3a'},
            classification={
                'main_intent': 'property_search',
                'sub_intent': 'filter_search',
                'entities_mentioned': [{'name': 'Andheri', 'inferred_type': 'locality'}],
            },
            session=_minimal_session(active_filters={'city': 'Mumbai'}),
            resolved_entities={
                'Andheri': {'confidence': 0.40},  # below threshold of 0.70
            },
        )

        result = await summary_node(state, emit_sse)

        assert result == {}, \
            'summary_node must return {} when entity confidence is below threshold'
        assert not events, 'No SSE events must be emitted when eagerness guard fires'

    @pytest.mark.asyncio
    async def test_summary_node_skips_non_tier3(self):
        """summary_node must return {} for non-tier-3 routing."""
        emit_sse, events = _make_emit_sse()

        state = make_test_state(
            routing={'tier': 2},  # integer tier — not '3a' or '3b'
            classification={
                'main_intent': 'property_search',
                'sub_intent': 'filter_search',
                'entities_mentioned': [],
            },
            session=_minimal_session(),
            resolved_entities={},
        )

        result = await summary_node(state, emit_sse)

        assert result == {}, \
            'summary_node must return {} for non-tier-3 routing tiers'
        assert not events, 'No SSE events must be emitted for non-tier-3 routing'


# ---------------------------------------------------------------------------
# Tests: validate_output_node
# ---------------------------------------------------------------------------

class TestValidateOutputNode:

    @pytest.mark.asyncio
    async def test_validate_output_blocks_url(self):
        """validate_output_node must strip URLs from LLM text."""
        state = make_test_state(
            llm_response={'text': 'Check https://housing.com for details'},
            classification={'main_intent': 'property_search', 'sub_intent': 'filter_search'},
            request_id='req-002',
        )

        result = await validate_output_node(state)

        assert 'https://housing.com' not in result['validated_text'], \
            'URL must be stripped from validated_text'

    @pytest.mark.asyncio
    async def test_validate_output_allows_table_for_comparison(self):
        """validate_output_node must NOT strip markdown tables for comparison intents."""
        table_text = 'Some text\n| Name | Value |\n|---| --- |\n| Row | Data |\n'
        state = make_test_state(
            llm_response={'text': table_text},
            classification={'main_intent': 'comparison', 'sub_intent': 'compare_localities'},
            request_id='req-003',
        )

        result = await validate_output_node(state)

        # Table separator marker should still be present for comparison intents
        assert '|---|' in result['validated_text'] or '| --- |' in result['validated_text'], \
            'Markdown table must NOT be stripped for comparison intent'

    @pytest.mark.asyncio
    async def test_validate_output_blocks_table_for_non_comparison(self):
        """validate_output_node must strip markdown tables for non-comparison intents."""
        table_text = 'Some intro text\n| Col1 | Col2 |\n|---| --- |\n| row1 | row2 |\n'
        state = make_test_state(
            llm_response={'text': table_text},
            classification={'main_intent': 'property_search', 'sub_intent': 'filter_search'},
            request_id='req-004',
        )

        result = await validate_output_node(state)

        assert '|---|' not in result['validated_text'], \
            'Markdown table must be stripped for non-comparison intents'
        assert '| --- |' not in result['validated_text'], \
            'Markdown table must be stripped for non-comparison intents'

    @pytest.mark.asyncio
    async def test_validate_output_blocks_phone_number(self):
        """validate_output_node must strip Indian mobile phone numbers."""
        state = make_test_state(
            llm_response={'text': 'Call 9876543210 for details'},
            classification={'main_intent': 'property_search', 'sub_intent': 'filter_search'},
            request_id='req-005',
        )

        result = await validate_output_node(state)

        assert '9876543210' not in result['validated_text'], \
            'Phone number must be removed from validated_text'


# ---------------------------------------------------------------------------
# Tests: followup_node
# ---------------------------------------------------------------------------

class TestFollowupNode:

    @pytest.mark.asyncio
    async def test_followup_node_sequence_number_with_summary(self):
        """followup_node must use sequenceNumber=2 when summary_emitted=True and template_count=1."""
        emit_sse, events = _make_emit_sse()

        state = make_test_state(
            request_id='req-006',
            classification={'main_intent': 'property_search', 'sub_intent': 'filter_search'},
            session=_minimal_session(session_id='sess-006'),
            validated_text='Here are some properties for you.',
            llm_response={'text': 'Here are some properties for you.', 'text_message_id': 'msg-abc'},
            summary_emitted=True,   # +1
            template_count=1,       # +1 → seq = 2
            tool_results=[],
        )

        with patch('src.pipeline.nodes.response.persist_to_kafka', new=AsyncMock()), \
             patch('src.pipeline.nodes.response.update_session_state', new=AsyncMock(return_value=True)):
            await followup_node(state, emit_sse)

        chat_events = [e for e in events if e['type'] == 'chat_event']
        assert chat_events, 'followup_node must emit at least one chat_event'

        seq = chat_events[-1]['data'].get('sequenceNumber')
        assert seq == 2, f'Expected sequenceNumber=2, got {seq}'

    @pytest.mark.asyncio
    async def test_followup_node_emits_completed_on_empty_text(self):
        """followup_node must emit a COMPLETED event even when validated_text is empty."""
        emit_sse, events = _make_emit_sse()

        state = make_test_state(
            request_id='req-007',
            classification={'main_intent': 'property_search', 'sub_intent': 'filter_search'},
            session=_minimal_session(session_id='sess-007'),
            validated_text='',  # empty
            llm_response={'text': '', 'text_message_id': 'msg-xyz'},
            summary_emitted=False,
            template_count=0,
            tool_results=[],
        )

        with patch('src.pipeline.nodes.response.persist_to_kafka', new=AsyncMock()), \
             patch('src.pipeline.nodes.response.update_session_state', new=AsyncMock(return_value=True)):
            await followup_node(state, emit_sse)

        chat_events = [e for e in events if e['type'] == 'chat_event']
        assert chat_events, 'followup_node must emit a chat_event even for empty text'

        last_event_data = chat_events[-1]['data']
        assert last_event_data.get('messageState') == 'COMPLETED', \
            'followup_node must emit COMPLETED state even when validated_text is empty'
