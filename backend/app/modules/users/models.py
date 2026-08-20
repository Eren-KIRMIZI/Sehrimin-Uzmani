from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.base.models import BaseModel
from app.shared.enums import UserRole


class User(BaseModel):
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    avatar = Column(String(500), nullable=True)
    role = Column(String(20), nullable=False, default=UserRole.USER.value)
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(255), nullable=True)
    subscription_plan = Column(String(50), nullable=True)
    commission_discount = Column(Float, default=0.0)

    # Relationships
    provider_profile = relationship(
        "ProviderProfile", back_populates="user", uselist=False
    )
    service_requests = relationship(
        "ServiceRequest",
        back_populates="customer",
        foreign_keys="ServiceRequest.customer_id",
    )
    favorites = relationship("Favorite", back_populates="user")
    reviews_given = relationship(
        "Review", back_populates="customer", foreign_keys="Review.customer_id"
    )
    notifications = relationship("Notification", back_populates="user")
    addresses = relationship(
        "UserAddress", back_populates="user", cascade="all, delete-orphan"
    )
    preferences = relationship(
        "UserPreference",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


class UserAddress(BaseModel):
    __tablename__ = "user_addresses"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(100), nullable=False)  # Ev, İş vb.
    full_address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    neighborhood = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_default = Column(Boolean, default=False)

    user = relationship("User", back_populates="addresses")


class UserPreference(BaseModel):
    __tablename__ = "user_preferences"

    user_id = Column(
        Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True
    )
    language = Column(String(10), default="tr")
    communication_preference = Column(String(20), default="email")  # email, sms, push
    promotions_enabled = Column(Boolean, default=True)
    newsletter_enabled = Column(Boolean, default=True)

    user = relationship("User", back_populates="preferences")
