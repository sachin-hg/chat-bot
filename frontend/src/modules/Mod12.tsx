import { useState } from "react";
import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from '../components/CodeBlock';

function DomainAdapterViz() {
  const [selectedAdapter, setSelectedAdapter] = useState<string | null>(null);

  const adapters = [
    { name: 'Housing.com Adapter', tools: 'property_search tools', tax: 'housing SLM taxonomy', color: '#89b4fa', y: 30 },
    { name: 'Support Bot Adapter', tools: 'ticket tools', tax: 'support taxonomy', color: '#a6e3a1', y: 95 },
    { name: 'HR Bot Adapter', tools: 'HR tools', tax: 'HR taxonomy', color: '#cba6f7', y: 160 },
  ];

  const adapterDetails: Record<string, string> = {
    'Housing.com Adapter': 'PropertySearchAdapter → extract_filters() → search_properties() → format_listings()',
    'Support Bot Adapter': 'GeneralAdapter → retrieve_context() → llm_answer() → format_response()',
    'HR Bot Adapter': 'OffTopicAdapter → polite_decline() → suggest_property_search()',
  };

  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: '8px', padding: '20px', margin: '20px 0', overflow: 'hidden' }}>
      <style>{`@keyframes dashFlowDA{to{stroke-dashoffset:-14}}`}</style>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6c7086', marginBottom: '14px' }}>COMPOSABILITY — ONE PIPELINE CORE, MANY DOMAIN ADAPTERS</div>
      <svg viewBox="0 0 560 200" width="100%" style={{ display: 'block', margin: '0 auto' }} aria-label="Domain adapter pattern diagram showing multiple adapters feeding into a shared core pipeline">
        <defs>
          <marker id="arrow-da" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#89b4fa" />
          </marker>
        </defs>

        {/* Core pipeline box (center-right) */}
        <rect x="330" y="60" width="200" height="80" rx="6" fill="#313244" stroke="#89b4fa" strokeWidth="2" />
        <text x="430" y="82" textAnchor="middle" fontSize="11" fill="#89b4fa" fontWeight="bold">LangGraph Pipeline</text>
        <text x="430" y="98" textAnchor="middle" fontSize="9" fill="#bac2de">classify → route → tools</text>
        <text x="430" y="112" textAnchor="middle" fontSize="9" fill="#bac2de">→ LLM → validate</text>
        <text x="430" y="127" textAnchor="middle" fontSize="9" fill="#6c7086">(core unchanged)</text>

        {/* Adapter boxes (left) */}
        {adapters.map(a => {
          const isSelected = selectedAdapter === a.name;
          const isDeselected = selectedAdapter !== null && !isSelected;
          return (
            <g
              key={a.name}
              onClick={() => setSelectedAdapter(isSelected ? null : a.name)}
              style={{ cursor: 'pointer', opacity: isDeselected ? 0.3 : 1, transition: 'opacity 0.2s' }}
            >
              <rect
                x="20"
                y={a.y}
                width="180"
                height="50"
                rx="6"
                fill="#1e1e2e"
                stroke={isSelected ? 'var(--accent, #89b4fa)' : a.color}
                strokeWidth={isSelected ? 2 : 1.5}
              />
              <text x="110" y={a.y + 16} textAnchor="middle" fontSize="10" fill={a.color} fontWeight="bold">{a.name}</text>
              <text x="110" y={a.y + 30} textAnchor="middle" fontSize="9" fill="#bac2de">{a.tools}</text>
              <text x="110" y={a.y + 44} textAnchor="middle" fontSize="9" fill="#6c7086">{a.tax}</text>
              {/* Arrow from adapter to core */}
              <line
                x1="200"
                y1={a.y + 25}
                x2="330"
                y2="100"
                stroke={a.color}
                strokeWidth="1.5"
                strokeDasharray="4 3"
                markerEnd="url(#arrow-da)"
                style={{ animation: 'dashFlowDA 1s linear infinite' }}
              />
            </g>
          );
        })}

        {/* Annotation */}
        <text x="280" y="175" textAnchor="middle" fontSize="10" fill="#6c7086">Same pipeline. Different classifier + tools + prompts. Zero core code changes.</text>
        <text x="280" y="190" textAnchor="middle" fontSize="9" fill="#45475a">New domain = new adapter. Core pipeline never modified.</text>
      </svg>

      {selectedAdapter && (
        <div style={{
          marginTop: '12px',
          background: '#1e1e2e',
          border: '1px solid var(--accent, #89b4fa)',
          borderRadius: '6px',
          padding: '12px 16px',
          fontSize: '0.82rem',
          color: '#cdd6f4',
          fontFamily: 'monospace',
        }}>
          <span style={{ color: '#6c7086', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>Adapter Pipeline Detail</span>
          {adapterDetails[selectedAdapter]}
        </div>
      )}
    </div>
  );
}

function StateMachineComparisonViz() {
  const [explainIdx, setExplainIdx] = useState<number | null>(null);

  const pairs = [
    { left: 'StateGraph(BotState)', right: 'createMachine({...})', lColor: '#89b4fa', rColor: '#fab387' },
    { left: 'TypedDict (BotState)', right: 'type interfaces (TS)', lColor: '#94e2d5', rColor: '#f9e2af' },
    { left: 'async def node(state)', right: 'async action functions', lColor: '#a6e3a1', rColor: '#cba6f7' },
    { left: 'add_conditional_edges()', right: 'always/guard transitions', lColor: '#f9e2af', rColor: '#94e2d5' },
    { left: 'graph.compile()', right: 'interpret(machine)', lColor: '#cba6f7', rColor: '#a6e3a1' },
  ];

  const rowH = 26;

  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: '8px', padding: '20px', margin: '20px 0', overflow: 'hidden' }}>
      <style>{`@keyframes dashFlowSM{to{stroke-dashoffset:-14}}`}</style>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6c7086', marginBottom: '14px' }}>LANGGRAPH vs XSTATE — THE SAME STATE MACHINE CONCEPT, DIFFERENT LANGUAGES</div>
      <svg viewBox="0 0 560 160" width="100%" style={{ display: 'block', margin: '0 auto' }} aria-label="LangGraph vs XState conceptual equivalence diagram">
        <defs>
          <marker id="arrow-sm" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#45475a" />
          </marker>
        </defs>

        {/* Column headers */}
        <rect x="10" y="4" width="210" height="22" rx="4" fill="#313244" />
        <text x="115" y="19" textAnchor="middle" fontSize="11" fill="#89b4fa" fontWeight="bold">Python / LangGraph</text>

        <rect x="340" y="4" width="210" height="22" rx="4" fill="#313244" />
        <text x="445" y="19" textAnchor="middle" fontSize="11" fill="#fab387" fontWeight="bold">TypeScript / XState</text>

        <text x="280" y="19" textAnchor="middle" fontSize="9" fill="#6c7086">≡</text>

        {/* Row pairs */}
        {pairs.map((p, i) => {
          const y = 34 + i * rowH;
          return (
            <g key={p.left}>
              {/* left box */}
              <rect x="10" y={y} width="210" height="22" rx="4" fill="#1e1e2e" stroke={p.lColor} strokeWidth="1" />
              <text x="115" y={y + 14} textAnchor="middle" fontSize="10" fill={p.lColor} fontFamily="monospace">{p.left}</text>

              {/* dotted equivalence line */}
              <line
                x1="220"
                y1={y + 11}
                x2="340"
                y2={y + 11}
                stroke="#45475a"
                strokeWidth="1"
                strokeDasharray="4 3"
                style={{ animation: `dashFlowSM 1.2s linear infinite`, animationDelay: `${i * 0.15}s` }}
              />
              <text
                x="280"
                y={y + 15}
                textAnchor="middle"
                fontSize="10"
                fill={explainIdx === i ? '#89b4fa' : '#6c7086'}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setExplainIdx(explainIdx === i ? null : i)}
              >1:1</text>

              {/* right box */}
              <rect x="340" y={y} width="210" height="22" rx="4" fill="#1e1e2e" stroke={p.rColor} strokeWidth="1" />
              <text x="445" y={y + 14} textAnchor="middle" fontSize="10" fill={p.rColor} fontFamily="monospace">{p.right}</text>
            </g>
          );
        })}

        <text x="280" y="152" textAnchor="middle" fontSize="9" fill="#6c7086">Patterns (port/adapter, pre-fetch, tier system) are language-agnostic</text>
      </svg>

      {explainIdx !== null && (
        <div style={{
          marginTop: '12px',
          background: '#1e1e2e',
          border: '1px solid #313244',
          borderRadius: '6px',
          padding: '12px 16px',
          fontSize: '0.82rem',
          color: '#cdd6f4',
        }}>
          <span style={{ color: '#6c7086', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>1:1 Equivalence — Row {explainIdx + 1}</span>
          Both patterns represent state as an immutable snapshot; transitions are pure functions that return new state.
        </div>
      )}
    </div>
  );
}

