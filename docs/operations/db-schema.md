# Database Schema

Schemas for all persistent stores: PostgreSQL (conversations + messages), Redis (session state + cache), Kafka (async write pipeline).

See [db-capacity.md](db-capacity.md) for sizing, [db-decisions.md](db-decisions.md) for why these choices were made.

---

## 2. PostgreSQL Schema

### Design principles

- `conversations` and `messages` are the **sole** durable store. No secondary database.
- `content` JSONB stores the **full payload** for every row — text messages, template cards, user actions. Max ~100KB, well within JSONB's limits.
- **Messages are append-only.** Content is never updated after insert. VACUUM has nothing to do here.
- `messages` is **monthly-partitioned** — drop old partitions for 90-day retention. `DROP TABLE messages_2026_02` is instant regardless of row count. Never row-by-row DELETE.
- No foreign key from `messages` to `conversations` across partition boundaries — enforced at application level for performance.
- Write path is async via Kafka consumer — PostgreSQL never touches the SSE hot path.

```sql
-- ── Extensions ────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_partman"; -- partition management
CREATE EXTENSION IF NOT EXISTS "pg_cron";    -- nightly maintenance job

-- ── Enums ─────────────────────────────────────────────────────────────
CREATE TYPE conversation_status   AS ENUM ('active', 'ended', 'migrated');
CREATE TYPE message_type_enum     AS ENUM (
    'text', 'markdown', 'template',
    'user_action', 'context', 'analytics'
);
CREATE TYPE sender_type_enum      AS ENUM ('user', 'bot', 'system');
CREATE TYPE message_state_enum    AS ENUM (
    'IN_PROGRESS', 'COMPLETED',
    'CANCELLED_BY_USER', 'ERRORED_AT_ML'
);
CREATE TYPE transaction_type_enum AS ENUM ('buy', 'rent');

-- ── conversations ──────────────────────────────────────────────────────
-- One row per chat session. Lightweight — no message content stored here.
-- Serves the history sidebar: list of past conversations, sorted by recency.
CREATE TABLE conversations (
    conversation_id    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            TEXT,                        -- NULL for anonymous users
    token_id           TEXT        NOT NULL,        -- houzy_token cookie value
    status             conversation_status NOT NULL DEFAULT 'active',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    turn_count         SMALLINT    NOT NULL DEFAULT 0,
    -- Denormalised for fast sidebar rendering without joining messages
    last_intent        TEXT,                        -- e.g. 'filter_search'
    city               TEXT,
    transaction_type   transaction_type_enum,
    preview            TEXT                         -- first user message, max 120 chars
);

CREATE INDEX idx_conversations_user_id
    ON conversations (user_id, updated_at DESC)
    WHERE user_id IS NOT NULL;

CREATE INDEX idx_conversations_token_id
    ON conversations (token_id, updated_at DESC);

-- ── messages (partitioned by month) ───────────────────────────────────
-- One row per chat_event persisted to DB. All content lives here — no
-- secondary database needed on history load.
--
-- content JSONB: full payload for every row.
--   Text rows:     {"text": "show me 2bhk in powai"}              ~300B
--   Template rows: {"templateId": "property_carousel",
--                   "data": {"properties": [...], ...}}           15–100KB
--   user_action:   {"action": "contact_seller_confirmed", ...}    ~500B
--
-- Append-only — content never updated. Zero VACUUM overhead on content column.
-- Monthly partitions dropped to handle 90-day retention.
CREATE TABLE messages (
    message_id         UUID        NOT NULL,
    conversation_id    UUID        NOT NULL,
    sender_type        sender_type_enum NOT NULL,
    message_type       message_type_enum NOT NULL,
    message_state      message_state_enum NOT NULL DEFAULT 'COMPLETED',
    sequence_number    SMALLINT,                    -- 0-based per turn; NULL for user rows
    source_message_id  UUID,                        -- links bot response → user message
    template_id        TEXT,                        -- denormalised for fast template filtering
    request_id         UUID,                        -- distributed tracing
    content            JSONB       NOT NULL,        -- full payload, max ~100KB
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- created_at must be in PK for declarative partitioning
    PRIMARY KEY (message_id, created_at)
) PARTITION BY RANGE (created_at);

-- Monthly partitions: pg_partman creates them 3 months ahead, drops after 90 days
SELECT partman.create_parent(
    p_parent_table => 'public.messages',
    p_control      => 'created_at',
    p_type         => 'native',
    p_interval     => 'monthly',
    p_premake      => 3
);

UPDATE partman.part_config
   SET retention               = '90 days',
       retention_keep_table    = FALSE   -- DROP (not just detach)
 WHERE parent_table = 'public.messages';

-- Indexes (inherited by all partitions)
CREATE INDEX idx_messages_conversation_created
    ON messages (conversation_id, created_at DESC);
    -- Used by every history page load

CREATE INDEX idx_messages_source_message
    ON messages (source_message_id)
    WHERE source_message_id IS NOT NULL;
    -- Used to link bot responses back to user messages

-- ── Trigger: keep conversations.updated_at and turn_count current ─────
CREATE OR REPLACE FUNCTION fn_update_conversation_on_message()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE conversations
       SET updated_at  = NEW.created_at,
           turn_count  = turn_count + CASE
                             WHEN NEW.sender_type = 'user' THEN 1
                             ELSE 0
                         END
     WHERE conversation_id = NEW.conversation_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_messages_update_conversation
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION fn_update_conversation_on_message();
```

