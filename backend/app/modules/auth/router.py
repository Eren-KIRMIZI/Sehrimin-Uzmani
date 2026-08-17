from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rate_limiter import rate_limiter, get_client_ip
from app.modules.auth.schemas import (
    RegisterRequest, LoginRequest, TokenResponse,
    RefreshRequest, ForgotPasswordRequest, ResetPasswordRequest,
    ChangePasswordRequest
)
from app.modules.auth.service import AuthService
from app.core.security import get_current_user
from app.modules.users.models import User

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=dict)
def register(data: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    rate_limiter.check(f"register:{get_client_ip(request)}", max_requests=3, window_seconds=600)
    service = AuthService(db)
    result = service.register(data)
    user = result["user"]
    return {
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "token_type": result["token_type"],
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
        }
    }


@router.post("/login", response_model=dict)
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    rate_limiter.check(f"login:{get_client_ip(request)}", max_requests=5, window_seconds=300)
    service = AuthService(db)
    result = service.login(data)
    user = result["user"]
    return {
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "token_type": result["token_type"],
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
        }
    }


@router.post("/refresh", response_model=dict)
def refresh(data: RefreshRequest, request: Request, db: Session = Depends(get_db)):
    rate_limiter.check(f"refresh:{get_client_ip(request)}", max_requests=10, window_seconds=300)
    service = AuthService(db)
    result = service.refresh_token(data.refresh_token)
    user = result["user"]
    return {
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "token_type": result["token_type"],
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "phone": current_user.phone,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role,
        "avatar": current_user.avatar,
        "email_verified": current_user.email_verified,
        "phone_verified": current_user.phone_verified,
        "subscription_plan": current_user.subscription_plan,
        "created_at": current_user.created_at,
    }


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Basariyla cikis yapildi"}
