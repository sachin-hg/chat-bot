import { useState } from 'react';
import { QuizSection } from "../components/QuizSection";
import { CodeBlock, CodeDiff } from '../components/CodeBlock'

function PromptCachingViz() {
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>PROMPT CACHING — CACHE STATIC CONTENT, CHARGE ONLY DYNAMIC TOKENS</div>
      <style>{`
        @keyframes dashFlow41a { to { stroke-dashoffset: -14; } }
        .dash-anim-41a { animation: dashFlow41a 1s linear infinite; }
      `}</style>
      <svg viewBox="0 0 560 220" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Prompt caching architecture diagram">
        <defs>
          <marker id="arrow-41-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#a6e3a1"/>
          </marker>
          <marker id="arrow-41-teal" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#94e2d5"/>
          </marker>
        </defs>

        {/* Left side — prompt structure */}
        <text x="10" y="18" fontSize="10" fill="#6c7086" fontWeight="700" letterSpacing="0.08em">API REQUEST STRUCTURE</text>

        {/* Static / cached block */}
        <rect x="10" y="26" width="230" height="54" rx="6" fill="#1e1e2e" stroke="#a6e3a1" strokeWidth="1.5"/>
        <text x="20" y="43" fontSize="11" fill="#a6e3a1" fontWeight="600">System Prompt + Tools (static, ~2K tokens)</text>
        <text x="20" y="58" fontSize="10" fill="#6c7086">cache_control: {'{"type":"ephemeral"}'}</text>
        <rect x="152" y="63" width="80" height="13" rx="3" fill="#a6e3a122" stroke="#a6e3a1" strokeWidth="1"/>
        <text x="192" y="73" fontSize="10" fill="#a6e3a1" textAnchor="middle">CACHED ✓</text>

        {/* Semi-static / conversation history */}
        <rect x="10" y="90" width="230" height="42" rx="6" fill="#1e1e2e" stroke="#f9e2af" strokeWidth="1.5"/>
        <text x="20" y="107" fontSize="11" fill="#f9e2af" fontWeight="600">Conversation history (last 20 turns)</text>
        <rect x="152" y="115" width="80" height="13" rx="3" fill="#f9e2af22" stroke="#f9e2af" strokeWidth="1"/>
        <text x="192" y="125" fontSize="10" fill="#f9e2af" textAnchor="middle">CACHED ✓</text>

        {/* Dynamic block */}
        <rect x="10" y="142" width="230" height="36" rx="6" fill="#1e1e2e" stroke="#f38ba8" strokeWidth="1.5"/>
        <text x="20" y="158" fontSize="11" fill="#f38ba8" fontWeight="600">Current user message (~50 tokens)</text>
        <rect x="135" y="163" width="97" height="13" rx="3" fill="#f38ba822" stroke="#f38ba8" strokeWidth="1"/>
        <text x="184" y="173" fontSize="10" fill="#f38ba8" textAnchor="middle">NOT cached — paid</text>

        {/* Arrow label */}
        <line x1="246" y1="110" x2="302" y2="110" stroke="#94e2d5" strokeWidth="1.5" strokeDasharray="4 3" className="dash-anim-41a" markerEnd="url(#arrow-41-teal)"/>
        <text x="250" y="104" fontSize="9" fill="#6c7086">cache_control</text>
        <text x="254" y="115" fontSize="9" fill="#6c7086">ephemeral →</text>

        {/* Right side — cost comparison bars */}
        <text x="320" y="18" fontSize="10" fill="#6c7086" fontWeight="700" letterSpacing="0.08em">COST COMPARISON</text>

        {/* Without caching — tall red bar */}
        <rect x="330" y="26" width="50" height="150" rx="4" fill="#313244" stroke="#45475a" strokeWidth="1"/>
        <rect x="330" y="26" width="50" height="150" rx="4" fill="#f38ba8aa"/>
        <text x="355" y="110" fontSize="10" fill="#1e1e2e" textAnchor="middle" fontWeight="700">2050</text>
        <text x="355" y="122" fontSize="9" fill="#1e1e2e" textAnchor="middle">tokens</text>
        <text x="355" y="190" fontSize="10" fill="#f38ba8" textAnchor="middle">Without</text>
        <text x="355" y="202" fontSize="9" fill="#6c7086" textAnchor="middle">caching</text>

        {/* With caching — small green bar, ~10% height */}
        <rect x="420" y="26" width="50" height="150" rx="4" fill="#313244" stroke="#45475a" strokeWidth="1"/>
        <rect x="420" y="161" width="50" height="15" rx="4" fill="#a6e3a1aa"/>
        <text x="445" y="172" fontSize="9" fill="#1e1e2e" textAnchor="middle">50</text>
        <text x="445" y="190" fontSize="10" fill="#a6e3a1" textAnchor="middle">With</text>
        <text x="445" y="202" fontSize="9" fill="#6c7086" textAnchor="middle">caching</text>

        {/* Annotation */}
        <rect x="310" y="26" width="8" height="150" rx="2" fill="#45475a"/>
        <line x1="318" y1="26" x2="480" y2="26" stroke="#45475a" strokeWidth="1" strokeDasharray="3 3"/>
        <text x="492" y="30" fontSize="10" fill="#6c7086">100%</text>
        <line x1="318" y1="161" x2="480" y2="161" stroke="#a6e3a1" strokeWidth="1" strokeDasharray="3 3"/>
        <text x="492" y="165" fontSize="10" fill="#a6e3a1">~10%</text>

        <text x="390" y="214" fontSize="10" fill="#a6e3a1" textAnchor="middle" fontWeight="600">90% cost reduction on static portion</text>
      </svg>
    </div>
  );
}

