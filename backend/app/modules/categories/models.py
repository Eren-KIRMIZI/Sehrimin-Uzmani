from sqlalchemy import (
    Boolean,
    Column,
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


class Category(BaseModel):
    __tablename__ = "categories"

    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    icon = Column(String(50), nullable=True)
    image = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)

    subcategories = relationship(
        "SubCategory", back_populates="category", cascade="all, delete-orphan"
    )


class SubCategory(BaseModel):
    __tablename__ = "subcategories"

    category_id = Column(
        Integer, ForeignKey("categories.id"), nullable=False, index=True
    )
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    icon = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)

    category = relationship("Category", back_populates="subcategories")
    services = relationship(
        "Service", back_populates="subcategory", cascade="all, delete-orphan"
    )


class Service(BaseModel):
    __tablename__ = "services"

    subcategory_id = Column(
        Integer, ForeignKey("subcategories.id"), nullable=False, index=True
    )
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)

    subcategory = relationship("SubCategory", back_populates="services")
    provider_services = relationship("ProviderService", back_populates="service")
    attributes = relationship(
        "ServiceAttribute", back_populates="service", cascade="all, delete-orphan"
    )
    pricing_rules = relationship(
        "ServicePricingRule", back_populates="service", cascade="all, delete-orphan"
    )


class ServiceAttribute(BaseModel):
    """Hizmete özel dinamik alanlar (Örn: Kombi Markası, Cihaz Yaşı)"""

    __tablename__ = "service_attributes"

    service_id = Column(Integer, ForeignKey("services.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    type = Column(
        String(20), nullable=False, default="text"
    )  # text, select, boolean, number
    is_required = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)

    service = relationship("Service", back_populates="attributes")
    options = relationship(
        "ServiceAttributeOption",
        back_populates="attribute",
        cascade="all, delete-orphan",
    )


class ServiceAttributeOption(BaseModel):
    """Seçmeli özellikler için seçenek listesi (Örn: Vaillant, Buderus)"""

    __tablename__ = "service_attribute_options"

    attribute_id = Column(
        Integer, ForeignKey("service_attributes.id"), nullable=False, index=True
    )
    value = Column(String(100), nullable=False)
    sort_order = Column(Integer, default=0)

    attribute = relationship("ServiceAttribute", back_populates="options")


class ServicePricingRule(BaseModel):
    """Dinamik fiyatlandırma kuralları (Örn: Parça değişimi +500 TL)"""

    __tablename__ = "service_pricing_rules"

    service_id = Column(Integer, ForeignKey("services.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    rule_type = Column(String(50), nullable=False)  # addition, multiplier
    value = Column(Float, nullable=False)
    condition = Column(Text, nullable=True)  # İleride JSON vb ile değerlendirilebilir
    is_active = Column(Boolean, default=True)

    service = relationship("Service", back_populates="pricing_rules")


class ProviderService(BaseModel):
    __tablename__ = "provider_services"
    __table_args__ = (
        UniqueConstraint("provider_id", "service_id", name="uq_provider_service"),
        Index("ix_provider_service_provider_service", "provider_id", "service_id"),
    )

    provider_id = Column(
        Integer, ForeignKey("provider_profiles.id"), nullable=False, index=True
    )
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False, index=True)
    description = Column(Text, nullable=True)
    starting_price = Column(Float, nullable=True)
    pricing_type = Column(String(20), default="FIXED")
    duration_minutes = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)

    provider = relationship("ProviderProfile", back_populates="services")
    service = relationship("Service", back_populates="provider_services")
