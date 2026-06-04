"""Tool executors for property search and detail — Khoj + Casa APIs."""
from __future__ import annotations
from typing import Any
import httpx
from src.tools.executor import HttpToolExecutor
from src.observability.logging import get_logger

log = get_logger(__name__)


class SearchPropertiesExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, khoj_base_url: str):
        super().__init__(redis_pool)
        self._base_url = khoj_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        # Wire format: Khoj /v2/search endpoint
        wire = {
            'service':        params.get('transaction_type', 'buy'),
            'city':           params.get('city', ''),
            'bedrooms':       params.get('bhk'),           # list of ints
            'price_min':      params.get('price_min'),
            'price_max':      params.get('price_max'),
            'localities':     params.get('localities'),    # list of locality UUIDs
            'amenities':      params.get('amenities'),
            'carpet_min':     params.get('carpet_area_min'),
            'carpet_max':     params.get('carpet_area_max'),
            'lat':            params.get('lat'),
            'lng':            params.get('lng'),
            'outer_radius':   params.get('outer_radius'),
            'page':           params.get('page', 1),
            'page_size':      params.get('page_size', 20),
            'sort_by':        params.get('sort_by', 'relevance'),
        }
        # Remove None values
        wire = {k: v for k, v in wire.items() if v is not None}

        resp = await self._http.get(f'{self._base_url}/v2/search', params=wire)
        resp.raise_for_status()
        data = resp.json()

        return {
            'total_count': data.get('total') or data.get('total_count') or 0,
            'hits':        data.get('hits') or data.get('results') or [],
            'srset_id':    data.get('srset_id') or data.get('search_result_set_id'),
            'facets':      data.get('facets') or {},
        }


class GetPropertyDetailExecutor(HttpToolExecutor):
    def __init__(self, redis_pool, casa_base_url: str):
        super().__init__(redis_pool)
        self._base_url = casa_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        property_id = params.get('property_id') or params.get('id')
        if not property_id:
            return {}
        resp = await self._http.get(
            f'{self._base_url}/api/v1/properties/{property_id}',
            params={'include': 'amenities,images,seller,floor_plans'},
        )
        resp.raise_for_status()
        data = resp.json()
        prop = data.get('data') or data.get('property') or data
        return {
            'property_id':   prop.get('id') or property_id,
            'title':         prop.get('title') or prop.get('name', ''),
            'price':         prop.get('price') or prop.get('expected_price'),
            'price_display': prop.get('price_display') or '',
            'bhk':           prop.get('bedrooms') or prop.get('bhk'),
            'carpet_area':   prop.get('carpet_area'),
            'locality':      prop.get('locality') or {},
            'project':       prop.get('project') or {},
            'amenities':     prop.get('amenities') or [],
            'images':        prop.get('images') or [],
            'seller':        prop.get('seller') or {},
            'floor_plans':   prop.get('floor_plans') or [],
            'rera_id':       prop.get('rera_id'),
        }


class GetSimilarPropertiesExecutor(HttpToolExecutor):
    """getSimilarProperties — Casa API. Returns an array of similar properties."""

    def __init__(self, redis_pool, casa_base_url: str):
        super().__init__(redis_pool)
        self._base_url = casa_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        property_id = params.get('property_id') or params.get('id')
        if not property_id:
            return {'properties': [], 'total': 0}
        resp = await self._http.get(
            f'{self._base_url}/api/v1/properties/{property_id}/similar',
            params={'limit': params.get('limit', 10)},
        )
        resp.raise_for_status()
        data = resp.json()
        properties = (
            data.get('similar_properties') or
            data.get('properties') or
            data.get('data') or
            []
        )
        return {'properties': properties, 'total': data.get('total', len(properties))}


class GetNearbyLandmarksExecutor(HttpToolExecutor):
    """getNearbyLandmarks — Odin API. Returns nearby landmarks truncated to 5."""

    def __init__(self, redis_pool, odin_base_url: str):
        super().__init__(redis_pool)
        self._base_url = odin_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        resp = await self._http.get(
            f'{self._base_url}/api/v1/nearby/landmarks',
            params={k: v for k, v in params.items() if v is not None},
        )
        resp.raise_for_status()
        data = resp.json()
        landmarks = data.get('landmarks') or data.get('data') or []
        # Truncation: max 5 landmarks per REQ-TOOL-008
        return {'landmarks': landmarks[:5], 'total': len(landmarks)}
