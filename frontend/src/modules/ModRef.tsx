import { useState } from "react";
import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from "../components/CodeBlock";

// ── Interactive: Algorithm Picker ─────────────────────────────────────────────
const ALGO_QUESTIONS = [
  { q: 'What is your target variable?', opts: ['Continuous number (price, ETA)', 'Category / class', 'No label (grouping)', 'Sequence / text'] },
  { q: 'How many training examples do you have?', opts: ['< 1K', '1K – 100K', '> 100K', 'Streaming / real-time'] },
  { q: 'Do you need to explain predictions?', opts: ['Yes — must be explainable', 'No — accuracy matters most'] },
];
const ALGO_RECS: Record<string, string> = {
  '0-0-0': '✓ Linear Regression (Ridge/Lasso) — interpretable, handles any size, fast baseline.',
  '0-0-1': '✓ Linear Regression or XGBoost — try both; XGBoost usually wins above 1K rows.',
  '0-1-0': '✓ Linear Regression → XGBoost with feature importance as explanation.',
  '0-1-1': '✓ XGBoost or LightGBM — best accuracy on tabular continuous targets.',
  '0-2-0': '✓ LightGBM (MiniBatch mode) or Neural Net — scale wins over XGBoost here.',
  '0-2-1': '✓ LightGBM / CatBoost — fast on large tabular, beats neural nets on structured data.',
  '1-0-0': '✓ Naive Bayes or Decision Tree (depth≤4) — small + explainable.',
  '1-0-1': '✓ Naive Bayes (text) or small Decision Tree — fastest to train and inspect.',
  '1-1-0': '✓ Random Forest with SHAP values — balanced accuracy + explanation.',
  '1-1-1': '✓ XGBoost — gold standard for tabular classification.',
  '1-2-0': '✓ XGBoost + SHAP — scale + post-hoc explanation.',
  '1-2-1': '✓ LightGBM or neural net — pick LightGBM for tabular, neural net for images/text.',
  '2-0-0': '✓ K-Means (K≤5 for visualisability) — quick customer segment discovery.',
  '2-0-1': '✓ K-Means or DBSCAN — no labels, no problem.',
  '2-1-0': '✓ K-Means with elbow/silhouette; 1K–100K is K-Means sweet spot.',
  '2-1-1': '✓ K-Means (MiniBatch) — fast and cheap.',
  '2-2-0': '✓ MiniBatchKMeans or HDBSCAN — handles millions of points.',
  '2-2-1': '✓ HDBSCAN or online K-Means — scales to streaming.',
  '3-0-0': '✓ Fine-tune a small LLM (DistilBERT) with SFT — text needs transformers.',
  '3-0-1': '✓ Naive Bayes or fastText — fast text classifier, no GPU needed.',
  '3-1-0': '✓ SFT on a 1B–7B LLM (LoRA) — 1K–100K pairs is the sweet spot.',
  '3-1-1': '✓ Fine-tuned LLM or XGBoost on embeddings — both work; LLM for open-ended.',
  '3-2-0': '✓ Full fine-tune or RLHF — large dataset justifies alignment budget.',
  '3-2-1': '✓ LLM with RLHF/DPO — scale + alignment.',
  '3-3-0': '✓ Online learning with Naive Bayes or streaming-SFT — real-time text.',
  '3-3-1': '✓ Lightweight streaming classifier (Naive Bayes / river library).',
};

function AlgorithmPicker() {
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const setAns = (qi: number, ai: number) =>
    setAnswers(prev => { const n = [...prev]; n[qi] = ai; return n; });
  const key = answers.map(a => (a !== null ? String(Math.min(a, 3)) : '?')).join('-');
  const ready = answers.every(a => a !== null);
  const rec = ready ? (ALGO_RECS[key] ?? '✓ Use domain knowledge to pick — this combination is rare.') : null;
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>ALGORITHM PICKER — ANSWER 3 QUESTIONS</div>
      {ALGO_QUESTIONS.map((q, qi) => (
        <div key={qi} style={{marginBottom:'14px'}}>
          <div style={{fontSize:'0.82rem',color:'#cdd6f4',marginBottom:'6px'}}>{q.q}</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
            {q.opts.map((opt, ai) => (
              <button key={ai}
                className={`viz-btn${answers[qi] === ai ? ' viz-btn-active' : ''}`}
                onClick={() => setAns(qi, ai)}
              >{opt}</button>
            ))}
          </div>
        </div>
      ))}
      {rec && (
        <div style={{marginTop:'12px',padding:'10px 14px',background:'#a6e3a115',border:'1px solid #a6e3a1',borderRadius:'6px',fontSize:'0.84rem',color:'#a6e3a1'}}>
          {rec}
        </div>
      )}
    </div>
  );
}

// ── Interactive: Backprop Visualiser ──────────────────────────────────────────
function BackpropViz() {
  const [step, setStep] = useState(0);
  const steps = [
    { label: 'Forward pass', desc: 'Input flows left → right. Each neuron computes weighted sum + activation. Loss is computed at the output.' },
    { label: 'Compute loss', desc: 'Loss = MSE or CrossEntropy. A single scalar measuring prediction error.' },
    { label: 'Backward pass starts', desc: '∂Loss/∂output = 2(pred - target)/n. The gradient of the loss w.r.t. the final layer output.' },
    { label: 'Chain rule through layers', desc: '∂Loss/∂w₂ = ∂Loss/∂output × ∂output/∂w₂. Each layer multiplies its local gradient into the chain.' },
    { label: 'Gradient reaches input layer', desc: '∂Loss/∂w₁ = ∂Loss/∂h × ∂h/∂w₁. Every parameter now has its exact gradient.' },
    { label: 'Optimizer updates weights', desc: 'w ← w - lr × ∂Loss/∂w. Adam maintains per-parameter momentum + variance estimates for adaptive steps.' },
  ];
  const active = steps[step];
  const nodeColors = ['#89b4fa','#a6e3a1','#f9e2af'];
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'16px 0'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>BACKPROPAGATION — STEP THROUGH</div>
      <svg viewBox="0 0 500 120" width="100%" style={{display:'block'}} aria-label="Backpropagation diagram">
        <defs>
          <marker id="bp-arr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#6c7086"/></marker>
          <marker id="bp-red" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#f38ba8"/></marker>
        </defs>
        {/* Layer boxes */}
        {[{x:20,label:'Input\n(x)',c:nodeColors[0]},{x:145,label:'Hidden\n(h)',c:nodeColors[1]},{x:270,label:'Output\n(ŷ)',c:nodeColors[2]},{x:395,label:'Loss\n(L)',c:'#f38ba8'}].map((n,i)=>(
          <g key={i}>
            <rect x={n.x} y="30" width="80" height="50" rx="6"
              fill={step >= i ? n.c + '22' : '#1e1e2e'}
              stroke={step >= i ? n.c : '#313244'} strokeWidth="1.5"/>
            {n.label.split('\n').map((t,j)=>(
              <text key={j} x={n.x+40} y={j===0?51:66} fontSize="11" fill={step>=i?n.c:'#6c7086'} textAnchor="middle" fontWeight="700">{t}</text>
            ))}
          </g>
        ))}
        {/* Forward arrows */}
        {[[100,195],[225,320],[350,445]].map(([x1,x2],i)=>(
          <line key={i} x1={x1} y1="55" x2={x2} y2="55" stroke={step<=2?'#6c7086':'#45475a'} strokeWidth="1.5" markerEnd="url(#bp-arr)"/>
        ))}
        {/* Backward arrows */}
        {step >= 3 && [[420,305],[295,180],[170,55]].slice(0, step-2).map(([x1,x2],i)=>(
          <line key={'b'+i} x1={x1} y1="75" x2={x2} y2="75" stroke="#f38ba8" strokeWidth="1.5" strokeDasharray="4,2" markerEnd="url(#bp-red)"/>
        ))}
        <text x="250" y="115" fontSize="9" fill="#6c7086" textAnchor="middle">
          {step < 3 ? '→ forward pass →' : '← backward pass (gradients) ←'}
        </text>
      </svg>
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',margin:'12px 0 8px'}}>
        {steps.map((s,i)=>(
          <button key={i} className={`viz-btn${step===i?' viz-btn-active':''}`} onClick={()=>setStep(i)}>
            {i+1}. {s.label}
          </button>
        ))}
      </div>
      <div style={{padding:'10px 14px',background:'#313244',borderRadius:'6px',fontSize:'0.82rem',color:'#cdd6f4'}}>
        <strong style={{color:'#89b4fa'}}>Step {step+1}: {active.label}</strong><br/>{active.desc}
      </div>
    </div>
  );
}

// ── Interactive: Algorithm Decision Tree ──────────────────────────────────────
const DT_NODES = [
  { id:'root', q:'What type of problem?', opts:['Predict a number','Classify into categories','Group without labels','Language / text task'], next:['num','cls','clust','txt'] },
  { id:'num', q:'Dataset size?', opts:['< 10K rows','≥ 10K rows'], next:['num-s','num-l'] },
  { id:'num-s', rec:'Linear Regression (Ridge/Lasso)\n→ scikit-learn, statsmodels', color:'#89b4fa' },
  { id:'num-l', rec:'XGBoost / LightGBM\n→ xgboost, lightgbm', color:'#a6e3a1' },
  { id:'cls', q:'Need to explain the model?', opts:['Yes','No — accuracy first'], next:['cls-e','cls-a'] },
  { id:'cls-e', rec:'Decision Tree (depth ≤ 4) + SHAP\n→ scikit-learn, shap', color:'#f9e2af' },
  { id:'cls-a', rec:'XGBoost or Fine-tuned LLM\n→ xgboost, trl', color:'#a6e3a1' },
  { id:'clust', q:'Do you know K (number of clusters)?', opts:['Yes','No'], next:['clust-k','clust-nk'] },
  { id:'clust-k', rec:'K-Means (MiniBatchKMeans at scale)\n→ scikit-learn, cuML', color:'#cba6f7' },
  { id:'clust-nk', rec:'HDBSCAN (auto-detects K)\n→ hdbscan library', color:'#cba6f7' },
  { id:'txt', q:'Data size for fine-tuning?', opts:['< 5K pairs (use API)','≥ 5K pairs (fine-tune)'], next:['txt-api','txt-ft'] },
  { id:'txt-api', rec:'Prompt engineering + RAG\n→ OpenAI / Anthropic API, LangChain', color:'#fab387' },
  { id:'txt-ft', q:'Need human preference alignment?', opts:['No — format/domain','Yes — behaviour'], next:['txt-sft','txt-rlhf'] },
  { id:'txt-sft', rec:'Supervised Fine-Tuning (SFT + LoRA)\n→ trl SFTTrainer, Unsloth', color:'#94e2d5' },
  { id:'txt-rlhf', rec:'SFT → DPO / RLHF\n→ trl DPOTrainer, OpenRLHF', color:'#f38ba8' },
];
const nodeMap = Object.fromEntries(DT_NODES.map(n => [n.id, n]));

