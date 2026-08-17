from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class QuoteCreate(BaseModel):
    price: float
    estimated_duration: Optional[str] = None
    description: Optional[str] = None
    materials: Optional[str] = None
    available_date: Optional[datetime] = None
    warranty_info: Optional[str] = None


class QuoteResponse(BaseModel):
    id: int
    request_id: int
    provider_id: int
    price: float
    estimated_duration: Optional[str]
    description: Optional[str]
    materials: Optional[str]
    available_date: Optional[datetime]
    warranty_info: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
