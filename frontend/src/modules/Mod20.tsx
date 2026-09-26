import { useState } from "react";
import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from '../components/CodeBlock';

function MLProblemTypesViz() {
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>THE 4 ML PROBLEM TYPES — WITH HOUSING.COM EXAMPLES</div>
      <svg viewBox="0 0 560 200" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="4 ML problem types diagram">
        <defs>
          <marker id="ml-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#6c7086"/></marker>
        </defs>
        {/* Grid lines */}
        <line x1="280" y1="0" x2="280" y2="200" stroke="#313244" strokeWidth="1.5"/>
        <line x1="0" y1="100" x2="560" y2="100" stroke="#313244" strokeWidth="1.5"/>
        {/* Labels */}
        <text x="10" y="14" fontSize="10" fill="#6c7086" fontWeight="700">SUPERVISED</text>
        <text x="290" y="14" fontSize="10" fill="#6c7086" fontWeight="700">UNSUPERVISED / OTHER</text>

        {/* Q1: Classification (top-left, blue) */}
        <rect x="0" y="0" width="280" height="100" rx="0" fill="#89b4fa11"/>
        <text x="10" y="28" fontSize="11" fill="#89b4fa" fontWeight="700">Classification</text>
        {/* Scatter dots class A */}
        {[[30,55],[45,42],[55,60],[38,70],[60,48],[25,65],[50,75]].map(([x,y],i)=>(
          <circle key={`ca${i}`} cx={x+10} cy={y+18} r="4" fill="#89b4fa" opacity="0.8"/>
        ))}
        {/* Scatter dots class B */}
        {[[90,55],[105,42],[115,65],[100,72],[120,50],[85,68],[110,80]].map(([x,y],i)=>(
          <circle key={`cb${i}`} cx={x+10} cy={y+18} r="4" fill="#f38ba8" opacity="0.8"/>
        ))}
        {/* Decision boundary */}
        <line x1="75" y1="28" x2="75" y2="95" stroke="#f9e2af" strokeWidth="1.5" strokeDasharray="4 3"/>
        <text x="10" y="94" fontSize="9" fill="#bac2de">"Will user convert?" (classification)</text>

        {/* Q2: Regression (top-right, green) */}
        <rect x="280" y="0" width="280" height="100" rx="0" fill="#a6e3a111"/>
        <text x="290" y="28" fontSize="11" fill="#a6e3a1" fontWeight="700">Regression</text>
        {[[300,80],[320,72],[340,65],[360,55],[380,50],[400,40],[420,35]].map(([x,y],i)=>(
          <circle key={`rg${i}`} cx={x} cy={y} r="4" fill="#a6e3a1" opacity="0.8"/>
        ))}
        {/* Fitted line */}
        <line x1="295" y1="84" x2="425" y2="30" stroke="#a6e3a1" strokeWidth="2" opacity="0.7"/>
        <text x="290" y="94" fontSize="9" fill="#bac2de">"Predict property price" (regression)</text>

        {/* Q3: Clustering (bottom-left, yellow) */}
        <rect x="0" y="100" width="280" height="100" rx="0" fill="#f9e2af11"/>
        <text x="10" y="120" fontSize="11" fill="#f9e2af" fontWeight="700">Clustering</text>
        {/* Cluster 1 */}
        {[[30,145],[45,140],[38,155],[25,150]].map(([x,y],i)=>(
          <circle key={`cl1${i}`} cx={x} cy={y} r="5" fill="#f9e2af" opacity="0.85"/>
        ))}
        {/* Cluster 2 */}
        {[[100,135],[115,145],[105,155],[120,140]].map(([x,y],i)=>(
          <circle key={`cl2${i}`} cx={x} cy={y} r="5" fill="#fab387" opacity="0.85"/>
        ))}
        {/* Cluster 3 */}
        {[[180,140],[195,130],[185,155],[170,148]].map(([x,y],i)=>(
          <circle key={`cl3${i}`} cx={x} cy={y} r="5" fill="#cba6f7" opacity="0.85"/>
        ))}
        <text x="10" y="195" fontSize="9" fill="#bac2de">"Group user segments" (clustering)</text>

        {/* Q4: Reinforcement Learning (bottom-right, mauve) */}
        <rect x="280" y="100" width="280" height="100" rx="0" fill="#cba6f711"/>
        <text x="290" y="120" fontSize="11" fill="#cba6f7" fontWeight="700">Reinforcement Learning</text>
        {/* Maze grid */}
        {Array.from({length:5},(_,col)=>Array.from({length:3},(_,row)=>(
          <rect key={`mg-${col}-${row}`} x={295+col*36} y={128+row*20} width="34" height="18" rx="2" fill="#313244" stroke="#45475a" strokeWidth="0.5"/>
        )))}
        {/* Walls */}
        <rect x="367" y="128" width="34" height="18" rx="2" fill="#45475a"/>
        <rect x="331" y="148" width="34" height="18" rx="2" fill="#45475a"/>
        {/* Agent */}
        <circle cx="312" cy="137" r="6" fill="#cba6f7"/>
        <text x="312" y="141" textAnchor="middle" fontSize="8" fill="#1e1e2e" fontWeight="700">A</text>
        {/* Reward */}
        <text x="412" y="177" textAnchor="middle" fontSize="12" fill="#f9e2af">★</text>
        {/* Path arrow */}
        <path d="M318,137 L348,137 L348,165 L385,165 L385,145 L403,145 L403,172" stroke="#cba6f7" strokeWidth="1.5" fill="none" strokeDasharray="3 2" markerEnd="url(#ml-arrow)"/>
        <text x="290" y="195" fontSize="9" fill="#bac2de">"Optimize recommendation order" (RL)</text>
      </svg>
    </div>
  );
}

