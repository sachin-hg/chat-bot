"""Conversation summarizer — async Haiku call off the critical path."""
from __future__ import annotations

import asyncio

from src.observability.logging import get_logger
from src.registries.model_registry import MODEL_REGISTRY
from src.session.store import RedisSessionStore

log = get_logger(__name__)

_SUMMARIZE_PROMPT = """You are summarizing a real estate conversation for context continuity.
Summarize the key facts from this conversation in under 250 tokens:
- What the user is looking for (BHK, city, budget, intent)
- Any properties or localities discussed
- Current session state (filters applied, clarifications made)
Be factual and concise. No preamble."""


async def summarize_conversation(session_id: str, redis_pool, llm_adapter=None) -> str | None:
    """Generate a summary for the conversation and store in Redis.

    Returns the summary string, or None if summarization fails or is skipped.
    Always non-fatal — pipeline must not be affected by summarizer failures.
    """
    store = RedisSessionStore(redis_pool)

    try:
        turns = await store.load_turns(session_id)
        if not turns:
            return None

        # Build a compact turn history string
        history_text = '\n'.join(
            f"{'User' if t.get('role') == 'user' else 'Bot'}: {str(t.get('content', ''))[:200]}"
            for t in turns[-20:]  # last 20 turns max
        )

        if llm_adapter is None:
            # No LLM adapter in test/stub mode — return a simple extractive summary
            session = await store.load(session_id)
            filters = session.get('active_filters', {})
            parts = []
            if filters.get('bhk'):
                parts.append(f"BHK: {filters['bhk']}")
            if filters.get('city'):
                parts.append(f"City: {filters['city']}")
            if filters.get('localities'):
                parts.append(f"Localities: {filters['localities']}")
            summary = 'User session: ' + ', '.join(parts) if parts else 'Real estate search session.'
        else:
            # Real Haiku call
            try:
                model_id = MODEL_REGISTRY['conversation_summarizer'].model_id
            except (KeyError, AttributeError):
                model_id = 'claude-haiku-4-5-20251001'

            chunks = []

            async def on_chunk(c):
                chunks.append(c)

            await asyncio.wait_for(
                llm_adapter.stream(
                    model=model_id,
                    system=_SUMMARIZE_PROMPT,
                    messages=[{'role': 'user', 'content': history_text}],
                    tools=[],
                    on_chunk=on_chunk,
                    on_tool_use=None,
                ),
                timeout=10.0,
            )
            summary = ''.join(chunks)[:1500]  # hard cap ~250 tokens

        if summary:
            await store.save_summary(session_id, summary)
            log.info('conversation_summary_saved', session_id=session_id, length=len(summary))

        return summary

    except Exception as exc:
        log.warn('conversation_summary_failed', session_id=session_id, error=str(exc))
        return None
