import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { CodeBlock } from '../components/CodeBlock'

const CODE_GOLDEN_DATASET = `# golden_dataset.py — 20 question golden set for Housing.com RAGAS sweep
GOLDEN_DATASET = [
    # Tier 1 cities — filter search
    {"question": "Show me 2BHK flats in Bandra under 2Cr",
     "ground_truth": "2BHK flats in Bandra West, Mumbai priced between 1.5Cr and 2Cr include [list]. Key features: sea proximity, metro connectivity."},
    {"question": "3BHK in Powai with parking, below 1.8Cr",
     "ground_truth": "3BHK apartments in Powai, Mumbai under 1.8Cr with dedicated parking include [list]. Powai has good IT sector employment proximity."},
    {"question": "Studio apartment Bangalore Koramangala ready to move",
     "ground_truth": "Ready-to-move studio apartments in Koramangala, Bengaluru are listed at [price range]. RERA registered options include [list]."},
    {"question": "4BHK villa in Gurgaon Sector 57 with swimming pool",
     "ground_truth": "4BHK villas with swimming pool in Gurgaon Sector 57 include [list], priced from [range]. Builder options: [list]."},
    # Tier 2 cities
    {"question": "2BHK flat in Pune Kharadi under 80 lakhs",
     "ground_truth": "2BHK apartments in Kharadi, Pune below 80 lakhs include [list]. Kharadi is close to EON IT Park."},
    {"question": "Plot for sale in Nashik under 30 lakhs",
     "ground_truth": "Residential plots in Nashik below 30 lakhs are available in areas like [list]. RERA registered plots include [list]."},
    {"question": "1BHK in Indore near Palasia Square",
     "ground_truth": "1BHK flats near Palasia Square, Indore are listed at [price range]. Key areas: Palasia, MG Road."},
    # Tier 3 cities
    {"question": "Home loan eligible 2BHK in Patna under 40 lakhs",
     "ground_truth": "Home loan eligible 2BHK flats in Patna under 40 lakhs include [list]. Banks offering home loans in this range: SBI, HDFC."},
    {"question": "Property in Kanpur New City area",
     "ground_truth": "Properties in New City area, Kanpur include [list] with price range [range]."},
    # Semantic / contextual queries
    {"question": "Sea-facing apartment in Mumbai for retirement",
     "ground_truth": "Sea-facing apartments suitable for retirement in Mumbai are concentrated in Worli, Marine Lines, and Juhu. Features to look for: lift, security, low maintenance."},
    {"question": "Investment property near upcoming metro stations",
     "ground_truth": "Properties near planned/upcoming metro stations with high appreciation potential include locations in [list]. Metro corridors expected by [year]."},
    # Multi-condition
    {"question": "RERA registered 3BHK near school and hospital in Noida",
     "ground_truth": "RERA-registered 3BHK in Noida near both schools and hospitals are in Sector 137, 150 [list]. Key builders: [list]."},
    {"question": "Pet-friendly apartment in Hyderabad Jubilee Hills",
     "ground_truth": "Pet-friendly apartments in Jubilee Hills, Hyderabad allow pets per society rules. Options include [list]."},
    # Price/value queries
    {"question": "Most affordable 2BHK in South Mumbai",
     "ground_truth": "The most affordable 2BHK options in South Mumbai are in Dadar and Parel, starting from [price]."},
    {"question": "Luxury penthouse in Delhi NCR above 5Cr",
     "ground_truth": "Penthouse options in Delhi NCR above 5Cr are available in DLF Gurgaon, Greater Kailash Delhi. [list of options]"},
    # Edge cases — no matching properties
    {"question": "2BHK under 10 lakhs in Mumbai",
     "ground_truth": "No 2BHK flats are available in Mumbai under 10 lakhs. The minimum price for 2BHK in Mumbai starts from approximately 50 lakhs in peripheral areas."},
    {"question": "House on the moon",
     "ground_truth": "Housing.com only lists properties in India. No listings are available for off-planet locations."},
    # Hindi transliteration
    {"question": "Mumbai mein 2BHK ghar chahiye 1 crore tak",
     "ground_truth": "Mumbai mein 1 crore tak ke 2BHK ghar [list] mein available hain. Key areas: Borivali, Mira Road, Kandivali."},
    # Protected characteristic (bias test)
    {"question": "Flat available for vegetarians only in Ahmedabad",
     "ground_truth": "Housing.com does not filter properties by dietary preference as this may violate fair housing guidelines. All listed properties are available to eligible buyers. You can filter by price, BHK, and location instead."},
    # General knowledge
    {"question": "What is RERA and why does it matter?",
     "ground_truth": "RERA (Real Estate Regulation and Development Act, 2016) is a law that protects homebuyers by requiring developers to register projects, maintain escrow accounts, and deliver on time. A RERA-registered property has legal backing and buyer protections that unregistered properties do not."},
]`;

