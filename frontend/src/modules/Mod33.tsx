import { useState, useRef, useEffect } from 'react';
import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from '../components/CodeBlock';

function ReactLoopViz() {
  const steps = [
    { label: 'THOUGHT', text: 'Thought: "I need to find 2BHK listings in Bandra"', active: 'thought' },
    { label: 'ACTION', text: 'Action: search_properties(locality="Bandra", bhk=2)', active: 'action' },
    { label: 'OBSERVATION', text: 'Observation: "Found 47 listings. Top result: 2BHK Sea Link View, ₹1.85Cr"', active: 'observation' },
    { label: 'THOUGHT', text: 'Thought: "Found results. Sufficient to answer."', active: 'thought2' },
    { label: 'FINAL ANSWER', text: 'Final Answer: "I found 47 2BHK apartments in Bandra. The top listing is Sea Link View at ₹1.85Cr."', active: 'final' },
  ];
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<0.5 | 1>(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function runExample() {
    if (running) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(true);
    setStep(0);
    let i = 0;
    const interval = Math.round(1400 / speed);
    intervalRef.current = setInterval(() => {
      i++;
      if (i >= steps.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setRunning(false);
        return;
      }
      setStep(i);
    }, interval);
  }

  function stepForward() {
    // Pause auto-play when stepping manually
    if (running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setRunning(false);
    }
    setStep(prev => {
      const next = prev + 1;
      return next < steps.length ? next : prev;
    });
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setStep(-1);
    setRunning(false);
  }

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const active = step >= 0 ? steps[step].active : '';

  const nodeStyle = (id: string, base: string) => ({
    stroke: active === id ? '#f9e2af' : base,
    strokeWidth: active === id ? 2.5 : 1.5,
    filter: active === id ? 'drop-shadow(0 0 6px #f9e2af88)' : 'none',
    transition: 'stroke 0.3s, filter 0.3s',
  });

  const atLastStep = step >= steps.length - 1;

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <style>{`@keyframes dashFlow{to{stroke-dashoffset:-14}}`}</style>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>REACT AGENT LOOP — THOUGHT → ACTION → OBSERVATION → REPEAT</div>
      <svg viewBox="0 0 480 300" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="ReAct loop diagram showing Thought, Action, Observation cycle">
        <defs>
          <marker id="react-arr-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#89b4fa"/></marker>
          <marker id="react-arr-teal" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#94e2d5"/></marker>
          <marker id="react-arr-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#a6e3a1"/></marker>
          <marker id="react-arr-mauve" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#cba6f7"/></marker>
        </defs>

        {/* THOUGHT box — top center */}
        <rect x="165" y="20" width="150" height="48" rx="6" fill="#313244" {...nodeStyle('thought', '#89b4fa')} />
        <text x="240" y="41" textAnchor="middle" fontSize="12" fill="#89b4fa" fontWeight="700">THOUGHT</text>
        <text x="240" y="57" textAnchor="middle" fontSize="10" fill="#bac2de">Reason about next step</text>

        {/* ACTION box — right */}
        <rect x="340" y="120" width="130" height="48" rx="6" fill="#313244" {...nodeStyle('action', '#94e2d5')} />
        <text x="405" y="141" textAnchor="middle" fontSize="12" fill="#94e2d5" fontWeight="700">ACTION</text>
        <text x="405" y="157" textAnchor="middle" fontSize="10" fill="#bac2de">Call a tool</text>

        {/* OBSERVATION box — bottom center */}
        <rect x="165" y="220" width="150" height="48" rx="6" fill="#313244" {...nodeStyle('observation', '#a6e3a1')} />
        <text x="240" y="241" textAnchor="middle" fontSize="12" fill="#a6e3a1" fontWeight="700">OBSERVATION</text>
        <text x="240" y="257" textAnchor="middle" fontSize="10" fill="#bac2de">Read tool result</text>

        {/* FINAL ANSWER box — far right exit */}
        <rect x="340" y="220" width="130" height="48" rx="6" fill="#313244" {...nodeStyle('final', '#cba6f7')} />
        <text x="405" y="241" textAnchor="middle" fontSize="12" fill="#cba6f7" fontWeight="700">FINAL</text>
        <text x="405" y="257" textAnchor="middle" fontSize="10" fill="#cba6f7">ANSWER</text>

        {/* Thought → Action */}
        <path d="M315,44 Q380,44 380,120" fill="none" stroke="#89b4fa" strokeWidth="1.5" strokeDasharray="4 3" style={{animation:'dashFlow 1s linear infinite'}} markerEnd="url(#react-arr-blue)"/>
        <text x="368" y="82" fontSize="10" fill="#6c7086">act</text>

        {/* Action → Observation */}
        <path d="M405,168 Q405,220 315,244" fill="none" stroke="#94e2d5" strokeWidth="1.5" strokeDasharray="4 3" style={{animation:'dashFlow 1s linear infinite'}} markerEnd="url(#react-arr-teal)"/>
        <text x="378" y="208" fontSize="10" fill="#6c7086">observe</text>

        {/* Observation → Thought (back loop) */}
        <path d="M165,244 Q80,244 80,44 Q80,44 165,44" fill="none" stroke="#a6e3a1" strokeWidth="1.5" strokeDasharray="4 3" style={{animation:'dashFlow 1s linear infinite'}} markerEnd="url(#react-arr-green)"/>
        <text x="56" y="150" fontSize="10" fill="#6c7086" transform="rotate(-90,56,150)">loop</text>

        {/* Observation → Final Answer (exit) */}
        <line x1="315" y1="244" x2="340" y2="244" stroke="#cba6f7" strokeWidth="1.5" markerEnd="url(#react-arr-mauve)"/>
        <text x="327" y="238" fontSize="9" fill="#cba6f7">done?</text>

        {/* Second thought node indicator */}
        <rect x="165" y="20" width="150" height="48" rx="6" fill="none" stroke={active === 'thought2' ? '#f9e2af' : 'none'} strokeWidth="2.5" style={{filter: active === 'thought2' ? 'drop-shadow(0 0 6px #f9e2af88)' : 'none', transition:'stroke 0.3s'}}/>
      </svg>

      <div style={{marginTop:'10px',minHeight:'42px',padding:'8px 12px',background:'#313244',borderRadius:'6px',fontFamily:'monospace',fontSize:'0.82rem',color:'#cdd6f4',borderLeft:`3px solid ${step === 4 ? '#cba6f7' : step === 1 ? '#94e2d5' : step === 2 ? '#a6e3a1' : '#89b4fa'}`}}>
        {step < 0 ? <span style={{color:'#6c7086'}}>Press "Run example" to animate the ReAct loop...</span> : steps[step].text}
      </div>

      <div style={{marginTop:'12px',display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
        <button onClick={runExample} disabled={running} style={{background: running ? '#45475a' : '#313244',color:'#cdd6f4',border:'1px solid #45475a',borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor: running ? 'default' : 'pointer'}}>
          {running ? 'Running...' : '▶ Run'}
        </button>
        <button
          onClick={stepForward}
          disabled={atLastStep}
          style={{
            background:'#313244',
            color: atLastStep ? '#45475a' : '#f9e2af',
            border:`1px solid ${atLastStep ? '#45475a' : '#f9e2af44'}`,
            borderRadius:'6px',
            padding:'5px 12px',
            fontSize:'0.78rem',
            cursor: atLastStep ? 'default' : 'pointer'
          }}
        >
          Step →
        </button>
        <button onClick={reset} style={{background:'#313244',color:'#cdd6f4',border:'1px solid #45475a',borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor:'pointer'}}>
          Reset
        </button>
        <div style={{display:'flex',alignItems:'center',gap:'4px',marginLeft:'8px'}}>
          <span style={{fontSize:'0.72rem',color:'#6c7086',marginRight:'2px'}}>Speed:</span>
          {([0.5, 1] as const).map(s => (
            <button key={s} onClick={() => setSpeed(s)}
              style={{background:speed===s?'#89b4fa22':'#313244',color:speed===s?'#89b4fa':'#6c7086',border:`1px solid ${speed===s?'#89b4fa':'#45475a'}`,borderRadius:'4px',padding:'3px 8px',fontSize:'0.72rem',cursor:'pointer'}}>
              {s}×
            </button>
          ))}
        </div>
        {step >= 0 && <span style={{marginLeft:'4px',fontSize:'0.78rem',color:'#6c7086'}}>Step {step + 1}/{steps.length}</span>}
      </div>
    </div>
  );
}

function InContextDetail() {
  const MAX_TOKENS = 8192;
  const [tokens, setTokens] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setTokens(0);
    const increment = 64;
    intervalRef.current = setInterval(() => {
      setTokens(prev => {
        const next = prev + increment;
        if (next >= MAX_TOKENS) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return MAX_TOKENS;
        }
        return next;
      });
    }, 30);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const pct = Math.min((tokens / MAX_TOKENS) * 100, 100);

  return (
    <div style={{padding:'14px',background:'#1e1e2e',borderRadius:'6px',marginTop:'10px'}}>
      <div style={{fontSize:'0.78rem',fontWeight:700,color:'#89b4fa',marginBottom:'10px'}}>Context Window — Live Fill</div>
      <div style={{background:'#313244',borderRadius:'4px',height:'18px',overflow:'hidden',marginBottom:'8px'}}>
        <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#89b4fa,#cba6f7)',transition:'width 0.05s linear',borderRadius:'4px'}}/>
      </div>
      <div style={{fontFamily:'monospace',fontSize:'0.82rem',color:'#cdd6f4'}}>
        {tokens.toLocaleString()} / {MAX_TOKENS.toLocaleString()} tokens
      </div>
      <div style={{marginTop:'8px',fontSize:'0.76rem',color:'#6c7086'}}>
        Context window holds the active conversation. When full, oldest turns are dropped or the request fails.
      </div>
    </div>
  );
}

function EpisodicDetail() {
  const rows = [
    { key: 'session:abc123:summary', value: 'User searched for 2BHK in Bandra, budget 1.5Cr...' },
    { key: 'session:abc123:last_tool', value: 'search_listings({locality:"Bandra",bhk:2})' },
    { key: 'session:def456:summary', value: 'User asked about home loan eligibility for 80L...' },
  ];
  return (
    <div style={{padding:'14px',background:'#1e1e2e',borderRadius:'6px',marginTop:'10px'}}>
      <div style={{fontSize:'0.78rem',fontWeight:700,color:'#94e2d5',marginBottom:'10px'}}>Redis Key-Value Store — Episodic Memory</div>
      <table style={{width:'100%',borderCollapse:'collapse',fontFamily:'monospace',fontSize:'0.76rem'}}>
        <thead>
          <tr>
            <th style={{textAlign:'left',color:'#6c7086',padding:'4px 8px',borderBottom:'1px solid #313244'}}>KEY</th>
            <th style={{textAlign:'left',color:'#6c7086',padding:'4px 8px',borderBottom:'1px solid #313244'}}>VALUE</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{borderBottom:'1px solid #313244'}}>
              <td style={{padding:'6px 8px',color:'#94e2d5',whiteSpace:'nowrap'}}>{r.key}</td>
              <td style={{padding:'6px 8px',color:'#bac2de'}}>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{marginTop:'8px',fontSize:'0.76rem',color:'#6c7086'}}>
        Session summaries stored in Redis with TTL. Retrieved at conversation start to restore context.
      </div>
    </div>
  );
}

