# Unified Chat Platform Architecture — Housing.com

## Overview

Five conversational products share a single UI entry point. They differ fundamentally in interaction model (AI vs relay), communication protocol, data domain, and team ownership. This document specifies the coordination layer that makes them feel unified to the user while keeping each service independently deployable, independently scalable, and independently maintainable.

---

## The Five Services

| Service | Nature | Protocol | Owns AI? |
|---|---|---|---|
| Search & Discovery Bot | AI — complex NLP, 19-node LangGraph pipeline (2-stage SLM cascade) | SSE | Yes |
| Seller Property Management Bot | AI — write-heavy, listing CRUD | SSE | Yes |
| Support Agent Bot | AI — KB + ticket routing | SSE | Yes |
| Support Human Chat | Relay — human agent queue | WebSocket | No |
| User-Seller Chat | Relay — P2P messaging | WebSocket | No |

**Key distinction:** Support Human Chat and User-Seller Chat are not bots. They are message relay channels. They have no intent classification, no LLM calls, and no AI pipeline. Calling them "bots" is a naming mistake that drives unnecessary architectural complexity.

---

## Unified Entry Point

### Single Chat Window

The UI presents one chat interface regardless of which service is active. The user never navigates between apps or products. Mode switches happen within the same window, marked by a visual divider. The underlying service routing is invisible to the user.

### Soft Mode Chip

At session start, if the routing gateway detects genuine ambiguity (user has both buyer and seller profiles), the UI renders a non-blocking mode suggestion — not a gate:

```
╔══════════════════════════════════════╗
║  Hi Rahul. What are you looking for? ║
║                                      ║
║  [Browse properties]  [My listings]  ║
╚══════════════════════════════════════╝
```

**Properties:**
- Non-blocking: user can type freely without selecting; routing SLM handles unselected cases
- Sticky: shown once per session, never again
- Profile-defaulted: a user with no listings never sees "My listings"
- Omittable: if session was opened from a property page, listing page, or support link, skip entirely — context is already known

### Profile-Based Defaults

| User profile | Default mode | Chip shown? |
|---|---|---|
| Buyer only | search_discovery | No |
| Seller only | seller_mgmt | No |
| Both | last-used, fallback to search_discovery | Yes |
| New user | search_discovery | No |

---

## Routing Gateway

### Role: Connection Broker, Not Proxy

The gateway determines which service handles this session and returns a direct connection endpoint to the client. It never sits in the path of message traffic after the handshake.

```
Client → Gateway  (once, at session start or mode switch)
         Gateway returns: { endpoint, session_token, protocol }
Client → Service  (directly, for entire session duration)
```

Routing as a message proxy would add a hop to every turn, make the gateway a bottleneck, and require it to handle both SSE streaming and WebSocket forwarding simultaneously. The gateway steps aside after the handshake. This is the same pattern as WebRTC signaling — the signaling server brokers the connection, then is out of the picture.

### When the Routing SLM Fires

The routing SLM (5-bucket classifier) does **not** run on every message. It runs at three specific moments only:

1. **Session start with ambiguity** — user profile is ambiguous and the soft chip was not selected
2. **Current service returns out-of-scope** — the service's own classifier could not handle the message and passes it back to the gateway with an `out_of_scope` flag
3. **System event triggers a switch** — a purchase, booking, or lead event fires; the gateway re-routes proactively

For everything else, the active service handles its own classification internally. Across a typical session of 15–20 messages, the routing SLM fires at most once or twice. The cost is negligible.

### Routing SLM: 5-Bucket Taxonomy

```
search_discovery    — property browsing, filter changes, locality research,
                      price trends, EMI questions
seller_mgmt         — my listings, leads, edit listing, publish, pricing analytics
support             — packages, billing, RM assignment, complaints, account issues
p2p_contact         — user wants to directly message a specific seller
                      (transition from search; requires active_property_id)
out_of_scope        — none of the above; gateway emits a clarifying question
```

### Routing Decision Priority

Evaluated top to bottom; first match wins:

```
1. Active sticky session (p2p_chat, support_human) → stay, no re-evaluation
2. System event signal → route by event type, no SLM
3. UI escape hatch tap → route by explicit selection, no SLM
4. Unambiguous profile + no message → profile default, no SLM
5. Soft chip selected → route by selection, no SLM
6. Routing SLM → classify message + session context
7. SLM confidence < threshold → emit clarifying question, do not guess
```

Keyword-based routing is explicitly excluded. Keywords are brittle, fail on phrasing variations, fail across languages, and are unmaintainable as the product evolves. The SLM handles semantic cases; everything above it handles deterministic cases.

### Gateway TypeScript Interface

```typescript
type ServiceType =
  | 'search_discovery'
  | 'seller_mgmt'
  | 'support_agent'
  | 'support_human'
  | 'user_seller_chat';

interface RouteRequest {
  user_id:       string;
  session_id:    string;
  message?:      string;         // present when triggered by a user message
  event?:        SystemEvent;    // present when triggered by a system event
  current_mode?: ServiceType;    // present on mid-session switch
  profile:       UserProfile;
}

interface RouteResponse {
  service:        ServiceType;
  endpoint:       string;         // direct service URL for SSE or WS connection
  session_token:  string;         // short-lived token scoped to this service session
  protocol:       'sse' | 'ws';
  context:        HandoffContext;
}
```

