"""Processing pipeline nodes.

Implements:
    filter_apply_node      — Merge SLM filter_delta into session.active_filters
                             using ADD vs REPLACE semantics from FILTER_REGISTRY.
    sanitize_node          — Clear filters that don't make sense after an intent pivot.
    resolve_entities_node  — Pre-resolve locality/project entities before the LLM call.
                             Sprint 1: autosuggest HTTP client not yet available; uses
                             stub implementation that logs and returns mock data.
    derive_node            — Convert derived filter signals to concrete API params.
    clarify_node           — Short-circuit to emit nested_qna when SLM signals
                             clarification is needed.
    route_node             — Route the classified intent to tier 0/1/2 actions or
                             return routing metadata for tier 3a/3b LLM nodes.
"""
from __future__ import annotations

import asyncio
import re
from typing import Any, Dict, List, Union

from src.observability.logging import get_logger
from src.pipeline.state import BotState
from src.registries.filter_registry import FILTER_REGISTRY, get_filter_record
from src.registries.intent_registry import get_intent_record
from src.tools.executor import TOOL_DEFAULT_TIMEOUTS, get_tool_cache_ttl  # noqa: F401

log = get_logger(__name__)

# ---------------------------------------------------------------------------
# FILTER_REGISTRY lookup — build a key → default_operation map once at import
# ---------------------------------------------------------------------------

_FILTER_OP: dict[str, str] = {rec.key: rec.default_operation for rec in FILTER_REGISTRY}

# ---------------------------------------------------------------------------
# Universal keys — always preserved across any intent pivot
# ---------------------------------------------------------------------------

_UNIVERSAL_KEYS = frozenset({"city", "transaction_type", "lat", "lng", "outer_radius"})

# ---------------------------------------------------------------------------
# Intent-local keys — cleared on pivot (unless the new intent explicitly
# accepts them via FILTER_REGISTRY carry logic)
# ---------------------------------------------------------------------------

_INTENT_LOCAL_KEYS = frozenset({
    "bhk",
    "price_min",
    "price_max",
    "price_per_sqft",
    "amenities",
    "carpet_area_min",
    "carpet_area_max",
    "property_age",
    "ready_to_move",
    "furnished_status",
})

# ---------------------------------------------------------------------------
# parse_amount
# ---------------------------------------------------------------------------

_CR_RE   = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*cr(?:ore)?s?\s*$", re.IGNORECASE)
_LAKH_RE = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*(?:l(?:akh)?s?|L)\s*$", re.IGNORECASE)
_K_RE    = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*[kK]\s*$")


def parse_amount(s: Union[str, int, float]) -> int:
    """Convert a tagged amount string to an integer (INR).

    Supported tags (case-insensitive):
      "2cr"   / "2 crore"  → 20_000_000
      "80L"   / "80 lakh"  → 8_000_000
      "30K"               → 30_000

    Already an int/float → returned as int.
    Unrecognised string  → 0.
    """
    if isinstance(s, (int, float)):
        return int(s)

    m = _CR_RE.match(s)
    if m:
        return int(float(m.group(1)) * 10_000_000)

    m = _LAKH_RE.match(s)
    if m:
        return int(float(m.group(1)) * 100_000)

    m = _K_RE.match(s)
    if m:
        return int(float(m.group(1)) * 1_000)

    return 0


# ---------------------------------------------------------------------------
# apply_filter_delta
# ---------------------------------------------------------------------------

def apply_filter_delta(session: dict, filter_delta: dict) -> dict:
    """Merge filter_delta into session['active_filters'] using FILTER_REGISTRY semantics.

    Rules per key:
      REPLACE (default for unknown keys) — overwrite the existing value.
      ADD                                — merge into existing list (set-union,
                                           preserve insertion order, no duplicates).

    Returns an updated session dict (shallow copy — active_filters is a new dict).
    """
    active_filters: dict = dict(session.get("active_filters") or {})

    for key, value in filter_delta.items():
        op = _FILTER_OP.get(key, "REPLACE")

        if op == "ADD" and value is not None:
            existing = list(active_filters.get(key) or [])
            incoming = list(value) if isinstance(value, (list, tuple)) else [value]
            # Set-union preserving order: existing first, then new items not already present
            seen = set(existing)
            for item in incoming:
                if item not in seen:
                    existing.append(item)
                    seen.add(item)
            active_filters[key] = existing
        else:
            # REPLACE, RELAX, REMOVE — or value is None (clear the key)
            if value is None:
                active_filters.pop(key, None)
            else:
                active_filters[key] = value

    session = dict(session)
    session["active_filters"] = active_filters
    return session


