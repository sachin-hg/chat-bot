import { useState, useEffect, useRef } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { QuizSection } from '../components/QuizSection';
import { CodeBlock } from '../components/CodeBlock';

function NaiveRAGFlowViz() {
  const [showFailure, setShowFailure] = useState(false);
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimated(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const boxes = [
    { label: 'Query', id: 'query' },
    { label: 'Embed Query', id: 'embed' },
    { label: 'Vector Search', id: 'search' },
    { label: 'Retrieved Chunks', id: 'chunks' },
    { label: 'LLM Generate', id: 'generate' },
  ];

  const failureBoxes = new Set(['embed', 'search']);

  const BOX_W = 96;
  const BOX_H = 44;
  const GAP = 28;
  const TOTAL = boxes.length;
  const VB_W = TOTAL * BOX_W + (TOTAL - 1) * GAP;
  const VB_H = 120;
  const Y_CENTER = 52;

  return (
    <div ref={ref} style={{ margin: '20px 0' }}>
      <style>{`
        @keyframes naiveFlowIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes naiveArrowIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
        <button
          onClick={() => setShowFailure(f => !f)}
          style={{
            padding: '6px 16px',
            borderRadius: 20,
            border: `2px solid ${showFailure ? '#f38ba8' : 'var(--border)'}`,
            background: showFailure ? '#f38ba822' : 'transparent',
            color: showFailure ? '#f38ba8' : 'var(--muted)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all .2s',
          }}
        >
          {showFailure ? 'Hide Failure Mode' : 'Show: Vocabulary Mismatch failure'}
        </button>
      </div>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        style={{ display: 'block', width: '100%', maxWidth: 640, margin: '0 auto', overflow: 'visible' }}
        aria-label="Naive RAG pipeline flow"
      >
        <defs>
          <marker id="navRagArr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L0,7 L7,3.5 z" fill="var(--border)" />
          </marker>
          <marker id="navRagArrFail" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L0,7 L7,3.5 z" fill="#f38ba8" />
          </marker>
        </defs>

        {boxes.map((box, i) => {
          const x = i * (BOX_W + GAP);
          const isFail = showFailure && failureBoxes.has(box.id);
          const delay = `${i * 0.12}s`;
          return (
            <g key={box.id}>
              {/* Arrow to next box */}
              {i < TOTAL - 1 && (
                <line
                  x1={x + BOX_W}
                  y1={Y_CENTER}
                  x2={x + BOX_W + GAP - 1}
                  y2={Y_CENTER}
                  stroke={showFailure && (failureBoxes.has(box.id) || failureBoxes.has(boxes[i + 1].id)) ? '#f38ba8' : 'var(--border)'}
                  strokeWidth={1.8}
                  markerEnd={showFailure && (failureBoxes.has(box.id) || failureBoxes.has(boxes[i + 1].id)) ? 'url(#navRagArrFail)' : 'url(#navRagArr)'}
                  style={animated ? { animation: `naiveArrowIn .3s ease ${delay} both` } : { opacity: 0 }}
                />
              )}
              {/* Box */}
              <rect
                x={x}
                y={Y_CENTER - BOX_H / 2}
                width={BOX_W}
                height={BOX_H}
                rx={6}
                fill={isFail ? '#f38ba822' : 'var(--bg2)'}
                stroke={isFail ? '#f38ba8' : 'var(--border)'}
                strokeWidth={isFail ? 2 : 1.5}
                style={animated ? { animation: `naiveFlowIn .35s ease ${delay} both` } : { opacity: 0 }}
              />
              <text
                x={x + BOX_W / 2}
                y={Y_CENTER - 4}
                textAnchor="middle"
                fill={isFail ? '#f38ba8' : 'var(--text)'}
                fontSize={9.5}
                fontWeight={isFail ? 700 : 500}
                style={animated ? { animation: `naiveFlowIn .35s ease ${delay} both` } : { opacity: 0 }}
              >
                {box.label.split(' ').slice(0, 2).join(' ')}
              </text>
              {box.label.split(' ').length > 2 && (
                <text
                  x={x + BOX_W / 2}
                  y={Y_CENTER + 10}
                  textAnchor="middle"
                  fill={isFail ? '#f38ba8' : 'var(--text)'}
                  fontSize={9.5}
                  fontWeight={isFail ? 700 : 500}
                  style={animated ? { animation: `naiveFlowIn .35s ease ${delay} both` } : { opacity: 0 }}
                >
                  {box.label.split(' ').slice(2).join(' ')}
                </text>
              )}
              {/* Step number */}
              <text
                x={x + BOX_W / 2}
                y={Y_CENTER + 23}
                textAnchor="middle"
                fill="var(--muted)"
                fontSize={8}
                style={animated ? { animation: `naiveFlowIn .35s ease ${delay} both` } : { opacity: 0 }}
              >
                {['①', '②', '③', '④', '⑤'][i]}
              </text>
            </g>
          );
        })}

        {/* Failure label */}
        {showFailure && (
          <text
            x={VB_W / 2}
            y={VB_H - 6}
            textAnchor="middle"
            fill="#f38ba8"
            fontSize={9}
            fontWeight={700}
          >
            Failure point: query vocab != document vocab
          </text>
        )}
      </svg>
    </div>
  );
}

function RAGPipelineViz() {
  const [step, setStep] = useState(0);

  const stages = [
    {
      label: 'User Query',
      color: '#89b4fa',
      desc: 'User submits a natural-language question.',
      detail: '"2BHK near Bandra under 2Cr"',
    },
    {
      label: 'Embed Query',
      color: '#cba6f7',
      desc: 'Query is converted to a dense vector using an embedding model.',
      detail: 'text-embedding-3-small → [0.12, -0.87, 0.44, ..., 0.31]  (1536 dims)',
    },
    {
      label: 'Vector Search → Top-K',
      color: '#94e2d5',
      desc: 'ANN search (HNSW) finds the top-k most similar document chunks.',
      detail: 'Top-3 chunks retrieved:\n• "2BHK Bandra West ₹1.95Cr sea-facing" (sim 0.94)\n• "2BHK Khar West ₹1.82Cr renovated" (sim 0.88)\n• "1.5BHK Bandra ₹1.75Cr" (sim 0.76)',
    },
    {
      label: 'Augment Prompt',
      color: '#f9e2af',
      desc: 'Retrieved chunks are injected into the prompt template.',
      detail: 'Context: {retrieved docs}\n\nQuestion: {query}\n\nAnswer:',
    },
    {
      label: 'LLM Generate',
      color: '#a6e3a1',
      desc: 'LLM reads the grounded context and synthesises a faithful answer.',
      detail: '"I found 2 options near Bandra under 2Cr:\n1. Bandra West ₹1.95Cr — sea-facing, 2BHK\n2. Khar West ₹1.82Cr — renovated, 2BHK"',
    },
  ];

  const totalSteps = stages.length;

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <style>{`@keyframes dashFlowR27{to{stroke-dashoffset:-14}}`}</style>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>RAG PIPELINE — FROM QUERY TO GROUNDED RESPONSE</div>

      {/* Progress bar */}
      <div style={{height:'3px',background:'#313244',borderRadius:'2px',marginBottom:'18px'}}>
        <div style={{height:'100%',background:'#89b4fa',borderRadius:'2px',width:`${(step / (totalSteps - 1)) * 100}%`,transition:'width 0.4s'}}/>
      </div>

      {/* Stage nodes */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'18px',gap:'4px'}}>
        {stages.map((s, i) => (
          <div key={i} style={{display:'flex',alignItems:'center',flex:1}}>
            <div
              onClick={() => setStep(i)}
              style={{
                flex:1,padding:'8px 6px',borderRadius:'6px',textAlign:'center',cursor:'pointer',
                background: i === step ? '#313244' : '#1e1e2e',
                border: `1px solid ${i === step ? s.color : '#45475a'}`,
                color: i === step ? s.color : '#6c7086',
                fontSize:'0.72rem',fontWeight:i===step?700:400,
                transition:'all 0.2s',
              }}
            >
              <div style={{fontSize:'1rem',marginBottom:'2px'}}>{['①','②','③','④','⑤'][i]}</div>
              {s.label}
            </div>
            {i < totalSteps - 1 && (
              <svg width="18" height="14" style={{flexShrink:0}}>
                <defs><marker id={`r27-arr-${i}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill={i < step ? '#89b4fa' : '#45475a'}/></marker></defs>
                <line x1="0" y1="7" x2="12" y2="7" stroke={i < step ? '#89b4fa' : '#45475a'} strokeWidth="1.5"
                  strokeDasharray={i < step ? '4 3' : 'none'}
                  markerEnd={`url(#r27-arr-${i})`}
                  style={i < step ? {animation:'dashFlowR27 1s linear infinite'} : {}}/>
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Active step detail */}
      <div style={{background:'#1e1e2e',border:`1px solid ${stages[step].color}`,borderRadius:'6px',padding:'14px'}}>
        <div style={{fontSize:'0.8rem',fontWeight:700,color:stages[step].color,marginBottom:'6px'}}>
          Step {step + 1}: {stages[step].label}
        </div>
        <div style={{fontSize:'0.82rem',color:'#bac2de',marginBottom:'8px'}}>{stages[step].desc}</div>
        <div style={{fontFamily:'monospace',fontSize:'0.8rem',color:'#cdd6f4',background:'#313244',borderRadius:'4px',padding:'10px',whiteSpace:'pre-wrap'}}>
          {stages[step].detail}
        </div>
      </div>

      {/* Buttons */}
      <div style={{marginTop:'12px',display:'flex',gap:'8px'}}>
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          style={{background:'#313244',color:step===0?'#45475a':'#cdd6f4',border:'1px solid #45475a',borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor:step===0?'default':'pointer',marginRight:'8px'}}
        >← Prev</button>
        <button
          onClick={() => setStep(s => Math.min(totalSteps - 1, s + 1))}
          disabled={step === totalSteps - 1}
          style={{background:'#313244',color:step===totalSteps-1?'#45475a':'#cdd6f4',border:'1px solid #45475a',borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor:step===totalSteps-1?'default':'pointer',marginRight:'8px'}}
        >Next →</button>
        <button
          onClick={() => setStep(0)}
          style={{background:'#89b4fa22',color:'#89b4fa',border:'1px solid #89b4fa',borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor:'pointer',marginRight:'8px'}}
        >Reset</button>
      </div>
    </div>
  );
}

const RAG_DATA = [
  { metric: 'Accuracy',    naive: 60, advanced: 80, multiHop: 75, hybrid: 90 },
  { metric: 'Latency',     naive: 90, advanced: 65, multiHop: 50, hybrid: 60 },
  { metric: 'Cost',        naive: 85, advanced: 60, multiHop: 45, hybrid: 55 },
  { metric: 'Complexity',  naive: 90, advanced: 60, multiHop: 40, hybrid: 50 },
  { metric: 'Maintenance', naive: 85, advanced: 65, multiHop: 45, hybrid: 55 },
]

const ARCHS = [
  { key: 'naive',    label: 'Naive RAG',    color: '#89b4fa' },
  { key: 'advanced', label: 'Advanced RAG', color: '#a6e3a1' },
  { key: 'multiHop', label: 'Multi-Hop',    color: '#fab387' },
  { key: 'hybrid',   label: 'Hybrid RAG',   color: '#cba6f7' },
]

function RAGComparisonViz() {
  const [visible, setVisible] = useState<Record<string, boolean>>({ naive: true, advanced: true, multiHop: true, hybrid: true })
  const toggle = (key: string) => setVisible(v => ({ ...v, [key]: !v[key] }))

  return (
    <div style={{margin:'24px 0'}}>
      <div style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--muted)',marginBottom:'12px'}}>RAG ARCHITECTURE TRADEOFFS — CLICK LEGEND TO TOGGLE</div>
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'12px'}}>
        {ARCHS.map(a => (
          <button key={a.key} onClick={() => toggle(a.key)}
            style={{padding:'4px 12px',borderRadius:'20px',border:`2px solid ${a.color}`,
              background: visible[a.key] ? `${a.color}22` : 'transparent',
              color: visible[a.key] ? a.color : 'var(--muted)',fontSize:'12px',cursor:'pointer',fontWeight:600,
              transition:'all .2s'}}>
            {a.label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <RadarChart data={RAG_DATA} margin={{top:10,right:30,bottom:10,left:30}}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="metric" tick={{fill:'var(--muted)',fontSize:11}} />
          <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fill:'var(--muted)',fontSize:9}} tickCount={4} />
          {ARCHS.filter(a => visible[a.key]).map(a => (
            <Radar key={a.key} name={a.label} dataKey={a.key}
              stroke={a.color} fill={a.color} fillOpacity={0.12} strokeWidth={2} />
          ))}
          <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'6px',fontSize:12}} />
          <Legend formatter={(val) => <span style={{color:'var(--text)',fontSize:12}}>{val}</span>} />
        </RadarChart>
      </ResponsiveContainer>
      <p style={{fontSize:'12px',color:'var(--muted)',textAlign:'center',marginTop:'4px'}}>Higher score = better for that axis. Latency/Cost/Complexity: higher = simpler/cheaper/faster.</p>
    </div>
  )
}

