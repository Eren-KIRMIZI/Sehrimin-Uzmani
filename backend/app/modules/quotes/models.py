from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.base.models import BaseModel


class Quote(BaseModel):
    __tablename__ = "quotes"

    request_id = Column(
        Integer, ForeignKey("service_requests.id"), nullable=False, index=True
    )
    provider_id = Column(
        Integer, ForeignKey("provider_profiles.id"), nullable=False, index=True
    )
    total_price = Column(Float, nullable=False)
    estimated_duration = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    available_date = Column(DateTime(timezone=True), nullable=True)
    warranty_info = Column(Text, nullable=True)
    valid_until = Column(DateTime(timezone=True), nullable=True)
    status = Column(
        String(20), default="DRAFT"
    )  # DRAFT, SUBMITTED, VIEWED, NEGOTIATING, REJECTED, ACCEPTED

    __table_args__ = (Index("ix_quotes_request_status", "request_id", "status"),)

    request = relationship("ServiceRequest", back_populates="quotes")
    provider = relationship("ProviderProfile", back_populates="quotes")

    items = relationship(
        "QuoteItem", back_populates="quote", cascade="all, delete-orphan"
    )
    revisions = relationship(
        "QuoteRevision", back_populates="quote", cascade="all, delete-orphan"
    )
    status_history = relationship(
        "QuoteStatusHistory", back_populates="quote", cascade="all, delete-orphan"
    )


class QuoteItem(BaseModel):
    """Teklif detay kalemleri (İşçilik, Malzeme vb.)"""

    __tablename__ = "quote_items"

    quote_id = Column(Integer, ForeignKey("quotes.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), default="LABOR")  # LABOR, MATERIAL, TRAVEL, TAX, DISCOUNT
    price = Column(Float, nullable=False)
    quantity = Column(Float, default=1.0)
    description = Column(Text, nullable=True)

    quote = relationship("Quote", back_populates="items")


class QuoteRevision(BaseModel):
    """Teklif üzerindeki pazarlık/revizyon tarihçesi"""

    __tablename__ = "quote_revisions"

    quote_id = Column(Integer, ForeignKey("quotes.id"), nullable=False, index=True)
    revision_number = Column(Integer, nullable=False)
    old_total_price = Column(Float, nullable=False)
    new_total_price = Column(Float, nullable=False)
    requested_by = Column(String(20), nullable=False)  # CUSTOMER, PROVIDER
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)

    quote = relationship("Quote", back_populates="revisions")


class QuoteStatusHistory(BaseModel):
    """Teklifin durum geçiş logları"""

    __tablename__ = "quote_status_history"

    quote_id = Column(Integer, ForeignKey("quotes.id"), nullable=False, index=True)
    old_status = Column(String(20), nullable=True)
    new_status = Column(String(20), nullable=False)
    changed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reason = Column(Text, nullable=True)

    quote = relationship("Quote", back_populates="status_history")
