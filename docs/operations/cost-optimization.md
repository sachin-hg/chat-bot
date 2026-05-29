# Cost and Performance Optimisation

## Guiding Principle

Cost and latency are optimised at the **routing layer**, not by degrading what the LLM does. The LLM only runs when it genuinely needs to. When it does run, it gets a leaner context and a narrower tool set — not less capability.

Correctness is non-negotiable. A wrong answer is worse than saying "I don't know."

---

## Four-Tier Routing

Every inbound message is classified and routed to one of four tiers. Lower tiers are faster and cheaper.

```
Inbound message
      │
      ▼
Is it a structured card action?  (intent frame from FE, not free text)
      │
      ├── YES ──► Tier 1: Direct Tool Call  (no SLM, no LLM)
      │
      └── NO ──► SLM Classifier  (~100ms, Claude Haiku)
                        │
            ┌───────────┼───────────────┐
            │           │               │
       routing=       routing=       routing=
       direct         llm          rag_needed
            │           │               │
         Tier 2      Tier 3          Tier 4
      SLM-routed    Full LLM      Graceful RAG
      Direct Tool   Pipeline      Deflection
```

---

## Tier 1: Direct Tool Call (No AI)

**When:** User taps a structured card action — any `user_message` frame with a known `intent` field from FE.

These intents are fully deterministic. The Bot Orchestrator maps intent + params → tool call → template response. No SLM. No LLM.

```typescript
const DIRECT_INTENT_MAP: Record<string, DirectHandler> = {
  property_detail:      { tool: 'getPropertyDetail',     params: ['property_id'] },
  similar_properties:   { tool: 'getSimilarProperties',  params: ['property_id'] },
  view_images:          { tool: 'getPropertyImages',      params: ['property_id'] },
  view_floor_plans:     { tool: 'getFloorPlans',          params: ['property_id'] },
  view_amenities:       { tool: 'getPropertyAmenities',   params: ['property_id'] },
  view_payment_plan:    { tool: 'getPaymentPlan',         params: ['project_id']  },
  shortlist:            { tool: 'shortlistProperty',      params: ['property_id'] },
  contact_seller:       { tool: 'initiateContact',        params: ['property_id', 'seller_id'] },
  search_in_locality:   { tool: 'searchProperties',       params: ['locality_id'] },  // from locality_carousel
  locality_reviews:     { tool: 'getLocalityReviews',     params: ['locality_id'] },
  price_trends:         { tool: 'getLocalityPriceTrends', params: ['locality_id'] },
  paginate:             { tool: 'paginateSearch',         params: ['srset_id', 'page'] },
  entity_selected:      { handler: 'applyEntitySelection' },  // nested_qna resolution
  auth_complete:        { handler: 'retryAfterAuth' },
  location_shared:      { handler: 'processLocation' },       // from location_shared user_action
  location_denied:      { handler: 'locationFallback' },      // from location_denied user_action
  location_not_available: { handler: 'locationFallback' },    // from location_not_available user_action
  sort:                 { tool: 'applyFilter',            params: ['srset_id', 'sort_by'] },
  // Utility tools — Tier 1 when triggered from card actions with known params
  view_landmarks:       { tool: 'getNearbyLandmarks',     params: ['property_id'] },
  view_recent_searches: { tool: 'getRecentSearches',      params: ['user_id'] },
  view_history:         { tool: 'getViewedProperties',    params: ['user_id'] },
  // Calculators — Tier 2 when SLM extracts all params from free text; Tier 1 from card actions
  calculate_emi:        { handler: 'computeEMI' },
  calculate_affordability: { handler: 'computeAffordability' },
  convert_unit:         { handler: 'computeUnitConversion' },
};
```

**Response generation for Tier 1:**
- Template is returned to FE from tool result.
- Text prefix (if any) is pulled from a **static template string**, not generated.
- Followups are **deterministic** (see below).

```typescript
const DIRECT_RESPONSE_TEXT: Record<string, string> = {
  property_detail:    '',  // no text prefix — card speaks for itself
  view_images:        '',
  view_floor_plans:   '',
  view_amenities:     '',
  view_payment_plan:  '',
  similar_properties: 'Here are similar properties:',
  locality_reviews:   'Here are reviews for {locality_name}:',
  price_trends:       'Price trends for {locality_name}:',
  shortlist:          'Saved to your shortlist.',
  paginate:           'Here are the next {count} properties:',
};
```

**Estimated share of interactions: 35–40%.** These are zero-LLM interactions.

---

## Tier 2: SLM-Routed Direct Tool (SLM Only, No LLM)

**When:** User types free text but SLM classifies it with high confidence into a single, unambiguous intent that maps to a direct tool call.

Examples:
- "show me floor plans" → `{intent: view_floor_plans, confidence: 0.97}`
- "show more" → `{intent: paginate, confidence: 0.99}`
- "sort by price" → `{intent: sort, sort_by: price_asc, confidence: 0.95}`
- "save this property" → `{intent: shortlist, confidence: 0.96}`
- "show me 3BHK properties" → `{filter_delta: {apartment_type_id:[3]}, intent: filter_refine, confidence: 0.92}`
- "show me 3BHK as well" → `{filter_delta: {apartment_type_id:[3]}, modifier: "additive", intent: filter_refine, confidence: 0.91}`
- "i meant rent" → `{intent: switch_transaction_type, to: "rent", confidence: 0.99}`
- "what's the EMI on this 80L flat" → `{intent: calculate_emi, params: {property_price: 8000000}, confidence: 0.96}`
- "convert 1500 sqft to sq yards" → `{intent: convert_unit, params: {value: 1500, from: "sqft", to: "sqyard"}, confidence: 0.99}`
- "show me what I looked at before" → `{intent: view_history, confidence: 0.94}`

SLM outputs structured classification. Bot Orchestrator handles the rest without LLM.

**Threshold:** `confidence >= 0.90` AND `intent` is in `DIRECT_INTENT_MAP`. Below 0.90 or for ambiguous intent → escalate to Tier 3.

**Hard escalation to Tier 3 regardless of SLM confidence:**
- SLM returns a price filter (`price_min` / `price_max` / `price_per_sqft`) → Bot Orchestrator checks the value against price sanity thresholds for the current `service` before acting. If the value is impossible or ambiguous in the current context, escalate to Tier 3 (LLM generates the clarification question). The SLM is not trained on domain price ranges and cannot make this judgment.
- SLM returns `modifier: "additive"` on a BHK filter → Bot Orchestrator appends to `apartment_type_id` array instead of replacing. No LLM needed for this, but the orchestrator must check for the `modifier` field explicitly.

**Estimated share of interactions: 25–30%.** These use Haiku (~20x cheaper than Sonnet).

---

## Tier 3: Full LLM Pipeline (SLM + LLM)

**When:** Query requires reasoning, multi-tool orchestration, nuanced entity resolution, response composition, or comparison. Also used whenever a constraint is impossible or ambiguous in the current context — the LLM generates the clarification question, no tool is called.

SLM still runs first — its output pre-populates:
- `main_intent` and `sub_intent` (reducing LLM reasoning overhead)
- Extracted entities (names to resolve)
- Filter deltas already identified
- The **tool set to load** (by intent)
- The **model to use** (Haiku or Sonnet, see Model Selection below)

LLM receives this as structured context and focuses on execution rather than classification.

### Tier 3a vs Tier 3b: Model Split

Not all Tier 3 turns need Sonnet. The orchestrator selects the model before calling the LLM:

| Tier | Model | When |
|---|---|---|
| 3a | Haiku | Single tool call, resolved entity, simple filter change + search, no comparison |
| 3b | Sonnet | Multi-tool orchestration, entity disambiguation, comparison, clarification generation, portfolio |

**Context window also differs:** Haiku calls get the last 3 turns. Sonnet calls get the full 10 turns. This further reduces Haiku token cost.

**Clarification-first pattern (no tool called):**
When the LLM detects that a user signal is impossible or ambiguous in the current session context, it outputs a clarification message and nothing else — no `searchProperties`, no `applyFilter`. The turn costs one LLM call but prevents a wrong search from polluting conv:state.

Common triggers:
- Price number impossible for current `service` (e.g. "30K" in buy) → ask rent-vs-sqft
- Price number implausible for current `service` (e.g. "2Cr" in rent) → ask buy-vs-rent
- Transaction type switch implied by price but not stated explicitly → confirm before switching

Clarification generation always uses Sonnet (nuanced judgment required).

**Estimated share of interactions: 30–35%.** Of that, ~40% eligible for Tier 3a (Haiku).

---

## Tier 4: RAG Deflection (SLM Classifies, Deterministic Response)

**When:** SLM identifies the query requires RAG — criteria not indexable in ES/DB, requiring semantic search over review/description text.

No LLM call. Bot Orchestrator returns a deterministic deflection + alternative offer.

Covered in detail below.

---

## SLM Classifier Design

Model: **Claude Haiku** (`claude-haiku-4-5-20251001`). Fast (~100–200ms), structured output, cheap.

The SLM does not generate natural language. It outputs a structured JSON object only.

### Input to SLM

```
[System]
You are a message classifier for a property search chat. Output only valid JSON.
No explanation. No prose.

[Context — injected per request, minimal]
chat_domain: search_discovery
main_intent: property_search
active_transaction_type: rent
active_city: mumbai
active_locality: powai
active_filters_summary: 2bhk, price_max 60000

[User message]
"show me only furnished options and sort cheapest first"
```

The SLM gets a **stripped-down context** — just current domain, intent, active entity names (not IDs), and active filter summary. No turn history. No tool definitions.

### SLM Output Schema

```typescript
interface SLMClassification {
  chat_domain: ChatDomain;
  main_intent: MainIntent;
  sub_intent: SubIntent;
  routing: 'direct' | 'llm' | 'rag_needed';
  confidence: number;            // 0.0 – 1.0
  filter_delta: {                // extracted filter changes from message
    apartment_type_id?: number[];
    apartment_type_modifier?: 'replace' | 'additive';  // default replace; "as well/also/too" → additive
    price_min?: number;
    price_max?: number;
    price_per_sqft?: number;     // set when user gives per-sqft price; orchestrator must convert
    needs_price_sanity_check?: boolean;  // set when price value is present; orchestrator validates domain
    furnishing?: string[];
    property_type?: string[];
    amenities?: string[];
    sort_by?: string;
    // ... other filter fields
  };
  entities_mentioned: Array<{
    raw_name: string;
    inferred_type: 'locality' | 'landmark' | 'builder' | 'project' | 'unknown';
  }>;
  rag_reason?: string;           // populated only when routing=rag_needed
  rag_category?: RagCategory;   // populated only when routing=rag_needed
}

type RagCategory =
  | 'subjective_quality'      // "good reviews", "good schools"
  | 'infrastructure_issue'    // "water logging", "power cuts", "flooding"
  | 'hyperlocal_sentiment'    // "friendly neighbourhood", "safe for kids"
  | 'construction_quality'    // "no seepage issues", "good build quality"
  | 'vastu_or_custom';        // everything else requiring semantic understanding
```

### SLM System Prompt (Full)

```
You are a message classifier for a property search chatbot. Output ONLY valid JSON matching this schema. No other text.

ROUTING RULES:
- routing=direct: message maps to a single unambiguous action with confidence >= 0.90
  Examples: "show more", "save this", "show floor plans", "sort by price", "furnished only"
- routing=llm: message requires reasoning, entity resolution, multi-step orchestration, or comparison
  Examples: "compare this with DLF Privana", "show me 2bhk in bandra near metro", "what's the price trend here"
- routing=rag_needed: query requires criteria not supported by any filter or structured tool
  RAG signals: infrastructure quality (water supply, flooding, power cuts), subjective neighbourhood
  quality, construction quality issues, sentiment about specific problems.
  When in doubt between llm and rag_needed, choose llm — only classify rag_needed when confident.

FILTER EXTRACTION:
- Extract ONLY what the user explicitly stated. Do not infer.
- Price: convert "50k" → 50000. "1 cr" → 10000000. "12k per sqft" → set price_per_sqft: 12000 (not price_max).
  Always set needs_price_sanity_check: true whenever any price field is present.
  Do NOT validate whether the price makes sense in the current context — the orchestrator does that.
- BHK: "2bhk" → apartment_type_id: [2]. "2 or 3 bhk" → [2,3]. "studio" → ["studio"].
  Additive markers (as well, also, too, and X, include X): set apartment_type_modifier: "additive".
  Replacement markers (instead, only, just): set apartment_type_modifier: "replace".
  No qualifier: default apartment_type_modifier: "replace".
- Do not extract city or locality here — mark them in entities_mentioned.

CONFIDENCE:
- 0.95+ : Unambiguous, single interpretation
- 0.85-0.94: Likely correct, minor ambiguity
- 0.70-0.84: Plausible but uncertain
- <0.70: Set routing=llm regardless of intent
```

### Bot Orchestrator: Using SLM Output

