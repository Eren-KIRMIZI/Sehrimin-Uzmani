from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.base.models import BaseModel


class ServiceRequest(BaseModel):
    __tablename__ = "service_requests"

    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    subcategory_id = Column(Integer, ForeignKey("subcategories.id"), nullable=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    budget_min = Column(Float, nullable=True)
    budget_max = Column(Float, nullable=True)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    preferred_date = Column(DateTime(timezone=True), nullable=True)
    preferred_time = Column(String(20), nullable=True)
    urgency = Column(String(20), default="NORMAL")
    status = Column(String(20), default="DRAFT") # DRAFT, PUBLISHED, MATCHING, QUOTING...

    customer = relationship("User", back_populates="service_requests", foreign_keys=[customer_id])
    category = relationship("Category")
    subcategory = relationship("SubCategory")
    service = relationship("Service")
    city = relationship("City")
    district = relationship("District")

    request_files = relationship("RequestFile", back_populates="request", cascade="all, delete-orphan")
    attributes = relationship("RequestAttribute", back_populates="request", cascade="all, delete-orphan")
    status_history = relationship("RequestStatusHistory", back_populates="request", cascade="all, delete-orphan")
    matches = relationship("RequestMatch", back_populates="request", cascade="all, delete-orphan")
    quotes = relationship("Quote", back_populates="request", cascade="all, delete-orphan")
    appointment = relationship("Appointment", back_populates="request", uselist=False)

class RequestFile(BaseModel):
    __tablename__ = "request_files"

    request_id = Column(Integer, ForeignKey("service_requests.id"), nullable=False, index=True)
    file_url = Column(String(500), nullable=False)
    file_type = Column(String(20), nullable=True)

    request = relationship("ServiceRequest", back_populates="request_files")

class RequestAttribute(BaseModel):
    """AI tarafından çıkarılan veya kullanıcının girdiği dinamik detaylar"""
    __tablename__ = "request_attributes"

    request_id = Column(Integer, ForeignKey("service_requests.id"), nullable=False, index=True)
    attribute_name = Column(String(100), nullable=False) # Örn: kombi_markasi, arizali_parca
    attribute_value = Column(String(255), nullable=False)
    confidence = Column(Float, nullable=True) # AI tarafından çıkarıldıysa güven skoru

    request = relationship("ServiceRequest", back_populates="attributes")

class RequestStatusHistory(BaseModel):
    """Talebin durum (state machine) geçiş logları"""
    __tablename__ = "request_status_history"

    request_id = Column(Integer, ForeignKey("service_requests.id"), nullable=False, index=True)
    old_status = Column(String(20), nullable=True)
    new_status = Column(String(20), nullable=False)
    changed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Sistem ise null
    reason = Column(Text, nullable=True)

    request = relationship("ServiceRequest", back_populates="status_history")

class RequestMatch(BaseModel):
    """Talep ile eşleşen uzmanların listesi ve eşleşme skorları"""
    __tablename__ = "request_matches"
    __table_args__ = (
        Index("ix_req_match_req_prov", "request_id", "provider_id"),
    )

    request_id = Column(Integer, ForeignKey("service_requests.id"), nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey("provider_profiles.id"), nullable=False, index=True)
    match_score = Column(Float, nullable=False, default=0.0) # 0.0 - 100.0 arası
    distance_km = Column(Float, nullable=True)
    status = Column(String(20), default="INVITED") # INVITED, ACCEPTED (Teklif verdi), REJECTED, EXPIRED

    request = relationship("ServiceRequest", back_populates="matches")
    provider = relationship("ProviderProfile")
