from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ServiceRequestCreate(BaseModel):
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    service_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    city_id: int
    district_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    preferred_date: Optional[datetime] = None
    preferred_time: Optional[str] = None
    urgency: str = "NORMAL"


class ServiceRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    preferred_date: Optional[datetime] = None
    preferred_time: Optional[str] = None
    urgency: Optional[str] = None
    status: Optional[str] = None


class ServiceRequestResponse(BaseModel):
    id: int
    customer_id: int
    title: str
    description: Optional[str]
    budget_min: Optional[float]
    budget_max: Optional[float]
    city_id: int
    district_id: Optional[int]
    preferred_date: Optional[datetime]
    preferred_time: Optional[str]
    urgency: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
