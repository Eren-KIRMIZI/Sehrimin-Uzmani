from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


class RegisterRequest(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    password: str
    first_name: str
    last_name: str
    role: str = "USER"

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Sifre en az 8 karakter olmalidir")
        if not any(c.isupper() for c in v):
            raise ValueError("Sifre en az bir buyuk harf icermelidir")
        if not any(c.islower() for c in v):
            raise ValueError("Sifre en az bir kucuk harf icermelidir")
        if not any(c.isdigit() for c in v):
            raise ValueError("Sifre en az bir rakam icermelidir")
        return v

    @field_validator("role")
    @classmethod
    def restrict_role(cls, v):
        if v not in ("USER", "PROVIDER"):
            raise ValueError("Sadece USER veya PROVIDER olarak kayit olabilirsiniz")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
