"""CLI dry-run. Usage: python -m src.tools.dry_run --message "..." [--scenario X] [--mock-slm] [--mock-llm]"""
import argparse, asyncio, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

async def main(message: str, scenario: str, mock_slm: bool, mock_llm: bool) -> None:
    import os
    # Patch session + Kafka persistence so dry-run CLI works without .env
    os.environ.setdefault('BOT_ENV', 'mock')
    import unittest.mock as _mock
    _mock.patch('src.pipeline.nodes.response.update_session_state',
                new=_mock.AsyncMock(return_value=True)).start()
    _mock.patch('src.pipeline.nodes.response.persist_to_kafka',
                new=_mock.AsyncMock()).start()

    from src.tools.dry_run_executor import DryRunExecutor
    from src.pipeline.graph import build_graph
    from src.pipeline.state import make_base_state

    print(f"\n{'='*60}\n  DRY RUN\n  Message:  {message!r}\n  Scenario: {scenario}")
    print(f"  SLM: {'mock' if mock_slm else 'real'}  LLM: {'mock' if mock_llm else 'real'}\n{'='*60}\n")

    executor = DryRunExecutor(scenario)
    sse_events = []

    def emit_sse(event_type, data):
        sse_events.append({'type': event_type, 'data': data})
        if event_type == 'message_delta':
            chunk = (data.get('content') or {}).get('text', '')
            if chunk:
                print(chunk, end='', flush=True)
        elif event_type == 'chat_event':
            content = data.get('content') or {}
            template_id = content.get('templateId')
            seq = data.get('sequenceNumber', '?')
            state = data.get('sourceMessageState', '')
            if template_id:
                props = (content.get('data') or {}).get('properties') or []
                print(f"\n  [TEMPLATE] {template_id} (seq:{seq}) — {len(props)} items")
            elif state == 'COMPLETED':
                print(f"\n  [COMPLETED seq:{seq}]")

    if mock_slm:
        from unittest.mock import AsyncMock, MagicMock
        router = MagicMock()
        router.route = AsyncMock(return_value={'domain': 'property_search', 'confidence': 0.95})
        classifier = MagicMock()
        classifier.classify = AsyncMock(return_value={
            'domain': 'property_search', 'main_intent': 'property_search',
            'sub_intent': 'filter_search', 'filter_delta': {},
            'entities_mentioned': [], 'clarification_needed': None,
            'pivot': False, 'multi_intent': False, 'confidence': 0.95, 'reasoning': 'mock',
        })
    else:
        from src.adapters.domain_router import AnthropicDomainRouter
        from src.adapters.classifier import AnthropicClassifier
        router = AnthropicDomainRouter()
        classifier = AnthropicClassifier()

    if mock_llm:
        from unittest.mock import MagicMock
        llm = MagicMock()
        async def _stub(**kwargs):
            on_chunk = kwargs.get('on_chunk')
            if on_chunk:
                on_chunk('[mock LLM response]')
            return {'response': {'text': '[mock LLM response]'}, 'tool_results': []}
        llm.stream = _stub
    else:
        from src.adapters.llm import AnthropicLLM
        llm = AnthropicLLM()

    graph = build_graph(emit_sse=emit_sse, executor=executor, router=router, classifier=classifier, llm=llm)
    state = make_base_state(raw_message=message, session_id='dry-run-cli', request_id='cli-req-001')
    final_state = await graph.ainvoke(state)

    c = final_state.get('classification') or {}
    print(f"\n{'='*60}")
    print(f"  Domain:       {c.get('domain', '—')}")
    print(f"  Intent:       {c.get('main_intent', '—')}/{c.get('sub_intent', '—')}")
    print(f"  Filter delta: {json.dumps(c.get('filter_delta') or {})}")
    print(f"  Tool calls:   {[t['tool'] for t in executor.calls_made]}")
    print(f"  SSE events:   {[e['type'] for e in sse_events]}")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Housing chatbot dry-run CLI')
    parser.add_argument('--message', '-m', required=True)
    parser.add_argument('--scenario', '-s', default='default')
    parser.add_argument('--mock-slm', action='store_true')
    parser.add_argument('--mock-llm', action='store_true')
    args = parser.parse_args()
    asyncio.run(main(args.message, args.scenario, args.mock_slm, args.mock_llm))
