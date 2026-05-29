# DevOps Backlog — @kiran

**Skill requirements:** Docker Compose, bash, PostgreSQL admin, Redis, Kafka/Zookeeper, Makefile, Python venv

**Install anything missing locally:** Use `brew install` (macOS) or `apt install` (Linux) — don't ask for approvals for local tooling.

---

## CHAT-K-001: Docker Compose — all services
**Sprint:** 0 | **SP:** 3 | **Status:** ⬜

**Description:**  
Create `docker-compose.yml` at repo root that starts all required services. FastAPI app itself runs locally (not in Docker) during development — Docker provides the dependencies only.

**Services to configure:**

| Service | Image | Port | Notes |
|---|---|---|---|
| PostgreSQL | postgres:16 | 5432 | persistent volume, init scripts |
| Redis | redis:7-alpine | 6379 | single-node, no cluster for local |
| Kafka | confluentinc/cp-kafka:7.5 | 9092 | with embedded Zookeeper (KRaft mode preferred) |
| PgBouncer | pgbouncer/pgbouncer:1.22 | 5433 | transaction mode, points to postgres:5432 |
| Kafdrop (optional) | obsidiandynamics/kafdrop | 9000 | Kafka UI, dev only |

**Acceptance Criteria:**
- [ ] `docker compose up -d` starts all services without errors
- [ ] PostgreSQL accessible at localhost:5432 with credentials from .env
- [ ] Redis accessible at localhost:6379
- [ ] Kafka accessible at localhost:9092
- [ ] PgBouncer accessible at localhost:5433 (app connects here, not 5432 directly)
- [ ] All data volumes are named (not anonymous) so `docker compose down` doesn't destroy data
- [ ] `docker compose down --volumes` cleanly removes everything

**Technical Notes:**
- See `docs/operations/db-schema.md` for PostgreSQL config requirements
- Use `KAFKA_AUTO_CREATE_TOPICS_ENABLE=false` — topics created explicitly by CHAT-K-003
- Redis: `--maxmemory 512mb --maxmemory-policy allkeys-lru` for local memory safety
- PgBouncer pool_mode=transaction, max_client_conn=200, default_pool_size=20

---

## CHAT-K-002: Makefile targets
**Sprint:** 0 | **SP:** 2 | **Status:** ⬜

**Description:**  
`Makefile` at repo root. Every developer command goes through Make — no need to remember docker commands.

**Required targets:**

```makefile
make setup        # Install Python deps (uv/pip), check .env exists
make up           # docker compose up -d
make down         # docker compose down
make logs         # docker compose logs -f (all services)
make migrate      # Run Alembic migrations
make seed         # Insert test data (1 conversation, 5 messages)
make test         # pytest tests/ -x -v
make test-unit    # pytest tests/unit/ only
make test-int     # pytest tests/integration/ only (hits real APIs)
make eval         # Run model eval runner (tests/model_eval/)
make health       # curl /health and print all service statuses
make clean        # Remove __pycache__, .pytest_cache, generated prompt files
make shell        # Open psql shell to local PostgreSQL
make redis-cli    # Open redis-cli
```

**Acceptance Criteria:**
- [ ] All targets work on macOS (arm64) and Linux (amd64)
- [ ] `make setup` installs deps from `requirements.txt` and `requirements-dev.txt`
- [ ] `make health` exits 0 when all services healthy, non-zero if any down
- [ ] Makefile has comments explaining non-obvious targets

---

## CHAT-K-003: Kafka topic creation script
**Sprint:** 0 | **SP:** 1 | **Status:** ⬜

**Description:**  
Script that creates all required Kafka topics on first boot. Run as part of `make setup`.

**Topics to create:**

```bash
kafka-topics.sh --create --topic chat.messages       --partitions 12 --replication-factor 1
kafka-topics.sh --create --topic chat.session_events --partitions 6  --replication-factor 1
kafka-topics.sh --create --topic chat.metrics        --partitions 6  --replication-factor 1
kafka-topics.sh --create --topic chat.llm_summaries  --partitions 3  --replication-factor 1
```

Note: `--replication-factor 1` for local (single broker). Production uses 3.

**Acceptance Criteria:**
- [ ] Script is idempotent (safe to run twice)
- [ ] All 4 topics visible in Kafdrop UI
- [ ] Script documented in README with note about prod replication factor

---

## CHAT-K-004: .env.example with all required vars
**Sprint:** 0 | **SP:** 1 | **Status:** ⬜

**Description:**  
Every environment variable the app reads must have a documented entry in `.env.example`. New devs copy this to `.env` and fill in secrets.

**Required vars (complete list):**

```bash
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5433          # PgBouncer port (not 5432)
POSTGRES_DB=chatbot
POSTGRES_USER=chatbot
POSTGRES_PASSWORD=          # FILL IN

# Redis
REDIS_URL=redis://localhost:6379/0

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_CONSUMER_GROUP=chat-db-writer

# Anthropic (SLM + LLM)
ANTHROPIC_API_KEY=          # FILL IN

# LangSmith (optional locally, required for tracing)
LANGCHAIN_TRACING_V2=false
LANGCHAIN_API_KEY=          # FILL IN if tracing enabled
LANGCHAIN_PROJECT=housing-bot-local

# Application
BOT_ENV=local               # local | staging | production
LOG_LEVEL=INFO
SECRET_KEY=                 # FILL IN (for session token signing)

# External APIs (all via VPN in staging env)
KHOJ_BASE_URL=              # FILL IN
ODIN_BASE_URL=              # FILL IN
CASA_BASE_URL=              # FILL IN
VENUS_BASE_URL=             # FILL IN
AUTOSUGGEST_BASE_URL=       # FILL IN

# LLM Concurrency
LLM_MAX_CONCURRENT=20       # Lower for local; 120 for production
LLM_QUEUE_MAX=50
```

**Acceptance Criteria:**
- [ ] Every env var the app reads is in .env.example with a comment
- [ ] `.env` is in .gitignore
- [ ] README has a "Getting Started" section pointing to .env.example

---

## CHAT-K-005: Structured log aggregation — docker compose log tailing
**Sprint:** 4 | **SP:** 2 | **Status:** ⬜

**Description:**  
Add a `make logs-pretty` target that tails the FastAPI app logs and pipes through `jq` for readable structured output. Also add a `make logs-errors` that filters for ERROR level only.

```bash
make logs-pretty   # docker compose logs -f app | jq -r '. | "\(.ts) [\(.level)] \(.event)"'
make logs-errors   # Same but grep level=ERROR
make logs-cost     # Filter for llm_call events and show cost_usd, model, latency_ms
```

**Acceptance Criteria:**
- [ ] `make logs-pretty` works when `jq` is installed (error message if not)
- [ ] `make logs-cost` shows per-turn LLM cost in readable format
- [ ] `make logs-errors` used in E2E test failure debugging
