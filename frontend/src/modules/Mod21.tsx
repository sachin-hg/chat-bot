import { QuizSection } from "../components/QuizSection";

const skillsMapCode = `── FE → AI Engineering Skills Mind Map ─────────────────────────────────────

FRONTEND ENGINEERING                  AI ENGINEERING
─────────────────────────────────     ─────────────────────────────────
State management (Redux, Zustand) ──► LangGraph AgentState TypedDict
                                  ↗
Async/await, Promise chains ───────► asyncio.gather, streaming pipelines
                                  ↗
SSE / WebSocket streaming ─────────► Server-Sent Events for LLM token output
                                  ↗
A/B test framework (Mixpanel) ─────► LLM-as-judge, RAGAS offline eval
                                  ↗
Observability (Sentry, DataDog) ───► LangSmith traces, structured logging
                                  ↗
Feature flags / canary deploy ─────► Model A/B testing, staged prompt rollout
                                  ↗
Caching (SWR, React Query) ────────► Prompt caching, Redis TTL for sessions
                                  ↗
P95 latency ownership ─────────────► Latency budget: 800ms total, 19 nodes
                                  ↗
Component hierarchy (React) ───────► Pipeline nodes: single responsibility

You are NOT starting over. You are applying the same patterns to new primitives.`;

