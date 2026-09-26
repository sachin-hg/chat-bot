import { useState } from "react";
import { QuizSection } from "../components/QuizSection";
import { MENTAL_MODELS } from "../data/staticData";

const CARD_DATA = [
  { n: 1, title: 'Single\nResponsibility', color: '#89b4fa' },
  { n: 2, title: 'SSE\nis UX', color: '#a6e3a1' },
  { n: 3, title: 'LLM is\nLast Resort', color: '#f9e2af' },
  { n: 4, title: 'State Flows\nForward', color: '#94e2d5' },
  { n: 5, title: 'Design for\nEngineers', color: '#cba6f7' },
  { n: 6, title: 'Infra\nBehind UX', color: '#fab387' },
  { n: 7, title: 'Cascade\nTax', color: '#f38ba8' },
];

function MentalModelsPreview() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>7 MENTAL MODELS — THE PRINCIPLES BEHIND EVERY DECISION IN THIS CODEBASE</div>
      <svg
        viewBox="0 0 700 120"
        width="100%"
        style={{display:'block',margin:'0 auto'}}
        aria-label="7 mental model cards overview showing each principle's number and 3-word title"
      >
        {CARD_DATA.map((card, i) => {
          const x = 10 + i * 99;
          const isHov = hovered === i;
          const lines = card.title.split('\n');
          return (
            <g
              key={i}
              style={{cursor:'pointer'}}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Card background */}
              <rect
                x={x} y="10" width="88" height="80" rx="6"
                fill={isHov ? `${card.color}22` : '#1e1e2e'}
                stroke={isHov ? card.color : '#313244'}
                strokeWidth={isHov ? 2 : 1}
              />
              {/* Top accent bar */}
              <rect x={x} y="10" width="88" height="4" rx="3" fill={card.color} opacity="0.8"/>
              {/* Number */}
              <text
                x={x + 44} y="42"
                textAnchor="middle"
                fontSize="26"
                fontWeight="800"
                fill={card.color}
                opacity={isHov ? 1 : 0.6}
              >{card.n}</text>
              {/* Title lines */}
              {lines.map((line, li) => (
                <text
                  key={li}
                  x={x + 44}
                  y={60 + li * 14}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill={isHov ? card.color : '#bac2de'}
                >{line}</text>
              ))}
            </g>
          );
        })}
      </svg>
      <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'8px',justifyContent:'center'}}>
        {CARD_DATA.map((card, i) => (
          <span
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display:'inline-block',
              padding:'1px 7px',
              borderRadius:'4px',
              fontFamily:'monospace',
              fontSize:'0.82rem',
              margin:'2px',
              border:`1px solid ${hovered === i ? card.color : '#45475a'}`,
              background:'#313244',
              color: hovered === i ? card.color : '#6c7086',
              cursor:'pointer',
              transition:'color 0.15s,border-color 0.15s',
            }}
          >#{card.n}</span>
        ))}
      </div>
    </div>
  );
}

