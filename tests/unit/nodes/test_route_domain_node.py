"""
CHAT-Q-DRY-005a: Unit tests for route_domain_node.

Covers:
  REQ-CLS-005  Low-confidence result (< 0.65) coerced to out_of_scope
  REQ-CLS-006  Timeout handling on domain router call
"""
from __future__ import annotations

import asyncio
from typing import Any, Dict
from unittest.mock import AsyncMock, MagicMock

import pytest

from tests.unit.conftest import make_test_state

# ---------------------------------------------------------------------------
# Import route_domain_node
# ---------------------------------------------------------------------------

from src.pipeline.nodes.classification import route_domain_node  # type: ignore


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def make_state(
    normalized_message: str = "show me 2bhk in mumbai",
    last_domain: str | None = None,
    last_intent: str | None = None,
    **overrides: Any,
) -> Dict[str, Any]:
    """Minimal BotState dict for route_domain_node tests."""
    state = make_test_state(
        raw_message=normalized_message,
        normalized_message=normalized_message,
    )
    state["session"]["last_domain"] = last_domain
    state["session"]["last_intent"] = last_intent
    state.update(overrides)
    return state


def _make_router(domain: str = "property_search", confidence: float = 0.90) -> MagicMock:
    """Return a mock router whose .route() coroutine returns the given values."""
    router = MagicMock()
    router.route = AsyncMock(return_value={"domain": domain, "confidence": confidence})
    return router


# ---------------------------------------------------------------------------
# REQ-CLS-005: Low-confidence routing
# ---------------------------------------------------------------------------

class TestRouteDomainLowConfidence:
    """REQ-CLS-005 — confidence < 0.65 must be coerced to out_of_scope."""

    @pytest.mark.asyncio
    async def test_route_domain_out_of_scope_on_low_confidence(self):
        """Router returns confidence=0.60 for property_search → domain coerced to out_of_scope."""
        router = _make_router(domain="property_search", confidence=0.60)
        state = make_state()

        result = await route_domain_node(state, router)

        assert result["domain"] == "out_of_scope", (
            f"Expected 'out_of_scope' for confidence=0.60, got {result['domain']!r}"
        )

    @pytest.mark.asyncio
    async def test_route_domain_exact_threshold_is_out_of_scope(self):
        """confidence=0.64 (just below 0.65) must still be coerced to out_of_scope."""
        router = _make_router(domain="locality", confidence=0.64)
        state = make_state()

        result = await route_domain_node(state, router)

        assert result["domain"] == "out_of_scope", (
            f"confidence=0.64 must produce out_of_scope, got {result['domain']!r}"
        )

    @pytest.mark.asyncio
    async def test_route_domain_at_threshold_passes_through(self):
        """confidence=0.65 (meets threshold) must NOT be coerced to out_of_scope."""
        router = _make_router(domain="property_search", confidence=0.65)
        state = make_state()

        result = await route_domain_node(state, router)

        assert result["domain"] == "property_search", (
            f"confidence=0.65 must pass through as-is, got {result['domain']!r}"
        )

    @pytest.mark.asyncio
    async def test_route_domain_high_confidence_passes_through(self):
        """High-confidence result must be returned unchanged."""
        router = _make_router(domain="locality", confidence=0.92)
        state = make_state()

        result = await route_domain_node(state, router)

        assert result["domain"] == "locality"

    @pytest.mark.asyncio
    async def test_route_domain_low_confidence_out_of_scope_not_double_coerced(self):
        """If router already returns out_of_scope with low confidence, domain stays out_of_scope.

        The coercion guard in route_domain_node is:
            if confidence < 0.65 and domain != 'out_of_scope':
        so a router that returns out_of_scope at low confidence must not be
        re-coerced (it's already correct).
        """
        router = _make_router(domain="out_of_scope", confidence=0.10)
        state = make_state()

        result = await route_domain_node(state, router)

        assert result["domain"] == "out_of_scope"

    @pytest.mark.asyncio
    async def test_route_domain_zero_confidence_coerced(self):
        """confidence=0.0 must be treated as low-confidence and coerced."""
        router = _make_router(domain="portfolio", confidence=0.0)
        state = make_state()

        result = await route_domain_node(state, router)

        assert result["domain"] == "out_of_scope"


