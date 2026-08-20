from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.base.models import BaseModel


class PromotedStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class PromotedProvider(BaseModel):
    __tablename__ = "promoted_providers"

    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    budget = Column(Float, nullable=False)
    spent = Column(Float, default=0.0)
    daily_budget = Column(Float, nullable=True)
    bid_amount = Column(Float, default=1.0)
    status = Column(String(20), default="active")
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    priority_boost = Column(Float, default=1.0)
    is_featured = Column(Boolean, default=False)
    badge_text = Column(String(50), nullable=True)

    provider = relationship("User", lazy="joined")
    plan = relationship("SubscriptionPlan", lazy="joined")
    category = relationship("Category", lazy="joined")


class PromotionLog(BaseModel):
    __tablename__ = "promotion_logs"

    promoted_id = Column(Integer, ForeignKey("promoted_providers.id"), nullable=False)
    event_type = Column(String(50), nullable=False)
    budget_spent = Column(Float, default=0.0)
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)

    promoted = relationship("PromotedProvider", lazy="joined")
