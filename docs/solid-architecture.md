# SOLID Architecture — Housing.com Bot

## Why This Doc Exists

As the system grew, the same information appeared in multiple places:

| Information | # of Copies Before |
|---|---|
| Intent taxonomy (what intents exist) | 8 (classifier prompt, TOOLS_BY_INTENT, TOOLS_BY_SUBINTENT_HAIKU, DIRECT_INTENT_MAP, buildSessionStateBlock, deriveRoutingTier, selectTier3Model, sanitizeFiltersOnPivot) |
| Tool definitions (what tools exist, what params they need) | 5 (LLM system prompt Section 2, validateToolCall, TOOLS_BY_INTENT, api_translation, tool cache config) |
| Filter schema (what filter keys exist, what they map to in Khoj) | 4 (SLM prompt filter_delta section, searchProperties input schema, validateToolCall, Khoj API translation) |

Adding a new intent → 8 places to update. Adding a new tool → 5 places. A new filter → 4 places. Each is a separate PR and a separate chance for drift.

**The fix: Three declarative registries as single sources of truth.** Everything else derives from them.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    THREE REGISTRIES                          │
│                                                             │
│  INTENT_REGISTRY     TOOL_REGISTRY     FILTER_REGISTRY      │
│  (what intents       (what tools       (what filter keys    │
│   exist + their       exist + their     exist + their       │
│   routing/tier)       schemas/APIs)     Khoj mappings)      │
└──────────────────────────────────────────────────────────────┘
              ↓ derived at build time ↓
┌─────────────────────────────────────────────────────────────┐
│                  PROMPT COMPOSER                             │
│   Static blocks + template blocks assembled per request     │
│   SLM prompt: rule-engine + taxonomy.tmpl + filter-delta    │
│   LLM prompt: identity + tool-defs.tmpl + session.tmpl      │
└──────────────────────────────────────────────────────────────┘
              ↓ executed per request ↓
┌─────────────────────────────────────────────────────────────┐
│                MIDDLEWARE PIPELINE                           │
│   Safety → Normalize → Classify → ApplyFilters →           │
│   Sanitize → Derive → Clarify → ResolveEntities →          │
│   Route → BuildPrompt → LLM → ValidateOutput → Respond     │
└──────────────────────────────────────────────────────────────┘
```

---

## Part 1 — INTENT_REGISTRY

### TypeScript Interface

```typescript
type Tier = 0 | 1 | 2 | '3a' | '3b';
type ModelHint = 'haiku' | 'sonnet' | null;

interface IntentRecord {
  // Identity
  main_intent: string;
  sub_intent: string;

  // Routing
  tier: Tier;
  model: ModelHint;          // null for tiers 0–2 (no LLM call)

  // Tools visible to the LLM for this sub_intent (references TOOL_REGISTRY keys)
  tools: string[];

  // Session state keys injected into the LLM system prompt for this intent
  session_inject: string[];

  // Filter keys to PRESERVE when pivoting TO this intent from another
  carry_over_keys: string[];

  // Filter keys to CLEAR when pivoting TO this intent from another
  clear_keys: string[];

  // Whether orchestrator should pre-resolve entities_mentioned before LLM call
  pre_resolve_entities: boolean;

  // Whether auth token must be present before routing here
  requires_auth: boolean;

