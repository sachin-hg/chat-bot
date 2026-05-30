"""run_dry_pipeline() — the primary test API for Layer 3 dry run tests."""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional, Any
from src.pipeline.graph import build_graph
from src.pipeline.state import make_base_state


@dataclass
class SSEEvent:
    event_type:           str
    sequence_number:      Optional[int] = None
    message_type:         Optional[str] = None
    source_message_state: Optional[str] = None
    template_id:          Optional[str] = None
    message_id:           Optional[str] = None
    content:              Optional[dict] = None
    data:                 Optional[dict] = None

    @classmethod
    def from_dict(cls, event_type: str, data: dict) -> 'SSEEvent':
        content = data.get('content') or {}
        return cls(
            event_type           = event_type,
            sequence_number      = data.get('sequenceNumber'),
            message_type         = data.get('messageType'),
            source_message_state = data.get('sourceMessageState'),
            template_id          = content.get('templateId') if isinstance(content, dict) else None,
            message_id           = data.get('messageId'),
            content              = content,
            data                 = data,
        )


@dataclass
class DryRunResult:
    domain:        str
    main_intent:   str
    sub_intent:    str
    filter_delta:  dict
    entities:      list
    clarification: Optional[str]
    pivot:         bool
    session:       dict
    sse_events:    list
    tool_calls:    list
    final_state:   dict


async def run_dry_pipeline(
    message: str,
    scenario: str = "default",
    session: dict | None = None,
    router=None,
    classifier=None,
    llm=None,
) -> DryRunResult:
    """Run the full pipeline with DryRunExecutor (no real HTTP calls).

    Args:
        message:    User message text
        scenario:   Fixture scenario name (tests/fixtures/scenarios/{name}.json)
        session:    Pre-built session state dict (for Turn 2+ multi-turn tests).
                    Keys accepted: session_id, turn_count, active_filters,
                    turn_history, and any other BotState session fields.
        router:     DomainRouterPort mock (if None, uses a stub that returns out_of_scope)
        classifier: ClassifierPort mock (if None, uses a stub that returns out_of_scope)
        llm:        LLMPort mock (if None, uses a stub that returns empty text)
    """
    from src.tools.dry_run_executor import DryRunExecutor
    executor = DryRunExecutor(scenario)

    sse_events: list[SSEEvent] = []

    def emit_sse(event_type: str, data: dict) -> None:
        sse_events.append(SSEEvent.from_dict(event_type, data))

    # Stub adapters (replaced by real mocks in actual tests)
    if router is None:
        from unittest.mock import AsyncMock, MagicMock
        router = MagicMock()
        router.route = AsyncMock(return_value=MagicMock(domain='out_of_scope', confidence=0.99))
    if classifier is None:
        from unittest.mock import AsyncMock, MagicMock
        classifier = MagicMock()
        classifier.classify = AsyncMock(return_value=MagicMock(
            domain='out_of_scope', main_intent='out_of_scope', sub_intent='out_of_scope_query',
            filter_delta={}, entities_mentioned=[], clarification_needed=None, pivot=False,
            confidence=0.99, reasoning='dry run stub',
        ))
    if llm is None:
        from unittest.mock import AsyncMock, MagicMock
        llm = MagicMock()

        async def _stub_stream(**kwargs):
            on_chunk = kwargs.get('on_chunk')
            if on_chunk:
                on_chunk('Dry run response.')
            return {'response': {'text': 'Dry run response.'}, 'tool_results': []}

        llm.stream = _stub_stream

    graph = build_graph(
        emit_sse=emit_sse,
        executor=executor,
        router=router,
        classifier=classifier,
        llm=llm,
    )

    # Build initial state using make_base_state, then merge any caller-supplied session overrides
    session_overrides = session or {}
    session_id = session_overrides.get('session_id', 'dry-run-session')

    initial_state = make_base_state(
        request_id='dry-run-request',
        session_id=session_id,
        raw_message=message,
    )

    # Merge any extra session fields the caller provided (turn_count, active_filters, etc.)
    if session_overrides:
        merged_session = dict(initial_state['session'])
        merged_session.update(session_overrides)
        initial_state = dict(initial_state)
        initial_state['session'] = merged_session

    final_state = await graph.ainvoke(initial_state)

    c = final_state.get('classification') or {}
    return DryRunResult(
        domain        = c.get('domain', ''),
        main_intent   = c.get('main_intent', ''),
        sub_intent    = c.get('sub_intent', ''),
        filter_delta  = c.get('filter_delta') or {},
        entities      = c.get('entities_mentioned') or [],
        clarification = c.get('clarification_needed'),
        pivot         = bool(c.get('pivot')),
        session       = final_state.get('session') or {},
        sse_events    = sse_events,
        tool_calls    = executor.calls_made,
        final_state   = dict(final_state),
    )
