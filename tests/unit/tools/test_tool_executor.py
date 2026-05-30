"""
CHAT-Q-DRY-011: Contract tests for HttpToolExecutor and TOOL_REGISTRY data.

Covers:
  REQ-TOOL-004  get_tool_cache_ttl('getPropertyDetail') returns registry TTL (> 0)
  REQ-TOOL-005  searchProperties cache TTL matches TOOL_REGISTRY (30 s — short-lived cache)
  REQ-TOOL-006  invalidate_cache deletes Redis keys matching 'cache:tool:<tool>:*'
  REQ-TOOL-007  contact_seller Tier 1 returns template_id with no HTTP call (ref test_processing_nodes_b)
  REQ-TOOL-008  getNearbyLandmarks truncation — xfail (executor not yet implemented in Sprint 2)
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.tools.executor import HttpToolExecutor, get_tool_cache_ttl
from src.registries.tool_registry import get_tool, TOOL_REGISTRY


# ---------------------------------------------------------------------------
# REQ-TOOL-004: get_tool_cache_ttl returns registry value for getPropertyDetail
# ---------------------------------------------------------------------------

class TestGetToolCacheTtl:
    """REQ-TOOL-004: get_tool_cache_ttl returns the TTL from TOOL_REGISTRY."""

    def test_get_tool_cache_ttl_returns_registry_value(self):
        """REQ-TOOL-004: getPropertyDetail TTL comes from TOOL_REGISTRY and is > 0."""
        record = get_tool("getPropertyDetail")
        assert record is not None, (
            "getPropertyDetail must exist in TOOL_REGISTRY"
        )
        expected_ttl = record.cache_ttl_seconds
        assert expected_ttl > 0, (
            f"getPropertyDetail must have a positive cache TTL; got {expected_ttl}"
        )

        actual_ttl = get_tool_cache_ttl("getPropertyDetail")
        assert actual_ttl == expected_ttl, (
            f"get_tool_cache_ttl('getPropertyDetail') must return {expected_ttl}; "
            f"got {actual_ttl}"
        )

    def test_get_tool_cache_ttl_returns_zero_for_unknown_tool(self):
        """REQ-TOOL-004 (fallback): unknown tool name returns 0 (no cache)."""
        result = get_tool_cache_ttl("nonExistentTool")
        assert result == 0, (
            f"Unknown tool must return TTL=0, got {result}"
        )


# ---------------------------------------------------------------------------
# REQ-TOOL-005: searchProperties cache TTL — data-correctness test
# ---------------------------------------------------------------------------

class TestSearchPropertiesCacheTtl:
    """REQ-TOOL-005: searchProperties cache TTL matches TOOL_REGISTRY declaration."""

    def test_search_properties_cache_ttl_matches_registry(self):
        """REQ-TOOL-005: searchProperties TTL from get_tool_cache_ttl matches TOOL_REGISTRY.

        Note: TOOL_REGISTRY declares cache_ttl_seconds=30 for searchProperties (short-lived
        cache for deduplication, not long-term caching). The executor respects this value.
        If the intent is to disable caching entirely, update TOOL_REGISTRY to 0 and this
        test will automatically catch the discrepancy.
        """
        record = get_tool("searchProperties")
        assert record is not None, (
            "searchProperties must be present in TOOL_REGISTRY"
        )
        registry_ttl = record.cache_ttl_seconds
        executor_ttl = get_tool_cache_ttl("searchProperties")
        assert executor_ttl == registry_ttl, (
            f"get_tool_cache_ttl('searchProperties') must return the TOOL_REGISTRY value "
            f"({registry_ttl}), got {executor_ttl}"
        )

    def test_search_properties_cache_ttl_is_short_lived(self):
        """REQ-TOOL-005 (guard): searchProperties TTL must be <= 60 s (not a long-lived cache).

        searchProperties results change frequently; a long cache TTL would serve stale
        listings. The registry caps it at 30 s for deduplication only.
        """
        ttl = get_tool_cache_ttl("searchProperties")
        assert ttl <= 60, (
            f"searchProperties TTL must be short-lived (<= 60 s), got {ttl} s. "
            "Increase with caution — stale search results degrade user experience."
        )


# ---------------------------------------------------------------------------
# REQ-TOOL-006: invalidate_cache deletes Redis keys for getSavedProperties
# ---------------------------------------------------------------------------

class TestCacheInvalidation:
    """REQ-TOOL-006: invalidate_cache removes all matching Redis keys."""

    @pytest.mark.asyncio
    async def test_cache_invalidate_deletes_keys(self):
        """REQ-TOOL-006: invalidate_cache calls redis.keys() and redis.delete() correctly."""
        mock_redis = AsyncMock()
        # Simulate two cached entries for getSavedProperties
        mock_redis.keys = AsyncMock(
            return_value=["cache:tool:getSavedProperties:abc123", "cache:tool:getSavedProperties:def456"]
        )
        mock_redis.delete = AsyncMock(return_value=2)

        executor = HttpToolExecutor(redis_pool=mock_redis)
        await executor.invalidate_cache("getSavedProperties", "session-123")

        # Assert keys() was called with the correct glob pattern
        mock_redis.keys.assert_called_once_with("cache:tool:getSavedProperties:*")

        # Assert delete() was called with both keys
        mock_redis.delete.assert_called_once()
        delete_args = mock_redis.delete.call_args[0]
        assert "cache:tool:getSavedProperties:abc123" in delete_args
        assert "cache:tool:getSavedProperties:def456" in delete_args

    @pytest.mark.asyncio
    async def test_cache_invalidate_no_op_when_no_keys(self):
        """REQ-TOOL-006: invalidate_cache is a no-op when Redis has no matching keys."""
        mock_redis = AsyncMock()
        mock_redis.keys = AsyncMock(return_value=[])
        mock_redis.delete = AsyncMock()

        executor = HttpToolExecutor(redis_pool=mock_redis)
        await executor.invalidate_cache("getSavedProperties", "session-456")

        mock_redis.keys.assert_called_once_with("cache:tool:getSavedProperties:*")
        mock_redis.delete.assert_not_called()

    @pytest.mark.asyncio
    async def test_cache_invalidate_no_op_when_redis_is_none(self):
        """REQ-TOOL-006: invalidate_cache does not raise when redis_pool is None."""
        executor = HttpToolExecutor(redis_pool=None)
        # Should complete without raising
        await executor.invalidate_cache("getSavedProperties", "session-789")


# ---------------------------------------------------------------------------
# REQ-TOOL-007: contact_seller Tier 1 returns template, no HTTP call
# (covered fully in test_processing_nodes_b; this test references that coverage)
# ---------------------------------------------------------------------------

class TestContactSellerNoApiCall:
    """REQ-TOOL-007: contact_seller Tier 1 produces a template with no external HTTP call."""

    @pytest.mark.asyncio
    async def test_contact_seller_returns_template_no_api_call(self):
        """REQ-TOOL-007: route_node with contact_seller intent returns template_id='contact_seller'.

        Full coverage is in tests/unit/nodes/test_processing_nodes_b.py::
            TestRouteNodeTier1::test_route_node_tier1_contact_seller (REQ-PROC-018).

        This test verifies the same requirement from the tools perspective:
        no HttpToolExecutor instance is created or called during contact_seller routing.
        """
        from unittest.mock import MagicMock, patch
        from tests.unit.conftest import make_test_state
        from src.pipeline.nodes.processing import route_node

        mock_record = MagicMock()
        mock_record.tier = 1
        mock_record.requires_auth = False
        mock_record.model = None

        cls = {
            "main_intent": "property_detail",
            "sub_intent": "contact_seller",
            "multi_intent": False,
            "pivot": False,
            "clarification_needed": None,
            "entities_mentioned": [],
            "filter_delta": {},
            "reasoning": "test: contact_seller tier 1",
        }
        state = make_test_state(domain="property_detail", classification=cls)

        with patch("src.pipeline.nodes.processing.get_intent_record", return_value=mock_record):
            # Patch HttpToolExecutor to detect any accidental instantiation
            with patch("src.tools.executor.HttpToolExecutor") as mock_executor_cls:
                result = await route_node(state)

        # Template must be set
        assert result["bot_response"]["template_id"] == "contact_seller", (
            f"contact_seller must return template_id='contact_seller', "
            f"got {result['bot_response'].get('template_id')!r}"
        )
        # No HttpToolExecutor should have been instantiated during routing
        mock_executor_cls.assert_not_called()


# ---------------------------------------------------------------------------
# REQ-TOOL-008: getNearbyLandmarks truncation — xfail (Sprint 3)
# ---------------------------------------------------------------------------

class TestNearbyLandmarksTruncation:
    """REQ-TOOL-008: getNearbyLandmarks executor truncation — pending Sprint 3."""

    @pytest.mark.xfail(
        reason="CHAT-P-018+: getNearbyLandmarks executor not implemented",
        strict=False,
    )
    @pytest.mark.asyncio
    async def test_nearby_landmarks_truncation_xfail(self):
        """REQ-TOOL-008: getNearbyLandmarks response must be truncated to max_items=10.

        This test is marked xfail because the getNearbyLandmarks executor subclass
        (which enforces ResponseTruncation(max_items=10)) is not yet implemented.
        Sprint 3 ticket CHAT-P-018+ covers this.
        """
        # Importing the executor subclass will raise ImportError or AttributeError
        # until Sprint 3 delivers it.
        from src.tools.executor import HttpToolExecutor  # noqa: F401

        # Simulate an oversized response (20 landmarks)
        oversized_response = {
            "landmarks": [
                {"name": f"Landmark {i}", "category": "metro", "distance_metres": i * 100, "walk_minutes": i}
                for i in range(20)
            ]
        }

        # The executor is expected to truncate to 10; raise NotImplementedError until then.
        mock_redis = AsyncMock()
        executor = HttpToolExecutor(redis_pool=mock_redis)

        # This call is expected to fail until the truncation feature is implemented.
        result = await executor.execute("getNearbyLandmarks", {}, ttl=86400)
        assert len(result.get("landmarks", [])) <= 10, (
            "getNearbyLandmarks response must be truncated to max_items=10"
        )
