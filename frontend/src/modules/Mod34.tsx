import { useState, useEffect } from 'react';
import { QuizSection } from "../components/QuizSection";

function SupervisorArchViz() {
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <style>{`@keyframes dashFlowS{to{stroke-dashoffset:-14}}`}</style>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>SUPERVISOR ARCHITECTURE — ORCHESTRATED MULTI-AGENT SYSTEM</div>
      <svg viewBox="0 0 560 250" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Supervisor architecture with three worker agents below a supervisor">
        <defs>
          <marker id="sup-arr-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#89b4fa"/></marker>
          <marker id="sup-arr-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#a6e3a1"/></marker>
          <marker id="sup-arr-mauve" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#cba6f7"/></marker>
          <marker id="sup-arr-peach" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#fab387"/></marker>
          <marker id="sup-arr-amber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#f9e2af"/></marker>
        </defs>

        {/* User box — left */}
        <rect x="10" y="100" width="80" height="48" rx="6" fill="#313244" stroke="#fab387" strokeWidth="1.5"/>
        <text x="50" y="121" textAnchor="middle" fontSize="11" fill="#fab387" fontWeight="700">User</text>
        <text x="50" y="137" textAnchor="middle" fontSize="9" fill="#bac2de">query / answer</text>

        {/* Supervisor box — top center */}
        <rect x="190" y="20" width="180" height="56" rx="6" fill="#313244" stroke="#89b4fa" strokeWidth="2"/>
        <text x="280" y="44" textAnchor="middle" fontSize="13" fill="#89b4fa" fontWeight="700">Supervisor Agent</text>
        <text x="280" y="60" textAnchor="middle" fontSize="10" fill="#bac2de">Routes based on intent</text>

        {/* Worker boxes — each worker gets its own colour */}
        {/* Search Worker: var(--accent) blue #89b4fa */}
        <rect x="80" y="160" width="120" height="48" rx="6" fill="#313244" stroke="#89b4fa" strokeWidth="1.5"/>
        <text x="140" y="181" textAnchor="middle" fontSize="11" fill="#89b4fa" fontWeight="700">Search Worker</text>
        <text x="140" y="197" textAnchor="middle" fontSize="9" fill="#bac2de">property lookup</text>

        {/* Filter Worker: var(--accent5) amber #f9e2af */}
        <rect x="220" y="160" width="120" height="48" rx="6" fill="#313244" stroke="#f9e2af" strokeWidth="1.5"/>
        <text x="280" y="181" textAnchor="middle" fontSize="11" fill="#f9e2af" fontWeight="700">Filter Worker</text>
        <text x="280" y="197" textAnchor="middle" fontSize="9" fill="#bac2de">rank &amp; filter</text>

        {/* Response Worker: var(--accent2) green #a6e3a1 */}
        <rect x="360" y="160" width="120" height="48" rx="6" fill="#313244" stroke="#a6e3a1" strokeWidth="1.5"/>
        <text x="420" y="181" textAnchor="middle" fontSize="11" fill="#a6e3a1" fontWeight="700">Response Worker</text>
        <text x="420" y="197" textAnchor="middle" fontSize="9" fill="#bac2de">format &amp; reply</text>

        {/* Supervisor → Search Worker: blue arrows */}
        <line x1="220" y1="76" x2="140" y2="160" stroke="#89b4fa" strokeWidth="1.5" strokeDasharray="4 3" style={{animation:'dashFlowS 1s linear infinite'}} markerEnd="url(#sup-arr-blue)"/>
        <text x="160" y="118" fontSize="9" fill="#89b4fa">task</text>

        {/* Supervisor → Filter Worker: amber arrows */}
        <line x1="280" y1="76" x2="280" y2="160" stroke="#f9e2af" strokeWidth="1.5" strokeDasharray="4 3" style={{animation:'dashFlowS 1s linear infinite'}} markerEnd="url(#sup-arr-amber)"/>
        <text x="285" y="122" fontSize="9" fill="#f9e2af">task</text>

        {/* Supervisor → Response Worker: green arrows */}
        <line x1="340" y1="76" x2="420" y2="160" stroke="#a6e3a1" strokeWidth="1.5" strokeDasharray="4 3" style={{animation:'dashFlowS 1s linear infinite'}} markerEnd="url(#sup-arr-green)"/>
        <text x="392" y="118" fontSize="9" fill="#a6e3a1">task</text>

        {/* Search Worker → Supervisor: blue */}
        <line x1="152" y1="160" x2="232" y2="76" stroke="#89b4fa" strokeWidth="1.2" markerEnd="url(#sup-arr-blue)"/>
        <text x="174" y="132" fontSize="9" fill="#89b4fa">result</text>

        {/* Filter Worker → Supervisor: amber */}
        <line x1="292" y1="160" x2="292" y2="76" stroke="#f9e2af" strokeWidth="1.2" markerEnd="url(#sup-arr-amber)"/>
        <text x="297" y="132" fontSize="9" fill="#f9e2af">result</text>

        {/* Response Worker → Supervisor: green */}
        <line x1="408" y1="160" x2="328" y2="76" stroke="#a6e3a1" strokeWidth="1.2" markerEnd="url(#sup-arr-green)"/>
        <text x="375" y="132" fontSize="9" fill="#a6e3a1">result</text>

        {/* User → Supervisor */}
        <line x1="90" y1="116" x2="190" y2="52" stroke="#fab387" strokeWidth="1.5" markerEnd="url(#sup-arr-peach)"/>
        <text x="115" y="78" fontSize="9" fill="#fab387">query</text>

        {/* Supervisor → User (final response) */}
        <path d="M190,68 Q120,68 90,132" fill="none" stroke="#cba6f7" strokeWidth="1.5" markerEnd="url(#sup-arr-mauve)"/>
        <text x="112" y="90" fontSize="9" fill="#cba6f7">final</text>
        <text x="108" y="101" fontSize="9" fill="#cba6f7">response</text>

        {/* Conditional routing label */}
        <rect x="192" y="88" width="176" height="20" rx="4" fill="#1e1e2e" stroke="#45475a" strokeWidth="1"/>
        <text x="280" y="101" textAnchor="middle" fontSize="9" fill="#6c7086">routes by intent: search / filter / respond / FINISH</text>
      </svg>
    </div>
  );
}

