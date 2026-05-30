"""CHAT-Q-complex: 20-turn complex multi-turn conversation tests.

Covers: vague requests, OOS resilience, derived filters (price_per_sqft, search_anchor),
domain pivots, Hindi input, contact_seller (Tier 1), EMI calculator (Tier 2),
comparison (Tier 3b/Sonnet), and filter RELAX semantics.
"""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock

from tests.dry_run.runner import run_dry_pipeline

SCENARIO = "multi_turn_complex"


# ---------------------------------------------------------------------------
# Helper factories
# ---------------------------------------------------------------------------

def make_router(domain: str, confidence: float = 0.93):
    r = MagicMock()
    r.route = AsyncMock(return_value={"domain": domain, "confidence": confidence})
    return r


def make_classifier(
    domain: str,
    main_intent: str,
    sub_intent: str,
    filter_delta: dict | None = None,
    clarification_needed: str | None = None,
    pivot: bool = False,
    entities: list | None = None,
):
    c = MagicMock()
    c.classify = AsyncMock(return_value={
        "domain":               domain,
        "main_intent":          main_intent,
        "sub_intent":           sub_intent,
        "filter_delta":         filter_delta or {},
        "entities_mentioned":   entities or [],
        "clarification_needed": clarification_needed,
        "pivot":                pivot,
        "multi_intent":         False,
        "confidence":           0.93,
        "reasoning":            "test",
    })
    return c


# ---------------------------------------------------------------------------
# 20-turn conversation definition
# ---------------------------------------------------------------------------
# Each entry:
#   message    — user message text
#   router     — DomainRouterPort mock
#   classifier — ClassifierPort mock
#   assert_fn  — callable(result, session) → bool
#   assert_msg — failure description
# ---------------------------------------------------------------------------

