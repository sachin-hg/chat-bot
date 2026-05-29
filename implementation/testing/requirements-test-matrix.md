# Requirements → Test Matrix

Every documented requirement maps to at least one test. Format:
`[REQ-ID] Requirement text | Test function | Layer | File`

Status: ✅ Implemented | 🔧 Ticket exists | ⬜ Not yet ticketed

---

## Pipeline: Classification Nodes

| REQ | Requirement | Test | Layer | Status |
|---|---|---|---|---|
| REQ-CLS-001 | safety_node blocks "ignore previous instructions" | `test_safety_blocks_injection` | Unit | 🔧 CHAT-Q-002 |
| REQ-CLS-002 | safety_node allows valid real estate query | `test_safety_allows_valid_query` | Unit | 🔧 CHAT-Q-002 |
| REQ-CLS-003 | normalize_node passes long Indian city names (thiruvananthapuram etc.) | `test_normalize_passes_long_city_names` | Unit | 🔧 CHAT-Q-002 |
| REQ-CLS-004 | normalize_node applies NFKC unicode normalization | `test_normalize_unicode_nfkc` | Unit | 🔧 CHAT-Q-002 |
| REQ-CLS-005 | route_domain_node returns out_of_scope when confidence < 0.65 | `test_domain_router_low_confidence_fallback` | Unit | ⬜ |
| REQ-CLS-006 | route_domain_node falls back to last_domain on timeout | `test_domain_router_timeout_fallback` | Unit | ⬜ |
| REQ-CLS-007 | out_of_scope domain → classify_node skipped (zero SLM tokens) | `test_out_of_scope_skips_stage2` | Unit + Dry Run | 🔧 CHAT-Q-DRY-001 |
| REQ-CLS-008 | validate_slm rejects cross-domain intent (locality from property_search domain) | `test_validate_slm_cross_domain_rejection` | Unit | 🔧 CHAT-Q-002 |
| REQ-CLS-009 | validate_slm rejects unknown intent not in INTENT_REGISTRY | `test_validate_slm_unknown_intent` | Unit | 🔧 CHAT-Q-002 |
| REQ-CLS-010 | validate_slm coerces `localities: "Andheri"` → `["Andheri"]` | `test_validate_slm_coerces_string_locality` | Unit | 🔧 CHAT-Q-002 |
| REQ-CLS-011 | validate_slm coerces `clarification_needed: true` → question string | `test_validate_slm_coerces_clarification_bool` | Unit | 🔧 CHAT-Q-002 |
| REQ-CLS-012 | validate_slm coerces `clarification_needed: ""` → None | `test_validate_slm_empty_clarification_is_null` | Unit | ⬜ |
| REQ-CLS-013 | reasoning field truncated to ≤30 words | `test_classifier_reasoning_word_cap` | Unit | ⬜ |
| REQ-CLS-014 | calculator main_intent accepted in property_detail domain | `test_calculator_domain_accepted` | Unit | ⬜ |
| REQ-CLS-015 | multi_intent bypasses domain guard | `test_multi_intent_bypasses_domain_check` | Unit | ⬜ |

---

## Pipeline: Processing Nodes