const codeTemplate = `Step 1: Domain Taxonomy Design
  List all things a user can ask about your product.
  Group into 3–5 domains.
  For each domain, list 5–15 sub-intents.
  Write few-shot examples. BAD: "User wants help with their account."
  GOOD: "User wants to reset their password, unlock their account, or change
  their email — they provide their email and expect a reset link."

Step 2: Intent Registry — tier + data_requirements + filter carry-over

Step 3: Tool Registry — name, description, params with wire_param translations
  # wire_param = the LLM sees one name, the API expects another
  # Example: LLM outputs locality_uuids → translate_to_wire_format() → API receives 'localities'
  ToolParam(key='locality_uuids', type='array', wire_param='localities')

Step 4: Session Schema — what persists across turns for your domain?

Step 5: LLM Prompts — one per intent group, inject right data context

Step 6: Templates — structured data that appears without LLM text`;

const codeNodeJs = `// asyncio.Queue → PassThrough stream (with backpressure)
const { PassThrough } = require('stream');
const stream = new PassThrough();

// SSE stream with backpressure — stream.write() respects client read speed
app.get('/chat/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  stream.pipe(res);  // pipe handles backpressure automatically
});

// Pipeline emits into stream (sync-safe)
stream.write(\`data: \${JSON.stringify({ token: 'Hello' })}\\n\\n\`);`;

const codeDotNet = `// asyncio.Queue → Channel<T>
var channel = Channel.CreateUnbounded<string>();

// Background pipeline writes
await channel.Writer.WriteAsync(token);

// SSE controller reads
await foreach (var token in channel.Reader.ReadAllAsync())
{
    await response.WriteAsync($"data: {token}\\n\\n");
    await response.Body.FlushAsync();
}

// ASP.NET Core middleware IS the pipeline analogy
// BotState → HttpContext.Items["BotState"]`;

