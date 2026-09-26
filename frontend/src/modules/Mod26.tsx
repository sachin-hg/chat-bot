import { useState } from 'react';
import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from '../components/CodeBlock';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

function HnswSearchViz() {
  const [step, setStep] = useState(-1)
  const [comparisons, setComparisons] = useState(0)

  // Fixed 3-layer HNSW graph layout
  // Layer 2 (top): sparse nodes — entry points
  // Layer 1: medium density
  // Layer 0 (bottom): all nodes — fine-grained

  const nodes: Record<string, {x:number,y:number,layer:number,id:string}> = {
    // Layer 2 (y=40)
    A: {x:200,y:40,layer:2,id:'A'}, B: {x:400,y:40,layer:2,id:'B'},
    // Layer 1 (y=120)
    C: {x:100,y:120,layer:1,id:'C'}, D: {x:220,y:120,layer:1,id:'D'},
    E: {x:340,y:120,layer:1,id:'E'}, F: {x:460,y:120,layer:1,id:'F'},
    // Layer 0 (y=200) — all nodes
    G: {x:60,y:200,layer:0,id:'G'}, H: {x:140,y:200,layer:0,id:'H'},
    I: {x:210,y:200,layer:0,id:'I'}, J: {x:280,y:200,layer:0,id:'J'},
    K: {x:340,y:200,layer:0,id:'K'}, L: {x:400,y:200,layer:0,id:'L'},
    M: {x:460,y:200,layer:0,id:'M'}, N: {x:520,y:200,layer:0,id:'N'},
  }

  // Search steps: each step highlights a node and optionally an edge
  const steps = [
    { label: 'Enter at Layer 2 — node A', node: 'A', from: null as string|null, comparisons: 1 },
    { label: 'Layer 2: A→B is closer to query', node: 'B', from: 'A', comparisons: 2 },
    { label: 'Descend to Layer 1 at node E', node: 'E', from: 'B', comparisons: 3 },
    { label: 'Layer 1: E→F is closer', node: 'F', from: 'E', comparisons: 4 },
    { label: 'Descend to Layer 0 at node M', node: 'M', from: 'F', comparisons: 5 },
    { label: 'Layer 0: M→L is closer', node: 'L', from: 'M', comparisons: 6 },
    { label: '✓ Result: node L — 6 comparisons vs brute-force 14', node: 'L', from: null as string|null, final: true, comparisons: 6 },
  ]

  const currentStep = step >= 0 ? steps[Math.min(step, steps.length-1)] : null
  const visitedNodes = steps.slice(0, Math.max(0, step)).map(s => s.node)

  const query = {x: 380, y: 200} // query embedding position (shown as ⊕)

  function getNodeColor(id: string) {
    if (!currentStep) return '#313244'
    if (currentStep.node === id && (currentStep as {final?:boolean}).final) return '#a6e3a1'
    if (currentStep.node === id) return '#f9e2af'
    if (visitedNodes.includes(id)) return '#89b4fa33'
    return '#313244'
  }

  return (
    <div style={{margin:'24px 0',background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'16px'}}>
      <div style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'#6c7086',marginBottom:'8px'}}>
        HNSW SEARCH — {step < 0 ? 'Press Play to watch greedy descent' : `Step ${step+1}/${steps.length}`}
      </div>
      <svg viewBox="0 0 580 250" width="100%" style={{display:'block'}}>
        {/* Layer labels */}
        <text x="4" y="44" fontSize="8" fill="#6c7086">L2</text>
        <text x="4" y="124" fontSize="8" fill="#6c7086">L1</text>
        <text x="4" y="204" fontSize="8" fill="#6c7086">L0</text>
        {/* Layer separator lines */}
        <line x1="20" y1="80" x2="560" y2="80" stroke="#313244" strokeDasharray="4 3"/>
        <line x1="20" y1="160" x2="560" y2="160" stroke="#313244" strokeDasharray="4 3"/>

        {/* Query point */}
        <text x={query.x} y={query.y-12} textAnchor="middle" fontSize="9" fill="#cba6f7">query ⊕</text>
        <circle cx={query.x} cy={query.y} r="6" fill="#cba6f722" stroke="#cba6f7" strokeWidth="1.5" strokeDasharray="3 2"/>

        {/* Edges (within layers) */}
        {([['A','B'],['C','D'],['D','E'],['E','F'],['G','H'],['H','I'],['I','J'],['J','K'],['K','L'],['L','M'],['M','N']] as [string,string][]).map(([a,b],i) => {
          const na = nodes[a], nb = nodes[b]
          const isTraversed = currentStep && ((currentStep.from === a && currentStep.node === b) || (currentStep.from === b && currentStep.node === a))
          return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke={isTraversed ? '#f9e2af' : '#313244'} strokeWidth={isTraversed ? 2 : 1} />
        })}
        {/* Descent edges (between layers) */}
        {([['B','E'],['B','F'],['A','D'],['E','K'],['F','M']] as [string,string][]).map(([a,b],i) => {
          const na = nodes[a], nb = nodes[b]
          return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke="#45475a" strokeWidth={1} strokeDasharray="4 3"/>
        })}

        {/* Nodes */}
        {Object.values(nodes).map(n => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r="14" fill={getNodeColor(n.id)} stroke={currentStep?.node===n.id ? '#f9e2af' : '#45475a'} strokeWidth={currentStep?.node===n.id ? 2 : 1}/>
            <text x={n.x} y={n.y+4} textAnchor="middle" fontSize="10" fill={currentStep?.node===n.id ? '#1e1e2e' : '#cdd6f4'} fontWeight={currentStep?.node===n.id ? 700 : 400}>{n.id}</text>
          </g>
        ))}

        {/* Final result ring */}
        {(currentStep as {final?:boolean}|null)?.final && (
          <circle cx={nodes.L.x} cy={nodes.L.y} r="20" fill="none" stroke="#a6e3a1" strokeWidth="2.5"/>
        )}
      </svg>

      {/* Step description */}
      <div style={{minHeight:'36px',padding:'8px 12px',background:'#1e1e2e',borderRadius:'6px',fontSize:'13px',color:'#cdd6f4',margin:'8px 0'}}>
        {currentStep ? currentStep.label : 'HNSW: greedy descent through sparse upper layers, refine at dense Layer 0. Finds approximate nearest neighbour in O(log N) comparisons.'}
      </div>

      {/* Stats */}
      {step >= 0 && (
        <div style={{display:'flex',gap:'20px',marginBottom:'8px',fontSize:'12px'}}>
          <span style={{color:'#6c7086'}}>Comparisons so far: <strong style={{color:'#89b4fa'}}>{currentStep?.comparisons ?? comparisons}</strong></span>
          <span style={{color:'#6c7086'}}>Brute-force would need: <strong style={{color:'#f38ba8'}}>14</strong></span>
        </div>
      )}

      {/* Controls */}
      <div style={{display:'flex',gap:'8px'}}>
        <button onClick={() => { setStep(-1); setComparisons(0) }} style={{background:'#313244',border:'1px solid #45475a',color:'#6c7086',borderRadius:'6px',padding:'6px 14px',fontSize:'12px',cursor:'pointer'}}>↺ Reset</button>
        <button onClick={() => setStep(s => Math.min(s+1, steps.length-1))} disabled={step >= steps.length-1} style={{background:'#89b4fa',color:'#000',border:'none',borderRadius:'6px',padding:'6px 16px',fontSize:'12px',fontWeight:700,cursor:step>=steps.length-1?'default':'pointer',opacity:step>=steps.length-1?0.5:1}}>Step → {step<0?'(Start)':''}</button>
        {step < steps.length-1 && step >= 0 && (
          <button onClick={() => {
            let s = step
            const iv = setInterval(() => {
              s++
              setStep(s)
              if (s >= steps.length-1) clearInterval(iv)
            }, 700)
          }} style={{background:'#313244',border:'1px solid #89b4fa',color:'#89b4fa',borderRadius:'6px',padding:'6px 14px',fontSize:'12px',cursor:'pointer'}}>▶ Auto-play</button>
        )}
      </div>
    </div>
  )
}

