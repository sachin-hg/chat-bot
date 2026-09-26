import{j as e,r as f,m as _}from"./index-D4pJPyGz.js";import{C as i}from"./CodeBlock-dJ_hHYfw.js";import{Q as v}from"./QuizSection-BedG7s-t.js";const w=`from deepagents import create_deep_agent, SubAgent, FilesystemPermission
from deepagents.backends import FilesystemBackend
from langchain_anthropic import ChatAnthropic
from langgraph.checkpoint.memory import MemorySaver

agent = create_deep_agent(
    # Model: string "provider:model" or BaseChatModel instance
    model="anthropic:claude-sonnet-4-6",

    # Custom tools (merged with built-ins: read_file, write_file, execute, ls, grep, etc.)
    tools=[my_search_tool, my_deploy_tool],

    # System prompt — always inserted FIRST, before DeepAgents defaults
    system_prompt="You are the Housing.com engineering supervisor.",

    # SubAgents — expose via task() tool automatically
    subagents=[pm_agent, em_agent, be_agent, fe_agent, qa_agent],

    # Filesystem backend — agents read/write real files under root_dir
    backend=FilesystemBackend(root_dir="/workspace/housing"),

    # Permissions — evaluated in order, first match wins
    permissions=[
        FilesystemPermission(path="/workspace/housing/src/**", mode="allow"),
        FilesystemPermission(path="/workspace/housing/.env", mode="deny"),
        FilesystemPermission(path="/workspace/housing/migrations/**", mode="interrupt"),
    ],

    # Memory — AGENTS.md loaded into system prompt, updated by agent
    memory=["/memory/AGENTS.md"],

    # Skills — reusable behaviors loaded from SKILL.md files
    skills=["/skills/housing-api-patterns/", "/skills/testing-protocol/"],

    # HITL — pause execution before shell commands for human approval
    interrupt_on={"execute": True},

    # Checkpointing — resume after crash, same thread_id
    checkpointer=MemorySaver(),
)`,j=`# housing_team.py — Housing.com agent team as DeepAgents SubAgents
from deepagents import create_deep_agent, SubAgent, FilesystemPermission
from deepagents.backends import FilesystemBackend
from langchain_core.tools import tool
from langgraph.checkpoint.sqlite import SqliteSaver
import sqlite3

# ── Product Manager ──────────────────────────────────────────────────────────
pm_agent: SubAgent = {
    "name": "pm",
    "description": "Turns feature requests into structured engineering tickets with acceptance criteria.",
    "system_prompt": """You are the Product Manager for Housing.com's AI features team.
When given a feature request:
1. Ask one clarifying question using the write_file tool to log it (file: /tickets/clarify.md)
2. Write a structured ticket to /tickets/{HOUSE-ID}.md with: title, user_story, acceptance_criteria, priority (P0-P3)
3. Return the ticket file path.""",
    "model": "anthropic:claude-haiku-4-5-20251001",  # simple task, use cheap model
}

# ── Engineering Manager ───────────────────────────────────────────────────────
em_agent: SubAgent = {
    "name": "em",
    "description": "Decomposes tickets into BE/FE subtasks and coordinates the dev team.",
    "system_prompt": """You are the Engineering Manager for Housing.com's AI features team.
When given a ticket:
1. Read the ticket file with read_file
2. Write subtasks to /tasks/be-1.md, /tasks/be-2.md, /tasks/fe.md
3. Use task("be", ...) and task("fe", ...) to delegate implementation
4. Collect results and write a summary to /tasks/summary.md
Never write code yourself — you coordinate only.""",
    "model": "anthropic:claude-sonnet-4-6",
}

# ── Backend Developer ─────────────────────────────────────────────────────────
be_agent: SubAgent = {
    "name": "be",
    "description": "Senior Backend Engineer: implements FastAPI endpoints, Redis, PostgreSQL.",
    "system_prompt": """You are a Senior Backend Engineer at Housing.com.
Stack: FastAPI, Python 3.12, Redis, PostgreSQL, Pydantic v2.
Protocol:
  1. read_file existing endpoints to understand patterns
  2. write_file new endpoint files
  3. execute("pytest tests/ -x -q") to verify tests pass
  4. NEVER return until pytest exits 0""",
    "model": "anthropic:claude-sonnet-4-6",
}

# ── Frontend Developer ────────────────────────────────────────────────────────
fe_agent: SubAgent = {
    "name": "fe",
    "description": "Senior Frontend Engineer: implements React 19 components with TypeScript and Tailwind.",
    "system_prompt": """You are a Senior Frontend Engineer at Housing.com.
Stack: React 19, TypeScript, Tailwind CSS v4, Vite.
Protocol:
  1. read_file 2 similar components to match patterns
  2. write_file new .tsx component with co-located .test.tsx
  3. execute("npm run build --silent") to verify no TS errors
  4. NEVER return until build exits 0""",
    "model": "anthropic:claude-sonnet-4-6",
}

# ── QA Engineer ───────────────────────────────────────────────────────────────
qa_agent: SubAgent = {
    "name": "qa",
    "description": "Runs the full test suite, checks coverage, approves or rejects PRs.",
    "system_prompt": """You are the QA Engineer for Housing.com's AI features team.
Protocol:
  1. execute("pytest --cov --cov-report=term-missing -q")
  2. execute("npm run test -- --run")
  3. If coverage < 80% on changed files: write_file new test cases
  4. All green + coverage >= 80%: write_file /qa/report.md with status: approved
  5. Any failure: write_file /qa/report.md with status: rejected + exact failure details
NEVER approve with failing tests.""",
    "model": "anthropic:claude-sonnet-4-6",
    "response_format": {"type": "json_schema", "json_schema": {
        "name": "qa_result",
        "schema": {"type": "object", "properties": {
            "status": {"type": "string", "enum": ["approved", "rejected"]},
            "pr_description": {"type": "string"},
            "coverage_pct": {"type": "number"},
        }, "required": ["status"]},
    }},
}`,A=`# supervisor.py — The orchestrating agent
from deepagents import create_deep_agent, FilesystemPermission
from deepagents.backends import FilesystemBackend
from langgraph.checkpoint.sqlite import SqliteSaver
import sqlite3

conn = sqlite3.connect("checkpoints.db", check_same_thread=False)

supervisor = create_deep_agent(
    model="anthropic:claude-sonnet-4-6",
    system_prompt="""You are the engineering supervisor for Housing.com's AI features team.
You have access to: pm, em, be, fe, qa agents via the task() tool.

For a new feature request, follow this pipeline:
  1. task("pm", "Write a ticket for: {feature_request}") → get ticket path
  2. task("em", "Decompose ticket at {ticket_path} and implement it") → get summary
  3. task("qa", "Run full QA on the implementation") → get approved/rejected
  4. If rejected: task("em", "QA rejected — fix: {rejection_reason}") → retry
  5. If approved: return PR description""",

    subagents=[pm_agent, em_agent, be_agent, fe_agent, qa_agent],

    backend=FilesystemBackend(root_dir="/workspace/housing"),

    permissions=[
        FilesystemPermission(path="/workspace/housing/src/**", mode="allow"),
        FilesystemPermission(path="/workspace/housing/tests/**", mode="allow"),
        FilesystemPermission(path="/workspace/housing/.env", mode="deny"),
        FilesystemPermission(path="/workspace/housing/prod-db/**", mode="interrupt"),
    ],

    memory=["/memory/AGENTS.md"],
    skills=["/skills/housing-api-patterns/", "/skills/testing-protocol/"],
    interrupt_on={"execute": {"when": "called"}},  # human approves all shell commands
    checkpointer=SqliteSaver(conn),
)

# Run the pipeline
result = supervisor.invoke(
    {"messages": "Add saved search email alerts — users want emails when new listings match their filters"},
    config={"configurable": {"thread_id": "housing-001"}},
)
print(result["messages"][-1].content)`,S="---\nname: housing-api-patterns\ndescription: Housing.com backend API conventions — apply when writing FastAPI endpoints\nlicense: internal\n---\n\n# Housing.com API Patterns\n\n## Mandatory Conventions\n- All Pydantic models use v2 syntax (`model_config = ConfigDict(...)`)\n- All FastAPI endpoints must have `response_model=` set explicitly\n- Redis keys MUST be prefixed with `tenant_id`: `{tenant_id}:{resource}:{id}`\n- Never use `redis.keys()` — use `SCAN` with cursor instead (blocks Redis)\n- All DB queries go through the `SessionLocal` context manager\n\n## Test Requirements\n- Every new endpoint needs a corresponding `test_` function in `tests/`\n- Use `pytest.mark.asyncio` for async endpoint tests\n- Mock external HTTP calls with `httpx.MockTransport`\n- Coverage target: 85% on changed files",E=`# AGENTS.md — Housing.com Agent Team Rules
# Every rule traces to a specific production incident.

## All Agents
- max_turns: 20 — fail loudly after 20 tool calls (circuit breaker)
- Never write to /workspace/housing/.env or prod-db/ — use interrupt mode for migrations

## BE Agent
- read_file limit: use grep/glob to find the 2-3 most relevant files before read_file
- run pytest after EVERY write_file, not just at the end

## QA Agent
- All execute() calls are read-only in QA context — no writes to src/
- Run pytest before npm test — backend failures block FE execution

## Incidents Logged
- 2024-03-15: BE agent overwrote .env — added deny permission
- 2024-04-02: QA approved coverage=71% — hardened to 80% minimum
- 2024-04-18: EM fan-out to same file twice — added disjoint file rule to SKILL.md`,T=`# async_team.py — Long-running agents as AsyncSubAgents
from deepagents import create_deep_agent, AsyncSubAgent
from langchain_anthropic import ChatAnthropic

# BE agent runs on a dedicated Agent Protocol server (Docker container, long timeout)
async_be: AsyncSubAgent = {
    "name": "be",
    "description": "Backend implementation — may take 10-30 minutes for large features",
    "graph_id": "be-agent",                        # matches deployed graph name
    "url": "http://be-agent-server:8003",           # Agent Protocol server URL
    "headers": {"Authorization": "Bearer \${BE_AGENT_TOKEN}"},
}

# QA agent similarly runs background (full test suite takes ~5 minutes)
async_qa: AsyncSubAgent = {
    "name": "qa",
    "description": "Full test suite + coverage check — background, 3-8 minutes",
    "graph_id": "qa-agent",
    "url": "http://qa-agent-server:8006",
    "headers": {"Authorization": "Bearer \${QA_AGENT_TOKEN}"},
}

supervisor = create_deep_agent(
    model=ChatAnthropic(model="claude-sonnet-4-6"),
    system_prompt="""You coordinate async engineering work.
Use start_async_task("be", task) to start BE work in background.
Use start_async_task("qa", task) to start QA in background.
Use check_async_task(task_id) to poll status.
Poll every 60 seconds — don't spam check_async_task.""",
    subagents=[async_be, async_qa],  # AsyncSubAgents auto-get async tools
)

# Auto-injected async tools when AsyncSubAgent is used:
# start_async_task(agent_name, instructions) → task_id
# check_async_task(task_id) → status, result
# update_async_task(task_id, new_instructions)
# cancel_async_task(task_id)
# list_async_tasks() → all running tasks`,L=`# harness_profiles.py — Housing.com custom harness profiles
from deepagents import HarnessProfile, register_harness_profile

# BE-specific profile: append testing rules to every BE agent's system prompt
be_profile = HarnessProfile(
    name="housing-be",
    model_spec="anthropic:claude-sonnet-*",
    system_prompt_suffix="""
## Housing.com Backend Rules (always apply)
- Run pytest after EVERY write_file. Never return with red tests.
- Use Pydantic v2 ConfigDict, not class Config.
- Redis keys must be prefixed with tenant_id.
- Never use redis.keys() — use SCAN instead.""",
    excluded_tools=["write_todos"],  # BE agents don't need todo management
)
register_harness_profile(be_profile)

# QA profile: restrict to read-only operations
qa_profile = HarnessProfile(
    name="housing-qa",
    model_spec="anthropic:claude-haiku-*",
    system_prompt_suffix="You are read-only except for writing test files under tests/.",
    excluded_tools=["write_file", "edit_file"],  # QA can't modify source files
)
register_harness_profile(qa_profile)`,P=`# docker-compose.yml — Housing.com DeepAgents Team
version: "3.9"

x-deepagent-base: &deepagent-base
  image: python:3.12-slim
  environment:
    - ANTHROPIC_API_KEY=\${ANTHROPIC_API_KEY}
    - LANGCHAIN_TRACING_V2=true
    - LANGCHAIN_API_KEY=\${LANGCHAIN_API_KEY}
    - LANGCHAIN_PROJECT=housing-deepagents
  volumes:
    - ./workspace:/workspace
    - ./skills:/skills:ro
    - ./memory:/memory
  restart: unless-stopped

services:
  supervisor:
    <<: *deepagent-base
    container_name: supervisor
    command: ["python", "-m", "uvicorn", "supervisor:app", "--host", "0.0.0.0", "--port", "8000"]
    ports: ["8000:8000"]
    environment:
      - AGENT_NAME=supervisor
      - PM_URL=http://pm-server:8001
      - EM_URL=http://em-server:8002
      - BE_URL=http://be-server:8003
      - FE_URL=http://fe-server:8005
      - QA_URL=http://qa-server:8006
    volumes:
      - ./workspace:/workspace
      - ./skills:/skills:ro
      - ./memory:/memory

  pm-server:
    <<: *deepagent-base
    container_name: pm-server
    command: ["python", "-m", "uvicorn", "pm_server:app", "--host", "0.0.0.0", "--port", "8001"]
    ports: ["8001:8001"]
    volumes:
      - ./workspace/tickets:/workspace/tickets  # PM only writes tickets

  be-server:
    <<: *deepagent-base
    container_name: be-server
    command: ["python", "-m", "uvicorn", "be_server:app", "--host", "0.0.0.0", "--port", "8003"]
    ports: ["8003:8003"]
    volumes:
      - ./workspace/backend:/workspace/backend  # BE only touches backend/
      - ./workspace/tests:/workspace/tests

  fe-server:
    <<: *deepagent-base
    container_name: fe-server
    command: ["python", "-m", "uvicorn", "fe_server:app", "--host", "0.0.0.0", "--port", "8005"]
    volumes:
      - ./workspace/frontend:/workspace/frontend  # FE only touches frontend/

  qa-server:
    <<: *deepagent-base
    container_name: qa-server
    command: ["python", "-m", "uvicorn", "qa_server:app", "--host", "0.0.0.0", "--port", "8006"]
    volumes:
      - ./workspace/backend:/workspace/backend:ro   # QA read-only
      - ./workspace/frontend:/workspace/frontend:ro
      - ./workspace/tests:/workspace/tests          # QA can write tests`;function C(){const[s,a]=f.useState(null),t=[{label:"LangGraph",sublabel:"state machine runtime",fillColor:"#181825",strokeColor:"#45475a",tooltip:"LangGraph handles checkpointing and graph execution"},{label:"LangChain",sublabel:"tool calling, model abstraction",fillColor:"#1e1e2e",strokeColor:"#45475a",tooltip:"LangChain handles tool calling and model APIs"},{label:"DeepAgents Core",sublabel:"create_deep_agent, middleware stack",fillColor:"#cba6f722",strokeColor:"#cba6f7",tooltip:"DeepAgents handles context management, file tools, subagent routing, permissions"},{label:"Your Agent",sublabel:"system_prompt, tools, subagents",fillColor:"#89b4fa22",strokeColor:"#89b4fa",tooltip:"Your code: just the business logic"},{label:"Your Housing.com Task",sublabel:"",fillColor:"#a6e3a122",strokeColor:"#a6e3a1",tooltip:"The business problem you actually care about"}],o=44,y=380,c=8,n=60,d=14,h=t.length*(o+c)+30;return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"DEEPAGENTS LAYER STACK — Click a layer to inspect"}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 180px",gap:"16px",alignItems:"start"},children:[e.jsx("svg",{viewBox:`0 0 500 ${h}`,width:"100%",style:{display:"block"},"aria-label":"DeepAgents layer stack diagram",children:t.map((r,l)=>{const u=d+(t.length-1-l)*(o+c),b=l*10,k=y-b*2,g=n+b,x=s===l;return e.jsxs("g",{style:{cursor:"pointer"},onClick:()=>a(s===l?null:l),children:[e.jsx("rect",{x:g,y:u,width:k,height:o,rx:"6",fill:r.fillColor,stroke:x?r.strokeColor:"#45475a",strokeWidth:x?2:1.2}),e.jsx("text",{x:g+14,y:u+o/2-4,fontSize:"11",fill:x?r.strokeColor:"#cdd6f4",fontWeight:"700",children:r.label}),r.sublabel&&e.jsx("text",{x:g+14,y:u+o/2+10,fontSize:"9",fill:"#6c7086",children:r.sublabel}),l<t.length-1&&e.jsx("text",{x:g+k/2,y:u+o+c/2+3,fontSize:"9",fill:"#45475a",textAnchor:"middle",children:"▲"})]},l)})}),e.jsx("div",{style:{minHeight:"80px"},children:s!==null&&e.jsxs(_.div,{initial:{opacity:0,x:6},animate:{opacity:1,x:0},transition:{duration:.15},style:{background:"#1e1e2e",border:`1px solid ${t[s].strokeColor}`,borderRadius:"6px",padding:"10px 12px",fontSize:"0.76rem",color:"#bac2de",lineHeight:"1.5"},children:[e.jsx("div",{style:{fontWeight:700,color:t[s].strokeColor,marginBottom:"6px",fontSize:"0.78rem"},children:t[s].label}),t[s].tooltip]},s)})]})]})}const M=[{name:"write_todos",desc:"Manage agent todo list — tracks multi-step plan",emoji:"✅"},{name:"ls",desc:"List directory contents with file metadata",emoji:"📂"},{name:"read_file",desc:"Read any file under backend root_dir",emoji:"📄"},{name:"write_file",desc:"Create or overwrite files",emoji:"✏️"},{name:"edit_file",desc:"Modify specific lines — surgical edits",emoji:"🔧"},{name:"glob",desc:"Pattern-based file search across the workspace",emoji:"🔍"},{name:"grep",desc:"Text search — find symbol usages, string occurrences",emoji:"🔎"},{name:"execute",desc:"Run shell commands (if backend supports SandboxBackendProtocol)",emoji:"⚡"},{name:"task",desc:"Call a subagent by name (auto-added when subagents= is set)",emoji:"🤖"}];function N(){const[s,a]=f.useState(null);return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"BUILT-IN TOOLS — Included automatically by create_deep_agent()"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"10px"},children:M.map((t,o)=>e.jsxs("div",{onMouseEnter:()=>a(o),onMouseLeave:()=>a(null),style:{background:s===o?"#cba6f711":"#1e1e2e",border:`1px solid ${s===o?"#cba6f7":"#313244"}`,borderRadius:"6px",padding:"12px 14px",cursor:"default",transition:"border-color 0.15s, background 0.15s"},children:[e.jsx("div",{style:{fontSize:"1.1rem",marginBottom:"6px"},children:t.emoji}),e.jsx("div",{style:{fontFamily:"monospace",fontSize:"0.8rem",color:"#cba6f7",fontWeight:700,marginBottom:"4px"},children:t.name}),e.jsx("div",{style:{fontSize:"0.74rem",color:"#6c7086",lineHeight:"1.4"},children:t.desc})]},t.name))}),e.jsxs("div",{style:{marginTop:"12px",fontSize:"0.76rem",color:"#6c7086"},children:[e.jsx("code",{style:{color:"#cba6f7"},children:"task()"})," is only added when ",e.jsx("code",{style:{color:"#cba6f7"},children:"subagents="})," is configured. ",e.jsx("code",{style:{color:"#cba6f7"},children:"execute()"})," requires a backend that implements ",e.jsx("code",{style:{color:"#cba6f7"},children:"SandboxBackendProtocol"}),"."]})]})}const p=[{name:"TodoListMiddleware",desc:"Keeps a running TODO list in agent state",detail:"Injects a write_todos tool and persists the todo list across turns. Agents use this to track multi-step plans without losing state on long tasks.",custom:!1},{name:"SkillsMiddleware",desc:"Loads SKILL.md files into system prompt",detail:"Reads each SKILL.md from the skills= directory list, parses the YAML frontmatter, and appends the matching skill bodies to the system prompt before the LLM call.",custom:!1},{name:"FilesystemMiddleware",desc:"Enforces FilesystemPermission rules on every file tool call",detail:"Wraps read_file, write_file, edit_file, execute. For each call, evaluates permissions in declaration order. First match wins: allow passes through, deny raises PermissionError, interrupt pauses for human approval.",custom:!1},{name:"SubAgentMiddleware",desc:"Adds task() tool, routes to correct subagent",detail:"Injects the task(agent_name, instructions) tool into the agent's tool list. When the LLM calls task(), routes the invocation to the matching SubAgent by name.",custom:!1},{name:"SummarizationMiddleware",desc:"Compresses old messages when context > threshold",detail:"Monitors token count of the messages list. When it crosses a configurable threshold, summarizes the oldest N messages into a single <summary> message, keeping the context window from overflowing.",custom:!1},{name:"PatchToolCallsMiddleware",desc:"Fixes malformed tool calls from the LLM",detail:"Applies a set of heuristic patches to tool call inputs before execution: JSON string unescaping, missing required field injection, type coercion. Prevents retries caused by LLM formatting errors.",custom:!1},{name:"[YOUR MIDDLEWARE]",desc:"Inject custom logic here",detail:"Pass a list of custom middleware classes to create_deep_agent(middleware=). They are inserted at this position — after built-in patches, before provider-specific caching. Your middleware sees clean, valid tool calls.",custom:!0},{name:"AnthropicPromptCachingMiddleware",desc:"Adds cache_control breakpoints for Anthropic",detail:'Inserts cache_control: {type: "ephemeral"} breakpoints at the system prompt and at the tool definitions boundary. Reduces cost by up to 90% on repeated calls with the same system prompt + tools.',custom:!1},{name:"MemoryMiddleware",desc:"Loads and saves AGENTS.md memory",detail:"On each agent invocation: reads AGENTS.md from the memory= path and appends it to the system prompt. On completion: if the agent updated memory with write_file, persists the new version.",custom:!1},{name:"HumanInTheLoopMiddleware",desc:"Pauses for human approval on interrupt_on tools",detail:'When interrupt_on={"execute": True} is set and the LLM calls execute(), the middleware pauses the graph and emits an interrupt event. Execution resumes only when a human approves via .resume() or the LangGraph Platform UI.',custom:!1},{name:"AsyncSubAgentMiddleware",desc:"Manages background async subagent tasks",detail:"Handles AsyncSubAgent routing. Injects start_async_task, check_async_task, update_async_task, cancel_async_task, list_async_tasks tools. Communicates with the Agent Protocol server via HTTP.",custom:!1}];function I(){const[s,a]=f.useState(null);return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"MIDDLEWARE STACK — Executed in order on every agent turn"}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 210px",gap:"16px",alignItems:"start"},children:[e.jsxs("div",{children:[p.map((t,o)=>e.jsxs("div",{onMouseEnter:()=>a(o),onMouseLeave:()=>a(null),style:{display:"flex",alignItems:"center",gap:"10px",padding:"8px 12px",marginBottom:"4px",background:s===o?t.custom?"#89b4fa11":"#cba6f711":"#1e1e2e",border:t.custom?`1px dashed ${s===o?"#89b4fa":"#45475a"}`:`1px solid ${s===o?"#cba6f7":"#313244"}`,borderRadius:"5px",cursor:"default",transition:"background 0.12s, border-color 0.12s"},children:[e.jsx("span",{style:{fontSize:"0.7rem",color:"#45475a",minWidth:"18px",textAlign:"right",fontFamily:"monospace"},children:o+1}),e.jsx("span",{style:{fontFamily:"monospace",fontSize:"0.78rem",color:t.custom?"#89b4fa":"#cba6f7",flex:1,fontWeight:t.custom?400:600},children:t.name}),t.custom&&e.jsx("span",{style:{fontSize:"0.7rem",color:"#6c7086",fontFamily:"sans-serif"},children:"← inject here"}),e.jsx("span",{style:{fontSize:"0.72rem",color:"#585b70",display:"none"},children:t.desc})]},o)),e.jsx("div",{style:{textAlign:"center",padding:"10px 0 4px",fontSize:"0.82rem",color:"#a6e3a1",fontWeight:700},children:"→ LLM call"})]}),e.jsx("div",{style:{minHeight:"80px"},children:s!==null&&e.jsxs(_.div,{initial:{opacity:0,x:6},animate:{opacity:1,x:0},transition:{duration:.15},style:{background:"#1e1e2e",border:`1px solid ${p[s].custom?"#89b4fa":"#cba6f7"}`,borderRadius:"6px",padding:"12px 14px",fontSize:"0.75rem",color:"#bac2de",lineHeight:"1.5"},children:[e.jsx("div",{style:{fontWeight:700,color:p[s].custom?"#89b4fa":"#cba6f7",marginBottom:"6px",fontFamily:"monospace",fontSize:"0.76rem"},children:p[s].name}),e.jsx("div",{style:{marginBottom:"4px",fontSize:"0.72rem",color:"#6c7086"},children:p[s].desc}),p[s].detail]},s)})]})]})}const m=[{path:"/workspace/housing/src/**",mode:"allow"},{path:"/workspace/housing/tests/**",mode:"allow"},{path:"/workspace/housing/.env",mode:"deny"},{path:"/workspace/housing/prod-db/**",mode:"interrupt"}];function R(s,a){const t=s.replace(/[.+^${}()|[\]\\]/g,"\\$&").replace(/\*\*/g,"___DOUBLE___").replace(/\*/g,"[^/]*").replace(/___DOUBLE___/g,".*");try{return new RegExp(`^${t}$`).test(a)}catch{return!1}}function D(){const[s,a]=f.useState("/workspace/housing/src/api/routes.py"),t=m.findIndex(n=>R(n.path,s)),o={allow:"#a6e3a1",deny:"#f38ba8",interrupt:"#f9e2af"},y={allow:"✓ ALLOWED",deny:"✗ DENIED",interrupt:"⏸ INTERRUPT — human approval required"},c={allow:"#a6e3a110",deny:"#f38ba810",interrupt:"#f9e2af10"};return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"FILESYSTEM PERMISSION EVALUATOR — First match wins"}),e.jsxs("div",{style:{marginBottom:"16px"},children:[e.jsx("label",{style:{fontSize:"0.78rem",color:"#bac2de",display:"block",marginBottom:"6px"},children:"Test file path"}),e.jsx("input",{type:"text",value:s,onChange:n=>a(n.target.value),style:{width:"100%",boxSizing:"border-box",background:"#1e1e2e",border:"1px solid #45475a",borderRadius:"5px",padding:"8px 12px",color:"#cdd6f4",fontFamily:"monospace",fontSize:"0.84rem",outline:"none"},placeholder:"/workspace/housing/..."}),e.jsx("div",{style:{marginTop:"6px",display:"flex",gap:"6px",flexWrap:"wrap"},children:["/workspace/housing/src/api/routes.py","/workspace/housing/.env","/workspace/housing/prod-db/schema.sql"].map(n=>e.jsx("button",{onClick:()=>a(n),style:{fontSize:"0.7rem",background:"#313244",border:"1px solid #45475a",color:"#6c7086",borderRadius:"4px",padding:"2px 8px",cursor:"pointer",fontFamily:"monospace"},children:n.replace("/workspace/housing/","./")},n))})]}),e.jsx("div",{style:{marginBottom:"14px"},children:m.map((n,d)=>{const h=d===t,r=t!==-1&&d!==t;return e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px",padding:"8px 12px",marginBottom:"4px",background:h?c[n.mode]:"#1e1e2e",border:`1px solid ${h?o[n.mode]:"#313244"}`,borderRadius:"5px",opacity:r?.38:1,transition:"opacity 0.15s, border-color 0.15s"},children:[e.jsx("span",{style:{fontSize:"0.7rem",color:"#45475a",minWidth:"16px",fontFamily:"monospace"},children:d+1}),e.jsx("span",{style:{fontFamily:"monospace",fontSize:"0.82rem",color:"#cdd6f4",flex:1},children:n.path}),e.jsx("span",{style:{fontSize:"0.72rem",fontWeight:700,padding:"2px 10px",borderRadius:"10px",background:o[n.mode]+"22",color:o[n.mode],border:`1px solid ${o[n.mode]}44`,fontFamily:"monospace"},children:n.mode})]},d)})}),s&&e.jsx("div",{style:{padding:"10px 14px",borderRadius:"6px",fontSize:"0.84rem",fontWeight:700,fontFamily:"monospace",background:t===-1?"#a6e3a110":c[m[t].mode],border:`1px solid ${t===-1?"#a6e3a1":o[m[t].mode]}`,color:t===-1?"#a6e3a1":o[m[t].mode]},children:t===-1?"✓ ALLOWED (no rule matched — default allow)":y[m[t].mode]})]})}function q(){return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"learning-obj",children:[e.jsx("div",{className:"learning-obj-title",children:"After this module you will be able to"}),e.jsxs("ol",{children:[e.jsx("li",{children:"Explain how DeepAgents relates to LangGraph, LangChain, and the Claude Code harness pattern"}),e.jsxs("li",{children:["Wire up a production agent with ",e.jsx("code",{children:"create_deep_agent()"})," including backend, permissions, skills, memory, and checkpointing"]}),e.jsx("li",{children:"Design a five-agent Housing.com team as SubAgent TypedDicts with appropriate models and system prompts"}),e.jsx("li",{children:"Read and reason about the full 11-layer middleware stack — and know where to inject custom middleware"}),e.jsx("li",{children:"Configure FilesystemPermission rules and predict which rule fires for a given file path"}),e.jsxs("li",{children:["Use AsyncSubAgent to fire-and-forget long-running tasks via the Agent Protocol and poll with ",e.jsx("code",{children:"check_async_task()"})]}),e.jsx("li",{children:"Write HarnessProfile rules to append behavior to specific model specs without modifying agent code"}),e.jsx("li",{children:"Deploy the full agent team with Docker Compose using per-service volume isolation"})]}),e.jsxs("div",{className:"obj-meta",children:[e.jsx("span",{className:"obj-time",children:"⏱ ~90 minutes"}),e.jsx("span",{className:"obj-diff",children:"Difficulty: ★★★★☆"}),e.jsx("span",{className:"obj-diff",children:"Prerequisites: Modules 50, 51, 53"})]})]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"Housing.com Context"}),e.jsx("br",{}),"We rebuild the Module 53 Housing.com agent team using DeepAgents — replacing 400 lines of manual tool loops, state threading, and retry logic with a single ",e.jsx("code",{children:"create_deep_agent()"})," call. The same five roles (PM, EM, BE, FE, QA) become SubAgent TypedDicts. The same permissions and rules become first-class config."]}),e.jsx("h2",{children:"54.1 — What is DeepAgents?"}),e.jsxs("p",{children:["DeepAgents is Claude Code's harness pattern, open-sourced and generalized. ",e.jsx("code",{children:"create_deep_agent()"})," gives you a production-ready agent loop with batteries included: filesystem tools, subagent orchestration, context summarization, permissions, skills, memory — all assembled via a fixed middleware stack."]}),e.jsxs("p",{children:[e.jsx("strong",{children:"vs raw LangGraph (Module 51):"})," LangGraph gives you the engine. DeepAgents gives you the car. You can still open the hood — the compiled graph is a LangGraph StateGraph under the surface — but you do not have to build the chassis yourself."]}),e.jsxs("p",{children:[e.jsx("strong",{children:"vs raw Anthropic SDK (Module 53):"})," No manual tool loop, no manual state threading, no manual retry logic. DeepAgents handles all of it. The Module 53 PM agent (50 lines of loop boilerplate) becomes a 10-line SubAgent TypedDict."]}),e.jsxs("p",{children:[e.jsx("strong",{children:"Inspired by Claude Code:"})," The same harness pattern that powers Claude Code — skills, memory, permissions, filesystem tools — packaged into a Python library. Claude Code is not a special product; it is this pattern applied to coding tasks."]}),e.jsx(C,{}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"Install:"})," ",e.jsx("code",{children:"uv add deepagents"}),". DeepAgents depends on ",e.jsx("code",{children:"langchain-anthropic"}),", ",e.jsx("code",{children:"langgraph"}),", and ",e.jsx("code",{children:"langchain-core"}),". No separate LangGraph install needed — it is pulled transitively."]}),e.jsx("h2",{children:"54.2 — create_deep_agent() — The Full API"}),e.jsxs("p",{children:["The entire harness is configured through a single function. Every parameter is optional except ",e.jsx("code",{children:"model="}),". Start with just a model and a system prompt, then add permissions, skills, and subagents incrementally."]}),e.jsx(i,{title:"create_deep_agent() — Full annotated signature",language:"python",keyLine:2,keyNote:"one function, batteries included — filesystem tools, subagent routing, context summarization all wired automatically",children:w}),e.jsxs("div",{className:"callout callout-gotcha",children:[e.jsx("strong",{children:"System prompt ordering:"})," DeepAgents always inserts your ",e.jsx("code",{children:"system_prompt="})," FIRST, before its own defaults. The full assembly order is: ",e.jsx("em",{children:"USER (your text) → BASE (deepagents defaults) → SUFFIX (HarnessProfile suffix)"}),". You cannot override the base or suffix without a HarnessProfile."]}),e.jsx("h2",{children:"54.3 — Built-in Tools: What You Get for Free"}),e.jsxs("p",{children:["Every deep agent starts with 8 built-in tools, no configuration needed. These are the same tools Claude Code uses internally — the same ones that let it read, write, search, and execute in a codebase. Adding your own tools with ",e.jsx("code",{children:"tools=[...]"})," merges them with the built-ins; it does not replace them."]}),e.jsx(N,{}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"No backend, no execute:"})," ",e.jsx("code",{children:"execute()"})," is only available when your backend implements ",e.jsx("code",{children:"SandboxBackendProtocol"}),". ",e.jsx("code",{children:"FilesystemBackend"})," does. A bare ",e.jsx("code",{children:"create_deep_agent()"})," with no ",e.jsx("code",{children:"backend="})," gets file tools but no shell execution."]}),e.jsx("h2",{children:"54.4 — The Middleware Stack"}),e.jsx("p",{children:"DeepAgents applies a fixed 11-layer middleware stack to every agent. Each layer wraps the core LLM call, adding behavior before and after. The order is fixed and intentional: filesystem permissions are enforced before caching breakpoints are inserted, and memory is loaded after the prompt cache is set. Hover each layer to see what it does."}),e.jsx(I,{}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"Custom middleware position:"})," Your middleware is inserted between ",e.jsx("code",{children:"PatchToolCallsMiddleware"})," and ",e.jsx("code",{children:"AnthropicPromptCachingMiddleware"})," — after all built-in patching, before provider-specific optimizations. Your middleware sees clean, valid tool calls, not malformed LLM output."]}),e.jsx("h2",{children:"54.5 — Housing.com Agent Team with SubAgents"}),e.jsxs("p",{children:["The full Housing.com engineering team maps to SubAgent TypedDicts. Each agent is just a Python dictionary — no class, no boilerplate. The supervisor uses the ",e.jsx("code",{children:"task()"})," tool to delegate. SubAgents can use cheaper models for simpler roles: PM ticket writing is a ",e.jsx("code",{children:"claude-haiku"})," job; BE and FE code generation needs ",e.jsx("code",{children:"claude-sonnet"}),"."]}),e.jsx(i,{title:"housing_team.py — Five SubAgents as TypedDicts",language:"python",keyLine:4,keyNote:"SubAgent TypedDict — name, description, system_prompt, optional tools and model",children:j}),e.jsxs("p",{children:["The supervisor ties the five agents into a pipeline. The ",e.jsx("code",{children:"task()"})," tool is auto-injected by ",e.jsx("code",{children:"SubAgentMiddleware"})," — the supervisor LLM calls it like any other tool, passing the agent name and instructions. The middleware routes the call to the correct SubAgent, runs it to completion, and returns the result."]}),e.jsx(i,{title:"supervisor.py — Orchestrating agent with SqliteSaver checkpointer",language:"python",keyLine:15,keyNote:"task() tool is auto-injected by SubAgentMiddleware — supervisor calls it like any other tool",children:A}),e.jsxs("div",{className:"callout callout-gotcha",children:[e.jsx("strong",{children:"thread_id is required for checkpointing:"})," Pass ",e.jsx("code",{children:'config={"configurable": {"thread_id": "housing-001"}}'})," on every ",e.jsx("code",{children:".invoke()"})," call. Without it, the checkpointer has no key to persist to and silently discards state. Same thread_id on a retry resumes from where the agent crashed."]}),e.jsx("h2",{children:"54.6 — Skills: Reusable Behavior via SKILL.md"}),e.jsxs("p",{children:["Skills are markdown files with YAML frontmatter that get loaded into the agent's system prompt by ",e.jsx("code",{children:"SkillsMiddleware"}),'. They encode reusable behaviors — "always use Pydantic v2", "always run tests before returning" — without hardcoding them into every ',e.jsx("code",{children:"system_prompt="})," string. The ",e.jsx("code",{children:"description"})," field is used by the agent to decide when a skill applies."]}),e.jsxs("p",{children:[e.jsx("strong",{children:"AGENTS.md"})," is the memory equivalent: a persistent rules file that the agent updates over time. Every production incident becomes a rule. The file only grows — it is the team's collective operational memory."]}),e.jsx(i,{title:"/skills/housing-api-patterns/SKILL.md",language:"yaml",keyLine:4,keyNote:"description field is used by the agent to decide when to apply this skill",children:S}),e.jsx(i,{title:"/memory/AGENTS.md — Persistent team rules ratchet",language:"text",keyLine:3,keyNote:"AGENTS.md = the ratchet — every incident adds a rule. Loaded as memory on every agent invocation.",children:E}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"Skills vs AGENTS.md:"}),` Skills are static and versioned in git — they encode conventions that do not change per deployment. AGENTS.md is dynamic — it lives in the agent's workspace and is updated by the agent itself after incidents. Skills are for "how we build"; AGENTS.md is for "what we learned the hard way."`]}),e.jsx("h2",{children:"54.7 — FilesystemPermission: The Permission Gate"}),e.jsxs("p",{children:["Each permission rule has a path glob and a mode: ",e.jsx("code",{children:'"allow"'})," (proceed), ",e.jsx("code",{children:'"deny"'})," (block with PermissionError), or ",e.jsx("code",{children:'"interrupt"'})," (pause for human approval via ",e.jsx("code",{children:"interrupt_on"}),"). Rules are evaluated in declaration order — first match wins. If no rule matches, the operation is allowed by default. Type any file path below to see which rule fires."]}),e.jsx(D,{}),e.jsxs("div",{className:"callout callout-gotcha",children:[e.jsx("strong",{children:"Deny before interrupt:"})," Put ",e.jsx("code",{children:"deny"})," rules before broader ",e.jsx("code",{children:"interrupt"})," rules. Since first match wins, a ",e.jsx("code",{children:"deny"})," on ",e.jsx("code",{children:".env"})," must appear before a broader ",e.jsx("code",{children:"interrupt"})," on ",e.jsx("code",{children:"/**"})," or the interrupt rule will fire instead, sending the operation to a human rather than blocking it outright."]}),e.jsx("h2",{children:"54.8 — AsyncSubAgent: Background Agent Protocol Tasks"}),e.jsxs("p",{children:["For long-running tasks — full test suites, large codebases, slow builds — use ",e.jsx("code",{children:"AsyncSubAgent"}),". The main agent fires-and-forgets via ",e.jsx("code",{children:"start_async_task()"}),", gets a task_id, continues other work, then polls with ",e.jsx("code",{children:"check_async_task()"}),". Backed by LangGraph Platform or a self-hosted Agent Protocol server. The supervisor never blocks waiting for a slow BE run."]}),e.jsx(i,{title:"async_team.py — AsyncSubAgents with Agent Protocol server",language:"python",keyLine:8,keyNote:"graph_id maps to a deployed LangGraph graph — supervisor calls it without knowing its implementation",children:T}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"When to use AsyncSubAgent vs SubAgent:"})," Use ",e.jsx("code",{children:"AsyncSubAgent"})," when the task takes more than ~30 seconds or when you want the subagent running on a different machine with more resources. Use a synchronous ",e.jsx("code",{children:"SubAgent"})," for fast tasks (ticket writing, code review, classification) where latency matters more than parallelism."]}),e.jsx("h2",{children:"54.9 — HarnessProfile: Per-Model Customization"}),e.jsxs("p",{children:["HarnessProfile attaches behavior to a model spec glob — ",e.jsx("code",{children:'"anthropic:claude-sonnet-*"'})," matches all Sonnet versions. The suffix is always appended last to the system prompt, after both your text and the DeepAgents defaults. Use it to encode team-wide rules that should apply to all agents on a given model tier without touching individual agent configs."]}),e.jsx(i,{title:"harness_profiles.py — Per-model suffix and tool exclusion",language:"python",keyLine:5,keyNote:"model_spec glob — one profile applies to all matching models. Suffix is always last in the system prompt.",children:L}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"excluded_tools:"})," Any tool name in ",e.jsx("code",{children:"excluded_tools"})," is removed from the agent's tool list before the LLM call. This is the correct way to enforce read-only agents — more reliable than system prompt instructions, which the LLM can ignore under pressure."]}),e.jsx("h2",{children:"54.10 — Putting It All Together: Docker Compose"}),e.jsxs("p",{children:["Each agent runs in its own container. ",e.jsx("code",{children:"FilesystemBackend"})," mounts only the slice of ",e.jsx("code",{children:"/workspace"})," that agent needs — principle of least privilege. The PM only sees ",e.jsx("code",{children:"/workspace/tickets"}),"; the BE sees ",e.jsx("code",{children:"/workspace/backend"})," and ",e.jsx("code",{children:"/workspace/tests"}),"; the QA mounts backend and frontend read-only. LangSmith tracing is enabled via environment variables — no code change needed."]}),e.jsx(i,{title:"docker-compose.yml — DeepAgents Housing.com team",language:"yaml",keyLine:8,keyNote:"each agent is its own container — FilesystemBackend mounts only the slice it needs (principle of least privilege)",children:P}),e.jsxs("div",{className:"callout callout-maang",children:[e.jsx("strong",{children:"MAANG Interview Connection"}),' — "How do you operationalize a multi-agent system?" → DeepAgents pattern: one function, fixed middleware stack, declarative SubAgent TypedDicts. "What is the difference between LangGraph and DeepAgents?" → LangGraph = engine (state machine, graph execution, checkpointing). DeepAgents = car (filesystem tools, permissions, skills, memory, subagent routing, context management). "How do you prevent agents from overwriting critical files?" → FilesystemPermission with deny/interrupt modes, evaluated in declaration order, first match wins. "How do you handle long-running subagent tasks without blocking?" → AsyncSubAgent with start_async_task / check_async_task and an Agent Protocol server. The supervisor fires-and-forgets, continues other work, polls on its own schedule.']}),e.jsx(v,{moduleId:54,title:"Module 54: DeepAgents — Batteries-Included Agent Harness",contentHint:"DeepAgents create_deep_agent batteries-included, LangGraph engine vs DeepAgents car analogy, Claude Code harness pattern open-sourced, built-in tools write_todos ls read_file write_file edit_file glob grep execute task, SubAgent TypedDict name description system_prompt tools model, CompiledSubAgent runnable, AsyncSubAgent graph_id url headers, FilesystemPermission path mode allow deny interrupt first match wins, 11-layer middleware stack order TodoList Skills Filesystem SubAgent Summarization PatchToolCalls custom Anthropic MemoryMiddleware HumanInTheLoop AsyncSubAgent, SKILL.md YAML frontmatter description field, AGENTS.md memory ratchet persistent rules, HarnessProfile model_spec glob system_prompt_suffix excluded_tools, thread_id configurable checkpointer SqliteSaver MemorySaver, start_async_task check_async_task Agent Protocol, Docker Compose per-service volume isolation least privilege"})]})}export{q as Mod54};
