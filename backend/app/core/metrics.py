"""
Prometheus metrik tanimlari — uygulama gozlemlenebilirligi.

Tum metrikler tek bir modulden tanimlanir; HTTP middleware, WebSocket
manager ve veritabani pool event listener'lari buradaki objeleri gunceller.

Cardinality notu:
`endpoint` label'i ham URL degil route sablonudur (orn. /providers/{provider_id}).
Eslesmeyen yollar "unmatched" olarak isaretlenir; boylece path tarama
saldirilari label patlamasina yol acamaz.

WebSocket action label'i da bilinen action setiyle sinirlidir; bilinmeyen
action'lar "other" altinda toplanir.
"""

from fastapi import Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, Info

from app.core.config import settings

# ── Uygulama bilgisi ─────────────────────────────────────────────────────────
APP_INFO = Info("app", "Uygulama surumu ve ortam bilgisi")
APP_INFO.info({"version": settings.APP_VERSION, "environment": settings.ENVIRONMENT})

# ── HTTP ─────────────────────────────────────────────────────────────────────
HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Toplam HTTP istek sayisi",
    ["method", "endpoint", "status"],
)
HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "http_request_duration_seconds",
    "HTTP istek suresi (saniye)",
    ["method", "endpoint"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0),
)
HTTP_REQUESTS_IN_PROGRESS = Gauge(
    "http_requests_in_progress",
    "Su anda islenmekte olan HTTP istek sayisi",
    ["method"],
)
HTTP_UNHANDLED_EXCEPTIONS_TOTAL = Counter(
    "http_unhandled_exceptions_total",
    "Yakalanmamis exception ile sonlanan istek sayisi",
    ["method", "endpoint"],
)

# ── WebSocket ────────────────────────────────────────────────────────────────
WS_CONNECTIONS_ACTIVE = Gauge(
    "websocket_connections_active",
    "Aktif WebSocket baglanti sayisi",
)
WS_CONNECTIONS_OPENED_TOTAL = Counter(
    "websocket_connections_opened_total",
    "Toplam acilan WebSocket baglantisi",
)
WS_CONNECTIONS_CLOSED_TOTAL = Counter(
    "websocket_connections_closed_total",
    "Kapanan WebSocket baglantisi",
    ["reason"],  # normal | timeout | error
)
WS_AUTH_FAILURES_TOTAL = Counter(
    "websocket_auth_failures_total",
    "Kimlik dogrulama basarisiz WebSocket baglanti denemeleri",
)
WS_MESSAGES_RECEIVED_TOTAL = Counter(
    "websocket_messages_received_total",
    "Istemciden alinan mesaj sayisi",
    ["action"],
)
WS_MESSAGES_SENT_TOTAL = Counter(
    "websocket_messages_sent_total",
    "Istemciye basariyla gonderilen mesaj sayisi",
)
WS_SEND_ERRORS_TOTAL = Counter(
    "websocket_send_errors_total",
    "Gonderim sirasinda hata alan baglanti sayisi",
)

# Cardinality kontrolu: yalnizca bilinen action'lar label olur.
KNOWN_WS_ACTIONS = frozenset({"ping", "send_message", "mark_read", "typing"})

# ── Veritabani connection pool ───────────────────────────────────────────────
DB_POOL_CAPACITY = Gauge(
    "db_pool_capacity_connections",
    "Pool'un teorik maksimum baglanti kapasitesi (pool_size + max_overflow)",
)
DB_POOL_CHECKED_OUT = Gauge(
    "db_pool_checked_out_connections",
    "Su anda uygulama tarafindan kullanilan pool baglanti sayisi",
)
DB_POOL_CREATED_TOTAL = Counter(
    "db_pool_connections_created_total",
    "Surecin basindan beri olusturulan fiziksel DB baglantisi",
)
DB_POOL_CLOSED_TOTAL = Counter(
    "db_pool_connections_closed_total",
    "Surecin basindan beri kapatilan fiziksel DB baglantisi",
)
DB_POOL_USAGE_SECONDS = Histogram(
    "db_pool_connection_usage_seconds",
    "Bir baglantinin pool disinda gecirdigi sure (saniye)",
    buckets=(0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0),
)


def ws_action_label(action) -> str:
    """Action degerini sinirli bir label kumesine haritalar."""
    if action in KNOWN_WS_ACTIONS:
        return action
    return "other"


def resolve_endpoint(scope) -> str:
    """
    ASGI scope'tan route sablonunu cikarir (cardinality guvenli).

    Routing tamamlandiktan sonra Starlette scope["route"] atar.
    Route bulunamazsa (404, middleware seviyesinde hata vb.) "unmatched".
    """
    route = scope.get("route")
    if route is not None:
        return getattr(route, "path", None) or "unmatched"
    return "unmatched"


def metrics_response() -> Response:
    """Prometheus formatinda /metrics yaniti uretir."""
    from prometheus_client import generate_latest

    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
