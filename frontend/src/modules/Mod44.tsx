import { useState, useEffect, useRef } from 'react';
import { QuizSection } from "../components/QuizSection";
import { CodeBlock, CodeDiff } from '../components/CodeBlock';

// ── Visualization Components ───────────────────────────────────────────────

// Threshold values referenced throughout the module's scoring tables
const RAGAS_THRESHOLD_WARN = 0.60;  // below this = failing (red pulse)
const RAGAS_THRESHOLD_GOOD = 0.90;  // above this = excellent

// Preset button values — order matches metaDefs: CP, CR, F, AR
const FAILING_PRESET = [0.45, 0.28, 0.31, 0.52];
const PASSING_PRESET = [0.82, 0.79, 0.87, 0.89];
const DEFAULT_PRESET = [0.74, 0.91, 0.88, 0.82];

function RAGASDashboard() {
  const metaDefs = [
    { label: 'Context Precision', color: '#f9e2af', desc: 'Signal-to-noise in retrieval' },
    { label: 'Context Recall',    color: '#a6e3a1', desc: 'Coverage of ground truth' },
    { label: 'Faithfulness',      color: '#89b4fa', desc: 'No hallucination in claims' },
    { label: 'Answer Relevancy',  color: '#94e2d5', desc: 'Answers the right question' },
  ];

  const [targetVals, setTargetVals]   = useState<number[]>(DEFAULT_PRESET);
  const [displayVals, setDisplayVals] = useState<number[]>(DEFAULT_PRESET.map(() => 0));
  const [animated, setAnimated]       = useState(false);
  const animRef = useRef<number | null>(null);

  function animateTo(targets: number[]) {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    // Snapshot current display values as animation start
    setDisplayVals(prev => {
      const from = [...prev];
      setAnimated(true);
      let start: number | null = null;
      const duration = 900;
      function step(ts: number) {
        if (!start) start = ts;
        const t = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
        setDisplayVals(targets.map((to, i) =>
          parseFloat((from[i] + (to - from[i]) * ease).toFixed(3))
        ));
        if (t < 1) animRef.current = requestAnimationFrame(step);
      }
      animRef.current = requestAnimationFrame(step);
      return from;
    });
    setTargetVals(targets);
  }

  function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  function tickCoord(cx: number, cy: number, r: number, angleDeg: number) {
    const toRad = (d: number) => (d * Math.PI) / 180;
    return {
      inner: { x: cx + (r - 7) * Math.cos(toRad(angleDeg)), y: cy + (r - 7) * Math.sin(toRad(angleDeg)) },
      outer: { x: cx + (r + 7) * Math.cos(toRad(angleDeg)), y: cy + (r + 7) * Math.sin(toRad(angleDeg)) },
      dot:   { x: cx + (r + 10) * Math.cos(toRad(angleDeg)), y: cy + (r + 10) * Math.sin(toRad(angleDeg)) },
    };
  }

  const startAngle = 135;
  const totalAngle = 270;
  const cx = 60, cy = 65, r = 36;

  const angleWarn = startAngle + totalAngle * RAGAS_THRESHOLD_WARN; // tick at 0.60
  const angleGood = startAngle + totalAngle * RAGAS_THRESHOLD_GOOD; // tick at 0.90
  const warnTick  = tickCoord(cx, cy, r, angleWarn);
  const goodTick  = tickCoord(cx, cy, r, angleGood);

  const pulseKeyframes = `
    @keyframes ragasPulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.25; }
    }
  `;

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <style>{pulseKeyframes}</style>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>
        RAGAS METRICS DASHBOARD — 4 DIMENSIONS OF RAG QUALITY
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'14px'}}>
        {metaDefs.map((m, i) => {
          const val = animated ? displayVals[i] : 0;
          const fillAngle = startAngle + totalAngle * Math.min(val, 1);
          const isFailing = val > 0.001 && val < RAGAS_THRESHOLD_WARN;
          const strokeColor = isFailing ? '#f38ba8' : m.color;

          return (
            <div key={m.label} style={{background:'#1e1e2e',borderRadius:'8px',padding:'14px',textAlign:'center'}}>
              <svg viewBox="0 0 120 90" width="100%" style={{display:'block',margin:'0 auto',maxHeight:'90px',overflow:'visible'}}>
                {/* Track arc */}
                <path d={describeArc(cx,cy,r,startAngle,startAngle+totalAngle)}
                  fill="none" stroke="#313244" strokeWidth="7" strokeLinecap="round"/>

                {/* Fill arc — pulses red when below 0.60 threshold */}
                {val > 0.001 && (
                  <path d={describeArc(cx,cy,r,startAngle,fillAngle)}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="7"
                    strokeLinecap="round"
                    style={{
                      transition: 'none',
                      animation: isFailing ? 'ragasPulse 1.2s ease-in-out infinite' : 'none',
                    }}
                  />
                )}

                {/* Threshold tick at 0.60 — gold/yellow */}
                <line x1={warnTick.inner.x} y1={warnTick.inner.y}
                      x2={warnTick.outer.x} y2={warnTick.outer.y}
                      stroke="#f9e2af" strokeWidth="2" strokeLinecap="round"/>
                <circle cx={warnTick.dot.x} cy={warnTick.dot.y} r="2.5" fill="#f9e2af"/>

                {/* Threshold tick at 0.90 — green */}
                <line x1={goodTick.inner.x} y1={goodTick.inner.y}
                      x2={goodTick.outer.x} y2={goodTick.outer.y}
                      stroke="#a6e3a1" strokeWidth="2" strokeLinecap="round"/>
                <circle cx={goodTick.dot.x} cy={goodTick.dot.y} r="2.5" fill="#a6e3a1"/>

                {/* Value */}
                <text x={cx} y={cy - 1} textAnchor="middle" fontSize="17" fontWeight="700"
                      fill={isFailing ? '#f38ba8' : m.color}>
                  {val.toFixed(2)}
                </text>
              </svg>

              <div style={{fontSize:'0.78rem',fontWeight:700,color: isFailing ? '#f38ba8' : '#cdd6f4',marginBottom:'2px'}}>
                {m.label}{isFailing ? ' ⚠' : ''}
              </div>
              <div style={{fontSize:'0.70rem',color:'#6c7086'}}>{m.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Threshold legend */}
      <div style={{display:'flex',justifyContent:'center',gap:'18px',marginBottom:'12px',fontSize:'0.68rem',color:'#6c7086',flexWrap:'wrap'}}>
        <span><span style={{color:'#f9e2af',fontWeight:700}}>&#9135; 0.60</span> minimum threshold</span>
        <span><span style={{color:'#a6e3a1',fontWeight:700}}>&#9135; 0.90</span> excellent</span>
        <span><span style={{color:'#f38ba8',fontWeight:700}}>&#9642; pulse</span> = below threshold &mdash; fix required</span>
      </div>

      {/* Control buttons */}
      <div style={{textAlign:'center',display:'flex',flexWrap:'wrap',gap:'8px',justifyContent:'center'}}>
        <button
          onClick={() => animateTo(FAILING_PRESET)}
          style={{background:'#2d1b1b',color:'#f38ba8',border:'1px solid #f38ba866',borderRadius:'6px',padding:'5px 14px',fontSize:'0.78rem',cursor:'pointer'}}
        >
          &#x25BC; Load Failing System
        </button>
        <button
          onClick={() => animateTo(PASSING_PRESET)}
          style={{background:'#1b2d1b',color:'#a6e3a1',border:'1px solid #a6e3a166',borderRadius:'6px',padding:'5px 14px',fontSize:'0.78rem',cursor:'pointer'}}
        >
          &#x25B2; Load Passing System
        </button>
        <button
          onClick={() => animateTo(targetVals)}
          style={{background:'#313244',color:'#cdd6f4',border:'1px solid #45475a',borderRadius:'6px',padding:'5px 14px',fontSize:'0.78rem',cursor:'pointer'}}
        >
          &#x21BA; Re-animate
        </button>
      </div>
    </div>
  );
}

function ContextPrecisionViz() {
  const badChunks = Array.from({length:10},(_,i)=>i<3);
  const goodChunks = Array.from({length:10},(_,i)=>i<8);
  const colW = 240, boxW = 18, boxH = 22, gapX = 4, startX = 10, startY = 60;

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>CONTEXT PRECISION — SIGNAL-TO-NOISE RATIO IN RETRIEVED CHUNKS</div>
      <svg viewBox="0 0 560 180" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Context Precision visualization">
        {/* Left panel */}
        <rect x="0" y="0" width="270" height="175" rx="6" fill="#1e1e2e" stroke="#313244"/>
        <text x="135" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="#f38ba8">Bad Retrieval (CP = 0.30)</text>
        <text x="135" y="34" textAnchor="middle" fontSize="10" fill="#6c7086">Query: "What is the price of 2BHK in Bandra?"</text>
        {badChunks.map((rel, i) => {
          const col = i % 5, row = Math.floor(i / 5);
          const x = startX + col * (boxW + gapX);
          const y = startY + row * (boxH + 6);
          return (
            <g key={i}>
              <rect x={x} y={y} width={boxW} height={boxH} rx="4" fill={rel ? '#a6e3a122' : '#31324488'} stroke={rel ? '#a6e3a1' : '#45475a'} strokeWidth="1.5"/>
              <text x={x+boxW/2} y={y+boxH/2+4} textAnchor="middle" fontSize="9" fill={rel ? '#a6e3a1' : '#6c7086'}>{rel ? '✓' : '✗'}</text>
            </g>
          );
        })}
        <text x="135" y="148" textAnchor="middle" fontSize="11" fill="#f9e2af">3/10 relevant = precision 0.30</text>
        <text x="135" y="165" textAnchor="middle" fontSize="10" fill="#6c7086">7 noise chunks drown the signal</text>

        {/* Right panel */}
        <rect x="290" y="0" width="270" height="175" rx="6" fill="#1e1e2e" stroke="#313244"/>
        <text x="425" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="#a6e3a1">Good Retrieval (CP = 0.80)</text>
        <text x="425" y="34" textAnchor="middle" fontSize="10" fill="#6c7086">Query: "What is the price of 2BHK in Bandra?"</text>
        {goodChunks.map((rel, i) => {
          const col = i % 5, row = Math.floor(i / 5);
          const x = 300 + col * (boxW + gapX);
          const y = startY + row * (boxH + 6);
          return (
            <g key={i}>
              <rect x={x} y={y} width={boxW} height={boxH} rx="4" fill={rel ? '#a6e3a122' : '#31324488'} stroke={rel ? '#a6e3a1' : '#45475a'} strokeWidth="1.5"/>
              <text x={x+boxW/2} y={y+boxH/2+4} textAnchor="middle" fontSize="9" fill={rel ? '#a6e3a1' : '#6c7086'}>{rel ? '✓' : '✗'}</text>
            </g>
          );
        })}
        <text x="425" y="148" textAnchor="middle" fontSize="11" fill="#a6e3a1">8/10 relevant = precision 0.80</text>
        <text x="425" y="165" textAnchor="middle" fontSize="10" fill="#6c7086">Focused, high-signal retrieval</text>
      </svg>
    </div>
  );
}

function FaithfulnessViz() {
  const claims = [
    { text: '"Bandra has 47 active listings"', supported: true },
    { text: '"Average price is ₹1.8Cr"', supported: true },
    { text: '"Prices increased 15% last year"', supported: false },
  ];

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>FAITHFULNESS — EVERY CLAIM MUST BE GROUNDED IN RETRIEVED CONTEXT</div>
      <svg viewBox="0 0 560 200" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Faithfulness claim verification">
        <style>{`@keyframes dashFlowFaith{to{stroke-dashoffset:-14}}`}</style>
        <defs>
          <marker id="arrowGreen44" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#a6e3a1"/></marker>
          <marker id="arrowRed44" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#f38ba8"/></marker>
        </defs>

        {/* LLM Response box */}
        <rect x="0" y="10" width="240" height="140" rx="6" fill="#1e1e2e" stroke="#89b4fa" strokeWidth="1.5"/>
        <text x="120" y="28" textAnchor="middle" fontSize="11" fontWeight="700" fill="#89b4fa">LLM Response — Claims Extracted</text>
        {claims.map((c, i) => (
          <g key={i}>
            <text x="12" y={55 + i*38} fontSize="11" fill={c.supported ? '#a6e3a1' : '#f38ba8'}>{c.supported ? '✓' : '✗'}</text>
            <text x="24" y={55 + i*38} fontSize="10" fill={c.supported ? '#cdd6f4' : '#f38ba8'}>{c.text}</text>
            <text x="24" y={70 + i*38} fontSize="9" fill={c.supported ? '#a6e3a1' : '#f38ba8'}>{c.supported ? 'supported by context' : 'NOT IN CONTEXT — hallucination'}</text>
          </g>
        ))}

        {/* Context box */}
        <rect x="320" y="10" width="240" height="140" rx="6" fill="#1e1e2e" stroke="#45475a" strokeWidth="1.5"/>
        <text x="440" y="28" textAnchor="middle" fontSize="11" fontWeight="700" fill="#cdd6f4">Retrieved Context Chunks</text>
        <rect x="330" y="36" width="220" height="32" rx="4" fill="#313244"/>
        <text x="440" y="55" textAnchor="middle" fontSize="10" fill="#bac2de">Bandra West: 47 properties listed</text>
        <text x="440" y="67" textAnchor="middle" fontSize="9" fill="#6c7086">as of April 2025 on Housing.com</text>
        <rect x="330" y="74" width="220" height="32" rx="4" fill="#313244"/>
        <text x="440" y="93" textAnchor="middle" fontSize="10" fill="#bac2de">Average 2BHK price: ₹1.8 Crore</text>
        <text x="440" y="105" textAnchor="middle" fontSize="9" fill="#6c7086">Q1 2025, Bandra West locality</text>
        <rect x="330" y="112" width="220" height="32" rx="4" fill="#31324466"/>
        <text x="440" y="131" textAnchor="middle" fontSize="10" fill="#6c7086">No YoY price change data</text>
        <text x="440" y="143" textAnchor="middle" fontSize="9" fill="#45475a">in retrieved context</text>

        {/* Connection lines */}
        <line x1="240" y1="52" x2="320" y2="52" stroke="#a6e3a1" strokeWidth="1.5" markerEnd="url(#arrowGreen44)"/>
        <line x1="240" y1="90" x2="320" y2="90" stroke="#a6e3a1" strokeWidth="1.5" markerEnd="url(#arrowGreen44)"/>
        <line x1="240" y1="127" x2="320" y2="128" stroke="#f38ba8" strokeWidth="1.5" strokeDasharray="4 3" style={{animation:'dashFlowFaith 1s linear infinite'}} markerEnd="url(#arrowRed44)"/>

        {/* Score */}
        <rect x="160" y="162" width="240" height="28" rx="6" fill="#313244"/>
        <text x="280" y="181" textAnchor="middle" fontSize="12" fontWeight="700" fill="#89b4fa">Faithfulness = 2/3 = 0.67</text>
      </svg>
    </div>
  );
}

