"""Chat endpoints — CHAT-A-007 (get-conversation-id), CHAT-A-006 (SSE streaming), CHAT-A-024 (send-message), CHAT-A-018 (migrate-chat)."""
import asyncio
import uuid
from datetime import datetime
from typing import AsyncGenerator

import structlog.contextvars
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse, Response, StreamingResponse

from src.api.models import (
    ChatEventFromUser,
    ChatEventToUser,
    MessageContent,
)
from src.api.sse import sse_frame
from src.config import Settings, get_settings
from src.observability.logging import get_logger
from src.pipeline.graph import build_graph
from src.pipeline.state import make_base_state
from src.session.redis import get_redis

log = get_logger(__name__)

router = APIRouter(prefix="/api/v1/chat")

# Redis key TTL for conversation IDs: 365 days
CONVERSATION_TTL = 365 * 24 * 3600


# ---------------------------------------------------------------------------
# Adapter factory — selects SLM/LLM/executor based on bot_env
# ---------------------------------------------------------------------------

def _build_adapters(settings: Settings, redis):
    """Return (router_adapter, classifier_adapter, llm_adapter, executor) for the current bot_env.

    Adapter selection follows this priority:
      1. bot_env == 'mock' → mock adapters (no API calls)
      2. bot_env == 'dev'  → MODEL_REGISTRY-driven real SLM/LLM + DevExecutor (no VPN)
      3. bot_env == 'local/staging/production' → MODEL_REGISTRY-driven + real Housing APIs

    Adding a new provider (e.g. 'google') only requires:
      - A new adapter class implementing the relevant port
      - A new branch in src/adapters/factory.py
      - MODEL_REGISTRY entries pointing at the new provider
    No changes to this function or any pipeline node.
    """
    if settings.bot_env == "mock":
        from unittest.mock import MagicMock, AsyncMock
        router_adapter = MagicMock()
        router_adapter.route = AsyncMock(return_value={"domain": "property_search", "confidence": 0.95})
        classifier_adapter = MagicMock()
        classifier_adapter.classify = AsyncMock(return_value={
            "main_intent": "property_search", "sub_intent": "filter_search",
            "filter_delta": {}, "entities_mentioned": [], "entity_refs": [],
            "clarification_needed": None, "pivot": False, "multi_intent": False,
        })
        llm_adapter = MagicMock()
        async def _mock_stream(**kw):
            if kw.get("on_chunk"):
                kw["on_chunk"]("I can help you find properties. What are you looking for?")
            return {"response": {"text": "I can help you find properties. What are you looking for?"}, "tool_results": []}
        llm_adapter.stream = _mock_stream
        return router_adapter, classifier_adapter, llm_adapter, None

    # Real SLM/LLM — provider determined by MODEL_REGISTRY (anthropic | openrouter | ...)
    from src.adapters.factory import build_domain_router, build_classifier, build_llm
    router_adapter     = build_domain_router(settings)
    classifier_adapter = build_classifier(settings)
    llm_adapter        = build_llm("llm_tier3a", settings)   # default; experiment_node may override per-turn

    if settings.bot_env == "dev":
        from src.tools.dev_executor import DevExecutor
        return router_adapter, classifier_adapter, llm_adapter, DevExecutor()

    # local / staging / production — real Housing APIs (VPN required)
    from src.tools.housing_executor import HousingToolExecutor
    return router_adapter, classifier_adapter, llm_adapter, HousingToolExecutor(settings, redis)


# ---------------------------------------------------------------------------
# Internal helper — shared by get-conversation-id and migrate-chat
# ---------------------------------------------------------------------------

async def _validate_login_token(token: str, settings: Settings) -> "str | None":
    """Validate Login-Auth-Token with the housing login service.

    Returns the userId string on success, None on failure or timeout.
    Sprint 3: if login_service_url is not configured the call is skipped and
    None is returned (callers treat this as an auth failure).
    """
    if not settings.login_service_url:
        return None
    import httpx
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(
                f"{settings.login_service_url}/validate",
                headers={"Login-Auth-Token": token},
            )
            if resp.status_code == 200:
                return resp.json().get("userId")
    except Exception:
        pass
    return None


# ---------------------------------------------------------------------------
# A1 — CHAT-A-007: Get or create a conversation ID
# ---------------------------------------------------------------------------

