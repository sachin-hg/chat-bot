import { useState, useEffect, Fragment } from 'react';
import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from '../components/CodeBlock';

function StepThroughBPE() {
  const [step, setStep] = useState(0);
  const totalSteps = 5;

  const steps: { label: string; explanation: string; content: React.ReactNode }[] = [
    {
      label: "Step 0: Start — individual characters",
      explanation: "BPE begins with a character-level vocabulary. Every character is its own token. The word 'low' starts as three separate units.",
      content: (
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center'}}>
          {['l','o','w'].map((c,i) => (
            <span key={i} style={{display:'inline-block',padding:'1px 7px',borderRadius:'4px',fontFamily:'monospace',fontSize:'0.82rem',border:'1px solid #89b4fa',background:'#313244',color:'#89b4fa'}}>{c}</span>
          ))}
        </div>
      ),
    },
    {
      label: "Step 1: Most frequent pair → l + o = lo",
      explanation: "The algorithm counts all adjacent pairs across the training corpus. The pair (l, o) appears most often, so it is merged into a new token 'lo'.",
      content: (
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center'}}>
          <span style={{display:'inline-block',padding:'1px 7px',borderRadius:'4px',fontFamily:'monospace',fontSize:'0.82rem',border:'1px solid #a6e3a1',background:'#313244',color:'#a6e3a1'}}>lo</span>
          <span style={{color:'#6c7086',fontSize:'0.78rem'}}>merged from</span>
          <span style={{display:'inline-block',padding:'1px 7px',borderRadius:'4px',fontFamily:'monospace',fontSize:'0.82rem',border:'1px solid #6c7086',background:'#313244',color:'#6c7086',textDecoration:'line-through'}}>l</span>
          <span style={{color:'#6c7086',fontSize:'0.78rem'}}>+</span>
          <span style={{display:'inline-block',padding:'1px 7px',borderRadius:'4px',fontFamily:'monospace',fontSize:'0.82rem',border:'1px solid #6c7086',background:'#313244',color:'#6c7086',textDecoration:'line-through'}}>o</span>
          <span style={{color:'#6c7086',fontSize:'0.78rem',margin:'0 4px'}}>→ remaining:</span>
          <span style={{display:'inline-block',padding:'1px 7px',borderRadius:'4px',fontFamily:'monospace',fontSize:'0.82rem',border:'1px solid #89b4fa',background:'#313244',color:'#89b4fa'}}>w</span>
        </div>
      ),
    },
    {
      label: "Step 2: Most frequent pair → lo + w = low",
      explanation: "Next, (lo, w) becomes the most frequent pair and is merged into 'low'. The entire word is now a single token.",
      content: (
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center'}}>
          <span style={{display:'inline-block',padding:'1px 7px',borderRadius:'4px',fontFamily:'monospace',fontSize:'0.82rem',border:'1px solid #f9e2af',background:'#313244',color:'#f9e2af'}}>low</span>
          <span style={{color:'#a6e3a1',fontSize:'0.78rem',marginLeft:'8px'}}>One token — entire word merged</span>
        </div>
      ),
    },
    {
      label: "Step 3: Apply to 'lowest' → [low][e][s][t]",
      explanation: "The learned merge rule 'low' is applied greedily to new text. The subword 'low' is recognised, but 'est' isn't yet merged — so it stays as individual characters.",
      content: (
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center'}}>
          {[['low','#f9e2af'],['e','#89b4fa'],['s','#89b4fa'],['t','#89b4fa']].map(([tok,col],i) => (
            <span key={i} style={{display:'inline-block',padding:'1px 7px',borderRadius:'4px',fontFamily:'monospace',fontSize:'0.82rem',border:`1px solid ${col}`,background:'#313244',color:col}}>{tok}</span>
          ))}
        </div>
      ),
    },
    {
      label: "Step 4: Final vocab entry — 'low' = token ID 3421",
      explanation: "After all merges, every subword is assigned an integer ID. At inference time the tokenizer encodes text by looking up IDs, not by re-running BPE. This lookup is O(1).",
      content: (
        <div style={{display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'center'}}>
          <span style={{display:'inline-block',padding:'1px 7px',borderRadius:'4px',fontFamily:'monospace',fontSize:'0.82rem',border:'1px solid #cba6f7',background:'#313244',color:'#cba6f7'}}>low</span>
          <span style={{color:'#6c7086',fontSize:'0.85rem'}}>→</span>
          <span style={{fontFamily:'monospace',fontSize:'0.85rem',color:'#fab387'}}>token ID 3421</span>
          <span style={{color:'#6c7086',fontSize:'0.75rem',marginLeft:'8px'}}>stored in vocab.json</span>
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>BYTE PAIR ENCODING — HOW TOKENIZERS ARE TRAINED</div>
      <div style={{fontSize:'0.83rem',fontWeight:700,color:'#cdd6f4',marginBottom:'12px'}}>{current.label}</div>
      <div style={{minHeight:'40px',marginBottom:'14px'}}>{current.content}</div>
      <div style={{fontSize:'0.8rem',color:'#bac2de',marginBottom:'16px',lineHeight:'1.5'}}>{current.explanation}</div>
      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          style={{background: step === 0 ? '#1e1e2e' : '#313244',color: step === 0 ? '#45475a' : '#cdd6f4',border:'1px solid #45475a',borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor: step === 0 ? 'not-allowed' : 'pointer',marginRight:'8px'}}
        >Prev</button>
        <button
          onClick={() => setStep(s => Math.min(totalSteps - 1, s + 1))}
          disabled={step === totalSteps - 1}
          style={{background: step === totalSteps - 1 ? '#1e1e2e' : '#313244',color: step === totalSteps - 1 ? '#45475a' : '#cdd6f4',border:'1px solid #45475a',borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor: step === totalSteps - 1 ? 'not-allowed' : 'pointer',marginRight:'8px'}}
        >Next</button>
        <span style={{fontSize:'0.75rem',color:'#6c7086'}}>Step {step + 1} / {totalSteps}</span>
      </div>
    </div>
  );
}

function KVCacheViz() {
  const promptTokens = ['Show'];
  const generatedLabels = ['me', '3BHK', 'in', 'Bandra', 'under', '2Cr', '.'];
  const maxTokens = 8;

  const [count, setCount] = useState(1);
  const [newIdx, setNewIdx] = useState(-1);

  const allTokens = [promptTokens[0], ...generatedLabels.slice(0, count - 1)];

  const generate = () => {
    if (count >= maxTokens) return;
    const next = count;
    setNewIdx(next);
    setCount(c => c + 1);
    setTimeout(() => setNewIdx(-1), 600);
  };

  const reset = () => { setCount(1); setNewIdx(-1); };

  const withoutMults = count * (count + 1) / 2;
  const withMults = count;
  const saved = withoutMults - withMults;

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <style>{`@keyframes kvFadeGreen{from{background:#f9e2af33;border-color:#f9e2af}to{background:#a6e3a122;border-color:#a6e3a1}}`}</style>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>KV CACHE — REUSING COMPUTED KEY/VALUE PAIRS ACROSS TOKENS</div>
      <div style={{overflowX:'auto',marginBottom:'14px'}}>
        <div style={{display:'flex',gap:'6px',minWidth:'fit-content',paddingBottom:'4px'}}>
          {allTokens.map((tok, i) => {
            const isNew = i === newIdx;
            return (
              <div key={i} style={{display:'flex',flexDirection:'column',gap:'4px',alignItems:'center'}}>
                <div style={{fontFamily:'monospace',fontSize:'0.75rem',color:'#cdd6f4',textAlign:'center',marginBottom:'2px'}}>{tok}</div>
                <div style={{
                  width:'48px',height:'18px',borderRadius:'3px',border:`1px solid ${isNew ? '#f9e2af' : '#a6e3a1'}`,
                  background: isNew ? '#f9e2af33' : '#a6e3a122',
                  animation: isNew ? 'kvFadeGreen 0.6s ease forwards' : 'none',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:'0.65rem',color: isNew ? '#f9e2af' : '#a6e3a1'
                }}>K</div>
                <div style={{
                  width:'48px',height:'18px',borderRadius:'3px',border:`1px solid ${isNew ? '#f9e2af' : '#a6e3a1'}`,
                  background: isNew ? '#f9e2af33' : '#a6e3a122',
                  animation: isNew ? 'kvFadeGreen 0.6s ease forwards' : 'none',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:'0.65rem',color: isNew ? '#f9e2af' : '#a6e3a1'
                }}>V</div>
              </div>
            );
          })}
          {count < maxTokens && (
            <div style={{display:'flex',flexDirection:'column',gap:'4px',alignItems:'center',opacity:0.3}}>
              <div style={{fontFamily:'monospace',fontSize:'0.75rem',color:'#6c7086',textAlign:'center',marginBottom:'2px'}}>…</div>
              <div style={{width:'48px',height:'18px',borderRadius:'3px',border:'1px dashed #45475a',background:'transparent'}}/>
              <div style={{width:'48px',height:'18px',borderRadius:'3px',border:'1px dashed #45475a',background:'transparent'}}/>
            </div>
          )}
        </div>
      </div>
      <div style={{fontSize:'0.78rem',color:'#bac2de',marginBottom:'12px',background:'#1e1e2e',padding:'8px 12px',borderRadius:'6px',fontFamily:'monospace'}}>
        <div>Without cache: <span style={{color:'#f38ba8'}}>{withoutMults}</span> matrix multiplications</div>
        <div>With cache: <span style={{color:'#a6e3a1'}}>1</span> matrix multiplication{saved > 0 ? <span style={{color:'#6c7086'}}> (N={saved} saved)</span> : null}</div>
      </div>
      <div style={{display:'flex',gap:'8px'}}>
        <button
          onClick={generate}
          disabled={count >= maxTokens}
          style={{background: count >= maxTokens ? '#1e1e2e' : '#313244',color: count >= maxTokens ? '#45475a' : '#cdd6f4',border:'1px solid #45475a',borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor: count >= maxTokens ? 'not-allowed' : 'pointer',marginRight:'8px'}}
        >Generate next token</button>
        <button onClick={reset} style={{background:'#313244',color:'#cdd6f4',border:'1px solid #45475a',borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor:'pointer',marginRight:'8px'}}>Reset</button>
        <span style={{fontSize:'0.75rem',color:'#6c7086',alignSelf:'center'}}>Token {count} / {maxTokens}</span>
      </div>
    </div>
  );
}

function ContextWindowCostViz() {
  const W = 520, H = 200;
  const padL = 54, padR = 20, padT = 20, padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // x-axis points: 1K, 4K, 16K, 32K, 128K — normalized 0..1
  const xLabels = ['1K','4K','16K','32K','128K'];
  const xVals   = [1, 4, 16, 32, 128];
  const xMax = 128;

  const toX = (v: number) => padL + (v / xMax) * chartW;
  const toYQuad = (v: number) => padT + chartH - (v / (xMax * xMax)) * chartH;
  const toYLin  = (v: number) => padT + chartH - (v / xMax) * chartH;

  // Build polyline points
  const nPts = 60;
  const quadPts = Array.from({length: nPts + 1}, (_, i) => {
    const v = (i / nPts) * xMax;
    return `${toX(v)},${toYQuad(v * v)}`;
  }).join(' ');
  const linPts = Array.from({length: 2}, (_, i) => {
    const v = (i / 1) * xMax;
    return `${toX(v)},${toYLin(v)}`;
  }).join(' ');

  const x128 = toX(128);

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>CONTEXT WINDOW — ATTENTION IS QUADRATIC IN SEQUENCE LENGTH</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Quadratic vs linear compute cost vs context length">
        {/* Background */}
        <rect width={W} height={H} rx="6" fill="#1e1e2e"/>
        {/* Grid lines */}
        {[0.25,0.5,0.75,1].map((f,i) => (
          <line key={i} x1={padL} y1={padT + chartH * (1-f)} x2={W - padR} y2={padT + chartH * (1-f)} stroke="#313244" strokeWidth="1"/>
        ))}
        {/* 128K vertical dashed marker */}
        <line x1={x128} y1={padT} x2={x128} y2={padT + chartH} stroke="#6c7086" strokeWidth="1" strokeDasharray="4 3"/>
        <text x={x128 - 3} y={padT + 10} textAnchor="end" fill="#6c7086" fontSize="9">GPT-4 128K</text>
        {/* O(n) line */}
        <polyline points={linPts} fill="none" stroke="#a6e3a1" strokeWidth="2"/>
        <text x={toX(64)} y={toYLin(64) - 6} textAnchor="middle" fill="#a6e3a1" fontSize="10" fontWeight="700">O(n)</text>
        {/* O(n²) curve */}
        <polyline points={quadPts} fill="none" stroke="#89b4fa" strokeWidth="2"/>
        <text x={toX(58)} y={toYQuad(58*58) - 8} textAnchor="middle" fill="#89b4fa" fontSize="10" fontWeight="700">O(n²)</text>
        {/* X-axis */}
        <line x1={padL} y1={padT + chartH} x2={W - padR} y2={padT + chartH} stroke="#45475a" strokeWidth="1"/>
        {xVals.map((v, i) => (
          <g key={i}>
            <line x1={toX(v)} y1={padT + chartH} x2={toX(v)} y2={padT + chartH + 4} stroke="#45475a" strokeWidth="1"/>
            <text x={toX(v)} y={padT + chartH + 14} textAnchor="middle" fill="#6c7086" fontSize="9">{xLabels[i]}</text>
          </g>
        ))}
        {/* Y-axis */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#45475a" strokeWidth="1"/>
        <text x={padL - 6} y={padT + chartH} textAnchor="end" fill="#6c7086" fontSize="9">0</text>
        <text x={padL - 6} y={padT + 4} textAnchor="end" fill="#6c7086" fontSize="9">max</text>
        {/* Axis labels */}
        <text x={padL + chartW / 2} y={H - 2} textAnchor="middle" fill="#6c7086" fontSize="9">Context length (tokens)</text>
        <text x="10" y={padT + chartH / 2} textAnchor="middle" fill="#6c7086" fontSize="9" transform={`rotate(-90,10,${padT + chartH / 2})`}>Compute cost (relative)</text>
        {/* 128K annotation dot */}
        <circle cx={x128} cy={toYQuad(128*128)} r="4" fill="#89b4fa"/>
        <text x={x128 + 6} y={toYQuad(128*128) + 4} fill="#89b4fa" fontSize="9">128K</text>
      </svg>
    </div>
  );
}

const CODE_36_1 = `Perceptron (1957): output = σ(w₁x₁ + w₂x₂ + ... + b)
  σ = activation function (sigmoid → ReLU → GELU in modern LLMs)
  Limitation: single layer can't learn complex patterns

Feedforward Neural Network: stack layers
  Limitation: no sense of word order, can't handle variable-length sequences

RNN/LSTM (1997–2015): process tokens sequentially
  Limitation: vanishing gradient, inherently sequential (slow, no parallelism)
  Why vanishing gradient: hidden state is multiplied by weight matrix at every step.
  If max eigenvalue < 1, errors shrink exponentially across steps (×0.9 × 0.9 × 0.9 …).
  By step 50, gradient ≈ 0 — early tokens stop influencing training.
  Fix: residual connections (skip connections add gradient path of 1.0, bypassing multiplication).

Transformer (Vaswani 2017 "Attention Is All You Need"):
  Every token attends to every other token simultaneously
  Fully parallelisable → GPU-friendly → scales to 405B parameters`;

const CODE_36_2 = `# OpenAI tokenizer (tiktoken)
from tiktoken import encoding_for_model
enc = encoding_for_model("gpt-4o")
tokens = enc.encode("Housing.com property search")
# [39963, 916, 3241, 1718]  — 4 tokens, not 3 words

# Show the actual token strings (what gets billed):
[enc.decode([t]) for t in tokens]
# ["Housing", ".com", " property", " search"]
# Note: " search" has a leading space — that's a real token boundary.
# "Housing.com" splits into 2 tokens because ".com" is common enough to be its own token.
# Rule of thumb: 1 token ≈ 0.75 words (English)
# Rare words cost more: "Maharashtra" → 3 tokens: ["Mah", "ar", "ashtra"]

# Claude tokenizer (anthropic SDK)
import anthropic
client = anthropic.Anthropic()
count = client.beta.messages.count_tokens(
    model="claude-haiku-4-5-20251001",
    messages=[{"role": "user", "content": "Housing.com property search"}],
)
# → {"input_tokens": 5}  (Claude's tokenizer may differ from OpenAI's)
# Use this for cost-critical code — don't assume tiktoken counts apply to Claude`;

const CODE_36_3 = `── BPE Tokenization Pipeline ────────────────────────────────────────────────

Raw text: "Housing.com property search in Bandra"
     │
     ▼
[BPE Tokenizer] — look up learned merge rules (100K vocab for GPT-4o)
     │
     ▼
Token IDs:  [39963,  916,    3241,    1718,   304,  87854  ]
     │
     ▼
Token str:  "Housing" ".com" " property" " search" " in" " Bandra"
     │              ↑
     │        note: space is part of the token " property" ≠ "property"
     ▼
Embedding lookup: each token ID → 4096-dimensional float vector
     │
     ▼
[Transformer layers process the sequence]

Billing impact:
  "Maharashtra" → ["Mah", "ar", "ashtra"] = 3 tokens (rare Indian proper noun)
  "the"         → ["the"]                  = 1 token  (common English word)
  Same 5 words in English vs Hindi may cost 2–4× different token counts.
  Rule: benchmark your domain's text with tiktoken before signing API contracts.`;

const CODE_36_4 = `token_id → lookup table → dense vector ∈ ℝ^d_model
  d_model: 768 (BERT), 4096 (Llama 3.1 8B), 8192 (GPT-4)

Embedding table size: vocab_size × d_model
  Llama 3.1 8B: 128K × 4096 = 500M params (7.5% of total model!)

RoPE (Rotary Position Embedding):
  Encodes relative positions directly into Q/K dot product
  Generalises to longer contexts than absolute positional encoding`;

const CODE_36_5 = `Input vectors
  ↓ LayerNorm
  ↓ Multi-Head Self-Attention   ← "reading" (which tokens matter?)
  ↓ + residual connection       ← prevents vanishing gradient
  ↓ LayerNorm
  ↓ Feed-Forward Network (MLP)  ← "memory" (factual knowledge in weights)
  ↓ + residual connection
Output vectors (enriched token representations)

Llama 3.1 8B = 32 of these blocks stacked
GPT-4 = ~96 blocks (exact count not disclosed)`;

const CODE_36_6 = `For token i:
  Query: Qᵢ = Wq × xᵢ   "what am I looking for?"
  Key:   Kⱼ = Wk × xⱼ   "what does token j advertise?"
  Value: Vⱼ = Wv × xⱼ   "what info does j contribute?"

  Attention score: aᵢⱼ = softmax(QᵢKⱼᵀ / √d_k)
  Output for i:   oᵢ = Σⱼ aᵢⱼ × Vⱼ`;

const CODE_36_7 = `class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, n_heads):
        super().__init__()
        self.d_k = d_model // n_heads
        self.n_heads = n_heads
        self.Wq = nn.Linear(d_model, d_model)
        self.Wk = nn.Linear(d_model, d_model)
        self.Wv = nn.Linear(d_model, d_model)
        self.Wo = nn.Linear(d_model, d_model)

    def forward(self, x):
        B, T, C = x.shape
        Q = self.Wq(x).reshape(B, T, self.n_heads, self.d_k).transpose(1,2)
        K = self.Wk(x).reshape(B, T, self.n_heads, self.d_k).transpose(1,2)
        V = self.Wv(x).reshape(B, T, self.n_heads, self.d_k).transpose(1,2)
        scores = (Q @ K.transpose(-2,-1)) / math.sqrt(self.d_k)
        scores = scores.masked_fill(mask == 0, -1e9)  # causal mask
        out = F.softmax(scores, dim=-1) @ V
        return self.Wo(out.transpose(1,2).reshape(B, T, C))`;

const CODE_36_8 = `class FFN(nn.Module):
    def __init__(self, d_model):
        super().__init__()
        self.fc1 = nn.Linear(d_model, d_model * 4)  # expand
        self.fc2 = nn.Linear(d_model * 4, d_model)  # contract back

    def forward(self, x):
        return self.fc2(F.gelu(self.fc1(x)))
# Llama 3.1 8B: d_model=4096, hidden=14336, uses SwiGLU activation
# FFN holds ~2/3 of all model parameters — it's where factual knowledge lives`;

const CODE_36_9 = `1. Tokenise input → token IDs
2. Embed → dense vectors + add RoPE positional encoding
3. Pass through N transformer blocks (LayerNorm → Attention → FFN)
4. Final LayerNorm → Linear(d_model → vocab_size) → Softmax
5. Sample next token (temperature + top-p)
6. Append token → REPEAT from step 3 (autoregressive — same one process, looping)

IMPORTANT: This loop is ONE running process — NOT separate API calls.
  GPT-4 generating 500 words ≠ 500 HTTP requests.
  It is one connection: one forward pass per token, all streamed back.
  "Separate API call per token" is the most common misconception.

Concrete example — generating token 101:
  Context: 100 previously generated tokens (the prompt + first 100 generated)
  Forward pass: model reads ALL 100 tokens simultaneously via attention
  Output: logits vector over 128K vocab → softmax → sample "property"
  Token 101 = "property" is appended to context
  Next pass processes 101 tokens, outputs token 102
  This repeats until EOS token or max_tokens limit.

  Llama 3.1 8B timing on A100:
  - Prefill (first pass over prompt, N tokens): ~50ms for N=100
  - Decode (each additional token): ~10ms
  - 500 tokens generated: 50ms prefill + 500×10ms = ~5 seconds total

KV Cache:
  Without: recompute Keys and Values for ALL previous tokens each step → O(n²)
  With:    store K,V from previous tokens, compute only new token → O(n)
  Memory:  O(n_layers × n_kv_heads × d_head × seq_len × 2)
  128K context, Llama 3.1 8B → ~15GB just for KV cache`;

const CODE_36_BANK = `attention_scores["bank"] × Keys:
  "The"   → 0.02  (low — function word)
  "bank"  → 0.08  (self — low)
  "near"  → 0.15  (proximity relation)
  "river" → 0.61  ← HIGH — "river" context shifts meaning
  "flood" → 0.14  (supports river meaning)
  → Value aggregation: pulls in "river" and "flood" representations`;

const CODE_36_NUMERIC = `import numpy as np

# Toy model: vocab=8, d_model=4, d_k=4 (one attention head)
# These weights would normally be learned; here they're fixed for illustration.
np.random.seed(42)
embeddings = np.random.randn(8, 4)  # 8-word vocab, 4-dim embedding

# Projection matrices (learned during training)
W_Q = np.random.randn(4, 4)
W_K = np.random.randn(4, 4)
W_V = np.random.randn(4, 4)

# Input: 3-token sentence ["Mumbai", "flat", "price"]
token_ids = [3, 1, 5]
E = embeddings[token_ids]  # shape: (3, 4) — one row per token

# Step 1: Project to Q, K, V
Q = E @ W_Q   # (3, 4) — "what am I looking for?"
K = E @ W_K   # (3, 4) — "what do I have?"
V = E @ W_V   # (3, 4) — "what will I contribute if selected?"

# Step 2: Scaled dot-product attention scores
d_k = 4
scores = Q @ K.T / np.sqrt(d_k)   # (3, 3)
# scores[i, j] = how much token i attends to token j

# Step 3: Softmax — each row becomes a probability distribution
def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)  # numerical stability
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)

attn = softmax(scores)   # (3, 3) — each row sums to 1.0
print("Attention weights (row = query token, col = key token):")
print(np.round(attn, 3))

# Step 4: Weighted sum of values
output = attn @ V   # (3, 4) — new representation for each token
print("\\nOutput shape:", output.shape)
print("Token 0 ('Mumbai') new representation:", np.round(output[0], 3))
# This vector now 'knows' something about 'flat' and 'price' too.`;

function AttentionNumericViz() {
  const [selectedToken, setSelectedToken] = useState(0);
  const [dk, setDk] = useState(4);

  const tokenLabels = ["Mumbai", "flat", "price"];
  // Pre-computed attention weights for 3 illustrative states (d_k 2/4/8)
  const attnMaps: Record<number, number[][]> = {
    2: [[0.51, 0.28, 0.21], [0.22, 0.55, 0.23], [0.18, 0.27, 0.55]],
    4: [[0.62, 0.22, 0.16], [0.18, 0.58, 0.24], [0.14, 0.21, 0.65]],
    8: [[0.74, 0.16, 0.10], [0.11, 0.71, 0.18], [0.09, 0.15, 0.76]],
  };
  const weights = attnMaps[dk] ?? attnMaps[4];

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'12px'}}>ATTENTION HEATMAP — 3 TOKENS</div>

      <div style={{display:'flex',gap:'24px',flexWrap:'wrap',alignItems:'flex-start'}}>
        {/* Token selector */}
        <div>
          <div style={{fontSize:'0.75rem',color:'#6c7086',marginBottom:'8px'}}>Click a query token to highlight its row:</div>
          <div style={{display:'flex',gap:'8px',marginBottom:'16px'}}>
            {tokenLabels.map((tok, i) => (
              <button key={i} onClick={() => setSelectedToken(i)}
                style={{padding:'4px 12px',borderRadius:'6px',border:`1px solid ${i === selectedToken ? '#89b4fa' : '#313244'}`,background: i === selectedToken ? '#313244' : '#1e1e2e',color: i === selectedToken ? '#89b4fa' : '#6c7086',cursor:'pointer',fontFamily:'monospace',fontSize:'0.82rem'}}>
                {tok}
              </button>
            ))}
          </div>

          {/* 3×3 heatmap */}
          <div style={{display:'grid',gridTemplateColumns:'60px repeat(3, 64px)',gap:'2px',fontSize:'0.72rem'}}>
            <div style={{color:'#6c7086',textAlign:'center',paddingBottom:'4px'}} />
            {tokenLabels.map(k => <div key={k} style={{color:'#6c7086',textAlign:'center',paddingBottom:'4px'}}>{k}</div>)}
            {tokenLabels.map((q, qi) => (
              <Fragment key={qi}>
                <div style={{color: qi === selectedToken ? '#89b4fa' : '#6c7086',fontFamily:'monospace',display:'flex',alignItems:'center',paddingRight:'4px'}}>{q}</div>
                {weights[qi].map((w, ki) => (
                  <div key={ki} style={{
                    background: qi === selectedToken ? `rgba(137, 180, 250, ${w.toFixed(2)})` : `rgba(108, 112, 134, ${w.toFixed(2)})`,
                    borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center',
                    color:'#cdd6f4',fontFamily:'monospace',fontSize:'0.78rem',height:'40px',
                    fontWeight: qi === selectedToken ? 700 : 400,
                    border: qi === selectedToken ? '1px solid #89b4fa' : '1px solid transparent'
                  }}>{w.toFixed(2)}</div>
                ))}
              </Fragment>
            ))}
          </div>
        </div>

        {/* d_k slider */}
        <div style={{flex:1,minWidth:'180px'}}>
          <div style={{fontSize:'0.75rem',color:'#6c7086',marginBottom:'8px'}}>Head dimension d_k = {dk}</div>
          <input type="range" min="2" max="8" step="2" value={dk}
            onChange={e => setDk(Number(e.target.value))}
            style={{width:'100%',accentColor:'#89b4fa',marginBottom:'8px'}} />
          <div style={{fontSize:'0.75rem',color:'#6c7086',lineHeight:'1.5'}}>
            Scaling by <code style={{color:'#89b4fa'}}>√{dk} ≈ {Math.sqrt(dk).toFixed(2)}</code> prevents scores from growing so large that softmax saturates (all probability on one token). Larger d_k → more aggressive sharpening. Watch the weights shift between 0.51/0.28/0.21 (d_k=2) and 0.74/0.16/0.10 (d_k=8).
          </div>
        </div>
      </div>
    </div>
  );
}

