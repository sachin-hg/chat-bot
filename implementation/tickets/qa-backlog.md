# QA Backlog — @rahul (QA Lead)

**Testing strategy doc:** `docs/testing/testing-guide.md`  
**Principle:** Tests are written as nodes are built — not batched at the end.

---

## Testing Strategy Overview

```
Unit Tests (fast, offline)
  → pytest tests/unit/         ~80% coverage target on nodes + helpers
  → Mock all external I/O (Redis, APIs, Anthropic)
  → Run on every commit (< 30s)

Model Eval (calibrated, real SLM)
  → pytest tests/model_eval/   100+ cases per domain
  → Run with --real-model flag before every deploy
  → Accuracy targets: ≥98% domain router, ≥95% per-domain classifier

Integration Tests (real APIs)
  → pytest tests/integration/  --run-integration flag
  → Hits real Khoj/Odin/Casa via VPN
  → Run once per sprint (not on every commit)

E2E Golden Paths (full stack)
  → 10 scripted flows via HTTP against running server
  → Run nightly + before sprint review
```

---

## CHAT-Q-001: Node unit test scaffold + make_base_state factories
**Sprint:** 1 | **SP:** 3 | **Status:** ⬜

**Description:**  
Set up the test infrastructure before writing any actual node tests.

**Deliverables:**
- `tests/conftest.py` — shared fixtures: `mock_redis`, `mock_classifier`, `mock_llm`, `mock_executor`
- `tests/factories.py` — `make_test_session()`, `make_classification()`, `make_base_state()` (same as pipeline, but importable in tests)
- `tests/fixtures/` — sample API responses for all tool executors

**See:** `docs/testing/testing-guide.md` `build_test_graph()` pattern

**Acceptance Criteria:**
- [ ] `pytest tests/unit/ -v` runs in < 10s with no real I/O
- [ ] `MockClassifier`, `MockLLM`, `MockToolExecutor`, `MockDomainRouter` all implemented
- [ ] Fixture files for: `searchProperties_results.json`, `getPropertyDetail_response.json`, `resolveEntity_powai.json`, `getTrendingLocalities_mumbai.json`

---

## CHAT-Q-002: Unit tests — classification nodes
**Sprint:** 1 | **SP:** 5 | **Status:** ⬜

**Tests to write:**

| Test | What it checks |
|---|---|
| `test_safety_node_blocks_injection` | "ignore previous instructions" → `bot_response` set |
| `test_safety_node_allows_valid_query` | "show me 2bhk" → passes |
| `test_normalize_node_nfkc` | Unicode normalization applied |
| `test_normalize_node_passes_long_city_names` | thiruvananthapuram not flagged |
| `test_route_domain_out_of_scope_fast_path` | domain=out_of_scope → no Stage 2 call |
| `test_validate_slm_cross_domain_rejection` | locality intent from property_search domain → out_of_scope |
| `test_validate_slm_unknown_intent` | hallucinated intent → out_of_scope |
| `test_validate_slm_coerces_string_locality` | `localities: "Andheri"` → `["Andheri"]` |
| `test_validate_slm_coerces_clarification_bool` | `clarification_needed: true` → question string |

**Acceptance Criteria:**
- [ ] All tests pass with mocked adapters (no real Anthropic calls)
- [ ] Each test file has a docstring explaining what the node does

---

## CHAT-Q-003: Unit tests — processing nodes
**Sprint:** 2 | **SP:** 5 | **Status:** ⬜

| Test | What it checks |
|---|---|
| `test_filter_apply_add_semantics_first_mention` | First amenities ADD = list, not replace |
| `test_filter_apply_replace_semantics_bhk` | bhk [2,3] → delta [3] = [3] (REPLACE) |
| `test_filter_apply_skips_on_clarification` | clarification_needed set → no filter applied |
| `test_sanitize_clears_bhk_on_locality_pivot` | pivot=True → bhk cleared |
| `test_derive_price_per_sqft_conversion` | price_per_sqft=15000, bound=max → price_max set |
| `test_clarify_emits_nested_qna` | clarification_needed set → bot_response = login template shape |
| `test_resolve_entities_ordinal_lookup` | "2nd locality" → carousel_state[2] |
| `test_route_node_tier1_contact_seller` | contact_seller → Tier 1, bot_response set |
| `test_route_node_requires_auth_no_token` | saved_properties + no auth_token → login template |
| `test_route_node_tier3a_sends_to_llm` | filter_search → routing={tier:'3a', model:'haiku'} |

