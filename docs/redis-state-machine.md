# Redis State Machine — Housing.com Chat Platform

## Overview

The state machine governs every conversation session. It lives in Redis (hot, authoritative) and is mirrored to PostgreSQL (durable, queryable). Every routing decision — bot vs. P2P, which tools to load, whether to deliver to a WS node or push to Kafka — is derived from session state in Redis.

**Design goals:**
- State transitions must be atomic. No half-states.
- Any WS node must be able to reconstruct full session context from Redis alone (for reconnect handling).
- State must have appropriate TTLs — idle sessions should not leak memory.
- Concurrent transition attempts (e.g., two sellers contact the same buyer simultaneously) must be safe.

---

## State Definitions

```
LANDING              Initial state. No conversation started.
BOT_ACTIVE           User is chatting with the AI bot.
FILTER_REFINE        User is narrowing search within bot session (substatus of BOT_ACTIVE).
PROPERTY_SELECTED    User has selected a property; bot is in detail/exploration mode.
CONTACT_SELLER       User initiated seller contact; waiting for handshake.
P2P_ACTIVE           Full P2P session between buyer and seller.
P2P_BOT_ASSIST       P2P active with bot available as a side panel.
SUPPORT_INITIATED    User triggered support flow.
SUPPORT_BOT          Bot handling support query.
HUMAN_SUPPORT        Support escalated to human agent.
ENDED                Conversation closed.
```

### Valid Transitions

```
LANDING            → BOT_ACTIVE
BOT_ACTIVE         → FILTER_REFINE
BOT_ACTIVE         → PROPERTY_SELECTED
BOT_ACTIVE         → SUPPORT_INITIATED
BOT_ACTIVE         → ENDED
FILTER_REFINE      → BOT_ACTIVE          (filter cleared / new search)
FILTER_REFINE      → PROPERTY_SELECTED
PROPERTY_SELECTED  → BOT_ACTIVE          (back to search)
PROPERTY_SELECTED  → CONTACT_SELLER
PROPERTY_SELECTED  → SUPPORT_INITIATED
CONTACT_SELLER     → P2P_ACTIVE          (seller accepts / auto-connect)
CONTACT_SELLER     → BOT_ACTIVE          (seller offline > timeout, user goes back)
P2P_ACTIVE         → P2P_BOT_ASSIST      (user opens bot panel)
P2P_ACTIVE         → ENDED
P2P_BOT_ASSIST     → P2P_ACTIVE          (user closes bot panel)
P2P_BOT_ASSIST     → ENDED
SUPPORT_INITIATED  → SUPPORT_BOT
SUPPORT_BOT        → BOT_ACTIVE          (resolved, user continues property search)
SUPPORT_BOT        → HUMAN_SUPPORT       (escalation triggered)
SUPPORT_BOT        → ENDED
HUMAN_SUPPORT      → BOT_ACTIVE          (agent resolves, hands back)
HUMAN_SUPPORT      → ENDED
```

Any attempt to transition outside this table is rejected.

---

## Complete Redis Key Space

### 1. Session (per WS connection)

```
KEY:   session:{session_id}
TYPE:  Hash
TTL:   24 hours (refreshed on every message)

Fields:
  user_id           string
  conversation_id   string
  state             string       (one of the state enum values)
  ws_node_id        string       (which WS server holds this connection)
  connected_at      int64        (epoch ms)
  last_active_at    int64        (epoch ms)
  platform          string       ("web" | "android" | "ios")
```

One session per WS connection. A user can have multiple active sessions (multiple tabs/devices). Each has its own `session_id`.

---

### 2. User Sessions Index (reverse lookup)

```
KEY:   user:sessions:{user_id}
TYPE:  Set
TTL:   24 hours

Members: session_id strings

Purpose: When we need to broadcast to all of a user's devices
         (e.g., "mark all as read"), we look up all their session_ids.
```

---

### 3. Conversation State (per conversation)

```
KEY:   conv:state:{conversation_id}
TYPE:  Hash
TTL:   7 days (refreshed on any activity)

Fields:
  state                 string       (authoritative state, same as in session)
  user_id               string
  mode                  string       ("BOT" | "P2P" | "SUPPORT")
  transaction_type      string       ("rent" | "buy")
  city                  string
  property_selected_id  string       (set when PROPERTY_SELECTED)
  seller_id             string       (set when CONTACT_SELLER or P2P_ACTIVE)
  agent_id              string       (set when HUMAN_SUPPORT)
  srset_id              string       (active search result set ID)
  support_ticket_id     string       (set when support flow active)
  created_at            int64
  updated_at            int64
  state_entered_at      int64        (when current state was entered)
```

