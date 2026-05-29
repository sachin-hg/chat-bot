# Debugging: Trace, Dry-Run & Replay

LangSmith trace lookup, dry_run() helper, turn replay, and the Registry Explorer CLI.

---

## Part 12 — Debugging: Trace, Dry-Run, and Replay

### Finding a Turn in LangSmith

Every graph invocation creates a LangSmith run with `run_id = request_id`. To find a specific bad turn:

```bash
# Python SDK
from langsmith import Client
client = Client()
run = client.read_run(run_id='<request_id>')   # full tree: every node as a child run
```

The LangSmith trace shows:
- Input and output for each graph node
- Per-node wall-clock latency
- Full LLM prompts and responses (system prompt + messages + tool definitions)
- Tool calls and their results

Every log line emitted during that turn also carries `request_id`, so structured log search returns
the complete picture: which nodes ran, which fetches failed, what the SLM classified, what the LLM generated.

### Dry-Run Mode: Prompt Inspector

Run the pipeline through `build_prompt_node` **without** making the LLM call. Returns the assembled
system prompt, tool definitions, and conversation history — full prompt visibility at zero LLM cost.

```python
async def dry_run(
    message:      str,
    session:      dict,
    request_id:   str = 'dry_run_0',
    mock_executor: CachedExecutorPort | None = None,
) -> dict:
    """Runs safety → normalize → route_domain → classify → validate_slm → filter_apply →
    sanitize → derive → clarify → resolve_entities → route → summary → experiment →
    fetch_data → build_prompt. Stops before llm_node. No LLM call, no token cost.

    Returns the assembled prompt state so you can inspect exactly what Claude would see.
    """
    # ... implementation runs the graph with a StopAtNode('build_prompt') interrupt
    return {
        'system_prompt':        state['system_prompt'],
        'tool_definitions':     state['tool_definitions'],
        'conversation_history': state['session']['turn_history'],
        'classification':       state['classification'],
        'pre_fetched_data':     state['pre_fetched_data'],
        'fetch_errors':         state['fetch_errors'],
        'routing':              state['routing'],
    }
```

CLI:
```bash
# Inspect the prompt for any message
python -m bot.tools.dry_run \
  --message "compare Andheri and Bandra for a 2BHK rental" \
  --session-id <session_id>      # loads live session from Redis

# Against a minimal mock session (no Redis, no API calls)
python -m bot.tools.dry_run \
  --message "compare Andheri and Bandra" \
  --mock-session '{"city":"Mumbai","transaction_type":"rent","active_filters":{}}'
```

### Decision Trace

After each turn completes, the graph runner can emit a human-readable decision trace from the
final BotState. The trace records what every node decided — without reading LangSmith.

```
Turn <request_id>  Session <session_id>
Message: "compare Andheri and Bandra for a 2BHK rental"

safety_node          PASS
normalize_node       PASS  gibberish=False
classify_node        comparison / compare_localities  [148ms, 420→82 tokens, $0.000012]
validate_slm_node    PASS  coerced entities=[{name:Andheri,type:locality},{name:Bandra,type:locality}]
filter_apply_node    APPLIED  {transaction_type:rent, bhk:[2]}
sanitize_node        CLEARED  [localities]  (pivot to comparison)
derive_node          SKIP
clarify_node         SKIP
resolve_entities     Andheri→uuid=abc123 [38ms]  Bandra→uuid=def456 [41ms]
route_node           tier=3b, model=sonnet
summary_node         EMITTED  seq=0  "Comparing Andheri and Bandra for you..."  [builder=build_comparison_summary]
experiment_node      experiment=slm_v2_test variant=control
fetch_data_node      6 fetches parallel [152ms]  HITS: getRatingsReviews:0, getRatingsReviews:1
                     MISSES: getLocalityDetail:0, getLocalityDetail:1, getPriceTrends:0, getPriceTrends:1
respond_node         2 template events emitted (locality_carousel seq=1, locality_carousel seq=2)
build_prompt_node    block=prompts/llm/followup/comparison.md  is_followup=True  tokens=3218
llm_node             sonnet [920ms, in=3218 out=412 $0.0103, ttft=240ms, msg_delta×18 chunks seq=3]
validate_output_node PASS
followup_node        1 chat_event emitted (text followup seq=3, COMPLETED)  session saved
```

### Request Replay

Replay a recorded turn through the current pipeline — essential for regression testing after prompt changes:

```python
@dataclass
class TurnRecord:
    request_id:       str
    session_id:       str
    raw_message:      str
    session_snapshot: dict         # session state at turn start (from LangSmith)
    expected_main_intent: str
    expected_sub_intent:  str
    recorded_response:    dict | None = None  # for diff comparison

async def replay_turn(turn: TurnRecord, compare: bool = True) -> dict:
    """Replays the recorded inputs through the current pipeline.
    Returns new response and, if compare=True, a structured diff vs the recorded response.
    """
    ...
```

```bash
# Replay a single bad turn
python -m bot.tools.replay --request-id <request_id>

# Replay all turns in a session (smoke test after prompt change)
python -m bot.tools.replay --session-id <session_id>

# Replay and show diff vs recorded responses
python -m bot.tools.replay --request-id <request_id> --compare

# Batch replay an eval set (nightly CI job)
python -m bot.tools.replay --eval-file tests/slm/eval/regression_cases.jsonl --compare
```

---

