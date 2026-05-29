# Implementation Plan — Housing.com Search & Discovery Bot

## The Goal
A locally running end-to-end Search & Discovery bot: user types in ~/chat-demo → SSE events stream → templates render → LLM responds. All real APIs (Khoj, Odin, Casa via VPN). Full taxonomy in scope from day 1.

---

## Team (2-pizza rule: 7 roles)

| Handle | Role | Core responsibilities |
|---|---|---|
| **@arjun** | BE Tech Lead | FastAPI, DB, Redis, Kafka, session, observability, config |
| **@priya** | AI/ML Lead | LangGraph pipeline, SLM cascade, LLM, all tool executors |
| **@dev** | Full Stack Engineer | chat-demo wiring, SSE/template validation, GraphQL bridge |
| **@kiran** | DevOps Engineer | Docker Compose, env management, local CI |
| **@rahul** | QA Lead | Test strategy, unit/integration/E2E tests, test data |
| **@nisha** | Security Engineer | Security plan (acts in Phase 2, plans now) |
| **@ananya** | Project Manager | Sprint facilitation, ticket tracking, pivots, docs |

---

## Navigation

| Doc | Owner | Purpose |
|---|---|---|
| [Team Charter](team-charter.md) | @ananya | Role details, skills, communication protocols |
| [Tech Stack](tech-stack.md) | @arjun | Confirmed decisions, local setup prerequisites |
| [Milestone Tracker](milestones.md) | @ananya | Sprint plan, burndown, risk log |
| [Sprint 0 — Infra](sprints/sprint-0.md) | @kiran + @arjun | Docker Compose, DB, skeleton API |
| [Sprint 1 — Pipeline Core](sprints/sprint-1.md) | @priya + @arjun | LangGraph nodes, SLM, SSE endpoint |
| [Sprint 2 — Tool Integration](sprints/sprint-2.md) | @priya + @arjun | All tool executors, Kafka, session |
| [Sprint 3 — FE Integration](sprints/sprint-3.md) | @dev + @priya | chat-demo wired, E2E working |
| [Sprint 4 — Quality & Observability](sprints/sprint-4.md) | @rahul + @arjun | Tests, metrics, tracing, error handling |
| [Tickets: BE](tickets/be-backlog.md) | @arjun | All BE engineering tickets |
| [Tickets: AI/ML](tickets/ai-backlog.md) | @priya | All AI/ML pipeline tickets |
| [Tickets: FE](tickets/fe-backlog.md) | @dev | All FE integration tickets |
| [Tickets: DevOps](tickets/devops-backlog.md) | @kiran | All infrastructure tickets |
| [Tickets: QA](tickets/qa-backlog.md) | @rahul | All testing tickets |
| [Security Plan](security/plan.md) | @nisha | Threat model, planned work |
| [PM Tracking](tickets/pm-tracking.md) | @ananya | Decisions log, pivots, blockers |

---

## Key Constraints

- **Local first**: Docker Compose, no Kubernetes for now. Must `docker compose up` and work.
- **Real APIs**: Khoj/Odin/Casa/Venus accessible via VPN. No mock layer needed.
- **Full taxonomy**: All intents in scope from Sprint 1. No phasing.
- **FE ready**: ~/chat-demo handles SSE + templates. Integration = wiring, not building.
- **Production path**: Every local decision must have a clear path to prod (env vars, not hardcoded URLs, no dev-only shortcuts in business logic).

---

## Definition of Done (every ticket)

- [ ] Code committed to feature branch
- [ ] Passes `make test` locally (unit tests for this component)
- [ ] Reviewed by tech lead (BE or AI/ML depending on ticket)
- [ ] No hardcoded secrets, URLs, or environment values
- [ ] Structured log emitted for the happy path
- [ ] Acceptance criteria checked off by assignee

---

## Escalation Path

**Blocker** → ping @arjun or @priya in #chat-bot-eng within 2h  
**Architecture question** → @arjun + @priya sync, @ananya documents decision  
**Product question** → @ananya raises with PM, unblocked within 1 business day  
**API contract unclear** → @dev checks ~/housing.brahmand/graphql, escalates to PM if unresolved