function ContextTrimmingViz() {
  const [strategy, setStrategy] = useState(0);
  const strategies = ['Sliding Window', 'Summarise Old', 'Keep Sys + Last 5 + Summary'];
  const colors = ['#89b4fa', '#cba6f7', '#94e2d5'];

  const turnColors = ['#89b4fa','#cba6f7','#a6e3a1','#f9e2af','#fab387','#f5c2e7','#f38ba8','#94e2d5','#89b4fa','#cba6f7','#a6e3a1','#f9e2af','#fab387','#f5c2e7','#f38ba8','#94e2d5','#89b4fa','#cba6f7','#a6e3a1','#f38ba8'];

  const afterBlocks: {y: number; h: number; color: string; label: string}[] = strategy === 0
    ? [
        {y: 4, h: 16, color:'#a6e3a1', label:'sys'},
        ...Array.from({length:8}, (_,i) => ({y: 22+i*14, h:12, color: turnColors[12+i], label:`t${13+i}`}))
      ]
    : strategy === 1
    ? [
        {y: 4, h: 16, color:'#a6e3a1', label:'sys'},
        {y: 22, h: 20, color:'#f9e2af', label:'∑ summary'},
        ...Array.from({length:5}, (_,i) => ({y: 44+i*14, h:12, color: turnColors[15+i], label:`t${16+i}`}))
      ]
    : [
        {y: 4, h: 16, color:'#a6e3a1', label:'sys'},
        {y: 22, h: 18, color:'#f9e2af', label:'∑ compressed'},
        ...Array.from({length:5}, (_,i) => ({y: 42+i*14, h:12, color: turnColors[15+i], label:`t${16+i}`}))
      ];

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>CONTEXT TRIMMING — KEEP CONTEXT MANAGEABLE FOR LONG CONVERSATIONS</div>
      <div style={{marginBottom:'12px'}}>
        {strategies.map((s, i) => (
          <button key={i} onClick={() => setStrategy(i)} style={{background: strategy===i ? '#89b4fa22' : '#313244', color: strategy===i ? '#89b4fa' : '#cdd6f4', border: `1px solid ${strategy===i ? '#89b4fa' : '#45475a'}`, borderRadius:'6px', padding:'5px 12px', fontSize:'0.78rem', cursor:'pointer', marginRight:'8px'}}>{s}</button>
        ))}
      </div>
      <svg viewBox="0 0 560 200" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Context trimming strategy diagram">
        <defs>
          <marker id="arrow-41b-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#89b4fa"/>
          </marker>
          <marker id="arrow-41b-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#f38ba8"/>
          </marker>
        </defs>

        {/* Left — context filling up (turns 1–20) */}
        <text x="14" y="14" fontSize="10" fill="#6c7086" fontWeight="700">BEFORE (20 turns, at limit)</text>
        <rect x="14" y="20" width="36" height="168" rx="4" fill="#313244" stroke="#45475a" strokeWidth="1"/>
        {/* System block */}
        <rect x="14" y="20" width="36" height="14" rx="3" fill="#a6e3a1aa"/>
        <text x="32" y="30" fontSize="8" fill="#1e1e2e" textAnchor="middle">sys</text>
        {/* 20 turns */}
        {Array.from({length:20}, (_,i) => (
          <rect key={i} x="14" y={36+i*7.5} width="36" height="6.5" rx="2" fill={turnColors[i]+'99'}/>
        ))}
        {/* Over limit indicator */}
        <rect x="14" y="20" width="36" height="168" rx="4" fill="none" stroke="#f38ba8" strokeWidth="2"/>
        <text x="32" y="197" fontSize="9" fill="#f38ba8" textAnchor="middle">FULL</text>

        {/* Arrow → trim */}
        <line x1="56" y1="104" x2="90" y2="104" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#arrow-41b-blue)"/>
        <text x="73" y="99" fontSize="9" fill="#6c7086" textAnchor="middle">trim</text>

        {/* Center — strategy info */}
        <rect x="96" y="40" width="168" height="128" rx="6" fill="#1e1e2e" stroke={colors[strategy]} strokeWidth="1.5"/>
        <text x="180" y="58" fontSize="11" fill={colors[strategy]} textAnchor="middle" fontWeight="600">{strategies[strategy]}</text>
        {strategy === 0 && <>
          <text x="180" y="80" fontSize="10" fill="#cdd6f4" textAnchor="middle">Drop oldest turns first</text>
          <text x="180" y="96" fontSize="10" fill="#cdd6f4" textAnchor="middle">Keep last N messages</text>
          <text x="180" y="118" fontSize="10" fill="#a6e3a1" textAnchor="middle">+ Fast, zero LLM cost</text>
          <text x="180" y="134" fontSize="10" fill="#f38ba8" textAnchor="middle">- Loses early context</text>
          <text x="180" y="150" fontSize="9" fill="#6c7086" textAnchor="middle">Good for stateless Q&amp;A</text>
        </>}
        {strategy === 1 && <>
          <text x="180" y="80" fontSize="10" fill="#cdd6f4" textAnchor="middle">LLM summarises old turns</text>
          <text x="180" y="96" fontSize="10" fill="#cdd6f4" textAnchor="middle">Appended as system msg</text>
          <text x="180" y="118" fontSize="10" fill="#a6e3a1" textAnchor="middle">+ Preserves key meaning</text>
          <text x="180" y="134" fontSize="10" fill="#f38ba8" textAnchor="middle">- 1 extra LLM call cost</text>
          <text x="180" y="150" fontSize="9" fill="#6c7086" textAnchor="middle">Good for agents needing memory</text>
        </>}
        {strategy === 2 && <>
          <text x="180" y="78" fontSize="10" fill="#cdd6f4" textAnchor="middle">Keep: sys prompt</text>
          <text x="180" y="93" fontSize="10" fill="#cdd6f4" textAnchor="middle">+ compressed summary block</text>
          <text x="180" y="108" fontSize="10" fill="#cdd6f4" textAnchor="middle">+ last 5 turns (verbatim)</text>
          <text x="180" y="124" fontSize="10" fill="#a6e3a1" textAnchor="middle">+ Best of both strategies</text>
          <text x="180" y="140" fontSize="10" fill="#f9e2af" textAnchor="middle">Housing.com recommended</text>
          <text x="180" y="156" fontSize="9" fill="#6c7086" textAnchor="middle">Balance cost vs context quality</text>
        </>}

        {/* Arrow → after */}
        <line x1="270" y1="104" x2="306" y2="104" stroke="#a6e3a1" strokeWidth="1.5" markerEnd="url(#arrow-41b-blue)"/>
        <text x="288" y="99" fontSize="9" fill="#6c7086" textAnchor="middle">result</text>

        {/* Right — after trimming */}
        <text x="316" y="14" fontSize="10" fill="#6c7086" fontWeight="700">AFTER (within limit)</text>
        <rect x="316" y="20" width="36" height="168" rx="4" fill="#313244" stroke="#45475a" strokeWidth="1"/>
        {afterBlocks.map((b, i) => (
          <g key={i}>
            <rect x="316" y={20+b.y} width="36" height={b.h} rx="2" fill={b.color+'bb'}/>
            <text x="334" y={20+b.y+b.h/2+3} fontSize={b.h > 14 ? 8 : 7} fill="#1e1e2e" textAnchor="middle">{b.label}</text>
          </g>
        ))}
        <rect x="316" y="20" width="36" height="168" rx="4" fill="none" stroke="#a6e3a1" strokeWidth="1.5"/>
        <text x="334" y="197" fontSize="9" fill="#a6e3a1" textAnchor="middle">FITS</text>

        {/* Token counts annotation */}
        <text x="400" y="40" fontSize="10" fill="#6c7086">Strategy reduces context</text>
        <text x="400" y="56" fontSize="10" fill="#6c7086">from ~20K → ~4K tokens</text>
        <text x="400" y="78" fontSize="11" fill="#a6e3a1" fontWeight="600">80% token reduction</text>
        <text x="400" y="96" fontSize="10" fill="#6c7086">per subsequent request</text>
      </svg>
    </div>
  );
}

