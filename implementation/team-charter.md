# Team Charter

## Principles
1. **No guessing on product scope** — when in doubt, @ananya raises with PM same day
2. **Docs as source of truth** — `~/chat-bot/docs/` is canonical. If reality diverges, update the doc, not just the code
3. **Two-way door** — every local-setup decision that would be a one-way door in prod must be flagged before merging
4. **Measurable done** — "done" means tests pass and the acceptance criteria are checked, not "works on my machine"

---

## @arjun — BE Tech Lead

**Skills required:** FastAPI, Python async, PostgreSQL + partitioning, Redis Cluster, Kafka, PgBouncer, LangSmith, structlog, Docker Compose, pytest

**Owns:**
- `src/api/` — FastAPI router, endpoints, SSE streaming
- `src/session/` — Redis session management, SessionStorePort
- `src/db/` — PostgreSQL migrations (Alembic), Kafka consumer (chat-db-writer)
- `src/registry/` — SessionRegistryPort implementation
- `src/config/` — Pydantic settings, ENV-based config
- `src/observability/` — Structured logging, LangSmith config, NodeMetrics

**Decision authority:** API contract, DB schema, config system, session state structure  
**Escalates to PM:** API contract changes that affect chat-demo FE  

**Works with:**
- @priya: adapters injected into LangGraph nodes (DomainRouterPort, ClassifierPort, LLMPort, CachedExecutorPort)
- @dev: API endpoint shape, SSE event format
- @kiran: Docker Compose env vars, service dependencies
- @rahul: contract tests, DB migration tests

---

## @priya — AI/ML Lead

**Skills required:** LangGraph, LangChain, Anthropic SDK, Python async, tool execution, SSE streaming, pytest

**Owns:**
- `src/pipeline/` — Full LangGraph StateGraph (all 19 nodes)
- `src/adapters/` — AnthropicChatAdapter, AnthropicStreamingAdapter (DomainRouterPort, ClassifierPort, LLMPort)
- `src/tools/` — All TOOL_REGISTRY executors (CachedExecutorPort implementations)
- `src/prompt/` — Prompt file assembly, LLMPromptComposer
- `src/registries/` — INTENT_REGISTRY, TOOL_REGISTRY, FILTER_REGISTRY Python modules
- `src/slm/` — Domain prompt files, build_intent_taxonomy_block, build_filter_delta_block

**Decision authority:** Node implementations, model selection, prompt engineering, tool execution logic  
**Escalates to PM:** When tool API responses don't match documented contracts  

**Works with:**
- @arjun: defines adapter protocols, hands off SSE emit function, uses SessionStorePort
- @dev: validates SSE event shapes against api-contract.md
- @rahul: model eval runner, node unit tests

---

## @dev — Full Stack Engineer

**Skills required:** React, SSE (EventSource API), TypeScript, GraphQL client, housing.brahmand API familiarity

**Owns:**
- `~/chat-demo` integration (not in this repo — external)
- Wiring chat-demo to `POST /api/v1/chat/send-message-streamed`
- Validating all 12 templateId renders against api/templates.md
- GraphQL bridge: when a tool API contract doesn't match, check housing.brahmand/graphql and flag

**Decision authority:** FE rendering decisions, chat-demo changes  
**Escalates to PM:** When housing.brahmand GraphQL response shape differs from TOOL_REGISTRY contract  

**Works with:**
- @arjun: API endpoint URLs, auth header format
- @priya: SSE event validation (what's emitted vs what FE expects)
- @rahul: E2E test scripts

---

## @kiran — DevOps Engineer

**Skills required:** Docker Compose, bash, PostgreSQL admin, Redis admin, Kafka admin, Makefile

**Owns:**
- `docker-compose.yml` — All services (FastAPI, PostgreSQL, Redis, Kafka, Zookeeper, PgBouncer)
- `Makefile` — `make setup`, `make up`, `make migrate`, `make test`, `make logs`
- `.env.example` — All required env vars documented
- `scripts/` — DB seed data, Kafka topic creation, health check scripts
- Local TLS/auth setup if VPN-accessible APIs need certs

**Decision authority:** Infrastructure tooling, container config  
**Escalates to:** @arjun for service dependency questions  

**Works with:**
- @arjun: Service env vars, connection strings
- @priya: API key injection (Anthropic, Anthropic SLM endpoint)

---

## @rahul — QA Lead

**Skills required:** pytest, pytest-asyncio, httpx (async HTTP client), locust (load testing basics), markdown test plan writing

**Owns:**
- `tests/unit/` — One test file per pipeline node and helper
- `tests/integration/` — Full pipeline E2E, tool executor tests against real APIs
- `tests/e2e/` — Scripted chat flows (10 golden paths)
- `docs/testing/testing-guide.md` — Keeps it updated
- `tests/fixtures/` — Session factories, fake API responses for offline unit tests

**Decision authority:** Test coverage requirements, what constitutes a regression  
**Escalates to PM:** When acceptance criteria are ambiguous  

**Works with:**
- @arjun: contract tests for API endpoints
- @priya: model eval runner, node isolation tests
- @dev: E2E test flows against running chat-demo

---

## @nisha — Security Engineer

**Role in Sprint 0–4:** Plans only. Produces `security/plan.md` and `security/threat-model.md`.  
**Acts in Phase 2** (after MVP is working locally).

**Owns (planning now):**
- Threat model for the full system
- Auth bypass risks (SSE endpoint, session token)
- Prompt injection attack surface
- API key handling (Anthropic, internal API keys)
- Rate limiting design
- PII in logs (user messages must not appear in plain-text logs)

---

## @ananya — Project Manager

**Owns:**
- Sprint planning and retrospective facilitation
- Ticket creation and grooming (in coordination with leads)
- `implementation/tickets/pm-tracking.md` — Decisions log, pivots, open questions
- Scrum cadence: standup async in #chat-bot-standup (daily), sprint review Friday EOD
- Escalation to PM when product questions arise
- Story point calibration with team (1 SP = half day of focused work)

**Story point scale:**
| Points | Effort |
|---|---|
| 1 | < 3 hours |
| 2 | ~1 day |
| 3 | 1.5 days |
| 5 | 2–3 days |
| 8 | 4–5 days |
| 13 | > 1 week → must be split |

---

## Communication Protocols

Full scrum process: **`implementation/process/scrum-protocol.md`**

Quick reference:

| Channel | Use for | Limit |
|---|---|---|
| **Direct DM** | Quick clarifying questions between two agents | Max 3 exchanges; unresolved → standup |
| **#chat-bot-standup** | Daily updates, blocker escalation | Reply by 10am; PM summarises by 10:30am |
| **Standup ⚡ agenda** | Items unresolved after 3 DM exchanges; blockers > 2 days old | PM adds automatically |
| **Architecture sync** | Spec-level disagreements, new design decisions | @arjun + @priya, max 1/week |
| **Sprint planning** | Scope, capacity, cross-team dependencies | Sprint start Monday 10am |

**Rules:**
- Direct comms are for questions, not decisions. If a DM exchange produces a decision that changes a spec, @ananya must document it in `pm-tracking.md` same day.
- Blocked items > 2 days automatically surface in standup — do not wait.
- Ticket author adds `BLOCKED BY CHAT-XX` in the ticket header + pings the blocking agent in Slack.
- Architecture decisions: both @arjun + @priya must align; @ananya documents in `pm-tracking.md`.
- Production safety concern: @arjun flags immediately; all non-critical work pauses until resolved.
