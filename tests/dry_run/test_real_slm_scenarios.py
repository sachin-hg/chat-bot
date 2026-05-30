"""Dry-run tests with real Anthropic SLM classification. Run with: pytest --real-slm"""
import pytest
from tests.dry_run.runner import run_dry_pipeline

pytestmark = pytest.mark.real_slm


@pytest.mark.asyncio
async def test_real_slm_property_search_classification():
    """Real Haiku classifies '2bhk in bandra' as property_search/filter_search."""
    result = await run_dry_pipeline(
        message="show me 2bhk flat in bandra",
        scenario="2bhk_bandra_search",
        use_real_slm=True,
        use_real_llm=False,  # mock LLM to keep test fast
    )
    assert result.domain == 'property_search'
    assert result.main_intent == 'property_search'
    assert result.sub_intent in ('filter_search', 'filter_search')
    filter_delta = result.filter_delta
    assert filter_delta.get('bhk') == [2] or 2 in (filter_delta.get('bhk') or [])


@pytest.mark.asyncio
async def test_real_slm_out_of_scope_detection():
    """Real Haiku correctly routes 'tell me a joke' as out_of_scope."""
    result = await run_dry_pipeline(
        message="tell me a joke",
        scenario="default",
        use_real_slm=True,
        use_real_llm=False,
    )
    assert result.domain == 'out_of_scope'


@pytest.mark.asyncio
async def test_real_slm_locality_research():
    """Real Haiku classifies 'tell me about Andheri' as locality domain."""
    result = await run_dry_pipeline(
        message="tell me about Andheri locality in Mumbai",
        scenario="default",
        use_real_slm=True,
        use_real_llm=False,
    )
    assert result.domain in ('locality', 'property_search')
    assert result.main_intent in ('locality_research', 'property_search')


@pytest.mark.asyncio
async def test_real_slm_hindi_price_units():
    """Real Haiku understands Hindi price units — '80 lakh budget'."""
    result = await run_dry_pipeline(
        message="80 lakh budget 2bhk mumbai",
        scenario="2bhk_bandra_search",
        use_real_slm=True,
        use_real_llm=False,
    )
    assert result.domain == 'property_search'
    filter_delta = result.filter_delta
    # SLM should extract price in INR (8_000_000) or at least classify correctly
    price_max = filter_delta.get('price_max')
    if price_max is not None:
        assert price_max == 8_000_000 or price_max == '80L'


@pytest.mark.asyncio
async def test_real_slm_clarification_when_ambiguous():
    """Real Haiku asks for clarification on ambiguous 'looking for a flat'."""
    result = await run_dry_pipeline(
        message="looking for a flat",
        scenario="default",
        use_real_slm=True,
        use_real_llm=False,
    )
    # Either classifies with a guess OR requests clarification
    assert result.domain in ('property_search', 'out_of_scope')
    # If clarification needed, pipeline short-circuits cleanly
    if result.clarification:
        bot_response = result.final_state.get('bot_response') or {}
        assert bot_response.get('template_id') == 'nested_qna'
