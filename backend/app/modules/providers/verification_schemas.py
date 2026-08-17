from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class VerificationApply(BaseModel):
    verification_type: str
    document_url: Optional[str] = None


class VerificationResponse(BaseModel):
    id: int
    provider_id: int
    verification_type: str
    document_url: Optional[str]
    status: str
    admin_note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
