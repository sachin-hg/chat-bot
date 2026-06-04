# Housing Chatbot — Local Setup Guide

## Overview

This is a Housing.com real-estate assistant built as a FastAPI service that streams
responses over Server-Sent Events (SSE). A user message flows through a 19-node
LangGraph pipeline that classifies intent with Anthropic Claude Haiku (SLM stage),
calls the appropriate Housing internal data APIs (Khoj, Odin, Casa, Venus, etc.),
and synthesises a response with a second Anthropic call (LLM stage).

Conversation state is kept in Redis between turns. Every message event is durably
written to PostgreSQL via Kafka so that session history survives service restarts.
PgBouncer sits in front of Postgres to pool connections for the async FastAPI workers.

```
                        ┌──────────────────────────────────────────────────────────┐
                        │                   LangGraph (19 nodes)                   │
                        │                                                          │
FE / curl               │  Classification         Processing        Response       │
──────────▶ FastAPI ───▶│  safety                 filter_apply      summary        │
           SSE stream   │  normalize              sanitize          experiment     │◀──▶ Anthropic
           /send-message│  route_domain           derive            fetch_data     │     Claude Haiku
           -streamed    │  classify               clarify           respond        │     (SLM + LLM)
                        │  validate_slm           resolve_entities  build_prompt   │
                        │                         route             llm_node       │◀──▶ Housing APIs
                        │                                           validate_output│     (Khoj/Odin/…)
                        │                                           followup       │
                        └──────────────────────────────────────────────────────────┘
                                      │                      │
                                    Redis                  Kafka
                                  (session)            (chat.messages)
                                                             │
                                                        PostgreSQL
                                                     (via PgBouncer)
```

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Python | 3.9+ | 3.12 recommended; check with `python3 --version` |
| Docker Desktop | any recent | Runs Postgres, Redis, Kafka, PgBouncer |
| make | any | Ships with macOS Xcode tools |
| jq | any | For `make logs-pretty` / `make logs-pipeline`; `brew install jq` |
| Anthropic API key | — | [console.anthropic.com](https://console.anthropic.com) → API Keys → Create key |
| LangSmith key | optional | [smith.langchain.com](https://smith.langchain.com) → Settings → API Keys |

---

## Required Environment Variables

### Must Have (app won't start without these)

| Variable | Where to get it | Example |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys → Create key | `sk-ant-api03-...` |
| `POSTGRES_PASSWORD` | Choose any password for local dev | `mypassword` |
| `SECRET_KEY` | `python3 -c "import secrets; print(secrets.token_hex(32))"` | `abc123def456...` |

> `ANTHROPIC_API_KEY` and `SECRET_KEY` are validated by `pydantic-settings` on startup —
> the server will refuse to start if they are missing or blank.

### Optional (defaults work locally)

| Variable | Default | Purpose |
|---|---|---|
| `LANGCHAIN_TRACING_V2` | `false` | Enable LangSmith traces |
| `LANGCHAIN_API_KEY` | — | smith.langchain.com → Settings → API Keys (`ls__...`) |
| `LANGCHAIN_PROJECT` | `housing-bot-local` | LangSmith project name |
| `BOT_ENV` | `dev` | `mock` / `dev` / `local` / `staging` / `production` (see table below) |
| `LOG_LEVEL` | `INFO` | `DEBUG` for verbose pipeline logs |
| `LLM_MAX_CONCURRENT` | `20` | Max parallel Anthropic calls |
| `LLM_QUEUE_MAX` | `50` | Max queued requests before 429 |

### BOT_ENV modes

| Value | SLM / LLM | Tool executor | VPN needed? | Use when |
|---|---|---|---|---|
| `mock` | Keyword router + canned text | None | No | CI, offline work, no API key |
| `dev` | Real Anthropic (Haiku) | `DevExecutor` — contextual mock data generated from query params | No | **Default for local dev** — tests real classification + LLM quality |
| `local` | Real Anthropic | `HttpToolExecutor` → real Housing APIs | Yes | Integration testing against live data |
| `staging` / `production` | Real Anthropic | Real Housing APIs | Yes | Staging / prod |

> **`dev` is the recommended default.** It uses real Anthropic SLM + LLM calls (so you catch classification regressions and prompt quality issues) but generates mock Housing API responses internally from the query params — realistic 2BHK listings for Bandra, locality data for Powai, etc. — without needing VPN.

### External APIs (only needed with `BOT_ENV=local`, not `mock` or `dev`)

All of these are internal Housing.com services reachable only over VPN.
In `BOT_ENV=mock` mode the pipeline uses fixture JSON files instead,
so you can develop and run tests without VPN or real API access.

| Variable | Service | Notes |
|---|---|---|
| `KHOJ_BASE_URL` | Property search index | Requires VPN |
| `ODIN_BASE_URL` | Locality, project, ratings data | Requires VPN |
| `CASA_BASE_URL` | Rent/resale listing detail | Requires VPN |
| `VENUS_BASE_URL` | New-launch project data | Requires VPN |
| `AUTOSUGGEST_BASE_URL` | Entity resolution (locality / project name → UUID) | Requires VPN |
| `GANDALF_BASE_URL` | Price trends, transaction history | Requires VPN |
| `REGIONS_BASE_URL` | Travel time / distance | Requires VPN |
| `DATA_BASE_URL` | Filter suggestions, collections, recently viewed | Requires VPN |
| `SEO_BASE_URL` | SEO content (top societies) | Requires VPN |
| `USER_ACTIVITY_BASE_URL` | Saved properties, recent searches, search alerts | Requires VPN |
| `LOGIN_SERVICE_URL` | Housing auth service (validates FE cookie tokens) | Requires VPN |

---

## Quick Start (`BOT_ENV=dev` — recommended, no VPN needed)

Uses real Anthropic SLM + LLM calls with contextually generated mock Housing API data.
You need Docker and an Anthropic API key; no VPN required.

```bash
# 1. Clone the repo
git clone <repo-url>
cd chat-bot

# 2. Create your .env
cp .env.example .env
```

Edit `.env` — the three required fields plus the two local-dev overrides:

```
ANTHROPIC_API_KEY=sk-ant-api03-...
POSTGRES_PASSWORD=mypassword
SECRET_KEY=<run: python3 -c "import secrets; print(secrets.token_hex(32))">
BOT_ENV=dev
POSTGRES_PORT=5432   # connect directly to postgres; pgbouncer is incompatible with asyncpg locally
```

```bash
# 3. Create a Python virtual environment and install dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt

# 4. Start infrastructure (Postgres, Redis, Kafka, PgBouncer)
make up

# 5. Wait for services to be healthy (usually 15-30 seconds)
make health

# 6. Run database migrations (one-time)
make migrate

# 7. Start the FastAPI server
make run   # starts on port 8001

# 8. Send a message and watch the SSE stream
curl -s -N -X POST http://localhost:8001/api/v1/chat/send-message-streamed \
  -H "Content-Type: application/json" \
  -H "X-Session-Token: any-token" \
  -d '{
    "conversationId": "test-001",
    "sender": {"type": "user"},
    "messageType": "text",
    "content": {"text": "show me 2bhk in bandra under 2 crore"},
    "responseRequired": true
  }'

# 9. Or open the playground UI
open http://localhost:8001/playground
```

## Quick Start (mock mode — no Anthropic API key needed)

All SLM/LLM calls are replaced with keyword routing and canned responses.
Useful for CI, offline work, or developing without an API key.

```bash
# Same as dev setup but set BOT_ENV=mock in .env (no ANTHROPIC_API_KEY needed)
BOT_ENV=mock
POSTGRES_PASSWORD=mypassword
SECRET_KEY=<...>
POSTGRES_PORT=5432

make up && make migrate && make run
```

Or run a single pipeline turn without starting the server:

```bash
make dry-run MSG="show me 2bhk in powai"
```

---

## Full Local Setup (`BOT_ENV=local`, real APIs via VPN)

Use this when you need to test against live Housing data APIs.

```bash
# 1. Connect to VPN first

# 2. Copy and edit .env
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY, POSTGRES_PASSWORD, SECRET_KEY
# Set BOT_ENV=local
# Set POSTGRES_PORT=5432
# Fill in all *_BASE_URL variables

# 3. Install dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt

# 4. Start infrastructure
make up

# 5. Run migrations
make migrate

# 6. (Optional) Seed the database with a sample conversation
make seed

# 7. Start the server
make run   # port 8001

# 8. Verify everything is up
make health
```

To start all infrastructure services plus the Kafdrop Kafka UI (port 9000):

```bash
make up-dev
# Kafdrop: http://localhost:9000
```

---

## Running Tests

Tests are layered. Always activate your venv first: `source .venv/bin/activate`

### Unit tests (no infrastructure, no API keys)

Fast, isolated — run on every change. Mocks all adapters.

```bash
make test-unit
# or: pytest tests/unit/ -x -v
```

### Dry-run tests (mock tools + real or mock SLM)

Run the full 19-node LangGraph pipeline against fixture JSON files.
By default the SLM (classifier) is also mocked:

```bash
pytest tests/dry_run/ -x -v
```

To run with a real Anthropic SLM call (requires `ANTHROPIC_API_KEY` in `.env`):

```bash
pytest tests/dry_run/ -x -v --real-slm
```

### E2E functional tests (FastAPI test client, mocked tools)

Spins up the FastAPI app in-process and sends HTTP requests through it.
No running server needed. No external APIs needed.

```bash
pytest tests/e2e/ -x -v
```

### Integration tests (real APIs, requires VPN)

Hit live Housing data APIs. Skipped by default; opt in with `--run-integration`.

```bash
pytest tests/integration/ -x -v --run-integration
```

### Model eval (real SLM/LLM endpoint)

Classification accuracy and response quality benchmarks. Skipped by default.

```bash
make eval
# or: pytest tests/model_eval/ -v --real-model
```

### Full suite

```bash
make test
# or: pytest tests/ -x -v
```

---

## Dry Run CLI

The dry-run CLI runs a single pipeline turn in-process — no server, no database,
no Kafka. Ideal for iterating on prompts and checking pipeline behaviour quickly.

**Mode 1 — fully mocked (keyword router + mock LLM, fixture tools)**
```bash
make dry-run MSG="show me 2bhk in powai"
make dry-run MSG="compare andheri vs bandra" SCENARIO=comparison
make dry-run MSG="tell me about andheri" SCENARIO=locality_andheri
```

**Mode 2 — real SLM, mock LLM (requires ANTHROPIC_API_KEY)**
```bash
make dry-run MSG="show me 2bhk in powai" SLM=real
```

**Mode 3 — real SLM + real LLM (requires ANTHROPIC_API_KEY, incurs cost)**
```bash
make dry-run MSG="show me 2bhk in powai" SLM=real LLM=real
```

Available scenarios (fixture files in `tests/fixtures/scenarios/`):
- `default` — generic property search
- `2bhk_bandra_search` — Bandra 2-BHK search with listing data
- `comparison` — locality comparison
- `locality_andheri` — Andheri locality research
- `out_of_scope` — out-of-scope query (weather, jokes, etc.)

**Direct Python invocation** (same as `make dry-run` but gives full control):
```bash
BOT_ENV=mock .venv/bin/python -m src.tools.dry_run \
    --message "show me 2bhk in powai" \
    --scenario 2bhk_bandra_search \
    --mock-slm \
    --mock-llm
```

---

## LangSmith Traces

LangSmith gives you a visual trace of every pipeline turn: all 19 node spans,
SLM prompts and classification output, tool calls with latency, LLM prompt +
response, and SSE event counts.

### Enable tracing

1. Sign in at [smith.langchain.com](https://smith.langchain.com)
2. Go to Settings → API Keys → Create key (starts with `ls__`)
3. Add to your `.env`:

```
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls__...
LANGCHAIN_PROJECT=housing-bot-local
```

Tracing works for both the FastAPI server and `make dry-run` — no code changes needed.

### What you'll see

Each request appears as a top-level run named after the pipeline turn.
Inside you'll find:
- One span per node (safety → normalize → … → followup)
- `classify` span: full SLM prompt, token counts, classification JSON
- `llm_node` span: full LLM prompt, streaming chunks, cost estimate
- `fetch_data` span: which tools were called and their response sizes

---

## Troubleshooting

### `ANTHROPIC_API_KEY` is set in `.env` but the server logs say "Could not resolve authentication method"

**Root cause:** `pydantic-settings` reads `.env` into the `Settings` object but does *not* export
variables to `os.environ`. The Anthropic SDK's `AsyncAnthropic()` reads `ANTHROPIC_API_KEY` from
`os.environ`, so it never sees the value from `.env`.

**Fix:** `src/main.py` calls `_configure_anthropic(settings)` on startup, which does:
```python
os.environ.setdefault("ANTHROPIC_API_KEY", settings.anthropic_api_key.get_secret_value())
```
This is already wired — if you see this error the key in `.env` is blank or mis-named.

---

### SLM/LLM classifier returns JSON parse error (`Expecting value: line 1 column 1`)

**Root cause:** Claude sometimes wraps its JSON output in markdown code fences
(`` ```json ... ``` ``) even when the prompt says "no prose". This makes `json.loads`
fail because the string starts with a backtick.

**Fix:** Both `AnthropicDomainRouter._call_api` and `AnthropicClassifier._call_api` call
`_strip_code_fence(raw)` before parsing. If you add a new adapter that parses LLM JSON,
apply the same helper.

---

### Classifier returns `sub_intent = "property_search/filter_search"` (full path) instead of `"filter_search"`

**Root cause:** The intent taxonomy block shown to the model lists intents as
`property_search/filter_search (tier 3a)`. The model copies this format verbatim into
the `sub_intent` field instead of extracting just the sub-intent part.

**Fix:** `validate_slm_node` strips the `"main_intent/"` prefix before checking the
INTENT_REGISTRY:
```python
if si.startswith(f"{mi}/"):
    c["sub_intent"] = si[len(mi) + 1:]
```
This is already in place. If you rename intents in the registry, the normalization
handles it automatically.

---

### Domain classifier prompts return rich markdown instead of JSON

**Root cause:** The files in `prompts/slm/domains/*.md` were placeholder stubs
(`[AUTO-GENERATED from INTENT_REGISTRY at startup — do not edit]`, 162 chars) that
contained no instructions whatsoever. The model received a nearly empty system prompt
and defaulted to a helpful markdown analysis.

**Fix:** Each domain file now contains a proper classifier system prompt: JSON output
rules, the required schema, and domain-specific extraction hints. The intent and filter
taxonomy is injected on top via `build_intent_taxonomy_block()` + `build_filter_delta_block()`.

If you add a new domain, you must write a corresponding `prompts/slm/domains/<domain>.md`.

---

### `DOMAIN_TAXONOMY_PROMPTS` was loading empty stub files

**Root cause:** `classification.py` populated `DOMAIN_TAXONOMY_PROMPTS` by calling
`_load_template("prompts/slm/domains/property_search.md")` — the same placeholder files
described above.

**Fix:** `DOMAIN_TAXONOMY_PROMPTS` now calls the registry builders at import time:
```python
DOMAIN_TAXONOMY_PROMPTS = {
    domain: _build_taxonomy_prompt(domain)
    for domain in ["property_search", "property_detail", "locality", "project_research", "portfolio"]
}
```
where `_build_taxonomy_prompt` calls `build_intent_taxonomy_block()` + `build_filter_delta_block()`.
The taxonomy stays in sync with the registry automatically.

---

### `postgres_unavailable_on_startup` / `DuplicatePreparedStatementError` on health check

**Root cause:** The app's `database_url` defaults to port 5433 (pgbouncer). pgbouncer
in **transaction pool mode** does not support prepared statements, but SQLAlchemy's
asyncpg dialect creates prepared statements for internal introspection queries
(`select pg_catalog.version()`, `select current_schema()`). This causes a clash when
pgbouncer reuses a backend connection that still has stale prepared statement names.

**Fix for local dev:** Set `POSTGRES_PORT=5432` in `.env`. The app then connects directly
to Postgres, bypassing pgbouncer. pgbouncer is still started by Docker Compose and is
available on port 5433 for any tooling that needs it.

```
POSTGRES_PORT=5432   # add this line to your .env
```

For **Alembic migrations**, `alembic/env.py` always uses `_direct_url()` (port 5432)
regardless of `POSTGRES_PORT`, so migrations work correctly even when the app is pointed
at pgbouncer.

**Note:** `src/db/engine.py` also sets `connect_args={"statement_cache_size": 0}` as
defense-in-depth — this disables asyncpg's prepared statement cache so the error cannot
recur even if port 5433 is used in the future.

---

### Classifier JSON is truncated mid-output (`Unterminated string`)

**Root cause:** `max_tokens=160` was too small for the full classification JSON,
which includes `filter_delta` with multiple keys, `entities_mentioned` as a list,
and a `reasoning` field. The response got cut off mid-string.

**Fix:** Classifier `max_tokens` is now 400. Domain router is 40 (its output is just
`{"domain": "...", "confidence": 0.98}` — 20–30 tokens).

If you add new fields to the classification schema, check that 400 tokens is still enough
by running `make dry-run MSG="..." SLM=real` and checking for truncation.

---

### Domain router or classifier times out on every request

**Root cause:** The original timeouts (domain router: 500 ms, classifier: 2 s) were
tuned for warm production traffic. Cold Anthropic API calls — first call after server
start, or after a period of inactivity — typically take 1–3 s for Haiku.

**Fix:** Timeouts are now:
- Domain router: **2 s** (was 0.5 s)
- Classifier: **10 s** (was 2 s; the larger domain taxonomy prompt adds ~500 ms)

The production values should be tightened back once the prompt cache is warm. The
router p95 target is 150 ms and the classifier p95 is 500 ms in steady-state traffic.

---

### Kafka not starting / topics not created

```
[skip] Kafka not running — run 'make up' first, then 'make setup' again
```

Wait for `docker compose ps` to show Kafka as `(healthy)` before creating topics:
```bash
make up
# Wait ~30 seconds
docker compose ps
make setup
```

Kafka uses KRaft mode (no Zookeeper). If it fails to start, check for a stale
cluster ID in the volume:
```bash
make down-clean    # destroys all volumes — data is lost
make up
```

### Redis connection refused

The app starts without Redis and logs `redis: unavailable` on `/health`.
Check that the container is running:
```bash
docker compose ps redis
make redis-cli   # should return PONG
```

### PostgreSQL unavailable / migration fails

Run `make health` — if postgres shows unavailable, the container may still be
starting. Wait for the healthcheck to pass:
```bash
docker compose ps postgres  # look for "(healthy)"
make migrate
```

If you see an authentication error, check that `POSTGRES_PASSWORD` in your `.env`
matches the password Docker used when it first created the volume. If they differ,
run `make down-clean` and `make up` to recreate from scratch.

### Missing required environment variables

```
pydantic_core._pydantic_core.ValidationError: ... ANTHROPIC_API_KEY
```

One of the three required fields is blank in `.env`. Fill in all three:
`ANTHROPIC_API_KEY`, `POSTGRES_PASSWORD`, `SECRET_KEY`.

### Anthropic rate limits during tests

The dry-run and model eval tests can hit Anthropic rate limits if many tests
run in parallel with real SLM. Run with `-x` (stop on first failure) and
re-run after a short wait. For CI, use fully mocked mode (no `--real-slm`).

### `make dry-run` fails with `ToolFixtureMissing`

The scenario fixture doesn't have a response for the tool that was called.
Switch to a more complete scenario or add an entry to the fixture JSON:
```bash
make dry-run MSG="..." SCENARIO=2bhk_bandra_search
```

Fixture files are in `tests/fixtures/scenarios/`.

### Kafdrop UI not available

Kafdrop only starts with the `dev` profile:
```bash
make up-dev
# then: http://localhost:9000
```

### `pg_isready` not found (scripts/init_db.sh)

Install the PostgreSQL client tools:
```bash
brew install libpq
brew link --force libpq   # adds pg_isready / psql to PATH
```

Alternatively, use `make migrate` directly once Docker's Postgres healthcheck
reports healthy (`docker compose ps postgres` shows `(healthy)`).
