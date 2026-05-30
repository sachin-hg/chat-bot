"""Classification pipeline nodes.

Implements:
    safety_node        — Tier 0 regex content check (no AI)
    normalize_node     — unicode normalisation + gibberish guard
    route_domain_node  — Stage 1 domain router (DomainRouterPort)
    classify_node      — Stage 2 domain-scoped classifier (ClassifierPort)
    validate_slm_node  — validates Stage 2 output; cross-checks domain vs main_intent
"""
from __future__ import annotations

import asyncio
import re
import unicodedata
from pathlib import Path
from typing import Optional, Set

from src.observability.logging import get_logger
from src.pipeline.state import BotState
from src.registries.intent_registry import INTENT_REGISTRY, get_intent_record

log = get_logger(__name__)

# ---------------------------------------------------------------------------
# Prompt loading helper
# ---------------------------------------------------------------------------

_REPO_ROOT = Path(__file__).parent.parent.parent.parent


def _load_template(rel_path: str) -> str:
    """Load a prompt template file relative to the repo root."""
    return (_REPO_ROOT / rel_path).read_text(encoding="utf-8")


# ---------------------------------------------------------------------------
# Safety helpers
# ---------------------------------------------------------------------------

# Blocked patterns: profanity / prompt-injection signals (kept narrow intentionally;
# the SLM Rule 1 handles social pleasantries and off-topic content).
_BLOCKED_PATTERNS = [
    re.compile(r"\bact\s+as\b", re.IGNORECASE),
    re.compile(r"\bpretend\s+(you\s+are|to\s+be)\b", re.IGNORECASE),
    re.compile(r"\bignore\s+(your\s+)?(instructions|rules|guidelines)\b", re.IGNORECASE),
    re.compile(r"\bforget\s+(your\s+)?(rules|instructions|guidelines)\b", re.IGNORECASE),
    re.compile(r"\bjailbreak\b", re.IGNORECASE),
    re.compile(r"\bDAN\b"),  # "Do Anything Now" prompt-injection token
]

_CANNED_SAFETY_RESPONSES: dict = {
    "prompt_injection": "I'm here to help you find properties. I can't respond to that kind of request.",
    "profanity":        "Let's keep things respectful. How can I help you with your property search?",
    "empty_message":    "Please type a message so I can help you.",
    "message_too_long": "Your message is too long. Please keep it under 5 000 characters.",
    "default":          "I'm unable to process that request. How can I help you find a property?",
}


_MAX_MESSAGE_LENGTH = 5000


def _check_content_safety(message: str) -> dict:
    """Regex-only safety check. Returns ContentCheckResult dict."""
    if not message or not message.strip():
        return {"blocked": True, "reason": "empty_message"}
    if len(message) > _MAX_MESSAGE_LENGTH:
        return {"blocked": True, "reason": "message_too_long"}
    for pattern in _BLOCKED_PATTERNS:
        if pattern.search(message):
            return {"blocked": True, "reason": "prompt_injection"}
    return {"blocked": False, "reason": None}


def _canned_safety_response(reason: Optional[str]) -> str:
    if reason and reason in _CANNED_SAFETY_RESPONSES:
        return _CANNED_SAFETY_RESPONSES[reason]
    return _CANNED_SAFETY_RESPONSES["default"]


# ---------------------------------------------------------------------------
# Normalisation helpers
# ---------------------------------------------------------------------------

def _normalize_text(text: str) -> str:
    """Unicode NFKC normalisation and strip.  Does NOT touch prices or amounts."""
    normalized = unicodedata.normalize("NFKC", text)
    return normalized.strip()


