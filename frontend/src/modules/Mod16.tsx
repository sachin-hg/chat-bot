import { useState } from 'react';
import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from '../components/CodeBlock';

function TokenExplorer() {
  const [text, setText] = useState("The quick brown fox jumps over the lazy dog");

  const tokenColors = [
    { border: '#89b4fa', color: '#89b4fa' },
    { border: '#a6e3a1', color: '#a6e3a1' },
    { border: '#f9e2af', color: '#f9e2af' },
    { border: '#f38ba8', color: '#f38ba8' },
    { border: '#94e2d5', color: '#94e2d5' },
    { border: '#cba6f7', color: '#cba6f7' },
    { border: '#fab387', color: '#fab387' },
  ];

  const tokenize = (input: string): string[] => {
    if (!input.trim()) return [];
    const parts: string[] = [];
    const regex = /[a-zA-Z0-9']+|[^\s\w]/g;
    let match;
    while ((match = regex.exec(input)) !== null) {
      parts.push(match[0]);
    }
    return parts;
  };

  const tokens = tokenize(text);
  const cost = (tokens.length * 0.00003).toFixed(5);

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>TOKENIZATION EXPLORER — Type to see how text becomes tokens</div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
        style={{width:'100%',background:'#1e1e2e',border:'1px solid #313244',borderRadius:'6px',color:'#cdd6f4',padding:'8px',fontFamily:'monospace',fontSize:'0.85rem',boxSizing:'border-box',resize:'vertical'}}
      />
      <div style={{marginTop:'12px',marginBottom:'6px',fontSize:'0.78rem',color:'#6c7086',fontWeight:600}}>Tokens</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:'4px',alignItems:'flex-end',minHeight:'48px'}}>
        {tokens.map((tok, i) => {
          const c = tokenColors[i % tokenColors.length];
          return (
            <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}>
              <span style={{display:'inline-block',padding:'1px 7px',borderRadius:'4px',fontFamily:'monospace',fontSize:'0.82rem',border:`1px solid ${c.border}`,background:'#313244',color:c.color}}>
                {tok}
              </span>
              <span style={{fontFamily:'monospace',fontSize:'0.65rem',color:'#6c7086'}}>{1000 + i}</span>
            </div>
          );
        })}
        {tokens.length === 0 && <span style={{color:'#6c7086',fontSize:'0.8rem'}}>Type something above…</span>}
      </div>
      <div style={{marginTop:'12px',fontSize:'0.8rem',color:'#bac2de'}}>
        <span style={{color:'#cdd6f4',fontWeight:600}}>Token count: {tokens.length}</span>
        {' | '}
        <span>Estimated cost: <span style={{color:'#a6e3a1',fontFamily:'monospace'}}>${cost}</span> (GPT-4 input)</span>
      </div>
    </div>
  );
}

function TemperatureViz() {
  const [sliderVal, setSliderVal] = useState(100);
  const temp = sliderVal / 100;

  const tokens = ["house", "apartment", "property", "flat", "building"];
  const logits = [3.8, 2.9, 2.4, 1.8, 1.2];
  const barColors = ['#89b4fa', '#a6e3a1', '#f9e2af', '#f38ba8', '#94e2d5'];

  const safeTemp = Math.max(temp, 0.01);
  const scaled = logits.map(l => l / safeTemp);
  const maxScaled = Math.max(...scaled);
  const exps = scaled.map(s => Math.exp(s - maxScaled));
  const sum = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map(e => e / sum);

  const label = temp <= 0.3 ? 'DETERMINISTIC' : temp <= 1.2 ? 'BALANCED' : 'CREATIVE / RANDOM';
  const labelColor = temp <= 0.3 ? '#f38ba8' : temp <= 1.2 ? '#a6e3a1' : '#cba6f7';

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>TEMPERATURE EFFECT ON NEXT-TOKEN PROBABILITIES</div>
      <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'16px',flexWrap:'wrap'}}>
        <label style={{fontSize:'0.85rem',color:'#cdd6f4',whiteSpace:'nowrap'}}>
          Temperature: <span style={{color:labelColor,fontWeight:700,fontFamily:'monospace'}}>{temp.toFixed(2)}</span>
        </label>
        <input
          type="range" min={1} max={200} value={sliderVal}
          onChange={e => setSliderVal(Number(e.target.value))}
          style={{flex:1,minWidth:'120px',accentColor:'#89b4fa'}}
        />
        <span style={{fontSize:'0.75rem',fontWeight:700,color:labelColor,letterSpacing:'0.06em',whiteSpace:'nowrap'}}>{label}</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {tokens.map((tok, i) => (
          <div key={tok} style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:'80px',textAlign:'right',fontFamily:'monospace',fontSize:'0.82rem',color:'#bac2de',flexShrink:0}}>{tok}</div>
            <div style={{flex:1,height:'14px',background:'#313244',borderRadius:'3px',overflow:'hidden'}}>
              <div style={{height:'100%',width:`${(probs[i]*100).toFixed(1)}%`,background:barColors[i],borderRadius:'3px',transition:'width 0.3s'}} />
            </div>
            <div style={{width:'44px',textAlign:'right',fontFamily:'monospace',fontSize:'0.78rem',color:barColors[i],flexShrink:0}}>{(probs[i]*100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:'12px',fontSize:'0.75rem',color:'#6c7086'}}>
        Next-token candidates after "Looking for a ___". Drag slider to see how temperature reshapes the distribution.
      </div>
    </div>
  );
}

