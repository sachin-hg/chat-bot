# AI/ML Backlog — @priya (AI/ML Lead)

**Canonical docs:**
- `docs/pipeline/` — All node implementations
- `docs/registries/` — INTENT_REGISTRY, TOOL_REGISTRY, FILTER_REGISTRY
- `docs/classification/slm-classifier.md` — Two-stage SLM cascade
- `docs/llm/` — System prompt, tool contracts, lifecycle
- `docs/models/model-registry.md` — MODEL_REGISTRY

---

## CHAT-P-001: INTENT_REGISTRY + TOOL_REGISTRY + FILTER_REGISTRY Python modules
**Sprint:** 1 | **SP:** 3 | **Status:** ⬜

**Description:**  
Translate the three registries from docs into Python modules. These are the source of truth for everything downstream — SLM prompts, tool execution, filter logic.

**Files to create:**
```
src/registries/
├── __init__.py
├── intent_registry.py     # INTENT_REGISTRY list[IntentRecord]
├── tool_registry.py       # TOOL_REGISTRY list[ToolRecord]
├── filter_registry.py     # FILTER_REGISTRY list[FilterRecord]
└── helpers.py             # get_intent_record(), get_tool_record(), get_data_fetch_plan()
```

**See:** `docs/registries/intent-registry.md`, `docs/registries/tool-registry.md`, `docs/registries/filter-registry.md`

**Acceptance Criteria:**
- [ ] `get_intent_record("property_search", "filter_search")` returns the correct `IntentRecord`
- [ ] `get_data_fetch_plan("property_search", "filter_search")` returns `[DataRequirement(tool='searchProperties', ...)]`
- [ ] All 70+ IntentRecords implemented (use the docs as spec)
- [ ] All 30+ ToolRecords implemented with correct `input_params`, `cache_ttl_seconds`, `llm_visible`
- [ ] `build_intent_taxonomy_block(domain)` generates the SLM prompt Section 2 from registry
- [ ] `build_filter_delta_block(domain)` generates Section 3
- [ ] Registry integrity check runs on startup (see `docs/pipeline/registry-integrity.md`)

**Technical Notes:**  
The docs contain the full registry in Python dataclass syntax. Copy-translate directly. The registry must be runnable on Python import — no external I/O.

---

## CHAT-P-002: BotState TypedDict + make_base_state factory
**Sprint:** 1 | **SP:** 1 | **Status:** ⬜

**Description:**  
`src/pipeline/state.py` — the BotState TypedDict and `make_base_state(**overrides)` factory.

**See:** `docs/pipeline/pipeline-preamble.md` for the full TypedDict definition.

**Acceptance Criteria:**
- [ ] All fields present exactly as documented
- [ ] `make_base_state()` with no args returns valid minimal state
- [ ] `make_base_state(raw_message="test")` works
- [ ] All Optional fields default to None

---

## CHAT-P-003: Anthropic adapter — DomainRouterPort (Stage 1 SLM)
**Sprint:** 1 | **SP:** 3 | **Status:** ⬜

**Description:**  
`src/adapters/anthropic_chat.py` — implements `DomainRouterPort`.  
Stage 1 of the two-stage SLM cascade. Takes a user message + session context, returns `{domain, confidence}`.

**Model:** `claude-haiku-4-5-20251001` (from MODEL_REGISTRY)  
**Timeout:** 500ms  
**Max retries:** 1  

**See:** `docs/classification/slm-classifier.md` Stage 1 section + `docs/models/model-registry.md` domain_router entry.

**Prompt file:** `prompts/slm/domain_router.md` (create this file)

**Acceptance Criteria:**
- [ ] Returns `DomainRouterOutput(domain="property_search", confidence=0.97)` for "show me 2bhk in mumbai"
- [ ] Returns `domain="out_of_scope"` for "tell me a joke"
- [ ] Handles timeout (500ms) → falls back to `session.last_domain` or `out_of_scope`
- [ ] Emits `domain_routing` structured log event after every call
- [ ] Model ID read from `MODEL_REGISTRY["domain_router"].model_id` (not hardcoded)

---

