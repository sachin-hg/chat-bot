# Unified Platform Integration Contracts

Session token validation, HandoffContext, RegistryPort, out_of_scope gateway signal, /chat/history endpoint, and session lifecycle.

---

## Part 11 — Unified Platform Integration Contracts

This section documents how the Search & Discovery service plugs into the unified platform
gateway defined in `unified-platform-architecture.md`. It covers authentication, handoff
context, out-of-scope signalling, session registry writes, chat history, the
`contact_seller` handoff hint, and the turn/session lifecycle distinction.

---

### 1. Session Token Validation

The routing gateway issues a short-lived `session_token` when it assigns a session to this
service. Every subsequent request from the client must include that token. The service
validates the token on each turn before loading session state.

#### Updated `ChatEventFromUser`

```python
class ChatEventFromUser(BaseModel):
    # Existing fields (unchanged):
    conversation_id: str           # derived from validated token — not trusted from body
    message_type:    str           # 'text' | 'user_action' | 'context' | 'system_event'
    content:         MessageContent

    # New field — required for platform integration:
    session_token:   str           # gateway-issued JWT or opaque token
```

> **Note:** `conversation_id` is included in the body for backwards-compatibility with
> direct service calls (testing, admin tools) but is **not trusted** when a
> `session_token` is present. The authoritative `conversation_id` is derived from the
> validated token.

#### Validation flow

```python
async def resolve_session(body: ChatEventFromUser, request: Request) -> SessionState:
    """
    1. Validate session_token — JWT verify (signature + exp) or Redis lookup
       mapping  session_token → conversation_id  (gateway writes this on RouteResponse).
    2. Derive conversation_id from the token; ignore body.conversation_id.
    3. Load session via session_store.load_by_conversation(conversation_id, request).
    4. Raise HTTP 401 if token is missing, signature invalid, or expired.
    """
```

| Validation outcome | HTTP response |
|---|---|
| Token valid, session found | 200 — proceed |
| Token signature invalid | 401 `{ "error": "invalid_token" }` |
| Token expired | 401 `{ "error": "token_expired" }` |
| Token valid, session not found | 404 `{ "error": "session_not_found" }` |

The gateway rotates `session_token` values on mode switches; the old token becomes invalid
when a new `RouteResponse` is issued. Clients must use the current token from their most
recent `RouteResponse`.

---

### 2. HandoffContext at Session Init

When the gateway routes a session to this service after a mode switch, it attaches a
`HandoffContext` snapshot to the first request body. This snapshot carries entities and a
conversation summary from the prior service.

#### Extended `ChatEventFromUser` (first turn only)

```python
class ChatEventFromUser(BaseModel):
    # ... existing + session_token fields ...

    # Present only on the first turn of a newly routed session:
    handoff_context: HandoffContext | None = None
```

```python
# Mirrors the TypeScript interface in unified-platform-architecture.md
class SharedEntities(BaseModel):
    user_id:             str
    active_property_id:  str | None = None
    active_seller_id:    str | None = None
    active_listing_id:   str | None = None
    active_ticket_id:    str | None = None
    transaction_type:    Literal['buy', 'rent'] | None = None
    city:                str | None = None

class HandoffContext(BaseModel):
    handoff_from:         str          # ServiceType
    handoff_to:           str          # always 'search_discovery' for this service
    trigger:              Literal['out_of_scope', 'system_event', 'ui_escape', 'session_end']
    conversation_summary: str          # 1-2 sentence summary of prior session
    shared_entities:      SharedEntities
    event_context:        dict | None = None   # SystemEvent — present when trigger='system_event'
```

#### Handler mapping — before graph invocation

When `handoff_context` is present, the FastAPI handler maps its fields into session state
**before** `pipeline.ainvoke(initial_state, ...)` is called:

```python
if body.handoff_context:
    hc = body.handoff_context
    se = hc.shared_entities
    session['active_property_id'] = se.active_property_id or session.get('active_property_id')
    session['active_seller_id']   = se.active_seller_id   or session.get('active_seller_id')
    session['city']               = se.city               or session.get('city')
    session['transaction_type']   = se.transaction_type   or session.get('transaction_type')
    session['handoff_summary']    = hc.conversation_summary   # injected on turn 1 only
```

#### Updated `BotState` / session state keys

```python
# Added to the documented session state keys:
'handoff_summary': Optional[str]   # populated on turn 1 when HandoffContext is present;
                                   # cleared after first LLM call so it is not repeated
```

#### `build_prompt_node` injection (turn 1 only)

When `session['handoff_summary']` is non-empty, `build_prompt_node` prepends a context
block to the system prompt before any other content:

```
[Context from previous session]
{handoff_summary}
```