const CODE_DIR = `.claude/
  skills/
    code-review.md     → invoked as /code-review
    ai-review.md       → invoked as /ai-review
    deploy-check.md    → invoked as /deploy-check
CLAUDE.md              → injected into every session (project context)
settings.json          → hooks, permissions, allowed tools`;

const CODE_SKILL = `---
name: ai-review
description: Review staged changes for AI-specific issues
args:
  - name: focus
    description: "Optional: security | cost | quality"
    required: false
---

Review staged changes. Focus on:
1. Prompt strings that could enable prompt injection
2. LLM calls without max_tokens (unbounded cost risk)
3. Tool schemas missing type annotations (JSON parse failures)
4. Missing eval coverage for new RAG pipelines

Run: git diff --staged
Provide bulleted issues with severity (critical/medium/low) and fix.`;

const CODE_CLAUDE_MD = `# CLAUDE.md — injected into every session
## Stack
FastAPI + LangGraph + PostgreSQL + Redis + Kafka + Claude Haiku/Sonnet

## Conventions
- All LLM calls use claude-haiku-4-5-20251001 unless reasoning required
- Intent classifier returns JSON: {intent, confidence, entities}
- SSE streaming: emit_sse() → queue.put_nowait() → async generator
- All new tools: @tool + @traceable decorators required

## When editing src/pipeline/: read graph.py first
## Never commit .env or API keys`;

