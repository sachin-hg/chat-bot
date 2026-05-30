"""Tests for the shared test fixtures."""
import pytest


def test_base_state_is_clean(base_state):
    assert base_state["raw_message"] == "show me 2bhk in mumbai"
    assert base_state["classification"] is None
    assert base_state["domain"] is None


def test_search_state_has_classification(search_state):
    c = search_state["classification"]
    assert c is not None
    assert c["main_intent"] == "property_search"
    assert c["sub_intent"] == "filter_search"
    assert c["filter_delta"]["bhk"] == [2]
    assert c["filter_delta"]["price_max"] == 8_000_000
    assert c["filter_delta"]["localities"] == ["Bandra"]
    assert c["clarification_needed"] is None
    assert c["pivot"] is False


def test_out_of_scope_state(out_of_scope_state):
    c = out_of_scope_state["classification"]
    assert c["main_intent"] == "out_of_scope"
    assert c["sub_intent"] == "out_of_scope_query"
    assert c["filter_delta"] == {}


def test_fixtures_are_independent(base_state, search_state):
    # Mutating one fixture should not affect another
    base_state["domain"] = "mutated"
    assert search_state.get("domain") != "mutated"
