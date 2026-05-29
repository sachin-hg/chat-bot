# Testing Strategy

## Philosophy

**Every requirement in every doc has a test. Every test can run in isolation.**

The dry run infrastructure is not a dev convenience — it is the primary integration testing harness. It makes requirements verifiable without VPN, without running databases, without the full stack. It is how AI engineers prove that a node change does what the docs say it should do.

```
Requirement in docs
    ↓
Test case in matrix (requirements-test-matrix.md)
    ↓
Implemented test in tests/
    ↓
CI gate on every commit
```

---

## Test Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 4: E2E Golden Paths                                      │
│  Full stack: real BE + real FE (chat-demo) + real APIs         │
│  When: nightly + before sprint review                           │
│  Speed: 5-10 min                                               │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: Dry Run Integration                                   │
│  Full pipeline + real SLM/LLM + fixture tool responses         │
│  When: on every commit (AI/ML changes), pre-merge gate         │
│  Speed: < 60s for full scenario suite                          │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: Unit Tests                                            │
│  Single component, all dependencies mocked                     │
│  When: on every commit, < 30s                                   │
│  Speed: < 30s                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: Model Eval (calibrated accuracy)                     │
│  SLM/LLM quality, labeled examples, real API calls             │
│  When: before every deploy, weekly scheduled run               │
│  Speed: 5-15 min                                               │
├─────────────────────────────────────────────────────────────────┤
│  Layer 0: Contract Tests                                        │
│  Real APIs, shape validation, --run-integration flag           │
│  When: once per sprint                                          │
└─────────────────────────────────────────────────────────────────┘
```

### What each layer tests

| Layer | Tests | Does NOT test |
|---|---|---|
| 0: Contract | Real API response shapes match ToolRecord schema | Pipeline logic, LLM quality |
| 1: Model Eval | SLM classification accuracy, LLM rubric score | Infrastructure, API contracts |
| 2: Unit | Node logic, helper functions, registry integrity | End-to-end flow, real AI |
| 3: Dry Run | Full pipeline flow, SSE event ordering, classification+response correctness | Real API shapes, load |
| 4: E2E | Full stack including FE rendering | Unit isolation |

---

## Dry Run as Primary Integration Harness

### Why the dry run is right for integration testing

Traditional integration tests have two failure modes:
1. Test fails because the business logic is wrong ← what we want to catch
2. Test fails because an external API is slow, down, or returns unexpected data ← noise

The dry run eliminates failure mode 2 by replacing all external API calls with deterministic fixture responses. This means:
- A test failure is always a logic failure, never a network failure
- Tests run in < 60s on any machine, any time
- AI engineers can develop a node and test its full pipeline behaviour without VPN
- The same test scenarios run in CI as run locally — no environment-specific failures

### What the dry run still validates (real calls)

The dry run is NOT a full mock. The SLM (Haiku domain router + classifier) and LLM (Haiku/Sonnet) are **real Anthropic API calls**. This means:
- Classification quality is tested against the real model
- LLM response format adherence is tested
- Prompt cache behaviour is tested
- The full pipeline timing is realistic

The dry run mocks **only the tool executors** (Khoj/Odin/Casa/Venus API calls).

### The contract: scenario files are specifications

A scenario file (`tests/fixtures/scenarios/{name}.json`) is both:
1. A **test fixture** (what the executor returns for this test)
2. A **specification** (the shape that the real API is contractually required to return)

When `CHAT-D-008` (GraphQL bridge check) runs and finds a shape mismatch between the scenario fixture and the real API response, the scenario fixture wins — the real API response is considered wrong and must be adapted. This is the contract-first approach.

---

## Requirements Traceability

Every requirement is tagged in the docs and maps to a test case. Format:

```
[REQ-node-NNN] in docs → test function → layer
```

See `requirements-test-matrix.md` for the full mapping.

**How to add a new requirement:**
1. Document it in the relevant doc file with a `[REQ-XXX]` tag
2. Add an entry to `requirements-test-matrix.md`
3. Write the test (unit or dry run depending on what it exercises)
4. Add the test to `make test` so it runs in CI

---

## Test Suite Structure

```
tests/
├── conftest.py                     # Shared fixtures, MockAdapters, factories
├── factories.py                    # make_base_state, make_test_session, make_classification
│
├── unit/                           # Layer 2 — fast, no I/O
│   ├── nodes/
│   │   ├── test_safety_node.py
│   │   ├── test_normalize_node.py
│   │   ├── test_route_domain_node.py
│   │   ├── test_classify_node.py
│   │   ├── test_validate_slm_node.py
│   │   ├── test_filter_apply_node.py
│   │   ├── test_sanitize_node.py
│   │   ├── test_derive_node.py
│   │   ├── test_clarify_node.py
│   │   ├── test_resolve_entities_node.py
│   │   ├── test_route_node.py
│   │   ├── test_summary_node.py
│   │   ├── test_respond_node.py
│   │   ├── test_build_prompt_node.py
│   │   ├── test_llm_node.py
│   │   ├── test_validate_output_node.py
│   │   └── test_followup_node.py
│   ├── helpers/
│   │   ├── test_filter_apply.py    # apply_filter_delta logic
│   │   ├── test_validate_output.py # OUTPUT_RULES, intent_allowlist
│   │   ├── test_summary_builders.py
│   │   ├── test_template_builders.py
│   │   └── test_session_state.py   # merge, sanitize_on_pivot
│   └── registries/
│       ├── test_intent_registry.py  # integrity, every record has required fields
│       ├── test_tool_registry.py
│       └── test_filter_registry.py
│
├── dry_run/                        # Layer 3 — full pipeline, fixture tools
│   ├── scenarios/                  # (symlink to tests/fixtures/scenarios/)
│   ├── runner.py                   # run_dry_pipeline() helper used by all tests
│   ├── test_classification_flows.py     # Intent correctly identified for each scenario
│   ├── test_sse_event_structure.py      # SSE events in correct order, correct shapes
│   ├── test_session_state_mutation.py   # Session updated correctly after each turn
│   ├── test_filter_delta_application.py # Filters correctly applied across turns
│   ├── test_short_circuit_paths.py      # Tier 0/1/2, auth-gate, out_of_scope
│   ├── test_clarification_flows.py      # nested_qna, user selection, continuation
│   ├── test_pivot_behaviour.py          # session state on domain switch
│   ├── test_multiturn_flows.py          # full 5+ turn conversations
│   └── test_error_paths.py              # SLM timeout, tool error, LLM error
│
├── model_eval/                     # Layer 1 — accuracy, real SLM/LLM
│   ├── domain_router/
│   │   └── cases.jsonl             # 100+ labeled cases
│   ├── property_search/
│   │   └── cases.jsonl             # 150+ labeled cases
│   ├── property_detail/
│   │   └── cases.jsonl
│   ├── locality/
│   │   └── cases.jsonl
│   ├── project_research/
│   │   └── cases.jsonl
│   ├── portfolio/
│   │   └── cases.jsonl
│   └── llm_tier3a/
│       └── cases.jsonl             # LLM rubric eval cases
│
├── integration/                    # Layer 0 — real APIs, shape contracts
│   └── test_tool_contracts.py
│
├── e2e/                            # Layer 4 — full stack
│   └── golden_paths/
│       ├── test_property_search_flow.py
│       └── ...
│
└── fixtures/
    ├── scenarios/                  # Dry run scenario files
    │   ├── default.json            # Generic fallback
    │   ├── 2bhk_bandra_search.json
    │   ├── property_detail.json
    │   ├── locality_research.json
    │   ├── locality_comparison.json
    │   ├── portfolio_anonymous.json
    │   ├── portfolio_saved.json
    │   ├── contact_seller.json
    │   ├── clarification_flow.json
    │   ├── out_of_scope.json
    │   └── hindi_ordinal.json
    └── api_responses/              # Real captured API responses (for contract tests)
        ├── searchProperties_sample.json
        └── ...
