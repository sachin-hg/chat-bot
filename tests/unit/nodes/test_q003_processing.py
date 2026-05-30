"""
CHAT-Q-003: Unit tests for processing node behaviours not covered by Q-DRY-006a/b.

Covers:
  filter_apply_node — ADD semantics on first mention (amenities key absent)
  filter_apply_node — REPLACE semantics for bhk
  filter_apply_node — skips merge when clarification_needed is set
  filter_apply_node — parses tagged price strings (price_max, price_min)
  route_node        — requires_auth=True with no auth_token → login template short-circuit
  sanitize_node     — localities always carried on pivot; intent-local keys cleared
"""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from src.pipeline.nodes.processing import filter_apply_node, route_node, sanitize_node
from tests.unit.conftest import make_test_state


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_classification(**overrides) -> dict:
    """Minimal valid classification dict for processing-node tests."""
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


def _make_mock_record(**kwargs) -> MagicMock:
    """Build a MagicMock that looks like an IntentRecord with the given attributes."""
    rec = MagicMock()
    rec.requires_auth = kwargs.get("requires_auth", False)
    rec.tier = kwargs.get("tier", 1)
    rec.model = kwargs.get("model", None)
    return rec


def _make_session(**overrides) -> dict:
    """Minimal valid session dict."""
    base = {
        "session_id":      "sess-test-001",
        "conversation_id": "",
        "user_id":         None,
        "token_id":        "",
        "auth_token":      None,
        "active_filters":  {},
    }
    base.update(overrides)
    return base


# ---------------------------------------------------------------------------
# filter_apply_node — ADD semantics on first mention
# ---------------------------------------------------------------------------

class TestFilterApplyAddSemantics:
    """filter_apply_node uses ADD semantics for amenities (first mention = absent key)."""

    @pytest.mark.asyncio
    async def test_filter_apply_add_semantics_first_mention(self):
        """When 'amenities' key is absent, ADD treats missing as empty list — not replace.

        Result must contain exactly the incoming amenities, starting from empty.
        """
        session = _make_session(active_filters={})  # no 'amenities' key at all
        classification = _make_classification(
            filter_delta={"amenities": ["lift", "gym"]},
        )
        state = make_test_state(classification=classification, session=session)

        result = await filter_apply_node(state)

        active_filters = result["session"]["active_filters"]
        assert active_filters.get("amenities") == ["lift", "gym"], (
            "ADD semantics on first mention must treat missing key as empty list "
            f"and produce ['lift', 'gym'], got {active_filters.get('amenities')!r}"
        )

    @pytest.mark.asyncio
    async def test_filter_apply_add_semantics_accumulates_on_second_mention(self):
        """Subsequent ADD on amenities appends new items without duplicates."""
        session = _make_session(active_filters={"amenities": ["lift"]})
        classification = _make_classification(
            filter_delta={"amenities": ["gym"]},
        )
        state = make_test_state(classification=classification, session=session)

        result = await filter_apply_node(state)

        active_filters = result["session"]["active_filters"]
        assert set(active_filters.get("amenities", [])) == {"lift", "gym"}, (
            "ADD semantics on second mention must accumulate without duplicates, "
            f"got {active_filters.get('amenities')!r}"
        )


# ---------------------------------------------------------------------------
# filter_apply_node — REPLACE semantics for bhk
# ---------------------------------------------------------------------------

class TestFilterApplyReplaceSemantics:
    """filter_apply_node uses REPLACE semantics for bhk."""

    @pytest.mark.asyncio
    async def test_filter_apply_replace_semantics_bhk(self):
        """bhk uses REPLACE — new value overwrites previous completely."""
        session = _make_session(active_filters={"bhk": [2, 3]})
        classification = _make_classification(
            filter_delta={"bhk": [3]},
        )
        state = make_test_state(classification=classification, session=session)

        result = await filter_apply_node(state)

        active_filters = result["session"]["active_filters"]
        assert active_filters.get("bhk") == [3], (
            "REPLACE semantics: bhk=[2,3] overwritten by bhk=[3] must yield [3], "
            f"got {active_filters.get('bhk')!r}"
        )


# ---------------------------------------------------------------------------
# filter_apply_node — skips on clarification_needed
# ---------------------------------------------------------------------------

