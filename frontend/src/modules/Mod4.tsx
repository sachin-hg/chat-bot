import { useState, useRef } from 'react';
import { QuizSection } from "../components/QuizSection";
import { CodeBlock, CodeDiff } from '../components/CodeBlock';

function PrefetchTimingViz() {
  const [mode, setMode] = useState<'prefetch' | 'sequential'>('prefetch');
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleMode = () => {
    if (transitioning) return;
    setTransitioning(true);
    timerRef.current = setTimeout(() => {
      setMode(prev => prev === 'prefetch' ? 'sequential' : 'prefetch');
      setTransitioning(false);
    }, 300);
  };

  const tools = [
    { name: 'searchProperties', ms: 200, color: '#a6e3a1' },
    { name: 'getLocalityDetail', ms: 120, color: '#89b4fa' },
    { name: 'getPriceData', ms: 180, color: '#94e2d5' },
    { name: 'checkRERA', ms: 90, color: '#cba6f7' },
  ];

  const llmMs = 450;
  const prefetchTotal = Math.max(...tools.map(t => t.ms));
  const seqTotal = tools.reduce((s, t) => s + t.ms, 0);
  const scale = 440 / (seqTotal + llmMs + 20);

  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: '8px', padding: '20px', margin: '20px 0', overflow: 'hidden' }}>
      <style>{`@keyframes dashFlowPF{to{stroke-dashoffset:-14}}`}</style>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6c7086', marginBottom: '14px' }}>PRE-FETCH vs SEQUENTIAL — PARALLELIZE TOOL CALLS BEFORE LLM</div>
      <div style={{ marginBottom: '12px' }}>
        <button
          onClick={toggleMode}
          style={{
            background: '#313244',
            color: '#cdd6f4',
            border: '1px solid #45475a',
            borderRadius: '6px',
            padding: '5px 16px',
            fontSize: '0.78rem',
            cursor: transitioning ? 'default' : 'pointer',
            opacity: transitioning ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          Switch to {mode === 'prefetch' ? 'Sequential' : 'Pre-fetch (parallel)'}
        </button>
        <span style={{ marginLeft: '12px', fontSize: '0.78rem', color: '#89b4fa', fontWeight: 600 }}>
          {mode === 'prefetch' ? 'Pre-fetch (parallel)' : 'Sequential'}
        </span>
      </div>
      <div style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.3s' }}>
        <svg viewBox="0 0 560 200" width="100%" style={{ display: 'block', margin: '0 auto' }} aria-label="Pre-fetch vs Sequential tool timing diagram">
          <rect width="560" height="200" rx="6" fill="#1e1e2e" />
          {/* t=0 line */}
          <line x1="100" y1="10" x2="100" y2="180" stroke="#45475a" strokeWidth="1" />
          <text x="100" y="195" textAnchor="middle" fontSize="9" fill="#6c7086">t=0</text>

          {mode === 'prefetch' ? (
            <>
              {tools.map((t, i) => {
                const w = Math.round(t.ms * scale);
                const y = 20 + i * 22;
                return (
                  <g key={t.name}>
                    <rect x="100" y={y} width={w} height="16" rx="4" fill={t.color} fillOpacity="0.75" />
                    <text x={104} y={y + 11} fontSize="10" fill="#1e1e2e" fontWeight="bold">{t.name}</text>
                    <text x={100 + w + 4} y={y + 11} fontSize="9" fill={t.color}>{t.ms}ms</text>
                  </g>
                );
              })}
              {/* LLM bar after prefetchTotal */}
              <rect x={100 + Math.round(prefetchTotal * scale)} y={20} width={Math.round(llmMs * scale)} height={tools.length * 22 - 6} rx="4" fill="#89b4fa" fillOpacity="0.3" stroke="#89b4fa" strokeWidth="1" />
              <text x={100 + Math.round(prefetchTotal * scale) + 6} y={20 + tools.length * 11 - 3} fontSize="10" fill="#89b4fa" fontWeight="bold">LLM {llmMs}ms</text>
              {/* total annotation */}
              <line x1={100 + Math.round((prefetchTotal + llmMs) * scale)} y1="15" x2={100 + Math.round((prefetchTotal + llmMs) * scale)} y2="175" stroke="#a6e3a1" strokeWidth="1" strokeDasharray="4 3" style={{ animation: 'dashFlowPF 1s linear infinite' }} />
              <text x={100 + Math.round((prefetchTotal + llmMs) * scale) + 4} y="165" fontSize="10" fill="#a6e3a1" fontWeight="bold">Total: {prefetchTotal + llmMs}ms</text>
              <text x="110" y="192" fontSize="10" fill="#a6e3a1">asyncio.gather() runs all tool calls in parallel — only max(durations) waits</text>
            </>
          ) : (
            <>
              {tools.map((t, i) => {
                const prevMs = tools.slice(0, i).reduce((s, tt) => s + tt.ms, 0);
                const x = 100 + Math.round(prevMs * scale);
                const w = Math.round(t.ms * scale);
                const y = 70;
                return (
                  <g key={t.name}>
                    <rect x={x} y={y} width={w} height="20" rx="4" fill={t.color} fillOpacity="0.6" />
                    <text x={x + 3} y={y + 13} fontSize="9" fill="#1e1e2e" fontWeight="bold">{t.name.slice(0, 10)}</text>
                    <text x={x + w / 2} y="105" fontSize="9" fill={t.color} textAnchor="middle">{t.ms}ms</text>
                  </g>
                );
              })}
              {/* LLM after all sequential */}
              <rect x={100 + Math.round(seqTotal * scale)} y="70" width={Math.round(llmMs * scale)} height="20" rx="4" fill="#89b4fa" fillOpacity="0.3" stroke="#89b4fa" strokeWidth="1" />
              <text x={100 + Math.round(seqTotal * scale) + 4} y="84" fontSize="10" fill="#89b4fa" fontWeight="bold">LLM</text>
              {/* total annotation */}
              <line x1={100 + Math.round((seqTotal + llmMs) * scale)} y1="15" x2={100 + Math.round((seqTotal + llmMs) * scale)} y2="115" stroke="#f38ba8" strokeWidth="1" strokeDasharray="4 3" style={{ animation: 'dashFlowPF 1s linear infinite' }} />
              <text x={100 + Math.round((seqTotal + llmMs) * scale) + 4} y="82" fontSize="10" fill="#f38ba8" fontWeight="bold">Total: {seqTotal + llmMs}ms</text>
              <text x="110" y="40" fontSize="10" fill="#f38ba8">Each tool waits for the previous — {seqTotal}ms delay BEFORE LLM starts</text>
              <text x="110" y="140" fontSize="10" fill="#6c7086">Pre-fetch saves {seqTotal - prefetchTotal}ms AND avoids blocking the LLM call</text>
              <text x="110" y="155" fontSize="9" fill="#45475a">({seqTotal + llmMs}ms sequential vs {prefetchTotal + llmMs}ms parallel = {(seqTotal + llmMs) - (prefetchTotal + llmMs)}ms saved)</text>
            </>
          )}

          {/* t axis ticks */}
          {Array.from({ length: 6 }, (_, i) => {
            const ms = Math.round((i * (seqTotal + llmMs)) / 5);
            const x = 100 + Math.round(ms * scale);
            return (
              <g key={i}>
                <line x1={x} y1="175" x2={x} y2="180" stroke="#45475a" strokeWidth="1" />
                <text x={x} y="191" textAnchor="middle" fontSize="8" fill="#6c7086">{ms}ms</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function ToolRegistryViz() {
  const intents = [
    { intent: 'property_search', tier: 'T1', pre: ['searchProperties', 'getLocalityDetail'], residual: ['checkRERA'] },
    { intent: 'general_query', tier: 'T2', pre: ['getPriceData'], residual: ['calculateEMI'] },
    { intent: 'off_topic', tier: 'T3', pre: [], residual: [] },
  ];

  const tools = [
    { name: 'searchProperties', color: '#a6e3a1', x: 400, y: 28 },
    { name: 'getPriceData', color: '#89b4fa', x: 400, y: 78 },
    { name: 'checkRERA', color: '#94e2d5', x: 400, y: 128 },
    { name: 'calculateEMI', color: '#cba6f7', x: 400, y: 178 },
  ];

  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: '8px', padding: '20px', margin: '20px 0', overflow: 'hidden' }}>
      <style>{`@keyframes dashFlowReg{to{stroke-dashoffset:-14}}`}</style>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6c7086', marginBottom: '14px' }}>TOOL REGISTRY — DATA-DRIVEN TOOL DISPATCH VIA INTENT CONFIG</div>
      <svg viewBox="0 0 560 220" width="100%" style={{ display: 'block', margin: '0 auto' }} aria-label="Tool registry architecture diagram">
        <defs>
          <marker id="arrow-reg" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#89b4fa" />
          </marker>
          <marker id="arrow-reg2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#f9e2af" />
          </marker>
        </defs>

        {/* INTENT_REGISTRY table */}
        <rect x="8" y="8" width="180" height="170" rx="6" fill="#313244" stroke="#45475a" strokeWidth="1" />
        <text x="98" y="24" textAnchor="middle" fontSize="11" fill="#f9e2af" fontWeight="bold">INTENT_REGISTRY</text>
        <line x1="8" y1="28" x2="188" y2="28" stroke="#45475a" strokeWidth="1" />
        <text x="14" y="40" fontSize="9" fill="#6c7086">intent</text>
        <text x="90" y="40" fontSize="9" fill="#6c7086">tier</text>
        <text x="115" y="40" fontSize="9" fill="#6c7086">pre_tools[]</text>
        <line x1="8" y1="44" x2="188" y2="44" stroke="#313244" strokeWidth="1" />
        {intents.map((it, i) => {
          const y = 60 + i * 38;
          return (
            <g key={it.intent}>
              <text x="14" y={y} fontSize="9" fill="#cdd6f4">{it.intent}</text>
              <text x="90" y={y} fontSize="9" fill="#fab387">{it.tier}</text>
              <text x="115" y={y} fontSize="8" fill="#a6e3a1">{it.pre.join(', ') || '—'}</text>
              <text x="115" y={y + 12} fontSize="8" fill="#94e2d5">{it.residual.join(', ') || '—'}</text>
              {i < intents.length - 1 && <line x1="8" y1={y + 20} x2="188" y2={y + 20} stroke="#45475a" strokeWidth="0.5" />}
            </g>
          );
        })}

        {/* wire_param box */}
        <rect x="210" y="75" width="130" height="60" rx="6" fill="#1e1e2e" stroke="#f9e2af" strokeWidth="1.5" />
        <text x="275" y="97" textAnchor="middle" fontSize="11" fill="#f9e2af" fontWeight="bold">wire_param()</text>
        <text x="275" y="112" textAnchor="middle" fontSize="9" fill="#bac2de">Maps BotState fields</text>
        <text x="275" y="124" textAnchor="middle" fontSize="9" fill="#bac2de">to tool function args</text>

        {/* arrow registry → wire_param */}
        <line x1="188" y1="106" x2="210" y2="106" stroke="#89b4fa" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow-reg)" style={{ animation: 'dashFlowReg 1s linear infinite' }} />

        {/* tool boxes */}
        {tools.map(t => (
          <g key={t.name}>
            <rect x={t.x} y={t.y} width="148" height="28" rx="6" fill="#313244" stroke={t.color} strokeWidth="1" />
            <text x={t.x + 8} y={t.y + 18} fontSize="10" fill={t.color} fontWeight="bold">{t.name}</text>
            {/* arrow wire_param → tool */}
            <line x1="340" y1="105" x2={t.x} y2={t.y + 14} stroke="#f9e2af" strokeWidth="1" strokeDasharray="4 3" markerEnd="url(#arrow-reg2)" style={{ animation: 'dashFlowReg 1s linear infinite' }} />
          </g>
        ))}

        {/* annotation */}
        <text x="8" y="198" fontSize="10" fill="#6c7086">New intent = add one row to registry. No code changes in nodes.</text>
      </svg>
    </div>
  );
}

const ITERATION_STEPS = [
  {
    label: 'Write Prompt',
    detail: 'Author the initial taxonomy prompt: define each intent with a precise description, add a filter schema with value type constraints, and include at least 3 few-shot examples per intent.',
  },
  {
    label: 'Test on 50 Queries',
    detail: 'Run model_eval against a curated golden dataset of 50 labelled queries. Check per-intent precision and recall, not just overall accuracy — overall can mask a single broken class.',
  },
  {
    label: 'Analyse Failures',
    detail: 'Sort failures by intent. If one class fails 6/10 times, that is a pattern, not noise. Look at the raw model output — wrong intent, missing filter key, or wrong value type each has a different fix.',
  },
  {
    label: 'Refine Labels',
    detail: 'Fix the root cause: rewrite the intent description if the model consistently confuses two classes, or add one targeted few-shot example for the specific failure pattern. Never add redundant examples.',
  },
  {
    label: 'Repeat until F1≥0.92',
    detail: 'Re-run model_eval after each change. Verify accuracy improves on the fixed class without regressing others. Iterate until macro F1 across all intents reaches 0.92 or higher.',
  },
];

function IterationCycleViz() {
  const [active, setActive] = useState<number | null>(null);

  const cx = 140;
  const cy = 140;
  const r = 90;
  const nodeR = 22;
  const n = ITERATION_STEPS.length;

  const getPos = (i: number) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const nodeColors = ['#a6e3a1', '#89b4fa', '#f9e2af', '#cba6f7', '#f38ba8'];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap', margin: '20px 0' }}>
      <svg
        viewBox="0 0 280 280"
        width="280"
        height="280"
        style={{ flexShrink: 0, display: 'block' }}
        aria-label="SLM prompt iteration cycle"
      >
        <defs>
          {ITERATION_STEPS.map((_, i) => (
            <marker
              key={i}
              id={`arrow-ic-${i}`}
              markerWidth="7"
              markerHeight="7"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L7,3 z" fill={nodeColors[i]} fillOpacity="0.7" />
            </marker>
          ))}
        </defs>

        {/* Edges with arrowheads */}
        {ITERATION_STEPS.map((_, i) => {
          const from = getPos(i);
          const to = getPos((i + 1) % n);
          // Shorten line so arrow doesn't overlap node circles
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / dist;
          const uy = dy / dist;
          const x1 = from.x + ux * nodeR;
          const y1 = from.y + uy * nodeR;
          const x2 = to.x - ux * (nodeR + 4);
          const y2 = to.y - uy * (nodeR + 4);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={nodeColors[i]}
              strokeWidth="1.5"
              strokeOpacity="0.5"
              markerEnd={`url(#arrow-ic-${i})`}
            />
          );
        })}

        {/* Nodes */}
        {ITERATION_STEPS.map((step, i) => {
          const pos = getPos(i);
          const isActive = active === i;
          return (
            <g
              key={i}
              onClick={() => setActive(active === i ? null : i)}
              style={{ cursor: 'pointer' }}
              role="button"
              aria-label={`Step ${i + 1}: ${step.label}`}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={nodeR}
                fill={isActive ? nodeColors[i] : '#1e1e2e'}
                stroke={nodeColors[i]}
                strokeWidth={isActive ? 2.5 : 1.5}
                style={{ transition: 'fill 0.2s, stroke-width 0.2s' }}
              />
              <text
                x={pos.x}
                y={pos.y - 4}
                textAnchor="middle"
                fontSize="13"
                fontWeight="bold"
                fill={isActive ? '#1e1e2e' : nodeColors[i]}
                style={{ transition: 'fill 0.2s', userSelect: 'none' }}
              >
                {i + 1}
              </text>
              <text
                x={pos.x}
                y={pos.y + 8}
                textAnchor="middle"
                fontSize="7"
                fill={isActive ? '#1e1e2e' : nodeColors[i]}
                style={{ transition: 'fill 0.2s', userSelect: 'none' }}
              >
                {step.label.split(' ').slice(0, 2).join(' ')}
              </text>
            </g>
          );
        })}

        {/* Center label */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="9" fill="#6c7086">Click a</text>
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="9" fill="#6c7086">node</text>
      </svg>

      {/* Detail panel */}
      <div
        style={{
          flex: 1,
          minWidth: '220px',
          background: '#181825',
          border: '1px solid #313244',
          borderRadius: '8px',
          padding: '16px',
          minHeight: '120px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {active === null ? (
          <p style={{ color: '#6c7086', fontSize: '13px', margin: 0 }}>
            Select a step in the cycle to see details.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: nodeColors[active],
                  color: '#1e1e2e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                  flexShrink: 0,
                }}
              >
                {active + 1}
              </span>
              <strong style={{ color: nodeColors[active], fontSize: '14px' }}>
                {ITERATION_STEPS[active].label}
              </strong>
            </div>
            <p style={{ color: '#cdd6f4', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
              {ITERATION_STEPS[active].detail}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const CODE_TOOL_RECORD = `ToolRecord(
    name='searchProperties',
    tier='data',
    llm_visible=True,        # can the LLM call this as a residual tool?
    description='Search Housing.com inventory...',
    input_params=[
        ToolParam(key='city',           type='string',  required=True),
        ToolParam(key='bhk',            type='array',   required=False),
        ToolParam(key='locality_uuids', type='array',   required=False,
                  wire_param='localities'),  # ← LLM sees 'locality_uuids', API expects 'localities'
        ToolParam(key='price_max',      type='integer', required=False),
    ],
    return_schema_summary='{ total_count, hits: PropertyCard[], srset_id }',
)`;

const CODE_CACHED_EXECUTOR = `class CachedExecutor:
    async def execute(self, tool: str, params: dict, ttl: int) -> dict:
        cache_key = hash(tool + json.dumps(sorted_params))
        cached = await redis.get(cache_key)
        if cached:
            return json.loads(cached)
        result = await self._call_api(tool, params)
        await redis.setex(cache_key, ttl, json.dumps(result))
        return result`;

const CODE_CLASSIFIER_PORT = `# ClassifierPort — 3 lines, zero implementation
class ClassifierPort(Protocol):
    async def classify(self, message: str, domain: str, session: dict) -> dict: ...

# AnthropicClassifier and OpenRouterClassifier both satisfy this protocol
# build_graph() injects the concrete instance via functools.partial
graph = build_graph(
    router=build_domain_router(settings),
    classifier=build_classifier(settings),  # selected by MODEL_REGISTRY
    llm=build_llm(settings),
)`;

const CODE_YAML_FEWSHOT = `# prompts/slm/domains/property_search.md — snippet
## Few-shot examples

### ordinal pivot (second → active_property_id)
Input: "tell me about the second one" (after carousel of 3 properties)
Output:
  main_intent: "view_property_detail"
  pivot: true
  entity_refs: [{by: "cardinality", value: 2}]
  filter_delta: {}

### amenity + bhk — both in one message
Input: "show 3BHK with gym"
Output:
  main_intent: "search_properties"
  filter_delta: {bhk: [3], amenities: ["gym"]}

### What NOT to do — description overlap
# BAD: both descriptions say "looking for a property"
search_properties: "User is looking for a property"
browse_listings: "User is looking for a property listing"  ← too similar
# GOOD: disambiguate by user action + context
search_properties: "User specifies filter criteria (location, price, type). Produces a new SERP."
browse_listings: "User navigates/explores existing results without changing filters."`;

const TAXONOMY_BROKEN = `intents:
  property_search:
    description: "User wants to find a property"

  general:
    description: "User asks a question"

  off_topic:
    description: "User says something unrelated"

# No definitions, no disambiguation,
# no examples — SLM picks arbitrarily.
# classify into: property_search, general, off_topic`;

const TAXONOMY_FIXED = `intents:
  property_search:
    description: >
      User specifies filter criteria: location,
      price, type, BHK, amenities, possession.
      Produces a new search result set.
    NOT: General questions without filter criteria.
    examples:
      - "2BHK in Bandra under 1.5Cr"
      - "show flats near Powai metro"
    negative:
      - "what is carpet area"
      - "how does RERA work"

  general:
    description: >
      Conceptual or definitional real estate question
      without specifying listings to find.
    NOT: Queries that include filter criteria.
    examples:
      - "what is carpet area vs built-up area"
    negative:
      - "show 3BHK in Andheri"

  off_topic:
    description: >
      Entirely unrelated to property, real estate,
      or Housing.com. Greetings, weather, jokes,
      or any non-domain topic.
    examples:
      - "what is the weather today"
      - "tell me a joke"`;

export function Mod4() {
  return (
    <>
      <PrefetchTimingViz />
      <h2>7.1 Tool Registry — Single Source of Truth</h2>
      <CodeBlock title="Tool Registry — ToolRecord Definition" language="python" keyLine={10} keyNote="wire_param translates LLM param name to internal API name">{CODE_TOOL_RECORD}</CodeBlock>
      <div className="callout callout-tip"><strong>wire_param pattern</strong>The LLM sees <code>locality_uuids</code> (descriptive) but the internal API expects <code>localities</code>. <code>translate_to_wire_format()</code> handles the translation before any API call. The LLM never sees internal parameter names.</div>

      <ToolRegistryViz />
      <h2>7.2 Pre-fetch vs Residual Tools</h2>
      <div className="two-col">
        <div className="col-card">
          <h4>Pre-fetch (orchestrator-controlled)</h4>
          <ul style={{ fontSize: "12px" }}>
            <li>Defined in <code>IntentRecord.data_requirements</code></li>
            <li>Runs in <code>fetch_data_node</code> before the LLM</li>
            <li>Deterministic — orchestrator knows what's needed</li>
            <li>Cached in Redis with TTL</li>
            <li>Zero LLM cost for the fetch decision</li>
          </ul>
        </div>
        <div className="col-card">
          <h4>Residual (LLM-controlled)</h4>
          <ul style={{ fontSize: "12px" }}>
            <li>Defined in <code>IntentRecord.residual_tools</code></li>
            <li>Available to LLM as tool definitions</li>
            <li>Called for edge cases pre-fetch didn't cover</li>
            <li>Tier B tools (calculateEMI, convertUnit) always available</li>
            <li>LLM decides if/when to call them</li>
          </ul>
        </div>
      </div>

      <h2>7.3 Caching Strategy</h2>
      <div className="callout callout-tip">
        <strong>Redis 101 — what it is and why we use it</strong>
        Redis is an in-memory key-value store. Think of it as a shared server-side dictionary that every instance of your service can read and write, with sub-millisecond latency.
        <table style={{ marginTop: "8px", fontSize: "12px" }}>
          <tr><th>Operation</th><th>What it does</th><th>JS analogy</th></tr>
          <tr><td><code>redis.get(key)</code></td><td>Read a value by key</td><td><code>localStorage.getItem(key)</code> — but shared across all servers</td></tr>
          <tr><td><code>redis.set(key, value)</code></td><td>Write a value</td><td><code>localStorage.setItem(key, value)</code></td></tr>
          <tr><td><code>redis.setex(key, ttl, value)</code></td><td>Write with auto-expiry after <code>ttl</code> seconds</td><td><code>localStorage.setItem</code> + <code>setTimeout(() =&gt; remove(key), ttl * 1000)</code></td></tr>
          <tr><td><code>redis.incr(key)</code></td><td>Atomic increment — thread-safe counter</td><td>No direct equivalent — you'd need a database transaction</td></tr>
        </table>
        <strong>Why not Postgres?</strong> Redis reads in ~0.1ms; Postgres reads in ~5-50ms. For session data that's read on every request, that difference compounds. Redis is also natively atomic (INCR, DECR, Lua scripts) which makes it ideal for concurrency primitives.
        <strong>Why not in-process memory?</strong> Multiple server instances can't share process memory. Redis is the shared state layer between all replicas.
      </div>
      <CodeBlock title="Redis CachedExecutor — Tool Result Cache" language="python" keyLine={3} keyNote="deterministic cache key from tool name + sorted params">{CODE_CACHED_EXECUTOR}</CodeBlock>
      <table>
        <tr><th>Tool</th><th>TTL</th><th>Reason</th></tr>
        <tr><td>searchProperties</td><td>60s</td><td>Results change frequently</td></tr>
        <tr><td>getLocalityDetail</td><td>3600s</td><td>Locality info rarely changes</td></tr>
        <tr><td>calculateEMI</td><td>0s</td><td>Pure computation — always fresh</td></tr>
      </table>

      <h2>7.4 The Adapter / Port Pattern</h2>
      <p>The pipeline stays provider-agnostic through the Port/Adapter pattern. Nodes depend only on <em>protocols</em>, not implementations.</p>
      <CodeBlock title="ClassifierPort — Provider-Agnostic Protocol" language="python" keyLine={3} keyNote="3-line Protocol decouples nodes from LLM provider">{CODE_CLASSIFIER_PORT}</CodeBlock>
      <div className="callout callout-tip"><strong>Why this matters for testing</strong>Nodes are tested against mock ports, not real LLMs. The test suite runs without any API keys. For A/B experiments between providers: flip MODEL_REGISTRY and restart — zero code change.</div>
      <div className="callout callout-info">
        <strong>Module 7 — Reference Answer: Design Exercise</strong>
        <em>Q: You need to add a "get recent news for a locality" tool. Walk through the full integration.</em>
        <br /><br />
        <strong>A:</strong> (1) Register in the tool registry: <code>tool_name="getLocalityNews"</code>, wire params from session (<code>locality_id</code>), set TTL=300s — news is fresh enough for 5 min. (2) Tag the intents that need it: <code>general_housing_query</code> with <code>parallel_group=2</code> (runs after property search). (3) Implement a <code>LocalityNewsPort</code> with one method <code>get_news(locality_id, limit)</code>. (4) Add a concrete adapter that calls the news API. Register it in <code>MODEL_REGISTRY</code>. (5) No changes to any node — <code>fetch_data_node</code> reads the registry and calls whatever tools are listed. (6) Test: unit test the port with a mock. Model eval test: verify the node returns news in <code>pre_fetched_data</code> for the right intents.
      </div>

      <h2>7.5 Designing an SLM Taxonomy Prompt — the Iteration Cycle</h2>
      <p>The taxonomy prompt for the Stage 2 classifier has four components. Each one requires deliberate design, not guesswork.</p>
      <table>
        <tr><th>Component</th><th>What it contains</th><th>Common mistake</th></tr>
        <tr><td><strong>Intent Schema</strong></td><td>JSON output structure the model must produce: fields, types, constraints</td><td>Vague field names → model guesses at semantics</td></tr>
        <tr><td><strong>Intent Taxonomy</strong></td><td>All valid intents with descriptions that disambiguate them from each other</td><td>Descriptions overlap → model picks arbitrarily between similar intents</td></tr>
        <tr><td><strong>Filter Schema</strong></td><td>Valid filter keys + value types + enum values. E.g. <code>bhk: int[]</code>, <code>furnishing: "furnished"|"unfurnished"</code></td><td>Too permissive → model returns <code>bhk: "3-bedroom"</code> instead of <code>bhk: [3]</code></td></tr>
        <tr><td><strong>Few-shot Examples</strong></td><td>Input/output pairs showing difficult cases: ordinal refs, pivots, disambiguation, ambiguous phrasing</td><td>Only "easy" examples → model fails on the 10% of messages that break the pattern</td></tr>
      </table>
      <div className="callout callout-tip">
        <strong>The iteration cycle: run_eval → find failures → add few-shot → re-run</strong>
        <IterationCycleViz />
      </div>
      <CodeBlock title="SLM Taxonomy Prompt — Few-shot Examples" language="yaml" keyLine={22} keyNote="GOOD descriptions disambiguate by user action, not just intent">{CODE_YAML_FEWSHOT}</CodeBlock>
      <div className="callout callout-info"><strong>When accuracy plateaus:</strong> If you've added 5+ few-shot examples for a class and accuracy stays low, the problem isn't the examples — it's the taxonomy description. Rewrite the intent description to be more specific. "The user wants to filter properties" is weak. "The user names one or more numeric, geographic, or feature criteria to narrow the search result set" is testable.</div>

      <h2>7.6 Bad vs Good SLM Taxonomy Prompt</h2>
      <p>The most common failure mode is ambiguous intent descriptions. Here is the same three-intent taxonomy written badly, then correctly:</p>
      <CodeDiff
        brokenTitle="BAD — Vague taxonomy"
        fixedTitle="GOOD — Precise taxonomy"
        language="yaml"
        broken={TAXONOMY_BROKEN}
        fixed={TAXONOMY_FIXED}
      />
      <div className="callout callout-tip">
        <strong>The test for a good taxonomy:</strong> Can you write a unit test for each intent boundary? If "what is RERA?" must always return <code>general</code> and "2BHK in Bandra" must always return <code>property_search</code>, you can write <code>assert classify(msg) == intent</code>. If the descriptions don't let you make that assertion confidently, they're not specific enough.
      </div>
      <QuizSection moduleId={7} title="Module 7" contentHint="Tool registry, wire_param pattern, pre-fetch vs residual tools, caching TTLs, adapter/port pattern, SLM taxonomy iteration cycle, bad vs good intent descriptions disambiguation negative examples" />
    </>
  );
}
