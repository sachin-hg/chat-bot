# Database Operations Runbook

Operational procedures: LLM concurrency gate behaviour, partition maintenance, and degradation handling.

---

## 5. LLM Concurrency Management

1,200 RPS chat × 70% LLM rate = ~840 LLM calls/second needed.
At 120 concurrent + p50 800ms latency: effective throughput = 120 / 0.8 = **150 completions/second**.
Queue absorbs bursts; load is shed when the queue fills.

```python
LLM_MAX_CONCURRENT = 120
LLM_QUEUE_MAX      = 300    # ~2s of burst absorption at 150 completions/sec
LLM_QUEUE_MAX_WAIT = 8_000  # 8s max wait before 503

async def acquire_llm_slot(request_id: str) -> bool:
    """Atomically try to claim an LLM slot. Queue if full. Shed if queue full."""
    lua = """
    local cur = tonumber(redis.call('GET', KEYS[1]) or 0)
    if cur < tonumber(ARGV[1]) then
        redis.call('INCR', KEYS[1])
        return 1
    end
    return 0
    """
    if await redis.eval(lua, 1, 'llm:concurrent:count', LLM_MAX_CONCURRENT):
        return True  # slot acquired

    if await redis.llen('llm:queue') >= LLM_QUEUE_MAX:
        emit_sse('error', {'code': 'rate_limited',
                           'message': 'High demand right now. Please try again.',
                           'recoverable': True, 'retry_after': 3})
        return False

    # Enqueue and wait
    await redis.rpush('llm:queue', json.dumps({'request_id': request_id,
                                               'enqueued_at': time.time()}))
    return await wait_for_llm_slot(request_id, timeout_ms=LLM_QUEUE_MAX_WAIT)

async def release_llm_slot():
    await redis.decr('llm:concurrent:count')
    await redis.publish('llm:slot_available', '1')
```

| Queue depth | Behaviour |
|---|---|
| 0–150 | Normal — LLM slot acquired immediately |
| 150–300 | Queuing — user waits up to 8s; `connection_ack` emitted first so FE shows loading |
| > 300 | Shed — `503 Retry-After: 3` |
| LLM 529 (overloaded) | 1 retry after 300ms → `error` SSE on second failure |

---


## 8. Partition Maintenance

```sql
-- Nightly via pg_cron:
SELECT cron.schedule('0 3 * * *', $$SELECT partman.run_maintenance('public.messages')$$);
-- Creates next 3 months of partitions, drops partitions older than 90 days.
-- DROP TABLE messages_2026_01 is instant — no row scans, no VACUUM, no locks on active data.
```

Partition naming: `messages_YYYY_MM` (e.g. `messages_2026_05`).
Storage reclaimed per drop: ~17.2GB × 30 = ~516GB per monthly partition.

---