# ---------------------------------------------------------------------------
# Node: filter_apply_node  (CHAT-P-008)
# ---------------------------------------------------------------------------

async def filter_apply_node(state: BotState, emit_sse=None) -> dict:
    """Merge SLM filter_delta into session.active_filters.

    Reads filter_delta from state['classification']['filter_delta'].
    Skips merge when clarification_needed is set (user hasn't confirmed intent yet).

    Input:  state['classification'], state['session']
    Output: state['session']              (updated active_filters)
            state['filter_delta_applied'] (True when merge happened)
    """
    c = state.get("classification") or {}
    filter_delta = c.get("filter_delta")
    clarification_needed = c.get("clarification_needed")
    session = dict(state["session"])

    if filter_delta:
        # Apply known filters regardless of whether clarification is needed.
        # Clarification asks for MORE info — it should not discard what is already known.
        # E.g. "something in Bangalore" → city=Bangalore is known even if BHK is unclear.
        filters_before = dict(session.get("active_filters") or {})
        filter_delta = dict(filter_delta)
        for key in ("price_min", "price_max", "price_per_sqft"):
            if isinstance(filter_delta.get(key), str):
                filter_delta[key] = parse_amount(filter_delta[key])

        session = apply_filter_delta(session, filter_delta)

        log.info(
            "filter_apply_node_applied",
            keys=list(filter_delta.keys()),
            clarification_pending=bool(clarification_needed),
            request_id=state.get("request_id"),
        )
        if emit_sse:
            emit_sse("pipeline_step", {
                "step":                  "filters",
                "before":                filters_before,
                "delta":                 filter_delta,
                "after":                 dict(session.get("active_filters") or {}),
                "pivot":                 c.get("pivot", False),
                "clarification_pending": bool(clarification_needed),
            })
        return {"session": session, "filter_delta_applied": True}

    return {}


# ---------------------------------------------------------------------------
# sanitize_filters_on_pivot
# ---------------------------------------------------------------------------

def sanitize_filters_on_pivot(classification: dict, session: dict) -> dict:
    """Clear filters that don't make sense after an intent pivot.

    Preservation logic (in priority order):
    1. Universal keys — always kept: city, transaction_type, lat, lng, outer_radius.
    2. localities     — always carried when present (cross-intent context).
    3. Keys defined in FILTER_REGISTRY that are NOT on the intent-local clear list
       are preserved (e.g. property_type, construction_status) unless they appear
       in _INTENT_LOCAL_KEYS.

    Everything else (intent-local keys, keys not in FILTER_REGISTRY) is dropped.
    """
    new_intent: str = classification.get("main_intent", "")
    active_filters: dict = dict(session.get("active_filters") or {})

    kept_filters: dict = {}

    for key, value in active_filters.items():
        # 1. Universal keys — always preserved
        if key in _UNIVERSAL_KEYS:
            kept_filters[key] = value
            continue

        # 2. localities — always carried
        if key == "localities":
            kept_filters[key] = value
            continue

        # 3. Intent-local keys — always cleared on pivot
        if key in _INTENT_LOCAL_KEYS:
            continue

        # 4. Keys in FILTER_REGISTRY that are not intent-local — preserve
        if key in _FILTER_OP:
            kept_filters[key] = value
            continue

        # 5. Unknown keys — drop

    log.info(
        "sanitize_filters_on_pivot",
        new_intent=new_intent,
        removed_keys=[k for k in active_filters if k not in kept_filters],
        request_id=None,
    )

    session = dict(session)
    session["active_filters"] = kept_filters
    return session


# ---------------------------------------------------------------------------
# Node: sanitize_node  (CHAT-P-009)
# ---------------------------------------------------------------------------

async def sanitize_node(state: BotState, emit_sse=None) -> dict:
    """Clear filters that don't make sense after an intent pivot.

    Runs only when classification['pivot'] is True; no-ops otherwise.

    Input:  state['classification'], state['session']
    Output: state['session']   (sanitized active_filters)
            state['sanitized'] (True when sanitization ran)
    """
    c = state.get("classification") or {}
    if c.get("pivot"):
        before = dict((state["session"].get("active_filters") or {}))
        session = sanitize_filters_on_pivot(c, dict(state["session"]))
        after  = dict((session.get("active_filters") or {}))
        cleared = [k for k in before if k not in after]
        log.info("sanitize_node_ran", new_intent=c.get("main_intent"), request_id=state.get("request_id"))
        if emit_sse:
            emit_sse("pipeline_step", {"step": "node_result", "node": "sanitize",
                                       "status": "pivot_sanitized",
                                       "new_intent": c.get("main_intent"),
                                       "cleared_keys": cleared,
                                       "filters_after": after})
        return {"session": session, "sanitized": True}
    if emit_sse:
        emit_sse("pipeline_step", {"step": "node_result", "node": "sanitize",
                                   "status": "no_pivot_skipped"})
    return {}