After injecting it, `build_prompt_node` clears `session['handoff_summary']` so subsequent
turns in the same session do not repeat the context block.

---

### 3. `out_of_scope` Gateway Signal

When the service cannot classify a message and the reason is a **domain mismatch** (not
ambiguity or a social pleasantry), it must signal the gateway rather than respond to the
user directly. The gateway then invokes the routing SLM and issues a new `RouteResponse`.

#### New SSE event type: `out_of_scope`

```typescript
// SSE event types for this service (one new SSE connection per turn):
type SSEEventName =
  | 'connection_ack'    // emitted before graph starts
  | 'message_delta'     // token-level LLM streaming chunks
  | 'chat_event'        // complete ChatEventToUser envelope — includes templateId: "login" for auth-gated flows
  | 'error'             // unrecoverable error
  | 'out_of_scope';     // domain mismatch; gateway must re-route
```

#### `out_of_scope` event shape

```typescript
interface OutOfScopeEvent {
  original_message: string;   // verbatim user message that triggered the signal
  session_token:    string;   // current session token (gateway uses to correlate)
}
```

Example SSE frame:

```
event: out_of_scope
data: {"original_message": "I want to pay my electricity bill", "session_token": "eyJ..."}

```

#### When `route_node` emits this signal

`route_node` emits `out_of_scope` and **closes the SSE stream** only when **both**
conditions are met:

| Condition | Value |
|---|---|
| `tier` | `0` |
| `sub_intent` | `'out_of_scope_query'` |

```python
# Inside route_node
if routing['tier'] == 0 and classification['sub_intent'] == 'out_of_scope_query':
    emit_sse('out_of_scope', {
        'original_message': state['raw_message'],
        'session_token':    session['session_token'],
    })
    # No bot_response set — stream closes after this frame.
    return {**state, 'routing': routing}
```

#### Distinction: what is handled locally vs passed to gateway

| Signal | Classification | Handled by |
|---|---|---|
| Domain mismatch | `tier=0, sub_intent='out_of_scope_query'` | Gateway — `out_of_scope` SSE event |
| Gibberish / too vague | `tier=0, sub_intent='insufficient_info'` | Local — clarification response |
| Social pleasantry | `tier=0, sub_intent='social_pleasantry'` | Local — brief canned response |

`insufficient_info` and `social_pleasantry` are **not** passed to the gateway. They are
fully handled within this service without emitting `out_of_scope`.

---

### 4. Session Registry Integration

The service writes lightweight session metadata to the shared Session Registry on session
start and end. No message content is ever written to the registry.

#### `RegistryPort` protocol

```python
from typing import Protocol
from datetime import datetime

SERVICE_TYPE = 'search_discovery'

class SessionRecord(BaseModel):
    session_id:   str
    user_id:      str
    service_type: str           # always SERVICE_TYPE for this service
    started_at:   datetime
    ended_at:     datetime | None = None
    preview:      str           # ≤ 80 chars; first message or intent-derived title
    status:       Literal['active', 'ended']

class RegistryPort(Protocol):
    async def write_session_start(self, record: SessionRecord) -> None: ...
    async def write_session_end(self, session_id: str, ended_at: datetime) -> None: ...
    async def ping_session(self, session_id: str, last_seen_at: datetime, turn_count: int) -> None:
        """Update last_seen and turn_count without changing status. Called after every turn."""
        ...
```

`RegistryPort` is injected at startup via `functools.partial`, the same pattern used for
`ClassifierPort`, `LLMPort`, and `SessionStorePort`:

```python
# startup.py
registry: RegistryPort = PostgresRegistryAdapter(db_pool=pool)
# injected into the handler via partial, not a global
```

#### Session start write — in `generate()`

In the FastAPI `generate()` function, after session load and token validation, **before**
`pipeline.ainvoke(...)`:

```python
async def generate():
    yield sse_frame('connection_ack', {...})

    # --- Session registry write (start) ---
    preview = (
        raw_message[:80]
        if raw_message
        else f"{classification.get('main_intent', 'search')} in {session.get('city', 'India')}"
    )
    await registry.write_session_start(SessionRecord(
        session_id   = session['session_id'],
        user_id      = session['user_id'],
        service_type = SERVICE_TYPE,
        started_at   = datetime.utcnow(),
        preview      = preview,
        status       = 'active',
    ))
    # --- End registry write ---

    graph_task = asyncio.create_task(pipeline.ainvoke(initial_state, config=run_config))
    ...
```

When `preview` must be derived from classification (e.g. the first turn is a `user_action`
rather than text), the fallback pattern `f"{main_intent} in {city}"` produces a
human-readable title such as `"search_properties in Mumbai"`.

#### Session end write — in `followup_node`

`followup_node` runs after every full turn's `update_session_state`. After the state write,
it updates the registry:

```python
# Inside followup_node, after update_session_state(state, session):
# Session Registry receives a lightweight turn ping (updates last_seen, increments turn_count).
# write_session_end is NOT called here — it is called by the HTTP handler when the session_token
# is revoked (mode switch) or when the gateway sends a session_ended system event (Part 11 §7).
await registry.ping_session(
    session_id   = session['session_id'],
    last_seen_at = datetime.utcnow(),
    turn_count   = session.get('turn_count', 0),
)
```

---

### 5. Chat History Endpoint

Each service owns its own message history. The Search & Discovery service exposes a
paginated endpoint the UI calls after resolving the owning service from the Session Registry.

#### Endpoint

```
GET /chat/history?session_id={X}&token={Y}
```

| Parameter | Type | Description |
|---|---|---|
| `session_id` | `string` | Session to retrieve history for |
| `token` | `string` | Session token issued by the gateway (same token used for SSE) |
| `cursor` | `string?` | Opaque offset cursor for pagination (omit for first page) |

#### Authentication

The handler validates `token` against the same token store used by the message endpoint
(JWT verify or Redis lookup). Requests with invalid or expired tokens receive `401`.

#### Response

```typescript
interface ChatHistoryResponse {
  session_id:  string;
  messages:    ChatEventToUser[];   // ordered by sequence_number asc
  next_cursor: string | null;       // null when no further pages
  total:       number;              // total messages in the session
}
```

- Maximum 50 messages per page.
- `cursor` is an opaque string encoding the offset; clients must not parse or construct it.

#### Storage

Kafka consumer writes one row per `chat_event` SSE frame to a `chat_history` Postgres table:

```sql
CREATE TABLE chat_history (
    id             bigserial PRIMARY KEY,
    session_id     text        NOT NULL,
    message_id     text        NOT NULL UNIQUE,
    sequence_num   int         NOT NULL,
    sender_type    text        NOT NULL,   -- 'user' | 'bot'
    message_type   text        NOT NULL,   -- 'text' | 'template'
    content_json   jsonb       NOT NULL,
    created_at     timestamptz NOT NULL,
    INDEX (session_id, sequence_num)
);
```

Retention: **90 days**. Rows older than 90 days are deleted by a scheduled cleanup job.

---

### 6. `contact_seller` Handoff Hint

When the `contact_seller` Tier 1 action completes successfully, the response payload
includes a `handoff_hint` field. This hint signals the client that a `user_seller_chat`
session can be opened with pre-populated entities — it is a suggestion, not a forced
redirect.

#### Response payload shape

After the `contactSeller` API call succeeds, the Tier 1 response dict (which becomes
`bot_response` and is then wrapped by `emit_final_state`) includes:

```json
{
  "template_id": "contact_seller_success",
  "data": {
    "property_name":   "2BHK in Andheri West",
    "seller_name":     "Rahul Sharma",
    "message_preview": "Your message has been sent."
  },
  "handoff_hint": {
    "target": "user_seller_chat",
    "entities": {
      "active_property_id": "prop_abc123",
      "active_seller_id":   "seller_xyz789"
    }
  }
}
```

#### Client behaviour

1. Client renders the `contact_seller_success` template (confirmation message).
2. Client renders a **"Chat with seller"** CTA button using `handoff_hint.target` and
   `handoff_hint.entities`.
3. If the user taps the CTA, the client sends a new `RouteRequest` to the gateway with
   `handoff_hint.entities` pre-populated in `shared_entities`.
4. If the user continues searching instead, the hint is discarded — no state change.

The hint is **never** acted upon automatically. The user must explicitly tap the CTA.

---

### 7. Session Lifecycle

The SSE model is **one new connection per turn** — stateless at the transport layer:

```
POST /chat/message  { session_token, content }   ← client submits user message
GET  /chat/stream   { session_token }             ← client opens fresh SSE to receive response
```

The SSE stream opens, the pipeline runs, the service streams the response, and the HTTP response closes naturally after the final `chat_event { sourceMessageState: "COMPLETED" }`. Conversation state lives in Redis / Postgres — not on the connection.

```
connection_ack                        ← stream opened
message_delta × N                     ← LLM streaming (if applicable)
chat_event { COMPLETED }              ← end of response; HTTP response closes
                                         FE detects COMPLETED and re-enables input
```

For the **next user message**, the client sends a new POST and opens a new GET /chat/stream. Any backend instance can handle it — no sticky sessions, no long-lived socket to maintain.

**Session end (mode switch / timeout):** The gateway stops issuing RouteResponses for this service. The service writes `SessionRecord.ended_at` to the Registry when `session_token` is no longer valid. No special SSE event is needed — the next POST simply returns 401 or is not made at all (client queries the gateway first).

---

