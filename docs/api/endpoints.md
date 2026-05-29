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
  messageState:     "IN_PROGRESS" | "COMPLETED";
  // IN_PROGRESS: turn is still generating (more events to come). COMPLETED: turn fully done. Other states exist in the DB but are never sent over SSE.
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
MessageState  = Literal['IN_PROGRESS', 'COMPLETED']
# IN_PROGRESS: turn is still generating (more events to come). COMPLETED: turn fully done. Other states exist in the DB but are never sent over SSE.
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
  sequenceNumber:  number;     // fixed for ALL chunks of a given text event (matches the paired chat_event's sequenceNumber)
  messageType?:    "text" | "markdown";  // only on chunkIndex === 0
  chunkIndex:      number;     // 0-based; monotonically increasing
  content: { text: string; }; // append-only fragment
  chunkId?:        string;
}
```

**Mapping from our llm_node stream:**
```python
# seq = (1 if summary_emitted else 0) + (template_count or 0)
# text_message_id is pre-generated in llm_node so message_delta and followup_node's
# chat_event share the same messageId (FE assembles streamed text by messageId).
chunk_index = 0

def on_chunk(chunk: str):
    nonlocal chunk_index
    delta_event = {
        'messageId':       text_message_id,
        'sourceMessageId': source_msg_id,
        'sequenceNumber':  seq,
        'chunkIndex':      chunk_index,
        'content':         {'text': chunk},
    }
    if chunk_index == 0:
        delta_event['messageType'] = 'text'   # 'markdown' for Sonnet intents
    emit_sse('message_delta', delta_event)
    chunk_index += 1
```

---