function TrainingInferenceViz() {
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>TRAINING vs INFERENCE — WEIGHT LEARNING vs WEIGHT READING</div>
      <style>{`
        @keyframes trainFlow { to { stroke-dashoffset: -14; } }
        @keyframes inferFlow { to { stroke-dashoffset: -14; } }
        .train-anim { animation: trainFlow 1s linear infinite; }
        .infer-anim { animation: inferFlow 1s linear infinite; }
      `}</style>
      <svg viewBox="0 0 560 200" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Training vs inference diagram">
        <defs>
          <marker id="train-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#fab387"/></marker>
          <marker id="infer-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#89b4fa"/></marker>
          <marker id="upd-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#f9e2af"/></marker>
        </defs>

        {/* Divider */}
        <line x1="280" y1="10" x2="280" y2="190" stroke="#45475a" strokeWidth="1"/>

        {/* === TRAINING SIDE === */}
        <text x="140" y="22" textAnchor="middle" fontSize="11" fill="#fab387" fontWeight="700">TRAINING</text>

        {/* Training Data */}
        <rect x="20" y="32" width="130" height="28" rx="6" fill="#313244" stroke="#fab387" strokeWidth="1.5"/>
        <text x="85" y="50" textAnchor="middle" fontSize="10" fill="#fab387">Training Data (50K)</text>

        {/* Arrow down */}
        <line x1="85" y1="60" x2="85" y2="74" stroke="#fab387" strokeWidth="1.5" strokeDasharray="4 3" className="train-anim" markerEnd="url(#train-arr)"/>

        {/* Model Architecture */}
        <rect x="20" y="75" width="130" height="28" rx="6" fill="#313244" stroke="#f9e2af" strokeWidth="1.5"/>
        <text x="85" y="93" textAnchor="middle" fontSize="10" fill="#f9e2af">Model Architecture</text>

        {/* Arrow down */}
        <line x1="85" y1="103" x2="85" y2="117" stroke="#fab387" strokeWidth="1.5" strokeDasharray="4 3" className="train-anim" markerEnd="url(#train-arr)"/>

        {/* Loss Function */}
        <rect x="20" y="118" width="130" height="28" rx="6" fill="#313244" stroke="#f38ba8" strokeWidth="1.5"/>
        <text x="85" y="136" textAnchor="middle" fontSize="10" fill="#f38ba8">Loss Function</text>

        {/* Arrow right to optimizer */}
        <line x1="150" y1="132" x2="164" y2="132" stroke="#fab387" strokeWidth="1.5" markerEnd="url(#train-arr)"/>

        {/* Optimizer */}
        <rect x="164" y="118" width="100" height="28" rx="6" fill="#313244" stroke="#fab387" strokeWidth="1.5"/>
        <text x="214" y="133" textAnchor="middle" fontSize="9" fill="#fab387">Optimizer (SGD/Adam)</text>
        <text x="214" y="143" textAnchor="middle" fontSize="8" fill="#6c7086">update weights</text>

        {/* Loopback arrow from optimizer up to model */}
        <path d="M214,118 L214,89 L150,89" stroke="#f9e2af" strokeWidth="1.5" fill="none" strokeDasharray="4 3" className="train-anim" markerEnd="url(#upd-arr)"/>

        {/* Label */}
        <text x="20" y="172" fontSize="9" fill="#bac2de">Happens once (hours to weeks).</text>
        <text x="20" y="184" fontSize="9" fill="#fab387" fontWeight="700">Weights are CHANGED.</text>

        {/* === INFERENCE SIDE === */}
        <text x="420" y="22" textAnchor="middle" fontSize="11" fill="#89b4fa" fontWeight="700">INFERENCE</text>

        {/* New input */}
        <rect x="295" y="32" width="115" height="28" rx="6" fill="#313244" stroke="#89b4fa" strokeWidth="1.5"/>
        <text x="352" y="50" textAnchor="middle" fontSize="10" fill="#89b4fa">New input query</text>

        {/* Arrow */}
        <line x1="352" y1="60" x2="352" y2="74" stroke="#89b4fa" strokeWidth="1.5" strokeDasharray="4 3" className="infer-anim" markerEnd="url(#infer-arr)"/>

        {/* Frozen model */}
        <rect x="295" y="75" width="115" height="36" rx="6" fill="#313244" stroke="#94e2d5" strokeWidth="1.5"/>
        <text x="352" y="91" textAnchor="middle" fontSize="10" fill="#94e2d5">Frozen model</text>
        <text x="352" y="104" textAnchor="middle" fontSize="9" fill="#6c7086">(weights locked 🔒)</text>

        {/* Arrow */}
        <line x1="352" y1="111" x2="352" y2="125" stroke="#89b4fa" strokeWidth="1.5" strokeDasharray="4 3" className="infer-anim" markerEnd="url(#infer-arr)"/>

        {/* Prediction */}
        <rect x="295" y="126" width="115" height="28" rx="6" fill="#313244" stroke="#a6e3a1" strokeWidth="1.5"/>
        <text x="352" y="144" textAnchor="middle" fontSize="10" fill="#a6e3a1">Prediction</text>

        {/* Label */}
        <text x="295" y="172" fontSize="9" fill="#bac2de">Happens millions of times/day.</text>
        <text x="295" y="184" fontSize="9" fill="#89b4fa" fontWeight="700">Weights are READ-ONLY.</text>
      </svg>
    </div>
  );
}

