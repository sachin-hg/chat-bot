import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CodeBlock, CodeDiff } from '../components/CodeBlock';
import { QuizSection } from '../components/QuizSection';

// ─── CODE CONSTANTS ────────────────────────────────────────────────────────────

const CODE_FULL_API = `from deepagents import create_deep_agent, SubAgent, FilesystemPermission
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
)`;

const CODE_HOUSING_SUBAGENTS = `# housing_team.py — Housing.com agent team as DeepAgents SubAgents
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
}`;

const CODE_SUPERVISOR = `# supervisor.py — The orchestrating agent
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
print(result["messages"][-1].content)`;

const CODE_SKILL_FILE = `---
name: housing-api-patterns
description: Housing.com backend API conventions — apply when writing FastAPI endpoints
license: internal
---

# Housing.com API Patterns

## Mandatory Conventions
- All Pydantic models use v2 syntax (\`model_config = ConfigDict(...)\`)
- All FastAPI endpoints must have \`response_model=\` set explicitly
- Redis keys MUST be prefixed with \`tenant_id\`: \`{tenant_id}:{resource}:{id}\`
- Never use \`redis.keys()\` — use \`SCAN\` with cursor instead (blocks Redis)
- All DB queries go through the \`SessionLocal\` context manager

## Test Requirements
- Every new endpoint needs a corresponding \`test_\` function in \`tests/\`
- Use \`pytest.mark.asyncio\` for async endpoint tests
- Mock external HTTP calls with \`httpx.MockTransport\`
- Coverage target: 85% on changed files`;

const CODE_AGENTS_MD = `# AGENTS.md — Housing.com Agent Team Rules
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
- 2024-04-18: EM fan-out to same file twice — added disjoint file rule to SKILL.md`;

const CODE_ASYNC_SUBAGENT = `# async_team.py — Long-running agents as AsyncSubAgents
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
# list_async_tasks() → all running tasks`;

const CODE_HARNESS_PROFILE = `# harness_profiles.py — Housing.com custom harness profiles
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
register_harness_profile(qa_profile)`;

const CODE_DOCKER_COMPOSE = `# docker-compose.yml — Housing.com DeepAgents Team
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
      - ./workspace/tests:/workspace/tests          # QA can write tests`;

// ─── VIZ COMPONENTS ───────────────────────────────────────────────────────────

