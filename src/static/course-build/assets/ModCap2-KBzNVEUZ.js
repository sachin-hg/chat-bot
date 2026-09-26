import{j as e,c as p,r as h}from"./index-D4pJPyGz.js";import{C as n}from"./CodeBlock-dJ_hHYfw.js";const x=[{name:"housing-chatbot/",type:"dir",indent:0},{name:"src/",type:"dir",indent:1},{name:"pipeline.py",type:"todo",indent:2,preview:`def build_graph(emit_sse, executor=None, llm=None, ...):
    graph = StateGraph(BotState)
    # TODO: register nodes
    # TODO: wire conditional edges`},{name:"classifier.py",type:"todo",indent:2,preview:`class ClassifierPort(Protocol):
    async def classify(self, text: str, ...) -> dict: ...
# TODO: implement SLM-based classifier
# TODO: return structured classification dict`},{name:"session.py",type:"todo",indent:2,preview:`class RedisSessionStore:
    # TODO: implement load(session_id) -> dict
    # TODO: implement save(session_id, data)
    # TODO: handle connection errors gracefully`},{name:"models.py",type:"provided",indent:2,preview:`class ChatRequest(BaseModel):
    conversation_id: str
    message_type: str
    content: dict
# Pydantic schemas — ready to use`},{name:"config.py",type:"provided",indent:2,preview:`class Settings(BaseSettings):
    bot_env: str = "mock"
    redis_url: str = "redis://localhost:6379"
# Load via: settings = Settings()`},{name:"tests/",type:"dir",indent:1},{name:"test_acceptance.py",type:"todo",indent:2,preview:`async def test_sse_stream_returns_connection_close(): ...
async def test_blocked_message_never_reaches_llm(): ...
# TODO: implement all 5 acceptance test cases
# Run with: pytest tests/test_acceptance.py -q`},{name:"test_fixtures.py",type:"provided",indent:2,preview:`@pytest.fixture
def mock_classifier(): return MagicMock(...)
@pytest.fixture
def base_state(): return BotState(raw_message="2BHK Mumbai", ...)`}];function u(){const[t,o]=h.useState(null);return e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0",border:"1px solid var(--border)",borderRadius:"8px",overflow:"hidden",fontFamily:"monospace",fontSize:"13px",minHeight:"260px"},children:[e.jsxs("div",{style:{background:"var(--surface)",borderRight:"1px solid var(--border)",padding:"12px 0",overflowY:"auto"},children:[e.jsx("div",{style:{padding:"4px 12px 8px",fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--muted)",borderBottom:"1px solid var(--border)",marginBottom:"4px"},children:"Project Structure"}),x.map((s,c)=>{const i=s.type==="dir",l=i?"📁":s.type==="todo"?"⚠️":"✅",d=i?"inherit":s.type==="todo"?"var(--accent3, #f38ba8)":"var(--muted)",a=(t==null?void 0:t.name)===s.name;return e.jsxs("div",{onClick:()=>!i&&o(s),style:{display:"flex",alignItems:"center",gap:"6px",padding:"5px 12px",paddingLeft:`${12+s.indent*16}px`,cursor:i?"default":"pointer",background:a?"var(--accent-bg, rgba(137,180,250,0.12))":"transparent",borderLeft:a?"2px solid var(--accent)":"2px solid transparent",color:d,transition:"background 0.1s"},children:[e.jsx("span",{style:{fontSize:"12px",lineHeight:1},children:l}),e.jsx("span",{children:s.name}),s.type==="todo"&&e.jsx("span",{style:{marginLeft:"auto",fontSize:"9px",background:"var(--accent3, #f38ba8)",color:"#1e1e2e",padding:"1px 5px",borderRadius:"3px",fontWeight:700,letterSpacing:"0.05em"},children:"TODO"})]},c)})]}),e.jsx("div",{style:{background:"var(--code-bg, #1e1e2e)",padding:"16px",display:"flex",flexDirection:"column",justifyContent:t?"flex-start":"center",alignItems:t?"flex-start":"center"},children:t?e.jsxs(e.Fragment,{children:[e.jsxs("div",{style:{fontSize:"11px",color:"var(--muted)",marginBottom:"10px",display:"flex",alignItems:"center",gap:"8px"},children:[e.jsx("span",{children:t.name}),t.type==="todo"?e.jsx("span",{style:{background:"var(--accent3, #f38ba8)",color:"#1e1e2e",padding:"1px 5px",borderRadius:"3px",fontSize:"9px",fontWeight:700},children:"TODO"}):e.jsx("span",{style:{background:"var(--accent2, #a6e3a1)",color:"#1e1e2e",padding:"1px 5px",borderRadius:"3px",fontSize:"9px",fontWeight:700},children:"PROVIDED"})]}),e.jsx("pre",{style:{margin:0,fontSize:"12px",lineHeight:1.7,color:t.type==="todo"?"var(--accent3, #f38ba8)":"var(--muted)",whiteSpace:"pre-wrap"},children:t.preview})]}):e.jsx("span",{style:{color:"var(--muted)",fontSize:"12px"},children:"← Click a file to preview"})})]})}const g=`from typing import TypedDict, Optional

class BotState(TypedDict):
    raw_message: str
    session_id: str
    session: dict
    domain: Optional[str]
    classification: Optional[dict]
    pre_fetched_data: Optional[dict]
    bot_response: Optional[str]
    request_id: str
    # Metadata tracked by pipeline
    tier: Optional[int]           # 0 | 1 | 2 | 3
    blocked: Optional[bool]
    error: Optional[str]`,m=`from langgraph.graph import StateGraph, END
from src.pipeline.state import BotState

def build_graph(emit_sse, executor=None, llm=None, classifier=None, router=None):
    graph = StateGraph(BotState)

    # Register your nodes
    graph.add_node("safety_node",   safety_node)
    graph.add_node("route_node",    route_node)
    graph.add_node("classify_node", classify_node)
    graph.add_node("tool_node",     tool_node)
    graph.add_node("response_node", response_node)

    graph.set_entry_point("safety_node")

    # TODO: Fill in these conditional edges
    graph.add_conditional_edges("safety_node",   ...)
    graph.add_conditional_edges("route_node",    ...)
    graph.add_conditional_edges("classify_node", ...)

    graph.add_edge("tool_node",     "response_node")
    graph.add_edge("response_node", END)

    return graph.compile()`,f=`import pytest
from unittest.mock import AsyncMock, MagicMock
from src.pipeline.nodes.classify import classify_node
from src.pipeline.state import BotState

@pytest.mark.asyncio
async def test_classify_property_search():
    mock_classifier = MagicMock()
    mock_classifier.classify = AsyncMock(return_value={
        "main_intent": "property_search",
        "sub_intent": "filter_search",
        "filter_delta": {"bhk": 2, "city": "Mumbai"},
        "entities_mentioned": [],
        "clarification_needed": None,
        "pivot": False,
        "multi_intent": False,
    })

    state: BotState = {
        "raw_message": "2BHK in Mumbai under 2Cr",
        "session_id": "test-session",
        "session": {},
        "domain": "property_search",
        "classification": None,
        "pre_fetched_data": None,
        "bot_response": None,
        "request_id": "test-req-1",
        "tier": None, "blocked": None, "error": None,
    }

    result = await classify_node(state, classifier=mock_classifier)
    assert result["classification"]["main_intent"] == "property_search"
    assert result["classification"]["filter_delta"]["bhk"] == 2`,y=`# Acceptance test 1: SSE streaming end-to-end
async def test_sse_stream_returns_connection_close():
    async with AsyncClient(app=app, base_url="http://test") as client:
        async with client.stream("POST", "/api/v1/chat/send-message-streamed",
                                  json={"conversation_id": "x", "message_type": "text",
                                        "content": {"text": "hello"}},
                                  headers={"X-Session-Token": "test"}) as resp:
            events = []
            async for line in resp.aiter_lines():
                if line.startswith("event:"):
                    events.append(line.split(":", 1)[1].strip())
            assert "connection_ack" in events
            assert "connection_close" in events

# Acceptance test 2: safety short-circuit
async def test_blocked_message_never_reaches_llm():
    mock_llm.stream = AsyncMock()  # should NOT be called
    resp = await client.post("/api/v1/chat/send-message-streamed",
                              json={"message_type": "text", "content": {"text": "NSFW content"}},
                              headers={"X-Session-Token": "test"})
    mock_llm.stream.assert_not_called()`,r=t=>({border:`2px solid ${t}`,borderRadius:"10px",padding:"20px",display:"flex",flexDirection:"column",gap:"10px"});function j(){return e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"16px",margin:"8px 0"},children:[e.jsxs("div",{style:r("var(--border)"),children:[e.jsx("div",{style:{fontSize:"28px",fontWeight:800,color:"var(--muted)",lineHeight:1},children:"L3"}),e.jsx("div",{style:{fontWeight:700,fontSize:"15px"},children:"Working System"}),e.jsxs("ul",{style:{margin:0,paddingLeft:"18px",lineHeight:1.7,fontSize:"13px",color:"var(--muted)"},children:[e.jsx("li",{children:"All 5 nodes run without crashing"}),e.jsx("li",{children:"SSE streaming returns at least one event"}),e.jsx("li",{children:"3 of 5 acceptance tests pass"}),e.jsx("li",{children:"Some adapter coupling (direct imports OK at this level)"})]})]}),e.jsxs("div",{style:r("var(--accent)"),children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"10px"},children:[e.jsx("div",{style:{fontSize:"28px",fontWeight:800,color:"var(--accent)",lineHeight:1},children:"L4"}),e.jsx("span",{style:{background:"var(--accent)",color:"#1e1e2e",fontSize:"10px",fontWeight:700,padding:"2px 8px",borderRadius:"4px",letterSpacing:"0.06em"},children:"TARGET"})]}),e.jsx("div",{style:{fontWeight:700,fontSize:"15px"},children:"Production Ready"}),e.jsxs("ul",{style:{margin:0,paddingLeft:"18px",lineHeight:1.7,fontSize:"13px"},children:[e.jsx("li",{children:"All 5 acceptance tests pass"}),e.jsx("li",{children:"Adapter pattern with Protocol classes"}),e.jsx("li",{children:"Safety short-circuit proven by test"}),e.jsx("li",{children:"1 unit test per pipeline node (5 total)"}),e.jsxs("li",{children:["Can explain every line of ",e.jsx("code",{children:"build_graph()"})]})]})]}),e.jsxs("div",{style:r("var(--accent2)"),children:[e.jsx("div",{style:{fontSize:"28px",fontWeight:800,color:"var(--accent2)",lineHeight:1},children:"L5"}),e.jsx("div",{style:{fontWeight:700,fontSize:"15px"},children:"Senior Engineer"}),e.jsxs("ul",{style:{margin:0,paddingLeft:"18px",lineHeight:1.7,fontSize:"13px"},children:[e.jsx("li",{children:"try/finally around LLM gate in endpoint"}),e.jsx("li",{children:"Structured logging with request_id on every log line"}),e.jsx("li",{children:"Session load failure handled — falls back to empty session"}),e.jsx("li",{children:"Integration test covers queue.get timeout path"}),e.jsx("li",{children:"RAGAS CI gate: faithfulness ≥ 0.85 in pipeline"})]})]})]})}function b(){return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"learning-obj",children:[e.jsx("div",{className:"learning-obj-title",children:"Act 2 Capstone Project"}),e.jsxs("ol",{children:[e.jsx("li",{children:"Build the full 5-node LangGraph pipeline from scratch: safety → route → classify → tools → response"}),e.jsx("li",{children:"Wire FastAPI SSE streaming with asyncio.Queue so clients receive real-time pipeline events"}),e.jsx("li",{children:"Implement the adapter pattern so the pipeline has no direct LLM or API dependencies"}),e.jsx("li",{children:"Write unit tests for each node (mocked adapters) and an integration test for the SSE stream"}),e.jsx("li",{children:"Pass all 5 acceptance criteria at L4 level"})]}),e.jsxs("div",{className:"obj-meta",children:[e.jsx("span",{className:"obj-time",children:"⏱ ~4–8 hours"}),e.jsx("span",{className:"obj-diff",children:"Difficulty: ★★★★☆"}),e.jsx("span",{className:"obj-diff",children:"Prerequisites: Modules 6–10 (complete Act 2)"})]})]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"This is a project module — no quiz."}),e.jsx("br",{}),"Complete it, run the acceptance tests, and self-assess against the rubric. Post your solution in the community channel for peer review. The goal is not a perfect implementation but a working, testable pipeline that you can explain end-to-end."]}),e.jsx("h2",{children:"Project Brief"}),e.jsxs("p",{children:["You are a new engineer at Housing.com. Your task: build the core chatbot pipeline for the property search domain — the path a user message takes from ",e.jsx("code",{children:"POST /send-message-streamed"})," to an SSE response. You start from a skeleton project (see Starter Code below). The tests and acceptance criteria are already written. Your job is to fill in the implementation."]}),e.jsxs("p",{children:["When complete, a user message like ",e.jsx("em",{children:'"2BHK in Bandra under 2Cr"'})," should flow through your pipeline and return a streamed SSE response with a ",e.jsx("code",{children:"connection_ack"}),", at least one ",e.jsx("code",{children:"pipeline_step"}),", a",e.jsx("code",{children:"message_delta"})," chunk, and a ",e.jsx("code",{children:"connection_close"}),"."]}),e.jsx("h2",{children:"Requirements (6 items)"}),e.jsxs("ol",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"BotState TypedDict"})," — define in ",e.jsx("code",{children:"src/pipeline/state.py"}),". Must include: ",e.jsx("code",{children:"raw_message"}),", ",e.jsx("code",{children:"session_id"}),", ",e.jsx("code",{children:"session"}),", ",e.jsx("code",{children:"domain"}),",",e.jsx("code",{children:"classification"}),", ",e.jsx("code",{children:"pre_fetched_data"}),", ",e.jsx("code",{children:"bot_response"}),", ",e.jsx("code",{children:"request_id"}),",",e.jsx("code",{children:"tier"}),", ",e.jsx("code",{children:"blocked"}),", ",e.jsx("code",{children:"error"}),"."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"5 pipeline nodes"})," — one function per file in ",e.jsx("code",{children:"src/pipeline/nodes/"}),". Each node must accept ",e.jsx("code",{children:"state: BotState"}),", receive adapters via dependency injection (default ",e.jsx("code",{children:"None"}),"), and return a partial state dict. No node may import an adapter class directly."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"LangGraph StateGraph"})," — ",e.jsx("code",{children:"build_graph()"})," in ",e.jsx("code",{children:"src/pipeline/graph.py"}),"must wire all 5 nodes with appropriate conditional edges. The graph must short-circuit on blocked messages (never reach ",e.jsx("code",{children:"classify_node"})," or beyond)."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"SSE streaming"})," — ",e.jsx("code",{children:"send_message_streamed"})," endpoint must return a",e.jsx("code",{children:"StreamingResponse"})," with ",e.jsx("code",{children:'media_type="text/event-stream"'}),". Pipeline runs as an ",e.jsx("code",{children:"asyncio.create_task()"}),"; frames are queued via ",e.jsx("code",{children:"asyncio.Queue"}),"."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Adapter protocol"})," — define ",e.jsx("code",{children:"LLMPort"})," and ",e.jsx("code",{children:"ClassifierPort"})," as Python",e.jsx("code",{children:"Protocol"})," classes. Provide a ",e.jsx("code",{children:"MockLLM"})," adapter that returns a hardcoded response without making any API calls. All tests must pass with ",e.jsx("code",{children:"BOT_ENV=mock"}),"."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Tests"})," — at minimum: 1 unit test per node (5 total), 1 SSE streaming integration test, 1 test verifying the safety short-circuit. All tests must pass with ",e.jsx("code",{children:"pytest -q"}),"."]})]}),e.jsx("h2",{children:"Starter Code Scaffold"}),e.jsx(u,{}),e.jsx(n,{title:"BotState TypedDict — Pipeline State Shape",language:"python",keyLine:12,keyNote:"tier encodes safety/routing level, not just a counter",children:g}),e.jsxs("p",{children:["Skeleton ",e.jsx("code",{children:"build_graph()"})," — fill in the conditional edges:"]}),e.jsx(n,{title:"LangGraph Graph Skeleton — Wire Nodes and Edges",language:"python",keyLine:17,keyNote:"Safety edge fires first — wrong order breaks short-circuit",children:m}),e.jsx("h2",{children:"5 Acceptance Test Cases"}),e.jsx(n,{title:"Acceptance Tests — SSE End-to-End and Safety Short-Circuit",language:"python",keyLine:20,keyNote:"assert_not_called proves the LLM gate was never opened",children:y}),e.jsxs("ol",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"SSE stream returns connection_close"})," — every request, no matter what, must terminate with ",e.jsx("code",{children:"connection_close"}),"."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Safety short-circuit"})," — a blocked message must never invoke the LLM adapter."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Classification output"})," — a property query produces a ",e.jsx("code",{children:"classification"})," dict with ",e.jsx("code",{children:'main_intent = "property_search"'}),"."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Filter delta applied to session"})," — after classification with ",e.jsxs("code",{children:["filter_delta: ","{bhk: 2}"]}),", the session must contain ",e.jsx("code",{children:"active_filters.bhk = 2"}),"."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Mock mode works"})," — with ",e.jsx("code",{children:"BOT_ENV=mock"}),", the full pipeline runs and returns a non-empty ",e.jsx("code",{children:"bot_response"})," without any real API calls."]})]}),e.jsx("h2",{children:"Rubric — What Level Are You At?"}),e.jsx(j,{}),e.jsx("h2",{children:"Solution Walkthrough — Key Architectural Decisions"}),e.jsx("div",{className:"callout callout-info",children:e.jsx("strong",{children:"Only read this after attempting the project."})}),e.jsxs("ol",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Why asyncio.Queue, not await directly?"})," LangGraph calls node functions synchronously from its perspective. To emit SSE frames mid-pipeline without blocking LangGraph, nodes call ",e.jsx("code",{children:"queue.put_nowait()"})," (sync, non-blocking). The FastAPI generator ",e.jsx("code",{children:"await queue.get()"}),"s independently. The two coroutines run concurrently under asyncio."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Why Protocol, not ABC?"})," Protocol enables structural subtyping — any object with a ",e.jsx("code",{children:"classify()"})," method satisfies ",e.jsx("code",{children:"ClassifierPort"})," without explicitly inheriting it. This means tests can pass a plain ",e.jsx("code",{children:"MagicMock"})," with the right method names without any special setup."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Conditional edge for safety"})," — the ",e.jsx("code",{children:"safety_node"})," returns ",e.jsxs("code",{children:["{",'"blocked": True',"}"]})," on unsafe input. The routing function checks ",e.jsx("code",{children:'state.get("blocked")'}),"; if True, routes to ",e.jsx("code",{children:"END"})," (short-circuit). No LLM call happens."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Partial state updates"}),' — each node returns only the keys it "owns." LangGraph merges these updates onto the existing state. A node that returns ',e.jsxs("code",{children:["{",'"',"}"]})," (empty dict) is valid — it just doesn't change anything."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Where session saving happens"})," — the ",e.jsx("code",{children:"response_node"})," saves the updated session back to Redis after generating the response. This is the only node that writes to Redis (single responsibility). If it crashes after generating but before saving, the session state is lost for that turn — an acceptable tradeoff for simplicity at this stage."]})]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"Unit test example"}),e.jsx(n,{title:"Classify Node Unit Test — Mocked Classifier Injection",language:"python",keyLine:9,keyNote:"AsyncMock lets you await classify() without a real LLM call",children:f})]}),e.jsxs("div",{style:{border:"2px solid var(--accent2)",borderRadius:"12px",padding:"24px",textAlign:"center",marginTop:"32px"},children:[e.jsx("div",{style:{fontSize:"22px",fontWeight:800,color:"var(--accent2)",marginBottom:"8px"},children:"Act 2 Complete"}),e.jsx("p",{style:{color:"var(--muted)",margin:"0 0 20px",fontSize:"14px",lineHeight:1.6},children:"You built the full 5-node LangGraph pipeline, wired SSE streaming with asyncio.Queue, implemented the adapter pattern with Protocol classes, and wrote unit + acceptance tests. That is a production-grade chatbot backend from scratch."}),e.jsx("button",{style:{background:"var(--accent2)",color:"#1e1e2e",border:"none",borderRadius:"8px",padding:"12px 28px",fontSize:"15px",fontWeight:700,cursor:"pointer"},onClick:()=>{p({particleCount:120,spread:80,origin:{y:.6},colors:["#89b4fa","#a6e3a1","#f9e2af","#cba6f7","#fab387"]}),localStorage.setItem("act2_complete","true")},children:"Mark Act 2 Complete"})]})]})}export{b as ModCap2};
