import uuid
from contextlib import asynccontextmanager

import structlog.contextvars
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from src.api import chat, health
from src.config import get_settings
from src.db.engine import close_engine, get_engine
from src.kafka.producer import init_producer, stop_producer
from src.observability.logging import configure_logging, get_logger
from src.session.llm_gate import LLMConcurrencyGate
from src.session.redis import close_redis, get_redis, init_redis

log = get_logger(__name__)


def _configure_langsmith(settings) -> None:
    """Export LangSmith env vars so LangGraph picks them up automatically."""
    import os
    from pydantic import SecretStr
    try:
        api_key = settings.langchain_api_key
        key_str = api_key.get_secret_value() if isinstance(api_key, SecretStr) else str(api_key or '')
        if settings.langchain_tracing_v2 and key_str:
            os.environ["LANGCHAIN_TRACING_V2"] = "true"
            os.environ["LANGCHAIN_API_KEY"] = key_str
            os.environ["LANGCHAIN_PROJECT"] = str(settings.langchain_project)
            log.info("langsmith_enabled", project=settings.langchain_project)
        else:
            os.environ["LANGCHAIN_TRACING_V2"] = "false"
    except Exception:
        os.environ["LANGCHAIN_TRACING_V2"] = "false"


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    configure_logging(settings.log_level)
    _configure_langsmith(settings)
    log.info("startup", bot_env=settings.bot_env)

    # Warm up connections — all are fail-soft (log + continue if unavailable)
    await init_redis()
    app.state.llm_gate = LLMConcurrencyGate(
        redis_pool=get_redis(),
        max_concurrent=settings.llm_max_concurrent,
        queue_max=settings.llm_queue_max,
        queue_wait_ms=settings.llm_queue_max_wait_ms,
    )
    log.info("llm_gate_initialized", max_concurrent=settings.llm_max_concurrent)
    try:
        async with get_engine().connect():
            pass
        log.info("postgres_connected")
    except Exception as exc:
        log.warning("postgres_unavailable_on_startup", error=str(exc))
    try:
        await init_producer(settings.kafka_bootstrap_servers)
    except Exception as exc:
        log.warning("kafka_unavailable_on_startup", error=str(exc))

    yield

    log.info("shutdown")
    await close_redis()
    await close_engine()
    await stop_producer()


app = FastAPI(title="Housing Chat Bot", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tightened in staging/prod via env
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(request_id=request_id)
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


app.include_router(health.router)
app.include_router(chat.router)
