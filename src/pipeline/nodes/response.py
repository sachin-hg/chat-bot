"""Response pipeline nodes.

Implements:
    summary_node         — Phase 1: emits deterministic summary before data fetch
    fetch_data_node      — Pre-fetches tool data in parallel before LLM call
    build_prompt_node    — Assembles LLM system prompt and tool definitions
    llm_node             — Streams LLM response; handles tool calls and SSE deltas
    validate_output_node — Strips prohibited content from LLM text output
    respond_node         — Emits template/carousel ChatEventToUser events
    followup_node        — Emits final text ChatEventToUser event and persists session
    experiment_node      — A/B experiment resolution stub
"""
from __future__ import annotations

import asyncio
import re
import uuid
from datetime import datetime
from typing import Any, Callable, Protocol

from src.observability.logging import get_logger
from src.pipeline.state import BotState

log = get_logger(__name__)

# ---------------------------------------------------------------------------
# Confidence threshold for the eagerness guard in summary_node
# ---------------------------------------------------------------------------

ENTITY_CONFIDENCE_THRESHOLD = 0.70

# ---------------------------------------------------------------------------
# Summary builder helpers
# ---------------------------------------------------------------------------


def _build_property_search_summary(c: dict, session: dict, resolved: dict) -> str:
    filters = session.get('active_filters', {})
    parts = []
    if filters.get('bhk'):
        bhk_str = '/'.join(str(b) + 'BHK' for b in filters['bhk'])
        parts.append(bhk_str)
    if filters.get('localities'):
        parts.append('in ' + ', '.join(filters['localities']))
    elif filters.get('city'):
        parts.append('in ' + filters['city'])
    if parts:
        return "I'm searching for " + ' '.join(parts) + " properties..."
    return "Searching for properties..."


def _build_explore_nearby_summary(c: dict, session: dict, resolved: dict) -> str:
    return "Finding properties near your location..."


def _build_locality_summary(c: dict, session: dict, resolved: dict) -> str:
    filters = session.get('active_filters', {})
    loc = filters.get('localities', [])
    if loc:
        return f"Looking up {loc[0]}..."
    return "Researching locality..."


# ---------------------------------------------------------------------------
# SUMMARY_BUILDERS — maps (main_intent, sub_intent) → builder function
# ---------------------------------------------------------------------------

SUMMARY_BUILDERS: dict[tuple, Any] = {
    ('property_search', 'filter_search'):    _build_property_search_summary,
    ('property_search', 'explore_nearby'):   _build_explore_nearby_summary,
    ('locality', 'locality_overview'):       _build_locality_summary,
}

# ---------------------------------------------------------------------------
# Node: summary_node  (CHAT-P-013 Phase 1)
# ---------------------------------------------------------------------------


async def summary_node(state: BotState, emit_sse: Callable) -> dict:
    """Emit a deterministic Phase 1 summary SSE before data is fetched.

    Only runs for tier 3a/3b intents that have a registered SUMMARY_BUILDERS
    entry and where all mentioned entities meet ENTITY_CONFIDENCE_THRESHOLD.

    Input:  state['routing'], state['classification'],
            state['resolved_entities'], state['session'], state['request_id']
    Output: state['summary_emitted'] (True when summary was emitted)
    """
    routing = state.get('routing') or {}
    if routing.get('tier') not in ('3a', '3b'):
        return {}

    c = state.get('classification') or {}
    intent_key = (c.get('main_intent', ''), c.get('sub_intent', ''))

    builder = SUMMARY_BUILDERS.get(intent_key)
    if not builder:
        return {}

    # Eagerness guard — skip summary when any entity confidence is too low
    entities_mentioned = c.get('entities_mentioned', [])
    resolved = state.get('resolved_entities') or {}
    for entity in entities_mentioned:
        name = entity.get('name', '')
        conf = (resolved.get(name) or {}).get('confidence', 1.0)
        if conf < ENTITY_CONFIDENCE_THRESHOLD:
            return {}

    summary_text = builder(c, state['session'], resolved)
    if not summary_text:
        return {}

    # Emit Phase 1 SSE events
    source_msg_id   = state['request_id']
    conversation_id = state['session']['session_id']
    now             = datetime.utcnow().isoformat() + 'Z'
    summary_msg_id  = str(uuid.uuid4())

    emit_sse('message_delta', {
        'messageId':       summary_msg_id,
        'sourceMessageId': source_msg_id,
        'sequenceNumber':  0,
        'chunkIndex':      0,
        'messageType':     'text',
        'content':         {'text': summary_text},
    })

    from src.api.models import ChatEventToUser, MessageContent
    summary_event = ChatEventToUser(
        conversation_id      = conversation_id,
        message_id           = summary_msg_id,
        source_message_id    = source_msg_id,
        message_type         = 'text',
        message_state        = 'COMPLETED',
        source_message_state = 'IN_PROGRESS',
        created_at           = now,
        sequence_number      = 0,
        sender               = {'type': 'bot'},
        content              = MessageContent(text=summary_text),
    )
    emit_sse('chat_event', summary_event.model_dump(by_alias=True))

    return {'summary_emitted': True}


# ---------------------------------------------------------------------------
# _execute_prefetch_stub
# ---------------------------------------------------------------------------


async def _build_tool_params(req, state: BotState) -> dict:
    """Build tool call params from BotState based on DataRequirement.params_source."""
    source = getattr(req, 'params_source', 'session')
    if source == 'session':
        return dict(state['session'].get('active_filters') or {})
    elif source == 'entity_resolution':
        entities = list((state.get('resolved_entities') or {}).values())
        idx = req.entity_index or 0
        return entities[idx] if idx < len(entities) else {}
    elif source == 'filter_delta':
        return dict((state.get('classification') or {}).get('filter_delta') or {})
    return {}