---

## Communication Models

### SSE for AI Bots (Search, Seller Mgmt, Support Agent)

**Interaction pattern:** user sends a message → service streams a response.

```
POST /chat/message  { session_token, content }   ← user turn
GET  /chat/stream   { session_token }             ← service streams response (SSE)
```

Stateless between turns on the server side. No sticky session requirement — any instance can handle any POST. Works through proxies, CDNs, and load balancers without configuration. Each turn is independent. This is the production pattern used by every major LLM chat product.

### WebSocket for P2P Relay (User-Seller Chat, Support Human Chat)

**Interaction pattern:** both parties push messages at arbitrary times.

```
WS /chat/connect?token={session_token}

// Frame types:
{ type: 'message',   sender_id, content, timestamp, message_id }
{ type: 'typing',    sender_id }
{ type: 'presence',  user_id, status: 'online' | 'offline' | 'away' }
{ type: 'read',      message_id }
{ type: 'end_session' }
```

Required for genuine bidirectionality: the seller pushes messages to the buyer at any time without the buyer polling; presence indicators and read receipts require server push. SSE is technically possible for the buyer-receives side but cannot cleanly handle seller-initiated pushes or presence state.

### Client Connection State Machine

At any given time the client holds exactly one active connection.

```
        IDLE
         │
         │ gateway returns sse endpoint
         ▼
  SSE_CONNECTED ──────────────── active during AI bot modes
  (search_discovery | seller_mgmt | support_agent)
         │
         │ Each turn = one new SSE connection:
         │   POST /chat/message → submit user turn
         │   GET  /chat/stream  → open fresh SSE, receive response
         │   chat_event { sourceMessageState: "COMPLETED" } → stream closes
         │   (repeat for next turn)
         │
         │ mode switch → query gateway, gateway returns ws endpoint
         ▼
   WS_CONNECTED ──────────────── active during relay modes
   (user_seller_chat | support_human)
         │
         │ session end or user exits
         ▼
        IDLE → query gateway → returns to prior bot mode
```

**SSE per-turn lifecycle (AI bot modes):**
- `connection_ack` — stream opened, pre-fetch complete
- `message_delta` × N — LLM streaming chunks
- `chat_event { sourceMessageState: "COMPLETED" }` — response done; HTTP stream closes
- FE detects COMPLETED, re-enables input for the next user message

---

## Session Registry

A thin shared store containing session metadata only — no message content. Its sole purpose is to let the UI build a history list and know which service to fetch messages from.

### Schema

```typescript
interface SessionRecord {
  session_id:   string;
  user_id:      string;
  service_type: ServiceType;
  started_at:   Date;
  ended_at?:    Date;
  preview:      string;    // first user message or auto-generated title, max 80 chars
  status:       'active' | 'ended';
}
```

### Write Protocol

Each service writes one `SessionRecord` on session start and updates `ended_at` + `status` on session end. No message content is ever written here. This is an append-only, low-write-volume store — a simple Postgres table or Redis sorted set is sufficient.

### UI Usage

```
GET /session-registry/sessions?user_id={X}&limit=20
→ returns SessionRecord[], sorted by started_at desc

Tapping a session:
GET {service_endpoint}/chat/history?session_id={X}&token={Y}
→ service returns its own message history for that session
```

History is shown as a list of sessions, not a merged timeline. Sessions from different services appear as separate items. The registry tells the UI where each session lives; the UI fetches messages directly from the owning service.

---

## Chat History

Each service maintains its own chat history in its own database. Schemas, retention policies, and storage backends are service-specific concerns.

| Service | Suggested retention |
|---|---|
| Search & Discovery | 90 days |
| Seller Management | 1 year (listings and leads context) |
| Support Agent | 3 years (compliance) |
| Support Human Chat | 3 years (compliance) |
| User-Seller Chat | 1 year |

History is displayed as **separate sessions** in the UI, not a merged timeline. A switch from search to support mid-window appears as two sessions. In the active window, a visual mode divider marks the transition without interrupting the experience.

### Mode Switch Divider

The divider is **UI-rendered only**. It is not stored as a message. The client inserts it at the point where `service_type` changes between two consecutive sessions rendered in the same window view.

```
[Search & Discovery]
User: show me 2BHK in Andheri under 60k
Bot:  Here are 5 options in Andheri West...

── Switched to Support ──────────────────

User: I bought Housing Premium but my RM hasn't reached out
Bot:  I can help with that. Let me check your account...
```

---

## Handoff Contracts

When the gateway routes to a new service, it passes a context snapshot. Each service declares what it provides on exit and what it requires on entry. This is a typed interface — not a shared database dependency.

### Core Interfaces

