"""Sprint 0 smoke test: health endpoint returns 200 when services are available."""
import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, patch


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_health_ok():
    with patch("src.api.health.get_redis") as mock_redis, \
         patch("src.api.health.get_engine") as mock_engine:
        mock_redis.return_value.ping = AsyncMock(return_value=True)
        mock_conn = AsyncMock()
        mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_conn.__aexit__ = AsyncMock(return_value=None)
        mock_conn.execute = AsyncMock()
        mock_engine.return_value.connect.return_value = mock_conn

        from src.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/health")

    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["redis"] == "ok"
    assert body["postgres"] == "ok"


@pytest.mark.anyio
async def test_health_degraded_when_redis_down():
    with patch("src.api.health.get_redis") as mock_redis, \
         patch("src.api.health.get_engine") as mock_engine:
        mock_redis.return_value.ping = AsyncMock(side_effect=Exception("connection refused"))
        mock_conn = AsyncMock()
        mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_conn.__aexit__ = AsyncMock(return_value=None)
        mock_conn.execute = AsyncMock()
        mock_engine.return_value.connect.return_value = mock_conn

        from src.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/health")

    assert resp.status_code == 503
    assert resp.json()["status"] == "degraded"
    assert resp.json()["redis"] == "unavailable"
