import{j as e,r as b,A as S,m as k}from"./index-D4pJPyGz.js";import{Q as H}from"./QuizSection-BedG7s-t.js";import{C as a}from"./CodeBlock-dJ_hHYfw.js";const I=`import anthropic, json

client = anthropic.Anthropic()
TOOLS = [...]  # your tool definitions

def run_agent(messages: list[dict]) -> str:
    """The universal agent loop — every harness is a variant of this."""
    while True:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=8096,
            tools=TOOLS,
            messages=messages,
        )

        # Append assistant turn to history
        messages.append({"role": "assistant", "content": response.content})

        # Terminal condition: model decided it's done
        if response.stop_reason == "end_turn":
            text_blocks = [b.text for b in response.content if hasattr(b, "text")]
            return " ".join(text_blocks)

        # Tool use: execute each tool call and feed results back
        if response.stop_reason == "tool_use":
            tool_results = []
            for block in response.content:
                if block.type != "tool_use":
                    continue
                result = execute_tool(block.name, block.input)  # your dispatch
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result),
                })
            messages.append({"role": "user", "content": tool_results})
            # Loop continues — model sees tool results and decides what to do next`,O=`import anthropic, json, os, re
from pathlib import Path

client = anthropic.Anthropic()

# ── Permission gate — runs BEFORE any tool execution ────────────────────────
BLOCKED_PATTERNS = [
    r"rm\\s+-rf",
    r"git\\s+push\\s+--force",
    r"DROP\\s+TABLE",
    r"DELETE\\s+FROM\\s+\\w+\\s*;\\s*$",
]

def permission_gate(tool_name: str, tool_input: dict) -> tuple[bool, str]:
    """Return (allowed, reason). Harness intercepts before execution."""
    if tool_name == "bash":
        cmd = tool_input.get("command", "")
        for pattern in BLOCKED_PATTERNS:
            if re.search(pattern, cmd, re.IGNORECASE):
                return False, f"Blocked: matches dangerous pattern '{pattern}'"
    if tool_name == "write_file":
        path = tool_input.get("path", "")
        if not Path(path).is_relative_to(os.getcwd()):
            return False, f"Blocked: write outside working directory ({path})"
    return True, "ok"`,M=`# ── Tool execution layer ──────────────────────────────────────────────────────
def execute_tool(name: str, args: dict) -> dict:
    allowed, reason = permission_gate(name, args)
    if not allowed:
        return {"error": reason, "blocked": True}

    if name == "read_file":
        path = args["path"]
        return {"content": Path(path).read_text()}
    if name == "write_file":
        path, content = args["path"], args["content"]
        Path(path).write_text(content)
        return {"written": len(content)}
    if name == "bash":
        import subprocess
        result = subprocess.run(args["command"], shell=True, capture_output=True, text=True)
        return {"stdout": result.stdout, "stderr": result.stderr, "exit_code": result.returncode}
    return {"error": f"Unknown tool: {name}"}`,P=`# ── Context compaction — keeps token count within limits ─────────────────────
MAX_MSGS = 40

def compact_context(messages: list[dict]) -> list[dict]:
    """When history grows long, summarise older messages."""
    if len(messages) <= MAX_MSGS:
        return messages
    older = messages[:-10]  # keep last 10 intact
    summary_prompt = [
        {"role": "user", "content": f"Summarise this conversation history in 200 words:\\n{json.dumps(older)}"},
    ]
    resp = client.messages.create(model="claude-haiku-4-5-20251001", max_tokens=400, messages=summary_prompt)
    summary_text = resp.content[0].text
    return [
        {"role": "user",      "content": f"[Earlier context summarised]: {summary_text}"},
        {"role": "assistant", "content": "Understood. Continuing from the summary."},
        *messages[-10:],
    ]`,D=`# ── Main harness entry point ──────────────────────────────────────────────────
TOOLS = [
    {"name": "read_file",  "description": "Read a file by path",
     "input_schema": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]}},
    {"name": "write_file", "description": "Write content to a file",
     "input_schema": {"type": "object", "properties": {"path": {"type": "string"}, "content": {"type": "string"}}, "required": ["path", "content"]}},
    {"name": "bash",       "description": "Run a shell command",
     "input_schema": {"type": "object", "properties": {"command": {"type": "string"}}, "required": ["command"]}},
]

def run_agent(task: str) -> str:
    messages = [{"role": "user", "content": task}]
    while True:
        messages = compact_context(messages)
        response = client.messages.create(
            model="claude-sonnet-4-6", max_tokens=8096, tools=TOOLS, messages=messages,
        )
        messages.append({"role": "assistant", "content": response.content})
        if response.stop_reason == "end_turn":
            return next((b.text for b in response.content if hasattr(b, "text")), "")
        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue
            result = execute_tool(block.name, block.input)
            tool_results.append({"type": "tool_result", "tool_use_id": block.id, "content": json.dumps(result)})
        messages.append({"role": "user", "content": tool_results})`,N=`# pyproject.toml — DeepAgents via LangGraph
[project]
dependencies = ["deepagents", "anthropic"]

# main.py
from deepagents import create_agent

agent = create_agent(
    model="claude-sonnet-4-6",
    tools=["filesystem", "bash", "browser"],
    memory=True,       # SQLite-backed persistent memory
    skills_dir="./skills",  # YAML skill definitions
    hitl=True,         # human-in-the-loop interrupts
    mcp_servers=["filesystem", "github"],  # MCP protocol
)

result = agent.run("Analyse the test failures in CI and open a fix PR")
print(result.summary)`,W=`# openclaw.yaml — OpenClaw local configuration
model: claude-sonnet-4-6
max_tokens: 8096
context_window_strategy: sliding  # or summarise / truncate

tools:
  filesystem:
    allowed_paths: ["."]
    blocked_patterns: ["*.env", "*.key", "secrets/**"]
  bash:
    blocked_commands: ["rm -rf", "git push --force", "sudo"]
  browser:
    headless: true
    allowed_domains: ["*.anthropic.com", "github.com"]
  email:                          # optional communication tools
    provider: gmail
  calendar:
    provider: google

hooks:
  pre_tool:  "./scripts/audit_tool.py"   # runs before every tool call
  post_turn: "./scripts/log_turn.py"     # runs after each assistant turn`,R=[{name:"Claude Code",org:"Anthropic",open:!1,sandboxed:!0,bench:"87.6%",bestFor:"Software engineering on real repos"},{name:"Codex CLI",org:"OpenAI",open:!1,sandboxed:!0,bench:"83.4%",bestFor:"Terminal-native coding with GPT-5.5"},{name:"OpenClaw",org:"Community",open:!0,sandboxed:!1,bench:"—",bestFor:"Local YAML-config all-rounder"},{name:"SWE-agent",org:"Princeton",open:!0,sandboxed:!0,bench:"~53%",bestFor:"Research & ACI interface design"},{name:"OpenHands",org:"All-Hands AI",open:!0,sandboxed:!0,bench:"72.0%",bestFor:"Model-agnostic Docker runtime"},{name:"DeepAgents",org:"LangChain",open:!0,sandboxed:!1,bench:"—",bestFor:"LangGraph batteries-included"},{name:"Devin",org:"Cognition AI",open:!1,sandboxed:!0,bench:"~74%",bestFor:"Zero-setup commercial; PM integrations"},{name:"HAL-Harness",org:"Princeton PLI",open:!0,sandboxed:!0,bench:"Meta",bestFor:"Reproducible evaluation across benchmarks"}];function B(){const[n,p]=b.useState(null),s=[{id:0,label:"Permission Gate",desc:"Blocks toxic, PII, competitor mentions before any processing. Fails fast — 2ms, zero LLM cost.",color:"#f38ba8",r1:140,r2:175},{id:1,label:"Tool Execution",desc:"Runs tool calls with timeout + retry. Enforces max_tool_calls=5 per turn. Logs cost per call.",color:"#fab387",r1:100,r2:139},{id:2,label:"Context Compaction",desc:"Truncates conversation to fit model context window. Preserves latest turn + system prompt.",color:"#f9e2af",r1:62,r2:99},{id:3,label:"Core Agent Loop",desc:"LangGraph graph.ainvoke(). Classify → route → tool/LLM → validate → emit SSE.",color:"#a6e3a1",r1:30,r2:61},{id:4,label:"Harness Kernel",desc:"The outermost orchestrator: session init, gate acquire/release, error recovery, metrics flush.",color:"#89b4fa",r1:0,r2:29}],r=180,o=180;function x(t,i){return[`M ${r} ${o-i}`,`A ${i} ${i} 0 1 1 ${r} ${o+i}`,`A ${i} ${i} 0 1 1 ${r} ${o-i}`,t>0?[`M ${r} ${o-t}`,`A ${t} ${t} 0 1 0 ${r} ${o+t}`,`A ${t} ${t} 0 1 0 ${r} ${o-t}`].join(" "):"","Z"].join(" ").trim()}return e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"360px 1fr",gap:"20px",margin:"24px 0",alignItems:"start"},children:[e.jsxs("svg",{viewBox:"0 0 360 360",width:"100%",style:{display:"block"},children:[s.map(t=>e.jsx("path",{d:x(t.r1,t.r2),fill:n===t.id?t.color+"55":t.color+"22",stroke:n===t.id?t.color:t.color+"88",strokeWidth:n===t.id?2:1,fillRule:"evenodd",style:{cursor:"pointer",transition:"fill .2s, stroke .2s"},onClick:()=>p(n===t.id?null:t.id)},t.id)),s.map(t=>{const i=(t.r1+t.r2)/2;return e.jsx("text",{x:r+i+10,y:o+4,fontSize:"10",fill:t.color,fontWeight:n===t.id?700:400,style:{cursor:"pointer",pointerEvents:"none"},children:t.label},t.id)}),e.jsx("text",{x:r,y:o-4,textAnchor:"middle",fontSize:"9",fill:"var(--muted)",children:"Click a"}),e.jsx("text",{x:r,y:o+8,textAnchor:"middle",fontSize:"9",fill:"var(--muted)",children:"ring"})]}),e.jsx("div",{children:e.jsx(S,{mode:"wait",children:n!==null?e.jsxs(k.div,{initial:{opacity:0,y:8},animate:{opacity:1,y:0},exit:{opacity:0,y:-8},transition:{duration:.2},style:{background:"var(--bg2)",border:`1px solid ${s[n].color}44`,borderLeft:`4px solid ${s[n].color}`,borderRadius:"8px",padding:"16px"},children:[e.jsx("div",{style:{fontWeight:700,color:s[n].color,marginBottom:"8px",fontSize:"14px"},children:s[n].label}),e.jsx("p",{style:{fontSize:"13px",color:"var(--text)",lineHeight:1.7,margin:0},children:s[n].desc})]},n):e.jsx(k.div,{initial:{opacity:0},animate:{opacity:1},style:{color:"var(--muted)",fontSize:"13px",paddingTop:"20px"},children:"Click any ring to see what that harness layer does and why."},"idle")})})]})}const $=["Block: delete_all_files","Block: external_http without approval","Block: >10 tool calls/turn","Block: git push --force to main","Block: DROP TABLE without backup check","Block: write outside repo root"];function G(){const[n,p]=b.useState(0),[s,r]=b.useState(0),o=6,x=4,t=x+n;function i(){if(n>=o)return;const h=n+1;r(m=>m+360/(x+h)),p(h)}const l=70,c=70,j=32,u=44,T=10;function E(h,m){const w=[];for(let v=0;v<h;v++){const g=2*Math.PI*v/h+m*Math.PI/180,f=Math.PI/h,_=g-f*.5,C=g+f*.5,y=u+T,A=g-f*.35,L=g+f*.35;w.push(`M ${l+u*Math.cos(_)} ${c+u*Math.sin(_)} L ${l+y*Math.cos(A)} ${c+y*Math.sin(A)} L ${l+y*Math.cos(L)} ${c+y*Math.sin(L)} L ${l+u*Math.cos(C)} ${c+u*Math.sin(C)}`)}return w.join(" ")}const d="#cba6f7";return e.jsx("div",{style:{background:"var(--bg2)",border:"1px solid #313244",borderRadius:"10px",padding:"20px",margin:"20px 0"},children:e.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"24px",flexWrap:"wrap"},children:[e.jsx("div",{style:{flexShrink:0},children:e.jsxs("svg",{width:"140",height:"140",viewBox:"0 0 140 140",children:[e.jsx("circle",{cx:l,cy:c,r:u,fill:d+"22",stroke:d+"88",strokeWidth:1.5}),e.jsx("path",{d:E(t,s),fill:d+"55",stroke:d,strokeWidth:1,strokeLinejoin:"round"}),e.jsx("circle",{cx:l,cy:c,r:j,fill:"var(--bg2)",stroke:d+"88",strokeWidth:1.5}),e.jsx("circle",{cx:l,cy:c,r:5,fill:d}),e.jsx("line",{x1:l,y1:c,x2:l+j*.8*Math.cos((s-90)*Math.PI/180),y2:c+j*.8*Math.sin((s-90)*Math.PI/180),stroke:d,strokeWidth:2,strokeLinecap:"round"})]})}),e.jsxs("div",{style:{flex:1,minWidth:"160px"},children:[e.jsxs("div",{style:{fontWeight:700,fontSize:"13px",color:"var(--text)",marginBottom:"6px"},children:["Rules added: ",e.jsx("span",{style:{color:d},children:n})," / Teeth: ",e.jsx("span",{style:{color:d},children:t})]}),e.jsx("p",{style:{fontSize:"12px",color:"var(--muted)",margin:"0 0 12px 0",lineHeight:1.6},children:"Each incident ratchets the harness forward — a new blocked pattern is added permanently. The gear never turns back."}),e.jsx("button",{onClick:i,disabled:n>=o,style:{background:n>=o?"#313244":"transparent",color:n>=o?"var(--muted)":"#f9e2af",border:`1px solid ${n>=o?"#45475a":"#f9e2af"}`,borderRadius:"6px",padding:"6px 14px",fontSize:"12px",fontWeight:600,cursor:n>=o?"not-allowed":"pointer",transition:"all .15s"},children:n>=o?"Max rules reached":"Simulate Incident"}),n>0&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"6px",marginTop:"12px"},children:$.slice(0,n).map((h,m)=>e.jsx(k.span,{initial:{opacity:0,scale:.85},animate:{opacity:1,scale:1},transition:{duration:.2},style:{display:"inline-block",border:"1px solid #f9e2af",color:"#f9e2af",fontSize:"11px",padding:"3px 8px",borderRadius:"12px",background:"#f9e2af11"},children:h},m))})]})]})})}function F(){const[n,p]=b.useState(null);return e.jsxs("div",{style:{overflowX:"auto",margin:"1.5rem 0"},children:[e.jsxs("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:"0.83rem"},children:[e.jsx("thead",{children:e.jsxs("tr",{style:{background:"#313244"},children:[e.jsx("th",{style:{textAlign:"left",padding:"8px 10px",color:"#cba6f7"},children:"Harness"}),e.jsx("th",{style:{textAlign:"left",padding:"8px 10px",color:"#89b4fa"},children:"Org"}),e.jsx("th",{style:{textAlign:"center",padding:"8px 10px",color:"#a6e3a1"},children:"Open Source"}),e.jsx("th",{style:{textAlign:"center",padding:"8px 10px",color:"#89dceb"},children:"Sandboxed"}),e.jsx("th",{style:{textAlign:"center",padding:"8px 10px",color:"#fab387"},children:"SWE-bench"}),e.jsx("th",{style:{textAlign:"left",padding:"8px 10px",color:"#cdd6f4"},children:"Best for"})]})}),e.jsx("tbody",{children:R.map(s=>e.jsxs("tr",{onMouseEnter:()=>p(s.name),onMouseLeave:()=>p(null),style:{background:n===s.name?"#313244":"transparent",cursor:"default"},children:[e.jsx("td",{style:{padding:"7px 10px",color:"#cba6f7",fontWeight:600,borderBottom:"1px solid #313244"},children:s.name}),e.jsx("td",{style:{padding:"7px 10px",color:"#a6adc8",borderBottom:"1px solid #313244"},children:s.org}),e.jsx("td",{style:{padding:"7px 10px",textAlign:"center",borderBottom:"1px solid #313244",color:s.open?"#a6e3a1":"#f38ba8"},children:s.open?"✓":"✗"}),e.jsx("td",{style:{padding:"7px 10px",textAlign:"center",borderBottom:"1px solid #313244",color:s.sandboxed?"#a6e3a1":"#f38ba8"},children:s.sandboxed?"✓":"✗"}),e.jsx("td",{style:{padding:"7px 10px",textAlign:"center",borderBottom:"1px solid #313244",color:"#fab387",fontWeight:600},children:s.bench}),e.jsx("td",{style:{padding:"7px 10px",color:"#cdd6f4",borderBottom:"1px solid #313244"},children:s.bestFor})]},s.name))})]}),e.jsx("p",{style:{fontSize:"0.75rem",color:"#6c7086",marginTop:"0.4rem"},children:"SWE-bench Verified scores (Jun 2026). HAL-Harness is used to run evaluations, not to be evaluated. OpenClaw/DeepAgents are frameworks, not bench targets."})]})}function Y(){return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"learning-obj",children:[e.jsx("div",{className:"learning-obj-title",children:"After this module you will be able to"}),e.jsxs("ol",{children:[e.jsx("li",{children:"Explain what a harness is and why ~98% of Claude Code is harness infrastructure, not model logic"}),e.jsx("li",{children:"Name the 5 layers of a harness and what belongs in each one"}),e.jsx("li",{children:"Write a universal agent loop from scratch with a permission gate and context compaction"}),e.jsx("li",{children:"Compare 8 harnesses in the 2026 ecosystem and select the right one for a given use case"}),e.jsx("li",{children:"Configure DeepAgents and OpenClaw for local agent tasks using YAML"})]}),e.jsxs("div",{className:"obj-meta",children:[e.jsx("span",{className:"obj-time",children:"⏱ ~45 min read + 30 min lab"}),e.jsx("span",{className:"obj-diff",children:"Difficulty: ★★★☆☆"}),e.jsx("span",{className:"obj-diff",children:"Prerequisites: Module 41 (Agent Architectures)"})]})]}),e.jsx("h2",{children:"§H.1 What is a Harness?"}),e.jsxs("p",{children:["An agent is a model plus a harness. The model supplies the reasoning; the harness supplies everything else. When Anthropic published Claude Code, they noted that only ~1.6% of the codebase is AI decision logic — the remaining ",e.jsx("strong",{children:"98.4% is harness infrastructure"}),": tool execution, context management, permission gates, observability hooks, and the while-loop that connects it all."]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"Harness vs Scaffold"}),e.jsx("br",{}),'The terms are used interchangeably in 2026 community practice. Historically, "scaffold" meant the operational infrastructure (ReAct loop, tool dispatch, context trimming) while "harness" meant the evaluation environment (HAL-Harness, SWE-bench test driver). In everyday usage today, both words refer to the full stack described in this module.']}),e.jsx("p",{children:"The simplest harness is a while-loop. Every production harness — Claude Code, Codex CLI, OpenHands — is a while-loop plus layers of infrastructure wrapped around it."}),e.jsx("h2",{children:"§H.2 The 5 Layers of a Harness"}),e.jsx("p",{children:"Addy Osmani's model (popularised in his 2025 AI engineering guide) breaks any harness into five concentric concerns. Click a ring to explore each layer."}),e.jsx(B,{}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Layer"}),e.jsx("th",{children:"Files / components in Claude Code"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Context & Knowledge"})}),e.jsx("td",{children:"CLAUDE.md · .claude/settings.json · MCP server schemas · injected git diff"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Execution Loop"})}),e.jsx("td",{children:"Main agent loop, stop_reason dispatch, turn counter, retry / backoff"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Tool Integration"})}),e.jsx("td",{children:"Bash · Read · Edit · Write · WebSearch · WebFetch · Grep"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Orchestration & Control"})}),e.jsx("td",{children:"Permission gate · hooks (pre/post tool) · sub-agent fork · TaskCreate/Update"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Observability"})}),e.jsx("td",{children:"LangSmith @traceable · structured JSONL logs · playground UI"})]})]})}),e.jsx("h2",{children:"§H.3 The Universal Agent Loop"}),e.jsx("p",{children:"Every harness you will encounter is a variant of this pattern. Memorise the shape — the differences between Claude Code, OpenHands, and DeepAgents are in the layers around it, not in the loop itself."}),e.jsx(a,{title:"Universal Agent Loop",language:"python",keyLine:13,keyNote:"while True is the heartbeat — model loops until done",children:I}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"stop_reason dispatch"})," — The two terminal states are ",e.jsx("code",{children:'"end_turn"'})," (model is done) and ",e.jsx("code",{children:'"max_tokens"'})," (truncated, usually an error). The active state is ",e.jsx("code",{children:'"tool_use"'}),". Any other stop_reason is unexpected — log it and break."]}),e.jsx("h2",{children:"§H.4 The Ratchet Principle"}),e.jsxs("p",{children:["The most important design heuristic in harness engineering: ",e.jsx("strong",{children:"every agent failure should produce a harness update"}),". When Claude Code runs ",e.jsx("code",{children:"rm -rf /"}),", the harness gets a new blocked pattern. When it hallucinates a file path, CLAUDE.md gets a clarifying instruction. The ratchet only turns forward — the harness grows more capable with each incident."]}),e.jsx("p",{children:"In practice this means every line in your AGENTS.md or CLAUDE.md traces to a specific failure. If you cannot explain why a rule exists, it is dead weight — remove it."}),e.jsxs("div",{className:"callout callout-warn",children:[e.jsx("strong",{children:"Harness rot"})," — Rules added without a clear failure root cause accumulate over months. A harness with 200 vague rules performs worse than one with 20 precise ones. Audit your context files quarterly."]}),e.jsx(G,{}),e.jsx("h2",{children:"§H.5 Building a Production Harness"}),e.jsxs("p",{children:["Three components separate a toy while-loop from a production harness: a ",e.jsx("strong",{children:"permission gate"}),", ",e.jsx("strong",{children:"context compaction"}),", and ",e.jsx("strong",{children:"structured tool dispatch"}),"."]}),e.jsxs("div",{children:[e.jsx("h4",{style:{color:"var(--accent)",marginBottom:8},children:"① Permission Gate"}),e.jsx(a,{title:"permission_gate.py",language:"python",children:O})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{color:"var(--accent)",marginBottom:8},children:"② Tool Execution"}),e.jsx(a,{title:"tool_execution.py",language:"python",children:M})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{color:"var(--accent)",marginBottom:8},children:"③ Context Compaction"}),e.jsx(a,{title:"context_compaction.py",language:"python",children:P})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{color:"var(--accent)",marginBottom:8},children:"④ Main Harness Loop"}),e.jsx(a,{title:"main_harness.py",language:"python",children:D})]}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"10 focused tools beats 50 overlapping ones"})," — the model must hold the full tool menu in its working memory at every step. A narrow, well-named tool set reduces misuse and token waste. Start with read_file, write_file, bash, and browser — add only when a specific task demands it."]}),e.jsx("h2",{children:"§H.6 The 2026 Harness Ecosystem"}),e.jsx("p",{children:"Eight harnesses dominate the 2026 landscape. They differ on four axes: open-source vs commercial, sandboxed execution, SWE-bench performance, and primary use case."}),e.jsx(F,{}),e.jsx("h2",{children:"§H.7 Claude Code (Anthropic)"}),e.jsx("p",{children:"The harness you are using right now. 87.6% on SWE-bench Verified with Opus 4.8 (Jun 2026) — the highest published score for a general-purpose coding agent."}),e.jsxs("p",{children:["Five configuration layers stack in order: ",e.jsx("strong",{children:"CLAUDE.md"})," (persistent instructions) → ",e.jsx("strong",{children:"MCP servers"})," (tool extension) → ",e.jsx("strong",{children:"settings.json"})," (tool permissions) → ",e.jsx("strong",{children:"hooks"})," (pre/post-tool shell scripts) → ",e.jsx("strong",{children:"LangSmith observability"}),"."]}),e.jsx(a,{title:"Claude Code — Install and Launch",language:"bash",keyLine:5,keyNote:"Launch in any project dir — harness auto-reads CLAUDE.md",children:`# Install and authenticate
npm install -g @anthropic-ai/claude-code
claude login

# Launch in a project
cd your-project && claude

# Inspect active configuration
claude config list`}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"CLAUDE.md is layer 1"})," — everything you write there is injected into every turn's context. It is your primary lever for steering harness behaviour without touching code."]}),e.jsx("h2",{children:"§H.8 Codex CLI (OpenAI)"}),e.jsxs("p",{children:["OpenAI's terminal-native coding agent. 83.4% on Terminal-Bench 2.1 with GPT-5.5. Built around an ",e.jsx("strong",{children:"App Server architecture"})," with three primitives: ",e.jsx("em",{children:"thread"})," (a conversation), ",e.jsx("em",{children:"turn"})," (one model response), and ",e.jsx("em",{children:"item"})," (a single content block)."]}),e.jsx("p",{children:"Key differentiator: sandboxed execution via Docker-isolated subprocess — every bash command runs inside a clean container by default. This makes it safer for autonomous operation on large codebases but adds ~300ms overhead per bash call."}),e.jsx(a,{title:"Codex CLI — Install and Task",language:"bash",keyLine:3,keyNote:"Single command drives a full multi-file refactor autonomously",children:`npm install -g @openai/codex
codex login
codex "Refactor all async functions in src/ to use structured error handling"`}),e.jsx("h2",{children:"§H.9 OpenClaw"}),e.jsxs("p",{children:["The open-source all-rounder. 100K+ GitHub stars (Feb 2026). Model-agnostic (Claude, GPT, Ollama). Configured entirely through a local ",e.jsx("code",{children:"openclaw.yaml"})," file — no cloud account required after authentication."]}),e.jsxs("p",{children:["Ships with filesystem, bash, browser, email, and calendar tools out of the box. The ",e.jsx("code",{children:"hooks"})," field lets you inject custom Python scripts before and after every tool call — the same pattern as Claude Code hooks."]}),e.jsx(a,{title:"OpenClaw YAML Configuration",language:"yaml",keyLine:8,keyNote:"blocked_patterns gate runs before any tool execution",children:W}),e.jsx("h2",{children:"§H.10 DeepAgents (LangChain) & OpenHands"}),e.jsxs("p",{children:[e.jsx("strong",{children:"DeepAgents"})," is LangChain's batteries-included harness — a thin CLI wrapper around LangGraph with sub-agents, filesystem tools, persistent SQLite memory, HITL interrupt support, YAML skill definitions, and MCP server integration."]}),e.jsx(a,{title:"DeepAgents — LangGraph Setup",language:"python",keyLine:6,keyNote:"hitl=True enables human-in-the-loop interrupts out of the box",children:N}),e.jsxs("p",{children:[e.jsx("strong",{children:"OpenHands"})," (formerly OpenDevin, 71.4K stars) is the model-agnostic alternative: Docker Runtime isolates every action, supports Claude/GPT/Ollama interchangeably, and reached 72% SWE-bench with Claude 4. Choose OpenHands when you need provider flexibility; choose DeepAgents when you are already in the LangChain ecosystem."]}),e.jsx(a,{title:"OpenHands — Docker-Based Launch",language:"bash",keyLine:3,keyNote:"-v mounts your workspace; every action runs sandboxed inside Docker",children:`# OpenHands — Docker-based
docker pull ghcr.io/all-hands-ai/runtime:0.40-nikolaik
docker run -it --rm \\
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \\
  -v $(pwd):/workspace \\
  ghcr.io/all-hands-ai/openhands:0.40 \\
  python -m openhands.core.main -t "Fix the failing tests in src/"`}),e.jsx("h2",{children:"§H.11 SWE-agent & HAL-Harness"}),e.jsxs("p",{children:[e.jsx("strong",{children:"SWE-agent"})," (Princeton) is research-first. It introduced the ",e.jsx("em",{children:"Agent-Computer Interface (ACI)"})," concept — a principled design for what tools an agent needs to work in a terminal environment. Its ACITools (search_file, open, goto, scroll, edit) are now widely copied. If you are building a new harness from scratch, read SWE-agent's ACI paper before designing your tool schema."]}),e.jsxs("p",{children:[e.jsx("strong",{children:"HAL-Harness"})," (Princeton PLI) is a meta-harness: it wraps other agents and evaluates them across SWE-bench, USACO, AppWorld, and tau-bench in a reproducible, containerised environment. Use it when you need to benchmark your own harness against published baselines — not for day-to-day tasks."]}),e.jsx(a,{title:"HAL-Harness — Benchmark Any Agent",language:"bash",keyLine:3,keyNote:"--agent swaps in any harness for reproducible cross-benchmark comparison",children:`# HAL-Harness — evaluate any agent
pip install hal-harness
hal-eval \\
  --agent claude-code \\
  --benchmark swe-bench-verified \\
  --n-samples 50 \\
  --output-dir ./results`}),e.jsx("h2",{children:"§H.12 Housing.com Connection"}),e.jsx("p",{children:"The chatbot pipeline you have been building throughout this course is a minimal harness. Map it to the 5-layer model:"}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Harness layer"}),e.jsx("th",{children:"Housing.com chatbot equivalent"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Context & Knowledge"})}),e.jsx("td",{children:"SLM taxonomy prompt · CLAUDE.md · domain registry (intent_registry.py)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Execution Loop"})}),e.jsx("td",{children:"LangGraph StateGraph in graph.py — nodes replace the while-loop"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Tool Integration"})}),e.jsx("td",{children:"property_search · budget_calculator · loan_eligibility · area_insights tools"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Orchestration & Control"})}),e.jsx("td",{children:"Classifier confidence threshold gate · session store (Redis) · PII scrubber"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Observability"})}),e.jsx("td",{children:"LangSmith @traceable on every node · playground.html · structured JSONL logs"})]})]})}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"Upgrade path"})," — When your LangGraph pipeline outgrows its current form, DeepAgents or OpenHands are natural next steps: they add persistent memory, HITL interrupts, and Docker sandboxing without requiring you to rewrite the core loop. The 5-layer model stays the same; only the implementation swaps."]}),e.jsxs("div",{className:"callout callout-maang",children:[e.jsx("strong",{children:'MAANG interview: "Design an autonomous coding agent for a 50-engineer team. What infrastructure does it need beyond the model itself?"'}),e.jsx("br",{}),e.jsx("strong",{children:"A:"})," The harness stack, not the model, is the answer. (1) ",e.jsx("em",{children:"Context layer"}),": AGENTS.md with coding standards, blocked patterns, and project topology — injected into every turn. (2) ",e.jsx("em",{children:"Execution loop"}),": while-loop with stop_reason dispatch, turn counter (prevent infinite loops), exponential backoff on API errors. (3) ",e.jsx("em",{children:"Tool layer"}),": 8–12 focused tools — read, write, bash (sandboxed), grep, browser for docs. No more, or the model mis-selects. (4) ",e.jsx("em",{children:"Orchestration"}),": permission gate blocking ",e.jsx("code",{children:"rm -rf"})," / force-push / DROP TABLE; HITL interrupt for all writes outside the repo; context compaction at ~40 turns to stay within the 200K window. (5) ",e.jsx("em",{children:"Observability"}),": LangSmith @traceable on every tool call, cost-per-session dashboard, automated red-teaming weekly. The ratchet principle: every incident produces a new gate or context rule — the harness gets safer automatically. At 50 engineers you also need multi-tenancy: per-team AGENTS.md overlays and separate LangSmith projects so signal doesn't mix."]}),e.jsx(H,{moduleId:52,title:"Agent Harnesses & Scaffolding",contentHint:"harness scaffold 5 layers context knowledge execution loop tool integration orchestration observability permission gate ratchet principle context compaction universal agent loop Claude Code Codex CLI OpenClaw SWE-agent OpenHands DeepAgents Devin HAL-Harness ACI agent-computer interface stop_reason tool_use end_turn LangGraph Housing.com HITL interrupt sub-agent SWE-bench 87.6% 72% YAML configuration"})]})}export{Y as ModHarness};
