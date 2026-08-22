"""
SQLAlchemy veritabanı bağlantı yönetimi — production sertleştirmesi.
"""

import logging
import time

from sqlalchemy import create_engine, event, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings
from app.core.metrics import (
    DB_POOL_CAPACITY,
    DB_POOL_CHECKED_OUT,
    DB_POOL_CLOSED_TOTAL,
    DB_POOL_CREATED_TOTAL,
    DB_POOL_USAGE_SECONDS,
)

logger = logging.getLogger(__name__)

# Pool kapasitesi — capacity planlamasi icin tek yerden yonetilir.
# 4 worker x (20 + 10) = 120 uygulama baglantisi; PostgreSQL max_connections
# degerinin (250) altinda kalacak sekilde boyutlandirilmistir.
POOL_SIZE = 20
MAX_OVERFLOW = 10

# SQLite için connect_args farklı
_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=POOL_SIZE,
    max_overflow=MAX_OVERFLOW,
    pool_pre_ping=True,  # Bağlantı kullanılmadan önce kontrol et
    pool_recycle=3600,  # 1 saatte bir bağlantıyı yenile
    pool_timeout=30,  # Bağlantı beklemesi için max süre
    echo=settings.DEBUG,
    # PostgreSQL bağlantı zaman aşımı (SQLite desteklemez)
    connect_args={} if _is_sqlite else {"connect_timeout": 10},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ── Connection pool metrikleri ───────────────────────────────────────────────
# Sadece bu engine'e baglanir; test engine'leri metrikleri kirletmez.
@event.listens_for(engine, "connect")
def _on_pool_connect(dbapi_conn, connection_record):
    DB_POOL_CREATED_TOTAL.inc()


@event.listens_for(engine, "close")
def _on_pool_close(dbapi_conn, connection_record):
    DB_POOL_CLOSED_TOTAL.inc()


@event.listens_for(engine, "checkout")
def _on_pool_checkout(dbapi_conn, connection_record, connection_proxy):
    connection_record.info["checked_out_at"] = time.monotonic()
    DB_POOL_CHECKED_OUT.inc()


@event.listens_for(engine, "checkin")
def _on_pool_checkin(dbapi_conn, connection_record):
    checked_out_at = connection_record.info.pop("checked_out_at", None)
    if checked_out_at is not None:
        DB_POOL_USAGE_SECONDS.observe(time.monotonic() - checked_out_at)
    DB_POOL_CHECKED_OUT.dec()


def get_db():
    """
    FastAPI dependency injection için veritabanı oturumu sağlar.

    Exception durumunda rollback yaparak veritabanını temiz bırakır,
    ardından bağlantıyı her zaman kapatır.
    """
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as exc:
        logger.error(
            "Veritabani hatasi, rollback yapiliyor: %s", str(exc), exc_info=True
        )
        db.rollback()
        raise
    except Exception:
        # Uygulama hatalarında da rollback yap
        db.rollback()
        raise
    finally:
        db.close()


def check_db_health() -> bool:
    """
    Veritabanı bağlantısını test eder.
    Health check endpoint'i tarafından çağrılır.
    Returns True if healthy, False otherwise.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.warning("Veritabani saglik kontrolu basarisiz: %s", str(e))
        return False


# Pool kapasitesi sabittir; bir kez ayarlanir.
DB_POOL_CAPACITY.set(POOL_SIZE + MAX_OVERFLOW)
