from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    phone: Optional[str]
    first_name: str
    last_name: str
    avatar: Optional[str]
    role: str
    email_verified: bool
    phone_verified: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
