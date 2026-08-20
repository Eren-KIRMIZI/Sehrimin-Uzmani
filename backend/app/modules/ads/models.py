from sqlalchemy import (
    Boolean,
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


class AdCategory(BaseModel):
    """İlan kategorileri — hizmet kategorilerinden bağımsız ayrı ağaç."""

    __tablename__ = "ad_categories"

    parent_id = Column(Integer, ForeignKey("ad_categories.id"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    icon = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    parent = relationship("AdCategory", remote_side="AdCategory.id", backref="children")
    ads = relationship("Ad", back_populates="category")


class Ad(BaseModel):
    __tablename__ = "ads"
    __table_args__ = (
        Index("ix_ads_status_published", "status", "published_at"),
        Index("ix_ads_city_category", "city_id", "category_id"),
    )

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(
        Integer, ForeignKey("ad_categories.id"), nullable=False, index=True
    )
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=True)
    currency = Column(String(10), default="TRY")
    price_type = Column(String(20), default="FIXED")  # FIXED, NEGOTIABLE, FREE
    status = Column(String(20), default="DRAFT", index=True)
    condition = Column(String(20), nullable=True)  # NEW, LIKE_NEW, GOOD, USED
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_negotiable = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    show_phone = Column(Boolean, default=True)
    phone = Column(String(20), nullable=True)
    view_count = Column(Integer, default=0)
    favorite_count = Column(Integer, default=0)
    contact_count = Column(Integer, default=0)
    published_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    category = relationship("AdCategory", back_populates="ads")
    city = relationship("City")
    district = relationship("District")
    images = relationship(
        "AdImage", back_populates="ad", cascade="all, delete-orphan",
        order_by="AdImage.sort_order",
    )
    attributes = relationship(
        "AdAttribute", back_populates="ad", cascade="all, delete-orphan"
    )
    favorites = relationship("AdFavorite", back_populates="ad", cascade="all, delete-orphan")
    reports = relationship("AdReport", back_populates="ad", cascade="all, delete-orphan")

    @property
    def cover_image(self) -> str | None:
        for img in self.images:
            if img.is_cover:
                return img.url
        return self.images[0].url if self.images else None


class AdImage(BaseModel):
    __tablename__ = "ad_images"

    ad_id = Column(Integer, ForeignKey("ads.id"), nullable=False, index=True)
    url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    sort_order = Column(Integer, default=0)
    is_cover = Column(Boolean, default=False)

    ad = relationship("Ad", back_populates="images")


class AdAttribute(BaseModel):
    """Kategoriye özel dinamik ilan özellikleri (marka, model, yıl, km...)."""

    __tablename__ = "ad_attributes"
    __table_args__ = (UniqueConstraint("ad_id", "attribute_key", name="uq_ad_attribute"),)

    ad_id = Column(Integer, ForeignKey("ads.id"), nullable=False, index=True)
    attribute_key = Column(String(100), nullable=False)
    attribute_value = Column(String(255), nullable=False)

    ad = relationship("Ad", back_populates="attributes")


class AdFavorite(BaseModel):
    __tablename__ = "ad_favorites"
    __table_args__ = (
        UniqueConstraint("user_id", "ad_id", name="uq_ad_favorite"),
    )

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    ad_id = Column(Integer, ForeignKey("ads.id"), nullable=False, index=True)

    user = relationship("User")
    ad = relationship("Ad", back_populates="favorites")


class AdReport(BaseModel):
    __tablename__ = "ad_reports"

    ad_id = Column(Integer, ForeignKey("ads.id"), nullable=False, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reason = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="OPEN", index=True)  # OPEN, RESOLVED, DISMISSED

    ad = relationship("Ad", back_populates="reports")
    reporter = relationship("User")
