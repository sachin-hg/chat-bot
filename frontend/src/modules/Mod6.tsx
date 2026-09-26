import { useState } from "react";
import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from '../components/CodeBlock';

const CODE_STRUCTURED_LOGGING = `log = get_logger(__name__)

# Bad — unstructured, unsearchable
log.info(f"Classifying message: {message}")

# Good — structured, queryable, filterable
log.info("slm_classification",
         domain=domain,
         main_intent=result.get("main_intent"),
         latency_ms=latency_ms,
         model=model_id)`;

const CODE_QUERY_LOGS = `# Query logs in production
jq 'select(.event=="slm_classification" and .latency_ms > 500)' app.log
make logs-pipeline  # filter for pipeline events only`;

const CODE_TRACEABLE = `@_traceable(run_type="llm", name="intent_classifier")
async def _call_api(self, model_id, system_prompt, user_content) -> dict:
    response = await client.messages.create(...)
    return result`;

const CODE_FIND_SESSION = `make logs-pipeline | jq 'select(.event=="session_loaded")' | tail -20
# → {"event":"session_loaded","session_id":"sess_abc","request_id":"req_xyz",...}`;

const CODE_LANGSMITH_TRACE = `// LangSmith trace output
{
  "inputs": {"message": "show me 2BHK near the sea in Bandra under 2Cr"},
  "outputs": {"domain": "property_search", "confidence": 0.42, "coerced_to": "out_of_scope"},
  "latency_ms": 98
}`;

const CODE_FEW_SHOT_FIX = `# prompts/slm/domains/domain_router.md
### geographic modifier (sea/mountain/lake/highway)
Input: "show me 2BHK near the sea in Bandra"
Output: {domain: "property_search", confidence: 0.91}
# "near the sea" = amenity/proximity, not a competing domain`;

const CODE_RERUN_EVAL = `pytest tests/model_eval -k "geographic" -v
# 8/8 passed (was 5/8) ✓`;

const CODE_FAIRNESS_SEGMENT = `import structlog
from collections import defaultdict

# In your evaluation pipeline or LangSmith callback:
def compute_per_segment_precision(eval_results: list[dict]) -> dict:
    """
    eval_results: list of {segment: str, correct: bool}
    segment = coarse proxy: "tier1" | "tier2" | "tier3" | "en" | "hi" | ...
    """
    buckets: dict[str, list[bool]] = defaultdict(list)
    for r in eval_results:
        buckets[r["segment"]].append(r["correct"])

    overall = sum(r["correct"] for r in eval_results) / len(eval_results)
    per_segment = {
        seg: sum(vals) / len(vals)
        for seg, vals in buckets.items()
    }

    # Alert: any segment that drops >15 percentage points below overall
    alerts = [
        f"Segment '{seg}' precision {p:.1%} (overall {overall:.1%}, gap {overall-p:.1%})"
        for seg, p in per_segment.items()
        if overall - p > 0.15
    ]
    if alerts:
        structlog.get_logger().warning("fairness_drift_detected", alerts=alerts)

    return {"overall": overall, "per_segment": per_segment, "alerts": alerts}`;

