"""
Unit tests for src.pipeline.experiment_loader.

Covers:
  get_active_experiments  — empty default, stale-reload trigger
  resolve_experiment_for_session — None when no experiments, intent targeting
                                   match, intent targeting miss
"""
from __future__ import annotations

import time
from unittest.mock import patch, MagicMock

import pytest

import src.pipeline.experiment_loader as loader
from src.pipeline.experiment_loader import (
    get_active_experiments,
    resolve_experiment_for_session,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_experiment(
    exp_id: str = 'exp_test_001',
    intent: str = 'property_search/filter_search',
    rollout_pct: int = 100,
    enabled: bool = True,
) -> dict:
    """Build a minimal well-formed experiment dict."""
    return {
        'id': exp_id,
        'description': 'Test experiment',
        'enabled': enabled,
        'targeting': {
            'intent': intent,
            'rollout_pct': rollout_pct,
        },
        'variants': [
            {'id': 'control', 'weight': 90},
            {'id': 'treatment', 'weight': 10, 'model_override_task': 'llm_tier3b'},
        ],
    }


# ---------------------------------------------------------------------------
# Tests: get_active_experiments
# ---------------------------------------------------------------------------

class TestGetActiveExperiments:

    def test_returns_empty_by_default(self):
        """get_active_experiments must return [] when config/experiments.yaml has experiments: []."""
        # Force a fresh load by resetting _last_loaded so the cache is stale
        with patch.object(loader, '_last_loaded', 0.0), \
             patch.object(loader, '_experiments', []):
            result = get_active_experiments()
        assert result == [], f'Expected [], got {result}'

    def test_returns_only_enabled_experiments(self):
        """get_active_experiments must filter out experiments with enabled=False."""
        exp_enabled = _make_experiment(exp_id='exp_on', enabled=True)
        exp_disabled = _make_experiment(exp_id='exp_off', enabled=False)

        with patch.object(loader, '_experiments', [exp_enabled, exp_disabled]), \
             patch.object(loader, '_last_loaded', time.monotonic()):
            result = get_active_experiments()

        ids = [e['id'] for e in result]
        assert 'exp_on' in ids, 'Enabled experiment must be included'
        assert 'exp_off' not in ids, 'Disabled experiment must be excluded'

    def test_reload_triggered_when_stale(self):
        """get_active_experiments must call _load_experiments when cache is older than 60s."""
        stale_time = time.monotonic() - 120  # 120 seconds ago → definitely stale

        with patch.object(loader, '_last_loaded', stale_time), \
             patch.object(loader, '_experiments', []), \
             patch('src.pipeline.experiment_loader._load_experiments') as mock_load:
            mock_load.return_value = []
            get_active_experiments()

        mock_load.assert_called_once(), '_load_experiments must be called when cache is stale'

    def test_no_reload_when_fresh(self):
        """get_active_experiments must NOT call _load_experiments when cache is fresh."""
        fresh_time = time.monotonic()  # just now

        with patch.object(loader, '_last_loaded', fresh_time), \
             patch.object(loader, '_experiments', []), \
             patch('src.pipeline.experiment_loader._load_experiments') as mock_load:
            get_active_experiments()

        mock_load.assert_not_called(), '_load_experiments must not be called when cache is fresh'


# ---------------------------------------------------------------------------
# Tests: resolve_experiment_for_session
# ---------------------------------------------------------------------------

class TestResolveExperimentForSession:

    def test_returns_none_when_no_experiments(self):
        """resolve_experiment_for_session must return None when the experiments list is empty."""
        with patch.object(loader, '_experiments', []), \
             patch.object(loader, '_last_loaded', time.monotonic()):
            result = resolve_experiment_for_session({}, {})

        assert result is None, f'Expected None, got {result!r}'

    def test_returns_none_when_no_enabled_experiments(self):
        """resolve_experiment_for_session must return None when all experiments are disabled."""
        disabled = _make_experiment(enabled=False)

        with patch.object(loader, '_experiments', [disabled]), \
             patch.object(loader, '_last_loaded', time.monotonic()):
            result = resolve_experiment_for_session(
                {'session_id': 'sess-x'},
                {'main_intent': 'property_search', 'sub_intent': 'filter_search'},
            )

        assert result is None

    def test_intent_targeting_match_returns_experiment(self):
        """resolve_experiment_for_session must return a dict with 'experiment_id' on intent match.

        We use a session_id whose bucket (via int.from_bytes) is < rollout_pct=100,
        so it will always be included.
        """
        exp = _make_experiment(
            exp_id='exp_match',
            intent='property_search/filter_search',
            rollout_pct=100,
        )
        session = {'session_id': 'sess-abc'}
        classification = {'main_intent': 'property_search', 'sub_intent': 'filter_search'}

        with patch.object(loader, '_experiments', [exp]), \
             patch.object(loader, '_last_loaded', time.monotonic()):
            result = resolve_experiment_for_session(session, classification)

        assert result is not None, 'Expected a result dict, got None'
        assert result.get('experiment_id') == 'exp_match', (
            f"Expected experiment_id='exp_match', got {result.get('experiment_id')!r}"
        )
        assert 'variant' in result, "Result must contain a 'variant' key"

    def test_intent_targeting_miss_returns_none(self):
        """resolve_experiment_for_session must return None when intent does not match targeting."""
        exp = _make_experiment(
            exp_id='exp_mismatch',
            intent='property_search/filter_search',
            rollout_pct=100,
        )
        session = {'session_id': 'sess-def'}
        classification = {
            'main_intent': 'locality_research',
            'sub_intent': 'locality_overview',
        }

        with patch.object(loader, '_experiments', [exp]), \
             patch.object(loader, '_last_loaded', time.monotonic()):
            result = resolve_experiment_for_session(session, classification)

        assert result is None, (
            f'Expected None for intent mismatch, got {result!r}'
        )

    def test_rollout_pct_zero_returns_none(self):
        """resolve_experiment_for_session must return None when rollout_pct is 0."""
        exp = _make_experiment(
            exp_id='exp_zero_rollout',
            intent='property_search/filter_search',
            rollout_pct=0,
        )
        session = {'session_id': 'sess-ghi'}
        classification = {'main_intent': 'property_search', 'sub_intent': 'filter_search'}

        with patch.object(loader, '_experiments', [exp]), \
             patch.object(loader, '_last_loaded', time.monotonic()):
            result = resolve_experiment_for_session(session, classification)

        assert result is None, (
            f'Expected None for rollout_pct=0, got {result!r}'
        )

    def test_returned_variant_has_id(self):
        """The variant in the resolved experiment result must have an 'id' field."""
        exp = _make_experiment(
            exp_id='exp_variant_check',
            rollout_pct=100,
        )
        session = {'session_id': 'sess-jkl'}
        classification = {'main_intent': 'property_search', 'sub_intent': 'filter_search'}

        with patch.object(loader, '_experiments', [exp]), \
             patch.object(loader, '_last_loaded', time.monotonic()):
            result = resolve_experiment_for_session(session, classification)

        assert result is not None
        variant = result.get('variant')
        assert isinstance(variant, dict), f"'variant' must be a dict, got {type(variant)}"
        assert 'id' in variant, "'variant' dict must have an 'id' key"
