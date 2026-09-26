import { useEffect } from "react";
import { QuizSection } from "../components/QuizSection";
import { CodeBlock, CodeDiff } from '../components/CodeBlock';

const CODE_LANGGRAPH_NODES = `# safety_node signature — it knows nothing about the other 18 nodes
async def safety_node(state: BotState, emit_sse=None) -> dict:
    # receives: state['raw_message'], state['session']
    # returns: {'safety_result': {...}}  or {'bot_response': canned_response}

# Every non-terminal edge is conditional
def _should_continue(state: BotState) -> str:
    return END if state.get('bot_response') else 'continue'

graph.add_conditional_edges('safety', _should_continue,
    {'continue': 'normalize', END: END})`;

const CODE_QUEUE_PATTERN = `queue: asyncio.Queue[str | None] = asyncio.Queue()

def emit_sse(event: str, data: dict) -> None:
    queue.put_nowait(sse_frame(event, data))  # synchronous, no await

# Pipeline runs in background task
asyncio.create_task(_run_pipeline())

# Generator drains the queue
while True:
    frame = await asyncio.wait_for(queue.get(), timeout=90.0)
    if frame is None:   # sentinel — pipeline done
        break
    yield frame`;

const CODE_CLASSIFIER_PORT = `# ClassifierPort — a Python Protocol (like a TypeScript interface)
class ClassifierPort(Protocol):
    async def classify(self, message: str, domain: str, session: dict) -> dict: ...

# AnthropicClassifier satisfies this protocol
class AnthropicClassifier:
    async def classify(self, message, domain, session):
        return await self._call_claude(message, domain, session)

# OpenRouterClassifier also satisfies it — same interface, different implementation
class OpenRouterClassifier:
    async def classify(self, message, domain, session):
        return await self._call_openrouter(message, domain, session)

# build_graph() selects which one to inject, based on env config
graph = build_graph(
    router=build_domain_router(settings),   # picks Anthropic or OpenRouter
    classifier=build_classifier(settings),  # same — via MODEL_REGISTRY
    llm=build_llm(settings),
)`;

const CODE_MOCK_CLASSIFIER = `mock_classifier = AsyncMock(return_value={"domain": "property_search", "intent": "search"})
result = await classify_node(state, classifier=mock_classifier)`;

const CODE_ASYNCIO_PYTHON = `import asyncio

# 1. Coroutine definition
async def fetch_data(url: str) -> dict:
    await asyncio.sleep(1)   # suspend, yield to event loop
    return {"url": url}

# 2. Awaiting another coroutine
result = await fetch_data("https://api.example.com")

# 3. Background task (fire-and-forget)
asyncio.create_task(fetch_data("https://api.example.com"))

# 4. Async generator
async def stream_chunks():
    for chunk in chunks:
        yield chunk
        await asyncio.sleep(0)`;

const CODE_ASYNCIO_TS = `// TypeScript equivalents

// 1. Async function definition
async function fetchData(url: string): Promise<Record<string, unknown>> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { url };
}

// 2. Awaiting another async function
const result = await fetchData("https://api.example.com");

// 3. Background task (fire-and-forget)
Promise.resolve().then(() => fetchData("https://api.example.com"));

// 4. Async generator
async function* streamChunks() {
    for (const chunk of chunks) {
        yield chunk;
        await new Promise(resolve => setTimeout(resolve, 0));
    }
}`;

