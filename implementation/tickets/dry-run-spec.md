# Dry Run Mode — Spec & Tickets

**Owner:** @rahul (QA Lead) authors scenarios; @priya implements the executor; @arjun wires BOT_ENV  
**Sprint:** 1 (infrastructure); scenarios added throughout Sprint 1–2

## Why

AI engineers need to develop and test pipeline nodes **without VPN access to real APIs**. The dry run mode:
- Replaces every tool executor with a fixture-based mock
- Keeps the SLM and LLM calls real (or mockable if `--mock-llm` flag set)
- Enables full E2E pipeline runs on any machine, any time
- Is the basis for QA's intent identification test suite

---

## CHAT-Q-DRY-001: DryRunExecutor — fixture-based tool executor
**Sprint:** 1 | **SP:** 3 | **Assignee:** @priya | **Status:** ⬜

**Description:**  
`src/tools/dry_run_executor.py` — implements `CachedExecutorPort` by reading fixture files instead of calling real APIs.

```python
class DryRunExecutor(CachedExecutorPort):
    """
    Returns fixture responses from tests/fixtures/scenarios/{scenario_name}.json.
    Used when BOT_ENV=mock or when --dry-run flag is passed.
    
    Fixture lookup order:
      1. Exact match: tool + hash(params) — for scenario-specific responses
      2. Tool-only match: just the tool name — fallback default for that tool
      3. KeyError → raises ToolFixtureMissing with helpful message
    """
    
    def __init__(self, scenario: str = "default"):
        path = Path(f"tests/fixtures/scenarios/{scenario}.json")
        if not path.exists():
            raise FileNotFoundError(f"Dry run scenario not found: {path}")
        self.fixtures: dict = json.loads(path.read_text())
        self.calls_made: list[dict] = []   # for assertion in tests
    
    async def execute(self, tool: str, params: dict, ttl: int = 0) -> Any:
        self.calls_made.append({"tool": tool, "params": params})
        
        # Try exact key first (tool:param_hash), then tool-only fallback
        param_hash = hashlib.md5(json.dumps(params, sort_keys=True).encode()).hexdigest()[:8]
        exact_key = f"{tool}:{param_hash}"
        
        result = self.fixtures.get(exact_key) or self.fixtures.get(tool)
        if result is None:
            available = [k for k in self.fixtures if k.startswith(tool)]
            raise ToolFixtureMissing(
                f"No fixture for '{tool}' in scenario '{self.scenario}'. "
                f"Available fixtures for this tool: {available or 'none'}. "
                f"Add a fixture or use a different scenario."
            )
        return result

class ToolFixtureMissing(Exception):
    pass
```

**Acceptance Criteria:**
- [ ] `DryRunExecutor("2bhk_bandra_search")` loads the scenario file
- [ ] Calling `execute("searchProperties", {...})` returns the fixture without HTTP
- [ ] `dry_run_executor.calls_made` records every tool call (for test assertions: "was searchProperties called?")
- [ ] Missing fixture raises `ToolFixtureMissing` with a helpful message (not a KeyError)
- [ ] Works with `BOT_ENV=mock` env var — injected automatically when `build_graph()` is called

---

## CHAT-Q-DRY-002: Scenario file format + sample scenarios (QA authors these)
**Sprint:** 1 | **SP:** 5 | **Assignee:** @rahul | **Status:** ⬜

**Description:**  
QA creates the scenario JSON files. These are the "test data" for the dry run. Each scenario covers a complete user intent flow.

### Scenario file format

`tests/fixtures/scenarios/{name}.json`:
```json
{
  "name": "2bhk_bandra_search",
  "description": "User searches for 2BHK in Bandra, gets 5 results, taps Details on 1st",
  "fixtures": {
    "resolveEntity": {
      "uuid": "loc_ban_w_001",
      "display_name": "Bandra West",
      "entity_type": "locality",
      "city": "Mumbai",
      "city_uuid": "cty_mum_001",
      "confidence": 0.97
    },
    "searchProperties": {
      "search_result_set_id": "srset_test_001",
      "total_count": 47,
      "is_last_page": false,
      "hits": [
        {
          "property_id": "prop_ban_001",
          "title": "2BHK in Bandra West",
          "price": 14200000,
          "area_sqft": 985,
          "highlights": ["Gated", "Metro 1.2km"],
          "thumbnail_url": "https://cdn.housing.com/test/prop_ban_001.jpg"
        },
        ... (4 more)
      ]
    },
    "getPropertyDetail": {
      "property_id": "prop_ban_001",
      "title": "2BHK in Bandra West — Silver Heights",
      "price": 14200000,
      "area_sqft": 985,
      "configuration": "2BHK",
      "floor": 8,
      "total_floors": 20,
      "facing": "East",
      "possession": "Ready to move",
      "amenities": ["Gated Community", "Lift", "Parking"],
      "locality": "Bandra West",
      "builder": "Silver Heights Builders",
      "rera_id": "P51900012345",
      "verified": true,
      "seller_id": "sel_ban_001"
    }
  }
}
```

