from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, Index
from sqlalchemy.orm import relationship

from app.core.base.models import BaseModel


class Notification(BaseModel):
    __tablename__ = "notifications"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(30), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    data = Column(Text, nullable=True)
    action_url = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)

    __table_args__ = (
        Index("ix_notifications_user_read", "user_id", "is_read"),
    )

    user = relationship("User", back_populates="notifications")
