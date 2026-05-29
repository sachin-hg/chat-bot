# Intent Registry

Single source of truth for all intents, their tiers, data requirements, and session carry-over rules. Generated into the SLM prompt taxonomy at startup.

---

## Part 1 — INTENT_REGISTRY

### Python Schema

```python
from pydantic import BaseModel
from typing import Literal, Optional

Tier = Literal[0, 1, 2, '3a', '3b']
ModelHint = Literal['haiku', 'sonnet'] | None
ParamSource = Literal['session', 'entity_resolution', 'filter_delta']

# Stage 1 domain routing output. Determines which domain-scoped taxonomy
# is loaded for Stage 2 classification.
DomainType = Literal[
    'property_search',   # browsing inventory, filter changes, search alerts
    'property_detail',   # specific property: gallery, floor plan, EMI, contact, similar
    'locality',          # locality research, trends, commute, comparison
    'project_research',  # new-launch projects and builders
    'portfolio',         # personal activity: saved, viewed, recent searches, recommendations
    'out_of_scope',      # chitchat, safety, gibberish — Stage 2 skipped
]

class DataRequirement(BaseModel):
    """Declares what the orchestrator must fetch BEFORE the LLM call.
    All items in the same parallel_group are fetched concurrently (asyncio.gather).
    Groups are ordered: group 1 runs first, group 2 runs after group 1 completes, etc.
    entity_index: for entity_resolution sources, which resolved entity to use (0 = first, 1 = second).
    """
    tool:           str
    params_source:  ParamSource
    entity_index:   Optional[int] = None   # entity_resolution only; None = first (index 0)
    parallel_group: int
    # Per-fetch timeout override. If omitted, TOOL_DEFAULT_TIMEOUTS[tool] is used.
    # Group-level: the group completes when all settled (return_exceptions=True), not all resolved.
    timeout_ms:     Optional[int] = None
    # Storage key in state['pre_fetched_data']. Defaults to tool name if omitted.
    # REQUIRED when the same tool appears more than once in data_requirements
    # (e.g., comparison intents calling getDemandSupplyInsight for two entities).
    # Without a unique key, the second result overwrites the first.
    # Convention: '<tool>:<entity_index>'  →  'getDemandSupplyInsight:0'
    fetch_key:      Optional[str] = None

class IntentRecord(BaseModel):
    # Identity
    main_intent: str
    sub_intent:  str

    # Routing
    tier:  Tier
    model: ModelHint          # None for tiers 0–2 (no LLM call)

    # What the orchestrator pre-fetches before the LLM turn.
    # fetch_data node executes these in parallel groups.
    # For Tier 0/1/2: empty [] (no LLM call) or the computation the orchestrator runs.
    data_requirements: list[DataRequirement]

    # Tools the LLM MAY call as a fallback if pre-fetched data is insufficient.
    # For most intents: [] — the LLM has NO tools and just formats pre-fetched data.
    # For a small set: one safety-net tool for same-turn follow-up questions.
    residual_tools: list[str]

    # Session state keys injected into the LLM system prompt for this intent.
    session_inject: list[str]

    # Filter keys to PRESERVE when pivoting TO this intent from another
    carry_over_keys: list[str]

    # Filter keys to CLEAR when pivoting TO this intent from another
    clear_keys: list[str]

    # Whether orchestrator should pre-resolve entities_mentioned before LLM call
    pre_resolve_entities: bool

    # Whether auth token must be present before routing here
    requires_auth: bool

    # Description used in taxonomy template injected into prompts
    description: str
```

### Full Registry Population