### Minimum required scenarios (Sprint 1 target)

| Scenario file | Intent covered | Key fixtures needed |
|---|---|---|
| `scenarios/2bhk_bandra_search.json` | property_search/filter_search | resolveEntity, searchProperties, getPropertyDetail |
| `scenarios/property_detail.json` | property_detail/property_about | getPropertyDetail, getNearbyLandmarks |
| `scenarios/locality_research.json` | locality_research/trending_localities | resolveEntity, getTrendingLocalities |
| `scenarios/locality_comparison.json` | comparison/compare_localities | resolveEntity×2, getLocalityDetail×2, getPriceTrends×2, getTransactionHistory×2 |
| `scenarios/portfolio_anonymous.json` | portfolio/recent_searches (no auth) | (no API calls — served from session) — **Note: must be run as a 2-turn test.** Turn 1: any property_search turn that populates `session.search_history`. Turn 2: "show my recent searches". Pass the result of Turn 1's session state as `session=` arg to `run_dry_pipeline()` for Turn 2. |
| `scenarios/portfolio_saved.json` | portfolio/saved_properties (auth) | getSavedProperties |
| `scenarios/contact_seller.json` | property_detail/contact_seller | getPropertyDetail (already have property_id) |
| `scenarios/clarification_flow.json` | Any intent with clarification | resolveEntity (returns 2 candidates → triggers nested_qna) |
| `scenarios/out_of_scope.json` | out_of_scope — no fixtures needed | (empty fixtures: {}) |
| `scenarios/hindi_ordinal.json` | pivot + ordinal reference | same as 2bhk_bandra_search (reuse) |

**Acceptance Criteria:**
- [ ] All 10 scenario files created and committed to `tests/fixtures/scenarios/`
- [ ] Each scenario has a `description` field explaining what it tests
- [ ] `make dry-run SCENARIO=2bhk_bandra_search` runs the full pipeline and prints SSE events
- [ ] Property data in fixtures is plausible (real Mumbai localities, realistic prices)

---

## CHAT-Q-DRY-003: BOT_ENV=mock wiring + `make dry-run` target
**Sprint:** 1 | **SP:** 2 | **Assignee:** @arjun | **Status:** ⬜

**Description:**  
Wire `DryRunExecutor` into the app when `BOT_ENV=mock`. Add `make dry-run` Makefile target.

**In `src/pipeline/graph.py`:**
```python
def build_graph(
    emit_sse: Callable,
    session_store: SessionStorePort,
    registry: RegistryPort,
    executor: CachedExecutorPort | None = None,   # if None, resolved from BOT_ENV
    ...
) -> CompiledGraph:
    if executor is None:
        if settings.bot_env == "mock":
            scenario = os.getenv("DRY_RUN_SCENARIO", "default")
            executor = DryRunExecutor(scenario=scenario)
        else:
            executor = HttpToolExecutor(settings)
    ...
```

**Makefile target:**
```makefile
dry-run:  ## Run full pipeline with mocked tools. Usage: make dry-run SCENARIO=2bhk_bandra_search MSG="show me 2bhk in bandra"
	BOT_ENV=mock DRY_RUN_SCENARIO=$(SCENARIO) python -m src.tools.dry_run \
	  --message "$(MSG)" \
	  --conversation-id "dry-run-conv-001" \
	  --print-events
```

**`src/tools/dry_run.py` CLI:**
```python
"""
Runs the full LangGraph pipeline with a dry run executor and prints all SSE events.
Useful for intent debugging without VPN or real API keys.

Usage:
  python -m src.tools.dry_run --message "show me 2bhk in bandra" --scenario 2bhk_bandra_search
  make dry-run SCENARIO=2bhk_bandra_search MSG="show me 2bhk in bandra"
"""
```