function StructuredLogViz() {
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <style>{`
        @keyframes dashFlow6a { to { stroke-dashoffset: -14; } }
        .dash-anim-6a { animation: dashFlow6a 1s linear infinite; }
      `}</style>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>STRUCTURED LOGGING — FROM STRINGS TO QUERYABLE JSON EVENTS</div>
      <svg viewBox="0 0 560 180" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Comparison of unstructured string logging versus structured JSON logging">
        {/* Left — Unstructured */}
        <rect x="10" y="10" width="255" height="24" rx="4" fill="#f38ba811" stroke="#f38ba8" strokeWidth="1"/>
        <text x="20" y="27" fontSize="11" fontWeight="700" fill="#f38ba8">Unstructured ✗</text>

        {['Classifying message from user123:', 'show me 2BHK near sea', 'Classification done in 87ms', 'Error: model timeout'].map((line, i) => (
          <g key={i}>
            <rect x="10" y={40 + i * 22} width="255" height="19" rx="3" fill="#1e1e2e" stroke="#45475a" strokeWidth="0.5"/>
            <text x="18" y={54 + i * 22} fontSize="9.5" fill="#6c7086" fontFamily="monospace">{line}</text>
          </g>
        ))}

        <text x="15" y="138" fontSize="10" fill="#f38ba8">✗ hard to grep</text>
        <text x="15" y="152" fontSize="10" fill="#f38ba8">✗ can't aggregate</text>
        <text x="15" y="166" fontSize="10" fill="#f38ba8">✗ no machine-readable fields</text>

        {/* Divider */}
        <line x1="278" y1="10" x2="278" y2="170" stroke="#45475a" strokeWidth="1" strokeDasharray="4 3"/>

        {/* Right — Structured */}
        <rect x="290" y="10" width="255" height="24" rx="4" fill="#a6e3a111" stroke="#a6e3a1" strokeWidth="1"/>
        <text x="300" y="27" fontSize="11" fontWeight="700" fill="#a6e3a1">Structured JSON ✓</text>

        <rect x="290" y="40" width="255" height="75" rx="4" fill="#1e1e2e" stroke="#313244" strokeWidth="1"/>
        <text x="300" y="57" fontSize="9" fill="#f9e2af" fontFamily="monospace">{"{"}</text>
        <text x="310" y="70" fontSize="9" fill="#89b4fa" fontFamily="monospace">"event": "slm_classification",</text>
        <text x="310" y="82" fontSize="9" fill="#89b4fa" fontFamily="monospace">"user_id": "123",</text>
        <text x="310" y="94" fontSize="9" fill="#a6e3a1" fontFamily="monospace">"latency_ms": 87,</text>
        <text x="310" y="106" fontSize="9" fill="#a6e3a1" fontFamily="monospace">"intent": "property_search",</text>
        <text x="300" y="110" fontSize="9" fill="#f9e2af" fontFamily="monospace">{"}"}</text>

        <text x="295" y="138" fontSize="10" fill="#a6e3a1">✓ filterable by any field</text>
        <text x="295" y="152" fontSize="10" fill="#a6e3a1">✓ aggregatable with jq / Splunk</text>
        <text x="295" y="166" fontSize="10" fill="#a6e3a1">✓ machine-readable, alertable</text>

        {/* jq query at bottom */}
        <rect x="10" y="172" width="535" height="0.5" fill="#313244"/>
      </svg>
      <div style={{background:'#1e1e2e',border:'1px solid #313244',borderRadius:'4px',padding:'8px 12px',marginTop:'8px',fontFamily:'monospace',fontSize:'0.8rem',color:'#a6e3a1'}}>
        <span style={{color:'#6c7086'}}>$ </span>
        jq <span style={{color:'#f9e2af'}}>'select(.event=="slm_classification" and .latency_ms &gt; 500)'</span> app.log
        <span style={{color:'#6c7086',marginLeft:'12px'}}>← works with structured; impossible with strings</span>
      </div>
    </div>
  );
}