function PRViz() {
  const [threshold, setThreshold] = useState(0.5);

  // Simulate precision/recall as functions of threshold
  // precision increases, recall decreases as threshold rises
  const precision = Math.min(0.99, 0.55 + threshold * 0.44);
  const recall = Math.max(0.05, 0.98 - threshold * 0.55);
  const f1 = (2 * precision * recall) / (precision + recall);

  // Simulate a set of 40 predictions at the chosen threshold
  const totalPositives = 22;
  const tp = Math.round(totalPositives * recall);
  const fn = totalPositives - tp;
  const fp = Math.round(tp * (1 - precision) / precision);

  const items = [
    ...Array.from({length: tp}, (_, i) => ({ id: i, type: 'tp' })),
    ...Array.from({length: fp}, (_, i) => ({ id: tp + i, type: 'fp' })),
    ...Array.from({length: fn}, (_, i) => ({ id: tp + fp + i, type: 'fn' })),
  ];

  const colorMap: Record<string, string> = { tp: '#89b4fa', fp: '#f38ba8', fn: '#45475a' };
  const labelMap: Record<string, string> = { tp: 'True Positive', fp: 'False Positive', fn: 'False Negative' };

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>PRECISION-RECALL TRADEOFF — MOVING THE DECISION THRESHOLD</div>

      <div style={{marginBottom:'14px'}}>
        <label style={{fontSize:'0.82rem',color:'#bac2de',marginRight:'12px'}}>
          Decision threshold: <span style={{color:'#f9e2af',fontWeight:700}}>{threshold.toFixed(2)}</span>
        </label>
        <input
          type="range" min="0" max="1" step="0.01" value={threshold}
          onChange={e => setThreshold(Number(e.target.value))}
          style={{width:'200px',accentColor:'#89b4fa',verticalAlign:'middle'}}
        />
      </div>

      {/* Dot grid */}
      <div style={{display:'flex',flexWrap:'wrap',gap:'5px',marginBottom:'14px',background:'#1e1e2e',padding:'12px',borderRadius:'6px'}}>
        {items.map(item => (
          <div key={item.id} style={{width:'16px',height:'16px',borderRadius:'3px',background:colorMap[item.type],opacity:0.85}} title={labelMap[item.type]}/>
        ))}
      </div>

      {/* Legend */}
      <div style={{display:'flex',gap:'16px',marginBottom:'14px',fontSize:'0.8rem'}}>
        {[['tp','#89b4fa','True Positive'],['fp','#f38ba8','False Positive'],['fn','#45475a','False Negative (missed)']].map(([k,c,l])=>(
          <span key={k} style={{display:'flex',alignItems:'center',gap:'5px',color:'#bac2de'}}>
            <span style={{display:'inline-block',width:'12px',height:'12px',borderRadius:'2px',background:c as string}}/>
            {l as string}
          </span>
        ))}
      </div>

      {/* Metric bars */}
      {[
        {label:'Precision', value: precision, color:'#89b4fa'},
        {label:'Recall',    value: recall,    color:'#a6e3a1'},
        {label:'F1 Score',  value: f1,        color:'#cba6f7'},
      ].map(({label, value, color}) => (
        <div key={label} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
          <div style={{width:'80px',textAlign:'right',fontFamily:'monospace',fontSize:'0.82rem',color:'#bac2de'}}>{label}</div>
          <div style={{flex:1,height:'14px',background:'#313244',borderRadius:'3px',overflow:'hidden'}}>
            <div style={{height:'100%',width:`${value*100}%`,background:color,borderRadius:'3px',transition:'width 0.3s'}}/>
          </div>
          <div style={{width:'42px',fontFamily:'monospace',fontSize:'0.82rem',color}}>{value.toFixed(2)}</div>
        </div>
      ))}

      <div style={{marginTop:'12px',fontSize:'0.8rem',color:'#6c7086',fontStyle:'italic'}}>
        Housing.com example — Threshold=0.50: precision≈0.78, recall≈0.82 | Threshold=0.80: precision≈0.91, recall≈0.54
      </div>
    </div>
  );
}