## CHAT-P-004: Anthropic adapter — ClassifierPort (Stage 2 SLM)
**Sprint:** 1 | **SP:** 3 | **Status:** ⬜

**Description:**  
Stage 2 domain-scoped intent classifier. Takes domain + message + history, returns full `SLMOutput`.

**Model:** `claude-haiku-4-5-20251001`  
**Timeout:** 2000ms  
**Max retries:** 2  

**See:** `docs/classification/slm-classifier.md` Stage 2 section.

**Acceptance Criteria:**
- [ ] For domain="property_search" + message="show me 2bhk in bandra under 80L":
  - Returns `main_intent="property_search"`, `sub_intent="filter_search"`
  - `filter_delta = {"bhk": [2], "localities": ["Bandra"], "price_max": 8000000}`
- [ ] `out_of_scope` domain → returns canned classification immediately (zero API call)
- [ ] Emits `slm_classification` structured log event
- [ ] `reasoning` field trimmed to ≤30 words

---

## CHAT-P-005: Domain prompt files (all 5 domains) — auto-generated from registry
**Sprint:** 1 | **SP:** 5 | **Status:** ⬜

**Description:**  
Create `prompts/slm/domain_router.md` and `prompts/slm/domains/{property_search,property_detail,locality,project_research,portfolio}.md`.

Sections 2 and 3 of each domain prompt are **auto-generated at startup** from the registry, NOT hardcoded. The static Section 1 (role + output schema) IS authored.

**Files:**
```
prompts/slm/
├── domain_router.md                    # Stage 1 — static, authored
└── domains/
    ├── property_search.md              # Sections 2+3 generated; Section 1 authored
    ├── property_detail.md
    ├── locality.md
    ├── project_research.md
    └── portfolio.md
```

**Generation script:** `python -m src.slm.generate_prompts` — regenerates Sections 2+3 from registry, validates token budget.

**Acceptance Criteria:**
- [ ] `python -m src.slm.generate_prompts` succeeds without errors
- [ ] Each domain prompt ≤ max token budget (property_search ≤ 950 tokens)
- [ ] Adding a new IntentRecord to registry + re-running the script updates the prompt
- [ ] `registry_hash` computed from registry JSON; stored in prompt header comment; used as cache key

**Technical Notes:**  
See `docs/classification/slm-classifier.md` Section 2 "NOTE: auto-generated" for the full explanation of what's generated vs authored.

---

## CHAT-P-006: safety_node + normalize_node
**Sprint:** 1 | **SP:** 2 | **Status:** ⬜

**Description:**  
First two pipeline nodes. Fastest path — no AI, pure Python.

**safety_node:** Regex + pattern matching for content safety. Blocks: injection attempts ("ignore previous instructions"), personal data requests, explicit content patterns.

**normalize_node:** Unicode normalization, trim whitespace. Does NOT extract prices or entities (SLM handles that).

**See:** `docs/pipeline/classification-nodes.md` safety_node and normalize_node sections.

**Acceptance Criteria:**
- [ ] "ignore previous instructions" → `bot_response` set, graph short-circuits to END
- [ ] "2BHK in Powai" → passes safety, normalized (trimmed, NFKC)
- [ ] Long Indian city names ("thiruvananthapuram") not flagged as gibberish
- [ ] "aaa" single-character repeated → `normalized_message` set, `normalize_node` sets `bot_response` for near-empty input

---

## CHAT-P-007: route_domain_node + classify_node + validate_slm_node
**Sprint:** 1 | **SP:** 5 | **Status:** ⬜

**Description:**  
The classification pipeline: Stage 1 router → Stage 2 classifier → validation.

**Implements:**
- `route_domain_node(state, router: DomainRouterPort)` — calls CHAT-P-003 adapter
- `classify_node(state, classifier: ClassifierPort)` — calls CHAT-P-004 adapter; fast path for `out_of_scope`
- `validate_slm_node(state)` — all guardrails from `docs/pipeline/classification-nodes.md`
- `DOMAIN_MAIN_INTENTS` dict (already defined in preamble)

