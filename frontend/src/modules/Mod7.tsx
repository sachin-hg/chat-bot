import { useState, useRef, useEffect } from 'react';
import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from '../components/CodeBlock';

function HashAssignmentViz() {
  const [sessionId, setSessionId] = useState('user_abc123');
  const [pulsing, setPulsing] = useState(false);
  const experimentKey = 'exp_model_haiku_v1';
  const trafficSplit = 20;

  function simpleHash(str: string): number {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h) ^ str.charCodeAt(i);
      h = h >>> 0;
    }
    return h % 100;
  }

  const hashValue = simpleHash(sessionId + experimentKey);
  const bucket = hashValue < trafficSplit ? 'TREATMENT' : 'CONTROL';
  const bucketColor = bucket === 'TREATMENT' ? '#a6e3a1' : '#89b4fa';
  const prevBucketRef = useRef(bucket);
  useEffect(() => {
    if (prevBucketRef.current !== bucket) {
      prevBucketRef.current = bucket;
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), 600);
      return () => clearTimeout(t);
    }
  });

  const barFill = (hashValue / 100) * 460;

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <style>{`
        @keyframes dashFlow7hash { to { stroke-dashoffset: -14; } }
        .hash-dash { animation: dashFlow7hash 1s linear infinite; }
      `}</style>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>DETERMINISTIC HASH ASSIGNMENT — CONSISTENT BUCKETING WITHOUT STORING STATE</div>

      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px',flexWrap:'wrap'}}>
        <label style={{fontSize:'0.8rem',color:'#bac2de',whiteSpace:'nowrap'}}>session_id:</label>
        <input
          value={sessionId}
          onChange={e => setSessionId(e.target.value)}
          style={{background:'#313244',color:'#cdd6f4',border:'1px solid #45475a',borderRadius:'6px',padding:'5px 10px',fontSize:'0.82rem',fontFamily:'monospace',width:'200px'}}
        />
        <span style={{fontSize:'0.78rem',color:'#6c7086'}}>experiment_key: <span style={{color:'#cba6f7',fontFamily:'monospace'}}>{experimentKey}</span></span>
      </div>

      <svg viewBox="0 0 560 160" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Hash assignment diagram">
        <defs>
          <marker id="hash-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#6c7086"/>
          </marker>
          <marker id="hash-arr-bucket" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={bucketColor}/>
          </marker>
        </defs>

        {/* Step 1: session_id box */}
        <rect x="6" y="30" width="108" height="36" rx="6" fill="#313244" stroke="#45475a" strokeWidth="1.5"/>
        <text x="60" y="47" textAnchor="middle" fontSize="9" fill="#6c7086">session_id</text>
        <text x="60" y="59" textAnchor="middle" fontSize="9" fill="#cdd6f4" fontFamily="monospace">{sessionId.slice(0,13)}</text>

        {/* Arrow */}
        <line x1="114" y1="48" x2="146" y2="48" stroke="#6c7086" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#hash-arr)" className="hash-dash"/>

        {/* Step 2: hash function */}
        <rect x="146" y="20" width="108" height="56" rx="6" fill="#45475a" stroke="#cba6f7" strokeWidth="1.5"/>
        <text x="200" y="40" textAnchor="middle" fontSize="10" fill="#cba6f7" fontWeight="bold">hash()</text>
        <text x="200" y="54" textAnchor="middle" fontSize="9" fill="#bac2de">session_id +</text>
        <text x="200" y="66" textAnchor="middle" fontSize="9" fill="#bac2de">experiment_key</text>

        {/* Arrow */}
        <line x1="254" y1="48" x2="286" y2="48" stroke="#6c7086" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#hash-arr)" className="hash-dash"/>

        {/* Step 3: hash value */}
        <rect x="286" y="28" width="80" height="40" rx="6" fill="#313244" stroke="#f9e2af" strokeWidth="1.5"/>
        <text x="326" y="45" textAnchor="middle" fontSize="11" fill="#f9e2af" fontFamily="monospace" fontWeight="bold">{hashValue}</text>
        <text x="326" y="59" textAnchor="middle" fontSize="9" fill="#6c7086">0–99 bucket</text>

        {/* Arrow */}
        <line x1="366" y1="48" x2="398" y2="48" stroke={bucketColor} strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#hash-arr-bucket)" className="hash-dash"/>

        {/* Step 4: assignment */}
        <rect x="398" y="20" width="152" height="56" rx="6" fill={bucket==='TREATMENT'?'#a6e3a122':'#89b4fa22'} stroke={bucketColor} strokeWidth="1.5" className={pulsing ? 'anim-pulse-accent' : ''}/>
        <text x="474" y="40" textAnchor="middle" fontSize="12" fill={bucketColor} fontWeight="bold">{bucket}</text>
        <text x="474" y="56" textAnchor="middle" fontSize="9" fill="#bac2de">
          {bucket === 'TREATMENT' ? `${hashValue} < ${trafficSplit} (split)` : `${hashValue} ≥ ${trafficSplit} (split)`}
        </text>
        <text x="474" y="68" textAnchor="middle" fontSize="9" fill="#6c7086">traffic_split = {trafficSplit}%</text>

        {/* Bucket bar */}
        <text x="10" y="108" fontSize="10" fill="#6c7086">0</text>
        <rect x="20" y="114" width="460" height="14" rx="3" fill="#313244"/>
        {/* treatment zone */}
        <rect x="20" y="114" width={trafficSplit * 4.6} height="14" rx="3" fill="#a6e3a133"/>
        <rect x="20" y="114" width={barFill} height="14" rx="3" fill={bucketColor} opacity="0.7"/>
        <line x1={20 + trafficSplit * 4.6} y1="110" x2={20 + trafficSplit * 4.6} y2="132" stroke="#f9e2af" strokeWidth="1.5" strokeDasharray="3 2"/>
        <text x="10" y="148" fontSize="10" fill="#6c7086">0</text>
        <text x={20 + trafficSplit * 4.6 - 6} y="148" fontSize="10" fill="#f9e2af">{trafficSplit}</text>
        <text x="484" y="148" fontSize="10" fill="#6c7086">100</text>
        <text x={20 + trafficSplit * 4.6 / 2} y="148" textAnchor="middle" fontSize="9" fill="#a6e3a1">treatment</text>
        <text x={20 + trafficSplit * 4.6 + (460 - trafficSplit * 4.6) / 2} y="148" textAnchor="middle" fontSize="9" fill="#89b4fa">control</text>
        <text x="484" y="121" fontSize="10" fill="#6c7086" textAnchor="end">100</text>
      </svg>

      <div style={{marginTop:'10px',padding:'8px 12px',background:'#313244',borderRadius:'6px',fontSize:'0.8rem',color:'#cdd6f4',fontFamily:'monospace'}}>
        Session <span style={{color:'#cba6f7'}}>{sessionId || '…'}</span> → hash: <span style={{color:'#f9e2af'}}>{hashValue}</span> → <span style={{color:bucketColor,fontWeight:'bold'}}>{bucket}</span> ({hashValue} {bucket==='TREATMENT'?'<':'≥'} {trafficSplit})
      </div>
    </div>
  );
}