async def _execute_prefetch_stub(req, state: BotState, executor, emit_sse=None) -> tuple:
    import time as _time
    key = req.fetch_key or req.tool
    if executor is not None:
        from src.tools.executor import get_tool_cache_ttl
        ttl = get_tool_cache_ttl(req.tool)
        params = await _build_tool_params(req, state)
        t0 = _time.monotonic()
        data = await executor.execute(req.tool, params, ttl)
        latency_ms = int((_time.monotonic() - t0) * 1000)
        if emit_sse:
            # Build a compact result summary for the debug panel
            summary = _tool_result_summary(req.tool, data)
            emit_sse("pipeline_step", {
                "step":       "tool_call",
                "tool":       req.tool,
                "params":     {k: v for k, v in params.items() if k not in ("auth_token",)},
                "result_summary": summary,
                "latency_ms": latency_ms,
                "fetch_key":  key if key != req.tool else None,
            })
        return key, data
    log.info('prefetch_stub_no_executor', tool=req.tool, key=key)
    return key, {}


def _tool_result_summary(tool: str, data: dict) -> str:
    """Compact one-line summary of a tool result for the debug panel."""
    if not data:
        return "empty"
    if tool in ("searchProperties", "getSimilarProperties"):
        hits = len(data.get("hits") or data.get("properties") or [])
        total = data.get("total_count") or data.get("total") or hits
        return f"{total} results ({hits} returned)"
    if tool == "resolveEntity":
        name = data.get("display_name") or ""
        conf = data.get("confidence", 0)
        return f"{name} (conf={conf:.2f})" if name else f"confidence={conf:.2f}"
    if tool in ("getLocalityDetail",):
        return data.get("display_name") or data.get("name") or "ok"
    if tool == "getTrendingLocalities":
        n = len(data.get("localities") or [])
        return f"{n} localities"
    if tool in ("getPriceTrends", "getProjectPriceTrends"):
        return f"yoy={data.get('yoy_change_pct', '')}%"
    if tool == "calculateEMI":
        emi = data.get("monthly_emi", "")
        return f"₹{emi:,}/month" if isinstance(emi, int) else str(emi)
    if tool == "calculateAffordability":
        budget = data.get("affordable_property_price") or data.get("recommended_budget", "")
        return f"budget ₹{budget//100000:.0f}L" if isinstance(budget, (int, float)) else str(budget)
    return f"{len(data)} keys"


# ---------------------------------------------------------------------------
# Node: fetch_data_node  (CHAT-P-013 Phase 2)
# ---------------------------------------------------------------------------


async def fetch_data_node(state: BotState, executor, emit_sse=None) -> dict:
    """Pre-fetch all tool data in parallel groups before the LLM call.

    Reads the data_requirements for the current intent from the intent registry,
    groups them by parallel_group, and executes each group with asyncio.gather.
    When ALL fetches fail, injects a bot_response fallback.

    Input:  state['classification']
    Output: state['pre_fetched_data']  (keyed by fetch_key or tool name)
            state['fetch_errors']      (keyed by fetch_key or tool name)
            state['bot_response']      (only when all fetches failed)
    """
    c = state['classification']
    from src.registries.intent_registry import get_data_fetch_plan
    requirements = get_data_fetch_plan(c['main_intent'], c['sub_intent'])

    if not requirements:
        return {}

    sorted_reqs = sorted(requirements, key=lambda r: r.parallel_group)
    groups: dict[int, list] = {}
    for req in sorted_reqs:
        groups.setdefault(req.parallel_group, []).append(req)

    pre_fetched_data: dict = {}
    fetch_errors: dict = {}

    for group_num in sorted(groups):
        group = groups[group_num]
        results = await asyncio.gather(
            *[_execute_prefetch_stub(req, state, executor, emit_sse=emit_sse) for req in group],
            return_exceptions=True,
        )
        for req, result in zip(group, results):
            key = req.fetch_key or req.tool
            if isinstance(result, Exception):
                fetch_errors[key] = str(result) or 'fetch_failed'
            else:
                _, data = result
                pre_fetched_data[key] = data

    all_failed = all((req.fetch_key or req.tool) in fetch_errors for req in requirements)
    if all_failed and requirements:
        return {
            'pre_fetched_data': pre_fetched_data,
            'fetch_errors':     fetch_errors,
            'bot_response':     {'template_id': 'text_response', 'data': {'text': 'Sorry, I was unable to fetch the data. Please try again.'}},
        }

    return {'pre_fetched_data': pre_fetched_data, 'fetch_errors': fetch_errors}


# ---------------------------------------------------------------------------
# LLMContext — dataclass passed to prompt composers
# ---------------------------------------------------------------------------

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class LLMContext:
    main_intent: str
    sub_intent: str
    prompt_block: str                   # path to the .md file to load
    is_followup: bool = False           # True if summary + templates already emitted this turn
    session: dict = field(default_factory=dict)
    turn_count: int = 0
    has_session_summary: bool = False
    session_summary: Optional[str] = None


# ---------------------------------------------------------------------------
# LLMPromptComposerProtocol + PromptResult
# ---------------------------------------------------------------------------


class LLMPromptComposerProtocol(Protocol):
    def build(self, ctx: LLMContext) -> 'PromptResult':
        ...


@dataclass
class PromptResult:
    system: str      # assembled system prompt string
    user: str = ''   # optional user message prefix


# ---------------------------------------------------------------------------
# StubPromptComposer — Sprint 1 stub
# ---------------------------------------------------------------------------


