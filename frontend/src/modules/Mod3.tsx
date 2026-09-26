import { useState } from "react";
import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from '../components/CodeBlock';

// ── RedisKeyViz component ─────────────────────────────────────────────────────

const REDIS_KEYS = [
  {
    id: 'session:{id}',
    key: 'housing_bot:session:{session_id}:data',
    type: 'hash',
    ttl: '24h TTL',
    color: '#89b4fa',
    typeLabel: 'JSON',
    cmd: 'SETEX housing_bot:session:{id}:data 86400 {json}',
    shape: '{ user_id, active_filters, conversation_history[], created_at }',
    ttlReason: '24 hours — matches session timeout; auto-cleanup prevents memory leak. Re-created on next session start.',
  },
  {
    id: 'turn_count:{id}',
    key: 'housing_bot:session:{session_id}:turn_count',
    type: 'counter',
    ttl: '24h TTL',
    color: '#94e2d5',
    typeLabel: 'counter',
    cmd: 'INCR housing_bot:session:{id}:turn_count',
    shape: 'integer (auto-incremented on every pipeline run)',
    ttlReason: '24 hours — same lifetime as session data. Used for per-session rate limiting.',
  },
  {
    id: 'llm_gate:concurrency',
    key: 'housing_bot:llm_gate:concurrency',
    type: 'counter',
    ttl: 'no TTL',
    color: '#94e2d5',
    typeLabel: 'counter',
    cmd: 'INCR / DECR housing_bot:llm_gate:concurrency',
    shape: 'integer (current concurrent LLM calls, ceiling = 10)',
    ttlReason: 'No TTL — persistent global counter. Decremented in finally block. Leaked on crash auto-heals via health-check reset.',
  },
  {
    id: 'ab_experiment:{id}',
    key: 'housing_bot:ab_experiment:{session_id}',
    type: 'string',
    ttl: '7d TTL',
    color: '#a6e3a1',
    typeLabel: 'string',
    cmd: 'SET housing_bot:ab_experiment:{id} "treatment" EX 604800',
    shape: 'string: "control" | "treatment"',
    ttlReason: '7 days — must survive across multiple user sessions so the same user stays in the same experiment bucket for the full duration.',
  },
];

