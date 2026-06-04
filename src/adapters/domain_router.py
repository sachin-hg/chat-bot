"""AnthropicDomainRouter — Stage 1 SLM adapter implementing DomainRouterPort."""
from __future__ import annotations

import asyncio
import json
import time
from pathlib import Path
from typing import Optional

import anthropic

from src.observability.logging import get_logger
from src.registries.model_registry import get_model_id

log = get_logger(__name__)

# Load static prompt once at module import time (always cache-warm after first request).
_PROMPT_PATH = Path(__file__).parent.parent.parent / "prompts" / "slm" / "domain_router.md"
_SYSTEM_PROMPT: str = _PROMPT_PATH.read_text(encoding="utf-8")

def _strip_code_fence(text: str) -> str:
    """Strip markdown code fences the model sometimes adds despite instructions."""
    if not text.startswith("```"):
        return text
    lines = text.split("\n")
    start = 1  # skip ```json or ``` line
    end = len(lines) - 1 if lines[-1].strip() == "```" else len(lines)
    return "\n".join(lines[start:end]).strip()


# Shared client — single connection pool across all calls.
_client: Optional[anthropic.AsyncAnthropic] = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic()
    return _client


class AnthropicDomainRouter:
    """Stage 1 domain router.

    Implements DomainRouterPort:
        async def route(self, input: dict) -> dict
            input:  { message, previous_domain, last_intent }
            output: { domain: str, confidence: float }

    Timeout:  500 ms (asyncio.wait_for)
    Retries:  1 retry on 5xx or timeout
    Fallback: { domain: last_domain or 'out_of_scope', confidence: 0.0 }
    """

    def __init__(self) -> None:
        self._model_id: str = get_model_id("domain_router")

    async def route(self, input: dict) -> dict:
        message: str = input.get("message", "")
        previous_domain: Optional[str] = input.get("previous_domain")
        last_intent: Optional[str] = input.get("last_intent")

        user_content = self._build_user_content(message, previous_domain, last_intent)
        fallback_domain = previous_domain or "out_of_scope"

        last_exc: Optional[Exception] = None
        # 1 initial attempt + 1 retry = 2 total attempts
        for attempt in range(2):
            t0 = time.monotonic()
            try:
                result = await asyncio.wait_for(
                    self._call_api(user_content),
                    timeout=2.0,
                )
                latency_ms = int((time.monotonic() - t0) * 1000)
                log.info(
                    "domain_routing",
                    domain=result.get("domain"),
                    confidence=result.get("confidence"),
                    latency_ms=latency_ms,
                    model=self._model_id,
                    previous_domain=previous_domain,
                    attempt=attempt,
                )
                return result
            except asyncio.TimeoutError as exc:
                latency_ms = int((time.monotonic() - t0) * 1000)
                log.warning(
                    "domain_router_timeout",
                    attempt=attempt,
                    latency_ms=latency_ms,
                    model=self._model_id,
                )
                last_exc = exc
            except anthropic.APIStatusError as exc:
                latency_ms = int((time.monotonic() - t0) * 1000)
                if exc.status_code >= 500:
                    log.warning(
                        "domain_router_5xx",
                        status_code=exc.status_code,
                        attempt=attempt,
                        latency_ms=latency_ms,
                        model=self._model_id,
                    )
                    last_exc = exc
                else:
                    # 4xx: not retryable
                    log.error(
                        "domain_router_error",
                        status_code=exc.status_code,
                        error=str(exc),
                        model=self._model_id,
                    )
                    break
            except Exception as exc:
                log.error(
                    "domain_router_unexpected_error",
                    error=str(exc),
                    attempt=attempt,
                    model=self._model_id,
                )
                break

        log.warning(
            "domain_router_fallback",
            fallback_domain=fallback_domain,
            error=str(last_exc),
        )
        return {"domain": fallback_domain, "confidence": 0.0}

    async def _call_api(self, user_content: str) -> dict:
        client = _get_client()
        response = await client.messages.create(
            model=self._model_id,
            max_tokens=40,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_content}],
        )
        raw = response.content[0].text.strip()
        raw = _strip_code_fence(raw)
        parsed = json.loads(raw)
        domain = str(parsed.get("domain", "out_of_scope"))
        confidence = float(parsed.get("confidence", 0.0))
        return {"domain": domain, "confidence": confidence}

    @staticmethod
    def _build_user_content(
        message: str,
        previous_domain: Optional[str],
        last_intent: Optional[str],
    ) -> str:
        lines = []
        if previous_domain:
            lines.append(f"PREVIOUS_DOMAIN: {previous_domain}")
        if last_intent:
            lines.append(f"LAST_INTENT: {last_intent}")
        lines.append(f'USER: "{message}"')
        return "\n".join(lines)