export function Mod36() {
  return (
    <>
      <h2>§21.0 One Token, Real Numbers</h2>
      <p>Every concept in this module reduces to one operation: a scaled dot-product between three matrices. Here it is with actual numbers so you can reason about LLM behaviour from weights, not intuition alone.</p>
      <CodeBlock title="Attention Mechanism — Numeric Walkthrough" language="python" keyLine={34} keyNote="scaled dot-product prevents softmax saturation">{CODE_36_NUMERIC}</CodeBlock>
      <AttentionNumericViz />
      <div className="callout callout-info">
        The Transformer runs this for <strong>H attention heads × N layers</strong> simultaneously. Everything else in this module — multi-head attention, KV cache, RoPE, GQA — is naming, scaling, and optimising this one operation.
      </div>

      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Trace the path from raw text through tokenisation, embedding, and transformer blocks to a generated token</li>
          <li>Explain scaled dot-product attention (Q, K, V) and why multi-head attention learns multiple relationship types</li>
          <li>Describe what a KV cache is and why it is critical for inference efficiency</li>
          <li>Explain why long contexts are expensive: context window vs compute/memory tradeoffs</li>
          <li>Use temperature and top-p to control generation quality vs diversity</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~80 minutes</span>
          <span className="obj-diff">Difficulty: ★★★★☆</span>
          <span className="obj-diff">Prerequisites: None</span>
        </div>
      </div>

      <div className="callout callout-info">
        <strong>Housing.com Context</strong><br />
        Housing.com pays real money for tokenisation artefacts — Indian city names tokenise inefficiently, and the property taxonomy system prompt costs ~400 tokens when naively written. Understanding tokenisation helps you write prompts that do the same work with fewer tokens.
      </div>

      <h2>21.1 From Perceptron to Transformer</h2>
      <CodeBlock title="Neural Architecture Timeline — Perceptron to Transformer" language="text" keyLine={8} keyNote="residual connections fix vanishing gradient via skip path">{CODE_36_1}</CodeBlock>

      <StepThroughBPE />

      <h2>21.2 Tokenisation</h2>
      <CodeBlock title="Tokenizer Usage — OpenAI tiktoken and Claude SDK" language="python" keyLine={22} keyNote="Claude tokenizer may differ — don't assume tiktoken counts apply">{CODE_36_2}</CodeBlock>
      <div className="callout callout-info" style={{fontFamily:'monospace',fontSize:'12px',lineHeight:1.8,whiteSpace:'pre'}}>
        {CODE_36_3}
      </div>
      <p><strong>BPE (Byte-Pair Encoding):</strong> starts with byte-level vocab, iteratively merges most-frequent byte-pairs into new tokens until target vocab size (e.g. 100K for GPT-4o). Common words → 1 token. Rare domain terms → 3–6 tokens. Billing is per token, not per word. Different providers use different BPE vocabularies — never assume token counts are portable across models.</p>

      <h2>21.3 Embeddings &amp; Positional Encoding</h2>
      <CodeBlock title="Token Embeddings and RoPE Positional Encoding" language="text" keyLine={5} keyNote="embedding table uses 7.5% of total model params in Llama 3.1">{CODE_36_4}</CodeBlock>

      <div className="diagram-wrap" style={{marginTop:"12px",marginBottom:"12px"}}>
        <div className="diagram-title">Transformer Architecture — One Block, Repeated × N Layers</div>
        <svg width="100%" viewBox="0 0 420 450" style={{display:"block",maxWidth:"420px",margin:"0 auto",fontFamily:"'Courier New',monospace"}}>
          <defs>
            <marker id="tb-arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0,0 L7,3.5 L0,7 z" fill="#89b4fa"/>
            </marker>
            <marker id="tb-res" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0,0 L7,3.5 L0,7 z" fill="#a6e3a1"/>
            </marker>
          </defs>
          <rect width="420" height="450" rx="8" fill="#1e1e2e"/>
          {/* Input tokens */}
          <rect x="120" y="14" width="180" height="30" rx="4" fill="#313244" stroke="#a6adc8" strokeWidth="1.5"/>
          <text x="210" y="28" textAnchor="middle" fill="#cdd6f4" fontSize="10" fontWeight="bold">Input Token IDs [B, T]</text>
          <text x="210" y="38" textAnchor="middle" fill="#6c7086" fontSize="8">e.g. [42, 198, 7, ...]</text>
          <line x1="210" y1="44" x2="210" y2="62" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#tb-arr)"/>
          {/* Embedding row */}
          <rect x="60" y="62" width="130" height="30" rx="4" fill="#1e3a5f" stroke="#89b4fa" strokeWidth="1.5"/>
          <text x="125" y="76" textAnchor="middle" fill="#89b4fa" fontSize="10" fontWeight="bold">Token Embedding</text>
          <text x="125" y="88" textAnchor="middle" fill="#6c7086" fontSize="8">vocab × d_model</text>
          <text x="210" y="82" textAnchor="middle" fill="#a6adc8" fontSize="14" fontWeight="bold">+</text>
          <rect x="230" y="62" width="130" height="30" rx="4" fill="#2a3050" stroke="#89b4fa" strokeWidth="1.5"/>
          <text x="295" y="76" textAnchor="middle" fill="#89b4fa" fontSize="10" fontWeight="bold">Pos. Encoding</text>
          <text x="295" y="88" textAnchor="middle" fill="#6c7086" fontSize="8">RoPE / sinusoidal</text>
          <line x1="210" y1="92" x2="210" y2="112" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#tb-arr)"/>
          {/* Transformer block dashed border */}
          <rect x="18" y="112" width="384" height="230" rx="6" fill="none" stroke="#45475a" strokeWidth="1.5" strokeDasharray="6,3"/>
          <text x="30" y="127" fill="#6c7086" fontSize="9">× N Transformer Blocks  (N = 32 for Llama 3 8B)</text>
          {/* Multi-Head Attention */}
          <rect x="60" y="134" width="300" height="34" rx="4" fill="#1e3a5f" stroke="#89b4fa" strokeWidth="1.5"/>
          <text x="210" y="148" textAnchor="middle" fill="#cdd6f4" fontSize="10" fontWeight="bold">Multi-Head Self-Attention</text>
          <text x="210" y="161" textAnchor="middle" fill="#6c7086" fontSize="8.5">Q · Kᵀ / √d_k → softmax → V  (causal mask applied)</text>
          {/* Residual bypass 1: right side, from top of MHA to Add&Norm 1 */}
          <line x1="380" y1="151" x2="394" y2="151" stroke="#a6e3a1" strokeWidth="1.5"/>
          <line x1="394" y1="151" x2="394" y2="198" stroke="#a6e3a1" strokeWidth="1.5"/>
          <line x1="394" y1="198" x2="378" y2="198" stroke="#a6e3a1" strokeWidth="1.5" markerEnd="url(#tb-res)"/>
          <text x="400" y="178" fill="#a6e3a1" fontSize="8" fontStyle="italic">skip</text>
          {/* Down to Add & Norm 1 */}
          <line x1="210" y1="168" x2="210" y2="184" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#tb-arr)"/>
          {/* Add & Layer Norm 1 */}
          <rect x="110" y="184" width="200" height="28" rx="4" fill="#252535" stroke="#a6e3a1" strokeWidth="1.5"/>
          <text x="210" y="198" textAnchor="middle" fill="#a6e3a1" fontSize="10" fontWeight="bold">Add &amp; Layer Norm</text>
          <text x="210" y="208" textAnchor="middle" fill="#6c7086" fontSize="8">residual + normalize</text>
          {/* Down to FFN */}
          <line x1="210" y1="212" x2="210" y2="230" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#tb-arr)"/>
          {/* Feed-Forward Network */}
          <rect x="60" y="230" width="300" height="34" rx="4" fill="#2e1a3a" stroke="#cba6f7" strokeWidth="1.5"/>
          <text x="210" y="244" textAnchor="middle" fill="#cdd6f4" fontSize="10" fontWeight="bold">Feed-Forward Network</text>
          <text x="210" y="257" textAnchor="middle" fill="#6c7086" fontSize="8.5">Linear(d→4d) → GeLU → Linear(4d→d)  per-token</text>
          {/* Residual bypass 2 */}
          <line x1="380" y1="247" x2="394" y2="247" stroke="#a6e3a1" strokeWidth="1.5"/>
          <line x1="394" y1="247" x2="394" y2="295" stroke="#a6e3a1" strokeWidth="1.5"/>
          <line x1="394" y1="295" x2="378" y2="295" stroke="#a6e3a1" strokeWidth="1.5" markerEnd="url(#tb-res)"/>
          {/* Down to Add & Norm 2 */}
          <line x1="210" y1="264" x2="210" y2="281" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#tb-arr)"/>
          {/* Add & Layer Norm 2 */}
          <rect x="110" y="281" width="200" height="28" rx="4" fill="#252535" stroke="#a6e3a1" strokeWidth="1.5"/>
          <text x="210" y="295" textAnchor="middle" fill="#a6e3a1" fontSize="10" fontWeight="bold">Add &amp; Layer Norm</text>
          <text x="210" y="305" textAnchor="middle" fill="#6c7086" fontSize="8">residual + normalize</text>
          {/* Exit block */}
          <line x1="210" y1="342" x2="210" y2="362" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#tb-arr)"/>
          <text x="210" y="355" textAnchor="middle" fill="#6c7086" fontSize="8">output fed to next block (or final head)</text>
          {/* Linear head */}
          <rect x="85" y="362" width="250" height="28" rx="4" fill="#1a2e1a" stroke="#a6e3a1" strokeWidth="1.5"/>
          <text x="210" y="376" textAnchor="middle" fill="#cdd6f4" fontSize="10" fontWeight="bold">Linear (d_model → vocab_size)</text>
          <text x="210" y="388" textAnchor="middle" fill="#6c7086" fontSize="8">unembedding: hidden state → logits</text>
          <line x1="210" y1="390" x2="210" y2="408" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#tb-arr)"/>
          {/* Softmax */}
          <rect x="110" y="408" width="200" height="30" rx="4" fill="#2e2040" stroke="#cba6f7" strokeWidth="2"/>
          <text x="210" y="422" textAnchor="middle" fill="#cba6f7" fontSize="10" fontWeight="bold">Softmax → Next Token Prob</text>
          <text x="210" y="434" textAnchor="middle" fill="#6c7086" fontSize="8">sample with temperature → next token id</text>
        </svg>
      </div>

      <h2>21.4 The Transformer Block</h2>
      <CodeBlock title="Transformer Block — Attention and FFN with Residuals" language="text" keyLine={4} keyNote="residual connection prevents vanishing gradient in deep stacks">{CODE_36_5}</CodeBlock>

      <h2>21.5 Multi-Head Self-Attention (MHA)</h2>
      <p>For each token: <em>"which other tokens in the sequence are relevant to me, and how much?"</em></p>
      <p>The math notation below translates directly to PyTorch tensor operations. Before reading the code, two things to understand:</p>
      <ul>
        <li><strong>PyTorch always adds a batch dimension <code>B</code>.</strong> A sequence of <code>T</code> tokens each of dimension <code>C</code> is stored as a tensor of shape <code>[B, T, C]</code> — batch first. This is why <code>x.shape</code> unpacks to <code>B, T, C</code>.</li>
        <li><strong>"Multi-head" means splitting the <code>C</code> dimension into <code>n_heads</code> independent sub-spaces.</strong> Each head runs attention on a slice of dimension <code>d_k = C / n_heads</code>, so different heads can learn to attend to syntax, semantics, coreference, etc. independently. The <code>.reshape(B, T, n_heads, d_k).transpose(1,2)</code> rearranges the tensor from <code>[B, T, C]</code> to <code>[B, n_heads, T, d_k]</code> — moving the head dimension to position 1 so the attention matrix computation treats each head separately.</li>
      </ul>
      <div className="callout callout-info">
        <strong>Causal masking — why <code>masked_fill(mask == 0, -1e9)</code>?</strong> During training, the transformer sees the full sequence at once (unlike an RNN which processes left to right). Without masking, token 5 could attend to tokens 6, 7, 8 — cheating by looking at the future. The causal mask sets all future-position attention scores to −1 billion before softmax. After softmax, e^(−10⁹) ≈ 0, so those positions get zero weight. Each token can only read tokens that came before it — making generation autoregressive. Without this mask, the model would learn to copy answers from future context and would fail completely at inference time.
      </div>
      <CodeBlock title="Query, Key, Value — Scaled Dot-Product Attention Math" language="text" keyLine={5} keyNote="softmax of scaled scores gives the weighted blend over values">{CODE_36_6}</CodeBlock>
      <CodeBlock title="Multi-Head Attention — PyTorch Implementation" language="python" keyLine={13} keyNote="causal mask sets future scores to -1e9 so softmax gives ~zero weight">{CODE_36_7}</CodeBlock>
      <svg width="480" height="240" viewBox="0 0 480 240" style={{display: "block", margin: "12px auto", fontFamily: "'Courier New',monospace"}}>
        <rect width="480" height="240" rx="6" fill="#1e1e2e"/>
        <text x="240" y="20" textAnchor="middle" fill="#cdd6f4" fontSize="11" fontWeight="bold">Attention Heatmap: "The bank near the river flooded"</text>
        <text x="240" y="34" textAnchor="middle" fill="#a6adc8" fontSize="9">Each row = query token. Each cell = how much it attends to the column token. Brighter = higher weight.</text>
        {/* Column headers (keys) */}
        <text x="130" y="55" textAnchor="middle" fill="#89b4fa" fontSize="10" fontWeight="bold">The</text>
        <text x="185" y="55" textAnchor="middle" fill="#89b4fa" fontSize="10" fontWeight="bold">bank</text>
        <text x="240" y="55" textAnchor="middle" fill="#89b4fa" fontSize="10" fontWeight="bold">near</text>
        <text x="295" y="55" textAnchor="middle" fill="#89b4fa" fontSize="10" fontWeight="bold">the</text>
        <text x="350" y="55" textAnchor="middle" fill="#89b4fa" fontSize="10" fontWeight="bold">river</text>
        <text x="405" y="55" textAnchor="middle" fill="#89b4fa" fontSize="10" fontWeight="bold">flooded</text>
        {/* Row labels (queries) */}
        <text x="75" y="80" textAnchor="end" fill="#a6e3a1" fontSize="10" fontWeight="bold">The</text>
        <text x="75" y="115" textAnchor="end" fill="#f38ba8" fontSize="10" fontWeight="bold">bank</text>
        <text x="75" y="150" textAnchor="end" fill="#a6e3a1" fontSize="10" fontWeight="bold">near</text>
        <text x="75" y="185" textAnchor="end" fill="#a6e3a1" fontSize="10" fontWeight="bold">river</text>
        {/* Row: "The" */}
        <rect x="105" y="62" width="50" height="28" fill="#89b4fa" fillOpacity="0.55" rx="2"/>
        <rect x="160" y="62" width="50" height="28" fill="#89b4fa" fillOpacity="0.20" rx="2"/>
        <rect x="215" y="62" width="50" height="28" fill="#89b4fa" fillOpacity="0.10" rx="2"/>
        <rect x="270" y="62" width="50" height="28" fill="#89b4fa" fillOpacity="0.08" rx="2"/>
        <rect x="325" y="62" width="50" height="28" fill="#89b4fa" fillOpacity="0.05" rx="2"/>
        <rect x="380" y="62" width="50" height="28" fill="#89b4fa" fillOpacity="0.02" rx="2"/>
        {/* Score labels row 1 */}
        <text x="130" y="81" textAnchor="middle" fill="#cdd6f4" fontSize="9">0.55</text>
        <text x="185" y="81" textAnchor="middle" fill="#cdd6f4" fontSize="9">0.20</text>
        <text x="240" y="81" textAnchor="middle" fill="#cdd6f4" fontSize="9">0.10</text>
        <text x="295" y="81" textAnchor="middle" fill="#cdd6f4" fontSize="9">0.08</text>
        <text x="350" y="81" textAnchor="middle" fill="#a6adc8" fontSize="9">0.05</text>
        <text x="405" y="81" textAnchor="middle" fill="#a6adc8" fontSize="9">0.02</text>
        {/* Row: "bank" */}
        <rect x="105" y="97" width="50" height="28" fill="#89b4fa" fillOpacity="0.02" rx="2"/>
        <rect x="160" y="97" width="50" height="28" fill="#89b4fa" fillOpacity="0.08" rx="2"/>
        <rect x="215" y="97" width="50" height="28" fill="#89b4fa" fillOpacity="0.15" rx="2"/>
        <rect x="270" y="97" width="50" height="28" fill="#89b4fa" fillOpacity="0.02" rx="2"/>
        <rect x="325" y="97" width="50" height="28" fill="#f38ba8" fillOpacity="0.90" rx="2"/>
        <rect x="380" y="97" width="50" height="28" fill="#89b4fa" fillOpacity="0.14" rx="2"/>
        <text x="130" y="116" textAnchor="middle" fill="#a6adc8" fontSize="9">0.02</text>
        <text x="185" y="116" textAnchor="middle" fill="#cdd6f4" fontSize="9">0.08</text>
        <text x="240" y="116" textAnchor="middle" fill="#cdd6f4" fontSize="9">0.15</text>
        <text x="295" y="116" textAnchor="middle" fill="#a6adc8" fontSize="9">0.02</text>
        <text x="350" y="116" textAnchor="middle" fill="#1e1e2e" fontSize="9" fontWeight="bold">0.61 ★</text>
        <text x="405" y="116" textAnchor="middle" fill="#cdd6f4" fontSize="9">0.14</text>
        {/* Row: "near" */}
        <rect x="105" y="132" width="50" height="28" fill="#89b4fa" fillOpacity="0.05" rx="2"/>
        <rect x="160" y="132" width="50" height="28" fill="#89b4fa" fillOpacity="0.45" rx="2"/>
        <rect x="215" y="132" width="50" height="28" fill="#89b4fa" fillOpacity="0.30" rx="2"/>
        <rect x="270" y="132" width="50" height="28" fill="#89b4fa" fillOpacity="0.12" rx="2"/>
        <rect x="325" y="132" width="50" height="28" fill="#89b4fa" fillOpacity="0.06" rx="2"/>
        <rect x="380" y="132" width="50" height="28" fill="#89b4fa" fillOpacity="0.02" rx="2"/>
        <text x="130" y="151" textAnchor="middle" fill="#a6adc8" fontSize="9">0.05</text>
        <text x="185" y="151" textAnchor="middle" fill="#cdd6f4" fontSize="9">0.45</text>
        <text x="240" y="151" textAnchor="middle" fill="#cdd6f4" fontSize="9">0.30</text>
        <text x="295" y="151" textAnchor="middle" fill="#cdd6f4" fontSize="9">0.12</text>
        <text x="350" y="151" textAnchor="middle" fill="#a6adc8" fontSize="9">0.06</text>
        <text x="405" y="151" textAnchor="middle" fill="#a6adc8" fontSize="9">0.02</text>
        {/* Row: "river" */}
        <rect x="105" y="167" width="50" height="28" fill="#89b4fa" fillOpacity="0.03" rx="2"/>
        <rect x="160" y="167" width="50" height="28" fill="#89b4fa" fillOpacity="0.40" rx="2"/>
        <rect x="215" y="167" width="50" height="28" fill="#89b4fa" fillOpacity="0.12" rx="2"/>
        <rect x="270" y="167" width="50" height="28" fill="#89b4fa" fillOpacity="0.05" rx="2"/>
        <rect x="325" y="167" width="50" height="28" fill="#89b4fa" fillOpacity="0.35" rx="2"/>
        <rect x="380" y="167" width="50" height="28" fill="#89b4fa" fillOpacity="0.05" rx="2"/>
        <text x="130" y="186" textAnchor="middle" fill="#a6adc8" fontSize="9">0.03</text>
        <text x="185" y="186" textAnchor="middle" fill="#cdd6f4" fontSize="9">0.40</text>
        <text x="240" y="186" textAnchor="middle" fill="#cdd6f4" fontSize="9">0.12</text>
        <text x="295" y="186" textAnchor="middle" fill="#a6adc8" fontSize="9">0.05</text>
        <text x="350" y="186" textAnchor="middle" fill="#cdd6f4" fontSize="9">0.35</text>
        <text x="405" y="186" textAnchor="middle" fill="#a6adc8" fontSize="9">0.05</text>
        {/* Annotation */}
        <text x="240" y="218" textAnchor="middle" fill="#f38ba8" fontSize="9">★ "bank" attends strongly to "river" (0.61) — context disambiguates river bank vs financial bank</text>
        <text x="240" y="230" textAnchor="middle" fill="#6c7086" fontSize="8">Each row sums to 1.0 (softmax). Multi-head: this is one head — 8-32 heads run in parallel, each learning different relationships.</text>
      </svg>
      <div className="callout callout-info">
        <strong>Attention worked example: how "bank" gets disambiguated</strong>
        {" "}Sentence: "The bank near the river flooded."
        <br />
        Token "bank" has a Query vector that asks: "am I a financial institution or a river bank?"
        <br />
        The Key vectors of "river" and "flooded" respond strongly to the <em>river bank</em> meaning. The Key
        vector of "money" or "deposit" (absent here) would respond to the financial meaning.
        <br /><br />
        Score calculation for head 1:
        <pre>{CODE_36_BANK}</pre>
        The output vector for "bank" is now enriched with the river-bank semantics, not the financial
        meaning. This is attention: each token's final representation is a weighted blend of all other
        tokens' value vectors, weighted by relevance.
      </div>
      <div className="callout callout-tip">
        <strong>Why multiple heads?</strong> Each head learns a different relationship type: Head 1 = syntactic (subject↔verb), Head 2 = coreference (pronoun↔noun), Head 3 = semantic similarity. Multi-head = multi-perspective reading simultaneously.
      </div>
      <p><strong>GQA (Grouped Query Attention):</strong> Used in Llama 3.1, Mistral, Gemma. Multiple query heads share a single KV head. Cuts KV cache size by 8×. Empirically, GQA loses less than 0.5% on benchmarks vs full MHA — because K and V represent "what tokens broadcast about themselves" and sharing across heads causes minimal information loss. The key enabler for 128K context windows without memory explosion.</p>

      <h2>21.6 Feed-Forward Network &amp; What the FFN Stores</h2>
      <p>After attention "reads the room" — gathering context from surrounding tokens — the FFN processes each token <strong>independently</strong>. No interaction between tokens here; it's a per-token transformation. Think of attention as asking "what context do I need?" and the FFN as "now look up the relevant fact given that context."</p>
      <p>Empirically, the FFN weights are where <strong>factual associations are stored</strong>: the Paris→France connection, capital cities, chemical formulas. These were memorised during training. Attention decides which facts are relevant; the FFN retrieves them. This is why the FFN expand-then-contract shape matters — the 4× expansion creates a high-dimensional space in which facts can be encoded as superpositions without interfering with each other.</p>
      <div className="callout callout-info">
        <strong>SwiGLU (used in Llama):</strong> The standard activation is GELU (smooth ReLU). Llama replaces it with SwiGLU — a gated variant that multiplies two linear projections together before activating. Empirically it improves language modelling quality and is now the standard in most open-source models. You don't need to understand its internals to use Llama; just know that it increases the FFN parameter count slightly (three projections instead of two), which is why Llama's FFN hidden dimension is 14,336 rather than the naive 4×4,096 = 16,384.
        <br /><br />
        <strong>Parameter budget:</strong> A standard transformer with 32 layers, d_model=4096, has 32 × (3 × 4096² + 4 × 4096²) ≈ 7B parameters total. The FFN contributes ~4/7 of that — roughly 2/3 of all parameters live in FFN layers. This is why fine-tuning FFN weights (via LoRA targeting <code>gate_proj</code>, <code>up_proj</code>, <code>down_proj</code>) gives stronger task adaptation than fine-tuning attention alone.
      </div>
      <CodeBlock title="Feed-Forward Network — Where Factual Knowledge Lives" language="python" keyLine={8} keyNote="FFN holds ~2/3 of all model parameters — factual knowledge store">{CODE_36_8}</CodeBlock>

      <KVCacheViz />

      <h2>21.7 Full Forward Pass &amp; KV Cache</h2>
      <CodeBlock title="Autoregressive Generation — Full Forward Pass with KV Cache" language="text" keyLine={6} keyNote="one connection, not one request per token — most common misconception">{CODE_36_9}</CodeBlock>
      <div className="callout callout-info">
        <strong>KV Cache — the React.useMemo analogy</strong>
        {" "}Generating token 500 without a KV cache would require re-computing the Key and Value vectors for all 499 preceding tokens — reading the entire context window from scratch every step. That's O(n²) total work across n tokens.
        <br /><br />
        KV cache is exactly like <code>React.useMemo</code> for the attention computation: once you've computed the Key and Value for a token, you cache them. On the next step, only the <em>new</em> token gets new K/V computed; everything before it is retrieved from cache. The attention score for the new token against all previous ones is then computed by reading K from cache — not recomputing it.
        <br /><br />
        <strong>The cost:</strong> 128K context × 32 layers × 8 KV heads × 128 head dimension × 2 (K and V) × 2 bytes (FP16) = ~15GB of VRAM just to hold the KV cache for one request. This is why long context is expensive — not just the compute, but the memory. PagedAttention (Module 36.3) solves this by allocating KV cache in pages rather than pre-allocating the full context length upfront.
      </div>

      <ContextWindowCostViz />

      <h2>21.8 Context Window, Temperature &amp; Sampling</h2>
      <table>
        <tbody>
          <tr><th>Parameter</th><th>Effect</th><th>Recommended value</th></tr>
          <tr><td>temperature=0</td><td>Always pick top token (deterministic)</td><td>Classification, JSON, code</td></tr>
          <tr><td>temperature=0.7</td><td>Balanced creativity</td><td>General generation</td></tr>
          <tr><td>temperature=1.0</td><td>Sample proportionally to probs</td><td>Creative writing</td></tr>
          <tr><td>top_p=0.9</td><td>Cut off bottom 10% probability mass</td><td>Most use cases</td></tr>
          <tr><td>top_k=50</td><td>Only sample from top 50 tokens</td><td>When top_p alone too broad</td></tr>
        </tbody>
      </table>
      <div className="callout callout-info">
        <strong>Context cost: compute vs API pricing are different things</strong>
        {" "}<strong>Compute cost</strong> (what the GPU does): Attention is O(n²) in sequence length. A 128K context
        query requires 128K × 128K = 16 billion attention score computations — ~256× more GPU work than
        an 8K context query. This is the fundamental compute bottleneck.
        <br /><br />
        <strong>API pricing</strong> (what Anthropic charges): Anthropic charges per input token <em>linearly</em> —
        not quadratically. The quadratic cost is absorbed by Anthropic's infrastructure and amortised
        across many users via batching. When you see "$3.00/1M input tokens", that's linear billing
        regardless of context length within the supported window.
        <br /><br />
        <strong>Why it still matters for you:</strong> even at linear billing, long contexts are expensive at scale.
        At 128K context vs 8K context: you pay 16× more per call. Always profile average context lengths
        and trim what's not needed.
      </div>

      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection</strong>
        {" "}"Explain how a transformer generates text." → Walk through tokenisation → embedding → attention (Q, K, V, scaled dot-product) → FFN → autoregressive sampling. Emphasise KV cache for inference efficiency. "Why is GPT-4 slower than Haiku?" → More layers (96 vs 32), larger d_model, same autoregressive bottleneck.
      </div>

      <QuizSection moduleId={23} title="Module 23: LLM Internals" contentHint="BPE tokenisation why rare words cost more tokens, RoPE relative positional encoding, Query Key Value attention dot-product softmax, multi-head attention why multiple perspectives, GQA grouped query attention KV cache memory savings, FFN as factual knowledge store 2/3 of parameters, autoregressive generation token by token, KV cache O(n) vs O(n²) without cache, temperature 0 deterministic vs 1 sampling, context window compute cost quadratic scaling" />
    </>
  );
}
