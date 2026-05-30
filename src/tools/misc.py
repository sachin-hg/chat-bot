"""Miscellaneous tool executors — various Housing APIs."""
from __future__ import annotations
from typing import Any
from src.tools.executor import HttpToolExecutor
from src.observability.logging import get_logger

log = get_logger(__name__)


class GetTransactionHistoryExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, gandalf_base_url: str):
        super().__init__(redis_pool)
        self._base_url = gandalf_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        wire = {k: v for k, v in params.items() if v is not None}
        resp = await self._http.get(f'{self._base_url}/api/v1/transaction-history', params=wire)
        resp.raise_for_status()
        return resp.json().get('data') or resp.json()


class GetDemandSupplyInsightExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, casa_base_url: str):
        super().__init__(redis_pool)
        self._base_url = casa_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        wire = {k: v for k, v in params.items() if v is not None}
        resp = await self._http.get(f'{self._base_url}/api/v1/market/demand-supply', params=wire)
        resp.raise_for_status()
        return resp.json().get('data') or resp.json()


class GetTravelTimeExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, regions_base_url: str):
        super().__init__(redis_pool)
        self._base_url = regions_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        wire = {k: v for k, v in params.items() if v is not None}
        resp = await self._http.get(f'{self._base_url}/api/v1/travel-time', params=wire)
        resp.raise_for_status()
        return resp.json().get('data') or resp.json()


class GetPriceBucketsExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, khoj_base_url: str):
        super().__init__(redis_pool)
        self._base_url = khoj_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        wire = {k: v for k, v in params.items() if v is not None}
        resp = await self._http.get(f'{self._base_url}/v2/price-buckets', params=wire)
        resp.raise_for_status()
        return resp.json().get('data') or resp.json()


class GetFilterSuggestionsExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, data_base_url: str):
        super().__init__(redis_pool)
        self._base_url = data_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        wire = {k: v for k, v in params.items() if v is not None}
        resp = await self._http.get(f'{self._base_url}/api/v1/filter-suggestions', params=wire)
        resp.raise_for_status()
        return resp.json().get('data') or resp.json()


class GetCollectionsExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, data_base_url: str):
        super().__init__(redis_pool)
        self._base_url = data_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        wire = {k: v for k, v in params.items() if v is not None}
        resp = await self._http.get(f'{self._base_url}/api/v1/collections', params=wire)
        resp.raise_for_status()
        return resp.json().get('data') or resp.json()


class GetPopularCityLandmarksExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, data_base_url: str):
        super().__init__(redis_pool)
        self._base_url = data_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        wire = {k: v for k, v in params.items() if v is not None}
        resp = await self._http.get(f'{self._base_url}/api/v1/landmarks/popular', params=wire)
        resp.raise_for_status()
        return resp.json().get('data') or resp.json()


class GetTopSocietiesExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, seo_base_url: str):
        super().__init__(redis_pool)
        self._base_url = seo_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        wire = {k: v for k, v in params.items() if v is not None}
        resp = await self._http.get(f'{self._base_url}/api/v1/top-societies', params=wire)
        resp.raise_for_status()
        return resp.json().get('data') or resp.json()


class GetRecentlyViewedExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, data_base_url: str):
        super().__init__(redis_pool)
        self._base_url = data_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        auth_token = params.get('auth_token')
        wire = {k: v for k, v in params.items() if v is not None}
        headers = {'Authorization': f'Bearer {auth_token}'} if auth_token else {}
        resp = await self._http.get(
            f'{self._base_url}/api/v1/portfolio/recently-viewed',
            params=wire,
            headers=headers,
        )
        resp.raise_for_status()
        return resp.json().get('data') or resp.json()


class GetTrendingProjectsExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, odin_base_url: str):
        super().__init__(redis_pool)
        self._base_url = odin_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        wire = {k: v for k, v in params.items() if v is not None}
        resp = await self._http.get(f'{self._base_url}/api/v1/trending/projects', params=wire)
        resp.raise_for_status()
        return resp.json().get('data') or resp.json()