# ---------------------------------------------------------------------------
# requires_pre_resolution
# ---------------------------------------------------------------------------

_PRE_RESOLUTION_INTENTS = frozenset({
    "property_search",
    "property_detail",
    "locality",
    "project_research",
})

_SKIP_PRE_RESOLUTION_SUB_INTENTS = frozenset({
    "recent_searches",
    "recommendations",
})


def requires_pre_resolution(main_intent: str, sub_intent: str) -> bool:
    """Return True when entities should be resolved before the LLM call.

    True for:  main_intent in property_search | property_detail | locality |
               project_research
    Exception: False when sub_intent in recent_searches | recommendations
               (no entity resolution needed for curated / history-backed results)
    False for: portfolio, out_of_scope, or any other main_intent.
    """
    if sub_intent in _SKIP_PRE_RESOLUTION_SUB_INTENTS:
        return False
    return main_intent in _PRE_RESOLUTION_INTENTS


# ---------------------------------------------------------------------------
# pre_resolve_entities  (Sprint 1 stub — CHAT-P-017 will replace)
# ---------------------------------------------------------------------------

async def pre_resolve_entities(entities: list[dict], session: dict) -> dict:
    """Resolve entity names to UUIDs via autosuggest.

    Sprint 1 stub — logs each entity and returns a zero-confidence placeholder
    so the eagerness guard in summary_node skips summary generation.

    Args:
        entities: list of {'name': str, 'type': str} dicts from classification.
        session:  current session dict (reserved for future cache look-ups).

    Returns:
        dict keyed by entity name with resolution metadata.
    """
    # TODO CHAT-P-017: replace with real resolveEntity autosuggest calls
    resolved: dict = {}
    for entity in entities:
        log.info(
            "entity_pre_resolution_stub",
            name=entity["name"],
            entity_type=entity.get("type"),
        )
        resolved[entity["name"]] = {
            "uuid": None,
            "display_name": entity["name"],
            "entity_type": entity.get("type", "locality"),
            "confidence": 0.0,
        }
    return resolved


# ---------------------------------------------------------------------------
# Node: resolve_entities_node  (CHAT-P-011 / CHAT-P-017)
# ---------------------------------------------------------------------------

async def _resolve_entities_real(entities: list, session: dict, executor) -> dict:
    """Resolve entities via the real resolveEntity executor (CHAT-P-017)."""
    resolved = {}
    for entity in entities:
        name = entity.get('name', '')
        params = {
            'query':       name,
            'entity_type': entity.get('type', 'locality'),
            'city':        session.get('city', ''),
        }
        try:
            from src.tools.executor import get_tool_cache_ttl
            ttl = get_tool_cache_ttl('resolveEntity')
            result = await executor.execute('resolveEntity', params, ttl)
            resolved[name] = result
        except Exception as exc:
            log.warn('entity_resolution_failed', name=name, error=str(exc))
            resolved[name] = {
                'uuid':         None,
                'display_name': name,
                'entity_type':  entity.get('type', 'locality'),
                'confidence':   0.0,
            }
    return resolved


_ORDINAL_WORDS = {
    "first": 1, "1st": 1,
    "second": 2, "2nd": 2,
    "third": 3, "3rd": 3,
    "fourth": 4, "4th": 4,
    "fifth": 5, "5th": 5,
    "last": -1,  # resolve to last item
}


def _parse_ordinal(text: str) -> int | None:
    """Convert an ordinal word/number to a 1-based index. Returns None if not ordinal."""
    t = text.strip().lower()
    if t in _ORDINAL_WORDS:
        return _ORDINAL_WORDS[t]
    try:
        n = int(t)
        return n if 1 <= n <= 20 else None
    except ValueError:
        return None


def _resolve_ordinal_from_carousel(ordinal: int, carousel: dict) -> dict | None:
    """Resolve an ordinal index against the session carousel_state.

    Returns None if the carousel is stale (>6 turns ago) or index out of range.
    """
    items = carousel.get("items") or []
    if not items:
        return None
    n = len(items)
    idx = (n - 1) if ordinal == -1 else (ordinal - 1)  # -1 means "last"
    if idx < 0 or idx >= n:
        return None
    item = items[idx]
    return item


