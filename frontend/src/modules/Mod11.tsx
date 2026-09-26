import { useState } from 'react';
import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from '../components/CodeBlock';

type MetricsMap = Record<string, string | number>;
type PinnedEntry = { dau: number; metrics: MetricsMap };

function calcMetrics(dau: number): MetricsMap {
  const qps = (dau * 3) / 86400;
  return {
    qps: qps.toFixed(1),
    llm: ((qps * 0.3 * 86400) >= 1e6 ? ((qps * 0.3 * 86400)/1e6).toFixed(1)+'M' : ((qps * 0.3 * 86400)/1e3).toFixed(0)+'K'),
    redis: ((dau * 2048) / (1024**3)).toFixed(1),
    kafka: ((qps * 500) / (1024**2)).toFixed(2),
  };
}

function fmt(n: number, dec = 1) {
  if (n >= 1e6) return (n/1e6).toFixed(dec)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(dec)+'K';
  return n.toFixed(dec);
}

/** Parse a metric value string to a float for comparison (strips M/K suffixes). */
function parseMetricNum(v: string | number): number {
  if (typeof v === 'number') return v;
  if (v.endsWith('M')) return parseFloat(v) * 1e6;
  if (v.endsWith('K')) return parseFloat(v) * 1e3;
  return parseFloat(v) || 0;
}

/** Return the index of the metric row with the greatest percentage spread across pinned entries. */
function mostDifferingRowKey(pinned: PinnedEntry[], metricKeys: string[]): string | null {
  if (pinned.length < 2) return null;
  let maxSpread = -1;
  let maxKey: string | null = null;
  for (const key of metricKeys) {
    const vals = pinned.map(p => parseMetricNum(p.metrics[key]));
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const spread = minV === 0 ? maxV : (maxV - minV) / minV;
    if (spread > maxSpread) { maxSpread = spread; maxKey = key; }
  }
  return maxKey;
}

const PIN_COLORS = ['#89b4fa', '#cba6f7', '#f9e2af'];

const METRICS = [
  { key: 'qps',   label: 'Peak QPS',      unit: 'req/s', color: '#89b4fa' },
  { key: 'llm',   label: 'LLM Calls/Day', unit: 'calls', color: '#cba6f7' },
  { key: 'redis', label: 'Redis Memory',  unit: 'GB',    color: '#a6e3a1' },
  { key: 'kafka', label: 'Kafka',         unit: 'MB/s',  color: '#f9e2af' },
];