const CODE_1 = `# 1. Query expansion — multiple phrasings catch vocabulary mismatch
from langchain.retrievers import MultiQueryRetriever
retriever = MultiQueryRetriever.from_llm(retriever=vectorstore.as_retriever(), llm=llm)
# LLM generates 3 variants → union of results from all three

# 2. HyDE — embed a hypothetical answer, not the question
# Answers share vocabulary with documents; questions often don't
hyde_prompt = "Write a property listing that answers: {query}"
hypothetical = llm.invoke(hyde_prompt.format(query=user_query))
query_embedding = embed(hypothetical)   # embed the answer, search with it`;

const CODE_2 = `from langchain.retrievers import EnsembleRetriever, ContextualCompressionRetriever
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers.document_compressors import CohereRerank

# Hybrid: keyword (BM25) + semantic (vector)
hybrid = EnsembleRetriever(
    retrievers=[BM25Retriever.from_documents(docs), vectorstore.as_retriever()],
    weights=[0.4, 0.6],
)

# Cross-encoder rerank: reads query + doc together — more accurate than cosine
reranker = CohereRerank(model="rerank-english-v3.0", top_n=3)
reranked = ContextualCompressionRetriever(base_compressor=reranker, base_retriever=hybrid)
# Pattern: retrieve 10 cheaply → rerank to top 3 accurately. Cost: $0.001/1K searches`;