// Supervisor Multi-Agent Sequence animated SVG
const SEQUENCE_STEPS = [
  { from: 0, to: 1, label: 'Research LLM market' },
  { from: 1, to: 2, label: 'Find top 5 LLM providers' },
  { from: 1, to: 3, label: 'Prepare comparison framework' },
  { from: 2, to: 1, label: 'Results: OpenAI, Anthropic, Google...' },
  { from: 1, to: 3, label: 'Analyze these providers' },
  { from: 3, to: 1, label: 'Analysis complete' },
  { from: 1, to: 4, label: 'Write final report' },
  { from: 4, to: 0, label: 'Report delivered' },
];

const LANE_DEFS = [
  { label: 'User',           color: '#6c7086' },
  { label: 'Supervisor',     color: '#f9e2af' },
  { label: 'Research Agent', color: '#89b4fa' },
  { label: 'Analyst Agent',  color: '#a6e3a1' },
  { label: 'Writer Agent',   color: '#cba6f7' },
];

function SupervisorSequenceViz() {
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (step >= SEQUENCE_STEPS.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setStep(s => s + 1), 800);
    return () => clearTimeout(t);
  }, [playing, step]);

  function handlePlay() {
    if (step >= SEQUENCE_STEPS.length - 1) { setStep(0); setPlaying(true); return; }
    setPlaying(true);
  }
  function handleReset() { setPlaying(false); setStep(-1); }

  const W = 640, H = 400;
  const laneCount = LANE_DEFS.length;
  const laneW = W / laneCount;
  const headerH = 44;
  const laneX = (i: number) => laneW * i + laneW / 2;
  const rowH = (H - headerH - 20) / SEQUENCE_STEPS.length;

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <style>{`
        @keyframes seqArrow {
          from { stroke-dashoffset: 300; opacity: 0; }
          to   { stroke-dashoffset: 0;   opacity: 1; }
        }
        .seq-arrow-line { stroke-dasharray: 300; animation: seqArrow 0.5s ease forwards; }
      `}</style>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'12px'}}>
        SUPERVISOR MULTI-AGENT SEQUENCE
      </div>
      <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}>
        <button onClick={handlePlay} disabled={playing} style={{padding:'5px 16px',fontSize:'0.78rem',background:'#313244',color:'#cdd6f4',border:'1px solid #45475a',borderRadius:'5px',cursor:playing?'default':'pointer',opacity:playing?0.6:1}}>
          {step >= SEQUENCE_STEPS.length - 1 && !playing ? 'Replay' : 'Play'}
        </button>
        <button onClick={handleReset} style={{padding:'5px 16px',fontSize:'0.78rem',background:'#313244',color:'#cdd6f4',border:'1px solid #45475a',borderRadius:'5px',cursor:'pointer'}}>
          Reset
        </button>
        <span style={{fontSize:'0.76rem',color:'#6c7086',alignSelf:'center'}}>
          Step {Math.max(step, 0)}/{SEQUENCE_STEPS.length}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block'}} aria-label="Supervisor sequence diagram">
        {/* Lane headers */}
        {LANE_DEFS.map((lane, i) => (
          <g key={lane.label}>
            <rect x={laneW * i} y={0} width={laneW} height={headerH} rx="0" fill="#1e1e2e" stroke="#313244" strokeWidth="0.5"/>
            <rect x={laneW * i + 4} y={6} width={laneW - 8} height={headerH - 12} rx="5" fill="#313244" stroke={lane.color} strokeWidth="1.2"/>
            <text x={laneX(i)} y={headerH / 2 + 5} textAnchor="middle" fontSize="11" fill={lane.color} fontWeight="700">{lane.label}</text>
          </g>
        ))}
        {/* Vertical dashed lane dividers */}
        {LANE_DEFS.map((_, i) => i > 0 && (
          <line key={`div-${i}`} x1={laneW * i} y1={headerH} x2={laneW * i} y2={H} stroke="#313244" strokeWidth="1" strokeDasharray="4 4"/>
        ))}
        {/* Vertical lane center lines */}
        {LANE_DEFS.map((lane, i) => (
          <line key={`center-${i}`} x1={laneX(i)} y1={headerH} x2={laneX(i)} y2={H - 10} stroke={lane.color} strokeWidth="1" strokeDasharray="2 6" opacity="0.3"/>
        ))}
        {/* Sequence arrows */}
        {SEQUENCE_STEPS.map((s, idx) => {
          if (idx > step) return null;
          const y = headerH + 20 + idx * rowH + rowH / 2;
          const x1 = laneX(s.from);
          const x2 = laneX(s.to);
          const isActive = idx === step;
          const fromColor = LANE_DEFS[s.from].color;
          const toColor = LANE_DEFS[s.to].color;
          const arrowColor = fromColor;
          const midX = (x1 + x2) / 2;
          const markerId = `seq-arr-${idx}`;
          const goRight = x2 > x1;
          return (
            <g key={idx}>
              <defs>
                <marker id={markerId} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L7,3 z" fill={arrowColor}/>
                </marker>
              </defs>
              <line
                x1={x1} y1={y} x2={x2 + (goRight ? -6 : 6)} y2={y}
                stroke={arrowColor}
                strokeWidth={isActive ? 2 : 1.4}
                markerEnd={`url(#${markerId})`}
                className={isActive ? 'seq-arrow-line' : ''}
                opacity={isActive ? 1 : 0.5}
              />
              {/* Circle at origin */}
              <circle cx={x1} cy={y} r="3.5" fill={fromColor} opacity={isActive ? 1 : 0.5}/>
              {/* Label */}
              <rect x={midX - 80} y={y - 14} width="160" height="13" rx="3" fill="#1e1e2e" opacity={isActive ? 0.9 : 0.6}/>
              <text x={midX} y={y - 4} textAnchor="middle" fontSize="9" fill={isActive ? arrowColor : '#6c7086'} fontWeight={isActive ? '700' : '400'}>
                {s.label}
              </text>
              {/* Dot at destination */}
              <circle cx={x2} cy={y} r="3.5" fill={toColor} opacity={isActive ? 1 : 0.4}/>
            </g>
          );
        })}
        {/* Step counter overlay */}
        {step < 0 && (
          <text x={W / 2} y={H / 2 + 10} textAnchor="middle" fontSize="13" fill="#45475a">Press Play to start</text>
        )}
      </svg>
    </div>
  );
}

