"""CHAT-Q-010 / Q-011 / Q-012: Sprint 4 golden path tests — A series.

Test Q-010: calculator/calculate_emi (no LLM, no searchProperties)
Test Q-011: portfolio/saved_properties auth gate (anon → login; logged-in → data)
Test Q-012: Hindi ordinal "doosri locality dikhao" → locality_research sub_intent
"""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock

from tests.dry_run.runner import run_dry_pipeline


# ---------------------------------------------------------------------------
# Helper factories — plain dict returns (required by route_domain_node /
# classify_node which call result.get(...))
# ---------------------------------------------------------------------------

def _wrap_router(d: dict):
    """Build a DomainRouterPort mock returning a plain dict."""
    r = MagicMock()
    r.route = AsyncMock(return_value=d)
    return r


def _wrap_classifier(d: dict):
    """Build a ClassifierPort mock returning a plain dict.

    validate_slm_node calls c.get(...) on the classification dict, so it
    must be a plain dict with required boolean fields (multi_intent, pivot,
    entities_mentioned).
    """
    # Ensure required boolean fields are present
    payload = {
        'entities_mentioned': [],
        'multi_intent': False,
    }
    payload.update(d)
    c = MagicMock()
    c.classify = AsyncMock(return_value=payload)
    return c


# ---------------------------------------------------------------------------
# Q-010: calculator/calculate_emi
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_calculate_emi_no_llm_no_search():
    """EMI calculation — no LLM call and no searchProperties tool invocation.

    calculator/calculate_emi is Tier 2 in the intent registry. The dry-run
    executor stub returns a text_response (production code computes EMI via
    calculateEMI). The key invariant is: the pipeline never calls searchProperties
    and never reaches an LLM turn.
    """
    mock_router = _wrap_router({'domain': 'property_detail', 'confidence': 0.95})
    mock_classifier = _wrap_classifier({
        'domain': 'property_detail',
        'main_intent': 'calculator',
        'sub_intent': 'calculate_emi',
        'filter_delta': {'loan_amount': 10_000_000, 'rate': 8.5},
        'clarification_needed': None,
        'pivot': False,
        'confidence': 0.95,
        'reasoning': 'test',
    })

    result = await run_dry_pipeline(
        message="EMI for 1Cr at 8.5%",
        scenario="default",
        router=mock_router,
        classifier=mock_classifier,
    )

    assert result.main_intent == 'calculator'
    assert result.sub_intent == 'calculate_emi'

    # Tier 2 — no searchProperties calls
    search_calls = [c for c in result.tool_calls if c['tool'] == 'searchProperties']
    assert len(search_calls) == 0

    # Tier 2 routes through execute_tier2_action (stub) — bot_response is always set
    bot_response = result.final_state.get('bot_response') or {}
    assert bot_response.get('template_id') is not None, (
        "bot_response must carry a template_id for Tier 2 calculator intent"
    )

    # Routing must be Tier 2 (no LLM model assigned)
    routing = result.final_state.get('routing') or {}
    assert routing.get('tier') == 2
    assert routing.get('model') is None


@pytest.mark.asyncio
async def test_calculate_emi_tier2_direct():
    """EMI calculation is Tier 2 — no LLM, direct computation, instant response."""
    mock_router = _wrap_router({'domain': 'property_detail', 'confidence': 0.95})
    mock_classifier = _wrap_classifier({
        'domain': 'property_detail',
        'main_intent': 'calculator',
        'sub_intent': 'calculate_emi',
        'filter_delta': {'loan_amount': 10_000_000, 'rate': 8.5},
        'clarification_needed': None,
        'pivot': False,
        'confidence': 0.95,
        'reasoning': 'test',
    })

    result = await run_dry_pipeline(
        message="EMI for 1Cr at 8.5%",
        scenario="default",
        router=mock_router,
        classifier=mock_classifier,
    )

    assert result.main_intent == 'calculator'
    assert result.sub_intent == 'calculate_emi'

    # Tier 2 — no LLM calls (no searchProperties)
    search_calls = [c for c in result.tool_calls if c['tool'] == 'searchProperties']
    assert len(search_calls) == 0

    # bot_response should be set by the Tier 2 action (stub returns text_response
    # in dry-run; production would return emi_result)
    bot_response = result.final_state.get('bot_response') or {}
    assert bot_response.get('template_id') in ('emi_result', 'text_response'), (
        f"Expected emi_result or text_response template, got {bot_response.get('template_id')!r}"
    )