// ── §44.1 What RAGAS measures ──────────────────────────────────────────────
const CODE_INSTALL = `pip install ragas langchain-openai langchain-anthropic pandas

# RAGAS uses an LLM internally for its judge-based metrics.
# Any LangChain-compatible LLM works.`;

const CODE_DATASET = `from ragas import EvaluationDataset, SingleTurnSample

# Each sample = one question-answer-context triple
samples = [
    SingleTurnSample(
        user_input="What is the price of 3BHK in Bandra West?",
        retrieved_contexts=[
            "Bandra West 3BHK properties range from ₹2Cr to ₹5Cr depending on floor and view.",
            "Properties near Linking Road command a 15% premium over the area average.",
        ],
        response="3BHK flats in Bandra West are priced between ₹2 crore and ₹5 crore.",
        reference="3BHK properties in Bandra West are typically priced between ₹2Cr and ₹5Cr.",
    ),
    SingleTurnSample(
        user_input="Is Powai a RERA-registered project?",
        retrieved_contexts=[
            "Hiranandani Gardens, Powai was completed in 2004 before RERA was enacted.",
        ],
        response="Yes, Powai is RERA registered.",  # hallucination — context doesn't say this
        reference="RERA registration status for Hiranandani Gardens Powai is not confirmed in the retrieved context.",
    ),
]
dataset = EvaluationDataset(samples=samples)`;

