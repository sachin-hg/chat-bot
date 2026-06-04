"""HousingToolExecutor — routes execute(tool, params, ttl) to the right specific executor.

Implements CachedExecutorPort for BOT_ENV=local/staging/production.
Lazily initialises per-tool executor instances on first call.
Handles pure-computation tools (calculateEMI, calculateAffordability, convertUnit)
inline — no HTTP call needed.
"""
from __future__ import annotations

import math
from typing import Any

from src.config import Settings
from src.observability.logging import get_logger
from src.tools.executor import HttpToolExecutor, get_tool_cache_ttl

log = get_logger(__name__)

# ---------------------------------------------------------------------------
# Inline computation handlers (no HTTP, no executor class needed)
# ---------------------------------------------------------------------------

def _calculate_emi(params: dict) -> dict:
    loan_amount = float(params.get("loan_amount", 0) or 0)
    rate        = float(params.get("rate", 8.5) or 8.5)
    tenure_years = int(params.get("tenure_years", 20) or 20)
    if loan_amount <= 0:
        return {"error": "loan_amount required"}
    r = rate / 1200
    n = tenure_years * 12
    emi = int(loan_amount * r * (1 + r) ** n / ((1 + r) ** n - 1)) if r > 0 else int(loan_amount / n)
    return {
        "monthly_emi":   emi,
        "loan_amount":   loan_amount,
        "rate":          rate,
        "tenure_years":  tenure_years,
        "total_amount":  emi * n,
        "total_interest": emi * n - loan_amount,
    }


def _calculate_affordability(params: dict) -> dict:
    monthly_income = float(params.get("monthly_income", 0) or 0)
    if monthly_income <= 0:
        return {"error": "monthly_income required"}
    # Standard 40% EMI rule, 20-year loan at 8.5%
    max_emi     = monthly_income * 0.40
    r, n        = 8.5 / 1200, 240
    max_loan    = int(max_emi * ((1 + r) ** n - 1) / (r * (1 + r) ** n))
    down_payment = int(max_loan * 0.20)  # typical 20% down payment
    return {
        "monthly_income":       monthly_income,
        "max_emi":              int(max_emi),
        "max_loan":             max_loan,
        "recommended_budget":   max_loan + down_payment,
        "min_down_payment":     down_payment,
        "assumed_rate_percent": 8.5,
        "assumed_tenure_years": 20,
    }


def _convert_unit(params: dict) -> dict:
    value     = float(params.get("value", 0) or 0)
    from_unit = (params.get("from_unit") or "sqft").lower()
    to_unit   = (params.get("to_unit")   or "sqm").lower()
    _factors: dict[tuple, float] = {
        ("sqft",   "sqm"):     0.092903,
        ("sqm",    "sqft"):    10.7639,
        ("sqft",   "sqyard"):  0.111111,
        ("sqyard", "sqft"):    9.0,
        ("sqft",   "acre"):    0.0000229568,
        ("acre",   "sqft"):    43560.0,
        ("sqm",    "sqyard"):  1.19599,
        ("sqyard", "sqm"):     0.836127,
        ("sqft",   "bigha"):   0.0000826446,   # approx (varies by state)
        ("bigha",  "sqft"):    12100.0,
    }
    factor = _factors.get((from_unit, to_unit))
    if factor is None:
        return {"error": f"Unsupported conversion: {from_unit} → {to_unit}"}
    return {
        "value":     value,
        "from_unit": from_unit,
        "to_unit":   to_unit,
        "result":    round(value * factor, 4),
    }


_INLINE_HANDLERS = {
    "calculateEMI":             _calculate_emi,
    "calculateAffordability":   _calculate_affordability,
    "convertUnit":              _convert_unit,
}

# ---------------------------------------------------------------------------
# Tool → (ExecutorClass, base_url_attr) mapping
# ---------------------------------------------------------------------------

def _build_dispatch_map(settings: Settings, redis) -> dict[str, HttpToolExecutor]:
    """Build tool_name → executor instance map from settings."""
    from src.tools.search    import SearchPropertiesExecutor, GetPropertyDetailExecutor, GetNearbyLandmarksExecutor
    from src.tools.entity    import ResolveEntityExecutor
    from src.tools.locality  import GetLocalityDetailExecutor, GetTrendingLocalitiesExecutor, GetPriceTrendsExecutor
    from src.tools.project   import GetProjectDetailExecutor, GetProjectPriceTrendsExecutor
    from src.tools.portfolio import GetRecommendationsExecutor, GetSavedPropertiesExecutor, GetViewedPropertiesExecutor
    from src.tools.misc      import (
        GetTransactionHistoryExecutor, GetDemandSupplyInsightExecutor,
        GetTravelTimeExecutor, GetPriceBucketsExecutor, GetFilterSuggestionsExecutor,
        GetCollectionsExecutor, GetPopularCityLandmarksExecutor, GetTopSocietiesExecutor,
        GetRecentlyViewedExecutor, GetTrendingProjectsExecutor,
    )

    def make(cls, url_attr: str) -> HttpToolExecutor | None:
        url = getattr(settings, url_attr, "") or ""
        if not url:
            log.debug("executor_skipped_no_url", tool_class=cls.__name__, url_attr=url_attr)
            return None
        return cls(redis, url)

    pairs: list[tuple[str, HttpToolExecutor | None]] = [
        ("searchProperties",          make(SearchPropertiesExecutor,         "khoj_base_url")),
        ("getPropertyDetail",         make(GetPropertyDetailExecutor,        "casa_base_url")),
        ("getNearbyLandmarks",        make(GetNearbyLandmarksExecutor,       "odin_base_url")),
        ("getSimilarProperties",      make(GetPropertyDetailExecutor,        "casa_base_url")),  # same API
        ("resolveEntity",             make(ResolveEntityExecutor,            "autosuggest_base_url")),
        ("getLocalityDetail",         make(GetLocalityDetailExecutor,        "casa_base_url")),
        ("getTrendingLocalities",     make(GetTrendingLocalitiesExecutor,    "odin_base_url")),
        ("getPriceTrends",            make(GetPriceTrendsExecutor,           "odin_base_url")),
        ("getProjectDetail",          make(GetProjectDetailExecutor,         "venus_base_url")),
        ("getProjectPriceTrends",     make(GetProjectPriceTrendsExecutor,    "gandalf_base_url")),
        ("getRecommendations",        make(GetRecommendationsExecutor,       "data_base_url")),
        ("getSavedProperties",        make(GetSavedPropertiesExecutor,       "data_base_url")),
        ("getViewedProperties",       make(GetViewedPropertiesExecutor,      "data_base_url")),
        ("getRecentlyViewed",         make(GetRecentlyViewedExecutor,        "data_base_url")),
        ("getTransactionHistory",     make(GetTransactionHistoryExecutor,    "gandalf_base_url")),
        ("getDemandSupplyInsight",    make(GetDemandSupplyInsightExecutor,   "casa_base_url")),
        ("getTravelTime",             make(GetTravelTimeExecutor,            "regions_base_url")),
        ("getPriceBuckets",           make(GetPriceBucketsExecutor,          "khoj_base_url")),
        ("getFilterSuggestions",      make(GetFilterSuggestionsExecutor,     "data_base_url")),
        ("getCollections",            make(GetCollectionsExecutor,           "data_base_url")),
        ("getPopularCityLandmarks",   make(GetPopularCityLandmarksExecutor,  "data_base_url")),
        ("getTopSocieties",           make(GetTopSocietiesExecutor,          "seo_base_url")),
        ("getTrendingProjects",       make(GetTrendingProjectsExecutor,      "odin_base_url")),
        ("getRatingsReviews",         make(GetPriceTrendsExecutor,           "odin_base_url")),  # Odin
    ]
    return {tool: ex for tool, ex in pairs if ex is not None}


# ---------------------------------------------------------------------------
# HousingToolExecutor
# ---------------------------------------------------------------------------

class HousingToolExecutor:
    """CachedExecutorPort for local/staging/production environments.

    Routes each tool call to its specific HttpToolExecutor subclass.
    Tools with empty base URLs are skipped (returns {}); circuit-breaker
    semantics are handled by each subclass's _call_with_retry.
    """

    def __init__(self, settings: Settings, redis_pool):
        self._dispatch: dict[str, HttpToolExecutor] = _build_dispatch_map(settings, redis_pool)
        log.info("housing_executor_ready", tool_count=len(self._dispatch))

    async def execute(self, tool: str, params: dict, ttl: int = 0) -> Any:
        # Pure-computation tools — no HTTP needed
        inline = _INLINE_HANDLERS.get(tool)
        if inline:
            result = inline(params)
            log.info("inline_tool_executed", tool=tool)
            return result

        executor = self._dispatch.get(tool)
        if executor is None:
            log.warning("no_executor_for_tool", tool=tool)
            return {}

        return await executor.execute(tool, params, ttl)

    async def invalidate_cache(self, tool: str, session_id: str) -> None:
        executor = self._dispatch.get(tool)
        if executor:
            await executor.invalidate_cache(tool, session_id)
