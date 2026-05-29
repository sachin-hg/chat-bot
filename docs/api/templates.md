# Template Catalogue & User Actions

All templateId definitions (property_carousel through login), data shapes, and incoming user_action payloads.

---

## Part D — Template Catalogue

Templates are `chat_event` rows with `messageType: "template"` and a `templateId`.
The `data` field in `content` is the template's payload.

### D1. property_carousel

**templateId:** `"property_carousel"`
**Triggers:** `searchProperties`, `getSimilarProperties`, `getRecommendations`, `getSavedProperties`, `getViewedProperties`

```typescript
interface PropertyCarouselData {
  properties:     PropertyCarouselCard[];
  property_count?: number;
  pagination?:    { is_last_page?: boolean; };
  user_intent?:   string;    // for FE analytics
  service?:       string;    // "buy" or "rent"
  category?:      string;
  city?:          string;
  filters?:       object;
}

interface PropertyCarouselCard {
  _id:                    string;
  id:                     string;
  type:                   "rent" | "project" | "resale";
  title:                  string;
  name?:                  string;
  price_on_request?:      boolean;
  current_status?:        string;
  possession_date?:       string;
  short_address:          { display_name: string; }[];
  region_entities?:       { name?: string; }[];
  is_rera_verified?:      boolean;
  is_verified?:           boolean;
  inventory_canonical_url: string;
  thumb_image_url:        string;
  property_tags:          string[];
  formatted_price?:       string;
  formatted_min_price?:   string;
  formatted_max_price?:   string;
  unit_of_area:           string;
  display_area_type:      string;
  min_selected_area_in_unit?: number;
  max_selected_area_in_unit?: number;
  inventory_configs: {
    furnish_type_id?:     1 | 2 | 3;
    area_value_in_unit?:  number;
  }[];
}
```

**Important — full card, not truncated:**
The `response_truncation` for `searchProperties` in TOOL_REGISTRY drops `image_urls`,
`builder_description`, and `full_address` **for the LLM context only**. The `data` injected
into the `property_carousel` template must come from the **full Khoj response** (before truncation).
The build_prompt_node passes a truncated snapshot to the LLM; respond_node independently
accesses the full `pre_fetched_data['searchProperties']` for the template payload.

**Intent → template mapping:**

| Intent | Tool | property_carousel data source |
|---|---|---|
| property_search/filter_search | searchProperties | `hits`, paginated |
| property_search/explore_nearby | searchProperties | `hits` |
| property_search/discovery_collections | searchProperties (via collection filters) | `hits` |
| property_detail/similar_properties | getSimilarProperties | `hits` |
| portfolio/saved_properties | getSavedProperties | `properties` |
| portfolio/viewed_properties | getViewedProperties | `properties` |
| portfolio/recommendations | getRecommendations | `hits` |

---

### D2. locality_carousel

**templateId:** `"locality_carousel"`
**Triggers:** `getTrendingLocalities`, `locality_research/locality_comparison`

```typescript
interface LocalityCarouselData {
  localities: LocalityCard[];
}

interface LocalityCard {
  id:            string;     // locality UUID
  name:          string;
  displayName?:  string;
  cityName:      string;
  cityUuid:      string;
  image:         string;     // locality banner image URL
  rating:        number;     // 1–5 livability score
  percentGrowth?: number;    // YoY price change %
  priceTrend?:   number;     // avg price per sqft
  url?:          string;     // Housing.com locality SEO page URL
  link?:         string;     // backward compat alias for url
  description?:  string;
  highlights?:   string[];
  pros?:         string[];
  cons?:         string[];
}
```

**Mapping from our tool responses:**

| Our field | → LocalityCard field |
|---|---|
| `locality_id` | `id` |
| `name` | `name` + `displayName` |
| `city` (from session) | `cityName` |
| `city_uuid` (from entity resolution) | `cityUuid` |
| `image_url` (Odin field) | `image` |
| `livability_score` | `rating` |
| `yoy_change_pct` | `percentGrowth` |
| `price_psf` | `priceTrend` |
| `seo_url` (Odin field) | `url` |

**Odin's `getTrendingLocalities` and `getLocalityDetail` should include `image_url`, `city_uuid`,
and `seo_url` in their responses.** Add these to the `return_schema_summary` in TOOL_REGISTRY.
If Odin does not provide them, the orchestrator derives `url` as `/locality/<locality_id>`.

**Intent → template mapping:**

| Intent | Template data |
|---|---|
| locality_research/trending_localities | Map `getTrendingLocalities.localities` → `LocalityCard[]` |
| comparison/compare_localities | Two locality cards side-by-side in the same template |
| locality_research/locality_comparison | Same as compare_localities |

---

### D3. download_brochure

**templateId:** `"download_brochure"`
**Triggers:** `property_detail/brochure` intent (tool: `getBrochure`)

```typescript
interface DownloadBrochureData extends PropertyCarouselCard {
  brochure_images: string[];   // Array of brochure page image URLs
}
```

**Mapping:** Pass the active property's `PropertyCarouselCard` fields (from `getPropertyDetail`)
combined with `getBrochure.brochure_url` expanded into `brochure_images`. If the brochure is
a PDF, the orchestrator requests a pre-rendered image URL list from Venus.

---

### D4. share_location

**templateId:** `"share_location"`
**Triggers:** `filter_delta.user_location_needed = true` (from `property_search/explore_nearby`)

```typescript
interface ShareLocationData {}  // data is empty; template renders a permission request button
```

**Implementation:** `user_location_needed` is a filter key set by the SLM in `filter_delta`. `derive_node` detects it and short-circuits: instead of continuing the pipeline, it sets `bot_response` directly with a `share_location` template payload. The runner's `emit_final_state` emits the `chat_event`. No `get_location` SSE event is emitted.

**Flow:**
1. SLM outputs `filter_delta: { user_location_needed: true }`
2. `derive_node` sees `user_location_needed = true` in filters
3. Short-circuit: instead of `get_location` SSE event, the pipeline emits `share_location` template
4. Frontend renders the location permission button
5. User grants permission → frontend sends `user_action` with `action: "location_shared"` and `coordinates`
6. Next turn: orchestrator reads `location_shared` coordinates into session state and runs the search

---

### D5. nested_qna

**templateId:** `"nested_qna"`
**Triggers:** SLM sets `clarification_needed` (from `clarify_node`)

```typescript
interface NestedQnaData {
  selections: NestedQnaSelection[];
  // NOTE: clarify_node currently emits exactly one selection per nested_qna event.
  // The array form exists for future disambiguation flows (e.g. "which city + which BHK?").
  // FE should render all items but current prod sends selections.length === 1.
}

interface NestedQnaSelection {
  questionId: string;
  title?:     string;       // The question text shown to the user
  type?:      string;       // "single_select" | "text_input"
  entity?:    string;
  options:    NestedQnaOption[];
}

interface NestedQnaOption {
  id:          string;
  title?:      string;
  name?:       string;      // backward compat
  attributes?: string[];
  type?:       string;
  city?:       string;
}
```

**Current architecture mismatch:** `clarification_needed` in the SLM output is a plain string
(the question text). The `nested_qna` template requires structured `selections` with options.

**Resolution — structured SLM clarification output:**
The SLM must output a `clarification_data` field (JSON object) instead of a plain string for
`clarification_needed`. The new SLM output schema for clarifications:

```json
{
  "clarification_needed": "string (question text)",
  "clarification_data": {
    "question_id":  "q1",
    "options": [
      { "id": "rent",  "title": "Rent" },
      { "id": "buy",   "title": "Buy / Purchase" }
    ]
  }
}
```

When `options` is empty or absent, the clarification is a free-text question. The orchestrator
maps this to `nested_qna` with `type: "text_input"` and no options — the user types their response.

**SLM prompt update:** `05-output-schema.md` must include the `clarification_data` field spec.
Examples in `examples/out_of_scope.md` must show both option-based and free-text clarifications.

**`validate_slm_node` update:** coerce `clarification_data` if absent:
```python
if c.get('clarification_needed') and not c.get('clarification_data'):
    # Old SLM output without structured data — wrap as free-text question
    c['clarification_data'] = {'question_id': 'q1', 'options': []}
```

**`clarify_node` update:**
```python
async def clarify_node(state: BotState) -> dict:
    c = state.get('classification') or {}
    if c.get('clarification_needed'):
        clarification_data = c.get('clarification_data', {})
        nested_qna_payload = {
            'selections': [{
                'questionId': clarification_data.get('question_id', 'q1'),
                'title':      c['clarification_needed'],
                'type':       'single_select' if clarification_data.get('options') else 'text_input',
                'options':    clarification_data.get('options', []),
            }]
        }
        return {
            'bot_response': {
                'template_id': 'nested_qna',
                'data':        nested_qna_payload,
            },
            'clarification_emitted': True,
        }
    return {}
```

---

### D6. shortlist_property (Transient)

**templateId:** `"shortlist_property"`
**Triggers:** Tier 1 intent `property_detail/save_property` (tool: `shortlistProperty`)
**Visibility:** Only renders when it is the last message in the chat. Auto-executes on render.

```typescript
interface ShortlistPropertyData {
  property: { id: string; type: string; };
}
```

---

### D7. contact_seller (Transient)

**templateId:** `"contact_seller"`
**Triggers:** Tier 1 intent `property_detail/contact_seller` (tool: `contactSeller`)
**Visibility:** Transient — auto-executes on render.

```typescript
interface ContactSellerData {
  /* generic data object; frontend posts to /api/properties/contact-seller */
}
```

---

### D8. login

**templateId:** `"login"`
**Triggers:** `route_node` when `record.requires_auth = True` and no `auth_token` is present.
**Visibility:** Transient — last-only. Preceded by a plain text message explaining why login is needed.

```typescript
interface LoginData {}  // data is empty — FE renders a standard login CTA
```

**Auth model:**
- `shortlist_property` and `contact_seller` templates handle their own login flow on the FE side — they never reach this path.
- `login` template is emitted only for flows that require the BE to fetch user-specific data: `portfolio/saved_properties`, `portfolio/viewed_properties`, `portfolio/recent_searches`, `portfolio/recommendations`, `property_search/save_alert`.

**Sequence emitted by `emit_final_state`:**
```
chat_event  { seq: 0, messageType: "text",     text: "Log in to see your saved properties.", sourceMessageState: "IN_PROGRESS" }
chat_event  { seq: 1, messageType: "template", templateId: "login",                          sourceMessageState: "COMPLETED" }
```

---

## Part E — Incoming User Action Handling

The frontend sends `messageType: "user_action"` for button taps, location responses, and form
submissions. The pipeline must parse these into a `raw_message` (or direct session update) before
classification.

### E1. Action → raw_message Mapping

```python
def map_user_action_to_text(
    action:  str,
    data:    dict,
    session: dict,
) -> str:
    """Convert a user_action data payload to a natural language string for the SLM."""
    match action:

        case 'learn_more_about_property':
            # data.property.id is the property UUID
            property_id = (data.get('property') or {}).get('id', '')
            # Inject property_id into session for this turn
            session['active_property_id'] = property_id
            return data.get('derivedLabel') or 'Tell me more about this property'

        case 'contact_seller' | 'contacted_seller':
            property_id = (data.get('property') or {}).get('id', '')
            session['active_property_id'] = property_id
            return 'I want to contact the seller'

        case 'shortlist' | 'shortlisted_property':
            property_id = (data.get('property') or {}).get('id', '')
            session['active_property_id'] = property_id
            return 'Save this property to my shortlist'

        case 'show_properties_in_locality':
            locality = data.get('locality', {})
            # Inject resolved locality into session directly
            session['active_locality_id']   = locality.get('localityUuid', '')
            session['active_locality_name'] = locality.get('localityName', '')
            return data.get('derivedLabel') or f"Show properties in {locality.get('localityName', 'this area')}"

        case 'learn_more_about_locality':
            locality = data.get('locality', {})
            session['active_locality_id'] = locality.get('localityUuid', '')
            return data.get('derivedLabel') or f"Tell me about {locality.get('localityName', 'this locality')}"

        case 'share_location_clicked':
            return 'I want to search near me'

        case 'location_shared':
            coords = (data.get('location_shared') or {}).get('coordinates', [])
            if len(coords) == 2:
                session['user_coordinates'] = {'lat': coords[0], 'lng': coords[1]}
                # Clear user_location_needed now that we have coordinates
                session.setdefault('active_filters', {}).pop('user_location_needed', None)
                session['active_filters']['lat'] = coords[0]
                session['active_filters']['lng'] = coords[1]
            return 'Show me properties near my location'

        case 'location_denied' | 'location_not_available':
            return 'I cannot share my location right now'

        case 'nested_qna_selection':
            # User submitted answers to a clarification form
            selections = data.get('selections', [])
            return _format_qna_response(selections)

        case _:
            return data.get('derivedLabel') or action.replace('_', ' ')

def _format_qna_response(selections: list[dict]) -> str:
    parts = []
    for s in selections:
        if s.get('skipped'):
            continue
        if s.get('selection'):
            parts.append(s['selection'])
        elif s.get('text'):
            parts.append(s['text'])
    return ', '.join(parts) if parts else 'I am not sure'
```

### E2. Silent Actions (responseRequired: false)

These do not enter the LLM pipeline. Handle them directly in the HTTP layer:

| action | Backend handling |
|---|---|
| `shortlist` | Forward to `shortlistProperty` tool; return non-streaming ack |
| `shortlisted_property` | Analytics event only; ack |
| `contact_seller` | Forward to `contactSeller` tool; return non-streaming ack |

---

