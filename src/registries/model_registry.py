"""MODEL_REGISTRY — auto-generated from docs/models/model-registry.md. Do not edit directly."""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Literal, Optional

ProviderName = Literal['anthropic', 'google', 'openai', 'self_hosted']

@dataclass
class QualityContract:
    """Measurable thresholds. Variant must meet ALL before promotion to control."""
    min_accuracy:       Optional[float] = None  # 0.0–1.0; from eval suite
    p95_latency_ms:     Optional[int]   = None
    p99_latency_ms:     Optional[int]   = None
    max_input_tokens:   Optional[int]   = None  # hard cap; prompt build fails if exceeded
    max_output_tokens:  Optional[int]   = None  # hard cap; truncate or raise

@dataclass
class ModelTokens:
    """Expected token counts per call — for cost projection and budget alerts."""
    input_uncached:  int   # tokens NOT in prompt cache (session context, message)
    input_cached:    int   # tokens always in prompt cache (static prompt blocks)
    output:          int   # average output tokens

@dataclass
class CostProfile:
    """Per-provider costs (USD per 1M tokens). Update when pricing changes."""
    input_per_1m:        float   # full input cost (cache miss)
    output_per_1m:       float
    cache_read_per_1m:   float   # cost for cached input (typically 10% of input_per_1m)
    cache_write_per_1m:  float   # cost to write to cache (typically 125% of input_per_1m)
    expected:            ModelTokens

    def cost_per_call(self) -> float:
        """Expected USD per call at steady state (cache warm)."""
        t = self.expected
        return (
            t.input_uncached  * self.input_per_1m       / 1_000_000
          + t.input_cached    * self.cache_read_per_1m  / 1_000_000
          + t.output          * self.output_per_1m      / 1_000_000
        )

    def daily_cost(self, calls_per_day: int) -> float:
        return self.cost_per_call() * calls_per_day

@dataclass
class ModelAssignment:
    task_id:          str           # stable identifier — never changes even if model changes
    description:      str           # WHY this model is used here; what makes it suitable
    provider:         ProviderName
    model_id:         str           # provider-specific model identifier
    adapter_class:    str           # fully-qualified class name; resolved at startup
    prompt_file:      Optional[str] # path to static prompt; None if built dynamically by the node
    quality_contract: QualityContract
    cost_profile:     CostProfile
    timeout_ms:       int
    max_retries:      int
    fallback_behavior: str  # 'use_last_domain' | 'out_of_scope' | 'error' | 'cached_response'


