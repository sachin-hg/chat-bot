import{j as e,r as h}from"./index-D4pJPyGz.js";import{Q as m}from"./QuizSection-BedG7s-t.js";import{F as n}from"./index-CkrOxeew.js";import{C as o}from"./CodeBlock-dJ_hHYfw.js";function u(){const[t,a]=h.useState(null),i=[{name:"search_properties",color:"#89b4fa",x:310,y:90},{name:"calculate_emi",color:"#a6e3a1",x:310,y:138},{name:"filter_properties",color:"#cba6f7",x:310,y:186}];return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"TOOLNODE INTERNAL DISPATCH — LLM → TOOLS → RESULTS"}),e.jsx("div",{style:{marginBottom:"10px",fontSize:"0.78rem",color:"#bac2de"},children:"Hover a tool to highlight the dispatch path."}),e.jsxs("svg",{viewBox:"0 0 580 220",width:"100%",style:{display:"block",margin:"0 auto"},"aria-label":"ToolNode internal dispatch flow diagram",children:[e.jsx("style",{children:"@keyframes dashFlow39{to{stroke-dashoffset:-14}}"}),e.jsxs("defs",{children:[e.jsx("marker",{id:"ar39b",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#89b4fa"})}),e.jsx("marker",{id:"ar39g",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#a6e3a1"})}),e.jsx("marker",{id:"ar39p",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#cba6f7"})}),e.jsx("marker",{id:"ar39t",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#94e2d5"})}),e.jsx("marker",{id:"ar39w",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#45475a"})})]}),e.jsx("rect",{x:"10",y:"118",width:"90",height:"40",rx:"6",fill:"#313244",stroke:"#89b4fa",strokeWidth:"1.5"}),e.jsx("text",{x:"55",y:"135",textAnchor:"middle",fontSize:"11",fill:"#cdd6f4",children:"LLM"}),e.jsx("text",{x:"55",y:"150",textAnchor:"middle",fontSize:"9",fill:"#6c7086",children:"AIMessage"}),e.jsx("rect",{x:"10",y:"10",width:"200",height:"52",rx:"6",fill:"#1e1e2e",stroke:"#313244"}),e.jsx("text",{x:"20",y:"26",fontSize:"9",fill:"#6c7086",children:"tool_calls: ["}),e.jsxs("text",{x:"24",y:"40",fontSize:"9",fill:"#89b4fa",children:["{",'"name":"search","args":',"{",'q:"…"',"}","}"]}),e.jsxs("text",{x:"24",y:"54",fontSize:"9",fill:"#a6e3a1",children:["{",'"name":"calc_emi","args":',"{","…","}","}"]}),e.jsx("text",{x:"20",y:"66",fontSize:"9",fill:"#6c7086",children:"]"}),e.jsx("line",{x1:"110",y1:"43",x2:"110",y2:"118",stroke:"#45475a",strokeWidth:"1",strokeDasharray:"3 3"}),e.jsx("line",{x1:"100",y1:"138",x2:"172",y2:"138",stroke:"#89b4fa",strokeWidth:"1.5",markerEnd:"url(#ar39b)"}),e.jsx("rect",{x:"172",y:"100",width:"120",height:"76",rx:"6",fill:"#89b4fa22",stroke:"#89b4fa",strokeWidth:"1.5"}),e.jsx("text",{x:"232",y:"122",textAnchor:"middle",fontSize:"11",fontWeight:"700",fill:"#89b4fa",children:"ToolNode"}),e.jsx("text",{x:"232",y:"138",textAnchor:"middle",fontSize:"9",fill:"#bac2de",children:"asyncio.gather()"}),e.jsx("text",{x:"232",y:"152",textAnchor:"middle",fontSize:"9",fill:"#6c7086",children:"parallel dispatch"}),e.jsx("text",{x:"232",y:"166",textAnchor:"middle",fontSize:"9",fill:"#6c7086",children:"→ all tool calls at once"}),i.map(r=>{const s=t===r.name,p={"#89b4fa":"url(#ar39b)","#a6e3a1":"url(#ar39g)","#cba6f7":"url(#ar39p)"};return e.jsx("line",{x1:"292",y1:r.y+12,x2:r.x,y2:r.y+12,stroke:s?r.color:"#45475a",strokeWidth:s?2:1.2,strokeDasharray:s?"4 3":void 0,style:s?{animation:"dashFlow39 0.8s linear infinite"}:{},markerEnd:s?p[r.color]:"url(#ar39w)"},r.name)}),i.map(r=>{const s=t===r.name;return e.jsxs("g",{onMouseEnter:()=>a(r.name),onMouseLeave:()=>a(null),style:{cursor:"pointer"},children:[e.jsx("rect",{x:r.x,y:r.y,width:"148",height:"26",rx:"6",fill:s?r.color+"22":"#313244",stroke:s?r.color:"#45475a",strokeWidth:s?1.5:1}),e.jsx("text",{x:r.x+74,y:r.y+17,textAnchor:"middle",fontSize:"10",fill:s?r.color:"#bac2de",children:r.name})]},r.name)}),e.jsx("rect",{x:"468",y:"100",width:"100",height:"76",rx:"6",fill:"#94e2d522",stroke:"#94e2d5",strokeWidth:"1.2"}),e.jsx("text",{x:"518",y:"122",textAnchor:"middle",fontSize:"10",fontWeight:"700",fill:"#94e2d5",children:"ToolMessage"}),e.jsx("text",{x:"518",y:"138",textAnchor:"middle",fontSize:"9",fill:"#bac2de",children:"content: result"}),e.jsx("text",{x:"518",y:"152",textAnchor:"middle",fontSize:"9",fill:"#6c7086",children:"tool_call_id:"}),e.jsx("text",{x:"518",y:"165",textAnchor:"middle",fontSize:"9",fill:"#6c7086",children:'"tc_abc123"'}),i.map(r=>e.jsx("line",{x1:r.x+148,y1:r.y+12,x2:"468",y2:r.y+12,stroke:"#94e2d5",strokeWidth:"1",strokeDasharray:"3 2",markerEnd:"url(#ar39t)"},r.name+"r")),e.jsx("path",{d:"M518,176 Q518,200 55,200 Q55,180 55,158",stroke:"#89b4fa",strokeWidth:"1.5",fill:"none",markerEnd:"url(#ar39b)"}),e.jsx("text",{x:"290",y:"212",textAnchor:"middle",fontSize:"9",fill:"#6c7086",children:"results added to messages → LLM continues"})]})]})}function g(){const[t,a]=h.useState(null);return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"HUMAN-IN-THE-LOOP — INTERRUPT, REVIEW, RESUME"}),e.jsxs("div",{style:{marginBottom:"10px",display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"},children:[e.jsx("span",{style:{color:"#bac2de",fontSize:"0.82rem"},children:"Simulate decision:"}),e.jsx("button",{onClick:()=>a("approve"),style:{background:t==="approve"?"#89b4fa22":"#313244",color:t==="approve"?"#89b4fa":"#cdd6f4",border:t==="approve"?"1px solid #89b4fa":"1px solid #45475a",borderRadius:"6px",padding:"5px 12px",fontSize:"0.78rem",cursor:"pointer",marginRight:"8px"},children:"Approve"}),e.jsx("button",{onClick:()=>a("edit"),style:{background:t==="edit"?"#89b4fa22":"#313244",color:t==="edit"?"#89b4fa":"#cdd6f4",border:t==="edit"?"1px solid #89b4fa":"1px solid #45475a",borderRadius:"6px",padding:"5px 12px",fontSize:"0.78rem",cursor:"pointer",marginRight:"8px"},children:"Edit & Inject"}),e.jsx("button",{onClick:()=>a(null),style:{background:"#313244",color:"#cdd6f4",border:"1px solid #45475a",borderRadius:"6px",padding:"5px 12px",fontSize:"0.78rem",cursor:"pointer",marginRight:"8px"},children:"Reset"})]}),e.jsxs("svg",{viewBox:"0 0 560 180",width:"100%",style:{display:"block",margin:"0 auto"},"aria-label":"HITL interrupt review resume timeline",children:[e.jsx("style",{children:"@keyframes dashFlow39h{to{stroke-dashoffset:-14}}"}),e.jsxs("defs",{children:[e.jsx("marker",{id:"ar39hb",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#89b4fa"})}),e.jsx("marker",{id:"ar39hy",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#f9e2af"})}),e.jsx("marker",{id:"ar39hg",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#a6e3a1"})}),e.jsx("marker",{id:"ar39hp",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#fab387"})})]}),e.jsx("rect",{x:"10",y:"20",width:"120",height:"50",rx:"6",fill:"#89b4fa22",stroke:"#89b4fa",strokeWidth:"1.5"}),e.jsx("text",{x:"70",y:"42",textAnchor:"middle",fontSize:"11",fill:"#89b4fa",children:"Graph running"}),e.jsx("text",{x:"70",y:"58",textAnchor:"middle",fontSize:"9",fill:"#bac2de",children:"app.invoke(input)"}),e.jsx("line",{x1:"130",y1:"45",x2:"168",y2:"45",stroke:"#f9e2af",strokeWidth:"1.5",markerEnd:"url(#ar39hy)"}),e.jsx("rect",{x:"168",y:"20",width:"150",height:"50",rx:"6",fill:"#f9e2af22",stroke:"#f9e2af",strokeWidth:"1.5"}),e.jsx("text",{x:"200",y:"42",textAnchor:"middle",fontSize:"14",fill:"#f9e2af",children:"⏸"}),e.jsx("text",{x:"260",y:"38",textAnchor:"middle",fontSize:"10",fill:"#f9e2af",children:"PAUSED"}),e.jsx("text",{x:"243",y:"55",textAnchor:"middle",fontSize:"9",fill:"#bac2de",children:'interrupt_before=["tools"]'}),e.jsx("line",{x1:"318",y1:"45",x2:"354",y2:"45",stroke:"#f9e2af",strokeWidth:"1.5",markerEnd:"url(#ar39hy)"}),e.jsx("rect",{x:"354",y:"20",width:"140",height:"50",rx:"6",fill:"#fab38722",stroke:"#fab387",strokeWidth:"1.2"}),e.jsx("text",{x:"424",y:"37",textAnchor:"middle",fontSize:"10",fontWeight:"700",fill:"#fab387",children:"Human Review"}),e.jsx("text",{x:"424",y:"51",textAnchor:"middle",fontSize:"9",fill:"#bac2de",children:"pending tool call:"}),e.jsx("text",{x:"424",y:"63",textAnchor:"middle",fontSize:"9",fill:"#6c7086",children:"execute_purchase(id=456)"}),e.jsx("rect",{x:"200",y:"126",width:"160",height:"40",rx:"6",fill:t?"#a6e3a122":"#1e1e2e",stroke:t?"#a6e3a1":"#313244",strokeWidth:t?1.5:1}),e.jsx("text",{x:"280",y:"144",textAnchor:"middle",fontSize:"11",fill:t?"#a6e3a1":"#6c7086",children:t?"Graph Resumed":"Awaiting decision…"}),e.jsx("text",{x:"280",y:"158",textAnchor:"middle",fontSize:"9",fill:t?"#bac2de":"#6c7086",children:t==="approve"?"Command(resume=None)":t==="edit"?"Command(update={…})":""}),t==="approve"&&e.jsx("path",{d:"M424,70 Q424,106 360,126",stroke:"#a6e3a1",strokeWidth:"1.5",fill:"none",strokeDasharray:"4 3",style:{animation:"dashFlow39h 0.8s linear infinite"},markerEnd:"url(#ar39hg)"}),t==="approve"&&e.jsx("text",{x:"450",y:"100",fontSize:"9",fill:"#a6e3a1",children:"Approve"}),t==="edit"&&e.jsx("path",{d:"M354,60 Q300,90 280,126",stroke:"#fab387",strokeWidth:"1.5",fill:"none",strokeDasharray:"4 3",style:{animation:"dashFlow39h 0.8s linear infinite"},markerEnd:"url(#ar39hp)"}),t==="edit"&&e.jsx("text",{x:"290",y:"100",fontSize:"9",fill:"#fab387",children:"Edit + inject Command"}),!t&&e.jsxs(e.Fragment,{children:[e.jsx("path",{d:"M424,70 Q424,106 360,126",stroke:"#45475a",strokeWidth:"1",fill:"none",strokeDasharray:"3 3",markerEnd:"url(#ar39hb)"}),e.jsx("text",{x:"448",y:"96",fontSize:"9",fill:"#45475a",children:"Approve"}),e.jsx("path",{d:"M354,60 Q300,90 280,126",stroke:"#45475a",strokeWidth:"1",fill:"none",strokeDasharray:"3 3",markerEnd:"url(#ar39hb)"}),e.jsx("text",{x:"287",y:"98",fontSize:"9",fill:"#45475a",children:"Edit"})]}),e.jsx("text",{x:"70",y:"100",textAnchor:"middle",fontSize:"9",fill:"#94e2d5",children:"state → checkpointer"}),e.jsx("line",{x1:"70",y1:"70",x2:"70",y2:"92",stroke:"#94e2d5",strokeWidth:"1",strokeDasharray:"2 2"})]}),t&&e.jsx("div",{style:{marginTop:"8px",fontFamily:"monospace",fontSize:"0.78rem",color:t==="approve"?"#a6e3a1":"#fab387",background:"#1e1e2e",border:"1px solid #313244",borderRadius:"6px",padding:"8px 12px"},children:t==="approve"?"app.invoke(Command(resume=None), config)  # → graph continues from interrupt point":'app.invoke(Command(update={"messages": [HumanMessage("Rejected.")]}), config)'})]})}const x=`from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages

# Conversational agent — add_messages APPENDS (never replaces)
class ChatState(TypedDict):
    messages: Annotated[list, add_messages]

# Pipeline — typed fields per stage
class PipelineState(TypedDict):
    query: str
    retrieved_docs: list[dict]
    generated_answer: str
    error: str | None

# GOTCHA: without add_messages
state["messages"] = [new_msg]   # REPLACES history — loses all prior turns
# WITH add_messages:
return {"messages": [new_msg]}  # APPENDS — correct`,f=`def intent_node(state: AgentState) -> dict:
    intent = classify_intent(state["messages"][-1].content)
    return {"intent": intent}  # return only fields you changed

def llm_node(state: AgentState) -> dict:
    response = llm_with_tools.invoke([
        SystemMessage(content="You are a housing assistant."),
        *state["messages"],
    ])
    return {"messages": [response]}

def tool_executor_node(state: AgentState) -> dict:
    call = state["messages"][-1].tool_calls[0]
    result = execute_tool(call["name"], call["args"])
    return {"messages": [ToolMessage(content=str(result), tool_call_id=call["id"])]}

# Async node (for I/O-bound operations)
async def async_search_node(state: AgentState) -> dict:
    results = await asyncio.gather(*[search(q) for q in state["queries"]])
    return {"retrieved_docs": list(results)}`,l=`from langgraph.graph import StateGraph, START, END
from typing import Literal

graph = StateGraph(AgentState)
graph.add_node("intent", intent_node)
graph.add_node("llm",    llm_node)
graph.add_node("tools",  tool_executor_node)

graph.add_edge(START,   "intent")   # entry
graph.add_edge("intent","llm")      # always
graph.add_edge("tools", "llm")      # loop back after tool exec

def route_after_llm(state: AgentState) -> Literal["tools", "__end__"]:
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return "__end__"

graph.add_conditional_edges("llm", route_after_llm, {"tools": "tools", "__end__": END})`,_=`from langchain_core.tools import tool
from pydantic import BaseModel, Field

@tool
def search_properties(query: str, max_results: int = 5) -> list[dict]:
    """Search property listings by natural language query.
    Args:
        query: Natural language description of desired property
        max_results: Maximum number of results to return
    """
    return property_db.search(query, limit=max_results)

# Typed schema (preferred for complex inputs)
class FilterInput(BaseModel):
    city: str      = Field(description="City name, e.g. 'Mumbai'")
    bedrooms: int  = Field(ge=1, le=10)
    max_price: int = Field(description="Price in INR")

@tool(args_schema=FilterInput)
def filter_properties(city: str, bedrooms: int, max_price: int) -> list[dict]:
    """Filter property listings by specific criteria."""
    return property_db.filter(city=city, bedrooms=bedrooms, max_price=max_price)

# Bind tools to LLM — LLM's JSON schema is auto-generated from type hints
llm_with_tools = llm.bind_tools([search_properties, filter_properties])`,d=`from langgraph.prebuilt import ToolNode, tools_condition

tools     = [search_properties, filter_properties, calculate_emi]
tool_node = ToolNode(tools)

# ToolNode execution flow — what happens inside each call:
#
# 1. Read  last_msg = state["messages"][-1]
# 2. Assert isinstance(last_msg, AIMessage) and last_msg.tool_calls is not None
# 3. For each tool_call in last_msg.tool_calls:  ← may be 1..N calls at once
#    a. name = tool_call["name"]           →  "search_properties"
#    b. args = tool_call["args"]           →  {"query": "3BHK Bandra", "max_results": 5}
#    c. id   = tool_call["id"]             →  "tc_abc123"  (must echo back in ToolMessage)
#    d. Resolve tool from registry by name →  search_properties function object
#    e. Validate args via args_schema      →  Pydantic validation; error → ToolMessage(error)
#    f. Call tool.invoke(args)             →  [{"id": "P1001", "price": "₹2.5Cr", ...}]
#    g. Wrap: ToolMessage(content=str(result), tool_call_id=id)
# 4. Return {"messages": [ToolMessage_1, ToolMessage_2, ...]}
#    └─ add_messages reducer APPENDS all ToolMessages at once

# tools_condition: the routing function that goes AFTER the LLM node
# last = state["messages"][-1]
# if hasattr(last, "tool_calls") and last.tool_calls:  →  return "tools"
# else:                                                 →  return END

# Standard ReAct wiring:
graph.add_node("llm",   llm_node)
graph.add_node("tools", tool_node)
graph.add_conditional_edges("llm", tools_condition)
graph.add_edge("tools", "llm")     # always loop back — LLM decides when to stop`,y=`# LLMs can request MULTIPLE tools in a SINGLE AIMessage response.
# ToolNode handles all of them in parallel (asyncio.gather for async tools).

# When the user asks: "Find 3BHK in Bandra AND calculate EMI at 8.5% for 2Cr"
# The LLM produces ONE AIMessage with TWO tool_calls:
#
# AIMessage(
#   content="",
#   tool_calls=[
#     {"name": "search_properties", "args": {"query": "3BHK Bandra"}, "id": "tc_001"},
#     {"name": "calculate_emi",     "args": {"principal_inr": 20000000,
#                                            "rate_percent": 8.5, "years": 20}, "id": "tc_002"},
#   ]
# )
#
# ToolNode executes BOTH concurrently and returns TWO ToolMessages:
# ToolMessage(content="[P1001: 3BHK Bandra West ₹2.5Cr...]", tool_call_id="tc_001")
# ToolMessage(content="Monthly EMI: ₹17,356",               tool_call_id="tc_002")
# Both appended to messages simultaneously via add_messages reducer

# For native async parallelism, define tools as async def:
from langchain_core.tools import tool

@tool
async def search_properties(query: str) -> str:
    """Search property listings. Returns top matching results."""
    results = await property_db.async_search(query)
    return str(results)

@tool
async def calculate_emi(principal_inr: int, rate_percent: float, years: int) -> str:
    """Calculate monthly EMI for a home loan."""
    r   = rate_percent / 100 / 12
    n   = years * 12
    emi = principal_inr * r * (1 + r)**n / ((1 + r)**n - 1)
    return f"₹{emi:,.0f}/month"

# ToolNode calls async tools via asyncio.gather — true concurrency
# If both tools take 0.5s: total time ≈ 0.5s (not 1.0s)
# Sync tools: run in ThreadPoolExecutor — still parallel, slightly more overhead`,j=`# Default: ToolNode catches exceptions and wraps them as ToolMessages
# The LLM receives the error text and decides how to recover

@tool
def get_property_price(property_id: str) -> str:
    """Get the current asking price for a property."""
    prop = property_db.get(property_id)
    if prop is None:
        raise ValueError(f"Property {property_id!r} not found")
    return f"₹{prop['price_cr']}Cr"

# With no special config, ToolNode returns:
# ToolMessage(content="Error: ValueError: Property 'P999' not found", tool_call_id="tc_abc")
# LLM response: "I couldn't find property P999. Could you double-check the listing ID?"

# ── Disable error wrapping (let exceptions propagate to the graph) ─────────
tool_node = ToolNode(tools, handle_tool_errors=False)
# Use when you have a dedicated error_handler node in the graph:

def route_after_tools(state: AgentState) -> str:
    last = state["messages"][-1]
    if isinstance(last, ToolMessage) and last.content.startswith("Error:"):
        return "error_handler"   # specialized recovery node
    return "llm"

# ── Custom error message (tell LLM exactly how to recover) ────────────────
def format_tool_error(error: Exception, call: dict) -> str:
    return (
        f"Tool '{call['name']}' failed: {error}. "
        f"Please retry with corrected parameters or try a different tool."
    )
tool_node = ToolNode(tools, handle_tool_errors=format_tool_error)`,k=`# InjectedState — inject graph state into a tool without LLM knowing about it
# InjectedToolCallId — build a ToolMessage manually with the right tool_call_id

from typing import Annotated
from langchain_core.tools import tool, InjectedToolCallId
from langchain_core.messages import ToolMessage
from langgraph.prebuilt import InjectedState
from langgraph.types import Command

# InjectedState: LangGraph reads this from the current graph state at dispatch time
@tool
def search_with_context(
    query: str,
    state: Annotated[dict, InjectedState],   # injected by LangGraph, not from LLM
) -> str:
    """Search properties. Automatically uses the user's saved filters."""
    active_filters = state.get("active_filters", {})
    city           = active_filters.get("city", "Mumbai")
    return str(property_db.search(query, city=city))
# LLM's JSON schema only shows: search_with_context(query: str)
# LangGraph injects the full state dict into 'state' at call time — invisible to LLM

# InjectedToolCallId: needed when a tool wants to update STATE beyond just messages
@tool
def approve_listing(
    property_id: str,
    tool_call_id: Annotated[str, InjectedToolCallId],  # injected, not from LLM
) -> Command:
    """Approve a property listing."""
    result = property_db.approve(property_id)
    return Command(update={
        "messages": [
            ToolMessage(content=f"Approved: {result}", tool_call_id=tool_call_id)
        ],
        "last_approved": property_id,   # update non-message state fields too
    })
# Returning Command from a tool applies a full state update + continues the graph`,b=`from langgraph.prebuilt import ToolNode
from langchain_core.messages import ToolMessage, AIMessage

class RoleAwareToolNode(ToolNode):
    """ToolNode that enforces per-tool RBAC before dispatching."""

    PERMISSIONS = {
        "guest":   {"search_properties"},
        "user":    {"search_properties", "book_site_visit", "save_to_favourites"},
        "premium": {"search_properties", "book_site_visit", "save_to_favourites",
                    "execute_purchase", "get_owner_contact"},
    }

    def _run_one(self, call: dict, config: dict, state: dict) -> ToolMessage:
        user_role = state.get("user_role", "guest")
        allowed   = self.PERMISSIONS.get(user_role, set())

        if call["name"] not in allowed:
            tier = "premium" if call["name"] in {"execute_purchase", "get_owner_contact"} else "user"
            return ToolMessage(
                content=f"Access denied: '{call['name']}' requires {tier} account. "
                        f"Current role: {user_role}.",
                tool_call_id=call["id"],
            )
        return super()._run_one(call, config, state)

# Drop-in replacement for ToolNode — no other graph changes needed
tool_node = RoleAwareToolNode([
    search_properties, book_site_visit, execute_purchase, get_owner_contact
])
# State must contain "user_role" — set it in the authentication node at graph entry`,v=`# langchain-community: 100+ production-tested tools, all @tool-compatible
# pip install langchain-community tavily-python wikipedia duckduckgo-search

# ── Tavily: best web search for agents (returns ranked structured results) ──
from langchain_community.tools.tavily_search import TavilySearchResults
# Requires: TAVILY_API_KEY env var | Free tier: 1000 searches/month
tavily = TavilySearchResults(max_results=5, include_answer=True, include_raw_content=False)
result = tavily.invoke("Mumbai property market trends 2025")
# → [{"url": "...", "content": "...", "score": 0.92}, ...]

# ── Wikipedia: free factual lookups ───────────────────────────────────────
from langchain_community.tools import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper
wiki = WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper(
    top_k_results=2, doc_content_chars_max=2000
))
result = wiki.run("Bandra West neighbourhood history Mumbai")

# ── DuckDuckGo: free web search, no API key ────────────────────────────────
from langchain_community.tools import DuckDuckGoSearchRun
ddg    = DuckDuckGoSearchRun()
result = ddg.run("RERA registration Maharashtra 2025")

# ── Use all in ToolNode ────────────────────────────────────────────────────
all_tools       = [search_properties, tavily, wiki, calculate_emi]
tool_node       = ToolNode(all_tools)
llm_with_tools  = llm.bind_tools(all_tools)
# LLM chooses the right tool based on the description strings`,S=`# create_retriever_tool: wraps a LangChain retriever as a @tool
# — the LLM calls it on demand; retrieved docs returned as one string

from langchain.tools.retriever import create_retriever_tool
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

embeddings  = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = FAISS.load_local("property_docs", embeddings, allow_dangerous_deserialization=True)
retriever   = vectorstore.as_retriever(search_kwargs={"k": 5})

rag_tool = create_retriever_tool(
    retriever   = retriever,
    name        = "search_rera_filings",
    description = (
        "Search RERA filings, locality guides, and housing regulations. "
        "Use when the user asks about legal status, possession dates, or area insights. "
        "Do NOT use for price searches — use search_properties instead."
    ),
)
# The description is what the LLM reads to decide when to call this tool.
# A vague description = the LLM calls it for everything (or nothing).
# The key: tell the LLM WHEN to use it AND when NOT to.

# ── MCP tool integration (LangChain 0.3+) ────────────────────────────────
# LangChain supports MCP servers as tool sources via langchain-mcp-adapters:
# from langchain_mcp_adapters.client import MultiServerMCPClient
# client = MultiServerMCPClient({"property-server": {"url": "http://localhost:8100/mcp"}})
# mcp_tools = await client.get_tools()
# tool_node = ToolNode(mcp_tools)   # same pattern, MCP tools dispatch identically`,w=`from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.sqlite import SqliteSaver

# Dev: in-memory (lost on restart — fine for local testing)
app = graph.compile(checkpointer=MemorySaver())

# Production (single-process): SQLite — fine for < ~50 concurrent users
with SqliteSaver.from_conn_string("./checkpoints.db") as checkpointer:
    app = graph.compile(checkpointer=checkpointer)

config = {"configurable": {"thread_id": "user_123_session_456"}}
# Turn 1
app.invoke({"messages": [HumanMessage("What's the price in Bandra?")]}, config)
# Turn 2 — checkpoint auto-loaded, full context preserved
app.invoke({"messages": [HumanMessage("And in Powai?")]}, config)`,T=`# Multi-process production (gunicorn / multiple uvicorn workers):
# SQLite has write-lock contention; each worker needs its own connection.
# AsyncPostgresSaver uses PostgreSQL — safe for any number of workers.

from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
import psycopg
import os

DATABASE_URL = os.environ["DATABASE_URL"]
# e.g. "postgresql://user:pass@rds-host:5432/housing_db"

async def create_app():
    conn = await psycopg.AsyncConnection.connect(
        DATABASE_URL,
        autocommit=True,
        prepare_threshold=0,   # disable prepared statements (required for pgbouncer)
    )
    checkpointer = AsyncPostgresSaver(conn)
    await checkpointer.setup()
    # setup() creates 3 tables on first run:
    #   checkpoints       — one row per (thread_id, checkpoint_id)
    #   checkpoint_blobs  — serialised state blobs (binary, gzip)
    #   checkpoint_writes — pending node writes between checkpoints

    return graph.compile(checkpointer=checkpointer)

# Checkpoint sizing:
# 50 turns × 200 tokens/turn ≈ 10 KB per checkpoint write
# 10K DAU × 20 turns/day × 10 KB = 2 GB/day → add a retention job:
# DELETE FROM checkpoints WHERE created_at < NOW() - INTERVAL '30 days';

# ── Connection pooling (high-traffic) ─────────────────────────────────────
# pip install langgraph-checkpoint-postgres asyncpg
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
import asyncpg

async def create_pooled_app():
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    checkpointer = AsyncPostgresSaver(pool)
    await checkpointer.setup()
    return graph.compile(checkpointer=checkpointer)`,L=`app = graph.compile(
    checkpointer=memory,
    interrupt_before=["tools"],   # pause BEFORE tool execution
)
config = {"configurable": {"thread_id": "hitl_flow_1"}}

# Run until interrupt — no tool has fired yet
state = app.invoke({"messages": [HumanMessage("Buy listing #456")]}, config)
print(state["messages"][-1].tool_calls)
# → [{"name": "execute_purchase", "args": {"listing_id": 456}}]

# Approve: resume with Command(resume=None) — stable API (LangGraph 0.2+)
from langgraph.types import Command
result = app.invoke(Command(resume=None), config)

# Reject: inject a message and resume
result = app.invoke(
    Command(update={"messages": [HumanMessage("Rejected: requires manager approval.")]}),
    config
)`,A=`async for event in app.astream_events(
    {"messages": [HumanMessage("Find 3BHK in Bandra")]},
    config=config, version="v2",
):
    if event["event"] == "on_chat_model_stream":
        print(event["data"]["chunk"].content, end="", flush=True)
    elif event["event"] == "on_tool_start":
        print(f"\\n[Tool: {event['name']}]")
    elif event["event"] == "on_tool_end":
        print(f"[Result: {str(event['data']['output'])[:80]}...]")`,M=`import asyncio
from langchain_anthropic import ChatAnthropic

# ── 1. Per-node timeout ────────────────────────────────────────────────────
async def safe_search_node(state: AgentState) -> dict:
    try:
        results = await asyncio.wait_for(
            async_property_search(state["query"]),
            timeout=3.0,   # hard 3-second cap per search
        )
        return {"search_results": results, "error": None}
    except asyncio.TimeoutError:
        return {"search_results": [], "error": "search_timeout"}
    except Exception as e:
        return {"search_results": [], "error": str(e)}

# ── 2. Route based on error field ─────────────────────────────────────────
def route_after_search(state: AgentState) -> str:
    if state.get("error") == "search_timeout":
        return "graceful_degrade"   # node that replies "search is slow right now"
    if state.get("error"):
        return "error_handler"
    return "respond"`,N=`# ── 3. LLM fallback chain ─────────────────────────────────────────────────
primary_llm  = ChatAnthropic(model="claude-sonnet-4-6", timeout=8.0,  max_retries=0)
fallback_llm = ChatAnthropic(model="claude-haiku-4-5-20251001", timeout=4.0, max_retries=1)

# If primary times out or hits a rate limit, automatically falls back to Haiku:
robust_llm = primary_llm.with_fallbacks(
    [fallback_llm],
    exceptions_to_handle=(Exception,),
)

# ── 4. Retry with exponential backoff ─────────────────────────────────────
from openai import RateLimitError, APITimeoutError
llm_with_retry = llm.with_retry(
    retry_if_exception_type=(RateLimitError, APITimeoutError),
    stop_after_attempt=3,
    wait_exponential_jitter=True,   # 1s → 2s → 4s + ±0.5s jitter
)

# ── 5. Bound state growth (prevent checkpoint size explosion) ─────────────
def trim_history_node(state: AgentState) -> dict:
    msgs = state["messages"]
    if len(msgs) > 40:
        # Keep SystemMessage (index 0) + last 39 messages
        msgs = [msgs[0]] + msgs[-39:] if isinstance(msgs[0], SystemMessage) else msgs[-40:]
    return {"messages": msgs}

# Add as the first node every turn touches:
graph.add_edge(START, "trim_history")
graph.add_edge("trim_history", "classify")
# This caps memory at ≈ 40 messages × 200 tokens = 8K tokens per checkpoint write`,c=`# Complete production ReAct agent:
# custom state + RBAC ToolNode + PostgresSaver + HITL + SSE streaming

from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage

class HousingAgentState(TypedDict):
    messages:       Annotated[list, add_messages]
    active_filters: dict          # persisted search context across turns
    user_role:      str           # "guest" | "user" | "premium"
    error:          str | None

SYSTEM_PROMPT = (
    "You are a helpful housing assistant for Mumbai real estate. "
    "Use the available tools to search properties, check RERA filings, and calculate EMIs."
)

def llm_node(state: HousingAgentState) -> dict:
    llm        = ChatAnthropic(model="claude-haiku-4-5-20251001")
    llm_tools  = llm.bind_tools(tools)
    response   = llm_tools.invoke([
        SystemMessage(content=SYSTEM_PROMPT),
        *state["messages"],
    ])
    return {"messages": [response]}

# RoleAwareToolNode from §24.5.5 — enforces RBAC per tool call
tool_node = RoleAwareToolNode(tools)

def update_filters_node(state: HousingAgentState) -> dict:
    # Parse structured data from ToolMessages and persist active filters
    return {}  # extend with filter extraction logic as needed

graph = StateGraph(HousingAgentState)
graph.add_node("llm",            llm_node)
graph.add_node("tools",          tool_node)
graph.add_node("update_filters", update_filters_node)
graph.add_node("trim_history",   trim_history_node)  # §24.10

graph.add_edge(START,            "trim_history")
graph.add_edge("trim_history",   "llm")
graph.add_conditional_edges("llm", tools_condition)
graph.add_edge("tools",          "update_filters")
graph.add_edge("update_filters", "llm")              # loop back with updated context

# Multi-process checkpointing + HITL before any tool execution
async def build_app(db_conn):
    cp = AsyncPostgresSaver(db_conn)
    await cp.setup()
    return graph.compile(
        checkpointer=cp,
        interrupt_before=["tools"],   # pause before tools fire — human can approve
    )

# FastAPI SSE endpoint
async def stream_chat(message: str, user_id: str, session_id: str, user_role: str):
    config = {"configurable": {"thread_id": f"{user_id}:{session_id}"}}
    input  = {"messages": [HumanMessage(content=message)], "user_role": user_role}

    async for chunk, _ in app.astream(input, config, stream_mode="messages"):
        if chunk.content:
            yield chunk.content    # token-by-token SSE to the browser`;function P(){return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"learning-obj",children:[e.jsx("div",{className:"learning-obj-title",children:"After this module you will be able to"}),e.jsxs("ol",{children:[e.jsx("li",{children:"Design state schemas that avoid the add_messages gotcha"}),e.jsx("li",{children:"Write nodes as pure functions returning partial state updates"}),e.jsx("li",{children:"Build conditional edges with typed routing functions"}),e.jsxs("li",{children:["Create tools with ",e.jsx("code",{children:"@tool"})," and bind them to an LLM"]}),e.jsx("li",{children:"Explain ToolNode's internal execution flow, parallel dispatch, and error handling"}),e.jsxs("li",{children:["Inject graph state into tools with ",e.jsx("code",{children:"InjectedState"}),"; build custom ToolNode subclasses"]}),e.jsx("li",{children:"Use community tools (Tavily, Wikipedia, RAG retriever) inside ToolNode"}),e.jsx("li",{children:"Choose MemorySaver / SqliteSaver / AsyncPostgresSaver for the right deployment scale"}),e.jsx("li",{children:"Implement HITL interrupts and resume patterns"}),e.jsx("li",{children:"Apply production patterns: timeouts, LLM fallback, retry, state trimming"}),e.jsx("li",{children:"Assemble a full production ReAct agent with custom state, RBAC, and SSE streaming"})]}),e.jsxs("div",{className:"obj-meta",children:[e.jsx("span",{className:"obj-time",children:"⏱ ~120 minutes"}),e.jsx("span",{className:"obj-diff",children:"Difficulty: ★★★★★"}),e.jsx("span",{className:"obj-diff",children:"Prerequisites: Module 25 (LangGraph concepts)"})]})]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"Housing.com Context"}),e.jsx("br",{}),"This module covers the internals of ",e.jsx("code",{children:"graph.py"})," in depth. The ",e.jsx("code",{children:"add_messages"})," gotcha, partial state returns, conditional routing, ToolNode parallel dispatch — all live patterns in the production pipeline. ",e.jsx("code",{children:"RoleAwareToolNode"})," is directly applicable to the permission tiers in the housing platform (guest / user / premium)."]}),e.jsx(u,{}),e.jsx("h2",{children:"26.1 State Design"}),e.jsxs("p",{children:["Before writing a single node, you design the ",e.jsx("strong",{children:"shared state schema"})," — a TypedDict that every node reads from and writes to. Think of it as a Redux store: every node gets the full store, reads what it needs, and returns a partial dict of only the fields it changed."]}),e.jsxs("p",{children:["The single most important decision: ",e.jsxs("strong",{children:["for any list that accumulates over time, annotate it with ",e.jsx("code",{children:"Annotated[list, add_messages]"})]}),". Without this, returning ",e.jsx("code",{children:'{"messages": [new_msg]}'})," from a node replaces the entire list, wiping all history."]}),e.jsx(o,{title:"LangGraph State Schema — add_messages Reducer",language:"python",keyLine:4,keyNote:"add_messages appends; without it, return replaces the whole list",children:x}),e.jsxs("div",{className:"callout callout-warn",children:[e.jsx("strong",{children:"LangGraph state merge rules"}),"Non-annotated fields: ",e.jsx("strong",{children:"last-write-wins"})," (return value replaces the field). Annotated with ",e.jsx("code",{children:"add_messages"}),": ",e.jsx("strong",{children:"appends"})," to the list. Annotated with ",e.jsx("code",{children:"operator.add"}),": ",e.jsx("strong",{children:"accumulates"})," across parallel node runs (for Send() fan-out — see Module 25).",e.jsx("br",{}),e.jsx("br",{}),"Never mutate ",e.jsx("code",{children:"state"})," directly inside a node — always return a new dict."]}),e.jsx("h2",{children:"26.2 Nodes"}),e.jsxs("p",{children:["A node is any Python function that takes the current state and returns a ",e.jsx("strong",{children:"partial dict"})," of only the fields it changed. Two message types to know:"]}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:e.jsx("code",{children:"ToolMessage(content=..., tool_call_id=...)"})})," — ",e.jsx("code",{children:"tool_call_id"})," must match the ",e.jsx("code",{children:"id"})," field from the preceding ",e.jsx("code",{children:"AIMessage"}),"'s ",e.jsx("code",{children:"tool_calls"}),". Wrong ID → LLM hallucinates or ignores tool results."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Async nodes"})," — use ",e.jsx("code",{children:"async def"})," for I/O-bound operations. LangGraph supports sync and async nodes in the same graph."]})]}),e.jsx(o,{title:"LangGraph Nodes — Partial State Returns and Async",language:"python",keyLine:10,keyNote:"tool_call_id must match AIMessage id or LLM ignores the result",children:f}),e.jsx("h2",{children:"26.3 Edges & Conditional Routing"}),e.jsxs("div",{style:{margin:"16px 0",borderRadius:"8px",overflow:"hidden",border:"1px solid var(--border)"},children:[e.jsxs("div",{style:{background:"var(--bg)",borderBottom:"1px solid var(--border)",padding:"6px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsx("span",{style:{fontSize:"11px",fontWeight:700,color:"var(--muted)"},children:"PYTHON"}),e.jsx("button",{onClick:()=>navigator.clipboard.writeText(l),style:{background:"none",border:"none",color:"var(--muted)",fontSize:"11px",cursor:"pointer",padding:"2px 6px"},children:"Copy"})]}),e.jsx(n,{height:"260px",language:"python",value:l,theme:"vs-dark",options:{readOnly:!0,minimap:{enabled:!1},fontSize:13,lineNumbers:"on",scrollBeyondLastLine:!1,wordWrap:"on",padding:{top:12,bottom:12}}})]}),e.jsx("h2",{children:"26.4 The @tool Decorator"}),e.jsx(o,{title:"@tool Decorator — Schema from Type Hints and Docstring",language:"python",keyLine:13,keyNote:"LLM reads the docstring to decide when to call this tool",children:_}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"What @tool does at runtime"}),e.jsx("code",{children:"@tool"})," wraps the function into a ",e.jsx("code",{children:"StructuredTool"})," with ",e.jsx("code",{children:".name"}),", ",e.jsx("code",{children:".description"})," (from docstring — ",e.jsx("em",{children:"this is what the LLM reads to decide when to call it"}),"), and ",e.jsx("code",{children:".args_schema"})," (Pydantic model auto-generated from type hints). ",e.jsx("code",{children:"llm.bind_tools([...])"})," sends the JSON schema to the LLM. The LLM generates a tool_call JSON. ToolNode validates it against ",e.jsx("code",{children:"args_schema"})," and calls the function. If validation fails, ToolNode returns a ToolMessage with the error — the LLM retries."]}),e.jsx("h2",{children:"26.5 ToolNode — Internals, Parallel Calls, Error Handling"}),e.jsxs("p",{children:[e.jsx("code",{children:"ToolNode"})," is not a simple dispatcher. Understanding its internals lets you debug failures, handle parallel calls, and extend it with custom logic."]}),e.jsx("h3",{children:"24.5.1 Internal Execution Flow"}),e.jsxs("div",{style:{margin:"16px 0",borderRadius:"8px",overflow:"hidden",border:"1px solid var(--border)"},children:[e.jsxs("div",{style:{background:"var(--bg)",borderBottom:"1px solid var(--border)",padding:"6px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsx("span",{style:{fontSize:"11px",fontWeight:700,color:"var(--muted)"},children:"PYTHON"}),e.jsx("button",{onClick:()=>navigator.clipboard.writeText(d),style:{background:"none",border:"none",color:"var(--muted)",fontSize:"11px",cursor:"pointer",padding:"2px 6px"},children:"Copy"})]}),e.jsx(n,{height:"380px",language:"python",value:d,theme:"vs-dark",options:{readOnly:!0,minimap:{enabled:!1},fontSize:13,lineNumbers:"on",scrollBeyondLastLine:!1,wordWrap:"on",padding:{top:12,bottom:12}}})]}),e.jsx("h3",{children:"24.5.2 Parallel Tool Calls"}),e.jsxs("p",{children:["When the LLM requests multiple tools in a single ",e.jsx("code",{children:"AIMessage"}),", ToolNode dispatches them concurrently. The wall-clock time is the slowest single tool, not the sum."]}),e.jsx(o,{title:"ToolNode — Parallel Tool Dispatch with asyncio.gather",language:"python",keyLine:27,keyNote:"wall-clock time equals slowest single tool, not sum of all",children:y}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"Sync vs async tools in ToolNode"}),"Sync tools run in a ",e.jsx("code",{children:"ThreadPoolExecutor"})," — ToolNode wraps them with ",e.jsx("code",{children:"asyncio.run_in_executor"})," so they don't block the event loop. Async tools run directly via ",e.jsx("code",{children:"asyncio.gather"}),". Both achieve parallelism; async is preferred for high-throughput I/O (database queries, external APIs)."]}),e.jsx("h3",{children:"24.5.3 Error Handling"}),e.jsx(o,{title:"ToolNode Error Handling — Wrap, Propagate, or Custom Format",language:"python",keyLine:12,keyNote:"handle_tool_errors=False lets exceptions reach your error_handler node",children:j}),e.jsx("h3",{children:"24.5.4 InjectedState & InjectedToolCallId"}),e.jsx("p",{children:"Use these to pass graph state into tools without exposing it to the LLM, and to update non-message state fields from inside a tool."}),e.jsx(o,{title:"InjectedState and InjectedToolCallId — Hidden Parameters",language:"python",keyLine:22,keyNote:"InjectedState is invisible to the LLM; LangGraph fills it at dispatch",children:k}),e.jsx("h3",{children:"24.5.5 Custom ToolNode — Role-Based Access Control"}),e.jsxs("p",{children:["Subclass ",e.jsx("code",{children:"ToolNode"})," to intercept dispatch and enforce any per-call logic — auth checks, rate limiting, audit logging."]}),e.jsx(o,{title:"RoleAwareToolNode — RBAC via ToolNode Subclass",language:"python",keyLine:13,keyNote:"override _run_one to intercept every tool call before dispatch",children:b}),e.jsx("h2",{children:"26.6 Community Tools Ecosystem"}),e.jsxs("p",{children:[e.jsx("code",{children:"langchain-community"})," ships 100+ production-tested tools. All follow the same ",e.jsx("code",{children:"@tool"})," interface and slot directly into ",e.jsx("code",{children:"ToolNode"}),"."]}),e.jsx("h3",{children:"24.6.1 Web Search Tools"}),e.jsx(o,{title:"Community Web Search Tools — Tavily, Wikipedia, DuckDuckGo",language:"python",keyLine:6,keyNote:"include_answer=True returns a synthesized answer alongside results",children:v}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Tool"}),e.jsx("th",{children:"API key"}),e.jsx("th",{children:"Best for"}),e.jsx("th",{children:"Limitation"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"TavilySearchResults"}),e.jsx("td",{children:"Yes (free tier)"}),e.jsx("td",{children:"Agent-optimised web search with structured results + answer field"}),e.jsx("td",{children:"1000/month free; paid beyond"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"WikipediaQueryRun"}),e.jsx("td",{children:"No"}),e.jsx("td",{children:"Factual lookups, entity background"}),e.jsx("td",{children:"May be outdated; no real-time info"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"DuckDuckGoSearchRun"}),e.jsx("td",{children:"No"}),e.jsx("td",{children:"Free web search, dev/prototyping"}),e.jsx("td",{children:"Rate-limited; unstructured results"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"GoogleSearchRun"}),e.jsx("td",{children:"Yes"}),e.jsx("td",{children:"High-volume production search"}),e.jsx("td",{children:"Paid; requires CSE setup"})]})]})}),e.jsx("h3",{children:"24.6.2 RAG as a Tool — create_retriever_tool"}),e.jsxs("p",{children:["Wraps any LangChain retriever (FAISS, Pinecone, Chroma) as a callable tool. The LLM reads the ",e.jsx("code",{children:"description"})," to decide when to invoke it."]}),e.jsx(o,{title:"create_retriever_tool — RAG as a Callable Tool",language:"python",keyLine:10,keyNote:"description tells the LLM when to use AND when not to use this tool",children:S}),e.jsxs("div",{className:"callout callout-warn",children:[e.jsx("strong",{children:"The description is the contract between LLM and tool"}),`A vague description causes two failure modes: (a) the LLM calls it for queries that would be better handled by a different tool, burning latency and tokens; (b) the LLM never calls it for the exact queries it's designed for. The description should name: what data it searches, when to use it, and when NOT to use it. Test by asking the LLM "which tool would you use for X?" before deploying.`]}),e.jsx("h2",{children:"26.7 Checkpointing — Persistent Memory"}),e.jsx("h3",{children:"24.7.1 MemorySaver & SqliteSaver"}),e.jsx(o,{title:"Checkpointing — MemorySaver and SqliteSaver",language:"python",keyLine:9,keyNote:"same thread_id reloads the full prior context automatically",children:w}),e.jsx("h3",{children:"24.7.2 AsyncPostgresSaver — Multi-Process Production"}),e.jsxs("p",{children:["SQLite holds a write lock per file — concurrent workers serialize on every checkpoint write, capping throughput. For multi-process deployments, use ",e.jsx("code",{children:"AsyncPostgresSaver"}),":"]}),e.jsx(o,{title:"AsyncPostgresSaver — Multi-Process Production Checkpointing",language:"python",keyLine:14,keyNote:"setup() creates checkpoints, checkpoint_blobs, checkpoint_writes tables",children:T}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{}),e.jsx("th",{children:"MemorySaver"}),e.jsx("th",{children:"SqliteSaver"}),e.jsx("th",{children:"AsyncPostgresSaver"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Survives restart"}),e.jsx("td",{children:"No"}),e.jsx("td",{children:"Yes"}),e.jsx("td",{children:"Yes"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Multi-process safe"}),e.jsx("td",{children:"No"}),e.jsx("td",{children:"No (write-lock)"}),e.jsx("td",{children:"Yes"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Scalability"}),e.jsx("td",{children:"Dev only"}),e.jsx("td",{children:"< 50 concurrent"}),e.jsx("td",{children:"Unlimited (pooling)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Setup complexity"}),e.jsx("td",{children:"Zero"}),e.jsx("td",{children:"Low"}),e.jsx("td",{children:"Medium (managed RDS)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Retention / TTL"}),e.jsx("td",{children:"Process lifetime"}),e.jsx("td",{children:"Manual SQL job"}),e.jsx("td",{children:"SQL + pg_partman"})]})]})}),e.jsx(g,{}),e.jsx("h2",{children:"26.8 Human-in-the-Loop Interrupts"}),e.jsxs("p",{children:[e.jsx("code",{children:'interrupt_before=["tools"]'})," serializes the full graph state to the checkpointer and returns from ",e.jsx("code",{children:"app.invoke()"})," frozen at the interrupt node. Call ",e.jsx("code",{children:"app.invoke(Command(resume=None), config)"})," with the same ",e.jsx("code",{children:"thread_id"})," to resume."]}),e.jsx(o,{title:"HITL Interrupt and Resume with Command",language:"python",keyLine:12,keyNote:"Command(resume=None) is the stable API; invoke(None) is version-dependent",children:L}),e.jsxs("div",{className:"callout callout-warn",children:[e.jsx("strong",{children:"invoke(None) vs Command(resume=None)"}),e.jsx("code",{children:"invoke(None)"})," resumes but is technically version-dependent behaviour. ",e.jsx("code",{children:"Command(resume=None)"})," is the explicit stable API introduced in LangGraph 0.2. Always use ",e.jsx("code",{children:"Command"})," in production. Use ",e.jsxs("code",{children:["Command(update=","{'...'}"]})," to inject state changes at resume time (e.g. reject the proposed action and add a message explaining why)."]}),e.jsx("h2",{children:"26.9 Streaming"}),e.jsx(o,{title:"LangGraph Streaming — astream_events Token-Level SSE",language:"python",keyLine:4,keyNote:"on_chat_model_stream fires per token; on_tool_start fires before dispatch",children:A}),e.jsx("h2",{children:"26.10 Production Patterns"}),e.jsx("h3",{children:"24.10.1 Node-Level Timeouts & Error Routing"}),e.jsx(o,{title:"Production Node Timeouts and Error Routing",language:"python",keyLine:6,keyNote:"hard 3-second cap prevents slow searches from blocking the response",children:M}),e.jsx("h3",{children:"24.10.2 LLM Fallback, Retry, State Trimming"}),e.jsx(o,{title:"LLM Fallback, Retry, and History Trimming",language:"python",keyLine:6,keyNote:"with_fallbacks auto-switches to Haiku when Sonnet times out or rate-limits",children:N}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"Production checklist for any LangGraph agent"}),e.jsxs("ul",{style:{margin:"4px 0 0",fontSize:"12px"},children:[e.jsxs("li",{children:[e.jsx("code",{children:"recursion_limit"})," — compile with a safe limit (10 dev, 25 prod)"]}),e.jsx("li",{children:"Error field in state — nodes write errors; routing checks them before proceeding"}),e.jsxs("li",{children:["LLM fallback — primary model with ",e.jsx("code",{children:".with_fallbacks([cheaper_model])"})]}),e.jsxs("li",{children:["Per-node async timeout — ",e.jsx("code",{children:"asyncio.wait_for(node_coro(), timeout=3.0)"})]}),e.jsx("li",{children:"Trim history node — cap messages at 40 to prevent checkpoint bloat"}),e.jsx("li",{children:"PostgresSaver — for any multi-process or multi-instance deployment"}),e.jsx("li",{children:"LANGCHAIN_TRACING_V2=true — LangSmith auto-traces every run with zero code changes"})]})]}),e.jsx("h2",{children:"26.11 Full ReAct Agent — End to End"}),e.jsx("p",{children:"All the pieces assembled: custom state, RBAC ToolNode, PostgresSaver checkpointing, HITL interrupt, and token-level SSE streaming via FastAPI."}),e.jsxs("div",{style:{margin:"16px 0",borderRadius:"8px",overflow:"hidden",border:"1px solid var(--border)"},children:[e.jsxs("div",{style:{background:"var(--bg)",borderBottom:"1px solid var(--border)",padding:"6px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsx("span",{style:{fontSize:"11px",fontWeight:700,color:"var(--muted)"},children:"PYTHON"}),e.jsx("button",{onClick:()=>navigator.clipboard.writeText(c),style:{background:"none",border:"none",color:"var(--muted)",fontSize:"11px",cursor:"pointer",padding:"2px 6px"},children:"Copy"})]}),e.jsx(n,{height:"400px",language:"python",value:c,theme:"vs-dark",options:{readOnly:!0,minimap:{enabled:!1},fontSize:13,lineNumbers:"on",scrollBeyondLastLine:!1,wordWrap:"on",padding:{top:12,bottom:12}}})]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"create_react_agent vs custom graph"}),e.jsx("code",{children:"create_react_agent"})," (Module 23) builds the ",e.jsx("code",{children:"llm → tools → llm"})," loop in one call — great for demos and simple tools. The custom graph above adds: (1) custom state fields beyond messages; (2) RBAC via ",e.jsx("code",{children:"RoleAwareToolNode"}),"; (3) history trimming to cap memory; (4) per-turn state updates from tool results; (5) ",e.jsx("code",{children:'interrupt_before=["tools"]'})," for selective HITL on purchases. Every production agent eventually needs the custom graph. Use ",e.jsx("code",{children:"create_react_agent"})," to validate tool definitions, then migrate to the full graph."]}),e.jsxs("div",{className:"callout callout-maang",children:[e.jsx("strong",{children:"🎯 MAANG Interview Connection"}),'"Build a stateful multi-turn agent with tool use, safety, and scale." → TypedDict state + ',e.jsx("code",{children:"add_messages"})," reducer → ToolNode parallel dispatch (LLM requests N tools at once; asyncio.gather, wall-clock = slowest single tool) → ",e.jsx("code",{children:"RoleAwareToolNode"})," for RBAC → ",e.jsx("code",{children:"AsyncPostgresSaver"})," for multi-process persistence → ",e.jsx("code",{children:"interrupt_before"})," + ",e.jsx("code",{children:"Command(resume=...)"})," for human approval on purchases → ",e.jsx("code",{children:'astream(stream_mode="messages")'})," for SSE token streaming → ",e.jsx("code",{children:"with_fallbacks"})," + ",e.jsx("code",{children:"asyncio.wait_for"})," for graceful degradation under load. Each choice has a concrete production consequence — name it."]}),e.jsx(m,{moduleId:26,title:"Module 26: LangGraph Code Constructs & Patterns",contentHint:"add_messages reducer append not replace, partial state return from nodes, conditional edge Literal return type, @tool docstring is LLM contract, ToolNode internal flow: read tool_calls dispatch parallel asyncio.gather handle_tool_errors, InjectedState invisible to LLM, InjectedToolCallId Command update state from tool, RoleAwareToolNode subclass _run_one, TavilySearchResults WikipediaQueryRun create_retriever_tool description contract, MemorySaver vs SqliteSaver vs AsyncPostgresSaver multi-process, interrupt_before Command resume vs invoke None, asyncio.wait_for node timeout with_fallbacks LLM retry, trim_history to cap checkpoint size, create_react_agent vs custom graph tradeoffs"})]})}export{P as Mod39};
