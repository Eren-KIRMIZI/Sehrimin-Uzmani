from datetime import datetime

from pydantic import BaseModel


class ServiceRequestCreate(BaseModel):
    category_id: int | None = None
    subcategory_id: int | None = None
    service_id: int | None = None
    title: str
    description: str | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    city_id: int
    district_id: int | None = None
    latitude: float | None = None
    longitude: float | None = None
    preferred_date: datetime | None = None
    preferred_time: str | None = None
    urgency: str = "NORMAL"


class ServiceRequestUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    preferred_date: datetime | None = None
    preferred_time: str | None = None
    urgency: str | None = None


class ServiceRequestResponse(BaseModel):
    id: int
    customer_id: int
    title: str
    description: str | None
    budget_min: float | None
    budget_max: float | None
    city_id: int
    district_id: int | None
    preferred_date: datetime | None
    preferred_time: str | None
    urgency: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
