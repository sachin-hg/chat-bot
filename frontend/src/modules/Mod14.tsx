import { useState, useRef, useEffect } from "react";
import { QuizSection } from "../components/QuizSection";
import { GOTCHAS, Gotcha } from "../data/staticData";
import { CodeBlock } from '../components/CodeBlock';

const CODE_EXERCISE_A = `async def sse_generator(queue: asyncio.Queue):
    try:
        while True:
            event = await queue.get()
            if event is None:
                break
            yield f"data: {json.dumps(event)}\\n\\n"
    finally:
        await redis.decr("active_connections")   # can raise on Redis error
    yield "data: \\"connection_close\\"\\n\\n"    # send close signal`;

const CODE_EXERCISE_B = `def build_last_3_turns(turn_history: list[dict]) -> list[dict]:
    """Return last 3 user+bot turn pairs for SLM classifier context."""
    return turn_history[-6:]   # 3 user + 3 bot messages`;

const CODE_EXERCISE_C = `@dataclass
class IntentRecord:
    name: str
    tier: int
    required_tools: list[str]
    clear_keys: list[str]    # session keys to clear on this intent
    min_confidence: float = 0.7

# intent_registry.py — 200 lines later
def get_requirements(intent: str) -> IntentRecord:
    return INTENT_REGISTRY[intent]

# filter_apply_node — clears active_filters on reset_filters intent
def filter_apply_node(state: BotState) -> BotState:
    if state.intent == "reset_filters":
        return state | {"active_filters": {}}
    # ... applies new filters`;

// ---------------------------------------------------------------------------
// BugExerciseCard
// ---------------------------------------------------------------------------
interface BugExerciseCardProps {
  title: string;
  bugLine: string;
  bugNote: string;
  fixLine: string;
  children: React.ReactNode;
}