---

### 4. Active Filters (per conversation)

```
KEY:   conv:filters:{conversation_id}
TYPE:  Hash
TTL:   7 days

Fields: (all optional, reflect current active search filters)
  bhk               string    JSON array "[2,3]"
  price_min         string    "50000"
  price_max         string    "80000"
  localities        string    JSON array '["Bandra","Andheri West"]'
  property_type     string    "apartment"
  furnishing        string    "furnished"
  amenities         string    JSON array '["gym","parking"]'
  facing            string    "east"
  verified_only     string    "true"
  sort_by           string    "price_asc"
```

Separate from conversation state hash for cleaner updates. The LLM calls `applyFilter`, which updates only the delta keys.

---

### 5. Conversation Turns (LLM context window)

```
KEY:   conv:turns:{conversation_id}
TYPE:  List
TTL:   7 days

Structure: Each element is a JSON string:
  {
    "role": "user" | "assistant",
    "content": "...",
    "tool_calls": [...],     // if assistant turn had tool calls
    "tool_results": [...],   // if assistant turn had tool results (truncated)
    "timestamp": 1234567890,
    "message_id": "..."
  }

Operations:
  Add turn:    LPUSH conv:turns:{id} <json>
  Trim to 20:  LTRIM conv:turns:{id} 0 39    (20 turns = 20 pairs ≈ 40 elements)
  Read all:    LRANGE conv:turns:{id} 0 -1
```

The list is ordered newest-first (LPUSH). When building LLM context, read all and reverse.

---

### 6. Conversation History Summary (compressed)

```
KEY:   conv:summary:{conversation_id}
TYPE:  String (JSON)
TTL:   7 days

Content:
  {
    "summary": "User is looking for 2BHK rental in Mumbai...",
    "turns_covered": 24,
    "generated_at": 1234567890,
    "intent_signals": ["prefers metro", "budget conscious", "BKC office"]
  }

Written by: async summarization job when turn count exceeds 20
Read by:    Bot Orchestrator when building system prompt section 4
```

---

### 7. Viewed Properties (per conversation)

```
KEY:   conv:viewed:{conversation_id}
TYPE:  ZSet (sorted set)
TTL:   7 days

Score:    timestamp (epoch ms) of when property was viewed
Member:   property_id string

Purpose:  Injected into session state for LLM context.
          Prevents bot from re-suggesting already-seen properties.
          getSimilarProperties tool uses this for exclusion.

Add:      ZADD conv:viewed:{id} {timestamp} {property_id}
Read:     ZRANGE conv:viewed:{id} 0 -1 (all viewed, sorted by time)
```

---

### 8. Presence (per user)

```
KEY:   presence:{user_id}
TYPE:  Hash
TTL:   5 minutes (must be refreshed by heartbeat every 30s)

Fields:
  status        string    "online" | "away" | "offline"
  ws_node_id    string
  last_seen     int64     (epoch ms)
  platform      string

Heartbeat: WS server sends HSET presence:{user_id} last_seen {now} every 30s.
           TTL reset to 5min on each heartbeat.
           If key expires → user is effectively offline.
```

---

### 9. P2P Conversation Participants

```
KEY:   p2p:participants:{conversation_id}
TYPE:  Hash
TTL:   30 days

Fields (one per participant):
  {user_id}:role       string    "BUYER" | "SELLER"
  {user_id}:joined_at  int64

Example:
  "usr_abc:role"     → "BUYER"
  "usr_abc:joined_at"→ "1716320000000"
  "usr_xyz:role"     → "SELLER"
  "usr_xyz:joined_at"→ "1716320150000"
```

---

### 10. Typing Indicators

```
KEY:   typing:{conversation_id}:{user_id}
TYPE:  String ("1")
TTL:   3 seconds

Lifecycle:
  User starts typing → SET typing:{conv_id}:{user_id} 1 EX 3
  User sends message → DEL typing:{conv_id}:{user_id}
  Key expires        → user stopped typing (no explicit "stopped" event needed)

WS server polls (or subscribes to keyspace notifications) to detect expiry
and emits p2p_typing: { user_id, is_typing: false } frame to other participant.
```

