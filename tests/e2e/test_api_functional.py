"""
E2E functional tests for the Housing.com chatbot API.

All infrastructure (Redis, Kafka, DB) is mocked out; requests are issued
via FastAPI TestClient so they travel through the full ASGI middleware stack.
"""
from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def parse_sse_events(response_text: str) -> list[dict]:
    """Parse SSE response text into a list of {event_type, data} dicts."""
    events = []
    current: dict = {}
    for line in response_text.splitlines():
        if line.startswith("event:"):
            current["event_type"] = line.split(":", 1)[1].strip()
        elif line.startswith("data:"):
            raw = line.split(":", 1)[1].strip()
            try:
                current["data"] = json.loads(raw)
            except json.JSONDecodeError:
                current["data"] = raw
        elif line == "" and current:
            events.append(current)
            current = {}
    # Capture a trailing event that was not followed by a blank line
    if current:
        events.append(current)
    return events


def _make_mock_settings():
    s = MagicMock()
    s.log_level = "INFO"
    s.bot_env = "local"
    s.redis_url = "redis://localhost:6379/0"
    s.kafka_bootstrap_servers = "localhost:9092"
    s.llm_max_concurrent = 5
    s.llm_queue_max = 10
    s.llm_queue_max_wait_ms = 500
    s.login_service_url = ""
    s.secret_key = MagicMock(get_secret_value=lambda: "test-secret")
    return s


# ---------------------------------------------------------------------------
# Shared fixture
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def client():
    """TestClient with Redis/Kafka/DB mocked out."""
    mock_settings = _make_mock_settings()

    # Mock Redis client returned by get_redis()
    mock_redis_client = AsyncMock()
    mock_redis_client.ping = AsyncMock(return_value=True)
    mock_redis_client.get = AsyncMock(return_value=None)
    mock_redis_client.set = AsyncMock(return_value=True)

    # Mock DB engine — MagicMock so async-context-manager protocol works
    mock_conn = MagicMock()
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=False)
    mock_conn.execute = AsyncMock()
    mock_engine = MagicMock()
    mock_engine.connect = MagicMock(return_value=mock_conn)

    # LLM gate: class returns an AsyncMock instance so `await gate()` works
    gate_instance = AsyncMock(return_value=True)
    gate_class = MagicMock(return_value=gate_instance)

    with (
        patch("src.config.get_settings", return_value=mock_settings),
        patch("src.session.redis.get_pool"),
        patch("src.session.redis.init_redis", new=AsyncMock()),
        patch("src.session.redis.close_redis", new=AsyncMock()),
        patch("src.session.redis.get_redis", return_value=mock_redis_client),
        patch("src.api.chat.get_redis", return_value=mock_redis_client),
        patch("src.api.health.get_redis", return_value=mock_redis_client),
        patch("src.api.health.get_engine", return_value=mock_engine),
        patch("src.session.llm_gate.LLMConcurrencyGate", gate_class),
        patch("src.db.engine.get_engine", return_value=mock_engine),
        patch("src.db.engine.close_engine", new=AsyncMock()),
        patch("src.kafka.producer.init_producer", new=AsyncMock()),
        patch("src.kafka.producer.stop_producer", new=AsyncMock()),
        patch("src.observability.logging.configure_logging"),
    ):
        from src.config import get_settings
        get_settings.cache_clear()

        from src.main import app

        # Override the Depends(get_settings) injection so FastAPI does not
        # introspect the MagicMock's *args/**kwargs signature.
        app.dependency_overrides[get_settings] = lambda: mock_settings

        with TestClient(app, raise_server_exceptions=False) as c:
            yield c

        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Valid body for ChatEventFromUser (matches actual model fields)
# ---------------------------------------------------------------------------

_VALID_CHAT_BODY = {
    "conversationId": "test-conv-id",
    "sender": {"type": "user"},
    "messageType": "text",
    "content": {"text": "hello"},
    "responseRequired": True,
}

_SESSION_HEADERS = {"X-Session-Token": "sess-token-e2e-001"}


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------

class TestHealthEndpoint:
    def test_health_endpoint_returns_ok(self, client: TestClient):
        """GET /health → 200 with status field present."""
        resp = client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert "status" in body


# ---------------------------------------------------------------------------
# get-conversation-id
# ---------------------------------------------------------------------------

