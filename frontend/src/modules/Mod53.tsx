import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CodeBlock, CodeDiff } from '../components/CodeBlock';
import { QuizSection } from '../components/QuizSection';

// ─── CODE CONSTANTS ────────────────────────────────────────────────────────────

const CODE_PM_AGENT = `# agents/pm_agent.py
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
        messages.append({"role": "user", "content": tool_results})`;

const CODE_EM_AGENT = `# agents/em_agent.py
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
        messages.append({"role": "user", "content": tool_results})`;

const CODE_BE_AGENT = `# agents/be_agent.py
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
        messages.append({"role": "user", "content": tool_results})`;

const CODE_FE_AGENT = `# agents/fe_agent.py
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
        messages.append({"role": "user", "content": tool_results})`;

const CODE_QA_AGENT = `# agents/qa_agent.py
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
        messages.append({"role": "user", "content": tool_results})`;

const CODE_DOCKER_COMPOSE = `# docker-compose.yml — Housing.com AI Agent Team
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
    driver: bridge`;

const CODE_DOCKERFILE = `# Dockerfile.agent — shared base for all Housing.com agents
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

EXPOSE 8001-8010`;

const CODE_PIPELINE_FLOW = `# pipeline/feature_pipeline.py — Saved Search Email Alerts
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
    asyncio.run(run_feature_pipeline("Add Saved Search Email Alerts for users"))`;

// ─── VIZ COMPONENTS ───────────────────────────────────────────────────────────

function DeepVsReActViz() {
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>ReAct (Shallow) vs Deep Agent Team — Architecture Comparison</div>
      <style>{`
        @keyframes dashFlow53 { to { stroke-dashoffset: -16; } }
        .dash53 { animation: dashFlow53 1.2s linear infinite; }
      `}</style>
      <svg viewBox="0 0 580 200" width="100%" style={{display:'block'}} aria-label="ReAct vs Deep Agent diagram">
        <defs>
          <marker id="arr53-gray" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L7,2.5 z" fill="#585b70"/>
          </marker>
          <marker id="arr53-purple" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L7,2.5 z" fill="#cba6f7"/>
          </marker>
          <marker id="arr53-blue" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L7,2.5 z" fill="#89b4fa"/>
          </marker>
          <marker id="arr53-green" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L7,2.5 z" fill="#a6e3a1"/>
          </marker>
        </defs>

        {/* ── Left panel: ReAct ── */}
        <text x="140" y="16" fontSize="11" fill="#cdd6f4" textAnchor="middle" fontWeight="700">ReAct (Shallow)</text>
        {/* dashed context boundary */}
        <rect x="30" y="22" width="220" height="155" rx="6" fill="none" stroke="#45475a" strokeWidth="1.2" strokeDasharray="5 3"/>
        <text x="58" y="35" fontSize="9" fill="#6c7086" fontStyle="italic">1 context window</text>
        {/* User → Agent */}
        <text x="10" y="85" fontSize="9" fill="#bac2de">User</text>
        <line x1="32" y1="82" x2="65" y2="82" stroke="#585b70" strokeWidth="1.2" markerEnd="url(#arr53-gray)"/>
        {/* Agent box */}
        <rect x="68" y="65" width="90" height="36" rx="5" fill="#313244" stroke="#45475a" strokeWidth="1.5"/>
        <text x="113" y="79" fontSize="10" fill="#cdd6f4" textAnchor="middle" fontWeight="600">Agent</text>
        <text x="113" y="93" fontSize="8.5" fill="#6c7086" textAnchor="middle">Reason→Act→Observe</text>
        {/* cyclic arrow */}
        <path d="M158,72 Q195,50 195,83 Q195,108 158,101" fill="none" stroke="#585b70" strokeWidth="1.2" markerEnd="url(#arr53-gray)" strokeDasharray="3 2" className="dash53"/>
        <text x="200" y="84" fontSize="8" fill="#6c7086">loop</text>
        {/* Tools below */}
        {['search','write','bash'].map((t,i)=>(
          <g key={t}>
            <rect x={68+i*34} y={118} width={30} height={18} rx="3" fill="#1e1e2e" stroke="#45475a" strokeWidth="1"/>
            <text x={68+i*34+15} y={130} fontSize="7.5" fill="#6c7086" textAnchor="middle">{t}</text>
          </g>
        ))}
        <text x="113" y="155" fontSize="8" fill="#6c7086" textAnchor="middle">tools (same context)</text>
        {/* Result → */}
        <line x1="160" y1="82" x2="230" y2="82" stroke="#a6e3a1" strokeWidth="1.2" markerEnd="url(#arr53-green)"/>
        <text x="237" y="86" fontSize="8.5" fill="#a6e3a1">result</text>

        {/* ── Divider ── */}
        <line x1="295" y1="20" x2="295" y2="185" stroke="#313244" strokeWidth="1"/>

        {/* ── Right panel: Deep Agent Team ── */}
        <text x="440" y="16" fontSize="11" fill="#cdd6f4" textAnchor="middle" fontWeight="700">Deep Agent Team</text>
        {/* User → PM */}
        <text x="308" y="58" fontSize="9" fill="#bac2de">User</text>
        <line x1="328" y1="55" x2="350" y2="55" stroke="#cba6f7" strokeWidth="1.2" markerEnd="url(#arr53-purple)"/>

        {/* PM box */}
        <rect x="353" y="44" width="78" height="24" rx="5" fill="#cba6f720" stroke="#cba6f7" strokeWidth="1.5"/>
        <text x="392" y="60" fontSize="9.5" fill="#cba6f7" textAnchor="middle" fontWeight="700">PM</text>
        {/* PM dashed boundary */}
        <rect x="349" y="40" width="86" height="32" rx="5" fill="none" stroke="#cba6f766" strokeWidth="0.8" strokeDasharray="4 3"/>

        {/* PM → EM A2A arrow */}
        <line x1="392" y1="72" x2="392" y2="90" stroke="#cba6f7" strokeWidth="1.2" strokeDasharray="4 3" className="dash53" markerEnd="url(#arr53-purple)"/>
        <text x="398" y="84" fontSize="8" fill="#6c7086">A2A HTTP+SSE</text>

        {/* EM box */}
        <rect x="353" y="93" width="78" height="24" rx="5" fill="#89b4fa20" stroke="#89b4fa" strokeWidth="1.5"/>
        <text x="392" y="109" fontSize="9.5" fill="#89b4fa" textAnchor="middle" fontWeight="700">EM</text>
        <rect x="349" y="89" width="86" height="32" rx="5" fill="none" stroke="#89b4fa66" strokeWidth="0.8" strokeDasharray="4 3"/>

        {/* EM → BE A2A arrow */}
        <line x1="392" y1="121" x2="392" y2="140" stroke="#89b4fa" strokeWidth="1.2" strokeDasharray="4 3" className="dash53" markerEnd="url(#arr53-blue)"/>
        <text x="398" y="134" fontSize="8" fill="#6c7086">A2A HTTP+SSE</text>

        {/* BE box */}
        <rect x="353" y="143" width="78" height="24" rx="5" fill="#a6e3a120" stroke="#a6e3a1" strokeWidth="1.5"/>
        <text x="392" y="159" fontSize="9.5" fill="#a6e3a1" textAnchor="middle" fontWeight="700">BE</text>
        <rect x="349" y="139" width="86" height="32" rx="5" fill="none" stroke="#a6e3a166" strokeWidth="0.8" strokeDasharray="4 3"/>

        {/* Result ← BE */}
        <line x1="434" y1="155" x2="558" y2="155" stroke="#a6e3a1" strokeWidth="1.2" markerEnd="url(#arr53-green)"/>
        <text x="562" y="159" fontSize="8.5" fill="#a6e3a1">result</text>

        {/* call stack depth labels */}
        <text x="480" y="58" fontSize="8" fill="#6c7086">depth 1</text>
        <text x="480" y="109" fontSize="8" fill="#6c7086">depth 2</text>
        <text x="480" y="155" fontSize="8" fill="#6c7086">depth 3</text>
      </svg>
    </div>
  );
}

