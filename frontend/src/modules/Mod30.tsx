import { QuizSection } from "../components/QuizSection";

function QuantizationViz() {
  const levels = [
    { label: 'FP32', bits: 32, color: '#89b4fa', saving: 'baseline', quality: 'baseline', vram: '28 GB', vramOk: false },
    { label: 'FP16', bits: 16, color: '#cba6f7', saving: '~2× memory saving', quality: '<1% quality loss', vram: '14 GB', vramOk: false },
    { label: 'INT8', bits: 8,  color: '#f9e2af', saving: '~4× memory saving', quality: '~1–2% quality loss', vram: '7 GB', vramOk: false },
    { label: 'NF4 / INT4', bits: 4,  color: '#a6e3a1', saving: '~8× memory saving', quality: '~3–5% quality loss', vram: '3.5 GB', vramOk: true },
  ];

  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: '8px', padding: '20px', margin: '20px 0', overflow: 'hidden' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6c7086', marginBottom: '14px' }}>QUANTIZATION — TRADING PRECISION FOR MEMORY EFFICIENCY</div>
      <svg viewBox="0 0 560 200" width="100%" style={{ display: 'block', margin: '0 auto' }} aria-label="Quantization levels showing bit reduction from FP32 to NF4">
        <style>{`@keyframes dashFlow30 { to { stroke-dashoffset: -14; } }`}</style>
        <defs>
          <marker id="qarrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#6c7086" />
          </marker>
        </defs>

        {/* Weight value label */}
        <text x="20" y="18" fill="#6c7086" fontSize="11">Weight value: "3.14159"</text>

        {/* Level rows */}
        {levels.map((lv, i) => {
          const y = 30 + i * 42;
          const blockW = Math.max(2, Math.floor(300 / 32) * (lv.bits / 32 > 0.5 ? lv.bits : lv.bits));
          const totalW = 300;
          const filled = (lv.bits / 32) * totalW;

          return (
            <g key={lv.label}>
              {/* Arrow from previous */}
              {i > 0 && (
                <line x1="170" y1={y - 8} x2="170" y2={y + 2} stroke="#6c7086" strokeWidth="1.5"
                  strokeDasharray="4 3" markerEnd="url(#qarrow)"
                  style={{ animation: 'dashFlow30 1s linear infinite', strokeDashoffset: 0 }} />
              )}
              {/* Format label */}
              <text x="20" y={y + 14} fill={lv.color} fontSize="12" fontWeight="bold">{lv.label}</text>
              <text x="20" y={y + 26} fill="#6c7086" fontSize="9">{lv.bits} bits</text>

              {/* Bit blocks */}
              {Array.from({ length: Math.min(lv.bits, 32) }, (_, bi) => (
                <rect key={bi} x={90 + bi * (filled / Math.min(lv.bits, 32))} y={y + 4} width={filled / Math.min(lv.bits, 32) - 1} height="18" rx="2" fill={lv.color} fillOpacity="0.7" />
              ))}
              {/* Empty remainder */}
              {lv.bits < 32 && (
                <rect x={90 + filled} y={y + 4} width={totalW - filled} height="18" rx="2" fill="#313244" />
              )}

              {/* Saving label */}
              <text x="400" y={y + 12} fill="#bac2de" fontSize="10">{lv.saving}</text>
              <text x="400" y={y + 24} fill="#6c7086" fontSize="9">{lv.quality}</text>

              {/* VRAM */}
              <text x="510" y={y + 12} fill={lv.vramOk ? '#a6e3a1' : (lv.vram === '28 GB' || lv.vram === '14 GB') ? '#f38ba8' : '#f9e2af'} fontSize="11" fontWeight="bold">{lv.vram}</text>
              <text x="510" y={y + 24} fill="#6c7086" fontSize="9">{lv.vramOk ? 'consumer GPU' : lv.vram === '28 GB' || lv.vram === '14 GB' ? 'big GPU req.' : 'mid-tier GPU'}</text>
            </g>
          );
        })}

        {/* Right side header */}
        <text x="510" y="18" fill="#6c7086" fontSize="9" textAnchor="middle">7B VRAM</text>

        {/* Legend */}
        <rect x="400" y="178" width="12" height="10" rx="2" fill="#f38ba8" fillOpacity="0.7" />
        <text x="416" y="187" fill="#6c7086" fontSize="9">&gt;24 GB — needs big GPU</text>
        <rect x="510" y="178" width="12" height="10" rx="2" fill="#a6e3a1" fillOpacity="0.7" />
        <text x="526" y="187" fill="#6c7086" fontSize="9">&lt;8 GB — consumer</text>
      </svg>
    </div>
  );
}

