import { useState } from 'react';
import { QuizSection } from "../components/QuizSection";

function LlamaIndexStackViz() {
  const [hovered, setHovered] = useState<number | null>(null);

  const layers = [
    {label:'QueryEngine', sublabel:'Retriever + synthesizer → final answer', color:'#cba6f7', y:20},
    {label:'Retriever', sublabel:'Query → TopK or graph traversal — finds relevant nodes', color:'#f9e2af', y:76},
    {label:'Index', sublabel:'VectorStoreIndex / PropertyGraphIndex — your search index', color:'#a6e3a1', y:132},
    {label:'Node', sublabel:'Chunked text with metadata — the unit of retrieval', color:'#94e2d5', y:188},
    {label:'Document', sublabel:'Raw PDF, HTML, API response — your data source', color:'#89b4fa', y:244},
  ];

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>LLAMAINDEX FIVE-LAYER STACK — FROM RAW DATA TO QUERY ANSWER</div>
      <style>{`
        @keyframes dashFlow46a { to { stroke-dashoffset: -14; } }
        .dash-anim-46a { animation: dashFlow46a 1s linear infinite; }
      `}</style>
      <svg viewBox="0 0 520 310" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="LlamaIndex five-layer stack diagram">
        <defs>
          <marker id="arrow-46-up" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#6c7086"/>
          </marker>
          <marker id="arrow-46-mauve" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#cba6f7"/>
          </marker>
          <marker id="arrow-46-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#89b4fa"/>
          </marker>
        </defs>

        {/* Layers drawn bottom to top visually, but array top-to-bottom = top layer first */}
        {layers.map((layer, i) => (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{cursor:'pointer'}}>
            <rect
              x="60" y={layer.y} width="320" height="46"
              rx="6"
              fill={hovered === i ? layer.color + '33' : '#1e1e2e'}
              stroke={layer.color}
              strokeWidth={hovered === i ? 2 : 1.5}
            />
            <text x="80" y={layer.y + 20} fontSize="12" fill={layer.color} fontWeight="700">{layer.label}</text>
            <text x="80" y={layer.y + 36} fontSize="10" fill={hovered === i ? '#cdd6f4' : '#bac2de'}>{layer.sublabel}</text>
            {/* Layer number badge */}
            <rect x="62" y={layer.y + 14} width="14" height="14" rx="3" fill={layer.color + '44'}/>
            <text x="69" y={layer.y + 25} fontSize="9" fill={layer.color} textAnchor="middle">{5-i}</text>
          </g>
        ))}

        {/* Up arrows between layers */}
        {[0,1,2,3].map(i => (
          <line
            key={i}
            x1="220" y1={layers[i].y + 46}
            x2="220" y2={layers[i+1].y + 2}
            stroke="#45475a" strokeWidth="1.5"
            markerEnd="url(#arrow-46-up)"
          />
        ))}

        {/* Query arrow coming from right at QueryEngine */}
        <line x1="490" y1="43" x2="382" y2="43" stroke="#cba6f7" strokeWidth="1.5" strokeDasharray="4 3" className="dash-anim-46a" markerEnd="url(#arrow-46-mauve)"/>
        <text x="492" y="40" fontSize="10" fill="#cba6f7" textAnchor="start">Query</text>
        <text x="492" y="52" fontSize="9" fill="#6c7086" textAnchor="start">→ in</text>

        {/* Answer arrow going out from top */}
        <line x1="220" y1="18" x2="220" y2="4" stroke="#cba6f7" strokeWidth="1.5" markerEnd="url(#arrow-46-mauve)"/>
        <text x="240" y="12" fontSize="10" fill="#cba6f7">Answer</text>

        {/* Data flows up annotation */}
        <text x="10" y="160" fontSize="9" fill="#6c7086" textAnchor="middle" transform="rotate(-90, 10, 160)">data flows up ↑</text>

        {/* Raw data arrow at bottom */}
        <line x1="220" y1="295" x2="220" y2="292" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#arrow-46-blue)"/>
        <text x="300" y="308" fontSize="10" fill="#89b4fa">PDF / HTML / API</text>
      </svg>
    </div>
  );
}

function IngestionPipelineViz() {
  const [run, setRun] = useState<'first'|'second'>('first');

  const steps = [
    {label:'Documents', color:'#89b4fa', x:8},
    {label:'SentenceSplitter', color:'#94e2d5', x:104},
    {label:'QuestionsAnsweredExtractor', color:'#f9e2af', x:236},
    {label:'DocstoreStrategy\nUPSERTS_AND_DELETE', color:'#cba6f7', x:412},
    {label:'VectorStore', color:'#a6e3a1', x:512},
  ];

  const isSecond = run === 'second';

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>INGESTION PIPELINE — HASH-BASED INCREMENTAL DOCUMENT PROCESSING</div>
      <div style={{marginBottom:'12px'}}>
        {(['first','second'] as const).map(r => (
          <button
            key={r}
            onClick={() => setRun(r)}
            style={{
              background: run===r ? '#89b4fa22' : '#313244',
              color: run===r ? '#89b4fa' : '#cdd6f4',
              border: `1px solid ${run===r ? '#89b4fa' : '#45475a'}`,
              borderRadius:'6px',
              padding:'5px 12px',
              fontSize:'0.78rem',
              cursor:'pointer',
              marginRight:'8px',
            }}
          >
            {r === 'first' ? 'First Run (full processing)' : 'Second Run (cached)'}
          </button>
        ))}
      </div>
      <style>{`
        @keyframes dashFlow46b { to { stroke-dashoffset: -14; } }
        .dash-anim-46b { animation: dashFlow46b 1s linear infinite; }
      `}</style>
      <svg viewBox="0 0 560 180" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Ingestion pipeline caching diagram">
        <defs>
          <marker id="arrow-46b-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#89b4fa"/>
          </marker>
          <marker id="arrow-46b-gray" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#45475a"/>
          </marker>
          <marker id="arrow-46b-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#a6e3a1"/>
          </marker>
          <marker id="arrow-46b-yellow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#f9e2af"/>
          </marker>
        </defs>

        {/* Pipeline boxes */}
        {/* Documents */}
        <rect x="8" y="30" width="84" height="36" rx="6" fill="#1e1e2e" stroke="#89b4fa" strokeWidth="1.5"/>
        <text x="50" y="50" fontSize="10" fill="#89b4fa" textAnchor="middle" fontWeight="700">Documents</text>
        <text x="50" y="62" fontSize="8" fill="#6c7086" textAnchor="middle">3 files</text>

        {/* SentenceSplitter */}
        <rect x="104" y="30" width="88" height="36" rx="6" fill="#1e1e2e" stroke={isSecond ? '#45475a' : '#94e2d5'} strokeWidth="1.5"/>
        <text x="148" y="50" fontSize="9" fill={isSecond ? '#45475a' : '#94e2d5'} textAnchor="middle" fontWeight="600">SentenceSplitter</text>
        <text x="148" y="62" fontSize="8" fill={isSecond ? '#45475a' : '#6c7086'} textAnchor="middle">{isSecond ? 'CACHED ✓' : 'chunk text'}</text>

        {/* QuestionsAnsweredExtractor */}
        <rect x="204" y="20" width="110" height="56" rx="6" fill="#1e1e2e" stroke={isSecond ? '#45475a' : '#f9e2af'} strokeWidth="1.5"/>
        <text x="259" y="38" fontSize="9" fill={isSecond ? '#45475a' : '#f9e2af'} textAnchor="middle" fontWeight="600">QuestionsAnswered</text>
        <text x="259" y="52" fontSize="9" fill={isSecond ? '#45475a' : '#f9e2af'} textAnchor="middle" fontWeight="600">Extractor</text>
        <text x="259" y="68" fontSize="8" fill={isSecond ? '#45475a' : '#6c7086'} textAnchor="middle">{isSecond ? 'SKIPPED — hash match' : 'LLM: 3 Q/node'}</text>

        {/* DocstoreStrategy */}
        <rect x="326" y="30" width="110" height="36" rx="6" fill="#1e1e2e" stroke="#cba6f7" strokeWidth="1.5"/>
        <text x="381" y="47" fontSize="9" fill="#cba6f7" textAnchor="middle" fontWeight="600">DocstoreStrategy</text>
        <text x="381" y="60" fontSize="8" fill="#6c7086" textAnchor="middle">UPSERTS_AND_DELETE</text>

        {/* VectorStore */}
        <rect x="448" y="30" width="100" height="36" rx="6" fill="#1e1e2e" stroke="#a6e3a1" strokeWidth="1.5"/>
        <text x="498" y="50" fontSize="10" fill="#a6e3a1" textAnchor="middle" fontWeight="700">VectorStore</text>
        <text x="498" y="62" fontSize="8" fill="#6c7086" textAnchor="middle">Chroma / Redis</text>

        {/* Connector arrows */}
        <line x1="93" y1="48" x2="102" y2="48" stroke={isSecond ? '#45475a' : '#89b4fa'} strokeWidth="1.5" markerEnd={isSecond ? 'url(#arrow-46b-gray)' : 'url(#arrow-46b-blue)'}/>
        <line x1="193" y1="48" x2="202" y2="48" stroke={isSecond ? '#45475a' : '#94e2d5'} strokeWidth="1.5" markerEnd={isSecond ? 'url(#arrow-46b-gray)' : 'url(#arrow-46b-yellow)'}/>
        <line x1="315" y1="48" x2="324" y2="48" stroke={isSecond ? '#45475a' : '#f9e2af'} strokeWidth="1.5" markerEnd={isSecond ? 'url(#arrow-46b-gray)' : 'url(#arrow-46b-blue)'}/>
        <line x1="437" y1="48" x2="446" y2="48" stroke="#cba6f7" strokeWidth="1.5" markerEnd="url(#arrow-46b-green)"/>

        {/* Hash mechanism below */}
        <text x="8" y="100" fontSize="10" fill="#6c7086" fontWeight="700">HASH-BASED CACHING</text>

        <rect x="8" y="108" width="160" height="28" rx="4" fill="#313244" stroke="#45475a" strokeWidth="1"/>
        <text x="88" y="126" fontSize="9" fill="#bac2de" textAnchor="middle">hash(content + metadata)</text>

        <line x1="170" y1="122" x2="200" y2="122" stroke="#45475a" strokeWidth="1.5" markerEnd="url(#arrow-46b-gray)"/>
        <text x="185" y="116" fontSize="8" fill="#6c7086" textAnchor="middle">check</text>

        <rect x="202" y="108" width="140" height="28" rx="4" fill={isSecond ? '#a6e3a122' : '#f38ba822'} stroke={isSecond ? '#a6e3a1' : '#f38ba8'} strokeWidth="1"/>
        <text x="272" y="126" fontSize="9" fill={isSecond ? '#a6e3a1' : '#f38ba8'} textAnchor="middle">
          {isSecond ? 'hash unchanged → skip LLM' : 'hash new → run LLM extraction'}
        </text>

        <line x1="344" y1="122" x2="374" y2="122" stroke={isSecond ? '#a6e3a1' : '#45475a'} strokeWidth="1.5" markerEnd={isSecond ? 'url(#arrow-46b-green)' : 'url(#arrow-46b-gray)'}/>

        <rect x="376" y="108" width="172" height="28" rx="4" fill={isSecond ? '#a6e3a133' : '#313244'} stroke={isSecond ? '#a6e3a1' : '#45475a'} strokeWidth="1"/>
        <text x="462" y="122" fontSize="9" fill={isSecond ? '#a6e3a1' : '#6c7086'} textAnchor="middle" fontWeight={isSecond ? '700' : '400'}>
          {isSecond ? '✓ 0 LLM calls — 100ms' : '~45s, ~1000 LLM calls'}
        </text>
        <text x="462" y="132" fontSize="8" fill={isSecond ? '#a6e3a1' : '#6c7086'} textAnchor="middle">
          {isSecond ? 'vs 45s on first run' : 'for 1000-node corpus'}
        </text>

        {/* Skip arrow on second run */}
        {isSecond && (
          <>
            <path d="M 148 78 Q 259 95 259 105" stroke="#a6e3a1" strokeWidth="1.5" fill="none" strokeDasharray="4 3" className="dash-anim-46b" markerEnd="url(#arrow-46b-green)"/>
            <text x="200" y="94" fontSize="9" fill="#a6e3a1">bypass LLM →</text>
          </>
        )}
      </svg>
      {isSecond && (
        <div style={{marginTop:'10px',padding:'8px 12px',background:'#a6e3a122',border:'1px solid #a6e3a1',borderRadius:'6px',fontSize:'0.78rem',color:'#a6e3a1'}}>
          Second run: 0 LLM calls, 100ms vs 45s on first run — 99.8% time saved on unchanged documents.
        </div>
      )}
    </div>
  );
}

