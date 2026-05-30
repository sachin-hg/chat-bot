import json
from typing import AsyncGenerator


def sse_frame(event: str, data: dict) -> str:
    """Format one SSE frame. FastAPI StreamingResponse yields these strings."""
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
