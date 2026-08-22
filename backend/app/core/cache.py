"""
Redis tabanlı uygulama cache'i.

`get()` / `set()` / `invalidate()` imzaları korunur — çağıran kodlar değişmez.

Davranış:
- Redis UP  → JSON serialization ile SETEX / GET.
- Redis DOWN → get() None döner (cache miss gibi davranır), set() sessizce geçer.

Bu sayede Redis'in geçici olarak erişilemez olması uygulamayı durdurmaz;
sadece cache bypass ederek her seferinde DB'ye gider.
"""

import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class ReferenceCache:
    """
    Redis-backed uygulama cache'i.

    TTL saniye cinsinden verilir (varsayılan 5 dakika).
    """

    def __init__(self, ttl_seconds: int = 300):
        self._ttl = ttl_seconds

    def _get_redis(self):
        """Her çağrıda singleton Redis client'ı döndürür."""
        try:
            from app.core.redis import redis_client
            return redis_client
        except Exception:
            return None

    def get(self, key: str) -> list | None:
        """
        Cache'ten veri döndürür.
        Miss veya Redis DOWN → None.
        """
        r = self._get_redis()
        if r is None:
            return None
        try:
            raw = r.get(f"cache:{key}")
            if raw is None:
                return None
            return json.loads(raw)
        except Exception as exc:
            logger.debug("Cache get hatası (key=%s): %s", key, exc)
            return None

    def set(self, key: str, data: list) -> None:
        """Veriyi Redis'e yazar. Redis DOWN → sessizce geçer."""
        r = self._get_redis()
        if r is None:
            return
        try:
            r.setex(f"cache:{key}", self._ttl, json.dumps(data, default=str))
        except Exception as exc:
            logger.debug("Cache set hatası (key=%s): %s", key, exc)

    def invalidate(self, key: Optional[str] = None) -> None:
        """
        Belirli bir key'i veya tüm cache namespace'ini temizler.
        key=None → cache:* pattern'ındaki tüm key'leri siler.
        """
        r = self._get_redis()
        if r is None:
            return
        try:
            if key:
                r.delete(f"cache:{key}")
            else:
                # Tüm cache: namespace'ini tara ve sil
                cursor = 0
                while True:
                    cursor, keys = r.scan(cursor, match="cache:*", count=100)
                    if keys:
                        r.delete(*keys)
                    if cursor == 0:
                        break
        except Exception as exc:
            logger.debug("Cache invalidate hatası: %s", exc)


ref_cache = ReferenceCache()
