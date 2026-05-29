# SSE Protocol & Multi-Event Turn Assembly

SSE event types, 3-phase turn lifecycle, sequence number rules, graph node invariants, and conflict resolutions.

---

## Part C — SSE Protocol

Every streaming response is a Server-Sent Events stream. Each SSE message has:
```
event: <event_name>\n
data: <JSON>\n
\n
```

### C1. Turn Lifecycle

**Template intents** (property_search/*, locality_research/trending_localities, locality_research/locality_comparison, comparison/compare_localities, portfolio/recommendations, property_detail/similar_properties):
```
1. connection_ack
2. [Phase 1 — Summary, emitted BEFORE fetch]
   message_delta (chunk 0, messageType: "text")   ← summary_node streams single chunk
   chat_event (text, seq 0, sourceMessageState: "IN_PROGRESS")
3. [Phase 2 — Templates, emitted immediately AFTER fetch]
   chat_event (template, seq 1, sourceMessageState: "IN_PROGRESS")
   chat_event (template, seq 2, sourceMessageState: "IN_PROGRESS")   ← if multiple templates
4. [Phase 3 — Followup commentary, LLM-generated]
   message_delta ×N                                ← llm_node streams chunks
   chat_event (text/markdown, seq N, sourceMessageState: "COMPLETED")
5. connection_close
```

**Text-only intents** (property_detail/about, price_trends, commute_time, FAQ, financial):
```
1. connection_ack
2. [Single phase — LLM is the full response, no summary or templates]
   message_delta ×N                                ← llm_node streams chunks
   chat_event (text/markdown, seq 0, sourceMessageState: "COMPLETED")
3. connection_close
```

**Short-circuit turns** (Tier 0/1/2, clarification, auth-gated):
```
1. connection_ack
2. chat_event (single event via emit_final_state — sourceMessageState: "COMPLETED")
   OR nested_qna / login / share_location template event
   (HTTP response closes immediately after — no streaming)
3. connection_close
```

**Ordering guarantee:** The graph topology enforces ordering. `summary_node` completes before
`fetch_data_node` starts. `respond_node` (templates) completes before `llm_node` starts streaming.
The FE receives events in causal order over the same SSE connection — no race conditions.

### C2. connection_ack

```typescript
interface ConnectionAck {
  messageId:    string;  // request_id (UUID4) — identifies this turn, not a DB message row
  messageState: 'IN_PROGRESS';
}
```

Emitted immediately when the POST is received. The frontend treats this as confirmation that
the message was received and shows the user's message in "sent" state.

### C3. chat_event

A complete `ChatEventToUser` object (see Part B1), serialized as JSON.

### C4. message_delta

A `MessageDeltaEventToUser` object (see Part B3), serialized as JSON. Only emitted when
`?streamingEnabled=true` is in the query string.

### C5. connection_close

```json
{
  "reason": "response_complete" | "inactivity_15s" | "error" | "cancelled"
}
```

---


## Part F — Multi-Event Turn Assembly

A single bot turn produces up to 3 phases of SSE events. All rows share the same `sourceMessageId`
(= `request_id` for the turn). `sequenceNumber` orders them within the turn. The last event always
has `sourceMessageState: "COMPLETED"` — the FE waits for this before marking the turn done.

### F1. Sequence Model

**Template intents** (property_search, locality_research, comparison, portfolio, similar_properties):
```
sourceMessageId = request_id

Phase 1 — Summary (summary_node, BEFORE fetch)
  message_delta  { messageId: A, sequenceNumber: 0, chunkIndex: 0, content.text: "..." }
  chat_event     { messageId: A, seq: 0, type: "text",     sourceMessageState: "IN_PROGRESS" }

Phase 2 — Templates (respond_node, AFTER fetch)
  chat_event     { messageId: B, seq: 1, type: "template", templateId: "property_carousel",
                   sourceMessageState: "IN_PROGRESS" }
  chat_event     { messageId: C, seq: 2, type: "template", templateId: "locality_carousel",
                   sourceMessageState: "IN_PROGRESS" }   ← IN_PROGRESS even if last template

Phase 3 — Followup (followup_node, AFTER LLM stream)
  message_delta ×N  { messageId: D, sequenceNumber: 3, chunkIndex: 0..N-1, content.text: chunk }
  chat_event     { messageId: D, seq: 3, type: "text",     sourceMessageState: "COMPLETED" }
```

**Text-only intents** (property_detail/about, price_trends, commute_time, FAQ, financial):
```
Phase 1 — skipped (no summary)
Phase 2 — skipped (no templates)
Phase 3 only:
  message_delta ×N  { messageId: A, sequenceNumber: 0, chunkIndex: 0..N-1, ... }
  chat_event     { messageId: A, seq: 0, type: "text/markdown", sourceMessageState: "COMPLETED" }
```

### F2. Node Responsibilities (updated)

| Node | Phase | Emits |
|---|---|---|
| `summary_node` | 1 | `message_delta` (1 chunk) + `chat_event` (text, seq 0) |
| `respond_node` | 2 | `chat_event` × N templates (all `IN_PROGRESS`) |
| `llm_node` | 3 | `message_delta` × N chunks (seq = 1 + template_count if summary, else template_count) |
| `followup_node` | 3 | `chat_event` (text/markdown, COMPLETED, same messageId as message_delta) |

```python
# summary_node — dispatches via SUMMARY_BUILDERS registry
builder = SUMMARY_BUILDERS.get((c['main_intent'], c['sub_intent']))
if builder:
    summary_text = builder(c, session, resolved)
    emit_sse('message_delta', { 'messageId': summary_msg_id, 'sequenceNumber': 0,
                                 'chunkIndex': 0, 'messageType': 'text',
                                 'content': {'text': summary_text} })
    emit_sse('chat_event', ChatEventToUser(sequence_number=0,
                                           source_message_state='IN_PROGRESS', ...).dict())

# respond_node — templates only; all IN_PROGRESS; followup_node closes with COMPLETED
seq_start = 1 if state.get('summary_emitted') else 0
for i, event in enumerate(template_events):
    event.source_message_state = 'IN_PROGRESS'
    event.sequence_number = seq_start + i
    emit_sse('chat_event', event.dict())

# followup_node — final text; always COMPLETED; seq = summary + templates
seq = (1 if state.get('summary_emitted') else 0) + (state.get('template_count') or 0)
emit_sse('chat_event', ChatEventToUser(message_id=text_message_id, sequence_number=seq,
                                        source_message_state='COMPLETED', ...).dict())
```

### F3. build_template_events: Intent → Template Mapping

`build_template_events` is called inside `respond_node`. It dispatches on `(main_intent, sub_intent)` to produce zero or more `chat_event` payloads containing structured template data.

Template intents and their output `templateId` values:

| Intent | templateId |
|---|---|
| `property_search/*`, `property_detail/similar_properties`, `portfolio/*` | `property_carousel` |
| `locality_research/trending_localities`, `comparison/compare_localities`, `locality_research/locality_comparison` | `locality_carousel` |
| `property_detail/brochure` | `download_brochure` |

Each builder receives the **full** (non-truncated) `pre_fetched_data` for that intent and returns a `templateId + data` dict, or `None` if the fetch came back empty (in which case `respond_node` produces no template events and falls through to the LLM path only).

Builder implementations live in `solid-architecture.md` Part 5 (Middleware Pipeline → Helper Function Contracts) alongside `SUMMARY_BUILDERS` and `FOLLOWUP_PROMPT_BLOCKS`.

---

## Part G — Short-Circuit Event Assembly

When a graph node short-circuits (sets `bot_response` directly), the runner must still emit a
proper `ChatEventToUser` envelope over SSE. The runner wraps any plain string or canned response:

```python
# After graph exits, in the FastAPI handler:

async def emit_final_state(state: BotState, emit_sse: Callable):
    bot_response = state.get('bot_response')
    if bot_response is None:
        return

    # If respond_node ran, it already emitted chat_event(s) directly.
    # If a short-circuit node set bot_response, emit it here.
    if isinstance(bot_response, str):
        # Canned text from safety_node, normalize_node, validate_slm_node, route_node
        event = ChatEventToUser(
            conversation_id      = state['session']['session_id'],
            message_id           = str(uuid.uuid4()),
            source_message_id    = state['request_id'],
            message_type         = 'text',
            message_state        = 'COMPLETED',
            source_message_state = 'COMPLETED',
            created_at           = datetime.utcnow().isoformat() + 'Z',
            sequence_number      = 0,
            sender               = {'type': 'bot'},
            content              = MessageContent(text=bot_response),
        )
        emit_sse('chat_event', event.model_dump(by_alias=True))

    elif isinstance(bot_response, dict):
        if bot_response.get('template_id') == 'nested_qna':
            # clarify_node short-circuit
            event = build_template_event(
                conversation_id = state['session']['session_id'],
                source_msg_id   = state['request_id'],
                template_id     = 'nested_qna',
                data            = bot_response['data'],
                sequence_number = 0,
                is_completed    = True,
            )
            emit_sse('chat_event', event.model_dump(by_alias=True))

        elif bot_response.get('source_message_state') == 'COMPLETED':
            # followup_node already emitted the final chat_event — no-op
            pass

        # Other structured short-circuits (auth_required, fetch_error) → emit as text
        elif bot_response.get('text'):
            event = ChatEventToUser(...)
            emit_sse('chat_event', event.model_dump(by_alias=True))
```

---

## Part H — Graph Node Invariant Update

**Current invariant (3-phase model):**

Three graph nodes emit SSE directly: `summary_node`, `respond_node`, and `followup_node`.
`llm_node` emits `message_delta` chunks. All short-circuit nodes only set `bot_response`.

```
connection_ack         ← HTTP handler (before graph)
  [summary_node]       ← message_delta + chat_event (text, seq 0)   — BEFORE fetch
  [respond_node]       ← chat_event × N templates                   — AFTER fetch
  [llm_node]           ← message_delta × chunks                     — AFTER templates
  [followup_node]      ← chat_event (text, COMPLETED)               — AFTER LLM stream
  OR
  [emit_final_state]   ← chat_event (short-circuit paths only)
connection_close       ← HTTP handler (after graph)
```

**Invariant: the FE receives events in strict causal order** because the graph is a linear chain —
each node runs to completion before the next starts. Summary always precedes templates; templates
always precede LLM streaming; the COMPLETED marker always arrives last.

**`emit_final_state` fires when:** `bot_response` is set AND `validated_text is None`.
`validated_text` is set by `validate_output_node` (which runs after `llm_node`). When it is `None`,
the pipeline short-circuited before reaching the LLM — `followup_node` never ran and the short-circuit
node set `bot_response` directly. `emit_final_state` is called at the HTTP handler level after graph
exit; it does NOT fire for full-pipeline turns because `validated_text` will be non-None on those paths.

**Sequence number assignment:**
- `summary_node` → seq 0 (always, when emitted)
- `respond_node` → seq_start = 1 if `summary_emitted` else 0; increments per template
- `llm_node` message_delta → sequenceNumber = (1 if summary_emitted else 0) + template_count
- `followup_node` → same seq as message_delta (same messageId too, so FE assembles correctly)
- `emit_final_state` → seq 0 always (short-circuit paths that reach `emit_final_state` fired before `summary_node` could emit)

---

## Conflicts and Design Decisions

### 1. `bot_tool_event` — Dropped

Our `llm_node` currently emits `{'type': 'bot_tool_event', 'message': msg}` when the LLM calls
a residual tool. **The frontend has no handler for this event type.** It must be dropped entirely.
Residual tool calls (e.g., `getNearbyLandmarks`) are silent — the LLM receives the result and
incorporates it into the text response without a user-visible "calling tool..." indicator.

### 2. `get_location` SSE event — Replaced

The `user_location_needed` filter currently triggers a bespoke `get_location` SSE event not in
the frontend contract. **Replaced with `share_location` template** (see Part D4). The derive_node
must short-circuit on `user_location_needed = true` and set `bot_response` with the template.

### 3. respond_node emits directly — Architecture change

The old design had respond_node set `bot_response` which the graph runner emitted once.
**Updated:** respond_node now calls `emit_sse` directly for each event row in a multi-template
turn. The `emit_sse` callable is injected via `functools.partial` at graph construction time.

### 4. nested_qna requires SLM schema change

The SLM output schema must add `clarification_data` (structured options). This is a **minor
breaking change** to the SLM prompt: `05-output-schema.md` must be updated with the new field.
The `validate_slm_node` handles backward compatibility (no `clarification_data` → free-text).

### 5. Property card truncation vs. template data

`response_truncation` in TOOL_REGISTRY (`drop_fields: ['image_urls', ...]`) applies only to the
LLM context (what `build_prompt_node` injects into the system prompt). Template data in
`build_template_events` always uses the **full pre_fetched_data** — no truncation for the FE.
This is by design: the LLM saves tokens by not seeing image URLs; the FE needs them for rendering.

### 6. Locality card `image`, `city_uuid`, `seo_url`

The FE's `locality_carousel` needs `image`, `cityUuid`, and `url`. These must come from Odin.
The `return_schema_summary` for `getLocalityDetail` and `getTrendingLocalities` must include:
`image_url`, `city_uuid`, `seo_url`. If Odin doesn't provide `seo_url`, derive as `/locality/<id>`.

### 7. `conversationId` = `session_id`

The frontend uses `conversationId` everywhere. Our internal variable is `session_id`.
These are the same concept. FastAPI handlers use `conversationId` in all request/response bodies;
internally the session store uses `session_id`. No conceptual conflict — pure naming convention.

### 8. Floor plan — no template

`property_detail/floor_plan` has no dedicated template in the FE. The bot renders a markdown
response with clickable image links (floor plan URLs from `getFloorPlans`). The FE renders
markdown links. No template needed. Document this intent as text-only.

### 9. `token_id` / anonymous identity

The frontend passes `token_id` for anonymous users (stored in cookie `houzy_token`). This maps
to our anonymous session token. The session store uses this as the key for unauthenticated
sessions. On login, the session is migrated (existing `conversationId` stays, `auth_token` is
added to session state).

---

## Summary: Complete SSE Event Inventory

| SSE event | Emitted by | Shape |
|---|---|---|
| `connection_ack` | FastAPI handler (before graph) | `ConnectionAck` (see C2) |
| `message_delta` | `summary_node` (1 chunk, seq 0) + `llm_node` (N chunks) | `MessageDeltaEventToUser` |
| `chat_event` (text) | `summary_node`, `respond_node`, or `emit_final_state` | `ChatEventToUser` (messageType: text/markdown) |
| `chat_event` (template) | `respond_node` | `ChatEventToUser` (messageType: template + templateId) |
| `error` | FastAPI handler or graph node on unrecoverable failure | `ErrorEvent` (see below) |

```typescript
interface ErrorEvent {
  code:        ErrorCode;
  message:     string;       // human-readable; suitable for display
  recoverable: boolean;      // true = user can retry; false = session must restart
}

type ErrorCode =
  | 'llm_stream_error'        // LLM API failure mid-stream
  | 'all_fetches_failed'      // every pre-fetch returned an error
  | 'llm_timeout'             // LLM did not respond within timeout_ms
  | 'slm_unavailable'         // SLM classifier timed out after retries
  | 'auth_expired'            // session_token expired mid-session
  | 'rate_limited'            // client sending too fast
  | 'internal_error';         // unexpected server error
```

## Summary: Complete Template Inventory

| templateId | Triggers from | Transient? | Notes |
|---|---|---|---|
| `property_carousel` | property_search, similar_properties, portfolio | No | Full card data from Khoj |
| `locality_carousel` | trending_localities, comparison | No | Mapped from Odin schema |
| `download_brochure` | property_detail/brochure | No | property card + brochure_images |
| `share_location` | user_location_needed filter = true | Yes (last-only) | derive_node short-circuit |
| `nested_qna` | clarification_needed | Yes (last-only) | structured SLM clarification_data |
| `shortlist_property` | Tier 1 save_property | Yes (auto-execute) | FE template handles own login |
| `contact_seller` | Tier 1 contact_seller | Yes (auto-execute) | FE template handles own login |
| `login` | requires_auth=True intent + no auth_token | Yes (last-only) | Preceded by text message. FE renders login CTA. Portfolio and save_alert flows only. |