MODEL_REGISTRY: dict[str, ModelAssignment] = {

    # ── Stage 1: Domain Router ────────────────────────────────────────
    'domain_router': ModelAssignment(
        task_id     = 'domain_router',
        description = (
            'Routes user message to one of 5 domains (property_search, property_detail, '
            'locality, project_research, portfolio). 5-way classification. '
            'Speed and stability > accuracy — wrong domain is caught by validate_slm_node '
            'and treated as out_of_scope. Tiny prompt; any capable small model works here.'
        ),
        provider      = 'anthropic',
        model_id      = 'claude-haiku-4-5-20251001',
        adapter_class = 'bot.adapters.anthropic.AnthropicChatAdapter',
        prompt_file   = 'prompts/slm/domain_router.md',
        quality_contract = QualityContract(
            min_accuracy   = 0.98,
            p95_latency_ms = 50,
            max_input_tokens  = 260,
            max_output_tokens = 25,
        ),
        cost_profile = CostProfile(
            input_per_1m       = 0.80,
            output_per_1m      = 4.00,
            cache_read_per_1m  = 0.08,
            cache_write_per_1m = 1.00,
            expected = ModelTokens(input_uncached=35, input_cached=170, output=12),
        ),
        timeout_ms        = 500,
        max_retries       = 1,
        fallback_behavior = 'use_last_domain',
    ),

    # ── Stage 2: Domain-Scoped Intent Classifiers ─────────────────────
    # All five use the same model currently. Separate task_ids so each domain
    # can be experimented on independently (e.g., test Gemini Flash on locality
    # domain without touching property_search).

    'intent_classifier_property_search': ModelAssignment(
        task_id     = 'intent_classifier_property_search',
        description = (
            'Full intent + filter_delta extraction for property search domain. '
            'BHK, price, locality, amenities, property_type, construction_status. '
            'Filter extraction accuracy matters more than raw intent accuracy here — '
            'wrong filter key = wrong search results shown to user.'
        ),
        provider      = 'anthropic',
        model_id      = 'claude-haiku-4-5-20251001',
        adapter_class = 'bot.adapters.anthropic.AnthropicChatAdapter',
        prompt_file   = 'prompts/slm/domains/property_search.md',
        quality_contract = QualityContract(
            min_accuracy   = 0.95,
            p95_latency_ms = 150,
            max_input_tokens  = 950,
            max_output_tokens = 160,
        ),
        cost_profile = CostProfile(
            input_per_1m       = 0.80,
            output_per_1m      = 4.00,
            cache_read_per_1m  = 0.08,
            cache_write_per_1m = 1.00,
            expected = ModelTokens(input_uncached=175, input_cached=770, output=110),
        ),
        timeout_ms        = 2000,
        max_retries       = 2,
        fallback_behavior = 'out_of_scope',
    ),

    'intent_classifier_property_detail': ModelAssignment(
        task_id     = 'intent_classifier_property_detail',
        description = (
            'Intent classification for specific-property queries. '
            'Smaller filter_delta surface than property_search; entity extraction '
            '(active_property_id from session or ordinal reference) is the key task.'
        ),
        provider      = 'anthropic',
        model_id      = 'claude-haiku-4-5-20251001',
        adapter_class = 'bot.adapters.anthropic.AnthropicChatAdapter',
        prompt_file   = 'prompts/slm/domains/property_detail.md',
        quality_contract = QualityContract(min_accuracy=0.95, p95_latency_ms=150,
                                           max_input_tokens=850, max_output_tokens=130),
        cost_profile = CostProfile(
            input_per_1m=0.80, output_per_1m=4.00,
            cache_read_per_1m=0.08, cache_write_per_1m=1.00,
            expected=ModelTokens(input_uncached=170, input_cached=650, output=90),
        ),
        timeout_ms=2000, max_retries=2, fallback_behavior='out_of_scope',
    ),

    'intent_classifier_locality': ModelAssignment(
        task_id     = 'intent_classifier_locality',
        description = (
            'Locality and comparison intent classification. Covers the full locality_research '
            'taxonomy plus comparison intents. Entity extraction (locality names, '
            'commute destinations) is critical — locality names are diverse and ambiguous.'
        ),
        provider      = 'anthropic',
        model_id      = 'claude-haiku-4-5-20251001',
        adapter_class = 'bot.adapters.anthropic.AnthropicChatAdapter',
        prompt_file   = 'prompts/slm/domains/locality.md',
        quality_contract = QualityContract(min_accuracy=0.93, p95_latency_ms=150,
                                           max_input_tokens=1000, max_output_tokens=150),
        cost_profile = CostProfile(
            input_per_1m=0.80, output_per_1m=4.00,
            cache_read_per_1m=0.08, cache_write_per_1m=1.00,
            expected=ModelTokens(input_uncached=175, input_cached=820, output=110),
        ),
        timeout_ms=2000, max_retries=2, fallback_behavior='out_of_scope',
    ),

    'intent_classifier_project_research': ModelAssignment(
        task_id     = 'intent_classifier_project_research',
        description = (
            'Project and builder query classification. Smallest domain by volume (~5%). '
            'Project names are high-entropy (Lodha Palava, M3M Escala, Prestige Falcon) — '
            'entity extraction accuracy is more important than sub-intent classification.'
        ),
        provider      = 'anthropic',
        model_id      = 'claude-haiku-4-5-20251001',
        adapter_class = 'bot.adapters.anthropic.AnthropicChatAdapter',
        prompt_file   = 'prompts/slm/domains/project_research.md',
        quality_contract = QualityContract(min_accuracy=0.92, p95_latency_ms=150,
                                           max_input_tokens=850, max_output_tokens=130),
        cost_profile = CostProfile(
            input_per_1m=0.80, output_per_1m=4.00,
            cache_read_per_1m=0.08, cache_write_per_1m=1.00,
            expected=ModelTokens(input_uncached=165, input_cached=670, output=95),
        ),
        timeout_ms=2000, max_retries=2, fallback_behavior='out_of_scope',
    ),

    'intent_classifier_portfolio': ModelAssignment(
        task_id     = 'intent_classifier_portfolio',
        description = (
            'Portfolio intent classification. Simplest domain — 5 sub-intents, minimal '
            'filter_delta. Almost any capable small model can achieve ≥95% here. '
            'Prime candidate for self-hosted model cost reduction.'
        ),
        provider      = 'anthropic',
        model_id      = 'claude-haiku-4-5-20251001',
        adapter_class = 'bot.adapters.anthropic.AnthropicChatAdapter',
        prompt_file   = 'prompts/slm/domains/portfolio.md',
        quality_contract = QualityContract(min_accuracy=0.97, p95_latency_ms=120,
                                           max_input_tokens=700, max_output_tokens=100),
        cost_profile = CostProfile(
            input_per_1m=0.80, output_per_1m=4.00,
            cache_read_per_1m=0.08, cache_write_per_1m=1.00,
            expected=ModelTokens(input_uncached=155, input_cached=520, output=75),
        ),
        timeout_ms=2000, max_retries=2, fallback_behavior='out_of_scope',
    ),

    # ── LLM: Tier 3a (Haiku — conversational followup) ───────────────
    'llm_tier3a': ModelAssignment(
        task_id     = 'llm_tier3a',
        description = (
            'Conversational followup commentary for template intents (property_search, '
            'similar_properties, locality_carousel, portfolio/recommendations). '
            '1–3 sentences. Tone matters more than depth — Haiku is sufficient. '
            'Also used for text-only Tier 3a intents (locality_overview, commute_time). '
            'System prompt is heavily cached (~4,000 tokens static blocks).'
        ),
        provider      = 'anthropic',
        model_id      = 'claude-haiku-4-5-20251001',
        adapter_class = 'bot.adapters.anthropic.AnthropicStreamingAdapter',
        prompt_file   = None,   # built dynamically by build_prompt_node from FOLLOWUP_PROMPT_BLOCKS
        quality_contract = QualityContract(
            p95_latency_ms = 2000,   # time to first token
            max_output_tokens = 250,
        ),
        cost_profile = CostProfile(
            input_per_1m       = 0.80,
            output_per_1m      = 4.00,
            cache_read_per_1m  = 0.08,
            cache_write_per_1m = 1.00,
            expected = ModelTokens(input_uncached=700, input_cached=4000, output=90),
        ),
        timeout_ms        = 10000,
        max_retries       = 1,
        fallback_behavior = 'error',
    ),

    # ── LLM: Tier 3b (Sonnet — complex multi-source synthesis) ────────
    'llm_tier3b': ModelAssignment(
        task_id     = 'llm_tier3b',
        description = (
            'Full NLG synthesis for complex intents: locality comparison, project comparison, '
            'multi_intent decomposition. Uses Sonnet because: (1) 6 parallel pre-fetched results '
            'must be synthesised coherently; (2) markdown table output is expected and validated; '
            '(3) response quality delta vs Haiku is meaningful to users making large purchase '
            'decisions. Prompt cache is the decisive cost advantage vs other providers.'
        ),
        provider      = 'anthropic',
        model_id      = 'claude-sonnet-4-6',
        adapter_class = 'bot.adapters.anthropic.AnthropicStreamingAdapter',
        prompt_file   = None,
        quality_contract = QualityContract(
            p95_latency_ms = 4000,
            max_output_tokens = 800,
        ),
        cost_profile = CostProfile(
            input_per_1m       = 3.00,
            output_per_1m      = 15.00,
            cache_read_per_1m  = 0.30,
            cache_write_per_1m = 3.75,
            expected = ModelTokens(input_uncached=2000, input_cached=3500, output=350),
        ),
        timeout_ms        = 20000,
        max_retries       = 1,
        fallback_behavior = 'error',
    ),

    # ── Conversation Summarizer ───────────────────────────────────────
    'conversation_summarizer': ModelAssignment(
        task_id     = 'conversation_summarizer',
        description = (
            'Compresses oldest 10 turns into a ≤250-token prose summary. '
            'Runs async, off the critical path (followup_node fires it as a background task). '
            'Quality bar: must preserve active_property_id, active_locality_id, '
            'transaction_type, and price range. Entity names must be preserved verbatim. '
            'Any capable small model works; cheapest option wins.'
        ),
        provider      = 'anthropic',
        model_id      = 'claude-haiku-4-5-20251001',
        adapter_class = 'bot.adapters.anthropic.AnthropicChatAdapter',
        prompt_file   = 'prompts/summarizer.md',
        quality_contract = QualityContract(
            p95_latency_ms    = 5000,   # async — generous
            max_output_tokens = 280,
        ),
        cost_profile = CostProfile(
            input_per_1m       = 0.80,
            output_per_1m      = 4.00,
            cache_read_per_1m  = 0.08,
            cache_write_per_1m = 1.00,
            expected = ModelTokens(input_uncached=3500, input_cached=0, output=220),
        ),
        timeout_ms        = 8000,
        max_retries       = 1,
        fallback_behavior = 'cached_response',   # keep old summary if this call fails
    ),
}



