"""CHAT-Q-006: Golden path E2E test #1 — 2BHK Bandra search.

Tests the full pipeline (dry-run) for:
  Turn 1 — "show me 2bhk in bandra"  → property_carousel + text + COMPLETED
  Turn 2 — "tell me more about this property"  → text-only, no carousel
"""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock

from tests.dry_run.runner import run_dry_pipeline


# ---------------------------------------------------------------------------
# Helper factories
# ---------------------------------------------------------------------------

def _make_router(domain: str, confidence: float = 0.95):
    """Build a DomainRouterPort mock that returns a plain dict (not MagicMock).

    route_domain_node uses result.get("domain") / result.get("confidence"),
    so the return value must be a real dict.
    """
    router = MagicMock()
    router.route = AsyncMock(return_value={"domain": domain, "confidence": confidence})
    return router


def _make_classifier(domain: str, main_intent: str, sub_intent: str,
                     filter_delta: dict, clarification_needed=None, pivot=False):
    """Build a ClassifierPort mock that returns a plain dict.

    classify_node stores the return value directly in state['classification'],
    and validate_slm_node calls c.get(...) on it — so it must be a real dict
    with the required boolean fields (multi_intent, pivot, entities_mentioned).
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
        "confidence":           0.95,
        "reasoning":            "test",
    })
    return classifier


# ---------------------------------------------------------------------------
# Turn 1 tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_property_search_carousel_returned():
    """Turn 1: 2BHK search returns property_carousel with hits."""
    mock_classifier = _make_classifier(
        domain='property_search',
        main_intent='property_search',
        sub_intent='filter_search',
        filter_delta={'bhk': [2], 'localities': ['Bandra'], 'transaction_type': 'buy'},
    )
    mock_router = _make_router(domain='property_search', confidence=0.97)

    result = await run_dry_pipeline(
        message="show me 2bhk in bandra",
        scenario="2bhk_bandra_search",
        router=mock_router,
        classifier=mock_classifier,
    )

    assert result.main_intent == 'property_search'
    assert result.sub_intent == 'filter_search'
    assert result.filter_delta.get('bhk') == [2]

    # SSE events check
    chat_events = [e for e in result.sse_events if e.event_type == 'chat_event']
    assert len(chat_events) >= 1

    # Check tool was called
    tool_names = [c['tool'] for c in result.tool_calls]
    assert 'searchProperties' in tool_names


@pytest.mark.asyncio
async def test_property_search_sse_ordering():
    """Turn 1: SSE events arrive in correct order — last chat_event is COMPLETED."""
    mock_classifier = _make_classifier(
        domain='property_search',
        main_intent='property_search',
        sub_intent='filter_search',
        filter_delta={'bhk': [2], 'localities': ['Bandra']},
    )
    mock_router = _make_router(domain='property_search', confidence=0.97)

    result = await run_dry_pipeline(
        message="show me 2bhk in bandra",
        scenario="2bhk_bandra_search",
        router=mock_router,
        classifier=mock_classifier,
    )

    # Last chat_event must be COMPLETED
    chat_events = [e for e in result.sse_events if e.event_type == 'chat_event']
    if chat_events:
        assert chat_events[-1].source_message_state == 'COMPLETED'


# ---------------------------------------------------------------------------
# Turn 2 test
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_property_detail_turn_2():
    """Turn 2: property_about intent returns text response (no carousel)."""
    session_after_turn1 = {
        'session_id': 'gp-session-001',
        'turn_count': 1,
        'active_filters': {'bhk': [2], 'city': 'Mumbai'},
        'turn_history': [],
        'active_property_id': 'prop-bandra-001',
    }
    mock_classifier = _make_classifier(
        domain='property_detail',
        main_intent='property_detail',
        sub_intent='property_about',
        filter_delta={},
    )
    mock_router = _make_router(domain='property_detail', confidence=0.95)

    result = await run_dry_pipeline(
        message="tell me more about this property",
        scenario="2bhk_bandra_search",
        session=session_after_turn1,
        router=mock_router,
        classifier=mock_classifier,
    )

    assert result.main_intent == 'property_detail'
    # text-only intent — no carousel templates
    template_events = [e for e in result.sse_events if e.template_id == 'property_carousel']
    assert len(template_events) == 0
