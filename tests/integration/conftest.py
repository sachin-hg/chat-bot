"""Conftest for integration tests — adds --run-integration flag."""
import pytest


def pytest_addoption(parser):
    parser.addoption(
        "--run-integration",
        action="store_true",
        default=False,
        help="Run integration tests requiring real API access (VPN)",
    )


def pytest_collection_modifyitems(config, items):
    if not config.getoption("--run-integration"):
        skip_integration = pytest.mark.skip(reason="Requires --run-integration flag and VPN access")
        for item in items:
            if "integration" in item.keywords:
                item.add_marker(skip_integration)
