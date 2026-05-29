# Dry Run Runner — Implementation Spec

The dry run runner is the workhorse of Layer 3 testing. It runs the full pipeline with fixture tools and exposes a clean API for test assertions.

---

## `run_dry_pipeline()` — the test API

Every dry run test uses this function. It abstracts the graph construction and returns a structured result.

```python
# tests/dry_run/runner.py

@dataclass
class DryRunResult:
    """Everything a test needs to assert on after running the pipeline."""
    
    # Classification result (from validate_slm_node)
    domain:         str          # Stage 1 output
    main_intent:    str
    sub_intent:     str
    filter_delta:   dict
    entities:       list[dict]
    clarification:  str | None
    pivot:          bool
    
    # Session state (after pipeline completes)
    session:        dict         # Full session state post-turn
    
    # SSE events (in emission order)
    sse_events:     list[SSEEvent]
    
    # Tool calls (what DryRunExecutor received)
    tool_calls:     list[dict]   # [{"tool": "searchProperties", "params": {...}}, ...]
    
    # Performance
    total_ms:       int
    stage1_ms:      int          # domain router
    stage2_ms:      int          # intent classifier
    
    # Convenience properties
    @property
    def completed_event(self) -> SSEEvent | None:
        return next((e for e in self.sse_events if e.source_message_state == "COMPLETED"), None)
    
    @property
    def template_events(self) -> list[SSEEvent]:
        return [e for e in self.sse_events if e.message_type == "template"]
    
    @property
    def text_events(self) -> list[SSEEvent]:
        return [e for e in self.sse_events if e.message_type in ("text", "markdown")]
    
    @property
    def tools_called(self) -> list[str]:
        return [c["tool"] for c in self.tool_calls]
    
    def tool_was_called(self, tool: str) -> bool:
        return tool in self.tools_called
    
    def template_was_emitted(self, template_id: str) -> bool:
        return any(e.template_id == template_id for e in self.template_events)


async def run_dry_pipeline(
    message:         str,
    scenario:        str = "default",
    session:         dict | None = None,           # pre-populated session state
    conversation_id: str = "dry-run-conv-001",
    request_id:      str = "dry-run-req-001",
    mock_llm:        bool = False,                 # True = mock LLM too (no Anthropic call)
    llm_response:    str = "Dry run LLM response.", # used when mock_llm=True
) -> DryRunResult:
    """
    Run the full LangGraph pipeline with fixture-based tool executors.
    SLM (domain router + classifier) and LLM are real Anthropic calls unless mock_llm=True.
    
    Usage:
        result = await run_dry_pipeline(
            message="show me 2bhk in bandra",
            scenario="2bhk_bandra_search",
        )
        assert result.main_intent == "property_search"
        assert result.sub_intent == "filter_search"
        assert result.template_was_emitted("property_carousel")
    """
    executor = DryRunExecutor(scenario=scenario)
    
    if mock_llm:
        llm_adapter = MockLLM(text=llm_response)
        router_adapter = MockDomainRouter(domain="property_search", confidence=0.95)
        classifier_adapter = MockClassifier(make_classification())
    else:
        llm_adapter = AnthropicStreamingAdapter(settings)
        router_adapter = AnthropicChatAdapter(settings)       # Stage 1
        classifier_adapter = AnthropicChatAdapter(settings)   # Stage 2
    
    sse_events: list[SSEEvent] = []
    
    def capture_emit(event_type: str, data: dict):
        sse_events.append(SSEEvent(event_type=event_type, **data))
    
    state = make_base_state(
        raw_message=message,
        session=session or make_test_session(conversation_id=conversation_id),
        request_id=request_id,
    )
    
    graph = build_graph(
        emit_sse=capture_emit,
        executor=executor,
        router=router_adapter,
        classifier=classifier_adapter,
        llm=llm_adapter,
        session_store=InMemorySessionStore(),   # no Redis needed for dry run
        registry=NoOpRegistryAdapter(),
    )
    
    start = time.monotonic()
    final_state = await graph.ainvoke(state)
    total_ms = int((time.monotonic() - start) * 1000)
    
    classification = final_state.get("classification") or {}
    
    return DryRunResult(
        domain       = final_state.get("domain", "unknown"),
        main_intent  = classification.get("main_intent", ""),
        sub_intent   = classification.get("sub_intent", ""),
        filter_delta = classification.get("filter_delta", {}),
        entities     = classification.get("entities_mentioned", []),
        clarification= classification.get("clarification_needed"),
        pivot        = classification.get("pivot", False),
        session      = final_state.get("session", {}),
        sse_events   = sse_events,
        tool_calls   = executor.calls_made,
        total_ms     = total_ms,
        stage1_ms    = 0,   # populated from timing logs
        stage2_ms    = 0,
    )
```

---

## InMemorySessionStore — no Redis needed

For dry run tests, session state lives in memory. No Redis connection, no TTL management.

```python
class InMemorySessionStore(SessionStorePort):
    """In-memory session store for testing. Thread-safe for single-turn tests."""
    
    def __init__(self, initial_state: dict | None = None):
        self._state = initial_state or {}
        self._version = 0
    
    async def load(self, session_id: str) -> dict:
        return dict(self._state)
    
    async def save(self, session_id: str, state: dict, expected_version: int) -> bool:
        if expected_version != self._version:
            return False   # simulate optimistic lock conflict
        self._state = dict(state)
        self._version += 1
        return True
    
    async def load_turns(self, conversation_id: str) -> list:
        return self._state.get("_turns", [])
    
    async def push_turn(self, conversation_id: str, turn: dict) -> None:
        turns = self._state.get("_turns", [])
        turns.insert(0, turn)
        self._state["_turns"] = turns[:20]  # LTRIM 0 19
```

