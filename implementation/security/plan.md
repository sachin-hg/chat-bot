# Security Plan — @nisha

**Status:** Planning only (Sprint 0–4). Implementation in Phase 2.  
**Deliverable this phase:** This document + threat model.

---

## Threat Model

### Attack Surface

| Surface | Threat | Risk |
|---|---|---|
| `POST /chat/send-message-streamed` | Prompt injection via user message | High — LLM could be manipulated |
| Session tokens | Forged or replayed session tokens | High — unauthorized access to other users' sessions |
| SSE stream | Unauthorized SSE stream hijacking | Medium |
| Tool API calls (Khoj/Odin) | SSRF via malicious entity names | Medium |
| Anthropic API key | Key exposure in logs or env | High |
| User messages in logs | PII leakage | High |
| Rate limiting absence | LLM cost amplification attack | Medium |

---

## Phase 2 Work Plan (after MVP)

### P2-SEC-001: Prompt injection hardening
- Audit `safety_node` regex patterns — expand to cover more injection patterns
- Add LLM output monitoring for anomalous outputs (policy violation detection)
- Red team: attempt to exfiltrate API keys, session state, user data via prompt injection

### P2-SEC-002: Session token security
- Document token signing algorithm (JWT HS256 minimum)
- Token expiry: 24h, refresh on activity
- Validate `session_id` ownership: user A cannot access user B's session

### P2-SEC-003: PII in logs audit
- Verify `safety_node` strips PII before logging (CHAT-A-021 must be done first)
- Audit all structlog calls: user message text must NOT appear at INFO level
- Review Kafka message payloads — `content` field in `chat.messages` topic should be encrypted at rest

### P2-SEC-004: Rate limiting tightening
- Current: `ratelimit:chat:{token_id}` = 60/min anonymous, 120/min logged-in
- Add per-IP rate limiting (in addition to per-session) for DoS protection
- Add global rate limiter: if LLM cost/hour exceeds threshold → alert + auto-throttle

### P2-SEC-005: API key rotation procedure
- Document: how to rotate `ANTHROPIC_API_KEY` without downtime
- Verify: key is read from env on each request (not cached at startup for too long)
- Add: key health check (`/health` pings Anthropic with minimal call)

### P2-SEC-006: SSRF via entity names
- Tool executors call `autosuggest_base_url` with user-supplied entity names
- Validate: entity names are URL-encoded, no path traversal characters
- Add: allowlist of acceptable characters in entity names before API call

---

## Immediate Phase 1 Requirements (must be done before MVP ships)

These are NOT deferred — @arjun must implement:
1. `ANTHROPIC_API_KEY` as `SecretStr` (CHAT-A-003) — key never appears in logs
2. User message text not at INFO level (CHAT-A-021)
3. `session_id` validated against `token_id` on every request (basic ownership check)

---

## Deferred to Phase 2

The full pen test, red team exercise, and hardening work is Phase 2. The system does not expose real user data in Phase 1 (local only), so Phase 1 risk is acceptable.
