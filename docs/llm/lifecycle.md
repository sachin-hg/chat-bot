# LLM Request Lifecycle

Full request lifecycle pseudocode, streaming timeline, error handling table, LLM retry policy, and token budget.

---

## Bot Orchestrator: Request Lifecycle

```
1. Receive user_message frame from WS layer
      │
2. Load session state from Redis
   (state, active_filters, viewed_properties, srset_id)
      │
3. Load conversation turns from Redis (last 10; Haiku calls: 3 turns only)
      │
4. [TIER 0] Pre-SLM parsing + safety check
   a. Regex safety filter (injection, hard out-of-domain) → short-circuit if blocked
   b. Orchestrator parsing — runs BEFORE SLM, injects normalised values:
      - BHK extraction: "2BHK" → bhk:[2]
      - Price normalisation: "30K" → 30000, "1.5Cr" → 15000000
      - Per-sqft detection: "30K/sqft" → price_per_sqft:30000 flag
      - Unit detection: "bigha" / "guntha" → convert_unit candidate flag
      These normalised values are injected into the SLM prompt so it never
      has to do number parsing — it only classifies intent and extracts semantics.
      │
5. [SLM] Intent classification (Claude Haiku — current; Gemini Flash is benchmark candidate)
   Input: user message + normalised values + last 3 turns + previous intent
          + compact active_filters (for ADD/REPLACE semantics)
   Output: { main_intent, sub_intent, entities_mentioned, filter_delta,
             multi_intent, pivot, clarification_needed }
      │
5a. Apply filter_delta to session state
    session.active_filters = applyDelta(session.active_filters, filter_delta)
      │
5b. If classification.pivot == True:
    sanitize_filters_on_pivot(classification, session)
    — city-change clears localities, service-change applies price sanity,
      locality_research → property_search carries researched locality forward
      │
5c. If filter_delta.price_per_sqft is set:
    result = convert_price_per_sqft_to_absolute(
      price_per_sqft, price_sqft_bound, session)
    Apply result to session.active_filters; flag price_derived_from_sqft: True
      │
5d. If filter_delta.search_anchor is set:
    anchor = await resolve_landmark_anchor(search_anchor, session)
    # {lat, lng, label}
    Inject into session.search_anchor_coordinates for Khoj lat/long/radius search
      │
5e. If classification.clarification_needed is not null:
    Emit nested_qna SSE chat_event (templateId: "nested_qna") → stop here
    (no entity resolution, no LLM call, no tool execution for this turn)
      │
6. Entity pre-resolution (orchestrator, sync, ~50ms)
   For each name in entities_mentioned NOT already in session state:
     a. Call autosuggest with name + entity_type hint + session.service
     b. Single high-confidence match → inject active_project_id / active_locality_id
        / active_city_uuid into session for this turn
     c. Multiple matches → set clarification_needed.type = "disambiguation"
        → emit nested_qna, stop (same as step 5e)
   Effect: "show me brochure for DLF Privana" → project_id already in session
   when LLM is called; LLM doesn't need a resolveEntity round-trip.
      │
7. Tier routing + auth check
   getIntentRecord(main_intent, sub_intent) → tier, model, requires_auth
   If requires_auth and no auth_token → set bot_response to login template response; emit_final_state sends text + templateId:"login"
      │
   [Tier 1 — direct action, no LLM]
   Execute action (shortlistProperty, contactSeller, etc.) directly
   Set bot_response → short-circuits graph; emit_final_state sends chat_event
      │
   [Tier 2 — orchestrator computes, no LLM]
   Execute computation (calculateEMI, calculateAffordability, convertUnit)
   Set bot_response with result → short-circuits graph; emit_final_state sends chat_event
      │
8. [Tier 3] DataFetchMiddleware — pre-fetch all required data
   getDataFetchPlan(main_intent, sub_intent) → DataRequirement[]
   Groups by parallel_group; executes groups in order:
     - Same parallel_group → asyncio.gather (parallel)
     - Different groups → sequential (dependency order)
   Results stored in ctx.pre_fetched_data keyed by tool name
   Pre-fetch runs before SSE stream opens — no "fetching" SSE event is emitted to the client
   (~150ms for comparison intents with 6 parallel fetches)
      │
9. [Tier 3] Build system prompt (sections 1–4)
   build_session_state_block(intent, session) → intent-specific state injection
   pre_fetched_data injected inline into section 3 context block
   context_turns = CONTEXT_TURNS[model]  (haiku: 3, sonnet: 10)
      │
10. If turns > 10 and no summary: trigger async summarization job
    (non-blocking; use existing turns for this request)
      │
11. Call Claude API (streaming)
    tool_definitions = buildToolDefinitionsBlock(getResidualTools(main_intent, sub_intent))
    — for 31/32 intents this is [] (LLM has no tools, one job: NLG)
    — for property_about: [getNearbyLandmarks]
      │
    Stream tokens → buffer 3–5 tokens → emit message_delta SSE event
      │
    On tool_use block (only possible for getNearbyLandmarks):
    a. validate_residual_tool_call(tool, params) — return error if invalid
    b. Execute tool (check cache → call API if miss → cache result)
    c. Orchestrator injects location from session (LLM only supplied category/radius)
    d. Inject tool_result into LLM continuation
    e. Resume streaming (progress is visible to the user via the ongoing message_delta stream)
      │
12. On stop_reason: "end_turn":
    a. validate_bot_output(text) — strip URLs, phone numbers, markdown tables
    b. Assemble response — cards built from ctx.pre_fetched_data
       (+ residual tool_results if getNearbyLandmarks was called)
    c. Emit chat_event SSE event with sourceMessageState: "COMPLETED"
    d. Persist full message to Kafka → PostgreSQL
    e. Update Redis turn list (LPUSH + LTRIM 0 19, keeping last 10)
    f. Update session state (new srset_id, viewed properties, etc.)
```

