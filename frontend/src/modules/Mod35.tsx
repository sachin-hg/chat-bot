import { QuizSection } from '../components/QuizSection';

const CODE_1 = `── Company × AI Stack Grid ──────────────────────────────────────────────────
           LLM            Orchestration  Vector DB      Training       Serving
─────────────────────────────────────────────────────────────────────────────
Google   │ Gemini/Gemma  │ Vertex AI    │ ScaNN/Match  │ TPU + JAX    │ Vertex
Meta     │ Llama 3.x     │ PyTorch+FAISS│ FAISS        │ PyTorch      │ Tupperware
Amazon   │ Claude/Titan  │ Bedrock      │ OpenSearch   │ SageMaker    │ Step Fns
Apple    │ Apple Intell. │ Core ML      │ on-device DB │ Internal     │ PCC/Neural
Netflix  │ Whisper+metad │ Metaflow     │ FAISS        │ Flink/Spark  │ Internal
OpenAI   │ GPT-4o/o1     │ Proprietary  │ Azure Cosmos │ Azure GPU    │ Proprietary
Anthropic│ Claude        │ LangGraph    │ Pinecone/pg  │ Internal     │ API+Bedrock

Housing.com interview context:
 Google → Vertex AI pipelines, ML fundamentals, billion-scale
 Meta   → PyTorch, recommender systems, <200ms budget, FAISS
 Amazon → Leadership Principles in every answer, SageMaker, Bedrock
 Apple  → privacy-first, Core ML, on-device, PCC for server-side
 Netflix→ A/B rigor, two-tower retrieval + GBM ranking (NOT LLMs for recs)`;

const CODE_2 = `Layer           Open-Source Choice          Managed Equivalent
────────────────────────────────────────────────────────────────
LLM serving     Ollama / vLLM (Llama 3.1)  Anthropic / OpenAI API
Orchestration   LangGraph                   —
Vector search   ChromaDB / pgvector         Pinecone / Weaviate
Embeddings      BGE-M3 (HuggingFace)        OpenAI text-embedding-3
API layer       FastAPI                     —
Database        PostgreSQL                  AWS RDS
Cache/session   Redis (open-source)         AWS ElastiCache
Streaming       Apache Kafka                AWS Kinesis
Observability   Langfuse (self-hosted)      LangSmith cloud
Experiment      MLflow (self-hosted)        Weights & Biases
────────────────────────────────────────────────────────────────
TCO at 100K DAU (monthly):
  GPU (1x A10G spot, ~$0.30/hr × 720hr):  ~$216
  Ops overhead (0.1 FTE at $200K TC):      ~$1,700
  Total self-hosted:                        ~$1,900/month

  Managed API (Haiku, 100K users × 5 calls/day × 500 tokens):
  Input:  15M tokens × $0.80/1M = $12/day = $360/month
  Output: ~4M tokens × $4.00/1M = $16/day = $480/month
  Total managed:                           ~$840/month

  Verdict: at 100K DAU, managed API is cheaper (no Ops FTE).
  Self-hosted wins at 1M+ DAU where Ops cost amortises.`;

