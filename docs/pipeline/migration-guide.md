# Before / After: Architecture Migration Notes

What changed from the previous design and why. Reference for engineers upgrading legacy code.

---

## Part 6 — Before / After: What Changes

### Before: validate_tool_call

```python
# Before: required params hardcoded, duplicated from tool schema
def validate_tool_call(tool, params):
    required_params = {
        'searchProperties':  ['filters'],
        'getPropertyDetail': ['property_id'],
        'getPriceTrends':    ['locality', 'city', 'transaction_type'],
        'resolveEntity':     ['raw_name', 'entity_type'],
        'contactSeller':     ['property_id', 'seller_id'],
        'calculateEMI':      ['property_price'],
        # ... manually maintained list
    }
```

```python
# After: derived from TOOL_REGISTRY — no duplication
def validate_tool_call(tool, params):
    required = get_required_params(tool)  # from TOOL_REGISTRY
    missing  = [k for k in required if k not in params]
    # custom multi-field validations remain (calculate_affordability, get_nearby_landmarks, convert_unit)
    # but required param lists live in one place
```

### Before: TOOLS_BY_INTENT

```python
# Before: 8 separate maps, all manually kept in sync
TOOLS_BY_INTENT = {
    'filter_search':  ['searchProperties', 'resolveEntity'],
    'explore_nearby': ['searchProperties'],
    'property_about': ['getPropertyDetail', 'getNearbyLandmarks'],
    # ...
}
TOOLS_BY_SUBINTENT_HAIKU = { ... }  # copy #2
DIRECT_INTENT_MAP = { ... }          # copy #3
def derive_routing_tier(intent): ...  # copy #4
def select_tier3_model(intent): ...   # copy #5
```

```python
# After: one source, four derived functions
get_tools_for_intent(main, sub)   # replaces TOOLS_BY_INTENT + TOOLS_BY_SUBINTENT_HAIKU
get_tier_for_intent(main, sub)    # replaces derive_routing_tier()
get_model_for_intent(main, sub)   # replaces select_tier3_model()
requires_auth(main, sub)          # replaces inline auth checks
```

### Before: sanitize_filters_on_pivot

```python
# Before: filter keys hardcoded inline
def sanitize_filters_on_pivot(classification, session):
    if pivot_to == 'locality_research':
        del session['active_filters']['bhk']        # hardcoded
        del session['active_filters']['price_min']  # hardcoded
        del session['active_filters']['price_max']  # hardcoded
        # ... more hardcoded keys
```

```python
# After: derived from FILTER_REGISTRY
def sanitize_filters_on_pivot(classification, session):
    to_intent     = classification['main_intent']
    keys_to_clear = get_filters_to_clear_on_pivot(to_intent)  # from FILTER_REGISTRY
    for k in keys_to_clear:
        session['active_filters'].pop(k, None)
```

### Before: Adding a new intent (8 places)

```
1. classifier prompt taxonomy section
2. TOOLS_BY_INTENT
3. TOOLS_BY_SUBINTENT_HAIKU
4. DIRECT_INTENT_MAP
5. build_session_state_block()
6. derive_routing_tier()
7. select_tier3_model()
8. sanitize_filters_on_pivot()
```

### After: Adding a new intent (1 place + 1 prompt block example)

```
1. INTENT_REGISTRY — add one IntentRecord
2. prompts/slm/examples/<intent>.md — add examples for the new intent
   (The intent taxonomy in the SLM prompt rebuilds from the registry automatically)
```

### Before: Adding a new filter (4 places)

```
1. SLM prompt filter_delta section
2. searchProperties input schema in system prompt
3. validateToolCall required params
4. Khoj API translation table
```

### After: Adding a new filter (1 place)

```
1. FILTER_REGISTRY — add one FilterRecord
   (SLM prompt filter block, Khoj param mapping, validation all derive from it automatically)
```

### Before: LLM data fetching (6 sequential round trips for compare_localities)

```
User turn
  └─ LLM: "I need getLocalityDetail for Andheri"     [+100ms wait]
  └─ Orchestrator executes tool, returns result
  └─ LLM: "I need getPriceTrends for Andheri"         [+100ms wait]
  └─ Orchestrator executes tool, returns result
  └─ LLM: "I need getRatingsReviews for Andheri"      [+100ms wait]
  └─ Orchestrator executes tool, returns result
  └─ LLM: "I need getLocalityDetail for Bandra"       [+100ms wait]
  └─ Orchestrator executes tool, returns result
  └─ LLM: "I need getPriceTrends for Bandra"          [+100ms wait]
  └─ Orchestrator executes tool, returns result
  └─ LLM: "I need getRatingsReviews for Bandra"       [+100ms wait]
  └─ LLM generates final response
Total API wait: ~600ms + 6 prompt/completion round trips
```

### After: fetch_data_node pre-fetch (6 parallel fetches, 1 LLM call)

```
User turn
  └─ fetch_data_node: asyncio.gather([
       get_locality_detail(Andheri),   # ─┐
       get_price_trends(Andheri),      #  │ ~150ms total
       get_ratings_reviews(Andheri),   #  │ (parallel)
       get_locality_detail(Bandra),    #  │
       get_price_trends(Bandra),       #  │
       get_ratings_reviews(Bandra),    # ─┘
     ], return_exceptions=True)
  └─ build_prompt_node: injects all 6 results inline into system prompt
  └─ LLM: ONE call, streams comparison response immediately
Total API wait: ~150ms + 0 tool round trips
```

### Before: LLM-visible tool set (every Haiku call saw all tools)

```python
# Before: LLM prompt always included all tool definitions (~1500-3000 tokens)
tools = [
    'searchProperties', 'resolveEntity', 'getPropertyDetail', 'getNearbyLandmarks',
    'getPriceTrends', 'getLocalityDetail', 'getRatingsReviews', 'calculateEMI',
    'calculateAffordability', 'convertUnit', 'shortlistProperty', 'contactSeller', ...
]
# Risk: LLM could call any tool; hallucinated param values; contract drift
```

### After: LLM-visible tool set (only residual tools, usually empty)

```python
# After: for 31 of 32 intents, tool list is empty
tools = []   # LLM has one job: NLG over pre-fetched data

# Only property_about passes one residual tool:
tools = [get_tool_record('getNearbyLandmarks')]  # combined "tell me about + what's nearby" queries
# Prompt savings: ~1500–3000 tokens per Haiku call (40–50% reduction)
```

---

