"""
CHAT-Q-DRY-007b: Dry-run tests for SSE response nodes — part B.

Validates respond_node, validate_output_node, and followup_node behaviour
without running the full pipeline or hitting real infrastructure.

Requirements covered:
  REQ-RESP-006 — locality_carousel emitted for trending_localities
  REQ-RESP-008 — carousel seq = 0 if no summary
  REQ-RESP-012 — phone numbers blocked by validate_output
  REQ-RESP-014 — markdown tables blocked for non-comparison intents
  REQ-RESP-016 — unknown bot_response shape → safe error SSE
"""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, patch

from tests.unit.conftest import make_test_state
from src.pipeline.nodes.response import respond_node, validate_output_node, followup_node


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _make_collector():
    """Returns (emit_sse callable, events list)."""
    events = []

    def emit_sse(event_type: str, data):
        events.append({'type': event_type, 'data': data})

    return emit_sse, events


def _minimal_session(session_id: str = 'dry-sess-b-001', **extra):
    base = {
        'session_id': session_id,
        'active_filters': {},
        'transaction_type': 'buy',
    }
    base.update(extra)
    return base


# ---------------------------------------------------------------------------
# REQ-RESP-006: locality_carousel emitted for trending_localities
# ---------------------------------------------------------------------------

class TestRespondNodeCarouselStub:
    """REQ-RESP-006: locality_carousel should be emitted for trending_localities.
    Sprint 1/2: build_template_events is a stub returning [].
    Full carousel emission tested in Sprint 3 (CHAT-P-027).
    """

    @pytest.mark.asyncio
    async def test_respond_node_emits_no_templates_when_stub(self):
        """respond_node with empty pre_fetched_data; stub returns [] so template_count=0.

        # Full carousel emission tested in Sprint 3 (CHAT-P-027)
        """
        emit_sse, events = _make_collector()

        state = make_test_state(
            request_id='req-dry-b-001',
            classification={
                'main_intent': 'locality_research',
                'sub_intent': 'trending_localities',
            },
            session=_minimal_session(session_id='dry-sess-b-001'),
            pre_fetched_data={},
            tool_results=[],
            summary_emitted=False,
        )

        result = await respond_node(state, emit_sse)

        assert result == {'template_count': 0}, (
            'REQ-RESP-006: Sprint 1/2 stub — build_template_events returns [], '
            'so template_count must be 0'
        )


# ---------------------------------------------------------------------------
# REQ-RESP-008: carousel seq = 0 if no summary
# ---------------------------------------------------------------------------

class TestRespondNodeSeqStart:
    """REQ-RESP-008: carousel seq_start depends on whether a summary was emitted."""

    @pytest.mark.asyncio
    async def test_respond_node_seq_start_zero_when_no_summary(self):
        """summary_emitted=False → seq_start=0 passed to build_template_events.

        Since build_template_events is a stub returning [], verify template_count=0.
        When real templates exist, seq_start=0 means carousel gets seq=0.
        """
        emit_sse, events = _make_collector()

        state = make_test_state(
            request_id='req-dry-b-002',
            classification={
                'main_intent': 'locality_research',
                'sub_intent': 'trending_localities',
            },
            session=_minimal_session(session_id='dry-sess-b-002'),
            pre_fetched_data={},
            tool_results=[],
            summary_emitted=False,
        )

        captured_kwargs = {}

        original_build = __import__(
            'src.pipeline.nodes.response', fromlist=['build_template_events']
        ).build_template_events

        def mock_build(**kwargs):
            captured_kwargs.update(kwargs)
            return []

        with patch('src.pipeline.nodes.response.build_template_events', side_effect=mock_build):
            result = await respond_node(state, emit_sse)

        assert result == {'template_count': 0}
        assert captured_kwargs.get('seq_start') == 0, (
            'REQ-RESP-008: summary_emitted=False must pass seq_start=0 to build_template_events'
        )

    @pytest.mark.asyncio
    async def test_respond_node_seq_start_one_when_summary_emitted(self):
        """summary_emitted=True → seq_start=1 passed to build_template_events.

        Verifies the seq_start calculation directly.
        """
        emit_sse, events = _make_collector()

        state = make_test_state(
            request_id='req-dry-b-003',
            classification={
                'main_intent': 'locality_research',
                'sub_intent': 'trending_localities',
            },
            session=_minimal_session(session_id='dry-sess-b-003'),
            pre_fetched_data={},
            tool_results=[],
            summary_emitted=True,
        )

        captured_kwargs = {}

        def mock_build(**kwargs):
            captured_kwargs.update(kwargs)
            return []

        with patch('src.pipeline.nodes.response.build_template_events', side_effect=mock_build):
            result = await respond_node(state, emit_sse)

        assert result == {'template_count': 0}
        assert captured_kwargs.get('seq_start') == 1, (
            'REQ-RESP-008: summary_emitted=True must pass seq_start=1 to build_template_events'
        )


# ---------------------------------------------------------------------------
# REQ-RESP-012: phone numbers blocked by validate_output
# ---------------------------------------------------------------------------

