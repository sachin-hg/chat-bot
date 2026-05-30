"""CHAT-Q-001: BotState field presence and default value tests."""
import pytest
from tests.unit.conftest import make_test_state

REQUIRED_KEYS = [
    "raw_message", "request_id", "session",
    "safety_result", "normalized_message", "domain",
    "classification", "filter_delta_applied", "sanitized",
    "derived_filters", "clarification_emitted", "resolved_entities",
    "routing", "pre_fetched_data", "fetch_errors",
    "system_prompt", "tool_definitions", "llm_response",
    "tool_results", "validated_text", "bot_response",
    "summary_emitted", "template_count",
    "experiment_id", "experiment_variant",
]

SESSION_REQUIRED_KEYS = [
    "session_id", "conversation_id", "user_id", "token_id",
    "auth_token", "city", "transaction_type", "active_filters",
    "last_intent", "last_domain", "turn_count",
    "active_property_id", "active_locality_id", "active_project_id",
    "srset_id", "search_history",
]


def test_all_botstate_keys_present():
    s = make_test_state()
    missing = [k for k in REQUIRED_KEYS if k not in s]
    assert not missing, f"BotState missing keys: {missing}"


def test_session_keys_present():
    s = make_test_state()
    missing = [k for k in SESSION_REQUIRED_KEYS if k not in s["session"]]
    assert not missing, f"session dict missing keys: {missing}"


def test_defaults_are_none_or_empty():
    s = make_test_state()
    assert s["safety_result"] is None
    assert s["normalized_message"] is None
    assert s["domain"] is None
    assert s["classification"] is None
    assert s["routing"] is None
    assert s["bot_response"] is None
    assert s["validated_text"] is None


def test_session_defaults():
    s = make_test_state(session_id="my-sess")
    sess = s["session"]
    assert sess["session_id"] == "my-sess"
    assert sess["turn_count"] == 0
    assert sess["active_filters"] == {}
    assert sess["search_history"] == []
    assert sess["transaction_type"] is None


def test_raw_message_set():
    s = make_test_state(raw_message="show me 3bhk")
    assert s["raw_message"] == "show me 3bhk"


def test_override_works():
    s = make_test_state(domain="property_search")
    assert s["domain"] == "property_search"


def test_classification_override():
    s = make_test_state(
        classification={"main_intent": "locality_research", "sub_intent": "price_trends"}
    )
    assert s["classification"]["main_intent"] == "locality_research"