function FanOutViz() {
  const WORKER_DEFS = [
    { label: 'Search Worker',   color: '#89b4fa' },
    { label: 'Filter Worker',   color: '#f9e2af' },
    { label: 'Response Worker', color: '#a6e3a1' },
  ];
  const [latencies, setLatencies] = useState([400, 200, 350]);
  const trackW = 240;
  const maxPossible = 800;
  const parallelMs = Math.max(...latencies);
  const seqMs = latencies.reduce((s, v) => s + v, 0);
  const bottleneckIdx = latencies.indexOf(parallelMs);
  const speedup = (seqMs / parallelMs).toFixed(1);

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <style>{`@keyframes bottleneckGlow{0%,100%{filter:drop-shadow(0 0 2px currentColor)}50%{filter:drop-shadow(0 0 6px currentColor)}}`}</style>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'10px'}}>PARALLEL FAN-OUT — DRAG SLIDERS TO SEE BOTTLENECK SHIFT</div>
      {/* Sliders */}
      <div style={{display:'flex',gap:'12px',marginBottom:'12px',flexWrap:'wrap'}}>
        {WORKER_DEFS.map((w, i) => (
          <label key={w.label} style={{display:'flex',flexDirection:'column',gap:'3px',fontSize:'0.76rem',color:w.color,minWidth:'160px'}}>
            {w.label}: <strong>{latencies[i]}ms</strong>{i === bottleneckIdx ? ' ⚠ bottleneck' : ''}
            <input type="range" min="50" max="800" value={latencies[i]}
              onChange={e => setLatencies(prev => prev.map((v, j) => j === i ? Number(e.target.value) : v))}
              style={{accentColor:w.color,width:'150px'}}/>
          </label>
        ))}
      </div>
      {/* Summary lines */}
      <div style={{fontSize:'0.82rem',marginBottom:'6px',display:'flex',gap:'16px',flexWrap:'wrap',alignItems:'center'}}>
        <span style={{color:'#bac2de'}}>Sequential: <strong style={{color:'#cdd6f4'}}>{seqMs}ms</strong></span>
        <span style={{color:'#bac2de'}}>Parallel: <strong style={{color:'#f38ba8'}}>{parallelMs}ms</strong> <span style={{color:'#6c7086'}}>(bottleneck: <strong style={{color:WORKER_DEFS[bottleneckIdx].color}}>{WORKER_DEFS[bottleneckIdx].label}</strong>)</span></span>
        <span style={{color:'#a6e3a1',fontWeight:700}}>Speedup: {speedup}x faster</span>
      </div>
      <svg viewBox="0 0 560 175" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Fan-out parallel execution">
        <defs>
          <marker id="fan-arr-peach" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#fab387"/></marker>
          <marker id="fan-arr-mauve" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#cba6f7"/></marker>
        </defs>

        {/* Entry */}
        <rect x="4" y="80" width="80" height="40" rx="6" fill="#313244" stroke="#fab387" strokeWidth="1.5"/>
        <text x="44" y="97" textAnchor="middle" fontSize="10" fill="#fab387" fontWeight="700">User</text>
        <text x="44" y="111" textAnchor="middle" fontSize="9" fill="#bac2de">request</text>
        <line x1="84" y1="100" x2="112" y2="100" stroke="#fab387" strokeWidth="1.5" markerEnd="url(#fan-arr-peach)"/>
        <line x1="112" y1="40" x2="112" y2="160" stroke="#45475a" strokeWidth="1"/>

        {/* Worker rows */}
        {WORKER_DEFS.map((w, i) => {
          const y = 20 + i * 58;
          const barW = Math.round((latencies[i] / maxPossible) * trackW);
          const isBottleneck = i === bottleneckIdx;
          return (
            <g key={w.label}>
              <line x1="112" y1={y + 20} x2="134" y2={y + 20} stroke="#45475a" strokeWidth="1" markerEnd="url(#fan-arr-peach)"/>
              <rect x="134" y={y + 8} width="94" height="24" rx="6" fill="#313244"
                stroke={isBottleneck ? '#f38ba8' : w.color}
                strokeWidth={isBottleneck ? 2 : 1.5}/>
              <text x="181" y={y + 24} textAnchor="middle" fontSize="10" fill={w.color} fontWeight="700">{w.label}</text>
              <rect x="234" y={y + 10} width={trackW} height="18" rx="3" fill="#1e1e2e"/>
              <rect x="234" y={y + 10} width={barW} height="18" rx="3" fill={w.color} opacity={isBottleneck ? 0.7 : 0.4}
                style={{transition:'width 0.2s ease', color: w.color, animation: isBottleneck ? 'bottleneckGlow 1.4s ease-in-out infinite' : 'none'}}/>
              <text x={234 + Math.min(barW + 4, trackW + 4)} y={y + 23} fontSize="10" fill={isBottleneck ? '#f38ba8' : '#6c7086'} fontWeight={isBottleneck ? '700' : '400'}>{latencies[i]}ms{isBottleneck ? ' ★' : ''}</text>
            </g>
          );
        })}

        {/* Merge */}
        <rect x="520" y="74" width="34" height="52" rx="4" fill="#313244" stroke="#cba6f7" strokeWidth="1.5"/>
        <text x="537" y="94" textAnchor="middle" fontSize="8" fill="#cba6f7" fontWeight="700">AGG</text>
        <text x="537" y="107" textAnchor="middle" fontSize="7" fill="#bac2de">waits all</text>
        <line x1="474" y1="40" x2="520" y2="80" stroke="#45475a" strokeWidth="1"/>
        <line x1="474" y1="98" x2="520" y2="100" stroke="#45475a" strokeWidth="1"/>
        <line x1="474" y1="156" x2="520" y2="120" stroke="#45475a" strokeWidth="1"/>
      </svg>
    </div>
  );
}