export function Mod12() {
  return (
    <>
      <div className="learning-obj"><h3>Learning Objectives</h3><ul>
        <li>Understand how composability allows a single pipeline to serve multiple property domains</li>
        <li>Map the LangGraph state machine to equivalent patterns you already know (Redux, XState)</li>
        <li>Implement a DomainAdapter interface that lets you add new verticals without touching core logic</li>
        <li>Recognise why adapter hot-swapping is a load-shedding and A/B testing primitive</li>
      </ul></div>
      <DomainAdapterViz />
      <h2>9.1 What's Reusable vs Domain-Specific</h2>
      <div className="two-col">
        <div className="col-card">
          <h4 style={{ color: "var(--accent2)" }}>Reusable framework</h4>
          <ul style={{ fontSize: "12px" }}>
            <li>19-node pipeline structure</li>
            <li>SSE streaming infrastructure</li>
            <li>Session management + Lua locking <small style={{ color: "var(--muted)" }}>(Module 6 — atomic Redis read-modify-write preventing concurrent session corruption)</small></li>
            <li>Tool executor with caching</li>
            <li>A/B experiment framework <small style={{ color: "var(--muted)" }}>(Module 17 — deterministic hash-based traffic splitting, auto-rollback, statistical validity gates)</small></li>
            <li>LangSmith observability</li>
            <li>Playground UI</li>
          </ul>
        </div>
        <div className="col-card">
          <h4 style={{ color: "var(--accent5)" }}>Domain-specific (swap these)</h4>
          <ul style={{ fontSize: "12px" }}>
            <li><code>prompts/slm/domains/*.md</code> — taxonomy</li>
            <li><code>intent_registry.py</code> — intents + tiers</li>
            <li><code>tool_registry.py</code> — tool definitions</li>
            <li><code>processing.py</code> — filter/derive logic</li>
          </ul>
        </div>
      </div>

      <h2>9.2 The Template: Building an Agent for Any Domain</h2>
      <div className="callout callout-info"><strong>How to write a taxonomy — the critical step</strong>A taxonomy prompt has four components: (1) <strong>Intent schema</strong> — JSON output structure. Ambiguity causes validate_slm failures. (2) <strong>Intent taxonomy</strong> — list of intents with one-sentence descriptions. Vague descriptions cause hallucination. (3) <strong>Filter schema</strong> — which keys may appear in filter_delta, with types. Missing a key means user input is silently dropped. (4) <strong>Few-shot examples</strong> — 3-5 per intent covering edge cases: ordinal refs, pivot detection, disambiguation responses.
        <br /><br />
        <strong>What is a "few-shot example"?</strong> Showing the model worked examples inside the prompt, so it learns the pattern from demonstration rather than instruction alone. Like code documentation: instead of saying "classify queries correctly," you show three examples of (query → correct output) pairs. The model then pattern-matches your new query against those examples. More examples = higher accuracy but more tokens per call.
      </div>
      <CodeBlock title="Domain Agent Build Template — 6-Step Process" language="text" keyLine={3} keyNote="List sub-intents before writing any code">{codeTemplate}</CodeBlock>

      <h2>9.3 Case Studies</h2>
      <table>
        <tr><th>Product</th><th>Key domains</th><th>Key session state</th><th>Tier 3b trigger</th></tr>
        <tr><td>E-commerce</td><td>product_search, order_mgmt, returns</td><td>cart, wishlist, size_preferences</td><td>Product recommendations</td></tr>
        <tr><td>Travel</td><td>flights, hotels, itinerary, visa</td><td>origin, destination, travel_dates</td><td>"Plan my 5-day trip"</td></tr>
        <tr><td>Healthcare</td><td>symptom_check, doctor_search, appointments</td><td>patient_profile, insurance</td><td>Complex symptom analysis</td></tr>
        <tr><td>B2B SaaS</td><td>troubleshooting, billing, account_mgmt</td><td>company_id, plan, open_tickets</td><td>"My webhook stopped working 2 days ago"</td></tr>
      </table>

      <StateMachineComparisonViz />
      <h2>9.4 Non-Python Teams: The Same Patterns, Different Languages</h2>
      <p>The patterns (port/adapter, pre-fetch, tier system, two-stage SLM) are language-agnostic. The technology choices (LangGraph, asyncio) are not. Here's how to apply them elsewhere.</p>
      <div className="two-col">
        <div className="col-card">
          <h4 style={{ color: "var(--accent2)" }}>Node.js + Express + LangChain.js</h4>
          <CodeBlock title="Node.js SSE Stream with Backpressure" language="javascript" keyLine={7} keyNote="pipe() handles backpressure — EventEmitter does not">{codeNodeJs}</CodeBlock>
          <small style={{ color: "var(--muted)", fontSize: "10px" }}>Warning: EventEmitter has no backpressure — if the pipeline emits faster than the client reads, frames drop silently. Use PassThrough (stream with internal buffer + drain signal) instead.</small>
        </div>
        <div className="col-card">
          <h4 style={{ color: "var(--accent5)" }}>.NET + ASP.NET Core</h4>
          <CodeBlock title=".NET ASP.NET Core — Channel&lt;T&gt; SSE Streaming" language="text" keyLine={3} keyNote="Channel&lt;T&gt; is the direct equivalent of asyncio.Queue">{codeDotNet}</CodeBlock>
        </div>
      </div>
      <div className="callout callout-info"><strong>The key insight</strong>ASP.NET Core middleware pipeline IS the analogy from Module 4 — it's not a metaphor, it's the same pattern implemented natively. <code>Channel&lt;T&gt;</code> is the direct equivalent of <code>asyncio.Queue</code>. The port/adapter interfaces translate 1:1 to C# interfaces or TypeScript interfaces.</div>

      <QuizSection moduleId={9} title="Module 9" contentHint="Reusable framework vs domain-specific parts, taxonomy design, few-shot examples, case studies, Node.js and .NET equivalents" />
    </>
  );
}
