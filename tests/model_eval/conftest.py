"""Conftest for model eval tests — adds --real-model flag."""
import pytest


def pytest_addoption(parser):
    parser.addoption(
        "--real-model",
        action="store_true",
        default=False,
        help="Run model eval tests against the real SLM/LLM (requires model endpoint access)",
    )


def pytest_collection_modifyitems(config, items):
    if not config.getoption("--real-model"):
        skip_real_model = pytest.mark.skip(reason="Requires --real-model flag and model endpoint access")
        for item in items:
            if "real_model" in item.keywords:
                item.add_marker(skip_real_model)