class TestValidateOutputPhoneNumber:
    """REQ-RESP-012: Indian phone numbers must be stripped and replaced with [contact removed]."""

    @pytest.mark.asyncio
    async def test_validate_output_blocks_indian_phone_number(self):
        """10-digit Indian mobile number (starting 6–9) must be replaced by [contact removed]."""
        state = make_test_state(
            request_id='req-dry-b-004',
            classification={
                'main_intent': 'property_detail',
                'sub_intent': 'property_about',
            },
            session=_minimal_session(session_id='dry-sess-b-004'),
            llm_response={
                'text': "The seller's number is 9876543210. Call now.",
                'text_message_id': 'msg-dry-b-004',
            },
        )

        result = await validate_output_node(state)

        assert '9876543210' not in result['validated_text'], (
            'REQ-RESP-012: phone number must be removed from validated_text'
        )
        assert '[contact removed]' in result['validated_text'], (
            'REQ-RESP-012: phone number must be replaced with [contact removed]'
        )


# ---------------------------------------------------------------------------
# REQ-RESP-014: markdown tables blocked for non-comparison intents
# ---------------------------------------------------------------------------

class TestValidateOutputMarkdownTable:
    """REQ-RESP-014: Markdown tables blocked for non-comparison intents; allowed for comparison."""

    @pytest.mark.asyncio
    async def test_validate_output_blocks_table_for_property_search(self):
        """Markdown table in LLM output must be stripped for property_search intent."""
        table_text = (
            "Here are properties:\n"
            "| Name | Price |\n"
            "|------|-------|\n"
            "| Apt A | 50L |\n"
            "| Apt B | 60L |\n"
        )

        state = make_test_state(
            request_id='req-dry-b-005',
            classification={
                'main_intent': 'property_search',
                'sub_intent': 'filter_search',
            },
            session=_minimal_session(session_id='dry-sess-b-005'),
            llm_response={
                'text': table_text,
                'text_message_id': 'msg-dry-b-005',
            },
        )

        result = await validate_output_node(state)

        assert '|---|' not in result['validated_text'], (
            'REQ-RESP-014: markdown table must be stripped for property_search intent'
        )

    @pytest.mark.asyncio
    async def test_validate_output_allows_table_for_locality_comparison(self):
        """Markdown table must NOT be stripped for comparison intents.

        The validate_output_node checks COMPARISON_INTENTS = {'comparison',
        'locality_research/locality_comparison'}. The main_intent field is used
        for the membership check, so 'comparison' is the correct value.
        """
        table_text = (
            "Comparison:\n"
            "| Locality | Price |\n"
            "|----------|-------|\n"
            "| Bandra   | 2.5Cr |\n"
            "| Andheri  | 1.8Cr |\n"
        )

        state = make_test_state(
            request_id='req-dry-b-006',
            classification={
                'main_intent': 'comparison',
                'sub_intent': 'compare_localities',
            },
            session=_minimal_session(session_id='dry-sess-b-006'),
            llm_response={
                'text': table_text,
                'text_message_id': 'msg-dry-b-006',
            },
        )

        result = await validate_output_node(state)

        # Table separator must remain — table was not stripped
        assert '|' in result['validated_text'], (
            'REQ-RESP-014: markdown table must NOT be stripped for comparison intent'
        )


# ---------------------------------------------------------------------------
# REQ-RESP-016: unknown bot_response shape → safe error SSE
# ---------------------------------------------------------------------------

class TestFollowupNodeEmptyText:
    """REQ-RESP-016: Empty validated_text must not hang — must emit COMPLETED and return None."""

    @pytest.mark.asyncio
    async def test_followup_node_handles_empty_validated_text_gracefully(self):
        """validated_text='' must emit exactly 1 chat_event with COMPLETED state
        and return bot_response=None."""
        emit_sse, events = _make_collector()

        state = make_test_state(
            request_id='req-dry-b-007',
            classification={
                'main_intent': 'property_search',
                'sub_intent': 'filter_search',
            },
            session=_minimal_session(session_id='dry-sess-b-007'),
            validated_text='',
            llm_response={'text': '', 'text_message_id': 'msg-dry-b-007'},
            summary_emitted=False,
            template_count=0,
            tool_results=[],
        )

        with patch('src.pipeline.nodes.response.persist_to_kafka', new=AsyncMock()), \
             patch('src.pipeline.nodes.response.update_session_state', new=AsyncMock(return_value=True)):
            result = await followup_node(state, emit_sse)

        # Exactly 1 emit_sse call was made
        assert len(events) == 1, (
            'REQ-RESP-016: exactly 1 emit_sse call must be made for empty validated_text'
        )

        # The emitted event must be COMPLETED (not hanging on IN_PROGRESS)
        emitted_data = events[0]['data']
        assert emitted_data.get('messageState') == 'COMPLETED', (
            'REQ-RESP-016: emitted event must have messageState=COMPLETED, not IN_PROGRESS'
        )

        # bot_response must be None
        assert result.get('bot_response') is None, (
            'REQ-RESP-016: bot_response must be None when validated_text is empty'
        )
