from typing import Any, Dict, List, Optional, TypedDict
import uuid


class BotState(TypedDict):
    # ── Input ────────────────────────────────────────────────────────────
    raw_message:          str
    session:              Dict[str, Any]     # SessionState dict

    # ── Observability ────────────────────────────────────────────────────
    request_id:           str               # UUID4, set by FastAPI handler

    # ── Set by safety_node ───────────────────────────────────────────────
    safety_result:        Optional[Dict]    # ContentCheckResult

    # ── Set by normalize_node ────────────────────────────────────────────
    normalized_message:   Optional[str]

    # ── Set by route_domain_node (Stage 1) ───────────────────────────────
    domain:               Optional[str]     # DomainType

    # ── Set by classify_node (Stage 2) ───────────────────────────────────
    classification:       Optional[Dict]    # SLMOutput

    # ── Set by filter_apply_node ─────────────────────────────────────────
    filter_delta_applied: Optional[bool]

    # ── Set by sanitize_node ─────────────────────────────────────────────
    sanitized:            Optional[bool]

    # ── Set by derive_node ───────────────────────────────────────────────
    derived_filters:      Optional[Dict]

    # ── Set by clarify_node ──────────────────────────────────────────────
    clarification_emitted: Optional[bool]

    # ── Set by resolve_entities_node ─────────────────────────────────────
    resolved_entities:    Optional[Dict[str, Any]]

    # ── Set by route_node ────────────────────────────────────────────────
    routing:              Optional[Dict]    # {tier, model}

    # ── Set by fetch_data_node ───────────────────────────────────────────
    pre_fetched_data:     Optional[Dict[str, Any]]
    fetch_errors:         Optional[Dict[str, str]]

    # ── Set by build_prompt_node ─────────────────────────────────────────
    system_prompt:        Optional[str]
    tool_definitions:     Optional[List[Dict]]

    # ── Set by llm_node ──────────────────────────────────────────────────
    llm_response:         Optional[Dict]
    tool_results:         Optional[List[Dict]]

    # ── Set by validate_output_node ──────────────────────────────────────
    validated_text:       Optional[str]

    # ── Set by respond_node or any short-circuiting node ─────────────────
    bot_response:         Optional[Any]

    # ── Turn emission tracking ────────────────────────────────────────────
    summary_emitted:      Optional[bool]
    template_count:       Optional[int]

    # ── Experiment framework ──────────────────────────────────────────────
    experiment_id:        Optional[str]
    experiment_variant:   Optional[str]


def make_base_state(
    request_id: str,
    session_id: str,
    raw_message: str,
) -> BotState:
    """Returns a BotState with all fields initialised to documented defaults."""
    return BotState(
        raw_message=raw_message,
        request_id=request_id,
        session={
            "session_id":          session_id,
            "conversation_id":     "",
            "user_id":             None,
            "token_id":            "",
            "auth_token":          None,
            "city":                None,
            "city_uuid":           None,
            "transaction_type":    None,
            "active_filters":      {},
            "last_intent":         None,
            "last_domain":         None,
            "turn_count":          0,
            "active_property_id":  None,
            "active_seller_id":    None,
            "active_locality_id":  None,
            "active_project_id":   None,
            "srset_id":            None,
            "search_history":      [],
            "carousel_state":      {},
        },
        safety_result=None,
        normalized_message=None,
        domain=None,
        classification=None,
        filter_delta_applied=None,
        sanitized=None,
        derived_filters=None,
        clarification_emitted=None,
        resolved_entities=None,
        routing=None,
        pre_fetched_data=None,
        fetch_errors=None,
        system_prompt=None,
        tool_definitions=None,
        llm_response=None,
        tool_results=None,
        validated_text=None,
        bot_response=None,
        summary_emitted=None,
        template_count=None,
        experiment_id=None,
        experiment_variant=None,
    )


def current_intent(state: BotState) -> str:
    """Returns 'main_intent/sub_intent' from classification, or 'unknown/unknown'."""
    c = state.get("classification") or {}
    main = c.get("main_intent", "unknown")
    sub  = c.get("sub_intent",  "unknown")
    return f"{main}/{sub}"
