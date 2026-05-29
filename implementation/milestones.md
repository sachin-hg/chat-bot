# Milestone Tracker

## Sprint Calendar

| Sprint | Duration | Theme | Exit Criteria |
|---|---|---|---|
| **Sprint 0** | Week 1 | Infrastructure | `docker compose up` starts all services; DB migrations run; health check passes; empty FastAPI returns 200 |
| **Sprint 1** | Weeks 2–3 | Pipeline Core | Two-stage SLM classifies a message; LangGraph runs all 19 nodes; SSE endpoint streams a bot response for filter_search |
| **Sprint 2** | Weeks 4–5 | Tool Integration | All tool executors hit real APIs; full conversation with property carousel, LLM followup, session persistence |
| **Sprint 3** | Week 6 | FE Integration | chat-demo sends a message → property carousel renders → user can tap Details → property_about responds |
| **Sprint 4** | Week 7 | Quality & Observability | 80%+ unit test coverage on nodes; 10 E2E golden paths pass; LangSmith traces visible; no plaintext PII in logs |

---

## Sprint 0 — Infrastructure (Week 1)

**Exit criteria:** `make up && make migrate && make health` all green.

| Ticket | Assignee | SP | Status |
|---|---|---|---|
| CHAT-K-001: Docker Compose — all services | @kiran | 3 | ⬜ |
| CHAT-K-002: Makefile targets (up/down/logs/migrate/test) | @kiran | 2 | ⬜ |
| CHAT-K-003: Kafka topic creation script | @kiran | 1 | ⬜ |
| CHAT-K-004: .env.example with all required vars | @kiran | 1 | ⬜ |
| CHAT-A-001: FastAPI skeleton + /health endpoint | @arjun | 2 | ⬜ |
| CHAT-A-002: PostgreSQL migrations (Alembic) — conversations + messages tables | @arjun | 3 | ⬜ |
| CHAT-A-003: Pydantic settings (all config from env) | @arjun | 2 | ⬜ |
| CHAT-A-004: Structlog setup + request_id middleware | @arjun | 2 | ⬜ |
| CHAT-A-005: Redis connection pool setup | @arjun | 1 | ⬜ |
| **Sprint 0 Total** | | **17 SP** | |

---

## Sprint 1 — Pipeline Core (Weeks 2–3)

**Exit criteria:** `POST /api/v1/chat/send-message-streamed` with message "show me 2bhk in mumbai" returns an SSE stream ending with `chat_event { sourceMessageState: COMPLETED }`. SLM two-stage cascade classifies it as property_search/filter_search.

| Ticket | Assignee | SP | Status |
|---|---|---|---|
| CHAT-P-001: INTENT_REGISTRY + TOOL_REGISTRY + FILTER_REGISTRY Python modules | @priya | 3 | ⬜ |
| CHAT-P-002: BotState TypedDict + make_base_state factory | @priya | 1 | ⬜ |
| CHAT-P-003: Anthropic adapter — DomainRouterPort (Stage 1 SLM) | @priya | 3 | ⬜ |
| CHAT-P-004: Anthropic adapter — ClassifierPort (Stage 2 SLM) | @priya | 3 | ⬜ |
| CHAT-P-005: Domain prompt files (all 5 domains) — auto-generated from registry | @priya | 5 | ⬜ |
| CHAT-P-006: safety_node + normalize_node | @priya | 2 | ⬜ |
| CHAT-P-007: route_domain_node + classify_node + validate_slm_node | @priya | 5 | ⬜ |
| CHAT-P-008: filter_apply_node + sanitize_node + derive_node | @priya | 3 | ⬜ |
| CHAT-P-009: clarify_node + resolve_entities_node stub | @priya | 3 | ⬜ |
| CHAT-P-010: route_node (tier routing, auth check) | @priya | 3 | ⬜ |
| CHAT-P-011: summary_node + experiment_node | @priya | 3 | ⬜ |
| CHAT-P-012: build_prompt_node (LLMPromptComposer) | @priya | 5 | ⬜ |
| CHAT-P-013: Anthropic streaming adapter — LLMPort | @priya | 5 | ⬜ |
| CHAT-P-014: llm_node + validate_output_node + followup_node | @priya | 5 | ⬜ |
| CHAT-P-015: LangGraph StateGraph wiring (all 19 nodes) | @priya | 3 | ⬜ |
| CHAT-A-006: SSE streaming endpoint (/chat/send-message-streamed) | @arjun | 5 | ⬜ |
| CHAT-A-007: /chat/get-conversation-id endpoint | @arjun | 2 | ⬜ |
| CHAT-A-008: Redis SessionStorePort implementation | @arjun | 5 | ⬜ |
| CHAT-A-009: ChatEventToUser Pydantic model + emit_sse | @arjun | 3 | ⬜ |
| CHAT-Q-001: Node unit test scaffold + make_base_state factories | @rahul | 3 | ⬜ |
| CHAT-Q-002: Unit tests — classification nodes (safety, normalize, route_domain, classify, validate_slm) | @rahul | 5 | ⬜ |
| CHAT-Q-DRY-001: DryRunExecutor — fixture-based tool executor | @priya | 3 | ⬜ |
| CHAT-Q-DRY-002: 10 scenario JSON files (QA authors) | @rahul | 5 | ⬜ |
| CHAT-Q-DRY-003: BOT_ENV=mock wiring + `make dry-run` CLI | @arjun | 2 | ⬜ |
| **Sprint 1 Total** | | **85 SP** | |