  // Description used in taxonomy template injected into prompts
  description: string;
}
```

### Full Registry Population

```typescript
export const INTENT_REGISTRY: IntentRecord[] = [

  // ── property_search ──────────────────────────────────────────────────
  {
    main_intent: 'property_search',
    sub_intent:  'filter_search',
    tier:        '3a',
    model:       'haiku',
    tools:       ['searchProperties', 'resolveEntity'],
    session_inject: ['transaction_type', 'city', 'active_filters', 'srset_id'],
    carry_over_keys: ['transaction_type', 'city', 'bhk', 'price_min', 'price_max',
                      'furnishing', 'construction_status'],
    clear_keys:      ['active_property_id', 'active_locality_id', 'active_project_id'],
    pre_resolve_entities: true,
    requires_auth:   false,
    description: 'User is searching with explicit filters: location, BHK, price, amenities, builder, property type, or any combination.',
  },
  {
    main_intent: 'property_search',
    sub_intent:  'explore_nearby',
    tier:        '3a',
    model:       'haiku',
    tools:       ['searchProperties', 'resolveEntity'],
    session_inject: ['transaction_type', 'city', 'active_filters'],
    carry_over_keys: ['transaction_type', 'city', 'bhk', 'price_min', 'price_max'],
    clear_keys:      ['active_property_id', 'localities', 'active_locality_id'],
    pre_resolve_entities: true,    // resolve search_anchor entity
    requires_auth:   false,
    description: 'User wants to search by proximity: either to their live location ("near me") or to a named POI anchor ("near Manyata Tech Park").',
  },

  // ── property_detail ───────────────────────────────────────────────────
  {
    main_intent: 'property_detail',
    sub_intent:  'property_about',
    tier:        '3a',
    model:       'haiku',
    tools:       ['getPropertyDetail', 'getNearbyLandmarks'],
    session_inject: ['active_property_id', 'transaction_type', 'city'],
    carry_over_keys: ['active_property_id', 'transaction_type', 'city', 'srset_id'],
    clear_keys:      [],
    pre_resolve_entities: false,
    requires_auth:   false,
    description: 'User asks about price, area, amenities, possession date, builder info, or nearby facilities for the current property.',
  },
  {
    main_intent: 'property_detail',
    sub_intent:  'floor_plan',
    tier:        '3a',
    model:       'haiku',
    tools:       ['getFloorPlans'],
    session_inject: ['active_property_id'],
    carry_over_keys: ['active_property_id', 'transaction_type', 'city'],
    clear_keys:      [],
    pre_resolve_entities: false,
    requires_auth:   false,
    description: 'User wants to see floor plan images or room layout for the current property.',
  },
  {
    main_intent: 'property_detail',
    sub_intent:  'brochure',
    tier:        '3a',
    model:       'haiku',
    tools:       ['getBrochure'],
    session_inject: ['active_property_id', 'active_project_id'],
    carry_over_keys: ['active_property_id', 'transaction_type', 'city'],
    clear_keys:      [],
    pre_resolve_entities: true,    // "brochure for DLF Privana" resolves DLF Privana
    requires_auth:   false,
    description: 'User wants to download or view the project brochure or detailed PDF.',
  },
  {
    main_intent: 'property_detail',
    sub_intent:  'nearby_landmarks',
    tier:        '3a',
    model:       'haiku',
    tools:       ['getNearbyLandmarks'],
    session_inject: ['active_property_id', 'city'],
    carry_over_keys: ['active_property_id', 'transaction_type', 'city'],
    clear_keys:      [],
    pre_resolve_entities: false,
    requires_auth:   false,
    description: 'User wants to see nearby POIs (metro, schools, hospitals) around the current property — not distance to a specific named place.',
  },
  {
    main_intent: 'property_detail',
    sub_intent:  'calculate_emi',
    tier:        '3a',
    model:       'haiku',
    tools:       ['calculateEMI', 'getPropertyDetail'],
    session_inject: ['active_property_id', 'transaction_type'],
    carry_over_keys: ['active_property_id', 'transaction_type', 'city'],
    clear_keys:      [],
    pre_resolve_entities: false,
    requires_auth:   false,
    description: 'User asks about EMI, home loan, or affordability in context of the currently selected property.',
  },
  {
    main_intent: 'property_detail',
    sub_intent:  'similar_properties',
    tier:        '3a',
    model:       'haiku',
    tools:       ['getSimilarProperties'],
    session_inject: ['active_property_id', 'transaction_type', 'city', 'active_filters'],
    carry_over_keys: ['active_property_id', 'transaction_type', 'city'],
    clear_keys:      [],
    pre_resolve_entities: false,
    requires_auth:   false,
    description: 'User wants alternatives similar to the currently selected property. filter_delta.similarity_by captures the similarity axis (price, locality, overall, owner_only).',
  },
  {
    main_intent: 'property_detail',
    sub_intent:  'save_property',
    tier:        1,
    model:       null,
    tools:       ['shortlistProperty'],
    session_inject: ['active_property_id'],
    carry_over_keys: ['active_property_id', 'transaction_type', 'city'],
    clear_keys:      [],
    pre_resolve_entities: false,
    requires_auth:   true,     // needs auth token
    description: 'User wants to save or bookmark the current property to their shortlist.',
  },
  {
    main_intent: 'property_detail',
    sub_intent:  'remove_saved',
    tier:        1,
    model:       null,
    tools:       ['removeFromShortlist'],
    session_inject: ['active_property_id'],
    carry_over_keys: ['active_property_id', 'transaction_type', 'city'],
    clear_keys:      [],
    pre_resolve_entities: false,
    requires_auth:   true,
    description: 'User wants to remove the current property from their saved/shortlist.',
  },
  {
    main_intent: 'property_detail',
    sub_intent:  'contact_seller',
    tier:        1,
    model:       null,
    tools:       ['contactSeller'],
    session_inject: ['active_property_id'],
    carry_over_keys: ['active_property_id', 'transaction_type', 'city'],
    clear_keys:      [],
    pre_resolve_entities: false,
    requires_auth:   true,
    description: 'User wants to express interest, schedule a visit, or request a callback. Single-property only. Bulk lead actions → out_of_scope.',
  },

  // ── locality_research ────────────────────────────────────────────────
  {
    main_intent: 'locality_research',
    sub_intent:  'locality_overview',
    tier:        '3a',
    model:       'haiku',
    tools:       ['getLocalityDetail'],
    session_inject: ['city', 'active_locality_id'],
    carry_over_keys: ['transaction_type', 'city', 'active_locality_id'],
    clear_keys:      ['active_property_id', 'bhk', 'price_min', 'price_max'],
    pre_resolve_entities: true,
    requires_auth:   false,
    description: 'User wants general info, livability opinion, or overview about a specific named locality.',
  },
  {
    main_intent: 'locality_research',
    sub_intent:  'price_trends',
    tier:        '3a',
    model:       'haiku',
    tools:       ['getPriceTrends'],
    session_inject: ['city', 'transaction_type', 'active_locality_id'],
    carry_over_keys: ['transaction_type', 'city', 'active_locality_id'],
    clear_keys:      ['active_property_id', 'bhk', 'price_min', 'price_max'],
    pre_resolve_entities: true,
    requires_auth:   false,
    description: 'User wants price direction, appreciation rate, or market movement data for a locality.',
  },
  {
    main_intent: 'locality_research',
    sub_intent:  'transaction_data',
    tier:        '3a',
    model:       'haiku',
    tools:       ['getTransactionHistory'],
    session_inject: ['city', 'transaction_type', 'active_locality_id'],
    carry_over_keys: ['transaction_type', 'city', 'active_locality_id'],
    clear_keys:      ['active_property_id'],
    pre_resolve_entities: true,
    requires_auth:   false,
    description: 'User wants recent registered deal data or transaction history for a locality or project.',
  },
  {
    main_intent: 'locality_research',
    sub_intent:  'ratings_reviews',
    tier:        '3a',
    model:       'haiku',
    tools:       ['getRatingsReviews'],
    session_inject: ['city', 'active_locality_id'],
    carry_over_keys: ['transaction_type', 'city', 'active_locality_id'],
    clear_keys:      ['active_property_id'],
    pre_resolve_entities: true,
    requires_auth:   false,
    description: 'User wants resident ratings or reviews for a locality, builder, or project.',
  },
  {
    main_intent: 'locality_research',
    sub_intent:  'trending_localities',
    tier:        '3a',
    model:       'haiku',
    tools:       ['getTrendingLocalities'],
    session_inject: ['city', 'transaction_type'],
    carry_over_keys: ['transaction_type', 'city'],
    clear_keys:      ['active_property_id', 'active_locality_id', 'bhk', 'price_min', 'price_max'],
    pre_resolve_entities: false,
    requires_auth:   false,
    description: 'User asks for best/popular/trending areas in a city WITHOUT naming a specific locality.',
  },

  // ── project_research ─────────────────────────────────────────────────
  {
    main_intent: 'project_research',
    sub_intent:  'project_overview',
    tier:        '3a',
    model:       'haiku',
    tools:       ['getProjectDetail'],
    session_inject: ['city', 'active_project_id'],
    carry_over_keys: ['transaction_type', 'city', 'active_project_id'],
    clear_keys:      ['active_property_id', 'bhk', 'price_min', 'price_max'],
    pre_resolve_entities: true,
    requires_auth:   false,
    description: 'User wants info or opinions about a specific named housing project.',
  },
  {
    main_intent: 'project_research',
    sub_intent:  'price_trends',
    tier:        '3a',
    model:       'haiku',
    tools:       ['getPriceTrends'],
    session_inject: ['city', 'transaction_type', 'active_project_id'],
    carry_over_keys: ['transaction_type', 'city', 'active_project_id'],
    clear_keys:      ['active_property_id'],
    pre_resolve_entities: true,
    requires_auth:   false,
    description: 'User wants price appreciation or market movement data within a specific project.',
  },
  {
    main_intent: 'project_research',
    sub_intent:  'ratings_reviews',
    tier:        '3a',
    model:       'haiku',
    tools:       ['getRatingsReviews'],
    session_inject: ['city', 'active_project_id'],
    carry_over_keys: ['transaction_type', 'city', 'active_project_id'],
    clear_keys:      ['active_property_id'],
    pre_resolve_entities: true,
    requires_auth:   false,
    description: 'User wants ratings or reviews for a specific project or builder.',
  },
  {
    main_intent: 'project_research',
    sub_intent:  'trending_projects',
    tier:        '3a',
    model:       'haiku',
    tools:       ['getTrendingProjects'],
    session_inject: ['city', 'transaction_type'],
    carry_over_keys: ['transaction_type', 'city'],
    clear_keys:      ['active_property_id', 'active_project_id'],
    pre_resolve_entities: false,
    requires_auth:   false,
    description: 'User asks for popular or in-demand new launches in a city (not naming a specific project).',
  },

  // ── comparison ───────────────────────────────────────────────────────
  {
    main_intent: 'comparison',
    sub_intent:  'compare_localities',
    tier:        '3b',
    model:       'sonnet',
    tools:       ['getLocalityDetail', 'getPriceTrends', 'getRatingsReviews'],
    session_inject: ['city', 'transaction_type'],
    carry_over_keys: ['transaction_type', 'city'],
    clear_keys:      ['active_property_id', 'bhk', 'price_min', 'price_max'],
    pre_resolve_entities: true,    // resolve BOTH locality names before Sonnet call
    requires_auth:   false,
    description: 'User wants a side-by-side comparison of exactly two named localities.',
  },
  {
    main_intent: 'comparison',
    sub_intent:  'compare_projects',
    tier:        '3b',
    model:       'sonnet',
    tools:       ['getProjectDetail', 'getPriceTrends', 'getRatingsReviews', 'getTransactionHistory'],
    session_inject: ['city', 'transaction_type'],
    carry_over_keys: ['transaction_type', 'city'],
    clear_keys:      ['active_property_id'],
    pre_resolve_entities: true,    // resolve BOTH project names before Sonnet call
    requires_auth:   false,
    description: 'User wants a side-by-side comparison of exactly two named projects.',
  },

  // ── portfolio ─────────────────────────────────────────────────────────
  {
    main_intent: 'portfolio',
    sub_intent:  'saved_properties',
    tier:        2,
    model:       null,
    tools:       ['getSavedProperties'],
    session_inject: [],
    carry_over_keys: ['transaction_type', 'city'],
    clear_keys:      [],
    pre_resolve_entities: false,
    requires_auth:   true,
    description: 'User wants to view their saved/shortlisted properties.',
  },
  {
    main_intent: 'portfolio',
    sub_intent:  'viewed_properties',
    tier:        2,
    model:       null,
    tools:       ['getViewedProperties'],
    session_inject: [],
    carry_over_keys: ['transaction_type', 'city'],
    clear_keys:      [],
    pre_resolve_entities: false,
    requires_auth:   true,
    description: 'User wants to see properties they previously opened in this session.',
  },
  {
    main_intent: 'portfolio',
    sub_intent:  'recent_searches',
    tier:        2,
    model:       null,
    tools:       [],
    session_inject: ['search_history'],
    carry_over_keys: [],
    clear_keys:      [],
    pre_resolve_entities: false,
    requires_auth:   true,
    description: 'User wants to review or resume their recent search queries.',
  },
  {
    main_intent: 'portfolio',
    sub_intent:  'recommendations',
    tier:        '3a',
    model:       'haiku',
    tools:       ['getRecommendations'],
    session_inject: ['transaction_type', 'city', 'active_filters'],
    carry_over_keys: ['transaction_type', 'city'],
    clear_keys:      [],
    pre_resolve_entities: false,
    requires_auth:   true,
    description: 'User explicitly requests personalized property suggestions based on their profile or history.',
  },

  // ── calculator ────────────────────────────────────────────────────────
  {
    main_intent: 'calculator',
    sub_intent:  'calculate_emi',
    tier:        '3a',
    model:       'haiku',
    tools:       ['calculateEMI'],
    session_inject: [],
    carry_over_keys: ['transaction_type', 'city'],
    clear_keys:      [],
    pre_resolve_entities: false,
    requires_auth:   false,
    description: 'Standalone EMI computation from a price the user states explicitly. Not tied to a property in context.',
  },
  {
    main_intent: 'calculator',
    sub_intent:  'calculate_affordability',
    tier:        '3a',
    model:       'haiku',
    tools:       ['calculateAffordability'],
    session_inject: [],
    carry_over_keys: ['transaction_type', 'city'],
    clear_keys:      [],
    pre_resolve_entities: false,
    requires_auth:   false,
    description: 'User provides their salary and wants to know their property budget or affordability check.',
  },
  {
    main_intent: 'calculator',
    sub_intent:  'convert_unit',
    tier:        '3a',
    model:       'haiku',
    tools:       ['convertUnit'],
    session_inject: [],
    carry_over_keys: [],
    clear_keys:      [],
    pre_resolve_entities: false,
    requires_auth:   false,
    description: 'User wants to convert between area units (sqft, sqyard, acre, bigha, hectare).',
  },

  // ── multi_intent ─────────────────────────────────────────────────────
  {
    main_intent: 'multi_intent',
    sub_intent:  'decompose',
    tier:        '3b',
    model:       'sonnet',
    tools:       [],      // populated dynamically from decomposed intents
    session_inject: [],   // populated dynamically
    carry_over_keys: ['transaction_type', 'city'],
    clear_keys:      [],
    pre_resolve_entities: true,
    requires_auth:   false,
    description: 'Message contains two or more independently actionable intents mapping to different sub_intents. Sonnet handles composition.',
  },

  // ── out_of_scope ──────────────────────────────────────────────────────
  {
    main_intent: 'out_of_scope',
    sub_intent:  'out_of_scope_query',
    tier:        0,
    model:       null,
    tools:       [],
    session_inject: [],
    carry_over_keys: [],
    clear_keys:      [],
    pre_resolve_entities: false,
    requires_auth:   false,
    description: 'Social pleasantries, topics unrelated to real estate, prompt injection attempts, bulk unsupported actions.',
  },
  {
    main_intent: 'out_of_scope',
    sub_intent:  'insufficient_info',
    tier:        0,
    model:       null,
    tools:       [],
    session_inject: [],
    carry_over_keys: [],
    clear_keys:      [],
    pre_resolve_entities: false,
    requires_auth:   false,
    description: 'Single characters, emoji-only input, gibberish, or too vague to classify even with history.',
  },
];
```

### Derived Functions (replace all hardcoded maps)

```typescript
// Everything that was scattered across 8 places now derives from one source:

export function getIntentRecord(main: string, sub: string): IntentRecord | undefined {
  return INTENT_REGISTRY.find(r => r.main_intent === main && r.sub_intent === sub);
}

export function getToolsForIntent(main: string, sub: string): string[] {
  return getIntentRecord(main, sub)?.tools ?? [];
}

export function getTierForIntent(main: string, sub: string): Tier {
  return getIntentRecord(main, sub)?.tier ?? '3b';
}

export function getModelForIntent(main: string, sub: string): ModelHint {
  return getIntentRecord(main, sub)?.model ?? 'sonnet';
}

export function getCarryOverKeys(main: string, sub: string): string[] {
  return getIntentRecord(main, sub)?.carry_over_keys ?? [];
}

export function getClearKeys(main: string, sub: string): string[] {
  return getIntentRecord(main, sub)?.clear_keys ?? [];
}

export function requiresPreResolution(main: string, sub: string): boolean {
  return getIntentRecord(main, sub)?.pre_resolve_entities ?? false;
}

export function requiresAuth(main: string, sub: string): boolean {
  return getIntentRecord(main, sub)?.requires_auth ?? false;
}

// Used by PromptComposer to generate the intent taxonomy block:
export function buildIntentTaxonomyBlock(): string {
  return INTENT_REGISTRY
    .filter(r => r.main_intent !== 'out_of_scope')
    .map(r => `  sub_intent: ${r.sub_intent}\n    ${r.description}`)
    .join('\n\n');
}
```

---

## Part 2 — TOOL_REGISTRY

### TypeScript Interface

```typescript
type ApiBackend = 'khoj' | 'casa' | 'venus' | 'gandalf' | 'odin' | 'autosuggest' | 'internal';

interface ToolParam {
  key: string;
  type: 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  enum?: string[];
  items?: { type: string; enum?: string[] };
  wire_param?: string;           // name of the param in the actual API (if different)
  wire_transform?: string;       // transformation expression, e.g. "BHK_TO_APT_TYPE[value]"
}

interface ToolRecord {
  name: string;
  description: string;           // shown to LLM in Section 2 of system prompt
  input_params: ToolParam[];
  return_schema_summary: string; // compact description for system prompt
  api_backend: ApiBackend;
  cache_ttl_seconds: number;     // 0 = no cache
  response_truncation: {
    max_items?: number;
    drop_fields?: string[];      // large fields to strip before sending to LLM
  };
  requires_auth: boolean;
  write_side: boolean;           // true = needs explicit user confirmation before call
}
```

### Full Registry Population

```typescript
export const TOOL_REGISTRY: ToolRecord[] = [

  // ── Search & Discovery ──────────────────────────────────────────────
  {
    name: 'searchProperties',
    description: 'Search for properties using filter criteria. Returns a paginated result set.',
    input_params: [
      {
        key: 'filters',
        type: 'object',
        required: true,
        description: 'Search filter object. All keys are optional except city/transaction_type from session.',
      },
      // Note: filter keys are defined in FILTER_REGISTRY, not here.
      // The PromptComposer injects the filter schema from FILTER_REGISTRY into tool description.
    ],
    return_schema_summary: '{ search_result_set_id, total_count, cursor, is_last_page, hits: PropertyCard[] }',
    api_backend: 'khoj',
    cache_ttl_seconds: 30,
    response_truncation: {
      max_items: 10,
      drop_fields: ['image_urls', 'builder_description', 'full_address'],
    },
    requires_auth: false,
    write_side: false,
  },
  {
    name: 'resolveEntity',
    description: 'Resolve a raw entity name (locality, project, landmark) to a structured ID via autosuggest.',
    input_params: [
      { key: 'query',       type: 'string', required: true,  description: 'Raw name as typed by the user, e.g. "Bandra West", "DLF Privana"' },
      { key: 'entity_type', type: 'string', required: true,  description: 'One of: locality, project, landmark, city', enum: ['locality','project','landmark','city'] },
      { key: 'city',        type: 'string', required: false, description: 'Limit candidates to this city (recommended for locality/project)' },
      { key: 'service',     type: 'string', required: false, description: 'rent or buy — scopes project candidates', enum: ['rent','buy'] },
    ],
    return_schema_summary: '{ resolved: boolean, candidates: EntityCandidate[], needs_disambiguation: boolean }',
    api_backend: 'autosuggest',
    cache_ttl_seconds: 3600,
    response_truncation: { max_items: 3 },
    requires_auth: false,
    write_side: false,
  },

  // ── Property Detail ─────────────────────────────────────────────────
  {
    name: 'getPropertyDetail',
    description: 'Fetch full details for a specific property ID.',
    input_params: [
      { key: 'property_id',      type: 'string', required: true,  description: 'From searchProperties hits or active_property_id in session' },
      { key: 'transaction_type', type: 'string', required: true,  description: 'rent or buy — routes to correct Casa endpoint', enum: ['rent','resale'] },
      { key: 'property_kind',    type: 'string', required: true,  description: 'flat or project — routes to Casa vs Venus', enum: ['flat','project'] },
    ],
    return_schema_summary: '{ property_id, title, price, area_sqft, bhk, amenities[], builder, possession_date, rera_id, ... }',
    api_backend: 'casa',
    cache_ttl_seconds: 300,
    response_truncation: {
      drop_fields: ['raw_description', 'image_urls', 'similar_properties'],
    },
    requires_auth: false,
    write_side: false,
  },
  {
    name: 'getFloorPlans',
    description: 'Get floor plan image URLs and room layout data for a property or project.',
    input_params: [
      { key: 'property_id', type: 'string', required: true, description: 'Property or project ID' },
    ],
    return_schema_summary: '{ floor_plans: [{ type, sqft, image_url, rooms }] }',
    api_backend: 'venus',
    cache_ttl_seconds: 3600,
    response_truncation: { max_items: 5 },
    requires_auth: false,
    write_side: false,
  },
  {
    name: 'getBrochure',
    description: 'Get the brochure download URL for a project.',
    input_params: [
      { key: 'project_id', type: 'string', required: true, description: 'Project ID — resolved by pre-resolution from entities_mentioned' },
    ],
    return_schema_summary: '{ brochure_url, file_size_mb, project_name }',
    api_backend: 'venus',
    cache_ttl_seconds: 3600,
    response_truncation: {},
    requires_auth: false,
    write_side: false,
  },
  {
    name: 'getNearbyLandmarks',
    description: 'Get nearby points of interest around a property.',
    input_params: [
      { key: 'locality_id',  type: 'string', required: false, description: 'Locality UUID — preferred; mutually exclusive with coordinates' },
      { key: 'coordinates',  type: 'object', required: false, description: '{ lat, lng } — used when locality_id unavailable' },
      { key: 'categories',   type: 'array',  required: false, description: 'Filter by landmark category', items: { type: 'string', enum: ['metro','school','hospital','mall','park','restaurant'] } },
      { key: 'radius_meters', type: 'integer', required: false, description: 'Search radius in metres, default 1000' },
    ],
    return_schema_summary: '{ landmarks: [{ name, category, distance_metres, walk_minutes }] }',
    api_backend: 'odin',
    cache_ttl_seconds: 86400,
    response_truncation: { max_items: 10 },
    requires_auth: false,
    write_side: false,
  },
  {
    name: 'getSimilarProperties',
    description: 'Get properties similar to a given property, optionally filtered by similarity axis.',
    input_params: [
      { key: 'property_id',    type: 'string', required: true,  description: 'Reference property ID' },
      { key: 'similarity_by',  type: 'string', required: false, description: 'How to rank similarity', enum: ['overall','price','locality','owner_only','recently_added'] },
      { key: 'transaction_type', type: 'string', required: true, description: 'rent or resale', enum: ['rent','resale'] },
    ],
    return_schema_summary: '{ hits: PropertyCard[] }',
    api_backend: 'khoj',
    cache_ttl_seconds: 60,
    response_truncation: { max_items: 5 },
    requires_auth: false,
    write_side: false,
  },

  // ── Locality & Project Research ──────────────────────────────────────
  {
    name: 'getLocalityDetail',
    description: 'Get overview, livability score, and key attributes for a named locality.',
    input_params: [
      { key: 'locality',    type: 'string',  required: true, description: 'Raw locality name or locality UUID (preferred)' },
      { key: 'city',        type: 'string',  required: true, description: 'City name — required to disambiguate locality' },
      { key: 'locality_id', type: 'string',  required: false, description: 'UUID from resolveEntity — use instead of locality name if available' },
    ],
    return_schema_summary: '{ locality_id, name, city, livability_score, connectivity, schools, hospitals, price_psf, ... }',
    api_backend: 'odin',
    cache_ttl_seconds: 3600,
    response_truncation: { drop_fields: ['raw_description'] },
    requires_auth: false,
    write_side: false,
  },
  {
    name: 'getPriceTrends',
    description: 'Get price appreciation trend data for a locality or project.',
    input_params: [
      { key: 'locality',         type: 'string',  required: false, description: 'Locality name or UUID' },
      { key: 'project_id',       type: 'string',  required: false, description: 'Project UUID — for project-level trends' },
      { key: 'city',             type: 'string',  required: true,  description: 'City name' },
      { key: 'transaction_type', type: 'string',  required: true,  description: 'buy or rent', enum: ['buy','rent'] },
      { key: 'duration_years',   type: 'integer', required: false, description: 'History window in years (1–5), default 3', wire_param: 'durationYears' },
    ],
    return_schema_summary: '{ data_points: [{ date, price_psf }], appreciation_pct, trend_direction }',
    api_backend: 'gandalf',
    cache_ttl_seconds: 3600,
    response_truncation: { drop_fields: [] },
    requires_auth: false,
    write_side: false,
  },
  {
    name: 'getTransactionHistory',
    description: 'Get recent registered deal/transaction data for a locality or project.',
    input_params: [
      { key: 'locality_id', type: 'string',  required: false, description: 'Locality UUID' },
      { key: 'project_id',  type: 'string',  required: false, description: 'Project UUID' },
      { key: 'city',        type: 'string',  required: true,  description: 'City name' },
      { key: 'limit',       type: 'integer', required: false, description: 'Max transactions to return, default 10' },
    ],
    return_schema_summary: '{ transactions: [{ date, price, area_sqft, bhk, floor, buyer, seller_type }] }',
    api_backend: 'gandalf',
    cache_ttl_seconds: 1800,
    response_truncation: { max_items: 10 },
    requires_auth: false,
    write_side: false,
  },
  {
    name: 'getRatingsReviews',
    description: 'Get ratings and reviews for a locality, project, or builder.',
    input_params: [
      { key: 'entity_type', type: 'string', required: true,  description: 'What to fetch reviews for', enum: ['locality','project','builder'] },
      { key: 'entity_id',   type: 'string', required: true,  description: 'UUID of the locality, project, or builder' },
      { key: 'limit',       type: 'integer', required: false, description: 'Max reviews, default 5' },
    ],
    return_schema_summary: '{ overall_rating, total_reviews, reviews: [{ rating, text, pros, cons, date }] }',
    api_backend: 'odin',
    cache_ttl_seconds: 3600,
    response_truncation: { max_items: 5, drop_fields: ['reviewer_profile'] },
    requires_auth: false,
    write_side: false,
  },
  {
    name: 'getTrendingLocalities',
    description: 'Get top trending/popular localities in a city based on demand signals.',
    input_params: [
      { key: 'city',             type: 'string', required: true,  description: 'City name' },
      { key: 'transaction_type', type: 'string', required: false, description: 'rent or buy — scopes trends', enum: ['rent','buy'] },
      { key: 'limit',            type: 'integer', required: false, description: 'Max localities to return, default 8' },
    ],
    return_schema_summary: '{ localities: [{ name, locality_id, demand_score, price_psf, yoy_change_pct }] }',
    api_backend: 'odin',
    cache_ttl_seconds: 3600,
    response_truncation: { max_items: 8 },
    requires_auth: false,
    write_side: false,
  },
  {
    name: 'getTrendingProjects',
    description: 'Get top trending new-launch projects in a city.',
    input_params: [
      { key: 'city',             type: 'string', required: true,  description: 'City name' },
      { key: 'transaction_type', type: 'string', required: false, description: 'rent or buy', enum: ['rent','buy'] },
      { key: 'limit',            type: 'integer', required: false, description: 'Max projects, default 6' },
    ],
    return_schema_summary: '{ projects: [{ project_id, name, builder, locality, price_min, price_max, launch_date }] }',
    api_backend: 'odin',
    cache_ttl_seconds: 1800,
    response_truncation: { max_items: 6 },
    requires_auth: false,
    write_side: false,
  },
  {
    name: 'getProjectDetail',
    description: 'Get detailed information about a specific housing project.',
    input_params: [
      { key: 'project_id', type: 'string', required: true, description: 'Project UUID from resolveEntity or search hits' },
    ],
    return_schema_summary: '{ project_id, name, builder, locality, city, bhk_range, price_range, amenities[], rera_id, completion_date, total_units }',
    api_backend: 'venus',
    cache_ttl_seconds: 3600,
    response_truncation: { drop_fields: ['raw_description', 'image_urls'] },
    requires_auth: false,
    write_side: false,
  },

  // ── Calculators ─────────────────────────────────────────────────────
  {
    name: 'calculateEMI',
    description: 'Calculate monthly EMI for a home loan.',
    input_params: [
      { key: 'property_price',      type: 'number',  required: true,  description: 'Property price in INR (only required param)' },
      { key: 'down_payment_pct',    type: 'number',  required: false, description: 'Down payment percentage, default 20' },
      { key: 'loan_tenure_years',   type: 'integer', required: false, description: 'Loan tenure in years, default 20' },
      { key: 'interest_rate_annual', type: 'number', required: false, description: 'Annual interest rate %, default 8.5' },
    ],
    return_schema_summary: '{ monthly_emi, loan_amount, total_interest, total_payment, tenure_years, rate_pct }',
    api_backend: 'internal',
    cache_ttl_seconds: 0,
    response_truncation: {},
    requires_auth: false,
    write_side: false,
  },
  {
    name: 'calculateAffordability',
    description: 'Estimate property budget from monthly or annual salary.',
    input_params: [
      { key: 'monthly_salary',   type: 'number',  required: false, description: 'Monthly salary in INR' },
      { key: 'annual_salary',    type: 'number',  required: false, description: 'Annual salary in INR — use if monthly not provided' },
      { key: 'existing_emi',     type: 'number',  required: false, description: 'Existing monthly EMI obligations, default 0' },
      { key: 'down_payment_pct', type: 'number',  required: false, description: 'Down payment %, default 20' },
    ],
    return_schema_summary: '{ affordable_property_price, max_loan, monthly_emi_at_max, foir_pct }',
    api_backend: 'internal',
    cache_ttl_seconds: 0,
    response_truncation: {},
    requires_auth: false,
    write_side: false,
  },
  {
    name: 'convertUnit',
    description: 'Convert area between Indian real estate units.',
    input_params: [
      { key: 'value', type: 'number',  required: true,  description: 'Numeric quantity to convert' },
      { key: 'from',  type: 'string',  required: true,  description: 'Source unit', enum: ['sqft','sqyard','acre','bigha','hectare','cent','marla','kanal'] },
      { key: 'to',    type: 'string',  required: true,  description: 'Target unit', enum: ['sqft','sqyard','acre','bigha','hectare','cent','marla','kanal'] },
      { key: 'state', type: 'string',  required: false, description: 'Indian state — REQUIRED when from or to is "bigha" (bigha size varies 10x by state)' },
    ],
    return_schema_summary: '{ result, from_unit, to_unit, formula_note }',
    api_backend: 'internal',
    cache_ttl_seconds: 0,
    response_truncation: {},
    requires_auth: false,
    write_side: false,
  },

  // ── Portfolio / User Actions ─────────────────────────────────────────
  {
    name: 'shortlistProperty',
    description: 'Save a property to the user\'s shortlist/favourites.',
    input_params: [
      { key: 'property_id', type: 'string', required: true, description: 'Property ID to save' },
    ],
    return_schema_summary: '{ success, message, shortlist_count }',
    api_backend: 'casa',
    cache_ttl_seconds: 0,
    response_truncation: {},
    requires_auth: true,
    write_side: true,
  },
  {
    name: 'removeFromShortlist',
    description: 'Remove a property from the user\'s shortlist.',
    input_params: [
      { key: 'property_id', type: 'string', required: true, description: 'Property ID to remove' },
    ],
    return_schema_summary: '{ success, message, shortlist_count }',
    api_backend: 'casa',
    cache_ttl_seconds: 0,
    response_truncation: {},
    requires_auth: true,
    write_side: true,
  },
  {
    name: 'contactSeller',
    description: 'Express user interest — triggers a seller callback or lead submission.',
    input_params: [
      { key: 'property_id', type: 'string', required: true, description: 'Property ID' },
      { key: 'seller_id',   type: 'string', required: true, description: 'Seller/owner ID from property details' },
    ],
    return_schema_summary: '{ success, lead_id, message }',
    api_backend: 'casa',
    cache_ttl_seconds: 0,
    response_truncation: {},
    requires_auth: true,
    write_side: true,  // must confirm before calling
  },
  {
    name: 'getSavedProperties',
    description: 'Fetch the user\'s saved/shortlisted properties.',
    input_params: [
      { key: 'page',  type: 'integer', required: false, description: 'Page number, default 1' },
      { key: 'limit', type: 'integer', required: false, description: 'Results per page, default 10' },
    ],
    return_schema_summary: '{ total, properties: PropertyCard[] }',
    api_backend: 'casa',
    cache_ttl_seconds: 60,
    response_truncation: { max_items: 10 },
    requires_auth: true,
    write_side: false,
  },
  {
    name: 'getViewedProperties',
    description: 'Fetch properties the user viewed in the current session.',
    input_params: [],
    return_schema_summary: '{ properties: PropertyCard[] }',
    api_backend: 'internal',    // from session store, not external API
    cache_ttl_seconds: 0,
    response_truncation: { max_items: 10 },
    requires_auth: true,
    write_side: false,
  },
  {
    name: 'getRecommendations',
    description: 'Fetch personalized property recommendations based on user\'s search history and preferences.',
    input_params: [
      { key: 'transaction_type', type: 'string', required: false, enum: ['rent','buy'] },
      { key: 'city',             type: 'string', required: false },
      { key: 'limit',            type: 'integer', required: false, description: 'Max recommendations, default 8' },
    ],
    return_schema_summary: '{ hits: PropertyCard[], recommendation_basis: string }',
    api_backend: 'khoj',
    cache_ttl_seconds: 300,
    response_truncation: { max_items: 8 },
    requires_auth: true,
    write_side: false,
  },
];
```

### Derived Functions

```typescript
export function getToolRecord(name: string): ToolRecord | undefined {
  return TOOL_REGISTRY.find(t => t.name === name);
}

// Replaces the hardcoded requiredParams map in validateToolCall:
export function getRequiredParams(toolName: string): string[] {
  return getToolRecord(toolName)?.input_params
    .filter(p => p.required)
    .map(p => p.key) ?? [];
}

export function isWriteSideTool(toolName: string): boolean {
  return getToolRecord(toolName)?.write_side ?? false;
}

export function getToolCacheTTL(toolName: string): number {
  return getToolRecord(toolName)?.cache_ttl_seconds ?? 0;
}

// Used by PromptComposer to inject tool definitions for a specific sub_intent:
export function buildToolDefinitionsBlock(toolNames: string[]): object[] {
  return toolNames
    .map(name => getToolRecord(name))
    .filter(Boolean)
    .map(t => ({
      name: t!.name,
      description: t!.description,
      input_schema: {
        type: 'object',
        properties: Object.fromEntries(
          t!.input_params.map(p => [p.key, { type: p.type, description: p.description, enum: p.enum }])
        ),
        required: t!.input_params.filter(p => p.required).map(p => p.key),
      }
    }));
}
```

---

## Part 3 — FILTER_REGISTRY

### TypeScript Interface

```typescript
type FilterOperation = 'REPLACE' | 'ADD' | 'REMOVE' | 'RELAX';
type ServiceScope = 'buy' | 'rent' | 'both';

interface FilterRecord {
  key: string;                // semantic name used in filter_delta and session state
  khoj_param: string;         // actual query param name sent to Khoj API
  type: 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'range';
  enum_values?: string[];     // for string/array enum types
  default_operation: FilterOperation;
  service_scope: ServiceScope;
  description: string;        // for SLM prompt injection
  examples: {
    user_says: string;
    filter_delta: object;
  }[];
  clear_on_pivot_to?: string[];  // intents that clear this filter when pivoting TO them
  wire_transform?: string;       // transformation from semantic to wire value
}
```

### Full Registry Population

```typescript
export const FILTER_REGISTRY: FilterRecord[] = [

  // ── Core Search Context ─────────────────────────────────────────────
  {
    key:               'transaction_type',
    khoj_param:        'service',
    type:              'string',
    enum_values:       ['buy', 'rent'],
    default_operation: 'REPLACE',
    service_scope:     'both',
    description:       'Buy or rent. ONLY from explicit words: "rent", "buy", "kiraaye", "khareedna". NEVER from price magnitude.',
    examples: [
      { user_says: 'looking to rent', filter_delta: { transaction_type: 'rent' } },
      { user_says: '30K per month', filter_delta: { transaction_type: 'rent', price_max: 30000 } },  // explicit "per month" = rent signal
      { user_says: 'flat for 30K/sqft', filter_delta: { price_per_sqft: 30000 } },  // no service switch
    ],
    clear_on_pivot_to: [],
  },
  {
    key:               'city',
    khoj_param:        'city',
    type:              'string',
    default_operation: 'REPLACE',
    service_scope:     'both',
    description:       'City name. When changed, always also output localities: null to clear stale locality filters.',
    examples: [
      { user_says: 'show in Delhi', filter_delta: { city: 'Delhi', localities: null } },
      { user_says: 'Bangalore flats', filter_delta: { city: 'Bangalore', localities: null } },
    ],
    clear_on_pivot_to: [],
  },
  {
    key:               'localities',
    khoj_param:        'poly',             // Khoj uses locality UUIDs in poly param
    type:              'array',
    default_operation: 'REPLACE',
    service_scope:     'both',
    description:       'List of locality names (orchestrator resolves to UUIDs via poly). Cleared automatically on city change.',
    examples: [
      { user_says: 'in Andheri', filter_delta: { localities: ['Andheri'] } },
      { user_says: 'and Bandra as well', filter_delta: { localities: ['Andheri', 'Bandra'] } },  // ADD
      { user_says: 'remove Andheri', filter_delta: { localities: ['Bandra'] } },  // REMOVE
      { user_says: 'anywhere in the city', filter_delta: { localities: null } },  // RELAX
    ],
    wire_transform: 'resolveLocalityUUIDs(value)',  // orchestrator converts names to UUIDs
    clear_on_pivot_to: ['locality_research', 'project_research', 'comparison'],
  },

  // ── Property Characteristics ─────────────────────────────────────────
  {
    key:               'bhk',
    khoj_param:        'apartment_type_id',
    type:              'array',
    enum_values:       ['0', '1', '2', '3', '4', '5+', 'villa'],
    default_operation: 'REPLACE',
    service_scope:     'both',
    description:       'BHK count. Orchestrator maps to apartment_type_id codes. "0" = Studio.',
    examples: [
      { user_says: '2BHK', filter_delta: { bhk: [2] } },
      { user_says: '2 or 3BHK', filter_delta: { bhk: [2, 3] } },
      { user_says: 'also 3BHK', filter_delta: { bhk: [2, 3] } },  // ADD — SLM outputs merged list
    ],
    wire_transform: 'BHK_TO_APT_TYPE_ID[value]',  // { 0→5, 1→1, 2→2, 3→3, 4→4, '5+'→7, villa→6 }
    clear_on_pivot_to: ['locality_research', 'project_research', 'comparison'],
  },
  {
    key:               'property_type',
    khoj_param:        'property_type',
    type:              'array',
    enum_values:       ['apartment', 'villa', 'plot', 'builder_floor', 'studio'],
    default_operation: 'REPLACE',
    service_scope:     'both',
    description:       'Property type. "apartment" is default and most common.',
    examples: [
      { user_says: 'independent house', filter_delta: { property_type: ['villa'] } },
      { user_says: 'builder floor Delhi', filter_delta: { property_type: ['builder_floor'], city: 'Delhi', localities: null } },
    ],
    clear_on_pivot_to: [],
  },
  {
    key:               'furnishing',
    khoj_param:        'furnish_type_id',
    type:              'string',
    enum_values:       ['furnished', 'semi_furnished', 'unfurnished'],
    default_operation: 'REPLACE',
    service_scope:     'rent',
    description:       'Furnishing status. Primarily relevant for rent. Orchestrator maps to furnish_type_id codes.',
    examples: [
      { user_says: 'fully furnished only', filter_delta: { furnishing: 'furnished' } },
      { user_says: 'avoid furnished', filter_delta: { furnishing: null } },  // RELAX/REMOVE
    ],
    wire_transform: 'FURNISH_TYPE_ID[value]',  // { furnished: 1, semi_furnished: 2, unfurnished: 3 }
    clear_on_pivot_to: ['locality_research', 'project_research'],
  },
  {
    key:               'construction_status',
    khoj_param:        'construction_type',
    type:              'array',
    enum_values:       ['new_launch', 'under_construction', 'ready_to_move'],
    default_operation: 'REPLACE',
    service_scope:     'buy',
    description:       'Construction stage. Relevant for buy only. Rent implies ready_to_move.',
    examples: [
      { user_says: 'ready to move', filter_delta: { construction_status: ['ready_to_move'] } },
      { user_says: 'new launch', filter_delta: { construction_status: ['new_launch'] } },
      { user_says: 'uc flat', filter_delta: { construction_status: ['under_construction'] } },
    ],
    clear_on_pivot_to: ['locality_research', 'project_research', 'comparison'],
  },
  {
    key:               'listed_by',
    khoj_param:        'contact_person_id',
    type:              'string',
    enum_values:       ['owner', 'broker', 'builder'],
    default_operation: 'REPLACE',
    service_scope:     'both',
    description:       'Who listed the property. Orchestrator maps to contact_person_id codes.',
    examples: [
      { user_says: 'owner listed only', filter_delta: { listed_by: 'owner' } },
      { user_says: 'no brokers', filter_delta: { listed_by: 'owner' } },
      { user_says: 'direct from builder', filter_delta: { listed_by: 'builder' } },
    ],
    wire_transform: 'CONTACT_PERSON_ID[value]',  // { owner: 4, broker: 1, builder: 3 }
    clear_on_pivot_to: [],
  },
  {
    key:               'search_type',
    khoj_param:        'search_type',
    type:              'string',
    enum_values:       ['project', 'resale'],
    default_operation: 'REPLACE',
    service_scope:     'buy',
    description:       'Limit to new-launch projects or resale flats only.',
    examples: [
      { user_says: 'new project only', filter_delta: { search_type: 'project' } },
      { user_says: 'resale flat', filter_delta: { search_type: 'resale' } },
    ],
    clear_on_pivot_to: [],
  },
  {
    key:               'is_rera_verified',
    khoj_param:        'is_rera_verified',
    type:              'boolean',
    default_operation: 'REPLACE',
    service_scope:     'buy',
    description:       'Filter to RERA-registered properties only.',
    examples: [
      { user_says: 'RERA certified only', filter_delta: { is_rera_verified: true } },
    ],
    clear_on_pivot_to: [],
  },
  {
    key:               'paid',
    khoj_param:        'paid',
    type:              'boolean',
    default_operation: 'REPLACE',
    service_scope:     'both',
    description:       'true = premium/paid listings only; false = exclude premium. Default: both.',
    examples: [],
    clear_on_pivot_to: [],
  },

  // ── Price Filters ────────────────────────────────────────────────────
  {
    key:               'price_min',
    khoj_param:        'min_price',
    type:              'number',
    default_operation: 'REPLACE',
    service_scope:     'both',
    description:       'Minimum property price in INR (buy: crores-range; rent: monthly rent).',
    examples: [
      { user_says: 'at least 60 lakhs', filter_delta: { price_min: 6000000, price_max: null } },
    ],
    clear_on_pivot_to: ['locality_research', 'project_research', 'comparison'],
  },
  {
    key:               'price_max',
    khoj_param:        'max_price',
    type:              'number',
    default_operation: 'REPLACE',
    service_scope:     'both',
    description:       'Maximum property price in INR. Cleared on service switch if inconsistent with new service.',
    examples: [
      { user_says: 'under 80 lakhs', filter_delta: { price_max: 8000000 } },
      { user_says: 'any budget', filter_delta: { price_max: null, price_min: null } },  // RELAX
    ],
    clear_on_pivot_to: ['locality_research', 'project_research', 'comparison'],
  },
  {
    key:               'price_per_sqft',
    khoj_param:        null,               // derived — orchestrator converts to price_min/price_max
    type:              'number',
    default_operation: 'REPLACE',
    service_scope:     'buy',
    description:       'Price per sqft stated by user. ALWAYS buy context. Orchestrator calls convertPricePerSqftToAbsolute(). Output as separate key — NEVER conflate with price_min/price_max.',
    examples: [
      { user_says: '30K per sqft', filter_delta: { price_per_sqft: 30000, price_sqft_bound: 'max' } },
      { user_says: 'min 5000 per sqft', filter_delta: { price_per_sqft: 5000, price_sqft_bound: 'min' } },
    ],
    wire_transform: 'convertPricePerSqftToAbsolute(value, session.bhk)',
    clear_on_pivot_to: [],
  },

  // ── Area Filters ─────────────────────────────────────────────────────
  {
    key:               'area_min_sqft',
    khoj_param:        'min_area',
    type:              'number',
    default_operation: 'REPLACE',
    service_scope:     'both',
    description:       'Minimum carpet/built-up area in sqft.',
    examples: [
      { user_says: 'at least 1200 sqft', filter_delta: { area_min_sqft: 1200 } },
    ],
    clear_on_pivot_to: [],
  },
  {
    key:               'area_max_sqft',
    khoj_param:        'max_area',
    type:              'number',
    default_operation: 'REPLACE',
    service_scope:     'both',
    description:       'Maximum carpet/built-up area in sqft.',
    examples: [
      { user_says: 'under 900 sqft', filter_delta: { area_max_sqft: 900 } },
    ],
    clear_on_pivot_to: [],
  },

  // ── Availability Filters ─────────────────────────────────────────────
  {
    key:               'possession_by',
    khoj_param:        'max_poss',
    type:              'integer',
    default_operation: 'REPLACE',
    service_scope:     'buy',
    description:       'Maximum months to possession. For buy only.',
    examples: [
      { user_says: 'ready in 2 years', filter_delta: { possession_by: 24 } },
      { user_says: 'possession by 2026', filter_delta: { possession_by: 12 } },  // orchestrator calculates months from current date
    ],
    clear_on_pivot_to: [],
  },
  {
    key:               'max_available_in',
    khoj_param:        'available_from',
    type:              'integer',
    default_operation: 'REPLACE',
    service_scope:     'rent',
    description:       'Rent only: available within N days from today.',
    examples: [
      { user_says: 'available now', filter_delta: { max_available_in: 0 } },
      { user_says: 'available next month', filter_delta: { max_available_in: 30 } },
    ],
    clear_on_pivot_to: [],
  },

  // ── Amenity Filters ──────────────────────────────────────────────────
  {
    key:               'amenities',
    khoj_param:        null,               // each amenity maps to its own boolean Khoj key
    type:              'array',
    enum_values:       ['gym', 'swimming_pool', 'parking', 'lift', 'power_backup',
                        'security', 'club_house', 'garden', 'play_area',
                        'school_nearby', 'metro_nearby', 'hospital_nearby'],
    default_operation: 'ADD',              // amenities accumulate by default
    service_scope:     'both',
    description:       'Amenity preferences. Orchestrator maps each to individual Khoj boolean keys. ADD by default — new amenities append to the existing list.',
    examples: [
      { user_says: 'with gym and pool', filter_delta: { amenities: ['gym', 'swimming_pool'] } },
      { user_says: 'also need parking', filter_delta: { amenities: ['gym', 'swimming_pool', 'parking'] } },  // ADD
      { user_says: 'skip the pool', filter_delta: { amenities: ['gym', 'parking'] } },  // REMOVE
    ],
    wire_transform: 'AMENITY_TO_KHOJ_KEY[value]',  // { gym: 'gym', swimming_pool: 'pool', ... }
    clear_on_pivot_to: ['locality_research', 'project_research', 'comparison'],
  },

  // ── Proximity / Location Anchor ──────────────────────────────────────
  {
    key:               'search_anchor',
    khoj_param:        null,               // resolves to lat+long+outer_radius in Khoj
    type:              'string',
    default_operation: 'REPLACE',
    service_scope:     'both',
    description:       'Named POI as proximity anchor for explore_nearby. Orchestrator calls resolveLandmarkAnchor() → lat/lng → Khoj lat+long+outer_radius.',
    examples: [
      { user_says: 'near Manyata Tech Park', filter_delta: { search_anchor: 'Manyata Tech Park' } },
      { user_says: 'close to Hiranandani Hospital', filter_delta: { search_anchor: 'Hiranandani Hospital' } },
    ],
    wire_transform: 'resolveLandmarkAnchor(value)',
    clear_on_pivot_to: ['locality_research', 'project_research', 'comparison'],
  },
  {
    key:               'user_location_needed',
    khoj_param:        null,               // triggers client-side location request
    type:              'boolean',
    default_operation: 'REPLACE',
    service_scope:     'both',
    description:       'Set to true when user refers to their live location ("near me", "around me"). Orchestrator emits a get_location WS frame to the client.',
    examples: [
      { user_says: 'properties near me', filter_delta: { user_location_needed: true } },
    ],
    wire_transform: 'emit get_location WS frame',
    clear_on_pivot_to: [],
  },
];
```

### Derived Functions

```typescript
export function getFilterRecord(key: string): FilterRecord | undefined {
  return FILTER_REGISTRY.find(f => f.key === key);
}

// Replaces hardcoded khoj param names scattered across API translation code:
export function getKhojParam(filterKey: string): string | null {
  return getFilterRecord(filterKey)?.khoj_param ?? null;
}

// What filters should be cleared when pivoting to a new intent?
export function getFiltersToClearOnPivot(toIntent: string): string[] {
  return FILTER_REGISTRY
    .filter(f => f.clear_on_pivot_to?.includes(toIntent))
    .map(f => f.key);
}

// Build the filter_delta section of the SLM prompt from registry descriptions:
export function buildFilterDeltaBlock(): string {
  return FILTER_REGISTRY
    .filter(f => f.khoj_param !== null || f.wire_transform)
    .map(f => `  ${f.key}: ${f.description}\n  Examples: ${f.examples.map(e => `"${e.user_says}" → ${JSON.stringify(e.filter_delta)}`).join('; ')}`)
    .join('\n\n');
}
```

---

## Part 4 — Prompt Block Architecture

### File Structure

```
prompts/
├── slm/
│   ├── composer.ts           ← SLMPromptComposer implementation
│   └── blocks/
│       ├── 00-role.md        ← Static. Who the SLM is and what it must not do.
│       ├── 01-rule-engine.md ← Static. Rules 0–7 text verbatim.
│       ├── 02-intent-taxonomy.md.tmpl  ← Template. {{ intent_blocks }} injected from INTENT_REGISTRY.
│       ├── 03-filter-delta-rules.md.tmpl ← Template. {{ filter_blocks }} from FILTER_REGISTRY.
│       ├── 04-implicit-derivation.md  ← Static. Landmark anchor, price-per-sqft, tone signals.
│       ├── 05-output-schema.md        ← Static. Output JSON format spec, field rules.
│       └── examples/
│           ├── property_search.md     ← Positive + negative examples for property_search.
│           ├── property_detail.md
│           ├── locality_research.md
│           ├── comparison.md
│           ├── multi_intent.md
│           └── out_of_scope.md
│
└── llm/
    ├── composer.ts           ← LLMPromptComposer implementation
    └── blocks/
        ├── 00-identity.md             ← Static. Cached. "You are Housing Assistant..."
        ├── 01-domain-guard.md         ← Static. Cached. What the bot will/won't do.
        ├── 02-safety.md               ← Static. Cached. Content safety rules.
        ├── 03-factual-constraints.md  ← Static. Cached. No hallucination, no URLs, etc.
        ├── 04-tool-use-rules.md       ← Static. Cached. Parallel calls, confirmation, etc.
        ├── 05-output-format.md        ← Static. Cached. Response style, followup chips.
        ├── 06-tool-definitions.md.tmpl ← Template. {{ tool_definitions }} from TOOL_REGISTRY.
        ├── 07-session-context.md.tmpl  ← Template. {{ session_state }} injected per request.
        └── examples/
            ├── property_search.md
            ├── property_detail.md
            ├── comparison.md
            └── calculator.md
```

### Block Responsibilities

| Block | Static / Template | Prompt Cache? | Responsibility |
|---|---|---|---|
| `slm/00-role.md` | Static | Yes | SLM role definition, hard no-gos (no suggestions, no injection execution) |
| `slm/01-rule-engine.md` | Static | Yes | Rules 0–7 ordered, with examples per rule |
| `slm/02-intent-taxonomy.md.tmpl` | Template | Yes (stable) | Full intent list generated from INTENT_REGISTRY.description fields |
| `slm/03-filter-delta-rules.md.tmpl` | Template | Yes (stable) | filter_delta semantics + per-filter examples from FILTER_REGISTRY |
| `slm/04-implicit-derivation.md` | Static | Yes | Tone-based signals, price/sqft derivation, proximity anchor logic |
| `slm/05-output-schema.md` | Static | Yes | Output JSON schema, field rules, multi-intent variant |
| `slm/examples/*.md` | Static | Yes | 5–10 positive + 3–5 negative examples per intent cluster |
| `llm/00-identity.md` | Static | Yes | Bot persona, language detection, tone |
| `llm/01-domain-guard.md` | Static | Yes | What the bot answers and refuses |
| `llm/02-safety.md` | Static | Yes | Out-of-domain, injection attempts, vulgar content handling |
| `llm/03-factual-constraints.md` | Static | Yes | No memory-based facts, tool-only facts, no URLs |
| `llm/04-tool-use-rules.md` | Static | Yes | One searchProperties call, parallel calls, confirmation before write |
| `llm/05-output-format.md` | Static | Yes | Verb-first sentence, no tables, response length, chip format |
| `llm/06-tool-definitions.md.tmpl` | Template | Yes (per intent set) | Tools scoped to sub_intent, generated from TOOL_REGISTRY |
| `llm/07-session-context.md.tmpl` | Template | No (per request) | Active filters, city, service, viewed properties, intent context |
| `llm/examples/*.md` | Static | Yes | 3–5 complete turn examples with tool calls and expected output |

### Prompt Composer Interfaces

```typescript
// ── SLM Prompt Composer ─────────────────────────────────────────────────

interface SLMContext {
  conversation_history: ConversationTurn[];   // last 3 turns
  previous_intent: { main_intent: string; sub_intent: string } | null;
  active_filters: Partial<SessionFilters>;    // compact current filter state
  user_message: string;                       // raw user input
}

interface SLMPromptComposer {
  build(context: SLMContext): string;
  // Returns fully assembled SLM system prompt.
  // Sections 00–05 + examples are cached on cold start.
  // Template blocks (02, 03) are pre-rendered from registries at startup.
}

// ── LLM Prompt Composer ─────────────────────────────────────────────────

interface LLMContext {
  main_intent: string;
  sub_intent: string;
  session: SessionState;
  turn_count: number;
  has_session_summary: boolean;
  session_summary?: string;
}

interface LLMPromptComposer {
  build(context: LLMContext): {
    system: string;
    tool_definitions: object[];
    cache_breakpoints: number[];  // byte offsets where prompt cache checkpoints sit
  };
  // Blocks 00–05 are static → always cached.
  // Block 06 varies by sub_intent tool set → separate cache per intent group.
  // Block 07 is per-request → never cached.
}
```

### Template Rendering Rules

1. **Template blocks are pre-rendered at startup** from the registry, not on every request. The rendered string is the static input to the prompt cache.
2. **Registry changes require re-render + cache invalidation.** Add `registry_hash` to cache key — a SHA256 of the registry JSON triggers re-render when either registry changes.
3. **Examples are appended after the corresponding block** they illustrate. They are part of the same cached section.
4. **`07-session-context.md.tmpl` is never cached** — it changes every request. It is the only dynamic section.

---

## Part 5 — Middleware Pipeline

### Interface

```typescript
interface PipelineContext {
  // Input
  raw_message:   string;
  session:       SessionState;

  // Set by SafetyMiddleware
  safety_result?: ContentCheckResult;

  // Set by NormalizationMiddleware
  normalized_message?: string;
  pre_parsed?: { bhk?: number[], price_min?: number, price_max?: number, price_per_sqft?: number };

  // Set by ClassificationMiddleware
  classification?: SLMOutput;

  // Set by FilterApplyMiddleware
  filter_delta_applied?: boolean;

  // Set by SanitizationMiddleware
  sanitized?: boolean;

  // Set by DerivationMiddleware
  derived_filters?: Partial<SessionFilters>;  // price range from per-sqft, lat/lng from anchor

  // Set by ClarificationMiddleware
  clarification_emitted?: boolean;

  // Set by EntityResolutionMiddleware
  resolved_entities?: Record<string, ResolvedEntity>;

  // Set by RoutingMiddleware
  routing?: RoutingDecision;

  // Set by PromptBuildMiddleware
  system_prompt?: string;
  tool_definitions?: object[];

  // Set by LLMMiddleware
  llm_response?: LLMResponse;
  tool_results?: ToolResult[];

  // Set by OutputValidationMiddleware
  validated_text?: string;

  // Set by ResponseMiddleware
  bot_response?: BotComplete;
}

type MiddlewareFn = (ctx: PipelineContext, next: () => Promise<void>) => Promise<void>;

interface Pipeline {
  use(middleware: MiddlewareFn): void;
  run(ctx: PipelineContext): Promise<void>;
}
```

### Pipeline Steps and Responsibilities

```typescript
const pipeline = new Pipeline();

// ── 1. SafetyMiddleware ────────────────────────────────────────────────
// Tier 0. Regex-only — no AI.
// Input:  ctx.raw_message
// Output: ctx.safety_result
// Short-circuits: if blocked, emit bot_complete with canned response and return.
pipeline.use(async (ctx, next) => {
  ctx.safety_result = checkContentSafety(ctx.raw_message);
  if (ctx.safety_result.blocked) {
    ctx.bot_response = cannedSafetyResponse(ctx.safety_result.reason);
    return;  // stop pipeline
  }
  await next();
});

// ── 2. NormalizationMiddleware ─────────────────────────────────────────
// Deterministic parsing that should never go to AI.
// Input:  ctx.raw_message
// Output: ctx.normalized_message, ctx.pre_parsed
// Runs:   BHK regex, price suffix normalisation, per-sqft detection, unit detection
pipeline.use(async (ctx, next) => {
  ctx.normalized_message = normalizeText(ctx.raw_message);
  ctx.pre_parsed = {
    bhk:           extractBHK(ctx.raw_message),         // "2BHK", "2 bedroom" → [2]
    price_min:     extractPriceMin(ctx.raw_message),    // "above 50L" → 5000000
    price_max:     extractPriceMax(ctx.raw_message),    // "under 80L" → 8000000
    price_per_sqft: detectPricePerSqft(ctx.raw_message), // "30K/sqft" → 30000
  };
  await next();
});

// ── 3. ClassificationMiddleware ────────────────────────────────────────
// SLM call (Gemini 2.0 Flash). ≤150ms budget.
// Input:  ctx.normalized_message, ctx.pre_parsed, ctx.session (last 3 turns + active_filters)
// Output: ctx.classification (main_intent, sub_intent, entities_mentioned, filter_delta,
//                              multi_intent, pivot, clarification_needed, reasoning)
pipeline.use(async (ctx, next) => {
  ctx.classification = await callSLM({
    message: ctx.normalized_message,
    pre_parsed: ctx.pre_parsed,
    history: ctx.session.last_3_turns,
    previous_intent: ctx.session.last_intent,
    active_filters: compactFilters(ctx.session.active_filters),
  });
  await next();
});

// ── 4. FilterApplyMiddleware ────────────────────────────────────────────
// Merge filter_delta into session.active_filters.
// Input:  ctx.classification.filter_delta, ctx.session.active_filters
// Output: mutates ctx.session.active_filters; sets ctx.filter_delta_applied
pipeline.use(async (ctx, next) => {
  if (ctx.classification?.filter_delta) {
    applyFilterDelta(ctx.session, ctx.classification.filter_delta);
    ctx.filter_delta_applied = true;
  }
  await next();
});

// ── 5. SanitizationMiddleware ──────────────────────────────────────────
// Runs sanitizeFiltersOnPivot() when the intent changed.
// Input:  ctx.classification.pivot, ctx.session
// Output: mutates ctx.session.active_filters (clears invalid cross-intent filters)
pipeline.use(async (ctx, next) => {
  if (ctx.classification?.pivot) {
    sanitizeFiltersOnPivot(ctx.classification, ctx.session);
    ctx.sanitized = true;
  }
  await next();
});

// ── 6. DerivationMiddleware ────────────────────────────────────────────
// Converts derived filter signals to concrete API params.
// Runs: convertPricePerSqftToAbsolute() and resolveLandmarkAnchor()
// Input:  ctx.session.active_filters (after delta + sanitization)
// Output: ctx.derived_filters, mutates ctx.session.active_filters
pipeline.use(async (ctx, next) => {
  const derived: Partial<SessionFilters> = {};
  if (ctx.session.active_filters.price_per_sqft) {
    const range = convertPricePerSqftToAbsolute(
      ctx.session.active_filters.price_per_sqft,
      ctx.session.active_filters.price_sqft_bound,
      ctx.session.active_filters.bhk,
    );
    Object.assign(ctx.session.active_filters, range);
    delete ctx.session.active_filters.price_per_sqft;
    Object.assign(derived, range);
  }
  if (ctx.session.active_filters.search_anchor) {
    const anchor = await resolveLandmarkAnchor(ctx.session.active_filters.search_anchor, ctx.session);
    ctx.session.active_filters.lat   = anchor.lat;
    ctx.session.active_filters.lng   = anchor.lng;
    ctx.session.active_filters.outer_radius = anchor.outer_radius_metres;
    delete ctx.session.active_filters.search_anchor;
    Object.assign(derived, anchor);
  }
  ctx.derived_filters = derived;
  await next();
});

// ── 7. ClarificationMiddleware ─────────────────────────────────────────
// Short-circuits if SLM signalled clarification_needed.
// Input:  ctx.classification.clarification_needed
// Output: emits nested_qna WS frame; stops pipeline.
pipeline.use(async (ctx, next) => {
  if (ctx.classification?.clarification_needed) {
    emitWsFrame(ctx.session.ws, {
      type: 'nested_qna',
      payload: ctx.classification.clarification_needed,
    });
    ctx.clarification_emitted = true;
    return;  // stop pipeline
  }
  await next();
});

// ── 8. EntityResolutionMiddleware ──────────────────────────────────────
// Pre-resolves entities before LLM call (~50ms via autosuggest).
// Input:  ctx.classification.entities_mentioned, ctx.session
// Output: ctx.resolved_entities, updates ctx.session.resolved_entity_map
pipeline.use(async (ctx, next) => {
  const intent = ctx.classification!;
  if (requiresPreResolution(intent.main_intent, intent.sub_intent) && intent.entities_mentioned?.length) {
    ctx.resolved_entities = await preResolveEntities(
      intent.entities_mentioned,
      ctx.session,
    );
    Object.assign(ctx.session.resolved_entity_map, ctx.resolved_entities);
  }
  await next();
});

// ── 9. RoutingMiddleware ────────────────────────────────────────────────
// Determines tier, model, tool set, auth check.
// Input:  ctx.classification, ctx.session, INTENT_REGISTRY
// Output: ctx.routing
pipeline.use(async (ctx, next) => {
  const { main_intent, sub_intent } = ctx.classification!;
  const record = getIntentRecord(main_intent, sub_intent);

  // Auth check for write-side or auth-required intents
  if (record?.requires_auth && !ctx.session.auth_token) {
    emitWsFrame(ctx.session.ws, { type: 'auth_required' });
    return;
  }

  ctx.routing = {
    tier:   record?.tier ?? '3b',
    model:  record?.model ?? 'sonnet',
    tools:  record?.tools ?? [],
  };

  // Tier 0/1/2 — handle without LLM
  if (ctx.routing.tier === 0) {
    ctx.bot_response = buildOutOfScopeResponse(ctx.classification!);
    return;
  }
  if (ctx.routing.tier === 1) {
    ctx.bot_response = await executeTier1Action(ctx);
    return;
  }
  if (ctx.routing.tier === 2) {
    ctx.bot_response = await executeTier2Action(ctx);
    return;
  }

  await next();
});

// ── 10. PromptBuildMiddleware ───────────────────────────────────────────
// Assembles system prompt + tool definitions for the LLM call.
// Input:  ctx.routing, ctx.session, INTENT_REGISTRY, TOOL_REGISTRY
// Output: ctx.system_prompt, ctx.tool_definitions
pipeline.use(async (ctx, next) => {
  const { system, tool_definitions } = LLMPromptComposer.build({
    main_intent: ctx.classification!.main_intent,
    sub_intent:  ctx.classification!.sub_intent,
    session:     ctx.session,
    turn_count:  ctx.session.turn_count,
    has_session_summary: !!ctx.session.summary,
    session_summary: ctx.session.summary,
  });
  ctx.system_prompt    = system;
  ctx.tool_definitions = tool_definitions;
  await next();
});

// ── 11. LLMMiddleware ───────────────────────────────────────────────────
// Streaming Claude call. Handles tool use loop.
// Input:  ctx.system_prompt, ctx.tool_definitions, ctx.session.turn_history, ctx.routing.model
// Output: ctx.llm_response, ctx.tool_results
pipeline.use(async (ctx, next) => {
  ctx.llm_response = await streamLLM({
    model:       ctx.routing!.model === 'haiku' ? MODELS.haiku : MODELS.sonnet,
    system:      ctx.system_prompt!,
    messages:    ctx.session.turn_history,
    tools:       ctx.tool_definitions!,
    on_tool_use: async (tool, params) => {
      // Validate → translate → execute → return result
      const validation = validateToolCall(tool, params);
      if (!validation.valid) return buildMissingParamError(validation);
      const wired = translateToWireFormat(tool, params, ctx.session);
      return await executeToolWithCache(tool, wired);
    },
    on_chunk: (chunk) => emitWsFrame(ctx.session.ws, { type: 'bot_chunk', text: chunk }),
    on_tool_event: (msg) => emitWsFrame(ctx.session.ws, { type: 'bot_tool_event', message: msg }),
  });
  await next();
});

// ── 12. OutputValidationMiddleware ─────────────────────────────────────
// Strips prohibited content from LLM text output.
// Input:  ctx.llm_response.text
// Output: ctx.validated_text
pipeline.use(async (ctx, next) => {
  ctx.validated_text = validateBotOutput(ctx.llm_response!.text);
  await next();
});

// ── 13. ResponseMiddleware ──────────────────────────────────────────────
// Assembles bot_complete frame, persists to Kafka, updates session state.
// Input:  ctx.validated_text, ctx.tool_results, ctx.session
// Output: ctx.bot_response; emits bot_complete WS frame
pipeline.use(async (ctx, next) => {
  const cards = buildCardsFromToolResults(ctx.tool_results ?? [], ctx.classification!);
  ctx.bot_response = {
    type:  'bot_complete',
    text:  ctx.validated_text!,
    cards,
    intent: {
      main_intent: ctx.classification!.main_intent,
      sub_intent:  ctx.classification!.sub_intent,
    },
  };
  emitWsFrame(ctx.session.ws, ctx.bot_response);

  // Persist + update session state (non-blocking)
  void persistToKafka(ctx.session.session_id, ctx.bot_response);
  void updateSessionState(ctx.session, ctx.classification!, ctx.tool_results ?? []);
  await next();
});
```

### Middleware Invariants

| Middleware | Short-circuits? | Mutates session? | External I/O? |
|---|---|---|---|
| SafetyMiddleware | Yes (blocked) | No | No |
| NormalizationMiddleware | No | No | No |
| ClassificationMiddleware | No | No | Yes (Gemini) |
| FilterApplyMiddleware | No | Yes (filters) | No |
| SanitizationMiddleware | No | Yes (filters) | No |
| DerivationMiddleware | No | Yes (filters) | Yes (autosuggest for anchor) |
| ClarificationMiddleware | Yes (clarify) | No | No (WS emit) |
| EntityResolutionMiddleware | No | Yes (entity map) | Yes (autosuggest) |
| RoutingMiddleware | Yes (0/1/2) | No | Yes (tier 1/2 actions) |
| PromptBuildMiddleware | No | No | No |
| LLMMiddleware | No | No | Yes (Claude, tool APIs) |
| OutputValidationMiddleware | No | No | No |
| ResponseMiddleware | No | Yes (turn list) | Yes (Kafka, Redis) |

---

## Part 6 — Before / After: What Changes

### Before: validateToolCall

```typescript
// Before: required params hardcoded, duplicated from tool schema
function validateToolCall(tool, params) {
  const requiredParams = {
    searchProperties:  ['filters'],
    getPropertyDetail: ['property_id'],
    getPriceTrends:    ['locality', 'city', 'transaction_type'],
    resolveEntity:     ['raw_name', 'entity_type'],
    contactSeller:     ['property_id', 'seller_id'],
    calculateEMI:      ['property_price'],
    // ... manually maintained list
  };
}
```

```typescript
// After: derived from TOOL_REGISTRY — no duplication
function validateToolCall(tool, params) {
  const required = getRequiredParams(tool);  // from TOOL_REGISTRY
  const missing = required.filter(k => !params[k]);
  // custom multi-field validations remain (calculateAffordability, getNearbyLandmarks, convertUnit)
  // but required param lists live in one place
}
```

### Before: TOOLS_BY_INTENT

```typescript
// Before: 8 separate maps, all manually kept in sync
const TOOLS_BY_INTENT = {
  filter_search:      ['searchProperties', 'resolveEntity'],
  explore_nearby:     ['searchProperties'],
  property_about:     ['getPropertyDetail', 'getNearbyLandmarks'],
  // ...
};
const TOOLS_BY_SUBINTENT_HAIKU = { ... };  // copy #2
const DIRECT_INTENT_MAP = { ... };          // copy #3
function deriveRoutingTier(intent) { ... }  // copy #4
function selectTier3Model(intent) { ... }   // copy #5
```

```typescript
// After: one source, four derived functions
getToolsForIntent(main, sub)   // replaces TOOLS_BY_INTENT + TOOLS_BY_SUBINTENT_HAIKU
getTierForIntent(main, sub)    // replaces deriveRoutingTier()
getModelForIntent(main, sub)   // replaces selectTier3Model()
requiresAuth(main, sub)        // replaces inline auth checks
```

### Before: sanitizeFiltersOnPivot

```typescript
// Before: filter keys hardcoded inline
function sanitizeFiltersOnPivot(classification, session) {
  if (pivot_to === 'locality_research') {
    delete session.active_filters.bhk;          // hardcoded
    delete session.active_filters.price_min;    // hardcoded
    delete session.active_filters.price_max;    // hardcoded
    // ... more hardcoded keys
  }
}
```

```typescript
// After: derived from FILTER_REGISTRY
function sanitizeFiltersOnPivot(classification, session) {
  const to_intent = `${classification.main_intent}`;
  const keys_to_clear = getFiltersToClearOnPivot(to_intent);  // from FILTER_REGISTRY
  keys_to_clear.forEach(k => delete session.active_filters[k]);
}
```

### Before: Adding a new intent (8 places)

```
1. classifier prompt taxonomy section
2. TOOLS_BY_INTENT
3. TOOLS_BY_SUBINTENT_HAIKU
4. DIRECT_INTENT_MAP
5. buildSessionStateBlock()
6. deriveRoutingTier()
7. selectTier3Model()
8. sanitizeFiltersOnPivot()
```

### After: Adding a new intent (1 place + 1 prompt block example)

```
1. INTENT_REGISTRY — add one IntentRecord
2. prompts/slm/examples/<intent>.md — add examples for the new intent
   (The intent taxonomy in the SLM prompt rebuilds from the registry automatically)
```

### Before: Adding a new filter (4 places)

```
1. SLM prompt filter_delta section
2. searchProperties input schema in system prompt
3. validateToolCall required params
4. Khoj API translation table
```

### After: Adding a new filter (1 place)

```
1. FILTER_REGISTRY — add one FilterRecord
   (SLM prompt filter block, Khoj param mapping, validation all derive from it automatically)
```

---

## Part 7 — Prompt Versioning & Metrics

Each prompt block file carries a frontmatter header:

```yaml
---
block_id: slm/01-rule-engine
version: 1.2.0
last_modified: 2026-05-20
metrics:
  target_accuracy: 0.95        # classification accuracy on eval set
  eval_set: tests/slm/eval/rule_engine_cases.jsonl
  passing_threshold: 0.92      # CI fails below this
---
```

### Evaluation Hooks

```typescript
// Each block has a corresponding eval set:
// tests/slm/eval/<block_id>.jsonl
// Format: { input: SLMContext, expected_output: SLMOutput, notes: string }

// Running evals:
npm run eval:slm          // run all SLM block evals
npm run eval:slm -- --block rule-engine   // run one block
npm run eval:llm          // run LLM response evals

// CI gate: evals run on every PR that touches prompts/ or registries/
// Blocks with version bump require eval passing before merge
```

### Block Change Policy

| Change type | Requires | Version bump |
|---|---|---|
| Fix typo / clarify wording | Eval run | Patch (1.2.0 → 1.2.1) |
| Add/modify example | Eval run | Minor (1.2.1 → 1.3.0) |
| Add new rule or intent | Full eval + review | Minor |
| Restructure rule order | Full eval + A/B test | Major (1.3.0 → 2.0.0) |

---

## Summary: Where Things Live Now

| Question | Answer |
|---|---|
| What intents exist? | `INTENT_REGISTRY` |
| What tier/model does an intent use? | `INTENT_REGISTRY.tier` + `INTENT_REGISTRY.model` |
| What tools does an intent use? | `INTENT_REGISTRY.tools` |
| What filters clear on pivot? | `INTENT_REGISTRY.clear_keys` + `FILTER_REGISTRY.clear_on_pivot_to` |
| What tools exist and what params do they need? | `TOOL_REGISTRY` |
| How do tools map to backend APIs? | `TOOL_REGISTRY.api_backend` + `ToolRecord.input_params.wire_param` |
| What filter keys exist and how do they map to Khoj? | `FILTER_REGISTRY` |
| What are the operation semantics for a filter? | `FILTER_REGISTRY.default_operation` |
| What does the SLM system prompt say? | `prompts/slm/blocks/` |
| What does the LLM system prompt say? | `prompts/llm/blocks/` |
| How is the request processed step by step? | Middleware pipeline in this doc |
