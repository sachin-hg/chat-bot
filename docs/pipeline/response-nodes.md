# Pipeline: Response Nodes

experiment_node, fetch_data_node, build_prompt_node, llm_node, validate_output_node, respond_node, followup_node. Includes graph wiring and SUMMARY_BUILDERS/FOLLOWUP_PROMPT_BLOCKS registries.

---

# ── 10. fetch_data_node ───────────────────────────────────────────────
# Pre-fetches all data the LLM needs BEFORE the LLM call.
# Uses asyncio.gather(return_exceptions=True) — one slow/failed fetch never kills the group.
# Partial failures are recorded in state['fetch_errors']; build_prompt_node
# injects { error } stubs so the LLM can acknowledge unavailable data.
# Only short-circuits if ALL required fetches fail.
#
# parallel_group semantics:
#   Group N runs only after group N-1 has fully settled (resolved OR exception).
#   Group N+1 can read group N's results from state['pre_fetched_data'].
#   Use sequential groups when a later fetch depends on an earlier result
#   (e.g., group 1 = searchProperties → group 2 = getProjectDetail using project_id
#   from the search result, resolved by build_prompt_node between groups).
#
# Input:  state['classification'], state['resolved_entities'], state['session']
# Output: state['pre_fetched_data'], state['fetch_errors']
async def fetch_data_node(state: BotState, executor: CachedExecutorPort) -> dict:
    c = state['classification']
    requirements = get_data_fetch_plan(c['main_intent'], c['sub_intent'])

    if not requirements:
        return {}

    # Sort into parallel groups (ascending group number)
    sorted_reqs = sorted(requirements, key=lambda r: r.parallel_group)
    groups: dict[int, list[DataRequirement]] = {}
    for req in sorted_reqs:
        groups.setdefault(req.parallel_group, []).append(req)

    pre_fetched_data: dict[str, Any] = {}
    fetch_errors:     dict[str, str] = {}

    for group_num in sorted(groups):
        group   = groups[group_num]
        # gather(return_exceptions=True): every fetch in the group completes (success or exception)
        # before the next group starts. No fetch blocks its sibling.
        results = await asyncio.gather(
            *[execute_prefetch(req, state, executor) for req in group],
            return_exceptions=True,
        )

        for req, result in zip(group, results):
            key = req.fetch_key or req.tool   # unique storage key per fetch
            if isinstance(result, Exception):
                reason = str(result) or 'fetch_failed'
                fetch_errors[key] = reason
                log.warn('prefetch_failed', {
                    'tool': req.tool, 'key': key,
                    'reason': reason, 'session': state['session']['session_id'],
                })
            else:
                _, data = result
                pre_fetched_data[key] = data

    # Hard stop only if there is zero usable data (all required fetches failed).
    # Uses the per-fetch key (not tool name) so same-tool dual calls are checked independently.
    all_failed = all((req.fetch_key or req.tool) in fetch_errors for req in requirements)
    if all_failed:
        return {
            'pre_fetched_data': pre_fetched_data,
            'fetch_errors':     fetch_errors,
            'bot_response':     build_fetch_error_response(c),
        }

    return {'pre_fetched_data': pre_fetched_data, 'fetch_errors': fetch_errors}

# ── 11. build_prompt_node ─────────────────────────────────────────────
# Assembles system prompt using the intent-specific prompt block from FOLLOWUP_PROMPT_BLOCKS.
# Two modes depending on whether a summary was emitted this turn:
#
#   Template intents (summary + cards already sent):
#     → uses a "followup" prompt block: "Cards have been shown. Add brief commentary."
#     → prompt is short; LLM's job is commentary + next-step suggestions (2-4 sentences)
#
#   Text-only intents (no summary, no cards):
#     → uses a "main" prompt block: full NLG response to the user's question
#     → prompt is the complete response template as before
#
# OCP: the dispatch is via FOLLOWUP_PROMPT_BLOCKS — no if/elif per intent inside this node.
# Input:  state['classification'], state['pre_fetched_data'], state['fetch_errors'],
#         state['session'], state['summary_emitted']
# Output: state['system_prompt'], state['tool_definitions']
async def build_prompt_node(state: BotState, composer: LLMPromptComposerProtocol) -> dict:
    c           = state['classification']
    main_intent = c['main_intent']
    sub_intent  = c['sub_intent']
    intent_key  = (main_intent, sub_intent)
    session     = state['session']

    # Dispatch to the intent-specific prompt block via registry
    prompt_block = FOLLOWUP_PROMPT_BLOCKS.get(intent_key, 'prompts/llm/main/generic.md')

    result = composer.build(LLMContext(
        main_intent=main_intent,
        sub_intent=sub_intent,
        prompt_block=prompt_block,            # injected into composer — selects the template
        is_followup=bool(state.get('summary_emitted')),  # tells composer: cards already shown
        session=session,
        turn_count=session.get('turn_count', 0),
        has_session_summary=bool(session.get('summary')),
        session_summary=session.get('summary'),
    ))
    # Tier B tools injected here — LLM can call calculateEMI/calculateAffordability/convertUnit
    # on-demand in any non-calculator intent. Calculator intents skip Tier B (result already inline).
    tool_definitions = build_all_llm_tools(get_residual_tools(main_intent, sub_intent), main_intent)
    return {'system_prompt': result.system, 'tool_definitions': tool_definitions}