# ---------------------------------------------------------------------------
# REQ-CLS-006: Timeout behaviour
# ---------------------------------------------------------------------------

class TestRouteDomainTimeout:
    """REQ-CLS-006 — asyncio.TimeoutError from the router adapter falls back gracefully."""

    @pytest.mark.asyncio
    async def test_route_domain_falls_back_to_last_domain_on_timeout(self):
        """REQ-CLS-006 — timeout falls back to last_domain when available."""
        router = MagicMock()
        router.route = AsyncMock(side_effect=asyncio.TimeoutError())
        state = make_state(last_domain="locality")

        result = await route_domain_node(state, router)

        assert result["domain"] == "locality", (
            f"Expected fallback to last_domain 'locality' on timeout, got {result['domain']!r}"
        )
        assert result.get("classification", {}).get("timeout_fallback") is True

    @pytest.mark.asyncio
    async def test_route_domain_falls_back_to_out_of_scope_when_no_last_domain(self):
        """REQ-CLS-006 — timeout falls back to 'out_of_scope' when last_domain is None."""
        router = MagicMock()
        router.route = AsyncMock(side_effect=asyncio.TimeoutError())
        state = make_state(last_domain=None)

        result = await route_domain_node(state, router)

        assert result["domain"] == "out_of_scope", (
            f"Expected fallback to 'out_of_scope' on timeout with no last_domain, got {result['domain']!r}"
        )
        assert result.get("classification", {}).get("timeout_fallback") is True


# ---------------------------------------------------------------------------
# Ancillary: router is called with correct payload
# ---------------------------------------------------------------------------

class TestRouteDomainRouterPayload:
    """Verify that route_domain_node passes the correct dict to router.route()."""

    @pytest.mark.asyncio
    async def test_router_called_with_normalized_message(self):
        """router.route() must receive the normalized_message from state."""
        router = _make_router(domain="property_search", confidence=0.80)
        state = make_state(normalized_message="2bhk in bandra")

        await route_domain_node(state, router)

        router.route.assert_awaited_once()
        payload = router.route.call_args[0][0]
        assert payload["message"] == "2bhk in bandra"

    @pytest.mark.asyncio
    async def test_router_called_with_previous_domain(self):
        """router.route() must forward last_domain from session as previous_domain."""
        router = _make_router(domain="property_search", confidence=0.80)
        state = make_state(last_domain="locality")

        await route_domain_node(state, router)

        payload = router.route.call_args[0][0]
        assert payload["previous_domain"] == "locality"

    @pytest.mark.asyncio
    async def test_router_called_with_last_intent(self):
        """router.route() must forward last_intent from session."""
        router = _make_router(domain="property_search", confidence=0.80)
        state = make_state(last_intent="filter_search")

        await route_domain_node(state, router)

        payload = router.route.call_args[0][0]
        assert payload["last_intent"] == "filter_search"

    @pytest.mark.asyncio
    async def test_router_called_with_none_previous_domain_when_absent(self):
        """When session has no last_domain, previous_domain in payload must be None."""
        router = _make_router(domain="property_search", confidence=0.80)
        state = make_state(last_domain=None)

        await route_domain_node(state, router)

        payload = router.route.call_args[0][0]
        assert payload["previous_domain"] is None

    @pytest.mark.asyncio
    async def test_result_dict_contains_domain_key(self):
        """Return value must be a dict with a 'domain' key."""
        router = _make_router(domain="project_research", confidence=0.85)
        state = make_state()

        result = await route_domain_node(state, router)

        assert isinstance(result, dict)
        assert "domain" in result
