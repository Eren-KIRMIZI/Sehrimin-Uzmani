import logging
from collections.abc import Callable
from typing import Any

from fastapi import BackgroundTasks

logger = logging.getLogger(__name__)


class EventBus:
    """Basit in-memory Event Bus. İleride Redis Pub/Sub veya Kafka'ya kolayca adapte edilebilir."""

    def __init__(self):
        self._subscribers: dict[str, list[Callable]] = {}

    def subscribe(self, event_name: str, callback: Callable):
        if event_name not in self._subscribers:
            self._subscribers[event_name] = []
        self._subscribers[event_name].append(callback)

    def publish(
        self, event_name: str, payload: Any, background_tasks: BackgroundTasks = None
    ):
        if event_name in self._subscribers:
            for callback in self._subscribers[event_name]:
                if background_tasks:
                    background_tasks.add_task(callback, payload)
                else:
                    try:
                        callback(payload)
                    except Exception as e:
                        logger.error(f"Event handler hatasi ({event_name}): {e!s}")


event_bus = EventBus()