```typescript
async function routeMessage(
  frame: UserMessageFrame,
  classification: SLMClassification,
  session: Session
): Promise<void> {

  // Tier 2: SLM-routed direct
  if (
    classification.routing === 'direct' &&
    classification.confidence >= 0.90 &&
    DIRECT_INTENT_MAP[classification.sub_intent]
  ) {
    // Price sanity check: orchestrator validates domain before applying
    if (classification.filter_delta.needs_price_sanity_check) {
      const priceIssue = checkPriceSanity(classification.filter_delta, session.service);
      if (priceIssue === 'impossible' || priceIssue === 'ambiguous') {
        // Escalate to LLM to generate the clarification question — no search fired
        const toolSet = selectToolSet(classification.main_intent);
        await executeLLMPipeline(frame, classification, session, toolSet);
        return;
      }
      // priceIssue === null → valid, continue
    }

    // Apply filter deltas with additive/replace semantics for apartment_type_id
    if (Object.keys(classification.filter_delta).length > 0) {
      await applyFilterDelta(session.conversation_id, classification.filter_delta, {
        apartment_type_mode: classification.filter_delta.apartment_type_modifier ?? 'replace',
      });
    }
    await executeDirect(classification.sub_intent, frame.payload, session);
    return;
  }

  // Tier 4: RAG deflection
  if (classification.routing === 'rag_needed') {
    await sendRagDeflection(session, classification.rag_category!, classification.rag_reason!);
    return;
  }

  // Tier 3: Full LLM — select model and context window before calling
  const toolSet = selectToolSet(classification.main_intent, classification.sub_intent);
  const model   = selectTier3Model(classification, session);
  const turns   = CONTEXT_TURNS[model];
  await executeLLMPipeline(frame, classification, session, { toolSet, model, turns });
}

// Price sanity thresholds (India real estate)
function checkPriceSanity(
  delta: SLMClassification['filter_delta'],
  service: 'buy' | 'rent'
): 'impossible' | 'ambiguous' | null {
  const value = delta.price_max ?? delta.price_min ?? delta.price_per_sqft;
  if (!value) return null;

  if (service === 'buy') {
    // ₹30K total buy price → impossible. Could be rent budget or per-sqft.
    if (!delta.price_per_sqft && value < 100_000) return 'impossible';
    // ₹30K/sqft in buy context is valid (high-end) → null
  }

  if (service === 'rent') {
    // ₹2Cr/month rent → implausibly high, likely buy intent
    if (!delta.price_per_sqft && value > 5_000_000) return 'ambiguous';
    // ₹30K/month rent → valid → null
  }

  return null;
}

// Tier 3 model selection — decided by orchestrator, never by LLM
function selectTier3Model(
  classification: SLMClassification,
  session: Session
): 'haiku' | 'sonnet' {
  const { main_intent, sub_intent, entities_mentioned } = classification;

  // Always Sonnet: comparison, clarification, ambiguous entities, portfolio
  if (main_intent === 'comparison') return 'sonnet';
  if (sub_intent === 'clarify') return 'sonnet';
  if (entities_mentioned.length > 1) return 'sonnet';
  if (main_intent === 'portfolio') return 'sonnet';

  // Always Sonnet: price sanity escalation already routed here
  if (classification.filter_delta?.needs_price_sanity_check) return 'sonnet';

  // Haiku-eligible: single tool lookup on resolved entity
  const entityAlreadyResolved =
    entities_mentioned.length === 0 ||
    (entities_mentioned.length === 1 && session.active_locality_id);

  if (entityAlreadyResolved) {
    if (main_intent === 'property_search') return 'haiku';
    if (main_intent === 'property_detail') return 'haiku';
    if (main_intent === 'locality_research' && sub_intent !== 'compare_localities') return 'haiku';
    if (main_intent === 'project_research' && sub_intent !== 'compare_projects') return 'haiku';
  }

  return 'sonnet'; // safe default
}

// Context turns per model — Haiku gets a tighter window to reduce token cost
const CONTEXT_TURNS: Record<'haiku' | 'sonnet', number> = {
  haiku: 3,
  sonnet: 10,
};
```

---

## Model Provider Strategy

The system is not locked to Anthropic. Different tasks suit different models. The right choice is based on benchmarked accuracy for our classification taxonomy + cost per task.

### Model Registry — Single Source of Truth

All model assignments live in `MODEL_REGISTRY` in `solid-architecture.md` Part 15. Every task has a `task_id`, current `model_id`, `QualityContract`, `CostProfile`, and `fallback_behavior`. The adapters implement `DomainRouterPort`, `ClassifierPort`, or `LLMPort` — graph nodes never reference provider SDKs directly.

**Switching a model = updating MODEL_REGISTRY + registering an adapter. No pipeline changes, no prompt changes.**

See `solid-architecture.md` Part 15 for: `ModelAssignment` schema, `PROVIDER_ADAPTERS` registry, `SelfHostedChatAdapter`, `ModelRouter` (A/B integration), and promotion quality gates.

---

### Cost at 1M Messages/Day (Current Model Assignments)

Assumptions: 15% out_of_scope (Stage 1 only), 85% reach Stage 2; 70% of non-OOS reach Tier 3 LLM; 10% of Tier 3 uses Sonnet; 5% of sessions trigger async summarisation.

| Task | Daily calls | Daily cost | Dominant factor |
|---|---|---|---|
| Stage 1 — domain router | 1,000,000 | ~$29 | Output tokens (12 × $4/1M × 1M calls) |
| Stage 2 — property_search classifier | ~425,000 | ~$220 | Output tokens |
| Stage 2 — property_detail classifier | ~170,000 | ~$80 | Output tokens |
| Stage 2 — locality classifier | ~128,000 | ~$65 | Output tokens |
| Stage 2 — project_research classifier | ~43,000 | ~$20 | Output tokens |
| Stage 2 — portfolio classifier | ~85,000 | ~$35 | Smallest domain, lowest cost |
| **Stage 2 subtotal** | ~851,000 | **~$420** | |
| LLM Tier 3a (Haiku) | ~630,000 | ~$430 | Balanced: cache reads + output |
| LLM Tier 3b (Sonnet) | ~70,000 | ~$462 | **7% of calls, 30% of LLM cost** |
| Conversation summariser | ~50,000 | ~$15 | Async, off critical path |
| **Total** | | **~$1,356/day** | **~$495K/year** |

**Key insight: Tier 3b (Sonnet) is the largest single lever.** 7% of calls generates 34% of total AI cost. Strategies:
1. Tighten Tier 3b routing — comparison intents should require TWO explicit named entities before routing to Sonnet; ambiguous comparison queries fall back to Haiku
2. Benchmark Sonnet for comparison vs a fine-tuned Haiku — quality delta may not justify 20× cost difference for straightforward locality comparisons
3. Self-hosted model for comparison synthesis (if quality bar is met)

**SLM cascade saving vs old monolithic single call:**

| | Old (monolithic) | New (cascade) | Saving |
|---|---|---|---|
| SLM daily cost | ~$620/day | ~$449/day | **~$171/day (~$62K/year)** |
| Driver | Output tokens: 150 × 1M × $4/1M = $600 | Stage 1 output: 12 tokens; Stage 2 output: ~100 tokens (850K calls) | 27% output token reduction |

---

### Provider Comparison by Task

| Task (task_id) | Current | Best cost alternative | Blocking concern before switch |
|---|---|---|---|
| `domain_router` | Haiku | Any capable 7B model (self-hosted) | Must hit ≥98% on 5-way domain eval first |
| `intent_classifier_property_search` | Haiku | Gemini Flash (10× cheaper) | Filter extraction accuracy — BHK/price/locality delta; run per-domain eval |
| `intent_classifier_property_detail` | Haiku | Gemini Flash | Entity extraction (ordinal resolution, property names) |
| `intent_classifier_locality` | Haiku | Gemini Flash | Locality name disambiguation (Andheri E vs W, etc.) |
| `intent_classifier_project_research` | Haiku | Self-hosted (tiny domain, 5 sub-intents) | Low volume — cost barely matters; quality validation still required |
| `intent_classifier_portfolio` | Haiku | Self-hosted (simplest domain, 5 sub-intents) | Almost any model works; prime candidate for first self-hosted deployment |
| `llm_tier3a` | Haiku | Gemini Flash | Tool call format fidelity (getNearbyLandmarks mid-stream call) |
| `llm_tier3b` | Sonnet | — | Prompt cache advantage is decisive; no provider match yet |
| `conversation_summarizer` | Haiku | Gemini Flash or self-hosted | Any model that preserves entity names verbatim; easy switch |