> **Dry Run Exit Criteria (added):** `make dry-run SCENARIO=2bhk_bandra_search MSG="show me 2bhk in bandra"` runs without VPN and prints SSE events with correct classification.

> **Note:** Sprint 1 is heavy because it sets up the whole pipeline skeleton. @priya will pair with @arjun on the adapter injection pattern. @rahul starts writing tests as nodes are committed — not waiting for Sprint 4.

---

## Sprint 2 — Tool Integration (Weeks 4–5)

**Exit criteria:** Full conversation works: user searches → property_carousel rendered by SSE → LLM followup commentary streams → session persisted to PostgreSQL via Kafka.

| Ticket | Assignee | SP | Status |
|---|---|---|---|
| CHAT-P-016: CachedExecutorPort + HttpToolExecutor base class | @priya | 3 | ⬜ |
| CHAT-P-017: Tool executor — resolveEntity (autosuggest, Khoj) | @priya | 3 | ⬜ |
| CHAT-P-018: Tool executor — searchProperties (Khoj) | @priya | 3 | ⬜ |
| CHAT-P-019: Tool executor — getPropertyDetail (Casa) | @priya | 2 | ⬜ |
| CHAT-P-020: Tool executor — getLocalityDetail, getTrendingLocalities (Odin) | @priya | 3 | ⬜ |
| CHAT-P-021: Tool executor — getPriceTrends, getRatingsReviews (Odin) | @priya | 3 | ⬜ |
| CHAT-P-022: Tool executor — getFloorPlans, getBrochure, getSimilarProperties (Casa) | @priya | 3 | ⬜ |
| CHAT-P-023: Tool executor — calculateEMI, calculateAffordability, convertUnit (internal) | @priya | 2 | ⬜ |
| CHAT-P-024: Tool executor — getNearbyLandmarks (Odin, residual) | @priya | 2 | ⬜ |
| CHAT-P-025: Tool executor — getProjectDetail, getProjectPriceTrends (Odin) | @priya | 3 | ⬜ |
| CHAT-P-026: Tool executor — getRecommendations, getSavedProperties, getViewedProperties (Khoj) | @priya | 3 | ⬜ |
| CHAT-P-027: fetch_data_node — parallel group execution with asyncio.gather | @priya | 5 | ⬜ |
| CHAT-P-028: respond_node — build_template_events (all TEMPLATE_BUILDERS) | @priya | 5 | ⬜ |
| CHAT-P-029: SUMMARY_BUILDERS registry + all builder functions | @priya | 3 | ⬜ |
| CHAT-P-030: Tier 1 actions — execute_tier1_action (contact_seller=template only, save_property, save_alert) | @priya | 3 | ⬜ |
| CHAT-P-031: Tier 2 actions — execute_tier2_action (portfolio, calculator); recent_searches uses token_id (no login), others require auth | @priya | 3 | ⬜ |
| CHAT-P-032: resolve_entities_node — real autosuggest + session entity tracking | @priya | 5 | ⬜ |
| CHAT-P-033: Wire tool cache (Redis TTLs from TOOL_REGISTRY) | @priya | 3 | ⬜ |
| CHAT-A-010: Kafka producer — publish messages from followup_node | @arjun | 3 | ⬜ |
| CHAT-A-011: Kafka consumer (chat-db-writer) — bulk INSERT to messages table | @arjun | 5 | ⬜ |
| CHAT-A-012: Kafka consumer (chat-session-events) — session_start/end writes | @arjun | 3 | ⬜ |
| CHAT-A-013: /chat/get-conversation-details (paginated history) | @arjun | 3 | ⬜ |
| CHAT-A-014: /chat/cancel endpoint | @arjun | 2 | ⬜ |
| CHAT-A-015: SessionRegistryPort — write_session_start, ping_session, write_session_end | @arjun | 3 | ⬜ |
| CHAT-A-016: LLM concurrency gate (Redis token bucket + queue) | @arjun | 5 | ⬜ |
| CHAT-A-017: Rate limiting middleware (ratelimit:chat: + ratelimit:llm:) | @arjun | 3 | ⬜ |
| CHAT-Q-003: Unit tests — processing nodes (filter_apply, sanitize, derive, clarify, resolve_entities, route) | @rahul | 5 | ⬜ |
| CHAT-Q-004: Integration tests — tool executors hit real APIs (smoke test, not load test) | @rahul | 5 | ⬜ |
| CHAT-Q-005: Unit tests — response nodes (summary, respond, build_prompt, followup) | @rahul | 5 | ⬜ |
| CHAT-Q-DRY-004: Intent identification test suite (10 scenario flows, mocked tools) | @rahul | 5 | ⬜ |
| **Sprint 2 Total** | | **113 SP** | |