const CODE_3 = `from langchain.retrievers.document_compressors import LLMChainExtractor
compressor = LLMChainExtractor.from_llm(llm)
# Before: 500-token chunk — parking, amenities, price, society rules, ...
# After:  "Price: ₹2.5Cr. 2 covered parking slots included."
# Only relevant sentences enter the prompt → higher faithfulness, lower token cost`;

const CODE_4 = `def route(query: str, query_type: str):
    if query_type == "factual_lookup":  return bm25_retriever.invoke(query)
    elif query_type == "semantic":      return vector_retriever.invoke(query)
    elif query_type == "multi_hop":     return iterative_retriever.invoke(query)
    else:                               return hybrid_retriever.invoke(query)`;

const CODE_5 = `from langchain.tools import Tool
from langchain.agents import create_react_agent

search_tool = Tool(name="SearchDocs",
    description="Search property listings. Use for prices, features, locality.",
    func=retriever.invoke)
emi_tool = Tool(name="CalcEMI",
    description="Calculate EMI given principal, rate, tenure.",
    func=calculate_emi)

agent = create_react_agent(llm, tools=[search_tool, emi_tool], prompt=react_prompt)
# Agent for "2BHK in Bandra — EMI at 8.5% for 20 years?":
# Action: SearchDocs → finds ₹1.95Cr → Action: CalcEMI(1.95Cr, 8.5, 20) → ₹16,940/mo`;