const CODE_RUN_BASIC = `from ragas import evaluate
from ragas.metrics import (
    LLMContextPrecisionWithoutReference,
    LLMContextRecall,
    Faithfulness,
    AnswerRelevancy,
    AnswerCorrectness,
)
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

evaluator_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
embeddings    = OpenAIEmbeddings(model="text-embedding-3-small")

result = evaluate(
    dataset   = dataset,
    metrics   = [
        LLMContextPrecisionWithoutReference(),
        LLMContextRecall(),
        Faithfulness(),
        AnswerRelevancy(),
        AnswerCorrectness(),
    ],
    llm        = evaluator_llm,
    embeddings = embeddings,
)

print(result)
# {'context_precision': 0.83, 'context_recall': 0.71, 'faithfulness': 0.45,
#  'answer_relevancy': 0.91, 'answer_correctness': 0.67}

# Convert to pandas for analysis:
df = result.to_pandas()
df.to_csv("ragas_results.csv", index=False)
# Each row = one sample; each column = one metric score + raw LLM judgements`;

// ── §44.2 Metric internals ─────────────────────────────────────────────────
const CODE_FAITHFULNESS_INTERNALS = `# RAGAS Faithfulness — how it works step by step

# Input: question, retrieved_contexts, response (answer)
question  = "Does Bandra West have sea-facing options?"
contexts  = ["Bandra West has several premium high-rises with sea views including Carter Road."]
response  = "Yes, there are sea-facing apartments in Bandra West, particularly on Carter Road. They also offer garden views."

# Step 1: LLM extracts atomic claims from the response
# claims = [
#   "There are sea-facing apartments in Bandra West.",        ← supported by context
#   "Sea-facing apartments are particularly on Carter Road.", ← supported by context
#   "They also offer garden views.",                          ← NOT in context (hallucination)
# ]

# Step 2: For each claim, LLM checks: "Can this claim be inferred from the context?"
# supported = [True, True, False]

# Step 3: score = supported / total = 2/3 = 0.67

# Faithfulness = 0.67 means 1 out of 3 claims was hallucinated.
# A production RAG system should target faithfulness > 0.90.
# If you see < 0.80: the LLM is adding information not in the retrieved chunks.
# Fix: add "Answer ONLY based on the provided context. If unsure, say so." to the system prompt.`;

