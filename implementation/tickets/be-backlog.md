# BE Backlog — @arjun (BE Tech Lead)

**Canonical docs:** `docs/pipeline/pipeline-preamble.md`, `docs/operations/db-schema.md`, `docs/api/endpoints.md`, `docs/api/sse-contract.md`

---

## CHAT-A-001: FastAPI skeleton + /health endpoint
**Sprint:** 0 | **SP:** 2 | **Status:** ⬜

**Description:**  
Bootstrap the FastAPI application. This is the entry point for all other BE tickets.

**Project structure:**
```
src/
├── main.py                # FastAPI app, lifespan, router include
├── config.py              # Pydantic BaseSettings (all from ENV)
├── api/
│   ├── __init__.py
│   ├── chat.py            # Chat endpoints (A3, A2, A1 from api-contract.md)
│   └── health.py          # GET /health
├── session/               # Redis SessionStorePort
├── db/                    # PostgreSQL (Alembic, async engine)
├── kafka/                 # Producer + consumers
├── registry/              # SessionRegistryPort
└── observability/         # Structlog, LangSmith config
```

**Acceptance Criteria:**
- [ ] `uvicorn src.main:app --reload` starts without errors
- [ ] `GET /health` returns `{"status": "ok", "version": "0.1.0"}`
- [ ] All config reads from ENV via Pydantic Settings (no hardcoded values)
- [ ] App starts gracefully if Redis/Postgres/Kafka are down (logs warning, doesn't crash)

**Technical Notes:**  
Use `asyncpg` + `SQLAlchemy 2.0` async for PostgreSQL. Use `redis.asyncio` for Redis. `python-kafka` or `aiokafka` for Kafka.

---

## CHAT-A-002: PostgreSQL migrations (Alembic) — conversations + messages tables
**Sprint:** 0 | **SP:** 3 | **Status:** ⬜

**Description:**  
Create Alembic migration that builds the full schema from `docs/operations/db-schema.md` Section 2.

**Schema to implement:**
- `conversations` table (see db-schema.md lines 46–90)
- `messages` table with `PARTITION BY RANGE (created_at)` (see db-schema.md lines 92–150)
- Monthly partition for current month + 2 future months
- All indexes from db-schema.md
- Trigger: `fn_update_conversation_on_message()` (updates `turn_count` and `updated_at`)
- pg_partman extension setup (or manual partitions if pg_partman not available in Docker)
- All enums: `conversation_status`, `message_type_enum`, `sender_type_enum`, `message_state_enum`

**Acceptance Criteria:**
- [ ] `make migrate` runs clean from empty DB
- [ ] `make migrate` is idempotent (safe to run twice)
- [ ] `EXPLAIN ANALYZE SELECT ... FROM messages WHERE conversation_id = X ORDER BY created_at DESC LIMIT 20` shows index scan (not seq scan)
- [ ] Trigger fires correctly: inserting a user message increments `conversations.turn_count`

**Technical Notes:**  
For local setup, use manual monthly partitions (skip pg_partman). Document the production migration path in a comment. See `docs/operations/db-schema.md` for exact DDL.

---

## CHAT-A-003: Pydantic settings (all config from env)
**Sprint:** 0 | **SP:** 2 | **Status:** ⬜

**Description:**  
`src/config.py` — single `Settings` class using `pydantic-settings`. All env vars from `.env.example` mapped here.

**Key settings groups:**
```python
class Settings(BaseSettings):
    # DB
    postgres_host: str
    postgres_port: int = 5433
    postgres_db: str = "chatbot"
    postgres_user: str
    postgres_password: SecretStr
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # Kafka
    kafka_bootstrap_servers: str = "localhost:9092"
    
    # Anthropic
    anthropic_api_key: SecretStr
    
    # External APIs
    khoj_base_url: str
    odin_base_url: str
    casa_base_url: str
    venus_base_url: str
    autosuggest_base_url: str
    
    # Application
    bot_env: Literal["local", "staging", "production"] = "local"
    log_level: str = "INFO"
    secret_key: SecretStr
    
    # LLM
    llm_max_concurrent: int = 20
    llm_queue_max: int = 50
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
```

**Acceptance Criteria:**
- [ ] Missing required vars raise a clear `ValidationError` on startup
- [ ] `SecretStr` fields never appear in logs or repr
- [ ] Settings singleton accessible via `get_settings()` with `@lru_cache`

---

## CHAT-A-004: Structlog setup + request_id middleware
**Sprint:** 0 | **SP:** 2 | **Status:** ⬜

**Description:**  
Configure `structlog` for JSON output. Add `request_id` FastAPI middleware that generates a UUID4 per request and injects it into the log context.

**Log format (JSON, one object per line):**
```json
{"ts": "2026-05-29T14:30:00Z", "level": "info", "event": "session_loaded", "request_id": "uuid4", "session_id": "...", "latency_ms": 1}
```

**Acceptance Criteria:**
- [ ] Every log line includes `ts`, `level`, `event`, `request_id`
- [ ] `request_id` is propagated to all sub-calls within a request (using `contextvars`)
- [ ] `LOG_LEVEL=DEBUG` in .env enables debug logs without code change
- [ ] User message text is NOT logged at INFO level (only at DEBUG, and only the first 20 chars)

**Technical Notes:**  
Use `structlog.configure()` with `JSONRenderer`. Bind `request_id` via `structlog.contextvars.bind_contextvars()` in middleware.

---

## CHAT-A-005: Redis connection pool setup
**Sprint:** 0 | **SP:** 1 | **Status:** ⬜

**Description:**  
Configure the Redis async connection pool. Singleton pool used across the app.

**Acceptance Criteria:**
- [ ] Pool initialized in FastAPI `lifespan` function
- [ ] Max connections = 20 per pod (configurable via env)
- [ ] Connection errors logged and retried with exponential backoff (max 3 retries on startup)
- [ ] Health check pings Redis: `GET /health` returns `{"redis": "ok"}` or `{"redis": "unavailable"}`

---

## CHAT-A-006: SSE streaming endpoint (/chat/send-message-streamed)
**Sprint:** 1 | **SP:** 5 | **Status:** ⬜

**Description:**  
The primary chat endpoint. Accepts `ChatEventFromUser`, runs the LangGraph pipeline, streams `text/event-stream` response.

**See:** `docs/api/endpoints.md` Part A3, `docs/api/sse-contract.md` for event shapes.

**Implementation outline:**
```python
@router.post("/api/v1/chat/send-message-streamed")
async def send_message_streamed(
    body: ChatEventFromUser,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    request_id = get_request_id()
    
    # 1. Load session from Redis
    session = await session_store.load(body.conversation_id)
    
    # 2. Emit user message to Kafka (fire-and-forget)
    await kafka_producer.publish("chat.messages", user_message_record(...))
    
    # 3. Build initial BotState
    state = make_base_state(raw_message=body.content.text, session=session, request_id=request_id)
    
    # 4. Set up SSE generator
    async def generate():
        emit_fn = make_emit_sse_fn()   # captures the SSE queue
        graph = build_graph(emit_fn=emit_fn, ...)
        
        yield sse_frame("connection_ack", {"messageId": request_id, "messageState": "IN_PROGRESS"})
        
        async for event in run_graph_with_sse(graph, state, emit_fn):
            yield event
        
        # Emit bot messages to Kafka (fire-and-forget)
        await kafka_producer.publish("chat.messages", ...)
    
    return StreamingResponse(generate(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
    })
```

**Acceptance Criteria:**
- [ ] `connection_ack` is always the first event
- [ ] `chat_event { sourceMessageState: "COMPLETED" }` is always the last event
- [ ] `/cancel` request mid-stream causes the generator to stop cleanly
- [ ] If LangGraph raises, emits `error` SSE event and closes stream (does not return 500)
- [ ] `streamingEnabled=false` query param falls back to A4 non-streaming response

---

## CHAT-A-007: /chat/get-conversation-id endpoint + session token system
**Sprint:** 1 | **SP:** 3 | **Status:** ⬜

**Description:**  
`GET /api/v1/chat/get-conversation-id` — the entry point for every session.  
Also the source of the `token_id` (BE-generated device identifier for anonymous users).

**Session token design (PM-confirmed):**
```
Anonymous flow:
  1. FE calls GET /chat/get-conversation-id (no headers)
  2. BE generates token_id = UUID4, creates conversation row
  3. BE returns { conversationId, tokenId, isNew: true }
  4. FE stores tokenId in cookie, sends on every future request as X-Token-ID header

Logged-in flow:
  1. FE calls GET /chat/get-conversation-id with Login-Auth-Token header
  2. BE calls login service API to validate the token → gets user_id
  3. BE looks up existing conversation for this user_id, or creates new one
  4. Returns { conversationId, isNew } (no tokenId in response — FE already has it)

migrate-chat:
  1. User logs in while in an anonymous chat
  2. FE calls POST /chat/migrate-chat with Login-Auth-Token + currentConversationId
  3. BE validates login token → gets user_id
  4. Updates conversations SET user_id = ? WHERE conversation_id = ? AND token_id = ?
  5. Chat is now owned by the logged-in user
```

**Login service API call:**
```python
async def validate_login_token(login_auth_token: str) -> str | None:
    """Calls Housing login service to validate token. Returns user_id or None."""
    resp = await http_client.get(
        f"{settings.login_service_url}/validate",
        headers={"Login-Auth-Token": login_auth_token},
    )
    if resp.status_code == 200:
        return resp.json()["userId"]
    return None
```

Add `LOGIN_SERVICE_URL` to `.env.example`.

**Acceptance Criteria:**
- [ ] Anonymous: generates `token_id` (UUID4), stores in `conversations.token_id`
- [ ] Response: `{"conversationId": "uuid", "tokenId": "uuid", "isNew": true}`
- [ ] Logged-in: validates `Login-Auth-Token` via login service; maps to `user_id`
- [ ] If login service is down: fall back to anonymous flow (log warning)
- [ ] Session initialized in Redis with empty state on conversation creation
- [ ] `conversations` row created via Kafka `chat.session_events` (not synchronous)

---

## CHAT-A-008: Redis SessionStorePort implementation
**Sprint:** 1 | **SP:** 5 | **Status:** ⬜

**Description:**  
Implements `SessionStorePort` from `docs/pipeline/pipeline-preamble.md` using Redis.

**Keys managed:**
```
session:{session_id}                → JSON session state, TTL 24h
conv:context:{conversation_id}      → JSON entity/filter context, TTL 24h
conv:turns:{conversation_id}        → Redis List (LPUSH + LTRIM 0 19), TTL 7d
conv:summary:{conversation_id}      → String, TTL 7d
```

**Interface to implement:**
```python
class RedisSessionStore:
    async def load(self, session_id: str) -> dict           # returns SessionState
    async def save(self, session_id: str, state: dict, expected_version: int) -> bool
    async def load_turns(self, conversation_id: str) -> list
    async def push_turn(self, conversation_id: str, turn: dict) -> None
    async def load_summary(self, conversation_id: str) -> str | None
    async def save_summary(self, conversation_id: str, summary: str) -> None
```

**Acceptance Criteria:**
- [ ] `save()` uses optimistic locking (`expected_version` check via Lua EVAL)
- [ ] Returns `False` on version conflict (caller retries)
- [ ] `load()` returns empty state dict (not None) on cache miss
- [ ] All ops use `asyncio` Redis client (not sync)
- [ ] TTL refreshed on every `save()`

---

## CHAT-A-009: ChatEventToUser Pydantic model + emit_sse
**Sprint:** 1 | **SP:** 3 | **Status:** ⬜

**Description:**  
Pydantic models for all SSE event shapes. `emit_sse()` callable injected into pipeline nodes.

**See:** `docs/api/endpoints.md` Part B1.

```python
# src/api/models.py

class MessageContent(BaseModel):
    text: Optional[str] = None
    template_id: Optional[str] = Field(None, alias="templateId")
    data: Optional[dict] = None
    derived_label: Optional[str] = Field(None, alias="derivedLabel")
    model_config = ConfigDict(populate_by_name=True)

class ChatEventToUser(BaseModel):
    conversation_id: str = Field(alias="conversationId")
    message_id: str = Field(alias="messageId")
    source_message_id: Optional[str] = Field(None, alias="sourceMessageId")
    message_type: MessageType = Field(alias="messageType")
    message_state: MessageState = Field(alias="messageState")
    source_message_state: Optional[SourceState] = Field(None, alias="sourceMessageState")
    created_at: str = Field(alias="createdAt")
    sequence_number: Optional[int] = Field(None, alias="sequenceNumber")
    sender: dict
    content: MessageContent
```

**SSE frame format:**
```python
def sse_frame(event_type: str, data: dict) -> str:
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
```

**Acceptance Criteria:**
- [ ] All fields use camelCase aliases matching FE contract
- [ ] `model_dump(by_alias=True)` produces correct JSON
- [ ] `MessageDeltaEventToUser` also implemented (for streaming chunks)
- [ ] `ErrorEvent` with `ErrorCode` enum implemented

---

## CHAT-A-010 → CHAT-A-017: (See milestones.md Sprint 2 tickets)

---

## CHAT-A-018: /api/v1/chat/migrate-chat endpoint
**Sprint:** 3 | **SP:** 2 | **Status:** ⬜

**Description:**  
`POST /api/v1/chat/migrate-chat?currentConversationId=<id>` — creates a new conversation carrying over session context.  
See `docs/api/endpoints.md` Part A6.

---

## CHAT-A-019 → CHAT-A-023: (See milestones.md Sprint 4 tickets)

---

## BE Architecture Decisions (owned by @arjun)

### Why PgBouncer transaction mode?
LangGraph nodes are async but each node may need a DB query. Transaction-mode pooling means connections are only held during an active transaction, not for the duration of the HTTP request. At 120 concurrent requests, this keeps Postgres connections under control.

### Why Kafka for writes (not synchronous)?
The SSE stream must not be blocked by DB writes. Template payloads can be up to 100KB — inserting synchronously would add 5–20ms per row. Kafka consumer batches 500 rows per 100ms, making DB writes invisible to SSE latency.

### Redis session optimistic locking
Two concurrent requests on the same session (rare but possible) could corrupt state. The `expected_version` check in `save()` prevents this. If a race is detected, the losing request re-loads state and retries (documented in `docs/context/intent-architecture.md`).

### Local vs Production config
- Local: `POSTGRES_PORT=5433` (PgBouncer), `REDIS_URL=redis://localhost:6379/0` (single node), `LLM_MAX_CONCURRENT=20`
- Production: Same env vars, different values. No code changes needed.
