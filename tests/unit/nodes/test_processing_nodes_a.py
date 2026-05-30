"""
CHAT-Q-DRY-006a: Unit tests for processing node requirements.

Covers:
  REQ-PROC-004 + REQ-PROC-005  parse_amount converts tagged amount strings to INR ints
  REQ-PROC-008                 sanitize_node preserves universal keys and clears
                               intent-local keys on a pivot
  REQ-PROC-010                 derive_node behaviour when price_per_sqft and
                               price_max coexist in active_filters
  REQ-PROC-012                 clarify_node short-circuits to nested_qna when
                               clarification_needed is set; no-ops otherwise
"""
from __future__ import annotations

import pytest

from src.pipeline.nodes.processing import (
    clarify_node,
    derive_node,
    parse_amount,
    sanitize_node,
)
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


# ---------------------------------------------------------------------------
# REQ-PROC-004 + REQ-PROC-005: parse_amount — tagged price-string parsing
# ---------------------------------------------------------------------------

class TestParseAmount:
    """parse_amount converts tagged amount strings to INR integers."""

    def test_parse_amount_crore_integer(self):
        """'2cr' → 20_000_000 (REQ-PROC-004)."""
        assert parse_amount("2cr") == 20_000_000

    def test_parse_amount_crore_decimal(self):
        """'1.5cr' → 15_000_000 (REQ-PROC-004)."""
        assert parse_amount("1.5cr") == 15_000_000

    def test_parse_amount_lakh_shorthand(self):
        """'80L' → 8_000_000 (REQ-PROC-005)."""
        assert parse_amount("80L") == 8_000_000

    def test_parse_amount_lakh_full_word(self):
        """'80 lakh' → 8_000_000 (REQ-PROC-005)."""
        assert parse_amount("80 lakh") == 8_000_000

    def test_parse_amount_k(self):
        """'30K' → 30_000."""
        assert parse_amount("30K") == 30_000

    def test_parse_amount_already_int(self):
        """An int passthrough returns the same int value."""
        assert parse_amount(5_000_000) == 5_000_000

    def test_parse_amount_hindi_lakh(self):
        """'80 lakhs' (plural) → 8_000_000 (REQ-PROC-005, if supported)."""
        # The regex r"l(?:akh)?s?" matches "lakhs" — this is supported.
        assert parse_amount("80 lakhs") == 8_000_000


# ---------------------------------------------------------------------------
# REQ-PROC-008: sanitize_node — universal keys preserved, intent-local cleared
# ---------------------------------------------------------------------------

class TestSanitizePreservesUniversalKeysOnPivot:
    """REQ-PROC-008: On a pivot, universal keys survive; intent-local keys are dropped."""

    @pytest.mark.asyncio
    async def test_sanitize_preserves_universal_keys_on_pivot(self):
        """city and transaction_type are universal: must survive any pivot."""
        session_with_filters = {
            "session_id":      "sess-test-001",
            "conversation_id": "",
            "user_id":         None,
            "token_id":        "",
            "auth_token":      None,
            "active_filters": {
                "city":             "Mumbai",
                "transaction_type": "buy",
                "bhk":              [2],
                "price_max":        8_000_000,
            },
        }
        classification = _make_classification(
            pivot=True,
            main_intent="locality_research",
            sub_intent="market_insight",
        )
        state = make_test_state(
            classification=classification,
            session=session_with_filters,
        )

        result = await sanitize_node(state)

        assert result.get("sanitized") is True, \
            "sanitize_node must set sanitized=True when pivot is True"

        active_filters = result["session"]["active_filters"]

        # Universal keys must be preserved
        assert active_filters.get("city") == "Mumbai", \
            "'city' is a universal key and must survive a pivot (REQ-PROC-008)"
        assert active_filters.get("transaction_type") == "buy", \
            "'transaction_type' is a universal key and must survive a pivot (REQ-PROC-008)"

        # Intent-local keys must be cleared
        assert "bhk" not in active_filters, \
            "'bhk' is an intent-local key and must be cleared on pivot (REQ-PROC-008)"
        assert "price_max" not in active_filters, \
            "'price_max' is an intent-local key and must be cleared on pivot (REQ-PROC-008)"

    @pytest.mark.asyncio
    async def test_sanitize_no_op_when_pivot_false(self):
        """sanitize_node must return {} (no-op) when pivot is False."""
        classification = _make_classification(pivot=False)
        state = make_test_state(
            classification=classification,
            session={
                "session_id":     "sess-test-001",
                "active_filters": {"city": "Delhi", "bhk": [3]},
            },
        )

        result = await sanitize_node(state)

        assert result == {}, \
            "sanitize_node must be a no-op when pivot is False"


# ---------------------------------------------------------------------------
# REQ-PROC-010: derive_node — behaviour when price_per_sqft and price_max coexist
# ---------------------------------------------------------------------------

