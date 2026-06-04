"""AnthropicClassifier — Stage 2 SLM adapter implementing ClassifierPort."""
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

# Domain prompt files are loaded lazily on first access and cached.
_DOMAIN_PROMPT_DIR = Path(__file__).parent.parent.parent / "prompts" / "slm" / "domains"
_domain_prompt_cache: dict = {}


def _load_domain_prompt(domain: str) -> str:
    if domain not in _domain_prompt_cache:
        path = _DOMAIN_PROMPT_DIR / f"{domain}.md"
        _domain_prompt_cache[domain] = path.read_text(encoding="utf-8")
    return _domain_prompt_cache[domain]


def _strip_code_fence(text: str) -> str:
    """Strip markdown code fences the model sometimes adds despite instructions."""
    if not text.startswith("```"):
        return text
    lines = text.split("\n")
    start = 1
    end = len(lines) - 1 if lines[-1].strip() == "```" else len(lines)
    return "\n".join(lines[start:end]).strip()


# Shared client — single connection pool.
_client: Optional[anthropic.AsyncAnthropic] = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic()
    return _client


_OUT_OF_SCOPE_CLASSIFICATION: dict = {
    "main_intent": "out_of_scope",
    "sub_intent": "out_of_scope_query",
    "entities_mentioned": [],
    "multi_intent": False,
    "pivot": False,
    "filter_delta": {},
    "clarification_needed": None,
    "reasoning": "slm_classification_timeout: fallback out_of_scope",
}


class AnthropicClassifier:
    """Stage 2 domain-scoped intent classifier.

    Implements ClassifierPort:
        async def classify(self, input: dict) -> dict
            input: {
                message,          # str
                domain,           # str — selects domain prompt file
                taxonomy_prompt,  # str — pre-loaded by classify_node
                history,          # list — last 3 turns
                previous_intent,  # dict | None
                active_filters,   # dict — compact session filters
            }
            output: full SLMOutput dict

    Timeout:  2000 ms (asyncio.wait_for)
    Retries:  2 retries on 5xx or timeout (3 total attempts)
    Fallback: out_of_scope classification
    Model:    get_model_id('intent_classifier_<domain>'),
              falls back to get_model_id('intent_classifier_property_search')
    """

    def __init__(self) -> None:
        # Model IDs resolved per-domain at call time.
        self._fallback_model_id: str = get_model_id("intent_classifier_property_search")

    def _model_id_for(self, domain: str) -> str:
        task_id = f"intent_classifier_{domain}"
        try:
            return get_model_id(task_id)
        except KeyError:
            log.warning(
                "classifier_model_fallback",
                domain=domain,
                task_id=task_id,
                fallback=self._fallback_model_id,
            )
            return self._fallback_model_id

    async def classify(self, input: dict) -> dict:
        domain: str = input.get("domain", "out_of_scope")
        message: str = input.get("message", "")
        taxonomy_prompt: str = input.get("taxonomy_prompt", "")
        history: list = input.get("history") or []
        previous_intent: Optional[dict] = input.get("previous_intent")
        active_filters: dict = input.get("active_filters") or {}

        model_id = self._model_id_for(domain)
        system_prompt = self._build_system_prompt(domain, taxonomy_prompt)
        user_content = self._build_user_content(
            message, history, previous_intent, active_filters
        )

        last_exc: Optional[Exception] = None
        # 1 initial attempt + 2 retries = 3 total attempts
        for attempt in range(3):
            t0 = time.monotonic()
            try:
                result = await asyncio.wait_for(
                    self._call_api(model_id, system_prompt, user_content),
                    timeout=10.0,
                )
                latency_ms = int((time.monotonic() - t0) * 1000)
                log.info(
                    "slm_classification",
                    domain=domain,
                    main_intent=result.get("main_intent"),
                    sub_intent=result.get("sub_intent"),
                    entity_count=len(result.get("entities_mentioned") or []),
                    filter_keys_count=len(result.get("filter_delta") or {}),
                    clarification_needed=bool(result.get("clarification_needed")),
                    pivot=bool(result.get("pivot")),
                    latency_ms=latency_ms,
                    model=model_id,
                    attempt=attempt,
                )
                return result
            except asyncio.TimeoutError as exc:
                latency_ms = int((time.monotonic() - t0) * 1000)
                log.warning(
                    "slm_classification_timeout",
                    domain=domain,
                    attempt=attempt,
                    latency_ms=latency_ms,
                    model=model_id,
                )
                last_exc = exc
            except anthropic.APIStatusError as exc:
                latency_ms = int((time.monotonic() - t0) * 1000)
                if exc.status_code >= 500:
                    log.warning(
                        "slm_classification_5xx",
                        status_code=exc.status_code,
                        domain=domain,
                        attempt=attempt,
                        latency_ms=latency_ms,
                        model=model_id,
                    )
                    last_exc = exc
                else:
                    log.error(
                        "slm_classification_error",
                        status_code=exc.status_code,
                        error=str(exc),
                        domain=domain,
                        model=model_id,
                    )
                    break
            except Exception as exc:
                log.error(
                    "slm_classification_unexpected_error",
                    error=str(exc),
                    domain=domain,
                    attempt=attempt,
                    model=model_id,
                )
                break

        log.warning(
            "slm_classification_fallback",
            domain=domain,
            error=str(last_exc),
        )
        return dict(_OUT_OF_SCOPE_CLASSIFICATION)

    async def _call_api(
        self,
        model_id: str,
        system_prompt: str,
        user_content: str,
    ) -> dict:
        client = _get_client()
        response = await client.messages.create(
            model=model_id,
            max_tokens=400,
            system=system_prompt,
            messages=[{"role": "user", "content": user_content}],
        )
        raw = response.content[0].text.strip()
        raw = _strip_code_fence(raw)
        return json.loads(raw)

    @staticmethod
    def _build_system_prompt(domain: str, taxonomy_prompt: str) -> str:
        """Combine domain prompt file with the pre-loaded taxonomy block."""
        domain_file_content = _load_domain_prompt(domain)
        if taxonomy_prompt:
            return f"{domain_file_content}\n\n{taxonomy_prompt}"
        return domain_file_content

    @staticmethod
    def _build_user_content(
        message: str,
        history: list,
        previous_intent: Optional[dict],
        active_filters: dict,
    ) -> str:
        parts: list = []

        if history:
            parts.append("CONVERSATION HISTORY (last 3 turns, oldest first):")
            for turn in history:
                user_msg = turn.get("user", "")
                intent = turn.get("main_intent", "")
                sub = turn.get("sub_intent", "")
                parts.append(f"  USER: {user_msg}")
                if intent:
                    parts.append(f"  BOT classified as: {intent}/{sub}")
            parts.append("")

        if previous_intent:
            mi = previous_intent.get("main_intent", "")
            si = previous_intent.get("sub_intent", "")
            parts.append(f"PREVIOUS_INTENT: {mi}/{si}")

        if active_filters:
            parts.append(f"ACTIVE_FILTERS: {json.dumps(active_filters, ensure_ascii=False)}")

        parts.append(f'USER: "{message}"')
        return "\n".join(parts)
