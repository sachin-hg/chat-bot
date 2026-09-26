import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from '../components/CodeBlock';

// FIX 3 — SPECTRUM VIZ: responsive card grid with framer-motion
const SPECTRUM_CARDS = [
  {
    title: "Scripted Pipeline",
    subtitle: "Deterministic, linear, no branches",
    snippet: `# Scripted pipeline: classify → search → format
intent = classify(message)
if intent == "property_search":
    results = search_properties(filters)
    return format_results(results)
return fallback_response()`,
  },
  {
    title: "Structured Agent",
    subtitle: "Classify → fetch → validate → respond",
    snippet: `# Structured agent: pipeline with routing
state = build_state(message, session)
state = classify_node(state)
state = enrich_node(state)
state = retrieve_node(state)
state = respond_node(state)
return state["response"]`,
  },
  {
    title: "ReAct Agent",
    subtitle: "Plan → tools → observe → plan (loops)",
    snippet: `# ReAct: reason + act in a loop
while not done:
    thought = llm.think(observations)
    action = llm.choose_tool(thought)
    obs = execute_tool(action)
    observations.append(obs)
    done = llm.is_complete(observations)`,
  },
  {
    title: "Multi-Agent",
    subtitle: "Goal → decompose → parallel execution",
    snippet: `# Multi-agent: orchestrator + workers
plan = orchestrator.decompose(goal)
futures = [
    worker.run(task)
    for task in plan.tasks
]
results = await asyncio.gather(*futures)
return orchestrator.synthesize(results)`,
  },
];