function VectorSpaceViz() {
  const docs = [
    { x: 105, y: 88,  label: '2BHK Mumbai sea view',      color: '#89b4fa', cat: 'property' },
    { x: 168, y: 102, label: 'apartment Bandra ocean',     color: '#89b4fa', cat: 'property' },
    { x: 88,  y: 128, label: '3BHK Powai lake facing',     color: '#89b4fa', cat: 'property' },
    { x: 195, y: 75,  label: 'flat Andheri West',          color: '#89b4fa', cat: 'property' },
    { x: 148, y: 155, label: 'studio apartment Juhu',      color: '#89b4fa', cat: 'property' },
    { x: 310, y: 230, label: 'pizza delivery NYC',         color: '#f38ba8', cat: 'offtopic' },
    { x: 345, y: 195, label: 'burger joint Manhattan',     color: '#f38ba8', cat: 'offtopic' },
    { x: 280, y: 258, label: 'taxi cab New York',          color: '#f38ba8', cat: 'offtopic' },
  ];
  const query = { x: 148, y: 68 };
  const nn1   = docs[0]; // sim 0.94
  const nn2   = docs[1]; // sim 0.87
  const far   = docs[5]; // sim 0.12

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>VECTOR SIMILARITY — SEMANTIC SEARCH IN EMBEDDING SPACE</div>
      <style>{`@keyframes dashFlowV26{to{stroke-dashoffset:-14}}`}</style>
      <svg viewBox="0 0 400 320" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="2D vector space showing cosine similarity between documents">
        <rect width="400" height="320" rx="6" fill="#1e1e2e"/>
        {/* Axes */}
        <line x1="40" y1="290" x2="390" y2="290" stroke="#45475a" strokeWidth="1"/>
        <line x1="40" y1="290" x2="40"  y2="30"  stroke="#45475a" strokeWidth="1"/>
        <text x="215" y="308" textAnchor="middle" fontSize="9" fill="#6c7086">Embedding Dimension 1 (2D projection of 1536-dim space)</text>
        <text x="14" y="160" textAnchor="middle" fontSize="9" fill="#6c7086" transform="rotate(-90,14,160)">Embedding Dim 2</text>

        {/* Property cluster bubble */}
        <ellipse cx="148" cy="110" rx="88" ry="68" fill="#89b4fa" fillOpacity="0.07" stroke="#89b4fa" strokeWidth="1" strokeDasharray="4,3"/>
        <text x="55" y="46" fontSize="9" fill="#89b4fa" fontWeight="bold">Property cluster</text>

        {/* Off-topic cluster bubble */}
        <ellipse cx="315" cy="228" rx="68" ry="48" fill="#f38ba8" fillOpacity="0.07" stroke="#f38ba8" strokeWidth="1" strokeDasharray="4,3"/>
        <text x="272" y="288" fontSize="9" fill="#f38ba8" fontWeight="bold">Off-topic cluster</text>

        {/* Document dots */}
        {docs.map((d, i) => (
          <g key={i}>
            <circle cx={d.x} cy={d.y} r="5" fill={d.color} opacity="0.85"/>
            <text x={d.x + 7} y={d.y + 4} fontSize="9" fill="#bac2de">{d.label}</text>
          </g>
        ))}

        {/* Query star */}
        <polygon
          points={`${query.x},${query.y-10} ${query.x+2.5},${query.y-3.5} ${query.x+9},${query.y-3} ${query.x+4},${query.y+2} ${query.x+6},${query.y+9} ${query.x},${query.y+5} ${query.x-6},${query.y+9} ${query.x-4},${query.y+2} ${query.x-9},${query.y-3} ${query.x-2.5},${query.y-3.5}`}
          fill="#f9e2af" stroke="#f9e2af" strokeWidth="0.5"
        />
        <text x={query.x + 12} y={query.y - 2} fontSize="10" fill="#f9e2af" fontWeight="bold">Query: "2BHK Bandra sea view"</text>

        {/* Defs for arrowheads */}
        <defs>
          <marker id="v26-arr-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#a6e3a1"/>
          </marker>
          <marker id="v26-arr-teal" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#94e2d5"/>
          </marker>
          <marker id="v26-arr-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#6c7086"/>
          </marker>
        </defs>

        {/* NN1 line — high similarity */}
        <line x1={query.x} y1={query.y+10} x2={nn1.x} y2={nn1.y-6}
          stroke="#a6e3a1" strokeWidth="1.5" strokeDasharray="4 3"
          markerEnd="url(#v26-arr-green)"
          style={{animation:'dashFlowV26 1s linear infinite'}}/>
        <text x="72" y="62" fontSize="10" fill="#a6e3a1" fontWeight="bold">similarity: 0.94</text>

        {/* NN2 line — medium similarity */}
        <line x1={query.x+8} y1={query.y+6} x2={nn2.x-4} y2={nn2.y-6}
          stroke="#94e2d5" strokeWidth="1.5" strokeDasharray="4 3"
          markerEnd="url(#v26-arr-teal)"
          style={{animation:'dashFlowV26 1s linear infinite'}}/>
        <text x="160" y="76" fontSize="10" fill="#94e2d5" fontWeight="bold">similarity: 0.87</text>

        {/* Far neighbor line — low similarity */}
        <line x1={query.x+9} y1={query.y+3} x2={far.x-8} y2={far.y-4}
          stroke="#6c7086" strokeWidth="1" strokeDasharray="3 4" markerEnd="url(#v26-arr-red)"/>
        <text x="220" y="162" fontSize="9" fill="#6c7086">similarity: 0.12</text>

        {/* Legend */}
        <circle cx="48" cy="312" r="4" fill="#89b4fa"/>
        <text x="56" y="316" fontSize="9" fill="#bac2de">Property (relevant)</text>
        <circle cx="162" cy="312" r="4" fill="#f38ba8"/>
        <text x="170" y="316" fontSize="9" fill="#bac2de">Off-topic (irrelevant)</text>
        <polygon points="248,308 250,313 255,313 251,316 252,321 248,318 244,321 245,316 241,313 246,313" fill="#f9e2af"/>
        <text x="258" y="316" fontSize="9" fill="#bac2de">Query vector</text>
      </svg>
    </div>
  );
}

