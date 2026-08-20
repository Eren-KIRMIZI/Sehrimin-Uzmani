"""
SQLAlchemy veritabanı bağlantı yönetimi — production sertleştirmesi.
"""

import logging

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

# SQLite için connect_args farklı
_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,  # Bağlantı kullanılmadan önce kontrol et
    pool_recycle=3600,  # 1 saatte bir bağlantıyı yenile
    pool_timeout=30,  # Bağlantı beklemesi için max süre
    echo=settings.DEBUG,
    # PostgreSQL bağlantı zaman aşımı (SQLite desteklemez)
    connect_args={} if _is_sqlite else {"connect_timeout": 10},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


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