# ── 12. llm_node ──────────────────────────────────────────────────────
# Streaming Claude call. For most intents tool_definitions is [] — LLM has one
# job: NLG over pre-fetched data already in the prompt. Only property_about
# exposes getNearbyLandmarks as a residual tool for combined queries.
# Input:  state['system_prompt'], state['tool_definitions'], state['session']['turn_history'], state['routing']['model']
# Output: state['llm_response'] (includes text_message_id), state['tool_results']
async def llm_node(state: BotState, llm: LLMPort, emit_sse) -> dict:
    routing = state['routing']
    # Resolve model_id from MODEL_REGISTRY — single source of truth.
    # routing['model'] is 'haiku' | 'sonnet' (from IntentRecord.model).
    task_key = 'llm_tier3a' if routing['model'] == 'haiku' else 'llm_tier3b'
    # MODEL_REGISTRY may be overridden by experiment_node for model_variant experiments.
    # experiment_node sets routing['model_override_task'] when an active experiment targets this turn.
    task_key = state.get('routing', {}).get('model_override_task', task_key)
    model_id = MODEL_REGISTRY[task_key].model_id

    # Stable ID for the text row. Generated here so message_delta events and the
    # final chat_event (text) emitted by followup_node share the same messageId.
    # sequenceNumber = position of the followup text in the turn (after summary + templates).
    text_message_id = str(uuid.uuid4())
    source_msg_id   = state['request_id']
    seq             = (1 if state.get('summary_emitted') else 0) + (state.get('template_count') or 0)
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
            delta_event['messageType'] = 'text'   # 'markdown' for Sonnet intents
        emit_sse('message_delta', delta_event)
        chunk_index += 1

    async def on_tool_use(tool: str, params: dict) -> Any:
        # Only reachable for residual tools (getNearbyLandmarks) or Tier B tools
        # (calculateEMI, calculateAffordability, convertUnit).
        # Tier B tools are internal computation: timeout is 500ms (no network hop).
        # getNearbyLandmarks is an Odin API call: timeout is TOOL_DEFAULT_TIMEOUTS[tool].
        # bot_tool_event is intentionally NOT emitted — FE has no handler for it.
        validation = validate_tool_call(tool, params)
        if not validation['valid']:
            return build_missing_param_error(validation)
        wired     = translate_to_wire_format(tool, params, state['session'])
        timeout_s = (TOOL_DEFAULT_TIMEOUTS.get(tool) or 2000) / 1000
        return await asyncio.wait_for(
            execute_tool_with_cache(tool, wired),
            timeout=timeout_s,
        )

    llm_response = await stream_llm(
        llm=llm,
        model=model_id,
        system=state['system_prompt'],
        messages=state['session']['turn_history'],
        tools=state['tool_definitions'],    # usually [] — no tool call capability
        on_tool_use=on_tool_use,
        on_chunk=on_chunk,
        on_tool_event=None,                 # bot_tool_event dropped — FE has no handler
    )
    response = llm_response.get('response') or {}
    return {
        'llm_response': {**response, 'text_message_id': text_message_id},
        'tool_results':  llm_response.get('tool_results', []),
    }

# ── 13. validate_output_node ──────────────────────────────────────────
# Strips prohibited content from LLM text output using OUTPUT_RULES registry.
# Rules with action='block' remove matched text and set valid=False.
# Rules with action='log' only log; user sees unchanged text.
# Always returns cleaned text — never propagates raw LLM output with violations.
# Input:  state['llm_response']['text']
# Output: state['validated_text']
async def validate_output_node(state: BotState) -> dict:
    llm_resp = state.get('llm_response') or {}
    cleaned_text, validation = validate_bot_output(llm_resp.get('text', ''))
    if validation.violations:
        log.warn('output_validation_violations', {
            'violations': validation.violations,
            'request_id': state.get('request_id'),
        })
    return {'validated_text': cleaned_text}