class StubPromptComposer:
    """Sprint 1 stub — loads the prompt file and returns it as-is.
    Sprint 2 wires in the real composer that assembles multi-block prompts."""

    def build(self, ctx: LLMContext) -> PromptResult:
        from pathlib import Path
        _REPO_ROOT = Path(__file__).parent.parent.parent.parent
        prompt_path = _REPO_ROOT / ctx.prompt_block
        if prompt_path.exists():
            system_text = prompt_path.read_text(encoding='utf-8')
        else:
            log.warn('prompt_file_not_found', path=str(ctx.prompt_block))
            system_text = f'You are a helpful Housing.com real estate assistant. Intent: {ctx.main_intent}/{ctx.sub_intent}.'
        return PromptResult(system=system_text)


# ---------------------------------------------------------------------------
# FOLLOWUP_PROMPT_BLOCKS registry
# ---------------------------------------------------------------------------

FOLLOWUP_PROMPT_BLOCKS: dict[tuple[str, str], str] = {
    ('property_search', 'filter_search'):            'prompts/llm/followup/property_search.md',
    ('property_search', 'explore_nearby'):           'prompts/llm/followup/property_search.md',
    ('property_search', 'discovery_collections'):    'prompts/llm/followup/property_search.md',
    ('locality_research', 'trending_localities'):    'prompts/llm/followup/locality_research.md',
    ('locality_research', 'locality_comparison'):    'prompts/llm/followup/comparison.md',
    ('comparison', 'compare_localities'):            'prompts/llm/followup/comparison.md',
    ('comparison', 'compare_projects'):              'prompts/llm/followup/comparison.md',
    ('property_detail', 'similar_properties'):       'prompts/llm/followup/property_search.md',
    ('portfolio', 'recommendations'):                'prompts/llm/followup/portfolio.md',
    ('property_detail', 'property_about'):           'prompts/llm/main/property_detail.md',
    ('property_detail', 'floor_plan'):               'prompts/llm/main/property_detail.md',
    ('locality_research', 'locality_overview'):      'prompts/llm/main/locality_about.md',
    ('locality_research', 'commute_time'):           'prompts/llm/main/commute_time.md',
    ('project_research', 'project_price_trends'):    'prompts/llm/main/price_trends.md',
    ('property_detail', 'brochure'):                 'prompts/llm/main/property_detail.md',
    ('property_detail', 'nearby_landmarks'):         'prompts/llm/main/property_detail.md',
    ('locality_research', 'price_trends'):           'prompts/llm/main/price_trends.md',
    ('locality_research', 'transaction_data'):       'prompts/llm/main/locality_about.md',
    ('locality_research', 'ratings_reviews'):        'prompts/llm/main/locality_about.md',
    ('locality_research', 'market_insight'):         'prompts/llm/main/locality_about.md',
    ('locality_research', 'price_fairness'):         'prompts/llm/main/locality_about.md',
    ('locality_research', 'filter_suggestions'):     'prompts/llm/main/locality_about.md',
    ('locality_research', 'top_societies'):          'prompts/llm/main/locality_about.md',
    ('locality_research', 'city_orientation'):       'prompts/llm/main/locality_about.md',
    ('project_research', 'project_overview'):        'prompts/llm/main/price_trends.md',
    ('project_research', 'ratings_reviews'):         'prompts/llm/main/locality_about.md',
    ('project_research', 'trending_projects'):       'prompts/llm/main/generic.md',
    ('multi_intent', 'decompose'):                   'prompts/llm/main/generic.md',
}


# ---------------------------------------------------------------------------
# Helper stubs — Sprint 1 (real implementations are Sprint 2)
# ---------------------------------------------------------------------------


def get_residual_tools(main_intent: str, sub_intent: str) -> list:
    """Returns tool names the LLM can call on-demand for this intent.

    Combines:
      1. Intent-specific residual_tools from INTENT_REGISTRY.
      2. Tier B tools (tier_b=True, llm_visible=True) — pure-computation tools
         always available to every Tier 3 call except calculator intents.
    """
    from src.registries.intent_registry import get_intent_record
    from src.registries.tool_registry import TOOL_REGISTRY
    record = get_intent_record(main_intent, sub_intent)
    names: list[str] = list(record.residual_tools) if record else []
    calculator_sub_intents = {'calculate_emi', 'calculate_affordability', 'convert_unit'}
    if sub_intent not in calculator_sub_intents:
        tier_b = [t.name for t in TOOL_REGISTRY if t.tier_b and t.llm_visible]
        for name in tier_b:
            if name not in names:
                names.append(name)
    return names


def build_all_llm_tools(tool_names: list, main_intent: str) -> list:
    """Build Anthropic tool_definitions list from TOOL_REGISTRY for the given tool names.

    Only includes tools with llm_visible=True. Wire-only params (wire_param set)
    are excluded from the schema — the LLM never sees internal API param names.
    """
    from src.registries.tool_registry import get_tool
    tools = []
    for name in tool_names:
        rec = get_tool(name)
        if not rec or not rec.llm_visible:
            continue
        llm_params = [p for p in rec.input_params if not p.wire_param]
        properties = {}
        for p in llm_params:
            schema: dict = {'type': p.type, 'description': p.description}
            if p.enum:
                schema['enum'] = p.enum
            if p.items:
                schema['items'] = p.items
            properties[p.key] = schema
        tools.append({
            'name': rec.name,
            'description': rec.description,
            'input_schema': {
                'type': 'object',
                'properties': properties,
                'required': [p.key for p in llm_params if p.required],
            },
        })
    return tools