async def resolve_entities_node(state: BotState, executor=None, emit_sse=None) -> dict:
    """Pre-resolve locality/project entities before the LLM call.

    Also handles ordinal carousel references ("second property", "third one"):
    when an entity has inferred_type == 'ordinal' or 'ordinal_property',
    look up session['carousel_state'] and resolve to the actual item ID.
    Carousel state expires after 6 turns (context has likely moved on).

    Input:  state['classification'], state['session']
    Output: state['resolved_entities']  (resolved entity map)
            state['session']            (updated with active_property_id / active_locality_id)
    """
    c = state.get("classification") or {}
    main_intent = c.get("main_intent", "")
    sub_intent  = c.get("sub_intent", "")
    entities    = c.get("entities_mentioned") or []
    session     = dict(state["session"])

    # ── entity_refs resolution ─────────────────────────────────────────────
    # entity_refs is output by the SLM as structured references to session-stored
    # context ("looking_for":"property", "by":"cardinality", "value":2).
    # The orchestrator resolves them here — the LLM never sees carousel items.
    # This keeps token cost near zero for reference resolution.
    #
    # Supported ref types:
    #   by="cardinality": ordinal index into session['carousel_state'] (1-based; -1=last)
    #   by="active":      the currently active entity (session['active_property_id'] etc.)
    #   by="recent":      the most-recently-stored carousel item (index -1)
    #
    # Backwards compat: also handles legacy inferred_type="ordinal_property" entities.

    entity_refs   = c.get("entity_refs") or []
    carousel      = session.get("carousel_state") or {}
    turn_count    = session.get("turn_count", 0)
    carousel_age  = turn_count - carousel.get("stored_at_turn", -999)
    carousel_live = carousel_age <= 6  # expire after 6 turns

    ordinal_resolved: dict = {}

    def _apply_carousel_ref(ref_key: str, item: dict, ctype: str) -> None:
        entity_id = item.get("id") or item.get("uuid", "")
        if not entity_id:
            return
        if ctype == "property":
            session["active_property_id"] = entity_id
            ordinal_resolved[ref_key] = {
                "uuid": entity_id, "display_name": item.get("title", ref_key),
                "entity_type": "property", "confidence": 1.0, "property_id": entity_id,
            }
            log.info("entity_ref_resolved_property", ref=ref_key, id=entity_id)
        elif ctype == "locality":
            session["active_locality_id"] = entity_id
            ordinal_resolved[ref_key] = {
                "uuid": entity_id, "display_name": item.get("name", ref_key),
                "entity_type": "locality", "confidence": 1.0,
            }
            log.info("entity_ref_resolved_locality", ref=ref_key, id=entity_id)

    # 1. Process structured entity_refs (new schema)
    for ref in entity_refs:
        looking_for = ref.get("looking_for", "property")
        by          = ref.get("by", "cardinality")
        value       = ref.get("value")
        ref_key     = f"ref:{looking_for}:{by}:{value}"

        if by == "cardinality" and carousel_live and carousel.get("type") == looking_for:
            idx = int(value) if value is not None else 1
            item = _resolve_ordinal_from_carousel(idx, carousel)
            if item:
                _apply_carousel_ref(ref_key, item, looking_for)

        elif by in ("active", "recent"):
            if looking_for == "property" and session.get("active_property_id"):
                pass   # already set — no-op
            elif by == "recent" and carousel_live and carousel.get("type") == looking_for:
                items = carousel.get("items") or []
                if items:
                    _apply_carousel_ref(ref_key, items[-1], looking_for)

    # 2. Backwards-compat: legacy inferred_type="ordinal_*" in entities_mentioned
    if carousel_live and carousel.get("items"):
        for entity in entities:
            inferred = entity.get("inferred_type", "")
            name     = entity.get("name", "")
            is_ord   = inferred in ("ordinal", "ordinal_property", "ordinal_locality")
            ord_num  = _parse_ordinal(name)
            if not is_ord and ord_num is not None:
                is_ord = True
            if is_ord:
                num = ord_num or 1
                ctype = carousel.get("type", "property")
                item = _resolve_ordinal_from_carousel(num, carousel)
                if item:
                    _apply_carousel_ref(name, item, ctype)

    # Non-ordinal entities: resolve names via autosuggest when needed
    named_entities = [
        e for e in entities
        if e.get("inferred_type") not in ("ordinal", "ordinal_property", "ordinal_locality")
        and _parse_ordinal(e.get("name", "")) is None
    ]

    named_resolved: dict = {}
    if requires_pre_resolution(main_intent, sub_intent) and named_entities:
        if executor is not None:
            named_resolved = await _resolve_entities_real(named_entities, session, executor)
        else:
            named_resolved = await pre_resolve_entities(named_entities, session)

    all_resolved = {**named_resolved, **ordinal_resolved}

    if all_resolved:
        session.setdefault("resolved_entity_map", {}).update(all_resolved)
        if emit_sse:
            emit_sse("pipeline_step", {
                "step": "node_result", "node": "resolve_entities",
                "status": "resolved",
                "entities": {k: {"uuid": v.get("uuid"), "confidence": v.get("confidence"),
                                 "display_name": v.get("display_name"), "entity_type": v.get("entity_type")}
                             for k, v in all_resolved.items()},
                "active_property_id": session.get("active_property_id"),
                "active_locality_id": session.get("active_locality_id"),
            })
        return {"resolved_entities": all_resolved, "session": session}

    if emit_sse:
        emit_sse("pipeline_step", {"step": "node_result", "node": "resolve_entities",
                                   "status": "no_entities"})
    return {}


