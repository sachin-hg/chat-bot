"""Playground UI — served at GET /playground"""
from fastapi import APIRouter
from fastapi.responses import HTMLResponse
from pathlib import Path

router = APIRouter()

_HTML_PATH = Path(__file__).parent.parent.parent / "src" / "static" / "playground.html"


@router.get("/playground", response_class=HTMLResponse, include_in_schema=False)
async def playground():
    return HTMLResponse(_HTML_PATH.read_text(encoding="utf-8"))
