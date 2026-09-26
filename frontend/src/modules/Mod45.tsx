import { useState } from 'react';
import { QuizSection } from "../components/QuizSection";
import { CodeBlock, CodeDiff } from '../components/CodeBlock';

// ── Visualization Components ───────────────────────────────────────────────

function JudgeBiasViz() {
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>LLM-AS-JUDGE BIASES — 3 SYSTEMATIC FAILURES AND HOW TO FIX THEM</div>
      <svg viewBox="0 0 560 220" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="LLM-as-Judge bias types">
        {/* Panel outlines */}
        <rect x="0" y="0" width="175" height="190" rx="6" fill="#1e1e2e" stroke="#f38ba8" strokeWidth="1.5"/>
        <rect x="192" y="0" width="175" height="190" rx="6" fill="#1e1e2e" stroke="#f38ba8" strokeWidth="1.5"/>
        <rect x="384" y="0" width="176" height="190" rx="6" fill="#1e1e2e" stroke="#f38ba8" strokeWidth="1.5"/>

        {/* Panel 1: Position Bias */}
        <text x="87" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="#f38ba8">Position Bias</text>
        <text x="87" y="34" textAnchor="middle" fontSize="9" fill="#6c7086">Same answer, position changes score</text>
        {/* Answer A bar */}
        <rect x="20" y="44" width="135" height="18" rx="4" fill="#313244" stroke="#45475a"/>
        <text x="28" y="57" fontSize="9" fill="#cdd6f4">Answer A (presented first)</text>
        <rect x="20" y="68" width="120" height="10" rx="3" fill="#313244"/>
        <rect x="20" y="68" width="95" height="10" rx="3" fill="#f9e2af"/>
        <text x="122" y="77" fontSize="9" fill="#f9e2af">4.7</text>
        {/* Answer B bar */}
        <rect x="20" y="84" width="135" height="18" rx="4" fill="#313244" stroke="#45475a"/>
        <text x="28" y="97" fontSize="9" fill="#cdd6f4">Answer B (same text, 2nd)</text>
        <rect x="20" y="104" width="120" height="10" rx="3" fill="#313244"/>
        <rect x="20" y="104" width="62" height="10" rx="3" fill="#f38ba8"/>
        <text x="89" y="113" fontSize="9" fill="#f38ba8">3.1</text>
        <text x="87" y="132" textAnchor="middle" fontSize="9" fill="#f38ba8">⚠ Position inflates score</text>
        <rect x="10" y="142" width="155" height="38" rx="4" fill="#31324488" stroke="#45475a"/>
        <text x="87" y="156" textAnchor="middle" fontSize="9" fontWeight="700" fill="#a6e3a1">Fix: Swap augmentation</text>
        <text x="87" y="170" textAnchor="middle" fontSize="9" fill="#6c7086">Run A→B then B→A,</text>
        <text x="87" y="180" textAnchor="middle" fontSize="9" fill="#6c7086">accept only consistent winners</text>

        {/* Panel 2: Verbosity Bias */}
        <text x="279" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="#f38ba8">Verbosity Bias</text>
        <text x="279" y="34" textAnchor="middle" fontSize="9" fill="#6c7086">Length ≠ quality</text>
        <rect x="202" y="44" width="155" height="18" rx="4" fill="#313244" stroke="#45475a"/>
        <text x="279" y="57" fontSize="9" fill="#cdd6f4" textAnchor="middle">Short answer (correct, 10 words)</text>
        <rect x="202" y="68" width="120" height="10" rx="3" fill="#313244"/>
        <rect x="202" y="68" width="60" height="10" rx="3" fill="#f38ba8"/>
        <text x="269" y="77" fontSize="9" fill="#f38ba8">3.0</text>
        <rect x="202" y="84" width="155" height="18" rx="4" fill="#313244" stroke="#45475a"/>
        <text x="279" y="97" fontSize="9" fill="#cdd6f4" textAnchor="middle">Long answer (same facts, 80 words)</text>
        <rect x="202" y="104" width="120" height="10" rx="3" fill="#313244"/>
        <rect x="202" y="104" width="105" height="10" rx="3" fill="#f9e2af"/>
        <text x="314" y="113" fontSize="9" fill="#f9e2af">5.0</text>
        <text x="279" y="132" textAnchor="middle" fontSize="9" fill="#f38ba8">⚠ Verbose response wins unfairly</text>
        <rect x="202" y="142" width="155" height="38" rx="4" fill="#31324488" stroke="#45475a"/>
        <text x="279" y="156" textAnchor="middle" fontSize="9" fontWeight="700" fill="#a6e3a1">Fix: Explicit instruction</text>
        <text x="279" y="170" textAnchor="middle" fontSize="9" fill="#6c7086">"Do NOT prefer longer answers.</text>
        <text x="279" y="180" textAnchor="middle" fontSize="9" fill="#6c7086">Concise + accurate = higher."</text>

        {/* Panel 3: Self-Enhancement Bias */}
        <text x="471" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="#f38ba8">Self-Enhancement</text>
        <text x="471" y="34" textAnchor="middle" fontSize="9" fill="#6c7086">Use different judge model</text>
        <text x="394" y="52" fontSize="9" fill="#6c7086">GPT-4 judging responses:</text>
        <rect x="394" y="58" width="155" height="15" rx="3" fill="#313244" stroke="#45475a"/>
        <text x="402" y="70" fontSize="9" fill="#cdd6f4">GPT-4 output</text>
        <rect x="394" y="74" width="120" height="9" rx="3" fill="#313244"/>
        <rect x="394" y="74" width="105" height="9" rx="3" fill="#89b4fa"/>
        <text x="505" y="82" fontSize="9" fill="#89b4fa">4.8</text>
        <rect x="394" y="90" width="155" height="15" rx="3" fill="#313244" stroke="#45475a"/>
        <text x="402" y="102" fontSize="9" fill="#cdd6f4">Claude output (same quality)</text>
        <rect x="394" y="106" width="120" height="9" rx="3" fill="#313244"/>
        <rect x="394" y="106" width="68" height="9" rx="3" fill="#cba6f7"/>
        <text x="469" y="114" fontSize="9" fill="#cba6f7">3.2</text>
        <text x="471" y="132" textAnchor="middle" fontSize="9" fill="#f38ba8">⚠ Systematic own-family boost</text>
        <rect x="394" y="142" width="155" height="38" rx="4" fill="#31324488" stroke="#45475a"/>
        <text x="471" y="156" textAnchor="middle" fontSize="9" fontWeight="700" fill="#a6e3a1">Fix: Cross-family judging</text>
        <text x="471" y="170" textAnchor="middle" fontSize="9" fill="#6c7086">Claude judges GPT outputs;</text>
        <text x="471" y="180" textAnchor="middle" fontSize="9" fill="#6c7086">GPT judges Claude outputs</text>
      </svg>
    </div>
  );
}

