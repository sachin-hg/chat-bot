import{j as e,r as x}from"./index-D4pJPyGz.js";import{Q as w}from"./QuizSection-BedG7s-t.js";import{C as d}from"./CodeBlock-dJ_hHYfw.js";function C(){return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"WHY LANGGRAPH — LCEL CANNOT EXPRESS TOOL-USE LOOPS"}),e.jsxs("svg",{viewBox:"0 0 560 160",width:"100%",style:{display:"block",margin:"0 auto"},"aria-label":"LCEL vs LangGraph comparison diagram",children:[e.jsx("style",{children:"@keyframes dashFlow24a{to{stroke-dashoffset:-14}}"}),e.jsx("rect",{x:"4",y:"4",width:"260",height:"152",rx:"6",fill:"#1e1e2e",stroke:"#313244",strokeWidth:"1"}),e.jsx("text",{x:"134",y:"22",textAnchor:"middle",fontSize:"10",fontWeight:"700",fill:"#6c7086",letterSpacing:"1",children:"LCEL: Chains (Linear)"}),[["A","Prompt",40],["B","LLM",110],["C","Parser",180],["D","Output",250]].map(([n,g,r])=>e.jsxs("g",{children:[e.jsx("rect",{x:Number(r)-28,y:"50",width:"56",height:"28",rx:"6",fill:"#313244",stroke:"#45475a",strokeWidth:"1"}),e.jsx("text",{x:Number(r),y:"69",textAnchor:"middle",fontSize:"11",fill:"#cdd6f4",children:String(g)})]},String(n))),e.jsxs("defs",{children:[e.jsx("marker",{id:"arrowLCEL",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#45475a"})}),e.jsx("marker",{id:"arrowRed",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#f38ba8"})}),e.jsx("marker",{id:"arrowGreen",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#a6e3a1"})}),e.jsx("marker",{id:"arrowBlue",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#89b4fa"})})]}),e.jsx("line",{x1:"68",y1:"64",x2:"82",y2:"64",stroke:"#45475a",strokeWidth:"1.5",markerEnd:"url(#arrowLCEL)"}),e.jsx("line",{x1:"138",y1:"64",x2:"152",y2:"64",stroke:"#45475a",strokeWidth:"1.5",markerEnd:"url(#arrowLCEL)"}),e.jsx("line",{x1:"208",y1:"64",x2:"222",y2:"64",stroke:"#45475a",strokeWidth:"1.5",markerEnd:"url(#arrowLCEL)"}),e.jsx("path",{d:"M278,64 Q290,64 290,90 Q290,115 134,115 Q40,115 40,95 Q40,78 12,78",stroke:"#f38ba8",strokeWidth:"1.5",fill:"none",strokeDasharray:"4 3",markerEnd:"url(#arrowRed)"}),e.jsx("text",{x:"134",y:"134",textAnchor:"middle",fontSize:"10",fill:"#f38ba8",children:"No cycles possible"}),e.jsx("text",{x:"120",y:"111",fontSize:"14",fill:"#f38ba8",fontWeight:"700",children:"✗"}),e.jsx("rect",{x:"296",y:"4",width:"260",height:"152",rx:"6",fill:"#1e1e2e",stroke:"#313244",strokeWidth:"1"}),e.jsx("text",{x:"426",y:"22",textAnchor:"middle",fontSize:"10",fontWeight:"700",fill:"#6c7086",letterSpacing:"1",children:"LangGraph: Graphs (Cyclic)"}),[["A","LLM",326],["B","Route",396],["C","Tool",466],["D","End",536]].map(([n,g,r])=>e.jsxs("g",{children:[e.jsx("rect",{x:Number(r)-26,y:"50",width:"52",height:"28",rx:"6",fill:"#313244",stroke:"#45475a",strokeWidth:"1"}),e.jsx("text",{x:Number(r),y:"69",textAnchor:"middle",fontSize:"11",fill:"#cdd6f4",children:String(g)})]},String(n)+"r")),e.jsx("line",{x1:"352",y1:"64",x2:"370",y2:"64",stroke:"#89b4fa",strokeWidth:"1.5",markerEnd:"url(#arrowBlue)"}),e.jsx("line",{x1:"422",y1:"64",x2:"440",y2:"64",stroke:"#89b4fa",strokeWidth:"1.5",markerEnd:"url(#arrowBlue)"}),e.jsx("line",{x1:"492",y1:"64",x2:"510",y2:"64",stroke:"#89b4fa",strokeWidth:"1.5",markerEnd:"url(#arrowBlue)"}),e.jsx("path",{d:"M492,78 Q492,115 396,115 Q326,115 326,78",stroke:"#a6e3a1",strokeWidth:"1.5",fill:"none",strokeDasharray:"4 3",style:{animation:"dashFlow24a 1s linear infinite"},markerEnd:"url(#arrowGreen)"}),e.jsx("text",{x:"409",y:"131",textAnchor:"middle",fontSize:"10",fill:"#a6e3a1",children:"Cycles allowed — tool-use loops"}),e.jsx("text",{x:"396",y:"112",textAnchor:"middle",fontSize:"13",fill:"#a6e3a1",fontWeight:"700",children:"✓"})]})]})}function T(){const[n,g]=x.useState("property_search"),[r,p]=x.useState([]),[s,l]=x.useState(!1),f={property_search:["START","classify","tool_call","END"],general_query:["START","classify","respond","END"]};function k(){if(s)return;l(!0),p([]);const i=f[n];i.forEach((h,m)=>{setTimeout(()=>{p(a=>[...a,h]),m===i.length-1&&l(!1)},m*650)})}const t=i=>r.includes(i),c=i=>({fill:t(i)?"#89b4fa22":"#313244",stroke:t(i)?"#89b4fa":"#45475a"}),v=r.length>0?`{ intent: '${n}', active_node: '${r[r.length-1]}', route: '${n==="property_search"?"tool_call":"respond"}' }`:"{ waiting... }",u=n==="property_search",o=n==="general_query";return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"LANGGRAPH STATEGRAPH — ANIMATED NODE EXECUTION FLOW"}),e.jsxs("div",{style:{marginBottom:"12px",display:"flex",alignItems:"center",gap:"16px",flexWrap:"wrap"},children:[e.jsx("span",{style:{color:"#bac2de",fontSize:"0.82rem"},children:"Path:"}),["property_search","general_query"].map(i=>e.jsxs("label",{style:{color:n===i?"#89b4fa":"#bac2de",fontSize:"0.82rem",cursor:"pointer",display:"flex",alignItems:"center",gap:"5px"},children:[e.jsx("input",{type:"radio",name:"path24",value:i,checked:n===i,onChange:()=>{g(i),p([])},style:{accentColor:"#89b4fa"}}),i]},i)),e.jsx("button",{onClick:k,disabled:s,style:{background:s?"#45475a":"#313244",color:s?"#6c7086":"#cdd6f4",border:"1px solid #45475a",borderRadius:"6px",padding:"5px 12px",fontSize:"0.78rem",cursor:s?"not-allowed":"pointer",marginRight:"8px"},children:s?"Running…":"Run"})]}),e.jsxs("svg",{viewBox:"0 0 440 310",width:"100%",style:{display:"block",margin:"0 auto"},"aria-label":"LangGraph StateGraph animated execution flow — diamond layout",children:[e.jsxs("defs",{children:[e.jsx("marker",{id:"ar24main",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#45475a"})}),e.jsx("marker",{id:"ar24act",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#89b4fa"})}),e.jsx("marker",{id:"ar24tool",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#a6e3a1"})}),e.jsx("marker",{id:"ar24gen",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#f9e2af"})})]}),e.jsx("rect",{x:"170",y:"12",width:"100",height:"36",rx:"6",fill:c("START").fill,stroke:c("START").stroke,strokeWidth:t("START")?2:1}),e.jsx("text",{x:"220",y:"35",textAnchor:"middle",fontSize:"12",fill:t("START")?"#89b4fa":"#cdd6f4",children:"START"}),e.jsx("path",{d:"M 220,48 L 220,96",stroke:t("classify")?"#89b4fa":"#45475a",strokeWidth:"1.5",fill:"none",markerEnd:t("classify")?"url(#ar24act)":"url(#ar24main)"}),e.jsx("rect",{x:"170",y:"96",width:"100",height:"36",rx:"6",fill:c("classify").fill,stroke:c("classify").stroke,strokeWidth:t("classify")?2:1}),e.jsx("text",{x:"220",y:"119",textAnchor:"middle",fontSize:"12",fill:t("classify")?"#89b4fa":"#cdd6f4",children:"classify"}),e.jsx("path",{d:"M 220,132 L 220,152 L 100,152 L 100,181",stroke:u?t("tool_call")?"#a6e3a1":"#45475a":"#31324455",strokeWidth:"1.5",fill:"none",markerEnd:u&&t("tool_call")?"url(#ar24tool)":"url(#ar24main)"}),e.jsx("text",{x:"152",y:"148",textAnchor:"middle",fontSize:"9",fill:u?t("tool_call")?"#a6e3a1":"#6c7086":"#45475a33",children:"property_search"}),e.jsx("path",{d:"M 220,132 L 220,152 L 340,152 L 340,181",stroke:o?t("respond")?"#f9e2af":"#45475a":"#31324455",strokeWidth:"1.5",fill:"none",markerEnd:o&&t("respond")?"url(#ar24gen)":"url(#ar24main)"}),e.jsx("text",{x:"288",y:"148",textAnchor:"middle",fontSize:"9",fill:o?t("respond")?"#f9e2af":"#6c7086":"#45475a33",children:"general"}),e.jsx("rect",{x:"40",y:"181",width:"120",height:"36",rx:"6",fill:u?c("tool_call").fill:"#1e1e2e",stroke:u?c("tool_call").stroke:"#31324488",strokeWidth:t("tool_call")?2:1,opacity:u?1:.4}),e.jsx("text",{x:"100",y:"204",textAnchor:"middle",fontSize:"12",fill:t("tool_call")?"#a6e3a1":u?"#cdd6f4":"#45475a",children:"tool_call"}),e.jsx("path",{d:"M 100,217 L 100,256 L 220,256 L 220,266",stroke:u?t("END")?"#89b4fa":"#45475a":"#31324455",strokeWidth:"1.5",fill:"none",markerEnd:u&&t("END")?"url(#ar24act)":"url(#ar24main)"}),e.jsx("rect",{x:"280",y:"181",width:"120",height:"36",rx:"6",fill:o?c("respond").fill:"#1e1e2e",stroke:o?c("respond").stroke:"#31324488",strokeWidth:t("respond")?2:1,opacity:o?1:.4}),e.jsx("text",{x:"340",y:"204",textAnchor:"middle",fontSize:"12",fill:t("respond")?"#f9e2af":o?"#cdd6f4":"#45475a",children:"respond"}),e.jsx("path",{d:"M 340,217 L 340,256 L 220,256 L 220,266",stroke:o?t("END")?"#89b4fa":"#45475a":"#31324455",strokeWidth:"1.5",fill:"none",markerEnd:o&&t("END")?"url(#ar24act)":"url(#ar24main)"}),e.jsx("rect",{x:"170",y:"266",width:"100",height:"36",rx:"6",fill:c("END").fill,stroke:c("END").stroke,strokeWidth:t("END")?2:1}),e.jsx("text",{x:"220",y:"289",textAnchor:"middle",fontSize:"12",fill:t("END")?"#89b4fa":"#cdd6f4",children:"END"})]}),e.jsxs("div",{style:{marginTop:"10px",fontFamily:"monospace",fontSize:"0.78rem",color:"#a6e3a1",background:"#1e1e2e",border:"1px solid #313244",borderRadius:"6px",padding:"8px 12px"},children:["Current state: ",v]})]})}const S=[{label:"Turn 1",note:'User: "show 2BHK in Bandra"',checkpoint:!0,hitl:!1},{label:"Turn 2",note:'User: "under ₹2Cr"',checkpoint:!0,hitl:!1},{label:"Turn 3",note:'User: "book a viewing"',checkpoint:!1,hitl:!0}];function E(){const[n,g]=x.useState(1),[r,p]=x.useState("idle"),s=r!=="idle";function l(){s||(p("running"),setTimeout(()=>{p("saving")},800),setTimeout(()=>{p("restored")},1500),setTimeout(()=>{g(o=>o>=3?1:o+1),p("idle")},2200))}const f=r==="running",k=r==="saving",t=r==="restored",c=n===3,v=`Turn ${n} of 3`,u=r==="running"?"Graph executing…":r==="saving"?"💾 Saving checkpoint…":r==="restored"?"✓ Checkpoint restored":n===3&&r==="idle"?"⏸ Awaiting human approval (HITL)":"";return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"CHECKPOINTING — MULTI-TURN PERSISTENCE WITH LANGGRAPH"}),e.jsx("style",{children:`
        @keyframes dashFlow24b{to{stroke-dashoffset:-14}}
        @keyframes cpGlow24{0%,100%{opacity:0.4}50%{opacity:1}}
        @keyframes execPulse24{0%,100%{box-shadow:0 0 0 0 #89b4fa44}50%{box-shadow:0 0 0 8px #89b4fa22}}
        @keyframes restoreSlide24{from{stroke-dashoffset:48}to{stroke-dashoffset:0}}
      `}),e.jsxs("div",{style:{marginBottom:"10px",fontSize:"0.78rem",color:"#89b4fa",fontFamily:"monospace",fontWeight:700},children:[v," — ",S[n-1].note]}),e.jsxs("svg",{viewBox:"0 0 560 220",width:"100%",style:{display:"block",margin:"0 auto"},"aria-label":"Checkpointing multi-turn persistence diagram",children:[e.jsxs("defs",{children:[e.jsx("marker",{id:"ar24cp",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#94e2d5"})}),e.jsx("marker",{id:"ar24cpb",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#89b4fa"})}),e.jsx("marker",{id:"ar24cpy",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#f9e2af"})})]}),S.map((o,i)=>{const h=n>=i+1,m=n===i+1,a=16+i*64,j=m&&f,y=m&&k,L=n>i+1||m&&t,b=m&&(r==="running"||r==="saving");return e.jsxs("g",{children:[e.jsx("rect",{x:"8",y:a,width:"544",height:"52",rx:"6",fill:h?"#1e1e2e22":"#1e1e2e",stroke:m?"#89b4fa55":"#313244",strokeWidth:"1"}),e.jsx("text",{x:"28",y:a+20,fontSize:"10",fill:h?"#6c7086":"#45475a",children:o.label}),e.jsx("rect",{x:"60",y:a+13,width:"80",height:"26",rx:"6",fill:"#313244",stroke:h?"#6c7086":"#45475a",opacity:h?1:.4}),e.jsx("text",{x:"100",y:a+31,textAnchor:"middle",fontSize:"9",fill:h?"#bac2de":"#45475a",children:"User msg"}),h&&e.jsx("text",{x:"100",y:a+43,textAnchor:"middle",fontSize:"7",fill:"#6c7086",children:o.note.substring(7,28)}),h&&e.jsxs(e.Fragment,{children:[e.jsx("line",{x1:"140",y1:a+26,x2:"162",y2:a+26,stroke:"#89b4fa",strokeWidth:"1.5",markerEnd:"url(#ar24cpb)"}),e.jsx("rect",{x:"162",y:a+13,width:"100",height:"26",rx:"6",fill:j?"#89b4fa44":"#89b4fa22",stroke:j?"#89b4fa":"#89b4fa88",strokeWidth:j?2:1,style:{filter:j?"drop-shadow(0 0 8px #89b4fa)":"none",transition:"filter 0.3s, stroke 0.3s"}}),e.jsx("text",{x:"212",y:a+31,textAnchor:"middle",fontSize:"10",fill:"#89b4fa",children:"Graph exec"})]}),h&&!o.hitl&&e.jsxs(e.Fragment,{children:[e.jsx("line",{x1:"262",y1:a+26,x2:"284",y2:a+26,stroke:"#94e2d5",strokeWidth:"1.5",markerEnd:"url(#ar24cp)"}),e.jsx("rect",{x:"284",y:a+13,width:"110",height:"26",rx:"6",fill:y?"#94e2d544":"#94e2d522",stroke:y?"#94e2d5":"#94e2d588",strokeWidth:y?2:1,style:{filter:y?"drop-shadow(0 0 10px #94e2d5)":"none",transition:"filter 0.3s, stroke 0.3s"}}),e.jsx("text",{x:"316",y:a+26,textAnchor:"middle",fontSize:"9",fill:"#94e2d5",children:"💾"}),e.jsx("text",{x:"340",y:a+31,textAnchor:"middle",fontSize:"10",fill:"#94e2d5",children:"Checkpoint saved"}),y&&e.jsx("text",{x:"339",y:a+50,textAnchor:"middle",fontSize:"9",fill:"#94e2d5",style:{animation:"cpGlow24 0.6s ease infinite"},children:"💾 saving…"})]}),h&&o.hitl&&e.jsxs(e.Fragment,{children:[e.jsx("line",{x1:"262",y1:a+26,x2:"284",y2:a+26,stroke:"#f9e2af",strokeWidth:"1.5",markerEnd:"url(#ar24cpy)"}),e.jsxs("g",{style:{opacity:c?1:0,transition:"opacity 0.5s ease"},children:[e.jsx("rect",{x:"284",y:a+13,width:"130",height:"26",rx:"6",fill:b?"#f9e2af33":"#f9e2af22",stroke:"#f9e2af",style:{filter:b?"drop-shadow(0 0 8px #f9e2af88)":"none",transition:"filter 0.3s",animation:c&&r==="idle"?"cpGlow24 1.2s ease infinite":"none"}}),e.jsx("text",{x:"349",y:a+31,textAnchor:"middle",fontSize:"10",fill:"#f9e2af",children:"⏸ Human interrupt (HITL)"})]})]}),h&&!o.hitl&&i<2&&L&&e.jsx("path",{d:`M339,${a+39} Q339,${a+60} 212,${a+75}`,stroke:"#94e2d5",strokeWidth:"1.2",fill:"none",strokeDasharray:"48",strokeDashoffset:"0",style:{animation:m&&t?"restoreSlide24 0.7s ease forwards":"dashFlow24b 1s linear infinite"},markerEnd:"url(#ar24cp)"})]},i)}),e.jsx("rect",{x:"8",y:"196",width:"12",height:"10",rx:"2",fill:"#89b4fa22",stroke:"#89b4fa"}),e.jsx("text",{x:"24",y:"205",fontSize:"9",fill:"#89b4fa",children:"Graph execution"}),e.jsx("rect",{x:"130",y:"196",width:"12",height:"10",rx:"2",fill:"#94e2d522",stroke:"#94e2d5"}),e.jsx("text",{x:"146",y:"205",fontSize:"9",fill:"#94e2d5",children:"Checkpoint"}),e.jsx("rect",{x:"228",y:"196",width:"12",height:"10",rx:"2",fill:"#f9e2af22",stroke:"#f9e2af"}),e.jsx("text",{x:"244",y:"205",fontSize:"9",fill:"#f9e2af",children:"HITL pause"})]}),e.jsxs("div",{style:{marginTop:"14px",display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"},children:[e.jsx("button",{onClick:l,disabled:s,style:{background:s?"#45475a":"#313244",color:s?"#6c7086":"#cdd6f4",border:"1px solid #45475a",borderRadius:"6px",padding:"6px 16px",fontSize:"0.78rem",cursor:s?"not-allowed":"pointer",transition:"background 0.2s, border-color 0.2s"},children:"▶ Next Turn"}),e.jsx("span",{style:{fontSize:"0.78rem",color:"#6c7086",fontFamily:"monospace"},children:u})]})]})}const N=`from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, ToolMessage

llm = ChatAnthropic(model="claude-haiku-4-5-20251001")

@tool
def search_properties(query: str) -> list:
    """Search property listings."""
    return property_db.search(query)

llm_with_tools = llm.bind_tools([search_properties])

# Without LangGraph — you write the loop yourself:
messages = [HumanMessage(content="Find 3BHK in Bandra under 2Cr")]
while True:
    response = llm_with_tools.invoke(messages)
    if not response.tool_calls:
        print(response.content)   # done
        break
    messages.append(response)
    for tc in response.tool_calls:
        result = search_properties.invoke(tc["args"])
        messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))

# This "works" — but you lose everything LangGraph provides:
# ✗ No checkpointing  → crash loses the conversation mid-loop
# ✗ No HITL           → can't pause before search fires
# ✗ No LangSmith      → no trace of which tools ran and why
# ✗ No streaming      → can't yield tokens while the loop runs
# ✗ No recursion limit → one bad tool call causes infinite loop + OOM
# ✗ No reusability    → copy-paste this loop in every endpoint`,A=`from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]  # reducer: appends, not replaces
    #         ^^^^^^^^  Annotated[T, metadata] — Python attaches the reducer
    #         function as metadata to the type hint. At compile() time, LangGraph
    #         calls get_type_hints(AgentState, include_extras=True) to read it.
    classification: dict | None
    needs_clarification: bool

def classify_node(state: AgentState) -> dict:
    result = classifier.classify(state["messages"][-1].content)
    return {"classification": result, "needs_clarification": result["confidence"] < 0.6}

def route_after_classify(state: AgentState) -> str:
    return "clarify" if state["needs_clarification"] else "respond"

graph = StateGraph(AgentState)
graph.add_node("classify", classify_node)
graph.add_node("respond",  respond_node)
graph.add_node("clarify",  clarify_node)
graph.set_entry_point("classify")
graph.add_conditional_edges("classify", route_after_classify,
    {"clarify": "clarify", "respond": "respond"})
graph.add_edge("respond", END)
app = graph.compile()`,G=`def route(state: AgentState) -> str:
    if state["attempts"] >= MAX_ATTEMPTS:
        return "fallback"       # always provide an exit
    if len(state["results"]) < 3:
        return "search_again"   # loop back
    return "respond"

graph.add_conditional_edges("evaluate", route,
    {"search_again": "search", "respond": "respond", "fallback": "fallback"})`,M=`from langgraph.errors import GraphRecursionError

# Compile with safety limit (default=25 — lower during dev to fail fast)
app = graph.compile(recursion_limit=10)

try:
    result = app.invoke(input, config=config)
except GraphRecursionError:
    return {"error": "Could not complete in the allowed steps — please rephrase"}`,R=`from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.sqlite import SqliteSaver

# Development: in-memory (lost on restart)
app = graph.compile(checkpointer=MemorySaver())

# Production: SQLite (single-process) or PostgreSQL (multi-process)
with SqliteSaver.from_conn_string("checkpoints.db") as cp:
    app = graph.compile(checkpointer=cp)

# thread_id isolates each conversation
config = {"configurable": {"thread_id": "user_123_session_456"}}
app.invoke({"messages": [HumanMessage("2BHK in Bandra")]}, config=config)
# Next turn — LangGraph loads full prior state automatically
app.invoke({"messages": [HumanMessage("Under 2Cr")]}, config=config)`,D=`def classify_node(state: AgentState) -> dict:
    result = classifier.classify(state["messages"][-1].content)
    return {
        "classification": result,   # always write fresh — never carry old value
        "needs_clarification": result["confidence"] < 0.6,
    }`,I=`# Pause BEFORE executing "execute_action" — action has NOT run yet
app = graph.compile(checkpointer=memory, interrupt_before=["execute_action"])

result = app.invoke(input, config=config)   # runs until interrupt

# Human reviews proposed action from state
pending  = app.get_state(config)
proposed = pending.values["proposed_action"]

from langgraph.types import Command

if human_approves(proposed):
    app.invoke(Command(resume=None), config=config)   # stable resume (LangGraph 0.2+)
else:
    app.invoke(
        Command(update={"messages": [HumanMessage("Action rejected.")]}),
        config=config,
    )`,W=`── HITL Sequence: 4 Actors, 2 HTTP Requests ─────────────────────────────────

   User Browser      FastAPI Server     LangGraph App    Checkpoint Store
        │                  │                  │                  │
        │──POST /chat──────►│                  │                  │
        │                  │──app.invoke()────►│                  │
        │                  │                  │──save state──────►│
        │                  │                  │──[INTERRUPT: execute_action]
        │                  │◄─{state, interrupt}                  │
        │◄──"Proposed: X"──│                  │                  │
        │                  │                  │                  │
  [human reads, decides]   │                  │                  │
        │                  │                  │                  │
        │──POST /approve───►│                  │                  │
        │                  │──app.invoke(Command(resume=None))───►│
        │                  │                  │◄─load state───────│
        │                  │                  │ [resumes at execute_action]
        │                  │                  │──save final state►│
        │                  │◄─{completed}─────│                  │
        │◄──final result───│                  │                  │

Key facts:
• Interrupt = serialise state to checkpoint → return from invoke() → server responds HTTP
• Resume   = second HTTP request → load checkpoint → continue from interrupt point
• State survives server restart iff using SqliteSaver/PostgresSaver (not MemorySaver)
• thread_id in config ties the two requests together`,H=`# Each specialist is a compiled subgraph with its own state
search_app = build_search_graph().compile()

def search_subgraph_node(state: AgentState) -> dict:
    result = search_app.invoke({
        "query":   state["messages"][-1].content,
        "filters": state["classification"],
    })
    return {"search_results": result["results"]}

parent_graph.add_node("search", search_subgraph_node)`,P=`from typing import TypedDict
from langgraph.graph import StateGraph, END

# ── Subgraph: completely isolated state schema ─────────────────────────────
class SearchState(TypedDict):
    query:   str
    filters: dict
    results: list[dict]

def execute_search(state: SearchState) -> dict:
    return {"results": property_db.search(state["query"], filters=state["filters"])}

search_graph = StateGraph(SearchState)
search_graph.add_node("search", execute_search)
search_graph.set_entry_point("search")
search_graph.add_edge("search", END)
search_app = search_graph.compile()

# ── Parent: bridge state at the call boundary ─────────────────────────────
class AgentState(TypedDict):
    messages:       list
    active_filters: dict
    search_results: list[dict]

def run_search_subgraph(state: AgentState) -> dict:
    # Map parent fields → subgraph input
    result = search_app.invoke({
        "query":   state["messages"][-1].content,
        "filters": state["active_filters"],
    })
    # Map subgraph output → parent state update
    return {"search_results": result["results"]}

parent = StateGraph(AgentState)
parent.add_node("search",  run_search_subgraph)
parent.add_node("respond", respond_node)
parent.set_entry_point("search")
parent.add_edge("search",  "respond")
parent.add_edge("respond", END)

# ── Native subgraph (LangGraph 0.2+) — when state schemas share keys ──────
# If SearchState and AgentState both have "query", LangGraph auto-maps it:
# parent.add_node("search", search_app)  # no wrapper node needed`,q={updates:`# Mode: "updates" — partial dict of changed fields after each node
async for update in app.astream(input, config, stream_mode="updates"):
    node_name, changed = next(iter(update.items()))
    print(f"Node '{node_name}' updated: {list(changed.keys())}")
    # → Node 'classify' updated: ['classification', 'tier']
    # → Node 'respond'  updated: ['messages']`,values:`# Mode: "values" — full state snapshot after each node
async for state in app.astream(input, config, stream_mode="values"):
    print(state["messages"][-1].content)`,messages:`# Mode: "messages" — individual LLM tokens as they stream
async for chunk, metadata in app.astream(input, config, stream_mode="messages"):
    if chunk.content:
        print(chunk.content, end="", flush=True)
        # metadata["langgraph_node"] → which node produced this chunk`,astream_events:`# Mode: astream_events — everything: tokens + tool calls + node transitions
async for event in app.astream_events(input, config, version="v2"):
    match event["event"]:
        case "on_chat_model_stream":
            print(event["data"]["chunk"].content, end="", flush=True)
        case "on_tool_start":
            print(f"\\n→ {event['name']}({event['data']['input']})")
        case "on_tool_end":
            print(f"  ← {str(event['data']['output'])[:100]}")`},_=[{mode:"astream_events",label:"astream_events",desc:"Yields all events with metadata.",useCase:"Full observability — tokens, tool calls, node transitions in one stream.",border:"var(--accent, #89b4fa)",bg:"#89b4fa08",labelColor:"#89b4fa"},{mode:"messages",label:'"messages"',desc:"Yields LLM token stream.",useCase:"Streaming UI responses — real-time typing effect over SSE.",border:"var(--accent5, #cba6f7)",bg:"#cba6f708",labelColor:"#cba6f7"},{mode:"values",label:'"values"',desc:"Yields full state after each node.",useCase:"State snapshots — building UI that reflects current agent state.",border:"var(--accent2, #a6e3a1)",bg:"#a6e3a108",labelColor:"#a6e3a1"},{mode:"updates",label:'"updates"',desc:"Yields node output diffs.",useCase:"Incremental state patches — lightweight monitoring, debugging.",border:"var(--muted, #45475a)",bg:"#45475a18",labelColor:"#bac2de"}];function z(){const[n,g]=x.useState({astream_events:!1,messages:!1,values:!1,updates:!1});function r(s){g(l=>({...l,[s]:!l[s]}))}function p(s){if(s>=_.length)return null;const l=_[s],f=n[l.mode];return e.jsxs("div",{style:{border:`1.5px solid ${l.border}`,borderRadius:"8px",padding:s===_.length-1?"12px":"16px",background:l.bg,position:"relative"},children:[e.jsxs("div",{onClick:()=>r(l.mode),style:{cursor:"pointer",userSelect:"none",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"8px"},children:[e.jsxs("div",{children:[e.jsx("span",{style:{fontFamily:"monospace",fontWeight:700,fontSize:"0.88rem",color:l.labelColor},children:l.label}),e.jsx("span",{style:{color:"#6c7086",fontSize:"0.78rem",marginLeft:"10px"},children:l.desc}),e.jsxs("div",{style:{fontSize:"0.75rem",color:"#bac2de",marginTop:"3px"},children:[e.jsx("span",{style:{color:"#6c7086"},children:"Use for: "}),l.useCase]})]}),e.jsx("span",{style:{fontSize:"0.72rem",color:"#6c7086",flexShrink:0,paddingTop:"2px"},children:f?"▲ hide":"▼ code"})]}),f&&e.jsx("pre",{style:{marginTop:"12px",marginBottom:"10px",background:"#1e1e2e",color:"#cdd6f4",fontSize:"0.73rem",lineHeight:"1.55",padding:"10px 12px",borderRadius:"6px",overflowX:"auto",border:"1px solid #313244"},children:q[l.mode]}),s<_.length-1&&e.jsx("div",{style:{marginTop:"12px"},children:p(s+1)})]})}return e.jsxs("div",{style:{margin:"16px 0"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"10px"},children:"STREAMING MODES — each outer mode is a superset of the inner (click any card to see code)"}),p(0)]})}const B=`# LangGraph has 4 streaming modes — pick based on what you need downstream

# Mode 1: "updates" — partial dict of changed fields after each node (most efficient)
async for update in app.astream(input, config, stream_mode="updates"):
    node_name, changed = next(iter(update.items()))
    print(f"Node '{node_name}' updated: {list(changed.keys())}")
    # → Node 'classify' updated: ['classification', 'tier']
    # → Node 'respond'  updated: ['messages']

# Mode 2: "values" — full state snapshot after each node (convenient but verbose)
async for state in app.astream(input, config, stream_mode="values"):
    print(state["messages"][-1].content)

# Mode 3: "messages" — individual LLM tokens as they stream (real-time typing UX)
async for chunk, metadata in app.astream(input, config, stream_mode="messages"):
    if chunk.content:
        print(chunk.content, end="", flush=True)
        # metadata["langgraph_node"] → which node produced this chunk

# Mode 4: astream_events — everything; tokens + tool calls + node transitions
async for event in app.astream_events(input, config, version="v2"):
    match event["event"]:
        case "on_chat_model_stream":
            print(event["data"]["chunk"].content, end="", flush=True)
        case "on_tool_start":
            print(f"\\n→ {event['name']}({event['data']['input']})")
        case "on_tool_end":
            print(f"  ← {str(event['data']['output'])[:100]}")

# ── Bridge to SSE (how Housing.com does it) ───────────────────────────────
async def stream_to_sse(app, input, config, queue: asyncio.Queue):
    async for chunk, meta in app.astream(input, config, stream_mode="messages"):
        if chunk.content:
            await queue.put({
                "type": "token",
                "data": chunk.content,
                "node": meta.get("langgraph_node"),
            })
    await queue.put({"type": "done"})`,O=`from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-haiku-4-5-20251001")

# Step 1: build the LCEL chain as a standalone, testable unit
classify_chain = (
    ChatPromptTemplate.from_template(
        "Classify this query into intent and confidence (0–1). Return JSON.\\nQuery: {query}"
    )
    | llm
    | JsonOutputParser()
)
# Test the chain directly — no graph needed:
result = classify_chain.invoke({"query": "3BHK in Bandra"})
# {"intent": "property_search", "confidence": 0.95}

# Step 2: wrap it as a LangGraph node
def classify_node(state: AgentState) -> dict:
    result = classify_chain.invoke({"query": state["messages"][-1].content})
    return {"classification": result}

# Benefits of wrapping:
# → classify_chain is unit-testable in isolation (no graph setup needed)
# → LangSmith shows "classify_node" as a named unit in the trace
# → Swap the chain without touching graph topology`,U=`from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

embeddings  = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = FAISS.load_local("property_index", embeddings, allow_dangerous_deserialization=True)
retriever   = vectorstore.as_retriever(search_kwargs={"k": 5})

# LangChain retriever → LangGraph retrieval node
def retrieve_docs_node(state: AgentState) -> dict:
    query = state["messages"][-1].content
    docs  = retriever.invoke(query)          # standard LangChain retriever call
    return {"retrieved_docs": [d.page_content for d in docs]}

# The retriever is a plain LangChain object — it plugs directly into the node.
# No LangGraph-specific code inside the node except reading/writing state.

# Alternatively: use create_retriever_tool to make it a tool the LLM can call:
from langchain.tools.retriever import create_retriever_tool
rag_tool = create_retriever_tool(
    retriever=retriever,
    name="search_property_docs",
    description="Search RERA filings and locality guides. Use for factual property questions.",
)
# Now ToolNode can dispatch it just like any other @tool function`,F=`# ── OLD: LangChain memory (process-local, no persistence) ────────────────
from langchain.memory import ConversationBufferWindowMemory
from langchain.chains import ConversationChain

memory = ConversationBufferWindowMemory(k=5)
chain  = ConversationChain(llm=llm, memory=memory)
chain.predict(input="Find 3BHK in Bandra")  # memory lives in 'memory' Python object

# Fails when:
# - Process restarts (memory wiped)
# - Second server instance (server B has no memory of server A's conversations)
# - Two simultaneous requests (race condition on memory.chat_memory.messages)

# ── NEW: LangGraph checkpointing (persistent, scalable) ───────────────────
from langgraph.checkpoint.sqlite import SqliteSaver

with SqliteSaver.from_conn_string("checkpoints.db") as cp:
    app = graph.compile(checkpointer=cp)

config = {"configurable": {"thread_id": "user_123"}}
app.invoke({"messages": [HumanMessage("Find 3BHK in Bandra")]}, config=config)
# State written to SQLite. Restart the process, turn 2 still works:
app.invoke({"messages": [HumanMessage("Under 2Cr")]}, config=config)

# Survives process restart: ✓  (SQLite file persists)
# Works across servers:     ✓  (use PostgresSaver — shared DB)
# No race conditions:       ✓  (DB-level write serialisation)
# Observable in LangSmith:  ✓  (every turn traced automatically)`,Y=`from langgraph.types import Send
from typing import Annotated
import operator

# Send() = spawn N parallel node executions, each with independent input
# The canonical use case: search multiple data sources simultaneously

class ResearchState(TypedDict):
    original_query: str
    sub_queries:    list[str]
    all_results:    Annotated[list, operator.add]   # accumulates from all parallel runs
    final_answer:   str

# Step 1: plan node generates sub-queries
def plan_node(state: ResearchState) -> dict:
    return {"sub_queries": [
        f"{state['original_query']} Bandra West",
        f"{state['original_query']} Bandra East",
        f"{state['original_query']} sea facing premium",
    ]}

# Step 2: dispatch returns list[Send] — each spawns one "search" execution
def dispatch_searches(state: ResearchState) -> list[Send]:
    return [Send("search", {"query": q}) for q in state["sub_queries"]]
    # LangGraph runs all three "search" nodes concurrently

# Step 3: each search node runs independently
def search_node(state: dict) -> dict:
    results = property_db.search(state["query"], limit=3)
    return {"all_results": results}   # operator.add merges across parallel runs

# Step 4: respond after all searches complete
def respond_node(state: ResearchState) -> dict:
    merged = state["all_results"]     # all results from all parallel runs
    answer = llm.invoke(f"Summarise these property results: {merged}")
    return {"final_answer": answer.content}

graph = StateGraph(ResearchState)
graph.add_node("plan",    plan_node)
graph.add_node("search",  search_node)
graph.add_node("respond", respond_node)
graph.set_entry_point("plan")
graph.add_conditional_edges("plan", dispatch_searches)  # fan-out
graph.add_edge("search", "respond")                     # fan-in
graph.add_edge("respond", END)

# Wall-clock = slowest single search ≈ 0.5s (not 3 × 0.5s = 1.5s)`,X=`import os

# ── Setup: 3 env vars, zero code changes ──────────────────────────────────
os.environ["LANGCHAIN_API_KEY"]     = "ls__your_key_here"
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"]     = "housing-agent-prod"

# Every app.invoke() is now automatically traced — no decorators, no callbacks needed.
# LangSmith captures:
#   Graph topology       visual DAG of nodes and edges, rendered in the UI
#   Node execution       name, inputs, outputs, latency per node
#   LLM calls            model, full prompt, completion, token count, USD cost
#   Tool calls           name, args JSON, result, latency
#   Routing decisions    which conditional edge was taken and why
#   Thread history       all turns for a given thread_id, browseable in UI

# ── Tag runs for A/B experiments ──────────────────────────────────────────
result = app.invoke(input, config={
    **config,
    "metadata": {
        "experiment": "haiku-v2-classifier",
        "user_tier":  "premium",
        "build_sha":  "abc123f",
    },
})
# Filter by metadata in LangSmith UI → compare latency + quality across variants

# ── Read traces programmatically ──────────────────────────────────────────
from langsmith import Client
client = Client()

runs = list(client.list_runs(
    project_name="housing-agent-prod",
    execution_order=1,                     # root runs only
    filter='eq(status, "error")',          # failed runs for debugging
    limit=50,
))
for run in runs:
    print(f"{run.id}: {run.total_tokens} tokens | error={run.error}")

# ── Build evaluation datasets from production traces ──────────────────────
client.create_example(
    inputs  ={"messages": [{"role":"user","content":"3BHK Bandra under 2Cr"}]},
    outputs ={"expected_intent": "property_search", "expected_tool": "search_properties"},
    dataset_name="housing-golden-set",
)
# Run automated eval: langsmith evaluate your_run_function --dataset housing-golden-set`,Q=`from langgraph.prebuilt import create_react_agent
from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool
from langgraph.checkpoint.memory import MemorySaver

@tool
def search_properties(query: str) -> str:
    """Search property listings by natural language. Returns formatted results."""
    return str(property_db.search(query, limit=5))

@tool
def calculate_emi(principal_inr: int, rate_percent: float, years: int) -> str:
    """Calculate monthly EMI for a property loan."""
    r   = rate_percent / 100 / 12
    n   = years * 12
    emi = principal_inr * r * (1 + r)**n / ((1 + r)**n - 1)
    return f"Monthly EMI: ₹{emi:,.0f}"

llm   = ChatAnthropic(model="claude-haiku-4-5-20251001")
tools = [search_properties, calculate_emi]

# create_react_agent builds the full loop: llm → tools_condition → ToolNode → llm
agent = create_react_agent(
    model=llm,
    tools=tools,
    checkpointer=MemorySaver(),
    state_modifier="You are a helpful housing assistant for Mumbai real estate.",
)

config = {"configurable": {"thread_id": "demo_user"}}
result = agent.invoke(
    {"messages": [HumanMessage("Find 3BHK in Bandra and calculate EMI at 8.5% for 20yr")]},
    config=config,
)
# LLM calls search + calculate_emi in parallel → synthesises combined answer

# Use create_react_agent when:
#   + Tools are independent and well-described
#   + No custom state fields (just messages)
#   + No multi-node routing logic
# Use a custom StateGraph when:
#   - Custom state (active_filters, user_role, classification)
#   - Non-tool nodes (safety check, session load, intent classify)
#   - HITL on specific tools only
#   - Parallel fan-out with Send()`;function V(){return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"learning-obj",children:[e.jsx("div",{className:"learning-obj-title",children:"After this module you will be able to"}),e.jsxs("ol",{children:[e.jsx("li",{children:"Explain exactly why LCEL chains cannot express tool-use loops — with code"}),e.jsx("li",{children:"Define a StateGraph with TypedDict state, nodes, conditional edges, and compile it"}),e.jsx("li",{children:"Add checkpointing for multi-turn persistence and implement human-in-the-loop interrupts"}),e.jsx("li",{children:"Bridge subgraph state across parent/child graph boundaries"}),e.jsx("li",{children:"Choose the right streaming mode for your downstream use case"}),e.jsx("li",{children:"Map every LangChain abstraction (chain, retriever, memory, tool) to its LangGraph equivalent"}),e.jsx("li",{children:"Use Send() for parallel fan-out and LangSmith for production observability"})]}),e.jsxs("div",{className:"obj-meta",children:[e.jsx("span",{className:"obj-time",children:"⏱ ~100 minutes"}),e.jsx("span",{className:"obj-diff",children:"Difficulty: ★★★★☆"}),e.jsx("span",{className:"obj-diff",children:"Prerequisites: Module 4, Module 24"})]})]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"Housing.com Context"}),e.jsx("br",{}),"Housing.com's ",e.jsx("code",{children:"graph.py"})," IS a LangGraph StateGraph. Every concept here — state, nodes, conditional edges, checkpointing — maps directly to production code you can read at ",e.jsx("code",{children:"src/pipeline/graph.py"}),"."]}),e.jsx(C,{}),e.jsx("h2",{children:"23.1 Why LangGraph Exists — The LCEL Limitation"}),e.jsxs("p",{children:["LangChain LCEL chains are ",e.jsx("strong",{children:"acyclic"})," — data flows strictly one direction. This breaks for any agent that needs to call a tool, see the result, and decide what to do next."]}),e.jsxs("div",{className:"diagram-wrap",children:[e.jsx("div",{className:"diagram-title",children:"Chain vs Graph execution model"}),e.jsx("pre",{style:{margin:0,border:"none",background:"transparent",fontSize:"12px"},children:`LangChain LCEL:             LangGraph:
prompt | llm | parser       llm → tools_condition → ToolNode
(fixed, acyclic, one-shot)              ↑                  ↓
                                        └──────────────────┘
                                        loop until no tool_calls`})]}),e.jsx(d,{title:"Manual Tool-Use Loop — What LCEL Cannot Replace",language:"python",keyLine:13,keyNote:"Loop LangGraph replaces — no safety, no checkpointing",children:N}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"LCEL vs LangGraph — the decision rule"}),e.jsx("table",{style:{fontSize:"12px",margin:"4px 0"},children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Use LCEL if..."}),e.jsx("th",{children:"Use LangGraph if..."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Single linear pass, no branching"}),e.jsx("td",{children:"Any conditional routing"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"No multi-turn state"}),e.jsx("td",{children:"Multi-turn persistence needed"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"No loops"}),e.jsx("td",{children:"Agent needs to loop on tool results"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"No human approval steps"}),e.jsx("td",{children:"Human-in-the-loop required"})]})]})}),e.jsx("strong",{children:"Practical recommendation:"})," start with LangGraph even for simple pipelines — the overhead is minimal and you avoid a full rewrite when requirements grow. LCEL chains remain valuable as nodes ",e.jsx("em",{children:"inside"})," a LangGraph graph.",e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"Install:"})," ",e.jsx("code",{children:"pip install langgraph langchain-core langchain-anthropic"}),". LangGraph is a separate package from LangChain."]}),e.jsx(T,{}),e.jsx("h2",{children:"23.2 State, Nodes, and Edges"}),e.jsxs("p",{children:["Every LangGraph graph has a single typed state object — think of it as a ",e.jsx("strong",{children:"Redux store"}),". Every node reads from it and returns only the fields it changed. LangGraph merges that partial update into the full state, exactly like a Redux reducer returning ",e.jsx("code",{children:"{ ...state, updatedField: newValue }"}),"."]}),e.jsx(d,{title:"StateGraph with TypedDict State and Conditional Edges",language:"python",keyLine:4,keyNote:"add_messages reducer appends — without it, history is overwritten",children:A}),e.jsxs("div",{className:"callout callout-warn",children:[e.jsx("strong",{children:"The add_messages gotcha — the most common LangGraph mistake"}),"Without the ",e.jsx("code",{children:"add_messages"})," reducer annotation, returning ",e.jsx("code",{children:"{'messages': [new_msg]}"})," ",e.jsx("em",{children:"replaces"})," the entire message list. With it, the new message is appended.",e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"Concrete failure:"})," write ",e.jsx("code",{children:"messages: list"})," instead of ",e.jsx("code",{children:"messages: Annotated[list, add_messages]"})," → after turn 2, state has only the latest message — all history is gone. Debug symptom: the LLM responds as if it's always turn 1. Fix: print ",e.jsx("code",{children:'len(state["messages"])'})," after each node — it should grow every turn.",e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"How LangGraph reads it:"})," at ",e.jsx("code",{children:"graph.compile()"})," time, LangGraph calls ",e.jsx("code",{children:"get_type_hints(AgentState, include_extras=True)"})," and extracts the second argument of ",e.jsx("code",{children:"Annotated"})," as the reducer. This happens once at compile time — zero runtime cost per message."]}),e.jsx("h2",{children:"23.3 Cycles and Loops — Infinite Loop Prevention"}),e.jsx(d,{title:"Conditional Routing with Loop Exit — Attempts Counter",language:"python",keyLine:2,keyNote:"Hard exit prevents infinite loops on poor retrieval",children:G}),e.jsxs("p",{children:["Always add an ",e.jsx("code",{children:"attempts"})," counter in state with a hard limit. Without it, a consistently poor retriever creates an infinite loop. LangGraph's compile-time ",e.jsx("code",{children:"recursion_limit"})," is the backstop:"]}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"recursion_limit is the last line of defence"}),e.jsx("pre",{style:{fontSize:"11px",background:"#1e1e2e",color:"#cdd6f4",padding:"6px",borderRadius:"4px",marginTop:"4px"},children:M}),"Dev: set ",e.jsx("code",{children:"recursion_limit=5"})," to catch loops immediately. Production: 25 is safe for a 19-node pipeline with retries. A hit in production means a bug in your routing logic — don't just raise the limit."]}),e.jsx(E,{}),e.jsx("h2",{children:"23.4 Checkpointing — Multi-Turn Persistence"}),e.jsx(d,{title:"Checkpointing Setup — MemorySaver vs SqliteSaver",language:"python",keyLine:7,keyNote:"thread_id isolates each conversation — required for multi-turn",children:R}),e.jsxs("div",{className:"callout callout-warn",children:[e.jsx("strong",{children:"Stale state trap — the most common multi-turn bug"}),"The checkpoint saves ",e.jsx("strong",{children:"the entire AgentState dict"}),". When turn 2 starts, ",e.jsx("em",{children:"all fields from turn 1 persist"})," including ",e.jsx("code",{children:"classification"})," from the previous intent.",e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"Failure:"}),' node A classifies turn 1 as "search_properties". Turn 2 starts — if node A is skipped or fails, the stale classification from turn 1 routes turn 2 incorrectly.',e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"Fix:"})," nodes that own a field must always reset it:",e.jsx("pre",{style:{fontSize:"11px",background:"#1e1e2e",color:"#cdd6f4",padding:"6px",borderRadius:"4px",marginTop:"4px"},children:D}),"Memory sizing: 50 turns × 200 tokens/turn ≈ 10 KB per checkpoint write. Add a ",e.jsx("code",{children:"trim_history"})," node that slices ",e.jsx("code",{children:"messages[-40:]"})," before each turn to cap growth."]}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"This codebase vs LangGraph checkpointing"}),e.jsx("code",{children:"session_store.py"})," + Redis is a hand-rolled equivalent. The custom Redis implementation gives more control (per-field TTL, Lua CAS atomics) but requires maintenance. For new projects: ",e.jsx("code",{children:"pip install langgraph-checkpoint-postgres"})," and use ",e.jsx("code",{children:"AsyncPostgresSaver"})," — see Module 26 for the full production setup."]}),e.jsx("h2",{children:"23.5 Human-in-the-Loop (HITL)"}),e.jsx(d,{title:"Human-in-the-Loop — interrupt_before and Command Resume",language:"python",keyLine:5,keyNote:"Command(resume=None) is the stable 0.2+ API for resuming",children:I}),e.jsxs("div",{className:"callout callout-warn",children:[e.jsx("strong",{children:"invoke(None) vs Command(resume=None)"}),"Both resume a paused checkpoint, but ",e.jsx("code",{children:"invoke(None)"})," behaviour is technically version-dependent. ",e.jsx("code",{children:"Command(resume=...)"})," was introduced in LangGraph 0.2 as the explicit, stable API. Use ",e.jsx("code",{children:"Command"})," in production."]}),e.jsx("pre",{style:{fontSize:"11px",background:"#1e1e2e",color:"#cdd6f4",padding:"10px",borderRadius:"4px",margin:"8px 0",overflowX:"auto"},children:W}),e.jsxs("p",{children:[e.jsx("strong",{children:"When to use HITL:"})," before deleting or modifying records, before sending external communications, before financial transactions, before any irreversible action."]}),e.jsx("h2",{children:"23.6 Subgraphs — Composing Pipelines"}),e.jsx("p",{children:"Subgraphs enable independent development and testing of each specialist agent. Each subgraph has its own isolated TypedDict state — you bridge the two state schemas at the call boundary."}),e.jsx(d,{title:"Subgraph Node — Calling a Compiled Subgraph from Parent",language:"python",keyLine:4,keyNote:"Invoke compiled subgraph like any function — state bridged manually",children:H}),e.jsx("p",{children:"When the parent and subgraph have different state schemas (the common case), you must explicitly map fields at the call boundary:"}),e.jsx(d,{title:"Subgraph State Bridge — Isolated Schemas with Explicit Mapping",language:"python",keyLine:18,keyNote:"Map parent fields to subgraph input at call boundary explicitly",children:P}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"Subgraph benefits"}),e.jsx("br",{}),"Each subgraph can be: compiled and tested independently; versioned and deployed separately; replaced without touching the parent graph. Module 40 (multi-agent systems) uses this pattern to coordinate a planner, a search specialist, and a response writer as three separate compiled graphs."]}),e.jsx("h2",{children:"23.7 Streaming — Four Modes"}),e.jsx(z,{}),e.jsx(d,{title:"LangGraph Streaming — All Four Modes with SSE Bridge",language:"python",keyLine:9,keyNote:'"messages" mode yields individual tokens — enables real-time typing UX',children:B}),e.jsx("h2",{children:"23.8 This Codebase Mapped to LangGraph Concepts"}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"LangGraph concept"}),e.jsx("th",{children:"This codebase equivalent"}),e.jsx("th",{children:"File"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"StateGraph"})}),e.jsxs("td",{children:[e.jsx("code",{children:"build_graph()"})," returning compiled graph"]}),e.jsx("td",{children:e.jsx("code",{children:"src/pipeline/graph.py"})})]}),e.jsxs("tr",{children:[e.jsxs("td",{children:[e.jsx("code",{children:"TypedDict"})," state"]}),e.jsx("td",{children:e.jsx("code",{children:"BotState"})}),e.jsx("td",{children:e.jsx("code",{children:"src/pipeline/state.py"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Node function"}),e.jsxs("td",{children:["Each ",e.jsx("code",{children:"*_node"})," (safety, classify, fetch_data, …)"]}),e.jsx("td",{children:e.jsx("code",{children:"src/pipeline/nodes/*.py"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Conditional edge"}),e.jsxs("td",{children:[e.jsx("code",{children:"route_by_tier()"})," + ",e.jsx("code",{children:"add_conditional_edges()"})]}),e.jsx("td",{children:e.jsx("code",{children:"src/pipeline/graph.py"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Checkpointing"}),e.jsx("td",{children:"Redis session store (hand-rolled equivalent)"}),e.jsx("td",{children:e.jsx("code",{children:"src/session/store.py"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:'.astream(stream_mode="messages")'})}),e.jsxs("td",{children:[e.jsx("code",{children:"asyncio.Queue"})," + ",e.jsx("code",{children:"queue.put_nowait(frame)"})]}),e.jsx("td",{children:e.jsx("code",{children:"src/pipeline/nodes/response.py"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"HITL interrupt"}),e.jsx("td",{children:"Not implemented (no approval flows needed)"}),e.jsx("td",{children:"n/a"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Send() fan-out"}),e.jsxs("td",{children:[e.jsx("code",{children:"asyncio.gather()"})," in tool_calls_node"]}),e.jsx("td",{children:e.jsx("code",{children:"src/pipeline/nodes/processing.py"})})]})]})}),e.jsx("h2",{children:"23.9 LangChain → LangGraph: How Each Component Maps"}),e.jsx("p",{children:"LangChain and LangGraph are complementary — LangChain provides the component library (prompts, chains, retrievers, tools, output parsers), LangGraph provides the execution framework (state, routing, loops, checkpointing). You use both together."}),e.jsx("h3",{children:"23.9.1 LCEL chains → LangGraph nodes"}),e.jsx("p",{children:"Any LCEL chain can be called inside a node. Build the chain as a standalone testable unit; wrap it in a node for tracing and routing."}),e.jsx(d,{title:"LCEL Chain Wrapped as LangGraph Node — Unit-Testable Unit",language:"python",keyLine:7,keyNote:"Test the chain in isolation — no graph setup needed",children:O}),e.jsx("h3",{children:"23.9.2 LangChain retrievers → retrieval nodes"}),e.jsxs("p",{children:["Any LangChain retriever — FAISS, Pinecone, Chroma, EnsembleRetriever — plugs directly into a node. Or use ",e.jsx("code",{children:"create_retriever_tool"})," to let the LLM call it on demand via ToolNode."]}),e.jsx(d,{title:"LangChain Retriever as LangGraph Retrieval Node",language:"python",keyLine:6,keyNote:"Standard retriever.invoke() — no LangGraph-specific code inside node",children:U}),e.jsx("h3",{children:"23.9.3 LangChain memory → LangGraph checkpointing"}),e.jsx("p",{children:"LangChain memory types are process-local and don't survive restarts. LangGraph checkpointing replaces all of them with a single pattern that persists, scales, and is observable."}),e.jsx(d,{title:"LangChain Memory vs LangGraph Checkpointing — Migration",language:"python",keyLine:17,keyNote:"SqliteSaver persists across restarts — BufferWindowMemory does not",children:F}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{}),e.jsx("th",{children:"LangChain BufferWindowMemory(k=5)"}),e.jsx("th",{children:"LangGraph + SqliteSaver"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Survives restart"}),e.jsx("td",{children:"No"}),e.jsx("td",{children:"Yes"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Multi-server"}),e.jsx("td",{children:"No (sticky sessions)"}),e.jsx("td",{children:"Yes (shared DB)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Race-free"}),e.jsx("td",{children:"No"}),e.jsx("td",{children:"Yes (DB write serialisation)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Observable"}),e.jsx("td",{children:"No"}),e.jsx("td",{children:"Yes (LangSmith traces every turn)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"HITL support"}),e.jsx("td",{children:"No"}),e.jsxs("td",{children:["Yes (",e.jsx("code",{children:"interrupt_before"}),")"]})]})]})}),e.jsx("h2",{children:"23.10 Parallelism with Send()"}),e.jsxs("p",{children:[e.jsx("code",{children:"Send()"})," enables ",e.jsx("strong",{children:"dynamic fan-out"})," — spawning N parallel node executions from a single conditional edge. The canonical use case: run multiple searches simultaneously and merge results."]}),e.jsx(d,{title:"Send() Fan-Out — Parallel Searches with operator.add Merge",language:"python",keyLine:14,keyNote:"operator.add accumulates results from all parallel Send() runs",children:Y}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"Send() vs asyncio.gather()"}),e.jsx("br",{}),e.jsx("code",{children:"asyncio.gather()"})," parallelises within a single node — you write the concurrency yourself. ",e.jsx("code",{children:"Send()"})," parallelises at the graph level — each spawned execution is a separate node run, individually traced in LangSmith, individually checkpointed, and independently retryable. Use ",e.jsx("code",{children:"Send()"})," when each parallel task is large enough to warrant its own trace and checkpoint; use ",e.jsx("code",{children:"asyncio.gather()"})," inside a single node for lightweight parallel I/O (e.g. fetching 5 property details at once)."]}),e.jsx("h2",{children:"23.11 Observability — LangSmith"}),e.jsx("p",{children:"LangGraph has first-class LangSmith integration. Every graph execution is automatically traced — no decorators, no callbacks, no extra code."}),e.jsx(d,{title:"LangSmith Setup — Auto-Tracing with Metadata and Programmatic Access",language:"python",keyLine:4,keyNote:"Three env vars enable full auto-tracing — zero code changes required",children:X}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"What LangSmith shows for a LangGraph trace"}),e.jsx("br",{}),e.jsx("strong",{children:"Graph view:"})," the full compiled DAG rendered visually — nodes, edges, conditional branches — colour-coded by which paths executed in this run.",e.jsx("br",{}),e.jsx("strong",{children:"Node timeline:"})," each node as a labelled bar showing start time, end time, and latency. Slow nodes are immediately obvious.",e.jsx("br",{}),e.jsx("strong",{children:"LLM calls:"})," prompt template + filled values + completion text + token count + cost per call. Compare across runs to see if a prompt change improved quality.",e.jsx("br",{}),e.jsx("strong",{children:"Tool calls:"})," name, input args JSON, output, latency. See exactly what the agent searched for and what it got back.",e.jsx("br",{}),e.jsx("strong",{children:"Thread replay:"})," every turn for a ",e.jsx("code",{children:"thread_id"}),", in order, with full state diffs between turns."]}),e.jsx("h2",{children:"23.12 Ecosystem"}),e.jsx("h3",{children:"23.12.1 create_react_agent — prebuilt ReAct loop"}),e.jsxs("p",{children:["For tool-use agents with no custom routing, ",e.jsx("code",{children:"create_react_agent"})," builds the full ",e.jsx("code",{children:"llm → tools_condition → ToolNode → llm"})," loop in one call:"]}),e.jsx(d,{title:"create_react_agent — Prebuilt ReAct Loop with Tools",language:"python",keyLine:21,keyNote:"One call builds the full llm → tools_condition → ToolNode → llm loop",children:Q}),e.jsx("h3",{children:"23.12.2 LangGraph Platform"}),e.jsxs("p",{children:[e.jsx("strong",{children:"LangGraph Platform"})," (formerly LangGraph Cloud) is a hosted deployment layer for LangGraph agents. It provides:"]}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Persistent runs"})," — long-running graph executions that survive across HTTP requests (multi-turn conversations, background jobs)"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Built-in streaming"})," — SSE endpoint for every graph, no custom streaming code needed"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Studio UI"})," — visual graph debugger: click any node to inspect its inputs/outputs, replay a run from any checkpoint"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Cron scheduling"})," — trigger graph runs on a schedule (nightly reindexing, daily summaries)"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Double-texting handling"})," — when a user sends a new message while the previous run is still in flight, the platform queues or interrupts cleanly"]})]}),e.jsx("p",{children:"Self-hosted alternative: deploy your FastAPI + graph as a standard container. LangGraph Platform is the managed version of exactly what this codebase does manually."}),e.jsx("h3",{children:"23.12.3 Community resources"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"LangGraph templates:"})," ",e.jsx("code",{children:"langgraph-cli new --template react-agent"})," — scaffolds a production-ready agent project with Dockerfile, tests, and CI"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Prebuilt agents:"})," ",e.jsx("code",{children:"create_react_agent"}),", ",e.jsx("code",{children:"create_tool_calling_agent"}),", ",e.jsx("code",{children:"create_openai_tools_agent"})," — all in ",e.jsx("code",{children:"langgraph.prebuilt"})]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Ecosystem integrations:"})," ",e.jsx("code",{children:"langgraph-checkpoint-postgres"}),", ",e.jsx("code",{children:"langgraph-checkpoint-redis"}),", ",e.jsx("code",{children:"langgraph-checkpoint-mongodb"})]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Community graphs:"})," ",e.jsx("code",{children:"open-canvas"})," (document editing agent), ",e.jsx("code",{children:"storm"})," (research agent), ",e.jsx("code",{children:"self-rag"})," (retrieval with reflection) — all open-source LangGraph examples on GitHub"]})]}),e.jsxs("div",{className:"callout callout-maang",children:[e.jsx("strong",{children:"🎯 MAANG Interview Connection"}),'"Why LangGraph instead of calling the LLM directly?" → Three answers, each with a production consequence: (1) Typed state — every node receives a guaranteed schema, no dict key typos cause silent failures; (2) Checkpointing — multi-turn agents survive process restarts and horizontal scaling without sticky sessions; (3) Observability — every node, every LLM call, every tool dispatch is traced in LangSmith with latency and cost. The raw while-loop approach gives you none of these. Tradeoff: framework overhead (~50ms at compile time, negligible per-invocation) and a dependency.']}),e.jsx(w,{moduleId:25,title:"Module 25: LangGraph Concepts & Architecture",contentHint:"Why LCEL can't express tool-use loops, StateGraph TypedDict state add_messages reducer, conditional edges routing, MemorySaver vs SqliteSaver checkpointing stale state trap, HITL interrupt_before Command resume, subgraph state bridging, four streaming modes updates values messages astream_events, LCEL chain as LangGraph node, LangChain memory vs checkpointing comparison, Send fan-out parallelism, LangSmith auto-tracing setup, create_react_agent prebuilt"})]})}export{V as Mod24};