# ── OpenRouter examples ────────────────────────────────────────────────────
# Uncomment / copy-paste these into the registry above to A/B test non-Anthropic
# models.  Set provider='openrouter' and OPENROUTER_API_KEY in .env.
# The adapter factory (src/adapters/factory.py) will route to OpenRouterClassifier
# / OpenRouterLLM automatically — no pipeline code changes required.

# Gemini Flash — fast and cheap, comparable to Haiku for SLM tasks
# ModelAssignment(
#     task_id='domain_router', provider='openrouter',
#     model_id='google/gemini-flash-1.5',
#     adapter_class='src.adapters.openrouter.OpenRouterDomainRouter',
#     ...same fields as above...
# )

# Llama 3.1 70B — strong open-source option for Tier 3b (Sonnet replacement)
# ModelAssignment(
#     task_id='llm_tier3b', provider='openrouter',
#     model_id='meta-llama/llama-3.1-70b-instruct',
#     adapter_class='src.adapters.openrouter.OpenRouterLLM',
#     ...
# )

# To run a full A/B test between Haiku and Gemini Flash on the domain router:
#   1. Set task_id='domain_router', provider='openrouter', model_id='google/gemini-flash-1.5'
#   2. Set OPENROUTER_API_KEY in .env
#   3. Restart server — no other changes needed


def get_model_id(task_id: str) -> str:
    """Return the current model_id for a task, or raise KeyError if unknown."""
    return MODEL_REGISTRY[task_id].model_id


def get_model_assignment(task_id: str) -> "ModelAssignment":
    return MODEL_REGISTRY[task_id]