# ---------------------------------------------------------------------------
# Node: build_prompt_node  (CHAT-P-014)
# ---------------------------------------------------------------------------


async def build_prompt_node(state: BotState, composer: LLMPromptComposerProtocol) -> dict:
    """Assemble the LLM system prompt and tool definitions for the current intent.

    Looks up the correct prompt block from FOLLOWUP_PROMPT_BLOCKS (falling back
    to generic.md), delegates assembly to the given composer, and builds the
    Anthropic tool_definitions list via build_all_llm_tools.

    Input:  state['classification'], state['session'], state['summary_emitted']
    Output: state['system_prompt'], state['tool_definitions']
    """
    c           = state['classification']
    main_intent = c['main_intent']
    sub_intent  = c['sub_intent']
    intent_key  = (main_intent, sub_intent)
    session     = state['session']

    prompt_block = FOLLOWUP_PROMPT_BLOCKS.get(intent_key, 'prompts/llm/main/generic.md')

    result = composer.build(LLMContext(
        main_intent=main_intent,
        sub_intent=sub_intent,
        prompt_block=prompt_block,
        is_followup=bool(state.get('summary_emitted')),
        session=session,
        turn_count=session.get('turn_count', 0),
        has_session_summary=bool(session.get('summary')),
        session_summary=session.get('summary'),
    ))

    tool_definitions = build_all_llm_tools(
        get_residual_tools(main_intent, sub_intent), main_intent
    )

    # Inject pre-fetched data and session context into system_prompt so the LLM
    # has the data it needs to write a grounded response.
    system = result.system
    system = _append_data_context(system, state, c, session)

    # Build the messages list: turn_history + current user message.
    # The LLM needs the actual user query in the messages to respond to it.
    turn_history = list(session.get('turn_history') or [])
    raw_message  = state.get('raw_message', '')
    if raw_message and (not turn_history or turn_history[0].get('role') != 'user' or turn_history[0].get('content') != raw_message):
        # Prepend the current user message (it hasn't been added to turn_history yet
        # — followup_node does that after the LLM responds)
        messages = [{'role': 'user', 'content': raw_message}] + turn_history
    else:
        messages = turn_history or [{'role': 'user', 'content': raw_message or 'Hello'}]

    return {'system_prompt': system, 'tool_definitions': tool_definitions, 'llm_messages': messages}


def _append_data_context(system: str, state: 'BotState', c: dict, session: dict) -> str:
    """Append pre_fetched_data and session context to the system prompt.

    This gives the LLM the actual data it should base its response on.
    In production, the real LLMPromptComposer handles this; for now StubPromptComposer
    delegates to this function.
    """
    import json as _json
    parts = [system]

    # Session context block
    filters = session.get('active_filters') or {}
    ctx_lines = []
    if filters.get('city'):
        ctx_lines.append(f"City: {filters['city']}")
    if filters.get('transaction_type'):
        ctx_lines.append(f"Transaction: {filters['transaction_type']}")
    if filters.get('bhk'):
        ctx_lines.append(f"BHK: {filters['bhk']}")
    if filters.get('localities'):
        ctx_lines.append(f"Localities: {', '.join(str(x) for x in filters['localities'])}")
    if filters.get('price_max'):
        psf = filters['price_max']
        ctx_lines.append(f"Budget max: ₹{psf // 100000:.0f}L" if psf < 10_000_000 else f"₹{psf / 10_000_000:.2f}Cr")
    if ctx_lines:
        parts.append("\n\n## SESSION CONTEXT\n" + "\n".join(ctx_lines))

    # Pre-fetched data block (truncated for token budget)
    pre_fetched = state.get('pre_fetched_data') or {}
    if pre_fetched:
        data_lines = ["\n\n## DATA RETRIEVED FOR THIS TURN"]
        for key, data in pre_fetched.items():
            if not data:
                continue
            if key in ('searchProperties', 'filter_search'):
                hits = (data.get('hits') or [])[:5]
                total = data.get('total_count', len(hits))
                data_lines.append(f"\n**{total} properties found** (showing {len(hits)}):")
                for p in hits:
                    loc = (p.get('locality') or {}).get('name', '')
                    data_lines.append(
                        f"- {p.get('title', 'Property')} | {p.get('price_display', '')} | "
                        f"{p.get('carpet_area', '')} sqft | {loc}"
                    )
            elif key in ('getLocalityDetail', 'locality_overview'):
                name = data.get('display_name') or data.get('name', '')
                psf  = data.get('avg_price_sqft') or data.get('avg_price_per_sqft', '')
                yoy  = (data.get('price_trend') or {}).get('yoy_change_percent') or data.get('yoy_change_percent', '')
                rating = (data.get('ratings') or {}).get('overall', '')
                data_lines.append(f"\n**{name}**: ₹{psf:,}/sqft, {yoy}% YoY growth, {rating}/5 rating")
                if data.get('overview'):
                    data_lines.append(data['overview'][:400])
            elif key == 'getTrendingLocalities':
                locs = (data.get('localities') or [])[:5]
                data_lines.append(f"\n**Trending localities ({len(locs)}):**")
                for loc in locs:
                    data_lines.append(f"- {loc.get('name', '')} | ₹{loc.get('avg_price_per_sqft', '')} psf | {loc.get('yoy_growth_percent', '')}% growth")
            elif key in ('getPriceTrends', 'getProjectPriceTrends'):
                pts = (data.get('data_points') or [])[-3:]  # last 3 months
                yoy = data.get('yoy_change_pct', '')
                data_lines.append(f"\n**Price trend**: {yoy}% YoY | Last 3 months: {[p.get('avg_price_sqft', '') for p in pts]}")
            elif key == 'getProjectDetail':
                data_lines.append(f"\n**Project**: {data.get('name', '')} by {data.get('builder', '')} | {data.get('price_range', '')} | Possession: {data.get('possession_date', '')}")
            else:
                # Generic: dump compact JSON
                try:
                    compact = _json.dumps(data, ensure_ascii=False)[:500]
                    data_lines.append(f"\n**{key}**: {compact}")
                except Exception:
                    pass
        if len(data_lines) > 1:
            parts.append("\n".join(data_lines))

    return "\n".join(parts)


