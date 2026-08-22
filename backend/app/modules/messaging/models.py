from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.core.base.models import BaseModel


class Conversation(BaseModel):
    __tablename__ = "conversations"

    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    provider_id = Column(
        Integer, ForeignKey("provider_profiles.id"), nullable=False, index=True
    )
    request_id = Column(Integer, ForeignKey("service_requests.id"), nullable=True)
    last_message_at = Column(DateTime(timezone=True), nullable=True)

    customer = relationship("User", foreign_keys=[customer_id])
    provider = relationship("ProviderProfile", foreign_keys=[provider_id])
    messages = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan"
    )


class Message(BaseModel):
    __tablename__ = "messages"

    conversation_id = Column(
        Integer, ForeignKey("conversations.id"), nullable=False, index=True
    )
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=True)
    message_type = Column(String(20), default="TEXT")
    attachment_url = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False)

    __table_args__ = (
        Index("ix_messages_conv_created", "conversation_id", "created_at"),
    )

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
