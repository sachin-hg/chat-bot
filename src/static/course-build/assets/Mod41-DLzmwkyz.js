import{j as e,r as d}from"./index-D4pJPyGz.js";import{Q as h}from"./QuizSection-BedG7s-t.js";import{C as i}from"./CodeBlock-dJ_hHYfw.js";function m(){return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"PROMPT CACHING — CACHE STATIC CONTENT, CHARGE ONLY DYNAMIC TOKENS"}),e.jsx("style",{children:`
        @keyframes dashFlow41a { to { stroke-dashoffset: -14; } }
        .dash-anim-41a { animation: dashFlow41a 1s linear infinite; }
      `}),e.jsxs("svg",{viewBox:"0 0 560 220",width:"100%",style:{display:"block",margin:"0 auto"},"aria-label":"Prompt caching architecture diagram",children:[e.jsxs("defs",{children:[e.jsx("marker",{id:"arrow-41-green",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#a6e3a1"})}),e.jsx("marker",{id:"arrow-41-teal",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#94e2d5"})})]}),e.jsx("text",{x:"10",y:"18",fontSize:"10",fill:"#6c7086",fontWeight:"700",letterSpacing:"0.08em",children:"API REQUEST STRUCTURE"}),e.jsx("rect",{x:"10",y:"26",width:"230",height:"54",rx:"6",fill:"#1e1e2e",stroke:"#a6e3a1",strokeWidth:"1.5"}),e.jsx("text",{x:"20",y:"43",fontSize:"11",fill:"#a6e3a1",fontWeight:"600",children:"System Prompt + Tools (static, ~2K tokens)"}),e.jsxs("text",{x:"20",y:"58",fontSize:"10",fill:"#6c7086",children:["cache_control: ",'{"type":"ephemeral"}']}),e.jsx("rect",{x:"152",y:"63",width:"80",height:"13",rx:"3",fill:"#a6e3a122",stroke:"#a6e3a1",strokeWidth:"1"}),e.jsx("text",{x:"192",y:"73",fontSize:"10",fill:"#a6e3a1",textAnchor:"middle",children:"CACHED ✓"}),e.jsx("rect",{x:"10",y:"90",width:"230",height:"42",rx:"6",fill:"#1e1e2e",stroke:"#f9e2af",strokeWidth:"1.5"}),e.jsx("text",{x:"20",y:"107",fontSize:"11",fill:"#f9e2af",fontWeight:"600",children:"Conversation history (last 20 turns)"}),e.jsx("rect",{x:"152",y:"115",width:"80",height:"13",rx:"3",fill:"#f9e2af22",stroke:"#f9e2af",strokeWidth:"1"}),e.jsx("text",{x:"192",y:"125",fontSize:"10",fill:"#f9e2af",textAnchor:"middle",children:"CACHED ✓"}),e.jsx("rect",{x:"10",y:"142",width:"230",height:"36",rx:"6",fill:"#1e1e2e",stroke:"#f38ba8",strokeWidth:"1.5"}),e.jsx("text",{x:"20",y:"158",fontSize:"11",fill:"#f38ba8",fontWeight:"600",children:"Current user message (~50 tokens)"}),e.jsx("rect",{x:"135",y:"163",width:"97",height:"13",rx:"3",fill:"#f38ba822",stroke:"#f38ba8",strokeWidth:"1"}),e.jsx("text",{x:"184",y:"173",fontSize:"10",fill:"#f38ba8",textAnchor:"middle",children:"NOT cached — paid"}),e.jsx("line",{x1:"246",y1:"110",x2:"302",y2:"110",stroke:"#94e2d5",strokeWidth:"1.5",strokeDasharray:"4 3",className:"dash-anim-41a",markerEnd:"url(#arrow-41-teal)"}),e.jsx("text",{x:"250",y:"104",fontSize:"9",fill:"#6c7086",children:"cache_control"}),e.jsx("text",{x:"254",y:"115",fontSize:"9",fill:"#6c7086",children:"ephemeral →"}),e.jsx("text",{x:"320",y:"18",fontSize:"10",fill:"#6c7086",fontWeight:"700",letterSpacing:"0.08em",children:"COST COMPARISON"}),e.jsx("rect",{x:"330",y:"26",width:"50",height:"150",rx:"4",fill:"#313244",stroke:"#45475a",strokeWidth:"1"}),e.jsx("rect",{x:"330",y:"26",width:"50",height:"150",rx:"4",fill:"#f38ba8aa"}),e.jsx("text",{x:"355",y:"110",fontSize:"10",fill:"#1e1e2e",textAnchor:"middle",fontWeight:"700",children:"2050"}),e.jsx("text",{x:"355",y:"122",fontSize:"9",fill:"#1e1e2e",textAnchor:"middle",children:"tokens"}),e.jsx("text",{x:"355",y:"190",fontSize:"10",fill:"#f38ba8",textAnchor:"middle",children:"Without"}),e.jsx("text",{x:"355",y:"202",fontSize:"9",fill:"#6c7086",textAnchor:"middle",children:"caching"}),e.jsx("rect",{x:"420",y:"26",width:"50",height:"150",rx:"4",fill:"#313244",stroke:"#45475a",strokeWidth:"1"}),e.jsx("rect",{x:"420",y:"161",width:"50",height:"15",rx:"4",fill:"#a6e3a1aa"}),e.jsx("text",{x:"445",y:"172",fontSize:"9",fill:"#1e1e2e",textAnchor:"middle",children:"50"}),e.jsx("text",{x:"445",y:"190",fontSize:"10",fill:"#a6e3a1",textAnchor:"middle",children:"With"}),e.jsx("text",{x:"445",y:"202",fontSize:"9",fill:"#6c7086",textAnchor:"middle",children:"caching"}),e.jsx("rect",{x:"310",y:"26",width:"8",height:"150",rx:"2",fill:"#45475a"}),e.jsx("line",{x1:"318",y1:"26",x2:"480",y2:"26",stroke:"#45475a",strokeWidth:"1",strokeDasharray:"3 3"}),e.jsx("text",{x:"492",y:"30",fontSize:"10",fill:"#6c7086",children:"100%"}),e.jsx("line",{x1:"318",y1:"161",x2:"480",y2:"161",stroke:"#a6e3a1",strokeWidth:"1",strokeDasharray:"3 3"}),e.jsx("text",{x:"492",y:"165",fontSize:"10",fill:"#a6e3a1",children:"~10%"}),e.jsx("text",{x:"390",y:"214",fontSize:"10",fill:"#a6e3a1",textAnchor:"middle",fontWeight:"600",children:"90% cost reduction on static portion"})]})]})}function x(){const[o,l]=d.useState(0),n=["Sliding Window","Summarise Old","Keep Sys + Last 5 + Summary"],a=["#89b4fa","#cba6f7","#94e2d5"],r=["#89b4fa","#cba6f7","#a6e3a1","#f9e2af","#fab387","#f5c2e7","#f38ba8","#94e2d5","#89b4fa","#cba6f7","#a6e3a1","#f9e2af","#fab387","#f5c2e7","#f38ba8","#94e2d5","#89b4fa","#cba6f7","#a6e3a1","#f38ba8"],c=o===0?[{y:4,h:16,color:"#a6e3a1",label:"sys"},...Array.from({length:8},(s,t)=>({y:22+t*14,h:12,color:r[12+t],label:`t${13+t}`}))]:o===1?[{y:4,h:16,color:"#a6e3a1",label:"sys"},{y:22,h:20,color:"#f9e2af",label:"∑ summary"},...Array.from({length:5},(s,t)=>({y:44+t*14,h:12,color:r[15+t],label:`t${16+t}`}))]:[{y:4,h:16,color:"#a6e3a1",label:"sys"},{y:22,h:18,color:"#f9e2af",label:"∑ compressed"},...Array.from({length:5},(s,t)=>({y:42+t*14,h:12,color:r[15+t],label:`t${16+t}`}))];return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"CONTEXT TRIMMING — KEEP CONTEXT MANAGEABLE FOR LONG CONVERSATIONS"}),e.jsx("div",{style:{marginBottom:"12px"},children:n.map((s,t)=>e.jsx("button",{onClick:()=>l(t),style:{background:o===t?"#89b4fa22":"#313244",color:o===t?"#89b4fa":"#cdd6f4",border:`1px solid ${o===t?"#89b4fa":"#45475a"}`,borderRadius:"6px",padding:"5px 12px",fontSize:"0.78rem",cursor:"pointer",marginRight:"8px"},children:s},t))}),e.jsxs("svg",{viewBox:"0 0 560 200",width:"100%",style:{display:"block",margin:"0 auto"},"aria-label":"Context trimming strategy diagram",children:[e.jsxs("defs",{children:[e.jsx("marker",{id:"arrow-41b-blue",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#89b4fa"})}),e.jsx("marker",{id:"arrow-41b-red",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#f38ba8"})})]}),e.jsx("text",{x:"14",y:"14",fontSize:"10",fill:"#6c7086",fontWeight:"700",children:"BEFORE (20 turns, at limit)"}),e.jsx("rect",{x:"14",y:"20",width:"36",height:"168",rx:"4",fill:"#313244",stroke:"#45475a",strokeWidth:"1"}),e.jsx("rect",{x:"14",y:"20",width:"36",height:"14",rx:"3",fill:"#a6e3a1aa"}),e.jsx("text",{x:"32",y:"30",fontSize:"8",fill:"#1e1e2e",textAnchor:"middle",children:"sys"}),Array.from({length:20},(s,t)=>e.jsx("rect",{x:"14",y:36+t*7.5,width:"36",height:"6.5",rx:"2",fill:r[t]+"99"},t)),e.jsx("rect",{x:"14",y:"20",width:"36",height:"168",rx:"4",fill:"none",stroke:"#f38ba8",strokeWidth:"2"}),e.jsx("text",{x:"32",y:"197",fontSize:"9",fill:"#f38ba8",textAnchor:"middle",children:"FULL"}),e.jsx("line",{x1:"56",y1:"104",x2:"90",y2:"104",stroke:"#89b4fa",strokeWidth:"1.5",markerEnd:"url(#arrow-41b-blue)"}),e.jsx("text",{x:"73",y:"99",fontSize:"9",fill:"#6c7086",textAnchor:"middle",children:"trim"}),e.jsx("rect",{x:"96",y:"40",width:"168",height:"128",rx:"6",fill:"#1e1e2e",stroke:a[o],strokeWidth:"1.5"}),e.jsx("text",{x:"180",y:"58",fontSize:"11",fill:a[o],textAnchor:"middle",fontWeight:"600",children:n[o]}),o===0&&e.jsxs(e.Fragment,{children:[e.jsx("text",{x:"180",y:"80",fontSize:"10",fill:"#cdd6f4",textAnchor:"middle",children:"Drop oldest turns first"}),e.jsx("text",{x:"180",y:"96",fontSize:"10",fill:"#cdd6f4",textAnchor:"middle",children:"Keep last N messages"}),e.jsx("text",{x:"180",y:"118",fontSize:"10",fill:"#a6e3a1",textAnchor:"middle",children:"+ Fast, zero LLM cost"}),e.jsx("text",{x:"180",y:"134",fontSize:"10",fill:"#f38ba8",textAnchor:"middle",children:"- Loses early context"}),e.jsx("text",{x:"180",y:"150",fontSize:"9",fill:"#6c7086",textAnchor:"middle",children:"Good for stateless Q&A"})]}),o===1&&e.jsxs(e.Fragment,{children:[e.jsx("text",{x:"180",y:"80",fontSize:"10",fill:"#cdd6f4",textAnchor:"middle",children:"LLM summarises old turns"}),e.jsx("text",{x:"180",y:"96",fontSize:"10",fill:"#cdd6f4",textAnchor:"middle",children:"Appended as system msg"}),e.jsx("text",{x:"180",y:"118",fontSize:"10",fill:"#a6e3a1",textAnchor:"middle",children:"+ Preserves key meaning"}),e.jsx("text",{x:"180",y:"134",fontSize:"10",fill:"#f38ba8",textAnchor:"middle",children:"- 1 extra LLM call cost"}),e.jsx("text",{x:"180",y:"150",fontSize:"9",fill:"#6c7086",textAnchor:"middle",children:"Good for agents needing memory"})]}),o===2&&e.jsxs(e.Fragment,{children:[e.jsx("text",{x:"180",y:"78",fontSize:"10",fill:"#cdd6f4",textAnchor:"middle",children:"Keep: sys prompt"}),e.jsx("text",{x:"180",y:"93",fontSize:"10",fill:"#cdd6f4",textAnchor:"middle",children:"+ compressed summary block"}),e.jsx("text",{x:"180",y:"108",fontSize:"10",fill:"#cdd6f4",textAnchor:"middle",children:"+ last 5 turns (verbatim)"}),e.jsx("text",{x:"180",y:"124",fontSize:"10",fill:"#a6e3a1",textAnchor:"middle",children:"+ Best of both strategies"}),e.jsx("text",{x:"180",y:"140",fontSize:"10",fill:"#f9e2af",textAnchor:"middle",children:"Housing.com recommended"}),e.jsx("text",{x:"180",y:"156",fontSize:"9",fill:"#6c7086",textAnchor:"middle",children:"Balance cost vs context quality"})]}),e.jsx("line",{x1:"270",y1:"104",x2:"306",y2:"104",stroke:"#a6e3a1",strokeWidth:"1.5",markerEnd:"url(#arrow-41b-blue)"}),e.jsx("text",{x:"288",y:"99",fontSize:"9",fill:"#6c7086",textAnchor:"middle",children:"result"}),e.jsx("text",{x:"316",y:"14",fontSize:"10",fill:"#6c7086",fontWeight:"700",children:"AFTER (within limit)"}),e.jsx("rect",{x:"316",y:"20",width:"36",height:"168",rx:"4",fill:"#313244",stroke:"#45475a",strokeWidth:"1"}),c.map((s,t)=>e.jsxs("g",{children:[e.jsx("rect",{x:"316",y:20+s.y,width:"36",height:s.h,rx:"2",fill:s.color+"bb"}),e.jsx("text",{x:"334",y:20+s.y+s.h/2+3,fontSize:s.h>14?8:7,fill:"#1e1e2e",textAnchor:"middle",children:s.label})]},t)),e.jsx("rect",{x:"316",y:"20",width:"36",height:"168",rx:"4",fill:"none",stroke:"#a6e3a1",strokeWidth:"1.5"}),e.jsx("text",{x:"334",y:"197",fontSize:"9",fill:"#a6e3a1",textAnchor:"middle",children:"FITS"}),e.jsx("text",{x:"400",y:"40",fontSize:"10",fill:"#6c7086",children:"Strategy reduces context"}),e.jsx("text",{x:"400",y:"56",fontSize:"10",fill:"#6c7086",children:"from ~20K → ~4K tokens"}),e.jsx("text",{x:"400",y:"78",fontSize:"11",fill:"#a6e3a1",fontWeight:"600",children:"80% token reduction"}),e.jsx("text",{x:"400",y:"96",fontSize:"10",fill:"#6c7086",children:"per subsequent request"})]})]})}const f=`.claude/
  skills/
    code-review.md     → invoked as /code-review
    ai-review.md       → invoked as /ai-review
    deploy-check.md    → invoked as /deploy-check
CLAUDE.md              → injected into every session (project context)
settings.json          → hooks, permissions, allowed tools`,u=`---
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
Provide bulleted issues with severity (critical/medium/low) and fix.`,p=`# CLAUDE.md — injected into every session
## Stack
FastAPI + LangGraph + PostgreSQL + Redis + Kafka + Claude Haiku/Sonnet

## Conventions
- All LLM calls use claude-haiku-4-5-20251001 unless reasoning required
- Intent classifier returns JSON: {intent, confidence, entities}
- SSE streaming: emit_sse() → queue.put_nowait() → async generator
- All new tools: @tool + @traceable decorators required

## When editing src/pipeline/: read graph.py first
## Never commit .env or API keys`,y=`// settings.json
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
}`,g=`name: Claude AI Code Review
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
            });`,j=`import anthropic
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
# Calls 2-N: cache_read_tokens (90% cheaper) for static system prompt`,k=`# WRONG: dynamic data injected into the cached block
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
}]`,b=`── API Request Structure ──────────────────────────────────────────────────────
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
         90% savings on system prompt every subsequent call`,A=`── Context Memory Strategies ─────────────────────────────────────────────────
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
Agents needing long memory: use entity memory (budget, confirmed preferences)`,w=`def trim_messages(messages: list, max_tokens: int = 6000) -> list:
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
    return [{"role": "system", "content": f"Prior context: {summary}"}] + recent`,S=`# BAD: LLM reasons out loud → 200 tokens CoT + 30 tokens JSON = 230 tokens
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
)`;function _(){return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"learning-obj",children:[e.jsx("div",{className:"learning-obj-title",children:"After this module you will be able to"}),e.jsxs("ol",{children:[e.jsx("li",{children:"Create Claude Code skills as slash commands and configure CLAUDE.md for project context"}),e.jsx("li",{children:"Use hooks in settings.json to automate pre/post tool actions"}),e.jsx("li",{children:"Integrate Claude Code into GitHub Actions for AI-powered PR review"}),e.jsx("li",{children:"Apply prompt caching to reduce system prompt costs by 90%"}),e.jsx("li",{children:"Implement context trimming and summarisation to prevent context window overflow"}),e.jsx("li",{children:"Enforce structured output to eliminate token waste from CoT reasoning"})]}),e.jsxs("div",{className:"obj-meta",children:[e.jsx("span",{className:"obj-time",children:"⏱ ~70 minutes"}),e.jsx("span",{className:"obj-diff",children:"Difficulty: ★★★☆☆"}),e.jsx("span",{className:"obj-diff",children:"Prerequisites: Module 2, any module with LLM calls"})]})]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"Housing.com Context"}),e.jsx("br",{}),"Housing.com's 2K-token domain taxonomy is a prime prompt caching candidate — currently paying full input token price on every classification call (~$1,440/day at 1M queries). CLAUDE.md is already how Housing.com engineers orient themselves to the codebase."]}),e.jsx(m,{}),e.jsx("h2",{children:"44.1 Claude Code Skills System"}),e.jsxs("p",{children:[e.jsx("strong",{children:"Skills"})," are Markdown files that act as reusable slash commands — you write the instructions once, and invoke them by name in any Claude Code session with ",e.jsx("code",{children:"/skill-name"}),". The filename (without ",e.jsx("code",{children:".md"}),") becomes the slash command."]}),e.jsxs("p",{children:[e.jsx("strong",{children:"CLAUDE.md"})," is Claude Code's project-level memory — automatically prepended to every session's context window. Claude reads it before every task, so it always knows your stack, conventions, and constraints. Because it's injected as the first part of the system prompt, it qualifies for prompt caching — you pay full price once, then ~10% on every subsequent call."]}),e.jsx(i,{title:"Claude Code Directory Structure",language:"text",keyLine:6,keyNote:"settings.json controls hooks, permissions, and allowed tools",children:f}),e.jsx(i,{title:"AI Review Skill — .claude/skills/ai-review.md",language:"text",keyLine:9,keyNote:"focus on AI-specific risks: injection, unbounded cost, missing evals",children:u}),e.jsx(i,{title:"CLAUDE.md — Project Context Injected Every Session",language:"text",keyLine:8,keyNote:"read graph.py first constraint prevents costly context mistakes",children:p}),e.jsx("h2",{children:"44.2 Hooks — Automated Pre/Post Actions"}),e.jsx("p",{children:"Hooks are shell commands that Claude Code runs automatically before or after specific tool calls. Two lifecycle points:"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:e.jsx("code",{children:"PreToolUse"})})," — runs before Claude writes or edits a file. If the command exits with code 1, Claude Code ",e.jsx("em",{children:"blocks"})," the tool call. Use to prevent secret leaks, enforce naming conventions, block writes to protected files."]}),e.jsxs("li",{children:[e.jsx("strong",{children:e.jsx("code",{children:"PostToolUse"})})," — runs after the tool completes. Use for: regenerate API docs, run a formatter, trigger a test on the changed file."]})]}),e.jsxs("p",{children:[e.jsx("code",{children:"$CLAUDE_TOOL_INPUT_PATH"})," is a Claude Code environment variable that points to a temporary JSON file containing the tool's input arguments — your hook script reads this file to inspect what Claude is about to write."]}),e.jsx(i,{title:"Hooks Config — PreToolUse Secret Guard + PostToolUse Docs",language:"json",keyLine:6,keyNote:"exit 1 from PreToolUse blocks Claude from writing the file",children:y}),e.jsx("h2",{children:"44.3 GitHub Actions — AI-Powered PR Review"}),e.jsx(i,{title:"GitHub Actions — AI-Powered PR Review Pipeline",language:"yaml",keyLine:16,keyNote:"pull-requests:write permission needed to post review comments",children:g}),e.jsx("h2",{children:"44.4 Prompt Caching"}),e.jsx("p",{children:"Every request to Anthropic's API that includes a long static system prompt pays the full input token price. Prompt caching lets the API reuse the KV cache from a previous call: you pay full price once (the cache write), then ~10% for every subsequent call that hits the cache."}),e.jsxs("p",{children:[e.jsx("strong",{children:"The one rule that makes it work: the cached content must come first."})," Anthropic's cache key is the ",e.jsx("em",{children:"exact prefix"})," of your input. Put your stable taxonomy, rules, and tool descriptions first; inject dynamic data after. The ",e.jsx("code",{children:'cache_control: {"type": "ephemeral"}'})," marker tells the API where the cacheable prefix ends."]}),e.jsx(i,{title:"Prompt Caching — 90% Cost Reduction on Static System Prompt",language:"python",keyLine:8,keyNote:"cache_control ephemeral marks the stable prefix to cache",children:j}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"Savings at scale + TTL behaviour"}),"1M calls/day × 2K-token system prompt × $0.80/1M = $1,600/day without cache. With cache: $160/day.",e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"Cache TTL resets on every cache hit:"})," Anthropic's ephemeral cache has a 5-minute TTL that resets each time the cache is hit. If calls stop for >5 minutes, the cache expires and the next call is a full cache miss. At low traffic (1 call/minute), you may pay full price more often than expected. Solution: batch requests or use prompt caching only for high-frequency endpoints.",e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"CLAUDE.md and prompt caching:"})," CLAUDE.md is injected as the first part of the system prompt — it qualifies for prompt caching. Keep CLAUDE.md stable between sessions. Every line changed is a new cache miss."]}),e.jsxs("div",{className:"callout callout-warn",children:[e.jsx("strong",{children:"What breaks the prompt cache?"}),"If ",e.jsx("em",{children:"anything"})," in the cached block changes between calls, every request is a full cache miss — you pay 100% cost, not 10%.",e.jsx(i,{title:"Cache Invalidation Pitfall — Dynamic Data in Cached Block",language:"python",keyLine:3,keyNote:"date in cached block causes 100% cache miss every call",variant:"broken",children:k}),"Rule: only stable, session-independent content goes in the cached block. Current date, user name, request ID — all go in the user message."]}),e.jsx("pre",{style:{fontSize:"11px",background:"#1e1e2e",color:"#cdd6f4",padding:"10px",borderRadius:"4px",margin:"8px 0",overflowX:"auto"},children:b}),e.jsx(x,{}),e.jsx("h2",{children:"44.5 Context Window Management"}),e.jsx("pre",{style:{fontSize:"11px",background:"#1e1e2e",color:"#cdd6f4",padding:"10px",borderRadius:"4px",margin:"8px 0",overflowX:"auto"},children:A}),e.jsxs("div",{className:"callout callout-warn",children:[e.jsx("strong",{children:"trim_messages is for cost control — but trimmed turns are permanently gone"}),"When you drop old turns, the LLM cannot see them, cannot reference them, and will behave as if the conversation started from the oldest remaining turn. Acceptable for stateless Q&A but dangerous for agents that rely on earlier decisions.",e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"Solution:"})," compress old turns into a system message summary before trimming. The summary preserves the key facts; the trimming removes the verbose dialogue."]}),e.jsx(i,{title:"Context Trimming — Sliding Window and Summarise Strategies",language:"python",keyLine:6,keyNote:"conv.pop(0) drops oldest turn first, preserving system always",children:w}),e.jsx("h2",{children:"44.6 Token Waste Elimination"}),e.jsx(i,{title:"Token Waste Elimination — Structured Output and Batch API",language:"python",keyLine:14,keyNote:"max_tokens=100 hard cap prevents unbounded generation cost",children:S}),e.jsxs("div",{className:"callout callout-maang",children:[e.jsx("strong",{children:"🎯 MAANG Interview Connection"}),'"How do you reduce LLM costs for 1M queries/day?" → Prompt caching (90% off static prompts). max_tokens hard cap. Structured-output-only prompts (no CoT). Batch API for async. Route simple queries to Haiku and escalate complex ones to Sonnet only when confidence < threshold.']}),e.jsx(h,{moduleId:44,title:"Module 44: Agentic Workflows & Token Optimisation",contentHint:"Claude Code skills .md file slash command invocation, CLAUDE.md project context injected every session, hooks PreToolUse PostToolUse settings.json secret detection, GitHub Actions headless PR review pipeline, prompt caching ephemeral cache_control 90% savings static system prompt, context trimming keep system + recent N turns, summarise old context compress to 3 sentences, structured output no CoT max_tokens hard cap, batch API 50% cost reduction async workloads"})]})}export{_ as Mod41};
