from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timezone
from app.modules.users.models import User
from app.modules.auth.schemas import RegisterRequest, LoginRequest
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.exceptions import BadRequestException, ConflictException, NotFoundException


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register(self, data: RegisterRequest) -> dict:
        existing = self.db.query(User).filter(User.email == data.email).first()
        if existing:
            raise ConflictException("Bu e-posta adresi zaten kayitli")

        if data.phone:
            existing_phone = self.db.query(User).filter(User.phone == data.phone).first()
            if existing_phone:
                raise ConflictException("Bu telefon numarasi zaten kayitli")

        user = User(
            email=data.email,
            phone=data.phone,
            password_hash=hash_password(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            role="USER",
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        tokens = self._create_tokens(user.id)
        return {"user": user, **tokens}

    def login(self, data: LoginRequest) -> dict:
        user = self.db.query(User).filter(User.email == data.email).first()
        if not user or not verify_password(data.password, user.password_hash):
            raise BadRequestException("E-posta veya sifre hatali")

        if not user.is_active:
            raise BadRequestException("Hesabiniz pasif durumda")

        tokens = self._create_tokens(user.id)
        return {"user": user, **tokens}

    def refresh_token(self, refresh_token: str) -> dict:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise BadRequestException("Gecersiz refresh token")

        user_id = payload.get("sub")
        user = self.db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise NotFoundException("Kullanici")

        if not user.is_active:
            raise BadRequestException("Hesabiniz pasif durumda, token yenilenemez")

        from app.modules.auth.models import RevokedToken
        now = datetime.now(timezone.utc)
        expires_at = datetime.fromtimestamp(payload.get("exp", 0), tz=timezone.utc)

        revoked = RevokedToken(
            token=refresh_token,
            user_id=user.id,
            expires_at=expires_at,
        )
        self.db.add(revoked)

        tokens = self._create_tokens(user.id)
        self.db.commit()
        return {"user": user, **tokens}

    def logout(self, token: str, user_id: int):
        from app.modules.auth.models import RevokedToken
        payload = decode_token(token)
        expires_at = datetime.fromtimestamp(payload.get("exp", 0), tz=timezone.utc)
        revoked = RevokedToken(token=token, user_id=user_id, expires_at=expires_at)
        self.db.add(revoked)
        self.db.commit()

    def _create_tokens(self, user_id: int) -> dict:
        access_token = create_access_token(data={"sub": str(user_id)})
        refresh_token = create_refresh_token(data={"sub": str(user_id)})
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }
