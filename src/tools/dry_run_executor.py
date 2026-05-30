"""DryRunExecutor — fixture-based tool executor for BOT_ENV=mock / dry run tests."""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
from typing import Any


class ToolFixtureMissing(Exception):
    pass


class DryRunExecutor:
    """CachedExecutorPort implementation that reads from fixture JSON files instead of HTTP."""

    def __init__(self, scenario: str = "default"):
        self.scenario = scenario
        path = Path(f"tests/fixtures/scenarios/{scenario}.json")
        if not path.exists():
            raise FileNotFoundError(f"Dry run scenario not found: {path}")
        self.fixtures: dict = json.loads(path.read_text())
        self.calls_made: list[dict] = []

    async def execute(self, tool: str, params: dict, ttl: int = 0) -> Any:
        self.calls_made.append({"tool": tool, "params": params})
        param_hash = hashlib.md5(json.dumps(params, sort_keys=True).encode()).hexdigest()[:8]
        exact_key = f"{tool}:{param_hash}"
        result = self.fixtures.get(exact_key) or self.fixtures.get(tool)
        if result is None:
            available = [k for k in self.fixtures if k.startswith(tool)]
            raise ToolFixtureMissing(
                f"No fixture for '{tool}' in scenario '{self.scenario}'. "
                f"Available: {available or 'none'}. Add fixture or use different scenario."
            )
        return result

    async def invalidate_cache(self, tool: str, session_id: str) -> None:
        pass  # no-op in dry run