const ROLE_DETAILS: Record<string, {color:string; system:string; tools:string[]; container:string}> = {
  PM:  { color:'#cba6f7', system:'Turn raw feature requests into precise engineering tickets. Clarify scope before writing.', tools:['clarify_requirements','write_ticket','post_to_em'], container:'pm-agent:8001' },
  EM:  { color:'#89b4fa', system:'Decompose tickets, fan-out to BE/FE in parallel, collect results, gate on QA.', tools:['decompose_ticket','delegate_task','delegate_to_qa'], container:'em-agent:8002' },
  BE:  { color:'#a6e3a1', system:'Senior Backend Eng: FastAPI, Python 3.12, Redis, PostgreSQL. Never return until tests are green.', tools:['read_file','write_file','run_bash','search_codebase'], container:'be-agent:8003' },
  FE:  { color:'#89dceb', system:'Senior FE Eng: React 19, TypeScript, Tailwind. Run npm run build after every write.', tools:['read_file','write_file','run_bash','search_codebase'], container:'fe-agent:8005' },
  QA:  { color:'#fab387', system:'QA gate: run full test suite, verify coverage≥80%, approve or reject.', tools:['read_file','write_file','run_bash'], container:'qa-agent:8006' },
};

function TeamOrgChartViz() {
  const [selectedRole, setSelectedRole] = useState<string|null>(null);

  const nodes = [
    {id:'PM', x:60, y:90, label:'PM'},
    {id:'EM', x:230, y:90, label:'EM'},
    {id:'BE', x:420, y:55, label:'BE-1'},
    {id:'BE2',x:420, y:105, label:'BE-2'},
    {id:'FE', x:420, y:155, label:'FE'},
    {id:'QA', x:520, y:165, label:'QA'},
  ];

  const edges = [
    {from:'PM',to:'EM'},
    {from:'EM',to:'BE'},
    {from:'EM',to:'BE2'},
    {from:'EM',to:'FE'},
    {from:'EM',to:'QA'},
  ];

  const getXY = (id:string) => nodes.find(n=>n.id===id) ?? {x:0,y:0};
  const roleKey = (id:string) => id === 'BE2' ? 'BE' : id;
  const details = selectedRole ? ROLE_DETAILS[roleKey(selectedRole)] : null;

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'10px'}}>AGENT TEAM ORG CHART — Click a role to inspect</div>
      <svg viewBox="0 0 600 220" width="100%" style={{display:'block'}} aria-label="Team org chart">
        <defs>
          {Object.entries(ROLE_DETAILS).map(([k,v])=>(
            <marker key={k} id={`arr53org-${k}`} markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
              <path d="M0,0 L0,5 L7,2.5 z" fill={v.color}/>
            </marker>
          ))}
        </defs>
        {edges.map((e,i)=>{
          const f=getXY(e.from); const t=getXY(e.to);
          const rk = roleKey(e.to);
          return <line key={i} x1={f.x+28} y1={f.y} x2={t.x-28} y2={t.y}
            stroke={ROLE_DETAILS[rk]?.color ?? '#585b70'} strokeWidth="1.2"
            markerEnd={`url(#arr53org-${rk})`}/>;
        })}
        {nodes.map(n=>{
          const rk = roleKey(n.id);
          const col = ROLE_DETAILS[rk]?.color ?? '#585b70';
          const isSelected = selectedRole === n.id;
          return (
            <g key={n.id} style={{cursor:'pointer'}} onClick={()=>setSelectedRole(selectedRole===n.id?null:n.id)}>
              <rect x={n.x-28} y={n.y-16} width={56} height={32} rx="6"
                fill={isSelected ? col+'33' : '#1e1e2e'}
                stroke={col} strokeWidth={isSelected?2:1.5}/>
              <text x={n.x} y={n.y+5} fontSize="10" fill={col} textAnchor="middle" fontWeight="700">{n.label}</text>
            </g>
          );
        })}
      </svg>
      {details && selectedRole && (
        <motion.div
          initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} transition={{duration:0.18}}
          style={{marginTop:'12px',padding:'14px 16px',background:'#1e1e2e',borderRadius:'6px',
            borderLeft:`3px solid ${details.color}`}}
        >
          <div style={{fontSize:'0.78rem',fontWeight:700,color:details.color,marginBottom:'6px'}}>
            {roleKey(selectedRole)} — {details.container}
          </div>
          <div style={{fontSize:'0.8rem',color:'#bac2de',marginBottom:'8px',fontStyle:'italic'}}>
            "{details.system}"
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
            {details.tools.map(t=>(
              <span key={t} style={{fontSize:'0.72rem',background:'#313244',color:'#cdd6f4',
                padding:'2px 8px',borderRadius:'10px',fontFamily:'monospace'}}>{t}</span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

const ENVELOPE_CODE = `{
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
}`;

function MessageEnvelopeViz() {
  const fields = [
    {key:'msg_id', color:'#cba6f7', note:'UUID — correlation key for distributed tracing'},
    {key:'from_agent', color:'#89b4fa', note:'Sender identity (matches container DNS name)'},
    {key:'to_agent', color:'#a6e3a1', note:'Receiver identity (Docker service name)'},
    {key:'task_type', color:'#f9e2af', note:'Discriminator for receiver routing logic'},
    {key:'payload', color:'#fab387', note:'Structured task data — varies per task_type'},
  ];
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>A2A MESSAGE ENVELOPE — Every inter-agent message</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'16px'}}>
        <div>
          {fields.map(f=>(
            <div key={f.key} style={{display:'flex',alignItems:'flex-start',gap:'10px',marginBottom:'8px',
              borderLeft:`3px solid ${f.color}`,paddingLeft:'10px'}}>
              <span style={{fontFamily:'monospace',fontSize:'0.8rem',color:f.color,flexShrink:0,minWidth:'90px'}}>{f.key}</span>
              <span style={{fontSize:'0.76rem',color:'#6c7086'}}>{f.note}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{fontSize:'0.72rem',color:'#6c7086',marginBottom:'8px',fontWeight:600}}>REDIS STREAM AUDIT LOG</div>
          <svg viewBox="0 0 220 120" width="100%" style={{display:'block'}}>
            <rect x="0" y="10" width="220" height="100" rx="6" fill="#1e1e2e" stroke="#313244" strokeWidth="1"/>
            <text x="110" y="26" fontSize="9" fill="#6c7086" textAnchor="middle" fontWeight="700">redis-stream: a2a:audit</text>
            {[0,1,2].map(i=>(
              <g key={i}>
                <rect x="10" y={36+i*24} width="200" height="18" rx="3" fill="#313244"/>
                <text x="20" y={36+i*24+12} fontSize="8" fill="#89b4fa" fontFamily="monospace">
                  {['pm→em: ticket_ready','em→be1: implement_endpoint','em→fe: build_ui'][i]}
                </text>
                <rect x="185" y={36+i*24+3} width="18" height="12" rx="2" fill="#181825"/>
                <text x="194" y={36+i*24+12} fontSize="7" fill="#a6e3a1" textAnchor="middle">✓</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
      <CodeBlock title="A2A Envelope — Full Example" language="json" collapsible={false}>{ENVELOPE_CODE}</CodeBlock>
    </div>
  );
}

function DockerTeamViz() {
  const [launching, setLaunching] = useState(false);
  const [launchedCount, setLaunchedCount] = useState(0);

  const services = [
    {id:'redis',  label:'Redis',    port:'6379', color:'#f38ba8', x:60,  y:120},
    {id:'pm',     label:'PM Agent', port:'8001', color:'#cba6f7', x:170, y:50},
    {id:'em',     label:'EM Agent', port:'8002', color:'#89b4fa', x:300, y:120},
    {id:'be1',    label:'BE Agent', port:'8003', color:'#a6e3a1', x:450, y:60},
    {id:'fe',     label:'FE Agent', port:'8005', color:'#89dceb', x:450, y:150},
    {id:'qa',     label:'QA Agent', port:'8006', color:'#fab387', x:300, y:220},
  ];

  const edges = [
    ['redis','em'],['pm','em'],['em','be1'],['em','fe'],['em','qa'],
  ];

  useEffect(() => {
    if (!launching) return;
    if (launchedCount >= services.length) return;
    const t = setTimeout(() => setLaunchedCount(c => c+1), 400);
    return () => clearTimeout(t);
  }, [launching, launchedCount]);

  const isLive = (i:number) => i < launchedCount;

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
        <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086'}}>DOCKER NETWORK: agent-team</div>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          {launchedCount === services.length && (
            <span style={{fontSize:'0.78rem',color:'#a6e3a1',fontWeight:700}}>All services healthy ✓</span>
          )}
          <button
            onClick={()=>{ if(!launching){ setLaunchedCount(0); setLaunching(true); } }}
            disabled={launching && launchedCount < services.length}
            style={{background:'#313244',border:'1px solid #45475a',color:'#cdd6f4',
              borderRadius:'6px',padding:'6px 14px',fontSize:'0.78rem',cursor:'pointer',fontWeight:600}}
          >
            {launching && launchedCount < services.length ? 'Starting...' : 'docker compose up'}
          </button>
        </div>
      </div>
      <svg viewBox="0 0 640 300" width="100%" style={{display:'block'}} aria-label="Docker services network diagram">
        {/* outer network boundary */}
        <rect x="4" y="4" width="632" height="292" rx="8" fill="none" stroke="#313244" strokeWidth="1.5" strokeDasharray="6 4"/>
        {/* edges */}
        {edges.map(([a,b],i)=>{
          const sa = services.find(s=>s.id===a)!;
          const sb = services.find(s=>s.id===b)!;
          return <line key={i} x1={sa.x+44} y1={sa.y+18} x2={sb.x} y2={sb.y+18}
            stroke="#45475a" strokeWidth="1" strokeDasharray="3 3"/>;
        })}
        {/* service boxes */}
        {services.map((s,i)=>(
          <g key={s.id}>
            <rect x={s.x} y={s.y} width={116} height={40} rx="6"
              fill={isLive(i) ? s.color+'18' : '#1e1e2e'}
              stroke={isLive(i) ? s.color : '#45475a'} strokeWidth={isLive(i)?1.8:1}/>
            <text x={s.x+12} y={s.y+14} fontSize="9.5" fill={isLive(i)?s.color:'#585b70'} fontWeight="700">{s.label}</text>
            <text x={s.x+12} y={s.y+28} fontSize="8" fill="#6c7086">:{s.port}</text>
            {/* health dot */}
            <circle cx={s.x+102} cy={s.y+12} r="5"
              fill={isLive(i) ? '#a6e3a1' : '#313244'}
              stroke={isLive(i) ? '#a6e3a1' : '#45475a'} strokeWidth="1"/>
          </g>
        ))}
      </svg>
    </div>
  );
}

function PipelineFlowViz() {
  const [step, setStep] = useState(0);
  const maxStep = 7;

  const stepLabels = [
    'Initial state',
    'User → PM: feature request',
    'PM clarifies + writes ticket',
    'EM decomposes ticket',
    'Fan-out: BE-1, BE-2, FE in parallel',
    'BE-1, BE-2, FE all done',
    'QA gates: 6 files, 86% coverage',
    'PR #1402 ready',
  ];

  const nodes = [
    {id:'user',  x:20,  y:120, w:60,  h:30, label:'User',  color:'#6c7086'},
    {id:'pm',    x:110, y:120, w:60,  h:30, label:'PM',    color:'#cba6f7'},
    {id:'em',    x:220, y:120, w:60,  h:30, label:'EM',    color:'#89b4fa'},
    {id:'be1',   x:360, y:70,  w:60,  h:30, label:'BE-1',  color:'#a6e3a1'},
    {id:'be2',   x:360, y:115, w:60,  h:30, label:'BE-2',  color:'#a6e3a1'},
    {id:'fe',    x:360, y:160, w:60,  h:30, label:'FE',    color:'#89dceb'},
    {id:'qa',    x:490, y:120, w:60,  h:30, label:'QA',    color:'#fab387'},
    {id:'done',  x:600, y:120, w:70,  h:30, label:'PR ✓',  color:'#a6e3a1'},
  ];

  // which arrows are active per step
  const activeEdges: Record<number,string[]> = {
    1:['user-pm'], 2:['pm-em'], 3:['em-be1','em-be2','em-fe'], 4:['em-be1','em-be2','em-fe'],
    5:['be1-qa','be2-qa','fe-qa'], 6:['qa-done'], 7:['qa-done'],
  };
  const activeNodes: Record<number,string[]> = {
    1:['user','pm'], 2:['pm','em'], 3:['em','be1','be2','fe'], 4:['be1','be2','fe'],
    5:['be1','be2','fe','qa'], 6:['qa','done'], 7:['done'],
  };

  const isNodeActive = (id:string) => (activeNodes[step]??[]).includes(id);
  const isEdgeActive = (id:string) => (activeEdges[step]??[]).includes(id);

  const getNode = (id:string) => nodes.find(n=>n.id===id)!;

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
        <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086'}}>FEATURE BUILD PIPELINE — Saved Search Email Alerts</div>
        <span style={{fontSize:'0.78rem',color:'#6c7086',background:'#313244',padding:'3px 10px',borderRadius:'10px'}}>Step {step} of {maxStep}</span>
      </div>
      <svg viewBox="0 0 700 240" width="100%" style={{display:'block'}} aria-label="Pipeline flow diagram">
        <defs>
          <marker id="arr53pipe" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L7,2.5 z" fill="#585b70"/>
          </marker>
          <marker id="arr53pipeactive" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L7,2.5 z" fill="#f9e2af"/>
          </marker>
        </defs>
        {/* edges */}
        {[
          {id:'user-pm', f:'user', t:'pm'},
          {id:'pm-em',   f:'pm',  t:'em'},
          {id:'em-be1',  f:'em',  t:'be1'},
          {id:'em-be2',  f:'em',  t:'be2'},
          {id:'em-fe',   f:'em',  t:'fe'},
          {id:'be1-qa',  f:'be1', t:'qa'},
          {id:'be2-qa',  f:'be2', t:'qa'},
          {id:'fe-qa',   f:'fe',  t:'qa'},
          {id:'qa-done', f:'qa',  t:'done'},
        ].map(e=>{
          const fn = getNode(e.f); const tn = getNode(e.t);
          const active = isEdgeActive(e.id);
          return <line key={e.id}
            x1={fn.x+fn.w} y1={fn.y+fn.h/2}
            x2={tn.x} y2={tn.y+tn.h/2}
            stroke={active?'#f9e2af':'#313244'} strokeWidth={active?2:1}
            markerEnd={active?'url(#arr53pipeactive)':'url(#arr53pipe)'}/>;
        })}
        {/* parallel label at step 3 */}
        {step >= 3 && step <= 5 && (
          <text x="316" y="116" fontSize="8.5" fill="#f9e2af" textAnchor="middle" fontWeight="700">parallel</text>
        )}
        {/* 6 files badge step 5+ */}
        {step >= 5 && (
          <g>
            <rect x="455" y="104" width="36" height="14" rx="3" fill="#f9e2af22" stroke="#f9e2af" strokeWidth="0.8"/>
            <text x="473" y="114" fontSize="7.5" fill="#f9e2af" textAnchor="middle">6 files</text>
          </g>
        )}
        {/* QA coverage badge step 6 */}
        {step >= 6 && (
          <text x="520" y="165" fontSize="8" fill="#a6e3a1" textAnchor="middle">✓ 86% cov</text>
        )}
        {/* PR badge step 7 */}
        {step >= 7 && (
          <g>
            <rect x="590" y="108" width="80" height="16" rx="3" fill="#a6e3a122" stroke="#a6e3a1" strokeWidth="1"/>
            <text x="630" y="119" fontSize="8" fill="#a6e3a1" textAnchor="middle">PR #1402 ready</text>
          </g>
        )}
        {/* nodes */}
        {nodes.map(n=>{
          const active = isNodeActive(n.id);
          return (
            <g key={n.id}>
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="5"
                fill={active ? n.color+'22' : '#1e1e2e'}
                stroke={active ? n.color : '#45475a'} strokeWidth={active?2:1}/>
              <text x={n.x+n.w/2} y={n.y+n.h/2+4} fontSize="10" fill={active?n.color:'#585b70'}
                textAnchor="middle" fontWeight={active?"700":"400"}>{n.label}</text>
            </g>
          );
        })}
      </svg>
      {/* step description */}
      <div style={{marginTop:'10px',padding:'8px 14px',background:'#1e1e2e',borderRadius:'6px',
        fontSize:'0.82rem',color:'#bac2de',minHeight:'32px'}}>
        {step === 0 ? 'Press "Next Step" to walk through the pipeline.' : stepLabels[step]}
      </div>
      <div style={{display:'flex',gap:'8px',marginTop:'10px'}}>
        <button onClick={()=>setStep(s=>Math.min(s+1,maxStep))}
          disabled={step===maxStep}
          style={{background:step<maxStep?'#313244':'#1e1e2e',border:'1px solid #45475a',
            color:step<maxStep?'#cdd6f4':'#45475a',borderRadius:'6px',padding:'6px 16px',
            fontSize:'0.8rem',cursor:step<maxStep?'pointer':'default',fontWeight:600}}>
          Next Step →
        </button>
        <button onClick={()=>setStep(0)}
          style={{background:'none',border:'1px solid #45475a',color:'#6c7086',
            borderRadius:'6px',padding:'6px 12px',fontSize:'0.8rem',cursor:'pointer'}}>
          Reset
        </button>
      </div>
      {step === maxStep && (
        <div style={{marginTop:'10px',padding:'8px 14px',background:'#a6e3a110',
          border:'1px solid #a6e3a1',borderRadius:'6px',fontSize:'0.8rem',color:'#a6e3a1'}}>
          Wall-clock: 60.5s | Sequential would be: 79.7s | Parallelism saved: 19.2s
        </div>
      )}
    </div>
  );
}

function CrossAgentTraceViz() {
  const [expanded, setExpanded] = useState<string[]>(['pm','em','em-be1','be1','qa']);

  interface Span {
    id: string; parent: string|null; label: string; duration: string; durationMs: number;
    maxMs: number; color: string; critical?: boolean; slowest?: boolean; indent: number;
  }

  const spans: Span[] = [
    {id:'pm',      parent:null,  indent:0, label:'pm-agent',               duration:'12.4s', durationMs:12400, maxMs:12400, color:'#cba6f7'},
    {id:'pm-cl',   parent:'pm',  indent:1, label:'clarify_requirements',   duration:'1.2s',  durationMs:1200,  maxMs:12400, color:'#cba6f7'},
    {id:'pm-wt',   parent:'pm',  indent:1, label:'write_ticket',           duration:'0.3s',  durationMs:300,   maxMs:12400, color:'#cba6f7'},
    {id:'pm-pe',   parent:'pm',  indent:1, label:'post_to_em',             duration:'0.1s',  durationMs:100,   maxMs:12400, color:'#cba6f7'},
    {id:'em',      parent:null,  indent:0, label:'em-agent',               duration:'48.1s', durationMs:48100, maxMs:48100, color:'#89b4fa'},
    {id:'em-dt',   parent:'em',  indent:1, label:'decompose_ticket',       duration:'0.8s',  durationMs:800,   maxMs:48100, color:'#89b4fa'},
    {id:'em-be1',  parent:'em',  indent:1, label:'delegate→be-agent-1 ★', duration:'38.2s', durationMs:38200, maxMs:48100, color:'#f9e2af', critical:true},
    {id:'em-be2',  parent:'em',  indent:1, label:'delegate→be-agent-2',   duration:'22.1s', durationMs:22100, maxMs:48100, color:'#89b4fa'},
    {id:'em-fe',   parent:'em',  indent:1, label:'delegate→fe-agent',     duration:'19.4s', durationMs:19400, maxMs:48100, color:'#89b4fa'},
    {id:'be1',     parent:null,  indent:0, label:'be-agent-1',             duration:'38.2s', durationMs:38200, maxMs:38200, color:'#a6e3a1'},
    {id:'be1-rf',  parent:'be1', indent:1, label:'read_file ×3',           duration:'0.3s',  durationMs:300,   maxMs:38200, color:'#a6e3a1'},
    {id:'be1-wf',  parent:'be1', indent:1, label:'write_file ×2',         duration:'0.4s',  durationMs:400,   maxMs:38200, color:'#a6e3a1'},
    {id:'be1-py',  parent:'be1', indent:1, label:'run_bash:pytest ⚠',      duration:'12.3s', durationMs:12300, maxMs:38200, color:'#f38ba8', slowest:true},
    {id:'qa',      parent:null,  indent:0, label:'qa-agent',               duration:'28.4s', durationMs:28400, maxMs:28400, color:'#fab387'},
    {id:'qa-test', parent:'qa',  indent:1, label:'run_bash:pytest+vitest', duration:'24.1s', durationMs:24100, maxMs:28400, color:'#fab387'},
  ];

  const toggle = (id:string) => setExpanded(e => e.includes(id) ? e.filter(x=>x!==id) : [...e,id]);
  const isVisible = (s:Span) => {
    if (!s.parent) return true;
    return expanded.includes(s.parent);
  };

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'10px'}}>CROSS-AGENT TRACE — msg_id: 7f3e2a1b... (LangSmith view)</div>
      <div style={{fontSize:'0.76rem',color:'#6c7086',marginBottom:'10px'}}>Click rows to expand/collapse</div>
      <div style={{background:'#1e1e2e',borderRadius:'6px',padding:'10px',fontFamily:'monospace',fontSize:'0.8rem'}}>
        {spans.map(s => isVisible(s) && (
          <div key={s.id}
            onClick={()=>toggle(s.id)}
            style={{
              display:'flex', alignItems:'center', padding:'5px 4px',
              marginLeft:`${s.indent*22}px`,
              borderLeft: s.indent>0 ? '1px solid #45475a' : 'none',
              paddingLeft: s.indent>0 ? '10px' : '4px',
              cursor:'pointer', borderRadius:'4px', marginBottom:'2px',
              background: s.slowest ? '#f38ba811' : s.critical ? '#f9e2af08' : 'transparent',
              borderLeftColor: s.slowest ? '#f38ba8' : s.indent>0 ? '#45475a' : 'transparent',
            }}
          >
            <span style={{color:'#6c7086',marginRight:'6px',fontSize:'0.68rem'}}>
              {s.indent===0 ? (expanded.includes(s.id)?'▾':'▸') : '·'}
            </span>
            <span style={{color: s.critical ? '#f9e2af' : s.color, flex:1}}>{s.label}</span>
            {/* bar */}
            <span style={{display:'inline-block', width:`${Math.max(4,Math.round((s.durationMs/s.maxMs)*100))}px`,
              height:'6px', borderRadius:'2px', marginLeft:'8px',
              background: s.critical ? '#f9e2af' : s.slowest ? '#f38ba8' : s.color,
              opacity:0.7}}/>
            <span style={{color:'#bac2de',marginLeft:'10px',fontSize:'0.76rem',minWidth:'42px',textAlign:'right'}}>
              {s.duration}
            </span>
          </div>
        ))}
      </div>
      <div style={{marginTop:'12px',padding:'8px 12px',background:'#313244',borderRadius:'6px',
        display:'flex',gap:'20px',flexWrap:'wrap',fontSize:'0.76rem',color:'#bac2de'}}>
        <span>Wall-clock: <strong style={{color:'#cdd6f4'}}>60.5s</strong></span>
        <span>Parallelism saved: <strong style={{color:'#a6e3a1'}}>41.5s</strong></span>
        <span>Cost: <strong style={{color:'#f9e2af'}}>$0.059</strong></span>
        <span style={{color:'#f38ba8'}}>⚠ Bottleneck: be-agent-1/pytest (12.3s)</span>
      </div>
    </div>
  );
}

