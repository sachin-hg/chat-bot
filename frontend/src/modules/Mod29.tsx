import { useState } from 'react';
import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from '../components/CodeBlock';

function RadarChart() {
  const [visible, setVisible] = useState({ gpt4o: true, claude: true, llama: true });

  const cx = 200, cy = 185, R = 130;
  const axes = ['Capability', 'Speed', 'Cost-\nefficiency', 'Context\nwindow', 'Privacy /\nControl'];
  const angleOffset = -Math.PI / 2;
  const models = [
    { key: 'gpt4o',  label: 'GPT-4o',           color: '#89b4fa', scores: [9, 7, 5, 9, 3] },
    { key: 'claude', label: 'Claude Sonnet',      color: '#cba6f7', scores: [9, 8, 6, 9, 4] },
    { key: 'llama',  label: 'Llama 3.1 70B',      color: '#a6e3a1', scores: [7, 6, 9, 8, 10] },
  ];

  const getPoint = (i: number, val: number) => {
    const angle = angleOffset + (2 * Math.PI * i) / 5;
    const r = (val / 10) * R;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const getLabelPos = (i: number) => {
    const angle = angleOffset + (2 * Math.PI * i) / 5;
    const r = R + 22;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const gridLevels = [2, 4, 6, 8, 10];

  const polygonPoints = (scores: number[]) =>
    scores.map((s, i) => { const p = getPoint(i, s); return `${p.x},${p.y}`; }).join(' ');

  const gridPolygon = (level: number) =>
    Array.from({ length: 5 }, (_, i) => { const p = getPoint(i, level); return `${p.x},${p.y}`; }).join(' ');

  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: '8px', padding: '20px', margin: '20px 0', overflow: 'hidden' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6c7086', marginBottom: '14px' }}>MODEL COMPARISON — 5-AXIS FRAMEWORK</div>
      <div style={{ marginBottom: '12px' }}>
        {models.map(m => (
          <button
            key={m.key}
            onClick={() => setVisible(v => ({ ...v, [m.key]: !v[m.key as keyof typeof v] }))}
            style={{
              background: visible[m.key as keyof typeof visible] ? '#89b4fa22' : '#313244',
              color: visible[m.key as keyof typeof visible] ? m.color : '#cdd6f4',
              border: `1px solid ${visible[m.key as keyof typeof visible] ? m.color : '#45475a'}`,
              borderRadius: '6px', padding: '5px 12px', fontSize: '0.78rem', cursor: 'pointer', marginRight: '8px',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 400 360" width="100%" style={{ display: 'block', margin: '0 auto' }} aria-label="Radar chart comparing GPT-4o, Claude Sonnet, and Llama 3.1 70B across 5 axes">
        {gridLevels.map(level => (
          <polygon key={level} points={gridPolygon(level)} fill="none" stroke="#313244" strokeWidth="1" />
        ))}
        {Array.from({ length: 5 }, (_, i) => {
          const p = getPoint(i, 10);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#45475a" strokeWidth="1" />;
        })}
        {gridLevels.map(level => {
          const p = getPoint(0, level);
          return <text key={level} x={p.x + 4} y={p.y} fill="#6c7086" fontSize="9">{level}</text>;
        })}
        {axes.map((label, i) => {
          const lp = getLabelPos(i);
          const lines = label.split('\n');
          return (
            <text key={i} x={lp.x} y={lp.y - (lines.length - 1) * 6} textAnchor="middle" fill="#89b4fa" fontSize="11" fontWeight="bold">
              {lines.map((l, li) => <tspan key={li} x={lp.x} dy={li === 0 ? 0 : 13}>{l}</tspan>)}
            </text>
          );
        })}
        {models.map(m => visible[m.key as keyof typeof visible] && (
          <polygon key={m.key} points={polygonPoints(m.scores)} fill={m.color} fillOpacity="0.25" stroke={m.color} strokeWidth="2" />
        ))}
        <rect x="268" y="16" width="120" height="76" rx="6" fill="#313244" stroke="#45475a" strokeWidth="1" />
        <text x="278" y="32" fill="#cdd6f4" fontSize="10" fontWeight="bold">Models</text>
        {models.map((m, i) => (
          <g key={m.key}>
            <line x1="278" y1={48 + i * 20} x2="298" y2={48 + i * 20} stroke={m.color} strokeWidth="2.5" />
            <circle cx="288" cy={48 + i * 20} r="3" fill={m.color} />
            <text x="302" y={52 + i * 20} fill={m.color} fontSize="10">{m.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function CostCalcViz() {
  const [queriesPerDay, setQueriesPerDay] = useState(100000);
  const [contextLength, setContextLength] = useState(16000);

  // GPT-4o pricing: $5/M input tokens long context, $0.15/M embedding + $0.5/M 2K context for RAG
  const monthlyQueries = queriesPerDay * 30;
  const longContextCostMonthly = (monthlyQueries * contextLength / 1_000_000) * 5;
  const ragEmbedCost = (monthlyQueries * contextLength / 1_000_000) * 0.15;
  const ragLLMCost = (monthlyQueries * 2000 / 1_000_000) * 0.5;
  const ragCostMonthly = ragEmbedCost + ragLLMCost;

  const maxCost = Math.max(longContextCostMonthly, ragCostMonthly, 1);

  const fmtCost = (c: number) => c >= 1000 ? `$${(c / 1000).toFixed(1)}K` : `$${c.toFixed(0)}`;
  const fmtNum = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : `${n}`;

  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: '8px', padding: '20px', margin: '20px 0', overflow: 'hidden' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6c7086', marginBottom: '14px' }}>RAG vs LONG CONTEXT — MONTHLY COST COMPARISON</div>
      <div style={{ display: 'flex', gap: '32px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ fontSize: '0.78rem', color: '#bac2de', marginBottom: '6px' }}>Queries per day: <span style={{ color: '#89b4fa', fontWeight: 700 }}>{fmtNum(queriesPerDay)}</span></div>
          <input type="range" min="1000" max="1000000" step="1000" value={queriesPerDay} onChange={e => setQueriesPerDay(+e.target.value)}
            style={{ width: '100%', accentColor: '#89b4fa' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6c7086' }}><span>1K</span><span>1M</span></div>
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ fontSize: '0.78rem', color: '#bac2de', marginBottom: '6px' }}>Context length per query: <span style={{ color: '#cba6f7', fontWeight: 700 }}>{fmtNum(contextLength)} tokens</span></div>
          <input type="range" min="1000" max="128000" step="1000" value={contextLength} onChange={e => setContextLength(+e.target.value)}
            style={{ width: '100%', accentColor: '#cba6f7' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6c7086' }}><span>1K</span><span>128K</span></div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {[
          { label: 'Long Context (GPT-4o)', cost: longContextCostMonthly, color: '#89b4fa', detail: `${fmtNum(contextLength)} tok × $5/M` },
          { label: 'RAG (embed + 2K context)', cost: ragCostMonthly, color: '#a6e3a1', detail: `Embed $0.15/M + LLM $0.5/M × 2K` },
        ].map(row => (
          <div key={row.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.82rem', color: row.color, fontWeight: 600 }}>{row.label}</span>
              <span style={{ fontSize: '0.82rem', color: '#cdd6f4', fontFamily: 'monospace', fontWeight: 700 }}>{fmtCost(row.cost)}/mo</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1, height: '14px', background: '#313244', borderRadius: '3px' }}>
                <div style={{ height: '100%', borderRadius: '3px', background: row.color, width: `${Math.min(100, (row.cost / maxCost) * 100)}%`, transition: 'width 0.3s' }} />
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#6c7086', marginTop: '3px' }}>{row.detail}</div>
          </div>
        ))}
      </div>
      {ragCostMonthly < longContextCostMonthly && (
        <div style={{ marginTop: '14px', padding: '10px 14px', background: '#a6e3a122', borderRadius: '6px', border: '1px solid #a6e3a144', fontSize: '0.82rem', color: '#a6e3a1' }}>
          RAG saves <strong>{fmtCost(longContextCostMonthly - ragCostMonthly)}/mo</strong> ({Math.round((1 - ragCostMonthly / longContextCostMonthly) * 100)}% cheaper) at these settings
        </div>
      )}
    </div>
  );
}

const CODE_1 = `── Annual Cost Waterfall: Hosted vs Self-Hosted (1M calls/day) ──────────────

HOSTED (Anthropic Haiku 4.5)          SELF-HOSTED (Llama 3.1 70B, spot A100)
─────────────────────────────          ────────────────────────────────────────
Input tokens  ████████░░  $116K        GPU spot (2× A100)  ████░░░░░░  $21K
Output tokens █████████░  $146K        MLOps 0.5 FTE       ████████░░  $125K
                                       SageMaker overhead  █░░░░░░░░░  $4K
                                       GPU failures/maint  █░░░░░░░░░  $5K

TOTAL         ██████████  $263K/yr     TOTAL               █████████░  $155K/yr

Break-even: ~500K calls/day
Below 300K/day → hosted wins (no MLOps burden, no on-call)
Above 1M/day  → self-hosted saves ~$100K+/yr (if you can staff it)

Hidden self-hosted costs NOT in the chart:
• GPU failure recovery (1–4hr outage = thousands of missed API calls)
• CUDA version management across model updates
• 24/7 on-call rotation for GPU failures
• Cold-start when spot instance preempted`;

const CODE_2 = `# Hosted (Haiku 4.5) at 1M calls/day, 500 tokens avg:
# Input:  1M × 400 tokens × $0.80/1M = $320/day
# Output: 1M × 100 tokens × $4.00/1M = $400/day
# Annual: ~$263K/year

# Self-hosted (Llama 3.1 70B on 2× A100 80GB):
# On-demand A100: $3/hr → 2× A100 × $3 × 24hr = $144/day = $52.6K/year
# Spot A100: ~$1.20/hr (~60% discount) → $57.6/day = $21K/year
# SageMaker overhead: adds ~20% to GPU cost
# MLOps engineering: 0.5 FTE at $250K TC = $125K/year
# Total self-hosted range: $146K–$178K/year (spot+MLOps to on-demand+MLOps)

# Break-even: spot instances make self-hosting cheaper around 500K calls/day.
# Below 300K calls/day: hosted wins (no MLOps on-call burden).
# Hidden self-hosted costs: GPU failures, CUDA dependency management,
#   model update rollouts, 24/7 on-call, cold-start latency.`;

export function Mod29() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Compare frontier closed-source models across benchmark, latency, and cost dimensions</li>
          <li>Identify when open-source models (Llama 3, Mistral, Qwen2) are the right choice</li>
          <li>Select specialist models for code, embeddings, vision, and speech tasks</li>
          <li>Apply a 5-axis decision framework to choose any model for any use case</li>
          <li>Calculate TCO for hosted vs self-hosted at 1M DAU</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~70 minutes</span>
          <span className="obj-diff">Difficulty: ★★★☆☆</span>
          <span className="obj-diff">Prerequisites: Module 2</span>
        </div>
      </div>

      <div className="callout callout-info">
        <strong>Housing.com Context</strong><br />
        Housing.com runs Claude Haiku (classification) → Claude Sonnet (response generation). This module gives you the full decision space — what switching to GPT-4o would cost, why the two-model architecture was right, and how to re-evaluate as model prices change quarterly.
      </div>

      <RadarChart />

      <h2>38.1 Closed-Source Frontier Models</h2>
      <table>
        <tr><th>Model</th><th>Context</th><th>Input / Output (per 1M tokens)</th><th>MMLU</th><th>Best for</th></tr>
        <tr><td><strong>GPT-4o</strong></td><td>128K</td><td>$2.50 / $10.00</td><td>88.7%</td><td>Multimodal, vision+text, tool use</td></tr>
        <tr><td><strong>GPT-4o mini</strong></td><td>128K</td><td>$0.15 / $0.60</td><td>82.0%</td><td>Cost-efficient general tasks</td></tr>
        <tr><td><strong>o1</strong></td><td>200K</td><td>$15 / $60</td><td>92.3%</td><td>Complex reasoning, math, science</td></tr>
        <tr><td><strong>Claude Sonnet 4.6</strong></td><td>200K</td><td>$3.00 / $15.00</td><td>90.1%</td><td>Long-context, instruction following</td></tr>
        <tr><td><strong>Claude Haiku 4.5</strong></td><td>200K</td><td>$0.80 / $4.00</td><td>83.2%</td><td>Fast, cheap, structured output</td></tr>
        <tr><td><strong>Gemini 1.5 Pro</strong></td><td>1M</td><td>$3.50 / $10.50</td><td>90.0%</td><td>Massive context, multimodal</td></tr>
        <tr><td><strong>Gemini 2.0 Flash</strong></td><td>1M</td><td>$0.10 / $0.40</td><td>87.0%</td><td>Cheapest frontier option with strong reasoning</td></tr>
      </table>
      <div className="callout callout-info">
        <strong>Cost at scale reality check</strong>
        {" "}At 1M daily calls × 500 tokens avg: GPT-4o = $1,250/day, Haiku = $400/day, Gemini 2.0 Flash = $50/day. Model cost is often the largest AI infrastructure line item. This is why Housing.com uses Haiku for classification and most Tier 3 responses.
      </div>
      <div className="callout callout-warn">
        <strong>What MMLU actually tells you (and what it doesn't)</strong>
        {" "}MMLU (Massive Multitask Language Understanding) tests general knowledge across 57 academic subjects
        — chemistry, law, history, philosophy. It is a proxy for overall reasoning capability, not
        domain-specific performance. <strong>A 1–2% MMLU difference rarely translates to meaningful differences
        on your specific task.</strong>
        <br /><br />
        <strong>What to do instead:</strong> run your own task-specific evaluation — your RAGAS golden set, your
        intent classification test suite, your property query benchmark. That offline eval tells you actual
        task performance; the MMLU table tells you the capability ceiling.
        <br /><br />
        <strong>More actionable benchmarks for AI engineering:</strong> HumanEval (code generation, 0–100 solve%),
        MT-Bench (instruction following, 1–10), MATH (math reasoning). These correlate better with
        real AI engineering tasks than MMLU.
      </div>

      <h2>38.2 Open-Source Models</h2>
      <table>
        <tr><th>Model</th><th>Params</th><th>Context</th><th>MMLU</th><th>VRAM (bf16)</th><th>Best for</th></tr>
        <tr><td><strong>Llama 3.1 8B</strong></td><td>8B</td><td>128K</td><td>73.0%</td><td>16GB</td><td>Edge/local, cost-sensitive</td></tr>
        <tr><td><strong>Llama 3.1 70B</strong></td><td>70B</td><td>128K</td><td>86.0%</td><td>140GB</td><td>Near-frontier quality, self-hosted</td></tr>
        <tr><td><strong>Llama 3.1 405B</strong></td><td>405B</td><td>128K</td><td>88.6%</td><td>810GB</td><td>Frontier quality, maximum control</td></tr>
        <tr><td><strong>Mixtral 8×7B</strong></td><td>47B MoE</td><td>32K</td><td>70.6%</td><td>90GB</td><td>MoE — GPT-3.5 quality at 13B inference cost</td></tr>
        <tr><td><strong>Mistral Large 2</strong></td><td>123B</td><td>128K</td><td>84.0%</td><td>246GB</td><td>Strong reasoning, open weights</td></tr>
        <tr><td><strong>Qwen2.5 72B</strong></td><td>72B</td><td>128K</td><td>86.7%</td><td>144GB</td><td>Multilingual, especially CJK</td></tr>
        <tr><td><strong>Phi-3 Mini</strong></td><td>3.8B</td><td>128K</td><td>68.8%</td><td>8GB</td><td>On-device, extreme resource constraint</td></tr>
        <tr><td><strong>Command R+</strong></td><td>104B</td><td>128K</td><td>75.7%</td><td>208GB</td><td>RAG-optimised, retrieval grounding</td></tr>
      </table>
      <div className="callout callout-tip">
        <strong>MoE (Mixture of Experts) — how it actually works</strong>
        {" "}Each transformer layer has 8 separate feed-forward networks (the "experts"). A small router network
        (the gating function) looks at the input token representation and outputs weights for all 8 experts
        — the top 2 by weight are activated. Yes, different tokens in the same sentence activate
        different expert combinations.
        <br /><br />
        <strong>Common misconception:</strong> the experts do NOT specialize by topic (e.g., "the legal expert" or
        "the maths expert"). They learn complementary patterns during training, similar to how attention
        heads in a standard transformer learn different patterns — the specialization emerges organically.
        <br /><br />
        <strong>Why it matters:</strong> you pay inference cost for 2 experts (≈13B params) but the model has the
        capacity of all 8 (47B params) because all experts were trained together. This is why Mixtral 8×7B
        achieves GPT-3.5-class quality at roughly Llama-7B inference speed.
      </div>
      <p>
        <strong>When open-source wins:</strong> data privacy (healthcare/finance/legal), cost at scale (10M+ daily calls saves $5K–$50K/month vs API), co-located latency (-50–100ms no network hop), fine-tuning with LoRA adapters.<br />
        <strong>When closed-source wins:</strong> speed to market (zero infra), top reasoning capability (o1/Sonnet still lead), multi-modal quality, small team (can't manage GPU infra).
      </p>

      <h2>38.3 Specialist Models</h2>
      <table>
        <tr><th>Domain</th><th>Model</th><th>Notes</th></tr>
        <tr><td>Code</td><td>DeepSeek-Coder-V2</td><td>Best open-source code model mid-2025, 338 languages, 128K context</td></tr>
        <tr><td>Code</td><td>CodeLlama 34B</td><td>Strong unit test generation, Python/JS/TS completion</td></tr>
        <tr><td>Vision</td><td>GPT-4o</td><td>Document OCR, chart understanding, ~$0.01/image</td></tr>
        <tr><td>Vision</td><td>Gemini 1.5 Pro</td><td>Video understanding, long documents with images (1M context)</td></tr>
        <tr><td>Vision (open)</td><td>PaliGemma 3B</td><td>Image captioning, visual QA, Apache license, self-hostable</td></tr>
        <tr><td>Speech</td><td>Whisper (OpenAI)</td><td>Open source, 39 languages, runs locally, GDPR-safe</td></tr>
        <tr><td>Embedding</td><td>text-embedding-3-small</td><td>Best default — see Module 28.7 for full comparison</td></tr>
      </table>

      <h2>38.4 The 5-Axis Model Selection Framework</h2>
      <div className="callout callout-info">
        <strong>Score these five axes for your specific use case, then weight by priority</strong>
      </div>
      <table>
        <tr><th>Axis</th><th>Weight</th><th>Claude Haiku 4.5</th><th>GPT-4o</th><th>Llama 3.1 70B</th></tr>
        <tr><td>Cost per call</td><td>30%</td><td>★★★★★ ($0.0004)</td><td>★★☆☆☆ ($0.0015)</td><td>★★★★☆ (infra cost)</td></tr>
        <tr><td>Latency p95</td><td>25%</td><td>★★★★☆ (~250ms)</td><td>★★★☆☆ (~800ms)</td><td>★★★☆☆ (~500ms)</td></tr>
        <tr><td>Capability</td><td>20%</td><td>★★★☆☆ (JSON OK)</td><td>★★★★★</td><td>★★★★☆</td></tr>
        <tr><td>Data privacy</td><td>15%</td><td>★★★☆☆ (API)</td><td>★★★☆☆ (API)</td><td>★★★★★ (local)</td></tr>
        <tr><td>Operational ctrl</td><td>10%</td><td>★★★☆☆</td><td>★★★☆☆</td><td>★★★★★</td></tr>
      </table>
      <svg width="520" height="400" viewBox="0 0 520 400" style={{display: "block", margin: "12px auto", fontFamily: "'Courier New',monospace"}}>
        <rect width="520" height="400" rx="6" fill="#1e1e2e"/>
        <text x="210" y="22" textAnchor="middle" fill="#cdd6f4" fontSize="12" fontWeight="bold">5-Axis Model Comparison (score 1–5, higher=better per axis)</text>
        {/* Grid pentagons cx=210 cy=205 R=130 */}
        <polygon points="210,75 334,165 286,310 134,310 86,165" fill="none" stroke="#585b70" strokeWidth="1"/>
        <polygon points="210,101 314,173 271,289 149,289 106,173" fill="none" stroke="#45475a" strokeWidth="0.8" strokeDasharray="3,3"/>
        <polygon points="210,127 294,181 257,268 163,268 126,181" fill="none" stroke="#45475a" strokeWidth="0.8" strokeDasharray="3,3"/>
        <polygon points="210,153 274,189 241,247 179,247 146,189" fill="none" stroke="#45475a" strokeWidth="0.8" strokeDasharray="3,3"/>
        <polygon points="210,179 254,197 226,226 194,226 166,197" fill="none" stroke="#45475a" strokeWidth="0.8" strokeDasharray="3,3"/>
        {/* Axis lines */}
        <line x1="210" y1="205" x2="210" y2="75" stroke="#6c7086" strokeWidth="1"/>
        <line x1="210" y1="205" x2="334" y2="165" stroke="#6c7086" strokeWidth="1"/>
        <line x1="210" y1="205" x2="286" y2="310" stroke="#6c7086" strokeWidth="1"/>
        <line x1="210" y1="205" x2="134" y2="310" stroke="#6c7086" strokeWidth="1"/>
        <line x1="210" y1="205" x2="86" y2="165" stroke="#6c7086" strokeWidth="1"/>
        {/* Scale labels at 100% */}
        <text x="210" y="70" textAnchor="middle" fill="#a6adc8" fontSize="9">5</text>
        {/* Axis labels */}
        <text x="210" y="60" textAnchor="middle" fill="#89b4fa" fontSize="11" fontWeight="bold">Cost Efficiency</text>
        <text x="345" y="158" textAnchor="start" fill="#89b4fa" fontSize="11" fontWeight="bold">Low Latency</text>
        <text x="286" y="328" textAnchor="middle" fill="#89b4fa" fontSize="11" fontWeight="bold">Capability</text>
        <text x="134" y="328" textAnchor="middle" fill="#89b4fa" fontSize="11" fontWeight="bold">Privacy</text>
        <text x="82" y="158" textAnchor="end" fill="#89b4fa" fontSize="11" fontWeight="bold">Control</text>
        {/* Claude Haiku: Cost=3,Latency=4,Capability=4,Privacy=2,Control=1 */}
        <polygon points="210,127 309,173 271,289 179,247 185,197" fill="#a6e3a1" fillOpacity="0.25" stroke="#a6e3a1" strokeWidth="2"/>
        {/* GPT-4o: Cost=2,Latency=3,Capability=5,Privacy=2,Control=1 */}
        <polygon points="210,153 284,181 286,310 179,247 185,197" fill="#89b4fa" fillOpacity="0.25" stroke="#89b4fa" strokeWidth="2"/>
        {/* Llama 3.1 8B (self-hosted): Cost=5,Latency=4,Capability=3,Privacy=5,Control=5 */}
        <polygon points="210,75 309,173 256,268 134,310 86,165" fill="#f38ba8" fillOpacity="0.25" stroke="#f38ba8" strokeWidth="2"/>
        {/* Center dot */}
        <circle cx="210" cy="205" r="3" fill="#6c7086"/>
        {/* Legend box */}
        <rect x="365" y="55" width="145" height="145" rx="4" fill="#313244" stroke="#6c7086" strokeWidth="1"/>
        <text x="375" y="73" fill="#cdd6f4" fontSize="10" fontWeight="bold">Models compared</text>
        <line x1="375" y1="88" x2="400" y2="88" stroke="#a6e3a1" strokeWidth="2.5"/>
        <circle cx="387" cy="88" r="3" fill="#a6e3a1"/>
        <text x="406" y="92" fill="#a6e3a1" fontSize="10">Claude Haiku 4.5</text>
        <text x="406" y="104" fill="#a6adc8" fontSize="9">Balanced, cheap, fast</text>
        <line x1="375" y1="118" x2="400" y2="118" stroke="#89b4fa" strokeWidth="2.5"/>
        <circle cx="387" cy="118" r="3" fill="#89b4fa"/>
        <text x="406" y="122" fill="#89b4fa" fontSize="10">GPT-4o</text>
        <text x="406" y="134" fill="#a6adc8" fontSize="9">Top capability, less control</text>
        <line x1="375" y1="148" x2="400" y2="148" stroke="#f38ba8" strokeWidth="2.5"/>
        <circle cx="387" cy="148" r="3" fill="#f38ba8"/>
        <text x="406" y="152" fill="#f38ba8" fontSize="10">Llama 3.1 8B (self-hosted)</text>
        <text x="406" y="164" fill="#a6adc8" fontSize="9">Max privacy + control</text>
        {/* Score guide */}
        <text x="365" y="225" fill="#a6adc8" fontSize="9">Cost: 5=cheapest (&lt;$0.001)</text>
        <text x="365" y="238" fill="#a6adc8" fontSize="9">Privacy: 5=self-hosted/VPC</text>
        <text x="365" y="251" fill="#a6adc8" fontSize="9">Control: 5=full model access</text>
        <text x="365" y="270" fill="#a6adc8" fontSize="9">Weights are context-specific.</text>
        <text x="365" y="283" fill="#a6adc8" fontSize="9">Set your own per use-case.</text>
        {/* Grid scale labels */}
        <text x="218" y="132" fill="#45475a" fontSize="8">3</text>
        <text x="218" y="158" fill="#45475a" fontSize="8">2</text>
        <text x="218" y="184" fill="#45475a" fontSize="8">1</text>
      </svg>
      <div className="callout callout-warn">
        <strong>The weights above are a template, not a formula</strong>
        {" "}The 30/25/20/15/10 weights were calibrated for a cost-sensitive B2B SaaS product. You must set
        your own weights by interviewing the product owner for their top 2 constraints.
        <br /><br />
        <strong>How to set your weights:</strong>
        <ul>
          <li>Privacy weight → 40%+ for healthcare, finance, or legal (PII/PHI regulations mandate on-prem)</li>
          <li>Cost weight → increase if you have a hard per-call budget or are at consumer scale (10M+ calls/day)</li>
          <li>Latency weight → increase for consumer-facing UX (&lt;300ms p95 threshold)</li>
        </ul>
        <strong>Latency rating key:</strong> ★★★★★ = &lt;100ms p95, ★★★★ = &lt;300ms, ★★★ = &lt;600ms, ★★ = &lt;1.5s, ★ = &gt;1.5s
        <br /><br />
        <strong>Housing.com weighting:</strong> Latency 35% (consumer UX), Cost 30% (scale), Capability 20%, Privacy 10%, Control 5%.
      </div>
      <p><strong>Decision shortcuts:</strong> structured JSON at low latency → Haiku/GPT-4o mini/Gemini Flash. Complex reasoning → o1/Sonnet/GPT-4o. Data on-premises → Llama 3.1 70B. Max context (1M tokens) → Gemini 1.5 Pro. Cost-optimised at 10M+ calls/day → Gemini 2.0 Flash or self-hosted Llama.</p>

      <CostCalcViz />

      <h2>38.5 Hosted vs Self-Hosted — TCO at 1M Calls/Day</h2>
      <div className="callout callout-info" style={{fontFamily:'monospace',fontSize:'12px',lineHeight:1.8,whiteSpace:'pre'}}>
        {CODE_1}
      </div>
      <CodeBlock title="TCO Calculation — Hosted vs Self-Hosted Cost Breakdown" language="python" keyLine={13} keyNote="break-even at ~500K calls/day on spot instances">{CODE_2}</CodeBlock>

      <h2>38.6 Context Window Tradeoffs</h2>
      <table>
        <tr><th>Context</th><th>Use case</th><th>Cost impact</th><th>Quality risk</th></tr>
        <tr><td>4K–8K</td><td>Standard Q&amp;A, classification</td><td>Baseline</td><td>Minimal</td></tr>
        <tr><td>32K–128K</td><td>Long documents, codebases</td><td>10–40× more expensive</td><td>Lost-in-the-middle past 8K</td></tr>
        <tr><td>1M (Gemini)</td><td>Full codebase, video, multi-doc</td><td>100× more expensive</td><td>Attention degradation past 128K</td></tr>
      </table>
      <div className="callout callout-tip">
        <strong>RAG vs long context — and the Lost-in-the-Middle problem</strong>
        {" "}Liu et al. (2023) "Lost in the Middle" empirically showed LLM performance degrades when relevant
        content is not at the beginning or end of context. At 32K tokens, models answer correctly 70% of
        the time when the answer is in position 1, dropping to ~50% when buried in the middle.
        <br /><br />
        <strong>Practical rule:</strong> Chunked RAG + reranking consistently outperforms "stuff everything into
        context" for queries where the relevant passage is unknown in advance (most RAG scenarios). Use
        long context when you need the full document structure (legal contract review, code audit) —
        chunking destroys structural context that spans sections.
        <br /><br />
        <strong>Gemini 1M context caveat:</strong> Benchmark performance at 1M tokens is significantly degraded vs
        32K. Gemini's reliability above 128K tokens is not well-established for production use as of 2025.
      </div>

      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection</strong>
        {" "}"How do you choose an LLM for a new AI feature?" → Walk through the 5-axis framework: cost, latency, capability, privacy, operational control. Apply it to the specific feature. "Start with the cheapest model that meets the accuracy bar, validated by offline eval on a golden dataset. Instrument online metrics to detect quality issues at scale. Upgrade selectively — not globally."
      </div>

      <QuizSection moduleId={37} title="Module 37: Model Landscape &amp; Selection" contentHint="Closed-source frontier model cost comparison Haiku vs GPT-4o vs Gemini Flash, MoE mixture of experts Mixtral activation cost, when open-source beats closed-source privacy cost latency, DeepSeek-Coder vs CodeLlama specialist code models, 5-axis selection framework cost latency capability privacy control, TCO calculation hosted vs self-hosted break-even 1M calls per day, RAG vs long context window when to use each" />
    </>
  );
}
