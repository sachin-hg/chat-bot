# Database Capacity Planning

Traffic model, storage projections, and infrastructure sizing for all stores.

See [db-schema.md](db-schema.md) for schemas, [db-decisions.md](db-decisions.md) for when to revisit these numbers.

---

## 1. Traffic Model

### Daily baseline

| Metric | Value | Derivation |
|---|---|---|
| Messages/day | 1,000,000 | stated requirement |
| Average RPS | ~11.6 | 1M / 86,400s |
| Peak RPS (chat submissions) | 1,200 | stated spike |
| Peak multiplier | ~103× | 1200 / 11.6 |
| Concurrent LLM calls (capacity limit) | 120 | stated |

### Per-turn row generation

Each user turn generates on average **~3.5 rows**:

| Row type | Frequency | Size |
|---|---|---|
| User message | Every turn | ~300 bytes |
| Phase 1 summary (text) | ~60% of turns | ~200 bytes |
| Phase 2 template event | ~25% of turns × 1.3 avg | **40–100KB** |
| Phase 3 followup text | ~80% of turns | ~600 bytes |

Template events are ~25% of turns — roughly 7–8 templates in a 30-turn conversation (property carousels, locality carousels, floor plan galleries). The rest of the conversation is pure text.

| Metric | Value |
|---|---|
| Rows written/day | ~3.5M |
| Template events/day | ~325K |
| Template content/day | ~15GB raw (325K × 46KB avg) |
| Text + metadata content/day | ~2GB |
| **Total content writes/day** | **~17GB** |
| 90-day total (raw) | ~1.53TB |
| 90-day total (with WAL, indexes, bloat ~40%) | **~2.1TB** |

---


## 6. Capacity Planning

### Application servers (FastAPI + LangGraph)

```
Per pod: 2 vCPU, 4GB RAM → handles ~175 RPS (async, I/O bound)
At 1200 RPS: 1200 / 175 = ~7 pods needed
Recommendation: min=3, max=12 (HPA on CPU + request latency)
Instance: c7g.xlarge (4 vCPU, 8GB) — headroom for GC, startup, connection pools
```

### PostgreSQL

```
Writes: ~4,200 rows/sec peak via Kafka batches of 500
Reads:  ~60 history page loads/sec (never on the LLM hot path)

Storage growth:
  ~17GB/day raw content + ~0.2GB/day metadata = ~17.2GB/day
  90-day raw: ~1.55TB
  With WAL, indexes, bloat (+40%): ~2.2TB steady state

Partition drops free ~17.2GB × 30 = ~516GB per monthly partition dropped.

Primary:      r7g.2xlarge (8 vCPU, 64GB RAM) + 2.5TB gp3 SSD
Read replica: r7g.xlarge  (4 vCPU, 32GB RAM) + 2.5TB gp3 SSD

64GB RAM: shared_buffers = 16GB (covers active partition hot rows)
          effective_cache_size = 48GB
PgBouncer: transaction mode, 100 server connections (primary) + 50 (replica)
```

### Redis

```
Active data: ~1.2GB (see Section 3)
Peak ops/sec: ~7,300 (session R/W + tool cache + LLM gate + rate limiting)
Redis handles 100K+ ops/sec — not the bottleneck.

Cluster: 3 primary + 3 replica × r7g.large (13GB each) = ~78GB total
```

### Kafka

```
Peak throughput: ~26MB/sec on chat.messages
Partition count: 12 — 12 parallel consumer instances
Consumer replicas: 3 (chat-db-writer group)
Lag alert: > 10,000 messages → page on-call
```

### Storage summary

| Store | Daily write | 90-day steady state | Instance |
|---|---|---|---|
| PostgreSQL | ~17.2GB/day | ~2.2TB | r7g.2xlarge + 2.5TB gp3 |
| Redis | ~1.2GB active | ~1.2GB TTL-bounded | 3× r7g.large cluster |
| Kafka | ~26MB/sec peak | 24h retention only | Shared cluster |

---


## 10. Connection Pool Sizing

```python
# PostgreSQL via PgBouncer (transaction mode)
PG_POOL_SIZE    = 10   # per app pod; 10 × 12 pods = 120 → PgBouncer queues the rest
PG_MAX_OVERFLOW = 5
PG_TIMEOUT_S    = 5    # give up after 5s (should never hit under normal load)

# Redis Cluster (async client, one pool per shard)
REDIS_POOL_SIZE = 20   # per pod
```

Kafka consumer (chat-db-writer) is a separate deployment — 3 replicas, each with 1 PgBouncer connection for bulk batch inserts.

---

