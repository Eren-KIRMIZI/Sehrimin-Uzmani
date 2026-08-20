from datetime import datetime

from pydantic import BaseModel


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    avatar: str | None = None


class UserResponse(BaseModel):
    id: int
    email: str
    phone: str | None
    first_name: str
    last_name: str
    avatar: str | None
    role: str
    email_verified: bool
    phone_verified: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
