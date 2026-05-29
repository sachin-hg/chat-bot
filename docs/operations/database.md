# Database — Index

All database documentation is split by audience. Start with the doc that matches what you're trying to do.

| Doc | Audience | What's in it |
|---|---|---|
| [db-schema.md](db-schema.md) | Developers | PostgreSQL schema, Redis key design, Kafka topics, write path, anonymous→login migration |
| [db-capacity.md](db-capacity.md) | Infrastructure / planning | Traffic model, storage projections, instance sizing, connection pools |
| [db-decisions.md](db-decisions.md) | Architects / new team members | Why these databases, mental model, QnA decision framework for reassessing when numbers change |
| [db-operations.md](db-operations.md) | On-call / SRE | LLM concurrency gate, partition maintenance, graceful degradation |
| [db-migration.md](db-migration.md) | Engineers executing a migration | Live migration from Postgres-only → Postgres + MongoDB split, rollback at each phase |

## Quick summary

**Three stores, each with a distinct job:**

```
PostgreSQL  — The ledger. All persistent chat data (conversations + messages).
              Single query for history loads. Monthly partitions for retention.

Redis       — Working memory. Session state, LLM concurrency gate, tool cache.
              Fast, ephemeral. Loss only affects in-flight sessions.

Kafka       — The delivery truck. Async write pipeline.
              Decouples SSE latency from DB write latency.
```

**MongoDB is in prod at Housing.com but not used for this service** at current template volume (~15GB/day). The decision framework in [db-decisions.md](db-decisions.md) specifies the threshold at which the split becomes worthwhile (> 1TB/month content) and the migration playbook in [db-migration.md](db-migration.md) covers how to execute it with zero downtime.