```python
INTENT_REGISTRY: list[IntentRecord] = [

  # ── property_search ──────────────────────────────────────────────────
  IntentRecord(
    main_intent='property_search',
    sub_intent='filter_search',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='searchProperties', params_source='session', parallel_group=1),
    ],
    residual_tools=[],   # LLM has no tools — it just formats pre-fetched results
    session_inject=['transaction_type', 'city', 'active_filters', 'srset_id'],
    carry_over_keys=['transaction_type', 'city', 'bhk', 'price_min', 'price_max',
                     'furnishing', 'construction_status'],
    clear_keys=['active_property_id', 'active_locality_id', 'active_project_id'],
    pre_resolve_entities=True,
    requires_auth=False,
    description='User is searching with explicit filters: location, BHK, price, amenities, builder, property type, or any combination.',
  ),
  IntentRecord(
    main_intent='property_search',
    sub_intent='explore_nearby',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='searchProperties', params_source='session', parallel_group=1),
      # DerivationMiddleware resolves search_anchor → lat/lng before this middleware runs
    ],
    residual_tools=[],
    session_inject=['transaction_type', 'city', 'active_filters'],
    carry_over_keys=['transaction_type', 'city', 'bhk', 'price_min', 'price_max'],
    clear_keys=['active_property_id', 'localities', 'active_locality_id'],
    pre_resolve_entities=True,    # resolve search_anchor entity
    requires_auth=False,
    description='User wants to search by proximity: either to their live location ("near me") or to a named POI anchor ("near Manyata Tech Park").',
  ),

  # ── property_detail ───────────────────────────────────────────────────
  IntentRecord(
    main_intent='property_detail',
    sub_intent='property_about',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='getPropertyDetail', params_source='session', parallel_group=1),
    ],
    # Single safety-net residual tool: user sometimes combines "tell me about the
    # property AND what's nearby" in one message. Everything else is handled in
    # subsequent turns via their own pre-fetch cycle.
    residual_tools=['getNearbyLandmarks'],
    session_inject=['active_property_id', 'transaction_type', 'city'],
    carry_over_keys=['active_property_id', 'transaction_type', 'city', 'srset_id'],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=False,
    description='User asks about price, area, amenities, possession date, builder info, or nearby facilities for the current property.',
  ),
  IntentRecord(
    main_intent='property_detail',
    sub_intent='floor_plan',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='getFloorPlans', params_source='session', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['active_property_id'],
    carry_over_keys=['active_property_id', 'transaction_type', 'city'],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=False,
    description='User wants to see floor plan images or room layout for the current property.',
  ),
  IntentRecord(
    main_intent='property_detail',
    sub_intent='brochure',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='getBrochure', params_source='entity_resolution', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['active_property_id', 'active_project_id'],
    carry_over_keys=['active_property_id', 'transaction_type', 'city'],
    clear_keys=[],
    pre_resolve_entities=True,    # "brochure for DLF Privana" resolves DLF Privana
    requires_auth=False,
    description='User wants to download or view the project brochure or detailed PDF.',
  ),
  IntentRecord(
    main_intent='property_detail',
    sub_intent='nearby_landmarks',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='getNearbyLandmarks', params_source='session', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['active_property_id', 'city'],
    carry_over_keys=['active_property_id', 'transaction_type', 'city'],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=False,
    description='User wants to see nearby POIs (metro, schools, hospitals) around the current property — not distance to a specific named place.',
  ),
  IntentRecord(
    main_intent='property_detail',
    sub_intent='calculate_emi',
    tier='3a',
    model='haiku',
    # Group 1: fetch property to get price. Group 2: compute EMI from price.
    # calculateEMI is orchestrator math (api_backend: 'internal') — no network hop.
    data_requirements=[
      DataRequirement(tool='getPropertyDetail', params_source='session', parallel_group=1),
      DataRequirement(tool='calculateEMI',      params_source='session', parallel_group=2),
    ],
    residual_tools=[],
    session_inject=['active_property_id', 'transaction_type'],
    carry_over_keys=['active_property_id', 'transaction_type', 'city'],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=False,
    description='User asks about EMI, home loan, or affordability in context of the currently selected property.',
  ),
  IntentRecord(
    main_intent='property_detail',
    sub_intent='similar_properties',
    tier='3a',
    model='haiku',
    data_requirements=[
      # similarity_by is populated from filter_delta.similarity_by by orchestrator before fetch
      DataRequirement(tool='getSimilarProperties', params_source='session', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['active_property_id', 'transaction_type', 'city', 'active_filters'],
    carry_over_keys=['active_property_id', 'transaction_type', 'city'],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=False,
    description='User wants alternatives similar to the currently selected property. filter_delta.similarity_by captures the similarity axis (price, locality, overall, owner_only).',
  ),
  IntentRecord(
    main_intent='property_detail',
    sub_intent='save_property',
    tier=1,
    model=None,
    data_requirements=[],  # Tier 1: orchestrator calls shortlistProperty directly
    residual_tools=[],
    session_inject=['active_property_id'],
    carry_over_keys=['active_property_id', 'transaction_type', 'city'],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=True,
    description='User wants to save or bookmark the current property to their shortlist.',
  ),
  IntentRecord(
    main_intent='property_detail',
    sub_intent='remove_saved',
    tier=1,
    model=None,
    data_requirements=[],
    residual_tools=[],
    session_inject=['active_property_id'],
    carry_over_keys=['active_property_id', 'transaction_type', 'city'],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=True,
    description='User wants to remove the current property from their saved/shortlist.',
  ),
  IntentRecord(
    main_intent='property_detail',
    sub_intent='contact_seller',
    tier=1,
    model=None,
    data_requirements=[],
    residual_tools=[],
    session_inject=['active_property_id'],
    carry_over_keys=['active_property_id', 'transaction_type', 'city'],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=True,
    description='User wants to express interest, schedule a visit, or request a callback. Single-property only. Bulk lead actions → out_of_scope.',
  ),

  # ── locality_research ────────────────────────────────────────────────
  IntentRecord(
    main_intent='locality_research',
    sub_intent='locality_overview',
    tier='3a',
    model='haiku',
    # Fetch overview + reviews in parallel — both enrich a locality_overview response
    data_requirements=[
      DataRequirement(tool='getLocalityDetail', params_source='entity_resolution', parallel_group=1),
      DataRequirement(tool='getRatingsReviews', params_source='entity_resolution', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['city', 'active_locality_id'],
    carry_over_keys=['transaction_type', 'city', 'active_locality_id'],
    clear_keys=['active_property_id', 'bhk', 'price_min', 'price_max'],
    pre_resolve_entities=True,
    requires_auth=False,
    description='User wants general info, livability opinion, or overview about a specific named locality.',
  ),
  IntentRecord(
    main_intent='locality_research',
    sub_intent='price_trends',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='getPriceTrends', params_source='entity_resolution', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['city', 'transaction_type', 'active_locality_id'],
    carry_over_keys=['transaction_type', 'city', 'active_locality_id'],
    clear_keys=['active_property_id', 'bhk', 'price_min', 'price_max'],
    pre_resolve_entities=True,
    requires_auth=False,
    description='User wants price direction, appreciation rate, or market movement data for a locality.',
  ),
  IntentRecord(
    main_intent='locality_research',
    sub_intent='transaction_data',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='getTransactionHistory', params_source='entity_resolution', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['city', 'transaction_type', 'active_locality_id'],
    carry_over_keys=['transaction_type', 'city', 'active_locality_id'],
    clear_keys=['active_property_id'],
    pre_resolve_entities=True,
    requires_auth=False,
    description='User wants recent registered deal data or transaction history for a locality or project.',
  ),
  IntentRecord(
    main_intent='locality_research',
    sub_intent='ratings_reviews',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='getRatingsReviews', params_source='entity_resolution', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['city', 'active_locality_id'],
    carry_over_keys=['transaction_type', 'city', 'active_locality_id'],
    clear_keys=['active_property_id'],
    pre_resolve_entities=True,
    requires_auth=False,
    description='User wants resident ratings or reviews for a locality, builder, or project.',
  ),
  IntentRecord(
    main_intent='locality_research',
    sub_intent='trending_localities',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='getTrendingLocalities', params_source='session', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['city', 'transaction_type'],
    carry_over_keys=['transaction_type', 'city'],
    clear_keys=['active_property_id', 'active_locality_id', 'bhk', 'price_min', 'price_max'],
    pre_resolve_entities=False,
    requires_auth=False,
    description='User asks for best/popular/trending areas in a city WITHOUT naming a specific locality.',
  ),

  # ── project_research ─────────────────────────────────────────────────
  IntentRecord(
    main_intent='project_research',
    sub_intent='project_overview',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='getProjectDetail',  params_source='entity_resolution', parallel_group=1),
      DataRequirement(tool='getRatingsReviews', params_source='entity_resolution', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['city', 'active_project_id'],
    carry_over_keys=['transaction_type', 'city', 'active_project_id'],
    clear_keys=['active_property_id', 'bhk', 'price_min', 'price_max'],
    pre_resolve_entities=True,
    requires_auth=False,
    description='User wants info or opinions about a specific named housing project.',
  ),
  IntentRecord(
    main_intent='project_research',
    sub_intent='ratings_reviews',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='getRatingsReviews', params_source='entity_resolution', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['city', 'active_project_id'],
    carry_over_keys=['transaction_type', 'city', 'active_project_id'],
    clear_keys=['active_property_id'],
    pre_resolve_entities=True,
    requires_auth=False,
    description='User wants ratings or reviews for a specific project or builder.',
  ),
  IntentRecord(
    main_intent='project_research',
    sub_intent='trending_projects',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='getTrendingProjects', params_source='session', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['city', 'transaction_type'],
    carry_over_keys=['transaction_type', 'city'],
    clear_keys=['active_property_id', 'active_project_id'],
    pre_resolve_entities=False,
    requires_auth=False,
    description='User asks for popular or in-demand new launches in a city (not naming a specific project).',
  ),

  # ── comparison ───────────────────────────────────────────────────────
  # Both entities are pre-resolved by resolve_entities node.
  # All 6 fetches run in parallel (same parallel_group=1) — ~150ms total.
  # Sonnet receives all data inline: no tool round trips during its turn.
  IntentRecord(
    main_intent='comparison',
    sub_intent='compare_localities',
    tier='3b',
    model='sonnet',
    data_requirements=[
      DataRequirement(tool='getLocalityDetail',  params_source='entity_resolution', entity_index=0, parallel_group=1, fetch_key='getLocalityDetail:0'),
      DataRequirement(tool='getLocalityDetail',  params_source='entity_resolution', entity_index=1, parallel_group=1, fetch_key='getLocalityDetail:1'),
      DataRequirement(tool='getPriceTrends',     params_source='entity_resolution', entity_index=0, parallel_group=1, fetch_key='getPriceTrends:0'),
      DataRequirement(tool='getPriceTrends',     params_source='entity_resolution', entity_index=1, parallel_group=1, fetch_key='getPriceTrends:1'),
      DataRequirement(tool='getRatingsReviews',  params_source='entity_resolution', entity_index=0, parallel_group=1, fetch_key='getRatingsReviews:0'),
      DataRequirement(tool='getRatingsReviews',  params_source='entity_resolution', entity_index=1, parallel_group=1, fetch_key='getRatingsReviews:1'),
    ],
    residual_tools=[],
    session_inject=['city', 'transaction_type'],
    carry_over_keys=['transaction_type', 'city'],
    clear_keys=['active_property_id', 'bhk', 'price_min', 'price_max'],
    pre_resolve_entities=True,
    requires_auth=False,
    description='User wants a side-by-side comparison of exactly two named localities.',
  ),
  IntentRecord(
    main_intent='comparison',
    sub_intent='compare_projects',
    tier='3b',
    model='sonnet',
    data_requirements=[
      DataRequirement(tool='getProjectDetail',      params_source='entity_resolution', entity_index=0, parallel_group=1, fetch_key='getProjectDetail:0'),
      DataRequirement(tool='getProjectDetail',      params_source='entity_resolution', entity_index=1, parallel_group=1, fetch_key='getProjectDetail:1'),
      DataRequirement(tool='getPriceTrends',        params_source='entity_resolution', entity_index=0, parallel_group=1, fetch_key='getPriceTrends:0'),
      DataRequirement(tool='getPriceTrends',        params_source='entity_resolution', entity_index=1, parallel_group=1, fetch_key='getPriceTrends:1'),
      DataRequirement(tool='getTransactionHistory', params_source='entity_resolution', entity_index=0, parallel_group=1, fetch_key='getTransactionHistory:0'),
      DataRequirement(tool='getTransactionHistory', params_source='entity_resolution', entity_index=1, parallel_group=1, fetch_key='getTransactionHistory:1'),
    ],
    residual_tools=[],
    session_inject=['city', 'transaction_type'],
    carry_over_keys=['transaction_type', 'city'],
    clear_keys=['active_property_id'],
    pre_resolve_entities=True,
    requires_auth=False,
    description='User wants a side-by-side comparison of exactly two named projects.',
  ),

  # ── portfolio ─────────────────────────────────────────────────────────
  IntentRecord(
    main_intent='portfolio',
    sub_intent='saved_properties',
    tier=2,
    model=None,
    # Tier 2: orchestrator fetches and formats directly (no LLM)
    data_requirements=[
      DataRequirement(tool='getSavedProperties', params_source='session', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=[],
    carry_over_keys=['transaction_type', 'city'],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=True,
    description='User wants to view their saved/shortlisted properties.',
  ),
  IntentRecord(
    main_intent='portfolio',
    sub_intent='viewed_properties',
    tier=2,
    model=None,
    data_requirements=[
      DataRequirement(tool='getViewedProperties', params_source='session', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=[],
    carry_over_keys=['transaction_type', 'city'],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=True,
    description='User wants to see properties they previously opened in this session.',
  ),
  IntentRecord(
    main_intent='portfolio',
    sub_intent='recent_searches',
    tier=2,
    model=None,
    data_requirements=[],   # served from session state directly (no API call)
    residual_tools=[],
    session_inject=['search_history'],
    carry_over_keys=[],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=True,
    description='User wants to review or resume their recent search queries.',
  ),
  IntentRecord(
    main_intent='portfolio',
    sub_intent='recommendations',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='getRecommendations', params_source='session', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['transaction_type', 'city', 'active_filters'],
    carry_over_keys=['transaction_type', 'city'],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=True,
    description='User explicitly requests personalized property suggestions based on their profile or history.',
  ),

  # ── calculator ───────────────────────────────────────────────────────
  # These intents are handled entirely by the orchestrator (Tier 1/2).
  # tier=1: all required inputs present → compute and respond directly.
  # tier=2: missing required inputs → orchestrator asks for them via nested_qna.
  # They NEVER reach the LLM (build_prompt_node / llm_node).
  # Tier B tools (calculateEMI, calculateAffordability, convertUnit) are separate —
  # they are injected into the LLM tool_definitions for non-calculator Tier 3 intents.
  IntentRecord(
    main_intent='calculator',
    sub_intent='calculate_emi',
    tier=2,
    model=None,
    data_requirements=[
      DataRequirement(tool='calculateEMI', params_source='session', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=[],
    carry_over_keys=['transaction_type', 'city'],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=False,
    description='Standalone EMI computation from a price the user states explicitly. Not tied to a property in context.',
  ),
  IntentRecord(
    main_intent='calculator',
    sub_intent='calculate_affordability',
    tier=2,
    model=None,
    data_requirements=[
      DataRequirement(tool='calculateAffordability', params_source='session', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=[],
    carry_over_keys=['transaction_type', 'city'],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=False,
    description='User provides their salary and wants to know their property budget or affordability check.',
  ),
  IntentRecord(
    main_intent='calculator',
    sub_intent='convert_unit',
    tier=1,
    model=None,
    data_requirements=[
      DataRequirement(tool='convertUnit', params_source='session', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=[],
    carry_over_keys=[],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=False,
    description='User wants to convert between area units (sqft, sqyard, acre, bigha, hectare).',
  ),

  # ── multi_intent ─────────────────────────────────────────────────────
  # data_requirements populated dynamically at runtime from decomposed sub-intents.
  # If sub-intents are independent (no synthesis needed), each runs its own parallel
  # Haiku pipeline and results are merged. If synthesis is needed, Sonnet receives
  # all pre-fetched data inline.
  IntentRecord(
    main_intent='multi_intent',
    sub_intent='decompose',
    tier='3b',
    model='sonnet',
    data_requirements=[],   # populated dynamically from classification['intents']
    residual_tools=[],
    session_inject=[],      # populated dynamically
    carry_over_keys=['transaction_type', 'city'],
    clear_keys=[],
    pre_resolve_entities=True,
    requires_auth=False,
    description='Message contains two or more independently actionable intents mapping to different sub_intents. Sonnet synthesizes if needed; otherwise parallel Haiku pipelines merge results.',
  ),

  # ── locality_research (market & commute extensions) ──────────────────
  IntentRecord(
    main_intent='locality_research',
    sub_intent='market_insight',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='getDemandSupplyInsight', params_source='entity_resolution', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['active_locality_id', 'transaction_type', 'city'],
    carry_over_keys=['active_locality_id', 'transaction_type', 'city'],
    clear_keys=[],
    pre_resolve_entities=True,
    requires_auth=False,
    description="User asks about market demand, supply levels, buyer/seller balance, or whether it is a good time to buy/rent in a locality. \"Is this a buyer's market?\", \"How much demand is there in Bandra?\"",
  ),
  IntentRecord(
    main_intent='locality_research',
    sub_intent='commute_time',
    tier='3a',
    model='haiku',
    data_requirements=[
      # group 1: fetch property detail to get origin coordinates (if not already in session)
      DataRequirement(tool='getPropertyDetail', params_source='session', parallel_group=1),
      # group 2: after coordinates are in context, call travel time API with resolved destinations
      # Destinations come from entities_mentioned resolved by resolve_entities node
      DataRequirement(tool='getTravelTime', params_source='entity_resolution', parallel_group=2),
    ],
    residual_tools=[],
    session_inject=['active_property_id', 'active_property_coordinates', 'city'],
    carry_over_keys=['active_property_id', 'transaction_type', 'city'],
    clear_keys=[],
    pre_resolve_entities=True,    # resolves destination names to coordinates before fetch_data
    requires_auth=False,
    description='User asks commute time or distance from the active property to a named destination: office campus, airport, school, landmark. e.g. "how far is this from BKC?", "commute time to Whitefield?"',
  ),
  IntentRecord(
    main_intent='locality_research',
    sub_intent='price_fairness',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='getPriceBuckets', params_source='session', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['active_locality_id', 'transaction_type', 'city', 'active_filters'],
    carry_over_keys=['active_locality_id', 'transaction_type', 'city', 'bhk', 'price_min', 'price_max'],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=False,
    description='User wants to know if a price is fair relative to the market: "Is 80L reasonable for a 2BHK in Andheri?", "What do most 3BHKs cost here?"',
  ),
  IntentRecord(
    main_intent='locality_research',
    sub_intent='filter_suggestions',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='getFilterSuggestions', params_source='entity_resolution', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['active_locality_id', 'transaction_type', 'city'],
    carry_over_keys=['active_locality_id', 'transaction_type', 'city'],
    clear_keys=[],
    pre_resolve_entities=True,
    requires_auth=False,
    description="User asks what is popular in an area or wants help deciding on filters: \"What do most people search for in Koramangala?\", \"What's a common budget for rent here?\"",
  ),
  IntentRecord(
    main_intent='locality_research',
    sub_intent='top_societies',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='getTopSocieties', params_source='entity_resolution', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['active_locality_id', 'city'],
    carry_over_keys=['active_locality_id', 'transaction_type', 'city'],
    clear_keys=[],
    pre_resolve_entities=True,
    requires_auth=False,
    description='User asks about residential complexes, gated communities, or top buildings in an area: "What are the best societies in Powai?", "Top residential complexes near BKC?"',
  ),
  IntentRecord(
    main_intent='locality_research',
    sub_intent='city_orientation',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='getPopularCityLandmarks', params_source='session', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['city', 'transaction_type'],
    carry_over_keys=['city', 'transaction_type'],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=False,
    description="User is new to a city and wants to understand key areas, hubs, and landmarks: \"I'm moving to Bangalore — what are the key areas?\", \"What are the major landmarks in Hyderabad?\"",
  ),
  IntentRecord(
    main_intent='locality_research',
    sub_intent='locality_comparison',
    tier='3b',
    model='sonnet',       # markdown generation + multi-source synthesis; always Sonnet
    data_requirements=[
      # All 6 calls are parallel — both localities fetched simultaneously.
      # fetch_key prevents state['pre_fetched_data'] key collision for same-tool dual calls.
      DataRequirement(tool='getDemandSupplyInsight', params_source='entity_resolution', entity_index=0, parallel_group=1, fetch_key='getDemandSupplyInsight:0'),
      DataRequirement(tool='getDemandSupplyInsight', params_source='entity_resolution', entity_index=1, parallel_group=1, fetch_key='getDemandSupplyInsight:1'),
      DataRequirement(tool='getPriceTrends',         params_source='entity_resolution', entity_index=0, parallel_group=1, fetch_key='getPriceTrends:0'),
      DataRequirement(tool='getPriceTrends',         params_source='entity_resolution', entity_index=1, parallel_group=1, fetch_key='getPriceTrends:1'),
      DataRequirement(tool='getRatingsReviews',      params_source='entity_resolution', entity_index=0, parallel_group=1, fetch_key='getRatingsReviews:0'),
      DataRequirement(tool='getRatingsReviews',      params_source='entity_resolution', entity_index=1, parallel_group=1, fetch_key='getRatingsReviews:1'),
    ],
    residual_tools=[],
    session_inject=['transaction_type', 'city', 'active_filters'],
    carry_over_keys=['transaction_type', 'city', 'active_locality_id'],
    clear_keys=[],
    pre_resolve_entities=True,  # both locality names must be resolved before data fetch
    requires_auth=False,
    description="User wants to compare two localities: \"What's the difference between Sector 50 and Sector 62 in Gurgaon?\", \"Should I look in Andheri or Bandra?\". Requires exactly 2 locality entities_mentioned. LLM generates structured markdown with pros/cons, price trends, demand signals, and ratings for each.",
  ),

  # ── property_search (discovery via collections) ───────────────────────
  IntentRecord(
    main_intent='property_search',
    sub_intent='discovery_collections',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='getCollections', params_source='session', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['city', 'transaction_type'],
    carry_over_keys=['city', 'transaction_type'],
    clear_keys=['active_property_id', 'active_locality_id'],
    pre_resolve_entities=False,
    requires_auth=False,
    description='User expresses a lifestyle preference that maps to a curated collection rather than raw filters: "Show me ready-to-move properties", "Family-friendly flats", "New launches in Mumbai".',
  ),

  # ── portfolio (cross-session history + alerts) ────────────────────────
  IntentRecord(
    main_intent='portfolio',
    sub_intent='recently_viewed_cross_session',
    tier=2,
    model=None,
    data_requirements=[
      DataRequirement(tool='getRecentlyViewed', params_source='session', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=[],
    carry_over_keys=['transaction_type', 'city'],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=False,   # uses ga_id cookie, not login
    description='User asks to see properties they recently viewed across sessions (not just current session). "Show me what I was looking at yesterday", "Properties I viewed last week".',
  ),
  IntentRecord(
    main_intent='property_search',
    sub_intent='save_alert',
    tier=1,
    model=None,
    # Tier 1: orchestrator handles directly — confirms intent, then calls createSearchAlert.
    # No LLM turn needed; orchestrator emits confirmation card then executes.
    data_requirements=[],
    residual_tools=[],
    session_inject=[],
    carry_over_keys=['transaction_type', 'city', 'bhk', 'price_min', 'price_max'],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=True,
    description='User wants to save current search and receive email alerts for new matching properties: "Alert me when new 3BHKs appear in Powai under 1Cr", "Save this search".',
  ),

  # ── project_research (project-level price trends) ────────────────────
  # Uses getProjectPriceTrends (project-level data), distinct from locality_research/price_trends
  # which uses getPriceTrends (locality aggregate). SLM routes to this intent when
  # active_project_id is set; locality_research/price_trends when a locality is the subject.
  IntentRecord(
    main_intent='project_research',
    sub_intent='project_price_trends',
    tier='3a',
    model='haiku',
    data_requirements=[
      DataRequirement(tool='getProjectPriceTrends', params_source='entity_resolution', parallel_group=1),
    ],
    residual_tools=[],
    session_inject=['active_project_id', 'city', 'transaction_type'],
    carry_over_keys=['active_project_id', 'city', 'transaction_type'],
    clear_keys=[],
    pre_resolve_entities=True,
    requires_auth=False,
    description='User asks about price appreciation or investment trajectory for a specific named new-launch project (not the wider locality). "Has Lodha Palava appreciated?", "Price trend for Prestige Shantiniketan".',
  ),

  # ── out_of_scope ──────────────────────────────────────────────────────
  IntentRecord(
    main_intent='out_of_scope',
    sub_intent='out_of_scope_query',
    tier=0,
    model=None,
    data_requirements=[],
    residual_tools=[],
    session_inject=[],
    carry_over_keys=[],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=False,
    description='Social pleasantries, topics unrelated to real estate, prompt injection attempts, bulk unsupported actions.',
  ),
  IntentRecord(
    main_intent='out_of_scope',
    sub_intent='insufficient_info',
    tier=0,
    model=None,
    data_requirements=[],
    residual_tools=[],
    session_inject=[],
    carry_over_keys=[],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=False,
    description='Single characters, emoji-only input, gibberish, or too vague to classify even with history.',
  ),
  IntentRecord(
    main_intent='out_of_scope',
    sub_intent='social_pleasantry',
    tier=0,
    model=None,
    data_requirements=[],
    residual_tools=[],
    session_inject=[],
    carry_over_keys=[],
    clear_keys=[],
    pre_resolve_entities=False,
    requires_auth=False,
    description='Hi, thanks, bye, and other social greetings. Handled locally with a canned response — never passed to the gateway as out_of_scope.',
  ),
]
```

