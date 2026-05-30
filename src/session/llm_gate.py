"""LLM concurrency gate — Redis-backed token bucket + queue."""
from __future__ import annotations

import asyncio
import uuid

from src.observability.logging import get_logger

log = get_logger(__name__)

_ACQUIRE_SCRIPT = """
local count = tonumber(redis.call('GET', KEYS[1]) or '0')
local max   = tonumber(ARGV[1])
if count < max then
    redis.call('INCR', KEYS[1])
    return 1
end
local qlen = redis.call('LLEN', KEYS[2])
if qlen >= tonumber(ARGV[2]) then
    return -1
end
redis.call('RPUSH', KEYS[2], ARGV[3])
return 0
"""


class LLMConcurrencyGate:
    def __init__(
        self,
        redis_pool,
        max_concurrent: int = 20,
        queue_max: int = 50,
        queue_wait_ms: int = 8000,
    ):
        self._redis = redis_pool
        self._max = max_concurrent
        self._qmax = queue_max
        self._wait = queue_wait_ms / 1000.0
        self._count_key = "llm:concurrent:count"
        self._queue_key = "llm:queue"

    async def acquire(self) -> bool:
        """Returns True if slot acquired, False if rate-limited."""
        ticket = str(uuid.uuid4())
        result = await self._redis.eval(
            _ACQUIRE_SCRIPT,
            2,
            self._count_key,
            self._queue_key,
            self._max,
            self._qmax,
            ticket,
        )
        if result == 1:
            return True
        if result == -1:
            log.warning("llm_rate_limited_queue_full")
            return False
        # result == 0 → queued; wait for slot via BLPOP
        try:
            popped = await asyncio.wait_for(
                self._redis.blpop(self._queue_key, timeout=int(self._wait)),
                timeout=self._wait + 1,
            )
            if popped:
                await self._redis.incr(self._count_key)
                return True
            log.warning("llm_queue_wait_timeout")
            return False
        except asyncio.TimeoutError:
            log.warning("llm_queue_wait_timeout")
            return False

    async def release(self) -> None:
        await self._redis.decr(self._count_key)
        log.info("llm_slot_released")
