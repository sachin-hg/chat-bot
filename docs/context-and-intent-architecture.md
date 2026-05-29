# Context and Intent Architecture

## Overview

Every bot turn operates on a structured context object — not just a chat history. The context has six components. The LLM sees all six, assembled as its input. State evolves across turns as side effects of tool calls and FE-seeded page context.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Context Object (per turn)                    │
├─────────────────────────────────────────────────────────────────┤
│  1. chat_domain     search_discovery | user_seller |            │
│                     support_bot | support_human |               │
│                     seller_property_upload                      │
│                                                                 │
│  2. intent          main_intent + sub_intent                    │
│                                                                 │
│  3. entities        Active system entities with resolved IDs    │
│                     locality, project, builder, property        │
│                                                                 │
│  4. filters         Current active search filters               │
│                                                                 │
│  5. last_n_turns    Up to 20 turns stored in Redis (LTRIM 0 19)  │
│                     SLM sees last 3; LLM gets 3 (Haiku)/10 (Sonnet)│
│                                                                 │
│  6. summary         Compressed context of turns beyond 20       │
└─────────────────────────────────────────────────────────────────┘
```

**Key principle:** Entities and filters are tracked as structured state, not buried in chat history. The LLM doesn't have to re-read 15 turns to know the user is looking for a 3BHK in Powai. It's in the context header.

**Context window split:**
- The **SLM classifier** receives the last **3 turns** of conversation history. This is intentional — the classifier needs only the immediate context to determine intent and extract filter deltas.
- The **LLM followup prompt** (`followup_node`) injects **last 3 turns** for Haiku (Tier 3a) and **last 10 turns** for Sonnet (Tier 3b). Redis stores up to 20 turns — injecting fewer keeps token cost bounded. Beyond the stored 20, a rolling summary replaces the oldest turns.

**Summarization mechanics:**
- Trigger: when `conv:turns` LLEN would exceed 20 after the current turn
- Who: `followup_node` fires an async Haiku summarization call post-response (not on the critical path)
- What: summarizes turns 1–10 (oldest half) into a ~200-token prose block
- Result: written to `conv:summary:{id}`; turns 1–10 trimmed via `LTRIM`
- Fallback: if summarization fails (timeout), the list grows up to 30 turns max before a hard `LTRIM` to 20 is applied on the next turn
- The LLM receives `conv:summary` + last 3 turns (Haiku) or 10 turns (Sonnet); the summary block is labeled `[CONVERSATION HISTORY SUMMARY]` in the prompt

---

## BotState Fields

The LangGraph `StateGraph` passes a `BotState` `TypedDict` through every pipeline node. Relevant fields:

```python
class BotState(TypedDict):
    # Core classification output (set by classify node)
    classification: dict          # main_intent, sub_intent, entities_mentioned,
                                  # filter_delta, clarification_needed, clarification_data

    # Resolved entity IDs (set by resolve_entities node)
    resolved_entities: dict

    # Routing decision (set by route node)
    routing: dict                 # tier, model_hint

    # Session and turn state
    session: dict                 # SessionState — user, conv_id, page_type, etc.

    # SSE phase tracking
    summary_emitted: bool | None  # True after summary_node emits Phase 1
    template_count: int | None    # Number of template events emitted by respond_node

    # Response assembly
    bot_response: Any | None      # Set by short-circuit nodes (Tier 0/1/2) or followup_node
    validated_text: str | None    # Set by validate_output_node after LLM text passes checks
```

`summary_emitted` is read by `followup_node` to set `LLMContext.is_followup = True`, which tells the LLM prompt not to re-acknowledge the user's request.

`template_count` is read by `followup_node` to know whether templates were emitted (and thus whether Phase 3 text should add commentary on structured data, or stand alone).

---

## LLMContext Fields

`LLMContext` is assembled by `build_prompt_node` and passed to the LLM call. Key fields relevant to the 3-phase model:

```python
class LLMContext(BaseModel):
    main_intent:          str
    sub_intent:           str
    prompt_block:         str   # path to prompt file; dispatched via FOLLOWUP_PROMPT_BLOCKS registry
    is_followup:          bool  # True when summary_node already emitted Phase 1
    session:              dict
    turn_count:           int
    has_session_summary:  bool
    session_summary:      str | None