class TestGetConversationId:
    def test_get_conversation_id_returns_expected_shape(self, client: TestClient):
        """GET /api/v1/chat/get-conversation-id → 200 with conversationId, tokenId, isNew."""
        mock_redis = AsyncMock()
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.set = AsyncMock(return_value=True)

        with patch("src.api.chat.get_redis", return_value=mock_redis):
            resp = client.get("/api/v1/chat/get-conversation-id")

        assert resp.status_code == 200
        data = resp.json()["data"]
        assert "conversationId" in data
        assert "tokenId" in data
        assert "isNew" in data

    def test_get_conversation_id_returns_new_true_first_visit(self, client: TestClient):
        """No X-Token-ID header → isNew=True (fresh visitor)."""
        mock_redis = AsyncMock()
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.set = AsyncMock(return_value=True)

        with patch("src.api.chat.get_redis", return_value=mock_redis):
            resp = client.get("/api/v1/chat/get-conversation-id")
            # No X-Token-ID header supplied

        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["isNew"] is True


# ---------------------------------------------------------------------------
# send-message-streamed (SSE)
# ---------------------------------------------------------------------------

class TestSendMessageStreamed:
    def test_send_message_streamed_returns_sse_content_type(self, client: TestClient):
        """POST /api/v1/chat/send-message-streamed → Content-Type: text/event-stream."""
        resp = client.post(
            "/api/v1/chat/send-message-streamed",
            json=_VALID_CHAT_BODY,
            headers=_SESSION_HEADERS,
        )
        content_type = resp.headers.get("content-type", "")
        assert "text/event-stream" in content_type

    def test_send_message_streamed_first_event_is_connection_ack(self, client: TestClient):
        """First SSE event line must be 'event: connection_ack'."""
        resp = client.post(
            "/api/v1/chat/send-message-streamed",
            json=_VALID_CHAT_BODY,
            headers=_SESSION_HEADERS,
        )
        raw = resp.text
        first_line = raw.strip().split("\n")[0]
        assert first_line.startswith("event: connection_ack"), (
            f"Expected first SSE event to be connection_ack, got: {first_line!r}"
        )

    def test_send_message_streamed_body_shape(self, client: TestClient):
        """POST with full valid body → 200 response."""
        body = {
            "conversationId": "test-id",
            "content": {"text": "hello"},
            "messageType": "text",
            "sender": {"type": "user"},
            "responseRequired": True,
        }
        resp = client.post(
            "/api/v1/chat/send-message-streamed",
            json=body,
            headers=_SESSION_HEADERS,
        )
        assert resp.status_code == 200

    def test_send_message_missing_body_returns_422(self, client: TestClient):
        """POST with no body → 422 validation error."""
        resp = client.post(
            "/api/v1/chat/send-message-streamed",
            headers=_SESSION_HEADERS,
        )
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# send-message (non-streaming)
# ---------------------------------------------------------------------------

class TestSendMessageNonStreaming:
    def test_send_message_non_streaming_returns_json(self, client: TestClient):
        """POST /api/v1/chat/send-message → JSON with statusCode and data.messageId."""
        mock_graph = MagicMock()
        mock_graph.ainvoke = AsyncMock(return_value={})

        # Patch at the chat module level where the name is resolved at call time
        with patch("src.api.chat.build_graph", return_value=mock_graph):
            resp = client.post(
                "/api/v1/chat/send-message",
                json=_VALID_CHAT_BODY,
            )

        assert resp.status_code == 200
        body = resp.json()
        assert "statusCode" in body
        assert "messageId" in body.get("data", {})


# ---------------------------------------------------------------------------
# migrate-chat auth guard
# ---------------------------------------------------------------------------

class TestMigrateChat:
    def test_migrate_chat_requires_login_token(self, client: TestClient):
        """POST /api/v1/chat/migrate-chat without Login-Auth-Token → 401."""
        resp = client.post(
            "/api/v1/chat/migrate-chat",
            params={"currentConversationId": "some-conv-id"},
            # No Login-Auth-Token header
        )
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Generic HTTP contract tests
# ---------------------------------------------------------------------------

class TestGenericHttpContracts:
    def test_unknown_endpoint_returns_404(self, client: TestClient):
        """GET /api/v1/chat/nonexistent → 404."""
        resp = client.get("/api/v1/chat/nonexistent")
        assert resp.status_code == 404

    def test_send_message_missing_body_returns_422(self, client: TestClient):
        """POST /api/v1/chat/send-message with no body → 422."""
        resp = client.post("/api/v1/chat/send-message")
        assert resp.status_code == 422