export function Mod27() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Describe the failure modes of Naive RAG and what Advanced RAG fixes</li>
          <li>Implement query expansion (MultiQueryRetriever) and HyDE for pre-retrieval</li>
          <li>Apply cross-encoder reranking to improve post-retrieval quality</li>
          <li>Choose between Modular, Graph, Self, and Agentic RAG for a given use case</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~75 minutes</span>
          <span className="obj-diff">Difficulty: ★★★★☆</span>
          <span className="obj-diff">Prerequisites: Modules 2.8, 23, 26</span>
        </div>
      </div>

      <div className="callout callout-info">
        <strong>Housing.com Context</strong><br />
        Housing.com's <code>fetch_data_node</code> is structured retrieval, not semantic RAG — closer to a SQL executor than a retrieval pipeline. Full RAG becomes relevant when Housing.com adds conversational context ("like the flat I saw last Tuesday") or needs to answer questions from unstructured locality data.
      </div>

      <div className="callout callout-info"><strong>Why does the LLM need a search engine — doesn't it already know everything?</strong>
        {' '}The LLM was trained on the internet (up to its cutoff date) and knows general facts. But it does NOT know your company's specific data: your property listings, current prices, unit availability, internal policies, or anything that isn't public.
        <br /><br />
        Without RAG: "What is the price of Oberoi Exquisite, Tower 3, flat 24B?" → LLM has no idea. It will confidently generate a plausible-sounding but invented price. This is hallucination.
        <br /><br />
        With RAG: you search your database, retrieve the actual listing, inject it into the prompt → LLM reads real data, synthesizes a natural-language answer from facts. The LLM's job is reasoning and synthesis — not memorization.
        <br /><br />
        This is the entire reason <code>fetch_data_node → build_prompt_node → llm_node</code> is the pipeline's core path. Fetch real data → inject it → let the LLM reason from it. Without that chain, every AI answer is guesswork.
      </div>

      <RAGPipelineViz />
      <h2>27.1 Naive RAG — Baseline and Failure Modes</h2>
      <NaiveRAGFlowViz />
      <table>
        <tbody>
          <tr><th>Failure</th><th>Symptom</th><th>Root cause</th></tr>
          <tr><td>Vocabulary mismatch</td><td>Correct doc not retrieved</td><td>"API throttling" in query vs "rate limiting" in doc</td></tr>
          <tr><td>Lost-in-the-middle</td><td>Doc retrieved, answer missed</td><td>Answer at chunk position 4 of 8; LLM ignores middle</td></tr>
          <tr><td>Multi-hop failure</td><td>Partial answer</td><td>Two separate docs needed; top-k returns both or neither</td></tr>
          <tr><td>Context overflow</td><td>LLM truncates</td><td>10 × 500-token chunks exceeds useful context</td></tr>
          <tr><td>Stale index</td><td>Outdated confident answer</td><td>Doc updated; embedding not refreshed</td></tr>
        </tbody>
      </table>

      <h2>27.2 Advanced RAG — Three Enhancement Layers</h2>
      <h3>Pre-retrieval: improve the query</h3>
      <CodeBlock title="Query Expansion and HyDE — Pre-Retrieval Techniques" language="python" keyLine={5} keyNote="HyDE embeds a hypothetical answer — answers share vocabulary with docs">{CODE_1}</CodeBlock>

      <h3>During retrieval: hybrid search + reranking</h3>
      <CodeBlock title="Hybrid Search with Cross-Encoder Reranking" language="python" keyLine={11} keyNote="retrieve 10 cheaply, rerank to top 3 accurately — cost $0.001/1K searches">{CODE_2}</CodeBlock>

      <h3>Post-retrieval: contextual compression</h3>
      <CodeBlock title="Contextual Compression — Extract Only Relevant Sentences" language="python" keyLine={3} keyNote="only relevant sentences enter the prompt — higher faithfulness, lower tokens">{CODE_3}</CodeBlock>

      <h2>27.3 Modular RAG — Route Between Strategies</h2>
      <div className="callout callout-info"><strong>How query_type is determined</strong>
        {' '}The routing function receives <code>query_type</code> — but where does it come from? Two approaches:
        <ol style={{margin:'4px 0'}}>
          <li><strong>LLM classifier (1 extra call):</strong> <code>{'classify_prompt = "Classify this query as factual_lookup, semantic, or multi_hop. Return one word only.\\nQuery: {q}"'}</code> → call Haiku → get query_type. Cost: ~50ms, ~$0.00005/request. Worth it at high volume with diverse queries.</li>
          <li><strong>Heuristics (free):</strong> queries with entity names (HOM-9873, "Oberoi Exquisite") → factual_lookup. Queries with "similar to", "like" → semantic. Queries with "and also", "same [person/builder]" or multiple entities → multi_hop. Covers 80% of cases with zero cost.</li>
        </ol>
        Production recommendation: start with heuristics, fall back to LLM classifier when heuristics miss.
      </div>
      <CodeBlock title="Modular RAG — Query Router by Intent Type" language="python" keyLine={2} keyNote="factual_lookup uses BM25 keyword match, not vector search">{CODE_4}</CodeBlock>
      <p><strong>Iterative retrieval for multi-hop:</strong> retrieve → read → formulate sub-query → retrieve again. Handles: "properties near the school mentioned in the project brochure under 2Cr" — requires two sequential retrieval steps.</p>

      <h2>27.4 Graph RAG — Entity Relationships</h2>
      <svg width="500" height="290" viewBox="0 0 500 290" style={{display:'block',margin:'12px auto',fontFamily:"'Courier New',monospace"}}>
        <rect width="500" height="290" rx="6" fill="#1e1e2e"/>
        <text x="250" y="20" textAnchor="middle" fill="#cdd6f4" fontSize="11" fontWeight="bold">2D Embedding Space — Knowledge Graph Entity Clusters</text>
        <line x1="40" y1="250" x2="470" y2="250" stroke="#45475a" strokeWidth="1"/>
        <line x1="40" y1="30" x2="40" y2="250" stroke="#45475a" strokeWidth="1"/>
        <text x="255" y="270" textAnchor="middle" fill="#6c7086" fontSize="8">Embedding Dim 1 (t-SNE projection)</text>
        <text x="14" y="145" textAnchor="middle" fill="#6c7086" fontSize="8" transform="rotate(-90,14,145)">Embedding Dim 2</text>
        <ellipse cx="130" cy="90" rx="55" ry="40" fill="#89b4fa" fillOpacity="0.12" stroke="#89b4fa" strokeWidth="1.5" strokeDasharray="4,3"/>
        <text x="130" y="55" textAnchor="middle" fill="#89b4fa" fontSize="9" fontWeight="bold">Localities</text>
        <circle cx="110" cy="80" r="5" fill="#89b4fa"/>
        <text x="116" y="83" fill="#a6adc8" fontSize="8">Bandra West</text>
        <circle cx="145" cy="95" r="5" fill="#89b4fa"/>
        <text x="151" y="98" fill="#a6adc8" fontSize="8">Andheri East</text>
        <circle cx="120" cy="115" r="5" fill="#89b4fa"/>
        <text x="126" y="118" fill="#a6adc8" fontSize="8">Worli</text>
        <ellipse cx="360" cy="90" rx="65" ry="42" fill="#a6e3a1" fillOpacity="0.12" stroke="#a6e3a1" strokeWidth="1.5" strokeDasharray="4,3"/>
        <text x="360" y="55" textAnchor="middle" fill="#a6e3a1" fontSize="9" fontWeight="bold">Projects</text>
        <circle cx="330" cy="80" r="5" fill="#a6e3a1"/>
        <text x="336" y="83" fill="#a6adc8" fontSize="8">Sky Towers</text>
        <circle cx="375" cy="100" r="5" fill="#a6e3a1"/>
        <text x="381" y="103" fill="#a6adc8" fontSize="8">Sea View Heights</text>
        <circle cx="345" cy="115" r="5" fill="#a6e3a1"/>
        <text x="351" y="118" fill="#a6adc8" fontSize="8">Palm Residency</text>
        <ellipse cx="370" cy="195" rx="65" ry="38" fill="#fab387" fillOpacity="0.12" stroke="#fab387" strokeWidth="1.5" strokeDasharray="4,3"/>
        <text x="430" y="175" textAnchor="middle" fill="#fab387" fontSize="9" fontWeight="bold">Approvers</text>
        <circle cx="345" cy="185" r="5" fill="#fab387"/>
        <text x="351" y="188" fill="#a6adc8" fontSize="8">J. Smith</text>
        <circle cx="385" cy="200" r="5" fill="#fab387"/>
        <text x="391" y="203" fill="#a6adc8" fontSize="8">R. Patel</text>
        <circle cx="360" cy="215" r="5" fill="#fab387"/>
        <text x="366" y="218" fill="#a6adc8" fontSize="8">M. Verma</text>
        <line x1="375" y1="100" x2="345" y2="185" stroke="#f38ba8" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.7"/>
        <text x="382" y="148" fill="#f38ba8" fontSize="8">approved_by</text>
        <line x1="330" y1="80" x2="145" y2="95" stroke="#cba6f7" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.7"/>
        <text x="228" y="82" fill="#cba6f7" fontSize="8">located_in</text>
        <line x1="345" y1="115" x2="345" y2="185" stroke="#f38ba8" strokeWidth="1" strokeDasharray="3,3" opacity="0.5"/>
        <text x="58" y="175" fill="#f9e2af" fontSize="9" fontWeight="bold">KG query:</text>
        <text x="58" y="188" fill="#a6adc8" fontSize="8">"projects approved by</text>
        <text x="58" y="200" fill="#a6adc8" fontSize="8">Bandra approver"</text>
        <text x="58" y="212" fill="#a6adc8" fontSize="8">→ traverse 2 edges</text>
        <text x="58" y="224" fill="#a6adc8" fontSize="8">→ find both projects</text>
        <text x="250" y="278" textAnchor="middle" fill="#a6adc8" fontSize="8">Standard top-k returns isolated chunks — can't traverse relationships across clusters</text>
      </svg>
      <p>Standard vector search retrieves isolated chunks. Graph RAG builds a knowledge graph so queries can traverse relationships.</p>
      <div className="diagram-wrap">
        <pre style={{margin:0,border:'none',background:'transparent',fontSize:'12px'}}>{`Standard RAG: returns chunks about Bandra project (no links to approval history)

Graph RAG knowledge graph:
  (Bandra Project) --approved_by→ (J. Smith)
  (Juhu Project)   --approved_by→ (J. Smith)

Query: "all projects approved by the Bandra approver"
→ Find Bandra node → traverse approved_by → find J. Smith → traverse all edges
→ answer spans both projects (impossible with standard top-k)`}</pre>
      </div>
      <div className="callout callout-warn">
        <strong>When NOT to use Graph RAG</strong>
        {' '}Simple Q&amp;A over homogeneous documents (product docs, FAQs). Graph construction is expensive ($10–$100 to index a large corpus with LLM-based entity extraction). Overkill for independent fact retrieval. Use for: legal contracts, research papers with citations, knowledge management with entity relationships.
      </div>

      <h2>27.5 Self-RAG — Retrieve Only When Needed</h2>
      <div className="diagram-wrap">
        <pre style={{margin:0,border:'none',background:'transparent',fontSize:'12px'}}>{`Query: "What is 2+2?"
Self-RAG: RETRIEVE? → No (factual) → Generate directly

Query: "Properties in Bandra under 2Cr today?"
Self-RAG: RETRIEVE? → Yes → Retrieve → GROUNDED? → Yes → Generate
                                                  → No  → Retrieve again

In most chatbots 30-40% of queries don't need retrieval.
Self-RAG eliminates that cost and latency.`}</pre>
      </div>

      <h2>27.6 Agentic RAG — RAG as a Tool</h2>
      <CodeBlock title="Agentic RAG — ReAct Agent with Search and EMI Tools" language="python" keyLine={15} keyNote="agent chains SearchDocs then CalcEMI in one turn — pure RAG cannot">{CODE_5}</CodeBlock>

      <RAGComparisonViz />
      <h2>27.7 When to Use Which Architecture</h2>
      <div className="decision-tree">
        <span className="dt-q">How complex are your queries?</span><br />│
        <br />├─ Simple Q&amp;A, small corpus (&lt;100K docs)
        <br />│{'   '}└─ <span className="dt-yes">Naive RAG</span> <span className="dt-note">— fast to ship, sufficient accuracy</span>
        <br />│
        <br />├─ Production chatbot, vocabulary mismatch common
        <br />│{'   '}└─ <span className="dt-yes">Advanced RAG</span> <span className="dt-note">— hybrid search + reranking + compression</span>
        <br />│
        <br />├─ Multiple indices (FAQ + docs + policies + user data)
        <br />│{'   '}└─ <span className="dt-yes">Modular RAG</span> <span className="dt-note">— route between retrieval strategies</span>
        <br />│
        <br />├─ Queries span entity relationships (legal, research)
        <br />│{'   '}└─ <span className="dt-yes">Graph RAG</span> <span className="dt-note">— Microsoft GraphRAG or LlamaIndex PropertyGraph</span>
        <br />│
        <br />├─ Mixed queries (30-40% don't need retrieval)
        <br />│{'   '}└─ <span className="dt-yes">Self-RAG</span> <span className="dt-note">— saves retrieval cost + latency for non-RAG queries</span>
        <br />│
        <br />└─ Complex multi-step queries requiring planning
        <br />{'    '}└─ <span className="dt-yes">Agentic RAG</span> <span className="dt-note">— most powerful, ~3× token cost of Naive RAG</span>
      </div>

      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection</strong>
        {' '}"Design a RAG system for legal document QA." → Immediately flag: entity relationships matter (contract → parties → obligations) → Graph RAG. Mention multi-hop: "who is liable if clause 4.2 is violated?" Chunking: document-aware by clause. Evaluation: RAGAS faithfulness + human legal expert review for high-stakes. Cost: GraphRAG indexing ~$50–$200 for a typical contract corpus — justified by liability risk of hallucination.
      </div>

      <QuizSection moduleId={29} title="Module 29" contentHint="Naive RAG failure modes vocabulary mismatch lost-in-the-middle, MultiQueryRetriever query expansion, HyDE hypothetical document embeddings, cross-encoder reranking vs bi-encoder, Graph RAG entity relationship traversal, Self-RAG retrieve-only-when-needed decision, Agentic RAG ReAct tool loop, architecture decision tree by query complexity" />
    </>
  );
}