TURNS = [
    # ── Turn 1: Vague — clarification needed ────────────────────────────────
    {
        "message": "I want a flat",
        "router":     make_router("property_search"),
        "classifier": make_classifier(
            "property_search", "property_search", "filter_search",
            clarification_needed="Are you looking to buy or rent?",
        ),
        "assert_fn": lambda r, s: (
            r.clarification == "Are you looking to buy or rent?" and
            r.final_state.get("bot_response", {}).get("template_id") == "nested_qna"
        ),
        "assert_msg": "Turn 1: vague request should emit nested_qna clarification",
    },
    # ── Turn 2: Resolve clarification → buy ─────────────────────────────────
    {
        "message": "buy",
        "router":     make_router("property_search"),
        "classifier": make_classifier(
            "property_search", "property_search", "filter_search",
            filter_delta={"transaction_type": "buy"},
        ),
        "assert_fn": lambda r, s: s.get("active_filters", {}).get("transaction_type") == "buy",
        "assert_msg": "Turn 2: transaction_type=buy stored in active_filters",
    },
    # ── Turn 3: Add BHK ──────────────────────────────────────────────────────
    {
        "message": "3 bedroom please",
        "router":     make_router("property_search"),
        "classifier": make_classifier(
            "property_search", "property_search", "filter_search",
            filter_delta={"bhk": [3]},
        ),
        "assert_fn": lambda r, s: s.get("active_filters", {}).get("bhk") == [3],
        "assert_msg": "Turn 3: bhk=[3] stored",
    },
    # ── Turn 4: Add city ─────────────────────────────────────────────────────
    {
        "message": "in Mumbai",
        "router":     make_router("property_search"),
        "classifier": make_classifier(
            "property_search", "property_search", "filter_search",
            filter_delta={"city": "Mumbai"},
        ),
        "assert_fn": lambda r, s: s.get("active_filters", {}).get("city") == "Mumbai",
        "assert_msg": "Turn 4: city=Mumbai stored",
    },
    # ── Turn 5: Price filter ──────────────────────────────────────────────────
    {
        "message": "budget around 1.5 crore",
        "router":     make_router("property_search"),
        "classifier": make_classifier(
            "property_search", "property_search", "filter_search",
            filter_delta={"price_max": 15000000},
        ),
        "assert_fn": lambda r, s: s.get("active_filters", {}).get("price_max") == 15000000,
        "assert_msg": "Turn 5: price_max=15_000_000 stored",
    },
    # ── Turn 6: Out of scope — filters must be unchanged ─────────────────────
    {
        "message": "what's the weather today?",
        "router":     make_router("out_of_scope", 0.99),
        "classifier": make_classifier("out_of_scope", "out_of_scope", "out_of_scope_query"),
        "assert_fn": lambda r, s: (
            r.main_intent == "out_of_scope" and
            len(r.tool_calls) == 0 and
            s.get("active_filters", {}).get("price_max") == 15000000  # unchanged
        ),
        "assert_msg": "Turn 6: out_of_scope — no tool calls, price_max unchanged",
    },
    # ── Turn 7: Add locality ─────────────────────────────────────────────────
    {
        "message": "show me in Bandra",
        "router":     make_router("property_search"),
        "classifier": make_classifier(
            "property_search", "property_search", "filter_search",
            filter_delta={"localities": ["Bandra"]},
            entities=[{"name": "Bandra", "inferred_type": "locality"}],
        ),
        "assert_fn": lambda r, s: "Bandra" in (s.get("active_filters", {}).get("localities") or []),
        "assert_msg": "Turn 7: Bandra added to localities",
    },
    # ── Turn 8: Property detail — tap on prop_001 ────────────────────────────
    # Set auth_token here so Tier-1 turns (10) work correctly.
    {
        "message": "tell me more about the first one",
        "router":     make_router("property_detail"),
        "classifier": make_classifier("property_detail", "property_detail", "property_about"),
        "assert_fn": lambda r, s: r.main_intent == "property_detail",
        "assert_msg": "Turn 8: property_detail intent classified",
    },
    # ── Turn 9: Nearby landmarks ─────────────────────────────────────────────
    {
        "message": "what's nearby?",
        "router":     make_router("property_detail"),
        "classifier": make_classifier("property_detail", "property_detail", "nearby_landmarks"),
        "assert_fn": lambda r, s: r.sub_intent == "nearby_landmarks",
        "assert_msg": "Turn 9: nearby_landmarks sub-intent",
    },
    # ── Turn 10: Contact seller — Tier 1, auth required ──────────────────────
    # contact_seller requires_auth=True. Without auth_token the pipeline emits
    # a login template. The session will carry auth_token="test-token" set below.
    {
        "message": "I want to contact the seller",
        "router":     make_router("property_detail"),
        "classifier": make_classifier("property_detail", "property_detail", "contact_seller"),
        "assert_fn": lambda r, s: (
            r.final_state.get("bot_response", {}).get("template_id") in ("contact_seller", "login") and
            len(r.tool_calls) == 0  # Tier 1: no executor calls
        ),
        "assert_msg": "Turn 10: contact_seller — Tier 1, no executor calls, template emitted",
    },
    # ── Turn 11: Out of scope again ───────────────────────────────────────────
    {
        "message": "tell me a joke",
        "router":     make_router("out_of_scope", 0.99),
        "classifier": make_classifier("out_of_scope", "out_of_scope", "out_of_scope_query"),
        "assert_fn": lambda r, s: len(r.tool_calls) == 0,
        "assert_msg": "Turn 11: out_of_scope — no tool calls",
    },
    # ── Turn 12: Domain switch to locality_research ───────────────────────────
    {
        "message": "tell me about Bandra as a locality",
        "router":     make_router("locality"),
        "classifier": make_classifier(
            "locality", "locality_research", "locality_overview",
            filter_delta={"localities": ["Bandra"]},
            pivot=True,
            entities=[{"name": "Bandra", "inferred_type": "locality"}],
        ),
        "assert_fn": lambda r, s: r.main_intent == "locality_research",
        "assert_msg": "Turn 12: domain switched to locality_research",
    },
    # ── Turn 13: Price trends ─────────────────────────────────────────────────
    {
        "message": "how have prices moved there?",
        "router":     make_router("locality"),
        "classifier": make_classifier("locality", "locality_research", "price_trends"),
        "assert_fn": lambda r, s: r.sub_intent == "price_trends",
        "assert_msg": "Turn 13: price_trends sub-intent",
    },
    # ── Turn 14: Pivot back to property_search with Worli ────────────────────
    {
        "message": "ok show me properties in Worli",
        "router":     make_router("property_search"),
        "classifier": make_classifier(
            "property_search", "property_search", "filter_search",
            filter_delta={"localities": ["Worli"], "city": "Mumbai"},
            pivot=True,
            entities=[{"name": "Worli", "inferred_type": "locality"}],
        ),
        "assert_fn": lambda r, s: (
            r.main_intent == "property_search" and
            "Worli" in (s.get("active_filters", {}).get("localities") or []) and
            s.get("active_filters", {}).get("city") == "Mumbai"  # universal key preserved
        ),
        "assert_msg": "Turn 14: pivot to property_search, city preserved, Worli locality set",
    },
    # ── Turn 15: Derived filter — price_per_sqft → price_max ─────────────────
    # bhk=[3] from prior turns → area=1300 → price_max = 15000 * 1300 = 19_500_000
    {
        "message": "15000 per sqft max",
        "router":     make_router("property_search"),
        "classifier": make_classifier(
            "property_search", "property_search", "filter_search",
            filter_delta={"price_per_sqft": 15000, "price_sqft_bound": "max", "bhk": [3]},
        ),
        "assert_fn": lambda r, s: (
            "price_per_sqft" not in s.get("active_filters", {}) and
            s.get("active_filters", {}).get("price_max") == 19500000
        ),
        "assert_msg": "Turn 15: price_per_sqft derived → price_max=19_500_000 (15000 * 1300 sqft for 3BHK)",
    },
    # ── Turn 16: Hindi vague query ────────────────────────────────────────────
    {
        "message": "kitne options hain",
        "router":     make_router("property_search"),
        "classifier": make_classifier(
            "property_search", "property_search", "filter_search",
            filter_delta={},
        ),
        "assert_fn": lambda r, s: r.domain == "property_search",
        "assert_msg": "Turn 16: Hindi query correctly routed to property_search",
    },
    # ── Turn 17: Relax price filter ────────────────────────────────────────────
    {
        "message": "remove the price filter",
        "router":     make_router("property_search"),
        "classifier": make_classifier(
            "property_search", "property_search", "filter_search",
            filter_delta={"price_max": None},
        ),
        "assert_fn": lambda r, s: "price_max" not in s.get("active_filters", {}),
        "assert_msg": "Turn 17: price_max relaxed (removed from active_filters)",
    },
    # ── Turn 18: Derived filter — search_anchor ────────────────────────────────
    # derive_node resolves anchor → lat=0, lng=0 (stub); price_per_sqft is absent.
    {
        "message": "near a school",
        "router":     make_router("property_search"),
        "classifier": make_classifier(
            "property_search", "property_search", "filter_search",
            filter_delta={"search_anchor": "school nearby"},
        ),
        "assert_fn": lambda r, s: r.main_intent == "property_search",
        "assert_msg": "Turn 18: search_anchor derived (stub resolves lat=0, lng=0)",
    },
    # ── Turn 19: Comparison — Tier 3b (Sonnet) ────────────────────────────────
    {
        "message": "compare Bandra and Worli for buying",
        "router":     make_router("locality"),
        "classifier": make_classifier(
            "locality", "comparison", "compare_localities",
            filter_delta={},
            entities=[
                {"name": "Bandra", "inferred_type": "locality"},
                {"name": "Worli",  "inferred_type": "locality"},
            ],
        ),
        "assert_fn": lambda r, s: (
            r.main_intent == "comparison" and
            r.sub_intent == "compare_localities"
        ),
        "assert_msg": "Turn 19: comparison/compare_localities intent, Tier 3b (Sonnet)",
    },
    # ── Turn 20: EMI calculator — Tier 2 ─────────────────────────────────────
    # Tier 2 short-circuits at route_node (bot_response set → END).
    # fetch_data_node is never reached, so no executor calls are recorded.
    {
        "message": "what would be the EMI for 1.5 crore at 8.5%?",
        "router":     make_router("property_detail"),
        "classifier": make_classifier(
            "property_detail", "calculator", "calculate_emi",
            filter_delta={"loan_amount": 15000000, "rate": 8.5},
        ),
        "assert_fn": lambda r, s: (
            r.main_intent == "calculator" and
            r.sub_intent == "calculate_emi" and
            len(r.tool_calls) == 0  # Tier 2 short-circuits before fetch_data_node
        ),
        "assert_msg": "Turn 20: EMI calculator, Tier 2, no executor calls",
    },
]


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestComplexMultiTurnConversation:
    """20-turn conversation covering vague requests, OOS, derived filters, domain switching."""

    @pytest.mark.asyncio
    async def test_full_20_turn_conversation_mock_llm(self):
        """Run all 20 turns sequentially. Each turn carries session state forward."""
        session = {
            "session_id":     "complex-multi-turn",
            "turn_count":     0,
            "active_filters": {},
            "turn_history":   [],
            # Provide auth_token so Tier-1 contact_seller (Turn 10) returns the
            # contact_seller template rather than the login gate template.
            "auth_token":     "test-auth-token",
        }
        for i, turn in enumerate(TURNS):
            result = await run_dry_pipeline(
                message=turn["message"],
                scenario=SCENARIO,
                session=session,
                router=turn["router"],
                classifier=turn["classifier"],
            )
            # Carry session forward
            if result.session:
                session = {**result.session, "turn_count": i + 1}

            assert turn["assert_fn"](result, result.session), (
                f"Turn {i + 1} failed: {turn['assert_msg']}\n"
                f"  domain={result.domain!r}  main_intent={result.main_intent!r}  "
                f"sub_intent={result.sub_intent!r}\n"
                f"  clarification={result.clarification!r}\n"
                f"  active_filters={result.session.get('active_filters')}\n"
                f"  bot_response template={result.final_state.get('bot_response', {}).get('template_id')!r}\n"
                f"  tool_calls={result.tool_calls}"
            )

    @pytest.mark.asyncio
    async def test_out_of_scope_never_corrupts_filters(self):
        """Three consecutive OOS turns must not change active_filters."""
        session = {
            "session_id":     "oos-no-corrupt",
            "turn_count":     4,
            "active_filters": {"bhk": [3], "city": "Mumbai", "price_max": 15000000},
            "turn_history":   [],
        }
        oos_router     = make_router("out_of_scope", 0.99)
        oos_classifier = make_classifier("out_of_scope", "out_of_scope", "out_of_scope_query")

        for idx in range(3):
            result = await run_dry_pipeline(
                message="tell me a joke",
                scenario=SCENARIO,
                session=session,
                router=oos_router,
                classifier=oos_classifier,
            )
            session = {**result.session, "turn_count": session["turn_count"] + 1}

        assert session["active_filters"]["bhk"] == [3], \
            "bhk corrupted by OOS turns"
        assert session["active_filters"]["city"] == "Mumbai", \
            "city corrupted by OOS turns"
        assert session["active_filters"]["price_max"] == 15000000, \
            "price_max corrupted by OOS turns"

    @pytest.mark.asyncio
    async def test_domain_switch_preserves_city(self):
        """Pivoting from property_search to locality preserves city (universal key),
        but clears intent-local keys like bhk."""
        session = {
            "session_id":     "domain-switch",
            "turn_count":     6,
            "active_filters": {"bhk": [3], "city": "Mumbai", "localities": ["Bandra"]},
            "turn_history":   [],
        }
        pivot_result = await run_dry_pipeline(
            message="tell me about Bandra locality",
            scenario=SCENARIO,
            session=session,
            router=make_router("locality"),
            classifier=make_classifier(
                "locality", "locality_research", "locality_overview",
                filter_delta={"localities": ["Bandra"]},
                pivot=True,
            ),
        )
        city = pivot_result.session["active_filters"].get("city")
        bhk  = pivot_result.session["active_filters"].get("bhk")
        assert city == "Mumbai", f"city not preserved after pivot: {city!r}"
        assert bhk is None, f"bhk should be cleared on pivot to locality_research, got {bhk!r}"

    @pytest.mark.asyncio
    async def test_price_per_sqft_derivation(self):
        """price_per_sqft=15000 with bhk=[3] → price_max=19_500_000 (15000 * 1300 sqft)."""
        session = {
            "session_id":     "derive-price",
            "turn_count":     4,
            "active_filters": {"bhk": [3], "city": "Mumbai"},
            "turn_history":   [],
        }
        result = await run_dry_pipeline(
            message="15000 per sqft max",
            scenario=SCENARIO,
            session=session,
            router=make_router("property_search"),
            classifier=make_classifier(
                "property_search", "property_search", "filter_search",
                filter_delta={"price_per_sqft": 15000, "price_sqft_bound": "max", "bhk": [3]},
            ),
        )
        filters = result.session.get("active_filters", {})
        assert "price_per_sqft" not in filters, \
            f"price_per_sqft should be removed after derivation, filters={filters}"
        assert filters.get("price_max") == 19500000, \
            f"Expected price_max=19_500_000, got {filters.get('price_max')}"

    @pytest.mark.asyncio
    async def test_price_filter_relaxed_to_none(self):
        """filter_delta with price_max=None removes the key (RELAX semantics)."""
        session = {
            "session_id":     "relax-price",
            "turn_count":     5,
            "active_filters": {"bhk": [3], "city": "Mumbai", "price_max": 20000000},
            "turn_history":   [],
        }
        result = await run_dry_pipeline(
            message="remove the price filter",
            scenario=SCENARIO,
            session=session,
            router=make_router("property_search"),
            classifier=make_classifier(
                "property_search", "property_search", "filter_search",
                filter_delta={"price_max": None},
            ),
        )
        filters = result.session.get("active_filters", {})
        assert "price_max" not in filters, \
            f"price_max should be absent after relax, filters={filters}"
        assert filters.get("city") == "Mumbai", "city should survive a price relax"

    @pytest.mark.asyncio
    async def test_comparison_intent_classified(self):
        """compare_localities is routed as comparison/compare_localities (Tier 3b)."""
        session = {
            "session_id":     "compare-test",
            "turn_count":     2,
            "active_filters": {"city": "Mumbai"},
            "turn_history":   [],
        }
        result = await run_dry_pipeline(
            message="compare Bandra and Worli",
            scenario=SCENARIO,
            session=session,
            router=make_router("locality"),
            classifier=make_classifier(
                "locality", "comparison", "compare_localities",
                entities=[
                    {"name": "Bandra", "inferred_type": "locality"},
                    {"name": "Worli",  "inferred_type": "locality"},
                ],
            ),
        )
        assert result.main_intent == "comparison"
        assert result.sub_intent == "compare_localities"

    @pytest.mark.asyncio
    async def test_calculator_emi_intent(self):
        """calculator/calculate_emi is Tier 2 — short-circuits at route_node (no LLM, no fetch_data_node)."""
        session = {
            "session_id":     "emi-test",
            "turn_count":     1,
            "active_filters": {},
            "turn_history":   [],
        }
        result = await run_dry_pipeline(
            message="EMI for 1.5 crore at 8.5%",
            scenario=SCENARIO,
            session=session,
            router=make_router("property_detail"),
            classifier=make_classifier(
                "property_detail", "calculator", "calculate_emi",
                filter_delta={"loan_amount": 15000000, "rate": 8.5},
            ),
        )
        assert result.main_intent == "calculator"
        assert result.sub_intent == "calculate_emi"
        # Tier 2 short-circuits at route_node → execute_tier2_action stub.
        # fetch_data_node is never reached (bot_response already set), so no executor calls.
        assert len(result.tool_calls) == 0, \
            f"Tier 2 should not reach fetch_data_node, got tool_calls={result.tool_calls}"
        # Tier 2 route_node sets bot_response (text_response stub)
        template_id = result.final_state.get("bot_response", {}).get("template_id")
        assert template_id is not None, "Tier 2 should produce a bot_response template"