function HnswIvfViz() {
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>INDEX ALGORITHMS — HNSW VS IVFFLAT</div>
      <svg viewBox="0 0 560 200" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="HNSW vs IVFFlat index algorithm comparison">
        <rect width="560" height="200" rx="6" fill="#1e1e2e"/>

        {/* Divider */}
        <line x1="280" y1="10" x2="280" y2="190" stroke="#313244" strokeWidth="1" strokeDasharray="4,3"/>

        {/* ── LEFT: HNSW ── */}
        <text x="140" y="22" textAnchor="middle" fontSize="11" fill="#89b4fa" fontWeight="bold">HNSW: Graph-based, O(log n) search</text>

        {/* Layer 2 — sparse (top) */}
        <text x="48" y="44" fontSize="9" fill="#6c7086">Layer 2</text>
        {[90,170].map((cx,i) => (
          <g key={i}>
            <circle cx={cx} cy={42} r="6" fill="#89b4fa" opacity="0.8"/>
          </g>
        ))}
        <line x1="96" y1="42" x2="164" y2="42" stroke="#89b4fa" strokeWidth="1" opacity="0.5"/>

        {/* Layer 1 — mid */}
        <text x="48" y="92" fontSize="9" fill="#6c7086">Layer 1</text>
        {[75,110,145,185,220].map((cx,i) => (
          <circle key={i} cx={cx} cy={90} r="5" fill="#89b4fa" opacity="0.65"/>
        ))}
        {[[75,110],[110,145],[145,185],[185,220],[75,145],[110,185]].map(([x1,x2],i) => (
          <line key={i} x1={x1} y1="90" x2={x2} y2="90" stroke="#89b4fa" strokeWidth="1" opacity="0.35"/>
        ))}

        {/* Layer 0 — dense */}
        <text x="48" y="140" fontSize="9" fill="#6c7086">Layer 0</text>
        {[65,85,105,125,145,165,185,205,225,245].map((cx,i) => (
          <circle key={i} cx={cx} cy={138} r="4" fill="#89b4fa" opacity="0.5"/>
        ))}
        {[[65,85],[85,105],[105,125],[125,145],[145,165],[165,185],[185,205],[205,225],[225,245],[65,105],[85,125],[105,165],[145,205]].map(([x1,x2],i) => (
          <line key={i} x1={x1} y1="138" x2={x2} y2="138" stroke="#89b4fa" strokeWidth="0.7" opacity="0.25"/>
        ))}

        {/* Vertical connections between layers */}
        <line x1="90" y1="48" x2="85" y2="85" stroke="#89b4fa" strokeWidth="1" strokeDasharray="2,2" opacity="0.4"/>
        <line x1="90" y1="48" x2="110" y2="85" stroke="#89b4fa" strokeWidth="1" strokeDasharray="2,2" opacity="0.4"/>
        <line x1="170" y1="48" x2="165" y2="85" stroke="#89b4fa" strokeWidth="1" strokeDasharray="2,2" opacity="0.4"/>
        <line x1="170" y1="48" x2="185" y2="85" stroke="#89b4fa" strokeWidth="1" strokeDasharray="2,2" opacity="0.4"/>
        <line x1="110" y1="95" x2="105" y2="133" stroke="#89b4fa" strokeWidth="1" strokeDasharray="2,2" opacity="0.3"/>
        <line x1="185" y1="95" x2="185" y2="133" stroke="#89b4fa" strokeWidth="1" strokeDasharray="2,2" opacity="0.3"/>

        {/* Layer labels */}
        <text x="140" y="160" textAnchor="middle" fontSize="9" fill="#6c7086">↑ dense neighborhood connections</text>
        <text x="140" y="175" textAnchor="middle" fontSize="9" fill="#a6e3a1">Best for: high recall (95%+), RAM available</text>
        <text x="140" y="190" textAnchor="middle" fontSize="8" fill="#6c7086">Used in: pgvector, Weaviate, Qdrant</text>

        {/* ── RIGHT: IVFFlat ── */}
        <text x="420" y="22" textAnchor="middle" fontSize="11" fill="#cba6f7" fontWeight="bold">IVFFlat: Cluster-based, nlist=100</text>

        {/* 4 cluster circles with points */}
        {[
          { cx:330, cy:80,  r:32, color:'#cba6f7', pts:[{dx:-12,dy:-8},{dx:8,dy:-12},{dx:-5,dy:10},{dx:14,dy:6}] },
          { cx:410, cy:68,  r:28, color:'#f38ba8', pts:[{dx:-8,dy:-5},{dx:10,dy:-8},{dx:5,dy:9}] },
          { cx:345, cy:148, r:30, color:'#a6e3a1', pts:[{dx:-10,dy:-6},{dx:8,dy:-10},{dx:-4,dy:10},{dx:12,dy:4}] },
          { cx:430, cy:140, r:26, color:'#fab387', pts:[{dx:-8,dy:-4},{dx:7,dy:-9},{dx:4,dy:8}] },
        ].map((cl,i) => (
          <g key={i}>
            <circle cx={cl.cx} cy={cl.cy} r={cl.r} fill={cl.color} fillOpacity="0.08" stroke={cl.color} strokeWidth="1.5" strokeDasharray="3,2"/>
            <circle cx={cl.cx} cy={cl.cy} r="4" fill={cl.color} opacity="0.9"/>
            {cl.pts.map((p,j) => (
              <circle key={j} cx={cl.cx+p.dx} cy={cl.cy+p.dy} r="2.5" fill={cl.color} opacity="0.55"/>
            ))}
          </g>
        ))}

        {/* Centroid labels */}
        <text x="303" y="82" fontSize="8" fill="#cba6f7">C1</text>
        <text x="384" y="70" fontSize="8" fill="#f38ba8">C2</text>
        <text x="318" y="150" fontSize="8" fill="#a6e3a1">C3</text>
        <text x="405" y="142" fontSize="8" fill="#fab387">C4</text>

        {/* Query hits nearest centroid arrow */}
        <defs>
          <marker id="v26-ivf-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#f9e2af"/>
          </marker>
        </defs>
        <circle cx="385" cy="108" r="5" fill="#f9e2af" stroke="#f9e2af" strokeWidth="1"/>
        <text x="390" y="106" fontSize="8" fill="#f9e2af">Q</text>
        <line x1="385" y1="108" x2="414" y2="76" stroke="#f9e2af" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#v26-ivf-arr)"/>
        <text x="395" y="90" fontSize="8" fill="#f9e2af">→ nearest C2</text>

        <text x="420" y="175" textAnchor="middle" fontSize="9" fill="#a6e3a1">Best for: low RAM, large corpora (&gt;100M)</text>
        <text x="420" y="190" textAnchor="middle" fontSize="8" fill="#6c7086">Used in: pgvector (ivfflat), Pinecone (internal)</text>
      </svg>
    </div>
  );
}

const CODE_CHROMA = `import chromadb
from chromadb.utils import embedding_functions

client = chromadb.PersistentClient(path="./chroma_db")   # survives restarts
# Docker: mount a volume so data persists: docker run -v $(pwd)/chroma_db:/app/chroma_db ...
# Use absolute path from env var in production: path=os.getenv("CHROMA_PATH", "/data/chroma")
ef = embedding_functions.OpenAIEmbeddingFunction(api_key="sk-...", model_name="text-embedding-3-small")
# get_or_create_collection: idempotent — does NOT fail if the collection already exists
# (create_collection() raises CollectionAlreadyExistsError on restart — use this instead)
collection = client.get_or_create_collection("property_docs", embedding_function=ef)

collection.add(
    documents=["3BHK in Bandra West, ₹2.5Cr, sea-facing"],
    metadatas=[{"city": "Mumbai", "bhk": 3}],
    ids=["prop_001"],
)
results = collection.query(
    query_texts=["sea-facing apartment Mumbai"],
    n_results=5,
    where={"city": "Mumbai"},   # metadata filter
)`;

