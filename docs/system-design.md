# Housing.com Conversational Platform — System Design

## Overview

Housing.com is transitioning to a fully conversational model. All users land on a chat interface and progress through three distinct conversation modes within a single window:

| Mode | Description | Latency Target |
|---|---|---|
| Bot Chat | AI-powered property discovery | 3–4s acceptable |
| P2P Chat | Buyer ↔ Seller direct messaging | Near-zero |
| Support Chat | Bot-first, escalates to human agent | 3–4s (bot), near-zero (human) |

---

## 1. Transport Layer Decision

**Single WebSocket connection for all three modes.** Not SSE + WebSocket hybrid.

When a user transitions from bot chat to P2P chat (after contacting a seller), the connection does not drop or switch. The server changes the session state and routes subsequent messages differently — invisible to the user.

```
Client ──── WSS (single persistent connection) ──── WS Gateway
                                                         │
                                              ┌──────────┴──────────┐
                                              │    Chat Router      │
                                              │  (routes by state)  │
                                              └──────────┬──────────┘
                                                         │
                                         ┌───────────────┼───────────────┐
                                         │               │               │
                                    Bot Service    P2P Service    Support Service
```

SSE is not used. See `sse-vs-websocket.md` for the full analysis.

---

## 2. High-Level Architecture

```
                     ┌────────────────────────────────────────────┐
                     │              Clients                        │
                     │     Web (React)  ·  Android  ·  iOS        │
                     └──────────────────┬─────────────────────────┘
                                        │ WSS
                     ┌──────────────────▼─────────────────────────┐
                     │         NLB + WS Gateway                    │
                     │    (Nginx / AWS API GW + NLB)               │
                     └───────┬─────────────────┬───────────────────┘
                             │                 │
              ┌──────────────▼──┐        ┌─────▼──────────┐
              │ Connection Svc  │        │  REST API GW   │
              │ (WS router)     │        │  (HTTP/2)      │
              └──────────┬──────┘        └────────────────┘
                         │
         ┌───────────────┼──────────────────────────┐
         │               │                          │
┌────────▼──────┐ ┌──────▼──────────┐ ┌─────────────▼──────┐
│ Chat Router   │ │ Bot Orchestr.   │ │ P2P / Support Svc  │
│ Service       │ │ Service         │ │                    │
└────────┬──────┘ └──────┬──────────┘ └────────────┬───────┘
         │               │                          │
         │        ┌──────▼──────────┐               │
         │        │  LLM Gateway    │               │
         │        │  (Claude API,   │               │
         │        │  tool calling,  │               │
         │        │  streaming)     │               │
         │        └──────┬──────────┘               │
         │               │                          │
         └───────────────┼──────────────────────────┘
                         │
         ┌───────────────▼───────────────────────────────┐
         │             Message Broker                     │
         │   Kafka  (durability, replay, audit)           │
         │   Redis Pub/Sub  (real-time fan-out)           │
         └───────────────┬───────────────────────────────┘
                         │
         ┌───────────────┼───────────────────────────┐
         │               │                           │
┌────────▼──────┐ ┌──────▼──────────┐ ┌─────────────▼──────┐
│ PostgreSQL    │ │ Elasticsearch   │ │ Redis              │
│ (conv, msgs)  │ │ (properties)    │ │ (presence, session,│
│               │ │                 │ │  cache, dedup)     │
└───────────────┘ └─────────────────┘ └────────────────────┘
```

---

## 3. Conversation State Machine

Every session has an explicit state stored in Redis and mirrored to PostgreSQL. All routing decisions on the server are based on this state.

```
                    ┌──────────────┐
                    │   LANDING    │
                    └──────┬───────┘
                           │ first message
                    ┌──────▼───────┐
                    │  BOT_ACTIVE  │◄─────────────────────────┐
                    └──────┬───────┘                          │
                           │                                  │ "search again"
              ┌────────────┼──────────────┐                   │
              │            │              │                   │
   ┌──────────▼──┐  ┌──────▼──────┐  ┌───▼─────────────┐    │
   │  PROPERTY   │  │   SUPPORT   │  │  FILTER/REFINE  │────┘
   │  SELECTED   │  │  INITIATED  │  │  (still bot)    │
   └──────┬──────┘  └──────┬──────┘  └─────────────────┘
          │                │
          │         ┌──────▼──────────┐
          │         │  SUPPORT_BOT    │
          │         └──────┬──────────┘
          │                │ not resolved
          │         ┌──────▼──────────┐
          │         │  HUMAN_SUPPORT  │ ← agent claims from queue
          │         └─────────────────┘
          │
   ┌──────▼──────────────┐
   │  CONTACT_SELLER     │
   │  (confirm intent)   │
   └──────┬──────────────┘
          │
   ┌──────▼──────────────┐
   │  P2P_ACTIVE         │ ← seller notified, both online
   └──────┬──────────────┘
          │
   ┌──────▼──────────────┐
   │  P2P + BOT_ASSIST   │ ← bot available as side panel
   └─────────────────────┘
```

State transitions are events published to Kafka. The client receives a `session_state_change` frame and updates its UI accordingly (e.g., show/hide bot input vs. P2P input, change header).

---

## 4. WebSocket Message Protocol

Every frame on the wire is JSON with a consistent envelope:

```typescript
interface WsFrame {
  type: FrameType;
  conversation_id: string;
  message_id: string;       // UUID v7 (time-sortable), generated by sender
  session_id: string;
  timestamp: number;        // epoch ms
  payload: unknown;
}

type FrameType =
  // Bot flow
  | 'user_message'          // user → server
  | 'bot_chunk'             // server → user (streaming token batch; append-only, same message_id as final bot_complete)
  | 'bot_complete'          // server → user (final message + cards + response_id)
  | 'bot_tool_event'        // server → user ("Searching 2BHK in Bandra...") — rendered in header, not chat bubble
  // P2P / Support human
  | 'p2p_message'           // either direction
  | 'p2p_read'              // read receipt
  | 'p2p_typing'            // typing indicator
  // Presence
  | 'presence_update'       // online / offline / away
  // Control
  | 'session_state_change'  // BOT_ACTIVE → P2P_ACTIVE etc.
  | 'ack'                   // server acks every inbound message
  | 'error';
```

### Idempotency

Client generates a UUID v7 per outbound message. Server:
1. Checks `p2p:dedup:{message_id}` in Redis before processing.
2. If present, returns `ack` immediately without reprocessing.
3. If absent, processes and sets key with TTL 24h.

Safe to retry on reconnect without duplicate delivery.

---

## 5. Bot Service Architecture

```
user_message frame
       │
       ▼
Chat Router (checks session state → BOT_ACTIVE)
       │
       ▼
Bot Orchestrator
       │
  ┌────▼─────────────────────────────┐
  │        Context Builder            │
  │  - Last 10 turns from Redis       │
  │  - Compressed summary (beyond 10) │
  │  - Active filters state           │
  │  - Viewed property IDs            │
  └────┬─────────────────────────────┘
       │
  ┌────▼─────────────────────────────┐
  │        LLM Gateway               │
  │   Model: claude-sonnet-4-6       │
  │   Mode: streaming + tool use     │
  │   Tools: loaded per session state│
  └────┬─────────────────────────────┘
       │
  ┌────▼──────────────┐
  │   Tool Executor   │
  └────┬──────────────┘
       │
  ┌────┴──────────────────────────────────────────────────────┐
  │              │                    │                        │
  ▼              ▼                    ▼                        ▼
Property    Locality Svc         Transaction            Builder / Project
Search      (reviews, amenities, Data API               Svc (payment plans,
(ES)         pro/cons, schools)  (price trends,          construction status,
                                  old sales)             floor plans)
```

### Tool Definitions

