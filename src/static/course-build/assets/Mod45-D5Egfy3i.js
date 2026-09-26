import{j as e}from"./index-D4pJPyGz.js";import{Q as f}from"./QuizSection-BedG7s-t.js";import{C as i}from"./CodeBlock-dJ_hHYfw.js";function x(){return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"LLM-AS-JUDGE BIASES — 3 SYSTEMATIC FAILURES AND HOW TO FIX THEM"}),e.jsxs("svg",{viewBox:"0 0 560 220",width:"100%",style:{display:"block",margin:"0 auto"},"aria-label":"LLM-as-Judge bias types",children:[e.jsx("rect",{x:"0",y:"0",width:"175",height:"190",rx:"6",fill:"#1e1e2e",stroke:"#f38ba8",strokeWidth:"1.5"}),e.jsx("rect",{x:"192",y:"0",width:"175",height:"190",rx:"6",fill:"#1e1e2e",stroke:"#f38ba8",strokeWidth:"1.5"}),e.jsx("rect",{x:"384",y:"0",width:"176",height:"190",rx:"6",fill:"#1e1e2e",stroke:"#f38ba8",strokeWidth:"1.5"}),e.jsx("text",{x:"87",y:"18",textAnchor:"middle",fontSize:"11",fontWeight:"700",fill:"#f38ba8",children:"Position Bias"}),e.jsx("text",{x:"87",y:"34",textAnchor:"middle",fontSize:"9",fill:"#6c7086",children:"Same answer, position changes score"}),e.jsx("rect",{x:"20",y:"44",width:"135",height:"18",rx:"4",fill:"#313244",stroke:"#45475a"}),e.jsx("text",{x:"28",y:"57",fontSize:"9",fill:"#cdd6f4",children:"Answer A (presented first)"}),e.jsx("rect",{x:"20",y:"68",width:"120",height:"10",rx:"3",fill:"#313244"}),e.jsx("rect",{x:"20",y:"68",width:"95",height:"10",rx:"3",fill:"#f9e2af"}),e.jsx("text",{x:"122",y:"77",fontSize:"9",fill:"#f9e2af",children:"4.7"}),e.jsx("rect",{x:"20",y:"84",width:"135",height:"18",rx:"4",fill:"#313244",stroke:"#45475a"}),e.jsx("text",{x:"28",y:"97",fontSize:"9",fill:"#cdd6f4",children:"Answer B (same text, 2nd)"}),e.jsx("rect",{x:"20",y:"104",width:"120",height:"10",rx:"3",fill:"#313244"}),e.jsx("rect",{x:"20",y:"104",width:"62",height:"10",rx:"3",fill:"#f38ba8"}),e.jsx("text",{x:"89",y:"113",fontSize:"9",fill:"#f38ba8",children:"3.1"}),e.jsx("text",{x:"87",y:"132",textAnchor:"middle",fontSize:"9",fill:"#f38ba8",children:"⚠ Position inflates score"}),e.jsx("rect",{x:"10",y:"142",width:"155",height:"38",rx:"4",fill:"#31324488",stroke:"#45475a"}),e.jsx("text",{x:"87",y:"156",textAnchor:"middle",fontSize:"9",fontWeight:"700",fill:"#a6e3a1",children:"Fix: Swap augmentation"}),e.jsx("text",{x:"87",y:"170",textAnchor:"middle",fontSize:"9",fill:"#6c7086",children:"Run A→B then B→A,"}),e.jsx("text",{x:"87",y:"180",textAnchor:"middle",fontSize:"9",fill:"#6c7086",children:"accept only consistent winners"}),e.jsx("text",{x:"279",y:"18",textAnchor:"middle",fontSize:"11",fontWeight:"700",fill:"#f38ba8",children:"Verbosity Bias"}),e.jsx("text",{x:"279",y:"34",textAnchor:"middle",fontSize:"9",fill:"#6c7086",children:"Length ≠ quality"}),e.jsx("rect",{x:"202",y:"44",width:"155",height:"18",rx:"4",fill:"#313244",stroke:"#45475a"}),e.jsx("text",{x:"279",y:"57",fontSize:"9",fill:"#cdd6f4",textAnchor:"middle",children:"Short answer (correct, 10 words)"}),e.jsx("rect",{x:"202",y:"68",width:"120",height:"10",rx:"3",fill:"#313244"}),e.jsx("rect",{x:"202",y:"68",width:"60",height:"10",rx:"3",fill:"#f38ba8"}),e.jsx("text",{x:"269",y:"77",fontSize:"9",fill:"#f38ba8",children:"3.0"}),e.jsx("rect",{x:"202",y:"84",width:"155",height:"18",rx:"4",fill:"#313244",stroke:"#45475a"}),e.jsx("text",{x:"279",y:"97",fontSize:"9",fill:"#cdd6f4",textAnchor:"middle",children:"Long answer (same facts, 80 words)"}),e.jsx("rect",{x:"202",y:"104",width:"120",height:"10",rx:"3",fill:"#313244"}),e.jsx("rect",{x:"202",y:"104",width:"105",height:"10",rx:"3",fill:"#f9e2af"}),e.jsx("text",{x:"314",y:"113",fontSize:"9",fill:"#f9e2af",children:"5.0"}),e.jsx("text",{x:"279",y:"132",textAnchor:"middle",fontSize:"9",fill:"#f38ba8",children:"⚠ Verbose response wins unfairly"}),e.jsx("rect",{x:"202",y:"142",width:"155",height:"38",rx:"4",fill:"#31324488",stroke:"#45475a"}),e.jsx("text",{x:"279",y:"156",textAnchor:"middle",fontSize:"9",fontWeight:"700",fill:"#a6e3a1",children:"Fix: Explicit instruction"}),e.jsx("text",{x:"279",y:"170",textAnchor:"middle",fontSize:"9",fill:"#6c7086",children:'"Do NOT prefer longer answers.'}),e.jsx("text",{x:"279",y:"180",textAnchor:"middle",fontSize:"9",fill:"#6c7086",children:'Concise + accurate = higher."'}),e.jsx("text",{x:"471",y:"18",textAnchor:"middle",fontSize:"11",fontWeight:"700",fill:"#f38ba8",children:"Self-Enhancement"}),e.jsx("text",{x:"471",y:"34",textAnchor:"middle",fontSize:"9",fill:"#6c7086",children:"Use different judge model"}),e.jsx("text",{x:"394",y:"52",fontSize:"9",fill:"#6c7086",children:"GPT-4 judging responses:"}),e.jsx("rect",{x:"394",y:"58",width:"155",height:"15",rx:"3",fill:"#313244",stroke:"#45475a"}),e.jsx("text",{x:"402",y:"70",fontSize:"9",fill:"#cdd6f4",children:"GPT-4 output"}),e.jsx("rect",{x:"394",y:"74",width:"120",height:"9",rx:"3",fill:"#313244"}),e.jsx("rect",{x:"394",y:"74",width:"105",height:"9",rx:"3",fill:"#89b4fa"}),e.jsx("text",{x:"505",y:"82",fontSize:"9",fill:"#89b4fa",children:"4.8"}),e.jsx("rect",{x:"394",y:"90",width:"155",height:"15",rx:"3",fill:"#313244",stroke:"#45475a"}),e.jsx("text",{x:"402",y:"102",fontSize:"9",fill:"#cdd6f4",children:"Claude output (same quality)"}),e.jsx("rect",{x:"394",y:"106",width:"120",height:"9",rx:"3",fill:"#313244"}),e.jsx("rect",{x:"394",y:"106",width:"68",height:"9",rx:"3",fill:"#cba6f7"}),e.jsx("text",{x:"469",y:"114",fontSize:"9",fill:"#cba6f7",children:"3.2"}),e.jsx("text",{x:"471",y:"132",textAnchor:"middle",fontSize:"9",fill:"#f38ba8",children:"⚠ Systematic own-family boost"}),e.jsx("rect",{x:"394",y:"142",width:"155",height:"38",rx:"4",fill:"#31324488",stroke:"#45475a"}),e.jsx("text",{x:"471",y:"156",textAnchor:"middle",fontSize:"9",fontWeight:"700",fill:"#a6e3a1",children:"Fix: Cross-family judging"}),e.jsx("text",{x:"471",y:"170",textAnchor:"middle",fontSize:"9",fill:"#6c7086",children:"Claude judges GPT outputs;"}),e.jsx("text",{x:"471",y:"180",textAnchor:"middle",fontSize:"9",fill:"#6c7086",children:"GPT judges Claude outputs"})]})]})}function y(){const c=[{label:"Production Traces",sublabel:"Monitor live usage, 2-5% sampling",color:"#89b4fa",angle:270},{label:"Failure Detection",sublabel:"Auto-detect low scores, confidence drops",color:"#f38ba8",angle:342},{label:"Annotation",sublabel:"Human review + correction in LangSmith",color:"#f9e2af",angle:54},{label:"Golden Dataset Update",sublabel:"Add to eval set, version it",color:"#a6e3a1",angle:126},{label:"CI Gate",sublabel:"Run evals on deploy, fail if score drops",color:"#94e2d5",angle:198}],a=240,r=180,s=120,o=t=>t*Math.PI/180;return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"EVALUATION FLYWHEEL — CONTINUOUS IMPROVEMENT LOOP"}),e.jsxs("svg",{viewBox:"0 0 480 360",width:"100%",style:{display:"block",margin:"0 auto"},"aria-label":"Evaluation flywheel",children:[e.jsx("style",{children:".dashFlow45{stroke-dasharray:5 3;animation:dashFlow45Kf 1.2s linear infinite}@keyframes dashFlow45Kf{to{stroke-dashoffset:-16}}"}),e.jsx("defs",{children:c.map((t,n)=>e.jsx("marker",{id:`arr45_${n}`,markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:t.color})},n))}),e.jsx("circle",{cx:a,cy:r,r:"48",fill:"#313244",stroke:"#45475a",strokeWidth:"1.5"}),e.jsx("text",{x:a,y:r-8,textAnchor:"middle",fontSize:"11",fontWeight:"700",fill:"#cdd6f4",children:"Eval"}),e.jsx("text",{x:a,y:r+8,textAnchor:"middle",fontSize:"11",fontWeight:"700",fill:"#cdd6f4",children:"Flywheel"}),c.map((t,n)=>{const l=c[(n+1)%c.length],d=o(t.angle+28),u=o(l.angle-28);a+s*Math.cos(o(t.angle)),r+s*Math.sin(o(t.angle)),a+s*Math.cos(o(l.angle)),r+s*Math.sin(o(l.angle));const h=a+s*Math.cos(d),m=r+s*Math.sin(d),g=a+s*Math.cos(u),p=r+s*Math.sin(u);return e.jsx("path",{d:`M ${h} ${m} A ${s} ${s} 0 0 1 ${g} ${p}`,fill:"none",stroke:t.color,strokeWidth:"2",className:"dashFlow45",markerEnd:`url(#arr45_${n})`,opacity:"0.7"},n)}),c.map(t=>{const n=a+s*Math.cos(o(t.angle)),l=r+s*Math.sin(o(t.angle)),d=115,u=38;return e.jsxs("g",{children:[e.jsx("rect",{x:n-d/2,y:l-u/2,width:d,height:u,rx:"8",fill:"#1e1e2e",stroke:t.color,strokeWidth:"1.5"}),e.jsx("text",{x:n,y:l-6,textAnchor:"middle",fontSize:"10",fontWeight:"700",fill:t.color,children:t.label}),e.jsx("text",{x:n,y:l+8,textAnchor:"middle",fontSize:"8",fill:"#6c7086",children:t.sublabel.split(",")[0]}),t.sublabel.split(",")[1]&&e.jsx("text",{x:n,y:l+18,textAnchor:"middle",fontSize:"8",fill:"#6c7086",children:t.sublabel.split(",")[1].trim()})]},t.label)})]})]})}const j=`# The evaluation taxonomy — where each type fits

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
# This is where RAGAS and LLM-as-Judge live.`,v=`from langchain_anthropic import ChatAnthropic
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
print(result.score, result.reasoning)  # 4, "Slight rounding; no hallucination"`,w=`# LLM judges have known systematic biases. All three must be mitigated.

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
    return sum(scores) / len(scores)`,_=`# Score multiple dimensions separately — don't collapse to a single number.
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
# hallucination_flag=True → system prompt + faithfulness check + RAG-Only mode`,b=`# Agents are harder to evaluate than RAG — they have multi-step behaviour.
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
    return {"tool_precision": precision, "tool_recall": recall, "actual": actual_tools}`,A=`# LangSmith native evaluation — cleanest integration for LangGraph agents

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
print(results.to_pandas()[["inputs.question", "outputs.answer", "feedback.correctness"]])`,S=`# Online evaluation: collect signals from live user behaviour

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
# GROUP BY model_version ORDER BY created_at DESC LIMIT 10;`,k=`# Shadow evaluation: run two model variants on all traffic, compare offline
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
# → Feed to RAGAS or LLM judge, compare scores in aggregate`,L=`# A/B testing for evaluation systems themselves — not just the models being evaluated
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
print(f"Kendall τ: v1={tau_v1:.2f}, v2={tau_v2:.2f}")`,E=`# When automated scores are uncertain, route to human reviewers
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
# These labels feed back into your golden dataset.`,T=`# The evaluation flywheel — close the loop from production failures to improvements

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
# you don't know if your fix actually works.`;function q(){return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"learning-obj",children:[e.jsx("div",{className:"learning-obj-title",children:"After this module you will be able to"}),e.jsxs("ol",{children:[e.jsx("li",{children:"Map the evaluation taxonomy: offline vs online, reference-based vs reference-free, unit test vs integration eval"}),e.jsx("li",{children:"Build an LLM-as-Judge scorer with structured output and identify the three major bias types"}),e.jsx("li",{children:"Mitigate position, verbosity, and self-enhancement bias with swap augmentation and multi-judge panels"}),e.jsx("li",{children:"Evaluate agents at three levels: task completion, trajectory quality, and tool selection accuracy"}),e.jsx("li",{children:"Run LangSmith-native evaluation against versioned datasets with custom evaluator functions"}),e.jsx("li",{children:"Collect and route online signals: explicit feedback, implicit behaviour, shadow evaluation"}),e.jsx("li",{children:"Build and manage annotation queues for human review of uncertain automated scores"}),e.jsx("li",{children:"Close the evaluation flywheel from production failure → test case → regression prevention"})]}),e.jsxs("div",{className:"obj-meta",children:[e.jsx("span",{className:"obj-time",children:"⏱ ~100 minutes"}),e.jsx("span",{className:"obj-diff",children:"Difficulty: ★★★★☆"}),e.jsx("span",{className:"obj-diff",children:"Prerequisites: Module 14 (Evaluation Engineering), Module 33 (RAGAS)"})]})]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"The core problem with LLM evaluation"}),"Automated test suites work for deterministic systems because the same input always produces the same output. LLMs are non-deterministic — you can't assert ",e.jsx("code",{children:'response == "correct answer"'}),'. Every evaluation strategy in this module is a way to answer "is this response good?" without exact-match comparison. Some use LLM judges. Some use user behaviour. Some use statistical comparison against a baseline. None are perfect; you use them together.']}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"Housing.com Upgrade Context"}),e.jsx("br",{}),"The Housing.com chatbot uses LLM-as-judge for offline eval and thumbs-up/thumbs-down as the online signal. This module consolidates those two into a unified eval strategy: offline multi-judge panels gate every deploy, shadow eval A/B tests new models before traffic is moved, and the annotation queue turns production failures into next sprint's training data. The result is a system that gets systematically better with scale rather than plateauing."]}),e.jsx(x,{}),e.jsx("h2",{children:"45.1 The Evaluation Landscape"}),e.jsx(i,{title:"Evaluation Taxonomy: Offline, Online, Unit, Integration",language:"python",keyLine:23,keyNote:"Integration evals score LLM output quality — not exact-match",children:j}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"Evaluation is not testing — it's measurement"}),"Unit tests assert correctness. Evaluation measures quality. You need both.",e.jsx("br",{}),e.jsx("br",{}),e.jsx("table",{style:{fontSize:"12px",margin:"4px 0"},children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{}),e.jsx("th",{children:"Unit test"}),e.jsx("th",{children:"Integration eval"}),e.jsx("th",{children:"Online signal"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"What it catches"}),e.jsx("td",{children:"Logic bugs"}),e.jsx("td",{children:"Quality regressions"}),e.jsx("td",{children:"Real-world failures"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Speed"}),e.jsx("td",{children:"Milliseconds"}),e.jsx("td",{children:"Minutes"}),e.jsx("td",{children:"Days (accumulate signal)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Cost"}),e.jsx("td",{children:"Free"}),e.jsx("td",{children:"$0.10–$2.00"}),e.jsx("td",{children:"Infrastructure"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Ground truth needed?"}),e.jsx("td",{children:"Yes (exact)"}),e.jsx("td",{children:"No (LLM judge)"}),e.jsx("td",{children:"No (behaviour)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Blocks PR?"}),e.jsx("td",{children:"Yes"}),e.jsx("td",{children:"Yes (threshold)"}),e.jsx("td",{children:"No (retrospective)"})]})]})})]}),e.jsx("h2",{children:"45.2 LLM-as-Judge"}),e.jsx("p",{children:"LLM-as-Judge uses one LLM to evaluate the output of another. It's the dominant approach for production AI evaluation because it scales to arbitrary quality dimensions and doesn't require human labels for every sample."}),e.jsx("h3",{children:"45.2.1 Basic Structured Judge"}),e.jsx(i,{title:"LLM-as-Judge with Structured Output",language:"python",keyLine:11,keyNote:".with_structured_output() enforces parseable scores — no free-text chaos",children:v}),e.jsxs("div",{className:"callout callout-warn",children:[e.jsx("strong",{children:"The most important design decision: use structured output"}),'A judge that returns free text ("This response is mostly good but...") is useless for automation. Use ',e.jsx("code",{children:".with_structured_output(YourPydanticModel)"})," so the score is always a number and the reasoning is always parseable. Without structured output, 5% of judge calls will return unexpected formats and your eval pipeline will crash."]}),e.jsx("h3",{children:"45.2.2 Bias Types and Mitigation"}),e.jsx(i,{title:"LLM Judge Bias Mitigation: Position, Verbosity, Self-Enhancement",language:"python",keyLine:11,keyNote:"Return 'tie' on inconsistent swap results — never manufacture a winner",children:w}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Bias"}),e.jsx("th",{children:"Mechanism"}),e.jsx("th",{children:"Mitigation"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Position bias"}),e.jsx("td",{children:"Judge rates whichever option appears first higher"}),e.jsx("td",{children:"Swap order in pairwise; only accept consistent winners"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Verbosity bias"}),e.jsx("td",{children:"Judge prefers longer responses regardless of accuracy"}),e.jsx("td",{children:"Explicit anti-verbosity instruction in system prompt"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Self-enhancement"}),e.jsx("td",{children:"Model family prefers outputs from same family"}),e.jsx("td",{children:"Use different model family as judge (Claude judges GPT, GPT judges Claude)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Sycophancy"}),e.jsx("td",{children:"Judge agrees with the question's implied answer"}),e.jsx("td",{children:`Use neutral question framing; don't telegraph the "right" answer`})]})]})}),e.jsx("h3",{children:"45.2.3 Multi-Dimension Scoring"}),e.jsx("p",{children:"A single score hides which dimension failed. Score each dimension separately so you know which component to fix:"}),e.jsx(i,{title:"Multi-Dimension Property Assistant Scorer",language:"python",keyLine:12,keyNote:"hallucination_flag as separate bool ensures no hallucination is hidden by averaging",children:_}),e.jsx("h2",{children:"45.3 Agent Evaluation"}),e.jsx("p",{children:"Agents have multi-step behaviour — a correct final answer via a hallucinated tool call is still a failure. Evaluate at three levels:"}),e.jsx("h3",{children:"45.3.1 Task, Trajectory, and Tool Evaluation"}),e.jsx(i,{title:"Agent Evaluation: Task, Trajectory, and Tool Selection",language:"python",keyLine:21,keyNote:"Correct answer via hallucinated tool call is still a failure",children:b}),e.jsx("h3",{children:"45.3.2 LangSmith Native Evaluation"}),e.jsxs("p",{children:["LangSmith's ",e.jsx("code",{children:"evaluate()"})," runs your pipeline against a versioned dataset, logs results, and makes experiment runs browseable in the UI:"]}),e.jsx(i,{title:"LangSmith Native Evaluation with Custom Evaluator",language:"python",keyLine:26,keyNote:"experiment_prefix tags the run in LangSmith UI for comparison",children:A}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"Experiment runs in LangSmith UI"}),"Every ",e.jsx("code",{children:"evaluate()"})," call creates an experiment in LangSmith with: side-by-side comparison of input/output/score per sample; aggregate score summary with confidence intervals; diff against a prior experiment run (did this change improve things?). This replaces the manual process of exporting CSVs and comparing in spreadsheets."]}),e.jsx("h2",{children:"45.4 Online Evaluation — Collecting Production Signals"}),e.jsx("h3",{children:"45.4.1 Explicit and Implicit Signals"}),e.jsx(i,{title:"Online Evaluation: Explicit Feedback and Implicit Signals",language:"python",keyLine:17,keyNote:"Ship explicit feedback to LangSmith immediately for annotation queue routing",children:S}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"Explicit vs implicit signal strength"}),"Explicit signals (thumbs up/down) are high-quality but rare — expect 1–5% engagement rate. Implicit signals are high-volume but noisy — a user abandoning a session could mean the response was bad OR their phone rang. Use explicit signals to calibrate your automated scores (do high RAGAS scores correlate with thumbs up?). Use implicit signals for aggregate drift detection (did thumbs-up rate drop this week?)."]}),e.jsx("h3",{children:"45.4.2 Shadow Evaluation"}),e.jsx("p",{children:"Run a challenger model on 100% of traffic without showing users, then compare scores offline — the safest way to validate a new model version before cutover:"}),e.jsx(i,{title:"Shadow Evaluation: Challenger Model on Live Traffic",language:"python",keyLine:11,keyNote:"User sees primary immediately; challenger runs in background never blocking",children:k}),e.jsx("h2",{children:"45.5 Evaluating the Evaluator — A/B Testing Judge Prompts"}),e.jsx("p",{children:"Your judge is software too. When you change the judge prompt, measure whether it improved:"}),e.jsx(i,{title:"A/B Testing Judge Prompts with Human Agreement",language:"python",keyLine:9,keyNote:"Kendall tau rank-correlation measures judge consistency vs human labels",children:L}),e.jsxs("div",{className:"callout callout-warn",children:[e.jsx("strong",{children:"The meta-evaluation problem"}),`You need humans to validate your automated judge. This is unavoidable — at some point, a human has to label "this response is good" for a reference set. The good news: you only need ~50 human-labelled examples to calibrate your judge. Collect them by routing annotation queue items to a domain expert. Once your judge shows >0.8 Kendall τ agreement with human labels, it's trustworthy enough to use as an automated gate.`]}),e.jsx("h2",{children:"45.6 Annotation Queues — Human-in-the-Loop Evaluation"}),e.jsx(i,{title:"LangSmith Annotation Queue Routing",language:"python",keyLine:15,keyNote:"Route when faithfulness < 0.70 or user gave thumbs-down",children:E}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"What to route to annotation queues"}),e.jsxs("ul",{style:{fontSize:"12px",margin:"4px 0"},children:[e.jsx("li",{children:"Faithfulness < 0.70 (potential hallucination — human should verify)"}),e.jsx("li",{children:"User gave explicit thumbs-down (user knows it was wrong; find out why)"}),e.jsx("li",{children:"Judge score disagrees between two panel models by > 2 points (ambiguous case)"}),e.jsx("li",{children:`Answer contains refusal phrases ("I don't know", "I can't help with that") on a query that should be answerable`}),e.jsx("li",{children:"New query patterns not well-represented in golden set (check coverage gaps)"})]}),"Route 10–20 samples per day to start. Annotators spend ~30 seconds per sample. This generates ~140 high-quality labels per week with one part-time annotator."]}),e.jsx(y,{}),e.jsx("h2",{children:"45.7 The Evaluation Flywheel"}),e.jsx("p",{children:"Evaluation is only valuable if it drives improvement. Close the loop:"}),e.jsx(i,{title:"Evaluation Flywheel: Production Failures to Golden Dataset",language:"python",keyLine:12,keyNote:"Every production failure must become a regression test case",children:T}),e.jsxs("div",{className:"diagram-wrap",children:[e.jsx("div",{className:"diagram-title",children:"The Evaluation Flywheel"}),e.jsx("pre",{style:{margin:0,border:"none",background:"transparent",fontSize:"12px"},children:`Production traffic
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

Each rotation: golden set grows, failure surface shrinks, judge accuracy improves.`})]}),e.jsx("h2",{children:"45.8 Evaluation Stack Summary"}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Layer"}),e.jsx("th",{children:"Tool"}),e.jsx("th",{children:"Triggers"}),e.jsx("th",{children:"Purpose"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Unit tests"}),e.jsx("td",{children:"pytest"}),e.jsx("td",{children:"Every commit"}),e.jsx("td",{children:"Logic correctness, routing, safety filters"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Offline eval"}),e.jsx("td",{children:"RAGAS + LangSmith evaluate()"}),e.jsx("td",{children:"Every PR touching RAG/prompts"}),e.jsx("td",{children:"Quality regression gates"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Shadow eval"}),e.jsx("td",{children:"Custom async handler"}),e.jsx("td",{children:"New model version candidates"}),e.jsx("td",{children:"Validate challenger before cutover"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Online signals"}),e.jsx("td",{children:"Thumbs up/down + implicit events"}),e.jsx("td",{children:"Continuous (all traffic)"}),e.jsx("td",{children:"Real-world quality drift detection"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Annotation queue"}),e.jsx("td",{children:"LangSmith Annotation Queues"}),e.jsx("td",{children:"Triggered by low scores / negative feedback"}),e.jsx("td",{children:"Human labels for golden set growth"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Drift alerts"}),e.jsx("td",{children:"Custom tracker (Module 31 §31.7.1)"}),e.jsx("td",{children:"Continuous (rolling window)"}),e.jsx("td",{children:"PagerDuty alert on >0.05 score drop"})]})]})}),e.jsxs("div",{className:"callout callout-maang",children:[e.jsx("strong",{children:"🎯 MAANG Interview Connection"}),'"How do you ensure your AI system maintains quality in production?" → Three-layer answer: (1) Offline: RAGAS + LLM-as-Judge on 50-sample golden set gating every PR; (2) Online: async RAGAS sampling at 2–5% of traffic + explicit thumbs-up/down, routed to LangSmith annotation queue; (3) Continuous: rolling score tracker alerts on >0.05 drift from baseline. Follow-up: "What are the failure modes of LLM-as-Judge?" → position bias (swap augmentation), verbosity bias (explicit instruction), self-enhancement bias (use different model family). The complete answer shows you know evaluation is a system, not a one-shot script.']}),e.jsx(f,{moduleId:34,title:"Module 34: AI Evaluation Strategies",contentHint:"offline vs online vs unit test evaluation taxonomy, LLM-as-judge structured output JudgementScore, position bias swap augmentation, verbosity bias explicit instruction, self-enhancement bias different model family, multi-dimension scoring separate axes, agent evaluation task completion trajectory tool selection, LangSmith evaluate() experiment runs versioned datasets, explicit thumbs feedback vs implicit session signals, shadow evaluation challenger parallel no user exposure, A/B judge evaluation Kendall tau human agreement calibration, annotation queue routing thresholds LangSmith, evaluation flywheel production failure to golden set to CI gate"})]})}export{q as Mod45};
