import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from '../components/CodeBlock';

function HydeViz() {
  const [step, setStep] = useState(0) // 0=idle, 1=direct_query_travels, 2=direct_lands_far, 3=hyde_llm_glow, 4=hypothesis_types, 5=hyde_travels, 6=hyde_lands_near
  const [hypothesisText, setHypothesisText] = useState('')
  const fullHypothesis = 'In 2024, 2BHK flats in Bandra ranged from ₹1.8Cr to ₹2.4Cr...'

  // typing effect for hypothesis
  useEffect(() => {
    if (step === 4) {
      let i = 0
      setHypothesisText('')
      const iv = setInterval(() => {
        i++
        setHypothesisText(fullHypothesis.slice(0, i))
        if (i >= fullHypothesis.length) { clearInterval(iv); setStep(5) }
      }, 30)
      return () => clearInterval(iv)
    }
  }, [step])

  function play() { setStep(1); setHypothesisText('') }
  function reset() { setStep(0); setHypothesisText('') }

  const W = 560, H = 200
  // corpus cluster center at (430, 110), direct landing at (280, 70), hyde landing at (400, 115)
  // query box at (30, 80), llm box at (30, 120 — appears at step 3)

  return (
    <div style={{margin:'24px 0'}}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block',background:'var(--bg2)',borderRadius:'8px',padding:'8px'}}>
        {/* Corpus cluster — scattered grey dots */}
        {[[420,90],[440,100],[430,120],[450,115],[410,110],[435,80],[455,95],[415,130]].map(([cx,cy],i) => (
          <circle key={i} cx={cx} cy={cy} r="5" fill="#313244" stroke="#45475a" strokeWidth="1"/>
        ))}
        <text x="430" y="150" textAnchor="middle" fontSize="9" fill="#6c7086">corpus cluster</text>

        {/* Query box */}
        <rect x="10" y="65" width="120" height="30" rx="4" fill="#313244" stroke="#89b4fa" strokeWidth="1.5"/>
        <text x="70" y="83" textAnchor="middle" fontSize="9" fill="#89b4fa">user query</text>
        <text x="70" y="93" textAnchor="middle" fontSize="8" fill="#bac2de">"2BHK Bandra price?"</text>

        {/* Direct query path — Phase 1: travels at step 1, lands far with dejected bounce at step 2 */}
        {step === 1 && (
          <motion.circle
            r="6" fill="#f38ba8"
            initial={{cx: 70, cy: 80, scale: 1}}
            animate={{cx: 285, cy: 65, scale: 1}}
            transition={{duration: 1.2, ease: 'easeInOut'}}
            onAnimationComplete={() => setStep(2)}
          />
        )}
        {step === 2 && (
          /* Dejected bounce: scale down then back up, spring physics */
          <motion.circle
            cx={285} cy={65} r="6" fill="#f38ba8"
            initial={{scale: 1}}
            animate={{scale: [1, 0.55, 1.15, 0.85, 1]}}
            transition={{duration: 0.55, ease: 'easeOut', times: [0, 0.3, 0.55, 0.8, 1], onComplete: () => setStep(3)}}
          />
        )}
        {step >= 2 && (
          <>
            <circle cx={285} cy={65} r="7" fill="none" stroke="#f38ba8" strokeWidth="1.5" strokeDasharray="3 2"/>
            <text x="285" y="50" textAnchor="middle" fontSize="8" fill="#f38ba8">direct embedding</text>
            <text x="285" y="40" textAnchor="middle" fontSize="8" fill="#f38ba8">⊗ far from corpus</text>
          </>
        )}

        {/* LLM box — Phase 2: appears and glows at step 3 */}
        <AnimatePresence>
          {step >= 3 && (
            <motion.g initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.4}}>
              <motion.rect
                x="10" y="108" width="120" height="30" rx="4"
                fill={step === 3 ? '#89b4fa22' : '#313244'}
                stroke={step === 3 ? '#89b4fa' : '#45475a'}
                strokeWidth="1.5"
                animate={step === 3 ? {
                  filter: ['drop-shadow(0 0 2px #89b4fa44)', 'drop-shadow(0 0 10px #89b4facc)', 'drop-shadow(0 0 4px #89b4fa88)']
                } : {}}
                transition={step === 3 ? {duration: 0.9, repeat: 0, onComplete: () => setStep(4)} : {}}
              />
              <text x="70" y="126" textAnchor="middle" fontSize="9" fill={step===3 ? '#89b4fa':'#6c7086'}>LLM generates</text>
              <text x="70" y="136" textAnchor="middle" fontSize="8" fill={step===3 ? '#89b4fa':'#6c7086'}>hypothesis answer</text>
            </motion.g>
          )}
        </AnimatePresence>

        {/* Typing hypothesis text — Phase 2 continuation */}
        {step >= 4 && hypothesisText && (
          <foreignObject x="140" y="108" width="210" height="40">
            <div style={{fontSize:'8px',color:'#a6e3a1',fontFamily:'monospace',lineHeight:1.4,padding:'2px'}}>
              &ldquo;{hypothesisText}&rdquo;
            </div>
          </foreignObject>
        )}

        {/* HyDE embedding travels at step 5 — snaps near corpus */}
        {step === 5 && (
          <motion.circle
            r="7" fill="#a6e3a1"
            initial={{cx: 200, cy: 123, scale: 1}}
            animate={{cx: 408, cy: 112, scale: 1}}
            transition={{duration: 1.4, ease: 'easeInOut', delay: 0.2}}
            onAnimationComplete={() => setStep(6)}
          />
        )}
        {step >= 6 && (
          <>
            <motion.circle
              cx={408} cy={112} r="9"
              fill="#a6e3a133" stroke="#a6e3a1" strokeWidth="2"
              initial={{scale: 0.5, opacity: 0}}
              animate={{scale: 1, opacity: 1}}
              transition={{type: 'spring', stiffness: 400, damping: 12}}
            />
            <text x="408" y="148" textAnchor="middle" fontSize="8" fill="#a6e3a1">HyDE embedding</text>
            <text x="408" y="138" textAnchor="middle" fontSize="8" fill="#a6e3a1">✓ near corpus</text>
          </>
        )}
      </svg>

      <div style={{display:'flex',gap:'10px',marginTop:'10px',justifyContent:'center'}}>
        {step === 0
          ? <button onClick={play} style={{background:'var(--accent)',color:'#000',border:'none',borderRadius:'6px',padding:'7px 20px',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>▶ Play HyDE Animation</button>
          : <button onClick={reset} style={{background:'var(--bg3)',color:'var(--muted)',border:'1px solid var(--border)',borderRadius:'6px',padding:'7px 16px',fontSize:'12px',cursor:'pointer'}}>↺ Reset</button>
        }
      </div>
      {step === 6 && (
        <div className="callout callout-info" style={{marginTop:'12px'}}>
          <strong>The insight:</strong> The hypothetical answer "closes the vocabulary gap" — its embedding lives in the same semantic neighbourhood as real documents, even though the original question did not.
        </div>
      )}
    </div>
  )
}

