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
│  5. last_n_turns    Last 20 conversation turns (raw)            │
│                                                                 │
│  6. summary         Compressed context of turns beyond 20       │
└─────────────────────────────────────────────────────────────────┘
```

**Key principle:** Entities and filters are tracked as structured state, not buried in chat history. The LLM doesn't have to re-read 15 turns to know the user is looking for a 3BHK in Powai. It's in the context header.

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

## Intent Taxonomy

Two levels: `main_intent` (broad category) and `sub_intent` (specific action).

### chat_domain: `search_discovery`

```
main_intent: property_search
  sub_intent:
    new_search               First search in session or full intent change
    filter_refine            Narrowing existing results
    paginate                 "Show more"
    near_me                  Location-based search
    sort_change              Reorder results

main_intent: property_detail
  sub_intent:
    view_overview            General property info
    view_images              Image gallery
    view_floor_plans         Floor plan viewer
    view_amenities           Amenities list
    view_payment_plan        Builder payment schedule
    contact_seller           Initiate P2P
    shortlist                Save property
    view_similar             Similar property carousel

main_intent: locality_research
  sub_intent:
    view_overview            Locality summary
    view_reviews             Resident reviews
    view_price_trends        Price trend chart
    view_transactions        Recent registered deals
    view_nearby              Nearby localities carousel
    view_similar             Similar localities
    view_trending            Trending in city
    compare                  Side-by-side comparison

main_intent: project_research
  sub_intent:
    view_overview            Project + builder info
    view_reviews             Project reviews
    view_floor_plans         Configuration plans
    view_payment_plan        Payment schedule
    view_price_trends        Project price data
    compare                  Project comparison

main_intent: portfolio
  sub_intent:
    saved_properties         User's shortlisted properties
    contacted_properties     Properties user contacted seller for

main_intent: comparison
  sub_intent:
    compare_localities       Two localities
    compare_projects         Two projects
    compare_properties       Two specific listings
```

### chat_domain: `support_bot`

```
main_intent: booking_issue | payment_issue | account_issue | property_report | general_inquiry
  sub_intent:
    status_check             "What's the status of..."
    resolution_request       "I need this fixed"
    info_request             "How does X work"
    escalate                 "I want to talk to a human"
```

### chat_domain: `seller_property_upload` (future)

```
main_intent: property_management
  sub_intent:
    add_listing | edit_listing | view_inquiries | view_analytics | boost_listing
```

`main_intent` and `sub_intent` are derived by the Bot Orchestrator — not extracted by the LLM per turn. The orchestrator infers intent from:
1. FE page_type (most authoritative)
2. Tool calls made in the previous turn
3. User message signals (as a fallback)

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
Bot Orchestrator: skips entity resolution, loads filters into `conv:filters`, sets `active_locality_id`, sets `main_intent: property_search`, `sub_intent: new_search`. Bot greets: "I can help you find 2BHK apartments in Powai. Want me to search with your current filters?"

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
│                              │                      │── assemble prompt ──────────────────►│
│                              │                      │   [domain][intent][entities]          │
│                              │                      │   [filters][turns][summary]           │
│◄─ bot_tool_event ────────────│◄─ "Searching..." ────│◄─ tool_use block ───────────────────│
│                              │                      │── searchProperties()│                  │
│                              │                      │   (cache check →   │                  │
│                              │                      │    API call)        │                  │
│                              │                      │── tool_result ──────────────────────►│
│◄─ bot_chunk (streaming) ─────│◄─ stream tokens ─────│◄─ streaming text ───────────────────│
│◄─ bot_complete ──────────────│◄─ full payload ───────│                    │                  │
│                              │                      │── update state ────►│                  │
│                              │                      │   (last_carousel,   │                  │
│                              │                      │    active entities) │                  │
│                              │                      │── LPUSH conv:turns ►│                  │
```

---

## What the LLM Prompt Looks Like (Assembled)

This is the exact structure sent to Claude for a `search_discovery` turn:

```
━━━ SYSTEM PROMPT ━━━

[SECTION 1 — IDENTITY + RULES]  ← static, prompt-cached
You are Housing Assistant for housing.com...
(rules, hallucination prevention, summary-first instruction)

[SECTION 2 — TOOLS]  ← static per domain+state, prompt-cached
(tool definitions for search_discovery, property_search state)

━━━ DYNAMIC CONTEXT (injected per request) ━━━

[CHAT DOMAIN]
search_discovery

[INTENT]
main_intent:  property_search
sub_intent:   filter_refine

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

[CONTEXT SUMMARY]  ← present only if > 20 turns
User is looking for 2BHK rental in Powai, Mumbai. Budget ₹50-60k. 
Has seen 10 properties across 1 page. Interested in furnished options near metro.
Explicitly said no brokers.

━━━ CONVERSATION ━━━

[Turn 1] User: show me 2bhk flats in powai for rent
[Turn 1] Bot:  Looking for 2BHK apartments for rent in Powai...
               [searched, returned 10 results]

[Turn 2] User: filter to furnished only
[Turn 2] Bot:  Filtering to furnished...
               [applied filter, returned 6 results]

[Turn 3] User: only show owner listings
```

