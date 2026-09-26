import { useState } from "react";
import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from '../components/CodeBlock';

// ── ConcurrencyGateViz component ──────────────────────────────────────────────

function ConcurrencyGateViz() {
  const MAX = 10;
  const [count, setCount] = useState(3);
  const [rejected, setRejected] = useState(false);
  const [shaking, setShaking] = useState(false);

  const send = () => {
    if (count >= MAX) {
      setRejected(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 200);
      setTimeout(() => setRejected(false), 2000);
      return;
    }
    setCount(c => c + 1);
    setRejected(false);
  };

  const complete = () => {
    setCount(c => Math.max(0, c - 1));
    setRejected(false);
  };

  const processing = Math.min(count, MAX);
  const queued = Math.max(0, count - MAX);
  const fillPct = Math.min(count / MAX, 1);
  const atCapacity = count >= MAX;

  const svgW = 560;
  const svgH = 200;

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-6px)}
          40%{transform:translateX(6px)}
          60%{transform:translateX(-4px)}
          80%{transform:translateX(4px)}
        }
      `}</style>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>
        LLM CONCURRENCY GATE — PROTECTING AGAINST LLM THUNDERING HERD
      </div>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{display:'block',margin:'0 auto'}} aria-label="LLM concurrency gate visualization">
        {/* Incoming label */}
        <text x={svgW / 2} y={16} textAnchor="middle" fontSize="11" fill="#6c7086">Incoming requests</text>

        {/* Incoming request boxes */}
        {Array.from({length: 5}).map((_, i) => (
          <rect key={i} x={180 + i * 40} y={24} width={30} height={22} rx="4"
            fill={i < count ? '#89b4fa33' : '#313244'} stroke={i < count ? '#89b4fa' : '#45475a'} strokeWidth="1.5"/>
        ))}

        {/* Gate box */}
        <rect x={140} y={68} width={280} height={50} rx="6"
          fill="#1e1e2e" stroke="#45475a" strokeWidth="1.5"/>
        <text x={280} y={84} textAnchor="middle" fontSize="10" fill="#6c7086">GATE</text>
        {/* Fill bar background */}
        <rect x={152} y={90} width={256} height={14} rx="3" fill="#313244"/>
        {/* Fill bar fill */}
        <rect x={152} y={90} width={Math.round(256 * fillPct)} height={14} rx="3"
          fill={fillPct >= 1 ? '#f38ba8' : fillPct > 0.7 ? '#f9e2af' : '#89b4fa'}/>
        <text x={290} y={102} textAnchor="middle" fontSize="9" fill={fillPct >= 1 ? '#1e1e2e' : '#1e1e2e'}>
          {count} / {MAX}
        </text>

        {/* Processing section */}
        <text x={60} y={148} textAnchor="middle" fontSize="10" fill="#a6e3a1">Processing ({processing})</text>
        {Array.from({length: processing}).map((_, i) => (
          <rect key={i} x={10 + i * 26} y={154} width={22} height={22} rx="4"
            fill="#a6e3a133" stroke="#a6e3a1" strokeWidth="1.5"/>
        ))}

        {/* Queued section */}
        <text x={430} y={148} textAnchor="middle" fontSize="10" fill="#f9e2af">Queued ({queued})</text>
        {Array.from({length: Math.min(queued, 5)}).map((_, i) => (
          <rect key={i} x={370 + i * 26} y={154} width={22} height={22} rx="4"
            fill="#f9e2af11" stroke="#f9e2af" strokeWidth="1" strokeDasharray="4 2"/>
        ))}

        {/* Rejected message */}
        {rejected && (
          <text x={svgW / 2} y={svgH - 4} textAnchor="middle" fontSize="11" fill="#f38ba8">
            429: Rate limit exceeded — gate full ({MAX}/{MAX})
          </text>
        )}
      </svg>

      <div style={{marginTop:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
        <button
          onClick={send}
          style={{
            background: atCapacity ? 'rgba(247,105,102,0.2)' : '#313244',
            color: atCapacity ? '#f78166' : '#cdd6f4',
            border: `1px solid ${atCapacity ? '#f78166' : '#45475a'}`,
            borderRadius:'6px',
            padding:'5px 12px',
            fontSize:'0.78rem',
            cursor:'pointer',
            marginRight:'8px',
            transition:'background 0.3s ease, border-color 0.3s ease, color 0.3s ease',
            animation: shaking ? 'shake 0.2s ease' : 'none',
          }}>
          Send request
        </button>
        <button onClick={complete}
          style={{background:'#313244',color:'#cdd6f4',border:'1px solid #45475a',borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor:'pointer',marginRight:'8px'}}>
          Complete request
        </button>
        <span style={{fontSize:'0.75rem',color:'#6c7086'}}>
          Current: <span style={{color: fillPct >= 1 ? '#f38ba8' : '#89b4fa', fontFamily:'monospace'}}>{count}/{MAX}</span>
          {fillPct >= 1 && <span style={{color:'#f38ba8',marginLeft:8}}>Gate full — new requests rejected</span>}
        </span>
      </div>
    </div>
  );
}

// ── DegradationMapViz component ───────────────────────────────────────────────

const getDegradationLevel = (llm: boolean, redis: boolean, housingApi: boolean, kafka: boolean) => {
  if (!llm && !redis) return { level: 3, label: 'L3 — Crisis', color: '#f38ba8', desc: 'LLM + Redis both down. All requests fail. Incident page now.' };
  if (!llm) return { level: 2, label: 'L2 — Partial Failure', color: '#fab387', desc: 'LLM unavailable. Cached responses only. Quality severely degraded.' };
  if (!redis) return { level: 2, label: 'L2 — Partial Failure', color: '#fab387', desc: 'Session state lost. Stateless fallback mode. No conversation context.' };
  if (!housingApi) return { level: 1, label: 'L1 — Degraded', color: '#f9e2af', desc: 'Property search failing. Fallback to cached listings from 15min ago.' };
  if (!kafka) return { level: 1, label: 'L1 — Degraded', color: '#f9e2af', desc: 'Event streaming down. Analytics blind. No real-time monitoring.' };
  return { level: 0, label: 'L0 — Healthy', color: '#a6e3a1', desc: 'All systems operational. p99 < 2s. Monitoring green.' };
};

function DegradationMapViz() {
  const [llm, setLlm] = useState(true);
  const [redis, setRedis] = useState(true);
  const [housingApi, setHousingApi] = useState(true);
  const [kafka, setKafka] = useState(true);

  const degradation = getDegradationLevel(llm, redis, housingApi, kafka);
  const dualCrisis = !llm && !redis;
  const shouldPulse = degradation.level >= 2;
  const shouldShake = dualCrisis;

  const toggleDefs = [
    { label: 'LLM API',     value: llm,       set: setLlm,       color: '#cba6f7' },
    { label: 'Redis',       value: redis,      set: setRedis,     color: '#89b4fa' },
    { label: 'Housing API', value: housingApi, set: setHousingApi,color: '#94e2d5' },
    { label: 'Kafka',       value: kafka,      set: setKafka,     color: '#f9e2af' },
  ];

  const STATIC_LEVELS = [
    { label: 'L0 — Healthy',         color: '#a6e3a1', trigger: 'All dependencies up',         behavior: 'Full service — LLM + tools + streaming' },
    { label: 'L1 — Degraded',        color: '#f9e2af', trigger: 'Housing API or Kafka down',    behavior: 'Cached data / analytics blind. LLM still serves.' },
    { label: 'L2 — Partial Failure', color: '#fab387', trigger: 'LLM or Redis down',            behavior: 'Cached responses only / stateless fallback mode.' },
    { label: 'L3 — Crisis',          color: '#f38ba8', trigger: 'LLM + Redis both down',        behavior: 'All requests fail. Serve static error page. Page oncall.' },
  ];

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)}
        }
        @keyframes degradPulse {
          0%,100%{box-shadow:0 0 0 0 currentColor} 50%{box-shadow:0 0 0 8px transparent}
        }
      `}</style>

      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'16px'}}>
        FAILURE SIMULATOR — TOGGLE DEPENDENCIES TO COMPUTE DEGRADATION LEVEL
      </div>

      {/* Toggle switches — one per dependency */}
      <div style={{display:'flex',gap:'10px',marginBottom:'20px',flexWrap:'wrap'}}>
        {toggleDefs.map(dep => {
          const enabled = dep.value;
          return (
            <div key={dep.label}
              onClick={() => dep.set((v: boolean) => !v)}
              style={{
                display:'flex',alignItems:'center',gap:'10px',padding:'8px 16px',
                borderRadius:'8px',cursor:'pointer',userSelect:'none',
                border:`1px solid ${enabled ? dep.color+'55' : '#f38ba855'}`,
                background: enabled ? `${dep.color}0f` : '#f38ba80f',
                transition:'all 0.2s',
              }}>
              {/* Toggle track */}
              <div style={{
                position:'relative',width:'36px',height:'20px',borderRadius:'10px',
                background: enabled ? dep.color : '#45475a',
                transition:'background 0.2s',flexShrink:0,
              }}>
                <div style={{
                  position:'absolute',top:'3px',
                  left: enabled ? '19px' : '3px',
                  width:'14px',height:'14px',borderRadius:'50%',
                  background:'#1e1e2e',
                  transition:'left 0.2s',
                  boxShadow:'0 1px 3px rgba(0,0,0,0.4)',
                }}/>
              </div>
              <span style={{fontSize:'0.82rem',fontWeight:700,color: enabled ? dep.color : '#f38ba8'}}>
                {dep.label}
              </span>
              <span style={{
                fontSize:'0.7rem',fontWeight:600,
                color: enabled ? dep.color : '#f38ba8',
                opacity:0.8,
              }}>
                {enabled ? 'UP' : 'DOWN'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Large level badge — shakes on L3 crisis (LLM+Redis both down), pulses on L2+ */}
      <div style={{
        display:'inline-flex',flexDirection:'column',alignItems:'center',
        padding:'18px 32px',borderRadius:'12px',marginBottom:'14px',
        border:`2px solid ${degradation.color}`,
        background:`${degradation.color}12`,
        animation: shouldShake ? 'shake 0.5s ease infinite' : 'none',
        position:'relative',
        minWidth:'260px',
      }}>
        {/* Pulse ring for level 2 or 3 (when not shaking) */}
        {shouldPulse && !shouldShake && (
          <div style={{
            position:'absolute',inset:'-4px',borderRadius:'14px',
            border:`2px solid ${degradation.color}`,
            animation:'degradPulse 1.4s ease-in-out infinite',
            color: degradation.color,
            opacity:0.6,
          }}/>
        )}
        <div style={{
          fontSize:'1.6rem',fontWeight:800,fontFamily:'monospace',
          color: degradation.color,letterSpacing:'-0.01em',
          textShadow:`0 0 20px ${degradation.color}55`,
        }}>
          {degradation.label}
        </div>
        <div style={{
          marginTop:'6px',fontSize:'0.8rem',color:'#bac2de',
          textAlign:'center',maxWidth:'320px',lineHeight:'1.4',
        }}>
          {degradation.desc}
        </div>
        {dualCrisis && (
          <div style={{
            marginTop:'10px',padding:'4px 12px',borderRadius:'20px',
            background:'#f38ba822',border:'1px solid #f38ba8',
            fontSize:'0.72rem',fontWeight:700,color:'#f38ba8',letterSpacing:'0.05em',
          }}>
            INCIDENT — PAGE ONCALL NOW
          </div>
        )}
      </div>

      {/* Static reference table — all four levels, active one highlighted */}
      <div style={{marginTop:'20px',borderTop:'1px solid #313244',paddingTop:'16px'}}>
        <div style={{fontSize:'0.68rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#45475a',marginBottom:'10px'}}>
          REFERENCE — DEGRADATION LEVEL MAP
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
          {STATIC_LEVELS.map((lv) => (
            <div key={lv.label} style={{
              display:'flex',alignItems:'center',gap:'10px',
              padding:'6px 12px',borderRadius:'6px',
              border:`1px solid ${lv.label === degradation.label ? lv.color : '#31324433'}`,
              background: lv.label === degradation.label ? `${lv.color}10` : 'transparent',
              opacity: lv.label === degradation.label ? 1 : 0.4,
              transition:'all 0.3s',
            }}>
              <span style={{width:'10px',height:'10px',borderRadius:'50%',background:lv.color,flexShrink:0}}/>
              <span style={{fontWeight:700,color:lv.color,fontSize:'0.78rem',minWidth:'140px'}}>{lv.label}</span>
              <span style={{fontSize:'0.75rem',color:'#bac2de',flex:1}}>{lv.trigger}</span>
              <span style={{fontSize:'0.73rem',color:lv.color,textAlign:'right',maxWidth:'260px'}}>{lv.behavior}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const CODE_CONCURRENCY_GATE = `class LLMConcurrencyGate:
    """Limit simultaneous LLM calls with a queue for overflow."""
    async def acquire(self) -> bool:
        count = await self.redis.incr(self.key)
        if count == 1:
            # Safety TTL: if this process crashes between incr and decr, the
            # counter auto-resets after 5 min rather than leaking forever.
            # Only set on first acquisition so normal traffic never hits the TTL.
            await self.redis.expire(self.key, 300)
        if count <= self.max_concurrent:
            return True   # slot available
        # Queue overflow: wait up to queue_wait_ms
        await self.redis.decr(self.key)
        return await self._wait_in_queue()

    async def release(self) -> None:
        await self.redis.decr(self.key)  # MUST happen even on exception`;

const CODE_PARALLEL_FETCH = `async def fetch_data_node(state: BotState, executor=None) -> dict:
    requirements = intent_registry.get_requirements(state['classification'])

    # Group by parallel_group — group 1 runs simultaneously, group 2 waits
    groups = group_by_parallel_group(requirements)
    results = {}
    for group_id in sorted(groups.keys()):
        tasks = [executor.execute(r.tool, build_params(r, state)) for r in groups[group_id]]
        group_results = await asyncio.gather(*tasks, return_exceptions=True)
        results.update(dict(zip([r.tool for r in groups[group_id]], group_results)))

    return {"pre_fetched_data": results}`;

// ── RequestLifecycleViz component ─────────────────────────────────────────────

type LifecycleEvent = {
  t: number;
  lane: 'browser' | 'fastapi' | 'external' | 'infra';
  label: string;
  detail: string;
  gold?: boolean;
  sse?: boolean;
};

const LC_EVENTS: LifecycleEvent[] = [
  // Browser lane
  { t: 0,    lane: 'browser',  label: 'request_start',    detail: 'Browser → FastAPI: POST with JWT + session_id + message' },
  { t: 120,  lane: 'browser',  label: 'response_start',   detail: 'SSE stream open — typing indicator shown', sse: true },
  { t: 450,  lane: 'browser',  label: 'first_chunk',      detail: 'SSE: streaming text starts — user sees first words', sse: true },
  { t: 1600, lane: 'browser',  label: 'last_chunk',       detail: 'SSE: full response text delivered', sse: true },
  { t: 1653, lane: 'browser',  label: 'connection_close', detail: 'SSE: ← USER CAN TYPE NOW. Redis + Kafka write after this.', gold: true, sse: true },
  // FastAPI / LangGraph lane
  { t: 5,    lane: 'fastapi',  label: 'receive',          detail: 'FastAPI → Redis: Load session + version check Lua script' },
  { t: 80,   lane: 'fastapi',  label: 'classify',         detail: 'intent: search_properties, filter_delta: {bhk:[3], price_max:20000000}' },
  { t: 90,   lane: 'fastapi',  label: 'llm_call_start',   detail: 'LangGraph → Anthropic: 1200 token prompt. Streaming enabled.' },
  { t: 1580, lane: 'fastapi',  label: 'llm_call_end',     detail: 'Anthropic → LangGraph: stream complete. 12 listings cached.' },
  { t: 1650, lane: 'fastapi',  label: 'response_sent',    detail: 'FastAPI: SSE connection_close emitted, pipeline done.' },
  // External APIs lane
  { t: 90,   lane: 'external', label: 'llm_request',      detail: 'LangGraph → Anthropic: domain router + classifier SLM calls' },
  { t: 450,  lane: 'external', label: 'llm_first_token',  detail: 'Anthropic → LangGraph: first streaming token received' },
  { t: 1580, lane: 'external', label: 'llm_complete',     detail: 'Housing API ×2 parallel + LLM stream fully consumed' },
  // Infrastructure lane
  { t: 10,   lane: 'infra',    label: 'redis_read',       detail: 'Redis → FastAPI: session returned (or fresh session created)' },
  { t: 1660, lane: 'infra',    label: 'redis_write',      detail: 'Lua optimistic lock. Increments version. Writes turn_history.' },
  { t: 1830, lane: 'infra',    label: 'kafka_publish',    detail: 'fire-and-forget: analytics event published. Pipeline complete.' },
];

function RequestLifecycleViz() {
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);

  const LANES: { key: LifecycleEvent['lane']; label: string; color: string }[] = [
    { key: 'browser',  label: 'Browser',             color: '#89b4fa' },
    { key: 'fastapi',  label: 'FastAPI / LangGraph', color: '#a6e3a1' },
    { key: 'external', label: 'External APIs',       color: '#cba6f7' },
    { key: 'infra',    label: 'Infrastructure',      color: '#f9e2af' },
  ];

  const chartWidth = 580;
  const svgW = 700;
  const svgH = 220;
  const xLeft = 108;
  const xRight = xLeft + chartWidth;
  const maxT = 1830;

  // Logarithmic scale per spec: xPos = (Math.log(t + 1) / Math.log(1831)) * chartWidth
  function toX(t: number): number {
    return xLeft + (Math.log(t + 1) / Math.log(maxT + 1)) * chartWidth;
  }

  const laneY: Record<string, number> = {
    browser:  42,
    fastapi:  94,
    external: 146,
    infra:    198,
  };

  const laneH = 28;
  const goldX = toX(1653);

  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: '8px', padding: '20px', margin: '20px 0', overflow: 'hidden' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6c7086', marginBottom: '12px' }}>
        REQUEST LIFECYCLE SWIMLANE — LOG-SCALE TIME AXIS (hover events for detail)
      </div>
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ display: 'block', minWidth: '500px' }} aria-label="Request lifecycle swimlane diagram">

          {/* Lane backgrounds + labels */}
          {LANES.map((lane) => {
            const cy = laneY[lane.key];
            return (
              <g key={lane.key}>
                <rect x={xLeft - 4} y={cy - laneH / 2} width={xRight - xLeft + 8} height={laneH}
                  fill={`${lane.color}07`} rx="3" />
                <line x1={xLeft - 4} y1={cy - laneH / 2} x2={xRight + 4} y2={cy - laneH / 2}
                  stroke="#31324455" strokeWidth="0.5" />
                <text x={4} y={cy + 4} fontSize="9" fontWeight="700" fill={lane.color}>{lane.label}</text>
              </g>
            );
          })}

          {/* Bottom lane border */}
          <line x1={xLeft - 4} y1={laneY['infra'] + laneH / 2} x2={xRight + 4} y2={laneY['infra'] + laneH / 2}
            stroke="#31324455" strokeWidth="0.5" />

          {/* Golden vertical accent line for connection_close — spans ALL 4 lanes */}
          <line x1={goldX} y1={laneY['browser'] - laneH / 2} x2={goldX} y2={laneY['infra'] + laneH / 2}
            stroke="#f9e2af" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.85" />
          <text x={goldX + 4} y={laneY['browser'] - laneH / 2 + 10} fontSize="8" fontWeight="700" fill="#f9e2af">
            USER CAN TYPE
          </text>

          {/* X-axis ticks */}
          {[0, 10, 100, 500, 1000, 1830].map(t => (
            <g key={t}>
              <line x1={toX(t)} y1={laneY['infra'] + laneH / 2} x2={toX(t)} y2={laneY['infra'] + laneH / 2 + 6}
                stroke="#45475a" strokeWidth="1" />
              <text x={toX(t)} y={laneY['infra'] + laneH / 2 + 16} textAnchor="middle" fontSize="8" fill="#6c7086">
                {t < 1000 ? `${t}ms` : `${(t / 1000).toFixed(1)}s`}
              </text>
            </g>
          ))}

          {/* Event dots */}
          {LC_EVENTS.map((ev, i) => {
            const x = toX(ev.t);
            const y = laneY[ev.lane];
            const isHovered = hoveredEvent === i;
            const laneColor = LANES.find(l => l.key === ev.lane)?.color ?? '#6c7086';
            const color = ev.gold ? '#f9e2af' : laneColor;
            const r = isHovered ? 7 : 5;
            return (
              <g key={i} style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredEvent(i)}
                onMouseLeave={() => setHoveredEvent(null)}>
                {/* SSE ring indicator */}
                {ev.sse && (
                  <circle cx={x} cy={y} r={r + 4} fill="none" stroke={color} strokeWidth="0.7" opacity="0.35" />
                )}
                <circle
                  cx={x} cy={y} r={r}
                  fill={isHovered ? color : `${color}33`}
                  stroke={color}
                  strokeWidth={isHovered ? 2 : 1.2}
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 6px ${color})` : 'none',
                    transition: 'all 0.15s',
                  }}
                />
              </g>
            );
          })}

          {/* Hover tooltip */}
          {hoveredEvent !== null && (() => {
            const ev = LC_EVENTS[hoveredEvent];
            const rawX = toX(ev.t);
            const laneColor = LANES.find(l => l.key === ev.lane)?.color ?? '#6c7086';
            const color = ev.gold ? '#f9e2af' : laneColor;
            const y = laneY[ev.lane];
            const ttW = 200;
            const ttH = 44;
            const ttX = Math.min(Math.max(rawX - ttW / 2, xLeft), xRight - ttW);
            const above = y > svgH / 2;
            const ttY = above ? y - laneH / 2 - ttH - 4 : y + laneH / 2 + 4;
            const truncated = ev.detail.length > 55 ? ev.detail.substring(0, 55) + '…' : ev.detail;
            return (
              <g pointerEvents="none">
                <rect x={ttX} y={ttY} width={ttW} height={ttH} rx="4"
                  fill="#1e1e2e" stroke={color} strokeWidth="1" />
                <text x={ttX + 8} y={ttY + 14} fontSize="9" fontWeight="700" fill={color}>
                  T+{ev.t}ms — {ev.label}
                </text>
                <text x={ttX + 8} y={ttY + 28} fontSize="8" fill="#bac2de">{truncated}</text>
              </g>
            );
          })()}
        </svg>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
        {LANES.map(lane => (
          <div key={lane.key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: lane.color }} />
            <span style={{ fontSize: '0.72rem', color: lane.color }}>{lane.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '20px', height: '1.5px', background: '#f9e2af', opacity: 0.85 }} />
          <span style={{ fontSize: '0.72rem', color: '#f9e2af' }}>connection_close</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'transparent', border: '1px solid #89b4fa' }} />
          <span style={{ fontSize: '0.72rem', color: '#6c7086' }}>SSE event</span>
        </div>
      </div>
    </div>
  );
}

const CODE_TIMING = `T+0ms     emit chat_event       ← user sees response
T+1ms     emit pipeline_step    ← pipeline panel updates
T+2ms     emit connection_close ← user CAN TYPE NOW
T+3ms     [user starts reading]
T+5ms     Redis write completes ← background
T+15ms    Kafka write completes ← background
T+200ms   [human reaction time — user starts typing]
T+300ms   next request arrives  ← Redis already updated ✓`;

export function Mod8() {
  return (
    <>
      <ConcurrencyGateViz />

      <h2>7.1 The LLM Concurrency Gate</h2>
      <CodeBlock title="LLM Concurrency Gate — Redis Counter with TTL Safety" language="python" keyLine={5} keyNote="EXPIRE on first INCR prevents counter leak if process crashes">{CODE_CONCURRENCY_GATE}</CodeBlock>
      <div className="callout callout-warn"><strong>Fail-open for Redis errors</strong>If Redis is down, gate.acquire() must treat Redis errors as "slot available" (fail open), not "slot unavailable" (fail closed). Current behavior: raises on Redis error. Fix: wrap Redis calls and default to permitting the request.</div>
      <div className="callout callout-tip">
        <strong>Why Redis and not asyncio.Semaphore?</strong>
        Great question. <code>asyncio.Semaphore</code> is simpler and would work perfectly — for a single server instance. The problem: at scale you run 20, 50, or 200 FastAPI instances behind a load balancer. Each has its own process memory; a semaphore in instance 1 has no idea about the load on instances 2-200.
        <br /><br />
        Redis gives you a <em>cross-process, cross-server</em> counter. <code>INCR</code> is atomic at the Redis level — even 200 servers calling INCR simultaneously will each get a unique, sequential integer back. That's the property that makes it a safe distributed concurrency primitive.
        <br /><br />
        Rule of thumb: use in-process primitives (Semaphore, Lock) for concurrency within a single process. Use Redis for concurrency across processes or servers.
      </div>

      <h2>7.2 Parallel Tool Fetching</h2>
      <CodeBlock title="Parallel Tool Fetch by Group" language="python" keyLine={7} keyNote="asyncio.gather runs all tools in a parallel_group simultaneously">{CODE_PARALLEL_FETCH}</CodeBlock>
      <div className="callout callout-tip"><strong>Why not let the LLM call tools?</strong>Pre-fetch is deterministic (orchestrator controls it), faster (runs before LLM starts), and cheaper (cached). LLM tool calls are for residual edge cases — things you couldn't predict for this intent.</div>

      <h2>7.3 The Connection_Close Timing Insight</h2>
      <CodeBlock title="SSE Event Ordering — Close Stream Before Writing State" language="text" keyLine={3} keyNote="connection_close at T+2ms lets user type before Redis write at T+5ms">{CODE_TIMING}</CodeBlock>
      <p>By separating "done for the user" from "done for infrastructure", we cut perceived latency by 30-40% without sacrificing correctness.</p>

      <h2>7.4 Complete Request Lifecycle — All Actors, All Timings</h2>
      <p>Every system that touches a single request, in order. Pin this — interviewers ask "walk me through what happens when a user sends a message."</p>
      <RequestLifecycleViz />
      <div className="callout callout-info"><strong>The key architectural insight in this diagram:</strong> The browser receives <code>connection_close</code> at T+1653ms — before Redis and Kafka are written (T+1660ms, T+1830ms). The user can type their next message at T+1653ms and it arrives after T+1830ms. Redis is always written before the next request processes it. That's why the ordering is safe: close the stream first, write state second.</div>

      <h2>7.5 Graceful Degradation — The Full Map</h2>
      <DegradationMapViz />
      <table>
        <tr><th>Dependency fails</th><th>Impact</th><th>Degradation behavior</th></tr>
        <tr><td>Redis unavailable</td><td>Session lost</td><td>Fresh session created — user loses context but gets a response</td></tr>
        <tr><td>Domain router timeout</td><td>Domain unknown</td><td>Fallback to session.last_domain</td></tr>
        <tr><td>Stage 2 SLM timeout</td><td>Intent unknown</td><td>Fallback to out_of_scope</td></tr>
        <tr><td>Housing API timeout</td><td>No property data</td><td>LLM says "I couldn't find properties" — acceptable</td></tr>
        <tr><td>Kafka unavailable</td><td>Events lost</td><td>Fire-and-forget — silent, ring buffer catches bursts</td></tr>
      </table>
      <div className="callout callout-maang">
        <strong>MAANG Interview Connection — Module 18</strong>
        "How do you handle LLM call spikes without dropping requests?" → Redis-backed concurrency gate, overflow queue with configurable max-wait, fail-open on Redis errors. Quote the numbers: gate allows 50 concurrent, queue holds 100 at 2s max wait, anything beyond gets 503.
        <br /><br />
        <strong>Likely follow-up:</strong> "What happens if the process crashes while 30 requests are inside the gate?"<br />
        → Without EXPIRE the counter stays at 30 forever, starving all subsequent requests. Fix: set an EXPIRE (5 min) on the key after the first INCR so the counter auto-resets if the process dies.
        <br /><br />
        <strong>Likely follow-up:</strong> "How do you avoid the starvation problem where one tenant's burst blocks everyone else?"<br />
        → Per-tenant sub-limits on top of the global limit. Two Redis keys: <code>gate:global:count</code> (max 50) and <code>gate:{"{tenant_id}:count"}</code> (max configurable per tier). Global check first, then per-tenant.
      </div>
      <QuizSection moduleId={18} title="Module 18" contentHint="Concurrency gate, parallel tool fetching, connection_close timing, degradation map, blue-green deployment, sticky sessions" />
    </>
  );
}