Using TTL expiry instead of an explicit "stopped typing" message means the client code is simpler — there's no need to debounce and send a stop event. The key just expires.

---

### 11. Message Deduplication

```
KEY:   dedup:{message_id}
TYPE:  String ("1")
TTL:   24 hours

Set atomically on first processing:
  SET dedup:{message_id} 1 NX EX 86400

If SET returns nil → message already processed → return existing ack, skip processing.
If SET returns OK  → first time seen → process normally.
```

UUID v7 is used for `message_id` — time-sorted, globally unique, no coordination needed.

---

### 12. Support Agent Queue

```
KEY:   support:queue:{tier}
TYPE:  ZSet
TTL:   none (persistent)

Score:    priority score (lower = more urgent)
          priority = timestamp_ms - (priority_boost * 60000)
          priority_boost factors:
            paid_user:        +30 min boost
            payment_dispute:  +60 min boost
            sentiment < -0.8: +45 min boost
            vip_user:         +90 min boost

Member:   conversation_id

Tiers:    "standard" | "priority" | "vip"

Agent claims:
  ZPOPMIN support:queue:vip 1        // claim highest priority from vip queue first
  ZPOPMIN support:queue:priority 1   // then priority
  ZPOPMIN support:queue:standard 1   // then standard
```

---

### 13. Bot In-Progress Flag (for reconnect recovery)

```
KEY:   bot:inprogress:{conversation_id}
TYPE:  Hash
TTL:   30 seconds

Fields:
  started_at      int64
  user_message_id string    (the message that triggered this generation)
  ws_node_id      string    (which node started the generation)

Set:    when Bot Orchestrator starts LLM call
Delete: when bot_complete frame is emitted

On client reconnect:
  Server checks if this key exists.
  If yes → bot generation is in-flight on another node → wait for completion
           or restart generation if ws_node_id is dead (heartbeat check).
  If no  → safe to serve from history.
```

---

### 14. Rate Limiting (per user)

```
KEY:   ratelimit:bot:{user_id}:{minute_window}
TYPE:  String (counter)
TTL:   60 seconds

Increment: INCR ratelimit:bot:{user_id}:{current_minute}
           Set TTL on first increment: EXPIRE ... 60

Limits:
  Bot messages:    30 per minute per user
  P2P messages:   120 per minute per user (more lenient)
  contactSeller:   5 per hour per user (prevent spam)
```

---

## State Transition Implementation

### Atomic Transition with Lua Script

Transitions must be atomic: read current state, validate, write new state, publish event — all in one Redis operation. A Lua script guarantees atomicity (Redis executes Lua scripts as a single transaction).

```lua
-- transition.lua
-- KEYS[1] = conv:state:{conversation_id}
-- ARGV[1] = expected current state (or "*" for any)
-- ARGV[2] = new state
-- ARGV[3] = updated_at (epoch ms)
-- ARGV[4] = transition payload JSON (additional fields to set on the hash)

local current = redis.call('HGET', KEYS[1], 'state')

-- Validate: key must exist (conversation must exist)
if not current then
  return redis.error_reply('CONV_NOT_FOUND')
end

-- Validate: current state must match expected (optimistic concurrency)
if ARGV[1] ~= '*' and current ~= ARGV[1] then
  return redis.error_reply('STATE_MISMATCH:' .. current)
end

-- Validate transition table (encoded as allowed_transitions in ARGV)
-- In practice, this validation happens in app code before calling Lua,
-- Lua just enforces atomicity. Double-check here as defense in depth.

-- Write new state
redis.call('HSET', KEYS[1], 'state', ARGV[2])
redis.call('HSET', KEYS[1], 'updated_at', ARGV[3])
redis.call('HSET', KEYS[1], 'state_entered_at', ARGV[3])

-- Apply additional field updates from payload
if ARGV[4] and ARGV[4] ~= '' then
  local payload = cjson.decode(ARGV[4])
  for k, v in pairs(payload) do
    redis.call('HSET', KEYS[1], k, v)
  end
end

-- Refresh TTL
redis.call('EXPIRE', KEYS[1], 604800)  -- 7 days

return redis.status_reply('OK')
```

**Application-layer transition call (TypeScript/Go pseudocode):**