function PagedAttentionViz() {
  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: '8px', padding: '20px', margin: '20px 0', overflow: 'hidden' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6c7086', marginBottom: '14px' }}>VLLM PAGEDATTENTION — ELIMINATE KV CACHE MEMORY WASTE</div>
      <svg viewBox="0 0 560 200" width="100%" style={{ display: 'block', margin: '0 auto' }} aria-label="Comparison of standard KV cache versus PagedAttention memory allocation">
        <style>{`@keyframes dashFlow31 { to { stroke-dashoffset: -14; } }`}</style>
        <defs>
          <marker id="pa-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#89b4fa" />
          </marker>
        </defs>

        {/* Left side — Standard */}
        <text x="14" y="18" fill="#cdd6f4" fontSize="12" fontWeight="bold">Standard KV Cache</text>
        <text x="14" y="30" fill="#6c7086" fontSize="9">Pre-allocates max context upfront</text>

        {/* Model weights bar */}
        <rect x="14" y="38" width="220" height="16" rx="3" fill="#45475a" />
        <text x="124" y="50" textAnchor="middle" fill="#cdd6f4" fontSize="9">Model weights (frozen)</text>

        {/* 3 requests with lots of wasted space */}
        {[0, 1, 2].map(i => (
          <g key={i}>
            <rect x="14" y={58 + i * 28} width="60" height="22" rx="3" fill="#89b4fa" fillOpacity="0.7" />
            <rect x="74" y={58 + i * 28} width="160" height="22" rx="3" fill="#313244" />
            <text x="44" y={73 + i * 28} textAnchor="middle" fill="#1e1e2e" fontSize="9" fontWeight="bold">Req {i + 1} actual</text>
            <text x="154" y={73 + i * 28} textAnchor="middle" fill="#6c7086" fontSize="9">wasted (pre-allocated for max length)</text>
          </g>
        ))}
        <text x="14" y="150" fill="#f38ba8" fontSize="10" fontWeight="bold">Memory wasted: pre-allocated for max length</text>
        <text x="14" y="163" fill="#6c7086" fontSize="9">OOM at 4–5 concurrent requests on A100</text>

        {/* Divider */}
        <line x1="280" y1="10" x2="280" y2="190" stroke="#45475a" strokeWidth="1" strokeDasharray="4 3" />

        {/* Right side — PagedAttention */}
        <text x="294" y="18" fill="#cdd6f4" fontSize="12" fontWeight="bold">PagedAttention (vLLM)</text>
        <text x="294" y="30" fill="#6c7086" fontSize="9">Pages allocated only when needed</text>

        {/* Model weights bar */}
        <rect x="294" y="38" width="250" height="16" rx="3" fill="#45475a" />
        <text x="419" y="50" textAnchor="middle" fill="#cdd6f4" fontSize="9">Model weights (frozen)</text>

        {/* Compact paged allocations */}
        {[
          { req: 1, pages: 3, color: '#a6e3a1' },
          { req: 2, pages: 2, color: '#cba6f7' },
          { req: 3, pages: 4, color: '#f9e2af' },
          { req: 4, pages: 2, color: '#fab387', isNew: true },
        ].map((r, i) => (
          <g key={r.req}>
            {Array.from({ length: r.pages }, (_, pi) => (
              <rect key={pi} x={294 + pi * 24} y={58 + i * 28} width="20" height="22" rx="3" fill={r.color} fillOpacity={r.isNew ? 1 : 0.7} />
            ))}
            <text x={294 + r.pages * 24 + 6} y={73 + i * 28} fill={r.color} fontSize="9" fontWeight={r.isNew ? 'bold' : 'normal'}>
              Req {r.req}{r.isNew ? ' ← new (continuous batching)' : ''}
            </text>
          </g>
        ))}

        <text x="294" y="150" fill="#a6e3a1" fontSize="10" fontWeight="bold">Pages allocated only when needed</text>
        <text x="294" y="163" fill="#6c7086" fontSize="9">30+ concurrent requests on same A100 — 3–8× more throughput</text>

        {/* Continuous batching arrow */}
        <line x1="294" y1="142" x2="294" y2="136" stroke="#89b4fa" strokeWidth="1.5"
          strokeDasharray="4 3" markerEnd="url(#pa-arrow)"
          style={{ animation: 'dashFlow31 1s linear infinite' }} />
      </svg>
    </div>
  );
}