### Why Sonnet Wins for Tier 3b — The Cache Math

```
Tier 3b Sonnet: 3,500 cached tokens per call

At 70,000 calls/day:
  Without caching: 3,500 × 70K × $3.00/1M  = $735/day
  With caching:    3,500 × 70K × $0.30/1M  = $73.5/day
  Caching saves: $661.5/day — just on the static system prompt

GPT-4o: auto-caching, hash-based, not controllable. Cache hit rate ~30-40%.
Gemini: explicit cache object API — different cache per session → no shared prompt cache benefit.
Claude: prompt cache is shared across ALL requests with the same prefix. First 5-min window primes it; every request after is cache-read.
```

**Rule:** Use Claude (with prompt caching) whenever the system prompt exceeds ~1,000 tokens and is repeated across requests. Use cheaper models (or self-hosted) for classification tasks where the static prompt is small.

### Self-Hosted Model Strategy

```
Phase 1 (now — explore): portfolio classifier on self-hosted
  - Simplest domain, 5 sub-intents, high accuracy bar easy to meet
  - Candidate: Qwen2.5-7B-Instruct or Llama-3.1-8B-Instruct via vLLM
  - GPU cost at single A100 (80GB): ~$2/hour = ~$48/day
  - vs Haiku cost for portfolio classifier: ~$35/day
  → Self-hosted is MORE expensive at 1M/day volume for a single domain.
  → Break-even is when GPU handles 3+ domains simultaneously.

Phase 2 (when volume justifies): 3-domain SLM on one GPU
  - portfolio + project_research + property_detail classifiers on one vLLM instance
  - Combined Haiku cost for these 3: ~$135/day
  - GPU (2× A100): ~$96/day
  → Break-even crossed. ~$40/day saving (~$15K/year) with full control.

Phase 3 (10M+ calls/day): dedicated GPU cluster for all classifiers
  - All 5 domain classifiers + domain router on self-hosted
  - Haiku cost at 10M/day: ~$4,490/day just for SLM
  - GPU cluster (8× A100): ~$384/day
  → Massive saving at scale. Quality validation is the gating factor, not cost.
```

**Self-hosted is not a cost win at 1M/day for a single domain. It becomes compelling at 3M+/day for multiple domains or when regulatory requirements demand on-premises inference.**

---

## Orchestrator Preprocessing

These transforms run **before** the LLM call for every Tier 3 message. They handle deterministic, rule-based decisions that would waste tokens and introduce unnecessary LLM reasoning if left to the model.

### Unit Conversion (pure math — no LLM)

```typescript
// Area unit normalisation: user says "1000 sqm" or "half an acre"
function convertAreaUnit(value: number, from: 'sqm' | 'acres' | 'guntha' | 'marla'): number {
  const toSqft = { sqm: 10.764, acres: 43560, guntha: 1089, marla: 272.25 };
  return Math.round(value * toSqft[from]);
}

// Per-sqft price to absolute budget range: "₹12K/sqft, 1000–1500 sqft" → { min: 12M, max: 18M }
function convertPricePerSqftToAbsolute(
  pricePerSqft: number,
  areaMin: number,
  areaMax: number
): { min: number; max: number } {
  return { min: pricePerSqft * areaMin, max: pricePerSqft * areaMax };
}
```

If the SLM set `price_per_sqft` in `filter_delta`, the orchestrator:
1. Reads `session.filters.area_min` / `area_max` (from active search state)
2. Calls `convertPricePerSqftToAbsolute` → writes `price_min` / `price_max` into the filter delta
3. Clears `price_per_sqft` from delta — LLM never sees the unconverted field

If area is unknown at conversion time, orchestrator still escalates to Sonnet (not Haiku) so the model can ask for area.

### Ordinal Reference Resolution (deterministic lookup — no LLM)

When a user says "the 3rd one", "that last property", "the second flat" — this is not ambiguous. It's a pointer into the last carousel result set. The orchestrator resolves it before the LLM call.

```typescript
// Resolves "3rd", "second", "last", "that one" → property_id from last carousel
function resolveOrdinalReference(
  text: string,
  lastCarouselIds: string[]   // stored in session.last_carousel_ids[]
): string | null {
  const ordinalMap: Record<string, number> = {
    '1st': 0, 'first': 0, 'one': 0,
    '2nd': 1, 'second': 1, 'two': 1,
    '3rd': 2, 'third': 2, 'three': 2,
    '4th': 3, 'fourth': 3,
    'last': lastCarouselIds.length - 1,
    'that': 0,
  };

  const match = text.match(/\b(1st|2nd|3rd|\d+th|first|second|third|fourth|last|that one|that)\b/i);
  if (!match) return null;

  const idx = ordinalMap[match[1].toLowerCase()] ?? (parseInt(match[1]) - 1);
  return lastCarouselIds[idx] ?? null;
}
```

If resolution succeeds, orchestrator writes `property_id` into the classification before calling the LLM. The LLM receives an already-resolved ID — no ambiguity, no hallucination risk.

### Intent-Specific Session State Injection

The LLM system prompt section 3 (session state) is **not a full dump of `conv:context`**. Only the fields relevant to the current intent are injected. This reduces tokens and prevents the LLM from reasoning about irrelevant state.

```typescript
function buildSessionStateBlock(intent: MainIntent, session: Session): string {
  const base = `chat_domain: ${session.chat_domain}\nmain_intent: ${intent}\nservice: ${session.service}`;

  switch (intent) {
    case 'property_search':
      return `${base}
active_city: ${session.city_name}
active_locality: ${session.locality_name ?? 'not set'}
active_filters: ${JSON.stringify(session.filters)}
srset_id: ${session.srset_id ?? 'none'}
last_result_count: ${session.last_result_count ?? 'unknown'}`;

    case 'property_detail':
      return `${base}
active_property_id: ${session.active_property_id}
active_property_name: ${session.active_property_name ?? 'unknown'}
active_property_coordinates: ${session.active_property_coordinates ? session.active_property_coordinates.join(',') : 'unknown'}
user_coordinates: ${session.user_coordinates ? session.user_coordinates.join(',') : 'not shared'}
last_carousel_ids: [${(session.last_carousel_ids ?? []).join(', ')}]`;

    case 'locality_research':
      return `${base}
active_city: ${session.city_name}
active_locality: ${session.locality_name ?? 'not set'}
active_locality_id: ${session.active_locality_id ?? 'not set'}`;

    case 'comparison':
      return `${base}
active_city: ${session.city_name}
comparison_entities: ${JSON.stringify(session.comparison_entities ?? [])}`;

    case 'portfolio':
      return `${base}\nuser_id: ${session.user_id}`;

    default:
      return base;
  }
}
```

**Token savings vs full context dump:** ~60–80 tokens per call. Small per turn, but cached as part of system prompt — consistent saving.

---

## Token Optimisation

### 1. Selective Tool Loading

Tools are loaded by `main_intent`. The LLM never sees tools irrelevant to the current intent.

```typescript
const TOOLS_BY_INTENT: Record<MainIntent, ToolName[]> = {
  property_search: [
    'resolveEntity', 'reverseGeocode',
    'searchProperties', 'paginateSearch', 'applyFilter',
    'getPropertyCountByRelaxingFilters',
    // NOTE: convertAreaUnit and convertPricePerSqftToAbsolute are NOT in tool definitions.
    // Area conversion and per-sqft price conversion are pure math — done in orchestrator
    // preprocessing before the LLM call. No LLM needed. See Orchestrator Preprocessing below.
    'getTrendingLocalities',
    'getNearbyLocalities',
  ],
  property_detail: [
    'getPropertyDetail', 'getPropertyImages', 'getFloorPlans',
    'getPropertyAmenities', 'getPaymentPlan',
    'getSimilarProperties', 'initiateContact', 'shortlistProperty',
    'getProjectDetail', 'getLocalityDetail',
    'getNearbyLandmarks',   // "what's nearby?" in property context
    'calculateEMI',         // "what's the EMI if I buy this?" in property context
  ],
  locality_research: [
    'resolveEntity', 'reverseGeocode',
    'getLocalityDetail', 'getLocalityReviews', 'getLocalityPriceTrends',
    'getLocalityTransactions', 'getNearbyLocalities',
    'getSimilarLocalities', 'compareLocalities',
  ],
  project_research: [
    'resolveEntity',
    'getProjectDetail', 'getProjectReviews', 'getFloorPlans',
    'getPaymentPlan', 'getLocalityPriceTrends',
    'compareProjects',
  ],
  comparison: [
    'resolveEntity',
    'compareLocalities', 'compareProjects',
    'getProjectDetail', 'getLocalityDetail',
  ],
  portfolio: [
    'getUserSavedProperties', 'getUserContactedProperties',
    'getViewedProperties', 'getRecentSearches',
  ],
  // Calculator intents — triggered conversationally (e.g. "can I afford a 1Cr flat?")
  calculator: [
    'calculateEMI', 'calculateAffordability', 'convertUnit',
  ],
};

// For Tier 3a (Haiku) calls, load an even smaller sub-intent tool subset:
// No resolve/geocode if entity is already in session state.
const TOOLS_BY_SUBINTENT_HAIKU: Partial<Record<SubIntent, ToolName[]>> = {
  filter_refine:      ['searchProperties', 'applyFilter'],
  search_nearby:      ['reverseGeocode', 'searchProperties', 'getNearbyLocalities'],
  locality_detail:    ['getLocalityDetail'],
  locality_reviews:   ['getLocalityReviews'],
  price_trends:       ['getLocalityPriceTrends'],
  project_detail:     ['getProjectDetail'],
  view_floor_plans:   ['getFloorPlans'],
  view_amenities:     ['getPropertyAmenities'],
  view_payment_plan:  ['getPaymentPlan'],
  view_landmarks:     ['getNearbyLandmarks'],
  calculate_emi:      ['calculateEMI'],
  convert_unit:       ['convertUnit'],
};

function selectToolSet(
  mainIntent: MainIntent,
  subIntent?: SubIntent,
  model: 'haiku' | 'sonnet' = 'sonnet'
): ToolName[] {
  if (model === 'haiku' && subIntent && TOOLS_BY_SUBINTENT_HAIKU[subIntent]) {
    return TOOLS_BY_SUBINTENT_HAIKU[subIntent]!;
  }
  return TOOLS_BY_INTENT[mainIntent] ?? [];
}
```

**Token savings:** ~500–600 tokens per Sonnet turn (intent-specific tools vs all tools). For Haiku (Tier 3a), a further ~50% reduction using the sub-intent tool subset. Prompt cache keys are per intent (tool set changes per intent), so cache hits compound across turns.

### 2. Tool Result Summaries — Full JSON to FE, Compact Summary to LLM

The LLM never sees the full tool response JSON. The Bot Orchestrator generates a compact summary before injecting it into the LLM continuation.

> **Architecture note:** Tier A tool results (e.g. `searchProperties`, `getPropertyDetail`) are
> handled as `pre_fetched_data` — `respond_node` uses them to build template cards (property
> carousels, detail cards, etc.) that are sent directly to the FE. The LLM only receives a compact
> textual summary of what was shown, not the raw property JSON. This means the LLM context window is
> significantly smaller than in a design where the LLM receives full API responses directly.

```typescript
function summariseToolResult(toolName: string, result: unknown): string {
  switch (toolName) {
    case 'searchProperties': {
      const r = result as SearchResult;
      const top3 = r.listings.slice(0, 3).map(p =>
        `${p.title} (${p.apartment_type}, ${p.locality}, ${p.price_display}, ${p.highlights.slice(0,2).join(', ')})`
      ).join(' | ');
      return `Found ${r.total_count} properties. Page ${r.page}. Top 3: ${top3}. srset_id: ${r.srset_id}`;
      // ~60 tokens vs ~2,000 tokens for full carousel JSON
    }

    case 'getPropertyDetail': {
      const r = result as PropertyDetail;
      return `${r.title}: ${r.bhk}BHK/${r.bathrooms}bath, ${r.area_sqft}sqft, floor ${r.floor}/${r.total_floors}, ${r.price_display}, ${r.furnishing}, ${r.locality}. Seller: ${r.seller.type}, ${r.seller.response_rate}% response rate. Available: ${r.available_from}.`;
      // ~80 tokens vs ~800 tokens
    }

    case 'getLocalityDetail': {
      const r = result as LocalityDetail;
      return `${r.locality}, ${r.city}: Overall ${r.ratings.overall}/5 (connectivity ${r.ratings.connectivity}, safety ${r.ratings.safety}). Pros: ${r.pros.slice(0,3).join(', ')}. Cons: ${r.cons.slice(0,2).join(', ')}. Metro: ${r.connectivity.metro_stations[0]?.name ?? 'none'} ${r.connectivity.metro_stations[0]?.distance_km ?? ''}km.`;
      // ~80 tokens vs ~1,200 tokens
    }

    case 'getPriceTrends': {
      const r = result as PriceTrends;
      return `${r.locality} price trend (${r.transaction_type}, ${r.duration_months}mo): ${r.trend_direction}, YoY ${r.yoy_change_pct > 0 ? '+' : ''}${r.yoy_change_pct}%. ${r.insight}`;
      // ~50 tokens vs ~600 tokens
    }

    case 'resolveEntity': {
      const r = result as EntityResolution;
      if (r.matches.length === 0) return `No match found for "${r.raw_name}".`;
      if (r.matches.length === 1) return `Resolved "${r.raw_name}" → ${r.matches[0].canonical_name} (${r.matches[0].entity_id}, confidence ${r.matches[0].confidence}).`;
      return `Multiple matches for "${r.raw_name}": ${r.matches.map(m => `${m.canonical_name} (${m.confidence})`).join(', ')}.`;
      // ~40 tokens vs ~300 tokens
    }

    case 'reverseGeocode': {
      const r = result as GeoResult;
      return `Location resolved: ${r.area_label}. city_id=${r.city_id}, locality_id=${r.locality_id ?? 'none'}.`;
      // ~30 tokens
    }

    // ... other tools
    default:
      return JSON.stringify(result).slice(0, 500); // hard cap for unknown tools
  }
}
```

The **full result** is still sent to FE as the template payload. The summary is only what the LLM sees in its continuation context.

**Token savings per tool call:** 90–95% reduction in tool result tokens.

### 3. Reduced Turn Window: 10 Turns + Better Summary

Reduce from 20 raw turns to **10 raw turns**. Compensate with a richer summary.

The summary is triggered when turn count exceeds 10 (not 20), so it's always more current and covers more recent context.

#### 3a. Strip templates before storing turns

Template responses contain many UI-only fields — image URLs, quick_action button configs, pagination metadata — that are irrelevant to the LLM. When a bot turn is stored in `conv:turns`, the template payload is replaced with a **semantic summary string**, not the full JSON.

```typescript
// Called at turn storage time — before writing to conv:turns in Redis
function buildTurnRecord(message: BotCompletePayload): TurnRecord {
  return {
    role: 'assistant',
    text: message.text ?? message.markdown ?? '',
    template_summary: message.template
      ? summariseTemplateForStorage(message.template.template_id, message.template.data)
      : null,
    timestamp: Date.now(),
    message_id: message.message_id
  };
}

function summariseTemplateForStorage(templateId: TemplateId, data: unknown): string {
  switch (templateId) {
    case 'property_carousel': {
      const d = data as PropertyCarouselData;
      const sample = d.properties.slice(0, 3)
        .map(p => `${p.title} (${p.apartment_type}, ${p.locality}, ${p.price_display})`)
        .join(' | ');
      return `Showed ${d.total_count} properties (page ${d.page}). Sample: ${sample}.`;
      // ~40 tokens vs ~2,000 tokens for full carousel JSON
    }

    case 'locality_carousel': {
      const d = data as LocalityCarouselData;
      const locs = d.localities
        .map(l => `${l.name} (${l.overall_rating}/5, +${l.yoy_change_pct}% YoY)`)
        .join(' | ');
      return `Showed ${d.localities.length} localities: ${locs}.`;
      // ~30 tokens vs ~800 tokens
    }

    case 'floor_plans': {
      const d = data as FloorPlansData;
      const plans = d.plans.map(p => `${p.bhk}BHK ${p.area_sqft}sqft`).join(', ');
      return `Showed ${d.plans.length} floor plans for ${d.plans[0]?.property_name}: ${plans}.`;
      // ~20 tokens vs ~500 tokens
    }

    case 'reviews': {
      const d = data as ReviewsData;
      const strengths = d.key_insights?.top_strengths?.slice(0, 2).join(', ') ?? '';
      const concerns  = d.key_insights?.areas_to_consider?.slice(0, 2).join(', ') ?? '';
      return `Showed reviews for ${d.entity_name}: ${d.overall_rating}/5 (${d.total_reviews} reviews). Strengths: ${strengths}. Concerns: ${concerns}.`;
      // ~40 tokens vs ~1,200 tokens
    }

    case 'price_trends': {
      const d = data as PriceTrendsData;
      return `Showed price trends for ${d.locality}: avg ₹${d.avg_price}/sqft, YoY ${d.yoy_change_pct > 0 ? '+' : ''}${d.yoy_change_pct}%, trend ${d.trend_direction}.`;
      // ~25 tokens vs ~600 tokens
    }

    case 'transaction_history': {
      const d = data as TransactionHistoryData;
      return `Showed ${d.total_transactions} transactions for ${d.entity_name} (${d.sales_count} sales, ${d.mortgage_count} mortgages).`;
      // ~20 tokens vs ~800 tokens
    }

    case 'nested_qna': {
      const d = data as NestedQnaData;
      const questions = d.selections.map(s => s.title).join(' | ');
      return `Showed disambiguation: ${questions}.`;
      // ~20 tokens vs ~200 tokens
    }

    case 'floor_plans':
    case 'image_gallery':
    case 'payment_plan':
    case 'amenities':
    case 'download_brochure':
    case 'share_location':
      return `Showed ${templateId} for ${(data as any).property_name ?? (data as any).project_name ?? 'property'}.`;
      // ~10 tokens

    default:
      return `Showed ${templateId} response.`;
  }
}
```

The full template JSON is sent to the FE as a `chat_event` SSE event — it is never stored in `conv:turns`. The stored record is the lean semantic string. When Haiku later summarizes these turns, it reads clean text, not a wall of JSON.

**Token savings at storage:** 90–98% reduction per template turn stored.
**Token savings at summary time:** Haiku receives readable text, not JSON — smaller input, better summary quality.

#### 3b. Summary trigger and content

**Summary includes** (beyond the compressed turns):
- All filter changes made in compressed turns
- All entities that were resolved
- Properties viewed, shortlisted, or rejected
- Any explicit preferences stated ("user said no brokers", "prefers metro nearby")
- Active intent when compression happened

```typescript
const SUMMARY_SYSTEM_PROMPT = `
Summarise the following conversation turns for a property search context.
Output a structured JSON object:
{
  "summary_text": "One paragraph summary of user journey and intent",
  "stated_preferences": ["list of explicit user preferences mentioned"],
  "viewed_property_ids": ["prop_ids explicitly discussed"],
  "rejected_signals": ["what user explicitly didn't want"],
  "filter_history": { "final applied filters at end of these turns" },
  "last_intent": "what user was trying to do at the end of these turns"
}
`;
// Run this with Haiku (cheap), not Sonnet
```

**Token savings:** 1,500 fewer raw turn tokens per LLM call (10 turns × 150 avg tokens). On top of that, each stored turn is already lean due to template stripping above.

### 4. Deterministic Followups for Template Responses

For Tier 1 and Tier 2 responses, followups are generated by **rule, not LLM**.