function SemanticDetail() {
  const docs = [
    { id: 'A', x: 80, y: 60, sim: 0.92, color: '#a6e3a1', label: 'Bandra listings' },
    { id: 'B', x: 200, y: 110, sim: 0.71, color: '#f9e2af', label: 'Mumbai overview' },
    { id: 'C', x: 100, y: 160, sim: 0.34, color: '#f38ba8', label: 'Loan calculator' },
  ];
  const queryX = 310, queryY = 110;

  return (
    <div style={{padding:'14px',background:'#1e1e2e',borderRadius:'6px',marginTop:'10px'}}>
      <div style={{fontSize:'0.78rem',fontWeight:700,color:'#a6e3a1',marginBottom:'10px'}}>Vector Similarity Search — Semantic Memory</div>
      <svg viewBox="0 0 420 230" width="100%" style={{display:'block'}}>
        <defs>
          <marker id="sim-arr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 Z" fill="#585b70"/>
          </marker>
        </defs>
        {/* Lines from query to each doc */}
        {docs.map(d => (
          <line
            key={d.id}
            x1={queryX} y1={queryY}
            x2={d.x} y2={d.y}
            stroke={d.color}
            strokeWidth={d.sim > 0.8 ? 2 : 1}
            strokeDasharray={d.sim > 0.8 ? 'none' : '4 3'}
            opacity={0.7}
            markerEnd="url(#sim-arr)"
          />
        ))}
        {/* Doc nodes */}
        {docs.map(d => (
          <g key={d.id}>
            <circle
              cx={d.x} cy={d.y} r={d.sim > 0.8 ? 28 : 22}
              fill={d.sim > 0.8 ? `${d.color}33` : '#313244'}
              stroke={d.color}
              strokeWidth={d.sim > 0.8 ? 2.5 : 1.5}
            />
            <text x={d.x} y={d.y - 4} textAnchor="middle" fontSize="10" fill={d.color} fontWeight="700">{d.label}</text>
            <text x={d.x} y={d.y + 11} textAnchor="middle" fontSize="10" fill="#cdd6f4" fontFamily="monospace">{d.sim.toFixed(2)}</text>
          </g>
        ))}
        {/* Query node */}
        <circle cx={queryX} cy={queryY} r={26} fill="#89b4fa22" stroke="#89b4fa" strokeWidth="2.5"/>
        <text x={queryX} y={queryY - 4} textAnchor="middle" fontSize="10" fill="#89b4fa" fontWeight="700">QUERY</text>
        <text x={queryX} y={queryY + 10} textAnchor="middle" fontSize="9" fill="#bac2de">"2BHK Bandra"</text>
        {/* Similarity legend */}
        <text x="10" y="215" fontSize="9" fill="#6c7086">Cosine similarity scores — higher = more relevant</text>
      </svg>
      <div style={{marginTop:'4px',fontSize:'0.76rem',color:'#6c7086'}}>
        Vector embeddings stored in Pinecone/Chroma. Retrieved with top-k similarity search at query time.
      </div>
    </div>
  );
}