const codeFlowText = `User query → Supervisor → Research Agent → Supervisor
                        ↘ Analyst Agent  → Supervisor → Final answer
                        ↘ Writer Agent   → Supervisor`;

const codeSupervisorPy = `from langgraph.graph import StateGraph, START, END
from typing import Literal

class SupervisorState(TypedDict):
    messages: Annotated[list, add_messages]
    next: str

def supervisor_node(state: SupervisorState) -> SupervisorState:
    system = """Route to the best agent:
    - research: needs web search or document retrieval
    - analyst:  needs numerical analysis or data processing
    - writer:   needs to compose a final response
    - FINISH:   work is complete"""
    response = llm_with_structured_output.invoke(
        [SystemMessage(content=system), *state["messages"]]
    )
    return {**state, "next": response.next}

def route(state: SupervisorState) -> Literal["research", "analyst", "writer", "FINISH"]:
    return END if state["next"] == "FINISH" else state["next"]

graph = StateGraph(SupervisorState)
graph.add_node("supervisor", supervisor_node)
for name, fn in [("research", research_agent), ("analyst", analyst_agent), ("writer", writer_agent)]:
    graph.add_node(name, fn)
    graph.add_edge(name, "supervisor")  # always return to supervisor

graph.add_edge(START, "supervisor")
graph.add_conditional_edges("supervisor", route)
app = graph.compile()`;