const INCIDENTS = [
  {title:'Agent loop doesn\'t terminate', symptom:'PM keeps calling clarify_requirements forever', rule:'max_turns: 20 circuit breaker on every agent'},
  {title:'Context window overflow',        symptom:'BE agent crashes on large repo search',         rule:'read_file limit: 10 files per task in system prompt'},
  {title:'Test env not isolated',          symptom:'QA writes files and breaks production data',    rule:'QA mounts all volumes read-only'},
  {title:'EM fans out before PM done',     symptom:'EM receives incomplete ticket, tasks mismatch', rule:'A2A enforces completed state before delegation'},
  {title:'Cost runaway on QA rejection',   symptom:'QA keeps rejecting, BE keeps rewriting forever',rule:'max_rejections: 2 then escalate_to_human'},
  {title:'Duplicate file writes',          symptom:'BE-1 and BE-2 overwrite each other\'s files',   rule:'decompose_ticket must assign disjoint file sets'},
];

function FailureModeSimulator() {
  const [incidentCount, setIncidentCount] = useState(0);
  const revealed = INCIDENTS.slice(0, incidentCount);

  // gear rotation: 60 deg per tooth (6 incidents)
  const gearAngle = incidentCount * 60;

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
        <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086'}}>FAILURE MODE SIMULATOR — AGENTS.md ratchet</div>
        <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
          <svg width="32" height="32" viewBox="-16 -16 32 32" aria-hidden="true">
            <g style={{transform:`rotate(${gearAngle}deg)`,transformOrigin:'center',transition:'transform 0.4s ease'}}>
              {[0,1,2,3,4,5,6,7].map(i=>{
                const a = (i*45)*Math.PI/180;
                return <rect key={i} x="-3" y="-14" width="6" height="6" rx="1"
                  fill="#fab387"
                  style={{transform:`rotate(${i*45}deg)`,transformOrigin:'center'}}/>;
              })}
              <circle cx="0" cy="0" r="8" fill="#181825" stroke="#fab387" strokeWidth="2"/>
              <circle cx="0" cy="0" r="3" fill="#fab387"/>
            </g>
          </svg>
          <button
            onClick={()=>setIncidentCount(c=>Math.min(c+1,INCIDENTS.length))}
            disabled={incidentCount>=INCIDENTS.length}
            style={{background:incidentCount<INCIDENTS.length?'#fab38722':'#1e1e2e',
              border:`1px solid ${incidentCount<INCIDENTS.length?'#fab387':'#313244'}`,
              color:incidentCount<INCIDENTS.length?'#fab387':'#45475a',
              borderRadius:'6px',padding:'7px 16px',fontSize:'0.8rem',
              cursor:incidentCount<INCIDENTS.length?'pointer':'default',fontWeight:700}}
          >
            {incidentCount >= INCIDENTS.length ? 'All incidents simulated' : 'Simulate Incident'}
          </button>
        </div>
      </div>
      {incidentCount === 0 && (
        <div style={{color:'#45475a',fontSize:'0.82rem',textAlign:'center',padding:'20px 0'}}>
          Click "Simulate Incident" to surface real failure modes and the AGENTS.md rule that prevents them.
        </div>
      )}
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {revealed.map((inc,i)=>(
          <motion.div key={i}
            initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{duration:0.2}}
            style={{padding:'12px 14px',background:'#1e1e2e',borderRadius:'6px',
              borderLeft:'3px solid #fab387'}}
          >
            <div style={{fontWeight:700,fontSize:'0.82rem',color:'#fab387',marginBottom:'3px'}}>
              #{i+1} — {inc.title}
            </div>
            <div style={{fontSize:'0.78rem',color:'#6c7086',marginBottom:'6px'}}>
              Symptom: {inc.symptom}
            </div>
            <div style={{fontSize:'0.78rem',color:'#a6e3a1',fontFamily:'monospace',
              background:'#313244',padding:'4px 8px',borderRadius:'4px',display:'inline-block'}}>
              ✦ AGENTS.md rule: {inc.rule}
            </div>
          </motion.div>
        ))}
      </div>
      {incidentCount >= INCIDENTS.length && (
        <div style={{marginTop:'12px',padding:'10px 14px',background:'#a6e3a110',
          border:'1px solid #a6e3a1',borderRadius:'6px',fontSize:'0.8rem',color:'#a6e3a1'}}>
          Ratchet complete — 6 rules locked into AGENTS.md. Every incident hardens the team contract.
        </div>
      )}
    </div>
  );
}

