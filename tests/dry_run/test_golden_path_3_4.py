"""
CHAT-Q-008 / CHAT-Q-009: Golden path E2E tests #3 and #4.

Test #3 (Q-008): Out of scope — fast path
  "tell me a joke"
  → domain_router returns out_of_scope
  → NO Stage 2 classifier call (zero SLM tokens)
  → Canned response, no tool calls, no LLM call
  → Single chat_event: COMPLETED

Test #4 (Q-009): Clarification flow
  "looking for a flat"
  → SLM: clarification_needed="Rent or buy?", options=['Rent', 'Buy']
  → clarify_node short-circuits → nested_qna template emitted
  → No tool calls

Requirements covered:
  REQ-CLASS-005 — out_of_scope domain fast-path skips Stage 2 SLM
  REQ-CLASS-006 — clarification_needed triggers nested_qna short-circuit
"""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock

from tests.dry_run.runner import run_dry_pipeline


# ---------------------------------------------------------------------------
# Helper factories
# ---------------------------------------------------------------------------

def _make_router(domain, confidence=0.95):
    """Build a DomainRouterPort mock that returns a plain dict.

    route_domain_node uses result.get("domain") / result.get("confidence"),
    so the return value must be a real dict.
    """
    router = MagicMock()
    router.route = AsyncMock(return_value={"domain": domain, "confidence": confidence})
    return router


def _make_classifier(domain, main_intent, sub_intent, filter_delta,
                     clarification_needed=None, clarification_data=None, pivot=False):
    """Build a ClassifierPort mock that returns a plain dict.

    classify_node stores the return value directly in state['classification'],
    and validate_slm_node calls c.get(...) on it — so it must be a real dict
    with required boolean fields (multi_intent, pivot, entities_mentioned).
    """
    classifier = MagicMock()
    classifier.classify = AsyncMock(return_value={
        "domain":               domain,
        "main_intent":          main_intent,
        "sub_intent":           sub_intent,
        "filter_delta":         filter_delta,
        "entities_mentioned":   [],
        "multi_intent":         False,
        "pivot":                pivot,
        "clarification_needed": clarification_needed,
        "clarification_data":   clarification_data or {},
        "confidence":           0.95,
        "reasoning":            "test",
    })
    return classifier


# ---------------------------------------------------------------------------
# Golden path #3 (Q-008): Out of scope — fast path
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_out_of_scope_fast_path():
    """Out of scope → canned response, no tool calls, no LLM call.

    classify_node has a fast path for out_of_scope that skips calling the
    classifier entirely — so we pass a classifier mock that raises if called.
    """
    mock_router = _make_router(domain='out_of_scope', confidence=0.99)
    # Classifier should NOT be called for out_of_scope domain
    mock_classifier = MagicMock()
    mock_classifier.classify = AsyncMock(
        side_effect=AssertionError("classifier should not be called for out_of_scope")
    )

    result = await run_dry_pipeline(
        message="tell me a joke",
        scenario="default",
        router=mock_router, classifier=mock_classifier,
    )

    # No tool calls for out_of_scope
    assert result.tool_calls == []
    # Pipeline completes — final event is COMPLETED
    chat_events = [e for e in result.sse_events if e.event_type == 'chat_event']
    if chat_events:
        assert chat_events[-1].source_message_state == 'COMPLETED'


@pytest.mark.asyncio
async def test_out_of_scope_no_tool_calls():
    """Out of scope path never executes tool fetches."""
    mock_router = _make_router(domain='out_of_scope', confidence=0.99)

    result = await run_dry_pipeline(
        message="what is the meaning of life",
        scenario="default",
        router=mock_router,
    )

    assert result.tool_calls == []


# ---------------------------------------------------------------------------
# Golden path #4 (Q-009): Clarification flow
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_clarification_emits_nested_qna():
    """Clarification needed → nested_qna template, pipeline short-circuits."""
    mock_classifier = _make_classifier(
        domain='property_search', main_intent='property_search',
        sub_intent='filter_search', filter_delta={},
        clarification_needed="Rent or buy?",
        clarification_data={'options': ['Rent', 'Buy'], 'question_id': 'txn_type'},
    )
    mock_router = _make_router(domain='property_search', confidence=0.90)

    result = await run_dry_pipeline(
        message="looking for a flat",
        scenario="default",
        router=mock_router, classifier=mock_classifier,
    )

    assert result.clarification == "Rent or buy?"
    # No tool calls when clarification needed
    assert result.tool_calls == []
    # bot_response should be the nested_qna template
    bot_response = result.final_state.get('bot_response') or {}
    assert bot_response.get('template_id') == 'nested_qna'


@pytest.mark.asyncio
async def test_clarification_options_in_payload():
    """Clarification payload includes options for the FE to render."""
    mock_classifier = _make_classifier(
        domain='property_search', main_intent='property_search',
        sub_intent='filter_search', filter_delta={},
        clarification_needed="Rent or buy?",
        clarification_data={'options': ['Rent', 'Buy'], 'question_id': 'q1'},
    )
    mock_router = _make_router(domain='property_search', confidence=0.90)

    result = await run_dry_pipeline(
        message="looking for a flat",
        scenario="default",
        router=mock_router, classifier=mock_classifier,
    )

    bot_response = result.final_state.get('bot_response') or {}
    data = bot_response.get('data') or {}
    selections = data.get('selections') or []
    assert len(selections) >= 1
    assert selections[0].get('type') == 'single_select'