### What a history page load looks like

**One query. One round trip.**

```sql
-- Sidebar: list of conversations
SELECT conversation_id, preview, city, transaction_type,
       last_intent, turn_count, created_at, updated_at
  FROM conversations
 WHERE user_id = $1              -- or token_id = $1 for anonymous
 ORDER BY updated_at DESC
 LIMIT 20;

-- Open a conversation (cursor-based pagination)
SELECT message_id, message_type, sender_type, message_state,
       sequence_number, source_message_id, template_id,
       content, created_at
  FROM messages
 WHERE conversation_id = $1
   AND created_at < $2           -- cursor = messagesBefore value
 ORDER BY created_at DESC
 LIMIT 20;
```

The `content` JSONB for text messages is ~300 bytes. For a property carousel it's ~40KB. The full 20-row page might be 300–400KB total — fetched in a single round trip, no stitching.

---

## 3. Redis Schema

Redis handles everything that must be fast, ephemeral, or shared across application pods.

```
# ── Session state (hot, per active conversation) ───────────────────────
session:{session_id}
    Type: JSON string
    Value: { user_id, conversation_id, city, transaction_type,
              active_filters, last_intent, last_domain, turn_count,
              active_property_id, active_locality_id, active_project_id,
              auth_token, search_history }
    TTL:  24h (refreshed on every turn)
    Size: ~5KB max

conv:context:{conversation_id}
    Type: JSON string
    Value: { resolved_entity_map, active_filters, pagination_state,
              srset_id, last_carousel_ids }
    TTL:  24h (re-seeded from PostgreSQL on cache miss)
    Size: ~3KB

conv:turns:{conversation_id}
    Type: List (LPUSH + LTRIM 0 19)
    Value: last 20 serialised turn summaries for LLM context
    TTL:  7d
    Size: ~40KB max

conv:summary:{conversation_id}
    Type: String
    Value: Haiku-generated compressed summary (≤ 250 tokens)
    TTL:  7d
    Size: ~500 bytes

# ── LLM concurrency gate ───────────────────────────────────────────────
llm:concurrent:count
    Type: String (atomic integer via INCR / DECR)
    Value: current number of in-flight LLM calls
    TTL:  none (persistent, decremented on completion or timeout)

llm:queue
    Type: List (RPUSH enqueue, BLPOP dequeue)
    Value: serialised { request_id, session_id, enqueued_at, max_wait_ms }
    Max length: 300 (excess → 503 with Retry-After)

# ── Rate limiting ──────────────────────────────────────────────────────
ratelimit:chat:{token_id}
    Type: String (counter), TTL: 60s
    Limit: 60 messages/minute (anonymous), 120/minute (logged-in)

ratelimit:llm:{token_id}
    Type: String (counter), TTL: 60s
    Limit: 10 LLM calls/minute (abuse prevention)

# ── SLM classification cache ───────────────────────────────────────────
slm:cache:{sha256(message + last_intent + compact_filters)}
    Type: JSON string, TTL: 5 minutes
    Only cache: confidence ≥ 0.90 AND pivot = false

# ── Tool result cache ──────────────────────────────────────────────────
cache:tool:property:{property_id}              TTL: 15 min
cache:tool:locality:{city_uuid}:{locality_id}  TTL: 1h
cache:tool:price_trends:{city}:{locality}      TTL: 6h
cache:tool:project:{project_id}                TTL: 30 min
cache:tool:floor_plans:{property_id}           TTL: 1h
cache:tool:trending:{city_uuid}                TTL: 30 min
cache:tool:landmarks:{property_id}             TTL: 24h
cache:tool:saved:{user_id}                     TTL: 60s (invalidated on shortlist write)
cache:tool:viewed:{user_id}                    TTL: 60s

# ── A/B experiment assignment ──────────────────────────────────────────
exp:assign:{session_id}:{experiment_id}
    Type: String, TTL: 24h
    Value: variant_id (deterministic hash — same value if recomputed)

# ── Kafka consumer deduplication ───────────────────────────────────────
kafka:dedup:{message_id}
    Type: String ("1"), TTL: 300s
```

### Redis sizing

```
Active sessions:      120 concurrent × 8KB               =    ~1MB
Turn history:         120 concurrent × 40KB               =    ~5MB
Tool cache:           ~10,000 entries × 20KB avg          =  ~200MB
SLM cache:            ~1,000 entries × 1KB                =    ~1MB
LLM queue + counters: negligible
Overhead + buffers:                                       =  ~800MB
───────────────────────────────────────────────────────
Total active data:                                        ~1.2GB

Recommended: Redis Cluster, 3 primary + 3 replica nodes
  Each node: r7g.large (2 vCPU, 13GB RAM)
  Total capacity: ~78GB — ~65× headroom (intentional: Redis failure = broken UX)
  Hash tags on {conversation_id} ensure session keys land on the same shard
```