// ── §33.1 Core abstractions ────────────────────────────────────────────────
const CODE_CORE_CONCEPTS = `# LlamaIndex v0.10+ (llama-index-core) — the data framework for LLM applications
# pip install llama-index-core llama-index-llms-anthropic llama-index-embeddings-openai

# ── The five-layer abstraction stack ─────────────────────────────────────────
# 1. Document  — raw input with metadata (file, URL, database row)
# 2. Node      — processed chunk of a Document; has node_id, text, metadata, relationships
# 3. Index     — data structure over Nodes (vector, summary, keyword, graph)
# 4. Retriever — queries an Index to surface relevant Nodes
# 5. QueryEngine — Retriever + ResponseSynthesizer → final answer

from llama_index.core import Document, VectorStoreIndex, Settings
from llama_index.llms.anthropic import Anthropic
from llama_index.embeddings.openai import OpenAIEmbedding

# Global settings (replaces ServiceContext from v0.9)
Settings.llm       = Anthropic(model="claude-haiku-4-5-20251001", temperature=0)
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")
Settings.chunk_size  = 512
Settings.chunk_overlap = 64

# Build an index from raw documents in 3 lines:
documents = [
    Document(text="Bandra West 3BHK prices range ₹2Cr–₹5Cr", metadata={"city": "Mumbai", "area": "Bandra West"}),
    Document(text="Powai is a planned township with Hiranandani Gardens", metadata={"city": "Mumbai", "area": "Powai"}),
]
index = VectorStoreIndex.from_documents(documents)

# Query it:
query_engine = index.as_query_engine()
response = query_engine.query("What is the price of 3BHK in Bandra West?")
print(response)  # synthesised answer
print(response.source_nodes)  # which chunks were retrieved`;

const CODE_VS_LANGCHAIN = `# LlamaIndex vs LangChain — different philosophy, complementary strengths

# LangChain's focus: component chaining and agent orchestration
# → Great at: tool use, agent loops, routing, LangSmith tracing
# → Data layer: retrieve chunks from a vectorstore, pass to chain. Done.

# LlamaIndex's focus: data ingestion, indexing, and structured retrieval
# → Great at: 100+ data connectors, multiple index strategies, query decomposition
# → Orchestration: Workflows (event-driven), basic agents

# ── When to use each ──────────────────────────────────────────────────────────
#  Use LlamaIndex if:
#    - Your primary problem is "get the right data to the LLM"
#    - You have diverse data sources (PDFs, Notion, Slack, databases)
#    - You need multi-step query decomposition (sub-questions, step-by-step)
#    - You want a knowledge graph / property graph index (PropertyGraphIndex)
#
#  Use LangChain/LangGraph if:
#    - You need complex agent loops with tool use
#    - You need HITL, checkpointing, multi-agent coordination
#    - You're already heavily invested in the LangChain ecosystem
#
# ── Best practice: use both ──────────────────────────────────────────────────
#  LlamaIndex handles the DATA LAYER (ingestion → indexing → retrieval)
#  LangGraph handles the ORCHESTRATION LAYER (routing → tools → response → HITL)
#  Bridge: wrap a LlamaIndex QueryEngine as a LangGraph tool

from langchain_core.tools import tool

@tool
def query_property_index(question: str) -> str:
    """Query the property knowledge base using semantic search and synthesis."""
    response = query_engine.query(question)
    return str(response)
# Now pass this tool to ToolNode — LlamaIndex is your RAG backend, LangGraph is your agent`;