function ProviderArchViz() {
  const accent  = "var(--accent)";
  const accent5 = "var(--accent5)";
  const muted   = "var(--muted)";
  const text    = "var(--text)";
  const bg2     = "var(--bg2)";
  const border  = "var(--border)";

  return (
    <div style={{ perspective: "800px", margin: "20px 0" }}>
      <div style={{ transform: "rotateX(5deg)", transformStyle: "preserve-3d" }}>
        <svg
          viewBox="0 0 600 280"
          width="100%"
          style={{ display: "block", maxWidth: 600, margin: "0 auto" }}
          aria-label="Provider-agnostic architecture diagram"
        >
          {/* ── Arrow marker ── */}
          <defs>
            <marker id="pav-arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill={muted} />
            </marker>
          </defs>

          {/* ── Layer 1: APPLICATION LAYER ── */}
          <rect x="20" y="12" width="560" height="64" rx="6"
            fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <text x="300" y="36" textAnchor="middle" fill={accent}
            fontSize="10" fontWeight="700" letterSpacing=".08em">APPLICATION LAYER</text>
          <text x="300" y="55" textAnchor="middle" fill={text} fontSize="11">
            LangGraph pipeline · session state · tool registry
          </text>

          {/* ── Arrow: App → Adapter ── */}
          <line x1="300" y1="76" x2="300" y2="104"
            stroke={muted} strokeWidth="1.5" markerEnd="url(#pav-arr)" />

          {/* ── Layer 2: ADAPTER LAYER ── */}
          <rect x="20" y="106" width="560" height="64" rx="6"
            fill={`${accent5}22`} stroke={accent5} strokeWidth="1.5" />
          <text x="300" y="130" textAnchor="middle" fill={accent5}
            fontSize="10" fontWeight="700" letterSpacing=".08em">ADAPTER LAYER</text>
          <text x="300" y="149" textAnchor="middle" fill={text} fontSize="11">
            AdapterFactory · LLMAdapter interface · streaming normalisation
          </text>

          {/* ── Three arrows: Adapter → each provider ── */}
          {/* left arrow */}
          <line x1="110" y1="170" x2="110" y2="198"
            stroke={muted} strokeWidth="1.5" markerEnd="url(#pav-arr)" />
          {/* centre arrow */}
          <line x1="300" y1="170" x2="300" y2="198"
            stroke={muted} strokeWidth="1.5" markerEnd="url(#pav-arr)" />
          {/* right arrow */}
          <line x1="490" y1="170" x2="490" y2="198"
            stroke={muted} strokeWidth="1.5" markerEnd="url(#pav-arr)" />

          {/* ── Layer 3: Provider boxes ── */}
          {/* Anthropic */}
          <rect x="20" y="200" width="173" height="52" rx="6"
            fill={bg2} stroke={border} strokeWidth="1.2" />
          <text x="107" y="222" textAnchor="middle" fill={text} fontSize="10" fontWeight="600">
            Anthropic
          </text>
          <text x="107" y="238" textAnchor="middle" fill={muted} fontSize="9">
            claude-*
          </text>

          {/* OpenRouter */}
          <rect x="213" y="200" width="174" height="52" rx="6"
            fill={bg2} stroke={border} strokeWidth="1.2" />
          <text x="300" y="222" textAnchor="middle" fill={text} fontSize="10" fontWeight="600">
            OpenRouter
          </text>
          <text x="300" y="238" textAnchor="middle" fill={muted} fontSize="9">
            llama · gemini · mistral
          </text>

          {/* Local */}
          <rect x="407" y="200" width="173" height="52" rx="6"
            fill={bg2} stroke={border} strokeWidth="1.2" />
          <text x="493" y="222" textAnchor="middle" fill={text} fontSize="10" fontWeight="600">
            Local
          </text>
          <text x="493" y="238" textAnchor="middle" fill={muted} fontSize="9">
            vLLM / self-hosted
          </text>

          {/* ── Caption ── */}
          <text x="300" y="271" textAnchor="middle" fill={muted} fontSize="10" fontStyle="italic">
            Swap providers by changing one env var. Application code never imports anthropic or openai directly.
          </text>
        </svg>
      </div>
    </div>
  );
}