const CODE_PINECONE = `from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key="...")
pc.create_index("property-docs", dimension=1536, metric="cosine",
    spec=ServerlessSpec(cloud="aws", region="us-east-1"))
index = pc.Index("property-docs")

# Upsert — batch 100 vectors at a time for efficiency
index.upsert(vectors=[{
    "id": "prop_001",
    "values": embed("3BHK Bandra West ₹2.5Cr"),
    "metadata": {"city": "Mumbai", "bhk": 3, "tenant_id": "housing_com"},
}], namespace="housing_com")   # namespace = tenant isolation

# Query with metadata filter
results = index.query(
    vector=embed("sea-facing flat Mumbai"),
    top_k=5, namespace="housing_com",
    filter={"city": {"$eq": "Mumbai"}, "bhk": {"$gte": 2}},
    include_metadata=True,
)

# Sparse-dense hybrid (keyword + semantic)
results = index.query(
    vector=dense_vector,
    sparse_vector={"indices": [101, 305], "values": [0.8, 0.3]},
    top_k=5, alpha=0.7,   # 0.7 dense + 0.3 sparse
)`;

const CODE_PGVECTOR_SQL = `CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE property_embeddings (
    id        TEXT PRIMARY KEY,
    content   TEXT,
    metadata  JSONB,
    embedding vector(1536)
);

-- HNSW index: better recall, more memory
-- Use CONCURRENTLY so Postgres builds the index without locking the table.
-- Without it, the table is locked for the entire build (minutes on large tables).
--
-- m = 16: number of bidirectional links per node in the HNSW graph.
--   Higher m → better recall + faster search, but more RAM and slower index build.
--   Default 16 is right for most workloads. Use m=32 if recall is below target.
--
-- ef_construction = 64: candidate list size during graph construction.
--   Higher ef_construction → better graph quality (higher recall), slower index build.
--   64 is the standard starting value. Use 128 if you can afford a longer build time.
--   Does NOT affect query speed — only affects index build time and recall ceiling.
CREATE INDEX CONCURRENTLY ON property_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Similarity search with SQL filter
SELECT content, 1 - (embedding <=> $1) AS similarity
FROM property_embeddings
WHERE metadata->>'city' = 'Mumbai'
ORDER BY embedding <=> $1
LIMIT 5;`;

const CODE_PGVECTOR_PY = `from langchain_postgres import PGVector
vectorstore = PGVector(
    embeddings=OpenAIEmbeddings(),
    collection_name="property_docs",
    connection="postgresql+psycopg://user:pass@localhost/dbname",
)
results = vectorstore.similarity_search("sea-facing Mumbai", k=5)`;

