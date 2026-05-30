"""
CHAT-Q-DRY-006b: Unit tests for processing node requirements.

Covers:
  REQ-PROC-014  resolve_entities Sprint 1 stub returns confidence=0.0 for all entities
  REQ-PROC-017  route Tier 0 (out_of_scope) returns bot_response
  REQ-PROC-018  route Tier 1 contact_seller — template only, no CRM call
  REQ-PROC-019  route Tier 2 returns bot_response (no LLM)
  REQ-PROC-021  route Tier 3b → Sonnet routing metadata, no bot_response
  REQ-PROC-022  recent_searches does not require auth (requires_auth=False)
  REQ-PROC-023  saved_properties requires auth (requires_auth=True)
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from tests.unit.conftest import make_test_state
from src.pipeline.nodes.processing import resolve_entities_node, route_node
from src.registries.intent_registry import get_intent_record


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_classification(**overrides):
    """Minimal valid classification dict."""
    base = {
        "main_intent":          "property_search",
        "sub_intent":           "filter_search",
        "multi_intent":         False,
        "pivot":                False,
        "clarification_needed": None,
        "entities_mentioned":   [],
        "filter_delta":         {},
        "reasoning":            "test classification",
    }
    base.update(overrides)
    return base


def _make_mock_record(**kwargs):
    """Build a MagicMock that looks like an IntentRecord with the given attributes."""
    rec = MagicMock()
    rec.requires_auth = kwargs.get("requires_auth", False)
    rec.tier = kwargs.get("tier", 1)
    rec.model = kwargs.get("model", None)
    return rec


# ---------------------------------------------------------------------------
# REQ-PROC-014: resolve_entities Sprint 1 stub returns confidence=0.0
# ---------------------------------------------------------------------------

class TestResolveEntitiesNode:
    """Tests for resolve_entities_node."""

    @pytest.mark.asyncio
    async def test_resolve_entities_stub_returns_zero_confidence(self):
        """REQ-PROC-014: Sprint 1 stub returns confidence=0.0 for all entities.

        # Sprint 1 stub — real context boost (+0.15) tested in CHAT-P-017 integration tests
        """
        cls = _make_classification(
            main_intent="property_search",
            sub_intent="filter_search",
            entities_mentioned=[{"name": "Powai", "type": "locality"}],
        )
        state = make_test_state(
            domain="property_search",
            classification=cls,
        )

        result = await resolve_entities_node(state)

        resolved = result.get("resolved_entities", {})
        assert "Powai" in resolved, \
            "resolved_entities must contain an entry for 'Powai'"
        assert resolved["Powai"]["confidence"] == 0.0, \
            f"Sprint 1 stub must return confidence=0.0, got {resolved['Powai']['confidence']}"


# ---------------------------------------------------------------------------
# REQ-PROC-017: route Tier 0 (out_of_scope) returns bot_response
# ---------------------------------------------------------------------------

class TestRouteNodeTier0:
    """REQ-PROC-017 — Tier 0 out_of_scope must return a bot_response."""

    @pytest.mark.asyncio
    async def test_route_node_tier0_out_of_scope(self):
        """REQ-PROC-017: out_of_scope intent routes to tier=0 with bot_response."""
        cls = _make_classification(
            main_intent="out_of_scope",
            sub_intent="out_of_scope_query",
        )
        state = make_test_state(
            domain="out_of_scope",
            classification=cls,
        )

        result = await route_node(state)

        assert "bot_response" in result, \
            "Tier 0 out_of_scope must produce a bot_response"
        assert result["routing"]["tier"] == 0, \
            f"Tier 0 routing must set tier=0, got {result['routing']['tier']}"


# ---------------------------------------------------------------------------
# REQ-PROC-018: route Tier 1 contact_seller — template only, no CRM call
# ---------------------------------------------------------------------------

class TestRouteNodeTier1:
    """REQ-PROC-018 — Tier 1 contact_seller must return a template, not a CRM call."""

    @pytest.mark.asyncio
    async def test_route_node_tier1_contact_seller(self):
        """REQ-PROC-018: contact_seller Tier 1 produces template_id='contact_seller'."""
        mock_record = _make_mock_record(tier=1, requires_auth=False, model=None)

        cls = _make_classification(
            main_intent="property_detail",
            sub_intent="contact_seller",
        )
        state = make_test_state(
            domain="property_detail",
            classification=cls,
        )

        with patch(
            "src.pipeline.nodes.processing.get_intent_record",
            return_value=mock_record,
        ):
            result = await route_node(state)

        assert result["bot_response"]["template_id"] == "contact_seller", (
            f"Tier 1 contact_seller must return template_id='contact_seller', "
            f"got {result['bot_response'].get('template_id')!r}"
        )
        assert result["routing"]["tier"] == 1, \
            f"Tier 1 routing must set tier=1, got {result['routing']['tier']}"


# ---------------------------------------------------------------------------
# REQ-PROC-019: route Tier 2 returns bot_response (no LLM)
# ---------------------------------------------------------------------------

class TestRouteNodeTier2:
    """REQ-PROC-019 — Tier 2 must produce bot_response without calling an LLM."""

    @pytest.mark.asyncio
    async def test_route_node_tier2_no_llm(self):
        """REQ-PROC-019: Tier 2 intent returns both bot_response and routing."""
        mock_record = _make_mock_record(tier=2, requires_auth=False, model=None)

        cls = _make_classification(
            main_intent="portfolio",
            sub_intent="recent_searches",
        )
        state = make_test_state(
            domain="portfolio",
            classification=cls,
        )

        with patch(
            "src.pipeline.nodes.processing.get_intent_record",
            return_value=mock_record,
        ):
            result = await route_node(state)

        assert "bot_response" in result, \
            "Tier 2 routing must produce bot_response"
        assert "routing" in result, \
            "Tier 2 routing must include routing metadata"
        assert result["routing"]["tier"] == 2, \
            f"Tier 2 routing must set tier=2, got {result['routing']['tier']}"


# ---------------------------------------------------------------------------
# REQ-PROC-021: route Tier 3b → Sonnet
# ---------------------------------------------------------------------------

class TestRouteNodeTier3b:
    """REQ-PROC-021 — Tier 3b must return routing metadata for Sonnet; no bot_response."""

    @pytest.mark.asyncio
    async def test_route_node_tier3b_uses_sonnet(self):
        """REQ-PROC-021: Tier 3b routing returns model=claude-sonnet-4-6; no bot_response."""
        mock_record = _make_mock_record(
            tier="3b",
            requires_auth=False,
            model="claude-sonnet-4-6",
        )

        cls = _make_classification(
            main_intent="comparison",
            sub_intent="compare_localities",
        )
        state = make_test_state(
            domain="locality",
            classification=cls,
        )

        with patch(
            "src.pipeline.nodes.processing.get_intent_record",
            return_value=mock_record,
        ):
            result = await route_node(state)

        assert result == {"routing": {"tier": "3b", "model": "claude-sonnet-4-6"}}, (
            f"Tier 3b must return only routing metadata, got {result!r}"
        )
        assert "bot_response" not in result, \
            "Tier 3b must NOT produce a bot_response — LLM node handles the turn"


# ---------------------------------------------------------------------------
# REQ-PROC-022: recent_searches does NOT require auth
# ---------------------------------------------------------------------------

class TestRegistryAuthFlags:
    """Registry data correctness tests — no mocking, hit the real INTENT_REGISTRY."""

    def test_recent_searches_does_not_require_auth(self):
        """REQ-PROC-022: portfolio/recent_searches must have requires_auth=False."""
        record = get_intent_record("portfolio", "recent_searches")
        assert record is not None, \
            "portfolio/recent_searches must exist in INTENT_REGISTRY"
        assert record.requires_auth is False, (
            "recent_searches works with token_id (device identifier) and must NOT "
            "require login — requires_auth must be False (REQ-PROC-022)"
        )

    # -----------------------------------------------------------------------
    # REQ-PROC-023: saved_properties requires auth
    # -----------------------------------------------------------------------

    def test_saved_properties_requires_auth(self):
        """REQ-PROC-023: portfolio/saved_properties must have requires_auth=True."""
        record = get_intent_record("portfolio", "saved_properties")
        assert record is not None, \
            "portfolio/saved_properties must exist in INTENT_REGISTRY"
        assert record.requires_auth is True, (
            "saved_properties is personal user data and must require login — "
            "requires_auth must be True (REQ-PROC-023)"
        )