# ---------------------------------------------------------------------------
# LLMPort Protocol
# ---------------------------------------------------------------------------


class LLMPort(Protocol):
    async def stream(
        self,
        model: str,
        system: str,
        messages: list,
        tools: list,
        on_chunk: Callable[[str], None],
        on_tool_use: Callable,
    ) -> dict:
        """Stream LLM response. Returns {'response': {'text': str, ...}, 'tool_results': [...]}"""
        ...


# ---------------------------------------------------------------------------
# validate_bot_output — strips prohibited content from LLM text output
# ---------------------------------------------------------------------------


@dataclass
class ValidationResult:
    violations: list = field(default_factory=list)
    valid: bool = True


def validate_bot_output(text: str) -> tuple:
    """Strip prohibited content from LLM text output.
    Returns (cleaned_text, ValidationResult)."""
    result = ValidationResult()
    cleaned = text

    # Rule 1 (block): Remove URLs
    url_pattern = re.compile(r'https?://\S+')
    if url_pattern.search(cleaned):
        result.violations.append('url_in_output')
        result.valid = False
        cleaned = url_pattern.sub('', cleaned).strip()

    # Rule 2 (block): Remove phone numbers (10-digit Indian mobile numbers)
    phone_pattern = re.compile(r'\b[6-9]\d{9}\b')
    if phone_pattern.search(cleaned):
        result.violations.append('phone_number_in_output')
        result.valid = False
        cleaned = phone_pattern.sub('[contact removed]', cleaned)

    # Rule 3 (log only): Markdown tables are only allowed for comparison intents.
    # The caller (validate_output_node) handles intent-specific logic.
    # Here we just detect and report — do not strip.
    if '|---|' in cleaned or '| --- |' in cleaned:
        result.violations.append('markdown_table_detected')
        # NOT stripped here — allowed for comparison intents

    return cleaned, result


# ---------------------------------------------------------------------------
# Helper stubs for llm_node
# ---------------------------------------------------------------------------


def validate_tool_call(tool: str, params: dict) -> dict:
    """Validate LLM tool call params against TOOL_REGISTRY input_params.

    Checks:
      1. Tool exists in registry.
      2. All required, non-wire params are present.
    """
    from src.registries.tool_registry import get_tool
    record = get_tool(tool)
    if not record:
        return {"valid": False, "detail": f"Unknown tool: {tool}"}
    missing = [
        p.key for p in record.input_params
        if p.required and not p.wire_param and p.key not in params
    ]
    if missing:
        return {"valid": False, "detail": f"Missing required params: {missing}"}
    return {"valid": True}


def build_missing_param_error(validation: dict) -> dict:
    return {'error': 'missing_required_param', 'detail': validation.get('detail', '')}


async def execute_tool_with_cache(tool: str, params: dict) -> Any:
    """Sprint 1 stub — returns {} for all tool calls.
    # TODO CHAT-P-016: replace with real HttpToolExecutor calls."""
    log.info('tool_call_stub', tool=tool)
    return {}


async def stream_llm(llm: LLMPort, model: str, system: str, messages: list,
                     tools: list, on_tool_use: Callable, on_chunk: Callable,
                     on_tool_event=None) -> dict:
    """Sprint 1 stub — calls llm.stream() and returns the result.
    Real streaming is wired via the adapter in llm_node."""
    try:
        result = await llm.stream(
            model=model,
            system=system,
            messages=messages,
            tools=tools,
            on_chunk=on_chunk,
            on_tool_use=on_tool_use,
        )
        return result
    except Exception as exc:
        log.error('llm_stream_error', error=str(exc), model=model)
        return {'response': {'text': ''}, 'tool_results': []}


# ---------------------------------------------------------------------------
# Node: llm_node  (CHAT-P-015a)
# ---------------------------------------------------------------------------