```typescript
async function transitionState(
  conversationId: string,
  fromState: ConvState | '*',
  toState: ConvState,
  payload: Record<string, string> = {}
): Promise<void> {
  // Validate in app code first (fast path, before hitting Redis)
  if (fromState !== '*' && !VALID_TRANSITIONS[fromState]?.includes(toState)) {
    throw new InvalidTransitionError(fromState, toState);
  }

  const result = await redis.eval(
    transitionLuaScript,
    1,                                        // number of keys
    `conv:state:${conversationId}`,           // KEYS[1]
    fromState,                                // ARGV[1]
    toState,                                  // ARGV[2]
    Date.now().toString(),                    // ARGV[3]
    JSON.stringify(payload)                   // ARGV[4]
  );

  if (result.startsWith('STATE_MISMATCH')) {
    const actualState = result.split(':')[1];
    throw new StateMismatchError(fromState, actualState);
  }

  // Publish transition event to Kafka (async, non-blocking)
  await kafka.publish('chat.state.transitions', {
    conversation_id: conversationId,
    from_state: fromState,
    to_state: toState,
    timestamp: Date.now(),
    payload
  });
}
```

### Handling Concurrent Transitions

Consider: user taps "Contact Seller" twice in quick succession (double-tap, network retry).

```
Request 1: transitionState(convId, 'PROPERTY_SELECTED', 'CONTACT_SELLER', {...})
Request 2: transitionState(convId, 'PROPERTY_SELECTED', 'CONTACT_SELLER', {...})
```

Without atomicity:
- Both read state as `PROPERTY_SELECTED`
- Both write `CONTACT_SELLER`
- Two P2P sessions created, seller notified twice

With Lua script:
- Request 1 executes, state becomes `CONTACT_SELLER`
- Request 2 executes, reads state as `CONTACT_SELLER` (not `PROPERTY_SELECTED`)
- `STATE_MISMATCH:CONTACT_SELLER` returned
- App layer catches error, sees state is already `CONTACT_SELLER` → idempotent, no-op

```typescript
try {
  await transitionState(convId, 'PROPERTY_SELECTED', 'CONTACT_SELLER', payload);
} catch (err) {
  if (err instanceof StateMismatchError && err.actualState === 'CONTACT_SELLER') {
    // Already transitioned — idempotent success
    return;
  }
  throw err;
}
```

---

## Session Reconnect Protocol

When a client reconnects (network drop, page refresh, app resume):

```
Client                           WS Server                        Redis
  │                                  │                              │
  │── WS connect + auth token ───────►│                              │
  │                                  │── HGET session:{old_id} ────►│
  │                                  │◄─ {user_id, conv_id, state} ─│
  │                                  │                              │
  │                                  │── create new session_id      │
  │                                  │── HSET session:{new_id} ────►│
  │                                  │── SADD user:sessions:{uid} ──►│
  │                                  │── DEL session:{old_id} ──────►│
  │                                  │                              │
  │                                  │── HGET conv:state:{conv_id} ►│
  │                                  │◄─ {state, filters, ...} ─────│
  │                                  │                              │
  │                                  │── HGET bot:inprogress:{id} ──►│
  │                                  │◄─ {exists? / nil} ────────────│
  │                                  │                              │
  │◄─ session_state_change frame ────│  (carries current state)     │
  │◄─ missed messages (if any) ──────│  (from PostgreSQL, last N)   │
  │                                  │                              │
  [if bot:inprogress exists]         │                              │
  │◄─ bot_tool_event: "Resuming..." ─│                              │
  │                                  │── restart or await LLM ──────►│
```

**Missed P2P messages on reconnect:**

```typescript
// On reconnect, server fetches messages delivered while offline
const lastSeenMessageId = clientSentLastSeenId; // sent in reconnect frame
const missedMessages = await postgres.query(`
  SELECT * FROM messages
  WHERE conversation_id = $1
    AND created_at > (SELECT created_at FROM messages WHERE id = $2)
    AND sender_id != $3
  ORDER BY created_at ASC
`, [conversationId, lastSeenMessageId, userId]);

// Deliver missed messages as p2p_message frames
for (const msg of missedMessages) {
  ws.send({ type: 'p2p_message', ...msg });
}
```

---

## Presence System

### Heartbeat Loop (WS Server → Redis)

Every WS server runs a heartbeat task per connected client, every 30 seconds:

