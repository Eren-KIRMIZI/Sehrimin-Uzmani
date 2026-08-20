import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import engine, Base, check_db_health
from app.core.logging import setup_logging
from app.core.redis import verify_redis_connection, check_redis_health
from app.api.router import api_router
from app.modules.messaging.router import router as messaging_router
from app.middleware.logging_middleware import RequestLoggingMiddleware
from app.websocket.manager import websocket_endpoint
from app.shared.models import SystemSetting  # noqa: F401 — metadata discovery

# Logging'i mümkün olan en erken an kur
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Uygulama yaşam döngüsü — startup ve shutdown."""
    # ── Startup ──────────────────────────────────────────────────────────────
    logger.info("Uygulama baslatiliyor", extra={"environment": settings.ENVIRONMENT})

    # Veritabanı tablolarını oluştur
    Base.metadata.create_all(bind=engine)

    # Seed data
    from app.core.database import SessionLocal
    from app.seed import run_all_seeds

    db = SessionLocal()
    try:
        run_all_seeds(db)

        # Süresi dolmuş abonelikleri kapat
        from datetime import datetime, timezone
        from app.modules.subscriptions.models import ProviderSubscription
        from app.modules.users.models import User

        now = datetime.now(timezone.utc)
        expired = (
            db.query(ProviderSubscription)
            .filter(
                ProviderSubscription.status == "active",
                ProviderSubscription.expires_at < now,
            )
            .all()
        )
        for sub in expired:
            sub.status = "expired"
            user = db.query(User).filter(User.id == sub.provider_id).first()
            if user:
                user.subscription_plan = None
                user.commission_discount = 0.0
        if expired:
            db.commit()
            logger.info("Suresi dolan abonelikler pasiflestirildi", extra={"count": len(expired)})
    finally:
        db.close()

    # Redis bağlantısını doğrula
    verify_redis_connection()

    # Arka plan görevlerini başlat
    from app.core.jobs import start_scheduler
    start_scheduler()

    logger.info("Uygulama basarilukla basladi")
    yield

    # ── Shutdown ─────────────────────────────────────────────────────────────
    logger.info("Uygulama kapatiliyor...")
    from app.core.jobs import stop_scheduler
    stop_scheduler()
    logger.info("Uygulama kapatildi")


app = FastAPI(
    title="Şehrinin Uzmani API",
    description="Yerel Hizmet Pazaryeri Platformu",
    version=settings.APP_VERSION,
    docs_url="/docs" if not settings.is_production else None,  # Prod'da Swagger gizle
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)

# ── Middleware (ekleme sırası önemli: son eklenen ilk çalışır) ────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "PUT"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)
app.add_middleware(RequestLoggingMiddleware)  # En dışta — her request'i loglar

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(api_router)
app.include_router(messaging_router)


@app.websocket("/ws/{token}")
async def ws_endpoint(websocket: WebSocket, token: str):
    await websocket_endpoint(websocket, token)


# ── Global Exception Handler ─────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    from app.middleware.logging_middleware import get_request_id
    request_id = get_request_id() or request.headers.get("X-Request-ID", "")
    logger.error(
        "Hatali istek",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "error": str(exc),
        },
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Sunucu hatasi olustu", "request_id": request_id},
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs" if not settings.is_production else None,
    }


@app.get("/health")
def health():
    """
    Sistem sağlık kontrolü.
    DB veya Redis'ten biri sağlıksızsa HTTP 503 döner.
    Monitoring araçları (Uptime Kuma, Grafana vb.) bu endpoint'i izler.
    """
    db_ok = check_db_health()
    redis_ok = check_redis_health()
    all_ok = db_ok and redis_ok

    return JSONResponse(
        status_code=200 if all_ok else 503,
        content={
            "status": "ok" if all_ok else "degraded",
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "checks": {
                "database": "ok" if db_ok else "error",
                "redis": "ok" if redis_ok else "error",
            },
        },
    )