```typescript
function generateDeterministicFollowups(
  templateId: TemplateId,
  result: unknown,
  session: Session
): Followup[] {
  switch (templateId) {
    case 'property_carousel': {
      const r = result as SearchResult;
      const followups: Followup[] = [];
      if (r.total_count > r.page * r.page_size) {
        followups.push({ label: 'Show more', intent: 'paginate', srset_id: r.srset_id, page: r.page + 1 });
      }
      // Add filter chips based on what's NOT already filtered
      if (!session.filters.furnishing) {
        followups.push({ label: 'Furnished only', filter_delta: { furnishing: ['furnished'] } });
      }
      if (!session.filters.listed_by?.includes('owner')) {
        followups.push({ label: 'Owner listings', filter_delta: { listed_by: ['owner'] } });
      }
      if (!session.filters.is_verified) {
        followups.push({ label: 'Verified only', filter_delta: { is_verified: true } });
      }
      followups.push({ label: 'Sort by price ↑', intent: 'sort', sort_by: 'price_asc' });
      return followups.slice(0, 4); // cap at 4 chips
    }

    case 'property_detail': {
      return [
        { label: 'Floor plans', intent: 'view_floor_plans',   property_id: session.active_property_id },
        { label: 'Images',      intent: 'view_images',        property_id: session.active_property_id },
        { label: 'Similar',     intent: 'similar_properties', property_id: session.active_property_id },
        { label: 'Contact',     intent: 'contact_seller',     property_id: session.active_property_id },
      ];
    }

    case 'locality_carousel': {
      return [
        { label: 'Search properties here', intent: 'search_in_locality', locality_id: '<first_locality_id>' },
        { label: 'Compare top two',        intent: 'compare_localities' },
      ];
    }

    case 'reviews': {
      return [
        { label: 'Price trends', intent: 'price_trends',      locality_id: session.active_locality_id },
        { label: 'Search here',  intent: 'search_in_locality', locality_id: session.active_locality_id },
      ];
    }

    default: return [];
  }
}
```

For Tier 3 responses, followup strategy splits by model:
- **Tier 3a (Haiku):** Haiku generates 1–2 followup chips as part of its response. The system prompt instructs it to append `FOLLOWUPS: [label1, label2]` at end of output — parsed by orchestrator, never shown in chat bubble.
- **Tier 3b (Sonnet):** Sonnet generates followups inline (e.g., after a comparison, the relevant followup depends on what was compared and which property/locality the user leaned toward).

### 4b. Data-Conditional Followups (Rule Engine, Not LLM)

The design screens show many smart contextual followups that look like they need LLM but are actually pure if-else on tool result data. These are handled by a rule engine in the Bot Orchestrator, no LLM needed.

```typescript
function generateDataConditionalFollowups(toolName: string, result: unknown, session: Session): string | null {
  switch (toolName) {
    case 'getLocalityPriceTrends': {
      const r = result as PriceTrends;
      if (r.trend_direction === 'up' && r.yoy_change_pct > 5)
        return "Prices have been rising steadily. Would you like to see available properties before they increase further?";
      if (r.trend_direction === 'stable' || r.yoy_change_pct <= 5)
        return "Prices look stable right now. Would you like to explore properties with strong value potential?";
      if (r.trend_direction === 'down')
        return "Prices have dipped recently — could be a good time to buy. Want to see available properties?";
      return null;
    }

    case 'getLocalityDetail': {
      const r = result as LocalityDetail;
      if (r.ratings.overall >= 4.0)
        return "Looks like a well-loved neighbourhood. Explore more homes here?";
      if (r.ratings.overall < 3.5)
        return "Not the highest rated area. Want to see popular localities in this city instead?";
      return "This gives you a feel for the area. Want to explore more homes here or check how prices have moved?";
    }

    case 'getProjectDetail': {
      return "Want to explore other properties in this project or get the brochure?";
    }

    case 'compareLocalities': {
      return "Which area feels like a better fit? I can show you available properties or give you a full locality overview of either.";
    }

    case 'compareProjects': {
      return "Which one caught your eye? I can show you resale options in either project or get you the brochure.";
    }

    case 'getPropertyDetail': {
      const r = result as PropertyDetail;
      if (r.coordinates)
        return "These distances are based on the approximate location. Want to know exactly where it is? Connect with the seller for the precise address. 🤝";
      return null;
    }

    default: return null;
  }
}
```

This string is appended below the template as plain text — exactly as the design shows. No LLM, no Haiku — pure string interpolation from data thresholds.

---

## RAG Classification and Graceful Deflection

### When RAG is Needed

Queries that cannot be answered by any combination of our structured tools or filters:

| User query | Why RAG, not tools |
|---|---|
| "localities with no water logging" | Not a filter; requires mining locality reviews |
| "properties that don't flood during rains" | Not a filter; requires review/description mining → locality IDs → search |
| "areas with good water supply" | Infra quality not in schema |
| "localities with no power cuts" | Not in schema |
| "projects with no construction delays" | Requires mining builder review sentiment |
| "friendly neighbourhood, good for kids" | Subjective, not indexable |
| "properties near good hospitals" (specific quality) | "good" is subjective; distance is indexable but quality requires RAG |
| "Vastu-compliant 2BHK" | Requires floor plan semantic analysis |

### SLM RAG Signal Detection

The SLM is trained (via system prompt examples) to recognize RAG signals:

```
RAG signal patterns:
- Negation of infrastructure issue: "no X", "without X", "doesn't have X" where X is an infrastructure problem
- Subjective quality on non-indexed attribute: "good", "bad", "safe", "friendly" applied to infrastructure
- Review-dependent criteria: "well-reviewed for", "residents say"
- Natural disaster resilience: "flood", "waterlogging", "earthquake-safe"
- Construction quality sentiment: "no leakage", "good build quality"

NOT RAG (these are fine with current tools):
- "good connectivity" → connectivity rating filter exists
- "high-rated locality" → rating filter exists
- "verified properties" → is_verified filter exists
- "near metro" → amenities filter: metro_nearby
```

### Deflection Response

When `routing=rag_needed`, the Bot Orchestrator returns a deterministic response — no LLM call:

```typescript
const RAG_DEFLECTION: Record<RagCategory, DeflectionTemplate> = {
  infrastructure_issue: {
    text: "Finding {criterion} requires analysing resident reviews in detail — " +
          "that's a capability we're building. For now, I can show you top-rated localities " +
          "in {city} where residents have given high scores for infrastructure. Want that?",
    followups: [
      { label: 'Show top-rated localities', intent: 'trending_localities', ranked_by: 'overall' },
      { label: 'Tell me the area anyway',   intent: 'free_search' },
    ]
  },
  subjective_quality: {
    text: "'{criterion}' is something I'd need to read through detailed resident reviews to answer — " +
          "that's not something I can reliably do right now. I can show you localities with the " +
          "highest overall resident ratings in {city}. Shall I?",
    followups: [
      { label: 'Show highest-rated', intent: 'trending_localities', ranked_by: 'overall' },
    ]
  },
  construction_quality: {
    text: "Assessing construction quality like '{criterion}' requires analysing project reviews " +
          "in depth. I can't reliably determine this yet. I can show you builders with the " +
          "highest ratings and completed project counts in {city}.",
    followups: [
      { label: 'Show top-rated builders', intent: 'top_builders' },
    ]
  },
  hyperlocal_sentiment: {
    text: "'{criterion}' is a nuanced ask that I can't reliably assess from structured data alone. " +
          "Here's what I can do: show you localities with high safety and lifestyle ratings, " +
          "which tend to correlate with what you're describing.",
    followups: [
      { label: 'Show by safety rating', intent: 'trending_localities', ranked_by: 'safety' },
    ]
  },
  vastu_or_custom: {
    text: "I don't have a reliable way to answer '{criterion}' from the data I can access. " +
          "I'd rather tell you that than give you an unreliable answer. " +
          "Is there something else I can help with?",
    followups: []
  }
};
```