const CODE_CONTEXT_PRECISION_INTERNALS = `# Context Precision — measures retrieval signal-to-noise

# Input: question, retrieved_contexts (ordered list)
# No ground_truth needed for LLMContextPrecisionWithoutReference

question = "What is the average EMI for a 2Cr property at 8.5%?"
contexts = [
    "For a ₹2Cr loan at 8.5% over 20 years, the monthly EMI is ₹17,356.",  # relevant
    "Bandra West is a premium neighbourhood in Mumbai.",                       # irrelevant
    "8.5% is the current SBI home loan interest rate for April 2025.",        # relevant
    "Mumbai receives heavy monsoon rainfall from June to September.",          # irrelevant
]

# For each chunk at position k, LLM judges: "Is chunk k relevant to the question?"
# relevance = [True, False, True, False]
# precision@k:
#   k=1: 1/1 = 1.0  (first chunk relevant)
#   k=2: 1/2 = 0.5  (first relevant, second not)
#   k=3: 2/3 = 0.67 (two relevant so far)
#   k=4: 2/4 = 0.5  (still two relevant)
# AP = average precision over relevant positions = (1.0 + 0.67) / 2 = 0.83

# High context_precision: your retriever returns focused, relevant chunks.
# Low context_precision: retriever returns too many off-topic chunks; LLM drowns in noise.
# Fix: increase score_threshold, reduce k, or switch to MMR retrieval.`;

const CODE_ANSWER_RELEVANCY_INTERNALS = `# Answer Relevancy — reference-free: no ground_truth needed

# Clever trick: instead of comparing to a reference answer,
# ask the LLM to reverse-engineer questions from the answer,
# then measure cosine similarity between original and generated questions.

question = "What is the 2BHK price in Bandra West?"
answer   = "2BHK flats in Bandra West are priced between ₹1.5Cr and ₹3Cr."

# Step 1: LLM generates N reverse questions from the answer (default N=3):
# rev_q_1 = "What is the price range for 2BHK in Bandra West?"
# rev_q_2 = "How much does a 2BHK in Bandra West cost?"
# rev_q_3 = "What is the price of a 2-bedroom flat in Bandra West?"

# Step 2: cosine_similarity(embed(question), embed(rev_q_i)) for each i
# → [0.97, 0.96, 0.93]  (all high — answer addresses the question)

# Step 3: answer_relevancy = mean(similarities) = 0.953

# Low answer_relevancy reveals:
# - Answer talks about a different topic ("This is a beautiful area..." instead of price)
# - Answer is too vague ("Prices vary by location")
# - Answer refuses to answer ("I don't have this data")
# Fix: tighten the system prompt; ensure the retrieved context is rich enough.`;

// ── §44.3 Building evaluation datasets ────────────────────────────────────
const CODE_DATASET_FROM_TRACES = `# Most valuable dataset source: production traffic
# Build from LangSmith traces — real questions, real retrieved contexts, real answers

from langsmith import Client
from ragas import EvaluationDataset, SingleTurnSample

client   = Client()
samples  = []

# Fetch recent production runs (each run = one user query through the full pipeline)
runs = list(client.list_runs(
    project_name  = "housing-agent-prod",
    execution_order = 1,
    limit         = 200,
    filter        = 'eq(status, "success")',
))

for run in runs:
    inp = run.inputs.get("messages", [])
    out = run.outputs.get("messages", [])
    if not inp or not out:
        continue

    question   = inp[-1].get("content", "") if isinstance(inp[-1], dict) else str(inp[-1])
    answer     = out[-1].get("content", "") if isinstance(out[-1], dict) else str(out[-1])
    # Extract retrieved chunks from the tool results in the run's child spans:
    child_runs = list(client.list_runs(run_id=run.id))
    contexts   = [r.outputs.get("output", "") for r in child_runs if r.name == "retrieve_docs_node"]

    if question and answer and contexts:
        samples.append(SingleTurnSample(
            user_input         = question,
            retrieved_contexts = contexts,
            response           = answer,
            # reference left empty — use reference-free metrics only
        ))

dataset = EvaluationDataset(samples=samples[:50])  # start with 50 for cost control`;

const CODE_SYNTHETIC_DATASET = `# Synthetic dataset generation — when you have documents but no user queries yet
# RAGAS can generate Q&A pairs from your corpus using an LLM

from ragas.testset import TestsetGenerator
from ragas.testset.evolutions import simple, reasoning, multi_context
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.document_loaders import DirectoryLoader

# Load your documents
loader = DirectoryLoader("rera_filings/", glob="*.pdf")
docs   = loader.load()

generator = TestsetGenerator.from_langchain(
    generator_llm  = ChatOpenAI(model="gpt-4o-mini"),
    critic_llm     = ChatOpenAI(model="gpt-4o"),
    embeddings     = OpenAIEmbeddings(),
)

# Generate 50 test samples with a mix of difficulty levels:
testset = generator.generate_with_langchain_docs(
    docs,
    test_size         = 50,
    distributions     = {
        simple:        0.5,   # direct factual questions
        reasoning:     0.3,   # multi-hop reasoning required
        multi_context: 0.2,   # answer spans multiple documents
    },
    with_debugging_logs = True,
)

df = testset.to_pandas()
df.to_csv("rera_eval_dataset.csv", index=False)
# Save to LangSmith for reuse:
from langsmith import Client
Client().upload_dataframe(df, name="rera-golden-set-v1", input_keys=["question"], output_keys=["answer"])`;

