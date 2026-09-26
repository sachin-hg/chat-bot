import { useState } from 'react';
import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from '../components/CodeBlock';

function GanttViz() {
  const [currentWeek, setCurrentWeek] = useState(3);

  const phases = [
    { label: 'Skeleton + Redis + Session', start: 1, end: 1, color: '#89b4fa' },
    { label: 'Classification + SLM', start: 2, end: 2, color: '#a6e3a1' },
    { label: 'Tool System + Registry', start: 3, end: 3, color: '#f9e2af' },
    { label: 'LLM Integration + Gate', start: 4, end: 4, color: '#94e2d5' },
    { label: 'Testing + CI/CD', start: 5, end: 6, color: '#cba6f7' },
    { label: 'Deployment + Observability', start: 6, end: 7, color: '#fab387' },
    { label: 'Hardening + Scale', start: 7, end: 8, color: '#f38ba8' },
  ];

  const leftPad = 170;
  const rightPad = 20;
  const topPad = 40;
  const rowH = 28;
  const totalW = 580 - leftPad - rightPad;
  const weeks = 8;
  const weekW = totalW / weeks;

  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: '8px', padding: '20px', margin: '20px 0', overflow: 'hidden' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6c7086', marginBottom: '14px' }}>8-WEEK BUILD ROADMAP — SKELETON BEFORE ORGANS</div>
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '0.78rem', color: '#bac2de' }}>Current week:</span>
        {Array.from({ length: 8 }, (_, i) => i + 1).map(w => (
          <button key={w} onClick={() => setCurrentWeek(w)} style={{ background: currentWeek === w ? '#89b4fa22' : '#313244', color: currentWeek === w ? '#89b4fa' : '#cdd6f4', border: `1px solid ${currentWeek === w ? '#89b4fa' : '#45475a'}`, borderRadius: '6px', padding: '5px 12px', fontSize: '0.78rem', cursor: 'pointer', marginRight: '4px' }}>W{w}</button>
        ))}
      </div>
      <svg viewBox="0 0 580 260" width="100%" style={{ display: 'block', margin: '0 auto' }} aria-label="8-week build roadmap Gantt chart">
        <rect width="580" height="260" rx="6" fill="#1e1e2e" />

        {/* Week headers */}
        {Array.from({ length: weeks }, (_, i) => {
          const x = leftPad + i * weekW + weekW / 2;
          return (
            <text key={i} x={x} y="26" textAnchor="middle" fontSize="11" fill="#6c7086">W{i + 1}</text>
          );
        })}

        {/* Current week highlight column */}
        <rect
          x={leftPad + (currentWeek - 1) * weekW}
          y={topPad - 4}
          width={weekW}
          height={phases.length * rowH + 8}
          fill="#89b4fa"
          fillOpacity="0.06"
          rx="2"
        />
        <line
          x1={leftPad + (currentWeek - 1) * weekW + weekW / 2}
          y1={topPad - 4}
          x2={leftPad + (currentWeek - 1) * weekW + weekW / 2}
          y2={topPad + phases.length * rowH + 4}
          stroke="#89b4fa"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <text x={leftPad + (currentWeek - 1) * weekW + weekW / 2} y={topPad + phases.length * rowH + 16} textAnchor="middle" fontSize="9" fill="#89b4fa">now</text>

        {/* Grid lines */}
        {Array.from({ length: weeks + 1 }, (_, i) => (
          <line key={i} x1={leftPad + i * weekW} y1={topPad - 4} x2={leftPad + i * weekW} y2={topPad + phases.length * rowH + 4} stroke="#313244" strokeWidth="1" />
        ))}

        {/* Phase bars */}
        {phases.map((p, i) => {
          const y = topPad + i * rowH;
          const barX = leftPad + (p.start - 1) * weekW + 2;
          const barW = (p.end - p.start + 1) * weekW - 4;
          const isActive = currentWeek >= p.start && currentWeek <= p.end;
          return (
            <g key={p.label}>
              <text x={leftPad - 8} y={y + 18} textAnchor="end" fontSize="10" fill={isActive ? p.color : '#bac2de'}>{p.label}</text>
              <rect x={barX} y={y + 4} width={barW} height="20" rx="5" fill={p.color} fillOpacity={isActive ? 0.85 : 0.35} />
              <text x={barX + barW / 2} y={y + 18} textAnchor="middle" fontSize="9" fill="#1e1e2e" fontWeight="bold">
                {p.start === p.end ? `W${p.start}` : `W${p.start}–${p.end}`}
              </text>
            </g>
          );
        })}

        <text x="290" y="250" textAnchor="middle" fontSize="9" fill="#6c7086">Each phase unlocks the next. Playground built in W1 — you will live in it for 3 months.</text>
      </svg>
    </div>
  );
}