const codeHierarchyText = `Orchestrator
  ├─ Research Supervisor → [Web Search, Doc Retrieval, Fact Check]
  ├─ Analysis Supervisor → [Financial Analyst, Risk Agent]
  └─ Output Supervisor   → [Writer, Editor]`;

const codeHierarchyPy = `# Compile specialist subgraph
research_subgraph = research_builder.compile()

# Use as a single node in the parent graph
main_graph.add_node("research_team", research_subgraph)
main_graph.add_edge("orchestrator", "research_team")
main_graph.add_edge("research_team", "analysis_team")`;

const codeDebatePy = `class DebateState(TypedDict):
    messages: Annotated[list, add_messages]
    iterations: int

def generator(state: DebateState) -> DebateState:
    proposal = llm.invoke(state["messages"]).content
    return {**state,
            "messages": state["messages"] + [AIMessage(content=proposal)],
            "iterations": state["iterations"] + 1}

def critic(state: DebateState) -> DebateState:
    critique = llm.invoke(
        f"Critique for accuracy and completeness:\\n{state['messages'][-1].content}"
    ).content
    return {**state, "messages": state["messages"] + [HumanMessage(content=critique)]}

def should_continue(state: DebateState) -> str:
    return "end" if state["iterations"] >= 3 else "critic"`;