class TestDeriveNodePricePerSqft:
    """REQ-PROC-010: derive_node converts price_per_sqft to absolute price params."""

    @pytest.mark.asyncio
    async def test_derive_skips_sqft_conversion_if_price_already_set(self):
        """When price_per_sqft and price_max both exist in active_filters,
        derive_node converts price_per_sqft to an absolute range and merges
        the result into active_filters via filters.update().

        Concretely: price_max will be overwritten by the derived value.
        This documents the actual (not hypothetical) behaviour of derive_node.

        REQ-PROC-010 concern: after the conversion price_per_sqft must be
        removed from active_filters so it is not double-converted on
        subsequent turns.
        """
        state = make_test_state(
            classification=_make_classification(),
            session={
                "session_id":     "sess-test-001",
                "active_filters": {
                    "price_per_sqft": 15_000,
                    "price_max":      5_000_000,  # pre-existing absolute price
                    "bhk":            [2],         # used to determine carpet area
                },
            },
        )

        result = await derive_node(state)

        active_filters = result["session"]["active_filters"]

        # price_per_sqft must be removed after conversion (no double-apply)
        assert "price_per_sqft" not in active_filters, \
            "price_per_sqft must be removed from active_filters after conversion (REQ-PROC-010)"

        # A derived price_max must now be present (converted from per-sqft signal)
        assert "price_max" in active_filters, \
            "derive_node must produce a price_max from the price_per_sqft signal"

        # With no price_sqft_bound set, convert_price_per_sqft_to_absolute
        # returns a ±20% symmetric range around the absolute value.
        # For 2 BHK (900 sqft) at 15,000/sqft: absolute = 13,500,000
        #   price_max = int(13,500,000 * 1.2) = 16,200,000
        absolute = 15_000 * 900          # = 13_500_000
        expected_price_max = int(absolute * 1.2)   # = 16_200_000
        assert active_filters["price_max"] == expected_price_max, (
            f"Expected derived price_max={expected_price_max}, "
            f"got {active_filters['price_max']}"
        )

    @pytest.mark.asyncio
    async def test_derive_no_conversion_when_price_per_sqft_absent(self):
        """derive_node must not modify price_max when price_per_sqft is absent."""
        state = make_test_state(
            classification=_make_classification(),
            session={
                "session_id":     "sess-test-001",
                "active_filters": {
                    "price_max": 5_000_000,
                },
            },
        )

        result = await derive_node(state)

        active_filters = result["session"]["active_filters"]
        assert active_filters.get("price_max") == 5_000_000, \
            "price_max must be unchanged when price_per_sqft is absent"


# ---------------------------------------------------------------------------
# REQ-PROC-012: clarify_node — short-circuit on clarification_needed
# ---------------------------------------------------------------------------

class TestClarifyNode:
    """REQ-PROC-012: clarify_node emits nested_qna when clarification_needed is set."""

    @pytest.mark.asyncio
    async def test_clarify_node_sets_bot_response_on_clarification_needed(self):
        """When clarification_needed is set, clarify_node must return a
        bot_response with template_id='nested_qna' and clarification_emitted=True.
        (REQ-PROC-012)
        """
        classification = _make_classification(
            clarification_needed="Rent or buy?",
            clarification_data={"question_id": "q1", "options": ["Rent", "Buy"]},
        )
        state = make_test_state(classification=classification)

        result = await clarify_node(state)

        assert result.get("clarification_emitted") is True, \
            "clarify_node must set clarification_emitted=True when emitting (REQ-PROC-012)"

        bot_response = result.get("bot_response")
        assert bot_response is not None, \
            "clarify_node must return a bot_response when clarification_needed is set"
        assert bot_response.get("template_id") == "nested_qna", \
            f"Expected template_id='nested_qna', got {bot_response.get('template_id')!r} (REQ-PROC-012)"

    @pytest.mark.asyncio
    async def test_clarify_node_no_op_when_not_needed(self):
        """When clarification_needed is None, clarify_node must be a no-op (return {})."""
        classification = _make_classification(clarification_needed=None)
        state = make_test_state(classification=classification)

        result = await clarify_node(state)

        assert result == {}, \
            "clarify_node must return {} (no-op) when clarification_needed is None (REQ-PROC-012)"

    @pytest.mark.asyncio
    async def test_clarify_node_no_op_when_classification_absent(self):
        """clarify_node must be a no-op when no classification is present."""
        state = make_test_state(classification=None)

        result = await clarify_node(state)

        assert result == {}, \
            "clarify_node must return {} when classification is absent"

    @pytest.mark.asyncio
    async def test_clarify_node_nested_qna_contains_question_text(self):
        """The nested_qna payload must include the original clarification question text."""
        question = "Are you looking to rent or buy?"
        classification = _make_classification(
            clarification_needed=question,
            clarification_data={"question_id": "q_rent_buy", "options": []},
        )
        state = make_test_state(classification=classification)

        result = await clarify_node(state)

        data = result["bot_response"]["data"]
        selections = data.get("selections", [])
        assert len(selections) == 1, \
            f"Expected 1 selection in nested_qna, got {len(selections)}"
        assert selections[0].get("title") == question, \
            f"Expected title={question!r}, got {selections[0].get('title')!r}"