function BugExerciseCard({ title, bugLine, bugNote, fixLine, children }: BugExerciseCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md, 8px)',
      padding: '16px',
      margin: '12px 0',
    }}>
      {/* Header row: badge + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          background: '#f59e0b',
          color: '#1c1a10',
          borderRadius: '4px',
          padding: '2px 7px',
          whiteSpace: 'nowrap',
        }}>Bug Report</span>
        <span style={{ fontWeight: 600, color: 'var(--text, #cdd6f4)', fontSize: '14px' }}>{title}</span>
      </div>

      {/* Code block with buggy code */}
      {children}

      {/* Reveal button */}
      <button
        onClick={() => setIsRevealed(v => !v)}
        style={{
          width: '100%',
          marginTop: '12px',
          padding: '9px 0',
          background: 'var(--bg3, #313244)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--text, #cdd6f4)',
          fontWeight: 600,
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'background .15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg4, #45475a)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg3, #313244)')}
      >
        {isRevealed ? 'Hide answer ↑' : 'Find the bug →'}
      </button>

      {/* Animated reveal panel */}
      <div style={{
        maxHeight: isRevealed ? '600px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.35s ease',
      }}>
        <div style={{ paddingTop: '12px' }}>
          {/* Buggy line */}
          <div style={{
            borderLeft: '3px solid var(--accent3, #f38ba8)',
            paddingLeft: '10px',
            marginBottom: '10px',
            background: '#f38ba808',
            borderRadius: '0 4px 4px 0',
            padding: '8px 10px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent3, #f38ba8)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Problematic line</div>
            <code style={{ fontSize: '12px', color: 'var(--accent3, #f38ba8)', display: 'block', marginBottom: '4px' }}>{bugLine}</code>
            <div style={{ fontSize: '12px', color: '#bac2de' }}>{bugNote}</div>
          </div>

          {/* Fix */}
          <div style={{
            borderLeft: '3px solid var(--accent2, #a6e3a1)',
            padding: '8px 10px',
            background: '#a6e3a108',
            borderRadius: '0 4px 4px 0',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent2, #a6e3a1)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fix</div>
            <code style={{ fontSize: '12px', color: 'var(--accent2, #a6e3a1)', display: 'block', whiteSpace: 'pre-wrap' }}>{fixLine}</code>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SeverityMatrix
// ---------------------------------------------------------------------------
function SeverityMatrix({
  gotchaRefs,
  openStates,
  setOpenStates,
}: {
  gotchaRefs: React.MutableRefObject<HTMLDivElement[]>;
  openStates: boolean[];
  setOpenStates: React.Dispatch<React.SetStateAction<boolean[]>>;
}) {
  const [hoveredGotcha, setHoveredGotcha] = useState<number | null>(null);
  const [selectedGotcha, setSelectedGotcha] = useState<number | null>(null);
  const points = [
    { label: 'connection_close', x: 310, y: 60, color: '#f38ba8', quad: 'CRITICAL', desc: 'Must fire before any infrastructure writes. If Redis/Kafka is slow, the user sees a frozen UI.' },
    { label: 'background task leak', x: 280, y: 90, color: '#f38ba8', quad: 'CRITICAL', desc: 'asyncio tasks not awaited or cancelled on disconnect accumulate silently and OOM the process.' },
    { label: 'version conflict', x: 100, y: 70, color: '#fab387', quad: 'WATCH', desc: 'SLM + LangGraph pin drift: one team upgrades langgraph, SLM prompt format breaks silently.' },
    { label: 'SLM context limit', x: 80, y: 100, color: '#fab387', quad: 'WATCH', desc: 'Full bot responses in classifier context (500–1000 tokens each) crowd out the user query.' },
    { label: 'no-text-response', x: 300, y: 220, color: '#f9e2af', quad: 'HYGIENE', desc: 'LLM returns only a tool_call with no accompanying text. UI renders an empty bubble.' },
    { label: 'dead config', x: 270, y: 245, color: '#f9e2af', quad: 'HYGIENE', desc: 'clear_keys populated in schema but no node ever reads it — silent feature rot.' },
    { label: 'first-turn empty session', x: 80, y: 230, color: '#6c7086', quad: 'LOW PRIORITY', desc: 'No prior turns, no session state. Tools needing prefetch data return empty on turn 1.' },
    { label: 'cascade tax', x: 60, y: 255, color: '#6c7086', quad: 'LOW PRIORITY', desc: 'Every node touches state. One bad write propagates through all downstream nodes.' },
  ];

  const handleClick = (i: number) => {
    setSelectedGotcha(i);
    // Auto-open the corresponding GotchaCard
    setOpenStates(prev => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
  };

  useEffect(() => {
    if (selectedGotcha !== null) {
      const el = gotchaRefs.current[selectedGotcha];
      if (el) {
        // Small delay to allow state update + re-render before scrolling
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // 300ms highlight pulse via temporary outline
          el.style.outline = `2px solid ${points[selectedGotcha].color}`;
          el.style.outlineOffset = '2px';
          setTimeout(() => {
            el.style.outline = '';
            el.style.outlineOffset = '';
          }, 800);
        }, 50);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGotcha]);

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>GOTCHA SEVERITY MATRIX — WHERE TO FOCUS YOUR DEFENSIVE CODING</div>
      <svg viewBox="0 0 400 320" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="2D severity matrix showing 8 production gotchas plotted by likelihood and severity">
        {/* Quadrant backgrounds */}
        <rect x="50" y="30" width="155" height="140" rx="4" fill="#f38ba808"/>
        <rect x="205" y="30" width="155" height="140" rx="4" fill="#f38ba818"/>
        <rect x="50" y="170" width="155" height="125" rx="4" fill="#f9e2af08"/>
        <rect x="205" y="170" width="155" height="125" rx="4" fill="#f9e2af14"/>

        {/* Quadrant labels */}
        <text x="127" y="50" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fab387" opacity="0.7">WATCH</text>
        <text x="282" y="50" textAnchor="middle" fontSize="10" fontWeight="700" fill="#f38ba8" opacity="0.9">CRITICAL</text>
        <text x="127" y="190" textAnchor="middle" fontSize="10" fontWeight="700" fill="#6c7086">LOW PRIORITY</text>
        <text x="282" y="190" textAnchor="middle" fontSize="10" fontWeight="700" fill="#f9e2af" opacity="0.8">HYGIENE</text>

        {/* Axes */}
        <line x1="50" y1="295" x2="370" y2="295" stroke="#45475a" strokeWidth="1.5"/>
        <line x1="50" y1="295" x2="50" y2="25" stroke="#45475a" strokeWidth="1.5"/>

        {/* Axis center dividers */}
        <line x1="205" y1="295" x2="205" y2="25" stroke="#45475a" strokeWidth="0.8" strokeDasharray="4 3"/>
        <line x1="50" y1="168" x2="370" y2="168" stroke="#45475a" strokeWidth="0.8" strokeDasharray="4 3"/>

        {/* Axis labels */}
        <text x="210" y="312" fontSize="11" fill="#bac2de" fontWeight="600">Likelihood →</text>
        <text x="10" y="170" fontSize="11" fill="#bac2de" fontWeight="600" transform="rotate(-90,18,160)">Severity →</text>
        <text x="55" y="310" fontSize="10" fill="#6c7086">Low</text>
        <text x="345" y="310" fontSize="10" fill="#6c7086">High</text>
        <text x="28" y="295" fontSize="10" fill="#6c7086">Low</text>
        <text x="28" y="35" fontSize="10" fill="#6c7086">High</text>

        {/* Data points */}
        {points.map((p, i) => {
          const isSel = selectedGotcha === i;
          const isActive = hoveredGotcha === i || isSel;
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredGotcha === i ? 11 : 8}
                fill={isActive ? `${p.color}55` : `${p.color}33`}
                stroke={p.color}
                strokeWidth={isSel ? 2.5 : isActive ? 2 : 1.5}
                onMouseEnter={() => setHoveredGotcha(i)}
                onMouseLeave={() => setHoveredGotcha(null)}
                onClick={() => handleClick(i)}
                style={{transition:'r .15s',cursor:'pointer'}}
              />
              <text x={p.x + (isActive ? 14 : 11)} y={p.y + 4} fontSize={isActive ? 10 : 9.5}
                fill={p.color} fontWeight={isActive ? '700' : '400'}
                style={{pointerEvents:'none'}}>{p.label}</text>
              {isActive && (
                <text x={p.x} y={p.y - 14} textAnchor="middle" fontSize="9" fill={p.color}
                  fontWeight="700" style={{pointerEvents:'none'}}>{p.quad}</text>
              )}
            </g>
          );
        })}
      </svg>
      <div style={{textAlign:'center',fontSize:'0.75rem',color:'#6c7086',marginTop:'8px',letterSpacing:'0.03em'}}>
        Click a circle to jump to that gotcha ↓
      </div>
      {(selectedGotcha !== null) && (
        <div style={{marginTop:'10px',padding:'10px 14px',background:'#1e1e2e',borderRadius:'6px',
          borderLeft:`3px solid ${points[selectedGotcha].color}`,fontSize:'0.82rem',color:'#cdd6f4'}}>
          <span style={{color:points[selectedGotcha].color,fontWeight:700,marginRight:'8px'}}>
            {points[selectedGotcha].label}
          </span>
          <span style={{color:'#6c7086',fontSize:'0.75rem',textTransform:'uppercase',
            letterSpacing:'0.06em',marginRight:'8px'}}>{points[selectedGotcha].quad}</span>
          {points[selectedGotcha].desc}
        </div>
      )}
    </div>
  );
}

function ConnectionCloseViz() {
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <style>{`
        @keyframes dashFlow14b { to { stroke-dashoffset: -14; } }
        .dash-anim-14b { animation: dashFlow14b 1s linear infinite; }
      `}</style>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>GOTCHA: connection_close MUST FIRE BEFORE INFRASTRUCTURE WRITES</div>
      <svg viewBox="0 0 560 180" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Diagram showing wrong and correct placement of connection_close relative to Redis and Kafka writes">
        <defs>
          <marker id="arr-14a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#f38ba8"/>
          </marker>
          <marker id="arr-14b" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#a6e3a1"/>
          </marker>
        </defs>

        {/* WRONG side */}
        <rect x="10" y="10" width="255" height="24" rx="4" fill="#f38ba811" stroke="#f38ba8" strokeWidth="1"/>
        <text x="20" y="27" fontSize="11" fontWeight="700" fill="#f38ba8">WRONG ✗ — connection_close last</text>

        {['pipeline done', 'save to Redis', 'write to Kafka', 'connection_close'].map((label, i) => {
          const x = 15 + i * 58;
          const isLast = i === 3;
          return (
            <g key={i}>
              <rect x={x} y="50" width="50" height="34" rx="6" fill={isLast ? '#f38ba833' : '#1e1e2e'} stroke={isLast ? '#f38ba8' : '#45475a'} strokeWidth={isLast ? 2 : 1}/>
              <text x={x + 25} y="64" textAnchor="middle" fontSize="8.5" fill={isLast ? '#f38ba8' : '#bac2de'}>{label.split(' ').slice(0,2).join(' ')}</text>
              <text x={x + 25} y="76" textAnchor="middle" fontSize="8.5" fill={isLast ? '#f38ba8' : '#bac2de'}>{label.split(' ').slice(2).join(' ')}</text>
              {i < 3 && (
                <line x1={x + 50} y1="67" x2={x + 57} y2="67" stroke="#f38ba8" strokeWidth="1.5" markerEnd="url(#arr-14a)"
                  strokeDasharray="4 3" className="dash-anim-14b"/>
              )}
            </g>
          );
        })}

        <rect x="15" y="95" width="235" height="28" rx="4" fill="#f38ba811"/>
        <text x="25" y="108" fontSize="9.5" fill="#f38ba8">If Redis is slow: user waits 200ms extra</text>
        <text x="25" y="119" fontSize="9.5" fill="#f38ba8">with no feedback — UX blocked by infra</text>

        {/* Divider */}
        <line x1="278" y1="10" x2="278" y2="170" stroke="#45475a" strokeWidth="1" strokeDasharray="4 3"/>

        {/* RIGHT side */}
        <rect x="290" y="10" width="255" height="24" rx="4" fill="#a6e3a111" stroke="#a6e3a1" strokeWidth="1"/>
        <text x="300" y="27" fontSize="11" fontWeight="700" fill="#a6e3a1">RIGHT ✓ — connection_close first</text>

        {['pipeline done', 'connection_close', 'save to Redis', 'write to Kafka'].map((label, i) => {
          const x = 295 + i * 58;
          const isCC = i === 1;
          return (
            <g key={i}>
              <rect x={x} y="50" width="50" height="34" rx="6" fill={isCC ? '#a6e3a133' : '#1e1e2e'} stroke={isCC ? '#a6e3a1' : '#45475a'} strokeWidth={isCC ? 2 : 1}/>
              <text x={x + 25} y="64" textAnchor="middle" fontSize="8.5" fill={isCC ? '#a6e3a1' : '#bac2de'}>{label.split(' ').slice(0,2).join(' ')}</text>
              <text x={x + 25} y="76" textAnchor="middle" fontSize="8.5" fill={isCC ? '#a6e3a1' : '#bac2de'}>{label.split(' ').slice(2).join(' ')}</text>
              {i < 3 && (
                <line x1={x + 50} y1="67" x2={x + 57} y2="67" stroke="#a6e3a1" strokeWidth="1.5" markerEnd="url(#arr-14b)"/>
              )}
            </g>
          );
        })}

        <rect x="295" y="95" width="235" height="28" rx="4" fill="#a6e3a111"/>
        <text x="305" y="108" fontSize="9.5" fill="#a6e3a1">User sees "done" immediately</text>
        <text x="305" y="119" fontSize="9.5" fill="#a6e3a1">Infra writes are fire-and-forget</text>

        {/* Bottom annotation */}
        <text x="280" y="160" textAnchor="middle" fontSize="10" fill="#6c7086">connection_close = UX event. Infra writes = background housekeeping.</text>
      </svg>
    </div>
  );
}

function GotchaCard({
  g,
  divRef,
  open,
  onToggle,
}: {
  g: Gotcha;
  divRef: (el: HTMLDivElement | null) => void;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      ref={divRef}
      className={`gotcha-card${open ? ' open' : ''}`}
      onClick={onToggle}
    >
      <div className="gotcha-header">
        <div className="gotcha-num">{g.num}</div>
        <div className="gotcha-title">{g.title}</div>
        <div className="gotcha-chevron" style={{display:'inline-block', transition:'transform .3s ease', transform: open ? 'rotate(90deg)' : 'rotate(0deg)'}}>›</div>
      </div>
      <div className="gotcha-body" dangerouslySetInnerHTML={{ __html: g.body }} />
    </div>
  );
}

export function Mod14() {
  const gotchaRefs = useRef<HTMLDivElement[]>([]);
  const [openStates, setOpenStates] = useState<boolean[]>(() => GOTCHAS.map(() => false));

  const toggleGotcha = (i: number) => {
    setOpenStates(prev => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  return (
    <>
      <SeverityMatrix
        gotchaRefs={gotchaRefs}
        openStates={openStates}
        setOpenStates={setOpenStates}
      />
      <p>These are real production bugs that burned us. Learn them cheaply here.</p>
      <ConnectionCloseViz />
      <div>
        {GOTCHAS.map((g, i) => (
          <GotchaCard
            key={g.num}
            g={g}
            open={openStates[i]}
            onToggle={() => toggleGotcha(i)}
            divRef={(el) => {
              if (el) gotchaRefs.current[i] = el;
            }}
          />
        ))}
      </div>

      <h2>Find The Bug — Debugging Exercises</h2>
      <p>Each snippet has exactly one bug. Identify it before revealing the answer.</p>

      <BugExerciseCard
        title="Exercise A — The Vanishing Close Frame (Gotcha 14.1)"
        bugLine={`yield "data: \\"connection_close\\"\\n\\n"    # after try/finally`}
        bugNote="yield after finally never executes if the finally block raises. If redis.decr() throws, Python exits the generator with that exception and the client's stream hangs open forever."
        fixLine={`# Move yield INSIDE the while loop, immediately after break:\nif event is None:\n    yield f'data: "connection_close"\\n\\n'\n    break`}
      >
        <CodeBlock title="Exercise A — SSE Generator with Vanishing Close Frame" language="python" variant="broken" keyLine={14} keyNote="yield after finally never executes if finally raises">{CODE_EXERCISE_A}</CodeBlock>
      </BugExerciseCard>

      <BugExerciseCard
        title="Exercise B — The Exploding Context (Gotcha 14.3)"
        bugLine="return turn_history[-6:]   # 3 user + 3 bot messages"
        bugNote="Bot responses are full LLM outputs — potentially 500–1000 tokens each. Passing them raw to the SLM classifier fills its small context window with response text, crowding out the user's actual query."
        fixLine={`return [\n    {**m, "content": m["content"][:400]}\n    if m["role"] == "assistant" else m\n    for m in turn_history[-6:]\n]`}
      >
        <CodeBlock title="Exercise B — Turn History Slice for SLM Classifier Context" language="python" variant="broken" keyLine={3} keyNote="Raw bot responses bloat classifier context beyond SLM limit">{CODE_EXERCISE_B}</CodeBlock>
      </BugExerciseCard>

      <BugExerciseCard
        title="Exercise C — The Ghost Feature (Gotcha 14.6)"
        bugLine="clear_keys: list[str]    # session keys to clear on this intent"
        bugNote="clear_keys is defined in the schema and populated in every IntentRecord, but no code ever reads record.clear_keys. The filter reset logic is hardcoded in filter_apply_node instead. Engineers add values believing they'll be cleared — nothing happens."
        fixLine={`# Option 1: Delete clear_keys from the schema entirely.\n# Option 2: Write a generic node that consumes it:\nfor key in record.clear_keys:\n    state.session.pop(key, None)`}
      >
        <CodeBlock title="Exercise C — IntentRecord with Ghost clear_keys Field" language="python" variant="broken" keyLine={4} keyNote="clear_keys defined but never read — silent schema rot">{CODE_EXERCISE_C}</CodeBlock>
      </BugExerciseCard>

      <QuizSection moduleId={21} title="Module 21" contentHint="connection_close placement, cascade tax, SLM context window limits, first-turn empty session, version conflict, dead config, no-text-response debugging, background task leaks" />
    </>
  );
}
