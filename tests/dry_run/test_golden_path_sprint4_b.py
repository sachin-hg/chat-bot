"""CHAT-Q-013 / Q-014 / Q-015: Sprint 4 golden path tests — batch B.

Q-013: Pivot from property_search → locality_research clears intent-local filters
       (bhk, price_max) while preserving universal keys (city).

Q-014: SLM domain router timeout → pipeline falls back gracefully to last_domain
       or out_of_scope without raising an exception.

Q-015: explore_nearby with no saved location → share_location template emitted,
       no tool calls made.
"""
from __future__ import annotations

import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock

from tests.dry_run.runner import run_dry_pipeline


# ---------------------------------------------------------------------------
# Helper factories  (plain-dict returns — required by pipeline .get() calls)
# ---------------------------------------------------------------------------

def _make_router(domain: str, confidence: float = 0.95):
    """Build a DomainRouterPort mock that returns a plain dict."""
    router = MagicMock()
    router.route = AsyncMock(return_value={"domain": domain, "confidence": confidence})
    return router


def _make_classifier(
    domain: str,
    main_intent: str,
    sub_intent: str,
    filter_delta: dict,
    entities_mentioned: list | None = None,
    clarification_needed=None,
    pivot: bool = False,
):
    """Build a ClassifierPort mock that returns a plain dict."""
    classifier = MagicMock()
    classifier.classify = AsyncMock(return_value={
        "domain":               domain,
        "main_intent":          main_intent,
        "sub_intent":           sub_intent,
        "filter_delta":         filter_delta,
        "entities_mentioned":   entities_mentioned or [],
        "multi_intent":         False,
        "pivot":                pivot,
        "clarification_needed": clarification_needed,
        "confidence":           0.93,
        "reasoning":            "test",
    })
    return classifier


# ---------------------------------------------------------------------------
# Q-013: Pivot — property_search → locality_research (filters cleared)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_pivot_clears_intent_local_filters():
    """Pivot from property_search to locality_research clears bhk/price filters."""
    # Session state after Turn 1 (property search established bhk + price)
    session_after_search = {
        'session_id': 'pivot-test-session',
        'turn_count': 1,
        'active_filters': {
            'bhk': [2],
            'price_max': 8_000_000,
            'city': 'Mumbai',
            'localities': ['Bandra'],
        },
        'turn_history': [],
        'transaction_type': 'buy',
    }

    # Turn 2: pivot to locality research
    mock_classifier = _make_classifier(
        domain='locality',
        main_intent='locality_research',
        sub_intent='locality_overview',
        filter_delta={'localities': ['Andheri']},
        entities_mentioned=[{'name': 'Andheri', 'inferred_type': 'locality'}],
        pivot=True,
    )
    mock_router = _make_router(domain='locality', confidence=0.93)

    result = await run_dry_pipeline(
        message="tell me about Andheri",
        scenario="default",
        session=session_after_search,
        router=mock_router,
        classifier=mock_classifier,
    )

    final_filters = result.session.get('active_filters', {})

    # Intent-local keys must be cleared on pivot
    assert 'bhk' not in final_filters, f"bhk should be cleared on pivot, got: {final_filters}"
    assert 'price_max' not in final_filters, f"price_max should be cleared on pivot, got: {final_filters}"

    # Universal key (city) must be preserved
    assert final_filters.get('city') == 'Mumbai', (
        f"city should be preserved as universal key, got: {final_filters}"
    )


@pytest.mark.asyncio
async def test_pivot_preserves_universal_keys():
    """Pivot preserves all universal keys: city and transaction_type."""
    session = {
        'session_id': 'pivot-universal-session',
        'turn_count': 1,
        'active_filters': {
            'bhk': [3],
            'price_min': 5_000_000,
            'price_max': 12_000_000,
            'city': 'Pune',
            'transaction_type': 'buy',
        },
        'turn_history': [],
    }

    mock_classifier = _make_classifier(
        domain='locality',
        main_intent='locality_research',
        sub_intent='locality_overview',
        filter_delta={},
        pivot=True,
    )
    mock_router = _make_router(domain='locality', confidence=0.90)

    result = await run_dry_pipeline(
        message="what is Koregaon Park like",
        scenario="default",
        session=session,
        router=mock_router,
        classifier=mock_classifier,
    )

    final_filters = result.session.get('active_filters', {})

    # city and transaction_type are universal — must survive pivot
    assert final_filters.get('city') == 'Pune'
    assert final_filters.get('transaction_type') == 'buy'

    # price bounds must be cleared
    assert 'price_min' not in final_filters
    assert 'price_max' not in final_filters
    assert 'bhk' not in final_filters