# ---------------------------------------------------------------------------
# Q-011: portfolio/saved_properties (auth-gated)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_saved_properties_anonymous_user_gets_login_template():
    """Anonymous user hitting auth-gated intent → login template, no data fetch."""
    mock_router = _wrap_router({'domain': 'portfolio', 'confidence': 0.92})
    mock_classifier = _wrap_classifier({
        'domain': 'portfolio',
        'main_intent': 'portfolio',
        'sub_intent': 'saved_properties',
        'filter_delta': {},
        'clarification_needed': None,
        'pivot': False,
        'confidence': 0.92,
        'reasoning': 'test',
    })

    # Anonymous session — no auth_token
    session = {
        'session_id': 'anon-session',
        'turn_count': 0,
        'active_filters': {},
        'turn_history': [],
    }

    result = await run_dry_pipeline(
        message="show my saved properties",
        scenario="default",
        session=session,
        router=mock_router,
        classifier=mock_classifier,
    )

    bot_response = result.final_state.get('bot_response') or {}
    assert bot_response.get('template_id') == 'login', (
        f"Anonymous user must get login template, got {bot_response.get('template_id')!r}"
    )
    assert result.tool_calls == [], (
        "No tool calls should be made before authentication"
    )


@pytest.mark.asyncio
async def test_saved_properties_logged_in_user_gets_data():
    """Logged-in user hitting saved_properties — no login template."""
    mock_router = _wrap_router({'domain': 'portfolio', 'confidence': 0.92})
    mock_classifier = _wrap_classifier({
        'domain': 'portfolio',
        'main_intent': 'portfolio',
        'sub_intent': 'saved_properties',
        'filter_delta': {},
        'clarification_needed': None,
        'pivot': False,
        'confidence': 0.92,
        'reasoning': 'test',
    })

    # Logged-in session — has auth_token
    session = {
        'session_id': 'logged-in-session',
        'turn_count': 0,
        'active_filters': {},
        'turn_history': [],
        'auth_token': 'valid-token-123',
    }

    result = await run_dry_pipeline(
        message="show my saved properties",
        scenario="default",
        session=session,
        router=mock_router,
        classifier=mock_classifier,
    )

    bot_response = result.final_state.get('bot_response') or {}
    assert bot_response.get('template_id') != 'login', (
        "Logged-in user must not receive a login template"
    )


# ---------------------------------------------------------------------------
# Q-012: Hindi "doosri locality dikhao" (ordinal resolution)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_hindi_ordinal_second_locality():
    """'doosri locality dikhao' → ordinal sub_intent, not a new filter_search."""
    mock_router = _wrap_router({'domain': 'locality', 'confidence': 0.88})
    mock_classifier = _wrap_classifier({
        'domain': 'locality',
        'main_intent': 'locality_research',
        'sub_intent': 'locality_overview',
        'filter_delta': {'localities': ['Andheri']},
        'entities_mentioned': [{'name': 'Andheri', 'inferred_type': 'locality'}],
        'clarification_needed': None,
        'pivot': False,
        'multi_intent': False,
        'confidence': 0.88,
        'reasoning': 'Hindi ordinal resolved',
    })

    result = await run_dry_pipeline(
        message="doosri locality dikhao",
        scenario="default",
        router=mock_router,
        classifier=mock_classifier,
    )

    assert result.main_intent == 'locality_research'
    assert result.sub_intent == 'locality_overview'

    # Must NOT be routed to property_search/filter_search (which would call searchProperties)
    search_calls = [c for c in result.tool_calls if c['tool'] == 'searchProperties']
    assert len(search_calls) == 0, (
        "Hindi ordinal must resolve to locality_research, not property_search"
    )

    # Pipeline completes (last event COMPLETED if any chat_events emitted)
    chat_events = [e for e in result.sse_events if e.event_type == 'chat_event']
    if chat_events:
        assert chat_events[-1].source_message_state == 'COMPLETED'
