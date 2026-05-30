"""
Unit tests for TEMPLATE_BUILDERS, build_template_events,
_build_property_carousel, and _build_locality_carousel.

Covers:
  build_template_events — property carousel, locality carousel,
                          empty hits, cap at 10, unknown intent
"""
from __future__ import annotations

from datetime import datetime

import pytest

from src.pipeline.nodes.response import (
    build_template_events,
    TEMPLATE_BUILDERS,
    _build_property_carousel,
    _build_locality_carousel,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_NOW = datetime.utcnow().isoformat() + 'Z'
_SOURCE_MSG_ID = 'src-msg-001'
_CONV_ID = 'conv-001'
_SEQ = 0
_SESSION = {'session_id': _CONV_ID, 'active_filters': {}, 'city': 'Mumbai'}


def _call_build(classification: dict, pre_fetched_data: dict) -> list:
    return build_template_events(
        classification=classification,
        pre_fetched_data=pre_fetched_data,
        tool_results=[],
        session=_SESSION,
        source_msg_id=_SOURCE_MSG_ID,
        conversation_id=_CONV_ID,
        seq_start=_SEQ,
        now=_NOW,
    )


def _make_property_hits(n: int) -> list:
    return [{'id': f'p{i}', 'title': f'Property {i}'} for i in range(n)]


# ---------------------------------------------------------------------------
# Tests: property_carousel
# ---------------------------------------------------------------------------

class TestBuildPropertyCarousel:

    def test_returns_event_list_with_one_hit(self):
        """build_template_events must return a single-element list for one search hit."""
        classification = {'main_intent': 'property_search', 'sub_intent': 'filter_search'}
        pre_fetched_data = {
            'searchProperties': {
                'hits': [{'id': 'p1', 'title': 'Test Property'}],
                'total_count': 1,
            }
        }

        events = _call_build(classification, pre_fetched_data)

        assert len(events) == 1, f'Expected 1 event, got {len(events)}'

    def test_event_has_property_carousel_template_id(self):
        """Each returned event must have template_id == 'property_carousel'."""
        classification = {'main_intent': 'property_search', 'sub_intent': 'filter_search'}
        pre_fetched_data = {
            'searchProperties': {
                'hits': [{'id': 'p1', 'title': 'Test Property'}],
                'total_count': 1,
            }
        }

        events = _call_build(classification, pre_fetched_data)

        assert events[0].content.template_id == 'property_carousel', (
            f"Expected template_id='property_carousel', "
            f"got {events[0].content.template_id!r}"
        )

    def test_returns_empty_on_no_hits(self):
        """build_template_events must return [] when hits list is empty."""
        classification = {'main_intent': 'property_search', 'sub_intent': 'filter_search'}
        pre_fetched_data = {
            'searchProperties': {'hits': [], 'total_count': 0}
        }

        events = _call_build(classification, pre_fetched_data)

        assert events == [], f'Expected [], got {events}'

    def test_caps_at_10_properties(self):
        """build_template_events must cap the carousel at 10 properties when 15 hits provided."""
        classification = {'main_intent': 'property_search', 'sub_intent': 'filter_search'}
        pre_fetched_data = {
            'searchProperties': {
                'hits': _make_property_hits(15),
                'total_count': 15,
            }
        }

        events = _call_build(classification, pre_fetched_data)

        assert len(events) == 1, f'Expected 1 carousel event, got {len(events)}'
        properties_in_event = events[0].content.data['properties']
        assert len(properties_in_event) <= 10, (
            f'Carousel must be capped at 10 properties, got {len(properties_in_event)}'
        )

    def test_explore_nearby_also_builds_property_carousel(self):
        """explore_nearby intent must also resolve to property_carousel."""
        classification = {'main_intent': 'property_search', 'sub_intent': 'explore_nearby'}
        pre_fetched_data = {
            'searchProperties': {
                'hits': [{'id': 'p1', 'title': 'Near Me'}],
                'total_count': 1,
            }
        }

        events = _call_build(classification, pre_fetched_data)

        assert len(events) == 1
        assert events[0].content.template_id == 'property_carousel'

    def test_returns_empty_when_pre_fetched_data_missing_key(self):
        """build_template_events must return [] when searchProperties key is absent."""
        classification = {'main_intent': 'property_search', 'sub_intent': 'filter_search'}
        pre_fetched_data = {}

        events = _call_build(classification, pre_fetched_data)

        assert events == []


# ---------------------------------------------------------------------------
# Tests: locality_carousel
# ---------------------------------------------------------------------------

class TestBuildLocalityCarousel:

    def test_returns_event_list_with_one_locality(self):
        """build_template_events must return a list for trending_localities with one locality."""
        classification = {'main_intent': 'locality_research', 'sub_intent': 'trending_localities'}
        pre_fetched_data = {
            'getTrendingLocalities': {
                'localities': [{'uuid': 'loc1', 'display_name': 'Bandra'}]
            }
        }

        events = _call_build(classification, pre_fetched_data)

        assert len(events) == 1, f'Expected 1 event, got {len(events)}'

    def test_event_has_locality_carousel_template_id(self):
        """Each returned event must have template_id == 'locality_carousel'."""
        classification = {'main_intent': 'locality_research', 'sub_intent': 'trending_localities'}
        pre_fetched_data = {
            'getTrendingLocalities': {
                'localities': [{'uuid': 'loc1', 'display_name': 'Bandra'}]
            }
        }

        events = _call_build(classification, pre_fetched_data)

        assert events[0].content.template_id == 'locality_carousel', (
            f"Expected template_id='locality_carousel', "
            f"got {events[0].content.template_id!r}"
        )

    def test_returns_empty_when_no_localities(self):
        """build_template_events must return [] when localities list is empty."""
        classification = {'main_intent': 'locality_research', 'sub_intent': 'trending_localities'}
        pre_fetched_data = {
            'getTrendingLocalities': {'localities': []}
        }

        events = _call_build(classification, pre_fetched_data)

        assert events == []

    def test_locality_data_included_in_event(self):
        """The event data must include the 'localities' key with the locality list."""
        classification = {'main_intent': 'locality_research', 'sub_intent': 'trending_localities'}
        localities = [
            {'uuid': 'loc1', 'display_name': 'Bandra'},
            {'uuid': 'loc2', 'display_name': 'Andheri'},
        ]
        pre_fetched_data = {'getTrendingLocalities': {'localities': localities}}

        events = _call_build(classification, pre_fetched_data)

        assert len(events) == 1
        data = events[0].content.data
        assert 'localities' in data, "'localities' key must be in event data"
        assert len(data['localities']) == 2


# ---------------------------------------------------------------------------
# Tests: unknown intent
# ---------------------------------------------------------------------------

class TestUnknownIntent:

    def test_unknown_intent_returns_empty(self):
        """build_template_events must return [] for intents not registered in TEMPLATE_BUILDERS."""
        classification = {'main_intent': 'unknown', 'sub_intent': 'unknown'}
        pre_fetched_data = {'someData': {'hits': [{'id': 'x'}]}}

        assert ('unknown', 'unknown') not in TEMPLATE_BUILDERS

        events = _call_build(classification, pre_fetched_data)

        assert events == [], f'Expected [], got {events}'

    def test_text_only_intent_returns_empty(self):
        """A text-only intent like property_detail/property_about must return [] (no carousel)."""
        classification = {'main_intent': 'property_detail', 'sub_intent': 'property_about'}
        pre_fetched_data = {}

        assert ('property_detail', 'property_about') not in TEMPLATE_BUILDERS

        events = _call_build(classification, pre_fetched_data)

        assert events == []
