import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from '../components/CodeBlock';

interface KGNode { id: string; type: 'property'|'locality'|'developer'|'amenity'; label: string; x?: number; y?: number; fx?: number|null; fy?: number|null }
interface KGEdge { source: string; target: string; label: string }

const KG_NODES: KGNode[] = [
  { id: 'prop1',    type: 'property',  label: '2BHK Bandra' },
  { id: 'prop2',    type: 'property',  label: '3BHK Juhu' },
  { id: 'loc1',     type: 'locality',  label: 'Bandra West' },
  { id: 'loc2',     type: 'locality',  label: 'Juhu' },
  { id: 'dev1',     type: 'developer', label: 'Godrej Properties' },
  { id: 'dev2',     type: 'developer', label: 'Hiranandani' },
  { id: 'amen1',    type: 'amenity',   label: 'Metro Station' },
  { id: 'amen2',    type: 'amenity',   label: 'Sea-facing' },
  { id: 'amen3',    type: 'amenity',   label: 'Gym + Pool' },
]

const KG_EDGES: KGEdge[] = [
  { source: 'prop1', target: 'loc1',  label: 'in_locality' },
  { source: 'prop2', target: 'loc2',  label: 'in_locality' },
  { source: 'prop1', target: 'dev1',  label: 'built_by' },
  { source: 'prop2', target: 'dev2',  label: 'built_by' },
  { source: 'prop1', target: 'amen1', label: 'near' },
  { source: 'prop1', target: 'amen2', label: 'has' },
  { source: 'prop2', target: 'amen3', label: 'has' },
  { source: 'prop2', target: 'amen1', label: 'near' },
  { source: 'loc1',  target: 'amen1', label: 'contains' },
]

const TYPE_COLORS: Record<string, string> = {
  property: '#89b4fa', locality: '#a6e3a1', developer: '#fab387', amenity: '#cba6f7'
}

function KnowledgeGraphInteractive() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [positions, setPositions] = useState<Record<string, {x:number,y:number}>>({})
  const [selected, setSelected] = useState<string|null>(null)
  const [query, setQuery] = useState('')

  const W = 540, H = 300

  useEffect(() => {
    const nodes = KG_NODES.map(n => ({...n}))
    const edges = KG_EDGES.map(e => ({...e}))

    const sim = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(edges).id((d:any) => d.id).distance(90))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(W/2, H/2))
      .force('x', d3.forceX(W/2).strength(0.05))
      .force('y', d3.forceY(H/2).strength(0.05))

    sim.on('tick', () => {
      const pos: Record<string, {x:number,y:number}> = {}
      nodes.forEach((n:any) => { pos[n.id] = {x: Math.max(30, Math.min(W-30, n.x||W/2)), y: Math.max(25, Math.min(H-25, n.y||H/2))} })
      setPositions({...pos})
    })

    // Run for 200 ticks then stop (faster than waiting for alpha=0)
    sim.tick(200)
    const pos: Record<string, {x:number,y:number}> = {}
    nodes.forEach((n:any) => { pos[n.id] = {x: Math.max(30, Math.min(W-30, n.x||W/2)), y: Math.max(25, Math.min(H-25, n.y||H/2))} })
    setPositions(pos)
    sim.stop()
  }, [])

  // Traverse: find connected node IDs when one is selected
  const connectedIds = selected
    ? new Set(KG_EDGES.filter(e => e.source===selected || e.target===selected).flatMap(e => [e.source, e.target]))
    : null

  // Query highlight: match node labels
  const queryMatch = query.trim().toLowerCase()
  const queryHits = queryMatch
    ? new Set(KG_NODES.filter(n => n.label.toLowerCase().includes(queryMatch) || n.type.includes(queryMatch)).map(n => n.id))
    : null

  return (
    <div style={{margin:'24px 0',background:'var(--bg2)',borderRadius:'8px',padding:'16px'}}>
      <div style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:'12px'}}>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search entities... (e.g. Bandra, metro)"
          style={{flex:1,background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'6px',padding:'6px 12px',color:'var(--text)',fontSize:'13px'}}/>
        {query && <button onClick={()=>setQuery('')} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:'14px'}}>&#x2715;</button>}
        {selected && <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',color:'var(--accent)',fontSize:'12px',cursor:'pointer'}}>Clear selection</button>}
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block',minHeight:'220px'}}>
        <defs>
          <marker id="kg-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 Z" fill="#45475a"/>
          </marker>
        </defs>
        {/* Edges */}
        {KG_EDGES.map((e,i) => {
          const src = positions[e.source], tgt = positions[e.target]
          if (!src || !tgt) return null
          const isConnected = connectedIds ? (connectedIds.has(e.source) && connectedIds.has(e.target)) : false
          return (
            <g key={i}>
              <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke={isConnected ? '#89b4fa' : '#313244'} strokeWidth={isConnected ? 2 : 1}
                markerEnd="url(#kg-arr)" opacity={connectedIds && !isConnected ? 0.15 : 1}
                style={{transition:'stroke .2s, opacity .2s'}}/>
              <text x={(src.x+tgt.x)/2} y={(src.y+tgt.y)/2-4} fontSize="7" fill="#6c7086" textAnchor="middle">{e.label}</text>
            </g>
          )
        })}
        {/* Nodes */}
        {KG_NODES.map(n => {
          const pos = positions[n.id]
          if (!pos) return null
          const col = TYPE_COLORS[n.type]
          const isSel = selected === n.id
          const isDimmed = connectedIds ? !connectedIds.has(n.id) : false
          const isHit = queryHits ? queryHits.has(n.id) : false
          return (
            <g key={n.id} style={{cursor:'pointer'}} onClick={() => setSelected(selected===n.id ? null : n.id)}>
              <circle cx={pos.x} cy={pos.y} r={isSel ? 18 : 14}
                fill={isSel ? col+'44' : col+'22'}
                stroke={isHit ? '#f9e2af' : col}
                strokeWidth={isSel || isHit ? 2.5 : 1.5}
                opacity={isDimmed ? 0.2 : 1}
                style={{transition:'all .2s'}}/>
              <text x={pos.x} y={pos.y+4} textAnchor="middle" fontSize="8"
                fill={isDimmed ? '#45475a' : col} fontWeight={isSel?700:400}>
                {n.label.length > 10 ? n.label.slice(0,10)+'...' : n.label}
              </text>
            </g>
          )
        })}
      </svg>
      {/* Legend */}
      <div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginTop:'8px'}}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} style={{fontSize:'11px',color,display:'flex',alignItems:'center',gap:'4px'}}>
            <span style={{width:'8px',height:'8px',borderRadius:'50%',background:color,display:'inline-block'}}/>
            {type}
          </span>
        ))}
      </div>
      <div style={{fontSize:'11px',color:'var(--muted)',marginTop:'6px'}}>Click a node to highlight its connections. Search to find entities by type or name.</div>
    </div>
  )
}