**Acceptance Criteria:**
- [ ] `out_of_scope` domain skips classify_node (zero SLM tokens)
- [ ] Cross-domain intent (locality intent from property_search domain) → rejected, routed to `out_of_scope`
- [ ] Unknown intent pair → `unknown_intent` log + `out_of_scope` response
- [ ] Type coercions all work: string locality → list, clarification_needed bool → string/None
- [ ] `DOMAIN_MAIN_INTENTS` includes `calculator` under `property_detail` domain

---

## CHAT-P-008 → CHAT-P-015: (Processing + response nodes — see pipeline docs)
**Sprint:** 1 | **SP varies** | **Status:** ⬜

Each node in `docs/pipeline/processing-nodes.md` and `docs/pipeline/response-nodes.md` is a separate task. @priya assigns to sub-agents or implements directly.

Key implementation guidance per node:
- `filter_apply_node`: ADD vs REPLACE semantics from FILTER_REGISTRY; CHAT-A-008 must be done first (needs session store)
- `derive_node`: price_per_sqft → absolute range conversion; landmark anchor → lat/lng via autosuggest
- `resolve_entities_node`: ordinal resolution (carousel_state) + autosuggest for named entities
- `route_node`: reads from INTENT_REGISTRY `tier`, `requires_auth`, `model`; must handle all 5 tiers
- `summary_node`: SUMMARY_BUILDERS dispatch; eagerness guard (entity confidence ≥ 0.70)
- `build_prompt_node`: FOLLOWUP_PROMPT_BLOCKS dispatch; reads prompt files; constructs LLMContext
- `llm_node`: AnthropicStreamingAdapter; residual tool handling; sequence number calc
- `validate_output_node`: `validate_bot_output(text, current_intent)` with intent_allowlist for markdown_table
- `respond_node`: `build_template_events()`; TEMPLATE_BUILDERS dispatch
- `followup_node`: final COMPLETED event; `registry.ping_session()`; conversation summary trigger

---

## CHAT-P-016 → CHAT-P-033: Tool Executors + Data Layer (Sprint 2)

### CHAT-P-016: CachedExecutorPort + HttpToolExecutor base class
**Sprint:** 2 | **SP:** 3 | **Status:** ⬜

**Description:**  
Base async HTTP client with Redis caching, timeout, retry, circuit breaker.

```python
class HttpToolExecutor(CachedExecutorPort):
    """Base class for all tool executors. Handles: caching, timeout, retry, error mapping."""
    
    async def execute(self, tool: str, params: dict, ttl: int) -> Any:
        cache_key = f"cache:tool:{tool}:{hash_params(params)}"
        
        # 1. Cache read
        if ttl > 0:
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)
        
        # 2. Execute with timeout + retry (from TOOL_REGISTRY[tool].timeout_ms)
        result = await self._call_with_retry(tool, params)
        
        # 3. Cache write
        if ttl > 0:
            await redis.setex(cache_key, ttl, json.dumps(result))
        
        return result
```

**Acceptance Criteria:**
- [ ] Cache TTL per tool from TOOL_REGISTRY (`cache_ttl_seconds`)
- [ ] Timeout per tool from TOOL_DEFAULT_TIMEOUTS (2000ms default)
- [ ] 1 retry on 503/timeout, immediate fail on 4xx
- [ ] After 3 consecutive failures: circuit opens (log `circuit_open`, return error stub)
- [ ] `invalidate_cache(tool, session_id)` for getSavedProperties after shortlist

### CHAT-P-017: Tool executor — resolveEntity (autosuggest)
**Sprint:** 2 | **SP:** 3 | **Status:** ⬜

This is the most critical tool — every entity mention goes through it. Must handle:
- Locality names (Andheri, Powai, "Andheri West")
- Project names (Lodha Palava, M3M Escala)
- City names (Mumbai, Bangalore)
- Ambiguous names → return top 3 candidates for clarify_node

**Acceptance Criteria:**
- [ ] "Powai" → `{uuid: "loc_pow_001", display_name: "Powai", city: "Mumbai", entity_type: "locality"}`
- [ ] "Andheri" → 2 candidates (Andheri East, Andheri West) → triggers clarification
- [ ] Prior carousel context boosts confidence (entity appeared in Turn N-1 → +0.15 score)
- [ ] `confidence < 0.70` → not injected into session (eagerness guard downstream)