// ── §44.4 Using RAGAS to tune RAG ─────────────────────────────────────────
const CODE_CHUNK_SWEEP = `import pandas as pd
from ragas import evaluate
from ragas.metrics import Faithfulness, LLMContextRecall, LLMContextPrecisionWithoutReference
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

documents  = load_rera_documents()      # your corpus
questions  = load_eval_questions()      # 50-question golden set
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

results = []
for chunk_size in [200, 500, 1000, 2000]:
    for overlap in [0, int(chunk_size * 0.1), int(chunk_size * 0.2)]:
        splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=overlap)
        chunks   = splitter.split_documents(documents)

        vs        = FAISS.from_documents(chunks, embeddings)
        retriever = vs.as_retriever(search_kwargs={"k": 5})

        samples = []
        for q in questions:
            docs   = retriever.invoke(q["question"])
            answer = rag_chain.invoke({"question": q["question"], "context": docs})
            samples.append(SingleTurnSample(
                user_input         = q["question"],
                retrieved_contexts = [d.page_content for d in docs],
                response           = answer,
                reference          = q["ground_truth"],
            ))

        scores = evaluate(EvaluationDataset(samples), metrics=[
            Faithfulness(), LLMContextRecall(), LLMContextPrecisionWithoutReference()
        ], llm=evaluator_llm, embeddings=embeddings)

        results.append({
            "chunk_size":       chunk_size,
            "overlap":          overlap,
            "chunks_total":     len(chunks),
            "faithfulness":     scores["faithfulness"],
            "context_recall":   scores["context_recall"],
            "context_precision": scores["context_precision"],
        })
        print(f"chunk={chunk_size} overlap={overlap}: F={scores['faithfulness']:.2f} "
              f"R={scores['context_recall']:.2f} P={scores['context_precision']:.2f}")

df = pd.DataFrame(results).sort_values("faithfulness", ascending=False)
print(df.to_string())

# Typical findings:
# Small chunks (200):  high precision, low recall (misses multi-sentence answers)
# Large chunks (2000): high recall, low precision (too much noise per chunk)
# Sweet spot: 500-1000 chars with 10-20% overlap for most corpora`;

const CODE_K_SWEEP = `# Sweep retrieval k and strategy (similarity vs MMR) simultaneously
import itertools

strategies = [
    ("similarity", {"k": 3}),
    ("similarity", {"k": 5}),
    ("similarity", {"k": 10}),
    ("mmr",        {"k": 5,  "fetch_k": 20, "lambda_mult": 0.5}),
    ("mmr",        {"k": 10, "fetch_k": 40, "lambda_mult": 0.7}),
]

for search_type, kwargs in strategies:
    retriever = vectorstore.as_retriever(search_type=search_type, search_kwargs=kwargs)
    # ... build samples and evaluate same as above ...
    print(f"{search_type} k={kwargs['k']}: precision={p:.2f} recall={r:.2f}")

# Why MMR can beat similarity:
# MMR re-ranks to maximise diversity — avoids returning 5 nearly-identical chunks.
# For multi-hop questions (e.g. "compare prices in Bandra West and Powai"),
# MMR retrieves chunks from both locations; pure similarity returns 5 Bandra chunks.`;

// ── §44.5 Production CI/CD ─────────────────────────────────────────────────
const CODE_CI_EVAL = `# ci_eval.py — run in GitHub Actions on every PR that touches RAG components

import sys
import json
from ragas import evaluate, EvaluationDataset, SingleTurnSample
from ragas.metrics import Faithfulness, LLMContextRecall, LLMContextPrecisionWithoutReference

# Thresholds — adjust based on your baseline
THRESHOLDS = {
    "faithfulness":     0.85,   # < 0.85 → hallucination regression
    "context_recall":  0.75,   # < 0.75 → retriever missing key info
    "context_precision": 0.70, # < 0.70 → retriever returning too much noise
}

def load_golden_set() -> EvaluationDataset:
    with open("eval/golden_set.json") as f:
        data = json.load(f)
    return EvaluationDataset([
        SingleTurnSample(**s) for s in data["samples"]
    ])

def run_rag_pipeline(question: str) -> tuple[str, list[str]]:
    """Run the actual RAG pipeline under test."""
    from src.pipeline.graph import build_graph
    from langchain_core.messages import HumanMessage
    app    = build_graph()
    state  = app.invoke({"messages": [HumanMessage(question)]})
    answer = state["messages"][-1].content
    # extract retrieved docs from state — add retrieved_docs field to AgentState
    return answer, state.get("retrieved_docs", [])

if __name__ == "__main__":
    dataset = load_golden_set()
    samples = []
    for s in dataset.samples:
        answer, contexts = run_rag_pipeline(s.user_input)
        samples.append(SingleTurnSample(
            user_input         = s.user_input,
            retrieved_contexts = contexts,
            response           = answer,
            reference          = s.reference,
        ))

    scores = evaluate(
        EvaluationDataset(samples),
        metrics=[Faithfulness(), LLMContextRecall(), LLMContextPrecisionWithoutReference()],
        llm=evaluator_llm, embeddings=embeddings,
    )

    failed = []
    for metric, threshold in THRESHOLDS.items():
        score = scores.get(metric, 0)
        status = "PASS" if score >= threshold else "FAIL"
        print(f"  {status}  {metric}: {score:.3f} (threshold: {threshold})")
        if score < threshold:
            failed.append(f"{metric}={score:.3f} < {threshold}")

    if failed:
        print(f"\\n✗ Evaluation failed: {', '.join(failed)}")
        sys.exit(1)  # non-zero exit → PR blocked
    else:
        print("\\n✓ All evaluation thresholds passed")
        sys.exit(0)`;

const CODE_CI_YAML = `# .github/workflows/eval.yml
name: RAG Evaluation

on:
  pull_request:
    paths:
      - 'src/pipeline/**'
      - 'prompts/**'
      - 'src/session/**'

jobs:
  ragas-eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install ragas langchain-openai langchain-anthropic
      - run: python ci_eval.py
        env:
          OPENAI_API_KEY:     \${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY:  \${{ secrets.ANTHROPIC_API_KEY }}
          LANGCHAIN_API_KEY:  \${{ secrets.LANGCHAIN_API_KEY }}

# Cost note: 50-sample eval with gpt-4o-mini as judge ≈ $0.15 per run.
# Run on PRs to RAG components only (paths: filter) — not every commit.`;

