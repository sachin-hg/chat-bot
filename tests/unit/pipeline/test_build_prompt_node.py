"""
Unit tests for build_prompt_node and FOLLOWUP_PROMPT_BLOCKS.

Covers:
  build_prompt_node — followup block lookup, generic fallback, is_followup flag,
                      tool_definitions key
  FOLLOWUP_PROMPT_BLOCKS — structural invariants (tuple keys, .md values)
"""
from __future__ import annotations

import pytest
from unittest.mock import MagicMock

from tests.unit.conftest import make_test_state
from src.pipeline.nodes.response import (
    build_prompt_node,
    FOLLOWUP_PROMPT_BLOCKS,
    LLMContext,
    PromptResult,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_composer(captured: list | None = None):
    """Returns a mock composer that records the LLMContext it receives."""
    if captured is None:
        captured = []

    def _build(ctx: LLMContext) -> PromptResult:
        captured.append(ctx)
        return PromptResult(system=f"SYSTEM:{ctx.prompt_block}:{ctx.is_followup}")

    composer = MagicMock()
    composer.build.side_effect = _build
    return composer, captured


def _minimal_session(**extra):
    base = {
        'session_id': 'sess-pmt-001',
        'active_filters': {},
        'turn_count': 0,
    }
    base.update(extra)
    return base


# ---------------------------------------------------------------------------
# Tests: build_prompt_node
# ---------------------------------------------------------------------------

class TestBuildPromptNode:

    @pytest.mark.asyncio
    async def test_uses_followup_block_for_filter_search(self):
        """build_prompt_node must select the followup block for property_search/filter_search."""
        composer, captured = _make_composer()

        state = make_test_state(
            classification={'main_intent': 'property_search', 'sub_intent': 'filter_search'},
            session=_minimal_session(),
        )

        result = await build_prompt_node(state, composer)

        assert captured, 'composer.build must have been called'
        ctx = captured[0]
        expected_block = FOLLOWUP_PROMPT_BLOCKS[('property_search', 'filter_search')]
        assert ctx.prompt_block == expected_block, (
            f'Expected prompt_block={expected_block!r}, got {ctx.prompt_block!r}'
        )

    @pytest.mark.asyncio
    async def test_falls_back_to_generic_for_unknown_intent(self):
        """build_prompt_node must fall back to prompts/llm/main/generic.md for unknown intents."""
        composer, captured = _make_composer()

        state = make_test_state(
            classification={'main_intent': 'unknown_intent', 'sub_intent': 'unknown_sub'},
            session=_minimal_session(),
        )

        # Confirm intent is truly not in the registry
        assert ('unknown_intent', 'unknown_sub') not in FOLLOWUP_PROMPT_BLOCKS

        result = await build_prompt_node(state, composer)

        ctx = captured[0]
        assert ctx.prompt_block == 'prompts/llm/main/generic.md', (
            f'Expected generic fallback, got {ctx.prompt_block!r}'
        )

    @pytest.mark.asyncio
    async def test_is_followup_true_when_summary_emitted(self):
        """build_prompt_node must pass is_followup=True to composer when summary_emitted=True."""
        composer, captured = _make_composer()

        state = make_test_state(
            classification={'main_intent': 'property_search', 'sub_intent': 'filter_search'},
            session=_minimal_session(),
            summary_emitted=True,
        )

        await build_prompt_node(state, composer)

        ctx = captured[0]
        assert ctx.is_followup is True, (
            f'Expected is_followup=True when summary_emitted=True, got {ctx.is_followup!r}'
        )

    @pytest.mark.asyncio
    async def test_is_followup_false_when_summary_not_emitted(self):
        """build_prompt_node must pass is_followup=False when summary_emitted is falsy."""
        composer, captured = _make_composer()

        state = make_test_state(
            classification={'main_intent': 'property_search', 'sub_intent': 'filter_search'},
            session=_minimal_session(),
            summary_emitted=False,
        )

        await build_prompt_node(state, composer)

        ctx = captured[0]
        assert ctx.is_followup is False, (
            f'Expected is_followup=False when summary_emitted=False, got {ctx.is_followup!r}'
        )

    @pytest.mark.asyncio
    async def test_returns_tool_definitions_key(self):
        """build_prompt_node must always return a dict with 'tool_definitions' key (list)."""
        composer, _ = _make_composer()

        state = make_test_state(
            classification={'main_intent': 'property_search', 'sub_intent': 'filter_search'},
            session=_minimal_session(),
        )

        result = await build_prompt_node(state, composer)

        assert 'tool_definitions' in result, "result must contain 'tool_definitions'"
        assert isinstance(result['tool_definitions'], list), \
            f"'tool_definitions' must be a list, got {type(result['tool_definitions'])}"

    @pytest.mark.asyncio
    async def test_returns_system_prompt_key(self):
        """build_prompt_node must return a dict with 'system_prompt' key (string)."""
        composer, _ = _make_composer()

        state = make_test_state(
            classification={'main_intent': 'locality_research', 'sub_intent': 'locality_overview'},
            session=_minimal_session(),
        )

        result = await build_prompt_node(state, composer)

        assert 'system_prompt' in result, "result must contain 'system_prompt'"
        assert isinstance(result['system_prompt'], str), \
            f"'system_prompt' must be a str, got {type(result['system_prompt'])}"


# ---------------------------------------------------------------------------
# Tests: FOLLOWUP_PROMPT_BLOCKS structural invariants
# ---------------------------------------------------------------------------

class TestFollowupPromptBlocksStructure:

    def test_all_keys_are_two_string_tuples(self):
        """Every key in FOLLOWUP_PROMPT_BLOCKS must be a (str, str) tuple."""
        for key in FOLLOWUP_PROMPT_BLOCKS:
            assert isinstance(key, tuple), f'Key {key!r} is not a tuple'
            assert len(key) == 2, f'Key {key!r} does not have exactly 2 elements'
            assert isinstance(key[0], str), f'Key[0] of {key!r} is not a str'
            assert isinstance(key[1], str), f'Key[1] of {key!r} is not a str'

    def test_all_values_are_md_paths(self):
        """Every value in FOLLOWUP_PROMPT_BLOCKS must be a string ending in '.md'."""
        for key, value in FOLLOWUP_PROMPT_BLOCKS.items():
            assert isinstance(value, str), \
                f'Value for {key!r} is not a string: {value!r}'
            assert value.endswith('.md'), \
                f'Value for {key!r} does not end with .md: {value!r}'

    def test_filter_search_block_is_correct(self):
        """FOLLOWUP_PROMPT_BLOCKS must contain the expected path for filter_search."""
        key = ('property_search', 'filter_search')
        assert key in FOLLOWUP_PROMPT_BLOCKS, f'{key!r} must be registered'
        assert FOLLOWUP_PROMPT_BLOCKS[key] == 'prompts/llm/followup/property_search.md'

    def test_registry_is_non_empty(self):
        """FOLLOWUP_PROMPT_BLOCKS must have at least one entry."""
        assert len(FOLLOWUP_PROMPT_BLOCKS) > 0, 'FOLLOWUP_PROMPT_BLOCKS must not be empty'
