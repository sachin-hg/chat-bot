"""Integration tests — require real API access (VPN). Run with --run-integration.

These tests hit live endpoints; they are skipped by default and must be run explicitly:

    pytest tests/integration/ --run-integration

Each test is self-contained: it constructs its executor, makes a real HTTP call,
and asserts on the canonical response shape defined in tool_registry.py.
"""
from __future__ import annotations

import os

import pytest


# ---------------------------------------------------------------------------
# Smoke: required env vars
# ---------------------------------------------------------------------------

@pytest.mark.integration
def test_all_required_env_vars_present():
    """Smoke test: all required API base URLs must be set in the environment before
    running integration tests. Fail fast with a clear message rather than confusing
    connection errors per-test.
    """
    required = [
        'KHOJ_BASE_URL',
        'CASA_BASE_URL',
        'ODIN_BASE_URL',
        'AUTOSUGGEST_BASE_URL',
        'VENUS_BASE_URL',
    ]
    missing = [var for var in required if not os.environ.get(var)]
    assert missing == [], (
        f"Missing env vars for integration tests: {missing}. "
        "Set them in .env or export before running with --run-integration."
    )


# ---------------------------------------------------------------------------
# resolveEntity — autosuggest
# ---------------------------------------------------------------------------

@pytest.mark.integration
@pytest.mark.asyncio
async def test_resolve_entity_powai():
    """Real autosuggest call. Powai should resolve with confidence >= 0.90."""
    from src.tools.entity import ResolveEntityExecutor

    executor = ResolveEntityExecutor(
        redis_pool=None,
        autosuggest_base_url=os.environ.get('AUTOSUGGEST_BASE_URL', 'http://autosuggest'),
    )
    result = await executor.call(
        'resolveEntity',
        {'query': 'Powai', 'entity_type': 'locality', 'city': 'Mumbai'},
    )

    assert result.get('confidence', 0) >= 0.90, (
        f"Powai resolve confidence must be >= 0.90, got {result.get('confidence')}"
    )
    assert result.get('uuid') is not None, "uuid must be present in resolved entity"
    assert 'Powai' in (result.get('display_name') or ''), (
        f"display_name must contain 'Powai', got {result.get('display_name')!r}"
    )


@pytest.mark.integration
@pytest.mark.asyncio
async def test_resolve_entity_bandra():
    """Real autosuggest call. Bandra should resolve as a locality in Mumbai."""
    from src.tools.entity import ResolveEntityExecutor

    executor = ResolveEntityExecutor(
        redis_pool=None,
        autosuggest_base_url=os.environ.get('AUTOSUGGEST_BASE_URL', 'http://autosuggest'),
    )
    result = await executor.call(
        'resolveEntity',
        {'query': 'Bandra', 'entity_type': 'locality', 'city': 'Mumbai'},
    )

    assert result.get('uuid') is not None, "uuid must be present for Bandra"
    assert result.get('confidence', 0) > 0, "confidence must be > 0"
    candidates = result.get('candidates', [])
    assert len(candidates) >= 1, "must return at least one candidate for Bandra"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_resolve_entity_unknown_returns_empty():
    """Autosuggest with a nonsense query should return no confident match."""
    from src.tools.entity import ResolveEntityExecutor

    executor = ResolveEntityExecutor(
        redis_pool=None,
        autosuggest_base_url=os.environ.get('AUTOSUGGEST_BASE_URL', 'http://autosuggest'),
    )
    result = await executor.call(
        'resolveEntity',
        {'query': 'xyzzy_no_such_locality_99999', 'entity_type': 'locality', 'city': 'Mumbai'},
    )

    # Either empty candidates or confidence below threshold
    assert result.get('confidence', 0) < 0.90 or result.get('candidates') == [], (
        "Nonsense query should not resolve with high confidence"
    )


# ---------------------------------------------------------------------------
# searchProperties — Khoj
# ---------------------------------------------------------------------------

