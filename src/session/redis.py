import asyncio
from typing import Optional

import redis.asyncio as aioredis
from redis.asyncio import ConnectionPool, Redis

from src.config import get_settings
from src.observability.logging import get_logger

log = get_logger(__name__)

_pool: Optional[ConnectionPool] = None


def get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        settings = get_settings()
        _pool = ConnectionPool.from_url(
            settings.redis_url,
            max_connections=20,
            decode_responses=True,
        )
    return _pool


def get_redis() -> Redis:
    return aioredis.Redis(connection_pool=get_pool())


async def init_redis(retries: int = 3) -> None:
    """Ping Redis on startup; retry with backoff. Does not raise if unavailable."""
    r = get_redis()
    for attempt in range(1, retries + 1):
        try:
            await r.ping()
            log.info("redis_connected")
            return
        except Exception as exc:
            wait = 2 ** attempt
            log.warning("redis_unavailable", attempt=attempt, error=str(exc), retry_in_s=wait)
            if attempt < retries:
                await asyncio.sleep(wait)
    log.error("redis_startup_failed", retries=retries)


async def close_redis() -> None:
    global _pool
    if _pool is not None:
        await _pool.aclose()
        _pool = None