const CODE_HOOKS = `// settings.json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "grep -rE 'api_key|password|secret' $CLAUDE_TOOL_INPUT_PATH && echo 'BLOCK: secret' && exit 1 || exit 0"
      }]
    }],
    "PostToolUse": [{
      "matcher": "Write",
      "hooks": [{
        "type": "command",
        "command": "python scripts/update_api_docs.py $CLAUDE_TOOL_INPUT_PATH"
      }]
    }]
  }
}`;

const CODE_GHA = `name: Claude AI Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  ai-review:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }

      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code

      - name: Run AI review
        env:
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          git diff origin/main...HEAD > /tmp/pr_diff.txt
          python3 - <<'PYEOF'
          import anthropic
          diff = open('/tmp/pr_diff.txt').read()[:12000]
          client = anthropic.Anthropic()
          response = client.messages.create(
              model="claude-haiku-4-5-20251001",
              max_tokens=1024,
              messages=[{"role": "user", "content":
                  f"Review this PR diff for correctness, security, missing tests, "
                  f"and AI-specific concerns. Format as GitHub markdown."
              }]
          )
          open('review.md', 'w').write(response.content[0].text)
          PYEOF

      - name: Post comment
        uses: actions/github-script@v7
        with:
          script: |
            const body = require('fs').readFileSync('review.md','utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner, repo: context.repo.repo, body
            });`;

const CODE_CACHE = `import anthropic
client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=1024,
    system=[{
        "type": "text",
        "text": LONG_SYSTEM_PROMPT,   # 2000 tokens of taxonomy
        "cache_control": {"type": "ephemeral"},  # cache 5 minutes
    }],
    messages=[{"role": "user", "content": user_query}],
)
# Call 1: full prompt tokens charged
# Calls 2-N: cache_read_tokens (90% cheaper) for static system prompt`;

