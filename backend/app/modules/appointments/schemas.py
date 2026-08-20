from datetime import datetime

from pydantic import BaseModel


class AppointmentCreate(BaseModel):
    request_id: int
    quote_id: int | None = None
    start_at: datetime
    end_at: datetime | None = None
    location: str | None = None
    notes: str | None = None


class AppointmentUpdate(BaseModel):
    start_at: datetime | None = None
    end_at: datetime | None = None
    status: str | None = None
    location: str | None = None
    notes: str | None = None