// ── §44.6 Production monitoring ────────────────────────────────────────────
const CODE_ASYNC_MONITORING = `# Async sampling — evaluate a fraction of production traffic continuously
# Don't evaluate every request (cost); sample 1-5% and run RAGAS async.

import asyncio
import random
from ragas.metrics import Faithfulness, AnswerRelevancy

EVAL_SAMPLE_RATE = 0.02   # evaluate 2% of production requests

async def handle_chat(request):
    answer, contexts = await run_rag_pipeline(request.message)
    yield_response(answer)  # return immediately to user

    # Async evaluation — fire and forget, does NOT block the response
    if random.random() < EVAL_SAMPLE_RATE:
        asyncio.create_task(
            run_async_eval(request.message, answer, contexts, request.session_id)
        )

async def run_async_eval(question, answer, contexts, session_id):
    try:
        sample  = SingleTurnSample(user_input=question, retrieved_contexts=contexts, response=answer)
        dataset = EvaluationDataset([sample])
        scores  = evaluate(dataset, metrics=[Faithfulness(), AnswerRelevancy()],
                           llm=evaluator_llm, embeddings=embeddings)
        # Ship to your metrics store:
        await metrics.record("ragas.faithfulness",     scores["faithfulness"],     tags={"session": session_id})
        await metrics.record("ragas.answer_relevancy", scores["answer_relevancy"], tags={"session": session_id})
    except Exception as e:
        log.warning("ragas_eval_failed", error=str(e))  # never fail the user request`;

const CODE_SCORE_DRIFT = `# Score drift detection — alert when RAGAS scores degrade over time

from collections import deque
import statistics

class RagasScoreTracker:
    def __init__(self, window=200, alert_threshold=0.05):
        self.window    = deque(maxlen=window)
        self.threshold = alert_threshold
        self.baseline  = None

    def record(self, scores: dict):
        self.window.append(scores)
        if len(self.window) == self.window.maxlen and self.baseline is None:
            # Set baseline from first full window
            self.baseline = {k: statistics.mean(s[k] for s in self.window) for k in scores}

    def check_drift(self) -> list[str]:
        if self.baseline is None or len(self.window) < 50:
            return []

        recent = {k: statistics.mean(s[k] for s in list(self.window)[-50:])
                  for k in self.baseline}
        alerts = []
        for metric, baseline_val in self.baseline.items():
            drop = baseline_val - recent.get(metric, baseline_val)
            if drop > self.threshold:
                alerts.append(f"{metric} dropped by {drop:.3f} (baseline {baseline_val:.2f} → now {recent[metric]:.2f})")
        return alerts

tracker = RagasScoreTracker(window=200, alert_threshold=0.05)
# In your async eval callback:
# tracker.record(scores)
# if alerts := tracker.check_drift():
#     pagerduty.alert(f"RAGAS degradation: {alerts}")`;

// ── §44.7 Cost & model choice ─────────────────────────────────────────────
const CODE_COST_CHOICE = `# RAGAS judge model choice matters for cost AND score validity

# Option 1: OpenAI gpt-4o-mini (recommended default)
from langchain_openai import ChatOpenAI
evaluator_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
# Cost: ~$0.15 per 50-sample eval | Quality: good for most cases

# Option 2: Anthropic Claude Haiku (faster, cheaper)
from langchain_anthropic import ChatAnthropic
evaluator_llm = ChatAnthropic(model="claude-haiku-4-5-20251001", temperature=0)
# Cost: ~$0.08 per 50-sample eval | Note: validate vs gpt-4o-mini scores first

# Option 3: Local model via Ollama (zero cost, slower)
from langchain_ollama import ChatOllama
evaluator_llm = ChatOllama(model="llama3.1:8b", temperature=0)
# Cost: $0 | Quality: noticeably lower; use for rapid iteration only

# Cost estimation formula:
# cost = n_samples × avg_tokens_per_metric × n_metrics × price_per_1k_tokens
# 50 samples × 800 tokens × 4 metrics × $0.00015/1k = $0.024
# Always run a 5-sample smoke test first to calibrate:
# evaluate(EvaluationDataset(samples[:5]), metrics=[Faithfulness()], ...)`;