const codeHandoffPy = `# Message passing — append with agent name tag
def research_agent(state) -> dict:
    result = do_research(state["messages"][-1].content)
    return {"messages": [AIMessage(content=result, name="research_agent")]}

# Structured state — typed fields per stage
class PipelineState(TypedDict):
    query: str
    research_results: list[dict]   # written by research agent
    analysis: str                   # written by analyst agent
    final_answer: str               # written by writer agent`;

const codeParallelPy = `# Parallel execution in LangGraph
graph.add_edge("agent_1", "agent_2")
graph.add_edge("agent_1", "agent_3")  # runs concurrently with agent_2
graph.add_edge("agent_2", "agent_4")
graph.add_edge("agent_3", "agent_4")  # waits for both 2 and 3

# Per-agent tracing
from langsmith import traceable
@traceable(name="research_agent", metadata={"agent_type": "specialist"})
def research_agent(query: str) -> dict: ...`;

const codeBudgetPy = `class SupervisorState(TypedDict):
    messages: Annotated[list, add_messages]
    next: str
    budget_used: float    # running cost in USD
    max_budget: float     # hard cap, default 0.10

def track_cost(state: SupervisorState, tokens_used: int, model: str) -> SupervisorState:
    cost_per_token = {"claude-haiku": 0.0008e-3, "gpt-4o": 0.005e-3}
    new_cost = state["budget_used"] + tokens_used * cost_per_token.get(model, 0.005e-3)
    if new_cost > state["max_budget"]:
        raise BudgetExceededError(f"Budget {state['max_budget']} exceeded at \${new_cost:.4f}")
    return {**state, "budget_used": new_cost}

# Call at the end of every agent node before returning state`;

