"""DevExecutor — contextual mock tool responses for BOT_ENV=dev.

Implements CachedExecutorPort. Each handler reads the actual request params
(city, BHK, localities, price range, entity names) and returns realistic
Housing-style data so the LLM receives meaningful context for its response.

No HTTP calls — entirely in-process. Designed so a full conversation (search →
detail → locality → price trends) feels internally consistent.
"""
from __future__ import annotations

import hashlib
import math
import uuid
from typing import Any

from src.observability.logging import get_logger

log = get_logger(__name__)

# ---------------------------------------------------------------------------
# City → locality catalogue  (name, avg_price_per_sqft, rating, yoy_growth%)
# ---------------------------------------------------------------------------

_CITY_LOCALITIES: dict[str, list[dict]] = {
    "mumbai": [
        {"name": "Bandra West",    "slug": "bandra-west",    "avg_psf": 35000, "rating": 4.5, "yoy": 8.2},
        {"name": "Andheri West",   "slug": "andheri-west",   "avg_psf": 22000, "rating": 4.2, "yoy": 7.1},
        {"name": "Powai",          "slug": "powai",          "avg_psf": 24000, "rating": 4.4, "yoy": 9.3},
        {"name": "Worli",          "slug": "worli",          "avg_psf": 42000, "rating": 4.6, "yoy": 6.8},
        {"name": "Juhu",           "slug": "juhu",           "avg_psf": 38000, "rating": 4.3, "yoy": 5.5},
        {"name": "Malad West",     "slug": "malad-west",     "avg_psf": 18000, "rating": 4.0, "yoy": 10.1},
        {"name": "Goregaon East",  "slug": "goregaon-east",  "avg_psf": 17500, "rating": 3.9, "yoy": 11.2},
        {"name": "Kandivali East", "slug": "kandivali-east", "avg_psf": 16000, "rating": 3.8, "yoy": 12.0},
        {"name": "Thane West",     "slug": "thane-west",     "avg_psf": 12500, "rating": 4.1, "yoy": 13.5},
        {"name": "Navi Mumbai",    "slug": "navi-mumbai",    "avg_psf": 10000, "rating": 4.0, "yoy": 14.0},
    ],
    "bangalore": [
        {"name": "Whitefield",       "slug": "whitefield",       "avg_psf": 8500,  "rating": 4.3, "yoy": 15.2},
        {"name": "Koramangala",      "slug": "koramangala",      "avg_psf": 12000, "rating": 4.5, "yoy": 10.4},
        {"name": "Indiranagar",      "slug": "indiranagar",      "avg_psf": 13500, "rating": 4.6, "yoy": 9.8},
        {"name": "HSR Layout",       "slug": "hsr-layout",       "avg_psf": 10000, "rating": 4.4, "yoy": 12.1},
        {"name": "Electronic City",  "slug": "electronic-city",  "avg_psf": 6500,  "rating": 4.0, "yoy": 16.5},
        {"name": "Sarjapur Road",    "slug": "sarjapur-road",    "avg_psf": 7500,  "rating": 4.1, "yoy": 14.3},
        {"name": "Yelahanka",        "slug": "yelahanka",        "avg_psf": 6000,  "rating": 3.9, "yoy": 17.0},
        {"name": "Hebbal",           "slug": "hebbal",           "avg_psf": 9000,  "rating": 4.2, "yoy": 11.8},
    ],
    "delhi": [
        {"name": "Dwarka",           "slug": "dwarka",           "avg_psf": 8000,  "rating": 4.0, "yoy": 9.0},
        {"name": "Rohini",           "slug": "rohini",           "avg_psf": 9500,  "rating": 3.9, "yoy": 8.5},
        {"name": "Vasant Kunj",      "slug": "vasant-kunj",      "avg_psf": 15000, "rating": 4.3, "yoy": 7.0},
        {"name": "Greater Kailash",  "slug": "greater-kailash",  "avg_psf": 18000, "rating": 4.5, "yoy": 6.2},
        {"name": "Saket",            "slug": "saket",            "avg_psf": 16000, "rating": 4.4, "yoy": 6.8},
    ],
    "pune": [
        {"name": "Kothrud",          "slug": "kothrud",          "avg_psf": 9000,  "rating": 4.3, "yoy": 11.5},
        {"name": "Baner",            "slug": "baner",            "avg_psf": 10500, "rating": 4.4, "yoy": 13.2},
        {"name": "Hinjewadi",        "slug": "hinjewadi",        "avg_psf": 7500,  "rating": 4.0, "yoy": 16.8},
        {"name": "Wakad",            "slug": "wakad",            "avg_psf": 8000,  "rating": 4.1, "yoy": 15.0},
        {"name": "Viman Nagar",      "slug": "viman-nagar",      "avg_psf": 11000, "rating": 4.5, "yoy": 10.8},
    ],
    "hyderabad": [
        {"name": "Gachibowli",       "slug": "gachibowli",       "avg_psf": 8000,  "rating": 4.3, "yoy": 14.0},
        {"name": "HITEC City",       "slug": "hitec-city",       "avg_psf": 9500,  "rating": 4.4, "yoy": 12.5},
        {"name": "Kondapur",         "slug": "kondapur",         "avg_psf": 7500,  "rating": 4.1, "yoy": 15.5},
        {"name": "Jubilee Hills",    "slug": "jubilee-hills",    "avg_psf": 14000, "rating": 4.5, "yoy": 8.0},
        {"name": "Banjara Hills",    "slug": "banjara-hills",    "avg_psf": 15000, "rating": 4.6, "yoy": 7.5},
    ],
}