```

---

## CI Pipeline

```yaml
# Every commit:
- make test-unit          # < 30s, no I/O, always green or something is broken
- make test-dry-run       # < 60s, real SLM/LLM, fixture tools

# Pre-merge (PR gate):
- make test-unit
- make test-dry-run
- make eval               # Model eval with --real-model (5-15 min)

# Weekly scheduled:
- make test-integration   # Real APIs, --run-integration
- make test-e2e           # Full stack golden paths

# Before deploy:
- make test-unit
- make test-dry-run
- make eval
- make test-integration
```

---

## Developer Testing Contract

When a developer changes a node:
1. Run `make test-unit` → should pass in < 30s
2. Run `make dry-run SCENARIO=<relevant_scenario> MSG="<test message>"` → inspect SSE events
3. Run `make test-dry-run` → full suite must pass
4. If changing SLM prompts: run `make eval` → accuracy must not drop below threshold

When a developer adds a new intent:
1. Add scenario file to `tests/fixtures/scenarios/`
2. Add entries to `requirements-test-matrix.md`
3. Write unit tests for the new node/helper logic
4. Write dry run test asserting intent is correctly classified and SSE flow is correct
5. Add model eval cases (≥20 examples with edge cases)

When a developer changes a tool executor:
1. Run `make test-unit` on the executor
2. Run `make test-dry-run` (uses fixtures — verifies pipeline still works)
3. Run `make test-integration` (hits real API — verifies shape is still correct)