async def llm_node(state: BotState, llm: LLMPort, emit_sse: Callable, executor=None) -> dict:
    """Stream an LLM response, handling tool calls and emitting SSE message_delta events.

    Input:  state['routing'], state['session'], state['system_prompt'],
            state['tool_definitions'], state['request_id'], state['summary_emitted'],
            state['template_count']
    Output: state['llm_response'], state['tool_results']
    """
    from src.registries.model_registry import MODEL_REGISTRY
    routing = state.get('routing') or {}
    model_key = routing.get('model', 'haiku')
    task_key  = 'llm_tier3a' if model_key == 'haiku' else 'llm_tier3b'
    # Allow experiment_node to override model
    task_key = routing.get('model_override_task', task_key)

    try:
        model_id = MODEL_REGISTRY[task_key].model_id
    except (KeyError, AttributeError):
        log.warn('model_registry_key_missing', task_key=task_key)
        model_id = 'claude-haiku-4-5-20251001'

    text_message_id = str(uuid.uuid4())
    source_msg_id   = state.get('request_id', '')
    seq             = (1 if state.get('summary_emitted') else 0) + (state.get('template_count') or 0)

    if emit_sse:
        emit_sse("pipeline_step", {
            "step":   "llm_start",
            "model":  model_id,
            "intent": f"{state.get('classification', {}).get('main_intent','')}/{state.get('classification', {}).get('sub_intent','')}",
            "tools_available": len(state.get('tool_definitions') or []),
        })
    chunk_index     = 0

    def on_chunk(chunk: str):
        nonlocal chunk_index
        delta_event = {
            'messageId':       text_message_id,
            'sourceMessageId': source_msg_id,
            'sequenceNumber':  seq,
            'chunkIndex':      chunk_index,
            'content':         {'text': chunk},
        }
        if chunk_index == 0:
            delta_event['messageType'] = 'text'
        emit_sse('message_delta', delta_event)
        chunk_index += 1

    async def on_tool_use(tool: str, params: dict) -> Any:
        validation = validate_tool_call(tool, params)
        if not validation['valid']:
            return build_missing_param_error(validation)
        from src.pipeline.nodes.processing import translate_to_wire_format
        wired = translate_to_wire_format(tool, params, state['session'])
        if executor is not None:
            from src.tools.executor import get_tool_cache_ttl
            ttl = get_tool_cache_ttl(tool)
            try:
                return await asyncio.wait_for(executor.execute(tool, wired, ttl), timeout=2.0)
            except asyncio.TimeoutError:
                log.warning('llm_tool_call_timeout', tool=tool)
                return {}
        log.info('llm_tool_call_no_executor', tool=tool)
        return {}

    # Use llm_messages if build_prompt_node constructed them; fall back to turn_history
    messages = (
        state.get('llm_messages') or
        state['session'].get('turn_history') or
        [{'role': 'user', 'content': state.get('raw_message', 'Hello')}]
    )

    llm_response = await stream_llm(
        llm=llm,
        model=model_id,
        system=state.get('system_prompt', ''),
        messages=messages,
        tools=state.get('tool_definitions') or [],
        on_tool_use=on_tool_use,
        on_chunk=on_chunk,
    )
    response = llm_response.get('response') or {}
    return {
        'llm_response': {**response, 'text_message_id': text_message_id},
        'tool_results':  llm_response.get('tool_results', []),
    }


# ---------------------------------------------------------------------------
# Node: validate_output_node  (CHAT-P-015a)
# ---------------------------------------------------------------------------


async def validate_output_node(state: BotState) -> dict:
    """Validate and clean LLM text output, stripping prohibited content.

    Removes URLs and phone numbers unconditionally.
    Strips markdown tables for non-comparison intents; allows them for comparison intents.

    Input:  state['llm_response'], state['classification'], state['request_id']
    Output: state['validated_text']
    """
    llm_resp = state.get('llm_response') or {}
    raw_text = llm_resp.get('text', '')

    # Warn when LLM was cut off mid-response (max_tokens reached)
    if llm_resp.get('stop_reason') == 'max_tokens':
        log.warning('llm_response_truncated', request_id=state.get('request_id'),
                    text_len=len(raw_text))

    cleaned_text, validation = validate_bot_output(raw_text)

    # Markdown tables: allowed for comparison intents, blocked for all others
    c = state.get('classification') or {}
    main_intent = c.get('main_intent', '')
    COMPARISON_INTENTS = {'comparison', 'locality_research/locality_comparison'}
    if 'markdown_table_detected' in validation.violations:
        if main_intent not in COMPARISON_INTENTS:
            # Strip the markdown table for non-comparison intents
            cleaned_text = re.sub(r'\|[^\n]+\|\n(\|[-: ]+\|\n)?(\|[^\n]+\|\n)*', '', cleaned_text).strip()
            validation.violations.append('markdown_table_stripped')
        else:
            validation.violations.remove('markdown_table_detected')  # allowed

    if validation.violations:
        log.warn('output_validation_violations',
                 violations=validation.violations,
                 request_id=state.get('request_id'))
    return {'validated_text': cleaned_text}


# ---------------------------------------------------------------------------
# Helper stubs for respond_node and followup_node  (CHAT-P-015b)
# ---------------------------------------------------------------------------


def is_markdown(text: str) -> bool:
    """Returns True if text contains markdown formatting (tables, bold, headers)."""
    import re
    return bool(re.search(r'(\*\*|#{1,3} |\|---|```)', text))


async def persist_to_kafka(conversation_id: str, events: list[dict]) -> None:
    """Async fire-and-forget: publishes message events to Kafka."""
    from src.kafka.producer import publish
    for event in events:
        await publish('chat.messages', {'conversation_id': conversation_id, 'event': event})


async def update_session_state(session: dict, classification: dict, tool_results: list) -> bool:
    """Persist session to Redis after turn completes using optimistic locking."""
    from src.session.store import RedisSessionStore
    from src.session.redis import get_redis
    try:
        redis = get_redis()
        store = RedisSessionStore(redis)
        session_id = session.get('session_id', '')
        version = session.get('version', 0)
        return await store.save(session_id, session, version)
    except Exception as exc:
        log.warn('session_update_failed', error=str(exc))
        # Non-fatal: return True so pipeline doesn't enter conflict path
        return True


async def reconcile_session_conflict(session: dict, bot_response: dict | None) -> None:
    """Called when optimistic locking fails (save returns False).
    Sprint 3: log and continue. Full retry in Sprint 4."""
    log.warn('session_conflict_unresolved', session_id=session.get('session_id'))


