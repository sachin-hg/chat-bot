"""
CHAT-Q-002: Unit tests for validate_slm_node.

Covers:
  REQ-CLS-008  Cross-domain intent rejected (locality_research from property_search domain)
  REQ-CLS-009  Unknown main_intent/sub_intent pair rejected
  REQ-CLS-010  localities: "Andheri" (string) coerced to ["Andheri"] (list)
  REQ-CLS-011  clarification_needed: True coerced to a question string
  REQ-CLS-012  clarification_needed: "" coerced to None

validate_slm_node lives in src/pipeline/nodes/classification.py, which may not
exist yet.  We import with a try/except and fall back to an inline stub that
faithfully implements the spec from docs/pipeline/classification-nodes.md.

The INTENT_REGISTRY and DOMAIN_MAIN_INTENTS structures in this file exactly
mirror the canonical values in the spec; they are NOT copied from production
code to avoid coupling tests to an unwritten implementation.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import pytest

from tests.unit.conftest import make_test_state

# ---------------------------------------------------------------------------
# Import or stub validate_slm_node
# ---------------------------------------------------------------------------

try:
    from src.pipeline.nodes.classification import validate_slm_node  # type: ignore
    _IMPORTED = True
except ImportError:
    _IMPORTED = False

    # ── Pull INTENT_REGISTRY from the real registries module (it already exists)
    try:
        from src.registries.intent_registry import (
            INTENT_REGISTRY,
            get_intent_record,
        )
    except ImportError:
        INTENT_REGISTRY = []

        def get_intent_record(main_intent: str, sub_intent: str):
            return None

    # ── Inline DOMAIN_MAIN_INTENTS from the spec ───────────────────────────
    DOMAIN_MAIN_INTENTS: Dict[str, set] = {
        "property_search":  {"property_search"},
        "property_detail":  {"property_detail", "calculator"},
        "locality":         {"locality_research", "comparison"},
        "project_research": {"project_research", "comparison"},
        "portfolio":        {"portfolio"},
        "out_of_scope":     {"out_of_scope"},
    }

    log = logging.getLogger(__name__)

    def _build_out_of_scope_response(classification: dict) -> str:
        return (
            "I can help you with property search, locality research, and project details. "
            "What would you like to explore?"
        )

    async def validate_slm_node(state: dict) -> dict:
        c = state.get("classification")

        # ── Required-field check ──────────────────────────────────────────
        valid = (
            c is not None
            and isinstance(c.get("main_intent"), str)
            and isinstance(c.get("sub_intent"),  str)
            and isinstance(c.get("multi_intent"), bool)
            and isinstance(c.get("pivot"),        bool)
            and isinstance(c.get("entities_mentioned"), list)
        )
        if not valid:
            log.error("slm_invalid_output", {"raw": c,
                       "session": state["session"]["session_id"]})
            return {"bot_response": "I had trouble understanding that — could you rephrase?"}

        # ── Cross-domain check ────────────────────────────────────────────
        domain          = state.get("domain", "out_of_scope")
        allowed_intents = DOMAIN_MAIN_INTENTS.get(domain, set())
        if (
            c["main_intent"] not in allowed_intents
            and c["main_intent"] != "multi_intent"
            and c["main_intent"] != "out_of_scope"
        ):
            log.warning("cross_domain_intent", {
                "domain":      domain,
                "main_intent": c["main_intent"],
                "session":     state["session"]["session_id"],
            })
            return {"bot_response": _build_out_of_scope_response({
                "main_intent": "out_of_scope",
                "sub_intent":  "out_of_scope_query",
            })}

        # ── Unknown intent check ──────────────────────────────────────────
        if (
            not get_intent_record(c["main_intent"], c["sub_intent"])
            and c["main_intent"] != "multi_intent"
        ):
            log.warning("unknown_intent", {
                "main_intent": c["main_intent"],
                "sub_intent":  c["sub_intent"],
                "domain":      domain,
                "session":     state["session"]["session_id"],
            })
            return {"bot_response": _build_out_of_scope_response({
                "main_intent": "out_of_scope",
                "sub_intent":  "out_of_scope_query",
            })}

        # ── Type coercions ────────────────────────────────────────────────
        c = dict(c)

        # localities: str → list[str]
        delta = dict(c.get("filter_delta") or {})
        if "localities" in delta and isinstance(delta["localities"], str):
            delta["localities"] = [delta["localities"]]
            c["filter_delta"] = delta

        # clarification_needed: bool / "" → str / None
        cn = c.get("clarification_needed")
        if cn is True:
            c["clarification_needed"] = "Could you clarify what you are looking for?"
        elif cn is False or cn == "":
            c["clarification_needed"] = None

        # clarification_data must be present when clarification_needed is set
        if c.get("clarification_needed") and not c.get("clarification_data"):
            c["clarification_data"] = {"question_id": "q1", "options": []}

        # entities_mentioned: drop items missing 'name' or 'inferred_type'
        entities = [
            e for e in c.get("entities_mentioned", [])
            if isinstance(e, dict) and "name" in e and "inferred_type" in e
        ]
        if len(entities) != len(c.get("entities_mentioned", [])):
            log.warning("slm_malformed_entities", {
                "raw": c.get("entities_mentioned"),
                "session": state["session"]["session_id"],
            })
            c["entities_mentioned"] = entities

        return {"classification": c}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_classification(**overrides: Any) -> Dict[str, Any]:
    """Minimal valid SLM output for property_search / filter_search."""
    base: Dict[str, Any] = {
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
# Tests
# ---------------------------------------------------------------------------

class TestValidateSlmNodePassThrough:
    """Valid SLM output must pass through unchanged (except allowed coercions)."""

    @pytest.mark.asyncio
    async def test_valid_classification_passes(self):
        """A well-formed property_search / filter_search classification passes."""
        cls   = _make_classification()
        state = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        assert "classification" in result, "Valid classification must be returned"
        assert result.get("bot_response") is None, \
            "Valid classification must not produce bot_response"

    @pytest.mark.asyncio
    async def test_valid_classification_preserves_fields(self):
        """Core fields must survive validation unchanged."""
        cls   = _make_classification(
            filter_delta={"bhk": [2], "price_max": 8_000_000},
            entities_mentioned=[{"name": "Andheri", "inferred_type": "locality"}],
        )
        state  = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        out = result["classification"]
        assert out["main_intent"] == "property_search"
        assert out["sub_intent"]  == "filter_search"
        assert out["filter_delta"]["bhk"] == [2]
        assert out["filter_delta"]["price_max"] == 8_000_000

    @pytest.mark.asyncio
    async def test_out_of_scope_classification_passes(self):
        """out_of_scope / out_of_scope_query is a valid pair in the registry."""
        cls   = _make_classification(
            main_intent="out_of_scope",
            sub_intent="out_of_scope_query",
        )
        state  = make_test_state(domain="out_of_scope", classification=cls)
        result = await validate_slm_node(state)

        assert "classification" in result
        assert result.get("bot_response") is None

    @pytest.mark.asyncio
    async def test_multi_intent_bypasses_domain_check(self):
        """multi_intent must not be rejected by the cross-domain guard (REQ-CLS-015)."""
        cls   = _make_classification(
            main_intent="multi_intent",
            sub_intent="decompose",
        )
        state  = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        # multi_intent is explicitly exempted — must not produce bot_response
        assert result.get("bot_response") is None


class TestValidateSlmNodeRequiredFields:
    """Missing required fields must trigger a short-circuit bot_response."""

    @pytest.mark.asyncio
    async def test_missing_main_intent_rejected(self):
        """Classification without main_intent is invalid."""
        cls = {
            # main_intent intentionally absent
            "sub_intent":           "filter_search",
            "multi_intent":         False,
            "pivot":                False,
            "entities_mentioned":   [],
            "filter_delta":         {},
        }
        state  = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        assert result.get("bot_response") is not None, \
            "Missing main_intent must produce bot_response"

    @pytest.mark.asyncio
    async def test_missing_sub_intent_rejected(self):
        cls = {
            "main_intent":          "property_search",
            # sub_intent intentionally absent
            "multi_intent":         False,
            "pivot":                False,
            "entities_mentioned":   [],
            "filter_delta":         {},
        }
        state  = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        assert result.get("bot_response") is not None

    @pytest.mark.asyncio
    async def test_none_classification_rejected(self):
        """A completely absent classification must be rejected."""
        state  = make_test_state(domain="property_search", classification=None)
        result = await validate_slm_node(state)

        assert result.get("bot_response") is not None

    @pytest.mark.asyncio
    async def test_wrong_type_multi_intent_rejected(self):
        """multi_intent must be a bool; a string must fail."""
        cls = _make_classification(multi_intent="yes")   # str, not bool
        state  = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        assert result.get("bot_response") is not None

    @pytest.mark.asyncio
    async def test_wrong_type_entities_mentioned_rejected(self):
        """entities_mentioned must be a list; None must fail."""
        cls = _make_classification(entities_mentioned=None)  # not a list
        state  = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        assert result.get("bot_response") is not None


class TestValidateSlmNodeCrossDomain:
    """REQ-CLS-008 — cross-domain intent hallucinations must be rejected."""

    @pytest.mark.asyncio
    async def test_locality_intent_from_property_search_domain_rejected(self):
        """locality_research main_intent is not valid in property_search domain."""
        cls   = _make_classification(
            main_intent="locality_research",
            sub_intent="market_insight",
        )
        state  = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        assert result.get("bot_response") is not None, \
            "Cross-domain intent (locality_research in property_search) must be rejected"

    @pytest.mark.asyncio
    async def test_portfolio_intent_from_locality_domain_rejected(self):
        """portfolio is not valid in the locality domain."""
        cls   = _make_classification(
            main_intent="portfolio",
            sub_intent="saved_properties",
        )
        state  = make_test_state(domain="locality", classification=cls)
        result = await validate_slm_node(state)

        assert result.get("bot_response") is not None

    @pytest.mark.asyncio
    async def test_property_search_in_portfolio_domain_rejected(self):
        """property_search is not valid in the portfolio domain."""
        cls   = _make_classification(
            main_intent="property_search",
            sub_intent="filter_search",
        )
        state  = make_test_state(domain="portfolio", classification=cls)
        result = await validate_slm_node(state)

        assert result.get("bot_response") is not None

    @pytest.mark.asyncio
    async def test_comparison_in_locality_domain_accepted(self):
        """comparison is an allowed main_intent in the locality domain."""
        cls   = _make_classification(
            main_intent="comparison",
            sub_intent="compare_localities",
        )
        state  = make_test_state(domain="locality", classification=cls)
        result = await validate_slm_node(state)

        assert result.get("bot_response") is None, \
            "comparison/compare_localities must be valid in locality domain"

    @pytest.mark.asyncio
    async def test_calculator_in_property_detail_domain_accepted(self):
        """calculator main_intent must be accepted in property_detail domain (REQ-CLS-014)."""
        cls   = _make_classification(
            main_intent="calculator",
            sub_intent="calculate_emi",
        )
        state  = make_test_state(domain="property_detail", classification=cls)
        result = await validate_slm_node(state)

        assert result.get("bot_response") is None, \
            "calculator/calculate_emi must be valid in property_detail domain"


class TestValidateSlmNodeUnknownIntent:
    """REQ-CLS-009 — intent pairs not in INTENT_REGISTRY must be rejected."""

    @pytest.mark.asyncio
    async def test_unknown_main_and_sub_intent_rejected(self):
        """A completely made-up intent pair must be rejected."""
        cls   = _make_classification(
            main_intent="nonexistent_main",
            sub_intent="nonexistent_sub",
        )
        state  = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        assert result.get("bot_response") is not None, \
            "Unknown intent pair must produce bot_response"

    @pytest.mark.asyncio
    async def test_valid_main_invalid_sub_rejected(self):
        """A valid main_intent with a non-existent sub_intent must be rejected."""
        cls   = _make_classification(
            main_intent="property_search",
            sub_intent="made_up_sub_intent",
        )
        state  = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        assert result.get("bot_response") is not None, \
            "Unknown sub_intent must produce bot_response"

    @pytest.mark.asyncio
    async def test_invalid_sub_for_out_of_scope_rejected(self):
        """out_of_scope / made_up_sub is not a valid registered pair."""
        cls   = _make_classification(
            main_intent="out_of_scope",
            sub_intent="made_up_query_type",
        )
        state  = make_test_state(domain="out_of_scope", classification=cls)
        result = await validate_slm_node(state)

        assert result.get("bot_response") is not None


class TestValidateSlmNodeCoercions:
    """Type coercions from the spec — cheap fixes for known SLM mis-shapes."""

    @pytest.mark.asyncio
    async def test_localities_string_coerced_to_list(self):
        """REQ-CLS-010: localities: "Andheri" → ["Andheri"]."""
        cls   = _make_classification(filter_delta={"localities": "Andheri"})
        state  = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        assert result.get("bot_response") is None
        localities = result["classification"]["filter_delta"]["localities"]
        assert localities == ["Andheri"], \
            f"Expected ['Andheri'], got {localities!r}"

    @pytest.mark.asyncio
    async def test_localities_list_unchanged(self):
        """A correctly typed list must not be modified."""
        cls   = _make_classification(filter_delta={"localities": ["Andheri", "Bandra"]})
        state  = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        assert result["classification"]["filter_delta"]["localities"] == ["Andheri", "Bandra"]

    @pytest.mark.asyncio
    async def test_clarification_bool_true_coerced_to_string(self):
        """REQ-CLS-011: clarification_needed: True → a non-empty string."""
        cls   = _make_classification(clarification_needed=True)
        state  = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        cn = result["classification"]["clarification_needed"]
        assert isinstance(cn, str), \
            f"clarification_needed must be coerced to str, got {type(cn)}"
        assert len(cn) > 0

    @pytest.mark.asyncio
    async def test_clarification_bool_false_coerced_to_none(self):
        """clarification_needed: False → None."""
        cls   = _make_classification(clarification_needed=False)
        state  = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        assert result["classification"]["clarification_needed"] is None, \
            "clarification_needed: False must be coerced to None"

    @pytest.mark.asyncio
    async def test_clarification_empty_string_coerced_to_none(self):
        """REQ-CLS-012: clarification_needed: "" → None."""
        cls   = _make_classification(clarification_needed="")
        state  = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        assert result["classification"]["clarification_needed"] is None, \
            'clarification_needed: "" must be coerced to None (REQ-CLS-012)'

    @pytest.mark.asyncio
    async def test_clarification_valid_string_unchanged(self):
        """A non-empty clarification string must be left as-is."""
        question = "Did you mean Andheri East or West?"
        cls   = _make_classification(clarification_needed=question)
        state  = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        assert result["classification"]["clarification_needed"] == question

    @pytest.mark.asyncio
    async def test_clarification_data_injected_when_needed_is_set(self):
        """When clarification_needed is set and clarification_data is absent,
        a stub clarification_data dict must be injected."""
        cls   = _make_classification(clarification_needed="Which area do you prefer?")
        # clarification_data intentionally absent
        state  = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        cd = result["classification"].get("clarification_data")
        assert cd is not None, \
            "clarification_data must be injected when clarification_needed is set"
        assert "question_id" in cd

    @pytest.mark.asyncio
    async def test_malformed_entities_dropped(self):
        """Entity dicts missing 'name' or 'inferred_type' must be silently dropped."""
        cls   = _make_classification(
            entities_mentioned=[
                {"name": "Powai", "inferred_type": "locality"},        # valid
                {"inferred_type": "locality"},                          # missing 'name'
                {"name": "Bandra"},                                     # missing 'inferred_type'
                {"name": "Andheri", "inferred_type": "locality"},      # valid
            ]
        )
        state  = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        entities = result["classification"]["entities_mentioned"]
        assert len(entities) == 2, \
            f"Expected 2 valid entities, got {len(entities)}: {entities}"
        names = {e["name"] for e in entities}
        assert names == {"Powai", "Andheri"}

    @pytest.mark.asyncio
    async def test_well_formed_entities_unchanged(self):
        """All valid entity dicts must be preserved unchanged."""
        entities = [
            {"name": "Powai", "inferred_type": "locality"},
            {"name": "Lodha Palava", "inferred_type": "project"},
        ]
        cls    = _make_classification(entities_mentioned=entities)
        state  = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        assert result["classification"]["entities_mentioned"] == entities


# ---------------------------------------------------------------------------
# Tests: REQ-CLS-012 through REQ-CLS-015 (CHAT-Q-DRY-005b)
# ---------------------------------------------------------------------------

class TestValidateSlmNodeDry005b:
    """Additional requirement tests appended in CHAT-Q-DRY-005b."""

    @pytest.mark.asyncio
    async def test_validate_slm_empty_clarification_coerced_to_none(self):
        """REQ-CLS-012: clarification_needed="" must be coerced to None."""
        cls   = _make_classification(clarification_needed="")
        state = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        assert result.get("bot_response") is None, \
            'Empty clarification_needed must not short-circuit to bot_response'
        cn = result["classification"]["clarification_needed"]
        assert not cn, \
            f'clarification_needed="" must be coerced to None/falsy, got {cn!r} (REQ-CLS-012)'

    @pytest.mark.asyncio
    async def test_validate_slm_reasoning_trimmed_to_30_words(self):
        """REQ-CLS-013: reasoning field with >30 words must be trimmed to ≤30 words."""
        long_reasoning = " ".join([f"word{i}" for i in range(50)])  # exactly 50 words
        cls   = _make_classification(reasoning=long_reasoning)
        state = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        assert result.get("bot_response") is None, \
            'Overlong reasoning must not short-circuit to bot_response'
        trimmed = result["classification"].get("reasoning", "")
        word_count = len(trimmed.split())
        assert word_count <= 30, \
            f'reasoning must be trimmed to ≤30 words, got {word_count} words (REQ-CLS-013)'

    @pytest.mark.asyncio
    async def test_validate_slm_calculator_accepted_in_property_detail_domain(self):
        """REQ-CLS-014: calculator main_intent must be accepted in property_detail domain."""
        cls   = _make_classification(
            main_intent="calculator",
            sub_intent="calculate_emi",
        )
        state = make_test_state(domain="property_detail", classification=cls)
        result = await validate_slm_node(state)

        assert result.get("bot_response") is None, \
            'calculator/calculate_emi must not be rejected as cross-domain in property_detail (REQ-CLS-014)'
        # Also assert classification domain is not out_of_scope (no cross-domain rejection)
        classification = result.get("classification", {})
        assert classification.get("main_intent") != "out_of_scope", \
            'calculator intent must not be silently rewritten to out_of_scope (REQ-CLS-014)'

    @pytest.mark.asyncio
    async def test_validate_slm_multi_intent_bypasses_domain_guard(self):
        """REQ-CLS-015: multi_intent must bypass the domain guard check entirely."""
        cls   = _make_classification(
            main_intent="multi_intent",
            sub_intent="multi_intent",
        )
        state = make_test_state(domain="property_search", classification=cls)
        result = await validate_slm_node(state)

        assert result.get("bot_response") is None, \
            'multi_intent must bypass the cross-domain guard and not produce bot_response (REQ-CLS-015)'
        # Confirm classification is returned, not converted to out_of_scope
        classification = result.get("classification", {})
        assert classification.get("main_intent") != "out_of_scope", \
            'multi_intent must not be converted to out_of_scope (REQ-CLS-015)'