function StatSigViz() {
  const [mde, setMde] = useState(0.05);
  const [n, setN] = useState(500);
  const baseline = 0.82;
  const dailyTraffic = 500;

  // Standard error of a proportion
  const se = Math.sqrt((baseline * (1 - baseline)) / n);
  const toX = (v: number) => 30 + (v - (baseline - 0.15)) * 900;
  const controlCenter = toX(baseline);
  const treatmentCenter = toX(baseline + mde);
  const stdPx = se * 900;
  const height = Math.min(110, 30 / (se * 10));
  const baseY = 165;

  function bellY(x: number, center: number): number {
    return baseY - height * Math.exp(-0.5 * ((x - center) / stdPx) ** 2);
  }

  const xs = Array.from({length: 500}, (_, i) => 20 + i * 1.04);
  let controlPath = `M ${xs[0]} ${bellY(xs[0], controlCenter)}`;
  let treatmentPath = `M ${xs[0]} ${bellY(xs[0], treatmentCenter)}`;
  xs.forEach(x => {
    controlPath += ` L ${x} ${bellY(x, controlCenter)}`;
    treatmentPath += ` L ${x} ${bellY(x, treatmentCenter)}`;
  });

  // Overlap region: area where curves intersect
  const overlapXs = xs.filter(x => {
    const cy = bellY(x, controlCenter);
    const ty = bellY(x, treatmentCenter);
    return cy < baseY - 2 && ty < baseY - 2;
  });
  let overlapPath = '';
  if (overlapXs.length > 0) {
    overlapPath = `M ${overlapXs[0]} ${baseY}`;
    overlapXs.forEach(x => {
      overlapPath += ` L ${x} ${Math.min(bellY(x, controlCenter), bellY(x, treatmentCenter))}`;
    });
    overlapPath += ` L ${overlapXs[overlapXs.length-1]} ${baseY} Z`;
  }

  // p<0.05 critical value
  const critX = controlCenter + 1.645 * stdPx;

  // Overlap percent estimate: ratio of stdPx to separation
  const separation = Math.abs(treatmentCenter - controlCenter);
  const overlapPct = Math.max(0, Math.min(100, Math.round((1 - separation / (2.5 * stdPx)) * 100)));
  const overlapColor = overlapPct > 60 ? '#f38ba8' : overlapPct > 30 ? '#f9e2af' : '#a6e3a1';

  // Sample size estimate: N per arm for 80% power
  const z_alpha = 1.96, z_power = 0.842;
  const p_t = baseline + mde;
  const pooledSe = Math.sqrt(2 * baseline * (1 - baseline) / n);
  const zScore = mde / pooledSe;
  const isPowered = zScore > (z_alpha + z_power);
  const nRequired = Math.ceil(2 * ((z_alpha + z_power) ** 2) * baseline * (1 - baseline) / (mde ** 2));
  const daysRequired = Math.ceil(nRequired * 2 / dailyTraffic);

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'12px'}}>
        STATISTICAL SIGNIFICANCE — ADJUST SLIDERS TO SEE POWER CHANGE
      </div>
      <div style={{display:'flex',gap:'24px',marginBottom:'12px',flexWrap:'wrap',alignItems:'flex-end'}}>
        <label style={{display:'flex',flexDirection:'column',gap:'4px',fontSize:'0.8rem',color:'#cba6f7',minWidth:'180px'}}>
          MDE (min detectable effect): <strong>{(mde * 100).toFixed(0)}pp</strong>
          <input type="range" min="1" max="15" step="1" value={Math.round(mde * 100)}
            onChange={e => setMde(Number(e.target.value) / 100)}
            style={{accentColor:'#cba6f7',width:'180px'}}/>
        </label>
        <label style={{display:'flex',flexDirection:'column',gap:'4px',fontSize:'0.8rem',color:'#89b4fa',minWidth:'180px'}}>
          N per arm: <strong>{n.toLocaleString()}</strong>
          <input type="range" min="100" max="5000" step="100" value={n}
            onChange={e => setN(Number(e.target.value))}
            style={{accentColor:'#89b4fa',width:'180px'}}/>
        </label>
        <div style={{fontFamily:'monospace',fontSize:'1.5rem',fontWeight:700,color:isPowered?'#a6e3a1':'#f38ba8',letterSpacing:'-0.02em'}}>
          {daysRequired} days
          <div style={{fontSize:'0.72rem',fontWeight:400,color:'#6c7086',letterSpacing:'0.04em'}}>to significance</div>
        </div>
      </div>
      <svg viewBox="0 0 560 195" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Statistical significance bell curves">
        <text x="8" y="14" fontSize="9" fill="#6c7086">density</text>
        <path d={overlapPath} fill={`${overlapColor}22`}/>
        <path d={controlPath} fill="none" stroke="#89b4fa" strokeWidth="2"/>
        <path d={treatmentPath} fill="none" stroke="#a6e3a1" strokeWidth="2"/>
        <line x1="20" y1={baseY} x2="540" y2={baseY} stroke="#45475a" strokeWidth="1"/>
        <line x1={critX} y1="18" x2={critX} y2={baseY} stroke="#f9e2af" strokeWidth="1.5" strokeDasharray="4 3"/>
        <text x={controlCenter} y={baseY - height - 8} textAnchor="middle" fontSize="11" fill="#89b4fa">Control μ={baseline.toFixed(2)}</text>
        <text x={treatmentCenter} y={baseY - height - 8} textAnchor="middle" fontSize="11" fill="#a6e3a1">Treatment μ={(baseline+mde).toFixed(2)}</text>
        <text x={critX + 4} y="28" fontSize="9" fill="#f9e2af">α=0.05</text>
        <text x={(controlCenter+treatmentCenter)/2} y={baseY+14} textAnchor="middle" fontSize="9" fill={overlapColor}>
          {overlapPct}% overlap — {isPowered ? '✓ powered' : '⚠ underpowered'}
        </text>
        <text x="10" y="190" fontSize="9" fill="#6c7086">need N≥{nRequired.toLocaleString()} per arm ({daysRequired} days @ {dailyTraffic}/day)</text>
      </svg>
    </div>
  );
}

