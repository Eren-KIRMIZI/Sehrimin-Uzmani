from datetime import datetime

from pydantic import BaseModel


class QuoteCreate(BaseModel):
    price: float
    estimated_duration: str | None = None
    description: str | None = None
    materials: str | None = None
    available_date: datetime | None = None
    warranty_info: str | None = None


class QuoteResponse(BaseModel):
    id: int
    request_id: int
    provider_id: int
    price: float
    estimated_duration: str | None
    description: str | None
    materials: str | None
    available_date: datetime | None
    warranty_info: str | None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
