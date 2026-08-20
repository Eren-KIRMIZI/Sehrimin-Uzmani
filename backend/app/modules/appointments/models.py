from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.base.models import BaseModel


class Appointment(BaseModel):
    __tablename__ = "appointments"

    request_id = Column(Integer, ForeignKey("service_requests.id"), unique=True, nullable=False)
    provider_id = Column(Integer, ForeignKey("provider_profiles.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    quote_id = Column(Integer, ForeignKey("quotes.id"), nullable=True)
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default="PENDING")
    location = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    reminder_sent = Column(Boolean, default=False)

    request = relationship("ServiceRequest", back_populates="appointment")
    provider = relationship("ProviderProfile", back_populates="appointments", foreign_keys=[provider_id])
    customer = relationship("User", foreign_keys=[customer_id])
    quote = relationship("Quote")
