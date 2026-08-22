"""
Prometheus HTTP metrik middleware'i — saf ASGI implementasyonu.

BaseHTTPMiddleware yerine saf ASGI yazildi cunku:
- BaseHTTPMiddleware her istek icin ekstra task/response buffer olusturur;
  yuksek RPS altinda olcume kendi yukunu eklemek istemeyiz.
- Saf ASGI scope'a dogrudan erisir; routing bittikten sonra route
sablonu okunarak cardinality guvenli endpoint label'i uretilir.

Olculen metrikler:
- http_requests_total          {method, endpoint, status}
- http_request_duration_seconds{method, endpoint}  (histogram -> P50/95/99)
- http_requests_in_progress    {method}
- http_unhandled_exceptions_total {method, endpoint}

/metrics kendisi olculmez; scrape trafiği metrikleri sisirir.
"""

import time

from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.metrics import (
    HTTP_REQUEST_DURATION_SECONDS,
    HTTP_REQUESTS_IN_PROGRESS,
    HTTP_REQUESTS_TOTAL,
    HTTP_UNHANDLED_EXCEPTIONS_TOTAL,
    resolve_endpoint,
)

_EXCLUDED_PATHS = frozenset({"/metrics"})


class MetricsMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["path"] in _EXCLUDED_PATHS:
            await self.app(scope, receive, send)
            return

        method = scope["method"]
        status = 500
        started = time.perf_counter()
        in_progress = HTTP_REQUESTS_IN_PROGRESS.labels(method=method)
        in_progress.inc()

        async def send_wrapper(message: Message) -> None:
            nonlocal status
            if message["type"] == "http.response.start":
                status = message["status"]
            await send(message)

        try:
            try:
                await self.app(scope, receive, send_wrapper)
            except Exception:
                # Global exception handler devreye giremediyse de sayalim
                HTTP_UNHANDLED_EXCEPTIONS_TOTAL.labels(
                    method=method, endpoint=resolve_endpoint(scope)
                ).inc()
                raise
        finally:
            elapsed = time.perf_counter() - started
            endpoint = resolve_endpoint(scope)
            HTTP_REQUEST_DURATION_SECONDS.labels(
                method=method, endpoint=endpoint
            ).observe(elapsed)
            HTTP_REQUESTS_TOTAL.labels(
                method=method, endpoint=endpoint, status=str(status)
            ).inc()
            in_progress.dec()
