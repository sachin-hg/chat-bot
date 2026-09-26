import { useState } from "react";
import { QuizSection } from "../components/QuizSection";

// FIX 1: 30-Minute Interview Timeline Visualization
function InterviewTimelineViz() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const steps = [
    {
      num: 1,
      name: "Clarify",
      time: "0–5 min",
      detail:
        "State functional and non-functional requirements. Ask about latency SLA, cost ceiling, accuracy floor, scale (DAU, QPS, read:write ratio). Never draw a diagram until you have numbers agreed. Say: 'Before I design anything, I want to lock in 3 constraints.'",
    },
    {
      num: 2,
      name: "High-Level",
      time: "5–10 min",
      detail:
        "Sketch the major components: classifier tier, LLM tier, data stores, serving layer. Show the happy-path data flow. Name the ML framing in the first sentence (e.g., 'This is a regression problem' or 'Two-stage classification pipeline').",
    },
    {
      num: 3,
      name: "Deep Dive",
      time: "10–18 min",
      detail:
        "Walk through the model architecture decision: RAG vs fine-tuning vs zero-shot, single vs two-stage, streaming vs batch. Use a decision tree mentally. Justify each choice with 'we chose X over Y because [specific number] matters more in this context.'",
    },
    {
      num: 4,
      name: "Scale",
      time: "18–23 min",
      detail:
        "Project forward: Redis Cluster at 10M DAU, Kafka partition headroom, ALB sticky sessions for SSE, LLM RPM limits. Identify the NEW bottleneck that wasn't a problem at lower scale. Shows you think in orders of magnitude.",
    },
    {
      num: 5,
      name: "Trade-offs",
      time: "23–27 min",
      detail:
        "Name 2–3 explicit trade-offs with numbers: streaming adds connection overhead but reduces perceived latency by 1.8s; RAG adds 80ms retrieval vs $2K–$40K fine-tuning cost. Mention what you would do differently with more time or budget.",
    },
    {
      num: 6,
      name: "Wrap-up",
      time: "27–30 min",
      detail:
        "Summarize the eval flywheel and monitoring plan. State the rollback strategy (prompt in Redis → revert in <60s). Invite follow-up questions proactively: 'The two areas I'd explore next are X and Y — want to go deeper on either?'",
    },
  ];

  return (
    <div style={{ margin: "24px 0" }}>
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        {/* Connecting line */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            right: "16px",
            height: "2px",
            background: "var(--border)",
            zIndex: 0,
          }}
        />

        {steps.map((step) => {
          const isHovered = hoveredStep === step.num;
          return (
            <div
              key={step.num}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                zIndex: 1,
                cursor: "pointer",
                flex: 1,
                maxWidth: "120px",
              }}
              onMouseEnter={() => setHoveredStep(step.num)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              {/* Number badge */}
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--accent)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "14px",
                  border: isHovered
                    ? "2px solid var(--accent)"
                    : "2px solid transparent",
                  transform: isHovered ? "scale(1.2)" : "scale(1)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  boxShadow: isHovered
                    ? "0 0 0 4px color-mix(in srgb, var(--accent) 20%, transparent)"
                    : "none",
                }}
              >
                {step.num}
              </div>
              {/* Step name */}
              <div
                style={{
                  marginTop: "8px",
                  fontWeight: 600,
                  fontSize: "13px",
                  textAlign: "center",
                  color: isHovered ? "var(--accent)" : "var(--fg)",
                  transition: "color 0.2s ease",
                }}
              >
                {step.name}
              </div>
              {/* Time range */}
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--fg2, #888)",
                  marginTop: "2px",
                  textAlign: "center",
                }}
              >
                {step.time}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tooltip detail */}
      <div
        style={{
          marginTop: "16px",
          minHeight: "80px",
          background: "var(--bg2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md, 8px)",
          padding: "14px 16px",
          fontSize: "14px",
          lineHeight: "1.6",
          transition: "opacity 0.2s ease",
          opacity: hoveredStep !== null ? 1 : 0.4,
        }}
      >
        {hoveredStep !== null ? (
          <>
            <strong style={{ color: "var(--accent)" }}>
              Step {hoveredStep} — {steps[hoveredStep - 1].name}
            </strong>
            <p style={{ margin: "6px 0 0" }}>
              {steps[hoveredStep - 1].detail}
            </p>
          </>
        ) : (
          <span style={{ color: "var(--fg2, #888)" }}>
            Hover a step to see what to say and do in that phase.
          </span>
        )}
      </div>
    </div>
  );
}

