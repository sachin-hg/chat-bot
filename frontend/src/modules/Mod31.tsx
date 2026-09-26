import { useState } from 'react';
import { QuizSection } from '../components/QuizSection';

function LoRAViz() {
  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: '8px', padding: '20px', margin: '20px 0', overflow: 'hidden' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6c7086', marginBottom: '14px' }}>LORA — LOW-RANK ADAPTATION: FINE-TUNE 0.4% OF PARAMETERS</div>
      <svg viewBox="0 0 560 220" width="100%" style={{ display: 'block', margin: '0 auto' }} aria-label="LoRA low-rank weight decomposition diagram">
        {/* W matrix */}
        <rect x="20" y="20" width="130" height="120" rx="6" fill="#89b4fa" fillOpacity="0.25" stroke="#89b4fa" strokeWidth="2" />
        <text x="85" y="58" textAnchor="middle" fill="#89b4fa" fontSize="13" fontWeight="bold">W</text>
        <text x="85" y="76" textAnchor="middle" fill="#89b4fa" fontSize="10">4096 × 4096</text>
        <text x="85" y="92" textAnchor="middle" fill="#6c7086" fontSize="9">= 16.7M params</text>
        <text x="85" y="108" textAnchor="middle" fill="#6c7086" fontSize="9">(frozen)</text>

        {/* = sign */}
        <text x="168" y="80" textAnchor="middle" fill="#6c7086" fontSize="20" fontWeight="bold">+</text>

        {/* Delta W label */}
        <text x="300" y="15" textAnchor="middle" fill="#cdd6f4" fontSize="11" fontWeight="bold">LoRA decomposes ΔW into A × B</text>

        {/* A matrix */}
        <rect x="188" y="20" width="46" height="120" rx="6" fill="#a6e3a1" fillOpacity="0.3" stroke="#a6e3a1" strokeWidth="2" />
        <text x="211" y="72" textAnchor="middle" fill="#a6e3a1" fontSize="13" fontWeight="bold">A</text>
        <text x="211" y="88" textAnchor="middle" fill="#a6e3a1" fontSize="9">4096×8</text>
        <text x="211" y="100" textAnchor="middle" fill="#6c7086" fontSize="9">32K</text>
        <text x="211" y="112" textAnchor="middle" fill="#6c7086" fontSize="9">params</text>

        {/* × sign */}
        <text x="246" y="83" textAnchor="middle" fill="#6c7086" fontSize="16" fontWeight="bold">×</text>

        {/* B matrix */}
        <rect x="258" y="70" width="120" height="38" rx="6" fill="#cba6f7" fillOpacity="0.3" stroke="#cba6f7" strokeWidth="2" />
        <text x="318" y="87" textAnchor="middle" fill="#cba6f7" fontSize="13" fontWeight="bold">B</text>
        <text x="318" y="100" textAnchor="middle" fill="#cba6f7" fontSize="9">8×4096 = 32K params</text>

        {/* Rank annotation */}
        <text x="395" y="40" fill="#f9e2af" fontSize="11" fontWeight="bold">r = 8 rank</text>
        <text x="395" y="55" fill="#6c7086" fontSize="10">LoRA params: 65K</text>
        <text x="395" y="68" fill="#a6e3a1" fontSize="10" fontWeight="bold">= 0.4% of original</text>

        {/* Inference formula */}
        <text x="20" y="162" fill="#cdd6f4" fontSize="11">At inference: W' = W + (α/r) × A × B</text>
        <text x="20" y="176" fill="#6c7086" fontSize="10">Adapters can be merged via merge_and_unload() — zero inference overhead</text>

        {/* Parameter ratio bar */}
        <text x="20" y="196" fill="#6c7086" fontSize="10">Parameter ratio:</text>
        <rect x="130" y="184" width="400" height="14" rx="3" fill="#313244" />
        <rect x="130" y="184" width="2" height="14" rx="2" fill="#a6e3a1" />
        <text x="136" y="195" fill="#a6e3a1" fontSize="9">LoRA 65K</text>
        <rect x="130" y="184" width="400" height="14" rx="3" fill="none" stroke="#89b4fa" strokeWidth="1" strokeDasharray="3 2" />
        <text x="350" y="195" fill="#89b4fa" fontSize="9">Full fine-tune: 16.7M params</text>
        <text x="490" y="213" fill="#6c7086" fontSize="9" textAnchor="end">16.7M</text>
        <text x="132" y="213" fill="#a6e3a1" fontSize="9">65K</text>
      </svg>
    </div>
  );
}