class TestFilterApplySkipsOnClarification:
    """filter_apply_node must be a no-op when clarification_needed is set."""

    @pytest.mark.asyncio
    async def test_filter_apply_skips_on_clarification(self):
        """When both filter_delta and clarification_needed are set, skip the merge."""
        session = _make_session(active_filters={"city": "Mumbai"})
        classification = _make_classification(
            filter_delta={"bhk": [2]},
            clarification_needed="Are you looking to rent or buy?",
        )
        state = make_test_state(classification=classification, session=session)

        result = await filter_apply_node(state)

        assert result == {}, (
            "filter_apply_node must return {} (no-op) when clarification_needed is set, "
            f"got {result!r}"
        )


# ---------------------------------------------------------------------------
# filter_apply_node — parses tagged price strings
# ---------------------------------------------------------------------------

class TestFilterApplyParsesAmounts:
    """filter_apply_node converts tagged amount strings to INR integers before storing."""

    @pytest.mark.asyncio
    async def test_filter_apply_parses_price_strings(self):
        """filter_delta with '80L' and '1cr' must be stored as integers in active_filters."""
        session = _make_session(active_filters={})
        classification = _make_classification(
            filter_delta={"price_max": "80L", "price_min": "1cr"},
        )
        state = make_test_state(classification=classification, session=session)

        result = await filter_apply_node(state)

        active_filters = result["session"]["active_filters"]
        assert active_filters.get("price_max") == 8_000_000, (
            f"'80L' must be parsed to 8_000_000, got {active_filters.get('price_max')!r}"
        )
        assert active_filters.get("price_min") == 10_000_000, (
            f"'1cr' must be parsed to 10_000_000, got {active_filters.get('price_min')!r}"
        )


# ---------------------------------------------------------------------------
# route_node — requires_auth + no token → login template (short-circuit)
# ---------------------------------------------------------------------------

class TestRouteNodeRequiresAuthNoToken:
    """route_node must short-circuit to login template when auth is needed but absent."""

    @pytest.mark.asyncio
    async def test_route_node_requires_auth_no_token(self):
        """requires_auth=True with no auth_token must return login template, no routing."""
        mock_record = _make_mock_record(requires_auth=True, tier="3a", model=None)

        classification = _make_classification(
            main_intent="portfolio",
            sub_intent="saved_properties",
        )
        session = _make_session(auth_token=None)  # explicitly no auth token
        state = make_test_state(classification=classification, session=session)

        with patch(
            "src.pipeline.nodes.processing.get_intent_record",
            return_value=mock_record,
        ):
            result = await route_node(state)

        assert result["bot_response"]["template_id"] == "login", (
            "requires_auth=True with no auth_token must produce template_id='login', "
            f"got {result['bot_response'].get('template_id')!r}"
        )
        assert "routing" not in result, (
            "Auth short-circuit must NOT set 'routing' key in result; "
            f"got keys: {list(result.keys())}"
        )


# ---------------------------------------------------------------------------
# sanitize_node — localities always carried on pivot
# ---------------------------------------------------------------------------

class TestSanitizeCarriesLocalities:
    """sanitize_node must carry 'localities' across any pivot while clearing intent-local keys."""

    @pytest.mark.asyncio
    async def test_sanitize_carries_localities_on_pivot(self):
        """On pivot, localities must survive; intent-local keys (bhk) must be cleared."""
        session = _make_session(
            active_filters={
                "city":       "Mumbai",
                "localities": ["Bandra"],
                "bhk":        [2],
            },
        )
        classification = _make_classification(
            pivot=True,
            main_intent="locality",
            sub_intent="locality_overview",
        )
        state = make_test_state(classification=classification, session=session)

        result = await sanitize_node(state)

        assert result.get("sanitized") is True, \
            "sanitize_node must set sanitized=True when pivot is True"

        active_filters = result["session"]["active_filters"]

        assert "localities" in active_filters, (
            "'localities' must be carried across any pivot — it was dropped unexpectedly"
        )
        assert active_filters["localities"] == ["Bandra"], (
            f"localities value must be preserved as ['Bandra'], "
            f"got {active_filters['localities']!r}"
        )
        assert "bhk" not in active_filters, (
            "'bhk' is an intent-local key and must be cleared on pivot"
        )