// ── §33.2 Data loading ─────────────────────────────────────────────────────
const CODE_DATA_LOADERS = `# LlamaHub: 100+ data connectors (pip install llama-index-readers-*)
# All return List[Document] with metadata auto-populated

# ── File types ────────────────────────────────────────────────────────────────
from llama_index.core import SimpleDirectoryReader

# Recursively loads .pdf, .txt, .md, .csv, .docx, .html from a directory:
documents = SimpleDirectoryReader(
    input_dir   = "rera_filings/",
    recursive   = True,
    required_exts = [".pdf", ".txt"],
    filename_as_id = True,   # uses filename as doc_id for incremental updates
).load_data()

# ── Web / APIs ────────────────────────────────────────────────────────────────
from llama_index.readers.web import SimpleWebPageReader
docs = SimpleWebPageReader(html_to_text=True).load_data(
    urls=["https://example.com/property-guide"]
)

# ── Notion ────────────────────────────────────────────────────────────────────
from llama_index.readers.notion import NotionPageReader
reader = NotionPageReader(integration_token=os.environ["NOTION_TOKEN"])
docs   = reader.load_data(database_id="your-database-id")

# ── Google Drive ──────────────────────────────────────────────────────────────
from llama_index.readers.google import GoogleDriveReader
docs = GoogleDriveReader().load_data(folder_id="folder-id-from-drive")

# ── Databases ─────────────────────────────────────────────────────────────────
from llama_index.readers.database import DatabaseReader
reader = DatabaseReader(sql_database=sqlalchemy_engine)
docs   = reader.load_data(query="SELECT id, title, description FROM properties")

# ── Document metadata enrichment ──────────────────────────────────────────────
for doc in documents:
    doc.metadata["source"]      = "rera_filings"
    doc.metadata["ingested_at"] = datetime.utcnow().isoformat()
    doc.excluded_embed_metadata_keys.append("ingested_at")  # don't embed timestamps
    doc.excluded_llm_metadata_keys.append("ingested_at")    # don't include in LLM context`;

// ── §33.3 Ingestion pipeline ───────────────────────────────────────────────
const CODE_INGESTION_PIPELINE = `from llama_index.core.ingestion import IngestionPipeline, IngestionCache
from llama_index.core.node_parser import (
    SentenceSplitter,
    SemanticSplitterNodeParser,
    MarkdownNodeParser,
)
from llama_index.core.extractors import (
    TitleExtractor,
    QuestionsAnsweredExtractor,
    SummaryExtractor,
)
from llama_index.core.storage.docstore import SimpleDocumentStore
from llama_index.storage.kvstore.redis import RedisKVStore
from llama_index.embeddings.openai import OpenAIEmbedding

# IngestionPipeline: explicit, reusable, cacheable transformation chain
pipeline = IngestionPipeline(
    transformations=[
        # Step 1: parse into nodes (choose one)
        SentenceSplitter(chunk_size=512, chunk_overlap=64),
        # MarkdownNodeParser(),          # preserves heading hierarchy
        # SemanticSplitterNodeParser(embed_model=embed_model),  # topic-aware

        # Step 2: enrich each node with metadata (uses LLM — costs tokens)
        TitleExtractor(nodes=5),          # infer document title from first N nodes
        QuestionsAnsweredExtractor(questions=3),  # LLM generates 3 Q&A per chunk
        SummaryExtractor(summaries=["prev", "self"]),  # per-node summary

        # Step 3: embed
        OpenAIEmbedding(model="text-embedding-3-small"),
    ],
    docstore       = SimpleDocumentStore(),  # deduplication store (skip unchanged docs)
    vector_store   = vector_store,           # target vector store
    cache          = IngestionCache(         # skip nodes already processed
        cache=RedisKVStore.from_host_and_port("localhost", 6379)
    ),
)

nodes = pipeline.run(documents=documents)
# Subsequent runs: unchanged documents are skipped via docstore hash check.
# Modified documents: old nodes removed, new nodes inserted (incremental update).

# ── Why QuestionsAnsweredExtractor matters ────────────────────────────────────
# Each node gets 3 generated questions stored as metadata.
# At retrieval time, the query is matched against BOTH the chunk text AND the questions.
# This dramatically improves recall for chunks that answer a question
# but don't explicitly contain the question's phrasing.
# Cost: ~1 LLM call per node. Only run on expensive/important corpora.`;

// ── §33.4 Index types ──────────────────────────────────────────────────────
const CODE_INDEX_TYPES = `from llama_index.core import (
    VectorStoreIndex,
    SummaryIndex,
    SimpleKeywordTableIndex,
    DocumentSummaryIndex,
)
from llama_index.core.node_parser import SentenceSplitter

# ── VectorStoreIndex: default for semantic retrieval ─────────────────────────
vector_idx = VectorStoreIndex.from_documents(documents)
# → retrieves top-k nodes by cosine similarity
# → best for: "find me chunks relevant to X"

# ── SummaryIndex (formerly ListIndex): iterates ALL nodes ────────────────────
summary_idx = SummaryIndex.from_documents(documents)
# → reads every node in sequence (like reading the full document)
# → best for: "summarise this document" or "what are all the prices mentioned?"
# → expensive on large corpora (passes every chunk to LLM)
# → DO NOT use for retrieval use cases; use for summarisation only

# ── KeywordTableIndex: fast keyword matching ──────────────────────────────────
keyword_idx = SimpleKeywordTableIndex.from_documents(documents)
# → extracts keywords from each node, inverted-index lookup
# → best for: exact keyword searches, no LLM needed for retrieval
# → limitation: misses synonyms, semantic gaps

# ── DocumentSummaryIndex: two-level retrieval ─────────────────────────────────
doc_summary_idx = DocumentSummaryIndex.from_documents(
    documents,
    show_progress=True,
    summary_query="Describe what this RERA filing is about in one paragraph.",
)
# → Step 1: LLM writes a summary for EACH document during indexing
# → Retrieval step 1: find relevant documents by summary similarity
# → Retrieval step 2: retrieve specific nodes from those documents only
# → Best for: large corpora (1000+ documents) where per-document routing first
#             reduces the search space before node-level retrieval

qe = doc_summary_idx.as_query_engine(response_mode="tree_summarize")`;

