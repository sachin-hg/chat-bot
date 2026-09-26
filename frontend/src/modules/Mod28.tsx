import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizSection } from '../components/QuizSection';
import { CodeBlock } from '../components/CodeBlock';

function ChunkingViz() {
  const [mode, setMode] = useState<'fixed'|'semantic'|'markdown'>('fixed');

  const inputText = "Housing.com lists over 50 lakh properties. Our AI chatbot helps buyers find homes. We serve tier 1, 2, and 3 cities. Mumbai, Delhi, and Bangalore are top markets.";
  const mdText    = "## Overview\nHousing.com lists over 50 lakh properties.\n### AI Chatbot\nOur AI chatbot helps buyers find homes.\n## Markets\nMumbai, Delhi, and Bangalore are top markets.";

  type Chunk = { text: string; color: string };

  const fixedChunks: Chunk[] = [
    { text: 'Housing.com lists over 50 lak',    color: '#f38ba8' },
    { text: 'h properties. Our AI chatbot h',   color: '#fab387' },
    { text: 'elps buyers find homes. We ser',   color: '#f9e2af' },
    { text: 've tier 1, 2, and 3 cities. Mu',   color: '#f38ba8' },
    { text: 'mbai, Delhi, and Bangalore are',    color: '#fab387' },
    { text: ' top markets.',                     color: '#f9e2af' },
  ];

  const semanticChunks: Chunk[] = [
    { text: 'Housing.com lists over 50 lakh properties.',    color: '#a6e3a1' },
    { text: 'Our AI chatbot helps buyers find homes.',        color: '#94e2d5' },
    { text: 'We serve tier 1, 2, and 3 cities.',             color: '#89b4fa' },
    { text: 'Mumbai, Delhi, and Bangalore are top markets.', color: '#cba6f7' },
  ];

  const markdownChunks: Chunk[] = [
    { text: '## Overview\nHousing.com lists over 50 lakh properties.', color: '#89b4fa' },
    { text: '### AI Chatbot\nOur AI chatbot helps buyers find homes.',  color: '#cba6f7' },
    { text: '## Markets\nMumbai, Delhi, and Bangalore are top markets.', color: '#a6e3a1' },
  ];

  const chunks = mode === 'fixed' ? fixedChunks : mode === 'semantic' ? semanticChunks : markdownChunks;
  const avgSize = mode === 'fixed' ? '30 chars' : mode === 'semantic' ? '~45 chars' : '~55 chars';
  const note = mode === 'fixed'
    ? 'Word boundaries broken — "lakh" split across chunks. Use only when text has no natural structure.'
    : mode === 'semantic'
    ? 'Each sentence forms a complete semantic unit. Aligned to topic boundaries.'
    : 'Each markdown section is one chunk. Metadata (section name) is filterable in the vector DB.';
  const noteColor = mode === 'fixed' ? '#f38ba8' : '#a6e3a1';

  // Lighter background palette for character highlighting (low opacity)
  const bgPalette = ['#89b4fa33','#a6e3a133','#fab38733','#cba6f733','#94e2d533'];

  // Build array of {char, chunkIdx, isLastInChunk} for character-level rendering
  type CharEntry = { char: string; chunkIdx: number; isLastInChunk: boolean; charIdx: number };
  const charEntries: CharEntry[] = [];
  let globalCharIdx = 0;
  chunks.forEach((chunk, ci) => {
    for (let i = 0; i < chunk.text.length; i++) {
      charEntries.push({
        char: chunk.text[i],
        chunkIdx: ci,
        isLastInChunk: i === chunk.text.length - 1,
        charIdx: globalCharIdx++,
      });
    }
  });

  // In fixed mode, chunk 0 ends "lak" — its last char gets a red right border to mark the split
  const fixedSplitChunkIdx = 0;

  const buttons: {id:'fixed'|'semantic'|'markdown', label:string}[] = [
    { id:'fixed',    label:'Fixed-size (30 chars)' },
    { id:'semantic', label:'Semantic (sentences)'  },
    { id:'markdown', label:'Markdown Headers'      },
  ];

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>CHUNKING STRATEGIES — HOW TEXT SPLITTING AFFECTS RETRIEVAL</div>

      {/* Strategy buttons */}
      <div style={{marginBottom:'14px'}}>
        {buttons.map(b => (
          <button key={b.id} onClick={() => setMode(b.id)}
            style={{
              background: mode===b.id ? '#89b4fa22' : '#313244',
              color:       mode===b.id ? '#89b4fa'   : '#cdd6f4',
              border:      `1px solid ${mode===b.id ? '#89b4fa' : '#45475a'}`,
              borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor:'pointer',marginRight:'8px',
            }}>{b.label}</button>
        ))}
      </div>

      {/* Input text with character-level chunk highlighting */}
      <div style={{marginBottom:'10px'}}>
        <div style={{fontSize:'0.7rem',color:'#6c7086',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.08em'}}>
          Input text — characters coloured by chunk boundary:
        </div>
        <div style={{
          fontFamily:'monospace',
          fontSize:'0.8rem',
          background:'#1e1e2e',
          border:'1px solid #45475a',
          borderRadius:'4px',
          padding:'10px',
          lineHeight:2,
          whiteSpace:'pre-wrap',
          overflowX:'auto',
        }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={mode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {charEntries.map((entry) => {
                const bgColor = bgPalette[entry.chunkIdx % bgPalette.length];
                const pillColor = chunks[entry.chunkIdx].color;
                const isSplitChar = mode === 'fixed' && entry.isLastInChunk && entry.chunkIdx === fixedSplitChunkIdx;
                return (
                  <motion.span
                    key={`${mode}-chunk-${entry.chunkIdx}-char-${entry.charIdx}`}
                    layout
                    style={{
                      background: bgColor,
                      borderRadius: '2px',
                      color: pillColor,
                      ...(isSplitChar ? { borderRight: '2px solid #f38ba8' } : {}),
                    }}
                  >
                    {entry.char}
                  </motion.span>
                );
              })}
            </motion.span>
          </AnimatePresence>
        </div>
        {mode === 'fixed' && (
          <div style={{fontSize:'0.72rem',color:'#f38ba8',marginTop:'4px'}}>
            ↑ "lakh" split: chunk 1 ends "…lak" · chunk 2 starts "h prop…" — red border marks the split point
          </div>
        )}
      </div>

      {/* Chunks */}
      <div style={{marginBottom:'10px'}}>
        <div style={{fontSize:'0.7rem',color:'#6c7086',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.08em'}}>
          Chunks produced: {chunks.length} &nbsp;|&nbsp; Avg size: {avgSize}
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
          {chunks.map((c, i) => (
            <span key={i} style={{
              display:'inline-block',padding:'4px 10px',borderRadius:'4px',
              fontFamily:'monospace',fontSize:'0.79rem',
              border:`1px solid ${c.color}`,background:'#313244',color:c.color,
              whiteSpace:'pre-wrap',maxWidth:'100%',
            }}>
              [{i+1}] {c.text}
            </span>
          ))}
        </div>
      </div>

      {/* Note */}
      <div style={{fontSize:'0.8rem',color:noteColor,background:'#1e1e2e',borderLeft:`3px solid ${noteColor}`,paddingLeft:'10px',paddingTop:'6px',paddingBottom:'6px',borderRadius:'0 4px 4px 0'}}>
        {note}
      </div>
    </div>
  );
}

function RerankerViz() {
  const DOCS = [
    { label:'2BHK Bandra ₹1.95Cr sea-facing',   score:0.94, keep:true  },
    { label:'Bandra West flat 2BHK ₹1.82Cr',    score:0.87, keep:true  },
    { label:'2BHK near Bandra ₹1.78Cr parking', score:0.71, keep:true  },
    { label:'Studio Bandra ₹90L ground floor',   score:0.54, keep:false },
    { label:'3BHK Juhu ₹3.2Cr sea view',         score:0.51, keep:false },
    { label:'2BHK Andheri West ₹1.65Cr',         score:0.48, keep:false },
    { label:'2BHK Powai ₹1.55Cr lake view',      score:0.42, keep:false },
    { label:'1BHK Bandra ₹78L compact',          score:0.38, keep:false },
    { label:'Commercial Bandra 800sqft',          score:0.31, keep:false },
    { label:'3BHK Worli ₹4.5Cr luxury',          score:0.22, keep:false },
  ];

  const [scoredCount, setScoredCount] = useState(0);
  const [done, setDone] = useState(false);
  const [cost, setCost] = useState(0);
  const [running, setRunning] = useState(false);

  function runReranker() {
    if (running) return;
    setScoredCount(0); setDone(false); setCost(0); setRunning(true);
    let i = 0;
    const tick = () => {
      i++;
      setScoredCount(i);
      setCost(parseFloat((i * 0.0001).toFixed(4)));
      if (i < DOCS.length) { setTimeout(tick, 80); }
      else { setDone(true); setRunning(false); }
    };
    setTimeout(tick, 600);
  }

  const KEEP_COLORS = ['#f9e2af','#f9e2af','#f9e2af'];
  const BASE_COLORS = ['#a6e3a1','#94e2d5','#89b4fa'];

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>RERANKING — RETRIEVE BROAD, RERANK PRECISE</div>
      <div style={{display:'flex',gap:'16px',flexWrap:'wrap',marginBottom:'12px'}}>
        {DOCS.map((d, i) => {
          const isScored = i < scoredCount;
          const isTop = done && d.keep;
          const color = isTop ? KEEP_COLORS[DOCS.filter(x=>x.keep).indexOf(d)] : isScored ? BASE_COLORS[i % 3] : '#45475a';
          const barW = isScored ? Math.round(d.score * 120) : 0;
          return (
            <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',width:'100%',
              opacity: i >= scoredCount && !running && scoredCount > 0 ? 0.3 : 1,
              transition:'opacity 0.3s'}}>
              <span style={{color:'#6c7086',fontSize:'0.7rem',minWidth:'22px',fontFamily:'monospace'}}>#{i+1}</span>
              <span style={{fontSize:'0.78rem',color:isTop?'#f9e2af':isScored?'#bac2de':'#6c7086',flex:1,transition:'color 0.3s'}}>{d.label}</span>
              <div style={{width:'120px',height:'8px',background:'#313244',borderRadius:'4px',overflow:'hidden'}}>
                <div style={{width:`${barW}px`,height:'100%',background:color,borderRadius:'4px',transition:'width 0.15s ease,background 0.3s'}}/>
              </div>
              {isScored && <span style={{fontSize:'0.7rem',color:color,minWidth:'36px',fontFamily:'monospace'}}>{d.score.toFixed(2)}</span>}
              {isTop && <span style={{fontSize:'0.65rem',color:'#f9e2af',fontWeight:700}}>★ top3</span>}
            </div>
          );
        })}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
        <button onClick={runReranker} disabled={running}
          style={{background:running?'#45475a':'#313244',color:'#cdd6f4',border:'1px solid #45475a',borderRadius:'6px',padding:'5px 14px',fontSize:'0.78rem',cursor:running?'default':'pointer'}}>
          {running ? 'Scoring...' : done ? '↺ Run again' : '▶ Run Reranker'}
        </button>
        <span style={{fontFamily:'monospace',fontSize:'0.9rem',color:'#a6e3a1'}}>
          ${cost.toFixed(4)}
        </span>
        <span style={{fontSize:'0.72rem',color:'#6c7086'}}>{done ? `${DOCS.length} docs scored — top 3 highlighted` : 'cross-encoder cost'}</span>
      </div>
    </div>
  );
}

const CODE_1 = `from langchain_text_splitters import RecursiveCharacterTextSplitter, TokenTextSplitter

# Default — works for most use cases
splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,       # characters (≈128 tokens)
    chunk_overlap=50,     # 10% overlap preserves sentence continuity
    separators=["\\n\\n", "\\n", ". ", " ", ""],
)

# Token-accurate (use when context window is the constraint)
token_splitter = TokenTextSplitter(chunk_size=256, chunk_overlap=20)`;

const CODE_2 = `from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai import OpenAIEmbeddings

splitter = SemanticChunker(
    embeddings=OpenAIEmbeddings(),
    breakpoint_threshold_type="percentile",  # split at the top 5% of similarity drops
)
chunks = splitter.split_documents(docs)
# Cost: ~1 embedding call per sentence. 10K sentences ≈ $0.02`;

const CODE_3 = `from langchain_text_splitters import MarkdownHeaderTextSplitter

md_splitter = MarkdownHeaderTextSplitter(
    headers_to_split_on=[("##", "section"), ("###", "subsection")],
)
# Each chunk = one markdown section
# metadata: {"section": "Pricing", "subsection": "EMI Options"}
# Metadata becomes filterable in vector DB: filter={"section": "Pricing"}`;

const CODE_4 = `from langchain_text_splitters import Language, RecursiveCharacterTextSplitter

code_splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.PYTHON,   # also: JS, TS, JAVA, GO, RUST, SWIFT, ...
    chunk_size=1500,
    chunk_overlap=100,
)
# Tries: class → function → block → line boundaries (in that order)
# Never splits mid-function — function + docstring + signature = one semantic unit`;

const CODE_5 = `from langchain.retrievers import ParentDocumentRetriever
from langchain.storage import InMemoryStore

retriever = ParentDocumentRetriever(
    vectorstore=vectorstore,
    docstore=InMemoryStore(),            # DEVELOPMENT ONLY — wiped on restart
    child_splitter=RecursiveCharacterTextSplitter(chunk_size=256),
    parent_splitter=RecursiveCharacterTextSplitter(chunk_size=2000),
)
retriever.add_documents(docs)
# Query: finds best 256-token child chunk → returns full 2000-token parent
# Fixes: high context relevance but low faithfulness (LLM lacks full context)`;

const CODE_6 = `# Production: use RedisStore so docstore survives restarts
from langchain_community.storage import RedisStore

docstore = RedisStore(
    redis_url="redis://localhost:6379",
    key_prefix="parent_docs:",          # namespace to avoid key collisions
)

retriever = ParentDocumentRetriever(
    vectorstore=vectorstore,
    docstore=docstore,                  # survives restarts
    child_splitter=RecursiveCharacterTextSplitter(chunk_size=256),
    parent_splitter=RecursiveCharacterTextSplitter(chunk_size=2000),
)

# Initialization order: populate BOTH stores together
retriever.add_documents(docs)           # writes vectors + parent docs atomically

# Pre-flight check before serving traffic
def verify_stores_populated(retriever, sample_query: str) -> bool:
    results = retriever.invoke(sample_query)
    return len(results) > 0             # empty = one store out of sync`;

const CODE_7 = `# MMR: avoid 5 near-identical chunks — balance relevance + diversity
results = vectorstore.max_marginal_relevance_search(
    query, k=5, fetch_k=20,
    lambda_mult=0.5,   # 0=max diversity, 1=max relevance
)

# Cross-encoder reranking: read query + doc together for accurate scoring
from langchain.retrievers.document_compressors import CohereRerank
reranker = CohereRerank(model="rerank-english-v3.0", top_n=3)
# Retrieve 10 cheaply → rerank to top 3 accurately
# Self-hosted alternative: BAAI/bge-reranker-large — free, ~40ms on GPU`;

const CODE_8 = `# pip install ragas datasets`;

const CODE_9 = `from ragas import evaluate
from ragas.metrics import faithfulness, context_precision, answer_relevancy
from datasets import Dataset

# Build eval dataset: 200 question/answer/context triples
data = {
    "question":    ["What is the price of 3BHK in Bandra?", ...],
    "answer":      ["The price is ₹2.5Cr.", ...],        # LLM output
    "contexts":    [["Sea View 3BHK... ₹2.5Cr...", ...], ...],  # retrieved chunks
    "ground_truth":["The correct answer is ₹2.5Cr.", ...],
}
dataset = Dataset.from_dict(data)

# contexts must be actual retrieved chunks, NOT just the final answer
result = evaluate(dataset, metrics=[faithfulness, context_precision, answer_relevancy])
print(result)  # {'faithfulness': 0.82, 'context_precision': 0.68, ...}`;

const CODE_10 = `from ragas.llms import LangchainLLMWrapper
from langchain_anthropic import ChatAnthropic
ragas_llm = LangchainLLMWrapper(ChatAnthropic(model="claude-haiku-4-5-20251001"))
result = evaluate(dataset, metrics=[faithfulness], llm=ragas_llm)`;

export function Mod28() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Identify which failure zone (too small, too large, boundary mismatch) a RAG system is in</li>
          <li>Choose the right splitter: fixed-size, semantic, document-aware, code, or hierarchical</li>
          <li>Implement parent-document retrieval for hierarchical chunk indexing</li>
          <li>Apply MMR and cross-encoder reranking to improve retrieval diversity and accuracy</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~70 minutes</span>
          <span className="obj-diff">Difficulty: ★★★★☆</span>
          <span className="obj-diff">Prerequisites: Module 28, Module 29</span>
        </div>
      </div>
      <div className="callout callout-info">
        <strong>Housing.com Context</strong><br />
        Not in Housing.com's current stack. Relevant when Housing.com adds semantic search over property descriptions or locality guides, where chunk boundary decisions directly impact retrieval precision.
      </div>

      <ChunkingViz />
      <h2>28.1 The Three Chunking Failure Zones</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',margin:'16px 0'}}>
        {[
          {
            zone:'Zone 1',title:'Chunk too small',tokens:'50–100 tokens',
            color:'#f38ba8',score:'ctx_precision: 0.42',
            example:'"The 3BHK at Bandra" ← chunk 1\n"West costs ₹2.5Cr"   ← chunk 2',
            impact:'Query "price of 3BHK Bandra" → chunk 2 alone → incomplete answer. Context precision tanks.',
          },
          {
            zone:'Zone 2',title:'Chunk too large',tokens:'1500–2000 tokens',
            color:'#f9e2af',score:'ctx_relevance: 0.55',
            example:'[Overview][Pricing][Amenities]\n[Parking][Rules][History] ← one chunk',
            impact:'"Lost in the middle" — LLM misses parking info at position 5 of 6. Relevance suffers.',
          },
          {
            zone:'Zone 3',title:'Boundary mismatch',tokens:'any size, wrong cut',
            color:'#fab387',score:'faithfulness: 0.63',
            example:'"The price includes maintenance..." ← ends mid-sentence\n"...charges of ₹5,000/month." ← chunk 2',
            impact:'"What does price include?" → context incoherent. Faithfulness drops as LLM guesses.',
          },
        ].map((z, i) => (
          <div key={i} style={{background:'#181825',border:`1px solid ${z.color}44`,borderLeft:`4px solid ${z.color}`,borderRadius:'8px',padding:'14px'}}>
            <div style={{fontWeight:700,color:z.color,fontSize:'0.8rem',marginBottom:'4px'}}>{z.zone} — {z.title}</div>
            <div style={{fontSize:'0.72rem',color:'#6c7086',marginBottom:'8px'}}>{z.tokens}</div>
            <pre style={{background:'#0d0d14',borderRadius:'4px',padding:'8px',fontSize:'0.72rem',color:'#bac2de',margin:'0 0 8px',lineHeight:1.6,whiteSpace:'pre-wrap'}}>{z.example}</pre>
            <div style={{fontSize:'0.75rem',color:'#a6adc8',marginBottom:'8px',lineHeight:1.5}}>{z.impact}</div>
            <div style={{fontSize:'0.68rem',fontFamily:'monospace',color:z.color,background:`${z.color}11`,padding:'4px 8px',borderRadius:'4px'}}>{z.score}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:'0.78rem',color:'#a6e3a1',background:'#a6e3a111',border:'1px solid #a6e3a133',borderRadius:'6px',padding:'10px 14px',marginBottom:'16px'}}>
        <strong>Optimal:</strong> 256–512 tokens, aligned to natural boundaries. Tuning signal: RAGAS context_precision &lt; 0.7 → chunking problem.
      </div>

      <h2>28.2 Fixed-Size Chunking</h2>
      <CodeBlock title="RecursiveCharacterTextSplitter — Fixed-Size with Overlap" language="python" keyLine={6} keyNote="10% overlap prevents context loss at boundaries">{CODE_1}</CodeBlock>
      <div className="callout callout-warn">
        <strong>The overlap gotcha</strong>{' '}
        Without overlap, a sentence split across a chunk boundary appears only in one chunk. A query matching the second half misses the first half. 10% is the standard starting point; increase to 20% for dense technical content.
      </div>

      <h2>28.3 Semantic Chunking</h2>
      <CodeBlock title="SemanticChunker — Similarity-Driven Splits" language="python" keyLine={4} keyNote="percentile splits at top 5% sharpest similarity drops">{CODE_2}</CodeBlock>
      <div className="callout callout-info">
        <strong>How SemanticChunker actually works</strong>{' '}
        SemanticChunker embeds <em>every sentence</em>, then computes the cosine similarity between adjacent
        sentence pairs. It finds the pairs where similarity drops most sharply — those are the topic
        boundaries. <code>percentile</code> means: split at the top 5% of similarity drops (the largest topic
        shifts). This is why chunks vary in size — a section on pricing might be 2 sentences; a section
        on legal terms might be 20.
        <br /><br />
        <strong>Performance warning:</strong> 10K sentences at <code>batch_size=512</code> takes ~30 seconds and
        ~20K embedding API calls (~$0.02 at text-embedding-3-small rates). For a large corpus, pre-compute
        and cache sentence embeddings. Only use SemanticChunker for documents where you expect abrupt
        topic changes — marketing copy, long-form articles, mixed-topic wiki pages. For structured
        documents (pricing tables, technical specs), <code>MarkdownHeaderTextSplitter</code> is faster and more
        predictable.
      </div>
      <p><strong>When to use:</strong> Dense prose covering 3+ topics per section; when RAGAS context relevance is low despite right-sized fixed chunks. <strong>Not needed</strong> for structured documents with clear headers.</p>

      <h2>28.4 Document-Aware Chunking</h2>
      <CodeBlock title="MarkdownHeaderTextSplitter — Section-Aware Chunking" language="python" keyLine={7} keyNote="metadata makes sections filterable in vector DB">{CODE_3}</CodeBlock>
      <p>Also: <code>HTMLHeaderTextSplitter</code> for web content, <code>PyMuPDFLoader</code> for PDFs (preserves page number in metadata). Use for legal docs (split by clause), technical docs (split by section), web content (split by header tag).</p>

      <h2>28.5 Code Chunking</h2>
      <CodeBlock title="Language-Aware Code Splitter" language="python" keyLine={6} keyNote="never splits mid-function — preserves semantic units">{CODE_4}</CodeBlock>

      <h2>28.6 Hierarchical / Parent-Document Retrieval</h2>
      <p>There's a fundamental tension in chunking that no single chunk size resolves:</p>
      <ul>
        <li><strong>Small chunks (256 tokens)</strong> give high retrieval precision — each chunk covers one specific topic, so similarity search returns exactly the right passage. But when injected into the LLM prompt, a 256-token snippet often lacks surrounding context: a property description without the project brochure header, a price without the floor plan details.</li>
        <li><strong>Large chunks (2,000 tokens)</strong> give the LLM full context — the complete section, table, and surrounding paragraphs. But retrieval precision drops: a 2,000-token chunk covers too many topics, so cosine similarity gets diluted by irrelevant content within the chunk.</li>
      </ul>
      <p>Parent-document retrieval resolves this by <strong>decoupling retrieval from generation</strong>: index small chunks for retrieval (precision), but when a match is found, fetch the large parent chunk for the LLM (context). Think of it like finding a paragraph in a book by searching an index of every sentence, then handing the reader the full page. The small chunk says "this is the right section"; the parent chunk gives the LLM everything it needs to answer well.</p>
      <CodeBlock title="ParentDocumentRetriever — Hierarchical Chunk Indexing (Dev)" language="python" keyLine={4} keyNote="InMemoryStore is wiped on restart — dev only">{CODE_5}</CodeBlock>
      <div className="callout warning">
        <strong>InMemoryStore is not production-ready</strong><br />
        The data model: child chunk vectors store the <em>parent doc ID</em> in their metadata. At query time,
        the retriever looks up that ID in the docstore to fetch the full parent. If the docstore is wiped
        (process restart), the vector store still has chunks but the ID lookup fails silently — retrieval
        returns empty results with no error.
        <CodeBlock title="ParentDocumentRetriever — Redis-Backed Production Store" language="python" keyLine={5} keyNote="key_prefix namespaces docs to avoid key collisions">{CODE_6}</CodeBlock>
      </div>

      <RerankerViz />
      <h2>28.7 MMR and Cross-Encoder Reranking</h2>
      <CodeBlock title="MMR Search and Cross-Encoder Reranking" language="python" keyLine={4} keyNote="lambda_mult=0.5 balances relevance and diversity">{CODE_7}</CodeBlock>
      <div className="callout callout-info">
        <strong>Why MMR matters for Housing.com property search</strong>{' '}
        A property has 10 similar listings. With standard top-5 retrieval, you might get 5 variations of
        the same building (different floors, similar prices). The LLM sees the same facts repeated and
        cannot answer "what other options exist in Bandra?" MMR ensures the 5 results span different
        buildings, price ranges, or localities.
        <br /><br />
        <strong>lambda_mult tuning guide:</strong> <code>lambda_mult=0.7</code> (more relevance) → better for
        question-answering where precision matters. <code>lambda_mult=0.3</code> (more diversity) → better for
        exploratory browsing ("show me options in Andheri"). Start at 0.5.
        <br /><br />
        <strong>Performance:</strong> <code>fetch_k=20</code> is <em>1</em> ANN search returning 20 candidates. MMR
        scoring is then done in-memory across those 20 vectors — it is NOT 20 separate ANN queries.
        The overhead vs standard retrieval is negligible (microseconds of numpy math).
      </div>

      <h2>28.8 The RAGAS-Driven Optimisation Loop</h2>
      <div className="decision-tree">
        <span className="dt-q">Run RAGAS eval (200 samples, ~$1.00, ~3 min)</span>
        <br />{'│'}
        <br />{'├─ '}<span className="dt-q">Context Relevance &lt; 0.7?</span> <span className="dt-note">{'→ retriever returning wrong chunks'}</span>
        <br />{'│   ├─ Try smaller chunk size: 512 → 256 characters (RecursiveCharacterTextSplitter)'}
        <br />{'│   ├─ Try hybrid search (BM25 + vector)'}
        <br />{'│   ├─ Try MultiQueryRetriever or HyDE'}
        <br />{'│   └─ Try better embedding model (BGE-large vs text-embedding-3-small)'}
        <br />{'│'}
        <br />{'├─ '}<span className="dt-q">Faithfulness &lt; 0.7?</span> <span className="dt-note">{'→ LLM adding claims beyond context'}</span>
        <br />{'│   ├─ Add "answer ONLY from provided context" to system prompt'}
        <br />{'│   ├─ Lower temperature (0.5 → 0.2)'}
        <br />{'│   └─ Try parent-document retrieval (larger chunk = more context)'}
        <br />{'│'}
        <br />{'├─ '}<span className="dt-q">Answer Relevance &lt; 0.7?</span> <span className="dt-note">{'→ LLM not answering the specific question'}</span>
        <br />{'│   ├─ Add "Directly answer: {question}" at end of prompt'}
        <br />{'│   └─ Check if turn_history dilutes current query intent'}
        <br />{'│'}
        <br />{'└─ '}<span className="dt-yes">All &gt; 0.7</span>{' → merge'}
      </div>
      <div className="callout callout-info">
        <strong>Complete RAGAS setup for this loop</strong>
        <CodeBlock title="RAGAS Install" language="bash">{CODE_8}</CodeBlock>
        <CodeBlock title="RAGAS Evaluation — 200-Sample Golden Set" language="python" keyLine={13} keyNote="contexts must be retrieved chunks, not just the answer">{CODE_9}</CodeBlock>
        <strong>Cost model:</strong> The ~$1.00 estimate uses GPT-3.5-turbo as the evaluator. GPT-4o costs ~$15 for
        200 samples. To use Claude as evaluator:
        <CodeBlock title="RAGAS with Claude as Evaluator" language="python" keyLine={3} keyNote="swap evaluator LLM without changing eval metrics">{CODE_10}</CodeBlock>
      </div>
      <div className="callout callout-info">
        <strong>Optimisation budget rule</strong>{' '}
        Change one variable at a time. Each RAGAS eval costs ~$1 and 3 minutes. Run as a CI job, not interactively. Never optimise faithfulness and context relevance simultaneously — they can trade off.
      </div>

      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection</strong>{' '}
        "How would you improve a RAG system with low accuracy?" → First diagnose: "low accuracy where — retrieval or generation?" RAGAS context relevance answers retrieval quality; faithfulness answers generation quality. Walk through the fix strategy for each. End with the production feedback loop: online signals → annotation queue → eval set expansion → CI RAGAS gate.
      </div>

      <QuizSection moduleId={30} title="Module 30" contentHint="Three chunking failure zones too small too large boundary mismatch, RecursiveCharacterTextSplitter chunk_size overlap tuning, SemanticChunker when to use vs fixed-size, MarkdownHeaderTextSplitter document-aware chunking, ParentDocumentRetriever hierarchical chunk indexing, MMR lambda_mult diversity vs relevance, cross-encoder reranking retrieve-10-rerank-to-3 pattern, RAGAS diagnostic loop fix strategy per metric" />
    </>
  );
}