export function Mod34() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Explain why multi-agent systems outperform single agents for complex tasks</li>
          <li>Implement a supervisor architecture in LangGraph with conditional routing</li>
          <li>Design a hierarchical architecture using LangGraph subgraphs</li>
          <li>Choose between message-passing and structured-state handoff protocols</li>
          <li>Instrument multi-agent pipelines for cost tracking and failure attribution</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~80 minutes</span>
          <span className="obj-diff">Difficulty: ★★★★★</span>
          <span className="obj-diff">Prerequisites: Module 25, 37</span>
        </div>
      </div>

      <div className="callout callout-info">
        <strong>Housing.com Context</strong><br />
        Housing.com is single-agent. Multi-agent becomes relevant when one query needs parallel work: a search agent, a locality researcher, and a finance calculator running simultaneously — coordinated by a supervisor.
      </div>

      <SupervisorArchViz />
      <h2>43.1 Why Multiple Agents</h2>
      <table>
        <tbody>
          <tr><th>Single agent limitation</th><th>Multi-agent solution</th></tr>
          <tr><td>Context limit (128K tokens)</td><td>Each agent handles a scoped context window</td></tr>
          <tr><td>Specialisation tradeoff</td><td>Each agent optimised for one task</td></tr>
          <tr><td>Sequential bottleneck</td><td>Independent agents run in parallel</td></tr>
          <tr><td>Self-critique unreliable</td><td>Separate critic agent catches errors</td></tr>
        </tbody>
      </table>

      <h2>43.2 Supervisor Architecture</h2>
      <SupervisorSequenceViz />
      <p>A supervisor LLM routes work to specialist agents and aggregates results. The supervisor decides <em>who</em> does the work; specialist agents do the actual domain work.</p>
      <pre><code className="language-text">{codeFlowText}</code></pre>
      <pre><code className="language-python">{codeSupervisorPy}</code></pre>
      <div className="callout callout-info">
        <strong>How agents communicate: shared state, not function calls</strong>
        {" "}In LangGraph, agents communicate by reading and writing to a shared Python dict (the State). Each
        agent node receives the full state dict and returns a partial dict of fields it updates —
        LangGraph merges the returned dict back into the state using field reducers.
        <br /><br />
        This is different from function calls: the writer agent doesn't call the analyst agent; it reads
        {" "}<code>state["analysis"]</code> that the analyst already wrote in a previous node execution. The supervisor
        reads <code>state["messages"]</code> to decide who goes next. There is no message queue — just a growing
        shared dict.
        <br /><br />
        <strong>Key invariant:</strong> Every agent node only reads fields it needs and writes fields it owns.
        When two agents write the same field, the reducer handles merging (<code>add_messages</code> for lists,
        last-write-wins for scalars). Violating this causes silent state corruption.
      </div>
      <div className="callout callout-warn">
        <strong>Supervisor termination — the most common multi-agent bug</strong>
        {" "}The supervisor outputs <code>"FINISH"</code> based on <em>its own judgement</em> of the messages it has seen.
        If the writer's output is in <code>state["messages"]</code>, the supervisor should see it and route to
        {" "}<code>FINISH</code>. Two common failure modes:
        <br /><br />
        (1) <strong>Loop without termination:</strong> The writer appends its output but uses a different field;
        the supervisor never sees it in messages → routes to writer again → infinite loop. Fix: always
        use <code>state["messages"]</code> as the canonical output channel.
        <br /><br />
        (2) <strong>Premature FINISH:</strong> The supervisor is called before the writer completes (async race).
        Fix: always <code>add_edge(writer, supervisor)</code> — the edge ensures the supervisor only runs after the
        writer has written. The supervisor logic should check <em>content</em>: "does messages contain a
        final_answer?", not just the existence of a writer message.
      </div>

      <h2>43.3 Hierarchical Architecture</h2>
      <p>Supervisor of supervisors. Each subgraph is a compiled LangGraph graph used as a node in the parent.</p>
      <pre><code className="language-text">{codeHierarchyText}</code></pre>
      <pre><code className="language-python">{codeHierarchyPy}</code></pre>
      <p><strong>When to use:</strong> 10+ agents, clear team boundaries, genuinely independent pipeline stages (research → analysis → output are separate domains of ownership).</p>

      <h2>43.4 Collaborative / Debate Architecture</h2>
      <p>In a supervisor architecture, a manager decides who handles what. In a debate architecture, <strong>two peer agents take turns</strong> — one generates, one critiques — until quality criteria are met or a maximum round count is reached. There is no central decision-maker; quality emerges from the adversarial back-and-forth.</p>
      <p>The FE analogy: this is a <strong>code review loop</strong> — author submits a PR, reviewer comments, author revises, reviewer re-checks. Unlike the critic-revision loop in M42.1 (where one agent does both roles), here the generator and critic are <em>separate</em> LLM calls — you can give each a different system prompt, model, or temperature. The critic prompt says "be adversarial and find flaws"; the generator prompt says "incorporate the critique and improve."</p>
      <p>The <code>DebateState</code> fields: <code>messages</code> accumulates the full dialogue (proposals + critiques interleaved, like a chat thread). <code>iterations</code> is the circuit breaker — without it, the loop could run indefinitely if the critic always finds something to object to.</p>
      <pre><code className="language-python">{codeDebatePy}</code></pre>
      <p><strong>When to use:</strong> High-quality requirements, tasks where a single agent self-critique is unreliable, adversarial review of legal/financial outputs.</p>

      <h2>43.5 Handoff Protocols</h2>
      <table>
        <tbody>
          <tr><th>Pattern</th><th>How</th><th>Best for</th></tr>
          <tr><td>Message passing</td><td>Agents append to shared message list</td><td>Conversational multi-agent flows</td></tr>
          <tr><td>Structured state fields</td><td>Agents read/write typed fields</td><td>Pipeline-style with typed outputs</td></tr>
        </tbody>
      </table>
      <pre><code className="language-python">{codeHandoffPy}</code></pre>

      <FanOutViz />
      <h2>43.6 Production Considerations</h2>
      <table>
        <tbody>
          <tr><th>Concern</th><th>Mitigation</th></tr>
          <tr><td>Cost explosion (N agents × M calls)</td><td>Per-run cost tracking; budget caps in supervisor</td></tr>
          <tr><td>Latency chains (sequential compounding)</td><td>Parallelise independent agents via LangGraph branches</td></tr>
          <tr><td>Failure attribution</td><td>@traceable per agent + structured logging</td></tr>
          <tr><td>Circular dependencies</td><td>max_iterations + explicit done flag</td></tr>
          <tr><td>Context bloat</td><td>Summarise intermediate results; don't pass full history</td></tr>
        </tbody>
      </table>
      <pre><code className="language-python">{codeParallelPy}</code></pre>
      <div className="callout callout-info">
        <strong>Per-run budget tracking</strong>
        <pre><code className="language-python">{codeBudgetPy}</code></pre>
        LangSmith traces compiled subgraphs as expandable nested traces — you see "research_team" in the
        outer trace, click to expand and see each specialist agent's individual spans with their own
        token counts. Use <code>{"metadata={\"agent_name\": \"research_agent\"}"}</code> in each <code>@traceable</code> call to
        make per-agent cost attribution work correctly in LangSmith dashboards.
      </div>

      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection</strong>
        {" "}"Design a multi-agent system for automated code review." → Supervisor routes to: (1) Lint agent (deterministic tools), (2) Security agent (SAST + LLM), (3) Logic review agent (LLM reads diff), (4) Test coverage agent — all four run in parallel. (5) Critic agent aggregates and deduplicates. Budget cap: $0.10/PR. HITL: any security finding severity ≥ 3 triggers human review before merge.
      </div>

      <QuizSection moduleId={42} title="Module 42: Multi-Agent Systems" contentHint="Supervisor architecture routing conditional edges return to supervisor, hierarchical subgraph compile as node parent graph, debate generator critic iterations bounded, message passing vs structured state fields handoff, parallel LangGraph branches independent agents, cost explosion N agents M calls per-run tracking, failure attribution traceable per agent, circular dependency max_iterations done flag, context bloat intermediate summarisation" />
    </>
  );
}
