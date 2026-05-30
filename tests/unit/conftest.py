"""
Shared test fixtures for all unit tests.
make_test_state() returns a BotState dict with all documented fields initialised
to safe test defaults. Uses src.pipeline.state.make_base_state when available;
falls back to a local stub so tests can run before @priya's state.py exists.
"""
from typing import Any, Dict, Optional

import pytest


def make_test_state(
    raw_message: str = "show me 2bhk in mumbai",
    session_id: str = "sess-test-001",
    request_id: str = "req-test-001",
    **overrides: Any,
) -> Dict[str, Any]:
    """Returns a BotState dict with all fields from pipeline-preamble.md."""
    try:
        from src.pipeline.state import make_base_state
        state = make_base_state(
            raw_message=raw_message,
            session_id=session_id,
            request_id=request_id,
        )
    except ImportError:
        # Stub: mirrors BotState fields exactly for use before state.py exists
        state = {
            "raw_message":          raw_message,
            "request_id":           request_id,
            "session": {
                "session_id":         session_id,
                "conversation_id":    "",
                "user_id":            None,
                "token_id":           "",
                "auth_token":         None,
                "city":               None,
                "city_uuid":          None,
                "transaction_type":   None,
                "active_filters":     {},
                "last_intent":        None,
                "last_domain":        None,
                "turn_count":         0,
                "active_property_id": None,
                "active_seller_id":   None,
                "active_locality_id": None,
                "active_project_id":  None,
                "srset_id":           None,
                "search_history":     [],
                "carousel_state":     {},
            },
            "safety_result":        None,
            "normalized_message":   None,
            "domain":               None,
            "classification":       None,
            "filter_delta_applied": None,
            "sanitized":            None,
            "derived_filters":      None,
            "clarification_emitted": None,
            "resolved_entities":    None,
            "routing":              None,
            "pre_fetched_data":     None,
            "fetch_errors":         None,
            "system_prompt":        None,
            "tool_definitions":     None,
            "llm_response":         None,
            "tool_results":         None,
            "validated_text":       None,
            "bot_response":         None,
            "summary_emitted":      None,
            "template_count":       None,
            "experiment_id":        None,
            "experiment_variant":   None,
        }

    state.update(overrides)
    return state


@pytest.fixture
def base_state() -> Dict[str, Any]:
    return make_test_state()


@pytest.fixture
def search_state() -> Dict[str, Any]:
    return make_test_state(
        raw_message="show me 2bhk in bandra under 80L",
        classification={
            "main_intent":        "property_search",
            "sub_intent":         "filter_search",
            "filter_delta":       {"bhk": [2], "localities": ["Bandra"], "price_max": 8_000_000},
            "entities_mentioned": [{"name": "Bandra", "inferred_type": "locality"}],
            "clarification_needed": None,
            "pivot":              False,
            "multi_intent":       False,
            "reasoning":          "test: 2bhk + locality + price",
        },
    )


@pytest.fixture
def out_of_scope_state() -> Dict[str, Any]:
    return make_test_state(
        raw_message="what is the weather today",
        classification={
            "main_intent":        "out_of_scope",
            "sub_intent":         "out_of_scope_query",
            "filter_delta":       {},
            "entities_mentioned": [],
            "clarification_needed": None,
            "pivot":              False,
            "multi_intent":       False,
            "reasoning":          "test: off-topic",
        },
    )