_BUILDERS = ["Lodha", "Godrej Properties", "Prestige Group", "Sobha", "DLF", "Tata Housing", "Brigade Group", "Shapoorji Pallonji"]
_AMENITIES = ["Swimming Pool", "Gym", "Club House", "Children's Play Area", "24/7 Security", "Power Backup", "Parking", "Landscaped Gardens", "Jogging Track", "Tennis Court"]
_BHK_AREA = {1: 550, 2: 900, 3: 1300, 4: 1800, 5: 2500}


def _stable_id(seed: str) -> str:
    """Generate a stable UUID from a string seed."""
    return str(uuid.UUID(hashlib.md5(seed.encode()).hexdigest()))


def _city_key(city: str) -> str:
    return (city or "").lower().strip()


def _get_locality_info(city: str, locality_name: str) -> dict | None:
    locs = _CITY_LOCALITIES.get(_city_key(city), [])
    name_lower = locality_name.lower()
    for loc in locs:
        if loc["name"].lower() == name_lower or loc["slug"] == name_lower.replace(" ", "-"):
            return loc
    # Fuzzy match: first word
    for loc in locs:
        if name_lower.split()[0] in loc["name"].lower():
            return loc
    return None


def _top_localities(city: str, n: int = 6) -> list[dict]:
    locs = _CITY_LOCALITIES.get(_city_key(city), _CITY_LOCALITIES["mumbai"])
    return locs[:n]


def _make_property(
    idx: int,
    city: str,
    locality: str,
    bhk: int,
    psf: int,
    transaction_type: str = "buy",
) -> dict:
    area = _BHK_AREA.get(bhk, 900)
    price = psf * area
    pid = _stable_id(f"prop-{city}-{locality}-{bhk}-{idx}")
    return {
        "id": pid,
        "title": f"{bhk} BHK Apartment in {locality}",
        "price": price,
        "price_display": f"₹{price // 100000:.1f}L" if price < 10_000_000 else f"₹{price / 10_000_000:.2f}Cr",
        "bhk": bhk,
        "carpet_area": area,
        "locality": {"name": locality, "city": city},
        "transaction_type": transaction_type,
        "images": [{"url": f"https://img.housing.com/dev-mock/{pid}/1.jpg"}],
        "seller": {"name": f"{_BUILDERS[idx % len(_BUILDERS)]} Sales", "phone": "XXXXXXXXXX"},
        "amenities": _AMENITIES[:5],
        "rera_id": f"P51900{'0' * (6 - len(str(idx + 10000)))}{idx + 10000}",
    }


# ---------------------------------------------------------------------------
# Per-tool handlers
# ---------------------------------------------------------------------------

def _handle_search_properties(params: dict) -> dict:
    city = params.get("city", "") or "Mumbai"
    bhk_list = params.get("bhk") or params.get("bedrooms") or [2]
    localities = params.get("localities") or []
    price_max = params.get("price_max")
    transaction_type = params.get("transaction_type", "buy")

    locality_name = localities[0] if localities else _top_localities(city, 1)[0]["name"]
    loc_info = _get_locality_info(city, locality_name)
    psf = (loc_info or {}).get("avg_psf", 15000)

    # Scale PSF down slightly so price_max doesn't filter everything out
    if price_max:
        bhk = bhk_list[0] if bhk_list else 2
        area = _BHK_AREA.get(bhk, 900)
        max_psf = price_max // area
        psf = min(psf, int(max_psf * 0.85))

    properties = []
    for i in range(5):
        bhk = bhk_list[i % len(bhk_list)]
        # slight price variation across listings
        varied_psf = int(psf * (0.90 + 0.05 * i))
        properties.append(_make_property(i, city, locality_name, bhk, varied_psf, transaction_type))

    return {
        "hits": properties,
        "total_count": 47 + len(properties),
        "srset_id": _stable_id(f"srset-{city}-{locality_name}"),
        "facets": {
            "bhk": {str(b): 10 + b * 3 for b in (bhk_list or [2])},
            "price_range": {"min": properties[0]["price"], "max": properties[-1]["price"]},
        },
    }


def _handle_get_property_detail(params: dict) -> dict:
    prop_id = params.get("property_id") or params.get("id") or _stable_id("default-prop")
    # Derive a plausible property from the ID seed
    seed = int(hashlib.md5(prop_id.encode()).hexdigest()[:4], 16)
    city = "Mumbai"
    locs = _top_localities(city, 5)
    loc = locs[seed % len(locs)]
    bhk = 2 + (seed % 3)
    area = _BHK_AREA.get(bhk, 900)
    price = loc["avg_psf"] * area
    builder = _BUILDERS[seed % len(_BUILDERS)]
    return {
        "property_id": prop_id,
        "title": f"{bhk} BHK Premium Apartment in {loc['name']}",
        "price": price,
        "price_display": f"₹{price / 10_000_000:.2f}Cr" if price >= 10_000_000 else f"₹{price // 100000:.0f}L",
        "bhk": bhk,
        "carpet_area": area,
        "locality": {"name": loc["name"], "city": city, "id": _stable_id(loc["slug"])},
        "project": {"name": f"{builder} {loc['name'].split()[0]} Residences", "id": _stable_id(f"proj-{builder}")},
        "amenities": _AMENITIES[:7],
        "images": [{"url": f"https://img.housing.com/dev-mock/{prop_id}/{i}.jpg"} for i in range(1, 5)],
        "seller": {"name": f"{builder} Sales", "phone": "XXXXXXXXXX", "id": _stable_id(f"seller-{builder}")},
        "floor_plans": [
            {"type": f"{bhk}BHK-A", "carpet_area": area, "url": f"https://img.housing.com/dev-mock/{prop_id}/fp1.jpg"},
        ],
        "rera_id": f"P519{seed:06d}",
        "transaction_type": "buy",
        "possession_date": "Dec 2026",
        "age_of_property": "Under Construction",
    }


def _handle_resolve_entity(params: dict) -> dict:
    query = params.get("query", "")
    entity_type = params.get("entity_type", "locality")
    city = params.get("city", "Mumbai")

    loc_info = _get_locality_info(city, query)
    if loc_info:
        return {
            "uuid": _stable_id(loc_info["slug"]),
            "display_name": loc_info["name"],
            "entity_type": entity_type,
            "confidence": 0.94,
            "city": city,
        }
    # Unknown entity — return a plausible resolution with moderate confidence
    return {
        "uuid": _stable_id(f"{entity_type}-{query.lower()}"),
        "display_name": query.title(),
        "entity_type": entity_type,
        "confidence": 0.72,
        "city": city,
    }


def _handle_get_locality_detail(params: dict) -> dict:
    locality_id = params.get("locality_id") or params.get("id") or ""
    city = params.get("city", "Mumbai")

    loc_info = None
    for locs in _CITY_LOCALITIES.values():
        for loc in locs:
            if _stable_id(loc["slug"]) == locality_id or loc["slug"] in locality_id.lower():
                loc_info = loc
                break
        if loc_info:
            break
    if not loc_info:
        locs = _top_localities(city, 1)
        loc_info = locs[0] if locs else {"name": "Bandra West", "slug": "bandra-west", "avg_psf": 35000, "rating": 4.5, "yoy": 8.2}

    name = loc_info["name"]
    psf  = loc_info["avg_psf"]
    return {
        # Field names match GetLocalityDetailExecutor output + LLM prompt context
        "locality_id":    locality_id or _stable_id(loc_info["slug"]),
        "display_name":   name,          # ← was "name"; match executor output
        "city":           city,
        "overview": (
            f"{name} is a {('premium' if psf > 20000 else 'mid-range')} residential locality in {city}. "
            f"Average price ₹{psf:,}/sqft. {loc_info['yoy']}% YoY growth. "
            f"Well-connected with schools, hospitals, and malls nearby."
        ),
        "avg_price_sqft":  psf,           # ← was "avg_price_per_sqft"; match executor
        "price_trend":     {"yoy_change_percent": loc_info["yoy"], "direction": "rising" if loc_info["yoy"] > 8 else "stable"},
        "ratings": {
            "overall": loc_info["rating"],
            "connectivity": min(loc_info["rating"] + 0.1, 5.0),
            "safety": loc_info["rating"] - 0.1,
            "amenities": loc_info["rating"],
        },
        "connectivity": [
            f"{name} Metro Station — 0.8 km",
            "Western Express Highway — 2.1 km",
        ],
        "nearby_schools":   ["Ryan International School", "St. Xavier's High School"],
        "nearby_hospitals": ["Holy Family Hospital", "Lilavati Hospital"],
        "total_listings":   1200 + int(psf / 100),
    }


def _handle_get_trending_localities(params: dict) -> dict:
    city = params.get("city", "Mumbai")
    locs = _top_localities(city, 6)
    return {
        "localities": [
            {
                "id": _stable_id(loc["slug"]),
                "name": loc["name"],
                "city": city,
                "avg_price_per_sqft": loc["avg_psf"],
                "yoy_growth_percent": loc["yoy"],
                "rating": loc["rating"],
                "image": f"https://img.housing.com/dev-mock/locality/{loc['slug']}.jpg",
                "url": f"https://housing.com/in/buy/projects/{loc['slug']}-{city.lower()}",
                "price_trend": "rising" if loc["yoy"] > 10 else "stable",
            }
            for loc in locs
        ],
        "total": len(locs),
    }


def _handle_get_price_trends(params: dict) -> dict:
    locality_id = params.get("locality_id") or params.get("project_id") or ""
    city = params.get("city", "Mumbai")

    loc_info = None
    for locs in _CITY_LOCALITIES.values():
        for loc in locs:
            if _stable_id(loc["slug"]) == locality_id:
                loc_info = loc
                break
    base_psf = (loc_info or {}).get("avg_psf", 15000)
    yoy      = (loc_info or {}).get("yoy", 9.0)
    monthly_growth = yoy / 12.0

    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    data_points = []
    current_psf = base_psf * (1 - yoy / 100)
    for i, month in enumerate(months):
        current_psf = current_psf * (1 + monthly_growth / 100)
        data_points.append({                       # ← field names match real executor
            "month":           f"{month} 2026",
            "avg_price_sqft":  int(current_psf),   # ← was "avg_price_per_sqft"
            "transactions":    45 + i * 3,
        })

    return {
        "locality_id":      locality_id,
        "locality_name":    (loc_info or {}).get("name", "Unknown"),
        "transaction_type": params.get("transaction_type", "buy"),
        "data_points":      data_points,           # ← was "monthly_trends"
        "current_price":    base_psf,              # ← was "current_avg_psf"
        "yoy_change_pct":   yoy,                   # ← was "yoy_growth_percent"
        "trend_direction":  "rising" if yoy > 8 else "stable",
    }


def _handle_get_project_detail(params: dict) -> dict:
    project_id = params.get("project_id") or params.get("id") or _stable_id("default-proj")
    seed = int(hashlib.md5(project_id.encode()).hexdigest()[:4], 16)
    builder = _BUILDERS[seed % len(_BUILDERS)]
    locs = _top_localities("Mumbai", 5)
    loc = locs[seed % len(locs)]
    psf = loc["avg_psf"]
    return {
        "project_id": project_id,
        "name": f"{builder} {loc['name'].split()[0]} Signature",
        "builder": builder,
        "locality": {"name": loc["name"], "city": "Mumbai"},
        "launch_date": "Jan 2024",
        "possession_date": "Dec 2027",
        "price_per_sqft": psf,
        "price_range": f"₹{psf * 600 // 100000:.0f}L – ₹{psf * 1800 // 10000000:.1f}Cr",
        "configurations": ["1 BHK", "2 BHK", "3 BHK"],
        "total_units": 320,
        "units_sold": int(320 * 0.65),
        "rera_id": f"P519{seed:06d}",
        "amenities": _AMENITIES[:8],
        "highlights": [
            "RERA approved",
            f"By {builder} — {seed % 30 + 10} years in real estate",
            f"OC received for Tower A",
            "Green building certified",
        ],
        "rating": loc["rating"],
    }


def _handle_get_similar_properties(params: dict) -> dict:
    prop_id = params.get("property_id") or _stable_id("default-prop")
    seed = int(hashlib.md5(prop_id.encode()).hexdigest()[:4], 16)
    city = "Mumbai"
    locs = _top_localities(city, 5)
    loc = locs[seed % len(locs)]
    bhk = 2 + (seed % 2)
    return {
        "properties": [
            _make_property(seed + i, city, loc["name"], bhk, int(loc["avg_psf"] * (0.92 + 0.04 * i)))
            for i in range(3)
        ],
        "total": 3,
    }


def _handle_get_brochure(params: dict) -> dict:
    prop_id = params.get("property_id") or params.get("project_id") or _stable_id("default-prop")
    return {
        "brochure_url": f"https://img.housing.com/dev-mock/brochure/{prop_id}.pdf",
        "property_id": prop_id,
        "available": True,
    }


def _handle_get_nearby_landmarks(params: dict) -> dict:
    return {
        "landmarks": [
            # Field names match tool_registry schema: category, distance_metres, walk_minutes
            {"name": "Holy Family Hospital",       "category": "hospital",  "distance_metres": 400,  "walk_minutes": 5},
            {"name": "Linking Road Market",         "category": "mall",      "distance_metres": 700,  "walk_minutes": 9},
            {"name": "Bandra Kurla Complex",        "category": "it_hub",    "distance_metres": 2100, "walk_minutes": 26},
            {"name": "Bandstand Promenade",         "category": "park",      "distance_metres": 1200, "walk_minutes": 15},
            {"name": "St. Stanislaus High School",  "category": "school",    "distance_metres": 500,  "walk_minutes": 6},
        ][:5],
        "total": 5,
    }


def _handle_get_ratings_reviews(params: dict) -> dict:
    entity_id = params.get("locality_id") or params.get("project_id") or ""
    return {
        "overall_rating": 4.2,
        "total_reviews": 847,
        "breakdown": {
            "connectivity": 4.4,
            "safety":       4.1,
            "amenities":    4.0,
            "cleanliness":  3.9,
            "value_for_money": 4.3,
        },
        "top_reviews": [
            {"text": "Great connectivity to Western line. Weekend market is a plus.", "rating": 5, "date": "Mar 2026"},
            {"text": "Good locality, though parking can be tight during weekends.", "rating": 4, "date": "Feb 2026"},
        ],
    }


def _handle_get_saved_properties(params: dict) -> dict:
    return {
        "properties": [_make_property(i, "Mumbai", "Bandra West", 2, 35000) for i in range(2)],
        "total": 2,
    }


def _handle_get_recommendations(params: dict) -> dict:
    city = params.get("city", "Mumbai")
    locs = _top_localities(city, 3)
    props = [_make_property(i, city, locs[i % len(locs)]["name"], 2, locs[i % len(locs)]["avg_psf"]) for i in range(4)]
    return {"properties": props, "total": len(props)}


def _handle_calculate_emi(params: dict) -> dict:
    # Accept both property_price (TOOL_REGISTRY schema) and loan_amount (executor name)
    if "property_price" in params:
        down_pct    = float(params.get("down_payment_pct", 20) or 20) / 100
        loan_amount = float(params["property_price"]) * (1 - down_pct)
        rate         = float(params.get("interest_rate_annual", 8.5) or 8.5)
        tenure_years = int(params.get("loan_tenure_years", 20) or 20)
    else:
        loan_amount  = float(params.get("loan_amount", 5_000_000) or 5_000_000)
        rate         = float(params.get("rate", 8.5) or 8.5)
        tenure_years = int(params.get("tenure_years", 20) or 20)
    r = rate / 1200
    n = tenure_years * 12
    emi = int(loan_amount * r * (1 + r) ** n / ((1 + r) ** n - 1)) if r > 0 else int(loan_amount / n)
    return {"monthly_emi": emi, "loan_amount": int(loan_amount), "rate": rate,
            "tenure_years": tenure_years, "total_amount": emi * n, "total_payment": emi * n,
            "total_interest": int(emi * n - loan_amount)}


def _handle_calculate_affordability(params: dict) -> dict:
    monthly_income = (
        float(params.get("monthly_salary") or 0) or
        float(params.get("monthly_income") or 0) or
        float(params.get("annual_salary") or 0) / 12 or
        200_000
    )
    max_emi  = monthly_income * 0.40
    r, n     = 8.5 / 1200, 240
    max_loan = int(max_emi * ((1 + r) ** n - 1) / (r * (1 + r) ** n))
    down     = int(max_loan * 0.20)
    return {"monthly_income": int(monthly_income), "max_emi": int(max_emi), "max_loan": max_loan,
            "affordable_property_price": max_loan + down, "recommended_budget": max_loan + down,
            "min_down_payment": down, "foir_pct": 40}


def _handle_convert_unit(params: dict) -> dict:
    value     = float(params.get("value", 1) or 1)
    from_unit = (params.get("from") or params.get("from_unit") or "sqft").lower()
    to_unit   = (params.get("to")   or params.get("to_unit")   or "sqm").lower()
    conversions = {("sqft", "sqm"): 0.092903, ("sqm", "sqft"): 10.7639,
                   ("sqft", "sqyard"): 0.111111, ("sqyard", "sqft"): 9.0,
                   ("sqft", "acre"): 0.0000229568, ("acre", "sqft"): 43560.0,
                   ("sqm", "sqyard"): 1.19599, ("sqyard", "sqm"): 0.836127,
                   ("sqft", "bigha"): 0.0000826446, ("bigha", "sqft"): 12100.0}
    factor = conversions.get((from_unit, to_unit), 1.0)
    return {"result": round(value * factor, 4), "from_unit": from_unit, "to_unit": to_unit, "value": value}


def _handle_get_floor_plans(params: dict) -> dict:
    prop_id = params.get("property_id") or params.get("project_id") or _stable_id("fp")
    return {
        "floor_plans": [
            {"type": "2BHK-A", "carpet_area": 900,  "url": f"https://img.housing.com/dev-mock/{prop_id}/fp1.jpg"},
            {"type": "2BHK-B", "carpet_area": 950,  "url": f"https://img.housing.com/dev-mock/{prop_id}/fp2.jpg"},
            {"type": "3BHK-A", "carpet_area": 1300, "url": f"https://img.housing.com/dev-mock/{prop_id}/fp3.jpg"},
        ],
        "total": 3,
    }


def _handle_get_trending_projects(params: dict) -> dict:
    city = params.get("city", "Mumbai")
    locs = _top_localities(city, 3)
    return {
        "projects": [
            {
                "project_id":   _stable_id(f"proj-{i}-{city}"),
                "name":         f"{_BUILDERS[i % len(_BUILDERS)]} {locs[i % len(locs)]['name'].split()[0]} Signature",
                "builder":      _BUILDERS[i % len(_BUILDERS)],
                "locality":     {"name": locs[i % len(locs)]["name"], "city": city},
                "price_range":  f"₹{locs[i % len(locs)]['avg_psf'] * 600 // 100000:.0f}L – ₹{locs[i % len(locs)]['avg_psf'] * 1800 // 10000000:.1f}Cr",
                "launch_date":  "Jan 2024",
                "bhk_range":    "1–3 BHK",
            }
            for i in range(4)
        ],
        "total": 4,
    }


def _handle_get_demand_supply(params: dict) -> dict:
    return {"demand_supply_ratio": 1.35, "buyer_interest": "high", "active_listings": 2400,
            "new_listings_last_30d": 180, "avg_days_on_market": 45,
            "demand_percentages": {"buy": 65, "rent": 35}, "supply": {"total_units": 2400}}