function AgentSpectrumViz() {
  const [openCard, setOpenCard] = useState<number | null>(null);

  return (
    <div style={{ margin: "20px 0" }}>
      <div
        style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-muted, #6c7086)",
          marginBottom: "14px",
        }}
      >
        AI AGENT SPECTRUM — FROM DETERMINISTIC TOOLS TO AUTONOMOUS AGENTS
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        {SPECTRUM_CARDS.map((card, i) => (
          <motion.div
            key={card.title}
            whileHover={{ scale: 1.02 }}
            onClick={() => setOpenCard(openCard === i ? null : i)}
            style={{
              background: "var(--bg2, #181825)",
              border: "1px solid var(--border, #313244)",
              borderRadius: "var(--radius-md, 8px)",
              padding: "16px",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: "4px", fontSize: "0.95rem" }}>
              {card.title}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #6c7086)", marginBottom: "10px" }}>
              {card.subtitle}
            </div>
            {openCard === i && (
              <pre
                style={{
                  fontSize: "0.72rem",
                  lineHeight: 1.6,
                  background: "var(--bg, #11111b)",
                  border: "1px solid var(--border, #313244)",
                  borderRadius: "6px",
                  padding: "10px",
                  margin: 0,
                  overflowX: "auto",
                  whiteSpace: "pre",
                  color: "var(--text, #cdd6f4)",
                }}
              >
                {card.snippet}
              </pre>
            )}
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--accent, #89b4fa)",
                marginTop: "6px",
                textAlign: "right",
              }}
            >
              {openCard === i ? "▲ collapse" : "▼ show code"}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// FIX 2 — DONUT CHART
function DonutViz() {
  const [visible, setVisible] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const r = 54;
  const cx = 70;
  const cy = 70;
  const circ = 2 * Math.PI * r; // ~339.3

  // 85% arc for infrastructure (accent2 green), 15% arc for LLM (accent blue)
  // We draw infrastructure first (full background ring), then LLM arc on top
  const infra = circ * 0.85;
  const llm = circ * 0.15;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "28px",
        flexWrap: "wrap",
        background: "var(--bg2, #181825)",
        border: "1px solid var(--border, #313244)",
        borderRadius: "var(--radius-md, 8px)",
        padding: "20px 24px",
        margin: "20px 0",
      }}
    >
      {/* SVG donut */}
      <svg
        ref={svgRef}
        viewBox="0 0 140 140"
        width="140"
        height="140"
        style={{ flexShrink: 0 }}
        aria-label="Donut chart: LLM is 15%, infrastructure is 85%"
      >
        {/* Infrastructure arc — 85%, accent2 green */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--accent2, #a6e3a1)"
          strokeWidth="18"
          strokeDasharray={`${visible ? infra : 0} ${circ}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 1.2s ease" }}
        />
        {/* LLM arc — 15%, accent blue, starts after the 85% gap */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--accent, #89b4fa)"
          strokeWidth="18"
          strokeDasharray={`${visible ? llm : 0} ${circ}`}
          strokeDashoffset={-(infra)}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 1.2s ease 0.15s" }}
        />
        {/* Center text */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="var(--accent, #89b4fa)"
        >
          LLM
        </text>
        <text
          x={cx}
          y={cy + 11}
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fill="var(--text, #cdd6f4)"
        >
          15%
        </text>
      </svg>

      {/* Legend + callout */}
      <div style={{ flex: 1, minWidth: "180px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "var(--accent, #89b4fa)",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "0.85rem" }}>
              <strong>LLM</strong> — 15% of system complexity
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "var(--accent2, #a6e3a1)",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "0.85rem" }}>
              <strong>Infrastructure</strong> — 85%: routing, state, tools, observability
            </span>
          </div>
        </div>
        <div
          style={{
            fontSize: "0.82rem",
            fontStyle: "italic",
            color: "var(--text-muted, #6c7086)",
            borderLeft: "3px solid var(--accent2, #a6e3a1)",
            paddingLeft: "10px",
          }}
        >
          The model is the easiest part to swap. The pipeline is the moat.
        </div>
      </div>
    </div>
  );
}

function ThreeQuestionViz() {
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>THREE-QUESTION TEST — DO YOU ACTUALLY NEED AN AGENT?</div>
      <svg viewBox="0 0 560 212" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Three question autonomy test flowchart">
        <defs>
          <marker id="tq-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#6c7086"/></marker>
          <marker id="tq-arr-y" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#a6e3a1"/></marker>
          <marker id="tq-arr-n" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#f38ba8"/></marker>
        </defs>

        {/* Q1 Diamond */}
        <polygon points="120,20 200,50 120,80 40,50" fill="#313244" stroke="#89b4fa" strokeWidth="1.5"/>
        <text x="120" y="46" textAnchor="middle" fontSize="9" fill="#89b4fa">Q1: PLAN</text>
        <text x="120" y="58" textAnchor="middle" fontSize="8" fill="#bac2de">multi-step tasks?</text>

        {/* Yes → right */}
        <line x1="200" y1="50" x2="230" y2="50" stroke="#a6e3a1" strokeWidth="1.5" markerEnd="url(#tq-arr-y)"/>
        <text x="215" y="45" textAnchor="middle" fontSize="8" fill="#a6e3a1">Yes</text>

        {/* Q2 Diamond */}
        <polygon points="320,20 400,50 320,80 240,50" fill="#313244" stroke="#94e2d5" strokeWidth="1.5"/>
        <text x="320" y="46" textAnchor="middle" fontSize="9" fill="#94e2d5">Q2: REACT</text>
        <text x="320" y="58" textAnchor="middle" fontSize="8" fill="#bac2de">unexpected results?</text>

        {/* Yes → right */}
        <line x1="400" y1="50" x2="430" y2="50" stroke="#a6e3a1" strokeWidth="1.5" markerEnd="url(#tq-arr-y)"/>
        <text x="415" y="45" textAnchor="middle" fontSize="8" fill="#a6e3a1">Yes</text>

        {/* Q3 Diamond */}
        <polygon points="500,20 556,50 500,80 444,50" fill="#313244" stroke="#cba6f7" strokeWidth="1.5"/>
        <text x="500" y="46" textAnchor="middle" fontSize="9" fill="#cba6f7">Q3: LEARN</text>
        <text x="500" y="58" textAnchor="middle" fontSize="8" fill="#bac2de">from session?</text>

        {/* Q1 No → down left */}
        <line x1="120" y1="80" x2="120" y2="130" stroke="#f38ba8" strokeWidth="1.5" markerEnd="url(#tq-arr-n)"/>
        <text x="108" y="108" fontSize="8" fill="#f38ba8">No</text>
        <rect x="50" y="130" width="140" height="30" rx="6" fill="#313244" stroke="#f38ba8" strokeWidth="1.5"/>
        <text x="120" y="149" textAnchor="middle" fontSize="10" fill="#f38ba8">Simple tool call</text>

        {/* Q2 No → down */}
        <line x1="320" y1="80" x2="320" y2="130" stroke="#f38ba8" strokeWidth="1.5" markerEnd="url(#tq-arr-n)"/>
        <text x="308" y="108" fontSize="8" fill="#f38ba8">No</text>
        <rect x="240" y="130" width="160" height="30" rx="6" fill="#313244" stroke="#fab387" strokeWidth="1.5"/>
        <text x="320" y="149" textAnchor="middle" fontSize="10" fill="#fab387">Scripted pipeline</text>

        {/* Q3 Yes → down */}
        <line x1="500" y1="80" x2="500" y2="130" stroke="#a6e3a1" strokeWidth="1.5" markerEnd="url(#tq-arr-y)"/>
        <text x="506" y="108" fontSize="8" fill="#a6e3a1">Yes</text>
        <rect x="430" y="130" width="120" height="30" rx="6" fill="#313244" stroke="#cba6f7" strokeWidth="1.5"/>
        <text x="490" y="145" textAnchor="middle" fontSize="9" fill="#cba6f7">Full autonomous</text>
        <text x="490" y="156" textAnchor="middle" fontSize="9" fill="#cba6f7">agent</text>

        {/* Q3 No → ReAct agent (L-shaped to avoid crossing Scripted pipeline box) */}
        <path d="M444,65 L415,65 L415,175" fill="none" stroke="#f38ba8" strokeWidth="1.5" markerEnd="url(#tq-arr-n)"/>
        <text x="426" y="60" fontSize="8" fill="#f38ba8">No</text>
        <rect x="355" y="175" width="120" height="30" rx="6" fill="#313244" stroke="#a6e3a1" strokeWidth="1.5"/>
        <text x="415" y="194" textAnchor="middle" fontSize="10" fill="#a6e3a1">ReAct agent</text>
      </svg>
    </div>
  );
}

export function Mod0() {
  return (
    <>
      <p className="module-hook">Most developers call anything with an LLM "an AI agent." After this module, you'll see why that definition is almost always wrong — and why getting it right changes every architectural decision that follows.</p>

      {/* FIX 1 — learning-obj and AgentSpectrumViz BEFORE the code block */}
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Explain the difference between an LLM wrapper, an agent, and an autonomous agent with a concrete example of each</li>
          <li>Apply the three-question test to any product brief to decide if autonomous agents are appropriate</li>
          <li>Articulate why Housing.com chose the agent tier and what constraint drove that choice</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~30 minutes</span>
          <span className="obj-diff">Difficulty: ★★☆☆☆</span>
          <span className="obj-diff">Prerequisites: none</span>
        </div>
      </div>

      <AgentSpectrumViz />
      <ThreeQuestionViz />

      {/* Code block now appears AFTER learning-obj and AgentSpectrumViz */}
      <h2 style={{marginTop:0}}>Run This First — 20 Lines to Production Shape</h2>
      <p>Before the mental models, run the system. This is the Housing.com chatbot in its minimal form:</p>
      <CodeBlock title="Install Anthropic SDK" language="bash" keyLine={1} keyNote="only dependency needed to start">{`pip install anthropic`}</CodeBlock>
      <CodeBlock title="Minimal Housing.com Chatbot — 20 Lines" language="python" keyLine={3} keyNote="client is the only global; everything else is local">{`from anthropic import Anthropic
client = Anthropic()

def classify(message: str) -> str:
    r = client.messages.create(
        model="claude-haiku-4-5-20251001", max_tokens=10,
        messages=[{"role": "user", "content":
            f"Classify: {message}\\n"
            f"Options: property_search, general, off_topic\\n"
            f"Reply with exactly one option."}]
    )
    return r.content[0].text.strip()

def pipeline(message: str) -> str:
    intent = classify(message)
    if intent == "property_search":
        return f"[Searching] {message}"
    elif intent == "general":
        return f"[Answering] {message}"
    return "[Off-topic] I help with property searches."

print(pipeline("Show me 2BHK flats in Mumbai under 2Cr"))
print(pipeline("What's the weather today?"))`}</CodeBlock>
      <div className="callout callout-info">
        This is the Housing.com chatbot in 20 lines. The rest of the course is making this pipeline <strong>production-ready</strong> — streaming, stateful, multi-domain, observable, secure, and scalable to 1M DAU.
      </div>

      <h2>3.1 What is an AI Agent? (Not what you think)</h2>
      <p>Most people think an AI agent is "ChatGPT with extra steps." It isn't.</p>
      <p>An <strong>LLM</strong> takes text in, produces text out. It has no memory, no tools, no concept of your user's session, no business rules. Left alone it will confidently make things up.</p>
      <p>An <strong>AI Agent</strong> is a <em>system</em> that wraps an LLM with:</p>
      <ul>
        <li><strong>Memory</strong> — what the user said before, filters they set, what they've seen</li>
        <li><strong>Routing</strong> — not every message needs the expensive LLM; most need the right <em>action</em></li>
        <li><strong>Tools</strong> — real API calls to fetch real data</li>
        <li><strong>Guard rails</strong> — safety, output validation, cost control</li>
        <li><strong>Observability</strong> — you need to know what it did and why, not just what it said</li>
      </ul>
      <div className="callout callout-info"><strong>Key Insight</strong>The LLM is about 15% of this codebase. The other 85% is the <em>system</em> around it.</div>

      {/* FIX 2 — DonutViz placed after the 85/15 prose section */}
      <DonutViz />

      <div className="callout callout-tip"><strong>Mental Model</strong>An AI agent is a <strong>compiler</strong>. The user's natural language message is source code. Your pipeline is the compiler passes. The rendered response is the output. Each pass has a specific job. No pass does another pass's job.</div>

      <h2>3.2 The Spectrum: Wrapper → Agent → Autonomous Agent</h2>
      <div className="spectrum">
        <div className="spec-col">
          <div className="spec-title" style={{color: "var(--accent2)"}}>LLM Wrapper</div>
          <div className="spec-desc">user → LLM → user<br /><br />No memory<br />No tools<br />No routing<br /><br />Fast, dumb, cheap</div>
        </div>
        <div className="spec-col">
          <div className="spec-title" style={{color: "var(--accent)"}}>Agent ← You are here</div>
          <div className="spec-desc">user → pipeline<br />&nbsp;&nbsp;→ classify<br />&nbsp;&nbsp;→ fetch data<br />&nbsp;&nbsp;→ LLM<br />&nbsp;&nbsp;→ validate<br />&nbsp;&nbsp;→ respond<br /><br />Predictable, fast, production-safe</div>
        </div>
        <div className="spec-col">
          <div className="spec-title" style={{color: "var(--accent3)"}}>Autonomous Agent</div>
          <div className="spec-desc">user → planner<br />&nbsp;&nbsp;→ sub-tasks<br />&nbsp;&nbsp;→ LLMs in parallel<br />&nbsp;&nbsp;→ tool loops<br />&nbsp;&nbsp;→ self-correcting<br /><br />Costly, complex, risky</div>
        </div>
      </div>
      <div className="callout callout-warn"><strong>Why not autonomous agents?</strong>Autonomous agents fail in production because: (1) Unbounded tool loops — the agent calls searchProperties 40 times, spends $2 on one turn. (2) Cascading hallucination — planner invents a sub-task that executes against a real API. (3) Context collapse — at turn 80 the window fills and earlier instructions are ignored. Use autonomous agents only when the completion criterion is machine-verifiable AND every tool call is sandboxed AND a human reviews before irreversible actions.</div>

      <h2>3.3 The Housing.com Problem</h2>
      <p>Housing.com has millions of property listings. Users describe what they want in natural language: <em>"show me 3BHK in Bandra under 2Cr with parking, near the sea."</em></p>
      <table>
        <tbody>
          <tr><th>Without AI</th><th>With AI Agent</th></tr>
          <tr><td>User fills in 8 dropdowns</td><td>One sentence → right properties</td></tr>
          <tr><td>Rigid, slow, frustrating</td><td>Natural, fast, delightful</td></tr>
          <tr><td>No context across turns</td><td>Remembers "the third one", pivot requests</td></tr>
        </tbody>
      </table>
      <p>The hard part isn't the happy path. The hard part is:</p>
      <ul>
        <li>Users say vague things (<em>"something affordable in a good locality"</em>)</li>
        <li>Users pivot mid-conversation (<em>"actually show me 2BHK instead"</em>)</li>
        <li>Users refer to things they already saw (<em>"tell me more about the third one"</em>)</li>
        <li>Some messages are malicious (<em>"ignore previous instructions"</em>)</li>
        <li>The system must work in 500ms, not 30 seconds</li>
        <li>It must cost less than ₹1 per session</li>
      </ul>
      <p><strong>Every design decision in this codebase is a response to one of these pressures.</strong></p>

      <h2>3.4 When Autonomous Agents ARE Appropriate</h2>
      <p>The previous section showed the failure modes. But dismissing autonomous agents entirely misses legitimate enterprise use cases. The question isn't "are they risky?" (yes, they are) — it's "can the risks be bounded?"</p>
      <p><strong>The three-question test before choosing autonomous:</strong></p>
      <table>
        <tbody>
          <tr><th>Question</th><th>If NO → don't use autonomous</th></tr>
          <tr><td>Is completion machine-verifiable?</td><td>If a human must judge success, the agent will spin indefinitely or hallucinate completion</td></tr>
          <tr><td>Are all tool calls sandboxed?</td><td>If a tool has real-world side effects (send email, charge card), one loop bug costs real money or sends real messages</td></tr>
          <tr><td>Does a human review before irreversible actions?</td><td>If the agent can write files, merge PRs, or POST to production APIs without a human checkpoint, you need a human gate</td></tr>
        </tbody>
      </table>
      <div className="callout callout-tip"><strong>Enterprise patterns where autonomous agents work well</strong>
        <ul style={{margin: "8px 0 0 16px"}}>
          <li><strong>Code review agent</strong> — reads diff, writes comments; completion = comment posted; no irreversible production action</li>
          <li><strong>Document processing pipeline</strong> — extracts structured data from PDFs; completion = JSON schema validates; retries are cheap</li>
          <li><strong>Compliance checking</strong> — reads configuration, flags violations; human approves remediation before any change is applied</li>
          <li><strong>Internal tooling</strong> — low volume, internal users, staging environment, human reviews output before it reaches customers</li>
        </ul>
      </div>
      <div className="callout callout-warn"><strong>Housing.com specifically</strong>This pipeline chose the structured agent approach because: (1) Housing search has a <em>defined completion criterion</em> but it's not machine-verifiable — "good results" requires user feedback. (2) Tool calls hit live APIs with real data. (3) The system must handle millions of users without human review. All three questions answered "no" — so we built a structured pipeline instead.</div>

      <h2>3.5 Your Learning Map — The 6-Step Framework</h2>
      <p>At the end of this course — in <strong>Module 44</strong> — you will use a 6-step framework to design <em>any</em> AI system in a 45-minute interview. Here it is as a preview, so you know where you're headed:</p>
      <ol>
        <li><strong>Clarify &amp; Scope</strong> — Define the problem boundaries before touching architecture</li>
        <li><strong>Choose the Agent Tier</strong> — Apply the three-question test (§0.4 above)</li>
        <li><strong>Design the Data Flow</strong> — From raw input → structured state → tool output → response</li>
        <li><strong>Design the Pipeline Stages</strong> — Classify → Enrich → Retrieve → Respond → Validate</li>
        <li><strong>Handle Failure Modes</strong> — Concurrency, latency budgets, graceful degradation</li>
        <li><strong>Evaluate &amp; Iterate</strong> — The eval flywheel, RAGAS, A/B testing</li>
      </ol>
      <div className="callout callout-info"><strong>Why preview this now?</strong> Each module in this course builds one piece of this framework. By Module 44, you won't be learning a new framework — you'll be recognising the pattern you've been building all along.</div>

      <h2>3.6 Seven Principles That Unite This Course</h2>
      <p>In <strong>Module 22</strong>, after you've built and hardened the system, you'll encounter seven mental models that explain <em>why</em> every architectural decision was made. Here they are as signposts — you'll recognise them as you work through the course:</p>
      <ul>
        <li><strong>Nodes are compiler passes, not ChatGPT wrappers</strong> — each pipeline stage does exactly one job; if it does two, split it</li>
        <li><strong>Emit SSE for UX, not for logic</strong> — streaming events are fire-and-forget; no node should make a decision based on what was emitted</li>
        <li><strong>The LLM is the last resort, not the first</strong> — most user actions don't need the LLM; route to Tier 0/1 first, faster and cheaper</li>
        <li><strong>State flows forward, never backward</strong> — the pipeline is a DAG; if you need to backtrack, you designed the wrong graph</li>
        <li><strong>Design for the next engineer, not the compiler</strong> — every function and structure should be legible to someone reading the code 6 months later</li>
        <li><strong>Infrastructure shouldn't touch UX timing</strong> — Redis, Kafka, Postgres are housekeeping; close the connection before you write to them</li>
        <li><strong>The cascade of small latencies kills UX</strong> — 200ms + 500ms + 2000ms = 2.7s; every added node compounds your P95</li>
      </ul>

      <QuizSection moduleId={3} title="Module 3" contentHint="AI agents, the agent spectrum, Housing.com use case and constraints, three-question autonomous agent test" />
    </>
  );
}
