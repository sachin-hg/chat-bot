# FE / Full Stack Backlog — @dev

**Canonical docs:**
- `docs/api/endpoints.md` — API contracts
- `docs/api/sse-contract.md` — SSE event shapes + 3-phase lifecycle
- `docs/api/templates.md` — All templateId definitions
- `~/housing.brahmand/` — GraphQL schema for when tool contracts don't match

**Note:** ~/chat-demo is already fully built (handles SSE, renders templates). This backlog is wiring, validation, and bridging — not building from scratch.

---

## CHAT-D-001: Wire chat-demo → POST /api/v1/chat/send-message-streamed
**Sprint:** 3 | **SP:** 3 | **Status:** ⬜

**Description:**  
Update the API base URL in chat-demo from its current endpoint to the new FastAPI server. Verify the SSE stream is consumed correctly.

**Checklist:**
- [ ] Set `REACT_APP_BOT_API_URL=http://localhost:8000` (or equivalent env var in chat-demo)
- [ ] Verify `connection_ack` event is handled (triggers loading state in FE)
- [ ] Verify `message_delta` events append text to the streaming bubble
- [ ] Verify `chat_event { sourceMessageState: "COMPLETED" }` stops streaming and locks the bubble
- [ ] Verify `error` event renders error message and re-enables input
- [ ] Verify `streamingEnabled=true` query param is sent

**Technical Notes:**  
The SSE stream uses `event: message_delta\ndata: {...}\n\n` format. Ensure `EventSource` or `fetch` with `ReadableStream` correctly parses named events. See `docs/api/sse-contract.md`.

---

## CHAT-D-002: Wire GET /api/v1/chat/get-conversation-id
**Sprint:** 3 | **SP:** 1 | **Status:** ⬜

**Description:**  
On app load, call `GET /api/v1/chat/get-conversation-id` to get or create a `conversationId`. Store in state/localStorage for the session.

**Acceptance Criteria:**
- [ ] `conversationId` returned on first load
- [ ] Same `conversationId` returned on refresh (via `tokenId` cookie)
- [ ] `login-auth-token` header sent when user is logged in
- [ ] On first GET /get-conversation-id response: read tokenId from response body, store in houzy_token cookie (HttpOnly, SameSite=Lax, 1-year expiry)
- [ ] houzy_token sent as X-Token-ID header on ALL subsequent requests (A2, A3, A4, A5)
- [ ] Return visit: houzy_token cookie present → same conversationId returned (isNew: false)
- [ ] Logout: delete both houzy_token and login-auth-token cookies → next request creates fresh session

---

## CHAT-D-003: Wire GET /api/v1/chat/get-conversation-details (history load)
**Sprint:** 3 | **SP:** 2 | **Status:** ⬜

**Description:**  
Load paginated message history when user opens a conversation. See `docs/api/endpoints.md` Part A2.

**Acceptance Criteria:**
- [ ] `messagesAfter` cursor works for infinite scroll (load older messages)
- [ ] Template messages render from stored `content.data` (not re-fetching from API)
- [ ] Text messages render correctly
- [ ] Empty state handled (no conversations yet)

---

## CHAT-D-004: Validate property_carousel template render end-to-end
**Sprint:** 3 | **SP:** 3 | **Status:** ⬜

**Description:**  
Full round-trip: user types "show me 2bhk in bandra" → Phase 1 summary renders → Phase 2 property_carousel appears → Phase 3 LLM text commentary appears.

**Validation checklist:**
- [ ] Phase 1: text bubble "I see you're looking for 2BHK properties..." appears before carousel
- [ ] Phase 2: `property_carousel` with correct `sequenceNumber: 1` renders property cards
- [ ] Each card has: title, price_display, area, highlights, thumbnail, quick_actions (Details, Similar, Contact Seller)
- [ ] Phase 3: LLM commentary text appears after carousel with correct `sequenceNumber: 2`
- [ ] FE doesn't hang if Phase 1 is absent (text-only intents have no Phase 1)

**Sequence number contract (from `docs/api/sse-contract.md`):**
```
summary (seq 0) → template carousel (seq 1) → followup text (seq 2, COMPLETED)
```

---

## CHAT-D-005: Validate locality_carousel, floor_plan_carousel, nested_qna
**Sprint:** 3 | **SP:** 3 | **Status:** ⬜

**Description:**  
Validate all non-property templates render correctly.

**Templates to validate:**
- `locality_carousel` — locality cards with rating, price trend, quick actions
- floor_plan intent → renders as markdown text with image links (NO template event emitted — it is text-only). Validate that `property_detail/floor_plan` produces a text chat_event with markdown content, NOT a template event.
- `nested_qna` — question chips (e.g. "Rent or Buy?") render and submitting a selection works
- `share_location` — location permission button renders; user granting location triggers next turn
- `login` — login CTA renders for auth-gated portfolio intents (anonymous user)
- `download_brochure` — brochure download card

**For each template:**
- [ ] `data` shape matches `docs/api/templates.md` schema
- [ ] Quick action taps send correct `user_action` in `ChatEventFromUser`

---

## CHAT-D-006: Validate login template (auth-gated portfolio)
**Sprint:** 3 | **SP:** 2 | **Status:** ⬜

**Description:**  
When anonymous user asks "show my saved properties", the BE responds with `templateId: "login"` + text message. Validate this renders as a login CTA.

**Acceptance Criteria:**
- [ ] Login CTA renders with text from the preceding `chat_event { messageType: "text" }`
- [ ] Tapping login doesn't crash; connects to existing auth flow in chat-demo
- [ ] After login, user can retry the same intent without refreshing

