from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReviewCreate(BaseModel):
    request_id: int
    provider_id: int
    rating: float
    communication_rating: Optional[float] = None
    quality_rating: Optional[float] = None
    price_rating: Optional[float] = None
    punctuality_rating: Optional[float] = None
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    request_id: int
    customer_id: int
    provider_id: int
    rating: float
    communication_rating: Optional[float]
    quality_rating: Optional[float]
    price_rating: Optional[float]
    punctuality_rating: Optional[float]
    comment: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