| REQ | Requirement | Test | Layer | Status |
|---|---|---|---|---|
| REQ-PROC-001 | amenities ADD: first mention treated as ADD (not REPLACE) | `test_filter_apply_amenities_first_mention_is_add` | Unit | 🔧 CHAT-Q-003 |
| REQ-PROC-002 | amenities ADD: second mention merges with first | `test_filter_apply_amenities_second_mention_merges` | Unit | 🔧 CHAT-Q-003 |
| REQ-PROC-003 | bhk REPLACE: `[2,3]` → delta `[3]` = `[3]` | `test_filter_apply_bhk_replace_semantics` | Unit | 🔧 CHAT-Q-003 |
| REQ-PROC-004 | price_max type: "80L" string → 8,000,000 integer | `test_filter_apply_parses_lakh_string` | Unit | ⬜ |
| REQ-PROC-005 | price_max type: "2cr" string → 20,000,000 integer | `test_filter_apply_parses_crore_string` | Unit | ⬜ |
| REQ-PROC-006 | filter_apply skips when `clarification_needed` is set | `test_filter_apply_skips_on_clarification` | Unit | 🔧 CHAT-Q-003 |
| REQ-PROC-007 | sanitize clears bhk/price filters on pivot to locality_research | `test_sanitize_bhk_cleared_on_locality_pivot` | Unit | 🔧 CHAT-Q-003 |
| REQ-PROC-008 | sanitize preserves city, transaction_type, active_entities on pivot | `test_sanitize_preserves_universal_keys` | Unit | ⬜ |
| REQ-PROC-009 | derive converts price_per_sqft + price_sqft_bound=max → price_max | `test_derive_sqft_to_price_max` | Unit | 🔧 CHAT-Q-003 |
| REQ-PROC-010 | derive skips sqft conversion if price already set | `test_derive_skips_if_price_set` | Unit | ⬜ |
| REQ-PROC-011 | clarify_node emits nested_qna when clarification_needed is set | `test_clarify_emits_nested_qna` | Unit | 🔧 CHAT-Q-003 |
| REQ-PROC-012 | clarify_node short-circuits (sets bot_response) when clarification needed | `test_clarify_short_circuits` | Unit | ⬜ |
| REQ-PROC-013 | resolve_entities resolves ordinal "2nd" from last turn's carousel | `test_resolve_ordinal_from_carousel_state` | Unit | 🔧 CHAT-Q-003 |
| REQ-PROC-014 | resolve_entities adds +0.15 confidence boost for entities in prior carousel | `test_resolve_context_boost` | Unit | ⬜ |
| REQ-PROC-015 | resolve_entities: ambiguous entity (2-3 candidates) → triggers clarification | `test_resolve_ambiguous_triggers_clarification` | Dry Run | ⬜ |
| REQ-PROC-016 | route_node: requires_auth=True + no auth_token → login template | `test_route_auth_gate_login_template` | Unit | 🔧 CHAT-Q-003 |
| REQ-PROC-017 | route_node: Tier 0 → out_of_scope response, short-circuits | `test_route_tier0_short_circuits` | Unit | ⬜ |
| REQ-PROC-018 | route_node: Tier 1 contact_seller → template (no CRM call) | `test_route_tier1_contact_seller_template_only` | Unit | ⬜ |
| REQ-PROC-019 | route_node: Tier 2 portfolio → executes fetch, no LLM | `test_route_tier2_no_llm` | Unit | ⬜ |
| REQ-PROC-020 | route_node: Tier 3a → routing = {tier:'3a', model:'haiku'} | `test_route_tier3a_haiku` | Unit | 🔧 CHAT-Q-003 |
| REQ-PROC-021 | route_node: Tier 3b → routing = {tier:'3b', model:'sonnet'} | `test_route_tier3b_sonnet` | Unit | ⬜ |
| REQ-PROC-022 | recent_searches requires_auth=False (works with token_id) | `test_recent_searches_no_auth_required` | Unit | ⬜ |
| REQ-PROC-023 | saved_properties requires_auth=True → login template for anonymous | `test_saved_properties_requires_auth` | Unit | ⬜ |

---

## Pipeline: Response Nodes + SSE