function EvalFlywheelViz() {
  const stages = [
    { label: 'Production Traces', sublabel: 'Monitor live usage, 2-5% sampling', color: '#89b4fa', angle: 270 },
    { label: 'Failure Detection', sublabel: 'Auto-detect low scores, confidence drops', color: '#f38ba8', angle: 342 },
    { label: 'Annotation', sublabel: 'Human review + correction in LangSmith', color: '#f9e2af', angle: 54 },
    { label: 'Golden Dataset Update', sublabel: 'Add to eval set, version it', color: '#a6e3a1', angle: 126 },
    { label: 'CI Gate', sublabel: 'Run evals on deploy, fail if score drops', color: '#94e2d5', angle: 198 },
  ];

  const cx = 240, cy = 180, r = 120;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>EVALUATION FLYWHEEL — CONTINUOUS IMPROVEMENT LOOP</div>
      <svg viewBox="0 0 480 360" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Evaluation flywheel">
        <style>{`.dashFlow45{stroke-dasharray:5 3;animation:dashFlow45Kf 1.2s linear infinite}@keyframes dashFlow45Kf{to{stroke-dashoffset:-16}}`}</style>
        <defs>
          {stages.map((s,i) => (
            <marker key={i} id={`arr45_${i}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={s.color}/>
            </marker>
          ))}
        </defs>

        {/* Center label */}
        <circle cx={cx} cy={cy} r="48" fill="#313244" stroke="#45475a" strokeWidth="1.5"/>
        <text x={cx} y={cy-8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#cdd6f4">Eval</text>
        <text x={cx} y={cy+8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#cdd6f4">Flywheel</text>

        {/* Circular arrows between stages */}
        {stages.map((s, i) => {
          const next = stages[(i+1) % stages.length];
          const a1 = toRad(s.angle + 28);
          const a2 = toRad(next.angle - 28);
          const x1 = cx + r * Math.cos(toRad(s.angle));
          const y1 = cy + r * Math.sin(toRad(s.angle));
          const x2 = cx + r * Math.cos(toRad(next.angle));
          const y2 = cy + r * Math.sin(toRad(next.angle));
          const ax1 = cx + r * Math.cos(a1);
          const ay1 = cy + r * Math.sin(a1);
          const ax2 = cx + r * Math.cos(a2);
          const ay2 = cy + r * Math.sin(a2);
          return (
            <path key={i} d={`M ${ax1} ${ay1} A ${r} ${r} 0 0 1 ${ax2} ${ay2}`}
              fill="none" stroke={s.color} strokeWidth="2" className="dashFlow45"
              markerEnd={`url(#arr45_${i})`} opacity="0.7"/>
          );
        })}

        {/* Stage pills */}
        {stages.map((s) => {
          const px = cx + r * Math.cos(toRad(s.angle));
          const py = cy + r * Math.sin(toRad(s.angle));
          const pw = 115, ph = 38;
          return (
            <g key={s.label}>
              <rect x={px - pw/2} y={py - ph/2} width={pw} height={ph} rx="8"
                fill="#1e1e2e" stroke={s.color} strokeWidth="1.5"/>
              <text x={px} y={py - 6} textAnchor="middle" fontSize="10" fontWeight="700" fill={s.color}>{s.label}</text>
              <text x={px} y={py + 8} textAnchor="middle" fontSize="8" fill="#6c7086">{s.sublabel.split(',')[0]}</text>
              {s.sublabel.split(',')[1] && (
                <text x={px} y={py + 18} textAnchor="middle" fontSize="8" fill="#6c7086">{s.sublabel.split(',')[1].trim()}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── §45.1 Evaluation taxonomy ─────────────────────────────────────────────
const CODE_EVAL_LANDSCAPE = `# The evaluation taxonomy — where each type fits

# ── Offline evaluation ─────────────────────────────────────────────────────
# Run before deployment. Catches regressions. No real users involved.
# Tools: RAGAS, LangSmith evaluate(), custom scorers.
# Trigger: every PR, every model version bump, every prompt change.
# Latency: acceptable (minutes)
# Cost: low-medium (judge LLM calls)

# ── Online evaluation ──────────────────────────────────────────────────────
# Run on live production traffic. Catches real-world failures. A/B comparisons.
# Tools: thumbs up/down, click-through, session length, async RAGAS sampling.
# Trigger: continuous (all traffic or sampled)
# Latency: MUST be async — never block user response for eval
# Cost: variable (scale with traffic)

# ── Unit tests ────────────────────────────────────────────────────────────
# Deterministic assertions on specific behaviour.
# "Given input X, assert output Y exactly."
# Appropriate for: tool argument validation, routing logic, safety filters.
# NOT appropriate for: LLM quality (outputs are non-deterministic)

# ── Integration evals ─────────────────────────────────────────────────────
# Run the full pipeline end-to-end on realistic inputs. Capture outputs.
# Score them with an LLM judge (not exact match).
# This is where RAGAS and LLM-as-Judge live.`;

// ── §45.2 LLM-as-Judge ────────────────────────────────────────────────────
const CODE_LLM_JUDGE_BASIC = `from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

class JudgementScore(BaseModel):
    score:      int   = Field(ge=1, le=5, description="Quality score 1–5")
    reasoning:  str   = Field(description="Why this score was given")
    issues:     list[str] = Field(default_factory=list, description="Specific problems found")

judge_llm = ChatAnthropic(model="claude-haiku-4-5-20251001", temperature=0)
judge     = judge_llm.with_structured_output(JudgementScore)

JUDGE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert evaluator for a real estate AI assistant.
Score the response on a 1–5 scale:
5: Accurate, complete, directly addresses the question, cites evidence from context.
4: Mostly accurate with minor omissions or slight irrelevance.
3: Partially correct but missing key information or mildly off-topic.
2: Significant inaccuracies or fails to address the question.
1: Completely wrong, hallucinated, or refused to answer a valid question.

Be strict. A response that adds information NOT in the context should lose at least 1 point."""),
    ("human", """Question:  {question}
Context:   {context}
Response:  {response}

Evaluate the response."""),
])

def judge_response(question: str, context: str, response: str) -> JudgementScore:
    return judge.invoke(JUDGE_PROMPT.format_messages(
        question=question, context=context, response=response
    ))

# Example:
result = judge_response(
    question="What is the EMI for a 2Cr loan at 8.5% for 20 years?",
    context="For a ₹2Cr loan at 8.5% for 20 years, EMI = ₹17,356/month.",
    response="The monthly EMI would be approximately ₹17,350. This is based on the standard formula.",
)
print(result.score, result.reasoning)  # 4, "Slight rounding; no hallucination"`;

const CODE_LLM_JUDGE_BIAS = `# LLM judges have known systematic biases. All three must be mitigated.

# ── Bias 1: Position bias ──────────────────────────────────────────────────
# The judge tends to rate the FIRST response higher in pairwise comparison.
# Mitigation: swap the order and average both scores.

def pairwise_judge(question, response_a, response_b, context) -> str:
    # Run 1: A vs B
    score_ab = judge.invoke(pairwise_prompt.format_messages(
        question=question, context=context,
        response_a=response_a, response_b=response_b,
    ))
    # Run 2: B vs A (swapped)
    score_ba = judge.invoke(pairwise_prompt.format_messages(
        question=question, context=context,
        response_a=response_b, response_b=response_a,
    ))
    # Consistent winner in both orderings = reliable result
    if score_ab.winner == "A" and score_ba.winner == "B":
        return "A"  # consistent win
    if score_ab.winner == "B" and score_ba.winner == "A":
        return "B"  # consistent win
    return "tie"    # inconsistency = treat as tie (don't manufacture a winner)

# ── Bias 2: Verbosity bias ─────────────────────────────────────────────────
# Judges tend to prefer longer responses regardless of accuracy.
# Mitigation: add explicit instructions in the system prompt.

ANTI_VERBOSITY_INSTRUCTION = """
Do NOT prefer responses that are longer. A concise, accurate answer scores higher
than a verbose one with filler. Penalise padding, unnecessary caveats, and repetition.
"""

# ── Bias 3: Self-enhancement bias ─────────────────────────────────────────
# A judge model rates responses from the same model family higher.
# E.g. Claude judges tend to rate Claude responses higher; GPT judges favour GPT.
# Mitigation: use a different model family as judge than the model under evaluation.

# If your production LLM is Claude Haiku:
evaluator_llm = ChatOpenAI(model="gpt-4o-mini")  # different family as judge

# ── Multi-judge panel: most reliable approach ──────────────────────────────
from langchain_openai import ChatOpenAI

judges = [
    ChatAnthropic(model="claude-haiku-4-5-20251001", temperature=0),
    ChatOpenAI(model="gpt-4o-mini", temperature=0),
]

def panel_judge(question, context, response) -> float:
    scores = []
    for j in judges:
        j_structured = j.with_structured_output(JudgementScore)
        result       = j_structured.invoke(judge_prompt.format_messages(
            question=question, context=context, response=response
        ))
        scores.append(result.score)
    # Agreement check: if scores diverge by > 2, flag for human review
    if max(scores) - min(scores) > 2:
        flag_for_human_review(question, response, scores)
    return sum(scores) / len(scores)`;

// ── §45.3 Structured evaluation dimensions ────────────────────────────────
const CODE_MULTI_DIMENSION = `# Score multiple dimensions separately — don't collapse to a single number.
# Each dimension has a different root cause and a different fix.

from pydantic import BaseModel

class PropertyAssistantScore(BaseModel):
    factual_accuracy:   int = Field(ge=1, le=5, description="Are the facts correct?")
    context_faithfulness: int = Field(ge=1, le=5, description="Only claims supported by retrieved context?")
    answer_completeness: int = Field(ge=1, le=5, description="Does it fully address the question?")
    tone_appropriateness: int = Field(ge=1, le=5, description="Professional tone for real estate context?")
    hallucination_flag:  bool = Field(description="True if any hallucinated claim detected")

multi_judge = judge_llm.with_structured_output(PropertyAssistantScore)

# Routing by dimension:
# low factual_accuracy    → retriever corpus out of date (ingest pipeline issue)
# low context_faithfulness → LLM system prompt needs "use only provided context"
# low completeness        → chunk size too small; retriever k too low
# hallucination_flag=True → system prompt + faithfulness check + RAG-Only mode`;

// ── §45.4 Agent evaluation ────────────────────────────────────────────────
const CODE_AGENT_TASK_EVAL = `# Agents are harder to evaluate than RAG — they have multi-step behaviour.
# Evaluate at three levels: task, trajectory, and tool.

# ── Level 1: Task completion ──────────────────────────────────────────────
def evaluate_task_completion(task: dict, result: dict) -> dict:
    """Did the agent complete the task end-to-end?"""
    completed = (
        result.get("final_answer") is not None
        and not result.get("error")
    )
    return {
        "task_id":   task["id"],
        "completed": completed,
        "turns":     result.get("turn_count", 0),
        "tools_used": result.get("tools_called", []),
    }

# ── Level 2: Trajectory evaluation ───────────────────────────────────────
# Did the agent take the RIGHT steps, not just reach the right answer?
# A correct answer via a hallucinated tool call is still a failure.

TRAJECTORY_JUDGE_PROMPT = """
Evaluate this agent's reasoning trajectory step by step.

Task: {task_description}
Agent steps:
{agent_trajectory}

Score each step:
- Was each tool call necessary and correct?
- Was the reasoning between steps coherent?
- Were there unnecessary loops or redundant calls?

Return JSON: {{"step_scores": [0-1 per step], "reasoning_quality": 1-5, "efficiency": 1-5}}
"""

def evaluate_trajectory(task: str, messages: list) -> dict:
    trajectory = "\\n".join([
        f"[{msg['role']}]: {str(msg['content'])[:200]}"
        for msg in messages
    ])
    return trajectory_judge.invoke(
        TRAJECTORY_JUDGE_PROMPT.format(task_description=task, agent_trajectory=trajectory)
    )

# ── Level 3: Tool selection accuracy ──────────────────────────────────────
def evaluate_tool_selection(messages: list, expected_tools: list[str]) -> dict:
    """Did the agent call the right tools in a reasonable order?"""
    actual_tools = [
        tc["name"]
        for m in messages if hasattr(m, "tool_calls")
        for tc in (m.tool_calls or [])
    ]
    precision  = len(set(actual_tools) & set(expected_tools)) / max(len(actual_tools), 1)
    recall     = len(set(actual_tools) & set(expected_tools)) / max(len(expected_tools), 1)
    return {"tool_precision": precision, "tool_recall": recall, "actual": actual_tools}`;

const CODE_LANGSMITH_AGENT_EVAL = `# LangSmith native evaluation — cleanest integration for LangGraph agents

from langsmith import Client, evaluate
from langsmith.evaluation import LangChainStringEvaluator
from langsmith.schemas import Run, Example

client = Client()

# Define the system under test
def housing_agent_pipeline(inputs: dict) -> dict:
    from langchain_core.messages import HumanMessage
    result = app.invoke({"messages": [HumanMessage(inputs["question"])]})
    return {"answer": result["messages"][-1].content}

# Define a custom evaluator function
def correctness_evaluator(run: Run, example: Example) -> dict:
    predicted = run.outputs.get("answer", "")
    reference = example.outputs.get("answer", "")

    score_result = judge.invoke(JUDGE_PROMPT.format_messages(
        question  = example.inputs["question"],
        context   = "N/A",
        response  = predicted,
    ))

    return {
        "key":   "correctness",
        "score": score_result.score / 5,    # normalise to 0–1
        "comment": score_result.reasoning,
    }

# Run the evaluation against a LangSmith dataset
results = evaluate(
    housing_agent_pipeline,
    data           = "housing-golden-set",       # dataset name in LangSmith
    evaluators     = [correctness_evaluator],
    experiment_prefix = "haiku-classifier-v2",   # shown in LangSmith UI
    max_concurrency = 4,                         # parallel eval workers
    metadata       = {"model": "claude-haiku-4-5-20251001", "rag_k": 5},
)
print(results.to_pandas()[["inputs.question", "outputs.answer", "feedback.correctness"]])`;

// ── §45.5 Online evaluation ───────────────────────────────────────────────
const CODE_ONLINE_SIGNALS = `# Online evaluation: collect signals from live user behaviour

# ── Explicit signals ──────────────────────────────────────────────────────
# Thumbs up/down, rating widget after each response.
# Easy to implement; low response rate (< 5% of users engage); strong signal when given.

# In your FastAPI chat endpoint:
@router.post("/api/chat/feedback")
async def record_feedback(req: FeedbackRequest):
    await metrics.record("user_feedback", {
        "session_id":  req.session_id,
        "message_idx": req.message_idx,
        "rating":      req.rating,          # 1 (thumbs down) or 5 (thumbs up)
        "comment":     req.comment or "",   # optional free text
        "timestamp":   datetime.utcnow().isoformat(),
    })
    # Ship to LangSmith for annotation:
    from langsmith import Client
    Client().create_feedback(
        run_id  = req.run_id,
        key     = "user_rating",
        score   = req.rating / 5,
        comment = req.comment,
    )

# ── Implicit signals ──────────────────────────────────────────────────────
# No user action needed. Stronger volume, weaker signal.

IMPLICIT_SIGNALS = {
    "session_continued":    1.0,   # user sent a follow-up → baseline engagement
    "property_viewed":      1.2,   # clicked a property link from agent recommendation
    "site_visit_booked":    2.0,   # high-intent conversion action
    "session_abandoned":   -0.5,   # user left after response (neutral to bad)
    "explicit_correction": -1.5,   # "no that's wrong" or retry message
    "negative_keyword":    -1.0,   # response contained "I don't know" / "I can't"
}

# Aggregate by model version / prompt version to find regressions:
# SELECT model_version, AVG(engagement_score) FROM session_events
# GROUP BY model_version ORDER BY created_at DESC LIMIT 10;`;

const CODE_SHADOW_EVAL = `# Shadow evaluation: run two model variants on all traffic, compare offline
# User sees only the primary response; challenger runs silently.

import asyncio
from copy import deepcopy

async def shadow_eval_handler(request):
    # Fire both models in parallel
    primary_task   = asyncio.create_task(run_model(primary_app, request))
    challenger_task = asyncio.create_task(run_model(challenger_app, request))

    primary_result = await primary_task
    yield_response_to_user(primary_result)   # user sees this immediately

    # Challenger runs in background — user never sees it
    try:
        challenger_result = await asyncio.wait_for(challenger_task, timeout=10.0)
        # Log both for offline comparison:
        await log_shadow_eval({
            "session_id":  request.session_id,
            "question":    request.message,
            "primary":     primary_result["answer"],
            "challenger":  challenger_result["answer"],
            "primary_model":    PRIMARY_MODEL,
            "challenger_model": CHALLENGER_MODEL,
        })
    except asyncio.TimeoutError:
        pass   # challenger too slow — don't block, don't error

# Offline comparison script:
# SELECT session_id, question, primary, challenger
# FROM shadow_eval WHERE created_at > NOW() - INTERVAL '7 days'
# LIMIT 500;
# → Feed to RAGAS or LLM judge, compare scores in aggregate`;

// ── §45.6 A/B testing eval systems ────────────────────────────────────────
const CODE_AB_EVAL = `# A/B testing for evaluation systems themselves — not just the models being evaluated
# Question: is my new judge prompt better than the old one?

import scipy.stats as stats
import pandas as pd

# Collect scores from both judge versions on the same 200-sample dataset
scores_v1 = evaluate_with_judge(judge_v1, eval_dataset)   # old judge
scores_v2 = evaluate_with_judge(judge_v2, eval_dataset)   # new judge prompt

# Question 1: are the scores different?
t_stat, p_value = stats.ttest_rel(scores_v1, scores_v2)
print(f"p-value: {p_value:.4f}")  # p < 0.05 → statistically significant difference

# Question 2: does the new judge agree better with human labels?
human_scores = load_human_labels(eval_dataset)   # 50 human-labelled samples
agreement_v1 = correlation(scores_v1[:50], human_scores)
agreement_v2 = correlation(scores_v2[:50], human_scores)
print(f"Human agreement: v1={agreement_v1:.2f}, v2={agreement_v2:.2f}")
# Higher agreement with human labels = more trustworthy judge

# Question 3: rank correlation (Kendall's tau) — does the judge rank things consistently?
tau_v1, _ = stats.kendalltau(scores_v1[:50], human_scores)
tau_v2, _ = stats.kendalltau(scores_v2[:50], human_scores)
print(f"Kendall τ: v1={tau_v1:.2f}, v2={tau_v2:.2f}")`;

// ── §45.7 Annotation queues ────────────────────────────────────────────────
const CODE_ANNOTATION_QUEUE = `# When automated scores are uncertain, route to human reviewers
# LangSmith has a built-in annotation queue UI for exactly this

from langsmith import Client
from langsmith.evaluation import AnnotationQueue

client = Client()

# Create a queue (one-time setup):
queue = client.create_annotation_queue(
    name="housing-agent-low-scores",
    description="Responses where faithfulness < 0.70 or user gave thumbs-down",
)

# Route uncertain runs to the queue:
def route_to_annotation_queue(run_id: str, scores: dict, feedback: dict):
    should_review = (
        scores.get("faithfulness", 1.0) < 0.70
        or feedback.get("user_rating", 5) <= 2
        or scores.get("context_recall", 1.0) < 0.60
    )
    if should_review:
        client.add_runs_to_annotation_queue(
            queue_id = queue.id,
            run_ids  = [run_id],
        )

# Annotators open the LangSmith UI, see: full conversation, retrieved docs,
# RAGAS scores, the user's thumbs-down comment, and can label:
# - Was the response correct? (binary)
# - Which part was wrong? (highlights)
# - What should the answer have been? (reference text)
# These labels feed back into your golden dataset.`;

// ── §45.8 Eval flywheel ────────────────────────────────────────────────────
const CODE_FLYWHEEL = `# The evaluation flywheel — close the loop from production failures to improvements

# Week 1: Build golden set (20 examples) + run RAGAS offline
# Week 2: Ship. Add async RAGAS sampling (2%) + thumbs up/down
# Week 3: First production failures surface via low faithfulness scores
#          → Route to annotation queue
#          → Annotators label: "this claim was hallucinated because X"
#          → Add to golden set as regression test
# Week 4: Fix prompt or chunking. RAGAS CI/CD blocks the old failure from re-entering.
# Month 2: Golden set = 100 examples, all from real failures.
#           Drift alerts fire when scores drop > 0.05.
#           Shadow eval running on 100% of traffic for the next model version.

# The flywheel rule: every production failure becomes a test case.
# If you can't show "this fix prevents THIS specific past failure,"
# you don't know if your fix actually works.`;

export function Mod45() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Map the evaluation taxonomy: offline vs online, reference-based vs reference-free, unit test vs integration eval</li>
          <li>Build an LLM-as-Judge scorer with structured output and identify the three major bias types</li>
          <li>Mitigate position, verbosity, and self-enhancement bias with swap augmentation and multi-judge panels</li>
          <li>Evaluate agents at three levels: task completion, trajectory quality, and tool selection accuracy</li>
          <li>Run LangSmith-native evaluation against versioned datasets with custom evaluator functions</li>
          <li>Collect and route online signals: explicit feedback, implicit behaviour, shadow evaluation</li>
          <li>Build and manage annotation queues for human review of uncertain automated scores</li>
          <li>Close the evaluation flywheel from production failure → test case → regression prevention</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~100 minutes</span>
          <span className="obj-diff">Difficulty: ★★★★☆</span>
          <span className="obj-diff">Prerequisites: Module 14 (Evaluation Engineering), Module 33 (RAGAS)</span>
        </div>
      </div>

      <div className="callout callout-info">
        <strong>The core problem with LLM evaluation</strong>
        Automated test suites work for deterministic systems because the same input always produces the same output. LLMs are non-deterministic — you can't assert <code>response == "correct answer"</code>. Every evaluation strategy in this module is a way to answer "is this response good?" without exact-match comparison. Some use LLM judges. Some use user behaviour. Some use statistical comparison against a baseline. None are perfect; you use them together.
      </div>

      <div className="callout callout-info">
        <strong>Housing.com Upgrade Context</strong><br />
        The Housing.com chatbot uses LLM-as-judge for offline eval and thumbs-up/thumbs-down as the online signal. This module
        consolidates those two into a unified eval strategy: offline multi-judge panels gate every deploy, shadow eval A/B tests
        new models before traffic is moved, and the annotation queue turns production failures into next sprint's training data.
        The result is a system that gets systematically better with scale rather than plateauing.
      </div>

      <JudgeBiasViz />

      <h2>45.1 The Evaluation Landscape</h2>
      <CodeBlock title="Evaluation Taxonomy: Offline, Online, Unit, Integration" language="python" keyLine={23} keyNote="Integration evals score LLM output quality — not exact-match">{CODE_EVAL_LANDSCAPE}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Evaluation is not testing — it's measurement</strong>
        Unit tests assert correctness. Evaluation measures quality. You need both.<br /><br />
        <table style={{fontSize: "12px", margin: "4px 0"}}>
          <tbody>
            <tr><th></th><th>Unit test</th><th>Integration eval</th><th>Online signal</th></tr>
            <tr><td>What it catches</td><td>Logic bugs</td><td>Quality regressions</td><td>Real-world failures</td></tr>
            <tr><td>Speed</td><td>Milliseconds</td><td>Minutes</td><td>Days (accumulate signal)</td></tr>
            <tr><td>Cost</td><td>Free</td><td>$0.10–$2.00</td><td>Infrastructure</td></tr>
            <tr><td>Ground truth needed?</td><td>Yes (exact)</td><td>No (LLM judge)</td><td>No (behaviour)</td></tr>
            <tr><td>Blocks PR?</td><td>Yes</td><td>Yes (threshold)</td><td>No (retrospective)</td></tr>
          </tbody>
        </table>
      </div>

      <h2>45.2 LLM-as-Judge</h2>
      <p>LLM-as-Judge uses one LLM to evaluate the output of another. It's the dominant approach for production AI evaluation because it scales to arbitrary quality dimensions and doesn't require human labels for every sample.</p>

      <h3>45.2.1 Basic Structured Judge</h3>
      <CodeBlock title="LLM-as-Judge with Structured Output" language="python" keyLine={11} keyNote=".with_structured_output() enforces parseable scores — no free-text chaos">{CODE_LLM_JUDGE_BASIC}</CodeBlock>
      <div className="callout callout-warn">
        <strong>The most important design decision: use structured output</strong>
        A judge that returns free text ("This response is mostly good but...") is useless for automation. Use <code>.with_structured_output(YourPydanticModel)</code> so the score is always a number and the reasoning is always parseable. Without structured output, 5% of judge calls will return unexpected formats and your eval pipeline will crash.
      </div>

      <h3>45.2.2 Bias Types and Mitigation</h3>
      <CodeBlock title="LLM Judge Bias Mitigation: Position, Verbosity, Self-Enhancement" language="python" keyLine={11} keyNote="Return 'tie' on inconsistent swap results — never manufacture a winner">{CODE_LLM_JUDGE_BIAS}</CodeBlock>
      <table>
        <tbody>
          <tr><th>Bias</th><th>Mechanism</th><th>Mitigation</th></tr>
          <tr><td>Position bias</td><td>Judge rates whichever option appears first higher</td><td>Swap order in pairwise; only accept consistent winners</td></tr>
          <tr><td>Verbosity bias</td><td>Judge prefers longer responses regardless of accuracy</td><td>Explicit anti-verbosity instruction in system prompt</td></tr>
          <tr><td>Self-enhancement</td><td>Model family prefers outputs from same family</td><td>Use different model family as judge (Claude judges GPT, GPT judges Claude)</td></tr>
          <tr><td>Sycophancy</td><td>Judge agrees with the question's implied answer</td><td>Use neutral question framing; don't telegraph the "right" answer</td></tr>
        </tbody>
      </table>

      <h3>45.2.3 Multi-Dimension Scoring</h3>
      <p>A single score hides which dimension failed. Score each dimension separately so you know which component to fix:</p>
      <CodeBlock title="Multi-Dimension Property Assistant Scorer" language="python" keyLine={12} keyNote="hallucination_flag as separate bool ensures no hallucination is hidden by averaging">{CODE_MULTI_DIMENSION}</CodeBlock>

      <h2>45.3 Agent Evaluation</h2>
      <p>Agents have multi-step behaviour — a correct final answer via a hallucinated tool call is still a failure. Evaluate at three levels:</p>

      <h3>45.3.1 Task, Trajectory, and Tool Evaluation</h3>
      <CodeBlock title="Agent Evaluation: Task, Trajectory, and Tool Selection" language="python" keyLine={21} keyNote="Correct answer via hallucinated tool call is still a failure">{CODE_AGENT_TASK_EVAL}</CodeBlock>

      <h3>45.3.2 LangSmith Native Evaluation</h3>
      <p>LangSmith's <code>evaluate()</code> runs your pipeline against a versioned dataset, logs results, and makes experiment runs browseable in the UI:</p>
      <CodeBlock title="LangSmith Native Evaluation with Custom Evaluator" language="python" keyLine={26} keyNote="experiment_prefix tags the run in LangSmith UI for comparison">{CODE_LANGSMITH_AGENT_EVAL}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Experiment runs in LangSmith UI</strong>
        Every <code>evaluate()</code> call creates an experiment in LangSmith with: side-by-side comparison of input/output/score per sample; aggregate score summary with confidence intervals; diff against a prior experiment run (did this change improve things?). This replaces the manual process of exporting CSVs and comparing in spreadsheets.
      </div>

      <h2>45.4 Online Evaluation — Collecting Production Signals</h2>

      <h3>45.4.1 Explicit and Implicit Signals</h3>
      <CodeBlock title="Online Evaluation: Explicit Feedback and Implicit Signals" language="python" keyLine={17} keyNote="Ship explicit feedback to LangSmith immediately for annotation queue routing">{CODE_ONLINE_SIGNALS}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Explicit vs implicit signal strength</strong>
        Explicit signals (thumbs up/down) are high-quality but rare — expect 1–5% engagement rate. Implicit signals are high-volume but noisy — a user abandoning a session could mean the response was bad OR their phone rang. Use explicit signals to calibrate your automated scores (do high RAGAS scores correlate with thumbs up?). Use implicit signals for aggregate drift detection (did thumbs-up rate drop this week?).
      </div>

      <h3>45.4.2 Shadow Evaluation</h3>
      <p>Run a challenger model on 100% of traffic without showing users, then compare scores offline — the safest way to validate a new model version before cutover:</p>
      <CodeBlock title="Shadow Evaluation: Challenger Model on Live Traffic" language="python" keyLine={11} keyNote="User sees primary immediately; challenger runs in background never blocking">{CODE_SHADOW_EVAL}</CodeBlock>

      <h2>45.5 Evaluating the Evaluator — A/B Testing Judge Prompts</h2>
      <p>Your judge is software too. When you change the judge prompt, measure whether it improved:</p>
      <CodeBlock title="A/B Testing Judge Prompts with Human Agreement" language="python" keyLine={9} keyNote="Kendall tau rank-correlation measures judge consistency vs human labels">{CODE_AB_EVAL}</CodeBlock>
      <div className="callout callout-warn">
        <strong>The meta-evaluation problem</strong>
        You need humans to validate your automated judge. This is unavoidable — at some point, a human has to label "this response is good" for a reference set. The good news: you only need ~50 human-labelled examples to calibrate your judge. Collect them by routing annotation queue items to a domain expert. Once your judge shows &gt;0.8 Kendall τ agreement with human labels, it's trustworthy enough to use as an automated gate.
      </div>

      <h2>45.6 Annotation Queues — Human-in-the-Loop Evaluation</h2>
      <CodeBlock title="LangSmith Annotation Queue Routing" language="python" keyLine={15} keyNote="Route when faithfulness < 0.70 or user gave thumbs-down">{CODE_ANNOTATION_QUEUE}</CodeBlock>
      <div className="callout callout-info">
        <strong>What to route to annotation queues</strong>
        <ul style={{fontSize: "12px", margin: "4px 0"}}>
          <li>Faithfulness &lt; 0.70 (potential hallucination — human should verify)</li>
          <li>User gave explicit thumbs-down (user knows it was wrong; find out why)</li>
          <li>Judge score disagrees between two panel models by &gt; 2 points (ambiguous case)</li>
          <li>Answer contains refusal phrases ("I don't know", "I can't help with that") on a query that should be answerable</li>
          <li>New query patterns not well-represented in golden set (check coverage gaps)</li>
        </ul>
        Route 10–20 samples per day to start. Annotators spend ~30 seconds per sample. This generates ~140 high-quality labels per week with one part-time annotator.
      </div>

      <EvalFlywheelViz />

      <h2>45.7 The Evaluation Flywheel</h2>
      <p>Evaluation is only valuable if it drives improvement. Close the loop:</p>
      <CodeBlock title="Evaluation Flywheel: Production Failures to Golden Dataset" language="python" keyLine={12} keyNote="Every production failure must become a regression test case">{CODE_FLYWHEEL}</CodeBlock>
      <div className="diagram-wrap">
        <div className="diagram-title">The Evaluation Flywheel</div>
        <pre style={{margin: 0, border: "none", background: "transparent", fontSize: "12px"}}>{`Production traffic
        ↓
Async RAGAS sampling (2–5%)
        ↓
Low scores → Annotation queue
        ↓
Human labels: "this was wrong because X"
        ↓
Add to golden dataset (regression test)
        ↓
Fix prompt / chunking / retrieval
        ↓
CI/CD blocks old failure: eval threshold gate
        ↓
Deploy. Repeat.

Each rotation: golden set grows, failure surface shrinks, judge accuracy improves.`}</pre>
      </div>

      <h2>45.8 Evaluation Stack Summary</h2>
      <table>
        <tbody>
          <tr><th>Layer</th><th>Tool</th><th>Triggers</th><th>Purpose</th></tr>
          <tr><td>Unit tests</td><td>pytest</td><td>Every commit</td><td>Logic correctness, routing, safety filters</td></tr>
          <tr><td>Offline eval</td><td>RAGAS + LangSmith evaluate()</td><td>Every PR touching RAG/prompts</td><td>Quality regression gates</td></tr>
          <tr><td>Shadow eval</td><td>Custom async handler</td><td>New model version candidates</td><td>Validate challenger before cutover</td></tr>
          <tr><td>Online signals</td><td>Thumbs up/down + implicit events</td><td>Continuous (all traffic)</td><td>Real-world quality drift detection</td></tr>
          <tr><td>Annotation queue</td><td>LangSmith Annotation Queues</td><td>Triggered by low scores / negative feedback</td><td>Human labels for golden set growth</td></tr>
          <tr><td>Drift alerts</td><td>Custom tracker (Module 31 §31.7.1)</td><td>Continuous (rolling window)</td><td>PagerDuty alert on &gt;0.05 score drop</td></tr>
        </tbody>
      </table>

      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection</strong>
        "How do you ensure your AI system maintains quality in production?" → Three-layer answer: (1) Offline: RAGAS + LLM-as-Judge on 50-sample golden set gating every PR; (2) Online: async RAGAS sampling at 2–5% of traffic + explicit thumbs-up/down, routed to LangSmith annotation queue; (3) Continuous: rolling score tracker alerts on &gt;0.05 drift from baseline. Follow-up: "What are the failure modes of LLM-as-Judge?" → position bias (swap augmentation), verbosity bias (explicit instruction), self-enhancement bias (use different model family). The complete answer shows you know evaluation is a system, not a one-shot script.
      </div>

      <QuizSection moduleId={34} title="Module 34: AI Evaluation Strategies" contentHint="offline vs online vs unit test evaluation taxonomy, LLM-as-judge structured output JudgementScore, position bias swap augmentation, verbosity bias explicit instruction, self-enhancement bias different model family, multi-dimension scoring separate axes, agent evaluation task completion trajectory tool selection, LangSmith evaluate() experiment runs versioned datasets, explicit thumbs feedback vs implicit session signals, shadow evaluation challenger parallel no user exposure, A/B judge evaluation Kendall tau human agreement calibration, annotation queue routing thresholds LangSmith, evaluation flywheel production failure to golden set to CI gate" />
    </>
  );
}