const codeA3 = `Training:  Show model examples. Adjust weights until predictions match ground truth.
           Runs OFFLINE. Expensive (hours/days on GPU). Produces a model file.

Inference: Load the model file. Pass new input. Get prediction in milliseconds.
           Runs ONLINE (real-time). Cheap ($0.0001/request for GBT).`;

const codeA4 = `# Weak features for ETA prediction:
{"raw_coords": "37.7749,-122.4194"}  # Too raw — model can't generalize

# Strong features:
{
    "distance_meters": 42000,
    "hour_of_day": 17,             # Rush hour matters more than exact timestamp
    "day_of_week": 4,              # Friday pm differs from Monday morning (same hour)
    "current_avg_speed_kmh": 45.5  # Real-time traffic — highest-value single feature
}`;

const codeA5 = `── 2×2 Confusion Matrix ─────────────────────────────────────────────────────
                    PREDICTED POSITIVE    PREDICTED NEGATIVE
ACTUAL POSITIVE  │  TP (True Positive)  │  FN (False Negative)  │
                 │  Hit — model correct │  Miss — dangerous!    │
─────────────────┼──────────────────────┼───────────────────────┤
ACTUAL NEGATIVE  │  FP (False Positive) │  TN (True Negative)   │
                 │  False alarm          │  Correct rejection     │

Precision = TP / (TP + FP)   "Of all flagged, how many were real?"
Recall    = TP / (TP + FN)   "Of all real positives, how many did we catch?"
F1        = 2 × (P × R) / (P + R)  harmonic mean

Housing.com intent classifier:
  High precision → fewer wrong tool calls → cheaper (no wasted API calls)
  High recall    → fewer missed intents → better UX (user gets right response)
  Fraud detection: optimise recall (FN = missed fraud = expensive)
  Spam filter:    optimise precision (FP = blocked real email = user complaint)

Threshold effect: lower threshold → more TP + more FP (↑recall, ↓precision)
                  higher threshold → fewer FP + more FN (↑precision, ↓recall)`;