---

## CHAT-D-007: Validate user_action submissions
**Sprint:** 3 | **SP:** 3 | **Status:** ⬜

**Description:**  
User actions submitted via `POST /api/v1/chat/send-message` with `responseRequired: false` (or `true` for some).

**Actions to validate:**
- `contact_seller_confirmed` — user taps Confirm on the contact_seller template → **two things happen in parallel**: (1) FE calls its own vendor APIs to initiate contact (phone/WhatsApp/lead form — no CRM call from BE), and (2) FE sends `contact_seller_confirmed` user_action to BE with `responseRequired: true` so BE can generate a follow-up suggestion ("want to see similar properties / locality reviews?").
- `location_shared` — user grants location → sends coordinates → next turn uses location for explore_nearby
- `nested_qna_selection` — user taps a chip → correct `filter_delta` applied in next turn
- Quick filter chip tap → sends `nested_qna_selection` user_action with the filter value (e.g. furnishing: 'furnished') — NOT a separate applyFilter action. Validate this sends the correct action type.
- `shortlist_property` (save property) — tapping Save on a property card → fires A4 non-streaming endpoint with responseRequired: false → no SSE response expected → property appears in saved list on next portfolio load

**For each:**
- [ ] Correct `ChatEventFromUser` shape sent
- [ ] BE responds appropriately (SSE stream or 200 for non-streaming)
- [ ] **A4 non-streaming error handling:** if A4 (`POST /chat/send-message` with `responseRequired: false`) returns 4xx or 5xx, show a toast ("Action failed — try again") and do NOT trigger an SSE read. Silent failure is not acceptable.
- [ ] **A4 idempotency:** tapping the same quick-action button twice in < 500ms sends only one request (debounce on the FE side)

---

## CHAT-D-008: GraphQL bridge check — validate tool API response shapes
**Sprint:** 3 | **SP:** 5 | **Status:** ⬜ — HIGHEST RISK TICKET

**Description:**  
This is the riskiest integration point. The BE tool executors (CHAT-P-018 through CHAT-P-026) translate internal params to the API wire format and map responses to the TOOL_REGISTRY schema. In practice, the actual API responses from Khoj/Odin/Casa might differ from what's documented.

**Process:**
1. For each tool executor in CHAT-P-017 through CHAT-P-026: run a real API call
2. Compare actual response with `ToolRecord.return_schema_summary` in `docs/registries/tool-registry.md`
3. If mismatch: check `~/housing.brahmand/graphql/` for the canonical GraphQL schema
4. If still unclear: raise with PM immediately (do not guess or work around silently)

**Tools to validate:**
- [ ] `searchProperties` — Khoj search API response shape
- [ ] `getPropertyDetail` — Casa property detail
- [ ] `resolveEntity` — autosuggest response, candidate confidence scores
- [ ] `getTrendingLocalities` / `getLocalityDetail` — Odin response shapes
- [ ] `getProjectDetail` / `getFloorPlans` / `getBrochure` — Venus project data response shapes
- [ ] `getPropertyDetail` for Casa listings that include `region_entity` — verify the field is present and is the Venus project_id
- [ ] `getSavedProperties` / `getRecommendations` — Khoj user APIs

**Output:** A `docs/api-mismatches.md` file listing any discovered discrepancies and the resolution (doc updated or code adapted).

---

## CHAT-D-009: Error state handling
**Sprint:** 3 | **SP:** 2 | **Status:** ⬜

**Description:**  
Validate that error states render correctly in chat-demo.

**Error codes to test:**
- `llm_stream_error` — partial bubble appears then error → should clear bubble, show error message
- `rate_limited` — user sending too fast → show "High demand, try again" with auto-retry UI
- `llm_timeout` — after 8s wait → show recoverable error
- `auth_expired` — session token expires mid-session → show re-auth prompt

---

## CHAT-D-010: Post-login migrate-chat flow
**Sprint:** 3 | **SP:** 2 | **Status:** ⬜

When user logs in mid-conversation, FE must call migrate-chat to claim the anonymous session.

Flow:
1. User logs in → login service returns login-auth-token
2. FE calls POST /api/v1/chat/migrate-chat?currentConversationId={current}
3. Response: { "data": { "new_conversation_id": "uuid" } }
4. FE updates active conversationId in state
5. FE reloads conversation history from new conversationId
6. Prior filters, city, transaction_type preserved in session

Acceptance Criteria:
- [ ] migrate-chat called immediately after successful login
- [ ] conversationId in state updated to new_conversation_id
- [ ] History reloaded from new ID
- [ ] Previous session context (city, filters visible in UI) preserved
- [ ] If migrate-chat fails (network error) → keep anonymous session, log warning

---

## FE Notes: Things that might NOT work out of the box

1. **SSE named events**: chat-demo likely uses `EventSource`. The BE uses named events (`event: message_delta`). Vanilla `EventSource.onmessage` only catches unnamed events. The FE should use `addEventListener("message_delta", ...)`. Verify this is already handled.

2. **Sequence numbers**: The FE must use `sequenceNumber` to order events correctly, especially if Phase 2 template arrives before Phase 3 followup. Don't assume arrival order = correct order.

3. **Phase 1 absent for text-only intents**: The FE should not expect a Phase 1 `message_delta` before every response. For `property_about`, `commute_time`, etc., the first event is Phase 3 directly (`sequenceNumber: 0`).

4. **Bidirectional SSE limitation**: Since we use one SSE per turn (not persistent), the FE must open a new `GET /chat/stream` for each message. This might differ from WebSocket-based designs.