```typescript
async function heartbeat(userId: string, wsNodeId: string) {
  await redis.hset(`presence:${userId}`, {
    status: 'online',
    ws_node_id: wsNodeId,
    last_seen: Date.now(),
  });
  await redis.expire(`presence:${userId}`, 300); // 5 min TTL reset
}
```

If the user's tab is backgrounded (mobile app suspended), the WS connection may still be alive but the user is "away":

```typescript
// Client sends explicit away frame when app backgrounded
// Server updates:
await redis.hset(`presence:${userId}`, { status: 'away' });
```

### Presence Fan-out to P2P Participants

When a user's presence changes (comes online, goes offline, types), the WS server needs to notify the other participant(s) in active P2P conversations:

```typescript
async function broadcastPresence(userId: string, status: PresenceStatus) {
  // Find all active P2P conversations for this user
  const convIds = await postgres.query(`
    SELECT conversation_id FROM p2p_participants
    WHERE user_id = $1
    AND conversation_id IN (
      SELECT id FROM conversations WHERE state IN ('P2P_ACTIVE', 'P2P_BOT_ASSIST')
    )
  `, [userId]);

  for (const { conversation_id } of convIds) {
    // Publish to Redis Pub/Sub channel for this conversation
    await redis.publish(`p2p:${conversation_id}`, JSON.stringify({
      type: 'presence_update',
      user_id: userId,
      status,
      timestamp: Date.now()
    }));
  }
}
```

---

## TTL Strategy by State

Different states have different lifespans. TTLs are set on transition.

| State | conv:state TTL | Rationale |
|---|---|---|
| `LANDING` | 1 hour | No activity yet; short-lived |
| `BOT_ACTIVE` | 7 days | Active session; user may return |
| `FILTER_REFINE` | 7 days | Same as BOT_ACTIVE |
| `PROPERTY_SELECTED` | 7 days | User is considering, may come back |
| `CONTACT_SELLER` | 30 minutes | Waiting for seller — auto-expire to BOT_ACTIVE if no seller |
| `P2P_ACTIVE` | 30 days | Ongoing negotiation may span weeks |
| `P2P_BOT_ASSIST` | 30 days | Same as P2P_ACTIVE |
| `SUPPORT_BOT` | 7 days | May return if issue resurfaces |
| `HUMAN_SUPPORT` | 30 days | Resolution may take time |
| `ENDED` | 24 hours | Allow reconnect grace period |

### Auto-Expiry Transition: CONTACT_SELLER

If a seller doesn't connect within 30 minutes, the conversation must not stay in `CONTACT_SELLER` forever. A scheduled job (runs every 5 minutes) handles this:

```typescript
// Pseudo-code for expiry worker
async function expireContactSellerSessions() {
  // Find sessions in CONTACT_SELLER state older than 30 min
  // (In practice: use a Redis sorted set as a TTL queue)

  const expired = await redis.zrangebyscore(
    'expiry:contact_seller',
    0,
    Date.now() - 30 * 60 * 1000
  );

  for (const conversationId of expired) {
    await transitionState(conversationId, 'CONTACT_SELLER', 'BOT_ACTIVE', {
      expiry_reason: 'seller_no_response'
    });
    // Emit session_state_change to client
    await notifyClient(conversationId, {
      type: 'session_state_change',
      state: 'BOT_ACTIVE',
      reason: 'Seller is currently unavailable. Let\'s continue your search.'
    });
    await redis.zrem('expiry:contact_seller', conversationId);
  }
}
```

The expiry queue:

```
KEY:   expiry:contact_seller
TYPE:  ZSet
Score: timestamp when CONTACT_SELLER state was entered (epoch ms)
Member: conversation_id
```

---

## Context Assembly for LLM (Putting It All Together)

Before every bot LLM call, the Bot Orchestrator assembles context from Redis:

```typescript
async function buildLLMContext(conversationId: string): Promise<LLMContext> {
  // All Redis reads in parallel
  const [
    convState,
    filters,
    turns,
    summary,
    viewedProperties,
  ] = await Promise.all([
    redis.hgetall(`conv:state:${conversationId}`),
    redis.hgetall(`conv:filters:${conversationId}`),
    redis.lrange(`conv:turns:${conversationId}`, 0, -1),  // newest-first
    redis.get(`conv:summary:${conversationId}`),
    redis.zrange(`conv:viewed:${conversationId}`, 0, -1, { withScores: false }),
  ]);

  // Build session state section (injected as system prompt section 3)
  const sessionStateBlock = `
