import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { QuizSection } from '../components/QuizSection';
import { CodeBlock } from '../components/CodeBlock';

// ── Universal Agent Loop ─────────────────────────────────────────────────────
const CODE_AGENT_LOOP = `import anthropic, json

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
            # Loop continues — model sees tool results and decides what to do next`;

// ── Production Harness — split into 4 sections ───────────────────────────────
const CODE_SECTION_1 = `import anthropic, json, os, re
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
    return True, "ok"`;

const CODE_SECTION_2 = `# ── Tool execution layer ──────────────────────────────────────────────────────
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
    return {"error": f"Unknown tool: {name}"}`;

const CODE_SECTION_3 = `# ── Context compaction — keeps token count within limits ─────────────────────
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
    ]`;

const CODE_SECTION_4 = `# ── Main harness entry point ──────────────────────────────────────────────────
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
        messages.append({"role": "user", "content": tool_results})`;

// ── DeepAgents YAML ──────────────────────────────────────────────────────────
const CODE_DEEPAGENTS = `# pyproject.toml — DeepAgents via LangGraph
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
print(result.summary)`;

// ── OpenClaw YAML ─────────────────────────────────────────────────────────────
const CODE_OPENCLAW = `# openclaw.yaml — OpenClaw local configuration
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
  post_turn: "./scripts/log_turn.py"     # runs after each assistant turn`;

// ── 5 Harness Layers ─────────────────────────────────────────────────────────
const LAYERS = [
  {
    id: 0,
    label: 'Context & Knowledge',
    color: '#cba6f7', // mauve
    what: 'Everything the agent knows before it starts',
    examples: 'CLAUDE.md · AGENTS.md · MCP server schemas · injected project context',
    why: 'Without the right context, even a capable model makes wrong assumptions about tools, codebase conventions, and task scope.',
  },
  {
    id: 1,
    label: 'Execution Loop',
    color: '#89dceb', // sky
    what: 'The while-loop that queries the model, checks stop_reason, and feeds tool results back',
    examples: 'Universal agent loop · stop_reason == "tool_use" dispatch · turn counter · retry logic',
    why: 'This is the heartbeat of every agent. Without it, the model answers once and stops — it cannot chain multi-step reasoning.',
  },
  {
    id: 2,
    label: 'Tool Integration',
    color: '#a6e3a1', // green
    what: 'The concrete actions the agent can take on the world',
    examples: 'read_file · write_file · bash · browser · email · calendar · MCP servers',
    why: 'Tools convert reasoning into effects. "10 focused tools beats 50 overlapping ones" — the model must hold the menu in its head.',
  },
  {
    id: 3,
    label: 'Orchestration & Control',
    color: '#fab387', // peach
    what: 'Safety rails, human-in-the-loop gates, sub-agent spawning, context compaction',
    examples: 'Permission gate · HITL interrupt · compact_context() · parallel sub-agents · skill router',
    why: 'Without orchestration, a single bad tool call can cascade into irreversible damage. The ratchet principle: every failure → a new permission rule.',
  },
  {
    id: 4,
    label: 'Observability',
    color: '#f38ba8', // red
    what: 'Visibility into every decision — what the model saw, what it did, and why',
    examples: 'LangSmith @traceable · structured logs · turn snapshots · eval harness (HAL) · cost tracking',
    why: 'Agents are non-deterministic. You cannot debug what you cannot see. LangSmith makes every tool call a first-class observable event.',
  },
];

// ── Ecosystem Data ────────────────────────────────────────────────────────────
const HARNESSES = [
  { name: 'Claude Code',  org: 'Anthropic',     open: false, sandboxed: true,  bench: '87.6%', bestFor: 'Software engineering on real repos' },
  { name: 'Codex CLI',    org: 'OpenAI',        open: false, sandboxed: true,  bench: '83.4%', bestFor: 'Terminal-native coding with GPT-5.5' },
  { name: 'OpenClaw',     org: 'Community',     open: true,  sandboxed: false, bench: '—',     bestFor: 'Local YAML-config all-rounder' },
  { name: 'SWE-agent',    org: 'Princeton',     open: true,  sandboxed: true,  bench: '~53%',  bestFor: 'Research & ACI interface design' },
  { name: 'OpenHands',    org: 'All-Hands AI',  open: true,  sandboxed: true,  bench: '72.0%', bestFor: 'Model-agnostic Docker runtime' },
  { name: 'DeepAgents',   org: 'LangChain',     open: true,  sandboxed: false, bench: '—',     bestFor: 'LangGraph batteries-included' },
  { name: 'Devin',        org: 'Cognition AI',  open: false, sandboxed: true,  bench: '~74%',  bestFor: 'Zero-setup commercial; PM integrations' },
  { name: 'HAL-Harness',  org: 'Princeton PLI', open: true,  sandboxed: true,  bench: 'Meta',  bestFor: 'Reproducible evaluation across benchmarks' },
];

