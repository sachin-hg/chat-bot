# Prompt Versioning

Semantic versioning for prompt blocks, changelog format, and cache invalidation on version change.

---

## Part 7 — Prompt Versioning & Metrics

Each prompt block file carries a frontmatter header:

```yaml
---
block_id: slm/01-rule-engine
version: 1.2.0
last_modified: 2026-05-20
metrics:
  target_accuracy: 0.95        # classification accuracy on eval set
  eval_set: tests/slm/eval/rule_engine_cases.jsonl
  passing_threshold: 0.92      # CI fails below this
---
```

### Evaluation Hooks

```python
# Each block has a corresponding eval set:
# tests/slm/eval/<block_id>.jsonl
# Format: { "input": SLMContext, "expected_output": SLMOutput, "notes": str }

# Running evals:
# python -m pytest tests/slm/eval/          # run all SLM block evals
# python -m pytest tests/slm/eval/ -k rule_engine   # run one block
# python -m pytest tests/llm/eval/          # run LLM response evals

# CI gate: evals run on every PR that touches prompts/ or registries/
# Blocks with version bump require eval passing before merge
```

### Block Change Policy

| Change type | Requires | Version bump |
|---|---|---|
| Fix typo / clarify wording | Eval run | Patch (1.2.0 → 1.2.1) |
| Add/modify example | Eval run | Minor (1.2.1 → 1.3.0) |
| Add new rule or intent | Full eval + review | Minor |
| Restructure rule order | Full eval + A/B test | Major (1.3.0 → 2.0.0) |

---

