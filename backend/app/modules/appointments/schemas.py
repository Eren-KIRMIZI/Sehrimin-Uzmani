from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AppointmentCreate(BaseModel):
    request_id: int
    quote_id: Optional[int] = None
    start_at: datetime
    end_at: Optional[datetime] = None
    location: Optional[str] = None
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    status: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
