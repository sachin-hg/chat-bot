"""
Redis-backed session store with optimistic locking.

Key patterns (from docs/operations/db-schema.md Section 3):
  session:{session_id}            → JSON string, TTL 24h
  conv:context:{conversation_id}  → JSON string, TTL 24h
  conv:turns:{conversation_id}    → Redis list, LPUSH + LTRIM(0,19), TTL 7d
  conv:summary:{conversation_id}  → string, TTL 7d
"""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional
from typing import Protocol, runtime_checkable

from src.observability.logging import get_logger

log = get_logger(__name__)

# ---------------------------------------------------------------------------
# Redis key templates
# ---------------------------------------------------------------------------

_SESSION_KEY  = "session:{session_id}"           # TTL 24h
_CONTEXT_KEY  = "conv:context:{conversation_id}" # TTL 24h
_TURNS_KEY    = "conv:turns:{conversation_id}"   # TTL 7d (list, max 20)
_SUMMARY_KEY  = "conv:summary:{conversation_id}" # TTL 7d

# Legacy aliases kept for backwards compatibility
SESSION_TTL  = 86_400    # 24h
TURNS_TTL    = 604_800   # 7d
SUMMARY_TTL  = 604_800   # 7d
MAX_TURNS    = 20

_SESSION_TTL  = SESSION_TTL
_HISTORY_TTL  = TURNS_TTL
_MAX_TURNS    = MAX_TURNS

# ---------------------------------------------------------------------------
# Lua script for atomic optimistic locking.
# Compares expected_version against stored version; updates only if they match.
# Returns 1 on success, 0 on version conflict.
# ---------------------------------------------------------------------------

_SAVE_SCRIPT = """
local key = KEYS[1]
local expected = tonumber(ARGV[1])
local new_value = ARGV[2]
local ttl = tonumber(ARGV[3])

local current = redis.call('GET', key)
local current_version = 0
if current then
    local ok, data = pcall(cjson.decode, current)
    if ok and data and data.version then
        current_version = tonumber(data.version)
    end
end

if current_version ~= expected then
    return 0
end

redis.call('SETEX', key, ttl, new_value)
return 1
"""


# ---------------------------------------------------------------------------
# SessionStorePort protocol
# ---------------------------------------------------------------------------

@runtime_checkable
class SessionStorePort(Protocol):
    async def load(self, session_id: str) -> Dict: ...
    async def save(self, session_id: str, state: Dict, expected_version: int) -> bool: ...

    # Conversation turn history
    async def load_turns(self, conversation_id: str) -> List[Dict]: ...
    async def push_turn(self, conversation_id: str, turn: Dict) -> None: ...

    # Legacy aliases (kept for backward compatibility)
    async def append_turn(self, conversation_id: str, turn: Dict) -> int: ...
    async def get_turns(self, conversation_id: str, last_n: int) -> List[Dict]: ...

    # Conversation summary (rolling LLM-generated summary of older turns)
    async def load_summary(self, conversation_id: str) -> Optional[str]: ...
    async def save_summary(self, conversation_id: str, summary: str) -> None: ...
    async def get_summary(self, conversation_id: str) -> Optional[str]: ...


# ---------------------------------------------------------------------------
# RedisSessionStore
# ---------------------------------------------------------------------------

