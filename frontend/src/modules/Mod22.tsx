import { QuizSection } from "../components/QuizSection";
import Editor from '@monaco-editor/react';

const CODE_C2 = `from typing import TypedDict, Optional

# TypedDict: pipeline state (BotState) — dict-compatible, zero validation overhead
class BotState(TypedDict):
    session_id: str
    normalized_message: str
    classification: Optional[dict]   # Optional = might be None

# Pydantic: API request/response schemas — validation + auto-generated docs
from pydantic import BaseModel
class QuizRequest(BaseModel):
    module_id: int
    num_questions: int = 3           # Default value — like TypeScript default parameter

req = QuizRequest(module_id=1)      # Validates + fills defaults
req.model_dump()                    # → {"module_id": 1, "num_questions": 3}
# Pydantic v2 (pip install pydantic>=2.0): use .model_dump(), NOT .dict()
# .dict() still works in v2 but is deprecated — LangChain tutorials online use .dict()
# because they were written for v1. Check: import pydantic; pydantic.__version__

# Dataclass: internal data containers — typed, no framework overhead
from dataclasses import dataclass
@dataclass
class NodeResult:
    success: bool
    data: dict
    latency_ms: float`;

const CODE_C3 = `# WRONG: sequential (accidentally doubles latency)
properties = await fetch_properties(filters)    # Wait for finish
locality   = await fetch_locality_data(loc)     # THEN start
# Total time = sum of both

# RIGHT: concurrent (asyncio.gather = Promise.all)
properties, locality = await asyncio.gather(
    fetch_properties(filters),
    fetch_locality_data(loc)
)
# Total time = slowest one, not sum`;

export function Mod22() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this appendix you will be able to</div>
        <ol>
          <li>Read any Python AI engineering file and explain every line</li>
          <li>Write Python function signatures and type hints from memory</li>
          <li>Identify the critical difference between Python async/await and JavaScript async/await</li>
          <li>Use TypedDict, Pydantic, and dataclass in the right context</li>
          <li>Complete a coding round that involves reading and extending AI pipeline code</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~45 minutes</span>
          <span className="obj-diff">Difficulty: ★★☆☆☆</span>
          <span className="obj-diff">Prerequisites: Any JS/TS experience</span>
        </div>
      </div>

      <h2>C.1 Python / TypeScript Side-by-Side Reference</h2>
      <table>
        <tbody>
          <tr><th>Concept</th><th>Python</th><th>TypeScript</th></tr>
          <tr><td>Dict (object)</td><td><code>{"{'"}key{"'"}: {"'"}value{"'"}{"}"}  </code></td><td><code>{"{"}key: "value"{"}"}</code></td></tr>
          <tr><td>Dict access with default</td><td><code>d.get("key", default)</code></td><td><code>d?.key ?? default</code></td></tr>
          <tr><td>List comprehension</td><td><code>[x*2 for x in items if x &gt; 0]</code></td><td><code>items.filter(x=&gt;x&gt;0).map(x=&gt;x*2)</code></td></tr>
          <tr><td>Async function</td><td><code>async def fn(): await something()</code></td><td><code>async function fn() {"{"} await something(); {"}"}</code></td></tr>
          <tr><td>Parallel async</td><td><code>await asyncio.gather(a(), b())</code></td><td><code>await Promise.all([a(), b()])</code></td></tr>
          <tr><td>Type union</td><td><code>str | int</code> or <code>Optional[str]</code></td><td><code>string | number</code> or <code>string | undefined</code></td></tr>
          <tr><td>F-string</td><td><code>f"Hello {"{name}"}"</code></td><td><code>`Hello ${"{name}"}`</code></td></tr>
          <tr><td>None check</td><td><code>if value is None:</code></td><td><code>if (value === null || value === undefined)</code></td></tr>
          <tr><td>List unpack</td><td><code>a, b, *rest = my_list</code></td><td><code>const [a, b, ...rest] = myList</code></td></tr>
          <tr><td>Dict spread</td><td><code>{"{"}"**base, "key": val{"}"}</code></td><td><code>{"{"}"...base, key: val{"}"}</code></td></tr>
          <tr><td>Decorator</td><td><code>@traceable</code></td><td>TypeScript 5.0+ has stage 3 decorators: <code>@Trace()</code>. For older TS/Node.js, use HOF wrapper: <code>const traced = (name: string) =&gt; (fn: Function) =&gt; async (...args: any[]) =&gt; {"{"} const start = Date.now(); const r = await fn(...args); console.log(name, Date.now()-start); return r; {"}"}</code></td></tr>
        </tbody>
      </table>

      <h2>C.2 TypedDict vs Pydantic vs Dataclass</h2>
      <div style={{margin:'16px 0',borderRadius:'8px',overflow:'hidden',border:'1px solid var(--border)'}}>
  <div style={{background:'var(--bg)',borderBottom:'1px solid var(--border)',padding:'6px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
    <span style={{fontSize:'11px',fontWeight:700,color:'var(--muted)'}}>PYTHON</span>
    <button onClick={() => navigator.clipboard.writeText(CODE_C2)}
      style={{background:'none',border:'none',color:'var(--muted)',fontSize:'11px',cursor:'pointer',padding:'2px 6px'}}>
      Copy
    </button>
  </div>
  <Editor
    height="320px"
    language="python"
    value={CODE_C2}
    theme="vs-dark"
    options={{
      readOnly: false,
      minimap: { enabled: false },
      fontSize: 13,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      padding: { top: 12, bottom: 12 },
    }}
  />
</div>
      <div className="callout callout-tip">
        <strong>Rule:</strong> Pipeline state flowing through nodes → <code>TypedDict</code>. FastAPI request/response body → <code>Pydantic BaseModel</code>. Internal struct, no serialization → <code>@dataclass</code>.
      </div>

      <h2>C.3 async/await — The One Difference That Matters</h2>
      <div className="callout callout-warn">
        <strong>Python hides this from JS engineers</strong>
        {" "}JavaScript's event loop is always running. Python's must be explicitly started: <code>asyncio.run(main())</code>. In FastAPI: the framework manages it.<br /><br />
        The practical impact in this codebase:
        {" "}Inside LangGraph nodes (sync context) → use <code>queue.put_nowait(frame)</code> — non-blocking, no event loop required.
        {" "}Inside FastAPI endpoints (async context) → use <code>await queue.get()</code> — yields control to event loop.
        {" "}This is why the bridge pattern in Module 4.4 is designed that way.
        <br /><br />
        <strong>Does put_nowait ever fail?</strong> Only if the queue has a <code>maxsize</code> limit — then it raises <code>QueueFull</code>. In this codebase, the queue is created as <code>asyncio.Queue()</code> with no maxsize argument (see <code>src/api/chat.py</code>). Default maxsize=0 means <strong>unbounded</strong> — <code>put_nowait</code> never raises. If you ever bound the queue (for memory protection), wrap <code>put_nowait</code> in try/except and log the dropped frame rather than crashing the pipeline.
      </div>
      <div style={{margin:'16px 0',borderRadius:'8px',overflow:'hidden',border:'1px solid var(--border)'}}>
  <div style={{background:'var(--bg)',borderBottom:'1px solid var(--border)',padding:'6px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
    <span style={{fontSize:'11px',fontWeight:700,color:'var(--muted)'}}>PYTHON</span>
    <button onClick={() => navigator.clipboard.writeText(CODE_C3)}
      style={{background:'none',border:'none',color:'var(--muted)',fontSize:'11px',cursor:'pointer',padding:'2px 6px'}}>
      Copy
    </button>
  </div>
  <Editor
    height="200px"
    language="python"
    value={CODE_C3}
    theme="vs-dark"
    options={{
      readOnly: false,
      minimap: { enabled: false },
      fontSize: 13,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      padding: { top: 12, bottom: 12 },
    }}
  />
</div>
      <svg width="560" height="260" viewBox="0 0 560 260" style={{display: "block", margin: "12px auto", fontFamily: "'Courier New',monospace"}}>
        <rect width="560" height="260" rx="6" fill="#1e1e2e"/>
        <text x="280" y="20" textAnchor="middle" fill="#cdd6f4" fontSize="11" fontWeight="bold">Sequential vs Parallel Tool Execution — fetch_data_node</text>
        <text x="140" y="42" textAnchor="middle" fill="#f38ba8" fontSize="10" fontWeight="bold">SEQUENTIAL  (600ms total)</text>
        <line x1="30" y1="55" x2="270" y2="55" stroke="#585b70" strokeWidth="1"/>
        <text x="30" y="51" textAnchor="middle" fill="#6c7086" fontSize="8">0ms</text>
        <rect x="30" y="60" width="80" height="26" rx="3" fill="#89b4fa" fillOpacity="0.3" stroke="#89b4fa" strokeWidth="1.5"/>
        <text x="70" y="76" textAnchor="middle" fill="#89b4fa" fontSize="9">searchProperties</text>
        <text x="70" y="86" textAnchor="middle" fill="#89b4fa" fontSize="8">200ms</text>
        <line x1="110" y1="55" x2="110" y2="100" stroke="#585b70" strokeWidth="1" strokeDasharray="2,2"/>
        <text x="110" y="51" textAnchor="middle" fill="#6c7086" fontSize="8">200</text>
        <rect x="110" y="60" width="80" height="26" rx="3" fill="#a6e3a1" fillOpacity="0.3" stroke="#a6e3a1" strokeWidth="1.5"/>
        <text x="150" y="76" textAnchor="middle" fill="#a6e3a1" fontSize="9">getLocality</text>
        <text x="150" y="86" textAnchor="middle" fill="#a6e3a1" fontSize="8">200ms</text>
        <line x1="190" y1="55" x2="190" y2="100" stroke="#585b70" strokeWidth="1" strokeDasharray="2,2"/>
        <text x="190" y="51" textAnchor="middle" fill="#6c7086" fontSize="8">400</text>
        <rect x="190" y="60" width="80" height="26" rx="3" fill="#fab387" fillOpacity="0.3" stroke="#fab387" strokeWidth="1.5"/>
        <text x="230" y="76" textAnchor="middle" fill="#fab387" fontSize="9">getPriceHistory</text>
        <text x="230" y="86" textAnchor="middle" fill="#fab387" fontSize="8">200ms</text>
        <line x1="270" y1="55" x2="270" y2="100" stroke="#f38ba8" strokeWidth="1.5"/>
        <text x="270" y="51" textAnchor="middle" fill="#f38ba8" fontSize="8" fontWeight="bold">600ms</text>
        <text x="150" y="100" textAnchor="middle" fill="#f38ba8" fontSize="9">each waits for previous</text>
        <text x="420" y="42" textAnchor="middle" fill="#a6e3a1" fontSize="10" fontWeight="bold">PARALLEL — asyncio.gather (200ms total)</text>
        <line x1="300" y1="55" x2="540" y2="55" stroke="#585b70" strokeWidth="1"/>
        <text x="300" y="51" textAnchor="middle" fill="#6c7086" fontSize="8">0ms</text>
        <rect x="300" y="60" width="80" height="22" rx="3" fill="#89b4fa" fillOpacity="0.3" stroke="#89b4fa" strokeWidth="1.5"/>
        <text x="340" y="75" textAnchor="middle" fill="#89b4fa" fontSize="9">searchProperties</text>
        <rect x="300" y="86" width="80" height="22" rx="3" fill="#a6e3a1" fillOpacity="0.3" stroke="#a6e3a1" strokeWidth="1.5"/>
        <text x="340" y="101" textAnchor="middle" fill="#a6e3a1" fontSize="9">getLocality</text>
        <rect x="300" y="112" width="80" height="22" rx="3" fill="#fab387" fillOpacity="0.3" stroke="#fab387" strokeWidth="1.5"/>
        <text x="340" y="127" textAnchor="middle" fill="#fab387" fontSize="9">getPriceHistory</text>
        <line x1="380" y1="55" x2="380" y2="140" stroke="#a6e3a1" strokeWidth="1.5"/>
        <text x="380" y="51" textAnchor="middle" fill="#a6e3a1" fontSize="8" fontWeight="bold">200ms</text>
        <text x="380" y="150" textAnchor="middle" fill="#a6e3a1" fontSize="9">all done</text>
        <line x1="285" y1="40" x2="285" y2="165" stroke="#45475a" strokeWidth="1"/>
        <rect x="30" y="170" width="220" height="78" rx="4" fill="#181825"/>
        <text x="40" y="185" fill="#f38ba8" fontSize="8" fontFamily="'Courier New',monospace">a = await searchProperties(filters)</text>
        <text x="40" y="197" fill="#f38ba8" fontSize="8" fontFamily="'Courier New',monospace">b = await getLocality(loc)</text>
        <text x="40" y="209" fill="#f38ba8" fontSize="8" fontFamily="'Courier New',monospace">c = await getPriceHistory(prop)</text>
        <text x="40" y="224" fill="#6c7086" fontSize="8"># time = 200 + 200 + 200 = 600ms</text>
        <rect x="300" y="170" width="235" height="78" rx="4" fill="#181825"/>
        <text x="310" y="185" fill="#a6e3a1" fontSize="8" fontFamily="'Courier New',monospace">a, b, c = await asyncio.gather(</text>
        <text x="310" y="197" fill="#a6e3a1" fontSize="8" fontFamily="'Courier New',monospace">  searchProperties(filters),</text>
        <text x="310" y="209" fill="#a6e3a1" fontSize="8" fontFamily="'Courier New',monospace">  getLocality(loc),</text>
        <text x="310" y="221" fill="#a6e3a1" fontSize="8" fontFamily="'Courier New',monospace">  getPriceHistory(prop))</text>
        <text x="310" y="236" fill="#6c7086" fontSize="8"># time = max(200, 200, 200) = 200ms</text>
        <text x="280" y="256" textAnchor="middle" fill="#a6adc8" fontSize="9">3x speedup — same result. P95 latency drops below 800ms SLA.</text>
      </svg>
      <p>Three sequential 200ms calls = 600ms. Three concurrent = 200ms. For a P95 &lt; 800ms SLA, this difference is the interview answer for "how did you optimize fetch_data_node?"</p>

      <h2>C.4 Reading This Codebase for Coding Round Prep</h2>
      <p><em>Read these files in order. For each: close it, write the function signatures from memory, compare.</em></p>
      <table>
        <tbody>
          <tr><th>File</th><th>What to Learn From It</th><th>Interview Pattern</th></tr>
          <tr><td><code>src/pipeline/nodes/processing.py</code></td><td>5 nodes, ~15 lines each, single responsibility. The simplest example of the pipeline pattern.</td><td>LLD: "Design a pipeline stage that does X"</td></tr>
          <tr><td><code>src/adapters/classifier.py</code></td><td>Port/adapter pattern — testable AI code with provider swap</td><td>LLD: "How do you make this unit-testable?"</td></tr>
          <tr><td><code>src/session/store.py</code></td><td>Redis + Lua CAS optimistic locking for concurrent session writes</td><td>LLD: "Handle concurrent writes to the same session"</td></tr>
          <tr><td><code>src/pipeline/graph.py</code></td><td>LangGraph DAG compilation — how nodes connect into a runnable pipeline</td><td>HLD: "How does your pipeline execute?"</td></tr>
          <tr><td><code>src/api/chat.py</code></td><td>SSE generator + asyncio.Queue bridge — the hardest pattern in the codebase</td><td>Advanced: async streaming from sync components</td></tr>
        </tbody>
      </table>
      <div className="callout callout-maang">
        <strong>The readability exercise:</strong> Take any function from <code>processing.py</code>. Read it line by line out loud. For each line: (1) what does this do? (2) why does this exist? (3) what breaks if you remove it? This is exactly what a coding round whiteboard walk-through looks like. Practice with code you've already read.
        <br /><br />If the interviewer asks you to write Python on a whiteboard: start with function signature and type hints. Demonstrate you understand the design. Writing fluency is secondary to design judgment — they expect to improve fluency with you in the role.
      </div>

      <QuizSection moduleId={49} title="Appendix C: Python for AI Engineering" contentHint="TypedDict vs Pydantic vs dataclass use cases, asyncio.gather vs sequential await, put_nowait vs await put distinction, Python TypeScript syntax equivalents, reading and explaining AI pipeline code from processing.py adapters session store" />
    </>
  );
}