const code30_1_bash = `brew install ollama
ollama pull llama3.1:8b
ollama run  llama3.1:8b     # interactive chat
ollama serve                # REST API on localhost:11434`;

const code30_1_python = `# OpenAI-compatible client (drop-in replacement)
from openai import OpenAI
client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")
response = client.chat.completions.create(
    model="llama3.1:8b",
    messages=[{"role": "user", "content": "Classify: 2BHK in Bandra under 2Cr"}],
)

# Or via LangChain
from langchain_community.llms import Ollama
llm = Ollama(model="llama3.1:8b")`;

const code30_1_modelfile = `# Modelfile — custom system prompt + parameters
FROM llama3.1:8b
SYSTEM "You are a housing.com intent classifier. Output JSON only."
PARAMETER temperature 0
PARAMETER num_ctx 4096

ollama create housing-classifier -f Modelfile
ollama run housing-classifier`;

const code30_2_download = `# Download quantised model from HuggingFace
huggingface-cli download bartowski/Meta-Llama-3.1-8B-Instruct-GGUF \\
    --include "Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf" --local-dir ./models

# Run as OpenAI-compatible server
./llama-server -m models/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf \\
    --port 8080 --n-gpu-layers 99   # 0 for CPU-only`;

const code30_3_vllm_bash = `pip install vllm
python -m vllm.entrypoints.openai.api_server \\
    --model meta-llama/Llama-3.1-8B-Instruct \\
    --tensor-parallel-size 1 \\
    --max-model-len 8192 --port 8000

# AWQ quantisation: fits larger model on fewer GPUs
python -m vllm.entrypoints.openai.api_server \\
    --model TheBloke/Llama-2-13B-AWQ --quantization awq`;

const code30_3_vllm_python = `from openai import OpenAI
client = OpenAI(base_url="http://localhost:8000/v1", api_key="vllm")
response = client.chat.completions.create(
    model="meta-llama/Llama-3.1-8B-Instruct",
    messages=[{"role": "user", "content": "Classify..."}],
)`;

const code30_4_hf = `from huggingface_hub import InferenceClient
client = InferenceClient(model="meta-llama/Meta-Llama-3.1-8B-Instruct", token="hf_...")
response = client.text_generation("Classify: 2BHK Bandra", max_new_tokens=100, temperature=0.0)`;

const code30_5_groq = `from groq import Groq
client = Groq(api_key="gsk_...")
response = client.chat.completions.create(
    model="llama-3.1-8b-instant",
    messages=[{"role": "user", "content": "Classify: 2BHK Bandra under 2Cr"}],
    temperature=0, max_tokens=100,
)`;

const code30_6_edge = `# Apple Neural Engine via Core ML
import coremltools as ct
mlmodel = ct.convert(traced_model, compute_units=ct.ComputeUnit.ALL)
mlmodel.save("Phi3Mini.mlpackage")
# Swift: let model = try Phi3Mini(configuration: MLModelConfiguration())
# ~40ms/token on M3 Mac, runs entirely on ANE

# ONNX Runtime — cross-platform (Windows, Linux, Android, WebAssembly)
from optimum.onnxruntime import ORTModelForCausalLM
model = ORTModelForCausalLM.from_pretrained("phi3-mini-onnx")

# Quantise for mobile (Q4 fits in iPhone 15 Pro RAM)
# 3.8B model → ~2.2GB with Q4_K_M`;

const code30_7_static = `Static batching (old): GPU waits for the SLOWEST request to finish before starting new ones
  t=0  [Req A: 10 tokens] [Req B: 10 tokens] [Req C: 10 tokens]  ← batch starts
  t=5  [Req A: done      ] [Req B: 10 tokens] [Req C: 10 tokens]  ← A done, GPU idles
  t=10 [              NEW BATCH STARTS here                     ]  ← B,C done

Continuous batching (vLLM): new requests slot in as soon as a slot frees
  t=0  [Req A: 10 tokens] [Req B: 10 tokens] [Req C: 10 tokens]
  t=5  [Req D: NEW!     ] [Req B: 10 tokens] [Req C: 10 tokens]  ← A done, D inserted
  t=7  [Req D: 5 tokens ] [Req E: NEW!     ] [Req C: 10 tokens]  ← B done, E inserted
`;