const CODE_PROPERTY_GRAPH_INDEX = `# PropertyGraphIndex (LlamaIndex 0.10.20+) — builds a knowledge graph from documents
# pip install llama-index-graph-stores-neo4j

from llama_index.core import PropertyGraphIndex
from llama_index.core.indices.property_graph import (
    ImplicitPathExtractor,
    SimpleLLMPathExtractor,
    DynamicLLMPathExtractor,
)
from llama_index.graph_stores.neo4j import Neo4jPropertyGraphStore

# ── Backend: in-memory (dev) or Neo4j (production) ────────────────────────────
from llama_index.core.graph_stores import SimplePropertyGraphStore
graph_store = SimplePropertyGraphStore()  # dev

# Production: Neo4j
graph_store = Neo4jPropertyGraphStore(
    username="neo4j", password=os.environ["NEO4J_PASSWORD"],
    url="bolt://localhost:7687", database="housing"
)

# ── Build the PropertyGraphIndex ──────────────────────────────────────────────
pg_index = PropertyGraphIndex.from_documents(
    documents,
    graph_store = graph_store,
    kg_extractors = [
        # ImplicitPathExtractor: fast, no LLM — uses dependency parsing
        ImplicitPathExtractor(),
        # SimpleLLMPathExtractor: LLM extracts (entity, relation, entity) triples
        SimpleLLMPathExtractor(
            llm=Settings.llm,
            max_paths_per_chunk=10,
            num_workers=4,
        ),
        # DynamicLLMPathExtractor: also infers entity types (Property, Developer, etc.)
        # DynamicLLMPathExtractor(llm=Settings.llm, allowed_entity_types=["Property", "Developer", "Location"]),
    ],
    show_progress=True,
)
# After indexing, Neo4j contains nodes like:
# (:Property {name: "Hiranandani Gardens", price_cr: 3.5})
# (:Developer {name: "Hiranandani Developers"})
# (:Location  {name: "Powai", city: "Mumbai"})
# And relationships: (Property)-[:DEVELOPED_BY]->(Developer)
#                   (Property)-[:LOCATED_IN]->(Location)

# Query using both graph traversal AND vector search:
pg_retriever = pg_index.as_retriever(
    include_text=True,
    similarity_top_k=5,
)
pg_qe = pg_index.as_query_engine(include_text=True)
response = pg_qe.query("Which developers have built properties in Powai?")
# Traverses the graph: MATCH (d:Developer)-[:DEVELOPED_BY]-(p:Property)-[:LOCATED_IN]-(l:Location {name:"Powai"})`;

// ── §33.5 Query engines and transforms ────────────────────────────────────
const CODE_QUERY_ENGINES = `from llama_index.core.query_engine import (
    SubQuestionQueryEngine,
    RetrieverQueryEngine,
    RouterQueryEngine,
)
from llama_index.core.selectors import LLMSingleSelector
from llama_index.core.tools import QueryEngineTool
from llama_index.core.response_synthesizers import get_response_synthesizer, ResponseMode

# ── Response synthesis modes ──────────────────────────────────────────────────
qe_compact     = index.as_query_engine(response_mode=ResponseMode.COMPACT)
# → refine: iteratively improves answer reading each node; best quality, highest cost
# → compact: fits max context in one call; balances quality/cost
# → tree_summarize: builds hierarchical summary; best for long documents
# → no_text: retrieval only, no synthesis (for re-ranking pipelines)
# → accumulate: runs query against each node separately, concatenates answers

# ── Sub-question decomposition (best for complex multi-part questions) ─────────
bandra_tool = QueryEngineTool.from_defaults(
    query_engine=bandra_qe,
    description="Answers questions about Bandra West properties and prices",
)
powai_tool = QueryEngineTool.from_defaults(
    query_engine=powai_qe,
    description="Answers questions about Powai properties and Hiranandani projects",
)
sub_q_engine = SubQuestionQueryEngine.from_defaults(
    query_engine_tools=[bandra_tool, powai_tool],
    verbose=True,
)
# Query: "Compare 3BHK prices in Bandra West vs Powai"
# → LLM generates sub-questions:
#   sub_q_1: "What are 3BHK prices in Bandra West?" → bandra_tool
#   sub_q_2: "What are 3BHK prices in Powai?"       → powai_tool
# → Synthesises comparison from both answers
response = sub_q_engine.query("Compare 3BHK prices in Bandra West vs Powai")

# ── Router engine: route to best index ────────────────────────────────────────
router_engine = RouterQueryEngine(
    selector   = LLMSingleSelector.from_defaults(),
    query_engine_tools = [
        QueryEngineTool.from_defaults(summary_qe, description="Summarise a property document"),
        QueryEngineTool.from_defaults(vector_qe,  description="Search for specific property details"),
        QueryEngineTool.from_defaults(pg_qe,       description="Find relationships between developers and properties"),
    ],
)
# Router LLM reads tool descriptions + query → picks best engine
# Use when you have heterogeneous indexes that serve different question types`;

