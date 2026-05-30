"""
CHAT-Q-007: Golden path E2E test #2 — Comparison intent → Sonnet (Tier 3b).

Test flow:
  "compare Andheri and Bandra for 2BHK buy"
  → SLM: domain=comparison, main_intent=comparison, sub_intent=compare_localities
  → Tier 3b (Sonnet model)
  → routing['model'] should be 'sonnet' (or 'claude-sonnet-*')
  → SSE: comparison summary → followup text (COMPLETED)
  → LLM called with Sonnet model

Requirements covered:
  REQ-ROUTE-003b — comparison intent routes to Tier 3b (Sonnet)
  REQ-RESP-018   — last SSE event is always COMPLETED
  REQ-RESP-022   — comparison is text-only (no property_carousel template)
"""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock

from tests.dry_run.runner import run_dry_pipeline


# ---------------------------------------------------------------------------
# Helper factories
# ---------------------------------------------------------------------------

def _make_router(domain, confidence=0.95):
    router = MagicMock()
    router.route = AsyncMock(return_value={'domain': domain, 'confidence': confidence})
    return router


def _make_classifier(domain, main_intent, sub_intent, filter_delta,
                     entities_mentioned=None, clarification_needed=None, pivot=False):
    classifier = MagicMock()
    classifier.classify = AsyncMock(return_value={
        'domain': domain,
        'main_intent': main_intent,
        'sub_intent': sub_intent,
        'filter_delta': filter_delta,
        'entities_mentioned': entities_mentioned or [],
        'clarification_needed': clarification_needed,
        'pivot': pivot,
        'multi_intent': False,
        'confidence': 0.95,
        'reasoning': 'test',
    })
    return classifier


# ---------------------------------------------------------------------------
# Test 1: Comparison intent routes to Sonnet (Tier 3b)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_comparison_routes_to_sonnet():
    """Comparison intent must use Sonnet (Tier 3b), not Haiku."""
    # compare_localities is routed via the 'locality' domain (not a standalone 'comparison' domain)
    mock_classifier = _make_classifier(
        domain='locality', main_intent='comparison', sub_intent='compare_localities',
        filter_delta={}, entities_mentioned=[
            {'name': 'Andheri', 'inferred_type': 'locality'},
            {'name': 'Bandra', 'inferred_type': 'locality'},
        ],
    )
    mock_router = _make_router(domain='locality', confidence=0.94)

    result = await run_dry_pipeline(
        message="compare Andheri and Bandra for 2BHK buy",
        scenario="comparison",
        router=mock_router, classifier=mock_classifier,
    )

    assert result.main_intent == 'comparison'
    assert result.sub_intent == 'compare_localities'
    # Tier 3b — routing model should be 'sonnet'
    routing = result.final_state.get('routing') or {}
    assert routing.get('tier') == '3b' or routing.get('model') in (
        'sonnet', 'claude-sonnet-4-6', 'claude-sonnet-4-5'
    ), (
        f"REQ-ROUTE-003b: compare_localities must route to Tier 3b / Sonnet; "
        f"got tier={routing.get('tier')!r}, model={routing.get('model')!r}"
    )


# ---------------------------------------------------------------------------
# Test 2: Last SSE event is COMPLETED
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_comparison_last_event_is_completed():
    """Comparison turn must end with COMPLETED (not hanging IN_PROGRESS)."""
    mock_classifier = _make_classifier(
        domain='locality', main_intent='comparison', sub_intent='compare_localities',
        filter_delta={},
    )
    mock_router = _make_router(domain='locality', confidence=0.94)

    result = await run_dry_pipeline(
        message="compare Andheri and Bandra",
        scenario="comparison",
        router=mock_router, classifier=mock_classifier,
    )

    chat_events = [e for e in result.sse_events if e.event_type == 'chat_event']
    assert len(chat_events) >= 1, (
        "REQ-RESP-018: at least one chat_event must be emitted for comparison intent"
    )
    assert chat_events[-1].source_message_state == 'COMPLETED', (
        f"REQ-RESP-018: last chat_event must be COMPLETED, "
        f"got {chat_events[-1].source_message_state!r}"
    )


# ---------------------------------------------------------------------------
# Test 3: No property_carousel emitted for comparison intent
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_comparison_no_property_carousel():
    """Comparison intent is text-only — no property_carousel template emitted."""
    mock_classifier = _make_classifier(
        domain='locality', main_intent='comparison', sub_intent='compare_localities',
        filter_delta={},
    )
    mock_router = _make_router(domain='locality', confidence=0.94)

    result = await run_dry_pipeline(
        message="compare Andheri and Bandra",
        scenario="comparison",
        router=mock_router, classifier=mock_classifier,
    )

    carousel_events = [e for e in result.sse_events if e.template_id == 'property_carousel']
    assert len(carousel_events) == 0, (
        f"REQ-RESP-022: comparison is text-only; "
        f"property_carousel must not be emitted, found {len(carousel_events)} event(s)"
    )