# ── 14. respond_node ──────────────────────────────────────────────────
# Emits ONLY template chat_events (property_carousel, locality_carousel, etc.).
# The LLM text (followup commentary) is handled separately by followup_node AFTER this node.
# This decoupling is what allows "summary → fetch → templates → LLM followup" ordering:
# the user sees cards immediately after the fetch completes; commentary streams in after.
#
# Sequence number:
#   seq_start = 0         if no summary was emitted this turn
#   seq_start = 1         if summary_node emitted (seq 0 is taken)
#
# All template events are emitted with sourceMessageState: IN_PROGRESS —
# followup_node emits the COMPLETED marker on the final text event.
# If there is no followup text (validated_text is empty), followup_node emits a
# COMPLETED close-turn event to prevent the FE from hanging on IN_PROGRESS.
#
# Input:  state['classification'], state['pre_fetched_data'], state['tool_results'], state['session']
# Output: state['template_count']; emits template chat_event SSE frames; persists to Kafka
async def respond_node(state: BotState, emit_sse: Callable) -> dict:
    c               = state['classification']
    source_msg_id   = state['request_id']
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

    # All templates are IN_PROGRESS — followup_node closes the turn with COMPLETED
    for event in template_events:
        event.source_message_state = 'IN_PROGRESS'
        emit_sse('chat_event', event.model_dump(by_alias=True))

    await persist_to_kafka(conversation_id, [e.model_dump(by_alias=True) for e in template_events])
    return {'template_count': len(template_events)}

# ── 15. followup_node ─────────────────────────────────────────────────
# Emits the LLM-generated text as the FINAL message in this turn.
# For template intents:  brief commentary on results + next-step suggestions.
# For text-only intents: the complete main response (no summary, no templates precede it).
#
# Always the last emitter in a turn → always sets sourceMessageState: COMPLETED.
# Also persists session state (once per turn, after all events have been emitted).
#
# sequenceNumber = (1 if summary_emitted else 0) + (template_count or 0)
#
# Input:  state['validated_text'], state['summary_emitted'], state['template_count'],
#         state['llm_response']['text_message_id']
# Output: state['bot_response']; emits final chat_event (text/markdown); persists session
async def followup_node(state: BotState, emit_sse: Callable) -> dict:
    c               = state['classification']
    source_msg_id   = state['request_id']
    conversation_id = state['session']['session_id']
    now             = datetime.utcnow().isoformat() + 'Z'
    validated_text  = state.get('validated_text') or ''
    seq             = (1 if state.get('summary_emitted') else 0) + (state.get('template_count') or 0)

    # Reuse the text_message_id generated by llm_node so message_delta and
    # the final chat_event share the same messageId (FE assembles streamed text by messageId)
    text_message_id = (state.get('llm_response') or {}).get('text_message_id') or str(uuid.uuid4())

    if validated_text:
        followup_event = ChatEventToUser(
            conversation_id      = conversation_id,
            message_id           = text_message_id,
            source_message_id    = source_msg_id,
            message_type         = 'markdown' if is_markdown(validated_text) else 'text',
            message_state        = 'COMPLETED',
            source_message_state = 'COMPLETED',   # always the last event in any turn
            created_at           = now,
            sequence_number      = seq,
            sender               = {'type': 'bot'},
            content              = MessageContent(text=validated_text),
        )
        emit_sse('chat_event', followup_event.model_dump(by_alias=True))
        await persist_to_kafka(conversation_id, [followup_event.model_dump(by_alias=True)])
        bot_response = followup_event.model_dump(by_alias=True)

    else:
        # LLM returned empty text (edge case: bad inference, safety strip emptied the output).
        # Still need to close the turn so the FE doesn't hang on IN_PROGRESS templates.
        # Emit a minimal COMPLETED marker with no content.
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

    # Session state update — happens once per turn, after all events are emitted.
    session = state['session']
    saved   = await update_session_state(session, c, state.get('tool_results') or [])
    if not saved:
        await reconcile_session_conflict(session, bot_response)

    return {'bot_response': bot_response}
```

### Pipeline Helper Definitions

```python
# merge_pre_fetched_and_residual — called by respond_node.
# Pre-fetched data is always authoritative. Residual tool results (get_nearby_landmarks)
# are merged in for any tool key not already present in pre_fetched_data.
# This ensures a residual call can never silently override a pre-fetched result.
def merge_pre_fetched_and_residual(
    pre_fetched: dict[str, Any] | None,
    residual_results: list[dict],
) -> dict[str, Any]:
    merged: dict[str, Any] = dict(pre_fetched or {})
    for result in residual_results:
        tool = result.get('tool', '')
        if tool and tool not in merged:
            merged[tool] = result.get('data')
    return merged