class RedisSessionStore:
    """Redis-backed session store with Lua-based optimistic locking."""

    def __init__(self, redis_pool=None):
        """Accept an injected redis pool/client, or fall back to get_redis()."""
        self._redis_pool = redis_pool

    def _get_redis(self):
        if self._redis_pool is not None:
            return self._redis_pool
        from src.session.redis import get_redis
        return get_redis()

    # ------------------------------------------------------------------
    # Session load / save
    # ------------------------------------------------------------------

    async def load(self, session_id: str) -> Dict:
        """Load session state. Returns empty dict (not None) on cache miss."""
        r = self._get_redis()
        key = _SESSION_KEY.format(session_id=session_id)
        raw = await r.get(key)
        if not raw:
            return {}
        try:
            data = json.loads(raw)
            log.debug("session_loaded", session_id=session_id)
            return data
        except (json.JSONDecodeError, TypeError):
            log.warn("session_load_decode_error", session_id=session_id)
            return {}

    async def save(self, session_id: str, state: Dict, expected_version: int) -> bool:
        """Persist session state with atomic optimistic locking via Lua.

        Returns False on version conflict (caller should reload and retry).
        The stored document gets version = expected_version + 1.
        """
        r = self._get_redis()
        key = _SESSION_KEY.format(session_id=session_id)
        new_state = {**state, "version": expected_version + 1}
        new_value = json.dumps(new_state)
        result = await r.eval(
            _SAVE_SCRIPT, 1, key,
            expected_version, new_value, _SESSION_TTL,
        )
        if result == 0:
            log.warn(
                "session_version_conflict",
                session_id=session_id,
                expected=expected_version,
            )
            return False
        log.debug("session_saved", session_id=session_id, version=expected_version + 1)
        return True

    # ------------------------------------------------------------------
    # Turn history
    # ------------------------------------------------------------------

    async def load_turns(self, conversation_id: str) -> List[Dict]:
        """Load last MAX_TURNS turns (LRANGE 0 MAX_TURNS-1), newest first."""
        r = self._get_redis()
        key = _TURNS_KEY.format(conversation_id=conversation_id)
        raw_turns = await r.lrange(key, 0, _MAX_TURNS - 1)
        turns: List[Dict] = []
        for raw in (raw_turns or []):
            try:
                turns.append(json.loads(raw))
            except (json.JSONDecodeError, TypeError):
                pass
        return turns

    async def push_turn(self, conversation_id: str, turn: Dict) -> None:
        """Prepend turn to history list (newest first) and trim to MAX_TURNS."""
        r = self._get_redis()
        key = _TURNS_KEY.format(conversation_id=conversation_id)
        pipe = r.pipeline()
        pipe.lpush(key, json.dumps(turn))
        pipe.ltrim(key, 0, _MAX_TURNS - 1)
        pipe.expire(key, _HISTORY_TTL)
        await pipe.execute()

    # ------------------------------------------------------------------
    # Legacy method aliases for backward compatibility
    # ------------------------------------------------------------------

    async def append_turn(self, conversation_id: str, turn: Dict) -> int:
        """Legacy alias for push_turn; returns the new list length (capped at MAX_TURNS)."""
        r = self._get_redis()
        key = _TURNS_KEY.format(conversation_id=conversation_id)
        length = await r.lpush(key, json.dumps(turn))
        await r.ltrim(key, 0, _MAX_TURNS - 1)
        await r.expire(key, TURNS_TTL)
        return min(length, _MAX_TURNS)

    async def get_turns(self, conversation_id: str, last_n: int) -> List[Dict]:
        """Legacy alias: load up to last_n turns in chronological order."""
        r = self._get_redis()
        key = _TURNS_KEY.format(conversation_id=conversation_id)
        n = min(last_n, _MAX_TURNS)
        raws = await r.lrange(key, 0, n - 1)
        # lrange returns newest-first (LPUSH order); reverse for chronological
        return [json.loads(raw) for raw in reversed(raws)]

    # ------------------------------------------------------------------
    # Conversation summary
    # ------------------------------------------------------------------

    async def load_summary(self, conversation_id: str) -> Optional[str]:
        """Load rolling LLM-generated conversation summary, or None."""
        r = self._get_redis()
        key = _SUMMARY_KEY.format(conversation_id=conversation_id)
        return await r.get(key)

    async def get_summary(self, conversation_id: str) -> Optional[str]:
        """Legacy alias for load_summary."""
        return await self.load_summary(conversation_id)

    async def save_summary(self, conversation_id: str, summary: str) -> None:
        """Persist rolling conversation summary."""
        r = self._get_redis()
        key = _SUMMARY_KEY.format(conversation_id=conversation_id)
        await r.setex(key, _HISTORY_TTL, summary)
        log.debug("summary_saved", conversation_id=conversation_id)