---

## 4. Kafka Topics

Kafka decouples the SSE response path from database writes. Application writes to Kafka and the SSE stream continues — PostgreSQL writes happen asynchronously.

```
Topic: chat.messages
  Partitions: 12 (keyed by conversation_id — order preserved per conversation)
  Replication factor: 3
  Retention: 24h
  Payload (text rows):     { message_id, conversation_id, message_type, sender_type,
                             message_state, sequence_number, source_message_id,
                             template_id, content, request_id, created_at }
                             avg ~2KB per message

  Payload (template rows): same shape — content field contains the full 40–100KB
                           template payload

  Peak throughput:
    Text rows:     ~3,800/sec × ~2KB     = ~7.6MB/sec
    Template rows: ~400/sec  × ~46KB     = ~18.4MB/sec
    Total:                               = ~26MB/sec

  Note: Kafka handles 100MB/sec+ per broker. Well within shared cluster capacity.

Topic: chat.session_events
  Partitions: 6, Replication: 3, Retention: 24h
  Payload: { event_type, conversation_id, session_id, turn_count,
             last_intent, city, transaction_type, occurred_at }
  Peak: ~1,200 events/sec

Topic: chat.metrics
  Partitions: 6, Replication: 2 (analytics — tolerate minor loss)
  Retention: 7d
  Payload: NodeMetrics + LLMCallMetrics (cost, latency, experiment tags)
  Consumer: analytics pipeline

Topic: chat.llm_summaries
  Partitions: 3, Replication: 3, Retention: 1h
  Payload: { conversation_id, turns_to_summarise: [...] }
  Consumer: async summarisation worker
```

### Kafka consumer (single consumer group)

```python
class ChatDbWriter:
    """Single consumer group writes all message types to PostgreSQL."""
    BATCH_SIZE   = 500
    BATCH_MAX_MS = 100

    async def process_batch(self, records: list[ConsumerRecord]):
        # Deduplicate
        unique = [r for r in records
                  if not await redis.exists(f'kafka:dedup:{r.message_id}')]
        if not unique:
            return

        # Bulk INSERT — ON CONFLICT DO NOTHING for safety
        await pg.executemany("""
            INSERT INTO messages
              (message_id, conversation_id, sender_type, message_type,
               message_state, sequence_number, source_message_id,
               template_id, request_id, content, created_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            ON CONFLICT DO NOTHING
        """, [r.to_row() for r in unique])

        # Mark dedup keys (5-minute window)
        pipe = redis.pipeline()
        for r in unique:
            pipe.setex(f'kafka:dedup:{r.message_id}', 300, '1')
        await pipe.execute()
```

One consumer group, one write path, one database. No stitching, no coordination between consumers.

---


## 7. Write Path (Async via Kafka)

```
User message arrives (POST /chat/send-message)
        │
        ▼
FastAPI handler
  1. Load session from Redis (~1ms)                      ← blocking: pipeline needs context
  2. Publish user message → Kafka (chat.messages)        ← fire-and-forget
  3. Run LangGraph pipeline → SSE stream to FE           ← ~800ms–4s
  4. Publish bot messages → Kafka (chat.messages)        ← fire-and-forget
     (includes template payloads up to 100KB in content field)
  5. HTTP response stream closes

Kafka consumer (chat-db-writer, 3 replicas):
  1. Accumulate 500 messages or 100ms
  2. Dedup check (Redis)
  3. Bulk INSERT to PostgreSQL messages
  4. Mark dedup keys in Redis
  5. Commit offset

Kafka consumer (chat-session-events):
  1. session_start  → INSERT into conversations
  2. turn_complete  → UPDATE conversations (turn_count, updated_at, last_intent)
  3. session_end    → UPDATE conversations SET status = 'ended'
```

**Why not write synchronously?**
At 1200 RPS: 4,200 INSERT ops/second on the critical path. Each INSERT ~2–5ms. Under load, Postgres write latency spikes to 20–50ms → SSE stream latency spike → user perceives lag. Kafka consumer batches to ~500 rows per INSERT cycle, runs asynchronously, and completely decouples user-facing latency from write throughput.

**Durability tradeoff:** Kafka `acks=all` — message is durable in Kafka before the handler gets an ack. If a pod dies after Kafka ack but before SSE delivery: Kafka consumer writes to Postgres anyway. If pod dies after SSE but before Kafka ack: message lost (< 1s window). Acceptable for chat history.

---


## 9. Anonymous → Logged-in Migration

`conversation_id` is never replaced. Only `user_id` is backfilled when the user logs in.

```sql
UPDATE conversations
   SET user_id    = $1,      -- logged-in user_id
       updated_at = NOW()
 WHERE token_id = $2
   AND user_id IS NULL;
```

```python
# Redis session patch (in-place — no new session)
session = json.loads(await redis.get(f'session:{session_id}'))
session['user_id']    = new_user_id
session['auth_token'] = new_auth_token
await redis.setex(f'session:{session_id}', 86400, json.dumps(session))
```

---

