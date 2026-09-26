import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from '../components/CodeBlock';

function SSEComparisonViz() {
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>SSE vs WEBSOCKETS vs LONG POLLING — WHY WE CHOSE SSE</div>
      <style>{`@keyframes sseFlow{to{stroke-dashoffset:-14}} .sse-dash{animation:sseFlow 1s linear infinite}`}</style>
      <svg viewBox="0 0 560 200" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="SSE vs WebSockets vs Long Polling comparison">
        <defs>
          <marker id="sse-a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#89b4fa"/></marker>
          <marker id="ws-a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#f9e2af"/></marker>
          <marker id="ws-a2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#f9e2af"/></marker>
          <marker id="lp-a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#f38ba8"/></marker>
        </defs>

        {/* Column dividers */}
        <line x1="187" y1="0" x2="187" y2="200" stroke="#313244" strokeWidth="1"/>
        <line x1="374" y1="0" x2="374" y2="200" stroke="#313244" strokeWidth="1"/>

        {/* === SSE COLUMN === */}
        <text x="93" y="18" textAnchor="middle" fontSize="11" fill="#89b4fa" fontWeight="700">SSE ✓ Our Choice</text>
        {/* Client box */}
        <rect x="10" y="28" width="70" height="24" rx="6" fill="#313244" stroke="#89b4fa" strokeWidth="1.5"/>
        <text x="45" y="44" textAnchor="middle" fontSize="9" fill="#89b4fa">Client</text>
        {/* Connect arrow */}
        <line x1="80" y1="40" x2="107" y2="40" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#sse-a)"/>
        <text x="93" y="35" textAnchor="middle" fontSize="7" fill="#6c7086">connect</text>
        {/* Server box */}
        <rect x="107" y="28" width="70" height="24" rx="6" fill="#313244" stroke="#89b4fa" strokeWidth="1.5"/>
        <text x="142" y="44" textAnchor="middle" fontSize="9" fill="#89b4fa">Server</text>
        {/* Events stream (one-way) */}
        {[0,1,2,3].map(i=>(
          <line key={i} x1="142" y1={68+i*18} x2="45" y2={68+i*18} stroke="#89b4fa" strokeWidth="1.5" strokeDasharray="4 3" className="sse-dash" markerEnd="url(#sse-a)" style={{animationDelay:`${i*0.25}s`}}/>
        ))}
        <text x="93" y="65" textAnchor="middle" fontSize="7" fill="#6c7086">event stream →</text>
        {/* Auto-reconnect */}
        <path d="M10,145 Q-5,155 10,165 L80,165" stroke="#89b4fa" strokeWidth="1.5" fill="none" strokeDasharray="3 2"/>
        <text x="45" y="180" textAnchor="middle" fontSize="8" fill="#89b4fa">auto-reconnects</text>
        {/* Label */}
        <text x="93" y="196" textAnchor="middle" fontSize="8" fill="#6c7086">HTTP/1.1 · server→client only</text>

        {/* === WEBSOCKET COLUMN === */}
        <text x="280" y="18" textAnchor="middle" fontSize="11" fill="#f9e2af" fontWeight="700">WebSocket</text>
        <rect x="197" y="28" width="70" height="24" rx="6" fill="#313244" stroke="#f9e2af" strokeWidth="1.5"/>
        <text x="232" y="44" textAnchor="middle" fontSize="9" fill="#f9e2af">Client</text>
        {/* Handshake */}
        <line x1="267" y1="36" x2="294" y2="36" stroke="#f9e2af" strokeWidth="1.5" markerEnd="url(#ws-a)"/>
        <line x1="294" y1="44" x2="267" y2="44" stroke="#f9e2af" strokeWidth="1.5" markerEnd="url(#ws-a2)"/>
        <text x="280" y="32" textAnchor="middle" fontSize="7" fill="#6c7086">handshake</text>
        <rect x="294" y="28" width="70" height="24" rx="6" fill="#313244" stroke="#f9e2af" strokeWidth="1.5"/>
        <text x="329" y="44" textAnchor="middle" fontSize="9" fill="#f9e2af">Server</text>
        {/* Full duplex arrows */}
        {[0,1,2].map(i=>(
          <g key={i}>
            <line x1="267" y1={72+i*22} x2="294" y2={72+i*22} stroke="#f9e2af" strokeWidth="1" strokeDasharray="4 3" className="sse-dash" style={{animationDelay:`${i*0.3}s`}} markerEnd="url(#ws-a)"/>
            <line x1="294" y1={80+i*22} x2="267" y2={80+i*22} stroke="#f9e2af" strokeWidth="1" strokeDasharray="4 3" className="sse-dash" style={{animationDelay:`${i*0.3+0.15}s`}} markerEnd="url(#ws-a2)"/>
          </g>
        ))}
        <text x="280" y="70" textAnchor="middle" fontSize="7" fill="#6c7086">full duplex</text>
        {/* Explicit close */}
        <rect x="235" y="152" width="90" height="20" rx="4" fill="#45475a" stroke="#f9e2af" strokeWidth="1"/>
        <text x="280" y="165" textAnchor="middle" fontSize="8" fill="#f9e2af">explicit close</text>
        <text x="280" y="196" textAnchor="middle" fontSize="8" fill="#6c7086">Full duplex · complex · stateful</text>

        {/* === LONG POLLING COLUMN === */}
        <text x="467" y="18" textAnchor="middle" fontSize="11" fill="#f38ba8" fontWeight="700">Long Polling</text>
        <rect x="384" y="28" width="70" height="24" rx="6" fill="#313244" stroke="#f38ba8" strokeWidth="1.5"/>
        <text x="419" y="44" textAnchor="middle" fontSize="9" fill="#f38ba8">Client</text>
        {/* Request → hold → response loop */}
        <line x1="454" y1="40" x2="481" y2="40" stroke="#f38ba8" strokeWidth="1.5" markerEnd="url(#lp-a)"/>
        <rect x="481" y="28" width="70" height="24" rx="6" fill="#313244" stroke="#f38ba8" strokeWidth="1.5"/>
        <text x="516" y="44" textAnchor="middle" fontSize="9" fill="#f38ba8">Server</text>
        {/* Server holds */}
        <rect x="481" y="60" width="70" height="30" rx="4" fill="#313244" stroke="#45475a" strokeWidth="1"/>
        <text x="516" y="77" textAnchor="middle" fontSize="8" fill="#6c7086">holds until</text>
        <text x="516" y="88" textAnchor="middle" fontSize="8" fill="#6c7086">data ready…</text>
        {/* Response back */}
        <line x1="481" y1="104" x2="454" y2="104" stroke="#f38ba8" strokeWidth="1.5" markerEnd="url(#lp-a)"/>
        <text x="467" y="99" textAnchor="middle" fontSize="7" fill="#6c7086">response</text>
        {/* Re-request immediately */}
        <path d="M419,115 Q405,125 419,135 L454,135 L454,120 L481,120" stroke="#f38ba8" strokeWidth="1.5" fill="none" strokeDasharray="3 2" markerEnd="url(#lp-a)"/>
        <text x="450" y="150" textAnchor="middle" fontSize="8" fill="#f38ba8">re-request immediately</text>
        <text x="467" y="196" textAnchor="middle" fontSize="8" fill="#6c7086">Simulates streaming · inefficient</text>
      </svg>
    </div>
  );
}