---

## CHAT-Q-004: Integration tests — tool executors hit real APIs
**Sprint:** 2 | **SP:** 5 | **Status:** ⬜

**Run with:** `pytest tests/integration/ --run-integration -v`

**Tests:**

```python
@pytest.mark.integration
async def test_resolve_entity_powai():
    """Real autosuggest call. Powai should resolve with confidence > 0.90."""
    result = await resolve_entity("Powai", "locality", city_hint="Mumbai")
    assert result["uuid"] is not None
    assert result["confidence"] >= 0.90
    assert "Powai" in result["display_name"]

@pytest.mark.integration
async def test_search_properties_returns_results():
    """Real Khoj call. 2BHK buy in Bandra should return results."""
    result = await search_properties({"bhk": [2], "localities": ["loc_ban_w"], "service": "buy"})
    assert result["total_count"] > 0
    assert len(result["hits"]) > 0
    assert "property_id" in result["hits"][0]

@pytest.mark.integration
async def test_all_tool_executors_have_correct_response_shapes():
    """Contract test: real API response matches ToolRecord.return_schema_summary fields."""
    # See REQUIRED_KEYS in docs/testing/testing-guide.md
```

**Acceptance Criteria:**
- [ ] All tool executors pass smoke tests against real APIs
- [ ] Any shape mismatch fails loudly with a clear diff message
- [ ] Tests complete in < 60s total (all executors)

---

## CHAT-Q-005: Unit tests — response nodes
**Sprint:** 2 | **SP:** 5 | **Status:** ⬜

| Test | What it checks |
|---|---|
| `test_summary_node_emits_for_template_intent` | filter_search → Phase 1 summary emitted |
| `test_summary_node_skips_text_only_intent` | property_about → no summary |
| `test_summary_node_eagerness_guard` | entity confidence < 0.70 → summary skipped |
| `test_summary_node_skips_tier2` | routing.tier=2 → summary_node is no-op |
| `test_respond_node_emits_property_carousel` | pre_fetched_data has searchProperties → carousel event |
| `test_respond_node_sequence_number_with_summary` | summary_emitted=True → carousel seq=1 |
| `test_followup_node_sequence_number_calc` | summary_emitted=True, template_count=1 → followup seq=2 |
| `test_validate_output_blocks_url` | https://... in text → removed |
| `test_validate_output_allows_table_for_comparison` | `|---|---|` in comparison intent → not blocked |
| `test_emit_final_state_login_template` | Tier 0 out_of_scope → correct event shape |

---

## CHAT-Q-006 → CHAT-Q-009: E2E Golden Paths (Sprint 3)

### CHAT-Q-006: Golden path #1 — Property search → carousel → property detail
**Sprint:** 3 | **SP:** 3 | **Status:** ⬜

**Flow:**
```
1. GET /api/v1/chat/get-conversation-id → conversationId
2. POST /api/v1/chat/send-message-streamed: "show me 2bhk in bandra"
   → connection_ack
   → message_delta (Phase 1 summary)
   → chat_event (Phase 1 text, seq:0, IN_PROGRESS)
   → chat_event (Phase 2 property_carousel, seq:1, IN_PROGRESS)
   → message_delta × N (Phase 3 streaming)
   → chat_event (Phase 3 text, seq:2, COMPLETED)
3. POST: tap "Details" on first property → user_action intent
4. POST: "show me 2bhk in bandra" with new message "tell me more"
   → property_about response (text only, seq:0)
```

