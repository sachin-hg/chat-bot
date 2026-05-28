# API Contract — Search & Discovery Bot ↔ Frontend

This document is the source of truth for the transport layer between the Search & Discovery
backend and the Housing.com chat frontend (`chat-demo`). All API endpoints, SSE event shapes,
message envelopes, template IDs, and user action payloads are defined here.

The frontend contract is **fixed**. Backend must conform to it. Any deviation that cannot be
accommodated is called out explicitly in [Conflicts and Design Decisions](#conflicts-and-design-decisions).

---

## Conceptual Mapping (Backend ↔ Frontend)

| Backend concept | Frontend concept |
|---|---|
| `session_id` | `conversationId` |
| `request_id` (per turn UUID) | `sourceMessageId` on bot rows |
| Anonymous user token | `tokenId` (cookie `houzy_token`) |
| `auth_token` | `login-auth-token` header |
| `bot_response` (internal state) | One or more `chat_event` SSE messages |
| `validated_text` | `chat_event` with `messageType: "text"` or `"markdown"` |
| Cards/tool results | `chat_event` with `messageType: "template"` + `templateId` |
| `clarification_needed` | `chat_event` with `templateId: "nested_qna"` |
| `user_location_needed` filter | `chat_event` with `templateId: "share_location"` |
| LLM text stream chunk | `message_delta` SSE event |
| Turn start | `connection_ack` SSE event |
| Turn end | `connection_close` SSE event |

---

## Part A — API Endpoints

### A1. Get Conversation ID

```
GET /api/v1/chat/get-conversation-id
Headers: login-auth-token (optional), token_id (optional)
```

Response:
```json
{
  "statusCode": "2XX",
  "responseCode": "SUCCESS",
  "data": {
    "conversationId": "string",
    "isNew": true
  }
}
```

**Backend behavior:**
- If `login-auth-token` header is present → look up or create a conversation for that user.
- If anonymous (`token_id` cookie present) → return the existing conversation for that `tokenId`.
- If no tokens → create a new conversation, return `isNew: true`.
- `conversationId` = `session_id` in our session store.

---

### A2. Get Conversation Details (History)

```
GET /api/v1/chat/get-conversation-details
Headers: login-auth-token (optional), token_id
Query params:
  pageSize?:       number   (default 20)
  messagesAfter?:  string   (messageId cursor — mutually exclusive with messagesBefore)
  messagesBefore?: string   (messageId cursor)
```

Response:
```json
{
  "statusCode": "2XX",
  "responseCode": "SUCCESS",
  "data": {
    "conversationId": "string",
    "tokenId": "string",
    "messages": [ /* ChatEventToUser[] — see Part B */ ],
    "hasMore": true
  }
}
```

**Backend behavior:**
- Returns persisted `ChatEventToUser` rows from the conversation, sorted oldest-first within a page.
- `messagesAfter` and `messagesBefore` are exclusive cursors (not inclusive).
- `tokenId` in the response is the anonymous session token — frontend persists it in the `houzy_token` cookie.
- Messages include all types: `text`, `markdown`, `template`, `user_action`.

---

### A3. Send Message (Streaming — Primary Path)

```
POST /api/v1/chat/send-message-streamed?streamingEnabled=true
Headers:
  Content-Type: application/json
  Accept: text/event-stream
  login-auth-token (optional)
Query params:
  streamingEnabled: boolean  (enables v1.1 message_delta incremental chunks)
```

Request body: `ChatEventFromUser` (see Part B2)

Response: Server-Sent Events stream (see Part C)

**When to use:** Any user text message or visible user_action (responseRequired: true).

---

### A4. Send Message (Non-Streaming)

```
POST /api/v1/chat/send-message
Headers: Content-Type: application/json, login-auth-token (optional)
```

Request body: `ChatEventFromUser` with `responseRequired: false`

Response:
```json
{
  "statusCode": "2XX",
  "responseCode": "SUCCESS",
  "data": {
    "messageId": "string",
    "messageState": "COMPLETED"
  }
}
```

**When to use:** Silent user_action messages (shortlist, contact_seller intent signals) where
the frontend does not need an SSE stream back.

---

### A5. Cancel In-Flight Request

```
POST /api/v1/chat/cancel
Headers: Content-Type: application/json
Body: { "messageId": "string", "conversationId": "string" }
```

Response:
```json
{ "statusCode": "2XX", "responseCode": "SUCCESS", "data": { "ok": true } }
```

**Backend behavior:** Cancels the in-flight LLM stream for the given message. The graph sets
`messageState: CANCELLED_BY_USER` on the in-flight bot rows and emits `connection_close` with
`reason: "response_complete"` on the SSE stream.

---

### A6. Migrate Chat (Mode Switch)

```
POST /api/v1/chat/migrate-chat?currentConversationId=<conversationId>
```

Response:
```json
{ "data": { "new_conversation_id": "string" } }
```

**Backend behavior:** Creates a new conversation, carries over the current session context
(city, transaction_type, active_filters). Used when the unified routing gateway redirects
the user from another service to the Search & Discovery bot.

---

## Part B — Message Envelopes

### B1. ChatEventToUser (Backend → Frontend)

Every SSE `chat_event` and every row in conversation history uses this envelope.

```typescript
interface ChatEventToUser {
  conversationId:   string;
  messageId:        string;              // unique ID for this specific row
  sourceMessageId?: string;             // the user message that triggered this bot turn
  messageType:      "text" | "markdown" | "template" | "user_action" | "context" | "analytics";
  messageState:     "PENDING" | "COMPLETED" | "IN_PROGRESS" | "ERRORED_AT_ML" | "TIMED_OUT_BY_BE" | "CANCELLED_BY_USER";
  sourceMessageState?: "IN_PROGRESS" | "COMPLETED" | "ERRORED_AT_ML";  // bot rows only
  createdAt:        string;             // ISO 8601
  sequenceNumber?:  number;             // mandatory for bot messages; 0-based, per turn
  responseRequired?: boolean;           // user/system messages only
  isVisible?:       boolean;            // mandatory for user_action with visible content
  sender:           { type: "user" | "bot" | "system"; };
  content: {
    text?:         string;
    templateId?:   string;             // set when messageType = "template"
    data?:         Record<string, unknown>;
    derivedLabel?: string;             // user-visible label for user_action rows
  };
}
```

**Python equivalent (Pydantic):**
```python
from pydantic import BaseModel
from typing import Literal, Optional, Any
from datetime import datetime

MessageType   = Literal['text', 'markdown', 'template', 'user_action', 'context', 'analytics']
MessageState  = Literal['PENDING', 'COMPLETED', 'IN_PROGRESS', 'ERRORED_AT_ML', 'TIMED_OUT_BY_BE', 'CANCELLED_BY_USER']
SenderType    = Literal['user', 'bot', 'system']
SourceState   = Literal['IN_PROGRESS', 'COMPLETED', 'ERRORED_AT_ML']

class MessageContent(BaseModel):
    text:          Optional[str]  = None
    template_id:   Optional[str]  = None   # camelCase in JSON: templateId
    data:          Optional[dict] = None
    derived_label: Optional[str]  = None   # camelCase: derivedLabel

    model_config = {'populate_by_name': True}

class ChatEventToUser(BaseModel):
    conversation_id:     str           # camelCase: conversationId
    message_id:          str           # messageId
    source_message_id:   Optional[str] = None   # sourceMessageId
    message_type:        MessageType             # messageType
    message_state:       MessageState            # messageState
    source_message_state: Optional[SourceState] = None  # sourceMessageState
    created_at:          str                     # createdAt (ISO 8601)
    sequence_number:     Optional[int] = None    # sequenceNumber
    response_required:   Optional[bool] = None   # responseRequired
    is_visible:          Optional[bool] = None   # isVisible
    sender:              dict                     # { type: SenderType }
    content:             MessageContent

    model_config = {'alias_generator': ..., 'populate_by_name': True}
    # Use alias_generator=to_camel to emit camelCase JSON
```

---

### B2. ChatEventFromUser (Frontend → Backend)

What the frontend sends on every POST to send-message-streamed or send-message.

```typescript
interface ChatEventFromUser {
  conversationId: string;
  sender:         { type: "user" | "system"; };
  messageType:    MessageType;
  content: {
    text?:         string;
    templateId?:   string;
    data?:         Record<string, unknown>;
    derivedLabel?: string;
  };
  responseRequired: boolean;
  isVisible?:      boolean;
}
```

**Incoming message parsing in the FastAPI handler:**
```python
async def handle_message(body: ChatEventFromUser, request: Request):
    message_type = body.message_type

    if message_type == 'text':
        raw_message = body.content.text or ''

    elif message_type == 'user_action':
        action = (body.content.data or {}).get('action', '')
        raw_message = map_user_action_to_text(action, body.content.data, session)
        # See Part E for action → natural language mapping

    elif message_type == 'context':
        # Silent context injection (system messages) — route to session update only, no pipeline
        await update_session_from_context(body, session)
        return non_streaming_ack(body)

    else:
        raw_message = body.content.text or ''

    # Continue to pipeline...
```

---

### B3. MessageDeltaEventToUser (Incremental Streaming)

Emitted as SSE `message_delta` events when `streamingEnabled=true`.

```typescript
interface MessageDeltaEventToUser {
  messageId:       string;     // matches the text chat_event's messageId for this turn
  sourceMessageId: string;     // the user message being responded to
  sequenceNumber:  number;     // 0 for the first chunk, then the text row's sequenceNumber
  messageType?:    "text" | "markdown";  // only on chunkIndex === 0
  chunkIndex:      number;     // 0-based; monotonically increasing
  content: { text: string; }; // append-only fragment
  chunkId?:        string;
}
```

**Mapping from our llm_node stream:**
```python
# In llm_node, replace:
#   on_chunk=lambda chunk: emit_sse({'type': 'bot_chunk', 'text': chunk})
# With:
chunk_index = 0

def on_chunk(chunk: str, message_id: str, source_message_id: str, seq: int):
    nonlocal chunk_index
    delta_event = {
        'messageId':       message_id,
        'sourceMessageId': source_message_id,
        'sequenceNumber':  seq,
        'chunkIndex':      chunk_index,
        'content':         {'text': chunk},
    }
    if chunk_index == 0:
        delta_event['messageType'] = 'text'   # or 'markdown' for Sonnet intents
    emit_sse_event('message_delta', delta_event)
    chunk_index += 1
```

---

## Part C — SSE Protocol

Every streaming response is a Server-Sent Events stream. Each SSE message has:
```
event: <event_name>\n
data: <JSON>\n
\n
```

### C1. Turn Lifecycle

```
1. connection_ack       — emitted immediately by HTTP handler after parsing request
2. chat_event (text)    — emitted by respond_node; sourceMessageState: "IN_PROGRESS"
   [message_delta ×N]  — emitted by llm_node during streaming (if streamingEnabled=true)
   chat_event (text)    — final text row; sourceMessageState: "IN_PROGRESS" if templates follow
3. chat_event (template)  — one per template in the response; last one has sourceMessageState: "COMPLETED"
4. connection_close     — emitted by HTTP handler after graph exits
```

For short-circuit turns (safety block, gibberish, out_of_scope):
```
1. connection_ack
2. chat_event (text)    — sourceMessageState: "COMPLETED"
3. connection_close
```

### C2. connection_ack

```json
{
  "messageId":    "<user message ID — assigned by backend>",
  "messageState": "IN_PROGRESS"
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

## Part D — Template Catalogue

Templates are `chat_event` rows with `messageType: "template"` and a `templateId`.
The `data` field in `content` is the template's payload.

### D1. property_carousel

**templateId:** `"property_carousel"`
**Triggers:** `searchProperties`, `getSimilarProperties`, `getRecommendations`, `getSavedProperties`, `getViewedProperties`

```typescript
interface PropertyCarouselData {
  properties:     PropertyCarouselCard[];
  property_count?: number;
  pagination?:    { is_last_page?: boolean; };
  user_intent?:   string;    // for FE analytics
  service?:       string;    // "buy" or "rent"
  category?:      string;
  city?:          string;
  filters?:       object;
}

interface PropertyCarouselCard {
  _id:                    string;
  id:                     string;
  type:                   "rent" | "project" | "resale";
  title:                  string;
  name?:                  string;
  price_on_request?:      boolean;
  current_status?:        string;
  possession_date?:       string;
  short_address:          { display_name: string; }[];
  region_entities?:       { name?: string; }[];
  is_rera_verified?:      boolean;
  is_verified?:           boolean;
  inventory_canonical_url: string;
  thumb_image_url:        string;
  property_tags:          string[];
  formatted_price?:       string;
  formatted_min_price?:   string;
  formatted_max_price?:   string;
  unit_of_area:           string;
  display_area_type:      string;
  min_selected_area_in_unit?: number;
  max_selected_area_in_unit?: number;
  inventory_configs: {
    furnish_type_id?:     1 | 2 | 3;
    area_value_in_unit?:  number;
  }[];
}
```

**Important — full card, not truncated:**
The `response_truncation` for `searchProperties` in TOOL_REGISTRY drops `image_urls`,
`builder_description`, and `full_address` **for the LLM context only**. The `data` injected
into the `property_carousel` template must come from the **full Khoj response** (before truncation).
The build_prompt_node passes a truncated snapshot to the LLM; respond_node independently
accesses the full `pre_fetched_data['searchProperties']` for the template payload.

**Intent → template mapping:**

| Intent | Tool | property_carousel data source |
|---|---|---|
| property_search/filter_search | searchProperties | `hits`, paginated |
| property_search/explore_nearby | searchProperties | `hits` |
| property_search/discovery_collections | searchProperties (via collection filters) | `hits` |
| property_detail/similar_properties | getSimilarProperties | `hits` |
| portfolio/saved_properties | getSavedProperties | `properties` |
| portfolio/viewed_properties | getViewedProperties | `properties` |
| portfolio/recommendations | getRecommendations | `hits` |

---

### D2. locality_carousel

**templateId:** `"locality_carousel"`
**Triggers:** `getTrendingLocalities`, `locality_research/locality_comparison`

```typescript
interface LocalityCarouselData {
  localities: LocalityCard[];
}

interface LocalityCard {
  id:            string;     // locality UUID
  name:          string;
  displayName?:  string;
  cityName:      string;
  cityUuid:      string;
  image:         string;     // locality banner image URL
  rating:        number;     // 1–5 livability score
  percentGrowth?: number;    // YoY price change %
  priceTrend?:   number;     // avg price per sqft
  url?:          string;     // Housing.com locality SEO page URL
  link?:         string;     // backward compat alias for url
  description?:  string;
  highlights?:   string[];
  pros?:         string[];
  cons?:         string[];
}
```

**Mapping from our tool responses:**

| Our field | → LocalityCard field |
|---|---|
| `locality_id` | `id` |
| `name` | `name` + `displayName` |
| `city` (from session) | `cityName` |
| `city_uuid` (from entity resolution) | `cityUuid` |
| `image_url` (Odin field) | `image` |
| `livability_score` | `rating` |
| `yoy_change_pct` | `percentGrowth` |
| `price_psf` | `priceTrend` |
| `seo_url` (Odin field) | `url` |

**Odin's `getTrendingLocalities` and `getLocalityDetail` should include `image_url`, `city_uuid`,
and `seo_url` in their responses.** Add these to the `return_schema_summary` in TOOL_REGISTRY.
If Odin does not provide them, the orchestrator derives `url` as `/locality/<locality_id>`.

**Intent → template mapping:**

| Intent | Template data |
|---|---|
| locality_research/trending_localities | Map `getTrendingLocalities.localities` → `LocalityCard[]` |
| comparison/compare_localities | Two locality cards side-by-side in the same template |
| locality_research/locality_comparison | Same as compare_localities |

---

### D3. download_brochure

**templateId:** `"download_brochure"`
**Triggers:** `property_detail/brochure` intent (tool: `getBrochure`)

```typescript
interface DownloadBrochureData extends PropertyCarouselCard {
  brochure_images: string[];   // Array of brochure page image URLs
}
```

**Mapping:** Pass the active property's `PropertyCarouselCard` fields (from `getPropertyDetail`)
combined with `getBrochure.brochure_url` expanded into `brochure_images`. If the brochure is
a PDF, the orchestrator requests a pre-rendered image URL list from Venus.

---

### D4. share_location

**templateId:** `"share_location"`
**Triggers:** `filter_delta.user_location_needed = true` (from `property_search/explore_nearby`)

```typescript
interface ShareLocationData {}  // data is empty; template renders a permission request button
```

**Current architecture gap:** `user_location_needed` is a filter key that triggers a client-side
geolocation request. Currently documented as "orchestrator emits a get_location SSE event" —
this must map to a `chat_event` with `templateId: "share_location"` instead.

**Flow:**
1. SLM outputs `filter_delta: { user_location_needed: true }`
2. `derive_node` sees `user_location_needed = true` in filters
3. Short-circuit: instead of `get_location` SSE event, the pipeline emits `share_location` template
4. Frontend renders the location permission button
5. User grants permission → frontend sends `user_action` with `action: "location_shared"` and `coordinates`
6. Next turn: orchestrator reads `location_shared` coordinates into session state and runs the search

---

### D5. nested_qna

**templateId:** `"nested_qna"`
**Triggers:** SLM sets `clarification_needed` (from `clarify_node`)

```typescript
interface NestedQnaData {
  selections: NestedQnaSelection[];
}

interface NestedQnaSelection {
  questionId: string;
  title?:     string;       // The question text shown to the user
  type?:      string;       // "single_select" | "text_input"
  entity?:    string;
  options:    NestedQnaOption[];
}

interface NestedQnaOption {
  id:          string;
  title?:      string;
  name?:       string;      // backward compat
  attributes?: string[];
  type?:       string;
  city?:       string;
}
```

**Current architecture mismatch:** `clarification_needed` in the SLM output is a plain string
(the question text). The `nested_qna` template requires structured `selections` with options.

**Resolution — structured SLM clarification output:**
The SLM must output a `clarification_data` field (JSON object) instead of a plain string for
`clarification_needed`. The new SLM output schema for clarifications:

```json
{
  "clarification_needed": "string (question text)",
  "clarification_data": {
    "question_id":  "q1",
    "options": [
      { "id": "rent",  "title": "Rent" },
      { "id": "buy",   "title": "Buy / Purchase" }
    ]
  }
}
```

When `options` is empty or absent, the clarification is a free-text question. The orchestrator
maps this to `nested_qna` with `type: "text_input"` and no options — the user types their response.

**SLM prompt update:** `05-output-schema.md` must include the `clarification_data` field spec.
Examples in `examples/out_of_scope.md` must show both option-based and free-text clarifications.

**`validate_slm_node` update:** coerce `clarification_data` if absent:
```python
if c.get('clarification_needed') and not c.get('clarification_data'):
    # Old SLM output without structured data — wrap as free-text question
    c['clarification_data'] = {'question_id': 'q1', 'options': []}
```

**`clarify_node` update:**
```python
async def clarify_node(state: BotState) -> dict:
    c = state.get('classification') or {}
    if c.get('clarification_needed'):
        clarification_data = c.get('clarification_data', {})
        nested_qna_payload = {
            'selections': [{
                'questionId': clarification_data.get('question_id', 'q1'),
                'title':      c['clarification_needed'],
                'type':       'single_select' if clarification_data.get('options') else 'text_input',
                'options':    clarification_data.get('options', []),
            }]
        }
        return {
            'bot_response': {
                'template_id': 'nested_qna',
                'data':        nested_qna_payload,
            },
            'clarification_emitted': True,
        }
    return {}
```

---

### D6. shortlist_property (Transient)

**templateId:** `"shortlist_property"`
**Triggers:** Tier 1 intent `property_detail/save_property` (tool: `shortlistProperty`)
**Visibility:** Only renders when it is the last message in the chat. Auto-executes on render.

```typescript
interface ShortlistPropertyData {
  property: { id: string; type: string; };
}
```

---

### D7. contact_seller (Transient)

**templateId:** `"contact_seller"`
**Triggers:** Tier 1 intent `property_detail/contact_seller` (tool: `contactSeller`)
**Visibility:** Transient — auto-executes on render.

```typescript
interface ContactSellerData {
  /* generic data object; frontend posts to /api/properties/contact-seller */
}
```

---

## Part E — Incoming User Action Handling

The frontend sends `messageType: "user_action"` for button taps, location responses, and form
submissions. The pipeline must parse these into a `raw_message` (or direct session update) before
classification.

### E1. Action → raw_message Mapping

```python
def map_user_action_to_text(
    action:  str,
    data:    dict,
    session: dict,
) -> str:
    """Convert a user_action data payload to a natural language string for the SLM."""
    match action:

        case 'learn_more_about_property':
            # data.property.id is the property UUID
            property_id = (data.get('property') or {}).get('id', '')
            # Inject property_id into session for this turn
            session['active_property_id'] = property_id
            return data.get('derivedLabel') or 'Tell me more about this property'

        case 'contact_seller' | 'contacted_seller':
            property_id = (data.get('property') or {}).get('id', '')
            session['active_property_id'] = property_id
            return 'I want to contact the seller'

        case 'shortlist' | 'shortlisted_property':
            property_id = (data.get('property') or {}).get('id', '')
            session['active_property_id'] = property_id
            return 'Save this property to my shortlist'

        case 'show_properties_in_locality':
            locality = data.get('locality', {})
            # Inject resolved locality into session directly
            session['active_locality_id']   = locality.get('localityUuid', '')
            session['active_locality_name'] = locality.get('localityName', '')
            return data.get('derivedLabel') or f"Show properties in {locality.get('localityName', 'this area')}"

        case 'learn_more_about_locality':
            locality = data.get('locality', {})
            session['active_locality_id'] = locality.get('localityUuid', '')
            return data.get('derivedLabel') or f"Tell me about {locality.get('localityName', 'this locality')}"

        case 'share_location_clicked':
            return 'I want to search near me'

        case 'location_shared':
            coords = (data.get('location_shared') or {}).get('coordinates', [])
            if len(coords) == 2:
                session['user_coordinates'] = {'lat': coords[0], 'lng': coords[1]}
                # Clear user_location_needed now that we have coordinates
                session.setdefault('active_filters', {}).pop('user_location_needed', None)
                session['active_filters']['lat'] = coords[0]
                session['active_filters']['lng'] = coords[1]
            return 'Show me properties near my location'

        case 'location_denied' | 'location_not_available':
            return 'I cannot share my location right now'

        case 'nested_qna_selection':
            # User submitted answers to a clarification form
            selections = data.get('selections', [])
            return _format_qna_response(selections)

        case _:
            return data.get('derivedLabel') or action.replace('_', ' ')

def _format_qna_response(selections: list[dict]) -> str:
    parts = []
    for s in selections:
        if s.get('skipped'):
            continue
        if s.get('selection'):
            parts.append(s['selection'])
        elif s.get('text'):
            parts.append(s['text'])
    return ', '.join(parts) if parts else 'I am not sure'
```

### E2. Silent Actions (responseRequired: false)

These do not enter the LLM pipeline. Handle them directly in the HTTP layer:

| action | Backend handling |
|---|---|
| `shortlist` | Forward to `shortlistProperty` tool; return non-streaming ack |
| `shortlisted_property` | Analytics event only; ack |
| `contact_seller` | Forward to `contactSeller` tool; return non-streaming ack |

---

## Part F — Multi-Event Turn Assembly

A single bot turn produces multiple SSE `chat_event` rows. All rows in one turn share the same
`sourceMessageId` (the user's message ID for this turn). `sequenceNumber` orders them.

### F1. Sequence Model

```
Turn N:
  sourceMessageId = user_message_id_N

  Seq 0: chat_event (messageType: "text")
         → validated_text content
         → sourceMessageState: "IN_PROGRESS"  (if templates follow)
                               "COMPLETED"    (if no templates)

  Seq 1: chat_event (messageType: "template", templateId: "property_carousel")
         → sourceMessageState: "IN_PROGRESS"  (if more templates follow)
                               "COMPLETED"    (if this is the last)

  Seq 2: chat_event (messageType: "template", templateId: "locality_carousel")
         → sourceMessageState: "COMPLETED"    (last in turn)
```

### F2. respond_node: Building the Event Sequence

```python
async def respond_node(state: BotState, emit_sse: Callable) -> dict:
    c               = state['classification']
    source_msg_id   = state['request_id']          # user turn's request_id = sourceMessageId
    conversation_id = state['session']['session_id']
    now             = datetime.utcnow().isoformat() + 'Z'

    events: list[ChatEventToUser] = []

    # 1. Text event (always present if validated_text is non-empty)
    if state.get('validated_text'):
        events.append(ChatEventToUser(
            conversation_id    = conversation_id,
            message_id         = str(uuid.uuid4()),
            source_message_id  = source_msg_id,
            message_type       = 'markdown' if is_markdown(state['validated_text']) else 'text',
            message_state      = 'COMPLETED',
            source_message_state = 'IN_PROGRESS',   # will be updated after templates appended
            created_at         = now,
            sequence_number    = 0,
            sender             = {'type': 'bot'},
            content            = MessageContent(text=state['validated_text']),
        ))

    # 2. Template events derived from pre_fetched_data + tool_results
    template_events = build_template_events(
        classification   = c,
        pre_fetched_data = state.get('pre_fetched_data') or {},
        tool_results     = state.get('tool_results') or [],
        session          = state['session'],
        source_msg_id    = source_msg_id,
        conversation_id  = conversation_id,
        seq_start        = len(events),
        now              = now,
    )
    events.extend(template_events)

    # Mark last event as COMPLETED turn
    if events:
        events[-1].source_message_state = 'COMPLETED'

    # Emit all events over SSE (respond_node now calls emit_sse directly for each row)
    for event in events:
        emit_sse('chat_event', event.model_dump(by_alias=True))

    bot_response = events[-1].model_dump(by_alias=True) if events else None

    await persist_to_kafka(conversation_id, [e.model_dump(by_alias=True) for e in events])
    session = state['session']
    saved   = await update_session_state(session, c, state.get('tool_results') or [])
    if not saved:
        await reconcile_session_conflict(session, bot_response)

    return {'bot_response': bot_response}
```

### F3. build_template_events: Intent → Template Mapping

```python
# Maps each intent to its template builder.
# Each builder receives the full (non-truncated) pre_fetched_data for that intent.

TEMPLATE_BUILDERS: dict[tuple[str, str], Callable] = {
    ('property_search', 'filter_search'):            build_property_carousel,
    ('property_search', 'explore_nearby'):           build_property_carousel,
    ('property_search', 'discovery_collections'):    build_property_carousel,
    ('property_detail', 'similar_properties'):       build_property_carousel,
    ('property_detail', 'brochure'):                 build_download_brochure,
    ('portfolio', 'saved_properties'):               build_property_carousel,
    ('portfolio', 'viewed_properties'):              build_property_carousel,
    ('portfolio', 'recommendations'):                build_property_carousel,
    ('locality_research', 'trending_localities'):    build_locality_carousel,
    ('comparison', 'compare_localities'):            build_locality_carousel,
    ('locality_research', 'locality_comparison'):    build_locality_carousel,
}

def build_property_carousel(
    pre_fetched_data: dict,
    session: dict,
    tool_results: list[dict],
) -> dict | None:
    # Use full searchProperties result (before response_truncation)
    data = pre_fetched_data.get('searchProperties') or pre_fetched_data.get('getSimilarProperties') or \
           pre_fetched_data.get('getRecommendations') or pre_fetched_data.get('getSavedProperties') or \
           pre_fetched_data.get('getViewedProperties')
    if not data:
        return None
    hits = data.get('hits') or data.get('properties') or []
    return {
        'templateId': 'property_carousel',
        'data': {
            'properties':     hits,
            'property_count': data.get('total_count') or len(hits),
            'pagination':     {'is_last_page': data.get('is_last_page', False)},
            'service':        session.get('transaction_type'),
            'city':           session.get('city'),
        },
    }

def build_locality_carousel(
    pre_fetched_data: dict,
    session: dict,
    tool_results: list[dict],
) -> dict | None:
    localities_raw = (pre_fetched_data.get('getTrendingLocalities') or {}).get('localities', [])
    # For comparison intents, merge from fetch_key slots
    if not localities_raw:
        loc0 = pre_fetched_data.get('getLocalityDetail:0')
        loc1 = pre_fetched_data.get('getLocalityDetail:1')
        if loc0:
            localities_raw = [loc0]
        if loc1:
            localities_raw.append(loc1)
    if not localities_raw:
        return None
    return {
        'templateId': 'locality_carousel',
        'data': {
            'localities': [map_to_locality_card(loc, session) for loc in localities_raw],
        },
    }

def map_to_locality_card(locality: dict, session: dict) -> dict:
    return {
        'id':           locality.get('locality_id') or locality.get('id', ''),
        'name':         locality.get('name', ''),
        'displayName':  locality.get('display_name') or locality.get('name', ''),
        'cityName':     locality.get('city') or session.get('city', ''),
        'cityUuid':     locality.get('city_uuid', ''),
        'image':        locality.get('image_url', ''),
        'rating':       locality.get('livability_score') or locality.get('rating', 0),
        'percentGrowth': locality.get('yoy_change_pct') or locality.get('percent_growth'),
        'priceTrend':   locality.get('price_psf') or locality.get('price_trend'),
        'url':          locality.get('seo_url') or locality.get('url') or f'/locality/{locality.get("locality_id", "")}',
        'link':         locality.get('seo_url') or locality.get('url'),
        'description':  locality.get('description'),
        'highlights':   locality.get('highlights'),
    }
```

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

        elif bot_response.get('type') == 'bot_complete':
            # respond_node already emitted — no-op
            pass

        # Other structured short-circuits (auth_required, fetch_error) → emit as text
        elif bot_response.get('text'):
            event = ChatEventToUser(...)
            emit_sse('chat_event', event.model_dump(by_alias=True))
```

---

## Part H — Graph Node Invariant Update

The previous invariant stated:
> Nodes that short-circuit only set `bot_response` — they never call `emit_sse_event` directly.
> This guarantees exactly one SSE emission per request.

**Updated invariant:**
- `respond_node` calls `emit_sse('chat_event', ...)` directly for each event in the turn (text + templates).
- All other nodes that short-circuit only set `bot_response` — they do NOT call `emit_sse` directly.
- After the graph exits, the HTTP handler calls `emit_final_state()` which emits `bot_response`
  if `respond_node` did NOT run (i.e., a short-circuit path was taken).
- `connection_ack` is emitted by the HTTP handler before the graph starts.
- `connection_close` is emitted by the HTTP handler after the graph exits.

This replaces the old single-emit model with a multi-emit model for full turns, while preserving
the single-emit guarantee for short-circuit paths.

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
| `connection_ack` | FastAPI handler (before graph) | `{ messageId, messageState }` |
| `message_delta` | llm_node (streaming chunks) | `MessageDeltaEventToUser` |
| `chat_event` (text) | respond_node or `emit_final_state` | `ChatEventToUser` (messageType: text/markdown) |
| `chat_event` (template) | respond_node | `ChatEventToUser` (messageType: template + templateId) |
| `connection_close` | FastAPI handler (after graph) | `{ reason }` |

## Summary: Complete Template Inventory

| templateId | Triggers from | Transient? | Notes |
|---|---|---|---|
| `property_carousel` | property_search, similar_properties, portfolio | No | Full card data from Khoj |
| `locality_carousel` | trending_localities, comparison | No | Mapped from Odin schema |
| `download_brochure` | property_detail/brochure | No | property card + brochure_images |
| `share_location` | user_location_needed filter = true | Yes (last-only) | derive_node short-circuit |
| `nested_qna` | clarification_needed | Yes (last-only) | structured SLM clarification_data |
| `shortlist_property` | Tier 1 save_property | Yes (auto-execute) | executes on render |
| `contact_seller` | Tier 1 contact_seller | Yes (auto-execute) | executes on render |