export function Mod16() {
  const code162 = `"show me 3BHK in Bandra under 2Cr"
→ ["show", " me", " 3", "BH", "K", " in", " Band", "ra", " under", " 2", "Cr"]
→ 11 tokens

# Rule of thumb (OpenAI estimate): 1 token ≈ 4 chars ≈ 0.75 English words
# A 1,000-word document ≈ 1,300 tokens
# Claude uses a different tokenizer — counts differ slightly; use
# anthropic.tokenizer.count_tokens() for exact Claude token counts`;

  const code162cache = `# build_prompt_node — correct cache structure
system_message = {
    "role": "system",
    "content": [
        {
            "type": "text",
            "text": STATIC_RULES_AND_TAXONOMY,  # never changes
            "cache_control": {"type": "ephemeral"}  # mark cache breakpoint here
        },
        {
            "type": "text",
            "text": f"Active filters: {filters}\\nResults: {search_results}"  # dynamic, NOT cached
        }
    ]
}`;

  const code163 = `# What build_prompt_node assembles and llm_node sends
messages = [
    {
        "role": "system",
        "content": """You are a housing assistant.
Active filters: city=Mumbai, bhk=2.
Search results (real API data, fetched this request):
[{"id":"abc","title":"Sea View 2BHK Bandra","price":19500000}]
Rules: Only reference properties from the above results."""
        # ↑ Static instructions + injected real data
        # ↑ Cached by Anthropic → 90% cost reduction on repeated calls
    },
    {"role": "user",      "content": "show me the sea-facing ones"},   # current message
    {"role": "assistant", "content": "I found 3 sea-facing options..."}, # previous turn
    {"role": "user",      "content": "tell me more about the first one"} # ← current
]`;

  const code165 = `# Without grounding — LLM invents property data
system = "You are a housing assistant."
user   = "show me 2BHK near the sea in Bandra"
# LLM: "I found Sunshine Residency (₹1.8Cr) near Bandstand..."  ← INVENTED

# With grounding — LLM works with real API results
system = f"""You are a housing assistant.
Search results from Housing.com API:
{json.dumps(real_api_results)}"""
user   = "show me 2BHK near the sea in Bandra"
# LLM: "I found 6 sea-facing 2BHK properties. Godrej Two by Sea
#        in Bandra West is listed at ₹1.95Cr..."  ← REAL LISTING`;

  const code166 = `# System prompt ordered for maximum cache hit
"""
[CACHED — stable across all calls]
You are a housing assistant. Rules: ...
Taxonomy: property_search intents are ...
Available tools: searchProperties, getLocalityDetail, ...

[NOT CACHED — changes every turn]
Current search results: [{"id":"abc",...}]
Active filters: {"city": "Mumbai", "bhk": 2}
"""
# First call: pay full price for all tokens
# All subsequent calls with same prefix: pay ~10% for cached portion
# At 1M DAU with 2,000-token stable prefix → saves ~$180/day (Haiku prices)`;

  return (
    <>
      <div className="callout callout-info"><strong>Who this is for</strong>Engineers who are new to working with LLMs. If you've already built something with the Anthropic or OpenAI API, skim for gaps and continue to Module 3.</div>

      <h2>2.1 What a Language Model Actually Does</h2>
      <p>An LLM is a <strong>next-token predictor</strong>. It takes a sequence of tokens as input, outputs a probability distribution over the next token, picks from that distribution, appends the result, and repeats until it decides to stop.</p>
      <p>There's no fact database, no reasoning engine, no lookup table. The model learned statistical patterns from a huge text corpus during training. When it "knows" something, it means that pattern appeared frequently enough in training to dominate the probability at inference time.</p>
      <div className="callout callout-info"><strong>What training actually is</strong> During training, the model reads billions of text examples and is repeatedly asked to predict the next token in each sequence. When it's wrong, its internal weights (billions of floating-point numbers) are nudged slightly — making the correct token a bit more probable next time. After trillions of such nudges across months of GPU compute, those weights encode which tokens tend to follow which patterns. <strong>You never modify these weights at inference time</strong> — you only add context to the window and ask the model to continue the pattern. This is why injecting real data into the prompt works: it changes what the model "sees," not what it knows.</div>
      <div className="callout callout-warn"><strong>Why this matters for engineering</strong>The LLM cannot retrieve real data. It can only work with what's in its context window. <strong>Hallucination</strong> is not a bug — it's next-token prediction generating the most-probable token when the correct answer isn't grounded in the context. <strong>Grounding</strong> = injecting real data before asking the model to respond. This is the entire purpose of <code>fetch_data_node → build_prompt_node → llm_node</code>.</div>

      <TokenExplorer />
      <div className="callout callout-warn">
        <strong>Simplified illustration — not real BPE.</strong> This explorer splits on word boundaries using a regex. Real BPE is <em>learned</em> from the training corpus: "3BHK" might tokenise as ["3", "BH", "K"]; "Mumbai" as ["Mum", "bai"]. Hindi and source code tokenise 2–5× more tokens per character than English prose, so token counts from this explorer are indicative only. See Module 3 (LLM Internals) §21.2 for the real BPE step-through with merge rules.
      </div>

      <h2>2.2 Tokens — Your Cost and Speed Unit</h2>
      <p>Models process <strong>tokens</strong> (subword units), not characters or words.</p>
      <CodeBlock title="Tokenization — Cost and Speed Unit" language="python" keyLine={4} keyNote="1 token ≈ 4 chars — the billing unit">{code162}</CodeBlock>
      <table>
        <tbody>
          <tr><th>Impact</th><th>Detail</th></tr>
          <tr><td>Cost</td><td>Anthropic charges per input token + per output token. Your system prompt is paid for on every call.</td></tr>
          <tr><td>Latency</td><td>Output tokens are generated sequentially. 500 output tokens takes ~5× longer than 100.</td></tr>
          <tr><td>Context window</td><td>Max tokens the model can "see": system prompt + history + data + response. Claude Haiku: 200K tokens.</td></tr>
          <tr><td>Caching</td><td>Anthropic prompt caching: stable prefix costs ~10% of normal input price after first call. <strong>Not automatic</strong> — you must mark the breakpoint (see callout below).</td></tr>
        </tbody>
      </table>
      <div className="callout callout-tip"><strong>Prompt Caching — How it actually works</strong>
        <ol style={{margin: "4px 0"}}>
          <li><strong>Not automatic.</strong> You must set <code>cache_control: {"{type: \"ephemeral\"}"}</code> on the content block you want cached. Without it, every call pays full price.</li>
          <li><strong>Cache key = exact bytes.</strong> Any change — even a trailing space — produces a cache miss. Injecting a timestamp, user name, or changing active filters in the cached section breaks it every call. Structure your prompt so the stable prefix (rules, taxonomy, tool descriptions) comes first and never changes.</li>
          <li><strong>The ~10% figure</strong> means you pay approximately 10% of the normal input token price for tokens served from cache (the exact multiplier varies by model tier — check current Anthropic pricing). Output tokens are always full price; only input tokens are eligible for caching.</li>
          <li><strong>Cache TTL: 5 minutes</strong> (as of 2024). If the same prefix is not called again within 5 minutes, the cache is evicted and the next call pays full price. At high traffic this rarely matters; at low traffic (dev environments) you pay full price on every call.</li>
        </ol>
        <pre style={{fontSize: "11px", background: "#1e1e2e", color: "#cdd6f4", padding: "8px", borderRadius: "4px", marginTop: "6px"}}><code>{code162cache}</code></pre>
      </div>
      <svg width="500" height="240" viewBox="0 0 500 240" style={{display: "block", margin: "12px auto", fontFamily: "'Courier New',monospace"}}>
        <rect width="500" height="240" rx="6" fill="#1e1e2e" />
        <text x="250" y="19" textAnchor="middle" fill="#cdd6f4" fontSize="11" fontWeight="bold">API Message Structure with cache_control Blocks</text>
        {/* Bracket label on left */}
        <text x="8" y="90" fill="#a6adc8" fontSize="9" transform="rotate(-90,8,90)">messages[]</text>
        {/* SYSTEM message block */}
        <rect x="22" y="28" width="456" height="110" rx="4" fill="#313244" stroke="#89b4fa" strokeWidth="1.5" />
        <text x="32" y="43" fill="#89b4fa" fontSize="9" fontWeight="bold">role: "system"</text>
        {/* Cached sub-block */}
        <rect x="32" y="50" width="436" height="38" rx="3" fill="#1e1e2e" stroke="#a6e3a1" strokeWidth="1.5" />
        <text x="42" y="63" fill="#a6e3a1" fontSize="8">type:"text",  text: STATIC_RULES + TAXONOMY + TOOL_SCHEMAS</text>
        <text x="42" y="76" fill="#a6e3a1" fontSize="8">cache_control: {"{type: \"ephemeral\"}"}  ← cache breakpoint</text>
        <rect x="380" y="52" width="82" height="16" rx="3" fill="#a6e3a1" fillOpacity="0.2" />
        <text x="421" y="64" textAnchor="middle" fill="#a6e3a1" fontSize="8" fontWeight="bold">CACHED</text>
        {/* Non-cached sub-block */}
        <rect x="32" y="92" width="436" height="38" rx="3" fill="#1e1e2e" stroke="#f38ba8" strokeWidth="1" />
        <text x="42" y="105" fill="#f38ba8" fontSize="8">{"type:\"text\",  text: f\"Filters: {filters} | Results: {search_results}\""}</text>
        <text x="42" y="118" fill="#a6adc8" fontSize="8">← no cache_control — dynamic per request, always fresh</text>
        <rect x="380" y="94" width="82" height="16" rx="3" fill="#f38ba8" fillOpacity="0.2" />
        <text x="421" y="106" textAnchor="middle" fill="#f38ba8" fontSize="8" fontWeight="bold">DYNAMIC</text>
        {/* USER message block */}
        <rect x="22" y="147" width="456" height="34" rx="4" fill="#313244" stroke="#cba6f7" strokeWidth="1.5" />
        <text x="32" y="162" fill="#cba6f7" fontSize="9" fontWeight="bold">role: "user"</text>
        <text x="32" y="175" fill="#a6adc8" fontSize="8">content: "Show me 2BHK in Bandra under 2Cr"  ← always dynamic</text>
        {/* ASSISTANT message block */}
        <rect x="22" y="188" width="456" height="34" rx="4" fill="#313244" stroke="#f9e2af" strokeWidth="1.5" />
        <text x="32" y="203" fill="#f9e2af" fontSize="9" fontWeight="bold">role: "assistant"  (conversation history)</text>
        <text x="32" y="216" fill="#a6adc8" fontSize="8">content: prior responses — include for multi-turn; grows context window cost</text>
        {/* Legend */}
        <rect x="22" y="228" width="10" height="8" fill="#a6e3a1" fillOpacity="0.4" />
        <text x="36" y="236" fill="#a6adc8" fontSize="8">Cached (10% of normal input price)</text>
        <rect x="200" y="228" width="10" height="8" fill="#f38ba8" fillOpacity="0.4" />
        <text x="214" y="236" fill="#a6adc8" fontSize="8">Dynamic (full input price)</text>
        <text x="360" y="236" fill="#6c7086" fontSize="8">stable prefix → always first</text>
      </svg>

      <h2>2.3 The Message Format — System vs User vs Assistant</h2>
      <CodeBlock title="Message Format — System, User, Assistant Roles" language="python" keyLine={3} keyNote="Static system content gets cached; dynamic content does not">{code163}</CodeBlock>
      <div className="callout callout-tip"><strong>System prompt vs user message</strong>Put stable content first (instructions, taxonomy, tools) → gets cached. Put dynamic content last (search results, active filters) → changes every turn. <code>build_prompt_node</code> does this correctly.</div>

      <TemperatureViz />

      <h2>2.4 Temperature — Determinism vs Creativity</h2>
      <table>
        <tbody>
          <tr><th>Temperature</th><th>Behavior</th><th>Use for</th></tr>
          <tr><td>0</td><td>Always highest-probability token. Highly consistent — <em>but not byte-for-byte guaranteed</em>. GPU floating-point non-determinism, backend load balancing, and silent model updates can produce rare variations. Treat it as "maximally stable output", not "cryptographically reproducible." <strong>Do not write test assertions that check for exact LLM output strings.</strong></td><td>JSON output, classification, anything needing consistency</td></tr>
          <tr><td>0.3–0.5</td><td>Mostly high-probability, minor variation</td><td>Factual responses, summaries</td></tr>
          <tr><td>0.7–0.9</td><td>Broader sampling, noticeably varied</td><td>Conversational responses, natural prose</td></tr>
          <tr><td>&gt;1.0</td><td>Very random, often incoherent</td><td>Almost never in production</td></tr>
        </tbody>
      </table>
      <div className="callout callout-info"><strong>This codebase's choices</strong>Stage 1 SLM (domain router): temperature=0. Stage 2 SLM (classifier): temperature=0. Stage 3 LLM (generation): temperature=0.5. The pattern: structured output → 0. Natural prose → 0.5.</div>

      <h2>2.5 Hallucination and Grounding</h2>
      <CodeBlock title="Hallucination vs Grounding — Before and After" language="python" keyLine={11} keyNote="Inject real API data before asking LLM to respond">{code165}</CodeBlock>
      <p><strong>The rule:</strong> Never ask an LLM what it knows about your domain. Tell it what it needs to know, then ask it to respond.</p>

      <h2>2.6 Prompt Caching — The 80% Cost Reduction</h2>
      <CodeBlock title="Prompt Cache Structure — Stable Prefix First" language="python" keyLine={10} keyNote="Only stable prefix is cached; saves ~$180/day at 1M DAU">{code166}</CodeBlock>

      <h2>2.7 Small vs Large Models — The Decision Framework</h2>
      <div className="callout callout-tip"><strong>The framework</strong>Structured output (JSON, classification)? → Small model (Haiku), temperature=0.<br />Open-ended generation, complex reasoning? → Large model (Sonnet).<br />Always measure cost × quality on your actual data. A model that's 90% as good at 50× lower cost is almost always right.
        <br /><br /><strong>How to actually measure "90% as good":</strong>
        <ol style={{margin: "4px 0"}}>
          <li>Take your golden dataset (50–100 examples per intent from Module 5).</li>
          <li><strong>Classification tasks:</strong> run Haiku and Sonnet at temperature=0. Compare accuracy against your labels. If Haiku is within 5% accuracy, use Haiku.</li>
          <li><strong>Generation tasks (Tier 3):</strong> score 20 responses per model on: <em>accuracy</em> (only referenced real data?), <em>relevance</em> (answered the question?), <em>tone</em> (appropriate?). Use a human or a judge LLM (GPT-4, Claude Sonnet) to score 1–5 on each. Average across all three.</li>
          <li>Multiply score by cost_per_call: lower combined score wins. A 10% quality drop that saves 50× in cost is almost always worth it for a housing listing summary.</li>
        </ol>
        Link to Layer 2 testing in Module 5 for the implementation of the golden dataset eval loop.
      </div>
      <table>
        <tbody>
          <tr><th>Model tier</th><th>This codebase uses it for</th><th>Why</th></tr>
          <tr><td>Haiku (small, fast)</td><td>Domain routing, intent classification, safety Layer 2</td><td>Structured JSON, narrow task, 50× cheaper than Sonnet</td></tr>
          <tr><td>Haiku (Tier 3a)</td><td>Most response generation</td><td>Simple intents don't need complex reasoning</td></tr>
          <tr><td>Sonnet (Tier 3b)</td><td>Comparison, multi-intent, nuanced advice</td><td>Needs multi-step reasoning; quality outweighs 5× cost premium</td></tr>
        </tbody>
      </table>

      <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
        <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>RAG — GROUNDING LLM RESPONSES WITH RETRIEVED CONTEXT</div>
        <svg viewBox="0 0 640 180" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="RAG vs No-RAG pipeline comparison">
          <defs>
            <marker id="rag-arr-left" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#6c7086"/></marker>
            <marker id="rag-arr-right" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#6c7086"/></marker>
          </defs>
          {/* ── LEFT PANEL: WITHOUT RAG ── */}
          <rect x="0" y="0" width="300" height="180" rx="6" fill="#1e1e2e"/>
          <text x="150" y="20" textAnchor="middle" fill="#f38ba8" fontSize="11" fontWeight="700" letterSpacing="0.08em">WITHOUT RAG</text>
          {/* User query box */}
          <rect x="30" y="32" width="240" height="28" rx="6" fill="#313244" stroke="#45475a" strokeWidth="1"/>
          <text x="150" y="50" textAnchor="middle" fill="#cdd6f4" fontSize="11">User query</text>
          {/* Arrow down */}
          <line x1="150" y1="60" x2="150" y2="78" stroke="#6c7086" strokeWidth="1.5" markerEnd="url(#rag-arr-left)"/>
          {/* LLM box */}
          <rect x="55" y="78" width="190" height="30" rx="6" fill="#1e3a5f" stroke="#a6e3a1" strokeWidth="1.5"/>
          <text x="150" y="97" textAnchor="middle" fill="#a6e3a1" fontSize="11" fontWeight="700">LLM (training memory)</text>
          {/* Arrow down */}
          <line x1="150" y1="108" x2="150" y2="126" stroke="#6c7086" strokeWidth="1.5" markerEnd="url(#rag-arr-left)"/>
          {/* Response box */}
          <rect x="30" y="126" width="240" height="38" rx="6" fill="#313244" stroke="#f38ba8" strokeWidth="1.5"/>
          <text x="150" y="141" textAnchor="middle" fill="#cdd6f4" fontSize="11">Response</text>
          <text x="150" y="156" textAnchor="middle" fill="#f38ba8" fontSize="9.5">Knowledge cutoff: Aug 2024</text>

          {/* ── DIVIDER ── */}
          <line x1="320" y1="8" x2="320" y2="172" stroke="#313244" strokeWidth="1.5" strokeDasharray="4 3"/>

          {/* ── RIGHT PANEL: WITH RAG ── */}
          <rect x="320" y="0" width="320" height="180" rx="6" fill="#1e1e2e"/>
          <text x="480" y="20" textAnchor="middle" fill="#a6e3a1" fontSize="11" fontWeight="700" letterSpacing="0.08em">WITH RAG</text>
          {/* User query */}
          <rect x="348" y="32" width="264" height="28" rx="6" fill="#313244" stroke="#45475a" strokeWidth="1"/>
          <text x="480" y="50" textAnchor="middle" fill="#cdd6f4" fontSize="11">User query</text>
          {/* Arrow to retriever */}
          <line x1="480" y1="60" x2="480" y2="78" stroke="#6c7086" strokeWidth="1.5" markerEnd="url(#rag-arr-right)"/>
          {/* Retriever */}
          <rect x="363" y="78" width="114" height="28" rx="6" fill="#2e1a3a" stroke="#cba6f7" strokeWidth="1.5"/>
          <text x="420" y="96" textAnchor="middle" fill="#cba6f7" fontSize="11" fontWeight="700">Retriever</text>
          {/* Context docs */}
          <rect x="493" y="78" width="119" height="28" rx="6" fill="#1a2e2e" stroke="#94e2d5" strokeWidth="1.5"/>
          <text x="552" y="92" textAnchor="middle" fill="#94e2d5" fontSize="10" fontWeight="700">Context docs</text>
          <text x="552" y="103" textAnchor="middle" fill="#94e2d5" fontSize="8.5">(retrieved chunks)</text>
          {/* Arrow from retriever to docs */}
          <line x1="477" y1="92" x2="493" y2="92" stroke="#6c7086" strokeWidth="1.5" markerEnd="url(#rag-arr-right)"/>
          {/* Arrows from retriever+docs down to LLM */}
          <line x1="420" y1="106" x2="420" y2="118" stroke="#6c7086" strokeWidth="1.5"/>
          <line x1="552" y1="106" x2="552" y2="118" stroke="#6c7086" strokeWidth="1.5"/>
          <line x1="420" y1="118" x2="552" y2="118" stroke="#6c7086" strokeWidth="1.5"/>
          <line x1="480" y1="118" x2="480" y2="126" stroke="#6c7086" strokeWidth="1.5" markerEnd="url(#rag-arr-right)"/>
          {/* LLM box */}
          <rect x="375" y="126" width="210" height="28" rx="6" fill="#1e3a5f" stroke="#a6e3a1" strokeWidth="1.5"/>
          <text x="480" y="144" textAnchor="middle" fill="#a6e3a1" fontSize="11" fontWeight="700">LLM + injected context</text>
          {/* Response */}
          <rect x="348" y="158" width="264" height="18" rx="6" fill="#1a2e1a" stroke="#a6e3a1" strokeWidth="1"/>
          <text x="480" y="170" textAnchor="middle" fill="#a6e3a1" fontSize="10" fontWeight="600">Grounded response (real data)</text>
          {/* Arrow from LLM to response */}
          <line x1="480" y1="154" x2="480" y2="158" stroke="#6c7086" strokeWidth="1.5" markerEnd="url(#rag-arr-right)"/>
        </svg>
      </div>

      <h2>2.8 RAG — Retrieval-Augmented Generation</h2>
      <div className="callout callout-tip">
        <strong>One-sentence definition: RAG = give your LLM a search engine over your own documents.</strong>
        Instead of the LLM hallucinating from training memory, you first search your documents for the most relevant chunks, then inject those chunks into the prompt. The LLM answers from evidence, not memory. This is how you build AI features over private data (your product listings, internal docs, customer history) without fine-tuning.
      </div>
      <p>RAG is the most important pattern for AI features that work with private or frequently-updated data. <strong>This pipeline already implements it.</strong></p>
      <div className="diagram-wrap">
        <div className="diagram-title">Full RAG system — what's happening under the hood</div>
        <pre style={{margin: "0", border: "none", background: "transparent", fontSize: "12px"}}>{`User query: "3BHK apartments in Bandra under ₹2Cr"
    │
    ▼
[1] EMBED QUERY
    embed("3BHK apartments in Bandra under ₹2Cr")
    → 1536-dimensional vector [0.12, -0.87, 0.44, ...]
    ↑ What does 0.12 mean? Nothing on its own. Embeddings only have meaning
      relative to each other. If "apartment" and "flat" have similar vectors,
      0.12 in position 47 will be similar for both. No single number is
      interpretable — the pattern across all 1536 numbers encodes semantics.
    │
    ▼
[2] VECTOR SEARCH
    SELECT content FROM docs ORDER BY embedding <-> query_vec LIMIT 10
    → Top 10 semantically-nearest document chunks
    │
    ▼
[3] RE-RANK  (optional — rescores top-k with a cross-encoder)
    → Reordered: most-relevant first, irrelevant dropped
    │
    ▼
[4] INJECT INTO PROMPT
    "Answer using ONLY the following context:\\n" + retrieved_chunks + user_query
    │
    ▼
[5] GENERATE → grounded response`}</pre>
      </div>
      <div className="callout callout-tip">
        <strong>Where do those 1536 numbers come from?</strong>
        An embedding model (e.g. OpenAI's <code>text-embedding-3-small</code>) is a neural network trained on massive text corpora. You pass in text; it outputs a fixed-size vector. The network learned — during training — to place semantically similar texts near each other in that 1536-dimensional space. "apartment" and "flat" end up close; "apartment" and "crocodile" end up far apart.
        <br /><br />
        You never train this yourself. You call an API: <code>{"client.embeddings.create(input=\"3BHK in Bandra\", model=\"text-embedding-3-small\")"}</code> → get 1536 numbers back. Store those numbers. At query time, embed the query the same way and find stored vectors that are geometrically close (cosine similarity). Close vectors = semantically similar text.
      </div>
      <p><strong>Components:</strong> embedding model (text→vector), vector database (stores/searches), optional cross-encoder reranker, LLM (generates from grounded context).</p>

      <div className="diagram-wrap">
        <div className="diagram-title">Offline indexing pipeline — what you must build FIRST before query-time RAG works</div>
        <pre style={{margin: "0", border: "none", background: "transparent", fontSize: "12px"}}>{`Your documents (PDFs, DB rows, API results, HTML pages)
    │
    ▼  Document Loader
Load raw text — LangChain has loaders for PDF, Web, Notion, GitHub, SQL
    │
    ▼  Chunker
Split into overlapping chunks: chunk_size=512 characters (≈128 tokens), overlap=50 chars
    │
    ▼  Embedding model  (called once per chunk, at index time)
chunk_text → client.embeddings.create(input=chunk_text, model="text-embedding-3-small")
         → [0.12, -0.87, 0.44, ...]  (1536 floats per chunk)
    │
    ▼  Vector store
Store (chunk_text, embedding_vector, metadata) in pgvector / ChromaDB / Pinecone
    │
    Vector DB now contains your searchable index
    ── Updated nightly or on document change (incremental re-index)

At query time (Section 16.8 diagram above): embed query → search → inject → generate`}</pre>
      </div>
      <div className="callout callout-warn"><strong>Most RAG tutorials skip the indexing step.</strong> They start from "now you have a vector DB." You must build and maintain the indexing pipeline. Property listings updated daily? Re-index nightly. New document uploaded? Re-index that document immediately. Stale index → confident but wrong answers.</div>

      <table>
        <tbody>
          <tr><th></th><th>RAG</th><th>Fine-tuning</th><th>Zero-shot prompting</th></tr>
          <tr><td>Data changes often</td><td>✓ Best choice</td><td>✗ Re-train every update</td><td>✓ if tiny + static</td></tr>
          <tr><td>Private per-user data</td><td>✓ Retrieve at runtime</td><td>✗ Can't fine-tune per user</td><td>✗ won't fit in prompt</td></tr>
          <tr><td>Need new reasoning style</td><td>✗ Only changes knowledge</td><td>✓ Right tool</td><td>~ limited</td></tr>
          <tr><td>Time to update</td><td>Immediate re-index</td><td>Days–weeks</td><td>Minutes</td></tr>
          <tr><td>Training cost</td><td>Near zero</td><td>$200–$2,000+</td><td>Zero</td></tr>
        </tbody>
      </table>

      <h3>Naive RAG failure modes — what breaks in production</h3>
      <table>
        <tbody>
          <tr><th>Failure</th><th>Symptom</th><th>Root cause</th><th>Fix</th></tr>
          <tr><td>Chunk too large</td><td>LLM ignores middle of chunk</td><td>2,000-token chunk; answer buried at line 80</td><td>Smaller chunks (256–512 tokens)</td></tr>
          <tr><td>Chunk too small</td><td>Answer split across chunks, none complete</td><td>50-token chunks break mid-sentence</td><td>Larger chunks or parent-document retrieval</td></tr>
          <tr><td>Retrieval miss</td><td>LLM hallucinated; document existed</td><td>Query vocab ≠ document vocab</td><td>Hybrid search (BM25 + vector), query expansion</td></tr>
          <tr><td>Context overflow</td><td>Truncation or confusion</td><td>10 × 500-token chunks = 5K tokens</td><td>Max 3–5 chunks for 8K context models</td></tr>
          <tr><td>Staleness</td><td>Confident but outdated answer</td><td>Index not re-embedded after update</td><td>Incremental re-indexing on document change</td></tr>
          <tr><td>Multi-hop failure</td><td>Two-part question answered partially</td><td>Top-k returns documents independently</td><td>Iterative retrieval or Graph RAG</td></tr>
        </tbody>
      </table>

      <div className="callout callout-info"><strong>BM25 and Graph RAG — what the failure mode fixes actually mean</strong><br />
        <strong>BM25</strong> (Best Match 25) is keyword-based search — think Ctrl+F across your documents, but smarter. Vector search finds semantically similar text even with different words. BM25 finds exact keyword matches that vector search might miss (e.g., a property ID like "HOM-9873", a rare locality name, or a precise number). <strong>Hybrid search</strong> runs both and combines scores: keyword precision + semantic recall. This is the standard production approach — most teams use RRF (Reciprocal Rank Fusion) to merge the two ranked lists.<br /><br />
        <strong>Graph RAG</strong> is for documents with entity relationships: person → company → event → location. A single text chunk doesn't contain the full answer — you need to traverse the graph. Example: "Which Housing.com agents have closed deals in Bandra West with buyers from Delhi?" needs to join agents, transactions, locality, and buyer_city — a knowledge graph query, not a vector similarity search. For a straightforward property search chatbot, you don't need Graph RAG. Use it when your knowledge has network structure that a flat vector index can't capture.
      </div>

      <h3>Chunking intuition — why size dominates RAG quality</h3>
      <div className="callout callout-info">
        <strong>The Lost-in-the-Middle Problem</strong>
        LLMs anchor on the beginning and end of context. A 2,000-token chunk with the answer on line 80 will often be retrieved (it's relevant) but the answer will be missed. Right-sized chunks ensure the entire chunk is signal, not noise.
        <br /><br />
        <strong>Production rule:</strong> Start at 512 characters + 10% overlap (<code>RecursiveCharacterTextSplitter</code> default — ≈128 tokens). Tune by RAGAS scores: context relevance &lt; 0.7 → try smaller. Faithfulness &lt; 0.7 → try larger (more context per chunk reduces hallucination on partial facts).<br />
        <strong>Token-accurate splitting:</strong> To split by tokens instead of characters, pass <code>length_function=tiktoken_len</code> to <code>RecursiveCharacterTextSplitter</code>, where <code>tiktoken_len</code> counts BPE tokens. Use this when your context window budget is tight and character counts are misleading (e.g., Chinese text uses ~1 char per token; English averages ~4 chars per token).
      </div>

      <QuizSection moduleId={2} title="Track A: LLM Fundamentals" contentHint="Tokens, temperature, hallucination, grounding, prompt caching, model selection, RAG vs fine-tuning, chunking strategies, naive RAG failure modes" />
    </>
  );
}