# ---------------------------------------------------------------------------
# Helpers for route_node  (CHAT-P-012)
# ---------------------------------------------------------------------------

def build_login_template_response(main_intent: str, sub_intent: str) -> dict:
    """Return a login prompt template when the intent requires authentication."""
    return {
        'template_id': 'login',
        'data': {
            'message': 'Please log in to access your saved properties and personalized recommendations.',
            'intent': f'{main_intent}/{sub_intent}',
        },
    }


def build_out_of_scope_response(classification: dict) -> dict:
    """Return an out-of-scope canned response template."""
    return {
        'template_id': 'text_response',
        'data': {
            'text': "I can help you with property search, locality research, and real estate questions. What would you like to know?",
        },
    }


async def execute_tier1_action(state: BotState) -> dict:
    """Execute a Tier 1 (orchestrator-handled) action.

    Sprint 1 implements the two most common sub-intents; others return a generic stub.
    """
    sub_intent = state['classification'].get('sub_intent')
    log.info('tier1_action_executed', sub_intent=sub_intent)

    if sub_intent == 'contact_seller':
        return {
            'template_id': 'contact_seller',
            'data': {'propertyId': state['session'].get('active_property_id')},
        }

    if sub_intent == 'calculate_emi':
        loan_amount = state['classification'].get('filter_delta', {}).get('loan_amount')
        rate = state['classification'].get('filter_delta', {}).get('rate', 8.5)
        if loan_amount:
            r = rate / 1200
            n = 240
            emi = loan_amount * r * (1 + r) ** n / ((1 + r) ** n - 1)
            return {
                'template_id': 'emi_result',
                'data': {
                    'monthly_emi': int(emi),
                    'loan_amount': loan_amount,
                    'rate': rate,
                    'tenure_years': 20,
                },
            }
        return {
            'template_id': 'text_response',
            'data': {'text': 'Please provide the loan amount to calculate EMI.'},
        }

    return {'template_id': 'text_response', 'data': {'text': 'Action completed.'}}