const CODE_RETRIEVAL_MODES = `from llama_index.core.retrievers import (
    VectorIndexRetriever,
    KeywordTableSimpleRetriever,
    RouterRetriever,
    RecursiveRetriever,
    AutoMergingRetriever,
)
from llama_index.core.postprocessor import (
    SimilarityPostprocessor,
    KeywordNodePostprocessor,
    LLMRerank,
    CohereRerank,
)

# ── Basic retrieval ────────────────────────────────────────────────────────────
retriever = VectorIndexRetriever(index=index, similarity_top_k=10)

# ── Post-processing: filter + rerank AFTER retrieval ──────────────────────────
# SimilarityPostprocessor: drop nodes below cosine threshold
# LLMRerank: use LLM to re-order by relevance (expensive but high quality)
# CohereRerank: use Cohere's reranker API (fast, cheap, high quality)

from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.postprocessor import CohereRerank

reranker = CohereRerank(api_key=os.environ["COHERE_API_KEY"], top_n=3)
qe = RetrieverQueryEngine(
    retriever    = VectorIndexRetriever(index, similarity_top_k=10),
    node_postprocessors = [
        SimilarityPostprocessor(similarity_cutoff=0.7),  # filter low-score chunks
        reranker,  # rerank remaining chunks; keep top 3
    ],
)
# Why: retrieve wide (k=10) then rerank to narrow (top 3) = better precision
# CohereRerank is a cross-encoder; much more accurate than cosine similarity alone

# ── AutoMergingRetriever: retrieve small chunks, return larger parent context ──
from llama_index.core.node_parser import HierarchicalNodeParser, get_leaf_nodes
from llama_index.core.storage.storage_context import StorageContext

# Build: split docs into leaf (256 chars) and parent (1024 chars) nodes
hier_parser  = HierarchicalNodeParser.from_defaults(chunk_sizes=[1024, 256])
nodes        = hier_parser.get_nodes_from_documents(documents)
leaf_nodes   = get_leaf_nodes(nodes)

storage_ctx  = StorageContext.from_defaults()
storage_ctx.docstore.add_documents(nodes)  # store ALL nodes (leaves + parents)
auto_idx = VectorStoreIndex(leaf_nodes, storage_context=storage_ctx)

auto_retriever = AutoMergingRetriever(
    vector_retriever = auto_idx.as_retriever(similarity_top_k=6),
    storage_context  = storage_ctx,
    simple_ratio_thresh = 0.5,   # merge to parent if > 50% of siblings retrieved
)
# Why: short chunks index precisely; full parent returned for context at query time
# Same as LangChain's ParentDocumentRetriever but built into LlamaIndex`;

// ── §33.6 Workflows ────────────────────────────────────────────────────────
const CODE_WORKFLOWS = `# LlamaIndex Workflows: event-driven orchestration (v0.10.20+)
# Alternative to LangGraph for LlamaIndex-native apps
# pip install llama-index-core

from llama_index.core.workflow import (
    Workflow, StartEvent, StopEvent, Event, step, Context
)

# Define events (typed message passing between steps)
class QueryEvent(Event):
    query: str

class RetrievalEvent(Event):
    query: str
    nodes: list

class PropertySearchWorkflow(Workflow):

    @step
    async def classify_query(self, ctx: Context, ev: StartEvent) -> QueryEvent:
        query = ev.get("query", "")
        await ctx.set("original_query", query)   # store in workflow context
        return QueryEvent(query=query)

    @step
    async def retrieve(self, ctx: Context, ev: QueryEvent) -> RetrievalEvent:
        nodes = await retriever.aretrieve(ev.query)
        return RetrievalEvent(query=ev.query, nodes=nodes)

    @step
    async def synthesize(self, ctx: Context, ev: RetrievalEvent) -> StopEvent:
        context_str = "\\n".join(n.get_content() for n in ev.nodes)
        response = await Settings.llm.acomplete(
            f"Context: {context_str}\\n\\nQuestion: {ev.query}\\nAnswer:"
        )
        return StopEvent(result=str(response))

# Run the workflow:
workflow = PropertySearchWorkflow(timeout=30, verbose=True)
result   = await workflow.run(query="Find 3BHK in Bandra under 2Cr")
print(result)

# ── LlamaIndex Workflow vs LangGraph ─────────────────────────────────────────
# LlamaIndex Workflow:
#   + Simpler for pure data/retrieval pipelines
#   + Event types enforce schema between steps
#   + Built-in timeout, streaming, observability
#   - Less tooling for HITL, checkpointing, multi-agent coordination
# LangGraph:
#   + More mature checkpointing (SqliteSaver, PostgresSaver)
#   + HITL interrupt/resume
#   + LangSmith tracing depth
#   + Better multi-agent patterns
# For RAG-centric work: LlamaIndex Workflows
# For agent-centric work with HITL: LangGraph`;

// ── §33.7 LlamaIndex + LangGraph bridge ───────────────────────────────────
const CODE_LANGGRAPH_BRIDGE = `# Pattern: LlamaIndex as the data layer, LangGraph as the orchestration layer

from langchain_core.tools import tool
from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver

# ── Wrap LlamaIndex query engines as LangGraph tools ─────────────────────────
@tool
def search_properties(query: str) -> str:
    """Search the property knowledge base. Returns matching property details."""
    response = vector_query_engine.query(query)
    return str(response)

@tool
def get_rera_info(query: str) -> str:
    """Search RERA filings and legal property documentation."""
    response = rera_query_engine.query(query)
    return str(response)

@tool
def compare_areas(query: str) -> str:
    """Compare properties across different Mumbai localities using sub-question decomposition."""
    response = sub_question_engine.query(query)
    return str(response)

@tool
def find_developer_connections(query: str) -> str:
    """Find relationships between developers, projects, and locations using the knowledge graph."""
    response = property_graph_engine.query(query)
    return str(response)

# ── Build LangGraph agent backed by LlamaIndex indexes ───────────────────────
from langchain_anthropic import ChatAnthropic

llm    = ChatAnthropic(model="claude-haiku-4-5-20251001")
tools  = [search_properties, get_rera_info, compare_areas, find_developer_connections]
agent  = create_react_agent(llm, tools, checkpointer=MemorySaver())

result = agent.invoke(
    {"messages": [HumanMessage("Who developed properties in Powai and what are their 3BHK prices?")]},
    config={"configurable": {"thread_id": "session_1"}},
)
# LangGraph orchestrates: LLM decides to call find_developer_connections,
# gets graph traversal results from LlamaIndex's PropertyGraphIndex,
# then calls search_properties for pricing, synthesises the answer.`;

