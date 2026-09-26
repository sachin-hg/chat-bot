"""Course API — AI-powered interactive learning endpoints.

Provides:
  GET  /learn              → serves the interactive course UI
  POST /learn/api/quiz     → generate quiz questions for a module (Claude)
  POST /learn/api/evaluate → evaluate a quiz answer (Claude)
  POST /learn/api/ask      → explain a concept (Claude AI tutor)
  POST /learn/api/critique → critique a section of content (Claude)
"""
from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

from src.observability.logging import get_logger

log = get_logger(__name__)
router = APIRouter(prefix="/learn", tags=["learn"])

_STATIC = Path(__file__).parent.parent / "static"
_COURSE_BUILD = _STATIC / "course-build"
_COURSE_MD = Path(__file__).parent.parent.parent / "COURSE.md"
_QUIZ_SEEDS = _STATIC / "quiz_seeds"


def _course_html() -> str:
    html_path = _COURSE_BUILD / "index.html"
    if not html_path.exists():
        raise HTTPException(status_code=503, detail="Course UI not built — run: cd frontend && npm run build")
    return html_path.read_text(encoding="utf-8")


@router.get("", response_class=HTMLResponse)
async def serve_course():
    return HTMLResponse(content=_course_html())


@router.get("/module/{module_id}", response_class=HTMLResponse)
async def serve_course_module(module_id: int):
    return HTMLResponse(content=_course_html())


@router.get("/{path:path}", response_class=HTMLResponse)
async def serve_course_spa(path: str):
    """Catch-all: serve SPA for any /learn/* deep link (React Router handles routing client-side)."""
    return HTMLResponse(content=_course_html())


class QuizRequest(BaseModel):
    module_id: int
    module_title: str
    content_snippet: str
    num_questions: int = 3


class EvaluateRequest(BaseModel):
    question: str
    user_answer: str
    correct_answer: str
    question_type: str  # mcq | short | design | gotcha


class AskRequest(BaseModel):
    question: str
    context: str   # which module/section the user is on
    course_section: str = ""


class CritiqueRequest(BaseModel):
    section_title: str
    content: str


def _get_client():
    import anthropic
    return anthropic.AsyncAnthropic()


@router.post("/api/quiz")
async def generate_quiz(req: QuizRequest):
    """Generate quiz questions for a module using Claude."""
    client = _get_client()
    prompt = f"""You are a senior engineering educator. Generate {req.num_questions} quiz questions
for Module {req.module_id}: "{req.module_title}" of a course on building production AI agents.

Content context:
{req.content_snippet[:2000]}

Generate a mix of:
- Multiple choice (4 options, one correct)
- Short answer (open-ended but specific)
- Gotcha questions (tests subtle misunderstandings)

Return ONLY valid JSON:
{{
  "questions": [
    {{
      "id": "m{req.module_id}q1",
      "type": "mcq|short|gotcha",
      "difficulty": 1-5,
      "question": "...",
      "options": ["A", "B", "C", "D"],  // only for mcq
      "answer": "correct answer or option index for mcq",
      "explanation": "why this is correct and what the wrong answers get wrong",
      "hint": "nudge without giving it away"
    }}
  ]
}}"""

    try:
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()
        if raw.startswith("```"):
            raw = "\n".join(raw.split("\n")[1:-1])
        return JSONResponse(content=json.loads(raw))
    except Exception as exc:
        log.error("quiz_generation_failed", error=str(exc))
        seed_path = _QUIZ_SEEDS / f"module_{req.module_id}.json"
        if seed_path.exists():
            seed = json.loads(seed_path.read_text())
            return JSONResponse(content={"questions": seed["questions"][:req.num_questions], "_fallback": True})
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/evaluate")
async def evaluate_answer(req: EvaluateRequest):
    """Evaluate a user's quiz answer and provide detailed feedback."""
    client = _get_client()
    prompt = f"""You are a senior engineering mentor evaluating a student's answer.

Question: {req.question}
Correct answer: {req.correct_answer}
Student's answer: {req.user_answer}
Question type: {req.question_type}

Evaluate and respond with JSON only:
{{
  "score": 0-100,
  "correct": true|false,
  "feedback": "specific, encouraging feedback explaining what they got right/wrong",
  "what_to_review": "which concept to re-read",
  "next_question_hint": "harder or easier next question based on performance"
}}

Be encouraging but honest. For design questions, give partial credit for good reasoning even if the implementation differs."""

    try:
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=600,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()
        if raw.startswith("```"):
            raw = "\n".join(raw.split("\n")[1:-1])
        return JSONResponse(content=json.loads(raw))
    except Exception as exc:
        log.error("evaluation_failed", error=str(exc))
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/ask")
async def ask_tutor(req: AskRequest):
    """AI tutor — explain any concept from the course."""
    client = _get_client()
    course_context = ""
    if _COURSE_MD.exists():
        course_context = _COURSE_MD.read_text(encoding="utf-8")[:8000]

    prompt = f"""You are a senior engineering mentor teaching a course on building production AI agents.
The student is on: {req.context}

Course content (for reference):
{course_context}

Student's question: {req.question}

Answer in a way that:
- Starts with the core insight in 1-2 sentences
- Uses a concrete analogy if helpful
- Shows a code example if relevant
- Ends with a follow-up question to check understanding

Keep your response under 300 words. Be direct and practical, not vague."""

    try:
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}],
        )
        return JSONResponse(content={"answer": response.content[0].text.strip()})
    except Exception as exc:
        log.error("tutor_ask_failed", error=str(exc))
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/critique")
async def critique_section(req: CritiqueRequest):
    """Critique agent — identify gaps in a content section."""
    client = _get_client()
    prompt = f"""You are a world-class engineering educator critiquing course content.

Section: "{req.section_title}"
Content:
{req.content[:3000]}

Critique this content and return JSON:
{{
  "clarity_score": 1-10,
  "completeness_score": 1-10,
  "practical_score": 1-10,
  "gaps": ["what's missing"],
  "improvements": ["specific rewrites or additions"],
  "great_parts": ["what works well"]
}}"""

    try:
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()
        if raw.startswith("```"):
            raw = "\n".join(raw.split("\n")[1:-1])
        return JSONResponse(content=json.loads(raw))
    except Exception as exc:
        log.error("critique_failed", error=str(exc))
        raise HTTPException(status_code=500, detail=str(exc))