const CODE_ASSIGN_VARIANT = `# Deterministic: same session always gets the same variant
def assign_variant(session_id: str, experiment_id: str, traffic_pct: float) -> str:
    h = int(hashlib.md5(f"{experiment_id}:{session_id}".encode()).hexdigest(), 16)
    bucket = (h % 1000) / 1000.0     # 0.000 → 0.999
    if bucket >= traffic_pct:
        return "control"
    return "treatment" if bucket < traffic_pct / 2 else "control"`;

const CODE_EXPERIMENT_NODE = `async def experiment_node(state: BotState) -> dict:
    config = load_experiment_config()  # hot-loaded every 60s from config/experiments.yaml
    for exp in config.active_experiments:
        variant = assign_variant(state['session']['session_id'], exp.id, exp.traffic_pct)
        if variant == "treatment" and exp.override_model:
            return {
                "experiment_id": exp.id,
                "experiment_variant": variant,
                "routing": {"model_override_task": exp.override_model}
            }
    return {"experiment_id": None, "experiment_variant": "control"}`;

const CODE_SAMPLE_SIZE = `import math

def min_sample_size_per_arm(baseline_rate, mde, alpha=0.05, power=0.80):
    """
    baseline_rate: current metric (e.g. 0.87 = 87% accuracy)
    mde: minimum detectable effect — smallest change worth caring about (e.g. 0.03 = 3pp)
    alpha: false positive rate (0.05 = 5%)
    power: probability of detecting a real effect (0.80 = 80%)
    """
    z_alpha = 1.96   # for alpha=0.05 (two-tailed)
    z_beta  = 0.842  # for power=0.80
    p1 = baseline_rate
    p2 = baseline_rate + mde
    p_bar = (p1 + p2) / 2
    n = ((z_alpha + z_beta)**2 * 2 * p_bar * (1 - p_bar)) / (mde**2)
    return math.ceil(n)

# Example: current accuracy 87%, want to detect 3pp improvement
n = min_sample_size_per_arm(0.87, 0.03)
# → 1,082 sessions per arm = 2,164 total
# At 1,000 sessions/day with 20% traffic split → 400/day total → 5.4 days minimum`;