async def execute_tier2_action(state: BotState, executor=None) -> dict:
    """Execute a Tier 2 (orchestrator-fetched, no LLM) action.

    Fetches data using the intent's data_requirements, then builds a template
    response. No LLM call — the orchestrator formats the result directly.

    Supported sub-intents:
      portfolio/saved_properties       → property_carousel (getSavedProperties)
      portfolio/viewed_properties      → property_carousel (getViewedProperties)
      portfolio/recently_viewed_cross_session → property_carousel (getRecentlyViewed)
      portfolio/recent_searches        → recent_searches from session state
      calculator/calculate_emi         → emi_result (inline computation)
      calculator/calculate_affordability → affordability_result (inline computation)
    """
    c          = state['classification']
    sub_intent = c.get('sub_intent', '')
    session    = state.get('session') or {}
    filters    = session.get('active_filters') or {}

    log.info('tier2_action', sub_intent=sub_intent)

    # ── calculator intents — inline, no executor needed ──────────────────
    if sub_intent == 'calculate_emi':
        fd = c.get('filter_delta') or {}
        loan_amount = fd.get('loan_amount') or filters.get('loan_amount')
        if not loan_amount:
            return {'template_id': 'nested_qna', 'data': {'selections': [{'questionId': 'loan_amount', 'title': 'What is the loan amount you need?', 'type': 'text_input', 'options': []}]}}
        rate         = fd.get('rate')         or filters.get('rate', 8.5)
        tenure_years = fd.get('tenure_years') or filters.get('tenure_years', 20)
        r = float(rate) / 1200
        n = int(tenure_years) * 12
        amt = float(loan_amount)
        emi = int(amt * r * (1 + r) ** n / ((1 + r) ** n - 1)) if r > 0 else int(amt / n)
        return {'template_id': 'emi_result', 'data': {'monthly_emi': emi, 'loan_amount': amt, 'rate': float(rate), 'tenure_years': int(tenure_years), 'total_amount': emi * n}}

    if sub_intent == 'calculate_affordability':
        fd = c.get('filter_delta') or {}
        monthly_income = fd.get('monthly_income') or filters.get('monthly_income')
        if not monthly_income:
            return {'template_id': 'nested_qna', 'data': {'selections': [{'questionId': 'monthly_income', 'title': 'What is your monthly income?', 'type': 'text_input', 'options': []}]}}
        mi  = float(monthly_income)
        max_emi = mi * 0.40
        r, n    = 8.5 / 1200, 240
        max_loan = int(max_emi * ((1 + r) ** n - 1) / (r * (1 + r) ** n))
        return {'template_id': 'affordability_result', 'data': {'monthly_income': mi, 'max_emi': int(max_emi), 'max_loan': max_loan, 'recommended_budget': int(max_loan * 1.20), 'min_down_payment': int(max_loan * 0.20)}}

    # ── recent_searches — served from session state ───────────────────────
    if sub_intent == 'recent_searches':
        searches = session.get('recent_searches') or []
        return {'template_id': 'recent_searches', 'data': {'searches': searches}}

    # ── portfolio fetches — require executor ─────────────────────────────
    if executor is None:
        return {'template_id': 'text_response', 'data': {'text': 'Your portfolio data will be available once the service is fully connected.'}}

    _TOOL_MAP = {
        'saved_properties':              'getSavedProperties',
        'viewed_properties':             'getViewedProperties',
        'recently_viewed_cross_session': 'getRecentlyViewed',
    }
    tool = _TOOL_MAP.get(sub_intent)
    if not tool:
        log.warning('tier2_unknown_sub_intent', sub_intent=sub_intent)
        return {'template_id': 'text_response', 'data': {'text': 'I could not fetch that right now. Please try again.'}}

    try:
        from src.tools.executor import get_tool_cache_ttl
        params = dict(filters)
        if session.get('auth_token'):
            params['auth_token'] = session['auth_token']
        data = await executor.execute(tool, params, get_tool_cache_ttl(tool))
        properties = data.get('properties') or []
        return {
            'template_id': 'property_carousel',
            'data': {
                'properties':  properties[:10],
                'totalCount':  data.get('total', len(properties)),
                'source':      sub_intent,
            },
        }
    except Exception as exc:
        log.warning('tier2_fetch_failed', sub_intent=sub_intent, error=str(exc))
        return {'template_id': 'text_response', 'data': {'text': 'I could not fetch that right now. Please try again.'}}


# ---------------------------------------------------------------------------
# Node: route_node  (CHAT-P-012)
# ---------------------------------------------------------------------------

async def route_node(state: BotState, executor=None, emit_sse=None) -> dict:
    """Route the classified intent to the appropriate tier action.

    Tier 0 — out-of-scope canned response.
    Tier 1 — orchestrator executes action directly (no LLM).
    Tier 2 — orchestrator fetches and formats data directly (no LLM).
    Tier 3a/3b — returns routing metadata; LLM nodes handle the turn.

    Auth check: intents that require_auth without a token short-circuit to a
    login prompt before tier routing.

    Input:  state['classification'], state['session']
    Output: state['routing']       (tier + model hint; omitted for auth short-circuit)
            state['bot_response']  (set for tiers 0/1/2 and auth short-circuit)
    """
    c           = state['classification']
    main_intent = c['main_intent']
    sub_intent  = c['sub_intent']
    record      = get_intent_record(main_intent, sub_intent)  # guaranteed by validate_slm_node

    if record.requires_auth and not state['session'].get('auth_token'):
        if emit_sse:
            emit_sse("pipeline_step", {"step": "routing", "tier": "auth_required",
                                       "main_intent": main_intent, "sub_intent": sub_intent})
        bot_response = build_login_template_response(main_intent, sub_intent)
        _emit_bot_response(bot_response, state, emit_sse)
        return {'bot_response': bot_response}

    routing = {'tier': record.tier, 'model': record.model}

    if emit_sse:
        emit_sse("pipeline_step", {
            "step":         "routing",
            "tier":         str(record.tier),
            "model":        record.model,
            "main_intent":  main_intent,
            "sub_intent":   sub_intent,
            "requires_auth": record.requires_auth,
        })

    if routing['tier'] == 0:
        bot_response = build_out_of_scope_response(c)
        _emit_bot_response(bot_response, state, emit_sse)
        return {'routing': routing, 'bot_response': bot_response}

    if routing['tier'] == 1:
        bot_response = await execute_tier1_action(state)
        _emit_bot_response(bot_response, state, emit_sse)
        return {'routing': routing, 'bot_response': bot_response}

    if routing['tier'] == 2:
        bot_response = await execute_tier2_action(state, executor=executor)
        _emit_bot_response(bot_response, state, emit_sse)
        return {'routing': routing, 'bot_response': bot_response}

    return {'routing': routing}


