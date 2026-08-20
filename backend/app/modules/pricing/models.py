from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.core.base.models import BaseModel


class PriceEstimate(BaseModel):
    """Hizmet bazlı fiyat tahmin verileri (cache benzeri tablo)"""
    __tablename__ = "price_estimates"

    service_id = Column(Integer, ForeignKey("services.id"), nullable=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True, index=True)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=True, index=True)

    avg_price = Column(Float, nullable=False, default=0.0)
    min_price = Column(Float, nullable=False, default=0.0)
    max_price = Column(Float, nullable=False, default=0.0)
    median_price = Column(Float, nullable=False, default=0.0)
    sample_size = Column(Integer, nullable=False, default=0)
    last_calculated = Column(DateTime(timezone=True), nullable=True)

    service = relationship("Service")
    category = relationship("Category")
    city = relationship("City")
