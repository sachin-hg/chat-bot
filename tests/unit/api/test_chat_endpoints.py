"""
CHAT-Q-DRY-010: Contract tests for chat API endpoints.

Covers:
  REQ-API-001  GET /api/v1/chat/get-conversation-id returns conversationId + tokenId
  REQ-API-002  isNew is True on first call (no prior Redis key)
  REQ-API-003  POST /api/v1/chat/send-message-streamed returns text/event-stream
  REQ-API-010  SSE error event shape has 'code' (str) and 'recoverable' (bool)
"""
from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient


def _make_mock_settings():
    """Return a MagicMock that satisfies Settings field accesses used by lifespan."""
    s = MagicMock()
    s.log_level = "INFO"
    s.bot_env = "local"
    s.redis_url = "redis://localhost:6379/0"
    s.kafka_bootstrap_servers = "localhost:9092"
    s.llm_max_concurrent = 5
    s.llm_queue_max = 10
    s.llm_queue_max_wait_ms = 500
    return s


# ---------------------------------------------------------------------------
# App fixture — mock out Redis, Kafka, DB and Settings before importing app
# so lifespan startup does not attempt real connections or validate env vars.
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def client():
    """TestClient with Redis/Kafka/DB/Settings patched out."""
    mock_settings = _make_mock_settings()
    with (
        patch("src.config.get_settings", return_value=mock_settings),
        patch("src.session.redis.get_pool"),
        patch("src.session.redis.init_redis", new=AsyncMock()),
        patch("src.session.redis.close_redis", new=AsyncMock()),
        patch("src.session.llm_gate.LLMConcurrencyGate"),
        patch("src.db.engine.get_engine"),
        patch("src.db.engine.close_engine", new=AsyncMock()),
        patch("src.kafka.producer.init_producer", new=AsyncMock()),
        patch("src.kafka.producer.stop_producer", new=AsyncMock()),
        patch("src.observability.logging.configure_logging"),
    ):
        # Clear lru_cache so the patched get_settings is actually used
        from src.config import get_settings
        get_settings.cache_clear()

        from src.main import app
        with TestClient(app, raise_server_exceptions=False) as c:
            yield c


# ---------------------------------------------------------------------------
# REQ-API-001 + REQ-API-002: get-conversation-id
# ---------------------------------------------------------------------------

class TestGetConversationId:
    """REQ-API-001/002: /api/v1/chat/get-conversation-id contract."""

    def test_get_conversation_id_returns_token_id(self, client: TestClient):
        """REQ-API-001: Response payload contains 'conversationId' and 'tokenId'."""
        mock_redis = AsyncMock()
        mock_redis.get = AsyncMock(return_value=None)      # no existing conversation
        mock_redis.set = AsyncMock(return_value=True)

        with patch("src.api.chat.get_redis", return_value=mock_redis):
            resp = client.get("/api/v1/chat/get-conversation-id")

        assert resp.status_code == 200
        body = resp.json()
        data = body["data"]
        assert "conversationId" in data, (
            "Response data must include 'conversationId'"
        )
        assert "tokenId" in data, (
            "Response data must include 'tokenId' when a new token is generated"
        )

    def test_get_conversation_id_is_new_true_on_first_call(self, client: TestClient):
        """REQ-API-002: isNew is True when no prior conversation exists in Redis."""
        mock_redis = AsyncMock()
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.set = AsyncMock(return_value=True)

        with patch("src.api.chat.get_redis", return_value=mock_redis):
            resp = client.get("/api/v1/chat/get-conversation-id")

        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["isNew"] is True, (
            f"isNew must be True for a brand-new token, got {data.get('isNew')!r}"
        )

    def test_get_conversation_id_is_new_false_for_existing(self, client: TestClient):
        """REQ-API-001 (complement): isNew is False when Redis has an existing conversation."""
        existing_conv = "conv-existing-abc"
        mock_redis = AsyncMock()
        mock_redis.get = AsyncMock(return_value=existing_conv)
        mock_redis.set = AsyncMock(return_value=True)

        with patch("src.api.chat.get_redis", return_value=mock_redis):
            resp = client.get(
                "/api/v1/chat/get-conversation-id",
                headers={"X-Token-ID": "token-already-known"},
            )

        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["isNew"] is False
        assert data["conversationId"] == existing_conv


