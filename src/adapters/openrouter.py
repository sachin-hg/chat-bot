"""OpenRouter adapters — provider-agnostic SLM/LLM via OpenRouter's OpenAI-compatible API.

OpenRouter (https://openrouter.ai) proxies 200+ models (Gemini Flash, Llama 3,
Mistral, Cohere, etc.) through a single OpenAI-compatible endpoint.

Implements the same ports as the Anthropic adapters:
  OpenRouterClassifier  — ClassifierPort  (Stage 2 SLM intent classifier)
  OpenRouterDomainRouter — DomainRouterPort (Stage 1 domain router)
  OpenRouterLLM          — LLMPort          (streaming LLM response)

Usage via MODEL_REGISTRY:
  Set provider='openrouter' and model_id='google/gemini-flash-1.5' (or any
  OpenRouter model slug). The adapter factory reads this and instantiates the
  right class — no node code changes required.

Popular OpenRouter model IDs:
  google/gemini-flash-1.5           — fast, cheap (good for SLM tasks)
  google/gemini-pro-1.5             — Gemini Pro
  meta-llama/llama-3.1-8b-instruct  — Llama 3.1 8B
  meta-llama/llama-3.1-70b-instruct — Llama 3.1 70B
  mistralai/mistral-7b-instruct     — Mistral 7B
  openai/gpt-4o-mini                — GPT-4o mini
  openai/gpt-4o                     — GPT-4o
  anthropic/claude-haiku-4-5        — Claude via OpenRouter (A/B testing)
"""
from __future__ import annotations

import asyncio
import json
import time
from pathlib import Path
from typing import Any, Callable, Optional

from src.observability.logging import get_logger

log = get_logger(__name__)

_OPENROUTER_BASE = "https://openrouter.ai/api/v1"

# Shared OpenAI async client (lazy-initialised, thread-local to avoid import cycles)
_client: Optional[Any] = None


def _get_client(api_key: str):
    global _client
    if _client is None:
        try:
            from openai import AsyncOpenAI
        except ImportError:
            raise RuntimeError(
                "openai package not installed. Run: pip install openai>=1.0"
            )
        _client = AsyncOpenAI(
            api_key=api_key,
            base_url=_OPENROUTER_BASE,
            default_headers={
                "HTTP-Referer":  "https://housing.com",
                "X-Title":       "Housing.com Chatbot",
            },
        )
    return _client


def _strip_code_fence(text: str) -> str:
    if not text.startswith("```"):
        return text
    lines = text.split("\n")
    start = 1
    end   = len(lines) - 1 if lines[-1].strip() == "```" else len(lines)
    return "\n".join(lines[start:end]).strip()


# ---------------------------------------------------------------------------
# OpenRouterDomainRouter  (DomainRouterPort)
# ---------------------------------------------------------------------------

class OpenRouterDomainRouter:
    """Stage 1 domain router backed by any OpenRouter model.

    Drop-in replacement for AnthropicDomainRouter.  The system prompt and
    output schema are identical — only the underlying API call changes.
    """

    def __init__(self, model_id: str, api_key: str, timeout_ms: int = 2000):
        self._model_id  = model_id
        self._api_key   = api_key
        self._timeout_s = timeout_ms / 1000.0
        _prompt_path    = Path(__file__).parent.parent.parent / "prompts" / "slm" / "domain_router.md"
        self._system    = _prompt_path.read_text(encoding="utf-8")

    async def route(self, input: dict) -> dict:
        message        = input.get("message", "")
        previous_domain = input.get("previous_domain")
        last_intent    = input.get("last_intent")

        lines = []
        if previous_domain:
            lines.append(f"PREVIOUS_DOMAIN: {previous_domain}")
        if last_intent:
            lines.append(f"LAST_INTENT: {last_intent}")
        lines.append(f'USER: "{message}"')
        user_content = "\n".join(lines)
        fallback = previous_domain or "out_of_scope"

        for attempt in range(2):
            t0 = time.monotonic()
            try:
                result = await asyncio.wait_for(
                    self._call(user_content), timeout=self._timeout_s
                )
                log.info("openrouter_domain_routing", domain=result.get("domain"),
                         confidence=result.get("confidence"),
                         latency_ms=int((time.monotonic()-t0)*1000),
                         model=self._model_id, attempt=attempt)
                return result
            except (asyncio.TimeoutError, Exception) as exc:
                log.warning("openrouter_domain_router_error", error=str(exc),
                            attempt=attempt, model=self._model_id)
                if attempt == 1:
                    break

        log.warning("openrouter_domain_router_fallback", fallback=fallback)
        return {"domain": fallback, "confidence": 0.0}

    async def _call(self, user_content: str) -> dict:
        client = _get_client(self._api_key)
        resp   = await client.chat.completions.create(
            model=self._model_id,
            max_tokens=40,
            messages=[
                {"role": "system", "content": self._system},
                {"role": "user",   "content": user_content},
            ],
        )
        raw = resp.choices[0].message.content.strip()
        raw = _strip_code_fence(raw)
        d   = json.loads(raw)
        return {"domain": str(d.get("domain", "out_of_scope")),
                "confidence": float(d.get("confidence", 0.0))}


