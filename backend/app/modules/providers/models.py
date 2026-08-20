from sqlalchemy import Column, Integer, String, Boolean, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.base.models import BaseModel


class ProviderProfile(BaseModel):
    __tablename__ = "provider_profiles"

    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    business_name = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    experience_years = Column(Integer, default=0)
    verification_status = Column(String(20), default="NONE")
    is_available = Column(Boolean, default=True)

    user = relationship("User", back_populates="provider_profile")
    performance = relationship("ProviderPerformance", back_populates="provider", uselist=False, cascade="all, delete-orphan")
    services = relationship("ProviderService", back_populates="provider")
    locations = relationship("ProviderLocation", back_populates="provider")
    service_areas = relationship("ProviderServiceArea", back_populates="provider")
    availability = relationship("ProviderAvailability", back_populates="provider")
    portfolio_items = relationship("PortfolioItem", back_populates="provider")
    quotes = relationship("Quote", back_populates="provider")
    appointments = relationship("Appointment", back_populates="provider", foreign_keys="Appointment.provider_id")
    reviews_received = relationship("Review", back_populates="provider", foreign_keys="Review.provider_id")


class ProviderPerformance(BaseModel):
    """Uzmanın performans ve KPI metrikleri"""
    __tablename__ = "provider_performance"

    provider_id = Column(Integer, ForeignKey("provider_profiles.id"), unique=True, nullable=False, index=True)
    rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    completed_jobs = Column(Integer, default=0)
    
    # KPI'lar
    response_rate = Column(Float, default=100.0) # Yüzde
    average_response_time = Column(Integer, default=0) # Dakika
    quote_win_rate = Column(Float, default=0.0) # Yüzde
    completion_rate = Column(Float, default=100.0) # Yüzde
    cancellation_rate = Column(Float, default=0.0) # Yüzde
    no_show_rate = Column(Float, default=0.0) # Yüzde
    repeat_customer_rate = Column(Float, default=0.0) # Yüzde
    average_job_value = Column(Float, default=0.0)

    provider = relationship("ProviderProfile", back_populates="performance")