@pytest.mark.integration
@pytest.mark.asyncio
async def test_search_properties_returns_results():
    """Real Khoj call. 2BHK buy in Mumbai should return search results."""
    from src.tools.search import SearchPropertiesExecutor

    executor = SearchPropertiesExecutor(
        redis_pool=None,
        khoj_base_url=os.environ.get('KHOJ_BASE_URL', ''),
    )
    result = await executor.call(
        'searchProperties',
        {'bhk': [2], 'transaction_type': 'buy', 'city': 'Mumbai'},
    )

    assert result.get('total_count', 0) > 0, (
        f"2BHK buy in Mumbai should return results, got total_count={result.get('total_count')}"
    )
    hits = result.get('hits', [])
    assert len(hits) > 0, "hits array must be non-empty for 2BHK buy in Mumbai"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_search_properties_response_shape():
    """searchProperties response must match canonical shape from tool_registry."""
    from src.tools.search import SearchPropertiesExecutor

    executor = SearchPropertiesExecutor(
        redis_pool=None,
        khoj_base_url=os.environ.get('KHOJ_BASE_URL', ''),
    )
    result = await executor.call(
        'searchProperties',
        {'transaction_type': 'rent', 'city': 'Bangalore', 'page': 1, 'page_size': 5},
    )

    # Canonical keys from return_schema_summary in TOOL_REGISTRY
    assert 'total_count' in result, "total_count must be present"
    assert 'hits' in result, "hits array must be present"
    assert isinstance(result['hits'], list), "hits must be a list"
    assert isinstance(result['total_count'], int), "total_count must be an integer"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_search_properties_pagination():
    """Page 2 of buy search should differ from page 1 (or be empty, but not error)."""
    from src.tools.search import SearchPropertiesExecutor

    executor = SearchPropertiesExecutor(
        redis_pool=None,
        khoj_base_url=os.environ.get('KHOJ_BASE_URL', ''),
    )
    result = await executor.call(
        'searchProperties',
        {'transaction_type': 'buy', 'city': 'Delhi', 'page': 2, 'page_size': 10},
    )

    # Must return a valid shape regardless of whether there are results
    assert 'total_count' in result
    assert 'hits' in result


# ---------------------------------------------------------------------------
# getPropertyDetail — Casa
# ---------------------------------------------------------------------------

@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_property_detail_response_shape():
    """getPropertyDetail Casa response must include canonical fields.

    Uses CASA_SAMPLE_PROPERTY_ID env var (a known-good listing ID). If not set,
    this test is automatically skipped with a clear message.
    """
    from src.tools.search import GetPropertyDetailExecutor

    sample_id = os.environ.get('CASA_SAMPLE_PROPERTY_ID')
    if not sample_id:
        pytest.skip("CASA_SAMPLE_PROPERTY_ID not set — skipping property detail test")

    executor = GetPropertyDetailExecutor(
        redis_pool=None,
        casa_base_url=os.environ.get('CASA_BASE_URL', ''),
    )
    result = await executor.call('getPropertyDetail', {'property_id': sample_id})

    assert result.get('property_id') == sample_id, (
        f"property_id in response must match requested id, got {result.get('property_id')!r}"
    )
    # Canonical shape fields
    for field in ('title', 'price', 'bhk', 'amenities', 'images', 'seller'):
        assert field in result, f"Field '{field}' must be present in getPropertyDetail response"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_property_detail_missing_id_returns_empty():
    """getPropertyDetail with no property_id must return empty dict gracefully."""
    from src.tools.search import GetPropertyDetailExecutor

    executor = GetPropertyDetailExecutor(
        redis_pool=None,
        casa_base_url=os.environ.get('CASA_BASE_URL', ''),
    )
    result = await executor.call('getPropertyDetail', {})
    assert result == {}, "Missing property_id must return empty dict, not raise"


# ---------------------------------------------------------------------------
# getNearbyLandmarks — Odin
# ---------------------------------------------------------------------------

@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_nearby_landmarks_truncates_to_five():
    """getNearbyLandmarks real call must return at most 5 landmarks (REQ-TOOL-008)."""
    from src.tools.search import GetNearbyLandmarksExecutor

    # Use known Bandra coordinates; orchestrator normally injects these from session
    executor = GetNearbyLandmarksExecutor(
        redis_pool=None,
        odin_base_url=os.environ.get('ODIN_BASE_URL', ''),
    )
    result = await executor.call(
        'getNearbyLandmarks',
        {'lat': 19.0596, 'lng': 72.8295, 'radius_meters': 1000},
    )

    landmarks = result.get('landmarks', [])
    assert len(landmarks) <= 5, (
        f"REQ-TOOL-008: getNearbyLandmarks must return at most 5 landmarks, got {len(landmarks)}"
    )
    assert 'total' in result, "total field must be present in getNearbyLandmarks response"