// ── HarnessLayerViz ───────────────────────────────────────────────────────────
// FIX 1: Render innermost rings LAST (highest DOM z-order) so their SVG path
// areas are on top and receive pointer events first. Each path uses
// fillRule="evenodd" which naturally makes the inner hole non-interactive,
// meaning only the visible ring band itself is hittable. Outer rings rendered
// earlier (lower DOM z-order) are therefore never intercepted by their hole area.
function HarnessLayerViz() {
  const [selected, setSelected] = useState<number | null>(null)

  const layers = [
    { id: 0, label: 'Permission Gate',    desc: 'Blocks toxic, PII, competitor mentions before any processing. Fails fast — 2ms, zero LLM cost.', color: '#f38ba8', r1: 140, r2: 175 },
    { id: 1, label: 'Tool Execution',     desc: 'Runs tool calls with timeout + retry. Enforces max_tool_calls=5 per turn. Logs cost per call.', color: '#fab387', r1: 100, r2: 139 },
    { id: 2, label: 'Context Compaction', desc: 'Truncates conversation to fit model context window. Preserves latest turn + system prompt.', color: '#f9e2af', r1: 62,  r2: 99  },
    { id: 3, label: 'Core Agent Loop',    desc: 'LangGraph graph.ainvoke(). Classify → route → tool/LLM → validate → emit SSE.', color: '#a6e3a1', r1: 30,  r2: 61  },
    { id: 4, label: 'Harness Kernel',     desc: 'The outermost orchestrator: session init, gate acquire/release, error recovery, metrics flush.', color: '#89b4fa', r1: 0,   r2: 29  },
  ]

  const CX = 180, CY = 180

  function fullDonut(r1: number, r2: number) {
    // Two 180-deg arcs make a full circle; inner circle is subtracted via evenodd fill rule
    return [
      `M ${CX} ${CY - r2}`,
      `A ${r2} ${r2} 0 1 1 ${CX} ${CY + r2}`,
      `A ${r2} ${r2} 0 1 1 ${CX} ${CY - r2}`,
      r1 > 0 ? [
        `M ${CX} ${CY - r1}`,
        `A ${r1} ${r1} 0 1 0 ${CX} ${CY + r1}`,
        `A ${r1} ${r1} 0 1 0 ${CX} ${CY - r1}`,
      ].join(' ') : '',
      'Z'
    ].join(' ').trim()
  }

  return (
    <div style={{display:'grid',gridTemplateColumns:'360px 1fr',gap:'20px',margin:'24px 0',alignItems:'start'}}>
      <svg viewBox="0 0 360 360" width="100%" style={{display:'block'}}>
        {/*
          Render outermost rings FIRST (lowest DOM z-order), innermost LAST (highest).
          Because SVG paints last-rendered element on top, the innermost rings are
          topmost and capture pointer events for their band area.
          fillRule="evenodd" ensures the hole of each path (the inner cutout) is
          transparent to pointer events, so clicks on the hole fall through to the
          ring below — exactly the desired behaviour.
        */}
        {layers.map(l => (
          <path
            key={l.id}
            d={fullDonut(l.r1, l.r2)}
            fill={selected === l.id ? l.color + '55' : l.color + '22'}
            stroke={selected === l.id ? l.color : l.color + '88'}
            strokeWidth={selected === l.id ? 2 : 1}
            fillRule="evenodd"
            style={{cursor:'pointer',transition:'fill .2s, stroke .2s'}}
            onClick={() => setSelected(selected === l.id ? null : l.id)}
          />
        ))}
        {/* Labels pointing outward — pointerEvents none so they don't block ring clicks */}
        {layers.map(l => {
          const midR = (l.r1 + l.r2) / 2
          return (
            <text key={l.id} x={CX + midR + 10} y={CY + 4}
              fontSize="10" fill={l.color} fontWeight={selected===l.id?700:400}
              style={{cursor:'pointer', pointerEvents:'none'}}
            >
              {l.label}
            </text>
          )
        })}
        {/* Center label */}
        <text x={CX} y={CY-4} textAnchor="middle" fontSize="9" fill="var(--muted)">Click a</text>
        <text x={CX} y={CY+8} textAnchor="middle" fontSize="9" fill="var(--muted)">ring</text>
      </svg>
      <div>
        <AnimatePresence mode="wait">
          {selected !== null ? (
            <motion.div key={selected} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}}
              style={{background:'var(--bg2)',border:`1px solid ${layers[selected].color}44`,borderLeft:`4px solid ${layers[selected].color}`,borderRadius:'8px',padding:'16px'}}>
              <div style={{fontWeight:700,color:layers[selected].color,marginBottom:'8px',fontSize:'14px'}}>{layers[selected].label}</div>
              <p style={{fontSize:'13px',color:'var(--text)',lineHeight:1.7,margin:0}}>{layers[selected].desc}</p>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{opacity:0}} animate={{opacity:1}} style={{color:'var(--muted)',fontSize:'13px',paddingTop:'20px'}}>
              Click any ring to see what that harness layer does and why.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── RatchetViz ────────────────────────────────────────────────────────────────
const INCIDENT_CHIPS = [
  'Block: delete_all_files',
  'Block: external_http without approval',
  'Block: >10 tool calls/turn',
  'Block: git push --force to main',
  'Block: DROP TABLE without backup check',
  'Block: write outside repo root',
];

function RatchetViz() {
  const [incidentCount, setIncidentCount] = useState(0)
  const [rotationDeg, setRotationDeg] = useState(0)

  const MAX_INCIDENTS = 6
  const BASE_TEETH = 4
  const totalTeeth = BASE_TEETH + incidentCount

  function handleIncident() {
    if (incidentCount >= MAX_INCIDENTS) return
    const next = incidentCount + 1
    // Rotate one tooth forward: 360 / (total teeth after adding this one)
    setRotationDeg(prev => prev + 360 / (BASE_TEETH + next))
    setIncidentCount(next)
  }

  // Gear geometry
  const CX = 70, CY = 70, R_INNER = 32, R_OUTER = 44, TOOTH_W = 7, TOOTH_H = 10

  function buildGearPath(teeth: number, rotation: number): string {
    const paths: string[] = []
    for (let i = 0; i < teeth; i++) {
      const angle = (2 * Math.PI * i) / teeth + (rotation * Math.PI) / 180
      const half = Math.PI / teeth

      // Tooth base corners (on outer circle)
      const a1 = angle - half * 0.5
      const a2 = angle + half * 0.5
      // Tooth tip corners (slightly wider)
      const tipR = R_OUTER + TOOTH_H
      const a1t = angle - half * 0.35
      const a2t = angle + half * 0.35

      paths.push(
        `M ${CX + R_OUTER * Math.cos(a1)} ${CY + R_OUTER * Math.sin(a1)}` +
        ` L ${CX + tipR * Math.cos(a1t)} ${CY + tipR * Math.sin(a1t)}` +
        ` L ${CX + tipR * Math.cos(a2t)} ${CY + tipR * Math.sin(a2t)}` +
        ` L ${CX + R_OUTER * Math.cos(a2)} ${CY + R_OUTER * Math.sin(a2)}`
      )
    }
    return paths.join(' ')
  }

  const gearColor = '#cba6f7'

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid #313244',
      borderRadius: '10px',
      padding: '20px',
      margin: '20px 0',
    }}>
      <div style={{display:'flex', alignItems:'flex-start', gap:'24px', flexWrap:'wrap'}}>
        {/* Gear SVG */}
        <div style={{flexShrink:0}}>
          <svg width="140" height="140" viewBox="0 0 140 140">
            {/* Outer gear body (teeth + rim) */}
            <circle cx={CX} cy={CY} r={R_OUTER} fill={gearColor + '22'} stroke={gearColor + '88'} strokeWidth={1.5} />
            {/* Teeth */}
            <path d={buildGearPath(totalTeeth, rotationDeg)} fill={gearColor + '55'} stroke={gearColor} strokeWidth={1} strokeLinejoin="round" />
            {/* Inner hub */}
            <circle cx={CX} cy={CY} r={R_INNER} fill="var(--bg2)" stroke={gearColor + '88'} strokeWidth={1.5} />
            {/* Center axle dot */}
            <circle cx={CX} cy={CY} r={5} fill={gearColor} />
            {/* Rotation indicator line */}
            <line
              x1={CX} y1={CY}
              x2={CX + R_INNER * 0.8 * Math.cos((rotationDeg - 90) * Math.PI / 180)}
              y2={CY + R_INNER * 0.8 * Math.sin((rotationDeg - 90) * Math.PI / 180)}
              stroke={gearColor} strokeWidth={2} strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Controls + counter */}
        <div style={{flex:1, minWidth:'160px'}}>
          <div style={{fontWeight:700, fontSize:'13px', color:'var(--text)', marginBottom:'6px'}}>
            Rules added: <span style={{color:gearColor}}>{incidentCount}</span>
            &nbsp;/&nbsp;Teeth: <span style={{color:gearColor}}>{totalTeeth}</span>
          </div>
          <p style={{fontSize:'12px', color:'var(--muted)', margin:'0 0 12px 0', lineHeight:1.6}}>
            Each incident ratchets the harness forward — a new blocked pattern is added permanently.
            The gear never turns back.
          </p>
          <button
            onClick={handleIncident}
            disabled={incidentCount >= MAX_INCIDENTS}
            style={{
              background: incidentCount >= MAX_INCIDENTS ? '#313244' : 'transparent',
              color: incidentCount >= MAX_INCIDENTS ? 'var(--muted)' : '#f9e2af',
              border: `1px solid ${incidentCount >= MAX_INCIDENTS ? '#45475a' : '#f9e2af'}`,
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: incidentCount >= MAX_INCIDENTS ? 'not-allowed' : 'pointer',
              transition: 'all .15s',
            }}
          >
            {incidentCount >= MAX_INCIDENTS ? 'Max rules reached' : 'Simulate Incident'}
          </button>

          {/* Chips */}
          {incidentCount > 0 && (
            <div style={{display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'12px'}}>
              {INCIDENT_CHIPS.slice(0, incidentCount).map((chip, i) => (
                <motion.span
                  key={i}
                  initial={{opacity:0, scale:0.85}}
                  animate={{opacity:1, scale:1}}
                  transition={{duration:0.2}}
                  style={{
                    display: 'inline-block',
                    border: '1px solid #f9e2af',
                    color: '#f9e2af',
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: '#f9e2af11',
                  }}
                >
                  {chip}
                </motion.span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── EcosystemMatrix ───────────────────────────────────────────────────────────
function EcosystemMatrix() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div style={{ overflowX: 'auto', margin: '1.5rem 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
        <thead>
          <tr style={{ background: '#313244' }}>
            <th style={{ textAlign: 'left', padding: '8px 10px', color: '#cba6f7' }}>Harness</th>
            <th style={{ textAlign: 'left', padding: '8px 10px', color: '#89b4fa' }}>Org</th>
            <th style={{ textAlign: 'center', padding: '8px 10px', color: '#a6e3a1' }}>Open Source</th>
            <th style={{ textAlign: 'center', padding: '8px 10px', color: '#89dceb' }}>Sandboxed</th>
            <th style={{ textAlign: 'center', padding: '8px 10px', color: '#fab387' }}>SWE-bench</th>
            <th style={{ textAlign: 'left', padding: '8px 10px', color: '#cdd6f4' }}>Best for</th>
          </tr>
        </thead>
        <tbody>
          {HARNESSES.map((h) => (
            <tr
              key={h.name}
              onMouseEnter={() => setHovered(h.name)}
              onMouseLeave={() => setHovered(null)}
              style={{ background: hovered === h.name ? '#313244' : 'transparent', cursor: 'default' }}
            >
              <td style={{ padding: '7px 10px', color: '#cba6f7', fontWeight: 600, borderBottom: '1px solid #313244' }}>{h.name}</td>
              <td style={{ padding: '7px 10px', color: '#a6adc8', borderBottom: '1px solid #313244' }}>{h.org}</td>
              <td style={{ padding: '7px 10px', textAlign: 'center', borderBottom: '1px solid #313244', color: h.open ? '#a6e3a1' : '#f38ba8' }}>{h.open ? '✓' : '✗'}</td>
              <td style={{ padding: '7px 10px', textAlign: 'center', borderBottom: '1px solid #313244', color: h.sandboxed ? '#a6e3a1' : '#f38ba8' }}>{h.sandboxed ? '✓' : '✗'}</td>
              <td style={{ padding: '7px 10px', textAlign: 'center', borderBottom: '1px solid #313244', color: '#fab387', fontWeight: 600 }}>{h.bench}</td>
              <td style={{ padding: '7px 10px', color: '#cdd6f4', borderBottom: '1px solid #313244' }}>{h.bestFor}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: '0.75rem', color: '#6c7086', marginTop: '0.4rem' }}>
        SWE-bench Verified scores (Jun 2026). HAL-Harness is used to run evaluations, not to be evaluated. OpenClaw/DeepAgents are frameworks, not bench targets.
      </p>
    </div>
  );
}

// ── Module ────────────────────────────────────────────────────────────────────
export function ModHarness() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Explain what a harness is and why ~98% of Claude Code is harness infrastructure, not model logic</li>
          <li>Name the 5 layers of a harness and what belongs in each one</li>
          <li>Write a universal agent loop from scratch with a permission gate and context compaction</li>
          <li>Compare 8 harnesses in the 2026 ecosystem and select the right one for a given use case</li>
          <li>Configure DeepAgents and OpenClaw for local agent tasks using YAML</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~45 min read + 30 min lab</span>
          <span className="obj-diff">Difficulty: ★★★☆☆</span>
          <span className="obj-diff">Prerequisites: Module 41 (Agent Architectures)</span>
        </div>
      </div>

      {/* §H.1 ── What is a Harness? */}
      <h2>§H.1 What is a Harness?</h2>
      <p>
        An agent is a model plus a harness. The model supplies the reasoning; the harness supplies everything else.
        When Anthropic published Claude Code, they noted that only ~1.6% of the codebase is AI decision logic —
        the remaining <strong>98.4% is harness infrastructure</strong>: tool execution, context management, permission gates, observability hooks, and the while-loop that connects it all.
      </p>
      <div className="callout callout-info">
        <strong>Harness vs Scaffold</strong><br />
        The terms are used interchangeably in 2026 community practice. Historically, "scaffold" meant the operational infrastructure (ReAct loop, tool dispatch, context trimming) while "harness" meant the evaluation environment (HAL-Harness, SWE-bench test driver). In everyday usage today, both words refer to the full stack described in this module.
      </div>
      <p>
        The simplest harness is a while-loop. Every production harness — Claude Code, Codex CLI, OpenHands — is a while-loop plus layers of infrastructure wrapped around it.
      </p>

      {/* §H.2 ── The 5 Layers */}
      <h2>§H.2 The 5 Layers of a Harness</h2>
      <p>
        Addy Osmani's model (popularised in his 2025 AI engineering guide) breaks any harness into five concentric concerns.
        Click a ring to explore each layer.
      </p>
      <HarnessLayerViz />
      <table>
        <tbody>
          <tr><th>Layer</th><th>Files / components in Claude Code</th></tr>
          <tr><td><strong>Context &amp; Knowledge</strong></td><td>CLAUDE.md · .claude/settings.json · MCP server schemas · injected git diff</td></tr>
          <tr><td><strong>Execution Loop</strong></td><td>Main agent loop, stop_reason dispatch, turn counter, retry / backoff</td></tr>
          <tr><td><strong>Tool Integration</strong></td><td>Bash · Read · Edit · Write · WebSearch · WebFetch · Grep</td></tr>
          <tr><td><strong>Orchestration &amp; Control</strong></td><td>Permission gate · hooks (pre/post tool) · sub-agent fork · TaskCreate/Update</td></tr>
          <tr><td><strong>Observability</strong></td><td>LangSmith @traceable · structured JSONL logs · playground UI</td></tr>
        </tbody>
      </table>

      {/* §H.3 ── The Universal Agent Loop */}
      <h2>§H.3 The Universal Agent Loop</h2>
      <p>
        Every harness you will encounter is a variant of this pattern. Memorise the shape — the differences between Claude Code, OpenHands, and DeepAgents are in the layers around it, not in the loop itself.
      </p>
      <CodeBlock title="Universal Agent Loop" language="python" keyLine={13} keyNote="while True is the heartbeat — model loops until done">{CODE_AGENT_LOOP}</CodeBlock>
      <div className="callout callout-tip">
        <strong>stop_reason dispatch</strong> — The two terminal states are <code>"end_turn"</code> (model is done) and <code>"max_tokens"</code> (truncated, usually an error). The active state is <code>"tool_use"</code>. Any other stop_reason is unexpected — log it and break.
      </div>

      {/* §H.4 ── The Ratchet Principle */}
      <h2>§H.4 The Ratchet Principle</h2>
      <p>
        The most important design heuristic in harness engineering: <strong>every agent failure should produce a harness update</strong>.
        When Claude Code runs <code>rm -rf /</code>, the harness gets a new blocked pattern. When it hallucinates a file path, CLAUDE.md gets a clarifying instruction. The ratchet only turns forward — the harness grows more capable with each incident.
      </p>
      <p>
        In practice this means every line in your AGENTS.md or CLAUDE.md traces to a specific failure. If you cannot explain why a rule exists, it is dead weight — remove it.
      </p>
      <div className="callout callout-warn">
        <strong>Harness rot</strong> — Rules added without a clear failure root cause accumulate over months. A harness with 200 vague rules performs worse than one with 20 precise ones. Audit your context files quarterly.
      </div>
      <RatchetViz />

      {/* §H.5 ── Building a Production Harness */}
      <h2>§H.5 Building a Production Harness</h2>
      <p>
        Three components separate a toy while-loop from a production harness: a <strong>permission gate</strong>, <strong>context compaction</strong>, and <strong>structured tool dispatch</strong>.
      </p>
      <div>
        <h4 style={{color:'var(--accent)',marginBottom:8}}>① Permission Gate</h4>
        <CodeBlock title="permission_gate.py" language="python">{CODE_SECTION_1}</CodeBlock>
      </div>
      <div>
        <h4 style={{color:'var(--accent)',marginBottom:8}}>② Tool Execution</h4>
        <CodeBlock title="tool_execution.py" language="python">{CODE_SECTION_2}</CodeBlock>
      </div>
      <div>
        <h4 style={{color:'var(--accent)',marginBottom:8}}>③ Context Compaction</h4>
        <CodeBlock title="context_compaction.py" language="python">{CODE_SECTION_3}</CodeBlock>
      </div>
      <div>
        <h4 style={{color:'var(--accent)',marginBottom:8}}>④ Main Harness Loop</h4>
        <CodeBlock title="main_harness.py" language="python">{CODE_SECTION_4}</CodeBlock>
      </div>
      <div className="callout callout-tip">
        <strong>10 focused tools beats 50 overlapping ones</strong> — the model must hold the full tool menu in its working memory at every step. A narrow, well-named tool set reduces misuse and token waste. Start with read_file, write_file, bash, and browser — add only when a specific task demands it.
      </div>

      {/* §H.6 ── The Ecosystem */}
      <h2>§H.6 The 2026 Harness Ecosystem</h2>
      <p>
        Eight harnesses dominate the 2026 landscape. They differ on four axes: open-source vs commercial, sandboxed execution, SWE-bench performance, and primary use case.
      </p>
      <EcosystemMatrix />

      {/* §H.7 ── Claude Code */}
      <h2>§H.7 Claude Code (Anthropic)</h2>
      <p>
        The harness you are using right now. 87.6% on SWE-bench Verified with Opus 4.8 (Jun 2026) — the highest published score for a general-purpose coding agent.
      </p>
      <p>
        Five configuration layers stack in order: <strong>CLAUDE.md</strong> (persistent instructions) → <strong>MCP servers</strong> (tool extension) → <strong>settings.json</strong> (tool permissions) → <strong>hooks</strong> (pre/post-tool shell scripts) → <strong>LangSmith observability</strong>.
      </p>
      <CodeBlock title="Claude Code — Install and Launch" language="bash" keyLine={5} keyNote="Launch in any project dir — harness auto-reads CLAUDE.md">{`# Install and authenticate
npm install -g @anthropic-ai/claude-code
claude login

# Launch in a project
cd your-project && claude

# Inspect active configuration
claude config list`}</CodeBlock>
      <div className="callout callout-info">
        <strong>CLAUDE.md is layer 1</strong> — everything you write there is injected into every turn's context. It is your primary lever for steering harness behaviour without touching code.
      </div>

      {/* §H.8 ── Codex CLI */}
      <h2>§H.8 Codex CLI (OpenAI)</h2>
      <p>
        OpenAI's terminal-native coding agent. 83.4% on Terminal-Bench 2.1 with GPT-5.5. Built around an <strong>App Server architecture</strong> with three primitives: <em>thread</em> (a conversation), <em>turn</em> (one model response), and <em>item</em> (a single content block).
      </p>
      <p>
        Key differentiator: sandboxed execution via Docker-isolated subprocess — every bash command runs inside a clean container by default. This makes it safer for autonomous operation on large codebases but adds ~300ms overhead per bash call.
      </p>
      <CodeBlock title="Codex CLI — Install and Task" language="bash" keyLine={3} keyNote="Single command drives a full multi-file refactor autonomously">{`npm install -g @openai/codex
codex login
codex "Refactor all async functions in src/ to use structured error handling"`}</CodeBlock>

      {/* §H.9 ── OpenClaw */}
      <h2>§H.9 OpenClaw</h2>
      <p>
        The open-source all-rounder. 100K+ GitHub stars (Feb 2026). Model-agnostic (Claude, GPT, Ollama). Configured entirely through a local <code>openclaw.yaml</code> file — no cloud account required after authentication.
      </p>
      <p>
        Ships with filesystem, bash, browser, email, and calendar tools out of the box. The <code>hooks</code> field lets you inject custom Python scripts before and after every tool call — the same pattern as Claude Code hooks.
      </p>
      <CodeBlock title="OpenClaw YAML Configuration" language="yaml" keyLine={8} keyNote="blocked_patterns gate runs before any tool execution">{CODE_OPENCLAW}</CodeBlock>

      {/* §H.10 ── DeepAgents & OpenHands */}
      <h2>§H.10 DeepAgents (LangChain) &amp; OpenHands</h2>
      <p>
        <strong>DeepAgents</strong> is LangChain's batteries-included harness — a thin CLI wrapper around LangGraph with sub-agents, filesystem tools, persistent SQLite memory, HITL interrupt support, YAML skill definitions, and MCP server integration.
      </p>
      <CodeBlock title="DeepAgents — LangGraph Setup" language="python" keyLine={6} keyNote="hitl=True enables human-in-the-loop interrupts out of the box">{CODE_DEEPAGENTS}</CodeBlock>
      <p>
        <strong>OpenHands</strong> (formerly OpenDevin, 71.4K stars) is the model-agnostic alternative: Docker Runtime isolates every action, supports Claude/GPT/Ollama interchangeably, and reached 72% SWE-bench with Claude 4. Choose OpenHands when you need provider flexibility; choose DeepAgents when you are already in the LangChain ecosystem.
      </p>
      <CodeBlock title="OpenHands — Docker-Based Launch" language="bash" keyLine={3} keyNote="-v mounts your workspace; every action runs sandboxed inside Docker">{`# OpenHands — Docker-based
docker pull ghcr.io/all-hands-ai/runtime:0.40-nikolaik
docker run -it --rm \\
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \\
  -v $(pwd):/workspace \\
  ghcr.io/all-hands-ai/openhands:0.40 \\
  python -m openhands.core.main -t "Fix the failing tests in src/"`}</CodeBlock>

      {/* §H.11 ── SWE-agent & HAL-Harness */}
      <h2>§H.11 SWE-agent &amp; HAL-Harness</h2>
      <p>
        <strong>SWE-agent</strong> (Princeton) is research-first. It introduced the <em>Agent-Computer Interface (ACI)</em> concept — a principled design for what tools an agent needs to work in a terminal environment. Its ACITools (search_file, open, goto, scroll, edit) are now widely copied. If you are building a new harness from scratch, read SWE-agent's ACI paper before designing your tool schema.
      </p>
      <p>
        <strong>HAL-Harness</strong> (Princeton PLI) is a meta-harness: it wraps other agents and evaluates them across SWE-bench, USACO, AppWorld, and tau-bench in a reproducible, containerised environment. Use it when you need to benchmark your own harness against published baselines — not for day-to-day tasks.
      </p>
      <CodeBlock title="HAL-Harness — Benchmark Any Agent" language="bash" keyLine={3} keyNote="--agent swaps in any harness for reproducible cross-benchmark comparison">{`# HAL-Harness — evaluate any agent
pip install hal-harness
hal-eval \\
  --agent claude-code \\
  --benchmark swe-bench-verified \\
  --n-samples 50 \\
  --output-dir ./results`}</CodeBlock>

      {/* §H.12 ── Housing.com Connection */}
      <h2>§H.12 Housing.com Connection</h2>
      <p>
        The chatbot pipeline you have been building throughout this course is a minimal harness. Map it to the 5-layer model:
      </p>
      <table>
        <tbody>
          <tr><th>Harness layer</th><th>Housing.com chatbot equivalent</th></tr>
          <tr><td><strong>Context &amp; Knowledge</strong></td><td>SLM taxonomy prompt · CLAUDE.md · domain registry (intent_registry.py)</td></tr>
          <tr><td><strong>Execution Loop</strong></td><td>LangGraph StateGraph in graph.py — nodes replace the while-loop</td></tr>
          <tr><td><strong>Tool Integration</strong></td><td>property_search · budget_calculator · loan_eligibility · area_insights tools</td></tr>
          <tr><td><strong>Orchestration &amp; Control</strong></td><td>Classifier confidence threshold gate · session store (Redis) · PII scrubber</td></tr>
          <tr><td><strong>Observability</strong></td><td>LangSmith @traceable on every node · playground.html · structured JSONL logs</td></tr>
        </tbody>
      </table>
      <div className="callout callout-tip">
        <strong>Upgrade path</strong> — When your LangGraph pipeline outgrows its current form, DeepAgents or OpenHands are natural next steps: they add persistent memory, HITL interrupts, and Docker sandboxing without requiring you to rewrite the core loop. The 5-layer model stays the same; only the implementation swaps.
      </div>

      <div className="callout callout-maang">
        <strong>MAANG interview: "Design an autonomous coding agent for a 50-engineer team. What infrastructure does it need beyond the model itself?"</strong><br />
        <strong>A:</strong> The harness stack, not the model, is the answer. (1) <em>Context layer</em>: AGENTS.md with coding standards, blocked patterns, and project topology — injected into every turn. (2) <em>Execution loop</em>: while-loop with stop_reason dispatch, turn counter (prevent infinite loops), exponential backoff on API errors. (3) <em>Tool layer</em>: 8–12 focused tools — read, write, bash (sandboxed), grep, browser for docs. No more, or the model mis-selects. (4) <em>Orchestration</em>: permission gate blocking <code>rm -rf</code> / force-push / DROP TABLE; HITL interrupt for all writes outside the repo; context compaction at ~40 turns to stay within the 200K window. (5) <em>Observability</em>: LangSmith @traceable on every tool call, cost-per-session dashboard, automated red-teaming weekly. The ratchet principle: every incident produces a new gate or context rule — the harness gets safer automatically. At 50 engineers you also need multi-tenancy: per-team AGENTS.md overlays and separate LangSmith projects so signal doesn't mix.
      </div>

      <QuizSection
        moduleId={52}
        title="Agent Harnesses & Scaffolding"
        contentHint="harness scaffold 5 layers context knowledge execution loop tool integration orchestration observability permission gate ratchet principle context compaction universal agent loop Claude Code Codex CLI OpenClaw SWE-agent OpenHands DeepAgents Devin HAL-Harness ACI agent-computer interface stop_reason tool_use end_turn LangGraph Housing.com HITL interrupt sub-agent SWE-bench 87.6% 72% YAML configuration"
      />
    </>
  );
}
