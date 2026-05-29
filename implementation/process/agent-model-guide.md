# Agent Model Guide

AI agents operate at 48× human speed. Model selection balances task complexity, output quality, and cost per cycle.

---

## Model Tiers

| Model | Use when | Cost profile |
|---|---|---|
| **Haiku** | Simple reads, template generation, file writes, config updates, status checks | Cheapest — default for routine work |
| **Sonnet** | Reasoning over multiple files, dependency analysis, architectural decisions, code review, sprint planning | Moderate — for tasks requiring judgment |
| **Opus** | Deep architectural debates, security threat modelling, cross-domain synthesis with high stakes | Expensive — reserve for decisions that are hard to reverse |

---

## Assignment by Agent Role

| Agent | Default model | Upgrade when |
|---|---|---|
| **@ananya** (PM — standup, ticket mgmt) | Haiku | Sprint planning or retro synthesis → Sonnet |
| **@kiran** (DevOps — Docker, Makefile, infra config) | Haiku | Multi-service dependency debugging → Sonnet |
| **@arjun** (BE Tech Lead — FastAPI, DB, Redis, Kafka) | Sonnet | Routine ticket status updates → Haiku |
| **@priya** (AI/ML Lead — LangGraph nodes, adapters, prompts) | Sonnet | Major pipeline architecture change → Opus |
| **@dev** (FE — template wiring, SSE handling) | Haiku | Complex multi-template interaction bugs → Sonnet |
| **@rahul** (QA — unit tests, eval cases, dry-run specs) | Haiku | Model eval design, rubric calibration → Sonnet |
| **@nisha** (Security — threat model, auth, PII) | Sonnet | Full threat model from scratch → Opus |

---

## Assignment by Ceremony

| Ceremony | Model | Rationale |
|---|---|---|
| Daily standup generation | **Haiku** | Template fill + file read + git commit. No reasoning required. |
| Blocked item flagging | **Haiku** | Pattern-match in ticket files. |
| Sprint planning | **Sonnet** | Needs: dependency graph reasoning, capacity vs velocity, risk identification. |
| Sprint review + retro | **Sonnet** | Needs: synthesis across standup history, pattern recognition, action item generation. |
| Architecture sync | **Sonnet** | Multi-file spec comparison, impact analysis. |
| Security review | **Opus** | Adversarial reasoning, threat modelling. Reserved for Phase 2. |

---

## Assignment by Task Type

| Task | Model |
|---|---|
| Read a file and summarise it | Haiku |
| Write a standup template to a file | Haiku |
| Update a ticket status field | Haiku |
| Analyse cross-ticket dependencies | Sonnet |
| Review a node implementation for correctness | Sonnet |
| Propose a new intent/sub-intent | Sonnet |
| Change a core registry (INTENT_REGISTRY, FILTER_REGISTRY) | Sonnet + @ananya approval |
| Change the LangGraph pipeline wiring | Sonnet + @arjun + @priya alignment |
| Change auth model or session structure | Opus + @nisha review |

---

## Cost guardrails

- **Never use Opus for routine work.** If an agent finds itself needing Opus for a standup or ticket update, it's a sign the task is misframed.
- **Haiku for all standup + sprint ceremonies** unless explicitly overridden.
- **Sonnet is the default for "thinking" tasks** — planning, analysis, review.
- Each agent should log its model in the structured output (model field in standup files) so cost is trackable per ceremony.