function SSEFrameAnatomyViz() {
  const frames = [
    {
      raw: `data: {"type":"classification_done","intent":"property_search"}`,
      typeField: '"type":"classification_done"',
      explanation: 'Intent classified → route to property search handler',
      color: '#cba6f7',
    },
    {
      raw: `data: {"type":"tool_start","tool":"search_properties"}`,
      typeField: '"type":"tool_start"',
      explanation: 'Tool call begins → show "Searching properties…" in UI',
      color: '#89b4fa',
    },
    {
      raw: `data: {"type":"chunk","text":"I found 47 2BHK apartments"}`,
      typeField: '"type":"chunk"',
      explanation: 'LLM token chunk → append to StreamingText buffer',
      color: '#a6e3a1',
    },
    {
      raw: `data: {"type":"chunk","text":" in Bandra under ₹2Cr"}`,
      typeField: '"type":"chunk"',
      explanation: 'Continuation chunk → same buffer, one rAF update',
      color: '#a6e3a1',
    },
    {
      raw: `data: {"type":"connection_close"}`,
      typeField: '"type":"connection_close"',
      explanation: 'Stream done → setState("complete"), stop cursor blink',
      color: '#f9e2af',
    },
  ];

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>SSE FRAME ANATOMY — EVERY EVENT TYPE IN THE HOUSING.COM PROTOCOL</div>
      <svg viewBox="0 0 560 180" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="SSE frame anatomy showing 5 frame types">
        {frames.map((f, i) => {
          const y = 8 + i * 34;
          const typeStart = f.raw.indexOf('"type"');
          const typeEnd = typeStart + f.typeField.length;
          const before = f.raw.slice(0, typeStart);
          const highlighted = f.raw.slice(typeStart, typeEnd);
          const after = f.raw.slice(typeEnd);
          return (
            <g key={i}>
              {/* Frame rectangle */}
              <rect x="4" y={y} width="310" height="28" rx="6" fill="#313244" stroke={f.color} strokeWidth="1"/>
              {/* Raw text — before highlight */}
              <text x="10" y={y+18} fontSize="9" fill="#6c7086" fontFamily="monospace">{before}</text>
              {/* Highlighted type field */}
              <rect x={10 + before.length * 5.4} y={y+6} width={highlighted.length * 5.4} height="14" rx="2" fill={f.color} fillOpacity="0.2"/>
              <text x={10 + before.length * 5.4} y={y+18} fontSize="9" fill={f.color} fontFamily="monospace" fontWeight="700">{highlighted}</text>
              {/* After highlight */}
              <text x={10 + (before.length + highlighted.length) * 5.4} y={y+18} fontSize="9" fill="#6c7086" fontFamily="monospace">{after}</text>
              {/* Connector line */}
              <line x1="314" y1={y+14} x2="330" y2={y+14} stroke={f.color} strokeWidth="1" strokeDasharray="3 2"/>
              {/* Explanation box */}
              <rect x="330" y={y} width="225" height="28" rx="6" fill="#1e1e2e" stroke="#45475a" strokeWidth="1"/>
              <text x="338" y={y+18} fontSize="9" fill="#bac2de">{f.explanation}</text>
            </g>
          );
        })}
        {/* Frame index labels */}
        {frames.map((_, i) => (
          <text key={i} x="2" y={8 + i*34 + 18} fontSize="8" fill="#45475a" textAnchor="start">{i+1}</text>
        ))}
      </svg>
      <div style={{marginTop:'10px',fontSize:'0.78rem',color:'#6c7086',fontFamily:'monospace'}}>
        Each frame: <span style={{color:'#cba6f7'}}>data: </span>followed by JSON payload, terminated by double newline (<span style={{color:'#f9e2af'}}>\n\n</span>). The <span style={{color:'#89b4fa'}}>"type"</span> field routes each event to the correct UI handler.
      </div>
    </div>
  );
}

