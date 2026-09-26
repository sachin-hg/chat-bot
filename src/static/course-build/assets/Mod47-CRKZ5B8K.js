import{j as e,r as x}from"./index-D4pJPyGz.js";import{Q as _}from"./QuizSection-BedG7s-t.js";function f(){const[o,y]=x.useState(60),d=[["Doc A","Doc C","Doc E","Doc B","Doc D"],["Doc C","Doc A","Doc D","Doc B","Doc E"],["Doc B","Doc A","Doc C","Doc E","Doc D"]],c=["#89b4fa","#a6e3a1","#cba6f7"],g=["Vector Search","BM25 Keyword","Graph Traversal"],h=["Doc A","Doc B","Doc C","Doc D","Doc E"],a={};h.forEach(r=>{a[r]=0}),d.forEach(r=>{r.forEach((t,i)=>{a[t]+=1/(o+i+1)})});const m=[...h].sort((r,t)=>a[t]-a[r]),u={"Doc A":"#a6e3a1","Doc B":"#89b4fa","Doc C":"#cba6f7","Doc D":"#6c7086","Doc E":"#6c7086"};return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"RECIPROCAL RANK FUSION — MERGING VECTOR, BM25 AND GRAPH RANKINGS"}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"16px",marginBottom:"14px",flexWrap:"wrap"},children:[e.jsx("span",{style:{fontSize:"0.78rem",color:"#6c7086"},children:"k (smoothing):"}),[10,30,60,100].map(r=>e.jsxs("button",{onClick:()=>y(r),style:o===r?{background:"#89b4fa22",color:"#89b4fa",border:"1px solid #89b4fa",borderRadius:"6px",padding:"5px 12px",fontSize:"0.78rem",cursor:"pointer",marginRight:"4px"}:{background:"#313244",color:"#cdd6f4",border:"1px solid #45475a",borderRadius:"6px",padding:"5px 12px",fontSize:"0.78rem",cursor:"pointer",marginRight:"4px"},children:["k=",r]},r)),e.jsx("span",{style:{fontSize:"0.75rem",color:"#6c7086",fontFamily:"monospace"},children:"score = Σ 1/(k+rank)"})]}),e.jsxs("svg",{viewBox:"0 0 580 220",width:"100%",style:{display:"block",margin:"0 auto"},"aria-label":"Reciprocal Rank Fusion merging three ranked lists",children:[e.jsxs("defs",{children:[c.map((r,t)=>e.jsx("marker",{id:`rrf-arrow-${t}`,markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:r})},t)),e.jsx("marker",{id:"rrf-arrow-out",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#fab387"})})]}),d.map((r,t)=>{const i=10+t*128;return e.jsxs("g",{children:[e.jsx("text",{x:i+46,y:"14",textAnchor:"middle",fontSize:"9",fill:c[t],fontWeight:"600",children:g[t]}),r.map((s,n)=>{const p=m.indexOf(s)<3,l=p?u[s]:"#45475a";return e.jsxs("g",{children:[e.jsx("rect",{x:i,y:22+n*34,width:"92",height:"26",rx:"6",fill:l+"22",stroke:l,strokeWidth:"1.2"}),e.jsxs("text",{x:i+10,y:38+n*34,fontSize:"8",fill:"#6c7086",children:["#",n+1]}),e.jsx("text",{x:i+46,y:38+n*34,textAnchor:"middle",fontSize:"10",fill:l,fontWeight:p?"700":"400",children:s})]},n)}),e.jsx("line",{x1:i+92,y1:100,x2:394,y2:100,stroke:c[t],strokeWidth:"1.2",strokeDasharray:"4 3",markerEnd:`url(#rrf-arrow-${t})`})]},t)}),e.jsx("rect",{x:"396",y:"72",width:"80",height:"56",rx:"6",fill:"#313244",stroke:"#fab387",strokeWidth:"1.5"}),e.jsx("text",{x:"436",y:"93",textAnchor:"middle",fontSize:"9",fill:"#fab387",children:"RRF"}),e.jsx("text",{x:"436",y:"106",textAnchor:"middle",fontSize:"8",fill:"#6c7086",children:"fusion"}),e.jsxs("text",{x:"436",y:"118",textAnchor:"middle",fontSize:"7",fill:"#6c7086",children:["k=",o]}),e.jsx("line",{x1:"476",y1:"100",x2:"496",y2:"100",stroke:"#fab387",strokeWidth:"1.5",markerEnd:"url(#rrf-arrow-out)"}),e.jsx("text",{x:"540",y:"14",textAnchor:"middle",fontSize:"9",fill:"#fab387",fontWeight:"600",children:"Merged"}),m.map((r,t)=>{const i=t<3,s=i?u[r]:"#45475a",n=a[r].toFixed(4);return e.jsxs("g",{children:[e.jsx("rect",{x:"498",y:22+t*34,width:"78",height:"26",rx:"6",fill:s+"22",stroke:s,strokeWidth:i?1.8:1}),e.jsxs("text",{x:"508",y:38+t*34,fontSize:"7",fill:"#6c7086",children:["#",t+1]}),e.jsx("text",{x:"537",y:33+t*34,textAnchor:"middle",fontSize:"10",fill:s,fontWeight:i?"700":"400",children:r}),e.jsx("text",{x:"537",y:43+t*34,textAnchor:"middle",fontSize:"7",fill:"#6c7086",children:n})]},t)}),e.jsxs("text",{x:"436",y:"148",textAnchor:"middle",fontSize:"8",fill:"#6c7086",children:["k=",o," smoothing"]}),e.jsx("text",{x:"436",y:"160",textAnchor:"middle",fontSize:"8",fill:"#6c7086",children:"constant"}),e.jsx("text",{x:"290",y:"205",textAnchor:"middle",fontSize:"9",fill:"#6c7086",children:"Winners (top 3) highlighted — ranks weighted by 1/(k+rank), summed across all lists"})]})]})}const E=`# The three questions that expose vector search's structural limits

# Q1 — Aggregation across entities:
# "Which developer has the most projects in Mumbai under ₹2Cr?"
# Vector: finds chunks mentioning cheap projects, can't COUNT across entities
# Graph:  MATCH (d:Developer)<-[:BUILT_BY]-(p:Property {city:'Mumbai'})
#         WHERE p.price_cr < 2
#         RETURN d.name, COUNT(p) ORDER BY COUNT(p) DESC LIMIT 5

# Q2 — Multi-hop traversal:
# "What amenities are within 2 hops of Lodha Palava City?"
# Vector: only finds text that explicitly lists Lodha Palava City's amenities
# Graph:  MATCH (p:Property {name:'Lodha Palava City'})-[:HAS|NEAR*1..2]->(a:Amenity)
#         RETURN DISTINCT a.name, a.type

# Q3 — Path / connection queries:
# "Is there a shared investor between Oberoi Realty and Hiranandani Developers?"
# Vector: almost impossible — this fact may exist nowhere as a single chunk
# Graph:  MATCH path = (d1:Developer {name:'Oberoi Realty'})
#               -[:HAS_INVESTOR]->(i:Investor)<-[:HAS_INVESTOR]-
#               (d2:Developer {name:'Hiranandani Developers'})
#         RETURN i.name, length(path)

# ── What vector CAN'T represent ────────────────────────────────────────────────
# Relationships with direction:  OWNED_BY, SUBSIDIARY_OF, COMPETES_WITH
# Cardinality:                   how many, how often, ranked by count
# Provenance:                    which source confirmed this relationship?
# Temporal relationships:        ACQUIRED_IN(year=2021)

# ── The complementary truth ────────────────────────────────────────────────────
# Vector: "semantically similar"        Graph: "structurally connected"
# Neither subsumes the other.
# Hybrid retrieval — route by question type — is the production answer.`,b=`# ── Building a knowledge graph from STRUCTURED data (SQL / CSV / JSON) ──────
# Easiest: schema already defines entity types and relationships

from neo4j import GraphDatabase
import pandas as pd

driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "password"))

# From SQL: load properties + developer + location tables, wire into graph
def load_sql_to_graph(session):
    properties = pd.read_sql("SELECT * FROM properties", conn)
    developers = pd.read_sql("SELECT * FROM developers", conn)
    listings   = pd.read_sql("SELECT * FROM listings", conn)  # developer_id, property_id

    # Batch ingest with UNWIND (much faster than one-by-one)
    session.run("""
        UNWIND $rows AS r
        MERGE (p:Property {id: r.id})
        SET   p.name = r.name, p.bhk = r.bhk, p.price_cr = r.price_cr,
              p.locality = r.locality, p.city = r.city, p.rera_id = r.rera_id
    """, rows=properties.to_dict("records"))

    session.run("""
        UNWIND $rows AS r
        MERGE (d:Developer {id: r.id})
        SET   d.name = r.name, d.founded = r.founded_year, d.hq = r.headquarters
    """, rows=developers.to_dict("records"))

    session.run("""
        UNWIND $rows AS r
        MATCH (p:Property {id: r.property_id})
        MATCH (d:Developer {id: r.developer_id})
        MERGE (p)-[:BUILT_BY]->(d)
    """, rows=listings.to_dict("records"))

# CSV: same pattern — load with pandas, UNWIND into Cypher
# JSON hierarchy: flatten nested objects → nodes; nested arrays → edges

# ── From GeoJSON / spatial data ───────────────────────────────────────────────
# Add latitude/longitude to nodes, then compute proximity relationships:
session.run("""
    MATCH (p:Property), (m:Metro {city: p.city})
    WHERE point.distance(
        point({latitude: p.lat, longitude: p.lon}),
        point({latitude: m.lat, longitude: m.lon})
    ) < 500  // metres
    MERGE (p)-[:NEAR_METRO {distance_m: round(point.distance(...))}]->(m)
""")
# Neo4j has native spatial index support for point() types`,R=`# ── Building a knowledge graph from UNSTRUCTURED TEXT ───────────────────────
# Requires NLP: entity extraction (NER) + relation extraction

# ── Approach 1: LLM-based extraction (LlamaIndex SimpleLLMPathExtractor) ────
from llama_index.core import PropertyGraphIndex, Settings
from llama_index.core.indices.property_graph import (
    SimpleLLMPathExtractor,
    DynamicLLMPathExtractor,
)

# SimpleLLMPathExtractor: extract (head, relation, tail) triples
# Prompt asks LLM: "extract knowledge graph triples from this text"
# Output: ("Lodha Palava City", "LOCATED_IN", "Thane")
#          ("Lodha Palava City", "DEVELOPED_BY", "Lodha Group")

extractor_simple = SimpleLLMPathExtractor(
    llm = Settings.llm,
    max_paths_per_chunk = 10,   # cap per chunk to control cost
    num_workers = 4,            # parallel workers for extraction
)

# DynamicLLMPathExtractor: also infers entity TYPES
# Produces typed nodes: :Property, :Developer, :Location (not just :__Entity__)
extractor_typed = DynamicLLMPathExtractor(
    llm = Settings.llm,
    allowed_entity_types    = ["Property", "Developer", "Location", "Investor", "Project"],
    allowed_relation_types  = ["BUILT_BY", "LOCATED_IN", "HAS_INVESTOR", "COMPETES_WITH"],
    # allowed_relation_types=None → LLM infers any relation
)

# ── Approach 2: spaCy NER + custom relation extractor (no LLM cost) ──────────
import spacy
from neo4j import GraphDatabase

nlp = spacy.load("en_core_web_trf")  # transformer-based NER

def extract_entities_and_ingest(text: str, doc_id: str, session):
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ in ("ORG", "GPE", "MONEY", "PERSON"):
            label = {"ORG": "Organisation", "GPE": "Location",
                     "MONEY": "Price", "PERSON": "Person"}[ent.label_]
            session.run(f"""
                MERGE (e:{label} {{name: $name}})
                SET e.source_doc = $doc_id
            """, name=ent.text.strip(), doc_id=doc_id)
    # Cooccurrence edges: entities in same sentence → loosely related
    for sent in doc.sents:
        ents = [e for e in sent.ents if e.label_ in ("ORG", "GPE")]
        for i, e1 in enumerate(ents):
            for e2 in ents[i+1:]:
                session.run("""
                    MATCH (a {name: $n1}), (b {name: $n2})
                    MERGE (a)-[:COOCCURS_IN_SENTENCE {doc: $doc}]->(b)
                """, n1=e1.text, n2=e2.text, doc=doc_id)

# ── Approach 3: Microsoft GraphRAG entity extractor ───────────────────────────
# See §34.7 — runs full pipeline: chunk → extract → deduplicate → summarise
# Output: parquet files of entities, relationships, communities`,v=`# ── Building KG from SEMI-STRUCTURED data (Markdown, Obsidian, email) ────────

# ── Obsidian / Markdown wikilinks ─────────────────────────────────────────────
import re
from pathlib import Path

def load_obsidian_vault_to_neo4j(vault_path: str, session):
    vault = Path(vault_path)
    # Step 1: create a node for every note
    for md_file in vault.rglob("*.md"):
        title = md_file.stem
        content = md_file.read_text()
        session.run("""
            MERGE (n:Note {title: $title})
            SET   n.path = $path, n.word_count = $wc
        """, title=title, path=str(md_file.relative_to(vault)),
             wc=len(content.split()))
    # Step 2: wire [[wikilinks]] as directed edges
    for md_file in vault.rglob("*.md"):
        source_title = md_file.stem
        content      = md_file.read_text()
        targets = re.findall(r'[[([^]|#]+)[^]]*]]', content)
        for target in targets:
            session.run("""
                MATCH (src:Note {title: $src})
                MERGE (tgt:Note {title: $tgt})  // create stub if doesn't exist yet
                MERGE (src)-[:LINKS_TO]->(tgt)
            """, src=source_title, tgt=target.strip())

# ── Email threads (sender → message → reply graph) ───────────────────────────
def load_email_thread(emails: list[dict], session):
    session.run("""
        UNWIND $emails AS e
        MERGE (m:Email   {id: e.message_id})
        SET   m.subject = e.subject, m.date = e.date, m.body_snippet = e.snippet
        MERGE (s:Person  {email: e.from_addr})
        MERGE (s)-[:SENT]->(m)
        WITH m, e
        UNWIND e.to_addrs AS to
        MERGE (r:Person {email: to})
        MERGE (m)-[:TO]->(r)
    """, emails=emails)
    # Reply-to chain:
    session.run("""
        UNWIND $emails AS e
        MATCH (m:Email {id: e.message_id})
        MATCH (parent:Email {id: e.in_reply_to})
        MERGE (m)-[:REPLIES_TO]->(parent)
    """, emails=[e for e in emails if e.get("in_reply_to")])

# ── Code dependency graphs ────────────────────────────────────────────────────
# Parse AST, extract function/class nodes + import/call relationships
# Useful for: "which functions depend on this module?" queries
# Tool: py2cypher, java-callgraph, or custom AST walker`,j=`# ── Community detection: finding natural clusters in a graph ─────────────────
# A community = a group of nodes more densely connected to each other
# than to the rest of the graph.
# Real-world example: Mumbai property market communities might cluster as:
#   C0 (coarse): South Mumbai Premium, Western Suburbs, Thane-Navi Mumbai
#   C1 (medium): Bandra cluster, Juhu cluster, Powai tech cluster
#   C2 (fine):   Bandra Hill Road micro-cluster

# ── Louvain algorithm ─────────────────────────────────────────────────────────
# Greedy modularity optimisation (fast, O(n log n))
# Phase 1: assign each node to its own community; move nodes to increase modularity Q
# Phase 2: collapse communities → super-nodes; repeat
# Weakness: resolution limit (can't detect very small communities in large graphs)
# Still default in many tools; supported in Neo4j GDS

# ── Leiden algorithm (2019, improvement over Louvain) ─────────────────────────
# Fixes Louvain's disconnected community problem
# Guarantees: communities are always internally connected
# Used by: Microsoft GraphRAG, Neo4j GDS, NetworkX (community-leiden)
# Adds refinement phase: after merging, refine partition to improve quality

# ── Label Propagation (LPA) ───────────────────────────────────────────────────
# Each node adopts the majority label of its neighbours
# Very fast (O(edges)) — good for massive graphs
# Non-deterministic — run multiple times and take consensus
# Less accurate than Leiden but scales to billions of edges

# ── Hierarchical community structure ──────────────────────────────────────────
# Set gamma (resolution) parameter:
#   gamma < 1.0 → fewer, larger communities (coarse view)
#   gamma = 1.0 → default resolution
#   gamma > 1.0 → more, smaller communities (fine-grained)
# Run at multiple gammas → hierarchy of communities
# Microsoft GraphRAG runs 3 levels: global themes → topic clusters → entity groups`,S=`# ── Running community detection in Neo4j GDS ─────────────────────────────────
from graphdatascience import GraphDataScience
import pandas as pd

gds = GraphDataScience("bolt://localhost:7687", auth=("neo4j", "password"))

# Project graph into GDS memory
G, _ = gds.graph.project(
    "property_net",
    node_labels      = ["Property", "Developer", "Location"],
    relationship_types = ["BUILT_BY", "LOCATED_IN", "NEAR_METRO"],
    relationship_properties = {},
)

# ── Leiden (recommended for quality) ─────────────────────────────────────────
result = gds.leiden.write(
    G,
    writeProperty   = "leiden_community",
    gamma           = 1.0,       # resolution — raise for finer granularity
    maxLevels       = 3,         # hierarchical levels
    tolerance       = 0.0001,
    includeIntermediateCommunities = True,  # writes intermediate levels too
)
print(f"Communities found: {result['communityCount']}")
print(f"Modularity score: {result['modularity']:.4f}")  # higher is better

# ── Write community IDs back to Neo4j nodes ──────────────────────────────────
# Each node now has property: leiden_community = [c0_id, c1_id, c2_id]
# (intermediate communities stored as array if includeIntermediateCommunities=True)

# ── Generate community summaries with LLM (the GraphRAG pattern) ─────────────
with driver.session() as session:
    communities = session.run("""
        MATCH (n) WHERE n.leiden_community IS NOT NULL
        WITH n.leiden_community[-1] AS community_id, collect(n) AS members
        WHERE size(members) >= 3
        RETURN community_id, [m IN members | m.name + ': ' + coalesce(m.description, '')] AS member_desc
        ORDER BY size(members) DESC
        LIMIT 50
    """).data()

from langchain_anthropic import ChatAnthropic
llm = ChatAnthropic(model="claude-haiku-4-5-20251001")

def summarise_community(community_id: int, member_descriptions: list[str]) -> str:
    members_text = "\\n".join(member_descriptions[:20])  # cap context
    response = llm.invoke(f"""
Summarise the following group of connected entities from a real estate knowledge graph.
Write 2-3 sentences describing: what they have in common, key themes, and geographic/market relevance.

Entities:
{members_text}

Summary:""")
    return response.content

# Store summaries back in Neo4j for retrieval:
for c in communities:
    summary = summarise_community(c["community_id"], c["member_desc"])
    session.run("""
        MERGE (cs:CommunitySummary {community_id: $cid})
        SET   cs.summary = $summary, cs.member_count = $count
    """, cid=c["community_id"], summary=summary, count=len(c["member_desc"]))`,k=`# ── Four strategies for searching a knowledge graph ─────────────────────────

# Strategy 1: Exact Cypher (structured queries from LLM or template)
# Use when: query has clear entity + relationship intent
# "How many properties did Lodha Group build in Thane?"
result = session.run("""
    MATCH (d:Developer {name: 'Lodha Group'})<-[:BUILT_BY]-(p:Property)
          -[:LOCATED_IN]->(l:Location {name: 'Thane'})
    RETURN COUNT(p) AS count
""")

# Strategy 2: Entity-anchored graph expansion
# Use when: user asks about a specific entity + wants its context
# 1. Find the anchor entity (by name or by embedding)
# 2. Expand k hops to get its neighbourhood

def entity_context(entity_name: str, hops: int = 2) -> dict:
    with driver.session() as s:
        result = s.run("""
            MATCH (start) WHERE toLower(start.name) CONTAINS toLower($name)
            CALL apoc.path.subgraphAll(start, {maxLevel: $hops})
            YIELD nodes, relationships
            RETURN nodes, relationships
        """, name=entity_name, hops=hops)
        row = result.single()
        if not row:
            return {}
        nodes = [dict(n) for n in row["nodes"]]
        edges = [(r.start_node["name"], r.type, r.end_node["name"]) for r in row["relationships"]]
        return {"nodes": nodes, "edges": edges}

# Strategy 3: Community-level search (GraphRAG global search pattern)
# Use when: "what themes exist?" / "summarise the corpus"
# → Find communities whose summaries match the query semantically
def community_search(query: str, top_k: int = 5) -> list[str]:
    # Embed community summaries at index time; search at query time
    query_embedding = embed_model.get_text_embedding(query)
    results = session.run("""
        MATCH (cs:CommunitySummary)
        WHERE cs.embedding IS NOT NULL
        RETURN cs.summary,
               gds.similarity.cosine(cs.embedding, $qvec) AS score
        ORDER BY score DESC LIMIT $k
    """, qvec=query_embedding, k=top_k)
    return [r["cs.summary"] for r in results]

# Strategy 4: Full-text search on node properties
# Neo4j native full-text index (BM25-like, powered by Lucene)
# Create once:
session.run("""
    CREATE FULLTEXT INDEX property_text IF NOT EXISTS
    FOR (p:Property) ON EACH [p.name, p.description, p.locality]
""")
# Query:
results = session.run("""
    CALL db.index.fulltext.queryNodes('property_text', $query) YIELD node, score
    RETURN node.name, node.locality, score LIMIT 10
""", query="sea facing luxury Bandra").data()`,w=`# ── Reranking graph search results ──────────────────────────────────────────

# ── Method 1: Graph-aware scoring (combine topology + semantic similarity) ────
def hybrid_graph_score(
    node: dict,
    query_embedding: list[float],
    graph_metrics: dict,   # pagerank, community_id, hop_distance
    weights = {"semantic": 0.5, "pagerank": 0.2, "hop_proximity": 0.3},
) -> float:
    semantic_sim   = cosine_similarity(node["embedding"], query_embedding)
    pagerank_score = graph_metrics.get("pagerank", 0.0)
    hop_score      = 1.0 / (graph_metrics.get("hop_distance", 1) + 1)  # closer = higher
    return (weights["semantic"]      * semantic_sim
          + weights["pagerank"]      * pagerank_score
          + weights["hop_proximity"] * hop_score)

# ── Method 2: Cross-encoder reranker over graph-retrieved text ─────────────
# Retrieve 20 nodes by graph traversal; rerank to top 5 using a cross-encoder
from sentence_transformers import CrossEncoder

reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

def rerank_graph_results(query: str, graph_nodes: list[dict], top_k: int = 5) -> list[dict]:
    # Each graph node → text passage
    passages = [f"{n['name']}: {n.get('description', '')} | {n.get('locality', '')}"
                for n in graph_nodes]
    pairs    = [(query, p) for p in passages]
    scores   = reranker.predict(pairs)  # cross-encoder inference
    ranked   = sorted(zip(scores, graph_nodes), key=lambda x: x[0], reverse=True)
    return [node for _, node in ranked[:top_k]]

# ── Method 3: LLM-as-judge reranker (expensive but highest quality) ──────────
def llm_rerank_graph(query: str, candidates: list[str], top_k: int = 3) -> list[str]:
    numbered = "\\n".join(f"{i+1}. {c}" for i, c in enumerate(candidates))
    response = llm.invoke(f"""
You are ranking search results for a real estate query.
Query: "{query}"

Candidates:
{numbered}

Return the numbers of the top {top_k} most relevant results, comma-separated.
Only return numbers, nothing else.
""")
    try:
        indices = [int(x.strip()) - 1 for x in response.content.split(",")]
        return [candidates[i] for i in indices if 0 <= i < len(candidates)]
    except:
        return candidates[:top_k]  # fallback`,L=`# ── Hybrid vector + graph: the production architecture ───────────────────────

# Architecture:
# User query
#     │
#     ├─→ [Query classifier] ─→ route to:
#     │        │
#     │        ├─→ "relational"  → Cypher generator → Neo4j graph query
#     │        ├─→ "thematic"    → Community summary search (GraphRAG global)
#     │        ├─→ "entity"      → Entity anchor → graph expand → text synthesis
#     │        └─→ "semantic"    → Vector search → top-k chunks → synthesis
#     │
#     └─→ [Always] → rerank merged results → synthesis

# ── Step 1: Query classification ─────────────────────────────────────────────
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

ROUTE_PROMPT = ChatPromptTemplate.from_template("""
Classify this real estate query into EXACTLY ONE of: relational, thematic, entity, semantic.

relational = asks for counts, comparisons, or explicit relationships between named entities
thematic   = asks for themes, trends, or patterns across the whole corpus
entity     = asks about a specific named place/developer/project
semantic   = general question about properties, market, advice

Query: {query}

Answer with only one word:""")

route_chain  = ROUTE_PROMPT | llm | StrOutputParser()
query_type   = route_chain.invoke({"query": user_query}).strip().lower()

# ── Step 2: Route to the right retriever ─────────────────────────────────────
def hybrid_retrieve(query: str, query_type: str) -> list[str]:
    if query_type == "relational":
        # LLM generates Cypher, execute, format results
        cypher  = generate_cypher(query)   # GraphCypherQAChain or custom
        results = execute_cypher_safe(cypher)
        return [format_graph_result(r) for r in results]

    elif query_type == "thematic":
        # Community summary search
        summaries = community_search(query, top_k=5)
        return summaries

    elif query_type == "entity":
        # Entity anchor → neighbourhood expansion
        entity = extract_entity_name(query)          # NER or LLM extraction
        context = entity_context(entity, hops=2)
        return [format_entity_context(context)]

    else:  # semantic
        # Pure vector search
        nodes = vector_store.similarity_search(query, k=8)
        return [n.page_content for n in nodes]

# ── Step 3: Reciprocal Rank Fusion (combine results from multiple retrievers) ─
def reciprocal_rank_fusion(result_lists: list[list[str]], k: int = 60) -> list[str]:
    """RRF: score = sum(1 / (k + rank_i)) across all lists.
    Merges and re-orders results from multiple ranked lists without score normalisation."""
    scores = {}
    for results in result_lists:
        for rank, doc in enumerate(results):
            scores[doc] = scores.get(doc, 0.0) + 1.0 / (k + rank + 1)
    return sorted(scores.keys(), key=lambda d: scores[d], reverse=True)

# ── Always-on hybrid: run vector AND graph in parallel, fuse ─────────────────
import asyncio

async def always_hybrid_retrieve(query: str) -> list[str]:
    # Run both in parallel — don't wait for one before starting the other
    vector_task = asyncio.to_thread(vector_store.similarity_search, query, k=8)
    graph_task  = asyncio.to_thread(graph_cypher_chain.invoke, {"query": query})
    vector_res, graph_res = await asyncio.gather(vector_task, graph_task)
    vector_texts = [n.page_content for n in vector_res]
    graph_texts  = [str(graph_res.get("result", ""))]
    fused = reciprocal_rank_fusion([vector_texts, graph_texts])
    return fused[:5]`,N=`# Microsoft GraphRAG — the reference implementation for community-based RAG
# github.com/microsoft/graphrag   |  pip install graphrag

# ── Why GraphRAG answers global questions better than vector RAG ──────────────
# Vector RAG: retrieves 5 chunks relevant to "what are Mumbai real estate trends?"
# → Each chunk covers one micro-topic; no synthesis across corpus
# GraphRAG:
#   - Leiden communities cluster entities into thematic groups at index time
#   - LLM writes a summary per community: "This community covers sea-facing luxury
#     developers in South Mumbai with avg price ₹5Cr, key players: Oberoi, Lodha."
#   - At query time: find communities relevant to query → MAP partial answers → REDUCE

# ── Pipeline stages (auto-run by: graphrag index --root ./project) ────────────
# Stage 1 — DocumentConverter:      raw files → text chunks (configurable chunk size)
# Stage 2 — EntityExtractor:        LLM per chunk → (entity, type, description) +
#                                    (source_entity, relation, target_entity, description)
# Stage 3 — EntitySummariser:       LLM merges all descriptions for same entity
# Stage 4 — RelationshipSummariser: LLM deduplicates and enriches relationships
# Stage 5 — CommunityDetector:      Leiden on entity-relationship graph (3 levels)
# Stage 6 — CommunitySummariser:    LLM writes summary per community, per level
# Stage 7 — TextUnitEmbedder:       embed all text chunks
# Stage 8 — EntityEmbedder:         embed entity descriptions
# Stage 9 — CommunityEmbedder:      embed community summaries (for local search)

# ── Local search: entity-focused ──────────────────────────────────────────────
# Query: "What projects did Hiranandani Developers build?"
# Steps:
#   1. Embed query → find closest entities by cosine similarity
#   2. Pull entity description + all relationships (1–2 hops)
#   3. Pull associated community reports (parent communities of matched entities)
#   4. Pull source text chunks containing the entity
#   5. All context concatenated → single LLM call for synthesis

# ── Global search: corpus-wide themes ─────────────────────────────────────────
# Query: "What are the dominant investment themes in Mumbai 2024?"
# Steps:
#   1. Load community reports at level 1 (medium granularity)
#   2. MAP: LLM rates relevance of each report to the query → partial answer
#   3. REDUCE: LLM synthesises all partial answers → final response
# Cost: proportional to number of communities × community summary length
# Control cost: use higher community level (fewer, coarser communities)`,C=`# Microsoft GraphRAG query API (Python)
# Run after: graphrag index --root ./graphrag_project

import asyncio
import pandas as pd
from pathlib import Path
from graphrag.query.context_builder.entity_extraction import EntityVectorStoreKey
from graphrag.query.structured_search.local_search.search  import LocalSearch
from graphrag.query.structured_search.global_search.search import GlobalSearch

OUTPUT = Path("graphrag_project/output/artifacts")

# Load all pre-built artifacts
entities          = pd.read_parquet(OUTPUT / "create_final_entities.parquet")
relationships     = pd.read_parquet(OUTPUT / "create_final_relationships.parquet")
community_reports = pd.read_parquet(OUTPUT / "create_final_community_reports.parquet")
text_units        = pd.read_parquet(OUTPUT / "create_final_text_units.parquet")

# ── Global search ─────────────────────────────────────────────────────────────
from graphrag.query.structured_search.global_search.community_context import GlobalCommunityContext
global_ctx = GlobalCommunityContext(community_reports=community_reports, token_encoder=tiktoken_encoder)
global_search = GlobalSearch(
    llm=llm_client, context_builder=global_ctx, token_encoder=tiktoken_encoder,
    max_data_tokens=12_000,
    map_llm_params={"max_tokens": 500,  "temperature": 0.0},
    reduce_llm_params={"max_tokens": 2000, "temperature": 0.0},
    allow_general_knowledge=False,  # strict: only use corpus
    response_type="multiple paragraphs",
)

# ── Local search ──────────────────────────────────────────────────────────────
from graphrag.query.structured_search.local_search.mixed_context import LocalSearchMixedContext
local_ctx = LocalSearchMixedContext(
    community_reports=community_reports, text_unit_df=text_units,
    entities=entities, relationships=relationships,
    entity_text_embeddings=entity_embedding_store,
    embedding_vectorstore_key=EntityVectorStoreKey.TITLE,
    token_encoder=tiktoken_encoder,
)
local_search = LocalSearch(
    llm=llm_client, context_builder=local_ctx, token_encoder=tiktoken_encoder,
    llm_params={"max_tokens": 2000, "temperature": 0.0},
    context_builder_params={
        "text_unit_prop": 0.5,           # 50% of context = source text chunks
        "community_prop": 0.1,           # 10% = community reports
        "top_k_mapped_entities": 10,
        "top_k_relationships": 10,
    },
)

async def search(query: str, mode: str = "auto"):
    if mode == "global" or any(w in query.lower() for w in ["themes", "trends", "overview", "patterns", "compare all"]):
        result = await global_search.asearch(query)
    else:
        result = await local_search.asearch(query)
    return result.response

result = asyncio.run(search("What are the main investment themes in Mumbai real estate?"))`,T=`# Elasticsearch for RAG: BM25 + KNN + hybrid search
# pip install elasticsearch langchain-elasticsearch

from elasticsearch import Elasticsearch
from langchain_elasticsearch import ElasticsearchStore
from langchain_openai import OpenAIEmbeddings

es = Elasticsearch("http://localhost:9200")

# ── Create an index with both text (BM25) and vector (KNN) fields ─────────────
es.indices.create(index="properties", body={
    "settings": {
        "number_of_shards": 1,
        "analysis": {
            "analyzer": {
                "english_analyzer": {
                    "type": "english"  # stemming, stop words for BM25
                }
            }
        }
    },
    "mappings": {
        "properties": {
            "content":    {"type": "text",        "analyzer": "english_analyzer"},  # BM25
            "locality":   {"type": "keyword"},     # exact filter
            "bhk":        {"type": "integer"},
            "price_cr":   {"type": "float"},
            "embedding":  {
                "type":       "dense_vector",
                "dims":       1536,            # must match your embedding model
                "index":      True,
                "similarity": "cosine",        # dot_product | l2_norm | cosine
            },
            "source":     {"type": "keyword"},
        }
    }
})

# ── Ingest documents with embeddings ─────────────────────────────────────────
embed_model = OpenAIEmbeddings(model="text-embedding-3-small")

from elasticsearch.helpers import bulk

def ingest_docs(docs: list[dict]):
    actions = []
    for doc in docs:
        embedding = embed_model.embed_query(doc["content"])
        actions.append({
            "_index":  "properties",
            "_source": {**doc, "embedding": embedding}
        })
    bulk(es, actions)

ingest_docs([
    {"content": "Bandra West 3BHK sea-facing flat, ₹4.5Cr, Hilton Road",
     "locality": "Bandra West", "bhk": 3, "price_cr": 4.5},
    {"content": "Powai 2BHK in Hiranandani Gardens, ₹1.8Cr, near lake",
     "locality": "Powai", "bhk": 2, "price_cr": 1.8},
])`,M=`# ── BM25 lexical search (Elasticsearch default) ───────────────────────────────
# BM25 = Best Match 25: TF-IDF variant with length normalisation
# BM25 score: IDF(term) × TF(term, doc) × (k1+1) / (TF + k1 × (1-b + b×dl/avgdl))
# k1 (term frequency saturation, default 1.2): higher → more TF influence
# b   (length normalisation, default 0.75):   0 = no normalisation, 1 = full

bm25_results = es.search(index="properties", body={
    "query": {
        "match": {
            "content": {
                "query": "sea facing luxury Bandra",
                "operator": "or"   # any term matches; use "and" for stricter recall
            }
        }
    },
    "size": 10
})

# ── KNN vector search (dense retrieval) ───────────────────────────────────────
query_vec = embed_model.embed_query("sea facing luxury Bandra")

knn_results = es.search(index="properties", body={
    "knn": {
        "field":         "embedding",
        "query_vector":  query_vec,
        "k":             10,
        "num_candidates": 50   # HNSW: search 50 candidates, return top k
    }
})

# ── Hybrid BM25 + KNN with Reciprocal Rank Fusion (RRF) ──────────────────────
# ES 8.9+: native hybrid search with RRF score combination
hybrid_results = es.search(index="properties", body={
    "retriever": {
        "rrf": {                              # Reciprocal Rank Fusion combiner
            "retrievers": [
                {
                    "standard": {            # BM25 retriever
                        "query": {
                            "match": {"content": "sea facing luxury Bandra"}
                        }
                    }
                },
                {
                    "knn": {                 # KNN retriever
                        "field":         "embedding",
                        "query_vector":  query_vec,
                        "k":             10,
                        "num_candidates": 50
                    }
                }
            ],
            "rank_constant": 60,            # RRF k parameter (default 60)
            "window_size":   100            # merge top 100 from each, RRF, return top 10
        }
    },
    "size": 10
})

# ── Filtered hybrid: add structured filter on top of semantic ─────────────────
filtered_hybrid = es.search(index="properties", body={
    "retriever": {
        "rrf": {
            "retrievers": [
                {"standard": {"query": {"bool": {
                    "must":   {"match":  {"content": "good for families"}},
                    "filter": [{"term": {"locality": "Powai"}},
                               {"range": {"price_cr": {"lte": 2.5}}}]
                }}}},
                {"knn": {
                    "field": "embedding", "query_vector": query_vec, "k": 10,
                    "num_candidates": 50,
                    "filter": {"term": {"locality": "Powai"}}
                }}
            ]
        }
    },
    "size": 5
})`,A=`# ── RAG pipeline with Elasticsearch ──────────────────────────────────────────
# LangChain has a first-class ElasticsearchStore that handles embedding + indexing

from langchain_elasticsearch import ElasticsearchStore
from langchain_core.runnables import RunnablePassthrough
from langchain_core.prompts import ChatPromptTemplate
from langchain_anthropic import ChatAnthropic
from langchain_openai import OpenAIEmbeddings

# ── Create/connect to an index ────────────────────────────────────────────────
vector_store = ElasticsearchStore(
    es_url        = "http://localhost:9200",
    index_name    = "property_rag",
    embedding     = OpenAIEmbeddings(model="text-embedding-3-small"),
    strategy      = ElasticsearchStore.ApproxRetrievalStrategy(
        hybrid=True,              # enable BM25+KNN hybrid automatically
        rrf=True,                 # use RRF to combine scores
        query_model_id=None,      # optional: ELSER model ID for learned sparse retrieval
    ),
)

# Index documents (embeddings computed automatically):
from langchain_core.documents import Document
vector_store.add_documents([
    Document(page_content="Bandra West sea-facing 3BHK...", metadata={"locality": "Bandra West"}),
])

# ── Retrieval chain ───────────────────────────────────────────────────────────
retriever = vector_store.as_retriever(
    search_type   = "similarity",
    search_kwargs = {
        "k": 8,
        "filter": [{"term": {"metadata.locality": "Bandra West"}}],  # optional pre-filter
    }
)

prompt = ChatPromptTemplate.from_template("""
Answer the question based on the property search results below.
Context: {context}
Question: {question}
""")

chain = (
    {"context": retriever | (lambda docs: "\\n".join(d.page_content for d in docs)),
     "question": RunnablePassthrough()}
    | prompt
    | ChatAnthropic(model="claude-haiku-4-5-20251001")
)

answer = chain.invoke("What 3BHK options are available in Bandra with sea view?")

# ── ELSER (Elastic Learned Sparse EncodeR) ─────────────────────────────────
# ELSER is Elasticsearch's own learned sparse retrieval model
# Expands queries to related terms at index time (like BM25++ with semantic expansion)
# Requires: download ELSER model in Kibana → ML → Trained Models
# Then set: query_model_id=".elser_model_2_linux-x86_64" in ApproxRetrievalStrategy
# ELSER + dense vector hybrid = ES's best out-of-box retrieval quality`,O=`# ── Elasticsearch for RAG: pros and cons ────────────────────────────────────

# PROS:
# ✓ Best-in-class BM25: proven at massive scale, excellent for keyword/lexical queries
# ✓ Native hybrid: single query returns RRF-fused BM25 + KNN results
# ✓ Mature filtering: combine semantic with any structured filter (date, price, geo)
# ✓ Scalability: horizontal sharding, replicas, 10B+ document scale
# ✓ Ecosystem: Kibana, APM, security, alerting all integrated
# ✓ Aggregations: count, terms, date-histogram over retrieved results
# ✓ Near-real-time: new documents searchable in ~1 second
# ✓ ELSER: semantic expansion without a separate embedding model

# CONS:
# ✗ Operational complexity: JVM tuning, shard sizing, mapping management
# ✗ Cost: self-hosted requires significant infrastructure; Elastic Cloud is expensive
# ✗ Vector storage overhead: dense_vector field doubles document size for 1536-dim
# ✗ No graph traversal: can't do multi-hop relationship queries (use with Neo4j)
# ✗ ANN quality: HNSW in ES is good but Qdrant/Weaviate have more tuning options

# WHEN TO CHOOSE ELASTICSEARCH:
# - You already have ES in your stack (logs, APM) → extend to RAG
# - Your retrieval mixes keyword exactness AND semantic similarity
# - You need structured filters + semantic in one query
# - Data volume is very large (100M+ documents)
# - You need BM25 quality (ES > Chroma/Pinecone for lexical recall)`,D=`# pgvector: vector search in PostgreSQL
# Open source extension: github.com/pgvector/pgvector
# pip install pgvector psycopg2-binary

# ── Install extension (run once) ─────────────────────────────────────────────
# CREATE EXTENSION IF NOT EXISTS vector;

import psycopg2
from pgvector.psycopg2 import register_vector
from openai import OpenAI

conn = psycopg2.connect("postgresql://localhost/housing")
register_vector(conn)  # registers numpy array ↔ vector type mapping

# ── Create table with vector column ──────────────────────────────────────────
with conn.cursor() as cur:
    cur.execute("""
        CREATE TABLE IF NOT EXISTS property_chunks (
            id          BIGSERIAL PRIMARY KEY,
            doc_id      TEXT      NOT NULL,
            content     TEXT      NOT NULL,
            locality    TEXT,
            bhk         INTEGER,
            price_cr    FLOAT,
            embedding   VECTOR(1536),      -- dimension must match your embedding model
            created_at  TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    # tsvector column for full-text search (BM25-equivalent in Postgres)
    cur.execute("""
        ALTER TABLE property_chunks
        ADD COLUMN IF NOT EXISTS content_tsv TSVECTOR
            GENERATED ALWAYS AS (to_tsvector('english', content)) STORED
    """)
    conn.commit()

# ── Create indexes ────────────────────────────────────────────────────────────
with conn.cursor() as cur:
    # HNSW (approximate NN, faster queries, more memory):
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_embedding_hnsw
        ON property_chunks USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
    """)
    # IVFFlat (approximate NN, less memory, needs ANALYZE after bulk insert):
    # CREATE INDEX idx_embedding_ivf ON property_chunks
    # USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    # After bulk insert: ANALYZE property_chunks;

    # GIN index for full-text search:
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_content_fts
        ON property_chunks USING GIN (content_tsv)
    """)
    conn.commit()`,G=`# ── Vector similarity search ─────────────────────────────────────────────────
def vector_search(query: str, k: int = 5, locality_filter: str = None):
    embedding = embed_query(query)  # List[float] of length 1536
    filter_clause = "AND locality = %s" if locality_filter else ""
    params = [embedding, k] if not locality_filter else [embedding, locality_filter, k]
    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT id, content, locality, price_cr,
                   1 - (embedding <=> %s::vector) AS cosine_similarity
            FROM   property_chunks
            WHERE  embedding IS NOT NULL
            {filter_clause}
            ORDER BY embedding <=> %s::vector   -- <=> = cosine distance (1 - similarity)
            LIMIT  %s
        """, [embedding] + ([locality_filter] if locality_filter else []) + [embedding, k])
        return cur.fetchall()
# Operators: <=>  cosine distance
#            <->  L2 (Euclidean) distance
#            <#>  inner product (negate for similarity: -(embedding <#> query))

# ── Full-text BM25-equivalent search (PostgreSQL ts_rank) ────────────────────
def fulltext_search(query: str, k: int = 5):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, content, locality,
                   ts_rank(content_tsv, websearch_to_tsquery('english', %s)) AS rank
            FROM   property_chunks
            WHERE  content_tsv @@ websearch_to_tsquery('english', %s)
            ORDER BY rank DESC
            LIMIT  %s
        """, [query, query, k])
        return cur.fetchall()
# websearch_to_tsquery: handles AND/OR/phrase quotes like a web search box
# ts_rank: BM25-inspired scoring (not identical but similar behaviour)

# ── Hybrid: vector + full-text with RRF in one SQL query ─────────────────────
def hybrid_search_pgvector(query: str, k: int = 5, rrf_k: int = 60):
    embedding = embed_query(query)
    with conn.cursor() as cur:
        cur.execute("""
            WITH vector_ranked AS (
                SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> %s::vector) AS rank
                FROM   property_chunks
                WHERE  embedding IS NOT NULL
                LIMIT  50
            ),
            text_ranked AS (
                SELECT id, ROW_NUMBER() OVER (ORDER BY ts_rank(content_tsv, q) DESC) AS rank
                FROM   property_chunks,
                       websearch_to_tsquery('english', %s) AS q
                WHERE  content_tsv @@ q
                LIMIT  50
            ),
            rrf_scores AS (
                SELECT COALESCE(v.id, t.id) AS id,
                       COALESCE(1.0 / (%s + v.rank), 0) +
                       COALESCE(1.0 / (%s + t.rank), 0) AS rrf_score
                FROM   vector_ranked v
                FULL   JOIN text_ranked t ON v.id = t.id
            )
            SELECT pc.id, pc.content, pc.locality, rs.rrf_score
            FROM   rrf_scores rs JOIN property_chunks pc ON rs.id = pc.id
            ORDER BY rrf_score DESC
            LIMIT  %s
        """, [embedding, query, rrf_k, rrf_k, k])
        return cur.fetchall()`,I=`# ── pgvector with LangChain (recommended for production) ─────────────────────
# pip install langchain-postgres

from langchain_postgres import PGVector
from langchain_openai import OpenAIEmbeddings
from langchain_core.documents import Document

# Connection string:
CONNECTION_STRING = "postgresql+psycopg://user:pass@localhost:5432/housing"

vector_store = PGVector(
    embeddings       = OpenAIEmbeddings(model="text-embedding-3-small"),
    collection_name  = "property_chunks",
    connection       = CONNECTION_STRING,
    use_jsonb        = True,    # store metadata in JSONB for flexible querying
)

# Add documents:
vector_store.add_documents([
    Document(page_content="Powai 2BHK near lake...", metadata={"locality": "Powai", "bhk": 2}),
])

# ── Retrieval modes ────────────────────────────────────────────────────────────
# Similarity search (cosine):
results = vector_store.similarity_search("lake view apartment", k=5)

# With score:
results_with_score = vector_store.similarity_search_with_score("lake view apartment", k=5)

# With metadata filter (uses JSONB @> operator):
results_filtered = vector_store.similarity_search(
    "2BHK properties",
    k=5,
    filter={"locality": "Powai", "bhk": 2}
)

# As retriever in a RAG chain:
retriever = vector_store.as_retriever(
    search_type   = "mmr",   # maximal marginal relevance for diversity
    search_kwargs = {"k": 8, "fetch_k": 20, "lambda_mult": 0.5},
)

# ── pgvector pros and cons ────────────────────────────────────────────────────
# PROS:
# ✓ Zero new infrastructure if you already use PostgreSQL
# ✓ ACID transactions: vector + relational data in same transaction
# ✓ Rich filtering: ANY SQL WHERE clause on metadata
# ✓ Hybrid: native full-text search (ts_rank) + vector in one query
# ✓ Point-in-time recovery, backups, all PostgreSQL tooling
# ✓ Cost: free, no separate vector DB license
# ✓ Joins: JOIN vector results with user tables, billing tables, etc.

# CONS:
# ✗ Not purpose-built for ANN: Pinecone/Qdrant are faster for pure vector at scale
# ✗ HNSW index: must be built upfront; large tables need significant build time
# ✗ Concurrent writes slow vector index: worse than write-optimised vector DBs
# ✗ Memory: HNSW index lives in RAM; 100M× 1536-dim = ~600GB RAM
# ✗ No native graph traversal (unlike Neo4j)
# ✗ No built-in BM25 exact match: ts_rank is NOT identical to BM25

# WHEN TO CHOOSE pgvector:
# - Already on PostgreSQL and want minimal ops overhead
# - Data volume is moderate (<10M documents with 1536-dim vectors)
# - You need SQL joins between vector results and application tables
# - You need transactional consistency (vector update + app state in one commit)`,q=`# ── Full decision framework: which retrieval stack to use ────────────────────

# ──────────────────────────────────────────────────────────────────────────────
# 1. PURE VECTOR SEARCH (Chroma / Qdrant / Pinecone / pgvector)
# ──────────────────────────────────────────────────────────────────────────────
# Use when:
#   → Questions are semantic ("properties good for families")
#   → Corpus is unstructured prose; no explicit entity-relationship structure
#   → Speed is critical: pure ANN in Qdrant <10ms at 10M documents
#   → Budget is tight: no LLM entity extraction cost
#   → Team is small: least operational overhead of all options
# Challenges:
#   → Can't count, aggregate, or traverse relationships
#   → Hallucination risk: "finds" semantically-adjacent chunks that misrepresent facts
#   → No exact-match guarantee (cosine ≠ keyword match)

# ──────────────────────────────────────────────────────────────────────────────
# 2. VECTOR + BM25 HYBRID (Elasticsearch, pgvector + Postgres FTS)
# ──────────────────────────────────────────────────────────────────────────────
# Use when:
#   → Queries mix keyword exactness AND semantic meaning
#   → "RERA 2024 Lodha Palava" (exact keyword) + "family-friendly large flat" (semantic)
#   → Users search like search engines (product names, model numbers, proper nouns)
#   → You need to filter by structured fields (price, location, date) + semantic
# Best implementations: Elasticsearch RRF hybrid, pgvector + ts_rank RRF CTE
# Challenges:
#   → Still can't traverse relationships (no graph)
#   → Score normalisation between BM25 and cosine is non-trivial without RRF
#   → BM25 requires maintaining good text fields (stop words, stemming)

# ──────────────────────────────────────────────────────────────────────────────
# 3. PROPERTY GRAPH INDEX (LlamaIndex PropertyGraphIndex / Neo4j)
# ──────────────────────────────────────────────────────────────────────────────
# Use when:
#   → Text corpus is entity-rich: news, legal filings, corporate data, wikis
#   → Relational questions dominate: "which developer", "connection between", "via"
#   → You want multi-hop traversal over extracted relationships
#   → Query "Who is the developer of X?" should return a specific name, not text chunks
# Challenges:
#   → High indexing cost: LLM extraction for every chunk (1 call per chunk)
#   → LLM extraction quality varies: hallucinated relationships pollute the graph
#   → Maintenance: new documents require re-extraction, entity deduplication
#   → Cypher injection: LLM-generated Cypher must be validated before execution

# ──────────────────────────────────────────────────────────────────────────────
# 4. MICROSOFT GRAPHRAG (community-based global RAG)
# ──────────────────────────────────────────────────────────────────────────────
# Use when:
#   → "Thematic" queries dominate: "what are the trends?", "summarise this corpus"
#   → Vector RAG gives fragmented, non-synthesised answers
#   → Corpus is large and interconnected (research papers, news archives, policy docs)
#   → Budget allows high indexing cost (LLM per chunk + LLM per community)
# Challenges:
#   → Very expensive indexing: 50K-chunk corpus → ~500k LLM tokens for extraction
#   → Community summaries go stale as corpus grows: must re-index periodically
#   → Global search is slow: MAP-REDUCE over all communities per query
#   → Local search quality degrades for entities not well-represented in the corpus

# ──────────────────────────────────────────────────────────────────────────────
# 5. HYBRID VECTOR + GRAPH (Neo4j + pgvector / Elasticsearch)
# ──────────────────────────────────────────────────────────────────────────────
# Use when:
#   → Production system with diverse question types (semantic + relational + thematic)
#   → Quality matters more than cost (most answer types covered)
#   → Team has capacity to maintain two backends
# Architecture: query classifier → route to Neo4j Cypher OR vector OR community search
# Challenges:
#   → Highest operational complexity
#   → Two backends to maintain, monitor, and keep in sync
#   → Routing classifier can misclassify → poor answers for edge cases`,P=`# ── Challenges and mitigations ───────────────────────────────────────────────

# GRAPH-specific challenges and mitigations:

# 1. Entity resolution / deduplication
#    Problem: "Lodha Group" and "Lodha Developers" and "Lodha Ltd" = same entity?
#             Different extractions create duplicate nodes → fragmented graph
#    Solution:
from rapidfuzz import fuzz
def deduplicate_entities(names: list[str], threshold: int = 85) -> dict[str, str]:
    canonical = {}
    for name in sorted(names):
        match = None
        for canon in canonical:
            if fuzz.ratio(name.lower(), canon.lower()) >= threshold:
                match = canon
                break
        if match:
            canonical[name] = match  # name → canonical representative
        else:
            canonical[name] = name
    return canonical
# Also: use MERGE in Cypher so duplicates collapse to one node

# 2. Relationship hallucination
#    Problem: LLM invents relationships ("Lodha Group owns Prestige Group" — false)
#    Solution: confidence-gated ingestion
def confidence_gated_ingest(triples: list[dict], threshold: float = 0.75):
    for triple in triples:
        if triple.get("confidence", 1.0) >= threshold:
            session.run("""
                MERGE (h:Entity {name: $head})
                MERGE (t:Entity {name: $tail})
                MERGE (h)-[r:RELATION {type: $rel}]->(t)
                SET r.confidence = $conf, r.source = $src
            """, head=triple["head"], tail=triple["tail"],
                 rel=triple["relation"], conf=triple["confidence"], src=triple["source"])
# DynamicLLMPathExtractor supports returning confidence scores per triple

# 3. Graph staleness (incremental updates)
#    Problem: new documents must be re-extracted and merged; old nodes may be outdated
#    Solution: document-level versioning + merge semantics
session.run("""
    MERGE (p:Property {rera_id: $rera_id})
    ON CREATE SET p += $props, p.created_at = datetime()
    ON MATCH  SET p += $props, p.updated_at = datetime()
""", rera_id="MH/123", props={...})
# MERGE + ON CREATE/MATCH = safe concurrent upsert

# 4. Cypher injection (LLM-generated queries)
#    Problem: GraphCypherQAChain outputs user-influenced Cypher; may contain mutations
DANGEROUS_KEYWORDS = {"DELETE", "DETACH", "REMOVE", "SET ", "MERGE", "CREATE", "DROP", "CALL"}
def validate_cypher(cypher: str) -> bool:
    upper = cypher.upper()
    return all(kw not in upper for kw in DANGEROUS_KEYWORDS)
# Allow: MATCH, RETURN, WITH, WHERE, ORDER BY, LIMIT, CALL db.index.fulltext.queryNodes`;function F(){return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"learning-obj",children:[e.jsx("div",{className:"learning-obj-title",children:"After this module you will be able to"}),e.jsxs("ol",{children:[e.jsx("li",{children:"Explain why vector search fails at relational, aggregation, and multi-hop questions"}),e.jsx("li",{children:"Build knowledge graphs from structured data (SQL), unstructured text (LLM/spaCy NER), semi-structured data (Obsidian wikilinks, email threads)"}),e.jsx("li",{children:"Run community detection with Leiden/Louvain, generate LLM community summaries, and use them for global RAG"}),e.jsx("li",{children:"Search a knowledge graph using Cypher, entity expansion, community search, and full-text indexes"}),e.jsx("li",{children:"Rerank graph results using cross-encoder, graph-aware topology scores, and LLM-as-judge"}),e.jsx("li",{children:"Implement hybrid vector + graph retrieval with query routing and Reciprocal Rank Fusion"}),e.jsx("li",{children:"Build full GraphRAG with Microsoft's pipeline: entity extraction → Leiden → community summaries → global/local MAP-REDUCE search"}),e.jsx("li",{children:"Set up Elasticsearch with BM25 + dense vector + RRF hybrid for RAG pipelines"}),e.jsx("li",{children:"Use pgvector for vector similarity, full-text search, and hybrid RRF in PostgreSQL"}),e.jsx("li",{children:"Apply the decision framework: choose the right stack for your question types, scale, and budget"}),e.jsx("li",{children:"Mitigate graph-specific production challenges: entity deduplication, relationship hallucination, graph staleness, Cypher injection"})]}),e.jsxs("div",{className:"obj-meta",children:[e.jsx("span",{className:"obj-time",children:"⏱ ~150 minutes"}),e.jsx("span",{className:"obj-diff",children:"Difficulty: ★★★★★"}),e.jsx("span",{className:"obj-diff",children:"Prerequisites: Module 27 (RAG Architectures), Module 33 (LlamaIndex)"})]})]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"The retrieval landscape in one paragraph"}),"Vector search finds ",e.jsx("em",{children:"similar text"}),". BM25 finds ",e.jsx("em",{children:"matching keywords"}),". Graph traversal finds ",e.jsx("em",{children:"connected entities"}),". Community search finds ",e.jsx("em",{children:"thematic clusters"}),". These are not competing choices — they answer structurally different questions. The mark of a senior AI engineer is knowing which to reach for, when to combine them, and what each one cannot do."]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"Housing.com Upgrade Context"}),e.jsx("br",{}),`Housing.com's property graph is a natural knowledge graph: developers build projects, projects have units, units are in localities, localities have amenities and connectivity. Neo4j would let users ask "which Oberoi projects have sea-facing 3BHKs within 10 minutes of a metro?" — a Cypher traversal that no vector similarity search can answer. Microsoft GraphRAG community summaries would power the "What are buyers looking for in Bandra in 2024?" type of exploratory query.`]}),e.jsx(f,{}),e.jsx("h2",{children:"34.1 Where Vector Search Fails"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:E})}),e.jsx("h2",{children:"34.2 Building Knowledge Graphs from Different Data Types"}),e.jsx("p",{children:"The right extraction method depends entirely on your data's structure. Structured data (SQL, CSV) is easiest — the schema is already the graph. Unstructured text requires NLP or LLM extraction. Semi-structured data (Markdown, email) sits in between."}),e.jsx("h3",{children:"34.2.1 From Structured Data (SQL, CSV, JSON)"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:b})}),e.jsx("h3",{children:"34.2.2 From Unstructured Text (LLM / spaCy NER)"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:R})}),e.jsx("h3",{children:"34.2.3 From Semi-Structured Data (Obsidian, Email, Code)"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:v})}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"Extraction method comparison"}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Method"}),e.jsx("th",{children:"Quality"}),e.jsx("th",{children:"Cost"}),e.jsx("th",{children:"Best for"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Structured schema → graph"}),e.jsx("td",{children:"★★★★★"}),e.jsx("td",{children:"Free"}),e.jsx("td",{children:"SQL tables, CSV with clear columns"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Wikilink parsing"}),e.jsx("td",{children:"★★★★☆"}),e.jsx("td",{children:"Free"}),e.jsx("td",{children:"Obsidian/Markdown vaults"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"spaCy NER + cooccurrence"}),e.jsx("td",{children:"★★★☆☆"}),e.jsx("td",{children:"Free (local)"}),e.jsx("td",{children:"Large corpora, budget-sensitive"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"LlamaIndex SimpleLLMPathExtractor"}),e.jsx("td",{children:"★★★★☆"}),e.jsx("td",{children:"~$0.0005/chunk"}),e.jsx("td",{children:"Rich unstructured text, moderate corpora"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"DynamicLLMPathExtractor"}),e.jsx("td",{children:"★★★★★"}),e.jsx("td",{children:"~$0.001/chunk"}),e.jsx("td",{children:"When typed entities matter (Property, Developer)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Microsoft GraphRAG pipeline"}),e.jsx("td",{children:"★★★★★"}),e.jsx("td",{children:"Highest (LLM per chunk + per community)"}),e.jsx("td",{children:"Full corpus thematic analysis"})]})]})})]}),e.jsx("h2",{children:"34.3 Community Detection — Finding Structure in Graphs"}),e.jsx("h3",{children:"34.3.1 What Communities Are and Why They Matter"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:j})}),e.jsx("h3",{children:"34.3.2 Running Leiden + Generating Community Summaries"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:S})}),e.jsxs("div",{className:"callout callout-warn",children:[e.jsx("strong",{children:"Community detection does not run on raw text"}),"You must first build the entity–relationship graph (via extraction), then run community detection on that graph. The communities are clusters of entities, not clusters of text chunks. Community summaries are LLM-written descriptions of those entity clusters. This is why GraphRAG is expensive: two stages of LLM calls — extraction and summarisation."]}),e.jsx("h2",{children:"34.4 Searching Knowledge Graphs"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:k})}),e.jsx("h2",{children:"34.5 Reranking Graph Search Results"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:w})}),e.jsx("h2",{children:"34.6 Vector + Graph Hybrid Retrieval"}),e.jsx("p",{children:"The production pattern: classify the query, route to the right retriever, fuse results with Reciprocal Rank Fusion."}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:L})}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"Why RRF beats score normalisation"}),"BM25 scores are unbounded (can be 0.1 or 22.4); cosine similarity is [0, 1]. Normalising them to the same range requires knowing the max score, which changes with each query. RRF uses ranks (positions) instead of raw scores — rank 1 always contributes ",e.jsx("code",{children:"1/(k+1)"})," regardless of whether it was a BM25 or vector result. This makes it trivially composable across heterogeneous retrievers without any calibration."]}),e.jsx("h2",{children:"34.7 Microsoft GraphRAG"}),e.jsx("h3",{children:"34.7.1 Pipeline Architecture"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:N})}),e.jsx("h3",{children:"34.7.2 Querying — Global and Local Search"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:C})}),e.jsx("h2",{children:"34.8 Elasticsearch — BM25, Dense Vector, and Hybrid RAG"}),e.jsx("h3",{children:"34.8.1 Index Setup: Text + Vector Fields"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:T})}),e.jsx("h3",{children:"34.8.2 BM25 Search, KNN Search, and Hybrid RRF"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:M})}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"How BM25 works"}),"BM25 (Best Match 25) is the default ES scoring algorithm. It extends TF-IDF with two controls: ",e.jsx("strong",{children:"k1"})," (term-frequency saturation — prevents a term appearing 100× from dominating) and ",e.jsx("strong",{children:"b"}),' (length normalisation — penalises long documents that mention a term many times just due to size). For RAG, BM25 excels at: exact product names, model numbers, RERA IDs, legal section references, and any query where the user knows the exact terminology. It fails at paraphrase — "nice and quiet area" does not match "low-noise residential locality".']}),e.jsx("h3",{children:"34.8.3 LangChain RAG Pipeline with Elasticsearch"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:A})}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:O})}),e.jsx("h2",{children:"34.9 pgvector — Vector Search in PostgreSQL"}),e.jsx("h3",{children:"34.9.1 Setup, Indexes, and HNSW vs IVFFlat"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:D})}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"HNSW vs IVFFlat: choose at index creation time"}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{}),e.jsx("th",{children:"HNSW"}),e.jsx("th",{children:"IVFFlat"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Build speed"}),e.jsx("td",{children:"Slow (graph construction)"}),e.jsx("td",{children:"Fast (k-means clustering)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Query speed"}),e.jsx("td",{children:"Fast"}),e.jsx("td",{children:"Fast"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Recall quality"}),e.jsx("td",{children:"Higher (tunable with ef_search)"}),e.jsx("td",{children:"Lower (misses items in wrong Voronoi cell)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Memory"}),e.jsx("td",{children:"Higher (graph edges in RAM)"}),e.jsx("td",{children:"Lower"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Incremental inserts"}),e.jsx("td",{children:"Good (online build)"}),e.jsx("td",{children:"Poor (rebuild or degraded recall)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Best for"}),e.jsx("td",{children:"Production: small-medium tables (<10M rows)"}),e.jsx("td",{children:"Read-heavy tables, batch-loaded"})]})]})}),"For most RAG use cases: default to HNSW with ",e.jsx("code",{children:"m=16, ef_construction=64"}),". Set ",e.jsx("code",{children:"hnsw.ef_search=100"})," at query time for higher recall. If your table exceeds 10M rows and RAM is constrained, switch to IVFFlat with ",e.jsx("code",{children:"lists ≈ sqrt(row_count)"}),"."]}),e.jsx("h3",{children:"34.9.2 Vector, Full-Text, and Hybrid RRF Queries"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:G})}),e.jsx("h3",{children:"34.9.3 LangChain PGVector Integration"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:I})}),e.jsx("h2",{children:"34.10 Decision Framework"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:q})}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Stack"}),e.jsx("th",{children:"Indexing cost"}),e.jsx("th",{children:"Query latency"}),e.jsx("th",{children:"Best question type"}),e.jsx("th",{children:"Min viable scale"}),e.jsx("th",{children:"Ops overhead"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Chroma / Qdrant (vector only)"}),e.jsx("td",{children:"Embeddings only"}),e.jsx("td",{children:"<20ms"}),e.jsx("td",{children:"Semantic similarity"}),e.jsx("td",{children:"Any"}),e.jsx("td",{children:"Low"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"pgvector"}),e.jsx("td",{children:"Embeddings only"}),e.jsx("td",{children:"20-100ms"}),e.jsx("td",{children:"Semantic + structured filter"}),e.jsx("td",{children:"Any (PostgreSQL)"}),e.jsx("td",{children:"Low (already on Postgres)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Elasticsearch hybrid"}),e.jsx("td",{children:"Embeddings only"}),e.jsx("td",{children:"30-150ms"}),e.jsx("td",{children:"Keyword + semantic + filter"}),e.jsx("td",{children:"Medium+"}),e.jsx("td",{children:"Medium (JVM, shards)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Neo4j + Cypher"}),e.jsx("td",{children:"Manual schema"}),e.jsx("td",{children:"1-50ms (indexed hops)"}),e.jsx("td",{children:"Relational / aggregation"}),e.jsx("td",{children:"Entity-rich corpora"}),e.jsx("td",{children:"Medium"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"LlamaIndex PropertyGraphIndex"}),e.jsx("td",{children:"LLM per chunk"}),e.jsx("td",{children:"100-500ms"}),e.jsx("td",{children:"Entity + relationship"}),e.jsx("td",{children:"Small-medium"}),e.jsx("td",{children:"Medium"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Microsoft GraphRAG"}),e.jsx("td",{children:"Very high (LLM×2)"}),e.jsx("td",{children:"Slow (global: seconds)"}),e.jsx("td",{children:"Thematic / global queries"}),e.jsx("td",{children:"Large corpus"}),e.jsx("td",{children:"High"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Hybrid (Neo4j + vector)"}),e.jsx("td",{children:"High"}),e.jsx("td",{children:"Varies by route"}),e.jsx("td",{children:"All types"}),e.jsx("td",{children:"Large production"}),e.jsx("td",{children:"High"})]})]})}),e.jsx("h2",{children:"34.11 Production Challenges and Mitigations"}),e.jsx("pre",{children:e.jsx("code",{className:"language-python",children:P})}),e.jsxs("div",{className:"callout callout-maang",children:[e.jsx("strong",{children:"🎯 MAANG Interview Connection"}),`"Design a search system for a real estate platform that handles both 'find me similar properties' and 'which developer built the most projects in Bandra?'" — This is the hybrid retrieval design question. A senior answer: (1) Layer 1: pgvector or Elasticsearch for semantic + keyword queries (cheap, fast, handles 90% of traffic); (2) Layer 2: Neo4j for relational/aggregation queries (Cypher generated by LLM, validated before execution); (3) Query classifier routes between layers; (4) RRF fuses results when both layers return results; (5) Community summaries (Leiden → LLM) for "what are the trends?" queries. Trade-off discussion: don't jump to GraphRAG for every use case — its indexing cost is 10-100× a vector-only approach and global search latency is seconds not milliseconds. Start with vector, add graph when relational questions appear in production analytics.`]}),e.jsx(_,{moduleId:36,title:"Module 36: Graph Knowledge Stores, Hybrid Search & Production Retrieval",contentHint:"Vector fails at aggregation multi-hop relationships, KG from SQL UNWIND MERGE, spaCy NER cooccurrence edges, Obsidian wikilinks as graph edges, Louvain vs Leiden vs LPA community detection, Leiden guarantees connected communities, gamma resolution parameter hierarchy, community summaries LLM MAP-REDUCE GraphRAG, Cypher MATCH pattern hop traversal, entity anchor subgraphAll expansion, full-text index Lucene BM25 in Neo4j, cross-encoder reranker graph topology scoring, RRF reciprocal rank fusion 1/(k+rank), query routing classifier semantic relational thematic, GraphRAG global local search entity extraction stages, Elasticsearch dense_vector BM25 hybrid RRF retriever block, ELSER learned sparse retrieval, pgvector HNSW vs IVFFlat m ef_construction cosine distance operator, hybrid RRF CTE in SQL, LangChain PGVector MMR, Cypher injection validation DANGEROUS_KEYWORDS, entity deduplication rapidfuzz MERGE, confidence-gated ingestion"})]})}export{F as Mod47};