```typescript
interface HandoffContext {
  handoff_from:         ServiceType;
  handoff_to:           ServiceType;
  trigger:              'out_of_scope' | 'system_event' | 'ui_escape' | 'session_end';
  conversation_summary: string;          // 1-2 sentence summary of prior session
  shared_entities:      SharedEntities;
  event_context?:       SystemEvent;     // present when trigger = 'system_event'
}

interface SharedEntities {
  user_id:             string;
  active_property_id?: string;
  active_seller_id?:   string;
  active_listing_id?:  string;
  active_ticket_id?:   string;
  transaction_type?:   'buy' | 'rent';
  city?:               string;
}

interface SystemEvent {
  type:      'package_purchased' | 'listing_created' | 'lead_received' | 'session_ended';
  payload:   Record<string, unknown>;
  occurred_at: Date;
}
```

### Per-Service Handoff Contracts

**search_discovery → support_agent** (package purchase example)
```typescript
provides: {
  conversation_summary: "User browsing 2BHK rentals in Andheri, purchased Housing Premium",
  shared_entities: { transaction_type, city },
  event_context: { type: 'package_purchased', payload: { package_id, purchased_at } }
}
requires: {}   // support opens with account lookup regardless
```

**search_discovery → user_seller_chat**
```typescript
provides: {
  shared_entities: { active_property_id, active_seller_id, transaction_type }
}
requires: {
  active_property_id: required,   // cannot open seller chat without a property
  active_seller_id:   required,
}
```

**support_agent → support_human_chat**
```typescript
provides: {
  conversation_summary: string,
  shared_entities: { active_ticket_id },
  // human agent reads full conversation history directly from support service
}
requires: {
  active_ticket_id: required,
}
```

### Receiving Service Acknowledgment

The receiving service's first response acknowledges the context. This is where the seamless experience is created — not in the routing layer, but in the receiving service's opening message:

- *"I see you recently purchased Housing Premium. Are you following up on RM assignment?"*
- *"Connecting you with the seller for [Property Name in Andheri]..."*
- *"I'm passing you to a support agent. They can see your conversation history."*

---

## Mid-Session Switching

Three distinct mechanisms, each handled differently.

### 1. Out-of-Scope Passback

The active service cannot classify the message within its own taxonomy. It returns an `out_of_scope` signal to the gateway — not a user-facing error response. The gateway invokes the routing SLM with the original message plus session context. SLM classifies → gateway issues a new `RouteResponse` → client re-connects to the new service with a handoff context snapshot.

The user experiences: a brief pause (routing SLM call + new connection establishment, target < 300ms), then the new service's opening acknowledgment.

### 2. System-Event-Driven Switch

A backend event fires — package purchased, RM assigned, lead received. The gateway injects a proactive message into the current session *before* waiting for the user to raise the issue:

```
[User is mid-search]

Bot (system-injected): "You've activated Housing Premium ✓ Your dedicated RM 
                        will contact you within 24 hours. If they don't, tap 
                        here to raise a support request."
```

The user's subsequent follow-up ("they still haven't called") now arrives with full context. The routing decision becomes easy: support, with `event_context: { type: 'package_purchased', ... }` already in the session. The user is never confused about why the topic changed — the system surfaced it proactively.

### 3. UI Escape Hatch

A persistent low-friction affordance in the chat UI — "Support / Help" button or a mode-switch control. Tapping it is a direct UI event, not a chat message. The client sends a `RouteRequest` with `trigger: 'ui_escape'` to the gateway. No SLM invocation — intent is explicit. Gateway returns the appropriate new endpoint.

This covers the case where the current bot is responding correctly within its charter but the user wants to escalate or switch context. Without this, users who feel stuck have no recovery path.

---

## What Not to Build

| Temptation | Why not |
|---|---|
| Keyword-based routing | Brittle on phrasing and language variations; collapses under synonyms; unmaintainable |
| Routing layer as message proxy | Every message pays a proxy hop; gateway becomes a bottleneck and single point of failure |
| Unified chat history service | Forces a shared DB dependency; different retention and schema needs per service; per-service storage is simpler and correct |
| Client-side SLM for routing | Routing requires server-side profile and session state; client has neither reliably |
| Forcing one protocol (all SSE or all WebSocket) | Each protocol matches its interaction model; forcing uniformity adds complexity with no benefit |
| "Router bot" that talks to users | The gateway never produces user-facing messages; only the receiving service does |
| Single monolithic intent taxonomy across all services | Each service owns its own deep taxonomy; routing layer only needs 5 coarse buckets |

---

## Summary: Coordination Layer at a Glance

| Component | What it does | Shared? |
|---|---|---|
| Routing Gateway | Connection broker; SLM only at ambiguity or out-of-scope | Yes — single gateway |
| Session Registry | Metadata-only index; lets UI build history list | Yes — thin shared store |
| Handoff Context | Context snapshot at mode switch | Typed interface only — no shared DB |
| Chat History | Full message storage per session | No — each service owns its own |
| Mode Switch Divider | Visual marker between sessions in the window | UI-rendered only — never stored |
| Escape Hatch | Explicit user-initiated switch | UI affordance → gateway event |
| Soft Mode Chip | Ambiguity resolution at session start | UI affordance → gateway hint |