@router.get("/get-conversation-id")
async def get_conversation_id(request: Request) -> JSONResponse:
    """
    Returns a conversationId for the caller.

    - Reads X-Token-ID header (maps to the houzy_token cookie value forwarded by FE).
    - If no token_id supplied, generates a new UUID4 and treats it as fresh.
    - Looks up Redis key "token:{token_id}:conversation_id".
    - Returns the existing conversation (isNew=false) or creates one (isNew=true).
    """
    token_id: str | None = request.headers.get("X-Token-ID")
    generated_token = False

    if not token_id:
        token_id = str(uuid.uuid4())
        generated_token = True

    redis = get_redis()
    redis_key = f"token:{token_id}:conversation_id"
    existing: str | None = await redis.get(redis_key)

    if existing:
        return JSONResponse(
            content={
                "statusCode": "200",
                "responseCode": "SUCCESS",
                "data": {
                    "conversationId": existing,
                    "isNew": False,
                },
            }
        )

    # No existing conversation — create one
    conversation_id = str(uuid.uuid4())
    await redis.set(redis_key, conversation_id, ex=CONVERSATION_TTL)

    data: dict = {
        "conversationId": conversation_id,
        "isNew": True,
        "tokenId": token_id,
    }
    return JSONResponse(
        content={
            "statusCode": "200",
            "responseCode": "SUCCESS",
            "data": data,
        }
    )


# ---------------------------------------------------------------------------
# CHAT-A-018: Migrate a guest conversation to a logged-in user
# ---------------------------------------------------------------------------

@router.post("/migrate-chat")
async def migrate_chat(
    request: Request,
    current_conversation_id: str = Query(alias="currentConversationId"),
    settings: Settings = Depends(get_settings),
) -> JSONResponse:
    """
    POST /api/v1/chat/migrate-chat?currentConversationId=<id>

    Validates Login-Auth-Token, then associates the conversation with the
    authenticated user.

    Sprint 3 scope:
      - Validate token via login service.
      - Update Redis session key to store user_id.
      - Return { conversationId, migrated: true, userId }.
    Sprint 4 (CHAT-A-010): Kafka consumer will persist to DB.
    """
    login_auth_token = request.headers.get("Login-Auth-Token")
    if not login_auth_token:
        return JSONResponse({"error": "Login-Auth-Token required"}, status_code=401)

    user_id = await _validate_login_token(login_auth_token, settings)
    if not user_id:
        return JSONResponse({"error": "Invalid or expired login token"}, status_code=401)

    # Associate user_id with the session in Redis
    redis = get_redis()
    session_key = f"session:{current_conversation_id}"
    session_raw = await redis.get(session_key)
    if session_raw is not None:
        import json as _json
        try:
            session_data = _json.loads(session_raw)
        except Exception:
            session_data = {}
        session_data["user_id"] = user_id
        await redis.set(session_key, _json.dumps(session_data), ex=CONVERSATION_TTL)

    return JSONResponse({
        "conversationId": current_conversation_id,
        "migrated": True,
        "userId": user_id,
    })


# ---------------------------------------------------------------------------
# A3 — CHAT-A-006: Send message (SSE streaming)
# ---------------------------------------------------------------------------

