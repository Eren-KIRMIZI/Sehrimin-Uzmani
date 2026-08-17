from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine, Base
from app.core.logging import setup_logging
from app.api.router import api_router
from app.modules.messaging.router import router as messaging_router
from app.websocket.manager import websocket_endpoint
import logging

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Şehrinin Uzmani API",
    description="Yerel Hizmet Pazaryeri Platformu",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(messaging_router)


@app.websocket("/ws/{token}")
async def ws_endpoint(websocket: WebSocket, token: str):
    await websocket_endpoint(websocket, token)


@app.on_event("startup")
def startup():
    setup_logging()
    logger.info("Uygulama baslatiliyor...")
    from app.modules.auth.models import RevokedToken
    Base.metadata.create_all(bind=engine)
    from app.core.database import SessionLocal
    from app.seed import run_all_seeds
    from app.core.jobs import start_scheduler
    db = SessionLocal()
    try:
        run_all_seeds(db)

        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        expired = db.query(ProviderSubscription).filter(
            ProviderSubscription.status == "active",
            ProviderSubscription.expires_at < now,
        ).all()
        for sub in expired:
            sub.status = "expired"
            user = db.query(User).filter(User.id == sub.provider_id).first()
            if user:
                user.subscription_plan = None
                user.commission_discount = 0.0
        if expired:
            db.commit()
    finally:
        db.close()
    start_scheduler()


@app.on_event("shutdown")
def shutdown():
    from app.core.jobs import stop_scheduler
    stop_scheduler()


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Hatali istek: %s %s - %s", request.method, request.url.path, str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Sunucu hatasi olustu"},
    )


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