# Note: withTimeout is replaced by asyncio.wait_for(coro, timeout=seconds).
# Usage: await asyncio.wait_for(some_coroutine(), timeout=2.0)
# asyncio.wait_for raises asyncio.TimeoutError on expiry (subclass of Exception,
# caught by asyncio.gather(return_exceptions=True) in fetch_data_node).
```

### Helper Function Contracts

These functions are called by graph nodes. Their contracts are defined here once; implementations
live in their respective modules. This prevents nodes from needing to know implementation details.

```python
# ── compact_filters ───────────────────────────────────────────────────
# Strips None values and removes internal-only keys before the SLM sees session state.
# The SLM must never see khoj_param names, wire_transform values, or derived lat/lng fields.
def compact_filters(active_filters: dict) -> dict:
    INTERNAL_KEYS = {'lat', 'lng', 'outer_radius', 'price_sqft_bound'}
    return {k: v for k, v in active_filters.items() if v is not None and k not in INTERNAL_KEYS}

# ── apply_filter_delta ────────────────────────────────────────────────
# Merges SLM filter_delta into session active_filters.
# Semantics: None value = RELAX (delete key). ADD-semantics fields (amenities) merge lists.
# All other fields: REPLACE.
# Returns a NEW session dict — never mutates the input.
def apply_filter_delta(session: dict, delta: dict) -> dict:
    filters = dict(session.get('active_filters', {}))
    for key, value in delta.items():
        rec = get_filter_record(key)
        op  = rec.default_operation if rec else 'REPLACE'
        if value is None:
            filters.pop(key, None)
        elif op == 'ADD' and isinstance(value, list):
            existing = filters.get(key) or []   # treat None/missing as empty list — first ADD is still ADD
            filters[key] = existing + [v for v in value if v not in existing]
        else:
            filters[key] = value
    return {**session, 'active_filters': filters}

# ── sanitize_filters_on_pivot ─────────────────────────────────────────
# Clears filter keys that are invalid after a main_intent pivot.
# E.g., pivoting to locality_research clears bhk, price_min, price_max.
# Derives the keys-to-clear from FILTER_REGISTRY.clear_on_pivot_to — no hardcoding.
def sanitize_filters_on_pivot(classification: dict, session: dict) -> dict:
    to_intent = classification.get('main_intent', '')
    keys      = get_filters_to_clear_on_pivot(to_intent)
    filters   = {k: v for k, v in session.get('active_filters', {}).items() if k not in keys}
    return {**session, 'active_filters': filters}

# ── translate_to_wire_format ──────────────────────────────────────────
# Applies ToolParam.wire_param renames and ToolParam.wire_transform expressions
# for all params of a given tool. Returns a new dict using the API's expected param names.
# Params not in TOOL_REGISTRY input_params are passed through unchanged.
# wire_transform expressions are evaluated by a restricted eval in bot.wire.transforms —
# NOT Python eval(). They reference only named lookup tables (BHK_TO_APT_TYPE_ID, etc.).
def translate_to_wire_format(tool_name: str, params: dict, session: dict) -> dict:
    record = get_tool_record(tool_name)
    if not record:
        return params
    wired      = {}
    param_keys = {p.key for p in record.input_params}
    for p in record.input_params:
        if p.key not in params:
            continue
        key   = p.wire_param or p.key
        value = apply_wire_transform(p.wire_transform, params[p.key], session) if p.wire_transform else params[p.key]
        wired[key] = value
    # Pass through orchestrator-injected params not in the declared input_params list
    for k, v in params.items():
        if k not in param_keys:
            wired[k] = v
    return wired

# ── build_params_from_session ─────────────────────────────────────────
# Builds the API call params for a tool using current session state.
# Reads TOOL_REGISTRY.input_params to know which session keys to inject.
# Convention: param key name matches the session state key (e.g. 'property_id' → session['active_property_id']).
# Raises ValueError if a required param cannot be resolved from session.
def build_params_from_session(tool_name: str, session: dict) -> dict:
    record = get_tool_record(tool_name)
    if not record:
        return {}
    SESSION_PARAM_MAP = {
        'property_id':    session.get('active_property_id'),
        'project_id':     session.get('active_project_id'),
        'transaction_type': session.get('transaction_type'),
        'city':           session.get('city'),
        # ... full map in bot.params.session_resolver
    }
    params = {}
    for p in record.input_params:
        if p.key in SESSION_PARAM_MAP and SESSION_PARAM_MAP[p.key] is not None:
            params[p.key] = SESSION_PARAM_MAP[p.key]
        elif p.required and p.key not in params:
            raise ValueError(f'Required param "{p.key}" for tool "{tool_name}" not found in session')
    # Also inject active_filters as a flat dict for tools that accept filter params
    params.update(session.get('active_filters', {}))
    return params

