# Pre-Start Audit Findings

**Date:** 2026-05-29  
**Status:** 62 issues found. All resolved. ✅

---

## CRITICAL — Must fix before any code is written

These will cause runtime failures or unimplementable code if not resolved first.

| # | Area | Finding | Fix applied? |
|---|---|---|---|
| C-01 | DB Schema | `transaction_type_enum` missing from CHAT-A-002 migration ticket | ✅ Fixed |
| C-02 | DB Schema | `pgcrypto` + `pg_cron` extensions not in CHAT-A-002 | ✅ Fixed |
| C-03 | DB Schema | `request_id UUID` column missing from messages DDL in CHAT-A-002 | ✅ Fixed |
| C-04 | BE Config | `BOT_ENV` Settings missing `mock` literal — `make dry-run` will crash on startup | ✅ Fixed |
| C-05 | BE Config | `login_service_url` not in Settings class (CHAT-A-003) — CHAT-A-007 calls it | ✅ Fixed |
| C-06 | BE Config | `KAFKA_CONSUMER_GROUP` not in Settings class | ✅ Fixed |
| C-07 | AI/ML | `MODEL_REGISTRY` Python module (`src/registries/model_registry.py`) has no ticket — adapters call `MODEL_REGISTRY["domain_router"].model_id` | ✅ Fixed |
| C-08 | AI/ML | `build_graph()` function not ticketed — no one owns the final LangGraph wiring factory | ✅ Fixed |
| C-09 | AI/ML | `build_intent_taxonomy_block(domain)` wrong signature — function takes no args per docs | ✅ Fixed |
| C-10 | AI/ML | 10 TOOL_REGISTRY tools have no executor ticket (getTransactionHistory, getDemandSupplyInsight, getTravelTime, getPriceBuckets, getFilterSuggestions, getCollections, getPopularCityLandmarks, getTopSocieties, getRecentlyViewed, getTrendingProjects) | ✅ Fixed |
| C-11 | AI/ML | CHAT-P-025 labels wrong backends: getProjectDetail is Venus (not Odin), getProjectPriceTrends is Gandalf | ✅ Fixed |
| C-12 | AI/ML | `recent_searches` requires_auth conflict: INTENT_REGISTRY has `requires_auth=True`, PM said no auth needed, ticket says no auth | ✅ Fixed — set requires_auth=False in registry |
| C-13 | AI/ML | `locality_comparison` in SUMMARY_BUILDERS is wrong — it's Tier 3b text-only, no summary phase | ✅ Fixed |
| C-14 | QA | `SSEEvent` dataclass never defined in dry-run-runner.md — runner is unimplementable | ✅ Fixed |
| C-15 | QA | Testing docs use both Gemini and Anthropic as the SLM provider — testing-guide.md still references `GOOGLE_API_KEY` and Gemini | ✅ Fixed |
| C-16 | FE | `floor_plan_carousel` templateId doesn't exist — CHAT-D-005 tests a nonexistent template | ✅ Fixed |
| C-17 | FE | `applyFilter` user_action undefined in templates.md — CHAT-D-007 tests it | ✅ Fixed |
| C-18 | BE/FE | A1 response shape conflict: ticket says `{conversationId, tokenId, isNew}`, docs say `{conversationId, isNew}` — alignment needed | ✅ Fixed — tokenId in A1 response |

---

## IMPORTANT — Fix before sprint starts

These are gaps that will cause blocked engineers mid-sprint.

