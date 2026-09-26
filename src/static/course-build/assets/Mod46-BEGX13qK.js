import{j as e,r as s}from"./index-D4pJPyGz.js";import{Q as i}from"./QuizSection-BedG7s-t.js";function d(){const[o,a]=s.useState(null),r=[{label:"QueryEngine",sublabel:"Retriever + synthesizer → final answer",color:"#cba6f7",y:20},{label:"Retriever",sublabel:"Query → TopK or graph traversal — finds relevant nodes",color:"#f9e2af",y:76},{label:"Index",sublabel:"VectorStoreIndex / PropertyGraphIndex — your search index",color:"#a6e3a1",y:132},{label:"Node",sublabel:"Chunked text with metadata — the unit of retrieval",color:"#94e2d5",y:188},{label:"Document",sublabel:"Raw PDF, HTML, API response — your data source",color:"#89b4fa",y:244}];return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"LLAMAINDEX FIVE-LAYER STACK — FROM RAW DATA TO QUERY ANSWER"}),e.jsx("style",{children:`
        @keyframes dashFlow46a { to { stroke-dashoffset: -14; } }
        .dash-anim-46a { animation: dashFlow46a 1s linear infinite; }
      `}),e.jsxs("svg",{viewBox:"0 0 520 310",width:"100%",style:{display:"block",margin:"0 auto"},"aria-label":"LlamaIndex five-layer stack diagram",children:[e.jsxs("defs",{children:[e.jsx("marker",{id:"arrow-46-up",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#6c7086"})}),e.jsx("marker",{id:"arrow-46-mauve",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#cba6f7"})}),e.jsx("marker",{id:"arrow-46-blue",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#89b4fa"})})]}),r.map((t,n)=>e.jsxs("g",{onMouseEnter:()=>a(n),onMouseLeave:()=>a(null),style:{cursor:"pointer"},children:[e.jsx("rect",{x:"60",y:t.y,width:"320",height:"46",rx:"6",fill:o===n?t.color+"33":"#1e1e2e",stroke:t.color,strokeWidth:o===n?2:1.5}),e.jsx("text",{x:"80",y:t.y+20,fontSize:"12",fill:t.color,fontWeight:"700",children:t.label}),e.jsx("text",{x:"80",y:t.y+36,fontSize:"10",fill:o===n?"#cdd6f4":"#bac2de",children:t.sublabel}),e.jsx("rect",{x:"62",y:t.y+14,width:"14",height:"14",rx:"3",fill:t.color+"44"}),e.jsx("text",{x:"69",y:t.y+25,fontSize:"9",fill:t.color,textAnchor:"middle",children:5-n})]},n)),[0,1,2,3].map(t=>e.jsx("line",{x1:"220",y1:r[t].y+46,x2:"220",y2:r[t+1].y+2,stroke:"#45475a",strokeWidth:"1.5",markerEnd:"url(#arrow-46-up)"},t)),e.jsx("line",{x1:"490",y1:"43",x2:"382",y2:"43",stroke:"#cba6f7",strokeWidth:"1.5",strokeDasharray:"4 3",className:"dash-anim-46a",markerEnd:"url(#arrow-46-mauve)"}),e.jsx("text",{x:"492",y:"40",fontSize:"10",fill:"#cba6f7",textAnchor:"start",children:"Query"}),e.jsx("text",{x:"492",y:"52",fontSize:"9",fill:"#6c7086",textAnchor:"start",children:"→ in"}),e.jsx("line",{x1:"220",y1:"18",x2:"220",y2:"4",stroke:"#cba6f7",strokeWidth:"1.5",markerEnd:"url(#arrow-46-mauve)"}),e.jsx("text",{x:"240",y:"12",fontSize:"10",fill:"#cba6f7",children:"Answer"}),e.jsx("text",{x:"10",y:"160",fontSize:"9",fill:"#6c7086",textAnchor:"middle",transform:"rotate(-90, 10, 160)",children:"data flows up ↑"}),e.jsx("line",{x1:"220",y1:"295",x2:"220",y2:"292",stroke:"#89b4fa",strokeWidth:"1.5",markerEnd:"url(#arrow-46-blue)"}),e.jsx("text",{x:"300",y:"308",fontSize:"10",fill:"#89b4fa",children:"PDF / HTML / API"})]})]})}function l(){const[o,a]=s.useState("first"),r=o==="second";return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"INGESTION PIPELINE — HASH-BASED INCREMENTAL DOCUMENT PROCESSING"}),e.jsx("div",{style:{marginBottom:"12px"},children:["first","second"].map(t=>e.jsx("button",{onClick:()=>a(t),style:{background:o===t?"#89b4fa22":"#313244",color:o===t?"#89b4fa":"#cdd6f4",border:`1px solid ${o===t?"#89b4fa":"#45475a"}`,borderRadius:"6px",padding:"5px 12px",fontSize:"0.78rem",cursor:"pointer",marginRight:"8px"},children:t==="first"?"First Run (full processing)":"Second Run (cached)"},t))}),e.jsx("style",{children:`
        @keyframes dashFlow46b { to { stroke-dashoffset: -14; } }
        .dash-anim-46b { animation: dashFlow46b 1s linear infinite; }
      `}),e.jsxs("svg",{viewBox:"0 0 560 180",width:"100%",style:{display:"block",margin:"0 auto"},"aria-label":"Ingestion pipeline caching diagram",children:[e.jsxs("defs",{children:[e.jsx("marker",{id:"arrow-46b-blue",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#89b4fa"})}),e.jsx("marker",{id:"arrow-46b-gray",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#45475a"})}),e.jsx("marker",{id:"arrow-46b-green",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#a6e3a1"})}),e.jsx("marker",{id:"arrow-46b-yellow",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#f9e2af"})})]}),e.jsx("rect",{x:"8",y:"30",width:"84",height:"36",rx:"6",fill:"#1e1e2e",stroke:"#89b4fa",strokeWidth:"1.5"}),e.jsx("text",{x:"50",y:"50",fontSize:"10",fill:"#89b4fa",textAnchor:"middle",fontWeight:"700",children:"Documents"}),e.jsx("text",{x:"50",y:"62",fontSize:"8",fill:"#6c7086",textAnchor:"middle",children:"3 files"}),e.jsx("rect",{x:"104",y:"30",width:"88",height:"36",rx:"6",fill:"#1e1e2e",stroke:r?"#45475a":"#94e2d5",strokeWidth:"1.5"}),e.jsx("text",{x:"148",y:"50",fontSize:"9",fill:r?"#45475a":"#94e2d5",textAnchor:"middle",fontWeight:"600",children:"SentenceSplitter"}),e.jsx("text",{x:"148",y:"62",fontSize:"8",fill:r?"#45475a":"#6c7086",textAnchor:"middle",children:r?"CACHED ✓":"chunk text"}),e.jsx("rect",{x:"204",y:"20",width:"110",height:"56",rx:"6",fill:"#1e1e2e",stroke:r?"#45475a":"#f9e2af",strokeWidth:"1.5"}),e.jsx("text",{x:"259",y:"38",fontSize:"9",fill:r?"#45475a":"#f9e2af",textAnchor:"middle",fontWeight:"600",children:"QuestionsAnswered"}),e.jsx("text",{x:"259",y:"52",fontSize:"9",fill:r?"#45475a":"#f9e2af",textAnchor:"middle",fontWeight:"600",children:"Extractor"}),e.jsx("text",{x:"259",y:"68",fontSize:"8",fill:r?"#45475a":"#6c7086",textAnchor:"middle",children:r?"SKIPPED — hash match":"LLM: 3 Q/node"}),e.jsx("rect",{x:"326",y:"30",width:"110",height:"36",rx:"6",fill:"#1e1e2e",stroke:"#cba6f7",strokeWidth:"1.5"}),e.jsx("text",{x:"381",y:"47",fontSize:"9",fill:"#cba6f7",textAnchor:"middle",fontWeight:"600",children:"DocstoreStrategy"}),e.jsx("text",{x:"381",y:"60",fontSize:"8",fill:"#6c7086",textAnchor:"middle",children:"UPSERTS_AND_DELETE"}),e.jsx("rect",{x:"448",y:"30",width:"100",height:"36",rx:"6",fill:"#1e1e2e",stroke:"#a6e3a1",strokeWidth:"1.5"}),e.jsx("text",{x:"498",y:"50",fontSize:"10",fill:"#a6e3a1",textAnchor:"middle",fontWeight:"700",children:"VectorStore"}),e.jsx("text",{x:"498",y:"62",fontSize:"8",fill:"#6c7086",textAnchor:"middle",children:"Chroma / Redis"}),e.jsx("line",{x1:"93",y1:"48",x2:"102",y2:"48",stroke:r?"#45475a":"#89b4fa",strokeWidth:"1.5",markerEnd:r?"url(#arrow-46b-gray)":"url(#arrow-46b-blue)"}),e.jsx("line",{x1:"193",y1:"48",x2:"202",y2:"48",stroke:r?"#45475a":"#94e2d5",strokeWidth:"1.5",markerEnd:r?"url(#arrow-46b-gray)":"url(#arrow-46b-yellow)"}),e.jsx("line",{x1:"315",y1:"48",x2:"324",y2:"48",stroke:r?"#45475a":"#f9e2af",strokeWidth:"1.5",markerEnd:r?"url(#arrow-46b-gray)":"url(#arrow-46b-blue)"}),e.jsx("line",{x1:"437",y1:"48",x2:"446",y2:"48",stroke:"#cba6f7",strokeWidth:"1.5",markerEnd:"url(#arrow-46b-green)"}),e.jsx("text",{x:"8",y:"100",fontSize:"10",fill:"#6c7086",fontWeight:"700",children:"HASH-BASED CACHING"}),e.jsx("rect",{x:"8",y:"108",width:"160",height:"28",rx:"4",fill:"#313244",stroke:"#45475a",strokeWidth:"1"}),e.jsx("text",{x:"88",y:"126",fontSize:"9",fill:"#bac2de",textAnchor:"middle",children:"hash(content + metadata)"}),e.jsx("line",{x1:"170",y1:"122",x2:"200",y2:"122",stroke:"#45475a",strokeWidth:"1.5",markerEnd:"url(#arrow-46b-gray)"}),e.jsx("text",{x:"185",y:"116",fontSize:"8",fill:"#6c7086",textAnchor:"middle",children:"check"}),e.jsx("rect",{x:"202",y:"108",width:"140",height:"28",rx:"4",fill:r?"#a6e3a122":"#f38ba822",stroke:r?"#a6e3a1":"#f38ba8",strokeWidth:"1"}),e.jsx("text",{x:"272",y:"126",fontSize:"9",fill:r?"#a6e3a1":"#f38ba8",textAnchor:"middle",children:r?"hash unchanged → skip LLM":"hash new → run LLM extraction"}),e.jsx("line",{x1:"344",y1:"122",x2:"374",y2:"122",stroke:r?"#a6e3a1":"#45475a",strokeWidth:"1.5",markerEnd:r?"url(#arrow-46b-green)":"url(#arrow-46b-gray)"}),e.jsx("rect",{x:"376",y:"108",width:"172",height:"28",rx:"4",fill:r?"#a6e3a133":"#313244",stroke:r?"#a6e3a1":"#45475a",strokeWidth:"1"}),e.jsx("text",{x:"462",y:"122",fontSize:"9",fill:r?"#a6e3a1":"#6c7086",textAnchor:"middle",fontWeight:r?"700":"400",children:r?"✓ 0 LLM calls — 100ms":"~45s, ~1000 LLM calls"}),e.jsx("text",{x:"462",y:"132",fontSize:"8",fill:r?"#a6e3a1":"#6c7086",textAnchor:"middle",children:r?"vs 45s on first run":"for 1000-node corpus"}),r&&e.jsxs(e.Fragment,{children:[e.jsx("path",{d:"M 148 78 Q 259 95 259 105",stroke:"#a6e3a1",strokeWidth:"1.5",fill:"none",strokeDasharray:"4 3",className:"dash-anim-46b",markerEnd:"url(#arrow-46b-green)"}),e.jsx("text",{x:"200",y:"94",fontSize:"9",fill:"#a6e3a1",children:"bypass LLM →"})]})]}),r&&e.jsx("div",{style:{marginTop:"10px",padding:"8px 12px",background:"#a6e3a122",border:"1px solid #a6e3a1",borderRadius:"6px",fontSize:"0.78rem",color:"#a6e3a1"},children:"Second run: 0 LLM calls, 100ms vs 45s on first run — 99.8% time saved on unchanged documents."})]})}const c=`# LlamaIndex v0.10+ (llama-index-core) — the data framework for LLM applications
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
print(response.source_nodes)  # which chunks were retrieved`,h=`# LlamaIndex vs LangChain — different philosophy, complementary strengths

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
# Now pass this tool to ToolNode — LlamaIndex is your RAG backend, LangGraph is your agent`,m=`# LlamaHub: 100+ data connectors (pip install llama-index-readers-*)
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
    doc.excluded_llm_metadata_keys.append("ingested_at")    # don't include in LLM context`,p=`from llama_index.core.ingestion import IngestionPipeline, IngestionCache
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
# Cost: ~1 LLM call per node. Only run on expensive/important corpora.`,u=`from llama_index.core import (
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

qe = doc_summary_idx.as_query_engine(response_mode="tree_summarize")`,x=`# PropertyGraphIndex (LlamaIndex 0.10.20+) — builds a knowledge graph from documents
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
# Traverses the graph: MATCH (d:Developer)-[:DEVELOPED_BY]-(p:Property)-[:LOCATED_IN]-(l:Location {name:"Powai"})`,g=`from llama_index.core.query_engine import (
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
# Use when you have heterogeneous indexes that serve different question types`,f=`from llama_index.core.retrievers import (
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
# Same as LangChain's ParentDocumentRetriever but built into LlamaIndex`,y=`# LlamaIndex Workflows: event-driven orchestration (v0.10.20+)
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
# For agent-centric work with HITL: LangGraph`,_=`# Pattern: LlamaIndex as the data layer, LangGraph as the orchestration layer

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
# then calls search_properties for pricing, synthesises the answer.`,v=`# ── Persistent storage: move away from in-memory ────────────────────────────
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

# After queries: token_counter.total_embedding_token_count, total_llm_token_count`;function w(){return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"learning-obj",children:[e.jsx("div",{className:"learning-obj-title",children:"After this module you will be able to"}),e.jsxs("ol",{children:[e.jsx("li",{children:"Map LlamaIndex's five-layer abstraction stack (Document → Node → Index → Retriever → QueryEngine)"}),e.jsx("li",{children:"Choose the right index type for your use case: VectorStoreIndex, SummaryIndex, DocumentSummaryIndex, PropertyGraphIndex"}),e.jsx("li",{children:"Build an IngestionPipeline with caching, metadata extraction, and incremental updates"}),e.jsx("li",{children:"Load data from 100+ sources using LlamaHub connectors"}),e.jsx("li",{children:"Apply query transformations: sub-question decomposition, router engine, AutoMergingRetriever"}),e.jsx("li",{children:"Use LlamaIndex Workflows for event-driven RAG orchestration"}),e.jsx("li",{children:"Wire LlamaIndex query engines as tools inside a LangGraph agent"}),e.jsx("li",{children:"Deploy with persistent storage (Chroma + Redis) and async production patterns"})]}),e.jsxs("div",{className:"obj-meta",children:[e.jsx("span",{className:"obj-time",children:"⏱ ~100 minutes"}),e.jsx("span",{className:"obj-diff",children:"Difficulty: ★★★★☆"}),e.jsx("span",{className:"obj-diff",children:"Prerequisites: Module 27 (RAG Architectures), Module 22 (LangChain Ecosystem)"})]})]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"Why LlamaIndex and not just LangChain?"}),'LangChain treats data retrieval as one component in a chain. LlamaIndex was purpose-built for the data problem: it has 10 index strategies, 100+ data connectors, query decomposition, hierarchical retrieval, and a first-class knowledge graph index. In practice: use LlamaIndex to solve "which chunks to fetch and how to synthesise them," use LangGraph to solve "which tools to call and in what order." The two compose cleanly.']}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"Housing.com Upgrade Context"}),e.jsx("br",{}),"The current Housing.com chatbot loads property data from Housing APIs at query time (pre-fetch + residual tool pattern). LlamaIndex's ",e.jsx("code",{children:"IngestionPipeline"})," with hash deduplication would replace this with a pre-indexed vector store, cutting retrieval latency from 200ms to ~20ms. The ",e.jsx("code",{children:"PropertyGraphIndex"}),' then adds entity relationship queries ("all developer X projects in locality Y") that the flat vector search cannot answer today.']}),e.jsx(d,{}),e.jsx("h2",{children:"33.1 Core Abstractions — The Five-Layer Stack"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:c})}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"LlamaIndex v0.10+ API changes"}),"Version 0.10 (Jan 2024) introduced ",e.jsx("code",{children:"llama-index-core"})," as the base package. The monolithic ",e.jsx("code",{children:"llama-index"})," package was split into 100+ integration packages (",e.jsx("code",{children:"llama-index-llms-anthropic"}),", ",e.jsx("code",{children:"llama-index-embeddings-openai"}),", etc.). ",e.jsx("code",{children:"ServiceContext"})," was replaced by global ",e.jsx("code",{children:"Settings"}),". Code examples in blogs before 2024 use the old API — port them by replacing ",e.jsx("code",{children:"ServiceContext.from_defaults(llm=...)"})," with ",e.jsx("code",{children:"Settings.llm = ..."}),"."]}),e.jsx("h3",{children:"33.1.1 LlamaIndex vs LangChain — When to Use Which"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:h})}),e.jsx("h2",{children:"33.2 Data Loading — LlamaHub Connectors"}),e.jsxs("p",{children:["LlamaHub provides 100+ data loaders. All return ",e.jsx("code",{children:"List[Document]"})," with metadata auto-populated. Install with ",e.jsx("code",{children:"pip install llama-index-readers-web"})," (or the specific reader package)."]}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:m})}),e.jsx(l,{}),e.jsx("h2",{children:"33.3 Ingestion Pipeline — Transform, Enrich, Cache"}),e.jsxs("p",{children:["The ",e.jsx("code",{children:"IngestionPipeline"})," makes your processing chain explicit, reusable, and incremental. Documents are hashed on entry; unchanged documents skip all transformation steps on subsequent runs."]}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:p})}),e.jsxs("div",{className:"callout callout-warn",children:[e.jsx("strong",{children:"QuestionsAnsweredExtractor cost trap"}),"Each call to ",e.jsx("code",{children:"QuestionsAnsweredExtractor"})," makes one LLM call per node. For a 1000-node corpus with 3 questions each, that's 1000 LLM calls at indexing time (~$0.30 with gpt-4o-mini). The benefit is significant recall improvement — especially for queries that use different phrasing than the source text. Use it on your most important corpora only, and always use ",e.jsx("code",{children:"IngestionCache"})," so you only pay for new documents."]}),e.jsx("h2",{children:"33.4 Index Types — Choose the Right Data Structure"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:u})}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Index Type"}),e.jsx("th",{children:"How it retrieves"}),e.jsx("th",{children:"Best for"}),e.jsx("th",{children:"Cost"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"VectorStoreIndex"}),e.jsx("td",{children:"cosine similarity on embeddings"}),e.jsx("td",{children:"Semantic search (default)"}),e.jsx("td",{children:"Low"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"SummaryIndex"}),e.jsx("td",{children:"iterates ALL nodes"}),e.jsx("td",{children:"Document summarisation"}),e.jsx("td",{children:"High (reads everything)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"KeywordTableIndex"}),e.jsx("td",{children:"keyword inverted index"}),e.jsx("td",{children:"Exact keyword search"}),e.jsx("td",{children:"Very Low"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"DocumentSummaryIndex"}),e.jsx("td",{children:"summary-routing → node retrieval"}),e.jsx("td",{children:"Large corpora (1000+ docs)"}),e.jsx("td",{children:"Medium (summary per doc)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"PropertyGraphIndex"}),e.jsx("td",{children:"graph traversal + vector hybrid"}),e.jsx("td",{children:"Relational questions, entity networks"}),e.jsx("td",{children:"High (LLM extraction)"})]})]})}),e.jsx("h3",{children:"33.4.1 PropertyGraphIndex — Knowledge Graph from Text"}),e.jsx("p",{children:"Extracts entities and relationships from documents during indexing; answers relational questions by traversing the graph rather than matching embeddings."}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:x})}),e.jsx("h2",{children:"33.5 Query Engines, Retrievers & Post-Processing"}),e.jsx("h3",{children:"33.5.1 Response Synthesis Modes & Sub-Question Decomposition"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:g})}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"Sub-question decomposition is LlamaIndex's killer feature"}),`Vector search can't answer "Compare 3BHK prices in Bandra vs Powai" with a single embedding lookup — the two areas are in different semantic spaces. `,e.jsx("code",{children:"SubQuestionQueryEngine"})," decomposes this into two targeted sub-queries, routes each to the right index, and synthesises a comparison. This pattern is hard to replicate cleanly in LangChain without custom code."]}),e.jsx("h3",{children:"33.5.2 Retrieval Strategies & Reranking"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:f})}),e.jsx("h2",{children:"33.6 Workflows — Event-Driven Orchestration"}),e.jsxs("p",{children:["LlamaIndex Workflows provide typed, event-driven step execution as an alternative to LangGraph for LlamaIndex-native applications. Each ",e.jsx("code",{children:"@step"})," receives a typed Event and returns the next typed Event."]}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:y})}),e.jsx("h2",{children:"33.7 LlamaIndex + LangGraph — The Best-of-Both Pattern"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:_})}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"The pattern in this codebase"}),"This codebase's ",e.jsx("code",{children:"tool_calls_node"})," wraps a database query. Swapping that for a LlamaIndex ",e.jsx("code",{children:"SubQuestionQueryEngine"})," would immediately give the pipeline multi-area comparison, RERA knowledge graph traversal, and HyDE query expansion — with zero changes to the LangGraph orchestration layer. The LlamaIndex index types are the data layer; LangGraph is the agent layer. They don't compete."]}),e.jsx("h2",{children:"33.8 Production Patterns"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:v})}),e.jsxs("div",{className:"callout callout-maang",children:[e.jsx("strong",{children:"🎯 MAANG Interview Connection"}),'"Why use LlamaIndex instead of building retrieval from scratch?" → Three structural advantages: (1) IngestionPipeline with hash-based deduplication handles incremental document updates without rebuilding the index; (2) Index type selection — DocumentSummaryIndex routes at document level before node retrieval, cutting both latency and LLM cost on large corpora; (3) PropertyGraphIndex for relational questions — vector search finds similar text, graph traversal finds connected entities. These are all production-relevant capabilities that would take significant engineering to build from scratch. The LlamaIndex + LangGraph bridge means you get both the best data layer and the best orchestration layer.']}),e.jsx(i,{moduleId:35,title:"Module 35: LlamaIndex — Data Pipelines & Patterns",contentHint:"Five-layer stack Document Node Index Retriever QueryEngine, Settings replaces ServiceContext v0.10, VectorStoreIndex vs SummaryIndex vs DocumentSummaryIndex vs PropertyGraphIndex use cases, IngestionPipeline transformations caching hash deduplication incremental, QuestionsAnsweredExtractor LLM cost vs recall benefit, AutoMergingRetriever leaf index parent context, SubQuestionQueryEngine decomposition multi-area comparison, RouterQueryEngine description-based routing, CohereRerank post-processor wide retrieve narrow rerank, LlamaIndex Workflow events steps typed, LlamaIndex as LangGraph tool bridge pattern, async aquery production, persistent Chroma Redis storage"})]})}export{w as Mod46};