function SFTvsDPOViz() {
  const [highlight, setHighlight] = useState<'sft' | 'dpo' | null>(null);

  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: '8px', padding: '20px', margin: '20px 0', overflow: 'hidden' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6c7086', marginBottom: '14px' }}>SFT vs DPO — SUPERVISED FINE-TUNING vs PREFERENCE LEARNING</div>
      <div style={{ marginBottom: '12px' }}>
        <button onClick={() => setHighlight(highlight === 'sft' ? null : 'sft')} style={{ background: highlight === 'sft' ? '#89b4fa22' : '#313244', color: highlight === 'sft' ? '#89b4fa' : '#cdd6f4', border: `1px solid ${highlight === 'sft' ? '#89b4fa' : '#45475a'}`, borderRadius: '6px', padding: '5px 12px', fontSize: '0.78rem', cursor: 'pointer', marginRight: '8px' }}>SFT</button>
        <button onClick={() => setHighlight(highlight === 'dpo' ? null : 'dpo')} style={{ background: highlight === 'dpo' ? '#89b4fa22' : '#313244', color: highlight === 'dpo' ? '#cba6f7' : '#cdd6f4', border: `1px solid ${highlight === 'dpo' ? '#cba6f7' : '#45475a'}`, borderRadius: '6px', padding: '5px 12px', fontSize: '0.78rem', cursor: 'pointer', marginRight: '8px' }}>DPO</button>
      </div>
      <svg viewBox="0 0 560 190" width="100%" style={{ display: 'block', margin: '0 auto' }} aria-label="SFT vs DPO training loop comparison">
        <style>{`@keyframes dashFlow33 { to { stroke-dashoffset: -14; } }`}</style>
        <defs>
          <marker id="sft-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#89b4fa" />
          </marker>
          <marker id="dpo-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#cba6f7" />
          </marker>
          <marker id="dpo-g-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#a6e3a1" />
          </marker>
          <marker id="dpo-r-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#f38ba8" />
          </marker>
        </defs>

        {/* Left — SFT */}
        <rect x="10" y="10" width="240" height="160" rx="6"
          fill={highlight === 'sft' ? '#89b4fa11' : '#1e1e2e'}
          stroke={highlight === 'sft' ? '#89b4fa' : '#313244'} strokeWidth="1.5" />
        <text x="130" y="28" textAnchor="middle" fill="#89b4fa" fontSize="12" fontWeight="bold">SFT</text>
        <text x="130" y="42" textAnchor="middle" fill="#6c7086" fontSize="10">Supervised Fine-Tuning</text>

        {/* Prompt box */}
        <rect x="24" y="52" width="90" height="28" rx="4" fill="#313244" stroke="#45475a" strokeWidth="1" />
        <text x="69" y="65" textAnchor="middle" fill="#cdd6f4" fontSize="10" fontWeight="bold">Prompt</text>
        <text x="69" y="76" textAnchor="middle" fill="#6c7086" fontSize="9">x</text>

        {/* Arrow prompt → completion */}
        <line x1="114" y1="66" x2="136" y2="66" stroke="#89b4fa" strokeWidth="1.5"
          strokeDasharray="4 3" markerEnd="url(#sft-arr)"
          style={{ animation: 'dashFlow33 1s linear infinite' }} />

        {/* Completion box */}
        <rect x="138" y="52" width="96" height="28" rx="4" fill="#313244" stroke="#89b4fa" strokeWidth="1.5" />
        <text x="186" y="65" textAnchor="middle" fill="#89b4fa" fontSize="10" fontWeight="bold">Completion</text>
        <text x="186" y="76" textAnchor="middle" fill="#6c7086" fontSize="9">y</text>

        {/* Loss */}
        <rect x="60" y="102" width="120" height="28" rx="4" fill="#313244" stroke="#f9e2af" strokeWidth="1.5" />
        <text x="120" y="115" textAnchor="middle" fill="#f9e2af" fontSize="10" fontWeight="bold">Cross-Entropy Loss</text>
        <text x="120" y="126" textAnchor="middle" fill="#6c7086" fontSize="9">max P(y | x)</text>

        <line x1="186" y1="80" x2="186" y2="102" stroke="#89b4fa" strokeWidth="1" strokeDasharray="3 2" />
        <line x1="186" y1="91" x2="120" y2="91" stroke="#89b4fa" strokeWidth="1" strokeDasharray="3 2" />
        <line x1="120" y1="91" x2="120" y2="102" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#sft-arr)" />

        <text x="130" y="152" textAnchor="middle" fill="#6c7086" fontSize="9">learns to reproduce demonstrations</text>
        <text x="130" y="164" textAnchor="middle" fill="#89b4fa" fontSize="9" fontWeight="bold">SFT: learns to reproduce</text>

        {/* Divider */}
        <line x1="280" y1="10" x2="280" y2="180" stroke="#45475a" strokeWidth="1" strokeDasharray="4 3" />

        {/* Right — DPO */}
        <rect x="290" y="10" width="260" height="160" rx="6"
          fill={highlight === 'dpo' ? '#cba6f711' : '#1e1e2e'}
          stroke={highlight === 'dpo' ? '#cba6f7' : '#313244'} strokeWidth="1.5" />
        <text x="420" y="28" textAnchor="middle" fill="#cba6f7" fontSize="12" fontWeight="bold">DPO</text>
        <text x="420" y="42" textAnchor="middle" fill="#6c7086" fontSize="10">Direct Preference Optimisation</text>

        {/* Prompt */}
        <rect x="300" y="52" width="70" height="28" rx="4" fill="#313244" stroke="#45475a" strokeWidth="1" />
        <text x="335" y="65" textAnchor="middle" fill="#cdd6f4" fontSize="10" fontWeight="bold">Prompt</text>
        <text x="335" y="76" textAnchor="middle" fill="#6c7086" fontSize="9">x</text>

        {/* Chosen */}
        <line x1="370" y1="58" x2="392" y2="52" stroke="#a6e3a1" strokeWidth="1.5" markerEnd="url(#dpo-g-arr)" />
        <rect x="394" y="40" width="140" height="24" rx="4" fill="#313244" stroke="#a6e3a1" strokeWidth="1.5" />
        <text x="464" y="52" textAnchor="middle" fill="#a6e3a1" fontSize="10" fontWeight="bold">Chosen response y+</text>
        <text x="464" y="61" textAnchor="middle" fill="#6c7086" fontSize="9">(preferred by human)</text>

        {/* Rejected */}
        <line x1="370" y1="72" x2="392" y2="80" stroke="#f38ba8" strokeWidth="1.5" markerEnd="url(#dpo-r-arr)" />
        <rect x="394" y="72" width="140" height="24" rx="4" fill="#313244" stroke="#f38ba8" strokeWidth="1.5" />
        <text x="464" y="84" textAnchor="middle" fill="#f38ba8" fontSize="10" fontWeight="bold">Rejected response y-</text>
        <text x="464" y="93" textAnchor="middle" fill="#6c7086" fontSize="9">(less preferred)</text>

        {/* DPO objective */}
        <rect x="300" y="106" width="234" height="30" rx="4" fill="#313244" stroke="#cba6f7" strokeWidth="1.5" />
        <text x="417" y="119" textAnchor="middle" fill="#cba6f7" fontSize="10" fontWeight="bold">DPO Objective</text>
        <text x="417" y="131" textAnchor="middle" fill="#6c7086" fontSize="9">max log σ(β·log π(y+|x) - β·log π(y-|x))</text>

        <text x="420" y="152" textAnchor="middle" fill="#6c7086" fontSize="9">learns relative preference — no reward model needed</text>
        <text x="420" y="164" textAnchor="middle" fill="#cba6f7" fontSize="9" fontWeight="bold">DPO: learns to prefer better outputs</text>
      </svg>
    </div>
  );
}