### Derived Functions (replace all hardcoded maps)

```python
# Everything that was scattered across 8 places now derives from one source:

def get_intent_record(main: str, sub: str) -> IntentRecord | None:
    return next((r for r in INTENT_REGISTRY if r.main_intent == main and r.sub_intent == sub), None)

def get_data_requirements(main: str, sub: str) -> list[DataRequirement]:
    rec = get_intent_record(main, sub)
    return rec.data_requirements if rec else []

def get_residual_tools(main: str, sub: str) -> list[str]:
    rec = get_intent_record(main, sub)
    return rec.residual_tools if rec else []

# Kept for backward compat — now delegates to residual_tools:
def get_tools_for_intent(main: str, sub: str) -> list[str]:
    return get_residual_tools(main, sub)

def get_tier_for_intent(main: str, sub: str) -> Tier:
    rec = get_intent_record(main, sub)
    return rec.tier if rec else '3b'

def get_model_for_intent(main: str, sub: str) -> ModelHint:
    rec = get_intent_record(main, sub)
    return rec.model if rec else 'sonnet'

def get_carry_over_keys(main: str, sub: str) -> list[str]:
    rec = get_intent_record(main, sub)
    return rec.carry_over_keys if rec else []

def get_clear_keys(main: str, sub: str) -> list[str]:
    rec = get_intent_record(main, sub)
    return rec.clear_keys if rec else []

def requires_pre_resolution(main: str, sub: str) -> bool:
    rec = get_intent_record(main, sub)
    return rec.pre_resolve_entities if rec else False

def requires_auth(main: str, sub: str) -> bool:
    rec = get_intent_record(main, sub)
    return rec.requires_auth if rec else False

# Used by PromptComposer to generate the intent taxonomy block for the SLM prompt.
# Groups sub_intents under their main_intent — the SLM needs the hierarchical
# structure to understand the taxonomy and produce valid main_intent + sub_intent pairs.
def build_intent_taxonomy_block() -> str:
    groups: dict[str, list[IntentRecord]] = {}
    for r in INTENT_REGISTRY:
        if r.main_intent == 'out_of_scope':
            continue  # out_of_scope is in SLM rules, not taxonomy
        groups.setdefault(r.main_intent, []).append(r)
    sections = []
    for main, records in groups.items():
        subs = '\n\n'.join(
            f'  sub_intent: {r.sub_intent}\n    {r.description}'
            for r in records
        )
        sections.append(f'main_intent: {main}\n{subs}')
    return '\n\n──────────────────────────────────────────\n\n'.join(sections)
```

---