**Output format:**
```
[connection_ack]  { messageId: "...", messageState: "IN_PROGRESS" }
[message_delta]   chunk 0: "I see you're looking for..."
[chat_event]      seq:0  type:text  state:IN_PROGRESS
[chat_event]      seq:1  type:template  templateId:property_carousel  (47 results)
[message_delta]   chunk 0: "Good spread across Bandra West..."
[chat_event]      seq:2  type:text  state:COMPLETED
────────────────────────────────────
Classification: property_search/filter_search (confidence: 0.97)
Domain router:  property_search (Stage 1: 45ms)
Classifier:     filter_search  (Stage 2: 112ms)
Tools called:   resolveEntity (fixture), searchProperties (fixture)
Total time:     ~180ms (SLM) + LLM streaming
```

**Acceptance Criteria:**
- [ ] `make dry-run SCENARIO=2bhk_bandra_search MSG="show me 2bhk in bandra"` runs without VPN
- [ ] Prints all SSE events in order with timing
- [ ] Shows classification result (domain, main_intent, sub_intent, filter_delta)
- [ ] Tools used + whether fixture or real
- [ ] Works on a fresh machine with just `ANTHROPIC_API_KEY` set (no other API keys needed in mock mode)

---

## CHAT-Q-DRY-004: Intent identification test suite (QA authors)
**Sprint:** 2 | **SP:** 5 | **Assignee:** @rahul | **Status:** ⬜

**Description:**  
A pytest test suite that runs each scenario through the full pipeline and asserts on intent classification + SSE event structure. This is the "mocked integration test" that AI engineers run on every commit.

```python
# tests/dry_run/test_intent_flows.py

@pytest.mark.parametrize("message,scenario,expected_intent", [
    ("show me 2bhk in bandra", "2bhk_bandra_search", ("property_search", "filter_search")),
    ("tell me about this property", "property_detail", ("property_detail", "property_about")),
    ("compare Andheri and Bandra", "locality_comparison", ("comparison", "compare_localities")),
    ("show my saved properties", "portfolio_saved", ("portfolio", "saved_properties")),
    ("tell me a joke", "out_of_scope", ("out_of_scope", "out_of_scope_query")),
    ("doosri locality dikhao", "2bhk_bandra_search", ("property_search", "filter_search")),  # Hindi ordinal
])
async def test_intent_identified_correctly(message, scenario, expected_intent, mock_graph):
    """Pipeline correctly classifies the message and emits the right SSE events."""
    events = await run_dry_pipeline(message=message, scenario=scenario)
    
    main, sub = expected_intent
    assert events.classification["main_intent"] == main
    assert events.classification["sub_intent"] == sub
    assert any(e["type"] == "chat_event" and e["sourceMessageState"] == "COMPLETED" for e in events.sse)

@pytest.mark.parametrize("message,scenario,expected_template", [
    ("show me 2bhk in bandra", "2bhk_bandra_search", "property_carousel"),
    ("compare Andheri and Bandra", "locality_comparison", None),  # text-only
])
async def test_correct_template_emitted(message, scenario, expected_template, mock_graph):
    events = await run_dry_pipeline(message=message, scenario=scenario)
    template_events = [e for e in events.sse if e.get("templateId")]
    if expected_template:
        assert any(e["templateId"] == expected_template for e in template_events)
    else:
        assert len(template_events) == 0
```

**Acceptance Criteria:**
- [ ] Test suite covers all 10 scenarios
- [ ] Runs in < 60s on any machine (SLM still real, tools mocked)
- [ ] Can be run with `BOT_ENV=mock pytest tests/dry_run/ -v` (no VPN needed)
- [ ] Each test failure message clearly states what was expected vs what was classified

---

## How Dry Run Enables Independent Development

```
Without dry run:
  AI engineer makes a change to filter_apply_node
  → Must run full pipeline
  → Needs VPN to hit Khoj/Odin
  → Needs a working chat-demo
  → Takes 10 minutes to verify

With dry run:
  AI engineer makes a change to filter_apply_node
  → make dry-run SCENARIO=2bhk_bandra_search MSG="show me 2bhk in bandra under 80L"
  → Pipeline runs in ~2s
  → SSE events printed, intent + filter_delta visible
  → No VPN, no FE, no Kafka, no PostgreSQL needed
  → Takes 5 seconds to verify
```

**The dry run is NOT a test of tool correctness** — it tests pipeline logic (nodes, classification, session, SSE flow) with controlled, predictable tool responses. Real API tests are in `tests/integration/`.