def _is_gibberish(msg: str) -> bool:
    """Narrow gibberish guard — only flags pathological patterns.

    Multi-word messages bypass entirely (they have intent structure).
    Long Indian city names pass: "thiruvananthapuram" max consonant run = 3,
    vowel ratio = 39%.
    """
    words = msg.strip().split()
    if len(words) > 1:
        return False   # multi-word → has structure, pass through

    word = words[0].lower()
    if len(word) < 6:
        return False   # too short to classify reliably

    vowels: Set[str] = set("aeiou")

    # Check 1: consecutive consonant run >= 5
    max_run = run = 0
    for ch in word:
        if ch.isalpha() and ch not in vowels:
            run += 1
            max_run = max(max_run, run)
        else:
            run = 0
    if max_run >= 5:
        return True

    # Check 2: repeated character (e.g., "jjjjjj", "aaaaaaa")
    if re.search(r"(.)\1{4,}", word):
        return True

    # Check 3: vowel starvation on strings >= 8 chars
    if len(word) >= 8:
        vowel_ratio = sum(1 for ch in word if ch in vowels) / len(word)
        if vowel_ratio < 0.15:
            return True

    return False


# ---------------------------------------------------------------------------
# Domain taxonomy prompt cache (loaded once at startup)
# ---------------------------------------------------------------------------

DOMAIN_TAXONOMY_PROMPTS: dict = {
    "property_search":  _load_template("prompts/slm/domains/property_search.md"),
    "property_detail":  _load_template("prompts/slm/domains/property_detail.md"),
    "locality":         _load_template("prompts/slm/domains/locality.md"),
    "project_research": _load_template("prompts/slm/domains/project_research.md"),
    "portfolio":        _load_template("prompts/slm/domains/portfolio.md"),
}
# NOTE: 'comparison' is NOT a separate domain. compare_localities is handled within
# the 'locality' domain prompt; compare_projects within 'project_research'.
# DOMAIN_MAIN_INTENTS allows 'comparison' main_intent from both of those domains.
# calculator/* intents are handled within 'property_detail' domain prompt.


# ---------------------------------------------------------------------------
# DOMAIN_MAIN_INTENTS — maps DomainType → set of valid main_intents for that domain
# ---------------------------------------------------------------------------

DOMAIN_MAIN_INTENTS: dict = {
    "property_search":  {"property_search"},
    # calculator sub-intents (calculate_emi, calculate_affordability, convert_unit) are
    # routed via the property_detail domain prompt — they appear as property_detail sub-intents
    # there.  Standalone `calculator` main_intent (from INTENT_REGISTRY) is also allowed here.
    "property_detail":  {"property_detail", "calculator"},
    "locality":         {"locality_research", "comparison"},
    "project_research": {"project_research", "comparison"},
    "portfolio":        {"portfolio"},
    "out_of_scope":     {"out_of_scope"},
    # multi_intent is handled by the explicit guard `c['main_intent'] != 'multi_intent'`
    # in validate_slm_node, so it is intentionally absent from DOMAIN_MAIN_INTENTS.
}


# ---------------------------------------------------------------------------
# Filter compaction helper
# ---------------------------------------------------------------------------

def _compact_filters(active_filters: dict) -> dict:
    """Return a compact copy of active_filters without None values."""
    return {k: v for k, v in (active_filters or {}).items() if v is not None}


# ---------------------------------------------------------------------------
# Out-of-scope response builder
# ---------------------------------------------------------------------------

def _build_out_of_scope_response(classification: dict) -> str:
    sub = classification.get("sub_intent", "out_of_scope_query")
    if sub == "insufficient_info":
        return "Could you rephrase that? I didn't quite understand what you're looking for."
    return "I'm here to help you find properties on Housing.com. How can I assist you?"


# ---------------------------------------------------------------------------
# Node 1: safety_node
# ---------------------------------------------------------------------------

async def safety_node(state: BotState) -> dict:
    """Tier 0 content safety check — regex only, no AI call.

    Input:  state['raw_message']
    Output: state['safety_result'] (always set)
            state['bot_response']  (only when blocked — short-circuits pipeline)
    """
    raw_message: str = state.get("raw_message", "")
    safety_result = _check_content_safety(raw_message)

    if safety_result["blocked"]:
        reason = safety_result.get("reason")
        log.warning(
            "safety_blocked",
            reason=reason,
            request_id=state.get("request_id"),
        )
        return {
            "safety_result": safety_result,
            "bot_response":  _canned_safety_response(reason),
        }

    return {"safety_result": safety_result}


# ---------------------------------------------------------------------------
# Node 2: normalize_node
# ---------------------------------------------------------------------------