function ProceduralDetail() {
  return (
    <div style={{padding:'14px',background:'#1e1e2e',borderRadius:'6px',marginTop:'10px'}}>
      <div style={{fontSize:'0.78rem',fontWeight:700,color:'#cba6f7',marginBottom:'8px'}}>Procedural Memory — Baked into Agent Config</div>
      <div style={{fontSize:'0.82rem',color:'#bac2de',lineHeight:'1.6'}}>
        Procedural memory encodes <strong style={{color:'#cba6f7'}}>how</strong> the agent operates — tool definitions, system prompts, output format rules, and guardrails. It is set at deploy time and does not change during a session.
      </div>
      <div style={{marginTop:'10px',fontFamily:'monospace',fontSize:'0.76rem',background:'#313244',borderRadius:'4px',padding:'10px',color:'#cdd6f4'}}>
        <div style={{color:'#6c7086',marginBottom:'4px'}}>// system_prompt.txt</div>
        <div>You are a Housing.com assistant.</div>
        <div>Always respond in JSON format.</div>
        <div>Available tools: search_listings, get_emi, ...</div>
        <div>Never reveal internal tool names to users.</div>
      </div>
      <div style={{marginTop:'8px',fontSize:'0.76rem',color:'#6c7086'}}>
        Latency: 0ms — already in context at agent startup. Changes require redeployment.
      </div>
    </div>
  );
}