// ── §33.8 Production patterns ──────────────────────────────────────────────
const CODE_PRODUCTION = `# ── Persistent storage: move away from in-memory ────────────────────────────
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.storage.index_store.redis import RedisIndexStore
from llama_index.storage.docstore.redis import RedisDocumentStore
from llama_index.core.storage.storage_context import StorageContext
import chromadb

chroma_client     = chromadb.HttpClient(host="localhost", port=8000)
chroma_collection = chroma_client.get_or_create_collection("properties")

storage_ctx = StorageContext.from_defaults(
    vector_store  = ChromaVectorStore(chroma_collection=chroma_collection),
    docstore      = RedisDocumentStore.from_host_and_port("localhost", 6379, namespace="docs"),
    index_store   = RedisIndexStore.from_host_and_port("localhost", 6379, namespace="idx"),
)
index = VectorStoreIndex.from_documents(documents, storage_context=storage_ctx)

# Save/load the index (vector store persists in Chroma; metadata in Redis)
# index.storage_context.persist("./storage")
# index = load_index_from_storage(StorageContext.from_defaults(persist_dir="./storage"))

# ── Async for production workloads ────────────────────────────────────────────
async def async_query(question: str) -> str:
    response = await query_engine.aquery(question)
    return str(response)

# Batch queries in parallel:
import asyncio
questions = ["3BHK Bandra price?", "RERA status Powai?", "Developer Hiranandani projects?"]
responses = await asyncio.gather(*[async_query(q) for q in questions])

# ── Incremental updates: add documents without rebuilding ─────────────────────
# Add new documents to existing index:
new_docs = loader.load_data(new_files)
for doc in new_docs:
    index.insert(doc)   # inserts nodes; old nodes unchanged

# Remove stale documents:
index.delete_ref_doc("old_doc_id", delete_from_docstore=True)

# ── Observability with LlamaIndex Callbacks ───────────────────────────────────
from llama_index.core.callbacks import CallbackManager, LlamaDebugHandler, TokenCountingHandler
from llama_index.core import Settings

debug_handler    = LlamaDebugHandler(print_trace_on_end=True)
token_counter    = TokenCountingHandler(tokenizer=tiktoken.encoding_for_model("gpt-4").encode)
Settings.callback_manager = CallbackManager([debug_handler, token_counter])

# After queries: token_counter.total_embedding_token_count, total_llm_token_count`;

