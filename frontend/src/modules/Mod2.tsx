import { useState, useCallback, useRef, useEffect } from 'react';
import { QuizSection } from '../components/QuizSection';
import { NODE_INFO } from '../data/staticData';
import { CodeBlock, CodeDiff } from '../components/CodeBlock';

// ── PipelineFlowViz component ─────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { id: 'classify_intent', label: 'classify_intent', x: 10 },
  { id: 'route', label: 'route', x: 100 },
  { id: 'pre_fetch_tools', label: 'pre_fetch_tools', x: 190 },
  { id: 'run_tools', label: 'run_tools', x: 280 },
  { id: 'llm_response', label: 'llm_response', x: 370 },
  { id: 'validate_output', label: 'validate_output', x: 460 },
  { id: 'emit_sse', label: 'emit_sse', x: 550 },
];

const STAGE_STATE_UPDATES: Record<string, string> = {
  classify_intent: 'intent: property_search, confidence: 0.91',
  route: 'route: tool_call_tier, tier: 1',
  run_tools: 'pre_fetched_data: {listings: [...]}',
  llm_response: "bot_response: 'I found 47 2BHK...'",
  validate_output: 'violations: []',
};

function PipelineFlowViz() {
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [doneIdx, setDoneIdx] = useState<number>(-1);
  const [running, setRunning] = useState(false);
  const [stateLog, setStateLog] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveIdx(-1);
    setDoneIdx(-1);
    setRunning(false);
    setStateLog([]);
  };

  const simulate = () => {
    if (running) return;
    reset();
    setRunning(true);
    let i = 0;
    const step = () => {
      setActiveIdx(i);
      const stage = PIPELINE_STAGES[i];
      if (STAGE_STATE_UPDATES[stage.id]) {
        setStateLog(prev => [...prev, STAGE_STATE_UPDATES[stage.id]]);
      }
      timerRef.current = setTimeout(() => {
        setDoneIdx(i);
        if (i < PIPELINE_STAGES.length - 1) {
          i++;
          timerRef.current = setTimeout(step, 250);
        } else {
          setRunning(false);
        }
      }, 500);
    };
    timerRef.current = setTimeout(step, 200);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const nodeW = 80;
  const nodeH = 36;
  const nodeY = 42;
  const svgW = 640;
  const svgH = 120;

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <style>{`
        @keyframes dashFlow2 { to { stroke-dashoffset: -14; } }
        .pf-dash { animation: dashFlow2 1s linear infinite; }
      `}</style>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>
        PIPELINE EXECUTION — 7 CORE STAGES (see full 19-node map below)
      </div>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Pipeline execution flow visualization">
        <defs>
          <marker id="pf-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#45475a"/>
          </marker>
          <marker id="pf-arrow-active" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#f9e2af"/>
          </marker>
        </defs>
        {PIPELINE_STAGES.map((stage, idx) => {
          const cx = stage.x + nodeW / 2;
          const isActive = activeIdx === idx;
          const isDone = doneIdx >= idx;
          const fill = isDone ? '#a6e3a1' : isActive ? '#f9e2af' : '#313244';
          const textColor = (isDone || isActive) ? '#1e1e2e' : '#cdd6f4';
          const stroke = isDone ? '#a6e3a1' : isActive ? '#f9e2af' : '#45475a';
          return (
            <g key={stage.id}>
              {idx < PIPELINE_STAGES.length - 1 && (
                <line
                  x1={stage.x + nodeW + 2} y1={nodeY + nodeH / 2}
                  x2={PIPELINE_STAGES[idx + 1].x - 2} y2={nodeY + nodeH / 2}
                  stroke={doneIdx >= idx ? '#a6e3a1' : '#45475a'}
                  strokeWidth="2"
                  strokeDasharray={activeIdx === idx ? '4 3' : undefined}
                  className={activeIdx === idx ? 'pf-dash' : undefined}
                  markerEnd={activeIdx === idx ? 'url(#pf-arrow-active)' : 'url(#pf-arrow)'}
                />
              )}
              <rect x={stage.x} y={nodeY} width={nodeW} height={nodeH} rx="6"
                fill={fill} stroke={stroke} strokeWidth={isActive ? 2 : 1}/>
              <text x={cx} y={nodeY + nodeH / 2 + 4} textAnchor="middle"
                fontSize="9" fill={textColor} fontFamily="monospace">
                {stage.label}
              </text>
              <text x={cx} y={nodeY - 6} textAnchor="middle" fontSize="11" fill="#6c7086">
                {idx + 1}
              </text>
            </g>
          );
        })}
        <text x={svgW / 2} y={svgH - 6} textAnchor="middle" fontSize="10" fill="#6c7086">
          {activeIdx >= 0
            ? `Processing: ${PIPELINE_STAGES[Math.min(activeIdx, PIPELINE_STAGES.length - 1)].label}`
            : doneIdx >= PIPELINE_STAGES.length - 1
            ? 'Pipeline complete — all nodes executed'
            : 'Click Simulate to trace a request'}
        </text>
      </svg>
      <div style={{marginTop:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
        <button onClick={simulate} disabled={running}
          style={{background: running ? '#45475a' : '#313244',color: running ? '#6c7086' : '#cdd6f4',border:'1px solid #45475a',borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor: running ? 'not-allowed' : 'pointer',marginRight:'8px'}}>
          {running ? 'Running…' : 'Simulate'}
        </button>
        <button onClick={reset}
          style={{background:'#313244',color:'#cdd6f4',border:'1px solid #45475a',borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor:'pointer',marginRight:'8px'}}>
          Reset
        </button>
        <span style={{fontSize:'0.75rem',color:'#6c7086'}}>
          <span style={{display:'inline-block',width:10,height:10,borderRadius:2,background:'#f9e2af',marginRight:4,verticalAlign:'middle'}}/>active
          <span style={{display:'inline-block',width:10,height:10,borderRadius:2,background:'#a6e3a1',marginLeft:8,marginRight:4,verticalAlign:'middle'}}/>done
        </span>
      </div>
      {stateLog.length > 0 && (
        <div style={{marginTop:'12px',background:'#1e1e2e',border:'1px solid #313244',borderRadius:'6px',padding:'10px'}}>
          <div style={{fontSize:'0.7rem',color:'#6c7086',marginBottom:'6px',letterSpacing:'0.08em',textTransform:'uppercase'}}>BotState populated as pipeline runs</div>
          {stateLog.map((entry, i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
              <span style={{color:'#89b4fa',fontSize:'0.72rem',fontFamily:'monospace',minWidth:'120px'}}>
                {Object.keys(STAGE_STATE_UPDATES)[Object.values(STAGE_STATE_UPDATES).indexOf(entry)]}:
              </span>
              <span style={{fontFamily:'monospace',fontSize:'0.78rem',color:'#a6e3a1'}}>{entry}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── BotStateCartViz component ─────────────────────────────────────────────────

const CART_ITEMS = [
  { node: 'session_load_node', fields: ['session_id', 'turn_count', 'active_filters'], color: '#89b4fa' },
  { node: 'classify_node', fields: ['classification', 'domain', 'normalized_message'], color: '#cba6f7' },
  { node: 'fetch_data_node', fields: ['pre_fetched_data', 'system_prompt'], color: '#f9e2af' },
  { node: 'llm_node', fields: ['llm_response', 'bot_response', 'validated_text'], color: '#a6e3a1' },
];

function BotStateCartViz() {
  const svgW = 560;
  const svgH = 200;
  const cartX = 370;
  const cartY = 20;
  const cartW = 170;
  const cartH = 160;

  const allFields: Array<{ field: string; color: string }> = [];
  CART_ITEMS.forEach(item => item.fields.forEach(f => allFields.push({ field: f, color: item.color })));

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>
        BOTSTATE — NODES ADD TO STATE, NOTHING IS REMOVED MID-PIPELINE
      </div>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{display:'block',margin:'0 auto'}} aria-label="BotState shopping cart metaphor">
        <defs>
          <marker id="cart-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#45475a"/>
          </marker>
        </defs>
        {/* Cart outline */}
        <rect x={cartX} y={cartY} width={cartW} height={cartH} rx="6" fill="#1e1e2e" stroke="#45475a" strokeWidth="1.5"/>
        <text x={cartX + cartW / 2} y={cartY - 6} textAnchor="middle" fontSize="11" fill="#6c7086">BotState (cart)</text>
        {/* Cart fields */}
        {allFields.map((item, i) => (
          <g key={item.field}>
            <rect x={cartX + 8} y={cartY + 8 + i * 18} width={cartW - 16} height={15} rx="3"
              fill={item.color + '22'} stroke={item.color + '66'} strokeWidth="1"/>
            <text x={cartX + 14} y={cartY + 19 + i * 18} fontSize="9" fill={item.color} fontFamily="monospace">
              {item.field}
            </text>
          </g>
        ))}
        {/* Node boxes on left with L-shaped connectors — no crossing lines */}
        {(() => {
          const nx = 10;
          const nw = 130;
          const nh = 30;
          const spineX = cartX - 20; // vertical spine x position
          // Compute all fieldY values up front so we can draw the spine
          const fieldYs = CART_ITEMS.map((item, i) => {
            const fieldStartIdx = i === 0 ? 0 : CART_ITEMS.slice(0, i).reduce((a, b) => a + b.fields.length, 0);
            return cartY + 8 + fieldStartIdx * 18 + 7;
          });
          const spineTop = Math.min(...fieldYs);
          const spineBottom = Math.max(...fieldYs);
          return (
            <>
              {/* Vertical spine */}
              <line x1={spineX} y1={spineTop} x2={spineX} y2={spineBottom}
                stroke="#45475a" strokeWidth="1.5" strokeDasharray="4 3"/>
              {/* Arrow from spine to cart (centered on spine range) */}
              <line x1={spineX} y1={(spineTop + spineBottom) / 2}
                x2={cartX - 4} y2={(spineTop + spineBottom) / 2}
                stroke="#45475a" strokeWidth="1.5"
                markerEnd="url(#cart-arrow)"/>
              {CART_ITEMS.map((item, i) => {
                const ny = 20 + i * 44;
                const nodeRightX = nx + nw;
                const nodeMidY = ny + nh / 2;
                const fieldY = fieldYs[i];
                return (
                  <g key={item.node}>
                    <rect x={nx} y={ny} width={nw} height={nh} rx="6"
                      fill={item.color + '22'} stroke={item.color} strokeWidth="1"/>
                    <text x={nx + nw / 2} y={ny + 19} textAnchor="middle" fontSize="9" fill={item.color} fontFamily="monospace">
                      {item.node}
                    </text>
                    {/* L-shaped path: horizontal to spine, vertical to fieldY */}
                    <path
                      d={`M ${nodeRightX},${nodeMidY} L ${spineX},${nodeMidY} L ${spineX},${fieldY}`}
                      fill="none"
                      stroke={item.color} strokeWidth="1.5" strokeDasharray="4 3"/>
                    {/* Dot at fieldY on spine to mark the connection point */}
                    <circle cx={spineX} cy={fieldY} r="2.5" fill={item.color}/>
                  </g>
                );
              })}
            </>
          );
        })()}
        <text x={svgW / 2 - 20} y={svgH - 6} textAnchor="middle" fontSize="10" fill="#6c7086">
          Each node appends its owned keys — existing keys are never removed
        </text>
      </svg>
    </div>
  );
}

// ── Code block constants ──────────────────────────────────────────────────────

const CODE_NODE_CONTRACT = `async def node_name(state: BotState, dep1=None, dep2=None, emit_sse=None) -> dict:
    # 1. Read what you need from state
    # 2. Do exactly one job
    # 3. Return a partial state update (only the keys you own)
    # 4. emit_sse for real-time UI feedback (never for logic)`;

const CODE_TYPEDDICT_PY = `# Python TypedDict — think of it as TypeScript's interface, but for dicts
class BotState(TypedDict):
    raw_message: str
    session: dict
    classification: dict | None
    bot_response: str | None`;

const CODE_TYPEDDICT_TS = `// TypeScript equivalent
interface BotState {
  raw_message: string;
  session: Record<string, unknown>;
  classification: Record<string, unknown> | null;
  bot_response: string | null;
}`;

const CODE_STATE_MERGE = `# state before node runs:
# { raw_message: "hi", session: {city: "Mumbai", budget: 5000000}, bot_response: None }

# node returns only one key:
return {"bot_response": "Hello!"}

# state after merge:
# { raw_message: "hi", session: {city: "Mumbai", budget: 5000000}, bot_response: "Hello!" }
# ↑ session is UNCHANGED — only bot_response was overwritten

# TRAP: if your node returns {"session": {"city": "Delhi"}} it REPLACES the whole
# session dict — budget is gone. Always read session, modify it, return the full dict.`;

const CODE_NO_OP_SAFE = `# The wrapper — 3 lines
def _no_op_safe(fn):
    async def wrapped(*args, **kwargs):
        result = await fn(*args, **kwargs)
        return result or None   # {} is falsy → becomes None; LangGraph skips the update
    return wrapped

# Usage — every node that can legitimately return "nothing"
@_no_op_safe
async def experiment_node(state: BotState) -> dict:
    if not state.get("experiment_id"):
        return {}   # no experiment active — would raise without the wrapper
    return {"experiment_variant": "treatment"}`;

const CODE_HANDOFF_CONTEXT = `# The listing page embeds context in the chat init request:
POST /chat/init
{
  "session_id": "sess_xyz",
  "handoff_context": {
    "active_property_id": "prop_abc123",
    "city": "Mumbai",
    "locality": "Bandra",
    "listing_url": "https://housing.com/listing/prop_abc123"
  }
}

# session_load_node seeds session.active_filters and session.active_property_id
async def session_load_node(state: BotState, redis=None) -> dict:
    session = await _load_or_create(state["session_id"], redis)
    if not session.get("active_property_id"):
        ctx = state.get("handoff_context", {})
        if ctx.get("active_property_id"):
            session["active_property_id"] = ctx["active_property_id"]
            session["active_filters"]["city"] = ctx.get("city")
            session["active_filters"]["localities"] = [ctx.get("locality")]
    return {"session": session}`;

const CODE_GATE_BUG = `# ❌ BROKEN — counter incremented, never decremented on crash
@router.post("/send-message")
async def send_message(body, request, settings):
    llm_gate = getattr(request.app.state, "llm_gate", None)
    if llm_gate is not None:
        allowed = await llm_gate.acquire()   # Redis INCR
        if not allowed:
            return Response(status_code=429)
    # 👇 If this throws, acquire() already ran → slot leaked forever
    await graph.ainvoke(state)
    return JSONResponse(...)`;

const CODE_GATE_FIX = `# ✅ FIXED — finally block mirrors send_message_streamed()
@router.post("/send-message")
async def send_message(body, request, settings):
    llm_gate = getattr(request.app.state, "llm_gate", None)
    if llm_gate is not None:
        allowed = await llm_gate.acquire()   # Redis INCR
        if not allowed:
            return Response(status_code=429)   # early-exit: gate NOT held

    # request_id resolved BEFORE try so it's available in finally for logging
    request_id = ctx.get("request_id") or str(uuid.uuid4())
    try:
        await graph.ainvoke(state)
        return JSONResponse(...)
    finally:
        if llm_gate is not None:
            try:
                await llm_gate.release()       # Redis DECR — always runs
            except Exception as exc:
                log.error("gate_release_failed", error=str(exc), request_id=request_id)`;

// ── Phase labels ──────────────────────────────────────────────────────────────

const PHASE_LABEL: Record<'classify' | 'process' | 'response', string> = {
  classify: 'Classification Phase',
  process: 'Processing Phase',
  response: 'Response Phase',
};

// ── PipelineNodes component ───────────────────────────────────────────────────

interface TooltipState {
  name: string;
  x: number;
  y: number;
}

function PipelineNodes() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const phases: Record<'classify' | 'process' | 'response', string[]> = {
    classify: [],
    process: [],
    response: [],
  };
  Object.entries(NODE_INFO).forEach(([name, info]) => {
    phases[info.phase].push(name);
  });

  const handleMouseEnter = useCallback((e: React.MouseEvent, name: string) => {
    const x = e.clientX + 14;
    const y = e.clientY + 14;
    setTooltip({ name, x, y });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!tooltip) return;
    const tip = tooltipRef.current;
    const w = tip ? tip.offsetWidth : 220;
    const h = tip ? tip.offsetHeight : 80;
    const x = e.clientX + 14;
    const y = e.clientY + 14;
    const left = x + w > window.innerWidth - 16 ? e.clientX - w - 10 : x;
    const top = y + h > window.innerHeight - 16 ? e.clientY - h - 10 : y;
    setTooltip(prev => prev ? { ...prev, x: left, y: top } : null);
  }, [tooltip]);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const handleClick = useCallback((name: string) => {
    setSelectedNode(prev => (prev === name ? null : name));
  }, []);

  const phaseEntries: Array<{ phase: 'classify' | 'process' | 'response'; label: string; range: string; labelClass: string }> = [
    { phase: 'classify', label: 'Classification Phase', range: 'nodes 1–5', labelClass: 'pipe-phase-label lbl-classify' },
    { phase: 'process', label: 'Processing Phase', range: 'nodes 6–11', labelClass: 'pipe-phase-label lbl-process' },
    { phase: 'response', label: 'Response Phase', range: 'nodes 12–19', labelClass: 'pipe-phase-label lbl-response' },
  ];

  const tooltipInfo = tooltip ? NODE_INFO[tooltip.name] : null;
  const selectedInfo = selectedNode ? NODE_INFO[selectedNode] : null;

  return (
    <>
      {phaseEntries.map(({ phase, label, range, labelClass }) => (
        <div key={phase} className="diagram-wrap">
          <div className="diagram-title">
            {label} <span className={labelClass}>{range}</span>
          </div>
          <div className="diagram-scroll">
            <div className="pipeline-nodes">
              {phases[phase].map((name, idx) => (
                <span key={name}>
                  {idx > 0 && <span className="pipe-arrow">→</span>}
                  <div
                    className={`pipe-node phase-${phase}`}
                    onMouseEnter={e => handleMouseEnter(e, name)}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                    onClick={() => handleClick(name)}
                  >
                    {name}
                  </div>
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Floating tooltip */}
      {tooltip && tooltipInfo && (
        <div
          ref={tooltipRef}
          id="pipe-tooltip"
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            zIndex: 9999,
            pointerEvents: 'none',
            display: 'block',
          }}
        >
          <div className="tt-name">{tooltip.name}</div>
          <div className="tt-job">{tooltipInfo.job}</div>
          <div className="tt-tip">{tooltipInfo.tip}</div>
        </div>
      )}

      {/* Click-to-expand node detail */}
      {selectedNode && selectedInfo && (
        <div className="callout callout-info">
          <strong>
            {selectedNode} — {PHASE_LABEL[selectedInfo.phase]}
          </strong>
          <span> {selectedInfo.job} </span>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>{selectedInfo.tip}</span>
        </div>
      )}
    </>
  );
}

// ── Main Mod2 export ──────────────────────────────────────────────────────────

export function Mod2() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Explain why the pipeline has five conceptual stages and what problem each solves</li>
          <li>Trace a user query through the pipeline and identify which stage handles each concern</li>
          <li>Justify the ordering: why classification runs before tool execution, why validation runs after the LLM response</li>
          <li>Assign any new requirement to the correct tier (0/1/2/3a/3b) and explain why</li>
          <li>Use the playground to observe real pipeline execution and connect events to stage theory</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~60 minutes</span>
          <span className="obj-diff">Difficulty: ★★★★☆</span>
          <span className="obj-diff">💡 Use this as a reference map — return to it as you build each stage in Act 2</span>
        </div>
      </div>

      <div className="callout callout-info">
        <strong>This module is a reference map, not a memorisation exercise.</strong> You don't need to name all 19 nodes. You need to understand why each of the five stages exists — and be able to explain those reasons to an interviewer or a new team member.
      </div>

      <PipelineFlowViz />

      <h2>The Five Pipeline Stages — The Why</h2>
      <table>
        <tbody>
          <tr><th>Stage</th><th>Purpose</th><th>Key decision it makes</th></tr>
          <tr><td><strong>Classify</strong></td><td>Understand intent before touching any tool</td><td>Is this query safe, in-domain, and clear enough to act on?</td></tr>
          <tr><td><strong>Enrich</strong></td><td>Hydrate state with session context and derived parameters</td><td>What filters has the user already set? What can be derived vs. what must be asked?</td></tr>
          <tr><td><strong>Retrieve</strong></td><td>Fetch data only after classification is confident</td><td>Which tools to invoke, in what order, with what parameters?</td></tr>
          <tr><td><strong>Respond</strong></td><td>LLM generates an answer with full context available</td><td>How to synthesise retrieved data into a natural, grounded response?</td></tr>
          <tr><td><strong>Validate</strong></td><td>Check output before it reaches the user</td><td>Is the response safe, factually grounded, and within cost budget?</td></tr>
        </tbody>
      </table>
      <p>The 19 individual nodes in the interactive diagram below are implementations of these five stages. Explore each node and trace it back to its stage.</p>

      <BotStateCartViz />

      <h2>8.1 Node Design Contract</h2>
      <p>Every node in this pipeline follows the same contract:</p>
      <CodeBlock title="Pipeline Node Design Contract" language="python" keyLine={4} keyNote="emit_sse is for UI only — never drives logic">{CODE_NODE_CONTRACT}</CodeBlock>

      <div className="callout callout-tip">
        <strong>What is TypedDict? (TypeScript developer translation)</strong>
        <CodeBlock title="BotState — Python TypedDict Definition" language="python" keyLine={2} keyNote="TypedDict = typed dict with mypy/pyright enforcement only">{CODE_TYPEDDICT_PY}</CodeBlock>
        <CodeBlock title="BotState — TypeScript Equivalent" language="typescript">{CODE_TYPEDDICT_TS}</CodeBlock>
        Key differences from TypeScript interfaces:
        <ul>
          <li>
            <strong>Runtime vs compile-time:</strong> TypeScript checks at compile time and strips types. Python's TypedDict is a type hint — mypy/pyright check it, but Python itself does NOT enforce it at runtime. You CAN add extra keys at runtime without an error.
          </li>
          <li>
            <strong>Merging:</strong> When a node returns <code>{'bot_response\': \'hello\''}</code>, LangGraph calls <code>state.update({'bot_response\': \'hello\''}</code>) — a shallow merge. Only the keys you return are updated. Nested dicts (like <code>session</code>) are replaced wholesale, not deep-merged, unless you use a custom reducer.
            <CodeBlock title="BotState Shallow Merge — Trap with Nested Dicts" language="python" keyLine={10} keyNote="returning a partial session dict silently drops other keys">{CODE_STATE_MERGE}</CodeBlock>
          </li>
          <li>
            <strong>Special reducers:</strong> Some keys use reducers instead of replace: <code>messages: Annotated[list, add_messages]</code> means "append to the list" instead of replace. More on this in Module 25.
          </li>
        </ul>
      </div>

      <div className="callout callout-info">
        <strong>Single Responsibility in Nodes</strong>Never read from state keys you don't own. Never write keys another node owns. This is the Single Responsibility Principle applied to pipeline nodes.
      </div>

      <div className="callout callout-tip">
        <strong>Returning None vs {'{'}{'}'}  — the <code>_no_op_safe</code> wrapper explained</strong>
        {' '}In LangGraph 0.2.55+, returning an empty dict <code>{'{}'}</code> from a node raises <code>InvalidUpdateError</code>. The fix is simple but the wrapper deserves explanation:
        <CodeBlock title="_no_op_safe Wrapper — Handle Empty Returns" language="python" keyLine={3} keyNote="empty dict is falsy; None tells LangGraph to skip the update">{CODE_NO_OP_SAFE}</CodeBlock>
        <strong>When does a node return nothing?</strong> Nodes like <code>experiment_node</code>, <code>safety_node</code> (when safe), and <code>session_load_node</code> (when session already exists) have valid "nothing to update" code paths. Without the wrapper, a guard like <code>if not active: return {'{}'}</code> crashes LangGraph.
        <br /><br />
        <strong>Rule:</strong> return <code>None</code> (or rely on <code>_no_op_safe</code>) when you have nothing to write. Never return <code>{'{}'}</code> directly.
      </div>

      <h2>8.2 Interactive Pipeline — Hover to inspect, click for detail</h2>
      <PipelineNodes />

      <h2>8.3 Tier System — The LLM is the last resort</h2>
      <div className="tier-grid">
        <div className="tier-cell header">Tier</div>
        <div className="tier-cell header">Trigger</div>
        <div className="tier-cell header">Action</div>
        <div className="tier-cell header">LLM?</div>

        <div className="tier-cell"><span className="tier-badge t0">Tier 0</span></div>
        <div className="tier-cell">Auth required</div>
        <div className="tier-cell">Show login template</div>
        <div className="tier-cell">No — ~50ms, zero cost</div>

        <div className="tier-cell"><span className="tier-badge t1">Tier 1</span></div>
        <div className="tier-cell">Direct action (save, contact)</div>
        <div className="tier-cell">Execute + template response</div>
        <div className="tier-cell">No — ~50ms, zero cost</div>

        <div className="tier-cell"><span className="tier-badge t2">Tier 2</span></div>
        <div className="tier-cell">Template response (calculator, portfolio)</div>
        <div className="tier-cell">Fetch + render template</div>
        <div className="tier-cell">No — ~200ms, zero cost</div>

        <div className="tier-cell"><span className="tier-badge t3a">Tier 3a</span></div>
        <div className="tier-cell">Most intents</div>
        <div className="tier-cell">Full LLM pipeline (Haiku)</div>
        <div className="tier-cell">Yes — ~1-2s, low cost</div>

        <div className="tier-cell"><span className="tier-badge t3b">Tier 3b</span></div>
        <div className="tier-cell">Complex (comparison, multi-intent)</div>
        <div className="tier-cell">Full LLM pipeline (Sonnet)</div>
        <div className="tier-cell">Yes — ~2-5s, higher cost</div>
      </div>

      <div className="mini-check">
        <div className="mini-check-title">Phase C Mini-Check — before moving on</div>
        <ul>
          <li>Why does the carousel appear <em>before</em> the LLM text? Which node emits each?</li>
          <li><code>build_prompt_node</code> caches the system prompt. Which provider enables this and what's the cost reduction?</li>
          <li>Why is <code>connection_close</code> emitted <em>before</em> the Redis write, not after?</li>
        </ul>
      </div>

      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection — Module 8</strong>
        {' '}"Walk me through your AI agent's architecture." Lead with the three-phase structure (classify / process / response), name one node per phase as examples, then state the tier system. Close with: "This means ~65% of messages never reach the LLM — that's the source of both our latency and cost numbers." That's the L5–L6 framing interviewers expect.
        <br /><br />
        <strong>Likely follow-up:</strong> "Why does every node return a partial dict instead of a modified copy of state?"<br />
        → LangGraph merges partial returns into the shared TypedDict. Nodes only declare what they changed. This enforces single responsibility — a node that "touches everything" in state is a code smell, not valid LangGraph.
        <br /><br />
        <strong>Likely follow-up:</strong> "How do you prevent a response node from running if a processing node short-circuited earlier?"<br />
        → Conditional edges read from state. If <code>state["route"] == "blocked"</code>, the edge function returns "blocked_response" (a different node) instead of "build_prompt". No special cleanup needed — the graph just takes a different path.
      </div>

      <h2>8.4 The <code>handoff_context</code> Pattern — Seeding Turn 1</h2>
      <p>
        When a user opens the chat widget from a property listing page, the bot already knows which property they're looking at. If we don't capture that, Turn 1 becomes "which property are you asking about?" — a terrible UX.
      </p>
      <CodeBlock title="handoff_context — Seeding Turn 1 from Listing Page" language="python" keyLine={16} keyNote="seed active_property_id once at boundary; never re-parse it">{CODE_HANDOFF_CONTEXT}</CodeBlock>

      <div className="callout callout-info">
        <strong>Why not let the LLM infer context from the URL?</strong>
        Three reasons:
        <ol style={{ margin: '4px 0 0 16px' }}>
          <li><strong>Reliability:</strong> The LLM might not see the URL (it's in page metadata, not the user's message). Even if it does, URL parsing is brittle — the property ID format can change.</li>
          <li><strong>Cost:</strong> Inferring structured data from an unstructured URL costs tokens and latency every single turn. Pre-seeding costs zero.</li>
          <li><strong>Correctness:</strong> The gateway page already has the property ID as a typed, validated value. Extract it once at the boundary and trust it. Don't re-parse what you already have.</li>
        </ol>
        <strong>Turn 1 now reads:</strong> "What's the EMI on this property?" — and the bot already knows the price, city, and property ID.
      </div>

      <h2>8.5 Short-Circuit DAG — When Does the Pipeline Stop Early?</h2>
      <p>
        Not every message goes through all 19 nodes. Nodes that can <em>set</em> <code>bot_response</code> can also terminate the pipeline early. The conditional edge after each such node checks: if <code>bot_response</code> is set, skip to the end. This is how a blocked message gets a response in 5ms instead of 2 seconds.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ fontSize: 11, minWidth: 800 }}>
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Node</th>
              <th style={{ width: '12%' }}>Phase</th>
              <th style={{ width: '10%' }}>Short-circuits?</th>
              <th style={{ width: '58%' }}>What triggers early exit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>safety_node</strong></td>
              <td><span className="pipe-phase-label lbl-classify">classify</span></td>
              <td style={{ color: 'var(--accent2)' }}>✓ YES</td>
              <td>prompt injection detected, profanity, empty message after strip, message &gt; char limit → <code>bot_response</code> = block template</td>
            </tr>
            <tr>
              <td><strong>normalize_node</strong></td>
              <td><span className="pipe-phase-label lbl-classify">classify</span></td>
              <td style={{ color: 'var(--accent2)' }}>✓ YES</td>
              <td>gibberish (character entropy too low, no dictionary words) → <code>bot_response</code> = "I didn't understand that"</td>
            </tr>
            <tr>
              <td><strong>route_domain_node</strong></td>
              <td><span className="pipe-phase-label lbl-classify">classify</span></td>
              <td>✗ no</td>
              <td>always continues — domain routing never short-circuits</td>
            </tr>
            <tr>
              <td><strong>classify_node</strong></td>
              <td><span className="pipe-phase-label lbl-classify">classify</span></td>
              <td>✗ no</td>
              <td>always continues</td>
            </tr>
            <tr>
              <td><strong>validate_slm_node</strong></td>
              <td><span className="pipe-phase-label lbl-classify">classify</span></td>
              <td style={{ color: 'var(--accent2)' }}>✓ YES</td>
              <td>SLM output fails schema validation (missing intent, bad JSON) → fallback to out_of_scope. SLM confidence below 0.65 → <code>bot_response</code> = clarification prompt</td>
            </tr>
            <tr>
              <td><strong>route_node</strong></td>
              <td><span className="pipe-phase-label lbl-process">process</span></td>
              <td style={{ color: 'var(--accent2)' }}>✓ YES</td>
              <td>Tier 0 intent + unauthenticated user → <code>bot_response</code> = login prompt (no LLM needed)</td>
            </tr>
            <tr>
              <td><strong>clarify_node</strong></td>
              <td><span className="pipe-phase-label lbl-process">process</span></td>
              <td style={{ color: 'var(--accent2)' }}>✓ YES</td>
              <td><code>clarification_needed=true</code> from SLM → generates clarification question → <code>bot_response</code> set. Pipeline skips fetch/LLM entirely.</td>
            </tr>
            <tr>
              <td><strong>session_check_node</strong></td>
              <td><span className="pipe-phase-label lbl-process">process</span></td>
              <td>✗ no</td>
              <td>always continues</td>
            </tr>
            <tr>
              <td><strong>filter_apply_node</strong></td>
              <td><span className="pipe-phase-label lbl-process">process</span></td>
              <td>✗ no</td>
              <td>always continues</td>
            </tr>
            <tr>
              <td><strong>experiment_node</strong></td>
              <td><span className="pipe-phase-label lbl-process">process</span></td>
              <td>✗ no</td>
              <td>always continues</td>
            </tr>
            <tr>
              <td><strong>fetch_data_node</strong></td>
              <td><span className="pipe-phase-label lbl-process">process</span></td>
              <td>✗ no</td>
              <td>always continues — even if fetch fails, pipeline continues with empty data</td>
            </tr>
            <tr>
              <td><strong>build_prompt_node</strong></td>
              <td><span className="pipe-phase-label lbl-response">response</span></td>
              <td>✗ no</td>
              <td>always continues</td>
            </tr>
            <tr>
              <td><strong>llm_node</strong></td>
              <td><span className="pipe-phase-label lbl-response">response</span></td>
              <td>✗ no</td>
              <td>generates response — <code>bot_response</code> IS set here for the first time in Tier 3 paths</td>
            </tr>
            <tr>
              <td><strong>validate_output_node</strong></td>
              <td><span className="pipe-phase-label lbl-response">response</span></td>
              <td style={{ color: 'var(--accent2)' }}>✓ YES</td>
              <td>LLM tried to leak PII or violate guardrails → response stripped, fallback template returned</td>
            </tr>
            <tr>
              <td><strong>format_response_node</strong></td>
              <td><span className="pipe-phase-label lbl-response">response</span></td>
              <td>✗ no</td>
              <td>always continues</td>
            </tr>
            <tr>
              <td><strong>emit_carousel_node</strong></td>
              <td><span className="pipe-phase-label lbl-response">response</span></td>
              <td>✗ no</td>
              <td>always continues (emits carousel via SSE if data available, otherwise no-op)</td>
            </tr>
            <tr>
              <td><strong>emit_response_node</strong></td>
              <td><span className="pipe-phase-label lbl-response">response</span></td>
              <td>✗ no</td>
              <td>always continues — streams the text response</td>
            </tr>
            <tr>
              <td><strong>save_session_node</strong></td>
              <td><span className="pipe-phase-label lbl-response">response</span></td>
              <td>✗ no</td>
              <td>always continues</td>
            </tr>
            <tr>
              <td><strong>followup_node</strong></td>
              <td><span className="pipe-phase-label lbl-response">response</span></td>
              <td>✗ no</td>
              <td>always the last node — emits followup suggestions if any</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="callout callout-info">
        <strong>Reading the table: the three fast exits (Tier 0, 1, 2)</strong>
        <ul style={{ margin: '4px 0 0 16px' }}>
          <li><strong>Blocked messages</strong> exit at <code>safety_node</code> or <code>validate_slm_node</code> — 5-50ms, zero LLM cost.</li>
          <li><strong>Tier 0 auth-gated</strong> exits at <code>route_node</code> — 50ms, zero LLM cost. Just a template.</li>
          <li><strong>Tier 1/2 structured actions</strong> exit at <code>clarify_node</code> — 200ms, zero LLM cost. Template + Redis action.</li>
          <li><strong>Tier 3a/3b</strong> goes all the way to <code>llm_node</code> — 1-5 seconds, costs ~$0.002.</li>
        </ul>
        This is why "65% of messages never reach the LLM" is the headline stat for this architecture.
      </div>

      <div className="callout callout-gotcha">
        <strong>Production gotcha: Redis counter leak in LLMConcurrencyGate</strong>
        <p>
          The concurrency gate uses a Redis counter — <code>INCR</code> on acquire, <code>DECR</code> on release.
          If the endpoint crashes between those two calls, the counter is permanently off by one.
          Over hours of traffic this silently consumes all available slots → gradual DoS.
        </p>
        <CodeDiff
          brokenTitle="LLMConcurrencyGate — Counter Leak on Crash"
          fixedTitle="LLMConcurrencyGate — try/finally Ensures Release"
          language="python"
          broken={CODE_GATE_BUG}
          fixed={CODE_GATE_FIX}
        />
        <p style={{ marginTop: 8 }}>
          <strong>Why resolve <code>request_id</code> before the try block?</strong> If an exception fires before
          the assignment inside <code>try</code>, the <code>finally</code> block cannot reference the variable.
          Define it before <code>try</code> so it is always in scope for the error log.
        </p>
      </div>

      <QuizSection
        moduleId={8}
        title="Module 8"
        contentHint="Node contracts, the 19-node pipeline structure, tier system (0/1/2/3a/3b), conditional short-circuits, _no_op_safe pattern, handoff_context seeding, LLMConcurrencyGate Redis counter leak fix"
      />
    </>
  );
}