def _make_chat_event(
    template_id: str, data: dict,
    conversation_id: str, source_msg_id: str,
    seq: int, now: str,
) -> 'ChatEventToUser':
    from src.api.models import ChatEventToUser, MessageContent
    return ChatEventToUser(
        conversation_id      = conversation_id,
        message_id           = str(uuid.uuid4()),
        source_message_id    = source_msg_id,
        message_type         = 'template',
        message_state        = 'COMPLETED',
        source_message_state = 'IN_PROGRESS',
        created_at           = now,
        sequence_number      = seq,
        sender               = {'type': 'bot'},
        content              = MessageContent(
            template_id=template_id,
            data=data,
        ),
    )


def _build_property_carousel(
    classification: dict, pre_fetched_data: dict, tool_results: list,
    session: dict, source_msg_id: str, conversation_id: str, seq: int, now: str,
) -> list:
    """Build property_carousel template event from searchProperties result."""
    search_data = (
        pre_fetched_data.get('searchProperties') or
        pre_fetched_data.get('filter_search') or
        {}
    )
    hits = search_data.get('hits') or []
    if not hits:
        return []
    return [_make_chat_event(
        template_id     = 'property_carousel',
        data            = {
            'properties':   hits[:10],
            'totalCount':   search_data.get('total_count', len(hits)),
            'srsetId':      search_data.get('srset_id'),
            'filters':      session.get('active_filters', {}),
        },
        conversation_id = conversation_id,
        source_msg_id   = source_msg_id,
        seq             = seq,
        now             = now,
    )]


def _build_locality_carousel(
    classification: dict, pre_fetched_data: dict, tool_results: list,
    session: dict, source_msg_id: str, conversation_id: str, seq: int, now: str,
) -> list:
    """Build locality_carousel template event from getTrendingLocalities result."""
    locality_data = (
        pre_fetched_data.get('getTrendingLocalities') or
        pre_fetched_data.get('trending_localities') or
        {}
    )
    localities = locality_data.get('localities') or []
    if not localities:
        return []
    return [_make_chat_event(
        template_id     = 'locality_carousel',
        data            = {
            'localities':   localities[:8],
            'city':         session.get('city', ''),
        },
        conversation_id = conversation_id,
        source_msg_id   = source_msg_id,
        seq             = seq,
        now             = now,
    )]


# Registry: (main_intent, sub_intent) → builder function
TEMPLATE_BUILDERS: dict[tuple, Callable] = {
    ('property_search', 'filter_search'):          _build_property_carousel,
    ('property_search', 'explore_nearby'):          _build_property_carousel,
    ('property_search', 'discovery_collections'):  _build_property_carousel,
    ('property_detail', 'similar_properties'):     _build_property_carousel,
    ('locality_research', 'trending_localities'):  _build_locality_carousel,
    ('comparison', 'compare_localities'):          _build_locality_carousel,
    ('portfolio', 'saved_properties'):             _build_property_carousel,
    ('portfolio', 'viewed_properties'):            _build_property_carousel,
    ('portfolio', 'recommendations'):              _build_property_carousel,
}


def build_template_events(
    classification: dict,
    pre_fetched_data: dict,
    tool_results: list,
    session: dict,
    source_msg_id: str,
    conversation_id: str,
    seq_start: int,
    now: str,
) -> list:
    """Builds ChatEventToUser objects for template responses (carousels etc.).

    Dispatches to the appropriate builder based on (main_intent, sub_intent).
    Returns [] when no builder is registered for the intent or data is absent.
    """
    c = classification
    intent_key = (c.get('main_intent', ''), c.get('sub_intent', ''))
    builder = TEMPLATE_BUILDERS.get(intent_key)
    if not builder:
        return []
    return builder(
        classification   = c,
        pre_fetched_data = pre_fetched_data,
        tool_results     = tool_results,
        session          = session,
        source_msg_id    = source_msg_id,
        conversation_id  = conversation_id,
        seq              = seq_start,
        now              = now,
    )


# ---------------------------------------------------------------------------
# Node: respond_node  (CHAT-P-015b)
# ---------------------------------------------------------------------------


async def respond_node(state: BotState, emit_sse: Callable) -> dict:
    """Emit template/carousel ChatEventToUser SSE events for the current turn.

    Delegates to build_template_events to construct events per intent.
    Sprint 1 stub — build_template_events returns [] so no events are emitted.

    Input:  state['classification'], state['pre_fetched_data'], state['tool_results'],
            state['session'], state['request_id'], state['summary_emitted']
    Output: state['template_count']
    """
    from src.api.models import ChatEventToUser, MessageContent
    c               = state['classification']
    source_msg_id   = state.get('request_id', '')
    conversation_id = state['session']['session_id']
    now             = datetime.utcnow().isoformat() + 'Z'
    seq_start       = 1 if state.get('summary_emitted') else 0

    template_events = build_template_events(
        classification   = c,
        pre_fetched_data = state.get('pre_fetched_data') or {},
        tool_results     = state.get('tool_results') or [],
        session          = state['session'],
        source_msg_id    = source_msg_id,
        conversation_id  = conversation_id,
        seq_start        = seq_start,
        now              = now,
    )

    if not template_events:
        return {'template_count': 0}

    for event in template_events:
        event.source_message_state = 'IN_PROGRESS'
        emit_sse('chat_event', event.model_dump(by_alias=True))

    await persist_to_kafka(conversation_id, [e.model_dump(by_alias=True) for e in template_events])
    return {'template_count': len(template_events)}


# ---------------------------------------------------------------------------
# Node: followup_node  (CHAT-P-015b)
# ---------------------------------------------------------------------------


async def _trigger_conversation_summary(session_id: str) -> None:
    """Publish summary request to Kafka. Consumer calls Haiku off critical path."""
    await persist_to_kafka(session_id, [{'type': 'summarize_request', 'session_id': session_id}])
    log.info('conversation_summary_triggered', session_id=session_id)


