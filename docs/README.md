# Housing.com Search & Discovery Bot — Documentation

## Quick Navigation

### Start here
- [System Design](system-design.md) — Databases, Redis, Kafka, WebSocket scaling, failure modes
- [Pipeline Overview](pipeline/overview.md) — Architecture diagram and adapter interfaces
- [Unified Platform](unified-platform.md) — How this bot fits into the 5-service platform

---

### Registries — Single sources of truth
| Doc | What's in it |
|---|---|
| [Intent Registry](registries/intent-registry.md) | All intents, tiers, data requirements, session carry-over |
| [Tool Registry](registries/tool-registry.md) | API tool schemas, cache TTLs, error contracts |
| [Filter Registry](registries/filter-registry.md) | Filter keys, ADD/REPLACE semantics, enum values |

### Pipeline — Node implementations
| Doc | Nodes covered |
|---|---|
| [BotState & Adapters](pipeline/pipeline-preamble.md) | BotState TypedDict, Protocol interfaces |
| [Classification Nodes](pipeline/classification-nodes.md) | safety → route_domain → classify → validate_slm |
| [Processing Nodes](pipeline/processing-nodes.md) | filter_apply → sanitize → derive → clarify → resolve_entities → route → summary |
| [Response Nodes](pipeline/response-nodes.md) | experiment → fetch_data → respond → build_prompt → llm → validate_output → followup |
| [Prompt Block Architecture](pipeline/prompt-architecture-base.md) | System prompt file structure, LLMContext |
| [Registry Integrity](pipeline/registry-integrity.md) | Startup validation, cross-registry invariants |

### Classification
| Doc | What's in it |
|---|---|
| [SLM Classifier](classification/slm-classifier.md) | Two-stage cascade: domain router + domain-scoped classifiers |

### LLM Layer
| Doc | What's in it |
|---|---|
| [System Prompt Design](llm/system-prompt.md) | Prompt structure, negative cases, content safety, output constraints |
| [Tool Contracts](llm/tool-contracts.md) | Full tool schemas, API translations, data flow, caching |
| [Request Lifecycle](llm/lifecycle.md) | Full lifecycle, streaming timeline, error handling, token budget |
| [Conversation Design](llm/conversation-design.md) | Tone, SSE phases, use-case flows, edge cases |

### API & Frontend Contract
| Doc | What's in it |
|---|---|
| [Endpoints & Envelopes](api/endpoints.md) | HTTP endpoints A1–A6, ChatEventToUser/FromUser |
| [Templates & Actions](api/templates.md) | All templateId definitions, user_action payloads |
| [SSE Contract](api/sse-contract.md) | SSE events, 3-phase lifecycle, sequence numbers, invariants |

### Context & Intent
| Doc | What's in it |
|---|---|
| [Intent Architecture](context/intent-architecture.md) | Session state, context window, intent taxonomy, BotState fields |

### Operations
| Doc | What's in it |
|---|---|
| [Resilience](operations/resilience.md) | Timeouts, retries, circuit breakers, fallbacks |
| [Observability](operations/observability.md) | Metrics, cost tracking, logging, SLOs, alerts |
| [Cost Optimisation](operations/cost-optimization.md) | Token reduction, model selection, caching, self-hosted economics |
| [Platform Integration](operations/platform-integration.md) | Session tokens, HandoffContext, Registry, session lifecycle |
| [Debugging](operations/debugging.md) | LangSmith traces, dry_run(), turn replay, CLI tools |

### Models & Experiments
| Doc | What's in it |
|---|---|
| [Model Registry](models/model-registry.md) | MODEL_REGISTRY, ModelAssignment, provider adapters, self-hosted |
| [A/B Experiments](models/ab-experiments.md) | ExperimentConfig, success metrics, graduation procedure |

### Testing
| Doc | What's in it |
|---|---|
| [Testing Guide](testing/testing-guide.md) | Test taxonomy, model evals, integration tests, dev setup |

### Reference
| Doc | What's in it |
|---|---|
| [SSE vs WebSocket](sse-vs-websocket.md) | Protocol selection rationale, hybrid model |
| [Pipeline Migration](pipeline/migration-guide.md) | Before/after architecture changes |
| [Prompt Versioning](pipeline/prompt-versioning.md) | Semver for prompts, cache invalidation |

---

## Adding a new intent (checklist)
1. Add `IntentRecord` to [Intent Registry](registries/intent-registry.md)
2. Add `ToolRecord`(s) to [Tool Registry](registries/tool-registry.md) if new API needed
3. Add `FilterRecord`(s) to [Filter Registry](registries/filter-registry.md) if new filters
4. Add to domain prompt in [SLM Classifier](classification/slm-classifier.md)
5. Add entry to `FOLLOWUP_PROMPT_BLOCKS` + `SUMMARY_BUILDERS` in [Response Nodes](pipeline/response-nodes.md)
6. Add eval cases to `tests/model_eval/<domain>/cases.jsonl`
7. Run `pytest tests/prompt/ tests/model_eval/<domain>/ --real-model`

## Adding a new model
See [Model Registry](models/model-registry.md) — read `ModelSelectionGuide` for the task first, then follow the experiment → eval → promotion flow.