function LangSmithDebugViz() {
  const [activeStep, setActiveStep] = useState(2);

  const steps = [
    { n: 1, label: 'Find session', detail: 'grep logs by session_id to locate the failing request' },
    { n: 2, label: 'Open LangSmith', detail: 'Filter traces by session_id=sess_abc in LangSmith UI' },
    { n: 3, label: 'Click span', detail: 'domain_routing span: confidence=0.42 → coerced to out_of_scope' },
    { n: 4, label: 'View prompt', detail: 'Prompt view shows missing few-shot for "near the sea" phrasing' },
    { n: 5, label: 'Fix & Re-test', detail: 'Add 1 example → rerun → 8/8 pass' },
  ];

  const colors = ['#89b4fa','#94e2d5','#f38ba8','#cba6f7','#a6e3a1'];

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <style>{`
        @keyframes dashFlow6b { to { stroke-dashoffset: -14; } }
      `}</style>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>LANGSMITH DEBUGGING — 5 STEPS FROM BUG TO FIX IN 8 MINUTES</div>
      {/* FIX 2: viewBox height increased from 215 to 245 to accommodate taller detail box (height 80) */}
      <svg viewBox="0 0 560 245" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="5-step LangSmith debugging workflow timeline">
        <defs>
          <marker id="arr-6b" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#45475a"/>
          </marker>
        </defs>

        {steps.map((step, i) => {
          const x = 15 + i * 107;
          const isActive = activeStep === i;
          const color = colors[i];
          return (
            <g key={i} style={{cursor:'pointer'}} onClick={() => setActiveStep(i)}>
              {/* Connector arrow */}
              {i > 0 && (
                <line
                  x1={x - 6} y1="55" x2={x - 1} y2="55"
                  stroke="#45475a" strokeWidth="1.5"
                  strokeDasharray={isActive ? "none" : "4 3"}
                  markerEnd="url(#arr-6b)"
                  style={isActive ? {animation:'dashFlow6b 1s linear infinite'} : {}}
                />
              )}
              {/* Step box — sole interaction target */}
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

        {/* Detail box — FIX 2: height increased from 50 to 80 so domain_routing span text fits */}
        <rect x="15" y="100" width="530" height="80" rx="6" fill="#1e1e2e" stroke="#313244" strokeWidth="1"/>
        <text x="25" y="120" fontSize="10" fontWeight="600" fill={colors[activeStep]}>Step {steps[activeStep].n} — {steps[activeStep].label}</text>
        <text x="25" y="140" fontSize="11" fill="#cdd6f4">{steps[activeStep].detail}</text>

        {/* Time label — shifted down to sit below the taller detail box */}
        <rect x="380" y="200" width="165" height="24" rx="4" fill="#a6e3a111" stroke="#a6e3a1" strokeWidth="1"/>
        <text x="463" y="216" textAnchor="middle" fontSize="11" fontWeight="700" fill="#a6e3a1">Total: 8 minutes to fix</text>
      </svg>
      {/* FIX 2: duplicate buttons removed — SVG boxes are the sole interaction target */}
    </div>
  );
}

interface DebugStep {
  title: string;
  prose: string;
  codeBlock?: React.ReactNode;
}

function DebuggingStepList({ steps }: { steps: DebugStep[] }) {
  const [openStep, setOpenStep] = useState<number>(0);

  return (
    <div style={{position:'relative',paddingLeft:'20px',marginTop:'16px'}}>
      {/* Vertical connecting line */}
      <div style={{
        position:'absolute',
        left:'15px',
        top:'16px',
        bottom:'16px',
        width:'2px',
        background:'var(--border, #313244)',
        borderRadius:'1px',
      }}/>
      <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
        {steps.map((step, i) => {
          const isOpen = openStep === i;
          return (
            <div key={i} style={{position:'relative'}}>
              {/* Step header row */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setOpenStep(isOpen ? -1 : i)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpenStep(isOpen ? -1 : i); }}
                style={{
                  display:'flex',
                  alignItems:'center',
                  gap:'12px',
                  cursor:'pointer',
                  userSelect:'none',
                }}
              >
                {/* Circular number badge */}
                <div style={{
                  flexShrink:0,
                  width:'32px',
                  height:'32px',
                  borderRadius:'50%',
                  background:'var(--accent, #89b4fa)',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  fontWeight:700,
                  fontSize:'0.85rem',
                  color:'#1e1e2e',
                  position:'relative',
                  zIndex:1,
                  boxShadow:'0 0 0 3px var(--surface, #181825)',
                }}>
                  {i + 1}
                </div>
                {/* Step title */}
                <span style={{fontWeight:700,fontSize:'0.95rem',color:'var(--text, #cdd6f4)',flex:1}}>
                  {step.title}
                </span>
                {/* Chevron */}
                <span style={{
                  fontSize:'0.75rem',
                  color:'var(--muted, #6c7086)',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition:'transform 0.2s ease',
                  marginRight:'4px',
                }}>
                  ▼
                </span>
              </div>

              {/* Collapsible body */}
              {isOpen && (
                <div style={{
                  marginLeft:'44px',
                  marginTop:'10px',
                  paddingLeft:'16px',
                  borderLeft:'2px solid var(--accent, #89b4fa)',
                  paddingBottom:'4px',
                }}>
                  <p style={{margin:'0 0 10px',color:'var(--text, #cdd6f4)',fontSize:'0.9rem',lineHeight:'1.6'}}>
                    {step.prose}
                  </p>
                  {step.codeBlock}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Mod6() {
  const debugSteps: DebugStep[] = [
    {
      title: 'Find the session in structured logs',
      prose: 'Use make logs-pipeline to stream pipeline events, then jq-filter for session_loaded to locate the exact session_id and request_id for the failing request.',
      codeBlock: <CodeBlock title="Find Failing Session in Logs" language="bash" keyLine={1} keyNote="Filter pipeline logs to locate session_id quickly">{CODE_FIND_SESSION}</CodeBlock>,
    },
    {
      title: 'Open LangSmith, filter by session_id',
      prose: 'Every @traceable call in this codebase injects session_id and request_id as metadata. In LangSmith: Traces → Filter by metadata key session_id=sess_abc.',
      codeBlock: undefined,
    },
    {
      title: 'Find the failing span',
      prose: 'The trace tree shows: chat_endpoint → domain_routing → intent_classifier. Click domain_routing to inspect its inputs and outputs. Confidence=0.42 is below the 0.65 threshold — domain_router returned out_of_scope even though the user clearly wants property_search.',
      codeBlock: <CodeBlock title="LangSmith Trace Output — Low Confidence" language="json" keyLine={3} keyNote="confidence=0.42 below 0.65 threshold triggers out_of_scope">{CODE_LANGSMITH_TRACE}</CodeBlock>,
    },
    {
      title: 'Click "View Prompt"',
      prose: 'See the exact system prompt sent to Stage 1. Find the few-shot examples section — notice there\'s no example covering "near the sea" phrasing. The model hedges because "sea" could be a locality name (Sea Face, Mumbai) or an amenity (sea-view).',
      codeBlock: undefined,
    },
    {
      title: 'Fix: add one few-shot example',
      prose: 'Add a single example to prompts/slm/domains/domain_router.md teaching the model that "near the sea" is a proximity/amenity modifier, not a competing domain.',
      codeBlock: <CodeBlock title="Few-Shot Fix for Geographic Modifier" language="yaml" keyLine={4} keyNote="One example teaches model sea = amenity, not competing domain">{CODE_FEW_SHOT_FIX}</CodeBlock>,
    },
    {
      title: 'Re-run nightly model_eval',
      prose: 'Re-run the geographic test slice to confirm the regression is gone. Time to fix: 8 minutes. Without LangSmith you\'d be adding print statements, re-deploying, and guessing.',
      codeBlock: <CodeBlock title="Re-run Eval After Few-Shot Fix" language="bash" keyLine={2} keyNote="8/8 pass confirms the single example fixed the regression">{CODE_RERUN_EVAL}</CodeBlock>,
    },
  ];

  return (
    <>
      <StructuredLogViz />
      {/* FIX 1: headings renumbered from 5.x to 6.x to match Module 6 / Observability */}
      <h2>§6.1 Structured Logging — Everything Is a JSON Object</h2>
      <CodeBlock title="Structured Logging with structlog" language="python" keyLine={10} keyNote="Named fields make logs filterable and aggregatable">{CODE_STRUCTURED_LOGGING}</CodeBlock>
      <p>Every log entry is a JSON object: <code>event</code>, <code>level</code>, <code>ts</code>, plus named fields for every relevant variable.</p>
      <CodeBlock title="Querying Structured Logs with jq" language="bash" keyLine={2} keyNote="jq filter works on structured JSON, impossible on raw strings">{CODE_QUERY_LOGS}</CodeBlock>

      <h2>§6.2 LangSmith — Every LLM Call Traced</h2>
      <CodeBlock title="LangSmith @traceable Decorator" language="python" keyLine={1} keyNote="Wraps every LLM call in a named trace automatically">{CODE_TRACEABLE}</CodeBlock>
      <p>LangSmith records: exact prompt sent, model output, token usage, cost, latency, errors.</p>
      <LangSmithDebugViz />

      {/* FIX 3: six-step callout extracted to DebuggingStepList component */}
      <h3>§6.2.1 Debugging Walkthrough — From Bug to Fix in 8 Minutes</h3>
      <div className="callout callout-info" style={{paddingBottom:'16px'}}>
        <strong>Bug:</strong> User says "show me 2BHK near the sea in Bandra under 2Cr" — gets an <code>out_of_scope</code> response. How to diagnose and fix in under 10 minutes:
        <DebuggingStepList steps={debugSteps} />
      </div>

      <h2>§6.3 The Playground — Your Development Microscope</h2>
      <p>The playground (<code>/playground</code>) shows every SSE event in real-time:</p>
      <ul>
        <li><strong>Pipeline sidebar</strong> — which nodes ran, order, time taken (click any node for details)</li>
        <li><strong>Per-node detail panels</strong> — SLM reasoning, filter delta, entity refs</li>
        <li><strong>LLM panel</strong> — model used, tokens consumed, cost, stop reason, chunks streamed</li>
        <li><strong>SSE timeline</strong> — every frame the server sent, in order</li>
      </ul>
      <div className="callout callout-tip"><strong>When "No Text Response" appears in playground</strong>Check: chunks_streamed=0 → LLM made a tool call with no text. output_tokens=3 → confirm it. pre_fetched_data empty → LLM has nothing to say. validate_output stripped everything → check violations log.</div>

      <h2>§6.4 Fairness &amp; Demographic Drift Monitoring</h2>
      <p>
        An observability system that only tracks aggregate metrics can hide a serious problem: the model works well for most users
        but systematically fails for a specific segment. At Housing.com that could mean the classifier is 15% less accurate for
        tier-3 city queries, or the LLM consistently hallucination-rates against smaller locality names — patterns invisible in
        overall accuracy but critical for product fairness.
      </p>
      <div className="callout callout-info">
        <strong>Segment by proxy signals, not PII</strong><br />
        Never store user demographics in logs. Use coarse, non-identifying proxy signals: city tier (1/2/3), query language
        (English / Hindi / Regional), session type (first-time / returning), BHK preference bucket (1BHK / 2BHK / 3BHK+).
        These are enough to detect systematic drift without creating a PII liability.
      </div>
      <CodeBlock title="Per-Segment Fairness Precision Monitor" language="python" keyLine={19} keyNote="Alert fires when any segment drops >15pp below overall accuracy">{CODE_FAIRNESS_SEGMENT}</CodeBlock>
      <p>
        Wire this into your weekly eval flywheel: pull the last 7 days of LangSmith traces, enrich each with its
        proxy segment from the session metadata, run <code>compute_per_segment_precision</code>, and post the report
        to your monitoring Slack channel. If any alert fires, pause the A/B experiment and investigate the affected segment's
        session replays before rolling out further.
      </p>

      <QuizSection moduleId={6} title="Module 6" contentHint="Structured logging with structlog, LangSmith @traceable, debugging with session_id, playground panels and what they show, fairness segment monitoring, demographic drift alerts" />
    </>
  );
}
