from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.core.base.models import BaseModel


class RevokedToken(BaseModel):
    __tablename__ = "revoked_tokens"

    token = Column(String(500), nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    revoked_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
