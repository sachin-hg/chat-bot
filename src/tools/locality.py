"""Tool executors for locality research — Odin + Casa APIs."""
from __future__ import annotations
from typing import Any
import httpx
from src.tools.executor import HttpToolExecutor
from src.observability.logging import get_logger

log = get_logger(__name__)


class GetLocalityDetailExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, casa_base_url: str):
        super().__init__(redis_pool)
        self._base_url = casa_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        locality_id = params.get('locality_id') or params.get('uuid')
        if not locality_id:
            return {}
        resp = await self._http.get(
            f'{self._base_url}/api/v1/localities/{locality_id}',
            params={'include': 'ratings,price_trends,overview'},
        )
        resp.raise_for_status()
        data = resp.json()
        loc = data.get('data') or data
        return {
            'locality_id':      locality_id,
            'display_name':     loc.get('name') or loc.get('display_name', ''),
            'city':             loc.get('city', ''),
            'overview':         loc.get('overview') or '',
            'avg_price_sqft':   loc.get('avg_price_sqft'),
            'price_trend':      loc.get('price_trend') or {},
            'ratings':          loc.get('ratings') or {},
            'connectivity':     loc.get('connectivity') or [],
            'nearby_schools':   loc.get('nearby_schools') or [],
            'nearby_hospitals': loc.get('nearby_hospitals') or [],
        }


class GetTrendingLocalitiesExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, odin_base_url: str):
        super().__init__(redis_pool)
        self._base_url = odin_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        resp = await self._http.get(
            f'{self._base_url}/api/v1/trending/localities',
            params={
                'city':             params.get('city', ''),
                'transaction_type': params.get('transaction_type', 'buy'),
                'limit':            params.get('limit', 10),
            },
        )
        resp.raise_for_status()
        data = resp.json()
        localities = data.get('localities') or data.get('data') or []
        return {
            'localities': [
                {
                    'uuid':         l.get('id') or l.get('uuid'),
                    'display_name': l.get('name') or l.get('display_name', ''),
                    'city':         l.get('city', ''),
                    'avg_price':    l.get('avg_price'),
                    'trend_score':  l.get('trend_score'),
                }
                for l in localities
            ]
        }


class GetPriceTrendsExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, odin_base_url: str):
        super().__init__(redis_pool)
        self._base_url = odin_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        resp = await self._http.get(
            f'{self._base_url}/api/v1/price-trends',
            params={
                'locality_id':      params.get('locality_id') or params.get('uuid'),
                'city':             params.get('city', ''),
                'transaction_type': params.get('transaction_type', 'buy'),
                'period_months':    params.get('period_months', 12),
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            'locality_id':     params.get('locality_id'),
            'data_points':     data.get('data_points') or data.get('trends') or [],
            'current_price':   data.get('current_avg_price'),
            'yoy_change_pct':  data.get('yoy_change_percent'),
            'trend_direction': data.get('trend') or 'stable',
        }