const CODE_1 = `Level 1 — Prompt Engineering (minutes, free)
  Structured prompts, few-shot examples, CoT instructions
  Use when: model already has the capability, just needs guidance

Level 2 — RAG / Context Injection (hours, cheap)
  Inject domain knowledge at inference time
  Use when: knowledge is frequently updated or too large for prompts

Level 3 — Fine-Tuning (days, moderate cost)
  Bake style/behaviour/domain patterns into weights
  Use when: consistent output format, proprietary tone, domain vocab
  NOT for: adding new facts (facts hallucinate; RAG > fine-tuning for knowledge)

Level 4 — Train from Scratch (months, very expensive)
  Use when: you are a lab, not a product team`;

const CODE_2 = `Original weight: W ∈ ℝ^(d×k)  — frozen
LoRA delta:      ΔW = A × B   — trained
  A ∈ ℝ^(d×r), B ∈ ℝ^(r×k), where r << d
At inference: W' = W + α/r × ΔW`;

const CODE_3 = `from peft import LoraConfig, get_peft_model, TaskType

config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=16,              # rank — higher = more capacity, more VRAM
    lora_alpha=32,     # scaling factor (typically 2×r)
    lora_dropout=0.05,
    target_modules=["q_proj", "v_proj"],  # which weight matrices get adapters
    bias="none",
)
model = get_peft_model(base_model, config)
# trainable params: ~4M of 6.7B total = 0.06%`;

const CODE_4 = `from transformers import BitsAndBytesConfig
import torch

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",       # NF4 outperforms int4 for LLMs
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
)
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Meta-Llama-3.1-8B",
    quantization_config=bnb_config,
    device_map="auto",
)`;

const CODE_5 = `# Step 1 — Dataset format (ChatML)
dataset = [{
    "messages": [
        {"role": "system",    "content": "You are a property classifier. Output JSON only."},
        {"role": "user",      "content": "3BHK flat in Powai, 1.8Cr, semi-furnished"},
        {"role": "assistant", "content": '{"intent":"property_search","bedroom":3,"location":"Powai","budget_max":18000000}'}
    ]
}]  # 500 diverse examples > 5000 repetitive ones. Hold out 10-20%.`;