function AlgorithmDecisionTree() {
  const [path, setPath] = useState<string[]>(['root']);
  const current = nodeMap[path[path.length - 1]];
  const choose = (nextId: string) => setPath(p => [...p, nextId]);
  const back = () => setPath(p => p.slice(0, -1));
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'16px 0'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>ALGORITHM DECISION TREE — CLICK TO NAVIGATE</div>
      {path.length > 1 && (
        <div style={{fontSize:'0.75rem',color:'#6c7086',marginBottom:'10px'}}>
          Path: {path.join(' → ')}
          <button className="viz-btn" style={{marginLeft:'10px'}} onClick={()=>setPath(['root'])}>↺ restart</button>
          <button className="viz-btn" style={{marginLeft:'6px'}} onClick={back}>← back</button>
        </div>
      )}
      {'rec' in current ? (
        <div style={{padding:'16px',background: current.color + '18',border:`1px solid ${current.color}`,borderRadius:'8px'}}>
          <div style={{fontSize:'1rem',fontWeight:700,color: current.color,marginBottom:'4px'}}>Recommendation</div>
          <pre style={{margin:0,fontSize:'0.85rem',color:'#cdd6f4',whiteSpace:'pre-wrap'}}>{current.rec}</pre>
          <button className="viz-btn" style={{marginTop:'12px'}} onClick={()=>setPath(['root'])}>↺ Start over</button>
        </div>
      ) : (
        <div>
          <div style={{fontSize:'0.95rem',color:'#cdd6f4',marginBottom:'14px',fontWeight:600}}>{current.q}</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'10px'}}>
            {current.opts!.map((opt, i) => (
              <button key={i} className="viz-btn"
                style={{padding:'8px 16px',fontSize:'0.82rem'}}
                onClick={() => choose(current.next![i])}>{opt}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Interactive: LoRA rank slider ─────────────────────────────────────────────
function LoRAViz() {
  const [rank, setRank] = useState(16);
  const d = 4096; const k = 4096;
  const full = d * k;
  const lora = rank * (d + k);
  const pct = ((lora / full) * 100).toFixed(2);
  const cols = 32; const rows = 16;
  const highlightCols = Math.max(1, Math.round((rank / 64) * cols));
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'16px 0'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>LoRA RANK — PARAMETER TRADE-OFF</div>
      <div style={{display:'flex',gap:'24px',flexWrap:'wrap',alignItems:'flex-start'}}>
        <div style={{flex:'1',minWidth:'220px'}}>
          <div style={{marginBottom:'10px',fontSize:'0.82rem',color:'#cdd6f4'}}>Rank r = <strong style={{color:'#cba6f7'}}>{rank}</strong></div>
          <input type="range" min={1} max={64} value={rank} onChange={e=>setRank(Number(e.target.value))}
            style={{width:'100%',accentColor:'#cba6f7'}}/>
          <div style={{marginTop:'12px',fontSize:'0.8rem',lineHeight:'1.8'}}>
            <div>Full W matrix: <strong style={{color:'#6c7086'}}>{(full/1e6).toFixed(1)}M params</strong></div>
            <div>LoRA (A+B): <strong style={{color:'#cba6f7'}}>{(lora/1e3).toFixed(0)}K params</strong></div>
            <div>Savings: <strong style={{color:'#a6e3a1'}}>{(100-parseFloat(pct)).toFixed(1)}% fewer trained params</strong></div>
            <div style={{marginTop:'6px',fontSize:'0.75rem',color:'#6c7086'}}>W′ = W + (α/r) × B×A</div>
          </div>
        </div>
        <div style={{flex:'2',minWidth:'260px'}}>
          <div style={{fontSize:'0.75rem',color:'#6c7086',marginBottom:'6px'}}>Weight matrix W (frozen) vs LoRA injection (trainable)</div>
          <svg viewBox={`0 0 ${cols*10+130} ${rows*8+20}`} width="100%" aria-label="LoRA matrix diagram">
            {Array.from({length:rows}).map((_,r)=>Array.from({length:cols}).map((_,c)=>(
              <rect key={`${r}-${c}`} x={c*10} y={r*8} width="9" height="7" rx="1"
                fill={c < highlightCols ? '#cba6f733' : '#1e1e2e'}
                stroke={c < highlightCols ? '#cba6f7' : '#313244'} strokeWidth="0.5"/>
            )))}
            <text x={cols*10+8} y="30" fontSize="9" fill="#6c7086">Frozen W</text>
            <text x={cols*10+8} y="44" fontSize="9" fill="#cba6f7">+ B×A</text>
            <text x={cols*10+8} y="58" fontSize="9" fill="#6c7086">(r={rank})</text>
            <text x={0} y={rows*8+16} fontSize="8" fill="#6c7086">← {cols} cols (k=4096) →</text>
          </svg>
          <div style={{fontSize:'0.73rem',color:'#6c7086',marginTop:'4px'}}>Shaded = columns covered by rank-{rank} LoRA. Lower rank = fewer shaded = fewer trainable params.</div>
        </div>
      </div>
    </div>
  );
}

export function ModRef() {
  return (
    <>
      <div className="callout callout-info">
        <strong>Algorithm &amp; Resource Reference</strong> — this module is a standalone reference companion to Module 1 (ML Foundations Primer). Come here for algorithm deep-dives, library code, and curated learning resources.
      </div>

      <h2>A.8 Classical ML Algorithms — Reference Guide</h2>
      <p>Five algorithms that solve the majority of real-world tabular and text ML problems. These are what you reach for before neural networks — they're faster to train, easier to interpret, and often match deep learning on structured data.</p>

      <AlgorithmPicker />

      {/* ── Linear Regression ── */}
      <div className="callout callout-info" style={{marginTop:'28px'}}>
        <strong>A.8.1 Linear Regression</strong>
        <span style={{marginLeft:'10px',fontSize:'0.75rem',color:'#6c7086'}}>Supervised · Regression · Parametric</span>
      </div>
      <p>Maps features to a continuous output via a weighted sum: <code>ŷ = w₁x₁ + w₂x₂ + … + b</code>. Weights are learned by minimising Mean Squared Error (MSE) — either with gradient descent or the closed-form OLS solution <code>w = (XᵀX)⁻¹Xᵀy</code>. Ridge adds an L2 penalty to shrink weights; Lasso (L1) forces sparse feature selection.</p>
      <p><strong>Housing.com example:</strong> Predicting property price from BHK count, locality tier, floor number, and square footage — a 4-feature linear model gives an interpretable baseline before trying XGBoost.</p>
      <table>
        <tbody>
          <tr><th>Pros</th><th>Cons</th></tr>
          <tr>
            <td>
              ✓ Fully interpretable — each weight = feature impact on price<br/>
              ✓ Fast training: O(nd²) for OLS<br/>
              ✓ Works well on small datasets (&lt;1K rows)<br/>
              ✓ Probabilistic confidence intervals via statsmodels<br/>
              ✓ No hyperparameter tuning required
            </td>
            <td>
              ✗ Assumes linear relationship — fails on curved patterns<br/>
              ✗ Sensitive to outliers (one ₹50Cr penthouse skews everything)<br/>
              ✗ Multicollinearity (correlated features) inflates variance<br/>
              ✗ Requires feature scaling for gradient descent<br/>
              ✗ Can't capture feature interactions (price × locality) without manual engineering
            </td>
          </tr>
        </tbody>
      </table>
      <div className="viz-2col" style={{margin:'12px 0'}}>
        <div className="viz-col"><div className="viz-col-title">✓ USE WHEN</div>
          Target is continuous · Relationship is roughly linear · You need to explain the model to stakeholders · Quick interpretable baseline · Small dataset (&lt;10K rows)
        </div>
        <div className="viz-col"><div className="viz-col-title" style={{color:'#f38ba8'}}>✗ AVOID WHEN</div>
          Target is categorical · Non-linear patterns (try polynomial or tree models) · Many categorical features · High-cardinality inputs (text, images)
        </div>
      </div>
      <CodeBlock title="Linear Regression — Ridge and statsmodels" language="python" keyLine={9} keyNote="statsmodels adds p-values and CIs that sklearn omits">{`from sklearn.linear_model import Ridge, Lasso, LinearRegression
import statsmodels.api as sm

# scikit-learn — fast, production-ready
model = Ridge(alpha=1.0)          # L2 regularisation
model.fit(X_train, y_train)
print(model.coef_)                # feature weights → interpretability

# statsmodels — adds p-values and confidence intervals
X_with_const = sm.add_constant(X_train)
ols = sm.OLS(y_train, X_with_const).fit()
print(ols.summary())              # R², p-values, 95% CI per feature`}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Community &amp; resources</strong><br/>
        scikit-learn docs → <code>sklearn.linear_model</code> · statsmodels docs · <em>Introduction to Statistical Learning</em> (ISL) — free PDF · Andrew Ng's ML Specialization (Coursera) · Kaggle "House Prices" competition — classic linear regression playground
      </div>

      {/* ── KNN ── */}
      <div className="callout callout-info" style={{marginTop:'28px'}}>
        <strong>A.8.2 K-Nearest Neighbors (KNN)</strong>
        <span style={{marginLeft:'10px',fontSize:'0.75rem',color:'#6c7086'}}>Supervised · Classification + Regression · Non-parametric · Lazy learner</span>
      </div>
      <p>Classifies a new point by looking at the K nearest training points in feature space (by Euclidean/cosine/Manhattan distance) and taking a majority vote (classification) or averaging their values (regression). There is <strong>no training phase</strong> — the entire training set is stored and queried at inference time.</p>
      <p><strong>Housing.com example:</strong> "Properties similar to this listing" — find the 10 nearest neighbours in embedding space of (locality, BHK, price_range, amenity_flags). For large catalogues, use approximate KNN (FAISS/HNSW) rather than exact KNN.</p>
      <table>
        <tbody>
          <tr><th>Pros</th><th>Cons</th></tr>
          <tr>
            <td>
              ✓ Zero training time (lazy learner)<br/>
              ✓ Naturally handles multi-class<br/>
              ✓ No assumption about data distribution<br/>
              ✓ Intuitive — literally "nearest neighbours"<br/>
              ✓ Adapts automatically as data grows
            </td>
            <td>
              ✗ Prediction is O(n × d) — catastrophically slow on large datasets<br/>
              ✗ Curse of dimensionality — distance loses meaning in high-d<br/>
              ✗ All training data must live in memory<br/>
              ✗ Sensitive to irrelevant/unscaled features<br/>
              ✗ Choosing K is non-trivial
            </td>
          </tr>
        </tbody>
      </table>
      <div className="viz-2col" style={{margin:'12px 0'}}>
        <div className="viz-col"><div className="viz-col-title">✓ USE WHEN</div>
          Small-to-medium dataset · Similarity search · Recommendation systems (with ANN) · Anomaly detection · No training budget constraints
        </div>
        <div className="viz-col"><div className="viz-col-title" style={{color:'#f38ba8'}}>✗ AVOID WHEN</div>
          Large datasets (use ANN: FAISS/HNSW) · Real-time inference with &gt;100K examples · High-dimensional raw features (reduce dimensions first with PCA/UMAP)
        </div>
      </div>
      <CodeBlock title="KNN — Exact (sklearn) and Approximate (FAISS)" language="python" keyLine={10} keyNote="IndexFlatL2 → GPU switches exact to ANN for million-scale catalogs">{`from sklearn.neighbors import KNeighborsClassifier
import faiss, numpy as np

# scikit-learn — exact KNN for small datasets
knn = KNeighborsClassifier(n_neighbors=5, metric='cosine')
knn.fit(X_train, y_train)
preds = knn.predict(X_test)

# FAISS — approximate KNN for 1M+ vectors (Housing.com scale)
index = faiss.IndexFlatL2(embedding_dim)        # L2 distance
index = faiss.index_cpu_to_gpu(faiss.StandardGpuResources(), 0, index)
index.add(property_embeddings.astype(np.float32))
distances, indices = index.search(query_embedding, k=10)  # top-10 similar properties`}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Community &amp; resources</strong><br/>
        scikit-learn KNeighbors · FAISS (Meta AI) — GitHub + wiki · hnswlib — pure C++ HNSW · Annoy (Spotify) · Weaviate, Qdrant, Pinecone build ANN on top of HNSW · Practical tutorial: <em>Approximate Nearest Neighbors in Production</em> (Jay Alammar blog)
      </div>

      {/* ── Decision Tree ── */}
      <div className="callout callout-info" style={{marginTop:'28px'}}>
        <strong>A.8.3 Decision Tree</strong>
        <span style={{marginLeft:'10px',fontSize:'0.75rem',color:'#6c7086'}}>Supervised · Classification + Regression · Non-parametric · White-box</span>
      </div>
      <p>Learns a binary tree of if-then rules. At each node, the algorithm finds the feature and split threshold that maximally reduces impurity (Gini or Information Gain for classification; MSE for regression). Splits recurse until a stopping criterion (max_depth, min_samples_leaf, or pure nodes). A single decision tree is the building block for <strong>Random Forest</strong> (bagging of trees) and <strong>XGBoost/LightGBM</strong> (boosted trees) — the two dominant algorithms on tabular data competitions.</p>
      <p><strong>Housing.com example:</strong> "Should we show the 'Contact seller' button?" — a shallow decision tree (depth=4) on intent confidence, user auth status, and session history is fast, auditable, and requires no GPU.</p>
      <table>
        <tbody>
          <tr><th>Pros</th><th>Cons (single tree)</th></tr>
          <tr>
            <td>
              ✓ Fully interpretable — export as if-else rules<br/>
              ✓ No feature scaling required<br/>
              ✓ Handles mixed types (numeric + categorical)<br/>
              ✓ Captures non-linear and interaction patterns<br/>
              ✓ Built-in feature importance scores
            </td>
            <td>
              ✗ High variance — prone to overfitting without pruning<br/>
              ✗ Unstable — tiny data change → completely different tree<br/>
              ✗ Biased toward high-cardinality features<br/>
              ✗ Weak individual learner — use ensembles in production
            </td>
          </tr>
        </tbody>
      </table>
      <div className="callout callout-tip" style={{marginTop:'12px'}}>
        <strong>Ensemble upgrades:</strong>
        <table style={{marginTop:'8px',fontSize:'0.82rem'}}>
          <tbody>
            <tr><th>Algorithm</th><th>Method</th><th>When to prefer</th></tr>
            <tr><td><strong>Random Forest</strong></td><td>Bagging (avg of N independent trees)</td><td>Need variance reduction, robust baseline, less tuning</td></tr>
            <tr><td><strong>XGBoost</strong></td><td>Gradient boosting (sequential trees fix residuals)</td><td>Tabular data competitions, highest accuracy</td></tr>
            <tr><td><strong>LightGBM</strong></td><td>Histogram-based gradient boosting</td><td>Very large datasets (&gt;1M rows), faster than XGBoost</td></tr>
            <tr><td><strong>CatBoost</strong></td><td>Ordered boosting, native categorical handling</td><td>Many high-cardinality categoricals, minimal preprocessing</td></tr>
          </tbody>
        </table>
      </div>
      <CodeBlock title="Decision Tree — Single Tree, XGBoost, LightGBM" language="python" keyLine={8} keyNote="export_text gives human-auditable if-else rules from a depth-4 tree">{`from sklearn.tree import DecisionTreeClassifier, export_text
import xgboost as xgb
import lightgbm as lgb

# Interpretable single tree (depth-limited for production rules)
dt = DecisionTreeClassifier(max_depth=4, min_samples_leaf=50)
dt.fit(X_train, y_train)
print(export_text(dt, feature_names=feature_cols))  # human-readable if-else rules

# XGBoost — best accuracy on tabular data
xgb_model = xgb.XGBClassifier(n_estimators=300, learning_rate=0.05, max_depth=6,
                                subsample=0.8, colsample_bytree=0.8, use_label_encoder=False)
xgb_model.fit(X_train, y_train, eval_set=[(X_val, y_val)], early_stopping_rounds=20)

# LightGBM — faster on large datasets
lgb_model = lgb.LGBMClassifier(n_estimators=500, num_leaves=63, learning_rate=0.05)
lgb_model.fit(X_train, y_train, eval_set=[(X_val, y_val)], callbacks=[lgb.early_stopping(20)])`}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Community &amp; resources</strong><br/>
        XGBoost docs + paper (Chen &amp; Guestrin 2016) · LightGBM docs (Microsoft) · CatBoost docs (Yandex) · Kaggle tabular competitions — 90% of winners use gradient boosting · Optuna for hyperparameter tuning · SHAP for tree model interpretability
      </div>

      {/* ── Naive Bayes ── */}
      <div className="callout callout-info" style={{marginTop:'28px'}}>
        <strong>A.8.4 Naive Bayes Classifier</strong>
        <span style={{marginLeft:'10px',fontSize:'0.75rem',color:'#6c7086'}}>Supervised · Classification · Probabilistic · Parametric</span>
      </div>
      <p>Applies Bayes' theorem assuming features are <em>conditionally independent</em> given the class: <code>P(class | features) ∝ P(class) × ∏ P(feature_i | class)</code>. The "naive" independence assumption is almost always violated in practice — yet the classifier still works remarkably well for text. Three main variants: <strong>GaussianNB</strong> (continuous features, assumes normal distribution), <strong>MultinomialNB</strong> (word counts / term frequencies), <strong>BernoulliNB</strong> (binary feature presence).</p>
      <p><strong>Housing.com example:</strong> Classifying a user query as spam/bot (fast, cheap, runs in &lt;1ms) before any LLM call. Also useful for intent pre-classification on extremely latency-sensitive paths.</p>
      <table>
        <tbody>
          <tr><th>Pros</th><th>Cons</th></tr>
          <tr>
            <td>
              ✓ Fastest possible training — one pass through data<br/>
              ✓ Inference &lt;1ms — suitable for edge/mobile<br/>
              ✓ Excellent on text (high-dimensional sparse features)<br/>
              ✓ Works with very small datasets (few hundred examples)<br/>
              ✓ Naturally probabilistic output
            </td>
            <td>
              ✗ Independence assumption usually wrong<br/>
              ✗ Cannot capture feature interactions<br/>
              ✗ Poor probability calibration (use Platt scaling to fix)<br/>
              ✗ Zero-frequency problem for unseen feature values (Laplace smoothing fixes)<br/>
              ✗ Loses to XGBoost/neural nets given enough data
            </td>
          </tr>
        </tbody>
      </table>
      <div className="viz-2col" style={{margin:'12px 0'}}>
        <div className="viz-col"><div className="viz-col-title">✓ USE WHEN</div>
          Text classification (spam, sentiment, intent) · Real-time / edge inference · Small training set (&lt;1K examples) · Streaming classification · Quick probabilistic baseline
        </div>
        <div className="viz-col"><div className="viz-col-title" style={{color:'#f38ba8'}}>✗ AVOID WHEN</div>
          Features are correlated (violates assumption badly) · Precise probabilities matter (use calibrated model) · Structured/tabular data with numeric features (use XGBoost instead)
        </div>
      </div>
      <CodeBlock title="Naive Bayes — Text Pipeline and Probability Calibration" language="python" keyLine={14} keyNote="CalibratedClassifierCV converts raw NB scores to reliable probabilities">{`from sklearn.naive_bayes import MultinomialNB, GaussianNB, ComplementNB
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.calibration import CalibratedClassifierCV

# Text classification pipeline (spam / intent detection)
pipe = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=50_000)),
    ('nb', ComplementNB(alpha=0.5)),        # ComplementNB beats MultinomialNB for imbalanced text
])
pipe.fit(X_train_text, y_train)

# Calibrate probabilities for better confidence scores
calibrated = CalibratedClassifierCV(MultinomialNB(), method='isotonic', cv=5)
calibrated.fit(X_tfidf, y_train)
proba = calibrated.predict_proba(X_new)    # now actually reliable probabilities`}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Community &amp; resources</strong><br/>
        scikit-learn NB docs · NLTK (text preprocessing) · fastText (Facebook) — ultra-fast text classifier, NB-like speed with better accuracy · spaCy text classification · Kaggle NLP Getting Started competition
      </div>

      {/* ── K-Means ── */}
      <div className="callout callout-info" style={{marginTop:'28px'}}>
        <strong>A.8.5 K-Means Clustering</strong>
        <span style={{marginLeft:'10px',fontSize:'0.75rem',color:'#6c7086'}}>Unsupervised · Clustering · Iterative · Centroid-based</span>
      </div>
      <p>Partitions N data points into K clusters by minimising the sum of squared distances to cluster centroids. Algorithm: (1) Initialise K centroids (randomly or via K-means++ for better init), (2) Assign each point to its nearest centroid, (3) Recompute centroids as cluster means, repeat until convergence. Sensitive to scale — always normalise features first.</p>
      <p><strong>Housing.com example:</strong> Segmenting users into cohorts (first-time buyer / upgrader / investor / rental seeker) using session behaviour vectors, then personalising the homepage for each segment.</p>
      <table>
        <tbody>
          <tr><th>Pros</th><th>Cons</th></tr>
          <tr>
            <td>
              ✓ Simple to understand and implement<br/>
              ✓ Scales to millions of points (MiniBatchKMeans)<br/>
              ✓ O(nkd) per iteration — fast<br/>
              ✓ Results are interpretable cluster centroids<br/>
              ✓ Works for image compression, data summarisation
            </td>
            <td>
              ✗ Must specify K in advance (use elbow method / silhouette score)<br/>
              ✗ Assumes spherical, equal-size clusters — fails on non-convex shapes<br/>
              ✗ Sensitive to initialisation (K-means++ mitigates this)<br/>
              ✗ Affected by outliers (use K-medoids / trimmed K-means)<br/>
              ✗ Non-deterministic — run with multiple seeds
            </td>
          </tr>
        </tbody>
      </table>
      <div className="callout callout-tip" style={{marginTop:'12px'}}>
        <strong>When K-means fails — use these instead:</strong>
        <table style={{marginTop:'8px',fontSize:'0.82rem'}}>
          <tbody>
            <tr><th>Situation</th><th>Alternative</th></tr>
            <tr><td>Non-convex clusters (moons, rings)</td><td>DBSCAN or HDBSCAN (density-based, no K needed)</td></tr>
            <tr><td>Unknown number of clusters</td><td>HDBSCAN, Gaussian Mixture Models + BIC</td></tr>
            <tr><td>Clusters of very different sizes</td><td>Gaussian Mixture Models (GMM)</td></tr>
            <tr><td>High-dimensional embeddings</td><td>UMAP → reduce dims → then K-means</td></tr>
          </tbody>
        </table>
      </div>
      <CodeBlock title="K-Means — Optimal K Selection and MiniBatch Production" language="python" keyLine={12} keyNote="MiniBatchKMeans handles 1M+ rows; exact KMeans stalls above 100K">{`from sklearn.cluster import KMeans, MiniBatchKMeans
from sklearn.metrics import silhouette_score
import numpy as np

# Find optimal K with silhouette score
scores = []
for k in range(2, 11):
    km = KMeans(n_clusters=k, init='k-means++', n_init=10, random_state=42)
    labels = km.fit_predict(X_scaled)
    scores.append(silhouette_score(X_scaled, labels))
best_k = np.argmax(scores) + 2   # offset because range starts at 2

# Production: MiniBatchKMeans for 1M+ rows
mbkm = MiniBatchKMeans(n_clusters=best_k, batch_size=10_000, n_init=10)
mbkm.fit(X_scaled)
user_segments = mbkm.labels_`}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Community &amp; resources</strong><br/>
        scikit-learn clustering guide (includes comparison charts) · HDBSCAN library (McInnes) · UMAP library (dimensional reduction before clustering) · cuML (RAPIDS) — GPU K-means 100× faster · Kaggle customer segmentation datasets
      </div>

      <h2>A.9 Deep Learning Foundations</h2>
      <p>The two mechanisms that make modern neural networks work: <strong>Backpropagation</strong> (how they learn) and <strong>Convolutional Neural Networks</strong> (the dominant architecture for spatial data).</p>

      {/* ── Backpropagation ── */}
      <div className="callout callout-info" style={{marginTop:'16px'}}>
        <strong>A.9.1 Backpropagation</strong>
        <span style={{marginLeft:'10px',fontSize:'0.75rem',color:'#6c7086'}}>Training algorithm · Chain rule · Gradient-based optimisation</span>
      </div>
      <p>The algorithm for computing <code>∂Loss/∂w</code> for every parameter w in a neural network using the chain rule. Forward pass: compute activations and loss. Backward pass: starting from the loss, propagate gradients backward through each layer. The optimizer (SGD, Adam, AdamW) then steps each weight opposite the gradient direction.</p>
      <p>Backprop is not optional — it <em>is</em> the training algorithm for all neural networks. What varies is the optimizer, learning rate schedule, and regularisation.</p>
      <BackpropViz />
      <table>
        <tbody>
          <tr><th>Pros</th><th>Common failure modes</th></tr>
          <tr>
            <td>
              ✓ Efficiently computes all gradients in one backward pass (O(params) cost, not O(params²))<br/>
              ✓ Works for any differentiable architecture<br/>
              ✓ Framework autograd makes it automatic (PyTorch, JAX)<br/>
              ✓ Scales to billions of parameters with mixed precision
            </td>
            <td>
              ✗ Vanishing gradients — deep networks: gradients → 0 (fix: ReLU, residual connections, BatchNorm)<br/>
              ✗ Exploding gradients — fix: gradient clipping (<code>clip_grad_norm_</code>)<br/>
              ✗ Memory intensive — stores all activations for backward pass (fix: gradient checkpointing)<br/>
              ✗ Requires differentiable ops — no discrete/stochastic operations without tricks (REINFORCE, ST estimator)
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock title="Backpropagation — PyTorch Training Loop" language="python" keyLine={13} keyNote="clip_grad_norm_ prevents exploding gradients before the optimizer step">{`import torch
import torch.nn as nn

# PyTorch autograd — backprop is automatic
model = nn.Sequential(nn.Linear(128, 256), nn.ReLU(), nn.Linear(256, 10))
optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=0.01)
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=100)

for X_batch, y_batch in dataloader:
    optimizer.zero_grad()
    logits = model(X_batch)                        # forward pass
    loss = nn.CrossEntropyLoss()(logits, y_batch)
    loss.backward()                                # backward pass — compute ∂loss/∂w for all w
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)  # exploding gradient guard
    optimizer.step()                               # w ← w - lr × ∂loss/∂w
    scheduler.step()

# JAX — functional, JIT-compiled, excellent for research
import jax, jax.numpy as jnp
grad_fn = jax.grad(loss_fn)   # returns gradient function
grads = grad_fn(params, X, y)   # exact same chain-rule math, functionally pure`}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Community &amp; resources</strong><br/>
        3Blue1Brown "Neural Networks" series — best visual intuition for backprop · Andrej Karpathy "micrograd" — build backprop from scratch in 150 lines · fast.ai Practical DL course · PyTorch autograd docs · CS231n Stanford lecture on backprop (notes + video) · Yannic Kilcher YouTube
      </div>

      {/* ── CNN ── */}
      <div className="callout callout-info" style={{marginTop:'28px'}}>
        <strong>A.9.2 Convolutional Neural Network (CNN)</strong>
        <span style={{marginLeft:'10px',fontSize:'0.75rem',color:'#6c7086'}}>Supervised · Vision/Audio · Weight-sharing · Spatial hierarchy</span>
      </div>
      <p>CNNs apply small learnable filters (kernels) across input data, sharing weights spatially. This makes them <strong>equivariant to translation</strong> — a cat detector works whether the cat is top-left or bottom-right. Layers learn a hierarchy: early layers detect edges → mid layers detect shapes → deep layers detect objects. Pooling layers (MaxPool, AvgPool) downsample spatial dimensions. Architecture milestones: LeNet (1998) → AlexNet (2012, ImageNet breakthrough) → ResNet (2015, residual connections solved depth) → EfficientNet (2019, neural architecture search) → ViT (2020, transformers beat CNNs on vision).</p>
      <p><strong>Housing.com example:</strong> Property photo quality scoring (blur detection, indoor/outdoor classification, room type recognition) — all CNN tasks. A ResNet-50 pretrained on ImageNet, fine-tuned on 10K labelled property photos, runs in &lt;10ms per image.</p>
      <table>
        <tbody>
          <tr><th>Pros</th><th>Cons</th></tr>
          <tr>
            <td>
              ✓ Weight sharing → far fewer parameters than a fully connected net on images<br/>
              ✓ Translation equivariance built in<br/>
              ✓ Excellent pretrained backbones (ImageNet, LAION) via torchvision/timm<br/>
              ✓ State-of-the-art on images, audio spectrograms, medical scans<br/>
              ✓ Interpretable via Grad-CAM / activation maps
            </td>
            <td>
              ✗ Needs large labelled datasets (or pretrained transfer learning)<br/>
              ✗ Computationally expensive without GPU<br/>
              ✗ Limited long-range spatial reasoning (Vision Transformers surpass CNNs here)<br/>
              ✗ Not suitable for variable-length sequences<br/>
              ✗ Poor at relational reasoning (use graph networks instead)
            </td>
          </tr>
        </tbody>
      </table>
      <div className="callout callout-tip" style={{marginTop:'12px'}}>
        <strong>Transfer learning is the default:</strong> don't train CNNs from scratch. Use a pretrained backbone and fine-tune only the last layer(s).
        <table style={{marginTop:'8px',fontSize:'0.82rem'}}>
          <tbody>
            <tr><th>Dataset size</th><th>Strategy</th></tr>
            <tr><td>&lt; 1K labelled</td><td>Freeze entire backbone. Train only classification head.</td></tr>
            <tr><td>1K – 10K</td><td>Freeze early layers. Fine-tune last 2–3 conv blocks + head.</td></tr>
            <tr><td>&gt; 10K</td><td>Full fine-tune with low LR (1e-4) + data augmentation.</td></tr>
          </tbody>
        </table>
      </div>
      <CodeBlock title="CNN Transfer Learning — ResNet-50 Fine-Tuning for Property Photos" language="python" keyLine={8} keyNote="Differential LR: 10× lower for deep layers prevents catastrophic forgetting">{`import torch, torchvision
from torchvision.models import resnet50, ResNet50_Weights
import timm                         # 600+ pretrained vision models

# Pretrained ResNet-50 — fine-tune for property photo classification
model = resnet50(weights=ResNet50_Weights.IMAGENET1K_V2)
model.fc = torch.nn.Linear(2048, num_classes)    # replace head
optimizer = torch.optim.AdamW([
    {'params': model.layer4.parameters(), 'lr': 1e-4},    # fine-tune deep layers
    {'params': model.fc.parameters(), 'lr': 1e-3},        # train head faster
])

# timm — easier access to EfficientNet, ViT, ConvNeXt etc.
model = timm.create_model('efficientnet_b3', pretrained=True, num_classes=5)

# Inference on property photo
from torchvision import transforms
transform = transforms.Compose([transforms.Resize(224), transforms.CenterCrop(224),
                                  transforms.ToTensor(), transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])])
with torch.no_grad():
    logits = model(transform(image).unsqueeze(0))`}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Community &amp; resources</strong><br/>
        PyTorch torchvision — pretrained models + transforms · timm (rwightman) — 700+ models · fast.ai Practical Deep Learning for Coders — best practical CNN course · Papers With Code CV benchmarks · Grad-CAM library — interpretability · CNN Explainer (poloclub.github.io) — interactive visual
      </div>

      <h2>A.10 LLM Training Methods</h2>
      <p>The three-stage pipeline that turns a raw next-token-predictor into a helpful, safe assistant — and the attention mechanism that makes it possible.</p>

      {/* ── Self-Attention ── */}
      <div className="callout callout-info" style={{marginTop:'16px'}}>
        <strong>A.10.1 Self-Attention (Scaled Dot-Product Attention)</strong>
        <span style={{marginLeft:'10px',fontSize:'0.75rem',color:'#6c7086'}}>Architecture component · O(n²) sequence mixing · Foundation of all Transformers</span>
      </div>
      <p>Every token computes a weighted sum over all other tokens using three learned projections — <strong>Query (Q)</strong>, <strong>Key (K)</strong>, and <strong>Value (V)</strong>:</p>
      <CodeBlock title="Scaled Dot-Product Attention — Core Formula" language="python" keyLine={2} keyNote="Division by sqrt(d_k) prevents softmax saturation in high dimensions">{`# Scaled dot-product attention — the core computation
Attention(Q, K, V) = softmax(Q @ K.T / sqrt(d_k)) @ V
# Q = xW_Q  (what am I looking for?)
# K = xW_K  (what do I offer to others?)
# V = xW_V  (what information do I carry?)
# sqrt(d_k) prevents softmax saturation in high dimensions`}</CodeBlock>
      <p><strong>Multi-Head Attention (MHA)</strong> runs H independent attention heads in parallel (each with different W_Q, W_K, W_V), concatenates their outputs, and projects back to the model dimension. Each head learns to attend to different relationship types (syntactic, semantic, positional).</p>
      <p><strong>Grouped Query Attention (GQA)</strong> — used in LLaMA-3, Gemma — shares K/V heads across Q groups, cutting KV cache memory by 4-8×.</p>
      <p><strong>Flash Attention</strong> — reorders the attention computation to be IO-aware, reducing memory from O(n²) to O(n) by fusing operations and avoiding materialising the full attention matrix. 3-5× faster in practice.</p>
      <table>
        <tbody>
          <tr><th>Pros</th><th>Cons</th></tr>
          <tr>
            <td>
              ✓ Captures long-range dependencies in a single layer (RNNs need many steps)<br/>
              ✓ Fully parallelisable over sequence positions (unlike RNNs)<br/>
              ✓ Attention weights are interpretable (BertViz, attention maps)<br/>
              ✓ Universal — works for text, images (ViT), audio, protein sequences, code<br/>
              ✓ KV cache enables efficient autoregressive generation
            </td>
            <td>
              ✗ O(n²) memory and compute in sequence length — 128K tokens = 16K× more compute than 1K<br/>
              ✗ No inherent notion of position — requires explicit positional encoding (RoPE, ALiBi)<br/>
              ✗ Flash Attention 2+ is complex to implement correctly<br/>
              ✗ Not inherently causal — needs masking for autoregressive generation
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock title="Multi-Head and Flash Attention — PyTorch and HuggingFace" language="python" keyLine={10} keyNote="causal=True masks future tokens; omit for encoder bidirectional attention">{`import torch.nn as nn
from flash_attn import flash_attn_qkvpacked_func   # Tri Dao's Flash Attention

# PyTorch built-in MHA
attn = nn.MultiheadAttention(embed_dim=512, num_heads=8, dropout=0.1, batch_first=True)
out, weights = attn(query=x, key=x, value=x)     # self-attention (Q=K=V=x)

# Flash Attention — 3× faster, 10× less memory (use in production)
# qkv shape: (batch, seqlen, 3, num_heads, head_dim)
out = flash_attn_qkvpacked_func(qkv, dropout_p=0.0, causal=True)

# HuggingFace — uses Flash Attention automatically when available
from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained('meta-llama/Llama-3.1-8B',
                                               attn_implementation='flash_attention_2',
                                               torch_dtype=torch.bfloat16)`}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Community &amp; resources</strong><br/>
        "Attention Is All You Need" (Vaswani et al. 2017) — the original paper · The Annotated Transformer (Harvard NLP) — code walkthrough · Flash Attention (Tri Dao) — GitHub + paper · BertViz — visualise attention heads · Jay Alammar "The Illustrated Transformer" · Yannic Kilcher — paper walkthroughs · Module 3 of this course (LLM Internals) — full internals with SVG diagrams
      </div>

      {/* ── SFT ── */}
      <div className="callout callout-info" style={{marginTop:'28px'}}>
        <strong>A.10.2 Supervised Fine-Tuning (SFT)</strong>
        <span style={{marginLeft:'10px',fontSize:'0.75rem',color:'#6c7086'}}>LLM training stage 1 of 3 · Instruction following · LoRA / QLoRA compatible</span>
      </div>
      <p>Fine-tunes a pretrained base LLM on (instruction, response) pairs using standard cross-entropy loss — <strong>only on the response tokens</strong> (instruction tokens are masked out so the model doesn't waste capacity learning to predict the prompt). SFT teaches the model to follow instructions and adopt a particular format or persona. It is stage 1 in the ChatGPT / Claude / Gemini training pipeline.</p>
      <p><strong>Key insight:</strong> SFT quality is dominated by <em>data quality</em> not quantity. 10K expert-written examples often outperform 1M crowd-sourced ones. The Alpaca paper showed that 52K GPT-generated examples can teach instruction following from LLaMA.</p>
      <p><strong>Housing.com example:</strong> Fine-tuning a 7B model on 5K (query, ideal_property_search_response) pairs to produce structured JSON outputs for the search API — cheaper and faster than GPT-4 at inference time.</p>
      <table>
        <tbody>
          <tr><th>Pros</th><th>Cons</th></tr>
          <tr>
            <td>
              ✓ Standard supervised learning — stable, well-understood<br/>
              ✓ Works with small high-quality datasets (1K–100K examples)<br/>
              ✓ LoRA / QLoRA makes it cheap: fine-tune a 7B model on a single A100<br/>
              ✓ Domain specialisation: medical, legal, code, property search<br/>
              ✓ Output format control: always return JSON, always cite sources
            </td>
            <td>
              ✗ Prone to sycophancy — learns "what sounds good" not "what is true"<br/>
              ✗ Doesn't directly optimise for human preference rankings<br/>
              ✗ Catastrophic forgetting — fine-tune too hard → loses base capabilities (fix: mix 20% general data)<br/>
              ✗ Distribution shift — model echoes training data biases<br/>
              ✗ Requires high-quality labelled pairs (expensive to curate)
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock title="SFT with LoRA — QLoRA Fine-Tuning on 8B Model" language="python" keyLine={8} keyNote="load_in_4bit=True reduces 8B model VRAM from 16GB to ~5GB">{`from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model, TaskType
from trl import SFTTrainer, SFTConfig

# Load 8B model in 4-bit (QLoRA — fits in 1× A100 40GB)
model = AutoModelForCausalLM.from_pretrained(
    'meta-llama/Meta-Llama-3.1-8B',
    load_in_4bit=True,          # NF4 quantisation via bitsandbytes
    device_map='auto',
)

# LoRA config — train only 0.4% of parameters
lora_cfg = LoraConfig(
    r=16,                       # rank — higher = more capacity, more VRAM
    lora_alpha=32,              # scaling factor (alpha/r = effective LR scaling)
    target_modules=['q_proj', 'v_proj'],   # which layers to adapt
    lora_dropout=0.05,
    task_type=TaskType.CAUSAL_LM,
)
model = get_peft_model(model, lora_cfg)
model.print_trainable_parameters()   # "trainable: 41M/8B (0.51%)"

# SFTTrainer from TRL — handles chat template, masking, packing
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=sft_dataset,         # {"messages": [{"role": ..., "content": ...}]}
    args=SFTConfig(
        output_dir='./housing-llm',
        num_train_epochs=3,
        per_device_train_batch_size=4,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        lr_scheduler_type='cosine',
        warmup_ratio=0.1,
        bf16=True,
        logging_steps=10,
        save_strategy='epoch',
    ),
)
trainer.train()
model.save_pretrained('./housing-llm-adapter')   # save LoRA adapter (only ~50MB)`}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Community &amp; resources</strong><br/>
        TRL (Hugging Face) — SFTTrainer, PPOTrainer, DPOTrainer · PEFT (Hugging Face) — LoRA, QLoRA, IA³ · Unsloth — 2× faster SFT, 60% less VRAM · LLaMA-Factory — no-code fine-tuning UI · Axolotl — flexible YAML-based fine-tuning · r/LocalLLaMA — community experiments · Open Hermes, OpenOrca — high-quality open SFT datasets · Alignment Forum — research on SFT limitations
      </div>

      {/* ── RLHF ── */}
      <div className="callout callout-info" style={{marginTop:'28px'}}>
        <strong>A.10.3 RLHF — Reinforcement Learning from Human Feedback</strong>
        <span style={{marginLeft:'10px',fontSize:'0.75rem',color:'#6c7086'}}>LLM alignment · Human preference optimisation · PPO or DPO</span>
      </div>
      <p>RLHF directly optimises LLM behaviour to match human preferences using three stages:</p>
      <table>
        <tbody>
          <tr><th>Stage</th><th>What happens</th><th>Output</th></tr>
          <tr><td><strong>1. SFT</strong></td><td>Fine-tune base LLM on instruction-response pairs</td><td>SFT model π_SFT</td></tr>
          <tr><td><strong>2. Reward Model</strong></td><td>Collect preference data (response A &gt; response B). Train a regression model to score responses.</td><td>Reward model r_θ(prompt, response) → scalar</td></tr>
          <tr><td><strong>3. PPO / RL</strong></td><td>Use PPO to optimise π against r_θ while penalising KL divergence from π_SFT (prevents reward hacking)</td><td>Aligned policy π_RL</td></tr>
        </tbody>
      </table>
      <p><strong>DPO (Direct Preference Optimisation)</strong> — skips the separate reward model entirely. Reformulates the RLHF objective as a supervised loss directly on preference pairs (chosen, rejected). Same theoretical guarantee as RLHF-PPO, but simpler, more stable, and cheaper. DPO is now the dominant approach in open-source LLM training.</p>
      <p><strong>Housing.com example:</strong> After SFT on property search responses, use DPO to prefer responses that cite RERA numbers and disclaimer hallucinations over ones that don't — directly encoding the product safety requirement into the model.</p>
      <table>
        <tbody>
          <tr><th>Method</th><th>Pros</th><th>Cons</th></tr>
          <tr>
            <td><strong>PPO (original RLHF)</strong></td>
            <td>Directly optimises reward · Can improve beyond SFT ceiling</td>
            <td>Requires 3 models simultaneously (SFT + RM + policy) · PPO is notoriously unstable · Reward hacking</td>
          </tr>
          <tr>
            <td><strong>DPO</strong></td>
            <td>Only 1 model during training · Stable (supervised loss) · No reward hacking · Open-source friendly</td>
            <td>Slightly lower peak performance than PPO at very large scale · Requires paired preferences</td>
          </tr>
          <tr>
            <td><strong>ORPO</strong></td>
            <td>Combines SFT + DPO in one stage · No separate SFT needed</td>
            <td>Newer, less proven · Sensitive to reference model choice</td>
          </tr>
        </tbody>
      </table>
      <CodeBlock title="DPO Training — Preference Alignment for Property Search" language="python" keyLine={14} keyNote="beta controls KL penalty — higher keeps model closer to SFT baseline">{`from trl import DPOTrainer, DPOConfig
from datasets import load_dataset

# DPO dataset format: {prompt, chosen, rejected}
# "chosen" = preferred response, "rejected" = dispreferred response
dpo_dataset = load_dataset('json', data_files='housing_preferences.jsonl')['train']
# Example row:
# {"prompt": "Is this property RERA registered?",
#  "chosen": "Yes, RERA ID MH/MUM/2024/001234 (verify at maharera.mahaonline.gov.in)",
#  "rejected": "Yes, this property is RERA registered."}  # hallucinated, no ID

trainer = DPOTrainer(
    model=sft_model,                    # start from the SFT model
    ref_model=sft_model_copy,           # frozen reference (KL constraint target)
    args=DPOConfig(
        beta=0.1,                       # KL penalty strength — higher = stay closer to SFT
        loss_type='sigmoid',            # sigmoid DPO (original) or 'hinge', 'ipo'
        output_dir='./housing-dpo',
        per_device_train_batch_size=2,
        learning_rate=5e-7,             # much lower LR than SFT
        num_train_epochs=1,
        bf16=True,
    ),
    train_dataset=dpo_dataset,
    tokenizer=tokenizer,
)
trainer.train()`}</CodeBlock>
      <div className="callout callout-maang">
        <strong>MAANG interview: "How would you align an LLM for Housing.com without making it unsafe?"</strong><br/>
        <strong>A:</strong> Three-stage: (1) SFT on 5K curated property-search instruction-response pairs — teaches format, structured output, domain vocab. (2) DPO on 2K preference pairs where the "chosen" response always cites RERA IDs and adds uncertainty disclaimers — encodes the safety requirement directly into the model. (3) A confidence gate in the response node: retrieval_score &lt; 0.72 → always add "please verify directly with the builder." The LLM alignment makes the base behaviour right; the gate provides a deterministic safety net. Never rely solely on model alignment for safety-critical features.
      </div>
      <div className="callout callout-tip">
        <strong>Community &amp; resources</strong><br/>
        TRL DPOTrainer (Hugging Face) · "Training Language Models to Follow Instructions with Human Feedback" (Ouyang et al. 2022) — original InstructGPT paper · "Direct Preference Optimization" (Rafailov et al. 2023) — DPO paper · Nathan Lambert's rlhf.info — best RLHF blog · Anthropic Constitutional AI paper · DeepMind RLHF survey · r/MachineLearning · Alignment Forum · Module 33 (Fine-Tuning &amp; Training) — SFT, DPO, LoRA with code
      </div>

      <h2>A.11 Algorithm Decision Flowchart</h2>
      <AlgorithmDecisionTree />

      <h2>A.12 Transformers — Full Architecture</h2>
      <p>The Transformer (Vaswani et al. 2017, "Attention Is All You Need") replaced RNNs for sequence modelling by using self-attention to mix all token representations in parallel. Every major LLM today — GPT, BERT, T5, LLaMA, Claude, Gemini, Mistral — is a Transformer variant. The original paper had an encoder-decoder design; modern LLMs mostly use decoder-only.</p>

      <table>
        <tbody>
          <tr><th>Family</th><th>Examples</th><th>Pre-training objective</th><th>Best for</th></tr>
          <tr>
            <td><strong>Encoder-only</strong></td>
            <td>BERT, RoBERTa, DeBERTa, ModernBERT</td>
            <td>Masked LM — predict masked tokens using full context (bidirectional)</td>
            <td>Classification, NER, embeddings, semantic search. Sees the full sequence at once.</td>
          </tr>
          <tr>
            <td><strong>Decoder-only</strong></td>
            <td>GPT-4, LLaMA 3, Claude, Mistral, Gemma</td>
            <td>Causal LM — predict next token using past tokens only (left-to-right)</td>
            <td>Text generation, chat, code, reasoning. All frontier LLMs are this family.</td>
          </tr>
          <tr>
            <td><strong>Encoder-Decoder</strong></td>
            <td>T5, BART, mT5, Whisper, NLLB</td>
            <td>Span corruption (T5), denoising (BART)</td>
            <td>Translation, summarisation, speech-to-text. Encoder reads input, decoder generates output.</td>
          </tr>
        </tbody>
      </table>

      <h3>Inside one Transformer block (LLaMA 3 / modern style)</h3>
      <p>A decoder-only LLM is a stack of N identical blocks. Each block has exactly two sub-layers, both with residual connections:</p>
      <CodeBlock title="Transformer Block — LLaMA 3 / Mistral Modern Style" language="python" keyLine={12} keyNote="GQA shares K/V across Q groups, shrinking KV cache 4× without quality loss">{`# One Transformer block — modern LLaMA 3 / Mistral / Gemma style
# Pre-LayerNorm (applied before each sub-layer, not after — more stable training)

x = x + MultiHeadAttention(RMSNorm(x), causal_mask=True)   # self-attention
x = x + SwiGLU_FFN(RMSNorm(x))                             # feed-forward

# ── Multi-Head Attention (Grouped Query, GQA) ────────────────────────
# q_proj: (d, n_heads × head_dim)  — H query heads
# k_proj: (d, n_kv_heads × head_dim) — fewer KV heads (GQA: n_kv < n_heads)
# v_proj: (d, n_kv_heads × head_dim)
# Each head: Attention(Q,K,V) = softmax(QKᵀ / √d_k) V
# GQA (used in LLaMA 3): 8 KV heads shared across 32 Q heads → 4× smaller KV cache

# ── SwiGLU Feed-Forward Network ──────────────────────────────────────
# FFN(x) = (xW₁ ⊙ SiLU(xW_gate)) W₂     # ⊙ = element-wise multiply
# Intermediate dim = 8/3 × d_model (LLaMA), or 4/3 × d_model
# SwiGLU is a gated activation (Noam Shazeer 2020); outperforms ReLU on language tasks

# ── RMSNorm (Root Mean Square Layer Norm) ────────────────────────────
# RMSNorm(x) = x / sqrt(mean(x²) + ε) × γ
# No mean subtraction → faster; same empirical performance as LayerNorm

# ── Rotary Positional Encoding (RoPE) ────────────────────────────────
# Applied to Q and K before attention, not to input embeddings
# Encodes relative position as complex-valued rotations → length-extrapolatable`}</CodeBlock>

      <div className="callout callout-info" style={{marginTop:'12px'}}>
        <strong>Modern innovations vs original Transformer (2017)</strong>
        <table style={{marginTop:'8px',fontSize:'0.82rem'}}>
          <tbody>
            <tr><th>Component</th><th>Original paper</th><th>LLaMA 3 / Mistral / Gemma 2 (2024)</th></tr>
            <tr><td>Positional encoding</td><td>Sinusoidal (absolute, added to embeddings)</td><td>RoPE (relative, applied to Q/K in attention)</td></tr>
            <tr><td>Normalisation</td><td>Post-LayerNorm</td><td>Pre-RMSNorm (more numerically stable)</td></tr>
            <tr><td>Activation</td><td>ReLU</td><td>SwiGLU or GeGLU</td></tr>
            <tr><td>Attention heads</td><td>Multi-Head (MHA) — all Q/K/V equal</td><td>Grouped Query Attention (GQA) — fewer K/V heads</td></tr>
            <tr><td>Attention computation</td><td>Naive O(n²) matmul</td><td>Flash Attention 2 — IO-aware, 3-5× faster</td></tr>
            <tr><td>Context length</td><td>512 tokens</td><td>128K–1M tokens via RoPE + long-context training</td></tr>
            <tr><td>FFN</td><td>2-layer ReLU, 4× width</td><td>3-matrix SwiGLU gate, 8/3× width</td></tr>
          </tbody>
        </table>
      </div>

      <h3>KV Cache — why generation is fast</h3>
      <p>During autoregressive generation, each new token only needs to attend to all previous tokens. Rather than recomputing K and V for past tokens on every step, the Transformer caches them. The KV cache grows linearly with sequence length and is the dominant memory cost at inference time (not the model weights). GQA reduces KV cache size by 4-8× by sharing K/V across multiple Q heads.</p>
      <CodeBlock title="HuggingFace Transformers — Inference, Chat Templates, Embeddings" language="python" keyLine={20} keyNote="apply_chat_template handles per-model prompt format differences automatically">{`# HuggingFace transformers — the standard library for everything
from transformers import (
    AutoTokenizer, AutoModelForCausalLM,          # generation
    AutoModelForSequenceClassification,            # classification
    AutoModel,                                     # embeddings
    pipeline,                                      # high-level API
    Trainer, TrainingArguments,                    # fine-tuning
    DataCollatorWithPadding,                       # batching
    BitsAndBytesConfig,                            # quantisation
)

# ── Quick inference with pipeline API ──
gen = pipeline("text-generation", model="meta-llama/Meta-Llama-3.1-8B-Instruct",
               device_map="auto", torch_dtype=torch.bfloat16)
result = gen("Find 2BHK flats in Bandra under 2Cr", max_new_tokens=128)

# ── Chat template — handles instruction formatting per model ──
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Meta-Llama-3.1-8B-Instruct")
messages = [{"role": "system", "content": "You are a property search assistant."},
            {"role": "user", "content": "2BHK Mumbai under 2Cr"}]
prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)

# ── Embeddings for semantic search ──
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("BAAI/bge-m3")        # best multilingual embeddings
embeddings = model.encode(["2BHK Bandra Mumbai", "flat in andheri 3bhk"])

# ── 4-bit quantised inference (QLoRA / bitsandbytes) ──
bnb_config = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16,
                                 bnb_4bit_quant_type="nf4", bnb_4bit_use_double_quant=True)
model = AutoModelForCausalLM.from_pretrained(model_id, quantization_config=bnb_config)`}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Community &amp; resources</strong><br/>
        HuggingFace transformers docs (huggingface.co/docs/transformers) · "Attention Is All You Need" — original paper · The Annotated Transformer (Harvard NLP) — code walkthrough line-by-line · Andrej Karpathy's nanoGPT — build a Transformer from scratch in 300 lines · Flash Attention 2 paper (Tri Dao) · GQA paper (Google, 2023) · Module 3 of this course (LLM Internals) — full LLM internals with interactive diagrams
      </div>

      <h2>A.13 LoRA &amp; QLoRA — Parameter-Efficient Fine-Tuning</h2>
      <p>Full fine-tuning a 7B parameter model updates all 7 billion weights — requiring 7B × 4 bytes = 28GB VRAM just for the model, plus 2× for gradients and 4× for Adam optimizer state (&gt;140GB total). LoRA and QLoRA make fine-tuning accessible on a single GPU.</p>

      <h3>LoRA — Low-Rank Adaptation (Hu et al. 2022)</h3>
      <p>Instead of updating the full weight matrix W ∈ ℝ<sup>d×k</sup>, LoRA injects two small trainable matrices: <code>W′ = W + (α/r) × B × A</code>, where A ∈ ℝ<sup>r×k</sup> and B ∈ ℝ<sup>d×r</sup> with r ≪ min(d,k). W is frozen throughout training. At inference time, B×A is merged back into W — zero inference overhead.</p>

      <LoRAViz />

      <table>
        <tbody>
          <tr><th>Hyperparameter</th><th>What it does</th><th>Typical values</th></tr>
          <tr><td><code>r</code> (rank)</td><td>Number of trainable dimensions — higher = more capacity, more VRAM</td><td>4, 8, 16, 32, 64</td></tr>
          <tr><td><code>lora_alpha</code></td><td>Scaling factor: effective learning rate = lr × α/r. Rule of thumb: set α = 2r</td><td>8, 16, 32, 64</td></tr>
          <tr><td><code>target_modules</code></td><td>Which weight matrices to apply LoRA to</td><td><code>['q_proj','v_proj']</code> minimal; all attention + MLP for max quality</td></tr>
          <tr><td><code>lora_dropout</code></td><td>Dropout on LoRA layers — regularisation</td><td>0.0–0.1</td></tr>
        </tbody>
      </table>

      <div className="viz-2col" style={{margin:'12px 0'}}>
        <div className="viz-col"><div className="viz-col-title">✓ LoRA strengths</div>
          Only 0.1–1% of parameters trained → 10-100× less VRAM for optimizer states · Adapter files are tiny (10–300MB) · Multiple adapters can be swapped at inference time (serving multiple customers from one base model) · Merge into base weights → zero inference latency overhead · Composable: two LoRA adapters can be added together (LoRAHub)
        </div>
        <div className="viz-col"><div className="viz-col-title" style={{color:'#f38ba8'}}>✗ LoRA limits</div>
          Lower rank → less expressive than full fine-tune (use rank 64+ for complex tasks) · All target modules must be chosen upfront · Does not help if the base model lacks the knowledge entirely (use RAG instead) · Rank too low on hard tasks → underfitting (rare but real)
        </div>
      </div>
      <CodeBlock title="LoRA — Apply, Inspect, Merge, and Hot-Swap Adapters" language="python" keyLine={19} keyNote="merge_and_unload fuses B×A into W — zero inference latency overhead">{`from peft import LoraConfig, get_peft_model, TaskType, PeftModel

# Apply LoRA to a model
lora_config = LoraConfig(
    r=16,                                  # rank — start with 16, tune if needed
    lora_alpha=32,                         # α = 2r rule of thumb
    target_modules=[                       # which layers to adapt
        "q_proj", "k_proj", "v_proj", "o_proj",   # attention
        "gate_proj", "up_proj", "down_proj",        # SwiGLU FFN (adds quality, +VRAM)
    ],
    lora_dropout=0.05,
    bias="none",                           # 'none' | 'all' | 'lora_only'
    task_type=TaskType.CAUSAL_LM,
)
model = get_peft_model(base_model, lora_config)
model.print_trainable_parameters()
# → trainable params: 83,886,080 || all params: 8,030,261,248 || trainable%: 1.044%

# After training — merge adapter into base weights (zero inference overhead)
merged_model = model.merge_and_unload()   # fuses B×A into W, removes LoRA layers
merged_model.save_pretrained("./housing-llm-merged")

# Load a saved adapter onto a base model (swap adapters at runtime)
inference_model = PeftModel.from_pretrained(base_model, "./housing-llm-adapter")
inference_model.set_adapter("housing-llm-adapter")   # hot-swap between adapters`}</CodeBlock>

      <h3>QLoRA — Quantized LoRA (Dettmers et al. 2023)</h3>
      <p>QLoRA combines three innovations to fit fine-tuning into consumer hardware: (1) <strong>4-bit NF4 quantisation</strong> — a data type optimised for the normal distribution of neural network weights (uses optimal quantile boundaries), (2) <strong>Double quantisation</strong> — quantises the quantisation constants themselves, saving ~0.4 bits/param, (3) <strong>Paged optimisers</strong> — uses NVIDIA unified memory to handle gradient checkpointing spikes without OOM. The LoRA adapter itself runs in bfloat16 for numerical stability.</p>

      <table>
        <tbody>
          <tr><th>Method</th><th>VRAM for 7B model</th><th>Adapter quality</th><th>Training speed</th></tr>
          <tr><td>Full fine-tune (fp16)</td><td>~80GB (+ optimizer)</td><td>Best</td><td>Fastest per step</td></tr>
          <tr><td>LoRA (fp16 base)</td><td>~16GB</td><td>~95% of full FT</td><td>Fast</td></tr>
          <tr><td>QLoRA (NF4 base)</td><td>~5–6GB</td><td>~90–95% of full FT</td><td>25–30% slower than LoRA</td></tr>
          <tr><td>QLoRA (INT8 base)</td><td>~8–9GB</td><td>~93% of full FT</td><td>Moderate</td></tr>
        </tbody>
      </table>
      <CodeBlock title="QLoRA — 4-bit NF4 Training and Unsloth Alternative" language="python" keyLine={10} keyNote="double_quant saves 0.4 bits/param extra — quantising the quantisation constants">{`from transformers import BitsAndBytesConfig, AutoModelForCausalLM
from peft import prepare_model_for_kbit_training, LoraConfig, get_peft_model
import torch

# Step 1: Load base model in 4-bit NF4 (bitsandbytes library)
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",                  # NF4 > INT4 for neural weights
    bnb_4bit_compute_dtype=torch.bfloat16,       # compute in bf16 inside the kernel
    bnb_4bit_use_double_quant=True,              # double quantisation: saves ~0.4 bits/param
)
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Meta-Llama-3.1-8B",
    quantization_config=bnb_config,
    device_map="auto",                           # spread across GPUs if multi-GPU
)

# Step 2: Prepare for k-bit training (re-enables gradient checkpointing safely)
model = prepare_model_for_kbit_training(model, use_gradient_checkpointing=True)

# Step 3: Inject LoRA (bf16 adapter on top of NF4 weights)
model = get_peft_model(model, LoraConfig(r=64, lora_alpha=128,
    target_modules=["q_proj","v_proj","k_proj","o_proj","gate_proj","up_proj","down_proj"],
    task_type="CAUSAL_LM"))

# Memory at this point: ~5.5GB for 8B model — fits on a single A10G / 3090 / 4090

# Unsloth alternative: 2× faster QLoRA with custom CUDA kernels
from unsloth import FastLanguageModel
model, tokenizer = FastLanguageModel.from_pretrained(
    "unsloth/Meta-Llama-3.1-8B-Instruct", max_seq_length=8192,
    load_in_4bit=True, dtype=torch.bfloat16
)
model = FastLanguageModel.get_peft_model(model, r=16, lora_alpha=32)`}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Community &amp; resources</strong><br/>
        "LoRA: Low-Rank Adaptation of Large Language Models" — Hu et al. 2022 · "QLoRA: Efficient Finetuning of Quantized LLMs" — Dettmers et al. 2023 · bitsandbytes (Tim Dettmers) — quantisation library · PEFT (HuggingFace) — LoRA, QLoRA, IA³, Prefix Tuning · Unsloth — 2× faster SFT/QLoRA, open-source · LLaMA-Factory — no-code fine-tuning framework · r/LocalLLaMA — community QLoRA experiments · Module 33 (Fine-Tuning &amp; Training) — full fine-tuning chapter with DPO comparison
      </div>

      <h2>A.14 Essential Learning Resources</h2>
      <p>Four resources that go deeper than any module in this course — use them as companions for the material you've just read.</p>

      {/* nanoGPT */}
      <div className="callout callout-info" style={{marginTop:'16px'}}>
        <strong>nanoGPT — Andrej Karpathy</strong>
        <span style={{marginLeft:'10px',fontSize:'0.75rem',color:'#6c7086'}}>github.com/karpathy/nanoGPT · ~300 lines of Python</span>
      </div>
      <p>The cleanest Transformer implementation in existence. <code>model.py</code> is a complete GPT-2 in 300 lines — no magic, no abstractions, just the math made concrete. <code>train.py</code> is a minimal distributed training loop with gradient accumulation, LR scheduling, and eval. Used by thousands of people to understand how LLMs actually work before reading HuggingFace source code.</p>
      <table>
        <tbody>
          <tr><th>File</th><th>What you learn from it</th></tr>
          <tr><td><code>model.py</code></td><td>CausalSelfAttention, MLP (GELU), Block, GPT — the full decoder-only Transformer in ~270 lines</td></tr>
          <tr><td><code>train.py</code></td><td>Gradient accumulation, mixed precision, DDP multi-GPU, LR warm-up + cosine decay, checkpoint saving</td></tr>
          <tr><td><code>data/prepare.py</code></td><td>BPE tokenisation with tiktoken, memory-mapped numpy arrays for fast data loading</td></tr>
          <tr><td><code>sample.py</code></td><td>Temperature, top-k sampling, KV cache (implicit in PyTorch)</td></tr>
        </tbody>
      </table>
      <CodeBlock title="nanoGPT — CausalSelfAttention from Scratch" language="python" keyLine={19} keyNote="masked_fill with -inf causes softmax to assign 0 probability to future tokens">{`# nanoGPT: the key CausalSelfAttention class (simplified)
class CausalSelfAttention(nn.Module):
    def __init__(self, config):
        super().__init__()
        self.c_attn = nn.Linear(config.n_embd, 3 * config.n_embd)  # Q, K, V in one projection
        self.c_proj = nn.Linear(config.n_embd, config.n_embd)       # output projection
        self.n_head = config.n_head
        # causal mask: lower triangle, prevents attending to future tokens
        self.register_buffer("bias", torch.tril(torch.ones(config.block_size, config.block_size))
                             .view(1, 1, config.block_size, config.block_size))

    def forward(self, x):
        B, T, C = x.size()
        q, k, v = self.c_attn(x).split(C, dim=2)       # split single projection into Q, K, V
        k = k.view(B, T, self.n_head, C // self.n_head).transpose(1, 2)  # (B, nh, T, hs)
        q = q.view(B, T, self.n_head, C // self.n_head).transpose(1, 2)
        v = v.view(B, T, self.n_head, C // self.n_head).transpose(1, 2)
        att = (q @ k.transpose(-2, -1)) * (1.0 / math.sqrt(k.size(-1)))  # QKᵀ / √d
        att = att.masked_fill(self.bias[:,:,:T,:T] == 0, float('-inf'))   # causal mask
        att = F.softmax(att, dim=-1)
        y = att @ v                                      # weighted sum of values
        return self.c_proj(y.transpose(1, 2).contiguous().view(B, T, C))`}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Also from Karpathy:</strong> "Let's build GPT from scratch" — 2h 25min YouTube video, step-by-step implementation · makemore — character-level language model (easier starting point) · llm.c — GPT-2 in pure C/CUDA (~2000 lines) · minbpe — BPE tokeniser from scratch
      </div>

      {/* HuggingFace NLP Course */}
      <div className="callout callout-info" style={{marginTop:'28px'}}>
        <strong>HuggingFace NLP Course</strong>
        <span style={{marginLeft:'10px',fontSize:'0.75rem',color:'#6c7086'}}>huggingface.co/learn/nlp-course · Free · 9 chapters</span>
      </div>
      <p>The definitive free course for the HuggingFace ecosystem. Takes you from "what is a Transformer" to deploying a model on Spaces with a Gradio demo. All hands-on — every concept has a runnable notebook on Google Colab.</p>
      <table>
        <tbody>
          <tr><th>Chapter</th><th>What you learn</th><th>Relevant to this course</th></tr>
          <tr><td>1 — Transformer Models</td><td>What Transformers are, encoder/decoder families, zero-shot/few-shot</td><td>A.12 above</td></tr>
          <tr><td>2 — Using Transformers</td><td>AutoTokenizer, AutoModel, pipeline API, tokenisation internals</td><td>Module 38–39 (model selection)</td></tr>
          <tr><td>3 — Fine-Tuning</td><td>Trainer API, DataCollator, evaluation metrics, Weights &amp; Biases integration</td><td>A.13 (LoRA) + Module 40</td></tr>
          <tr><td>4 — Sharing Models</td><td>HuggingFace Hub, model cards, push_to_hub</td><td>Module 41</td></tr>
          <tr><td>5 — Datasets</td><td>datasets library, streaming, map() for preprocessing, DatasetDict</td><td>Module 40</td></tr>
          <tr><td>6 — Tokenizers</td><td>BPE, WordPiece, SentencePiece, fast tokenizers, padding/truncation</td><td>Module 3 (LLM Internals)</td></tr>
          <tr><td>7 — Main NLP Tasks</td><td>Token classification, QA, summarisation, translation, causal LM</td><td>Module 30 (RAG)</td></tr>
          <tr><td>8 — Demo with Gradio</td><td>Build and deploy interactive demos on HuggingFace Spaces</td><td>Module 46 (agent demos)</td></tr>
          <tr><td>9 — Building &amp; Sharing Demos</td><td>Gradio Blocks, live inference, sharing with the community</td><td>Module 46</td></tr>
        </tbody>
      </table>
      <div className="callout callout-tip">
        <strong>Also from HuggingFace:</strong> Deep RL Course (huggingface.co/learn/deep-rl-course) · Audio Course · ML for Games · Diffusion Models Course · SMOL Course (small language models) · Open LLM Leaderboard (benchmarks for open models)
      </div>

      {/* Anthropic Cookbook */}
      <div className="callout callout-info" style={{marginTop:'28px'}}>
        <strong>Anthropic's Cookbook</strong>
        <span style={{marginLeft:'10px',fontSize:'0.75rem',color:'#6c7086'}}>github.com/anthropics/anthropic-cookbook · Jupyter notebooks</span>
      </div>
      <p>Practical, runnable Jupyter notebooks covering every Claude API capability — from basic tool use to multi-agent orchestration. Each notebook is self-contained and production-quality. The intended audience is engineers building products on Claude, which maps directly to this course.</p>
      <table>
        <tbody>
          <tr><th>Section</th><th>Key notebooks</th><th>Relevant modules</th></tr>
          <tr><td><strong>Tool use</strong></td><td>Basic tool use, parallel tool calls, tool choice forcing, error handling</td><td>Modules 9, 26, 27</td></tr>
          <tr><td><strong>Extended Thinking</strong></td><td>Activating extended thinking, streaming thinking tokens, thinking budget</td><td>Module 42</td></tr>
          <tr><td><strong>Agents</strong></td><td>Computer use, web scraping agent, code interpreter agent</td><td>Modules 42–43</td></tr>
          <tr><td><strong>RAG</strong></td><td>Contextual retrieval (Anthropic's BM25 + embeddings method), citations</td><td>Modules 29–32</td></tr>
          <tr><td><strong>Multimodal</strong></td><td>Vision with Claude, PDF processing, document QA</td><td>Module 38</td></tr>
          <tr><td><strong>Prompt caching</strong></td><td>Cache long system prompts, measure savings, tool schema caching</td><td>Module 45</td></tr>
          <tr><td><strong>Classification</strong></td><td>Moderation, zero-shot classification, intent detection</td><td>Modules 10, 14</td></tr>
          <tr><td><strong>Embeddings</strong></td><td>Voyage AI embeddings (Anthropic's recommended), similarity search</td><td>Module 29</td></tr>
        </tbody>
      </table>
      <CodeBlock title="Anthropic Cookbook — Contextual Retrieval RAG Pattern" language="python" keyLine={18} keyNote="Prepending chunk context before embedding cuts retrieval failures by 49%">{`# From Anthropic Cookbook: contextual retrieval (their recommended RAG pattern)
# Prepend chunk-specific context before embedding, using Claude to generate it
import anthropic

client = anthropic.Anthropic()

def create_contextual_chunk(document: str, chunk: str) -> str:
    """Use Claude to generate a short context string for a chunk, then prepend it."""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",    # fast + cheap for bulk processing
        max_tokens=200,
        system="Generate a short (2-3 sentence) context for this chunk within the document.",
        messages=[{
            "role": "user",
            "content": f"<document>{document[:2000]}</document>\\n<chunk>{chunk}</chunk>\\nContext:"
        }]
    )
    context = response.content[0].text
    return f"{context}\\n\\n{chunk}"   # prepend context to chunk before embedding

# This technique reduces retrieval failures by 49% (Anthropic's benchmark)`}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Also from Anthropic:</strong> Anthropic Prompt Library — 50+ production-quality prompts · Model specifications — Claude's full character and values · Constitutional AI paper — how RLHF + CAI creates aligned models · Responsible Scaling Policy · Claude API docs (docs.anthropic.com)
      </div>

      {/* Meta Llama Cookbook */}
      <div className="callout callout-info" style={{marginTop:'28px'}}>
        <strong>Meta's Llama Cookbook</strong>
        <span style={{marginLeft:'10px',fontSize:'0.75rem',color:'#6c7086'}}>github.com/meta-llama/llama-cookbook · Formerly llama-recipes</span>
      </div>
      <p>The official reference implementation for everything Llama — from single-GPU fine-tuning to distributed training on 512 GPUs with FSDP. Covers the full lifecycle: data preparation → fine-tuning → inference → safety → deployment. Essential reading before running any Llama model in production.</p>
      <table>
        <tbody>
          <tr><th>Section</th><th>Key content</th></tr>
          <tr><td><strong>Getting started</strong></td><td>Llama 3.1 / 3.2 / 3.3 model cards, access via HuggingFace, running inference locally with ollama</td></tr>
          <tr><td><strong>Fine-tuning</strong></td><td>Single-GPU LoRA / QLoRA with SFTTrainer, multi-GPU with FSDP (Fully Sharded Data Parallel), custom datasets</td></tr>
          <tr><td><strong>Inference</strong></td><td>vLLM deployment, llama.cpp, ExllamaV2, TensorRT-LLM — with latency benchmarks</td></tr>
          <tr><td><strong>RAG</strong></td><td>Llama + LangChain RAG, Llama + LlamaIndex RAG, hybrid BM25 + vector search</td></tr>
          <tr><td><strong>Agents</strong></td><td>ReAct agents with Llama, function calling, Llama Stack (Meta's agent framework)</td></tr>
          <tr><td><strong>Safety</strong></td><td>Llama Guard 3 (content moderation model), Prompt Guard (jailbreak detection), CyberSecEval</td></tr>
          <tr><td><strong>Multimodal</strong></td><td>Llama 3.2 Vision — image understanding, document QA, chart reading</td></tr>
          <tr><td><strong>Long context</strong></td><td>Llama 3.1 128K context — document summarisation, cross-document QA</td></tr>
        </tbody>
      </table>
      <CodeBlock title="Meta Llama Cookbook — FSDP Multi-GPU Fine-Tuning and Llama Guard" language="python" keyLine={16} keyNote="Llama Guard returns 'safe' or 'unsafe\\ncategory' — wire as a safety_node gate">{`# From Meta Llama Cookbook: FSDP multi-GPU fine-tuning setup
# (single-GPU LoRA is in the "getting started" section above)
torchrun --nnodes 1 --nproc_per_node 8 llama_finetuning.py  \\
    --model_name meta-llama/Meta-Llama-3.1-70B  \\
    --enable_fsdp \\
    --fsdp_config.pure_bf16  \\
    --use_peft --peft_method lora  \\
    --dataset alpaca_dataset  \\
    --output_dir ./output/llama3-70b-finetuned

# Llama Guard 3 — content moderation (run as a safety gate)
from transformers import pipeline
guard = pipeline("text-generation", model="meta-llama/Llama-Guard-3-8B",
                  device_map="auto", torch_dtype=torch.bfloat16)
result = guard(f"[INST] {user_message} [/INST]", max_new_tokens=20)
safe = result[0]['generated_text'].strip().lower().startswith("safe")
# Returns "safe" or "unsafe\\n<violation categories>" — use as your safety_node`}</CodeBlock>
      <div className="callout callout-maang">
        <strong>MAANG interview: "How do you choose between OpenAI API, Anthropic API, and self-hosting Llama?"</strong><br/>
        <strong>A:</strong> Three axes: (1) <em>Data privacy</em> — if user queries contain PII or MNPI, self-host Llama (Meta Llama Cookbook) on your own VPC. (2) <em>Cost at scale</em> — 1M DAU × 200 tokens/request = 200B tokens/month. At $3/M tokens that's $600K/month. Llama 3.1-8B on 4× A10G instances costs ~$15K/month — 40× cheaper above 10M req/day. (3) <em>Capability</em> — frontier tasks (multi-step reasoning, complex tool use) still need Claude Sonnet / GPT-4o. The answer is usually: OpenAI/Anthropic for low-volume complex tasks, self-hosted Llama for high-volume commodity tasks (classification, summarisation). Use the Anthropic Cookbook for the Claude tasks and Meta Llama Cookbook for the self-hosted path.
      </div>
      <div className="callout callout-tip">
        <strong>Also from Meta:</strong> Llama Stack — standardised interface for Llama inference/fine-tuning/safety · OLMo (Allen AI) — fully open LLM including training data and code · Mistral models — strong alternative to Llama, Apache 2 licence
      </div>

      <QuizSection moduleId={50} title="Algorithm & Resource Reference" contentHint="Linear Regression Ridge Lasso OLS, KNN FAISS ANN, Decision Tree ensemble Random Forest XGBoost LightGBM CatBoost, Naive Bayes GaussianNB MultinomialNB calibration, K-Means elbow silhouette MiniBatchKMeans HDBSCAN, backpropagation chain rule vanishing gradients gradient clipping, CNN weight sharing transfer learning timm, self-attention QKV Flash Attention GQA RoPE RMSNorm SwiGLU, SFT QLoRA SFTTrainer, RLHF DPO PPO ORPO DPOTrainer, Transformer encoder decoder encoder-decoder, LoRA rank alpha parameter savings merge_and_unload PEFT, QLoRA NF4 double quantization paged optimizers bitsandbytes Unsloth, nanoGPT CausalSelfAttention, HuggingFace NLP course chapters, Anthropic contextual retrieval cookbook, Meta Llama FSDP Llama Guard" />
    </>
  );
}