function BuildOrderViz() {
  const wrong = [
    { label: 'LLM node', color: '#f38ba8' },
    { label: 'Tool calls', color: '#f38ba8' },
    { label: 'State mgmt', color: '#f38ba8' },
    { label: 'Tests', color: '#f38ba8' },
    { label: 'Skeleton', color: '#f38ba8' },
  ];

  const right = [
    { label: 'Skeleton', color: '#a6e3a1' },
    { label: 'State mgmt', color: '#a6e3a1' },
    { label: 'SLM classify', color: '#a6e3a1' },
    { label: 'Tool system', color: '#a6e3a1' },
    { label: 'LLM node', color: '#a6e3a1' },
    { label: 'Tests', color: '#a6e3a1' },
  ];

  const boxH = 26;
  const boxW = 130;

  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: '8px', padding: '20px', margin: '20px 0', overflow: 'hidden' }}>
      <style>{`@keyframes dashFlowBO{to{stroke-dashoffset:-14}}`}</style>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6c7086', marginBottom: '14px' }}>BUILD ORDER — SKELETON FIRST PREVENTS INTEGRATION HELL</div>
      <svg viewBox="0 0 560 200" width="100%" style={{ display: 'block', margin: '0 auto' }} aria-label="Wrong vs right build order diagram">
        <defs>
          <marker id="arrow-wrong" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#f38ba8" />
          </marker>
          <marker id="arrow-right" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#a6e3a1" />
          </marker>
        </defs>

        {/* Left column header: WRONG */}
        <text x="85" y="18" textAnchor="middle" fontSize="12" fill="#f38ba8" fontWeight="bold">WRONG ORDER</text>

        {/* Left column boxes */}
        {wrong.map((item, i) => {
          const y = 28 + i * (boxH + 6);
          return (
            <g key={item.label + i}>
              <rect x="20" y={y} width={boxW} height={boxH} rx="6" fill="#313244" stroke="#f38ba8" strokeWidth="1" />
              <text x="85" y={y + 17} textAnchor="middle" fontSize="11" fill="#f38ba8">{item.label}</text>
              {i < wrong.length - 1 && (
                <line x1="85" y1={y + boxH} x2="85" y2={y + boxH + 6} stroke="#f38ba8" strokeWidth="1.5" markerEnd="url(#arrow-wrong)" />
              )}
            </g>
          );
        })}
        {/* Circular dep arrow */}
        <path d="M150,54 Q185,110 150,168" fill="none" stroke="#f38ba8" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow-wrong)" style={{ animation: 'dashFlowBO 1s linear infinite' }} />
        <text x="195" y="114" fontSize="9" fill="#f38ba8" textAnchor="middle">circular</text>
        <text x="195" y="125" fontSize="9" fill="#f38ba8" textAnchor="middle">dependency</text>

        {/* Divider */}
        <line x1="280" y1="10" x2="280" y2="190" stroke="#45475a" strokeWidth="1" strokeDasharray="4 3" />

        {/* Right column header: RIGHT */}
        <text x="430" y="18" textAnchor="middle" fontSize="12" fill="#a6e3a1" fontWeight="bold">RIGHT ORDER</text>

        {/* Right column boxes */}
        {right.map((item, i) => {
          const y = 28 + i * (boxH + 4);
          return (
            <g key={item.label + i}>
              <rect x="365" y={y} width={boxW} height={boxH} rx="6" fill="#313244" stroke="#a6e3a1" strokeWidth="1" />
              <text x="430" y={y + 17} textAnchor="middle" fontSize="11" fill="#a6e3a1">{item.label}</text>
              {i < right.length - 1 && (
                <line x1="430" y1={y + boxH} x2="430" y2={y + boxH + 4} stroke="#a6e3a1" strokeWidth="1.5" markerEnd="url(#arrow-right)" />
              )}
            </g>
          );
        })}

        <text x="85" y="195" textAnchor="middle" fontSize="9" fill="#f38ba8">Each step missing its foundation</text>
        <text x="430" y="195" textAnchor="middle" fontSize="9" fill="#a6e3a1">Each step buildable independently</text>
      </svg>
    </div>
  );
}

const CODE_UNIT_TEST = `# Test filter_apply_node directly
state = make_bot_state(classification={'filter_delta': {'price_max': '2cr'}})
result = await filter_apply_node(state)
assert result['session']['active_filters']['price_max'] == 20_000_000`;

