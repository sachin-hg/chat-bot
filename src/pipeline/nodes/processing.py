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

async def filter_apply_node(state: BotState) -> dict:
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

    if filter_delta and not clarification_needed:
        # Parse tagged amount strings before writing to session.
        filter_delta = dict(filter_delta)
        for key in ("price_min", "price_max", "price_per_sqft"):
            if isinstance(filter_delta.get(key), str):
                filter_delta[key] = parse_amount(filter_delta[key])

        session = apply_filter_delta(session, filter_delta)

        log.info(
            "filter_apply_node_applied",
            keys=list(filter_delta.keys()),
            request_id=state.get("request_id"),
        )
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

async def sanitize_node(state: BotState) -> dict:
    """Clear filters that don't make sense after an intent pivot.

    Runs only when classification['pivot'] is True; no-ops otherwise.

    Input:  state['classification'], state['session']
    Output: state['session']   (sanitized active_filters)
            state['sanitized'] (True when sanitization ran)
    """
    c = state.get("classification") or {}
    if c.get("pivot"):
        session = sanitize_filters_on_pivot(c, dict(state["session"]))
        log.info(
            "sanitize_node_ran",
            new_intent=c.get("main_intent"),
            request_id=state.get("request_id"),
        )
        return {"session": session, "sanitized": True}
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
# Node: resolve_entities_node  (CHAT-P-011)
# ---------------------------------------------------------------------------

async def resolve_entities_node(state: BotState) -> dict:
    """Pre-resolve locality/project entities before the LLM call.

    Reads entities from state['classification']['entities_mentioned'] and
    resolves them to UUIDs when the intent warrants pre-resolution.

    Sprint 1: uses stub implementation — no real HTTP calls.

    Input:  state['classification'], state['session']
    Output: state['resolved_entities']  (resolved entity map)
            state['session']            (updated resolved_entity_map)
    """
    c = state.get("classification") or {}
    main_intent = c.get("main_intent", "")
    sub_intent  = c.get("sub_intent", "")
    entities    = c.get("entities_mentioned") or []
    session     = dict(state["session"])

    if requires_pre_resolution(main_intent, sub_intent) and entities:
        resolved = await pre_resolve_entities(entities, session)
        session.setdefault("resolved_entity_map", {}).update(resolved)
        return {"resolved_entities": resolved, "session": session}
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


async def execute_tier2_action(state: BotState) -> dict:
    """Execute a Tier 2 (orchestrator-fetched, no LLM) action.

    Sprint 1 stub — real data fetch + template build wired in CHAT-P-016.
    """
    log.info('tier2_action_stub', sub_intent=state['classification'].get('sub_intent'))
    return {'template_id': 'text_response', 'data': {'text': 'Results loading...'}}
    # TODO CHAT-P-016: replace with real data fetch + template build


# ---------------------------------------------------------------------------
# Node: route_node  (CHAT-P-012)
# ---------------------------------------------------------------------------

async def route_node(state: BotState) -> dict:
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
        return {'bot_response': build_login_template_response(main_intent, sub_intent)}

    routing = {'tier': record.tier, 'model': record.model}

    if routing['tier'] == 0:
        return {'routing': routing, 'bot_response': build_out_of_scope_response(c)}
    if routing['tier'] == 1:
        return {'routing': routing, 'bot_response': await execute_tier1_action(state)}
    if routing['tier'] == 2:
        return {'routing': routing, 'bot_response': await execute_tier2_action(state)}

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

async def derive_node(state: BotState) -> dict:
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

    session["active_filters"] = filters
    return {"session": session, "derived_filters": derived}


# ---------------------------------------------------------------------------
# Node: clarify_node  (CHAT-P-010b)
# ---------------------------------------------------------------------------

async def clarify_node(state: BotState) -> dict:
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
        return {
            "bot_response": {
                "template_id": "nested_qna",
                "data":        nested_qna_payload,
            },
            "clarification_emitted": True,
        }
    return {}