**Assertions at each step:**
- [ ] SSE events arrive in correct order (seq 0 before seq 1 before seq 2)
- [ ] `property_carousel.data.properties` has ≥ 1 item
- [ ] `property_about` response has content from `getPropertyDetail` (not hallucinated)
- [ ] Session persisted: `GET /api/v1/chat/get-conversation-details` returns all messages

---

### CHAT-Q-007: Golden path #2 — Comparison (Sonnet)
**Sprint:** 3 | **SP:** 3

Flow: "compare Andheri and Bandra for 2BHK buy"  
→ SLM classifies as `comparison/compare_localities` (Tier 3b, Sonnet)  
→ 6 parallel fetches (getLocalityDetail × 2, getPriceTrends × 2, getTransactionHistory × 2)  
→ Sonnet synthesises markdown comparison table  
→ validate_output allows table (intent_allowlist for comparison)

### CHAT-Q-008: Golden path #3 — Out of scope
Flow: "tell me a joke" → SLM domain_router returns out_of_scope → canned response in < 200ms (no LLM call)

### CHAT-Q-009: Golden path #4 — Clarification flow
Flow: "looking for a flat" → SLM outputs `clarification_needed: "Rent or buy?"` → nested_qna emitted → user taps "Buy" → filter_search executes

---

## CHAT-Q-010 → CHAT-Q-015: Additional Golden Paths (Sprint 4)

| # | Scenario | Key validation |
|---|---|---|
| 10 | explore_nearby (share_location) | `share_location` template → user grants → lat/lng in next turn |
| 11 | portfolio/saved_properties (auth) | anonymous user → login template; logged-in → carousel |
| 12 | calculator/calculate_emi (Tier 1) | "EMI for 1Cr at 8.5%" → direct computation, no LLM |
| 13 | Hindi: "doosri locality dikhao" | ordinal resolved from Turn N-1 carousel |
| 14 | Pivot: search → locality → search | filters cleared on pivot, carried keys preserved |
| 15 | Error recovery: SLM timeout | SLM times out → fallback to out_of_scope, stream completes with error SSE |

---

## CHAT-Q-016 + CHAT-Q-017: Model Eval Runner (Sprint 4)

**See:** `docs/testing/testing-guide.md` Calibrated Model Evaluation section.

```bash
# Domain router eval (100 cases)
pytest tests/model_eval/domain_router/ --real-model -v

# Property search classifier eval (150 cases)  
pytest tests/model_eval/property_search/ --real-model -v
```

**Minimum case counts and tags (from testing-guide.md):**
- domain_router: 100 cases, ≥20 Hindi, ≥10 ordinal, ≥10 low_confidence
- property_search: 150 cases, ≥30 Hindi price units, ≥20 pivot, ≥15 multi_intent

**Target accuracy:**
- domain_router: ≥98%
- intent_classifier: ≥95% sub_intent per domain

---

## CHAT-Q-018: Load test — 60 concurrent RPS for 5 minutes
**Sprint:** 4 | **SP:** 3 | **Status:** ⬜

**Tool:** locust or k6  
**Target:** 60 chat message RPS sustained (well below 1200 spike, but validates local concurrency)

**Acceptance Criteria:**
- [ ] p95 latency < 3s for Tier 3a turns
- [ ] No memory leak in FastAPI process (monitor with `docker stats`)
- [ ] Redis command latency stays < 5ms p95
- [ ] LLM concurrency gate functions correctly (queue builds, sheds load gracefully at limit)
- [ ] No errors at normal load; graceful 503s when LLM queue fills

---

## QA Principles

1. **Test with real data shapes** — use actual API responses captured from staging, not invented payloads
2. **Test error paths as carefully as happy paths** — the system is only as reliable as its fallbacks
3. **SLM eval cases are living documentation** — add a case every time a production misclassification is found
4. **Never mock Anthropic in integration tests** — the prompt engineering must be validated against the real model
5. **Performance tests are not optional** — the LLM concurrency gate must be validated before Sprint 4 closes