# ---------------------------------------------------------------------------
# REQ-API-003: send-message-streamed → SSE content-type + connection_ack
# ---------------------------------------------------------------------------

class TestSendMessageStreamed:
    """REQ-API-003: POST /api/v1/chat/send-message-streamed SSE contract."""

    _VALID_BODY = {
        "conversationId": "conv-test-001",
        "sender": {"type": "user"},
        "messageType": "text",
        "content": {"text": "show me 2bhk in bandra"},
        "responseRequired": True,
    }

    def test_send_message_streamed_returns_sse_content_type(self, client: TestClient):
        """REQ-API-003: Response Content-Type must contain 'text/event-stream'."""
        resp = client.post(
            "/api/v1/chat/send-message-streamed",
            json=self._VALID_BODY,
            headers={"X-Session-Token": "sess-token-001"},
        )
        content_type = resp.headers.get("content-type", "")
        assert "text/event-stream" in content_type, (
            f"Expected text/event-stream content-type, got {content_type!r}"
        )

    def test_send_message_streamed_first_event_is_connection_ack(
        self, client: TestClient
    ):
        """REQ-API-003: First SSE event line must start with 'event: connection_ack'."""
        resp = client.post(
            "/api/v1/chat/send-message-streamed",
            json=self._VALID_BODY,
            headers={"X-Session-Token": "sess-token-001"},
        )
        # TestClient buffers the full streamed body as text
        raw = resp.text
        first_line = raw.strip().split("\n")[0]
        assert first_line.startswith("event: connection_ack"), (
            f"First SSE event must be 'event: connection_ack', got {first_line!r}"
        )

    def test_send_message_streamed_missing_token_returns_401(
        self, client: TestClient
    ):
        """REQ-API-003 (auth guard): Missing X-Session-Token must return 401."""
        resp = client.post(
            "/api/v1/chat/send-message-streamed",
            json=self._VALID_BODY,
            # No X-Session-Token header
        )
        assert resp.status_code == 401, (
            f"Missing session token must yield 401, got {resp.status_code}"
        )
        # Response should still be SSE
        assert "text/event-stream" in resp.headers.get("content-type", "")


# ---------------------------------------------------------------------------
# REQ-API-010: SSE error event shape — ErrorEvent model contract
# ---------------------------------------------------------------------------

class TestErrorEventShape:
    """REQ-API-010: ErrorEvent must have 'code' (str) and 'recoverable' (bool)."""

    def test_error_event_model_has_code_and_recoverable(self):
        """REQ-API-010: src.api.models.ErrorEvent exposes 'code' (str) and 'recoverable' (bool)."""
        from src.api.models import ErrorEvent

        # Model-level field existence check
        fields = ErrorEvent.model_fields
        assert "code" in fields, "ErrorEvent must have a 'code' field"
        assert "recoverable" in fields, "ErrorEvent must have a 'recoverable' field"

        # Instantiation check
        ev = ErrorEvent(code="auth_expired", message="session gone", recoverable=False)
        assert isinstance(ev.code, str)
        assert isinstance(ev.recoverable, bool)

    def test_error_sse_frame_parses_to_valid_shape(self, client: TestClient):
        """REQ-API-010: The auth-error SSE payload deserialises to a valid ErrorEvent."""
        from src.api.models import ErrorEvent

        resp = client.post(
            "/api/v1/chat/send-message-streamed",
            json={
                "conversationId": "conv-test-001",
                "sender": {"type": "user"},
                "messageType": "text",
                "content": {"text": "hi"},
                "responseRequired": True,
            },
            # No session token — triggers the error path
        )
        raw = resp.text
        # Find the 'data:' line in the SSE frame
        data_line = next(
            (ln for ln in raw.split("\n") if ln.startswith("data:")), None
        )
        assert data_line is not None, "SSE error response must contain a 'data:' line"
        payload = json.loads(data_line[len("data:"):].strip())
        assert "code" in payload, f"Error payload must have 'code', got {payload}"
        assert "recoverable" in payload, (
            f"Error payload must have 'recoverable', got {payload}"
        )
        assert isinstance(payload["code"], str)
        assert isinstance(payload["recoverable"], bool)

        # Validate against model
        ev = ErrorEvent(**payload)
        assert ev.code == "auth_expired"
        assert ev.recoverable is False
