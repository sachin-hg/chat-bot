"""Async Kafka producer with in-memory ring buffer fallback and dead-letter logging."""
from __future__ import annotations

import asyncio
import json
from collections import deque
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from aiokafka import AIOKafkaProducer

from src.observability.logging import get_logger

log = get_logger(__name__)

_RING_BUFFER_MAX  = 500
_RETRY_INTERVAL_S = 5
_MAX_RETRIES      = 60
_DEAD_LETTER_PATH = Path('logs/kafka_dead_letter.jsonl')


@dataclass
class _PendingMessage:
    topic: str
    value: dict
    retries: int = 0


# Module-level ring buffer — shared across all requests
_ring_buffer: deque[_PendingMessage] = deque(maxlen=_RING_BUFFER_MAX)
_producer: AIOKafkaProducer | None = None
_retry_task: asyncio.Task | None = None


async def init_producer(bootstrap_servers: str) -> None:
    """Call from FastAPI lifespan on startup."""
    global _producer, _retry_task
    _producer = AIOKafkaProducer(
        bootstrap_servers=bootstrap_servers,
        value_serializer=lambda v: json.dumps(v).encode(),
    )
    await _producer.start()
    _retry_task = asyncio.create_task(_retry_worker())
    log.info('kafka_producer_started', bootstrap_servers=bootstrap_servers)


async def stop_producer() -> None:
    """Call from FastAPI lifespan on shutdown."""
    global _producer, _retry_task
    if _retry_task:
        _retry_task.cancel()
    if _producer:
        await _producer.stop()
    log.info('kafka_producer_stopped')


async def publish(topic: str, value: dict) -> None:
    """Fire-and-forget publish. On failure, enqueues to ring buffer."""
    if _producer is None:
        log.warning('kafka_producer_not_initialized', topic=topic)
        _enqueue(topic, value)
        return
    try:
        await _producer.send(topic, value)
    except Exception as exc:
        log.warning('kafka_publish_failed', topic=topic, error=str(exc))
        _enqueue(topic, value)


def _enqueue(topic: str, value: dict) -> None:
    if len(_ring_buffer) >= _RING_BUFFER_MAX:
        log.warning('kafka_ring_buffer_full_dropping_oldest')
    _ring_buffer.append(_PendingMessage(topic=topic, value=value))


async def _retry_worker() -> None:
    """Background task: retries ring buffer entries every 5 seconds."""
    while True:
        await asyncio.sleep(_RETRY_INTERVAL_S)
        if not _ring_buffer:
            continue
        pending = list(_ring_buffer)
        _ring_buffer.clear()
        for msg in pending:
            if _producer is None:
                _ring_buffer.append(msg)
                continue
            try:
                await _producer.send(msg.topic, msg.value)
                log.info('kafka_retry_success', topic=msg.topic, retries=msg.retries)
            except Exception as exc:
                msg.retries += 1
                if msg.retries >= _MAX_RETRIES:
                    _write_dead_letter(msg)
                else:
                    _ring_buffer.append(msg)


def _write_dead_letter(msg: _PendingMessage) -> None:
    _DEAD_LETTER_PATH.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        'ts': datetime.utcnow().isoformat() + 'Z',
        'topic': msg.topic,
        'value': msg.value,
        'retries': msg.retries,
    }
    with _DEAD_LETTER_PATH.open('a', encoding='utf-8') as f:
        f.write(json.dumps(entry) + '\n')
    log.error('kafka_dead_letter_count', topic=msg.topic, retries=msg.retries)
