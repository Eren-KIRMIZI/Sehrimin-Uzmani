from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(Integer, ForeignKey("service_requests.id"), nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey("provider_profiles.id"), nullable=False, index=True)
    price = Column(Float, nullable=False)
    estimated_duration = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    materials = Column(Text, nullable=True)
    available_date = Column(DateTime(timezone=True), nullable=True)
    warranty_info = Column(Text, nullable=True)
    status = Column(String(20), default="PENDING")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    request = relationship("ServiceRequest", back_populates="quotes")
    provider = relationship("ProviderProfile", back_populates="quotes")