export function Mod20() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this appendix you will be able to</div>
        <ol>
          <li>Explain what a machine learning model is using a function analogy</li>
          <li>Identify the correct ML problem type (classification, regression, recommendation, ranking) for any system design question</li>
          <li>Describe training vs inference and why the distinction drives architectural decisions</li>
          <li>Define precision, recall, RMSE, and MAE — and know when to optimize for each</li>
          <li>Explain batch vs online inference with concrete examples from this codebase</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~60 minutes</span>
          <span className="obj-diff">Difficulty: ★★☆☆☆</span>
          <span className="obj-diff">Prerequisites: None</span>
        </div>
      </div>

      <div className="callout callout-info">
        <strong>Who this is for</strong>
        Read this <em>before</em> Module 2 if you have never trained a machine learning model. Zero math. All explanations use JavaScript analogies.
      </div>

      <MLProblemTypesViz />

      <h2>A.1 What Is a Machine Learning Model?</h2>
      <p>A machine learning model is a function: <code>f(inputs) → prediction</code></p>
      <p>Unlike a function you write, its behavior is <em>learned</em> from examples, not programmed explicitly.</p>
      <div className="callout callout-tip">
        <strong>JavaScript analogy</strong>
        Imagine writing <code>estimateTripDuration(pickup, dropoff, time)</code>. You could try to hardcode every road speed and every time-of-day factor — it would take years and still be wrong. Instead, show the function 10 million examples of <code>(pickup, dropoff, time) → actual_duration</code> and let it find the patterns. That's machine learning.
        The "patterns" are encoded as numbers called <strong>weights</strong>. Training = finding the right weights. Inference = using those weights on new inputs.
      </div>
      <p><strong>Why this drives architecture:</strong> Training is slow and expensive (hours on GPU). Inference is fast and cheap ($0.0001/request for a GBT model). Every decision about where to run a model follows from this asymmetry — same as the reasoning behind the two-stage SLM in Module 4.</p>

      <h2>A.2 The Four ML Problem Types</h2>
      <table>
        <tbody>
          <tr><th>Type</th><th>Output</th><th>Examples</th></tr>
          <tr><td><strong>Classification</strong></td><td>A category from a fixed set</td><td>Spam/not spam. Which intent? Is this fraud?</td></tr>
          <tr><td><strong>Regression</strong></td><td>A continuous number</td><td>ETA in minutes. House price. Surge multiplier.</td></tr>
          <tr><td><strong>Recommendation</strong></td><td>Best K items from a catalog</td><td>Restaurants to show. Drivers to surface. Next song.</td></tr>
          <tr><td><strong>Ranking</strong></td><td>Re-ordered list of existing items</td><td>Re-rank search results. Rank feed posts by engagement.</td></tr>
        </tbody>
      </table>
      <div className="callout callout-tip"><strong>Recommendation vs Ranking — they almost always appear together</strong> Most production systems use a two-stage approach: (1) <strong>candidate generation</strong> (recommendation) narrows 1M items to ~200 candidates using a fast model; (2) <strong>ranking</strong> scores and orders those 200 candidates for this specific user/context. Uber Eats: the two-tower model is the recommendation stage (which 200 restaurants to consider?); the online re-ranker by ETA + availability is the ranking stage (in what order to show them?). In interviews, saying "two-stage: candidate generation → ranking" signals L5/L6 familiarity with how this deploys at scale.</div>
      <div className="callout callout-warn">
        <strong>Most common interview mistake</strong>
        Framing a regression problem as classification. ETA prediction — the output is a <em>number</em> (minutes), not a category. Say "regression" before you draw any diagram. Interviewers catch this in the first 30 seconds.
      </div>
      <div className="mini-check">
        <strong>Naive → Fail → Correct:</strong>
        Naive: "I'll classify trips into buckets: 0–10 min, 10–30 min, 30–60 min."
        Failure: A 28-min trip and an 11-min trip are in the same bucket. Users see "10–30 min" when the actual answer is "12 minutes" — and lose trust in the estimate.
        Correct: Regression. Output a continuous number. Precision makes estimates credible.
      </div>

      <TrainingInferenceViz />

      <h2>A.3 Training vs Inference</h2>
      <svg width="520" height="250" viewBox="0 0 520 250" style={{display: "block", margin: "12px auto", fontFamily: "'Courier New',monospace"}}>
        <rect width="520" height="250" rx="6" fill="#1e1e2e"/>
        <text x="260" y="20" textAnchor="middle" fill="#cdd6f4" fontSize="11" fontWeight="bold">Training vs Inference Infrastructure</text>
        <line x1="260" y1="30" x2="260" y2="245" stroke="#45475a" strokeWidth="1.5"/>
        <text x="130" y="40" textAnchor="middle" fill="#fab387" fontSize="10" fontWeight="bold">TRAINING  (offline)</text>
        <rect x="20" y="50" width="220" height="50" rx="4" fill="#313244" stroke="#fab387" strokeWidth="1.5"/>
        <text x="130" y="68" textAnchor="middle" fill="#fab387" fontSize="9" fontWeight="bold">GPU Cluster  (A100 / H100)</text>
        <text x="130" y="82" textAnchor="middle" fill="#a6adc8" fontSize="8">16–128 GPUs, NVLink, InfiniBand</text>
        <text x="130" y="93" textAnchor="middle" fill="#a6adc8" fontSize="8">$2–$40 / GPU-hour × weeks</text>
        <line x1="130" y1="100" x2="130" y2="118" stroke="#585b70" strokeWidth="1.5"/>
        <rect x="20" y="118" width="220" height="36" rx="4" fill="#313244" stroke="#f9e2af" strokeWidth="1"/>
        <text x="130" y="132" textAnchor="middle" fill="#f9e2af" fontSize="9">Training Data + Labels</text>
        <text x="130" y="145" textAnchor="middle" fill="#a6adc8" fontSize="8">petabytes, versioned, deduplicated</text>
        <line x1="130" y1="154" x2="130" y2="172" stroke="#585b70" strokeWidth="1.5"/>
        <rect x="50" y="172" width="160" height="36" rx="4" fill="#313244" stroke="#a6e3a1" strokeWidth="1.5"/>
        <text x="130" y="186" textAnchor="middle" fill="#a6e3a1" fontSize="9" fontWeight="bold">Model Weights File</text>
        <text x="130" y="199" textAnchor="middle" fill="#a6adc8" fontSize="8">7B model ≈ 14GB (FP16)</text>
        <text x="130" y="222" textAnchor="middle" fill="#a6adc8" fontSize="8">Runtime: hours → weeks</text>
        <text x="130" y="234" textAnchor="middle" fill="#6c7086" fontSize="8">npm run build analogy</text>
        <text x="390" y="40" textAnchor="middle" fill="#89b4fa" fontSize="10" fontWeight="bold">INFERENCE  (online)</text>
        <rect x="275" y="50" width="230" height="50" rx="4" fill="#313244" stroke="#89b4fa" strokeWidth="1.5"/>
        <text x="390" y="68" textAnchor="middle" fill="#89b4fa" fontSize="9" fontWeight="bold">Inference Server  (vLLM / TGI)</text>
        <text x="390" y="82" textAnchor="middle" fill="#a6adc8" fontSize="8">1–8 GPUs, PagedAttention, batching</text>
        <text x="390" y="93" textAnchor="middle" fill="#a6adc8" fontSize="8">$0.0001–$0.01 / request</text>
        <line x1="390" y1="100" x2="390" y2="118" stroke="#585b70" strokeWidth="1.5"/>
        <rect x="275" y="118" width="230" height="36" rx="4" fill="#313244" stroke="#cba6f7" strokeWidth="1"/>
        <text x="390" y="132" textAnchor="middle" fill="#cba6f7" fontSize="9">User Request (context window)</text>
        <text x="390" y="145" textAnchor="middle" fill="#a6adc8" fontSize="8">8K–128K tokens, per-request</text>
        <line x1="390" y1="154" x2="390" y2="172" stroke="#585b70" strokeWidth="1.5"/>
        <rect x="305" y="172" width="170" height="36" rx="4" fill="#313244" stroke="#a6e3a1" strokeWidth="1.5"/>
        <text x="390" y="186" textAnchor="middle" fill="#a6e3a1" fontSize="9" fontWeight="bold">Generated Tokens</text>
        <text x="390" y="199" textAnchor="middle" fill="#a6adc8" fontSize="8">streamed to client, 20–80 tok/s</text>
        <text x="390" y="222" textAnchor="middle" fill="#a6adc8" fontSize="8">Runtime: 200ms – 10s</text>
        <text x="390" y="234" textAnchor="middle" fill="#6c7086" fontSize="8">CDN serve analogy</text>
      </svg>
      <CodeBlock title="Training vs Inference — Offline vs Online Distinction" language="text" keyLine={1} keyNote="Training is offline and expensive; inference is online and cheap">{codeA3}</CodeBlock>
      <div className="callout callout-tip">
        <strong>npm analogy</strong>
        Training is <code>npm run build</code>. Slow, runs once (or nightly), produces artifacts.
        Inference is serving those artifacts from a CDN — cheap, fast, stateless.
        The eval flywheel (Module 14.5) is the CI/CD pipeline that continuously improves the build.
      </div>

      <h2>A.4 Features — What Goes In</h2>
      <CodeBlock title="Feature Engineering — Weak vs Strong ETA Features" language="python" keyLine={8} keyNote="Real-time traffic speed is the highest-value single feature">{codeA4}</CodeBlock>
      <p>If you don't include <code>hour_of_day</code>, the model cannot learn that rush hour adds 15 minutes. Feature engineering is where most ML value comes from in structured data problems.</p>
      <div className="callout callout-info">
        <strong>What is a Feature Store and when do you need one?</strong>
        <code>current_avg_speed_kmh</code> comes from somewhere — it's pre-computed from GPS data, aggregated over a sliding 5-minute window, and stored so both the training pipeline and the real-time inference service can read it. That shared storage layer is called a <strong>Feature Store</strong>.
        <br /><br />
        Without it, you get <strong>training-serving skew</strong>: training computed "speed averaged over last 5 min" but at serving time someone accidentally computes "last 15 min" — the model behaves differently than trained.
        <br /><br />
        <strong>At what scale do you need one?</strong>
        <ul style={{margin: "4px 0"}}>
          <li><strong>Small scale / early stage:</strong> Redis with a naming convention. Pre-compute and write features to Redis with consistent key names.</li>
          <li><strong>Medium scale (Uber Eats-size):</strong> Feast (open-source, supports offline training store + online serving store).</li>
          <li><strong>Large scale (Uber, Meta):</strong> Proprietary — Uber built Michelangelo, Meta built FBLearner Feature Store.</li>
        </ul>
        For interviews: mention the training-serving skew problem as the motivation. That's the signal interviewers want to hear.
      </div>

      <PRViz />

      <h2>A.5 Evaluation Metrics</h2>
      <div className="callout callout-info" style={{fontFamily:'monospace',fontSize:'12px',lineHeight:1.8,whiteSpace:'pre'}}>
        {codeA5}
      </div>
      <svg width="500" height="260" viewBox="0 0 500 260" style={{display: "block", margin: "12px auto", fontFamily: "'Courier New',monospace"}}>
        <rect width="500" height="260" rx="6" fill="#1e1e2e"/>
        <text x="250" y="20" textAnchor="middle" fill="#cdd6f4" fontSize="11" fontWeight="bold">Confusion Matrix — Color-Coded with Metrics</text>
        <text x="245" y="42" textAnchor="middle" fill="#a6adc8" fontSize="9">PREDICTED</text>
        <text x="185" y="56" textAnchor="middle" fill="#a6e3a1" fontSize="9">POSITIVE</text>
        <text x="305" y="56" textAnchor="middle" fill="#f38ba8" fontSize="9">NEGATIVE</text>
        <text x="58" y="100" textAnchor="middle" fill="#a6adc8" fontSize="9" transform="rotate(-90,58,100)">ACTUAL</text>
        <text x="75" y="90" textAnchor="end" fill="#a6e3a1" fontSize="9">POSITIVE</text>
        <text x="75" y="155" textAnchor="end" fill="#f38ba8" fontSize="9">NEGATIVE</text>
        <rect x="100" y="62" width="160" height="70" rx="4" fill="#a6e3a1" fillOpacity="0.25" stroke="#a6e3a1" strokeWidth="2"/>
        <text x="180" y="90" textAnchor="middle" fill="#a6e3a1" fontSize="14" fontWeight="bold">TP</text>
        <text x="180" y="105" textAnchor="middle" fill="#cdd6f4" fontSize="9">True Positive</text>
        <text x="180" y="118" textAnchor="middle" fill="#a6adc8" fontSize="8">Hit — model correct</text>
        <text x="180" y="129" textAnchor="middle" fill="#a6adc8" fontSize="8">count: 85</text>
        <rect x="265" y="62" width="160" height="70" rx="4" fill="#fab387" fillOpacity="0.25" stroke="#fab387" strokeWidth="2"/>
        <text x="345" y="90" textAnchor="middle" fill="#fab387" fontSize="14" fontWeight="bold">FN</text>
        <text x="345" y="105" textAnchor="middle" fill="#cdd6f4" fontSize="9">False Negative</text>
        <text x="345" y="118" textAnchor="middle" fill="#a6adc8" fontSize="8">Miss — dangerous!</text>
        <text x="345" y="129" textAnchor="middle" fill="#a6adc8" fontSize="8">count: 15</text>
        <rect x="100" y="137" width="160" height="70" rx="4" fill="#fab387" fillOpacity="0.25" stroke="#fab387" strokeWidth="2"/>
        <text x="180" y="165" textAnchor="middle" fill="#fab387" fontSize="14" fontWeight="bold">FP</text>
        <text x="180" y="180" textAnchor="middle" fill="#cdd6f4" fontSize="9">False Positive</text>
        <text x="180" y="193" textAnchor="middle" fill="#a6adc8" fontSize="8">False alarm</text>
        <text x="180" y="204" textAnchor="middle" fill="#a6adc8" fontSize="8">count: 10</text>
        <rect x="265" y="137" width="160" height="70" rx="4" fill="#a6e3a1" fillOpacity="0.25" stroke="#a6e3a1" strokeWidth="2"/>
        <text x="345" y="165" textAnchor="middle" fill="#a6e3a1" fontSize="14" fontWeight="bold">TN</text>
        <text x="345" y="180" textAnchor="middle" fill="#cdd6f4" fontSize="9">True Negative</text>
        <text x="345" y="193" textAnchor="middle" fill="#a6adc8" fontSize="8">Correct rejection</text>
        <text x="345" y="204" textAnchor="middle" fill="#a6adc8" fontSize="8">count: 90</text>
        <text x="100" y="232" fill="#89b4fa" fontSize="9" fontWeight="bold">Precision = TP/(TP+FP) = 85/95 = 0.895</text>
        <text x="100" y="245" fill="#cba6f7" fontSize="9" fontWeight="bold">Recall    = TP/(TP+FN) = 85/100 = 0.850</text>
        <text x="340" y="232" fill="#f9e2af" fontSize="9" fontWeight="bold">F1 = 0.872</text>
        <text x="340" y="245" fill="#a6adc8" fontSize="8">harm. mean P &amp; R</text>
      </svg>
      <table>
        <tbody>
          <tr><th>Metric</th><th>Use For</th><th>Optimize When</th></tr>
          <tr><td><strong>Precision</strong></td><td>Classification</td><td>False positives are expensive (spam filter blocking real email)</td></tr>
          <tr><td><strong>Recall</strong></td><td>Classification</td><td>False negatives are expensive (missing fraud, missing safety violation)</td></tr>
          <tr><td><strong>F1</strong></td><td>Classification</td><td>Both false alarms AND misses are costly (intent classification)</td></tr>
          <tr><td><strong>RMSE</strong></td><td>Regression</td><td>Large errors are disproportionately bad. Arithmetic: errors [10, 10] → MAE=10, RMSE=10. Errors [20, 0] → MAE=10, RMSE=14.1. Same average error but RMSE is 41% higher for the single large error — because it squares before averaging. Use when one catastrophically wrong prediction is worse than several acceptably wrong ones.</td></tr>
          <tr><td><strong>MAE</strong></td><td>Regression</td><td>Average accuracy matters more than worst-case. Treats all errors equally regardless of magnitude.</td></tr>
          <tr><td><strong>NDCG@K / P@K</strong></td><td>Ranking</td><td>Top items shown must be most relevant (search, recommendations)</td></tr>
        </tbody>
      </table>
      <div className="callout callout-tip">
        <strong>The interview move</strong>
        State primary metric AND secondary constraint. "Primary: RMSE. Secondary: % of trips within ±2 min must stay above 80%. RMSE alone can be gamed by averaging small errors while individual large ones destroy user trust."
      </div>

      <h2>A.6 Batch vs Online Inference</h2>
      <p><strong>Batch:</strong> Run model on many inputs offline, store results. Pre-compute "top 20 restaurants per user" nightly. Cheap and cacheable but stale.</p>
      <p><strong>Online:</strong> Run per request in real-time. Required when input depends on current state. Must be fast enough to not block the UI.</p>
      <table>
        <tbody>
          <tr><th>System</th><th>Pattern</th><th>Why</th></tr>
          <tr><td>Housing.com SLM</td><td>Online only</td><td>Must respond to the actual message just sent</td></tr>
          <tr><td>Uber ETA</td><td>Hybrid — batch pre-compute 65%, online 35%</td><td>What's batch: <strong>route geometry</strong> (distance, road graph, turn-by-turn) between common zone pairs. This doesn't change with traffic. What's online: ML model takes pre-computed route + real-time traffic features (from Feature Store, refreshed every 5 min) → final ETA. The 65% cache hit is for route geometry, not for the final prediction — that's always fresh.</td></tr>
          <tr><td>Uber Eats recommendations</td><td>Hybrid — batch pre-rank top 200, online re-rank by ETA</td><td>Restaurant ranking is slow; availability check is fast and must be live</td></tr>
        </tbody>
      </table>

      <h2>A.7 Cold Start</h2>
      <table>
        <tbody>
          <tr><th>Strategy</th><th>When to Use</th><th>Example</th></tr>
          <tr><td>Rule-based fallback</td><td>Any domain, day 1</td><td>ETA new city: <code>google_maps_eta × 1.1</code>. Chat: Tier 0/1/2 templates before LLM training.</td></tr>
          <tr><td>Proxy model</td><td>Related domain has data</td><td>New city calibrated on city-size features from existing cities.</td></tr>
          <tr><td>Popularity-based</td><td>Recommendation cold start</td><td>New user: area top-10. New restaurant: placement boost for 50 orders.</td></tr>
          <tr><td>Collect first</td><td>High stakes, low volume</td><td>Soft launch to 1% traffic. Accept lower quality. Improve before scaling.</td></tr>
        </tbody>
      </table>

      <div className="callout callout-info">
        <strong>A.8–A.14: Algorithm Deep-Dives &amp; Learning Resources</strong><br/>
        The second half of the ML Primer — classical algorithm deep-dives (Linear Regression, KNN, Decision Tree/XGBoost, Naive Bayes, K-Means), backpropagation, CNNs, Transformers, LoRA, QLoRA, and curated learning resources — has moved to the <a href="/module/50"><strong>Algorithm &amp; Resource Reference</strong></a> module. Navigate there from the sidebar (Act 0, badge REF) or go directly to <code>/module/50</code>.
      </div>

      <QuizSection moduleId={1} title="Appendix A: ML Foundations Primer" contentHint="Classification vs regression vs recommendation vs ranking, training vs inference distinction, features and feature engineering, training-serving skew and feature stores, precision vs recall tradeoffs, RMSE vs MAE, batch vs online inference, cold start strategies" />
    </>
  );
}