# ── build_params_from_entity ──────────────────────────────────────────
# Builds params for a tool using a resolved entity (from EntityResolutionMiddleware).
# The entity carries the filter_key that tells the orchestrator which API param to use.
# E.g., locality entity → polygon_uuid param; project entity → project_id param.
def build_params_from_entity(tool_name: str, entity: dict, session: dict) -> dict:
    # entity shape: { uuid, display_name, type, filter_key, coordinates?, city_uuid }
    base = build_params_from_session(tool_name, session)
    filter_key = entity.get('filter_key')
    if filter_key:
        base[filter_key] = entity['uuid']
    if entity.get('coordinates'):
        base['lat'] = entity['coordinates'][0]
        base['lng'] = entity['coordinates'][1]
    return base

# ── execute_tier1_action ──────────────────────────────────────────────
# Tier 1: direct orchestrator action, no LLM call.
# Write-side tools (contactSeller, shortlistProperty, createSearchAlert) always emit
# a confirmation card first; the action executes only after user taps "Confirm".
# Returns a dict with 'template_id' key (e.g. 'shortlist_property', 'contact_seller')
# or a plain text dict with 'text' key. emit_final_state handles the SSE wrapping.
# Receives executor via partial injection at graph construction time.
async def execute_tier1_action(state: BotState, executor: CachedExecutorPort) -> dict:
    c = state['classification']
    TIER1_TOOL_MAP: dict[tuple[str, str], str] = {
        ('property_detail', 'save_property'):  'shortlistProperty',
        ('property_detail', 'remove_saved'):   'removeFromShortlist',
        ('property_detail', 'contact_seller'): 'contactSeller',
        ('property_search', 'save_alert'):     'createSearchAlert',
    }
    tool_name = TIER1_TOOL_MAP.get((c['main_intent'], c['sub_intent']))
    if not tool_name:
        return build_out_of_scope_response(c)
    params = build_params_from_session(tool_name, state['session'])
    wired  = translate_to_wire_format(tool_name, params, state['session'])
    result = await asyncio.wait_for(executor.execute(tool_name, wired, ttl=0), timeout=5.0)
    return build_tier1_response(c, result)

# ── execute_tier2_action ──────────────────────────────────────────────
# Tier 2: orchestrator fetches + formats directly, no LLM.
# Used for simple list responses: saved_properties, viewed_properties, recent_searches.
# Receives executor via partial injection at graph construction time.
async def execute_tier2_action(state: BotState, executor: CachedExecutorPort) -> dict:
    c            = state['classification']
    requirements = get_data_fetch_plan(c['main_intent'], c['sub_intent'])
    if not requirements:
        # Served from session state directly (e.g. recent_searches uses session.search_history)
        return build_tier2_response_from_session(c, state['session'])
    pre_fetched: dict[str, Any] = {}
    for req in requirements:
        params      = PARAM_RESOLVERS[req.params_source](req, state)
        wired       = translate_to_wire_format(req.tool, params, state['session'])
        timeout_s   = (req.timeout_ms or TOOL_DEFAULT_TIMEOUTS.get(req.tool) or 2000) / 1000
        data        = await asyncio.wait_for(executor.execute(req.tool, wired, ttl=get_tool_cache_ttl(req.tool)), timeout=timeout_s)
        pre_fetched[req.fetch_key or req.tool] = data
    return build_tier2_response(c, pre_fetched)

# ── build_login_template_response ────────────────────────────────────
# Called by route_node when requires_auth=True and auth_token is absent.
# Returns a bot_response dict that emit_final_state wraps in a chat_event.
# FE renders templateId="login" as a login prompt.
# Note: write-side Tier 1 actions (shortlist, contact_seller) do NOT use this —
# FE templates handle their own login flow internally.

_LOGIN_PROMPT: dict[tuple[str, str], str] = {
    ('portfolio', 'saved_properties'):  'Log in to see your saved properties.',
    ('portfolio', 'viewed_properties'): 'Log in to see your recently viewed properties.',
    ('portfolio', 'recent_searches'):   'Log in to see your recent searches.',
    ('portfolio', 'recommendations'):   'Log in to get personalised recommendations.',
    ('property_search', 'save_alert'):  'Log in to save this search and get alerts.',
}

def build_login_template_response(main_intent: str, sub_intent: str) -> dict:
    message = _LOGIN_PROMPT.get(
        (main_intent, sub_intent),
        'Please log in to continue.',
    )
    return {
        'text':                 message,
        'source_message_state': 'COMPLETED',
        'template': {
            'templateId': 'login',
            'data':       {},          # FE renders a standard login CTA; no data needed
        },
    }

# ── SUMMARY_BUILDERS registry ─────────────────────────────────────────
# One entry per (main_intent, sub_intent) that warrants a pre-fetch summary.
# Each value is a pure function: (classification, session, resolved_entities) → str.
# Returns '' to signal "no summary for this intent" (summary_node skips emission).
#
# OCP: adding a new intent = add one builder function + register it here.
# No changes to summary_node itself.
# Each builder is independently testable without constructing the full graph.
#
# MUST NOT mention result counts or data not yet fetched.
# MUST use resolved entity display_name (not raw user text) — the DB entity must be
# confirmed before naming it, otherwise the eagerness guard already skipped us.