async def followup_node(state: BotState, emit_sse: Callable) -> dict:
    """Emit the final text ChatEventToUser SSE event and persist session state.

    Uses validated_text from validate_output_node. If text is empty, still emits
    a COMPLETED close event to signal turn end. Always attempts session persistence.

    Input:  state['classification'], state['validated_text'], state['llm_response'],
            state['session'], state['request_id'], state['summary_emitted'],
            state['template_count'], state['tool_results']
    Output: state['bot_response']
    """
    from src.api.models import ChatEventToUser, MessageContent
    c               = state.get('classification') or {}
    source_msg_id   = state.get('request_id', '')
    conversation_id = state['session']['session_id']
    now             = datetime.utcnow().isoformat() + 'Z'
    validated_text  = state.get('validated_text') or ''
    seq             = (1 if state.get('summary_emitted') else 0) + (state.get('template_count') or 0)
    text_message_id = (state.get('llm_response') or {}).get('text_message_id') or str(uuid.uuid4())

    if validated_text:
        followup_event = ChatEventToUser(
            conversation_id      = conversation_id,
            message_id           = text_message_id,
            source_message_id    = source_msg_id,
            message_type         = 'markdown' if is_markdown(validated_text) else 'text',
            message_state        = 'COMPLETED',
            source_message_state = 'COMPLETED',
            created_at           = now,
            sequence_number      = seq,
            sender               = {'type': 'bot'},
            content              = MessageContent(text=validated_text),
        )
        emit_sse('chat_event', followup_event.model_dump(by_alias=True))
        await persist_to_kafka(conversation_id, [followup_event.model_dump(by_alias=True)])
        bot_response = followup_event.model_dump(by_alias=True)
    else:
        # Empty text — still need to close the turn
        close_event = ChatEventToUser(
            conversation_id      = conversation_id,
            message_id           = str(uuid.uuid4()),
            source_message_id    = source_msg_id,
            message_type         = 'text',
            message_state        = 'COMPLETED',
            source_message_state = 'COMPLETED',
            created_at           = now,
            sequence_number      = seq,
            sender               = {'type': 'bot'},
            content              = MessageContent(text=''),
        )
        emit_sse('chat_event', close_event.model_dump(by_alias=True))
        bot_response = None

    # Persist user message to Kafka (fire-and-forget, same topic as bot messages)
    raw_message = state.get('raw_message', '')
    if raw_message and not raw_message.startswith('user_action:'):
        user_event = {
            'conversationId': conversation_id,
            'messageId':      source_msg_id,
            'messageType':    'text',
            'messageState':   'COMPLETED',
            'sourceMessageState': 'COMPLETED',
            'sender':         {'type': 'user'},
            'content':        {'text': raw_message},
            'createdAt':      now,
        }
        await persist_to_kafka(conversation_id, [user_event])

    # ── Persist session context so the next turn has full history ──────────
    session = dict(state['session'])   # work on a mutable copy

    # last_intent / last_domain — feeds Stage 1 and Stage 2 SLM routing context
    session['last_intent'] = {
        'main_intent': c.get('main_intent', ''),
        'sub_intent':  c.get('sub_intent', ''),
    }
    session['last_domain'] = state.get('domain', '')

    # turn_count — persisted (was computed locally and never written back)
    session['turn_count'] = session.get('turn_count', 0) + 1

    # Anthropic-format turn_history — passed verbatim as `messages` to llm_node
    # newest message first; capped at 20 messages (~10 turns)
    new_llm_messages: list = [{'role': 'user', 'content': state.get('raw_message', '')}]
    if validated_text:
        new_llm_messages.append({'role': 'assistant', 'content': validated_text})
    prior_history: list = list(session.get('turn_history') or [])
    session['turn_history'] = (new_llm_messages + prior_history)[:20]

    # last_3_turns — condensed for Stage 2 classifier context (user message + intent tag)
    prior_turns: list = list(session.get('last_3_turns') or [])
    session['last_3_turns'] = ([{
        'user':        state.get('raw_message', ''),
        'main_intent': c.get('main_intent', ''),
        'sub_intent':  c.get('sub_intent', ''),
    }] + prior_turns)[:3]

    saved = await update_session_state(session, c, state.get('tool_results') or [])
    if not saved:
        await reconcile_session_conflict(session, bot_response)

    # Trigger async conversation summarization every 20 turns (fire-and-forget)
    if session['turn_count'] >= 20 and session['turn_count'] % 20 == 0:
        asyncio.create_task(
            _trigger_conversation_summary(session['session_id'])
        )

    return {'bot_response': bot_response}


# ---------------------------------------------------------------------------
# Node: experiment_node  (CHAT-P-036)
# ---------------------------------------------------------------------------


async def experiment_node(state: BotState) -> dict:
    """Resolve active A/B experiment for this session. Hot-reloads config/experiments.yaml every 60s."""
    from src.pipeline.experiment_loader import resolve_experiment_for_session

    experiment = resolve_experiment_for_session(
        state['session'], state.get('classification') or {}
    )

    if experiment is None:
        return {'experiment_id': None}

    result = {
        'experiment_id': experiment['experiment_id'],
        'experiment_variant': experiment['variant']['id'],
    }

    # If variant has a model override, inject into routing
    model_override = experiment['variant'].get('model_override_task')
    if model_override:
        routing = dict(state.get('routing') or {})
        routing['model_override_task'] = model_override
        result['routing'] = routing

    log.info('experiment_resolved',
             session_id=state['session'].get('session_id'),
             experiment_id=experiment['experiment_id'],
             variant=experiment['variant']['id'])

    return result
