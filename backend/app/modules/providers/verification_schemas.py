from datetime import datetime

from pydantic import BaseModel


class VerificationApply(BaseModel):
    verification_type: str
    document_url: str | None = None


class VerificationResponse(BaseModel):
    id: int
    provider_id: int
    verification_type: str
    document_url: str | None
    status: str
    admin_note: str | None
    created_at: datetime

    class Config:
        from_attributes = True
