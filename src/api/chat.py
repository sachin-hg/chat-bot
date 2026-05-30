"""Chat endpoints — CHAT-A-007 (get-conversation-id), CHAT-A-006 (SSE streaming), CHAT-A-024 (send-message)."""
import uuid
from datetime import datetime
from typing import AsyncGenerator

import structlog.contextvars
from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse, Response, StreamingResponse

from src.api.models import (
    ChatEventFromUser,
    ChatEventToUser,
    MessageContent,
)
from src.api.sse import sse_frame
from src.pipeline.graph import build_graph
from src.pipeline.state import make_base_state
from src.session.redis import get_redis

router = APIRouter(prefix="/api/v1/chat")

# Redis key TTL for conversation IDs: 365 days
CONVERSATION_TTL = 365 * 24 * 3600


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
# A3 — CHAT-A-006: Send message (SSE streaming)
# ---------------------------------------------------------------------------

@router.post("/send-message-streamed")
async def send_message_streamed(
    body: ChatEventFromUser,
    request: Request,
    streaming_enabled: bool = Query(False, alias="streamingEnabled"),
) -> StreamingResponse:
    """
    Primary chat endpoint.  Returns a Server-Sent Events stream.

    Phase 1 — immediate: emit connection_ack.
    Phase 2 — pipeline (stubbed for Sprint 1): emit a canned chat_event.
    Phase 3 — close: emit connection_close.
    """
    # 1. Validate session token (stub: just check non-empty)
    session_token: str | None = request.headers.get("X-Session-Token")
    if not session_token:
        # Return a 401 SSE stream so the FE always gets a proper SSE response
        async def _unauth() -> AsyncGenerator[str, None]:
            yield sse_frame(
                "error",
                {
                    "code": "auth_expired",
                    "message": "Missing session token.",
                    "recoverable": False,
                },
            )
        return StreamingResponse(content=_unauth(), media_type="text/event-stream", status_code=401)

    # 2. Resolve request_id (set by request_id_middleware; fall back to new UUID)
    ctx = structlog.contextvars.get_contextvars()
    request_id: str = ctx.get("request_id") or str(uuid.uuid4())

    # 3. Extract conversation_id from body
    conversation_id: str = body.conversation_id

    # 4. Extract raw_message
    if body.message_type == "text":
        raw_message = body.content.text or ""
    elif body.message_type == "user_action":
        action = (body.content.data or {}).get("action", "")
        raw_message = f"user_action:{action}"
    else:
        raw_message = body.content.text or ""

    # 5. Build initial BotState
    state = make_base_state(
        request_id=request_id,
        session_id=conversation_id,
        raw_message=raw_message,
    )

    async def event_generator() -> AsyncGenerator[str, None]:
        # Phase 1 — connection_ack
        yield sse_frame(
            "connection_ack",
            {"messageId": request_id, "messageState": "IN_PROGRESS"},
        )

        # Phase 2 — TODO: invoke LangGraph pipeline (Sprint 1 stub)
        yield sse_frame(
            "chat_event",
            ChatEventToUser(
                conversation_id=conversation_id,
                message_id=str(uuid.uuid4()),
                source_message_id=request_id,
                message_type="text",
                message_state="COMPLETED",
                source_message_state="COMPLETED",
                created_at=datetime.utcnow().isoformat() + "Z",
                sequence_number=0,
                sender={"type": "bot"},
                content=MessageContent(
                    text="Pipeline not yet wired — Sprint 1 stub response."
                ),
            ).model_dump(by_alias=True),
        )

        # Phase 3 — connection_close
        yield sse_frame("connection_close", {"reason": "response_complete"})

    return StreamingResponse(
        content=event_generator(),
        media_type="text/event-stream",
    )


# ---------------------------------------------------------------------------
# CHAT-A-024: Send message (non-streaming, synchronous)
# Handles silent Tier 1 user actions: shortlistProperty, removeFromShortlist
# ---------------------------------------------------------------------------

@router.post("/send-message")
async def send_message(
    body: ChatEventFromUser,
    request: Request,
) -> Response:
    """
    Non-streaming synchronous endpoint for silent user actions
    (responseRequired: false).  Returns a JSON confirmation once the
    pipeline has completed.

    Returns 429 with Retry-After: 3 if the LLM rate-limit gate rejects
    the request.
    """
    # 1. Check LLM gate if it is wired up on app.state (optional — skip if absent)
    llm_gate = getattr(getattr(request, "app", None), "state", None)
    llm_gate = getattr(llm_gate, "llm_gate", None) if llm_gate is not None else None
    if llm_gate is not None:
        allowed = await llm_gate() if callable(llm_gate) else llm_gate
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

    # 4. Build initial BotState
    state = make_base_state(
        request_id=request_id,
        session_id=conversation_id,
        raw_message=raw_message,
    )

    # 5. Run the pipeline graph synchronously with a noop SSE emitter
    noop_emit = lambda *args, **kwargs: None  # silent — no SSE stream needed
    graph = build_graph(emit_sse=noop_emit)
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
