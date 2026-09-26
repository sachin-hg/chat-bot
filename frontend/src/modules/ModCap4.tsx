import { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { QuizSection } from "../components/QuizSection";

const STARTER_CODE = `import os, chromadb, anthropic
from ragas import evaluate
from ragas.metrics import faithfulness, context_precision, answer_relevancy
from datasets import Dataset

# ── Mock Housing.com property dataset ───────────────────────────────────────
LISTINGS = [
    {"id": "prop_001", "text": "3BHK flat in Bandra West, 1200 sqft, ₹3.2Cr. Sea view. RERA: MH/MUM/2024/001234. Builder: Lodha Group. Amenities: gym, pool, 24hr security. Possession: Dec 2025."},
    {"id": "prop_002", "text": "2BHK apartment in Powai, 850 sqft, ₹1.45Cr. Near Hiranandani. RERA: MH/MUM/2024/005678. Builder: Hiranandani Developers. Pet-friendly, covered parking, metro access."},
    {"id": "prop_003", "text": "4BHK villa in Whitefield Bangalore, 2800 sqft, ₹2.8Cr. RERA: KA/BLR/2024/008910. Gated community, 3 covered parking, club house. Possession: Ready to move."},
    {"id": "prop_004", "text": "1BHK studio in Andheri East, 480 sqft, ₹78L. RERA: MH/MUM/2023/002345. Near metro station. Builder: Godrej Properties. Suitable for investment or first-home buyers."},
    {"id": "prop_005", "text": "3BHK penthouse in Juhu, 2100 sqft, ₹8.5Cr. RERA: MH/MUM/2024/009012. Terrace garden, private lift, sea-facing. Builder: Oberoi Realty. Luxury amenities."},
]

# ── ChromaDB vector store setup ──────────────────────────────────────────────
chroma_client = chromadb.EphemeralClient()
collection = chroma_client.create_collection("housing_listings")
collection.add(
    ids=[l["id"] for l in LISTINGS],
    documents=[l["text"] for l in LISTINGS],
)

# ── Retrieval + generation ───────────────────────────────────────────────────
anthropic_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

def answer_property_query(query: str, k: int = 2) -> dict:
    results = collection.query(query_texts=[query], n_results=k)
    contexts = results["documents"][0]
    context_str = "\\n\\n".join(contexts)
    response = anthropic_client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        system="You are a Housing.com property search assistant. Answer using ONLY the provided context. Always cite the RERA ID if mentioned.",
        messages=[{"role": "user", "content": f"Context:\\n{context_str}\\n\\nQuestion: {query}"}],
    )
    return {"answer": response.content[0].text, "contexts": contexts, "question": query}

# ── Run a sample evaluation set ─────────────────────────────────────────────
EVAL_QUESTIONS = [
    "Is there a 2BHK flat near a metro station under 1.5Cr?",
    "Show me RERA-registered sea-view properties in Mumbai.",
    "What 3BHK options are available under 4Cr?",
]
rows = [answer_property_query(q) for q in EVAL_QUESTIONS]
dataset = Dataset.from_list([
    {"question": r["question"], "answer": r["answer"],
     "contexts": r["contexts"], "ground_truth": ""}
    for r in rows
])
result = evaluate(dataset, metrics=[faithfulness, context_precision, answer_relevancy])
print(result)`;

const CI_GATE_CODE = `# ci_rag_gate.py — add to GitHub Actions / pre-merge CI
import sys
from your_rag_module import run_ragas_eval

results = run_ragas_eval()

THRESHOLDS = {
    "faithfulness":        0.80,
    "context_precision":   0.75,
    "answer_relevancy":    0.78,
}
failed = []
for metric, threshold in THRESHOLDS.items():
    score = results[metric]
    status = "✓" if score >= threshold else "✗"
    print(f"{status}  {metric}: {score:.3f}  (threshold: {threshold})")
    if score < threshold:
        failed.append(metric)

if failed:
    print(f"\\nCI GATE FAILED — {failed} below threshold. Blocking merge.")
    sys.exit(1)
print("\\nAll RAGAS gates passed. Safe to merge.")`;

// ── RAGASGauge: individual semicircle arc gauge ───────────────────────────────
interface RAGASGaugeProps {
  label: string;
  threshold: number;
  unit?: string;
  maxValue?: number;
}

function RAGASGauge({ label, threshold, unit = "", maxValue = 1 }: RAGASGaugeProps) {
  const [userScore, setUserScore] = useState("");

  const parsed = parseFloat(userScore) || 0;
  const hasValue = userScore.trim() !== "";
  const passed = hasValue ? parsed >= threshold : null;

  // Semicircle arc params: r=54, cx=80, cy=80
  // Arc goes from 180° (left) to 0° (right) — the top half as a "U" shape
  // We use a bottom-open semicircle: from 210° to 330° (wider) — actually
  // use standard bottom semicircle from -210deg to 30deg (i.e. 150deg sweep from left)
  // Simpler: use a half-circle path from left to right through the top
  const R = 54;
  const CX = 80;
  const CY = 78; // slightly lower to leave room for text in center
  const TOTAL_ARC = Math.PI; // semicircle: 180°

  // Arc from left (180°) to right (0°) through top
  // start = (-1, 0) relative, end = (1, 0) relative
  const startAngle = Math.PI;   // 180° = left
  const endAngle = 0;           // 0°   = right

  // For a given pct (0..1), the angle along the arc from left to right (counterclockwise through top)
  // angle goes from Math.PI down to 0
  const pct = hasValue ? Math.min(1, Math.max(0, parsed / maxValue)) : 0;
  const thresholdPct = Math.min(1, threshold / maxValue);

  // Helper: angle on arc (left=0%, right=100%)
  const angleAt = (p: number) => Math.PI - p * Math.PI; // goes from PI to 0

  // SVG arc path: semicircle background
  const describeArc = (startPct: number, endPct: number) => {
    const a1 = angleAt(startPct);
    const a2 = angleAt(endPct);
    const x1 = CX + R * Math.cos(a1);
    const y1 = CY - R * Math.sin(a1); // SVG y is inverted
    const x2 = CX + R * Math.cos(a2);
    const y2 = CY - R * Math.sin(a2);
    const largeArc = endPct - startPct > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 0 ${x2} ${y2}`;
  };

  // Threshold tick position
  const thresholdAngleRad = angleAt(thresholdPct);
  const tickX = CX + R * Math.cos(thresholdAngleRad);
  const tickY = CY - R * Math.sin(thresholdAngleRad);
  // Tick line: short radial segment
  const innerR = R - 8;
  const outerR = R + 8;
  const tickX1 = CX + innerR * Math.cos(thresholdAngleRad);
  const tickY1 = CY - innerR * Math.sin(thresholdAngleRad);
  const tickX2 = CX + outerR * Math.cos(thresholdAngleRad);
  const tickY2 = CY - outerR * Math.sin(thresholdAngleRad);

  const arcColor = passed === null
    ? "var(--accent3)"
    : passed
      ? "var(--accent2)"
      : "var(--accent3)";

  const inputBorderColor = passed === null
    ? "var(--border)"
    : passed
      ? "#3fb950"
      : "#f97583";

  const displayValue = hasValue
    ? (unit === "ms" ? String(Math.round(parsed)) : parsed.toFixed(2))
    : "—";

  const svgW = 160;
  const svgH = 110;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
        {/* Background arc */}
        <path
          d={describeArc(0, 1)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* Value arc */}
        {pct > 0 && (
          <path
            d={describeArc(0, pct)}
            fill="none"
            stroke={arcColor}
            strokeWidth={12}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.5s ease, stroke 0.3s ease" }}
          />
        )}
        {/* Threshold gold tick */}
        <line
          x1={tickX1} y1={tickY1}
          x2={tickX2} y2={tickY2}
          stroke="#f9e2af"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={tickX} cy={tickY} r={4} fill="#f9e2af" />
        {/* Center value text */}
        <text
          x={CX}
          y={CY + 6}
          textAnchor="middle"
          fontSize="18"
          fontWeight="800"
          fontFamily="monospace"
          fill={passed === null ? "var(--muted)" : arcColor}
        >
          {displayValue}
        </text>
        {/* Unit sub-label */}
        {unit && (
          <text x={CX} y={CY + 22} textAnchor="middle" fontSize="10" fill="var(--muted)">
            {unit}
          </text>
        )}
        {/* Pass checkmark */}
        {passed === true && (
          <text x={CX + 20} y={CY + 6} textAnchor="middle" fontSize="14" fill="var(--accent2)">
            ✓
          </text>
        )}
      </svg>

      {/* Label */}
      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", textAlign: "center", letterSpacing: "0.02em" }}>
        {label}
      </div>

      {/* Target line */}
      <div style={{ fontSize: "10px", color: "var(--muted)", textAlign: "center" }}>
        Target: {unit === "ms" ? `< ${threshold}` : `>= ${threshold}`}{unit}
      </div>

      {/* Input */}
      <input
        type="number"
        placeholder="Enter your score"
        step={unit === "ms" ? 10 : 0.01}
        value={userScore}
        onChange={e => setUserScore(e.target.value)}
        style={{
          width: "100%",
          background: "var(--bg)",
          border: `1.5px solid ${inputBorderColor}`,
          borderRadius: "6px",
          padding: "5px 10px",
          color: "var(--text)",
          fontSize: "13px",
          fontFamily: "monospace",
          textAlign: "center",
          outline: "none",
          transition: "border-color 0.3s ease",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

// ── Gauge grid wrapper with "all green" banner ────────────────────────────────
function RAGASGaugeGrid() {
  // Track individual scores externally so we can compute "all pass" state
  const [scores, setScores] = useState({
    faithfulness: "",
    contextPrecision: "",
    answerRelevancy: "",
    p95: "",
  });

  const criteria = [
    { key: "faithfulness"    as const, label: "Faithfulness",      threshold: 0.80, unit: "",   maxValue: 1   },
    { key: "contextPrecision"as const, label: "Context Precision", threshold: 0.75, unit: "",   maxValue: 1   },
    { key: "answerRelevancy" as const, label: "Answer Relevancy",  threshold: 0.78, unit: "",   maxValue: 1   },
    { key: "p95"             as const, label: "p95 Latency",       threshold: 200,  unit: "ms", maxValue: 500 },
  ];

  const allGreen = criteria.every(c => {
    const v = parseFloat(scores[c.key]);
    if (isNaN(v) || scores[c.key].trim() === "") return false;
    return c.unit === "ms" ? v <= c.threshold : v >= c.threshold;
  });

  return (
    <div style={{
      background: "var(--bg2)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)",
      padding: "24px",
      margin: "24px 0",
    }}>
      <div style={{
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: ".07em",
        color: "var(--muted)",
        marginBottom: "20px",
      }}>
        Enter your RAGAS scores to check your acceptance criteria
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
        marginBottom: "20px",
      }}>
        {criteria.map(c => (
          // Wrap each gauge and intercept onChange via a surrounding div with a hidden input mirror
          // Since RAGASGauge manages its own state, we replicate the score tracking here with a wrapper
          <GaugeWithTracking
            key={c.key}
            label={c.label}
            threshold={c.threshold}
            unit={c.unit}
            maxValue={c.maxValue}
            onScoreChange={val => setScores(s => ({ ...s, [c.key]: val }))}
          />
        ))}
      </div>

      {/* All-green banner */}
      <div style={{
        padding: "12px 16px",
        borderRadius: "var(--radius-sm)",
        textAlign: "center",
        fontWeight: 700,
        fontSize: "14px",
        background: allGreen ? "rgba(63,185,80,.14)" : "rgba(247,129,102,.07)",
        border: `1px solid ${allGreen ? "var(--accent2)" : "var(--border)"}`,
        color: allGreen ? "var(--accent2)" : "var(--muted)",
        transition: "all 0.4s ease",
      }}>
        {allGreen
          ? "All gauges green — capstone complete. CI gate would pass."
          : "All gauges green = capstone complete"}
      </div>
    </div>
  );
}

// Thin wrapper that owns score state and reports upward
interface GaugeWithTrackingProps extends RAGASGaugeProps {
  onScoreChange: (val: string) => void;
}

function GaugeWithTracking({ label, threshold, unit = "", maxValue = 1, onScoreChange }: GaugeWithTrackingProps) {
  const [userScore, setUserScore] = useState("");

  const handleChange = useCallback((val: string) => {
    setUserScore(val);
    onScoreChange(val);
  }, [onScoreChange]);

  const parsed = parseFloat(userScore) || 0;
  const hasValue = userScore.trim() !== "";
  const passed = hasValue ? (unit === "ms" ? parsed <= threshold : parsed >= threshold) : null;

  const R = 54;
  const CX = 80;
  const CY = 78;

  const pct = hasValue ? Math.min(1, Math.max(0, parsed / maxValue)) : 0;
  const thresholdPct = Math.min(1, threshold / maxValue);

  const angleAt = (p: number) => Math.PI - p * Math.PI;

  const describeArc = (startPct: number, endPct: number) => {
    const a1 = angleAt(startPct);
    const a2 = angleAt(endPct);
    const x1 = CX + R * Math.cos(a1);
    const y1 = CY - R * Math.sin(a1);
    const x2 = CX + R * Math.cos(a2);
    const y2 = CY - R * Math.sin(a2);
    const largeArc = endPct - startPct > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 0 ${x2} ${y2}`;
  };

  const thresholdAngleRad = angleAt(thresholdPct);
  const innerR = R - 8;
  const outerR = R + 8;
  const tickX1 = CX + innerR * Math.cos(thresholdAngleRad);
  const tickY1 = CY - innerR * Math.sin(thresholdAngleRad);
  const tickX2 = CX + outerR * Math.cos(thresholdAngleRad);
  const tickY2 = CY - outerR * Math.sin(thresholdAngleRad);
  const tickX = CX + R * Math.cos(thresholdAngleRad);
  const tickY = CY - R * Math.sin(thresholdAngleRad);

  const arcColor = passed === null
    ? "var(--accent3)"
    : passed
      ? "var(--accent2)"
      : "var(--accent3)";

  const inputBorderColor = !hasValue
    ? "var(--border)"
    : passed
      ? "#3fb950"
      : "#f97583";

  const displayValue = hasValue
    ? (unit === "ms" ? String(Math.round(parsed)) : parsed.toFixed(2))
    : "—";

  const svgW = 160;
  const svgH = 110;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
        {/* Background arc */}
        <path
          d={describeArc(0, 1)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* Value arc */}
        {pct > 0 && (
          <path
            d={describeArc(0, pct)}
            fill="none"
            stroke={arcColor}
            strokeWidth={12}
            strokeLinecap="round"
            style={{ transition: "stroke 0.3s ease" }}
          />
        )}
        {/* Threshold gold tick */}
        <line
          x1={tickX1} y1={tickY1}
          x2={tickX2} y2={tickY2}
          stroke="#f9e2af"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={tickX} cy={tickY} r={4} fill="#f9e2af" />
        {/* Center value */}
        <text
          x={CX}
          y={CY + 6}
          textAnchor="middle"
          fontSize="18"
          fontWeight="800"
          fontFamily="monospace"
          fill={!hasValue ? "var(--muted)" : arcColor}
        >
          {displayValue}
        </text>
        {unit && (
          <text x={CX} y={CY + 22} textAnchor="middle" fontSize="10" fill="var(--muted)">
            {unit}
          </text>
        )}
        {passed === true && (
          <text x={CX + 22} y={CY + 6} textAnchor="middle" fontSize="14" fill="var(--accent2)">
            ✓
          </text>
        )}
      </svg>

      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", textAlign: "center" }}>
        {label}
      </div>
      <div style={{ fontSize: "10px", color: "var(--muted)", textAlign: "center" }}>
        Target: {unit === "ms" ? `< ${threshold}` : `>= ${threshold}`}{unit}
      </div>

      <input
        type="number"
        placeholder="Enter your score"
        step={unit === "ms" ? 10 : 0.01}
        value={userScore}
        onChange={e => handleChange(e.target.value)}
        style={{
          width: "100%",
          background: "var(--bg)",
          border: `1.5px solid ${inputBorderColor}`,
          borderRadius: "6px",
          padding: "5px 10px",
          color: "var(--text)",
          fontSize: "13px",
          fontFamily: "monospace",
          textAlign: "center",
          outline: "none",
          transition: "border-color 0.3s ease",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

// ── Monaco tabbed code editor ─────────────────────────────────────────────────
function TabbedCodeEditor() {
  const [activeTab, setActiveTab] = useState<"starter" | "ci">("starter");
  const [copied, setCopied] = useState(false);

  const tabs = [
    { id: "starter" as const, label: "property_rag.py", language: "python", code: STARTER_CODE },
    { id: "ci"      as const, label: "ci_gate.yml",     language: "yaml",   code: CI_GATE_CODE },
  ];

  const currentTab = tabs.find(t => t.id === activeTab)!;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentTab.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = currentTab.code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleDownloadAll = () => {
    tabs.forEach(tab => {
      const blob = new Blob([tab.code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = tab.label;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)",
      overflow: "hidden",
      margin: "16px 0",
    }}>
      {/* Tab bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        background: "var(--bg2)",
        borderBottom: "1px solid var(--border)",
        padding: "0 8px",
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? "var(--bg3, #1e1e1e)" : "var(--bg2)",
              color: activeTab === tab.id ? "var(--text)" : "var(--muted)",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid var(--accent1, #7c5cfc)" : "2px solid transparent",
              padding: "8px 16px",
              fontSize: "12px",
              fontFamily: "monospace",
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: "pointer",
              outline: "none",
              transition: "all 0.15s ease",
              marginRight: "2px",
            }}
          >
            {tab.label}
          </button>
        ))}

        {/* Spacer + action buttons */}
        <div style={{ flex: 1 }} />
        <button
          onClick={handleCopy}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            color: copied ? "var(--accent2)" : "var(--muted)",
            fontSize: "11px",
            fontFamily: "monospace",
            padding: "4px 10px",
            cursor: "pointer",
            marginRight: "6px",
            transition: "color 0.2s",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          onClick={handleDownloadAll}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            color: "var(--muted)",
            fontSize: "11px",
            fontFamily: "monospace",
            padding: "4px 10px",
            cursor: "pointer",
            marginRight: "4px",
          }}
        >
          Download all
        </button>
      </div>

      {/* Monaco editor */}
      <Editor
        height="400px"
        language={activeTab === "ci" ? "yaml" : "python"}
        value={currentTab.code}
        theme="vs-dark"
        options={{
          readOnly: false,
          minimap: { enabled: false },
          fontSize: 13,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          lineNumbers: "on",
          renderLineHighlight: "line",
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
}

export function ModCap4() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this capstone you will be able to</div>
        <ol>
          <li>Build a complete RAG pipeline on domain-specific data using ChromaDB and the Anthropic API</li>
          <li>Evaluate it with RAGAS across faithfulness, context precision, and answer relevancy</li>
          <li>Write a CI acceptance gate that blocks merges below threshold</li>
          <li>Document a chunking strategy with ablation results (L5) and explain GraphRAG hybrid trade-offs (L6)</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~3–6 hours</span>
          <span className="obj-diff">Difficulty: ★★★★☆</span>
          <span className="obj-diff">Prerequisites: Act 4 (Modules 28–45)</span>
        </div>
      </div>

      <div className="callout callout-info">
        <strong>Act 4 Capstone</strong> — This project synthesises the full Act 4 toolkit: vector databases, RAG pipeline architectures, chunking strategies, RAGAS evaluation, and optional GraphRAG. Complete it before Act 5 interviews.
      </div>

      <h2>Project Brief</h2>
      <p>Housing.com's search team wants to answer natural-language property queries against a catalogue of listings. Your task: build a production-ready RAG layer that retrieves relevant listings and generates accurate, grounded responses — then prove it meets the acceptance criteria using RAGAS.</p>
      <p>Work with the 5-listing mock dataset in the starter code. For L5/L6, extend to 50–500 listings (or use a real Housing.com export).</p>

      <h2>Acceptance Criteria</h2>

      {/* Gauge cards in a 2×2 or 4-column grid */}
      <RAGASGaugeGrid />

      <h2>Grading Rubric</h2>
      <table>
        <tbody>
          <tr><th>Level</th><th>Requirements</th></tr>
          <tr>
            <td><strong>L4 — Pass</strong></td>
            <td>All 4 acceptance criteria met on the 5-listing starter dataset. CI gate script exits 0. Written explanation of why you chose your chunk size (even for 5 listings this reasoning matters).</td>
          </tr>
          <tr>
            <td><strong>L5 — Strong</strong></td>
            <td>All criteria met on ≥50 listings. Ablation table showing RAGAS scores at chunk sizes 256 / 512 / 1024 tokens. Choice of chunking strategy (fixed / semantic / document-aware) documented with justification. Latency measured with <code>time.perf_counter()</code>, reported as p50/p95 across 20 queries.</td>
          </tr>
          <tr>
            <td><strong>L6 — Exceptional</strong></td>
            <td>L5 requirements plus: GraphRAG hybrid (entity graph for builder + locality relationships, vector for listing text), cost-per-query analysis (tokens × $/token at Haiku rates), one-page write-up comparing naive RAG vs GraphRAG on faithfulness and context precision, identifying at least one failure mode of each.</td>
          </tr>
        </tbody>
      </table>

      <div className="callout callout-warn">
        <strong>Common failure modes to fix</strong>
        <ul style={{marginTop:'6px'}}>
          <li><strong>Low faithfulness:</strong> LLM adding information not in chunks — tighten system prompt ("use ONLY the provided context"), increase k, or use contextual retrieval.</li>
          <li><strong>Low context_precision:</strong> Retriever pulling irrelevant chunks — try BM25 + vector hybrid search, or query expansion before embedding.</li>
          <li><strong>Low answer_relevancy:</strong> Correct facts but wrong framing — add few-shot examples in the system prompt that model the expected response structure.</li>
          <li><strong>p95 latency over 200ms:</strong> Cache embeddings (ChromaDB PersistentClient), use Haiku not Sonnet, pre-warm the collection at app startup, batch queries.</li>
        </ul>
      </div>

      <h2>Starter Code</h2>
      <p>This 45-line script covers ingestion, retrieval, generation, and RAGAS evaluation. Extend it to meet your target rubric level.</p>

      <TabbedCodeEditor />

      <div className="callout callout-tip">
        <strong>Dependencies</strong>
        <pre style={{margin:'8px 0 0',fontSize:'0.82rem'}}><code className="language-bash">{`pip install chromadb anthropic ragas datasets`}</code></pre>
        Set <code>ANTHROPIC_API_KEY</code>. RAGAS uses an LLM-as-judge internally — point it at Claude via the <code>RAGAS_LLM</code> environment variable or configure the <code>LangchainLLMWrapper</code> in your eval script.
      </div>

      <div className="callout callout-info">
        <strong>GitHub Actions wiring (optional)</strong>
        <pre style={{margin:'8px 0 0',fontSize:'0.82rem'}}><code className="language-yaml">{`# .github/workflows/rag-gate.yml
name: RAG Quality Gate
on: [pull_request]
jobs:
  ragas:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install chromadb anthropic ragas datasets
      - run: python ci_rag_gate.py
        env:
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}`}</code></pre>
      </div>

      <h2>Extension Ideas</h2>
      <table>
        <tbody>
          <tr><th>Extension</th><th>Why it matters</th><th>Relevant module</th></tr>
          <tr><td>Contextual retrieval</td><td>Prepend chunk-specific context before embedding (Anthropic reports 49% fewer retrieval failures)</td><td>Module 50 — A.14 Anthropic Cookbook</td></tr>
          <tr><td>BM25 + vector hybrid</td><td>Keyword matching for RERA IDs, builder names, exact localities</td><td>Module 30 — RAG Optimisation &amp; Chunking</td></tr>
          <tr><td>HyDE query expansion</td><td>Generate a hypothetical answer, embed it, retrieve on that embedding — improves recall for vague queries</td><td>Module 31 — Advanced RAG</td></tr>
          <tr><td>GraphRAG hybrid</td><td>Entity graph for builder → locality → listing relationships; vector for semantic similarity</td><td>Module 32 — Knowledge Graphs &amp; GraphRAG</td></tr>
          <tr><td>SSE streaming responses</td><td>Wire Anthropic streaming API to an SSE endpoint — perceived latency drops even if total time is constant</td><td>Module 10 — Frontend &amp; Streaming</td></tr>
        </tbody>
      </table>

      <div className="callout callout-maang">
        <strong>MAANG interview: "Walk me through how you'd evaluate whether your RAG pipeline is production-ready."</strong><br/>
        <strong>A:</strong> Three layers. (1) <em>Offline metrics</em> — RAGAS faithfulness (≥0.80), context precision (≥0.75), answer relevancy (≥0.78) on a curated eval set of 50–100 question-answer pairs. These catch hallucinations and retrieval failures before they reach users. A CI gate blocks merges below threshold. (2) <em>Latency SLA</em> — p95 end-to-end under 200ms measured under expected load. Pre-warm the vector index; cache embeddings; use Haiku for latency-sensitive paths. (3) <em>Production monitoring</em> — shadow eval on 1% of real traffic using LangSmith online eval, alert if rolling faithfulness drops below 0.75. A pipeline that passes offline RAGAS but fails in production usually has distribution shift between your eval queries and real queries — log real queries, add them to your eval set weekly, re-run the gate. That's the eval flywheel (Module 14).
      </div>

      <QuizSection moduleId={51} title="Act 4 Capstone — Production RAG Layer" contentHint="RAGAS faithfulness 0.80 context_precision 0.75 answer_relevancy 0.78 latency p95 200ms ChromaDB Anthropic Haiku RAG pipeline Housing.com property data RERA acceptance criteria CI gate sys.exit L4 L5 L6 rubric chunk size ablation GraphRAG hybrid BM25 vector HyDE contextual retrieval eval flywheel shadow eval distribution shift online monitoring" />
    </>
  );
}
