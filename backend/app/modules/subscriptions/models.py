from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class PlanInterval(str, enum.Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    PAUSED = "paused"
    PENDING = "pending"


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    price_monthly = Column(Float, nullable=False)
    price_quarterly = Column(Float, nullable=True)
    price_yearly = Column(Float, nullable=True)
    commission_discount = Column(Float, default=0.0)
    featured_listings = Column(Integer, default=0)
    priority_support = Column(Boolean, default=False)
    advanced_analytics = Column(Boolean, default=False)
    highlighted_profile = Column(Boolean, default=False)
    badge_type = Column(String(50), nullable=True)
    max_portfolio_images = Column(Integer, default=10)
    max_services = Column(Integer, default=5)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    features = relationship("PlanFeature", back_populates="plan", lazy="joined")


class PlanFeature(Base):
    __tablename__ = "plan_features"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=False)
    feature_name = Column(String(200), nullable=False)
    feature_value = Column(String(200), nullable=True)
    is_included = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)

    plan = relationship("SubscriptionPlan", back_populates="features")


class ProviderSubscription(Base):
    __tablename__ = "provider_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=False)
    interval = Column(String(20), default="monthly")
    status = Column(String(20), default="active")
    started_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    auto_renew = Column(Boolean, default=True)
    payment_id = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    provider = relationship("User", lazy="joined")
    plan = relationship("SubscriptionPlan", lazy="joined")


class SubscriptionPayment(Base):
    __tablename__ = "subscription_payments"

    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("provider_subscriptions.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(20), default="pending")
    payment_method = Column(String(50), nullable=True)
    payment_id = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)

    subscription = relationship("ProviderSubscription", lazy="joined")