const CODE_CACHE_WRONG = `# WRONG: dynamic data injected into the cached block
system = [{
    "type": "text",
    "text": f"Today is {datetime_today}. Taxonomy: {TAXONOMY}",
    "cache_control": {"type": "ephemeral"},   # date changes → cache always misses!
}]

# RIGHT: static content cached, dynamic content in the user message
system = [{
    "type": "text",
    "text": f"Taxonomy: {TAXONOMY}",           # never changes → 90% cache hit rate
    "cache_control": {"type": "ephemeral"},
}]
messages = [{
    "role": "user",
    "content": f"Today is {datetime_today}. Query: {user_query}"
}]`;

const DIAGRAM_CACHE = `── API Request Structure ──────────────────────────────────────────────────────
system: [
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  CACHED BLOCK (ephemeral)  ~2,000 tokens                               │
  │  Taxonomy, domain rules, tool schemas, Housing.com persona             │
  │  Cost: 10% of input token rate after first call                        │
  │  Stable across all requests (never changes turn-to-turn)               │
  └──────────── cache_control: {"type":"ephemeral"} ────────────────────────┘
]
messages: [
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  DYNAMIC CONTENT  (always charged at full rate)                        │
  │  Today's date, session_id, active_filters, conversation history        │
  │  Retrieved property chunks (changes every request)                     │
  └─────────────────────────────────────────────────────────────────────────┘
]

Call 1: cache_creation_input_tokens=2000 (100% rate) + uncached tokens
Call 2+: cache_read_input_tokens=2000 (10% rate) + uncached tokens
         90% savings on system prompt every subsequent call`;

const DIAGRAM_CONTEXT = `── Context Memory Strategies ─────────────────────────────────────────────────
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  TRIM (sliding       │  │  SUMMARISE (compress │  │  ENTITY MEMORY       │
│  window)             │  │  before trim)        │  │  (structured store)  │
│                      │  │                      │  │                      │
│  Keep last N turns   │  │  LLM summarises old  │  │  Extract key facts   │
│  Drop oldest first   │  │  context to 3 lines  │  │  to dict/DB outside  │
│                      │  │  Append as system    │  │  LLM context         │
│ + Simple, cheap      │  │  message             │  │                      │
│ - Loses early facts  │  │                      │  │ + Scales to 1000s    │
│ - Good for stateless │  │ + Preserves meaning  │  │   of turns           │
│   Q&A bots           │  │ - 1 extra LLM call   │  │ + Precise, explicit  │
│                      │  │ - Summary may lose   │  │ - Extra complexity   │
│                      │  │   exact values       │  │ - Need schema design │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
Housing.com: trim is sufficient (each turn is mostly independent property search)
Agents needing long memory: use entity memory (budget, confirmed preferences)`;

const CODE_TRIM = `def trim_messages(messages: list, max_tokens: int = 6000) -> list:
    if count_tokens(messages) <= max_tokens:
        return messages
    system  = [m for m in messages if m["role"] == "system"]
    conv    = [m for m in messages if m["role"] != "system"]
    while count_tokens(system + conv) > max_tokens and len(conv) > 2:
        conv.pop(0)  # drop oldest turn
    return system + conv

def summarise_old_context(messages: list) -> list:
    if len(messages) < 10:
        return messages
    old, recent = messages[:-4], messages[-4:]
    summary = llm.invoke(f"Summarise in 3 sentences: {old}").content
    return [{"role": "system", "content": f"Prior context: {summary}"}] + recent`;

const CODE_TOKENS = `# BAD: LLM reasons out loud → 200 tokens CoT + 30 tokens JSON = 230 tokens
prompt = "Think step by step, then classify this as JSON."

# GOOD: output only the result → 30 tokens
prompt = """Classify the query. Output ONLY valid JSON. No explanation.
Schema: {"intent": string, "confidence": 0-1, "entities": object}
Query: {query}"""

# GOOD: hard max_tokens cap
response = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=100,    # prevents runaway generation
    messages=[...],
)

# GOOD: batch API for async workloads (50% cost reduction)
batch = client.messages.batches.create(
    requests=[
        {"custom_id": f"q_{i}",
         "params": {"model": "claude-haiku-4-5-20251001", "max_tokens": 50,
                    "messages": [{"role": "user", "content": q}]}}
        for i, q in enumerate(queries)
    ]
)`;