const code30_2_ascii = `── Quality / Speed / Memory Triangle ────────────────────────────────────────────

         Memory (GB) — lower is better for edge/laptop
              ▲
              │
      fp16   ●──────────────────────────────────── high memory (14GB)
              │  great quality, slow on CPU
              │
      Q8_0   ●─────────────────────────────── 7GB
              │  near-lossless, 1.5× speed
              │
      Q6_K   ●────────────────────── 5.5GB
              │
    ★ Q4_K_M ●───────────────── 4GB  ← RECOMMENDED SWEET SPOT
              │  ~1% quality loss, 3× faster, runs on 8GB laptop GPU
              │
      Q3_K_M ●──────── 3GB   noticeable quality drop
              │
      Q2_K   ●──── 2.5GB     only for extreme edge (raspberry pi)
              │
              ├───────────────────────────────────────────────────►
         Speed (tokens/sec) — higher is better for production serving

Implication: start with Q4_K_M. If quality drops on your eval set, try Q6_K.
If memory is the constraint (4GB GPU), try Q3_K_M and measure perplexity.`;

const code30_3_paged = `── GPU VRAM Usage: Traditional KV Cache vs PagedAttention ─────────────────────

TRADITIONAL (pre-allocates max context per request):
GPU VRAM (80GB A100)
├── Model weights ████████████████████████████░ 16 GB
├── Request 1 KV  ████████████████░░░░░░░░░░░░  8 GB (max context, 200 actual tokens)
├── Request 2 KV  ████████████████░░░░░░░░░░░░  8 GB (pre-allocated, mostly empty)
├── Request 3 KV  ████████████████░░░░░░░░░░░░  8 GB (pre-allocated, mostly empty)
├── Request 4 KV  ████████████████░░░░░░░░░░░░  8 GB (pre-allocated, mostly empty)
└── [OUT OF VRAM at 5 concurrent requests — OOM error]

PAGEDATTENTION (allocates 16-token pages on demand):
GPU VRAM (80GB A100)
├── Model weights ████████████████████████████░ 16 GB
├── Req 1 KV      ██░░░░░░░░░░░░░░░░░░░░░░░░░░  2 GB (actual 200 tokens = 13 pages)
├── Req 2 KV      ██░░░░░░░░░░░░░░░░░░░░░░░░░░  2 GB
├── Req 3 KV      ██░░░░░░░░░░░░░░░░░░░░░░░░░░  2 GB
├── Req 4 KV      ██░░░░░░░░░░░░░░░░░░░░░░░░░░  2 GB
├── Req 5 KV      ██                             2 GB
├── ...up to ~30 concurrent requests ✓
└── Pages grow as context grows (like OS virtual memory pages)

Result: same GPU → 3–8× more concurrent requests → same cost, 3–8× more throughput`;