function AgentMemoryViz() {
  const types = [
    { label: 'In-context', color: '#89b4fa', desc: 'Current conversation turns — in the active LLM context window', latency: '<1ms', icon: '◈' },
    { label: 'Episodic', color: '#94e2d5', desc: 'Past session summaries — stored in Redis/Postgres, retrieved per session', latency: '~5ms', icon: '◉' },
    { label: 'Semantic', color: '#a6e3a1', desc: 'Long-term knowledge — RAG vector store, persists across all users', latency: '~50ms', icon: '◎' },
    { label: 'Procedural', color: '#cba6f7', desc: 'Tool definitions, system prompts — baked into the agent config', latency: '0ms', icon: '◆' },
  ];

  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);

  function handleRowClick(label: string) {
    setSelectedMemory(prev => prev === label ? null : label);
  }

  function renderDetail() {
    if (!selectedMemory) return null;
    switch (selectedMemory) {
      case 'In-context': return <InContextDetail />;
      case 'Episodic': return <EpisodicDetail />;
      case 'Semantic': return <SemanticDetail />;
      case 'Procedural': return <ProceduralDetail />;
      default: return null;
    }
  }

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>AGENT MEMORY TAXONOMY — 4 TYPES, 4 LATENCY PROFILES</div>
      <div style={{fontSize:'0.72rem',color:'#45475a',marginBottom:'10px'}}>Click a row to explore each memory type</div>
      <svg viewBox="0 0 560 200" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Agent memory taxonomy showing four memory types with latency">
        {types.map((t, i) => {
          const y = 10 + i * 46;
          const isSelected = selectedMemory === t.label;
          return (
            <g
              key={t.label}
              onClick={() => handleRowClick(t.label)}
              style={{cursor:'pointer'}}
              role="button"
              aria-label={`${t.label} memory type`}
            >
              <rect
                x="2" y={y} width="556" height="40" rx="6"
                fill={isSelected ? `${t.color}18` : '#313244'}
                stroke={t.color}
                strokeWidth={isSelected ? 2 : 1}
                style={{transition:'fill 0.2s, stroke-width 0.2s'}}
              />
              {/* Hover highlight overlay */}
              <rect x="2" y={y} width="556" height="40" rx="6" fill="transparent" stroke="none"/>
              {/* Icon */}
              <text x="22" y={y + 24} textAnchor="middle" fontSize="18" fill={t.color}>{t.icon}</text>
              {/* Label */}
              <text x="46" y={y + 16} fontSize="12" fill={t.color} fontWeight="700">{t.label}</text>
              {/* Description */}
              <text x="46" y={y + 31} fontSize="10" fill="#bac2de">{t.desc}</text>
              {/* Latency */}
              <rect x="476" y={y + 8} width="72" height="24" rx="4" fill="#1e1e2e" stroke={t.color} strokeWidth="1"/>
              <text x="512" y={y + 24} textAnchor="middle" fontSize="11" fill={t.color} fontWeight="700" fontFamily="monospace">{t.latency}</text>
              {/* Selected indicator */}
              {isSelected && <text x="458" y={y + 26} textAnchor="middle" fontSize="14" fill={t.color}>▼</text>}
            </g>
          );
        })}
        {/* Column header */}
        <text x="512" y="5" textAnchor="middle" fontSize="9" fill="#6c7086" fontWeight="700">LATENCY</text>
      </svg>
      {selectedMemory && (
        <div style={{marginTop:'4px'}}>
          {renderDetail()}
        </div>
      )}
    </div>
  );
}

const CODE_CHAIN_VS_AGENT = `Chain:  Input → Step 1 → Step 2 → Output   (no loops, deterministic)
Agent:  Input → Think → Act → Observe → Think → Act → ... → Output`;

const CODE_REACT_TRACE = `Thought: I need to find current property prices in Bandra before I can answer.
Action: search_listings(location="Bandra", bedroom=2)
Observation: [{"price": 15000000, ...}, ...]
Thought: Average price ~1.5Cr. Now I can calculate affordability.
Action: calculate_emi(principal=15000000, rate=8.5, years=20)
Observation: {"emi": 130000}
Answer: A 2BHK in Bandra costs ~1.5Cr. EMI = ₹1.3L/month at 8.5% over 20 years.`;

