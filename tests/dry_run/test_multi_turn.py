"""CHAT-Q-multi-turn: Multi-turn conversation tests — filter accumulation over turns."""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock

from tests.dry_run.runner import run_dry_pipeline


# ---------------------------------------------------------------------------
# Helper factories
# ---------------------------------------------------------------------------

def _make_router(domain: str, confidence: float = 0.95):
    """Build a DomainRouterPort mock that returns a plain dict."""
    router = MagicMock()
    router.route = AsyncMock(return_value={"domain": domain, "confidence": confidence})
    return router


def _make_classifier(domain: str, main_intent: str, sub_intent: str,
                     filter_delta: dict, clarification_needed=None, pivot=False):
    """Build a ClassifierPort mock that returns a plain dict."""
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
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_bhk_filter_accumulates_across_turns():
    """Turn 1 sets bhk=[2], Turn 2 adds bhk=[3] — REPLACE semantics → [3]."""
    # Turn 1: search with bhk=2
    session_t1 = {'session_id': 'multi-1', 'turn_count': 0, 'active_filters': {}, 'turn_history': []}
    result_t1 = await run_dry_pipeline(
        message="show me 2bhk",
        scenario="default",
        session=session_t1,
        router=_make_router('property_search', 0.95),
        classifier=_make_classifier('property_search', 'property_search', 'filter_search',
                                    {'bhk': [2], 'transaction_type': 'buy'}),
    )
    assert result_t1.filter_delta.get('bhk') == [2]

    # Turn 2: refine to bhk=3 (REPLACE)
    session_t2 = {**result_t1.session, 'turn_count': 1}
    result_t2 = await run_dry_pipeline(
        message="actually 3bhk",
        scenario="default",
        session=session_t2,
        router=_make_router('property_search', 0.93),
        classifier=_make_classifier('property_search', 'property_search', 'filter_search',
                                    {'bhk': [3]}),
    )
    # BHK is REPLACE — should be [3] not [2, 3]
    final_bhk = result_t2.session.get('active_filters', {}).get('bhk')
    assert final_bhk == [3]


@pytest.mark.asyncio
async def test_amenities_accumulate_across_turns():
    """Amenities use ADD semantics — second mention adds to first."""
    session_t1 = {'session_id': 'multi-2', 'turn_count': 0,
                  'active_filters': {'amenities': ['lift']}, 'turn_history': []}
    result = await run_dry_pipeline(
        message="also gym",
        scenario="default",
        session=session_t1,
        router=_make_router('property_search', 0.95),
        classifier=_make_classifier('property_search', 'property_search', 'filter_search',
                                    {'amenities': ['gym']}),
    )
    amenities = result.session.get('active_filters', {}).get('amenities', [])
    assert 'lift' in amenities
    assert 'gym' in amenities


@pytest.mark.asyncio
async def test_city_preserved_across_turns():
    """City is a universal key — preserved across any pivot."""
    session = {'session_id': 'multi-3', 'turn_count': 1,
               'active_filters': {'city': 'Mumbai', 'bhk': [2]}, 'turn_history': []}
    result = await run_dry_pipeline(
        message="tell me about Bandra",
        scenario="default",
        session=session,
        router=_make_router('locality', 0.93),
        classifier=_make_classifier('locality', 'locality_research', 'locality_overview',
                                    {'localities': ['Bandra']}, pivot=True),
    )
    assert result.session.get('active_filters', {}).get('city') == 'Mumbai'


@pytest.mark.asyncio
async def test_session_id_preserved_across_turns():
    """Session ID must never change between turns."""
    session = {'session_id': 'sticky-session-id', 'turn_count': 0, 'active_filters': {}, 'turn_history': []}
    result = await run_dry_pipeline(
        message="show me flats",
        scenario="default", session=session,
        router=_make_router('property_search', 0.95),
        classifier=_make_classifier('property_search', 'property_search', 'filter_search', {}),
    )
    assert result.session.get('session_id') == 'sticky-session-id'
