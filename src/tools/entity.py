"""resolveEntity tool executor — Housing autosuggest API."""
from __future__ import annotations
from typing import Any
import httpx
from src.tools.executor import HttpToolExecutor
from src.observability.logging import get_logger

log = get_logger(__name__)


class ResolveEntityExecutor(HttpToolExecutor):
    """Resolves entity names (localities, projects, cities) to UUIDs via autosuggest."""

    def __init__(self, redis_pool, autosuggest_base_url: str):
        super().__init__(redis_pool)
        self._base_url = autosuggest_base_url.rstrip('/')

    async def call(self, tool: str, params: dict) -> Any:
        """Call autosuggest API. params should have 'query', 'entity_type', optionally 'city'."""
        query       = params.get('query') or params.get('name', '')
        entity_type = params.get('entity_type', 'locality')
        city        = params.get('city', '')

        # Autosuggest wire format
        api_params = {
            'q':     query,
            'type':  entity_type,
            'limit': 3,   # top 3 candidates for disambiguation
        }
        if city:
            api_params['city'] = city

        resp = await self._http.get(
            f'{self._base_url}/autosuggest/v2',
            params=api_params,
        )
        resp.raise_for_status()
        raw = resp.json()

        suggestions = raw.get('suggestions') or raw.get('data') or []
        if not suggestions:
            return {'candidates': [], 'resolved': None, 'confidence': 0.0}

        # Map to our canonical shape
        candidates = []
        for s in suggestions[:3]:
            candidates.append({
                'uuid':         s.get('id') or s.get('uuid') or s.get('entity_id'),
                'display_name': s.get('display_name') or s.get('name') or query,
                'entity_type':  s.get('type') or entity_type,
                'city':         s.get('city') or city,
                'confidence':   float(s.get('score') or s.get('confidence') or 0.85),
            })

        # Single unambiguous result
        if len(candidates) == 1 or (len(candidates) > 1 and candidates[0]['confidence'] >= 0.90):
            return {
                'candidates':   candidates,
                'resolved':     candidates[0],
                'confidence':   candidates[0]['confidence'],
                'uuid':         candidates[0]['uuid'],
                'display_name': candidates[0]['display_name'],
            }

        # Multiple candidates → disambiguation needed (confidence delta < 0.15)
        if len(candidates) >= 2:
            delta = candidates[0]['confidence'] - candidates[1]['confidence']
            if delta < 0.15:
                return {
                    'candidates':            candidates,
                    'resolved':              None,
                    'confidence':            candidates[0]['confidence'],
                    'disambiguation_needed': True,
                }

        return {
            'candidates': candidates,
            'resolved':   candidates[0] if candidates else None,
            'confidence': candidates[0]['confidence'] if candidates else 0.0,
        }