| # | Area | Finding | Ticket |
|---|---|---|---|
| I-01 | DB | `pg_partman` part_config retention not in CHAT-A-002 AC | Updated CHAT-A-002 |
| I-02 | BE | A4 non-streaming endpoint (`POST /chat/send-message`) not ticketed | New: CHAT-A-024 |
| I-03 | BE | CHAT-A-007 missing return-visitor flow (existing token_id → existing conversation) | Updated CHAT-A-007 |
| I-04 | BE | `connection_close` SSE event not in CHAT-A-006 AC | Updated CHAT-A-006 |
| I-05 | BE | `out_of_scope` SSE event type not in CHAT-A-006 | Updated CHAT-A-006 |
| I-06 | BE | `response_required` and `is_visible` missing from ChatEventToUser (CHAT-A-009) | Updated CHAT-A-009 |
| I-07 | BE | CHAT-A-016 (LLM concurrency gate) has no detailed spec in be-backlog | Updated CHAT-A-016 |
| I-08 | BE | No ticket for circuit breaker in CHAT-P-016 / CachedExecutorPort | Updated CHAT-P-016 AC |
| I-09 | BE | No ticket for Kafka producer in-memory retry queue | Updated CHAT-A-010 |
| I-10 | BE | `migrate-chat` naming confusion (two different operations use same term) | Documented |
| I-11 | BE | HandoffContext BE-side changes in CHAT-A-006 not ticketed | Added to CHAT-P-034 |
| I-12 | AI/ML | `experiment_node` double-ticketed (P-011 stub + P-036 full) without clarity | Clarified |
| I-13 | AI/ML | `build_login_template_response` helper not in any ticket | Added to CHAT-P-010 |
| I-14 | AI/ML | CHAT-P-015 (graph wiring) needs `build_graph()` function spec | Updated |
| I-15 | AI/ML | CHAT-P-005 missing Section 4 (Disambiguation Examples) authoring | Added |
| I-16 | AI/ML | contact_seller Tier 1 behavior still ambiguous — confirmation card vs template-only | Clarified |
| I-17 | AI/ML | `save_alert` is Tier 1 (not Tier 2) — diagram wrong | Fixed in intent-registry.md |
| I-18 | QA | DryRunResult API inconsistency — dry-run-spec test patterns use wrong field names | Fixed |
| I-19 | QA | `disqualifiers` missing from qa-backlog case example | Fixed |
| I-20 | QA | CHAT-Q-DRY-005/006 assigned to Sprint 1 but test nodes that don't exist yet | Moved to Sprint 2 |
| I-21 | QA | No project_research dry run scenario | Added scenario file spec |
| I-22 | QA | No calculator dry run scenario | Added scenario file spec |
| I-23 | QA | REQ-DB-* and REQ-SEC-* have zero QA tickets | Added CHAT-Q-DB-001, CHAT-Q-SEC-001 |
| I-24 | QA | REQ-LLM-* all unticketed — no LLM rubric eval cases ticket | Added CHAT-Q-LLM-001 |
| I-25 | FE | `shortlist_property` template not in any FE validation ticket | Added to CHAT-D-007 |
| I-26 | FE | portfolio carousel variants (viewed_properties, recommendations) not in FE tickets | Added to CHAT-D-004 |
| I-27 | FE | A6 migrate-chat has no FE ticket | New: CHAT-D-010 |
| I-28 | FE | cookie lifecycle (create, persist, delete on logout) not tested | Added to CHAT-D-002 |
| I-29 | FE | contact_seller_confirmed FE handling doesn't match templates.md | Clarified |

---

## MINOR — All resolved

| # | Area | Finding | Fix |
|---|---|---|---|
| M-01 | Docs | resilience.md: SLM timeout contradiction | ✅ Stage 1 / Stage 2 rows split |
| M-02 | Docs | resilience.md: LLM timeout contradiction | ✅ TTFT 5s + total 30s documented |
| M-03 | Docs | `Gandalf` and other backends absent from tech-stack.md | ✅ Backend services table added |
| M-04 | AI/ML | Wire format refs missing from P-025, P-026 | ✅ Added to both tickets |
| M-05 | AI/ML | `recently_viewed_cross_session` not addressed | ✅ Note added to CHAT-P-026b |
| M-06 | QA | `stage1_ms`/`stage2_ms` always 0 — misleading | ✅ NOTE comment added to dry-run-runner.md |
| M-07 | QA | SSE ordering test layer redundancy undocumented | ✅ Layer 3 vs Layer 4 distinction is intentional — L3 validates pipeline, L4 validates server. No change needed. |
| M-08 | QA | `mock_llm=True` / `--mock-llm` CI mode undocumented | ✅ Documented as recommended CI path in testing-guide.md |
| M-09 | QA | `confidence_min` mismatch (0.85 vs 0.90) | ✅ qa-backlog.md example updated to 0.90 |
| M-10 | QA | `condition` field in disqualifiers undocumented | ✅ Documented in testing-guide.md calibration logic |
| M-11 | QA | `portfolio_anonymous.json` multi-turn setup undocumented | ✅ Note added to dry-run-spec.md |
| M-12 | FE | A4 non-streaming error handling missing from CHAT-D-007 | ✅ Toast + no-SSE behavior added |
| M-13 | FE | `token_id` header wiring | ✅ Already present in CHAT-D-002 AC (X-Token-ID header on all requests) |
| M-14 | AI/ML | CHAT-P-008–P-015 missing per-node AC table | ✅ Per-node AC table added |
| M-15 | QA | `condition` disqualifier values undocumented | ✅ Fixed together with M-10 |