export function Mod7() {
  return (
    <>
      <HashAssignmentViz />
      <h2>6.1 Why Experiment?</h2>
      <p>You can't intuit whether Sonnet generates better responses than Haiku for housing queries. You need data. The experiment framework lets you run controlled tests on live traffic without a code deploy.</p>

      <h2>6.2 Deterministic Assignment</h2>
      <CodeBlock title="Deterministic Variant Assignment via Hash" language="python" keyLine={3} keyNote="MD5 hash of session+experiment gives stable 0-999 bucket">{CODE_ASSIGN_VARIANT}</CodeBlock>
      <div className="callout callout-info"><strong>Why deterministic?</strong>If assignment were random per request, the same user would get different variants mid-conversation — incoherent and unusable. Hash of session_id + experiment_id ensures a user always sees the same variant for the duration of the experiment.</div>

      <h2>6.3 The Experiment Node</h2>
      <CodeBlock title="Experiment Node — Hot-Loaded Config" language="python" keyLine={2} keyNote="Config hot-loaded every 60s enables flag changes without deploy">{CODE_EXPERIMENT_NODE}</CodeBlock>

      <StatSigViz />
      <h2>6.4 Statistical Validity</h2>
      <div className="callout callout-warn">
        <strong>Common mistake: peeking too early</strong>
        20% traffic, 50/50 split, 3 days, 500 sessions. The difference between Haiku and Sonnet may be real but the sample is too small to reach p&lt;0.05.<br /><br />
        Every session logs <code>experiment_id</code> and <code>experiment_variant</code> to Kafka for analysis.
      </div>

      <h2>6.5 Sample Size Calculation — Do This Before You Launch</h2>
      <p>Launching without a target sample size means you'll either stop too early (false positive) or waste traffic (stopped too late). Run the math upfront.</p>
      <div className="callout callout-info">
        <strong>The formula (simplified for proportions, e.g. intent accuracy or click-through rate):</strong>
        <CodeBlock title="Minimum Sample Size per Arm Calculator" language="python" keyLine={14} keyNote="Smaller MDE requires quadratically more sessions to detect">{CODE_SAMPLE_SIZE}</CodeBlock>

        <strong>Key insight: the smaller the effect you want to detect, the more sessions you need.</strong> A 3pp improvement needs 4x more sessions than a 6pp improvement.

        A 1pp improvement is almost never worth running — the experiment would take 7 weeks.
      </div>

      {/* Fix 3: standalone full-width sample size table with Signal Strength column */}
      <table style={{width:'100%',borderCollapse:'collapse',margin:'16px 0',fontSize:'0.82rem',background:'#181825',border:'1px solid #313244',borderRadius:'8px',overflow:'hidden'}}>
        <thead>
          <tr style={{background:'#1e1e2e'}}>
            <th style={{padding:'10px 14px',textAlign:'left',color:'#cba6f7',fontWeight:700,fontSize:'0.72rem',letterSpacing:'0.08em',textTransform:'uppercase',borderBottom:'1px solid #313244'}}>MDE to detect</th>
            <th style={{padding:'10px 14px',textAlign:'right',color:'#cba6f7',fontWeight:700,fontSize:'0.72rem',letterSpacing:'0.08em',textTransform:'uppercase',borderBottom:'1px solid #313244'}}>Sessions / arm</th>
            <th style={{padding:'10px 14px',textAlign:'right',color:'#cba6f7',fontWeight:700,fontSize:'0.72rem',letterSpacing:'0.08em',textTransform:'uppercase',borderBottom:'1px solid #313244'}}>Days @ 400/day</th>
            <th style={{padding:'10px 14px',textAlign:'left',color:'#cba6f7',fontWeight:700,fontSize:'0.72rem',letterSpacing:'0.08em',textTransform:'uppercase',borderBottom:'1px solid #313244'}}>Signal Strength</th>
          </tr>
        </thead>
        <tbody>
          {[
            {label:'6pp (0.87 → 0.93)', sessions:'~270', days:'~1.4 days', pct:100, color:'#a6e3a1'},
            {label:'3pp (0.87 → 0.90)', sessions:'~1,082', days:'~5.4 days', pct:55, color:'#f9e2af'},
            {label:'1pp (0.87 → 0.88)', sessions:'~9,726', days:'~48 days', pct:12, color:'#f38ba8'},
          ].map((row, i) => (
            <tr key={i} style={{borderBottom: i < 2 ? '1px solid #313244' : 'none'}}>
              <td style={{padding:'10px 14px',color:'#cdd6f4',fontFamily:'monospace'}}>{row.label}</td>
              <td style={{padding:'10px 14px',textAlign:'right',color:'#cdd6f4',fontFamily:'monospace'}}>{row.sessions}</td>
              <td style={{padding:'10px 14px',textAlign:'right',color:'#cdd6f4',fontFamily:'monospace'}}>{row.days}</td>
              <td style={{padding:'10px 14px'}}>
                <svg width="120" height="14" aria-label={`Signal strength ${row.pct}%`}>
                  <rect x="0" y="3" width="120" height="8" rx="4" fill="#313244"/>
                  <rect x="0" y="3" width={row.pct * 1.2} height="8" rx="4" fill={row.color} opacity="0.85"/>
                  <text x={row.pct * 1.2 + 5} y="11" fontSize="9" fill={row.color}>{row.pct}%</text>
                </svg>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="callout callout-gotcha">
        <strong>Sequential testing (the "peeking" trap)</strong>
        Checking significance every day increases your false positive rate. If you check daily for 14 days at α=0.05, your actual false positive rate is ~40%. Fix: commit to a fixed sample size before looking, or use a sequential testing method (e.g. always-valid p-values, Bayesian bandits). In practice: set a calendar reminder for day N and don't open the dashboard before then.
      </div>

      {/* Fix 4: p-value peeking line chart */}
      {(() => {
        const peeks = [1,2,3,4,5,6,7,8,9,10,11,12,13,14];
        const fpr = [0.05,0.08,0.11,0.13,0.15,0.17,0.18,0.20,0.21,0.22,0.23,0.24,0.245,0.25];
        const svgW = 520, svgH = 160;
        const padL = 46, padR = 16, padT = 14, padB = 36;
        const chartW = svgW - padL - padR;
        const chartH = svgH - padT - padB;
        const xMin = 1, xMax = 14, yMin = 0, yMax = 0.25;
        const px = (x: number) => padL + ((x - xMin) / (xMax - xMin)) * chartW;
        const py = (y: number) => padT + chartH - ((y - yMin) / (yMax - yMin)) * chartH;
        const linePath = peeks.map((x,i) => `${i===0?'M':'L'} ${px(x).toFixed(1)} ${py(fpr[i]).toFixed(1)}`).join(' ');
        const alphaY = py(0.05);
        const alphaDash = `M ${padL} ${alphaY.toFixed(1)} L ${(padL+chartW).toFixed(1)} ${alphaY.toFixed(1)}`;
        const yTicks = [0,0.05,0.10,0.15,0.20,0.25];
        const xTicks = [1,4,7,10,14];
        return (
          <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'16px 20px',margin:'16px 0',overflowX:'auto'}}>
            <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'10px'}}>FALSE POSITIVE RATE VS DAILY PEEKS — ONE CURVE, ONE LESSON</div>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{display:'block',minWidth:'280px'}} aria-label="False positive rate rises with more peeks">
              {/* grid lines */}
              {yTicks.map(y => (
                <line key={y} x1={padL} y1={py(y)} x2={padL+chartW} y2={py(y)} stroke="#313244" strokeWidth="1"/>
              ))}
              {/* nominal alpha dashed red line */}
              <path d={alphaDash} fill="none" stroke="#f38ba8" strokeWidth="1.5" strokeDasharray="5 3"/>
              <text x={padL+chartW-4} y={alphaY-4} textAnchor="end" fontSize="9" fill="#f38ba8">Nominal α=0.05</text>
              {/* the rising false positive rate line */}
              <path d={linePath} fill="none" stroke="#cba6f7" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
              {/* dot at last point */}
              <circle cx={px(14)} cy={py(0.25)} r="4" fill="#f38ba8"/>
              <text x={px(14)-4} y={py(0.25)-8} textAnchor="end" fontSize="9" fill="#f38ba8">25%</text>
              {/* axes */}
              <line x1={padL} y1={padT} x2={padL} y2={padT+chartH} stroke="#45475a" strokeWidth="1.5"/>
              <line x1={padL} y1={padT+chartH} x2={padL+chartW} y2={padT+chartH} stroke="#45475a" strokeWidth="1.5"/>
              {/* y axis ticks + labels */}
              {yTicks.map(y => (
                <g key={y}>
                  <line x1={padL-3} y1={py(y)} x2={padL} y2={py(y)} stroke="#45475a" strokeWidth="1"/>
                  <text x={padL-6} y={py(y)+3} textAnchor="end" fontSize="8.5" fill="#6c7086">{(y*100).toFixed(0)}%</text>
                </g>
              ))}
              {/* x axis ticks + labels */}
              {xTicks.map(x => (
                <g key={x}>
                  <line x1={px(x)} y1={padT+chartH} x2={px(x)} y2={padT+chartH+3} stroke="#45475a" strokeWidth="1"/>
                  <text x={px(x)} y={padT+chartH+13} textAnchor="middle" fontSize="8.5" fill="#6c7086">{x}</text>
                </g>
              ))}
              {/* axis labels */}
              <text x={padL+chartW/2} y={svgH-2} textAnchor="middle" fontSize="9" fill="#6c7086">Daily peeks</text>
              <text x="9" y={padT+chartH/2} textAnchor="middle" fontSize="9" fill="#6c7086" transform={`rotate(-90,9,${padT+chartH/2})`}>False positive rate</text>
            </svg>
          </div>
        );
      })()}

      <QuizSection moduleId={17} title="Module 17" contentHint="Deterministic assignment, auto-rollback guardrails, statistical validity, minimum sample size calculation, no-peek rule" />
    </>
  );
}
