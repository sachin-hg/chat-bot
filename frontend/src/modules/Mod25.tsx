import { useState } from 'react';
import { QuizSection } from "../components/QuizSection";
import { CodeBlock, CodeDiff } from '../components/CodeBlock';

// ── VIZ: LangSmith Debug — Span Click Detail ─────────────────────────────────
function LangSmithDebugViz() {
  const [activeStep, setActiveStep] = useState(2);

  const steps = [
    { n: 1, label: 'Find session', detail: 'grep logs by session_id to locate the failing request' },
    { n: 2, label: 'Open LangSmith', detail: 'Filter traces by session_id=sess_abc in LangSmith UI' },
    { n: 3, label: 'Click span', detail: 'classify_node span: confidence=0.42 → coerced to out_of_scope' },
    { n: 4, label: 'View prompt', detail: 'Prompt view shows missing few-shot for "near the sea" phrasing' },
    { n: 5, label: 'Fix & Re-test', detail: 'Add 1 example → rerun → 8/8 pass' },
  ];

  const colors = ['#89b4fa','#94e2d5','#f38ba8','#cba6f7','#a6e3a1'];

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <style>{`
        @keyframes dashFlow25 { to { stroke-dashoffset: -14; } }
      `}</style>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>LANGSMITH DEBUGGING — CLICK A STEP TO SEE SPAN DETAIL</div>
      <svg viewBox="0 0 560 245" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="5-step LangSmith debugging workflow timeline">
        <defs>
          <marker id="arr-25" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#45475a"/>
          </marker>
        </defs>

        {steps.map((step, i) => {
          const x = 15 + i * 107;
          const isActive = activeStep === i;
          const color = colors[i];
          return (
            <g key={i} style={{cursor:'pointer'}} onClick={() => setActiveStep(i)}>
              {i > 0 && (
                <line
                  x1={x - 6} y1="55" x2={x - 1} y2="55"
                  stroke="#45475a" strokeWidth="1.5"
                  strokeDasharray={isActive ? "none" : "4 3"}
                  markerEnd="url(#arr-25)"
                  style={isActive ? {animation:'dashFlow25 1s linear infinite'} : {}}
                />
              )}
              <rect
                x={x} y="30" width="90" height="50" rx="6"
                fill={isActive ? `${color}22` : '#1e1e2e'}
                stroke={isActive ? color : '#45475a'}
                strokeWidth={isActive ? 2 : 1}
              />
              <circle cx={x + 14} cy="44" r="9" fill={isActive ? color : '#313244'}/>
              <text x={x + 14} y="48" textAnchor="middle" fontSize="10" fontWeight="700" fill={isActive ? '#1e1e2e' : '#6c7086'}>{step.n}</text>
              <text x={x + 45} y="48" textAnchor="middle" fontSize="10" fontWeight="600" fill={isActive ? color : '#bac2de'}>{step.label}</text>
            </g>
          );
        })}

        {/* Detail box */}
        <rect x="15" y="100" width="530" height={80} rx="6" fill="#1e1e2e" stroke="#313244" strokeWidth="1"/>
        <text x="25" y="117" fontSize="10" fontWeight="600" fill={colors[activeStep]}>Step {steps[activeStep].n} — {steps[activeStep].label}</text>
        <text x="25" y="134" fontSize="11" fill="#cdd6f4">{steps[activeStep].detail}</text>

        {/* Time label */}
        <rect x="380" y="205" width="165" height="24" rx="4" fill="#a6e3a111" stroke="#a6e3a1" strokeWidth="1"/>
        <text x="463" y="221" textAnchor="middle" fontSize="11" fontWeight="700" fill="#a6e3a1">Total: 8 minutes to fix</text>
      </svg>
      <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'8px'}}>
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveStep(i)}
            style={{
              background: activeStep === i ? '#89b4fa22' : '#313244',
              color: activeStep === i ? '#89b4fa' : '#cdd6f4',
              border: `1px solid ${activeStep === i ? '#89b4fa' : '#45475a'}`,
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '0.78rem',
              cursor: 'pointer',
              marginRight: '8px',
            }}
          >
            Step {s.n}: {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── VIZ: Interactive Trace Tree (pipeline_invoke) ─────────────────────────────
type TraceSpan = {
  id: string;
  name: string;
  duration: number;
  tokens: number | null;
  cost: number | null;
  depth: number;
  color: string;
  inputTokens?: number;
  outputTokens?: number;
  outputPreview?: string;
};

const PIPELINE_SPANS: TraceSpan[] = [
  {
    id: 'root',
    name: 'pipeline_invoke',
    duration: 412,
    tokens: null,
    cost: null,
    depth: 0,
    color: '#45475a',
    outputPreview: 'Pipeline completed. 3 child nodes executed.',
  },
  {
    id: 'safety',
    name: 'safety_node',
    duration: 2,
    tokens: 45,
    cost: 0.00001,
    depth: 1,
    color: '#a6e3a1',
    inputTokens: 32,
    outputTokens: 13,
    outputPreview: '{"safe": true, "flags": []}',
  },
  {
    id: 'classify',
    name: 'classify_node',
    duration: 187,
    tokens: 234,
    cost: 0.00023,
    depth: 1,
    color: '#89b4fa',
    inputTokens: 156,
    outputTokens: 78,
    outputPreview: '{"intent": "property_search", "confidence": 0.91}',
  },
  {
    id: 'respond',
    name: 'respond_node',
    duration: 198,
    tokens: 892,
    cost: 0.00089,
    depth: 1,
    color: '#cba6f7',
    inputTokens: 412,
    outputTokens: 480,
    outputPreview: '"Here are 3 properties matching your criteria in Bandra..."',
  },
  {
    id: 'llm',
    name: 'llm_call',
    duration: 180,
    tokens: 678,
    cost: 0.00068,
    depth: 2,
    color: '#94e2d5',
    inputTokens: 290,
    outputTokens: 388,
    outputPreview: '"Here are 3 properties matching your criteria in Bandra..."',
  },
];

function InteractiveTraceTree({ spans, maxDuration, title }: { spans: TraceSpan[]; maxDuration: number; title?: string }) {
  const [selectedSpan, setSelectedSpan] = useState<string | null>(null);
  const selected = spans.find(s => s.id === selectedSpan) ?? null;

  return (
    <div style={{
      background: '#0d0d0f',
      border: '1px solid #1e1e2e',
      borderRadius: '6px',
      overflow: 'hidden',
      margin: '20px 0',
      fontFamily: 'monospace',
    }}>
      {/* Header bar — terminal chrome */}
      <div style={{
        background: '#181825',
        borderBottom: '1px solid #1e1e2e',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{display:'flex',gap:'6px'}}>
          <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'#f38ba8',opacity:0.7}}/>
          <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'#f9e2af',opacity:0.7}}/>
          <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'#a6e3a1',opacity:0.7}}/>
        </div>
        <span style={{fontSize:'11px',color:'#6c7086',letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:700}}>
          {title ?? 'LANGSMITH TRACE — CLICK ANY SPAN'}
        </span>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 200px 70px',
        padding: '6px 14px',
        borderBottom: '1px solid #1e1e2e',
        fontSize: '10px',
        color: '#45475a',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        <span>SPAN</span>
        <span>TIMELINE</span>
        <span style={{textAlign:'right'}}>DURATION</span>
      </div>

      {/* Span rows */}
      {spans.map((span) => {
        const isSelected = selectedSpan === span.id;
        const barWidth = Math.max(2, (span.duration / maxDuration) * 100);
        return (
          <div
            key={span.id}
            onClick={() => setSelectedSpan(isSelected ? null : span.id)}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 200px 70px',
              alignItems: 'center',
              padding: '7px 14px',
              cursor: 'pointer',
              borderLeft: isSelected ? `2px solid ${span.color}` : '2px solid transparent',
              background: isSelected ? `${span.color}0d` : 'transparent',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#181825'; }}
            onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
          >
            {/* Name */}
            <div style={{
              paddingLeft: `${span.depth * 16}px`,
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
            }}>
              {span.depth > 0 && (
                <span style={{color:'#313244',fontSize:'11px',userSelect:'none'}}>{'└'}</span>
              )}
              <span style={{
                width: '7px',
                height: '7px',
                background: span.color,
                flexShrink: 0,
                display: 'inline-block',
              }}/>
              <span style={{
                fontSize: '12px',
                color: isSelected ? span.color : '#cdd6f4',
                fontWeight: span.depth === 0 ? 700 : 400,
              }}>{span.name}</span>
            </div>

            {/* Bar — sharp corners, profiler aesthetic */}
            <div style={{
              height: '10px',
              background: '#1e1e2e',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${barWidth}%`,
                background: span.color,
                opacity: isSelected ? 1 : 0.65,
                transition: 'opacity 0.15s, width 0.3s',
              }}/>
            </div>

            {/* Duration */}
            <div style={{
              textAlign: 'right',
              fontSize: '11px',
              color: isSelected ? span.color : '#6c7086',
              fontWeight: isSelected ? 700 : 400,
            }}>{span.duration}ms</div>
          </div>
        );
      })}

      {/* Detail panel */}
      {selected && (
        <div style={{
          borderTop: `1px solid ${selected.color}33`,
          background: '#181825',
          padding: '14px',
          animation: 'traceDetailOpen 0.18s ease',
        }}>
          <style>{`
            @keyframes traceDetailOpen {
              from { opacity: 0; transform: translateY(-4px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @media (prefers-reduced-motion: reduce) {
              @keyframes traceDetailOpen { from { opacity:1; } }
            }
          `}</style>
          <div style={{
            fontSize: '10px',
            color: selected.color,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '10px',
            fontWeight: 700,
          }}>{selected.name} — span detail</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '8px',
            marginBottom: '10px',
          }}>
            {[
              { label: 'duration', value: `${selected.duration}ms` },
              { label: 'input_tokens', value: selected.inputTokens != null ? String(selected.inputTokens) : '—' },
              { label: 'output_tokens', value: selected.outputTokens != null ? String(selected.outputTokens) : '—' },
              { label: 'cost_usd', value: selected.cost != null ? `$${selected.cost.toFixed(5)}` : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: '#0d0d0f',
                border: '1px solid #1e1e2e',
                borderRadius: '4px',
                padding: '8px 10px',
              }}>
                <div style={{fontSize:'9px',color:'#45475a',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'3px'}}>{label}</div>
                <div style={{fontSize:'13px',color:'#cdd6f4',fontWeight:700}}>{value}</div>
              </div>
            ))}
          </div>
          {selected.outputPreview && (
            <div>
              <div style={{fontSize:'9px',color:'#45475a',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'5px'}}>OUTPUT PREVIEW</div>
              <div style={{
                background: '#0d0d0f',
                border: '1px solid #1e1e2e',
                borderRadius: '4px',
                padding: '8px 10px',
                fontSize: '11px',
                color: '#a6e3a1',
                wordBreak: 'break-all',
              }}>{selected.outputPreview}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── VIZ: RAG Pipeline Trace Tree ──────────────────────────────────────────────
const RAG_SPANS: TraceSpan[] = [
  {
    id: 'root',
    name: 'rag_pipeline',
    duration: 890,
    tokens: null,
    cost: null,
    depth: 0,
    color: '#45475a',
    outputPreview: 'RAG pipeline completed. Retrieved 8 chunks, reranked to top-3.',
  },
  {
    id: 'embed',
    name: 'embed_query',
    duration: 45,
    tokens: 12,
    cost: 0.000005,
    depth: 1,
    color: '#89b4fa',
    inputTokens: 12,
    outputTokens: 0,
    outputPreview: '[0.0234, -0.1892, 0.4421, ...] (1536-dim vector)',
  },
  {
    id: 'retrieve',
    name: 'vector_search',
    duration: 38,
    tokens: null,
    cost: null,
    depth: 1,
    color: '#f9e2af',
    outputPreview: '8 chunks retrieved. Top similarity: 0.921 ("2BHK in Bandra...")',
  },
  {
    id: 'rerank',
    name: 'cross_encoder_rerank',
    duration: 210,
    tokens: null,
    cost: null,
    depth: 1,
    color: '#fab387',
    outputPreview: 'Reranked 8→3 chunks. Removed 5 below threshold 0.65.',
  },
  {
    id: 'generate',
    name: 'llm_generate',
    duration: 580,
    tokens: 1240,
    cost: 0.00124,
    depth: 1,
    color: '#94e2d5',
    inputTokens: 640,
    outputTokens: 600,
    outputPreview: '"Based on your search, here are 3 verified listings in Bandra..."',
  },
];

// ── VIZ: Bad Trace Inspector ──────────────────────────────────────────────────
const BAD_SPANS: TraceSpan[] = [
  {
    id: 'root',
    name: 'pipeline_invoke',
    duration: 398,
    tokens: null,
    cost: null,
    depth: 0,
    color: '#45475a',
    outputPreview: 'Pipeline completed with degraded quality. faithfulness=0.21',
  },
  {
    id: 'safety',
    name: 'safety_node',
    duration: 2,
    tokens: 45,
    cost: 0.00001,
    depth: 1,
    color: '#a6e3a1',
    inputTokens: 32,
    outputTokens: 13,
    outputPreview: '{"safe": true, "flags": []}',
  },
  {
    id: 'classify',
    name: 'classify_node',
    duration: 189,
    tokens: 234,
    cost: 0.00023,
    depth: 1,
    color: '#f38ba8',
    inputTokens: 156,
    outputTokens: 78,
    outputPreview: '{"intent": "property_search", "confidence": 0.51}  ← below threshold',
  },
  {
    id: 'respond',
    name: 'respond_node',
    duration: 193,
    tokens: 892,
    cost: 0.00089,
    depth: 1,
    color: '#cba6f7',
    inputTokens: 412,
    outputTokens: 480,
    outputPreview: '"Here are some properties in Andheri..." (hallucinated — no filters extracted)',
  },
  {
    id: 'llm',
    name: 'llm_call',
    duration: 178,
    tokens: 678,
    cost: 0.00068,
    depth: 2,
    color: '#94e2d5',
    inputTokens: 290,
    outputTokens: 388,
    outputPreview: 'Prompt received empty search context. Generated plausible-sounding but ungrounded listings.',
  },
];

function BadTraceInspector() {
  const [selectedSpan, setSelectedSpan] = useState<string | null>('classify');
  const [showFix, setShowFix] = useState(false);
  const selected = BAD_SPANS.find(s => s.id === selectedSpan) ?? null;
  const maxDuration = 398;

  const fixCode = `# Confidence threshold gate in classify_node
async def classify_node(state: BotState) -> dict:
    result = await classifier.classify(state["message"])

    if result["confidence"] < 0.70:
        # Don't guess — route to clarification
        await langsmith_client.create_feedback(
            run_id=get_current_run_id(),
            key="low_confidence",
            score=result["confidence"],
            comment="Routed to clarification — below 0.70 threshold",
        )
        return {
            "intent": "clarification_needed",
            "confidence": result["confidence"],
            "original_intent": result["intent"],
        }

    return result`;

  return (
    <div style={{
      background: '#0d0d0f',
      border: '1px solid #1e1e2e',
      borderRadius: '6px',
      overflow: 'hidden',
      margin: '20px 0',
      fontFamily: 'monospace',
    }}>
      {/* Header */}
      <div style={{
        background: '#2a1520',
        borderBottom: '1px solid #f38ba833',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{display:'flex',gap:'6px'}}>
          <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'#f38ba8',opacity:0.9}}/>
          <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'#f9e2af',opacity:0.4}}/>
          <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'#a6e3a1',opacity:0.4}}/>
        </div>
        <span style={{fontSize:'11px',color:'#f38ba8',letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:700}}>
          BAD TRACE — confidence: 0.51 — misclassification detected
        </span>
      </div>

      {/* Two-panel layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0',
        borderBottom: '1px solid #1e1e2e',
      }}>
        {/* Left: Trace Tree */}
        <div style={{borderRight:'1px solid #1e1e2e'}}>
          <div style={{
            padding: '8px 14px',
            borderBottom: '1px solid #1e1e2e',
            fontSize: '10px',
            color: '#45475a',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            display: 'grid',
            gridTemplateColumns: '1fr 100px 60px',
          }}>
            <span>TRACE TREE</span>
            <span>TIMELINE</span>
            <span style={{textAlign:'right'}}>DUR</span>
          </div>
          {BAD_SPANS.map((span) => {
            const isSelected = selectedSpan === span.id;
            const isWarning = span.id === 'classify';
            const barWidth = Math.max(2, (span.duration / maxDuration) * 100);
            return (
              <div
                key={span.id}
                onClick={() => setSelectedSpan(isSelected ? null : span.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 60px',
                  alignItems: 'center',
                  padding: '6px 14px',
                  cursor: 'pointer',
                  borderLeft: isWarning
                    ? '2px solid #f38ba8'
                    : isSelected
                    ? `2px solid ${span.color}`
                    : '2px solid transparent',
                  background: isWarning
                    ? '#f38ba808'
                    : isSelected
                    ? `${span.color}0d`
                    : 'transparent',
                }}
              >
                <div style={{
                  paddingLeft: `${span.depth * 14}px`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  {span.depth > 0 && (
                    <span style={{color:'#313244',fontSize:'10px'}}>{'└'}</span>
                  )}
                  <span style={{
                    width:'6px',height:'6px',
                    background: span.color,
                    flexShrink: 0,
                    display:'inline-block',
                  }}/>
                  <span style={{
                    fontSize:'11px',
                    color: isWarning ? '#f38ba8' : '#cdd6f4',
                    fontWeight: isWarning ? 700 : 400,
                  }}>{span.name}</span>
                </div>
                <div style={{height:'8px',background:'#1e1e2e',position:'relative',overflow:'hidden'}}>
                  <div style={{
                    position:'absolute',left:0,top:0,height:'100%',
                    width:`${barWidth}%`,
                    background: span.color,
                    opacity: isWarning ? 1 : 0.55,
                  }}/>
                </div>
                <div style={{textAlign:'right',fontSize:'10px',color: isWarning ? '#f38ba8' : '#45475a'}}>{span.duration}ms</div>
              </div>
            );
          })}
          {/* Warning badge */}
          <div style={{
            margin:'10px 14px',
            padding:'8px 10px',
            background:'#f38ba811',
            border:'1px solid #f38ba833',
            borderRadius:'4px',
            fontSize:'10px',
            color:'#f38ba8',
            fontWeight:700,
          }}>
            classify_node: confidence 0.51 — below 0.70 threshold
          </div>
        </div>

        {/* Right: Downstream Impact */}
        <div>
          <div style={{
            padding:'8px 14px',
            borderBottom:'1px solid #1e1e2e',
            fontSize:'10px',
            color:'#45475a',
            letterSpacing:'0.1em',
            textTransform:'uppercase',
          }}>DOWNSTREAM IMPACT</div>
          <div style={{padding:'14px',display:'flex',flexDirection:'column',gap:'10px'}}>
            {[
              {
                node: 'classify_node',
                color: '#f38ba8',
                issue: 'Confidence 0.51 on property_search. Classifier split nearly 50/50 between property_search and general_qa. Ambiguous query: "show me something in Andheri".',
              },
              {
                node: 'respond_node',
                color: '#cba6f7',
                issue: 'Received property_search intent but filters={} — no criteria extracted. Sent empty search context to LLM.',
              },
              {
                node: 'llm_call',
                color: '#94e2d5',
                issue: 'Prompt contained no real retrieval context. Model generated plausible-sounding but fabricated listings.',
              },
              {
                node: 'faithfulness_evaluator',
                color: '#f9e2af',
                issue: 'Score: 0.21 — very low. Generated claims have no grounding in retrieved documents.',
              },
            ].map(({ node, color, issue }) => (
              <div key={node} style={{
                background:'#0d0d0f',
                border:'1px solid #1e1e2e',
                borderRadius:'4px',
                padding:'8px 10px',
              }}>
                <div style={{fontSize:'10px',color,fontWeight:700,marginBottom:'4px'}}>{node}</div>
                <div style={{fontSize:'10px',color:'#6c7086',lineHeight:'1.5'}}>{issue}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail panel for selected span */}
      {selected && (
        <div style={{
          borderBottom:'1px solid #1e1e2e',
          background:'#181825',
          padding:'12px 14px',
        }}>
          <div style={{fontSize:'9px',color:'#45475a',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'6px'}}>
            {selected.name} — output
          </div>
          <div style={{fontSize:'11px',color: selected.id === 'classify' ? '#f38ba8' : '#a6e3a1'}}>
            {selected.outputPreview}
          </div>
        </div>
      )}

      {/* Show Fix button */}
      <div style={{padding:'14px'}}>
        <button
          onClick={() => setShowFix(v => !v)}
          style={{
            background: showFix ? '#a6e3a122' : '#1e1e2e',
            color: showFix ? '#a6e3a1' : '#cdd6f4',
            border: `1px solid ${showFix ? '#a6e3a1' : '#313244'}`,
            borderRadius: '4px',
            padding: '7px 18px',
            fontSize: '11px',
            fontFamily: 'monospace',
            cursor: 'pointer',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            transition: 'all 0.15s',
          }}
        >
          {showFix ? '▲ Hide Fix' : '▼ Show Fix'}
        </button>

        {showFix && (
          <div style={{marginTop:'14px',animation:'traceDetailOpen 0.18s ease'}}>
            <div style={{
              fontSize:'10px',
              color:'#a6e3a1',
              letterSpacing:'0.1em',
              textTransform:'uppercase',
              marginBottom:'8px',
              fontWeight:700,
            }}>CORRECTED ROUTING LOGIC</div>
            <div style={{
              background:'#0d0d0f',
              border:'1px solid #a6e3a133',
              borderRadius:'4px',
              padding:'12px',
              fontSize:'11px',
              color:'#cdd6f4',
              lineHeight:'1.7',
              whiteSpace:'pre',
              overflowX:'auto',
            }}>{fixCode}</div>
            <div style={{
              marginTop:'10px',
              padding:'8px 10px',
              background:'#a6e3a111',
              border:'1px solid #a6e3a133',
              borderRadius:'4px',
              fontSize:'10px',
              color:'#a6e3a1',
            }}>
              Result: ambiguous traces route to clarification. LangSmith receives a low_confidence feedback event. Annotators review in the annotation queue. Dataset expands. CI gate improves on next deploy.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── VIZ 5: Experiment Comparison Bar Chart ────────────────────────────────────
function ExperimentCompareViz() {
  const metrics = [
    { name: 'faithfulness',       a: 0.82, b: 0.88 },
    { name: 'context_precision',  a: 0.74, b: 0.81 },
    { name: 'answer_relevancy',   a: 0.85, b: 0.83 },
  ];

  const [hovered, setHovered] = useState<string|null>(null);

  const BAR_H = 18;
  const TRACK_W = 160;
  const COL_X = { label: 10, barA: 145, barB: 315, delta: 485 };
  const ROW_H = 52;
  const SCALE = (v: number) => v * TRACK_W;

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>
        LANGSMITH EXPERIMENTS — COMPARE PROMPT VERSIONS WITH STATISTICAL RIGOR
      </div>
      <svg viewBox="0 0 560 200" width="100%" aria-label="Experiment comparison bar chart" style={{display:'block',margin:'0 auto'}}>
        {/* Legend */}
        <rect x={COL_X.barA} y={4} width={14} height={10} rx="2" fill="#89b4fa"/>
        <text x={COL_X.barA + 18} y={13} fontSize="11" fill="#89b4fa">Run A (baseline)</text>
        <rect x={COL_X.barB} y={4} width={14} height={10} rx="2" fill="#a6e3a1"/>
        <text x={COL_X.barB + 18} y={13} fontSize="11" fill="#a6e3a1">Run B (new prompt)</text>
        <text x={COL_X.delta} y={13} fontSize="11" fill="#6c7086">Delta</text>

        {metrics.map((m, i) => {
          const y = 28 + i * ROW_H;
          const delta = ((m.b - m.a) / m.a * 100);
          const improved = delta >= 0;
          const deltaColor = improved ? '#a6e3a1' : '#f38ba8';
          const isHov = hovered === m.name;
          return (
            <g key={m.name}
              onMouseEnter={() => setHovered(m.name)}
              onMouseLeave={() => setHovered(null)}
              style={{cursor:'default'}}>
              {isHov && <rect x="0" y={y-4} width="560" height={ROW_H} rx="4" fill="#313244" opacity="0.5"/>}
              <text x={COL_X.label} y={y + 14} fontSize="11" fill="#cdd6f4" fontFamily="monospace">{m.name}</text>
              <rect x={COL_X.barA} y={y + 20} width={TRACK_W} height={BAR_H} rx="3" fill="#252535"/>
              <rect x={COL_X.barA} y={y + 20} width={SCALE(m.a)} height={BAR_H} rx="3" fill="#89b4fa88"/>
              <text x={COL_X.barA + SCALE(m.a) + 4} y={y + 33} fontSize="10" fill="#89b4fa">{m.a.toFixed(2)}</text>
              <rect x={COL_X.barB} y={y + 20} width={TRACK_W} height={BAR_H} rx="3" fill="#252535"/>
              <rect x={COL_X.barB} y={y + 20} width={SCALE(m.b)} height={BAR_H} rx="3" fill="#a6e3a188"/>
              <text x={COL_X.barB + SCALE(m.b) + 4} y={y + 33} fontSize="10" fill="#a6e3a1">{m.b.toFixed(2)}</text>
              <text x={COL_X.delta} y={y + 33} fontSize="12" fill={deltaColor} fontWeight="700">
                {improved ? '+' : ''}{delta.toFixed(1)}%
              </text>
            </g>
          );
        })}
        <text x="10" y="192" fontSize="10" fill="#6c7086">Hover rows to highlight. Green = improvement, Red = regression.</text>
      </svg>
    </div>
  );
}

// ── VIZ 6: Annotation Queue Workflow ─────────────────────────────────────────
function AnnotationQueueViz() {
  const steps = [
    { label: 'Low-confidence\ntraces (< 0.70)', color: '#f38ba8', x: 10 },
    { label: 'Annotation\nQueue', color: '#f9e2af', x: 140 },
    { label: 'Human\nReview', color: '#89b4fa', x: 270 },
    { label: 'Dataset\nExpansion', color: '#a6e3a1', x: 400 },
  ];

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <style>{`@keyframes dashFlowAnno{to{stroke-dashoffset:-14}}`}</style>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>
        ANNOTATION QUEUE — ACTIVE LEARNING FROM PRODUCTION FAILURES
      </div>
      <svg viewBox="0 0 560 180" width="100%" aria-label="Annotation queue workflow" style={{display:'block',margin:'0 auto'}}>
        <defs>
          <marker id="anno-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#6c7086"/>
          </marker>
          <marker id="anno-arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#a6e3a1"/>
          </marker>
        </defs>

        {steps.map((s) => {
          const lines = s.label.split('\n');
          return (
            <g key={s.label}>
              <rect x={s.x} y={20} width={118} height={54} rx="6"
                fill={s.color + '18'} stroke={s.color + '88'} strokeWidth="1.5"/>
              {lines.map((line, li) => (
                <text key={li} x={s.x + 59} y={41 + li * 16}
                  fontSize="11" fill={s.color} textAnchor="middle" fontWeight="600">{line}</text>
              ))}
            </g>
          );
        })}

        {steps.slice(0, -1).map((s, i) => (
          <line key={i}
            x1={s.x + 118} y1={47} x2={steps[i+1].x - 2} y2={47}
            stroke="#6c7086" strokeWidth="1.5"
            strokeDasharray="4 3"
            style={{animation:'dashFlowAnno 1s linear infinite'}}
            markerEnd="url(#anno-arrow)"
          />
        ))}

        <rect x={130} y={108} width={300} height={40} rx="6"
          fill="#cba6f7" opacity="0.12" stroke="#cba6f788" strokeWidth="1.5"/>
        <text x={280} y={124} fontSize="11" fill="#cba6f7" textAnchor="middle" fontWeight="600">CI Pipeline — run experiments on expanded dataset</text>
        <text x={280} y={140} fontSize="10" fill="#6c7086" textAnchor="middle">Each deploy improves the next one</text>

        <line x1={459} y1={74} x2={430} y2={108}
          stroke="#a6e3a1" strokeWidth="1.5"
          strokeDasharray="4 3"
          style={{animation:'dashFlowAnno 1s linear infinite'}}
          markerEnd="url(#anno-arrow-green)"
        />

        <path d="M 130,128 Q 60,128 60,74 Q 60,47 10,47"
          stroke="#cba6f7" strokeWidth="1.5" fill="none"
          strokeDasharray="4 3"
          style={{animation:'dashFlowAnno 1s linear infinite'}}
        />
        <polygon points="10,43 10,51 2,47" fill="#cba6f7"/>

        <text x={280} y={170} fontSize="10" fill="#6c7086" textAnchor="middle">
          Auto-route on confidence &lt; 0.70 → Human labels → Dataset → CI gate
        </text>
      </svg>
    </div>
  );
}

export function Mod25() {
  const code252 = `from langsmith import traceable

@traceable(
    name="classify_node",
    tags=["production", "v2.3"],
    metadata={"session_id": state["session_id"], "model": "claude-haiku-4-5-20251001"},
)
async def classify_node(state: BotState) -> dict:
    ...`;

  const code253 = `from langsmith import Client
client = Client()

dataset = client.create_dataset("property-intent-v1")
client.create_examples(
    inputs=[
        {"normalized_message": "2BHK in Bandra under 2Cr"},
        {"normalized_message": "contact the builder"},
    ],
    outputs=[
        {"intent": "property_search", "confidence": 1.0},
        {"intent": "contact_seller",  "confidence": 1.0},
    ],
    dataset_id=dataset.id,
)`;

  const code254 = `from langsmith.evaluation import evaluate, LangChainStringEvaluator

# Custom: exact match for classification
def intent_match(run, example):
    predicted = run.outputs.get("intent")
    expected  = example.outputs.get("intent")
    return {"key": "intent_match", "score": 1 if predicted == expected else 0}

results = evaluate(
    lambda inputs: classify_chain.invoke(inputs),
    data="property-intent-v1",
    evaluators=[intent_match],
    experiment_prefix="haiku-v2.3",
)
# {"intent_match": 0.94}
# CI gate: block deploy if intent_match < 0.90`;

  const code255 = `# Run same dataset through two prompt versions — LangSmith shows side-by-side diff
results_v1 = evaluate(lambda x: chain_v1.invoke(x), data=dataset_name, experiment_prefix="v1")
results_v2 = evaluate(lambda x: chain_v2.invoke(x), data=dataset_name, experiment_prefix="v2")`;

  const code256 = `# Tag traces to make them sampable
@traceable(tags=["production"], project_name="housing-chatbot-prod")
async def pipeline_handler(message: str, session_id: str):
    ...
# Configure in LangSmith UI: sample 10% of traces, run faithfulness evaluator,
# alert if rolling 1h avg_faithfulness < 0.5
# NOTE: RAGAS faithfulness is a 0–1 score (not 0–5). Threshold 3.5 would never fire.`;

  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Navigate LangSmith traces and identify which node or LLM call caused a failure</li>
          <li>Build a golden dataset from production traces using the annotation queue</li>
          <li>Run prompt experiments comparing two variants with statistical validity</li>
          <li>Set up online monitoring rules that alert before users notice quality drops</li>
          <li>Choose between @traceable, LangChain auto-tracing, and manual SDK calls</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~60 minutes</span>
          <span className="obj-diff">Difficulty: ★★★☆☆</span>
          <span className="obj-diff">Prerequisites: Module 13, Module 14</span>
        </div>
      </div>

      <div className="callout callout-info">
        <strong>Housing.com Context</strong><br />
        Housing.com uses LangSmith today via <code>@traceable</code> decorators on all tool-call nodes. This module covers the full platform — datasets, annotation queues, experiments, and online monitoring — that Housing.com's current setup only partially uses.
      </div>

      <InteractiveTraceTree
        spans={RAG_SPANS}
        maxDuration={890}
        title="LANGSMITH TRACE: RAG PIPELINE — CLICK ANY SPAN"
      />

      <h2>25.1 What LangSmith Provides</h2>
      <div className="callout callout-info"><strong>Pricing and free tier (as of 2025)</strong>
        Developer plan: <strong>5,000 traces/month free</strong>, then $0.005/trace. Each <code>@traceable</code> function call = 1 trace. A 19-node pipeline with 2 LLM calls = 1 parent trace with ~21 child spans (spans are free — you pay per root trace only).
        <br /><br />
        <strong>Estimate for your workload:</strong> 10K daily users × 1 trace/user × 30 days = 300K traces/month ≈ <strong>~$1,475/month</strong> if you trace everything. Production strategy: sample 10% of traces normally + always trace on error → ~35K traces/month ≈ <strong>$150/month</strong>.
        <br /><br />
        <strong>Disable in test/CI</strong> to avoid running up usage:
        <pre style={{fontSize: "11px", background: "#1e1e2e", color: "#cdd6f4", padding: "4px", borderRadius: "4px"}}>LANGCHAIN_TRACING_V2=false  # in .env.test or CI environment</pre>
      </div>
      <table>
        <tr><th>Capability</th><th>What it does</th><th>When you need it</th></tr>
        <tr><td><strong>Traces</strong></td><td>Records every LLM call, tool call, and chain step with inputs/outputs/latency/cost</td><td>Always — this is your debugging interface</td></tr>
        <tr><td><strong>Datasets</strong></td><td>Stores (input, expected_output) pairs for repeatable evaluation</td><td>Once you have 20+ production examples</td></tr>
        <tr><td><strong>Experiments</strong></td><td>Runs your chain against a dataset, compares variants side-by-side</td><td>Before every prompt or model change</td></tr>
        <tr><td><strong>Online monitoring</strong></td><td>Samples production traces, runs evaluators, triggers alerts</td><td>When serving real users</td></tr>
      </table>

      <h2>25.2 Tracing Deep Dive</h2>
      <p>Every trace is a tree of spans. Understanding the tree is the key to debugging.</p>
      <InteractiveTraceTree
        spans={PIPELINE_SPANS}
        maxDuration={412}
        title="LANGSMITH TRACE: PIPELINE INVOKE — CLICK ANY SPAN"
      />
      <LangSmithDebugViz />
      <CodeBlock title="@traceable Decorator — Tags, Metadata, and Session Correlation" language="python" keyLine={3} keyNote="metadata binds trace to session_id — enables cross-system correlation">{code252}</CodeBlock>
      <p>Tags enable filtering ("show me all v2.3 traces"). Metadata enables correlation with your own logs. Without these, debugging production failures requires cross-referencing multiple systems.</p>

      <AnnotationQueueViz />

      <h2>25.3 Datasets and Annotation Queues</h2>
      <CodeBlock title="LangSmith Dataset — Building Golden Examples from Production" language="python" keyLine={5} keyNote="create_examples bulk-uploads labelled (input, output) pairs to dataset">{code253}</CodeBlock>
      <div className="callout callout-tip">
        <strong>The annotation queue workflow</strong>
        Low-confidence predictions (<code>confidence &lt; 0.70</code>) are sent to the annotation queue automatically. Annotators review and correct labels in the LangSmith UI. Approved examples flow into the dataset. CI experiments run against the expanded dataset on next deploy. This is the evaluation flywheel from Module 14.5, now with tooling.
      </div>

      <h2>25.4 Evaluators — Automated Quality Gates</h2>
      <CodeBlock title="Automated Evaluator — Intent Match Quality Gate for CI" language="python" keyLine={11} keyNote="CI gate: block deploy if intent_match drops below 0.90">{code254}</CodeBlock>

      <ExperimentCompareViz />

      <h2>25.5 Experiments — Comparing Variants</h2>
      <CodeBlock title="A/B Experiment — Side-by-Side Prompt Variant Comparison" language="python" keyLine={2} keyNote="experiment_prefix labels each run for side-by-side UI comparison">{code255}</CodeBlock>
      <div className="callout callout-warn">
        <strong>Before running an experiment</strong>
        Define the primary metric before looking at results (prevents p-hacking). Minimum dataset size: 50 examples for ±5% accuracy confidence. Run the baseline first — you need a number to beat.
      </div>

      <h2>25.6 Online Monitoring</h2>
      <p>Online monitoring samples production traces and runs evaluators asynchronously — users see zero latency impact.</p>
      <CodeBlock title="Online Monitoring — Production Sampling with Faithfulness Alert" language="python" keyLine={2} keyNote="production tag enables sampling rule in LangSmith UI — zero user latency">{code256}</CodeBlock>
      <p><strong>What to monitor:</strong> faithfulness score (rolling 1h avg), <code>flag_for_review</code> rate (spike = prompt regression), latency by node (sudden increase = provider issue), token usage per turn (increase = prompt bloat).</p>

      <h2>25.7 @traceable vs Auto-Tracing vs Manual SDK</h2>
      <table>
        <tr><th>Approach</th><th>When to use</th><th>Code changes</th></tr>
        <tr><td><code>@traceable</code> decorator</td><td>Custom functions outside LangChain — your nodes, tools, DB calls</td><td>Add decorator</td></tr>
        <tr><td>LangChain auto-tracing</td><td>Any LangChain/LangGraph chain — set <code>LANGCHAIN_TRACING_V2=true</code></td><td>Zero</td></tr>
        <tr><td>Manual <code>Client().create_run()</code></td><td>Full control over span structure or non-Python</td><td>Significant</td></tr>
      </table>

      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection</strong>
        "How do you know when your LLM system's quality degrades in production?" → Online monitoring: sample 10% of traffic, run LLM-as-judge async, alert on rolling faithfulness drop. Then describe the annotation queue as the feedback loop: flagged traces → human review → dataset expansion → CI experiment → deploy.
      </div>

      <h2>25.8 Reading a Bad Trace — Worked Example</h2>
      <p>Knowing how to read a trace is the skill. Here is a real failure pattern to recognize:</p>
      <BadTraceInspector />
      <p><strong>How to identify it in the trace:</strong> Filter your LangSmith trace list by <code>confidence &lt; 0.70</code>. Look at the <code>classify_node</code> output field. A confidence of 0.51 on <code>property_search</code> means the classifier was nearly split between <code>property_search</code> (51%) and <code>general</code> (49%) — the message "show me something in Andheri" is genuinely ambiguous (it could mean "show me a property listing" or "show me something interesting in Andheri").</p>
      <p><strong>Downstream quality degradation:</strong> With no filter criteria extracted, <code>build_prompt_node</code> sends an empty search context to the LLM. The LLM, given nothing to retrieve, generates plausible-sounding but completely fabricated property details. RAGAS faithfulness drops below 0.3.</p>
      <p><strong>Two fixes — choose based on root cause:</strong></p>
      <ol>
        <li><strong>Confidence threshold gate</strong> (fast): in <code>classify_node</code>, if <code>confidence &lt; 0.70</code>, route to a clarification prompt: <em>"Could you tell me more about what you're looking for?"</em> This is correct UX — don't guess at ambiguous intent.</li>
        <li><strong>Retrain the classifier</strong> (thorough): collect all traces where confidence was 0.50–0.70 and the user's next message clarified intent. Label them and add to the golden dataset. CI experiment on next deploy. This closes the gap permanently.</li>
      </ol>

      <QuizSection moduleId={27} title="Module 27: LangSmith Platform" contentHint="LangSmith four capabilities traces datasets experiments monitoring, @traceable decorator metadata tags, annotation queue workflow for building golden datasets, evaluate function with custom evaluator, online monitoring sampling strategy, experiment statistical significance minimum sample size, reading bad traces confidence threshold gate 0.51 confidence ambiguous routing annotation queue" />
    </>
  );
}