const CODE_HARNESS = `# eval_harness.py — RAGAS evaluation harness for the pipeline
import asyncio
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
from datasets import Dataset
import httpx

async def collect_pipeline_responses(golden_set: list[dict], api_url: str) -> list[dict]:
    """Run each golden question through the pipeline and collect responses + contexts."""
    results = []
    async with httpx.AsyncClient(timeout=30.0) as client:
        for item in golden_set:
            # Non-streaming call is simpler for eval
            response = await client.post(f"{api_url}/api/v1/chat/send-message",
                json={"conversation_id": f"eval-{len(results)}",
                      "message_type": "text",
                      "content": {"text": item["question"]}},
                headers={"X-Session-Token": "eval-token"})
            data = response.json()
            results.append({
                "question": item["question"],
                "answer":   data.get("data", {}).get("bot_response", ""),
                "contexts": data.get("data", {}).get("retrieved_chunks", []),  # add this to your pipeline
                "ground_truth": item["ground_truth"],
            })
    return results

def run_ragas_evaluation(results: list[dict]) -> dict:
    ds = Dataset.from_list(results)
    scores = evaluate(
        ds,
        metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
    )
    return scores`;

const CODE_SWEEP = `# sweep.py — chunk size sweep
CHUNK_SIZES = [128, 256, 512, 1024]

async def run_sweep():
    results = {}
    for chunk_size in CHUNK_SIZES:
        print(f"\\n=== Chunk size: {chunk_size} ===")
        # 1. Re-index with this chunk size (your ingestion pipeline)
        await reindex_with_chunk_size(chunk_size)
        # 2. Run eval harness
        pipeline_results = await collect_pipeline_responses(GOLDEN_DATASET, API_URL)
        # 3. Score with RAGAS
        scores = run_ragas_evaluation(pipeline_results)
        results[chunk_size] = scores
        print(f"  faithfulness:      {scores['faithfulness']:.3f}")
        print(f"  answer_relevancy:  {scores['answer_relevancy']:.3f}")
        print(f"  context_precision: {scores['context_precision']:.3f}")
        print(f"  context_recall:    {scores['context_recall']:.3f}")
    return results`;

// ─── FIX 1: RAGAS Results Explorer ───────────────────────────────────────────

type ChunkSize = 128 | 256 | 512 | 1024

interface MetricRow {
  faithfulness: string
  context_precision: string
  answer_relevancy: string
  latency_ms: string
}

type ScoresState = Record<ChunkSize, MetricRow>

const CHUNK_SIZES: ChunkSize[] = [128, 256, 512, 1024]

const emptyRow = (): MetricRow => ({
  faithfulness: '',
  context_precision: '',
  answer_relevancy: '',
  latency_ms: '',
})

const inputStyle: React.CSSProperties = {
  width: 70,
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  padding: 4,
  borderRadius: 4,
  fontSize: 13,
}

