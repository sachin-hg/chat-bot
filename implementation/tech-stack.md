# Tech Stack — Confirmed Decisions

All decisions here are final for the local MVP. Production extensions noted inline.

---

## Application Layer

| Component | Choice | Version | Notes |
|---|---|---|---|
| Language | Python | 3.11+ | asyncio throughout; no sync I/O on critical path |
| Web framework | FastAPI | 0.110+ | SSE via `StreamingResponse`, async native |
| AI orchestration | LangGraph | 0.2+ | StateGraph with conditional edges |
| LLM SDK | `anthropic` (Python) | 0.25+ | Streaming + prompt cache support |
| Settings | pydantic-settings | 2.x | All config from ENV, `SecretStr` for keys |
| HTTP client | httpx | 0.27+ | Async client for tool executor HTTP calls |
| Logging | structlog | 24.x | JSON output, contextvars for request_id |
| Task runner | Makefile | — | All dev commands go through Make |
| Dependency management | uv or pip + requirements.txt | — | `requirements.txt` + `requirements-dev.txt` |

---

## Data Layer

| Component | Choice | Version | Local config | Prod difference |
|---|---|---|---|---|
| Primary DB | PostgreSQL | 16 | Single instance, port 5433 (PgBouncer) | RDS + read replica |
| Connection pool | PgBouncer | 1.22 | transaction mode, pool_size=20 | Same, larger pool |
| ORM/query | SQLAlchemy 2.0 async | 2.x | asyncpg driver | Same |
| Migrations | Alembic | — | `make migrate` | Same |
| Redis | Redis | 7 | Single-node, port 6379 | Cluster, 3 primaries |
| Kafka | Confluent CP Kafka | 7.5 | Single broker, KRaft mode | 3-broker cluster |

---

## AI/ML Layer

| Component | Choice | Notes |
|---|---|---|
| Stage 1 SLM | `claude-haiku-4-5-20251001` | Domain router, ~200 tokens, ≤40ms |
| Stage 2 SLM | `claude-haiku-4-5-20251001` | Domain-scoped classifier, ~800 tokens |
| Tier 3a LLM | `claude-haiku-4-5-20251001` | Most intents, streaming |
| Tier 3b LLM | `claude-sonnet-4-6` | Comparison/synthesis, streaming |
| Conversation summary | `claude-haiku-4-5-20251001` | Async, off critical path |
| Tracing | LangSmith | Optional locally, required staging/prod |
| Prompt cache | Anthropic prompt cache | 5-minute TTL, static blocks 00–05 |

**All model IDs are configurable** via `MODEL_REGISTRY` in `src/registries/model_registry.py`. No hardcoded model IDs in node implementations.

---

## Infrastructure (Local)

| Component | Docker image | Port | Notes |
|---|---|---|---|
| PostgreSQL | postgres:16 | 5432 | App connects via PgBouncer on 5433 |
| PgBouncer | pgbouncer/pgbouncer:1.22 | 5433 | Transaction mode |
| Redis | redis:7-alpine | 6379 | Single node locally |
| Kafka | confluentinc/cp-kafka:7.5 | 9092 | KRaft mode (no separate Zookeeper) |
| Kafdrop | obsidiandynamics/kafdrop | 9000 | Kafka UI (dev only) |

FastAPI app runs locally (`uvicorn src.main:app --reload`), NOT in Docker, for hot reload during development.

---

## Project Structure

```
~/ai-agents/chat-bot/
├── docs/                    # All architecture docs (already complete)
├── implementation/          # Implementation plan (this directory)
├── src/                     # Application source code
│   ├── main.py             # FastAPI app + lifespan
│   ├── config.py           # Pydantic settings
│   ├── api/                # API routers (chat.py, health.py)
│   ├── pipeline/           # LangGraph nodes (all 19)
│   │   ├── state.py        # BotState TypedDict
│   │   ├── graph.py        # StateGraph wiring + build_graph()
│   │   └── nodes/          # One file per node or node group
│   ├── adapters/           # DomainRouterPort, ClassifierPort, LLMPort implementations
│   ├── tools/              # CachedExecutorPort implementations (one per tool)
│   ├── registries/         # INTENT_REGISTRY, TOOL_REGISTRY, FILTER_REGISTRY
│   ├── prompt/             # LLMPromptComposer, SUMMARY_BUILDERS, FOLLOWUP_PROMPT_BLOCKS
│   ├── session/            # RedisSessionStore (SessionStorePort)
│   ├── db/                 # SQLAlchemy models, Alembic migrations
│   ├── kafka/              # Producer, consumers (db-writer, session-events)
│   ├── registry/           # SessionRegistryPort implementation
│   └── observability/      # Structlog config, NodeMetrics, LangSmith setup
├── prompts/                 # Prompt files (auto-generated sections committed)
│   ├── slm/
│   │   ├── domain_router.md
│   │   └── domains/
│   └── llm/
│       ├── followup/
│       └── main/
├── tests/
│   ├── unit/               # Fast, no I/O
│   ├── integration/        # Real APIs, --run-integration flag
│   ├── model_eval/         # SLM calibrated eval, --real-model flag
│   ├── e2e/                # Full-stack golden paths
│   └── fixtures/           # Sample API responses
├── docker-compose.yml
├── Makefile
├── requirements.txt
├── requirements-dev.txt
└── .env.example
```

---

## BOT_ENV Modes

Three modes control how the app behaves. Set in `.env` or passed as env var.

| Mode | SLM | LLM | Tool Executors | DB | Redis | Kafka | Use when |
|---|---|---|---|---|---|---|---|
| `mock` | Real (Anthropic) | Real (Anthropic) | DryRunExecutor (fixtures) | In-memory | Optional | Optional | AI/ML development, no VPN needed |
| `local` | Real | Real | HttpToolExecutor → real APIs via VPN | PostgreSQL | Redis | Kafka | Full local dev, all services running |
| `production` | Real | Real | HttpToolExecutor → prod APIs | RDS | Redis Cluster | Kafka cluster | Production |

**`BOT_ENV=mock` requires only:** `ANTHROPIC_API_KEY` + a scenario file in `tests/fixtures/scenarios/`

```bash
# Develop without VPN:
BOT_ENV=mock make dry-run SCENARIO=2bhk_bandra_search MSG="show me 2bhk in bandra"

# Full local development (VPN required):
BOT_ENV=local make up && uvicorn src.main:app --reload

# Specific scenario for debugging a node:
BOT_ENV=mock DRY_RUN_SCENARIO=locality_comparison python -m src.tools.dry_run \
  --message "compare Andheri and Bandra"
```

---

## Local → Production Checklist

Every decision that is "local only" is documented here. Before deploying to production:

- [ ] Redis: switch from single-node to cluster; add hash tags `{conversation_id}` to all keys
- [ ] Kafka: `replication-factor=3`, `min.insync.replicas=2`
- [ ] PostgreSQL: RDS Multi-AZ + read replica; same schema, no changes
- [ ] `LLM_MAX_CONCURRENT`: increase from 20 to 120 (production Anthropic rate limit)
- [ ] `BOT_ENV=production`: enables production log redaction, disables debug endpoints
- [ ] `LANGCHAIN_TRACING_V2=true`: LangSmith required in production
- [ ] PgBouncer: `max_client_conn=200`, `default_pool_size=100`
- [ ] Secrets: migrate from .env to AWS Secrets Manager / GCP Secret Manager

Nothing in the business logic or API contracts changes between local and production. Only infra config.
