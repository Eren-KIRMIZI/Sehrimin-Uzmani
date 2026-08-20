from datetime import datetime
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class TimestampMixin:
    """Modeller için otomatik oluşturulma ve güncellenme zamanlarını tutar."""
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class BaseModel(Base, TimestampMixin):
    """
    Tüm veritabanı modelleri için ortak ID ve Timestamp alanlarını sağlar.
    abstract = True ile veritabanında bu isimle bir tablo oluşturulmasını engelleriz.
    """
    __abstract__ = True

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
