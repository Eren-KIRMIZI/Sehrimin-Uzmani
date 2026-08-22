from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.core.base.models import BaseModel


class Favorite(BaseModel):
    __tablename__ = "favorites"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    provider_id = Column(
        Integer, ForeignKey("provider_profiles.id"), nullable=False, index=True
    )
    last_service_id = Column(Integer, ForeignKey("services.id"), nullable=True)
    last_request_id = Column(Integer, ForeignKey("service_requests.id"), nullable=True)
    last_service_date = Column(DateTime(timezone=True), nullable=True)
    note = Column(String(255), nullable=True)

    __table_args__ = (
        Index("ix_favorites_user_provider", "user_id", "provider_id"),
        UniqueConstraint("user_id", "provider_id", name="uq_favorites_user_provider"),
    )

    user = relationship("User", back_populates="favorites")
    provider = relationship("ProviderProfile")
    last_service = relationship("Service")
