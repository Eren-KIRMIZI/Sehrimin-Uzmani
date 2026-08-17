from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProviderProfileCreate(BaseModel):
    business_name: Optional[str] = None
    bio: Optional[str] = None
    experience_years: int = 0
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ProviderProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[int] = None
    is_available: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ProviderProfileResponse(BaseModel):
    id: int
    user_id: int
    business_name: Optional[str]
    bio: Optional[str]
    experience_years: int
    rating: float
    review_count: int
    completed_jobs: int
    response_time_minutes: int
    verification_status: str
    is_available: bool
    latitude: Optional[float]
    longitude: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class ProviderServiceCreate(BaseModel):
    service_id: int
    description: Optional[str] = None
    starting_price: Optional[float] = None
    pricing_type: str = "FIXED"
    duration_minutes: Optional[int] = None


class PortfolioItemCreate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: str
    category: Optional[str] = None


class ProviderLocationCreate(BaseModel):
    city_id: int
    district_id: Optional[int] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_primary: bool = False


class AvailabilityCreate(BaseModel):
    day_of_week: str
    start_time: str
    end_time: str