def _handle_get_travel_time(params: dict) -> dict:
    return {
        "travel_time_minutes": {"car": 35, "transit": 55, "walking": 180},
        "distance_km": 14.2,
    }


def _handle_get_transaction_history(params: dict) -> dict:
    return {
        "transactions": [
            {"date": "Mar 2026", "price_per_sqft": 34500, "area": 950},
            {"date": "Jan 2026", "price_per_sqft": 33800, "area": 900},
            {"date": "Nov 2025", "price_per_sqft": 33200, "area": 850},
        ],
        "total": 3,
    }


# ---------------------------------------------------------------------------
# Dispatch table
# ---------------------------------------------------------------------------

def _handle_get_price_buckets(params: dict) -> dict:
    city = params.get("city", "Mumbai")
    locs = _top_localities(city, 1)
    base_psf = locs[0]["avg_psf"] if locs else 20000
    area = 900
    return {
        "price_buckets": [
            {"range_label": f"Under ₹{base_psf * area * 0.6 // 100000:.0f}L",   "min": 0,                      "max": int(base_psf * area * 0.6),   "count": 120},
            {"range_label": f"₹{base_psf * area * 0.6 // 100000:.0f}L–₹{base_psf * area // 100000:.0f}L", "min": int(base_psf * area * 0.6), "max": int(base_psf * area), "count": 340},
            {"range_label": f"Above ₹{base_psf * area // 100000:.0f}L",          "min": int(base_psf * area),   "max": None,                         "count": 210},
        ],
        "p90_price": int(base_psf * area * 1.3),
        "city": city,
    }


_HANDLERS: dict[str, Any] = {
    "searchProperties":         _handle_search_properties,
    "getPropertyDetail":        _handle_get_property_detail,
    "resolveEntity":            _handle_resolve_entity,
    "getLocalityDetail":        _handle_get_locality_detail,
    "getTrendingLocalities":    _handle_get_trending_localities,
    "getPriceTrends":           _handle_get_price_trends,
    "getProjectDetail":         _handle_get_project_detail,
    "getProjectPriceTrends":    _handle_get_price_trends,
    "getSimilarProperties":     _handle_get_similar_properties,
    "getFloorPlans":            _handle_get_floor_plans,
    "getBrochure":              _handle_get_brochure,
    "getNearbyLandmarks":       _handle_get_nearby_landmarks,
    "getRatingsReviews":        _handle_get_ratings_reviews,
    "getSavedProperties":       _handle_get_saved_properties,
    "getViewedProperties":      _handle_get_saved_properties,
    "getRecentlyViewed":        _handle_get_saved_properties,
    "getRecommendations":       _handle_get_recommendations,
    "getTrendingProjects":      _handle_get_trending_projects,
    "calculateEMI":             _handle_calculate_emi,
    "calculateAffordability":   _handle_calculate_affordability,
    "convertUnit":              _handle_convert_unit,
    "getDemandSupplyInsight":   _handle_get_demand_supply,
    "getPriceBuckets":          _handle_get_price_buckets,
    "getTravelTime":            _handle_get_travel_time,
    "getTransactionHistory":    _handle_get_transaction_history,
}


# ---------------------------------------------------------------------------
# DevExecutor
# ---------------------------------------------------------------------------

class DevExecutor:
    """CachedExecutorPort implementation for BOT_ENV=dev.

    Generates contextually appropriate mock data from params (city, BHK,
    locality, price range, entity names) so the LLM receives meaningful input.
    No HTTP calls — entirely in-process.
    """

    def __init__(self):
        self.calls_made: list[dict] = []

    async def execute(self, tool: str, params: dict, ttl: int = 0) -> Any:
        self.calls_made.append({"tool": tool, "params": params})
        handler = _HANDLERS.get(tool)
        if handler:
            try:
                result = handler(params)
                log.info("dev_executor_tool_call", tool=tool, params_keys=list(params.keys()))
                return result
            except Exception as exc:
                log.warning("dev_executor_handler_error", tool=tool, error=str(exc))
                return {}
        log.info("dev_executor_no_handler", tool=tool)
        return {}

    async def invalidate_cache(self, tool: str, session_id: str) -> None:
        pass