// ─── MODULE EXPORT ────────────────────────────────────────────────────────────

export function Mod53() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Distinguish ReAct (shallow) from deep agent teams and explain the call-stack analogy</li>
          <li>Design a multi-agent team with PM, EM, BE, FE, and QA roles, each with distinct tools and system prompts</li>
          <li>Implement each agent with the Anthropic SDK tool-use loop and A2A HTTP+SSE envelopes</li>
          <li>Compose the full team with Docker Compose using the x-agent-base anchor pattern</li>
          <li>Fan-out BE+FE work with asyncio.gather and measure wall-clock vs sequential time</li>
          <li>Trace cross-agent calls via msg_id correlation in LangSmith and identify the critical path</li>
          <li>Apply the AGENTS.md ratchet: six failure modes, six hardening rules</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~100 minutes</span>
          <span className="obj-diff">Difficulty: ★★★★★</span>
          <span className="obj-diff">Prerequisites: Modules 42, 50, 51</span>
        </div>
      </div>
      <div className="callout callout-info">
        <strong>Housing.com Context</strong><br />
        The feature "Saved Search Email Alerts" becomes the red thread. We build the PM, EM, BE, FE, and QA agents end-to-end, compose them with Docker, and watch the full pipeline produce a PR in 60.5 seconds — 19 seconds faster than serial execution.
      </div>

      {/* §53.1 */}
      <h2>53.1 — What Makes an Agent "Deep"?</h2>
      <p>
        A standard ReAct agent is one LLM plus a tool loop running inside a single context window.
        <strong> "Deep"</strong> means the action itself is another agent — the call stack depth crosses more than one LLM boundary.
        Think of it as function call depth: a shallow agent calls a tool; a deep agent calls a function that runs its own reasoning loop.
      </p>
      <p>
        <strong>Benefits:</strong> specialisation (each agent has a tightly scoped system prompt), parallelism (fan-out BE+FE work runs concurrently), and isolation (BE context never bleeds into FE context).
        <strong> Trade-offs:</strong> latency adds per hop, cost multiplies with each LLM boundary, and you need distributed tracing (correlation via <code>msg_id</code>) to debug the full call chain.
      </p>
      <DeepVsReActViz />
      <div className="callout callout-tip">
        <strong>When is "deep" worth it?</strong> The break-even is around three or more genuinely independent workstreams. Below that, a single ReAct agent with broad tools is simpler and cheaper. Above that, parallel deep agents reclaim wall-clock time.
      </div>

      {/* §53.2 */}
      <h2>53.2 — The Agent Team Mental Model</h2>
      <p>
        Every role has a <em>distinct system prompt</em> and a <em>distinct tool set</em>. The PM turns raw requests into structured tickets.
        The EM is the orchestrator: it decomposes tickets and fans out work. BE agents write backend code; FE agents write frontend code.
        QA is the final gate — it runs the full test suite and either approves or rejects. EM coordinates but never writes code itself.
      </p>
      <TeamOrgChartViz />

      {/* §53.3 */}
      <h2>53.3 — The A2A Message Envelope</h2>
      <p>
        Every inter-agent message carries a standard envelope: <code>msg_id</code> (UUID used as the distributed trace correlation key),
        <code>from_agent</code>, <code>to_agent</code>, <code>task_type</code>, and <code>payload</code>.
        All envelopes are appended to a Redis Stream (<code>a2a:audit</code>) on send, giving a full audit log that supports replay.
      </p>
      <MessageEnvelopeViz />
      <div className="callout callout-gotcha">
        <strong>msg_id is not optional.</strong> Without it you cannot correlate LangSmith spans across agent boundaries. Add it to every A2A POST body and propagate it as a LangSmith run metadata key.
      </div>

      {/* §53.4 — PM Agent */}
      <h2>53.4 — PM Agent</h2>
      <p>The PM agent enforces the rule: <em>never write a ticket without first scoping the request</em>. It always calls <code>clarify_requirements</code> before <code>write_ticket</code>, then posts the ticket to the EM via <code>post_to_em</code>.</p>
      <CodeBlock title="pm_agent.py — Product Manager Agent" language="python" keyLine={8} keyNote="clarify before writing — PM never specs without scoping">
        {CODE_PM_AGENT}
      </CodeBlock>

      {/* §53.5 — EM Agent */}
      <h2>53.5 — EM Agent</h2>
      <p>The EM agent <em>never writes code</em>. It decomposes tickets and fans out tasks to BE and FE agents concurrently using <code>asyncio.gather</code> inside <code>_fan_out</code>. After collection it gates on QA.</p>
      <CodeBlock title="em_agent.py — Engineering Manager Agent" language="python" keyLine={8} keyNote="never write code — EM only coordinates">
        {CODE_EM_AGENT}
      </CodeBlock>

      {/* §53.6 — BE Agent */}
      <h2>53.6 — BE Agent</h2>
      <p>The BE agent self-verifies: it runs <code>pytest</code> after every file write and only returns when tests exit 0. It tracks <code>changed_files</code> for QA.</p>
      <CodeBlock title="be_agent.py — Backend Engineer Agent" language="python" keyLine={10} keyNote="self-verification: never return until tests are green">
        {CODE_BE_AGENT}
      </CodeBlock>

      {/* §53.7 — FE Agent */}
      <h2>53.7 — FE Agent</h2>
      <p>The FE agent runs <code>npm run build</code> after every write. A non-zero build exit is a hard error — the agent must fix TypeScript errors before signalling completion.</p>
      <CodeBlock title="fe_agent.py — Frontend Engineer Agent" language="python" keyLine={10} keyNote="FE self-verifies: npm run build before signaling done">
        {CODE_FE_AGENT}
      </CodeBlock>

      {/* §53.8 — QA Agent */}
      <h2>53.8 — QA Agent</h2>
      <p>The QA agent is the final gate. It runs <code>pytest</code> and <code>vitest</code>, checks coverage, and returns <code>status: approved</code> or <code>status: rejected</code>. A rejection forces the EM to re-delegate.</p>
      <CodeBlock title="qa_agent.py — QA Gate Agent" language="python" keyLine={13} keyNote="QA is the final gate — reject forces EM to re-delegate">
        {CODE_QA_AGENT}
      </CodeBlock>

      {/* §53.9 — Docker Compose */}
      <h2>53.9 — Docker Compose: The Full Team</h2>
      <p>
        Each agent runs in its own FastAPI container. A shared Redis instance serves as the A2A audit log and pub/sub bus.
        Container DNS provides service discovery — agents call each other by service name (<code>http://em-agent:8002</code>).
        Every service exposes <code>GET /health</code> for Docker's health-check and for the EM to verify agents are ready before delegating.
      </p>
      <CodeBlock title="docker-compose.yml — Agent Team" language="yaml" keyLine={3} keyNote="x-agent-base anchor — change once, applies to all 6 agents">
        {CODE_DOCKER_COMPOSE}
      </CodeBlock>
      <CodeBlock title="Dockerfile.agent — Shared Base Image" language="bash" keyLine={12} keyNote="non-root user — agents never run as root in production">
        {CODE_DOCKERFILE}
      </CodeBlock>
      <DockerTeamViz />
      <div className="callout callout-tip">
        <strong>BE replicas:</strong> The BE agent uses <code>deploy.replicas: 2</code>, so Docker routes tasks across two containers. The EM treats both as addressable via the <code>be-agent</code> DNS name — Docker's built-in load balancing handles distribution.
      </div>

      {/* §53.10 — Pipeline */}
      <h2>53.10 — The Feature Build Pipeline (Centrepiece)</h2>
      <p>
        Feature: <em>Saved Search Email Alerts</em>. The PM clarifies scope, writes a ticket, and posts it to the EM.
        The EM decomposes into three parallel workstreams: BE-1 (endpoint), BE-2 (email worker), FE (UI component).
        <code>asyncio.gather</code> fans them out concurrently. QA gates all six changed files.
        Wall-clock: <strong>60.5 s</strong> vs <strong>79.7 s</strong> sequential — <strong>19.2 s saved</strong>.
      </p>
      <CodeBlock title="pipeline/feature_pipeline.py — Full Pipeline" language="python" keyLine={34} keyNote="asyncio.gather fans out 3 agents concurrently — the entire BE+FE work happens in parallel">
        {CODE_PIPELINE_FLOW}
      </CodeBlock>
      <PipelineFlowViz />

      {/* §53.11 — Observability */}
      <h2>53.11 — Observability Across Agent Boundaries</h2>
      <p>
        Each agent decorates its main function with <code>@traceable</code> and injects <code>msg_id</code> from the A2A envelope as LangSmith run metadata.
        Filtering LangSmith by <code>msg_id=7f3e2a1b...</code> collapses the distributed trace into a single waterfall.
        The critical path is <strong>PM → EM → be-agent-1 → QA</strong>.
        The bottleneck is <code>be-agent-1/run_bash:pytest</code> at <strong>12.3 s</strong> — the next optimisation target.
      </p>
      <CrossAgentTraceViz />
      <div className="callout callout-info">
        <strong>Reading the critical path:</strong> The amber ★ spans are on the critical path — they determine the wall-clock floor regardless of how much other work you parallelise. To reduce total time you must reduce one of those spans. The ⚠ red span (pytest) is the largest single contributor.
      </div>

      {/* §53.12 — Failure Modes */}
      <h2>53.12 — Failure Modes &amp; the Ratchet</h2>
      <p>
        Deep agent teams introduce failure modes that single-agent systems never encounter: unbounded loops, context overflow, test-environment bleed, premature fan-out, cost runaway, and file-ownership conflicts.
        The AGENTS.md ratchet encodes the rule that prevents each failure — once added, rules are never removed.
      </p>
      <FailureModeSimulator />
      <div className="callout callout-gotcha">
        <strong>The ratchet principle:</strong> Every incident you survive becomes a permanent rule in AGENTS.md. The file only grows. Future agents (and humans) onboarding to the team inherit the collective scar tissue without having to repeat the incidents.
      </div>

      <div className="callout callout-maang">
        <strong>MAANG Interview Connection</strong> — "How do you scale an agent past a single context window?" → Deep agent teams: specialised roles, each with a focused system prompt and bounded context. Fan-out via asyncio.gather for parallel workstreams. A2A HTTP+SSE envelopes for cross-service calls. Distributed tracing with msg_id correlation. AGENTS.md ratchet for operational hardening. "What's the failure mode of parallel delegation?" → EM fans out before PM ticket is in completed state (rule #4 above). Circuit breakers: max_turns, max_rejections, disjoint file ownership.
      </div>

      <QuizSection
        moduleId={53}
        title="Module 53: Deep Agents — Engineering Agent Teams"
        contentHint="ReAct shallow vs deep agent call stack depth, PM EM BE FE QA roles and tools, A2A message envelope msg_id from_agent to_agent task_type payload, Redis Streams audit log, Anthropic SDK tool-use loop, asyncio.gather fan-out BE FE parallel, Docker Compose x-agent-base anchor YAML, Dockerfile non-root user, pipeline wall-clock 60.5s vs 79.7s sequential, LangSmith cross-agent trace msg_id correlation, critical path amber spans be-agent-1 pytest bottleneck, AGENTS.md ratchet max_turns max_rejections disjoint file sets"
      />
    </>
  );
}