export function Mod44() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Explain what each RAGAS metric measures and which failure mode it catches</li>
          <li>Build evaluation datasets from production traces and synthetic generation</li>
          <li>Run RAGAS and interpret per-sample scores to pinpoint retriever vs generator failures</li>
          <li>Use RAGAS to run chunk size, overlap, k, and retrieval strategy sweeps</li>
          <li>Integrate RAGAS into CI/CD to block regressions before they hit production</li>
          <li>Run async sampling-based evaluation on live traffic without blocking responses</li>
          <li>Detect score drift and configure metric-based alerting</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~90 minutes</span>
          <span className="obj-diff">Difficulty: ★★★☆☆</span>
          <span className="obj-diff">Prerequisites: Module 29 (RAG Architectures), Module 30 (RAG Optimisation)</span>
        </div>
      </div>

      <div className="callout callout-info">
        <strong>Why evaluation is the hardest part of RAG</strong>
        A RAG pipeline has two independent quality axes: <strong>retriever quality</strong> (are the right chunks fetched?) and <strong>generator quality</strong> (does the LLM use those chunks faithfully?). They fail independently. A great retriever paired with a hallucinating LLM produces confident wrong answers. A faithful LLM paired with a poor retriever produces accurate summaries of the wrong information. Unit tests don't catch either. RAGAS gives you a metric per axis.
      </div>

      <div className="callout callout-info">
        <strong>Housing.com Upgrade Context</strong><br />
        Housing.com's current system has no automated measurement of retrieval quality — teams rely on manual spot-checks and
        thumbs-up/thumbs-down signals. Adding RAGAS gives you per-sprint faithfulness and context precision scores, making the
        property data pipeline's quality visible and improvable. This directly closes the "we don't know if the LLM is making
        things up" risk identified in production.
      </div>

      <RAGASDashboard />

      <h2>44.1 What is RAGAS?</h2>
      <p><strong>RAGAS</strong> (Retrieval-Augmented Generation Assessment) is an open-source evaluation framework for RAG pipelines. It was introduced in the 2023 paper "RAGAS: Automated Evaluation of Retrieval Augmented Generation" (Es et al., arXiv:2309.15217).</p>

      <p>The key insight: most RAG evaluation metrics are <strong>reference-free</strong> for the hardest-to-collect labels. Faithfulness and Answer Relevancy require no ground-truth answers — only the question, retrieved context, and generated answer. This means you can evaluate production traffic without any human labelling.</p>

      <h3>44.1.1 The 5 Core Metrics at a Glance</h3>
      <table>
        <tbody>
          <tr><th>Metric</th><th>Measures</th><th>Catches</th><th>Needs ground_truth?</th></tr>
          <tr><td><strong>Context Precision</strong></td><td>Fraction of retrieved chunks that are relevant</td><td>Retriever noise / junk chunks</td><td>No (LLM judge)</td></tr>
          <tr><td><strong>Context Recall</strong></td><td>Fraction of ground truth claims covered by retrieved chunks</td><td>Retriever missing key info</td><td>Yes</td></tr>
          <tr><td><strong>Faithfulness</strong></td><td>Fraction of answer claims supported by retrieved context</td><td>LLM hallucination</td><td>No</td></tr>
          <tr><td><strong>Answer Relevancy</strong></td><td>Does the answer address the question?</td><td>Off-topic or vague answers</td><td>No</td></tr>
          <tr><td><strong>Answer Correctness</strong></td><td>Factual correctness of the answer</td><td>Wrong facts</td><td>Yes</td></tr>
        </tbody>
      </table>
      <p>Start with <strong>Faithfulness + Context Precision + Context Recall</strong> — the three-metric minimum that covers both retriever and generator axes without requiring ground truth for two of the three.</p>

      <h3>44.1.2 Installation</h3>
      <CodeBlock title="RAGAS Installation" language="bash" keyLine={1} keyNote="Any LangChain-compatible LLM works as judge">{CODE_INSTALL}</CodeBlock>

      <h2>44.2 Running Your First Evaluation</h2>
      <h3>44.2.1 Build an EvaluationDataset</h3>
      <CodeBlock title="EvaluationDataset with SingleTurnSample" language="python" keyLine={9} keyNote="Each sample requires question, contexts, response, reference">{CODE_DATASET}</CodeBlock>

      <h3>44.2.2 Run evaluate()</h3>
      <CodeBlock title="Running RAGAS evaluate()" language="python" keyLine={7} keyNote="temperature=0 ensures reproducible judge scores">{CODE_RUN_BASIC}</CodeBlock>
      <div className="callout callout-warn">
        <strong>Interpreting scores — what's "good"?</strong>
        <table style={{fontSize: "12px", margin: "4px 0"}}>
          <tbody>
            <tr><th>Score</th><th>Faithfulness</th><th>Context Precision</th><th>Context Recall</th></tr>
            <tr><td>&gt; 0.90</td><td>Production-ready</td><td>Excellent signal-to-noise</td><td>Nearly complete coverage</td></tr>
            <tr><td>0.75–0.90</td><td>Acceptable; monitor</td><td>Some junk chunks — reduce k</td><td>Missing some ground truth</td></tr>
            <tr><td>0.60–0.75</td><td>Hallucination problem</td><td>Noisy retriever — tune chunking</td><td>Chunk size too small</td></tr>
            <tr><td>&lt; 0.60</td><td>Do not ship</td><td>Retriever broken or misconfigured</td><td>Corpus incomplete</td></tr>
          </tbody>
        </table>
        These thresholds are <em>starting points</em>. Your domain establishes the baseline — set thresholds from your first clean evaluation, then alert on drops of &gt; 0.05 from that baseline.
      </div>

      <h2>44.3 How Each Metric Works Internally</h2>
      <p>Every RAGAS metric uses an LLM internally. Understanding the prompting logic helps you debug unexpected scores and choose the right judge model.</p>

      <FaithfulnessViz />

      <h3>44.3.1 Faithfulness — Claim Extraction + NLI</h3>
      <CodeBlock title="Faithfulness Score: Claim Extraction Walkthrough" language="python" keyLine={18} keyNote="score = supported / total — every unsupported claim penalises">{CODE_FAITHFULNESS_INTERNALS}</CodeBlock>

      <ContextPrecisionViz />

      <h3>44.3.2 Context Precision — Average Precision@k</h3>
      <CodeBlock title="Context Precision: Average Precision@k Walkthrough" language="python" keyLine={16} keyNote="AP averages precision only at positions of relevant chunks">{CODE_CONTEXT_PRECISION_INTERNALS}</CodeBlock>

      <h3>44.3.3 Answer Relevancy — Reverse-Question Similarity</h3>
      <CodeBlock title="Answer Relevancy: Reverse-Question Cosine Similarity" language="python" keyLine={11} keyNote="LLM reverse-engineers questions — no reference answer needed">{CODE_ANSWER_RELEVANCY_INTERNALS}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Why Answer Relevancy is reference-free (the clever part)</strong>
        Most NLP evaluation metrics require a reference answer to compare against. RAGAS Answer Relevancy sidesteps this by inverting the question: instead of "is this answer correct?", it asks "what question would this answer be a good response to?" — and checks how close that reverse-question is to the original. This means you can compute it on any production response without ever having a human write a reference answer.
      </div>

      <h2>44.4 Building Evaluation Datasets</h2>

      <h3>44.4.1 From Production Traces (highest value)</h3>
      <p>Real user queries are the most representative test cases. Pull them from LangSmith production traces:</p>
      <CodeBlock title="Building Eval Dataset from LangSmith Production Traces" language="python" keyLine={14} keyNote="execution_order=1 fetches only top-level runs, not child spans">{CODE_DATASET_FROM_TRACES}</CodeBlock>

      <h3>44.4.2 Synthetic Generation (when you have docs but no queries)</h3>
      <p>RAGAS's <code>TestsetGenerator</code> uses an LLM to synthesise Q&A pairs from your corpus — useful for day-0 evaluation before you have production traffic:</p>
      <CodeBlock title="Synthetic Dataset Generation with TestsetGenerator" language="python" keyLine={14} keyNote="distributions mix factual, reasoning, multi-context difficulty levels">{CODE_SYNTHETIC_DATASET}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Golden set evolution strategy</strong>
        Start with 20 synthetic samples (fast, $0.50 cost). After 2 weeks of production, pull 50 real queries and hand-label 20 as golden examples (correct answer written by a domain expert). Your eval dataset should grow to ~100 samples with a mix of: (a) synthetic for breadth, (b) production failures you fixed (regression prevention), (c) edge cases users actually hit. Aim to update it monthly. Store in LangSmith datasets for version control.
      </div>

      <h2>44.5 Tuning Your RAG Pipeline with RAGAS</h2>

      <h3>44.5.1 Chunk Size and Overlap Sweep</h3>
      <p>The most impactful single parameter in a RAG pipeline. Run a systematic sweep before committing to a chunk size:</p>
      <CodeBlock title="Chunk Size and Overlap Sweep" language="python" keyLine={5} keyNote="Sweep chunk_size x overlap to find faithfulness/recall crossover">{CODE_CHUNK_SWEEP}</CodeBlock>

      <h3>44.5.2 Retrieval Strategy Sweep (k and MMR)</h3>
      <CodeBlock title="Retrieval Strategy Sweep: k and MMR" language="python" keyLine={4} keyNote="MMR lambda_mult controls diversity vs relevance tradeoff">{CODE_K_SWEEP}</CodeBlock>
      <div className="callout callout-info">
        <strong>Typical sweep findings — what the numbers actually tell you</strong>
        <ul style={{fontSize: "12px", margin: "4px 0"}}>
          <li><strong>Faithfulness goes up with smaller chunks</strong> — smaller chunks mean less irrelevant text in the context window; the LLM makes fewer unsupported claims</li>
          <li><strong>Context Recall goes down with smaller chunks</strong> — small chunks split sentences that need to be together; multi-sentence answers require multiple chunks retrieved</li>
          <li><strong>The faithfulness/recall crossover</strong> — the optimal chunk size is where this tradeoff meets your requirements: high-stakes (mortgage advice → maximise faithfulness), broad discovery (area guide → maximise recall)</li>
          <li><strong>MMR beats similarity for multi-topic questions</strong> — "compare Bandra and Powai prices" needs chunks from both; similarity returns 5 Bandra chunks; MMR diversifies</li>
        </ul>
      </div>

      <h2>44.6 CI/CD Integration — Block Regressions Before They Ship</h2>

      <h3>44.6.1 Python evaluation script</h3>
      <CodeBlock title="CI Evaluation Script — PR Threshold Gate" language="python" keyLine={36} keyNote="sys.exit(1) on threshold failure blocks the PR merge">{CODE_CI_EVAL}</CodeBlock>

      <h3>44.6.2 GitHub Actions workflow</h3>
      <CodeBlock title="GitHub Actions — RAGAS Eval on PR" language="yaml" keyLine={8} keyNote="paths: filter runs eval only on RAG/prompt changes, not every commit">{CODE_CI_YAML}</CodeBlock>

      <h2>44.7 Production: Async Sampling Evaluation</h2>
      <p>You cannot run RAGAS on every production request — each evaluation call costs ~3–5 LLM calls per metric. Sample 1–5% of traffic and evaluate asynchronously:</p>
      <CodeBlock title="Async Production RAGAS Sampling" language="python" keyLine={9} keyNote="asyncio.create_task fires eval without blocking user response">{CODE_ASYNC_MONITORING}</CodeBlock>

      <h3>44.7.1 Score Drift Detection</h3>
      <CodeBlock title="RAGAS Score Drift Tracker" language="python" keyLine={8} keyNote="Baseline set from first full window; drop > threshold triggers alert">{CODE_SCORE_DRIFT}</CodeBlock>

      <h2>44.8 Model Choice and Cost</h2>
      <CodeBlock title="RAGAS Judge Model Options and Cost" language="python" keyLine={12} keyNote="Switching judge models mid-project shifts scores by 0.05–0.15">{CODE_COST_CHOICE}</CodeBlock>
      <table>
        <tbody>
          <tr><th>Judge Model</th><th>Cost/50 samples</th><th>Latency</th><th>Score quality</th><th>Use when</th></tr>
          <tr><td>gpt-4o-mini</td><td>~$0.15</td><td>~30s</td><td>High</td><td>CI/CD, production monitoring</td></tr>
          <tr><td>claude-haiku-4-5</td><td>~$0.08</td><td>~20s</td><td>High</td><td>Faster CI runs; validate scores match gpt-4o-mini first</td></tr>
          <tr><td>gpt-4o</td><td>~$1.50</td><td>~60s</td><td>Very high</td><td>High-stakes final validation; building ground truth labels</td></tr>
          <tr><td>llama3.1:8b (local)</td><td>$0</td><td>~120s</td><td>Medium</td><td>Local dev iteration, never production gates</td></tr>
        </tbody>
      </table>
      <div className="callout callout-warn">
        <strong>The judge-model calibration gotcha</strong>
        RAGAS scores are not absolute — they depend on the judge model's interpretation. Switching judge models mid-project can shift scores by 0.05–0.15 without any real change in your pipeline. Always use the same judge model for all runs in a comparison. When you do switch judge models (e.g. to save cost), re-baseline by running the new model on your last 3 historical eval sets and verifying the rank order of runs is preserved.
      </div>

      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection</strong>
        "How do you know your RAG pipeline is working?" → RAGAS gives you a per-axis answer: Faithfulness catches LLM hallucination (generator axis), Context Precision/Recall catches retriever failures (retrieval axis). Production strategy: async sampling at 2–5% of traffic → metrics to monitoring → alert on &gt;0.05 drop from baseline. CI/CD strategy: 50-sample golden set → threshold gates on PR → blocks regressions before they reach users. The complete answer names both axes, production and CI/CD integration, and the cost tradeoff for judge model selection.
      </div>

      <QuizSection moduleId={33} title="Module 33: RAGAS — The RAG Evaluation Framework" contentHint="Context Precision signal-to-noise retrieval AP@k, Context Recall coverage needs ground truth, Faithfulness hallucination claim extraction NLI LLM judge, Answer Relevancy reference-free reverse question cosine similarity, Answer Correctness needs ground truth, EvaluationDataset SingleTurnSample structure, production trace dataset from LangSmith, synthetic TestsetGenerator, chunk size sweep faithfulness vs recall tradeoff, MMR diversity for multi-topic, CI/CD threshold gates sys.exit non-zero, async sampling 2-5 percent fire and forget, score drift window baseline alert 0.05, judge model calibration consistency" />
    </>
  );
}