function DeepAgentsStackViz() {
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);

  const layers = [
    { label: 'LangGraph', sublabel: 'state machine runtime', fillColor: '#181825', strokeColor: '#45475a', tooltip: 'LangGraph handles checkpointing and graph execution' },
    { label: 'LangChain', sublabel: 'tool calling, model abstraction', fillColor: '#1e1e2e', strokeColor: '#45475a', tooltip: 'LangChain handles tool calling and model APIs' },
    { label: 'DeepAgents Core', sublabel: 'create_deep_agent, middleware stack', fillColor: '#cba6f722', strokeColor: '#cba6f7', tooltip: 'DeepAgents handles context management, file tools, subagent routing, permissions' },
    { label: 'Your Agent', sublabel: 'system_prompt, tools, subagents', fillColor: '#89b4fa22', strokeColor: '#89b4fa', tooltip: 'Your code: just the business logic' },
    { label: 'Your Housing.com Task', sublabel: '', fillColor: '#a6e3a122', strokeColor: '#a6e3a1', tooltip: 'The business problem you actually care about' },
  ];

  const layerH = 44;
  const layerW = 380;
  const gap = 8;
  const startX = 60;
  const startY = 14;
  const totalH = layers.length * (layerH + gap) + 30;

  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: '8px', padding: '20px', margin: '20px 0' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6c7086', marginBottom: '14px' }}>DEEPAGENTS LAYER STACK — Click a layer to inspect</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '16px', alignItems: 'start' }}>
        <svg viewBox={`0 0 500 ${totalH}`} width="100%" style={{ display: 'block' }} aria-label="DeepAgents layer stack diagram">
          {layers.map((layer, i) => {
            const y = startY + (layers.length - 1 - i) * (layerH + gap);
            const indent = i * 10;
            const w = layerW - indent * 2;
            const x = startX + indent;
            const isHovered = hoveredLayer === i;
            return (
              <g key={i} style={{ cursor: 'pointer' }} onClick={() => setHoveredLayer(hoveredLayer === i ? null : i)}>
                <rect
                  x={x} y={y} width={w} height={layerH} rx="6"
                  fill={layer.fillColor}
                  stroke={isHovered ? layer.strokeColor : '#45475a'}
                  strokeWidth={isHovered ? 2 : 1.2}
                />
                <text x={x + 14} y={y + layerH / 2 - 4} fontSize="11" fill={isHovered ? layer.strokeColor : '#cdd6f4'} fontWeight="700">{layer.label}</text>
                {layer.sublabel && (
                  <text x={x + 14} y={y + layerH / 2 + 10} fontSize="9" fill="#6c7086">{layer.sublabel}</text>
                )}
                {i < layers.length - 1 && (
                  <text x={x + w / 2} y={y + layerH + gap / 2 + 3} fontSize="9" fill="#45475a" textAnchor="middle">▲</text>
                )}
              </g>
            );
          })}
        </svg>
        <div style={{ minHeight: '80px' }}>
          {hoveredLayer !== null && (
            <motion.div
              key={hoveredLayer}
              initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}
              style={{ background: '#1e1e2e', border: `1px solid ${layers[hoveredLayer].strokeColor}`, borderRadius: '6px', padding: '10px 12px', fontSize: '0.76rem', color: '#bac2de', lineHeight: '1.5' }}
            >
              <div style={{ fontWeight: 700, color: layers[hoveredLayer].strokeColor, marginBottom: '6px', fontSize: '0.78rem' }}>{layers[hoveredLayer].label}</div>
              {layers[hoveredLayer].tooltip}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

const BUILTIN_TOOLS = [
  { name: 'write_todos', desc: 'Manage agent todo list — tracks multi-step plan', emoji: '✅' },
  { name: 'ls', desc: 'List directory contents with file metadata', emoji: '📂' },
  { name: 'read_file', desc: 'Read any file under backend root_dir', emoji: '📄' },
  { name: 'write_file', desc: 'Create or overwrite files', emoji: '✏️' },
  { name: 'edit_file', desc: 'Modify specific lines — surgical edits', emoji: '🔧' },
  { name: 'glob', desc: 'Pattern-based file search across the workspace', emoji: '🔍' },
  { name: 'grep', desc: 'Text search — find symbol usages, string occurrences', emoji: '🔎' },
  { name: 'execute', desc: 'Run shell commands (if backend supports SandboxBackendProtocol)', emoji: '⚡' },
  { name: 'task', desc: 'Call a subagent by name (auto-added when subagents= is set)', emoji: '🤖' },
];

function BuiltInToolsGrid() {
  const [hoveredTool, setHoveredTool] = useState<number | null>(null);
  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: '8px', padding: '20px', margin: '20px 0' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6c7086', marginBottom: '14px' }}>BUILT-IN TOOLS — Included automatically by create_deep_agent()</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {BUILTIN_TOOLS.map((t, i) => (
          <div
            key={t.name}
            onMouseEnter={() => setHoveredTool(i)}
            onMouseLeave={() => setHoveredTool(null)}
            style={{
              background: hoveredTool === i ? '#cba6f711' : '#1e1e2e',
              border: `1px solid ${hoveredTool === i ? '#cba6f7' : '#313244'}`,
              borderRadius: '6px',
              padding: '12px 14px',
              cursor: 'default',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <div style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{t.emoji}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#cba6f7', fontWeight: 700, marginBottom: '4px' }}>{t.name}</div>
            <div style={{ fontSize: '0.74rem', color: '#6c7086', lineHeight: '1.4' }}>{t.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '12px', fontSize: '0.76rem', color: '#6c7086' }}>
        <code style={{ color: '#cba6f7' }}>task()</code> is only added when <code style={{ color: '#cba6f7' }}>subagents=</code> is configured. <code style={{ color: '#cba6f7' }}>execute()</code> requires a backend that implements <code style={{ color: '#cba6f7' }}>SandboxBackendProtocol</code>.
      </div>
    </div>
  );
}

const MIDDLEWARE_LAYERS = [
  { name: 'TodoListMiddleware', desc: 'Keeps a running TODO list in agent state', detail: 'Injects a write_todos tool and persists the todo list across turns. Agents use this to track multi-step plans without losing state on long tasks.', custom: false },
  { name: 'SkillsMiddleware', desc: 'Loads SKILL.md files into system prompt', detail: 'Reads each SKILL.md from the skills= directory list, parses the YAML frontmatter, and appends the matching skill bodies to the system prompt before the LLM call.', custom: false },
  { name: 'FilesystemMiddleware', desc: 'Enforces FilesystemPermission rules on every file tool call', detail: 'Wraps read_file, write_file, edit_file, execute. For each call, evaluates permissions in declaration order. First match wins: allow passes through, deny raises PermissionError, interrupt pauses for human approval.', custom: false },
  { name: 'SubAgentMiddleware', desc: 'Adds task() tool, routes to correct subagent', detail: "Injects the task(agent_name, instructions) tool into the agent's tool list. When the LLM calls task(), routes the invocation to the matching SubAgent by name.", custom: false },
  { name: 'SummarizationMiddleware', desc: 'Compresses old messages when context > threshold', detail: 'Monitors token count of the messages list. When it crosses a configurable threshold, summarizes the oldest N messages into a single <summary> message, keeping the context window from overflowing.', custom: false },
  { name: 'PatchToolCallsMiddleware', desc: 'Fixes malformed tool calls from the LLM', detail: 'Applies a set of heuristic patches to tool call inputs before execution: JSON string unescaping, missing required field injection, type coercion. Prevents retries caused by LLM formatting errors.', custom: false },
  { name: '[YOUR MIDDLEWARE]', desc: 'Inject custom logic here', detail: 'Pass a list of custom middleware classes to create_deep_agent(middleware=). They are inserted at this position — after built-in patches, before provider-specific caching. Your middleware sees clean, valid tool calls.', custom: true },
  { name: 'AnthropicPromptCachingMiddleware', desc: 'Adds cache_control breakpoints for Anthropic', detail: 'Inserts cache_control: {type: "ephemeral"} breakpoints at the system prompt and at the tool definitions boundary. Reduces cost by up to 90% on repeated calls with the same system prompt + tools.', custom: false },
  { name: 'MemoryMiddleware', desc: 'Loads and saves AGENTS.md memory', detail: 'On each agent invocation: reads AGENTS.md from the memory= path and appends it to the system prompt. On completion: if the agent updated memory with write_file, persists the new version.', custom: false },
  { name: 'HumanInTheLoopMiddleware', desc: 'Pauses for human approval on interrupt_on tools', detail: 'When interrupt_on={"execute": True} is set and the LLM calls execute(), the middleware pauses the graph and emits an interrupt event. Execution resumes only when a human approves via .resume() or the LangGraph Platform UI.', custom: false },
  { name: 'AsyncSubAgentMiddleware', desc: 'Manages background async subagent tasks', detail: 'Handles AsyncSubAgent routing. Injects start_async_task, check_async_task, update_async_task, cancel_async_task, list_async_tasks tools. Communicates with the Agent Protocol server via HTTP.', custom: false },
];

function MiddlewareStackViz() {
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);

  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: '8px', padding: '20px', margin: '20px 0' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6c7086', marginBottom: '14px' }}>MIDDLEWARE STACK — Executed in order on every agent turn</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 210px', gap: '16px', alignItems: 'start' }}>
        <div>
          {MIDDLEWARE_LAYERS.map((layer, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredLayer(i)}
              onMouseLeave={() => setHoveredLayer(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                marginBottom: '4px',
                background: hoveredLayer === i ? (layer.custom ? '#89b4fa11' : '#cba6f711') : '#1e1e2e',
                border: layer.custom
                  ? `1px dashed ${hoveredLayer === i ? '#89b4fa' : '#45475a'}`
                  : `1px solid ${hoveredLayer === i ? '#cba6f7' : '#313244'}`,
                borderRadius: '5px',
                cursor: 'default',
                transition: 'background 0.12s, border-color 0.12s',
              }}
            >
              <span style={{ fontSize: '0.7rem', color: '#45475a', minWidth: '18px', textAlign: 'right', fontFamily: 'monospace' }}>{i + 1}</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: layer.custom ? '#89b4fa' : '#cba6f7', flex: 1, fontWeight: layer.custom ? 400 : 600 }}>
                {layer.name}
              </span>
              {layer.custom && (
                <span style={{ fontSize: '0.7rem', color: '#6c7086', fontFamily: 'sans-serif' }}>← inject here</span>
              )}
              <span style={{ fontSize: '0.72rem', color: '#585b70', display: 'none' }}>{layer.desc}</span>
            </div>
          ))}
          <div style={{ textAlign: 'center', padding: '10px 0 4px', fontSize: '0.82rem', color: '#a6e3a1', fontWeight: 700 }}>→ LLM call</div>
        </div>
        <div style={{ minHeight: '80px' }}>
          {hoveredLayer !== null && (
            <motion.div
              key={hoveredLayer}
              initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}
              style={{ background: '#1e1e2e', border: `1px solid ${MIDDLEWARE_LAYERS[hoveredLayer].custom ? '#89b4fa' : '#cba6f7'}`, borderRadius: '6px', padding: '12px 14px', fontSize: '0.75rem', color: '#bac2de', lineHeight: '1.5' }}
            >
              <div style={{ fontWeight: 700, color: MIDDLEWARE_LAYERS[hoveredLayer].custom ? '#89b4fa' : '#cba6f7', marginBottom: '6px', fontFamily: 'monospace', fontSize: '0.76rem' }}>
                {MIDDLEWARE_LAYERS[hoveredLayer].name}
              </div>
              <div style={{ marginBottom: '4px', fontSize: '0.72rem', color: '#6c7086' }}>{MIDDLEWARE_LAYERS[hoveredLayer].desc}</div>
              {MIDDLEWARE_LAYERS[hoveredLayer].detail}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

const PERMISSION_RULES = [
  { path: '/workspace/housing/src/**', mode: 'allow' as const },
  { path: '/workspace/housing/tests/**', mode: 'allow' as const },
  { path: '/workspace/housing/.env', mode: 'deny' as const },
  { path: '/workspace/housing/prod-db/**', mode: 'interrupt' as const },
];

function matchesGlob(pattern: string, path: string): boolean {
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '___DOUBLE___')
    .replace(/\*/g, '[^/]*')
    .replace(/___DOUBLE___/g, '.*');
  try {
    const regex = new RegExp(`^${regexStr}$`);
    return regex.test(path);
  } catch {
    return false;
  }
}