# ---------------------------------------------------------------------------
# convert_price_per_sqft_to_absolute  (helper for derive_node)
# ---------------------------------------------------------------------------

_BHK_AREA: dict[int, int] = {1: 550, 2: 900, 3: 1300, 4: 1800}
_BHK_AREA_DEFAULT_LARGE = 2500   # 5 BHK and above


def convert_price_per_sqft_to_absolute(
    price_per_sqft: int,
    bound: str | None,
    bhk: list | None,
) -> dict:
    """Convert a price-per-sqft signal to an absolute price range.

    Typical carpet area by BHK:
        1 -> 550 sqft, 2 -> 900 sqft, 3 -> 1300 sqft, 4 -> 1800 sqft, 5+ -> 2500 sqft

    If *bhk* is a non-empty list the median value's area is used.
    If *bhk* is None or empty, defaults to 900 (2 BHK proxy).

    bound == "max"  -> {'price_max': price_per_sqft * area}
    bound == "min"  -> {'price_min': price_per_sqft * area}
    bound is None   -> {'price_min': int(price_per_sqft * area * 0.8),
                        'price_max': int(price_per_sqft * area * 1.2)}

    Returns {} on error / missing data.
    """
    try:
        if not price_per_sqft:
            return {}

        # Determine carpet area from BHK list.
        if bhk:
            sorted_bhk = sorted(int(b) for b in bhk)
            median_bhk = sorted_bhk[len(sorted_bhk) // 2]
            area = _BHK_AREA.get(median_bhk, _BHK_AREA_DEFAULT_LARGE)
        else:
            area = 900  # default to 2 BHK

        absolute = price_per_sqft * area

        if bound == "max":
            return {"price_max": absolute}
        if bound == "min":
            return {"price_min": absolute}
        # No bound -- emit a +-20% symmetric range.
        return {
            "price_min": int(absolute * 0.8),
            "price_max": int(absolute * 1.2),
        }
    except Exception:  # noqa: BLE001
        return {}


# ---------------------------------------------------------------------------
# resolve_landmark_anchor  (helper for derive_node)
# ---------------------------------------------------------------------------

async def resolve_landmark_anchor(anchor_text: str, session: dict) -> dict:  # noqa: ARG001
    """Resolve a free-text landmark anchor to lat/lng + search radius.

    # TODO CHAT-P-017: replace stub with real autosuggest call
    """
    log.warn("landmark_anchor_not_resolved_stub", anchor=anchor_text)
    return {"lat": 0.0, "lng": 0.0, "outer_radius_metres": 5000}


# ---------------------------------------------------------------------------
# Node: derive_node  (CHAT-P-010a)
# ---------------------------------------------------------------------------

async def derive_node(state: BotState, emit_sse=None) -> dict:
    """Convert derived filter signals to concrete API params.

    Amount strings are already numeric by the time this node runs
    (filter_apply_node parsed them first).

    Input:  state['session']
    Output: state['session']         (updated active_filters)
            state['derived_filters'] (dict of newly derived keys)
    """
    session = dict(state["session"])
    filters = dict(session.get("active_filters", {}))
    derived: dict = {}

    # Short-circuit: emit share_location template for explore_nearby without saved location.
    if filters.get("user_location_needed"):
        return {
            "bot_response": {
                "template_id": "share_location",
                "data":        {},
            },
        }

    if filters.get("price_per_sqft"):
        price_range = convert_price_per_sqft_to_absolute(
            filters["price_per_sqft"],
            filters.get("price_sqft_bound"),
            filters.get("bhk"),
        )
        filters.update(price_range)
        del filters["price_per_sqft"]
        derived.update(price_range)

    if filters.get("search_anchor"):
        anchor = await asyncio.wait_for(
            resolve_landmark_anchor(filters["search_anchor"], session),
            timeout=2.0,
        )
        filters["lat"]          = anchor["lat"]
        filters["lng"]          = anchor["lng"]
        filters["outer_radius"] = anchor["outer_radius_metres"]
        del filters["search_anchor"]
        derived.update(anchor)

    # Apply resolved entity UUIDs to active_filters.localities
    # resolve_entities_node stores UUIDs in state['resolved_entities'], but the
    # searchProperties tool call needs UUIDs not display names for accurate results.
    resolved_entities = state.get("resolved_entities") or {}
    if resolved_entities and filters.get("localities"):
        upgraded = []
        for name_or_id in filters["localities"]:
            entity = resolved_entities.get(name_or_id) or {}
            uuid_val = entity.get("uuid") or entity.get("resolved", {}).get("uuid") if isinstance(entity.get("resolved"), dict) else None
            confidence = float(entity.get("confidence", 0.0))
            if uuid_val and confidence >= 0.70:
                upgraded.append(uuid_val)
                derived[f"locality_resolved_{name_or_id}"] = uuid_val
            else:
                upgraded.append(name_or_id)   # keep display name if unresolved
        filters["localities"] = upgraded

    session["active_filters"] = filters
    if emit_sse and derived:
        emit_sse("pipeline_step", {"step": "node_result", "node": "derive",
                                   "status": "derived", "derived_filters": derived,
                                   "active_filters": filters})
    return {"session": session, "derived_filters": derived}


# ---------------------------------------------------------------------------
# Node: clarify_node  (CHAT-P-010b)
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# _emit_bot_response — shared helper for early-exit response emission
# ---------------------------------------------------------------------------

def _emit_bot_response(bot_response: dict, state: BotState, emit_sse) -> None:
    """Emit a bot_response dict as a chat_event SSE frame.

    Called by nodes that short-circuit the pipeline (clarify_node, route_node
    for Tier 0/1/2) so the response actually reaches the client.  Without this,
    bot_response sits in state and nothing sends it over the wire.
    """
    if not emit_sse or not bot_response:
        return

    import uuid as _uuid
    from datetime import datetime
    from src.api.models import ChatEventToUser, MessageContent

    template_id = bot_response.get("template_id")
    data        = bot_response.get("data") or {}
    text        = data.get("text") if isinstance(data, dict) else None
    session     = state.get("session") or {}

    msg_type = "template" if template_id and template_id != "text_response" else "text"
    msg_text = None if msg_type == "template" else (text or "")
    tpl_id   = template_id if msg_type == "template" else None
    tpl_data = data        if msg_type == "template" else None

    event = ChatEventToUser(
        conversation_id      = session.get("session_id", ""),
        message_id           = str(_uuid.uuid4()),
        source_message_id    = state.get("request_id", ""),
        message_type         = msg_type,
        message_state        = "COMPLETED",
        source_message_state = "COMPLETED",
        created_at           = datetime.utcnow().isoformat() + "Z",
        sequence_number      = 0,
        sender               = {"type": "bot"},
        content              = MessageContent(text=msg_text, template_id=tpl_id, data=tpl_data),
    )
    emit_sse("chat_event", event.model_dump(by_alias=True))


async def clarify_node(state: BotState, emit_sse=None) -> dict:
    """Short-circuit to emit a nested_qna template when SLM signals clarification.

    Input:  state['classification']
    Output: state['bot_response']          (nested_qna payload)
            state['clarification_emitted'] (True when emitted)
    """
    c = state.get("classification") or {}
    if c.get("clarification_needed"):
        clarification_data = c.get("clarification_data", {})
        nested_qna_payload = {
            "selections": [{
                "questionId": clarification_data.get("question_id", "q1"),
                "title":      c["clarification_needed"],
                "type":       "single_select" if clarification_data.get("options") else "text_input",
                "options":    clarification_data.get("options", []),
            }]
        }
        bot_response = {"template_id": "nested_qna", "data": nested_qna_payload}
        _emit_bot_response(bot_response, state, emit_sse)

        # Persist session NOW — clarify_node short-circuits and followup_node won't run.
        # Without this, any filter updates from filter_apply_node (e.g. city=Bangalore)
        # are lost: the next turn loads a blank session from Redis.
        session = state.get("session") or {}
        try:
            from src.pipeline.nodes.response import update_session_state
            await update_session_state(session, c, [])
        except Exception as exc:
            log.warn("clarify_session_persist_failed", error=str(exc))

        return {
            "bot_response": bot_response,
            "clarification_emitted": True,
        }


# ---------------------------------------------------------------------------
# translate_to_wire_format — apply TOOL_REGISTRY wire_param renames
# ---------------------------------------------------------------------------

def translate_to_wire_format(tool: str, params: dict, session: dict) -> dict:
    """Apply wire_param renames from TOOL_REGISTRY so LLM tool-call params
    match what the HTTP executor expects on the wire.

    Example: TOOL_REGISTRY says ToolParam(key='bhk', wire_param='bedrooms')
    → {'bhk': [2]} becomes {'bedrooms': [2]}

    Params that have no wire_param are left as-is.
    """
    from src.registries.tool_registry import get_tool
    record = get_tool(tool)
    if not record:
        return dict(params)
    result = dict(params)
    for p in record.input_params:
        if p.wire_param and p.key in result:
            result[p.wire_param] = result.pop(p.key)
    return result