const CODE_GOLDEN_DATASET = `# tests/model_eval/golden_dataset.json
[
  {
    "input": "show me 3BHK in Bandra under 2Cr",
    "expected_domain": "property_search",
    "expected_intent": "search_properties",
    "expected_filter_keys": ["bhk", "localities", "price_max"],
    "expected_pivot": false
  },
  {
    "input": "tell me about the second one",
    "expected_domain": "property_search",
    "expected_intent": "view_property_detail",
    "expected_entity_ref": {"by": "cardinality", "value": 2},
    "expected_pivot": true
  }
]

# Test runner
async def test_classification_accuracy():
    results = [await classify(c["input"]) for c in GOLDEN_CASES]
    accuracy = sum(
        1 for r, c in zip(results, GOLDEN_CASES)
        if r["main_intent"] == c["expected_intent"]
    ) / len(GOLDEN_CASES)
    if accuracy < 0.90:
        send_slack_alert(f"Accuracy dropped to {accuracy:.1%}!")
    assert accuracy >= 0.90`;

export function Mod13() {
  const phases = [
    { week: "Week 1", name: "Skeleton", steps: "FastAPI + SSE endpoint · asyncio.Queue streaming · 3-node LangGraph · Redis session · Basic playground · Structured logging" },
    { week: "Week 2", name: "Classification", steps: "Stage 1 SLM (domain router) · Stage 2 SLM (intent classifier) · Taxonomy prompt for primary domain · validate_slm_node · LangSmith" },
    { week: "Week 3", name: "Filters & State", steps: "filter_apply_node · sanitize_node · derive_node · Session carry-over logic" },
    { week: "Week 4", name: "Tools", steps: "Tool registry (5–10 core tools) · CachedExecutor · fetch_data_node · respond_node (carousel/template) · build_prompt_node" },
    { week: "Week 5", name: "LLM Response", steps: "llm_node with streaming · validate_output_node · followup_node with connection_close timing · Background persistence" },
    { week: "Weeks 6–7", name: "Production Hardening", steps: "Concurrency gate · Timeout + retry logic · Kafka event stream · A/B experiment framework · Cost tracking · Error monitoring" },
    { week: "Week 8+", name: "Advanced Features", steps: "Ordinal entity resolution · Multi-intent handling · Conversation summarization · Explore nearby / expand search · Clarification flows" },
  ];

  return (
    <>
      <GanttViz />
      <div className="callout callout-info">
        <strong>Why this order?</strong> You need to see the skeleton work end-to-end before adding organs. The playground is especially important — you will live in it for the next 3 months. Never skip it to "save time."
        <br /><br />
        <strong>Week 1 acceptance criteria — "Skeleton works" means ALL of this:</strong>
        <ol style={{ margin: "6px 0 0 16px", fontSize: "13px" }}>
          <li>POST /chat returns an SSE stream that stays open (&gt;2s without closing)</li>
          <li>The stream emits at least one <code>pipeline_step</code> event</li>
          <li>Redis writes and reads a session key without error</li>
          <li>The playground renders the SSE timeline with at least one event</li>
          <li>Structured logs appear with <code>request_id</code> field on every entry</li>
        </ol>
        If any of these fails, stop. Do not add the SLM classifier. Debug the skeleton first — every future module builds on it.
      </div>
      <svg width="560" height="280" viewBox="0 0 560 280" style={{ display: "block", margin: "12px auto", fontFamily: "'Courier New',monospace" }}>
        <rect width="560" height="280" rx="6" fill="#1e1e2e" />
        <text x="280" y="19" textAnchor="middle" fill="#cdd6f4" fontSize="11" fontWeight="bold">Build Timeline — 8 Weeks Gantt with Dependencies</text>
        {/* Week axis labels */}
        <text x="120" y="34" textAnchor="middle" fill="#6c7086" fontSize="8">W1</text>
        <text x="180" y="34" textAnchor="middle" fill="#6c7086" fontSize="8">W2</text>
        <text x="240" y="34" textAnchor="middle" fill="#6c7086" fontSize="8">W3</text>
        <text x="300" y="34" textAnchor="middle" fill="#6c7086" fontSize="8">W4</text>
        <text x="360" y="34" textAnchor="middle" fill="#6c7086" fontSize="8">W5</text>
        <text x="420" y="34" textAnchor="middle" fill="#6c7086" fontSize="8">W6</text>
        <text x="480" y="34" textAnchor="middle" fill="#6c7086" fontSize="8">W7</text>
        <text x="540" y="34" textAnchor="middle" fill="#6c7086" fontSize="8">W8+</text>
        {/* Grid lines */}
        <line x1="120" y1="36" x2="120" y2="270" stroke="#313244" strokeWidth="1" />
        <line x1="180" y1="36" x2="180" y2="270" stroke="#313244" strokeWidth="1" />
        <line x1="240" y1="36" x2="240" y2="270" stroke="#313244" strokeWidth="1" />
        <line x1="300" y1="36" x2="300" y2="270" stroke="#313244" strokeWidth="1" />
        <line x1="360" y1="36" x2="360" y2="270" stroke="#313244" strokeWidth="1" />
        <line x1="420" y1="36" x2="420" y2="270" stroke="#313244" strokeWidth="1" />
        <line x1="480" y1="36" x2="480" y2="270" stroke="#313244" strokeWidth="1" />
        {/* Row 1: Skeleton W1 */}
        <rect x="90" y="40" width="60" height="24" rx="3" fill="#89b4fa" fillOpacity="0.6" />
        <text x="120" y="56" textAnchor="middle" fill="#1e1e2e" fontSize="9" fontWeight="bold">Skeleton</text>
        <text x="6" y="55" fill="#a6adc8" fontSize="8" textAnchor="start">W1</text>
        {/* Row 2: Classification W2 */}
        <rect x="150" y="68" width="60" height="24" rx="3" fill="#a6e3a1" fillOpacity="0.6" />
        <text x="180" y="84" textAnchor="middle" fill="#1e1e2e" fontSize="9" fontWeight="bold">Classify</text>
        <text x="6" y="83" fill="#a6adc8" fontSize="8" textAnchor="start">W2</text>
        {/* Row 3: Filters W3 */}
        <rect x="210" y="96" width="60" height="24" rx="3" fill="#f9e2af" fillOpacity="0.6" />
        <text x="240" y="112" textAnchor="middle" fill="#1e1e2e" fontSize="9" fontWeight="bold">Filters</text>
        <text x="6" y="111" fill="#a6adc8" fontSize="8" textAnchor="start">W3</text>
        {/* Row 4: Tools W4 */}
        <rect x="270" y="124" width="60" height="24" rx="3" fill="#fab387" fillOpacity="0.6" />
        <text x="300" y="140" textAnchor="middle" fill="#1e1e2e" fontSize="9" fontWeight="bold">Tools</text>
        <text x="6" y="139" fill="#a6adc8" fontSize="8" textAnchor="start">W4</text>
        {/* Row 5: LLM Response W5 */}
        <rect x="330" y="152" width="60" height="24" rx="3" fill="#cba6f7" fillOpacity="0.6" />
        <text x="360" y="168" textAnchor="middle" fill="#1e1e2e" fontSize="9" fontWeight="bold">LLM Resp</text>
        <text x="6" y="167" fill="#a6adc8" fontSize="8" textAnchor="start">W5</text>
        {/* Row 6: Production Hardening W6-7 */}
        <rect x="390" y="180" width="120" height="24" rx="3" fill="#f38ba8" fillOpacity="0.6" />
        <text x="450" y="196" textAnchor="middle" fill="#1e1e2e" fontSize="9" fontWeight="bold">Production Hardening</text>
        <text x="6" y="195" fill="#a6adc8" fontSize="8" textAnchor="start">W6–7</text>
        {/* Row 7: Advanced Features W8+ */}
        <rect x="510" y="208" width="46" height="24" rx="3" fill="#585b70" fillOpacity="0.9" />
        <text x="533" y="224" textAnchor="middle" fill="#cdd6f4" fontSize="9" fontWeight="bold">Adv+</text>
        <text x="6" y="223" fill="#a6adc8" fontSize="8" textAnchor="start">W8+</text>
        {/* Dependency arrows (diagonal) */}
        <line x1="150" y1="52" x2="150" y2="68" stroke="#89b4fa" strokeWidth="1.5" strokeDasharray="3,2" />
        <line x1="210" y1="80" x2="210" y2="96" stroke="#a6e3a1" strokeWidth="1.5" strokeDasharray="3,2" />
        <line x1="270" y1="108" x2="270" y2="124" stroke="#f9e2af" strokeWidth="1.5" strokeDasharray="3,2" />
        <line x1="330" y1="136" x2="330" y2="152" stroke="#fab387" strokeWidth="1.5" strokeDasharray="3,2" />
        <line x1="390" y1="164" x2="390" y2="180" stroke="#cba6f7" strokeWidth="1.5" strokeDasharray="3,2" />
        <line x1="510" y1="192" x2="510" y2="208" stroke="#f38ba8" strokeWidth="1.5" strokeDasharray="3,2" />
        {/* Step labels */}
        <text x="120" y="38" textAnchor="middle" fill="#a6adc8" fontSize="7">FastAPI+SSE+Redis+Playground</text>
        <text x="180" y="66" textAnchor="middle" fill="#a6adc8" fontSize="7">SLM domain+intent+LangSmith</text>
        <text x="240" y="94" textAnchor="middle" fill="#a6adc8" fontSize="7">filter/sanitize/derive nodes</text>
        <text x="300" y="122" textAnchor="middle" fill="#a6adc8" fontSize="7">tool registry+fetch_data_node</text>
        <text x="360" y="150" textAnchor="middle" fill="#a6adc8" fontSize="7">llm_node stream+validate</text>
        <text x="450" y="178" textAnchor="middle" fill="#a6adc8" fontSize="7">concurrency+Kafka+A/B+cost</text>
        <text x="533" y="206" textAnchor="middle" fill="#a6adc8" fontSize="7">multi-intent+summarize</text>
        {/* Critical path annotation */}
        <text x="290" y="258" textAnchor="middle" fill="#a6adc8" fontSize="8">Each phase unlocks the next. Do not skip skeleton to start classification.</text>
        <text x="290" y="270" textAnchor="middle" fill="#6c7086" fontSize="8">"Play in the playground for 3 months" — playground is built in Week 1.</text>
      </svg>
      <div className="phase-timeline">
        {phases.map((p, i) => (
          <div className="phase-item" key={i}>
            <div className="phase-week">{p.week}</div>
            <div className="phase-name">{p.name}</div>
            <div className="phase-steps">{p.steps}</div>
          </div>
        ))}
      </div>

      <BuildOrderViz />
      <h2>Testing Strategy: Three Layers</h2>
      <div className="callout callout-tip"><strong>Layer 1 — Unit tests (every PR, &lt;30s, zero API cost)</strong>Each node takes (state: BotState, dep=None) and returns a dict. Unit testing is trivial: build a BotState with pytest fixtures, call the node function directly, assert on the returned dict. No need to run the full LangGraph graph.<CodeBlock title="Unit Test — filter_apply_node Direct State Assertion" language="python" keyLine={4} keyNote="Call node directly with make_bot_state — no full graph needed">{CODE_UNIT_TEST}</CodeBlock></div>
      <div className="callout callout-tip">
        <strong>Layer 2 — Model eval tests (nightly, ~$0.50/run)</strong>
        Run the SLM classifiers against a golden dataset of 50–100 labeled examples per domain. Catches prompt regressions when taxonomy prompts are edited.
        <br /><br />
        <strong>Golden dataset format:</strong>
        <CodeBlock title="Golden Dataset — Labeled Classification Test Cases" language="python" keyLine={8} keyNote="expected_pivot=true marks turn-context-dependent queries">{CODE_GOLDEN_DATASET}</CodeBlock>

        <strong>How to bootstrap from zero (Week 2):</strong> Send 20 test messages through the playground. Look at what the SLM returned. Label each one as correct/wrong. Correct ones go into the golden dataset. Wrong ones become few-shot examples. 20 labeled examples is enough to start — expand by 10 every week.
        <br /><br />
        <strong>The golden dataset is the most valuable asset in this system — more valuable than any code.</strong> Version-control it, review it on every taxonomy change, expand it when a new bug is found in production.
      </div>
      <div className="callout callout-tip"><strong>Layer 3 — E2E tests (pre-release, manual)</strong>Run against dev environment with real adapters. Verify SSE stream produces valid events. Verify carousel renders correctly. Verify full pipeline produces valid output.</div>
      <div className="callout callout-info">
        <strong>Module 5 — Reference Answer: Design Exercise</strong>
        <em>Q: A new engineer says "let's implement the LLM node in Week 1 so we can demo AI functionality immediately." How do you respond?</em>
        <br /><br />
        <strong>A (L5 framing):</strong> The LLM node depends on everything upstream: validated state, applied filters, pre-fetched tool data, and a built prompt. Without those, the LLM response will be wrong, and you won't know why — the demo will mislead rather than validate. The skeleton (FastAPI → SSE → queue → LangGraph → Redis) proves the plumbing works before you add organs. Debugging a broken SSE stream at Week 4 when you've also added the LLM, classifier, and tool layer is three times harder.
        <br /><br />
        <strong>What makes it L6:</strong> add that the playground is the highest-leverage investment in Week 1 precisely because every future module needs a way to observe its behavior. "You'll live in the playground for 3 months — never skip it to save time."
      </div>
      <QuizSection moduleId={5} title="Module 5" contentHint="Implementation order, why skeleton before organs, three-layer testing strategy (unit/model_eval/e2e), golden dataset importance" />
    </>
  );
}