> **Note:** Sprint 2 is the largest sprint. @priya focuses on tools; @arjun focuses on persistence + concurrency. @rahul tests as tickets are completed, not after.

---

## Sprint 3 — FE Integration (Week 6)

**Exit criteria:** Open ~/chat-demo, type "show me 2bhk in bandra", see property carousel render, tap "Details", see property detail text response. Full round trip working locally.

| Ticket | Assignee | SP | Status |
|---|---|---|---|
| CHAT-D-001: Wire chat-demo → POST /api/v1/chat/send-message-streamed | @dev | 3 | ⬜ |
| CHAT-D-002: Wire GET /api/v1/chat/get-conversation-id | @dev | 1 | ⬜ |
| CHAT-D-003: Wire GET /api/v1/chat/get-conversation-details (history load) | @dev | 2 | ⬜ |
| CHAT-D-004: Validate property_carousel template render end-to-end | @dev | 3 | ⬜ |
| CHAT-D-005: Validate locality_carousel, floor_plan_carousel, nested_qna renders | @dev | 3 | ⬜ |
| CHAT-D-006: Validate login template render (auth-gated portfolio) | @dev | 2 | ⬜ |
| CHAT-D-007: Validate user_action submissions (contact_seller_confirmed, location_shared, nested_qna_selection) | @dev | 3 | ⬜ |
| CHAT-D-008: GraphQL bridge check — validate all tool API response shapes against housing.brahmand | @dev | 5 | ⬜ |
| CHAT-D-009: Error state handling (error SSE event, auth expired, rate_limited) | @dev | 2 | ⬜ |
| CHAT-P-034: Handoff context acceptance — validate HandoffContext at session init | @priya | 3 | ⬜ |
| CHAT-A-018: /api/v1/chat/migrate-chat endpoint | @arjun | 2 | ⬜ |
| CHAT-Q-006: E2E golden path #1: "show me 2bhk in bandra" → carousel → property detail | @rahul | 3 | ⬜ |
| CHAT-Q-007: E2E golden path #2: "compare Andheri and Bandra" → comparison (Sonnet) | @rahul | 3 | ⬜ |
| CHAT-Q-008: E2E golden path #3: out_of_scope classification → canned response | @rahul | 2 | ⬜ |
| CHAT-Q-009: E2E golden path #4: clarification flow → nested_qna → user selects → continues | @rahul | 3 | ⬜ |
| **Sprint 3 Total** | | **40 SP** | |