export function Mod21() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this appendix you will be able to</div>
        <ol>
          <li>Map every major FE engineering skill to its AI engineering equivalent (9 direct mappings)</li>
          <li>Answer "Why AI after [N] years in frontend?" with a specific, credible narrative</li>
          <li>Know what each of the 4–5 interview rounds tests and how this course prepares you for it</li>
          <li>Follow a 10-week study plan while working full-time</li>
          <li>Apply the 6-step framework to 5 Uber-domain AI system design scenarios</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~45 minutes</span>
          <span className="obj-diff">Difficulty: ★★☆☆☆</span>
          <span className="obj-diff">Prerequisites: None — read this before anything else</span>
        </div>
      </div>

      <h2>B.1 You Already Know More Than You Think</h2>
      <div className="callout callout-info">
        <strong>Fear 1: "I don't know machine learning."</strong>{" "}
        Reality: You know the engineering patterns that make ML systems work in production. State management (Module 6), concurrency (Module 18), real-time streaming (Modules 4, 19), A/B testing (Module 17). The ML math is learnable in weeks. Production engineering judgment takes years.<br /><br />
        <strong>Fear 2: "I'll compete against ML PhDs."</strong>{" "}
        Reality: Most AI Engineering roles at Uber, Google, Meta are <em>engineering</em> roles that use ML. Interviewers want someone who ships reliable systems. Your production experience — debugging 3am incidents, owning P95 latency — is the differentiator most ML practitioners don't have.
      </div>

      <h2>B.2 Your FE Skills — Mapped to AI Engineering</h2>
      <div className="callout callout-info" style={{fontFamily:'monospace',fontSize:'12px',lineHeight:1.8,whiteSpace:'pre'}}>
        {skillsMapCode}
      </div>
      <p><em>For every row: recall a specific story before your interview. You have 9 ready-made behavioral answers.</em></p>
      <table>
        <tbody>
          <tr><th>Your FE Experience</th><th>AI Engineering Equivalent</th><th>Module</th></tr>
          <tr><td>Running A/B experiments on UI changes</td><td>Experimental design for ML: hypothesis testing, traffic splits, statistical significance — identical methodology</td><td>7</td></tr>
          <tr><td>Instrumenting events (Mixpanel, Amplitude)</td><td>Training data pipelines — event streams become ML model features</td><td>6.5</td></tr>
          <tr><td>Optimizing Core Web Vitals, P95 latency</td><td>Latency budget: P95 ms allocation across pipeline components</td><td>15.7</td></tr>
          <tr><td>Debugging SSE drops, WebSocket reconnects</td><td>Distributed systems failure-mode reasoning</td><td>14</td></tr>
          <tr><td>Monitoring error rates, building alerting</td><td>AI observability: structured logging + online accuracy metrics</td><td>6, 18</td></tr>
          <tr><td>Live map real-time rendering architecture</td><td>Online inference serving: stateless prediction at scale</td><td>11</td></tr>
          <tr><td>Pre-rendering common routes (SSG/ISR)</td><td>Batch inference + caching: pre-compute for high-frequency input combos</td><td>4</td></tr>
          <tr><td>Feature flags + canary releases</td><td>Model A/B testing + staged rollout — same technique, different artifact</td><td>7</td></tr>
          <tr><td>End-to-end latency ownership (API to pixel)</td><td>System-level performance thinking — hardest to teach, easiest to demonstrate</td><td>15.7</td></tr>
        </tbody>
      </table>

      <h2>B.3 The Transition Narrative</h2>
      <table>
        <tbody>
          <tr><th>Weak answer</th><th>What it signals</th></tr>
          <tr><td>"I want to learn something new."</td><td>Boredom. You'll leave once you've learned it.</td></tr>
          <tr><td>"AI is the future."</td><td>Generic. No engagement with actual AI systems.</td></tr>
          <tr><td>"I've always been interested in ML."</td><td>If true, you'd have ML side projects by now.</td></tr>
        </tbody>
      </table>
      <div className="callout callout-info">
        <strong>Strong answer structure</strong><br /><br />
        <em>"In my [N] years on [team] at Uber, I've owned the systems that <strong>display</strong> AI predictions — ETAs, surge indicators, map overlays. I've managed the latency, reliability, and UX of what those models produce. Through that, I developed deep curiosity about the systems upstream: how the ETA is computed, how the surge model decides when to flip.</em><br /><br />
        <em>This course and the prototype I built gave me hands-on experience with the full pipeline: classification, session state, real-time inference, evaluation, monitoring. I realized my engineering skills — production reliability, performance thinking, A/B experimentation — transfer directly. The gap was ML vocabulary and patterns, and I've been closing that deliberately over [N] weeks.</em><br /><br />
        <em>I'm applying for this role because [this team] is working on [specific system]. I want to build that system, not just display its output."</em><br /><br />
        <strong>Structure:</strong> specific FE connection → deliberate learning evidence → clear thesis about <em>this role</em>.
      </div>

      <h2>B.4 Your Interview Loop — Round by Round</h2>
      <table>
        <tbody>
          <tr><th>Round</th><th>What They Test</th><th>How This Course Prepares You</th></tr>
          <tr><td><strong>1: Coding</strong></td><td>Python fluency, AI-adjacent data structures. Concretely: sliding window over token sequences, LRU cache for session data, merge two ranked lists (re-ranking), trie for prefix matching on intent names, min-heap for priority queues in agent task scheduling. NOT tensors or numpy — those appear in ML engineer coding rounds. AI engineering coding rounds test the same patterns as backend rounds but applied to AI system primitives.</td><td>Appendix C + read <code>src/pipeline/nodes/*.py</code> line by line</td></tr>
          <tr><td><strong>2: LLD</strong></td><td>"Design the session store for this agent"</td><td>Module 6 (State), Module 7 (Tools), Module 16 (Security)</td></tr>
          <tr><td><strong>3: HLD / AI System Design</strong></td><td>"Design Uber's ETA system" or fraud detection</td><td>Module 44 six-step framework + Section 19.7 + Section B.6</td></tr>
          <tr><td><strong>4: ML Fundamentals</strong></td><td>"Precision vs recall?" "RAG vs fine-tuning?"</td><td>Appendix A + Module 2 + Module 14</td></tr>
          <tr><td><strong>5: Behavioral</strong></td><td>"Why AI?", "Most ambiguous decision you made?"</td><td>Section B.3 + Module 3 (when agents ARE appropriate)</td></tr>
        </tbody>
      </table>
      <div className="callout callout-maang">
        <strong>Most important round for you: Round 3 (HLD).</strong> Your FE systems thinking applies directly — latency budgets, caching, A/B testing, monitoring. You need the AI vocabulary and a practiced 6-step framework. 5+ practice runs on different domains before the interview.
        <br /><br /><strong>Easiest round: Round 2 (LLD).</strong> Module 6 gives you enough on Redis and optimistic locking to handle any component design question. Production debugging experience shows most clearly here.
      </div>

      <h2>B.5 The 10-Week Study Plan</h2>
      <p><em>~10 hours/week while working full-time. Calibrated for a Lead FE Engineer with zero ML background.</em></p>
      <table>
        <tbody>
          <tr><th>Week</th><th>Focus</th><th>Time</th><th>End-of-Week Goal</th></tr>
          <tr><td><strong>1</strong></td><td>Appendix A + Appendix B + Track B (Module 10)</td><td>~6h</td><td>Confirm you know 30% already. Build confidence.</td></tr>
          <tr><td><strong>2</strong></td><td>Track A (Module 2) + Module 3 (Philosophy)</td><td>~5h</td><td>AI vocabulary. Know why LLM vs rule-based at each decision.</td></tr>
          <tr><td><strong>3</strong></td><td>Module 4 (HLD) + Module 8 (Pipeline)</td><td>~6h</td><td>Draw the full pipeline from memory. Map nodes to FE intuition.</td></tr>
          <tr><td><strong>4</strong></td><td>Module 6 (State) + Module 7 (Tools) + Module 12 (Testing)</td><td>~6h</td><td>Production depth. LLD interview material. Read actual Python files.</td></tr>
          <tr><td><strong>5</strong></td><td>Module 13 (Observability) + Module 17 (A/B) + Module 18 (Production)</td><td>~5h</td><td>Your strongest modules. Write down FE analogies in your own words.</td></tr>
          <tr><td><strong>6</strong></td><td>Module 21 (Gotchas) + Module 22 (Mental Models)</td><td>~4h</td><td>War stories and principles — your interview stories.</td></tr>
          <tr><td><strong>7</strong></td><td>Module 14 (Evaluation) + Module 46 + Section 21.7</td><td>~6h</td><td>The interview framework. Practice the 6 steps out loud.</td></tr>
          <tr><td><strong>8</strong></td><td>6-step framework applied cold to 3 Uber scenarios (ETA, fraud, food recs)</td><td>~8h</td><td>Fluency through doing. Framework without practice is useless.</td></tr>
          <tr><td><strong>9</strong></td><td>Appendix C (Python) + read <code>src/pipeline/nodes/*.py</code> aloud</td><td>~5h</td><td>Coding round readiness.</td></tr>
          <tr><td><strong>10</strong></td><td>Mock interviews. Write transition narrative aloud. 30-min HLD cold.</td><td>~8h</td><td>Simulate the interview, not just study for it.</td></tr>
        </tbody>
      </table>
      <div className="callout callout-warn">
        <strong>Week 8 is the most important.</strong> Spend 2+ hours designing each scenario from blank paper using the six steps, before checking any reference answer. The framework only becomes fluent through execution, not reading.
      </div>

      <h2>B.6 Five Uber-Domain Scenarios to Practice</h2>

      <div className="gotcha-card">
        <div className="gotcha-header"><div className="gotcha-num">S1</div><div className="gotcha-title">Design Uber's ETA prediction system</div><div className="gotcha-chevron">›</div></div>
        <div className="gotcha-body">
          <p>Covered in Module 44.7. Practice from memory: <strong>Regression.</strong> GBT (5ms inference, tabular input). Two-stage with Stage 1 fallback. Feature Store &lt;10ms. Pre-compute common zones (65% cache hit). Evaluate on RMSE + % within 2 min. Monitor by city with rolling 1h accuracy.</p>
        </div>
      </div>

      <div className="gotcha-card">
        <div className="gotcha-header"><div className="gotcha-num">S2</div><div className="gotcha-title">Design Uber's fraud detection for payments</div><div className="gotcha-chevron">›</div></div>
        <div className="gotcha-body">
          <p><strong>ML framing:</strong> Classification (binary: fraud/not-fraud). <strong>Optimize recall</strong> — missing fraud costs more than a false positive. <strong>Features:</strong> device fingerprint, transaction velocity, location anomaly (card in NYC, transaction in Lagos), time-of-day pattern, user history. <strong>Two-stage:</strong> rule-based fast checks first (country mismatch → reject immediately) → GBT for ambiguous. <strong>Serving:</strong> P95 &lt;200ms, synchronous — block the transaction until scored. <strong>Primary metric:</strong> false negative rate, not accuracy.</p>
        </div>
      </div>

      <div className="gotcha-card">
        <div className="gotcha-header"><div className="gotcha-num">S3</div><div className="gotcha-title">Design Uber Eats food recommendations</div><div className="gotcha-chevron">›</div></div>
        <div className="gotcha-body">
          <p><strong>ML framing:</strong> Ranking/Recommendation. Two-tower model: user embedding + restaurant embedding → relevance score. <strong>Features:</strong> user order history, cuisine preference, delivery time estimate, restaurant rating, time-of-day. <strong>Cold start:</strong> new user → area top-10 + diversity boost; new restaurant → placement boost for 50 orders. <strong>Evaluation:</strong> NDCG@10, session-to-order conversion. <strong>Batch vs online:</strong> pre-rank top 200 nightly (batch); re-rank by availability + ETA at request time (online, &lt;50ms).</p>
        </div>
      </div>

      <div className="gotcha-card">
        <div className="gotcha-header"><div className="gotcha-num">S4</div><div className="gotcha-title">Design Uber's surge pricing system</div><div className="gotcha-chevron">›</div></div>
        <div className="gotcha-body">
          <p><strong>ML framing:</strong> Regression (supply-demand imbalance 10 min ahead, per zone). <strong>Features:</strong> current requests/min per zone, driver availability, weather, local events (concerts, stadiums). <strong>Model:</strong> GBT per geographic zone — surge in Manhattan ≠ surge in Queens. <strong>Latency:</strong> P95 &lt;500ms (shown on map, not blocking booking). <strong>Monitoring:</strong> driver complaint rate and cancellation rate as implicit signals that surge is miscalibrated.</p>
        </div>
      </div>

      <div className="gotcha-card">
        <div className="gotcha-header"><div className="gotcha-num">S5</div><div className="gotcha-title">Design Uber's driver-rider matching system</div><div className="gotcha-chevron">›</div></div>
        <div className="gotcha-body">
          <p><strong>ML framing:</strong> Optimization + Ranking — NOT pure classification. A constrained optimization problem where ML predicts edge weights. <strong>ML part:</strong> predict P(driver accepts this rider) and trip duration per (driver, rider) pair. <strong>Optimization:</strong> Hungarian algorithm on weighted bipartite graph. <strong>Key insight:</strong> greedy (nearest driver) is suboptimal system-wide — ML enables globally optimal throughput. State this explicitly. <strong>P95 &lt;1s.</strong> <strong>Fallback:</strong> if algorithm times out → greedy nearest-driver assignment.</p>
          <div className="callout callout-info">
            <strong>Hungarian algorithm — what you need to know for interviews</strong>
            {" "}The Hungarian algorithm solves the <em>assignment problem</em>: given N drivers and M riders, find the matching that minimizes total wait time (or maximizes total P(acceptance)) across ALL pairs simultaneously — not just for each individual pair.
            <br /><br />
            You do NOT need to know the implementation. What interviewers want to hear:
            <ol style={{margin: "4px 0"}}>
              <li>Greedy (assign nearest available driver) locally optimizes per rider but is globally suboptimal — driver A takes rider 1 even though driver B is 30s further away, but driver A was the only good match for rider 2 who gets a 5-minute wait instead.</li>
              <li>Model it as a weighted bipartite graph — drivers on one side, riders on the other, edge weights from the ML model (predicted trip duration × P(acceptance)).</li>
              <li>Use an optimization algorithm (Hungarian, or auction algorithm for real-time) to find the globally optimal matching.</li>
            </ol>
            O(n³) time complexity. Scales to ~10K simultaneous assignments; above that you need approximation algorithms (greedy with swaps). At Uber scale, the matching window is 3–5 seconds — enough time for a fast implementation to run globally optimal.
          </div>
        </div>
      </div>

      <QuizSection moduleId={48} title="Appendix B: FE to AI Transition Playbook" contentHint="Skills mapping from frontend to AI engineering, transition narrative structure, interview round preparation by round type, 10-week study plan while employed, five Uber domain scenarios: ETA regression, fraud classification recall optimization, recommendations ranking, surge regression, matching optimization" />
    </>
  );
}