| REQ | Requirement | Test | Layer | Status |
|---|---|---|---|---|
| REQ-RESP-001 | summary_node skips for text-only intents (not in SUMMARY_BUILDERS) | `test_summary_skips_text_only_intent` | Unit | 🔧 CHAT-Q-005 |
| REQ-RESP-002 | summary_node skips for Tier 0/1/2 routing | `test_summary_skips_non_tier3` | Unit | 🔧 CHAT-Q-005 |
| REQ-RESP-003 | summary_node skips if any entity confidence < 0.70 (eagerness guard) | `test_summary_eagerness_guard_low_confidence` | Unit | 🔧 CHAT-Q-005 |
| REQ-RESP-004 | summary_node emits message_delta + chat_event(seq:0, IN_PROGRESS) | `test_summary_emits_correct_sse_events` | Unit | 🔧 CHAT-Q-005 |
| REQ-RESP-005 | respond_node emits property_carousel for filter_search | `test_respond_emits_property_carousel` | Unit | 🔧 CHAT-Q-005 |
| REQ-RESP-006 | respond_node emits locality_carousel for trending_localities | `test_respond_emits_locality_carousel` | Unit | ⬜ |
| REQ-RESP-007 | respond_node: carousel seq = 1 if summary_emitted=True | `test_respond_seq_with_summary` | Unit | 🔧 CHAT-Q-005 |
| REQ-RESP-008 | respond_node: carousel seq = 0 if summary_emitted=False | `test_respond_seq_without_summary` | Unit | ⬜ |
| REQ-RESP-009 | followup_node: seq = summary_offset + template_count | `test_followup_seq_calculation` | Unit | 🔧 CHAT-Q-005 |
| REQ-RESP-010 | followup_node emits COMPLETED as final event | `test_followup_emits_completed` | Unit | 🔧 CHAT-Q-005 |
| REQ-RESP-011 | validate_output blocks URLs in LLM text | `test_validate_output_blocks_url` | Unit | 🔧 CHAT-Q-005 |
| REQ-RESP-012 | validate_output blocks phone numbers | `test_validate_output_blocks_phone_number` | Unit | ⬜ |
| REQ-RESP-013 | validate_output allows markdown tables for comparison intents | `test_validate_output_allows_comparison_table` | Unit | 🔧 CHAT-Q-005 |
| REQ-RESP-014 | validate_output blocks markdown tables for non-comparison intents | `test_validate_output_blocks_table_non_comparison` | Unit | ⬜ |
| REQ-RESP-015 | emit_final_state: login template emits text(seq:0) + template(seq:1) | `test_emit_login_template_sequence` | Unit | 🔧 CHAT-Q-005 |
| REQ-RESP-016 | emit_final_state: unknown bot_response shape → safe error event | `test_emit_unknown_shape_fallback` | Unit | ⬜ |
| REQ-RESP-017 | connection_ack is always the first SSE event | `test_connection_ack_is_first` | Dry Run | 🔧 CHAT-Q-DRY-003 |
| REQ-RESP-018 | COMPLETED is always the last SSE event | `test_completed_is_last` | Dry Run | 🔧 CHAT-Q-DRY-003 |
| REQ-RESP-019 | template intent produces exactly 3 phases (seq 0, 1, 2+) | `test_template_intent_3_phases` | Dry Run | 🔧 CHAT-Q-DRY-004 |
| REQ-RESP-020 | text-only intent produces only Phase 3 (seq 0, COMPLETED) | `test_text_only_intent_single_phase` | Dry Run | 🔧 CHAT-Q-DRY-004 |
| REQ-RESP-021 | short-circuit produces single event via emit_final_state | `test_short_circuit_single_event` | Dry Run | 🔧 CHAT-Q-DRY-003 |

---

## SLM Classification Quality

| REQ | Requirement | Test | Layer | Status |
|---|---|---|---|---|
| REQ-SLM-001 | domain router accuracy ≥ 98% on 100+ labeled cases | `domain_router/cases.jsonl` eval | Model Eval | 🔧 CHAT-Q-016 |
| REQ-SLM-002 | property_search classifier sub_intent accuracy ≥ 95% | `property_search/cases.jsonl` eval | Model Eval | 🔧 CHAT-Q-017 |
| REQ-SLM-003 | property_detail classifier accuracy ≥ 95% | `property_detail/cases.jsonl` eval | Model Eval | ⬜ |
| REQ-SLM-004 | locality classifier accuracy ≥ 93% | `locality/cases.jsonl` eval | Model Eval | ⬜ |
| REQ-SLM-005 | Hindi price units correctly parsed ("80 lakhs" → price_max: 8000000) | `test_hindi_price_unit_parsing` | Dry Run | ⬜ |
| REQ-SLM-006 | Hindi ordinals resolved ("doosri" = 2nd, "teesri" = 3rd) | `test_hindi_ordinal_resolution` | Dry Run | 🔧 CHAT-Q-013 |
| REQ-SLM-007 | BHK ADD semantics: "2 and 3BHK" → `bhk: [2,3]` | `test_slm_bhk_add_semantics` | Dry Run | ⬜ |
| REQ-SLM-008 | BHK ADD from "as well": "3bhk as well" → `bhk: [2,3]` when session has `[2]` | `test_slm_bhk_add_as_well` | Dry Run | ⬜ |
| REQ-SLM-009 | pivot=True when main_intent changes from previous turn | `test_slm_pivot_detection` | Dry Run | ⬜ |
| REQ-SLM-010 | clarification triggered for ambiguous entity (2-3 candidates) | `test_slm_clarification_ambiguous_entity` | Dry Run | 🔧 CHAT-Q-009 |
| REQ-SLM-011 | calculator intents classified to property_detail domain | `test_slm_calculator_in_property_detail_domain` | Unit | ⬜ |
| REQ-SLM-012 | out_of_scope rate < 5% on valid real estate queries | Monitored via alert threshold | Production monitoring | ⬜ |

---

## LLM Output Quality

