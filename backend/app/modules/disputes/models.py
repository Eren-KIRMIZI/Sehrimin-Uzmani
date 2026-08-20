from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.base.models import BaseModel


class DisputeStatus(str, enum.Enum):
    OPEN = "open"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    CLOSED = "closed"
    ESCALATED = "escalated"


class DisputeReason(str, enum.Enum):
    SERVICE_NOT_RECEIVED = "service_not_received"
    QUALITY_ISSUE = "quality_issue"
    PRICE_DISAGREEMENT = "price_disagreement"
    NO_SHOW = "no_show"
    PARTIAL_PAYMENT = "partial_payment"
    FRAUD = "fraud"
    OTHER = "other"


class Dispute(BaseModel):
    __tablename__ = "disputes"

    request_id = Column(Integer, ForeignKey("service_requests.id"), nullable=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reported_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    amount_involved = Column(Float, nullable=True)
    status = Column(String(20), default="open")
    priority = Column(String(20), default="normal")
    resolution = Column(Text, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    reporter = relationship("User", foreign_keys=[reporter_id], lazy="joined")
    reported = relationship("User", foreign_keys=[reported_id], lazy="joined")
    resolver = relationship("User", foreign_keys=[resolved_by], lazy="joined")


class DisputeMessage(BaseModel):
    __tablename__ = "dispute_messages"

    dispute_id = Column(Integer, ForeignKey("disputes.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    is_admin = Column(Boolean, default=False)
    attachment_url = Column(String(500), nullable=True)

    sender = relationship("User", lazy="joined")
    dispute = relationship("Dispute", lazy="joined")


class DisputeEvidence(BaseModel):
    __tablename__ = "dispute_evidence"

    dispute_id = Column(Integer, ForeignKey("disputes.id"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_url = Column(String(500), nullable=False)
    description = Column(String(500), nullable=True)

    uploader = relationship("User", lazy="joined")
