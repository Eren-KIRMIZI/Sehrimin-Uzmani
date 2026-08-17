from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine, Base
from app.api.router import api_router
from app.modules.messaging.router import router as messaging_router
from app.websocket.manager import websocket_endpoint

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
    Base.metadata.create_all(bind=engine)
    from app.core.database import SessionLocal
    from app.seed import seed_cities, seed_categories
    db = SessionLocal()
    try:
        seed_cities(db)
        seed_categories(db)
    finally:
        db.close()


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Sunucu hatası oluştu"},
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