```typescript
// Loaded into LLM system prompt as tool definitions

searchProperties(
  query: string,
  filters: {
    city?: string;
    locality?: string[];
    bhk?: number[];
    price_min?: number;
    price_max?: number;
    property_type?: 'apartment' | 'villa' | 'plot' | 'commercial';
    furnishing?: 'furnished' | 'semi' | 'unfurnished';
    transaction_type?: 'rent' | 'buy';
    amenities?: string[];
    possession_by?: string;
  }
) → PropertyListing[]

getPropertyDetail(property_id: string) → PropertyDetail
getSimilarProperties(property_id: string, count?: number) → PropertyListing[]
getProjectDetail(project_id: string) → ProjectDetail  // builder, phases, construction status
getLocalityDetail(locality: string, city: string) → LocalityDetail  // amenities, connectivity, schools, reviews
getFloorPlans(property_id: string) → FloorPlan[]      // image URLs + metadata
getTransactionHistory(locality: string, bhk_type: number) → TransactionData[]
getPriceTrends(locality: string, duration_months: number) → PriceTrend[]
getTrendingLocalities(city: string) → RankedLocality[]
getPaymentPlans(project_id: string) → PaymentPlan[]
applyFilter(filter_delta: Partial<SearchFilters>) → UpdatedSearchState
getSimilarLocalities(locality: string) → LocalitySummary[]
```

### Streaming over WebSocket

LLM token stream → bot service buffers 3–5 tokens → emits `bot_chunk` frame → client appends to bubble.

The `bot_chunk` frame is the WebSocket equivalent of the SSE `message_delta` event (v1.1 incremental streaming spec). Each chunk carries `chunk_index` (monotonic, starting at 0), optional `chunk_id` for dedup, and `content.text` as an **append-only** fragment. The final `bot_complete` frame (same `message_id`) is authoritative — FE replaces the streaming buffer with the canonical payload on receipt.

```typescript
// bot_chunk payload (streaming text only — templates remain atomic via bot_complete)
interface BotChunkPayload {
  source_message_id: string;  // user message_id this reply is for
  sequence_number: number;    // part index in multi-part reply
  chunk_index: number;        // 0-based, monotonically increasing within this message_id
  chunk_id?: string;          // optional dedup id (idempotent: skip if already seen)
  content: { text: string };  // append-only text fragment
  message_type: 'text' | 'markdown';  // required on chunk_index === 0 only
}
```

During tool execution: server emits `bot_tool_event` with a human-readable status ("Looking at properties in Bandra West..."). This keeps the UI responsive during the 200–500ms tool round-trip.

**Message identity in multi-part replies:** A single user message can produce multiple bot parts (e.g. intro text then property_carousel). Each part has its own `message_id`. `source_message_id` links all parts back to the user turn. `sequence_number` orders the parts. The final part carries `is_turn_complete: true` in `bot_complete`.

### Context Window Management

- Keep last 10 turns (user + bot) in Redis as raw messages.
- Beyond 10: send oldest 5 turns to LLM for summarization, store compressed summary in Redis.
- Context sent to LLM = system prompt + compressed summary (if exists) + last 10 turns.
- Haiku calls (Tier 3a) receive only last 3 turns; Sonnet calls (Tier 3b) receive the full 10.
- This bounds per-conversation LLM cost regardless of session length.

---

## 6. P2P Chat Architecture

Near-zero latency is achieved by separating the **delivery path** (Redis Pub/Sub) from the **persistence path** (Kafka → PostgreSQL).

```
Seller WS ──► WS Server A ──► Redis Pub/Sub ──► WS Server B ──► Buyer WS
                   │         (channel per conv)        │
                   └────────────► Kafka ◄──────────────┘
                                    │
                             Persistence Svc
                                    │
                               PostgreSQL
```

### Hot Path (delivery, ~5–15ms end to end)

