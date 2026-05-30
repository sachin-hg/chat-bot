"""Tool executors for project research — Venus + Gandalf APIs."""
from __future__ import annotations
from typing import Any
from src.tools.executor import HttpToolExecutor
from src.observability.logging import get_logger

log = get_logger(__name__)


class GetProjectDetailExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, venus_base_url: str):
        super().__init__(redis_pool)
        self._base_url = venus_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        project_id = params.get('project_id') or params.get('id')
        if not project_id:
            return {}
        resp = await self._http.get(
            f'{self._base_url}/api/v1/projects/{project_id}',
            params={'include': 'overview,gallery,floor_plans,amenities,sellers,highlights'},
        )
        resp.raise_for_status()
        data = resp.json()
        proj = data.get('data') or data
        return {
            'project_id':      project_id,
            'name':            proj.get('name', ''),
            'builder':         proj.get('builder') or {},
            'locality':        proj.get('locality') or {},
            'city':            proj.get('city', ''),
            'overview':        proj.get('overview', ''),
            'price_range':     proj.get('price_range') or {},
            'bhk_types':       proj.get('bhk_types') or [],
            'amenities':       proj.get('amenities') or [],
            'gallery':         proj.get('gallery') or [],
            'floor_plans':     proj.get('floor_plans') or [],
            'rera_id':         proj.get('rera_id'),
            'possession_date': proj.get('possession_date'),
            'status':          proj.get('status', ''),
        }


class GetProjectPriceTrendsExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, gandalf_base_url: str):
        super().__init__(redis_pool)
        self._base_url = gandalf_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        resp = await self._http.get(
            f'{self._base_url}/api/v1/projects/price-trends',
            params={
                'project_id':    params.get('project_id'),
                'period_months': params.get('period_months', 12),
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            'project_id':     params.get('project_id'),
            'data_points':    data.get('data_points') or data.get('trends') or [],
            'current_price':  data.get('current_avg_price'),
            'yoy_change_pct': data.get('yoy_change_percent'),
            'launch_price':   data.get('launch_price'),
        }
