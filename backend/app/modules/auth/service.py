from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.modules.auth.schemas import LoginRequest, RegisterRequest
from app.modules.users.models import User


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register(self, data: RegisterRequest) -> dict:
        existing = self.db.query(User).filter(User.email == data.email).first()
        if existing:
            raise ConflictException("Bu e-posta adresi zaten kayitli")

        if data.phone:
            existing_phone = (
                self.db.query(User).filter(User.phone == data.phone).first()
            )
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

        if user.two_factor_enabled:
            from datetime import timedelta

            from app.core.security import create_access_token

            temp_token = create_access_token(
                {"sub": str(user.id), "type": "2fa_pending"},
                expires_delta=timedelta(minutes=5),
            )
            return {
                "requires_2fa": True,
                "temp_token": temp_token,
                "token_type": "bearer",
            }

        tokens = self._create_tokens(user.id)
        return {"user": user, **tokens}

    def verify_2fa_login(self, temp_token: str, code: str) -> dict:
        import pyotp

        from app.core.encryption import decrypt
        from app.core.security import decode_token

        payload = decode_token(temp_token)
        if payload.get("type") != "2fa_pending":
            raise BadRequestException("Gecersiz token turu")

        user_id = int(payload.get("sub"))
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundException("Kullanici")

        if not user.two_factor_enabled or not user.two_factor_secret:
            raise BadRequestException("2FA aktif degil")

        try:
            secret = decrypt(user.two_factor_secret)
        except Exception:
            # Fallback: eski plaintext kayıtlar için (migration sonrası kaldırılabilir)
            secret = user.two_factor_secret

        totp = pyotp.TOTP(secret)
        if not totp.verify(code, valid_window=1):
            raise BadRequestException("Gecersiz dogrulama kodu")

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

        expires_at = datetime.fromtimestamp(payload.get("exp", 0), tz=timezone.utc)

        revoked = RevokedToken(
            token=refresh_token,
            user_id=user.id,
            expires_at=expires_at,
        )
        self.db.add(revoked)

        tokens = self._create_tokens(user.id)
        self.db.commit()

        # Kullanılan eski refresh token'ı Redis'e de ekle
        try:
            from app.core.redis import redis_client

            now = datetime.now(timezone.utc)
            remaining = max(0, int((expires_at - now).total_seconds()))
            if remaining > 0:
                redis_client.setex(f"revoked:{refresh_token}", remaining, "1")
        except Exception:
            pass

        return {"user": user, **tokens}

    def logout(self, token: str, user_id: int):
        from app.modules.auth.models import RevokedToken

        payload = decode_token(token)
        expires_at = datetime.fromtimestamp(payload.get("exp", 0), tz=timezone.utc)
        revoked = RevokedToken(token=token, user_id=user_id, expires_at=expires_at)
        self.db.add(revoked)
        self.db.commit()

        # Redis'e de yaz — blacklist kontrolü Redis üzerinden yapılıyor.
        # TTL: token'ın kalan ömrü (en fazla). Sona ermiş key'i tutmaya gerek yok.
        try:
            from app.core.redis import redis_client

            now = datetime.now(timezone.utc)
            remaining_seconds = max(0, int((expires_at - now).total_seconds()))
            if remaining_seconds > 0:
                redis_client.setex(f"revoked:{token}", remaining_seconds, "1")
        except Exception:
            # Redis erişilemezse DB kaydı yeterli; kontrol fail-open ile geçecek
            pass

    def _create_tokens(self, user_id: int) -> dict:
        access_token = create_access_token(data={"sub": str(user_id)})
        refresh_token = create_refresh_token(data={"sub": str(user_id)})
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }
