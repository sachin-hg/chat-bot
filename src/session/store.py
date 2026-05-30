"""
Redis-backed session store.
Key patterns (from docs/operations/db-schema.md Section 3):
  session:{session_id}            → JSON string, TTL 24h
  conv:turns:{conversation_id}    → Redis list, LPUSH + LTRIM(0,19), TTL 7d
  conv:summary:{conversation_id}  → string, TTL 7d
"""
import json
from typing import Any, Dict, List, Optional
from typing import Protocol, runtime_checkable

from src.observability.logging import get_logger
from src.session.redis import get_redis

log = get_logger(__name__)

SESSION_TTL  = 86_400    # 24h
TURNS_TTL    = 604_800   # 7d
SUMMARY_TTL  = 604_800   # 7d
MAX_TURNS    = 20


@runtime_checkable
class SessionStorePort(Protocol):
    async def load(self, session_id: str) -> Dict: ...
    async def save(self, session_id: str, state: Dict, expected_version: int) -> bool: ...

    # Conversation turn history
    async def append_turn(self, conversation_id: str, turn: Dict) -> int: ...
    async def get_turns(self, conversation_id: str, last_n: int) -> List[Dict]: ...

    # Conversation summary (rolling LLM-generated summary of older turns)
    async def get_summary(self, conversation_id: str) -> Optional[str]: ...
    async def save_summary(self, conversation_id: str, summary: str) -> None: ...


class RedisSessionStore:
    """Implements SessionStorePort using Redis."""

    async def load(self, session_id: str) -> Dict:
        r = get_redis()
        raw = await r.get(f"session:{session_id}")
        if not raw:
            return {}
        data = json.loads(raw)
        log.debug("session_loaded", session_id=session_id)
        return data

    async def save(self, session_id: str, state: Dict, expected_version: int) -> bool:
        """Optimistic-lock save. Returns False if version mismatch (concurrent write)."""
        r = get_redis()
        key = f"session:{session_id}"

        # Simple version check: read current, compare, then write.
        # For production use a Lua script for atomicity.
        current = await r.get(key)
        if current:
            current_data = json.loads(current)
            if current_data.get("_version", 0) != expected_version:
                log.warning("session_version_conflict", session_id=session_id)
                return False

        state["_version"] = expected_version + 1
        await r.set(key, json.dumps(state), ex=SESSION_TTL)
        log.debug("session_saved", session_id=session_id)
        return True

    async def append_turn(self, conversation_id: str, turn: Dict) -> int:
        r = get_redis()
        key = f"conv:turns:{conversation_id}"
        # LPUSH prepends (most-recent first), then LTRIM to MAX_TURNS
        length = await r.lpush(key, json.dumps(turn))
        await r.ltrim(key, 0, MAX_TURNS - 1)
        await r.expire(key, TURNS_TTL)
        return min(length, MAX_TURNS)

    async def get_turns(self, conversation_id: str, last_n: int) -> List[Dict]:
        r = get_redis()
        key = f"conv:turns:{conversation_id}"
        n = min(last_n, MAX_TURNS)
        raws = await r.lrange(key, 0, n - 1)
        # lrange returns most-recent first (LPUSH order); reverse for chronological
        return [json.loads(raw) for raw in reversed(raws)]

    async def get_summary(self, conversation_id: str) -> Optional[str]:
        r = get_redis()
        raw = await r.get(f"conv:summary:{conversation_id}")
        return raw if raw else None

    async def save_summary(self, conversation_id: str, summary: str) -> None:
        r = get_redis()
        await r.set(f"conv:summary:{conversation_id}", summary, ex=SUMMARY_TTL)
        log.debug("summary_saved", conversation_id=conversation_id)
