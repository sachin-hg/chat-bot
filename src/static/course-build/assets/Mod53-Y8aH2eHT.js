import{j as e,r as g,m as b}from"./index-D4pJPyGz.js";import{C as f}from"./CodeBlock-dJ_hHYfw.js";import{Q as _}from"./QuizSection-BedG7s-t.js";const k=`# agents/pm_agent.py
import anthropic, json
from tools import clarify_requirements, write_ticket, post_to_em

client = anthropic.Anthropic()

PM_SYSTEM = """You are the Product Manager for Housing.com's AI features team.
Turn raw feature requests into precise engineering tickets.
Always call clarify_requirements first — never write a ticket without scoping the request.
Output tickets with: title, user_story, acceptance_criteria (list), priority (P0-P3), context."""

TOOLS = [
    {"name": "clarify_requirements",
     "description": "Ask the requester a clarifying question and return the answer",
     "input_schema": {"type": "object", "properties": {"question": {"type": "string"}}, "required": ["question"]}},
    {"name": "write_ticket",
     "description": "Persist a structured ticket and return its ID",
     "input_schema": {"type": "object", "properties": {
         "title": {"type": "string"}, "user_story": {"type": "string"},
         "acceptance_criteria": {"type": "array", "items": {"type": "string"}},
         "priority": {"type": "string", "enum": ["P0","P1","P2","P3"]},
         "context": {"type": "string"}}, "required": ["title","user_story","acceptance_criteria","priority"]}},
    {"name": "post_to_em",
     "description": "Send the completed ticket to the Engineering Manager via A2A",
     "input_schema": {"type": "object", "properties": {"ticket_id": {"type": "string"}}, "required": ["ticket_id"]}},
]

def run_pm_agent(feature_request: str) -> dict:
    messages = [{"role": "user", "content": feature_request}]
    while True:
        resp = client.messages.create(model="claude-sonnet-4-6", max_tokens=4096,
            system=PM_SYSTEM, tools=TOOLS, messages=messages)
        messages.append({"role": "assistant", "content": resp.content})
        if resp.stop_reason == "end_turn":
            return {"status": "ticket_sent", "summary": resp.content[0].text}
        tool_results = []
        for block in resp.content:
            if block.type != "tool_use": continue
            fn = {"clarify_requirements": clarify_requirements,
                  "write_ticket": write_ticket, "post_to_em": post_to_em}[block.name]
            tool_results.append({"type": "tool_result", "tool_use_id": block.id,
                                  "content": json.dumps(fn(**block.input))})
        messages.append({"role": "user", "content": tool_results})`,j=`# agents/em_agent.py
import anthropic, asyncio, json, httpx
from tools import decompose_ticket, delegate_task, delegate_to_qa

client = anthropic.Anthropic()

EM_SYSTEM = """You are the Engineering Manager for Housing.com's AI features team.
Decompose tickets into parallel backend and frontend tasks.
Never write code yourself — you only coordinate.
Fan out BE and FE tasks concurrently; wait for all results; then gate on QA."""

TOOLS = [
    {"name": "decompose_ticket",
     "description": "Break a ticket into BE tasks (list), FE tasks (list), and shared file ownership map",
     "input_schema": {"type": "object", "properties": {
         "ticket_id": {"type": "string"},
         "be_tasks": {"type": "array", "items": {"type": "string"}},
         "fe_tasks": {"type": "array", "items": {"type": "string"}}},
         "required": ["ticket_id","be_tasks","fe_tasks"]}},
    {"name": "delegate_task",
     "description": "Send a task to a specific agent via A2A and stream result",
     "input_schema": {"type": "object", "properties": {
         "agent_url": {"type": "string"}, "task": {"type": "string"},
         "files": {"type": "array", "items": {"type": "string"}}},
         "required": ["agent_url","task"]}},
    {"name": "delegate_to_qa",
     "description": "Pass all changed files to QA agent and block until approved or rejected",
     "input_schema": {"type": "object", "properties": {
         "changed_files": {"type": "array", "items": {"type": "string"}}},
         "required": ["changed_files"]}},
]

async def _fan_out(tasks: list[dict]) -> list[dict]:
    """Fan out multiple A2A calls concurrently — EM never serialises BE+FE work."""
    async def call_one(t):
        async with httpx.AsyncClient(timeout=120) as c:
            r = await c.post(t["agent_url"] + "/tasks", json={"task": t["task"],
                "files": t.get("files", [])})
            return r.json()
    return await asyncio.gather(*[call_one(t) for t in tasks])

def run_em_agent(ticket_id: str) -> dict:
    messages = [{"role": "user", "content": f"Decompose and execute ticket {ticket_id}"}]
    while True:
        resp = client.messages.create(model="claude-sonnet-4-6", max_tokens=4096,
            system=EM_SYSTEM, tools=TOOLS, messages=messages)
        messages.append({"role": "assistant", "content": resp.content})
        if resp.stop_reason == "end_turn":
            return {"status": "em_done", "summary": resp.content[0].text}
        tool_results = []
        for block in resp.content:
            if block.type != "tool_use": continue
            if block.name == "delegate_task":
                result = asyncio.run(_fan_out([block.input]))
            elif block.name == "decompose_ticket":
                result = decompose_ticket(**block.input)
            else:
                result = delegate_to_qa(**block.input)
            tool_results.append({"type": "tool_result", "tool_use_id": block.id,
                                  "content": json.dumps(result)})
        messages.append({"role": "user", "content": tool_results})`,E=`# agents/be_agent.py
import anthropic, json, subprocess
from pathlib import Path
from tools import read_file, write_file, run_bash, search_codebase

client = anthropic.Anthropic()

BE_SYSTEM = """You are a Senior Backend Engineer at Housing.com.
Stack: FastAPI, Python 3.12, Redis, PostgreSQL.
Self-verification rule: never return until 'pytest' exits 0.
Run tests after every write — if they fail, fix before signalling done."""

TOOLS = [
    {"name": "read_file", "description": "Read a file from the repo",
     "input_schema": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]}},
    {"name": "write_file", "description": "Write content to a file",
     "input_schema": {"type": "object", "properties": {
         "path": {"type": "string"}, "content": {"type": "string"}}, "required": ["path","content"]}},
    {"name": "run_bash", "description": "Run a shell command and return stdout+stderr",
     "input_schema": {"type": "object", "properties": {"cmd": {"type": "string"}}, "required": ["cmd"]}},
    {"name": "search_codebase", "description": "Ripgrep for a pattern in the repo",
     "input_schema": {"type": "object", "properties": {"pattern": {"type": "string"}}, "required": ["pattern"]}},
]

def run_be_agent(task: str, files: list[str]) -> dict:
    changed_files: list[str] = []
    messages = [{"role": "user", "content": task}]
    while True:
        resp = client.messages.create(model="claude-sonnet-4-6", max_tokens=8192,
            system=BE_SYSTEM, tools=TOOLS, messages=messages)
        messages.append({"role": "assistant", "content": resp.content})
        if resp.stop_reason == "end_turn":
            return {"status": "be_done", "changed_files": changed_files,
                    "summary": resp.content[0].text}
        tool_results = []
        fn_map = {"read_file": read_file, "write_file": write_file,
                  "run_bash": run_bash, "search_codebase": search_codebase}
        for block in resp.content:
            if block.type != "tool_use": continue
            result = fn_map[block.name](**block.input)
            if block.name == "write_file":
                changed_files.append(block.input["path"])
            tool_results.append({"type": "tool_result", "tool_use_id": block.id,
                                  "content": json.dumps(result)})
        messages.append({"role": "user", "content": tool_results})`,v=`# agents/fe_agent.py
import anthropic, json
from tools import read_file, write_file, run_bash, search_codebase

client = anthropic.Anthropic()

FE_SYSTEM = """You are a Senior Frontend Engineer at Housing.com.
Stack: React 19, TypeScript, Tailwind CSS.
Self-verification rule: run 'npm run build' after every file write.
Never signal done if the build exits non-zero — fix TypeScript errors first."""

TOOLS = [
    {"name": "read_file", "description": "Read a file from the repo",
     "input_schema": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]}},
    {"name": "write_file", "description": "Write content to a file",
     "input_schema": {"type": "object", "properties": {
         "path": {"type": "string"}, "content": {"type": "string"}}, "required": ["path","content"]}},
    {"name": "run_bash", "description": "Run a shell command and return stdout+stderr",
     "input_schema": {"type": "object", "properties": {"cmd": {"type": "string"}}, "required": ["cmd"]}},
    {"name": "search_codebase", "description": "Search for a pattern in the codebase",
     "input_schema": {"type": "object", "properties": {"pattern": {"type": "string"}}, "required": ["pattern"]}},
]

def run_fe_agent(task: str, files: list[str]) -> dict:
    changed_files: list[str] = []
    messages = [{"role": "user", "content": task}]
    while True:
        resp = client.messages.create(model="claude-sonnet-4-6", max_tokens=8192,
            system=FE_SYSTEM, tools=TOOLS, messages=messages)
        messages.append({"role": "assistant", "content": resp.content})
        if resp.stop_reason == "end_turn":
            return {"status": "fe_done", "changed_files": changed_files,
                    "summary": resp.content[0].text}
        tool_results = []
        fn_map = {"read_file": read_file, "write_file": write_file,
                  "run_bash": run_bash, "search_codebase": search_codebase}
        for block in resp.content:
            if block.type != "tool_use": continue
            result = fn_map[block.name](**block.input)
            if block.name == "write_file":
                changed_files.append(block.input["path"])
                # FE self-verifies: npm run build before signaling done
                run_bash(cmd="npm run build --prefix frontend 2>&1 | tail -5")
            tool_results.append({"type": "tool_result", "tool_use_id": block.id,
                                  "content": json.dumps(result)})
        messages.append({"role": "user", "content": tool_results})`,w=`# agents/qa_agent.py
import anthropic, json
from tools import read_file, write_file, run_bash

client = anthropic.Anthropic()

QA_SYSTEM = """You are the QA gate for Housing.com's AI features team.
Your job: run the full test suite (pytest + vitest), verify coverage >= 80%.
If coverage is below threshold or any test fails, status = 'rejected' with a
detailed reason. If all green, status = 'approved'.
QA is the final gate — reject forces EM to re-delegate. Never approve silently."""

TOOLS = [
    {"name": "read_file", "description": "Read a file from the repo",
     "input_schema": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]}},
    {"name": "write_file", "description": "Write a test fixture or config file",
     "input_schema": {"type": "object", "properties": {
         "path": {"type": "string"}, "content": {"type": "string"}}, "required": ["path","content"]}},
    {"name": "run_bash", "description": "Run a shell command and return stdout+stderr",
     "input_schema": {"type": "object", "properties": {"cmd": {"type": "string"}}, "required": ["cmd"]}},
]

def run_qa_agent(changed_files: list[str]) -> dict:
    task = (f"Run full test suite for changed files: {changed_files}. "
            "Check pytest coverage >= 80% and vitest passing. Approve or reject.")
    messages = [{"role": "user", "content": task}]
    while True:
        resp = client.messages.create(model="claude-sonnet-4-6", max_tokens=4096,
            system=QA_SYSTEM, tools=TOOLS, messages=messages)
        messages.append({"role": "assistant", "content": resp.content})
        if resp.stop_reason == "end_turn":
            text = resp.content[0].text.lower()
            status = "approved" if "approved" in text else "rejected"
            return {"status": status, "report": resp.content[0].text}
        tool_results = []
        fn_map = {"read_file": read_file, "write_file": write_file, "run_bash": run_bash}
        for block in resp.content:
            if block.type != "tool_use": continue
            result = fn_map[block.name](**block.input)
            tool_results.append({"type": "tool_result", "tool_use_id": block.id,
                                  "content": json.dumps(result)})
        messages.append({"role": "user", "content": tool_results})`,S=`# docker-compose.yml — Housing.com AI Agent Team
x-agent-base: &agent-base  # change once, applies to all 6 agents
  build:
    context: .
    dockerfile: Dockerfile.agent
  environment:
    - ANTHROPIC_API_KEY=\${ANTHROPIC_API_KEY}
    - REDIS_URL=redis://redis:6379
  networks:
    - agent-team
  restart: unless-stopped
  depends_on:
    redis:
      condition: service_healthy

services:
  redis:
    image: redis:7-alpine
    networks: [agent-team]
    ports: ["6379:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  pm-agent:
    <<: *agent-base
    command: uvicorn agents.pm_agent:app --host 0.0.0.0 --port 8001
    ports: ["8001:8001"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 10s

  em-agent:
    <<: *agent-base
    command: uvicorn agents.em_agent:app --host 0.0.0.0 --port 8002
    ports: ["8002:8002"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8002/health"]
      interval: 10s

  be-agent:
    <<: *agent-base
    command: uvicorn agents.be_agent:app --host 0.0.0.0 --port 8003
    ports: ["8003:8003"]
    deploy:
      replicas: 2
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8003/health"]
      interval: 10s

  fe-agent:
    <<: *agent-base
    command: uvicorn agents.fe_agent:app --host 0.0.0.0 --port 8005
    ports: ["8005:8005"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8005/health"]
      interval: 10s

  qa-agent:
    <<: *agent-base
    command: uvicorn agents.qa_agent:app --host 0.0.0.0 --port 8006
    ports: ["8006:8006"]
    volumes:
      - ./repo:/repo:ro  # QA mounts repo read-only
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8006/health"]
      interval: 10s

networks:
  agent-team:
    driver: bridge`,A=`# Dockerfile.agent — shared base for all Housing.com agents
FROM python:3.12-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends curl git && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY agents/ ./agents/
COPY tools/ ./tools/

# non-root user — agents never run as root in production
RUN useradd -m -u 1000 agentuser && chown -R agentuser:agentuser /app
USER agentuser

EXPOSE 8001-8010`,M=`# pipeline/feature_pipeline.py — Saved Search Email Alerts
import asyncio, httpx, json
from datetime import datetime

AGENTS = {
    "pm":  "http://pm-agent:8001",
    "em":  "http://em-agent:8002",
    "be1": "http://be-agent:8003",
    "be2": "http://be-agent:8003",
    "fe":  "http://fe-agent:8005",
    "qa":  "http://qa-agent:8006",
}

async def call_agent(url: str, payload: dict) -> dict:
    async with httpx.AsyncClient(timeout=180) as c:
        r = await c.post(url + "/tasks", json=payload)
        return r.json()

async def run_feature_pipeline(feature_request: str) -> dict:
    t0 = datetime.now()

    # Step 1 — PM clarifies + writes ticket (sequential)
    pm_result = await call_agent(AGENTS["pm"], {"request": feature_request})
    ticket_id = pm_result["ticket_id"]
    print(f"[PM] ticket {ticket_id} written ({(datetime.now()-t0).total_seconds():.1f}s)")

    # Step 2 — EM decomposes
    em_decompose = await call_agent(AGENTS["em"], {"action": "decompose", "ticket_id": ticket_id})

    # Step 3 — Fan-out: BE-1, BE-2, FE all run concurrently
    # asyncio.gather fans out 3 agents concurrently — the entire BE+FE work happens in parallel
    be1_task = call_agent(AGENTS["be1"], {"task": em_decompose["be_tasks"][0],
                                          "files": em_decompose["file_map"]["be1"]})
    be2_task = call_agent(AGENTS["be2"], {"task": em_decompose["be_tasks"][1],
                                          "files": em_decompose["file_map"]["be2"]})
    fe_task  = call_agent(AGENTS["fe"],  {"task": em_decompose["fe_tasks"][0],
                                          "files": em_decompose["file_map"]["fe"]})
    be1_r, be2_r, fe_r = await asyncio.gather(be1_task, be2_task, fe_task)

    # Step 4 — QA gates all changed files
    changed = be1_r["changed_files"] + be2_r["changed_files"] + fe_r["changed_files"]
    qa_result = await call_agent(AGENTS["qa"], {"changed_files": changed})

    if qa_result["status"] == "rejected":
        raise RuntimeError(f"QA rejected: {qa_result['report']}")

    wall = (datetime.now()-t0).total_seconds()
    print(f"[DONE] PR ready in {wall:.1f}s (sequential would be ~79.7s)")
    return {"status": "pr_ready", "pr_number": 1402, "wall_clock_s": wall}

if __name__ == "__main__":
    asyncio.run(run_feature_pipeline("Add Saved Search Email Alerts for users"))`;function T(){return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"ReAct (Shallow) vs Deep Agent Team — Architecture Comparison"}),e.jsx("style",{children:`
        @keyframes dashFlow53 { to { stroke-dashoffset: -16; } }
        .dash53 { animation: dashFlow53 1.2s linear infinite; }
      `}),e.jsxs("svg",{viewBox:"0 0 580 200",width:"100%",style:{display:"block"},"aria-label":"ReAct vs Deep Agent diagram",children:[e.jsxs("defs",{children:[e.jsx("marker",{id:"arr53-gray",markerWidth:"7",markerHeight:"7",refX:"5",refY:"2.5",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,5 L7,2.5 z",fill:"#585b70"})}),e.jsx("marker",{id:"arr53-purple",markerWidth:"7",markerHeight:"7",refX:"5",refY:"2.5",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,5 L7,2.5 z",fill:"#cba6f7"})}),e.jsx("marker",{id:"arr53-blue",markerWidth:"7",markerHeight:"7",refX:"5",refY:"2.5",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,5 L7,2.5 z",fill:"#89b4fa"})}),e.jsx("marker",{id:"arr53-green",markerWidth:"7",markerHeight:"7",refX:"5",refY:"2.5",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,5 L7,2.5 z",fill:"#a6e3a1"})})]}),e.jsx("text",{x:"140",y:"16",fontSize:"11",fill:"#cdd6f4",textAnchor:"middle",fontWeight:"700",children:"ReAct (Shallow)"}),e.jsx("rect",{x:"30",y:"22",width:"220",height:"155",rx:"6",fill:"none",stroke:"#45475a",strokeWidth:"1.2",strokeDasharray:"5 3"}),e.jsx("text",{x:"58",y:"35",fontSize:"9",fill:"#6c7086",fontStyle:"italic",children:"1 context window"}),e.jsx("text",{x:"10",y:"85",fontSize:"9",fill:"#bac2de",children:"User"}),e.jsx("line",{x1:"32",y1:"82",x2:"65",y2:"82",stroke:"#585b70",strokeWidth:"1.2",markerEnd:"url(#arr53-gray)"}),e.jsx("rect",{x:"68",y:"65",width:"90",height:"36",rx:"5",fill:"#313244",stroke:"#45475a",strokeWidth:"1.5"}),e.jsx("text",{x:"113",y:"79",fontSize:"10",fill:"#cdd6f4",textAnchor:"middle",fontWeight:"600",children:"Agent"}),e.jsx("text",{x:"113",y:"93",fontSize:"8.5",fill:"#6c7086",textAnchor:"middle",children:"Reason→Act→Observe"}),e.jsx("path",{d:"M158,72 Q195,50 195,83 Q195,108 158,101",fill:"none",stroke:"#585b70",strokeWidth:"1.2",markerEnd:"url(#arr53-gray)",strokeDasharray:"3 2",className:"dash53"}),e.jsx("text",{x:"200",y:"84",fontSize:"8",fill:"#6c7086",children:"loop"}),["search","write","bash"].map((r,n)=>e.jsxs("g",{children:[e.jsx("rect",{x:68+n*34,y:118,width:30,height:18,rx:"3",fill:"#1e1e2e",stroke:"#45475a",strokeWidth:"1"}),e.jsx("text",{x:68+n*34+15,y:130,fontSize:"7.5",fill:"#6c7086",textAnchor:"middle",children:r})]},r)),e.jsx("text",{x:"113",y:"155",fontSize:"8",fill:"#6c7086",textAnchor:"middle",children:"tools (same context)"}),e.jsx("line",{x1:"160",y1:"82",x2:"230",y2:"82",stroke:"#a6e3a1",strokeWidth:"1.2",markerEnd:"url(#arr53-green)"}),e.jsx("text",{x:"237",y:"86",fontSize:"8.5",fill:"#a6e3a1",children:"result"}),e.jsx("line",{x1:"295",y1:"20",x2:"295",y2:"185",stroke:"#313244",strokeWidth:"1"}),e.jsx("text",{x:"440",y:"16",fontSize:"11",fill:"#cdd6f4",textAnchor:"middle",fontWeight:"700",children:"Deep Agent Team"}),e.jsx("text",{x:"308",y:"58",fontSize:"9",fill:"#bac2de",children:"User"}),e.jsx("line",{x1:"328",y1:"55",x2:"350",y2:"55",stroke:"#cba6f7",strokeWidth:"1.2",markerEnd:"url(#arr53-purple)"}),e.jsx("rect",{x:"353",y:"44",width:"78",height:"24",rx:"5",fill:"#cba6f720",stroke:"#cba6f7",strokeWidth:"1.5"}),e.jsx("text",{x:"392",y:"60",fontSize:"9.5",fill:"#cba6f7",textAnchor:"middle",fontWeight:"700",children:"PM"}),e.jsx("rect",{x:"349",y:"40",width:"86",height:"32",rx:"5",fill:"none",stroke:"#cba6f766",strokeWidth:"0.8",strokeDasharray:"4 3"}),e.jsx("line",{x1:"392",y1:"72",x2:"392",y2:"90",stroke:"#cba6f7",strokeWidth:"1.2",strokeDasharray:"4 3",className:"dash53",markerEnd:"url(#arr53-purple)"}),e.jsx("text",{x:"398",y:"84",fontSize:"8",fill:"#6c7086",children:"A2A HTTP+SSE"}),e.jsx("rect",{x:"353",y:"93",width:"78",height:"24",rx:"5",fill:"#89b4fa20",stroke:"#89b4fa",strokeWidth:"1.5"}),e.jsx("text",{x:"392",y:"109",fontSize:"9.5",fill:"#89b4fa",textAnchor:"middle",fontWeight:"700",children:"EM"}),e.jsx("rect",{x:"349",y:"89",width:"86",height:"32",rx:"5",fill:"none",stroke:"#89b4fa66",strokeWidth:"0.8",strokeDasharray:"4 3"}),e.jsx("line",{x1:"392",y1:"121",x2:"392",y2:"140",stroke:"#89b4fa",strokeWidth:"1.2",strokeDasharray:"4 3",className:"dash53",markerEnd:"url(#arr53-blue)"}),e.jsx("text",{x:"398",y:"134",fontSize:"8",fill:"#6c7086",children:"A2A HTTP+SSE"}),e.jsx("rect",{x:"353",y:"143",width:"78",height:"24",rx:"5",fill:"#a6e3a120",stroke:"#a6e3a1",strokeWidth:"1.5"}),e.jsx("text",{x:"392",y:"159",fontSize:"9.5",fill:"#a6e3a1",textAnchor:"middle",fontWeight:"700",children:"BE"}),e.jsx("rect",{x:"349",y:"139",width:"86",height:"32",rx:"5",fill:"none",stroke:"#a6e3a166",strokeWidth:"0.8",strokeDasharray:"4 3"}),e.jsx("line",{x1:"434",y1:"155",x2:"558",y2:"155",stroke:"#a6e3a1",strokeWidth:"1.2",markerEnd:"url(#arr53-green)"}),e.jsx("text",{x:"562",y:"159",fontSize:"8.5",fill:"#a6e3a1",children:"result"}),e.jsx("text",{x:"480",y:"58",fontSize:"8",fill:"#6c7086",children:"depth 1"}),e.jsx("text",{x:"480",y:"109",fontSize:"8",fill:"#6c7086",children:"depth 2"}),e.jsx("text",{x:"480",y:"155",fontSize:"8",fill:"#6c7086",children:"depth 3"})]})]})}const x={PM:{color:"#cba6f7",system:"Turn raw feature requests into precise engineering tickets. Clarify scope before writing.",tools:["clarify_requirements","write_ticket","post_to_em"],container:"pm-agent:8001"},EM:{color:"#89b4fa",system:"Decompose tickets, fan-out to BE/FE in parallel, collect results, gate on QA.",tools:["decompose_ticket","delegate_task","delegate_to_qa"],container:"em-agent:8002"},BE:{color:"#a6e3a1",system:"Senior Backend Eng: FastAPI, Python 3.12, Redis, PostgreSQL. Never return until tests are green.",tools:["read_file","write_file","run_bash","search_codebase"],container:"be-agent:8003"},FE:{color:"#89dceb",system:"Senior FE Eng: React 19, TypeScript, Tailwind. Run npm run build after every write.",tools:["read_file","write_file","run_bash","search_codebase"],container:"fe-agent:8005"},QA:{color:"#fab387",system:"QA gate: run full test suite, verify coverage≥80%, approve or reject.",tools:["read_file","write_file","run_bash"],container:"qa-agent:8006"}};function R(){const[r,n]=g.useState(null),o=[{id:"PM",x:60,y:90,label:"PM"},{id:"EM",x:230,y:90,label:"EM"},{id:"BE",x:420,y:55,label:"BE-1"},{id:"BE2",x:420,y:105,label:"BE-2"},{id:"FE",x:420,y:155,label:"FE"},{id:"QA",x:520,y:165,label:"QA"}],h=[{from:"PM",to:"EM"},{from:"EM",to:"BE"},{from:"EM",to:"BE2"},{from:"EM",to:"FE"},{from:"EM",to:"QA"}],a=t=>o.find(c=>c.id===t)??{x:0,y:0},s=t=>t==="BE2"?"BE":t,d=r?x[s(r)]:null;return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"10px"},children:"AGENT TEAM ORG CHART — Click a role to inspect"}),e.jsxs("svg",{viewBox:"0 0 600 220",width:"100%",style:{display:"block"},"aria-label":"Team org chart",children:[e.jsx("defs",{children:Object.entries(x).map(([t,c])=>e.jsx("marker",{id:`arr53org-${t}`,markerWidth:"7",markerHeight:"7",refX:"5",refY:"2.5",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,5 L7,2.5 z",fill:c.color})},t))}),h.map((t,c)=>{var m;const p=a(t.from),i=a(t.to),l=s(t.to);return e.jsx("line",{x1:p.x+28,y1:p.y,x2:i.x-28,y2:i.y,stroke:((m=x[l])==null?void 0:m.color)??"#585b70",strokeWidth:"1.2",markerEnd:`url(#arr53org-${l})`},c)}),o.map(t=>{var l;const c=s(t.id),p=((l=x[c])==null?void 0:l.color)??"#585b70",i=r===t.id;return e.jsxs("g",{style:{cursor:"pointer"},onClick:()=>n(r===t.id?null:t.id),children:[e.jsx("rect",{x:t.x-28,y:t.y-16,width:56,height:32,rx:"6",fill:i?p+"33":"#1e1e2e",stroke:p,strokeWidth:i?2:1.5}),e.jsx("text",{x:t.x,y:t.y+5,fontSize:"10",fill:p,textAnchor:"middle",fontWeight:"700",children:t.label})]},t.id)})]}),d&&r&&e.jsxs(b.div,{initial:{opacity:0,y:-6},animate:{opacity:1,y:0},transition:{duration:.18},style:{marginTop:"12px",padding:"14px 16px",background:"#1e1e2e",borderRadius:"6px",borderLeft:`3px solid ${d.color}`},children:[e.jsxs("div",{style:{fontSize:"0.78rem",fontWeight:700,color:d.color,marginBottom:"6px"},children:[s(r)," — ",d.container]}),e.jsxs("div",{style:{fontSize:"0.8rem",color:"#bac2de",marginBottom:"8px",fontStyle:"italic"},children:['"',d.system,'"']}),e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"6px"},children:d.tools.map(t=>e.jsx("span",{style:{fontSize:"0.72rem",background:"#313244",color:"#cdd6f4",padding:"2px 8px",borderRadius:"10px",fontFamily:"monospace"},children:t},t))})]})]})}const q=`{
  "msg_id": "7f3e2a1b-9c4d-4f8e-b2a1-3d5e6f7a8b9c",
  "from_agent": "em-agent",
  "to_agent": "be-agent-1",
  "task_type": "implement_endpoint",
  "payload": {
    "task": "Add POST /api/saved-searches endpoint",
    "files": ["api/routes/saved_searches.py", "tests/test_saved_searches.py"],
    "ticket_id": "FEAT-2041",
    "priority": "P1"
  }
}`;function B(){const r=[{key:"msg_id",color:"#cba6f7",note:"UUID — correlation key for distributed tracing"},{key:"from_agent",color:"#89b4fa",note:"Sender identity (matches container DNS name)"},{key:"to_agent",color:"#a6e3a1",note:"Receiver identity (Docker service name)"},{key:"task_type",color:"#f9e2af",note:"Discriminator for receiver routing logic"},{key:"payload",color:"#fab387",note:"Structured task data — varies per task_type"}];return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"A2A MESSAGE ENVELOPE — Every inter-agent message"}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"16px"},children:[e.jsx("div",{children:r.map(n=>e.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"10px",marginBottom:"8px",borderLeft:`3px solid ${n.color}`,paddingLeft:"10px"},children:[e.jsx("span",{style:{fontFamily:"monospace",fontSize:"0.8rem",color:n.color,flexShrink:0,minWidth:"90px"},children:n.key}),e.jsx("span",{style:{fontSize:"0.76rem",color:"#6c7086"},children:n.note})]},n.key))}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.72rem",color:"#6c7086",marginBottom:"8px",fontWeight:600},children:"REDIS STREAM AUDIT LOG"}),e.jsxs("svg",{viewBox:"0 0 220 120",width:"100%",style:{display:"block"},children:[e.jsx("rect",{x:"0",y:"10",width:"220",height:"100",rx:"6",fill:"#1e1e2e",stroke:"#313244",strokeWidth:"1"}),e.jsx("text",{x:"110",y:"26",fontSize:"9",fill:"#6c7086",textAnchor:"middle",fontWeight:"700",children:"redis-stream: a2a:audit"}),[0,1,2].map(n=>e.jsxs("g",{children:[e.jsx("rect",{x:"10",y:36+n*24,width:"200",height:"18",rx:"3",fill:"#313244"}),e.jsx("text",{x:"20",y:36+n*24+12,fontSize:"8",fill:"#89b4fa",fontFamily:"monospace",children:["pm→em: ticket_ready","em→be1: implement_endpoint","em→fe: build_ui"][n]}),e.jsx("rect",{x:"185",y:36+n*24+3,width:"18",height:"12",rx:"2",fill:"#181825"}),e.jsx("text",{x:"194",y:36+n*24+12,fontSize:"7",fill:"#a6e3a1",textAnchor:"middle",children:"✓"})]},n))]})]})]}),e.jsx(f,{title:"A2A Envelope — Full Example",language:"json",collapsible:!1,children:q})]})}function P(){const[r,n]=g.useState(!1),[o,h]=g.useState(0),a=[{id:"redis",label:"Redis",port:"6379",color:"#f38ba8",x:60,y:120},{id:"pm",label:"PM Agent",port:"8001",color:"#cba6f7",x:170,y:50},{id:"em",label:"EM Agent",port:"8002",color:"#89b4fa",x:300,y:120},{id:"be1",label:"BE Agent",port:"8003",color:"#a6e3a1",x:450,y:60},{id:"fe",label:"FE Agent",port:"8005",color:"#89dceb",x:450,y:150},{id:"qa",label:"QA Agent",port:"8006",color:"#fab387",x:300,y:220}],s=[["redis","em"],["pm","em"],["em","be1"],["em","fe"],["em","qa"]];g.useEffect(()=>{if(!r||o>=a.length)return;const t=setTimeout(()=>h(c=>c+1),400);return()=>clearTimeout(t)},[r,o]);const d=t=>t<o;return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086"},children:"DOCKER NETWORK: agent-team"}),e.jsxs("div",{style:{display:"flex",gap:"8px",alignItems:"center"},children:[o===a.length&&e.jsx("span",{style:{fontSize:"0.78rem",color:"#a6e3a1",fontWeight:700},children:"All services healthy ✓"}),e.jsx("button",{onClick:()=>{r||(h(0),n(!0))},disabled:r&&o<a.length,style:{background:"#313244",border:"1px solid #45475a",color:"#cdd6f4",borderRadius:"6px",padding:"6px 14px",fontSize:"0.78rem",cursor:"pointer",fontWeight:600},children:r&&o<a.length?"Starting...":"docker compose up"})]})]}),e.jsxs("svg",{viewBox:"0 0 640 300",width:"100%",style:{display:"block"},"aria-label":"Docker services network diagram",children:[e.jsx("rect",{x:"4",y:"4",width:"632",height:"292",rx:"8",fill:"none",stroke:"#313244",strokeWidth:"1.5",strokeDasharray:"6 4"}),s.map(([t,c],p)=>{const i=a.find(m=>m.id===t),l=a.find(m=>m.id===c);return e.jsx("line",{x1:i.x+44,y1:i.y+18,x2:l.x,y2:l.y+18,stroke:"#45475a",strokeWidth:"1",strokeDasharray:"3 3"},p)}),a.map((t,c)=>e.jsxs("g",{children:[e.jsx("rect",{x:t.x,y:t.y,width:116,height:40,rx:"6",fill:d(c)?t.color+"18":"#1e1e2e",stroke:d(c)?t.color:"#45475a",strokeWidth:d(c)?1.8:1}),e.jsx("text",{x:t.x+12,y:t.y+14,fontSize:"9.5",fill:d(c)?t.color:"#585b70",fontWeight:"700",children:t.label}),e.jsxs("text",{x:t.x+12,y:t.y+28,fontSize:"8",fill:"#6c7086",children:[":",t.port]}),e.jsx("circle",{cx:t.x+102,cy:t.y+12,r:"5",fill:d(c)?"#a6e3a1":"#313244",stroke:d(c)?"#a6e3a1":"#45475a",strokeWidth:"1"})]},t.id))]})]})}function W(){const[r,n]=g.useState(0),o=7,h=["Initial state","User → PM: feature request","PM clarifies + writes ticket","EM decomposes ticket","Fan-out: BE-1, BE-2, FE in parallel","BE-1, BE-2, FE all done","QA gates: 6 files, 86% coverage","PR #1402 ready"],a=[{id:"user",x:20,y:120,w:60,h:30,label:"User",color:"#6c7086"},{id:"pm",x:110,y:120,w:60,h:30,label:"PM",color:"#cba6f7"},{id:"em",x:220,y:120,w:60,h:30,label:"EM",color:"#89b4fa"},{id:"be1",x:360,y:70,w:60,h:30,label:"BE-1",color:"#a6e3a1"},{id:"be2",x:360,y:115,w:60,h:30,label:"BE-2",color:"#a6e3a1"},{id:"fe",x:360,y:160,w:60,h:30,label:"FE",color:"#89dceb"},{id:"qa",x:490,y:120,w:60,h:30,label:"QA",color:"#fab387"},{id:"done",x:600,y:120,w:70,h:30,label:"PR ✓",color:"#a6e3a1"}],s={1:["user-pm"],2:["pm-em"],3:["em-be1","em-be2","em-fe"],4:["em-be1","em-be2","em-fe"],5:["be1-qa","be2-qa","fe-qa"],6:["qa-done"],7:["qa-done"]},d={1:["user","pm"],2:["pm","em"],3:["em","be1","be2","fe"],4:["be1","be2","fe"],5:["be1","be2","fe","qa"],6:["qa","done"],7:["done"]},t=i=>(d[r]??[]).includes(i),c=i=>(s[r]??[]).includes(i),p=i=>a.find(l=>l.id===i);return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086"},children:"FEATURE BUILD PIPELINE — Saved Search Email Alerts"}),e.jsxs("span",{style:{fontSize:"0.78rem",color:"#6c7086",background:"#313244",padding:"3px 10px",borderRadius:"10px"},children:["Step ",r," of ",o]})]}),e.jsxs("svg",{viewBox:"0 0 700 240",width:"100%",style:{display:"block"},"aria-label":"Pipeline flow diagram",children:[e.jsxs("defs",{children:[e.jsx("marker",{id:"arr53pipe",markerWidth:"7",markerHeight:"7",refX:"5",refY:"2.5",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,5 L7,2.5 z",fill:"#585b70"})}),e.jsx("marker",{id:"arr53pipeactive",markerWidth:"7",markerHeight:"7",refX:"5",refY:"2.5",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,5 L7,2.5 z",fill:"#f9e2af"})})]}),[{id:"user-pm",f:"user",t:"pm"},{id:"pm-em",f:"pm",t:"em"},{id:"em-be1",f:"em",t:"be1"},{id:"em-be2",f:"em",t:"be2"},{id:"em-fe",f:"em",t:"fe"},{id:"be1-qa",f:"be1",t:"qa"},{id:"be2-qa",f:"be2",t:"qa"},{id:"fe-qa",f:"fe",t:"qa"},{id:"qa-done",f:"qa",t:"done"}].map(i=>{const l=p(i.f),m=p(i.t),y=c(i.id);return e.jsx("line",{x1:l.x+l.w,y1:l.y+l.h/2,x2:m.x,y2:m.y+m.h/2,stroke:y?"#f9e2af":"#313244",strokeWidth:y?2:1,markerEnd:y?"url(#arr53pipeactive)":"url(#arr53pipe)"},i.id)}),r>=3&&r<=5&&e.jsx("text",{x:"316",y:"116",fontSize:"8.5",fill:"#f9e2af",textAnchor:"middle",fontWeight:"700",children:"parallel"}),r>=5&&e.jsxs("g",{children:[e.jsx("rect",{x:"455",y:"104",width:"36",height:"14",rx:"3",fill:"#f9e2af22",stroke:"#f9e2af",strokeWidth:"0.8"}),e.jsx("text",{x:"473",y:"114",fontSize:"7.5",fill:"#f9e2af",textAnchor:"middle",children:"6 files"})]}),r>=6&&e.jsx("text",{x:"520",y:"165",fontSize:"8",fill:"#a6e3a1",textAnchor:"middle",children:"✓ 86% cov"}),r>=7&&e.jsxs("g",{children:[e.jsx("rect",{x:"590",y:"108",width:"80",height:"16",rx:"3",fill:"#a6e3a122",stroke:"#a6e3a1",strokeWidth:"1"}),e.jsx("text",{x:"630",y:"119",fontSize:"8",fill:"#a6e3a1",textAnchor:"middle",children:"PR #1402 ready"})]}),a.map(i=>{const l=t(i.id);return e.jsxs("g",{children:[e.jsx("rect",{x:i.x,y:i.y,width:i.w,height:i.h,rx:"5",fill:l?i.color+"22":"#1e1e2e",stroke:l?i.color:"#45475a",strokeWidth:l?2:1}),e.jsx("text",{x:i.x+i.w/2,y:i.y+i.h/2+4,fontSize:"10",fill:l?i.color:"#585b70",textAnchor:"middle",fontWeight:l?"700":"400",children:i.label})]},i.id)})]}),e.jsx("div",{style:{marginTop:"10px",padding:"8px 14px",background:"#1e1e2e",borderRadius:"6px",fontSize:"0.82rem",color:"#bac2de",minHeight:"32px"},children:r===0?'Press "Next Step" to walk through the pipeline.':h[r]}),e.jsxs("div",{style:{display:"flex",gap:"8px",marginTop:"10px"},children:[e.jsx("button",{onClick:()=>n(i=>Math.min(i+1,o)),disabled:r===o,style:{background:r<o?"#313244":"#1e1e2e",border:"1px solid #45475a",color:r<o?"#cdd6f4":"#45475a",borderRadius:"6px",padding:"6px 16px",fontSize:"0.8rem",cursor:r<o?"pointer":"default",fontWeight:600},children:"Next Step →"}),e.jsx("button",{onClick:()=>n(0),style:{background:"none",border:"1px solid #45475a",color:"#6c7086",borderRadius:"6px",padding:"6px 12px",fontSize:"0.8rem",cursor:"pointer"},children:"Reset"})]}),r===o&&e.jsx("div",{style:{marginTop:"10px",padding:"8px 14px",background:"#a6e3a110",border:"1px solid #a6e3a1",borderRadius:"6px",fontSize:"0.8rem",color:"#a6e3a1"},children:"Wall-clock: 60.5s | Sequential would be: 79.7s | Parallelism saved: 19.2s"})]})}function z(){const[r,n]=g.useState(["pm","em","em-be1","be1","qa"]),o=[{id:"pm",parent:null,indent:0,label:"pm-agent",duration:"12.4s",durationMs:12400,maxMs:12400,color:"#cba6f7"},{id:"pm-cl",parent:"pm",indent:1,label:"clarify_requirements",duration:"1.2s",durationMs:1200,maxMs:12400,color:"#cba6f7"},{id:"pm-wt",parent:"pm",indent:1,label:"write_ticket",duration:"0.3s",durationMs:300,maxMs:12400,color:"#cba6f7"},{id:"pm-pe",parent:"pm",indent:1,label:"post_to_em",duration:"0.1s",durationMs:100,maxMs:12400,color:"#cba6f7"},{id:"em",parent:null,indent:0,label:"em-agent",duration:"48.1s",durationMs:48100,maxMs:48100,color:"#89b4fa"},{id:"em-dt",parent:"em",indent:1,label:"decompose_ticket",duration:"0.8s",durationMs:800,maxMs:48100,color:"#89b4fa"},{id:"em-be1",parent:"em",indent:1,label:"delegate→be-agent-1 ★",duration:"38.2s",durationMs:38200,maxMs:48100,color:"#f9e2af",critical:!0},{id:"em-be2",parent:"em",indent:1,label:"delegate→be-agent-2",duration:"22.1s",durationMs:22100,maxMs:48100,color:"#89b4fa"},{id:"em-fe",parent:"em",indent:1,label:"delegate→fe-agent",duration:"19.4s",durationMs:19400,maxMs:48100,color:"#89b4fa"},{id:"be1",parent:null,indent:0,label:"be-agent-1",duration:"38.2s",durationMs:38200,maxMs:38200,color:"#a6e3a1"},{id:"be1-rf",parent:"be1",indent:1,label:"read_file ×3",duration:"0.3s",durationMs:300,maxMs:38200,color:"#a6e3a1"},{id:"be1-wf",parent:"be1",indent:1,label:"write_file ×2",duration:"0.4s",durationMs:400,maxMs:38200,color:"#a6e3a1"},{id:"be1-py",parent:"be1",indent:1,label:"run_bash:pytest ⚠",duration:"12.3s",durationMs:12300,maxMs:38200,color:"#f38ba8",slowest:!0},{id:"qa",parent:null,indent:0,label:"qa-agent",duration:"28.4s",durationMs:28400,maxMs:28400,color:"#fab387"},{id:"qa-test",parent:"qa",indent:1,label:"run_bash:pytest+vitest",duration:"24.1s",durationMs:24100,maxMs:28400,color:"#fab387"}],h=s=>n(d=>d.includes(s)?d.filter(t=>t!==s):[...d,s]),a=s=>s.parent?r.includes(s.parent):!0;return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"10px"},children:"CROSS-AGENT TRACE — msg_id: 7f3e2a1b... (LangSmith view)"}),e.jsx("div",{style:{fontSize:"0.76rem",color:"#6c7086",marginBottom:"10px"},children:"Click rows to expand/collapse"}),e.jsx("div",{style:{background:"#1e1e2e",borderRadius:"6px",padding:"10px",fontFamily:"monospace",fontSize:"0.8rem"},children:o.map(s=>a(s)&&e.jsxs("div",{onClick:()=>h(s.id),style:{display:"flex",alignItems:"center",padding:"5px 4px",marginLeft:`${s.indent*22}px`,borderLeft:s.indent>0?"1px solid #45475a":"none",paddingLeft:s.indent>0?"10px":"4px",cursor:"pointer",borderRadius:"4px",marginBottom:"2px",background:s.slowest?"#f38ba811":s.critical?"#f9e2af08":"transparent",borderLeftColor:s.slowest?"#f38ba8":s.indent>0?"#45475a":"transparent"},children:[e.jsx("span",{style:{color:"#6c7086",marginRight:"6px",fontSize:"0.68rem"},children:s.indent===0?r.includes(s.id)?"▾":"▸":"·"}),e.jsx("span",{style:{color:s.critical?"#f9e2af":s.color,flex:1},children:s.label}),e.jsx("span",{style:{display:"inline-block",width:`${Math.max(4,Math.round(s.durationMs/s.maxMs*100))}px`,height:"6px",borderRadius:"2px",marginLeft:"8px",background:s.critical?"#f9e2af":s.slowest?"#f38ba8":s.color,opacity:.7}}),e.jsx("span",{style:{color:"#bac2de",marginLeft:"10px",fontSize:"0.76rem",minWidth:"42px",textAlign:"right"},children:s.duration})]},s.id))}),e.jsxs("div",{style:{marginTop:"12px",padding:"8px 12px",background:"#313244",borderRadius:"6px",display:"flex",gap:"20px",flexWrap:"wrap",fontSize:"0.76rem",color:"#bac2de"},children:[e.jsxs("span",{children:["Wall-clock: ",e.jsx("strong",{style:{color:"#cdd6f4"},children:"60.5s"})]}),e.jsxs("span",{children:["Parallelism saved: ",e.jsx("strong",{style:{color:"#a6e3a1"},children:"41.5s"})]}),e.jsxs("span",{children:["Cost: ",e.jsx("strong",{style:{color:"#f9e2af"},children:"$0.059"})]}),e.jsx("span",{style:{color:"#f38ba8"},children:"⚠ Bottleneck: be-agent-1/pytest (12.3s)"})]})]})}const u=[{title:"Agent loop doesn't terminate",symptom:"PM keeps calling clarify_requirements forever",rule:"max_turns: 20 circuit breaker on every agent"},{title:"Context window overflow",symptom:"BE agent crashes on large repo search",rule:"read_file limit: 10 files per task in system prompt"},{title:"Test env not isolated",symptom:"QA writes files and breaks production data",rule:"QA mounts all volumes read-only"},{title:"EM fans out before PM done",symptom:"EM receives incomplete ticket, tasks mismatch",rule:"A2A enforces completed state before delegation"},{title:"Cost runaway on QA rejection",symptom:"QA keeps rejecting, BE keeps rewriting forever",rule:"max_rejections: 2 then escalate_to_human"},{title:"Duplicate file writes",symptom:"BE-1 and BE-2 overwrite each other's files",rule:"decompose_ticket must assign disjoint file sets"}];function D(){const[r,n]=g.useState(0),o=u.slice(0,r),h=r*60;return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086"},children:"FAILURE MODE SIMULATOR — AGENTS.md ratchet"}),e.jsxs("div",{style:{display:"flex",gap:"10px",alignItems:"center"},children:[e.jsx("svg",{width:"32",height:"32",viewBox:"-16 -16 32 32","aria-hidden":"true",children:e.jsxs("g",{style:{transform:`rotate(${h}deg)`,transformOrigin:"center",transition:"transform 0.4s ease"},children:[[0,1,2,3,4,5,6,7].map(a=>e.jsx("rect",{x:"-3",y:"-14",width:"6",height:"6",rx:"1",fill:"#fab387",style:{transform:`rotate(${a*45}deg)`,transformOrigin:"center"}},a)),e.jsx("circle",{cx:"0",cy:"0",r:"8",fill:"#181825",stroke:"#fab387",strokeWidth:"2"}),e.jsx("circle",{cx:"0",cy:"0",r:"3",fill:"#fab387"})]})}),e.jsx("button",{onClick:()=>n(a=>Math.min(a+1,u.length)),disabled:r>=u.length,style:{background:r<u.length?"#fab38722":"#1e1e2e",border:`1px solid ${r<u.length?"#fab387":"#313244"}`,color:r<u.length?"#fab387":"#45475a",borderRadius:"6px",padding:"7px 16px",fontSize:"0.8rem",cursor:r<u.length?"pointer":"default",fontWeight:700},children:r>=u.length?"All incidents simulated":"Simulate Incident"})]})]}),r===0&&e.jsx("div",{style:{color:"#45475a",fontSize:"0.82rem",textAlign:"center",padding:"20px 0"},children:'Click "Simulate Incident" to surface real failure modes and the AGENTS.md rule that prevents them.'}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"8px"},children:o.map((a,s)=>e.jsxs(b.div,{initial:{opacity:0,x:-12},animate:{opacity:1,x:0},transition:{duration:.2},style:{padding:"12px 14px",background:"#1e1e2e",borderRadius:"6px",borderLeft:"3px solid #fab387"},children:[e.jsxs("div",{style:{fontWeight:700,fontSize:"0.82rem",color:"#fab387",marginBottom:"3px"},children:["#",s+1," — ",a.title]}),e.jsxs("div",{style:{fontSize:"0.78rem",color:"#6c7086",marginBottom:"6px"},children:["Symptom: ",a.symptom]}),e.jsxs("div",{style:{fontSize:"0.78rem",color:"#a6e3a1",fontFamily:"monospace",background:"#313244",padding:"4px 8px",borderRadius:"4px",display:"inline-block"},children:["✦ AGENTS.md rule: ",a.rule]})]},s))}),r>=u.length&&e.jsx("div",{style:{marginTop:"12px",padding:"10px 14px",background:"#a6e3a110",border:"1px solid #a6e3a1",borderRadius:"6px",fontSize:"0.8rem",color:"#a6e3a1"},children:"Ratchet complete — 6 rules locked into AGENTS.md. Every incident hardens the team contract."})]})}function F(){return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"learning-obj",children:[e.jsx("div",{className:"learning-obj-title",children:"After this module you will be able to"}),e.jsxs("ol",{children:[e.jsx("li",{children:"Distinguish ReAct (shallow) from deep agent teams and explain the call-stack analogy"}),e.jsx("li",{children:"Design a multi-agent team with PM, EM, BE, FE, and QA roles, each with distinct tools and system prompts"}),e.jsx("li",{children:"Implement each agent with the Anthropic SDK tool-use loop and A2A HTTP+SSE envelopes"}),e.jsx("li",{children:"Compose the full team with Docker Compose using the x-agent-base anchor pattern"}),e.jsx("li",{children:"Fan-out BE+FE work with asyncio.gather and measure wall-clock vs sequential time"}),e.jsx("li",{children:"Trace cross-agent calls via msg_id correlation in LangSmith and identify the critical path"}),e.jsx("li",{children:"Apply the AGENTS.md ratchet: six failure modes, six hardening rules"})]}),e.jsxs("div",{className:"obj-meta",children:[e.jsx("span",{className:"obj-time",children:"⏱ ~100 minutes"}),e.jsx("span",{className:"obj-diff",children:"Difficulty: ★★★★★"}),e.jsx("span",{className:"obj-diff",children:"Prerequisites: Modules 42, 50, 51"})]})]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"Housing.com Context"}),e.jsx("br",{}),'The feature "Saved Search Email Alerts" becomes the red thread. We build the PM, EM, BE, FE, and QA agents end-to-end, compose them with Docker, and watch the full pipeline produce a PR in 60.5 seconds — 19 seconds faster than serial execution.']}),e.jsx("h2",{children:'53.1 — What Makes an Agent "Deep"?'}),e.jsxs("p",{children:["A standard ReAct agent is one LLM plus a tool loop running inside a single context window.",e.jsx("strong",{children:' "Deep"'})," means the action itself is another agent — the call stack depth crosses more than one LLM boundary. Think of it as function call depth: a shallow agent calls a tool; a deep agent calls a function that runs its own reasoning loop."]}),e.jsxs("p",{children:[e.jsx("strong",{children:"Benefits:"})," specialisation (each agent has a tightly scoped system prompt), parallelism (fan-out BE+FE work runs concurrently), and isolation (BE context never bleeds into FE context).",e.jsx("strong",{children:" Trade-offs:"})," latency adds per hop, cost multiplies with each LLM boundary, and you need distributed tracing (correlation via ",e.jsx("code",{children:"msg_id"}),") to debug the full call chain."]}),e.jsx(T,{}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:'When is "deep" worth it?'})," The break-even is around three or more genuinely independent workstreams. Below that, a single ReAct agent with broad tools is simpler and cheaper. Above that, parallel deep agents reclaim wall-clock time."]}),e.jsx("h2",{children:"53.2 — The Agent Team Mental Model"}),e.jsxs("p",{children:["Every role has a ",e.jsx("em",{children:"distinct system prompt"})," and a ",e.jsx("em",{children:"distinct tool set"}),". The PM turns raw requests into structured tickets. The EM is the orchestrator: it decomposes tickets and fans out work. BE agents write backend code; FE agents write frontend code. QA is the final gate — it runs the full test suite and either approves or rejects. EM coordinates but never writes code itself."]}),e.jsx(R,{}),e.jsx("h2",{children:"53.3 — The A2A Message Envelope"}),e.jsxs("p",{children:["Every inter-agent message carries a standard envelope: ",e.jsx("code",{children:"msg_id"})," (UUID used as the distributed trace correlation key),",e.jsx("code",{children:"from_agent"}),", ",e.jsx("code",{children:"to_agent"}),", ",e.jsx("code",{children:"task_type"}),", and ",e.jsx("code",{children:"payload"}),". All envelopes are appended to a Redis Stream (",e.jsx("code",{children:"a2a:audit"}),") on send, giving a full audit log that supports replay."]}),e.jsx(B,{}),e.jsxs("div",{className:"callout callout-gotcha",children:[e.jsx("strong",{children:"msg_id is not optional."})," Without it you cannot correlate LangSmith spans across agent boundaries. Add it to every A2A POST body and propagate it as a LangSmith run metadata key."]}),e.jsx("h2",{children:"53.4 — PM Agent"}),e.jsxs("p",{children:["The PM agent enforces the rule: ",e.jsx("em",{children:"never write a ticket without first scoping the request"}),". It always calls ",e.jsx("code",{children:"clarify_requirements"})," before ",e.jsx("code",{children:"write_ticket"}),", then posts the ticket to the EM via ",e.jsx("code",{children:"post_to_em"}),"."]}),e.jsx(f,{title:"pm_agent.py — Product Manager Agent",language:"python",keyLine:8,keyNote:"clarify before writing — PM never specs without scoping",children:k}),e.jsx("h2",{children:"53.5 — EM Agent"}),e.jsxs("p",{children:["The EM agent ",e.jsx("em",{children:"never writes code"}),". It decomposes tickets and fans out tasks to BE and FE agents concurrently using ",e.jsx("code",{children:"asyncio.gather"})," inside ",e.jsx("code",{children:"_fan_out"}),". After collection it gates on QA."]}),e.jsx(f,{title:"em_agent.py — Engineering Manager Agent",language:"python",keyLine:8,keyNote:"never write code — EM only coordinates",children:j}),e.jsx("h2",{children:"53.6 — BE Agent"}),e.jsxs("p",{children:["The BE agent self-verifies: it runs ",e.jsx("code",{children:"pytest"})," after every file write and only returns when tests exit 0. It tracks ",e.jsx("code",{children:"changed_files"})," for QA."]}),e.jsx(f,{title:"be_agent.py — Backend Engineer Agent",language:"python",keyLine:10,keyNote:"self-verification: never return until tests are green",children:E}),e.jsx("h2",{children:"53.7 — FE Agent"}),e.jsxs("p",{children:["The FE agent runs ",e.jsx("code",{children:"npm run build"})," after every write. A non-zero build exit is a hard error — the agent must fix TypeScript errors before signalling completion."]}),e.jsx(f,{title:"fe_agent.py — Frontend Engineer Agent",language:"python",keyLine:10,keyNote:"FE self-verifies: npm run build before signaling done",children:v}),e.jsx("h2",{children:"53.8 — QA Agent"}),e.jsxs("p",{children:["The QA agent is the final gate. It runs ",e.jsx("code",{children:"pytest"})," and ",e.jsx("code",{children:"vitest"}),", checks coverage, and returns ",e.jsx("code",{children:"status: approved"})," or ",e.jsx("code",{children:"status: rejected"}),". A rejection forces the EM to re-delegate."]}),e.jsx(f,{title:"qa_agent.py — QA Gate Agent",language:"python",keyLine:13,keyNote:"QA is the final gate — reject forces EM to re-delegate",children:w}),e.jsx("h2",{children:"53.9 — Docker Compose: The Full Team"}),e.jsxs("p",{children:["Each agent runs in its own FastAPI container. A shared Redis instance serves as the A2A audit log and pub/sub bus. Container DNS provides service discovery — agents call each other by service name (",e.jsx("code",{children:"http://em-agent:8002"}),"). Every service exposes ",e.jsx("code",{children:"GET /health"})," for Docker's health-check and for the EM to verify agents are ready before delegating."]}),e.jsx(f,{title:"docker-compose.yml — Agent Team",language:"yaml",keyLine:3,keyNote:"x-agent-base anchor — change once, applies to all 6 agents",children:S}),e.jsx(f,{title:"Dockerfile.agent — Shared Base Image",language:"bash",keyLine:12,keyNote:"non-root user — agents never run as root in production",children:A}),e.jsx(P,{}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"BE replicas:"})," The BE agent uses ",e.jsx("code",{children:"deploy.replicas: 2"}),", so Docker routes tasks across two containers. The EM treats both as addressable via the ",e.jsx("code",{children:"be-agent"})," DNS name — Docker's built-in load balancing handles distribution."]}),e.jsx("h2",{children:"53.10 — The Feature Build Pipeline (Centrepiece)"}),e.jsxs("p",{children:["Feature: ",e.jsx("em",{children:"Saved Search Email Alerts"}),". The PM clarifies scope, writes a ticket, and posts it to the EM. The EM decomposes into three parallel workstreams: BE-1 (endpoint), BE-2 (email worker), FE (UI component).",e.jsx("code",{children:"asyncio.gather"})," fans them out concurrently. QA gates all six changed files. Wall-clock: ",e.jsx("strong",{children:"60.5 s"})," vs ",e.jsx("strong",{children:"79.7 s"})," sequential — ",e.jsx("strong",{children:"19.2 s saved"}),"."]}),e.jsx(f,{title:"pipeline/feature_pipeline.py — Full Pipeline",language:"python",keyLine:34,keyNote:"asyncio.gather fans out 3 agents concurrently — the entire BE+FE work happens in parallel",children:M}),e.jsx(W,{}),e.jsx("h2",{children:"53.11 — Observability Across Agent Boundaries"}),e.jsxs("p",{children:["Each agent decorates its main function with ",e.jsx("code",{children:"@traceable"})," and injects ",e.jsx("code",{children:"msg_id"})," from the A2A envelope as LangSmith run metadata. Filtering LangSmith by ",e.jsx("code",{children:"msg_id=7f3e2a1b..."})," collapses the distributed trace into a single waterfall. The critical path is ",e.jsx("strong",{children:"PM → EM → be-agent-1 → QA"}),". The bottleneck is ",e.jsx("code",{children:"be-agent-1/run_bash:pytest"})," at ",e.jsx("strong",{children:"12.3 s"})," — the next optimisation target."]}),e.jsx(z,{}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"Reading the critical path:"})," The amber ★ spans are on the critical path — they determine the wall-clock floor regardless of how much other work you parallelise. To reduce total time you must reduce one of those spans. The ⚠ red span (pytest) is the largest single contributor."]}),e.jsx("h2",{children:"53.12 — Failure Modes & the Ratchet"}),e.jsx("p",{children:"Deep agent teams introduce failure modes that single-agent systems never encounter: unbounded loops, context overflow, test-environment bleed, premature fan-out, cost runaway, and file-ownership conflicts. The AGENTS.md ratchet encodes the rule that prevents each failure — once added, rules are never removed."}),e.jsx(D,{}),e.jsxs("div",{className:"callout callout-gotcha",children:[e.jsx("strong",{children:"The ratchet principle:"})," Every incident you survive becomes a permanent rule in AGENTS.md. The file only grows. Future agents (and humans) onboarding to the team inherit the collective scar tissue without having to repeat the incidents."]}),e.jsxs("div",{className:"callout callout-maang",children:[e.jsx("strong",{children:"MAANG Interview Connection"}),` — "How do you scale an agent past a single context window?" → Deep agent teams: specialised roles, each with a focused system prompt and bounded context. Fan-out via asyncio.gather for parallel workstreams. A2A HTTP+SSE envelopes for cross-service calls. Distributed tracing with msg_id correlation. AGENTS.md ratchet for operational hardening. "What's the failure mode of parallel delegation?" → EM fans out before PM ticket is in completed state (rule #4 above). Circuit breakers: max_turns, max_rejections, disjoint file ownership.`]}),e.jsx(_,{moduleId:53,title:"Module 53: Deep Agents — Engineering Agent Teams",contentHint:"ReAct shallow vs deep agent call stack depth, PM EM BE FE QA roles and tools, A2A message envelope msg_id from_agent to_agent task_type payload, Redis Streams audit log, Anthropic SDK tool-use loop, asyncio.gather fan-out BE FE parallel, Docker Compose x-agent-base anchor YAML, Dockerfile non-root user, pipeline wall-clock 60.5s vs 79.7s sequential, LangSmith cross-agent trace msg_id correlation, critical path amber spans be-agent-1 pytest bottleneck, AGENTS.md ratchet max_turns max_rejections disjoint file sets"})]})}export{F as Mod53};
