# Bot Conversation Design — Use Cases, Tools, and Response Architecture

## Response Structure (Every Reply)

Every bot reply has up to three parts, emitted in order:

```
┌─────────────────────────────────────────────────────┐
│  Part 1: Fast Summary  (first streaming tokens)     │
│  "Looking for 2BHK for rent near Sector 32..."      │
│  Appears immediately. LLM streams this first.       │
├─────────────────────────────────────────────────────┤
│  Part 2: Tool event  (while tools execute)          │
│  [spinner] "Searching properties..."                │
│  Emitted as bot_tool_event frame                    │
├─────────────────────────────────────────────────────┤
│  Part 3: Actual Response  (bot_complete frame)      │
│  text | template JSON | markdown                    │
│  + followup chips                                   │
└─────────────────────────────────────────────────────┘
```

### Why summary-first

3–4s latency is acceptable for the full result but not for *feeling responsive*. The LLM is instructed to emit a one-line summary as the first thing it streams — this appears in the bubble while tools run. The user sees acknowledgement within ~300ms of sending their message.

**System prompt instruction:**
```
Begin EVERY response with exactly one line starting with a verb that summarises what you understood:
"Looking for...", "Fetching...", "Comparing...", "Showing...", "Switching to..."
Then proceed with tool calls. Then give your actual response.
Never skip the summary line.
```

### bot_complete frame shape

```typescript
interface BotCompletePayload {
  summary: string;           // the first-line summary, echoed for client logging
  content_type: 'text' | 'template' | 'markdown' | 'mixed';
  text?: string;             // for content_type: text or mixed
  markdown?: string;         // for content_type: markdown or mixed
  template?: {
    template_id: TemplateId;
    data: unknown;           // template-specific payload
  };
  followups: Followup[];     // suggestion chips below response
}

interface Followup {
  label: string;
  intent?: string;           // structured intent for card actions
  filter_delta?: Partial<SearchFilters>;  // for filter chips
  display_text?: string;     // what to show in chat if user taps (optional)
}
```

---

## Template Catalog

All template IDs and their payloads:

| template_id | When used | Rendered by FE as |
|---|---|---|
| `property_carousel` | Property search results, saved/contacted properties | Horizontally scrollable property cards with Learn more + Contact CTAs. "View all" card appended when `user_intent ∈ {"SRP","shortlist"}` and `!is_last_page`. |
| `locality_carousel` | Nearby/similar/trending localities | Scrollable locality cards with Rating, YoY Growth %, Show properties + Learn more CTAs. Card is clickable → locality URL. |
| `image_gallery` | Property images | Full-screen image carousel |
| `floor_plans` | Floor plan images + dimensions | Zoomable 3D plan viewer. Always paired with LLM-generated markdown text analysis (room dimensions, layout feel). Dual output — see Use Case 3. |
| `payment_plan` | Builder payment schedule | Table with milestone/% columns |
| `amenities` | Full amenities list | Icon grid |
| `download_brochure` | Project brochure download | Card with cover photo, project name, price range, "View brochure" CTA. Data: `{ id, type, title, name, short_address[], cover_photo_url, brochure_name, brochure_pdf_url, brochure_images[] }` |
| `shortlist_property` | Auth-gate for shortlisting | Similar to `login` modal (transient — renders only when latest message). BE sends this when user tries to shortlist and is not logged in. User logs in → FE automatically calls shortlist API → shows "Property has been shortlisted ✓" toast. On already-logged-in, FE shows toast directly without a BE template. After API success, FE sends hidden `user_action { action: "shortlisted_property" }`. |
| `contact_seller` | Seller contact flow | Seller/property card with connect button (transient). Data shape mirrors property object: `{ id, type, title, name?, short_address[], formatted_min_price?, formatted_max_price?, inventory_configs[], ... }`. After FE action, sends shown `user_action { action: "contacted_seller" }`. |
| `login` | Auth-gated feature other than shortlist | Bottom sheet: phone OTP + "Continue with WhatsApp" |
| `share_location` | Near-me queries | In-chat card with geolocation CTA (transient). Data: `{}` (empty — all 3 button states are FE-only UX). FE sends back `user_action` with one of: `action: "location_shared" + coordinates: [lat, lng]`, `action: "location_denied"`, `action: "location_not_available"`. FE auto-sends `location_shared` without showing template if permission already granted. |
| `nested_qna` | Entity disambiguation (one or more ambiguous names) | Structured Q&A card (transient — hides text composer while active). Multiple questions, each with options. FE submits via `user_action { action: "nested_qna_selection", selections: [...] }`. |
| `price_trends` | Price trend data | Structured text block (mobile) or chart panel (desktop): avg price, YoY growth, quarterly breakdown, available property count |
| `transaction_history` | Recent transactions | Table: sales + mortgage breakdown, area stats, recent activity, market insights |
| `reviews` | Locality or project reviews | Rating + category breakdown + key insights (strengths / areas to consider) + review cards |

**Transient templates** (render only when they are the latest bot message — no stale CTA duplication in history):
`share_location`, `shortlist_property`, `contact_seller`, `nested_qna`

**User actions from FE** (reference):
| action | messageType | isVisible | responseRequired | Trigger |
|---|---|---|---|---|
| `shortlisted_property` | user_action | false | false | After shortlist API success |
| `contacted_seller` | user_action | true | false | After contact action |
| `learn_more_about_property` | user_action | true | true | Learn more card tap |
| `learn_more_about_locality` | user_action | true | true | Locality learn more tap |
| `brochure_downloaded` | user_action | false | false | After brochure download |
| `nested_qna_selection` | user_action | true | true | nested_qna submission |
| `location_shared` | user_action (sender: system) | — | true | Location permission granted |
| `location_denied` | user_action (sender: system) | — | true | User explicitly denied location |
| `location_not_available` | user_action (sender: system) | — | true | Permission may be granted but no position fix |

**Feedback row (👍 👎 share):** Rendered by FE below every bot message. Feedback events are pushed to Google Analytics by FE. BE only needs to provide `message_id` (already present on every `bot_complete` frame) so FE can tag GA events. No additional WS frame or BE endpoint needed.

---

## Session State: Active Entity Tracking

The `conv:state` Redis hash carries active entities at all times. Built by Bot Orchestrator, injected into system prompt section 3.

```
conv:state:{conversation_id} fields (additions to base design):

active_property_id       string     currently selected property
active_project_id        string     project of selected property, or directly selected
active_locality_id       string     currently focused locality
active_builder_id        string     currently focused builder
active_transaction_type  string     "rent" | "buy"
active_city              string
last_carousel_ids        string     JSON array, ordered list of prop_ids in last carousel
last_carousel_srset_id   string     search result set ID for pagination
last_carousel_page       int        current page number
last_locality_carousel   string     JSON array of locality_ids in last carousel
```

**Injected into system prompt (section 3) example:**
```
CURRENT SESSION CONTEXT:
- Transaction type: rent
- City: Gurgaon
- Active property: prop_123 (DLF Privana South, 3BHK, Sector 77, ₹55k/mo)
- Active project: proj_456 (DLF Privana South)
- Active locality: loc_789 (Sector 77, Gurgaon)
- Active builder: bld_101 (DLF)
- Last property carousel (in order): [prop_123, prop_234, prop_345, prop_456, prop_567]
- Active filters: { bhk:[3], price_max:60000 }
- Last carousel page: 1 (total found: 47)
```

---

## Entity Resolution System

The search API does not accept names — it takes system entity IDs. Names must be resolved to entities first.

### `resolveEntity` tool

```typescript
{
  name: "resolveEntity",
  description: "Map a user-entered name to one or more system entities. Call before any search when the user has specified a locality name, landmark, builder name, or project name. Do NOT call for cities — cities are resolved separately. Call once per distinct name in the user's message.",
  input_schema: {
    type: "object",
    properties: {
      raw_name: {
        type: "string",
        description: "Exact text the user entered, e.g. 'DLF Privana', 'Sector 32', 'Huda City Centre'"
      },
      entity_type: {
        type: "string",
        enum: ["locality", "landmark", "builder", "project"],
        description: "locality: neighbourhood/sector. landmark: metro station, hospital, etc. builder: developer company. project: specific housing project."
      },
      city: { type: "string", description: "City hint to narrow results" }
    },
    required: ["raw_name", "entity_type"]
  }
}
```

**Return:**
```typescript
{
  raw_name: string,
  matches: Array<{
    entity_id: string,
    entity_type: "locality" | "landmark" | "builder" | "project",
    canonical_name: string,
    subtitle: string,              // "Sector 77, Gurgaon" or "3-4 BHK, ₹3.5–5Cr"
    confidence: number,            // 0.0 – 1.0
    additional_info?: Record<string, string>
  }>
}
```

### LLM Decision Logic (in system prompt)

```
After calling resolveEntity, decide:
1. If 0 matches → tell user no match found, ask them to rephrase or try a different name.
   Use plain text. Do not use nested_qna.

2. If 1 match and confidence >= 0.85 → auto-select, proceed.
   Mention selection in summary: "Found DLF Privana South in Sector 77".

3. If 1 match and confidence < 0.85 → confirm with plain text:
   "Did you mean [canonical_name] in [city]?" User can reply yes/no.

4. If 2 matches close in confidence AND they can be described clearly in text →
   ask as plain text: "Did you mean Sector 32 in Gurgaon or Faridabad?"
   User can type the distinguishing word ("Gurgaon") to answer.

5. If multiple matches and top confidence >= 0.90 AND gap to second > 0.15 → auto-select top.

6. If multiple matches close in confidence AND options need metadata to distinguish
   (3+ options, similar names, user can't type an unambiguous answer) →
   send template: nested_qna. Do NOT proceed with search.

7. If resolveEntity was called for multiple raw_names in one turn AND multiple are ambiguous →
   send nested_qna covering all ambiguous names in a single template (one selection per name).
   Never send multiple separate nested_qna templates for the same turn.

8. Never call resolveEntity more than once for the same raw_name in the same turn.
```

### `nested_qna` template

Used for disambiguating one or more ambiguous entity names in a single turn. Each ambiguous name becomes one question in `selections[]`. FE hides the text composer while this template is the latest message.

```json
{
  "templateId": "nested_qna",
  "data": {
    "selections": [
      {
        "questionId": "sub_intent_1",
        "title": "Which Sector 32 are you referring to?",
        "type": "locality_single_select",
        "options": [
          { "id": "uuid1", "title": "Sector 32", "attributes": ["Locality", "Gurgaon"] },
          { "id": "uuid2", "title": "Sector 32", "attributes": ["Locality", "Faridabad"] }
        ]
      },
      {
        "questionId": "sub_intent_2",
        "title": "Which DLF Privana did you mean?",
        "type": "locality_single_select",
        "options": [
          { "id": "proj_456", "title": "DLF Privana South", "attributes": ["Project", "Sector 77, Gurgaon"] },
          { "id": "proj_457", "title": "DLF Privana West", "attributes": ["Project", "Sector 76, Gurgaon"] }
        ]
      }
    ]
  }
}
```

Option `attributes: string[]` is the preferred format (FE renders `attributes.join(" | ")`). Deprecated: `type` + `city` fields — still supported for backward compatibility.

FE submits via `user_action`:
```json
{
  "messageType": "user_action",
  "responseRequired": true,
  "isVisible": true,
  "content": {
    "data": {
      "action": "nested_qna_selection",
      "replyToMessageId": "msg_b_030",
      "selections": [
        { "questionId": "sub_intent_1", "selection": "uuid1" },
        { "questionId": "sub_intent_2", "text": "DLF Privana South Gurgaon" },
        { "questionId": "sub_intent_3", "skipped": true }
      ]
    },
    "derivedLabel": "Q. Which Sector 32?\nA. Sector 32, Gurgaon\n\nQ. Which DLF Privana?\nA. DLF Privana South"
  }
}
```

Each selection entry has exactly one of: `selection` (entity ID from options), `text` (free-text answer), or `skipped: true`.

Bot orchestrator receives this, stores resolved entity IDs in `conv:state`, proceeds with the original flow.

### Reference Resolution (Anaphora)

References like "this", "first property", "the DLF one" are resolved by the LLM from session context:

| User says | Resolves to |
|---|---|
| "this property" | `active_property_id` from session |
| "this project" | `active_project_id` |
| "this locality" | `active_locality_id` |
| "first property" / "property 1" | `last_carousel_ids[0]` |
| "third property" | `last_carousel_ids[2]` |
| "first locality" | `last_locality_carousel[0]` |
| "the DLF one" | match against builder name in `last_carousel_ids` metadata |
| "this locality" (on project page) | locality of `active_project_id` |

If the reference is ambiguous and session state doesn't have enough context → ask: "Which property are you referring to?"

---

## Use Case 1: Property Search

### Inputs accepted (any combination)

**Required — at least one of:**
- `locality` — one or more (e.g. "Sector 32 and Sector 50 in Gurgaon")
- `landmark` — single only (e.g. "near Huda City Centre metro")
- `builder_id` — single only (e.g. "DLF properties")
- `project_id` — single only (e.g. "DLF Privana")
- `lat_lng` — from location permission flow

**Required always:**
- `city`

**Optional filters:**

| Filter | Type | Notes |
|---|---|---|
| `apartment_type` | string[] | "1bhk", "2bhk", "3bhk", "4bhk", "5bhk+", "studio" |
| `property_type` | string[] | "apartment", "villa", "independent_house", "plot", "duplex", "penthouse", "pg" |
| `price_min` / `price_max` | number | Absolute INR. See price conversion tool below. |
| `area_min_sqft` / `area_max_sqft` | number | Always in sqft. See unit conversion tool. |
| `listed_by` | string[] | "owner", "broker", "builder" |
| `sale_type` | string[] | "resale", "new_booking" — buy only |
| `is_project` | boolean | Show only project-listed properties |
| `construction_status` | string[] | "under_construction", "ready_to_move" — buy only |
| `age_of_property_max` | number | In years |
| `is_verified` | boolean | Housing-verified only |
| `is_rera_compliant` | boolean | |
| `amenities` | string[] | "pool", "gated", "lift", "power_backup", "gym", "parking", "gas_pipeline" |
| `facing` | string[] | "north", "south", "east", "west", "north_east", "north_west", "south_east", "south_west" |
| `furnishing` | string[] | "furnished", "semi_furnished", "unfurnished" — rent primarily |

### `searchProperties` tool (revised full schema)

```typescript
{
  name: "searchProperties",
  description: "Search for properties. Requires city + at least one of: locality_ids, landmark_id, builder_id, project_id, lat_lng. Resolve names to entity IDs first using resolveEntity. Do not pass raw names to this tool.",
  input_schema: {
    type: "object",
    properties: {
      city:             { type: "string" },
      transaction_type: { type: "string", enum: ["rent", "buy"] },
      locality_ids:     { type: "array", items: { type: "string" } },
      landmark_id:      { type: "string" },
      builder_id:       { type: "string" },
      project_id:       { type: "string" },
      lat_lng:          { type: "object", properties: { lat: { type: "number" }, lng: { type: "number" } } },
      radius_km:        { type: "number", description: "Used with lat_lng. Default 3km." },
      filters: {
        type: "object",
        properties: {
          apartment_type:         { type: "array", items: { type: "string" } },
          property_type:          { type: "array", items: { type: "string" } },
          price_min:              { type: "number" },
          price_max:              { type: "number" },
          area_min_sqft:          { type: "number" },
          area_max_sqft:          { type: "number" },
          listed_by:              { type: "array", items: { type: "string" } },
          sale_type:              { type: "array", items: { type: "string" } },
          is_project:             { type: "boolean" },
          construction_status:    { type: "array", items: { type: "string" } },
          age_of_property_max:    { type: "number" },
          is_verified:            { type: "boolean" },
          is_rera_compliant:      { type: "boolean" },
          amenities:              { type: "array", items: { type: "string" } },
          facing:                 { type: "array", items: { type: "string" } },
          furnishing:             { type: "array", items: { type: "string" } }
        }
      },
      sort_by:    { type: "string", enum: ["relevance", "price_asc", "price_desc", "newest", "area_desc"] },
      page:       { type: "integer", default: 1 },
      page_size:  { type: "integer", default: 10, maximum: 10 }
    },
    required: ["city", "transaction_type"]
  }
}
```

**Return → `property_carousel` template:**
```json
{
  "template_id": "property_carousel",
  "data": {
    "srset_id": "srset_abc123",
    "total_count": 47,
    "page": 1,
    "page_size": 10,
    "properties": [
      {
        "property_id": "prop_123",
        "title": "3BHK in DLF Privana South",
        "locality": "Sector 77",
        "city": "Gurgaon",
        "apartment_type": "3bhk",
        "property_type": "apartment",
        "area_sqft": 1850,
        "price": 55000,
        "price_display": "₹55,000/month",
        "thumbnail_url": "...",
        "highlights": ["Verified", "Furnished", "Metro 800m"],
        "is_verified": true,
        "listed_by": "owner",
        "posted_days_ago": 3,
        "quick_actions": [
          { "label": "Details", "intent": "property_detail", "property_id": "prop_123" },
          { "label": "Similar", "intent": "similar_properties", "property_id": "prop_123" },
          { "label": "Contact", "intent": "contact_seller", "property_id": "prop_123" },
          { "label": "Save", "intent": "shortlist", "property_id": "prop_123" }
        ]
      }
    ]
  },
  "followups": [
    { "label": "Show more", "intent": "paginate", "srset_id": "srset_abc123", "page": 2 },
    { "label": "Furnished only", "filter_delta": { "furnishing": ["furnished"] } },
    { "label": "Owner listings", "filter_delta": { "listed_by": ["owner"] } },
    { "label": "Sort by price", "intent": "sort", "sort_by": "price_asc" }
  ]
}
```

After returning this, Bot Orchestrator writes to Redis:
```
conv:state last_carousel_ids     = ["prop_123", "prop_234", ...]
conv:state last_carousel_srset_id = "srset_abc123"
conv:state last_carousel_page    = 1
```

---

### Supporting Conversion Tools

#### `convertAreaUnit`

```typescript
{
  name: "convertAreaUnit",
  description: "Convert area from any unit to square feet. Call when user enters area in sq yards, sq meters, acres, or guntha.",
  input_schema: {
    type: "object",
    properties: {
      value:     { type: "number" },
      from_unit: { type: "string", enum: ["sq_yard", "sq_meter", "acre", "guntha", "sq_feet"] },
      to_unit:   { type: "string", enum: ["sq_feet"], default: "sq_feet" }
    },
    required: ["value", "from_unit"]
  }
}
// Return: { result_sqft: number }
```

#### `convertPricePerSqftToAbsolute`

```typescript
{
  name: "convertPricePerSqftToAbsolute",
  description: "Convert a per-sqft price to an absolute price range. Use when user says something like '12,000 per sqft'. Returns a min/max range based on typical BHK sizes.",
  input_schema: {
    type: "object",
    properties: {
      price_per_sqft: { type: "number" },
      apartment_type: { type: "string", description: "e.g. '2bhk'. Helps infer area range." },
      city:           { type: "string" },
      area_min_sqft:  { type: "number", description: "If user also specified area range" },
      area_max_sqft:  { type: "number" }
    },
    required: ["price_per_sqft"]
  }
}
// Return: { price_min: number, price_max: number, assumed_area_range: { min: number, max: number }, note: string }
// note: "Based on typical 2BHK size of 800–1,200 sqft in Gurgaon"
```

#### `reverseGeocode`

```typescript
{
  name: "reverseGeocode",
  description: "Convert a lat/lng coordinate to city and locality system entities. Always call this before passing coordinates to any tool that requires city_id or locality_id (e.g. getTrendingLocalities, getInvestmentHotspots, getSimilarLocalities). Not needed for searchProperties or getNearbyLocalities — those accept lat/lng directly.",
  input_schema: {
    type: "object",
    properties: {
      lat: { type: "number" },
      lng: { type: "number" }
    },
    required: ["lat", "lng"]
  }
}
// Return:
// {
//   city_id:       "city_gurgaon",
//   city_name:     "Gurgaon",
//   locality_id:   "loc_sector47",   // null if coords fall outside a known locality boundary
//   locality_name: "Sector 47",      // null if locality_id is null
//   area_label:    "Sector 47, Gurgaon"  // always present, used for bot summary line
// }
```

`area_label` is what the bot uses in its fast summary: "Showing trending localities near Sector 47, Gurgaon...". If `locality_id` is null, city-level tools still work. If `locality_id` is present, both city-level and locality-level tools can proceed without a second call.

#### `getPropertyCountByRelaxingFilters`

```typescript
{
  name: "getPropertyCountByRelaxingFilters",
  description: "When search returns 0 or very few results, call this to find out how many properties exist if specific filters are relaxed. Shows user which filter to drop to get more results. Call with the original search params and a list of filter keys to relax.",
  input_schema: {
    type: "object",
    properties: {
      base_search_params: { type: "object", description: "Same params as searchProperties" },
      relax_combinations: {
        type: "array",
        description: "Each item is a list of filter keys to drop in that combination",
        items: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    required: ["base_search_params", "relax_combinations"]
  }
}
// Return:
// [
//   { relaxed_filters: ["furnishing"], count: 12, label: "Remove furnished filter → 12 properties" },
//   { relaxed_filters: ["price_max"], count: 34, label: "Remove price limit → 34 properties" },
//   { relaxed_filters: ["furnishing", "price_max"], count: 67, label: "Remove both → 67 properties" }
// ]
```

Bot uses this to say: "No results with your filters. Removing the furnished requirement gives 12 options, or removing the price limit gives 34." Followup chips: `[Remove furnished | Relax budget | Show all 67]`.

---

## Use Case 2: Property Selection

Three entry points — all converge to the same state.

### Entry A: Text intent
```
User: "show me more about DLF Privana"
      "tell me about the 3rd property"
      "I want details on prop in Sector 77"
```

LLM resolves reference → calls `getPropertyDetail(property_id)` → emits `property_detail` card → Bot Orchestrator sets `active_property_id` in Redis.

### Entry B: Card quick action (structured message)
```json
{
  "type": "user_message",
  "payload": {
    "intent": "property_detail",
    "property_id": "prop_123",
    "display_text": "Tell me more about this property"
  }
}
```
No entity resolution needed. Bot Orchestrator sets `active_property_id` directly. LLM calls `getPropertyDetail`.

### Entry C: Opened chat from property detail page
The web/app sends a pre-seeded session frame on WS connect:
```json
{
  "type": "session_seed",
  "payload": {
    "active_property_id": "prop_123",
    "active_project_id": "proj_456",
    "active_locality_id": "loc_789",
    "source_page": "property_detail"
  }
}
```
Bot Orchestrator writes these to `conv:state` before the user says anything. Bot greets with property context already loaded.

---

## Use Case 3: Property Detail Actions

Once `active_property_id` is set, these intents are available:

| User intent | Tool called | Response template |
|---|---|---|
| "show floor plans" | `getFloorPlans(property_id)` | `floor_plans` |
| "show images / photos" | `getPropertyImages(property_id)` | `image_gallery` |
| "show amenities" | `getPropertyAmenities(property_id)` | `amenities` |
| "payment plan / schedule" | `getPaymentPlan(project_id)` | `payment_plan` |
| "contact seller / owner" | `initiateContact(property_id)` | `contact_seller` |
| "save / shortlist" | `shortlistProperty(property_id)` | `shortlist_property` |
| "show similar properties" | `getSimilarProperties(property_id)` | `property_carousel` |
| "show nearby properties" | `searchProperties(lat_lng from property)` | `property_carousel` |

### Tool: `getPropertyImages`

```typescript
{
  name: "getPropertyImages",
  description: "Fetch all images for a property, categorized by type.",
  input_schema: {
    type: "object",
    properties: {
      property_id: { type: "string" }
    },
    required: ["property_id"]
  }
}
// Return → template: image_gallery
// {
//   categories: [
//     { label: "Living Room", images: [{ url: "...", caption: "..." }] },
//     { label: "Bedroom", images: [...] },
//     { label: "Kitchen", images: [...] },
//     { label: "Building", images: [...] }
//   ]
// }
```

### Tool: `shortlistProperty`

```typescript
{
  name: "shortlistProperty",
  description: "Shortlist/save a property for the logged-in user. If user is not logged in, return login_required.",
  input_schema: {
    type: "object",
    properties: {
      property_id: { type: "string" },
      user_id:     { type: "string", description: "From session. If null, user is not logged in." }
    },
    required: ["property_id"]
  }
}
// Return:
//   { status: "shortlisted" }                              → already logged in (FE shows toast directly)
//   { status: "login_required", template: "login" }        → not logged in
```

When `login_required`, bot sends `login` template. FE shows auth sheet. On login success, FE sends:
```json
{ "type": "user_message", "payload": { "intent": "auth_complete", "user_id": "usr_abc" } }
```
Bot Orchestrator updates session with `user_id`, retries the shortlist tool call, confirms to user.

---

## Use Case 4: Reviews

User can ask for reviews of:
- "this locality" → `active_locality_id`
- "Sector 32 Gurgaon" → resolveEntity → locality_id
- "this project" → `active_project_id`
- "DLF Privana" → resolveEntity → project_id
- "the locality of this project" → derive locality_id from active_project_id

### `getLocalityReviews` tool

```typescript
{
  name: "getLocalityReviews",
  description: "Fetch resident reviews for a locality.",
  input_schema: {
    type: "object",
    properties: {
      locality_id: { type: "string" },
      limit:       { type: "integer", default: 5 },
      sort_by:     { type: "string", enum: ["recent", "highest_rated", "most_helpful"], default: "most_helpful" }
    },
    required: ["locality_id"]
  }
}
// Return → template: reviews
// {
//   entity_name: "Sector 32, Gurgaon",
//   overall_rating: 4.2,
//   total_reviews: 234,
//   rating_breakdown: { connectivity: 4.5, safety: 4.0, lifestyle: 4.3, value: 3.9 },
//   reviews: [
//     { text: "...", rating: 5, author_tenure: "3 years", date: "2024-12", helpful_count: 42 }
//   ]
// }
```

### `getProjectReviews` tool — same shape, `project_id` input.

**LLM flow for "show me reviews of this locality":**
```
1. Check active_locality_id in session context → loc_789 (Sector 32, Gurgaon)
2. Summary: "Fetching reviews for Sector 32, Gurgaon..."
3. Call: getLocalityReviews({ locality_id: "loc_789" })
4. Respond with template: reviews + text summarizing key themes
5. Followups: ["See project reviews", "Compare with nearby locality", "Price trends here"]
```

---

## Use Case 5: Locality Comparison, Nearby, Price Trends, Transactions

### `compareLocalities`

```typescript
{
  name: "compareLocalities",
  description: "Compare two localities across connectivity, amenities, pricing, and ratings.",
  input_schema: {
    type: "object",
    properties: {
      locality_id_a: { type: "string" },
      locality_id_b: { type: "string" },
      transaction_type: { type: "string", enum: ["rent", "buy"] }
    },
    required: ["locality_id_a", "locality_id_b", "transaction_type"]
  }
}
// Return → content_type: markdown
// Markdown comparison table with sections: Overview, Pricing, Connectivity, Amenities, Verdict
```

When user says "compare this locality to nearby localities":
1. Resolve "this locality" → `active_locality_id`
2. "nearby localities" is vague — call `getNearbyLocalities` first → get top 2–3
3. Ask user: "Would you like to compare Sector 32 with Sector 50 or Sector 56?"
4. User picks → `compareLocalities`

### `getNearbyLocalities`

```typescript
{
  name: "getNearbyLocalities",
  description: "Get localities within a radius of a given locality or coordinate. Accepts either locality_id (when user references a known locality) OR lat/lng (for near-me queries). Do NOT call reverseGeocode before this — pass lat/lng directly.",
  input_schema: {
    type: "object",
    properties: {
      locality_id:      { type: "string", description: "Use when locality is known" },
      lat:              { type: "number", description: "Use for near-me queries instead of locality_id" },
      lng:              { type: "number" },
      radius_km:        { type: "number", default: 5 },
      transaction_type: { type: "string", enum: ["rent", "buy"] },
      limit:            { type: "integer", default: 6 }
    }
    // One of locality_id or (lat + lng) is required
  }
}
// Return → template: locality_carousel
```

### `getLocalityPriceTrends` — same as in llm-tool-design.md but takes `locality_id` (not name).

### `getLocalityTransactions`

```typescript
{
  name: "getLocalityTransactions",
  description: "Fetch recent registered sale/rental transactions in a locality.",
  input_schema: {
    type: "object",
    properties: {
      locality_id:      { type: "string" },
      transaction_type: { type: "string", enum: ["rent", "buy"] },
      apartment_type:   { type: "string" },
      limit:            { type: "integer", default: 10 }
    },
    required: ["locality_id", "transaction_type"]
  }
}
// Return → template: transaction_history
// { transactions: [{ date, price, area_sqft, price_per_sqft, apartment_type, verified }] }
```

---

## Use Case 6: Similar Localities, Trending, Hotspots

All return `locality_carousel` template.

```typescript
// Similar to current locality
getSimilarLocalities({ locality_id, transaction_type, limit?: number })

// Trending in city
getTrendingLocalities({ city, transaction_type, ranked_by?: "search_volume"|"appreciation"|"supply" })

// Investment hotspots
getInvestmentHotspots({ city, budget_max?: number })
```

**locality_carousel template:**
```json
{
  "template_id": "locality_carousel",
  "data": {
    "localities": [
      {
        "locality_id": "loc_890",
        "name": "Sector 50",
        "city": "Gurgaon",
        "avg_rent_2bhk": 42000,
        "avg_price_2bhk": 8500000,
        "overall_rating": 4.1,
        "highlights": ["Metro access", "Schools nearby", "8% YoY appreciation"],
        "thumbnail_url": "...",
        "quick_actions": [
          { "label": "Search here", "intent": "search_in_locality", "locality_id": "loc_890" },
          { "label": "Reviews", "intent": "locality_reviews", "locality_id": "loc_890" },
          { "label": "Price trends", "intent": "price_trends", "locality_id": "loc_890" }
        ]
      }
    ]
  }
}
```

---

## Use Case 7: Shortlist and Contact Seller

Both are auth-gated and trigger session state transitions.

### Shortlist
→ Covered in Use Case 3. Template: `shortlist_property`. Login gate if unauthenticated.

### Contact Seller
→ Triggers `CONTACT_SELLER` session state transition (see redis-state-machine.md).

```typescript
{
  name: "initiateContact",
  description: "Initiate contact between buyer and seller. Triggers P2P session. Only call after explicit user confirmation ('yes, connect me', 'contact seller', tapping Contact button). Never call proactively.",
  input_schema: {
    type: "object",
    properties: {
      property_id:    { type: "string" },
      seller_id:      { type: "string" },
      opening_message: { type: "string", description: "Optional first message from buyer to seller" }
    },
    required: ["property_id", "seller_id"]
  }
}
// Return → template: contact_seller
// { seller_name, seller_type, response_rate, avg_response_hours, property_title }
// Side effect: session_state → CONTACT_SELLER → P2P_ACTIVE flow begins
```

---

## Use Case 8: Saved and Contacted Properties (Auth-Gated)

```typescript
getUserSavedProperties({ user_id: string, page?: number }) → property_carousel
getUserContactedProperties({ user_id: string, page?: number }) → property_carousel
```

**If not logged in:** Return `{ template: "login", reason: "saved_properties" }`.
After login success frame → retry → return `property_carousel`.

**Flow:**
```
User: "show my saved properties"
Bot Orchestrator: check session.user_id
  → null: emit template: login
  → set: call getUserSavedProperties → property_carousel
```

---

## Use Case 9: Intent Switching

### Detecting a switch

The LLM detects intent switches from signals in the user message:
- "actually looking to buy" → switch rent → buy
- "let me switch to rental" → switch buy → rent
- "show me in Delhi instead" → city change
- "forget sector 32, try Sector 50" → locality change

### Clarify before acting on ambiguous or impossible signals

**Before applying any filter or switching any intent, check whether the signal is valid in the current context.** If it isn't, or if it could be interpreted two valid ways, ask — never assume.

```
Price signal "under 30K" in buy context:
  ₹30K is impossible as a total buy price (too low).
  Could mean:
    A) Switch to rent with ₹30K/month budget
    B) Stay in buy with ₹30K/sqft price (total ~₹2.4–3.6Cr for 2BHK)
  → DO NOT SEARCH. Ask as plain text:
    "₹30K is very low for a property purchase — did you mean ₹30K/month rent,
     or ₹30K per sq.ft (around ₹2.4–3.6Cr total)?"

Price signal "under 2Cr" in rent context:
  ₹2Cr/month is impossibly high for rent. Could be a buy intent.
  → Ask as plain text: "₹2Cr sounds more like a purchase budget. Were you thinking of buying?"

Price signal "under 80L" in buy context:
  Valid buy price → proceed without asking.

Price signal "under 25K" in rent context:
  Valid rent budget → proceed without asking.
```

**Rule: Only one valid interpretation → proceed. Two valid interpretations → clarify. Impossible in current context → clarify.**

Do not fire a search, do not change conv:state until the user confirms.

### Text clarification vs nested_qna — when to use which

Clarifications should be as lightweight as possible. Default to plain text. Only use `nested_qna` when the options are entities/items the user needs to **see** to recognise.

**Use plain text when:**
- The question has 2–3 options that can be described in a short label
- The user can answer with a word or short phrase ("rent", "per sqft", "yes", "no", "buy")
- The bot can unambiguously parse the user's typed answer
- Examples: price ambiguity, transaction type clarification, "did you mean X or Y?"

**Use `nested_qna` when:**
- Options are entities the user needs to see to identify (locality names, project names that sound similar)
- Each option requires metadata to distinguish (city, type, price range, area)
- Multiple independent disambiguation questions need answering at once
- The user cannot reasonably type the answer — they need to pick from a displayed list
- Examples: "Sector 32" matching both Gurgaon and Faridabad; "DLF Privana" matching South and West variants

```
"did you mean rent or ₹30K/sqft?"            → plain text  (2 options, word answer)
"which city?"                                 → plain text  (open, user types city name)
"which Sector 32 — Gurgaon or Faridabad?"    → can be plain text (2 short options)
"which Sector 32?" [3+ cities with metadata] → nested_qna  (user needs to see options)
"sector 32 AND sector 21 are both ambiguous" → nested_qna  (multiple questions at once)
```

### Filter carry-forward rules

```
On transaction_type switch (rent ↔ buy):
  CARRY:    apartment_type_id, property_type*, amenities, facing,
            is_verified, is_rera_compliant, area range, city, locality
  DROP:     price_min/price_max (scale incompatible — always ask new budget)
            sale_type, construction_status**, age_of_property (buy-only concepts)
  ASK:      "What's your budget for [new type]?" (unless price signal given in the same message)

*property_type carry exceptions:
  "plot" does not apply to rent → drop
  "pg" does not apply to buy → drop

**construction_status does not apply to rent → drop

On city change:
  CARRY:    transaction_type, apartment_type_id, property_type, amenities, area range
  DROP:     price range (prices vary significantly by city — ask new budget)
            locality_ids, landmark_id (city-specific entities)
  RESET:    active_locality_id, active_property_id, active_project_id

On locality change within same city:
  CARRY:    all filters, transaction_type
  REPLACE:  locality_ids
  RESET:    active_property_id, active_project_id (belonged to old locality)
```

### BHK filter: additive vs replacement

"Show me 3BHK" mid-conversation can mean widening the search OR switching — the phrasing determines which.

```
Additive keywords (as well, also, too, and X, include X, along with):
  → APPEND to apartment_type_id: [2] + 3BHK = [2, 3]
  → Keep all other active filters unchanged
  → One combined search, mixed BHK carousel

Replacement keywords (instead, only, just, switch to, change to):
  → REPLACE apartment_type_id: [3]
  → Keep all other active filters unchanged

Bare "show me 3BHK" (no qualifier):
  → Default to REPLACE

Examples:
  "show me 3BHK as well"     → apartment_type_id: [2, 3]  (additive)
  "show me 3BHK also"        → apartment_type_id: [2, 3]  (additive)
  "show me 2BHK and 3BHK"   → apartment_type_id: [2, 3]  (explicit set)
  "show me 3BHK instead"     → apartment_type_id: [3]     (replace)
  "show me only 3BHK"        → apartment_type_id: [3]     (replace)
  "show me 3BHK"             → apartment_type_id: [3]     (replace, bare)
```

**System prompt instruction:**
```
When you detect an intent switch, always:
1. Acknowledge the switch in the summary line: "Switching to rental search in Gurgaon..."
2. Explicitly state what you're carrying forward and what you're dropping.
3. Ask for any required information that doesn't carry (usually budget).
4. Do NOT automatically carry price filters across transaction types — always ask.
5. Do NOT fire a search if the price signal is impossible or ambiguous in the current context — ask first.
6. For BHK changes: check for additive keywords before deciding replace vs append.
```

**Example — explicit switch:**
```
Switching to rental search in Gurgaon.

I'll keep your 3BHK preference and the gym + parking requirements.
Since rental and sale prices work differently, what's your monthly rental budget?
```

**Example — ambiguous price clarification:**
```
₹30K is too low to be a property price. Did you mean:
- ₹30K/month rent budget — I'll switch to rentals, or
- ₹30K per sq.ft (total ~₹2.4–3.6Cr for a 2BHK)?
```

**Example — additive BHK:**
```
Widening to 2BHK and 3BHK. Keeping all your other filters — here's the combined list.
```

---

## Use Case 10: Pagination

User says "show more", "next page", "see more properties".

```typescript
{
  name: "paginateSearch",
  description: "Load the next page of an existing search result set. Use when user asks for more properties after a carousel. Do NOT call searchProperties again — use the existing srset_id.",
  input_schema: {
    type: "object",
    properties: {
      srset_id: { type: "string" },
      page:     { type: "integer" }
    },
    required: ["srset_id", "page"]
  }
}
// Return → template: property_carousel (next 10)
```

LLM reads `last_carousel_srset_id` and `last_carousel_page` from session context. Calls `paginateSearch({ srset_id: "srset_abc123", page: 2 })`.

Bot Orchestrator updates `last_carousel_page` to 2. Appends new `property_ids` to `last_carousel_ids` (positions 11–20 now accessible by reference "11th property" etc.).

---

## Use Case 11: Project Comparison

User says:
- "compare DLF Privana with Godrej Interio"
- "compare this project with DLF Privana"
- "compare the first property with the third"

### Flow for "compare first with third":
```
1. Resolve "first" → last_carousel_ids[0] = prop_123
2. Resolve "third" → last_carousel_ids[2] = prop_345
3. Get project_ids for both (may differ if from different projects)
4. Parallel: getProjectDetail(proj_456), getProjectDetail(proj_789)
5. Render as markdown comparison
```

### `compareProjects` tool

```typescript
{
  name: "compareProjects",
  description: "Compare two projects. If given property_ids instead of project_ids, derive the project from each property. Returns a structured comparison for markdown rendering.",
  input_schema: {
    type: "object",
    properties: {
      project_id_a:  { type: "string" },
      project_id_b:  { type: "string" },
      property_id_a: { type: "string", description: "Alternative to project_id_a — derive project from property" },
      property_id_b: { type: "string", description: "Alternative to project_id_b" }
    }
  }
}
// Return → content_type: markdown
```

**Markdown comparison structure:**
```markdown
## DLF Privana South vs Godrej Interio

| | DLF Privana South | Godrej Interio |
|---|---|---|
| Location | Sector 77, Gurgaon | Sector 88A, Gurgaon |
| BHK Options | 3-4 BHK | 2-3 BHK |
| Price Range | ₹3.5–5Cr | ₹1.8–3.2Cr |
| Possession | Dec 2026 | Mar 2025 (ready) |
| RERA | ✓ Registered | ✓ Registered |
| Builder Rating | 4.3/5 | 4.1/5 |

### Amenities
...

### Verdict
DLF Privana South suits buyers looking for larger configurations and willing to wait for possession. 
Godrej Interio is ready-to-move and more affordable for the 2BHK segment.
```

**Followups:**
```
["Search DLF Privana | Search Godrej Interio | Compare localities | Show floor plans for DLF"]
```

---

## Use Case 12: Near-Me Flow

### Step 1: Request location

Bot sends template `share_location` with empty data and waits. Does NOT call any tool yet.

```json
{
  "templateId": "share_location",
  "data": {}
}
```

FE handles all 3 button states (initial / retry / OS-blocked) internally — no state field from BE needed.

If location permission was already granted in the browser, FE auto-sends `location_shared` without even rendering the template card.

### Step 2a: Permission granted

FE sends a `user_action` with `sender.type: "system"`:
```json
{
  "messageType": "user_action",
  "responseRequired": true,
  "content": {
    "data": {
      "action": "location_shared",
      "coordinates": [28.4595, 77.0266]
    }
  }
}
```

Bot Orchestrator extracts `[lat, lng]` from `coordinates`, stores in `conv:state`. Bot proceeds with the tool chain for the specific query type (see below).

### Step 2b: Permission explicitly denied
```json
{
  "messageType": "user_action",
  "responseRequired": true,
  "content": { "data": { "action": "location_denied" } }
}
```
Bot: "No problem. Which area or locality are you looking in?" — falls back to text locality input.

### Step 2c: Location not available (permission may be granted but no fix)
```json
{
  "messageType": "user_action",
  "responseRequired": true,
  "content": { "data": { "action": "location_not_available" } }
}
```
Same bot response as `location_denied` — ask for area by text.

### Step 2d: User ignores
No response after 30s → treat as soft denial. Bot: "If you'd prefer, just tell me the area you're interested in."

---

### Near-Me Resolution Chains

Not all "near me" queries go through the same tool chain. The split depends on whether the target tool accepts **lat/lng directly** or requires **city_id** or **locality_id**.

```
User query                         Tool chain
─────────────────────────────────────────────────────────────────────
"show properties near me"          lat/lng ──► searchProperties(lat, lng)
                                             (no geocode needed)

"show localities near me"          lat/lng ──► getNearbyLocalities(lat, lng)
                                             (accepts lat/lng directly)

"trending localities near me"      lat/lng ──► reverseGeocode(lat, lng)
                                             → city_id
                                             ──► getTrendingLocalities(city_id)

"investment hotspots near me"      lat/lng ──► reverseGeocode(lat, lng)
                                             → city_id
                                             ──► getInvestmentHotspots(city_id)

"similar localities near me"       lat/lng ──► reverseGeocode(lat, lng)
                                             → locality_id (if resolved)
                                             ──► getSimilarLocalities(locality_id)
                                             fallback if locality_id null:
                                             ──► getNearbyLocalities(lat, lng)

"price trends near me"             lat/lng ──► reverseGeocode(lat, lng)
                                             → locality_id
                                             ──► getLocalityPriceTrends(locality_id)

"reviews near me"                  lat/lng ──► reverseGeocode(lat, lng)
                                             → locality_id
                                             ──► getLocalityReviews(locality_id)
```

**Rule:** `reverseGeocode` is called **only** when the next tool needs `city_id` or `locality_id`. Tools that accept lat/lng directly (`searchProperties`, `getNearbyLocalities`) skip it entirely — one fewer round-trip.

**When `locality_id` is null after reverse geocode** (coordinates fall between locality boundaries):
- City-level tools (`getTrendingLocalities`, `getInvestmentHotspots`) still proceed — `city_id` is always returned.
- Locality-level tools fall back to `getNearbyLocalities(lat, lng)` as a proxy for "what's nearby."
- Bot acknowledges: "I couldn't pinpoint your exact locality, but here are options in [city_name] near you."

**System prompt instruction for near-me:**
```
NEAR-ME RESOLUTION:
- searchProperties and getNearbyLocalities accept lat/lng directly. Never call reverseGeocode before these.
- getTrendingLocalities and getInvestmentHotspots require city_id. Always call reverseGeocode first.
- All other locality-level tools require locality_id. Call reverseGeocode first; if locality_id is null,
  fall back to getNearbyLocalities(lat, lng) and tell the user why.
- After reverseGeocode, use area_label in your summary line: "Showing trending localities near [area_label]..."
- Store lat/lng from location_granted in session — don't request location again in the same session.
```

---

## System Prompt Additions (Covering All Use Cases)

```
ENTITY RESOLUTION RULES:
- Never pass raw names to searchProperties. Always call resolveEntity first for locality, landmark, builder, or project names.
- "this", "here", "the project" → resolve from session context (provided above), do not call resolveEntity.
- Carousel positions ("first", "second", "3rd") → resolve from last_carousel_ids in session context.
- If session context lacks required entity → ask user.

PRICE SANITY THRESHOLDS (India real estate):
- Valid buy total price:    ₹10L – ₹50Cr+
- Valid rent/month:         ₹3K – ₹5L
- Valid price/sqft (buy):   ₹2K – ₹50K+
Before applying any price filter, check if the number makes sense in the current transaction_type:
- If impossible (e.g. "30K" in buy context — can't be total price): DO NOT search. Ask which interpretation.
- If ambiguous between two valid readings (rent budget vs sqft price): DO NOT search. Present both options.
- If unambiguous (e.g. "80L" in buy, "25K" in rent): proceed.
When clarifying: explain why it's ambiguous in one sentence, present exactly 2 concrete options with what each means.

BHK FILTER SEMANTICS:
- Additive keywords (as well, also, too, and X, include X): APPEND to apartment_type_id array.
- Replacement keywords (instead, only, just, switch to): REPLACE apartment_type_id.
- Bare "show me 3BHK" with no qualifier: REPLACE.
- On APPEND: run one combined search with the full array, carry all other filters unchanged.

FILTER MANAGEMENT:
- Track filters across turns. Filters persist unless user explicitly changes them or intent switches.
- On transaction_type switch: always drop price filters, ask for new budget. Drop construction_status, sale_type, age for rent. Drop "plot" type for rent, "pg" type for buy.
- On city change: drop price range (city prices differ), drop locality/landmark entities. Keep BHK, property_type, amenities, area range.
- On locality change within city: replace locality_ids only, carry all other filters.
- When applying any filter change, call applyFilter (not searchProperties) to preserve the result set ID.

PAGINATION:
- "show more", "next", "more properties" → call paginateSearch with existing srset_id, not searchProperties.
- Increment page by 1 from last_carousel_page in session context.

ZERO RESULTS:
- When searchProperties returns 0: immediately call getPropertyCountByRelaxingFilters with 3-4 combinations.
- Present relaxation options as followup chips. Do NOT make up reasons why there are no results.

TOOL CALL LIMITS PER TURN:
- resolveEntity: max once per distinct name, never for cities.
- reverseGeocode: max once per session after location_granted. Result is stored in conv:state — do not call again.
- searchProperties: max once per turn. Collect all signals first.
- compareLocalities / compareProjects: requires both entity IDs resolved before calling.

NEAR-ME RESOLUTION:
- searchProperties and getNearbyLocalities accept lat/lng directly. Never call reverseGeocode before these.
- getTrendingLocalities and getInvestmentHotspots require city_id. Always call reverseGeocode first.
- All other locality-level tools require locality_id. Call reverseGeocode first; if locality_id is null,
  fall back to getNearbyLocalities(lat, lng) and tell the user why.
- After reverseGeocode, use area_label in your summary line: "Showing trending localities near [area_label]..."
- lat/lng is stored in session after location_shared — do not send share_location template again in the same session.

CLARIFICATION STYLE — TEXT vs NESTED_QNA:
- Default to plain text for clarifications. Only use nested_qna when the user needs to see a list.
- Plain text: price ambiguity, transaction type, binary choices, single-entity confirmation ("did you mean X?").
  User answers with a word or short phrase. You parse the response.
- nested_qna: entity disambiguation with 3+ options, options with metadata (city/type/price),
  multiple ambiguous names in one turn, or cases where the user cannot type an unambiguous answer.
- Never ask a nested_qna for something the user could answer with one word.

TEMPLATES vs TEXT:
- Always use templates for: property results, locality results, images, floor plans, payment plans, reviews, brochures.
- Use markdown for: comparisons, price trends, reviews summaries, transaction data.
- Use text for: conversational answers, clarifications, error messages.
- A reply can mix text + template (text before the template, followup chips after).
- Template IDs: property_carousel, locality_carousel, image_gallery, floor_plans, payment_plan, amenities, download_brochure, shortlist_property, contact_seller, login, share_location, nested_qna, price_trends, transaction_history, reviews.
```

---

## Complete Tool Inventory

```
resolveEntity                      Entity name → system ID
reverseGeocode                     lat/lng → city_id + locality_id (for near-me chains)
searchProperties                   Core property search (accepts lat/lng directly)
paginateSearch                     Next page of existing results
getPropertyCountByRelaxingFilters  Zero-result recovery
convertAreaUnit                    sq yard → sqft etc.
convertPricePerSqftToAbsolute      ₹/sqft → absolute range

getPropertyDetail                  Full property detail
getPropertyImages                  Image gallery
getFloorPlans                      Floor plan images
getPropertyAmenities               Amenities list
getPaymentPlan                     Builder payment schedule
getSimilarProperties               Similar listings
initiateContact                    Trigger P2P / contact_seller
shortlistProperty                  Save property (auth-gated)

getLocalityDetail                  Locality overview
getLocalityReviews                 Resident reviews
getProjectReviews                  Project-level reviews
getLocalityPriceTrends             Price trend data
getLocalityTransactions            Registered transactions
getNearbyLocalities                Localities within radius (accepts lat/lng directly)
getSimilarLocalities               Comparable localities
getTrendingLocalities              Trending in city
getInvestmentHotspots              Investment picks in city
compareLocalities                  Side-by-side locality compare

getProjectDetail                   Builder, RERA, construction
compareProjects                    Side-by-side project compare

getUserSavedProperties             Saved listings (auth-gated)
getUserContactedProperties         Contacted listings (auth-gated)

applyFilter                        Modify active search filters
```