const CODE_6 = `from transformers import TrainingArguments
from trl import SFTTrainer

args = TrainingArguments(
    output_dir="./housing-classifier",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,   # effective batch = 16
    learning_rate=2e-4, bf16=True,
    eval_strategy="steps", eval_steps=200,
    warmup_ratio=0.03,
)
trainer = SFTTrainer(model=model, args=args, train_dataset=train_ds,
                     eval_dataset=eval_ds, peft_config=lora_config, max_seq_length=2048)
trainer.train()

# Step 3 — Merge adapters back into base weights
from peft import PeftModel
merged = PeftModel.from_pretrained(base_model, "./housing-classifier").merge_and_unload()
merged.save_pretrained("./housing-classifier-merged")`;

const CODE_7 = `from trl import DPOTrainer, DPOConfig
dpo_config = DPOConfig(beta=0.1)  # KL regularisation weight vs SFT reference
trainer = DPOTrainer(
    model=model, ref_model=ref_model,  # frozen SFT copy
    args=dpo_config,
    train_dataset=pref_dataset,  # {"prompt", "chosen", "rejected"}
)`;

const CODE_8 = `def evaluate_classifier(model, test_examples):
    correct = 0
    for ex in test_examples:
        pred = model.generate(ex["input"])
        try:
            parsed = json.loads(pred)
            if parsed["intent"] == ex["expected_intent"]:
                correct += 1
        except json.JSONDecodeError:
            pass  # invalid JSON = failure
    return correct / len(test_examples)

# Benchmark regression: expect ≤2% MMLU drop vs base model
# Production A/B: shadow mode 24h → compare vs incumbent → promote`;