@router.post("/send-message-streamed")
async def send_message_streamed(
    body: ChatEventFromUser,
    request: Request,
    streaming_enabled: bool = Query(False, alias="streamingEnabled"),
    settings: Settings = Depends(get_settings),
) -> StreamingResponse:
    """
    Primary chat endpoint. Returns a Server-Sent Events stream.

    Phase 1 — immediate: connection_ack.
    Phase 2 — LangGraph pipeline runs; nodes emit SSE events via queue.
    Phase 3 — connection_close.

    Adapter selection is driven by BOT_ENV:
      mock  — canned responses, no API calls
      dev   — real Anthropic SLM/LLM + DevExecutor (contextual mock Housing data)
      local — real Anthropic + real Housing APIs (VPN required)
    """
    # 1. Auth check — X-Session-Token must be present
    session_token: str | None = request.headers.get("X-Session-Token")
    if not session_token:
        async def _unauth() -> AsyncGenerator[str, None]:
            yield sse_frame("error", {"code": "auth_expired", "message": "Missing session token.", "recoverable": False})
        return StreamingResponse(content=_unauth(), media_type="text/event-stream", status_code=401)

    # 2. LLM concurrency gate
    gate = getattr(getattr(request.app, "state", None), "llm_gate", None)
    if gate is not None:
        allowed = await gate.acquire()
        if not allowed:
            async def _rate_limited() -> AsyncGenerator[str, None]:
                yield sse_frame("error", {"code": "rate_limited", "message": "Too many concurrent requests.", "recoverable": True})
            return StreamingResponse(content=_rate_limited(), media_type="text/event-stream", status_code=429)

    # 3. Build request context
    ctx = structlog.contextvars.get_contextvars()
    request_id: str = ctx.get("request_id") or str(uuid.uuid4())
    conversation_id: str = body.conversation_id

    if body.message_type == "text":
        raw_message = body.content.text or ""
    elif body.message_type == "user_action":
        action = (body.content.data or {}).get("action", "")
        raw_message = f"user_action:{action}"
    else:
        raw_message = body.content.text or ""

    handoff = body.handoff_context.model_dump(by_alias=False) if body.handoff_context else None

    # Load existing session from Redis (returns {} on first turn → make_base_state uses defaults)
    from src.session.store import RedisSessionStore
    try:
        loaded_session = await RedisSessionStore(get_redis()).load(conversation_id)
    except Exception as exc:
        log.warning("session_load_failed_using_fresh", error=str(exc), conversation_id=conversation_id)
        loaded_session = {}

    state = make_base_state(
        raw_message=raw_message,
        session_id=conversation_id,
        session=loaded_session if loaded_session else None,
        request_id=request_id,
        handoff_context=handoff,
    )

    async def event_generator() -> AsyncGenerator[str, None]:
        # Phase 1 — immediate ack
        yield sse_frame("connection_ack", {"messageId": request_id, "messageState": "IN_PROGRESS"})

        # Build a queue so pipeline nodes can emit SSE events asynchronously
        queue: asyncio.Queue[str | None] = asyncio.Queue()

        def emit_sse(event: str, data: dict) -> None:
            queue.put_nowait(sse_frame(event, data))

        # Select adapters based on bot_env
        router_adapter, classifier_adapter, llm_adapter, executor = _build_adapters(settings, get_redis())
        graph = build_graph(
            emit_sse=emit_sse,
            executor=executor,
            router=router_adapter,
            classifier=classifier_adapter,
            llm=llm_adapter,
        )

        async def _run_pipeline() -> None:
            try:
                await graph.ainvoke(state)
            except Exception as exc:
                log.error("pipeline_error", error=str(exc), request_id=request_id)
                emit_sse("error", {"code": "pipeline_error", "message": "An internal error occurred.", "recoverable": False})
            finally:
                queue.put_nowait(None)  # sentinel — signals generator to stop

        asyncio.create_task(_run_pipeline())

        # Phase 2 — stream SSE frames from the pipeline as they arrive
        try:
            while True:
                frame = await asyncio.wait_for(queue.get(), timeout=90.0)
                if frame is None:
                    break
                yield frame
        except asyncio.TimeoutError:
            log.warning("pipeline_timeout", request_id=request_id)
            yield sse_frame("error", {"code": "timeout", "message": "Response timed out.", "recoverable": False})
        finally:
            if gate is not None:
                await gate.release()

        # Phase 3 — close
        yield sse_frame("connection_close", {"reason": "response_complete"})

    return StreamingResponse(content=event_generator(), media_type="text/event-stream")


# ---------------------------------------------------------------------------
# CHAT-A-024: Send message (non-streaming, synchronous)
# Handles silent Tier 1 user actions: shortlistProperty, removeFromShortlist
# ---------------------------------------------------------------------------

@router.post("/send-message")
async def send_message(
    body: ChatEventFromUser,
    request: Request,
    settings: Settings = Depends(get_settings),
) -> Response:
    """
    Non-streaming synchronous endpoint for silent user actions
    (responseRequired: false).  Returns a JSON confirmation once the
    pipeline has completed.

    Returns 429 with Retry-After: 3 if the LLM rate-limit gate rejects
    the request.
    """
    # 1. Check LLM gate if it is wired up on app.state (optional — skip if absent)
    llm_gate = getattr(getattr(request.app, "state", None), "llm_gate", None)
    if llm_gate is not None:
        allowed = await llm_gate.acquire()
        if not allowed:
            return Response(
                content='{"error": "rate_limited"}',
                status_code=429,
                headers={"Retry-After": "3"},
                media_type="application/json",
            )

    # 2. Resolve request_id
    ctx = structlog.contextvars.get_contextvars()
    request_id: str = ctx.get("request_id") or str(uuid.uuid4())

    # 3. Extract conversation_id and build raw_message
    conversation_id: str = body.conversation_id

    if body.message_type == "user_action":
        action = (body.content.data or {}).get("action", "")
        raw_message = f"user_action:{action}"
    elif body.message_type == "text":
        raw_message = body.content.text or ""
    else:
        raw_message = body.content.text or ""

    # 4. Load existing session + build BotState
    from src.session.store import RedisSessionStore
    try:
        loaded_session = await RedisSessionStore(get_redis()).load(conversation_id)
    except Exception:
        loaded_session = {}

    state = make_base_state(
        raw_message=raw_message,
        session_id=conversation_id,
        session=loaded_session if loaded_session else None,
        request_id=request_id,
    )

    # 5. Run the pipeline graph synchronously with a noop SSE emitter
    noop_emit = lambda *args, **kwargs: None  # silent — no SSE stream needed
    _, _, _, executor = _build_adapters(settings, get_redis())
    graph = build_graph(emit_sse=noop_emit, executor=executor)
    await graph.ainvoke(state)

    # 6. Return JSON confirmation
    message_id = str(uuid.uuid4())
    return JSONResponse(
        content={
            "statusCode": "2XX",
            "responseCode": "SUCCESS",
            "data": {
                "messageId": message_id,
                "messageState": "COMPLETED",
            },
        }
    )