def _resolved_name(resolved: dict, entity_type: str) -> str | None:
    for v in resolved.values():
        if v.get('entity_type') == entity_type:
            return v.get('display_name')
    return None

def build_property_search_summary(c: dict, session: dict, resolved: dict) -> str:
    filters = session.get('active_filters', {})
    txn     = session.get('transaction_type', 'buy')
    parts   = []
    bhk = filters.get('bhk')
    if bhk:
        bhk_str = '/'.join(str(b) for b in bhk) if isinstance(bhk, list) else str(bhk)
        parts.append(f'{bhk_str}BHK')
    parts.append('rental properties' if txn == 'rent' else 'properties for purchase')
    locality = _resolved_name(resolved, 'locality') or (filters.get('localities') or [None])[0]
    if locality:
        parts.append(f'in {locality}')
    city = _resolved_name(resolved, 'city') or session.get('city')
    if city:
        parts.append(city)
    return "I see you're looking for " + ' '.join(parts)

def build_explore_nearby_summary(c: dict, session: dict, resolved: dict) -> str:
    txn = session.get('transaction_type', 'buy')
    return f"Finding {'rental ' if txn == 'rent' else ''}properties near your location..."

def build_locality_research_summary(c: dict, session: dict, resolved: dict) -> str:
    city = session.get('city') or _resolved_name(resolved, 'city')
    if city:
        return f"Finding top localities in {city} for you..."
    return "Finding top localities for you..."

def build_comparison_summary(c: dict, session: dict, resolved: dict) -> str:
    names = [v.get('display_name') for v in resolved.values() if v.get('display_name')]
    if len(names) >= 2:
        return f"Comparing {' and '.join(names)} for you..."
    return ''   # missing an entity — don't emit a vague summary

def build_similar_properties_summary(c: dict, session: dict, resolved: dict) -> str:
    return 'Finding similar properties for you...'

def build_portfolio_saved_summary(c: dict, session: dict, resolved: dict) -> str:
    return 'Fetching your saved properties...'

def build_portfolio_viewed_summary(c: dict, session: dict, resolved: dict) -> str:
    return 'Fetching your recently viewed properties...'

def build_portfolio_recommendations_summary(c: dict, session: dict, resolved: dict) -> str:
    return 'Fetching personalised recommendations for you...'

# Registry: (main_intent, sub_intent) → builder
# Intents absent from this dict do not emit a summary (text-only intents, Tier 0/1/2, etc.)
SUMMARY_BUILDERS: dict[tuple[str, str], Callable[[dict, dict, dict], str]] = {
    ('property_search', 'filter_search'):            build_property_search_summary,
    ('property_search', 'explore_nearby'):           build_explore_nearby_summary,
    ('property_search', 'discovery_collections'):    build_property_search_summary,
    ('locality_research', 'trending_localities'):    build_locality_research_summary,
    ('locality_research', 'locality_comparison'):    build_comparison_summary,
    ('comparison', 'compare_localities'):            build_comparison_summary,
    ('comparison', 'compare_projects'):            build_comparison_summary,
    ('property_detail', 'similar_properties'):       build_similar_properties_summary,
    ('portfolio', 'recommendations'):                build_portfolio_recommendations_summary,
    # portfolio/saved_properties and portfolio/viewed_properties are Tier 2 (orchestrator-only)
    # and never reach summary_node — omitted intentionally.
}

# ── FOLLOWUP_PROMPT_BLOCKS registry ───────────────────────────────────
# Maps each intent to the prompt block file used to generate the LLM response.
# Template intents → brief followup commentary block (sees tool results in context).
# Text-only intents → full NLG response block (no summary or templates precede it).
#
# OCP: adding a new intent = add one prompt file + register it here.
# No changes to build_prompt_node itself.