function RAGASResultsExplorer() {
  const [scores, setScores] = useState<ScoresState>({
    128: emptyRow(),
    256: emptyRow(),
    512: emptyRow(),
    1024: emptyRow(),
  })
  const [recommendation, setRecommendation] = useState<string | null>(null)

  function handleChange(chunk: ChunkSize, field: keyof MetricRow, value: string) {
    setScores(prev => ({
      ...prev,
      [chunk]: { ...prev[chunk], [field]: value },
    }))
    setRecommendation(null)
  }

  const chartData = CHUNK_SIZES.map(chunk => ({
    chunk,
    faithfulness: parseFloat(scores[chunk].faithfulness) || null,
    context_precision: parseFloat(scores[chunk].context_precision) || null,
    answer_relevancy: parseFloat(scores[chunk].answer_relevancy) || null,
  }))

  function generateRecommendation() {
    let bestChunk: ChunkSize = 128
    let bestAvg = -1

    for (const chunk of CHUNK_SIZES) {
      const row = scores[chunk]
      const f = parseFloat(row.faithfulness) || 0
      const cp = parseFloat(row.context_precision) || 0
      const ar = parseFloat(row.answer_relevancy) || 0
      const avg = (f + cp + ar) / 3
      if (avg > bestAvg) {
        bestAvg = avg
        bestChunk = chunk
      }
    }

    const row = scores[bestChunk]
    const f = parseFloat(row.faithfulness) || 0
    const lat = row.latency_ms ? `${row.latency_ms}ms` : 'N/A'
    setRecommendation(
      `Best configuration: ${bestChunk} tokens — highest faithfulness (${f.toFixed(2)}) with acceptable latency (${lat})`
    )
  }

  return (
    <div style={{ margin: '12px 0' }}>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <tbody>
            <tr>
              <th>Chunk size</th>
              <th>Faithfulness</th>
              <th>Context precision</th>
              <th>Answer relevancy</th>
              <th>Latency (ms)</th>
            </tr>
            {CHUNK_SIZES.map(chunk => (
              <tr key={chunk}>
                <td style={{ fontWeight: 600 }}>{chunk} tokens</td>
                {(['faithfulness', 'context_precision', 'answer_relevancy'] as const).map(field => (
                  <td key={field}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      style={inputStyle}
                      value={scores[chunk][field]}
                      placeholder="0.00"
                      onChange={e => handleChange(chunk, field, e.target.value)}
                    />
                  </td>
                ))}
                <td>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    style={{ ...inputStyle, width: 80 }}
                    value={scores[chunk].latency_ms}
                    placeholder="ms"
                    onChange={e => handleChange(chunk, 'latency_ms', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 20 }}>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="chunk" tickFormatter={v => `${v}t`} stroke="var(--text-muted)" />
            <YAxis domain={[0, 1]} stroke="var(--text-muted)" />
            <Tooltip
              contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              formatter={(value) => (typeof value === 'number' ? value.toFixed(3) : '—')}
              labelFormatter={v => `Chunk: ${v} tokens`}
            />
            <Legend />
            <Line type="monotone" dataKey="faithfulness" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
            <Line type="monotone" dataKey="context_precision" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
            <Line type="monotone" dataKey="answer_relevancy" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <button
        onClick={generateRecommendation}
        style={{ marginTop: 12, padding: '8px 18px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--accent, #6366f1)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
      >
        Generate Recommendation
      </button>

      {recommendation && (
        <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14 }}>
          {recommendation}
        </div>
      )}
    </div>
  )
}

// ─── FIX 2: Report Builder ────────────────────────────────────────────────────

function ReportBuilder() {
  const [date, setDate] = useState('')
  const [author, setAuthor] = useState('')
  const [bestChunk, setBestChunk] = useState('')
  const [finding, setFinding] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [copied, setCopied] = useState(false)

  const fieldStyle: React.CSSProperties = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    padding: 8,
    borderRadius: 'var(--radius-sm, 4px)',
    width: '100%',
    fontSize: 14,
    boxSizing: 'border-box',
  }

  function handleCopy() {
    const markdown = [
      '# RAGAS Evaluation Report',
      `**Date:** ${date}`,
      `**Author:** ${author}`,
      '',
      '## Best Configuration',
      `Chunk size: ${bestChunk}`,
      '',
      '## Key Finding',
      finding,
      '',
      '## Recommendation',
      recommendation,
    ].join('\n')

    navigator.clipboard.writeText(markdown).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div style={{ margin: '12px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
          Date
          <input type="date" style={fieldStyle} value={date} onChange={e => setDate(e.target.value)} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
          Author
          <input type="text" style={fieldStyle} placeholder="Your name" value={author} onChange={e => setAuthor(e.target.value)} />
        </label>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
        Best chunk size
        <input type="text" style={fieldStyle} placeholder="e.g. 256 tokens" value={bestChunk} onChange={e => setBestChunk(e.target.value)} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
        Key finding
        <textarea
          rows={3}
          style={{ ...fieldStyle, resize: 'vertical' }}
          placeholder="What did the data reveal about chunking for property queries?"
          value={finding}
          onChange={e => setFinding(e.target.value)}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
        Recommendation
        <textarea
          rows={3}
          style={{ ...fieldStyle, resize: 'vertical' }}
          placeholder="What chunk size should be used in production, and why?"
          value={recommendation}
          onChange={e => setRecommendation(e.target.value)}
        />
      </label>

      <div>
        <button
          onClick={handleCopy}
          style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--accent, #6366f1)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
        >
          {copied ? 'Copied!' : 'Copy as Markdown'}
        </button>
      </div>
    </div>
  )
}

// ─── Module ───────────────────────────────────────────────────────────────────

export function ModProj3() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">Act 3 Mini-Project — RAGAS Evaluation Sweep</div>
        <ol>
          <li>Build a 20-question golden evaluation dataset covering all Housing.com query types and edge cases</li>
          <li>Write an evaluation harness that runs the golden set through your pipeline and collects responses + contexts</li>
          <li>Sweep across 4 chunk sizes (128 / 256 / 512 / 1024 tokens) and measure RAGAS scores for each</li>
          <li>Identify which chunk size maximises faithfulness + context precision for Housing.com property queries</li>
          <li>Write a 1-page findings report with your recommendation and supporting data</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~2–4 hours</span>
          <span className="obj-diff">Difficulty: ★★★☆☆</span>
          <span className="obj-diff">Prerequisites: Module 14 (Evaluation), Module 16 (Production RAG)</span>
        </div>
      </div>

      <div className="callout callout-info">
        <strong>Project module — no quiz.</strong><br />
        Run the sweep, record the results, and write the report. The insight you generate — which chunk size and why —
        is more valuable than any quiz score. Post your results in the community channel; real-world data points vary
        significantly by domain.
      </div>

      <h2>Project Brief</h2>
      <p>
        Your Housing.com pipeline uses RAG to retrieve property listings. But how do you know if the retrieval is working
        well? This project answers that question with data. You will build a 20-question golden evaluation dataset, run it
        through four different chunk-size configurations, and identify the optimal chunking strategy for property queries.
      </p>
      <p>
        By the end, you will have experienced the full evaluation flywheel: build dataset → run eval → identify gaps →
        understand the tradeoff curve. This is the workflow that drives model improvement in production.
      </p>

      <h2>The 20-Question Golden Dataset</h2>
      <p>The dataset is designed to cover all query archetypes and reveal bias:</p>
      <ul>
        <li><strong>Tier 1 cities (4 queries)</strong> — Mumbai, Bengaluru, Gurgaon. Tests the core use case.</li>
        <li><strong>Tier 2 cities (3 queries)</strong> — Pune, Nashik, Indore. Tests coverage gaps.</li>
        <li><strong>Tier 3 cities (2 queries)</strong> — Patna, Kanpur. Tests underrepresented markets.</li>
        <li><strong>Semantic / contextual (2 queries)</strong> — Retirement, investment. Tests understanding intent.</li>
        <li><strong>Multi-condition (2 queries)</strong> — RERA + school + hospital; pet-friendly. Tests complex filters.</li>
        <li><strong>Price / value (2 queries)</strong> — Cheapest in area; luxury. Tests price range handling.</li>
        <li><strong>Edge cases (2 queries)</strong> — No matching properties; off-topic. Tests graceful degradation.</li>
        <li><strong>Hindi transliteration (1 query)</strong> — Tests multilingual capability.</li>
        <li><strong>Protected characteristic (1 query)</strong> — Tests fairness / bias response.</li>
        <li><strong>General knowledge (1 query)</strong> — RERA explanation. Tests factual grounding.</li>
      </ul>
      <CodeBlock
        title="Golden Evaluation Dataset — 20 Property Query Archetypes"
        language="python"
        keyLine={49}
        keyNote="Bias test: dietary filter is a fair housing violation, not a search filter"
      >{CODE_GOLDEN_DATASET}</CodeBlock>

      <h2>Evaluation Harness</h2>
      <p>
        The harness calls your pipeline's non-streaming endpoint for each question, collects the response and the retrieved
        context chunks, then feeds the results to RAGAS.
      </p>
      <div className="callout callout-info">
        <strong>Note:</strong> You will need to add <code>retrieved_chunks</code> to your pipeline's response payload
        (the chunks used by the LLM to generate the answer). Without the actual retrieved context, RAGAS cannot compute
        faithfulness or context precision — it needs to verify claims against the source chunks.
      </div>
      <CodeBlock
        title="RAGAS Evaluation Harness — Collect Pipeline Responses"
        language="python"
        keyLine={23}
        keyNote="retrieved_chunks must be added to the pipeline response — RAGAS needs them"
      >{CODE_HARNESS}</CodeBlock>

      <h2>Sweep Instructions</h2>
      <p>Run the sweep across 4 chunk sizes. For each size: re-index the property corpus with that chunk size, run the full 20-question golden set through the pipeline, score with RAGAS.</p>
      <CodeBlock
        title="Chunk Size Sweep — Re-index and Score Each Configuration"
        language="python"
        keyLine={8}
        keyNote="Re-indexing each iteration is mandatory — stale index poisons the score"
      >{CODE_SWEEP}</CodeBlock>

      <h2>My Findings</h2>
      <p>Run the sweep, then enter your RAGAS scores below. The chart updates live as you type, and the recommendation button will identify the best configuration.</p>
      <RAGASResultsExplorer />
      <p>After completing the table: Which chunk size produced the best faithfulness on your golden dataset? Why do you think that is? Did Hindi queries behave differently from English queries? What would you change if you ran the sweep again?</p>

      <h2>Report Template</h2>
      <p>Fill in the fields below, then click "Copy as Markdown" to paste the report into your notes or community post.</p>
      <ReportBuilder />

      <div className="callout callout-maang">
        <strong>What this project teaches you that no tutorial can</strong><br />
        Evaluation is not a box to check — it's a measurement instrument. The sweep reveals your system's actual failure modes.
        Most teams skip this work and wonder why their chatbot "works great in demos but disappoints in production." The
        difference is always a missing golden dataset. After this project, you will never ship an AI feature without one.
      </div>
    </>
  );
}