| REQ | Requirement | Test | Layer | Status |
|---|---|---|---|---|
| REQ-LLM-001 | LLM rubric score p50 ≥ 0.70 across all Tier 3a turns | `llm_tier3a/cases.jsonl` eval | Model Eval | ⬜ |
| REQ-LLM-002 | is_followup=True: LLM does NOT repeat Phase 1 summary | `test_llm_no_phase1_repeat_when_followup` | Dry Run | ⬜ |
| REQ-LLM-003 | LLM responds in same language as user (Hindi query → Hindi response) | `test_llm_language_match` | Dry Run | ⬜ |
| REQ-LLM-004 | Comparison intent generates valid markdown table | `test_llm_comparison_generates_table` | Dry Run | 🔧 CHAT-Q-007 |
| REQ-LLM-005 | LLM does NOT invent property IDs or prices | `test_llm_no_hallucinated_property_ids` | Dry Run | ⬜ |
| REQ-LLM-006 | LLM followup is 1-3 sentences for template intents | `test_llm_followup_length_template_intent` | Dry Run | ⬜ |
| REQ-LLM-007 | Tier B tool called only when all inputs explicitly stated | `test_tier_b_tool_requires_explicit_inputs` | Unit | ⬜ |
| REQ-LLM-008 | getNearbyLandmarks truncated to max 15 items before LLM context | `test_nearby_landmarks_truncation` | Unit | ⬜ |

---

## Session State

| REQ | Requirement | Test | Layer | Status |
|---|---|---|---|---|
| REQ-SESS-001 | city inferred from first locality mention (Powai → Mumbai) | `test_session_city_inferred_from_locality` | Dry Run | ⬜ |
| REQ-SESS-002 | transaction_type inferred from price scale (1.5cr → buy) | `test_session_transaction_type_inference` | Dry Run | ⬜ |
| REQ-SESS-003 | active_property_id set when ordinal resolves to a property | `test_session_property_id_from_ordinal` | Dry Run | 🔧 CHAT-Q-006 |
| REQ-SESS-004 | carry_over_keys preserved across pivot (city, transaction_type preserved) | `test_session_carry_over_on_pivot` | Dry Run | 🔧 CHAT-Q-014 |
| REQ-SESS-005 | clear_keys removed on pivot (bhk, price cleared when pivoting to locality) | `test_session_clear_keys_on_pivot` | Dry Run | 🔧 CHAT-Q-014 |
| REQ-SESS-006 | srset_id stored after searchProperties call | `test_session_srset_id_stored` | Dry Run | ⬜ |
| REQ-SESS-007 | recent_searches stored in session for token_id (no auth required) | `test_session_recent_searches_anonymous` | Unit | ⬜ |
| REQ-SESS-008 | optimistic locking: concurrent save on same session returns False on conflict | `test_session_store_optimistic_lock` | Unit | ⬜ |
| REQ-SESS-009 | conv:turns LTRIM at 20 (oldest dropped) | `test_session_turns_trimmed_at_20` | Unit | ⬜ |
| REQ-SESS-010 | conv:summary written after turns > 20 (async) | `test_session_summary_triggered_at_20` | Unit | ⬜ |

---

## API Contract

| REQ | Requirement | Test | Layer | Status |
|---|---|---|---|---|
| REQ-API-001 | GET /chat/get-conversation-id returns tokenId for anonymous user | `test_get_conv_id_anonymous` | Unit | ⬜ |
| REQ-API-002 | GET /chat/get-conversation-id validates login-auth-token via login service | `test_get_conv_id_logged_in_validates_token` | Unit | ⬜ |
| REQ-API-003 | POST /chat/migrate-chat associates token_id to user_id | `test_migrate_chat_claims_token` | Unit | ⬜ |
| REQ-API-004 | GET /chat/get-conversation-details returns paginated history | `test_get_history_paginated` | Unit | ⬜ |
| REQ-API-005 | GET /chat/get-conversation-details uses created_at cursor correctly | `test_get_history_cursor` | Unit | ⬜ |
| REQ-API-006 | POST /chat/cancel stops in-flight LLM stream | `test_cancel_stops_stream` | Unit | 🔧 CHAT-A-023 |
| REQ-API-007 | LLM concurrency gate: 120 concurrent max, queue up to 300 | `test_llm_concurrency_gate` | Unit | 🔧 CHAT-Q-018 |
| REQ-API-008 | Rate limit: 60 chat messages/min for anonymous | `test_rate_limit_anonymous_60_per_min` | Unit | ⬜ |
| REQ-API-009 | Rate limit: 120 chat messages/min for logged-in | `test_rate_limit_logged_in_120_per_min` | Unit | ⬜ |
| REQ-API-010 | error SSE event has ErrorCode from defined enum | `test_error_event_has_valid_code` | Dry Run | ⬜ |

---

## Database & Persistence