---

## Sprint 4 — Quality & Observability (Week 7)

**Exit criteria:** `make test` passes with ≥80% node coverage; LangSmith shows traces for every turn; 10 golden paths all green; no PII in logs.

| Ticket | Assignee | SP | Status |
|---|---|---|---|
| CHAT-Q-010: E2E golden path #5: explore_nearby (share_location flow) | @rahul | 3 | ⬜ |
| CHAT-Q-011: E2E golden path #6: portfolio/saved_properties (auth-gated) | @rahul | 2 | ⬜ |
| CHAT-Q-012: E2E golden path #7: calculator/calculate_emi (Tier 1 direct) | @rahul | 2 | ⬜ |
| CHAT-Q-013: E2E golden path #8: Hindi input — "doosri locality dikhao" ordinal | @rahul | 3 | ⬜ |
| CHAT-Q-014: E2E golden path #9: pivot flow (search → locality → search) | @rahul | 3 | ⬜ |
| CHAT-Q-015: E2E golden path #10: error recovery (SLM timeout → fallback) | @rahul | 3 | ⬜ |
| CHAT-Q-016: SLM model eval runner — domain_router cases.jsonl (100+ cases) | @rahul | 5 | ⬜ |
| CHAT-Q-017: SLM model eval runner — property_search classifier (150+ cases) | @rahul | 5 | ⬜ |
| CHAT-Q-018: Load test — 60 concurrent chat RPS sustained for 5min | @rahul | 3 | ⬜ |
| CHAT-A-019: LangSmith tracing integration (LANGCHAIN_TRACING_V2=true) | @arjun | 2 | ⬜ |
| CHAT-A-020: NodeMetrics emissions — cost, latency, cache_hit per node | @arjun | 3 | ⬜ |
| CHAT-A-021: PII scrubber — ensure user messages not logged in plaintext | @arjun | 3 | ⬜ |
| CHAT-A-022: Prompt cache warm-up on startup | @arjun | 2 | ⬜ |
| CHAT-A-023: /chat/cancel — proper in-flight stream cancellation | @arjun | 3 | ⬜ |
| CHAT-P-035: Conversation summarizer — async Haiku call when turns > 20 | @priya | 3 | ⬜ |
| CHAT-P-036: A/B experiment_node — ExperimentConfig hot-reload from experiments.yaml | @priya | 3 | ⬜ |
| CHAT-K-005: Structured log aggregation — docker compose log tailing with jq filters | @kiran | 2 | ⬜ |
| CHAT-N-001: Security plan document + threat model | @nisha | 5 | ⬜ |
| **Sprint 4 Total** | | **55 SP** | |

---

## Overall SP Summary

| Sprint | Total SP | Primary owners |
|---|---|---|
| Sprint 0 | 17 | @kiran (7) + @arjun (10) |
| Sprint 1 | 75 | @priya (46) + @arjun (15) + @rahul (8) + @dev (0) |
| Sprint 2 | 108 | @priya (57) + @arjun (27) + @rahul (15) + @dev (0) |
| Sprint 3 | 40 | @dev (24) + @priya (3) + @arjun (2) + @rahul (11) |
| Sprint 4 | 55 | @rahul (29) + @arjun (13) + @priya (6) + @kiran (2) + @nisha (5) |
| **Total** | **295** | |

---

## Risk Log

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Khoj/Odin/Casa API contracts differ from documented shapes | Medium | High | @dev checks housing.brahmand GraphQL schema on Sprint 3; @priya validates in Sprint 2 tool executor tests | @dev |
| Anthropic API rate limits hit during testing | Low | Medium | Use test fixtures for unit tests; real API only for integration tests | @rahul |
| LangGraph version incompatibility | Low | High | Pin exact version in requirements.txt; test on first node before full pipeline | @priya |
| Redis cluster complexity unnecessary locally | High | Low | Use single-node Redis locally with cluster flag off; production config separate | @kiran |
| Sprint 2 tool integration takes longer (API response mapping) | Medium | High | @priya does resolveEntity + searchProperties first (Sprint 2 first 3 days); validates end-to-end before adding more tools | @priya |