# ---------------------------------------------------------------------------
# OpenRouterClassifier  (ClassifierPort)
# ---------------------------------------------------------------------------

_domain_prompt_cache: dict = {}


def _load_domain_prompt(domain: str) -> str:
    if domain not in _domain_prompt_cache:
        p = Path(__file__).parent.parent.parent / "prompts" / "slm" / "domains" / f"{domain}.md"
        _domain_prompt_cache[domain] = p.read_text(encoding="utf-8")
    return _domain_prompt_cache[domain]


class OpenRouterClassifier:
    """Stage 2 intent classifier backed by any OpenRouter model.

    Drop-in replacement for AnthropicClassifier.  Uses the same domain
    prompt files and output schema.
    """

    def __init__(self, model_id: str, api_key: str, timeout_ms: int = 10000):
        self._model_id  = model_id
        self._api_key   = api_key
        self._timeout_s = timeout_ms / 1000.0

    async def classify(self, input: dict) -> dict:
        from src.pipeline.nodes.classification import DOMAIN_TAXONOMY_PROMPTS
        domain          = input.get("domain", "out_of_scope")
        message         = input.get("message", "")
        taxonomy_prompt = input.get("taxonomy_prompt") or DOMAIN_TAXONOMY_PROMPTS.get(domain, "")
        history         = input.get("history") or []
        previous_intent = input.get("previous_intent")
        active_filters  = input.get("active_filters") or {}

        system = _load_domain_prompt(domain)
        if taxonomy_prompt:
            system = f"{system}\n\n{taxonomy_prompt}"

        parts = []
        if history:
            parts.append("CONVERSATION HISTORY (last 3 turns, oldest first):")
            for t in history:
                parts.append(f"  USER: {t.get('user', '')}")
                if t.get("main_intent"):
                    parts.append(f"  BOT classified as: {t['main_intent']}/{t.get('sub_intent', '')}")
            parts.append("")
        if previous_intent:
            parts.append(f"PREVIOUS_INTENT: {previous_intent.get('main_intent','')}/{previous_intent.get('sub_intent','')}")
        if active_filters:
            parts.append(f"ACTIVE_FILTERS: {json.dumps(active_filters, ensure_ascii=False)}")
        parts.append(f'USER: "{message}"')
        user_content = "\n".join(parts)

        _fallback = {
            "main_intent": "out_of_scope", "sub_intent": "out_of_scope_query",
            "entities_mentioned": [], "entity_refs": [], "multi_intent": False,
            "pivot": False, "filter_delta": {}, "clarification_needed": None,
            "reasoning": "openrouter_classifier_fallback",
        }

        for attempt in range(3):
            t0 = time.monotonic()
            try:
                result = await asyncio.wait_for(
                    self._call(system, user_content), timeout=self._timeout_s
                )
                log.info("openrouter_classification", domain=domain,
                         main_intent=result.get("main_intent"),
                         latency_ms=int((time.monotonic()-t0)*1000),
                         model=self._model_id, attempt=attempt)
                return result
            except Exception as exc:
                log.warning("openrouter_classifier_error", error=str(exc),
                            attempt=attempt, model=self._model_id)
                if attempt == 2:
                    break

        return _fallback

    async def _call(self, system: str, user_content: str) -> dict:
        client = _get_client(self._api_key)
        resp   = await client.chat.completions.create(
            model=self._model_id,
            max_tokens=400,
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": user_content},
            ],
        )
        raw = resp.choices[0].message.content.strip()
        raw = _strip_code_fence(raw)
        return json.loads(raw)


