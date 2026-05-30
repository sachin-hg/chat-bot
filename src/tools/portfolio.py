"""Tool executors for portfolio (auth-gated) — Housing Data APIs."""
from __future__ import annotations
from typing import Any
from src.tools.executor import HttpToolExecutor
from src.observability.logging import get_logger

log = get_logger(__name__)


class GetRecommendationsExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, data_base_url: str):
        super().__init__(redis_pool)
        self._base_url = data_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        auth_token = params.get('auth_token', '')
        resp = await self._http.get(
            f'{self._base_url}/api/v1/recommendations',
            params={'city': params.get('city', ''), 'limit': params.get('limit', 10)},
            headers={'Authorization': f'Bearer {auth_token}'} if auth_token else {},
        )
        resp.raise_for_status()
        data = resp.json()
        return {'properties': data.get('recommendations') or data.get('data') or []}


class GetSavedPropertiesExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, data_base_url: str):
        super().__init__(redis_pool)
        self._base_url = data_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        auth_token = params.get('auth_token', '')
        resp = await self._http.get(
            f'{self._base_url}/api/v1/portfolio/saved',
            params={'page': params.get('page', 1), 'page_size': params.get('page_size', 20)},
            headers={'Authorization': f'Bearer {auth_token}'},
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            'properties': data.get('saved_properties') or data.get('data') or [],
            'total':      data.get('total', 0),
        }


class GetViewedPropertiesExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, data_base_url: str):
        super().__init__(redis_pool)
        self._base_url = data_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        auth_token = params.get('auth_token', '')
        resp = await self._http.get(
            f'{self._base_url}/api/v1/portfolio/viewed',
            params={'page': params.get('page', 1), 'limit': params.get('limit', 20)},
            headers={'Authorization': f'Bearer {auth_token}'},
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            'properties': data.get('viewed_properties') or data.get('data') or [],
            'total':      data.get('total', 0),
        }
