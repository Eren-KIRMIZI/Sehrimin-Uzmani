import time
from typing import Optional


class ReferenceCache:
    def __init__(self, ttl_seconds: int = 300):
        self._store: dict = {}
        self._ttl = ttl_seconds

    def get(self, key: str) -> list | None:
        entry = self._store.get(key)
        if entry and time.time() - entry["ts"] < self._ttl:
            return entry["data"]
        return None

    def set(self, key: str, data: list):
        self._store[key] = {"data": data, "ts": time.time()}

    def invalidate(self, key: Optional[str] = None):
        if key:
            self._store.pop(key, None)
        else:
            self._store.clear()


ref_cache = ReferenceCache()
