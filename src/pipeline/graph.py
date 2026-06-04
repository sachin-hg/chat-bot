"""Pipeline graph factory.

build_graph() wires all 19 pipeline nodes into a LangGraph StateGraph.
Adapters (executor, router, classifier, llm, composer, session_store) are
injected via functools.partial so each node remains independently testable.
"""
from __future__ import annotations

from functools import partial
from typing import Callable

from langgraph.graph import StateGraph, END

from src.pipeline.state import BotState
from src.pipeline.nodes import (
    # Classification
    safety_node,
    normalize_node,
    route_domain_node,
    classify_node,
    validate_slm_node,
    # Processing
    filter_apply_node,
    sanitize_node,
    derive_node,
    clarify_node,
    resolve_entities_node,
    route_node,
    # Response
    summary_node,
    experiment_node,
    fetch_data_node,
    respond_node,
    build_prompt_node,
    llm_node,
    validate_output_node,
    followup_node,
)


def _should_continue(state: BotState) -> str:
    """Conditional edge: if bot_response is set, exit to END; otherwise continue."""
    return END if state.get('bot_response') else 'continue'


def _no_op_safe(fn):
    """Wrap an async node so that returning {} is treated as None (no state update).

    LangGraph 0.2.55+ rejects empty dicts from nodes.  Pipeline nodes that have
    nothing to do conventionally return {} — this wrapper converts that to None
    so LangGraph skips the write without raising InvalidUpdateError.
    """
    from functools import wraps

    @wraps(fn)
    async def _wrapper(*args, **kwargs):
        result = await fn(*args, **kwargs)
        if result == {}:
            return None
        return result

    return _wrapper


def build_graph(
    emit_sse: Callable,
    executor=None,
    router=None,
    classifier=None,
    llm=None,
    composer=None,
) -> object:
    """Build and compile the LangGraph pipeline.

    Parameters
    ----------
    emit_sse:   Callable that sends SSE frames to the client.
    executor:   CachedExecutorPort for tool execution (Sprint 2; pass None for Sprint 1 stub).
    router:     DomainRouterPort (Stage 1 SLM).
    classifier: ClassifierPort (Stage 2 SLM).
    llm:        LLMPort for streaming Claude calls.
    composer:   LLMPromptComposerProtocol (defaults to StubPromptComposer if None).
    """
    from src.pipeline.nodes.response import StubPromptComposer
    if composer is None:
        composer = StubPromptComposer()

    graph = StateGraph(BotState)

    # ── Node registration ─────────────────────────────────────────────────
    graph.add_node('safety',           safety_node)
    graph.add_node('normalize',        normalize_node)
    graph.add_node('route_domain',     partial(route_domain_node,  router=router))
    graph.add_node('classify',         partial(classify_node,       classifier=classifier))
    graph.add_node('validate_slm',     validate_slm_node)
    graph.add_node('filter_apply',     _no_op_safe(filter_apply_node))
    graph.add_node('sanitize',         _no_op_safe(sanitize_node))
    graph.add_node('derive',           derive_node)
    graph.add_node('clarify',          _no_op_safe(clarify_node))
    graph.add_node('resolve_entities', _no_op_safe(partial(resolve_entities_node, executor=executor)))
    graph.add_node('route',            route_node)
    graph.add_node('summary',          _no_op_safe(partial(summary_node,        emit_sse=emit_sse)))
    graph.add_node('experiment',       experiment_node)
    graph.add_node('fetch_data',       _no_op_safe(partial(fetch_data_node,     executor=executor)))
    graph.add_node('respond',          partial(respond_node,        emit_sse=emit_sse))
    graph.add_node('build_prompt',     partial(build_prompt_node,   composer=composer))
    graph.add_node('llm',              partial(llm_node,            llm=llm, emit_sse=emit_sse, executor=executor))
    graph.add_node('validate_output',  validate_output_node)
    graph.add_node('followup',         partial(followup_node,       emit_sse=emit_sse))

    graph.set_entry_point('safety')

    # ── Edges — linear with short-circuit on bot_response ─────────────────
    _EDGES = [
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
        ('route',            'summary'),
        ('summary',          'experiment'),
        ('experiment',       'fetch_data'),
        ('fetch_data',       'respond'),
        ('respond',          'build_prompt'),
        ('build_prompt',     'llm'),
        ('llm',              'validate_output'),
        ('validate_output',  'followup'),
    ]

    for src, dst in _EDGES:
        graph.add_conditional_edges(src, _should_continue, {'continue': dst, END: END})

    graph.add_edge('followup', END)

    return graph.compile()