async def normalize_node(state: BotState) -> dict:
    """Minimal pre-processing — unicode NFC normalisation and trim only.

    Does NOT pre-extract prices or amounts.  Regex cannot distinguish
    "under 80L budget" from "Block 80L Extension".  The SLM has context; regex does not.

    Input:  state['raw_message']
    Output: state['normalized_message'] (always set)
            state['bot_response']       (only when gibberish — short-circuits pipeline)
    """
    raw_message: str = state.get("raw_message", "")
    normalized = _normalize_text(raw_message)

    if _is_gibberish(normalized):
        log.info(
            "normalize_gibberish",
            message_len=len(normalized),
            request_id=state.get("request_id"),
        )
        return {
            "normalized_message": normalized,
            "bot_response": "I didn't catch that — could you describe what you're looking for?",
        }

    return {"normalized_message": normalized}


# ---------------------------------------------------------------------------
# Node 3a: route_domain_node
# ---------------------------------------------------------------------------

async def route_domain_node(state: BotState, router: object) -> dict:
    """Stage 1 domain router.

    Calls router.route() (DomainRouterPort) with normalized message + session context.
    Low-confidence results (< 0.65) are coerced to out_of_scope.

    Input:  state['normalized_message'], state['session']
    Output: state['domain']
    """
    session: dict = state.get("session") or {}

    try:
        result: dict = await router.route({   # type: ignore[attr-defined]
            "message":         state.get("normalized_message", ""),
            "previous_domain": session.get("last_domain"),
            "last_intent":     session.get("last_intent"),
        })
    except asyncio.TimeoutError:
        log.warn("domain_router_timeout", session_id=session.get("session_id"))
        fallback_domain: str = session.get("last_domain") or "out_of_scope"
        return {
            "domain": fallback_domain,
            "classification": {"timeout_fallback": True, "confidence": 0.0},
        }

    domain: str = result.get("domain", "out_of_scope")
    confidence: float = result.get("confidence", 0.0)

    # Low-confidence domain routing → treat as out_of_scope; clarify via nested_qna.
    if confidence < 0.65 and domain != "out_of_scope":
        log.info(
            "route_domain_low_confidence",
            domain=domain,
            confidence=confidence,
            coerced_to="out_of_scope",
            request_id=state.get("request_id"),
        )
        domain = "out_of_scope"

    return {"domain": domain}


# ---------------------------------------------------------------------------
# Node 3b: classify_node
# ---------------------------------------------------------------------------

async def classify_node(state: BotState, classifier: object) -> dict:
    """Stage 2 domain-scoped intent classifier.

    If domain == 'out_of_scope': returns a canned classification immediately —
    zero SLM token cost.

    Otherwise: calls classifier.classify() (ClassifierPort) with the domain-specific
    taxonomy prompt and session context.

    Input:  state['normalized_message'], state['domain'], state['session']
    Output: state['classification'] (SLMOutput dict)
    """
    domain: str = state.get("domain") or "out_of_scope"
    session: dict = state.get("session") or {}

    # out_of_scope fast path — no Stage 2 SLM call
    if domain == "out_of_scope":
        return {
            "classification": {
                "main_intent":          "out_of_scope",
                "sub_intent":           "out_of_scope_query",
                "entities_mentioned":   [],
                "multi_intent":         False,
                "pivot":                False,
                "filter_delta":         {},
                "clarification_needed": None,
                "reasoning":            "domain_router: out_of_scope",
            }
        }

    taxonomy_prompt: str = DOMAIN_TAXONOMY_PROMPTS.get(domain, "")
    classification: dict = await classifier.classify({   # type: ignore[attr-defined]
        "message":         state.get("normalized_message", ""),
        "domain":          domain,
        "taxonomy_prompt": taxonomy_prompt,
        "history":         session.get("last_3_turns") or [],
        "previous_intent": session.get("last_intent"),
        "active_filters":  _compact_filters(session.get("active_filters") or {}),
    })
    return {"classification": classification}


# ---------------------------------------------------------------------------
# Node 3c: validate_slm_node
# ---------------------------------------------------------------------------

