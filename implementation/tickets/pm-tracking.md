# PM Tracking — @ananya

---

## Decisions Log

| Date | Decision | Rationale | Impact |
|---|---|---|---|
| Sprint 0 | Full taxonomy in scope from day 1 | PM directive — no phasing | All intents wired from Sprint 1; no intent-gating code needed |
| Sprint 0 | Real APIs (Khoj/Odin/Casa) via VPN | PM directive — no mocks | No MockToolExecutor needed; faster Sprint 2 but network dependency |
| Sprint 0 | chat-demo is complete | PM confirmation | Sprint 3 is wiring only, not FE construction |
| Sprint 0 | Single-node Redis locally | @kiran decision — Redis Cluster unnecessary for local | Must be documented: prod uses cluster, hash tags required |
| Sprint 0 | PgBouncer transaction mode | @arjun decision | Connections freed after each transaction; LangGraph async is fine |
| Sprint 0 | Kafka replication factor = 1 locally | @kiran decision | Prod uses factor 3; this is a known local shortcut |

---

## Open Questions (to PM)

| # | Question | Asked by | Status |
|---|---|---|---|
| OQ-001 | What is the session_token signing algorithm? JWT? How does the gateway issue it? | @arjun | ⬜ Open |
| OQ-002 | Does contact_seller use the Venus CRM API directly, or through housing.brahmand GraphQL? | @dev | ⬜ Open |
| OQ-003 | Should anonymous users be able to use portfolio intents with an empty saved list, or hard-block to login? | @rahul | ⬜ Open |
| OQ-004 | What is the source of truth for `transaction_type` inference? User profile or message context? | @priya | ⬜ Open |
| OQ-005 | Is the A/B experiments.yaml tracked in git or managed externally (feature flag service)? | @priya | ⬜ Open |

---

## Pivots / Changes from Original Plan

*(Updated as they happen)*

---

## Blockers Log

| Ticket | Blocked by | Blocker description | Raised | Resolved |
|---|---|---|---|---|
| *(empty)* | | | | |

---

## Scrum Cadence

**Daily standup:** Async in #chat-bot-standup, 9 AM IST  
Format:
```
@{handle}
Done: [ticket IDs completed]
Doing: [ticket IDs in progress]
Blocked: [ticket IDs + blocker description]
```

**Sprint review:** Every Friday 5 PM IST  
Agenda:
1. Each lead demos their increment (5 min each)
2. Review exit criteria against what was delivered
3. Update milestones.md status
4. Retrospective: What slowed us down?

**Sprint planning:** Monday 10 AM IST (before each new sprint)

---

## Story Point Calibration

Team baseline (agreed Sprint 0):
- 1 SP = ~3 hours focused work for a senior engineer
- 2 SP = ~1 day
- 5 SP = ~2.5 days
- 8 SP = ~4 days (split if possible)
- 13 SP = must be split before accepting into sprint

**Each lead's sprint capacity (assuming 5-day sprints, 80% utilization):**
- @arjun: 16 SP per sprint
- @priya: 18 SP per sprint (full focus on pipeline)
- @dev: 12 SP (Sprint 3 primary)
- @kiran: 10 SP (Sprint 0 primary, support after)
- @rahul: 10 SP (starts Sprint 1, ramps up Sprint 4)

---

## What's Left for Later (Not in MVP)

| Feature | Why deferred | Who owns when we get there |
|---|---|---|
| Production Kubernetes deployment | Local-first per PM directive | @kiran |
| Security hardening (rate limiting, pen test) | @nisha plans in Sprint 4, implements Phase 2 | @nisha |
| Multi-region / DR setup | Not applicable for local | @kiran |
| MongoDB split for template payloads | Not needed at current volume; threshold documented in db-decisions.md | @arjun |
| Self-hosted SLM (Qwen/Llama) | Break-even only at 3M+/day; Phase 3 | @priya |
| Seller Management Bot | Out of scope for this sprint | New team needed |
| Support Agent Bot | Out of scope | New team needed |

---

## Progress Dashboard (updated each sprint)

### Sprint 0
| Owner | Tickets | SP Committed | SP Done | Status |
|---|---|---|---|---|
| @kiran | K-001,K-002,K-003,K-004 | 7 | 0 | ⬜ |
| @arjun | A-001,A-002,A-003,A-004,A-005 | 10 | 0 | ⬜ |

### Sprint 1
*(Updated after Sprint 0 completes)*

### Sprint 2
*(Updated after Sprint 1 completes)*

### Sprint 3
*(Updated after Sprint 2 completes)*

### Sprint 4
*(Updated after Sprint 3 completes)*