CURRENT SESSION STATE:
- Transaction type: ${convState.transaction_type}
- City: ${convState.city}
- State: ${convState.state}
- Active filters: ${JSON.stringify(buildFiltersObject(filters))}
- Recently viewed properties: [${viewedProperties.slice(-5).join(', ')}]
- Active search result set: ${convState.srset_id || 'none'}
`.trim();

  // Parse and reverse turns (Redis list is newest-first)
  const parsedTurns: Turn[] = turns.map(t => JSON.parse(t)).reverse();

  // Determine tool set from state
  const tools = TOOLS_BY_STATE[convState.state] ?? [];

  return {
    systemPromptSections: {
      identity: IDENTITY_PROMPT,                   // static, cached
      tools: formatToolsSection(tools),            // static per state, cached
      sessionState: sessionStateBlock,             // dynamic
      summary: summary ? JSON.parse(summary).summary : null  // dynamic
    },
    turns: parsedTurns,
    tools
  };
}
```

**Total Redis round-trips: 1 (5 parallel reads in one pipeline).** This is the hot path — it must be fast.

---

## Key Space Summary

```
session:{session_id}                   Hash    24h     Per WS connection
user:sessions:{user_id}                Set     24h     All sessions for a user
conv:state:{conversation_id}           Hash    varies  Authoritative conversation state
conv:filters:{conversation_id}         Hash    7d      Active search filters
conv:turns:{conversation_id}           List    7d      Last 20 LLM turns
conv:summary:{conversation_id}         String  7d      Compressed turn summary
conv:viewed:{conversation_id}          ZSet    7d      Viewed property history
p2p:participants:{conversation_id}     Hash    30d     P2P participants and roles
presence:{user_id}                     Hash    5min    Online/offline/away status
typing:{conversation_id}:{user_id}     String  3s      Typing indicator (TTL = stop)
dedup:{message_id}                     String  24h     Idempotency guard
bot:inprogress:{conversation_id}       Hash    30s     Active LLM generation
ratelimit:bot:{user_id}:{minute}       String  60s     Bot rate limit counter
ratelimit:p2p:{user_id}:{minute}       String  60s     P2P rate limit counter
ratelimit:contact:{user_id}:{hour}     String  3600s   contactSeller rate limit
support:queue:{tier}                   ZSet    none    Agent work queue
expiry:contact_seller                  ZSet    none    Auto-expiry queue
cache:tool:property:{property_id}      String  15min   Tool result cache
cache:tool:locality:{city}:{locality}  String  1h      Tool result cache
cache:tool:price_trends:{city}:{loc}   String  6h      Tool result cache
cache:tool:project:{project_id}        String  30min   Tool result cache
cache:tool:trending:{city}             String  30min   Tool result cache
p2p:{conversation_id}                  Pub/Sub (ephemeral)  Real-time delivery channel
```

---

## Failure Scenarios

### Redis Primary Fails (with replica failover)

- Sentinel or Redis Cluster promotes replica to primary within ~30s.
- During 30s window: WS servers can serve reads from replica (with slight staleness).
- State writes fail → WS servers buffer transition events locally for retry.
- P2P delivery degrades to Kafka polling (pre-built circuit breaker).
- Bot sessions fail gracefully: "Having trouble, please retry."

### Redis Key Eviction Under Memory Pressure

Redis evicts keys when `maxmemory` is hit. With `allkeys-lru` policy, the least-recently-used keys are evicted first. This means:

- Presence keys (5min TTL, frequently accessed) → safe
- Active session/conversation keys (frequently accessed) → safe
- Old conversation turns (not touched in days) → evicted first

If `conv:turns` is evicted, the bot falls back to `conv:summary` for context. If `conv:summary` is also evicted, the bot starts fresh with just the session state (filters, city, intent). Not ideal, but not catastrophic.

**Mitigation**: Size Redis appropriately. At housing.com scale, 20 turns × 40 bytes per turn × 1M active conversations = ~800MB for turns alone. Budget accordingly and monitor `used_memory_peak`.

### Stale Session State (WS Node Has Old State in Memory)

WS servers do **not** cache conversation state in memory. Every message triggers a fresh `HGET conv:state:{id}` from Redis. There is no local state on the WS node that can go stale. This is intentional — the statelessness of WS nodes is what allows seamless reconnect to any node.