| REQ | Requirement | Test | Layer | Status |
|---|---|---|---|---|
| REQ-DB-001 | messages table partitioned by month | `test_messages_partition_exists` | Integration | ⬜ |
| REQ-DB-002 | EXPLAIN shows index scan for conversation history query | `test_messages_index_scan` | Integration | ⬜ |
| REQ-DB-003 | trigger increments turn_count on user message insert | `test_trigger_increments_turn_count` | Integration | ⬜ |
| REQ-DB-004 | template content stored in JSONB, text content in JSONB, both via same column | `test_message_content_schema` | Integration | ⬜ |
| REQ-DB-005 | Kafka consumer idempotent (dedup key prevents duplicate inserts) | `test_kafka_consumer_dedup` | Unit | ⬜ |
| REQ-DB-006 | Kafka consumer bulk INSERT 500 rows per batch | `test_kafka_consumer_batch_size` | Unit | ⬜ |

---

## Tool Contracts

| REQ | Requirement | Test | Layer | Status |
|---|---|---|---|---|
| REQ-TOOL-001 | searchProperties returns hits[], total_count, srset_id | `test_search_properties_contract` | Integration | 🔧 CHAT-Q-004 |
| REQ-TOOL-002 | getPropertyDetail returns property_id, title, price, verified | `test_get_property_detail_contract` | Integration | 🔧 CHAT-Q-004 |
| REQ-TOOL-003 | resolveEntity returns uuid, confidence, entity_type | `test_resolve_entity_contract` | Integration | 🔧 CHAT-Q-004 |
| REQ-TOOL-004 | Tool cache: getPropertyDetail cached for 15min | `test_property_detail_cache_ttl` | Unit | ⬜ |
| REQ-TOOL-005 | Tool cache: searchProperties NOT cached (ttl=0) | `test_search_properties_not_cached` | Unit | ⬜ |
| REQ-TOOL-006 | Tool cache: getSavedProperties invalidated after shortlistProperty | `test_saved_properties_cache_invalidation` | Unit | ⬜ |
| REQ-TOOL-007 | contact_seller: BE emits template with property_id only (no CRM call) | `test_contact_seller_no_crm_call` | Unit | ⬜ |
| REQ-TOOL-008 | getNearbyLandmarks result truncated to max 15 items before LLM context | `test_nearby_landmarks_truncated` | Unit | ⬜ |

---

## Security

| REQ | Requirement | Test | Layer | Status |
|---|---|---|---|---|
| REQ-SEC-001 | ANTHROPIC_API_KEY never appears in structured logs | `test_api_key_not_in_logs` | Unit | 🔧 CHAT-A-021 |
| REQ-SEC-002 | User message text not logged at INFO level | `test_user_message_not_in_info_logs` | Unit | 🔧 CHAT-A-021 |
| REQ-SEC-003 | Prompt injection blocked by safety_node | `test_safety_blocks_prompt_injection` | Unit | 🔧 CHAT-Q-002 |
| REQ-SEC-004 | session_id validated against token_id (cross-session access blocked) | `test_session_ownership_validation` | Unit | ⬜ |

---

## Coverage Targets

| Layer | Target | Measured by |
|---|---|---|
| Unit tests | ≥80% line coverage on `src/` | `pytest --cov=src --cov-report=term` |
| Dry run | All 10 scenarios have passing tests | `pytest tests/dry_run/` |
| Model eval | domain_router ≥98%, classifiers ≥95% | `pytest tests/model_eval/ --real-model` |
| Requirements coverage | ≥90% of REQ-* have ✅ tests | This matrix (count ✅ / total) |

---

## Ticket Backlog for Unimplemented Tests

All tests marked ⬜ need tickets. Priority order for @rahul:

**Sprint 1-2 (immediate):**
- CHAT-Q-DRY-005/006: Moved to Sprint 2 (nodes don't exist in Sprint 1)
- CHAT-Q-LLM-001 (new): Author llm_tier3a/cases.jsonl — 80 cases, ≥20 is_followup_true, ≥15 Hindi response expected. Wire the LLM rubric eval runner from testing-guide.md.

**Sprint 2-3:**
- CHAT-Q-DB-001 (new): REQ-DB-001 through REQ-DB-006 — partition exists, index scan, trigger increment, JSONB schema, Kafka dedup, batch size. Layer 0 integration tests requiring real Postgres.
- CHAT-Q-SEC-001 (new): REQ-SEC-001 through REQ-SEC-004 — key not in logs, message not in logs, injection blocked, session ownership. Unit tests with log capture fixture.

**Sprint 3-4:**
- All remaining REQ-LLM-*, REQ-SESS-*, REQ-API-* gaps