export function Mod30() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Run any open-source model locally with Ollama and customise it with a Modelfile</li>
          <li>Explain GGUF quantisation levels and pick the right one for any constraint</li>
          <li>Set up vLLM for production GPU serving with PagedAttention and continuous batching</li>
          <li>Choose between Groq, HuggingFace Endpoints, and vLLM based on latency and cost</li>
          <li>Deploy a model to Apple Neural Engine and ONNX Runtime for on-device inference</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~75 minutes</span>
          <span className="obj-diff">Difficulty: ★★★★☆</span>
          <span className="obj-diff">Prerequisites: Module 31</span>
        </div>
      </div>

      <div className="callout callout-info">
        <strong>Housing.com Context</strong><br />
        Housing.com uses the hosted Anthropic API exclusively. Self-hosted inference (vLLM, Ollama) becomes worth evaluating at ~100K+ queries/day, where per-token API cost exceeds GPU rental. This module gives you the framework to make that decision.
      </div>

      <QuantizationViz />

      <h2>39.1 Ollama — Local Model Serving</h2>
      <pre><code className="language-bash">{code30_1_bash}</code></pre>
      <pre><code className="language-python">{code30_1_python}</code></pre>
      <pre><code className="language-bash">{code30_1_modelfile}</code></pre>
      <p><strong>Use cases:</strong> dev (zero API cost, works offline), privacy prototypes (data never leaves machine), CI pipelines (free LLM calls with <code>phi3:mini</code>), prompt iteration before committing to paid API.</p>

      <h2>39.2 llama.cpp and GGUF Quantisation</h2>
      <pre style={{ fontSize: "11px", background: "#1e1e2e", color: "#cdd6f4", padding: "10px", borderRadius: "4px", margin: "8px 0", overflowX: "auto" }}>{code30_2_ascii}</pre>
      <table>
        <tbody>
          <tr><th>Format</th><th>Bits</th><th>Memory (7B)</th><th>Quality loss</th><th>Speed vs fp16</th></tr>
          <tr><td>fp16</td><td>16</td><td>~14GB</td><td>None (baseline)</td><td>1×</td></tr>
          <tr><td>Q8_0</td><td>8</td><td>~7GB</td><td>Negligible (&lt;0.1%)</td><td>1.5×</td></tr>
          <tr><td>Q6_K</td><td>6</td><td>~5.5GB</td><td>Very small</td><td>2×</td></tr>
          <tr><td><strong>Q4_K_M</strong></td><td>4</td><td>~4GB</td><td>Moderate (~1%)</td><td>3× — <strong>recommended default</strong></td></tr>
          <tr><td>Q3_K_M</td><td>3</td><td>~3GB</td><td>Noticeable</td><td>4×</td></tr>
          <tr><td>Q2_K</td><td>2</td><td>~2.5GB</td><td>Significant</td><td>5× — edge only</td></tr>
        </tbody>
      </table>
      <pre><code className="language-bash">{code30_2_download}</code></pre>
      <div className="callout callout-tip">
        <strong>Q4_K_M is the sweet spot — but what does K_M mean?</strong>
        {" "}3× memory reduction vs fp16, &lt;1% quality loss on most benchmarks. Ollama uses llama.cpp under the hood — <code>ollama pull</code> downloads GGUF files automatically.
        <br /><br />
        <strong>K-quant nomenclature explained:</strong> K-quants use k-means clustering to assign quantisation
        groups — instead of quantising every weight uniformly, they identify clusters of weights with
        similar magnitudes and quantise each cluster with a shared scale factor. M/S/L denote the
        importance weighting applied to different layer types: <code>_M</code> (medium) uses higher precision for
        the most important layers (attention Q/K/V) and lower for less critical ones. This is why Q4_K_M
        outperforms naive Q4_0 (uniform 4-bit) at the same memory footprint. <code>_S</code> is smaller/faster;{" "}
        <code>_L</code> is larger/more accurate.
      </div>

      <PagedAttentionViz />

      <h2>39.3 vLLM — Production GPU Serving</h2>
      <p>vLLM is the production standard for serving open-source LLMs. Its key innovation: <strong>PagedAttention</strong> — KV cache in fixed-size pages allocated on demand, letting the same GPU serve 2–4× more concurrent requests.</p>
      <pre style={{ fontSize: "11px", background: "#1e1e2e", color: "#cdd6f4", padding: "10px", borderRadius: "4px", margin: "8px 0", overflowX: "auto" }}>{code30_3_paged}</pre>
      <div className="callout callout-info">
        <strong>PagedAttention — why it matters</strong>
        {" "}Traditional KV cache pre-allocates the maximum context length for every request upfront, even for
        a 10-token query using a 8K context model — this wastes GPU VRAM proportional to the context
        window × batch size. PagedAttention borrows the OS virtual memory concept: KV cache is split into
        fixed-size pages (e.g., 16 tokens each) and allocated on demand. A 10-token request only holds
        its actual 10 tokens in cache. The freed VRAM lets vLLM serve 2–4× more concurrent requests on
        the same hardware, directly increasing throughput without changing latency.
      </div>
      <div className="callout callout-tip">
        <strong>Getting started without an A100</strong>
        {" "}You don't need $10K/month in GPUs to learn vLLM:
        <ul>
          <li><strong>Google Colab free tier:</strong> T4 16GB — run Llama 3.1 8B with Q4_K_M via llama.cpp or phi3:mini unquantised</li>
          <li><strong>Colab Pro+ (~$50/month):</strong> A100 40GB — run Llama 3.1 8B in full fp16, or 70B with AWQ</li>
          <li><strong>Vast.ai / RunPod spot:</strong> A100 80GB at ~$1.20/hr — stop after each session; pay only for what you use</li>
          <li><strong>HuggingFace Inference Endpoints:</strong> managed GPU, no SSH, no CUDA — just an API call</li>
        </ul>
        For this course, Colab free T4 + Ollama is sufficient to run every example.
      </div>
      <pre><code className="language-bash">{code30_3_vllm_bash}</code></pre>
      <pre><code className="language-python">{code30_3_vllm_python}</code></pre>
      <p><strong>A100 80GB, Llama 3.1 8B:</strong> ~50ms first token, ~2,000 tokens/sec throughput, 100+ concurrent users with PagedAttention.</p>

      <h2>39.4 HuggingFace Inference Endpoints</h2>
      <pre><code className="language-python">{code30_4_hf}</code></pre>
      <p><strong>Cost:</strong> ~$0.60–$1.20/hr for dedicated GPU endpoint. Serverless cold start: 30–90s. Dedicated: always warm, ~$400–$800/month. <strong>When to use:</strong> open-source prototyping without managing GPU infra; enterprise teams needing managed open-source with SLA.</p>

      <h2>39.5 Groq — Ultra-Low Latency</h2>
      <table>
        <tbody>
          <tr><th>Metric</th><th>Groq LPU</th><th>A100 (vLLM)</th><th>Haiku 4.5 API</th></tr>
          <tr><td>Time to first token</td><td>~10ms</td><td>~50ms</td><td>~200ms</td></tr>
          <tr><td>Tokens/second</td><td>800–1,200</td><td>100–200</td><td>50–150</td></tr>
          <tr><td>Cost (Llama 3.1 8B)</td><td>~$0.05/1M tokens</td><td>GPU rental + ops</td><td>$0.80/1M</td></tr>
        </tbody>
      </table>
      <pre><code className="language-python">{code30_5_groq}</code></pre>
      <p><strong>When to use:</strong> real-time streaming where TTFT is user-visible, high-frequency classification at extreme throughput, cost-optimised at very high volume. <strong>Limitations:</strong> limited model selection, no fine-tuning, capacity constraints.</p>
      <div className="callout callout-info">
        <strong>Why Groq is 10× faster than an A100</strong>
        {" "}Groq's LPU (Language Processing Unit) is a SIMD streaming processor with on-chip SRAM — no DRAM
        bandwidth bottleneck. LLM inference is memory-bandwidth-bound: the GPU spends most of its time
        reading weights from HBM (High Bandwidth Memory) into compute units. Groq eliminates this by
        fitting the entire weight matrix in on-chip SRAM (~230 MB/s/GFlop vs ~1 MB/s/GFlop for A100 HBM).
        This is why Groq achieves 800–1,200 tokens/sec on Llama 8B vs 100–200 on A100: the compute
        isn't faster, the memory access is.
      </div>

      <h2>39.6 Edge and On-Device AI</h2>
      <pre><code className="language-python">{code30_6_edge}</code></pre>
      <p><strong>When on-device:</strong> privacy-critical (medical notes, personal data), offline capability (field workers, rural coverage), sub-50ms latency requirement no API can meet, zero per-inference cost after deployment.</p>

      <h2>39.7 Inference Optimisation — Key Concepts</h2>
      <table>
        <tbody>
          <tr><th>Technique</th><th>What it does</th><th>Benefit</th></tr>
          <tr><td>KV Cache</td><td>Stores computed attention keys/values; reuses on next token</td><td>~5× decode speedup vs recomputing</td></tr>
          <tr><td>Prompt caching</td><td>Re-uses KV cache for identical prompt prefix across requests</td><td>~90% cost reduction (Module 2.6)</td></tr>
          <tr><td>Continuous batching</td><td>Inserts new requests mid-generation</td><td>2–4× throughput improvement</td></tr>
          <tr><td>Speculative decoding</td><td>Small draft model generates N tokens; large model verifies in one pass. See callout below.</td><td>2–3× speedup when draft is often correct</td></tr>
          <tr><td>Tensor parallelism</td><td>Splits weight matrices across multiple GPUs</td><td>Enables 70B+ on 4–8 GPUs</td></tr>
          <tr><td>Quantisation</td><td>Reduces weight precision (fp16 → int4)</td><td>3–4× memory reduction, small quality loss</td></tr>
        </tbody>
      </table>
      <div className="callout callout-info">
        <strong>Speculative decoding — how the 2–3× speedup works</strong>
        {" "}The fundamental bottleneck in autoregressive generation: the large model generates <em>one token at a time</em>, sequentially. You cannot parallelise this — each token depends on all previous tokens. Speculative decoding breaks this constraint by introducing a small, fast "draft" model.
        <br /><br />
        <strong>The algorithm:</strong>
        <ol style={{ margin: "6px 0 0 16px" }}>
          <li>The small draft model (e.g. 7B) generates 5–10 candidate tokens very quickly — it's fast because it's small.</li>
          <li>The large target model (e.g. 70B) verifies all N draft tokens in a <em>single forward pass</em> — this is parallelisable because the target model sees all N tokens simultaneously (unlike generation, verification can process them in parallel).</li>
          <li>If the target model agrees with the draft token at position k, all tokens 0..k-1 are accepted for free. If it disagrees at position k, tokens 0..k-1 are kept, token k is replaced with the target model's choice, and drafting restarts.</li>
        </ol>
        <strong>Why it's faster:</strong> When the draft model is right (which it often is for common words, code patterns, obvious continuations), you effectively got N tokens from one forward pass of the large model — N× throughput. The cost of running the small draft model is negligible compared to the large model. Net speedup: 2–3× on typical text, up to 4× on structured output where the draft is very predictable.
      </div>
      <div className="callout callout-info">
        <strong>Continuous batching vs static batching — the throughput gap</strong>
        <pre>{code30_7_static}</pre>
        Result: GPU utilisation goes from ~50% to ~90% under real-world request patterns.
        The 2–4× throughput improvement is from filling GPU idle slots, not from faster computation.
      </div>

      <h2>39.8 Serving Decision Tree</h2>
      <div className="decision-tree">
        <span className="dt-q">What are your constraints?</span><br />│
        <br />├─ Dev / local / prototype
        <br />│   └─ <span className="dt-yes">Ollama</span> <span className="dt-note">(one command, zero cost)</span>
        <br />│
        <br />├─ Production, open-source, GPU available
        <br />│   └─ <span className="dt-yes">vLLM</span> <span className="dt-note">(PagedAttention, continuous batching, OpenAI-compatible)</span>
        <br />│       <span className="dt-note">Use AWQ quantisation to fit larger models on fewer GPUs</span>
        <br />│
        <br />├─ Production, managed, no GPU infra
        <br />│   └─ <span className="dt-yes">HuggingFace Inference Endpoints</span> or <span className="dt-yes">Groq</span>
        <br />│
        <br />├─ Latency-critical (&lt;100ms p95)
        <br />│   └─ <span className="dt-yes">Groq LPU</span> <span className="dt-note">for supported models; vLLM on A100 otherwise</span>
        <br />│
        <br />├─ Cost-critical at 10M+ calls/day
        <br />│   └─ <span className="dt-yes">Self-hosted Llama 3.1 8B on vLLM</span> + Groq API fallback
        <br />│
        <br />├─ Data must not leave device/network
        <br />│   └─ <span className="dt-yes">Ollama</span> (local server) or <span className="dt-yes">llama.cpp</span> (embedded)
        <br />│
        <br />└─ Mobile / iOS / Android / edge
        <br />    └─ <span className="dt-yes">Core ML</span> (Apple) or <span className="dt-yes">ONNX Runtime Mobile</span> (cross-platform)
        <br />        <span className="dt-note">Q4_K_M quantisation to fit model in device RAM</span>
      </div>

      <h2>39.9 AirLLM — Layer-by-Layer Streaming (70B on 4 GB VRAM)</h2>
      <p><strong>Problem it solves:</strong> Running a 70B parameter model normally requires ~140 GB VRAM in fp16. With Q4 quantisation (llama.cpp) you still need ~35 GB — still out of reach for a consumer 4090 (24 GB). AirLLM removes the VRAM floor by <em>streaming one transformer layer at a time</em> from disk, computing, then unloading it before loading the next.</p>

      <div className="callout callout-info">
        <strong>How layer-streaming works</strong><br/>
        On first run, AirLLM splits the model into per-layer shards on disk (one file per transformer block). During a forward pass it loads shard N → runs computation → writes KV to CPU RAM → unloads shard N → loads shard N+1. GPU VRAM peak = one layer (~200 MB for 70B) + KV buffer. I/O and compute are overlapped via prefetching for ~10% speed improvement.
      </div>

      <table>
        <tbody>
          <tr><th>Tool</th><th>Min VRAM for 70B</th><th>Speed (tok/s)</th><th>Use case</th></tr>
          <tr><td><strong>AirLLM</strong></td><td>4 GB (layer streaming)</td><td>~0.7</td><td>Prototyping 70B+ on a consumer GPU — only option below 24 GB</td></tr>
          <tr><td><strong>llama.cpp Q4</strong></td><td>~35 GB</td><td>5–15</td><td>Local single-user inference, best quality/speed balance</td></tr>
          <tr><td><strong>Ollama Q4</strong></td><td>~35 GB</td><td>5–15</td><td>Easiest local setup (wraps llama.cpp)</td></tr>
          <tr><td><strong>vLLM fp16</strong></td><td>~140 GB (4× A100)</td><td>50–100+</td><td>Production multi-user serving</td></tr>
          <tr><td><strong>Groq API</strong></td><td>0 (cloud)</td><td>800–1200</td><td>Ultra-low latency, supported models only</td></tr>
        </tbody>
      </table>

      <pre><code className="language-python">{`pip install airllm

from airllm import AutoModel
import torch

# First run: downloads & splits model into per-layer shards on disk (~140 GB disk space)
# Subsequent runs: reuses shards (fast startup)
model = AutoModel.from_pretrained("meta-llama/Meta-Llama-3.1-70B-Instruct")

# Optional: 4-bit compression for 3× speed boost (at some quality cost)
# model = AutoModel.from_pretrained("meta-llama/Meta-Llama-3.1-70B-Instruct",
#                                   compression="4bit")

# Tokenise
from transformers import AutoTokenizer
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Meta-Llama-3.1-70B-Instruct")
input_text = ["Show 2BHK flats in Mumbai under 2Cr"]
input_ids = tokenizer(input_text, return_tensors="pt", padding=True,
                      truncation=True, max_length=512).input_ids

# Generate — expect 0.5–1 tok/s without compression
output = model.generate(input_ids, max_new_tokens=64)
print(tokenizer.decode(output[0], skip_special_tokens=True))`}</code></pre>

      <div className="viz-2col" style={{margin:'12px 0'}}>
        <div className="viz-col"><div className="viz-col-title">✓ WHEN TO USE AirLLM</div>
          You only have a &lt;24 GB consumer GPU · You need frontier-scale model behaviour (70B+ quality) for a research prototype · You can tolerate minutes-per-query latency · You want to experiment with Llama 405B without renting cloud GPUs · Data privacy requires on-device inference
        </div>
        <div className="viz-col"><div className="viz-col-title" style={{color:'#f38ba8'}}>✗ AVOID AirLLM WHEN</div>
          You need interactive response times — ~0.7 tok/s means 30s for a 20-token answer · Production serving — use vLLM · &lt;70B model — llama.cpp/Ollama is 10-20× faster with same VRAM · You have 24 GB+ VRAM — full Q4 via llama.cpp is always faster
        </div>
      </div>

      <div className="callout callout-tip">
        <strong>AirLLM resources</strong><br/>
        GitHub: github.com/lyogavin/airllm — 20.6k stars, actively maintained · Supports: Llama 3.1 (8B, 70B, 405B), Mistral, Mixtral, Qwen 2.5, ChatGLM, Baichuan · CPU inference supported (v2.10.1+) — extremely slow but works on CPU-only machines · Apple Silicon (MPS) backend supported · Disk space warning: 70B model = ~140 GB shards; 405B = ~800 GB
      </div>

      <div className="callout callout-maang">
        <strong>MAANG Interview: "How would you serve a 70B open-source model to 1M users/day?"</strong>
        {" "}→ 4× A100 80GB with tensor parallelism via vLLM. PagedAttention for concurrent requests. AWQ 4-bit quantisation brings VRAM from 140GB to ~35GB. Cost: A100 at $3/hr = $72/day fixed vs $720/day at Haiku API rates for 1M calls. Monitoring: vLLM Prometheus — track tokens/sec, queue depth, TTFT p95.<br/><br/>
        <strong>Follow-up: "What if your team only has a single 4090 for prototyping?"</strong>
        {" "}→ Two options: (1) Use the 8B model with llama.cpp — same token speed, far less quality; (2) Use AirLLM to stream the 70B layer-by-layer — you get 70B quality but 0.7 tok/s. Acceptable for offline batch evaluation (e.g. running RAGAS sweeps overnight), not for interactive demo. For an interactive demo on a 4090, downsize to 8B or use a cloud API.
      </div>

      <QuizSection moduleId={38} title="Module 38: Running Models" contentHint="Ollama Modelfile custom system prompt, GGUF quantisation Q4_K_M sweet spot quality-speed-memory tradeoff, vLLM PagedAttention vs standard KV cache, continuous batching throughput improvement, Groq LPU TTFT comparison, HuggingFace Inference Endpoints cold start, Core ML Apple Neural Engine on-device, ONNX Runtime cross-platform, serving decision tree by constraint, AirLLM layer-by-layer streaming 70B on 4GB VRAM tradeoff vs llama.cpp vs vLLM, when layer streaming is the only option" />
    </>
  );
}