const CODE_REACT_PYTHON = `from langchain.agents import create_react_agent, AgentExecutor
from langchain import hub

prompt = hub.pull("hwchase17/react")
tools = [search_listings_tool, calculate_emi_tool, get_property_details_tool]
agent = create_react_agent(llm, tools, prompt)
executor = AgentExecutor(
    agent=agent, tools=tools, verbose=True,
    max_iterations=10,       # hard cap — prevents infinite loops
    handle_parsing_errors=True,
)`;

const CODE_PARSING_ERROR = `Thought: I need to search for properties.
Action: Search listings in Bandra          ← wrong: not a valid tool name
Action Input: ...
PARSING ERROR: No tool found named 'Search listings in Bandra'`;

const CODE_PLAN_TRACE = `Planner (GPT-4o): "To find the best 2BHK in Bandra under 2Cr:
  1. Search listings (Bandra, 2BHK, budget ≤ 2Cr)
  2. For top 3 results: fetch full property details
  3. Rank by price/sqft ratio
  4. Format recommendation"

Executor: Runs each step with appropriate tools
Replanner: If step fails → revise remaining plan`;

const CODE_PLAN_PYTHON = `from langchain_experimental.plan_and_execute import PlanAndExecute, load_agent_executor, load_chat_planner

planner  = load_chat_planner(llm)
executor = load_agent_executor(llm, tools, verbose=True)
agent    = PlanAndExecute(planner=planner, executor=executor, verbose=True)`;

const CODE_REPLAN_PYTHON = `def execute_with_replan(state: PlanState) -> PlanState:
    for i, step in enumerate(state["plan"]):
        try:
            result = executor.invoke({"input": step})
            state["results"].append(result["output"])
        except Exception as e:
            # Step failed — call replanner with context of what succeeded
            new_plan = replanner_llm.invoke(
                f"Original plan: {state['plan']}\\n"
                f"Completed steps: {state['plan'][:i]}\\n"
                f"Failed at step {i}: {step}\\n"
                f"Error: {e}\\n"
                "Revise the remaining plan to still achieve the original goal."
            )
            state["plan"] = state["plan"][:i] + parse_plan(new_plan.content)
    return state`;

const CODE_REFLEXION_PYTHON = `class ReflexionState(TypedDict):
    input: str
    attempts: list[str]
    reflections: list[str]
    final_answer: str | None

def reflect_node(state: ReflexionState) -> ReflexionState:
    last = state["attempts"][-1]
    critique = llm.invoke(
        f"Critique this answer for accuracy: {last}\\nWhat should you do differently?"
    ).content
    return {**state, "reflections": state["reflections"] + [critique]}

def should_continue(state: ReflexionState) -> str:
    return "end" if len(state["attempts"]) >= 3 else "reflect"`;

const CODE_TOOL_SELECTION = `# With 50+ tools: retrieve the relevant subset dynamically
tool_docs = [Document(page_content=t.description, metadata={"name": t.name}) for t in all_tools]
tool_store = Chroma.from_documents(tool_docs, OpenAIEmbeddings())

def get_relevant_tools(query: str, k: int = 5) -> list[Tool]:
    relevant = tool_store.similarity_search(query, k=k)
    names = {doc.metadata["name"] for doc in relevant}
    return [t for t in all_tools if t.name in names]`;

