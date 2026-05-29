# Registry Integrity

Startup validation checks, cross-registry consistency rules, and invariants that must hold at deploy time.

---

## Part 9 — Registry Integrity

`validateRegistryIntegrity()` runs at service startup, before the first request is accepted.
Any violation throws and halts startup — fail fast, never serve with an inconsistent registry.

```python
def validate_registry_integrity() -> None:
    tool_names  = {t.name for t in TOOL_REGISTRY}
    errors: list[str] = []

    for intent in INTENT_REGISTRY:
        id_ = f'{intent.main_intent}/{intent.sub_intent}'

        # Every data_requirements.tool must exist in TOOL_REGISTRY
        for req in intent.data_requirements:
            if req.tool not in tool_names:
                errors.append(f'[{id_}] data_requirements references unknown tool: "{req.tool}"')

        # Every residual_tool must exist in TOOL_REGISTRY AND be llm_visible
        for tool_name in intent.residual_tools:
            if tool_name not in tool_names:
                errors.append(f'[{id_}] residual_tools references unknown tool: "{tool_name}"')
            else:
                record = get_tool_record(tool_name)
                if record and not record.llm_visible:
                    errors.append(
                        f'[{id_}] residual_tools["{tool_name}"] has llm_visible=False — LLM cannot call it'
                    )

        # session_inject keys must be valid SessionState keys (enforced by type at import time;
        # this check catches stringly-typed runtime configs loaded from external files)
        for key in intent.session_inject:
            if not is_valid_session_key(key):
                errors.append(f'[{id_}] session_inject["{key}"] is not a known SessionState field')

    # Every llm_visible, non-tier_b tool must appear in at least one IntentRecord.residual_tools.
    # Tier B tools (calculateEMI, etc.) are injected via TIER_B_TOOL_NAMES, not via residual_tools —
    # they would incorrectly fail this check without the tier_b exclusion.
    for tool in TOOL_REGISTRY:
        if tool.llm_visible and not tool.tier_b:
            in_residual = any(tool.name in i.residual_tools for i in INTENT_REGISTRY)
            if not in_residual:
                errors.append(
                    f'TOOL_REGISTRY["{tool.name}"] has llm_visible=True but is not in any residual_tools'
                )

    # Tier B tools must be api_backend='internal'. External API calls cannot be Tier B —
    # they'd be invoked mid-LLM-response with no latency budget and no circuit-breaker protection.
    for tool in TOOL_REGISTRY:
        if tool.tier_b and tool.api_backend != 'internal':
            errors.append(
                f'TOOL_REGISTRY["{tool.name}"] has tier_b=True but api_backend="{tool.api_backend}" — tier_b requires internal'
            )

    # fetch_key uniqueness: within each IntentRecord, every DataRequirement must resolve to a
    # unique storage key (fetch_key or tool name). Duplicates silently overwrite earlier results.
    # Catches: same tool twice without fetch_key, AND duplicate fetch_key values.
    for intent in INTENT_REGISTRY:
        seen_keys: set[str] = set()
        fk_id = f'{intent.main_intent}/{intent.sub_intent}'
        for req in intent.data_requirements:
            key = req.fetch_key or req.tool
            if key in seen_keys:
                errors.append(
                    f'[{fk_id}] duplicate storage key "{key}" in data_requirements — '
                    f'add a unique fetch_key to each "{req.tool}" entry'
                )
            seen_keys.add(key)

    # FILTER_REGISTRY: clear_on_pivot_to values must be valid main_intent strings
    main_intents = {i.main_intent for i in INTENT_REGISTRY}
    for filt in FILTER_REGISTRY:
        for intent_name in (filt.clear_on_pivot_to or []):
            if intent_name not in main_intents:
                errors.append(
                    f'FILTER_REGISTRY["{filt.key}"].clear_on_pivot_to references unknown intent: "{intent_name}"'
                )

    if errors:
        raise RuntimeError(
            f'Registry integrity check failed ({len(errors)} errors):\n' + '\n'.join(errors)
        )

    log.info('registry_integrity_ok', {
        'intents': len(INTENT_REGISTRY),
        'tools':   len(TOOL_REGISTRY),
        'filters': len(FILTER_REGISTRY),
    })

# Called at startup — before FastAPI begins accepting connections.
validate_registry_integrity()
```

---

## Summary: Where Things Live Now

| Question | Answer |
|---|---|
| What intents exist? | `INTENT_REGISTRY` |
| What tier/model does an intent use? | `INTENT_REGISTRY.tier` + `INTENT_REGISTRY.model` |
| What data does an intent pre-fetch? | `INTENT_REGISTRY.data_requirements` |
| What tools can the LLM call (residual)? | `INTENT_REGISTRY.residual_tools` (usually `[]`) |
| Which tools are LLM-visible? | `TOOL_REGISTRY.llm_visible` (`True` only for `getNearbyLandmarks`) |
| What filters clear on pivot? | `INTENT_REGISTRY.clear_keys` + `FILTER_REGISTRY.clear_on_pivot_to` |
| What tools exist and what params do they need? | `TOOL_REGISTRY` |
| How do tools map to backend APIs? | `TOOL_REGISTRY.api_backend` + `ToolParam.wire_param` |
| What filter keys exist and how do they map to Khoj? | `FILTER_REGISTRY` |
| What are the operation semantics for a filter? | `FILTER_REGISTRY.default_operation` |
| What does the SLM system prompt say? | `prompts/slm/blocks/` |
| What does the LLM system prompt say? | `prompts/llm/blocks/` |
| How is the request processed step by step? | LangGraph StateGraph in Part 5 |
| What are the timeout budgets per backend? | Part 8 — `TOOL_DEFAULT_TIMEOUTS` |
| What errors are retryable and how? | Part 8 — Retry Policy table |
| What happens when a backend is degraded? | Part 8 — Circuit Breakers |
| What happens when some pre-fetches fail? | `asyncio.gather(return_exceptions=True)` + `fetch_errors` → partial LLM response |
| Is the registry consistent at startup? | Part 9 — `validate_registry_integrity()` |
| How do providers get swapped (DIP)? | Protocol adapter interfaces — `ClassifierPort`, `LLMPort`, `ToolExecutorPort` |
| How does commute time work end-to-end? | `locality_research/commute_time` — two parallel_groups + entity coords |
| How does getPropertyDetail route to multiple services? | `TOOL_REGISTRY.api_backend: casa\|venus\|jasprr` + routing table |
| What entity types can resolveEntity handle? | locality, project, developer, landmark, building, city — each maps to a `filter_key` |
| How is market demand/supply data fetched? | `getDemandSupplyInsight` — Casa `/locality-bhk-demand-supply` |
| How do project price trends differ from locality trends? | `getProjectPriceTrends` (Gandalf `projectIds[]`) vs `getPriceTrends` (polygon `uuid`) |
| How does createSearchAlert prevent duplicates/cap? | Subscriptions service enforces DUPLICATE_FILTER + 5-alert hard cap |
| How do I trace a bad turn end-to-end? | Part 11 — `request_id` in logs + LangSmith trace lookup |
| How do I run an A/B experiment on a prompt or model? | Part 12 — `ExperimentConfig` + `experiment_node` |
| How do I test a single graph node in isolation? | Part 13 — `make_base_state()` factories + `MockClassifier` / `MockLLM` |
| How do I inspect the prompt without calling Claude? | Part 11 — `dry_run()` helper |
| How do I track token cost per turn? | Part 10 — `compute_llm_cost()` + `NodeMetrics.extra` |

---