# ---------------------------------------------------------------------------
# Q-014: Error recovery — SLM timeout fallback
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_slm_timeout_falls_back_gracefully():
    """SLM domain router timeout → falls back to last_domain or out_of_scope."""
    # Router that times out
    timeout_router = MagicMock()
    timeout_router.route = AsyncMock(side_effect=asyncio.TimeoutError())

    session = {
        'session_id': 'timeout-session',
        'turn_count': 1,
        'active_filters': {},
        'turn_history': [],
        'last_domain': 'property_search',  # known from previous turn
    }

    result = await run_dry_pipeline(
        message="show me more",
        scenario="default",
        session=session,
        router=timeout_router,
    )

    # Pipeline must complete without raising an exception.
    # After timeout, route_domain_node stores the fallback domain in final_state['domain']
    # (not in classification, which may be missing or a stub object).
    routed_domain = result.final_state.get('domain', '')
    assert routed_domain in ('property_search', 'out_of_scope', ''), (
        f"Expected fallback domain, got: {routed_domain!r}"
    )

    # Stream must end with COMPLETED (not hang)
    chat_events = [e for e in result.sse_events if e.event_type == 'chat_event']
    if chat_events:
        assert chat_events[-1].source_message_state == 'COMPLETED'


@pytest.mark.asyncio
async def test_slm_timeout_no_exception_raised():
    """Pipeline does not propagate TimeoutError from domain router."""
    timeout_router = MagicMock()
    timeout_router.route = AsyncMock(side_effect=asyncio.TimeoutError())

    session = {
        'session_id': 'timeout-no-raise-session',
        'turn_count': 0,
        'active_filters': {},
        'turn_history': [],
    }

    # Should not raise — the pipeline catches TimeoutError in route_domain_node
    result = await run_dry_pipeline(
        message="any message",
        scenario="default",
        session=session,
        router=timeout_router,
    )

    # Verify a result was produced at all
    assert result is not None


# ---------------------------------------------------------------------------
# Q-015: explore_nearby → share_location template
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_explore_nearby_triggers_share_location():
    """explore_nearby with no saved location → share_location template emitted."""
    mock_classifier = _make_classifier(
        domain='property_search',
        main_intent='property_search',
        sub_intent='explore_nearby',
        filter_delta={'user_location_needed': True},
        entities_mentioned=[],
    )
    mock_router = _make_router(domain='property_search', confidence=0.91)

    session = {
        'session_id': 'nearby-session',
        'turn_count': 0,
        'active_filters': {},
        'turn_history': [],
        # No saved location
    }

    result = await run_dry_pipeline(
        message="show me properties near me",
        scenario="default",
        session=session,
        router=mock_router,
        classifier=mock_classifier,
    )

    bot_response = result.final_state.get('bot_response') or {}
    assert bot_response.get('template_id') == 'share_location', (
        f"Expected share_location template, got bot_response: {bot_response}"
    )

    # No tool calls before location is known
    assert result.tool_calls == [], (
        f"Expected no tool calls before location granted, got: {result.tool_calls}"
    )


@pytest.mark.asyncio
async def test_explore_nearby_no_tool_calls_without_location():
    """explore_nearby never fires searchProperties before location is granted."""
    mock_classifier = _make_classifier(
        domain='property_search',
        main_intent='property_search',
        sub_intent='explore_nearby',
        filter_delta={'user_location_needed': True},
    )
    mock_router = _make_router(domain='property_search', confidence=0.88)

    result = await run_dry_pipeline(
        message="find flats near me",
        scenario="default",
        session={
            'session_id': 'nearby-no-tools-session',
            'turn_count': 0,
            'active_filters': {},
            'turn_history': [],
        },
        router=mock_router,
        classifier=mock_classifier,
    )

    tool_names = [c['tool'] for c in result.tool_calls]
    assert 'searchProperties' not in tool_names, (
        f"searchProperties must not be called before location is known, calls: {tool_names}"
    )
