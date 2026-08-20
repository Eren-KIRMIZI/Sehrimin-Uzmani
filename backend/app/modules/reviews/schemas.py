from datetime import datetime

from pydantic import BaseModel


class ReviewCreate(BaseModel):
    request_id: int
    provider_id: int
    rating: float
    communication_rating: float | None = None
    quality_rating: float | None = None
    price_rating: float | None = None
    punctuality_rating: float | None = None
    comment: str | None = None


class ReviewResponse(BaseModel):
    id: int
    request_id: int
    customer_id: int
    provider_id: int
    rating: float
    communication_rating: float | None
    quality_rating: float | None
    price_rating: float | None
    punctuality_rating: float | None
    comment: str | None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