export function Mod46() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Map LlamaIndex's five-layer abstraction stack (Document → Node → Index → Retriever → QueryEngine)</li>
          <li>Choose the right index type for your use case: VectorStoreIndex, SummaryIndex, DocumentSummaryIndex, PropertyGraphIndex</li>
          <li>Build an IngestionPipeline with caching, metadata extraction, and incremental updates</li>
          <li>Load data from 100+ sources using LlamaHub connectors</li>
          <li>Apply query transformations: sub-question decomposition, router engine, AutoMergingRetriever</li>
          <li>Use LlamaIndex Workflows for event-driven RAG orchestration</li>
          <li>Wire LlamaIndex query engines as tools inside a LangGraph agent</li>
          <li>Deploy with persistent storage (Chroma + Redis) and async production patterns</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~100 minutes</span>
          <span className="obj-diff">Difficulty: ★★★★☆</span>
          <span className="obj-diff">Prerequisites: Module 27 (RAG Architectures), Module 22 (LangChain Ecosystem)</span>
        </div>
      </div>

      <div className="callout callout-info">
        <strong>Why LlamaIndex and not just LangChain?</strong>
        LangChain treats data retrieval as one component in a chain. LlamaIndex was purpose-built for the data problem: it has 10 index strategies, 100+ data connectors, query decomposition, hierarchical retrieval, and a first-class knowledge graph index. In practice: use LlamaIndex to solve "which chunks to fetch and how to synthesise them," use LangGraph to solve "which tools to call and in what order." The two compose cleanly.
      </div>

      <div className="callout callout-info">
        <strong>Housing.com Upgrade Context</strong><br />
        The current Housing.com chatbot loads property data from Housing APIs at query time (pre-fetch + residual tool pattern).
        LlamaIndex's <code>IngestionPipeline</code> with hash deduplication would replace this with a pre-indexed vector store,
        cutting retrieval latency from 200ms to ~20ms. The <code>PropertyGraphIndex</code> then adds entity relationship queries
        ("all developer X projects in locality Y") that the flat vector search cannot answer today.
      </div>

      <LlamaIndexStackViz />

      <h2>33.1 Core Abstractions — The Five-Layer Stack</h2>
      <pre><code className="language-python">{CODE_CORE_CONCEPTS}</code></pre>
      <div className="callout callout-tip">
        <strong>LlamaIndex v0.10+ API changes</strong>
        Version 0.10 (Jan 2024) introduced <code>llama-index-core</code> as the base package. The monolithic <code>llama-index</code> package was split into 100+ integration packages (<code>llama-index-llms-anthropic</code>, <code>llama-index-embeddings-openai</code>, etc.). <code>ServiceContext</code> was replaced by global <code>Settings</code>. Code examples in blogs before 2024 use the old API — port them by replacing <code>ServiceContext.from_defaults(llm=...)</code> with <code>Settings.llm = ...</code>.
      </div>

      <h3>33.1.1 LlamaIndex vs LangChain — When to Use Which</h3>
      <pre><code className="language-python">{CODE_VS_LANGCHAIN}</code></pre>

      <h2>33.2 Data Loading — LlamaHub Connectors</h2>
      <p>LlamaHub provides 100+ data loaders. All return <code>List[Document]</code> with metadata auto-populated. Install with <code>pip install llama-index-readers-web</code> (or the specific reader package).</p>
      <pre><code className="language-python">{CODE_DATA_LOADERS}</code></pre>

      <IngestionPipelineViz />

      <h2>33.3 Ingestion Pipeline — Transform, Enrich, Cache</h2>
      <p>The <code>IngestionPipeline</code> makes your processing chain explicit, reusable, and incremental. Documents are hashed on entry; unchanged documents skip all transformation steps on subsequent runs.</p>
      <pre><code className="language-python">{CODE_INGESTION_PIPELINE}</code></pre>
      <div className="callout callout-warn">
        <strong>QuestionsAnsweredExtractor cost trap</strong>
        Each call to <code>QuestionsAnsweredExtractor</code> makes one LLM call per node. For a 1000-node corpus with 3 questions each, that's 1000 LLM calls at indexing time (~$0.30 with gpt-4o-mini). The benefit is significant recall improvement — especially for queries that use different phrasing than the source text. Use it on your most important corpora only, and always use <code>IngestionCache</code> so you only pay for new documents.
      </div>

      <h2>33.4 Index Types — Choose the Right Data Structure</h2>
      <pre><code className="language-python">{CODE_INDEX_TYPES}</code></pre>
      <table>
        <tbody>
          <tr><th>Index Type</th><th>How it retrieves</th><th>Best for</th><th>Cost</th></tr>
          <tr><td>VectorStoreIndex</td><td>cosine similarity on embeddings</td><td>Semantic search (default)</td><td>Low</td></tr>
          <tr><td>SummaryIndex</td><td>iterates ALL nodes</td><td>Document summarisation</td><td>High (reads everything)</td></tr>
          <tr><td>KeywordTableIndex</td><td>keyword inverted index</td><td>Exact keyword search</td><td>Very Low</td></tr>
          <tr><td>DocumentSummaryIndex</td><td>summary-routing → node retrieval</td><td>Large corpora (1000+ docs)</td><td>Medium (summary per doc)</td></tr>
          <tr><td>PropertyGraphIndex</td><td>graph traversal + vector hybrid</td><td>Relational questions, entity networks</td><td>High (LLM extraction)</td></tr>
        </tbody>
      </table>

      <h3>33.4.1 PropertyGraphIndex — Knowledge Graph from Text</h3>
      <p>Extracts entities and relationships from documents during indexing; answers relational questions by traversing the graph rather than matching embeddings.</p>
      <pre><code className="language-python">{CODE_PROPERTY_GRAPH_INDEX}</code></pre>

      <h2>33.5 Query Engines, Retrievers &amp; Post-Processing</h2>

      <h3>33.5.1 Response Synthesis Modes &amp; Sub-Question Decomposition</h3>
      <pre><code className="language-python">{CODE_QUERY_ENGINES}</code></pre>
      <div className="callout callout-tip">
        <strong>Sub-question decomposition is LlamaIndex's killer feature</strong>
        Vector search can't answer "Compare 3BHK prices in Bandra vs Powai" with a single embedding lookup — the two areas are in different semantic spaces. <code>SubQuestionQueryEngine</code> decomposes this into two targeted sub-queries, routes each to the right index, and synthesises a comparison. This pattern is hard to replicate cleanly in LangChain without custom code.
      </div>

      <h3>33.5.2 Retrieval Strategies &amp; Reranking</h3>
      <pre><code className="language-python">{CODE_RETRIEVAL_MODES}</code></pre>

      <h2>33.6 Workflows — Event-Driven Orchestration</h2>
      <p>LlamaIndex Workflows provide typed, event-driven step execution as an alternative to LangGraph for LlamaIndex-native applications. Each <code>@step</code> receives a typed Event and returns the next typed Event.</p>
      <pre><code className="language-python">{CODE_WORKFLOWS}</code></pre>

      <h2>33.7 LlamaIndex + LangGraph — The Best-of-Both Pattern</h2>
      <pre><code className="language-python">{CODE_LANGGRAPH_BRIDGE}</code></pre>
      <div className="callout callout-info">
        <strong>The pattern in this codebase</strong>
        This codebase's <code>tool_calls_node</code> wraps a database query. Swapping that for a LlamaIndex <code>SubQuestionQueryEngine</code> would immediately give the pipeline multi-area comparison, RERA knowledge graph traversal, and HyDE query expansion — with zero changes to the LangGraph orchestration layer. The LlamaIndex index types are the data layer; LangGraph is the agent layer. They don't compete.
      </div>

      <h2>33.8 Production Patterns</h2>
      <pre><code className="language-python">{CODE_PRODUCTION}</code></pre>

      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection</strong>
        "Why use LlamaIndex instead of building retrieval from scratch?" → Three structural advantages: (1) IngestionPipeline with hash-based deduplication handles incremental document updates without rebuilding the index; (2) Index type selection — DocumentSummaryIndex routes at document level before node retrieval, cutting both latency and LLM cost on large corpora; (3) PropertyGraphIndex for relational questions — vector search finds similar text, graph traversal finds connected entities. These are all production-relevant capabilities that would take significant engineering to build from scratch. The LlamaIndex + LangGraph bridge means you get both the best data layer and the best orchestration layer.
      </div>

      <QuizSection moduleId={35} title="Module 35: LlamaIndex — Data Pipelines & Patterns" contentHint="Five-layer stack Document Node Index Retriever QueryEngine, Settings replaces ServiceContext v0.10, VectorStoreIndex vs SummaryIndex vs DocumentSummaryIndex vs PropertyGraphIndex use cases, IngestionPipeline transformations caching hash deduplication incremental, QuestionsAnsweredExtractor LLM cost vs recall benefit, AutoMergingRetriever leaf index parent context, SubQuestionQueryEngine decomposition multi-area comparison, RouterQueryEngine description-based routing, CohereRerank post-processor wide retrieve narrow rerank, LlamaIndex Workflow events steps typed, LlamaIndex as LangGraph tool bridge pattern, async aquery production, persistent Chroma Redis storage" />
    </>
  );
}
