from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("request_id", "customer_id", name="uq_review_request_customer"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(Integer, ForeignKey("service_requests.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey("provider_profiles.id"), nullable=False, index=True)
    rating = Column(Float, nullable=False)
    communication_rating = Column(Float, nullable=True)
    quality_rating = Column(Float, nullable=True)
    price_rating = Column(Float, nullable=True)
    punctuality_rating = Column(Float, nullable=True)
    comment = Column(Text, nullable=True)
    status = Column(String(20), default="ACTIVE")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    request = relationship("ServiceRequest")
    customer = relationship("User", back_populates="reviews_given", foreign_keys=[customer_id])
    provider = relationship("ProviderProfile", back_populates="reviews_received", foreign_keys=[provider_id])