---

## Test patterns

### Pattern 1: Assert classification
```python
async def test_filter_search_classification():
    result = await run_dry_pipeline(
        message="show me 2bhk in bandra under 80 lakhs",
        scenario="2bhk_bandra_search",
    )
    assert result.main_intent == "property_search"
    assert result.sub_intent == "filter_search"
    assert result.filter_delta.get("bhk") == [2]
    assert result.filter_delta.get("price_max") == 8_000_000
    assert not result.clarification
    assert not result.pivot
```

### Pattern 2: Assert SSE event structure
```python
async def test_template_intent_3_phases():
    result = await run_dry_pipeline(
        message="show me 2bhk in bandra",
        scenario="2bhk_bandra_search",
    )
    # Phase 1: summary
    phase1 = [e for e in result.sse_events if e.sequence_number == 0]
    assert any(e.message_type == "text" and e.source_message_state == "IN_PROGRESS"
               for e in phase1)
    
    # Phase 2: template
    assert result.template_was_emitted("property_carousel")
    carousel = result.template_events[0]
    assert carousel.sequence_number == 1
    
    # Phase 3: followup
    assert result.completed_event is not None
    assert result.completed_event.sequence_number == 2
    
    # Events arrive in order
    seqs = [e.sequence_number for e in result.sse_events if e.sequence_number is not None]
    assert seqs == sorted(seqs)
```

### Pattern 3: Assert tool calls
```python
async def test_correct_tools_called_for_filter_search():
    result = await run_dry_pipeline(
        message="show me 2bhk in bandra",
        scenario="2bhk_bandra_search",
    )
    assert result.tool_was_called("resolveEntity")
    assert result.tool_was_called("searchProperties")
    assert not result.tool_was_called("getPropertyDetail")  # not called for search
```

### Pattern 4: Assert session mutation
```python
async def test_session_updated_after_filter_search():
    result = await run_dry_pipeline(
        message="show me 2bhk in bandra",
        scenario="2bhk_bandra_search",
    )
    assert result.session["city"] == "Mumbai"
    assert result.session["transaction_type"] == "buy"
    assert result.session["active_filters"]["bhk"] == [2]
    assert result.session["active_locality_id"] == "loc_ban_w_001"
```

### Pattern 5: Multi-turn conversation
```python
async def test_bhk_add_semantics_across_turns():
    """2BHK search → 'also 3BHK' → bhk should be [2,3], not [3]."""
    
    # Turn 1
    r1 = await run_dry_pipeline(
        message="show me 2bhk in bandra",
        scenario="2bhk_bandra_search",
    )
    assert r1.filter_delta["bhk"] == [2]
    session_after_t1 = r1.session
    
    # Turn 2 — continue with session from Turn 1
    r2 = await run_dry_pipeline(
        message="3bhk as well",
        scenario="2bhk_bandra_search",
        session=session_after_t1,
    )
    assert r2.filter_delta.get("bhk") == [2, 3]   # ADD, not REPLACE
    assert not r2.pivot   # same intent, same domain
```

### Pattern 6: Short-circuit assertion
```python
async def test_out_of_scope_single_event_no_llm():
    result = await run_dry_pipeline(
        message="tell me a joke",
        scenario="out_of_scope",
        mock_llm=True,   # if LLM IS called, this will fail (MockLLM returns generic text)
    )
    assert result.main_intent == "out_of_scope"
    assert result.completed_event is not None
    assert len(result.sse_events) <= 2   # connection_ack + single event
    assert not result.tool_calls         # no tool calls for out_of_scope
```

### Pattern 7: Error path
```python
async def test_slm_timeout_fallback(monkeypatch):
    """When SLM times out, pipeline falls back to out_of_scope."""
    async def timeout_router(*args, **kwargs):
        raise asyncio.TimeoutError()
    
    monkeypatch.setattr("src.adapters.anthropic_chat.AnthropicChatAdapter.route", timeout_router)
    
    result = await run_dry_pipeline(
        message="show me 2bhk in bandra",
        scenario="2bhk_bandra_search",
    )
    assert result.main_intent == "out_of_scope"
    assert result.completed_event is not None
    # The error was handled gracefully — stream completed
```

---

## Scenario authoring guide

Good scenario files are precise, plausible, and cover edge cases.

**Checklist for a new scenario:**
- [ ] Entity names are real Mumbai/India localities, projects (Bandra, Powai, Lodha Palava)
- [ ] Prices are realistic (2BHK in Mumbai = ₹80L–2.5Cr range)
- [ ] `confidence` in resolveEntity responses is > 0.85 (unless testing ambiguity)
- [ ] `search_result_set_id` is present in searchProperties (srset_id used downstream)
- [ ] `property_id` values are consistent across fixtures (same ID in search hits + property detail)
- [ ] At least 3 properties in search results (pagination, carousel rendering)
- [ ] `highlights` array has 2-3 realistic items ("Gated", "Metro nearby", "Verified")
- [ ] `seller_id` present in property fixtures (needed for contact_seller template)

**What makes a BAD scenario:**
- Invented prices (₹5 Cr for a 1BHK in Dharavi) — will confuse anyone reading test failures
- Missing required fields — fixture lookup succeeds but downstream parsing fails
- `confidence: 0.0` on resolve — should use the clarification_flow scenario for that test
- All `hits[0].property_id` the same — makes cross-turn ordinal tests non-deterministic
