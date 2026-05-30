from fastapi import APIRouter
from fastapi.responses import JSONResponse

from src.db.engine import get_engine
from src.session.redis import get_redis

router = APIRouter()


@router.get("/health")
async def health() -> JSONResponse:
    status: dict[str, str] = {"status": "ok", "version": "0.1.0"}

    # Redis
    try:
        await get_redis().ping()
        status["redis"] = "ok"
    except Exception:
        status["redis"] = "unavailable"
        status["status"] = "degraded"

    # PostgreSQL
    try:
        async with get_engine().connect() as conn:
            await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        status["postgres"] = "ok"
    except Exception:
        status["postgres"] = "unavailable"
        status["status"] = "degraded"

    http_status = 200 if status["status"] == "ok" else 503
    return JSONResponse(content=status, status_code=http_status)