function PermissionRulesViz() {
  const [testPath, setTestPath] = useState('/workspace/housing/src/api/routes.py');

  const matchedIndex = PERMISSION_RULES.findIndex(r => matchesGlob(r.path, testPath));

  const modeColor: Record<string, string> = { allow: '#a6e3a1', deny: '#f38ba8', interrupt: '#f9e2af' };
  const modeLabel: Record<string, string> = {
    allow: '✓ ALLOWED',
    deny: '✗ DENIED',
    interrupt: '⏸ INTERRUPT — human approval required',
  };
  const modeBg: Record<string, string> = { allow: '#a6e3a110', deny: '#f38ba810', interrupt: '#f9e2af10' };

  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: '8px', padding: '20px', margin: '20px 0' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6c7086', marginBottom: '14px' }}>FILESYSTEM PERMISSION EVALUATOR — First match wins</div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '0.78rem', color: '#bac2de', display: 'block', marginBottom: '6px' }}>Test file path</label>
        <input
          type="text"
          value={testPath}
          onChange={e => setTestPath(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box', background: '#1e1e2e', border: '1px solid #45475a',
            borderRadius: '5px', padding: '8px 12px', color: '#cdd6f4', fontFamily: 'monospace',
            fontSize: '0.84rem', outline: 'none',
          }}
          placeholder="/workspace/housing/..."
        />
        <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['/workspace/housing/src/api/routes.py', '/workspace/housing/.env', '/workspace/housing/prod-db/schema.sql'].map(p => (
            <button key={p} onClick={() => setTestPath(p)}
              style={{ fontSize: '0.7rem', background: '#313244', border: '1px solid #45475a', color: '#6c7086', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontFamily: 'monospace' }}>
              {p.replace('/workspace/housing/', './')}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: '14px' }}>
        {PERMISSION_RULES.map((rule, i) => {
          const isMatch = i === matchedIndex;
          const isDimmed = matchedIndex !== -1 && i !== matchedIndex;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', marginBottom: '4px',
              background: isMatch ? modeBg[rule.mode] : '#1e1e2e',
              border: `1px solid ${isMatch ? modeColor[rule.mode] : '#313244'}`,
              borderRadius: '5px', opacity: isDimmed ? 0.38 : 1, transition: 'opacity 0.15s, border-color 0.15s',
            }}>
              <span style={{ fontSize: '0.7rem', color: '#45475a', minWidth: '16px', fontFamily: 'monospace' }}>{i + 1}</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#cdd6f4', flex: 1 }}>{rule.path}</span>
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: '10px',
                background: modeColor[rule.mode] + '22', color: modeColor[rule.mode],
                border: `1px solid ${modeColor[rule.mode]}44`, fontFamily: 'monospace',
              }}>{rule.mode}</span>
            </div>
          );
        })}
      </div>
      {testPath && (
        <div style={{
          padding: '10px 14px', borderRadius: '6px', fontSize: '0.84rem', fontWeight: 700, fontFamily: 'monospace',
          background: matchedIndex === -1 ? '#a6e3a110' : modeBg[PERMISSION_RULES[matchedIndex].mode],
          border: `1px solid ${matchedIndex === -1 ? '#a6e3a1' : modeColor[PERMISSION_RULES[matchedIndex].mode]}`,
          color: matchedIndex === -1 ? '#a6e3a1' : modeColor[PERMISSION_RULES[matchedIndex].mode],
        }}>
          {matchedIndex === -1 ? '✓ ALLOWED (no rule matched — default allow)' : modeLabel[PERMISSION_RULES[matchedIndex].mode]}
        </div>
      )}
    </div>
  );
}