### Streaming Timeline (Pre-fetch Model)

The SSE contract uses three event types from the server: `connection_ack` (stream open),
`message_delta` (streaming text chunks), `chat_event` (structured events including completion),
and `error`. DataFetchMiddleware runs silently before the SSE stream opens — there is no
"fetching" SSE event; pre-fetch completes before the first `message_delta` is emitted.

```
Property search / filter_search turn (template intent — full 3-phase sequence):
  connection_ack

  # Phase 1 — summary_node (fires BEFORE data fetch)
  message_delta  { messageId: "A", sequenceNumber: 0, chunkIndex: 0, content.text: "I see you're looking for 2BHK rentals in Andheri..." }
  chat_event     { messageId: "A", sequenceNumber: 0, messageType: "text", sourceMessageState: "IN_PROGRESS" }

  # Phase 2 — respond_node (fires AFTER data fetch)
  chat_event     { messageId: "B", sequenceNumber: 1, messageType: "template", templateId: "property_carousel",
                   sourceMessageState: "IN_PROGRESS", data: { properties: [...], property_count: 47 } }

  # Phase 3 — followup_node (fires AFTER LLM)
  message_delta  { messageId: "C", sequenceNumber: 2, chunkIndex: 0, content.text: "Here are some great options in Andheri West..." }
  message_delta  { messageId: "C", sequenceNumber: 2, chunkIndex: 1, content.text: " The first one is close to the metro..." }
  chat_event     { messageId: "C", sequenceNumber: 2, messageType: "text", sourceMessageState: "COMPLETED" }
  # HTTP response closes — FE detects COMPLETED on the chat_event above and re-enables input


Comparison turn (6 parallel pre-fetches, Sonnet):
  connection_ack
  # DataFetchMiddleware ran 6 parallel fetches silently before SSE opened (~150ms)
  message_delta  { sequenceNumber: 0, chunkIndex: 0, content.text: "Comparing Bandra and Andheri West..." }
  message_delta  { sequenceNumber: 0, chunkIndex: 1, content.text: " Here's how they compare..." }
  chat_event     { sequenceNumber: 0, sourceMessageState: "COMPLETED", messageType: "text" }
  # (HTTP response closes naturally after COMPLETED)


property_about + nearby (only case with residual tool — getNearbyLandmarks):
  connection_ack
  # Phase 3 — LLM streams response (Haiku, property_about is text-only so no Phase 1 or 2)
  message_delta  { sequenceNumber: 0, chunkIndex: 0, content.text: "Silver Heights is a..." }
  message_delta  { sequenceNumber: 0, chunkIndex: 1, content.text: " premium 42-floor..." }
  # LLM calls getNearbyLandmarks mid-stream (residual tool)
  message_delta  { sequenceNumber: 0, chunkIndex: N, content.text: " Looking up what's nearby..." }
  # Tool result injected back to LLM context; streaming resumes
  message_delta  { sequenceNumber: 0, chunkIndex: N+1, content.text: " Within 1km: Phoenix Mall..." }
  chat_event     { sequenceNumber: 0, sourceMessageState: "COMPLETED", messageType: "text" }
  # (HTTP response closes naturally after COMPLETED)
```

