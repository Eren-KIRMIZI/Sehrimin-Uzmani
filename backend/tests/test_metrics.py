"""
Observability metrik testleri.

HTTP middleware, /metrics endpoint ve WebSocket manager metriklerini dogrular.
Prometheus registry global oldugu icin mutlak deger degil artis (delta) kontrol edilir.
"""

import asyncio
import re

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.metrics import WS_CONNECTIONS_ACTIVE, WS_CONNECTIONS_CLOSED_TOTAL
from app.middleware.metrics_middleware import MetricsMiddleware


def _build_metrics_app() -> FastAPI:
    from app.core.metrics import metrics_response

    app = FastAPI()
    app.add_middleware(MetricsMiddleware)

    @app.get("/ok")
    def ok():
        return {"ok": True}

    @app.get("/boom")
    def boom():
        raise RuntimeError("kasitli hata")

    @app.get("/metrics")
    def metrics():
        return metrics_response()

    return app


@pytest.fixture
def mclient():
    return TestClient(_build_metrics_app(), raise_server_exceptions=False)


def _sample(text: str, name: str, **labels) -> float:
    """
    Exposition formatindan seriyi okur.
    Label siralamasina bagli kalmadan eslesir; bulunamazsa 0 dondurur.
    """
    pattern = re.compile(rf"^{re.escape(name)}\{{([^}}]*)\}}\s+([0-9.eE+-]+)$", re.M)
    for match in pattern.finditer(text):
        pairs = {}
        for pair in match.group(1).split(","):
            key, _, value = pair.partition("=")
            pairs[key.strip()] = value.strip().strip('"')
        if all(pairs.get(k) == str(v) for k, v in labels.items()):
            return float(match.group(2))
    return 0.0


class _FakeWebSocket:
    def __init__(self):
        self.sent = None

    async def accept(self):
        pass

    async def send_json(self, message):
        self.sent = message


class TestMetricsEndpoint:
    def test_returns_prometheus_format(self, mclient):
        response = mclient.get("/metrics")
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/plain")
        assert "# HELP" in response.text

    def test_metrics_path_not_self_instrumented(self, mclient):
        mclient.get("/metrics")
        text = mclient.get("/metrics").text
        assert 'endpoint="/metrics"' not in text


class TestHttpMetrics:
    def test_request_count_and_status_labels(self, mclient):
        def current():
            text = mclient.get("/metrics").text
            return _sample(
                text,
                "http_requests_total",
                method="GET",
                endpoint="/ok",
                status="200",
            )

        before = float(current())
        mclient.get("/ok")
        mclient.get("/ok")
        assert current() - before >= 2

    def test_unmatched_route_labeled_unmatched(self, mclient):
        mclient.get("/bu-yol-hicbir-seyle-eslesmez")
        value = _sample(
            mclient.get("/metrics").text,
            "http_requests_total",
            method="GET",
            endpoint="unmatched",
            status="404",
        )
        assert value >= 1

    def test_duration_histogram_recorded(self, mclient):
        mclient.get("/ok")
        text = mclient.get("/metrics").text
        assert "http_request_duration_seconds_bucket" in text
        assert (
            _sample(
                text,
                "http_request_duration_seconds_count",
                method="GET",
                endpoint="/ok",
            )
            >= 1
        )

    def test_in_progress_gauge_returns_to_zero(self, mclient):
        mclient.get("/ok")
        mclient.get("/boom")
        text = mclient.get("/metrics").text
        assert _sample(text, "http_requests_in_progress", method="GET") == 0

    def test_unhandled_exception_counted(self, mclient):
        def current():
            text = mclient.get("/metrics").text
            return _sample(
                text,
                "http_unhandled_exceptions_total",
                method="GET",
                endpoint="/boom",
            )

        before = float(current())
        response = mclient.get("/boom")
        assert response.status_code == 500
        assert current() - before >= 1

    def test_500_response_status_counted(self, mclient):
        # Global exception handler'i olmayan uygulamada exception yukari cikar;
        # ServerErrorMiddleware 500 uretir ama middleware exception yolunda da
        # status=500 olarak sayar.
        mclient.get("/boom")
        assert (
            _sample(
                mclient.get("/metrics").text,
                "http_requests_total",
                method="GET",
                endpoint="/boom",
                status="500",
            )
            >= 1
        )