**Important:** The deflection always offers a constructive alternative. It never just says "I can't do that." And it never halluccinates an answer.

### Future RAG Integration Point

When RAG is built, the routing changes:

```
routing=rag_needed
      │
      ▼
RAG Pipeline (instead of deflection)
  1. Extract search intent from query
  2. Run semantic search over review/description embeddings
  3. Get matching locality/property IDs
  4. Pass IDs to standard search tools
  5. Return property_carousel or locality_carousel
```

The SLM classification and `rag_category` output are preserved as-is. Only the handler for `routing=rag_needed` changes. No architectural change needed.

---

## SLM Usage in Support Domain

The support bot (chat_domain: `support_bot`) uses Haiku for three additional tasks beyond the main classification loop:

### Sentiment Classification (escalation trigger)

Haiku classifies user sentiment on each support turn. Score < -0.6 on the last 3 turns → escalate to human agent. This runs in parallel with message processing — no added latency to the user-facing response.

```typescript
interface SentimentResult {
  score: number;          // -1.0 (very negative) to +1.0 (very positive)
  label: 'negative' | 'neutral' | 'positive';
  frustration_signal: boolean;  // "this is unacceptable", "useless", etc.
}
// Model: Haiku. Input: last 3 user messages. No tool calls.
```

### Issue Classification

On first support message, Haiku classifies the issue type into one of a known taxonomy. This populates the agent queue priority and the agent co-pilot context — done before Sonnet handles the response.

```typescript
type SupportIssueType =
  | 'payment_dispute'   // always_escalate → priority queue
  | 'account_issue'
  | 'listing_dispute'
  | 'refund_request'
  | 'technical_bug'
  | 'general_query';    // most likely bot-resolvable
```

### Escalation Decision

After each bot resolution attempt, Haiku evaluates: "Did the bot resolve this?" Input: last bot response + user follow-up. Output: `{ resolved: boolean, confidence: number }`. Cheaper than running Sonnet for this binary check.

If `resolved: false` and attempt_count >= 3 → escalate regardless of sentiment.

---

## Estimated Token Budget (Per LLM Turn, Optimised)

### Tier 3b (Sonnet) — complex turns

```
                          Before          After         Saving
────────────────────────────────────────────────────────────────
System prompt (cached)    1,200 tokens    1,200 tokens    —  (cache hit, ~10% cost)
Tool definitions (cached)   800 tokens      300 tokens   62%  (intent-specific)
Session state header        200 tokens      130 tokens   35%  (intent-specific fields only)
Turn history               3,000 tokens    1,500 tokens   50%  (10 turns, not 20)
Context summary              400 tokens      400 tokens    —
Tool result (per call)     2,000 tokens      100 tokens   95%  (summary, not full JSON)
────────────────────────────────────────────────────────────────
Per turn (1 tool call)     7,600 tokens    3,630 tokens   52%
Per turn (2 tool calls)    9,600 tokens    3,730 tokens   61%
```

### Tier 3a (Haiku) — simple single-tool turns

```
                          Sonnet          Haiku          Saving
────────────────────────────────────────────────────────────────
System prompt (cached)    1,200 tokens    1,200 tokens    —  (same cache)
Tool definitions (cached)   300 tokens      120 tokens   60%  (sub-intent tools only)
Session state header        130 tokens       80 tokens   38%  (minimal fields)
Turn history               1,500 tokens      450 tokens   70%  (3 turns only)
Context summary              400 tokens      200 tokens   50%  (shorter summary)
Tool result (per call)       100 tokens      100 tokens    —
────────────────────────────────────────────────────────────────
Per turn (1 tool call)     3,630 tokens    2,150 tokens   41%  fewer tokens
                                           × ~20x cheaper model
                                           = ~95% cheaper than Sonnet
```

> **Why tool results are so small:** Tier A tools (`searchProperties`, `getPropertyDetail`, etc.)
> are called by `fetch_data_node` (the orchestrator), not by the LLM. Their results go to
> `pre_fetched_data` — `respond_node` uses them to build template cards (property carousels,
> detail cards) that are sent directly to the FE. The LLM receives only a compact summary of
> what was shown (e.g. "Found 47 properties in Bandra. Sample: ..."), not the full property JSON.
> This is why the "Before" column shows 2,000 tokens per tool result and "After" shows 100 — the
> LLM context is structurally smaller, not just truncated.

### Interaction-level savings

```
Tier 1 (card actions, ~35% of turns):   $0 LLM cost
Tier 2 (SLM direct, ~25% of turns):    Haiku cost only (~20x cheaper than Sonnet)
Tier 3a (Haiku, ~14% of turns):        Haiku + 41% fewer tokens vs Sonnet
Tier 3b (Sonnet, ~21% of turns):       Sonnet + 52–61% fewer tokens vs unoptimised
Tier 4 (RAG deflection, ~5% of turns): $0 LLM cost (deterministic response)
```

**Overall blended cost vs naive (all Sonnet, no optimisation):**
- ~85–88% reduction in LLM cost (up from 75–80% before model split)
- Latency: Tier 1 <200ms, Tier 2 ~300ms (SLM only), Tier 3a ~600ms (Haiku), Tier 3b ~2–3s (Sonnet), Tier 4 <100ms

---

## Summary of All Optimisations

| Optimisation | Mechanism | Affects |
|---|---|---|
| Skip LLM for card actions | Tier 1 direct routing | 35% of turns, $0 |
| SLM for simple text intents | Tier 2 routing, Haiku | 25% of turns, 20x cheaper |
| Tier 3 model split | Haiku for single-tool turns, Sonnet for complex | ~14% of turns at Haiku cost |
| Sub-intent tool loading | `TOOLS_BY_SUBINTENT_HAIKU` map | 60% fewer tool-def tokens on Haiku calls |
| Intent-specific session state | `buildSessionStateBlock()` | 35% fewer session state tokens |
| Dynamic context window | 3 turns for Haiku, 10 for Sonnet | 70% fewer turn tokens on Haiku calls |
| Orchestrator preprocessing | Unit conversions + ordinal resolution before LLM | Eliminates unnecessary LLM reasoning |
| Tool result summaries | `summariseToolResult()` in orchestrator | 90–95% fewer result tokens |
| Strip templates at storage | `summariseTemplateForStorage()` before Redis write | 90–98% fewer tokens in stored turns |
| Reduce turn window to 10 | `LTRIM conv:turns 0 19` | 50% fewer turn tokens vs 20-turn window |
| Better summary at turn 10 | Haiku-powered structured summary | Compensates for fewer raw turns |
| Deterministic followups | Rule-based per template (Tier 1/2), Haiku (Tier 3a) | Eliminates followup Sonnet cost |
| Data-conditional followups | Rule engine on tool result data | No LLM for contextual text responses |
| RAG deflection (not hallucination) | SLM classification + static template | Correctness + zero LLM cost |
| Prompt caching | Claude prompt cache on static sections | ~90% cache read discount on system prompt |
| SLM for support domain | Haiku for sentiment, issue classification, escalation check | Replaces Sonnet for 3 binary decisions |
