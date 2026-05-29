# Solid Architecture — Index

This document has been split into focused files. Use the links below to navigate.

> **See [README.md](README.md) for the full navigation guide.**

---

## Registries

| Doc | Content |
|---|---|
| [Intent Registry](registries/intent-registry.md) | `INTENT_REGISTRY` — all intents, tiers, data requirements |
| [Tool Registry](registries/tool-registry.md) | `TOOL_REGISTRY` — API schemas, cache TTLs, error contracts |
| [Filter Registry](registries/filter-registry.md) | `FILTER_REGISTRY` — filter keys, semantics, enum values |

## Pipeline

| Doc | Content |
|---|---|
| [Pipeline Overview](pipeline/overview.md) | Architecture diagram, LangGraph StateGraph |
| [BotState & Adapters](pipeline/pipeline-preamble.md) | BotState TypedDict, Protocol interfaces |
| [Classification Nodes](pipeline/classification-nodes.md) | safety → route_domain → classify → validate_slm |
| [Processing Nodes](pipeline/processing-nodes.md) | filter_apply → sanitize → derive → clarify → resolve_entities → route → summary |
| [Response Nodes](pipeline/response-nodes.md) | experiment → fetch_data → respond → build_prompt → llm → validate_output → followup |
| [Prompt Block Architecture](pipeline/prompt-architecture-base.md) | System prompt blocks, LLMContext, caching |
| [Registry Integrity](pipeline/registry-integrity.md) | Startup validation and cross-registry invariants |

## Operations

| Doc | Content |
|---|---|
| [Resilience](operations/resilience.md) | Timeouts, retries, circuit breakers |
| [Observability](operations/observability.md) | Metrics, cost tracking, logging, SLOs |
| [Platform Integration](operations/platform-integration.md) | Session tokens, HandoffContext, RegistryPort |
| [Debugging](operations/debugging.md) | LangSmith, dry_run(), replay |

## Models & Experiments

| Doc | Content |
|---|---|
| [Model Registry](models/model-registry.md) | MODEL_REGISTRY, ModelAssignment, provider adapters |
| [A/B Experiments](models/ab-experiments.md) | ExperimentConfig, success metrics, graduation |

## Testing

| Doc | Content |
|---|---|
| [Testing Guide](testing/testing-guide.md) | Test taxonomy, model evals, integration tests |

## Reference

| Doc | Content |
|---|---|
| [Pipeline Migration](pipeline/migration-guide.md) | Before/after architecture changes |
| [Prompt Versioning](pipeline/prompt-versioning.md) | Semver for prompts |
