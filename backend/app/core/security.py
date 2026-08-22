from datetime import datetime, timedelta

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import PyJWTError as JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz veya süresi dolmuş token",
        )


def check_token_blacklist(token: str, db: Session | None = None) -> bool:
    """
    Token'ın iptal edilip edilmediğini kontrol eder.

    Önce Redis'e bakar (mikrosaniye). Redis DOWN olursa fail-open politikası:
    token geçerli kabul edilir (access token TTL=30dk, risk sınırlı).

    Bu bilinçli bir security trade-off'tur:
      - Performans: DB'ye token başına 1 sorgu ortadan kalkar (145 endpoint).
      - Risk: Redis geçici down'da logout yapan kullanıcının token'ı ~30dk daha çalışabilir.
      - Admin/finansal endpoint'ler için ayrı politika gerekiyorsa `require_role` override edilebilir.
    """
    try:
        from app.core.redis import redis_client
        result = redis_client.exists(f"revoked:{token}")
        return bool(result)
    except Exception:
        # Redis erişilemez → fail-open (token geçerli say)
        # Fallback olarak DB kullanmıyoruz: amaç DB baskısını azaltmak
        return False


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    from app.modules.users.models import User

    token = credentials.credentials

    if check_token_blacklist(token, db):
        raise HTTPException(status_code=401, detail="Token iptal edilmis")

    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Gecersiz token turu")

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Geçersiz token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Hesap pasif")

    return user


def get_current_active_user(current_user=Depends(get_current_user)):
    return current_user


def require_role(*roles):
    def role_checker(current_user=Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Yetkiniz yetersiz")
        return current_user

    return role_checker
