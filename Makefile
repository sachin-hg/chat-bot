.PHONY: setup up down logs migrate seed test test-unit test-int eval \
        health clean shell redis-cli logs-pretty logs-errors logs-cost dry-run \
        agents agents-resume agents-standup agents-bus agents-agent

# ── Python env ────────────────────────────────────────────────────────────
setup:
	@echo "→ Checking .env..."
	@test -f .env || (cp .env.example .env && echo "  Created .env from .env.example — fill in secrets before running")
	@echo "→ Installing dependencies..."
	pip install -r requirements-dev.txt
	@echo "→ Creating Kafka topics (requires Kafka running)..."
	@./scripts/create_kafka_topics.sh || echo "  [skip] Kafka not running — run 'make up' first, then 'make setup' again"

# ── Docker services ───────────────────────────────────────────────────────
up:
	docker compose up -d
	@echo "→ Services started. Run 'make health' to verify."

up-dev:
	docker compose --profile dev up -d  # includes Kafdrop UI on :9000

down:
	docker compose down

down-clean:
	docker compose down --volumes  # destroys all data volumes

logs:
	docker compose logs -f

# ── Database ──────────────────────────────────────────────────────────────
migrate:
	alembic upgrade head

# Seeds 1 conversation + 5 messages for local dev/testing
seed:
	python -m scripts.seed_db

# ── Tests ─────────────────────────────────────────────────────────────────
test:
	pytest tests/ -x -v

test-unit:
	pytest tests/unit/ -x -v

test-int:
	pytest tests/integration/ -x -v --run-integration

# Model eval — requires --real-model flag or uses MockClassifier by default
eval:
	pytest tests/model_eval/ -v

# Dry-run a single pipeline turn without a running server (BOT_ENV=mock)
dry-run:
	@test -n "$(MSG)" || (echo "Usage: make dry-run MSG='show me 2bhk in powai' [SCENARIO=2bhk_bandra_search]" && exit 1)
	BOT_ENV=mock python -m src.tools.dry_run --message "$(MSG)" $(if $(SCENARIO),--scenario $(SCENARIO),)

# ── Health check ──────────────────────────────────────────────────────────
health:
	@echo "→ Checking services..."
	@curl -sf http://localhost:8000/health | python3 -m json.tool || echo "  [down] FastAPI not running"
	@docker compose ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || true

# ── Log inspection ────────────────────────────────────────────────────────
# Requires the FastAPI app to be running and jq to be installed
logs-pretty:
	@command -v jq >/dev/null || (echo "jq not installed: brew install jq" && exit 1)
	uvicorn src.main:app 2>&1 | jq -r '"\(.ts) [\(.level | ascii_upcase)] \(.event)"'

logs-errors:
	@command -v jq >/dev/null || (echo "jq not installed: brew install jq" && exit 1)
	uvicorn src.main:app 2>&1 | jq -r 'select(.level=="error") | "\(.ts) \(.event) \(.error // "")"'

logs-cost:
	@command -v jq >/dev/null || (echo "jq not installed: brew install jq" && exit 1)
	uvicorn src.main:app 2>&1 | jq -r 'select(.event=="llm_call") | "\(.ts)  model=\(.model)  cost_usd=\(.cost_usd)  latency_ms=\(.latency_ms)"'

# ── Shell helpers ─────────────────────────────────────────────────────────
shell:
	PGPASSWORD=$$(grep POSTGRES_PASSWORD .env | cut -d= -f2) \
	    psql -h localhost -p 5433 -U chatbot -d chatbot

redis-cli:
	docker compose exec redis redis-cli

# ── Multi-agent system ────────────────────────────────────────────────────
# Start all agents working on the current sprint (Ctrl+C to pause — state is saved)
agents:
	@test -f .env || (echo "ERROR: .env not found. Copy .env.example and fill in ANTHROPIC_API_KEY." && exit 1)
	set -a && . ./.env && set +a && .venv/bin/python -m agents.run

# Resume after a rate-limit pause or Ctrl+C
agents-resume:
	@test -f .env || (echo "ERROR: .env not found." && exit 1)
	set -a && . ./.env && set +a && .venv/bin/python -m agents.run --resume

# Print standup summary (current ticket + step per agent)
agents-standup:
	set -a && . ./.env 2>/dev/null; set +a && .venv/bin/python -m agents.run --standup

# Print all inter-agent bus messages
agents-bus:
	set -a && . ./.env 2>/dev/null; set +a && .venv/bin/python -m agents.run --bus

# Run a single agent for one cycle (e.g. make agents-agent AGENT=priya)
agents-agent:
	@test -n "$(AGENT)" || (echo "Usage: make agents-agent AGENT=priya" && exit 1)
	set -a && . ./.env && set +a && .venv/bin/python -m agents.run --agent $(AGENT)

# ── Cleanup ───────────────────────────────────────────────────────────────
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	rm -rf htmlcov .coverage
	@echo "→ Cleaned."
