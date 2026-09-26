import { QuizSection } from '../components/QuizSection';
import { CodeBlock } from '../components/CodeBlock';

const CODE_1 = `from transformers import pipeline
pipe = pipeline("text-generation", model="meta-llama/Meta-Llama-3.1-8B-Instruct")

from huggingface_hub import InferenceClient
client = InferenceClient(model="mistralai/Mixtral-8x7B-Instruct-v0.1", token="hf_...")
output = client.text_generation("Classify this query...", max_new_tokens=200)`;

const CODE_2 = `from groq import Groq
client = Groq(api_key="gsk_...")
response = client.chat.completions.create(
    model="llama-3.1-8b-instant",
    messages=[{"role": "user", "content": "..."}],
    temperature=0, max_tokens=500,
)`;

const CODE_3 = `from together import Together
client = Together(api_key="...")

# Step 1: upload training file first (must be JSONL, ChatML format)
file_resp = client.files.upload(
    file=open("train.jsonl", "rb"),
    purpose="fine-tune",
)
file_id = file_resp.id   # e.g. "file-abc123"

# Step 2: create fine-tuning job
job = client.fine_tuning.create(
    model="meta-llama/Meta-Llama-3.1-8B-Instruct-Reference",
    training_file=file_id,              # use the uploaded file ID
    n_epochs=3, learning_rate=2e-5, suffix="housing-classifier",
)
# Then serve your fine-tuned model via their inference API — no GPU management needed`;

const CODE_4 = `from openai import OpenAI
client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key="sk-or-...")

response = client.chat.completions.create(
    model="anthropic/claude-sonnet-4-6",
    messages=[{"role": "user", "content": "..."}],
    extra_body={
        "route": "fallback",
        "models": ["anthropic/claude-sonnet-4-6", "openai/gpt-4o"],
    },
)`;

const CODE_5 = `import replicate
output = replicate.run(
    "stability-ai/stable-diffusion:27b93a2413e...",
    input={"prompt": "a property floor plan, architectural style"}
)
# ~$0.000225/sec on T4. Cold start: 30–120s. Warm: ~0ms.`;

const CODE_6 = `import mlflow
with mlflow.start_run():
    mlflow.log_params({"r": 16, "lora_alpha": 32, "epochs": 3, "lr": 2e-4})
    mlflow.log_metric("eval_accuracy", 0.94, step=500)
    mlflow.log_artifact("./housing-classifier-merged")`;

const CODE_7 = `import wandb
wandb.init(project="housing-classifier", config={"r": 16, "epochs": 3})
# Auto-integrates with HuggingFace Trainer:
# TrainingArguments(report_to="wandb", ...)`;

export function Mod32() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Navigate the HuggingFace ecosystem: Hub, Inference Endpoints, Spaces, AutoTrain</li>
          <li>Explain when Groq LPU outperforms GPU-based serving</li>
          <li>Use Together.ai for fine-tuning + managed inference without GPU management</li>
          <li>Route requests across providers via OpenRouter with automatic fallbacks</li>
          <li>Select the right cloud AI platform (Bedrock, Azure OpenAI, Vertex AI) by company context</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~65 minutes</span>
          <span className="obj-diff">Difficulty: ★★★☆☆</span>
          <span className="obj-diff">Prerequisites: Module 35, 36</span>
        </div>
      </div>

      <div className="callout callout-info">
        <strong>Housing.com Context</strong><br />
        Housing.com's ML platform: Anthropic API + LangSmith. This module maps the broader ecosystem — OpenRouter (provider fallback), Together.ai (fine-tuning), HuggingFace (open models) — so you can add providers or build fallback chains.
      </div>

      <h2>41.1 HuggingFace — The Model Hub</h2>
      <p>HuggingFace is the GitHub of AI models and datasets. 500K+ models, 100K+ datasets. Every AI practitioner uses it daily.</p>
      <table>
        <tbody>
          <tr><th>Surface</th><th>What it does</th><th>When to use</th></tr>
          <tr><td><strong>Hub</strong></td><td>Download any model with one command</td><td>Always — model discovery</td></tr>
          <tr><td><strong>Inference API (serverless)</strong></td><td>Free tier, rate limited, cold start</td><td>Prototyping only</td></tr>
          <tr><td><strong>Inference Endpoints</strong></td><td>Dedicated GPU, always warm, SLA</td><td>Production open-source serving</td></tr>
          <tr><td><strong>Spaces</strong></td><td>Gradio/Streamlit apps on free GPU hosting</td><td>Internal demos, sharing prototypes</td></tr>
          <tr><td><strong>AutoTrain</strong></td><td>No-code fine-tuning via UI</td><td>Non-engineers, quick baselines</td></tr>
        </tbody>
      </table>
      <div className="callout callout-warn">
        <strong>Llama models require access approval — do this before running any code</strong>
        <ol>
          <li>Create a HuggingFace account at <code>huggingface.co</code></li>
          <li>Navigate to the model page (e.g. <code>meta-llama/Meta-Llama-3.1-8B-Instruct</code>) and click "Request access" — Meta auto-approves in minutes</li>
          <li>Generate a token at <code>huggingface.co/settings/tokens</code> (read permission is sufficient)</li>
          <li>Run <code>huggingface-cli login --token hf_YOUR_TOKEN</code> in your terminal</li>
        </ol>
        Without these steps, <code>from_pretrained()</code> raises a 401/403 error with a confusing "Repository not found" message, even if the model exists publicly. The same applies to Mistral, Gemma, Qwen, and Phi — all gated models require explicit access approval.
      </div>
      <CodeBlock title="HuggingFace Hub and Inference Client" language="python" keyLine={6} keyNote="InferenceClient avoids local GPU — serverless hosted inference">{CODE_1}</CodeBlock>

      <h2>41.2 Groq — LPU Inference</h2>
      <p>Groq's LPU (Language Processing Unit) is purpose-built for deterministic, ultra-low-latency LLM inference.</p>
      <CodeBlock title="Groq LPU Client" language="python" keyLine={4} keyNote="llama-3.1-8b-instant: Groq's lowest-latency model">{CODE_2}</CodeBlock>
      <table>
        <tbody>
          <tr><th></th><th>Groq LPU</th><th>A100 vLLM</th><th>Haiku 4.5 API</th></tr>
          <tr><td>TTFT</td><td>~10ms</td><td>~50ms</td><td>~200ms</td></tr>
          <tr><td>Tokens/sec</td><td>800–1,200</td><td>100–200</td><td>50–150</td></tr>
          <tr><td>Cost (Llama 3.1 8B)</td><td>$0.05/1M</td><td>~$0.02/1M (amortised)</td><td>$0.80/1M</td></tr>
        </tbody>
      </table>
      <p><strong>Limitations:</strong> ~10 supported models, no fine-tuned model deployment, no vision, capacity constraints at peak.</p>
      <div className="callout callout-warn">
        <strong>Groq rate limits — what you'll hit in production</strong>
        <table>
          <tbody>
            <tr><th>Tier</th><th>RPM</th><th>Tokens/min (Llama 3.1 8B)</th><th>TPD</th></tr>
            <tr><td>Free</td><td>30</td><td>14,400</td><td>500K</td></tr>
            <tr><td>Dev ($5+)</td><td>100</td><td>100K</td><td>5M</td></tr>
            <tr><td>Pro/custom</td><td>Negotiated</td><td>Negotiated</td><td>Unlimited</td></tr>
          </tbody>
        </table>
        At 30 RPM free: fine for prototyping, not production. At 1M calls/day you'd need ~700 RPM —
        requires a paid plan with capacity reservation. Groq doesn't guarantee capacity at peak; build a
        fallback to Haiku or vLLM for production workloads where Groq capacity may not be available.
      </div>

      <h2>41.3 Together.ai — Fine-Tuning + Inference</h2>
      <CodeBlock title="Together.ai Fine-Tuning Job" language="python" keyLine={11} keyNote="training_file must be uploaded first — two-step process">{CODE_3}</CodeBlock>
      <p><strong>Cost:</strong> Training ~$0.80–$3.00/1M tokens. Inference from $0.10/1M. Pricing is 50–70% cheaper than HuggingFace Endpoints for equivalent models.</p>

      <h2>41.4 OpenRouter — Multi-Provider Gateway</h2>
      <CodeBlock title="OpenRouter Fallback Chain" language="python" keyLine={8} keyNote="models list defines fallback order on 5xx or rate limits">{CODE_4}</CodeBlock>
      <p>100+ models, 30+ providers. One API key. Automatic fallback chains, cost comparison dashboard, free models tier.</p>
      <div className="callout callout-info">
        <strong>OpenRouter routing modes</strong>
        <ul>
          <li><code>"route": "fallback"</code> — tries providers in order; triggers on 5xx errors, timeouts, or rate limit responses. Latency penalty only when primary fails.</li>
          <li><code>"route": "cheapest"</code> — routes to the cheapest provider for that model right now (price fluctuates). Best for batch workloads with no latency SLA.</li>
          <li><code>"route": "latency"</code> — routes to the lowest-latency provider based on OpenRouter's live measurements. Best for user-facing streaming.</li>
        </ul>
        Fallback does NOT help if all providers are down for the same model. For true HA, put different
        models as fallbacks: Claude Sonnet → GPT-4o → Gemini 1.5 Pro so a provider outage doesn't
        cascade.
      </div>
      <p><strong>When OpenRouter wins:</strong> Multi-provider resilience, cost benchmarking, prototyping across providers quickly, free-tier exploration.</p>

      <h2>41.5 Replicate — Serverless GPU</h2>
      <CodeBlock title="Replicate Serverless GPU Inference" language="python" keyLine={5} keyNote="Cold start 30–120s; warm call ~0ms — plan for latency spikes">{CODE_5}</CodeBlock>
      <p><strong>When Replicate wins:</strong> One-off inferences, image/video generation, sharing models publicly, prototyping without infrastructure setup.</p>

      <h2>41.6 Cloud AI Services</h2>
      <table>
        <tbody>
          <tr><th>Service</th><th>Models</th><th>Best for</th></tr>
          <tr><td><strong>Amazon Bedrock</strong></td><td>Claude, Llama, Titan, Mistral</td><td>AWS-native teams, enterprise support, Guardrails</td></tr>
          <tr><td><strong>Amazon SageMaker</strong></td><td>Any (bring your own)</td><td>Full MLOps, HPO, model registry, dedicated MLOps team</td></tr>
          <tr><td><strong>Azure OpenAI</strong></td><td>GPT-4o, o1, DALL-E</td><td>Regulated industries on Microsoft infra, GDPR</td></tr>
          <tr><td><strong>Azure ML</strong></td><td>Any via HuggingFace integration</td><td>Non-AWS teams needing MLOps with AutoML</td></tr>
          <tr><td><strong>Google Vertex AI</strong></td><td>Gemini, Llama, Matching Engine</td><td>GCP-native teams, BigQuery integration, vector search</td></tr>
        </tbody>
      </table>

      <h2>41.7 Platform Selection Matrix</h2>
      <table>
        <tbody>
          <tr><th>Use case</th><th>Best platform</th><th>Runner-up</th></tr>
          <tr><td>Find/download any open model</td><td>HuggingFace Hub</td><td>Replicate</td></tr>
          <tr><td>Managed open-source inference</td><td>HuggingFace Endpoints</td><td>Together.ai</td></tr>
          <tr><td>Ultra-low latency (&lt;100ms)</td><td>Groq</td><td>vLLM self-hosted</td></tr>
          <tr><td>Fine-tuning + managed hosting</td><td>Together.ai</td><td>HuggingFace AutoTrain</td></tr>
          <tr><td>Multi-provider fallback</td><td>OpenRouter</td><td>—</td></tr>
          <tr><td>One-off inferences, image gen</td><td>Replicate</td><td>HuggingFace Spaces</td></tr>
          <tr><td>Enterprise on AWS</td><td>Amazon Bedrock</td><td>SageMaker</td></tr>
          <tr><td>Enterprise on Azure</td><td>Azure OpenAI</td><td>Azure ML</td></tr>
          <tr><td>Data team on GCP</td><td>Vertex AI</td><td>—</td></tr>
          <tr><td>Local dev, zero cost</td><td>Ollama</td><td>llama.cpp</td></tr>
        </tbody>
      </table>

      <h2>41.8 Experiment Tracking — MLflow and W&amp;B</h2>
      <CodeBlock title="MLflow Experiment Tracking" language="python" keyLine={3} keyNote="log_params + log_metric together form one reproducible run record">{CODE_6}</CodeBlock>
      <CodeBlock title="W&B Experiment Tracking" language="python" keyLine={2} keyNote="report_to=wandb hooks into HuggingFace Trainer automatically">{CODE_7}</CodeBlock>
      <p><strong>MLflow:</strong> self-hosted or Databricks, GDPR-safe. <strong>W&amp;B:</strong> richer visualisation, hyperparameter sweeps, team collaboration. Both integrate natively with HuggingFace Trainer.</p>

      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection</strong>
        {' '}"Walk me through the ML tooling stack for a new AI feature." → Start with API + prompt engineering; OpenRouter for multi-provider. Add LangSmith for tracing. If fine-tuning is validated: Together.ai or HuggingFace Endpoints, track with W&amp;B. Production serving: vLLM or Groq by latency budget. Monitoring: RAGAS + LangSmith online + custom eval harness.
      </div>

      <QuizSection moduleId={40} title="Module 40" contentHint="HuggingFace Hub Inference Endpoints serverless vs dedicated, Groq LPU TTFT advantage limitations model selection, Together.ai fine-tuning API managed adapter hosting, OpenRouter fallback chain multi-provider resilience, Replicate serverless GPU cold start tradeoff, Amazon Bedrock vs SageMaker use cases, Azure OpenAI regulated industries GDPR, Vertex AI GCP BigQuery integration, MLflow vs W&B self-hosted vs managed tracking" />
    </>
  );
}