function RedisKeyViz() {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const selected = REDIS_KEYS.find(k => k.id === selectedKey) ?? null;

  const svgW = 560;
  const pillH = 32;
  const pillY0 = 18;
  const gap = 10;
  const totalRows = REDIS_KEYS.length;
  const legendH = 30;
  const svgH = pillY0 + totalRows * (pillH + gap) + legendH;

  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: '8px', padding: '20px', margin: '20px 0', overflow: 'hidden' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6c7086', marginBottom: '14px' }}>
        REDIS KEY STRUCTURE — NAMESPACING FOR MULTI-TENANT SAFETY
      </div>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ display: 'block', margin: '0 auto' }} aria-label="Redis key namespace hierarchy">
        {REDIS_KEYS.map((k, i) => {
          const y = pillY0 + i * (pillH + gap);
          const badgeX = svgW - 130;
          const ttlX = svgW - 54;
          const isSelected = selectedKey === k.id;
          const isHovered = hoveredKey === k.id;
          const isActive = isSelected || isHovered;
          return (
            <g
              key={k.id}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedKey(isSelected ? null : k.id)}
              onMouseEnter={() => setHoveredKey(k.id)}
              onMouseLeave={() => setHoveredKey(null)}
            >
              <rect
                x={8} y={y} width={svgW - 16} height={pillH} rx="6"
                fill={isSelected ? k.color + '2a' : isHovered ? k.color + '1a' : k.color + '11'}
                stroke={isActive ? k.color : k.color + '55'}
                strokeWidth={isSelected ? 1.5 : isHovered ? 1.2 : 1}
                opacity={isActive ? 1 : 0.85}
              />
              <text x={16} y={y + 21} fontSize="10" fill={isActive ? k.color : k.color + 'bb'} fontFamily="monospace">{k.key}</text>
              <rect x={badgeX} y={y + 6} width={44} height={18} rx="4" fill={k.color + '33'} stroke={k.color} strokeWidth="1" />
              <text x={badgeX + 22} y={y + 19} textAnchor="middle" fontSize="9" fill={k.color}>{k.typeLabel}</text>
              <text x={ttlX + 30} y={y + 21} textAnchor="end" fontSize="9" fill="#6c7086">{k.ttl}</text>
              <text x={svgW - 16} y={y + 21} textAnchor="end" fontSize="10" fill={isActive ? k.color : k.color + '88'}>
                {isSelected ? '▲' : '▼'}
              </text>
            </g>
          );
        })}
        <g>
          <rect x={8} y={svgH - 24} width={10} height={10} rx="2" fill="#89b4fa44" stroke="#89b4fa" />
          <text x={22} y={svgH - 15} fontSize="9" fill="#89b4fa">hash/JSON</text>
          <rect x={80} y={svgH - 24} width={10} height={10} rx="2" fill="#94e2d544" stroke="#94e2d5" />
          <text x={94} y={svgH - 15} fontSize="9" fill="#94e2d5">counter</text>
          <rect x={148} y={svgH - 24} width={10} height={10} rx="2" fill="#a6e3a144" stroke="#a6e3a1" />
          <text x={162} y={svgH - 15} fontSize="9" fill="#a6e3a1">string</text>
          <text x={svgW - 8} y={svgH - 15} textAnchor="end" fontSize="9" fill="#6c7086">
            Namespace prefix = {'{app}:{domain}:{identifier}'} — prevents collisions
          </text>
        </g>
      </svg>

      {selected !== null && (
        <div style={{ marginTop: '10px', background: '#1e1e2e', border: `1px solid ${selected.color}44`, borderRadius: '6px', padding: '14px 16px', fontSize: '0.8rem' }}>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ color: '#6c7086', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Redis Command</span>
            <pre style={{ margin: '4px 0 0', background: '#0d0d14', padding: '8px 12px', borderRadius: '5px', color: selected.color, fontFamily: 'monospace', fontSize: '0.78rem', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{selected.cmd}</pre>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ color: '#6c7086', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Data Shape</span>
            <div style={{ marginTop: '4px', color: '#bac2de', fontFamily: 'monospace', fontSize: '0.8rem' }}>{selected.shape}</div>
          </div>
          <div>
            <span style={{ color: '#6c7086', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>TTL Rationale</span>
            <div style={{ marginTop: '4px', color: '#6c7086', fontSize: '0.8rem', lineHeight: 1.5 }}>{selected.ttlReason}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── LuaCASViz component ───────────────────────────────────────────────────────

function LuaCASViz() {
  const [step, setStep] = useState(0);
  const STEPS = [
    { label: 'Both requests read session version = 5', highlight: 'both-read' },
    { label: 'Request A writes — CAS check passes (ver=5 matches) → version becomes 6', highlight: 'a-wins' },
    { label: 'Request B tries to write — CAS fails (ver changed to 6) → must retry', highlight: 'b-retry' },
    { label: 'Request B retries — reads version = 6, writes version = 7 successfully', highlight: 'b-done' },
  ];

  const svgW = 560;
  const svgH = 200;

  const laneAY = 30;
  const laneBY = 110;
  const laneH = 50;

  const boxes = [
    { x: 20, w: 90, label: 'Read v=5', lane: 'both', cas: false },
    { x: 140, w: 90, label: 'CAS check\nv=5?', lane: 'a', cas: true },
    { x: 260, w: 90, label: 'Write v=6\n✓ wins', lane: 'a', cas: false },
    { x: 140, w: 90, label: 'CAS check\nv=5?', lane: 'b', cas: true },
    { x: 260, w: 90, label: 'FAIL\nv changed', lane: 'b', cas: false },
    { x: 370, w: 90, label: 'Retry\nRead v=6', lane: 'b', cas: false },
    { x: 470, w: 70, label: 'Write v=7\n✓ ok', lane: 'b', cas: false },
  ];

  const getLaneY = (lane: string) => lane === 'a' ? laneAY : laneBY;
  const isVisible = (boxLane: string) => {
    if (step === 0) return boxLane === 'both';
    if (step === 1) return boxLane === 'both' || (boxLane === 'a');
    if (step === 2) return true;
    return true;
  };

  const getBoxFill = (box: typeof boxes[0]) => {
    if (box.cas) return '#f9e2af22';
    if (box.label.includes('FAIL')) return '#f38ba822';
    if (box.label.includes('✓')) return '#a6e3a122';
    return '#313244';
  };
  const getBoxStroke = (box: typeof boxes[0]) => {
    if (box.cas) return '#f9e2af';
    if (box.label.includes('FAIL')) return '#f38ba8';
    if (box.label.includes('✓')) return '#a6e3a1';
    return '#45475a';
  };
  const getTextColor = (box: typeof boxes[0]) => {
    if (box.cas) return '#f9e2af';
    if (box.label.includes('FAIL')) return '#f38ba8';
    if (box.label.includes('✓')) return '#a6e3a1';
    return '#cdd6f4';
  };

  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: '8px', padding: '20px', margin: '20px 0', overflow: 'hidden' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6c7086', marginBottom: '14px' }}>
        LUA ATOMIC CAS — PREVENTING RACE CONDITIONS IN REDIS SESSION UPDATES
      </div>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ display: 'block', margin: '0 auto' }} aria-label="Lua CAS atomic locking swim lanes">
        <rect x={0} y={laneAY - 8} width={svgW} height={laneH} rx="4" fill="#89b4fa08" />
        <rect x={0} y={laneBY - 8} width={svgW} height={laneH} rx="4" fill="#cba6f708" />
        <text x={4} y={laneAY + 6} fontSize="10" fill="#89b4fa" fontFamily="monospace">Request A</text>
        <text x={4} y={laneBY + 6} fontSize="10" fill="#cba6f7" fontFamily="monospace">Request B</text>
        <line x1={100} y1={svgH - 28} x2={svgW - 10} y2={svgH - 28} stroke="#45475a" strokeWidth="1" />
        <text x={svgW / 2} y={svgH - 12} textAnchor="middle" fontSize="10" fill="#6c7086">time →</text>
        {boxes.map((box, i) => {
          const yBase = box.lane === 'both' ? laneAY : getLaneY(box.lane);
          const visible = isVisible(box.lane === 'both' ? 'both' : box.lane);
          if (!visible && !(step >= 2 && box.lane === 'b') && !(step >= 1 && box.lane === 'a') && box.lane !== 'both') return null;
          const lines = box.label.split('\n');
          return (
            <g key={i} opacity={visible ? 1 : 0.2}>
              <rect x={box.x} y={yBase + 10} width={box.w} height={28} rx="4"
                fill={getBoxFill(box)} stroke={getBoxStroke(box)} strokeWidth="1.5" />
              {lines.map((line, li) => (
                <text key={li} x={box.x + box.w / 2} y={yBase + 24 + li * 12}
                  textAnchor="middle" fontSize="9" fill={getTextColor(box)} fontFamily="monospace">
                  {line}
                </text>
              ))}
              {box.lane === 'both' && (
                <>
                  <rect x={box.x} y={laneBY + 10} width={box.w} height={28} rx="4"
                    fill={getBoxFill(box)} stroke="#cba6f7" strokeWidth="1.5" />
                  {lines.map((line, li) => (
                    <text key={li} x={box.x + box.w / 2} y={laneBY + 24 + li * 12}
                      textAnchor="middle" fontSize="9" fill="#cdd6f4" fontFamily="monospace">
                      {line}
                    </text>
                  ))}
                </>
              )}
            </g>
          );
        })}
        <text x={140 + 45} y={laneAY + 8} textAnchor="middle" fontSize="9" fill="#f9e2af">
          ← atomic check
        </text>
      </svg>
      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {STEPS.map((s, i) => (
          <button key={i} onClick={() => setStep(i)}
            style={{
              background: step === i ? '#89b4fa22' : '#313244',
              color: step === i ? '#89b4fa' : '#cdd6f4',
              border: `1px solid ${step === i ? '#89b4fa' : '#45475a'}`,
              borderRadius: '6px', padding: '5px 12px', fontSize: '0.78rem', cursor: 'pointer', marginRight: '8px',
            }}>
            Step {i + 1}
          </button>
        ))}
      </div>
      <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#bac2de', background: '#1e1e2e', borderRadius: '6px', padding: '8px 12px' }}>
        {STEPS[step].label}
      </div>
      <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#6c7086' }}>
        Without Lua MULTI/EXEC: race condition possible. With atomic Lua: exactly-once update guaranteed.
      </div>
    </div>
  );
}

// ── SessionEvolutionStepper component ────────────────────────────────────────

type EvolutionDeltaEntry = { key: string; value: string; status: 'new' | 'updated' | 'cleared' };

type EvolutionStep = {
  turnLabel: string;
  userSaid: string;
  description: string;
  delta: EvolutionDeltaEntry[];
  resultingState: Record<string, unknown>;
};

const EVOLUTION_STEPS: EvolutionStep[] = [
  {
    turnLabel: 'Turn 1',
    userSaid: '"2BHK in Bandra"',
    description: 'First query — city, locality, and BHK all added fresh.',
    delta: [
      { key: 'city', value: '"Mumbai"', status: 'new' },
      { key: 'locality', value: '["Bandra"]', status: 'new' },
      { key: 'bhk', value: '[2]', status: 'new' },
    ],
    resultingState: {
      city: 'Mumbai',
      locality: ['Bandra'],
      bhk: [2],
    },
  },
  {
    turnLabel: 'Turn 2',
    userSaid: '"Under 50k"',
    description: 'Budget constraint added. Existing filters (city, locality, bhk) persist unchanged.',
    delta: [
      { key: 'budget_max', value: '50000', status: 'new' },
    ],
    resultingState: {
      city: 'Mumbai',
      locality: ['Bandra'],
      bhk: [2],
      budget_max: 50000,
    },
  },
  {
    turnLabel: 'Turn 3',
    userSaid: '"Also Andheri"',
    description: 'User expands search area. Locality list is updated (replaced) to include both areas.',
    delta: [
      { key: 'locality', value: '["Bandra", "Andheri"]', status: 'updated' },
    ],
    resultingState: {
      city: 'Mumbai',
      locality: ['Bandra', 'Andheri'],
      bhk: [2],
      budget_max: 50000,
    },
  },
  {
    turnLabel: 'Turn 4',
    userSaid: '"Reset, show Pune 3BHK"',
    description: 'Full pivot — all previous filters cleared, entirely new search context set.',
    delta: [
      { key: 'city', value: '(cleared)', status: 'cleared' },
      { key: 'locality', value: '(cleared)', status: 'cleared' },
      { key: 'bhk', value: '(cleared)', status: 'cleared' },
      { key: 'budget_max', value: '(cleared)', status: 'cleared' },
      { key: 'city', value: '"Pune"', status: 'new' },
      { key: 'bhk', value: '[3]', status: 'new' },
    ],
    resultingState: {
      city: 'Pune',
      bhk: [3],
    },
  },
];

const deltaColor: Record<string, string> = {
  new: 'var(--accent2, #a6e3a1)',
  updated: '#89b4fa',
  cleared: 'var(--accent3, #f38ba8)',
};
const deltaLabel: Record<string, string> = {
  new: 'NEW',
  updated: 'UPDATED',
  cleared: 'CLEARED',
};

function SessionEvolutionStepper() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {EVOLUTION_STEPS.map((step, i) => {
        const isOpen = openIdx === i;
        return (
          <div
            key={i}
            style={{
              border: '1px solid #313244',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#181825',
            }}
          >
            {/* Step header */}
            <button
              onClick={() => setOpenIdx(isOpen ? null : i)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: '#cdd6f4',
              }}
            >
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#89b4fa22',
                color: '#89b4fa',
                fontSize: '0.78rem',
                fontWeight: 700,
                flexShrink: 0,
              }}>{i + 1}</span>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#89b4fa', minWidth: '52px' }}>{step.turnLabel}</span>
              <span style={{ fontSize: '0.82rem', color: '#cdd6f4', flex: 1, fontStyle: 'italic' }}>{step.userSaid}</span>
              <span style={{
                fontSize: '0.78rem',
                color: isOpen ? '#89b4fa' : '#6c7086',
                transition: 'transform 0.2s, color 0.15s',
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                display: 'inline-block',
                lineHeight: 1,
              }}>&#8964;</span>
            </button>

            {/* Expanded body */}
            <div style={{ maxHeight: isOpen ? '500px' : '0px', overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
              <div style={{ borderTop: '1px solid #313244', padding: '14px 16px 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Left: Filter Delta */}
                  <div>
                    <div style={{
                      fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: '#6c7086', marginBottom: '8px',
                    }}>
                      Filter Delta
                    </div>
                    <div style={{
                      background: '#0d0d14', padding: '10px 12px', borderRadius: '6px',
                      display: 'flex', flexDirection: 'column', gap: '6px',
                    }}>
                      {step.delta.map((entry, di) => (
                        <div key={di} style={{ display: 'flex', alignItems: 'baseline', gap: '8px', fontSize: '0.8rem' }}>
                          <code style={{ color: deltaColor[entry.status], fontFamily: 'monospace', flex: 1 }}>
                            {entry.key}: {entry.value}
                          </code>
                          <span style={{
                            fontSize: '0.62rem', fontWeight: 700,
                            color: deltaColor[entry.status],
                            minWidth: '54px', textAlign: 'right', letterSpacing: '0.04em',
                          }}>
                            {deltaLabel[entry.status]}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#a6adc8', lineHeight: 1.5 }}>
                      {step.description}
                    </div>
                  </div>

                  {/* Right: Resulting State */}
                  <div>
                    <div style={{
                      fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: '#6c7086', marginBottom: '8px',
                    }}>
                      Resulting State
                    </div>
                    <pre style={{
                      background: '#0d0d14', padding: '10px 12px', borderRadius: '6px',
                      fontSize: '0.78rem', color: '#cba6f7', fontFamily: 'monospace',
                      overflowX: 'auto', lineHeight: 1.6, margin: 0,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                      {JSON.stringify(step.resultingState, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Static data / code snippets ───────────────────────────────────────────────

const CODE_BOT_STATE = `class BotState(TypedDict):
    # Input (set at pipeline start)
    raw_message:        str
    session:            Dict[str, Any]
    request_id:         str

    # Set by nodes — each node owns its keys
    safety_result:      Optional[Dict]    # owned by safety_node
    normalized_message: Optional[str]     # owned by normalize_node
    domain:             Optional[str]     # owned by route_domain_node
    classification:     Optional[Dict]    # owned by classify_node
    resolved_entities:  Optional[Dict]    # owned by resolve_entities_node
    routing:            Optional[Dict]    # owned by route_node
    pre_fetched_data:   Optional[Dict]    # owned by fetch_data_node
    system_prompt:      Optional[str]     # owned by build_prompt_node
    llm_response:       Optional[Dict]    # owned by llm_node
    validated_text:     Optional[str]     # owned by validate_output_node
    bot_response:       Optional[Any]     # SHORT-CIRCUIT SENTINEL`;

const CODE_SESSION_STATE = `{
    "session_id":          "uuid",
    "turn_count":          4,
    "active_filters":      {"city": "Mumbai", "bhk": [2], "price_max": 20000000},
    "turn_history":        [
        {"role": "user",      "content": "3BHK instead"},
        {"role": "assistant", "content": "Here are 3BHK options..."}
    ],
    "last_3_turns":        [
        {"user": "...", "bot": "...(truncated 400 chars)...", "main_intent": "..."}
    ],
    "carousel_state":      {"type": "property", "items": [...], "stored_at_turn": 3},
    "last_intent":         {"main_intent": "property_search", "sub_intent": "filter_search"},
    "version":             3
}`;

const CODE_LUA = `-- Runs ATOMICALLY on Redis server — no race condition possible
local ver_key = KEYS[2]
local stored  = tonumber(redis.call('GET', ver_key) or '0')
if stored ~= tonumber(ARGV[1]) then
    return 0  -- conflict: caller should retry
end
redis.call('SETEX', KEYS[1], ttl, ARGV[2])           -- save session JSON
redis.call('SETEX', ver_key, ttl, tostring(stored+1)) -- increment version
return 1`;

export function Mod3() {
  return (
    <>
      <RedisKeyViz />

      <h2>6.1 BotState — The Typed Spine</h2>
      <CodeBlock title="BotState — Typed Pipeline Spine" language="python" keyLine={18} keyNote="bot_response is the short-circuit sentinel">{CODE_BOT_STATE}</CodeBlock>
      <div className="callout callout-warn"><strong>bot_response is the short-circuit signal</strong>Any node can set bot_response to stop the pipeline. This is more expressive than exceptions — it carries the response content AND stops execution. The conditional edge checks: if bot_response is set → route to END.</div>

      <h2>6.2 Session State — The User's Memory</h2>
      <CodeBlock title="Session State — Redis Persisted Shape" language="json" keyLine={13} keyNote="version field enables optimistic locking">{CODE_SESSION_STATE}</CodeBlock>

      <h2>6.3 Redis — Optimistic Locking with Lua</h2>
      <LuaCASViz />
      <p><strong>Why optimistic locking?</strong> Two simultaneous requests to the same session both read version=3, both compute version=4. Without locking, one silently overwrites the other.</p>
      <CodeBlock title="Lua Atomic CAS — Redis Optimistic Lock" language="text" keyLine={3} keyNote="version mismatch triggers retry, not overwrite">{CODE_LUA}</CodeBlock>
      <div className="callout callout-tip"><strong>Why a separate version key?</strong>The original script read the full session JSON and decoded it in Lua just to extract the version field. At turn 20 with full message history, session JSON is 10+ KB. Now the version is a separate 1-3 byte key — the Lua script reads a tiny key instead of parsing 10KB on every write.</div>

      <h2>6.4 turn_history vs last_3_turns</h2>
      <div className="two-col">
        <div className="col-card">
          <h4>turn_history</h4>
          <p style={{ fontSize: "12px" }}>Anthropic-format messages for the LLM. Full user messages + full bot responses. Up to 20 messages (~10 turns). Used by llm_node as the <code>messages</code> parameter. The LLM needs this to remember the full conversation.</p>
        </div>
        <div className="col-card">
          <h4>last_3_turns</h4>
          <p style={{ fontSize: "12px" }}>Condensed for the classifier SLM. Bot response truncated to 400 chars. Only last 3 turns. <strong>Critical:</strong> includes bot response text — this is what lets the SLM understand "godrej" as a disambiguation response when the bot just asked "Shapoorji or Godrej?"</p>
        </div>
      </div>

      <h2>6.5 Session State Evolution — A Real 4-Turn Conversation</h2>
      <p>The question students ask most: <em>"When does a filter get replaced vs. accumulated? What exactly is in the session after each turn?"</em> Click each turn to see the filter delta and resulting state.</p>
      <SessionEvolutionStepper />
      <div className="callout callout-info">
        <strong>The three merging rules:</strong>
        <ol style={{ margin: "8px 0 0 16px" }}>
          <li><strong>filter_delta keys are merged into active_filters</strong> — only the keys in filter_delta are updated; other keys persist. "bhk:[2]" doesn't affect locality or price_max.</li>
          <li><strong>pivot=true clears property-specific keys</strong> (bhk, floor, amenities, active_property_id) but not universal keys (city, price_max). The user is starting a new property search, not a new city search.</li>
          <li><strong>Lists are replaced, not appended</strong> — filter_delta: {"{localities:[\"Andheri\"]}"} replaces all localities with ["Andheri"]. To ADD Andheri alongside Bandra, the client must send ["Bandra", "Andheri"] in filter_delta.</li>
        </ol>
      </div>
      <QuizSection moduleId={6} title="Module 6" contentHint="BotState schema, bot_response short-circuit, session shape, Redis Lua optimistic locking, turn_history vs last_3_turns, 4-turn state evolution" />
    </>
  );
}