class TestWebSocketMetrics:
    def test_connect_disconnect_updates_active_gauge(self):
        from app.websocket.manager import manager

        ws = _FakeWebSocket()
        user_id = 987654321
        baseline = WS_CONNECTIONS_ACTIVE._value.get()

        asyncio.run(manager.connect(ws, user_id))
        try:
            assert WS_CONNECTIONS_ACTIVE._value.get() == baseline + 1
        finally:
            manager.disconnect(ws, user_id)
        assert WS_CONNECTIONS_ACTIVE._value.get() == baseline

    def test_disconnect_reason_counted(self):
        from app.websocket.manager import manager

        ws = _FakeWebSocket()
        user_id = 987654322
        reason = "timeout"

        asyncio.run(manager.connect(ws, user_id))
        closed_before = WS_CONNECTIONS_CLOSED_TOTAL.labels(reason=reason)._value.get()
        manager.disconnect(ws, user_id, reason=reason)
        closed_after = WS_CONNECTIONS_CLOSED_TOTAL.labels(reason=reason)._value.get()
        assert closed_after == closed_before + 1

    def test_send_to_user_counts_messages(self):
        from app.core.metrics import WS_MESSAGES_SENT_TOTAL
        from app.websocket.manager import manager

        ws = _FakeWebSocket()
        user_id = 987654323

        asyncio.run(manager.connect(ws, user_id))
        sent_before = WS_MESSAGES_SENT_TOTAL._value.get()
        asyncio.run(manager.send_to_user(user_id, {"action": "ping"}))
        assert WS_MESSAGES_SENT_TOTAL._value.get() == sent_before + 1
        manager.disconnect(ws, user_id)

    def test_dead_connection_counts_send_error(self):
        from app.core.metrics import WS_SEND_ERRORS_TOTAL
        from app.websocket.manager import manager

        class _DeadWebSocket(_FakeWebSocket):
            async def send_json(self, message):
                raise RuntimeError("baglanti olu")

        ws = _DeadWebSocket()
        user_id = 987654324

        asyncio.run(manager.connect(ws, user_id))
        errors_before = WS_SEND_ERRORS_TOTAL._value.get()
        asyncio.run(manager.send_to_user(user_id, {"action": "ping"}))
        assert WS_SEND_ERRORS_TOTAL._value.get() == errors_before + 1
        # Olmus baglanti temizlendi
        assert user_id not in manager.active_connections
        manager.disconnect(ws, user_id)  # temiz durum — no-op olmali

    def test_disconnect_without_connect_is_noop(self):
        from app.websocket.manager import manager

        ws = _FakeWebSocket()
        user_id = 987654325
        active_before = WS_CONNECTIONS_ACTIVE._value.get()
        closed_before = WS_CONNECTIONS_CLOSED_TOTAL.labels(reason="normal")._value.get()
        manager.disconnect(ws, user_id)
        assert WS_CONNECTIONS_ACTIVE._value.get() == active_before
        assert (
            WS_CONNECTIONS_CLOSED_TOTAL.labels(reason="normal")._value.get()
            == closed_before
        )


class TestWsActionLabel:
    def test_known_actions_pass_through(self):
        from app.core.metrics import KNOWN_WS_ACTIONS, ws_action_label

        for action in KNOWN_WS_ACTIONS:
            assert ws_action_label(action) == action

    def test_unknown_and_none_map_to_other(self):
        from app.core.metrics import ws_action_label

        assert ws_action_label("cok-uzun-rastgele-action") == "other"
        assert ws_action_label(None) == "other"


class TestDbPoolMetrics:
    def test_pool_capacity_exposed(self):
        from app.core.database import MAX_OVERFLOW, POOL_SIZE
        from app.core.metrics import DB_POOL_CAPACITY

        assert DB_POOL_CAPACITY._value.get() == POOL_SIZE + MAX_OVERFLOW

    def test_checkout_checkin_roundtrip(self):
        from sqlalchemy import text as sql_text

        from app.core.database import engine
        from app.core.metrics import DB_POOL_CHECKED_OUT

        before = DB_POOL_CHECKED_OUT._value.get()
        with engine.connect() as conn:
            conn.execute(sql_text("SELECT 1"))
            during = DB_POOL_CHECKED_OUT._value.get()
        after = DB_POOL_CHECKED_OUT._value.get()
        assert during == before + 1
        assert after == before
