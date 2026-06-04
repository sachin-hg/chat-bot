"""Taxonomy block builders — generate intent and filter sections for domain prompts."""
from __future__ import annotations

from src.registries.intent_registry import INTENT_REGISTRY
from src.registries.filter_registry import FILTER_REGISTRY

DOMAIN_TO_INTENTS: dict = {
    'property_search':  ['property_search'],
    'property_detail':  ['property_detail', 'calculator'],
    'locality':         ['locality_research', 'comparison'],
    'project_research': ['project_research', 'comparison'],
    'portfolio':        ['portfolio', 'multi_intent'],
}


def build_intent_taxonomy_block(domain: str) -> str:
    """Generate the intent taxonomy section for a domain's Stage 2 prompt.

    Returns a formatted string listing each intent record for the domain,
    with sub_intent, tier, and description.  Used by classify_node to inject
    the taxonomy into the system prompt at startup.
    """
    main_intents = DOMAIN_TO_INTENTS.get(domain, [])
    records = [r for r in INTENT_REGISTRY if r.main_intent in main_intents]
    lines = []
    for r in records:
        lines.append(f"  {r.main_intent}/{r.sub_intent} (tier {r.tier})")
        lines.append(f"    {r.description}")
        lines.append("")
    return "\n".join(lines)


def build_filter_delta_block(domain: str) -> str:
    """Generate the filter delta rules section for a domain's Stage 2 prompt.

    Includes only filters relevant to the domain's intents (service_scope aware).
    Returns a formatted string suitable for injection into the system prompt.
    """
    lines = []
    for f in FILTER_REGISTRY:
        lines.append(f"  {f.key} ({f.type}, {f.default_operation})")
        lines.append(f"    {f.description}")
        if f.enum_values:
            lines.append(f"    Values: {', '.join(f.enum_values)}")
        if f.examples:
            for ex in f.examples[:2]:  # show at most 2 examples per filter
                lines.append(f"    e.g. \"{ex.user_says}\" → {ex.filter_delta}")
        lines.append("")
    return "\n".join(lines)
