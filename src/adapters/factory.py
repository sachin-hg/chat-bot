"""Adapter factory — instantiates SLM/LLM adapters from MODEL_REGISTRY entries.

This is the single place that maps (provider, adapter_class) → concrete adapter.
Adding a new provider means adding one branch here; no node code changes required.

Design principles:
  - Open/Closed: extend by adding a new provider branch; existing branches unchanged.
  - Dependency Inversion: callers depend on ports (DomainRouterPort etc.), not concrete classes.
  - Single Responsibility: this module only does adapter instantiation.

Supported providers:
  'anthropic'   — AnthropicDomainRouter / AnthropicClassifier / AnthropicLLM
  'openrouter'  — OpenRouterDomainRouter / OpenRouterClassifier / OpenRouterLLM
                  (routes to Gemini, Llama, Mistral, GPT-4o, etc.)

Usage:
  router     = build_domain_router(settings)
  classifier = build_classifier(domain, settings)
  llm        = build_llm(task_key, settings)
"""
from __future__ import annotations

from src.config import Settings
from src.observability.logging import get_logger
from src.registries.model_registry import MODEL_REGISTRY

log = get_logger(__name__)


def _anthropic_key(settings: Settings) -> str:
    k = settings.anthropic_api_key
    return k.get_secret_value() if k else ""


def _openrouter_key(settings: Settings) -> str:
    k = settings.openrouter_api_key
    return k.get_secret_value() if k else ""


def build_domain_router(settings: Settings):
    """Return a DomainRouterPort implementation based on MODEL_REGISTRY['domain_router']."""
    assignment = MODEL_REGISTRY["domain_router"]
    provider   = assignment.provider

    if provider == "anthropic":
        from src.adapters.domain_router import AnthropicDomainRouter
        return AnthropicDomainRouter()

    if provider == "openrouter":
        from src.adapters.openrouter import OpenRouterDomainRouter
        key = _openrouter_key(settings)
        if not key:
            log.warning("openrouter_key_missing_falling_back_to_anthropic")
            from src.adapters.domain_router import AnthropicDomainRouter
            return AnthropicDomainRouter()
        return OpenRouterDomainRouter(
            model_id   = assignment.model_id,
            api_key    = key,
            timeout_ms = assignment.timeout_ms,
        )

    log.warning("unknown_provider_falling_back", provider=provider, task="domain_router")
    from src.adapters.domain_router import AnthropicDomainRouter
    return AnthropicDomainRouter()


def build_classifier(settings: Settings):
    """Return a ClassifierPort implementation.

    The classifier task_id is domain-specific but all domains share the same
    provider, so we read from the base property_search entry as representative.
    """
    assignment = MODEL_REGISTRY.get("intent_classifier_property_search")
    if not assignment:
        from src.adapters.classifier import AnthropicClassifier
        return AnthropicClassifier()

    provider = assignment.provider

    if provider == "anthropic":
        from src.adapters.classifier import AnthropicClassifier
        return AnthropicClassifier()

    if provider == "openrouter":
        from src.adapters.openrouter import OpenRouterClassifier
        key = _openrouter_key(settings)
        if not key:
            log.warning("openrouter_key_missing_falling_back_to_anthropic")
            from src.adapters.classifier import AnthropicClassifier
            return AnthropicClassifier()
        return OpenRouterClassifier(
            model_id   = assignment.model_id,
            api_key    = key,
            timeout_ms = assignment.timeout_ms,
        )

    log.warning("unknown_provider_falling_back", provider=provider, task="classifier")
    from src.adapters.classifier import AnthropicClassifier
    return AnthropicClassifier()


def build_llm(task_key: str, settings: Settings):
    """Return a LLMPort implementation for a given task key (llm_tier3a / llm_tier3b)."""
    assignment = MODEL_REGISTRY.get(task_key)
    if not assignment:
        from src.adapters.llm import AnthropicLLM
        return AnthropicLLM()

    provider = assignment.provider

    if provider == "anthropic":
        from src.adapters.llm import AnthropicLLM
        return AnthropicLLM()

    if provider == "openrouter":
        from src.adapters.openrouter import OpenRouterLLM
        key = _openrouter_key(settings)
        if not key:
            log.warning("openrouter_key_missing_falling_back_to_anthropic")
            from src.adapters.llm import AnthropicLLM
            return AnthropicLLM()
        return OpenRouterLLM(model_id=assignment.model_id, api_key=key)

    log.warning("unknown_provider_falling_back", provider=provider, task=task_key)
    from src.adapters.llm import AnthropicLLM
    return AnthropicLLM()