const CODE_SSE_FRAMES = `event: pipeline_step
data: {"node":"safety","status":"completed","latency_ms":2}

event: pipeline_step
data: {"node":"classify","status":"completed","latency_ms":187,"detail":{"domain":"property_search","intent":"search_properties"}}

event: chat_event
data: {"messageState":"IN_PROGRESS","chatResponse":{"type":"property_carousel","properties":[{"id":"abc","title":"3BHK Bandra West","price":"₹1.95Cr"}]}}

event: message_delta
data: {"content":{"text":"I found"},"chunkIndex":0}

event: message_delta
data: {"content":{"text":" 8 properties"},"chunkIndex":1}

... (50–100 message_delta events for a typical response)

event: chat_event
data: {"messageState":"COMPLETED","chatResponse":{"text":"I found 8 sea-facing..."}}

event: connection_close
data: {"reason":"response_complete"}`;

const CODE_STREAM_CHAT = `async function* streamChat(message, conversationId, token) {
  const response = await fetch('/api/v1/chat/send-message-streamed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`,   // ← impossible with EventSource
    },
    body: JSON.stringify({ message, conversation_id: conversationId }),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('AUTH_EXPIRED');
    throw new Error(\`HTTP_\${response.status}\`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEvent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    // { stream: true } handles multi-byte UTF-8 characters split across TCP chunks
    // (e.g., emoji 🏠 or Japanese 「六本木」 split across two read() calls).
    // TextDecoder buffers the partial sequence and emits the complete char on next call.
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\\n');
    buffer = lines.pop() ?? '';    // keep incomplete last line
    for (const line of lines) {
      if (line.startsWith('event: ')) currentEvent = line.slice(7).trim();
      else if (line.startsWith('data: ')) {
        try {
          yield { type: currentEvent, ...JSON.parse(line.slice(6)) };
        } catch (parseErr) {
          // Partial frame from server crash or proxy timeout — log and continue,
          // do NOT rethrow (would kill the entire stream for one bad frame)
          console.warn('SSE parse error, skipping frame:', line, parseErr);
        }
        currentEvent = '';
      }
    }
  }
}`;

const CODE_STREAMING_TEXT = `// BAD: re-renders every token
const [text, setText] = useState('');
// setText(prev => prev + chunk) on each message_delta

// GOOD: buffer in ref, sync to DOM once per animation frame (≤60fps)
function StreamingText({ isStreaming }) {
  const [displayText, setDisplayText] = useState('');
  const bufferRef = useRef('');
  const rafRef = useRef(0);

  const appendChunk = useCallback((chunk) => {
    bufferRef.current += chunk;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setDisplayText(bufferRef.current);   // one state update per frame
    });
  }, []);

  // Cleanup on unmount — cancel pending animation frame so setDisplayText
  // doesn't fire on an unmounted component and bufferRef doesn't grow forever
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div>
      <span>{displayText}</span>
      {isStreaming && <span className="cursor" />}
    </div>
  );
}`;

const CODE_STATE_MACHINE = `// Valid states only:
// idle → connecting → streaming → complete
//                   → error → idle

function useChatStream(conversationId, token) {
  const [state, setState] = useState('idle');
  const [carouselItems, setCarouselItems] = useState(null);
  const appendChunk = useStreamingText();

  async function send(message) {
    setState('connecting');
    setCarouselItems(null);
    // Sliding window: reset on EVERY event, not just the first.
    // If the server hangs mid-stream (pipeline stalls at node 5), this catches it.
    // Without sliding: clearTimeout fires on frame 1, then nothing protects against hang.
    let timeout = setTimeout(() => setState('error'), 30_000);  // 30s per-event timeout
    try {
      for await (const event of streamChat(message, conversationId, token)) {
        clearTimeout(timeout);
        timeout = setTimeout(() => setState('error'), 30_000);  // reset on each frame
        setState('streaming');
        if (event.type === 'chat_event') {
          if (event.chatResponse?.type === 'property_carousel')
            setCarouselItems(event.chatResponse.properties);
          if (event.chatResponse?.messageState === 'COMPLETED')
            setState('complete');
        }
        if (event.type === 'message_delta') appendChunk(event.content?.text ?? '');
        if (event.type === 'connection_close') { setState('complete'); break; }
      }
    } catch (err) {
      clearTimeout(timeout);
      setState(err.message === 'AUTH_EXPIRED' ? 'auth_error' : 'error');
    }
  }
  return { state, send, carouselItems };
}`;

const CODE_COMPONENT_TREE = `// Map SSE frame types to UI components
<ConversationView>
  {turns.map(turn => (
    <Turn key={turn.id}>
      <UserBubble text={turn.userMessage} />
      {/* chat_event (carousel) arrives BEFORE message_delta starts */}
      {turn.carouselItems && <PropertyCarousel items={turn.carouselItems} />}
      <AssistantBubble
        text={turn.text}
        isStreaming={turn.id === activeTurnId && state === 'streaming'}
      />
    </Turn>
  ))}
  <InputBar
    disabled={state === 'connecting' || state === 'streaming'}
    placeholder={state === 'connecting' ? 'Connecting...' :
                 state === 'streaming'  ? 'AI is responding...' : 'Ask anything...'}
    onSubmit={send}
  />
</ConversationView>`;

const CODE_PIPELINE_STEPS = `const NODE_MESSAGES = {
  safety:     'Checking your message...',
  classify:   'Understanding your request...',
  fetch_data: 'Searching properties...',
  llm:        'Writing response...',
};

// In your streaming loop — show meaningful status instead of a spinner
// NODE_MESSAGES only covers 4 of 19 nodes — add a fallback so new nodes
// added server-side don't silently show nothing (or use server-sent status strings)
if (event.type === 'pipeline_step') {
  setStatus(NODE_MESSAGES[event.node] ?? event.status_text ?? 'Processing...');
}
// Better long-term: have the server include status_text in the pipeline_step payload,
// making this map unnecessary and keeping FE/BE in sync automatically.`;

export function Mod17() {
  return (
    <>
      <div className="callout callout-info"><strong>Who this is for</strong>Frontend engineers who will own the browser side of an AI agent. For backend-only engineers, this module is optional. For FE engineers, this is the half of the system this course doesn't cover elsewhere.</div>

      <SSEComparisonViz />

      <h2>10.1 The Complete SSE Frame Anatomy</h2>
      <SSEFrameAnatomyViz />
      <p>Every pipeline node completion, every text token, every carousel is an SSE frame. Here is what the server sends over the wire for a single turn:</p>
      <CodeBlock title="SSE Wire Protocol — Full Turn Frame Sequence" language="text" keyLine={5} keyNote="carousel arrives before text streaming begins">{CODE_SSE_FRAMES}</CodeBlock>
      <div className="callout callout-tip"><strong>Order is guaranteed and semantic</strong>pipeline_steps → chat_event (carousel, BEFORE text) → message_delta×N → chat_event(COMPLETED) → connection_close. The carousel appears before text starts streaming — <code>respond_node</code> runs before <code>llm_node</code>.</div>
      <div className="callout callout-warn"><strong>Mobile reconnection and Last-Event-ID</strong>
      Order is only guaranteed on an uninterrupted HTTP/1.1 connection. On mobile networks that drop mid-stream, the browser's <code>EventSource</code> API will retry using the <code>Last-Event-ID</code> header — but only if your frames include an <code>id:</code> field. The <code>fetch()+ReadableStream</code> pattern used here does NOT auto-retry. You have two options:
      <ol style={{margin: "4px 0"}}>
        <li><strong>Server-side event IDs + client-side replay:</strong> Add <code>id: {"{turn_id}-{frame_index}"}&#92;n</code> to every frame. On reconnect, client resends the request with <code>Last-Event-ID</code> header; server replays frames from that index (stored in Redis for the session). Complex to implement correctly.</li>
        <li><strong>Simpler: re-send the whole message on network error.</strong> Detect <code>reader.read()</code> throwing (connection drop), reset state to <code>idle</code>, show "Connection interrupted — tap to retry" and let the user re-send. The session is in Redis so context is preserved. This is what most production chat UIs do.</li>
      </ol>
      The frames above do NOT include <code>id:</code> fields — they rely on option 2 (user re-send) for interrupted streams.
      </div>

      <h2>10.2 Consuming SSE in the Browser — The Right Way</h2>
      <p><code>EventSource</code> (the W3C SSE API) only supports GET requests and no custom headers — useless for authenticated POST-based chat. Use <code>fetch()</code> with <code>ReadableStream</code>:</p>
      <CodeBlock title="SSE Client — fetch + ReadableStream (Authenticated POST)" language="typescript" keyLine={11} keyNote="fetch allows auth headers; EventSource does not">{CODE_STREAM_CHAT}</CodeBlock>

      <h2>10.3 Streaming Text Without Jank</h2>
      <p>Appending each token chunk to React state triggers a re-render per token (50–100/second). On low-end devices this is visible jank.</p>
      <CodeBlock title="Streaming Text — rAF Buffer to Prevent Re-render Jank" language="typescript" keyLine={7} keyNote="One state update per animation frame, not per token">{CODE_STREAMING_TEXT}</CodeBlock>

      <h2>10.4 Connection State Machine</h2>
      <p>Model stream state explicitly — boolean flags compose badly and produce impossible states like <code>(connecting=true, complete=true)</code>.</p>
      <CodeBlock title="Connection State Machine — Explicit States, No Boolean Flags" language="typescript" keyLine={10} keyNote="Sliding window timeout resets on every frame, not just first">{CODE_STATE_MACHINE}</CodeBlock>

      <h2>10.5 React Component Architecture</h2>
      <svg width="520" height="280" viewBox="0 0 520 280" style={{display: "block", margin: "12px auto", fontFamily: "'Courier New',monospace"}}>
        <rect width="520" height="280" rx="6" fill="#1e1e2e"/>
        <text x="260" y="20" textAnchor="middle" fill="#cdd6f4" fontSize="11" fontWeight="bold">React Component Tree — Chatbot UI</text>
        {/* Root: ConversationView */}
        <rect x="170" y="32" width="180" height="28" rx="4" fill="#313244" stroke="#89b4fa" strokeWidth="2"/>
        <text x="260" y="51" textAnchor="middle" fill="#89b4fa" fontSize="10" fontWeight="bold">ConversationView</text>
        {/* edge down to Turn */}
        <line x1="260" y1="60" x2="260" y2="78" stroke="#585b70" strokeWidth="1.5"/>
        {/* Turn (repeats for each message) */}
        <rect x="190" y="78" width="140" height="28" rx="4" fill="#313244" stroke="#a6e3a1" strokeWidth="1.5"/>
        <text x="260" y="97" textAnchor="middle" fill="#a6e3a1" fontSize="10" fontWeight="bold">Turn  ×N</text>
        {/* edges from Turn to 4 children */}
        {/* UserBubble at left */}
        <line x1="230" y1="106" x2="80" y2="140" stroke="#585b70" strokeWidth="1"/>
        {/* PropertyCarousel */}
        <line x1="245" y1="106" x2="190" y2="140" stroke="#585b70" strokeWidth="1"/>
        {/* AssistantBubble */}
        <line x1="275" y1="106" x2="330" y2="140" stroke="#585b70" strokeWidth="1"/>
        {/* UserBubble */}
        <rect x="18" y="140" width="124" height="28" rx="4" fill="#313244" stroke="#fab387" strokeWidth="1.5"/>
        <text x="80" y="154" textAnchor="middle" fill="#fab387" fontSize="9" fontWeight="bold">UserBubble</text>
        <text x="80" y="165" textAnchor="middle" fill="#a6adc8" fontSize="7">text={"{turn.userMessage}"}</text>
        {/* PropertyCarousel */}
        <rect x="152" y="140" width="130" height="28" rx="4" fill="#313244" stroke="#cba6f7" strokeWidth="1.5"/>
        <text x="217" y="154" textAnchor="middle" fill="#cba6f7" fontSize="9" fontWeight="bold">PropertyCarousel</text>
        <text x="217" y="165" textAnchor="middle" fill="#a6adc8" fontSize="7">arrives BEFORE text streams</text>
        {/* AssistantBubble */}
        <rect x="294" y="140" width="135" height="28" rx="4" fill="#313244" stroke="#f9e2af" strokeWidth="1.5"/>
        <text x="362" y="154" textAnchor="middle" fill="#f9e2af" fontSize="9" fontWeight="bold">AssistantBubble</text>
        <text x="362" y="165" textAnchor="middle" fill="#a6adc8" fontSize="7">text + isStreaming</text>
        {/* StreamingText under AssistantBubble */}
        <line x1="362" y1="168" x2="362" y2="194" stroke="#585b70" strokeWidth="1"/>
        <rect x="300" y="194" width="122" height="28" rx="4" fill="#313244" stroke="#f38ba8" strokeWidth="1.5"/>
        <text x="361" y="208" textAnchor="middle" fill="#f38ba8" fontSize="9" fontWeight="bold">StreamingText</text>
        <text x="361" y="219" textAnchor="middle" fill="#a6adc8" fontSize="7">cursor blink when streaming</text>
        {/* InputBar sibling of Turn */}
        <line x1="260" y1="60" x2="470" y2="78" stroke="#585b70" strokeWidth="1"/>
        <rect x="400" y="78" width="110" height="28" rx="4" fill="#313244" stroke="#89dceb" strokeWidth="1.5"/>
        <text x="455" y="92" textAnchor="middle" fill="#89dceb" fontSize="9" fontWeight="bold">InputBar</text>
        <text x="455" y="103" textAnchor="middle" fill="#a6adc8" fontSize="7">disabled when streaming</text>
        {/* SSE event annotations */}
        <text x="20" y="240" fill="#6c7086" fontSize="8">SSE events → components:</text>
        <rect x="20" y="248" width="8" height="8" fill="#cba6f7" fillOpacity="0.4"/>
        <text x="32" y="256" fill="#a6adc8" fontSize="8">chat_event → PropertyCarousel</text>
        <rect x="200" y="248" width="8" height="8" fill="#f38ba8" fillOpacity="0.4"/>
        <text x="212" y="256" fill="#a6adc8" fontSize="8">message_delta → StreamingText</text>
        <rect x="390" y="248" width="8" height="8" fill="#a6e3a1" fillOpacity="0.4"/>
        <text x="402" y="256" fill="#a6adc8" fontSize="8">pipeline_step → status</text>
        <text x="260" y="272" textAnchor="middle" fill="#a6adc8" fontSize="8">carousel populates while text="" — progressive loading by design</text>
      </svg>
      <CodeBlock title="React Component Tree — SSE Frame to UI Mapping" language="typescript" keyLine={5} keyNote="Carousel renders before text streams — progressive loading">{CODE_COMPONENT_TREE}</CodeBlock>
      <div className="callout callout-tip"><strong>Progressive loading built-in</strong>The carousel appears while text is still streaming. This is intentional — <code>respond_node</code> emits the carousel <em>before</em> <code>llm_node</code> starts. Design your component to handle <code>carouselItems</code> being populated with <code>text=""</code>.</div>

      <h2>10.6 Pipeline Steps as Loading State</h2>
      <CodeBlock title="Pipeline Steps as Loading State — Node Messages Map" language="typescript" keyLine={12} keyNote="Fallback to server status_text keeps FE/BE in sync">{CODE_PIPELINE_STEPS}</CodeBlock>

      <h2>10.7 Python ↔ JavaScript/TypeScript Reference Card</h2>
      <table>
        <tr><th>Concept</th><th>JavaScript / TypeScript</th><th>Python</th></tr>
        <tr><td>Async function</td><td><code>async function foo(): Promise&lt;T&gt;</code></td><td><code>async def foo() -&gt; T:</code></td></tr>
        <tr><td>Type shape</td><td><code>interface BotState {"{ raw_message: string }"}</code></td><td><code>class BotState(TypedDict): raw_message: str</code></td></tr>
        <tr><td>Runtime validation</td><td><code>z.object({"{...}"}).parse(data)</code> (Zod)</td><td><code>BotState(**data)</code> (Pydantic)</td></tr>
        <tr><td>Interface / protocol</td><td><code>interface Port {"{ method(): Promise<R> }"}</code></td><td><code>class Port(Protocol): async def method() -&gt; R: ...</code></td></tr>
        <tr><td>Partial application</td><td><code>(x) =&gt; fn(fixedArg, x)</code></td><td><code>functools.partial(fn, fixedArg)</code></td></tr>
        <tr><td>Fire-and-forget</td><td><code>Promise.resolve().then(fn)</code> — microtask, always runs even if outer throws</td><td><code>asyncio.create_task(fn())</code> — task lives as long as event loop (NOT tied to request). Distinct from <code>FastAPI BackgroundTasks</code> which run after response but are tied to server lifecycle. For durability, use Kafka.</td></tr>
        <tr><td>Message bus</td><td><code>ReadableStream</code> with controller</td><td><code>asyncio.Queue</code></td></tr>
        <tr><td>SSE emit (server)</td><td><code>res.write('data: ...\\n\\n')</code></td><td><code>yield f'data: {"{json.dumps(d)}"}\\n\\n'</code></td></tr>
        <tr><td>SSE consume (client)</td><td><code>fetch() + ReadableStream reader</code></td><td><code>EventSource or httpx async</code></td></tr>
        <tr><td>Structured logging</td><td><code>logger.info({"{ event, ...fields }"})</code></td><td><code>log.info("event", **fields)</code></td></tr>
        <tr><td>DI / middleware</td><td><code>app.use(fn)</code> / NestJS <code>@Injectable</code></td><td>FastAPI <code>Depends(fn)</code></td></tr>
        <tr><td>Background task</td><td><code>setTimeout(fn, 0)</code></td><td><code>asyncio.create_task(fn())</code></td></tr>
      </table>
      <svg width="540" height="270" viewBox="0 0 540 270" style={{display: "block", margin: "12px auto", fontFamily: "'Courier New',monospace"}}>
        <rect width="540" height="270" rx="6" fill="#1e1e2e"/>
        <text x="270" y="19" textAnchor="middle" fill="#cdd6f4" fontSize="11" fontWeight="bold">Async Execution Contexts — FastAPI + LangGraph Pipeline</text>
        {/* Swimlane 1: HTTP Request coroutine */}
        <rect x="10" y="28" width="520" height="70" rx="4" fill="#313244" opacity="0.5"/>
        <text x="18" y="42" fill="#89b4fa" fontSize="9" fontWeight="bold">HTTP Request Coroutine  (FastAPI async generator)</text>
        {/* POST /chat box */}
        <rect x="20" y="48" width="90" height="28" rx="3" fill="#89b4fa" fillOpacity="0.3" stroke="#89b4fa" strokeWidth="1.5"/>
        <text x="65" y="65" textAnchor="middle" fill="#89b4fa" fontSize="8">POST /chat</text>
        {/* arrow */}
        <line x1="110" y1="62" x2="135" y2="62" stroke="#585b70" strokeWidth="1.5"/>
        {/* create_task box */}
        <rect x="135" y="48" width="110" height="28" rx="3" fill="#89b4fa" fillOpacity="0.3" stroke="#89b4fa" strokeWidth="1.5"/>
        <text x="190" y="62" textAnchor="middle" fill="#89b4fa" fontSize="8">create_task(pipeline)</text>
        <text x="190" y="73" textAnchor="middle" fill="#6c7086" fontSize="7">returns immediately</text>
        {/* arrow */}
        <line x1="245" y1="62" x2="270" y2="62" stroke="#585b70" strokeWidth="1.5"/>
        {/* await queue.get box */}
        <rect x="270" y="48" width="110" height="28" rx="3" fill="#89b4fa" fillOpacity="0.3" stroke="#89b4fa" strokeWidth="1.5"/>
        <text x="325" y="62" textAnchor="middle" fill="#89b4fa" fontSize="8">await queue.get()</text>
        <text x="325" y="73" textAnchor="middle" fill="#6c7086" fontSize="7">suspends, yields to loop</text>
        {/* arrow */}
        <line x1="380" y1="62" x2="405" y2="62" stroke="#585b70" strokeWidth="1.5"/>
        {/* SSE yield box */}
        <rect x="405" y="48" width="100" height="28" rx="3" fill="#89b4fa" fillOpacity="0.3" stroke="#89b4fa" strokeWidth="1.5"/>
        <text x="455" y="62" textAnchor="middle" fill="#89b4fa" fontSize="8">yield SSE frame</text>
        <text x="455" y="73" textAnchor="middle" fill="#6c7086" fontSize="7">→ browser receives</text>
        {/* Swimlane 2: Pipeline task coroutine */}
        <rect x="10" y="108" width="520" height="70" rx="4" fill="#313244" opacity="0.5"/>
        <text x="18" y="122" fill="#a6e3a1" fontSize="9" fontWeight="bold">Pipeline Task  (asyncio.create_task — concurrent)</text>
        {/* node 1 */}
        <rect x="20" y="128" width="80" height="28" rx="3" fill="#a6e3a1" fillOpacity="0.3" stroke="#a6e3a1" strokeWidth="1.5"/>
        <text x="60" y="145" textAnchor="middle" fill="#a6e3a1" fontSize="8">classify_node</text>
        {/* arrow */}
        <line x1="100" y1="142" x2="118" y2="142" stroke="#585b70" strokeWidth="1.5"/>
        {/* put_nowait */}
        <rect x="118" y="128" width="100" height="28" rx="3" fill="#f9e2af" fillOpacity="0.3" stroke="#f9e2af" strokeWidth="1.5"/>
        <text x="168" y="142" textAnchor="middle" fill="#f9e2af" fontSize="8">put_nowait(frame)</text>
        <text x="168" y="153" textAnchor="middle" fill="#6c7086" fontSize="7">sync-safe, non-blocking</text>
        {/* arrow */}
        <line x1="218" y1="142" x2="238" y2="142" stroke="#585b70" strokeWidth="1.5"/>
        {/* more nodes */}
        <rect x="238" y="128" width="80" height="28" rx="3" fill="#a6e3a1" fillOpacity="0.3" stroke="#a6e3a1" strokeWidth="1.5"/>
        <text x="278" y="142" textAnchor="middle" fill="#a6e3a1" fontSize="8">fetch_node</text>
        {/* arrow */}
        <line x1="318" y1="142" x2="336" y2="142" stroke="#585b70" strokeWidth="1.5"/>
        <rect x="336" y="128" width="80" height="28" rx="3" fill="#f9e2af" fillOpacity="0.3" stroke="#f9e2af" strokeWidth="1.5"/>
        <text x="376" y="142" textAnchor="middle" fill="#f9e2af" fontSize="8">put_nowait(frame)</text>
        {/* arrow */}
        <line x1="416" y1="142" x2="434" y2="142" stroke="#585b70" strokeWidth="1.5"/>
        <rect x="434" y="128" width="80" height="28" rx="3" fill="#a6e3a1" fillOpacity="0.3" stroke="#a6e3a1" strokeWidth="1.5"/>
        <text x="474" y="142" textAnchor="middle" fill="#a6e3a1" fontSize="8">llm_node…</text>
        {/* asyncio.Queue box in middle */}
        <rect x="170" y="193" width="200" height="32" rx="4" fill="#313244" stroke="#cba6f7" strokeWidth="2"/>
        <text x="270" y="209" textAnchor="middle" fill="#cba6f7" fontSize="10" fontWeight="bold">asyncio.Queue</text>
        <text x="270" y="222" textAnchor="middle" fill="#a6adc8" fontSize="8">thread-safe bridge between both coroutines</text>
        {/* arrows from pipeline → queue */}
        <line x1="168" y1="156" x2="230" y2="193" stroke="#f9e2af" strokeWidth="1.5" strokeDasharray="4,2"/>
        <line x1="376" y1="156" x2="310" y2="193" stroke="#f9e2af" strokeWidth="1.5" strokeDasharray="4,2"/>
        {/* arrow from queue → HTTP coroutine */}
        <line x1="270" y1="193" x2="325" y2="76" stroke="#89b4fa" strokeWidth="1.5" strokeDasharray="4,2"/>
        <text x="345" y="140" fill="#89b4fa" fontSize="8">queue.get()</text>
        <text x="345" y="151" fill="#6c7086" fontSize="7">wakes HTTP coroutine</text>
        {/* bottom note */}
        <text x="270" y="250" textAnchor="middle" fill="#a6adc8" fontSize="8">put_nowait = synchronous push (never blocks pipeline). await queue.get() = async pull (yields to event loop).</text>
        <text x="270" y="263" textAnchor="middle" fill="#6c7086" fontSize="8">Both run in the same event loop thread — no threads, no locks needed.</text>
      </svg>

      <QuizSection moduleId={10} title="Track B: Frontend Integration" contentHint="SSE frame anatomy, fetch+ReadableStream pattern, streaming text rendering, connection state machine, React architecture, Python-JS equivalents" />
    </>
  );
}
