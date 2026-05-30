"""CachedExecutorPort — base async HTTP tool executor with Redis caching, retry, circuit breaker."""
from __future__ import annotations

import asyncio
import hashlib
import json
from typing import Any, Protocol

import httpx

from src.observability.logging import get_logger
from src.registries.tool_registry import get_tool

log = get_logger(__name__)

# Default timeouts per tool (ms). TOOL_REGISTRY.timeout_ms overrides these.
TOOL_DEFAULT_TIMEOUTS: dict[str, int] = {
    'searchProperties':     2000,
    'getPropertyDetail':    2000,
    'resolveEntity':        500,
    'getLocalityDetail':    2000,
    'getProjectDetail':     2000,
    'getNearbyLandmarks':   3000,
    'getTrendingLocalities': 2000,
    'getPriceTrends':       2000,
}


class CachedExecutorPort(Protocol):
    async def execute(self, tool: str, params: dict, ttl: int) -> Any: ...
    async def invalidate_cache(self, tool: str, session_id: str) -> None: ...


def _hash_params(params: dict) -> str:
    return hashlib.md5(json.dumps(params, sort_keys=True).encode()).hexdigest()[:16]


def get_tool_cache_ttl(tool_name: str) -> int:
    """Returns cache TTL in seconds from TOOL_REGISTRY, or 0 (no cache) if not found."""
    record = get_tool(tool_name)
    return record.cache_ttl_seconds if record else 0


class CircuitBreaker:
    """Simple 3-failure circuit breaker per tool."""
    def __init__(self, threshold: int = 3):
        self._failures: dict[str, int] = {}
        self._open: set[str] = set()
        self._threshold = threshold

    def is_open(self, tool: str) -> bool:
        return tool in self._open

    def record_failure(self, tool: str) -> None:
        self._failures[tool] = self._failures.get(tool, 0) + 1
        if self._failures[tool] >= self._threshold:
            self._open.add(tool)
            log.warning('circuit_open', tool=tool, failures=self._failures[tool])

    def record_success(self, tool: str) -> None:
        self._failures.pop(tool, None)
        self._open.discard(tool)


class HttpToolExecutor:
    """Base class for all tool executors. Handles: Redis caching, timeout, retry (1x on 503/timeout), circuit breaker."""

    _circuit = CircuitBreaker()

    def __init__(self, redis_pool, http_client: httpx.AsyncClient | None = None):
        self._redis = redis_pool
        self._http  = http_client or httpx.AsyncClient(timeout=10.0)

    async def execute(self, tool: str, params: dict, ttl: int) -> Any:
        if self._circuit.is_open(tool):
            log.warning('circuit_breaker_open_returning_stub', tool=tool)
            return {}

        cache_key = f'cache:tool:{tool}:{_hash_params(params)}'

        # Cache read
        if ttl > 0 and self._redis:
            try:
                cached = await self._redis.get(cache_key)
                if cached:
                    return json.loads(cached)
            except Exception:
                pass

        # Execute with retry
        result = await self._call_with_retry(tool, params)

        # Cache write
        if ttl > 0 and self._redis and result:
            try:
                await self._redis.setex(cache_key, ttl, json.dumps(result))
            except Exception:
                pass

        return result

    async def _call_with_retry(self, tool: str, params: dict) -> Any:
        timeout_ms = TOOL_DEFAULT_TIMEOUTS.get(tool, 2000)
        record = get_tool(tool)
        if record and hasattr(record, 'timeout_ms') and record.timeout_ms:
            timeout_ms = record.timeout_ms
        timeout_s = timeout_ms / 1000.0

        for attempt in range(2):   # 1 retry on 503/timeout
            try:
                result = await asyncio.wait_for(self.call(tool, params), timeout=timeout_s)
                self._circuit.record_success(tool)
                return result
            except (asyncio.TimeoutError, httpx.TimeoutException) as exc:
                if attempt == 0:
                    log.warning('tool_timeout_retrying', tool=tool, attempt=attempt)
                    continue
                self._circuit.record_failure(tool)
                raise
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code == 503 and attempt == 0:
                    log.warning('tool_503_retrying', tool=tool)
                    continue
                if 400 <= exc.response.status_code < 500:
                    raise   # 4xx: fail immediately, no retry
                self._circuit.record_failure(tool)
                raise
        return {}

    async def call(self, tool: str, params: dict) -> Any:
        """Override in subclasses to make the actual HTTP call."""
        raise NotImplementedError(f'HttpToolExecutor.call() not implemented for tool: {tool}')

    async def invalidate_cache(self, tool: str, session_id: str) -> None:
        """Invalidate all cache entries for a tool+session combination."""
        if self._redis:
            pattern = f'cache:tool:{tool}:*'
            keys = await self._redis.keys(pattern)
            if keys:
                await self._redis.delete(*keys)
            log.info('cache_invalidated', tool=tool, session_id=session_id, keys_deleted=len(keys or []))