The client renders `message_delta` events as streaming text and replaces the accumulated text
with the final assembled response on `chat_event` with `sourceMessageState: "COMPLETED"`.

**LLM stream failure mid-response:**
```
  connection_ack
  message_delta  { sequenceNumber: 0, chunkIndex: 0, content.text: "Found 47 properties..." }
  error          { code: "llm_stream_error", recoverable: true,
                   message: "Something went wrong. Please try again." }
```
The `error` event tells the client to clear the partial bubble and render the error message.
Without this event, a partial stream leaves the UI stuck in a loading state.

**SSE event type summary:**

| Event | When |
|---|---|
| `connection_ack` | SSE stream opened; pre-fetch has already completed silently |
| `message_delta` | Streaming LLM text chunk (includes progress text during residual tool calls) |
| `chat_event` | Structured signal; `sourceMessageState: "COMPLETED"` marks end of turn's LLM output |
| `error` | Unrecoverable error (LLM failure, all pre-fetches failed) |
| `chat_event { templateId: "login" }` | Auth-gated BE-data intent (portfolio, save_alert) with no auth_token; FE-side templates (shortlist, contact_seller) handle their own login |

---

## Error Handling

Full retry policy and timeout budgets are specified in `solid-architecture.md` Part 8.
This table covers the LLM-layer behaviours that follow from those failures.

| Error | Detection | LLM-layer behaviour |
|---|---|---|
| Pre-fetch timeout | `withTimeout` rejects after `TOOL_DEFAULT_TIMEOUTS[tool]` | Tool recorded in `ctx.fetch_errors`; LLM receives `{ error: "timeout" }` stub and acknowledges partial data |
| Pre-fetch 5xx (after 1 retry) | `CachedExecutorPort` exhausts retries | Same as timeout — `fetch_errors` stub |
| ALL pre-fetches fail | `DataFetchMiddleware` detects `allFailed` | Short-circuits; emits `error` SSE event; no LLM call |
| Pre-fetch 404 (property/entity gone) | Backend returns 404 | `{ error: "not_found" }` stub injected; LLM: *"That property may no longer be listed."* |
| Pre-fetch 429 (rate limit) | Backend returns 429 | Use cached result if available; otherwise `fetch_errors` stub; alert if >5% of requests |
| Circuit breaker OPEN | `CircuitOpenError` from executor | Treated as fetch error — same `fetch_errors` path |
| LLM API error (TTFT timeout or 5xx) | `withTimeout(5000)` or HTTP error | 1 retry after 300ms; on second failure emit `error` SSE event with recoverable message |
| LLM calls undefined tool | Tool name not in `tool_definitions` | Return `{ error: "tool_not_found" }` and log; should not happen — residual tools list is registry-derived |
| LLM stream fails mid-response | Stream terminates before `end_turn` | Emit `error` SSE event to clear partial bubble; log with session_id for replay |
| Context window exceeded | Claude returns `context_length_exceeded` | Drop oldest turns (keep last 3) and retry once; if still exceeds, summarise and retry |
| SLM classifier failure | SLM timeout or 5xx after 1 retry | Route to `out_of_scope`; canned response; log `classifier_unavailable` metric |

