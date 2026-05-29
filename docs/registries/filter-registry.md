# Filter Registry

Filter keys, ADD/REPLACE semantics, enum values, and Khoj wire names. Generated into the SLM filter-delta rules at startup.

---

## Part 3 — FILTER_REGISTRY

### Python Schema

```python
from pydantic import BaseModel
from typing import Literal, Optional

FilterOperation = Literal['REPLACE', 'ADD', 'REMOVE', 'RELAX']
ServiceScope    = Literal['buy', 'rent', 'both']

class FilterExample(BaseModel):
    user_says:    str
    filter_delta: dict

class FilterRecord(BaseModel):
    key:               str                # semantic name used in filter_delta and session state; this is what the SLM outputs
    khoj_param:        str | None         # orchestrator-only: actual query param name sent to Khoj API. Never appears in any prompt.
    type:              Literal['string', 'integer', 'number', 'boolean', 'array', 'range']
    enum_values:       Optional[list[str]] = None  # for string/array enum types
    default_operation: FilterOperation
    service_scope:     ServiceScope
    description:       str                # SLM-visible: semantic intent only. Never include backend param names, khoj_param values, or internal function names. khoj_param and wire_transform are orchestrator-only.
    examples:          list[FilterExample]
    clear_on_pivot_to: Optional[list[str]] = None  # intents that clear this filter when pivoting TO them
    wire_transform:    Optional[str] = None         # orchestrator-only: code expression to convert semantic value to Khoj wire value
```

### Full Registry Population

```python
FILTER_REGISTRY: list[FilterRecord] = [

  # ── Core Search Context ─────────────────────────────────────────────
  FilterRecord(
    key='transaction_type',
    khoj_param='service',
    type='string',
    enum_values=['buy', 'rent'],
    default_operation='REPLACE',
    service_scope='both',
    description='Buy or rent. ONLY from explicit words: "rent", "buy", "kiraaye", "khareedna". NEVER from price magnitude.',
    examples=[
      FilterExample(user_says='looking to rent',    filter_delta={'transaction_type': 'rent'}),
      FilterExample(user_says='30K per month',      filter_delta={'transaction_type': 'rent', 'price_max': 30000}),  # explicit "per month" = rent signal
      FilterExample(user_says='flat for 30K/sqft',  filter_delta={'price_per_sqft': 30000}),  # no service switch
    ],
    clear_on_pivot_to=[],
  ),
  FilterRecord(
    key='city',
    khoj_param='city',
    type='string',
    default_operation='REPLACE',
    service_scope='both',
    description='City name. When changed, always also output localities: None to clear stale locality filters.',
    examples=[
      FilterExample(user_says='show in Delhi',    filter_delta={'city': 'Delhi',     'localities': None}),
      FilterExample(user_says='Bangalore flats',  filter_delta={'city': 'Bangalore', 'localities': None}),
    ],
    clear_on_pivot_to=[],
  ),
  FilterRecord(
    key='localities',
    khoj_param='poly',             # Khoj uses locality UUIDs in poly param
    type='array',
    default_operation='REPLACE',
    service_scope='both',
    description='List of locality names. Cleared automatically on city change.',
    examples=[
      FilterExample(user_says='in Andheri',            filter_delta={'localities': ['Andheri']}),
      FilterExample(user_says='and Bandra as well',    filter_delta={'localities': ['Andheri', 'Bandra']}),  # ADD
      FilterExample(user_says='remove Andheri',        filter_delta={'localities': ['Bandra']}),             # REMOVE
      FilterExample(user_says='anywhere in the city',  filter_delta={'localities': None}),                   # RELAX
    ],
    wire_transform='resolve_locality_uuids(value)',  # orchestrator converts names to UUIDs
    clear_on_pivot_to=['locality_research', 'project_research', 'comparison'],
  ),

  # ── Property Characteristics ─────────────────────────────────────────
  FilterRecord(
    key='bhk',
    khoj_param='apartment_type_id',
    type='array',
    enum_values=['0', '1', '2', '3', '4', '5+', 'villa'],
    default_operation='REPLACE',
    service_scope='both',
    description='BHK count. "0" = Studio.',
    examples=[
      FilterExample(user_says='2BHK',        filter_delta={'bhk': [2]}),
      FilterExample(user_says='2 or 3BHK',   filter_delta={'bhk': [2, 3]}),
      FilterExample(user_says='also 3BHK',   filter_delta={'bhk': [2, 3]}),  # ADD — SLM outputs merged list
    ],
    wire_transform='BHK_TO_APT_TYPE_ID[value]',  # { 1rk→1, 1→2, 2→3, 3→4, 4→71, 5→72, '5+'→7 }
    clear_on_pivot_to=['locality_research', 'project_research', 'comparison'],
  ),
  FilterRecord(
    key='property_type',
    khoj_param='property_type_id',
    type='array',
    enum_values=['apartment', 'independent_house', 'independent_floor', 'villa', 'plot', 'studio', 'duplex', 'penthouse'],
    default_operation='REPLACE',
    service_scope='both',
    description='"apartment" is default and most common. "independent_house" and "villa" are standalone properties.',
    examples=[
      FilterExample(user_says='independent house',          filter_delta={'property_type': ['independent_house']}),
      FilterExample(user_says='villa or independent house', filter_delta={'property_type': ['villa', 'independent_house']}),
      FilterExample(user_says='builder floor Delhi',        filter_delta={'property_type': ['independent_floor'], 'city': 'Delhi', 'localities': None}),
    ],
    wire_transform='PROPERTY_TYPE_ID[value]',  # { apartment:1, independent_house:2, independent_floor:6, villa:38, plot:15, studio:10, duplex:5, penthouse:9 }
    clear_on_pivot_to=[],
  ),
  FilterRecord(
    key='furnishing',
    khoj_param='furnish_type_id',
    type='string',
    enum_values=['furnished', 'semi_furnished', 'unfurnished'],
    default_operation='REPLACE',
    service_scope='rent',
    description='Furnishing status. Primarily relevant for rent.',
    examples=[
      FilterExample(user_says='fully furnished only', filter_delta={'furnishing': 'furnished'}),
      FilterExample(user_says='avoid furnished',      filter_delta={'furnishing': None}),  # RELAX/REMOVE
    ],
    wire_transform='FURNISH_TYPE_ID[value]',  # { fully_furnished: 1, semi_furnished: 2, unfurnished: 3 }
    clear_on_pivot_to=['locality_research', 'project_research'],
  ),
  FilterRecord(
    key='construction_status',
    khoj_param='construction_type',
    type='array',
    enum_values=['new_launch', 'under_construction', 'ready_to_move'],
    default_operation='REPLACE',
    service_scope='buy',
    description='Construction stage. Relevant for buy only. Rent implies ready_to_move.',
    examples=[
      FilterExample(user_says='ready to move', filter_delta={'construction_status': ['ready_to_move']}),
      FilterExample(user_says='new launch',    filter_delta={'construction_status': ['new_launch']}),
      FilterExample(user_says='uc flat',       filter_delta={'construction_status': ['under_construction']}),
    ],
    clear_on_pivot_to=['locality_research', 'project_research', 'comparison'],
  ),
  FilterRecord(
    key='property_age',
    khoj_param='min_age',           # negative value convention: -5 = "built within last 5 years"
    type='string',
    enum_values=['less_than_1_year', 'less_than_3_years', 'less_than_5_years', 'more_than_5_years', 'more_than_10_years'],
    default_operation='REPLACE',
    service_scope='both',
    description='Age of the property. "less_than_5_years" covers "not more than 5 years old".',
    examples=[
      FilterExample(user_says='not more than 5 years old', filter_delta={'property_age': 'less_than_5_years'}),
      FilterExample(user_says='newly built',               filter_delta={'property_age': 'less_than_1_year'}),
      FilterExample(user_says='old building',              filter_delta={'property_age': 'more_than_10_years'}),
    ],
    wire_transform='PROPERTY_AGE_TO_KHOJ[value]',  # { less_than_1_year: {min_age:-1}, less_than_3_years: {min_age:-3}, less_than_5_years: {min_age:-5}, more_than_5_years: {max_age:-5}, more_than_10_years: {max_age:-10} }
    clear_on_pivot_to=[],
  ),
  FilterRecord(
    key='facing',
    khoj_param='facing',
    type='array',
    enum_values=['north', 'south', 'east', 'west', 'north-east', 'north-west', 'south-east', 'south-west'],
    default_operation='REPLACE',
    service_scope='both',
    description='Direction the main entrance or living area faces. North and east facing are commonly preferred. When user says "not south facing", output the directions they DO want, not a negation.',
    examples=[
      FilterExample(user_says='north facing flat',       filter_delta={'facing': ['north']}),
      FilterExample(user_says='east or north east facing', filter_delta={'facing': ['east', 'north-east']}),
      FilterExample(user_says='not south facing',        filter_delta={'facing': ['north', 'east', 'north-east', 'north-west']}),
    ],
    clear_on_pivot_to=[],
  ),
  FilterRecord(
    key='listed_by',
    khoj_param='contact_person_id',
    type='string',
    enum_values=['owner', 'broker', 'builder'],
    default_operation='REPLACE',
    service_scope='both',
    description='Who listed the property.',
    examples=[
      FilterExample(user_says='owner listed only',  filter_delta={'listed_by': 'owner'}),
      FilterExample(user_says='no brokers',         filter_delta={'listed_by': 'owner'}),
      FilterExample(user_says='direct from builder', filter_delta={'listed_by': 'builder'}),
    ],
    wire_transform='CONTACT_PERSON_ID[value]',  # { agent: 1, owner: 2, developer: 3 }
    clear_on_pivot_to=[],
  ),
  FilterRecord(
    key='search_type',
    khoj_param='search_type',
    type='string',
    enum_values=['project', 'resale'],
    default_operation='REPLACE',
    service_scope='buy',
    description='Limit to new-launch projects or resale flats only.',
    examples=[
      FilterExample(user_says='new project only', filter_delta={'search_type': 'project'}),
      FilterExample(user_says='resale flat',      filter_delta={'search_type': 'resale'}),
    ],
    clear_on_pivot_to=[],
  ),
  FilterRecord(
    key='is_rera_verified',
    khoj_param='is_rera_verified',
    type='boolean',
    default_operation='REPLACE',
    service_scope='buy',
    description='Filter to RERA-registered properties only.',
    examples=[
      FilterExample(user_says='RERA certified only', filter_delta={'is_rera_verified': True}),
    ],
    clear_on_pivot_to=[],
  ),
  FilterRecord(
    key='paid',
    khoj_param='paid',
    type='boolean',
    default_operation='REPLACE',
    service_scope='both',
    description='True = premium/paid listings only; False = exclude premium. Default: both.',
    examples=[],
    clear_on_pivot_to=[],
  ),

  # ── Price Filters ────────────────────────────────────────────────────
  FilterRecord(
    key='price_min',
    khoj_param='min_price',
    type='number',
    default_operation='REPLACE',
    service_scope='both',
    description='Minimum property price in INR (buy: crores-range; rent: monthly rent).',
    examples=[
      FilterExample(user_says='at least 60 lakhs', filter_delta={'price_min': 6000000, 'price_max': None}),
    ],
    clear_on_pivot_to=['locality_research', 'project_research', 'comparison'],
  ),
  FilterRecord(
    key='price_max',
    khoj_param='max_price',
    type='number',
    default_operation='REPLACE',
    service_scope='both',
    description='Maximum property price in INR. Cleared on service switch if inconsistent with new service.',
    examples=[
      FilterExample(user_says='under 80 lakhs', filter_delta={'price_max': 8000000}),
      FilterExample(user_says='any budget',     filter_delta={'price_max': None, 'price_min': None}),  # RELAX
    ],
    clear_on_pivot_to=['locality_research', 'project_research', 'comparison'],
  ),
  FilterRecord(
    key='price_per_sqft',
    khoj_param=None,               # derived — orchestrator converts to price_min/price_max
    type='number',
    default_operation='REPLACE',
    service_scope='buy',
    description='Price per sqft stated by user. ALWAYS buy context. Output as separate key — NEVER conflate with price_min/price_max.',
    examples=[
      FilterExample(user_says='30K per sqft',       filter_delta={'price_per_sqft': 30000, 'price_sqft_bound': 'max'}),
      FilterExample(user_says='min 5000 per sqft',  filter_delta={'price_per_sqft': 5000,  'price_sqft_bound': 'min'}),
    ],
    wire_transform='convert_price_per_sqft_to_absolute(value, session.bhk)',
    clear_on_pivot_to=[],
  ),

  # ── Area Filters ─────────────────────────────────────────────────────
  FilterRecord(
    key='area_min_sqft',
    khoj_param='min_area',
    type='number',
    default_operation='REPLACE',
    service_scope='both',
    description='Minimum carpet/built-up area in sqft.',
    examples=[
      FilterExample(user_says='at least 1200 sqft', filter_delta={'area_min_sqft': 1200}),
    ],
    clear_on_pivot_to=[],
  ),
  FilterRecord(
    key='area_max_sqft',
    khoj_param='max_area',
    type='number',
    default_operation='REPLACE',
    service_scope='both',
    description='Maximum carpet/built-up area in sqft.',
    examples=[
      FilterExample(user_says='under 900 sqft', filter_delta={'area_max_sqft': 900}),
    ],
    clear_on_pivot_to=[],
  ),

  # ── Availability Filters ─────────────────────────────────────────────
  FilterRecord(
    key='possession_by',
    khoj_param='max_poss',
    type='integer',
    default_operation='REPLACE',
    service_scope='buy',
    description='Maximum months to possession. For buy only.',
    examples=[
      FilterExample(user_says='ready in 2 years',     filter_delta={'possession_by': 24}),
      FilterExample(user_says='possession by 2026',   filter_delta={'possession_by': 12}),  # orchestrator calculates months from current date
    ],
    clear_on_pivot_to=[],
  ),
  FilterRecord(
    key='max_available_in',
    khoj_param='available_from',
    type='integer',
    default_operation='REPLACE',
    service_scope='rent',
    description='Rent only: available within N days from today.',
    examples=[
      FilterExample(user_says='available now',        filter_delta={'max_available_in': 0}),
      FilterExample(user_says='available next month', filter_delta={'max_available_in': 30}),
    ],
    clear_on_pivot_to=[],
  ),

  # ── Amenity Filters ──────────────────────────────────────────────────
  FilterRecord(
    key='amenities',
    khoj_param=None,               # each amenity maps to its own boolean param inside outside_amenities
    type='array',
    enum_values=['swimming_pool', 'gym', 'parking', 'lift', 'gated_community',
                 'gas_pipeline', 'power_backup', 'club_house'],
    default_operation='ADD',              # amenities accumulate by default
    service_scope='both',
    description='Amenity preferences. ADD by default — new amenities append to the existing list.',
    examples=[
      FilterExample(user_says='with gym and pool',  filter_delta={'amenities': ['gym', 'swimming_pool']}),
      FilterExample(user_says='also need parking',  filter_delta={'amenities': ['gym', 'swimming_pool', 'parking']}),  # ADD
      FilterExample(user_says='skip the pool',      filter_delta={'amenities': ['gym', 'parking']}),                   # REMOVE
    ],
    wire_transform='AMENITY_TO_OUTSIDE_AMENITIES_KEY[value]',  # { swimming_pool: "has_swimming_pool", gym: "has_gym", parking: "has_parking", lift: "has_lift", gated_community: "is_gated_community", gas_pipeline: "has_gas_pipeline", power_backup: "has_power_backup", club_house: "has_club_house" }
    clear_on_pivot_to=['locality_research', 'project_research', 'comparison'],
  ),

  # ── Proximity / Location Anchor ──────────────────────────────────────
  FilterRecord(
    key='search_anchor',
    khoj_param=None,               # resolves to lat+long+outer_radius in Khoj
    type='string',
    default_operation='REPLACE',
    service_scope='both',
    description='Named POI as proximity anchor for explore_nearby.',
    examples=[
      FilterExample(user_says='near Manyata Tech Park',     filter_delta={'search_anchor': 'Manyata Tech Park'}),
      FilterExample(user_says='close to Hiranandani Hospital', filter_delta={'search_anchor': 'Hiranandani Hospital'}),
    ],
    wire_transform='resolve_landmark_anchor(value)',
    clear_on_pivot_to=['locality_research', 'project_research', 'comparison'],
  ),
  FilterRecord(
    key='user_location_needed',
    khoj_param=None,               # triggers client-side location request
    type='boolean',
    default_operation='REPLACE',
    service_scope='both',
    description='Set to True when user refers to their live location ("near me", "around me"). derive_node short-circuits and emits a share_location template (FE renders location permission button). User grants permission → sends location_shared action with coordinates in the next POST.',
    examples=[
      FilterExample(user_says='properties near me', filter_delta={'user_location_needed': True}),
    ],
    wire_transform='derive_node short-circuit → share_location template → client sends location_shared action with coordinates',
    clear_on_pivot_to=[],
  ),
  FilterRecord(
    key              = 'similarity_by',
    type             = 'string',
    enum_values      = ['price', 'locality', 'overall', 'owner_only'],
    default_operation= 'REPLACE',
    khoj_param       = 'similarity_variant',   # wire name differs from SLM output key
    service_scope    = 'both',
    clear_on_pivot_to= ['property_search', 'locality_research'],
    description      = 'Similarity dimension for getSimilarProperties. Injected from filter_delta.',
  ),
  FilterRecord(
    key              = 'srset_id',
    type             = 'string',
    enum_values      = [],
    default_operation= 'REPLACE',
    khoj_param       = 'srset_id',
    service_scope    = 'both',
    clear_on_pivot_to= [],   # cleared by sanitize_filters_on_pivot when city changes
    description      = 'Search result set ID from the last searchProperties call. Used for pagination and locality-aware ranking. Cleared when city changes.',
  ),
  FilterRecord(
    key              = 'price_sqft_bound',
    type             = 'string',
    enum_values      = ['min', 'max', 'exact'],
    default_operation= 'REPLACE',
    khoj_param       = None,   # internal — consumed by derive_node, not passed to Khoj
    service_scope    = 'both',
    clear_on_pivot_to= ['locality_research', 'project_research', 'portfolio'],
    description      = 'Direction modifier for price_per_sqft. "max" = user stated an upper bound; "min" = lower bound; "exact" = specific per-sqft price. Consumed by derive_node to convert to absolute price_max/price_min.',
  ),
]
```

### Derived Functions

```python
import json

def get_filter_record(key: str) -> FilterRecord | None:
    return next((f for f in FILTER_REGISTRY if f.key == key), None)

# Replaces hardcoded khoj param names scattered across API translation code:
def get_khoj_param(filter_key: str) -> str | None:
    rec = get_filter_record(filter_key)
    return rec.khoj_param if rec else None

# What filters should be cleared when pivoting to a new intent?
def get_filters_to_clear_on_pivot(to_intent: str) -> list[str]:
    return [
        f.key for f in FILTER_REGISTRY
        if f.clear_on_pivot_to and to_intent in f.clear_on_pivot_to
    ]

# Build the filter_delta section of the SLM prompt from registry descriptions:
def build_filter_delta_block() -> str:
    lines = []
    for f in FILTER_REGISTRY:
        if f.khoj_param is not None or f.wire_transform:
            examples_str = '; '.join(
                f'"{e.user_says}" → {json.dumps(e.filter_delta)}'
                for e in f.examples
            )
            lines.append(f'  {f.key}: {f.description}\n  Examples: {examples_str}')
    return '\n\n'.join(lines)
```

---