1. Buyer sends `p2p_message` frame to WS Server B.
2. Server B publishes to Redis channel `p2p:{conversation_id}`.
3. WS Server A (holding seller's connection) is subscribed, receives instantly.
4. Server A pushes `p2p_message` frame to seller.

### Warm Path (persistence, async)

1. Same message also published to Kafka topic `chat.p2p.messages`.
2. Persistence Service consumes, writes to PostgreSQL.
3. If seller is offline, Notification Service also consumes → sends FCM/APNS push with deep link.

### Why Redis Pub/Sub and not just Kafka for delivery?

Kafka consumer lag is typically 50–200ms even under light load. Redis Pub/Sub is in-memory, sub-millisecond fan-out. Kafka is used for durability and replay, never for real-time delivery.

### Offline Message Flow

```
Buyer sends message
      │
      ▼
Redis Pub/Sub → no subscriber found (seller offline)
      │
      ▼
Kafka topic: chat.p2p.messages
      │
      ▼
Notification Service consumes
      │
      ▼
FCM / APNS push → Seller opens app → reconnects WS → 
server delivers missed messages from PostgreSQL on reconnect
```

---

## 7. WebSocket Scaling

```
                NLB (Layer 4)
                     │
       ┌─────────────┼─────────────┐
       │             │             │
 ┌─────▼─────┐ ┌─────▼─────┐ ┌────▼──────┐
 │ WS Node 1 │ │ WS Node 2 │ │ WS Node N │
 │ ~100k     │ │           │ │           │
 │ conns     │ │           │ │           │
 └─────┬─────┘ └─────┬─────┘ └────┬──────┘
       └─────────────┼─────────────┘
               Redis Pub/Sub
           (one channel per conversation_id)
```

- **Technology**: Go with `nhooyr.io/websocket` or Node.js with `uWebSockets.js`. Go handles ~100k concurrent connections per node at ~50MB RAM.
- **Load balancing**: NLB with IP hash for connection affinity. Correctness does not depend on affinity (Redis handles routing), but it reduces Redis subscription churn.
- **Scaling trigger**: HPA on connection count metric, not CPU. Target: 80k connections per pod before scaling out.
- **Session state**: Fully in Redis. Any node can handle any reconnect.

---

## 8. Support Chat: Bot → Human Escalation

```
User reports issue
      │
      ▼
Support Bot (same LLM infra, different system prompt + tool set)
      │
      ├── resolved → session ends or returns to property search
      │
      └── not resolved (triggers below)
            │
            ▼
      ┌─────────────────────────────────────────────────────┐
      │  Agent Queue (Redis sorted set)                     │
      │  Key: support:queue:{tier}                          │
      │  Score: timestamp + priority_boost                  │
      │  Priority boost factors: paid user, high intent,    │
      │  payment dispute, sentiment score                   │
      └──────────────────────┬──────────────────────────────┘
                             │
                   Agent Dashboard polls queue
                   Agent clicks "Claim"
                             │
                             ▼
                   session_state → HUMAN_SUPPORT
                   User sees: "Connected to Priya from Support"
                             │
                             ▼
                   Same P2P infrastructure
                   + Bot Co-pilot for agent
```

### Escalation Triggers

Any one of these triggers escalation from support bot to human:

- User explicitly says "talk to human" / "agent" / "real person"
- Sentiment classifier score < -0.6 on last 3 user messages
- Bot has attempted resolution 3+ times on the same issue (tracked in session state)
- Issue type is in `always_escalate` set: payment disputes, legal, account bans

### Agent Co-pilot

After agent claims a conversation:
- Bot reads full conversation history
- Suggests next response in agent dashboard (one-click send or edit)
- Surfaces relevant policy docs based on issue type
- Tracks resolution status — if agent marks resolved, session can be closed or returned to property search flow

---

## 9. Property Cards in Chat

Bot responses are structured — not just text strings.

```json
{
  "type": "bot_complete",
  "payload": {
    "text": "Here are 3 properties in Bandra under ₹2Cr that match your needs.",
    "cards": [
      {
        "type": "property_listing",
        "property_id": "prop_123",
        "thumbnail_url": "https://cdn.housing.com/...",
        "title": "2BHK in Bandra West",
        "price": "₹1.85 Cr",
        "area": "1050 sqft",
        "highlights": ["Sea view", "Ready to move", "Gym"],
        "quick_actions": [
          { "label": "See Details", "intent": "get_property_detail", "property_id": "prop_123" },
          { "label": "Similar Properties", "intent": "get_similar", "property_id": "prop_123" },
          { "label": "Contact Seller", "intent": "contact_seller", "property_id": "prop_123" }
        ]
      }
    ]
  }
}
```

Quick action taps send structured `user_message` frames:

```json
{
  "type": "user_message",
  "payload": {
    "intent": "get_property_detail",
    "property_id": "prop_123",
    "display_text": "Tell me more about this property"
  }
}
```

The `display_text` is shown in the chat bubble so the conversation remains readable. The `intent` + structured fields go to the bot for deterministic routing — no NLP parsing needed for card actions.

---

## 10. Data Models

### PostgreSQL

```sql
conversations (
  id              UUID PRIMARY KEY,         -- conversation_id on wire
  user_id         UUID NOT NULL,
  mode            TEXT NOT NULL,            -- 'BOT' | 'P2P' | 'SUPPORT'
  state           TEXT NOT NULL,            -- state machine state
  context         JSONB,                    -- active filters, viewed properties, intent
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

messages (
  id              UUID PRIMARY KEY,         -- UUID v7 (time-sortable)
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  sender_id       TEXT NOT NULL,            -- user_id, 'BOT', or agent_id
  sender_type     TEXT NOT NULL,            -- 'USER' | 'BOT' | 'AGENT'
  content         TEXT,
  content_type    TEXT NOT NULL,            -- 'TEXT' | 'CARD' | 'TOOL_RESULT' | 'SYSTEM'
  metadata        JSONB,                    -- cards, tool results, quick actions
  delivered_at    TIMESTAMPTZ,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conv_time ON messages (conversation_id, created_at DESC);

p2p_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  user_id         UUID NOT NULL,
  role            TEXT NOT NULL,            -- 'BUYER' | 'SELLER' | 'AGENT' | 'SUPPORT'
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

support_queue (
  id              UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  tier            TEXT NOT NULL,            -- 'standard' | 'priority' | 'vip'
  claimed_by      UUID,                     -- agent_id, NULL if unclaimed
  claimed_at      TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Redis Key Space

```
session:{session_id}              → {user_id, conversation_id, state, ws_node_id}   TTL: 24h
conv:context:{conversation_id}    → full context JSON (LLM working memory)           TTL: 7d
conv:turns:{conversation_id}      → list of last 10 raw turns (LPUSH + LTRIM 0 19)    TTL: 7d
conv:summary:{conversation_id}    → compressed summary of turns beyond 20            TTL: 7d
presence:{user_id}                → {status, last_seen, ws_node_id}                  TTL: 5min (heartbeat refreshed)
p2p:dedup:{message_id}            → 1 (idempotency)                                  TTL: 24h
support:queue:{tier}              → sorted set of conversation_ids, score = priority
p2p:channel:{conversation_id}     → Redis Pub/Sub channel (ephemeral)
```

---

## 11. Failure Modes & Resilience

| Failure | Impact | Mitigation |
|---|---|---|
| LLM API timeout | Bot doesn't respond | Retry 2x with backoff, then "I'm having trouble, try again in a moment" + alert |
| WS disconnect mid-bot-response | User loses partial response | On reconnect, server checks `bot_in_progress` flag in Redis; resumes or restarts |
| WS node crash | All connections on that node drop | NLB detects, clients reconnect; Redis session state is source of truth, any node picks up |
| Redis Pub/Sub down | P2P delivery breaks | Circuit breaker → degraded mode: poll DB every 500ms, alert oncall |
| Kafka lag spike | Persistence delayed, not delivery | Doesn't affect user experience; alerts on consumer lag > 10s |
| LLM property hallucination | Wrong data shown | All property data comes from structured tool responses, LLM only writes prose around them |
| Support queue empty of agents | User waits indefinitely | Show estimated wait time, offer callback/email, cap wait at configurable timeout |

---

## 12. Phased Rollout

### Phase 1 — Bot Chat (MVP)
- WebSocket connection (even if only using bot today, avoids a future migration)
- Bot service with property search tools
- Redis session state, PostgreSQL persistence
- Property cards with quick actions

### Phase 2 — P2P Chat
- P2P state transition from bot session
- Redis Pub/Sub fan-out for real-time delivery
- Kafka persistence path
- Seller notification (push)

### Phase 3 — Support Chat
- Support bot with separate system prompt
- Escalation triggers (explicit + sentiment)
- Agent queue (Redis sorted set)
- Agent dashboard

### Phase 4 — Intelligence Layer
- Agent co-pilot (bot suggests responses for human agents)
- Conversation funnel analytics
- A/B test bot prompts via conversation outcomes
- Proactive suggestions based on dwell time on property cards

---

## 13. Actual API Data Shapes (from existing implementation)

These shapes come from the production housing.com API and must be preserved in BE responses. FE templates depend on these exact field names.

### Filter format

Filters use **numeric IDs** (not string names):
```json
{
  "apartment_type_id": [1, 2],
  "property_type_id": [1],
  "contact_person_id": [1, 2],
  "facing": ["east", "west"],
  "has_lift": true,
  "is_gated_community": true,
  "is_verified": true,
  "min_price": 100,
  "max_price": 4800000,
  "max_area": 4000,
  "type": "project"
}
```

### Entity format

Localities are referenced by polygon UUID, not a custom `locality_id`:
```json
{
  "entities": [
    {
      "id": "f745c4c0226869fa87b8",
      "name": "sector 37d",
      "display_name": "Sector 37D, Gurgaon",
      "uuid": "f745c4c0226869fa87b8",
      "lon_lat": [76.97277802321182, 28.445236369097103],
      "city": "Gurgaon",
      "type": "locality"
    }
  ]
}
```

### City format

```json
{
  "city": {
    "city_name": "Gurgaon",
    "display_name": "Gurgaon",
    "city_uuid": "3c69d8421a77f8f8b611",
    "bbx_uuid": "526acdc6c33455e9e4e9",
    "id": "526acdc6c33455e9e4e9"
  }
}
```

### Service field

Use `"service": "buy" | "rent"` (not `transaction_type`) in property_carousel and search payloads.

### Property shape

Properties within `property_carousel.data.properties[]`:
```json
{
  "id": "107997",
  "type": "project",
  "title": "3 BHK Flat",
  "name": "Ramprastha Skyz",
  "short_address": [
    { "polygon_uuid": "f745c4c0226869fa87b8", "display_name": "Sector 37D" },
    { "polygon_uuid": "3c69d8421a77f8f8b611", "display_name": "Gurgaon" }
  ],
  "thumb_image_url": "...",
  "inventory_canonical_url": "/in/buy/projects/page/...",
  "property_tags": ["Ready to Move", "Project", "RERA Approved"],
  "is_rera_verified": true,
  "formatted_min_price": "1.29 Cr",
  "formatted_max_price": "1.52 Cr",
  "unit_of_area": "sq.ft.",
  "display_area_type": "Super Builtup Area",
  "min_selected_area_in_unit": 1725,
  "max_selected_area_in_unit": 2025,
  "inventory_configs": [
    {
      "formatted_price": "1.29 Cr",
      "number_of_bedrooms": 3,
      "apartment_type_id": 4,
      "area_value_in_unit": 1725,
      "price_on_request": false
    }
  ]
}
```

Note: `_id` is card-unique (for dedup in UI), `id` is the stable property/project identifier.

### Pagination

```json
{
  "pagination": {
    "p": 2,
    "results_per_page": 10,
    "is_last_page": false,
    "cursor": "-1977752683",
    "resale_total_count": 394,
    "np_total_count": 35
  }
}
```

Use `resale_total_count` (resale/rental listings) and `np_total_count` (new projects) as separate counts.

### Location coordinates

Coordinates from `location_shared` user_action are `[lat, lng]` array (not an object):
```json
{ "action": "location_shared", "coordinates": [28.4085982, 77.3166804] }
```

---

## 14. Framework Decision: Why Not LangChain/LangGraph

LangChain and LangGraph are commonly proposed for LLM orchestration. This section explains why they are **not used** for this project — a practical judgment, not a bias.

### LangChain

**What it's good for:** Rapid prototyping, connecting unfamiliar data sources, teams who don't yet know their orchestration pattern.

**Why it doesn't fit here:**

| Our requirement | LangChain reality |
|---|---|
| 4-tier deterministic routing with custom logic | LangChain chains add abstraction without benefit — we know exactly what the routing looks like |
| Redis-based atomic state machine (Lua transactions) | LangChain's memory is in-memory or poorly matched to Redis; we'd fight the abstraction |
| Intent-specific tool loading + prompt cache control | LangChain assembles prompts for you — breaking cache boundaries you carefully designed |
| Custom tool result summarization (90–95% token reduction) | LangChain's built-in tool result handling doesn't support this |
| WebSocket streaming with `bot_chunk` frames | LangChain's streaming support targets HTTP SSE; WS integration requires bypassing the abstraction |
| Multi-tier model selection (Haiku/Sonnet per intent) | Possible in LangChain, but requires fighting default routing |
| Production debugging (what exactly went to the API?) | Raw API calls are far easier to trace than LangChain's layers |

**Verdict:** LangChain is scaffolding for people who don't know their orchestration pattern yet. We know ours precisely. Writing the orchestrator directly is cleaner, faster, and debuggable.

### LangGraph

**What it's good for:** Complex multi-agent workflows where the next step depends on previous agent output in non-deterministic ways. Good for research agents, complex document processing pipelines.

**Why it doesn't fit here:**

| Our requirement | LangGraph reality |
|---|---|
| Simple 4-tier routing (already a clear state machine) | LangGraph adds node/edge overhead for a routing problem already solved by a switch statement |
| Redis state machine (Lua atomic transitions) | LangGraph's state is in-memory; checkpointing to external stores requires custom implementation that matches what we built anyway |
| Sub-100ms SLM classification | LangGraph's overhead adds latency on the hot path |
| Real-time WS streaming | LangGraph is not designed for WS delivery |
| Reproducible deterministic routing (Tier 1/2/4 are fully deterministic) | LangGraph's value is in conditional dynamic routing — irrelevant for 65% of our turns |

**Verdict:** LangGraph is appropriate when you have a non-deterministic graph of agents that must decide at runtime which path to take. Our routing is deterministic for 65% of turns (Tier 1, 2, 4) and well-defined for the remaining 35% (Tier 3). This is an orchestrator pattern, not an agent graph pattern.

### What We Use Instead

A purpose-built **Bot Orchestrator** as a single service with:
- Direct Anthropic/OpenAI/Google API calls (no abstraction layer)
- Explicit 4-tier routing logic (readable, testable, debuggable)
- Redis state machine for session management
- Custom prompt assembly with prompt cache control
- Inline tool result summarization
- TypeScript/Go — typed, fast, familiar

This is the correct choice at this stage. If the system later needs true multi-agent complexity (e.g., an agent that spawns sub-agents to research 10 localities simultaneously), LangGraph becomes worth revisiting at that point specifically.

---

## 15. Key Technology Decisions Summary

| Concern | Choice | Rationale |
|---|---|---|
| Transport | WebSocket (single conn) | Mode switching without reconnect, unified client state |
| Bot streaming | WS `bot_chunk` frames | Equivalent to SSE `message_delta` (v1.1 spec); reuses same connection |
| Real-time fan-out | Redis Pub/Sub | Sub-ms, avoids Kafka consumer lag on hot path |
| Durability | Kafka → PostgreSQL | Replay, audit, offline delivery |
| LLM | Claude claude-sonnet-4-6, streaming + tool use | Structured property data via tools prevents hallucination |
| WS servers | Go (nhooyr.io/websocket) | 100k conns/node, low memory footprint |
| Context management | Redis hot + DB summarization | Bounded LLM context cost, infinite session length |
| Idempotency | UUID v7 + Redis dedup | Safe retries on reconnect without duplicate delivery |
| Template IDs | Match existing FE contract | `download_brochure`, `nested_qna`, `share_location`, `shortlist_property` — do not rename |
| Filter IDs | Numeric IDs from production API | `apartment_type_id: [1,2]` not `["2bhk"]` — FE passes these to SRP deep-link |
| Property data in chat | Structured cards + intent-based quick actions | Deterministic routing, no NLP parsing for UI actions |