function MultiQueryViz() {
  const [activeQuery, setActiveQuery] = useState(0);
  const queries = [
    "Bandra west sea view 2BHK price below 2 crore",
    "apartments near Arabian Sea Bandra Mumbai budget 2Cr",
    "sea facing flat Bandra west 2 bedroom",
  ];
  const colors = ['#89b4fa','#a6e3a1','#cba6f7'];
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>MULTI-QUERY RETRIEVAL — EXPAND ONE QUERY INTO DIVERSE REFORMULATIONS</div>
      <div style={{marginBottom:'10px'}}>
        {queries.map((q,i) => (
          <button key={i} onClick={() => setActiveQuery(i)} style={activeQuery===i ? {background:'#89b4fa22',color:'#89b4fa',border:'1px solid #89b4fa',borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor:'pointer',marginRight:'8px'} : {background:'#313244',color:'#cdd6f4',border:'1px solid #45475a',borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor:'pointer',marginRight:'8px'}}>
            Query {i+1}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 580 220" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Multi-query retrieval expansion diagram">
        <defs>
          <marker id="mq-arrow-main" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#f9e2af"/></marker>
          {colors.map((c,i) => (
            <marker key={i} id={`mq-arrow-${i}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill={c}/></marker>
          ))}
          <marker id="mq-arrow-merge" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#94e2d5"/></marker>
          <marker id="mq-arrow-rerank" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#fab387"/></marker>
        </defs>
        {/* Original query */}
        <rect x="100" y="8" width="380" height="28" rx="6" fill="#313244" stroke="#f9e2af" strokeWidth="1.5"/>
        <text x="290" y="26" textAnchor="middle" fontSize="10" fill="#f9e2af">show me sea-facing apartments in Bandra under 2Cr</text>
        {/* Arrow to LLM */}
        <line x1="290" y1="36" x2="290" y2="52" stroke="#f9e2af" strokeWidth="1.5" markerEnd="url(#mq-arrow-main)"/>
        {/* LLM expand box */}
        <rect x="190" y="54" width="200" height="26" rx="6" fill="#313244" stroke="#45475a"/>
        <text x="290" y="71" textAnchor="middle" fontSize="11" fill="#6c7086">Query Expansion LLM</text>
        {/* Fan-out arrows */}
        <line x1="230" y1="80" x2="85" y2="108" stroke={colors[0]} strokeWidth="1.5" markerEnd="url(#mq-arrow-0)"/>
        <line x1="290" y1="80" x2="290" y2="108" stroke={colors[1]} strokeWidth="1.5" markerEnd="url(#mq-arrow-1)"/>
        <line x1="350" y1="80" x2="495" y2="108" stroke={colors[2]} strokeWidth="1.5" markerEnd="url(#mq-arrow-2)"/>
        {/* Query boxes */}
        {queries.map((q,i) => {
          const xs = [10, 185, 368];
          const isActive = activeQuery === i;
          return (
            <g key={i}>
              <rect x={xs[i]} y="110" width="190" height="34" rx="6" fill={isActive ? colors[i]+'22' : '#313244'} stroke={colors[i]} strokeWidth={isActive ? 2 : 1}/>
              <text x={xs[i]+95} y="124" textAnchor="middle" fontSize="9" fill={colors[i]}>{q.slice(0,28)}</text>
              <text x={xs[i]+95} y="136" textAnchor="middle" fontSize="9" fill={colors[i]}>{q.slice(28)}</text>
            </g>
          );
        })}
        {/* Retriever boxes */}
        {[10,185,368].map((x,i) => (
          <g key={i}>
            <line x1={x+95} y1="144" x2={x+95} y2="158" stroke={colors[i]} strokeWidth="1.5" markerEnd={`url(#mq-arrow-${i})`}/>
            <rect x={x+25} y="160" width="140" height="22" rx="6" fill="#313244" stroke="#45475a"/>
            <text x={x+95} y="175" textAnchor="middle" fontSize="10" fill="#6c7086">Retriever {i+1}</text>
          </g>
        ))}
        {/* Merge arrows */}
        <line x1="105" y1="182" x2="248" y2="196" stroke="#94e2d5" strokeWidth="1.5" markerEnd="url(#mq-arrow-merge)"/>
        <line x1="285" y1="182" x2="285" y2="196" stroke="#94e2d5" strokeWidth="1.5" markerEnd="url(#mq-arrow-merge)"/>
        <line x1="463" y1="182" x2="330" y2="196" stroke="#94e2d5" strokeWidth="1.5" markerEnd="url(#mq-arrow-merge)"/>
        {/* Union box */}
        <rect x="185" y="198" width="210" height="22" rx="6" fill="#313244" stroke="#94e2d5" strokeWidth="1.5"/>
        <text x="290" y="213" textAnchor="middle" fontSize="10" fill="#94e2d5">Union of results</text>
      </svg>
    </div>
  );
}

const CODE_HYDE = `hyde_prompt = """Write a short, direct answer to this question as if you were an expert.
It will be used to find similar documents, not shown to the user.
Question: {question}"""

# Embed the hypothetical answer — not the original query
hyde_embedder = HypotheticalDocumentEmbedder.from_llm(
    llm=llm, base_embeddings=OpenAIEmbeddings(), custom_prompt=hyde_prompt
)
retriever = Chroma(embedding_function=hyde_embedder).as_retriever()`;

const CODE_MULTI_QUERY = `retriever = MultiQueryRetriever.from_llm(retriever=base_retriever, llm=llm)
# "2BHK in Bandra under 2Cr" generates:
# → "2 bedroom apartment Bandra price less than 2 crore"
# → "flat for sale Bandra west 2 bedroom budget 2Cr"`;

const CODE_SELF_QUERY = `retriever = SelfQueryRetriever.from_llm(llm, vectorstore, "Property listings", metadata_field_info)
# "3BHK in Mumbai under 2Cr" →
#   semantic_query: "3 bedroom apartment"
#   filter: city=="Mumbai" AND bedrooms==3 AND price<=20000000`;

const CODE_CRAG = `def corrective_retriever(query: str) -> list[Document]:
    docs = vectorstore.similarity_search_with_score(query, k=3)
    relevant_docs = []
    for doc, score in docs:
        # Use Haiku not Sonnet — binary yes/no question doesn't need reasoning capability
        # Haiku: $0.00025/call vs Sonnet: $0.003/call = ~20x cheaper per grading call
        grading = haiku_llm.invoke(
            f"Is this relevant to '{query}'? Answer yes/no.\\n{doc.page_content}"
        ).content.lower()
        if grading.startswith("yes"):
            relevant_docs.append(doc)
    if not relevant_docs:
        return web_search_retriever(query)  # fallback to live search
    return relevant_docs`;

const CODE_ADAPTIVE_RAG = `def route_query(query: str) -> str:
    return llm.invoke(
        f"""Classify as one word:
        - "local": answer from property database
        - "general": requires general real estate knowledge
        - "calculation": needs arithmetic (EMI, ROI)
        Query: {query}"""
    ).content.strip()

def adaptive_rag(query: str) -> str:
    route = route_query(query)
    context = {
        "local":       lambda q: vectorstore.similarity_search(q),
        "general":     lambda q: web_search(q),
        "calculation": lambda q: None,
    }[route](query)
    return generate_answer(query, context)`;

const CODE_SELF_RAG = `def self_rag(query: str) -> str:
    needs_retrieval = llm.invoke(
        f"Does answering '{query}' require looking up specific data? yes/no"
    ).content.lower().startswith("yes")

    if needs_retrieval:
        docs = vectorstore.similarity_search(query)
        return rag_chain.invoke({"question": query, "context": docs})
    return llm.invoke(query).content  # skip retrieval for factual/reasoning queries`;

const CODE_RERANKING = `# Cohere rerank (managed, best quality)
from cohere import Client
results = Client().rerank(
    model="rerank-english-v3.0", query=query,
    documents=[d.page_content for d in docs], top_n=3,
)
reranked = [docs[r.index] for r in results.results]

# FlashRank (self-hosted, free)
from flashrank import Ranker, RerankRequest
ranker = Ranker(model_name="ms-marco-MiniLM-L-12-v2")
results = ranker.rerank(RerankRequest(query=query,
    passages=[{"id": i, "text": d.page_content} for i, d in enumerate(docs)]))`;

const PIPELINE_DIAGRAM = `── Two-Stage Retrieval Pipeline ─────────────────────────────────────────────

User query: "3BHK sea view flat under ₹2Cr in Bandra West"
        │
        ▼ embed query (bi-encoder, ~5ms)
        │
STAGE 1: RETRIEVAL (Bi-encoder) — optimise recall
        │  query_vector = embed("3BHK sea view ...")
        │  ANN search over 100K property vectors
        │  → returns 20 candidate docs (fast: ~1ms)
        │
        │  Problem: bi-encoder misses "sea view" vs "garden view" distinction
        │  because vectors were encoded independently
        │
        ▼
 [20 candidates: some relevant, some not]
        │
STAGE 2: RERANKING (Cross-encoder) — optimise precision
        │  For each of 20 docs:
        │    score = cross_encoder(query + doc)  ← reads them TOGETHER
        │  Sort by score, keep top 3
        │  ~50-150ms (20 cross-encoder calls, each ~5ms)
        │
        ▼
 [TOP 3 highly relevant docs] → inject into LLM system prompt

Why not cross-encoder for stage 1?
  10,000 docs × 5ms = 50,000ms = 50 seconds — not viable online.
  20 docs × 5ms = 100ms — acceptable as reranking step.`;

export function Mod38() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Apply HyDE, multi-query, and step-back prompting to fix retrieval failures</li>
          <li>Implement Corrective RAG (CRAG) with LLM-graded relevance + web fallback</li>
          <li>Build an adaptive RAG router that dispatches by query type</li>
          <li>Explain Self-RAG's retrieve-only-when-needed pattern</li>
          <li>Use cross-encoder reranking to improve precision after broad retrieval</li>
          <li>Diagnose RAG failures systematically using RAGAS metrics</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~85 minutes</span>
          <span className="obj-diff">Difficulty: ★★★★☆</span>
          <span className="obj-diff">Prerequisites: Modules 27, 28</span>
        </div>
      </div>

      <div className="callout callout-info">
        <strong>Housing.com Context</strong><br />
        Not in Housing.com's current stack. Relevant when moving from structured property search to unstructured semantic search over reviews, news, and locality guides — where HyDE and CRAG address the retrieval quality problems that arise.
      </div>

      <HydeViz />

      <h2>31.1 Query Transformation</h2>
      <div className="callout callout-info">
        <strong>HyDE — why it closes the vocabulary gap</strong>
        Direct embedding problem: Query "What is the rental yield in Bandra?" lives in question space.
        Documents about rental yields are written as answers: "The gross rental yield in Bandra West
        averages 3.2% as of Q2 2024." These two vectors may not be close in embedding space because
        one is a question, one is a fact-statement.
        <br /><br />
        HyDE approach: generate a hypothetical answer: "Rental yields in Bandra typically range from
        2.8%–3.5% depending on property type and floor..." → embed this. The hypothetical is in answer
        space — same vocabulary and sentence structure as real documents → much closer cosine similarity.
        <br /><br />
        Tradeoff: one extra LLM call per query (latency + cost). Worth it when your query vocabulary
        differs significantly from your document vocabulary — e.g., users ask in colloquial Hindi/English,
        documents are written in formal real estate language.
      </div>
      <p><strong>HyDE — Hypothetical Document Embedding:</strong> generate a hypothetical answer, embed that instead of the bare query. The hypothesis uses domain vocabulary → better vector match.</p>
      <CodeBlock title="HyDE — Hypothetical Document Embedder Setup" language="python" keyLine={3} keyNote="embed the hypothesis, not the bare query">{CODE_HYDE}</CodeBlock>
      <MultiQueryViz />
      <p><strong>Multi-Query Retriever:</strong> generate 3–5 query reformulations, retrieve for each, union results for higher recall.</p>
      <CodeBlock title="Multi-Query Retriever" language="python" keyLine={1} keyNote="one query fans out to multiple reformulations">{CODE_MULTI_QUERY}</CodeBlock>
      <p><strong>Self-Query Retrieval:</strong> parses natural language into semantic query + metadata filters simultaneously.</p>
      <CodeBlock title="Self-Query Retriever with Metadata Filters" language="python" keyLine={3} keyNote="natural language parsed into semantic query plus metadata filter">{CODE_SELF_QUERY}</CodeBlock>

      <h2>31.2 Corrective RAG (CRAG)</h2>
      <p>Standard RAG has a silent failure mode: the vector search returns documents that look semantically similar but are actually irrelevant to the specific question. The model then confidently answers based on bad context. <strong>CRAG (Corrective RAG)</strong> adds a grading step — an LLM evaluates each retrieved document and decides if it genuinely answers the query. If none pass, CRAG falls back to live web search instead of hallucinating from poor context.</p>
      <p>Think of it like a <code>filter()</code> call with an AI-powered predicate: <code>{"docs.filter(doc => llm.grade(doc, query) === \"relevant\")"}</code>, plus a fallback data source when the filter returns an empty array. The grading calls use a cheap model (Haiku) because it's a binary yes/no decision — no reasoning depth needed.</p>
      <CodeBlock title="Corrective RAG — LLM-Graded Retrieval with Web Fallback" language="python" keyLine={6} keyNote="Haiku grades relevance: binary yes/no, 20x cheaper than Sonnet">{CODE_CRAG}</CodeBlock>

      <h2>31.3 Adaptive RAG</h2>
      <p>Not every query needs the same retrieval strategy. "What is the EMI on a ₹1Cr loan?" needs arithmetic — retrieving property listings is wasteful. "What's the current market trend in Bandra?" needs live web search — your local vector store has stale data. "List 3BHK apartments under ₹2Cr in Powai" needs your property database.</p>
      <p><strong>Adaptive RAG</strong> adds a classification step before retrieval — it acts as a router, dispatching each query to the right data source. This is the same pattern as an API gateway or an Express router: classify the request type, then dispatch to the appropriate handler. The classification call is cheap (one short prompt to a fast model); the savings from routing calculation queries away from the vector store more than offset it.</p>
      <CodeBlock title="Adaptive RAG Router — Dispatch by Query Type" language="python" keyLine={3} keyNote="classifier routes to local, general, or calculation handler">{CODE_ADAPTIVE_RAG}</CodeBlock>

      <h2>31.4 Self-RAG — Retrieve Only When Needed</h2>
      <p>Standard RAG retrieves context for <em>every</em> query, regardless of whether it's needed. For "What is the standard stamp duty rate in Maharashtra?" — the LLM already knows this; retrieval adds 50–200ms and $0.001 of cost with no benefit. <strong>Self-RAG</strong> challenges the assumption that retrieval is always necessary.</p>
      <p>The pattern is a pre-retrieval gate: before doing any search, ask the LLM "do you actually need external data to answer this?" — if no, generate directly. Think of it like a conditional <code>useEffect</code> in React: only fetch when the data you need isn't already available. Studies show 30–40% of chatbot queries are factual or computational and don't benefit from retrieval. Self-RAG eliminates that cost.</p>
      <CodeBlock title="Self-RAG — Pre-Retrieval Gate" language="python" keyLine={2} keyNote="ask the LLM before retrieving: is external data actually needed?">{CODE_SELF_RAG}</CodeBlock>

      <h2>31.5 Reranking</h2>
      <div className="callout callout-info" style={{fontFamily:'monospace',fontSize:'12px',lineHeight:1.8,whiteSpace:'pre'}}>
        {PIPELINE_DIAGRAM}
      </div>
      <div className="callout callout-info">
        <strong>Bi-encoder vs cross-encoder — the speed/accuracy tradeoff</strong>
        <table>
          <tbody>
            <tr><th></th><th>Bi-encoder (embedding model)</th><th>Cross-encoder (reranker)</th></tr>
            <tr><td>Encoding</td><td>Query and document encoded SEPARATELY into vectors</td><td>Query + document encoded TOGETHER in one pass</td></tr>
            <tr><td>Comparison</td><td>Cosine similarity of independent vectors</td><td>Model scores the Q↔D pair directly</td></tr>
            <tr><td>Speed</td><td>Fast — doc vectors pre-computed offline</td><td>Slow — must run for every (query, doc) pair</td></tr>
            <tr><td>Latency at 10K docs</td><td>~1ms (vector lookup)</td><td>~2,000ms (10,000 model calls)</td></tr>
            <tr><td>Quality</td><td>Good — misses subtle Q↔D interactions</td><td>Better — "reads" query and doc together like a human</td></tr>
            <tr><td>Use case</td><td>First-stage retrieval (recall-optimised)</td><td>Second-stage reranking (precision-optimised)</td></tr>
          </tbody>
        </table>
        <strong>Production pattern:</strong> Bi-encoder retrieves k=20 candidates fast → Cross-encoder reranks to top 3 accurate. Never run cross-encoder over all 10K docs — it is O(n) with high constant.
      </div>
      <CodeBlock title="Cross-Encoder Reranking — Cohere vs FlashRank" language="python" keyLine={3} keyNote="rerank-english-v3.0 reads query and doc together for precision">{CODE_RERANKING}</CodeBlock>
      <p><strong>Pattern:</strong> retrieve k=10 → rerank → take top 3 for generation. Vector cosine ≠ relevance to the specific question. Cross-encoder understands the Q↔D relationship accurately.</p>

      <h2>31.6 Systematic RAG Diagnosis</h2>
      <table>
        <tbody>
          <tr><th>RAGAS metric low</th><th>Root cause</th><th>Fix</th></tr>
          <tr><td>context_precision</td><td>Irrelevant chunks retrieved</td><td>Shrink chunk_size, add metadata filters, use self-query</td></tr>
          <tr><td>context_recall</td><td>Relevant chunks missed</td><td>Increase k, use hybrid BM25+vector, multi-query</td></tr>
          <tr><td>faithfulness</td><td>Model hallucinating beyond context</td><td>Lower temperature to 0, add "only from context below" instruction, require citations</td></tr>
          <tr><td>answer_relevance</td><td>Answer is off-topic</td><td>Check query passing, add rewriting step</td></tr>
          <tr><td>All scores low</td><td>Dataset / indexing problem</td><td>Review chunk quality, embedding model, document loading</td></tr>
        </tbody>
      </table>

      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection</strong>
        "How do you debug a RAG pipeline with poor answers?" → Start with RAGAS to isolate retrieval vs generation. "context_recall &lt; 0.7 → retrieval problem: increase k or use hybrid search. faithfulness &lt; 0.7 → generation problem: temperature 0 + stricter prompt." Then demonstrate CRAG or adaptive routing for production robustness.
      </div>

      <QuizSection moduleId={31} title="Module 31: Advanced RAG" contentHint="HyDE hypothetical document embedding domain vocabulary gap, multi-query retriever 3-5 reformulations union recall improvement, self-query structured filter plus semantic query, CRAG corrective RAG LLM grading relevance web fallback, adaptive RAG routing local general calculation, self-RAG retrieve only when needed no unnecessary retrieval, cross-encoder reranking retrieve 10 rerank to 3 pattern, FlashRank vs Cohere rerank cost tradeoff, RAGAS diagnosis context_precision recall faithfulness answer_relevance root causes" />
    </>
  );
}