function DAUCalcViz() {
  const [dau, setDau] = useState(1_000_000);
  const [pinned, setPinned] = useState<PinnedEntry[]>([]);

  const m = calcMetrics(dau);

  function pinCurrent() {
    const entry: PinnedEntry = { dau, metrics: calcMetrics(dau) };
    setPinned(prev => {
      // Replace oldest if already at 3; also deduplicate exact DAU
      const deduped = prev.filter(p => p.dau !== dau);
      const next = [...deduped, entry];
      return next.length > 3 ? next.slice(next.length - 3) : next;
    });
  }

  const highlightKey = mostDifferingRowKey(pinned, METRICS.map(m => m.key));

  // Compute fill percentage for native range track gradient
  const sliderMin = 100_000;
  const sliderMax = 10_000_000;
  const fillPct = ((dau - sliderMin) / (sliderMax - sliderMin)) * 100;
  const sliderTrackStyle: React.CSSProperties = {
    width: '100%',
    display: 'block',
    appearance: 'none' as React.CSSProperties['appearance'],
    WebkitAppearance: 'none' as React.CSSProperties['WebkitAppearance'],
    height: '4px',
    borderRadius: '2px',
    outline: 'none',
    border: 'none',
    cursor: 'pointer',
    background: `linear-gradient(to right, #89b4fa 0%, #89b4fa ${fillPct}%, #313244 ${fillPct}%, #313244 100%)`,
  };

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>DAU → INFRASTRUCTURE CALCULATOR</div>

      {/* Slider row with pin badge chip */}
      <div style={{marginBottom:'16px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px',alignItems:'center'}}>
          <span style={{fontSize:'0.8rem',color:'#bac2de'}}>DAU: <strong style={{color:'#89b4fa',fontFamily:'monospace'}}>{fmt(dau,1)}</strong></span>
          {pinned.length > 0 && (
            <span style={{fontSize:'0.7rem',color:'#f9e2af',background:'#f9e2af18',border:'1px solid #f9e2af44',borderRadius:'20px',padding:'2px 8px',fontWeight:700,letterSpacing:'0.04em'}}>
              📌 {pinned.length}/3 pinned
            </span>
          )}
        </div>
        <input type="range" min={sliderMin} max={sliderMax} step={100_000} value={dau}
          onChange={e => setDau(Number(e.target.value))}
          style={sliderTrackStyle}/>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:'2px'}}>
          <span style={{fontSize:'0.7rem',color:'#6c7086'}}>100K</span>
          <span style={{fontSize:'0.7rem',color:'#6c7086'}}>10M</span>
        </div>
      </div>

      {/* Current metrics display */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'8px',marginBottom:'12px'}}>
        {METRICS.map(metric => (
          <div key={metric.key} style={{background:'#1e1e2e',border:'1px solid #313244',borderRadius:'6px',padding:'10px 14px'}}>
            <div style={{fontSize:'0.65rem',color:'#6c7086',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'2px'}}>{metric.label} <span style={{color:'#45475a'}}>({metric.unit})</span></div>
            <div style={{fontSize:'1.1rem',fontFamily:'monospace',fontWeight:700,color:metric.color}}>{m[metric.key]}</div>
          </div>
        ))}
      </div>

      {/* Pin button below metrics */}
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px'}}>
        <button onClick={pinCurrent} disabled={pinned.length >= 3 && pinned.some(p => p.dau === dau)}
          style={{background:'#89b4fa22',color:'#89b4fa',border:'1px solid #89b4fa44',borderRadius:'5px',padding:'5px 14px',fontSize:'0.75rem',cursor:'pointer',fontWeight:700,letterSpacing:'0.04em'}}>
          📌 Pin this DAU
        </button>
        <span style={{fontSize:'0.7rem',color:'#45475a'}}>Drag slider → pin → compare up to 3 DAU values</span>
      </div>

      {/* Comparison table — shown only when pins exist */}
      {pinned.length > 0 && (
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
            <span style={{fontSize:'0.7rem',fontWeight:700,color:'#6c7086',textTransform:'uppercase',letterSpacing:'0.08em'}}>DAU Comparison</span>
            <button onClick={() => setPinned([])}
              style={{background:'none',border:'none',color:'#45475a',cursor:'pointer',fontSize:'0.72rem',textDecoration:'underline',padding:'0'}}>
              ✕ Clear pins
            </button>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.78rem'}}>
              <thead>
                <tr>
                  <th style={{textAlign:'left',color:'#6c7086',fontWeight:700,fontSize:'0.7rem',paddingBottom:'8px',textTransform:'uppercase'}}>Metric</th>
                  {pinned.map((p, i) => (
                    <th key={i} style={{textAlign:'right',color:PIN_COLORS[i % 3],fontWeight:700,fontSize:'0.7rem',paddingBottom:'8px',paddingLeft:'12px',whiteSpace:'nowrap'}}>
                      {fmt(p.dau, 1)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map(metric => {
                  const isHighlight = metric.key === highlightKey;
                  return (
                    <tr key={metric.key} style={{borderTop:'1px solid #31324444',background: isHighlight ? '#f9e2af0a' : 'transparent'}}>
                      <td style={{padding:'8px 0',color: isHighlight ? '#f9e2af' : '#6c7086',fontSize:'0.75rem',fontWeight: isHighlight ? 700 : 400}}>
                        {metric.label}
                        {isHighlight && <span style={{marginLeft:'6px',fontSize:'0.6rem',color:'#f9e2af88',letterSpacing:'0.06em'}}>▲ MAX DIFF</span>}
                        <br/><span style={{color:'#45475a',fontSize:'0.65rem'}}>{metric.unit}</span>
                      </td>
                      {pinned.map((p, pi) => (
                        <td key={pi} style={{textAlign:'right',padding:'8px 0 8px 12px',fontFamily:'monospace',color:PIN_COLORS[pi % 3],fontWeight: isHighlight ? 700 : 400}}>
                          {p.metrics[metric.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function LLMGateViz() {
  const RPM = 1000;
  const avgLatency = 2;
  const maxConcurrent = Math.floor((RPM * avgLatency) / 60);
  // Gate utilisation at peak QPS of 1M DAU
  const peakQPS = (1_000_000 * 3) / 86400;
  const llmQPS = peakQPS * 0.3;
  const gateUtilPct = Math.min(100, (llmQPS / maxConcurrent) * 100);

  const barW = 460;

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>LLM CONCURRENCY GATE FORMULA — BACK-CALCULATE FROM RATE LIMITS</div>

      <svg viewBox="0 0 560 180" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="LLM RPM gate formula diagram">
        <defs>
          <marker id="gate-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#6c7086"/>
          </marker>
          <marker id="gate-arr-peach" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#fab387"/>
          </marker>
        </defs>

        {/* Formula label */}
        <text x="10" y="18" fontSize="11" fill="#6c7086">Formula:</text>
        <text x="70" y="18" fontSize="11" fill="#cdd6f4" fontFamily="monospace">max_concurrent = (RPM_limit × avg_latency_s) / 60</text>

        {/* Box: RPM limit */}
        <rect x="10" y="32" width="108" height="52" rx="6" fill="#f38ba822" stroke="#f38ba8" strokeWidth="1.5"/>
        <text x="64" y="52" textAnchor="middle" fontSize="10" fill="#f38ba8" fontWeight="bold">API Limit</text>
        <text x="64" y="66" textAnchor="middle" fontSize="16" fill="#f38ba8" fontFamily="monospace" fontWeight="bold">{RPM}</text>
        <text x="64" y="78" textAnchor="middle" fontSize="9" fill="#6c7086">RPM</text>

        {/* × */}
        <text x="126" y="60" fontSize="16" fill="#6c7086" textAnchor="middle">×</text>

        {/* Box: avg latency */}
        <rect x="138" y="32" width="108" height="52" rx="6" fill="#89b4fa22" stroke="#89b4fa" strokeWidth="1.5"/>
        <text x="192" y="52" textAnchor="middle" fontSize="10" fill="#89b4fa" fontWeight="bold">Avg Latency</text>
        <text x="192" y="66" textAnchor="middle" fontSize="16" fill="#89b4fa" fontFamily="monospace" fontWeight="bold">{avgLatency}s</text>
        <text x="192" y="78" textAnchor="middle" fontSize="9" fill="#6c7086">P50 measured</text>

        {/* ÷ 60 */}
        <text x="258" y="60" fontSize="13" fill="#6c7086" textAnchor="middle">÷ 60</text>

        {/* Arrow */}
        <line x1="280" y1="58" x2="314" y2="58" stroke="#6c7086" strokeWidth="1.5" markerEnd="url(#gate-arr)"/>

        {/* Box: gate size */}
        <rect x="314" y="28" width="108" height="60" rx="6" fill="#a6e3a122" stroke="#a6e3a1" strokeWidth="2"/>
        <text x="368" y="48" textAnchor="middle" fontSize="10" fill="#a6e3a1" fontWeight="bold">Gate Size</text>
        <text x="368" y="68" textAnchor="middle" fontSize="22" fill="#a6e3a1" fontFamily="monospace" fontWeight="bold">{maxConcurrent}</text>
        <text x="368" y="82" textAnchor="middle" fontSize="9" fill="#6c7086">max concurrent</text>

        {/* Arrow to utilisation */}
        <line x1="422" y1="58" x2="456" y2="58" stroke="#fab387" strokeWidth="1.5" markerEnd="url(#gate-arr-peach)"/>
        <rect x="456" y="28" width="96" height="60" rx="6" fill="#fab38722" stroke="#fab387" strokeWidth="1.5"/>
        <text x="504" y="48" textAnchor="middle" fontSize="10" fill="#fab387" fontWeight="bold">Utilisation</text>
        <text x="504" y="68" textAnchor="middle" fontSize="18" fill="#fab387" fontFamily="monospace" fontWeight="bold">{gateUtilPct.toFixed(0)}%</text>
        <text x="504" y="82" textAnchor="middle" fontSize="9" fill="#6c7086">at peak QPS 1M DAU</text>

        {/* Utilisation bar */}
        <text x="10" y="108" fontSize="10" fill="#6c7086">Gate utilisation at peak:</text>
        <rect x="10" y="115" width={barW} height="16" rx="3" fill="#313244"/>
        <rect x="10" y="115" width={barW * gateUtilPct / 100} height="16" rx="3" fill={gateUtilPct > 80 ? '#f38ba8' : gateUtilPct > 50 ? '#fab387' : '#a6e3a1'}/>
        <text x={14 + barW * gateUtilPct / 100} y="127" fontSize="10" fill="#cdd6f4">{gateUtilPct.toFixed(1)}%</text>

        {/* Housing.com annotation */}
        <text x="10" y="152" fontSize="10" fill="#6c7086">Housing.com example:</text>
        <text x="10" y="165" fontSize="10" fill="#cdd6f4" fontFamily="monospace">({RPM} RPM × {avgLatency}s) / 60 = {maxConcurrent} concurrent requests max</text>
      </svg>
    </div>
  );
}

function crc16(str: string): number {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (crc >> 1) ^ 0xA001 : crc >> 1;
    }
  }
  return crc & 0x3FFF;
}

function RedisHashTagViz() {
  const [key1, setKey1] = useState('{user:42}:session');
  const [key2, setKey2] = useState('{user:42}:prefs');

  function extractHashTag(key: string): string {
    const m = key.match(/\{([^}]*)\}/);
    return m ? m[1] : key;
  }

  function getSlot(key: string): number {
    return crc16(extractHashTag(key));
  }

  function getNode(slot: number): number {
    if (slot <= 5460) return 0;
    if (slot <= 10922) return 1;
    return 2;
  }

  const nodes = [
    { x: 60,  label: 'Node 0', range: '0–5460',       color: '#89b4fa' },
    { x: 200, label: 'Node 1', range: '5461–10922',   color: '#cba6f7' },
    { x: 340, label: 'Node 2', range: '10923–16383',  color: '#a6e3a1' },
  ];

  const slot1 = getSlot(key1);
  const slot2 = getSlot(key2);
  const node1 = getNode(slot1);
  const node2 = getNode(slot2);
  const tag1 = extractHashTag(key1);
  const tag2 = extractHashTag(key2);
  const colocated = node1 === node2;

  // Arrow from key label area (y=28) to node circle top (y=90-28=62)
  // Key 1 arrow: from x=60 top area down to node circle
  const arrow1X = nodes[node1].x;
  const arrow2X = nodes[node2].x;

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'16px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>REDIS HASH TAG — SLOT ASSIGNMENT VISUALIZER</div>

      {/* Input row */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px'}}>
        {[
          { label: 'Key 1', value: key1, set: setKey1, color: '#f9e2af' },
          { label: 'Key 2', value: key2, set: setKey2, color: '#fab387' },
        ].map(({ label, value, set, color }) => (
          <div key={label}>
            <div style={{fontSize:'0.7rem',color:'#6c7086',marginBottom:'4px'}}>{label}</div>
            <input
              type="text"
              value={value}
              onChange={e => set(e.target.value)}
              style={{
                width:'100%',
                boxSizing:'border-box',
                background:'#1e1e2e',
                border:`1px solid ${color}44`,
                borderRadius:'5px',
                color,
                fontFamily:'monospace',
                fontSize:'0.82rem',
                padding:'6px 10px',
                outline:'none',
              }}
            />
          </div>
        ))}
      </div>

      {/* SVG diagram */}
      <svg viewBox="0 0 400 180" width="100%" style={{display:'block',overflow:'visible'}} aria-label="Redis cluster slot assignment diagram">
        <defs>
          <marker id="ht-arr1" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#f9e2af"/>
          </marker>
          <marker id="ht-arr2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#fab387"/>
          </marker>
        </defs>

        {/* Node circles */}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle
              cx={n.x} cy={90} r={28}
              fill={`${n.color}18`}
              stroke={n.color}
              strokeWidth={colocated && node1 === i ? 2.5 : 1.5}
            />
            <text x={n.x} y={86} textAnchor="middle" fontSize="11" fill={n.color} fontWeight="bold">{n.label}</text>
            <text x={n.x} y={99} textAnchor="middle" fontSize="8" fill="#6c7086">{n.range}</text>
          </g>
        ))}

        {/* Key 1 arrow */}
        <text x={arrow1X} y={24} textAnchor="middle" fontSize="9" fill="#f9e2af" fontFamily="monospace">
          {key1.length > 20 ? key1.slice(0, 20) + '…' : key1}
        </text>
        <line
          x1={arrow1X} y1={28}
          x2={arrow1X} y2={58}
          stroke="#f9e2af" strokeWidth="1.5" strokeDasharray="3 2"
          markerEnd="url(#ht-arr1)"
        />

        {/* Key 2 arrow — offset slightly if same node to avoid overlap */}
        {colocated ? (
          <>
            <text x={arrow2X + 14} y={24} textAnchor="middle" fontSize="9" fill="#fab387" fontFamily="monospace">
              {key2.length > 18 ? key2.slice(0, 18) + '…' : key2}
            </text>
            <line
              x1={arrow2X + 10} y1={28}
              x2={arrow2X + 10} y2={58}
              stroke="#fab387" strokeWidth="1.5" strokeDasharray="3 2"
              markerEnd="url(#ht-arr2)"
            />
          </>
        ) : (
          <>
            <text x={arrow2X} y={24} textAnchor="middle" fontSize="9" fill="#fab387" fontFamily="monospace">
              {key2.length > 20 ? key2.slice(0, 20) + '…' : key2}
            </text>
            <line
              x1={arrow2X} y1={28}
              x2={arrow2X} y2={58}
              stroke="#fab387" strokeWidth="1.5" strokeDasharray="3 2"
              markerEnd="url(#ht-arr2)"
            />
          </>
        )}

        {/* Co-location badge */}
        {colocated && (
          <text x="200" y="148" textAnchor="middle" fontSize="10" fill="#a6e3a1" fontWeight="bold">
            Co-located on Node {node1} — pipelines and Lua scripts work
          </text>
        )}
        {!colocated && (
          <text x="200" y="148" textAnchor="middle" fontSize="10" fill="#f38ba8">
            Different nodes — cross-slot ops will fail
          </text>
        )}
      </svg>

      {/* Slot computation display */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginTop:'10px'}}>
        {[
          { keyVal: key1, tag: tag1, slot: slot1, node: node1, color: '#f9e2af' },
          { keyVal: key2, tag: tag2, slot: slot2, node: node2, color: '#fab387' },
        ].map(({ keyVal, tag, slot, node, color }) => (
          <div key={keyVal} style={{background:'#1e1e2e',border:`1px solid ${color}33`,borderRadius:'6px',padding:'8px 12px',fontFamily:'monospace',fontSize:'0.75rem'}}>
            <div style={{color:'#6c7086',marginBottom:'2px'}}>Key: <span style={{color}}>{keyVal.length > 22 ? keyVal.slice(0, 22) + '…' : keyVal}</span></div>
            <div style={{color:'#6c7086',marginBottom:'2px'}}>Hash tag: <span style={{color:'#cdd6f4'}}>{tag}</span></div>
            <div style={{color:'#6c7086',marginBottom:'2px'}}>Slot: <span style={{color:'#cdd6f4'}}>{slot}</span></div>
            <div style={{color:'#6c7086'}}>Node: <span style={{color,fontWeight:700}}>Node {node}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CODE_SESSION_SIZE = `# Check your actual session size
import sys
session_data = json.dumps(state.model_dump())  # Pydantic v2: use model_dump(), not dict()
print(f"Session size: {sys.getsizeof(session_data) / 1024:.1f} KB")`;

const CODE_REDIS_HASH_TAGS = `# Without hash tags: session:abc and session:abc:ver may be on different nodes
redis.set("session:abc", data)
redis.set("session:abc:ver", 3)

# With hash tags: both keys hash by {abc} → guaranteed same node
redis.set("session:{abc}", data)
redis.set("session:{abc}:ver", 3)
# Now: MULTI / Lua scripts / pipelines work across these two keys`;

const CODE_ALB_STICKY = `# AWS ALB sticky session config
TargetGroup:
  StickinessEnabled: true
  StickinessType: lb_cookie
  StickinessDurationSeconds: 300   # longer than any LLM response (typically <30s)`;

const CODE_KAFKA_PRODUCE = `await producer.send(
    "housing-chat-events",
    key=state.session_id.encode(),   # all events for a session → same partition
    value=event_json.encode(),
)
# At 1M DAU × 4 events/session = 4M events/day = ~46 events/sec avg
# Peak 10x = 460 events/sec → 10 partitions (each handles ~1,000 msg/sec max)`;

const CODE_RPM_PLANNING = `# RPM from concurrency gate
# 50 concurrent × (60s / avg 3s latency) = 1,000 RPM consumed
# Scale: 1,000 concurrent gates → 20,000 RPM

# Planning formula:
# peak_active_sessions = DAU × 0.05
# LLM calls/min = peak_active_sessions × (turns_per_min)
# turns_per_min = 1 turn / avg_think_time_sec × 60

# Azure PTU alternative:
# Buy capacity blocks (Provisioned Throughput Units) instead of RPM throttling.
# 100 PTUs ≈ 10,000 RPM for GPT-4o-mini class models — predictable cost, no throttle spikes.`;

const CODE_GATE_FORMULA = `# Formula: RPM_consumed = max_concurrent / avg_latency_seconds * 60
# Example: 50 concurrent / 3s avg × 60 = 1,000 RPM

# Where does "avg 3s" come from?
# It's the measured average for a Haiku LLM call in this codebase:
#   ~200ms classification + ~280ms Housing API + ~1200ms LLM streaming + overhead = ~1.7s P50
#   But P95 is ~4s (slow queries, cache misses). Avg ≈ 3s.
# Measure yours: log latency in llm_node, P50 and P95.

# Setting the gate too high: exceeds API RPM limit → 429 errors → SSE streams die mid-message.
# Setting too low: queues up → users wait → timeout.
# Start conservative (50), measure, increase 10% at a time.`;

export function Mod11() {
  return (
    <>
      <DAUCalcViz />
      <h2>18.1 The Scale Math</h2>
      <p>AI pipelines have three bottlenecks that differ from standard web services: <strong>Redis memory</strong> (session size grows), <strong>LLM rate limits</strong> (API quotas), and <strong>SSE connection pinning</strong> (can't load-balance freely).</p>
      <table>
        <tbody>
          <tr><th>Metric</th><th>10K DAU</th><th>100K DAU</th><th>1M DAU</th></tr>
          <tr><td>Peak concurrent sessions (5%)</td><td>500</td><td>5,000</td><td>50,000</td></tr>
          <tr><td>Redis active session data (15KB/session)</td><td>~7.5MB</td><td>~75MB</td><td>~750MB–15GB*</td></tr>
          <tr><td>LLM RPM at 4 turns/session</td><td>~200</td><td>~2,000</td><td>~20,000</td></tr>
          <tr><td>Kafka events/day (4 events/session)</td><td>40K</td><td>400K</td><td>4M</td></tr>
          <tr><td>FastAPI instances (50 SSE/instance)</td><td>10</td><td>100</td><td>1,000</td></tr>
        </tbody>
      </table>
      <p style={{fontSize: "11px"}}>*15GB assumes 24h TTL and 20 turns/session avg. With 1h TTL it drops to ~750MB — because fewer sessions are active at any instant.</p>
      <div className="callout callout-info">
        <strong>Where do these numbers come from? (Priya's question answered)</strong>
        <ul style={{margin: "4px 0 0 16px", fontSize: "13px"}}>
          <li><strong>5% peak concurrency:</strong> Industry benchmark — at any given moment, ~5% of daily active users are actively using the product. For a chat app this is 12pm-2pm local time. If 1M people use the app over 24h, ~50K are talking simultaneously at peak. (Rule of thumb: 1-5% for consumer apps, 10-15% for real-time apps like trading.)</li>
          <li><strong>15KB/session:</strong> Measured on this codebase. Turn history (10 turns × ~800 chars each) + active_filters JSON + carousel state + metadata ≈ 10-20KB. At 20 turns it hits 15KB. Profile with the code above.</li>
          <li><strong>4 turns/session:</strong> Measured average on Housing.com search sessions. Search → refine → click detail → ask follow-up = 4 interactions.</li>
          <li><strong>50 SSE connections/instance:</strong> Each SSE stream holds a TCP connection open. At 50 concurrent LLM calls (the gate limit) + some idle sessions, memory usage per FastAPI instance hits ~512MB. Above that, GC pressure increases. Tune to your instance size.</li>
        </ul>
      </div>

      <h2>18.2 Redis at Scale</h2>
      <p>Session size grows with conversation length. A 20-turn session with applied filters and tool results is ~15KB.</p>
      <CodeBlock title="Session Size Profiler — Measure Before Scaling" language="python" keyLine={2} keyNote="model_dump() is Pydantic v2; dict() silently fails">{CODE_SESSION_SIZE}</CodeBlock>
      <div className="callout callout-warn">
        <strong>Redis Cluster — what "cross-slot transactions" means and why to avoid them</strong>
        Redis Cluster shards data across N nodes by hashing the key. Different keys hash to different slots (0–16383), which may live on different physical nodes.
        <br /><br />
        Problem: if a session uses keys <code>session:abc</code>, <code>session:abc:ver</code>, and <code>gate:abc:count</code> — those might hash to three different nodes. Redis does not support multi-key commands (MSET, pipelines, Lua scripts) across nodes. The Lua script we use for optimistic locking (<code>session + version + update atomically</code>) would silently fail.
        <br /><br />
        Fix: use Redis hash tags — surround a common substring with <code>{"{}"}</code>. Everything inside <code>{"{}"}</code> determines the slot. The CRC16 of the bracketed portion is taken mod 16384 to pick one of the 16384 slots, which maps to a specific cluster node:
        <CodeBlock title="Redis Hash Tags — Force Same Cluster Slot" language="python" keyLine={6} keyNote="curly-brace tag forces both keys to same shard">{CODE_REDIS_HASH_TAGS}</CodeBlock>
        When active session data exceeds ~10GB, move to Redis Cluster and add hash tags to all related keys.
      </div>
      <RedisHashTagViz />

      <h2>18.3 Horizontal Scaling — The SSE Stickiness Problem</h2>
      <p>FastAPI instances are stateless for REST routes. SSE is different: the <code>asyncio.Queue</code> lives in the server process's memory. If a client's SSE connection hops to a different instance, the queue doesn't follow — the client sees silence.</p>
      <CodeBlock title="AWS ALB Sticky Session — SSE Connection Pinning" language="yaml" keyLine={4} keyNote="duration must exceed longest LLM response latency">{CODE_ALB_STICKY}</CodeBlock>
      <div className="callout callout-warn">
        <strong>What happens during ALB rebalancing? (Alex's question)</strong>
        AWS ALB rebalances targets when instances are added/removed (deploys, autoscaling). During rebalancing, sticky cookie sessions may be temporarily violated — the cookie points to the old instance, but the load balancer routes to a new one.
        <br /><br />
        When this happens with SSE: the <code>asyncio.Queue</code> lives in the old instance's memory. The client reconnects to the new instance. The new instance has no queue for this <code>session_id</code>. The SSE generator immediately returns no data. The client sees the stream silently drop.
        <br /><br />
        <strong>Browser-side mitigation:</strong> the <code>EventSource</code> API auto-reconnects on disconnect (with exponential backoff). If the server sends <code>id:</code> fields on each SSE frame, the browser will send <code>Last-Event-ID</code> on reconnect. The server can replay missed frames from Redis.
        <br /><br />
        <strong>Server-side mitigation:</strong> use Redis Pub/Sub or Redis Streams as a durable queue instead of in-process <code>asyncio.Queue</code>. Any instance can consume the same stream, eliminating the per-instance stickiness dependency.
      </div>
      <div className="callout callout-info"><strong>Alternative: Redis Pub/Sub</strong>Replace <code>asyncio.Queue</code> with a Redis Stream keyed on <code>session_id</code>. Any instance emits; any instance consumes. Eliminates stickiness at the cost of one Redis round-trip per SSE frame (~0.5ms on same AZ).</div>

      <h2>18.4 Kafka Partition Strategy</h2>
      <div className="callout callout-tip">
        <strong>Kafka 101 — and why not just INSERT into Postgres?</strong>
        Kafka is a <em>durable, distributed event log</em>. When you "produce" an event to Kafka, it's written to disk and available for any number of "consumers" to read independently at their own pace — even if they were offline when the event was produced.
        <br /><br />
        <strong>Why not Postgres INSERT?</strong>
        <table style={{fontSize: "12px", marginTop: "8px"}}>
          <tbody>
            <tr><th>Concern</th><th>Postgres INSERT</th><th>Kafka produce</th></tr>
            <tr><td>Speed (on hot path)</td><td>5-50ms (network + disk + ACID)</td><td>~1ms fire-and-forget (async batch)</td></tr>
            <tr><td>Multiple consumers</td><td>Each consumer polls the table, competes for rows</td><td>Each consumer has its own independent offset pointer — no competition</td></tr>
            <tr><td>Replay / recovery</td><td>You'd need audit tables or CDC</td><td>Built-in: replay from any point in time</td></tr>
            <tr><td>Decoupling</td><td>Producer must know the schema consumers need</td><td>Producer emits a raw event; each consumer transforms it for their own use</td></tr>
          </tbody>
        </table>
        In this codebase, Kafka is <em>not</em> on the hot path — the user never waits for it. We fire-and-forget after sending the SSE response. Consumers (analytics, billing, monitoring) process events asynchronously.
      </div>
      <p>Partition key determines ordering guarantee. For conversation events, order matters within a conversation — use <code>session_id</code> as the partition key.</p>
      <CodeBlock title="Kafka Producer — Session-ID Partition Key" language="python" keyLine={3} keyNote="same key = same partition = ordered events per session">{CODE_KAFKA_PRODUCE}</CodeBlock>

      <LLMGateViz />
      <h2>18.5 LLM API Rate Limits</h2>
      <p>Anthropic rate-limits by RPM and TPM. Your concurrency gate is your RPM enforcer — size it to match your API tier.</p>
      <CodeBlock title="RPM Capacity Planning — From Gate to API Tier" language="python" keyLine={9} keyNote="Azure PTU buys predictable throughput, no throttle spikes">{CODE_RPM_PLANNING}</CodeBlock>
      <div className="callout callout-tip">
        <strong>The gate IS your rate limiter — and here's how to size it</strong>
        <CodeBlock title="Concurrency Gate Sizing — Measure P95, Start Conservative" language="python" keyLine={9} keyNote="start at 50, measure, increase 10% at a time">{CODE_GATE_FORMULA}</CodeBlock>
      </div>

      <QuizSection moduleId={20} title="Module 20" contentHint="DAU scale math table, Redis memory planning, sticky sessions for SSE, Kafka partition strategy, LLM RPM gate formula" />
    </>
  );
}