```

When `is_followup` is `True`, the assembled prompt instructs the LLM to skip any opening re-acknowledgment and begin directly with commentary.

---

## Chat Domain Model

`chat_domain` is session-level state. It determines routing, tool availability, system prompt, and escalation behavior.

```
chat_domain
├── search_discovery         Property search, exploration, research
│   └── Tools: all property/locality/project tools
│
├── user_seller              P2P chat after buyer contacts seller
│   └── Tools: none (human ↔ human) or minimal bot_assist
│
├── support_bot              Bot-first support resolution
│   └── Tools: support-specific (ticket, policy, order status)
│
├── support_human            Human agent took over from support_bot
│   └── Tools: agent co-pilot (read-only suggests, no execution)
│
└── seller_property_upload   [Future] Seller-facing bot for listing mgmt
    └── Tools: property upload, edit, analytics, inquiry management
```

Domain transitions:

```
search_discovery ──► user_seller          (buyer contacts seller)
search_discovery ──► support_bot          (user triggers support)
support_bot      ──► support_human        (escalation)
support_human    ──► search_discovery     (agent resolves, hands back)
```

Domain is stored in `conv:state.chat_domain`. Changing domain changes the system prompt, tool set, and WS routing — but not the WS connection itself.

---

## Pipeline

The LangGraph `StateGraph` pipeline for every turn:

```
safety → normalize → classify → validate_slm → filter_apply → sanitize →
derive → clarify → resolve_entities → route → summary → experiment →
fetch_data → respond → build_prompt → llm → validate_output → followup
```

Node responsibilities:
- `classify`: SLM produces `classification` dict (sees last 3 turns)
- `validate_slm`: checks classification confidence thresholds
- `derive`: derives routing tier, model hint, and resolves search anchors
- `route`: writes `routing` dict to BotState
- `summary` (`summary_node`): emits Phase 1 SSE if intent is template-tier and all entity confidences ≥ 0.70; sets `summary_emitted`
- `fetch_data`: runs `data_requirements` from INTENT_REGISTRY in parallel groups
- `respond` (`respond_node`): emits Phase 2 template SSE events; sets `template_count`
- `build_prompt`: assembles `LLMContext`, sets `is_followup` from `summary_emitted`
- `llm`: streams LLM tokens (Phase 3 `message_delta` chunks)
- `validate_output`: sets `validated_text`
- `followup` (`followup_node`): finalises Phase 3, emits `chat_event { sourceMessageState: COMPLETED }`

---

## Routing Tiers

Every intent is assigned a tier in `INTENT_REGISTRY` (see `solid-architecture.md`). The tier determines which pipeline phases fire.

| Tier | Name | When | LLM? | SSE phases fired |
|---|---|---|---|---|
| 0 | Safety/OOB | `out_of_scope/*`, safety regex fail | No | Short-circuit via `emit_final_state` |
| 1 | Direct action | Action intents with all params present (save_property, contact_seller, save_alert); calculator when all inputs given | No | Short-circuit via `emit_final_state` |
| 2 | Orchestrator-handled | Portfolio fetch (saved_properties, viewed_properties, recent_searches), calculator missing inputs | No (orchestrator computes directly) | Short-circuit via `emit_final_state` |
| 3a | Template + LLM followup | Property search, explore nearby, trending localities, locality_comparison, similar_properties, portfolio/recommendations | Haiku (followup) | Phase 1 (summary) + Phase 2 (templates) + Phase 3 (LLM followup) |
| 3b | Full LLM response | compare_localities, compare_projects | Sonnet | Phase 3 only (LLM full response) |

For Tier 3a, `summary_emitted` will be `True` when Phase 1 fires (skipped if any resolved entity has confidence < 0.70). For Tier 3b, Phase 1 still fires as acknowledgment, but Phase 2 emits no template events (`template_count = 0`). For Tiers 0–2, no LLM call is made; `bot_response` is set directly by the short-circuit node.

---

## Intent Taxonomy

Two levels: `main_intent` (broad category) and `sub_intent` (specific action). Each entry carries a routing tier. Full `IntentRecord` schemas including `data_requirements`, `carry_over_keys`, and `session_inject` are in `solid-architecture.md` (INTENT_REGISTRY).

### chat_domain: `search_discovery`

```
main_intent: property_search
  sub_intent:
    filter_search            Search with explicit filters (BHK, price, locality, etc.)  [Tier 3a]
    explore_nearby           Proximity-based search ("near me", "near Manyata")          [Tier 3a]
    discovery_collections    Curated discovery (trending, new launches, editor picks)    [Tier 3a]

main_intent: property_detail
  sub_intent:
    property_about           General property info, amenities, possession, builder       [Tier 3a]
    similar_properties       Similar property carousel                                   [Tier 3a]
    floor_plan               Floor plan viewer                                           [Tier 3a]
    calculate_emi            EMI calculator for this property                            [Tier 1/2]
    nearby_landmarks         Nearby schools, hospitals, transit                          [Tier 3a]
    brochure                 Fetch and surface builder brochure                          [Tier 2]
    contact_seller           Initiate P2P contact                                        [Tier 1]
    save_property            Save/shortlist property (auth-gated)                        [Tier 1]
    remove_saved             Remove from saved list                                      [Tier 1]

main_intent: locality_research
  sub_intent:
    locality_overview        Locality summary card                                       [Tier 3a]
    price_trends             Price trend chart for locality                              [Tier 3a]
    commute_time             Commute time to a destination                               [Tier 3b]
    trending_localities      Trending localities in city                                 [Tier 3a]
    locality_comparison      Side-by-side locality comparison                            [Tier 3a]
    market_insight           Investment and market analysis                              [Tier 3b]
    transaction_data         Recent registered deals                                     [Tier 3b]
    ratings_reviews          Resident reviews and ratings                                [Tier 3b]
    price_fairness           Is this price fair for the locality?                        [Tier 3b]
    filter_suggestions       Smart filter recommendations for locality                   [Tier 3b]
    top_societies            Top housing societies in locality                           [Tier 3b]
    city_orientation         City-level overview and area guide                          [Tier 3b]

main_intent: project_research
  sub_intent:
    project_overview         Project + builder info                                      [Tier 3a]
    project_price_trends     Project price history and trends                            [Tier 3a]
    ratings_reviews          Project reviews and ratings                                 [Tier 3a]
    trending_projects        Trending projects in city/locality                          [Tier 3a]

main_intent: comparison
  sub_intent:
    compare_localities       Two localities side-by-side                                 [Tier 3b]
    compare_projects         Two projects side-by-side                                   [Tier 3b]

main_intent: portfolio
  sub_intent:
    saved_properties         User's shortlisted properties (auth-gated)                 [Tier 2]
    viewed_properties        Properties user has viewed this session                     [Tier 2]
    recent_searches          User's recent search queries                                [Tier 2]
    recommendations          Personalised property recommendations                       [Tier 3a]
    recently_viewed_cross_session  Properties viewed in prior sessions (auth-gated)     [Tier 2]
    save_alert               Save a search alert for new listings                        [Tier 1]

main_intent: calculator
  sub_intent:
    calculate_emi            EMI calculator (standalone)                                 [Tier 1/2]
    calculate_affordability  How much can I afford?                                      [Tier 1/2]
    convert_unit             Unit conversion (sq ft ↔ sq m, etc.)                        [Tier 1/2]

main_intent: out_of_scope
  sub_intent:
    out_of_scope_query       Non-real-estate or unrecognised query                       [Tier 0]
    insufficient_info        Query too vague to classify                                 [Tier 0]
    multi_intent/decompose   Message contains multiple intents — decompose and route     [special]
```

### chat_domain: `support_bot`

```
main_intent: booking_issue | payment_issue | account_issue | property_report | general_inquiry
  sub_intent:
    status_check             "What's the status of..."                                   [Tier 3a]
    resolution_request       "I need this fixed"                                         [Tier 3a]
    info_request             "How does X work"                                           [Tier 1]
    escalate                 "I want to talk to a human"                                 [Tier 1]
```

### chat_domain: `seller_property_upload` (future)

```
main_intent: property_management
  sub_intent:
    add_listing | edit_listing | view_inquiries | view_analytics | boost_listing          [Tier 3a]
```

`main_intent` and `sub_intent` are produced by the SLM classifier, which receives the last 3 turns of conversation history plus the current message. The orchestrator uses this to select an `IntentRecord` from `INTENT_REGISTRY` and route to the correct tier and fetch chain.

---

## FE Page Context Seeding

When a user opens the chat window, FE sends a `session_seed` frame over WebSocket before the first user message. This is the most important input — FE has already resolved entities from its own page state, so the bot starts with full context.

### `session_seed` frame

```typescript
interface SessionSeedFrame {
  type: 'session_seed';
  payload: {
    page_type: PageType;
    chat_domain: ChatDomain;  // FE determines initial domain from page
    city?: Entity;
    entities: Entity[];       // already resolved — contain system UUIDs
    filters: Partial<SearchFilters>;
    transaction_type?: 'rent' | 'buy';
    user?: {                  // if user is already logged in
      user_id: string;
      name: string;
    };
  };
}

interface Entity {
  id: string;          // system UUID — no resolution needed
  type: 'locality' | 'landmark' | 'builder' | 'project' | 'property';
  name: string;        // display name
}

type PageType =
  | 'home'               // housing.com homepage
  | 'srp'                // search results page
  | 'pdp'                // property detail page
  | 'project_page'       // project detail page
  | 'locality_page'      // locality detail page
  | 'builder_page'       // builder profile page
  | 'my_properties'      // user's saved/contacted
  | 'seller_dashboard';  // seller's listing management
```

### Page Type → Initial Context Mapping

**SRP (Search Results Page)**
```json
{
  "page_type": "srp",
  "chat_domain": "search_discovery",
  "city": { "id": "city_mumbai", "name": "Mumbai" },
  "entities": [
    { "id": "loc_powai", "type": "locality", "name": "Powai" }
  ],
  "filters": {
    "apartment_type": ["2bhk"],
    "property_type": ["apartment"],
    "transaction_type": "rent"
  }
}
```
Bot Orchestrator: skips entity resolution, loads filters into `conv:filters`, sets `active_locality_id`, sets `main_intent: property_search`, `sub_intent: filter_search`. Bot greets: "I can help you find 2BHK apartments in Powai. Want me to search with your current filters?"

**PDP (Property Detail Page)**
```json
{
  "page_type": "pdp",
  "chat_domain": "search_discovery",
  "city": { "id": "city_mumbai", "name": "Mumbai" },
  "entities": [
    { "id": "prop_abc", "type": "property", "name": "2BHK in Hiranandani Gardens" },
    { "id": "proj_xyz", "type": "project", "name": "Hiranandani Gardens" },
    { "id": "loc_powai", "type": "locality", "name": "Powai" }
  ],
  "filters": { "transaction_type": "rent" }
}
```
Bot sets: `active_property_id`, `active_project_id`, `active_locality_id`. Main intent: `property_detail`. Bot greets: "You're looking at a 2BHK in Hiranandani Gardens. What would you like to know — floor plans, amenities, or price trends in Powai?"

**Locality Page**
```json
{
  "page_type": "locality_page",
  "chat_domain": "search_discovery",
  "city": { "id": "city_gurgaon", "name": "Gurgaon" },
  "entities": [
    { "id": "loc_sector32", "type": "locality", "name": "Sector 32" }
  ],
  "filters": {}
}
```
Main intent: `locality_research`. Bot: "Exploring Sector 32, Gurgaon. Want to see reviews, price trends, or properties here?"

**Home**
```json
{
  "page_type": "home",
  "chat_domain": "search_discovery",
  "city": null,
  "entities": [],
  "filters": {}
}
```
No pre-loaded context. Bot: "Hi! Are you looking to buy or rent a property?"

**Seller Dashboard**
```json
{
  "page_type": "seller_dashboard",
  "chat_domain": "seller_property_upload",
  "entities": [],
  "filters": {}
}
```
Domain switches to `seller_property_upload`. Different system prompt, different tools.

### Bot Orchestrator: Processing session_seed

```typescript
async function processSeed(frame: SessionSeedFrame, convId: string) {
  const { page_type, chat_domain, city, entities, filters, transaction_type } = frame.payload;

  // Write all entities to conv:state
  const entityUpdates: Record<string, string> = {};
  for (const entity of entities) {
    switch (entity.type) {
      case 'property': entityUpdates.active_property_id = entity.id; break;
      case 'project':  entityUpdates.active_project_id  = entity.id; break;
      case 'locality': entityUpdates.active_locality_id = entity.id; break;
      case 'builder':  entityUpdates.active_builder_id  = entity.id; break;
    }
  }
  if (city) entityUpdates.active_city = city.id;
  if (transaction_type) entityUpdates.active_transaction_type = transaction_type;

  // Infer initial main_intent from page_type
  const intent = PAGE_TYPE_TO_INTENT[page_type]; // e.g. "srp" → "property_search"
  entityUpdates.main_intent = intent.main;
  entityUpdates.sub_intent  = intent.sub;
  entityUpdates.chat_domain = chat_domain;

  await redis.hset(`conv:state:${convId}`, entityUpdates);

  // Write filters to conv:filters
  if (Object.keys(filters).length > 0) {
    await redis.hset(`conv:filters:${convId}`, flattenFilters(filters));
  }
}
```

---

## Full Message Flow: FE → BE → LLM

```
FE                         WS Server           Bot Orchestrator         Redis            LLM (Claude)
│                              │                      │                    │                  │
│── session_seed ─────────────►│                      │                    │                  │
│                              │── processSeed ───────►│                    │                  │
│                              │                      │── HSET conv:state ►│                  │
│                              │                      │── HSET conv:filters►│                  │
│                              │◄─────────────────────│                    │                  │
│                              │                      │                    │                  │
│── user_message ─────────────►│                      │                    │                  │
│   "show 2bhk in powai"       │── route to Bot Orch ►│                    │                  │
│                              │                      │── buildContext() ──►│                  │
│                              │                      │◄─ conv:state ───────│                  │
│                              │                      │◄─ conv:filters ─────│                  │
│                              │                      │◄─ conv:turns ───────│                  │
│                              │                      │◄─ conv:summary ─────│                  │
│                              │                      │                    │                  │
│◄─ SSE: Phase 1 summary ──────│◄─ summary_node ──────│                    │                  │
│   (acknowledgment)           │                      │   summary_emitted=T│                  │
│                              │                      │                    │                  │
│                              │                      │── fetch_data ──────►│                  │
│                              │                      │   (INTENT_REGISTRY  │                  │
│                              │                      │    data_requirements│                  │
│                              │                      │    parallel groups) │                  │
│                              │                      │                    │                  │
│◄─ SSE: Phase 2 templates ────│◄─ respond_node ──────│                    │                  │
│   (property_carousel etc.)   │                      │   template_count=N │                  │
│                              │                      │                    │                  │
│                              │                      │── build_prompt ─────────────────────►│
│                              │                      │   is_followup=True │                  │
│◄─ SSE: Phase 3 message_delta─│◄─ streaming tokens ──│◄─ LLM stream ───────────────────────│
│◄─ SSE: COMPLETED ────────────│◄─ followup_node ─────│                    │                  │
│                              │                      │── update state ────►│                  │
│                              │                      │── LPUSH conv:turns ►│                  │
```

**Redis key clarification:** `conv:state:{conversation_id}` is a structured session header: `{ chat_domain, active_entities, active_filters, last_intent, active_property_id, pagination_state }` (~5KB). It is NOT the full assembled LLM prompt — the prompt is assembled fresh each turn from this header + `conv:turns` + `conv:summary`.

---

## What the LLM Prompt Looks Like (Assembled)

This is the structure sent to the LLM for a `search_discovery` followup turn:

```
━━━ SYSTEM PROMPT ━━━

[SECTION 1 — IDENTITY + RULES]  ← static, prompt-cached
You are Housing Assistant for housing.com...
(rules, hallucination prevention, is_followup behaviour instruction)

[SECTION 2 — TOOLS]  ← static per domain+intent, prompt-cached
(residual_tools from INTENT_REGISTRY for this intent — usually empty for Tier 3a)

━━━ DYNAMIC CONTEXT (injected per request) ━━━

[CHAT DOMAIN]
search_discovery

[INTENT]
main_intent:  property_search
sub_intent:   filter_search

[ACTIVE ENTITIES]
city:     Mumbai (city_mumbai)
locality: Powai (loc_powai)
property: — (none selected)
project:  — (none selected)
builder:  — (none selected)

[ACTIVE FILTERS]
transaction_type: rent
apartment_type:   [2bhk]
property_type:    [apartment]
price_max:        60000
is_verified:      true

[PAGINATION STATE]
last_srset_id:   srset_xyz
last_page:       1
total_found:     34
last_carousel:   [prop_1, prop_2, prop_3, prop_4, prop_5, prop_6, prop_7, prop_8, prop_9, prop_10]

[PRE-FETCHED DATA]
searchProperties result: { total_count: 34, page: 1, listings: [...] }

[IS_FOLLOWUP: true]
Phase 1 acknowledgment already sent. Do not restate the user's request.
Start directly with commentary on the results.

[CONTEXT SUMMARY]  ← present only if > 20 turns
User is looking for 2BHK rental in Powai, Mumbai. Budget ₹50-60k. 
Has seen 10 properties across 1 page. Interested in furnished options near metro.
Explicitly said no brokers.

━━━ CONVERSATION (last 20 turns) ━━━

[Turn 1] User: show me 2bhk flats in powai for rent
[Turn 1] Bot:  [summary_node: "Looking for 2BHK apartments for rent in Powai"]
               [respond_node: property_carousel — 10 results]
               [followup: Found 34 options. Furnished listings go quickly here — want to filter?]

[Turn 2] User: filter to furnished only
[Turn 2] Bot:  [summary_node: "Filtering to furnished 2BHK in Powai"]
               [respond_node: property_carousel — 6 results]
               [followup: 6 furnished options in budget. 4 are owner listings.]

[Turn 3] User: only show owner listings
```

The LLM's input is deterministic and structured. It doesn't need to infer "what is the user looking for" — it's stated in the context header. The LLM focuses on: "given this pre-fetched data, what commentary adds value here?"

### Token Budget for Assembled LLM Prompt

| Prompt section | Token budget |
|---|---|
| System prompt blocks 00–05 (static, cached) | ~4,000 |
| Tool definitions — Tier B only (cached) | ~300 |
| Tool definitions — property_about residual (cached) | ~200 additional |
| Session context header (dynamic, uncached) | ~200 |
| Pre-fetched data (response_truncation applied) | ~2,000–5,000 |
| Conversation summary (when present) | ≤300 |
| Last 3 turns injected (Haiku) / 10 turns (Sonnet) | ≤1,500 / ≤5,000 |
| **Total per-request non-cached** | **≤15,000** |

Note: This is a cost cap, not a context-window constraint (Claude Haiku supports 200k tokens). Tier 3a turns (Haiku) target ≤15k total; Tier 3b (Sonnet comparison) may use up to ≤30k for the parallel pre-fetched data.

---

## State Update Protocol (How Context Evolves)

Context updates happen as **side effects of tool calls**, not as explicit state writes. The Bot Orchestrator intercepts tool results and updates Redis accordingly.

```typescript
// Interceptor pattern — wraps every tool call
async function executeToolWithStateUpdate(
  tool: ToolCall,
  convId: string
): Promise<ToolResult> {
  const result = await toolExecutor.run(tool);

  // State side effects by tool type
  switch (tool.name) {
    case 'searchProperties':
      await redis.hset(`conv:state:${convId}`, {
        last_srset_id: result.srset_id,
        last_carousel_page: result.page,
        last_carousel_total: result.total_count,
        main_intent: 'property_search'
      });
      await redis.set(
        `conv:state:${convId}:last_carousel`,
        JSON.stringify(result.listings.map(l => l.property_id))
      );
      // Update active locality from search params (if single locality)
      if (tool.input.locality_ids?.length === 1) {
        await redis.hset(`conv:state:${convId}`, {
          active_locality_id: tool.input.locality_ids[0]
        });
      }
      // Sync filters used in this search back to conv:filters
      await syncFiltersToRedis(convId, tool.input.filters);
      break;

    case 'getPropertyDetail':
      await redis.hset(`conv:state:${convId}`, {
        active_property_id: tool.input.property_id,
        active_project_id: result.project_id ?? '',
        active_locality_id: result.locality_id,
        main_intent: 'property_detail'
      });
      await redis.zadd(`conv:viewed:${convId}`, Date.now(), tool.input.property_id);
      break;

    case 'resolveEntity':
      // If LLM auto-selected (single confident match), update active entity
      if (result.matches.length === 1 && result.matches[0].confidence >= 0.85) {
        const match = result.matches[0];
        const fieldMap = {
          locality: 'active_locality_id',
          project:  'active_project_id',
          builder:  'active_builder_id',
        };
        await redis.hset(`conv:state:${convId}`, {
          [fieldMap[match.entity_type]]: match.entity_id
        });
      }
      break;

    case 'paginateSearch':
      await redis.hset(`conv:state:${convId}`, {
        last_carousel_page: result.page
      });
      // Append new property IDs to carousel list
      const existing = await redis.get(`conv:state:${convId}:last_carousel`);
      const carousel = existing ? JSON.parse(existing) : [];
      await redis.set(
        `conv:state:${convId}:last_carousel`,
        JSON.stringify([...carousel, ...result.listings.map(l => l.property_id)])
      );
      break;

    case 'applyFilter':
      await syncFiltersToRedis(convId, result.applied_filters);
      await redis.hset(`conv:state:${convId}`, { last_srset_id: result.srset_id });
      break;

    case 'initiateContact':
      // Handled separately — triggers domain transition
      break;
  }

  return result;
}
```

This means the Bot Orchestrator is the only writer to Redis state. The LLM produces tool calls (for residual_tools only); the orchestrator executes all pre-fetched data calls and keeps state consistent.

**State mutation audit log:** Every state mutation emits a structured log event:
```json
{
  "event":          "session_state_mutation",
  "request_id":     "...",
  "conversation_id":"...",
  "tool":           "resolveEntity",
  "mutations":      { "active_locality_id": "loc_powai" },
  "prior_values":   { "active_locality_id": null }
}
```
Filter mutations (applied via `applyFilter`) and domain transitions (`contact_seller` → `user_seller_chat`) also emit this event with their respective tool names and mutation diffs.

**Concurrent Turn Safety:** Session state uses optimistic concurrency — `expected_version` is checked on each `SessionStorePort.save()` call. On version mismatch (two concurrent turns on the same session), the losing turn re-loads session state and retries the state merge. The FE should disable input during an in-progress turn, but the server handles concurrent writes safely.

---

## Contact Seller Flow (Detailed)

This is where `search_discovery` hands off to `user_seller`. The flow is split across FE and BE.

```
User                    FE                        BE                       Seller
  │                      │                         │                         │
  │ clicks               │                         │                         │
  │ "Contact Seller"     │                         │                         │
  │─────────────────────►│                         │                         │
  │                      │                         │                         │
  │   [FE shows          │                         │                         │
  │    contact_seller    │                         │                         │
  │    template]         │                         │                         │
  │                      │                         │                         │
  │ [if not logged in:   │                         │                         │
  │  FE collects name,   │                         │                         │
  │  phone, OTP login]   │                         │                         │
  │                      │                         │                         │
  │ [sees seller info:   │                         │                         │
  │  masked phone,       │                         │                         │
  │  response rate,      │                         │                         │
  │  avg response time]  │                         │                         │
  │                      │                         │                         │
  │ clicks               │                         │                         │
  │ "Start Instant Chat" │                         │                         │
  │─────────────────────►│                         │                         │
  │                      │── user_message ─────────►│                         │
  │                      │   intent: initiate_p2p   │                         │
  │                      │   property_id, seller_id │                         │
  │                      │                         │                         │
  │                      │                   Check seller presence            │
  │                      │                   Redis: presence:{seller_id}      │
  │                      │                         │                         │
  │                      │             ┌───────────┴───────────┐             │
  │                      │          ONLINE                   OFFLINE         │
  │                      │             │                         │           │
  │                      │    Create P2P conv record             │           │
  │                      │    in PostgreSQL                      │           │
  │                      │             │                   Create async msg  │
  │                      │    Publish P2P invite                 │           │
  │                      │    to seller via Redis Pub/Sub        │           │
  │                      │             │────────────────────────────────────►│
  │                      │             │                   Push notification  │
  │                      │             │                   to seller device  │
  │                      │             │                         │           │
  │                      │    Transition state:          Transition state:   │
  │                      │    CONTACT_SELLER             CONTACT_SELLER      │
  │                      │    → P2P_ACTIVE               (stays, pending)    │
  │                      │    chat_domain:                                   │
  │                      │    → user_seller                                  │
  │                      │             │                         │           │
  │◄─ session_state_change│◄───────────┘                         │           │
  │   state: P2P_ACTIVE  │                                       │           │
  │   domain: user_seller│                                       │           │
  │                      │                                       │           │
  │ [chat window changes  │                                    [Seller opens  │
  │  to P2P mode,         │                                     notification]│
  │  same window]        │                                       │           │
```

The `contact_seller` template drives the entire login + info display + CTA on the FE side. BE only gets involved when user clicks "Start Instant Chat" and the `initiate_p2p` intent frame arrives. BE does not drive the form.

---

## Seller Property Upload Domain (Future)

For completeness — same infrastructure, different domain.

When a seller opens the chat from their dashboard, FE seeds:
```json
{
  "page_type": "seller_dashboard",
  "chat_domain": "seller_property_upload",
  "user": { "user_id": "seller_abc", "name": "Rajesh", "role": "seller" }
}
```

System prompt switches to seller persona. Tools switch to:

```
uploadProperty(details)          → collect details through conversation, create listing
editProperty(property_id, delta) → update listing fields
getMyListings()                  → seller's active listings
getListingInquiries(property_id) → buyer inquiries for a listing
boostListing(property_id, plan)  → promote listing
getListingAnalytics(property_id) → views, inquiries, conversion
```

Bot guides seller through property upload via conversation:
```
Bot: "Let's list your property. Is it for rent or sale?"
Seller: "rent"
Bot: "What type — apartment, villa, independent house?"
Seller: "apartment, 3bhk in sector 45 gurgaon"
Bot: "Got it. What's your asking rent per month?"
...
Bot: [after all details] "Here's a preview of your listing. [template: listing_preview]. 
      Tap Publish to go live."
```

The bot accumulates structured data across turns (not relying on one big form) and calls `uploadProperty` only when all required fields are collected.

---

## Intent Inference: Page Type → Initial State

```typescript
const PAGE_TYPE_TO_INTENT: Record<PageType, { main: MainIntent, sub: SubIntent }> = {
  home:             { main: 'property_search',   sub: 'filter_search' },
  srp:              { main: 'property_search',   sub: 'filter_search' },
  pdp:              { main: 'property_detail',   sub: 'property_about' },
  project_page:     { main: 'project_research',  sub: 'project_overview' },
  locality_page:    { main: 'locality_research', sub: 'locality_overview' },
  builder_page:     { main: 'project_research',  sub: 'project_overview' },
  my_properties:    { main: 'portfolio',          sub: 'saved_properties' },
  // seller_dashboard: future domain (not yet in INTENT_REGISTRY — seller_property_upload TBD)
};
```

---

## Summary: What Changed from Earlier Design

| Earlier design | Current design |
|---|---|
| Entities resolved by LLM via resolveEntity every time | FE sends resolved entity UUIDs when opening from a page — no resolution needed |
| LLM infers user intent from conversation history | Intent is declared in context header — LLM focuses on execution |
| Single "bot active" mode | 5 explicit chat_domains with different tools, prompts, routing |
| contact_seller was a tool call | contact_seller template is FE-driven; BE only triggers on `initiate_p2p` intent |
| State updates required LLM to track | State updates are side effects of tool calls in Bot Orchestrator |
| Context = full turn history | Context = structured header (entities, filters, intent) + last 20 turns + summary |
| LLM emits summary line as first streaming tokens | summary_node (Phase 1) emits deterministic acknowledgment before LLM call |
| Single response frame | 3-phase SSE: summary (pre-fetch) → templates (post-fetch) → followup (LLM) |
| No BotState tracking of SSE phases | summary_emitted and template_count tracked in BotState; drive is_followup in LLMContext |
| SLM and LLM received same conversation window | SLM classifier sees last 3 turns; LLM prompt includes last 20 turns |
