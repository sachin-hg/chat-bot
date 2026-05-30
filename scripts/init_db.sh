#!/bin/bash
# init_db.sh — wait for PostgreSQL then run Alembic migrations.
# Usage: ./scripts/init_db.sh
# Connects to the raw Postgres port (5432), not PgBouncer, because Alembic
# needs DDL transactions that are not compatible with PgBouncer's transaction
# pooling mode.
set -e

echo "→ Waiting for PostgreSQL..."
until pg_isready -h localhost -p 5432 -U chatbot; do sleep 1; done

echo "→ Running migrations..."
cd "$(dirname "$0")/.."
.venv/bin/python -m alembic upgrade head

echo "→ Database ready."
