# Tool Registry

Schema, wire format, cache TTL, and error contract for every API tool the orchestrator can call.

---

## Part 2 — TOOL_REGISTRY

The following diagram shows the fields of a `ToolRecord` and how each one drives a stage of the pipeline.

```mermaid
graph LR
    subgraph tr["ToolRecord"]
        TN[name\ntool identifier]
        IP[input_params\nToolParam[]\nrequired, type, enum]
        RS[return_schema_summary\nwhat fields LLM reads]
        EC[error_contract\n404 / 503 / empty shapes]
        AB[api_backend\nkhoj | casa | odin | venus | internal]
        TTL[cache_ttl_seconds\n0 = live, 60–86400 = cached]
        WS[write_side\nrequires confirmation card]
        LV[llm_visible\nTrue = injected into tool_definitions]
    end

    IP -->|drives| BUILD[build_tool_definitions_block\nJSON schema for LLM]
    EC -->|drives| ERR[fetch_data_node\nerror stub injection]
    AB -->|drives| EXEC[CachedExecutorPort\nwhich HTTP client]
    TTL -->|drives| CACHE[Redis cache key\nTTL strategy]
    WS -->|drives| CONFIRM[execute_tier1_action\nconfirmation card gate]
```

### Python Schema

```python
from pydantic import BaseModel
from typing import Literal, Optional

ApiBackend = Literal[
    'khoj',          # property search + price buckets
    'casa',          # property detail (resale/rent), demand-supply, shortlist, contact
    'venus',         # new-project detail, floor plans, brochure
    'gandalf',       # price trends, transaction history
    'odin',          # locality detail, nearby landmarks, ratings, top societies, trending
    'autosuggest',   # entity resolution
    'internal',      # in-process computation (calculators, session reads)
    'data',          # Housing data platform (filter suggestions, collections, recently viewed)
    'seo',           # SEO content service (top societies URLs)
    'regions',       # travel time / distance matrix
    'subscriptions', # search alert subscriptions
]

class ToolParam(BaseModel):
    key: str
    type: Literal['string', 'integer', 'number', 'boolean', 'array', 'object']
    required: bool
    description: str
    enum: Optional[list[str]] = None
    items: Optional[dict] = None          # e.g. {'type': 'string', 'enum': [...]}
    wire_param: Optional[str] = None      # orchestrator-only: actual API param name when it differs from key. Never exposed in LLM tool definitions or prompts.
    wire_transform: Optional[str] = None  # orchestrator-only: transformation expression, e.g. "BHK_TO_APT_TYPE[value]"

class ResponseTruncation(BaseModel):
    max_items: Optional[int] = None
    drop_fields: Optional[list[str]] = None  # strip before injecting result into LLM context

class ToolRecord(BaseModel):
    name: str
    description: str            # human-readable; also used in LLM tool definition if llm_visible
    input_params: list[ToolParam]
    return_schema_summary: str
    api_backend: str            # ApiBackend value (str to allow compound strings like 'casa|venus|jasprr')
    cache_ttl_seconds: int      # 0 = no cache
    response_truncation: ResponseTruncation
    requires_auth: bool
    write_side: bool            # True = needs explicit user confirmation before call

    # Whether this tool can appear in the LLM's tool list (as a residual_tool).
    # False = orchestrator-only; the LLM never sees it in the system prompt.
    # Only tools listed in at least one IntentRecord.residual_tools should be True.
    llm_visible: bool

    # Tier B: always-available computation tools injected into every Tier 3 LLM prompt
    # EXCEPT for calculator/* intents (where the result is already pre-fetched inline).
    # Only valid when llm_visible=True. Must be pure computation (api_backend='internal') —
    # never external API calls, since the LLM calls these mid-response with no latency budget.
    tier_b: Optional[bool] = None

    error_contract: str = ''
    # Documents how this tool surfaces errors to the LLM context.
    # Format: "404: {error: 'not_found', message: '...'} | 503: {error: 'unavailable'} | empty: {hits: [], total_count: 0}"
```

### Full Registry Population

```python
TOOL_REGISTRY: list[ToolRecord] = [

  # ── Search & Discovery ──────────────────────────────────────────────
  # ── llm_visible: False — orchestrator-only tools ─────────────────────
  # These tools are called by DataFetchMiddleware or RoutingMiddleware directly.
  # They are NEVER injected into the LLM's system prompt as callable tools.
  ToolRecord(
    name='searchProperties',
    description='Search for properties using filter criteria. Returns a paginated result set.',
    input_params=[
      ToolParam(
        key='filters',
        type='object',
        required=True,
        description='Search filter object. All keys from FILTER_REGISTRY applied by orchestrator.',
      ),
      # Extended filter params (all orchestrator-injected from session / SLM filter_delta):
      ToolParam(key='sort_key',                 type='string',  required=False, description='Sort order override. Maps to sort_key in Khoj.', enum=['relevance', 'price_asc', 'price_desc', 'newest', 'area_desc']),
      ToolParam(key='days_filter',              type='integer', required=False, description='Listings added within last N days. Maps to days_filter in Khoj.'),
      ToolParam(key='media_filter',             type='string',  required=False, description='Show only listings with that media type. Maps to media_filter in Khoj.', enum=['has_photos', 'has_video', 'has_virtual_tour', 'verified_only']),
      ToolParam(key='owner_only',               type='boolean', required=False, description='If true, filters to owner/direct listings only. Maps to contact_person_id=2 in Khoj.'),
      ToolParam(key='family_friendly',          type='boolean', required=False, description='Family-friendly properties only. Maps to family_friendly_properties=true + lease_type_ids=1 in Khoj.'),
      ToolParam(key='possession_status',        type='string',  required=False, description='Orchestrator expands to Khoj wire params.', enum=['ready_to_move', 'under_construction', 'new_launch']),
      ToolParam(key='availability_within_days', type='integer', required=False, description='Rent only: available within N days. Maps to custom_available_in=1, max_available_in=N in Khoj.'),
    ],
    return_schema_summary='{ search_result_set_id, total_count, cursor, is_last_page, hits: PropertyCard[], algo_type, project_flat_config_count }',
    api_backend='khoj',
    # Bot-specific: Khoj has a dedicated /bot/filter endpoint that accepts reduce_data_size=true
    # for lighter payloads. DataFetchMiddleware sets for_bot=True in backEndFilters.
    cache_ttl_seconds=30,
    response_truncation=ResponseTruncation(
      max_items=10,
      drop_fields=['image_urls', 'builder_description', 'full_address'],
    ),
    requires_auth=False,
    write_side=False,
    llm_visible=False,
    error_contract = (
        "No results: { hits: [], total_count: 0, is_last_page: true } — not an error. "
        "Backend 503/timeout: fetch_errors['searchProperties'] = reason_string — "
        "LLM receives { error: 'unavailable' } stub. "
        "Distinguish from empty results which is a valid response."
    ),
  ),
  ToolRecord(
    name='resolveEntity',
    description='Resolve a raw entity name to a structured ID via autosuggest.',
    input_params=[
      ToolParam(key='query',       type='string', required=True,  description='Raw name as typed by the user'),
      ToolParam(key='entity_type', type='string', required=True,  description='One of: locality, project, landmark, city, building, developer', enum=['locality','project','landmark','city','building','developer']),
      ToolParam(key='city',        type='string', required=False, description='Limit candidates to this city'),
      ToolParam(key='service',     type='string', required=False, description='rent or buy', enum=['rent','buy']),
    ],
    # filter_key: the Khoj query param this entity maps to — drives how orchestrator injects
    # the resolved ID into searchProperties filters.
    # locality → poly, landmark → est, developer → uuid, project → region_entity_id, building → bldng
    return_schema_summary='{ resolved: bool, candidates: list[EntityCandidate], needs_disambiguation: bool }',
    # EntityCandidate shape: { uuid, id, display_name, type, city_name, city_uuid, filter_key, coordinates: [lat,lng] | None, score }
    # coordinates is populated for landmarks/establishments — required for getTravelTime origin/destination resolution.
    api_backend='autosuggest',
    cache_ttl_seconds=3600,
    response_truncation=ResponseTruncation(max_items=3),
    requires_auth=False,
    write_side=False,
    llm_visible=False,   # orchestrator-only: EntityResolutionMiddleware calls this
  ),

  # ── Property Detail ─────────────────────────────────────────────────
  ToolRecord(
    name='getPropertyDetail',
    description='Fetch full details for a specific property ID. Orchestrator routes to the correct backend service based on property_type.',
    input_params=[
      # property_type and transaction_type are NOT LLM parameters — orchestrator injects
      # them from session state. The LLM never passes routing parameters to this tool.
      ToolParam(key='property_id', type='string', required=True, description='From searchProperties hits or active_property_id in session'),
    ],
    return_schema_summary='{ property_id, title, price, area_sqft, bhk, amenities[], builder, possession_date, rera_id, coordinates: {lat,lng}, polygon_uuid, ... }',
    # Routing table — orchestrator resolves from session.active_property_kind:
    #   project      → Venus  /api/v9/new-projects/{id}/webapp
    #   resale       → Casa   /api/v2/flat/{id}/resale/details
    #   rent         → Casa   /api/v2/flat/{id}/rent/details
    #   paying_guest → Casa   /api/v1/flat/{id}/rent/details
    #   commercial   → Jasprr /api/v0/commercial/{id}
    #   flatmate     → Jasprr /api/v0/residential/flatmates/{id}/details
    # Response always includes coordinates (lat/lng) and polygon_uuid — needed for getTravelTime
    # and getDemandSupplyInsight respectively.
    api_backend='casa|venus|jasprr',
    cache_ttl_seconds=300,
    response_truncation=ResponseTruncation(
      drop_fields=['raw_description', 'image_urls', 'similar_properties'],
    ),
    requires_auth=False,
    write_side=False,
    llm_visible=False,
    error_contract = (
        "Property not found (404): { error: 'not_found', property_id: '...' } — "
        "LLM responds: 'That property may no longer be listed.' "
        "Service down (503): fetch_errors stub. "
        "Never return null — always an object with error key or full data."
    ),
  ),
  ToolRecord(
    name='getFloorPlans',
    description='Get floor plan image URLs and room layout data for a property or project.',
    input_params=[
      ToolParam(key='property_id', type='string', required=True, description='Property or project ID'),
    ],
    return_schema_summary='{ floor_plans: [{ type, sqft, image_url, rooms }] }',
    api_backend='venus',
    cache_ttl_seconds=3600,
    response_truncation=ResponseTruncation(max_items=5),
    requires_auth=False,
    write_side=False,
    llm_visible=False,   # orchestrator pre-fetches; LLM formats inline
  ),
  ToolRecord(
    name='getBrochure',
    description='Get the brochure download URL for a project.',
    input_params=[
      ToolParam(key='project_id', type='string', required=True, description='Project ID — resolved by pre-resolution from entities_mentioned'),
    ],
    return_schema_summary='{ brochure_url, file_size_mb, project_name }',
    api_backend='venus',
    cache_ttl_seconds=3600,
    response_truncation=ResponseTruncation(),
    requires_auth=False,
    write_side=False,
    llm_visible=False,   # orchestrator pre-fetches; LLM formats inline
  ),
  ToolRecord(
    name='getNearbyLandmarks',
    description='Get nearby points of interest (metro, schools, hospitals, parks) around the current property.',
    input_params=[
      ToolParam(key='categories',    type='array',   required=False, description='Filter by landmark category', items={'type': 'string', 'enum': ['metro','school','hospital','mall','park','restaurant']}),
      ToolParam(key='radius_meters', type='integer', required=False, description='Search radius in metres, default 1000'),
      # locality_id and coordinates are injected by orchestrator from active_property_id context.
      # LLM only controls category filter and radius.
    ],
    return_schema_summary='{ landmarks: [{ name, category, distance_metres, walk_minutes }] }',
    api_backend='odin',
    cache_ttl_seconds=86400,
    response_truncation=ResponseTruncation(max_items=10),
    requires_auth=False,
    write_side=False,
    # llm_visible=True — only LLM-visible RESIDUAL tool; appears as residual in property_about.
    # Tier B tools (calculateEMI, calculateAffordability, convertUnit) are also llm_visible=True
    # but those are injected via the Tier B mechanism, not as residual tools.
    # LLM calls this when user asks "what's nearby?" in the same turn as a property question.
    llm_visible=True,
  ),
  ToolRecord(
    name='getSimilarProperties',
    description='Get properties similar to the active property. Variant controls the similarity axis.',
    input_params=[
      # property_id, transaction_type, property_type injected by orchestrator from session.
      # variant injected from filter_delta.similarity_variant (set by SLM classification).
      ToolParam(key='variant', type='string', required=False,
                description=(
                    'Similarity dimension. SLM outputs similarity_by in filter_delta; '
                    'wire_transform maps to Khoj values: '
                    'price→better_priced, locality→default, overall→default, owner_only→top_new_projects. '
                    'INJECTED by orchestrator via wire_transform — not LLM-authored.'
                ),
                enum=['default', 'better_priced', 'compare_properties', 'top_new_projects']),
    ],
    return_schema_summary='{ variant, total_count, hits: list[PropertyCard] }',
    api_backend='khoj',
    cache_ttl_seconds=60,
    response_truncation=ResponseTruncation(max_items=5),
    requires_auth=False,
    write_side=False,
    llm_visible=False,
  ),

  # ── Locality & Project Research ──────────────────────────────────────
  ToolRecord(
    name='getLocalityDetail',
    description='Get overview, livability score, and key attributes for a named locality.',
    input_params=[
      ToolParam(key='locality_id', type='string', required=True,
                description='UUID from entity_resolution or session.active_locality_id. '
                            'INJECTED by orchestrator — not LLM-authored.'),
      ToolParam(key='service', type='string', required=False,
                description='buy | rent. Injected from session.transaction_type.'),
    ],
    return_schema_summary='{ locality_id, name, city, livability_score, connectivity, schools, hospitals, price_psf, ... }',
    api_backend='odin',
    cache_ttl_seconds=3600,
    response_truncation=ResponseTruncation(drop_fields=['raw_description']),
    requires_auth=False,
    write_side=False,
    llm_visible=False,
  ),
  ToolRecord(
    name='getPriceTrends',
    description='Get price appreciation trend data for a locality or project.',
    input_params=[
      # locality/project and city injected from entity_resolution.
      # transaction_type injected from session. duration_years defaults to 3.
      ToolParam(key='duration_years', type='integer', required=False, description='History window in years (1–5), default 3', wire_param='durationYears'),
    ],
    return_schema_summary='{ data_points: [{ date, price_psf }], appreciation_pct, trend_direction }',
    api_backend='gandalf',
    cache_ttl_seconds=3600,
    response_truncation=ResponseTruncation(drop_fields=[]),
    requires_auth=False,
    write_side=False,
    llm_visible=False,
  ),
  ToolRecord(
    name='getTransactionHistory',
    description='Get recent registered deal/transaction data for a locality or project.',
    input_params=[
      # locality_id/project_id and city injected from entity_resolution.
      ToolParam(key='limit', type='integer', required=False, description='Max transactions to return, default 10'),
    ],
    return_schema_summary='{ transactions: [{ date, price, area_sqft, bhk, floor, buyer, seller_type }] }',
    api_backend='gandalf',
    cache_ttl_seconds=1800,
    response_truncation=ResponseTruncation(max_items=10),
    requires_auth=False,
    write_side=False,
    llm_visible=False,
  ),
  ToolRecord(
    name='getRatingsReviews',
    description='Get ratings and reviews for a locality, project, or builder.',
    input_params=[
      # entity_type and entity_id injected from entity_resolution / session.
      ToolParam(key='limit', type='integer', required=False, description='Max reviews, default 5'),
    ],
    return_schema_summary='{ overall_rating, total_reviews, reviews: [{ rating, text, pros, cons, date }] }',
    api_backend='odin',
    cache_ttl_seconds=3600,
    response_truncation=ResponseTruncation(max_items=5, drop_fields=['reviewer_profile']),
    requires_auth=False,
    write_side=False,
    llm_visible=False,
  ),
  ToolRecord(
    name='getTrendingLocalities',
    # budget_range removed: market trend data is independent of user budget.
    # Post-fetch filtering by budget (if needed) is done by orchestrator, not API.
    description='Get top trending/popular localities in a city based on demand signals.',
    input_params=[
      # city and transaction_type injected from session.
      ToolParam(key='ranked_by', type='string',  required=False, description='Ranking signal', enum=['search_volume','price_appreciation','new_supply','overall']),
      ToolParam(key='limit',     type='integer', required=False, description='Max localities to return, default 8'),
    ],
    return_schema_summary='{ localities: [{ name, locality_id, demand_score, price_psf, yoy_change_pct }] }',
    api_backend='odin',
    cache_ttl_seconds=3600,
    response_truncation=ResponseTruncation(max_items=8),
    requires_auth=False,
    write_side=False,
    llm_visible=False,
  ),
  ToolRecord(
    name='getTrendingProjects',
    description='Get top trending new-launch projects in a city.',
    input_params=[
      # city and transaction_type injected from session.
      ToolParam(key='limit', type='integer', required=False, description='Max projects, default 6'),
    ],
    return_schema_summary='{ projects: [{ project_id, name, builder, locality, price_min, price_max, launch_date }] }',
    api_backend='odin',
    cache_ttl_seconds=1800,
    response_truncation=ResponseTruncation(max_items=6),
    requires_auth=False,
    write_side=False,
    llm_visible=False,
  ),
  ToolRecord(
    name='getProjectDetail',
    description='Get detailed information about a specific housing project.',
    input_params=[
      ToolParam(key='project_id', type='string', required=True,
                description='UUID from entity_resolution or session.active_project_id. '
                            'INJECTED by orchestrator — not LLM-authored.'),
    ],
    return_schema_summary='{ project_id, name, builder, locality, city, bhk_range, price_range, amenities[], rera_id, completion_date, total_units }',
    api_backend='venus',
    cache_ttl_seconds=3600,
    response_truncation=ResponseTruncation(drop_fields=['raw_description', 'image_urls']),
    requires_auth=False,
    write_side=False,
    llm_visible=False,
  ),

  # ── Calculators ─────────────────────────────────────────────────────
  ToolRecord(
    name='calculateEMI',
    description='Calculate monthly EMI for a home loan.',
    input_params=[
      ToolParam(key='property_price',       type='number',  required=True,  description='Property price in INR (only required param)'),
      ToolParam(key='down_payment_pct',     type='number',  required=False, description='Down payment percentage, default 20'),
      ToolParam(key='loan_tenure_years',    type='integer', required=False, description='Loan tenure in years, default 20'),
      ToolParam(key='interest_rate_annual', type='number',  required=False, description='Annual interest rate %, default 8.5'),
    ],
    return_schema_summary='{ monthly_emi, loan_amount, total_interest, total_payment, tenure_years, rate_pct }',
    api_backend='internal',
    cache_ttl_seconds=0,
    response_truncation=ResponseTruncation(),
    requires_auth=False,
    write_side=False,
    llm_visible=True,    # Tier B: also injectable as LLM-callable tool in non-calculator intents
    tier_b=True,         # LLM calls this when EMI question appears mid-session in any intent
  ),
  ToolRecord(
    name='calculateAffordability',
    description='Estimate property budget from monthly or annual salary.',
    input_params=[
      ToolParam(key='monthly_salary',   type='number', required=False, description='Monthly salary in INR'),
      ToolParam(key='annual_salary',    type='number', required=False, description='Annual salary in INR — use if monthly not provided'),
      ToolParam(key='existing_emi',     type='number', required=False, description='Existing monthly EMI obligations, default 0'),
      ToolParam(key='down_payment_pct', type='number', required=False, description='Down payment %, default 20'),
    ],
    return_schema_summary='{ affordable_property_price, max_loan, monthly_emi_at_max, foir_pct }',
    api_backend='internal',
    cache_ttl_seconds=0,
    response_truncation=ResponseTruncation(),
    requires_auth=False,
    write_side=False,
    llm_visible=True,    # Tier B
    tier_b=True,
  ),
  ToolRecord(
    name='convertUnit',
    description='Convert area between Indian real estate units.',
    input_params=[
      ToolParam(key='value', type='number', required=True,  description='Numeric quantity to convert'),
      ToolParam(key='from',  type='string', required=True,  description='Source unit', enum=['sqft','sqyard','acre','bigha','hectare','cent','marla','kanal']),
      ToolParam(key='to',    type='string', required=True,  description='Target unit', enum=['sqft','sqyard','acre','bigha','hectare','cent','marla','kanal']),
      ToolParam(key='state', type='string', required=False, description='Indian state — REQUIRED when from or to is "bigha" (bigha size varies 10x by state)'),
    ],
    return_schema_summary='{ result, from_unit, to_unit, formula_note }',
    api_backend='internal',
    cache_ttl_seconds=0,
    response_truncation=ResponseTruncation(),
    requires_auth=False,
    write_side=False,
    llm_visible=True,    # Tier B
    tier_b=True,
  ),

  # ── Market Intelligence ──────────────────────────────────────────────
  ToolRecord(
    name='getDemandSupplyInsight',
    description='Get market demand vs supply data for a locality: buyer/seller counts, BHK-level demand percentages, supply listing counts, and a pre-computed buyer_interest sentiment string from the backend ("High Interest", "Very High Interest", etc.).',
    input_params=[
      # polygon_uuid injected from entity_resolution (active_locality_id)
      # service_type  injected from session.transaction_type
    ],
    return_schema_summary='{ buyer_interest: str, potential_buyer_count, potential_seller_count, buyer_count_pct_change, seller_count_pct_change, demand_pct_change, supply_pct_change, demand_percentages: { bhk: pct }, supply: { bhk: listing_count } }',
    # buyer_interest is a backend-computed free-text sentiment label — use verbatim in bot response.
    # demand_percentages: what share of buyer demand falls on each BHK config (percentage, 0–100).
    # supply: actual listing count per BHK config (absolute numbers).
    api_backend='casa',
    cache_ttl_seconds=1800,
    response_truncation=ResponseTruncation(),
    requires_auth=False,
    write_side=False,
    llm_visible=False,
  ),
  ToolRecord(
    name='getProjectPriceTrends',
    description='Get per-project price trend history from Gandalf. Use for new projects when the user asks about appreciation within a specific project — distinct from getPriceTrends which gives locality-level aggregates.',
    input_params=[
      ToolParam(key='project_ids',        type='array',  required=True,  items={'type': 'string'}, description='Project IDs — from entity_resolution or session.active_project_id. Supports batch (up to 5).'),
      ToolParam(key='apartment_type_ids', type='array',  required=False, items={'type': 'string'}, description='BHK config IDs to filter e.g. ["2","3"] for 2BHK and 3BHK.'),
      ToolParam(key='property_type_id',   type='string', required=False, description='1 = residential (default), 2 = commercial.'),
    ],
    return_schema_summary='{ [project_id]: { trend: [{ date, price_psf }], percent_growth, avg_price_per_sqft } }',
    api_backend='gandalf',
    cache_ttl_seconds=3600,
    response_truncation=ResponseTruncation(),
    requires_auth=False,
    write_side=False,
    llm_visible=False,
  ),
  ToolRecord(
    name='getTravelTime',
    description='Compute driving distance and duration from a property to user-specified destinations (office, school, airport, etc.). Orchestrator resolves property coordinates from session.active_property_coordinates; destination coordinates from resolved entities (EntityResolutionMiddleware runs first).',
    input_params=[
      ToolParam(key='destination_names', type='array', required=True, items={'type': 'string'}, description='Destination names as stated by user — orchestrator resolves each to {lat,lng} via resolveEntity before calling.'),
      # origin: injected from session.active_property_coordinates (set after getPropertyDetail fetch)
      # destination lat/lng: injected from ctx['resolved_entities'][].coordinates
    ],
    return_schema_summary='{ destinations: [{ name, distance_m, duration_s, distance_text, duration_text }] }',
    # Two-step orchestration: group 1 = getPropertyDetail (for coords if not in session);
    # group 2 = getTravelTime (uses origin from group 1 + entity resolution results).
    api_backend='regions',
    cache_ttl_seconds=86400,
    response_truncation=ResponseTruncation(),
    requires_auth=False,
    write_side=False,
    llm_visible=False,
  ),
  ToolRecord(
    name='getPriceBuckets',
    description='Get price distribution histogram for properties matching current filters in a locality. Answers "is this price fair?" — returns buckets showing how many listings fall in each price range.',
    input_params=[
      # polygon_uuid, service, and active_filters injected from session
      ToolParam(key='bucket_threshold', type='number', required=False, description='Upper price cap for buy-service bucket aggregation.'),
    ],
    return_schema_summary='{ price_buckets: [{ range_label, min, max, count }], p90_price: float }',
    # For rent: also returns percentile_aggs (90th percentile) and 5K-width buckets.
    # Backed by Khoj searchCount endpoint with showBucket=True.
    api_backend='khoj',
    cache_ttl_seconds=600,
    response_truncation=ResponseTruncation(),
    requires_auth=False,
    write_side=False,
    llm_visible=False,
  ),
  ToolRecord(
    name='getFilterSuggestions',
    description='Get the most popular filter combinations (BHK + price range) used by real buyers/renters in a locality. Used to guide users with no preference: "Most people here search for 2BHK under ₹60K."',
    input_params=[
      # polygon_uuid injected from entity_resolution (active_locality_id)
      # service/category injected from session.transaction_type
    ],
    return_schema_summary='{ suggestions: [{ label, bhk, price_min, price_max, count }] }',
    api_backend='data',
    cache_ttl_seconds=3600,
    response_truncation=ResponseTruncation(max_items=5),
    requires_auth=False,
    write_side=False,
    llm_visible=False,
  ),
  ToolRecord(
    name='getCollections',
    description='Get curated property collections for a city — themed filter bundles like "Ready to Move", "Family Friendly", "New Launches". Each collection bundles a pre-defined Khoj filter set.',
    input_params=[
      # service and city_uuid injected from session
      ToolParam(key='collection_id', type='string', required=False, description='Specific collection ID; omit to return all collections for the city.'),
    ],
    return_schema_summary='{ collections: [{ id, name, tag_line, filters, service }] }',
    api_backend='data',
    cache_ttl_seconds=3600,
    response_truncation=ResponseTruncation(max_items=8),
    requires_auth=False,
    write_side=False,
    llm_visible=False,
  ),
  ToolRecord(
    name='getPopularCityLandmarks',
    description='Get landmarks in a city that drive the most property searches — useful for city orientation ("What are the key areas in Mumbai?"). Returns search_count per landmark.',
    input_params=[
      # city_uuid and service injected from session
    ],
    return_schema_summary='{ landmarks: [{ id, name, type, search_count, lat, lng }] }',
    api_backend='data',
    cache_ttl_seconds=3600,
    response_truncation=ResponseTruncation(max_items=10),
    requires_auth=False,
    write_side=False,
    llm_visible=False,
  ),
  ToolRecord(
    name='getTopSocieties',
    description='Get the most popular residential buildings and societies in a locality or near a landmark, with their rental listing counts.',
    input_params=[
      # entity_type and entity_id injected from entity_resolution
    ],
    return_schema_summary='{ societies: [{ name, address, rental_listing_count, url }] }',
    api_backend='seo',
    cache_ttl_seconds=3600,
    response_truncation=ResponseTruncation(max_items=8),
    requires_auth=False,
    write_side=False,
    llm_visible=False,
  ),

  # ── Portfolio / User Actions ─────────────────────────────────────────
  # Tier 1 direct actions — orchestrator executes these, no LLM involvement.
  ToolRecord(
    name='shortlistProperty',
    description="Save a property to the user's shortlist/favourites.",
    input_params=[
      ToolParam(key='property_id', type='string', required=True, description='Property ID to save'),
    ],
    return_schema_summary='{ success, message, shortlist_count }',
    api_backend='casa',
    cache_ttl_seconds=0,
    response_truncation=ResponseTruncation(),
    requires_auth=True,
    write_side=True,
    llm_visible=False,   # Tier 1: orchestrator acts directly, no LLM
  ),
  ToolRecord(
    name='removeFromShortlist',
    description="Remove a property from the user's shortlist.",
    input_params=[
      ToolParam(key='property_id', type='string', required=True, description='Property ID to remove'),
    ],
    return_schema_summary='{ success, message, shortlist_count }',
    api_backend='casa',
    cache_ttl_seconds=0,
    response_truncation=ResponseTruncation(),
    requires_auth=True,
    write_side=True,
    llm_visible=False,   # Tier 1: orchestrator acts directly, no LLM
  ),
  ToolRecord(
    name='contactSeller',
    description='Express user interest — triggers a seller callback or lead submission.',
    input_params=[
      ToolParam(key='property_id', type='string', required=True, description='Property ID'),
      ToolParam(key='seller_id',   type='string', required=True, description='Seller/owner ID from property details'),
    ],
    return_schema_summary='{ success, lead_id, message }',
    api_backend='casa',
    cache_ttl_seconds=0,
    response_truncation=ResponseTruncation(),
    requires_auth=True,
    write_side=True,
    llm_visible=False,   # Tier 1: orchestrator confirms + acts, no LLM
  ),
  ToolRecord(
    name='getSavedProperties',
    description="Fetch the user's saved/shortlisted properties.",
    input_params=[
      ToolParam(key='page',  type='integer', required=False, description='Page number, default 1'),
      ToolParam(key='limit', type='integer', required=False, description='Results per page, default 10'),
    ],
    return_schema_summary='{ total, properties: list[PropertyCard] }',
    api_backend='casa',
    cache_ttl_seconds=60,
    response_truncation=ResponseTruncation(max_items=10),
    requires_auth=True,
    write_side=False,
    llm_visible=False,   # orchestrator pre-fetches; LLM formats inline
    # Cache invalidation: after shortlistProperty or removeFromShortlist succeeds,
    # the orchestrator MUST call executor.invalidate_cache('getSavedProperties', session_id)
    # to ensure the next getSavedProperties call reflects the updated shortlist.
    # Without invalidation, a 60s stale window exists between save and display.
  ),
  ToolRecord(
    name='getViewedProperties',
    description='Fetch properties the user viewed in the current session.',
    input_params=[],
    return_schema_summary='{ properties: list[PropertyCard] }',
    api_backend='internal',    # from session store, not external API
    cache_ttl_seconds=0,
    response_truncation=ResponseTruncation(max_items=10),
    requires_auth=True,
    write_side=False,
    llm_visible=False,   # orchestrator pre-fetches; LLM formats inline
  ),
  ToolRecord(
    name='getRecommendations',
    description="Fetch personalized property recommendations based on user's search history and preferences.",
    input_params=[
      ToolParam(key='transaction_type', type='string',  required=False, enum=['rent','buy']),
      ToolParam(key='city',             type='string',  required=False, description='City name'),
      ToolParam(key='limit',            type='integer', required=False, description='Max recommendations, default 8'),
    ],
    return_schema_summary='{ hits: list[PropertyCard], recommendation_basis: str }',
    api_backend='khoj',
    cache_ttl_seconds=300,
    response_truncation=ResponseTruncation(max_items=8),
    requires_auth=True,
    write_side=False,
    llm_visible=False,   # orchestrator pre-fetches; LLM formats inline
  ),
  ToolRecord(
    name='getRecentlyViewed',
    description='Fetch properties the user recently viewed on the platform across sessions (uses ga_id cookie — does not require login).',
    input_params=[
      # ga_id injected from session.ga_id (Google Analytics cookie)
      # service injected from session.transaction_type
      ToolParam(key='limit', type='integer', required=False, description='Max results, default 10'),
    ],
    return_schema_summary='{ total_count, properties: list[PropertyCard] }',
    api_backend='data',
    cache_ttl_seconds=60,
    response_truncation=ResponseTruncation(max_items=10),
    requires_auth=False,   # needs ga_id, not auth token
    write_side=False,
    llm_visible=False,
  ),
  ToolRecord(
    name='createSearchAlert',
    description='Save current search filters and create an email alert for new matching properties. Hard cap of 5 active alerts per user. Requires login.',
    input_params=[
      ToolParam(key='alert_name',     type='string', required=False, description='Friendly name e.g. "3BHK in Powai under 1Cr". Orchestrator generates from session filters if omitted.'),
      ToolParam(key='mailing_option', type='string', required=False, description='Alert frequency', enum=['daily', 'instant']),
      # filters injected from session.active_filters (translated to backend codec by Subscriptions service)
    ],
    return_schema_summary='{ success, message }',
    # message: "You will get alerts for new properties" on success,
    #          "You have reached the max limit of 5 alerts." on cap,
    #          "You are already subscribed to this search" on duplicate.
    api_backend='subscriptions',
    cache_ttl_seconds=0,
    response_truncation=ResponseTruncation(),
    requires_auth=True,
    write_side=True,   # creates a subscription record; idempotency check in service
    llm_visible=False,   # Tier 1: orchestrator confirms + acts, no LLM
  ),
]
```

### Derived Functions

```python
def get_tool_record(name: str) -> ToolRecord | None:
    return next((t for t in TOOL_REGISTRY if t.name == name), None)

# Replaces the hardcoded requiredParams map in validate_tool_call:
def get_required_params(tool_name: str) -> list[str]:
    rec = get_tool_record(tool_name)
    if not rec:
        return []
    return [p.key for p in rec.input_params if p.required]

def is_write_side_tool(tool_name: str) -> bool:
    rec = get_tool_record(tool_name)
    return rec.write_side if rec else False

def get_tool_cache_ttl(tool_name: str) -> int:
    rec = get_tool_record(tool_name)
    return rec.cache_ttl_seconds if rec else 0

# Build tool definitions for injection into LLM prompt.
# Only called with residual_tools — already guaranteed to be llm_visible=True.
def build_tool_definitions_block(tool_names: list[str]) -> list[dict]:
    result = []
    for name in tool_names:
        t = get_tool_record(name)
        if t and t.llm_visible:
            result.append({
                'name': t.name,
                'description': t.description,
                'input_schema': {
                    'type': 'object',
                    'properties': {
                        p.key: {'type': p.type, 'description': p.description, 'enum': p.enum}
                        for p in t.input_params
                    },
                    'required': [p.key for p in t.input_params if p.required],
                },
            })
    return result

# Tier B: computation tools always available to the LLM in any Tier 3 intent.
# These are injected alongside residual_tools by PromptBuildMiddleware.
# The set is small and stable by design — only pure-computation internal tools.
# Calculator intents are excluded: their results are already pre-fetched inline,
# so there is nothing for the LLM to call.
TIER_B_TOOL_NAMES: list[str] = [t.name for t in TOOL_REGISTRY if t.tier_b is True]

# Called by PromptBuildMiddleware to assemble the LLM's tool list:
#   - residual_tools for this intent (usually [])
#   - + Tier B tools, except when intent is calculator/* (result already inline)
def build_all_llm_tools(
    residual_tools: list[str],
    main_intent: str,
) -> list[dict]:
    is_calculator_intent = main_intent == 'calculator'
    if is_calculator_intent:
        names = residual_tools
    else:
        names = list(dict.fromkeys(residual_tools + TIER_B_TOOL_NAMES))  # deduplicated, order-preserving
    return build_tool_definitions_block(names)

# Called by DataFetchMiddleware — executes all tools regardless of llm_visible.
def get_data_fetch_plan(main: str, sub: str) -> list[DataRequirement]:
    return get_data_requirements(main, sub)
```

---

