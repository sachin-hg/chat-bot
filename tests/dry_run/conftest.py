import pytest


def pytest_addoption(parser):
    try:
        parser.addoption("--real-slm", action="store_true", default=False,
                         help="Run dry-run tests with real Anthropic SLM (requires ANTHROPIC_API_KEY)")
    except ValueError:
        pass  # option already registered


def pytest_collection_modifyitems(config, items):
    if not config.getoption("--real-slm", default=False):
        skip = pytest.mark.skip(reason="Requires --real-slm flag and ANTHROPIC_API_KEY")
        for item in items:
            if "real_slm" in item.keywords:
                item.add_marker(skip)