export function Mod35() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this appendix you will be able to</div>
        <ol>
          <li>Map your skills onto the AI stacks used at Google, Meta, Amazon, Apple, Netflix, and OpenAI</li>
          <li>Explain domain-specific AI challenges in fintech, healthcare, e-commerce, and dev tools</li>
          <li>Identify which role archetype (Applied Scientist, ML Engineer, AI Product Engineer…) to target</li>
          <li>Describe a full open-source production AI stack and its cost advantage</li>
          <li>Choose the right learning path for your specific career goal</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~60 minutes</span>
          <span className="obj-diff">Difficulty: ★★☆☆☆</span>
          <span className="obj-diff">Prerequisites: Modules 3–38 (or any relevant subset)</span>
        </div>
      </div>

      <h2>D.1 The Stack Varies</h2>
      <p>The Housing.com stack (Anthropic + LangGraph + FastAPI + PostgreSQL) is one of dozens of valid production stacks. FAANG companies and their ecosystems use very different choices:</p>
      <table>
        <tr><th>Stack flavour</th><th>Companies</th><th>LLM</th><th>Orchestration</th><th>Vector DB</th></tr>
        <tr><td>OpenAI + TypeScript</td><td>Startups, Vercel ecosystem</td><td>GPT-4o</td><td>Vercel AI SDK / custom</td><td>Pinecone</td></tr>
        <tr><td>Anthropic + Python</td><td>AI-native cos</td><td>Claude Sonnet/Haiku</td><td>LangGraph / custom</td><td>Chroma / Pinecone</td></tr>
        <tr><td>AWS Bedrock</td><td>Enterprises on AWS</td><td>Claude, Titan, Llama</td><td>Step Functions / Bedrock Agents</td><td>OpenSearch</td></tr>
        <tr><td>Google Vertex AI</td><td>Enterprises on GCP</td><td>Gemini</td><td>Vertex AI Pipelines</td><td>Matching Engine</td></tr>
        <tr><td>Azure OpenAI</td><td>Regulated industries</td><td>GPT-4o</td><td>Semantic Kernel</td><td>Azure AI Search</td></tr>
        <tr><td>Open-source all the way</td><td>Privacy-first / fintech</td><td>Llama 3.1 70B</td><td>LangGraph / Haystack</td><td>pgvector / Qdrant</td></tr>
      </table>
      <div className="callout callout-tip">
        <strong>Interview tip</strong>
        {" "}Describe your architecture in terms of abstractions — retrieval, generation, orchestration, memory — not vendor names. Every interviewer maps "vector store" to their preferred vendor.
      </div>

      <h2>D.2 Domain-Specific Challenges</h2>
      <table>
        <tr><th>Domain</th><th>Core AI challenge</th><th>Compliance / safety</th><th>Stack tendency</th></tr>
        <tr><td><strong>Fintech</strong></td><td>Sub-100ms classification, fraud signals</td><td>SOX, PCI-DSS, GDPR — zero hallucination on numbers</td><td>Closed-source API, pgvector, no data to third-party</td></tr>
        <tr><td><strong>Healthcare</strong></td><td>Clinical note extraction, prior auth</td><td>HIPAA — PHI cannot leave your VPC</td><td>Self-hosted Llama, ChromaDB local</td></tr>
        <tr><td><strong>E-commerce</strong></td><td>Recommendation + search + Q&amp;A at 100M+ users</td><td>Brand safety, no competitor mention</td><td>High-throughput Bedrock, FAISS/Pinecone, Kafka</td></tr>
        <tr><td><strong>Dev tools</strong></td><td>Code completion, PR review, test generation</td><td>Code IP — no customer code to third-party</td><td>Local Ollama for dev, Groq for CI, CodeLlama</td></tr>
        <tr><td><strong>Legal</strong></td><td>Contract analysis, clause extraction</td><td>Privilege protection, hallucination liability</td><td>Azure OpenAI (private endpoint) + retrieval-only</td></tr>
        <tr><td><strong>Autonomous</strong></td><td>Real-time multi-modal decision</td><td>Safety-critical — human override mandatory</td><td>Edge: ONNX / Core ML; small models, fast inference</td></tr>
      </table>

      <h2>D.3 FAANG Company AI Profiles</h2>
      <pre style={{fontSize: "11px", background: "#1e1e2e", color: "#cdd6f4", padding: "10px", borderRadius: "4px", margin: "8px 0", overflowX: "auto"}}>{CODE_1}</pre>
      <table>
        <tr><th>Company</th><th>Primary models</th><th>Stack signature</th><th>Interview focus</th></tr>
        <tr><td><strong>Google</strong></td><td>Gemini 1.5 Pro/Flash, Gemma (open)</td><td>Vertex AI, Matching Engine, BigQuery ML, TPUs</td><td>ML fundamentals, billion-user scale, TPU training</td></tr>
        <tr><td><strong>Meta</strong></td><td>Llama 3.x (open + fine-tuned)</td><td>PyTorch-native, FAISS, internal Tupperware</td><td>Recommender systems, real-time ranking, PyTorch arch</td></tr>
        <tr><td><strong>Amazon</strong></td><td>Bedrock: Claude, Titan, Llama</td><td>Step Functions, OpenSearch, SageMaker</td><td>Leadership Principles, operational excellence, reliability</td></tr>
        <tr><td><strong>Apple</strong></td><td>Apple Intelligence, Core ML, PCC (Private Cloud Compute)</td><td>Swift, ONNX, on-device Neural Engine</td><td>Privacy by design, on-device quantisation, Swift integration, PCC architecture</td></tr>
        <tr><td><strong>Netflix</strong></td><td>Custom two-tower embeddings, GBM ranker, BPR — not LLMs</td><td>Metaflow, Flink, FAISS, internal A/B platform</td><td>A/B testing rigor, metrics-driven, two-tower retrieval + GBM ranking, novelty vs engagement tradeoffs</td></tr>
        <tr><td><strong>OpenAI</strong></td><td>GPT-4o, o1, DALL-E, Whisper, Sora</td><td>Azure compute, proprietary training infra</td><td>Alignment, RLHF, research-to-product, fine-tuning at scale</td></tr>
      </table>

      <div className="callout callout-info"><strong>Apple PCC — what interviewers actually mean by "private AI"</strong>
        {" "}Private Cloud Compute (PCC) is Apple's server-side AI infrastructure where inference code is
        cryptographically attested — the hardware verifies that only Apple-signed software is running
        before any user data enters the enclave. Unlike traditional cloud, no Apple employee can access
        user requests; third-party auditors can verify the attestation logs. This makes PCC fundamentally
        different from "encrypted in transit" — it is designed so even a compromised Apple employee
        cannot exfiltrate inference data. Interview cue: when asked about privacy-preserving AI at
        Apple, PCC is the answer for server-side; Core ML on-device is the answer for local inference.
        <br /><br />
        <strong>Netflix AI profile correction:</strong> Netflix's core recommendation uses <em>two-tower neural models</em>
        {" "}for retrieval (fast embedding similarity in FAISS) followed by gradient-boosted ranking models
        (GBM/LightGBM) for the final sort. LLMs are used for content metadata enrichment and Q&amp;A —
        not for personalised ranking. Interview trick: interviewers at Netflix will penalise you for
        saying "I'd use GPT-4 for recommendations" — the correct answer is two-tower retrieval + learned
        ranker + A/B controlled rollout.
        <br /><br />
        <strong>Meta's Tupperware:</strong> Tupperware is Meta's internal cluster management system (analogous to
        Kubernetes) — interviewers do NOT expect you to know Tupperware. Say "cluster manager" or
        "container orchestration" if it comes up; the underlying concept maps to K8s.
      </div>

      <h2>D.4 Interview Questions by Company</h2>
      <table>
        <tr><th>Company</th><th>Sample question</th><th>Key angle</th></tr>
        <tr><td>Google</td><td>"Design a real-time recommendation system for YouTube at 2B users."</td><td>Two-tower model, ANN retrieval (ScaNN), TPU serving, feature engineering</td></tr>
        <tr><td>Meta</td><td>"Design feed ranking with LLM-generated quality signals."</td><td>Retrieval + ranking separation, &lt;200ms budget, PyTorch model serving, feature store</td></tr>
        <tr><td>Amazon</td><td>"Design Alexa's skill routing at 10M concurrent requests."</td><td>Amazon separates behavioral (LP-based STAR stories, 50–60% of interview time) from system design rounds. In system design, always state a Leadership Principle first: "Working backwards from the customer, the key constraint is reliability…" Never skip LPs in the Amazon system design round.</td></tr>
        <tr><td>Apple</td><td>"Design on-device document summarisation that works offline."</td><td>Core ML compression, Neural Engine, model update mechanism, no cloud data</td></tr>
        <tr><td>Netflix</td><td>"How do you know if the new recommendation model is actually better?"</td><td>A/B design, watch time vs satisfaction, novelty tradeoffs, guardrail metrics</td></tr>
        <tr><td>OpenAI</td><td>"Fine-tune GPT-4 as a reliable medical coding assistant."</td><td>RLHF/DPO, uncertainty quantification, eval framework, HITL</td></tr>
      </table>

      <h2>D.5 Role Archetypes</h2>
      <table>
        <tr><th>Role</th><th>Core skill</th><th>AI depth</th><th>Typical stack</th><th>US salary</th></tr>
        <tr><td><strong>Applied Scientist</strong></td><td>ML research + deployment</td><td>Deep — training, architecture</td><td>PyTorch, Vertex AI, SageMaker</td><td>$200K–$400K</td></tr>
        <tr><td><strong>ML Engineer</strong></td><td>Training pipelines + serving</td><td>Deep — eval, serving infra</td><td>MLflow, vLLM, Kubernetes</td><td>$180K–$350K</td></tr>
        <tr><td><strong>AI Platform Engineer</strong></td><td>Infra for AI teams</td><td>Wide — tooling, not models</td><td>Ray, Airflow, MLflow</td><td>$180K–$320K</td></tr>
        <tr><td><strong>AI/ML Engineer (generalist)</strong></td><td>End-to-end AI features</td><td>Medium — prompting to fine-tuning</td><td>LangGraph, HuggingFace, FastAPI</td><td>$160K–$300K</td></tr>
        <tr><td><strong>AI Product Engineer</strong></td><td>Features using AI APIs</td><td>Shallow — prompting, integration</td><td>LangChain, Anthropic API, TS</td><td>$150K–$280K</td></tr>
      </table>
      <svg width="500" height="310" viewBox="0 0 500 310" style={{display: "block", margin: "12px auto", fontFamily: "'Courier New',monospace"}}>
        <rect width="500" height="310" rx="6" fill="#1e1e2e"/>
        <text x="250" y="22" textAnchor="middle" fill="#cdd6f4" fontSize="11" fontWeight="bold">AI Engineering Role Archetypes — Skills Venn</text>
        <circle cx="175" cy="145" r="95" fill="#89b4fa" fillOpacity="0.15" stroke="#89b4fa" strokeWidth="2"/>
        <circle cx="325" cy="145" r="95" fill="#a6e3a1" fillOpacity="0.15" stroke="#a6e3a1" strokeWidth="2"/>
        <circle cx="250" cy="252" r="85" fill="#fab387" fillOpacity="0.15" stroke="#fab387" strokeWidth="2"/>
        <text x="110" y="90" textAnchor="middle" fill="#89b4fa" fontSize="10" fontWeight="bold">ML / AI</text>
        <text x="110" y="103" textAnchor="middle" fill="#89b4fa" fontSize="10" fontWeight="bold">Knowledge</text>
        <text x="110" y="116" textAnchor="middle" fill="#a6adc8" fontSize="8">training, eval, models</text>
        <text x="390" y="90" textAnchor="middle" fill="#a6e3a1" fontSize="10" fontWeight="bold">Software</text>
        <text x="390" y="103" textAnchor="middle" fill="#a6e3a1" fontSize="10" fontWeight="bold">Engineering</text>
        <text x="390" y="116" textAnchor="middle" fill="#a6adc8" fontSize="8">systems, APIs, scale</text>
        <text x="250" y="292" textAnchor="middle" fill="#fab387" fontSize="10" fontWeight="bold">Product / Domain</text>
        <text x="250" y="304" textAnchor="middle" fill="#a6adc8" fontSize="8">UX, business, use cases</text>
        <text x="215" y="135" textAnchor="middle" fill="#cdd6f4" fontSize="9" fontWeight="bold">Applied</text>
        <text x="215" y="147" textAnchor="middle" fill="#cdd6f4" fontSize="9" fontWeight="bold">Scientist</text>
        <text x="215" y="159" textAnchor="middle" fill="#a6adc8" fontSize="8">PhD track</text>
        <text x="250" y="180" textAnchor="middle" fill="#f9e2af" fontSize="10" fontWeight="bold">ML Engineer</text>
        <text x="250" y="193" textAnchor="middle" fill="#a6adc8" fontSize="8">all three circles</text>
        <text x="310" y="217" textAnchor="middle" fill="#cdd6f4" fontSize="9" fontWeight="bold">AI Product</text>
        <text x="310" y="229" textAnchor="middle" fill="#cdd6f4" fontSize="9" fontWeight="bold">Engineer</text>
        <text x="310" y="241" textAnchor="middle" fill="#a6adc8" fontSize="8">FE entry point ★</text>
        <text x="285" y="135" textAnchor="middle" fill="#cdd6f4" fontSize="9" fontWeight="bold">AI Platform</text>
        <text x="285" y="147" textAnchor="middle" fill="#cdd6f4" fontSize="9" fontWeight="bold">Engineer</text>
        <text x="285" y="159" textAnchor="middle" fill="#a6adc8" fontSize="8">tooling/infra focus</text>
        <text x="380" y="240" fill="#f38ba8" fontSize="9">← start here</text>
        <text x="380" y="252" fill="#a6adc8" fontSize="8">FE → AI transition</text>
      </svg>
      <div className="callout callout-info">
        <strong>For FE engineers transitioning:</strong> Target "AI Product Engineer" or "AI/ML Engineer (generalist)" first. These roles value full-stack product intuition + AI integration over deep ML theory. The Housing.com project demonstrates exactly this combination.
      </div>
      <div className="callout callout-tip"><strong>How these roles map to MAANG job titles</strong>
        <table>
          <tr><th>Company</th><th>What to search</th><th>Role maps to</th></tr>
          <tr><td>Google</td><td>"Software Engineer, Google AI" or "SWE, Search / Ads AI"</td><td>AI/ML Engineer or Applied Scientist depending on PhD</td></tr>
          <tr><td>Meta</td><td>"Production Engineer, AI Infrastructure" or "Software Engineer, Ranking"</td><td>ML Engineer or AI Platform Engineer</td></tr>
          <tr><td>Amazon</td><td>"Applied Scientist" (PhD track) or "SDE III, Alexa AI"</td><td>SDE = AI Product/ML Eng; AS = Applied Scientist</td></tr>
          <tr><td>Apple</td><td>"Machine Learning Engineer" or "AI/ML Software Engineer"</td><td>ML Engineer; privacy focus → AI Platform Engineer</td></tr>
          <tr><td>Netflix</td><td>"Senior Software Engineer, Personalization" or "ML Engineer, Recommendations"</td><td>ML Engineer (strong A/B testing skills required)</td></tr>
          <tr><td>OpenAI</td><td>"Deployment Engineer" or "Researcher, Post-Training"</td><td>Applied Scientist (PhD expected) or ML Eng</td></tr>
        </table>
        Titles are not standardised — "SWE with ML focus" at Google ≠ "Applied Scientist" at Amazon ≠ "ML Engineer" at Netflix. Read JDs carefully; ignore titles, read the requirements list.
      </div>

      <h2>D.6 The Full Open-Source Production Stack</h2>
      <pre><code className="language-text">{CODE_2}</code></pre>

      <h2>D.7 Learning Paths (Full Updated Map)</h2>
      <table>
        <tr><th>Goal</th><th>Path</th></tr>
        <tr><td>RAG Specialist</td><td>App A → Mod 16 → Mod 26 → Mod 27 → Mod 28 → Mod 18</td></tr>
        <tr><td>Models &amp; Infrastructure</td><td>Mod 29 → Mod 30 → Mod 31 → Mod 32</td></tr>
        <tr><td>Agent Engineering</td><td>Mod 0 → Mod 24 → Mod 33 → Mod 34</td></tr>
        <tr><td>FE → AI (Non-Uber / FAANG)</td><td>App A → App B → App D → Mod 29 → Mod 33 → Mod 19 → App C</td></tr>
        <tr><td>Full Toolbelt (new modules)</td><td>Mods 23–24 → 25–26 → 27–28 → 29–30 → 31–32 → 33–34 → App D</td></tr>
        <tr><td>FE Engineer, new to AI</td><td>App A → Track B (17) → Track A (16) → Modules 3–15 → 18 → 19</td></tr>
        <tr><td>MAANG AI interview prep</td><td>App A → Mods 18 + 19 first → fill gaps → App B → App D</td></tr>
        <tr><td>Technical leader / VP</td><td>Mods 0, 7, 8, 11, 15, 19, 29, 33. Deep-dive where team focuses.</td></tr>
      </table>
      <p><small><strong>Key:</strong> App A = Appendix A (Housing.com System Design), App B = Appendix B (MAANG Scenarios), App C = Appendix C (Production Playbook), App D = Appendix D (this module). Track A = LLM Fundamentals (Mod 16), Track B = Frontend/Streaming (Mod 17).</small></p>

      <div className="callout callout-maang">
        <strong>🎯 Final thought</strong>
        {" "}The best AI engineers are not the ones who know the most tools — they're the ones who know which tool to pick, why, and what it costs. You now have the vocabulary, the mental models, and the practical experience. The Housing.com codebase is the proof. Now go build something of your own.
      </div>

      <QuizSection moduleId={47} title="Appendix D: AI Engineering Across the Industry" contentHint="Stack variety OpenAI TypeScript vs Anthropic Python vs AWS Bedrock, fintech zero hallucination on numbers data sovereignty, healthcare HIPAA PHI cannot leave VPC self-hosted, Google TPU Vertex AI ScaNN recommendation, Meta PyTorch FAISS open-source Llama, Amazon Bedrock Leadership Principles operational excellence, Apple on-device Core ML privacy Neural Engine, Netflix A/B testing rigor guardrail metrics, Applied Scientist vs ML Engineer vs AI Product Engineer salary, open-source stack cost 100K DAU vs managed API" />
    </>
  );
}