### CHAT-P-018 → CHAT-P-026: Remaining tool executors
Each tool maps to: the documented API backend + the ToolRecord's `input_params` + wire format translation.

**Implementation pattern for each:**
```python
class SearchPropertiesExecutor(HttpToolExecutor):
    BASE_URL = settings.khoj_base_url
    
    async def call(self, params: dict) -> dict:
        wire_params = translate_to_wire_format("searchProperties", params)
        response = await self.http_client.get(f"{self.BASE_URL}/v2/search", params=wire_params)
        return map_response(response.json())   # normalize to TOOL_REGISTRY return schema
```

**Wire format translation** is documented in `docs/llm/tool-contracts.md` "Orchestrator API Translation" section.

---

## CHAT-P-034: HandoffContext at session init
**Sprint:** 3 | **SP:** 3 | **Status:** ⬜

**Description:**  
When the unified gateway redirects to Search & Discovery, it passes a `HandoffContext` in the first `ChatEventFromUser.handoff_context` field. The pipeline must initialize session state from it.

**See:** `docs/pipeline/pipeline-preamble.md` BotState + `docs/operations/platform-integration.md` Section 2.

**Acceptance Criteria:**
- [ ] `HandoffContext` parsed from first request body
- [ ] `session.active_property_id` set from `handoff_context.shared_entities.active_property_id`
- [ ] `session.handoff_summary` populated and included in first LLM prompt
- [ ] Turn 1 bot response acknowledges the context ("I see you recently purchased Housing Premium...")

---

## CHAT-P-035: Conversation summarizer (async Haiku)
**Sprint:** 4 | **SP:** 3 | **Status:** ⬜

**Description:**  
When `conv:turns` LLEN reaches 20, trigger async Haiku summarization call off the critical path.

**Implementation:** `followup_node` publishes a `chat.llm_summaries` Kafka message. A separate background worker consumes it, calls Haiku, writes result to `conv:summary:{id}`.

**Acceptance Criteria:**
- [ ] Does not add latency to the turn that triggers it (truly async)
- [ ] Summary ≤ 250 tokens
- [ ] Next turn's `build_prompt_node` includes summary in `[CONVERSATION HISTORY SUMMARY]` block
- [ ] If summarization fails: old summary stays (not cleared)

---

## CHAT-P-036: A/B experiment_node — ExperimentConfig hot-reload
**Sprint:** 4 | **SP:** 3 | **Status:** ⬜

**Description:**  
Load `experiments.yaml` from config dir. Hot-reload every 60s (file watcher or periodic poll). `experiment_node` resolves active experiments for this session.

**See:** `docs/models/ab-experiments.md` ExperimentConfig section.

**Acceptance Criteria:**
- [ ] Adding an experiment to `experiments.yaml` takes effect within 60s without restart
- [ ] `experiment_id` and `experiment_variant` written to BotState and appear in all subsequent logs
- [ ] `model_variant` experiment correctly overrides `routing['model']`
- [ ] Empty `experiments.yaml` = no experiments (normal flow)

---

## AI/ML Architecture Decisions

### Why two-stage SLM cascade?
At 1M messages/day, a monolithic 2,650-token prompt for all intents costs ~$600/day cached. The cascade (200 tokens Stage 1 + 800 tokens Stage 2) costs ~$449/day — 25% cheaper and independently cacheable per domain. See `docs/classification/slm-classifier.md`.

### Why Haiku for most LLM calls?
Tier 3a (most intents) uses Haiku. Tier 3b (comparison, multi_intent synthesis) uses Sonnet. Sonnet is only justified when genuine multi-source synthesis is needed. See `docs/models/model-registry.md` llm_tier3b selection guide.

### Prompt files are NOT hardcoded
The system prompt is assembled from:
- Static files in `prompts/llm/` (cached by Anthropic's prompt cache)
- Registry-generated taxonomy in `prompts/slm/domains/` (auto-generated on startup)

Never edit generated sections — edit the registry and re-run `make generate-prompts`.