export function Mod31() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Apply the adaptation hierarchy to decide when fine-tuning is actually needed</li>
          <li>Configure LoRA and QLoRA to fine-tune a 7B–70B model on a single GPU</li>
          <li>Build a complete SFT pipeline: dataset curation → training → evaluation → merge</li>
          <li>Explain DPO as a simpler alternative to RLHF for preference alignment</li>
          <li>Detect and mitigate catastrophic forgetting via training data mix</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~80 minutes</span>
          <span className="obj-diff">Difficulty: ★★★★☆</span>
          <span className="obj-diff">Prerequisites: Module 35, 36</span>
        </div>
      </div>
      <div className="callout callout-info">
        <strong>Housing.com Context</strong><br />
        Housing.com classifies intents via prompt engineering on Haiku. Fine-tuning would create a domain-specialist model fluent in real estate vocabulary (BHK, carpet area, RERA) without the 2K-token taxonomy prompt — potentially cutting classification latency and cost 40–60%.
      </div>

      <LoRAViz />

      <h2>40.0 Minimal Training Loop — Run This First</h2>
      <p>Before TRL and PEFT, understand what they hide. This 50-line loop runs on a free Google Colab T4 and fine-tunes a GPT-2 on 10 Housing.com classification examples. Every framework in this module replaces this code — if you understand this, you can debug anything built on top of it.</p>
      <pre><code className="language-python">{`# Run on Google Colab (free T4 GPU) — File → New notebook → paste this
# !pip install transformers datasets torch -q

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from torch.utils.data import DataLoader, Dataset

MODEL = "gpt2"  # swap for "meta-llama/Llama-3.2-1B" with HF token
tokenizer = AutoTokenizer.from_pretrained(MODEL)
tokenizer.pad_token = tokenizer.eos_token
model = AutoModelForCausalLM.from_pretrained(MODEL)

# ── Dataset: 10 classification examples ──────────────────────────────────────
EXAMPLES = [
    ("show 2BHK in Bandra under 2Cr", "property_search"),
    ("what is carpet area", "general"),
    ("find flats with gym in Powai", "property_search"),
    ("how does home loan work", "general"),
    ("3BHK ready possession Andheri", "property_search"),
] * 2  # double to 10 examples

class IntentDataset(Dataset):
    def __init__(self, examples, tok):
        self.items = [
            tok(f"Classify: {q}\nIntent: {label}", return_tensors="pt",
                padding="max_length", truncation=True, max_length=64)
            for q, label in examples
        ]
    def __len__(self): return len(self.items)
    def __getitem__(self, i):
        item = self.items[i]
        return {k: v.squeeze(0) for k, v in item.items()}

dataset = IntentDataset(EXAMPLES, tokenizer)
loader = DataLoader(dataset, batch_size=2, shuffle=True)

# ── Training loop — 3 epochs, ~2 minutes on T4 ───────────────────────────────
optimizer = torch.optim.AdamW(model.parameters(), lr=5e-5)
model.train()
for epoch in range(3):
    total_loss = 0
    for batch in loader:
        input_ids = batch["input_ids"]
        labels = input_ids.clone()           # causal LM: predict next token
        outputs = model(input_ids, labels=labels)
        loss = outputs.loss
        loss.backward()                      # compute gradients
        optimizer.step()                     # nudge weights
        optimizer.zero_grad()                # clear for next batch
        total_loss += loss.item()
    print(f"Epoch {epoch+1} loss: {total_loss/len(loader):.4f}")

# ── Save ──────────────────────────────────────────────────────────────────────
model.save_pretrained("./intent_gpt2_minimal")
tokenizer.save_pretrained("./intent_gpt2_minimal")`}</code></pre>
      <div className="callout callout-info">
        <strong>TRL SFTTrainer replaces lines 28–50 of this loop.</strong> Now you know what it's hiding: tokenisation, batching, label copying, loss computation, and the optimiser step. When SFTTrainer behaves unexpectedly, the root cause is almost always one of those five things.
      </div>

      <h2>40.1 The Adaptation Hierarchy</h2>
      <div className="callout callout-info"><strong>What are model weights?</strong>
        {' '}A model's weights are a large binary file of floating-point numbers — for Llama 3.1 8B, ~16GB of
        fp16 floats stored in a file called <code>model.safetensors</code>. Each number is a learned parameter:
        a coefficient in a matrix multiplication that transforms the input text into the output prediction.
        Fine-tuning means running gradient descent to nudge those numbers slightly in a direction that
        makes the model better at your specific task. You are not rewriting the model's "knowledge" —
        you are adjusting the mapping from inputs to outputs. This is why fine-tuning on a narrow corpus
        can cause catastrophic forgetting: the nudges that improve narrow task performance subtly degrade
        the general patterns learned during pre-training.
        <br /><br /><strong>Detecting catastrophic forgetting — 3 concrete signals:</strong>
        <ol>
          <li><strong>MMLU regression &gt;2%:</strong> run <code>python -m lm_eval --model hf --model_args pretrained=./fine-tuned --tasks mmlu --num_fewshot 5</code> on both base and fine-tuned. A drop &gt;2 points signals forgetting of general reasoning.</li>
          <li><strong>Model refuses off-topic queries:</strong> test with 20 unrelated prompts ("What is 2+2?", "Summarise this news article") — if fine-tuned model refuses or gives degraded responses, it has over-specialised.</li>
          <li><strong>Output diversity collapse:</strong> send the same prompt 10× with temperature=1. If 8 of 10 responses are near-identical, the model has converged to a degenerate mode. Fix: add more diverse training data and reduce epochs.</li>
        </ol>
        Rule: include 20% general-domain data (e.g., Alpaca, FLAN) with 80% domain-specific data to preserve general capability.
      </div>
      <pre><code className="language-text">{CODE_1}</code></pre>
      <table>
        <tbody>
          <tr><th>Goal</th><th>Right approach</th></tr>
          <tr><td>Answer questions about my product docs</td><td>RAG — knowledge is external, updated</td></tr>
          <tr><td>Consistent JSON output schema</td><td>Prompt engineering + output parser</td></tr>
          <tr><td>Legal-tone responses for contracts</td><td>Fine-tuning — style baked in</td></tr>
          <tr><td>Classify support tickets into 50 categories</td><td>Fine-tuning — narrow structured task</td></tr>
          <tr><td>Summarise long documents</td><td>Prompt + few-shot — capability already exists</td></tr>
          <tr><td>Add facts about my company</td><td>RAG, NOT fine-tuning</td></tr>
        </tbody>
      </table>

      <h2>40.2 Full Fine-Tuning</h2>
      <p>Full fine-tuning updates every weight using supervised examples. <strong>When justified:</strong> 100K+ high-quality examples, scale where model savings justify infra cost, or when LoRA is provably insufficient.</p>
      <p><strong>Catastrophic forgetting:</strong> Fine-tuning on a narrow domain degrades general capability. Mitigate with 80/20 domain+general instruction data mix.</p>
      <table>
        <tbody>
          <tr><th>Model</th><th>Full FT VRAM</th><th>Time</th></tr>
          <tr><td>Llama 3.1 8B</td><td>~80GB (2× A100 40GB)</td><td>Hours–1 day</td></tr>
          <tr><td>Llama 3.1 70B</td><td>~700GB (8× H100)</td><td>Days</td></tr>
        </tbody>
      </table>

      <h2>40.3 LoRA — Low-Rank Adaptation</h2>
      <pre style={{fontSize:'11px',background:'#1e1e2e',color:'#cdd6f4',padding:'10px',borderRadius:'4px',margin:'8px 0',overflowX:'auto'}}>{`── LoRA inside a Transformer Attention Block ────────────────────────────────

Input x ──────────────────────────────────────────────────────────────────►
         │                                                                  │
         ▼                                                                  │
 ┌──────────────────────────────────────────────────────────────────────┐   │
 │  W_q (frozen, 4096×4096 = 16.7M params) ──► Q                      │   │
 │  W_k (frozen)                            ──► K    attention output ─┤   │
 │  W_v (frozen)                            ──► V                      │   │
 └──────────────────────────────────────────────────────────────────────┘   │
         │                                                                   │
 ┌──────────────────────────────────────────────────────────────────────┐   │
 │  LoRA adapter (TRAINED, only these update):                          │   │
 │    A  (4096×16 = 65K params)  ──► B  (16×4096 = 65K params)         │   │
 │    ΔW = A × B  (same shape as W_q, but via low-rank bottleneck)     │   │
 └──────────────────────────────────────────────────────────────────────┘   │
         │                                                                   │
  W' = W_q + (α/r) × ΔW   ← combined at inference (or merged via          │
                               merge_and_unload() to remove overhead)        │
         └────────────────────────────────────────────────────────────────►  │
                                                                         +   │
                                                                   residual ─┘

Trainable params: 2 × (4096 × 16) = 131K  vs  full W: 16.7M  →  0.8% of W`}</pre>
      <p>LoRA freezes original weights and adds small trainable rank-decomposition matrices. This is the practical default for fine-tuning.</p>
      <pre><code className="language-text">{CODE_2}</code></pre>
      <pre><code className="language-python">{CODE_3}</code></pre>
      <div className="callout callout-info"><strong>What are <code>target_modules</code> and which should you choose?</strong>
        {' '}Every transformer attention block contains four projection matrices: <code>q_proj</code> (Query), <code>k_proj</code> (Key), <code>v_proj</code> (Value), and <code>o_proj</code> (Output). <code>{"[\"q_proj\", \"v_proj\"]"}</code> is the minimal effective set from the original LoRA paper — it covers most style and format adaptation with the fewest extra parameters.
        <br /><br />
        <strong>When to add more modules:</strong>
        <ul style={{margin:'6px 0 0 16px'}}>
          <li><strong>Add <code>k_proj</code>, <code>o_proj</code></strong> for stronger attention adaptation (complex reasoning tasks, code generation).</li>
          <li><strong>Add FFN modules (<code>gate_proj</code>, <code>up_proj</code>, <code>down_proj</code>)</strong> when the task requires new factual knowledge, not just style change. The FFN stores facts; the attention heads store patterns.</li>
          <li><strong>Common strong config for code:</strong> <code>{"[\"q_proj\", \"k_proj\", \"v_proj\", \"o_proj\", \"gate_proj\", \"up_proj\", \"down_proj\"]"}</code> — covers all linear layers. More parameters, more VRAM, stronger adaptation.</li>
        </ul>
        Rule of thumb: start with Q+V only. If eval loss plateaus too high, add K+O. If still not enough, add FFN modules.
      </div>
      <div className="callout callout-info"><strong>Why does low-rank adaptation work? (Hu et al. 2021)</strong>
        {' '}The empirical finding from the LoRA paper: the weight changes needed to adapt a pre-trained model
        to a new task have low intrinsic rank. In practice, the useful adaptation signal lives in a small
        subspace of the full weight matrix. A d×k weight matrix (e.g., 4096×4096 = 16.7M params) can be
        approximated by A×B where r=16: 4096×16 + 16×4096 = 131K params — a 99.2% reduction. LoRA
        trains only A and B, adds their product ΔW to the frozen W at inference.
        <br /><br />
        <strong>Choosing rank r:</strong> r=4 works for simple style/format tasks. r=16 is the standard starting point.
        r=64+ for complex tasks like code generation. Higher rank = more capacity = more VRAM = more
        risk of overfitting on small datasets. Start at r=16, tune based on eval loss plateau.
      </div>
      <table>
        <tbody>
          <tr><th>Model</th><th>Full FT VRAM</th><th>LoRA VRAM (r=16)</th></tr>
          <tr><td>Llama 3.1 8B</td><td>~80GB</td><td>~20GB (1× A100 40GB)</td></tr>
          <tr><td>Llama 3.1 13B</td><td>~130GB</td><td>~32GB</td></tr>
          <tr><td>Llama 3.1 70B</td><td>~700GB</td><td>~160GB (2× A100 80GB)</td></tr>
        </tbody>
      </table>

      <h2>40.4 QLoRA — 4-Bit + LoRA</h2>
      <p>QLoRA quantises base model weights to 4-bit NF4 format, then applies LoRA on top. This is the practical path for large models on consumer hardware.</p>
      <div className="callout callout-info"><strong>What is NF4 and why is it better than int4?</strong>
        {' '}NF4 (Normal Float 4) uses a quantisation grid whose bins are spaced according to a normal
        distribution — the most common distribution of pretrained weight values. This means NF4 is
        information-theoretically optimal for normally distributed weights: the dense region around zero
        gets more quantisation bins, the sparse tails get fewer. Standard int4 uses equally-spaced bins,
        which wastes resolution in the tails and loses precision near zero. In practice, NF4 matches int4
        VRAM usage but recovers ~0.2–0.5% of quality loss on language modeling tasks.
      </div>
      <pre><code className="language-python">{CODE_4}</code></pre>
      <table>
        <tbody>
          <tr><th>Model</th><th>QLoRA VRAM</th><th>Hardware</th></tr>
          <tr><td>Llama 3.1 8B</td><td>~6GB</td><td>RTX 3090 or M2 Pro Mac</td></tr>
          <tr><td>Llama 3.1 13B</td><td>~10GB</td><td>RTX 3090 / A10G</td></tr>
          <tr><td>Llama 3.1 70B</td><td>~48GB</td><td>2× RTX 4090 or 1× A100</td></tr>
        </tbody>
      </table>
      <svg width="500" height="220" viewBox="0 0 500 220" style={{display:'block',margin:'12px auto',fontFamily:"'Courier New',monospace"}}>
        <rect width="500" height="220" rx="6" fill="#1e1e2e"/>
        <text x="250" y="20" textAnchor="middle" fill="#cdd6f4" fontSize="11" fontWeight="bold">QLoRA VRAM Breakdown per Model Size</text>
        <rect x="10" y="185" width="12" height="10" fill="#45475a"/><text x="25" y="194" fill="#a6adc8" fontSize="9">Model weights (NF4 4-bit)</text>
        <rect x="165" y="185" width="12" height="10" fill="#89b4fa"/><text x="180" y="194" fill="#a6adc8" fontSize="9">Gradients (BF16)</text>
        <rect x="285" y="185" width="12" height="10" fill="#a6e3a1"/><text x="300" y="194" fill="#a6adc8" fontSize="9">LoRA adapters</text>
        <rect x="390" y="185" width="12" height="10" fill="#fab387"/><text x="405" y="194" fill="#a6adc8" fontSize="9">Overhead</text>
        <text x="28" y="55"  fill="#6c7086" fontSize="9">48GB</text>
        <text x="28" y="115" fill="#6c7086" fontSize="9">24GB</text>
        <text x="28" y="162" fill="#6c7086" fontSize="9">6GB</text>
        <line x1="50" y1="50"  x2="490" y2="50"  stroke="#313244" strokeWidth="1" strokeDasharray="4,3"/>
        <line x1="50" y1="110" x2="490" y2="110" stroke="#313244" strokeWidth="1" strokeDasharray="4,3"/>
        <line x1="50" y1="157" x2="490" y2="157" stroke="#313244" strokeWidth="1" strokeDasharray="4,3"/>
        <text x="115" y="45" textAnchor="middle" fill="#cdd6f4" fontSize="10" fontWeight="bold">Llama 3.1 8B</text>
        <text x="115" y="57" textAnchor="middle" fill="#a6adc8" fontSize="9">~6 GB total</text>
        <text x="115" y="67" textAnchor="middle" fill="#6c7086" fontSize="8">T4 free / RTX 3090</text>
        <rect x="75" y="168.8" width="80" height="3.2"  fill="#fab387"/>
        <rect x="75" y="168.5" width="80" height="0.3"  fill="#a6e3a1"/>
        <rect x="75" y="164.7" width="80" height="3.8"  fill="#89b4fa"/>
        <rect x="75" y="154.5" width="80" height="10.2" fill="#45475a"/>
        <text x="250" y="45" textAnchor="middle" fill="#cdd6f4" fontSize="10" fontWeight="bold">Llama 3.1 13B</text>
        <text x="250" y="57" textAnchor="middle" fill="#a6adc8" fontSize="9">~10 GB total</text>
        <text x="250" y="67" textAnchor="middle" fill="#6c7086" fontSize="8">RTX 3090 / A10G</text>
        <rect x="210" y="167.2" width="80" height="4.8"  fill="#fab387"/>
        <rect x="210" y="167.0" width="80" height="0.2"  fill="#a6e3a1"/>
        <rect x="210" y="161.8" width="80" height="5.2"  fill="#89b4fa"/>
        <rect x="210" y="143.0" width="80" height="18.8" fill="#45475a"/>
        <text x="385" y="45" textAnchor="middle" fill="#cdd6f4" fontSize="10" fontWeight="bold">Llama 3.1 70B</text>
        <text x="385" y="57" textAnchor="middle" fill="#a6adc8" fontSize="9">~48 GB total</text>
        <text x="385" y="67" textAnchor="middle" fill="#6c7086" fontSize="8">2× RTX 4090 / A100</text>
        <rect x="345" y="159.3" width="80" height="12.7" fill="#fab387"/>
        <rect x="345" y="158.0" width="80" height="1.3"  fill="#a6e3a1"/>
        <rect x="345" y="137.7" width="80" height="20.3" fill="#89b4fa"/>
        <rect x="345" y="50.1"  width="80" height="87.6" fill="#45475a"/>
        <line x1="50" y1="172" x2="490" y2="172" stroke="#6c7086" strokeWidth="1"/>
      </svg>
      <div className="callout callout-tip"><strong>Trying fine-tuning for free</strong>
        <ul>
          <li><strong>Google Colab free tier (T4 16GB):</strong> QLoRA Llama 3.1 8B fits in 8GB leaving room for activations. Use <code>gradient_checkpointing=True</code> to trade compute for memory. ~2 hours for 1K examples, 3 epochs.</li>
          <li><strong>Google Colab Pro+ (~$50/month):</strong> A100 40GB access. Run Llama 3.1 70B with QLoRA in ~6 hours. Full fp16 LoRA for 8B runs in ~90 min.</li>
          <li><strong>Vast.ai / RunPod spot (RTX 4090 ~$0.30/hr):</strong> Fine-tune Llama 3.1 8B with QLoRA for &lt;$2 total. Stop the instance immediately after training; GGUF-quantise locally before deploying.</li>
        </ul>
        Minimum dataset: 200 high-quality examples can meaningfully shift output format/style. 500+ is the production threshold. Use the ChatML format shown in 31.5.
      </div>

      <h2>40.5 Fine-Tuning Pipeline</h2>
      <pre><code className="language-python">{CODE_5}</code></pre>
      <div className="callout callout-warn"><strong>What "diverse" actually means for fine-tuning data</strong>
        {' '}Diversity means covering: (1) varied phrasings of the same intent — "2BHK in Bandra", "two
        bedroom flat Bandra", "Bandra 2 bedroom apartment under 2Cr" should all be in training, not
        just one; (2) edge cases and ambiguous inputs — partial queries, typos, mixed Hindi/English, price
        ranges expressed differently; (3) negative examples where the model should <em>not</em> return a
        property_search intent — "what is the EMI formula?" or "who is your CEO?".
        <br /><br />
        A common failure mode: fine-tuned on 2,000 examples that are all variations of the same 10
        templates. The model overfits to those templates and fails on paraphrases it never saw. Measure
        diversity by running your training set through a sentence embedding model and checking for
        clusters — if 80% of examples cluster tightly, you have a diversity problem.
      </div>
      <pre><code className="language-python">{CODE_6}</code></pre>

      <SFTvsDPOViz />

      <h2>40.6 RLHF &amp; DPO</h2>
      <p><strong>RLHF pipeline:</strong> (1) SFT on demonstrations → (2) Reward Model on human preference pairs (A vs B) → (3) PPO to maximise reward model score.</p>
      <p><strong>DPO (Direct Preference Optimisation):</strong> Simpler — skip the reward model, train directly on preference pairs (chosen vs rejected). Fewer moving parts, works well for most alignment goals.</p>
      <p>Two things in the code below need explanation before you read it:</p>
      <ul>
        <li><strong><code>ref_model</code></strong> — a frozen copy of your SFT-trained model. DPO trains by comparing how much more likely the policy model rates <code>chosen</code> vs <code>rejected</code>, relative to how the reference model rated them. Without the reference, the model could "game" the objective by assigning extreme probabilities. The reference acts as a regulariser: "don't drift too far from what the SFT model would say." In practice, you load the same base checkpoint twice — one unfrozen (trains), one frozen (reference).</li>
        <li><strong><code>beta=0.1</code></strong> — controls how strictly the model must stay near the reference distribution. Lower beta (0.05) lets the model change more freely — learns preferences faster but risks losing general capability ("reward hacking"). Higher beta (0.5) keeps it closer to the SFT baseline — safer but learns more slowly. The paper recommends starting at 0.1.</li>
      </ul>
      <pre><code className="language-python">{CODE_7}</code></pre>
      <div className="callout callout-tip"><strong>DPO beta — what it controls</strong>
        {' '}<code>beta=0.1</code> is the KL regularisation weight between the trained policy and the frozen SFT reference.
        Low beta (0.05–0.1) = model can change more freely from the SFT baseline; risk of over-optimising
        the preference signal and losing general capability. High beta (0.3–0.5) = model stays close to
        SFT; safer but slower to learn preferences. Standard starting point: 0.1. If you see the model
        "reward hacking" (gaming the preference metric without improving real quality), increase beta.
        <br /><br />
        <strong>When you need RLHF/DPO:</strong> Safety alignment, toxicity reduction, optimising for a measurable human preference signal. For most product fine-tuning, SFT on good examples is sufficient.
      </div>

      <h2>40.7 Fine-Tuning Evaluation</h2>
      <pre><code className="language-python">{CODE_8}</code></pre>

      <div className="callout callout-maang">
        <strong>MAANG Interview Connection</strong>
        {' '}"When would you fine-tune vs RAG?" — Use the adaptation hierarchy. Fine-tune for style/format/classification consistency. RAG for knowledge and freshness. The most common wrong answer: "fine-tune to add new facts." Facts hallucinate in fine-tuned models — they belong in a retrieval store.
      </div>

      <QuizSection moduleId={39} title="Module 39" contentHint="Adaptation hierarchy prompting RAG fine-tuning scratch, LoRA rank decomposition trainable percentage frozen weights, QLoRA NF4 4-bit VRAM requirements 8B 70B, SFT dataset ChatML format diversity over quantity, DPO vs RLHF preference pairs reward model, catastrophic forgetting 80/20 domain general data mix, merge_and_unload LoRA adapter into base weights, evaluation benchmark regression held-out test set" />
    </>
  );
}