export function Mod41() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Create Claude Code skills as slash commands and configure CLAUDE.md for project context</li>
          <li>Use hooks in settings.json to automate pre/post tool actions</li>
          <li>Integrate Claude Code into GitHub Actions for AI-powered PR review</li>
          <li>Apply prompt caching to reduce system prompt costs by 90%</li>
          <li>Implement context trimming and summarisation to prevent context window overflow</li>
          <li>Enforce structured output to eliminate token waste from CoT reasoning</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~70 minutes</span>
          <span className="obj-diff">Difficulty: ★★★☆☆</span>
          <span className="obj-diff">Prerequisites: Module 2, any module with LLM calls</span>
        </div>
      </div>
      <div className="callout callout-info">
        <strong>Housing.com Context</strong><br />
        Housing.com's 2K-token domain taxonomy is a prime prompt caching candidate — currently paying full input token price on every classification call (~$1,440/day at 1M queries). CLAUDE.md is already how Housing.com engineers orient themselves to the codebase.
      </div>

      <PromptCachingViz />

      <h2>44.1 Claude Code Skills System</h2>
      <p><strong>Skills</strong> are Markdown files that act as reusable slash commands — you write the instructions once, and invoke them by name in any Claude Code session with <code>/skill-name</code>. The filename (without <code>.md</code>) becomes the slash command.</p>
      <p><strong>CLAUDE.md</strong> is Claude Code's project-level memory — automatically prepended to every session's context window. Claude reads it before every task, so it always knows your stack, conventions, and constraints. Because it's injected as the first part of the system prompt, it qualifies for prompt caching — you pay full price once, then ~10% on every subsequent call.</p>
      <CodeBlock title="Claude Code Directory Structure" language="text" keyLine={6} keyNote="settings.json controls hooks, permissions, and allowed tools">{CODE_DIR}</CodeBlock>
      <CodeBlock title="AI Review Skill — .claude/skills/ai-review.md" language="text" keyLine={9} keyNote="focus on AI-specific risks: injection, unbounded cost, missing evals">{CODE_SKILL}</CodeBlock>
      <CodeBlock title="CLAUDE.md — Project Context Injected Every Session" language="text" keyLine={8} keyNote="read graph.py first constraint prevents costly context mistakes">{CODE_CLAUDE_MD}</CodeBlock>

      <h2>44.2 Hooks — Automated Pre/Post Actions</h2>
      <p>Hooks are shell commands that Claude Code runs automatically before or after specific tool calls. Two lifecycle points:</p>
      <ul>
        <li><strong><code>PreToolUse</code></strong> — runs before Claude writes or edits a file. If the command exits with code 1, Claude Code <em>blocks</em> the tool call. Use to prevent secret leaks, enforce naming conventions, block writes to protected files.</li>
        <li><strong><code>PostToolUse</code></strong> — runs after the tool completes. Use for: regenerate API docs, run a formatter, trigger a test on the changed file.</li>
      </ul>
      <p><code>$CLAUDE_TOOL_INPUT_PATH</code> is a Claude Code environment variable that points to a temporary JSON file containing the tool's input arguments — your hook script reads this file to inspect what Claude is about to write.</p>
      <CodeBlock title="Hooks Config — PreToolUse Secret Guard + PostToolUse Docs" language="json" keyLine={6} keyNote="exit 1 from PreToolUse blocks Claude from writing the file">{CODE_HOOKS}</CodeBlock>

      <h2>44.3 GitHub Actions — AI-Powered PR Review</h2>
      <CodeBlock title="GitHub Actions — AI-Powered PR Review Pipeline" language="yaml" keyLine={16} keyNote="pull-requests:write permission needed to post review comments">{CODE_GHA}</CodeBlock>

      <h2>44.4 Prompt Caching</h2>
      <p>Every request to Anthropic's API that includes a long static system prompt pays the full input token price. Prompt caching lets the API reuse the KV cache from a previous call: you pay full price once (the cache write), then ~10% for every subsequent call that hits the cache.</p>
      <p><strong>The one rule that makes it work: the cached content must come first.</strong> Anthropic's cache key is the <em>exact prefix</em> of your input. Put your stable taxonomy, rules, and tool descriptions first; inject dynamic data after. The <code>{'cache_control: {"type": "ephemeral"}'}</code> marker tells the API where the cacheable prefix ends.</p>
      <CodeBlock title="Prompt Caching — 90% Cost Reduction on Static System Prompt" language="python" keyLine={8} keyNote="cache_control ephemeral marks the stable prefix to cache">{CODE_CACHE}</CodeBlock>
      <div className="callout callout-info">
        <strong>Savings at scale + TTL behaviour</strong>
        1M calls/day × 2K-token system prompt × $0.80/1M = $1,600/day without cache. With cache: $160/day.
        <br /><br />
        <strong>Cache TTL resets on every cache hit:</strong> Anthropic's ephemeral cache has a 5-minute TTL
        that resets each time the cache is hit. If calls stop for &gt;5 minutes, the cache expires and the
        next call is a full cache miss. At low traffic (1 call/minute), you may pay full price more often
        than expected. Solution: batch requests or use prompt caching only for high-frequency endpoints.
        <br /><br />
        <strong>CLAUDE.md and prompt caching:</strong> CLAUDE.md is injected as the first part of the system prompt
        — it qualifies for prompt caching. Keep CLAUDE.md stable between sessions. Every line changed is a new cache miss.
      </div>
      <div className="callout callout-warn">
        <strong>What breaks the prompt cache?</strong>
        If <em>anything</em> in the cached block changes between calls, every request is a full cache miss — you pay 100% cost, not 10%.
        <CodeBlock title="Cache Invalidation Pitfall — Dynamic Data in Cached Block" language="python" keyLine={3} keyNote="date in cached block causes 100% cache miss every call" variant="broken">{CODE_CACHE_WRONG}</CodeBlock>
        Rule: only stable, session-independent content goes in the cached block. Current date, user name, request ID — all go in the user message.
      </div>
      <pre style={{fontSize:'11px',background:'#1e1e2e',color:'#cdd6f4',padding:'10px',borderRadius:'4px',margin:'8px 0',overflowX:'auto'}}>{DIAGRAM_CACHE}</pre>

      <ContextTrimmingViz />

      <h2>44.5 Context Window Management</h2>
      <pre style={{fontSize:'11px',background:'#1e1e2e',color:'#cdd6f4',padding:'10px',borderRadius:'4px',margin:'8px 0',overflowX:'auto'}}>{DIAGRAM_CONTEXT}</pre>
      <div className="callout callout-warn">
        <strong>trim_messages is for cost control — but trimmed turns are permanently gone</strong>
        When you drop old turns, the LLM cannot see them, cannot reference them, and will behave as if
        the conversation started from the oldest remaining turn. Acceptable for stateless Q&amp;A but dangerous
        for agents that rely on earlier decisions.
        <br /><br />
        <strong>Solution:</strong> compress old turns into a system message summary before trimming. The summary
        preserves the key facts; the trimming removes the verbose dialogue.
      </div>
      <CodeBlock title="Context Trimming — Sliding Window and Summarise Strategies" language="python" keyLine={6} keyNote="conv.pop(0) drops oldest turn first, preserving system always">{CODE_TRIM}</CodeBlock>

      <h2>44.6 Token Waste Elimination</h2>
      <CodeBlock title="Token Waste Elimination — Structured Output and Batch API" language="python" keyLine={14} keyNote="max_tokens=100 hard cap prevents unbounded generation cost">{CODE_TOKENS}</CodeBlock>

      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection</strong>
        "How do you reduce LLM costs for 1M queries/day?" → Prompt caching (90% off static prompts). max_tokens hard cap. Structured-output-only prompts (no CoT). Batch API for async. Route simple queries to Haiku and escalate complex ones to Sonnet only when confidence &lt; threshold.
      </div>

      <QuizSection moduleId={44} title="Module 44: Agentic Workflows & Token Optimisation" contentHint="Claude Code skills .md file slash command invocation, CLAUDE.md project context injected every session, hooks PreToolUse PostToolUse settings.json secret detection, GitHub Actions headless PR review pipeline, prompt caching ephemeral cache_control 90% savings static system prompt, context trimming keep system + recent N turns, summarise old context compress to 3 sentences, structured output no CoT max_tokens hard cap, batch API 50% cost reduction async workloads" />
    </>
  );
}