// ─── MODULE EXPORT ────────────────────────────────────────────────────────────

export function Mod54() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Explain how DeepAgents relates to LangGraph, LangChain, and the Claude Code harness pattern</li>
          <li>Wire up a production agent with <code>create_deep_agent()</code> including backend, permissions, skills, memory, and checkpointing</li>
          <li>Design a five-agent Housing.com team as SubAgent TypedDicts with appropriate models and system prompts</li>
          <li>Read and reason about the full 11-layer middleware stack — and know where to inject custom middleware</li>
          <li>Configure FilesystemPermission rules and predict which rule fires for a given file path</li>
          <li>Use AsyncSubAgent to fire-and-forget long-running tasks via the Agent Protocol and poll with <code>check_async_task()</code></li>
          <li>Write HarnessProfile rules to append behavior to specific model specs without modifying agent code</li>
          <li>Deploy the full agent team with Docker Compose using per-service volume isolation</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~90 minutes</span>
          <span className="obj-diff">Difficulty: ★★★★☆</span>
          <span className="obj-diff">Prerequisites: Modules 50, 51, 53</span>
        </div>
      </div>
      <div className="callout callout-info">
        <strong>Housing.com Context</strong><br />
        We rebuild the Module 53 Housing.com agent team using DeepAgents — replacing 400 lines of manual tool loops, state threading, and retry logic with a single <code>create_deep_agent()</code> call. The same five roles (PM, EM, BE, FE, QA) become SubAgent TypedDicts. The same permissions and rules become first-class config.
      </div>

      {/* §54.1 */}
      <h2>54.1 — What is DeepAgents?</h2>
      <p>
        DeepAgents is Claude Code's harness pattern, open-sourced and generalized. <code>create_deep_agent()</code> gives you a production-ready agent loop with batteries included: filesystem tools, subagent orchestration, context summarization, permissions, skills, memory — all assembled via a fixed middleware stack.
      </p>
      <p>
        <strong>vs raw LangGraph (Module 51):</strong> LangGraph gives you the engine. DeepAgents gives you the car. You can still open the hood — the compiled graph is a LangGraph StateGraph under the surface — but you do not have to build the chassis yourself.
      </p>
      <p>
        <strong>vs raw Anthropic SDK (Module 53):</strong> No manual tool loop, no manual state threading, no manual retry logic. DeepAgents handles all of it. The Module 53 PM agent (50 lines of loop boilerplate) becomes a 10-line SubAgent TypedDict.
      </p>
      <p>
        <strong>Inspired by Claude Code:</strong> The same harness pattern that powers Claude Code — skills, memory, permissions, filesystem tools — packaged into a Python library. Claude Code is not a special product; it is this pattern applied to coding tasks.
      </p>
      <DeepAgentsStackViz />
      <div className="callout callout-tip">
        <strong>Install:</strong> <code>uv add deepagents</code>. DeepAgents depends on <code>langchain-anthropic</code>, <code>langgraph</code>, and <code>langchain-core</code>. No separate LangGraph install needed — it is pulled transitively.
      </div>

      {/* §54.2 */}
      <h2>54.2 — create_deep_agent() — The Full API</h2>
      <p>
        The entire harness is configured through a single function. Every parameter is optional except <code>model=</code>. Start with just a model and a system prompt, then add permissions, skills, and subagents incrementally.
      </p>
      <CodeBlock title="create_deep_agent() — Full annotated signature" language="python" keyLine={2} keyNote="one function, batteries included — filesystem tools, subagent routing, context summarization all wired automatically">
        {CODE_FULL_API}
      </CodeBlock>
      <div className="callout callout-gotcha">
        <strong>System prompt ordering:</strong> DeepAgents always inserts your <code>system_prompt=</code> FIRST, before its own defaults. The full assembly order is: <em>USER (your text) → BASE (deepagents defaults) → SUFFIX (HarnessProfile suffix)</em>. You cannot override the base or suffix without a HarnessProfile.
      </div>

      {/* §54.3 */}
      <h2>54.3 — Built-in Tools: What You Get for Free</h2>
      <p>
        Every deep agent starts with 8 built-in tools, no configuration needed. These are the same tools Claude Code uses internally — the same ones that let it read, write, search, and execute in a codebase. Adding your own tools with <code>tools=[...]</code> merges them with the built-ins; it does not replace them.
      </p>
      <BuiltInToolsGrid />
      <div className="callout callout-info">
        <strong>No backend, no execute:</strong> <code>execute()</code> is only available when your backend implements <code>SandboxBackendProtocol</code>. <code>FilesystemBackend</code> does. A bare <code>create_deep_agent()</code> with no <code>backend=</code> gets file tools but no shell execution.
      </div>

      {/* §54.4 */}
      <h2>54.4 — The Middleware Stack</h2>
      <p>
        DeepAgents applies a fixed 11-layer middleware stack to every agent. Each layer wraps the core LLM call, adding behavior before and after. The order is fixed and intentional: filesystem permissions are enforced before caching breakpoints are inserted, and memory is loaded after the prompt cache is set. Hover each layer to see what it does.
      </p>
      <MiddlewareStackViz />
      <div className="callout callout-tip">
        <strong>Custom middleware position:</strong> Your middleware is inserted between <code>PatchToolCallsMiddleware</code> and <code>AnthropicPromptCachingMiddleware</code> — after all built-in patching, before provider-specific optimizations. Your middleware sees clean, valid tool calls, not malformed LLM output.
      </div>

      {/* §54.5 */}
      <h2>54.5 — Housing.com Agent Team with SubAgents</h2>
      <p>
        The full Housing.com engineering team maps to SubAgent TypedDicts. Each agent is just a Python dictionary — no class, no boilerplate. The supervisor uses the <code>task()</code> tool to delegate. SubAgents can use cheaper models for simpler roles: PM ticket writing is a <code>claude-haiku</code> job; BE and FE code generation needs <code>claude-sonnet</code>.
      </p>
      <CodeBlock title="housing_team.py — Five SubAgents as TypedDicts" language="python" keyLine={4} keyNote="SubAgent TypedDict — name, description, system_prompt, optional tools and model">
        {CODE_HOUSING_SUBAGENTS}
      </CodeBlock>
      <p>
        The supervisor ties the five agents into a pipeline. The <code>task()</code> tool is auto-injected by <code>SubAgentMiddleware</code> — the supervisor LLM calls it like any other tool, passing the agent name and instructions. The middleware routes the call to the correct SubAgent, runs it to completion, and returns the result.
      </p>
      <CodeBlock title="supervisor.py — Orchestrating agent with SqliteSaver checkpointer" language="python" keyLine={15} keyNote="task() tool is auto-injected by SubAgentMiddleware — supervisor calls it like any other tool">
        {CODE_SUPERVISOR}
      </CodeBlock>
      <div className="callout callout-gotcha">
        <strong>thread_id is required for checkpointing:</strong> Pass <code>{'config={"configurable": {"thread_id": "housing-001"}}'}</code> on every <code>.invoke()</code> call. Without it, the checkpointer has no key to persist to and silently discards state. Same thread_id on a retry resumes from where the agent crashed.
      </div>

      {/* §54.6 */}
      <h2>54.6 — Skills: Reusable Behavior via SKILL.md</h2>
      <p>
        Skills are markdown files with YAML frontmatter that get loaded into the agent's system prompt by <code>SkillsMiddleware</code>. They encode reusable behaviors — "always use Pydantic v2", "always run tests before returning" — without hardcoding them into every <code>system_prompt=</code> string. The <code>description</code> field is used by the agent to decide when a skill applies.
      </p>
      <p>
        <strong>AGENTS.md</strong> is the memory equivalent: a persistent rules file that the agent updates over time. Every production incident becomes a rule. The file only grows — it is the team's collective operational memory.
      </p>
      <CodeBlock title="/skills/housing-api-patterns/SKILL.md" language="yaml" keyLine={4} keyNote="description field is used by the agent to decide when to apply this skill">
        {CODE_SKILL_FILE}
      </CodeBlock>
      <CodeBlock title="/memory/AGENTS.md — Persistent team rules ratchet" language="text" keyLine={3} keyNote="AGENTS.md = the ratchet — every incident adds a rule. Loaded as memory on every agent invocation.">
        {CODE_AGENTS_MD}
      </CodeBlock>
      <div className="callout callout-info">
        <strong>Skills vs AGENTS.md:</strong> Skills are static and versioned in git — they encode conventions that do not change per deployment. AGENTS.md is dynamic — it lives in the agent's workspace and is updated by the agent itself after incidents. Skills are for "how we build"; AGENTS.md is for "what we learned the hard way."
      </div>

      {/* §54.7 */}
      <h2>54.7 — FilesystemPermission: The Permission Gate</h2>
      <p>
        Each permission rule has a path glob and a mode: <code>"allow"</code> (proceed), <code>"deny"</code> (block with PermissionError), or <code>"interrupt"</code> (pause for human approval via <code>interrupt_on</code>). Rules are evaluated in declaration order — first match wins. If no rule matches, the operation is allowed by default. Type any file path below to see which rule fires.
      </p>
      <PermissionRulesViz />
      <div className="callout callout-gotcha">
        <strong>Deny before interrupt:</strong> Put <code>deny</code> rules before broader <code>interrupt</code> rules. Since first match wins, a <code>deny</code> on <code>.env</code> must appear before a broader <code>interrupt</code> on <code>/**</code> or the interrupt rule will fire instead, sending the operation to a human rather than blocking it outright.
      </div>

      {/* §54.8 */}
      <h2>54.8 — AsyncSubAgent: Background Agent Protocol Tasks</h2>
      <p>
        For long-running tasks — full test suites, large codebases, slow builds — use <code>AsyncSubAgent</code>. The main agent fires-and-forgets via <code>start_async_task()</code>, gets a task_id, continues other work, then polls with <code>check_async_task()</code>. Backed by LangGraph Platform or a self-hosted Agent Protocol server. The supervisor never blocks waiting for a slow BE run.
      </p>
      <CodeBlock title="async_team.py — AsyncSubAgents with Agent Protocol server" language="python" keyLine={8} keyNote="graph_id maps to a deployed LangGraph graph — supervisor calls it without knowing its implementation">
        {CODE_ASYNC_SUBAGENT}
      </CodeBlock>
      <div className="callout callout-tip">
        <strong>When to use AsyncSubAgent vs SubAgent:</strong> Use <code>AsyncSubAgent</code> when the task takes more than ~30 seconds or when you want the subagent running on a different machine with more resources. Use a synchronous <code>SubAgent</code> for fast tasks (ticket writing, code review, classification) where latency matters more than parallelism.
      </div>

      {/* §54.9 */}
      <h2>54.9 — HarnessProfile: Per-Model Customization</h2>
      <p>
        HarnessProfile attaches behavior to a model spec glob — <code>"anthropic:claude-sonnet-*"</code> matches all Sonnet versions. The suffix is always appended last to the system prompt, after both your text and the DeepAgents defaults. Use it to encode team-wide rules that should apply to all agents on a given model tier without touching individual agent configs.
      </p>
      <CodeBlock title="harness_profiles.py — Per-model suffix and tool exclusion" language="python" keyLine={5} keyNote="model_spec glob — one profile applies to all matching models. Suffix is always last in the system prompt.">
        {CODE_HARNESS_PROFILE}
      </CodeBlock>
      <div className="callout callout-info">
        <strong>excluded_tools:</strong> Any tool name in <code>excluded_tools</code> is removed from the agent's tool list before the LLM call. This is the correct way to enforce read-only agents — more reliable than system prompt instructions, which the LLM can ignore under pressure.
      </div>

      {/* §54.10 */}
      <h2>54.10 — Putting It All Together: Docker Compose</h2>
      <p>
        Each agent runs in its own container. <code>FilesystemBackend</code> mounts only the slice of <code>/workspace</code> that agent needs — principle of least privilege. The PM only sees <code>/workspace/tickets</code>; the BE sees <code>/workspace/backend</code> and <code>/workspace/tests</code>; the QA mounts backend and frontend read-only. LangSmith tracing is enabled via environment variables — no code change needed.
      </p>
      <CodeBlock title="docker-compose.yml — DeepAgents Housing.com team" language="yaml" keyLine={8} keyNote="each agent is its own container — FilesystemBackend mounts only the slice it needs (principle of least privilege)">
        {CODE_DOCKER_COMPOSE}
      </CodeBlock>
      <div className="callout callout-maang">
        <strong>MAANG Interview Connection</strong> — "How do you operationalize a multi-agent system?" → DeepAgents pattern: one function, fixed middleware stack, declarative SubAgent TypedDicts. "What is the difference between LangGraph and DeepAgents?" → LangGraph = engine (state machine, graph execution, checkpointing). DeepAgents = car (filesystem tools, permissions, skills, memory, subagent routing, context management). "How do you prevent agents from overwriting critical files?" → FilesystemPermission with deny/interrupt modes, evaluated in declaration order, first match wins. "How do you handle long-running subagent tasks without blocking?" → AsyncSubAgent with start_async_task / check_async_task and an Agent Protocol server. The supervisor fires-and-forgets, continues other work, polls on its own schedule.
      </div>

      <QuizSection
        moduleId={54}
        title="Module 54: DeepAgents — Batteries-Included Agent Harness"
        contentHint="DeepAgents create_deep_agent batteries-included, LangGraph engine vs DeepAgents car analogy, Claude Code harness pattern open-sourced, built-in tools write_todos ls read_file write_file edit_file glob grep execute task, SubAgent TypedDict name description system_prompt tools model, CompiledSubAgent runnable, AsyncSubAgent graph_id url headers, FilesystemPermission path mode allow deny interrupt first match wins, 11-layer middleware stack order TodoList Skills Filesystem SubAgent Summarization PatchToolCalls custom Anthropic MemoryMiddleware HumanInTheLoop AsyncSubAgent, SKILL.md YAML frontmatter description field, AGENTS.md memory ratchet persistent rules, HarnessProfile model_spec glob system_prompt_suffix excluded_tools, thread_id configurable checkpointer SqliteSaver MemorySaver, start_async_task check_async_task Agent Protocol, Docker Compose per-service volume isolation least privilege"
      />
    </>
  );
}