# ---------------------------------------------------------------------------
# OpenRouterLLM  (LLMPort)
# ---------------------------------------------------------------------------

class OpenRouterLLM:
    """Streaming LLM adapter backed by any OpenRouter model.

    Drop-in replacement for AnthropicLLM.  Supports tool use via
    OpenAI-compatible function calling where available.
    """

    def __init__(self, model_id: str, api_key: str):
        self._model_id = model_id
        self._api_key  = api_key

    async def stream(
        self,
        model: str,
        system: str,
        messages: list,
        tools: list,
        on_chunk: Callable[[str], None] = None,
        on_tool_use: Callable = None,
    ) -> dict:
        client      = _get_client(self._api_key)
        full_text: list[str] = []
        tool_results: list[dict] = []

        # Convert Anthropic-format messages to OpenAI format
        oai_messages = [{"role": "system", "content": system or "You are a helpful assistant."}]
        for m in (messages or []):
            role = m.get("role", "user")
            content = m.get("content", "")
            oai_messages.append({"role": role, "content": content})

        # Convert Anthropic tool schema to OpenAI function schema
        oai_tools = []
        for t in (tools or []):
            if isinstance(t, dict) and "name" in t:
                oai_tools.append({
                    "type": "function",
                    "function": {
                        "name": t["name"],
                        "description": t.get("description", ""),
                        "parameters": t.get("input_schema", {"type": "object", "properties": {}}),
                    },
                })

        try:
            kwargs: dict = dict(
                model=model or self._model_id,
                max_tokens=1024,
                messages=oai_messages,
                stream=True,
            )
            if oai_tools:
                kwargs["tools"] = oai_tools
                kwargs["tool_choice"] = "auto"

            async with await client.chat.completions.create(**kwargs) as stream:
                tool_calls_acc: dict[int, dict] = {}

                async for chunk in stream:
                    delta = chunk.choices[0].delta if chunk.choices else None
                    if not delta:
                        continue

                    # Text chunk
                    if delta.content:
                        full_text.append(delta.content)
                        if on_chunk:
                            on_chunk(delta.content)

                    # Tool call accumulation (OpenAI streams tool calls in fragments)
                    if delta.tool_calls:
                        for tc in delta.tool_calls:
                            idx = tc.index
                            if idx not in tool_calls_acc:
                                tool_calls_acc[idx] = {"id": "", "name": "", "arguments": ""}
                            if tc.id:
                                tool_calls_acc[idx]["id"] = tc.id
                            if tc.function:
                                if tc.function.name:
                                    tool_calls_acc[idx]["name"] += tc.function.name
                                if tc.function.arguments:
                                    tool_calls_acc[idx]["arguments"] += tc.function.arguments

            # Execute accumulated tool calls
            for tc in tool_calls_acc.values():
                if tc["name"] and on_tool_use:
                    try:
                        params = json.loads(tc["arguments"]) if tc["arguments"] else {}
                        result = await on_tool_use(tc["name"], params)
                        tool_results.append({"tool": tc["name"], "result": result, "tool_use_id": tc["id"]})
                    except Exception as exc:
                        log.warning("openrouter_tool_call_failed", tool=tc["name"], error=str(exc))

            return {
                "response":    {"text": "".join(full_text), "stop_reason": "end_turn"},
                "tool_results": tool_results,
                "usage":       {},   # OpenRouter streaming doesn't always expose usage
            }

        except Exception as exc:
            log.error("openrouter_llm_error", model=model, error=str(exc))
            return {"response": {"text": ""}, "tool_results": [], "usage": {}}
