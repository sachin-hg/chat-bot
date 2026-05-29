# Database Migration Playbook

Step-by-step guide for migrating from the current PostgreSQL-only approach to a PostgreSQL + MongoDB split when Section 13 thresholds are crossed.

Read [db-decisions.md → Decision Framework](db-decisions.md) before starting — confirm a threshold is actually breached.

---

## 14. Migration Playbook — PostgreSQL → PostgreSQL + MongoDB Split

This is a live migration with zero downtime. All steps are reversible until Phase 6.

**Trigger condition:** One or more Q1–Q4 thresholds from Section 13 are breached.

---

### Phase 1 — Deploy MongoDB writer (parallel write, no read change)

Add a second Kafka consumer group (`chat-mongo-writer`) that:
- Reads from `chat.messages` topic (same as existing group)
- Filters for `message_type = 'template'` rows only
- Inserts template payloads into MongoDB `messages_content` collection

Postgres consumer continues writing everything as before. MongoDB write starts accumulating.

```
Status after Phase 1:
  Postgres:  all rows (text + templates in content JSONB)
  MongoDB:   template rows only, going forward from deployment date
  Read path: unchanged (still Postgres-only)
```

**Validation gate:** Verify MongoDB write rate matches Kafka template row rate. Check for dedup correctness. Let this run for 48h before Phase 2.

---

### Phase 2 — Add `content_ref` column to Postgres (non-breaking)

```sql
ALTER TABLE messages ADD COLUMN content_ref UUID;
-- NULL for all existing rows. No data migration yet.
-- No index yet — only add when reads switch over.
```

Update the Kafka Postgres consumer to also populate `content_ref` for new template rows (same UUID as the MongoDB `_id`):
```python
if row.message_type == 'template':
    row.content_ref = row.content_data['_id']   # same UUID written to both stores
```

```
Status after Phase 2:
  Postgres: all rows; template rows have content_ref AND content (both set)
  MongoDB:  template rows from Phase 1 onwards
  Read path: unchanged
```

---

### Phase 3 — Backfill historical MongoDB documents

For template rows older than Phase 1 deployment, backfill MongoDB from Postgres:

```python
# Run as a background job, off-peak hours
# Process in batches of 1,000 rows per partition

for partition in monthly_partitions_after_cutoff:
    for batch in pg.stream("""
        SELECT message_id, conversation_id, template_id, content, created_at
          FROM {partition}
         WHERE message_type = 'template'
           AND content_ref IS NULL
    """):
        docs = [{'_id': row.message_id, 'conversation_id': row.conversation_id,
                 'template_id': row.template_id, 'content': row.content['data'],
                 'created_at': row.created_at}
                for row in batch]
        mongo.messages_content.insert_many(docs, ordered=False)

        pg.execute("""
            UPDATE {partition}
               SET content_ref = message_id
             WHERE message_id = ANY($1)
               AND message_type = 'template'
        """, [row.message_id for row in batch])
```

**Important:** The UPDATE on historical partitions WILL generate VACUUM work. Run this during low-traffic periods. Monitor autovacuum.

**Validation gate:** `SELECT COUNT(*) FROM messages WHERE message_type = 'template' AND content_ref IS NULL` returns 0 before proceeding.

---

### Phase 4 — Switch reads to use MongoDB for template rows

Update the history load query handler:

```python
# Before (Postgres-only)
rows = await pg.fetch("SELECT ... content ... FROM messages WHERE ...")
return rows

# After (hybrid read)
rows = await pg.fetch("SELECT ... content_ref, content ... FROM messages WHERE ...")

template_refs = [row['content_ref'] for row in rows if row['content_ref']]
if template_refs:
    docs = await mongo.messages_content.find(
        {'_id': {'$in': template_refs}}, {'content': 1}
    ).to_list()
    content_map = {str(d['_id']): d['content'] for d in docs}

for row in rows:
    if row['content_ref']:
        row['content'] = {'templateId': row['template_id'],
                          'data': content_map.get(str(row['content_ref']), {})}
```

Deploy behind a feature flag. A/B test: compare history load latency Postgres-only vs hybrid. If latency is acceptable, roll out to 100%.

**Rollback:** Disable feature flag. Reads fall back to Postgres-only. Postgres still has `content` intact.

---

### Phase 5 — Null out Postgres content for template rows (storage reclaim)

Only do this after Phase 4 is fully stable and rolled out. **This step is destructive.**

```sql
-- Null out content for template rows, partition by partition
-- Run during maintenance window; generates VACUUM work
UPDATE messages_2026_01
   SET content = '{}'::jsonb    -- or NULL if column allows
 WHERE message_type = 'template'
   AND content_ref IS NOT NULL;

-- Re-run pg_partman maintenance to trigger VACUUM on modified partition
SELECT partman.run_maintenance('public.messages');
```

**After Phase 5:** Storage reclaim begins. Each partition drops from ~516GB to ~50GB as template JSONB is cleared. Autovacuum reclaims the freed space.

---

### Phase 6 — Cleanup (optional, do after 30 days stable)

- Remove Postgres consumer's template content write (no longer write `content` for template rows)
- Keep `content_ref` column and index as the permanent pattern
- Update `CONSTRAINT chk_content_xor` to enforce the split at DB level

---

### Rollback at each phase

| Phase | Rollback |
|---|---|
| Phase 1 | Stop `chat-mongo-writer` consumer group. No Postgres change. |
| Phase 2 | `ALTER TABLE messages DROP COLUMN content_ref;`. No data loss. |
| Phase 3 | No rollback needed — backfill is additive only. |
| Phase 4 | Disable feature flag. Reads use Postgres. |
| Phase 5 | **Cannot rollback** — Postgres content has been cleared. Only roll to Phase 5 when MongoDB is proven stable for 30+ days. |

---

### Reverse migration — MongoDB → Postgres-only (if numbers drop)

If template frequency drops significantly (e.g. templates move out of scope, or product changes):

1. Re-populate `content` from MongoDB for all rows with `content_ref` (reverse of Phase 3)
2. Stop `chat-mongo-writer` consumer
3. Switch reads back to Postgres-only (reverse Phase 4)
4. `ALTER TABLE messages DROP COLUMN content_ref`
5. Decommission MongoDB collection

This is simpler than the forward migration because you're going back to "one database."
