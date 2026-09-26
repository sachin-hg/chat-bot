import { useState } from 'react'
import confetti from 'canvas-confetti'
import { CodeBlock, CodeDiff } from '../components/CodeBlock'

// ── FIX 1: Interactive File Tree ──────────────────────────────────────────────

interface FileEntry {
  name: string
  type: 'dir' | 'todo' | 'provided'
  indent: number
  preview?: string
}

const FILE_TREE: FileEntry[] = [
  { name: 'housing-chatbot/', type: 'dir', indent: 0 },
  { name: 'src/', type: 'dir', indent: 1 },
  {
    name: 'pipeline.py',
    type: 'todo',
    indent: 2,
    preview: `def build_graph(emit_sse, executor=None, llm=None, ...):\n    graph = StateGraph(BotState)\n    # TODO: register nodes\n    # TODO: wire conditional edges`,
  },
  {
    name: 'classifier.py',
    type: 'todo',
    indent: 2,
    preview: `class ClassifierPort(Protocol):\n    async def classify(self, text: str, ...) -> dict: ...\n# TODO: implement SLM-based classifier\n# TODO: return structured classification dict`,
  },
  {
    name: 'session.py',
    type: 'todo',
    indent: 2,
    preview: `class RedisSessionStore:\n    # TODO: implement load(session_id) -> dict\n    # TODO: implement save(session_id, data)\n    # TODO: handle connection errors gracefully`,
  },
  {
    name: 'models.py',
    type: 'provided',
    indent: 2,
    preview: `class ChatRequest(BaseModel):\n    conversation_id: str\n    message_type: str\n    content: dict\n# Pydantic schemas — ready to use`,
  },
  {
    name: 'config.py',
    type: 'provided',
    indent: 2,
    preview: `class Settings(BaseSettings):\n    bot_env: str = "mock"\n    redis_url: str = "redis://localhost:6379"\n# Load via: settings = Settings()`,
  },
  { name: 'tests/', type: 'dir', indent: 1 },
  {
    name: 'test_acceptance.py',
    type: 'todo',
    indent: 2,
    preview: `async def test_sse_stream_returns_connection_close(): ...\nasync def test_blocked_message_never_reaches_llm(): ...\n# TODO: implement all 5 acceptance test cases\n# Run with: pytest tests/test_acceptance.py -q`,
  },
  {
    name: 'test_fixtures.py',
    type: 'provided',
    indent: 2,
    preview: `@pytest.fixture\ndef mock_classifier(): return MagicMock(...)\n@pytest.fixture\ndef base_state(): return BotState(raw_message="2BHK Mumbai", ...)`,
  },
]