function DecisionFrameworkCards() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const cards = [
    {
      id: 'chroma',
      title: 'ChromaDB',
      badge: 'Open Source / Dev',
      badgeColor: 'var(--accent2, #a6e3a1)',
      borderColor: 'var(--accent2, #a6e3a1)',
      useCase: 'Local development, prototyping, no infra ops',
      stat: '0 setup time, unlimited local vectors',
      warning: 'No managed cloud — you own ops at scale',
    },
    {
      id: 'pgvector',
      title: 'pgvector',
      badge: 'Postgres Extension',
      badgeColor: 'var(--accent, #89b4fa)',
      borderColor: 'var(--accent, #89b4fa)',
      useCase: 'Already on Postgres, mixed relational + vector queries',
      stat: 'Full SQL joins on vector results',
      warning: 'Embedding lock-in risk — migration requires re-embedding entire corpus',
    },
    {
      id: 'pinecone',
      title: 'Pinecone',
      badge: 'Managed Cloud',
      badgeColor: 'var(--accent5, #cba6f7)',
      borderColor: 'var(--accent5, #cba6f7)',
      useCase: 'Production scale, no infra team, latency SLAs',
      stat: 'p99 < 100ms at 1B vectors',
      warning: 'Proprietary — vendor lock-in, egress costs',
    },
  ]

  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',margin:'16px 0'}}>
      {cards.map(card => (
        <div
          key={card.id}
          onMouseEnter={() => setHoveredCard(card.id)}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            background:'#1e1e2e',
            border:'1px solid #313244',
            borderLeft:`3px solid ${card.borderColor}`,
            borderRadius:'8px',
            padding:'16px',
            position:'relative',
            cursor:'default',
            transition:'box-shadow .2s',
            boxShadow: hoveredCard === card.id ? `0 0 0 1px ${card.borderColor}44` : 'none',
          }}
        >
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'8px',marginBottom:'10px'}}>
            <span style={{fontSize:'15px',fontWeight:700,color:'#cdd6f4'}}>{card.title}</span>
            <span style={{
              fontSize:'10px',fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase',
              background:`${card.badgeColor}22`,color:card.badgeColor,
              border:`1px solid ${card.badgeColor}55`,
              borderRadius:'4px',padding:'2px 7px',whiteSpace:'nowrap',
            }}>{card.badge}</span>
          </div>
          <div style={{fontSize:'12px',color:'#a6adc8',marginBottom:'10px',lineHeight:'1.5'}}>
            <strong style={{color:'#6c7086',fontSize:'10px',textTransform:'uppercase',letterSpacing:'.07em'}}>Use case</strong>
            <div style={{marginTop:'2px'}}>{card.useCase}</div>
          </div>
          <div style={{fontSize:'12px',color:`${card.badgeColor}cc`,fontWeight:600,marginBottom:'10px',padding:'6px 10px',background:`${card.badgeColor}11`,borderRadius:'5px'}}>
            {card.stat}
          </div>
          {hoveredCard === card.id && (
            <div style={{
              position:'absolute',bottom:'calc(100% + 6px)',left:'0',right:'0',
              background:'#313244',border:`1px solid ${card.borderColor}88`,
              borderRadius:'6px',padding:'8px 12px',
              fontSize:'11px',color:'#f38ba8',lineHeight:'1.4',
              zIndex:10,boxShadow:'0 4px 16px #0006',
            }}>
              <span style={{fontWeight:700,marginRight:'4px'}}>Warning:</span>{card.warning}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const EMBEDDING_DATA = [
  { name: 'text-embedding-3-small', cost: 0.02, recall: 62.3, dimensions: 1536, color: 'var(--accent, #89b4fa)',
    detail: 'OpenAI API call required per query. 1536 dims fit in pgvector default. Good baseline for most RAG pipelines before tuning.' },
  { name: 'text-embedding-3-large', cost: 0.13, recall: 64.6, dimensions: 3072, color: 'var(--accent5, #cba6f7)',
    detail: 'OpenAI API. 3072 dims need pgvector WITH (m=32) and extra RAM. 6x cost of small for ~2pt recall gain — usually not worth it.' },
  { name: 'text-embedding-ada-002', cost: 0.10, recall: 61.0, dimensions: 1536, color: 'var(--muted, #6c7086)',
    detail: 'Legacy OpenAI model. Superseded by text-embedding-3-small which is cheaper and better. Avoid for new projects.' },
  { name: 'bge-large-en', cost: 0.0, recall: 64.2, dimensions: 1024, color: 'var(--accent2, #a6e3a1)',
    detail: 'Self-hosted on GPU, zero marginal cost, 1024-dim embeddings fit in Postgres pgvector default. Best open-source option for English-only corpora.' },
  { name: 'e5-mistral-7b', cost: 0.0, recall: 66.6, dimensions: 4096, color: 'var(--accent3, #fab387)',
    detail: 'Self-hosted 7B model — needs A100/H100 GPU. Highest recall on MTEB. 4096 dims require custom pgvector build. Worth it only at large scale with GPU infra.' },
]

type EmbeddingPoint = typeof EMBEDDING_DATA[number]

function EmbeddingTooltip({ active, payload }: { active?: boolean; payload?: Array<{payload: EmbeddingPoint}> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{background:'#313244',border:'1px solid #45475a',borderRadius:'6px',padding:'8px 12px',fontSize:'11px',color:'#cdd6f4',maxWidth:'200px'}}>
      <div style={{fontWeight:700,marginBottom:'4px',color:'#cdd6f4'}}>{d.name}</div>
      <div>Cost: <strong style={{color:'#f9e2af'}}>${d.cost}/1M tokens</strong></div>
      <div>MTEB Recall: <strong style={{color:'#a6e3a1'}}>{d.recall}</strong></div>
      <div>Dimensions: <strong style={{color:'#89b4fa'}}>{d.dimensions}</strong></div>
    </div>
  )
}

function EmbeddingModelScatter() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null)

  const selected = selectedModel ? EMBEDDING_DATA.find(d => d.name === selectedModel) : null

  return (
    <div style={{margin:'16px 0'}}>
      <div style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'#6c7086',marginBottom:'8px'}}>
        EMBEDDING MODEL COMPARISON — Click a bubble to see deployment details
      </div>
      <div style={{fontSize:'10px',color:'#45475a',marginBottom:'12px'}}>X: Cost per 1M tokens ($) &nbsp;|&nbsp; Y: MTEB Recall Score &nbsp;|&nbsp; Bubble size: dimensions</div>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{top:10,right:20,bottom:20,left:10}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#313244"/>
          <XAxis
            type="number" dataKey="cost" name="Cost"
            label={{value:'Cost per 1M tokens ($)',position:'insideBottom',offset:-8,fontSize:10,fill:'#6c7086'}}
            tick={{fontSize:10,fill:'#6c7086'}} tickFormatter={v => `$${v}`}
          />
          <YAxis
            type="number" dataKey="recall" name="Recall"
            label={{value:'MTEB Recall',angle:-90,position:'insideLeft',offset:10,fontSize:10,fill:'#6c7086'}}
            tick={{fontSize:10,fill:'#6c7086'}} domain={[59,68]}
          />
          <ZAxis type="number" dataKey="dimensions" range={[40,200]} name="Dimensions"/>
          <Tooltip content={<EmbeddingTooltip />}/>
          <Legend
            formatter={(value: string) => <span style={{fontSize:'10px',color:'#a6adc8'}}>{value}</span>}
            wrapperStyle={{paddingTop:'8px'}}
          />
          <Scatter
            name="Embedding Models"
            data={EMBEDDING_DATA}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={(d: any) => { const name: string | undefined = d?.name; if (name) setSelectedModel(prev => prev === name ? null : name) }}
            style={{cursor:'pointer'}}
          >
            {EMBEDDING_DATA.map(entry => (
              <Cell
                key={entry.name}
                fill={entry.color}
                stroke={selectedModel === entry.name ? '#f9e2af' : 'transparent'}
                strokeWidth={selectedModel === entry.name ? 2.5 : 0}
                fillOpacity={selectedModel && selectedModel !== entry.name ? 0.35 : 0.85}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div style={{display:'flex',flexWrap:'wrap',gap:'10px',marginTop:'4px',justifyContent:'center'}}>
        {EMBEDDING_DATA.map(d => (
          <button
            key={d.name}
            onClick={() => setSelectedModel(prev => prev === d.name ? null : d.name)}
            style={{
              background: selectedModel === d.name ? `${d.color}22` : 'transparent',
              border: `1px solid ${selectedModel === d.name ? d.color : '#313244'}`,
              borderRadius:'5px',padding:'3px 10px',fontSize:'10px',
              color: selectedModel === d.name ? d.color : '#6c7086',
              cursor:'pointer',fontFamily:'monospace',
            }}
          >{d.name}</button>
        ))}
      </div>
      {selected && (
        <div style={{
          marginTop:'14px',background:'#1e1e2e',border:`1px solid ${selected.color}66`,
          borderLeft:`3px solid ${selected.color}`,borderRadius:'7px',
          padding:'12px 16px',fontSize:'12px',color:'#a6adc8',lineHeight:'1.6',
        }}>
          <span style={{fontWeight:700,color:selected.color,marginRight:'8px',fontFamily:'monospace'}}>{selected.name}</span>
          <span style={{background:`${selected.color}22`,color:selected.color,fontSize:'10px',borderRadius:'4px',padding:'1px 6px',marginRight:'8px'}}>${selected.cost}/1M · {selected.dimensions}D · Recall {selected.recall}</span>
          <div style={{marginTop:'6px'}}>{selected.detail}</div>
        </div>
      )}
    </div>
  )
}

export function Mod26() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Explain how vector search works — embedding space, cosine similarity, HNSW vs IVF</li>
          <li>Set up ChromaDB for local development and Pinecone for production</li>
          <li>Configure pgvector in PostgreSQL with HNSW index and metadata filters</li>
          <li>Choose between ChromaDB, Pinecone, pgvector, Weaviate, and Qdrant for any use case</li>
          <li>Select an embedding model based on dimension, cost, and retrieval quality</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~70 minutes</span>
          <span className="obj-diff">Difficulty: ★★★☆☆</span>
          <span className="obj-diff">Prerequisites: Module 2.8, Module 24</span>
        </div>
      </div>

      <div className="callout callout-info">
        <strong>Housing.com Context</strong><br />
        Housing.com's property retrieval uses structured SQL with exact filters. Vector search would enable the next layer: "find me something similar to properties I've liked" — semantic similarity over embeddings of property descriptions and user preferences.
      </div>

      <h2>26.0 Choose Your Retrieval Architecture First</h2>
      <p>Before choosing a vector database, choose the right retrieval <em>strategy</em>. The database is an implementation detail; the strategy determines cost, latency, and answer quality. Walk this decision tree:</p>
      <div style={{background:"#1e1e2e",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"12px 0",fontFamily:"'Courier New',monospace",fontSize:"13px"}}>
        <div style={{marginBottom:"12px"}}>
          <span style={{color:"#fab387",fontWeight:"bold"}}>Q1 </span>
          <span style={{color:"#cdd6f4"}}>Is your corpus &lt; 50k docs <strong>and</strong> queries are purely semantic (no exact keyword matching)?</span>
          <div style={{marginLeft:"20px",marginTop:"6px",borderLeft:"2px solid #a6e3a1",paddingLeft:"12px"}}>
            <span style={{color:"#a6e3a1",fontWeight:"bold"}}>→ Pure vector</span>
            <span style={{color:"#a6adc8"}}> (ChromaDB for dev, Qdrant or pgvector for prod) — lowest cost, simplest ops, fast iteration. Stop here.</span>
          </div>
        </div>
        <div style={{marginBottom:"12px"}}>
          <span style={{color:"#fab387",fontWeight:"bold"}}>Q2 </span>
          <span style={{color:"#cdd6f4"}}>Are you already on PostgreSQL <strong>and</strong> sub-10ms P99 is not required?</span>
          <div style={{marginLeft:"20px",marginTop:"6px",borderLeft:"2px solid #a6e3a1",paddingLeft:"12px"}}>
            <span style={{color:"#a6e3a1",fontWeight:"bold"}}>→ pgvector</span>
            <span style={{color:"#a6adc8"}}> — zero new infrastructure, ACID transactions, SQL joins with your existing data. Stop here.</span>
          </div>
        </div>
        <div style={{marginBottom:"12px"}}>
          <span style={{color:"#fab387",fontWeight:"bold"}}>Q3 </span>
          <span style={{color:"#cdd6f4"}}>Do queries mix <strong>exact keywords</strong> ("RERA registered") with semantic similarity?</span>
          <div style={{marginLeft:"20px",marginTop:"6px",borderLeft:"2px solid #89b4fa",paddingLeft:"12px"}}>
            <span style={{color:"#89b4fa",fontWeight:"bold"}}>→ Elasticsearch BM25 + KNN hybrid with RRF</span>
            <span style={{color:"#a6adc8"}}> — best of both worlds; dense + sparse retrieval ranked by Reciprocal Rank Fusion.</span>
          </div>
        </div>
        <div style={{marginBottom:"12px"}}>
          <span style={{color:"#fab387",fontWeight:"bold"}}>Q4 </span>
          <span style={{color:"#cdd6f4"}}>Does the text contain <strong>named entities with relationships</strong> (developer → project → locality)?</span>
          <div style={{marginLeft:"20px",marginTop:"6px",borderLeft:"2px solid #cba6f7",paddingLeft:"12px"}}>
            <span style={{color:"#cba6f7",fontWeight:"bold"}}>→ PropertyGraphIndex (LlamaIndex) or Neo4j + vector</span>
            <span style={{color:"#a6adc8"}}> — graph traversal answers "all projects by this developer" that pure vector cannot.</span>
          </div>
        </div>
        <div style={{marginBottom:"12px"}}>
          <span style={{color:"#fab387",fontWeight:"bold"}}>Q5 </span>
          <span style={{color:"#cdd6f4"}}>Do users ask <strong>corpus-wide questions</strong> ("what are the emerging micro-markets in 2024?")?</span>
          <div style={{marginLeft:"20px",marginTop:"6px",borderLeft:"2px solid #f38ba8",paddingLeft:"12px"}}>
            <span style={{color:"#f38ba8",fontWeight:"bold"}}>→ Microsoft GraphRAG community summaries</span>
            <span style={{color:"#a6adc8"}}> — Leiden clustering generates LLM summaries of each community; MAP-REDUCE global search answers theme questions.</span>
          </div>
        </div>
        <div>
          <span style={{color:"#fab387",fontWeight:"bold"}}>Q6 </span>
          <span style={{color:"#cdd6f4"}}>Multiple question types in the same product (semantic + keyword + relational + global)?</span>
          <div style={{marginLeft:"20px",marginTop:"6px",borderLeft:"2px solid #f9e2af",paddingLeft:"12px"}}>
            <span style={{color:"#f9e2af",fontWeight:"bold"}}>→ Query router</span>
            <span style={{color:"#a6adc8"}}> — classify intent at query time, dispatch to the right backend per intent. Each backend is optimised for its question type.</span>
          </div>
        </div>
      </div>
      <p style={{marginTop:"4px",fontSize:"13px",color:"#a6adc8"}}>For deep dives on graph search and the GraphRAG pipeline, see Module 34 (Graph Knowledge Stores). The Elasticsearch and pgvector hybrid patterns are covered there too.</p>
      <div style={{overflowX:"auto",margin:"16px 0"}}>
        <table style={{fontSize:"12px",minWidth:"700px"}}>
          <tbody>
            <tr><th>Stack</th><th>Index cost</th><th>Query latency</th><th>Ops overhead</th><th>Best for</th></tr>
            <tr><td><strong>ChromaDB</strong></td><td>Zero (local)</td><td>5–20ms</td><td>None</td><td>Dev / prototyping, &lt;1M docs</td></tr>
            <tr><td><strong>pgvector</strong></td><td>Low (HNSW)</td><td>10–40ms</td><td>Low (same DB)</td><td>Postgres shops, ACID needed</td></tr>
            <tr><td><strong>Pinecone</strong></td><td>Managed</td><td>&lt;10ms p99</td><td>None</td><td>Prod scale, SaaS, multi-tenant</td></tr>
            <tr><td><strong>Qdrant</strong></td><td>Low–Med</td><td>&lt;10ms p99</td><td>Medium (self-host)</td><td>Open-source, payload filtering</td></tr>
            <tr><td><strong>Elasticsearch</strong></td><td>Med (dual index)</td><td>20–60ms</td><td>High</td><td>BM25 + vector hybrid, existing ES</td></tr>
            <tr><td><strong>Neo4j + vector</strong></td><td>High (graph)</td><td>50–200ms</td><td>High</td><td>Entity relationships, graph queries</td></tr>
            <tr><td><strong>GraphRAG</strong></td><td>Very high (LLM)</td><td>Seconds (global)</td><td>High</td><td>Thematic / corpus-wide questions</td></tr>
          </tbody>
        </table>
      </div>

      <VectorSpaceViz />
      <h2>26.1 How Vector Search Works</h2>
      <div className="callout callout-info"><strong>What an embedding actually is</strong>
        The numbers themselves are meaningless — <code>-0.87</code> in position 2 doesn't "mean" anything in isolation. <strong>It is the spatial relationship between vectors that encodes meaning.</strong>
        <br /><br />
        Imagine plotting 5 texts in 2D space (simplified from 1536D):
        <pre style={{fontSize: "11px", background: "#1e1e2e", color: "#cdd6f4", padding: "6px", borderRadius: "4px", marginTop: "4px"}}>{"           Y\n           ↑\n  \"2BHK Bandra\" •  • \"flat Mumbai\"   ← property cluster\n  \"apartment\" •\n                            • \"Hello\" • \"Hi there\"  ← greeting cluster\n                -------→ X"}</pre>
        "2BHK" and "flat" land near each other because the embedding model was trained on billions of texts where these words appear in similar contexts. The model adjusts its weights (billions of numbers) until similar meanings produce similar vector directions.
        <br /><br />
        <strong>Cosine similarity vs Euclidean distance:</strong> cosine measures the <em>angle</em> between two vectors, ignoring magnitude. A short document and a long document about the same topic will have similar cosine similarity (same direction) but very different Euclidean distance (different magnitudes). Use cosine for text — document length shouldn't affect relevance.
        <br /><br />
        <em>Numeric example:</em> A=[0.6, 0.8], B=[0.3, 0.4] (B is half the magnitude of A). Euclidean: 0.5 (seems distant). Cosine: 1.0 (same direction = same meaning). For text where word count varies, cosine is correct.
      </div>

      <svg width="500" height="300" viewBox="0 0 500 300" style={{display: "block", margin: "12px auto", fontFamily: "'Courier New',monospace"}}>
        <rect width="500" height="300" rx="6" fill="#1e1e2e"/>
        <text x="250" y="20" textAnchor="middle" fill="#cdd6f4" fontSize="11" fontWeight="bold">t-SNE: 2D projection of 1536-dim embedding space (Housing.com domain)</text>
        <line x1="30" y1="260" x2="470" y2="260" stroke="#45475a" strokeWidth="1"/>
        <line x1="30" y1="260" x2="30"  y2="35"  stroke="#45475a" strokeWidth="1"/>
        <text x="250" y="285" textAnchor="middle" fill="#6c7086" fontSize="9">Dimension 1 (semantic axis — meaningless in isolation)</text>
        <text x="14" y="150" textAnchor="middle" fill="#6c7086" fontSize="9" transform="rotate(-90,14,150)">Dimension 2</text>
        <ellipse cx="120" cy="95" rx="72" ry="45" fill="#a6e3a1" fillOpacity="0.12" stroke="#a6e3a1" strokeWidth="1.5" strokeDasharray="4,2"/>
        <text x="120" y="40" textAnchor="middle" fill="#a6e3a1" fontSize="9" fontWeight="bold">Property listings</text>
        <circle cx="95"  cy="80"  r="5" fill="#a6e3a1"/><text x="101" y="83"  fill="#cdd6f4" fontSize="8">"2BHK in Bandra"</text>
        <circle cx="130" cy="95"  r="5" fill="#a6e3a1"/><text x="136" y="98"  fill="#cdd6f4" fontSize="8">"flat Mumbai"</text>
        <circle cx="85"  cy="110" r="5" fill="#a6e3a1"/><text x="91"  y="113" fill="#cdd6f4" fontSize="8">"sea view 3BHK"</text>
        <circle cx="145" cy="115" r="5" fill="#a6e3a1"/><text x="151" y="118" fill="#cdd6f4" fontSize="8">"apartment Powai"</text>
        <ellipse cx="370" cy="210" rx="70" ry="40" fill="#89b4fa" fillOpacity="0.12" stroke="#89b4fa" strokeWidth="1.5" strokeDasharray="4,2"/>
        <text x="370" y="260" textAnchor="middle" fill="#89b4fa" fontSize="9" fontWeight="bold">Locality names</text>
        <circle cx="340" cy="200" r="5" fill="#89b4fa"/><text x="346" y="203" fill="#cdd6f4" fontSize="8">"Bandra West"</text>
        <circle cx="390" cy="205" r="5" fill="#89b4fa"/><text x="396" y="208" fill="#cdd6f4" fontSize="8">"Andheri East"</text>
        <circle cx="355" cy="220" r="5" fill="#89b4fa"/><text x="361" y="223" fill="#cdd6f4" fontSize="8">"Juhu"</text>
        <circle cx="400" cy="222" r="5" fill="#89b4fa"/><text x="350" y="235" fill="#cdd6f4" fontSize="8">"Worli"</text>
        <ellipse cx="360" cy="80" rx="65" ry="38" fill="#fab387" fillOpacity="0.12" stroke="#fab387" strokeWidth="1.5" strokeDasharray="4,2"/>
        <text x="360" y="37" textAnchor="middle" fill="#fab387" fontSize="9" fontWeight="bold">Price / finance</text>
        <circle cx="330" cy="70"  r="5" fill="#fab387"/><text x="336" y="73"  fill="#cdd6f4" fontSize="8">"price 1.5Cr"</text>
        <circle cx="385" cy="78"  r="5" fill="#fab387"/><text x="391" y="81"  fill="#cdd6f4" fontSize="8">"EMI 25000"</text>
        <circle cx="345" cy="92"  r="5" fill="#fab387"/><text x="351" y="95"  fill="#cdd6f4" fontSize="8">"budget 80L"</text>
        <ellipse cx="110" cy="205" rx="68" ry="38" fill="#f38ba8" fillOpacity="0.12" stroke="#f38ba8" strokeWidth="1.5" strokeDasharray="4,2"/>
        <text x="110" y="255" textAnchor="middle" fill="#f38ba8" fontSize="9" fontWeight="bold">User queries</text>
        <circle cx="80"  cy="195" r="5" fill="#f38ba8"/><text x="86"  y="198" fill="#cdd6f4" fontSize="8">"show me options"</text>
        <circle cx="135" cy="200" r="5" fill="#f38ba8"/><text x="141" y="203" fill="#cdd6f4" fontSize="8">"similar flats"</text>
        <circle cx="100" cy="218" r="5" fill="#f38ba8"/><text x="106" y="221" fill="#cdd6f4" fontSize="8">"3BHK budget 2Cr"</text>
        <polygon points="245,148 248,158 258,158 250,164 253,174 245,168 237,174 240,164 232,158 242,158" fill="#f9e2af" stroke="#f9e2af" strokeWidth="1"/>
        <text x="262" y="160" fill="#f9e2af" fontSize="9">Query: "3BHK Bandra sea view"</text>
        <defs><marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#f9e2af"/></marker></defs>
        <line x1="245" y1="152" x2="140" y2="112" stroke="#f9e2af" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#arr)"/>
        <text x="148" y="137" fill="#f9e2af" fontSize="8">cosine sim = 0.94</text>
        <text x="250" y="292" textAnchor="middle" fill="#6c7086" fontSize="8">Actual embeddings are 1536D — this 2D projection is for illustration. Cluster boundaries are approximate.</text>
      </svg>

      <p>Text is converted to a dense vector by a neural embedding model. Semantically similar text lands close together in this high-dimensional space. Vector search finds the nearest neighbours to the query embedding.</p>
      <div className="diagram-wrap">
        <pre style={{margin: "0", border: "none", background: "transparent", fontSize: "12px"}}>{"\"2BHK in Bandra\"               → [0.12, -0.87, 0.44, ..., 0.31]  (1536 dims)\n\"2 bedroom flat, Bandra West\"  → [0.11, -0.85, 0.46, ..., 0.29]\n\nCosine similarity = 0.97  ← semantically near, returned first\n\n\"3BHK in Juhu\"                 → [0.08, -0.42, 0.61, ..., 0.17]\nCosine similarity = 0.71  ← further away, lower rank"}</pre>
      </div>
      <div className="callout callout-info">
        <strong>Why not exact nearest-neighbour search?</strong> Finding the truly exact closest vector requires comparing your query against every vector in the database — O(n) dot products. At 10 million vectors of 1536 dimensions each, that's 10 million × 1536 multiplications per query, taking seconds. <strong>ANN (Approximate Nearest Neighbour)</strong> algorithms trade a small amount of recall accuracy (typically 95–99% of exact results) for orders-of-magnitude speed. In practice 5% recall loss is invisible to users — they can't tell if result #7 vs #8 was swapped.
        <br /><br />
        <strong>HNSW</strong> (Hierarchical Navigable Small World) builds a multi-layer graph. Think of it like a highway system: the top layer has few nodes with long-range connections (motorways), lower layers have more nodes with local connections (streets). At query time, you enter at the top layer, greedily navigate to the nearest node, descend to the next layer, repeat. Each layer narrows the search. Result: O(log n) comparisons instead of O(n). Trade-off: the graph itself must be stored in RAM — ~100 bytes per vector beyond the raw vectors.
        <br /><br />
        <strong>IVF</strong> (Inverted File Index) runs k-means clustering on all vectors first (the "training step" — done once at index creation). At query time, it finds the nearest cluster centres, then only searches vectors within those clusters. Uses less RAM than HNSW (no graph stored), but recall drops if the query doesn't cluster well with the answers.
      </div>
      <table>
        <tbody>
          <tr><th>Algorithm</th><th>How it works</th><th>Used in</th></tr>
          <tr><td><strong>HNSW</strong></td><td>Navigable small-world graph; greedy search per layer. Better recall, more memory.</td><td>pgvector, Weaviate, Qdrant</td></tr>
          <tr><td><strong>IVF</strong></td><td>k-means cluster index; search nearest clusters only. Less memory, needs training step.</td><td>pgvector (ivfflat), Pinecone</td></tr>
          <tr><td><strong>ScaNN</strong></td><td>Product quantisation + tree. Google-scale throughput.</td><td>Vertex AI Vector Search</td></tr>
        </tbody>
      </table>
      <p><strong>Default:</strong> HNSW unless you're at 100M+ vectors and RAM is constrained.</p>

      <HnswSearchViz />

      <h2>26.2 ChromaDB — Local and Lightweight</h2>
      <CodeBlock title="ChromaDB — Local Vector Store Setup" language="python" keyLine={6} keyNote="get_or_create_collection is idempotent; create_collection raises on restart">{CODE_CHROMA}</CodeBlock>
      <p><strong>When to use:</strong> local dev, prototypes, &lt;1M documents. Not for multi-tenant production.</p>

      <h2>26.3 Pinecone — Managed, Production-Scale</h2>
      <CodeBlock title="Pinecone — Upsert, Query, and Sparse-Dense Hybrid" language="python" keyLine={11} keyNote="namespace isolates tenants — each client sees only its own vectors">{CODE_PINECONE}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Serverless vs pod-based</strong>
        Serverless: scales to zero cost when idle (dev/staging). Pod-based: predictable latency at high QPS (production). Start serverless, migrate when p95 query latency matters.
      </div>

      <h2>26.4 pgvector — Vector Search in Your Existing PostgreSQL</h2>
      <CodeBlock title="pgvector — HNSW Index Creation and Similarity Query" language="sql" keyLine={10} keyNote="CONCURRENTLY prevents table lock during index build on large tables">{CODE_PGVECTOR_SQL}</CodeBlock>
      <CodeBlock title="pgvector — LangChain PGVector Integration" language="python" keyLine={2} keyNote="drop-in vectorstore — wraps pgvector with LangChain retriever interface">{CODE_PGVECTOR_PY}</CodeBlock>
      <p><strong>HNSW vs IVFFlat:</strong> HNSW has better recall (0.95+) and no training step. IVFFlat uses less memory but requires <code>VACUUM ANALYZE</code> after bulk inserts. Default: HNSW.</p>

      <h2>26.5 Weaviate &amp; Qdrant</h2>
      <table>
        <tbody>
          <tr><th></th><th>Weaviate</th><th>Qdrant</th></tr>
          <tr><td><strong>Differentiator</strong></td><td>Native multi-tenancy, GraphQL API, auto-vectorization modules</td><td>Payload filtering as first-class feature, multi-vector per document</td></tr>
          <tr><td><strong>Self-hosted</strong></td><td>Kubernetes Helm chart</td><td>Single binary — easiest to self-host</td></tr>
          <tr><td><strong>Choose when</strong></td><td>Enterprise multi-tenant SaaS with complex graph relationships</td><td>Multiple embedding models per document (text + image)</td></tr>
        </tbody>
      </table>

      <HnswIvfViz />
      <h2>26.6 Decision Framework</h2>
      <DecisionFrameworkCards />
      <div className="decision-tree">
        <span className="dt-q">What is your context?</span>
        <br />│
        <br />├─ <span className="dt-q">Local dev / prototype?</span>
        <br />│&nbsp;&nbsp;&nbsp;└─ <span className="dt-yes">ChromaDB</span> <span className="dt-note">(zero infra, in-process, pip install chromadb)</span>
        <br />│
        <br />├─ <span className="dt-q">Already running PostgreSQL?</span>
        <br />│&nbsp;&nbsp;&nbsp;└─ <span className="dt-yes">pgvector</span> <span className="dt-note">(no new infra, SQL filters, familiar ops)</span>
        <br />│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="dt-note">Caveat: HNSW index creation locks table — use pg_partman for large datasets</span>
        <br />│
        <br />├─ <span className="dt-q">Fully managed, zero ops overhead?</span>
        <br />│&nbsp;&nbsp;&nbsp;└─ <span className="dt-yes">Pinecone serverless</span> <span className="dt-note">(cold start ~200ms after idle)</span>
        <br />│
        <br />├─ <span className="dt-q">Enterprise multi-tenant SaaS?</span>
        <br />│&nbsp;&nbsp;&nbsp;└─ <span className="dt-yes">Pinecone namespaces</span> or <span className="dt-yes">Weaviate multi-tenancy</span>
        <br />│
        <br />└─ <span className="dt-q">Multi-modal (text + image vectors)?</span>
        <br />&nbsp;&nbsp;&nbsp;&nbsp;└─ <span className="dt-yes">Qdrant</span> <span className="dt-note">(multi-vector support per document)</span>
      </div>

      <h2>26.7 Embedding Models</h2>
      <EmbeddingModelScatter />
      <div className="callout callout-info">
        <strong>The embedding model matters more than the DB choice</strong>
        Start with <code>text-embedding-3-small</code> and tune chunk size via RAGAS context relevance before switching embedding models. Self-hosted (BGE) eliminates per-call cost and ~50ms network latency but requires GPU infra and model versioning.
        <br /><br />
        <strong>Embedding model lock-in — the migration you want to plan for on day 1:</strong> switching embedding models requires re-embedding every document in your database because vectors from different models are not comparable (different dimensions, different semantic spaces). A 0-downtime migration:
        <ol style={{margin: "4px 0"}}>
          <li>Create a new collection/index with the new model.</li>
          <li>Re-embed and populate the new index while the old index stays live (days to weeks for large corpora).</li>
          <li>A/B test: route 10% of queries to the new index, compare RAGAS scores.</li>
          <li>Promote new index when confirmed better. Decommission old index.</li>
        </ol>
        This is why choosing the right model at the start matters — changing it is a multi-day infrastructure project.
      </div>

      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection</strong>
        "Which vector database would you choose?" → Lead with the decision framework: existing Postgres → pgvector; fully managed new project → Pinecone serverless; enterprise multi-tenant → Pinecone namespaces or Weaviate. Then add: embedding model choice matters more than DB choice. Start with text-embedding-3-small and tune chunk size via RAGAS context relevance before switching models.
      </div>

      <h2>26.8 The Curse of Dimensionality</h2>
      <p>High-dimensional vectors have a counterintuitive property: as dimensions grow, all vectors become equally distant from each other. This explains why raw 768-dim BERT embeddings can search <em>worse</em> than 128-dim UMAP-reduced embeddings on some corpora.</p>
      <pre><code className="language-python">{`import numpy as np

# Simulate pairwise distances as embedding dimension grows
np.random.seed(0)
n_vectors = 100
for d in [2, 8, 64, 256, 512, 768]:
    vecs = np.random.randn(n_vectors, d)
    dists = np.array([
        np.linalg.norm(vecs[i] - vecs[j])
        for i in range(n_vectors) for j in range(i+1, n_vectors)
    ])
    print(f"d={d:4d}: mean={dists.mean():.2f}, std={dists.std():.2f}, "
          f"cv={dists.std()/dists.mean():.3f}")

# d=   2: mean=1.45, std=0.75, cv=0.517  ← distances spread out (useful signal)
# d=   8: mean=3.99, std=0.74, cv=0.185
# d=  64: mean=11.3, std=0.51, cv=0.045
# d= 256: mean=22.7, std=0.36, cv=0.016
# d= 512: mean=32.1, std=0.25, cv=0.008
# d= 768: mean=39.3, std=0.21, cv=0.005  ← all distances nearly equal (no signal)`}</code></pre>
      <p>The coefficient of variation (CV = std/mean) collapses toward zero as dimensions grow — all point pairs become nearly equidistant. ANN algorithms rely on distance contrast to navigate the graph; when that contrast vanishes, recall degrades even with a perfect index.</p>
      <div className="callout callout-tip">
        <strong>Practical implication for RAG:</strong> If your RAGAS context recall is stuck below 0.70, try: (1) Matryoshka truncation — OpenAI text-embedding-3-small legally truncates to 256 dims with minimal recall loss; (2) domain-specific embeddings (BAAI/bge-m3 fine-tuned on Indian property text); (3) hybrid sparse+dense search — BM25 provides keyword overlap signal that dense embeddings miss at high dimension.
      </div>

      <QuizSection moduleId={28} title="Module 28: Vector Databases" contentHint="HNSW vs IVFFlat ANN algorithm tradeoffs, ChromaDB vs Pinecone vs pgvector decision framework, Pinecone namespaces for multi-tenancy, pgvector HNSW index creation SQL, sparse-dense hybrid search alpha parameter, embedding model dimension vs cost tradeoff, text-embedding-3-small vs BGE self-hosted, curse of dimensionality coefficient of variation distance concentration Matryoshka truncation" />
    </>
  );
}
