"""
Rate Limiter — Redis tabanlı atomic sliding window.

Davranış:
- Redis UP → Lua script ile atomic INCR + EXPIRE (race condition yok).
- Redis DOWN → fallback olarak in-memory limiter devreye girer.

Endpoint bazlı güvenlik politikası:
- login / register / forgot-password: Redis down olsa bile in-memory korunur (brute-force riski).
- promo_impression / promo_click: Redis down → pass (güvenlik riski düşük).

Bu farkı `strict=True` parametresi kontrol eder:
  strict=True  → Redis down → in-memory fallback aktif
  strict=False → Redis down → pass (sessiz)
"""

import logging
import time
from collections import defaultdict

from fastapi import HTTPException, Request

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lua script: INCR + EXPIRE atomik olarak çalışır.
# Dönen değer: penceredeki toplam istek sayısı.
# ---------------------------------------------------------------------------
_RATE_LIMIT_LUA = """
local key     = KEYS[1]
local limit   = tonumber(ARGV[1])
local window  = tonumber(ARGV[2])
local current = redis.call('INCR', key)
if current == 1 then
    redis.call('EXPIRE', key, window)
end
return current
"""


class _InMemoryFallback:
    """Redis erişilemediğinde devreye giren basit in-memory limiter."""

    def __init__(self):
        self._requests: dict[str, list[float]] = defaultdict(list)

    def check(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """True → limit aşıldı, False → izin var."""
        now = time.time()
        cutoff = now - window_seconds
        bucket = self._requests[key]
        # Pencere dışındakileri temizle
        self._requests[key] = [t for t in bucket if t > cutoff]
        if len(self._requests[key]) >= max_requests:
            return True
        self._requests[key].append(now)
        return False


_fallback = _InMemoryFallback()
_lua_script = None  # Redis'e bağlanınca register edilir


def _get_lua_script():
    """Lua script'i lazy olarak Redis'e register eder."""
    global _lua_script
    if _lua_script is None:
        try:
            from app.core.redis import redis_client

            _lua_script = redis_client.register_script(_RATE_LIMIT_LUA)
        except Exception:
            pass
    return _lua_script


class RateLimiter:
    def check(
        self,
        key: str,
        max_requests: int = 5,
        window_seconds: int = 300,
        strict: bool = True,
    ):
        """
        Rate limit kontrolü yapar.

        strict=True  → Redis down olsa da in-memory fallback ile limit korunur.
        strict=False → Redis down → sessizce geçer (düşük riskli endpoint'ler için).
        """
        script = _get_lua_script()

        if script is not None:
            try:
                current = script(
                    keys=[f"rl:{key}"], args=[max_requests, window_seconds]
                )
                if int(current) > max_requests:
                    raise HTTPException(
                        status_code=429,
                        detail=(
                            f"Çok fazla deneme. {window_seconds} saniye içinde "
                            f"en fazla {max_requests} hakkınız var."
                        ),
                    )
                return  # Redis başarıyla işledi, bitti
            except HTTPException:
                raise
            except Exception as exc:
                logger.warning("Rate limiter Redis hatası: %s", exc)
                # Redis erişilemedi → fallback politikasına geç

        # Redis erişilemez
        if not strict:
            return  # Düşük riskli endpoint → geç

        # Güvenlik kritik endpoint → in-memory fallback
        if _fallback.check(key, max_requests, window_seconds):
            raise HTTPException(
                status_code=429,
                detail=(
                    f"Çok fazla deneme. {window_seconds} saniye içinde "
                    f"en fazla {max_requests} hakkınız var."
                ),
            )


rate_limiter = RateLimiter()


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
