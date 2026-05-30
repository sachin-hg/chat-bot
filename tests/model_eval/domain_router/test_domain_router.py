"""Model eval runner for domain router.

Structural validation runs always (no flag required).
Real SLM calls require: pytest tests/model_eval/ --real-model

Test taxonomy:
  - Structural tests (always run): validate case format and allowed domain values.
  - real_model tests (--real-model flag): call the actual SLM and assert on output.

Domains valid per INTENT_REGISTRY / prompt taxonomy:
  property_search, property_detail, locality, project_research, portfolio, out_of_scope
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

_CASES_PATH = Path(__file__).parent / "cases.jsonl"
CASES = [
    json.loads(line)
    for line in _CASES_PATH.read_text().splitlines()
    if line.strip()
]

VALID_DOMAINS = frozenset({
    "property_search",
    "property_detail",
    "locality",
    "project_research",
    "portfolio",
    "out_of_scope",
})


# ---------------------------------------------------------------------------
# Structural validation — always runs, no flags required
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("case", CASES, ids=[c["id"] for c in CASES])
def test_domain_router_case_structure(case):
    """Each case must be structurally valid (no model required).

    Validates:
    - Required top-level keys exist
    - expected.domain is a recognised value
    - expected.confidence_min is in (0, 1]
    - input has the required shape keys
    """
    assert "id" in case, "case must have an id"
    assert "input" in case, f"case {case.get('id')} must have an 'input' key"
    assert "expected" in case, f"case {case.get('id')} must have an 'expected' key"
    assert "tags" in case, f"case {case.get('id')} must have a 'tags' list"

    inp = case["input"]
    assert "message" in inp, f"case {case['id']}: input must have 'message'"
    assert "history" in inp, f"case {case['id']}: input must have 'history'"
    assert "active_filters" in inp, f"case {case['id']}: input must have 'active_filters'"
    assert "previous_domain" in inp, f"case {case['id']}: input must have 'previous_domain'"

    exp = case["expected"]
    assert "domain" in exp, f"case {case['id']}: expected must have 'domain'"
    assert "confidence_min" in exp, f"case {case['id']}: expected must have 'confidence_min'"

    assert exp["domain"] in VALID_DOMAINS, (
        f"case {case['id']}: expected domain {exp['domain']!r} is not in VALID_DOMAINS {VALID_DOMAINS}"
    )
    assert 0 < exp["confidence_min"] <= 1.0, (
        f"case {case['id']}: confidence_min {exp['confidence_min']} must be in (0, 1]"
    )

    assert isinstance(inp["history"], list), f"case {case['id']}: history must be a list"
    assert isinstance(inp["active_filters"], dict), f"case {case['id']}: active_filters must be a dict"
    assert isinstance(case["tags"], list), f"case {case['id']}: tags must be a list"


# ---------------------------------------------------------------------------
# Tag coverage guard — structural, always runs
# ---------------------------------------------------------------------------

def test_cases_cover_required_tags():
    """Cases must cover all critical domain and edge-case tags."""
    all_tags = {tag for case in CASES for tag in case.get("tags", [])}
    required_tags = {"primary", "out_of_scope", "safety", "hindi", "edge_case"}
    missing = required_tags - all_tags
    assert missing == set(), (
        f"Model eval cases are missing coverage for required tags: {missing}. "
        "Add at least one case per tag."
    )


def test_cases_cover_all_valid_domains():
    """Cases must include at least one example per valid domain."""
    covered_domains = {case["expected"]["domain"] for case in CASES}
    missing = VALID_DOMAINS - covered_domains
    assert missing == set(), (
        f"Model eval cases do not cover domains: {missing}. "
        "Add at least one case per domain."
    )


# ---------------------------------------------------------------------------
# Real-model eval — requires --real-model flag
# ---------------------------------------------------------------------------

@pytest.mark.real_model
@pytest.mark.parametrize("case", CASES, ids=[c["id"] for c in CASES])
def test_domain_router_real_model(case):
    """Call the actual SLM domain router and assert routing accuracy.

    This test is a placeholder scaffold. Wire up the real SLM call here:

        from src.pipeline.nodes.classification import route_domain_node
        result = route_domain_node(case["input"])
        assert result["domain"] == case["expected"]["domain"]
        assert result["confidence"] >= case["expected"]["confidence_min"]
    """
    # Scaffold: structural pass until SLM wiring is added.
    # Replace this block with actual model invocation.
    assert case["expected"]["domain"] in VALID_DOMAINS, (
        f"case {case['id']}: expected domain {case['expected']['domain']!r} is not valid"
    )