// FIX 4: Reusable DecisionTree component
interface TreeNode {
  label: string;
  type?: "question" | "yes" | "no" | "note";
  children?: TreeNode[];
  explanation?: string;
}

function TreeNodeComponent({
  node,
  depth,
}: {
  node: TreeNode;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLeaf = !node.children || node.children.length === 0;
  const colorMap: Record<string, string> = {
    question: "var(--accent)",
    yes: "#a6e3a1",
    no: "#f38ba8",
    note: "var(--fg2, #888)",
  };
  const color = colorMap[node.type ?? "question"] ?? "var(--fg)";

  return (
    <div style={{ paddingLeft: depth === 0 ? 0 : "20px", marginTop: "6px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          borderLeft:
            depth > 0 ? `2px solid color-mix(in srgb, ${color} 40%, var(--border))` : "none",
          paddingLeft: depth > 0 ? "10px" : "0",
          cursor: isLeaf && node.explanation ? "pointer" : "default",
        }}
        onClick={() => {
          if (isLeaf && node.explanation) setExpanded((v) => !v);
        }}
      >
        <span
          style={{
            color,
            fontWeight: node.type === "question" ? 700 : 400,
            fontSize: "14px",
            lineHeight: "1.5",
          }}
        >
          {node.label}
        </span>
        {isLeaf && node.explanation && (
          <span
            style={{
              fontSize: "12px",
              color: "var(--accent)",
              marginLeft: "4px",
              userSelect: "none",
            }}
          >
            {expanded ? "▾" : "▸"}
          </span>
        )}
      </div>
      {isLeaf && node.explanation && expanded && (
        <div
          style={{
            marginLeft: depth > 0 ? "12px" : "0",
            marginTop: "4px",
            padding: "8px 12px",
            background: "var(--bg2)",
            borderRadius: "6px",
            fontSize: "13px",
            color: "var(--fg2, #888)",
            lineHeight: "1.6",
          }}
        >
          {node.explanation}
        </div>
      )}
      {node.children?.map((child, i) => (
        <TreeNodeComponent key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

function DecisionTree({ nodes }: { nodes: TreeNode[] }) {
  return (
    <div
      style={{
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md, 8px)",
        padding: "16px",
        margin: "12px 0",
        fontFamily: "var(--font-mono, monospace)",
      }}
    >
      {nodes.map((node, i) => (
        <TreeNodeComponent key={i} node={node} depth={0} />
      ))}
    </div>
  );
}

export function Mod19() {
  // FIX 3: Collapsible gotcha cards state
  const [openCards, setOpenCards] = useState<Set<number>>(new Set([0]));

  function toggleCard(index: number) {
    setOpenCards((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  // FIX 4: Decision tree data structures
  const twoStageTree: TreeNode[] = [
    {
      label: "Add fast classifier before the main LLM?",
      type: "question",
      children: [
        {
          label: "Is there a bounded set of intents I can enumerate?",
          type: "question",
          children: [
            {
              label:
                "YES → Stage 1 classifier. Routes 60–80% to Tier 0/1/2. (Housing.com: 65% never reach LLM)",
              type: "yes",
              explanation:
                "A bounded intent set means you can train or prompt a small classifier. The payoff is massive: most traffic never touches the expensive LLM. Housing.com routes property_search, price_check, and availability intents deterministically.",
            },
          ],
        },
        {
          label: "Is latency critical (P95 < 500ms)?",
          type: "question",
          children: [
            {
              label:
                "YES → SLM (20ms, $0.0001) vs large LLM 'what kind of request?' (500ms, $0.005)",
              type: "yes",
              explanation:
                "A small language model used purely for classification adds only 20ms and costs 50× less than asking a large LLM to classify the same intent. At 500K DAU this saves $4,225/day.",
            },
          ],
        },
        {
          label: "Is output open-ended? (creative writing, general Q&A)",
          type: "question",
          children: [
            {
              label: "YES → Skip classifier. Can't enumerate open-ended intents.",
              type: "no",
              explanation:
                "Open-ended tasks have no fixed output space. A classifier trained on enumerated intents will thrash and misfire constantly. Route directly to the LLM.",
            },
          ],
        },
        {
          label: "Cost constraint AND >40% traffic handled without LLM?",
          type: "question",
          children: [
            {
              label:
                "YES → Classifier pays for itself. At 500K DAU: $4,225/day saved.",
              type: "yes",
              explanation:
                "Break-even math: SLM adds $0.0001/request. If it deflects 40% of traffic from Sonnet ($0.005), net saving is $0.005 × 0.40 − $0.0001 = $0.0019/request. At 500K DAU × 4.5 sessions that is $4,275/day.",
            },
          ],
        },
      ],
    },
  ];

  const ragTree: TreeNode[] = [
    {
      label: "How to give the model domain knowledge?",
      type: "question",
      children: [
        {
          label: "Knowledge changes frequently? (daily / weekly)",
          type: "question",
          children: [
            {
              label:
                "YES → RAG. Fine-tuning snapshots knowledge at training time.",
              type: "yes",
              explanation:
                "Real case: a retailer fine-tuned on their product catalog. Catalog updated overnight; prices went wrong. RAG retrieves fresh data on every request — no retraining, no stale facts.",
            },
          ],
        },
        {
          label: "Data private per-user or per-tenant?",
          type: "question",
          children: [
            {
              label: "YES → RAG. Can't fine-tune per user at scale.",
              type: "yes",
              explanation:
                "Fine-tuning one model per tenant is prohibitively expensive and operationally complex. RAG isolates tenant data in separate vector namespaces — no cross-tenant leakage, no retraining cost.",
            },
          ],
        },
        {
          label: "Need new BEHAVIOR (reasoning style, output format)?",
          type: "question",
          children: [
            {
              label:
                "YES → Fine-tuning. RAG changes what model knows, not how it reasons.",
              type: "yes",
              explanation:
                "If you need the model to always respond in a specific JSON schema, always hedge claims, or adopt a persona — fine-tuning is the right lever. RAG cannot change the model's reasoning process.",
            },
          ],
        },
        {
          label: "Static knowledge, fits in prompt?",
          type: "question",
          children: [
            {
              label:
                "YES → Zero-shot with few-shot examples. Zero training cost. (What Housing.com does)",
              type: "yes",
              explanation:
                "If your domain knowledge is small enough to fit in a system prompt with examples, zero-shot is fastest to ship and cheapest to maintain. No vector DB, no retraining pipeline.",
            },
          ],
        },
        {
          label: "Static knowledge, too large for prompt?",
          type: "question",
          children: [
            {
              label: "→ Fine-tuning + optional RAG for latest facts.",
              type: "yes",
              explanation:
                "Large static corpora (legal documents, technical manuals) can be baked into weights via fine-tuning. Layer RAG on top only for the volatile subset — pricing, availability, recent events.",
            },
          ],
        },
      ],
    },
  ];

  const etaMLTree: TreeNode[] = [
    {
      label: "What is the ML framing for ETA prediction?",
      type: "question",
      children: [
        {
          label: "Output is a category from a fixed list?",
          type: "question",
          children: [
            {
              label: "→ Classification",
              type: "no",
              explanation:
                "ETA is not a category. Duration in minutes is a continuous value — this framing does not apply here.",
            },
          ],
        },
        {
          label: "Output is a continuous number?",
          type: "question",
          children: [
            {
              label: "→ Regression ← ETA is here. Say this first.",
              type: "yes",
              explanation:
                "ETA is a regression problem. State this in the first sentence of your answer. It signals precision and saves the interviewer from wondering if you know the difference.",
            },
          ],
        },
        {
          label: "Output is a ranked list of items?",
          type: "question",
          children: [
            {
              label: "→ Recommendation / Ranking",
              type: "no",
              explanation:
                "Not applicable to ETA — there is no ranking of candidates here.",
            },
          ],
        },
        {
          label: "Output is generated text?",
          type: "question",
          children: [
            {
              label: "→ Generation (LLM)",
              type: "no",
              explanation:
                "ETA produces a number, not natural language. Using an LLM here would be 100–500ms overhead with no benefit.",
            },
          ],
        },
      ],
    },
  ];

  const etaModelTree: TreeNode[] = [
    {
      label: "Which model type for this regression?",
      type: "question",
      children: [
        {
          label: "Structured tabular input + P95 < 50ms inference",
          type: "question",
          children: [
            {
              label:
                "→ Gradient Boosted Trees (XGBoost / LightGBM): 2–5ms inference, excellent on tabular, interpretable features",
              type: "yes",
              explanation:
                "GBTs are the default choice for structured prediction under tight latency SLAs. They require no GPU, run entirely in CPU memory, and produce feature importance scores that interviewers love.",
            },
          ],
        },
        {
          label: "Unstructured input (map tiles, satellite images)?",
          type: "question",
          children: [
            {
              label:
                "→ Neural network — but adds 20–50ms overhead. V2 problem.",
              type: "no",
              explanation:
                "If you need to learn from satellite imagery or raw GPS trajectories, a neural net is warranted. But this is a V2 concern — start with tabular features and GBTs, prove accuracy, then layer in neural components.",
            },
          ],
        },
      ],
    },
  ];

  // Gotcha card data
  const gotchaCards = [
    {
      num: "Q1",
      title: "Design a customer support bot for a large e-commerce platform",
      body: (
        <>
          <p>
            <strong>Requirements first:</strong> 10M users, P95 &lt; 1s, 50K
            QPS peak, cost &lt;$0.01/session, must never give wrong refund info.
          </p>
          <p>
            <strong>Classifier first:</strong> 70% of tickets are order status,
            returns, shipping — deterministic. Classify → fetch order API →
            template response. No LLM.
          </p>
          <p>
            <strong>Two-stage economics:</strong> Haiku classifier ($0.0001) →
            template OR Sonnet ($0.005). At 50K QPS: 70% template saves
            ~$12,500/day.
          </p>
          <p>
            <strong>RAG for product knowledge:</strong> catalog changes daily →
            RAG not fine-tuning. Vector DB with product embeddings.
          </p>
          <p>
            <strong>Evaluation:</strong> LLM-as-judge on 1,000 daily samples;
            RAGAS for retrieval; session resolution rate as primary online
            metric.
          </p>
          <p>
            <em>
              What makes this L6: cost math is specific, tier strategy is
              quantified, RAG decision explained with "data changes daily"
              reasoning.
            </em>
          </p>
        </>
      ),
    },
    {
      num: "Q2",
      title:
        "SLM classifier accuracy dropped from 94% to 87% overnight. Debug it.",
      body: (
        <>
          <p>
            <strong>Step 1:</strong> Check what changed. Prompt pushed?
            Dependency upgraded? Model version changed? This is the answer 60%
            of the time.
          </p>
          <p>
            <strong>Step 2:</strong> Error distribution. Concentrated in 2–3
            intents = new query patterns examples don't cover. Uniform =
            systemic regression.
          </p>
          <p>
            <strong>Step 3:</strong> Confidence distribution in LangSmith. P50
            drop = systematic. P10 drop = new out-of-distribution inputs.
          </p>
          <p>
            <strong>Step 4:</strong> Pull samples that flipped
            correct→incorrect. Shared lexical patterns? Run in isolation with
            logging up.
          </p>
          <p>
            <strong>Step 5:</strong> Did you add new intents without negative
            examples? New intents overfiring on queries that used to be
            out_of_scope.
          </p>
          <p>
            <em>
              The L6 addition: explain how the annotation queue (Module 14.5)
              captures these failing samples and the flywheel self-corrects
              without a manual audit.
            </em>
          </p>
        </>
      ),
    },
    {
      num: "Q3",
      title: "How do you prevent your AI agent from giving wrong information?",
      body: (
        <>
          <p>
            <strong>Defense-in-depth (never one mechanism):</strong>
          </p>
          <ol style={{ paddingLeft: "20px", lineHeight: "2" }}>
            <li>
              <strong>Grounding</strong> — inject real fetched data as context.
              Model works from facts, not training memory.
            </li>
            <li>
              <strong>Output validation</strong> —{" "}
              <code>validate_output_node</code> strips hallucinated phone
              numbers, invented URLs, prices not in fetched data.
            </li>
            <li>
              <strong>Confidence gating</strong> — SLM confidence &lt; threshold
              → clarification question, not a potentially wrong answer.
            </li>
            <li>
              <strong>LLM-as-judge monitoring</strong> — daily batch flags
              low-faithfulness responses for human review. Issues in hours, not
              months.
            </li>
            <li>
              <strong>Fast rollback</strong> — prompts in Redis. Bad prompt
              reversed in &lt;60 seconds, no deploy required.
            </li>
          </ol>
          <p>
            <em>
              The L6 framing: each layer catches what the previous one misses.
              This demonstrates systems thinking, not a single silver bullet.
            </em>
          </p>
        </>
      ),
    },
    {
      num: "Q4",
      title: "Scale this system to 10M DAU",
      body: (
        <>
          <table>
            <tbody>
              <tr>
                <th>Component</th>
                <th>1M DAU</th>
                <th>10M DAU</th>
                <th>Change Required</th>
              </tr>
              <tr>
                <td>Redis</td>
                <td>~1.5GB</td>
                <td>~15GB</td>
                <td>Redis Cluster, key-slot affinity on session_id</td>
              </tr>
              <tr>
                <td>FastAPI instances</td>
                <td>2–3</td>
                <td>10–15</td>
                <td>ALB with sticky sessions (SSE requirement)</td>
              </tr>
              <tr>
                <td>Kafka events/day</td>
                <td>~4M</td>
                <td>~40M</td>
                <td>Partitions: 4 → 40</td>
              </tr>
              <tr>
                <td>LLM RPM</td>
                <td>~4,000</td>
                <td>~40,000</td>
                <td>
                  Multiple API keys + load-balanced adapters OR Azure PTU
                </td>
              </tr>
              <tr>
                <td>New bottleneck</td>
                <td>—</td>
                <td>SSE connection count</td>
                <td>
                  ALB max ~1M concurrent; plan for distributed load balancing at
                  100M
                </td>
              </tr>
            </tbody>
          </table>
          <p>
            <em>
              The L6 addition: identify the NEW bottleneck that wasn't a problem
              at 1M (SSE connection count at load balancer). Shows you think
              about what breaks at the next order of magnitude, not just the
              current one.
            </em>
          </p>
        </>
      ),
    },
  ];

  // FIX 2: L6 phrase pairs
  const phrasePairs = [
    {
      weak: "Redis is faster",
      strong:
        "Redis at 0.5ms vs Postgres at 8ms. At 200 QPS, 1.5s total latency saved per second — within our 800ms P95 SLA",
    },
    {
      weak: "Streaming improves UX",
      strong:
        "Streaming reduces perceived time-to-first-token from 2.3s to 450ms. Research shows ~20% conversion drop per second of wait — this is a revenue decision",
    },
    {
      weak: "RAG is better than fine-tuning",
      strong:
        "Product catalog updates daily. Fine-tuning: $2K–$40K GPU + 2 weeks. RAG: real-time at $0 retraining cost. Tradeoff: 80ms retrieval latency, within our 800ms SLA",
    },
    {
      weak: "We need better monitoring",
      strong:
        "Out_of_scope rate is 11%, rising 0.5pts/week. At this rate, 1 in 8 user messages hits a taxonomy gap within 6 months. That's the business case for the eval flywheel.",
    },
  ];

  return (
    <>
      {/* FIX 1: InterviewTimelineViz at the very top */}
      <InterviewTimelineViz />

      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>
            Structure any AI system design answer using the 6-step framework in
            30 minutes
          </li>
          <li>
            Apply decision trees to choose between RAG vs fine-tuning, streaming
            vs batch, two-stage vs single model
          </li>
          <li>
            Answer 4 real MAANG Senior/Lead AI Engineer questions at L5/L6 level
          </li>
          <li>
            Quantify every tradeoff: "we chose X over Y because [specific
            number] matters more in our context"
          </li>
          <li>
            Map every module in this course to the specific interview question it
            answers
          </li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">~ 90 minutes</span>
          <span className="obj-diff">Difficulty: 5/5</span>
          <span className="obj-diff">Prerequisites: Modules 3–18</span>
        </div>
      </div>

      <h2>40.1 The Six-Step Framework</h2>
      <div className="diagram-wrap">
        <div className="diagram-title">
          30-minute AI system design interview structure
        </div>
        <table>
          <tbody>
            <tr>
              <th>Step</th>
              <th>Time</th>
              <th>What you cover</th>
            </tr>
            <tr>
              <td>
                <strong>1. Requirements</strong>
              </td>
              <td>5 min</td>
              <td>
                Functional, non-functional (latency SLA, accuracy floor, cost
                ceiling), scale (DAU, QPS, read:write ratio)
              </td>
            </tr>
            <tr>
              <td>
                <strong>2. Data strategy</strong>
              </td>
              <td>5 min</td>
              <td>Training signal, cold start plan, annotation pipeline</td>
            </tr>
            <tr>
              <td>
                <strong>3. Model architecture</strong>
              </td>
              <td>8 min</td>
              <td>
                ML framing, RAG vs fine-tuning vs zero-shot, two-stage if
                needed, fallback strategy
              </td>
            </tr>
            <tr>
              <td>
                <strong>4. Evaluation</strong>
              </td>
              <td>4 min</td>
              <td>
                Offline (accuracy, LLM-as-judge), online (completion, drift),
                eval flywheel
              </td>
            </tr>
            <tr>
              <td>
                <strong>5. Serving &amp; infra</strong>
              </td>
              <td>5 min</td>
              <td>
                Latency budget, caching strategy, concurrency, streaming
                decision
              </td>
            </tr>
            <tr>
              <td>
                <strong>6. Monitoring</strong>
              </td>
              <td>3 min</td>
              <td>Drift detection, rollback strategy, cost alerting</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>40.2 Requirements — The Questions That Prevent Wrong Answers</h2>
      <div className="callout callout-warn">
        <strong>The Most Common Interview Mistake</strong>{" "}
        Jumping to model architecture before stating requirements. This signals
        junior-level thinking. Always get requirements agreed before drawing any
        diagram — and always include numbers (latency in ms, cost in dollars,
        accuracy as a percentage).
      </div>
      <div className="diagram-wrap">
        <div className="diagram-title">
          Housing.com as a worked example — use as interview template
        </div>
        <table>
          <tbody>
            <tr>
              <th>Requirement</th>
              <th>Housing.com Value</th>
              <th>Design Implication</th>
            </tr>
            <tr>
              <td>Core job</td>
              <td>Natural language → property listings</td>
              <td>Multi-node pipeline, not simple chatbot</td>
            </tr>
            <tr>
              <td>Latency SLA</td>
              <td>P95 &lt; 800ms</td>
              <td>Two-stage SLM (20ms), parallel pre-fetch, SSE</td>
            </tr>
            <tr>
              <td>Cost ceiling</td>
              <td>&lt;$0.012/session</td>
              <td>Haiku for SLM ($0.0001), Sonnet for Tier 3b ($0.005)</td>
            </tr>
            <tr>
              <td>Accuracy floor</td>
              <td>Intent classification &gt;92%</td>
              <td>Golden dataset + model_eval CI gate</td>
            </tr>
            <tr>
              <td>Read:write ratio</td>
              <td>~25:1</td>
              <td>Redis for reads; Postgres for durable writes only</td>
            </tr>
            <tr>
              <td>DAU at 18 months</td>
              <td>1M</td>
              <td>Redis Cluster plan, Kafka partition headroom</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>40.3 Decision Trees for Key Architectural Choices</h2>
      <h3>When to Use Two-Stage Architecture</h3>
      <DecisionTree nodes={twoStageTree} />

      <h3>RAG vs Fine-tuning vs Zero-shot</h3>
      <DecisionTree nodes={ragTree} />

      <h2>40.4 Sample MAANG Interview Questions</h2>

      {/* FIX 3: Collapsible gotcha cards */}
      {gotchaCards.map((card, index) => {
        const isOpen = openCards.has(index);
        return (
          <div className="gotcha-card" key={index}>
            <div
              className="gotcha-header"
              style={{ cursor: "pointer" }}
              onClick={() => toggleCard(index)}
            >
              <div className="gotcha-num">{card.num}</div>
              <div className="gotcha-title">{card.title}</div>
              <div
                className="gotcha-chevron"
                style={{
                  transform: isOpen ? "rotate(90deg)" : "none",
                  transition: "transform 0.3s ease",
                  display: "inline-block",
                }}
              >
                ›
              </div>
            </div>
            <div
              style={{
                maxHeight: isOpen ? "600px" : "0",
                overflow: "hidden",
                transition: "max-height 0.3s ease",
              }}
            >
              <div className="gotcha-body">{card.body}</div>
            </div>
          </div>
        );
      })}

      {/* FIX 2: L6 Vocabulary Hero Cards */}
      <h2>40.5 The L6 Formula — Quantifying Tradeoffs</h2>
      <h3>Upgrade Your Vocabulary</h3>
      {phrasePairs.map((pair, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0",
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md, 8px)",
            padding: "16px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              textDecoration: "line-through",
              color: "#f38ba8",
              paddingRight: "16px",
              borderRight: "1px solid var(--border)",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            {pair.weak}
          </div>
          <div
            style={{
              color: "#a6e3a1",
              fontWeight: 600,
              paddingLeft: "16px",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            {pair.strong}
          </div>
        </div>
      ))}
      <p style={{ marginTop: "16px" }}>
        <strong>The formula:</strong> "We chose X over Y because [specific
        measurement] matters more than [specific cost] in our context. At
        [scale], this saves/costs [specific number]."
      </p>

      <h2>40.6 Every Module → One Interview Question</h2>
      <table>
        <tbody>
          <tr>
            <th>Module</th>
            <th>Interview Question It Answers</th>
          </tr>
          <tr>
            <td>0</td>
            <td>"Would you use an autonomous agent for this?"</td>
          </tr>
          <tr>
            <td>1</td>
            <td>
              "How would you stream AI responses?" + "Why not one large model
              for everything?"
            </td>
          </tr>
          <tr>
            <td>2</td>
            <td>"Walk me through your agent's architecture"</td>
          </tr>
          <tr>
            <td>3</td>
            <td>
              "How do you handle concurrent sessions?" + "Handle context window
              limits?"
            </td>
          </tr>
          <tr>
            <td>4</td>
            <td>"How do you integrate external data into an AI response?"</td>
          </tr>
          <tr>
            <td>5</td>
            <td>"How do you test an AI system?"</td>
          </tr>
          <tr>
            <td>6</td>
            <td>"How do you debug an AI agent in production?"</td>
          </tr>
          <tr>
            <td>7</td>
            <td>"How do you safely compare two prompt versions?"</td>
          </tr>
          <tr>
            <td>8</td>
            <td>"What happens when your LLM provider goes down?"</td>
          </tr>
          <tr>
            <td>9</td>
            <td>"How do you prevent prompt injection?"</td>
          </tr>
          <tr>
            <td>10</td>
            <td>"Make this work for multiple enterprise clients"</td>
          </tr>
          <tr>
            <td>11</td>
            <td>"Scale this to 10M DAU"</td>
          </tr>
          <tr>
            <td>12</td>
            <td>"Apply this architecture to [any other domain]"</td>
          </tr>
          <tr>
            <td>13</td>
            <td>"How long does it take to build this?" (realistic estimation)</td>
          </tr>
          <tr>
            <td>14</td>
            <td>"What are the most common failure modes you've seen?"</td>
          </tr>
          <tr>
            <td>15</td>
            <td>"What principles guide your AI system design decisions?"</td>
          </tr>
          <tr>
            <td>16</td>
            <td>"Explain how you'd optimize LLM costs at scale"</td>
          </tr>
          <tr>
            <td>17</td>
            <td>"How does the frontend consume this system?"</td>
          </tr>
          <tr>
            <td>18</td>
            <td>"How do you measure if your AI system is working?"</td>
          </tr>
          <tr>
            <td>19</td>
            <td>"Design [any AI system]"</td>
          </tr>
        </tbody>
      </table>

      <h2>40.7 Case Study: Design Uber's ETA Prediction System</h2>
      <div className="callout callout-info">
        <strong>Why this case study exists</strong>{" "}
        Housing.com was Module 4 of interview prep. This is Module 8: the same
        6-step framework, applied to a domain you've lived in if you're at Uber
        — and a classic question at any ride-sharing or large-tech company. It
        also shows exactly how FE engineering experience translates to AI system
        design thinking.
      </div>

      <div className="diagram-wrap">
        <div className="diagram-title">
          Step 1: Requirements — state these before drawing anything
        </div>
        <table>
          <tbody>
            <tr>
              <th>Requirement</th>
              <th>Value</th>
              <th>Design Implication</th>
            </tr>
            <tr>
              <td>Output type</td>
              <td>Duration in minutes (a number)</td>
              <td>
                <strong>Regression</strong>, not classification — say this in
                the first sentence
              </td>
            </tr>
            <tr>
              <td>Latency SLA</td>
              <td>P95 &lt; 100ms</td>
              <td>No LLM anywhere — ML inference only (GBT ~5ms)</td>
            </tr>
            <tr>
              <td>Accuracy KPI</td>
              <td>|predicted – actual| ≤ 2 min for 80% of trips</td>
              <td>
                RMSE + "% within 2 min" as primary eval metric
              </td>
            </tr>
            <tr>
              <td>Availability</td>
              <td>99.99%</td>
              <td>
                Two-stage — Stage 1 always succeeds, never a blank ETA
              </td>
            </tr>
            <tr>
              <td>Scale</td>
              <td>30M trips/day, ~5K req/s peak</td>
              <td>Stateless prediction service, horizontal scaling</td>
            </tr>
            <tr>
              <td>Read:Write ratio</td>
              <td>~99:1</td>
              <td>
                Cache aggressively — pre-compute common zone pairs
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Step 3: Model Architecture — the decisions that matter</h3>
      <DecisionTree nodes={etaMLTree} />
      <DecisionTree nodes={etaModelTree} />

      <div className="callout callout-tip">
        <strong>Two-Stage — always have a fallback</strong>
        <br />
        Stage 1 (&lt;10ms): route distance → rough estimate using city avg
        speed. <em>Always succeeds.</em>
        <br />
        Stage 2 (&lt;50ms): ML model with real-time features → refined
        estimate. Overwrites Stage 1 when available.
        <br />
        If Stage 2 fails during a deploy or Feature Store outage → Stage 1
        holds. Rider sees "~35 min", not a blank screen. Same graceful
        degradation philosophy as Module 18.4.
      </div>

      <div className="diagram-wrap">
        <div className="diagram-title">Latency budget — 100ms total</div>
        <table>
          <tbody>
            <tr>
              <th>Component</th>
              <th>Budget</th>
              <th>Mechanism</th>
            </tr>
            <tr>
              <td>Network</td>
              <td>~20ms</td>
              <td>Edge routing</td>
            </tr>
            <tr>
              <td>Feature Store lookup</td>
              <td>≤ 10ms</td>
              <td>Co-located with prediction service</td>
            </tr>
            <tr>
              <td>Route graph (Stage 1)</td>
              <td>≤ 10ms</td>
              <td>Pre-loaded in-process, no network</td>
            </tr>
            <tr>
              <td>GBT inference (Stage 2)</td>
              <td>≤ 5ms</td>
              <td>In-memory, no I/O</td>
            </tr>
            <tr>
              <td>Serialization</td>
              <td>≤ 10ms</td>
              <td></td>
            </tr>
            <tr>
              <td>
                <strong>Total used</strong>
              </td>
              <td>
                <strong>~55ms</strong>
              </td>
              <td>45ms headroom against 100ms SLA</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>How FE Experience Maps to This System</h3>
      <table>
        <tbody>
          <tr>
            <th>Your FE Experience</th>
            <th>ETA System Equivalent</th>
          </tr>
          <tr>
            <td>Pre-rendering common routes (SSG/ISR)</td>
            <td>
              Pre-computing ETAs for common zone pairs (batch inference + cache)
            </td>
          </tr>
          <tr>
            <td>CDN edge cache with short TTL</td>
            <td>Feature Store with 5-min TTL for road speed features</td>
          </tr>
          <tr>
            <td>Feature flag + canary release</td>
            <td>A/B test new model on 5% of traffic before full rollout</td>
          </tr>
          <tr>
            <td>Core Web Vitals improving over months</td>
            <td>
              MAE improving over months of new training data (eval flywheel)
            </td>
          </tr>
          <tr>
            <td>P95 latency monitoring per endpoint</td>
            <td>P80/P95 accuracy monitoring per city and time-of-day</td>
          </tr>
          <tr>
            <td>Sticky sessions for WebSocket/SSE</td>
            <td>
              NOT needed here — ETA is stateless. Contrast with SSE chat
              (Module 18.3).
            </td>
          </tr>
        </tbody>
      </table>

      <div className="callout callout-maang">
        <strong>What makes this an L6 answer:</strong>{" "}
        (1) Named "regression" in the first sentence. (2) Two-stage with
        explicit fallback — 99.99% availability. (3) Latency budget broken down
        to component level with specific ms values. (4) Evaluation flywheel
        through automatic label collection (trips are labeled for free). (5)
        Rollback without redeployment — model registry. (6) FE analogies to
        make each decision concrete and credible for an audience that knows your
        background.
        <br />
        <br />
        <strong>Likely follow-up:</strong> "How do you evaluate model quality in
        production without ground-truth labels?"
        <br />
        → Ground-truth labels arrive <em>automatically</em> for ETA — every
        completed trip gives you the actual duration. At trip end, compare
        predicted ETA vs actual minutes. Compute MAE/RMSE on a rolling 24h
        window, sliced by city, time-of-day, and ride type. Alert if MAE rises
        &gt;10% from 7-day baseline. Also track implicit signals: user
        cancellations after seeing the ETA are a leading indicator of model
        errors.{" "}
        <em>
          Note: LLM-as-judge (faithfulness/relevance/coherence) is for natural
          language outputs — it does not apply to a regression model producing a
          number.
        </em>
        <br />
        <br />
        <strong>Likely follow-up:</strong> "Your accuracy metric looks great on
        your test set but prod quality is falling. What do you check?"
        <br />
        → Distribution shift. Test set was labeled 6 months ago; users ask
        different questions now. Look at what's in production that isn't in the
        test set. Add those to the golden dataset immediately. This is why the
        golden dataset is more valuable than the model — stale labels make good
        metrics meaningless.
      </div>

      <QuizSection
        moduleId={46}
        title="Module 46: AI System Design Interviews"
        contentHint="Six-step framework, requirements checklist, decision trees for RAG vs fine-tuning and streaming vs batch, Uber ETA case study regression framing, two-stage architecture, latency budget allocation, tradeoff quantification formula, MAANG interview patterns"
      />
    </>
  );
}
