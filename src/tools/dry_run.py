"""CLI dry-run. Usage: python -m src.tools.dry_run --message "..." [--scenario X] [--mock-slm] [--mock-llm]"""
import argparse, asyncio, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

def _infer_mock_intent(message: str) -> tuple:
    """Keyword-based intent inference for mock SLM — good enough for CLI dry runs."""
    m = message.lower()

    # Out of scope
    if any(k in m for k in ['joke', 'weather', 'recipe', 'cricket', 'movie']):
        return 'out_of_scope', 'out_of_scope', 'out_of_scope_query', {}, []

    # Comparison
    if 'compare' in m or ('vs' in m and ('bhk' in m or 'locality' in m or 'area' in m)):
        return 'locality', 'comparison', 'compare_localities', {}, []

    # Locality research — "tell me about X", "how is X", "X area"
    if any(k in m for k in ['tell me about', 'how is', 'locality', 'area', 'neighbourhood',
                             'location', 'infrastructure', 'connectivity', 'schools', 'hospitals']):
        # Extract entity
        for word in ['andheri', 'bandra', 'powai', 'juhu', 'worli', 'kurla', 'thane',
                     'malad', 'goregaon', 'borivali', 'kandivali', 'dahisar']:
            if word in m:
                return ('locality', 'locality_research', 'locality_overview',
                        {'localities': [word.title()]},
                        [{'name': word.title(), 'inferred_type': 'locality'}])
        return 'locality', 'locality_research', 'locality_overview', {}, []

    # Portfolio
    if any(k in m for k in ['saved', 'shortlisted', 'my properties', 'viewed', 'recommendations']):
        return 'portfolio', 'portfolio', 'saved_properties', {}, []

    # Project research
    if any(k in m for k in ['project', 'builder', 'lodha', 'godrej', 'prestige', 'sobha']):
        return 'project_research', 'project_research', 'project_overview', {}, []

    # EMI / calculator
    if any(k in m for k in ['emi', 'loan', 'interest', 'afford']):
        return 'property_detail', 'calculator', 'calculate_emi', {}, []

    # Property search — default
    bhk = []
    for n, word in [(1, '1bhk'), (2, '2bhk'), (3, '3bhk'), (4, '4bhk'),
                    (1, '1 bhk'), (2, '2 bhk'), (3, '3 bhk'), (1, '1 bedroom'),
                    (2, '2 bedroom'), (3, '3 bedroom')]:
        if word in m:
            bhk = [n]
            break
    price_max = None
    if '80 lakh' in m or '80l' in m:
        price_max = 8_000_000
    elif '1 crore' in m or '1cr' in m or '1 cr' in m:
        price_max = 10_000_000
    elif '50 lakh' in m or '50l' in m:
        price_max = 5_000_000
    txn = 'rent' if any(k in m for k in ['rent', 'rental', 'lease']) else 'buy'
    entities = []
    filter_delta: dict = {'transaction_type': txn}
    if bhk:
        filter_delta['bhk'] = bhk
    if price_max:
        filter_delta['price_max'] = price_max
    for loc in ['bandra', 'andheri', 'powai', 'juhu', 'worli', 'kurla', 'thane',
                'malad', 'goregaon', 'borivali', 'kandivali', 'mumbai', 'delhi',
                'bangalore', 'pune', 'hyderabad', 'chennai', 'kolkata']:
        if loc in m:
            filter_delta.setdefault('localities', []).append(loc.title())
            entities.append({'name': loc.title(), 'inferred_type': 'locality'})
    return 'property_search', 'property_search', 'filter_search', filter_delta, entities


def _configure_langsmith() -> None:
    """Enable LangSmith tracing if LANGCHAIN_API_KEY is set in env / .env."""
    import os
    from pathlib import Path
    # Load .env manually so the CLI works without pydantic Settings
    env_file = Path(__file__).parent.parent.parent / '.env'
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, _, v = line.partition('=')
                os.environ.setdefault(k.strip(), v.strip())
    api_key = os.environ.get('LANGCHAIN_API_KEY', '')
    tracing = os.environ.get('LANGCHAIN_TRACING_V2', 'false').lower() == 'true'
    if tracing and api_key:
        project = os.environ.get('LANGCHAIN_PROJECT', 'housing-bot-dry-run')
        print(f"  LangSmith: enabled  project={project}")
    else:
        os.environ['LANGCHAIN_TRACING_V2'] = 'false'


async def main(message: str, scenario: str, mock_slm: bool, mock_llm: bool) -> None:
    import os
    _configure_langsmith()
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
        domain, main_intent, sub_intent, filter_delta, entities = _infer_mock_intent(message)
        router = MagicMock()
        router.route = AsyncMock(return_value={'domain': domain, 'confidence': 0.95})
        classifier = MagicMock()
        classifier.classify = AsyncMock(return_value={
            'domain': domain, 'main_intent': main_intent, 'sub_intent': sub_intent,
            'filter_delta': filter_delta, 'entities_mentioned': entities,
            'clarification_needed': None, 'pivot': False, 'multi_intent': False,
            'confidence': 0.95, 'reasoning': 'mock keyword routing',
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