function KnowledgeGraphViz() {
  const nodes = [
    {id:'Housing.com', x:280, y:140, color:'#cba6f7', type:'company'},
    {id:'Bandra',      x:130, y:80,  color:'#89b4fa', type:'locality'},
    {id:'2BHK',        x:430, y:70,  color:'#94e2d5', type:'property_type'},
    {id:'Property',    x:400, y:180, color:'#94e2d5', type:'entity'},
    {id:'Builder_X',   x:160, y:210, color:'#cba6f7', type:'developer'},
    {id:'Sea View',    x:480, y:130, color:'#a6e3a1', type:'amenity'},
    {id:'Mumbai',      x:70,  y:180, color:'#89b4fa', type:'city'},
    {id:'User',        x:310, y:40,  color:'#fab387', type:'actor'},
    {id:'RERA',        x:175, y:260, color:'#f9e2af', type:'regulation'},
  ];
  const edges = [
    {from:'Property', to:'Bandra',      label:'has_locality', color:'#6c7086'},
    {from:'Property', to:'2BHK',        label:'is_type',      color:'#6c7086'},
    {from:'Property', to:'Builder_X',   label:'built_by',     color:'#6c7086'},
    {from:'Property', to:'Sea View',    label:'has_amenity',  color:'#6c7086'},
    {from:'Bandra',   to:'Mumbai',      label:'in_city',      color:'#6c7086'},
    {from:'Property', to:'RERA',        label:'regulated_by', color:'#6c7086'},
    {from:'User',     to:'Property',    label:'searches',     color:'#fab387'},
    {from:'Housing.com', to:'Property', label:'lists',        color:'#cba6f7'},
    {from:'Housing.com', to:'Bandra',   label:'covers',       color:'#cba6f7'},
  ];
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>KNOWLEDGE GRAPH — ENTITIES, RELATIONSHIPS, STRUCTURED TRAVERSAL</div>
      <svg viewBox="0 0 560 280" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Knowledge graph entities and relationships">
        <defs>
          <marker id="kg-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#6c7086"/></marker>
          <marker id="kg-arrow-fab" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#fab387"/></marker>
          <marker id="kg-arrow-mau" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#cba6f7"/></marker>
        </defs>
        {edges.map((e,i) => {
          const src = nodeMap[e.from], tgt = nodeMap[e.to];
          const dx = tgt.x - src.x, dy = tgt.y - src.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const ux = dx/dist, uy = dy/dist;
          const x1 = src.x + ux*22, y1 = src.y + uy*22;
          const x2 = tgt.x - ux*24, y2 = tgt.y - uy*24;
          const mx = (x1+x2)/2, my = (y1+y2)/2;
          const markerId = e.color === '#fab387' ? 'kg-arrow-fab' : e.color === '#cba6f7' ? 'kg-arrow-mau' : 'kg-arrow';
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={e.color} strokeWidth="1.2" markerEnd={`url(#${markerId})`} opacity="0.7"/>
              <text x={mx} y={my-3} textAnchor="middle" fontSize="8" fill="#6c7086">{e.label}</text>
            </g>
          );
        })}
        {nodes.map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={22} fill={n.color+'22'} stroke={n.color} strokeWidth="1.5"/>
            <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill={n.color} fontWeight="600">{n.id}</text>
          </g>
        ))}
        {/* Legend */}
        {[{c:'#cba6f7',l:'company/developer'},{c:'#89b4fa',l:'locality/city'},{c:'#94e2d5',l:'property'},{c:'#a6e3a1',l:'amenity'},{c:'#f9e2af',l:'regulation'},{c:'#fab387',l:'actor'}].map((item,i) => (
          <g key={i}>
            <circle cx={12} cy={248+i*14} r={5} fill={item.c+'44'} stroke={item.c} strokeWidth="1.2"/>
            <text x={22} y={252+i*14} fontSize="8" fill="#6c7086">{item.l}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function GraphRAGSearchViz() {
  const [mode, setMode] = useState<'global'|'local'>('global');
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>GRAPHRAG — GLOBAL VS LOCAL SEARCH PATTERNS</div>
      <div style={{marginBottom:'12px'}}>
        <button onClick={() => setMode('global')} style={mode==='global' ? {background:'#89b4fa22',color:'#89b4fa',border:'1px solid #89b4fa',borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor:'pointer',marginRight:'8px'} : {background:'#313244',color:'#cdd6f4',border:'1px solid #45475a',borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor:'pointer',marginRight:'8px'}}>Global Search</button>
        <button onClick={() => setMode('local')} style={mode==='local' ? {background:'#89b4fa22',color:'#89b4fa',border:'1px solid #89b4fa',borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor:'pointer',marginRight:'8px'} : {background:'#313244',color:'#cdd6f4',border:'1px solid #45475a',borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor:'pointer',marginRight:'8px'}}>Local Search</button>
      </div>
      <svg viewBox="0 0 580 200" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="GraphRAG global vs local search">
        <defs>
          <marker id="gs-arrow-g" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#cba6f7"/></marker>
          <marker id="gs-arrow-l" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#94e2d5"/></marker>
          <marker id="gs-arrow-n" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#6c7086"/></marker>
        </defs>
        {mode === 'global' ? (
          <>
            {/* Global search: full graph → communities → themes → answer */}
            {/* Full graph circles (Leiden communities) */}
            <circle cx="70" cy="60" r="38" fill="none" stroke="#cba6f7" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"/>
            <circle cx="70" cy="60" r="24" fill="none" stroke="#cba6f7" strokeWidth="1" strokeDasharray="3 3" opacity="0.4"/>
            <circle cx="70" cy="60" r="10" fill="#cba6f7" opacity="0.3"/>
            {[{cx:58,cy:52},{cx:76,cy:55},{cx:64,cy:68},{cx:80,cy:67}].map((d,i) => <circle key={i} cx={d.cx} cy={d.cy} r="4" fill="#cba6f7" opacity="0.7"/>)}
            <text x="70" y="108" textAnchor="middle" fontSize="9" fill="#cba6f7">Full Graph</text>
            <text x="70" y="118" textAnchor="middle" fontSize="8" fill="#6c7086">Leiden communities</text>
            {/* Arrow */}
            <line x1="108" y1="60" x2="148" y2="60" stroke="#cba6f7" strokeWidth="1.5" markerEnd="url(#gs-arrow-g)"/>
            <text x="128" y="55" textAnchor="middle" fontSize="8" fill="#6c7086">MAP</text>
            {/* Community summaries */}
            <rect x="150" y="30" width="130" height="60" rx="6" fill="#313244" stroke="#cba6f7" strokeWidth="1.2"/>
            <text x="215" y="52" textAnchor="middle" fontSize="9" fill="#cba6f7">Community Summaries</text>
            {['Proptech trends','Market data','Regulatory','Mumbai micro'].map((s,i) => (
              <text key={i} x="215" y={65+i*10} textAnchor="middle" fontSize="8" fill="#6c7086">• {s}</text>
            ))}
            {/* Arrow */}
            <line x1="280" y1="60" x2="320" y2="60" stroke="#cba6f7" strokeWidth="1.5" markerEnd="url(#gs-arrow-g)"/>
            <text x="300" y="55" textAnchor="middle" fontSize="8" fill="#6c7086">REDUCE</text>
            {/* Answer */}
            <rect x="322" y="38" width="140" height="44" rx="6" fill="#313244" stroke="#a6e3a1" strokeWidth="1.5"/>
            <text x="392" y="56" textAnchor="middle" fontSize="9" fill="#a6e3a1">Answer</text>
            <text x="392" y="68" textAnchor="middle" fontSize="8" fill="#6c7086">Main property trends</text>
            <text x="392" y="78" textAnchor="middle" fontSize="8" fill="#6c7086">across corpus</text>
            {/* Query label */}
            <rect x="90" y="148" width="380" height="26" rx="6" fill="#313244" stroke="#45475a"/>
            <text x="280" y="165" textAnchor="middle" fontSize="10" fill="#f9e2af">Query: "What are the main property trends?"</text>
            <line x1="280" y1="148" x2="280" y2="110" stroke="#f9e2af" strokeWidth="1" strokeDasharray="3 3"/>
          </>
        ) : (
          <>
            {/* Local search: query → entity anchor → 2-hop subgraph → answer */}
            <rect x="10" y="80" width="90" height="28" rx="6" fill="#313244" stroke="#94e2d5" strokeWidth="1.5"/>
            <text x="55" y="98" textAnchor="middle" fontSize="10" fill="#94e2d5">Query</text>
            <line x1="100" y1="94" x2="135" y2="94" stroke="#94e2d5" strokeWidth="1.5" markerEnd="url(#gs-arrow-l)"/>
            {/* Entity anchor */}
            <circle cx="160" cy="94" r="22" fill="#94e2d5" opacity="0.2" stroke="#94e2d5" strokeWidth="1.5"/>
            <text x="160" y="90" textAnchor="middle" fontSize="9" fill="#94e2d5">Entity</text>
            <text x="160" y="102" textAnchor="middle" fontSize="8" fill="#94e2d5">anchor</text>
            {/* 2-hop subgraph */}
            {[{cx:220,cy:60},{cx:230,cy:94},{cx:220,cy:128}].map((d,i) => (
              <g key={i}>
                <line x1="182" y1="94" x2={d.cx-10} y2={d.cy} stroke="#94e2d5" strokeWidth="1" markerEnd="url(#gs-arrow-l)" opacity="0.6"/>
                <circle cx={d.cx} cy={d.cy} r="16" fill="#313244" stroke="#94e2d5" strokeWidth="1"/>
                <text x={d.cx} y={d.cy+4} textAnchor="middle" fontSize="8" fill="#94e2d5">hop 1</text>
              </g>
            ))}
            {[{cx:286,cy:50},{cx:290,cy:94},{cx:286,cy:138}].map((d,i) => (
              <g key={i}>
                <line x1={230+i*0} y1={[60,94,128][i]} x2={d.cx-14} y2={d.cy} stroke="#6c7086" strokeWidth="1" markerEnd="url(#gs-arrow-n)" opacity="0.5"/>
                <circle cx={d.cx} cy={d.cy} r="12" fill="#313244" stroke="#6c7086" strokeWidth="1"/>
                <text x={d.cx} y={d.cy+4} textAnchor="middle" fontSize="7" fill="#6c7086">hop 2</text>
              </g>
            ))}
            {/* Arrow to answer */}
            <line x1="300" y1="94" x2="340" y2="94" stroke="#94e2d5" strokeWidth="1.5" markerEnd="url(#gs-arrow-l)"/>
            {/* Answer box */}
            <rect x="342" y="70" width="160" height="48" rx="6" fill="#313244" stroke="#a6e3a1" strokeWidth="1.5"/>
            <text x="422" y="90" textAnchor="middle" fontSize="9" fill="#a6e3a1">Answer</text>
            <text x="422" y="102" textAnchor="middle" fontSize="8" fill="#6c7086">Developers in Bandra</text>
            <text x="422" y="112" textAnchor="middle" fontSize="8" fill="#6c7086">with context</text>
            {/* Query label */}
            <rect x="60" y="150" width="400" height="26" rx="6" fill="#313244" stroke="#45475a"/>
            <text x="260" y="167" textAnchor="middle" fontSize="10" fill="#f9e2af">Query: "Who develops projects in Bandra?"</text>
            <line x1="160" y1="150" x2="160" y2="116" stroke="#f9e2af" strokeWidth="1" strokeDasharray="3 3"/>
          </>
        )}
      </svg>
    </div>
  );
}

const CODE_GRAPH_EXAMPLE = `Nodes (entities):  "Housing.com", "Anuj Puri", "Bandra", "2BHK"
Edges (relations):
  Housing.com  --[EMPLOYS]-->     Anuj Puri
  Anuj Puri    --[CHAIRMAN_OF]--> Housing.com
  Bandra       --[LOCALITY_IN]--> Mumbai
  2BHK listing --[LOCATED_IN]-->  Bandra`;

const CODE_LLM_GRAPH = `from langchain_experimental.graph_transformers import LLMGraphTransformer
from langchain_community.graphs import Neo4jGraph
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-haiku-4-5-20251001", temperature=0)
transformer = LLMGraphTransformer(llm=llm)

docs = [Document(page_content="""
    Housing.com is an Indian real estate portal. Anuj Puri is the chairman.
    The Mumbai office is in Bandra West, near the BKC business district.
""")]
graph_docs = transformer.convert_to_graph_documents(docs)
# → Node(id='Housing.com', type='Organisation')
# → Relationship(source=Housing.com, target=Anuj_Puri, type='EMPLOYS')

graph = Neo4jGraph(url="bolt://localhost:7687", username="neo4j", password="...")
graph.add_graph_documents(graph_docs)`;

const CODE_CYPHER_PRIMER = `// 1. Match a node with a label and property
MATCH (n:Organisation {name: 'Housing.com'}) RETURN n

// 2. Directed edge: source -[rel:TYPE]-> target
MATCH (person)-[:WORKS_FOR]->(company) RETURN person.name, company.name

// 3. Variable-length path: [*1..2] means 1 or 2 hops
MATCH (h {id: 'Housing.com'})-[*1..2]->(connected)
RETURN connected.id, labels(connected)

// 4. Filter on properties mid-traversal
MATCH (p:Property)-[:LOCATED_IN]->(l:Locality {name: 'Bandra'})
WHERE p.price < 20000000
RETURN p.title, p.price, l.name`;

const CODE_CYPHER_QUERIES = `// Cypher: find all entities connected to Housing.com within 2 hops
MATCH (h:Organisation {id: 'Housing.com'})-[*1..2]->(connected)
RETURN connected.id, labels(connected)

// Graph + vector hybrid query
MATCH (p:Property)-[:LOCATED_IN]->(l:Locality {name: 'Bandra'})
WHERE p.price < 20000000
RETURN p, l`;

const CODE_GRAPHRAG_PIPELINE = `── GraphRAG Offline Indexing Pipeline (runs once, expensive) ────────────────

 Source Documents (PDFs, articles, contracts)
        │
        ▼ chunk into 600-token windows
 ┌─────────────────────┐
 │  Chunks  [d1c1]     │  [d1c2]  [d2c1] ...  (N total chunks)
 └──────────┬──────────┘
            │ LLM call per chunk → extract named entities + relations
            ▼  ≈ $0.01–$0.05 per chunk (GPT-4o), so 1000 chunks = $10–$50
 ┌───────────────────────────────────────────────────────────────────────────┐
 │  Knowledge Graph  (entity1) ──[relation]──► (entity2)                   │
 │  e.g., (Housing.com) ──[operates_in]──► (Mumbai)                        │
 │       (PropTiger)    ──[acquired_by]──► (REA Group)                      │
 └──────────────────────────────┬──────────────────────────────────────────┘
                                │ Leiden community detection
                                ▼
 ┌──── Level 0: 10 broad clusters ──────────────────────────────────────────┐
 │  [Proptech companies]  [Regulatory bodies]  [Mumbai localities] ...      │
 │  └── Level 1: 50 clusters                                                │
 │       └── Level 2: 150 clusters                                          │
 │            └── Level 3: 500 fine clusters                                │
 └──────────────────────────┬──────────────────────────────────────────┘
                                │ LLM summarises each cluster at each level
                                ▼
 Community summaries stored → used for global search (map-reduce over summaries)
 Raw graph stored           → used for local search (entity → neighbourhood hop)`;

const CODE_INDEXING_PIPELINE = `Documents → chunk (600 tokens)
  → LLM extracts (entity, relation, entity) triples per chunk
  → Merge into global knowledge graph (deduplicate entities)
  → Leiden algorithm: hierarchical community detection
      Level 0 = 10 broad themes
      Level 3 = 500 fine-grained clusters
  → LLM writes community summary for each cluster at each level
  → Stored: graph + community summaries + source text`;

const CODE_GRAPHRAG_BASH = `pip install graphrag
graphrag index --root ./my_project   # offline indexing

# Global search (thematic): distribute across community summaries → map-reduce
graphrag query --root ./my_project --method global \\
  --query "What are the main risk factors across all documents?"

# Local search (specific): extract entities → retrieve graph neighbourhood
graphrag query --root ./my_project --method local \\
  --query "What is the relationship between Housing.com and PropTiger?"`;

const CODE_PAGEINDEX_TEXT = `Indexing:
  1. Parse document → detect table of contents / section structure
  2. Build tree: root → sections → subsections → paragraphs
  3. LLM writes summary for each node (stored in tree)

Retrieval:
  1. LLM sees root summaries: "Appendix G covers Q3 financial results"
  2. LLM reasons: "Operating margin is likely in Financial Results → navigate"
  3. LLM drills down level by level to exact pages
  4. Only those pages enter generation context`;

const CODE_PAGEINDEX_PYTHON = `from pageindex import PageIndex

pi = PageIndex("annual_report.pdf")
pi.build_index()  # no embeddings, no vector store

answer = pi.query("What was the operating margin in Q3?")
# LLM traverses tree: root → Financial Results → Q3 → exact table`;

const CODE_HYBRID_RAG = `from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

# 1. Vector retrieval (semantic similarity)
vector_retriever = chroma.as_retriever(search_kwargs={"k": 5})

# 2. Keyword retrieval (exact match, BM25)
bm25 = BM25Retriever.from_documents(docs, k=5)

# 3. Ensemble: EnsembleRetriever uses Reciprocal Rank Fusion (RRF), not raw score blending
# RRF formula: score(doc) = sum(1 / (rank_i + k)) across retrievers
# This is correct — raw scores from BM25 and cosine similarity are NOT comparable
ensemble = EnsembleRetriever(
    retrievers=[vector_retriever, bm25],
    weights=[0.6, 0.4]  # relative weight for rank fusion, not score multiplication
)

# 4. Optionally add graph retrieval for entity-centric queries
def graph_retriever(query: str) -> list[Document]:
    entities = extract_entities_llm(query)
    results = graph.query(
        "MATCH (e)-[r]-(n) WHERE e.id IN $ids RETURN e, r, n",
        params={"ids": entities}
    )
    return [Document(page_content=format_result(r)) for r in results]`;

export function Mod37() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Extract entities and relationships from text using an LLM and store them in a graph</li>
          <li>Explain GraphRAG's indexing pipeline: entity extraction → Leiden communities → community summaries</li>
          <li>Choose between GraphRAG global search vs local search for different query types</li>
          <li>Explain how PageIndex eliminates embeddings via LLM tree traversal</li>
          <li>Design a hybrid retrieval pipeline combining vector, BM25, and graph retrieval</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~75 minutes</span>
          <span className="obj-diff">Difficulty: ★★★★☆</span>
          <span className="obj-diff">Prerequisites: Module 28 (Vector DBs), Module 29 (RAG Architectures)</span>
        </div>
      </div>

      <div className="callout callout-info">
        <strong>Housing.com Context</strong><br />
        Housing.com has rich implicit graph structure: localities connect to schools, metro stations, hospitals. GraphRAG would enable "near good CBSE schools, within 2km of a metro" — queries that require traversing relationships, not just filtering fields.
      </div>

      <KnowledgeGraphInteractive />

      <h2>32.1 What is a Knowledge Graph?</h2>
      <table>
        <tbody>
          <tr><th></th><th>Relational DB</th><th>Knowledge Graph</th></tr>
          <tr><td>Schema</td><td>Fixed — predefined columns/tables</td><td>Flexible — new edge types at any time</td></tr>
          <tr><td>Relationships</td><td>Foreign keys — JOIN required</td><td>First-class edges — traversal, not joins</td></tr>
          <tr><td>Multi-hop</td><td>JOIN × JOIN × JOIN — exponentially expensive</td><td>1 graph traversal (O(k) hops in O(k) steps)</td></tr>
          <tr><td>Query language</td><td>SQL</td><td>Cypher (Neo4j), SPARQL (RDF), Gremlin</td></tr>
          <tr><td>Best for</td><td>Structured transactional data</td><td>Entity relationships, knowledge bases</td></tr>
          <tr><td>Example query</td><td>JOIN 3 tables to find an agent's deals</td><td>MATCH (agent)-[:CLOSED]-&gt;(deal)-[:IN]-&gt;(locality)</td></tr>
        </tbody>
      </table>
      <CodeBlock title="Knowledge Graph — Nodes and Directed Edge Relationships" language="text" keyLine={3} keyNote="edges are first-class — traversal replaces joins">{CODE_GRAPH_EXAMPLE}</CodeBlock>
      <p><strong>Why graphs beat flat text for relational queries:</strong> "Who are all execs connected to Housing.com?" → graph traversal. "Localities with 2BHK under 2Cr near metro?" → multi-hop: locality → price → amenity. Flat RAG retrieves matching chunks but can't traverse relationships between them.</p>

      <h2>32.2 Building a Knowledge Graph with an LLM</h2>
      <CodeBlock title="LLM Graph Transformer — Entity and Relation Extraction" language="python" keyLine={7} keyNote="LLM extracts structured triples from unstructured text automatically">{CODE_LLM_GRAPH}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Cypher primer — 4 patterns you need to know</strong>
        <CodeBlock title="Cypher Query Patterns — 4 Essential Forms" language="text" keyLine={7} keyNote="variable-length path [*1..2] enables multi-hop graph traversal">{CODE_CYPHER_PRIMER}</CodeBlock>
        You don't need to master Cypher for most AI engineering roles — but understanding pattern matching
        (<code>()-[]-&gt;()</code>) is necessary to explain GraphRAG's local search to an interviewer.
      </div>
      <CodeBlock title="Cypher Queries — Graph Traversal and Hybrid Vector Search" language="text" keyLine={2} keyNote="2-hop traversal [*1..2] finds indirect relations in one query">{CODE_CYPHER_QUERIES}</CodeBlock>

      <GraphRAGSearchViz />

      <h2>32.3 GraphRAG — Microsoft's Architecture</h2>
      <div className="callout callout-info" style={{fontFamily:'monospace',fontSize:'12px',lineHeight:1.8,whiteSpace:'pre'}}>
        {CODE_GRAPHRAG_PIPELINE}
      </div>
      <p><strong>Indexing pipeline (offline, expensive, run once):</strong></p>
      <CodeBlock title="GraphRAG Indexing Pipeline — Steps from Documents to Communities" language="text" keyLine={4} keyNote="Leiden detection builds 4-level hierarchy from broad themes to fine clusters">{CODE_INDEXING_PIPELINE}</CodeBlock>
      <p>Before running these commands, understand what each flag does:</p>
      <ul>
        <li><strong><code>--root ./my_project</code></strong> — the project directory must contain a <code>graphrag.config.yaml</code> file (auto-generated by <code>graphrag init</code>) and an <code>input/</code> folder with your source documents. GraphRAG writes all output (entity parquet files, community reports, embeddings) back into this directory under <code>output/</code>.</li>
        <li><strong><code>--method global</code></strong> — runs a map-reduce over all community summaries (the high-level clusters). Good for thematic synthesis: "what are the main risk factors across all contracts?" The LLM reads each community summary in parallel, then a final LLM call reduces them into one answer.</li>
        <li><strong><code>--method local</code></strong> — extracts named entities from your query, finds them in the knowledge graph, then retrieves their immediate graph neighbourhood (connected entities + relationships). Good for specific factual questions: "what projects did J. Smith approve?" The answer lives in the graph edges, not in any single document chunk.</li>
      </ul>
      <CodeBlock title="GraphRAG CLI — Indexing and Global vs Local Query" language="bash" keyLine={4} keyNote="global search distributes across community summaries via map-reduce">{CODE_GRAPHRAG_BASH}</CodeBlock>
      <table>
        <tbody>
          <tr><th></th><th>Standard RAG</th><th>GraphRAG</th></tr>
          <tr><td>Multi-doc synthesis</td><td>Poor</td><td>Excellent</td></tr>
          <tr><td>Thematic / global queries</td><td>Fails</td><td>Strong (community summaries)</td></tr>
          <tr><td>Specific factual lookup</td><td>Good</td><td>Good (local search)</td></tr>
          <tr><td>Indexing cost</td><td>Low ($)</td><td>High ($$$, many LLM calls)</td></tr>
          <tr><td>Best for</td><td>FAQ, factual lookup</td><td>Complex corpora, exploratory Q&amp;A</td></tr>
        </tbody>
      </table>
      <div className="callout callout-info">
        <strong>Leiden algorithm — intuition before the math</strong>
        Imagine the knowledge graph as a social network. Community detection finds clusters of nodes that
        are densely connected internally but sparsely connected externally — the "friend groups."
        <br /><br />
        Leiden works like this: (1) start with each node as its own community; (2) greedily merge
        communities that increase the modularity score (ratio of internal to external edges); (3) refine
        the partition by considering moving individual nodes across community boundaries; (4) repeat
        until no improvement. The result is a hierarchy of communities at multiple resolutions — Level 0
        has 10 broad themes ("Property Finance", "Legal", "Market Trends"), Level 3 has 500 fine-grained
        clusters ("Bandra rental prices 2024", "RERA compliance notices").
        <br /><br />
        GraphRAG writes an LLM summary for each community at each level. A "global search" distributes
        the query to every community summary, runs a map step on each, and reduces the answers — this
        is why global search costs many LLM calls and is slow, but surfaces corpus-wide themes that no
        single chunk retrieval could find.
      </div>
      <div className="callout callout-tip">
        <strong>Leiden vs Louvain:</strong> Both are community detection algorithms. Leiden fixes Louvain's "resolution limit" bug (tendency to merge small distinct communities). GraphRAG defaults to Leiden for more stable, hierarchical partitions.
      </div>

      <h2>32.4 PageIndex — Vectorless RAG</h2>
      <div className="callout callout-warn">
        <strong>PageIndex is research-stage (as of 2025) — not production-ready</strong>
        The <code>pageindex</code> Python library is not stable; the API changes between releases, and the library is
        not available on PyPI as a stable package. The concept is sound and the approach is promising for
        structured documents, but do NOT plan a production deployment on PageIndex as of 2025. The
        alternative for structured documents is <code>MarkdownHeaderTextSplitter</code> (stable, in LangChain) which
        gives similar structural benefits for Markdown/HTML docs without the research-stage risk.
      </div>
      <p>PageIndex replaces the entire embedding-and-vector-search pipeline with <strong>LLM reasoning over a hierarchical table of contents</strong>. Instead of "which chunk is closest in vector space to the query?", it asks "which section of this document would a human expert navigate to in order to find this answer?"</p>
      <p>Think of how you'd use a 200-page annual report: you don't read every paragraph and compute semantic similarity — you open the table of contents, read section titles, decide "operating margin is in Financial Results → Q3 section", and jump straight there. PageIndex teaches the LLM to navigate the same way. The LLM reads summaries at each tree level and reasons about which branch to descend — each level costs one LLM call, so a 4-level document tree costs 4 LLM calls per query (expensive, but precise for structured documents).</p>
      <p><strong>Why it matters for structured documents:</strong> Fixed-size chunking often splits a table across chunk boundaries, or groups unrelated paragraphs because they appear on the same page. PageIndex preserves document structure — sections stay together, tables stay whole.</p>
      <p>PageIndex (VectifyAI, 2025) replaces cosine similarity with LLM reasoning over a hierarchical tree index built from document structure. No embeddings. No vector database.</p>
      <CodeBlock title="PageIndex — Hierarchical Tree Indexing and LLM Traversal" language="text" keyLine={8} keyNote="LLM reasons about which branch to descend, not vector similarity">{CODE_PAGEINDEX_TEXT}</CodeBlock>
      <CodeBlock title="PageIndex Python API — No Embeddings, No Vector Store" language="python" keyLine={4} keyNote="build_index creates document tree without any embeddings">{CODE_PAGEINDEX_PYTHON}</CodeBlock>
      <table>
        <tbody>
          <tr><th></th><th>Traditional RAG</th><th>PageIndex</th></tr>
          <tr><td>Retrieval mechanism</td><td>Cosine similarity on embeddings</td><td>LLM tree traversal (reasoning)</td></tr>
          <tr><td>Chunking</td><td>Fixed-size windows</td><td>Natural document structure</td></tr>
          <tr><td>Infrastructure</td><td>Vector DB required</td><td>None</td></tr>
          <tr><td>Failure mode</td><td>Semantic drift, boundary issues</td><td>Extra LLM calls (cost + latency)</td></tr>
          <tr><td>Best for</td><td>Large unstructured corpora</td><td>Structured docs: reports, manuals</td></tr>
        </tbody>
      </table>

      <h2>32.5 Hybrid RAG: Vector + BM25 + Graph</h2>
      <CodeBlock title="Hybrid Retrieval — Vector, BM25, and Graph via Ensemble" language="python" keyLine={10} keyNote="EnsembleRetriever uses RRF — raw BM25 and cosine scores are not comparable">{CODE_HYBRID_RAG}</CodeBlock>
      <table>
        <tbody>
          <tr><th>Query signal</th><th>Use BM25</th><th>Use Vector</th><th>Use Graph</th></tr>
          <tr><td>Exact product names / codes</td><td>✓</td><td>—</td><td>—</td></tr>
          <tr><td>"Properties similar to this listing"</td><td>—</td><td>✓</td><td>—</td></tr>
          <tr><td>"Who else works with X?" / relationships</td><td>—</td><td>—</td><td>✓</td></tr>
          <tr><td>General semantic questions</td><td>—</td><td>✓</td><td>—</td></tr>
          <tr><td>Broad thematic synthesis</td><td>—</td><td>—</td><td>✓ (GraphRAG global)</td></tr>
        </tbody>
      </table>

      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection</strong>
        "How would you retrieve relevant context for 'What are all the legal risks in this corpus?'" → GraphRAG global search (community summaries surface themes). "For 'What does section 4.2 say about indemnification?'" → PageIndex (structured doc, precise navigation). "For 'Find properties similar to this listing.'" → Vector search. Always match retrieval mechanism to query type.
      </div>

      <QuizSection moduleId={32} title="Module 32: Knowledge Graphs, GraphRAG &amp; PageIndex" contentHint="Knowledge graph nodes edges entity relationship property graph vs RDF, LLMGraphTransformer extraction Cypher queries Neo4j, GraphRAG Leiden community detection global vs local search map-reduce, community summary hierarchical levels indexing cost LLM calls per chunk, PageIndex vectorless tree traversal document structure no embedding, PageIndex vs RAG structured docs precision vs large corpus recall, hybrid RAG BM25 vector graph ensemble weights, when to use each retrieval signal exact vs semantic vs relational" />
    </>
  );
}