export function Mod33() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Explain what distinguishes an agent from a chain (cycles vs linear execution)</li>
          <li>Implement a ReAct agent with LangChain and bound it with max_iterations</li>
          <li>Choose Plan-and-Execute over ReAct for long structured tasks</li>
          <li>Apply Reflexion to tasks with verifiable correctness criteria</li>
          <li>Identify when NOT to use agents and quantify the cost of unnecessary complexity</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~75 minutes</span>
          <span className="obj-diff">Difficulty: ★★★★☆</span>
          <span className="obj-diff">Prerequisites: Module 25 (LangGraph)</span>
        </div>
      </div>
      <div className="callout callout-info">
        <strong>Housing.com Context</strong><br />
        Housing.com uses implicit ReAct: the LLM decides which tool to call, observes the result, and either calls another or responds. This module makes that pattern explicit and introduces alternatives (Plan-and-Execute for multi-step property research, Reflexion for self-improving classification).
      </div>

      <ReactLoopViz />
      <h2>42.1 What Makes Something an "Agent"</h2>
      <p>An agent is a system that <strong>perceives</strong> its environment, <strong>reasons</strong> about what action to take, <strong>acts</strong> by calling a tool or routing, and <strong>observes</strong> the result — then loops. The key property distinguishing agents from chains: <strong>cycles</strong>.</p>
      <CodeBlock title="Chain vs Agent Execution Model" language="text" keyLine={2} keyNote="Agent has loops; chain is always linear and deterministic">{CODE_CHAIN_VS_AGENT}</CodeBlock>
      <div className="callout callout-tip">
        <strong>The agent cost equation:</strong> Every loop adds +1 LLM call (~200ms, ~$0.001), +1 parsing step, +1 failure mode. A 5-step agent = 5× cost and 5× failure surface vs a direct call. Always ask: does this problem need a loop?
      </div>

      <h2>42.2 ReAct — Reason + Act</h2>
      <p>ReAct interleaves reasoning (Thought) and action (Action/Observation) in the LLM context. The model narrates its reasoning before calling tools.</p>
      <CodeBlock title="ReAct Trace — Property Search Example" language="text" keyLine={4} keyNote="Second Thought reuses observation to decide next action">{CODE_REACT_TRACE}</CodeBlock>
      <CodeBlock title="ReAct Agent with LangChain" language="python" keyLine={9} keyNote="max_iterations is mandatory — prevents infinite tool-call loops">{CODE_REACT_PYTHON}</CodeBlock>
      <div className="callout callout-info">
        <strong>How ReAct works mechanically</strong>
        {" "}The <code>hub.pull("hwchase17/react")</code> prompt template includes three parts: (1) the tools list with
        descriptions, (2) format instructions telling the model to output <em>exactly</em>
        {' "Thought: ... \nAction: tool_name\nAction Input: {"{json}"}"'} — the agent parser splits on these
        markers; (3) an <code>{"{agent_scratchpad}"}</code> variable that grows with each Thought/Action/Observation
        cycle.
        <br /><br />
        <strong>Common failure trace</strong> (tool parsing error):
        <pre>{CODE_PARSING_ERROR}</pre>
        <strong>Root cause:</strong> Tool description said "search listings" but tool name is <code>search_listings</code>.
        The LLM copied natural language instead of the programmatic name. Fix: make tool names
        unambiguous and distinct; add <code>name</code> explicitly: <code>{'Tool(name="search_listings", ...)'}</code>.
      </div>
      <table>
        <tbody>
          <tr><th>Failure mode</th><th>What happens</th><th>Mitigation</th></tr>
          <tr><td>Reasoning drift</td><td>Model hallucinates tool result instead of calling tool</td><td>Structured output for tool calls</td></tr>
          <tr><td>Tool selection error</td><td>Wrong tool → irrelevant result → spiral</td><td>Clear, distinct tool descriptions</td></tr>
          <tr><td>Infinite loop</td><td>Same tool, same args, forever</td><td><code>max_iterations</code> — always set this</td></tr>
          <tr><td>Verbose overhead</td><td>Every intermediate step in context → expensive</td><td>Trim intermediate observations</td></tr>
        </tbody>
      </table>
      <p><strong>When ReAct works well:</strong> 2–5 tool calls with branching, tasks where explaining reasoning is valuable, well-documented distinct tools.</p>

      <h2>42.3 Plan-and-Execute</h2>
      <p>A planner LLM creates an upfront ordered task list; executor agents run each step. Separating planning from execution reduces hallucination — the model commits to a correct plan before acting.</p>
      <CodeBlock title="Plan-and-Execute Trace — Property Research" language="text" keyLine={7} keyNote="Replanner triggers only on failure — keeps completed steps">{CODE_PLAN_TRACE}</CodeBlock>
      <CodeBlock title="Plan-and-Execute Agent Setup" language="python" keyLine={4} keyNote="Planner and executor use separate LLM calls — plan before acting">{CODE_PLAN_PYTHON}</CodeBlock>
      <p><strong>vs ReAct:</strong> Better for 5–15 sequential steps, tasks needing an audit trail, tasks where plan transparency matters to users. Weaker when the plan must adapt mid-execution — add a replanning step for that.</p>
      <div className="callout callout-info">
        <strong>Adding a replanner to handle mid-execution failures</strong>
        <CodeBlock title="Replanner — Mid-Execution Recovery" language="python" keyLine={13} keyNote="Replanner receives completed steps to avoid re-doing work">{CODE_REPLAN_PYTHON}</CodeBlock>
        The replanner LLM call adds latency but prevents silent partial completions. For interview
        answers: mention that the replanner sees completed steps to avoid re-doing work.
      </div>

      <h2>42.4 Reflexion</h2>
      <p>Reflexion adds self-critique and episodic memory of past failures. After each attempt, the agent critiques its own output and generates a verbal reflection stored in memory. Subsequent attempts use that reflection.</p>
      <p><strong>The key mechanic — how the loop actually works:</strong></p>
      <ol>
        <li>Agent makes an attempt and writes it to <code>attempts</code>.</li>
        <li><code>reflect_node</code> reads the last attempt and asks the LLM to critique it: "what went wrong? what should you try instead?" The critique is stored in <code>reflections</code>.</li>
        <li>On the next attempt, the agent prompt is built from <em>all</em> prior reflections: "Previous attempt 1 failed because X. Attempt 2 failed because Y. Now try again with these lessons." The agent gets a richer prompt each round.</li>
        <li><code>should_continue</code> is the circuit breaker — it checks attempt count and routes to either "reflect" (another loop) or "end" (take best answer so far).</li>
      </ol>
      <p>The <code>attempts</code> list stores the outputs; the <code>reflections</code> list stores the critiques — they're kept separate so the next attempt prompt can interleave them clearly: "Attempt 1: [output]. Critique: [what was wrong]. Attempt 2: [output]. Critique: [what was wrong]. Now: [new attempt]."</p>
      <div className="callout callout-warn">
        <strong>When Reflexion fails:</strong> If the task has no verifiable ground truth (no test that passes/fails, no external scorer), the self-critique is subjective — the model may criticise things that are actually fine, or fail to critique real errors. Reflexion works best when correctness is checkable: code that runs tests, SQL that executes, math with a verifiable answer. For open-ended writing tasks, the "spiral" failure mode is common: the agent second-guesses itself across 3 attempts and ends up with a worse result than attempt 1.
      </div>
      <CodeBlock title="Reflexion State and Reflect Node" language="python" keyLine={13} keyNote="should_continue is the circuit breaker — always cap max attempts">{CODE_REFLEXION_PYTHON}</CodeBlock>
      <p><strong>When Reflexion works:</strong> Tasks with verifiable correctness (code passing tests, math problems), clear quality criteria, reliable external scorer. <strong>When it fails:</strong> Vague tasks where self-critique has no ground truth — agent spirals. Always bound max attempts.</p>

      <h2>42.5 Tool Selection at Scale &amp; Memory Taxonomy</h2>
      <AgentMemoryViz />
      <CodeBlock title="Dynamic Tool Selection via Similarity Search" language="python" keyLine={4} keyNote="k=5 retrieves only relevant tools — reduces prompt size 10x">{CODE_TOOL_SELECTION}</CodeBlock>
      <table>
        <tbody>
          <tr><th>Memory type</th><th>Storage</th><th>Example</th><th>Lifespan</th></tr>
          <tr><td>In-context (short-term)</td><td>LLM context window</td><td>Current conversation turns</td><td>Request</td></tr>
          <tr><td>External semantic</td><td>Vector DB</td><td>Retrieved docs, past conversations</td><td>Persistent</td></tr>
          <tr><td>Episodic</td><td>Vector DB / KV</td><td>Past task outcomes, Reflexion notes</td><td>Persistent</td></tr>
          <tr><td>Procedural</td><td>Fine-tuned weights</td><td>Domain rules, output format</td><td>Indefinite</td></tr>
        </tbody>
      </table>

      <h2>42.6 When NOT to Use Agents</h2>
      <table>
        <tbody>
          <tr><th>Use agents when</th><th>Don't use agents when</th></tr>
          <tr><td>Task structure is unknown at call time</td><td>Task structure is fixed and known</td></tr>
          <tr><td>Requires 3–10 tool calls with branching</td><td>Requires ≤2 tool calls in sequence</td></tr>
          <tr><td>Adaptation based on tool outputs needed</td><td>Same logic runs every time</td></tr>
          <tr><td>Complex multi-hop reasoning required</td><td>Simple retrieval + format suffices</td></tr>
          <tr><td>SLA allows 2–10 seconds</td><td>SLA is &lt;1 second (latency stack kills you)</td></tr>
          <tr><td>Partial answers are acceptable</td><td>Determinism is required — can you write a function that returns True/False for a correct answer? If yes, a pipeline or single LLM call with validation is safer.</td></tr>
        </tbody>
      </table>

      <svg width="540" height="320" viewBox="0 0 540 320" style={{ display: "block", margin: "12px auto", fontFamily: "'Courier New',monospace" }}>
        <defs>
          <marker id="arr" markerWidth="8" markerHeight="8" refX="4" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 Z" fill="#585b70" />
          </marker>
        </defs>
        <rect width="540" height="320" rx="6" fill="#1e1e2e" />
        <text x="270" y="20" textAnchor="middle" fill="#cdd6f4" fontSize="11" fontWeight="bold">Agent Architecture Selection Flowchart</text>
        {/* Start node */}
        <rect x="195" y="32" width="150" height="28" rx="14" fill="#45475a" stroke="#585b70" strokeWidth="1.5" />
        <text x="270" y="51" textAnchor="middle" fill="#cdd6f4" fontSize="10">New AI Task</text>
        {/* Arrow down */}
        <line x1="270" y1="60" x2="270" y2="78" stroke="#585b70" strokeWidth="1.5" markerEnd="url(#arr)" />
        {/* Diamond 1: Need cycles? */}
        <polygon points="270,78 340,102 270,126 200,102" fill="#313244" stroke="#89b4fa" strokeWidth="1.5" />
        <text x="270" y="98" textAnchor="middle" fill="#89b4fa" fontSize="9">Needs loops /</text>
        <text x="270" y="110" textAnchor="middle" fill="#89b4fa" fontSize="9">branching on output?</text>
        {/* No right to Pipeline */}
        <line x1="340" y1="102" x2="440" y2="102" stroke="#585b70" strokeWidth="1.5" />
        <text x="388" y="97" textAnchor="middle" fill="#a6adc8" fontSize="8">No</text>
        <rect x="440" y="88" width="90" height="28" rx="4" fill="#313244" stroke="#a6e3a1" strokeWidth="1.5" />
        <text x="485" y="101" textAnchor="middle" fill="#a6e3a1" fontSize="9" fontWeight="bold">Pipeline / Chain</text>
        <text x="485" y="112" textAnchor="middle" fill="#a6adc8" fontSize="7">LangGraph DAG</text>
        {/* Yes down */}
        <line x1="270" y1="126" x2="270" y2="148" stroke="#585b70" strokeWidth="1.5" />
        <text x="258" y="142" fill="#a6adc8" fontSize="8">Yes</text>
        {/* Diamond 2: Plan upfront? */}
        <polygon points="270,148 350,172 270,196 190,172" fill="#313244" stroke="#f9e2af" strokeWidth="1.5" />
        <text x="270" y="168" textAnchor="middle" fill="#f9e2af" fontSize="9">Can plan all steps</text>
        <text x="270" y="180" textAnchor="middle" fill="#f9e2af" fontSize="9">upfront?</text>
        {/* Yes right to Plan-Execute */}
        <line x1="350" y1="172" x2="440" y2="172" stroke="#585b70" strokeWidth="1.5" />
        <text x="392" y="167" textAnchor="middle" fill="#a6adc8" fontSize="8">Yes</text>
        <rect x="440" y="158" width="90" height="28" rx="4" fill="#313244" stroke="#f9e2af" strokeWidth="1.5" />
        <text x="485" y="171" textAnchor="middle" fill="#f9e2af" fontSize="9" fontWeight="bold">Plan-Execute</text>
        <text x="485" y="182" textAnchor="middle" fill="#a6adc8" fontSize="7">5–15 ordered steps</text>
        {/* No down */}
        <line x1="270" y1="196" x2="270" y2="218" stroke="#585b70" strokeWidth="1.5" />
        <text x="258" y="212" fill="#a6adc8" fontSize="8">No</text>
        {/* Diamond 3: Verifiable correct? */}
        <polygon points="270,218 350,242 270,266 190,242" fill="#313244" stroke="#cba6f7" strokeWidth="1.5" />
        <text x="270" y="238" textAnchor="middle" fill="#cba6f7" fontSize="9">Output is</text>
        <text x="270" y="250" textAnchor="middle" fill="#cba6f7" fontSize="9">verifiable?</text>
        {/* Yes right to Reflexion */}
        <line x1="350" y1="242" x2="440" y2="242" stroke="#585b70" strokeWidth="1.5" />
        <text x="392" y="237" textAnchor="middle" fill="#a6adc8" fontSize="8">Yes</text>
        <rect x="440" y="228" width="90" height="28" rx="4" fill="#313244" stroke="#cba6f7" strokeWidth="1.5" />
        <text x="485" y="241" textAnchor="middle" fill="#cba6f7" fontSize="9" fontWeight="bold">Reflexion</text>
        <text x="485" y="252" textAnchor="middle" fill="#a6adc8" fontSize="7">self-critique loop</text>
        {/* No down to ReAct */}
        <line x1="270" y1="266" x2="270" y2="288" stroke="#585b70" strokeWidth="1.5" />
        <text x="258" y="282" fill="#a6adc8" fontSize="8">No</text>
        <rect x="195" y="288" width="150" height="28" rx="4" fill="#313244" stroke="#fab387" strokeWidth="1.5" />
        <text x="270" y="301" textAnchor="middle" fill="#fab387" fontSize="9" fontWeight="bold">ReAct</text>
        <text x="270" y="312" textAnchor="middle" fill="#a6adc8" fontSize="7">adaptive Thought/Act/Observe loop</text>
        {/* Left panel notes */}
        <text x="10" y="92" fill="#6c7086" fontSize="8">≤2 sequential</text>
        <text x="10" y="103" fill="#6c7086" fontSize="8">tool calls → no</text>
        <text x="10" y="114" fill="#6c7086" fontSize="8">agent needed</text>
      </svg>
      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection</strong>
        {" "}"Design an AI agent for X" — Start by questioning whether you need an agent. "First I'd check if this is solvable with a single structured prompt + retrieval call. Agents add latency, cost, and failure modes. I'd reach for agents only when the task structure is unknown at call time or requires genuine multi-step reasoning with branches." Then walk through ReAct vs Plan-Execute tradeoff for the specific problem.
      </div>

      <QuizSection moduleId={41} title="Module 41: Agent Architectures" contentHint="Agent vs chain cycles vs linear execution, ReAct Thought Action Observation loop max_iterations infinite loop prevention, Plan-and-Execute planner executor separation upfront planning vs adaptive, Reflexion self-critique episodic memory bounded attempts, tool selection similarity search 50+ tools, memory taxonomy in-context episodic semantic procedural, when NOT to use agents latency budget cost explosion determinism" />
    </>
  );
}