FOLLOWUP_PROMPT_BLOCKS: dict[tuple[str, str], str] = {
    # Template intents (Tier 3a) — brief followup commentary; cards are already shown in Phase 2
    ('property_search', 'filter_search'):            'prompts/llm/followup/property_search.md',
    ('property_search', 'explore_nearby'):           'prompts/llm/followup/property_search.md',
    ('property_search', 'discovery_collections'):    'prompts/llm/followup/property_search.md',
    ('locality_research', 'trending_localities'):    'prompts/llm/followup/locality_research.md',
    ('locality_research', 'locality_comparison'):    'prompts/llm/followup/comparison.md',
    ('comparison', 'compare_localities'):            'prompts/llm/followup/comparison.md',
    ('property_detail', 'similar_properties'):       'prompts/llm/followup/property_search.md',
    ('portfolio', 'recommendations'):                'prompts/llm/followup/portfolio.md',
    # Text-only intents (Tier 3a/3b) — full NLG response; no templates precede
    ('property_detail', 'property_about'):           'prompts/llm/main/property_detail.md',
    ('property_detail', 'floor_plan'):               'prompts/llm/main/property_detail.md',
    ('locality_research', 'locality_overview'):      'prompts/llm/main/locality_about.md',
    ('locality_research', 'commute_time'):           'prompts/llm/main/commute_time.md',
    ('comparison', 'compare_projects'):              'prompts/llm/main/comparison.md',
    ('project_research', 'project_price_trends'):    'prompts/llm/main/price_trends.md',
    # property_detail text-only
    ('property_detail', 'brochure'):              'prompts/llm/main/property_detail.md',
    ('property_detail', 'nearby_landmarks'):       'prompts/llm/main/property_detail.md',
    # locality_research text-only
    ('locality_research', 'price_trends'):         'prompts/llm/main/price_trends.md',
    ('locality_research', 'transaction_data'):     'prompts/llm/main/locality_about.md',
    ('locality_research', 'ratings_reviews'):      'prompts/llm/main/locality_about.md',
    ('locality_research', 'market_insight'):       'prompts/llm/main/locality_about.md',
    ('locality_research', 'price_fairness'):       'prompts/llm/main/locality_about.md',
    ('locality_research', 'filter_suggestions'):   'prompts/llm/main/locality_about.md',
    ('locality_research', 'top_societies'):        'prompts/llm/main/locality_about.md',
    ('locality_research', 'city_orientation'):     'prompts/llm/main/locality_about.md',
    # project_research text-only
    ('project_research', 'project_overview'):      'prompts/llm/main/price_trends.md',
    ('project_research', 'ratings_reviews'):       'prompts/llm/main/locality_about.md',
    ('project_research', 'trending_projects'):     'prompts/llm/main/generic.md',
    # multi_intent synthesis
    ('multi_intent', 'decompose'):                 'prompts/llm/main/generic.md',
    # portfolio/saved_properties and portfolio/viewed_properties are Tier 2 (no LLM call)
    # financial/* keys removed — financial is not a registered main_intent; calculator/* are Tier 1/2
    # Intents NOT listed here fall through to 'prompts/llm/main/generic.md'.
    # Tier 0/1/2 intents are not in this dict — they never reach build_prompt_node.
    # calculator/* are Tier 1/2 and also absent intentionally.
}
# Fallback for intents not explicitly listed: 'prompts/llm/main/generic.md'
# build_prompt_node uses: FOLLOWUP_PROMPT_BLOCKS.get(intent_key, 'prompts/llm/main/generic.md')

# ── Adapter injection via functools.partial ───────────────────────────
# LangGraph nodes are plain functions. Adapters (executor, llm, composer) are injected
# at graph construction time using functools.partial so nodes remain testable in isolation.
#
# from functools import partial
#
# graph.add_node('fetch_data',  partial(fetch_data_node,  executor=cached_executor))
# graph.add_node('build_prompt', partial(build_prompt_node, composer=llm_composer))
# graph.add_node('llm',         partial(llm_node,          llm=llm_adapter, emit_sse=emit_fn))
# graph.add_node('route',       partial(route_node,        executor=cached_executor))
#
# Testing: pass a MockToolExecutor / MockLLM / MockClassifier in place of real adapters.
```

### LangGraph Wiring

```python
from langgraph.graph import StateGraph, END

def should_continue(state: BotState) -> str:
    """Conditional edge: if bot_response is set, stop (go to END); else continue."""
    return END if state.get('bot_response') else 'continue'

# Build the graph
graph = StateGraph(BotState)

graph.add_node('safety',           safety_node)
graph.add_node('normalize',        normalize_node)
graph.add_node('route_domain',     partial(route_domain_node, router=domain_router))  # Stage 1
graph.add_node('classify',         partial(classify_node,     classifier=slm_classifier))  # Stage 2
graph.add_node('validate_slm',     validate_slm_node)
graph.add_node('filter_apply',     filter_apply_node)
graph.add_node('sanitize',         sanitize_node)
graph.add_node('derive',           derive_node)
graph.add_node('clarify',          partial(clarify_node,      emit_sse=emit_fn))
graph.add_node('resolve_entities', resolve_entities_node)
graph.add_node('route',            route_node)
graph.add_node('summary',          partial(summary_node,      emit_sse=emit_fn))       # emits pre-fetch summary (Part 9b)
graph.add_node('experiment',       experiment_node)    # A/B variant (Part 12)
graph.add_node('fetch_data',       fetch_data_node)
graph.add_node('respond',          partial(respond_node,      emit_sse=emit_fn))       # emits templates only
graph.add_node('build_prompt',     partial(build_prompt_node, composer=llm_composer))  # builds LLM prompt
graph.add_node('llm',              partial(llm_node,          llm=llm_adapter, emit_sse=emit_fn))
graph.add_node('validate_output',  validate_output_node)
graph.add_node('followup',         partial(followup_node,     emit_sse=emit_fn, registry=registry_adapter))

