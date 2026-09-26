import { useState } from 'react';
import { QuizSection } from "../components/QuizSection";
import { CodeBlock, CodeDiff } from '../components/CodeBlock';

function A2AProtocolViz() {
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>A2A PROTOCOL — AGENT-TO-AGENT COMMUNICATION STANDARD</div>
      <style>{`
        @keyframes dashFlow42a { to { stroke-dashoffset: -14; } }
        .dash-anim-42a { animation: dashFlow42a 1s linear infinite; }
      `}</style>
      <svg viewBox="0 0 560 230" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="A2A protocol flow diagram">
        <defs>
          <marker id="arrow-42-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#89b4fa"/>
          </marker>
          <marker id="arrow-42-teal" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#94e2d5"/>
          </marker>
          <marker id="arrow-42-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#a6e3a1"/>
          </marker>
          <marker id="arrow-42-yellow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#f9e2af"/>
          </marker>
        </defs>

        {/* Client box */}
        <rect x="8" y="20" width="128" height="68" rx="6" fill="#1e1e2e" stroke="#89b4fa" strokeWidth="1.5"/>
        <text x="72" y="40" fontSize="10" fill="#89b4fa" textAnchor="middle" fontWeight="700">Agent Client</text>
        <text x="72" y="55" fontSize="9" fill="#bac2de" textAnchor="middle">Housing.com Bot</text>
        <text x="72" y="70" fontSize="9" fill="#6c7086" textAnchor="middle">LangGraph pipeline</text>
        <text x="72" y="82" fontSize="9" fill="#6c7086" textAnchor="middle">httpx.AsyncClient</text>

        {/* A2A Protocol layer */}
        <rect x="186" y="6" width="140" height="96" rx="6" fill="#1e1e2e" stroke="#cba6f7" strokeWidth="1.5"/>
        <text x="256" y="22" fontSize="10" fill="#cba6f7" textAnchor="middle" fontWeight="700">A2A Protocol</text>
        <text x="256" y="36" fontSize="9" fill="#6c7086" textAnchor="middle">HTTP + SSE + OAuth2</text>
        <rect x="196" y="44" width="120" height="14" rx="3" fill="#313244"/>
        <text x="256" y="54" fontSize="9" fill="#bac2de" textAnchor="middle">GET /.well-known/agent.json</text>
        <rect x="196" y="62" width="120" height="14" rx="3" fill="#313244"/>
        <text x="256" y="72" fontSize="9" fill="#bac2de" textAnchor="middle">POST /tasks  {"{id, message}"}</text>
        <rect x="196" y="80" width="120" height="14" rx="3" fill="#313244"/>
        <text x="256" y="90" fontSize="9" fill="#a6e3a1" textAnchor="middle">SSE stream → events</text>

        {/* Remote Agent box */}
        <rect x="380" y="6" width="172" height="96" rx="6" fill="#1e1e2e" stroke="#94e2d5" strokeWidth="1.5"/>
        <text x="466" y="22" fontSize="10" fill="#94e2d5" textAnchor="middle" fontWeight="700">Remote Agent</text>
        <text x="466" y="36" fontSize="9" fill="#6c7086" textAnchor="middle">PropertySearchAgent</text>
        <rect x="390" y="44" width="152" height="50" rx="3" fill="#313244"/>
        <text x="466" y="56" fontSize="9" fill="#f9e2af" textAnchor="middle">Agent Card (skills):</text>
        <text x="400" y="69" fontSize="8" fill="#bac2de">"search_properties"</text>
        <text x="400" y="81" fontSize="8" fill="#bac2de">"calculate_emi"</text>
        <text x="400" y="90" fontSize="8" fill="#6c7086">auth: OAuth2</text>

        {/* Horizontal arrows */}
        {/* Discovery */}
        <line x1="137" y1="36" x2="184" y2="36" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#arrow-42-blue)"/>
        <text x="160" y="30" fontSize="8" fill="#6c7086" textAnchor="middle">① discover</text>

        <line x1="326" y1="50" x2="378" y2="50" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#arrow-42-blue)"/>
        <text x="352" y="44" fontSize="8" fill="#6c7086" textAnchor="middle">agent.json</text>

        {/* Task submit */}
        <line x1="137" y1="62" x2="184" y2="62" stroke="#cba6f7" strokeWidth="1.5" markerEnd="url(#arrow-42-blue)"/>
        <text x="160" y="56" fontSize="8" fill="#6c7086" textAnchor="middle">② submit</text>

        <line x1="326" y1="72" x2="378" y2="72" stroke="#cba6f7" strokeWidth="1.5" markerEnd="url(#arrow-42-blue)"/>
        <text x="352" y="66" fontSize="8" fill="#6c7086" textAnchor="middle">POST /tasks</text>

        {/* SSE back */}
        <line x1="378" y1="88" x2="326" y2="88" stroke="#a6e3a1" strokeWidth="1.5" strokeDasharray="4 3" className="dash-anim-42a" markerEnd="url(#arrow-42-green)"/>
        <line x1="184" y1="88" x2="137" y2="88" stroke="#a6e3a1" strokeWidth="1.5" strokeDasharray="4 3" className="dash-anim-42a" markerEnd="url(#arrow-42-green)"/>
        <text x="160" y="100" fontSize="8" fill="#a6e3a1" textAnchor="middle">③ stream</text>

        {/* Task state machine */}
        <text x="10" y="122" fontSize="10" fill="#6c7086" fontWeight="700">TASK STATE MACHINE</text>
        {[
          {x:10, label:'submitted', color:'#f9e2af'},
          {x:116, label:'working', color:'#89b4fa'},
          {x:222, label:'completed', color:'#a6e3a1'},
        ].map((s, i) => (
          <g key={i}>
            <rect x={s.x} y="130" width="100" height="28" rx="6" fill="#1e1e2e" stroke={s.color} strokeWidth="1.5"/>
            <text x={s.x+50} y="148" fontSize="10" fill={s.color} textAnchor="middle" fontWeight="600">{s.label}</text>
          </g>
        ))}
        <line x1="112" y1="144" x2="114" y2="144" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#arrow-42-blue)"/>
        <line x1="218" y1="144" x2="220" y2="144" stroke="#a6e3a1" strokeWidth="1.5" markerEnd="url(#arrow-42-green)"/>

        {/* input-required branch */}
        <rect x="116" y="176" width="106" height="28" rx="6" fill="#1e1e2e" stroke="#fab387" strokeWidth="1.5"/>
        <text x="169" y="194" fontSize="10" fill="#fab387" textAnchor="middle" fontWeight="600">input-required</text>
        <line x1="166" y1="158" x2="166" y2="174" stroke="#fab387" strokeWidth="1.5" markerEnd="url(#arrow-42-yellow)"/>
        <text x="172" y="170" fontSize="8" fill="#6c7086">needs clarification</text>
        <line x1="222" y1="190" x2="330" y2="190" stroke="#fab387" strokeWidth="1" strokeDasharray="3 3"/>
        <text x="334" y="194" fontSize="9" fill="#6c7086">PUT /tasks/{"{id}"} with user reply</text>

        {/* SSE event types */}
        <text x="340" y="122" fontSize="10" fill="#6c7086" fontWeight="700">SSE EVENTS</text>
        {[
          {label:'TaskStatusUpdateEvent', color:'#89b4fa', y:132},
          {label:'TaskArtifactUpdateEvent', color:'#94e2d5', y:152},
          {label:'status: completed', color:'#a6e3a1', y:172},
        ].map((e, i) => (
          <g key={i}>
            <rect x="340" y={e.y} width="180" height="16" rx="3" fill="#313244" stroke={e.color} strokeWidth="0.8"/>
            <text x="430" y={e.y+11} fontSize="9" fill={e.color} textAnchor="middle">{e.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function LangSmithTraceViz() {
  const [expanded, setExpanded] = useState<number[]>([0,1,2,3,4,5]);

  const spans = [
    {id:0, indent:0, label:'chat_endpoint', time:'450ms', tokens:'2.3K', color:'#89b4fa', parent:null},
    {id:1, indent:1, label:'domain_routing', time:'98ms', tokens:'', color:'#cba6f7', parent:0},
    {id:2, indent:2, label:'intent_classifier [LLM]', time:'87ms', tokens:'cost: $0.0003', color:'#f9e2af', parent:1},
    {id:3, indent:1, label:'tool_calls', time:'234ms', tokens:'', color:'#cba6f7', parent:0},
    {id:4, indent:2, label:'search_properties', time:'120ms', tokens:'✓', color:'#a6e3a1', parent:3},
    {id:5, indent:2, label:'get_price_data [⚠ 800ms]', time:'800ms', tokens:'P95 exceeded', color:'#f38ba8', parent:3},
    {id:6, indent:1, label:'response_synthesis [LLM]', time:'118ms', tokens:'cost: $0.0012', color:'#f9e2af', parent:0},
  ];

  const toggleSpan = (id: number) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const isVisible = (span: typeof spans[0]) => {
    if (span.parent === null) return true;
    return expanded.includes(span.parent) && (span.indent < 2 || (span.parent !== null && expanded.includes(span.parent)));
  };

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>LANGSMITH TRACE TREE — EVERY LLM CALL, EVERY NODE, EVERY MILLISECOND</div>
      <div style={{marginBottom:'10px',fontSize:'0.78rem',color:'#6c7086'}}>Click any row to expand/collapse</div>
      <div style={{background:'#1e1e2e',borderRadius:'6px',padding:'12px',fontFamily:'monospace',fontSize:'0.82rem'}}>
        {spans.map(span => isVisible(span) && (
          <div
            key={span.id}
            onClick={() => toggleSpan(span.id)}
            style={{
              display:'flex',
              alignItems:'center',
              padding:'6px 4px',
              marginLeft: `${span.indent * 24}px`,
              borderLeft: span.indent > 0 ? `1px solid #45475a` : 'none',
              paddingLeft: span.indent > 0 ? '10px' : '4px',
              cursor:'pointer',
              borderRadius:'4px',
              background: span.color === '#f38ba8' ? '#f38ba811' : 'transparent',
              marginBottom:'2px',
            }}
          >
            <span style={{color:'#6c7086',marginRight:'6px',fontSize:'0.72rem'}}>
              {span.indent === 0 ? '▶' : expanded.includes(span.id) ? '▾' : '▸'}
            </span>
            <span style={{color:span.color,flex:1}}>{span.label}</span>
            <span style={{color:'#bac2de',marginLeft:'12px',fontSize:'0.78rem'}}>{span.time}</span>
            {span.tokens && <span style={{color:'#6c7086',marginLeft:'12px',fontSize:'0.72rem'}}>{span.tokens}</span>}
            {span.color === '#f38ba8' && <span style={{color:'#f38ba8',marginLeft:'8px',fontSize:'0.78rem',fontWeight:700}}>⚠</span>}
          </div>
        ))}
      </div>
      <div style={{marginTop:'12px',padding:'8px 12px',background:'#313244',borderRadius:'6px',fontSize:'0.78rem',color:'#bac2de'}}>
        <span style={{color:'#f38ba8',fontWeight:700}}>⚠ get_price_data</span>: latency 800ms — P95 threshold exceeded (200ms). Click span → see exact prompt, tokens used, cost per call.
      </div>
    </div>
  );
}

const CODE_REVIEW_STATE = `class ReviewState(TypedDict):
    messages:        Annotated[list, add_messages]  # conversation history
    draft:           str                             # current draft text
    critique:        str | None                      # critic's last feedback
    revision_count:  int                             # circuit breaker`;

const CODE_1 = `from langgraph.types import Command

def triage_agent(state: SwarmState) -> Command:
    intent = classify(state["messages"][-1].content)
    return Command(
        goto="search_agent" if intent == "property_search" else "finance_agent",
        update={"intent": intent}
    )

def search_agent(state: SwarmState) -> Command:
    results = search_properties(state["messages"][-1].content)
    if not results:
        return Command(goto="triage_agent",  # hand back if no results
                       update={"messages": [AIMessage("No results — retrying")]})
    return Command(goto=END, update={"messages": [AIMessage(str(results))]})`;

const CODE_2 = `# Four search agents run concurrently
def orchestrator(state) -> dict:
    return {"queries": ["Bandra prices", "Powai prices", "rental yields", "infra projects"]}

for i in range(4):
    graph.add_node(f"search_{i}", make_search_node(i))
    graph.add_edge("orchestrator", f"search_{i}")  # fan out
    graph.add_edge(f"search_{i}", "aggregator")    # fan in

# LangGraph waits for ALL fan-in edges before running aggregator
def aggregator(state) -> dict:
    return {"analysis": synthesise(state["search_results"])}`;

const CODE_3 = `def writer(state: ReviewState) -> dict:
    prompt = (f"Revise based on: {state['critique']}\\nDraft: {state['draft']}"
              if state.get("critique") else f"Write report for: {state['messages'][-1].content}")
    return {"draft": llm.invoke(prompt).content,
            "revision_count": state.get("revision_count", 0) + 1}

def critic(state: ReviewState) -> dict:
    return {"critique": llm.invoke(f"Critique for accuracy:\\n{state['draft']}").content}

def route_review(state: ReviewState) -> str:
    if state["revision_count"] >= 3: return "end"
    if "looks good" in state["critique"].lower(): return "end"
    return "revise"`;

const CODE_4 = `// Agent Card — published at /.well-known/agent.json
{
  "name": "PropertySearchAgent",
  "url": "https://agents.housing.com/property-search",
  "authentication": { "type": "oauth2", "scopes": ["listings:read"] },
  "skills": [{
    "id": "search_listings",
    "description": "Search by city, price, bedrooms",
    "inputModes": ["text"], "outputModes": ["text", "data"]
  }]
}`;

const CODE_5 = `async def call_a2a_agent(agent_url: str, query: str, token: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{agent_url}/tasks",
            json={"skill": "search_listings",
                  "message": {"role": "user", "parts": [{"type": "text", "text": query}]}},
            headers={"Authorization": f"Bearer {token}", "Accept": "text/event-stream"},
        )
        result = ""
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                event = json.loads(line[6:])
                if event.get("type") == "TaskArtifactUpdateEvent":
                    result += event["artifact"]["parts"][0]["text"]
                elif event.get("status", {}).get("state") == "completed":
                    break
        return result`;

const CODE_6 = `# Minimal A2A FastAPI server
@app.get("/.well-known/agent.json")
def agent_card():
    return {"name": "PropertySearchAgent", "url": "https://agents.housing.com",
            "skills": [{"id": "search_listings", "description": "Search listings"}]}

@app.post("/tasks")
async def create_task(body: dict):
    query = body["message"]["parts"][0]["text"]
    async def stream():
        yield "data: " + json.dumps({"type":"TaskStatusUpdateEvent","status":{"state":"working"}}) + "\\n\\n"
        results = await search_properties_async(query)
        yield "data: " + json.dumps({"type":"TaskArtifactUpdateEvent","artifact":{"parts":[{"type":"text","text":str(results)}]}}) + "\\n\\n"
        yield "data: " + json.dumps({"type":"TaskStatusUpdateEvent","status":{"state":"completed"}}) + "\\n\\n"
    return StreamingResponse(stream(), media_type="text/event-stream")`;

const CODE_7 = `@app.post("/tasks")
async def create_task(body: dict):
    query = body["message"]["parts"][0]["text"]
    async def stream():
        yield "data: " + json.dumps({"type":"TaskStatusUpdateEvent","status":{"state":"working"}}) + "\\n\\n"
        if needs_clarification(query):
            msg = {"parts":[{"type":"text","text":"Please clarify: 2BHK or 3BHK?"}]}
            yield "data: " + json.dumps({"type":"TaskStatusUpdateEvent","status":{"state":"input-required","message":msg}}) + "\\n\\n"
            return  # client sends PUT /tasks/{id} with the response
        results = await search_properties_async(query)
        yield "data: " + json.dumps({"type":"TaskArtifactUpdateEvent","artifact":{"parts":[{"type":"text","text":str(results)}]}}) + "\\n\\n"
        yield "data: " + json.dumps({"type":"TaskStatusUpdateEvent","status":{"state":"completed"}}) + "\\n\\n"
    return StreamingResponse(stream(), media_type="text/event-stream")`;

const DIAGRAM_A2A = `── Three-Layer Agent Architecture with A2A ───────────────────────────────────

LAYER 1: INTERNAL (LangGraph multi-agent pipeline, Housing.com)
┌─────────────────────────────────────────────────────────────────────────┐
│  Supervisor → Research Agent → Analyst Agent → Writer Agent            │
│  Communication: shared LangGraph state dict (in-process)               │
│  Protocol: none — direct function calls via graph edges                │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │ needs external specialised agent
                            ↓  HTTP+SSE  (A2A protocol)
LAYER 2: EXTERNAL AGENTS (other vendors / other LangGraph instances)
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────────────┐
│  PropertySearch   │  │  MortgageCalc     │  │  LegalDocs Agent          │
│  Agent            │  │  Agent            │  │  (third-party vendor)     │
│  /.well-known/    │  │  /.well-known/    │  │  /.well-known/            │
│  agent.json       │  │  agent.json       │  │  agent.json               │
└───────────────────┘  └───────────────────┘  └───────────────────────────┘
                            │ agent results (TaskArtifactUpdateEvent)
                            ↓
LAYER 3: END CLIENT (user browser / another agent)
┌─────────────────────────────────────────────────────────────────────────┐
│  User sees streamed result / downstream agent processes TaskOutput      │
└─────────────────────────────────────────────────────────────────────────┘
MCP = "what tools can Claude use?" (single-host, sync)
A2A = "how do agents call other agents?" (cross-vendor, async, stateful)`;

const CODE_8 = `from langsmith import traceable
import os

os.environ["LANGCHAIN_TRACING_V2"] = "true"

@traceable(name="property_search_agent", metadata={"version": "2.1"})
def run_agent(query: str) -> dict:
    return app.invoke({"messages": [HumanMessage(query)]})

# LangSmith shows: every node I/O, per-node latency + token cost,
# full message history, links to eval datasets for regression`;

const DIAGRAM_TRACE = `── LangSmith Trace: property_search_agent ────────────────────────────────────

▶ property_search_agent           [TOTAL: 820ms, $0.0018]     ← root span
  │  input:  {"query": "3BHK in Bandra under 2Cr"}
  │  output: {"response": "Found 4 listings...", "properties": [...]}
  │
  ├─▶ safety_node                 [12ms, no LLM]              ← node span
  │     output: {safe: true}
  │
  ├─▶ route_domain_node           [25ms, 60 tokens, $0.00005] ← SLM call
  │     model:  claude-haiku-4-5-20251001
  │     cached: true (system prompt cache hit — 90% cheaper)
  │     output: {domain: "property_search", confidence: 0.98}
  │
  ├─▶ classify_intent_node        [180ms, 400 tokens, $0.0003]
  │     output: {intent: "filter_search", bhk: 3, price_max: 20000000}
  │
  ├─▶ fetch_data_node             [310ms, no LLM]
  │     tool_calls: [search_properties, get_locality_detail]  ← parallel
  │
  └─▶ llm_response_node          [290ms, 800 tokens, $0.0015]
        output: "Found 4 properties matching your criteria..."

Debugging workflow:
  1. Find failing session_id (filter by error=true or low RAGAS score)
  2. Click the trace — expand each node to see exact inputs/outputs
  3. Reproduce locally: app.invoke(exact_input_from_trace, config)`;

const CODE_9 = `# ASCII graph structure
print(app.get_graph().draw_ascii())
# Inspect live checkpoint state
config = {"configurable": {"thread_id": "debug_1"}}
state = app.get_state(config)
print(state.values)   # all fields
print(state.next)     # which node runs next

# Time-travel: replay from any checkpoint
for snapshot in app.get_state_history(config):
    print(snapshot.config, snapshot.values["messages"][-1].content)

# Mermaid diagram for documentation
print(app.get_graph().draw_mermaid())`;

const CODE_10 = `pip install "langgraph-cli[inmem]"
langgraph dev    # browser GUI at localhost:8123
# → Live graph with active node highlighted
# → Step-by-step state inspector (click any node)
# → Time-travel debugging, hot-reload on code change`;

const CODE_11 = `def monitor_node(node_name: str):
    def decorator(fn):
        @wraps(fn)
        def wrapper(state, *args, **kwargs):
            start = time.time()
            try:
                result = fn(state, *args, **kwargs)
                log.info("node_ok", node=node_name,
                          latency_ms=round((time.time()-start)*1000),
                          tokens=result.get("_tokens", 0))
                return result
            except Exception as e:
                log.error("node_fail", node=node_name, error=str(e)); raise
        return wrapper
    return decorator`;

const CODE_12 = `1. LangSmith trace first
   → Which node failed? What was input/output?

2. State at failure: app.get_state(config).values
   → What was in state when it went wrong?

3. Tool schemas: print(tool.args_schema.schema())
   → Add better Field(description=...) if LLM misuses the tool

4. Routing logic: print state before conditional edge
   → Is the route function seeing what you expect?

5. add_messages gotcha
   → return {"messages": [...]}  ← correct (appends)
   → state["messages"] = [...]   ← wrong (replaces)

6. Infinite loops: is max_iterations set? Is there a "done" condition?

7. Cost attribution: which node consumes most tokens?
   → Can you cache or trim its inputs?`;

export function Mod42() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Implement swarm, fan-out/aggregation, and critic-revision agent team patterns</li>
          <li>Explain A2A's Agent Card, Task state machine, and HTTP+SSE transport</li>
          <li>Build a minimal A2A server exposing Housing.com agents to cross-vendor clients</li>
          <li>Use LangSmith traces, LangGraph state inspector, and LangGraph Studio for debugging</li>
          <li>Add node-level monitoring: latency, token cost, loop detection, alerting</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~85 minutes</span>
          <span className="obj-diff">Difficulty: ★★★★★</span>
          <span className="obj-diff">Prerequisites: Modules 40, 43, 44</span>
        </div>
      </div>
      <div className="callout callout-info">
        <strong>Housing.com Context</strong><br />
        Housing.com's single-node architecture could evolve into a team: a classifier agent, a search specialist, and a response synthesiser communicating via A2A. The LangSmith tracing patterns here extend Housing.com's existing <code>@traceable</code> setup to multi-agent attribution.
      </div>

      <A2AProtocolViz />

      <h2>45.1 Agent Team Patterns</h2>
      <p>LangGraph supports patterns where <strong>agents hand off to each other directly</strong>, run in parallel, or loop against each other. Three patterns cover most real-world needs.</p>

      <h3>Swarm (emergent handoff)</h3>
      <div className="callout callout-info">
        <strong>What is a Swarm?</strong> In a supervisor architecture, a central agent decides who handles what. In a <strong>Swarm</strong>, there is no central decider — each agent decides for itself whether to handle the request or hand it to a better-suited agent. Control "emerges" from the agents' own routing decisions.
        <br /><br />
        <strong>The FE analogy:</strong> A JavaScript event bus where any handler can re-dispatch an event. In LangGraph, this is done with the <code>Command</code> return type.
        <br /><br />
        <strong>Key types:</strong>
        <ul style={{margin:'6px 0 0 16px'}}>
          <li><code>Command(goto="node_name", update={'{}'})</code> — instead of returning a plain state dict, returns a <code>Command</code> that says "update the state like this AND route to this specific node next."</li>
          <li><code>SwarmState</code> — a TypedDict you define with a <code>messages</code> field annotated with <code>{'Annotated[list, add_messages]'}</code>.</li>
        </ul>
      </div>
      <CodeBlock title="Swarm Agent Emergent Handoff" language="python" keyLine={4} keyNote="Command replaces plain dict — carries both state update and routing">{CODE_1}</CodeBlock>
      <div className="callout callout-warn">
        <strong>When does Swarm beat Supervisor?</strong> Use Swarm when agents genuinely need to loop back on each other (search hands back to triage on failure) or when the routing logic is deeply contextual. Use Supervisor when you need a clear audit trail of who decided what — the supervisor's routing is explicit and observable. Swarm routing is emergent and harder to debug.
      </div>

      <h3>Parallel fan-out + aggregation</h3>
      <div className="callout callout-info">
        <strong>What is fan-out?</strong> Fan-out means running multiple agents simultaneously in parallel — the same concept as <code>Promise.all([p1, p2, p3])</code> in JavaScript. You add multiple edges from one node (the orchestrator) to several child nodes (the searchers). LangGraph runs all children concurrently and <strong>waits for every one to complete</strong> before the aggregator runs.
        <br /><br />
        <strong><code>make_search_node(i)</code></strong> is a factory function — it takes an index <code>i</code> and returns a node function pre-configured to use query <code>i</code> from the state. Each returned function closes over its own <code>i</code>, so all four search nodes are independent.
      </div>
      <CodeBlock title="Parallel Fan-Out with Aggregator Barrier" language="python" keyLine={9} keyNote="LangGraph waits for ALL fan-in edges before aggregator runs">{CODE_2}</CodeBlock>
      <div className="callout callout-tip">
        <strong>The "superstep" model:</strong> LangGraph executes nodes in rounds called supersteps. All nodes that receive an edge in the same superstep run concurrently. The aggregator is only eligible in the <em>next</em> superstep — after all four search nodes have written to state. No synchronisation code needed; the graph structure encodes the barrier.
      </div>

      <h3>Critic-revision loop</h3>
      <div className="callout callout-info">
        <strong>What is the critic-revision pattern?</strong> One agent produces a draft; a second agent critiques it; a routing function decides whether to send it back for revision or declare it good enough. Repeats up to a maximum number of times.
        <br /><br />
        <strong>The FE analogy:</strong> An automated CI loop — run linter → read failures → fix code → re-run → stop when green or max retries reached.
        <br /><br />
        The <code>ReviewState</code> TypedDict you need:
        <CodeBlock title="ReviewState TypedDict for Critic Loop" language="python" keyLine={4} keyNote="revision_count is the circuit breaker that prevents infinite loops">{CODE_REVIEW_STATE}</CodeBlock>
        <code>route_review</code> is the conditional edge function — pass it to <code>graph.add_conditional_edges("critic", route_review)</code>.
      </div>
      <CodeBlock title="Writer, Critic, and Route Functions" language="python" keyLine={8} keyNote="route_review conditional edge drives the revision loop or exits">{CODE_3}</CodeBlock>

      <h2>45.2 Google A2A Protocol</h2>
      <div className="callout callout-info">
        <strong>A2A spec maturity — stable for HTTP, evolving for enterprise features</strong>
        A2A v1.0 was released in April 2025 and donated to the Linux Foundation in June 2025 — production-stable at the HTTP+SSE + OAuth2 + Agent Card level. The core task lifecycle (submitted → working → input-required → completed/failed) and Agent Card discovery are stable. 150+ org supporters (Google, MongoDB, SAP, Salesforce, Anthropic, Meta).
      </div>
      <pre style={{fontSize:'11px',background:'#1e1e2e',color:'#cdd6f4',padding:'10px',borderRadius:'4px',margin:'8px 0',overflowX:'auto'}}>{DIAGRAM_A2A}</pre>
      <p>A2A (Agent2Agent) — open standard donated to Linux Foundation (June 2025). Defines how agents from different vendors discover, delegate, and exchange results.</p>
      <CodeBlock title="A2A Agent Card — Discovery Manifest" language="json" keyLine={4} keyNote="authentication block enforces OAuth2 before any skill is callable">{CODE_4}</CodeBlock>
      <CodeBlock title="A2A Client — Streaming Task Submission" language="python" keyLine={10} keyNote="SSE line-by-line parse yields artifact chunks as they arrive">{CODE_5}</CodeBlock>
      <CodeBlock title="Minimal A2A FastAPI Server" language="python" keyLine={14} keyNote="StreamingResponse with SSE media type enables live task updates">{CODE_6}</CodeBlock>
      <table>
        <tbody>
          <tr><th>Protocol</th><th>Scope</th><th>Transport</th><th>When to use</th></tr>
          <tr><td><strong>A2A</strong></td><td>Agent ↔ Agent (cross-org)</td><td>HTTP + SSE + OAuth2</td><td>Delegating to external agents from another vendor</td></tr>
          <tr><td><strong>MCP</strong></td><td>LLM ↔ Tools/Data</td><td>stdio / HTTP-SSE</td><td>Exposing local tools to any LLM host</td></tr>
          <tr><td><strong>LangGraph</strong></td><td>Intra-framework nodes</td><td>In-process</td><td>Multi-agent pipelines within your codebase</td></tr>
        </tbody>
      </table>
      <div className="callout callout-tip">
        <strong>A2A input-required state — how to pause and resume an agent</strong>
        <CodeBlock title="A2A Server — input-required Pause and Resume" language="python" keyLine={6} keyNote="input-required state suspends stream; client replies via PUT /tasks/{id}">{CODE_7}</CodeBlock>
      </div>

      <LangSmithTraceViz />

      <h2>45.3 Debugging with LangSmith</h2>
      <p>LangSmith captures every function decorated with <code>@traceable</code> as a <strong>span</strong> in a hierarchical trace. The outermost decorated function becomes the <strong>root span</strong>; every LLM call and tool call inside it appears as a <strong>child span</strong>. Each span records its input arguments, output value, latency in ms, token count, and cost in USD.</p>
      <p>Reading a LangSmith trace is like reading a <strong>browser network waterfall</strong>: you see exactly which step took the most time, what data flowed in and out, and where the cost accumulated.</p>
      <pre style={{fontSize:'11px',background:'#1e1e2e',color:'#cdd6f4',padding:'10px',borderRadius:'4px',margin:'8px 0',overflowX:'auto'}}>{DIAGRAM_TRACE}</pre>
      <CodeBlock title="LangSmith @traceable Setup" language="python" keyLine={4} keyNote="metadata version tag lets you diff traces across deployments">{CODE_8}</CodeBlock>
      <div className="callout callout-warn">
        <strong>LangSmith cloud sends ALL trace data to Langchain's servers</strong>
        If your agent handles user PII (names, contact info, financial data), this violates GDPR and most enterprise data governance policies.
        <br /><br />
        <strong>Options for PII-safe tracing:</strong>
        <ul>
          <li><strong>Self-hosted LangSmith:</strong> Docker/Kubernetes deployment in your VPC; data never leaves your infrastructure</li>
          <li><strong>Langfuse (open-source):</strong> full self-hosting, MIT license, same trace UI quality</li>
          <li><strong>Sampling:</strong> set <code>LANGCHAIN_TRACING_SAMPLE_RATE=0.1</code> to trace 10% of requests; anonymise PII before logging the sample</li>
        </ul>
        For the Housing.com chatbot in production: user queries may contain names and phone numbers —
        use self-hosted Langfuse or 10% sampled traces with PII masking.
      </div>

      <h2>45.4 LangGraph State Inspector &amp; Studio</h2>
      <p>When you compile a LangGraph graph with a checkpointer, it saves a complete snapshot of the state after <strong>every node execution</strong> — a replayable audit log. This is the same concept as <strong>Redux DevTools time-travel</strong>.</p>
      <p>Three things the API gives you:</p>
      <ul>
        <li><strong><code>app.get_state(config)</code></strong> — returns the current checkpoint. <code>state.values</code> is the full state dict. <code>state.next</code> is a tuple of node names that will execute on the next <code>invoke()</code> call.</li>
        <li><strong><code>app.get_state_history(config)</code></strong> — returns all past checkpoints for that <code>thread_id</code>, newest first. Each snapshot has its own <code>config</code> you can pass back to <code>invoke()</code> to replay from that exact point.</li>
        <li><strong><code>app.get_graph().draw_ascii()</code></strong> — prints the compiled graph structure. Run this whenever you add a new node to verify the edges connected the way you intended.</li>
      </ul>
      <CodeBlock title="State Inspector and Time-Travel Replay" language="python" keyLine={11} keyNote="get_state_history lets you replay from any past checkpoint">{CODE_9}</CodeBlock>
      <CodeBlock title="LangGraph Studio Dev Server" language="bash" keyLine={2} keyNote="langgraph dev launches the live graph inspector at localhost:8123">{CODE_10}</CodeBlock>
      <div className="callout callout-tip">
        <strong>LangGraph Studio scope — dev tool only</strong>
        LangGraph Studio (<code>langgraph dev</code>) is a development tool that runs the graph in-process on your machine. It is NOT a production monitoring dashboard. For production: LangSmith traces + your custom <code>monitor_node</code> decorator + Prometheus metrics.
        <br /><br />
        <strong>LangGraph parallel execution — superstep model:</strong> When multiple edges fan into the same node, LangGraph waits for ALL incoming branches to complete before executing it. This is synchronised fan-in. Design parallel branches to have similar expected latency; otherwise your p95 is dominated by the slowest branch.
      </div>

      <h2>45.5 Production Monitoring</h2>
      <CodeBlock title="Node Monitoring Decorator" language="python" keyLine={8} keyNote="log.info on success captures latency and token count per node">{CODE_11}</CodeBlock>
      <table>
        <tbody>
          <tr><th>Alert</th><th>Condition</th><th>Likely cause</th></tr>
          <tr><td>Node timeout</td><td>latency_ms &gt; 10,000</td><td>LLM hung or tool timeout</td></tr>
          <tr><td>Loop detected</td><td>tool_calls_per_session &gt; 50</td><td>Missing termination condition</td></tr>
          <tr><td>Cost spike</td><td>cost_per_run_usd &gt; $0.10</td><td>Runaway agent or prompt bloat</td></tr>
        </tbody>
      </table>

      <h2>45.6 Debugging Checklist</h2>
      <CodeBlock title="Agent Debugging Checklist" language="text" keyLine={5} keyNote="add_messages gotcha: return dict, never mutate state directly">{CODE_12}</CodeBlock>

      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection</strong>
        "How do you debug an agent giving inconsistent results?" → LangSmith traces to find high-variance step. If routing: check conditional logic with state logging. If tool call: schema too ambiguous — tighten Field descriptions. If generation: add temperature=0 and structured output. For production: node-level latency alerts + loop detection on tool_calls_per_session.
      </div>

      <QuizSection moduleId={45} title="Module 45: Agent Teams, A2A & Debugging" contentHint="Swarm emergent handoff Command goto update, fan-out parallel edges aggregator waits all branches, critic-revision bounded revision_count, A2A Agent Card well-known/agent.json skills, Task state machine submitted working input-required completed, HTTP SSE streaming TaskArtifactUpdateEvent, A2A vs MCP vs LangGraph scope and transport comparison, LangSmith traceable per-node cost latency, get_state time-travel checkpoint inspector, LangGraph Studio localhost:8123, node monitoring latency loop detection cost alerting, add_messages gotcha debugging checklist" />
    </>
  );
}