export function Mod15() {
  return (
    <>
      <MentalModelsPreview />
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>State each of the 7 mental models unprompted and give a concrete codebase example for each</li>
          <li>Apply each model to critique an unfamiliar design ("this violates model 4 because...")</li>
          <li>Connect each model to the interview question it answers at L5/L6 level</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~30 minutes</span>
          <span className="obj-diff">Difficulty: ★★☆☆☆</span>
          <span className="obj-diff">Prerequisites: Modules 3–14</span>
        </div>
      </div>
      <p>You've now designed, built, tested, deployed, and debugged an AI agent system. These seven mental models unify every decision you made — from why session state lives in Redis to why the LLM call sits in the middle of the pipeline. These aren't new ideas; they're the pattern you've been executing.</p>
      <div className="mental-grid">
        {MENTAL_MODELS.map((mm) => (
          <div className="mental-card" key={mm.num}>
            <div className="mental-num">{mm.num}</div>
            <div className="mental-title">{mm.title}</div>
            <div className="mental-desc" dangerouslySetInnerHTML={{ __html: mm.desc }} />
          </div>
        ))}
      </div>
      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection</strong>
        "What principles guide your AI system design decisions?" — This module is the answer. Don't recite all 7. Pick 3, state each in one sentence, give a specific codebase example, and connect each to a production consequence (latency saved, cost avoided, bug prevented). That's the L6 framing.
      </div>
      <div className="mini-check">
        <div className="mini-check-title">Final Self-Assessment</div>
        <ul>
          <li>A new node calls an external API and also formats the response string. Which mental model does this violate?</li>
          <li>A junior engineer adds <code>if sse_queue.empty(): skip_summary = True</code>. Which model does this violate?</li>
          <li>A PM asks: "Can we always use GPT-4 for every message?" What's the first question you ask and why?</li>
          <li>A new feature requires a 300ms API call. Where in the pipeline does it go so it doesn't add 300ms to P95?</li>
        </ul>
      </div>

      <h2>Answer Rubric — What Level Are You At?</h2>
      <p>For the question: <em>"A node calls an external API AND formats the response string. Which mental model does this violate?"</em></p>
      <table>
        <tr><th>Level</th><th>Answer</th><th>What's missing</th></tr>
        <tr>
          <td><strong>Weak</strong></td>
          <td>"It does two things so it should be split."</td>
          <td>Doesn't name the principle. Can't explain why it matters in production.</td>
        </tr>
        <tr>
          <td><strong>L5</strong></td>
          <td>"Mental model #1 — nodes are compiler passes. Each pass has one job. This node violates single responsibility. Split into <code>fetch_data_node</code> and <code>format_node</code>."</td>
          <td>Correct and clear, but no production consequence.</td>
        </tr>
        <tr>
          <td><strong>L6</strong></td>
          <td>"Mental model #1. The node violates the single-responsibility principle for nodes. In practice this means (1) you can't test the format logic without triggering the external call, so tests require mocks or live APIs; (2) if the API changes its schema, you're debugging a formatting bug too; (3) you can't cache or reuse the fetch result independently. Split: <code>fetch_data_node</code> puts raw data in state, <code>format_node</code> reads from state. Both testable in isolation."</td>
          <td>Nothing — this is the complete answer.</td>
        </tr>
      </table>

      <h2>Retrospective — Where Each Model Appeared</h2>
      <table>
        <tbody>
          <tr><th>Mental Model</th><th>Module</th><th>Decision it explained</th></tr>
          <tr><td>Nodes are compiler passes, not ChatGPT wrappers</td><td>Module 8</td><td>Every pipeline stage does one job; the 19-node structure is single responsibility applied to a DAG</td></tr>
          <tr><td>Emit SSE for UX, not for logic</td><td>Module 13</td><td>Streaming events are fire-and-forget; the playground works because no node reads what it emits</td></tr>
          <tr><td>The LLM is the last resort, not the first</td><td>Module 4</td><td>Tier 0/1/2 handle ~65% of messages without an LLM call — the source of the latency and cost numbers</td></tr>
          <tr><td>State flows forward, never backward</td><td>Module 6</td><td>BotState is a DAG; conditional edges read from state, never write back to earlier nodes</td></tr>
          <tr><td>Design for the next engineer, not the compiler</td><td>Module 5</td><td>Week-1 acceptance criteria: code a new hire can read, not just code that passes tests</td></tr>
          <tr><td>Infrastructure shouldn't touch UX timing</td><td>Module 18</td><td><code>connection_close</code> is emitted before Redis/Kafka writes; infrastructure is housekeeping</td></tr>
          <tr><td>The cascade of small latencies kills UX</td><td>Module 7</td><td>Tool calls run via <code>asyncio.gather()</code> — parallel execution collapses sequential latencies</td></tr>
        </tbody>
      </table>
      <div className="callout callout-info">
        <strong>You've completed the main arc.</strong><br />
        <br />
        <strong>Act 5 — Transfer &amp; Mastery:</strong> Module 44 takes these seven models into system design interviews. That is the course's primary endpoint.<br />
        <br />
        <strong>Act 4 — Go Deeper (optional):</strong> Act 4 is an independent reference toolkit — five clusters, each covering a different dimension of AI engineering. Take the clusters that match your current gap or project.
        <br /><br />
        <strong>Which cluster to start with:</strong>
        <table style={{fontSize:"13px",marginTop:"8px",width:"100%"}}>
          <tbody>
            <tr><th style={{width:"40%",textAlign:"left",paddingBottom:"4px"}}>If your gap is…</th><th style={{textAlign:"left",paddingBottom:"4px"}}>Start here</th></tr>
            <tr>
              <td>Retrieval, RAG, vector DBs, GraphRAG</td>
              <td><strong>Module 28</strong> — RAG &amp; Knowledge cluster (Modules 28–36)</td>
            </tr>
            <tr>
              <td>LangGraph internals, ToolNode, checkpointing</td>
              <td><strong>Module 25</strong> — LangGraph Code Constructs &amp; Patterns</td>
            </tr>
            <tr>
              <td>Model selection, local serving, fine-tuning</td>
              <td><strong>Module 37</strong> — Models &amp; Infrastructure cluster (Modules 37–40)</td>
            </tr>
            <tr>
              <td>Autonomous agents, multi-agent, MCP</td>
              <td><strong>Module 41</strong> — Agent Patterns cluster (Modules 41–45)</td>
            </tr>
            <tr>
              <td>Full picture — start to finish</td>
              <td><strong>Module 23</strong> (LLM Internals, now Act 0) → all Act 4 in order</td>
            </tr>
          </tbody>
        </table>
        <p style={{margin:"8px 0 0",fontSize:"12px",color:"var(--muted)"}}>Module numbers refer to final course IDs. You do not need Act 4 to do well in interviews — Act 5 is self-contained.</p>
      </div>

      <h2>Appendix A — Tech Stack Reference</h2>
      <table>
        <tr><th>Layer</th><th>Technology</th><th>Why</th><th>Alternatives</th></tr>
        <tr><td>API Server</td><td>FastAPI</td><td>async-native, auto-docs, type safety</td><td>Flask (sync), Django (heavy)</td></tr>
        <tr><td>Pipeline</td><td>LangGraph</td><td>typed state, conditional edges, tracing. Real value-add: (1) <strong>automatic LangSmith tracing</strong> — every node execution is captured with inputs/outputs, zero instrumentation needed; (2) <strong>explicit conditional edge DSL</strong> — branching logic is declared in the graph definition, not buried in if-statements inside functions; (3) <strong>correct async execution</strong> — handles asyncio node execution without deadlock. Honest alternative: a custom async Python pipeline is 100% viable and used by several large-scale systems. Choose LangGraph if observability and team familiarity with the LangChain ecosystem matter; choose a custom DAG if you want zero framework dependency and full control.</td><td>Custom DAG, Prefect</td></tr>
        <tr><td>LLM Provider</td><td>Anthropic Claude</td><td>best instruction-following, prompt caching</td><td>OpenAI, Gemini</td></tr>
        <tr><td>Session Store</td><td>Redis</td><td>sub-ms latency, TTL, Lua atomics</td><td>Memcached (no Lua), Postgres (slow)</td></tr>
        <tr><td>Event Stream</td><td>Kafka</td><td>durable, replayable, multi-consumer</td><td>RabbitMQ (no replay), SQS</td></tr>
        <tr><td>Persistence</td><td>PostgreSQL</td><td>ACID, complex queries</td><td>MongoDB, DynamoDB</td></tr>
        <tr><td>Observability</td><td>LangSmith</td><td>native LangGraph integration</td><td>W&amp;B, custom</td></tr>
        <tr><td>Client Stream</td><td>SSE</td><td>simple, HTTP/1.1 compatible</td><td>WebSockets, Long polling</td></tr>
      </table>

      <h2>Appendix B — Production Checklist</h2>
      <ul className="checklist">
        <li>Every external call has a timeout (2s for tools, 10s for LLMs)</li>
        <li>Every timeout has a fallback (log + skip, not crash)</li>
        <li>LLM concurrency is rate-limited (gate with queue)</li>
        <li>Session reads/writes are atomic (Lua CAS)</li>
        <li>Kafka writes are fire-and-forget (never blocking the user)</li>
        <li>connection_close is guaranteed even when infrastructure fails</li>
        <li>Per-turn cost is logged and monitored</li>
        <li>A/B experiment config is hot-reloaded (no deploys to change traffic splits)</li>
        <li>Playground shows every node's decision in real-time</li>
        <li>LangSmith traces every LLM call with full context</li>
        <li>Background tasks don't leak across request boundaries <small style={{color: "#a6adc8"}}>— Audit: search for <code>asyncio.create_task()</code> calls; each must use <code>create_tracked_task()</code> (see Gotcha 14.8) or be &lt;50ms. Test: kill a request mid-flight in load test and verify <code>asyncio.all_tasks()</code> returns to baseline count afterward.</small></li>
      </ul>

      <h2>What to Build Next</h2>
      <ol>
        <li><strong>Conversation Summarization</strong> — At turn 20, fire a background Haiku call. Store as session.summary, inject instead of full turn_history. Context window stays small forever.</li>
        <li><strong>Multi-Intent Decomposition</strong> — Detect two intents, execute both in parallel, merge responses.</li>
        <li><strong>Cross-Session Memory</strong> — User's city, budget, saved searches persist in Postgres across sessions.</li>
        <li><strong>Streaming Tool Results</strong> — Stream partial tool results to the client as they arrive (for slow APIs).</li>
        <li><strong>Autonomous Agent Mode</strong> — Planning node + sub-task decomposition. LangGraph supports cycles via explicit loop edges, but requires a <code>recursion_limit</code> set at graph compile time as an absolute safety net. Three practical loop detection strategies: (1) <strong>max_iterations counter</strong> in BotState — if the planning node re-queues the same sub-task more than N times, force-terminate and return an error response; (2) <strong>visited state hashing</strong> — hash the (intent, active_filters, last_tool_call) tuple; if seen twice in the same session, break and return "I seem to be going in circles, can you rephrase?"; (3) <strong>sub-task deduplication</strong> — the planning node checks its pending queue for duplicate tasks before enqueuing. All three should be combined in production.</li>
      </ol>
      <QuizSection moduleId={22} title="Mental Models &amp; Appendices" contentHint="The 7 mental models, production checklist, tech stack choices and alternatives, next features to build" />
    </>
  );
}
