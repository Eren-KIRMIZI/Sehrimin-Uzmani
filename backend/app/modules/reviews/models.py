from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.core.base.models import BaseModel


class Review(BaseModel):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint(
            "request_id", "customer_id", name="uq_review_request_customer"
        ),
        Index("ix_reviews_provider_created", "provider_id", "created_at"),
    )

    request_id = Column(
        Integer, ForeignKey("service_requests.id"), nullable=False, index=True
    )
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    provider_id = Column(
        Integer, ForeignKey("provider_profiles.id"), nullable=False, index=True
    )
    rating = Column(Float, nullable=False)
    communication_rating = Column(Float, nullable=True)
    quality_rating = Column(Float, nullable=True)
    price_rating = Column(Float, nullable=True)
    punctuality_rating = Column(Float, nullable=True)
    comment = Column(Text, nullable=True)
    provider_reply = Column(Text, nullable=True)
    provider_replied_at = Column(DateTime(timezone=True), nullable=True)
    is_visible = Column(Integer, default=1)
    status = Column(String(20), default="ACTIVE")

    request = relationship("ServiceRequest")
    customer = relationship(
        "User", back_populates="reviews_given", foreign_keys=[customer_id]
    )
    provider = relationship(
        "ProviderProfile", back_populates="reviews_received", foreign_keys=[provider_id]
    )