async def validate_slm_node(state: BotState) -> dict:
    """Validates Stage 2 SLM JSON output before any downstream node consumes it.

    Three successive guardrail checks:
    1. Required fields present
    2. main_intent in DOMAIN_MAIN_INTENTS for the routed domain
    3. intent pair (main_intent, sub_intent) exists in INTENT_REGISTRY

    Also type-coerces known SLM mis-shape patterns:
    - localities: str → list
    - clarification_needed: bool → str or None
    - entities_mentioned: drops items missing 'name' or 'inferred_type'

    Input:  state['classification'], state['domain']
    Output: state['classification'] (validated + coerced)
            state['bot_response']   (only on validation failure — short-circuits pipeline)
    """
    c: Optional[dict] = state.get("classification")
    session_id: str = (state.get("session") or {}).get("session_id", "unknown")

    # ── Check 1: required fields ────────────────────────────────────────
    valid = (
        c is not None
        and isinstance(c.get("main_intent"), str)
        and isinstance(c.get("sub_intent"),  str)
        and isinstance(c.get("multi_intent"), bool)
        and isinstance(c.get("pivot"),        bool)
        and isinstance(c.get("entities_mentioned"), list)
    )

    if not valid:
        log.error(
            "slm_invalid_output",
            raw=c,
            session=session_id,
            request_id=state.get("request_id"),
        )
        return {"bot_response": "I had trouble understanding that — could you rephrase?"}

    # ── Check 2: cross-domain hallucination guard ───────────────────────
    domain: str = state.get("domain") or "out_of_scope"
    allowed_intents: set = DOMAIN_MAIN_INTENTS.get(domain, set())

    if (
        c["main_intent"] not in allowed_intents
        and c["main_intent"] != "multi_intent"
        and c["main_intent"] != "out_of_scope"
    ):
        log.warning(
            "cross_domain_intent",
            domain=domain,
            main_intent=c["main_intent"],
            session=session_id,
            request_id=state.get("request_id"),
        )
        return {
            "bot_response": _build_out_of_scope_response({
                "main_intent": "out_of_scope",
                "sub_intent":  "out_of_scope_query",
            })
        }

    # ── Check 3: intent pair in INTENT_REGISTRY ─────────────────────────
    if (
        not get_intent_record(c["main_intent"], c["sub_intent"])
        and c["main_intent"] != "multi_intent"
    ):
        log.warning(
            "unknown_intent",
            main_intent=c["main_intent"],
            sub_intent=c["sub_intent"],
            domain=domain,
            session=session_id,
            request_id=state.get("request_id"),
        )
        return {
            "bot_response": _build_out_of_scope_response({
                "main_intent": "out_of_scope",
                "sub_intent":  "out_of_scope_query",
            })
        }

    # ── Type coercions ──────────────────────────────────────────────────
    c = dict(c)

    # localities must be list[str] or None
    delta = dict(c.get("filter_delta") or {})
    if "localities" in delta and isinstance(delta["localities"], str):
        delta["localities"] = [delta["localities"]]
        c["filter_delta"] = delta

    # clarification_needed must be a non-empty string or None — not a bool
    cn = c.get("clarification_needed")
    if cn is True:
        c["clarification_needed"] = "Could you clarify what you are looking for?"
    elif cn is False or cn == "":
        c["clarification_needed"] = None

    # clarification_data must be present when clarification_needed is set.
    if c.get("clarification_needed") and not c.get("clarification_data"):
        c["clarification_data"] = {"question_id": "q1", "options": []}

    # entities_mentioned items must each have 'name' and 'inferred_type' keys.
    raw_entities: list = c.get("entities_mentioned") or []
    entities = [
        e for e in raw_entities
        if isinstance(e, dict) and "name" in e and "inferred_type" in e
    ]
    if len(entities) != len(raw_entities):
        log.warning(
            "slm_malformed_entities",
            raw=raw_entities,
            session=session_id,
            request_id=state.get("request_id"),
        )
        c["entities_mentioned"] = entities

    # Trim reasoning to ≤30 words to keep logs compact
    if c.get('reasoning'):
        words = c['reasoning'].split()
        if len(words) > 30:
            c['reasoning'] = ' '.join(words[:30])

    return {"classification": c}