The LLM's input is deterministic and structured. It doesn't need to infer "what is the user looking for" — it's stated. It focuses on: "given this context, what tool to call and what to say."

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

This means the Bot Orchestrator is the only writer to Redis state. The LLM produces tool calls; the orchestrator executes them and keeps state consistent.

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

### Seller Online Path

BE checks `presence:{seller_id}` in Redis:
```typescript
async function checkSellerAvailability(sellerId: string): Promise<SellerStatus> {
  const presence = await redis.hgetall(`presence:${sellerId}`);

  if (!presence || !presence.status) return { available: false, reason: 'offline' };
  if (presence.status === 'online') return {
    available: true,
    ws_node_id: presence.ws_node_id
  };
  if (presence.status === 'away') return {
    available: false,
    reason: 'away',
    last_seen: Number(presence.last_seen)
  };
  return { available: false, reason: 'offline' };
}
```

If online:
1. Create conversation record in PostgreSQL (mode: P2P, participants: buyer + seller)
2. Write `p2p:participants:{conv_id}` to Redis
3. Publish to `p2p:{conv_id}` channel → seller's WS node receives → pushes P2P invite frame to seller
4. Seller's FE shows "Buyer wants to chat about [property]" notification within the app
5. Both participants receive `session_state_change { state: P2P_ACTIVE, domain: user_seller }`

### Seller Offline Path

1. Create async message record in PostgreSQL
2. Send FCM/APNS push to seller device with deep link
3. Buyer sees: "Seller is currently offline. We've sent them your request — you'll be notified when they respond."
4. `conv:state.state` stays at `CONTACT_SELLER`
5. Expiry timer starts (see `expiry:contact_seller` sorted set in redis-state-machine.md)

When seller comes online:
- Heartbeat sets `presence:{seller_id}` → triggers keyspace notification
- Notification Service detects → looks up pending `CONTACT_SELLER` conversations for this seller
- Sends in-app notification to seller
- Seller taps → WS reconnect → session_state → `P2P_ACTIVE`

### What FE Shows During Contact Seller

The `contact_seller` template handles everything on the FE side:

```json
{
  "template_id": "contact_seller",
  "data": {
    "property_id": "prop_abc",
    "seller": {
      "seller_id": "sel_xyz",
      "name": "Rajesh Kumar",
      "type": "owner",
      "phone_masked": "+91 98XXX XX789",
      "response_rate": 87,
      "avg_response_hours": 2.5,
      "active_since": "2022-03"
    },
    "requires_login": true,
    "login_fields": ["name", "phone"],
    "cta": "Start Instant Chat"
  }
}
```

The login + info display + CTA is purely FE. BE only gets involved when user clicks "Start Instant Chat" and the `initiate_p2p` intent frame arrives. BE does not drive the form.

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
  home:             { main: 'property_search',    sub: 'new_search' },
  srp:              { main: 'property_search',    sub: 'filter_refine' },
  pdp:              { main: 'property_detail',    sub: 'view_overview' },
  project_page:     { main: 'project_research',  sub: 'view_overview' },
  locality_page:    { main: 'locality_research',  sub: 'view_overview' },
  builder_page:     { main: 'project_research',   sub: 'view_overview' },
  my_properties:    { main: 'portfolio',           sub: 'saved_properties' },
  seller_dashboard: { main: 'property_management', sub: 'add_listing' },
};
```

---

## Summary: What Changed from Earlier Design

| Earlier design | This clarification |
|---|---|
| Entities resolved by LLM via resolveEntity every time | FE sends resolved entity UUIDs when opening from a page — no resolution needed |
| LLM infers user intent from conversation history | Intent is declared in context header — LLM focuses on execution |
| Single "bot active" mode | 5 explicit chat_domains with different tools, prompts, routing |
| contact_seller was a tool call | contact_seller template is FE-driven; BE only triggers on `initiate_p2p` intent |
| State updates required LLM to track | State updates are side effects of tool calls in Bot Orchestrator |
| Context = full turn history | Context = structured header (entities, filters, intent) + last 20 turns + summary |