function InteractiveFileTree() {
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        overflow: 'hidden',
        fontFamily: 'monospace',
        fontSize: '13px',
        minHeight: '260px',
      }}
    >
      {/* Left panel — file tree */}
      <div
        style={{
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          padding: '12px 0',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            padding: '4px 12px 8px',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--muted)',
            borderBottom: '1px solid var(--border)',
            marginBottom: '4px',
          }}
        >
          Project Structure
        </div>
        {FILE_TREE.map((entry, i) => {
          const isDir = entry.type === 'dir'
          const icon = isDir ? '📁' : entry.type === 'todo' ? '⚠️' : '✅'
          const color =
            isDir
              ? 'inherit'
              : entry.type === 'todo'
              ? 'var(--accent3, #f38ba8)'
              : 'var(--muted)'
          const isSelected = selectedFile?.name === entry.name

          return (
            <div
              key={i}
              onClick={() => !isDir && setSelectedFile(entry)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                paddingLeft: `${12 + entry.indent * 16}px`,
                cursor: isDir ? 'default' : 'pointer',
                background: isSelected
                  ? 'var(--accent-bg, rgba(137,180,250,0.12))'
                  : 'transparent',
                borderLeft: isSelected
                  ? '2px solid var(--accent)'
                  : '2px solid transparent',
                color,
                transition: 'background 0.1s',
              }}
            >
              <span style={{ fontSize: '12px', lineHeight: 1 }}>{icon}</span>
              <span>{entry.name}</span>
              {entry.type === 'todo' && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '9px',
                    background: 'var(--accent3, #f38ba8)',
                    color: '#1e1e2e',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                >
                  TODO
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Right panel — preview */}
      <div
        style={{
          background: 'var(--code-bg, #1e1e2e)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: selectedFile ? 'flex-start' : 'center',
          alignItems: selectedFile ? 'flex-start' : 'center',
        }}
      >
        {selectedFile ? (
          <>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--muted)',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{selectedFile.name}</span>
              {selectedFile.type === 'todo' ? (
                <span
                  style={{
                    background: 'var(--accent3, #f38ba8)',
                    color: '#1e1e2e',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    fontSize: '9px',
                    fontWeight: 700,
                  }}
                >
                  TODO
                </span>
              ) : (
                <span
                  style={{
                    background: 'var(--accent2, #a6e3a1)',
                    color: '#1e1e2e',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    fontSize: '9px',
                    fontWeight: 700,
                  }}
                >
                  PROVIDED
                </span>
              )}
            </div>
            <pre
              style={{
                margin: 0,
                fontSize: '12px',
                lineHeight: 1.7,
                color:
                  selectedFile.type === 'todo'
                    ? 'var(--accent3, #f38ba8)'
                    : 'var(--muted)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {selectedFile.preview}
            </pre>
          </>
        ) : (
          <span style={{ color: 'var(--muted)', fontSize: '12px' }}>
            ← Click a file to preview
          </span>
        )}
      </div>
    </div>
  )
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CODE_STATE = `from typing import TypedDict, Optional

class BotState(TypedDict):
    raw_message: str
    session_id: str
    session: dict
    domain: Optional[str]
    classification: Optional[dict]
    pre_fetched_data: Optional[dict]
    bot_response: Optional[str]
    request_id: str
    # Metadata tracked by pipeline
    tier: Optional[int]           # 0 | 1 | 2 | 3
    blocked: Optional[bool]
    error: Optional[str]`

const CODE_GRAPH = `from langgraph.graph import StateGraph, END
from src.pipeline.state import BotState

def build_graph(emit_sse, executor=None, llm=None, classifier=None, router=None):
    graph = StateGraph(BotState)

    # Register your nodes
    graph.add_node("safety_node",   safety_node)
    graph.add_node("route_node",    route_node)
    graph.add_node("classify_node", classify_node)
    graph.add_node("tool_node",     tool_node)
    graph.add_node("response_node", response_node)

    graph.set_entry_point("safety_node")

    # TODO: Fill in these conditional edges
    graph.add_conditional_edges("safety_node",   ...)
    graph.add_conditional_edges("route_node",    ...)
    graph.add_conditional_edges("classify_node", ...)

    graph.add_edge("tool_node",     "response_node")
    graph.add_edge("response_node", END)

    return graph.compile()`

const CODE_TEST_UNIT = `import pytest
from unittest.mock import AsyncMock, MagicMock
from src.pipeline.nodes.classify import classify_node
from src.pipeline.state import BotState

@pytest.mark.asyncio
async def test_classify_property_search():
    mock_classifier = MagicMock()
    mock_classifier.classify = AsyncMock(return_value={
        "main_intent": "property_search",
        "sub_intent": "filter_search",
        "filter_delta": {"bhk": 2, "city": "Mumbai"},
        "entities_mentioned": [],
        "clarification_needed": None,
        "pivot": False,
        "multi_intent": False,
    })

    state: BotState = {
        "raw_message": "2BHK in Mumbai under 2Cr",
        "session_id": "test-session",
        "session": {},
        "domain": "property_search",
        "classification": None,
        "pre_fetched_data": None,
        "bot_response": None,
        "request_id": "test-req-1",
        "tier": None, "blocked": None, "error": None,
    }

    result = await classify_node(state, classifier=mock_classifier)
    assert result["classification"]["main_intent"] == "property_search"
    assert result["classification"]["filter_delta"]["bhk"] == 2`

const CODE_ACCEPTANCE = `# Acceptance test 1: SSE streaming end-to-end
async def test_sse_stream_returns_connection_close():
    async with AsyncClient(app=app, base_url="http://test") as client:
        async with client.stream("POST", "/api/v1/chat/send-message-streamed",
                                  json={"conversation_id": "x", "message_type": "text",
                                        "content": {"text": "hello"}},
                                  headers={"X-Session-Token": "test"}) as resp:
            events = []
            async for line in resp.aiter_lines():
                if line.startswith("event:"):
                    events.append(line.split(":", 1)[1].strip())
            assert "connection_ack" in events
            assert "connection_close" in events

# Acceptance test 2: safety short-circuit
async def test_blocked_message_never_reaches_llm():
    mock_llm.stream = AsyncMock()  # should NOT be called
    resp = await client.post("/api/v1/chat/send-message-streamed",
                              json={"message_type": "text", "content": {"text": "NSFW content"}},
                              headers={"X-Session-Token": "test"})
    mock_llm.stream.assert_not_called()`

// ── FIX 2: L3/L4/L5 Rubric Cards ─────────────────────────────────────────────

const rubricCardStyle = (borderColor: string): React.CSSProperties => ({
  border: `2px solid ${borderColor}`,
  borderRadius: '10px',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
})

function RubricCards() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        margin: '8px 0',
      }}
    >
      {/* L3 */}
      <div style={rubricCardStyle('var(--border)')}>
        <div
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--muted)',
            lineHeight: 1,
          }}
        >
          L3
        </div>
        <div style={{ fontWeight: 700, fontSize: '15px' }}>Working System</div>
        <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.7, fontSize: '13px', color: 'var(--muted)' }}>
          <li>All 5 nodes run without crashing</li>
          <li>SSE streaming returns at least one event</li>
          <li>3 of 5 acceptance tests pass</li>
          <li>Some adapter coupling (direct imports OK at this level)</li>
        </ul>
      </div>

      {/* L4 */}
      <div style={rubricCardStyle('var(--accent)')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: 'var(--accent)',
              lineHeight: 1,
            }}
          >
            L4
          </div>
          <span
            style={{
              background: 'var(--accent)',
              color: '#1e1e2e',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              letterSpacing: '0.06em',
            }}
          >
            TARGET
          </span>
        </div>
        <div style={{ fontWeight: 700, fontSize: '15px' }}>Production Ready</div>
        <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.7, fontSize: '13px' }}>
          <li>All 5 acceptance tests pass</li>
          <li>Adapter pattern with Protocol classes</li>
          <li>Safety short-circuit proven by test</li>
          <li>1 unit test per pipeline node (5 total)</li>
          <li>Can explain every line of <code>build_graph()</code></li>
        </ul>
      </div>

      {/* L5 */}
      <div style={rubricCardStyle('var(--accent2)')}>
        <div
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--accent2)',
            lineHeight: 1,
          }}
        >
          L5
        </div>
        <div style={{ fontWeight: 700, fontSize: '15px' }}>Senior Engineer</div>
        <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.7, fontSize: '13px' }}>
          <li>try/finally around LLM gate in endpoint</li>
          <li>Structured logging with request_id on every log line</li>
          <li>Session load failure handled — falls back to empty session</li>
          <li>Integration test covers queue.get timeout path</li>
          <li>RAGAS CI gate: faithfulness &ge; 0.85 in pipeline</li>
        </ul>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ModCap2() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">Act 2 Capstone Project</div>
        <ol>
          <li>Build the full 5-node LangGraph pipeline from scratch: safety → route → classify → tools → response</li>
          <li>Wire FastAPI SSE streaming with asyncio.Queue so clients receive real-time pipeline events</li>
          <li>Implement the adapter pattern so the pipeline has no direct LLM or API dependencies</li>
          <li>Write unit tests for each node (mocked adapters) and an integration test for the SSE stream</li>
          <li>Pass all 5 acceptance criteria at L4 level</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~4–8 hours</span>
          <span className="obj-diff">Difficulty: ★★★★☆</span>
          <span className="obj-diff">Prerequisites: Modules 6–10 (complete Act 2)</span>
        </div>
      </div>

      <div className="callout callout-info">
        <strong>This is a project module — no quiz.</strong><br />
        Complete it, run the acceptance tests, and self-assess against the rubric. Post your solution in the community channel
        for peer review. The goal is not a perfect implementation but a working, testable pipeline that you can explain end-to-end.
      </div>

      <h2>Project Brief</h2>
      <p>
        You are a new engineer at Housing.com. Your task: build the core chatbot pipeline for the property search domain —
        the path a user message takes from <code>POST /send-message-streamed</code> to an SSE response.
        You start from a skeleton project (see Starter Code below). The tests and acceptance criteria are already written.
        Your job is to fill in the implementation.
      </p>
      <p>
        When complete, a user message like <em>"2BHK in Bandra under 2Cr"</em> should flow through your pipeline and return
        a streamed SSE response with a <code>connection_ack</code>, at least one <code>pipeline_step</code>, a
        <code>message_delta</code> chunk, and a <code>connection_close</code>.
      </p>

      <h2>Requirements (6 items)</h2>
      <ol>
        <li>
          <strong>BotState TypedDict</strong> — define in <code>src/pipeline/state.py</code>.
          Must include: <code>raw_message</code>, <code>session_id</code>, <code>session</code>, <code>domain</code>,
          <code>classification</code>, <code>pre_fetched_data</code>, <code>bot_response</code>, <code>request_id</code>,
          <code>tier</code>, <code>blocked</code>, <code>error</code>.
        </li>
        <li>
          <strong>5 pipeline nodes</strong> — one function per file in <code>src/pipeline/nodes/</code>.
          Each node must accept <code>state: BotState</code>, receive adapters via dependency injection (default <code>None</code>),
          and return a partial state dict. No node may import an adapter class directly.
        </li>
        <li>
          <strong>LangGraph StateGraph</strong> — <code>build_graph()</code> in <code>src/pipeline/graph.py</code>
          must wire all 5 nodes with appropriate conditional edges. The graph must short-circuit on blocked messages
          (never reach <code>classify_node</code> or beyond).
        </li>
        <li>
          <strong>SSE streaming</strong> — <code>send_message_streamed</code> endpoint must return a
          <code>StreamingResponse</code> with <code>media_type="text/event-stream"</code>.
          Pipeline runs as an <code>asyncio.create_task()</code>; frames are queued via <code>asyncio.Queue</code>.
        </li>
        <li>
          <strong>Adapter protocol</strong> — define <code>LLMPort</code> and <code>ClassifierPort</code> as Python
          <code>Protocol</code> classes. Provide a <code>MockLLM</code> adapter that returns a hardcoded response without
          making any API calls. All tests must pass with <code>BOT_ENV=mock</code>.
        </li>
        <li>
          <strong>Tests</strong> — at minimum: 1 unit test per node (5 total), 1 SSE streaming integration test,
          1 test verifying the safety short-circuit. All tests must pass with <code>pytest -q</code>.
        </li>
      </ol>

      <h2>Starter Code Scaffold</h2>
      <InteractiveFileTree />
      <CodeBlock
        title="BotState TypedDict — Pipeline State Shape"
        language="python"
        keyLine={12}
        keyNote="tier encodes safety/routing level, not just a counter"
      >{CODE_STATE}</CodeBlock>
      <p>Skeleton <code>build_graph()</code> — fill in the conditional edges:</p>
      <CodeBlock
        title="LangGraph Graph Skeleton — Wire Nodes and Edges"
        language="python"
        keyLine={17}
        keyNote="Safety edge fires first — wrong order breaks short-circuit"
      >{CODE_GRAPH}</CodeBlock>

      <h2>5 Acceptance Test Cases</h2>
      <CodeBlock
        title="Acceptance Tests — SSE End-to-End and Safety Short-Circuit"
        language="python"
        keyLine={20}
        keyNote="assert_not_called proves the LLM gate was never opened"
      >{CODE_ACCEPTANCE}</CodeBlock>
      <ol>
        <li><strong>SSE stream returns connection_close</strong> — every request, no matter what, must terminate with <code>connection_close</code>.</li>
        <li><strong>Safety short-circuit</strong> — a blocked message must never invoke the LLM adapter.</li>
        <li><strong>Classification output</strong> — a property query produces a <code>classification</code> dict with <code>main_intent = "property_search"</code>.</li>
        <li><strong>Filter delta applied to session</strong> — after classification with <code>filter_delta: {"{bhk: 2}"}</code>, the session must contain <code>active_filters.bhk = 2</code>.</li>
        <li><strong>Mock mode works</strong> — with <code>BOT_ENV=mock</code>, the full pipeline runs and returns a non-empty <code>bot_response</code> without any real API calls.</li>
      </ol>

      <h2>Rubric — What Level Are You At?</h2>
      <RubricCards />

      <h2>Solution Walkthrough — Key Architectural Decisions</h2>
      <div className="callout callout-info">
        <strong>Only read this after attempting the project.</strong>
      </div>
      <ol>
        <li>
          <strong>Why asyncio.Queue, not await directly?</strong> LangGraph calls node functions synchronously from its perspective. To emit SSE frames mid-pipeline without blocking LangGraph, nodes call <code>queue.put_nowait()</code> (sync, non-blocking). The FastAPI generator <code>await queue.get()</code>s independently. The two coroutines run concurrently under asyncio.
        </li>
        <li>
          <strong>Why Protocol, not ABC?</strong> Protocol enables structural subtyping — any object with a <code>classify()</code> method satisfies <code>ClassifierPort</code> without explicitly inheriting it. This means tests can pass a plain <code>MagicMock</code> with the right method names without any special setup.
        </li>
        <li>
          <strong>Conditional edge for safety</strong> — the <code>safety_node</code> returns <code>{"{"}"blocked": True{"}"}</code> on unsafe input. The routing function checks <code>state.get("blocked")</code>; if True, routes to <code>END</code> (short-circuit). No LLM call happens.
        </li>
        <li>
          <strong>Partial state updates</strong> — each node returns only the keys it "owns." LangGraph merges these updates onto the existing state. A node that returns <code>{"{"}"{"}"}</code> (empty dict) is valid — it just doesn't change anything.
        </li>
        <li>
          <strong>Where session saving happens</strong> — the <code>response_node</code> saves the updated session back to Redis after generating the response. This is the only node that writes to Redis (single responsibility). If it crashes after generating but before saving, the session state is lost for that turn — an acceptable tradeoff for simplicity at this stage.
        </li>
      </ol>

      <div className="callout callout-info">
        <strong>Unit test example</strong>
        <CodeBlock
          title="Classify Node Unit Test — Mocked Classifier Injection"
          language="python"
          keyLine={9}
          keyNote="AsyncMock lets you await classify() without a real LLM call"
        >{CODE_TEST_UNIT}</CodeBlock>
      </div>

      {/* FIX 3: Act Complete Milestone Callout */}
      <div
        style={{
          border: '2px solid var(--accent2)',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          marginTop: '32px',
        }}
      >
        <div
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: 'var(--accent2)',
            marginBottom: '8px',
          }}
        >
          Act 2 Complete
        </div>
        <p style={{ color: 'var(--muted)', margin: '0 0 20px', fontSize: '14px', lineHeight: 1.6 }}>
          You built the full 5-node LangGraph pipeline, wired SSE streaming with asyncio.Queue,
          implemented the adapter pattern with Protocol classes, and wrote unit + acceptance tests.
          That is a production-grade chatbot backend from scratch.
        </p>
        <button
          style={{
            background: 'var(--accent2)',
            color: '#1e1e2e',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 28px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          onClick={() => {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#89b4fa', '#a6e3a1', '#f9e2af', '#cba6f7', '#fab387'],
            })
            localStorage.setItem('act2_complete', 'true')
          }}
        >
          Mark Act 2 Complete
        </button>
      </div>
    </>
  )
}
