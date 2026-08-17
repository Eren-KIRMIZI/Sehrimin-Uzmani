from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
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
    status = Column(String(20), default="PUBLISHED")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("User", back_populates="service_requests", foreign_keys=[customer_id])
    category = relationship("Category")
    subcategory = relationship("SubCategory")
    service = relationship("Service")
    city = relationship("City")
    district = relationship("District")
    quotes = relationship("Quote", back_populates="request", cascade="all, delete-orphan")
    appointment = relationship("Appointment", back_populates="request", uselist=False)
    request_files = relationship("RequestFile", back_populates="request", cascade="all, delete-orphan")


class RequestFile(Base):
    __tablename__ = "request_files"

    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(Integer, ForeignKey("service_requests.id"), nullable=False, index=True)
    file_url = Column(String(500), nullable=False)
    file_type = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    request = relationship("ServiceRequest", back_populates="request_files")
