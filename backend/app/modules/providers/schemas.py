from datetime import datetime

from pydantic import BaseModel


class ProviderProfileCreate(BaseModel):
    business_name: str | None = None
    bio: str | None = None
    experience_years: int = 0
    latitude: float | None = None
    longitude: float | None = None


class ProviderProfileUpdate(BaseModel):
    business_name: str | None = None
    bio: str | None = None
    experience_years: int | None = None
    is_available: bool | None = None
    latitude: float | None = None
    longitude: float | None = None


class ProviderProfileResponse(BaseModel):
    id: int
    user_id: int
    business_name: str | None
    bio: str | None
    experience_years: int
    rating: float
    review_count: int
    completed_jobs: int
    response_time_minutes: int
    verification_status: str
    is_available: bool
    latitude: float | None
    longitude: float | None
    created_at: datetime

    class Config:
        from_attributes = True


class ProviderServiceCreate(BaseModel):
    service_id: int
    description: str | None = None
    starting_price: float | None = None
    pricing_type: str = "FIXED"
    duration_minutes: int | None = None


class PortfolioItemCreate(BaseModel):
    title: str | None = None
    description: str | None = None
    image_url: str
    category: str | None = None


class ProviderLocationCreate(BaseModel):
    city_id: int
    district_id: int | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    is_primary: bool = False


class AvailabilityCreate(BaseModel):
    day_of_week: str
    start_time: str
    end_time: str
