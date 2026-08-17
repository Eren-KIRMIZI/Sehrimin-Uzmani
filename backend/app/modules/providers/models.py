from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ProviderProfile(Base):
    __tablename__ = "provider_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    business_name = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    experience_years = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    completed_jobs = Column(Integer, default=0)
    response_time_minutes = Column(Integer, default=0)
    verification_status = Column(String(20), default="NONE")
    is_available = Column(Boolean, default=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="provider_profile")
    services = relationship("ProviderService", back_populates="provider")
    locations = relationship("ProviderLocation", back_populates="provider")
    availability = relationship("ProviderAvailability", back_populates="provider")
    portfolio_items = relationship("PortfolioItem", back_populates="provider")
    quotes = relationship("Quote", back_populates="provider")
    appointments = relationship("Appointment", back_populates="provider", foreign_keys="Appointment.provider_id")
    reviews_received = relationship("Review", back_populates="provider", foreign_keys="Review.provider_id")
