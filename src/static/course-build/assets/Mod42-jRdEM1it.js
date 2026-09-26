import{j as e,r as c}from"./index-D4pJPyGz.js";import{Q as h}from"./QuizSection-BedG7s-t.js";import{C as n}from"./CodeBlock-dJ_hHYfw.js";function g(){return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"A2A PROTOCOL — AGENT-TO-AGENT COMMUNICATION STANDARD"}),e.jsx("style",{children:`
        @keyframes dashFlow42a { to { stroke-dashoffset: -14; } }
        .dash-anim-42a { animation: dashFlow42a 1s linear infinite; }
      `}),e.jsxs("svg",{viewBox:"0 0 560 230",width:"100%",style:{display:"block",margin:"0 auto"},"aria-label":"A2A protocol flow diagram",children:[e.jsxs("defs",{children:[e.jsx("marker",{id:"arrow-42-blue",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#89b4fa"})}),e.jsx("marker",{id:"arrow-42-teal",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#94e2d5"})}),e.jsx("marker",{id:"arrow-42-green",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#a6e3a1"})}),e.jsx("marker",{id:"arrow-42-yellow",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#f9e2af"})})]}),e.jsx("rect",{x:"8",y:"20",width:"128",height:"68",rx:"6",fill:"#1e1e2e",stroke:"#89b4fa",strokeWidth:"1.5"}),e.jsx("text",{x:"72",y:"40",fontSize:"10",fill:"#89b4fa",textAnchor:"middle",fontWeight:"700",children:"Agent Client"}),e.jsx("text",{x:"72",y:"55",fontSize:"9",fill:"#bac2de",textAnchor:"middle",children:"Housing.com Bot"}),e.jsx("text",{x:"72",y:"70",fontSize:"9",fill:"#6c7086",textAnchor:"middle",children:"LangGraph pipeline"}),e.jsx("text",{x:"72",y:"82",fontSize:"9",fill:"#6c7086",textAnchor:"middle",children:"httpx.AsyncClient"}),e.jsx("rect",{x:"186",y:"6",width:"140",height:"96",rx:"6",fill:"#1e1e2e",stroke:"#cba6f7",strokeWidth:"1.5"}),e.jsx("text",{x:"256",y:"22",fontSize:"10",fill:"#cba6f7",textAnchor:"middle",fontWeight:"700",children:"A2A Protocol"}),e.jsx("text",{x:"256",y:"36",fontSize:"9",fill:"#6c7086",textAnchor:"middle",children:"HTTP + SSE + OAuth2"}),e.jsx("rect",{x:"196",y:"44",width:"120",height:"14",rx:"3",fill:"#313244"}),e.jsx("text",{x:"256",y:"54",fontSize:"9",fill:"#bac2de",textAnchor:"middle",children:"GET /.well-known/agent.json"}),e.jsx("rect",{x:"196",y:"62",width:"120",height:"14",rx:"3",fill:"#313244"}),e.jsxs("text",{x:"256",y:"72",fontSize:"9",fill:"#bac2de",textAnchor:"middle",children:["POST /tasks  ","{id, message}"]}),e.jsx("rect",{x:"196",y:"80",width:"120",height:"14",rx:"3",fill:"#313244"}),e.jsx("text",{x:"256",y:"90",fontSize:"9",fill:"#a6e3a1",textAnchor:"middle",children:"SSE stream → events"}),e.jsx("rect",{x:"380",y:"6",width:"172",height:"96",rx:"6",fill:"#1e1e2e",stroke:"#94e2d5",strokeWidth:"1.5"}),e.jsx("text",{x:"466",y:"22",fontSize:"10",fill:"#94e2d5",textAnchor:"middle",fontWeight:"700",children:"Remote Agent"}),e.jsx("text",{x:"466",y:"36",fontSize:"9",fill:"#6c7086",textAnchor:"middle",children:"PropertySearchAgent"}),e.jsx("rect",{x:"390",y:"44",width:"152",height:"50",rx:"3",fill:"#313244"}),e.jsx("text",{x:"466",y:"56",fontSize:"9",fill:"#f9e2af",textAnchor:"middle",children:"Agent Card (skills):"}),e.jsx("text",{x:"400",y:"69",fontSize:"8",fill:"#bac2de",children:'"search_properties"'}),e.jsx("text",{x:"400",y:"81",fontSize:"8",fill:"#bac2de",children:'"calculate_emi"'}),e.jsx("text",{x:"400",y:"90",fontSize:"8",fill:"#6c7086",children:"auth: OAuth2"}),e.jsx("line",{x1:"137",y1:"36",x2:"184",y2:"36",stroke:"#89b4fa",strokeWidth:"1.5",markerEnd:"url(#arrow-42-blue)"}),e.jsx("text",{x:"160",y:"30",fontSize:"8",fill:"#6c7086",textAnchor:"middle",children:"① discover"}),e.jsx("line",{x1:"326",y1:"50",x2:"378",y2:"50",stroke:"#89b4fa",strokeWidth:"1.5",markerEnd:"url(#arrow-42-blue)"}),e.jsx("text",{x:"352",y:"44",fontSize:"8",fill:"#6c7086",textAnchor:"middle",children:"agent.json"}),e.jsx("line",{x1:"137",y1:"62",x2:"184",y2:"62",stroke:"#cba6f7",strokeWidth:"1.5",markerEnd:"url(#arrow-42-blue)"}),e.jsx("text",{x:"160",y:"56",fontSize:"8",fill:"#6c7086",textAnchor:"middle",children:"② submit"}),e.jsx("line",{x1:"326",y1:"72",x2:"378",y2:"72",stroke:"#cba6f7",strokeWidth:"1.5",markerEnd:"url(#arrow-42-blue)"}),e.jsx("text",{x:"352",y:"66",fontSize:"8",fill:"#6c7086",textAnchor:"middle",children:"POST /tasks"}),e.jsx("line",{x1:"378",y1:"88",x2:"326",y2:"88",stroke:"#a6e3a1",strokeWidth:"1.5",strokeDasharray:"4 3",className:"dash-anim-42a",markerEnd:"url(#arrow-42-green)"}),e.jsx("line",{x1:"184",y1:"88",x2:"137",y2:"88",stroke:"#a6e3a1",strokeWidth:"1.5",strokeDasharray:"4 3",className:"dash-anim-42a",markerEnd:"url(#arrow-42-green)"}),e.jsx("text",{x:"160",y:"100",fontSize:"8",fill:"#a6e3a1",textAnchor:"middle",children:"③ stream"}),e.jsx("text",{x:"10",y:"122",fontSize:"10",fill:"#6c7086",fontWeight:"700",children:"TASK STATE MACHINE"}),[{x:10,label:"submitted",color:"#f9e2af"},{x:116,label:"working",color:"#89b4fa"},{x:222,label:"completed",color:"#a6e3a1"}].map((r,s)=>e.jsxs("g",{children:[e.jsx("rect",{x:r.x,y:"130",width:"100",height:"28",rx:"6",fill:"#1e1e2e",stroke:r.color,strokeWidth:"1.5"}),e.jsx("text",{x:r.x+50,y:"148",fontSize:"10",fill:r.color,textAnchor:"middle",fontWeight:"600",children:r.label})]},s)),e.jsx("line",{x1:"112",y1:"144",x2:"114",y2:"144",stroke:"#89b4fa",strokeWidth:"1.5",markerEnd:"url(#arrow-42-blue)"}),e.jsx("line",{x1:"218",y1:"144",x2:"220",y2:"144",stroke:"#a6e3a1",strokeWidth:"1.5",markerEnd:"url(#arrow-42-green)"}),e.jsx("rect",{x:"116",y:"176",width:"106",height:"28",rx:"6",fill:"#1e1e2e",stroke:"#fab387",strokeWidth:"1.5"}),e.jsx("text",{x:"169",y:"194",fontSize:"10",fill:"#fab387",textAnchor:"middle",fontWeight:"600",children:"input-required"}),e.jsx("line",{x1:"166",y1:"158",x2:"166",y2:"174",stroke:"#fab387",strokeWidth:"1.5",markerEnd:"url(#arrow-42-yellow)"}),e.jsx("text",{x:"172",y:"170",fontSize:"8",fill:"#6c7086",children:"needs clarification"}),e.jsx("line",{x1:"222",y1:"190",x2:"330",y2:"190",stroke:"#fab387",strokeWidth:"1",strokeDasharray:"3 3"}),e.jsxs("text",{x:"334",y:"194",fontSize:"9",fill:"#6c7086",children:["PUT /tasks/","{id}"," with user reply"]}),e.jsx("text",{x:"340",y:"122",fontSize:"10",fill:"#6c7086",fontWeight:"700",children:"SSE EVENTS"}),[{label:"TaskStatusUpdateEvent",color:"#89b4fa",y:132},{label:"TaskArtifactUpdateEvent",color:"#94e2d5",y:152},{label:"status: completed",color:"#a6e3a1",y:172}].map((r,s)=>e.jsxs("g",{children:[e.jsx("rect",{x:"340",y:r.y,width:"180",height:"16",rx:"3",fill:"#313244",stroke:r.color,strokeWidth:"0.8"}),e.jsx("text",{x:"430",y:r.y+11,fontSize:"9",fill:r.color,textAnchor:"middle",children:r.label})]},s))]})]})}function p(){const[r,s]=c.useState([0,1,2,3,4,5]),i=[{id:0,indent:0,label:"chat_endpoint",time:"450ms",tokens:"2.3K",color:"#89b4fa",parent:null},{id:1,indent:1,label:"domain_routing",time:"98ms",tokens:"",color:"#cba6f7",parent:0},{id:2,indent:2,label:"intent_classifier [LLM]",time:"87ms",tokens:"cost: $0.0003",color:"#f9e2af",parent:1},{id:3,indent:1,label:"tool_calls",time:"234ms",tokens:"",color:"#cba6f7",parent:0},{id:4,indent:2,label:"search_properties",time:"120ms",tokens:"✓",color:"#a6e3a1",parent:3},{id:5,indent:2,label:"get_price_data [⚠ 800ms]",time:"800ms",tokens:"P95 exceeded",color:"#f38ba8",parent:3},{id:6,indent:1,label:"response_synthesis [LLM]",time:"118ms",tokens:"cost: $0.0012",color:"#f9e2af",parent:0}],o=t=>{s(a=>a.includes(t)?a.filter(d=>d!==t):[...a,t])},l=t=>t.parent===null?!0:r.includes(t.parent)&&(t.indent<2||t.parent!==null&&r.includes(t.parent));return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"LANGSMITH TRACE TREE — EVERY LLM CALL, EVERY NODE, EVERY MILLISECOND"}),e.jsx("div",{style:{marginBottom:"10px",fontSize:"0.78rem",color:"#6c7086"},children:"Click any row to expand/collapse"}),e.jsx("div",{style:{background:"#1e1e2e",borderRadius:"6px",padding:"12px",fontFamily:"monospace",fontSize:"0.82rem"},children:i.map(t=>l(t)&&e.jsxs("div",{onClick:()=>o(t.id),style:{display:"flex",alignItems:"center",padding:"6px 4px",marginLeft:`${t.indent*24}px`,borderLeft:t.indent>0?"1px solid #45475a":"none",paddingLeft:t.indent>0?"10px":"4px",cursor:"pointer",borderRadius:"4px",background:t.color==="#f38ba8"?"#f38ba811":"transparent",marginBottom:"2px"},children:[e.jsx("span",{style:{color:"#6c7086",marginRight:"6px",fontSize:"0.72rem"},children:t.indent===0?"▶":r.includes(t.id)?"▾":"▸"}),e.jsx("span",{style:{color:t.color,flex:1},children:t.label}),e.jsx("span",{style:{color:"#bac2de",marginLeft:"12px",fontSize:"0.78rem"},children:t.time}),t.tokens&&e.jsx("span",{style:{color:"#6c7086",marginLeft:"12px",fontSize:"0.72rem"},children:t.tokens}),t.color==="#f38ba8"&&e.jsx("span",{style:{color:"#f38ba8",marginLeft:"8px",fontSize:"0.78rem",fontWeight:700},children:"⚠"})]},t.id))}),e.jsxs("div",{style:{marginTop:"12px",padding:"8px 12px",background:"#313244",borderRadius:"6px",fontSize:"0.78rem",color:"#bac2de"},children:[e.jsx("span",{style:{color:"#f38ba8",fontWeight:700},children:"⚠ get_price_data"}),": latency 800ms — P95 threshold exceeded (200ms). Click span → see exact prompt, tokens used, cost per call."]})]})}const u=`class ReviewState(TypedDict):
    messages:        Annotated[list, add_messages]  # conversation history
    draft:           str                             # current draft text
    critique:        str | None                      # critic's last feedback
    revision_count:  int                             # circuit breaker`,x=`from langgraph.types import Command

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
    return Command(goto=END, update={"messages": [AIMessage(str(results))]})`,m=`# Four search agents run concurrently
def orchestrator(state) -> dict:
    return {"queries": ["Bandra prices", "Powai prices", "rental yields", "infra projects"]}

for i in range(4):
    graph.add_node(f"search_{i}", make_search_node(i))
    graph.add_edge("orchestrator", f"search_{i}")  # fan out
    graph.add_edge(f"search_{i}", "aggregator")    # fan in

# LangGraph waits for ALL fan-in edges before running aggregator
def aggregator(state) -> dict:
    return {"analysis": synthesise(state["search_results"])}`,f=`def writer(state: ReviewState) -> dict:
    prompt = (f"Revise based on: {state['critique']}\\nDraft: {state['draft']}"
              if state.get("critique") else f"Write report for: {state['messages'][-1].content}")
    return {"draft": llm.invoke(prompt).content,
            "revision_count": state.get("revision_count", 0) + 1}

def critic(state: ReviewState) -> dict:
    return {"critique": llm.invoke(f"Critique for accuracy:\\n{state['draft']}").content}

def route_review(state: ReviewState) -> str:
    if state["revision_count"] >= 3: return "end"
    if "looks good" in state["critique"].lower(): return "end"
    return "revise"`,y=`// Agent Card — published at /.well-known/agent.json
{
  "name": "PropertySearchAgent",
  "url": "https://agents.housing.com/property-search",
  "authentication": { "type": "oauth2", "scopes": ["listings:read"] },
  "skills": [{
    "id": "search_listings",
    "description": "Search by city, price, bedrooms",
    "inputModes": ["text"], "outputModes": ["text", "data"]
  }]
}`,j=`async def call_a2a_agent(agent_url: str, query: str, token: str) -> str:
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
        return result`,k=`# Minimal A2A FastAPI server
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
    return StreamingResponse(stream(), media_type="text/event-stream")`,b=`@app.post("/tasks")
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
    return StreamingResponse(stream(), media_type="text/event-stream")`,A=`── Three-Layer Agent Architecture with A2A ───────────────────────────────────

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
A2A = "how do agents call other agents?" (cross-vendor, async, stateful)`,w=`from langsmith import traceable
import os

os.environ["LANGCHAIN_TRACING_V2"] = "true"

@traceable(name="property_search_agent", metadata={"version": "2.1"})
def run_agent(query: str) -> dict:
    return app.invoke({"messages": [HumanMessage(query)]})

# LangSmith shows: every node I/O, per-node latency + token cost,
# full message history, links to eval datasets for regression`,v=`── LangSmith Trace: property_search_agent ────────────────────────────────────

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
  3. Reproduce locally: app.invoke(exact_input_from_trace, config)`,S=`# ASCII graph structure
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
print(app.get_graph().draw_mermaid())`,_=`pip install "langgraph-cli[inmem]"
langgraph dev    # browser GUI at localhost:8123
# → Live graph with active node highlighted
# → Step-by-step state inspector (click any node)
# → Time-travel debugging, hot-reload on code change`,L=`def monitor_node(node_name: str):
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
    return decorator`,T=`1. LangSmith trace first
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
   → Can you cache or trim its inputs?`;function I(){return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"learning-obj",children:[e.jsx("div",{className:"learning-obj-title",children:"After this module you will be able to"}),e.jsxs("ol",{children:[e.jsx("li",{children:"Implement swarm, fan-out/aggregation, and critic-revision agent team patterns"}),e.jsx("li",{children:"Explain A2A's Agent Card, Task state machine, and HTTP+SSE transport"}),e.jsx("li",{children:"Build a minimal A2A server exposing Housing.com agents to cross-vendor clients"}),e.jsx("li",{children:"Use LangSmith traces, LangGraph state inspector, and LangGraph Studio for debugging"}),e.jsx("li",{children:"Add node-level monitoring: latency, token cost, loop detection, alerting"})]}),e.jsxs("div",{className:"obj-meta",children:[e.jsx("span",{className:"obj-time",children:"⏱ ~85 minutes"}),e.jsx("span",{className:"obj-diff",children:"Difficulty: ★★★★★"}),e.jsx("span",{className:"obj-diff",children:"Prerequisites: Modules 40, 43, 44"})]})]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"Housing.com Context"}),e.jsx("br",{}),"Housing.com's single-node architecture could evolve into a team: a classifier agent, a search specialist, and a response synthesiser communicating via A2A. The LangSmith tracing patterns here extend Housing.com's existing ",e.jsx("code",{children:"@traceable"})," setup to multi-agent attribution."]}),e.jsx(g,{}),e.jsx("h2",{children:"45.1 Agent Team Patterns"}),e.jsxs("p",{children:["LangGraph supports patterns where ",e.jsx("strong",{children:"agents hand off to each other directly"}),", run in parallel, or loop against each other. Three patterns cover most real-world needs."]}),e.jsx("h3",{children:"Swarm (emergent handoff)"}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"What is a Swarm?"})," In a supervisor architecture, a central agent decides who handles what. In a ",e.jsx("strong",{children:"Swarm"}),`, there is no central decider — each agent decides for itself whether to handle the request or hand it to a better-suited agent. Control "emerges" from the agents' own routing decisions.`,e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"The FE analogy:"})," A JavaScript event bus where any handler can re-dispatch an event. In LangGraph, this is done with the ",e.jsx("code",{children:"Command"})," return type.",e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"Key types:"}),e.jsxs("ul",{style:{margin:"6px 0 0 16px"},children:[e.jsxs("li",{children:[e.jsxs("code",{children:['Command(goto="node_name", update=',"{}",")"]})," — instead of returning a plain state dict, returns a ",e.jsx("code",{children:"Command"}),' that says "update the state like this AND route to this specific node next."']}),e.jsxs("li",{children:[e.jsx("code",{children:"SwarmState"})," — a TypedDict you define with a ",e.jsx("code",{children:"messages"})," field annotated with ",e.jsx("code",{children:"Annotated[list, add_messages]"}),"."]})]})]}),e.jsx(n,{title:"Swarm Agent Emergent Handoff",language:"python",keyLine:4,keyNote:"Command replaces plain dict — carries both state update and routing",children:x}),e.jsxs("div",{className:"callout callout-warn",children:[e.jsx("strong",{children:"When does Swarm beat Supervisor?"})," Use Swarm when agents genuinely need to loop back on each other (search hands back to triage on failure) or when the routing logic is deeply contextual. Use Supervisor when you need a clear audit trail of who decided what — the supervisor's routing is explicit and observable. Swarm routing is emergent and harder to debug."]}),e.jsx("h3",{children:"Parallel fan-out + aggregation"}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"What is fan-out?"})," Fan-out means running multiple agents simultaneously in parallel — the same concept as ",e.jsx("code",{children:"Promise.all([p1, p2, p3])"})," in JavaScript. You add multiple edges from one node (the orchestrator) to several child nodes (the searchers). LangGraph runs all children concurrently and ",e.jsx("strong",{children:"waits for every one to complete"})," before the aggregator runs.",e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:e.jsx("code",{children:"make_search_node(i)"})})," is a factory function — it takes an index ",e.jsx("code",{children:"i"})," and returns a node function pre-configured to use query ",e.jsx("code",{children:"i"})," from the state. Each returned function closes over its own ",e.jsx("code",{children:"i"}),", so all four search nodes are independent."]}),e.jsx(n,{title:"Parallel Fan-Out with Aggregator Barrier",language:"python",keyLine:9,keyNote:"LangGraph waits for ALL fan-in edges before aggregator runs",children:m}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:'The "superstep" model:'})," LangGraph executes nodes in rounds called supersteps. All nodes that receive an edge in the same superstep run concurrently. The aggregator is only eligible in the ",e.jsx("em",{children:"next"})," superstep — after all four search nodes have written to state. No synchronisation code needed; the graph structure encodes the barrier."]}),e.jsx("h3",{children:"Critic-revision loop"}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"What is the critic-revision pattern?"})," One agent produces a draft; a second agent critiques it; a routing function decides whether to send it back for revision or declare it good enough. Repeats up to a maximum number of times.",e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"The FE analogy:"})," An automated CI loop — run linter → read failures → fix code → re-run → stop when green or max retries reached.",e.jsx("br",{}),e.jsx("br",{}),"The ",e.jsx("code",{children:"ReviewState"})," TypedDict you need:",e.jsx(n,{title:"ReviewState TypedDict for Critic Loop",language:"python",keyLine:4,keyNote:"revision_count is the circuit breaker that prevents infinite loops",children:u}),e.jsx("code",{children:"route_review"})," is the conditional edge function — pass it to ",e.jsx("code",{children:'graph.add_conditional_edges("critic", route_review)'}),"."]}),e.jsx(n,{title:"Writer, Critic, and Route Functions",language:"python",keyLine:8,keyNote:"route_review conditional edge drives the revision loop or exits",children:f}),e.jsx("h2",{children:"45.2 Google A2A Protocol"}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"A2A spec maturity — stable for HTTP, evolving for enterprise features"}),"A2A v1.0 was released in April 2025 and donated to the Linux Foundation in June 2025 — production-stable at the HTTP+SSE + OAuth2 + Agent Card level. The core task lifecycle (submitted → working → input-required → completed/failed) and Agent Card discovery are stable. 150+ org supporters (Google, MongoDB, SAP, Salesforce, Anthropic, Meta)."]}),e.jsx("pre",{style:{fontSize:"11px",background:"#1e1e2e",color:"#cdd6f4",padding:"10px",borderRadius:"4px",margin:"8px 0",overflowX:"auto"},children:A}),e.jsx("p",{children:"A2A (Agent2Agent) — open standard donated to Linux Foundation (June 2025). Defines how agents from different vendors discover, delegate, and exchange results."}),e.jsx(n,{title:"A2A Agent Card — Discovery Manifest",language:"json",keyLine:4,keyNote:"authentication block enforces OAuth2 before any skill is callable",children:y}),e.jsx(n,{title:"A2A Client — Streaming Task Submission",language:"python",keyLine:10,keyNote:"SSE line-by-line parse yields artifact chunks as they arrive",children:j}),e.jsx(n,{title:"Minimal A2A FastAPI Server",language:"python",keyLine:14,keyNote:"StreamingResponse with SSE media type enables live task updates",children:k}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Protocol"}),e.jsx("th",{children:"Scope"}),e.jsx("th",{children:"Transport"}),e.jsx("th",{children:"When to use"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"A2A"})}),e.jsx("td",{children:"Agent ↔ Agent (cross-org)"}),e.jsx("td",{children:"HTTP + SSE + OAuth2"}),e.jsx("td",{children:"Delegating to external agents from another vendor"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"MCP"})}),e.jsx("td",{children:"LLM ↔ Tools/Data"}),e.jsx("td",{children:"stdio / HTTP-SSE"}),e.jsx("td",{children:"Exposing local tools to any LLM host"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"LangGraph"})}),e.jsx("td",{children:"Intra-framework nodes"}),e.jsx("td",{children:"In-process"}),e.jsx("td",{children:"Multi-agent pipelines within your codebase"})]})]})}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"A2A input-required state — how to pause and resume an agent"}),e.jsx(n,{title:"A2A Server — input-required Pause and Resume",language:"python",keyLine:6,keyNote:"input-required state suspends stream; client replies via PUT /tasks/{id}",children:b})]}),e.jsx(p,{}),e.jsx("h2",{children:"45.3 Debugging with LangSmith"}),e.jsxs("p",{children:["LangSmith captures every function decorated with ",e.jsx("code",{children:"@traceable"})," as a ",e.jsx("strong",{children:"span"})," in a hierarchical trace. The outermost decorated function becomes the ",e.jsx("strong",{children:"root span"}),"; every LLM call and tool call inside it appears as a ",e.jsx("strong",{children:"child span"}),". Each span records its input arguments, output value, latency in ms, token count, and cost in USD."]}),e.jsxs("p",{children:["Reading a LangSmith trace is like reading a ",e.jsx("strong",{children:"browser network waterfall"}),": you see exactly which step took the most time, what data flowed in and out, and where the cost accumulated."]}),e.jsx("pre",{style:{fontSize:"11px",background:"#1e1e2e",color:"#cdd6f4",padding:"10px",borderRadius:"4px",margin:"8px 0",overflowX:"auto"},children:v}),e.jsx(n,{title:"LangSmith @traceable Setup",language:"python",keyLine:4,keyNote:"metadata version tag lets you diff traces across deployments",children:w}),e.jsxs("div",{className:"callout callout-warn",children:[e.jsx("strong",{children:"LangSmith cloud sends ALL trace data to Langchain's servers"}),"If your agent handles user PII (names, contact info, financial data), this violates GDPR and most enterprise data governance policies.",e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"Options for PII-safe tracing:"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Self-hosted LangSmith:"})," Docker/Kubernetes deployment in your VPC; data never leaves your infrastructure"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Langfuse (open-source):"})," full self-hosting, MIT license, same trace UI quality"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Sampling:"})," set ",e.jsx("code",{children:"LANGCHAIN_TRACING_SAMPLE_RATE=0.1"})," to trace 10% of requests; anonymise PII before logging the sample"]})]}),"For the Housing.com chatbot in production: user queries may contain names and phone numbers — use self-hosted Langfuse or 10% sampled traces with PII masking."]}),e.jsx("h2",{children:"45.4 LangGraph State Inspector & Studio"}),e.jsxs("p",{children:["When you compile a LangGraph graph with a checkpointer, it saves a complete snapshot of the state after ",e.jsx("strong",{children:"every node execution"})," — a replayable audit log. This is the same concept as ",e.jsx("strong",{children:"Redux DevTools time-travel"}),"."]}),e.jsx("p",{children:"Three things the API gives you:"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:e.jsx("code",{children:"app.get_state(config)"})})," — returns the current checkpoint. ",e.jsx("code",{children:"state.values"})," is the full state dict. ",e.jsx("code",{children:"state.next"})," is a tuple of node names that will execute on the next ",e.jsx("code",{children:"invoke()"})," call."]}),e.jsxs("li",{children:[e.jsx("strong",{children:e.jsx("code",{children:"app.get_state_history(config)"})})," — returns all past checkpoints for that ",e.jsx("code",{children:"thread_id"}),", newest first. Each snapshot has its own ",e.jsx("code",{children:"config"})," you can pass back to ",e.jsx("code",{children:"invoke()"})," to replay from that exact point."]}),e.jsxs("li",{children:[e.jsx("strong",{children:e.jsx("code",{children:"app.get_graph().draw_ascii()"})})," — prints the compiled graph structure. Run this whenever you add a new node to verify the edges connected the way you intended."]})]}),e.jsx(n,{title:"State Inspector and Time-Travel Replay",language:"python",keyLine:11,keyNote:"get_state_history lets you replay from any past checkpoint",children:S}),e.jsx(n,{title:"LangGraph Studio Dev Server",language:"bash",keyLine:2,keyNote:"langgraph dev launches the live graph inspector at localhost:8123",children:_}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"LangGraph Studio scope — dev tool only"}),"LangGraph Studio (",e.jsx("code",{children:"langgraph dev"}),") is a development tool that runs the graph in-process on your machine. It is NOT a production monitoring dashboard. For production: LangSmith traces + your custom ",e.jsx("code",{children:"monitor_node"})," decorator + Prometheus metrics.",e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"LangGraph parallel execution — superstep model:"})," When multiple edges fan into the same node, LangGraph waits for ALL incoming branches to complete before executing it. This is synchronised fan-in. Design parallel branches to have similar expected latency; otherwise your p95 is dominated by the slowest branch."]}),e.jsx("h2",{children:"45.5 Production Monitoring"}),e.jsx(n,{title:"Node Monitoring Decorator",language:"python",keyLine:8,keyNote:"log.info on success captures latency and token count per node",children:L}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Alert"}),e.jsx("th",{children:"Condition"}),e.jsx("th",{children:"Likely cause"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Node timeout"}),e.jsx("td",{children:"latency_ms > 10,000"}),e.jsx("td",{children:"LLM hung or tool timeout"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Loop detected"}),e.jsx("td",{children:"tool_calls_per_session > 50"}),e.jsx("td",{children:"Missing termination condition"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Cost spike"}),e.jsx("td",{children:"cost_per_run_usd > $0.10"}),e.jsx("td",{children:"Runaway agent or prompt bloat"})]})]})}),e.jsx("h2",{children:"45.6 Debugging Checklist"}),e.jsx(n,{title:"Agent Debugging Checklist",language:"text",keyLine:5,keyNote:"add_messages gotcha: return dict, never mutate state directly",children:T}),e.jsxs("div",{className:"callout callout-maang",children:[e.jsx("strong",{children:"🎯 MAANG Interview Connection"}),'"How do you debug an agent giving inconsistent results?" → LangSmith traces to find high-variance step. If routing: check conditional logic with state logging. If tool call: schema too ambiguous — tighten Field descriptions. If generation: add temperature=0 and structured output. For production: node-level latency alerts + loop detection on tool_calls_per_session.']}),e.jsx(h,{moduleId:45,title:"Module 45: Agent Teams, A2A & Debugging",contentHint:"Swarm emergent handoff Command goto update, fan-out parallel edges aggregator waits all branches, critic-revision bounded revision_count, A2A Agent Card well-known/agent.json skills, Task state machine submitted working input-required completed, HTTP SSE streaming TaskArtifactUpdateEvent, A2A vs MCP vs LangGraph scope and transport comparison, LangSmith traceable per-node cost latency, get_state time-travel checkpoint inspector, LangGraph Studio localhost:8123, node monitoring latency loop detection cost alerting, add_messages gotcha debugging checklist"})]})}export{I as Mod42};
