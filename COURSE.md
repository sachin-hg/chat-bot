# Building Production AI Agents — Zero to Hero
### Scalar Academy · Senior Mentorship Track

> **Goal**: By the end of this course you will be able to architect, build, debug, scale, and
> operate production-grade AI agent systems for any company or product domain — not just
> copy-paste a chatbot, but truly *design* one from first principles.

---

## The Meta Game — What This Course Is Really Teaching

**Housing.com is a case study. A ladder. Not the destination.**

We use Housing.com's AI search agent as the running example because it is *real* — real
codebase, real production decisions, real failure modes, real cost math. But every lesson
teaches the general skill:

> *How do you design a production AI system from requirements, at any scale, for any domain?*

By the time you finish this course, you can take *any* AI product brief — a Google Drive
assistant, an Azure enterprise copilot, a code reviewer, a legal document analyst — and
design it correctly from first principles. The housing chatbot is Case Study 1. Module 19
gives you the framework to apply everything to any system you will ever build.

### The System Design Thinking Framework

Every architectural decision in this course runs through this framework. Make it a habit —
this is the same process Senior Engineers use in MAANG system design interviews.

```
┌──────────────────────────────────────────────────────────────────────┐
│  BEFORE YOU DESIGN ANYTHING, ANSWER THESE SIX QUESTIONS             │
├──────────────────────────────────────────────────────────────────────┤
│  What am I building?        Product context, user journey, core job  │
│  Who uses it?               User type, trust level, scale, region    │
│  Functional requirements    What must the system DO?                 │
│  Non-functional req's       Latency, cost, accuracy, safety, uptime  │
│  RPS + Read:Write ratio     Determines caching, storage, concurrency │
│  What fails at 10×?         Every design has a scalability ceiling   │
└──────────────────────────────────────────────────────────────────────┘
```

**How this maps to Housing.com — use this table as an interview answer template:**

| Question | Housing.com Answer | Design Implication |
|---|---|---|
| What am I building? | Natural language property search with memory | Multi-node pipeline, not a simple chatbot |
| Who uses it? | Millions of anonymous + authenticated consumers | No PII in default session; JWT for irreversible actions |
| Latency SLA? | P95 < 800ms (>500ms feels slow to users) | Two-stage SLM, parallel pre-fetch, SSE streaming |
| Cost ceiling? | <₹1 (<$0.012) per session | Haiku for SLM ($0.0001), Sonnet only for Tier 3b ($0.005) |
| Read:Write ratio? | ~25:1 (users read listings far more than setting filters) | Redis for reads, Postgres for durable writes only |
| Fails at 10×? | Single Redis instance, single Kafka broker | Redis Cluster, Kafka partitioning (Module 11) |

**Every time you encounter an architectural choice in this course, ask these questions.**
The choice will always make more sense when you see which constraint it's responding to.

---

## How This Course Works

Every lesson answers three questions in order:
1. **Why does this problem exist?** (the business/UX pressure)
2. **What are the design options?** (with tradeoffs)
3. **What did we choose and why?** (the decision baked into this codebase)

Code snippets are always from the real codebase. Every design decision has a reason.
If you find yourself asking "why not just…?" — that question is answered either in the
lesson or in the "Gotchas" section.

---

## Learning Paths — Skip What You Know

This course is designed for *any* senior engineer regardless of background. Not everyone needs every module. Find your path below.

| Your Background | Recommended Path |
|---|---|
| **FE engineer, new to AI** | Appendix A (ML vocab) → Track B (17) → Track A (16) → Modules 0–15, 18, 19 |
| **FE Engineer → AI Engineering IJP / role transition** | Appendix A → Appendix B (10-week plan) → Track B → Track A → Modules 0–2, 14, 18, 19 → Appendix C |
| **Backend engineer, new to AI** | Track A (Mod 16) → Modules 0–15 (Track B optional) |
| **Full-stack, new to AI** | Track A → Track B → Modules 0–15 in order |
| **AI practitioner, learning system design** | Modules 0–8, 12–15. Skip Tracks A & B. |
| **Enterprise / Azure architect** | Modules 0–1, 4, 8–12, 15. Tracks A/B optional. |
| **New hire joining an AI team** | New Hire Quickstart → Module 2 → Module 14 → fill in gaps |
| **Technical leader / VP** | Modules 0, 7, 8, 11, 15, 19. Deep-dive where your team will focus. |
| **MAANG AI system design interview** | Appendix A → Modules 18 + 19 first, then fill gaps from 0–17 |

**Tags used throughout:**
- `[AI FOUNDATION]` — LLM/AI concepts from scratch. Skip if you've built with the Anthropic or OpenAI API before.
- `[FE BRIDGE]` — Frontend and browser-side content. Skip if backend-only.
- `[ENTERPRISE]` — Multi-tenancy, compliance, Azure. Skip for personal or startup-scale projects.
- `[CORE]` — Everyone reads this regardless of background.

**Appendices** (at end of course, accessible from sidebar):
- **Appendix A** — ML Foundations Primer: what is a model, classification vs regression, training vs inference, features, evaluation metrics — zero math, JavaScript analogies. `[AI FOUNDATION]`
- **Appendix B** — FE→AI Transition Playbook: skills mapping, transition narrative coaching, 10-week study plan, 5 Uber-domain AI scenarios. `[FE BRIDGE]`
- **Appendix C** — Python Literacy for AI Engineering: Python/TypeScript side-by-side, async patterns, reading this codebase for interview prep. `[FE BRIDGE]`

---

## New Hire Quickstart

*Just joined a team running AI agents and need to be productive in week 1? Start here. Return to Module 0 when you have breathing room.*

**Day 1 — Understand the system (2–3 hours)**
1. Start the server: `BOT_ENV=mock uvicorn src.main:app --reload`
2. Open `/playground` — send a message, watch all 19 pipeline nodes light up in sequence
3. Click any node in the playground — see its input and output
4. Open `/learn` — this course. Start at **Module 2** (the 19-node walkthrough) for system orientation

**Day 2 — Make your first safe change (1–2 hours)**
1. Pick a node — `sanitize_node` in `src/pipeline/nodes/processing.py` is a good start
2. Read its unit test in `tests/unit/`
3. Run it: `BOT_ENV=mock pytest tests/unit/test_processing.py -v`
4. Add a `log.info()` line to the node, confirm the test still passes, see it appear in the playground

**Day 3 — Read Module 14 (The Gotchas) — 30 minutes**
This module contains the production bugs the team already learned the hard way. Read it before writing any substantive code.

**Week 2 onward:** Follow the learning path for your background from the table above.

---

## Module 0 — The Philosophy of AI Agents

> **After this module you will be able to:**
> 1. Explain the difference between an LLM wrapper, an agent, and an autonomous agent — with a concrete example of each
> 2. Apply the three-question test to any product brief to decide if autonomous agents are appropriate
> 3. Articulate why Housing.com chose the agent tier (not autonomous) and what constraint drove that choice
>
> ⏱ Estimated time: 30 minutes | Difficulty: ★★☆☆☆ | Prerequisites: none

### 0.1 What is an AI Agent? (Not what you think)

Most people think an AI agent is "ChatGPT with extra steps." It isn't.

An **LLM** takes text in, produces text out. It has no memory, no tools, no concept of
your user's session, no business rules. Left alone it will confidently make things up.

An **AI Agent** is a *system* that wraps an LLM with:
- **Memory** — what the user said before, what filters they set, what they've seen
- **Routing** — not every message needs the expensive LLM; most need the right *action*
- **Tools** — real API calls to fetch real data
- **Guard rails** — safety, output validation, cost control
- **Observability** — you need to know what it did and why, not just what it said

The LLM is about 15% of this codebase. The other 85% is the *system* around it.

**Mental model**: An AI agent is a compiler. The user's natural language message is
source code. Your pipeline is the compiler passes. The rendered response is the output.
Each pass has a specific job. No pass does another pass's job.

### 0.2 The Spectrum: Wrapper → Agent → Autonomous Agent

```
LLM Wrapper              Agent                   Autonomous Agent
─────────────            ──────────────          ──────────────────────
user → LLM → user        user → pipeline         user → planner → sub-tasks
                              → classify               → LLMs in parallel
No memory                     → fetch data             → tool calls in loops
No tools                      → LLM                    → self-correcting
No routing                    → validate          Costly, complex, risky
                              → respond
                         Predictable, fast,
                         cheap, production-safe
```

This course builds the *Agent* tier. It's what 95% of production AI products need.
Autonomous agents are for research, not shipping to millions of users.

### 0.3 The Housing.com Problem

Housing.com has millions of property listings. Users describe what they want in natural
language: "show me 3BHK in Bandra under 2Cr with parking, near the sea."

Without AI: the user must fill in 8 dropdowns to get a result.
With an AI agent: one sentence → right properties.

But that's the easy part. The hard part is:
- Users say vague things ("something affordable in a good locality")
- Users pivot mid-conversation ("actually show me 2BHK instead")
- Users refer to things they already saw ("tell me more about the third one")
- Some messages are malicious ("ignore previous instructions")
- The system must work in 500ms not 30 seconds
- It must cost less than ₹1 per session

Every design decision in this codebase is a response to one of these pressures.

### 0.4 When Autonomous Agents ARE Appropriate

"Autonomous agents are for research, not shipping" is true for consumer products at scale.
It is *not* true for all enterprise use cases. The distinction matters for a senior engineer.

**The three-question test:**

1. **Is the completion criterion machine-verifiable?**
   A code review agent can check: "does the PR pass lint, tests, and a security scan?" — yes.
   A housing chatbot cannot check: "did this user find a home?" — no.

2. **Is every tool call sandboxed or reversible?**
   A document processing agent reads PDFs and writes to a staging database — yes.
   An agent that sends emails, charges credit cards, or books viewings — no.

3. **Does a human review before irreversible actions?**
   An internal compliance checker flags issues for a human to resolve — yes.
   A consumer chatbot that autonomously books a site visit — no.

**Enterprise patterns where autonomous agents work:**

| Use Case | Why It Works |
|---|---|
| Code review agent | Verifiable (test pass/fail), sandboxed (read-only + staging), human merges |
| Document Q&A | Verifiable (retrieval quality), sandboxed (read-only corpus), low stakes |
| Compliance checker | Verifiable (rules are explicit), human resolves findings |
| Data pipeline monitoring | Verifiable (data quality metrics), auto-rollback on failure |
| Internal IT helpdesk | Low volume, internal users who understand AI limitations |

**The rule:** autonomous agents are appropriate when you can define "done" in code,
sandbox every side effect, and keep a human in the loop for irreversible actions.
Housing.com search fails all three. Your internal code reviewer likely passes all three.

---

## Module 1 — High-Level Design (HLD)

> **After this module you will be able to:**
> 1. Draw the full system architecture from memory: browser → FastAPI → LangGraph → Redis/Kafka/Postgres
> 2. Explain why SSE beats WebSockets for AI chat (unidirectional, HTTP/1.1 compatible, load-balancer friendly)
> 3. Describe the asyncio.Queue bridge pattern and why `put_nowait` (not `await put`) is used inside pipeline nodes
> 4. Justify the two-stage SLM cost argument: $0.0001 vs $0.005, and why reliability (not cost) is the primary reason
>
> ⏱ Estimated time: 45 minutes | Difficulty: ★★★☆☆ | Prerequisites: Module 0

### 1.1 The 50,000-Foot View

Before writing a single line of code, draw the system on a whiteboard.

```
User (Browser / Mobile App)
        │  HTTP POST /send-message-streamed
        ▼
   FastAPI Server  ◄──── Redis (session state)
        │                Kafka (event log)
        │                Postgres (persistence)
        │
        ▼
  LangGraph Pipeline (19 nodes)
        │
        ├── Stage 1 SLM (Claude Haiku) — domain routing
        ├── Stage 2 SLM (Claude Haiku) — intent classification
        ├── Tool Executors — Housing APIs (property search, locality data)
        └── Stage 3 LLM (Claude Haiku/Sonnet) — response generation
        │
        ▼
  Server-Sent Events (SSE) stream back to user
```

### 1.2 Why SSE? (Not WebSockets, not polling)

**Decision tree — pick your streaming protocol:**

```
Do you need the CLIENT to send messages while the server is streaming?
│
├─ YES → WebSockets (bidirectional, e.g. collaborative document editing)
│        ⚠️  Requires load balancer upgrade (ws:// not http://), stateful connections,
│           reconnect logic. Significant infra overhead.
│
└─ NO → Is this server → client only? (AI chat, dashboards, notifications)
        │
        ├─ YES, and you need auth headers / want to use POST requests?
        │   └─ SSE via fetch() + ReadableStream ← THIS CODEBASE
        │
        └─ YES, and you're OK with GET requests + no custom auth headers?
            └─ SSE via EventSource API (simpler, but limited)
```

Three options in a table:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Polling | Simple | Wastes requests, high latency | Never for streaming |
| WebSockets | Bidirectional, fast | Complex infra, stateful servers, load balancer config | Overkill for AI chat |
| SSE | Simple, works over HTTP/1.1, no special infra | Server → client only | **This codebase** |

> ⚠️ **Common Misconception:** "WebSockets are faster, so we should use them."
>
> **Reality:** For AI chat, WebSockets are not faster — they're just more complex. The bottleneck
> is the LLM token generation speed (~30ms/token), not the transport protocol. SSE and WebSockets
> both deliver tokens to the browser in under 5ms over a good connection. SSE wins on simplicity:
> it works through every HTTP proxy and load balancer without special configuration, while WebSocket
> upgrades require explicit proxy support.

SSE is perfect for AI: the server speaks, the client listens. It works through load
balancers and proxies without special configuration. Each SSE frame is just text:

```
event: message_delta
data: {"content": {"text": "I found"}, "chunkIndex": 0}

event: chat_event
data: {"messageState": "COMPLETED", ...}

event: connection_close
data: {"reason": "response_complete"}
```

The browser reads `response.body.getReader()` and processes each line as it arrives.
The user sees text appearing character by character — the LLM streaming directly to UI.

### 1.3 Why LangGraph? (Not a raw state machine, not raw LLM calls)

You could write your 19-node pipeline as a series of if/else statements. Many teams do.
It becomes unmaintainable in month 3.

LangGraph gives you:
- **Typed state** that flows through nodes (the `BotState` TypedDict)
- **Conditional edges** — short-circuit to END if `bot_response` is set
- **Composability** — swap nodes without touching adjacent ones
- **Traceability** — LangSmith sees every node's input/output

The key insight: every node receives `state: BotState` and returns a partial update.
LangGraph merges the update into the state. No node needs to know what other nodes did.

**The right mental model for senior engineers:**

The "compiler passes" analogy works as an intro, but it breaks at depth: compiler passes
are pure transformations with no I/O. Pipeline nodes call external APIs.

A more precise analogy: **ASP.NET Core middleware** or **Express.js middleware chains**.
Each middleware receives a context object (`HttpContext` / `req, res`), transforms it,
and can short-circuit the chain. The next middleware doesn't know what the previous one did.
`BotState` is the context object. `add_conditional_edges` is the middleware's `next()` call.

```
ASP.NET middleware        →    LangGraph node
─────────────────────────      ──────────────────────────
HttpContext flows through  →   BotState flows through
context.Response.Complete() → bot_response set (short-circuit)
await next()              →    return partial dict (continue)
app.UseMiddleware<T>()    →    graph.add_node('safety', safety_node)
```

This analogy holds for .NET and Node.js engineers immediately. The pipeline IS the
middleware chain — just with a typed dict instead of an HTTP context object.

```python
# safety_node signature — it knows nothing about the other 18 nodes
async def safety_node(state: BotState, emit_sse=None) -> dict:
    # receives: state['raw_message'], state['session']
    # returns: {'safety_result': {...}}  or {'bot_response': canned_response}
```

### 1.4 The Queue Pattern — Decoupling the Pipeline from Streaming

This is the most important architectural decision in the codebase.

**The problem**: LangGraph is synchronous from its own perspective — it calls node A,
waits for it, calls node B. But we want to *stream SSE frames to the client* as nodes
emit them, without LangGraph knowing anything about HTTP.

**The solution**: an `asyncio.Queue` as a message bus.

```
LangGraph runs as a background task ──► node calls emit_sse(event, data)
                                               │
                                               ▼
                                       queue.put_nowait(frame)

FastAPI event_generator ─────────────► frame = await queue.get()
                                               │
                                               ▼
                                       yield frame  ──► browser
```

`emit_sse` is a closure that captures the queue. Nodes call it synchronously (no await).
The generator pulls frames out asynchronously. This decouples the pipeline from HTTP
completely — you can test nodes without an HTTP server.

```python
queue: asyncio.Queue[str | None] = asyncio.Queue()

def emit_sse(event: str, data: dict) -> None:
    queue.put_nowait(sse_frame(event, data))

# Pipeline runs in background task
asyncio.create_task(_run_pipeline())

# Generator drains the queue
while True:
    frame = await asyncio.wait_for(queue.get(), timeout=90.0)
    if frame is None:   # sentinel — pipeline done
        break
    yield frame
```

**Gotcha**: `connection_close` must be yielded *inside* the while loop (on sentinel),
not after the try/finally block. If the finally block raises (e.g. Redis decr fails),
code after try/finally never executes. This burned us in production.

---
> **`[FE BRIDGE]` Python async in 90 seconds — for JavaScript/TypeScript engineers**
>
> Python's `async`/`await` is semantically identical to JS. The syntax is cosmetic:
>
> | JavaScript / TypeScript | Python | Notes |
> |---|---|---|
> | `async function foo(): Promise<T>` | `async def foo() -> T:` | Same semantics |
> | `await somePromise` | `await some_coroutine` | Same semantics |
> | `interface Foo { bar(): void }` | `class Foo(Protocol): def bar() -> None: ...` | TypeScript interface = Python Protocol |
> | `type BotState = { raw_message: string }` | `class BotState(TypedDict): raw_message: str` | TypeScript type = Python TypedDict |
> | Zod / Yup schema | `class X(BaseModel)` (Pydantic) | Runtime validation |
> | `fn.bind(null, arg)` | `functools.partial(fn, arg)` | Partial application |
> | `Promise.resolve().then(fn)` | `asyncio.create_task(fn())` | Fire-and-forget |
> | `ReadableStream` controller | `asyncio.Queue` | The decoupling bus |
> | Express `(req, res, next)` middleware | FastAPI `Depends(require_auth)` | Dependency injection |
> | `winston.info({ event, data })` | `log.info("event", **data)` | Structured logging |
>
> The `asyncio.Queue` pattern (Section 1.4) maps directly to a `ReadableStream` with a controller — push from pipeline, pull from HTTP response. **Module 17 (Track B)** shows the exact browser-side implementation.

---

### 1.5 The Two-Stage SLM Architecture

Why classify with *two* small models instead of asking the big LLM once?

**Stage 1: Domain Router** (20ms, 50 tokens)
- Input: raw message + session context
- Output: which domain? (`property_search`, `locality_research`, `out_of_scope`)
- Model: fast Haiku variant, tiny prompt
- Why separate? Different domains have completely different taxonomies.
  Asking one model to know all of them → confused, expensive, slow.

**Stage 2: Domain Classifier** (50-200ms, 150 tokens)
- Input: message + domain-specific taxonomy prompt + session history
- Output: `main_intent/sub_intent`, `filter_delta`, `entity_refs`, `clarification_needed`
- Model: Haiku with the right domain's taxonomy appended
- Why separate from Stage 3? Classification is structured (JSON output, small).
  Generation is open-ended (prose, tool calls, formatting). Different tasks → different prompts, different temperature settings, different models.

**Total classification cost**: ~$0.0001 per turn (vs $0.005 if you used Sonnet for everything)
**Speed**: 150-250ms combined (vs 2-5s for a big model)
**Reliability**: structured JSON output from a small model trained to produce it is far more consistent than asking a big model to "return JSON please"

> **📝 Exercise — Module 1**
>
> **Question 1:** `emit_sse` calls `queue.put_nowait()` (synchronous). What happens if you accidentally use `await queue.put()` inside an `async` node? Why does this break the pattern?
>
> **Question 2:** The two-stage SLM adds 150–250ms total. Stage 2 needs Stage 1's output to know *which* taxonomy to load. What does this dependency mean for whether Stage 1 and Stage 2 can run in parallel?
>
> **Try it:** Find `safety_node` in `src/pipeline/nodes/safety.py`. Add a `pipeline_step` SSE event at the end (after the safety check passes). Run the playground — you should see the new node step appear in the pipeline panel.
>
> **Stretch (FE track):** The browser receives `message_delta` frames one chunk at a time. Write a TypeScript function that takes an `AsyncIterable<{content: {text: string}}>` and calls a callback on each chunk. How does this compare to `asyncio.Queue`'s generator pattern?

---

## Module 2 — The 19-Node Pipeline (LLD)

> **After this module you will be able to:**
> 1. Name all 19 nodes in order, grouped by phase (classify / process / response), from memory
> 2. Explain what each node's *one job* is and what it outputs
> 3. Identify which nodes can short-circuit the pipeline and under what conditions
> 4. Assign any new requirement to the correct tier (0/1/2/3a/3b) and explain why
>
> ⏱ Estimated time: 60 minutes | Difficulty: ★★★★☆ | Prerequisites: Module 1
>
> 💡 **How to read this module:** Read phases in three passes. Phase A (Classification, nodes 1–5), then stop and answer the mini-check. Phase B (Processing, nodes 6–11). Phase C (Response, nodes 12–19). This pacing is deliberate — 19 nodes at once overwhelm working memory.

### 2.1 Node Design Principles

Every node in this pipeline follows the same contract:
```python
async def node_name(state: BotState, dep1=None, dep2=None, emit_sse=None) -> dict:
    # 1. Read what you need from state
    # 2. Do exactly one job
    # 3. Return a partial state update (only the keys you own)
    # 4. emit_sse for real-time UI feedback (never for logic)
```

Never read from state keys you don't own. Never write keys another node owns.
This is the Single Responsibility Principle applied to pipeline nodes.

### 2.2 Node-by-Node Walkthrough

**Classification Phase** (nodes 1-5):

```
safety → normalize → route_domain → classify → validate_slm
```

**Node 1: safety_node**
Job: Block prompt injection, jailbreaks, profanity before spending any tokens.
Input: `raw_message`
Output: `safety_result` OR `bot_response` (short-circuit)

Why first? Because every subsequent node costs money. Don't spend tokens on attacks.

The safety check is keyword + pattern based (fast, deterministic). It does NOT call an LLM.
When it short-circuits, it sets `bot_response` → the conditional edge routes to END immediately.

```python
def _should_continue(state: BotState) -> str:
    return END if state.get('bot_response') else 'continue'

# Every non-terminal edge is conditional
graph.add_conditional_edges('safety', _should_continue, {'continue': 'normalize', END: END})
```

**Node 2: normalize_node**
Job: Fix typos, handle Unicode, lowercase, strip extra whitespace.
Input: `raw_message`
Output: `normalized_message`

Why separate from classify? Classification SLMs are trained on clean text.
Noisy input degrades accuracy significantly.

**Node 3: route_domain_node**
Job: Call Stage 1 SLM — which domain is this message about?
Input: `normalized_message`, `session.last_domain`
Output: `domain` (e.g. "property_search", "locality_research", "out_of_scope")

The domain router's prompt is tiny — it sees only domain names and brief descriptions.
Session context (`last_domain`) helps: "show me rent ones" routes correctly when
the previous domain was property_search even without any property-specific keywords.

**Node 4: classify_node**
Job: Call Stage 2 SLM — what specifically does the user want?
Input: `normalized_message`, `domain`, `session.last_3_turns` (with bot responses!), `session.active_filters`
Output: `classification` (full SLMOutput: main_intent, sub_intent, filter_delta, entity_refs, clarification_needed)

**Critical**: `last_3_turns` now includes the bot's previous response text (not just intent).
This is what allows "godrej" to be correctly interpreted as a disambiguation response
when the bot had just asked "Shapoorji or Godrej?" — the SLM sees what the bot said.

**Node 5: validate_slm_node**
Job: Sanity-check the SLM's classification output. Fix structurally invalid JSON.
Input: `classification`
Output: validated `classification` OR short-circuit `bot_response`

SLMs occasionally output malformed JSON, wrong intent names, or hallucinate fields.
This node catches those cases before they propagate to the rest of the pipeline.

> ⚠️ **Common Misconception:** "validate_slm handles all LLM reliability issues."
>
> **Reality:** validate_slm only checks *structure* — valid JSON, known intent names, required fields present. It does not check *semantic correctness* ("is 'property_search' the right label for this message?"). Semantic correctness is measured by the golden dataset accuracy in Module 5. Two different problems, two different solutions.

---
> **Phase A Mini-Check** — Before reading Phase B, answer these without looking back:
> - Which node runs first and why? (hint: every subsequent node costs money)
> - What does `validate_slm_node` catch that `classify_node` doesn't prevent?
> - Why does `last_3_turns` include the bot's previous *text response*, not just its intent?
>
> If you can't answer all three, re-read Section 2.2 Classification Phase before continuing.

---

**Processing Phase** (nodes 6-11):

```
filter_apply → sanitize → derive → clarify → resolve_entities → route
```

**Node 6: filter_apply_node**
Job: Merge the SLM's `filter_delta` into `session.active_filters`.
Input: `classification.filter_delta`, `session.active_filters`
Output: updated `session`

This is where "3BHK under 2Cr in Bandra" becomes structured data:
```json
{
  "bhk": [3],
  "price_max": 20000000,
  "localities": ["Bandra"],
  "city": "Mumbai"
}
```

Merge rules:
- Lists (`bhk`, `localities`, `amenities`) are *replaced*, not appended (user said "just 3BHK" — don't keep [2,3])
- Scalars (`price_max`, `city`) are *replaced*
- `filter_clear` signals from SLM explicitly null out keys

**Node 7: sanitize_node**
Job: Validate filter values against allowed enums. Remove impossible combinations.
Input: `session.active_filters`
Output: sanitized `session`

Examples: `bhk: [7]` → removed (doesn't exist in Indian real estate).
`price_max: 1000` → probably a typo for 1000000.

**Node 8: derive_node**
Job: Convert high-level filter signals to concrete API params.
Input: `session.active_filters`
Output: updated `session`

Three transformations happen here:
1. `price_per_sqft + area → price_range` (the user said "₹8000/sqft 1000sqft")
2. `search_anchor (text) → lat/lng` (the user said "near Manyata Tech Park")
3. `explore_nearby + localities → centroid lat/lng + radius` (our new feature!)

For transformation 3: when the user says "show nearby" and we have localities like
Sector 15/16, we call `resolveEntity` for each to get coordinates, compute the
centroid, and switch from locality-based to radius-based search. We save
`session.last_expand_context` so the next turn knows where to find nearby localities.

**Node 9: clarify_node**
Job: If the SLM flagged `clarification_needed`, short-circuit with a question.
Input: `classification.clarification_needed`, `classification.clarification_data`
Output: `bot_response` (a `nested_qna` template) OR pass-through

The SLM outputs: `"clarification_needed": "Which city are you looking in?"`
This node wraps it in a `nested_qna` template with buttons.

**Critical**: When clarify_node short-circuits, it must persist the session to Redis
*before* returning. The `followup_node` won't run (short-circuit bypasses it), so
without explicit session persistence here, any filter updates from `filter_apply_node`
are lost on the next turn.

**Node 10: resolve_entities_node**
Job: Convert entity names (localities, projects) to UUIDs. Resolve ordinal references.
Input: `classification.entities_mentioned`, `classification.entity_refs`, `session.carousel_state`
Output: `resolved_entities`, updated `session`

Two types of resolution:
1. **Named entities**: "Bandra" → call `resolveEntity` API → get UUID for the searchProperties call
2. **Ordinal references**: "the second property" → look up `carousel_state.items[1]` → get property ID

Ordinal resolution is pure local computation — no API call needed.
Named entity resolution calls the Housing autosuggest API.

**Node 11: route_node**
Job: Determine which tier this intent belongs to and execute immediately for Tier 0/1/2.
Input: `classification`, `session`
Output: `routing` (tier, model) OR `bot_response` (for tier 0/1/2 short-circuits)

Tier system:
```
Tier 0: auth required → show login template (no API, no LLM)
Tier 1: direct action (save property, contact seller) → execute + template response
Tier 2: orchestrator-fetched template (calculator, portfolio, nearby locality picker) → fetch + template, no LLM
Tier 3a: full LLM pipeline with Haiku (most intents)
Tier 3b: full LLM pipeline with Sonnet (complex: comparison, multi-intent)
```

This tiering is critical for cost and latency. A user tapping "Save Property" shouldn't
wait for an LLM to respond. Tier 1 responds in ~50ms with zero LLM cost.

---
> **Phase B Mini-Check** — Before reading Phase C, answer these:
> - Why does `filter_apply_node` *replace* lists (bhk, localities) instead of appending?
> - `clarify_node` short-circuits the pipeline. What session operation must it perform that `followup_node` normally handles?
> - What is the difference between `route_node` assigning tier vs `route_node` executing the tier?
>
> Answers in Section 2.2 above. Only continue to Phase C when you can answer all three.

---

**Response Phase** (nodes 12-19):

```
summary → experiment → fetch_data → respond → build_prompt → llm → validate_output → followup
```

**Node 12: summary_node**
Job: Emit a deterministic Phase-1 summary before data is fetched.
Input: `classification`, `session.active_filters`
Output: optional `summary_emitted` flag

For property_search/filter_search: immediately emit "Searching for 3BHK in Bandra..."
while the data fetch is happening. The user sees activity within 50ms.
This is the "eagerness guard" — only emits when all mentioned entities have high
confidence, so we don't claim "searching in Bandra" if we're not sure about Bandra.

**Node 13: experiment_node**
Job: Resolve active A/B experiment for this session.
Input: `session`, `classification`
Output: `experiment_id`, `experiment_variant`, optional `routing` override

The experiment config is hot-loaded from `config/experiments.yaml` every 60 seconds.
If a Sonnet experiment is active for this session, it overrides the model to Sonnet.
The LLM node reads `routing.model_override_task` to pick the right model.

**Node 14: fetch_data_node**
Job: Pre-fetch all tool data in parallel before the LLM call.
Input: `classification` (used to look up intent's data_requirements)
Output: `pre_fetched_data`

```python
# Intent registry defines what to fetch for each sub_intent:
IntentRecord(
    main_intent='property_search',
    sub_intent='filter_search',
    data_requirements=[
        DataRequirement(tool='searchProperties', params_source='session'),
    ],
)
```

The fetch happens in parallel groups. Group 1 fetches run simultaneously.
Group 2 only starts after Group 1 completes (for dependent fetches).

Why pre-fetch instead of letting the LLM call tools? Because:
1. Pre-fetch is deterministic — the orchestrator controls which tool gets called
2. Pre-fetch is faster — runs before the LLM starts, not during it
3. Pre-fetch is cheaper — cached results served from Redis TTL cache
4. LLM tool calls are for *residual* tools (things we couldn't predict)

**Node 15: respond_node**
Job: Emit template/carousel events based on pre-fetched data.
Input: `pre_fetched_data`, `classification`
Output: `template_count`, updated `session.carousel_state`

For property_search: builds a `property_carousel` template from `searchProperties` results.
Emits it as a `chat_event` SSE frame immediately — the carousel appears in the UI
before the LLM has said a word.

Also saves `carousel_state` to session:
```python
session['carousel_state'] = {
    'type': 'property',
    'items': [{'ordinal': 1, 'id': 'abc', 'title': '3BHK Bandra', 'price_display': '₹1.5Cr'}, ...]
}
```
This is what makes ordinal references ("the second one") work in future turns.

**Node 16: build_prompt_node**
Job: Assemble the LLM system prompt with all context.
Input: `classification`, `session`, `pre_fetched_data`, `resolved_entities`
Output: `system_prompt`, `tool_definitions`, `llm_messages`

The prompt builder (`_append_data_context`) injects:
1. Session filters (city, BHK, price range)
2. Pre-fetched data (property results, locality details)
3. **Resolved entity context** (specifically referenced properties/localities)
4. **Carousel context** (all shown properties for description-based references)
5. **Expansion context** (for "explore nearby" → tells LLM about the radius switch)

Why inject data into the system prompt rather than the user message?
System prompt is cached (Anthropic prompt caching → 90% cheaper for repeated prefix).
Data changes each turn, but the instructions stay the same.

**Node 17: llm_node**
Job: Stream LLM response. Handle tool calls. Emit `message_delta` SSE frames.
Input: `system_prompt`, `tool_definitions`, `llm_messages`
Output: `llm_response`, `tool_results`

Streaming works via callbacks:
```python
def on_chunk(chunk: str):
    emit_sse('message_delta', {'content': {'text': chunk}, 'chunkIndex': chunk_index})
    chunk_index += 1
```

Each token the LLM generates is immediately pushed to the queue → generator yields it →
browser receives it → UI appends it. This is why you see text appearing character by
character.

Tool calls (for residual tools) happen mid-stream:
```python
async def on_tool_use(tool: str, params: dict) -> Any:
    # Validate tool call against TOOL_REGISTRY
    # Translate to wire format (internal param names)
    # Execute with 2-second timeout
    # Return result to LLM for next generation step
```

**Node 18: validate_output_node**
Job: Strip prohibited content from LLM text output.
Input: `llm_response.text`
Output: `validated_text`

Rules:
1. Remove URLs (Housing.com doesn't want external links in responses)
2. Remove phone numbers (privacy, prevent contact bypass)
3. Strip markdown tables for non-comparison intents (chat UI doesn't render them well)
4. Log violations (for monitoring and prompt improvement)

**Node 19: followup_node**
Job: Emit the final text response, emit `connection_close`, persist session (background).
Input: `validated_text`, `session`, `classification`
Output: `bot_response`

The critical sequence:
```
emit chat_event (COMPLETED)   ← user sees response
build session update (CPU)    ← pure Python, fast
emit pipeline_step (node done)
emit connection_close         ← user can type now  ← THIS MUST HAPPEN BEFORE I/O
create_task(_persist_turn)    ← Redis + Kafka in background
return
```

**connection_close before persistence**: the user has no reason to wait for Redis.
Human reaction time is 150ms+. Redis write takes 2-5ms. By the time they've read
the response and started typing, Redis is long done.

Session update includes:
- `turn_history` (last 20 messages in Anthropic format, for LLM context)
- `last_3_turns` (condensed with bot response text, for classifier context)
- `last_intent` (for pivot detection)
- `carousel_state` (updated by respond_node earlier)
- `turn_count` (triggers summarization at multiples of 20)

> ⚠️ **Common Misconception:** "The LLM drives the pipeline — it decides what to fetch and what to say."
>
> **Reality:** By the time `llm_node` runs, all data is already fetched (by `fetch_data_node`), the carousel has already been emitted (by `respond_node`), and the prompt is already built (by `build_prompt_node`). The LLM's job is *only* to generate the conversational text wrapper around data that already exists. It doesn't make architectural decisions. Nodes 1–14 handle all the decisions.

> **Phase C Mini-Check** — Module 2 complete. Test yourself:
> - Why does the carousel appear *before* the LLM text? What node is responsible for each?
> - `build_prompt_node` caches the system prompt. Which provider enables this and what's the cost reduction?
> - Why is `connection_close` emitted in `followup_node` *before* the Redis write, not after?
>
> If you can name the node responsible for each behavior, you've internalized the pipeline. If you can't, one more pass through Phase C is worth 30 minutes of future debugging.

🎯 **MAANG Interview Connection:** "Walk me through your AI agent's architecture." This is Module 2 in 4 minutes. Lead with the three-phase structure, name one node per phase as examples, then explain the tier system. End with: "This means ~65% of messages never reach the LLM, which drives both our latency and our cost numbers." That's the L5–L6 framing.

---

## Module 3 — State Management

> **After this module you will be able to:**
> 1. Explain the difference between `BotState` (pipeline state, per-request) and `session` (user memory, Redis-persisted)
> 2. Write the Lua CAS script from memory and explain why it's needed over a simple GET → SET
> 3. Identify the PII risk in `turn_history` and describe the three mitigations for regulated industries
> 4. Explain when to use `turn_history` vs `last_3_turns` and why they're separate
>
> ⏱ Estimated time: 40 minutes | Difficulty: ★★★☆☆ | Prerequisites: Module 2

### 3.1 Pipeline State — The Typed Spine

```python
class BotState(TypedDict):
    # Input
    raw_message:        str
    session:            Dict[str, Any]
    request_id:         str

    # Set by nodes (each node owns its keys)
    safety_result:      Optional[Dict]
    normalized_message: Optional[str]
    domain:             Optional[str]
    classification:     Optional[Dict]
    resolved_entities:  Optional[Dict]
    routing:            Optional[Dict]
    pre_fetched_data:   Optional[Dict]
    system_prompt:      Optional[str]
    llm_response:       Optional[Dict]
    validated_text:     Optional[str]
    bot_response:       Optional[Any]   # short-circuit sentinel
    ...
```

The `bot_response` field is the short-circuit signal. Any node can set it to stop the pipeline.
This is more expressive than exceptions — it carries the response content AND stops execution.

### 3.2 Session State — The User's Memory

The `session` dict is the user's persistent memory across turns:

```python
{
    "session_id":          "uuid",
    "turn_count":          4,
    "active_filters":      {"city": "Mumbai", "bhk": [2], "price_max": 20000000},
    "turn_history":        [                  # Anthropic-format messages, newest first
        {"role": "user",      "content": "3BHK instead"},
        {"role": "assistant", "content": "Here are 3BHK options..."},
        {"role": "user",      "content": "show 2BHK in Bandra"},
        ...
    ],
    "last_3_turns":        [                  # condensed for classifier
        {"user": "...", "bot": "...", "main_intent": "...", "sub_intent": "..."},
        ...
    ],
    "carousel_state":      {"type": "property", "items": [...], "stored_at_turn": 3},
    "last_intent":         {"main_intent": "property_search", "sub_intent": "filter_search"},
    "last_expand_context": {"from_localities": [...], "lat": 28.47, "lng": 77.04},
    "version":             3,   # for optimistic locking
}
```

### 3.3 Redis — Session Store with Optimistic Locking

Sessions are stored in Redis with a 24-hour TTL.

**The Naive Approach — What Most Engineers Write First:**
```python
# Naive: two separate Redis operations
session = await redis.get(session_key)
session_data = json.loads(session)
session_data['turn_count'] += 1
await redis.set(session_key, json.dumps(session_data))
```

**The Failure:** Between `GET` and `SET`, a second concurrent request reads the same session.
Both compute `turn_count = 4`. The first write wins. The second silently overwrites it.
In production: user sees a filter they just set "disappear" on the next message because
the old session overwrote the new one. This took 3 hours to reproduce in staging.

**Why optimistic locking?**
If two requests come in for the same session simultaneously (unlikely but possible with
connection pooling), without locking you get a lost update problem: both read version=3,
both compute version=4, one overwrites the other.

**The Correct Approach:** Optimistic locking uses a Lua script that atomically checks the version and updates:

```lua
-- Runs atomically on Redis server
local ver_key = KEYS[2]
local stored  = tonumber(redis.call('GET', ver_key) or '0')
if stored ~= expected then
    return 0  -- conflict, caller should retry
end
redis.call('SETEX', KEYS[1], ttl, ARGV[2])   -- save full session JSON
redis.call('SETEX', ver_key, ttl, tostring(expected + 1))
return 1
```

**Why a separate version key?**
The original Lua script read the full session JSON and `cjson.decode`-d it in Lua
just to extract the version field. At turn 20 with 20-message history, the session
JSON is 10+ KB. Lua-side JSON parsing of 10KB on every write is wasteful.
The fix: store version as a separate 1-3 byte key (`session:{id}:ver`). The script
reads a tiny key instead of parsing the full blob. This is migration-safe: the first
write creates the version key; all subsequent writes use the fast path.

### 3.3b PII in Session State — The Compliance Gap

`turn_history` stores raw conversation text, verbatim. Users speak phone numbers,
email addresses, financial details, and medical information into chat interfaces.

**The gap:** `validate_output_node` strips phone numbers from LLM *output* — but
those digits are already written to `turn_history` before that node runs.

For regulated industries you must address this before persistence:

```python
async def _persist_turn(session: dict, ...):
    # Before Redis write: scrub PII from turn_history
    session = apply_pii_scrubber(session)   # regex + ML-based NER
    await redis.set(session_key, json.dumps(session))
```

| Regulation | Requirement | How to implement |
|---|---|---|
| GDPR | Right to erasure within 30 days | `DELETE FROM conversations WHERE user_id=?` + Redis DEL + Kafka tombstone |
| HIPAA | Audit log retention 6 years | Write-once S3/Blob store for conversation archive; TTL only on Redis cache |
| PCI-DSS | No card data in logs | PII scrubber must catch 16-digit sequences before any persistence |
| General | Encrypt at rest | AES-256 per-tenant key for `turn_history` field; rotate keys annually |

**The rule:** treat `turn_history` like a database column containing PII, because it is.

### 3.4 Full History vs Windowed Context — Two Different Contexts

**turn_history**: Anthropic-format messages for the LLM.
- Contains full user messages + full bot responses
- Up to 20 messages (~10 turns)
- Used by `llm_node` as the `messages` parameter
- The LLM needs this to remember the full conversation

**last_3_turns**: Condensed context for the classifier SLM.
- Contains user message, bot response text (truncated to 400 chars), intent
- Only last 3 turns
- Used by `classify_node` as `history`
- **Critical**: includes bot response text — this is what lets the SLM understand
  "godrej" as a disambiguation response when the bot had just asked "Shapoorji or Godrej?"

### 3.5 Context Window Management — What Happens at Turn 20

The current codebase caps `turn_history` at 20 messages. At turn 21, the oldest messages
are dropped (sliding window). This is correct for Housing.com (property search sessions
rarely exceed 10 turns). But you need to know the full strategy ladder for other domains:

```
Strategy Ladder — choose based on typical session length and information density
│
├─ Sessions < 20 turns (most consumer products)
│   └─ Sliding window (this codebase). Keep last N turns. Simple, predictable.
│      Risk: loses early context (user's city set on turn 1 dropped at turn 21).
│      Fix: "anchor" critical session facts in Redis fields, not in turn_history.
│
├─ Sessions 20–100 turns (customer support, document assistants)
│   └─ Hierarchical summarization. When `turn_count % 20 == 0`, fire a background
│      Haiku call that compresses the oldest 10 turns into a summary paragraph.
│      Store as `session.conversation_summary`. Inject into LLM system prompt.
│      Cost: ~$0.0005 per summarization. Keeps context window stable indefinitely.
│
├─ Sessions > 100 turns or "memory" across sessions (personal assistants, copilots)
│   └─ Semantic retrieval. Store all turns in a vector DB (pgvector or Pinecone).
│      At query time, retrieve the 5 most semantically relevant past turns.
│      Much more complex infrastructure; only justified for long-lived agents.
│
└─ Sparse conversations with very high stakes (legal, medical)
    └─ Manual anchoring. Identify "critical facts" explicitly (date of birth, case number,
       confirmed diagnosis). Store in a separate structured field. Always inject.
       Don't rely on LLM to "remember" from turn_history.
```

> 🎯 **MAANG Interview Connection:** "How do you handle context window limits in a long-running conversation?" This is a standard L5 question. The expected answer walks through the strategy ladder above. The L6 answer also addresses WHEN to upgrade from sliding window to hierarchical summarization (product signal: users reference early-conversation facts after turn 20 and get confused) and the cost math for each strategy.

---

## Module 4 — The Tool System

> **After this module you will be able to:**
> 1. Explain the pre-fetch vs residual tool distinction and name the latency consequence of getting it wrong
> 2. Describe the adapter / port pattern and write a new tool adapter that satisfies `ClassifierPort`
> 3. Explain why `CachedExecutor` uses `sort_keys=True` in its hash function (and what breaks if you don't)
> 4. Rotate a provider (Anthropic → Azure OpenAI) without changing a single pipeline node
>
> ⏱ Estimated time: 40 minutes | Difficulty: ★★★☆☆ | Prerequisites: Module 2, 3

### 4.1 Tool Registry — The Single Source of Truth

Every tool the system can call is registered in `TOOL_REGISTRY`:

```python
ToolRecord(
    name='searchProperties',
    tier='data',
    llm_visible=True,        # can the LLM call this as a residual tool?
    tier_b=False,            # is it always available regardless of intent?
    description='Search Housing.com inventory...',
    input_params=[
        ToolParam(key='city',          type='string',  required=True),
        ToolParam(key='bhk',           type='array',   required=False),
        ToolParam(key='locality_uuids', type='array', required=False,
                  wire_param='localities'),  # internal API name differs
        ToolParam(key='price_max',     type='integer', required=False),
        ToolParam(key='lat',           type='number',  required=False),
        ToolParam(key='lng',           type='number',  required=False),
        ToolParam(key='outer_radius',  type='integer', required=False),
    ],
    return_schema_summary='{ total_count, hits: PropertyCard[], srset_id }',
)
```

`wire_param`: the LLM sees `locality_uuids` but the internal API expects `localities`.
This translation happens in `translate_to_wire_format` before any API call.
The LLM never sees internal parameter names.

### 4.2 Pre-fetch vs Residual Tools

**Pre-fetch** (orchestrator-controlled):
- Defined in `IntentRecord.data_requirements`
- Runs in `fetch_data_node` before the LLM call
- Deterministic — the orchestrator knows what data is needed for this intent
- Cached in Redis with TTL
- Zero LLM cost for the fetch decision

**Residual** (LLM-controlled):
- Defined in `IntentRecord.residual_tools`
- Available to LLM as tool definitions in its API call
- Called when pre-fetch didn't cover an edge case
- Tier B tools (calculateEMI, convertUnit) are always available to all Tier 3 intents
- LLM decides *if* and *when* to call them

Why this split? The pre-fetch is always called for the intent's primary data need.
Residual tools are for "I need this too, but only sometimes" cases.

### 4.2b The Adapter / Port Pattern — Provider-Agnostic Design

How does the pipeline stay provider-agnostic? Through the Port/Adapter pattern.

Nodes depend only on *protocols*. Concrete implementations are injected at graph build time.

```python
# ClassifierPort — the interface a node depends on (3 lines)
class ClassifierPort(Protocol):
    async def classify(self, message: str, domain: str, session: dict) -> dict: ...

# AnthropicClassifier and OpenRouterClassifier both satisfy this protocol
# build_graph() injects the concrete instance via functools.partial

async def classify_node(state: BotState, classifier: ClassifierPort = None) -> dict:
    result = await classifier.classify(
        state['normalized_message'], state['domain'], state['session']
    )
    return {"classification": result}
```

The `build_graph()` function receives the concrete adapter and injects it:
```python
from src.adapters.factory import build_domain_router, build_classifier, build_llm

graph = build_graph(
    router=build_domain_router(settings),     # selected by MODEL_REGISTRY
    classifier=build_classifier(settings),
    llm=build_llm(settings),
)
```

`MODEL_REGISTRY` maps `"anthropic"` → `AnthropicClassifier`, `"openrouter"` → `OpenRouterClassifier`.
Switching providers = change `MODEL_REGISTRY` in config + restart. Zero code change.

**Critical for testing**: nodes are tested against mock ports, not real LLMs.
The entire test suite runs without API keys.

### 4.3 Tool Executor — Caching and Abstraction

```python
import hashlib, json

class CachedExecutor:
    async def execute(self, tool: str, params: dict, ttl: int) -> dict:
        # Sort params for stable key regardless of dict insertion order.
        # Use hashlib (not Python's hash()) — hash() is non-deterministic
        # across process restarts (PYTHONHASHSEED varies per run).
        key_material = json.dumps({"tool": tool, "params": params}, sort_keys=True)
        cache_key = f"tool:{hashlib.md5(key_material.encode()).hexdigest()}"
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)
        result = await self._call_api(tool, params)
        await self.redis.setex(cache_key, ttl, json.dumps(result))
        return result
```

The cache TTL varies by tool:
- `searchProperties`: 60s (results change frequently)
- `getLocalityDetail`: 3600s (locality info changes rarely)
- `calculateEMI`: 0s (always fresh — it's computation)

In `dev` mode: `DevExecutor` returns contextually-rich mock data.
In `local` mode (VPN): real Housing APIs are called.
The adapter pattern means switching is a config change, not a code change.

### 4.4 The Parameter Resolution Pattern

```python
class DataRequirement(BaseModel):
    tool: str
    params_source: str    # 'session' | 'entity_resolution' | 'filter_delta'
    parallel_group: int
```

`params_source='session'` → `active_filters` from session (for searches)
`params_source='entity_resolution'` → first resolved entity (for detail fetches)
`params_source='filter_delta'` → just the SLM's delta (for one-shot queries)

This is how `getLocalityDetail` knows to use the resolved locality UUID even though
the session has a different active property — it reads from `resolved_entities[0]`.

> **📝 Exercise — Module 4** (Apply the pattern to a new domain)
>
> Design the tool layer for a **Google Drive file-search agent**:
>
> 1. **Write a `ToolRecord`** for `searchFiles`:
>    - Parameters: `query` (string, required), `owner_email` (string, optional), `modified_after` (ISO date string, optional), `file_type` (enum: `doc|sheet|slide|pdf`, optional)
>    - The internal Drive API uses `mimeType` not `file_type`, and expects a list of MIME type strings. Write the `wire_param` mapping.
>
> 2. **Write an `IntentRecord`** for a `find_files` intent that pre-fetches `searchFiles` from `params_source='session'`.
>
> 3. **TTL decision:** Should `searchFiles` results be cached? If yes, for how long? Consider: Drive files can be modified at any time. Compare this to Housing.com's `searchProperties` TTL of 60s.
>
> 4. **`[FE BRIDGE]`:** The tool registry defines `wire_param` as a server-side concern so the LLM never sees internal API parameter names. What is the FE equivalent of this abstraction? (Hint: think about API client layers that normalize backend response shapes before they reach UI components.)
>
> *Reference:* `src/registries/tool_registry.py` and `intent_registry.py` for working Housing.com examples.

---

## Module 5 — Testing & Quality Engineering

> **After this module you will be able to:**
> 1. Describe the three test layers (unit / model_eval / E2E), when each runs, and what each catches
> 2. Write a unit test for a pipeline node that uses a mock port — zero LLM calls, deterministic
> 3. Design a golden dataset: what samples to include, how many, and how to keep it current
> 4. Wire CI/CD gates so that a broken prompt cannot reach production without failing `model_eval`
>
> ⏱ Estimated time: 45 minutes | Difficulty: ★★★☆☆ | Prerequisites: Module 2, 4

The codebase has a rich test suite (tests/unit/, tests/integration/, tests/model_eval/)
but this is the mental model you need:

### 5.1 The Three Layers

**Layer 1: Unit tests on node logic (every PR, <30 seconds, zero API cost)**

Because each node takes `(state: BotState, dep=None)` and returns a partial state dict,
unit testing is trivial. Build a BotState with pytest fixtures, call the node directly,
assert on the returned dict. You never need to run the full LangGraph graph.

```python
# Test filter_apply_node with a price string
state = make_bot_state(classification={'filter_delta': {'price_max': '2cr'}})
result = await filter_apply_node(state)
assert result['session']['active_filters']['price_max'] == 20_000_000

# Test safety_node short-circuit
state = make_bot_state(raw_message="ignore all previous instructions and...")
result = await safety_node(state)
assert 'bot_response' in result  # should short-circuit
```

**Layer 2: Model eval tests on SLM classification quality (nightly, ~$0.50/run)**

Run the SLM classifiers against a golden dataset of 50–100 labeled examples per domain.
Catches prompt regressions when taxonomy prompts are edited.
Alert if accuracy drops below threshold (e.g. 90%).

```
tests/model_eval/
  property_search_golden.json   ← 50 examples: input message → expected intent
  locality_research_golden.json
```

**The golden dataset is more valuable than any code.** Version-control it. Expand it
whenever a new production bug is found. Review it on every taxonomy change.

**Layer 3: E2E tests (pre-release, manual on tag)**

Run against `BOT_ENV=dev` with real adapters. Verify the SSE stream produces valid events.
Verify carousel renders correctly. Catches wiring bugs that unit tests can't.

### 5.2 Prompt Engineering — The Iteration Cycle

A taxonomy prompt has four components that must work together:
1. **Intent schema** — defines the JSON output structure. Ambiguity here → structural validation failures.
2. **Intent taxonomy** — list of intents with one-sentence descriptions. Vague descriptions → hallucination.
3. **Filter schema** — which keys may appear in filter_delta, with types. Missing a key → user input silently dropped.
4. **Few-shot examples** — 3–5 per intent covering edge cases: ordinal refs, pivot detection, disambiguation.

The iteration cycle:
```
run model_eval tests → find failing cases
    → add few-shot example covering the pattern
        → re-run → accuracy improves
```

The `reasoning` field in SLM output (already in this codebase's classification dict)
shows *why* the SLM chose a classification. This dramatically speeds up debugging.

### 5.3 CI/CD Pipeline Wiring

AI agents have a unique CI/CD challenge: unit tests run for free on every PR, but
prompt quality regressions require running the real LLM — which costs money and takes time.

**Three gates, three different triggers:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Gate 1: Pre-merge (every PR)                                   │
│  pytest tests/unit tests/integration --bot-env=mock             │
│  Runtime: <30s  Cost: $0  Catches: node logic, state bugs       │
├─────────────────────────────────────────────────────────────────┤
│  Gate 2: Nightly (scheduled, 2am)                               │
│  pytest tests/model_eval                                         │
│  Runtime: ~5min  Cost: ~$0.50  Catches: prompt regressions       │
│  Alert: Slack/PagerDuty if accuracy < 90% on golden dataset     │
├─────────────────────────────────────────────────────────────────┤
│  Gate 3: Pre-release (manual on tag)                            │
│  pytest tests/e2e --bot-env=dev                                  │
│  Runtime: ~15min  Cost: ~$2  Catches: wiring, SSE format bugs   │
└─────────────────────────────────────────────────────────────────┘
```

**Taxonomy prompt deploys — no-downtime strategy:**

Prompt files (`prompts/slm/domains/*.md`) are read at classifier construction time.
A naive deploy reloads the classifier mid-traffic and risks a race condition.
The safe pattern: **blue-green prompt versioning**.

```python
# Classifier reads the active version from Redis, not the filesystem directly
active_version = await redis.get("prompt:property_search:active_version") or "v1"
prompt_text = load_prompt(f"prompts/slm/domains/property_search_{active_version}.md")

# Deploy flow:
# 1. Upload new prompt as property_search_v2.md
# 2. Run model_eval against v2 in staging
# 3. If accuracy >= threshold: SET prompt:property_search:active_version v2
# 4. All new classifier instances pick up v2 on next cold start
# 5. Keep v1 for 24h rollback window
```

This means you can ship a prompt change with zero downtime and instant rollback by
flipping one Redis key — no code deploy, no restart, no traffic interruption.

---

## Module 6 — Observability and Logging

> **After this module you will be able to:**
> 1. Write a structured log event with `session_id`, `intent`, `latency_ms`, and `cost_usd` as top-level fields
> 2. Explain what LangSmith traces and what structlog logs — and why you need both
> 3. List the 5 AI-specific metrics to monitor beyond standard web service metrics (latency, error rate)
> 4. Debug "why did the agent say that?" using only the playground and LangSmith trace
>
> ⏱ Estimated time: 35 minutes | Difficulty: ★★★☆☆ | Prerequisites: Module 2

### 6.1 Structured Logging — Everything Is a JSON Object

Never use `print()` or `logging.info("something %s", var)`.

```python
log = get_logger(__name__)

# Bad
log.info(f"Classifying message: {message}")

# Good
log.info("slm_classification",
         domain=domain,
         main_intent=result.get("main_intent"),
         latency_ms=latency_ms,
         model=model_id)
```

Every log entry is a JSON object with:
- `event`: what happened (snake_case string)
- `level`: info/warning/error
- `ts`: ISO timestamp
- Named fields for every relevant variable

This makes logs queryable: `jq 'select(.event=="slm_classification" and .latency_ms > 500)'`.
`make logs-pipeline` filters the production log for pipeline events only.

### 6.2 LangSmith — Every LLM Call Traced

Every Anthropic API call is wrapped with `@traceable`:

```python
@_traceable(run_type="llm", name="intent_classifier")
async def _call_api(self, model_id, system_prompt, user_content) -> dict:
    response = await client.messages.create(...)
    return result
```

LangSmith records:
- The exact prompt sent (system + user content)
- The model's output
- Token usage and cost
- Latency
- Errors and retries

**Debugging walkthrough — how to actually use it:**

*Bug: user says "show me 2BHK near the sea in Bandra under 2Cr" and gets out_of_scope.*

1. Find `session_id` in the structured log:
   ```bash
   jq 'select(.event=="session_loaded") | .session_id' app.log
   ```
2. Open LangSmith, filter by session_id (injected as metadata on every `@traceable` call).
3. Click the `domain_routing` trace — confidence=0.42, below 0.65 threshold → coerced to `out_of_scope`.
4. Click the actual prompt — "near the sea" is ambiguous (locality vs sea-view amenity).
5. Fix: add a few-shot example to `domain_router.md` showing "near the sea" → `property_search`.

This is the actual debugging loop that happens dozens of times a day on a live system.
LangSmith is only useful if you know this loop.

### 6.3 The Playground — Your Development Microscope

The playground (`/playground`) shows every SSE event in real-time:
- Pipeline sidebar: which nodes ran, in what order, how long each took
- Per-node detail panels: the SLM's reasoning, filter delta, entity refs
- LLM panel: model used, tokens consumed, cost, stop reason, chunks streamed
- SSE timeline: every frame the server sent, in order

The playground is not a demo — it's a debugging tool built for the engineers building
the system. Every new node you add should emit a `pipeline_step` SSE event with its
decision data. This is how you debug in real-time without looking at logs.

### 6.4 Cost Tracking

Every turn tracks cost:
```python
_PRICES = {
    'claude-haiku-4-5-20251001': (0.80, 4.00),    # input, output per 1M tokens
    'claude-sonnet-4-6':         (3.00, 15.00),
}
cost_usd = (input_tokens * in_p + output_tokens * out_p) / 1_000_000
```

The playground shows `$0.00638 turn`. Multiply by daily active users to get monthly LLM bill.
Set alerts when per-turn cost exceeds your budget threshold.

### 6.5 AI-Specific Monitoring — Beyond Standard Web Metrics

Standard web observability (latency, error rate, throughput) is necessary but not sufficient
for AI systems. These metrics exist only in AI systems and don't appear in your default
monitoring dashboards. Add them explicitly to Kafka events and your analytics stack:

| Metric | How to Measure | Alert Threshold | What It Signals |
|---|---|---|---|
| Intent coverage rate | `out_of_scope` count / total turns | >8% rising over 7 days | Users asking about things your taxonomy doesn't handle |
| SLM confidence distribution | P10/P50/P90 of `classification.confidence` | P50 drops >5pts week-over-week | Classifier degrading (distribution shift, new phrasing) |
| Clarification rate | `clarification_needed=true` / total turns | >20% | Queries too ambiguous for your taxonomy |
| LLM refusal rate | `validate_output` strips content / total LLM turns | >2% | Prompt safety triggers firing on legitimate queries |
| Session depth anomalies | Average turns per session by outcome | Depth >6 without completion | Agent confusing users (many turns, no result) |

**Log these as Kafka events in `followup_node`:**
```python
await kafka_producer.send("turn_analytics", {
    "session_id": session_id,
    "intent": state.get("classification", {}).get("main_intent", "unknown"),
    "tier": state.get("tier"),
    "confidence": state.get("classification", {}).get("confidence", 0),
    "is_out_of_scope": intent == "out_of_scope",
    "clarification_needed": state.get("classification", {}).get("clarification_needed", False),
    "llm_content_stripped": len(state.get("violations", [])) > 0,
    "turn_number": session.get("turn_count", 0),
})
```

> 🎯 **MAANG Interview Connection:** "How would you know if your AI agent was working well in production, without looking at accuracy numbers?" This question is answered entirely by Section 6.5. Name 3 of these metrics, explain how to instrument them (Kafka events, analytics dashboard), and describe what thresholds would trigger an investigation. Mentioning "intent coverage rate as an early warning for taxonomy gaps" signals that you think about AI systems as living things that drift over time — that's the L6 framing.

---

## Module 7 — A/B Experiments

> **After this module you will be able to:**
> 1. Explain deterministic assignment (hash-based, not random) and why it matters for session consistency
> 2. Design an auto-rollback trigger: specific threshold, time window, and what triggers the revert
> 3. Calculate minimum sample size for a prompt experiment (p<0.05, 80% power, given your baseline and MDE)
> 4. Describe the "no-peek" rule and the concrete mistake it prevents
>
> ⏱ Estimated time: 35 minutes | Difficulty: ★★★☆☆ | Prerequisites: Module 5, 6

### 7.1 The Experiment Framework

```yaml
# config/experiments.yaml
experiments:
  - id: "sonnet_vs_haiku_comparison"
    active: true
    traffic_pct: 20        # 20% of sessions get this experiment
    variant_split:
      - id: "control"       # 50% of 20% → 10% overall
        traffic_pct: 50
        model_override_task: null   # stays on Haiku
      - id: "treatment"     # 50% of 20% → 10% overall
        traffic_pct: 50
        model_override_task: "llm_tier3b"   # switches to Sonnet
```

Assignment is session-level (consistent for the whole conversation), not turn-level.
Uses `hash(session_id + experiment_id) % 100 < traffic_pct` for deterministic, balanced assignment.

### 7.2 What to A/B Test

- **Model selection**: Haiku vs Sonnet for specific intents (quality vs cost)
- **Prompt variants**: different system prompt phrasings
- **Tiering thresholds**: which intents get Tier 2 vs Tier 3
- **Clarification behavior**: ask vs proceed when information is ambiguous

### 7.3 How to Measure

The `experiment_id` and `experiment_variant` fields are in every Kafka event.
Consume the Kafka topic in your analytics system and compare:
- Turn completion rate (did the user get what they wanted?)
- Session length (fewer turns = better UX)
- Click-through rate on carousel cards
- Cost per session

### 7.4 Experiment Guardrails — Automatic Rollback

Experiments can go wrong. Manual monitoring at 3am is not a strategy.

**Auto-rollback trigger:**
```python
# Guardrail consumer (runs as a Kafka Streams job)
# Every 5 minutes, compare error rates across variants
def check_guardrails(experiment_id: str, window_minutes: int = 15):
    control_errors   = get_error_rate(experiment_id, variant="control",   minutes=window_minutes)
    treatment_errors = get_error_rate(experiment_id, variant="treatment", minutes=window_minutes)

    if treatment_errors > control_errors * 3.0:   # 3× degradation threshold
        log.critical("experiment_guardrail_triggered",
                     experiment_id=experiment_id,
                     control_rate=control_errors,
                     treatment_rate=treatment_errors)
        # Rollback: set all traffic to control in the YAML config
        redis.set(f"experiment:{experiment_id}:override", "control")
        alert_oncall(f"Experiment {experiment_id} auto-rolled back")
```

**Statistical validity — before you start:**

Common mistake: launch an experiment, peek at results after 2 days, declare a winner.
This causes false positives at a rate far above your nominal p<0.05 threshold.

```
Before starting any experiment, define:
1. Primary metric (e.g. turn_completion_rate)
2. Minimum detectable effect (e.g. 7% improvement, from 0.72 → 0.77)
3. Minimum sample size:
   At 80% power, p<0.05, MDE=7%, baseline=72%:
   n ≈ 800 sessions per arm
4. Traffic split and duration:
   20% traffic → 10% per arm → at 500 sessions/day: 16 days minimum
5. No-peek rule: do not look at results before minimum sample is reached
```

Only analyze after reaching minimum sample. Use sequential testing (mSPRT) if you
must check early — it controls false positive rate under continuous monitoring.

---

## Module 8 — Production Readiness

> **After this module you will be able to:**
> 1. Explain the concurrency gate: what it limits, what happens when the queue is full, and the tradeoff vs a simple semaphore
> 2. Draw the T+0ms → T+200ms background persistence timeline and explain why `connection_close` must precede all I/O
> 3. Complete the degradation map: what continues, degrades, or breaks when Redis/Kafka/Postgres goes down
> 4. Describe the blue-green prompt deployment strategy and what makes it zero-downtime
>
> ⏱ Estimated time: 45 minutes | Difficulty: ★★★★☆ | Prerequisites: Modules 3, 5, 6

### 8.1 The LLM Concurrency Gate

Anthropic has rate limits. Too many concurrent LLM calls → 429 errors → bad UX.

```python
class LLMConcurrencyGate:
    async def acquire(self) -> bool:
        # Redis-backed: INCR if count < max_concurrent, else RPUSH to wait queue
        # max_concurrent=20, queue_max=50
        # Returns True (proceed), False (rate limited)
```

If the queue is full, return HTTP 429 to the client immediately rather than making
them wait for minutes. The client can retry with exponential backoff.

### 8.2 Kafka — The Audit Trail

Every chat event is published to Kafka:

```python
await publish('chat.messages', {
    'conversation_id': conversation_id,
    'event': chat_event_dict,
})
```

Why Kafka?
- **Durability**: events survive Redis cache eviction
- **Replay**: re-process events if you find a bug
- **Analytics**: consume the topic in your data warehouse
- **Summarization**: off-critical-path conversation summarization consumer
- **Multiple consumers**: data team, ML team, product analytics — all subscribe to the same stream

Kafka writes are fire-and-forget from the API's perspective. They run in `create_task`,
don't block the user, and use a ring buffer fallback if Kafka is unavailable.

### 8.3 The Background Persistence Architecture

This deserves its own callout because it's subtle and important:

```
User interaction timeline:
  T+0ms     emit chat_event       ← user sees response
  T+1ms     emit pipeline_step    ← pipeline panel updates
  T+2ms     emit connection_close ← user can type
  T+3ms     [user starts reading]
  T+5ms     Redis write completes ← background
  T+15ms    Kafka write completes ← background
  T+200ms   [human reaction time — user starts typing]
  T+300ms   next request arrives  ← Redis already updated ✓
```

By separating "done for the user" from "done for infrastructure", we cut the perceived
latency by 30-40% without sacrificing correctness. Redis finishes before any human
could possibly send the next message. Kafka finishing before the data team's next query
is always guaranteed by the service's own latency.

### 8.4 Graceful Degradation Map

Every dependency can fail. This is the required artifact — like a circuit breaker diagram:

| Dependency fails | User impact | Degradation behavior |
|---|---|---|
| Redis unavailable | Session lost | Fresh session created — user loses context but gets a response. **Bug**: LLM gate is also Redis-backed — gate.acquire() must fail **open** (permit the request), not fail closed (block all users). |
| Domain router SLM timeout | Domain unknown | Fallback to `session.last_domain`. Implemented in route_domain_node. |
| Stage 2 SLM timeout | Intent unknown | Fallback to `out_of_scope`. Implemented in AnthropicClassifier. |
| Housing API timeout | No property data | `fetch_errors` populated. Pipeline continues. LLM says "I couldn't find properties" — acceptable. |
| Kafka unavailable | Events lost | Fire-and-forget — silent failure. Ring buffer catches bursts. |

### 8.5 Handling Failure Gracefully

Every await that talks to external services has a timeout and a fallback:

```python
# SLM classification: 2s timeout, 3 retries, fallback to out_of_scope
result = await asyncio.wait_for(self._call_api(...), timeout=10.0)

# Tool fetch: 2s timeout per tool
result = await asyncio.wait_for(executor.execute(...), timeout=2.0)

# Gate release: wrapped in try/except — never let infrastructure failure
# prevent connection_close from reaching the user
try:
    await gate.release()
except Exception as exc:
    log.error("gate_release_failed", error=str(exc))
# execution continues to yield connection_close regardless
```

The cascade rule: no upstream failure should produce an unhandled exception that
reaches the user as a blank screen. Every node either handles its exception internally
or allows `_run_pipeline` to catch it and emit a user-facing error.

### 8.6 Deployment Strategy

**The SSE sticky-session constraint:**

Each FastAPI instance has its own `asyncio.Queue` per request. SSE connections are
stateful to the instance for the duration of the stream (~2–5 seconds). This means:

- During a rolling deploy, a client mid-stream on instance A must NOT be routed to instance B
- Require sticky sessions on the load balancer **during the overlap window only**
- AWS ALB: `stickiness.enabled = true`, `stickiness.duration_seconds = 30`
- After the stream ends (`connection_close`), the next request can go to any instance

```
Deploy flow:
  1. Deploy new instances (v2) behind the LB alongside old ones (v1)
  2. Enable sticky sessions (30s duration)
  3. Drain v1: LB stops sending new connections to v1 instances
  4. Wait 30s for all in-flight SSE streams on v1 to complete
  5. Terminate v1 instances
  6. Disable sticky sessions (no longer needed — all instances are v2)
```

**Node code deploys:** standard blue-green. Session state lives in Redis (external),
so any instance can serve any session. No instance-local state to worry about.

**Taxonomy prompt deploys:** via Redis prompt versioning (see Module 5.3). Zero downtime.
Zero restart. Rollback by flipping one Redis key.

**Rollback signals — automate, don't rely on humans:**

```python
# Deploy watchdog: runs for 10 minutes post-deploy
# Compares error rate in 5-minute rolling windows pre/post deploy
def deploy_watchdog(deploy_time: datetime, threshold: float = 2.0):
    pre_rate  = get_error_rate(before=deploy_time, window=5)
    post_rate = get_error_rate(after=deploy_time,  window=5)
    if post_rate > pre_rate * threshold:
        trigger_rollback()   # re-route all traffic to previous version
        alert_oncall(f"Auto-rolled back: error rate {pre_rate:.3f} → {post_rate:.3f}")
```

---

## Module 9 — Security & Authentication

> **After this module you will be able to:**
> 1. Explain why JWT validation happens at the API boundary (FastAPI dependency) not inside pipeline nodes
> 2. Map the tier system to RBAC: which tier requires which user role, and where that check lives
> 3. Describe secrets rotation without restart using the adapter factory pattern
> 4. Explain two-layer adversarial safety and when to trigger Layer 2 (semantic classifier) vs Layer 1 alone
>
> ⏱ Estimated time: 50 minutes | Difficulty: ★★★★☆ | Prerequisites: Modules 4, 8

Security is not a feature you add at the end. Every architectural decision from Module 1
onward has a security consequence. This module maps those consequences and shows the fixes.

### 9.1 Auth at the Pipeline Boundary

The pipeline's entry point is `POST /api/v1/chat/send-message-streamed`. Auth must be
validated *before* `raw_message` enters the graph — not inside a node.

```python
# FastAPI dependency — runs before the route handler
async def require_auth(request: Request) -> dict:
    token = request.headers.get("Authorization", "").removeprefix("Bearer ")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        claims = jwt.decode(token, settings.jwt_public_key, algorithms=["RS256"])
        return {"user_id": claims["sub"], "role": claims.get("role", "guest")}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Route uses the dependency
@router.post("/send-message-streamed")
async def send_message(req: MessageRequest, auth: dict = Depends(require_auth)):
    session = await load_session(req.conversation_id)
    session["user_id"] = auth["user_id"]   # from validated token claim
    session["user_role"] = auth["role"]    # NEVER trust client-provided role
```

**The rule:** `session.user_id` and `session.user_role` come from validated JWT claims,
never from the request body. A client that sends `{"user_id": "admin"}` in the body
must be ignored. Trust the token, not the payload.

**Token refresh mid-conversation:** JWT tokens expire. At turn 8 of a conversation a
user's 15-minute token may expire. Handle this in the frontend (refresh silently) or
return HTTP 401 with a `retry_after_refresh` hint — never let an expired token silently
downgrade the user's access mid-session.

### 9.2 RBAC Within the Agent — Tier 0 Is the Mechanism

The tier system (Module 2) is also your authorization system. Tier 0 already says
"auth required." The full pattern maps `(intent, role)` → tier:

```python
@dataclass
class IntentRecord:
    main_intent:      str
    sub_intent:       str
    required_role:    str = "any"      # "any" | "authenticated" | "premium" | "agent"
    tier:             int = 3

# In route_node:
async def route_node(state: BotState) -> dict:
    intent = state["classification"]
    record = INTENT_REGISTRY[intent["sub_intent"]]

    user_role = state["session"].get("user_role", "guest")
    if not _has_role(user_role, record.required_role):
        return {"bot_response": login_prompt_template()}  # Tier 0 short-circuit

    return {"routing": {"tier": record.tier, "model": record.model}}
```

| Intent | Required role | Tier |
|---|---|---|
| view_properties | any (guest ok) | 3a |
| save_property | authenticated | 1 |
| contact_seller | authenticated | 1 |
| view_portfolio | authenticated | 3a |
| get_premium_valuation | premium | 3b |

### 9.3 Secrets Management — Rotation Without Restart

Hardcoded API keys in `.env` work for development. In production, keys rotate.
The adapter factory pattern (Module 4.2b) makes rotation clean:

```python
# Instead of reading the key once at startup:
class AnthropicClassifier:
    def __init__(self, settings: Settings):
        self._settings = settings          # hold settings reference

    async def classify(self, ...):
        # Re-read key on each adapter construction, not at module import
        api_key = await get_secret("anthropic/api-key")  # Azure Key Vault / AWS Secrets Manager
        client = anthropic.AsyncAnthropic(api_key=api_key)
        ...
```

**With the adapter factory:** rotate the key in Secrets Manager → trigger a rolling
restart of the adapters (not the full server) → new instances pick up the new key.
The pipeline nodes never see the key — they only see the adapter protocol.

**For Azure:** use Managed Identity instead of API keys where possible:
```python
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

credential = DefaultAzureCredential()   # no key needed — uses pod identity
client = SecretClient(vault_url=settings.key_vault_url, credential=credential)
secret = client.get_secret("anthropic-api-key").value
```

### 9.4 Adversarial Safety — Beyond Keywords

The `safety_node` does keyword + pattern matching (Layer 1). This is fast (0ms, no LLM)
and catches obvious attacks. It fails on adversarial inputs designed to bypass it:
`"Ignor3 pr3vi0us instr0cti0ns"`, base64-encoded payloads, multi-turn jailbreaks.

**Layer 2: Semantic safety classifier (conditional)**

```python
async def safety_node(state: BotState) -> dict:
    msg = state["raw_message"]

    # Layer 1: deterministic, 0ms
    result = keyword_safety_check(msg)
    if result.blocked:
        return {"bot_response": safety_response(result.reason)}

    # Layer 2: semantic — only trigger on borderline confidence from Layer 1
    if result.confidence < 0.80:   # "probably fine but worth checking"
        semantic_result = await slm_safety_check(msg)   # ~30-50ms, tiny Haiku call
        if semantic_result.blocked:
            return {"bot_response": safety_response(semantic_result.reason)}

    return {"safety_result": {"passed": True}}
```

Layer 2 adds 30–50ms only for borderline inputs (~5% of traffic). The other 95%
(clearly safe or clearly blocked) never pay the cost. This is the same dual-stage
logic as the SLM classifier — fast deterministic first, slow semantic second.

> **📝 Exercise — Module 9**
>
> **Question 1:** The current `require_auth` uses HS256 (symmetric — one secret key is used for both signing and verification). In a microservices architecture where 10 different services all need to verify tokens, what is the security problem with HS256? What algorithm solves it, and why?
>
> **Question 2:** Write the RBAC check for two new intents:
> - `share_document` — requires `role=authenticated`
> - `view_public_doc` — any role including guest
>
> Write the `IntentRecord` entries following the pattern in Section 9.2.
>
> **Scenario:** A user's JWT expires at turn 8 of a conversation. The server returns HTTP 401. What should the FE do? What should the server return to distinguish "expired token" from "invalid token" from "missing token" — and why does this distinction matter for the client?

---

## Module 10 — Enterprise Patterns `[ENTERPRISE]`

> **After this module you will be able to:**
> 1. Namespace every Redis key and Postgres row for multi-tenant isolation — and explain why a missing namespace is a data breach waiting to happen
> 2. Design a per-tenant rate limiting scheme that prevents one tenant's traffic spike from starving others
> 3. Add `tenant_id` and `plan_tier` cost attribution to the Kafka event schema for billing analytics
> 4. Write the `AzureOpenAIClassifier` adapter and explain how Managed Identity replaces API key auth
>
> ⏱ Estimated time: 55 minutes | Difficulty: ★★★★☆ | Prerequisites: Modules 3, 9 | Recommended for: Enterprise/Azure architects

This module covers the four patterns that separate a demo from a product you can
actually sell to enterprises: multi-tenancy, cost attribution, compliance, and
provider portability.

### 10.1 Multi-Tenancy: Session Isolation

The moment you sell this system to more than one company, every Redis key, Postgres
row, and Kafka event must be namespaced by tenant. Without this, Tenant A can
(in a bug scenario) read Tenant B's session data.

```python
# Every key is namespaced. No exceptions.
def session_key(tenant_id: str, session_id: str) -> str:
    return f"session:{tenant_id}:{session_id}"

def version_key(tenant_id: str, session_id: str) -> str:
    return f"session:{tenant_id}:{session_id}:ver"

# The Lua script receives tenant-namespaced keys — no change to script itself
await redis.evalsha(LUA_CAS_SHA, 2,
    session_key(tenant_id, session_id),
    version_key(tenant_id, session_id),
    expected_version, json.dumps(session))
```

**Rule:** never construct a Redis key from `session_id` alone. `tenant_id` is always
the first segment. A missing `tenant_id` should raise at the session store layer,
not silently create a key in the wrong namespace.

### 10.2 Per-Tenant Rate Limiting

The global LLM concurrency gate (Module 8.1) prevents Anthropic rate limit errors.
But it's a shared resource: one tenant sending 200 concurrent requests will starve
all other tenants.

```python
class LLMConcurrencyGate:
    async def acquire(self, tenant_id: str) -> bool:
        # Per-tenant counter + global counter — both must have headroom
        tenant_key = f"gate:{tenant_id}:count"
        global_key = "gate:global:count"

        pipe = self.redis.pipeline()
        pipe.incr(tenant_key)
        pipe.incr(global_key)
        tenant_count, global_count = await pipe.execute()

        # Safety TTL: if this process crashes between incr and decr, the
        # counter auto-resets after 5 min rather than leaking forever.
        if tenant_count == 1:
            await self.redis.expire(tenant_key, 300)
        if global_count == 1:
            await self.redis.expire(global_key, 300)

        tenant_limit = self._get_tenant_limit(tenant_id)   # from tenant config
        if tenant_count > tenant_limit or global_count > self.global_max:
            pipe2 = self.redis.pipeline()
            pipe2.decr(tenant_key); pipe2.decr(global_key)
            await pipe2.execute()
            return False
        return True
```

**Tenant limits should reflect their plan tier:**

| Plan | LLM concurrency | Rate rationale |
|---|---|---|
| Free | 2 | Prevent abuse |
| Starter | 10 | Standard usage |
| Growth | 50 | High-volume |
| Enterprise | 200 | Dedicated capacity |

### 10.3 Cost Attribution

Every Kafka event and LangSmith trace must carry `tenant_id`, `user_id`, and
`plan_tier` for billing and cost attribution.

```python
# Event schema addition — every chat event gets these fields
@dataclass
class ChatEvent:
    conversation_id: str
    turn_id:         str
    tenant_id:       str          # ← billing dimension
    user_id:         str          # ← user-level analytics
    plan_tier:       str          # ← "free" | "starter" | "growth" | "enterprise"
    event_type:      str
    llm_cost_usd:    float        # computed in followup_node
    input_tokens:    int
    output_tokens:   int
    model_id:        str
    ts:              datetime
```

A Kafka consumer aggregates these events into a cost dashboard:
```sql
SELECT tenant_id, DATE(ts) as date,
       SUM(llm_cost_usd) as daily_cost,
       SUM(input_tokens + output_tokens) as total_tokens,
       COUNT(DISTINCT conversation_id) as sessions
FROM chat_events
WHERE event_type = 'llm_complete'
GROUP BY tenant_id, DATE(ts)
ORDER BY daily_cost DESC;
```

This query, run nightly, tells you which tenants are approaching plan limits and
which are candidates for upsell. Set alerts at 80% of plan quota.

### 10.4 PII, Compliance, and Data Retention

Building on Module 3.3b — the full compliance picture:

**Encryption at rest:**
```python
from cryptography.fernet import Fernet

class EncryptedSessionStore:
    def __init__(self, redis, key_vault):
        self.redis = redis
        self.key_vault = key_vault

    async def _get_tenant_key(self, tenant_id: str) -> Fernet:
        raw_key = await self.key_vault.get_secret(f"session-key-{tenant_id}")
        return Fernet(raw_key)

    async def save_session(self, tenant_id: str, session_id: str, data: dict):
        fernet = await self._get_tenant_key(tenant_id)
        plaintext = json.dumps(data).encode()
        ciphertext = fernet.encrypt(plaintext)           # AES-128-CBC + HMAC
        await self.redis.setex(session_key(tenant_id, session_id), 86400, ciphertext)
```

**Right-to-erasure (GDPR Article 17):**
```python
async def erase_user_data(user_id: str, tenant_id: str):
    # 1. Redis: delete all sessions for this user
    session_ids = await redis.smembers(f"user_sessions:{tenant_id}:{user_id}")
    for sid in session_ids:
        await redis.delete(session_key(tenant_id, sid))
        await redis.delete(version_key(tenant_id, sid))

    # 2. Postgres: hard delete conversation rows
    await db.execute("DELETE FROM conversations WHERE user_id = $1", user_id)

    # 3. Kafka: publish a tombstone (null payload) for each conversation_id
    for conv_id in conversation_ids:
        await kafka.send("chat.messages", key=conv_id, value=None)   # tombstone
    # Compacted topics drop the record on next compaction run
```

**Retention policy enforcement (scheduled job, daily):**
```python
async def enforce_retention(tenant_id: str):
    policy = get_retention_policy(tenant_id)   # from tenant config
    cutoff = datetime.utcnow() - timedelta(days=policy.max_days)
    deleted = await db.execute(
        "DELETE FROM conversations WHERE tenant_id=$1 AND created_at < $2",
        tenant_id, cutoff
    )
    log.info("retention_enforcement", tenant_id=tenant_id, deleted=deleted)
```

### 10.5 Swapping Anthropic for Azure OpenAI

The Port/Adapter pattern (Module 4.2b) makes this a one-file change.

```python
# AzureOpenAIClassifier — satisfies ClassifierPort exactly
import openai   # Azure OpenAI uses the OpenAI Python SDK

class AzureOpenAIClassifier:
    def __init__(self, settings: Settings):
        self.client = openai.AsyncAzureOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,  # https://{resource}.openai.azure.com/
            azure_deployment=settings.azure_classifier_deployment,
            api_version="2024-08-01-preview",
            # No API key needed with Managed Identity:
            azure_ad_token_provider=get_bearer_token_provider(
                DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
            )
        )

    async def classify(self, message: str, domain: str, session: dict) -> dict:
        response = await self.client.chat.completions.create(
            model=self.client.azure_deployment,
            messages=[
                {"role": "system", "content": build_classifier_prompt(domain)},
                {"role": "user",   "content": message},
            ],
            response_format={"type": "json_object"},
            max_tokens=400,
            temperature=0,
        )
        return json.loads(response.choices[0].message.content)
```

Wire it in `MODEL_REGISTRY`:
```python
MODEL_REGISTRY = {
    "anthropic":    lambda s: AnthropicClassifier(s),
    "openrouter":   lambda s: OpenRouterClassifier(s),
    "azure_openai": lambda s: AzureOpenAIClassifier(s),   # ← one line
}
```

Change `MODEL_REGISTRY=azure_openai` in your config. No other code changes.

**Key differences from Anthropic:**
- Auth: Managed Identity (no key rotation needed) vs API key
- Message format: OpenAI schema (same as OpenRouter, different from Anthropic)
- Streaming: `stream=True` returns `AsyncStream[ChatCompletionChunk]` (vs Anthropic's event stream)
- Pricing: PTU (Provisioned Throughput Units) available for predictable cost at scale

---

## Module 11 — Scale & Capacity Planning `[ENTERPRISE]`

> **After this module you will be able to:**
> 1. Calculate Redis memory requirement at 100K and 1M DAU given a known session size
> 2. Explain why SSE requires sticky sessions and how ALB cookie affinity provides that
> 3. Design a Kafka partition strategy for this workload and explain the ordering guarantee
> 4. Work out peak RPM from DAU and map it to your LLM provider's rate limit budget
>
> ⏱ Estimated time: 50 minutes | Difficulty: ★★★★★ | Prerequisites: Modules 3, 8, 10

This module answers the question the rest of the course ignores: what happens when
real traffic hits? Not hypothetically — with actual numbers.

### 11.1 The Scale Math

Assumptions: 4 turns/session average, 15KB session at turn 20, 2 Kafka events/turn.

| Metric | 10K DAU | 100K DAU | 1M DAU |
|---|---|---|---|
| Active Redis sessions (24h TTL) | ~150MB | ~1.5GB | ~15GB |
| Redis topology | Standalone | Standalone | Cluster (3 shards) |
| Kafka events/day | 80K | 800K | 8M |
| Kafka throughput (peak) | 1 ev/sec | 10 ev/sec | 93 ev/sec |
| LLM calls/day (Tier 3 only) | 30K | 300K | 3M |
| LLM cost/day (Haiku avg) | ~$3 | ~$30 | ~$300 |
| FastAPI instances (2 vCPU each) | 2 | 4–8 | 40–80 |
| Anthropic RPM needed (peak hour) | ~35 | ~350 | ~3,500 |

**The non-obvious scaling bottleneck:** at 1M DAU, the LLM rate limit (RPM) is the
binding constraint — not Redis, not Kafka, not server CPU. Plan your Anthropic tier
or Azure OpenAI PTU allocation before you need it.

### 11.2 Redis at Scale

**Key insight:** Redis sessions are small but numerous. At 100K DAU they fit in a
single Redis instance (1.5GB). At 1M DAU you need Redis Cluster.

```
Redis Cluster with session_id as shard key:
  - 3 primary + 3 replica nodes (standard HA)
  - Session key: session:{tenant_id}:{session_id}
  - CRC16(session_id) % 16384 → slot → shard
  - The version key (session:{tenant_id}:{session_id}:ver) MUST land on the same slot
  - Force co-location with hash tags: session:{tenant_id}:{session_id} and
    session:{tenant_id}:{session_id}:ver use the same hash tag → same slot ✓

# Redis Cluster Lua scripts: KEYS must all be on the same slot
# The existing Lua script (Module 3.3) already does this correctly —
# both KEYS[1] and KEYS[2] use the same session_id in the key name.
```

**Memory sizing:** `15KB × active_sessions`. Active sessions ≠ DAU.
At 100K DAU with 30-minute average session length: active_sessions ≈ 100K × (30/1440) ≈ 2,100 concurrent. Memory: 2,100 × 15KB = ~31MB. The 24h TTL is the worst case.

### 11.3 Horizontal Scaling — The Sticky Session Requirement

FastAPI instances are **stateless for session data** (Redis) but **stateful for SSE streams** (asyncio.Queue is in-process, per-request).

```
Load balancer behavior during a request:
  Turn 1 → FastAPI instance A creates Queue_A, streams response
  Turn 2 → If routed to instance B, Queue_A is gone → broken stream

Solution: sticky sessions for the duration of the SSE stream (~2-5 seconds)

AWS ALB configuration:
  stickiness.enabled           = true
  stickiness.type              = lb_cookie
  stickiness.lb_cookie.duration = 30   # seconds — covers the longest LLM response

After connection_close, the next request can go to any instance.
```

**Health check design:** ALB health checks must hit `/health` (not `/send-message-streamed`).
An instance that is slow (high LLM queue depth) but not dead should return HTTP 200 with
a `degraded: true` flag — ALB will route new connections elsewhere if you configure
weighted routing based on health check metadata.

### 11.4 Kafka Partition Strategy

```
Partition key: conversation_id (not session_id, not user_id)

Why:
  - Sequential ordering guaranteed per conversation (turns arrive in order)
  - Analytics consumers reconstruct turn sequence correctly
  - Each conversation's events land on the same partition = same consumer = in-order processing

Partition count calculation:
  At 1M DAU, peak throughput: ~93 events/sec
  Each Kafka partition handles ~5,000 events/sec safely
  → 1 partition is sufficient up to ~5,000 events/sec
  → Scale to 10 partitions before reaching 50,000 events/sec (500K DAU at 10× peak factor)

Consumer groups:
  Group "analytics"    → data warehouse ingestion (Spark Structured Streaming)
  Group "ml-training"  → conversation quality dataset builder
  Group "summarizer"   → background conversation summarization trigger
  Group "billing"      → per-tenant cost aggregation
```

### 11.5 LLM API Rate Limits — Planning Your Capacity

**Anthropic rate limits** are per-API-key, in RPM (requests per minute) and TPM (tokens per minute).

```python
# Rate limit math:
DAU = 1_000_000
turns_per_session   = 4
pct_tier3           = 0.60   # 60% of turns hit the LLM (rest are Tier 0/1/2)
peak_factor         = 3.0    # peak hour is 3× average
session_duration_h  = 0.5    # sessions last ~30 minutes on average

# Peak concurrent LLM calls:
peak_concurrent = DAU * (pct_tier3 * turns_per_session / (session_duration_h * 60)) * peak_factor
# = 1M * (2.4 / 30) * 3 = ~240,000 LLM calls/hour peak = 4,000 RPM

# Required Anthropic tier: Tier 4 allows 4,000 RPM
# Map this to your concurrency gate max_concurrent setting
```

**Azure OpenAI alternative:** PTU (Provisioned Throughput Units) replace RPM limits
with a capacity reservation. 1 PTU ≈ 6 RPM for Claude-equivalent models.
For predictable cost at scale, PTU is preferable to pay-per-token at high volume —
your cost becomes fixed monthly, not variable per request.

```
Decision tree:
  < 100 RPM     → Standard pay-per-token (any provider)
  100–1000 RPM  → Anthropic Tier 2-3, or Azure OpenAI S0
  1000–5000 RPM → Anthropic Tier 4, or Azure OpenAI PTU
  > 5000 RPM    → Multiple API keys + load-balanced adapters, or PTU + spillover
```

---

## Module 12 — Composability and Generalization

> **After this module you will be able to:**
> 1. Identify which parts of this codebase are domain-specific (taxonomy, tools) vs reusable framework (pipeline, state, SSE)
> 2. Sketch the taxonomy and tool registry for a different domain (e.g. Google Drive, e-commerce, HR)
> 3. Translate the Queue pattern to Node.js (EventEmitter) and .NET (Channel<T>)
> 4. Design a RAG-augmented agent for a document corpus using the Google Drive case study as a template
>
> ⏱ Estimated time: 60 minutes | Difficulty: ★★★☆☆ | Prerequisites: Modules 1–4

### 12.1 What Makes This System Reusable

The entire Housing-specific logic is in:
- `prompts/slm/domains/*.md` — taxonomy for each domain
- `src/registries/intent_registry.py` — intent → tier/data_requirements
- `src/registries/tool_registry.py` — tool definitions
- `src/pipeline/nodes/processing.py` — domain-specific filter/derive logic

The *framework* is everything else:
- The 19-node pipeline structure (classification → processing → response)
- The SSE streaming infrastructure
- The session management with optimistic locking
- The tool executor with caching
- The A/B experiment framework
- The playground
- LangSmith observability

To build an agent for a *different* domain (e.g., travel booking, e-commerce, healthcare):
1. Write new domain taxonomy prompts
2. Define intents and their data requirements
3. Register your tools
4. Add domain-specific filter logic in `derive_node`
5. Everything else reuses unchanged

### 12.2 Building an Agent for Any Domain — The Template

```
Step 1: Domain Taxonomy Design
  List all the things a user can ask about your product.
  Group them into 3-5 domains (like Housing's: property_search, locality_research, etc.)
  For each domain, list 5-15 sub-intents.
  Write few-shot examples for the SLM.

Step 2: Intent Registry
  For each sub_intent, decide:
  - Tier: 0 (auth), 1 (action), 2 (template), 3a/3b (LLM)
  - Data requirements: what APIs to call before the LLM
  - Filter carry-over: which session fields persist across this intent

Step 3: Tool Registry
  For each API your product has:
  - Name, description (for LLM-callable tools)
  - Input params with types and descriptions
  - Wire params (if internal API names differ)
  - Return schema summary

Step 4: Session Schema
  What needs to persist across turns for your domain?
  (active_filters, selected_item, comparison_list, etc.)

Step 5: LLM Prompts
  One prompt per intent group (or per sub_intent for very different ones).
  Inject the right data context.
  Tell the LLM what it's allowed to say and what to avoid.

Step 6: Templates
  What structured data should appear without LLM text?
  (product carousels, comparison tables, selection chips, etc.)
```

### 12.3 Case Studies — How to Apply This to Other Products

**E-commerce (Myntra / Amazon)**
- Domains: product_search, product_detail, order_management, returns
- Key session state: cart, wishlist, order_history, size_preferences
- Key tools: searchProducts, getProductDetail, getReviews, checkInventory
- Tier 1: add_to_cart, remove_from_cart
- Tier 3: product recommendations with multi-attribute context

**Travel (MakeMyTrip / Booking.com)**
- Domains: flight_search, hotel_search, itinerary, visa
- Key session state: origin, destination, travel_dates, passengers, budget
- Key tools: searchFlights, searchHotels, getPriceCalendar
- Tier 2: price alert setup (no LLM, just form)
- Tier 3b: "plan my 5-day trip to Rajasthan" (complex, needs Sonnet)

**Healthcare (Practo / Apollo)**
- Domains: symptom_check, doctor_search, appointment, prescription
- Key session state: patient_profile, symptoms, location, insurance
- Tier 0: prescription queries (require login)
- Tier 1: book appointment (direct action)
- Extra safety: medical content requires stricter validate_output_node rules

**B2B SaaS (Customer Support Bot)**
- Domains: troubleshooting, billing, feature_request, account_management
- Key session state: company_id, plan, open_tickets, account_health
- Tools: getTicketHistory, searchKnowledgeBase, getBillingHistory
- Tier 2: password reset, plan upgrade (orchestrator handles directly)
- Tier 3b: complex debugging ("my webhook stopped working 2 days ago")

### 12.4 Non-Python Teams: Applying These Patterns

The patterns in this course are language-agnostic. The technology choices (asyncio,
LangGraph, FastAPI) are not. Here is how senior engineers on other stacks apply
the same architecture.

**Node.js + Express + LangChain.js**

```javascript
// The Queue pattern: Node.js EventEmitter instead of asyncio.Queue
const { EventEmitter } = require('events');

function buildEmitSSE(res) {
    const emitter = new EventEmitter();
    // Generator equivalent: pipe emitter events to SSE response
    emitter.on('frame', (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
    emitter.on('done', () => res.end());
    return (event, data) => emitter.emit('frame', { event, ...data });
}

// Pipeline runs in the background (no await blocking the response)
app.post('/send-message', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    const emitSSE = buildEmitSSE(res);
    setImmediate(() => runPipeline(req.body, emitSSE));  // async, non-blocking
});
```

The LangGraph equivalent in LangChain.js is `@langchain/langgraph`. The `StateGraph`
API is nearly identical — `addNode`, `addConditionalEdges`, `TypedDict`-equivalent
is a Zod schema for type safety.

**.NET + ASP.NET Core**

```csharp
// The middleware chain IS the analogy — BotState is HttpContext
// Channel<T> replaces asyncio.Queue
public class PipelineMiddleware
{
    private readonly RequestDelegate _next;

    public async Task InvokeAsync(HttpContext context, BotState state)
    {
        // Channel<string> bridges the pipeline to the SSE response stream
        var channel = Channel.CreateUnbounded<string>();

        // Pipeline runs as IHostedService background task
        _ = Task.Run(() => RunPipeline(state, channel.Writer));

        // Response streams from channel reader
        context.Response.ContentType = "text/event-stream";
        await foreach (var frame in channel.Reader.ReadAllAsync())
            await context.Response.WriteAsync(frame);
    }
}

// RBAC: ASP.NET Core's [Authorize(Policy="Authenticated")] maps to Tier 0
// IOptions<ExperimentConfig> with hot-reload maps to the experiment YAML
// Azure Key Vault + Managed Identity maps to 9.3 secrets management — native
```

**The key insight for all stacks:**

```
Language-agnostic (take these everywhere):
  ✓ Port/Adapter pattern (ClassifierPort, LLMPort)
  ✓ Pre-fetch vs residual tool split
  ✓ Two-stage SLM (domain router + intent classifier)
  ✓ Tier system (0/1/2/3a/3b) — maps to any authorization + routing pattern
  ✓ Queue/Channel decoupling of pipeline from streaming response
  ✓ Optimistic locking with CAS for session writes
  ✓ fire-and-forget persistence after connection_close

Language-specific (swap for your stack):
  ✗ asyncio.Queue → EventEmitter (Node.js) / Channel<T> (.NET)
  ✗ LangGraph → LangChain.js StateGraph / Semantic Kernel (C#)
  ✗ FastAPI → Express.js / ASP.NET Core
  ✗ structlog → winston (Node.js) / Serilog (.NET)
```

### 12.5 Case Study: Google Drive AI Agent with RAG `[FE BRIDGE]` `[AI FOUNDATION]`

Document intelligence is the highest-value AI pattern for productivity tools. "Summarize my docs about Project X" or "What did Alice say about the API rate limits in Q3?" are canonical **RAG** (Retrieval-Augmented Generation) use cases. The pipeline architecture maps directly.

**How the Housing.com pipeline maps to a Google Drive agent:**

| Housing.com | Google Drive equivalent |
|---|---|
| `searchProperties` tool | `semanticSearchFiles` tool (queries a vector index) |
| Stage 2 SLM domain: `property_search` | Stage 2 SLM domain: `document_search` |
| `session.active_filters` | `session.search_context` (file type, date range, owner, shared status) |
| Property carousel | File card carousel (title, preview snippet, owner, last-modified) |
| `locality_uuids` → entity resolution | File IDs → `getFileContent` for context injection |
| Ordinal refs: "the third one" | Ordinal refs: "the second doc" → `carousel_state.items[1]` |

**A full turn through the Drive pipeline:**

```
User: "What did Alice say about the API rate limits in Q3?"

[safety_node]         → passes (benign)
[route_domain_node]   → domain: document_search
[classify_node]       → intent: search_by_content
                         query: "API rate limits Q3"
                         entity_refs: { person: "Alice" }
[fetch_data_node]     → semanticSearchFiles(
                           query="API rate limits Q3",
                           owner_email="alice@company.com",
                           date_range=Q3_2024
                         )
                       → returns: [
                           { id: "doc_123", title: "Architecture Review Sept 4", snippet: "...rate limits were set at 1000 RPM..." },
                           { id: "doc_456", title: "API Design Notes Aug 28",    snippet: "...Alice proposed throttling at..." }
                         ]
[build_prompt_node]   → injects file titles + snippets into system prompt
[llm_node]            → "In the Architecture Review doc from Sept 4, Alice noted
                          that rate limits were set at 1000 RPM for the external API..."
```

**RAG explained for engineers — no ML degree required:**

RAG is a retrieval pattern, not an ML technique. The three steps:

1. **Retrieve:** search your knowledge base for documents relevant to the user's query
2. **Augment:** inject those documents into the LLM's context (system prompt)
3. **Generate:** ask the LLM to answer *using only the injected documents*

The fetch_data_node already does steps 1 and 2. The only new component is *how* you retrieve.

**Vector search in 60 seconds:**

Classical search matches keywords. "API rate limits" would miss a document that says "throttling thresholds." Vector search matches *meaning*.

```
At index time:
  each document → embedding model → float vector [0.23, -0.87, 0.41, ...] (768 dims)
  stored in: Pinecone / Vertex AI Vector Search / Weaviate / pgvector

At query time:
  user query → same embedding model → query vector
  nearest-neighbor search → top-K most similar document vectors
  return those documents

Result: documents ranked by semantic similarity, not keyword overlap.
"API rate limits" and "throttling thresholds" will be close in vector space.
"breakfast recipes" will be far away.
```

You don't implement the embedding model. You call a managed service and get back vectors.

**Why RAG and not fine-tuning for Drive?**

| Approach | What it gives you | Use when |
|---|---|---|
| Fine-tuning | The model learns a new skill or style permanently | You need different behavior, not different facts |
| RAG | The model answers from your private, current documents | You need up-to-date private data the model doesn't know |
| Prompt engineering | Instructions about how to behave | Every module in this course — the taxonomy prompts |

Google Drive documents are private, change constantly, and contain the facts the LLM needs. RAG is the only viable approach — you can't fine-tune on every employee's documents.

**Security implication:** The Drive API enforces per-file ACLs. The agent must call `semanticSearchFiles` *with the user's credentials*, not a service account that can see all files. The pipeline passes `user_id` from the JWT claim (Module 9.1) through to the tool call. The tool call — not the agent — is responsible for access control.

---

## Module 13 — Building From Scratch: The Implementation Order

> **After this module you will be able to:**
> 1. Recite the 7-phase implementation order and explain why skeleton precedes organs
> 2. Estimate timeline for a new agent (Sprint 1–8 allocation)
> 3. Design a 6-part capstone for a new domain using the Google Drive template
> 4. Answer "how long does it take to build this?" with a defensible, interview-ready answer
>
> ⏱ Estimated time: 30 minutes | Difficulty: ★★☆☆☆ | Prerequisites: Modules 1–12

When you start a new agent project, implement in this order:

### Phase 1 — Skeleton (Week 1)
1. FastAPI server with SSE endpoint
2. asyncio.Queue pattern for streaming
3. Minimal LangGraph graph (3 nodes: safety, classify, followup)
4. Redis session store
5. Playground UI (even a basic one)
6. Structured logging

**Why this order?** You need to see the skeleton work end-to-end before adding organs.
The playground is especially important — you will live in it for the next 3 months.

### Phase 2 — Classification (Week 2)
1. Stage 1 SLM (domain router)
2. Stage 2 SLM (intent classifier) with one domain
3. Taxonomy prompt for your primary domain
4. Validate SLM node
5. LangSmith integration

### Phase 3 — Filters and State (Week 3)
1. Filter apply node
2. Sanitize node
3. Derive node (your domain-specific conversions)
4. Session carry-over logic

### Phase 4 — Tools (Week 4)
1. Tool registry (5-10 core tools)
2. Tool executor with caching
3. Fetch data node
4. Respond node (carousel/template)
5. Build prompt node (with data injection)

### Phase 5 — LLM Response (Week 5)
1. LLM node with streaming
2. Validate output node
3. Followup node with proper connection_close timing
4. Background persistence

### Phase 6 — Production Hardening (Week 6-7)
1. Concurrency gate
2. Timeout and retry logic
3. Kafka event stream
4. A/B experiment framework
5. Cost tracking
6. Error monitoring

### Phase 7 — Advanced Features (Week 8+)
1. Ordinal entity resolution
2. Multi-intent handling
3. Conversation summarization
4. Explore nearby / expand search
5. Clarification flows with templates

> **📝 Capstone Exercise — Module 13**
>
> Apply the full framework to a **Google Drive file-search agent**. This is your proof of understanding. There's no single right answer — the exercise is complete when you can defend every decision with a "because..." grounded in a clear design principle.
>
> *(If you haven't read Module 15 yet, do it now — it gives you the vocabulary to articulate your decisions. This exercise is most valuable after Module 15.)*
>
> **Part 1 — Domain Taxonomy (Module 5.2)**
> Design the Stage 2 SLM prompt for a `document_search` domain. Define at least 5 intents:
> `find_files`, `summarize_doc`, `compare_docs`, `find_recent_changes`, `search_by_person`
> Write one complete few-shot example for `find_recent_changes`.
>
> **Part 2 — Intent Registry (Module 4.2)**
> Write `IntentRecord` entries for:
> - `find_files`: Tier 3a, pre-fetches `semanticSearchFiles` from `params_source='session'`
> - `summarize_doc`: Tier 3b (complex), requires Sonnet, pre-fetches `getFileContent` from `params_source='entity_resolution'`
>
> **Part 3 — Session Schema (Module 3.2)**
> What fields does `session` need? Housing.com has `active_filters`, `carousel_state`, `last_intent`. A Drive agent needs at minimum: `workspace_id`, `last_viewed_file_id`, `search_history`. What additional fields does Drive need that Housing.com doesn't? (Hint: think about shared drives, permission context, file pinning.)
>
> **Part 4 — Security (Module 9)**
> Drive has per-file ACLs. How do you ensure the agent never returns a file the user doesn't have access to? The answer is architectural — which system is responsible for the access check: the pipeline agent or the Drive API? Why does it matter where this check lives?
>
> **Part 5 — Scale (Module 11)**
> Assume 10M DAU (Google scale — 10× the 1M DAU table). Extend the scale math table. What new bottleneck appears that isn't in the Housing.com table? (Hint: consider the size of document content injected into each LLM call vs property search results.)
>
> **`[FE BRIDGE]` Part 6 — Client Integration (Module 17)**
> Design the React component tree for a Drive AI assistant. The UI needs to handle: streaming text, a file card carousel, a "sources" panel showing which docs were retrieved, and a connection state indicator. Map each UI element to the SSE frame type that populates it.

---

## Module 14 — The Gotchas No One Tells You

> **After this module you will be able to:**
> 1. Explain The connection_close Trap without looking at notes — and tell the production story that caused it
> 2. Spot a cascade tax problem: name the symptom and the two-line fix
> 3. Design a first-turn strategy that handles the empty session problem gracefully
> 4. Identify any of the 8 gotchas from a symptom description (e.g. "user sees no text response" → which gotcha?)
>
> ⏱ Estimated time: 30 minutes | Difficulty: ★★★☆☆ | Prerequisites: Modules 1–8

### 14.1 The Connection_Close Trap
The `connection_close` SSE event must be yielded *inside* the generator's while loop
(on sentinel), not after the try/finally block. If any exception propagates from the
finally block (gate.release(), a Redis failure), code after try/finally never runs.
We learned this the hard way.

### 14.2 The Cascade Tax
Every node that talks to an external service is a latency multiplier.
5 nodes × 200ms each = 1 second before the LLM even starts.
Always: cache aggressively, run parallel groups, set tight timeouts.

### 14.3 The SLM Context Window
The classifier SLM has a small context window. If you put too much in `last_3_turns`,
the SLM truncates the beginning. Always truncate bot responses to 400 chars in last_3_turns.
The full response lives in `turn_history` for the LLM.

### 14.4 The First-Turn Problem
Turn 1 has no session. The classifier has no `active_filters`, no `last_intent`.
Design your taxonomy so every prompt works with empty context.
"show me properties" with no session → ask for city (minimum required context).

### 14.5 The Version Conflict Spiral
Two simultaneous requests to the same session both read version=3.
Both try to write version=4. One gets a conflict (Lua returns 0).
`reconcile_session_conflict` just logs and continues (Sprint 3 design).
In Sprint 4: implement retry with exponential backoff.
But for 99.9% of users (sequential conversations), this never happens.

### 14.6 The clear_keys Graveyard
We defined `clear_keys` in every IntentRecord for months before noticing no code
ever read it. Dead config is worse than no config — it creates false confidence.
If you design a schema field, immediately write the code that consumes it.

### 14.7 The "No Text Response" Mystery
When `validated_text` is empty, the user sees "No text response received."
This happens when:
1. The LLM calls tools but returns no text (check `chunks_streamed=0` in playground)
2. The LLM has no data to talk about (check `pre_fetched_data` is non-empty)
3. `validate_output_node` stripped everything (check violations log)
4. The LLM prompt says something like "only return a carousel, no text" by mistake

The playground's LLM panel shows `stop_reason`, `chunks_streamed`, and `output_tokens`.
If `output_tokens=3` and `chunks_streamed=0`, the LLM made a tool call with no text.

### 14.8 The Background Task Leak
`asyncio.create_task` in a short-lived context (a single HTTP request) means the
task might outlive the HTTP connection. This is fine for persistence — Redis and Kafka
operations complete in <50ms. But if you ever put a *slow* operation in a background
task (like calling an external API), make sure the event loop doesn't shut down before
it completes. Add a graceful shutdown handler.

---

## Module 15 — The Mental Models That Matter

> **After this module you will be able to:**
> 1. State each of the 7 mental models unprompted and give a concrete example from this codebase for each
> 2. Apply each model to critique a design you haven't seen before ("this violates model 4 because...")
> 3. Connect each model to the specific interview question it answers at L5/L6 level
>
> ⏱ Estimated time: 30 minutes | Difficulty: ★★☆☆☆ | Prerequisites: Modules 0–14

*These aren't rules. Rules tell you what to do. Mental models tell you WHY — and let you
apply the principle to systems you've never seen before. Master the models, and you can
reason your way through any AI system design problem.*

---

### 15.1 Nodes Are Compiler Passes, Not ChatGPT Wrappers

Each node does exactly one job. If you find a node doing two things, split it.

**What this model replaced:** The early prototype had a single `process_and_respond()` function.
It classified, fetched data, and generated the response. When it broke, you couldn't tell
*which* step failed. When you wanted to add clarification logic, there was nowhere clean to put it.

**Applied to a new system:** If someone shows you a code review agent where a single function
"reads the PR, scores it, and generates the review comment," you now know to say:
"That's three jobs. Split into `parse_diff_node`, `score_complexity_node`, `generate_review_node`."
Each node testable in isolation. Each failure obvious from the logs.

**Interview framing:** "How do you keep a multi-step AI pipeline maintainable?" → "Single
Responsibility at the node level. Each node owns exactly one key in state. If a node fails,
the logs show exactly which step and which output was wrong."

---

### 15.2 Emit SSE for UX, Not for Logic

No node should make a *decision* based on what was emitted. SSE is fire-and-forget.

**The trap this prevents:** A junior engineer once added a branch: `if "Searching..." was emitted, skip summary`. This broke silently when the network buffered the SSE frame and the check ran too early. The invariant — SSE is one-way output, never control flow — would have prevented this.

**Generalized:** In any streaming system (React state updates, async event streams, webhooks),
unidirectional output channels should never be read back as input. The moment you read your
own event stream for control flow, you've created a hidden state machine that no one can reason about.

---

### 15.3 The LLM Is the Last Resort, Not the First

Most user actions don't need the LLM. Push to Tier 0/1/2 → faster, cheaper, more reliable.

**The numbers in this codebase:** ~65% of messages route to Tier 0/1/2. That's 65% of
requests processed without a LLM call. At 500K DAU with 4 turns/session: 1.3M requests/day
× 65% × $0.005 (Sonnet cost) = **$4,225/day saved** by not sending every message to the LLM.

**Applied to other domains:** A customer support bot for an e-commerce site. Order status
requests (40% of all tickets): deterministic — `lookup_order_api` returns the answer directly.
No LLM needed. Only handle escalations, complaints, and edge cases with the LLM. This is the
same Tier 0/1/2 pattern applied to a different domain.

**Interview framing:** "How would you optimize the cost of your AI system?" This model is the
answer. Lead with the tiering math.

---

### 15.4 State Flows Forward, Never Backward

A node never reads from state keys that later nodes write. The pipeline is a DAG. If you need
to backtrack, you've designed the wrong graph.

**The failure this prevents:** In the first pipeline version, `build_prompt_node` read from
`carousel_state` (which `respond_node` wrote). This meant `build_prompt_node` had to run
*after* `respond_node`. But we also wanted the LLM to influence the carousel. Circular
dependency — classic symptom of backward state flow.

**The fix:** `respond_node` reads `pre_fetched_data` (written by `fetch_data_node` earlier),
builds the carousel from that, and writes `carousel_state`. `build_prompt_node` reads
`pre_fetched_data` directly — not carousel_state. DAG preserved.

**Generalized:** In any data pipeline (Spark, dbt, Airflow), this is the same principle. A DAG
node cannot depend on a node that depends on it. The moment your pipeline needs to loop back,
you need a different graph topology — usually a separate sub-graph or a second pass.

---

### 15.5 Design for the Next Engineer, Not for the Compiler

The code that ships is clear. The code that gets maintained is clear *and* explains its constraints.

**What "the next engineer" needs:** Why is `connection_close` emitted *before* Redis write?
The compiler doesn't care. A new hire at 2am caring about a user complaint *very much* cares.
The comment is in the code. The `pipeline_step` SSE event shows every node in the playground.
The naming convention (`followup_node`, not `process()`) makes the intent obvious.

**The cost calculation:** A confusing function name: free to write. Time lost by the next engineer
(yours or your colleague's): 30 minutes per bug. In a 10-engineer team touching this code weekly:
30 min × 52 weeks × 10 engineers = 260 engineer-hours/year in confusion tax. Naming is free.

---

### 15.6 Infrastructure Shouldn't Touch UX Timing

Redis, Kafka, Postgres are housekeeping. The user never waits for them. `connection_close`
before persistence. Background tasks for everything after the response.

**The architecture consequence:** `followup_node` emits `connection_close`, then calls
`asyncio.create_task(_persist_turn)`. The user's browser re-enables the input field in ~150ms.
The background task completes in ~5ms. The user never knows Redis exists.

**When this model saves a feature:** A new feature request: "log every interaction to our
compliance database (slow, <500ms write)." Without this model: add the write before
`connection_close`. Users wait an extra 500ms on every message. With this model: background
task, zero UX impact. The model made the decision.

---

### 15.7 The Cascade of Small Latencies Kills UX

200ms classification + 500ms fetch + 2000ms LLM = 2.7 seconds. Add one more sequential
200ms call and you've crossed the perceptual threshold where users consider the app "slow."

**The quantitative version:** Human perception research (Nielsen, 1993, still valid): 100ms =
instant, 1s = flow broken, 10s = attention lost. Every sequential step you add must justify
its latency cost. If you can't, parallelize or eliminate.

**The cascade tax calculation:**
```
Original:    classify (200ms) + fetch (500ms) + LLM (2000ms) = 2700ms  ← acceptable
Bad refactor: + validation (200ms) + enrichment (150ms) + logging (100ms) = 3150ms  ← 17% slower
Fix:         parallel fetch + validation; logging async → stays at 2700ms
```

**In the codebase:** `fetch_data_node` runs all tools in parallel groups specifically to avoid
the cascade. Without this, 4 tool calls × 200ms = 800ms added. With parallel execution: 200ms
(for the slowest tool). This is Model 7 expressed as architecture.

---

### 15.8 Final Self-Assessment

*Can you answer these without looking at any module?*

1. A new node calls an external API to fetch user preferences and also formats the response string. What's wrong?
2. A junior engineer adds `if sse_queue.empty(): skip_summary = True`. What mental model does this violate?
3. A product manager asks: "Can we make the bot always use GPT-4 for every message?" What's the first question you ask and why?
4. At what point in `followup_node` does Redis get written, and why not earlier?
5. A new feature requires calling a 300ms API. Where in the pipeline does it go, and how do you ensure it doesn't add 300ms to P95 latency?

*If you answered all five confidently, you're ready for Module 19. If any tripped you, return to that module — the answer is explicitly in the code.*

---

## Reference Sheet A — Technology Stack Reference

| Layer | Technology | Why This? | Alternatives |
|-------|-----------|-----------|-------------|
| API Server | FastAPI | async-native, auto-docs, type safety | Flask (sync), Django (heavy) |
| Pipeline | LangGraph | typed state, conditional edges, tracing | Custom DAG, Prefect |
| LLM Provider | Anthropic Claude | best instruction-following, prompt caching | OpenAI, Gemini |
| Session Store | Redis | sub-ms latency, TTL support, Lua scripts | Memcached (no Lua), Postgres (slow) |
| Event Stream | Kafka | durable, replayable, multi-consumer | RabbitMQ (no replay), SQS |
| Persistence | PostgreSQL | ACID, complex queries | MongoDB, DynamoDB |
| Observability | LangSmith | native LangChain/LangGraph integration | Weights & Biases, custom |
| Logging | structlog | structured JSON, contextual fields | standard logging, loguru |
| Client Stream | Server-Sent Events | simple, HTTP/1.1 compatible | WebSockets, Long polling |

## Reference Sheet B — The Scalability Checklist

Before going to production, verify:

- [ ] Every external call has a timeout (default: 2s for tools, 10s for LLMs)
- [ ] Every timeout has a fallback (log + skip, not crash)
- [ ] LLM concurrency is rate-limited (gate with queue)
- [ ] Session reads/writes are atomic (Lua CAS)
- [ ] Kafka writes are fire-and-forget (never blocking the user)
- [ ] `connection_close` is guaranteed even when infrastructure fails
- [ ] Per-turn cost is logged and monitored
- [ ] A/B experiment config is hot-reloaded (no deploys to change traffic splits)
- [ ] The playground shows every node's decision in real-time
- [ ] LangSmith traces every LLM call with full context
- [ ] Background tasks don't leak across request boundaries

## Reference Sheet C — What to Build Next

If you've understood this codebase, these are the natural next challenges:

1. **Conversation Summarization**: At turn 20, fire a background Haiku call that
   summarizes the conversation. Store as `session.summary`. Inject into the LLM
   prompt instead of the full turn_history. Keeps the context window small forever.

2. **Multi-Intent Decomposition**: "Show me 2BHK near Bandra and also calculate my
   EMI for 1.5Cr" — detect two intents, execute both in parallel, merge responses.

3. **Cross-Session Memory**: Some facts (user's city, budget range, saved searches)
   should persist across sessions. Add a user profile layer in Postgres.

4. **Streaming Tool Results**: Instead of waiting for the full tool result, stream
   partial results to the client as they arrive (for slow APIs).

5. **Autonomous Agent Mode**: For complex tasks ("find me the best 3BHK in Mumbai under
   1Cr and schedule viewings for the top 3"), add a planning node that decomposes the
   task into sub-tasks and executes them iteratively. Add loop detection to prevent
   infinite cycles.

---

## Module 16 — Track A: LLM Engineering Fundamentals `[AI FOUNDATION]`

> **After this module you will be able to:**
> 1. Explain why an LLM cannot retrieve live data and why grounding (context injection) is the correct fix
> 2. Estimate token count for a message and calculate the cost of a full conversation at prompt cache vs uncached rates
> 3. Choose the right temperature for a given use case (0 for structured output, 0.7+ for creative)
> 4. Apply the RAG decision tree: when RAG is better than fine-tuning and when it isn't
>
> ⏱ Estimated time: 60 minutes | Difficulty: ★★★☆☆ | Prerequisites: none (Track A is a foundation module)

*For engineers who are new to working with LLMs. If you've already built something with the Anthropic or OpenAI API, skim for gaps and move on.*

### 16.1 What a Language Model Actually Does

An LLM is a **next-token predictor**. It takes a sequence of tokens as input and outputs a probability distribution over the next token. It picks from that distribution, appends the token, and repeats until it decides to stop.

That's the entire mechanism. There's no fact database, no reasoning engine, no lookup table. The model learned statistical patterns from a huge corpus of text during training. When it "knows" something, it means that pattern appeared frequently enough in training to dominate the probability distribution at inference time.

**Why this matters for system design:**
- The LLM cannot retrieve real data. It can only work with what's in its context.
- **Hallucination** happens when the model generates the statistically probable next token even when it doesn't correspond to reality. It's not a bug — it's what prediction does when the answer isn't grounded in the context.
- **Grounding** means putting the real data into the context before asking the model to respond. This is why `fetch_data_node` runs before `llm_node`.

### 16.2 Tokens — The Unit of Cost and Speed

Models process **tokens** (subword units), not characters or words.

```
"show me 3BHK in Bandra under 2Cr"
→ ["show", " me", " 3", "BH", "K", " in", " Band", "ra", " under", " 2", "Cr"]
→ 11 tokens
```

**Rule of thumb:** 1 token ≈ 4 characters ≈ 0.75 English words. A 1,000-word document ≈ 1,300 tokens.

**Why tokens drive everything:**

| Impact | Detail |
|---|---|
| Cost | Anthropic charges per input token + per output token. Your system prompt is paid for on every call. |
| Latency | Output tokens are generated sequentially. 500 output tokens takes ~5× longer than 100. |
| Context window | The total tokens (system prompt + history + data + response) must fit within the model's limit. Claude Haiku: 200K tokens. |
| Caching | Anthropic caches the *input* token prefix. The stable part of your system prompt is paid for once, then at ~10% cost thereafter. |

### 16.3 System Prompt vs Messages — The API Contract

Every LLM API call sends a structured message list, not free-form text. The format:

```python
# This is what build_prompt_node assembles and llm_node sends
messages = [
    {
        "role": "system",
        "content": """You are a housing search assistant for Housing.com.
The user is in Mumbai. Active filters: city=Mumbai, bhk=2.

Search results (from Housing.com API, fetched this request):
[{"id":"abc","title":"3BHK Bandra West","price":19500000,"locality":"Bandra"},...]

Rules: Only reference properties from the above results. Never invent listings."""
        # ↑ Static instructions + injected real data. Changes rarely.
        # ↑ Anthropic caches this prefix → 90% cost reduction on repeated calls.
    },
    {"role": "user",      "content": "show me the ones near the sea"},   # current message
    {"role": "assistant", "content": "I found 3 sea-facing options..."},  # previous turn
    {"role": "user",      "content": "tell me more about the first one"}, # ← current
]
```

**System prompt vs user message — why it matters:**
- The system prompt carries authority (models follow system-level instructions more reliably)
- The system prompt prefix is cacheable (Anthropic prompt caching saves 70–80% on input costs at scale)
- **Put in system prompt:** instructions, injected data, tool definitions, persona, rules
- **Put in user message:** the user's actual natural-language input

### 16.4 Temperature — Determinism vs Creativity

Temperature controls how the model samples from the probability distribution at each token step.

| Temperature | Behavior | Use for |
|---|---|---|
| 0 | Always picks the highest-probability token. Fully deterministic. | JSON output, classification, anything needing consistency |
| 0.3–0.5 | Mostly high-probability tokens, minor variation | Factual responses, summaries |
| 0.7–0.9 | Broader sampling, noticeably varied output | Conversational responses, natural prose |
| > 1.0 | Very random, often incoherent | Almost never in production |

**This codebase's choices:**
- Stage 1 SLM (domain router): `temperature=0` — same input must produce same domain routing
- Stage 2 SLM (intent classifier): `temperature=0` — structured JSON must be stable
- Stage 3 LLM (response generation): `temperature=0.5` — natural-sounding with slight variation

**Max tokens** (the output budget): short for classification (100–400), longer for generation (800–2000). An LLM that hits `max_tokens` will truncate mid-sentence. Set it based on your expected response length plus 20% headroom.

### 16.5 Hallucination and Grounding — The Core Engineering Challenge

```python
# Without grounding — LLM invents data
system_prompt = "You are a housing assistant."
user = "show me 2BHK near the sea in Bandra"
# LLM response: "I found Sunshine Residency (₹1.8Cr) near Bandstand..." ← INVENTED

# With grounding — LLM works with real API results
system_prompt = f"""You are a housing assistant.
Search results from Housing.com:
{json.dumps(real_api_results)}"""
user = "show me 2BHK near the sea in Bandra"
# LLM response: "I found 6 sea-facing 2BHK properties. The first is
#               Godrej Two by Sea in Bandra West at ₹1.95Cr..."  ← REAL LISTING
```

**The rule:** Never ask an LLM what it knows about your domain. Tell it what it needs to know, then ask it to respond.

This is the entire purpose of `fetch_data_node` → `build_prompt_node` → `llm_node`:
1. Fetch real data from real APIs
2. Inject that data into the system prompt
3. Ask the LLM to generate a response based on the injected data

### 16.6 Prompt Caching — The 80% Cost Reduction

Anthropic caches the token prefix of your system prompt. Any request where the system prompt starts with the same prefix pays ~10% of the input token cost for those cached tokens.

```
System prompt structure (ordered for maximum cache hit):
  ┌─ CACHED ──────────────────────────────────────────────────────┐
  │ "You are a housing assistant. Rules: ... Taxonomy: ..."       │  stable — cached after first call
  │ "Available tools: searchProperties, getLocalityDetail, ..."   │  stable — cached
  └───────────────────────────────────────────────────────────────┘
  ┌─ NOT CACHED ──────────────────────────────────────────────────┐
  │ "Current search results: [{"id":"abc",...}]"                  │  changes every turn
  │ "Active filters: {city: Mumbai, bhk: 2}"                      │  changes every turn
  └───────────────────────────────────────────────────────────────┘
```

**Engineering rule:** Put stable content first in your system prompt, dynamic content last. `build_prompt_node` does this correctly.

At 1M DAU with a 2,000-token stable prefix: prompt caching saves ~$180/day at Haiku prices. At Sonnet prices: ~$900/day. This isn't optional at scale.

### 16.7 Small Models vs Large Models — The Decision Framework

```
Is the task: structured output (JSON, classification, extraction)?
    → Use small, fast model (Haiku, GPT-4o-mini)
    → Temperature 0, max_tokens 200–400
    → Validate output schema strictly (validate_slm_node)

Is the task: open-ended generation (explanation, summary, comparison)?
    → Is it complex / multi-step reasoning?
        YES → Large model (Sonnet, GPT-4o)
        NO  → Try small model first; upgrade only if quality is insufficient

Is the task: creative or exploratory?
    → Large model, temperature 0.5–0.8

Always: measure quality × cost tradeoff on your actual data.
A small model that's 90% as good at 50× lower cost is almost always the right answer.
```

**This codebase's mapping:**
- Haiku: domain routing (Stage 1), intent classification (Stage 2), safety Layer 2
- Haiku (default Tier 3): most response generation — simple intents, filter updates, template narration
- Sonnet (Tier 3b): complex queries — comparison, multi-intent, nuanced advice

### 16.8 RAG — Retrieval-Augmented Generation `[AI FOUNDATION]`

RAG is the most important AI pattern for features that work with private or frequently-updated data. It's also what `fetch_data_node` already implements.

**The three-step pattern:**
```
User query
    ↓
[Retrieve] — search your knowledge base for relevant content
    ↓
[Augment]  — inject retrieved content into the LLM context (system prompt)
    ↓
[Generate] — ask the LLM to answer using only the injected content
```

**Classical search vs vector search:**

| Classical (keyword) | Vector (semantic) |
|---|---|
| Matches exact words | Matches meaning |
| "API rate limits" misses "throttling thresholds" | "API rate limits" and "throttling thresholds" are close in vector space |
| SQL `WHERE content LIKE '%rate limits%'` | `SELECT * FROM docs ORDER BY embedding <-> query_embedding LIMIT 10` |
| Fast, deterministic | Slightly slower, probabilistic |
| Works on: structured filters | Works on: meaning, intent, context |

For a Google Drive agent: `semanticSearchFiles("API rate limits Q3")` calls a vector DB. For Housing.com: `searchProperties(city="Mumbai", bhk=2)` calls a structured SQL query. Both feed `fetch_data_node`. Both are RAG.

**Decision Tree — RAG vs Fine-tuning vs Zero-shot:**

```
What approach should I give my model domain knowledge?
│
├─ Does the knowledge change frequently? (hourly / daily / weekly)
│   └─ YES → RAG always. Fine-tuning snapshots knowledge at training time.
│              New facts won't appear in the model until expensive retraining.
│              Real consequence: retailer spent $40K fine-tuning on product catalog,
│              then the catalog updated and prices became wrong overnight.
│
├─ Is the data private per-user or per-tenant?
│   └─ YES → RAG. You cannot fine-tune one model per user at scale.
│              RAG serves tenant-specific documents at query time.
│
├─ Do I need new BEHAVIOR (reasoning style, output format, domain-specific tone)?
│   └─ YES → Fine-tuning changes HOW the model thinks, not just what it knows.
│              RAG only changes WHAT it knows.
│              Example: a medical transcription agent needs to reason like a clinician.
│              RAG can give it medical records; fine-tuning makes it reason differently.
│
├─ Is the knowledge static AND latency is critical AND data is small enough to fit in a prompt?
│   └─ YES → Few-shot examples in the system prompt. Zero training cost, fastest to iterate.
│              This is what Housing.com's taxonomy prompt does.
│
└─ Static knowledge, too large for prompt, performance matters?
    → Fine-tuning + optional RAG. Pre-train the style, retrieve the facts.
```

**Quick reference table:**

| | RAG | Fine-tuning | Zero-shot / few-shot |
|---|---|---|---|
| Data changes often | ✓ Best | ✗ Re-train every update | ✓ if prompt fits |
| Data is private per-user | ✓ Retrieve at runtime | ✗ Can't per-user | ✓ if small |
| Need new behavior/style | ✗ Doesn't help | ✓ Right tool | ~ limited |
| Cost | Low (retrieval only) | High (training cost) | Zero |
| Time to update | Immediate | Days-weeks | Minutes |

> ⚠️ **Common Misconception:** "RAG eliminates hallucination."
>
> **Reality:** RAG reduces hallucination *when retrieved context contains the answer*.
> When retrieval returns irrelevant or empty chunks, the LLM hallucinates from training
> data — sometimes with *more* confidence than without any context, because it anchors
> on the provided but irrelevant text. This is why retrieval quality (RAGAS metrics,
> Module 18.4) matters as much as generation quality.

> 🎯 **MAANG Interview Connection:** "When would you choose RAG over fine-tuning?"
> The complete answer leads with the decision tree above. Then quantify: "Fine-tuning
> a 7B model costs ~$200-2000 in GPU compute and 1-2 weeks of engineering. RAG can be
> deployed in a day with near-zero training cost. The tradeoff is retrieval latency
> (80-200ms for a good vector search) vs training cost and maintenance overhead."

**The full RAG system — what's actually happening under the hood:**

```
User query: "3BHK apartments in Bandra under ₹2Cr"
    │
    ▼
[1] EMBED QUERY
    embed("3BHK apartments in Bandra under ₹2Cr")
    → 1536-dimensional vector [0.12, -0.87, 0.44, ...]
    │
    ▼
[2] VECTOR SEARCH
    SELECT content, metadata FROM docs
      ORDER BY embedding <-> query_vec LIMIT 10
    → Top 10 semantically-nearest document chunks
    │
    ▼
[3] RE-RANK  (optional but important at production scale)
    Cross-encoder rescores each chunk against the full query
    → Reordered: most-relevant first, less-relevant dropped
    │
    ▼
[4] INJECT INTO PROMPT
    System prompt:
      "Answer using ONLY the following context:\n" + retrieved_chunks
    User message: original query
    │
    ▼
[5] GENERATE
    LLM responds grounded to injected context → output
```

**Components:** embedding model (text→vector), vector database (stores/searches vectors),
optional cross-encoder reranker (rescores top-k), LLM (generates from grounded context).

**Naive RAG failure modes — what breaks in production:**

| Failure | Symptom | Root cause | Fix |
|---|---|---|---|
| Chunk too large | LLM ignores middle of chunk | 2,000-token chunk, answer at line 80 | Smaller chunks (256–512 tokens) |
| Chunk too small | Answer split across chunks, none complete | 50-token chunks break mid-sentence | Larger chunks or parent-document retrieval |
| Retrieval miss | LLM hallucinated; document existed | Query vocab ≠ document vocab | Hybrid search (BM25 + vector), query expansion |
| Context overflow | Truncation or confusion | 10 × 500-token chunks = 5K tokens | Max 3–5 chunks for 8K context models |
| Staleness | Confident but outdated answer | Index not re-embedded after update | Incremental re-indexing on document change events |
| Multi-hop failure | Two-part question answered partially | Top-k retrieval returns documents independently | Iterative retrieval or Graph RAG |

**Chunking intuition — why size dominates RAG quality:**

```
Chunk too large (2,000 tokens):
┌──────────────────────────────────────────────────────────┐
│ overview... pricing... location... amenities...          │
│ maintenance charges... society rules... PARKING: 2 slots │  ← buried
│ builder history... schools... hospitals...               │
└──────────────────────────────────────────────────────────┘
Problem: "lost in the middle" effect — LLMs anchor on start/end, skip middle.
Result: correct document retrieved, but parking detail missed → hallucination.

Chunk right-sized (256–400 tokens):
┌──────────────────────────────────┐
│ PARKING: 2 covered slots         │
│ Visitor parking: 10 spaces       │
│ EV charging: B1 level            │
└──────────────────────────────────┘
Entire chunk is signal. LLM answers accurately.
```

**Production rule:** Start at 512 tokens + 10% overlap.
Tune by RAGAS scores: context relevance < 0.7 → try smaller. Faithfulness < 0.7 → try larger.

---

## Module 17 — Track B: Frontend Integration `[FE BRIDGE]`

> **After this module you will be able to:**
> 1. Write the `fetch()` + `ReadableStream` pattern for consuming SSE from a POST endpoint with auth headers
> 2. Buffer streaming tokens with `requestAnimationFrame` to prevent per-token React re-renders
> 3. Implement the 4-state connection machine (idle → connecting → streaming → complete) in React
> 4. Map every SSE frame type (`pipeline_step`, `chat_event`, `connection_close`) to a UI update
>
> ⏱ Estimated time: 75 minutes | Difficulty: ★★★★☆ | Prerequisites: Module 1 (conceptually), React familiarity

*The server emits SSE frames. What happens next is the entire other half of the system — the half this course hasn't covered. This module is for engineers who will own the browser side.*

### 17.1 The Complete SSE Frame Anatomy

Every pipeline event, every text token, every carousel is a frame in the SSE stream. Here's what the server actually sends over the wire:

```
event: pipeline_step
data: {"node":"safety","status":"completed","latency_ms":2,"detail":{}}

event: pipeline_step
data: {"node":"classify","status":"completed","latency_ms":187,"detail":{"domain":"property_search","intent":"search_properties","filter_delta":{"bhk":[2]}}}

event: chat_event
data: {"messageState":"IN_PROGRESS","chatResponse":{"type":"property_carousel","properties":[{"id":"abc","title":"3BHK Bandra West","price":"₹1.95Cr","bedrooms":3,"locality":"Bandra"}]}}

event: message_delta
data: {"content":{"text":"I found"},"chunkIndex":0}

event: message_delta
data: {"content":{"text":" 8 sea-facing"},"chunkIndex":1}

... (one event per ~4 tokens, 50-100 total for a typical response)

event: chat_event
data: {"messageState":"COMPLETED","chatResponse":{"text":"I found 8 sea-facing 2BHK properties in Bandra..."}}

event: connection_close
data: {"reason":"response_complete"}
```

**The ordering is guaranteed and semantic:**
`pipeline_step`s → `chat_event` (carousel, appears before text) → `message_delta`×N (streaming text) → `chat_event (COMPLETED)` → `connection_close` (re-enable input)

### 17.2 Consuming SSE in the Browser — The Right Way

`EventSource` (the W3C SSE API) doesn't support POST requests or custom `Authorization` headers — it only does GET. For authenticated AI chat, use `fetch()` with `ReadableStream`:

```typescript
async function* streamChat(
  message: string,
  conversationId: string,
  token: string
): AsyncGenerator<Record<string, unknown>> {
  const response = await fetch('/api/v1/chat/send-message-streamed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,   // ← impossible with EventSource
    },
    body: JSON.stringify({ message, conversation_id: conversationId }),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('AUTH_EXPIRED');
    throw new Error(`HTTP_${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEvent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';    // keep incomplete line for next chunk

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        yield { type: currentEvent, ...data };
        currentEvent = '';
      }
    }
  }
}
```

### 17.3 Streaming Text Rendering in React — Without Jank

The naive approach appends each chunk to component state, triggering a full re-render per token (50–100 re-renders/second during streaming). On low-end devices this is visible as character-by-character jank.

```tsx
// Naive — re-renders every token (bad at scale)
const [text, setText] = useState('');
// on each message_delta: setText(prev => prev + chunk)

// Correct — buffer in a ref, sync to DOM once per animation frame
function StreamingText({ isStreaming }: { isStreaming: boolean }) {
  const [displayText, setDisplayText] = useState('');
  const bufferRef = useRef('');
  const rafRef = useRef<number>(0);

  // Call this on each message_delta event
  const appendChunk = useCallback((chunk: string) => {
    bufferRef.current += chunk;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setDisplayText(bufferRef.current);   // one state update per frame (≤60fps)
    });
  }, []);

  return (
    <div className="assistant-message">
      <span>{displayText}</span>
      {isStreaming && <span className="streaming-cursor" />}
    </div>
  );
}
```

### 17.4 Connection State Machine

Model connection state explicitly — boolean flags compose badly and produce impossible states like `(connecting=true, complete=true)`.

```typescript
type StreamState = 'idle' | 'connecting' | 'streaming' | 'complete' | 'error';

// Valid transitions only:
// idle → connecting   (user submits)
// connecting → streaming  (first frame received)
// streaming → complete    (connection_close received)
// streaming → error       (network drop or 90s timeout)
// complete → idle         (user starts next turn)
// error → idle            (user dismisses error / retries)

function useChatStream(conversationId: string, token: string) {
  const [streamState, setStreamState] = useState<StreamState>('idle');
  const [carouselItems, setCarouselItems] = useState<Property[] | null>(null);
  const appendChunk = useStreamingText();   // from 17.3

  async function send(message: string) {
    setStreamState('connecting');
    setCarouselItems(null);

    const timeout = setTimeout(() => setStreamState('error'), 90_000);
    try {
      for await (const event of streamChat(message, conversationId, token)) {
        clearTimeout(timeout);
        setStreamState('streaming');

        if (event.type === 'chat_event') {
          const r = event.chatResponse as any;
          if (r?.type === 'property_carousel') setCarouselItems(r.properties);
          if (r?.messageState === 'COMPLETED') setStreamState('complete');
        }
        if (event.type === 'message_delta') appendChunk(event.content?.text ?? '');
        if (event.type === 'connection_close') { setStreamState('complete'); break; }
      }
    } catch (err: any) {
      clearTimeout(timeout);
      setStreamState(err.message === 'AUTH_EXPIRED' ? 'auth_error' : 'error');
    }
  }

  return { streamState, send, carouselItems };
}
```

### 17.5 The React Component Architecture

```tsx
// Map SSE frame types to UI components
<ConversationView>
  {turns.map(turn => (
    <Turn key={turn.id}>
      <UserBubble text={turn.userMessage} />

      {/* chat_event (carousel) arrives BEFORE message_delta starts */}
      {turn.carouselItems && <PropertyCarousel items={turn.carouselItems} />}

      {/* message_delta frames stream text progressively */}
      <AssistantBubble
        text={turn.text}
        isStreaming={turn.id === activeTurnId && streamState === 'streaming'}
      />
    </Turn>
  ))}

  <InputBar
    // Disable during connecting + streaming; re-enable on complete or error
    disabled={streamState === 'connecting' || streamState === 'streaming'}
    onSubmit={send}
    placeholder={streamState === 'connecting' ? 'Connecting...' :
                 streamState === 'streaming'  ? 'AI is responding...' : 'Ask about properties...'}
  />
</ConversationView>
```

**Key insight:** The carousel renders before any text streams because `respond_node` (which emits the carousel) runs before `llm_node` (which streams text). Your component must handle the transient state where `carouselItems` is populated but `text` is still empty string.

### 17.6 The `pipeline_step` Events — Your Debug Panel

Every node emits a `pipeline_step` frame. The playground uses these to build the live node timeline. In your own FE, you can use them to show meaningful loading states instead of a spinner:

```typescript
// Map node names to user-friendly loading messages
const NODE_MESSAGES: Record<string, string> = {
  safety:           'Checking your message...',
  route_domain:     'Understanding your request...',
  classify:         'Identifying what you need...',
  fetch_data:       'Searching properties...',
  respond:          'Preparing results...',
  llm:              'Writing response...',
};

// In your streaming loop:
if (event.type === 'pipeline_step') {
  const msg = NODE_MESSAGES[event.node];
  if (msg) setLoadingStatus(msg);   // show "Searching properties..." while fetch_data runs
}
```

### 17.7 Handling Token Refresh Mid-Conversation

JWT tokens expire. A user 15 minutes into a conversation will hit a 401.

```typescript
// Token refresh wrapper
async function sendWithRefresh(message: string) {
  try {
    await send(message, getToken());
  } catch (err: any) {
    if (err.message === 'AUTH_EXPIRED') {
      const newToken = await refreshToken();   // your auth library's refresh call
      setToken(newToken);
      await send(message, newToken);   // retry with fresh token
    } else {
      throw err;
    }
  }
}
// The server returns HTTP 401 BEFORE the stream starts — so the 401 error
// surfaces as a thrown exception from the initial fetch(), not mid-stream.
// Mid-stream 401s don't exist in this architecture (the connection was valid
// when established; expiry is checked at the HTTP layer, not inside SSE frames).
```

### 17.8 Python ↔ JavaScript/TypeScript Reference Card

| Concept | JavaScript / TypeScript | Python |
|---|---|---|
| Async function | `async function foo(): Promise<T>` | `async def foo() -> T:` |
| Await | `await somePromise` | `await some_coroutine` |
| Type shape | `interface BotState { raw_message: string }` | `class BotState(TypedDict): raw_message: str` |
| Runtime validation | `z.object({...}).parse(data)` (Zod) | `BotState(**data)` (Pydantic) |
| Interface / protocol | `interface Port { method(): Promise<R> }` | `class Port(Protocol): async def method() -> R: ...` |
| Partial application | `(x) => fn(fixedArg, x)` | `functools.partial(fn, fixedArg)` |
| Fire-and-forget | `Promise.resolve().then(fn)` | `asyncio.create_task(fn())` |
| Message bus | `ReadableStream` with controller | `asyncio.Queue` |
| SSE emit (server) | `res.write('data: ...\n\n')` | `yield f'data: {json.dumps(d)}\n\n'` |
| SSE consume (client) | `fetch()` + `ReadableStream` reader | `EventSource` or `httpx` async |
| Environment vars | `process.env.API_KEY` | `os.environ['API_KEY']` |
| DI / middleware | Express `app.use(fn)` / NestJS `@Injectable` | FastAPI `Depends(fn)` |
| Route decorator | `@Get('/path')` (NestJS) | `@router.get('/path')` |
| Structured logging | `logger.info({ event, ...fields })` | `log.info("event", **fields)` |
| Background task | `setTimeout(fn, 0)` | `asyncio.create_task(fn())` |
| Schema validation (server) | Zod / class-validator | Pydantic BaseModel |
| Hash map | `Map<string, T>` | `dict[str, T]` |
| Decorator (class/fn) | `@Component()` | `@traceable` |

---

---

## Module 18 — LLM Evaluation Engineering `[AI FOUNDATION]`

> **After this module you will be able to:**
> 1. Build an LLM-as-judge evaluation pipeline that scores response quality at $0.15 per 100 samples
> 2. Design the evaluation flywheel: the continuous loop that makes your AI system improve without manual re-labeling
> 3. Apply RAGAS metrics to measure retrieval quality in a RAG system
> 4. Instrument online metrics (session completion, intent drift, clarification rate) as Kafka events
> 5. Apply the cold start strategy: deploy to 1% with active logging before you have a golden dataset
>
> ⏱ Estimated time: 60 minutes | Difficulty: ★★★★☆ | Prerequisites: Modules 5, 6, 7

*Golden dataset accuracy is where evaluation starts, not where it ends. Every production AI
system at Google, Meta, and Anthropic uses a multi-layer evaluation stack. This module teaches
that stack and how to build it.*

---

### 18.1 The Evaluation Pyramid — Why Accuracy Isn't Enough

The Housing.com golden dataset measures: does the SLM output the correct `main_intent`?
That's one signal. A complete evaluation stack looks like this:

```
              ▲ Cost / Effort
              │
              │  Human evaluation         ← Ground truth, expensive, slow (weeks)
              │  LLM-as-judge             ← Quality at scale, ~$0.15/100 samples (minutes)
              │  Reference-based metrics  ← Exact match, ROUGE (fast, $0)
              │  Online signals           ← Real user behavior (free, continuous, noisy)
              └──────────────────────────────────────────────────────▶ Speed / Frequency
```

**Each layer answers a different question:**
- Exact-match accuracy: did the SLM output the right label?
- LLM-as-judge: was the full agent response helpful, accurate, and appropriately toned?
- Reference-free: does the response contradict what's in context? Is it self-consistent?
- Online signals: did the user actually get value from the response?

You need all four. Optimizing for one while ignoring others produces systems that score
well on benchmarks but fail real users.

> ⚠️ **Common Misconception:** "High accuracy on our golden dataset means our agent is working well."
>
> **Reality:** Golden dataset accuracy tests the SLM's classification — not whether the full agent
> response was helpful, honest, or appropriately formatted. A system with 98% classification accuracy
> can still generate responses that confuse users or hallucinate property details. Classification
> accuracy is necessary but not sufficient. This is why Section 18.2–18.5 exist.

---

### 18.2 LLM-as-Judge — Scaling Quality Evaluation

Human evaluation is the gold standard but costs $0.05–$0.50 per sample and takes hours to
arrange. At production scale (thousands of turns per day), you need automated quality scoring.
LLM-as-judge solves this: use a stronger model to evaluate your system's outputs.

```python
JUDGE_PROMPT = """You are evaluating an AI assistant's response to a user query.

User query: {user_message}
Context injected into AI: {injected_data}
AI response: {agent_response}

Score on three dimensions (1-5 each):
1. FAITHFULNESS: Does the response contradict any facts in the injected context?
2. RELEVANCE: Does the response address what the user actually asked?
3. COHERENCE: Is the response well-structured and easy to understand?

Return JSON only:
{{"faithfulness": N, "relevance": N, "coherence": N,
  "reasoning": "brief explanation",
  "flag_for_review": true/false}}"""

async def judge_response(sample: dict) -> dict:
    response = await client.messages.create(
        model="claude-sonnet-4-6",      # Stronger than the system being evaluated
        max_tokens=300,
        messages=[{"role": "user", "content": JUDGE_PROMPT.format(**sample)}]
    )
    return json.loads(response.content[0].text)

# Run on 100 samples: ~$0.15 total, ~2 minutes async
async def eval_batch(prompt_version: str, samples: list[dict]) -> dict:
    results = await asyncio.gather(*[judge_response(s) for s in samples])
    return {
        "prompt_version": prompt_version,
        "n": len(results),
        "avg_faithfulness": sum(r["faithfulness"] for r in results) / len(results),
        "avg_relevance":    sum(r["relevance"]    for r in results) / len(results),
        "avg_coherence":    sum(r["coherence"]    for r in results) / len(results),
        "flagged_count":    sum(1 for r in results if r["flag_for_review"]),
    }
```

**Cost math:** At $0.003/1K input tokens and ~500 tokens per judgment: ~$0.0015/sample.
100 samples = $0.15. Run this on every prompt change before deploying. That's affordable at any scale.

**Gate to use:** Run `eval_batch` in the CI/CD pipeline (Module 5.3) on every prompt change.
Block deploy if `avg_faithfulness < 4.0` or `flagged_count > 5%`. This is the production-grade
version of "does the prompt still work?"

> 🎯 **MAANG Interview Connection:** "How do you evaluate LLM quality without human annotation?"
> The model answer: LLM-as-judge with a stronger model scoring faithfulness/relevance/coherence,
> run on a daily sample of live traffic. Describe cost ($0.15/100 samples), latency (async,
> non-blocking), and what you do with flagged outputs (→ annotation queue → golden dataset expansion).

**Scoring rubric — what each number actually means:**

| Score | Faithfulness | Relevance | Coherence |
|---|---|---|---|
| 5 | Perfectly grounded — zero additions beyond context | Directly and completely answers the question | Well-structured, no redundancy |
| 4 | Minor acceptable inference ("so you'd pay ₹2.5Cr") | Fully answers with minor extras | Clear, minor wordiness |
| 3 | One unverified claim present | Answers but misses a secondary part | Some unclear phrasing |
| 2 | Multiple unverified claims | Tangentially related, doesn't answer | Hard to follow |
| 1 | Contradicts the provided context | Completely unrelated to query | Incoherent |

Ship if average faithfulness ≥ 4.0 and flagged_count ≤ 5%. These are the two blocking gates.

**Inter-annotator agreement — calibrating the judge before trusting it:**

Before running the judge at scale, validate it against 50 human-scored samples:
1. Two humans independently score the same 50 samples
2. Run your judge on the same 50
3. Compute Spearman correlation (judge vs human average): target > 0.7
4. If below: your rubric is ambiguous. Add scored examples directly into the judge prompt.

**The most common calibration failure:** "Is this relevant?" is too vague. Replace with:
"Does this response answer the *specific* question asked, not a related question?"
Specificity in the rubric is the single biggest driver of judge agreement.

**When NOT to use LLM-as-judge:**

| Situation | Why it fails | Use instead |
|---|---|---|
| Factual accuracy in niche domains | Judge model doesn't know the facts either | Human expert annotation |
| Same model family judging its own outputs | Self-serving bias — rates its own style as "coherent" | Use a different family (GPT judges Claude, Claude judges GPT) |
| Safety/policy compliance | Judge misses subtle violations | Dedicated safety classifier + human review |
| Code correctness | LLM judge can't execute code | `pytest` tests, execution-based eval (Pass@k) |
| High-stakes releases | Systematic judge blind spots | Human eval + judge, not judge-only |

---

### 18.3 RAGAS — Evaluating RAG Systems

When your system uses retrieval (Module 12.5, Module 16.8), you have failure modes that
exact-match accuracy can't catch. RAGAS (Retrieval-Augmented Generation Assessment) defines
the standard metrics:

```
  User query → Retriever → Retrieved chunks → Generator → Response

  Does the retriever fetch relevant chunks?
          │
     CONTEXT RELEVANCE (Are retrieved chunks relevant to the query?)
          │
  Does the generator use what was retrieved?
          │
       FAITHFULNESS (Does the answer contradict the retrieved context?)
          │
  Does the answer address what the user asked?
          │
     ANSWER RELEVANCE (Does the answer actually answer the question?)
```

```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_relevancy

dataset = [{
    "question": "What is the price of the 3BHK in Bandra?",
    "contexts": ["3BHK in Bandra West, ₹2.5Cr, 1200 sqft, ready to move"],
    "answer": "The 3BHK in Bandra is priced at ₹2.5 crore.",
    "ground_truth": "₹2.5Cr"   # optional
}]
results = evaluate(dataset, metrics=[faithfulness, answer_relevancy, context_relevancy])
```

**RAGAS metric definitions — worked example:**

Query: *"Does the apartment in Bandra have parking?"*
Retrieved context: *"3BHK in Bandra West. 2 covered parking slots included. Price: ₹2.5Cr."*
Generated answer: *"The Bandra apartment includes 2 covered parking slots."*

| Metric | What it measures | Score for example | Why |
|---|---|---|---|
| **Faithfulness** | Claims in answer supported by context / total claims | 5/5 | Every claim ("Bandra", "2 covered", "parking") is in context |
| **Context Relevance** | Context sentences relevant to query / total context sentences | 0.67 | Parking + location relevant; price sentence not needed |
| **Answer Relevance** | Semantic similarity between query and questions generated from the answer | 0.92 | Directly addresses "does it have parking?" |

**Score interpretation guide — production thresholds:**

| Score | Interpretation | Action |
|---|---|---|
| 0.9–1.0 | Excellent | No action needed |
| 0.7–0.9 | Good | Monitor; no immediate fix |
| 0.5–0.7 | Degraded | Investigate, fix within sprint |
| < 0.5 | Broken | Block deploy, immediate fix required |

**What to do when RAGAS scores drop:**

| Score drops | Root cause | Fix |
|---|---|---|
| Faithfulness < 0.7 | LLM adding claims beyond context | Add `validate_output` rules; lower temperature; add "ONLY use provided context" to system prompt |
| Context Relevance < 0.7 | Retriever returning irrelevant chunks | Smaller chunks; hybrid BM25 + vector search; better embedding model |
| Answer Relevance < 0.7 | LLM not answering the actual question | Prompt: add "answer the specific question asked"; check if multi-turn history is diluting intent |

**RAGAS vs human evaluation — when each is the right tool:**

| | RAGAS | Human eval |
|---|---|---|
| Cost | ~$0.50 per 100 samples | $5–$50 per 100 samples |
| Speed | Minutes (async LLM calls) | Hours–days |
| Scale | 10,000 samples easily | ~200 samples/week |
| Catches | Factual contradictions, retrieval misses, unanswered questions | Tone, cultural nuance, domain errors, subtle safety issues |
| Blind spots | Plausible-sounding hallucinations, systematic model bias | Nothing, if expert annotator |
| Use for | Per-deploy gate, continuous monitoring | Monthly calibration, high-stakes releases |

**The full RAGAS diagnostic loop — how to use it in CI:**

```
Code / prompt change submitted
    ↓
Run RAGAS on 200-sample eval set (~$1.00, ~3 minutes async)
    ↓
Context Relevance < 0.7?
  YES → retrieval problem
        - Try smaller chunk size (512 → 256)
        - Try hybrid search (BM25 + vector)
        - Re-embed with better embedding model (BGE-large vs ada-002)
    ↓
Faithfulness < 0.7?
  YES → generation problem
        - Lower temperature (0.5 → 0.2)
        - Add "answer ONLY from the provided context" to system prompt
        - Add validate_output rules for domain facts
    ↓
Answer Relevance < 0.7?
  YES → prompt problem
        - Make question more explicit in system prompt
        - Check if turn_history is obscuring current query intent
        - Add "Directly answer: {user_question}" to prompt
    ↓
All scores ≥ 0.7 → merge
```

---

### 18.4 Online Metrics — What Real Users Tell You

Golden datasets and LLM judges are offline metrics. They tell you about quality.
Online metrics tell you about *value* — did the user get what they needed?

**Metrics that don't require a survey:**

| Signal | How to Measure | What It Indicates |
|---|---|---|
| Session completion | `session_completed: true` vs `abandoned` in Kafka event | Did the user find what they needed? |
| Follow-up confusion rate | Next turn contains "what do you mean?", "I meant", "that's wrong" | Previous response was unclear or incorrect |
| Intent coverage rate | `out_of_scope` count / total turns over time | Taxonomy gap — users asking about things you don't handle |
| Clarification rate | `clarification_needed=true` from SLM / total turns | Queries too ambiguous for your taxonomy |
| Result interaction | User clicks a property card after AI described it | AI response quality (revealed preference) |
| Session depth × outcome | High depth + no completion vs high depth + completion | Distinguish engaged users from confused users |

All of these are already Kafka events (Module 6.5). Add `session_completed` to the
`followup_node` event and you have a complete online monitoring stack.

> 🎯 **MAANG Interview Connection:** "How would you know if your AI agent is working in production, without looking at accuracy numbers?" Name 3–4 of these metrics, describe the Kafka instrumentation, and explain what thresholds trigger investigation. Specifically: "Intent coverage rate >8% and rising over 7 days tells me users are asking about things my taxonomy doesn't handle — that's a product roadmap signal, not just a bug."

---

### 18.5 The Evaluation Flywheel — How AI Systems Improve

The golden dataset has 200 samples written in Month 1. By Month 6, the product has changed,
new intents have been added, and 200 samples don't cover what users have discovered. Without
a flywheel, quality drifts silently.

```
        ┌─────────────────────────────────────────────────────────┐
        │                                                         │
 Production failures                                   Improved prompt or
 flagged by online metrics                             model deployed
        │                                                         │
        ▼                                                         ▲
 Automatic annotation queue:                        Golden dataset expanded
 LLM-as-judge pre-screens;                         with verified samples;
 human reviews only borderline                     model_eval gate re-run
 cases (saves 80% review time)                               │
        │                                                     │
        └─────────────────────────────────────────────────────┘
                            │
               Active learning selects highest-value
               samples: low confidence, new patterns,
               judge-flagged outputs
```

**Active learning in code — log samples where the model is uncertain:**
```python
# In classify_node: after getting classification
if classification.confidence < 0.70:   # threshold from your confidence P10
    await kafka_producer.send("annotation_queue", {
        "session_id": session_id,
        "normalized_message": state["normalized_message"],
        "predicted_intent": classification.main_intent,
        "confidence": classification.confidence,
        "trigger": "low_confidence",
        "timestamp": datetime.utcnow().isoformat(),
    })
```

**The annotation pipeline (production-grade):**
```
Kafka "annotation_queue"
    → Pre-screening (LLM-as-judge scores quality)
    → judge_score > 4: skip (already correct, not worth labeling)
    → judge_score < 2: auto-label as incorrect (obvious errors)
    → 2 ≤ judge_score ≤ 4: human review queue (Label Studio)
    → Approved sample → golden_dataset table in Postgres
    → Weekly: re-run model_eval, deploy if accuracy improved
```

This loop is why AI products at Google and Meta improve continuously without a team
manually re-labeling from scratch every quarter.

---

### 18.6 The Cold Start Problem

*What do you do before you have any data?*

**Week 0 strategy (in order):**

1. **Synthetic data from your taxonomy** — for each intent, generate 10 diverse examples:
   ```python
   GENERATE_PROMPT = f"""Generate 10 diverse user messages expressing intent '{intent_name}'.
   Vary vocabulary, formality, length, regional dialect. Return JSON array of strings."""
   ```
   20 intents × 10 examples = 200 seed samples in 1 hour at ~$0.20.

2. **Shadow mode for week 1** — route 5% of traffic through both old and new system.
   Compare outputs. Flag where they diverge. Log everything.

3. **Internal users first** — your own team as beta users. They understand product
   context, give structured feedback, and won't churn if the agent makes a mistake.

4. **Progressive rollout with active logging** — 1% → 5% → 20% → 100%.
   At each stage: monitor online metrics, flag suspicious patterns, add to annotation queue.

> ⚠️ **Common Misconception:** "We can't deploy until we have enough data."
>
> **Reality:** The best data comes from production traffic. Deploy to 1% with aggressive
> monitoring and active logging on day 1. Synthetic seed data gets you to a functional
> baseline; real users show you what you missed. Waiting for "enough data" before deployment
> means you'll wait forever — you don't know what "enough" looks like until users show you.

---

### 18.7 Evaluation by System Type — Quick Reference

| System Type | Primary Offline Metric | Primary Online Metric | Recommended Tool |
|---|---|---|---|
| Intent classifier (this codebase) | Classification accuracy on golden set | `out_of_scope` rate, clarification rate | Custom `model_eval`, pytest golden |
| RAG system | RAGAS (faithfulness + context relevance) | Session completion, follow-up confusion | `ragas` library + LLM judge |
| Code assistant | Pass@k on benchmark (HumanEval) | User acceptance rate for suggestions | HumanEval + IDE telemetry |
| Summarization | ROUGE-L + LLM coherence judge | Time saved vs reading original | LangSmith + LLM judge |
| Multi-turn conversation | Task completion rate | Session depth × outcome | LLM judge + Kafka events |

---

## Module 19 — AI System Design Interview Prep `[CORE]`

> **After this module you will be able to:**
> 1. Structure any AI system design answer using the 6-step framework (requirements → data → model → eval → serving → monitoring)
> 2. Apply decision trees to choose between RAG vs fine-tuning, streaming vs batch, two-stage vs single-model
> 3. Answer 4 real MAANG Senior/Lead AI Engineer interview questions at the L5/L6 level
> 4. Quantify every tradeoff — "we chose X over Y because [specific number] matters more in our context"
> 5. Map every module in this course to the specific interview question it helps you answer
>
> ⏱ Estimated time: 90 minutes | Difficulty: ★★★★★ | Prerequisites: Modules 0–18

*Housing.com was Module 1 of this interview prep. This is Module 2: how to design anything.*

---

### 19.1 The Six-Step Framework

Every AI system design interview at Google, Meta, Apple, Amazon, and Microsoft follows
the same implicit structure. Make it explicit.

```
Step 1: Requirements (5 min)
   Functional:      What does it DO? What is success?
   Non-functional:  Latency SLA (P95, not average), accuracy floor, cost ceiling, safety
   Scale:           DAU, peak QPS, read:write ratio, data volume, growth rate

Step 2: Data strategy (5 min)
   Training signal: Labeled data, implicit feedback, RLHF, synthetic generation
   Cold start:      How does it work before you have data? (Module 18.6)
   Pipeline:        Collection → annotation → versioning → serving

Step 3: Model architecture (8 min)
   ML framing:      Classification? Generation? Retrieval? Ranking?
   Approach:        RAG vs fine-tuning vs zero-shot vs hybrid (decision tree, Module 19.3)
   Two-stage:       When does a fast classifier before a generator help? (Module 1.5)
   Fallbacks:       What happens when the model fails? (Module 8.4)

Step 4: Evaluation (4 min)
   Offline:         Accuracy, LLM-as-judge, RAGAS (Module 18.1–18.4)
   Online:          Task completion, implicit feedback, drift detection (Module 18.4–18.5)
   Flywheel:        How does quality improve over time? (Module 18.5)

Step 5: Serving and infrastructure (5 min)
   Latency budget:  How is the SLA allocated across components? (Module 15.7)
   Caching:         Prompt cache, result cache, session store (Modules 3, 8, 16.6)
   Concurrency:     Rate limiting, backpressure, graceful degradation (Modules 8.1, 8.4)
   Streaming:       SSE vs batch; when each is appropriate (Module 1.2, decision tree below)

Step 6: Monitoring and maintenance (3 min)
   Drift detection: Distribution shift, accuracy decay, intent coverage rate (Module 6.5)
   Rollback:        Zero-downtime prompt rollback; blue-green node deploy (Module 8.6)
   Cost control:    Per-session cost tracking, alert before spend becomes a problem (Module 6.4)
```

**The ratio of time matters.** Interviewers at L6 level want to see requirements done right before
architecture begins. Spending 15 minutes on model architecture and 2 minutes on requirements
signals junior-level thinking. State your requirements and get agreement before drawing any diagram.

---

### 19.2 Requirements — The Questions That Prevent Wrong Answers

The most common mistake in AI system design interviews: jumping to model architecture before
understanding what the system needs to do.

**The requirements checklist:**
```
Functional:
  □ What is the user's core job-to-be-done?
  □ What does "success" look like for one session?
  □ What must the system NEVER do? (safety, accuracy, cost)

Non-functional (with numbers):
  □ Latency SLA: P95 < ___ms (P99 for enterprise, P95 for consumer)
  □ Accuracy floor: ___% (minimum acceptable, not aspirational)
  □ Cost ceiling: $___ per session / per user / per month
  □ Availability: ___% uptime (99.9% = 8.7 hours downtime/year)

Scale:
  □ DAU today and at 18 months
  □ Peak QPS (maximum concurrent sessions, not average)
  □ Read:write ratio → determines storage architecture
  □ Session data size × sessions/day → storage capacity
```

**Housing.com as a worked example — the template for your interview:**

| Requirement | Value | Design Implication |
|---|---|---|
| Core job | Natural language → relevant property listings | Multi-node pipeline, not simple chatbot |
| Success | User contacts a seller within the session | Track `session_completed` as primary metric |
| Latency SLA | P95 < 800ms | Two-stage SLM (20ms), parallel pre-fetch, SSE |
| Accuracy floor | Intent classification >92% | Golden dataset + model_eval CI gate |
| Cost ceiling | <$0.012/session | Haiku for SLM ($0.0001), Sonnet for Tier 3b ($0.005) |
| DAU | 500K → 1M in 18 months | Redis Cluster plan, Kafka partition headroom |
| Peak QPS | ~200 concurrent sessions | LLM concurrency gate, max_concurrent=50 |
| Read:write | ~25:1 | Redis for reads, Postgres for durable writes only |

Every design decision in this codebase is a direct response to one row in this table.
Without the requirements, the choices look arbitrary. With them, they're inevitable.

---

### 19.3 Decision Trees for Key Architectural Choices

Know these cold. They appear in almost every Senior/Lead AI Engineer interview.

#### When to Use Two-Stage Architecture

```
Should I add a fast classifier before the main LLM?
│
├─ Is there a bounded set of intents/domains/categories I can enumerate?
│   YES → Stage 1 classifier is worth building. Routes 60-80% of traffic to
│          deterministic paths (Tier 0/1/2) that need no LLM at all.
│
├─ Is latency critical (P95 < 500ms)?
│   YES → A 20ms SLM call is faster AND cheaper than asking a large LLM
│          "what kind of request is this?" (~500ms, $0.005).
│
├─ Is the output space open-ended? (creative writing, general Q&A, research)
│   YES → Skip the classifier. You can't enumerate open-ended intents.
│          Jump straight to a capable generalist model.
│
└─ Cost is a major constraint AND >40% of traffic can be handled without LLM?
    YES → Classifier pays for itself. Housing.com: 65% Tier 0/1/2.
          At 500K DAU: $0.005 × 500K × 4 turns × 65% = $6,500/day saved.
```

#### When to Stream vs Batch Response

```
Should I stream AI response tokens to the user?
│
├─ Is the response long (>50 tokens, ~30+ words)?
│   YES → Stream. First token in ~500ms vs waiting 3s for full response.
│          Perceived responsiveness matters more than actual completion time.
│
├─ Is there a single correct answer with no natural narrative?
│   YES → Batch is fine (e.g., "What's the capital of France?").
│          Streaming a one-word response adds latency and complexity.
│
├─ Will the UI show partial results as they arrive?
│   YES → Stream. The Housing.com pattern: carousel arrives immediately,
│          LLM text streams beneath. Two visual events, better perceived performance.
│
└─ Is this an API-to-API call with no human in the loop?
    → Batch. Streaming overhead (SSE framing, connection management) adds
      ~20ms setup time with no benefit for machine consumers.
```

#### When to Use Redis vs Postgres vs Both

```
Where should this data live?
│
├─ Sub-millisecond read latency + data is ephemeral (sessions, cache)?
│   YES → Redis. Sessions expire at TTL anyway. No durability needed.
│          Redis at 0.5ms vs Postgres at 8ms for a hot key.
│
├─ Cross-session memory needed? (user profile, saved searches, preferences)
│   YES → Postgres. These are durable facts, not ephemeral state.
│          User profile table alongside sessions.
│
├─ Scale: >1M active sessions simultaneously?
│   YES → Redis Cluster. Single node ~15GB active session limit.
│          Key-slot affinity on session_id keeps related keys co-located.
│
├─ Complex queries, joins, or reporting?
│   YES → Postgres. Redis isn't a query engine.
│
└─ Compliance: PII encrypted at rest?
    → Redis with encryption-at-rest (ElastiCache + KMS) for speed,
      OR Postgres with encrypted `turn_history` column for auditability.
      Use both: Redis for hot path, Postgres for audit trail.
```

---

### 19.4 Sample MAANG Interview Questions with Model Answers

These are real questions asked at Google, Meta, and Amazon for Senior/Lead AI roles.

---

**Q1: "Design a customer support bot for a large e-commerce platform."**

*Weak answer:* "I'd use ChatGPT and connect it to our order database."

*Strong answer:*

**Requirements (state first):** 10M users, P95 < 1s, 50K QPS at peak, must never give wrong
refund information, cost < $0.01/session.

**Classifier first:** 70% of tickets are order status, returns, shipping ETA — deterministic.
Classify intent → fetch order via API → return template response. No LLM needed.
Only 30% require generative responses (complaints, edge cases, sentiment handling).

**Two-stage:** Haiku classifier ($0.0001) → route to template OR Sonnet generator ($0.005).
At 50K QPS: routing 70% to templates saves ~$12,500/day over sending everything to LLM.

**RAG for product knowledge:** catalog changes daily → RAG, not fine-tuning.
Vector DB with product embeddings; retrieve top-3 relevant products before generating.

**Evaluation:** LLM-as-judge daily on 1,000 live samples; RAGAS for retrieval quality;
session resolution rate as primary online metric (was the issue resolved in one session?).

*What makes this L6:* cost math is specific, tier strategy is quantified, RAG decision is
explained with "data changes daily" reasoning. The interviewer can see you've done this before.

---

**Q2: "Your SLM classifier accuracy dropped from 94% to 87% overnight. Walk me through your debugging."**

This tests your understanding of production AI operations.

**Step 1:** Check what changed. Was a prompt pushed? A dependency upgraded? Model version changed?
This is the answer 60% of the time.

**Step 2:** Look at error distribution. Is it concentrated in specific intents?
Concentration in 2–3 intents = new query patterns those few-shot examples don't cover.
Uniform degradation across all intents = something systemic (model version, tokenization, prompt format).

**Step 3:** Check confidence score distribution in LangSmith.
Did P50 confidence drop, or did P10 drop (more low-confidence outliers)?
P10 drop = new out-of-distribution inputs. P50 drop = systematic regression.

**Step 4:** Pull the specific samples that flipped from correct to incorrect.
Do they share lexical patterns? Run them through the classifier in isolation with logging up.

**Step 5:** Check if the golden dataset became stale.
Added new intents recently but didn't add negative examples? New intents overfiring on
ambiguous queries that previously went to `out_of_scope`.

**The L6 answer also covers:** how the annotation queue (Module 18.5) automatically captures
these failing samples, and how the eval flywheel means this regression self-corrects in days
rather than requiring a manual audit.

---

**Q3: "How would you prevent your AI agent from giving wrong information?"**

Defense-in-depth model answer:

1. **Grounding** — inject real data as context (pre-fetched tool results). The model works
   from facts, not from training memory. Cannot contradict what it's explicitly given if the
   prompt instructs faithfulness.

2. **Output validation** — `validate_output_node` strips hallucinated phone numbers, invented
   URLs, pricing claims not present in the fetched data. Pattern-based, deterministic.

3. **Confidence gating** — if SLM classification confidence < threshold, short-circuit to
   a clarification question rather than generating a potentially wrong answer.

4. **LLM-as-judge monitoring** — daily batch evaluation flags responses with low faithfulness
   scores for human review. Issues surfaced in hours, not months.

5. **Fast rollback** — prompts live in Redis (Module 8.6). A bad prompt is rolled back by
   flipping one Redis key, not a code deployment. Mean time to rollback: <60 seconds.

6. **User feedback loop** — thumbs-down signals route to annotation queue. Corrective examples
   added to golden dataset. Model improves from its own failures.

*What makes this L6:* it's not one mechanism, it's a defense-in-depth stack. Each layer catches
what the previous one misses. The answer demonstrates systems thinking, not a single silver bullet.

---

**Q4: "How would you scale this system to 10M DAU?"**

From Module 11, extended:

| Component | 1M DAU | 10M DAU | Change Required |
|---|---|---|---|
| Redis sessions | ~1.5GB | ~15GB | Redis Cluster (shard by session_id) |
| Peak QPS | ~200 | ~2,000 | 10 FastAPI instances behind ALB |
| Kafka events | ~4M/day | ~40M/day | Increase partitions from 4 to 40 |
| LLM RPM | ~4,000 | ~40,000 | Multiple API keys + load-balanced adapters or PTU |
| New bottleneck at 10M | None | SSE sticky sessions | Ensure ALB cookie affinity scales |

New bottleneck that doesn't appear in the 1M table: at 10M DAU with SSE sticky sessions,
your load balancer becomes the constraint. Standard ALB handles ~1M concurrent connections.
At 10M with 30-second average session duration: peak 300K concurrent connections × 10 instances
= 30K per instance. Well within ALB limits. But at 100M: need distributed connection management.

---

### 19.5 How to Quantify Tradeoffs — The L6 Formula

The single skill that separates L5 from L6: every tradeoff is quantified.

| Weak phrasing | L6 phrasing |
|---|---|
| "Redis is faster" | "Redis at 0.5ms vs Postgres at 8ms. At 200 QPS that's 1.5s of total latency saved per second — within our 800ms P95 SLA budget" |
| "Streaming improves UX" | "Streaming reduces perceived time-to-first-token from 2.3s to 450ms. Research shows conversion drops ~20% per second of wait time — this is a revenue decision" |
| "RAG is better than fine-tuning here" | "Product catalog updates daily. Fine-tuning costs $2K–$40K GPU + 2 weeks per update. RAG serves changes in real-time at $0 retraining cost. The tradeoff: RAG adds 80ms retrieval latency, within our 800ms SLA" |
| "We need better monitoring" | "Our `out_of_scope` rate is 11% and rising 0.5 points/week. At this rate, 1 in 8 user messages hits a gap in our taxonomy within 6 months. That's the business case for the evaluation flywheel" |

**The formula:** "We chose X over Y because [specific measurement] matters more than
[specific cost] in our context. At [scale], this saves/costs [specific number]."

---

### 19.6 The Learning Path Backward — Every Module, One Interview Question

| Module | What You Learned | The Interview Question It Answers |
|---|---|---|
| 0 | Agent spectrum, when autonomous works | "Would you use an autonomous agent for this?" |
| 1 | HLD, SSE, two-stage SLM | "How would you stream AI responses?" + "Why not one large model for everything?" |
| 2 | 19-node pipeline, tier system | "Walk me through your agent's architecture" |
| 3 | Session state, Redis, CAS locking, context window | "How do you handle concurrent sessions?" + "Handle context limits?" |
| 4 | Tool system, adapters | "How do you integrate external data into an AI response?" |
| 5 | Test pyramid, golden dataset, CI/CD | "How do you test an AI system?" |
| 6 | LangSmith, structured logging, AI-specific metrics | "How do you debug an AI agent in production?" |
| 7 | A/B experiments, guardrails | "How do you safely compare two prompt versions?" |
| 8 | Concurrency gate, degradation, deployment | "What happens when your LLM provider goes down?" |
| 9 | JWT, RBAC, safety layers | "How do you prevent prompt injection?" |
| 10 | Multi-tenancy, Azure swap | "Make this work for multiple enterprise clients" |
| 11 | Scale math, Redis cluster, Kafka | "Scale this to 10M DAU" |
| 12 | Generalization, RAG case study | "Apply this architecture to [any other domain]" |
| 13 | Build order | "How long does it take to build this?" |
| 14 | Gotchas | "What are the most common failure modes you've seen?" |
| 15 | Mental models | "What principles guide your AI system design?" |
| 16 | LLM fundamentals, RAG, prompt caching | "Explain how you'd optimize LLM costs at scale" |
| 17 | Frontend streaming | "How does the frontend consume this system?" |
| 18 | Evaluation engineering | "How do you measure if your AI system is working?" |
| 19 | This module | "Design [any AI system]" |
| App. A | ML Foundations Primer | "What is a model?" "Classification vs regression?" "Training vs inference?" |
| App. B | FE→AI Transition Playbook | "Why AI after [N] years in frontend?" + behavioral coaching |
| App. C | Python for AI Engineering | "Read and explain this AI pipeline file" (coding round) |

---

### 19.7 Case Study: Design Uber's ETA Prediction System

*The previous four questions were housing chatbot and customer support. Let's apply the same 6-step framework to a domain you may have lived in — and show how frontend engineering experience maps directly to AI system design thinking.*

**The interview prompt:** *"Design a system that predicts how long a trip will take, in real time, for every Uber request."*

Take 30 seconds before reading. Apply the six steps yourself. Then compare.

---

**Step 1: Requirements (5 min)**

| Requirement | Value | Design Implication |
|---|---|---|
| Output | Duration in minutes (a number) | **Regression**, not classification — say this in the first sentence |
| Latency SLA | P95 < 100ms | No LLM anywhere — ML inference only (GBT ~5ms) |
| Accuracy KPI | \|predicted − actual\| ≤ 2 min for 80% of trips | RMSE + "% within 2 min" as primary eval metric |
| Availability | 99.99% | Two-stage with Stage 1 fallback — never return no ETA |
| Scale | 30M trips/day, ~5K req/s peak | Stateless prediction service, horizontal scaling |
| Read:Write | ~99:1 | Cache aggressively — pre-compute common zone pairs |

P95 < 100ms rules out LLMs (~500ms+). 99.99% availability requires a fallback that always works. 99:1 read ratio means caching is the primary scaling lever.

---

**Step 2: Data Strategy (5 min)**

Training signal: every completed trip → `(pickup_lat_lng, dropoff_lat_lng, timestamp, route_taken, actual_duration_seconds)`. Labels are free — ground truth arrives when the trip ends. 30M trips/day × 365 days = ~11 billion labeled examples.

Key features:
```
Route:      distance_meters, road_type_mix (highway/urban/residential %)
Time:       hour_of_day, day_of_week, is_holiday, is_local_event (stadium nearby?)
Real-time:  current_avg_speed_by_road_segment (from GPS pings of active drivers)
Weather:    rain_intensity (rain adds ~20% to urban travel time)
```

Cold start (new city): `google_maps_eta × calibration_factor` until 10,000 local trips complete. First week: show uncertainty range ("~35–45 min") rather than a false precision.

Pipeline: Spark batch job trains nightly → Feature Store serves current road speeds < 10ms → model registry for versioned rollback.

---

**Step 3: Model Architecture (8 min)**

```
Output is a number (minutes) → REGRESSION.
                                ↑ The most common interview framing mistake.
                                  Never say "classify into buckets." Say regression.
```

```
Decision: structured tabular input + P95 < 50ms inference requirement
│
├─ Gradient Boosted Trees (XGBoost / LightGBM)
│   ✓ Inference: 2–5ms  ✓ Excellent on tabular  ✓ Interpretable features
│   Used for: ETA, fraud scoring, surge multiplier prediction
│
└─ Deep Neural Network
    Better when: unstructured inputs (map tile images, multi-modal route data)
    Adds 20–50ms inference — exceeds our budget
    Use for ETA v2 with satellite imagery (that's a future problem, not today's)
```

Two-stage (the availability pattern):

```
Stage 1 (< 10ms): Route distance → rough estimate using city avg speed.
                   Always succeeds. Shown immediately.

Stage 2 (< 50ms): ML model with real-time features → refined estimate.
                   Overwrites Stage 1 when available.
                   Fails during deploys → Stage 1 holds. Never a blank screen.
```

Same graceful degradation philosophy as Module 8.4. Design for the failure case first.

---

**Step 4: Evaluation (4 min)**

- **Offline:** RMSE on held-out test set; MAE by percentile (P50, P80, P95); business metric: % of trips within ±2 min
- **Online:** Rolling 1-hour actual vs predicted per city; rider complaint rate tagged "late/wrong ETA"
- **A/B test** new model on 5% of traffic before full rollout (Module 7 pattern applied to ML models)
- **Flywheel:** Every completed trip automatically becomes training data. ETA improves steadily with zero annotation cost — same concept as the annotation queue in Module 18.5.

---

**Step 5: Serving (5 min)**

Latency budget (total 100ms):
```
Network:                ~20ms
Feature Store lookup:   ≤ 10ms  (co-located with prediction service)
Route graph (Stage 1):  ≤ 10ms  (pre-loaded in-process)
GBT inference:          ≤ 5ms   (in-memory, no I/O)
Serialization:          ≤ 10ms
Total used:             ~55ms   ← 45ms headroom
```

Caching: pre-compute `(pickup_zone, dropoff_zone, time_bucket)` ETAs every 5 minutes. Cache hit target: ~65%. TTL: 5 minutes.

Stateless prediction service (contrast with chat!): no session state, no sticky sessions required. Every ETA request is fully independent. Horizontal scaling without any session affinity.

Streaming: NOT needed — ETA is a single number. SSE overhead adds cost with zero benefit.

---

**Step 6: Monitoring (3 min)**

| Signal | Threshold | Action |
|---|---|---|
| Rolling 1h RMSE per city | > 5 min | Page on-call |
| City accuracy (% within 2 min) | < 70% | Trigger auto-retrain |
| Feature Store latency P95 | > 50ms | Fail open to Stage 1 |
| Model age | > 7 days | Auto-retrain signal |

Rollback: model registry allows instant rollback to previous model version — no redeployment. Same philosophy as Redis prompt rollback in Module 8.6.

---

**How FE experience maps to this system:**

| FE Experience | ETA System Equivalent |
|---|---|
| Pre-rendering common routes (SSG/ISR) | Pre-computing ETAs for common zone pairs (batch inference + cache) |
| CDN edge cache with short TTL | Feature Store with 5-min TTL for road speed features |
| Feature flag + canary release | A/B test 5% of traffic for new model version |
| Core Web Vitals improving over months | MAE improving over months of new training data (eval flywheel) |
| P95 latency monitoring per endpoint | P80/P95 accuracy monitoring per city and time-of-day |
| Sticky sessions for WebSocket | NOT needed here — contrast with SSE chat (Module 8.3) |

**What a strong L6 answer demonstrates:** (1) Named "regression" in first sentence. (2) Two-stage with explicit fallback. (3) Latency budget broken down to component level. (4) Evaluation flywheel through automatic label collection. (5) Rollback strategy without redeployment. (6) FE analogies to make each decision concrete.

---

*Core modules complete. Appendices A–C follow for specialization tracks.*

---

## Appendix A — ML Foundations Primer `[AI FOUNDATION]`

> **After this appendix you will be able to:**
> 1. Explain what a machine learning model is using a function analogy
> 2. Identify the correct ML problem type for any system design question
> 3. Describe training vs inference and why the distinction drives architecture
> 4. Define precision, recall, RMSE, and MAE — and know when to optimize for each
> 5. Explain batch vs online inference with concrete examples
>
> ⏱ Estimated time: 60 minutes | Difficulty: ★★☆☆☆ | Prerequisites: None

*Read this before Module 16 if you have never trained a machine learning model. Zero math. JavaScript analogies throughout.*

---

### A.1 What Is a Machine Learning Model?

A machine learning model is a function: `f(inputs) → prediction`

Unlike a function you write, its behavior is *learned* from examples, not programmed explicitly.

**JavaScript analogy:** Imagine writing `estimateTripDuration(pickup, dropoff, time)`. You could hardcode every road's speed and every time-of-day factor — it would take years and still be wrong. Instead, you show the function 10 million examples of `(pickup, dropoff, time) → actual_duration` and let it find the patterns. That's machine learning.

The patterns are encoded as numbers called **weights**. Training = finding the right numbers. Inference = using those numbers on new inputs. Why this matters for system design: training is slow and expensive (hours on GPU). Inference is fast and cheap ($0.0001/request for a GBT model). Every architecture decision about where to run a model follows from this asymmetry.

---

### A.2 The Four ML Problem Types

Every ML system you will encounter in an interview is one of these four.

| Problem Type | Output | Examples |
|---|---|---|
| **Classification** | A category from a fixed set | Spam/not spam. Which intent? Is this fraud? Safe/unsafe? |
| **Regression** | A continuous number | ETA in minutes. House price. Surge multiplier. |
| **Recommendation** | Best K items from a catalog | Restaurants to show. Drivers to surface. Next song. |
| **Ranking** | Re-ordered list of existing items | Re-rank search results. Rank feed posts by relevance. |

Decision rule: "Is this a number?" → Regression. "Is this a category from a list?" → Classification. "Show me the best K items?" → Recommendation. "Put these in the right order?" → Ranking.

**Naive → Fail → Correct:**

*Naive:* "ETA prediction — I'll classify trips into buckets: 0–10 min, 10–30 min, 30–60 min."

*Why this fails:* A 28-minute trip and an 11-minute trip are in the same bucket. The model cannot distinguish them. Users see "10–30 min" when the answer is "12 minutes" — and lose trust.

*Correct:* Regression. Output a continuous number (12.3 minutes). Precision makes estimates credible and enables the accuracy KPI (|predicted - actual| ≤ 2 min).

---

### A.3 Training vs Inference

```
Training:  Show model examples. Adjust weights until predictions match ground truth.
           Runs OFFLINE. Expensive (hours/days on GPU). Produces a model file.

Inference: Load the model file. Pass new input. Get prediction in milliseconds.
           Runs ONLINE (real-time). Cheap ($0.0001/request for GBT).
```

**npm analogy:** Training is `npm run build`. Slow, runs once (or nightly), produces artifacts. Inference is serving those artifacts from a CDN — cheap, fast, stateless.

Training pipelines (Spark, Airflow, GPU clusters) are separate from serving infrastructure (FastAPI, Redis). Model files are versioned like code — you can roll back a bad model the same way you roll back a bad commit. The eval flywheel (Module 18.5) is the loop from inference (collecting live examples) back to training (improving the model).

---

### A.4 Features — What Goes In

A feature is a specific piece of information given to the model as input.

```python
# Weak features for ETA:
{"raw_coords": "37.7749,-122.4194,37.3387,-122.0819"}  # Too raw — can't generalize

# Strong features:
{
    "distance_meters": 42000,
    "hour_of_day": 17,             # Rush hour matters more than exact timestamp
    "day_of_week": 4,              # Friday pm differs from Monday morning (same hour)
    "current_avg_speed_kmh": 45.5  # Real-time traffic — the highest-value feature
}
```

If you don't include `hour_of_day`, the model cannot learn that rush hour adds 15 minutes. If you include the raw Unix timestamp instead, the model overfits to specific dates rather than the generalizable hour-of-day pattern. Feature engineering is where most of the ML value comes from in structured data problems.

---

### A.5 Evaluation Metrics — The Three You Must Know

**For classification (Housing.com SLM classifier):**

- **Precision:** Of all times the model predicted class X, how often was it actually X? High precision = few false alarms.
- **Recall:** Of all actual class X instances, what fraction did the model catch? High recall = few misses.
- **F1:** Harmonic mean of precision and recall. Use when both false alarms AND misses are costly (intent classification).

Recall over precision when: missing fraud / missing a safety violation costs more than a false positive. Precision over recall when: false positives (blocking real users) hurt worse than occasional misses.

**For regression (ETA prediction):**

- **RMSE:** Penalizes large errors more than small ones. Use when a 20-min error is worse than two 10-min errors.
- **MAE:** Treats all errors equally. Use when average accuracy matters more than worst-case.

**The interview move:** state primary metric AND secondary constraint. "Primary: RMSE. Secondary: % within ±2 min must stay above 80%. RMSE alone can be gamed while individual large errors destroy user trust."

**For ranking (Uber Eats recommendations):**

- **NDCG@K:** Did the most relevant items appear at the top? Used by Google, Netflix, Uber Eats.
- **Precision@K:** Of the top K shown, how many were relevant? Simple and explainable.

---

### A.6 Batch vs Online Inference

**Batch:** Run model on many inputs offline, store results. Pre-compute "top 20 restaurants per user" nightly. Cheap and cacheable but stale — cannot react to what the user is doing right now.

**Online:** Run per request in real-time. Required when input depends on current state. Must be fast enough to not block the UI.

**Housing.com:** Online only (SLM must respond to the actual message just sent — cannot pre-compute).

**Uber ETA:** Hybrid — batch pre-compute for common zone pairs (~65% cache hit), online for the rest.

This hybrid pattern appears everywhere at scale. Pre-compute what you can predict ahead of time. Serve the rest live. The Housing.com analog: carousel pre-fetch in Module 4.

---

### A.7 Cold Start

Every ML system faces this: how do you serve predictions when you have no training data?

| Strategy | When | Example |
|---|---|---|
| Rule-based fallback | Any domain, deployable day 1 | ETA new city: `google_maps_eta × 1.1`. Chat new domain: Tier 0/1/2 templates before LLM is trained. |
| Proxy model | Related domain has data | New city: calibrate with city-size features from existing cities. |
| Popularity-based | Recommendation cold start | New user: show area top-10. New restaurant: placement boost for 50 orders. |
| Collect first | High stakes, low volume | Soft launch to 1%. Accept lower quality. Improve before scaling. |

Design data collection into the system from day one. The eval flywheel (Module 18.5) is how you escape cold start over time.

---

## Appendix B — FE→AI Engineer Transition Playbook `[FE BRIDGE]`

> **After this appendix you will be able to:**
> 1. Map every major FE skill to its AI engineering equivalent (9 direct mappings)
> 2. Answer "Why AI after [N] years in frontend?" with a specific, credible narrative
> 3. Know what each of the 4–5 interview rounds tests and how this course prepares you
> 4. Follow a 10-week study plan while working full-time
> 5. Apply the 6-step framework to 5 Uber-domain AI scenarios
>
> ⏱ Estimated time: 45 minutes | Difficulty: ★★☆☆☆ | Prerequisites: None (read this first)

---

### B.1 You Already Know More Than You Think

**Fear 1: "I don't know machine learning."**
Reality: You know the engineering patterns that make ML systems work in production. State management (Module 3), concurrency (Module 8), real-time streaming (Modules 1, 17), A/B testing (Module 7). The ML math is learnable in weeks. Production engineering judgment takes years.

**Fear 2: "I'll compete against ML PhDs."**
Reality: Most AI Engineering roles at Uber, Google, Meta are *engineering* roles that use ML, not research roles. Interviewers want someone who can ship reliable systems. Your production experience — debugging 3am incidents, owning P95 latency, reasoning about failure modes — is the differentiator most ML practitioners lack.

---

### B.2 The Skills Mapping Table

For every row: recall a specific story before your interview. You have 9 ready-made behavioral answers.

| Your FE Experience | AI Engineering Equivalent | Course Module |
|---|---|---|
| Running A/B experiments on UI changes | Experimental design for ML: hypothesis testing, traffic splits, statistical significance | Module 7 |
| Instrumenting frontend events (Mixpanel, Amplitude) | Training data pipelines — event streams you produce become ML model features | Module 6.5 |
| Optimizing Core Web Vitals, P95 latency | Latency budget: P95 ms allocation across pipeline components | Module 15.7 |
| Debugging SSE drops, WebSocket reconnects | Distributed systems failure-mode reasoning | Module 14 |
| Monitoring error rates, building alerting | AI observability: structured logging, online accuracy metrics | Modules 6, 18 |
| Live map real-time rendering architecture | Online inference serving: stateless prediction at scale | Module 11 |
| Pre-rendering common routes (SSG/ISR) | Batch inference + caching: pre-compute for high-frequency inputs | Module 4 |
| Feature flags + canary releases | Model A/B testing + staged rollout — same technique, different artifact | Module 7 |
| End-to-end latency ownership (API to pixel) | System-level performance thinking — hardest to teach, easiest to demonstrate | Module 15.7 |

---

### B.3 The Transition Narrative

This question will come in Round 5 and often as a Round 2 warmup.

| Weak answer | What it signals |
|---|---|
| "I want to learn something new." | Boredom. You'll leave once you've learned it. |
| "AI is the future." | Generic. No engagement with actual AI systems. |
| "I've always been interested in ML." | If true, you'd have ML side projects by now. |

**Strong answer structure:**

> "In my [N] years on [team] at Uber, I've owned the systems that *display* AI predictions — ETAs, surge indicators, map overlays. I've managed the latency, reliability, and UX of what those models produce. Through that, I developed deep curiosity about the systems upstream.
>
> This course and the prototype I built gave me hands-on experience with the full pipeline: classification, session state, real-time inference, evaluation, monitoring. I realized my engineering skills — production reliability, performance thinking, A/B experimentation — transfer directly. The gap was ML vocabulary and patterns, and I've been closing that deliberately over [N] weeks.
>
> I'm applying for this role because [this team] is working on [specific system]. I want to build that system, not just display its output."

**Structure:** specific FE connection → deliberate learning evidence → clear thesis about this role.

---

### B.4 Your Interview Loop — Round by Round

| Round | What They Test | How This Course Prepares You |
|---|---|---|
| Round 1: Coding | Python fluency, AI-adjacent data structures | Appendix C + read `src/pipeline/nodes/*.py` line by line |
| Round 2: LLD | "Design the session store for this agent" | Module 3 (State), Module 4 (Tools), Module 9 (Security) |
| Round 3: HLD / AI System Design | "Design Uber's ETA system" | Module 19 six-step framework + Section 19.7 + Section B.6 |
| Round 4: ML Fundamentals | "Precision vs recall?" "RAG vs fine-tuning?" | Appendix A + Module 16 + Module 18 |
| Round 5: Behavioral | "Why AI?", "Most ambiguous technical decision you made?" | Section B.3 + Module 0 (when agents ARE appropriate) |

**Most important for you: Round 3.** Your FE systems thinking applies directly. You need the AI vocabulary and a practiced 6-step framework. 5+ practice runs before the interview.

**Easiest for you: Round 2 (LLD).** Module 3 gives enough depth on Redis and optimistic locking to handle any component design question. Production experience shows most clearly here — you will outperform ML practitioners who have never debugged a concurrent write race condition.

---

### B.5 The 10-Week Study Plan

*~10 hours/week while working full-time.*

| Week | Focus | Time | End-of-Week Goal |
|---|---|---|---|
| **1** | Appendix A + Appendix B + Track B (Module 17 — your home turf) | ~6h | Confirm you know 30% already. Build confidence. |
| **2** | Track A (Module 16) + Module 0 (Philosophy) | ~5h | AI vocabulary. Know why LLM vs rule-based at each decision. |
| **3** | Module 1 (HLD) + Module 2 (Pipeline) | ~6h | Draw the full pipeline from memory. Map nodes to your FE intuition. |
| **4** | Module 3 (State) + Module 4 (Tools) + Module 5 (Testing) | ~6h | Production depth. LLD interview material. Read actual Python files. |
| **5** | Module 6 (Observability) + Module 7 (A/B) + Module 8 (Production) | ~5h | Your strongest modules. Write down FE analogies in your own words. |
| **6** | Module 14 (Gotchas) + Module 15 (Mental Models) | ~4h | War stories and principles. These are your interview stories. |
| **7** | Module 18 (Evaluation) + Module 19 + Section 19.7 | ~6h | The interview framework. Practice the 6 steps out loud. |
| **8** | 6-step framework applied cold to 3 Uber scenarios: ETA (done), fraud, food recs | ~8h | Build fluency. Framework without practice is useless. |
| **9** | Appendix C (Python) + read `src/pipeline/nodes/*.py` out loud | ~5h | Coding round readiness. |
| **10** | Mock interviews. Write transition narrative out loud. 30-min HLD cold. | ~8h | Simulate the interview, not just study for it. |

> **Week 8 is the most important.** Spend 2+ hours designing each scenario from blank paper before checking any reference answer.

---

### B.6 Five Uber-Domain Scenarios to Practice

**Scenario 1: ETA prediction** — Covered in Section 19.7. Practice from memory: Regression. GBT (5ms inference, tabular input). Two-stage with fallback. Feature Store < 10ms. Pre-compute common zones. RMSE + % within 2 min.

**Scenario 2: Fraud detection**
Classification (binary). Optimize recall — missing fraud costs more. Features: device fingerprint, transaction velocity, location anomaly, time-of-day pattern. Two-stage: rule-based fast checks first (country mismatch, velocity too high → reject without ML) → GBT for ambiguous. P95 < 200ms, synchronous (block transaction). Primary metric: false negative rate, not accuracy.

**Scenario 3: Uber Eats recommendations**
Ranking/Recommendation. Two-tower model: user embedding + restaurant embedding → relevance score. Features: user order history, delivery time, restaurant rating, time-of-day. Cold start: new user → area top-10 + diversity boost; new restaurant → placement boost. Evaluation: NDCG@10, session-to-order conversion. Batch pre-rank top 200 nightly; online re-rank by availability + ETA at request time.

**Scenario 4: Surge pricing prediction**
Regression (supply-demand imbalance 10 min ahead, per zone). Features: current requests/min per zone, driver availability, weather, local events. GBT per geographic zone. P95 < 500ms (shown on map, not blocking booking). Monitoring: driver complaint rate and cancellation rate as implicit miscalibration signals.

**Scenario 5: Driver-rider matching**
Optimization + Ranking (NOT pure ML). Constrained optimization where ML predicts the edge weights. ML part: predict P(driver accepts) and predicted trip duration per (driver, rider) pair. Optimization: Hungarian algorithm on weighted bipartite graph. Key insight to state: greedy (assign nearest driver) is suboptimal system-wide — ML enables globally optimal throughput. P95 < 1s. Fallback: greedy nearest-driver if algorithm times out.

---

## Appendix C — Python Literacy for AI Engineering `[FE BRIDGE]`

> **After this appendix you will be able to:**
> 1. Read any Python AI engineering file and explain every line
> 2. Write Python function signatures and type hints from memory
> 3. Identify the critical difference between Python async/await and JavaScript async/await
> 4. Use TypedDict, Pydantic, and dataclass in the right context
> 5. Prepare for a coding round that involves reading and extending AI pipeline code
>
> ⏱ Estimated time: 45 minutes | Difficulty: ★★☆☆☆ | Prerequisites: Any JS/TS experience

---

### C.1 Python/TypeScript Reference Card

| Concept | Python | TypeScript |
|---|---|---|
| Dict (object) | `{"key": "value"}` | `{key: "value"}` |
| Dict access with default | `d.get("key", default)` | `d?.key ?? default` |
| List comprehension | `[x*2 for x in items if x > 0]` | `items.filter(x=>x>0).map(x=>x*2)` |
| Async function | `async def fn(): await something()` | `async function fn() { await something(); }` |
| Parallel async | `await asyncio.gather(a(), b())` | `await Promise.all([a(), b()])` |
| Type union | `str \| int` or `Optional[str]` | `string \| number` or `string \| undefined` |
| F-string | `f"Hello {name}"` | `` `Hello ${name}` `` |
| None check | `if value is None:` | `if (value === null \|\| value === undefined)` |
| List unpack | `a, b, *rest = my_list` | `const [a, b, ...rest] = myList` |
| Dict spread | `{**base, "key": val}` | `{...base, key: val}` |
| Decorator | `@traceable` | No native equiv — use HOF wrapper |

---

### C.2 TypedDict vs Pydantic vs Dataclass

```python
from typing import TypedDict, Optional

# TypedDict: Use for pipeline state (BotState) — dict-compatible, zero overhead
class BotState(TypedDict):
    session_id: str
    normalized_message: str
    classification: Optional[dict]   # Optional = might be None

# Pydantic: Use for API request/response — validation + auto-generated docs
from pydantic import BaseModel
class QuizRequest(BaseModel):
    module_id: int
    num_questions: int = 3  # Default value

# Dataclass: Use for internal data containers — typed, no framework
from dataclasses import dataclass
@dataclass
class NodeResult:
    success: bool
    data: dict
    latency_ms: float
```

**Rule:** Pipeline state → `TypedDict`. API body → `Pydantic BaseModel`. Internal struct → `@dataclass`.

---

### C.3 async/await — The One Difference That Matters

JavaScript's event loop is always running. Python's must be explicitly started: `asyncio.run(main())`. In FastAPI: the framework manages it.

The practical impact in this codebase:

```python
# Inside LangGraph nodes (sync context) — CANNOT await
queue.put_nowait(sse_frame)    # Non-blocking. Works in sync code.

# Inside FastAPI endpoint (async context) — CAN await
frame = await queue.get()     # Yields control to event loop between frames.
```

This is the bridge pattern in Module 1.4. `put_nowait` is used in sync nodes because they cannot await. `await queue.get()` is used in the async generator because it can.

**Sequential vs concurrent — the latency difference:**

```python
# WRONG: sequential (doubles latency)
properties = await fetch_properties(filters)    # Wait for finish
locality   = await fetch_locality_data(loc)     # THEN start
# Total = sum of both

# RIGHT: concurrent (asyncio.gather = Promise.all)
properties, locality = await asyncio.gather(
    fetch_properties(filters),
    fetch_locality_data(loc)
)
# Total = slowest one, not sum
```

Three sequential 200ms API calls = 600ms. Three concurrent = 200ms. For a P95 < 800ms system, this is the interview.

---

### C.4 Reading This Codebase for Interview Prep

Read these files in order. For each: close the file, write the signatures from memory, compare.

| File | What to Learn | Interview Question |
|---|---|---|
| `src/pipeline/nodes/processing.py` | 5 nodes, ~15 lines each, single responsibility | LLD: "Design a pipeline stage that does X" |
| `src/adapters/classifier.py` | Port/adapter pattern — testable AI system code | LLD: "How do you make this unit-testable?" |
| `src/session/store.py` | Redis + Lua CAS optimistic locking | LLD: "Handle concurrent writes to the same session" |
| `src/pipeline/graph.py` | LangGraph DAG compilation | HLD: "How does your pipeline execute?" |
| `src/api/chat.py` | SSE generator + asyncio.Queue bridge (hardest pattern) | Advanced: async streaming from sync components |

**The readability exercise:** Take any function from `processing.py`. Read it line by line out loud. For each line: (1) what does this do? (2) why does this exist? (3) what breaks if you remove it? This is a coding round whiteboard walk-through. Practice it with code you've already read.

If the interviewer asks you to write Python on a whiteboard: start with function signature and type hints. Demonstrate that you understand what the code does and why. Writing fluency is secondary to design judgment — they expect to improve fluency with you in the role.

---

## Module 23 — LangChain Ecosystem `[AI FOUNDATION]`

> **After this module you will be able to:**
> 1. Explain what LangChain is and is not — and why that distinction matters
> 2. Write LCEL chains using the pipe operator and understand the Runnable protocol
> 3. Choose the right text splitter for documents, code, and semantic content
> 4. Build hybrid retrievers (BM25 + vector) and contextual compression pipelines
> 5. Use output parsers to guarantee structured output from any LLM
>
> ⏱ Estimated time: 75 minutes | Difficulty: ★★★☆☆ | Prerequisites: Module 16

### 23.1 What LangChain Actually Is

LangChain is not a framework in the traditional sense — it is a **composability layer** over LLMs. It provides:

- **LCEL** — a standard interface for chaining components (prompts, models, parsers, retrievers)
- **Integrations** — 200+ connectors to LLM providers, vector DBs, document loaders, tools
- **Abstractions** — `Runnable`, `Retriever`, `Memory`, `OutputParser` — interfaces with many implementations

**What it is not:** LangChain does not host models, doesn't manage state (that's LangGraph), and is not required to build production AI systems — but it dramatically reduces the code needed for common patterns.

```
Without LangChain:
  prompt_text = template.format(context=ctx, question=q)
  raw = openai.chat.completions.create(messages=[{"role":"user","content":prompt_text}])
  parsed = json.loads(raw.choices[0].message.content)

With LCEL:
  chain = prompt | llm | JsonOutputParser()
  parsed = chain.invoke({"context": ctx, "question": q})
```

The LCEL version is 3 lines and is composable — you can swap any component without changing the rest.

### 23.2 LCEL — LangChain Expression Language

LCEL uses the `|` (pipe) operator to compose `Runnable` objects. Every component in LangChain implements `Runnable`, which guarantees a consistent interface:

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_anthropic import ChatAnthropic
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser

# Simple chain: prompt | model | parser
prompt = ChatPromptTemplate.from_template("Classify this text: {text}")
llm = ChatAnthropic(model="claude-haiku-4-5-20251001")
chain = prompt | llm | StrOutputParser()

result = chain.invoke({"text": "I want a 2BHK in Bandra"})

# Parallel execution (runs both branches concurrently)
from langchain_core.runnables import RunnableParallel

parallel = RunnableParallel(
    intent=intent_chain,
    sentiment=sentiment_chain,
)
# Both chains execute in parallel — same as asyncio.gather
result = parallel.invoke({"text": user_input})
# result = {"intent": "property_search", "sentiment": "neutral"}
```

**The Runnable contract** — every component supports:
- `.invoke(input)` — sync single call
- `.ainvoke(input)` — async single call
- `.batch([inputs])` — parallel across multiple inputs
- `.stream(input)` — streaming output
- `.astream(input)` — async streaming

**Why this matters in interviews:** LCEL is the standard for LangChain production code post-2023. If you write `chain = LLMChain(...)` in an interview, it signals unfamiliarity with current LangChain.

### 23.3 Memory & Conversation History

LangChain provides several memory implementations. Understanding when each breaks is more important than knowing they exist.

| Memory type | How it works | Context window used | When it breaks |
|---|---|---|---|
| `ConversationBufferMemory` | Stores entire conversation verbatim | Grows unboundedly | At ~20+ turns, overflows 8K context; costs explode |
| `ConversationBufferWindowMemory(k=5)` | Keeps last k turns | Fixed: k × avg_turn_size | Loses context from turn 1 when k exceeded |
| `ConversationSummaryMemory` | Summarizes past turns with an LLM call | Small (summary only) | Summary introduces hallucination; extra LLM cost per turn |
| `ConversationSummaryBufferMemory` | Summary for old turns, verbatim for recent | Hybrid | Most robust; complexity to tune the threshold |

**This codebase's approach:** `session_store.py` stores `turn_history` in Redis as raw messages (equivalent to `BufferWindowMemory` with a TTL cutoff). This is production-correct: explicit control over what enters the LLM context.

```python
# What the housing.com pipeline does (manually, without LangChain memory):
turn_history = await session_store.load(session_id)   # last N turns from Redis
prompt = build_prompt(turn_history, current_message)  # inject into system prompt
# LangChain ConversationBufferMemory does the same thing, just with more abstraction
```

### 23.4 Document Loaders

Document loaders convert external data into LangChain `Document` objects (text + metadata). Use these at the ingestion stage of a RAG pipeline.

```python
from langchain_community.document_loaders import (
    PyPDFLoader,           # PDF files — page-by-page
    WebBaseLoader,         # Web pages — strips HTML
    NotionDirectoryLoader, # Notion export directory
    GitLoader,             # Git repo — commits and diffs
    CSVLoader,             # CSV rows as documents
)

# PDF: each page becomes a Document with metadata {"page": N}
loader = PyPDFLoader("product_manual.pdf")
docs = loader.load()  # List[Document]

# Web: strips HTML, returns page content as single Document
loader = WebBaseLoader("https://docs.example.com/api")
docs = loader.load()
```

**Production note:** Always check `doc.metadata` after loading — it contains source, page number, or URL. Include metadata as a filter in your vector DB for scoped retrieval (e.g., retrieve only from the current tenant's documents).

### 23.5 Text Splitters — Deep Dive

The splitter choice determines RAG quality more than almost any other parameter.

```python
from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
    MarkdownHeaderTextSplitter,
    HTMLHeaderTextSplitter,
    Language,
    RecursiveCharacterTextSplitter as CodeSplitter,
)
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai import OpenAIEmbeddings
```

| Splitter | Best for | How it splits | Key parameters |
|---|---|---|---|
| `RecursiveCharacterTextSplitter` | General prose, unknown format | Recursively tries `\n\n`, `\n`, ` `, char | `chunk_size=512`, `chunk_overlap=50` |
| `MarkdownHeaderTextSplitter` | Markdown docs, wikis | By heading level (H1, H2, H3) | `headers_to_split_on` |
| `HTMLHeaderTextSplitter` | Web pages, HTML docs | By HTML header tags | `headers_to_split_on` |
| `RecursiveCharacterTextSplitter.from_language(Language.PYTHON)` | Python code | By class, function, then line | `language=Language.PYTHON\|JS\|TS\|...` |
| `SemanticChunker` | Dense paragraphs where topic shifts within sections | Embedding similarity between sentences | `embeddings`, `breakpoint_threshold_type` |
| `TokenTextSplitter` | When you need exact token counts | By token (uses tiktoken) | `chunk_size=256` (tokens, not chars) |

```python
# Most common: RecursiveCharacterTextSplitter
splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,        # characters (not tokens — divide by ~4 for tokens)
    chunk_overlap=50,      # 10% overlap preserves sentence continuity
    separators=["\n\n", "\n", ". ", " ", ""],  # tries each in order
)
chunks = splitter.split_documents(docs)

# Code: language-aware splitting (splits by function/class boundaries first)
code_splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.PYTHON,
    chunk_size=1000,
    chunk_overlap=100,
)

# Semantic: splits where topic actually changes
semantic_splitter = SemanticChunker(
    embeddings=OpenAIEmbeddings(),
    breakpoint_threshold_type="percentile",  # split where similarity drops below 95th pct
)
```

**Decision rule:** Default to `RecursiveCharacterTextSplitter`. Switch to `MarkdownHeaderTextSplitter` when document structure matters (each section should stay together). Use `SemanticChunker` when you have dense, topic-shifting prose and context relevance scores are low. Use code splitter for code repositories.

### 23.6 Retrievers

```python
from langchain.retrievers import (
    ContextualCompressionRetriever,
    MultiQueryRetriever,
    EnsembleRetriever,
    ParentDocumentRetriever,
)
from langchain.retrievers.document_compressors import LLMChainExtractor
from langchain_community.retrievers import BM25Retriever

# Base: vector similarity
vector_retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

# Hybrid: BM25 (keyword) + vector (semantic) — best of both worlds
bm25_retriever = BM25Retriever.from_documents(docs)
bm25_retriever.k = 5
hybrid = EnsembleRetriever(
    retrievers=[bm25_retriever, vector_retriever],
    weights=[0.4, 0.6],   # weight semantic higher for most use cases
)

# Multi-query: LLM generates 3 variations of the query, runs all, deduplicates
multi_query = MultiQueryRetriever.from_llm(
    retriever=vector_retriever,
    llm=llm,
)
# Helps when user query is ambiguous or uses different vocabulary than documents

# Contextual compression: retrieves k chunks, then LLM extracts only relevant sentences
compressor = LLMChainExtractor.from_llm(llm)
compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=vector_retriever,
)
# More expensive (extra LLM call per retrieval) but dramatically improves context relevance
```

**Production choice:** Use hybrid (`EnsembleRetriever`) by default — it catches both exact-keyword matches and semantic matches. Add contextual compression if RAGAS context relevance is below 0.7.

### 23.7 Output Parsers

Output parsers guarantee structured output from LLM responses.

```python
from langchain_core.output_parsers import (
    JsonOutputParser,
    StrOutputParser,
    PydanticOutputParser,
)
from pydantic import BaseModel

class PropertyIntent(BaseModel):
    intent: str
    city: str | None
    bhk: int | None
    max_price_cr: float | None

# Pydantic parser: validates + parses, raises on invalid schema
parser = PydanticOutputParser(pydantic_object=PropertyIntent)
prompt = ChatPromptTemplate.from_messages([
    ("system", "Extract property search intent.\n{format_instructions}"),
    ("user", "{query}"),
]).partial(format_instructions=parser.get_format_instructions())

chain = prompt | llm | parser
result: PropertyIntent = chain.invoke({"query": "2BHK in Bandra under 2Cr"})
# result.city == "Bandra", result.bhk == 2, result.max_price_cr == 2.0
```

**This codebase's approach:** The classifier uses a custom prompt with explicit JSON schema rather than LangChain output parsers, because the SLM is trained to output JSON directly. For larger models (Sonnet, GPT-4), `PydanticOutputParser` is cleaner.

### 23.8 Callbacks — Observability Without LangSmith

```python
from langchain.callbacks import StdOutCallbackHandler
from langchain.callbacks.base import BaseCallbackHandler

class CostTrackingCallback(BaseCallbackHandler):
    def __init__(self):
        self.total_tokens = 0

    def on_llm_end(self, response, **kwargs):
        usage = response.llm_output.get("token_usage", {})
        self.total_tokens += usage.get("total_tokens", 0)

    def on_chain_error(self, error, **kwargs):
        log.error("chain_error", error=str(error))

tracker = CostTrackingCallback()
chain.invoke({"query": "..."}, config={"callbacks": [tracker]})
print(f"Tokens used: {tracker.total_tokens}")
```

Callbacks fire at: chain start/end, LLM start/end, tool start/end, retriever start/end. Use them for cost tracking, custom logging, and error alerting when LangSmith is not available.

> 🎯 **MAANG Interview Connection:** "How does your RAG pipeline handle different document types?"
> Lead with the splitter decision tree: format-aware splitter (Markdown/HTML headers) for structured docs, recursive character for general prose, code splitter for repositories. Then mention chunking tuning via RAGAS context relevance as the feedback signal.

---

## Module 24 — LangGraph Deep Dive `[AI FOUNDATION]`

> **After this module you will be able to:**
> 1. Explain why LangGraph exists and what chains cannot do that graphs can
> 2. Define a StateGraph with TypedDict state, nodes, conditional edges, and compile it
> 3. Add checkpointing for multi-turn persistence and implement human-in-the-loop interrupts
> 4. Compose subgraphs and stream events from a running graph
> 5. Map every concept to this codebase's `graph.py`
>
> ⏱ Estimated time: 80 minutes | Difficulty: ★★★★☆ | Prerequisites: Module 1, Module 23

### 24.1 Why LangGraph Exists — What Chains Cannot Do

LangChain chains are **acyclic** — data flows one direction, top to bottom. This is sufficient for a single Q&A call but breaks for agents that need to:

- Loop until a condition is met ("keep searching until we find a matching property")
- Route conditionally at runtime ("if low confidence → ask for clarification, else → respond")
- Persist state across multiple turns without external storage scaffolding
- Pause for human approval before executing a destructive action

```
LangChain chain:           LangGraph graph:
A → B → C → D             A → B → C
(fixed path)                    ↓   ↑
                               D ←─┘  (loop until done)
                                ↓
                           conditional:
                           low_conf → E (clarify)
                           high_conf → F (respond)
```

LangGraph is **LangChain for stateful, cyclic, conditional workflows**. It is the right tool whenever your pipeline has branching logic, loops, or human checkpoints.

### 24.2 State, Nodes, and Edges

```python
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

# State: the shared data structure flowing through every node
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]  # append-only via reducer
    session_id: str
    classification: dict | None
    needs_clarification: bool

# Nodes: pure functions that receive state and return partial state updates
def classify_node(state: AgentState) -> dict:
    last_message = state["messages"][-1].content
    result = classifier.classify(last_message)
    return {
        "classification": result,
        "needs_clarification": result["confidence"] < 0.6,
    }

def respond_node(state: AgentState) -> dict:
    response = llm.invoke(build_prompt(state))
    return {"messages": [response]}   # add_messages reducer appends this

def clarify_node(state: AgentState) -> dict:
    return {"messages": [AIMessage(content="Could you clarify what you're looking for?")]}

# Router: decides which node to run next
def route_after_classify(state: AgentState) -> str:
    if state["needs_clarification"]:
        return "clarify"
    return "respond"

# Build graph
graph = StateGraph(AgentState)
graph.add_node("classify", classify_node)
graph.add_node("respond", respond_node)
graph.add_node("clarify", clarify_node)

graph.set_entry_point("classify")
graph.add_conditional_edges(
    "classify",
    route_after_classify,
    {"clarify": "clarify", "respond": "respond"},
)
graph.add_edge("respond", END)
graph.add_edge("clarify", END)

app = graph.compile()
```

**The `add_messages` reducer** is a special LangGraph annotation that *appends* to the list rather than replacing it. Without it, returning `{"messages": [new_msg]}` would replace the entire history. This is the most common LangGraph gotcha.

### 24.3 Cycles and Loops

Loops are how LangGraph enables agentic behavior — a node can route back to an earlier node.

```python
def should_continue(state: AgentState) -> str:
    """Router: keep searching or return results."""
    if len(state["results"]) < 3 and state["search_attempts"] < 5:
        return "search_again"  # loop back
    return "respond"           # exit loop

graph.add_conditional_edges("evaluate_results", should_continue, {
    "search_again": "search",   # creates a cycle
    "respond": "respond",
})
```

**Infinite loop prevention:** Always add a counter in state (`search_attempts: int`) and include a hard limit in the router. Without this, a consistently poor retriever will loop forever.

```python
# Safe loop pattern
def route(state) -> str:
    if state["attempts"] >= MAX_ATTEMPTS:
        return "fallback"   # always provide an exit
    if needs_more_search(state):
        return "search"
    return "respond"
```

### 24.4 Checkpointing — Multi-Turn Persistence

Checkpointing saves the full graph state after each node execution, enabling:
- Resume after failure
- Multi-turn conversation continuity
- Time-travel debugging (replay from any checkpoint)

```python
from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.sqlite import SqliteSaver

# Development: in-memory (lost on restart)
memory = MemorySaver()
app = graph.compile(checkpointer=memory)

# Production: SQLite (persistent across restarts)
with SqliteSaver.from_conn_string("checkpoints.db") as checkpointer:
    app = graph.compile(checkpointer=checkpointer)

# Invoke with a thread_id — each conversation is a separate thread
config = {"configurable": {"thread_id": "user_123_session_456"}}
result = app.invoke({"messages": [HumanMessage(content="2BHK in Bandra")]}, config=config)

# Next turn: same thread_id — LangGraph loads the full prior state automatically
result2 = app.invoke({"messages": [HumanMessage(content="Under 2Cr")]}, config=config)
# state["messages"] now has both turns + all AI responses
```

**This codebase vs LangGraph checkpointing:** `session_store.py` + Redis is a hand-rolled equivalent of LangGraph checkpointing. The custom implementation gives more control (per-field expiry, Lua CAS) but requires more maintenance. For new projects, LangGraph checkpointing with PostgreSQL (`langgraph-checkpoint-postgres`) is the cleaner path.

### 24.5 Human-in-the-Loop (HITL)

HITL allows the graph to pause, wait for human input, and resume — essential for autonomous agents with irreversible actions.

```python
from langgraph.graph import interrupt_before

# Compile with interrupt: pause BEFORE executing "execute_action"
app = graph.compile(
    checkpointer=memory,
    interrupt_before=["execute_action"],   # pause before this node
)

# First invoke: runs until the interrupt
result = app.invoke(input, config=config)
# Graph paused — "execute_action" has NOT run yet

# Human reviews the proposed action from state
pending_state = app.get_state(config)
proposed = pending_state.values["proposed_action"]
human_approval = get_human_decision(proposed)   # your UI/webhook

# Resume: pass None (no new input needed) to continue
if human_approval == "approved":
    app.invoke(None, config=config)    # resumes from checkpoint
else:
    app.invoke({"override": "rejected"}, config=config)
```

**When to use HITL:**
- Before deleting or modifying records
- Before sending external communications
- Before committing financial transactions
- Before actions with side effects that can't be undone

### 24.6 Subgraphs — Composing Pipelines

Subgraphs let you compose independent graphs into a larger one. Each subgraph has its own state and can be developed/tested independently.

```python
# Subgraph: property search specialist
search_graph = StateGraph(SearchState)
# ... add nodes, edges ...
search_app = search_graph.compile()

# Parent graph treats the subgraph as a node
def search_subgraph_node(state: AgentState) -> dict:
    search_result = search_app.invoke({
        "query": state["messages"][-1].content,
        "filters": state["classification"],
    })
    return {"search_results": search_result["results"]}

parent_graph.add_node("search", search_subgraph_node)
```

**Real use case:** A multi-agent system where each agent is a compiled subgraph. The supervisor routes between them. Module 34 covers this pattern in depth.

### 24.7 Streaming

```python
# Stream individual node events (see which node is running + its output)
async for event in app.astream(input, config=config):
    node_name = list(event.keys())[0]   # which node just ran
    node_output = event[node_name]       # partial state update from that node
    print(f"Node '{node_name}' completed: {node_output}")

# Stream LLM tokens as they generate (stream_mode="messages")
async for event in app.astream(input, config=config, stream_mode="messages"):
    if hasattr(event[0], "content"):
        print(event[0].content, end="", flush=True)  # token-by-token
```

**This codebase's streaming:** `pipeline_task` calls `app.ainvoke()` and nodes call `queue.put_nowait(frame)` to push SSE events. The LangGraph `.astream()` approach is an alternative — you'd consume node events directly from the stream rather than via the queue bridge. Both work; the queue bridge is more framework-agnostic.

### 24.8 This Codebase Mapped to LangGraph Concepts

| LangGraph concept | This codebase equivalent | File |
|---|---|---|
| `StateGraph` | `build_graph()` returning compiled graph | `src/pipeline/graph.py` |
| `TypedDict` state | `BotState` | `src/pipeline/state.py` |
| Node function | Each `*_node` function (safety, classify, fetch_data, ...) | `src/pipeline/nodes/*.py` |
| Conditional edge | `route_by_tier()` + `add_conditional_edges()` | `src/pipeline/graph.py` |
| Checkpointing | Redis session store + `session_store.py` | `src/session/store.py` |
| Streaming via `.astream()` | `asyncio.Queue` + `queue.put_nowait(frame)` | `src/pipeline/nodes/response.py` |
| HITL interrupt | Not implemented — Housing.com doesn't need approval flows | n/a |

> 🎯 **MAANG Interview Connection:** "Why did you use LangGraph instead of just calling the LLM directly?"
> Lead with the problem: the pipeline has 19 nodes, conditional routing (tier system), and stateful multi-turn context. A direct chain would be a 400-line `if/elif` tree. LangGraph gives typed state, visual debuggability (LangSmith traces show the graph), and clean conditional routing. Then mention the tradeoff: LangGraph adds ~50ms overhead on graph compilation (done once at startup) and introduces a framework dependency.

---

## Module 25 — LangSmith Platform `[AI FOUNDATION]`

> **After this module you will be able to:**
> 1. Navigate LangSmith traces and identify which LLM call or node caused a failure
> 2. Build a golden dataset from production traces using the annotation queue
> 3. Run prompt experiments comparing two variants with statistical validity
> 4. Set up online monitoring rules that alert before users notice quality drops
> 5. Choose between `@traceable` decorator, LangChain auto-tracing, and manual SDK calls
>
> ⏱ Estimated time: 60 minutes | Difficulty: ★★★☆☆ | Prerequisites: Module 6, Module 18

### 25.1 What LangSmith Provides

LangSmith is Anthropic-agnostic observability and evaluation infrastructure for LLM applications. It has four distinct capabilities — most teams use only tracing and miss the rest:

| Capability | What it does | When you need it |
|---|---|---|
| **Traces** | Records every LLM call, tool call, and chain step with inputs/outputs/latency/cost | Always — this is your debugging interface |
| **Datasets** | Stores (input, expected_output) pairs for repeatable evaluation | Once you have 20+ production examples |
| **Experiments** | Runs your chain against a dataset, compares variants side-by-side | Before every prompt or model change |
| **Online monitoring** | Samples production traces, runs evaluators, triggers alerts | When you're serving real users |

### 25.2 Tracing Deep Dive

Every trace is a tree of spans. Understanding the tree structure is the key to debugging.

```
Trace: "2BHK in Bandra under 2Cr"  (1,247ms, $0.0024)
│
├── safety_node                      (2ms)
├── normalize_node                   (8ms)
├── classify_node                    (187ms)   ← LLM call
│   ├── [ChatAnthropic] haiku         (180ms)
│   │   ├── input: {messages: [...]}
│   │   ├── output: {intent: "property_search", confidence: 0.94}
│   │   └── usage: {input_tokens: 412, output_tokens: 28, cost: $0.00008}
│   └── [tool] taxonomy_lookup        (7ms)
├── fetch_data_node                   (340ms)  ← DB call
│   └── [tool] searchProperties       (335ms)
└── response_node                     (710ms)  ← LLM call
    └── [ChatAnthropic] haiku         (705ms)
        └── usage: {input_tokens: 1840, output_tokens: 156, cost: $0.00089}
```

**Trace metadata you should always set:**

```python
from langsmith import traceable

@traceable(
    name="classify_node",
    tags=["production", "v2.3"],
    metadata={
        "session_id": state["session_id"],
        "tenant_id": state.get("tenant_id"),
        "model": "claude-haiku-4-5-20251001",
    }
)
async def classify_node(state: BotState) -> dict:
    ...
```

Tags enable filtering ("show me all v2.3 traces"), metadata enables correlation with your own logs (`session_id`). Without these, debugging production failures requires cross-referencing multiple systems.

### 25.3 Datasets and Annotation Queues

A LangSmith dataset is a collection of `(input, expected_output)` pairs used as the benchmark for experiments.

**Building a dataset from production traces:**

```python
from langsmith import Client

client = Client()

# Create dataset
dataset = client.create_dataset(
    "property-intent-classification-v1",
    description="Intent classification golden examples"
)

# Add examples: input is what went into the LLM, output is what it should produce
client.create_examples(
    inputs=[
        {"normalized_message": "2BHK in Bandra under 2Cr"},
        {"normalized_message": "contact the builder for that flat"},
        {"normalized_message": "what's the EMI for 1.5Cr at 8.5%"},
    ],
    outputs=[
        {"intent": "property_search",  "confidence": 1.0},
        {"intent": "contact_seller",   "confidence": 1.0},
        {"intent": "emi_calculator",   "confidence": 1.0},
    ],
    dataset_id=dataset.id,
)
```

**Annotation queue** — the production workflow for building datasets without manual tagging:

1. Low-confidence predictions (`confidence < 0.70`) are sent to the annotation queue automatically
2. Annotators review and correct the label in the LangSmith UI
3. Approved examples flow directly into the dataset
4. CI experiments run against the expanded dataset on next deploy

This is the evaluation flywheel from Module 18.5, now with tooling.

### 25.4 Evaluators — Automated Quality Gates

```python
from langsmith.evaluation import evaluate, LangChainStringEvaluator

# Built-in evaluator: LLM-as-judge for correctness
correctness_evaluator = LangChainStringEvaluator(
    "labeled_criteria",
    config={
        "criteria": "correctness",
        "llm": ChatAnthropic(model="claude-sonnet-4-6"),
    }
)

# Custom evaluator: exact match for classification
def intent_match_evaluator(run, example):
    predicted = run.outputs.get("intent")
    expected = example.outputs.get("intent")
    return {"key": "intent_match", "score": 1 if predicted == expected else 0}

results = evaluate(
    lambda inputs: classify_chain.invoke(inputs),
    data="property-intent-classification-v1",
    evaluators=[correctness_evaluator, intent_match_evaluator],
    experiment_prefix="haiku-v2.3",
)
print(results.aggregate_feedback)
# {"intent_match": 0.94, "correctness": 4.2}
```

**CI gate:** Run this in the nightly pipeline. Block deploy if `intent_match < 0.90`.

### 25.5 Experiments — Comparing Variants

Experiments let you run A/B prompt comparisons on the same dataset and see side-by-side results.

```python
# Run the same dataset through two prompt versions
results_v1 = evaluate(lambda x: chain_v1.invoke(x), data=dataset_name, experiment_prefix="v1")
results_v2 = evaluate(lambda x: chain_v2.invoke(x), data=dataset_name, experiment_prefix="v2")

# LangSmith UI shows: v1 vs v2 side by side, per-example diff, aggregate scores
# Statistical significance: LangSmith computes confidence intervals on aggregate scores
```

**Before running an experiment:**
- Define the primary metric *before* looking at results (avoids p-hacking)
- Minimum dataset size: 50 examples for ±5% accuracy confidence
- Run the baseline first — you need a number to compare against

### 25.6 Online Monitoring

Online monitoring samples production traces and runs evaluators asynchronously — users see zero latency impact.

```python
# Configure in LangSmith UI or via API:
# Rule: sample 10% of production traces
# Evaluator: LLM-as-judge for faithfulness
# Alert: if rolling 1h avg_faithfulness < 3.5, trigger PagerDuty

# In code: tag traces to make them sampable
@traceable(tags=["production"], project_name="housing-chatbot-prod")
async def pipeline_handler(message: str, session_id: str):
    ...
```

**What to monitor in production:**
- Faithfulness score (rolling 1-hour average)
- `flag_for_review` rate — spike means prompt regression or data distribution shift
- Latency by node — sudden increase in `classify_node` latency signals model provider issue
- Token usage per turn — sudden increase means prompt bloat

### 25.7 `@traceable` vs Auto-Tracing vs Manual SDK

| Approach | When to use | Overhead |
|---|---|---|
| `@traceable` decorator | Custom functions outside LangChain — your own nodes, tools, DB calls | Minimal (~2ms) |
| LangChain auto-tracing | Any LangChain/LangGraph chain — set `LANGCHAIN_TRACING_V2=true` | Zero code changes |
| Manual `Client().create_run()` | When you need full control over span structure or are not using Python | Medium (more code) |

**This codebase uses:** `@traceable` on `classify_node`, `tool_call`, and key pipeline nodes (see `src/pipeline/nodes/*.py`). `LANGCHAIN_TRACING_V2=true` traces the LangGraph graph automatically. Together they give complete coverage.

> 🎯 **MAANG Interview Connection:** "How do you know when your LLM system's quality degrades in production?"
> Online monitoring via LangSmith: sample 10% of traffic, run LLM-as-judge async, alert on rolling-average faithfulness drop. Then explain the annotation queue as the feedback loop: flagged traces → human review → dataset expansion → CI experiment → deploy. This closes the loop without manual intervention.

---

## Module 26 — Vector Databases `[AI FOUNDATION]`

> **After this module you will be able to:**
> 1. Explain how vector search works — embedding space, cosine similarity, ANN algorithms
> 2. Choose between ChromaDB, Pinecone, pgvector, Weaviate, and Qdrant for a given use case
> 3. Configure a Pinecone index with namespaces, metadata filters, and sparse-dense hybrid search
> 4. Set up pgvector in an existing PostgreSQL database with the right index type
> 5. Select an embedding model based on dimension, cost, and domain
>
> ⏱ Estimated time: 70 minutes | Difficulty: ★★★☆☆ | Prerequisites: Module 16.8, Module 23

### 26.1 How Vector Search Works

Text is converted to a dense vector (embedding) by a neural model. Semantically similar text lands close together in this high-dimensional space. Vector search finds the nearest neighbours to the query embedding.

```
"2BHK in Bandra"  → embed → [0.12, -0.87, 0.44, ..., 0.31]  (1536 dimensions)
"2 bedroom flat, Bandra West" → embed → [0.11, -0.85, 0.46, ..., 0.29]
"3BHK in Juhu"    → embed → [0.08, -0.42, 0.61, ..., 0.17]

Cosine similarity("2BHK Bandra", "2 bedroom flat Bandra West") = 0.97  ← near
Cosine similarity("2BHK Bandra", "3BHK Juhu")                 = 0.71  ← far
```

**Why not exact search?** 1536 dimensions × 1M documents = 6GB of vectors. Exact nearest neighbour over 1M vectors takes seconds. **ANN (Approximate Nearest Neighbour)** algorithms trade a small accuracy loss for 1,000× speed:

| Algorithm | How it works | Used in |
|---|---|---|
| **HNSW** (Hierarchical Navigable Small World) | Graph of nodes; navigate to nearest neighbours in logarithmic time | pgvector, Weaviate, Qdrant |
| **IVF** (Inverted File Index) | Clusters vectors; search only the nearest cluster | pgvector (ivfflat), Pinecone |
| **ScaNN** | Google's product quantisation + tree structure | Vertex AI Vector Search |

**HNSW vs IVF:** HNSW has better recall at query time but higher memory usage. IVF requires a training step (cluster centroids) but is more memory-efficient for large datasets. Default: HNSW unless you're at 100M+ vectors.

### 26.2 ChromaDB — Local and Lightweight

ChromaDB is the easiest vector DB to get started with — zero infrastructure, runs in-process.

```python
import chromadb
from chromadb.utils import embedding_functions

# In-memory (dev/test)
client = chromadb.Client()

# Persistent (local files, survives restarts)
client = chromadb.PersistentClient(path="./chroma_db")

# Cloud (managed, production)
client = chromadb.HttpClient(host="your-chroma-server.com", port=8000)

# Create collection with embedding function
ef = embedding_functions.OpenAIEmbeddingFunction(
    api_key="sk-...",
    model_name="text-embedding-3-small"
)
collection = client.create_collection("property_docs", embedding_function=ef)

# Add documents
collection.add(
    documents=["3BHK in Bandra West, ₹2.5Cr, sea-facing"],
    metadatas=[{"city": "Mumbai", "bhk": 3, "locality": "Bandra"}],
    ids=["prop_001"]
)

# Query with metadata filter
results = collection.query(
    query_texts=["sea-facing apartment Mumbai"],
    n_results=5,
    where={"city": "Mumbai"},            # metadata filter
    where_document={"$contains": "Bandra"}  # full-text filter
)
```

**When to use ChromaDB:** Local development and testing, prototypes, teams that don't want to manage infrastructure. Not recommended for > 1M documents or multi-tenant production.

### 26.3 Pinecone — Managed, Production-Scale

Pinecone is a fully managed vector database with zero operational overhead. You pay for storage and queries.

```python
from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key="...")

# Create index
pc.create_index(
    name="property-docs",
    dimension=1536,        # must match your embedding model
    metric="cosine",
    spec=ServerlessSpec(cloud="aws", region="us-east-1"),
)
index = pc.Index("property-docs")

# Upsert vectors (use batches of 100 for efficiency)
vectors = [
    {
        "id": "prop_001",
        "values": embed("3BHK in Bandra West, ₹2.5Cr"),
        "metadata": {"city": "Mumbai", "bhk": 3, "price_cr": 2.5, "tenant_id": "housing_com"},
    }
]
index.upsert(vectors=vectors, namespace="housing_com")  # namespace = tenant isolation

# Query with metadata filter
results = index.query(
    vector=embed("sea-facing flat in Mumbai"),
    top_k=5,
    namespace="housing_com",
    filter={"city": {"$eq": "Mumbai"}, "bhk": {"$gte": 2}},
    include_metadata=True,
)

# Sparse-dense hybrid search (combines keyword + semantic)
results = index.query(
    vector=dense_vector,
    sparse_vector={"indices": [101, 305], "values": [0.8, 0.3]},  # BM25 sparse
    top_k=5,
    alpha=0.7,   # weight: 0.7 dense + 0.3 sparse
)
```

**Serverless vs pod-based:** Serverless scales to zero cost when idle (good for dev/staging). Pod-based gives predictable latency at high QPS (good for production at scale). Start serverless, migrate when p95 query latency matters.

**Namespaces:** Each namespace is an isolated partition within an index. Use `tenant_id` as namespace for multi-tenant applications — no cross-tenant leakage possible.

### 26.4 pgvector — Vector Search in Your Existing PostgreSQL

pgvector adds a `vector` column type and approximate nearest neighbour indexes to PostgreSQL. If you already run Postgres, this is often the lowest-complexity option.

```sql
-- Install extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table with vector column
CREATE TABLE property_embeddings (
    id          TEXT PRIMARY KEY,
    content     TEXT,
    metadata    JSONB,
    embedding   vector(1536)     -- dimension must match embedding model
);

-- Create HNSW index (better recall, more memory)
CREATE INDEX ON property_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- OR: IVFFlat (less memory, requires VACUUM after bulk inserts)
CREATE INDEX ON property_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);   -- sqrt(row_count) is the rule of thumb

-- Similarity search
SELECT content, metadata,
       1 - (embedding <=> query_vec) AS similarity
FROM property_embeddings
WHERE metadata->>'city' = 'Mumbai'      -- standard SQL filter
ORDER BY embedding <=> $1               -- ANN operator
LIMIT 5;
```

```python
# With LangChain
from langchain_postgres import PGVector

vectorstore = PGVector(
    embeddings=OpenAIEmbeddings(),
    collection_name="property_docs",
    connection="postgresql+psycopg://user:pass@localhost/dbname",
)
vectorstore.add_documents(docs)
results = vectorstore.similarity_search("sea-facing Mumbai", k=5)
```

**HNSW vs IVFFlat for pgvector:**
- HNSW: better recall (0.95+), no training needed, higher memory (~4× the vector size)
- IVFFlat: lower memory, requires `VACUUM ANALYZE` after bulk inserts to update centroid stats
- Default: HNSW unless you're > 10M vectors and RAM is constrained

### 26.5 Weaviate and Qdrant — When to Consider Them

| | Weaviate | Qdrant |
|---|---|---|
| **Differentiator** | GraphQL API, native multi-tenancy, auto-vectorization via modules | Payload filtering is a first-class feature, strong Rust performance |
| **Multi-tenancy** | Built-in tenant isolation — each tenant has own shard | Multi-vector support (store multiple embeddings per object) |
| **Self-hosted** | Kubernetes-native, Helm chart available | Single binary, very easy to self-host |
| **Managed cloud** | Weaviate Cloud | Qdrant Cloud |
| **When to choose** | Enterprise multi-tenant SaaS with complex graph relationships | When you have multiple embedding models per document (e.g., text + image) |

For most use cases, ChromaDB (dev) → Pinecone or pgvector (production) is sufficient. Weaviate and Qdrant become relevant at enterprise scale or with specific multi-modal requirements.

### 26.6 Decision Framework

```
What's your context?
│
├── Local development / prototyping
│   └── ChromaDB (zero infra, in-process)
│
├── Already running PostgreSQL?
│   └── pgvector (no new infra, SQL filters, familiar ops)
│       Caveat: HNSW index creation locks table for large datasets — use pg_partman
│
├── Fully managed, no ops overhead?
│   └── Pinecone serverless
│       Caveat: cold start on serverless (~200ms first query after idle)
│
├── Multi-tenant SaaS with strict isolation?
│   ├── Pinecone namespaces (simplest)
│   └── Weaviate multi-tenancy (for complex enterprise needs)
│
└── Multi-modal (text + images + audio vectors)?
    └── Qdrant (multi-vector support per document)
```

### 26.7 Embedding Models — Choosing the Right One

The embedding model determines retrieval quality more than the vector DB choice.

| Model | Provider | Dimensions | Cost per 1M tokens | Best for |
|---|---|---|---|---|
| `text-embedding-3-small` | OpenAI | 1536 (configurable) | $0.02 | General purpose, good default |
| `text-embedding-3-large` | OpenAI | 3072 | $0.13 | Higher accuracy where cost allows |
| `embed-english-v3.0` | Cohere | 1024 | $0.10 | English-only, strong reranking support |
| `embed-multilingual-v3.0` | Cohere | 1024 | $0.10 | Multilingual content |
| `BAAI/bge-large-en-v1.5` | HuggingFace (self-hosted) | 1024 | Free (compute only) | High-recall retrieval, open source |
| `BAAI/bge-m3` | HuggingFace | 1024 | Free | Multi-lingual, sparse+dense combined |

**Dimension tradeoff:** Higher dimensions = better discrimination = more storage and slower queries. `text-embedding-3-small` with 1536 dimensions is the best cost/quality default for most use cases. Reduce dimensions (Matryoshka embeddings) if storage cost is a concern.

**Self-hosted vs API:** API is simpler but adds ~50ms network latency per embedding call. Self-hosted (BGE via HuggingFace) eliminates latency and per-call cost but requires GPU infra and model versioning.

> 🎯 **MAANG Interview Connection:** "Which vector database would you choose and why?"
> This is a system design question. Lead with the decision framework: existing Postgres → pgvector; fully managed, new project → Pinecone serverless; enterprise multi-tenant SaaS → Pinecone namespaces or Weaviate. Then add: the embedding model choice matters more than the DB choice — start with `text-embedding-3-small` and tune chunk size via RAGAS context relevance before switching embedding models.

---

## Module 27 — RAG Pipeline Architectures `[AI FOUNDATION]`

> **After this module you will be able to:**
> 1. Describe the failure modes of Naive RAG and explain what Advanced RAG fixes
> 2. Implement query expansion and HyDE for pre-retrieval enhancement
> 3. Choose between Modular, Graph, Self, and Agentic RAG for a given use case
> 4. Apply the decision tree: data size, freshness, relationship density, query complexity
>
> ⏱ Estimated time: 75 minutes | Difficulty: ★★★★☆ | Prerequisites: Modules 16.8, 23, 26

### 27.1 Naive RAG — The Baseline and Its Failure Modes

Naive RAG is the simplest pipeline: chunk documents once, embed them, store in a vector DB, query at runtime, stuff top-k results into the prompt.

```
Document corpus
    ↓ chunk (fixed size)
    ↓ embed
Vector DB
    ↑ query_embedding = embed(user_query)
    ↑ top-k cosine similarity
Stuff retrieved chunks into system prompt
    ↓
LLM generates response
```

**Why it works well:** Simple, fast to build, sufficient for small, well-structured corpora with clear queries.

**Why it fails in production:**

| Failure mode | Symptom | Root cause |
|---|---|---|
| Vocabulary mismatch | Correct document not retrieved | "API throttling" in query vs "rate limiting" in document |
| Lost-in-the-middle | Correct document retrieved, answer missed | Answer buried at chunk position 4 of 8 |
| Semantic dilution | Top-k chunks are topically similar but miss the point | Query too vague; vector similarity ≠ relevance |
| Multi-hop failure | Partial answer — second fact never retrieved | Two separate documents needed; top-k returns both or neither randomly |
| Context window overflow | LLM truncates or confuses chunks | 10 chunks × 500 tokens exceeds 4K useful context |
| Stale index | Confident but outdated answer | Documents updated; embeddings not refreshed |

### 27.2 Advanced RAG — Pre, During, and Post Retrieval Enhancements

Advanced RAG wraps three enhancement layers around the naive retrieve step.

**Pre-retrieval: improve the query before searching**

```python
# 1. Query expansion — generate multiple phrasings of the same query
from langchain.retrievers import MultiQueryRetriever

retriever = MultiQueryRetriever.from_llm(
    retriever=vectorstore.as_retriever(),
    llm=llm,
    # LLM generates: "2BHK under 2Cr Bandra" +
    #                "two bedroom apartment Bandra West budget 2 crore" +
    #                "affordable flat Bandra 2 bedroom"
)
# Union of results from all three queries — catches vocabulary mismatch

# 2. HyDE (Hypothetical Document Embeddings) — embed a hypothetical answer, not the question
hyde_prompt = "Write a property listing that would answer: {query}"
hypothetical_doc = llm.invoke(hyde_prompt.format(query=user_query))
query_embedding = embed(hypothetical_doc)   # embed the answer, not the question
# Works because answers and documents share vocabulary; questions often don't
```

**During retrieval: improve what comes back**

```python
# Hybrid search: keyword + semantic (BM25 + vector)
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

hybrid = EnsembleRetriever(
    retrievers=[BM25Retriever.from_documents(docs), vectorstore.as_retriever()],
    weights=[0.4, 0.6],
)

# Re-ranking: use a cross-encoder to rescore top-k results
# Cross-encoders read query AND document together — more accurate than cosine similarity
from langchain.retrievers.document_compressors import CohereRerank
from langchain.retrievers import ContextualCompressionRetriever

reranker = CohereRerank(model="rerank-english-v3.0", top_n=3)
reranked_retriever = ContextualCompressionRetriever(
    base_compressor=reranker,
    base_retriever=hybrid,
)
```

**Post-retrieval: improve what gets injected into the prompt**

```python
# Contextual compression: strip irrelevant sentences from each chunk
from langchain.retrievers.document_compressors import LLMChainExtractor

compressor = LLMChainExtractor.from_llm(llm)
# Before: 500-token chunk about "3BHK Bandra West — parking, amenities, price, ..."
# After:  "Price: ₹2.5Cr. 2 covered parking slots included."
# Only the relevant sentences enter the prompt → higher faithfulness, lower token cost

# Lost-in-the-middle mitigation: put most-relevant chunks first AND last
def reorder_for_attention(chunks: list) -> list:
    """LLMs attend best to beginning and end. Put best chunks there."""
    if len(chunks) <= 2:
        return chunks
    middle = chunks[1:-1]
    return [chunks[0]] + middle[::-1] + [chunks[-1]]
```

### 27.3 Modular RAG — Pluggable Pipelines

Modular RAG treats each pipeline component (indexer, retriever, generator, memory) as a swappable module. This enables routing between different retrieval strategies based on query type.

```python
def modular_rag_router(query: str, query_type: str) -> str:
    """Route to different retrieval strategies based on query type."""
    if query_type == "factual_lookup":
        # BM25 keyword search — exact terms matter more than semantics
        return bm25_retriever.invoke(query)
    elif query_type == "semantic_concept":
        # Dense vector — meaning matters
        return vector_retriever.invoke(query)
    elif query_type == "multi_hop":
        # Iterative: retrieve, read, formulate sub-query, retrieve again
        return iterative_retriever.invoke(query)
    else:
        # Hybrid default
        return hybrid_retriever.invoke(query)
```

**Iterative retrieval** — for queries that require chaining:

```
Query: "Which properties near the school mentioned in the project brochure are under 2Cr?"
Step 1: Retrieve → brochure chunk mentioning "Ryan International School"
Step 2: Formulate sub-query → "properties near Ryan International School Bandra under 2Cr"
Step 3: Retrieve → property listings
Step 4: Generate → grounded answer
```

### 27.4 Graph RAG — When Entity Relationships Matter

Standard vector search retrieves isolated chunks. Graph RAG builds a knowledge graph over the corpus and combines graph traversal with vector search.

```
Standard RAG for "Who approved the Bandra project and what are their other approvals?"
→ Returns: chunks about the Bandra project (no links to approval history)
→ Misses: the relationship between approver → all projects they approved

Graph RAG:
Corpus → entity extraction → knowledge graph:
  (Bandra Project) --approved_by→ (Approver: J. Smith)
  (Juhu Project)   --approved_by→ (Approver: J. Smith)

Query traversal:
  Find "Bandra project" node → follow approved_by edge → find J. Smith node
  → retrieve all edges from J. Smith → answer spans both projects
```

**When to use Graph RAG:**
- Documents with rich entity relationships (legal contracts, research papers with citations)
- Queries that require traversal across multiple related entities
- Knowledge management systems where "who knows who" matters

**When NOT to use:** Simple Q&A over homogeneous documents (product docs, FAQs). Graph construction is expensive ($10-100 to index a large corpus with LLM-based entity extraction) and overkill for retrieval of independent facts.

**Implementation:** Microsoft GraphRAG (open source, Python) or LlamaIndex's PropertyGraphIndex.

### 27.5 Self-RAG — Retrieve Only When Needed

Self-RAG adds a "should I even retrieve?" decision step using special reflection tokens.

```
User query: "What is 2+2?"
Self-RAG: RETRIEVE? → No (factual, LLM knows this)
→ Generate directly without retrieval

User query: "What properties are available in Bandra under 2Cr today?"
Self-RAG: RETRIEVE? → Yes (real-time data needed)
→ Retrieve → GROUNDED? → Yes → Generate
           → GROUNDED? → No  → Retrieve again (different query)

User query: "Who founded Anthropic?"
Self-RAG: RETRIEVE? → Maybe (could hallucinate founding date)
→ Retrieve for date verification → Generate
```

**Why it matters:** In most chatbots, 30-40% of queries don't need retrieval (greetings, calculations, general knowledge). Self-RAG eliminates retrieval latency and cost for those queries. The tradeoff: requires fine-tuned model or a reliable critic LLM call.

### 27.6 Agentic RAG — RAG as a Tool

The most powerful pattern: RAG is one tool in an agent's toolbelt. The agent decides when to call it, how many times, and with what query.

```python
from langchain.agents import AgentExecutor, create_react_agent
from langchain.tools import Tool

search_tool = Tool(
    name="SearchPropertyDocs",
    description="Search property listings and documents. Use for: prices, availability, features, locality info.",
    func=retriever.invoke,
)
calculate_tool = Tool(
    name="CalculateEMI",
    description="Calculate EMI given principal, rate, tenure.",
    func=calculate_emi,
)

agent = create_react_agent(llm, tools=[search_tool, calculate_tool], prompt=react_prompt)

# Agent for "2BHK under 2Cr in Bandra — what's the EMI at 8.5% for 20 years?":
# Thought: I need to find the price first
# Action: SearchPropertyDocs("2BHK Bandra under 2Cr")
# Observation: 3BHK ₹2.5Cr... 2BHK ₹1.95Cr...
# Thought: 2BHK is ₹1.95Cr. Now calculate EMI
# Action: CalculateEMI(principal=1.95Cr, rate=8.5, tenure=20)
# Observation: EMI = ₹16,940/month
# Final Answer: "The 2BHK in Bandra is ₹1.95Cr. At 8.5% for 20 years, EMI = ₹16,940/month."
```

**Multi-hop with Agentic RAG:** The agent issues multiple sequential retrieval calls, using the output of one to form the next query. No pre-programmed routing needed.

### 27.7 When to Use Which RAG Architecture

```
How complex are your queries?
│
├─ Simple Q&A, one document per answer, small corpus (< 100K docs)
│   └─ Naive RAG → fast to ship, sufficient accuracy
│
├─ Production chatbot, vocabulary mismatch common, accuracy matters
│   └─ Advanced RAG (hybrid search + reranking)
│       Add contextual compression if context relevance score < 0.7
│
├─ Multiple indices (FAQs + product docs + policies + user data)
│   └─ Modular RAG with routing
│
├─ Queries span relationships between entities (legal, research, knowledge graph)
│   └─ Graph RAG (Microsoft GraphRAG or LlamaIndex PropertyGraph)
│
├─ Mixed queries (some need retrieval, many don't)
│   └─ Self-RAG (saves 30-40% retrieval cost on non-retrieval queries)
│
└─ Complex multi-step queries requiring planning + multiple tool calls
    └─ Agentic RAG (agent + RAG as a tool)
        Most powerful, most expensive — ~3× token cost of naive RAG
```

> 🎯 **MAANG Interview Connection:** "Design a RAG system for a legal document QA assistant."
> Immediately flag the use case signals: legal → entity relationships matter (contract → parties → obligations) → Graph RAG is the right architecture. Mention multi-hop: "who is liable if clause 4.2 is violated?" requires traversal. Then: chunking strategy (document-aware by clause), embedding model (domain-specific or fine-tuned), evaluation (RAGAS faithfulness + human legal expert review for high-stakes). Cost: GraphRAG indexing ~$50-200 for a typical contract corpus, justified by the liability risk of hallucination.

---

## Module 28 — RAG Optimisation & Chunking `[AI FOUNDATION]`

> **After this module you will be able to:**
> 1. Choose the right chunking strategy for any document type
> 2. Implement parent-document retrieval for hierarchical chunk indexing
> 3. Apply MMR and cross-encoder reranking to improve retrieved context diversity and relevance
> 4. Run the RAGAS diagnostic loop to identify and fix the specific failing component
>
> ⏱ Estimated time: 70 minutes | Difficulty: ★★★★☆ | Prerequisites: Module 26, Module 27

### 28.1 Why Chunking Dominates RAG Quality

Chunking determines what the retriever can return. A perfect embedding model cannot compensate for chunks that split answers across boundaries or bury them in noise.

```
The three failure zones:

Zone 1 — Chunk too small (50-100 tokens):
  "The 3BHK at Bandra" ← chunk 1
  "West costs ₹2.5Cr"  ← chunk 2
  Query: "price of 3BHK Bandra" → returns chunk 2 alone → incomplete context

Zone 2 — Chunk too large (1500-2000 tokens):
  [Overview][Pricing][Amenities][Parking][Rules][History]  ← one chunk
  Query: "parking availability" → chunk returned → answer buried at position 5
  LLM suffers "lost in the middle" → misses parking detail

Zone 3 — Boundary mismatch (splits at wrong place):
  "The price includes maintenance... " ← chunk 1 ends mid-sentence
  "...charges of ₹5,000/month."       ← chunk 2
  Query: "what does price include?" → both chunks retrieved but coherence broken

Optimal zone: 256-512 tokens, aligned to natural boundaries (paragraph, section)
```

**Tuning signal:** Use RAGAS context relevance as your feedback metric. Context relevance < 0.7 with a good embedding model → chunking problem, not embedding problem.

### 28.2 Fixed-Size Chunking

The default. Fast, predictable, works for most use cases.

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,          # characters (≈ 128 tokens)
    chunk_overlap=50,        # 10% overlap — preserves sentence continuity across chunks
    separators=["\n\n", "\n", ". ", " ", ""],  # tries each separator in order
    length_function=len,     # character count; use tiktoken for exact token count
)
chunks = splitter.split_documents(docs)

# Token-accurate version (use when model context window is the constraint)
from langchain_text_splitters import TokenTextSplitter
token_splitter = TokenTextSplitter(chunk_size=256, chunk_overlap=20)
```

**The overlap gotcha:** Overlap ensures a sentence split across a boundary appears in both adjacent chunks. Without overlap, a query matching the second half of a sentence misses the first half. 10% overlap is the standard starting point; increase to 20% for dense technical content.

### 28.3 Semantic Chunking

Instead of splitting at fixed sizes, semantic chunking splits where topic changes — detected by measuring embedding similarity between adjacent sentences.

```python
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai import OpenAIEmbeddings

splitter = SemanticChunker(
    embeddings=OpenAIEmbeddings(),
    breakpoint_threshold_type="percentile",   # split where similarity drops below 95th pct
    # alternatives: "standard_deviation", "interquartile"
)
chunks = splitter.split_documents(docs)
```

**When semantic > fixed-size:**
- Dense paragraphs where a single section covers 3+ different topics
- Long-form articles that flow continuously without clear structural markers
- When RAGAS context relevance is low despite right-sized fixed chunks

**Cost:** ~1 embedding call per sentence during indexing. For 10,000-sentence corpus: ~$0.02 with text-embedding-3-small. Worth it for high-value corpora.

### 28.4 Document-Aware Chunking

Respect the document's own structure rather than imposing arbitrary boundaries.

```python
from langchain_text_splitters import MarkdownHeaderTextSplitter, HTMLHeaderTextSplitter

# Markdown: split by heading hierarchy
md_splitter = MarkdownHeaderTextSplitter(
    headers_to_split_on=[("##", "section"), ("###", "subsection")],
    return_each_line=False,
)
# Each chunk = one markdown section, metadata contains heading path
# Result: {"content": "...", "metadata": {"section": "Pricing", "subsection": "EMI Options"}}

# HTML: same principle for web content
html_splitter = HTMLHeaderTextSplitter(
    headers_to_split_on=[("h2", "section"), ("h3", "subsection")],
)

# PDF: page-aware (PyMuPDF preserves page number in metadata)
from langchain_community.document_loaders import PyMuPDFLoader
loader = PyMuPDFLoader("contract.pdf")
docs = loader.load()   # each Document = one page, metadata["page"] = page number
```

**When to use:** Legal documents (split by clause), technical documentation (split by section), HTML content (split by header tag). The metadata (heading, page, section) becomes filterable in the vector DB.

### 28.5 Code Chunking

Code has natural boundaries — functions and classes. Split there, not mid-function.

```python
from langchain_text_splitters import Language, RecursiveCharacterTextSplitter

# Language-aware splitter: tries class → function → block → line boundaries
code_splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.PYTHON,
    chunk_size=1500,     # functions can be longer — larger chunk appropriate
    chunk_overlap=100,
)

# Supported: PYTHON, JS, TS, JAVA, C, CPP, GO, RUBY, RUST, SCALA, SWIFT, MARKDOWN, LATEX, HTML
python_chunks = code_splitter.split_text(source_code)
```

**Best for:** Code search assistants, developer tools, RAG over repository documentation. Never split mid-function — a function with its docstring and signature is one semantic unit.

### 28.6 Hierarchical / Parent-Document Retrieval

The insight: retrieve small chunks (high precision), but inject large chunks (full context).

```python
from langchain.retrievers import ParentDocumentRetriever
from langchain.storage import InMemoryStore

# Two-level hierarchy:
# Child chunks (256 tokens) stored in vector DB — what gets searched
# Parent chunks (2000 tokens) stored in docstore — what gets injected into prompt

child_splitter = RecursiveCharacterTextSplitter(chunk_size=256)
parent_splitter = RecursiveCharacterTextSplitter(chunk_size=2000)

retriever = ParentDocumentRetriever(
    vectorstore=vectorstore,
    docstore=InMemoryStore(),      # or RedisStore for production
    child_splitter=child_splitter,
    parent_splitter=parent_splitter,
)
retriever.add_documents(docs)

# At query time:
# 1. Query finds the best-matching child chunk (small = precise match)
# 2. Returns the parent chunk (large = full context for generation)
results = retriever.invoke("parking at the Bandra property")
# Returns the full property section (2000 tokens), not just the 256-token parking chunk
```

**When to use:** When context relevance is high (right chunks retrieved) but faithfulness is low (LLM hallucinates because chunk lacks full context). Parent-document retrieval fixes the context breadth problem.

### 28.7 Retrieval Optimisation — MMR and Reranking

**MMR (Maximal Marginal Relevance)** — avoid returning 5 nearly-identical chunks:

```python
# Standard similarity search: top-5 might be 5 chunks about the same sub-topic
results = vectorstore.similarity_search(query, k=5)

# MMR: balance relevance and diversity
results = vectorstore.max_marginal_relevance_search(
    query,
    k=5,           # number to return
    fetch_k=20,    # fetch 20, then pick 5 most diverse + relevant
    lambda_mult=0.5,  # 0=max diversity, 1=max relevance
)
# Result: 5 chunks covering different aspects of the answer
```

**Cross-encoder reranking** — more accurate than cosine similarity, but slower:

```python
from langchain.retrievers.document_compressors import CohereRerank
from langchain.retrievers import ContextualCompressionRetriever

# Bi-encoder (standard vector search): encodes query and doc separately
# Fast: O(1) per query after indexing. Less accurate.

# Cross-encoder (reranker): reads query + document together
# Slow: O(k) LLM/model calls. Much more accurate.

reranker = CohereRerank(model="rerank-english-v3.0", top_n=3)
reranked = ContextualCompressionRetriever(
    base_compressor=reranker,
    base_retriever=vectorstore.as_retriever(search_kwargs={"k": 10}),
)
# Pattern: retrieve 10 cheaply, rerank to top 3 accurately
# Cost: $0.001/1K searches for Cohere rerank — affordable in production
```

**Self-hosted reranking:** `BAAI/bge-reranker-large` from HuggingFace — free to run, ~40ms on GPU.

### 28.8 The RAGAS-Driven Optimisation Loop

Use RAGAS scores as the compass for which component to fix:

```
Run RAGAS on your eval set (200 samples, ~$1.00, ~3 min async)
│
├─ Context Relevance < 0.7  (retriever returning wrong chunks)
│   ├─ Try smaller chunk size: 512 → 256 tokens
│   ├─ Try hybrid search (BM25 + vector) if vocabulary mismatch common
│   ├─ Try MultiQueryRetriever or HyDE for ambiguous queries
│   └─ Try better embedding model (BGE-large vs text-embedding-3-small)
│
├─ Faithfulness < 0.7  (LLM adding claims beyond retrieved context)
│   ├─ Add "answer ONLY from the provided context" to system prompt
│   ├─ Lower temperature (0.5 → 0.2)
│   ├─ Try parent-document retrieval (larger chunk = more context for LLM)
│   └─ Add validate_output rules for domain-specific hallucination patterns
│
├─ Answer Relevance < 0.7  (LLM not answering the specific question)
│   ├─ Add "Directly answer: {question}" at end of system prompt
│   ├─ Check if turn_history is diluting the current query intent
│   └─ Try contextual compression (strip irrelevant sentences before injection)
│
└─ All scores > 0.7 but user satisfaction low
    → Online signal problem — add session_completed Kafka event
    → Check intent coverage rate — out_of_scope > 8% means taxonomy gap
```

**Optimisation budget rule:** Don't change more than one variable at a time. Each RAGAS evaluation costs ~$1 and 3 minutes. Run it as a CI job, not interactively.

> 🎯 **MAANG Interview Connection:** "How would you improve a RAG system that has low accuracy?"
> Lead with the diagnostic question: "Low accuracy where — retrieval or generation?" Then walk through RAGAS: context relevance tells you retrieval quality, faithfulness tells you generation quality, answer relevance tells you prompt quality. For each: specific fix strategy (chunking, hybrid search, reranking for retrieval; temperature, context window management, output validation for generation). End with the production feedback loop: online signals → annotation queue → eval set expansion → CI RAGAS gate.

---

## Module 29 — Model Landscape & Selection `[AI FOUNDATION]`

> **After this module you will be able to:**
> 1. Compare frontier closed-source models across benchmark, latency, and cost dimensions
> 2. Identify when open-source models (Llama 3, Mistral, Qwen2) are the right choice
> 3. Select specialist models for code, embeddings, vision, and speech tasks
> 4. Apply a 5-axis decision framework to choose any model for any use case
> 5. Calculate TCO for hosted vs self-hosted at 1M DAU
>
> ⏱ Estimated time: 70 minutes | Difficulty: ★★★☆☆ | Prerequisites: Module 16

### 29.1 Closed-Source Frontier Models

The three dominant closed-source families as of mid-2025. Benchmarks shift — use these as relative anchors, not absolute truth.

| Model | Provider | Context | Cost (input/output per 1M tokens) | MMLU | HumanEval | Best for |
|---|---|---|---|---|---|---|
| **GPT-4o** | OpenAI | 128K | $2.50 / $10.00 | 88.7% | 90.2% | Multimodal, vision+text, tool use |
| **GPT-4o mini** | OpenAI | 128K | $0.15 / $0.60 | 82.0% | 87.2% | Cost-efficient general tasks |
| **o1** | OpenAI | 200K | $15 / $60 | 92.3% | 95.8% | Complex reasoning, math, science |
| **Claude Sonnet 4.6** | Anthropic | 200K | $3.00 / $15.00 | 90.1% | 92.0% | Long-context, instruction following |
| **Claude Haiku 4.5** | Anthropic | 200K | $0.80 / $4.00 | 83.2% | 88.5% | Fast, cheap, structured output |
| **Gemini 1.5 Pro** | Google | 1M | $3.50 / $10.50 | 90.0% | 84.1% | Massive context, multimodal |
| **Gemini 1.5 Flash** | Google | 1M | $0.075 / $0.30 | 78.9% | 74.9% | Cheapest frontier option |
| **Gemini 2.0 Flash** | Google | 1M | $0.10 / $0.40 | 87.0% | 89.3% | Fast, cheap, strong reasoning |

**Reading this table:** Cost scales linearly with usage. At 1M daily LLM calls × 500 tokens avg: GPT-4o = $1,250/day, Haiku = $400/day, Gemini Flash = $37.50/day. Model cost is often the biggest line item in AI infrastructure.

**Provider diversity risk:** If Anthropic has an outage, you need a fallback. OpenRouter (Module 32) provides automatic fallback routing between providers.

### 29.2 Open-Source Models

Open-source models run on your own infrastructure — no API cost, no data leaves your network, full control over deployment.

| Model | Params | Context | MMLU | HumanEval | VRAM (bf16) | Best for |
|---|---|---|---|---|---|---|
| **Llama 3.1 8B** | 8B | 128K | 73.0% | 72.6% | 16GB | Edge/local, cost-sensitive |
| **Llama 3.1 70B** | 70B | 128K | 86.0% | 80.5% | 140GB | Near-frontier, self-hosted |
| **Llama 3.1 405B** | 405B | 128K | 88.6% | 89.0% | 810GB | Frontier quality, maximum control |
| **Mistral 7B** | 7B | 32K | 64.2% | 30.5% | 14GB | Lightweight tasks, very fast |
| **Mixtral 8×7B** | 47B (MoE) | 32K | 70.6% | 40.2% | 90GB | MoE — GPT-3.5 quality at lower cost |
| **Mistral Large 2** | 123B | 128K | 84.0% | 92.0% | 246GB | Strong reasoning, open weights |
| **Qwen2.5 72B** | 72B | 128K | 86.7% | 86.9% | 144GB | Multilingual (especially CJK) |
| **Phi-3 Mini** | 3.8B | 128K | 68.8% | 58.9% | 8GB | On-device, extreme resource constraint |
| **Command R+** | 104B | 128K | 75.7% | — | 208GB | RAG-optimised, retrieval grounding |

**MoE (Mixture of Experts):** Mixtral 8×7B has 47B total parameters but only activates 13B per token. This gives near-70B quality at 13B inference cost. MoE is why Mixtral punches above its weight class.

**When open-source wins:**
- Data privacy: customer data cannot leave your infrastructure (healthcare, finance, legal)
- Cost at scale: at 10M+ daily calls, self-hosting a 70B model saves $5K-50K/month vs API
- Latency: co-located model eliminates API network round-trip (~50-100ms savings)
- Customisation: fine-tuning and LoRA adapters are simpler on open weights

**When closed-source wins:**
- Speed to market: no infra to manage, no model to deploy
- Top capability: o1/Claude Sonnet are still ahead of best open-source on complex reasoning
- Multi-modal: GPT-4o and Gemini's vision capabilities outperform open alternatives for most tasks
- Team size: a 2-person startup cannot manage GPU infra efficiently

### 29.3 Specialist Models

Not every task needs a general-purpose LLM. Specialist models are smaller, faster, cheaper, and often more accurate for their specific domain.

**Code models:**

| Model | Strength | Context | Notes |
|---|---|---|---|
| DeepSeek-Coder-V2 | Code completion + generation, 338 languages | 128K | Best open-source code model as of mid-2025 |
| CodeLlama 34B | Python/JS/TS completion | 100K | Strong on unit test generation |
| Claude Sonnet (general) | Code understanding, explanation, architecture | 200K | Best general model for code review |
| GPT-4o (general) | Multi-file codebase reasoning | 128K | Strong on refactoring and debugging |

**Embedding models:** See Module 26.7 — `text-embedding-3-small`, Cohere embed-v3, `BAAI/bge-large-en-v1.5`.

**Vision models:**

| Model | Use case | Notes |
|---|---|---|
| GPT-4o | Document OCR, chart understanding, general vision | Best all-around, ~$0.01/image |
| Gemini 1.5 Pro | Video understanding, long documents with images | 1M context handles video frames |
| LLaVA 1.6 (open) | Self-hosted vision QA | Llama-3 based, 7B/13B |
| PaliGemma (open) | Image captioning, visual QA | Google, 3B, Apache license |
| Whisper (OpenAI) | Speech-to-text | Open source, 39 languages, runs locally |

**When to use specialist models:**
- Code completion in an IDE: DeepSeek-Coder or CodeLlama (lower latency, lower cost than GPT-4o)
- Batch OCR on document uploads: GPT-4o vision or PaliGemma (self-hosted)
- Multilingual transcription: Whisper (self-hosted, no per-call cost, GDPR-safe)

### 29.4 The 5-Axis Model Selection Framework

When evaluating any model for a production use case, score it on five axes:

```
                          Your task:  Classify housing queries (Tier 3a)
                          ────────────────────────────────────────────────

Axis              Weight    Claude Haiku 4.5    GPT-4o     Llama 3.1 70B
────────────────────────────────────────────────────────────────────────────
Cost per call      30%      ★★★★★ ($0.0004)   ★★☆☆☆      ★★★★☆ (infra)
Latency p95        25%      ★★★★☆ (~250ms)     ★★★☆☆      ★★★☆☆
Capability         20%      ★★★☆☆ (JSON OK)    ★★★★★      ★★★★☆
Data privacy       15%      ★★★☆☆ (API)        ★★★☆☆      ★★★★★ (local)
Operational ctrl   10%      ★★★☆☆              ★★★☆☆      ★★★★★

Weighted score:             4.1                3.5         4.0
Winner: Haiku 4.5 for classification — confirmed by this codebase's choice
```

**Decision shortcuts:**
- Structured JSON output at low latency → small fast model (Haiku, GPT-4o mini, Gemini Flash)
- Complex multi-step reasoning → large model (o1, Sonnet, GPT-4o)
- Data must stay on-premises → open source (Llama 3.1 70B, Mistral Large)
- Maximum context (1M tokens) → Gemini 1.5 Pro/Flash
- Cost-optimised at 10M+ calls/day → Gemini 2.0 Flash or self-hosted Llama

### 29.5 Hosted vs Self-Hosted — TCO at Scale

**Hosted (API):**
- Zero infra management
- Pay per token — predictable cost at low volume
- Unpredictable at high volume (1M calls/day at $0.0004/call = $400/day = $146K/year for Haiku)

**Self-hosted:**
- Fixed infra cost, variable utilisation
- Requires: GPU servers, MLOps tooling, model versioning, autoscaling
- Break-even typically at 500K-2M API calls/day depending on model size

```
TCO comparison — Llama 3.1 70B vs Haiku 4.5 at 1M calls/day, 500 tokens avg:

Hosted (Haiku 4.5):
  Input:  1M × 400 tokens × $0.80/1M = $320/day
  Output: 1M × 100 tokens × $4.00/1M = $400/day
  Total:  ~$720/day = $263K/year

Self-hosted (Llama 3.1 70B on 2× A100 80GB):
  GPU rental: 2× A100 at $3/hr × 24hr = $144/day
  Engineering: ~$50K/year (0.5 FTE MLOps)
  Total:  ~$103K/year

Break-even: ~6-8 months. Above 1M calls/day, self-hosted wins.
Below 500K calls/day, hosted wins (no MLOps burden).
```

### 29.6 Context Window Tradeoffs

Larger context windows enable processing entire documents without chunking — but have hidden costs.

| Context | Use case | Cost impact | Quality risk |
|---|---|---|---|
| 4K–8K | Standard Q&A, classification | Baseline cost | Minimal |
| 32K–128K | Long documents, codebases, legal contracts | 10-40× more expensive | Lost-in-the-middle for answers past position 8K |
| 1M (Gemini) | Full codebase, video, multi-document | 100× more expensive | Strong attention degradation past 128K |

**The lost-in-the-middle problem at scale:** Research shows LLM accuracy drops significantly for information in the middle of a long context. For retrieval tasks, chunked RAG with reranking consistently outperforms "just put everything in the context" even when the context window is large enough to hold all documents.

**Practical rule:** Use long context for tasks where document structure matters and the answer could be anywhere (legal review, code audit). Use RAG for tasks where only a small portion of a large corpus is relevant to any given query.

> 🎯 **MAANG Interview Connection:** "How do you choose an LLM for a new AI feature?"
> Walk through the 5-axis framework: cost, latency, capability, privacy, operational control. Apply it to the specific feature. Then: "I'd start with the cheapest model that meets the accuracy bar, validated by offline eval on a golden dataset. Then instrument online metrics (session completion, clarification rate) to detect quality issues at scale. If the cheap model underperforms, upgrade selectively — not globally."

---

## Module 30 — Running Models: Local, Cloud, Edge `[AI FOUNDATION]`

> **After this module you will be able to:**
> 1. Run any open-source model locally with Ollama in under 5 minutes
> 2. Explain GGUF quantisation levels and their quality/speed tradeoffs
> 3. Set up vLLM for production GPU serving with PagedAttention
> 4. Choose between Groq, HuggingFace Endpoints, and vLLM for a given latency/cost requirement
> 5. Deploy a model to Apple Neural Engine and ONNX Runtime for on-device inference
>
> ⏱ Estimated time: 75 minutes | Difficulty: ★★★★☆ | Prerequisites: Module 29

### 30.1 Ollama — Local Model Serving

Ollama is the simplest way to run open-source models locally. One command installs the server; one command downloads and runs any model.

```bash
# Install (macOS)
brew install ollama

# Pull and run a model
ollama pull llama3.1:8b
ollama run llama3.1:8b   # interactive chat

# Serve via REST API (OpenAI-compatible)
ollama serve             # starts on localhost:11434

# Switch to a different model without restart
ollama pull mistral
ollama pull qwen2:7b
```

```python
# Use via OpenAI client (Ollama is OpenAI-API compatible)
from openai import OpenAI

client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")
response = client.chat.completions.create(
    model="llama3.1:8b",
    messages=[{"role": "user", "content": "Classify this: 2BHK in Bandra under 2Cr"}],
)

# Use via LangChain
from langchain_community.llms import Ollama
llm = Ollama(model="llama3.1:8b")
result = llm.invoke("Classify this query: 2BHK in Bandra under 2Cr")
```

**Modelfile — custom system prompt and parameters:**

```
# Modelfile
FROM llama3.1:8b
SYSTEM "You are a housing.com intent classifier. Output JSON only."
PARAMETER temperature 0
PARAMETER num_ctx 4096

# Build and run
ollama create housing-classifier -f Modelfile
ollama run housing-classifier
```

**Use cases for Ollama:**
- Development: zero API cost, works offline, instant iteration
- Privacy prototypes: data never leaves the machine
- Testing prompts before committing to a paid API
- CI pipelines: free LLM calls in GitHub Actions (use `phi3:mini` for speed)

### 30.2 llama.cpp and GGUF Quantisation

llama.cpp enables running LLMs on CPU (and Metal/CUDA GPU) with quantised weights. GGUF is the quantised model format.

**Quantisation levels — the quality/speed/memory tradeoff:**

| Format | Bits per weight | Memory (7B model) | Quality loss | Speed vs fp16 |
|---|---|---|---|---|
| **fp16** | 16 | ~14GB | None (baseline) | 1× |
| **Q8_0** | 8 | ~7GB | Negligible (<0.1%) | 1.5× faster |
| **Q6_K** | 6 | ~5.5GB | Very small | 2× faster |
| **Q5_K_M** | 5 | ~4.5GB | Small | 2.5× faster |
| **Q4_K_M** | 4 | ~4GB | Moderate (~1%) | 3× faster, **recommended default** |
| **Q3_K_M** | 3 | ~3GB | Noticeable | 4× faster |
| **Q2_K** | 2 | ~2.5GB | Significant | 5× faster |

**Practical guidance:** Q4_K_M is the sweet spot — 3× memory reduction vs fp16, <1% quality loss on most benchmarks. Use Q8_0 when quality is critical and you have VRAM. Use Q2_K only for on-device edge deployment where RAM is severely constrained.

```bash
# Download quantised model from HuggingFace
huggingface-cli download bartowski/Meta-Llama-3.1-8B-Instruct-GGUF \
    --include "Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf" \
    --local-dir ./models

# Run with llama.cpp
./llama-cli -m models/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf \
    -n 256 --temp 0 -p "Classify: 2BHK in Bandra under 2Cr"

# Run as OpenAI-compatible server
./llama-server -m models/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf \
    --port 8080 --n-gpu-layers 99   # --n-gpu-layers 0 for CPU-only
```

Ollama uses llama.cpp under the hood — when you `ollama pull`, it downloads GGUF files and manages them for you.

### 30.3 vLLM — Production GPU Serving

vLLM is the standard for serving open-source LLMs in production. Its key innovation is **PagedAttention** — memory management for the KV cache inspired by OS paging.

**Why PagedAttention matters:**
- Standard attention: KV cache pre-allocated per request (wastes GPU memory on partial fills)
- PagedAttention: KV cache in fixed-size pages, allocated on demand — same GPU serves 2-4× more concurrent requests

```bash
pip install vllm

# Start vLLM server (OpenAI-compatible API)
python -m vllm.entrypoints.openai.api_server \
    --model meta-llama/Llama-3.1-8B-Instruct \
    --tensor-parallel-size 1 \      # number of GPUs
    --max-model-len 8192 \
    --port 8000

# Quantised (AWQ/GPTQ for lower VRAM)
python -m vllm.entrypoints.openai.api_server \
    --model TheBloke/Llama-2-13B-AWQ \
    --quantization awq
```

```python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:8000/v1", api_key="vllm")

# Continuous batching: vLLM automatically batches concurrent requests
# Throughput: 2-10× higher than naive single-request serving
response = client.chat.completions.create(
    model="meta-llama/Llama-3.1-8B-Instruct",
    messages=[{"role": "user", "content": "Classify this query..."}],
)
```

**vLLM throughput numbers (A100 80GB, Llama 3.1 8B):**
- Single-request latency: ~50ms first token
- Throughput with continuous batching: ~2,000 tokens/second
- Concurrent users: 100+ with PagedAttention memory management

### 30.4 HuggingFace Inference Endpoints

Managed hosting for any HuggingFace model. Zero infra management — HuggingFace handles autoscaling, cold starts, and model loading.

```python
from huggingface_hub import InferenceClient

client = InferenceClient(
    model="meta-llama/Meta-Llama-3.1-8B-Instruct",
    token="hf_...",
)
response = client.text_generation(
    "Classify: 2BHK in Bandra under 2Cr",
    max_new_tokens=100,
    temperature=0.0,
)
```

**Cost model:** ~$0.60-1.20/hour for a dedicated GPU endpoint (varies by GPU type). Cold start on serverless: 30-90 seconds. Dedicated endpoint: always warm, ~$400-800/month.

**When to use:** Prototyping with open-source models without managing your own GPU infra; enterprise teams that need a managed open-source option with SLA.

### 30.5 Groq — Ultra-Low Latency Inference

Groq's LPU (Language Processing Unit) is custom silicon optimised for sequential token generation — the bottleneck in LLM inference.

| Metric | Groq LPU | A100 (vLLM) | API (Haiku 4.5) |
|---|---|---|---|
| Time to first token | ~10ms | ~50ms | ~200ms |
| Tokens/second | 800-1,200 | 100-200 | 50-150 |
| Latency p95 | ~30ms total | ~500ms | ~1-2s |
| Cost | ~$0.05/1M tokens (Llama 3.1 8B) | GPU rental + ops | $0.80/1M |

```python
from groq import Groq

client = Groq(api_key="gsk_...")
response = client.chat.completions.create(
    model="llama-3.1-8b-instant",   # or llama-3.1-70b-versatile
    messages=[{"role": "user", "content": "Classify: 2BHK Bandra under 2Cr"}],
    temperature=0,
    max_tokens=100,
)
```

**When Groq is the right choice:**
- Real-time streaming where first-token latency is user-visible (chat, copilots)
- High-frequency classification (millions of calls/day at extreme throughput)
- Cost-optimised at very high volume (Llama 3.1 8B on Groq is cheaper than most API options)

**Limitations:** Limited model selection (Llama, Mistral, Gemma families). No fine-tuning. Availability depends on Groq's infrastructure capacity.

### 30.6 Edge and On-Device AI

On-device AI runs the model entirely on the end-user's hardware — no network round-trip, no data leaves the device.

**Apple Neural Engine (Core ML):**

```python
# Convert HuggingFace model to Core ML
import coremltools as ct
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("phi-3-mini")
traced = torch.jit.trace(model, example_input)
mlmodel = ct.convert(traced, compute_units=ct.ComputeUnit.ALL)   # uses ANE
mlmodel.save("Phi3Mini.mlpackage")

# In iOS/macOS Swift app:
# let model = try Phi3Mini(configuration: MLModelConfiguration())
# → runs on Neural Engine, ~40ms per token on M3
```

**ONNX Runtime — cross-platform:**

```python
from optimum.onnxruntime import ORTModelForCausalLM
from transformers import AutoTokenizer

model = ORTModelForCausalLM.from_pretrained("phi3-mini-onnx")
tokenizer = AutoTokenizer.from_pretrained("microsoft/Phi-3-mini-4k-instruct")

inputs = tokenizer("Classify: 2BHK Bandra", return_tensors="pt")
outputs = model.generate(**inputs, max_new_tokens=50)
# Runs on: Windows/Linux CPU, mobile (Android via ONNX Runtime Mobile), WebAssembly
```

**Quantisation for edge (Q4 or smaller):**

```bash
# Quantise to 4-bit for mobile
python -m llama.cpp.convert_hf_to_gguf phi3-mini --outtype q4_k_m \
    --outfile phi3-mini-q4.gguf
# Result: 3.8B model → ~2.2GB — fits in iPhone 15 Pro RAM
```

**When to use on-device:**
- Privacy-critical: medical notes, personal data, legal documents — cannot touch the cloud
- Offline capability: field workers, rural coverage, submarine cables
- Latency-critical: sub-50ms requirement that no API can meet
- Cost: zero per-inference cost once model is deployed

### 30.7 Inference Optimisation Concepts

These optimisations are applied by vLLM and llama.cpp automatically — but understanding them lets you tune serving configuration.

| Technique | What it does | Benefit |
|---|---|---|
| **KV Cache** | Stores computed attention keys/values for each token; reuses on next token | ~5× decode speedup vs recomputing every token |
| **Prompt caching** | Re-uses KV cache for identical prompt prefix across requests | ~90% cost reduction for shared system prompts (Module 16.6) |
| **Continuous batching** | Inserts new requests mid-generation, not just between completions | 2-4× throughput improvement |
| **Speculative decoding** | Small "draft" model generates N tokens; large model verifies in one pass | 2-3× speedup when draft is often correct |
| **Tensor parallelism** | Splits model weight matrices across multiple GPUs | Enables serving 70B+ models across 4-8 GPUs |
| **Quantisation** | Reduces weight precision (fp16 → int4); trades small quality loss for 3-4× memory reduction | Fits larger models on fewer GPUs |

### 30.8 Serving Decision Tree

```
What are your constraints?
│
├─ Dev/local/prototype: zero cost, works offline
│   └─ Ollama (pull model, one command)
│
├─ Production, open-source, GPU available
│   └─ vLLM (PagedAttention, continuous batching, OpenAI-compatible)
│       Use AWQ quantisation to fit larger models on fewer GPUs
│
├─ Production, managed, no GPU infra to manage
│   └─ HuggingFace Inference Endpoints (dedicated) or Groq (serverless)
│
├─ Latency-critical (< 100ms p95 required)
│   └─ Groq LPU for supported models
│       Self-hosted vLLM on A100 for unsupported models
│
├─ Cost-critical at 10M+ calls/day
│   └─ Self-hosted Llama 3.1 8B on vLLM → Groq API fallback
│
├─ Data must not leave device/network
│   └─ Ollama (local server) or llama.cpp (embedded)
│
└─ Mobile / edge / iOS / Android
    └─ Core ML (Apple devices) or ONNX Runtime Mobile (cross-platform)
        Use Q4_K_M quantisation to fit in device RAM
```

> 🎯 **MAANG Interview Connection:** "How would you serve a 70B open-source model to 1M users/day?"
> Lead with infrastructure: 4× A100 80GB with tensor parallelism via vLLM. PagedAttention handles concurrent requests. Continuous batching maximises throughput. Then: quantisation — AWQ 4-bit brings VRAM from 140GB to ~35GB (fits on 1× A100 instead of 2). Cost calculation: A100 at $3/hr = $72/day fixed + ~$0 per-token vs $720/day at Haiku rates at 1M calls. Monitoring: vLLM exposes Prometheus metrics — track tokens/second, queue depth, and TTFT p95.

---

## Module 31 — Fine-Tuning & Training

> **Why this module matters:** Fine-tuning is one of the most misunderstood topics in AI engineering. Most engineers either think they need it (they don't) or avoid it entirely (sometimes wrong). This module gives you the mental model to decide when fine-tuning is the right call, how to do it cheaply and correctly, and how to evaluate whether it actually helped.

---

### 31.1 The Adaptation Hierarchy — When to Fine-Tune

Before writing a single line of training code, check this hierarchy:

```
Level 1 — Prompt Engineering (minutes, free)
  Structured prompts, few-shot examples, CoT instructions
  Use when: model already has the capability, just needs guidance

Level 2 — RAG / Context Injection (hours, cheap)
  Inject domain knowledge at inference time
  Use when: knowledge is frequently updated or too large for prompts

Level 3 — Fine-Tuning (days, moderate cost)
  Bake style/behaviour/domain patterns into weights
  Use when: consistent output format, proprietary tone, domain vocab
  NOT for: adding new facts (facts hallucinate; RAG > fine-tuning for knowledge)

Level 4 — Train from Scratch (months, very expensive)
  Custom architecture, novel capability, proprietary data from scratch
  Use when: you're a lab, not a product team
```

**Decision rule:** Start at Level 1. Move to the next level only when the current level demonstrably fails after reasonable effort. Most product teams need Level 1–2, occasionally 3.

| Goal | Right approach |
|---|---|
| Answer questions about my product docs | RAG (knowledge is external, updated) |
| Consistent JSON output schema | Prompt engineering + output parser |
| Legal-tone responses for contracts | Fine-tuning (style) |
| Classify support tickets into 50 categories | Fine-tuning (narrow structured task) |
| Summarise long documents | Prompt + few-shot (capability already exists) |
| Add facts about my company | RAG, not fine-tuning |

---

### 31.2 Full Fine-Tuning

Full fine-tuning updates every weight in the model using supervised examples.

**Requirements:** GPT-3.5 equivalent (7B): 2× A100 80GB, 1–2 days. Llama 70B: 8× H100, several days.

**When justified:**
- When LoRA isn't expressive enough (rare)
- When you have 100K+ high-quality examples
- When operating at a scale where model cost savings justify infra cost

**Catastrophic forgetting:** Full fine-tuning on a narrow domain degrades general capability. Mitigate with a mix of domain data + general instruction data (typically 80/20 ratio).

---

### 31.3 LoRA — Low-Rank Adaptation

LoRA freezes the original weights and adds small trainable rank-decomposition matrices to selected layers. This is the practical default for fine-tuning.

```
Original weight: W ∈ ℝ^(d×k)  — frozen
LoRA delta:      ΔW = A × B   — trained
  A ∈ ℝ^(d×r), B ∈ ℝ^(r×k), where r << d

At inference: W' = W + α/r × ΔW
  α (lora_alpha): scaling factor, typically set equal to r
  r (rank): how many dimensions to adapt — 4, 8, 16 are typical
```

```python
from peft import LoraConfig, get_peft_model, TaskType

config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=16,              # rank — higher = more capacity, more VRAM
    lora_alpha=32,     # scaling factor
    lora_dropout=0.05,
    target_modules=["q_proj", "v_proj"],  # which attention layers to adapt
    bias="none",
)
model = get_peft_model(base_model, config)
model.print_trainable_parameters()
# trainable params: 4,194,304 || all params: 6,738,415,616 || trainable%: 0.0623%
```

**VRAM requirements for LoRA (bf16 base + adapters):**

| Model | Full FT VRAM | LoRA VRAM (r=16) |
|---|---|---|
| Llama 3.1 8B | ~80GB | ~20GB (1× A100 40GB) |
| Llama 3.1 13B | ~130GB | ~32GB (1× A100 40GB) |
| Llama 3.1 70B | ~700GB | ~160GB (2× A100 80GB) |

---

### 31.4 QLoRA — 4-Bit + LoRA

QLoRA combines 4-bit NF4 quantisation of base model weights with LoRA adapters. This is the practical path for fine-tuning large models on consumer hardware.

```python
from transformers import BitsAndBytesConfig
import torch

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",       # NF4 > int4 for LLMs
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,  # saves extra ~0.4 bits/param
)
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Meta-Llama-3.1-8B",
    quantization_config=bnb_config,
    device_map="auto",
)
```

**QLoRA VRAM requirements (4-bit base + LoRA adapters):**

| Model | QLoRA VRAM | Hardware |
|---|---|---|
| Llama 3.1 8B | ~6GB | RTX 3090 or M2 Pro Mac |
| Llama 3.1 13B | ~10GB | RTX 3090 / A10G |
| Llama 3.1 70B | ~48GB | 2× RTX 4090 or 1× A100 |

---

### 31.5 Fine-Tuning Pipeline

**Step 1 — Dataset curation (most important step)**

```python
# Instruction-tuning format (ChatML)
dataset = [
    {
        "messages": [
            {"role": "system",    "content": "You are a property classifier. Output JSON only."},
            {"role": "user",      "content": "3BHK flat in Powai, 1.8Cr, semi-furnished"},
            {"role": "assistant", "content": '{"intent": "property_search", "bedroom": 3, "location": "Powai", "budget_max": 18000000, "furnished": "semi"}'}
        ]
    },
    # ... 500–5000 more examples
]
```

Rules for high-quality training data:
- **Diversity over quantity:** 500 diverse examples > 5,000 repetitive ones
- **Correct label first:** garbage in, garbage out — review 10% manually
- **Hold out 10–20%** for evaluation before any training
- **Match production distribution:** if 30% of prod queries are ambiguous, 30% of training should be too

**Step 2 — Training with HuggingFace Trainer**

```python
from transformers import TrainingArguments
from trl import SFTTrainer

training_args = TrainingArguments(
    output_dir="./housing-classifier",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,   # effective batch = 16
    learning_rate=2e-4,
    bf16=True,
    logging_steps=50,
    save_steps=500,
    eval_strategy="steps",
    eval_steps=200,
    warmup_ratio=0.03,
)

trainer = SFTTrainer(
    model=model,
    args=training_args,
    train_dataset=train_ds,
    eval_dataset=eval_ds,
    peft_config=lora_config,
    max_seq_length=2048,
)
trainer.train()
trainer.save_model()  # saves LoRA adapter only
```

**Step 3 — Merge and push**

```python
from peft import PeftModel

base = AutoModelForCausalLM.from_pretrained("meta-llama/Meta-Llama-3.1-8B")
model = PeftModel.from_pretrained(base, "./housing-classifier")
merged = model.merge_and_unload()   # bakes LoRA weights into base
merged.save_pretrained("./housing-classifier-merged")
```

---

### 31.6 RLHF & Alignment (Conceptual)

Most product teams never need RLHF. Understand the concepts for interviews.

**RLHF pipeline:**
1. Supervised Fine-Tuning (SFT) on demonstration data
2. Reward Model (RM) trained on human preference pairs (A vs B, which is better?)
3. PPO (Proximal Policy Optimisation) — policy gradient to maximise reward model score

**DPO (Direct Preference Optimisation):** Simpler alternative. Skip the separate reward model. Train directly on preference pairs (chosen vs rejected). Works well; fewer moving parts.

```python
from trl import DPOTrainer, DPOConfig

dpo_config = DPOConfig(beta=0.1)  # how strongly to enforce preference
trainer = DPOTrainer(
    model=model,
    ref_model=ref_model,  # frozen copy of SFT model
    args=dpo_config,
    train_dataset=preference_dataset,  # {"prompt", "chosen", "rejected"}
)
```

**When you actually need RLHF/DPO:** Safety alignment, reducing toxicity at scale, optimising for a measurable human preference signal. For most product fine-tuning tasks, SFT on good examples is sufficient.

---

### 31.7 Domain Adaptation vs Task-Specific Fine-Tuning

| Type | Training data | Goal | Example |
|---|---|---|---|
| Domain adaptation | Unlabelled domain text (continued pre-training) | Teach domain vocabulary and patterns | Medical notes, legal docs, code |
| Task-specific | Labelled input-output pairs (SFT) | Consistent output format for a narrow task | JSON classification, structured extraction |
| Instruction tuning | Diverse instruction-response pairs | Follow instructions reliably | General-purpose chat model |

**Recommendation:** Start with task-specific SFT on a base instruction-tuned model (e.g. `Llama-3.1-8B-Instruct`). Domain adaptation requires much more data and compute for marginal gains unless your domain is extremely specialised.

---

### 31.8 Fine-Tuning Evaluation

**Always evaluate on a held-out test set before declaring success:**

```python
# Classification task — JSON output
def evaluate_classifier(model, test_examples):
    correct = 0
    for ex in test_examples:
        pred = model.generate(ex["input"])
        try:
            parsed = json.loads(pred)
            if parsed["intent"] == ex["expected_intent"]:
                correct += 1
        except json.JSONDecodeError:
            pass  # invalid JSON = incorrect
    return correct / len(test_examples)
```

**Benchmark regression check:** After fine-tuning, verify general capability hasn't degraded. Run the base model and fine-tuned model on MMLU (5-shot) — expect ≤2% regression. If regression is >5%, increase proportion of general instruction data in training mix.

**Production A/B:** Fine-tuned model in shadow mode for 24h → compare accuracy, latency, cost vs incumbent. Promote only if A/B shows clear win.

> 🎯 **MAANG Interview Connection:** "When would you fine-tune vs RAG?" — Use the adaptation hierarchy. Fine-tune for style/format/classification consistency. RAG for knowledge and freshness. The most common wrong answer is "fine-tune to add new facts." Facts hallucinate in fine-tuned models; they belong in a retrieval store.

---

## Module 32 — ML Platforms & Tooling

> **Why this module matters:** Every AI team runs on a set of tools. Knowing which platforms exist, what they provide, and when to use them is the difference between an engineer who can move fast and one who reinvents wheels. This module is your map of the tooling landscape.

---

### 32.1 HuggingFace — The Model Hub

HuggingFace is the GitHub of AI models and datasets. Every practitioner uses it daily.

**Key surfaces:**
- **Hub:** 500K+ models, 100K+ datasets. Download any model with one line.
- **`transformers` library:** Unified API across PyTorch and TensorFlow models
- **Inference API (Serverless):** Free tier, cold start, rate limited — for prototyping only
- **Inference Endpoints:** Dedicated GPU, always warm, SLA, ~$0.60–$2.00/hr depending on hardware
- **Spaces:** Deploy Gradio/Streamlit apps on free GPU-backed hosting
- **AutoTrain:** No-code fine-tuning UI — upload dataset, pick model, train with 1 click

```python
# Download and run any model
from transformers import pipeline

pipe = pipeline("text-generation", model="meta-llama/Meta-Llama-3.1-8B-Instruct")
result = pipe("Classify: 2BHK in Bandra, 1.5Cr", max_new_tokens=100)

# HuggingFace Inference API (serverless, free tier)
from huggingface_hub import InferenceClient
client = InferenceClient(model="mistralai/Mixtral-8x7B-Instruct-v0.1", token="hf_...")
output = client.text_generation("Classify this query...", max_new_tokens=200)
```

**When to use HuggingFace:**
- Discovering and downloading open-source models (always)
- Running open-source models in managed cloud (Inference Endpoints)
- Dataset management and sharing
- Fine-tuning via their Trainer / TRL / PEFT ecosystem

---

### 32.2 Groq — LPU Inference

Groq's LPU (Language Processing Unit) is purpose-built hardware for LLM inference — no shared memory, deterministic scheduling, extremely fast.

```python
from groq import Groq
client = Groq(api_key="gsk_...")

response = client.chat.completions.create(
    model="llama-3.1-70b-versatile",  # or llama-3.1-8b-instant
    messages=[{"role": "user", "content": "..."}],
    temperature=0, max_tokens=500,
)
```

**Performance:** Llama 3.1 8B at ~800 tokens/sec, TTFT ~10ms. Compare: OpenAI API TTFT ~200–500ms.

**Limitations:** Limited model selection (~10 models), no fine-tuned model deployment, capacity constraints during peak hours, no image/vision.

**When Groq wins:** Real-time streaming where latency is user-visible, audio transcription via Whisper-at-scale, extremely cost-sensitive use cases (Llama 3.1 8B at $0.05/1M tokens).

---

### 32.3 Together.ai

Together.ai provides inference + fine-tuning API for open-source models, with pricing often 50–70% cheaper than equivalent HuggingFace Endpoints.

```python
from together import Together
client = Together(api_key="...")

# Fine-tuning API
response = client.fine_tuning.create(
    model="meta-llama/Meta-Llama-3.1-8B-Instruct-Reference",
    training_file="file-abc123",
    n_epochs=3,
    learning_rate=2e-5,
    suffix="housing-classifier",
)

# Inference
response = client.chat.completions.create(
    model="your-org/housing-classifier",
    messages=[{"role": "user", "content": "Classify: 2BHK..."}],
)
```

**Cost:** Training ~$0.80–$3.00/1M tokens. Inference from $0.10/1M tokens for smaller models.

**When Together.ai wins:** You need fine-tuned open-source model inference without managing GPU infra. Together hosts your fine-tuned adapter automatically.

---

### 32.4 OpenRouter — Model Gateway

OpenRouter is a unified API gateway across 100+ models from 30+ providers (OpenAI, Anthropic, Google, HuggingFace, Together, and more). One API key, one request format.

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="sk-or-...",
)

# Automatic fallback: try claude-sonnet, fall back to gpt-4o if unavailable
response = client.chat.completions.create(
    model="anthropic/claude-sonnet-4-6",
    messages=[{"role": "user", "content": "..."}],
    extra_body={
        "route": "fallback",
        "models": ["anthropic/claude-sonnet-4-6", "openai/gpt-4o"],
    },
)
```

**Key features:**
- Automatic fallback chains (no single provider dependency)
- Cost comparison dashboard across all providers
- Free models tier for prototyping
- One API format for everything

**When OpenRouter wins:** Multi-provider resilience, cost benchmarking, prototyping across providers quickly.

---

### 32.5 Replicate — Serverless GPU

Replicate runs open-source models (and custom models you push) as serverless endpoints. Pay per second of GPU time, including cold start.

```python
import replicate

output = replicate.run(
    "stability-ai/stable-diffusion:27b93a2413e...",  # model:version
    input={"prompt": "a property floor plan, architectural style"}
)

# Custom model deployment
model = replicate.models.create(name="my-org/housing-classifier")
version = model.versions.create(
    cog_yaml="...",  # your Cog config
    openapi_schema="...",
)
```

**Cost:** ~$0.000225/sec on T4 GPU. Cold start: 30–120s. Warm: ~0ms.

**When Replicate wins:** One-off inferences, image/video generation tasks, sharing models publicly, prototyping without infrastructure setup.

---

### 32.6 AWS / Azure / GCP AI Services

**Amazon Bedrock:** Managed API for Claude, Llama, Titan, Mistral — pay-per-token, no infra. Also offers Guardrails (content filtering) and Knowledge Bases (managed RAG). Default choice if your company is on AWS and wants enterprise support.

**Amazon SageMaker:** Full MLOps platform — training jobs, HPO, model registry, endpoints. Powerful but complex; best for teams with dedicated MLOps engineers.

**Azure OpenAI Service:** Managed OpenAI models (GPT-4o, o1, DALL-E) in your Azure tenant — GDPR-compliant, SOC2, private networking. Required for regulated industries on Microsoft infra.

**Azure ML Studio:** Experiment tracking, model registry, managed endpoints, AutoML. HuggingFace integration. Simpler than SageMaker for non-AWS shops.

**Google Vertex AI:** Gemini API, managed Llama endpoints, Matching Engine (managed vector search), and Model Garden. Tight integration with BigQuery and GCS — natural fit for data teams on GCP.

---

### 32.7 Platform Selection Matrix

| Use case | Best platform | Runner-up |
|---|---|---|
| Find/download any open model | HuggingFace Hub | Replicate |
| Managed open-source inference (always warm) | HuggingFace Endpoints | Together.ai |
| Ultra-low latency open model (<100ms) | Groq | vLLM self-hosted |
| Fine-tuning + managed hosting | Together.ai | HuggingFace AutoTrain |
| Multi-provider fallback, cost comparison | OpenRouter | — |
| One-off inferences, image gen | Replicate | HuggingFace Spaces |
| Enterprise regulated environment (AWS) | Amazon Bedrock | SageMaker |
| Enterprise regulated environment (Azure) | Azure OpenAI | Azure ML |
| Data team on GCP | Vertex AI | — |
| Experiment tracking + MLOps | MLflow / W&B | SageMaker |
| Local dev, zero cost | Ollama | llama.cpp |

**The senior engineer's rule:** Don't over-architect the platform. For most teams, start with the API (Anthropic / OpenAI / Groq), add HuggingFace when you need open-source, add a fine-tuning platform (Together.ai) only when you've validated fine-tuning is actually needed.

---

### 32.8 Experiment Tracking — MLflow and W&B

When you run multiple fine-tuning experiments, you need to track hyperparameters, loss curves, and eval metrics. Two dominant tools:

**MLflow (open-source, self-hosted or Databricks):**
```python
import mlflow

mlflow.set_experiment("housing-classifier-finetune")
with mlflow.start_run():
    mlflow.log_params({"r": 16, "lora_alpha": 32, "epochs": 3, "lr": 2e-4})
    mlflow.log_metric("eval_accuracy", 0.94, step=500)
    mlflow.log_metric("eval_loss", 0.12, step=500)
    mlflow.log_artifact("./housing-classifier-merged")
```

**Weights & Biases (W&B, managed, free tier):**
```python
import wandb

wandb.init(project="housing-classifier", config={"r": 16, "epochs": 3})
# Auto-integrates with HuggingFace Trainer — just add:
# report_to="wandb" in TrainingArguments
wandb.log({"accuracy": 0.94, "loss": 0.12})
```

**When to use which:** MLflow for teams that need self-hosted tracking (data privacy); W&B for richer visualisation, team collaboration, and hyperparameter sweep UIs. Both integrate natively with HuggingFace Trainer.

> 🎯 **MAANG Interview Connection:** "Walk me through the ML tooling stack for a new AI feature." → Start with API + prompt engineering (HuggingFace for exploration, OpenRouter for multi-provider). Add LangSmith for tracing. If fine-tuning needed: Together.ai or HuggingFace Endpoints, track with W&B. Production serving: vLLM or Groq depending on latency budget. Monitoring: custom eval harness + RAGAS + LangSmith online.

---

## Module 33 — Agent Architectures

> **Why this module matters:** "Agent" is the most overloaded word in AI engineering. This module gives you precise definitions and the engineering reality behind four major agent architectures. You'll know which to use for which class of problem — and when NOT to use agents at all.

---

### 33.1 What Makes Something an "Agent"

An agent is a system that:
1. **Perceives** its environment (user input, tool results, memory)
2. **Reasons** about what action to take
3. **Acts** by calling a tool, generating output, or routing to another step
4. **Observes** the result and loops back

The key property that separates agents from chains: **cycles**. A chain executes linearly. An agent can loop, retry, and change direction based on what it observes.

```
Chain:  Input → Step 1 → Step 2 → Output   (no loops)
Agent:  Input → Think → Act → Observe → Think → Act → ... → Output
```

The cost: unpredictability. Every loop is a potential extra LLM call ($$$), a potential error, and a potential infinite loop. Always ask: does this problem actually need a loop?

---

### 33.2 ReAct — Reason + Act

ReAct interleaves reasoning (Thought) and action (Action/Observation) in the LLM context. The model explicitly narrates its reasoning before calling tools.

```
Thought: I need to find current property prices in Bandra before I can answer.
Action: search_listings(location="Bandra", bedroom=2)
Observation: {"results": [{"price": 15000000, ...}, ...]}
Thought: Average price is ~1.5Cr. Now I can calculate affordability.
Action: calculate_emi(principal=15000000, rate=8.5, years=20)
Observation: {"emi": 130000}
Answer: A 2BHK in Bandra costs ~1.5Cr. EMI at 8.5% over 20 years = ₹1.3L/month.
```

```python
from langchain.agents import create_react_agent, AgentExecutor
from langchain import hub

prompt = hub.pull("hwchase17/react")  # standard ReAct prompt template

tools = [search_listings_tool, calculate_emi_tool, get_property_details_tool]
agent = create_react_agent(llm, tools, prompt)
executor = AgentExecutor(
    agent=agent, tools=tools,
    verbose=True,
    max_iterations=10,       # hard cap — prevents infinite loops
    handle_parsing_errors=True,
)
result = executor.invoke({"input": "Can I afford a 2BHK in Bandra on 2L/month salary?"})
```

**Failure modes:**
- **Reasoning drift:** Model hallucinates a tool result instead of calling the tool
- **Tool selection error:** Calls wrong tool, receives irrelevant result, spirals
- **Infinite loop:** Keeps calling the same tool with same args — always set `max_iterations`
- **Verbose overhead:** Every intermediate step is in context → expensive long conversations

**When ReAct works well:** Single-agent tasks with 2–5 tool calls, well-documented tools, tasks where the model should explain its reasoning to users.

---

### 33.3 Plan-and-Execute

Plan-and-Execute separates planning from execution. A planner LLM creates an upfront ordered task list; executor agents execute each task in sequence.

```
Planner (GPT-4o): "To answer 'best 2BHK in Bandra under 2Cr', I need to:
  1. Search listings (Bandra, 2BHK, budget ≤ 2Cr)
  2. For top 3 results: fetch full property details
  3. Rank by price/sqft ratio
  4. Format recommendation"

Executor: Runs each step with appropriate tools
Replanner: If step fails → revise remaining plan
```

```python
from langchain_experimental.plan_and_execute import PlanAndExecute, load_agent_executor, load_chat_planner

planner = load_chat_planner(llm)
executor = load_agent_executor(llm, tools, verbose=True)
agent = PlanAndExecute(planner=planner, executor=executor, verbose=True)
result = agent.invoke({"input": "Find the best 2BHK in Bandra under 2Cr"})
```

**Advantage over ReAct:** For long multi-step tasks, planning upfront reduces hallucination (the model commits to a correct plan) and provides progress transparency.

**Failure modes:** Plan goes wrong by step 2 and executor keeps executing a bad plan. Mitigate with replanning after each failure.

**When to use:** Long, structured tasks with 5–15 sequential steps; tasks where plan transparency matters (audit trail, user-facing progress).

---

### 33.4 Reflexion

Reflexion adds self-critique and episodic memory of past failures. After each attempt, the agent critiques its own output and generates a verbal reflection stored in memory. Subsequent attempts learn from the reflection.

```
Attempt 1: Generated EMI calculation — answer seems right
Reflection: "The EMI formula I used assumed monthly compounding but Indian home loans
             use reducing-balance with monthly rests — I need to use the correct formula."
Memory: [reflection stored]

Attempt 2: Retrieves reflection → uses correct formula → better answer
```

```python
# Simplified Reflexion loop in LangGraph
class ReflexionState(TypedDict):
    input: str
    attempts: list[str]
    reflections: list[str]
    final_answer: str | None

def reflect_node(state: ReflexionState) -> ReflexionState:
    last_attempt = state["attempts"][-1]
    reflection_prompt = f"""
    Your previous attempt: {last_attempt}
    Critique: what was wrong? What should you do differently?
    """
    reflection = llm.invoke(reflection_prompt).content
    return {**state, "reflections": state["reflections"] + [reflection]}

def should_continue(state: ReflexionState) -> str:
    if len(state["attempts"]) >= 3:
        return "end"
    return "reflect"
```

**When Reflexion works well:** Tasks with verifiable correctness (code that must pass tests, math problems), tasks with clear quality criteria, when you have a reliable scorer.

**When it fails:** Vague tasks with no verifiable ground truth (agent spirals on poorly-grounded self-critique). Always bound max attempts.

---

### 33.5 Tool Selection & Memory Taxonomy

**Tool descriptions are retrieval problems at scale:**

```python
# When you have 50+ tools, retrieve the relevant subset dynamically
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings

tool_docs = [Document(page_content=t.description, metadata={"name": t.name}) for t in all_tools]
tool_store = Chroma.from_documents(tool_docs, OpenAIEmbeddings())

def get_relevant_tools(query: str, k: int = 5) -> list[Tool]:
    relevant = tool_store.similarity_search(query, k=k)
    names = {doc.metadata["name"] for doc in relevant}
    return [t for t in all_tools if t.name in names]
```

**Memory taxonomy for agents:**

| Type | Storage | Example | Lifespan |
|---|---|---|---|
| In-context (short-term) | LLM context window | Current conversation turns | Request |
| External semantic | Vector DB | Retrieved docs, past conversations | Persistent |
| Episodic | Vector DB / KV | Past task outcomes, Reflexion notes | Persistent |
| Semantic (knowledge) | Vector DB / Graph | Domain facts, company data | Persistent |
| Procedural | Fine-tuned weights / prompts | How to format responses, domain rules | Indefinite |

---

### 33.6 When NOT to Use Agents

This is the most important section in the module.

| Use agents | Don't use agents |
|---|---|
| Task structure is unknown at call time | Task structure is fixed and known |
| Requires 3–10 tool calls with branching | Requires ≤2 tool calls in sequence |
| Adaptation based on tool outputs | Same logic every time |
| Complex multi-hop reasoning needed | Simple retrieval + format |

**Complexity budget:** Each agent loop adds: +1 LLM call (~200ms, ~$0.001), +1 parsing step, +1 failure mode. Five-step agent = 5× cost and 5× failure surface vs a direct call.

**Latency budget:** A 5-step ReAct agent with GPT-4o takes ~4 seconds. If your SLA is 1 second, agents are off the table.

**Determinism requirements:** Agents are non-deterministic by nature. For financial calculations, legal documents, or safety-critical outputs — use a chain, validate outputs, and keep humans in the loop.

> 🎯 **MAANG Interview Connection:** "Design an AI agent for X" — Start by questioning whether you need an agent. "First I'd check if this can be solved with a single well-structured prompt + retrieval call. Agents add latency, cost, and failure modes. I'd reach for agents only when the task structure is unknown at call time or requires genuine multi-step reasoning with branches."

---

## Module 34 — Multi-Agent Systems

> **Why this module matters:** Single agents hit capability ceilings — context limits, specialisation tradeoffs, reliability. Multi-agent systems break through these limits by distributing work across specialised agents. This module covers the four main architectures and how to build them in LangGraph.

---

### 34.1 Why Multiple Agents

Single-agent limitations:
- **Context limit:** A single agent doing research + writing + code review + editing will exceed 128K tokens
- **Specialisation tradeoff:** One agent can't be simultaneously optimised for extraction, reasoning, and formatting
- **Parallelism:** Sequential agents can't overlap work; specialised agents can run concurrently
- **Reliability:** A critique agent catching errors from a generator agent > self-critique

Multi-agent patterns solve for: scale, specialisation, parallelism, and quality via adversarial collaboration.

---

### 34.2 Supervisor Architecture

A supervisor (orchestrator) LLM routes work to specialist agents and aggregates results. The supervisor doesn't do domain work — it decides who does it.

```
User query
    ↓
Supervisor ("Which agent should handle this?")
    ├─ Research Agent  → web search, retrieval
    ├─ Analyst Agent   → data processing, calculations
    ├─ Writer Agent    → structured prose output
    └─ Critic Agent    → review and quality check
         ↓
    Supervisor aggregates → final answer
```

```python
from langgraph.graph import StateGraph, START, END
from typing import Literal

class SupervisorState(TypedDict):
    messages: Annotated[list, add_messages]
    next: str  # which agent to call next

def supervisor_node(state: SupervisorState) -> SupervisorState:
    system = """Route the task to the best agent:
    - research: needs web search or document retrieval
    - analyst: needs numerical analysis or data processing
    - writer: needs to compose a final response
    - FINISH: work is complete"""
    response = llm_with_structured_output.invoke([
        SystemMessage(content=system),
        *state["messages"],
    ])
    return {**state, "next": response.next}

def route(state: SupervisorState) -> Literal["research", "analyst", "writer", "FINISH"]:
    return state["next"] if state["next"] != "FINISH" else END

graph = StateGraph(SupervisorState)
graph.add_node("supervisor", supervisor_node)
graph.add_node("research", research_agent)
graph.add_node("analyst", analyst_agent)
graph.add_node("writer", writer_agent)

graph.add_edge(START, "supervisor")
graph.add_conditional_edges("supervisor", route)
for agent in ["research", "analyst", "writer"]:
    graph.add_edge(agent, "supervisor")  # always return to supervisor

app = graph.compile()
```

---

### 34.3 Hierarchical Architecture

Supervisor of supervisors — for large-scale tasks requiring team coordination.

```
Orchestrator (top-level)
    ├─ Research Supervisor
    │   ├─ Web Search Agent
    │   ├─ Doc Retrieval Agent
    │   └─ Fact Check Agent
    ├─ Analysis Supervisor
    │   ├─ Financial Analyst Agent
    │   └─ Risk Agent
    └─ Output Supervisor
        ├─ Writer Agent
        └─ Editor Agent
```

Each subgraph is a LangGraph graph compiled and called as a node in the parent graph. This is the subgraph pattern:

```python
# Compile specialist subgraph
research_subgraph = research_builder.compile()

# Use as a node in parent graph
main_graph.add_node("research_team", research_subgraph)
```

**When to use hierarchical:** Tasks requiring 10+ agents, clear team boundaries, large document processing pipelines (research → analysis → output are genuinely independent teams).

---

### 34.4 Collaborative / Debate Architecture

Agents critique each other's output until consensus. Useful for tasks with high quality requirements where a single agent self-critique doesn't catch errors.

```
Generator Agent: Produces candidate answer
Critic Agent:    Reviews for errors, hallucinations, gaps
Generator:       Revises based on critique
Critic:          Approves or requests another revision
Judge (LLM):     Final accept/reject
```

```python
class DebateState(TypedDict):
    messages: Annotated[list, add_messages]
    iterations: int

def generator(state: DebateState) -> DebateState:
    proposal = llm.invoke(state["messages"]).content
    return {**state, "messages": state["messages"] + [AIMessage(content=proposal)],
            "iterations": state["iterations"] + 1}

def critic(state: DebateState) -> DebateState:
    critique_prompt = f"Critique this response for accuracy and completeness:\n{state['messages'][-1].content}"
    critique = llm.invoke(critique_prompt).content
    return {**state, "messages": state["messages"] + [HumanMessage(content=critique)]}

def should_continue(state: DebateState) -> str:
    if state["iterations"] >= 3:
        return "end"
    return "critic"
```

---

### 34.5 Handoff Protocols & Shared State

Agents communicate via two patterns:

**Message passing:** Agents append to a shared message list. Each agent reads only the messages relevant to it. Simple, but can lead to large contexts.

```python
# Standard handoff — append to shared messages
def research_agent(state: MultiAgentState) -> MultiAgentState:
    result = do_research(state["messages"][-1].content)
    return {**state, "messages": state["messages"] + [
        AIMessage(content=result, name="research_agent")
    ]}
```

**Structured state fields:** Agents read/write specific fields. Cleaner, more type-safe.

```python
class PipelineState(TypedDict):
    query: str
    research_results: list[dict]  # written by research agent
    analysis: str                  # written by analyst agent
    final_answer: str              # written by writer agent
    status: Literal["research", "analysis", "writing", "done"]
```

**Rule of thumb:** Use message passing for conversational multi-agent flows. Use structured fields for pipeline-style multi-agent workflows where each stage has a clear output type.

---

### 34.6 Multi-Agent Evaluation & Production Considerations

**Failure attribution:** When a multi-agent pipeline fails, which agent failed?

```python
# Instrument each agent with LangSmith @traceable
from langsmith import traceable

@traceable(name="research_agent", metadata={"agent_type": "specialist"})
def research_agent(query: str) -> dict:
    ...

# LangSmith traces show per-agent latency, cost, and failure
```

**Cost explosion:** N agents × M LLM calls × $0.005/call. A 5-agent pipeline doing 3 calls each = 15× the cost of a single call. Always measure cost per pipeline run during development.

**Latency chains:** Sequential agent calls compound latency. 5 agents × 500ms = 2.5s minimum. Use parallel execution where agents are independent:

```python
# LangGraph parallel branches — agents 2 and 3 run concurrently
graph.add_edge("agent_1", "agent_2")
graph.add_edge("agent_1", "agent_3")  # parallel with agent_2
graph.add_edge("agent_2", "agent_4")
graph.add_edge("agent_3", "agent_4")  # both 2+3 must finish before 4
```

**Circular dependency prevention:** Never let agent A's output feed back to agent A through a cycle without an explicit termination condition. Always bound with `max_iterations` or a `done` flag.

| Production concern | Mitigation |
|---|---|
| Cost explosion | Per-run cost tracking; budget caps |
| Latency chains | Parallelise independent agents |
| Failure attribution | @traceable per agent, structured logging |
| Circular dependencies | max_iterations + done flag |
| Non-determinism | Shadow testing before production rollout |
| Context bloat | Summarise intermediate results, don't pass full history |

> 🎯 **MAANG Interview Connection:** "Design a multi-agent system for automated code review." → Supervisor routes: (1) Syntax/lint agent (deterministic tools), (2) Security agent (SAST + LLM), (3) Logic review agent (LLM reads diff), (4) Test coverage agent, (5) Critic agent reviews all findings and deduplicates. Key points: agents 1–4 run in parallel (LangGraph parallel edges), critic aggregates. Budget cap: $0.10/PR review. Human-in-the-loop for any security finding above severity 3.

---

## Appendix D — AI Engineering Across the Industry

> **Why this appendix matters:** The Housing.com chatbot is one context. FAANG roles span Google, Meta, Amazon, Apple, Netflix, OpenAI — different stacks, different problems, different interview styles. This appendix maps what you've learned onto the broader industry so you can walk into any room ready.

---

### D.1 The Stack Varies — Wider Than You Think

The Housing.com stack (Anthropic + LangGraph + FastAPI + PostgreSQL) is one of dozens of valid production stacks. Here's what the industry actually uses:

| Stack flavour | Companies | LLM | Orchestration | Vector DB |
|---|---|---|---|---|
| OpenAI + TypeScript | Startups, Vercel ecosystem | GPT-4o | Vercel AI SDK / custom | Pinecone |
| Anthropic + Python | Startups, AI-native cos | Claude Sonnet/Haiku | LangGraph / custom | Chroma / Pinecone |
| AWS Bedrock | Enterprises on AWS | Claude, Titan, Llama | Step Functions / Bedrock Agents | OpenSearch |
| Google Vertex AI | Enterprises on GCP | Gemini | Vertex AI Pipelines | Matching Engine |
| Azure OpenAI | Regulated industries | GPT-4o | Semantic Kernel / Azure ML | Azure AI Search |
| Open-source all the way | Privacy-first / fintech | Llama 3.1 70B | LangGraph / Haystack | pgvector / Qdrant |
| Meta internal | Meta | Llama (fine-tuned) | Internal FB infra | FAISS |

**The lesson for interviews:** Describe your architecture in terms of abstractions — retrieval, generation, orchestration, memory — not vendor names. Every interviewer can map "vector store" to their preferred vendor.

---

### D.2 Domain-Specific Challenges

| Domain | Core AI challenge | Compliance/safety | Stack tendency |
|---|---|---|---|
| **Fintech** | Sub-100ms classification, fraud signals | SOX, PCI-DSS, GDPR — zero hallucination on numbers | Closed-source API, pgvector, no data to third-party |
| **Healthcare** | Clinical note extraction, prior auth | HIPAA — PHI cannot leave your VPC | Self-hosted Llama / on-prem, ChromaDB local |
| **E-commerce** | Recommendation + search + Q&A at 100M+ users | Brand safety, no competitive product mention | High-throughput Bedrock, FAISS/Pinecone, Kafka |
| **Dev tools** | Code completion, PR review, test generation | Code IP, no customer code to third-party | Local Ollama for dev, Groq for CI, CodeLlama |
| **Legal** | Contract analysis, clause extraction | Privilege protection, hallucination liability | Azure OpenAI (private endpoint) + retrieval-only |
| **Autonomous / robotics** | Real-time multi-modal decision | Safety-critical — human override mandatory | Edge: ONNX / Core ML; small models, fast inference |

---

### D.3 FAANG Company AI Profiles

**Google / DeepMind**
- Primary models: Gemini 1.5 Pro/Flash (internal), PaLM 2, Gemma (open-source)
- Stack: Vertex AI Pipelines, Matching Engine (vector search), BigQuery ML
- Internal tools: Spanner, Bigtable, Colossus storage
- Interview focus: ML fundamentals, large-scale systems (billions of users), custom model training, TPUs
- Signature pattern: Everything integrates with Search — AI features serve the ad revenue model

**Meta / FAIR**
- Primary models: Llama 3.x (open-source, internally fine-tuned), custom MoE
- Stack: PyTorch-native, FAISS for vector search, internal Tupperware/Kubernetes
- Interview focus: Recommender systems, real-time ranking, PyTorch model architecture
- Signature pattern: Open-source everything downstream. Internal models are proprietary variants of public ones.

**Amazon / AWS**
- Primary services: Bedrock (managed Claude/Llama), SageMaker, Alexa LLM stack
- Stack: AWS-native, Step Functions for orchestration, OpenSearch for retrieval
- Interview focus: Leadership Principles baked into every answer, customer obsession, operational excellence
- Signature pattern: Build the platform first (Bedrock/SageMaker), sell as a service

**Apple**
- Primary focus: On-device AI (Apple Intelligence), Core ML, Neural Engine
- Stack: Swift, Core ML, ONNX, private cloud compute (PCC) for off-device
- Interview focus: Privacy by design, on-device quantisation, Swift/Obj-C integration
- Signature pattern: Never sends user data off-device unless necessary. Models are tiny and fast.

**Netflix**
- Primary use: Recommendation engine (not LLM-primary), content metadata, subtitle generation
- Stack: Internal ML platform (Metaflow), Flink for streaming, custom embedding models
- Interview focus: A/B testing rigor, metrics-driven decisions, recommendation system design
- Signature pattern: Every AI feature is A/B tested with statistical significance before launch

**OpenAI**
- Primary models: GPT-4o, o1, DALL-E, Whisper, Sora
- Stack: Largely proprietary; heavy use of Azure for compute
- Interview focus: Alignment, RLHF, fine-tuning at scale, research-to-product pipeline
- Signature pattern: API-first. Build the foundational model, let others build the apps.

---

### D.4 Interview Question Variation by Company

**Google ML System Design:**
> "Design a real-time content recommendation system for YouTube that serves 2 billion users."
> → Focus: Two-tower model, ANN retrieval (ScaNN), feature engineering, training pipeline, A/B framework

**Meta LLM System Design:**
> "Design a feed ranking system that incorporates LLM-generated content quality signals."
> → Focus: Retrieval + ranking separation, latency budget (< 200ms), PyTorch model serving, feature store

**Amazon AI Product Design:**
> "Design Alexa's skill routing system to handle 10M concurrent requests."
> → Lead with Leadership Principles. Focus: operational reliability, graceful degradation, customer trust

**Apple On-Device AI:**
> "Design a system for on-device document summarisation that works offline and never sends data to the cloud."
> → Focus: Core ML model compression (Q4 quantisation), Neural Engine utilisation, Swift integration, model update mechanism

**Netflix ML Platform:**
> "How would you measure whether the new recommendation model is actually better?"
> → Focus: A/B testing design, metric selection (watch time vs satisfaction), novelty/serendipity tradeoffs, guardrail metrics

**OpenAI Research to Production:**
> "How would you fine-tune GPT-4 to be a reliable medical coding assistant while avoiding hallucination?"
> → Focus: RLHF/DPO for alignment, uncertainty quantification, human-in-the-loop, eval framework

---

### D.5 Role Archetypes Beyond "AI Engineer"

Understanding which role you're targeting shapes how you present the same experience:

| Role | Core skill | AI depth | Typical stack | Salary range (US) |
|---|---|---|---|---|
| **Applied Scientist** | ML research + deployment | Deep — model training, architecture | PyTorch, Vertex AI, SageMaker | $200K–$400K |
| **ML Engineer** | Model training + serving infra | Deep — training pipelines, eval, serving | MLflow, vLLM, Kubernetes | $180K–$350K |
| **AI Platform Engineer** | Infra for AI teams | Wide — tooling, not models | Airflow, Ray, Kubernetes, MLflow | $180K–$320K |
| **AI Product Engineer** | Features using AI APIs | Shallow — prompting, integration | LangChain, Anthropic API, TypeScript | $150K–$280K |
| **AI/ML Engineer (generalist)** | End-to-end AI features | Medium — prompting to fine-tuning | LangGraph, HuggingFace, FastAPI | $160K–$300K |
| **Prompt Engineer** | Prompt optimisation | Narrow — prompt craft, eval | LangSmith, evals frameworks | $130K–$200K |

**For FE engineers transitioning:** Target "AI Product Engineer" or "AI/ML Engineer (generalist)" first. These roles value full-stack product intuition + AI integration over deep ML theory. The Housing.com project demonstrates both.

---

### D.6 The Full Open-Source Production Stack

You don't need a single paid API to run a production AI system:

```
Layer           Open-Source Choice          Equivalent Managed
────────────────────────────────────────────────────────────────
LLM serving     Ollama / vLLM (Llama 3.1)  Anthropic / OpenAI API
Orchestration   LangGraph                   —
Vector search   ChromaDB / pgvector         Pinecone / Weaviate
Embeddings      BGE-M3 (HuggingFace)        OpenAI text-embedding-3
API layer       FastAPI                     —
Database        PostgreSQL                  AWS RDS
Cache/session   Redis (open-source)         AWS ElastiCache
Streaming       Apache Kafka (open-source)  AWS Kinesis
Observability   LangSmith (free tier) /     LangSmith cloud
                Langfuse (self-hosted)
Experiment      MLflow (self-hosted)        Weights & Biases
tracking
CI/CD           GitHub Actions              —
```

**Total cost at 100K daily users:** ~$200–$400/month (GPU rental for Llama 70B + Postgres + Redis). Comparable managed-API stack: ~$2,000–$5,000/month.

---

### D.7 Updated Learning Paths

**RAG Specialist**
App A (ML Vocab) → Module 16 (RAG intro) → Module 26 (Vector DBs) → Module 27 (RAG Architectures) → Module 28 (RAG Optimisation) → Module 18 (Evaluation)

**Model & Infrastructure Focus**
Module 29 (Model Landscape) → Module 30 (Running Models) → Module 31 (Fine-Tuning) → Module 32 (ML Platforms)

**Agent Engineering**
Module 0 (Architecture) → Module 24 (LangGraph Deep Dive) → Module 33 (Agent Architectures) → Module 34 (Multi-Agent Systems)

**FE → AI Engineer (Non-Uber / FAANG)**
App A → App B (10-week plan) → Appendix D (Industry context) → Module 29 (Model selection) → Module 33 (Agents) → Module 19 (Production) → Appendix C (mock interviews)

**Full Toolbelt (all new modules, fastest path)**
Modules 23–24 (LangChain/Graph) → 25–26 (LangSmith/VectorDB) → 27–28 (RAG) → 29–30 (Models) → 31–32 (Fine-Tuning/Platforms) → 33–34 (Agents) → Appendix D

---

## Module 36 — LLM Internals: Transformers, Attention & Architecture

> **Why this module matters:** You can use an LLM as a black box — but you can't debug it, optimise it, or make architectural decisions about it. This module demystifies what's actually happening inside a language model so you can reason about context limits, latency, cost, and why certain prompting techniques work.

---

### 36.1 From Perceptrons to Transformers

**Perceptron (1957):** The atomic unit of neural networks. Takes weighted inputs, sums them, applies an activation function, and outputs a scalar.

```
input: [x₁, x₂, x₃]
output: σ(w₁x₁ + w₂x₂ + w₃x₃ + b)
  σ = activation function (sigmoid, ReLU, GELU)
  w = weights (learned during training)
  b = bias (learned offset)
```

**Feedforward Neural Network:** Stack perceptrons in layers. Each layer learns a higher-level representation of the input. Problem for language: no sense of word order, no handling of long-range dependencies.

**RNN / LSTM (1997–2015):** Process tokens sequentially — each token's hidden state is informed by all previous tokens. Problem: vanishing gradient (early tokens lose influence), inherently sequential (slow, unparallelisable).

**Transformer (Vaswani et al. 2017, "Attention Is All You Need"):** Replaced sequential processing with **self-attention** — every token attends to every other token simultaneously. This single change unlocked: parallelism (GPU-friendly), long-range dependencies, and scalability. It is the foundation of every modern LLM.

---

### 36.2 Tokenisation — Before Any Processing Begins

LLMs don't see words. They see **tokens** — integers mapped from subword units via a vocabulary lookup.

```python
from tiktoken import encoding_for_model
enc = encoding_for_model("gpt-4o")

text = "Housing.com property search"
tokens = enc.encode(text)
# [39963, 916, 3241, 1718]  ← token IDs
# token count = 4 (not 3 words — "Housing" + ".com" + " property" + " search")

# Rule of thumb: 1 token ≈ 0.75 words (English)
# "Maharashtra" might be 3 tokens: "Mah" + "ara" + "shtra"
# Impact: billing is per token, not per word; rare words cost more
```

**BPE (Byte-Pair Encoding):** The standard tokeniser algorithm. Starts with byte-level vocabulary, iteratively merges the most frequent byte-pair into a new token until vocabulary size is reached (e.g., 100K tokens for GPT-4o). Rare words fragment into many tokens (expensive); common words compress into few.

---

### 36.3 Embeddings — Tokens Become Vectors

Before tokens enter the transformer, each token ID is converted into a dense vector via an **embedding lookup table**:

```
token_id 39963 → embedding vector ∈ ℝ^d_model
  d_model = 768 (BERT base), 1024 (GPT-2 medium), 4096 (Llama 3.1 8B), 8192 (GPT-4)
```

The embedding table has `vocab_size × d_model` parameters (for Llama 3.1 8B: 128K × 4096 ≈ 500M parameters — 7.5% of the model is just the embedding table).

**Positional encoding:** Self-attention is position-agnostic by default (attends to all tokens equally). A positional encoding is added to each token's embedding to give the model a sense of order. Modern LLMs use **RoPE (Rotary Position Embedding)** which encodes relative positions and generalises better to long contexts.

---

### 36.4 The Transformer Block

Each transformer layer (there are many — 32 in Llama 3.1 8B, 96 in GPT-4) contains:

```
Input tokens (as vectors)
    ↓
[Layer Norm]
    ↓
[Multi-Head Self-Attention]   ← where "reading" happens
    ↓
[Residual connection: output = input + attention_output]
    ↓
[Layer Norm]
    ↓
[Feed-Forward Network (MLP)]  ← where "knowledge" is stored
    ↓
[Residual connection: output = input + mlp_output]
    ↓
Output vectors (updated token representations)
```

**Why residual connections?** Adding the input back to each sub-layer's output prevents vanishing gradient during training and lets early layers pass information unchanged to later layers.

---

### 36.5 Multi-Head Self-Attention (MHA)

This is the core mechanism of the transformer. For each token, it answers: **"which other tokens in the sequence are relevant to me, and how much?"**

**Single attention head:**

```
For each token position i:
  Query: Qᵢ = Wq × xᵢ    ← "what am I looking for?"
  Key:   Kⱼ = Wk × xⱼ    ← "what does token j have to offer?"
  Value: Vⱼ = Wv × xⱼ    ← "what information does j contribute?"

  Attention score: aᵢⱼ = softmax(QᵢKⱼᵀ / √d_k)
  Output for i:   oᵢ = Σⱼ aᵢⱼ × Vⱼ
```

Intuition: the Query is a question, the Key is an index card, and the dot product measures how well they match. The softmax turns scores into a probability distribution (attention weights). The Value is the information retrieved weighted by that attention.

**Multi-head attention:** Run `n_heads` independent attention heads in parallel with different Wq/Wk/Wv projections, then concatenate and project back:

```python
# Simplified multi-head attention
class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, n_heads):
        super().__init__()
        self.d_k = d_model // n_heads
        self.n_heads = n_heads
        self.Wq = nn.Linear(d_model, d_model)  # projects to all heads at once
        self.Wk = nn.Linear(d_model, d_model)
        self.Wv = nn.Linear(d_model, d_model)
        self.Wo = nn.Linear(d_model, d_model)  # output projection

    def forward(self, x):
        B, T, C = x.shape  # batch, sequence length, d_model
        Q = self.Wq(x).reshape(B, T, self.n_heads, self.d_k).transpose(1, 2)
        K = self.Wk(x).reshape(B, T, self.n_heads, self.d_k).transpose(1, 2)
        V = self.Wv(x).reshape(B, T, self.n_heads, self.d_k).transpose(1, 2)

        # Scaled dot-product attention
        scores = (Q @ K.transpose(-2, -1)) / math.sqrt(self.d_k)
        scores = scores.masked_fill(mask == 0, -1e9)  # causal mask
        attn = F.softmax(scores, dim=-1)
        out = attn @ V

        # Concat heads and project
        out = out.transpose(1, 2).reshape(B, T, C)
        return self.Wo(out)
```

**Why multiple heads?** Each head learns a different type of relationship. Head 1 might learn syntactic dependencies (subject↔verb), head 2 might learn coreference (pronoun↔noun), head 3 might learn semantic similarity. Multi-head = multi-perspective reading.

**GQA (Grouped Query Attention):** Modern LLMs (Llama 3.1, Gemma, Mistral) use GQA — multiple query heads share a single key/value head. This reduces KV cache size dramatically (key for long contexts), enabling 128K context windows without memory explosion.

---

### 36.6 Feed-Forward Network (FFN)

The FFN in each transformer layer is where the model stores "knowledge" — factual associations learned during training. It's a two-layer MLP with a large hidden dimension:

```python
class FFN(nn.Module):
    def __init__(self, d_model, d_ff=4):  # d_ff typically 4× d_model
        super().__init__()
        self.fc1 = nn.Linear(d_model, d_model * d_ff)  # expand
        self.fc2 = nn.Linear(d_model * d_ff, d_model)  # project back

    def forward(self, x):
        return self.fc2(F.gelu(self.fc1(x)))
# Llama 3.1 8B: d_model=4096, d_ff=14336 (3.5×) — uses SwiGLU activation
```

The FFN has ~2/3 of all model parameters. Research (Geva et al. 2021) shows individual FFN neurons activate for specific semantic concepts — like a key-value memory store where "Paris" activates the "capital of France" neurons.

---

### 36.7 The Full Forward Pass (Inference)

```
1. Tokenise input → token IDs
2. Embed each token ID → dense vectors (d_model)
3. Add positional embeddings (RoPE)
4. Pass through N transformer blocks:
   a. LayerNorm → Multi-Head Self-Attention → Add residual
   b. LayerNorm → Feed-Forward Network → Add residual
5. Final LayerNorm
6. Project to vocabulary: linear(d_model → vocab_size)
7. Softmax → probability distribution over all tokens
8. Sample next token (temperature controls randomness)
9. Append token, repeat from step 3 (autoregressive generation)
```

**Why autoregressive generation is slow:** Each new token requires a full forward pass through all N layers. A 32-layer model with 4096 d_model generates each token sequentially. This is why GPT-4o generates ~50 tokens/sec — it's running a 175B-parameter matrix multiplication for every single token.

**KV Cache:** Stores computed Key and Value tensors from previous tokens so only the new token's Q/K/V need to be computed each step. Without KV cache: O(n²) computation per step. With KV cache: O(n) per step but O(n × d_model × n_heads × n_layers) memory. For a 128K context window: KV cache can be 50GB+ — why long contexts are expensive.

---

### 36.8 Context Window, Temperature & Sampling

**Context window:** The maximum total tokens (input + output) the model can attend to. Everything outside the window is invisible. Modern values: 128K (Llama 3.1), 200K (Claude), 1M (Gemini 1.5).

**Temperature:** Scales the logits before softmax. `temperature = 0` → always pick the highest-probability token (deterministic). `temperature = 1` → sample proportionally. `temperature > 1` → more random. For classification/JSON: use 0. For creative tasks: use 0.7–1.0.

**Top-p (nucleus sampling):** Sample from the smallest set of tokens whose cumulative probability exceeds p. `top_p=0.9` cuts off the long tail of improbable tokens. Prevents bizarre outputs while maintaining diversity.

**Key insight for engineers:** Context window ≠ free. Every token in context costs both compute and memory. A 128K context query costs ~16× more than an 8K one. Profile your average context lengths and optimize.

> 🎯 **MAANG Interview Connection:** "Explain how a transformer generates text." → Walk through tokenisation → embedding → attention (Q, K, V, scaled dot-product) → FFN → autoregressive sampling. Emphasise KV cache for inference efficiency. "Why is GPT-4 slower than Haiku?" → More layers (96 vs 32), larger d_model (8192 vs 1024), same autoregressive bottleneck.

---

## Module 37 — Knowledge Graphs, GraphRAG & PageIndex

> **Why this module matters:** Standard RAG retrieves isolated text chunks. Knowledge graphs capture *relationships* between entities — enabling multi-hop reasoning, global synthesis, and answering questions that span entire document corpora. PageIndex challenges the embedding assumption entirely. This module covers when each approach wins.

---

### 37.1 What is a Knowledge Graph?

A knowledge graph is a structured representation of entities and their relationships as a directed graph:

```
Nodes (entities):  "Housing.com", "Anuj Puri", "Bandra", "2BHK"
Edges (relations): Housing.com --[employs]--> Anuj Puri
                   Anuj Puri   --[is chairman of]--> Housing.com
                   Bandra      --[is locality in]--> Mumbai
                   2BHK        --[listed in]--> Bandra
```

**Why graphs beat flat text for relational queries:**
- "Who are all the executives connected to Housing.com and what roles do they hold?" → requires traversing the graph
- "What localities in Mumbai have 2BHK under 2Cr with metro access?" → multi-hop: locality → price → amenity
- Flat RAG retrieves chunks that mention "Mumbai" and "2BHK" separately; it can't reason about relationships between them

**Property graphs vs RDF triples:**
- Property graph: nodes and edges both carry arbitrary key-value properties (Neo4j model — more practical for product engineering)
- RDF triples: subject-predicate-object in a strict schema (W3C semantic web — more rigorous, harder to work with)

---

### 37.2 Building a Knowledge Graph (Manually and via LLM)

**Traditional approach (NLP pipeline):**
1. Named Entity Recognition (NER) → extract entities
2. Relation extraction → classify entity pairs into relation types
3. Graph population → upsert (entity, relation, entity) triples

**LLM-powered extraction (the modern approach):**

```python
from langchain_community.graphs import Neo4jGraph
from langchain_experimental.graph_transformers import LLMGraphTransformer
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-haiku-4-5-20251001", temperature=0)
transformer = LLMGraphTransformer(llm=llm)

from langchain_core.documents import Document
docs = [Document(page_content="""
  Housing.com is an Indian real estate portal. Anuj Puri is the chairman.
  The Mumbai office is in Bandra West, close to the BKC business district.
""")]

graph_docs = transformer.convert_to_graph_documents(docs)
# Returns: GraphDocument(nodes=[Node(id='Housing.com', type='Organisation'), ...],
#          relationships=[Relationship(source=..., target=..., type='EMPLOYS')])

graph = Neo4jGraph(url="bolt://localhost:7687", username="neo4j", password="...")
graph.add_graph_documents(graph_docs)
```

**Cypher queries on Neo4j:**

```cypher
// Find all entities connected to Housing.com within 2 hops
MATCH (h:Organisation {id: 'Housing.com'})-[:EMPLOYS|LOCATED_IN*1..2]->(connected)
RETURN connected.id, labels(connected)

// Graph + vector hybrid: vector search → find related entities via graph
MATCH (p:Property)-[:LOCATED_IN]->(l:Locality {name: 'Bandra'})
WHERE p.price < 20000000
RETURN p, l
```

---

### 37.3 GraphRAG — Microsoft's Graph-Augmented RAG

GraphRAG (Microsoft Research, 2024) builds a full knowledge graph from a document corpus, runs community detection on it, and uses LLM-generated community summaries to answer both local and global queries.

**Indexing pipeline (offline, runs once):**

```
Documents
  ↓ chunk into ~600-token units
  ↓ LLM extracts (entity, relation, entity) triples from each chunk
  ↓ Merge into global knowledge graph (deduplicate entities)
  ↓ Leiden algorithm detects communities (clusters of related entities)
  ↓ LLM writes a summary for each community at each hierarchy level
  → Stored: graph + community summaries + source text
```

**Leiden algorithm:** Hierarchical community detection (better than Louvain — fixes resolution limit). Level 0 = 10 broad themes. Level 3 = 500 fine-grained clusters. Think of it as automatic "chapter detection" across your entire corpus.

**Query — two modes:**

```python
# Install and index
# pip install graphrag
# graphrag index --root ./my_project

# Global search (thematic, synthesis): "What are the main risk factors?"
# → distributes question across all community summaries → map-reduce → final answer
graphrag query --root ./my_project --method global \
  --query "What are the main themes discussed across all documents?"

# Local search (specific, factual): entity-centric
# → extract entities from query → retrieve neighbourhood → answer
graphrag query --root ./my_project --method local \
  --query "What is the relationship between Housing.com and PropTiger?"
```

**Global search — map-reduce pattern:**

```
Query → Distribute across 50 community summaries (parallel LLM calls)
      → Each returns a partial answer with relevance score
      → Reduce: aggregate top-k partial answers → final synthesised answer
```

**Cost reality check:** GraphRAG indexing requires ~1 LLM call per 600-token chunk for entity extraction + 1 LLM call per community for summarisation. A 1,000-page document corpus = ~3,000 chunks → several hundred dollars of LLM API calls. Best for corpora that change rarely but are queried heavily.

| | Standard RAG | GraphRAG |
|---|---|---|
| Multi-doc synthesis | Poor | Excellent |
| Thematic/global queries | Fails | Strong (community summaries) |
| Specific factual lookup | Good | Good (local search) |
| Indexing cost | Low | High (many LLM calls) |
| Query latency | Fast | Moderate–slow |
| Best for | FAQ, factual lookup | Complex corpora, exploratory Q&A |

---

### 37.4 PageIndex — Vectorless RAG

PageIndex (VectifyAI, 2025) replaces embedding similarity search entirely with LLM-powered navigation of a hierarchical tree index built from document structure.

**How it works:**

```
Indexing:
  1. Parse document → detect Table of Contents structure
  2. Build hierarchical tree: root → sections → subsections → paragraphs
  3. LLM generates a summary for each node (stored in tree, no vectors)

Retrieval:
  1. LLM receives top-level tree (root summaries only)
  2. LLM reasons: "The debt section is likely in Appendix G → navigate there"
  3. LLM requests child nodes → drills deeper → retrieves exact pages
  4. Only relevant pages go into generation context
```

```python
from pageindex import PageIndex

pi = PageIndex("annual_report.pdf")
pi.build_index()  # no embeddings, no vector DB

answer = pi.query("What was the operating margin in Q3?")
# LLM navigates tree: root → Financial Results → Q3 section → exact table
```

**Comparison: PageIndex vs Traditional RAG:**

| | Traditional RAG | PageIndex |
|---|---|---|
| Retrieval mechanism | Cosine similarity on embeddings | LLM tree traversal (reasoning) |
| Chunking | Fixed-size windows | Natural document structure |
| Infrastructure | Vector DB required | None |
| Failure mode | Semantic drift, boundary issues | Extra LLM calls (cost + latency) |
| Accuracy (their claim) | ~80–85% on structured docs | 98.7% on structured doc Q&A |
| Best for | Large corpora, fuzzy matching | Structured docs (reports, manuals) |

**When PageIndex wins:** Financial reports, legal contracts, technical manuals, any document with clear hierarchical structure where you need precision answers to specific questions. When standard RAG wins: large unstructured corpora where semantic similarity is the right retrieval signal.

---

### 37.5 Hybrid RAG — Combining Graph + Vector + Keyword

Real production systems combine multiple retrieval strategies:

```python
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever
from langchain_community.vectorstores import Chroma

# Vector retrieval (semantic similarity)
vector_retriever = chroma_store.as_retriever(search_kwargs={"k": 5})

# Keyword retrieval (exact match, BM25)
bm25_retriever = BM25Retriever.from_documents(documents, k=5)

# Graph retrieval (relationship-aware)
def graph_retriever(query: str) -> list[Document]:
    entities = extract_entities(query)  # NER
    cypher = f"MATCH (e)-[r]-(n) WHERE e.id IN {entities} RETURN e, r, n"
    graph_results = graph.query(cypher)
    return [Document(page_content=format_graph_result(r)) for r in graph_results]

# Ensemble: combine all three with weights
ensemble = EnsembleRetriever(
    retrievers=[vector_retriever, bm25_retriever],
    weights=[0.5, 0.5]
)

# Full hybrid pipeline:
# 1. BM25 for exact keyword matches (high precision)
# 2. Vector search for semantic matches (high recall)
# 3. Graph traversal for relational queries
# 4. Rerank combined results with cross-encoder
```

**When to use each retrieval component:**

| Signal | Use BM25 | Use Vector | Use Graph |
|---|---|---|---|
| Exact product names/codes | ✓ | — | — |
| "Apartments similar to this" | — | ✓ | — |
| "Who else works with X" | — | — | ✓ |
| General semantic questions | — | ✓ | — |

> 🎯 **MAANG Interview Connection:** "How would you retrieve relevant context for a question like 'What are all the legal risks mentioned in this document corpus?'" → GraphRAG with global search (community summaries surface themes). "For 'What does section 4.2 of this contract say about indemnification?'" → PageIndex (structured document, precise navigation). "For 'Find properties similar to this listing.'" → Vector search (semantic embedding similarity).

---

## Module 38 — Advanced RAG: Agentic RAG, Hybrid Techniques & Deep Internals

> **Why this module matters:** Modules 27 and 28 covered the RAG landscape at a high level. This module goes deeper: the internal mechanics of query transformation, why certain techniques work, Agentic RAG as a tool-using pattern, and how to compose multiple RAG strategies for production accuracy.

---

### 38.1 Query Transformation Techniques

The bottleneck in most RAG pipelines is not generation — it's retrieval. The query sent to the vector store is often too short, ambiguous, or phrased differently than the indexed documents. Query transformation bridges that gap.

**38.1.1 HyDE (Hypothetical Document Embedding)**

```python
from langchain.chains import HypotheticalDocumentEmbedder
from langchain_anthropic import ChatAnthropic
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

llm = ChatAnthropic(model="claude-haiku-4-5-20251001")

# Step 1: Generate a hypothetical answer to the query
hyde_prompt = """Write a short, direct answer to this question as if you were an expert.
The answer will be used to find similar documents, not shown to the user.
Question: {question}"""

# Step 2: Embed the hypothetical answer (not the original query!)
# The hypothesis is longer and uses domain vocabulary → better vector match
hyde_embedder = HypotheticalDocumentEmbedder.from_llm(
    llm=llm,
    base_embeddings=OpenAIEmbeddings(),
    custom_prompt=hyde_prompt,
)
retriever = Chroma(embedding_function=hyde_embedder).as_retriever()
```

Why it works: "What is the 3BHK price in Bandra?" as a query vector is distant from document vectors that say "Three-bedroom flat in Bandra West, 1.8 crore." A hypothetical document that answers the question uses the same vocabulary as the indexed text.

**38.1.2 Multi-Query Retriever**

```python
from langchain.retrievers.multi_query import MultiQueryRetriever

# Generates 3–5 reformulations of the original query, retrieves for each
retriever = MultiQueryRetriever.from_llm(
    retriever=base_retriever,
    llm=llm,
)
# "2BHK in Bandra under 2Cr" becomes:
# → "2 bedroom apartment Bandra price less than 2 crore"
# → "flat for sale Bandra west 2 bedroom budget 2Cr"
# → "Bandra residential property 2BHK below 20 lakhs"
# Union of results from all queries → better recall
```

**38.1.3 Step-Back Prompting**

Retrieve more general context before the specific one:

```python
# Original: "What amenities are available at Lodha World One?"
# Step-back: "What types of amenities are typically found in luxury Mumbai skyscrapers?"
# → Retrieve general amenity descriptions first → then specific building details
# Useful when the specific query is too narrow to match training vocabulary
```

---

### 38.2 Retrieval Strategies Deep Dive

**38.2.1 Contextual Compression Retrieval**

Retrieved chunks often contain only a small relevant passage within a larger block. Contextual compression extracts just the relevant portion:

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor

compressor = LLMChainExtractor.from_llm(llm)
compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=base_retriever,
)
# A 1000-token chunk about Bandra → compressor extracts the 80-token relevant passage
```

**38.2.2 Time-Weighted Retrieval**

For knowledge bases that update frequently, weight recent documents higher:

```python
from langchain.retrievers import TimeWeightedVectorStoreRetriever

retriever = TimeWeightedVectorStoreRetriever(
    vectorstore=chroma_store,
    decay_rate=0.01,   # score × 0.99^(days_since_last_access)
    k=5,
)
# Listings indexed today score higher than listings indexed 6 months ago
```

**38.2.3 Self-Query Retrieval**

Parses natural language into structured metadata filters + semantic query:

```python
from langchain.retrievers.self_query.base import SelfQueryRetriever
from langchain.chains.query_constructor.base import AttributeInfo

metadata_field_info = [
    AttributeInfo(name="city",     description="City name", type="string"),
    AttributeInfo(name="bedrooms", description="Number of bedrooms", type="integer"),
    AttributeInfo(name="price",    description="Price in INR", type="integer"),
]
retriever = SelfQueryRetriever.from_llm(
    llm, vectorstore, "Property listings in India", metadata_field_info,
)
# "3BHK in Mumbai under 2Cr" →
# semantic_query: "3 bedroom apartment"
# filter: city == "Mumbai" AND bedrooms == 3 AND price <= 20000000
```

---

### 38.3 Agentic RAG

Standard RAG retrieves once per query. Agentic RAG uses RAG as a tool inside a reasoning loop — enabling multi-hop retrieval, adaptive strategies, and self-verification.

**Pattern 1: RAG as a tool (most common)**

```python
from langchain.tools import Tool

search_tool = Tool(
    name="property_search",
    description="Search property listings by location, price, and bedrooms",
    func=lambda q: vectorstore.similarity_search(q, k=3),
)

# The agent decides WHEN to retrieve and WHAT to retrieve
# → "I need to check Bandra prices before I can compare to Powai"
# → Calls search_tool("Bandra 2BHK prices")
# → Calls search_tool("Powai 2BHK prices")
# → Compares and responds
executor = AgentExecutor(agent=react_agent, tools=[search_tool, calc_tool])
```

**Pattern 2: Corrective RAG (CRAG)**

Evaluates retrieved context quality and falls back to web search if context is irrelevant:

```python
def corrective_retriever(query: str, threshold: float = 0.6) -> list[Document]:
    docs = vectorstore.similarity_search_with_score(query, k=3)

    # Grade each retrieved doc
    relevant_docs = []
    for doc, score in docs:
        relevance_prompt = f"Is this document relevant to '{query}'? Answer yes/no.\n{doc.page_content}"
        is_relevant = llm.invoke(relevance_prompt).content.lower().startswith("yes")
        if is_relevant:
            relevant_docs.append(doc)

    if len(relevant_docs) == 0:
        # Fall back to web search
        return web_search_retriever(query)
    return relevant_docs
```

**Pattern 3: Adaptive RAG**

Routes queries to different retrieval strategies based on query type:

```python
def route_query(query: str) -> str:
    routing_prompt = f"""Classify this query:
    - "local": can be answered from the property database
    - "general": requires general knowledge about real estate
    - "calculation": requires arithmetic (EMI, ROI, etc.)
    Query: {query}
    Answer with one word only."""
    return llm.invoke(routing_prompt).content.strip()

def adaptive_rag(query: str) -> str:
    route = route_query(query)
    if route == "local":
        context = vectorstore.similarity_search(query)
    elif route == "general":
        context = web_search(query)
    else:  # calculation
        return calculator_chain.invoke(query)
    return generate_answer(query, context)
```

**Pattern 4: Self-RAG (Retrieve-only-when-needed)**

The model generates a "retrieve?" token before deciding to call retrieval:

```python
# Self-RAG adds special tokens during fine-tuning:
# [Retrieve]: model decides retrieval is needed
# [ISREL]: is the retrieved context relevant?
# [ISSUP]: does the context support this claim?
# [ISUSE]: is the output useful overall?

# In practice without fine-tuning, simulate via LLM grading:
def self_rag_generate(query: str) -> str:
    # Does this query need external knowledge?
    needs_retrieval = llm.invoke(
        f"Does answering '{query}' require looking up specific data? Answer yes/no."
    ).content.lower().startswith("yes")

    if needs_retrieval:
        docs = vectorstore.similarity_search(query)
        return rag_chain.invoke({"question": query, "context": docs})
    else:
        return direct_llm.invoke(query).content  # skip retrieval entirely
```

---

### 38.4 Advanced Reranking

Retrieval is approximate (top-k by cosine similarity). Reranking re-scores with a more accurate but slower model:

```python
from cohere import Client as CohereClient

def rerank_results(query: str, docs: list[Document], top_n: int = 3) -> list[Document]:
    cohere = CohereClient()
    results = cohere.rerank(
        model="rerank-english-v3.0",
        query=query,
        documents=[doc.page_content for doc in docs],
        top_n=top_n,
    )
    return [docs[r.index] for r in results.results]

# Pipeline: retrieve k=10 → rerank to top 3 → generate with top 3 only
# Why: vector similarity ≠ relevance to the specific question
# Cohere rerank understands the question-document relationship more accurately
```

**FlashRank (free, self-hosted alternative):**

```python
from flashrank import Ranker, RerankRequest

ranker = Ranker(model_name="ms-marco-MiniLM-L-12-v2")  # runs locally, no API
request = RerankRequest(query=query, passages=[{"id": i, "text": d.page_content} for i, d in enumerate(docs)])
results = ranker.rerank(request)
```

---

### 38.5 RAG Failure Modes & Systematic Diagnosis

```
RAGAS diagnostic framework (Module 18) → root cause for each score:

Low context_precision (irrelevant chunks retrieved):
  → Shrink chunk_size OR add metadata filters OR use self-query retrieval

Low context_recall (relevant chunks missed):
  → Increase k OR use hybrid BM25+vector OR use multi-query retrieval

Low faithfulness (answer not grounded in context):
  → Add explicit instruction: "Answer ONLY from the context below"
  → Lower temperature to 0
  → Add citation requirement in prompt

Low answer_relevance (answer is off-topic):
  → Check prompt structure — is the question passed correctly?
  → Add query rewriting step

All scores low → dataset / indexing problem, not a prompting problem
  → Review chunk quality, embedding model, document loading
```

> 🎯 **MAANG Interview Connection:** "How do you debug a RAG pipeline that gives poor answers?" → Start with RAGAS metrics to isolate retrieval vs generation. "If context_recall < 0.7, I'd look at chunk size and retrieval k. If faithfulness < 0.7, it's a generation/prompt problem — the model is hallucinating beyond the context." Then show the corrective RAG or adaptive routing pattern for production.

---

## Module 39 — LangGraph Deep Constructs

> **Why this module matters:** Module 24 introduced LangGraph conceptually. This module goes to the implementation level — every primitive you need to build production agents: state design, node patterns, conditional routing, the @tool decorator, HITL interrupts, and streaming.

---

### 39.1 State Design — The Foundation

State is the shared data structure that all nodes read from and write to. Design it wrong and your graph becomes a debugging nightmare.

```python
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages

# Pattern 1: Message-centric (conversational agents)
class ChatState(TypedDict):
    messages: Annotated[list, add_messages]  # add_messages = append, not replace

# Pattern 2: Structured pipeline (ETL-style)
class PipelineState(TypedDict):
    query: str                    # input — immutable through pipeline
    retrieved_docs: list[dict]    # written by retrieval node
    generated_answer: str         # written by generation node
    citations: list[str]          # written by citation node
    error: str | None             # any node can write here on failure

# Pattern 3: Hybrid (agent with structured metadata)
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    intent: str         # classified by intent node
    tool_results: dict  # accumulated tool outputs
    iteration: int      # loop counter for bounded recursion
```

**Critical gotcha — `add_messages` reducer:**

```python
# WITHOUT add_messages:
state["messages"] = new_message  # REPLACES the entire list → loses history

# WITH add_messages:
state = {"messages": [new_message]}  # APPENDS to existing list → correct
# This is the most common LangGraph bug for beginners
```

---

### 39.2 Nodes — The Building Blocks

Nodes are plain Python functions that take state and return a partial state update:

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage

llm = ChatAnthropic(model="claude-haiku-4-5-20251001", temperature=0)

def intent_classifier_node(state: AgentState) -> AgentState:
    """Classifies the user's intent from the last message."""
    last_message = state["messages"][-1].content
    intent = classify_intent(last_message)  # your classifier
    return {"intent": intent}  # only return fields you modified

def llm_node(state: AgentState) -> AgentState:
    """Calls the LLM with the current message history."""
    system = SystemMessage(content="You are a housing assistant.")
    response = llm.invoke([system, *state["messages"]])
    return {"messages": [response]}  # add_messages appends this

def tool_executor_node(state: AgentState) -> AgentState:
    """Executes the tool call in the last message."""
    last_msg = state["messages"][-1]
    tool_call = last_msg.tool_calls[0]
    result = execute_tool(tool_call["name"], tool_call["args"])
    return {"messages": [ToolMessage(content=str(result), tool_call_id=tool_call["id"])],
            "tool_results": {tool_call["name"]: result}}

# Async node (for I/O-bound operations)
async def async_search_node(state: AgentState) -> AgentState:
    results = await asyncio.gather(*[search(q) for q in state["queries"]])
    return {"retrieved_docs": list(results)}
```

---

### 39.3 Edges — Connecting Nodes

```python
from langgraph.graph import StateGraph, START, END

graph = StateGraph(AgentState)

# Add nodes
graph.add_node("intent", intent_classifier_node)
graph.add_node("llm", llm_node)
graph.add_node("tools", tool_executor_node)

# Fixed edges (always execute)
graph.add_edge(START, "intent")    # entry point
graph.add_edge("intent", "llm")   # always go to LLM after intent

# Back-edge (creates a cycle — this is what makes it an agent, not a chain)
graph.add_edge("tools", "llm")    # after tool execution, go back to LLM
```

---

### 39.4 Conditional Edges — Routing Logic

```python
from typing import Literal

def route_after_llm(state: AgentState) -> Literal["tools", "end"]:
    """Decide: does the LLM want to call a tool, or is it done?"""
    last_msg = state["messages"][-1]
    if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
        return "tools"  # LLM requested a tool call
    return "end"        # LLM produced a final answer

def route_by_intent(state: AgentState) -> Literal["property_search", "emi_calc", "general"]:
    """Route to specialist handler based on classified intent."""
    intent_map = {
        "property_search": "property_search",
        "emi_calculation": "emi_calc",
    }
    return intent_map.get(state["intent"], "general")

# Wire conditional routing
graph.add_conditional_edges(
    "llm",
    route_after_llm,
    {
        "tools": "tools",  # mapping: return value → node name
        "end": END,
    }
)

graph.add_conditional_edges("intent", route_by_intent)
```

---

### 39.5 The @tool Decorator

The `@tool` decorator is the standard way to define LangGraph/LangChain tools. It auto-generates JSON schema from the function's type hints and docstring:

```python
from langchain_core.tools import tool
from pydantic import BaseModel, Field

# Simple tool
@tool
def search_properties(query: str, max_results: int = 5) -> list[dict]:
    """Search property listings by natural language query.

    Args:
        query: Natural language description of desired property
        max_results: Maximum number of results to return
    """
    return property_db.search(query, limit=max_results)

# Typed tool with Pydantic schema (preferred for complex inputs)
class PropertyFilterInput(BaseModel):
    city: str = Field(description="City name, e.g. 'Mumbai'")
    bedrooms: int = Field(ge=1, le=10, description="Number of bedrooms")
    max_price: int = Field(description="Maximum price in INR")
    furnished: bool = Field(default=False)

@tool(args_schema=PropertyFilterInput)
def filter_properties(city: str, bedrooms: int, max_price: int, furnished: bool) -> list[dict]:
    """Filter property listings by specific criteria."""
    return property_db.filter(
        city=city, bedrooms=bedrooms,
        max_price=max_price, furnished=furnished,
    )

# Bind tools to LLM — LLM can now call them
llm_with_tools = llm.bind_tools([search_properties, filter_properties])

# Tool inspection (auto-generated schema)
print(search_properties.name)          # "search_properties"
print(search_properties.description)   # "Search property listings..."
print(search_properties.args_schema)   # {"query": {"type": "string"}, ...}
```

---

### 39.6 Tool Node — Executing Tool Calls

LangGraph provides a built-in `ToolNode` that automatically handles tool dispatch:

```python
from langgraph.prebuilt import ToolNode, tools_condition

tools = [search_properties, filter_properties, calculate_emi]
tool_node = ToolNode(tools)

# Use tools_condition as a convenience routing function
# Returns "tools" if last message has tool_calls, "__end__" otherwise
graph.add_conditional_edges("llm", tools_condition)
graph.add_edge("tools", "llm")  # loop back after tool execution
```

---

### 39.7 Checkpointing — Persistent Memory Across Turns

```python
from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.sqlite import SqliteSaver

# In-memory (dev/testing)
memory = MemorySaver()
app = graph.compile(checkpointer=memory)

# SQLite (production single-server)
with SqliteSaver.from_conn_string("./checkpoints.db") as checkpointer:
    app = graph.compile(checkpointer=checkpointer)

# Using thread_id for multi-user isolation
config = {"configurable": {"thread_id": "user_123_session_456"}}

# Turn 1
result1 = app.invoke({"messages": [HumanMessage("What's the price in Bandra?")]}, config)

# Turn 2 — graph automatically loads checkpoint from thread_id
result2 = app.invoke({"messages": [HumanMessage("And in Powai?")]}, config)
# "And in Powai?" makes sense because context from turn 1 is loaded from checkpoint
```

---

### 39.8 Human-in-the-Loop (HITL) Interrupts

```python
# Compile with interrupt_before to pause before the tools node
app = graph.compile(
    checkpointer=memory,
    interrupt_before=["tools"],  # pause HERE, before executing tools
)

config = {"configurable": {"thread_id": "approval_flow_1"}}

# Step 1: Run until interrupt
state = app.invoke({"messages": [HumanMessage("Buy 100 units of Bandra listing #456")]}, config)
# Graph pauses at "tools" — no tool has been called yet

# Step 2: Inspect what tool call is pending
pending = state["messages"][-1]  # AIMessage with tool_calls
print(f"Pending tool call: {pending.tool_calls}")
# → {"name": "execute_purchase", "args": {"listing_id": 456, "units": 100}}

# Step 3a: Approve — resume with None (no state change)
result = app.invoke(None, config)  # passes None = "resume from checkpoint"

# Step 3b: Reject — modify state before resuming
from langgraph.types import Command
result = app.invoke(
    Command(update={"messages": [HumanMessage("Rejected by compliance team.")]}),
    config
)
```

---

### 39.9 Streaming Node Events

```python
# Stream individual node outputs as they complete
async for event in app.astream_events(
    {"messages": [HumanMessage("Find me a 3BHK in Bandra")]},
    config=config,
    version="v2",
):
    if event["event"] == "on_chat_model_stream":
        # Individual tokens from LLM
        token = event["data"]["chunk"].content
        print(token, end="", flush=True)

    elif event["event"] == "on_tool_start":
        print(f"\n[Tool called: {event['name']}]")

    elif event["event"] == "on_tool_end":
        print(f"[Tool result: {event['data']['output'][:100]}...]")
```

> 🎯 **MAANG Interview Connection:** "How would you build a stateful multi-turn agent with tool use?" → Walk through: TypedDict state with add_messages reducer → nodes as pure functions returning partial state → conditional edge routing (has tool_calls? → tools node → back to LLM) → SqliteSaver checkpointing keyed on thread_id → interrupt_before=["payment_tool"] for high-risk operations.

---

## Module 40 — Model Context Protocol (MCP)

> **Why this module matters:** MCP is Anthropic's open protocol for connecting LLMs to external data sources and tools in a standardised way. Think of it as USB-C for AI: one connector, any host, any server. This module covers the full MCP architecture — and builds a real Housing.com MCP server.

---

### 40.1 What MCP Is and Why It Exists

Before MCP, every AI application wrote custom integration code to connect the LLM to each data source — a database adapter here, a REST client there. This didn't compose: if you had 10 tools and 5 LLM hosts, you needed 50 custom integrations.

MCP standardises the interface:

```
MCP Host (Claude Desktop / Claude Code / Cursor / VS Code)
    ↕  MCP Client (one per server, inside the host)
    ↕  [Transport: stdio OR HTTP+SSE]
MCP Server (your code: exposes tools, resources, prompts)
    ↕
External Data (databases, APIs, filesystems, services)
```

**Three server primitives:**

| Primitive | Analogy | Purpose |
|---|---|---|
| **Tools** | POST endpoint | Execute code, cause side effects |
| **Resources** | GET endpoint | Load data/context into LLM |
| **Prompts** | Prompt templates | Reusable prompt patterns |

**Two transport types:**
- **stdio:** server runs as a subprocess, host writes JSON-RPC to stdin, reads from stdout. Best for local/desktop integrations.
- **HTTP + SSE:** server is a remote HTTP service, client POSTs requests, server streams responses. Best for cloud-deployed servers.

---

### 40.2 Building an MCP Server with FastMCP

FastMCP is the official Python SDK — it auto-generates JSON schemas from type hints and handles the JSON-RPC protocol for you:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Housing Property Search")

# Tool: causes side effects, returns data
@mcp.tool()
def search_listings(city: str, max_price: int, bedrooms: int = 2) -> list[dict]:
    """Search property listings by city, price, and bedroom count.

    Args:
        city: City name, e.g. 'Mumbai', 'Bangalore'
        max_price: Maximum price in INR
        bedrooms: Number of bedrooms required (default: 2)
    """
    return property_db.search(
        city=city, max_price=max_price, bedrooms=bedrooms
    )

# Resource: loads context without side effects
@mcp.resource("listings://{city}/summary")
def city_summary(city: str) -> str:
    """Get a market summary for a city."""
    stats = property_db.get_city_stats(city)
    return f"{city} has {stats['count']} active listings. Avg price: ₹{stats['avg_price']:,}"

# Prompt template: reusable LLM prompt
@mcp.prompt()
def property_advisor(city: str, budget: int) -> str:
    """A property advisor prompt customised for a user's city and budget."""
    return f"""You are a real estate advisor for {city}.
    The user's budget is ₹{budget:,}.
    Focus on value-for-money recommendations.
    Always mention price per square foot when relevant."""

if __name__ == "__main__":
    mcp.run()               # stdio transport (default)
    # mcp.run(transport="sse", port=8001)  # HTTP+SSE for cloud
```

---

### 40.3 MCP Wire Protocol (JSON-RPC 2.0)

```json
// Step 1: Client initialises, declares capabilities
{"jsonrpc":"2.0","id":1,"method":"initialize",
 "params":{"protocolVersion":"2025-11-25",
           "capabilities":{"tools":{}},"clientInfo":{"name":"ClaudeCode"}}}

// Step 2: Server responds with its capabilities
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-11-25",
  "capabilities":{"tools":{"listChanged":true}},"serverInfo":{"name":"Housing"}}}

// Step 3: Client lists available tools
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
// Server returns: [{"name":"search_listings","inputSchema":{...}}]

// Step 4: Client calls a tool
{"jsonrpc":"2.0","id":3,"method":"tools/call",
 "params":{"name":"search_listings","arguments":{"city":"Mumbai","max_price":20000000}}}

// Server returns: [{"type":"text","text":"[{listing data}]"}]
```

---

### 40.4 Registering MCP in Claude Code

Create `.claude/mcp.json` in your project or update `~/.claude/mcp.json` for global registration:

```json
{
  "mcpServers": {
    "housing-search": {
      "command": "python",
      "args": ["src/mcp/housing_server.py"],
      "env": { "DATABASE_URL": "${DATABASE_URL}" }
    },
    "housing-search-remote": {
      "type": "sse",
      "url": "https://mcp.housing.com/sse",
      "headers": { "Authorization": "Bearer ${MCP_TOKEN}" }
    }
  }
}
```

Once registered, Claude Code can call your tools natively: "Search for 2BHK listings in Bandra under 2Cr" → Claude calls `search_listings` automatically.

---

### 40.5 Domain-Specific MCP Server — Full Implementation

```python
# src/mcp/housing_server.py
from mcp.server.fastmcp import FastMCP
from sqlalchemy import text
from src.db.engine import get_engine

mcp = FastMCP("Housing.com Agent Tools")

@mcp.tool()
async def search_properties(
    city: str,
    bedrooms: int | None = None,
    max_price: int | None = None,
    furnished: bool | None = None,
    limit: int = 10,
) -> list[dict]:
    """Search Housing.com property listings with optional filters."""
    async with get_engine().connect() as conn:
        query = "SELECT * FROM properties WHERE city = :city"
        params: dict = {"city": city}
        if bedrooms:   query += " AND bedrooms = :bedrooms";   params["bedrooms"] = bedrooms
        if max_price:  query += " AND price <= :max_price";    params["max_price"] = max_price
        if furnished is not None:
            query += " AND furnished = :furnished"; params["furnished"] = furnished
        query += " ORDER BY price ASC LIMIT :limit"; params["limit"] = limit
        result = await conn.execute(text(query), params)
        return [dict(row) for row in result.mappings()]

@mcp.tool()
async def get_property_detail(property_id: str) -> dict:
    """Get full details for a specific property by ID."""
    async with get_engine().connect() as conn:
        result = await conn.execute(
            text("SELECT * FROM properties WHERE id = :id"), {"id": property_id}
        )
        row = result.mappings().first()
        return dict(row) if row else {"error": "Property not found"}

@mcp.tool()
def calculate_emi(principal: int, annual_rate: float, years: int) -> dict:
    """Calculate monthly EMI for a home loan.

    Args:
        principal: Loan amount in INR
        annual_rate: Annual interest rate as percentage (e.g. 8.5)
        years: Loan tenure in years
    """
    r = annual_rate / 100 / 12
    n = years * 12
    emi = principal * r * (1 + r)**n / ((1 + r)**n - 1)
    return {
        "emi_monthly": round(emi),
        "total_payment": round(emi * n),
        "total_interest": round(emi * n - principal),
    }

@mcp.resource("market://{city}/stats")
async def market_stats(city: str) -> str:
    """Get real-time market statistics for a city."""
    async with get_engine().connect() as conn:
        result = await conn.execute(text(
            "SELECT COUNT(*) cnt, AVG(price) avg_price, MIN(price) min_price "
            "FROM properties WHERE city = :city"
        ), {"city": city})
        row = result.mappings().first()
        return (f"{city} Market: {row['cnt']} listings | "
                f"Avg: ₹{row['avg_price']:,.0f} | "
                f"From: ₹{row['min_price']:,}")

@mcp.prompt()
def property_search_advisor() -> str:
    """Standard Housing.com advisor persona."""
    return """You are a Housing.com property advisor.
    Always ask for: city, budget, and bedroom preference before searching.
    Mention price per sqft when comparing properties.
    Recommend EMI calculation for any property above ₹50L."""

if __name__ == "__main__":
    import asyncio
    mcp.run()
```

---

### 40.6 MCP Security Considerations

- **Tool approval:** Claude Code prompts for user confirmation before calling any MCP tool that might cause side effects.
- **Capability scoping:** only expose what's needed. A read-only server should have no write tools.
- **Secret injection:** use `env` in `.claude/mcp.json` — never hardcode API keys in server code.
- **Input validation:** always validate tool inputs before touching the database — treat LLM-provided args like user input (potential injection).
- **Rate limiting:** wrap external API tools with backoff/retry and rate limits — Claude may call tools many times in a loop.

> 🎯 **MAANG Interview Connection:** "How would you expose your backend APIs to an LLM agent in a production-safe way?" → MCP server with explicit tool definitions. Schema validation auto-rejects malformed inputs. Separate read and write tools with different auth scopes. Register only the tools needed for the task — not the whole API surface.

---

## Module 41 — Agentic Workflows, Claude Skills & Token Optimisation

> **Why this module matters:** Modern AI development is not just coding — it's configuring, composing, and automating intelligent workflows. This module covers Claude Code's skills system, community-built workflows, GitHub Actions integration for CI, and the battle-tested patterns for keeping token usage and output quality high.

---

### 41.1 Claude Code Skills System

Skills are reusable, project-local automation units stored as `.md` files and invoked as slash commands:

```
.claude/
  skills/
    code-review.md     → /code-review
    deploy-check.md    → /deploy-check
    ai-review.md       → /ai-review
CLAUDE.md              → project-wide context injected into every session
settings.json          → hooks, permissions, allowed tools
```

**Anatomy of a skill file:**

```markdown
---
name: ai-review
description: Review staged changes for AI-specific issues (hallucination risks, prompt injection, token waste)
args:
  - name: focus
    description: "Optional: 'security', 'cost', or 'quality'"
    required: false
---

Review the staged changes in this repository. Focus on:
1. Any prompt strings that could enable prompt injection
2. LLM calls without max_tokens set (unbounded cost risk)
3. Tool schemas missing required type annotations (will cause JSON parse failures)
4. Missing RAGAS / eval coverage for new RAG pipelines

{{#if args.focus}}
Pay special attention to {{args.focus}} concerns.
{{/if}}

Run: git diff --staged
Then provide a bulleted list of issues found, severity (critical/medium/low), and suggested fix.
```

**CLAUDE.md — persistent project context:**

```markdown
# Housing.com Chatbot

## Stack
FastAPI + LangGraph + PostgreSQL + Redis + Kafka + Anthropic Claude Haiku/Sonnet

## Key conventions
- All LLM calls use claude-haiku-4-5-20251001 unless task requires reasoning
- Intent classifier returns JSON with intent, confidence, entities fields
- SSE streaming: emit_sse() puts to queue, FastAPI generator consumes
- All new tools decorated with @tool and @traceable

## When editing src/pipeline/: always read graph.py first
## Never commit .env or API keys
```

---

### 41.2 Community-Built Workflows

The `awesome-claude-code` GitHub repository (hesreallyhim/awesome-claude-code) curates community skills, hooks, and integrations. Key patterns the community has built:

**Code review workflow:**
```markdown
# .claude/skills/code-review.md
---
name: code-review
description: Review current branch changes at configurable depth
args:
  - name: depth
    description: "ultra | standard | quick"
    required: false
---
Review the changes on this branch vs main.
Depth: {{args.depth | default: "standard"}}
Focus: correctness, test coverage, security, performance.
Post inline comments with line references.
```

**Pre-commit security scan:**
```json
// settings.json — hooks run before every file write
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "grep -r 'api_key\\|password\\|secret' $CLAUDE_TOOL_INPUT_PATH && echo 'BLOCK: secret detected' && exit 1 || exit 0"
      }]
    }]
  }
}
```

**Auto-documentation hook:**
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write",
      "hooks": [{
        "type": "command",
        "command": "python scripts/update_docs.py $CLAUDE_TOOL_INPUT_PATH"
      }]
    }]
  }
}
```

---

### 41.3 GitHub Actions + Claude Code

Claude Code can be run headlessly in CI/CD pipelines via `claude --print`:

```yaml
# .github/workflows/ai-review.yml
name: Claude AI Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  ai-review:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code

      - name: Run AI review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          DIFF=$(git diff origin/main...HEAD)
          REVIEW=$(claude --print "Review this PR diff for: correctness, security issues, missing tests, and AI-specific concerns (prompt injection, unbounded LLM calls, token waste). Be concise. Format as GitHub markdown with severity labels.
          
          \`\`\`diff
          $DIFF
          \`\`\`")
          echo "$REVIEW" > review.md

      - name: Post review comment
        uses: actions/github-script@v7
        with:
          script: |
            const review = require('fs').readFileSync('review.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner, repo: context.repo.repo,
              body: review
            });
```

**Multi-agent CI pipeline:**

```yaml
# Run lint, test, and AI review in parallel
jobs:
  lint:    { runs-on: ubuntu-latest, steps: [...] }
  test:    { runs-on: ubuntu-latest, steps: [...] }
  ai-check:
    runs-on: ubuntu-latest
    steps:
      - name: AI eval regression check
        run: |
          claude --print "Run the eval suite in tests/evals/ and report:
          1. Any RAGAS scores that dropped below threshold
          2. New intents not covered by test cases
          3. Latency regressions above 10%"
```

---

### 41.4 Token Optimisation Patterns

Token cost is often the largest variable cost in production AI systems. These patterns apply at every layer:

**41.4.1 Prompt caching (Anthropic)**

```python
import anthropic

client = anthropic.Anthropic()
response = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=1024,
    system=[{
        "type": "text",
        "text": LONG_SYSTEM_PROMPT,  # 2000 tokens of taxonomy / instructions
        "cache_control": {"type": "ephemeral"},  # cache for 5 minutes
    }],
    messages=[{"role": "user", "content": user_query}],
)
# First call: prompt_tokens + cache_creation_tokens
# Subsequent calls: prompt_tokens + cache_read_tokens (90% cheaper)
```

**Savings:** At 1M calls/day with a 2K-token system prompt: $400/day without cache, $45/day with cache. Always cache static system prompts.

**41.4.2 Context window management**

```python
def trim_messages(messages: list, max_tokens: int = 6000) -> list:
    """Keep first message (system context) + most recent N messages."""
    if count_tokens(messages) <= max_tokens:
        return messages
    # Always keep system message + last N conversation turns
    system = [m for m in messages if m["role"] == "system"]
    conversation = [m for m in messages if m["role"] != "system"]
    while count_tokens(system + conversation) > max_tokens and len(conversation) > 2:
        conversation.pop(0)  # remove oldest turn
    return system + conversation

def summarise_old_context(messages: list) -> list:
    """Replace old turns with a compressed summary."""
    if len(messages) < 10:
        return messages
    old = messages[:-4]
    recent = messages[-4:]
    summary = llm.invoke(f"Summarise this conversation in 3 sentences: {old}").content
    return [{"role": "system", "content": f"Prior context: {summary}"}] + recent
```

**41.4.3 Structured output without wasted tokens**

```python
# BAD: LLM reasons out loud before answering (wastes tokens)
prompt = "Think step by step, then classify this query as JSON."
# → produces 200 tokens of CoT before the 30-token JSON answer

# GOOD: Instruct to output ONLY the structured result
prompt = """Classify the following query. Output ONLY valid JSON. No explanation.
Schema: {"intent": string, "confidence": 0-1, "entities": object}
Query: {query}"""
# → 30 tokens. Add temperature=0 for determinism.
```

**41.4.4 Output length control**

```python
response = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=100,     # hard limit — prevents runaway generation
    messages=[...],
)

# For streaming: stop early if you have enough information
async def stream_until_json_complete(stream):
    buffer = ""
    async for chunk in stream:
        buffer += chunk.content
        try:
            result = json.loads(buffer)
            return result  # stop as soon as valid JSON is complete
        except json.JSONDecodeError:
            pass  # keep streaming
```

**41.4.5 Batch processing**

```python
# Instead of N sequential calls, batch where possible
from anthropic import Anthropic
client = Anthropic()

# Anthropic Message Batches API (up to 50% cost reduction)
batch = client.messages.batches.create(
    requests=[
        {"custom_id": f"intent_{i}",
         "params": {"model": "claude-haiku-4-5-20251001", "max_tokens": 50,
                    "messages": [{"role": "user", "content": query}]}}
        for i, query in enumerate(queries)
    ]
)
# Poll for completion, then retrieve results
```

---

### 41.5 Output Quality Best Practices

```python
# 1. Validate structured output before use
def safe_parse_intent(raw: str) -> dict:
    try:
        result = json.loads(raw)
        assert "intent" in result and "confidence" in result
        return result
    except (json.JSONDecodeError, AssertionError):
        return {"intent": "unknown", "confidence": 0.0, "parse_error": raw}

# 2. Few-shot examples in system prompt (not user turn)
system = """Classify user queries about real estate.

Examples:
User: "Show me 2BHK flats in Bandra under 1.5Cr"
Output: {"intent": "property_search", "bedrooms": 2, "location": "Bandra", "max_price": 15000000}

User: "What will be my monthly payment?"
Output: {"intent": "emi_calculation", "requires_followup": true}"""

# 3. Fallback chain for reliability
async def classify_with_fallback(query: str) -> dict:
    for model in ["claude-haiku-4-5-20251001", "claude-sonnet-4-6"]:
        try:
            result = await classify(query, model=model)
            if result["confidence"] > 0.7:
                return result
        except Exception:
            continue
    return {"intent": "unknown", "confidence": 0.0}
```

> 🎯 **MAANG Interview Connection:** "How do you reduce LLM costs in a system processing 1M queries/day?" → Prompt caching on static system prompts (saves 90%). max_tokens hard cap. Structured-output-only prompts (no CoT). Batch API for async workloads. Route low-complexity queries to Haiku and only escalate to Sonnet when needed.

---

## Module 42 — Agent Teams, A2A Protocol & Debugging

> **Why this module matters:** Building a single agent is straightforward. Building a team of agents that reliably delivers production-quality results — and debugging it when it fails — is the hard engineering problem. This module covers agent team patterns beyond Module 34, the A2A cross-vendor protocol, and the practical tools for visualising and debugging agent execution.

---

### 42.1 Agent Team Patterns in Practice

Module 34 introduced supervisor, hierarchical, and debate architectures conceptually. This section covers the engineering decisions that determine whether a real team actually works.

**Pattern 1: Swarm (emergent handoff)**

In a swarm, each agent transfers control directly to the next agent it chooses — no central supervisor:

```python
from langgraph.types import Command

def triage_agent(state: SwarmState) -> Command:
    """Triages the request and transfers to the right specialist."""
    intent = classify(state["messages"][-1].content)
    if intent == "property_search":
        return Command(goto="search_agent", update={"intent": intent})
    elif intent == "emi_calc":
        return Command(goto="finance_agent", update={"intent": intent})
    return Command(goto="general_agent")

def search_agent(state: SwarmState) -> Command:
    results = search_properties(state["messages"][-1].content)
    if not results:
        return Command(goto="triage_agent",  # hand back if nothing found
                      update={"messages": [AIMessage("No results found, retrying")]})
    return Command(goto=END, update={"messages": [AIMessage(str(results))]})
```

Swarms scale well because there's no central bottleneck. They're harder to debug because control flow is emergent.

**Pattern 2: Parallel fan-out + aggregation**

```python
# Four agents run simultaneously — aggregator waits for all
def orchestrator(state: AnalysisState) -> AnalysisState:
    return {"queries": [
        "property prices in Bandra",
        "property prices in Powai",
        "rental yields both localities",
        "upcoming infrastructure projects",
    ]}

# Fan-out: orchestrator → [search_1, search_2, search_3, search_4] → aggregator
for i in range(4):
    graph.add_node(f"search_{i}", make_search_node(i))
    graph.add_edge("orchestrator", f"search_{i}")
    graph.add_edge(f"search_{i}", "aggregator")

# Aggregator fires when all four branches complete (LangGraph waits automatically)
def aggregator(state: AnalysisState) -> AnalysisState:
    return {"analysis": synthesise(state["search_results"])}
```

**Pattern 3: Critic-revision loop**

```python
class ReviewState(TypedDict):
    messages: Annotated[list, add_messages]
    draft: str
    critique: str
    revision_count: int

def writer(state: ReviewState) -> ReviewState:
    if state.get("critique"):
        prompt = f"Revise based on critique: {state['critique']}\nDraft: {state['draft']}"
    else:
        prompt = f"Write a property report for: {state['messages'][-1].content}"
    return {"draft": llm.invoke(prompt).content,
            "revision_count": state.get("revision_count", 0) + 1}

def critic(state: ReviewState) -> ReviewState:
    critique = llm.invoke(f"Critique for accuracy/completeness:\n{state['draft']}").content
    return {"critique": critique}

def route_review(state: ReviewState) -> str:
    if state["revision_count"] >= 3:
        return "end"
    if "looks good" in state["critique"].lower():
        return "end"
    return "revise"
```

---

### 42.2 Google A2A Protocol

A2A (Agent2Agent) is an open protocol, donated to the Linux Foundation (June 2025, 150+ org supporters including AWS, Microsoft, Salesforce, SAP). It defines how autonomous AI agents from different vendors and frameworks discover each other, delegate tasks, and exchange results.

**Core abstractions:**

1. **Agent Card** — a JSON document at `/.well-known/agent.json` advertising the agent's identity, capabilities, endpoint URL, and auth.
2. **Task** — the unit of work. State machine: `submitted → working → input-required → completed | failed | cancelled`.
3. **Message/Part** — a Message is one turn; a Part is the smallest content unit (text, file, structured data).

```json
// Agent Card — published at /.well-known/agent.json
{
  "name": "PropertySearchAgent",
  "description": "Searches Housing.com real estate listings",
  "version": "1.0.0",
  "url": "https://agents.housing.com/property-search",
  "authentication": { "type": "oauth2", "scopes": ["listings:read"] },
  "skills": [
    {
      "id": "search_listings",
      "description": "Search by city, price, bedrooms, furnished status",
      "inputModes": ["text"],
      "outputModes": ["text", "data"]
    }
  ]
}
```

**Task lifecycle via HTTP + SSE:**

```python
import httpx
import json

async def call_a2a_agent(agent_url: str, query: str, token: str) -> str:
    """Send a task to an A2A agent and stream results."""
    async with httpx.AsyncClient() as client:
        # POST task to agent
        response = await client.post(
            f"{agent_url}/tasks",
            json={"skill": "search_listings",
                  "message": {"role": "user", "parts": [{"type": "text", "text": query}]}},
            headers={"Authorization": f"Bearer {token}",
                     "Accept": "text/event-stream"},
            timeout=60,
        )
        # Stream SSE events
        result = ""
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                event = json.loads(line[6:])
                if event.get("type") == "TaskArtifactUpdateEvent":
                    result += event["artifact"]["parts"][0]["text"]
                elif event.get("status", {}).get("state") == "completed":
                    break
        return result
```

**Minimal A2A server (FastAPI):**

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio, json

app = FastAPI()

@app.get("/.well-known/agent.json")
def agent_card():
    return {
        "name": "PropertySearchAgent",
        "url": "https://agents.housing.com",
        "skills": [{"id": "search_listings", "description": "Search property listings"}],
    }

@app.post("/tasks")
async def create_task(body: dict):
    query = body["message"]["parts"][0]["text"]

    async def event_stream():
        yield f"data: {json.dumps({'type':'TaskStatusUpdateEvent','status':{'state':'working'}})}\n\n"
        results = await search_properties_async(query)
        yield f"data: {json.dumps({'type':'TaskArtifactUpdateEvent','artifact':{'parts':[{'type':'text','text':str(results)}]}})}\n\n"
        yield f"data: {json.dumps({'type':'TaskStatusUpdateEvent','status':{'state':'completed'}})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

**A2A vs MCP vs LangGraph:**

| Protocol | Scope | Transport | When to use |
|---|---|---|---|
| A2A | Agent ↔ Agent (cross-org/network) | HTTP + SSE + OAuth2 | Delegating to external agents from another vendor/company |
| MCP | LLM ↔ Tools/Data | stdio / HTTP-SSE | Exposing local tools and data to any LLM host |
| LangGraph | Intra-framework nodes | In-process | Building multi-agent pipelines within your own codebase |

A2A and MCP are complementary: your agent might expose an MCP server for tool access AND implement A2A for cross-agent delegation.

---

### 42.3 Debugging Agent Systems

Agents are harder to debug than request-response APIs because: execution is non-deterministic, control flow is dynamic, and failures may be in reasoning (not code).

**42.3.1 LangSmith for agent traces**

```python
from langsmith import traceable
import os

os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "ls_..."

# @traceable wraps any function — appears as a span in LangSmith trace
@traceable(name="property_search_agent", metadata={"agent_version": "2.1"})
def run_agent(query: str) -> dict:
    result = app.invoke({"messages": [HumanMessage(query)]})
    return result

# In LangSmith:
# - See every node execution with input/output
# - Per-node latency and token cost
# - Full message history at each step
# - Link traces to evaluation datasets for regression testing
```

**42.3.2 LangGraph's built-in state inspector**

```python
# Inspect the graph structure
from langgraph.graph import StateGraph
print(app.get_graph().draw_ascii())
# ┌────────┐     ┌──────┐     ┌───────┐
# │ intent │ ──► │ llm  │ ──► │ tools │
# └────────┘     └──────┘     └───────┘
#                    ▲             │
#                    └─────────────┘

# Get current checkpoint state
config = {"configurable": {"thread_id": "debug_session_1"}}
state = app.get_state(config)
print(state.values)       # all state fields
print(state.next)         # which node runs next
print(state.tasks)        # pending tasks

# Replay from any checkpoint
history = list(app.get_state_history(config))
for snapshot in history:
    print(snapshot.config, snapshot.values["messages"][-1].content)
```

**42.3.3 Visualising graphs**

```python
# PNG visualisation (requires graphviz + pygraphviz)
from IPython.display import Image
Image(app.get_graph().draw_png())

# Mermaid diagram (for documentation)
print(app.get_graph().draw_mermaid())
# graph TD
#   __start__ --> intent
#   intent --> llm
#   llm -->|tool_calls| tools
#   tools --> llm
#   llm -->|no tool_calls| __end__
```

**42.3.4 LangGraph Studio (local GUI)**

```bash
pip install "langgraph-cli[inmem]"
langgraph dev  # launches browser UI at localhost:8123
```

LangGraph Studio shows:
- Live graph visualisation with active node highlighted
- Step-by-step state inspector (click any node to see I/O)
- Message history panel
- Time-travel debugging (replay from any checkpoint)
- Hot-reload on code change

---

### 42.4 Production Monitoring for Agent Teams

```python
import time
from functools import wraps
from src.observability.logging import get_logger

log = get_logger(__name__)

def monitor_agent_node(node_name: str):
    """Decorator that adds latency, cost, and error metrics to any node."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(state, *args, **kwargs):
            start = time.time()
            try:
                result = fn(state, *args, **kwargs)
                latency_ms = (time.time() - start) * 1000
                log.info("node_executed",
                    node=node_name,
                    latency_ms=round(latency_ms),
                    tokens_used=result.get("_tokens_used", 0),
                )
                return result
            except Exception as e:
                log.error("node_failed", node=node_name, error=str(e))
                raise
        return wrapper
    return decorator

@monitor_agent_node("intent_classifier")
def intent_node(state):
    ...

# Key metrics to track:
# - Node latency p50/p95/p99 per agent
# - Token cost per pipeline run
# - Tool call count per session (unusually high = loop)
# - Error rate per node (node-level SLOs)
# - Session length (long sessions = potential runaway agent)
```

**Alerting rules:**

```yaml
# Example: alert if any agent node takes > 10s (runaway detection)
- alert: AgentNodeTimeout
  condition: node_latency_ms > 10000
  severity: critical

# Alert if tool calls per session exceed 50 (loop detection)
- alert: AgentLoopDetected
  condition: tool_calls_per_session > 50
  severity: warning

# Alert if cost per pipeline run > $0.10
- alert: AgentCostSpike
  condition: cost_per_run_usd > 0.10
  severity: warning
```

---

### 42.5 Debugging Checklist for Agent Failures

```
1. Check LangSmith trace first
   → Which node failed? What was the input?
   → Was it a parsing error (bad JSON) or a logic error?

2. Check state at failure point
   app.get_state(config).values  → what was in state when it failed?

3. Check tool schemas
   print(tool.args_schema.schema())  → does the LLM understand the schema?
   → Add more descriptive Field(description=...) annotations

4. Check routing logic
   Add print(state["messages"][-1]) before conditional edge
   → Is the route function seeing what you expect?

5. Check for add_messages gotcha
   → Are you returning {"messages": [...]} (correct) or state["messages"] = [...] (wrong)?

6. Check for infinite loops
   → Is max_iterations set on AgentExecutor?
   → Is there a "done" condition in every cycle?

7. Check cost attribution
   → Which node is consuming the most tokens?
   → Can you cache or trim its inputs?
```

> 🎯 **MAANG Interview Connection:** "How do you debug an agent that gives inconsistent results?" → Start with LangSmith traces — find the step with highest variance. "If it's a routing step, the conditional logic is wrong — add explicit state logging. If it's a tool call, the schema might be ambiguous — tighten Field descriptions. If it's generation, add temperature=0 and structured output." Demonstrate LangGraph state inspector for time-travel debugging.

---

*End of Course*

**You now know everything that was baked into this codebase — and more importantly, why.**
**You have the framework to design any production AI system from first principles.**
**Housing.com was the ladder. Now build something great.**