### LLM Retry Policy

| Dimension | Value |
|---|---|
| **Retryable errors** | 503, 529 (overloaded), timeout |
| **Non-retryable errors** | 400 (invalid request), 401 (auth), 422 (validation error), `context_length_exceeded` |
| **Max retries** | 1 |
| **Backoff** | 300ms fixed |
| **On final failure** | Emit `error` SSE event with `{ recoverable: true, message: "I'm having trouble right now. Please try again." }` |
| **`context_length_exceeded` handling** | Drop oldest turns (not the compressed summary) until the prompt fits within the context window, then retry once |

---

## Token Budget

Budgets vary significantly by tier and intent class. Use these as planning numbers, not
hard limits. The comparison tier (Sonnet + 6 pre-fetched results) is the heaviest path.

```
                              Tier 3a / Haiku    Tier 3b / Sonnet (comparison)
─────────────────────────────────────────────────────────────────────────────
System prompt (cached §1):       ~1,200 tokens         ~1,200 tokens
Session state injection:            ~130                   ~200
Tool definitions (§2, cached):       ~50 ([] for most)     ~50
Conversation history:               ~450 (3 turns)       ~1,500 (10 turns)
Compressed history summary:         ~400 (if applicable)   ~400
Pre-fetched data (inline):
  Tier 3a — 1 tool result:          ~150                    —
  Tier 3b — 6 tool results:           —                  ~1,200  (6 × ~200 truncated)
fetch_errors stubs (if any):          ~30 (per error)       ~30
─────────────────────────────────────────────────────────────────────────────
Typical total input:            ~2,400–2,800 tokens    ~4,600–5,000 tokens

Output:
Bot response text:                ~100–200 tokens        ~300–600 tokens
Residual tool call (JSON):         ~100 (if any)           —
─────────────────────────────────────────────────────────────────────────────
Typical total output:             ~200–400 tokens        ~400–700 tokens
```

**Key observations:**
- Tier 3a Haiku is ~2,500 tokens input — well below the old 4,500–7,000 estimate, because
  tool definitions (previously ~1,500–3,000 tokens) are now `[]` for most intents.
- Tier 3b Sonnet comparison is heavier (~5,000) but 6 parallel pre-fetches replace 6 sequential
  tool-call round trips — total latency is lower even though the prompt is larger.
- `fetch_errors` stubs add ~30 tokens per failed pre-fetch; negligible.
- The LLM context is smaller than in designs where the LLM receives raw API responses. Tier A
  results (property search, property detail, etc.) become `pre_fetched_data` — `respond_node`
  builds template cards from them and sends them directly to the FE. The LLM only sees a compact
  summary (e.g. "Found 47 properties in Bandra. Sample: ..."), not the full property JSON. This
  accounts for the ~95% tool result token reduction shown in the pre-fetched data rows above.

With prompt caching on §1 and §2, effective cache savings per request: ~1,250 tokens
(Haiku) to ~1,250 tokens (Sonnet). Cache read tokens cost 10% of full input tokens.

### LLM Call Logging Contract

Every LLM call emits a structured log entry with the following shape:

```json
{
  "event":                    "llm_call",
  "request_id":               "string",
  "session_id":               "string",
  "model":                    "string",
  "input_tokens":             "integer",
  "output_tokens":            "integer",
  "cache_read_input_tokens":  "integer",
  "latency_ms":               "integer",
  "stop_reason":              "end_turn | tool_use | max_tokens",
  "tool_calls":               "[{ tool_name, latency_ms, cache_hit }]",
  "validation_violations":    "[string]",
  "experiment_id":            "string | null",
  "experiment_variant":       "string | null"
}
```

**Output validation metric:** `output_validation_violation_rate` — counter per `violation_key`
(e.g. `url_in_text`, `phone_number_in_text`). Alert if `url_in_text` or `phone_number_in_text`
exceeds 0.1% of turns.
