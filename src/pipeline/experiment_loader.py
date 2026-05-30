"""Hot-reloading experiment config from config/experiments.yaml."""
from __future__ import annotations
import time
from pathlib import Path
from src.observability.logging import get_logger

log = get_logger(__name__)

_RELOAD_INTERVAL_S = 60
_CONFIG_PATH = Path('config/experiments.yaml')

_experiments: list[dict] = []
_last_loaded: float = 0.0


def _load_experiments() -> list[dict]:
    global _experiments, _last_loaded
    try:
        import yaml
        if _CONFIG_PATH.exists():
            data = yaml.safe_load(_CONFIG_PATH.read_text()) or {}
            _experiments = data.get('experiments') or []
            _last_loaded = time.monotonic()
            log.info('experiments_loaded', count=len(_experiments))
        else:
            _experiments = []
    except Exception as exc:
        log.warn('experiments_load_failed', error=str(exc))
    return _experiments


def get_active_experiments() -> list[dict]:
    """Return current experiments, reloading if cache is stale (> 60s)."""
    if time.monotonic() - _last_loaded > _RELOAD_INTERVAL_S:
        _load_experiments()
    return [e for e in _experiments if e.get('enabled', False)]


def resolve_experiment_for_session(session: dict, classification: dict) -> dict | None:
    """Return the active experiment variant for this session, or None."""
    for exp in get_active_experiments():
        targeting = exp.get('targeting') or {}
        intent_target = targeting.get('intent', '')
        rollout_pct = targeting.get('rollout_pct', 100)

        # Check intent match
        if intent_target:
            c = classification
            intent_key = f"{c.get('main_intent','')}/{c.get('sub_intent','')}"
            if intent_target != intent_key:
                continue

        # Deterministic bucketing: use session_id hash for stable assignment
        session_id = session.get('session_id', '')
        bucket = int.from_bytes(session_id.encode()[:4].ljust(4, b'\x00'), 'big') % 100
        if bucket >= rollout_pct:
            continue

        # Select variant by weight
        variants = exp.get('variants') or []
        if not variants:
            continue
        total = sum(v.get('weight', 0) for v in variants)
        r = bucket % total
        cumulative = 0
        for variant in variants:
            cumulative += variant.get('weight', 0)
            if r < cumulative:
                return {'experiment_id': exp['id'], 'variant': variant}

    return None
