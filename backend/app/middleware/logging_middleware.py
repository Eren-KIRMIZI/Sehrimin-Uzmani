"""
Request ID ve performans loglama middleware'i.

Her HTTP isteğine benzersiz bir X-Request-ID UUID'si atar.
Request süresi, method, path ve status_code JSON loglanır.
Request ID, contextvars aracılığıyla log kayıtlarına otomatik eklenir.
"""
import logging
import time
import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)

# Her coroutine'e özgü request ID tutmak için ContextVar
_request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")


def get_request_id() -> str:
    """Mevcut request'in ID'sini döndürür. Log'larda kullanmak için."""
    return _request_id_ctx.get()


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Her request için:
      - Benzersiz X-Request-ID header'ı atar (veya client'dan gelenini kullanır)
      - İstek başlangıç/bitiş zamanını loglar
      - Yanıt header'ına X-Request-ID ekler
    """

    # Health check gibi yüksek frekanslı endpoint'leri loglama
    _SKIP_PATHS = {"/health", "/"}

    async def dispatch(self, request: Request, call_next) -> Response:
        # Client X-Request-ID göndermiş mi? Yoksa yeni üret
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        _request_id_ctx.set(request_id)

        start = time.perf_counter()

        # Health/root path'lerinde loglama yapma (gürültüyü azalt)
        should_log = request.url.path not in self._SKIP_PATHS

        if should_log:
            logger.info(
                "Request started",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "client_ip": _get_client_ip(request),
                },
            )

        try:
            response: Response = await call_next(request)
        except Exception as exc:
            elapsed = (time.perf_counter() - start) * 1000
            logger.error(
                "Request failed with unhandled exception",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "elapsed_ms": round(elapsed, 2),
                    "error": str(exc),
                },
                exc_info=True,
            )
            raise

        elapsed = (time.perf_counter() - start) * 1000

        if should_log:
            log_fn = logger.warning if response.status_code >= 400 else logger.info
            log_fn(
                "Request completed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "elapsed_ms": round(elapsed, 2),
                },
            )

        # Yanıt header'ına request ID ekle — client debug için kullanabilir
        response.headers["X-Request-ID"] = request_id
        return response


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