export function Mod1() {
  useEffect(() => {
    const frames = Array.from(
      document.querySelectorAll<HTMLElement>('#sse-demo .sse-frame')
    );
    if (!frames.length) return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    function runAnimation() {
      frames.forEach(f => f.classList.remove('visible'));
      frames.forEach((frame, i) => {
        timeouts.push(setTimeout(() => frame.classList.add('visible'), i * 450 + 300));
      });
      // pause after last frame then restart
      timeouts.push(setTimeout(runAnimation, frames.length * 450 + 2000));
    }

    runAnimation();
    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Draw the full system architecture from memory: browser → FastAPI → LangGraph → Redis/Kafka/Postgres</li>
          <li>Explain why SSE beats WebSockets for AI chat using the decision tree</li>
          <li>Describe the asyncio.Queue bridge pattern and why <code>put_nowait</code> is used inside pipeline nodes</li>
          <li>Justify the two-stage SLM cost argument: $0.0001 vs $0.005, and why reliability is the primary reason</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~45 minutes</span>
          <span className="obj-diff">Difficulty: ★★★☆☆</span>
          <span className="obj-diff">Prerequisites: Module 3</span>
        </div>
      </div>

      <details open style={{ marginBottom: "20px", border: "1px solid var(--accent2)", borderRadius: "8px", padding: "16px", background: "rgba(63,185,80,.04)" }}>
        <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: "15px", color: "var(--accent2)" }}>🗺️ New to this stack? Read this first (2 min)</summary>
        <p style={{ marginTop: "12px" }}>This module uses five technologies you may not know yet. Here's the 30-second version of each so the code doesn't feel like magic.</p>
        <table>
          <tbody>
            <tr><th>Name</th><th>What it is</th><th>JS/FE analogy</th></tr>
            <tr>
              <td><strong>LangGraph</strong></td>
              <td>A Python library for building stateful AI pipelines as a graph of nodes. Nodes are functions; edges control which node runs next. Think of it as Redux + a state machine for AI workflows.</td>
              <td>React state machine / XState</td>
            </tr>
            <tr>
              <td><strong>SLM / LLM</strong></td>
              <td><strong>LLM</strong> (Large Language Model) = a big, expensive AI model like Claude Sonnet. <strong>SLM</strong> (Small Language Model) = a fast, cheap, narrowly-capable model like Claude Haiku. We use SLMs for classification (structured JSON output) and LLMs for free-form text generation.</td>
              <td>SLM ≈ a small dedicated microservice. LLM ≈ a senior generalist engineer.</td>
            </tr>
            <tr>
              <td><strong>asyncio</strong></td>
              <td>Python's async/await runtime — equivalent to Node.js's event loop. <code>await</code> in Python does the same thing as <code>await</code> in JS: yields control back to the event loop until the promise/coroutine resolves. One key difference: Python asyncio is single-threaded by default, just like Node.</td>
              <td>Node.js <code>async/await</code> + event loop</td>
            </tr>
            <tr>
              <td><strong>Redis</strong></td>
              <td>An in-memory key-value store. Think of it as an extremely fast shared hashmap that every server instance can read/write. We use it for: session state (like server-side localStorage), concurrency counters, caching API responses.</td>
              <td>Shared server-side localStorage with TTL and atomic operations</td>
            </tr>
            <tr>
              <td><strong>Kafka</strong></td>
              <td>A distributed message queue / event log. Every chat event (user sent message, LLM responded, etc.) gets published to Kafka. Other services (analytics, billing, monitoring) subscribe and process these events independently. The key property: events are durable and replayable — even if a subscriber goes down, it can catch up when it comes back.</td>
              <td>Like a server-side EventEmitter, but durable, distributed, and replayable across restarts</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: "8px", fontSize: "13px", color: "var(--muted)" }}>Deep dives: Redis is covered in Module 18. Kafka in Module 13. LangGraph internals in Module 25. asyncio patterns throughout Module 4.</p>
      </details>

      <h2>4.1 The 50,000-Foot View</h2>
      <div className="callout callout-info" style={{fontFamily:'monospace',fontSize:'12px',lineHeight:1.8,whiteSpace:'pre'}}>{`User (Browser / Mobile App)
        │  HTTP POST /send-message-streamed
        ▼
   FastAPI Server  ◄──── Redis (session state)
        │                Kafka (event log)
        │                Postgres (persistence)
        ▼
  LangGraph Pipeline (19 nodes)
        │
        ├── Stage 1 SLM (Claude Haiku) — domain routing
        ├── Stage 2 SLM (Claude Haiku) — intent classification
        ├── Tool Executors — Housing APIs (property search, locality data)
        └── Stage 3 LLM (Claude Haiku/Sonnet) — response generation
        ▼
  Server-Sent Events (SSE) stream back to user`}</div>

      <div className="diagram-wrap" style={{marginTop:"12px"}}>
        <div className="diagram-title">Housing.com Chatbot — End-to-End Request Flow</div>
        <svg width="100%" viewBox="0 0 760 292" style={{display:"block",maxWidth:"760px",margin:"0 auto",fontFamily:"'Courier New',monospace"}}>
          <defs>
            <marker id="pf-arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0,0 L7,3.5 L0,7 z" fill="#89b4fa"/>
            </marker>
          </defs>
          <rect width="760" height="292" rx="8" fill="#1e1e2e"/>
          {/* Row 1: horizontal pipeline */}
          <rect x="10" y="16" width="105" height="36" rx="4" fill="#313244" stroke="#89b4fa" strokeWidth="1.5"/>
          <text x="62" y="30" textAnchor="middle" fill="#cdd6f4" fontSize="10" fontWeight="bold">User Message</text>
          <text x="62" y="44" textAnchor="middle" fill="#6c7086" fontSize="8.5">Browser / Mobile</text>
          <line x1="115" y1="34" x2="145" y2="34" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#pf-arr)"/>
          <rect x="147" y="16" width="115" height="36" rx="4" fill="#313244" stroke="#a6e3a1" strokeWidth="1.5"/>
          <text x="204" y="30" textAnchor="middle" fill="#cdd6f4" fontSize="10" fontWeight="bold">FastAPI /chat</text>
          <text x="204" y="44" textAnchor="middle" fill="#6c7086" fontSize="8.5">send-message-streamed</text>
          <line x1="262" y1="34" x2="292" y2="34" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#pf-arr)"/>
          <rect x="294" y="16" width="132" height="36" rx="4" fill="#313244" stroke="#fab387" strokeWidth="1.5"/>
          <text x="360" y="30" textAnchor="middle" fill="#cdd6f4" fontSize="10" fontWeight="bold">SLM Classifier</text>
          <text x="360" y="44" textAnchor="middle" fill="#6c7086" fontSize="8.5">Claude Haiku → JSON intent</text>
          <line x1="426" y1="34" x2="456" y2="34" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#pf-arr)"/>
          <rect x="458" y="16" width="168" height="36" rx="4" fill="#313244" stroke="#cba6f7" strokeWidth="1.5"/>
          <text x="542" y="30" textAnchor="middle" fill="#cdd6f4" fontSize="10" fontWeight="bold">LangGraph StateGraph</text>
          <text x="542" y="44" textAnchor="middle" fill="#6c7086" fontSize="8.5">19 nodes, conditional edges</text>
          {/* Branch split from LangGraph */}
          <line x1="542" y1="52" x2="542" y2="82" stroke="#45475a" strokeWidth="1.5"/>
          <line x1="110" y1="82" x2="660" y2="82" stroke="#45475a" strokeWidth="1.5"/>
          <line x1="110" y1="82" x2="110" y2="102" stroke="#45475a" strokeWidth="1.5" markerEnd="url(#pf-arr)"/>
          <line x1="385" y1="82" x2="385" y2="102" stroke="#45475a" strokeWidth="1.5" markerEnd="url(#pf-arr)"/>
          <line x1="660" y1="82" x2="660" y2="102" stroke="#45475a" strokeWidth="1.5" markerEnd="url(#pf-arr)"/>
          {/* Row 2: Domain branches */}
          <rect x="38" y="102" width="144" height="34" rx="4" fill="#1e3a5f" stroke="#89b4fa" strokeWidth="1.5"/>
          <text x="110" y="116" textAnchor="middle" fill="#89b4fa" fontSize="10" fontWeight="bold">property_search</text>
          <text x="110" y="129" textAnchor="middle" fill="#6c7086" fontSize="8.5">~70% of traffic</text>
          <rect x="313" y="102" width="144" height="34" rx="4" fill="#1a2e1a" stroke="#a6e3a1" strokeWidth="1.5"/>
          <text x="385" y="116" textAnchor="middle" fill="#a6e3a1" fontSize="10" fontWeight="bold">general_query</text>
          <text x="385" y="129" textAnchor="middle" fill="#6c7086" fontSize="8.5">~20% of traffic</text>
          <rect x="588" y="102" width="144" height="34" rx="4" fill="#2e1a1a" stroke="#f38ba8" strokeWidth="1.5"/>
          <text x="660" y="116" textAnchor="middle" fill="#f38ba8" fontSize="10" fontWeight="bold">off_topic / blocked</text>
          <text x="660" y="129" textAnchor="middle" fill="#6c7086" fontSize="8.5">~10%, short-circuited</text>
          {/* Down to details */}
          <line x1="110" y1="136" x2="110" y2="157" stroke="#45475a" strokeWidth="1.5" markerEnd="url(#pf-arr)"/>
          <line x1="385" y1="136" x2="385" y2="157" stroke="#45475a" strokeWidth="1.5" markerEnd="url(#pf-arr)"/>
          <line x1="660" y1="136" x2="660" y2="157" stroke="#45475a" strokeWidth="1.5" markerEnd="url(#pf-arr)"/>
          {/* Row 3: Processing details */}
          <rect x="18" y="157" width="184" height="52" rx="4" fill="#252535" stroke="#89b4fa" strokeWidth="1"/>
          <text x="110" y="172" textAnchor="middle" fill="#cdd6f4" fontSize="9.5" fontWeight="bold">Enrichment Node</text>
          <text x="110" y="186" textAnchor="middle" fill="#6c7086" fontSize="8.5">Tool Calls (Housing API)</text>
          <text x="110" y="200" textAnchor="middle" fill="#6c7086" fontSize="8.5">LLM Response Synthesis</text>
          <rect x="300" y="157" width="170" height="52" rx="4" fill="#252535" stroke="#a6e3a1" strokeWidth="1"/>
          <text x="385" y="172" textAnchor="middle" fill="#cdd6f4" fontSize="9.5" fontWeight="bold">Response Node</text>
          <text x="385" y="186" textAnchor="middle" fill="#6c7086" fontSize="8.5">LLM direct generation</text>
          <text x="385" y="200" textAnchor="middle" fill="#6c7086" fontSize="8.5">No tool calls needed</text>
          <rect x="573" y="157" width="174" height="52" rx="4" fill="#252535" stroke="#f38ba8" strokeWidth="1"/>
          <text x="660" y="172" textAnchor="middle" fill="#cdd6f4" fontSize="9.5" fontWeight="bold">Safety Check</text>
          <text x="660" y="186" textAnchor="middle" fill="#6c7086" fontSize="8.5">Template response returned</text>
          <text x="660" y="200" textAnchor="middle" fill="#6c7086" fontSize="8.5">Zero LLM cost (~5ms)</text>
          {/* Convergence: all branches → SSE box */}
          <line x1="110" y1="209" x2="110" y2="251" stroke="#45475a" strokeWidth="1.5"/>
          <line x1="385" y1="209" x2="385" y2="251" stroke="#45475a" strokeWidth="1.5"/>
          <line x1="660" y1="209" x2="660" y2="251" stroke="#45475a" strokeWidth="1.5"/>
          {/* SSE output bus */}
          <rect x="40" y="251" width="680" height="33" rx="4" fill="#2e2040" stroke="#cba6f7" strokeWidth="2"/>
          <text x="380" y="264" textAnchor="middle" fill="#cba6f7" fontSize="11" fontWeight="bold">SSE Stream → Client</text>
          <text x="380" y="278" textAnchor="middle" fill="#6c7086" fontSize="8.5">connection_ack → pipeline_step events → message_delta chunks → connection_close</text>
        </svg>
      </div>

      <h2>4.2 Why SSE? (Not WebSockets, not polling)</h2>
      <table>
        <tbody>
          <tr><th>Option</th><th>Pros</th><th>Cons</th><th>Verdict</th></tr>
          <tr><td>Polling</td><td>Simple</td><td>Wastes requests, high latency</td><td>Never for streaming</td></tr>
          <tr><td>WebSockets</td><td>Bidirectional, fast</td><td>Complex infra, stateful servers</td><td>Overkill for chat</td></tr>
          <tr><td><strong>SSE</strong></td><td>Simple, HTTP/1.1, unidirectional</td><td>Server → client only</td><td><strong>This codebase</strong></td></tr>
        </tbody>
      </table>
      <p>SSE is perfect for AI: the server speaks, the client listens. Works through load balancers without special configuration.</p>
      <div className="diagram-wrap">
        <div className="diagram-title">SSE Frame Flow — Animated</div>
        <div className="sse-demo" id="sse-demo">
          <div className="sse-frame event">event: pipeline_step</div>
          <div className="sse-frame data">data: {"{"}"node": "safety", "status": "ok"{"}"}</div>
          <div className="sse-frame event">event: pipeline_step</div>
          <div className="sse-frame data">data: {"{"}"node": "classify", "intent": "property_search/filter_search"{"}"}</div>
          <div className="sse-frame event">event: chat_event</div>
          <div className="sse-frame data">data: {"{"}"messageState": "property_carousel", "properties": [...]{"}"}</div>
          <div className="sse-frame event">event: message_delta</div>
          <div className="sse-frame data">data: {"{"}"content": {"{"}"text": "I found 12 properties"{"}"}, "chunkIndex": 0{"}"}</div>
          <div className="sse-frame event">event: connection_close</div>
          <div className="sse-frame data">data: {"{"}"reason": "response_complete"{"}"}</div>
        </div>
      </div>

      <h2>4.3 Why LangGraph?</h2>
      <p>You could write your 19-node pipeline as a series of if/else statements. Many teams do. It becomes unmaintainable in month 3.</p>
      <p>LangGraph gives you:</p>
      <ul>
        <li><strong>Typed state</strong> — the BotState TypedDict flows through every node</li>
        <li><strong>Conditional edges</strong> — short-circuit to END if bot_response is set</li>
        <li><strong>Composability</strong> — swap nodes without touching adjacent ones</li>
        <li><strong>Traceability</strong> — LangSmith sees every node's input/output</li>
      </ul>
      <CodeBlock title="LangGraph Node Contract — Conditional Edges" language="python" keyLine={10} keyNote="conditional edge decides: continue or END">{CODE_LANGGRAPH_NODES}</CodeBlock>

      <h2>4.4 The Queue Pattern — Decoupling Pipeline from Streaming</h2>
      <h3 style={{ marginTop: "20px", marginBottom: "8px", fontSize: "15px" }}>Python asyncio &#x2192; TypeScript equivalents</h3>
      <CodeDiff
        brokenTitle="Python (backend)"
        fixedTitle="TypeScript (frontend)"
        language="python"
        broken={CODE_ASYNCIO_PYTHON}
        fixed={CODE_ASYNCIO_TS}
      />
      <div className="callout callout-info"><strong>The Core Problem</strong>LangGraph is synchronous from its own perspective — it calls node A, waits, calls node B. But we want to stream SSE frames to the client as nodes emit them, without LangGraph knowing anything about HTTP.</div>
      <div className="callout callout-info" style={{fontFamily:'monospace',fontSize:'12px',lineHeight:1.8,whiteSpace:'pre'}}>{`LangGraph runs as background task ──► node calls emit_sse(event, data)
                                               │
                                               ▼
                                       queue.put_nowait(frame)

FastAPI event_generator ─────────────► frame = await queue.get()
                                               │
                                               ▼
                                       yield frame  ──► browser`}</div>
      <CodeBlock title="asyncio.Queue Bridge — Pipeline to SSE Stream" language="python" keyLine={3} keyNote="put_nowait is sync-safe; await put() can deadlock">{CODE_QUEUE_PATTERN}</CodeBlock>
      <div className="callout callout-gotcha"><strong>Gotcha: connection_close placement</strong><code>connection_close</code> must be yielded inside the while loop (on sentinel), not after try/finally. If finally raises, code after it never executes. This burned us in production.</div>

      <h2>4.5 The Two-Stage SLM Architecture</h2>
      <div className="two-col">
        <div className="col-card">
          <h4>Stage 1: Domain Router</h4>
          <p style={{ fontSize: "12px", color: "var(--muted)" }}>20ms · 50 tokens · fast Haiku</p>
          <p>Input: raw message + session context<br />Output: which domain?<br /><code>property_search | locality_research | out_of_scope</code></p>
          <p style={{ fontSize: "12px" }}>Why separate? Different domains have completely different taxonomies. One model can't know them all without getting confused and expensive.</p>
        </div>
        <div className="col-card">
          <h4>Stage 2: Domain Classifier</h4>
          <p style={{ fontSize: "12px", color: "var(--muted)" }}>50-200ms · 150 tokens · Haiku + taxonomy</p>
          <p>Input: message + domain taxonomy + session history<br />Output: <code>main_intent/sub_intent</code>, <code>filter_delta</code>, <code>entity_refs</code>, <code>clarification_needed</code></p>
          <p style={{ fontSize: "12px" }}>Why separate from Stage 3? Classification = structured JSON, small. Generation = prose, tool calls. Different tasks → different prompts, <strong>temperature</strong> (how random the output is — 0.0 = deterministic/robotic, 1.0 = creative/unpredictable; classifiers use 0.0, text generators use 0.3–0.7), models.</p>
        </div>
      </div>
      <table>
        <tbody>
          <tr><th>Metric</th><th>Two-stage SLM</th><th>Single big LLM</th></tr>
          <tr><td>Cost per turn</td><td>~$0.0001</td><td>~$0.005 (50x more)</td></tr>
          <tr><td>Classification latency</td><td>150-250ms</td><td>2-5 seconds</td></tr>
          <tr><td>JSON reliability</td><td>High (trained for it)</td><td>Variable ("return JSON please")</td></tr>
        </tbody>
      </table>

      <h2>4.6 Cost Breakdown — Where Does the Money Actually Go?</h2>
      <p>At 1M DAU, every fraction of a cent matters. Here's exactly where the token budget goes per turn for a typical <code>property_search / filter_search</code> intent:</p>
      <table>
        <tbody>
          <tr><th>Stage</th><th>Model</th><th>Input tokens</th><th>Output tokens</th><th>Cost (Haiku pricing)</th><th>Notes</th></tr>
          <tr><td><strong>Stage 1: Domain Router</strong></td><td>claude-haiku-4-5</td><td>~60</td><td>~15</td><td>$0.0001</td><td>Message + minimal context only</td></tr>
          <tr><td><strong>Stage 2: Classifier</strong></td><td>claude-haiku-4-5</td><td>~400</td><td>~80</td><td>$0.0006</td><td>Message + domain taxonomy + last 3 turns</td></tr>
          <tr><td><strong>Stage 3 LLM (Haiku)</strong></td><td>claude-haiku-4-5</td><td>~1,200</td><td>~180</td><td>$0.0017</td><td>System prompt + context + pre-fetched data</td></tr>
          <tr style={{ background: "rgba(255,107,107,.05)" }}><td><strong>Stage 3 LLM (Sonnet)</strong></td><td>claude-sonnet-4-6</td><td>~1,200</td><td>~180</td><td>$0.0063</td><td>Complex Tier 3b only (~5% of turns)</td></tr>
        </tbody>
      </table>
      <div className="callout callout-info">
        <strong>At 1M DAU (assumed 3 turns/session, 60% reach Stage 3):</strong>
        <ul style={{ margin: "4px 0 0 16px" }}>
          <li>3M turns/day × 60% × avg $0.002 (mix of Haiku + Sonnet) = <strong>$3,600/day</strong> in LLM costs</li>
          <li>Infrastructure (Redis, Kafka, FastAPI servers) ≈ $800/day</li>
          <li>Prompt caching (Module 40) can cut Stage 3 input cost by ~40% = save ~$900/day</li>
          <li>Tier 0/1/2 messages (40% of turns) cost <strong>zero LLM</strong> — the tier system saves ~$1,440/day</li>
        </ul>
        Total savings from architecture decisions: $2,340/day (~$855K/year) vs single-LLM naive approach.
      </div>
      <div className="callout callout-gotcha"><strong>Common Student Mistakes — Watch for These</strong><strong>1.</strong> Assuming the <code>finally</code> block always runs cleanup safely — it doesn't if finally itself raises an exception. connection_close must be inside the while loop.<br /><strong>2.</strong> Thinking cost is the primary reason for two-stage SLM. It's <em>reliability</em> — a small model trained for structured JSON is more consistent. Cost (50x) and speed (10x) are bonuses.<br /><strong>3.</strong> Using <code>await queue.put()</code> inside pipeline nodes instead of <code>queue.put_nowait()</code>. Nodes run in a sync context inside the background task — the await form can deadlock.</div>

      <h2>4.7 Provider-Agnostic Architecture</h2>
      <p>The pipeline never imports <code>anthropic</code> or <code>openai</code> directly inside any node. Nodes depend on <em>protocol interfaces</em> (called <em>Ports</em>). The concrete implementations (<em>Adapters</em>) are injected once at startup.</p>
      <ProviderArchViz />
      <p>The key insight: to add Google Gemini support, you create <code>GeminiClassifier(ClassifierPort)</code>, add it to <code>MODEL_REGISTRY</code>, and change one environment variable. Zero node code changes.</p>
      <CodeBlock title="ClassifierPort — Provider-Agnostic Interface" language="python" keyLine={2} keyNote="Protocol = TypeScript interface; nodes depend on this, not Anthropic">{CODE_CLASSIFIER_PORT}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Why nodes are testable without API keys</strong>
        Because <code>classify_node</code> calls <code>classifier.classify()</code> — not <code>anthropic.messages.create()</code>. In tests, inject a mock:
        <CodeBlock title="Inject Mock Classifier in Tests" language="python" keyLine={1} keyNote="no API key needed; runs in 2ms">{CODE_MOCK_CLASSIFIER}</CodeBlock>
        No HTTP calls, no API key, runs in 2ms. This is the entire point of the pattern.
        <br /><br />
        <strong>Full explanation with worked example:</strong> See Module 7 (section 4.4) for how <code>functools.partial</code> injects ports into nodes, and how the adapter factory selects implementations from <code>MODEL_REGISTRY</code>.
      </div>
      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection — Module 4</strong>
        "Why SSE instead of WebSockets for AI chat?" → AI chat is server-speaks, client-listens — unidirectional. SSE runs over plain HTTP/1.1 with no special load balancer config. WebSockets need a bidirectional upgrade that many corporate proxies and CDNs don't support cleanly.
        <br /><br />
        <strong>Likely follow-up:</strong> "How do you bridge the synchronous LangGraph graph to an async FastAPI response?"<br />
        → Shared <code>asyncio.Queue</code>. Pipeline nodes call <code>queue.put_nowait()</code> (sync-safe). The FastAPI async generator <code>await queue.get()</code>s and yields each frame. The pipeline runs as <code>asyncio.create_task()</code>.
        <br /><br />
        <strong>Likely follow-up:</strong> "What's the failure mode if you put <code>connection_close</code> in the <code>finally</code> block?"<br />
        → If <code>finally</code> itself raises (e.g., Redis DECR fails), Python skips code after the try/finally entirely. The client never receives the close signal, the stream hangs open, and the next request from that user stalls.
      </div>

      <QuizSection moduleId={4} title="Module 4" contentHint="SSE vs WebSockets vs polling, LangGraph benefits, the asyncio.Queue pattern, two-stage SLM architecture and cost tradeoffs" />
    </>
  );
}