graph.set_entry_point('safety')

# Each node: if bot_response is set (short-circuit), go to END; else continue linearly.
# Critical ordering: respond (templates) comes BEFORE llm (followup text).
# This means the user sees property cards while the LLM is still generating commentary.
for src, dst in [
    ('safety',           'normalize'),
    ('normalize',        'route_domain'),
    ('route_domain',     'classify'),
    ('classify',         'validate_slm'),
    ('validate_slm',     'filter_apply'),
    ('filter_apply',     'sanitize'),
    ('sanitize',         'derive'),
    ('derive',           'clarify'),
    ('clarify',          'resolve_entities'),
    ('resolve_entities', 'route'),
    ('route',            'summary'),         # summary before fetch — eagerness guard inside
    ('summary',          'experiment'),
    ('experiment',       'fetch_data'),
    ('fetch_data',       'respond'),         # templates immediately after fetch
    ('respond',          'build_prompt'),    # LLM prompt built after templates emitted
    ('build_prompt',     'llm'),
    ('llm',              'validate_output'),
    ('validate_output',  'followup'),
]:
    graph.add_conditional_edges(src, should_continue, {'continue': dst, END: END})

graph.add_edge('followup', END)

bot_pipeline = graph.compile()
```

### Graph Node Invariants

**Graph runner invariant (3-phase multi-emit model):**

Three nodes emit SSE directly; all others only set `bot_response` (handled by `emit_final_state`):

| Emitter | SSE events | When |
|---|---|---|
| HTTP handler | `connection_ack` | Before graph starts |
| `summary_node` | `message_delta` (chunk) + `chat_event` (text, seq 0) | After entity resolution, BEFORE fetch |
| `llm_node` | `message_delta` × N chunks | After templates emitted, during LLM stream |
| `respond_node` | `chat_event` × N (templates, seq 1..N) | Immediately after fetch |
| `followup_node` | `chat_event` (text, seq N+1) | After LLM stream completes |
| HTTP handler `emit_final_state` | `chat_event` (short-circuit paths only) | After graph exits early |
| HTTP handler | `connection_close` | After graph exits |

**Not all phases are present for every turn:**

| Turn type | Phases |
|---|---|
| Clarification / out-of-scope / blocked | Single event via `emit_final_state` |
| Text-only Tier 3 (no templates) | `followup_node` only (seq 0, COMPLETED) |
| Template Tier 3 | summary (seq 0) → templates (seq 1..N) → followup (seq N+1, COMPLETED) |

**Ordering is guaranteed by the graph:** `summary_node` completes before `fetch_data_node` starts; `respond_node` (templates) completes before `llm_node` starts streaming. The FE receives events in causal order over the same SSE connection.

| Node | Short-circuits? | Emits SSE? | Mutates session? | External I/O? |
|---|---|---|---|---|
| safety_node | Yes (blocked) | No | No | No |
| normalize_node | Yes (gibberish) | No | No | No |
| route_domain_node | No | No | No | Yes (Haiku SLM — ~200 tokens, Stage 1) |
| classify_node | No (out_of_scope fast path: zero SLM cost) | No | No | Yes (Haiku SLM — domain-scoped ~800 tokens, Stage 2) |
| validate_slm_node | Yes (invalid/unknown) | No | No | No |
| filter_apply_node | No | No | Yes (filters) | No |
| sanitize_node | No | No | Yes (filters) | No |
| derive_node | Yes (user_location_needed) | No | Yes (filters) | Yes (autosuggest, 2s timeout) |
| clarify_node | Yes (clarify) | No | No | No |
| resolve_entities_node | No | No | Yes (entity map) | Yes (autosuggest, parallel) |
| route_node | Yes (tier 0/1/2/auth) | No | No | Yes (tier 1/2 actions) |
| summary_node | No | Yes (msg_delta + chat_event) | No | No (Kafka async) |
| experiment_node | No | No | No | No |
| fetch_data_node | Yes (all required failed) | No | No | Yes (Khoj, Casa, Odin, etc.) |
| respond_node | No | Yes (chat_event × N templates) | No | No (Kafka async) |
| build_prompt_node | No | No | No | No |
| llm_node | No | Yes (msg_delta × chunks) | No | Yes (Claude; Tier B + residual) |
| validate_output_node | No | No | No | No |
| followup_node | No | Yes (chat_event) | Yes (session state) | Yes (Kafka, Redis) |

---

