from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rate_limiter import get_client_ip, rate_limiter
from app.core.security import (
    create_access_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
)
from app.modules.auth.service import AuthService
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

    if result.get("requires_2fa"):
        return {
            "requires_2fa": True,
            "temp_token": result["temp_token"],
            "token_type": result["token_type"],
        }

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


@router.post("/login/2fa")
def login_2fa(
    temp_token: str,
    code: str,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    result = service.verify_2fa_login(temp_token, code)
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


_bearer_scheme = HTTPBearer()


@router.post("/logout")
def logout(
    current_user: User = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
):
    """Token'ı blacklist'e ekleyerek kullanıcıyı güvenli şekilde çıkış yaptırır."""
    service = AuthService(db)
    try:
        service.logout(token=credentials.credentials, user_id=current_user.id)
    except Exception:
        pass  # Token zaten geçersiz/revoked olsa bile başarı döndür
    return {"message": "Basariyla cikis yapildi"}


@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    rate_limiter.check(f"forgot:{get_client_ip(request)}", max_requests=3, window_seconds=600)

    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return {"message": "Eger bu e-posta adresi kayitli ise sifre sifirlama baglantisi gonderilmistir"}

    reset_token = create_access_token(
        {"sub": str(user.id), "type": "reset"},
        expires_delta=timedelta(minutes=30),
    )

    from app.modules.notifications.service import create_notification
    create_notification(
        db=db,
        user_id=user.id,
        type_str="PASSWORD_RESET",
        title="Sifre Sifirlama",
        message=f"Sifre sifirlama tokeniniz: {reset_token[:20]}... (30 dakika gecerli)",
    )

    return {"message": "Eger bu e-posta adresi kayitli ise sifre sifirlama baglantisi gonderilmistir"}


@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    try:
        payload = decode_token(data.token)
    except Exception:
        raise HTTPException(status_code=400, detail="Gecersiz veya suresi dolmus token")

    if payload.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Gecersiz token turu")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=400, detail="Kullanici bulunamadi")

    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Sifre en az 8 karakter olmalidir")
    if not any(c.isupper() for c in data.new_password):
        raise HTTPException(status_code=400, detail="Sifre en az bir buyuk harf icermelidir")
    if not any(c.islower() for c in data.new_password):
        raise HTTPException(status_code=400, detail="Sifre en az bir kucuk harf icermelidir")
    if not any(c.isdigit() for c in data.new_password):
        raise HTTPException(status_code=400, detail="Sifre en az bir rakam icermelidir")

    user.password_hash = hash_password(data.new_password)
    db.commit()

    return {"message": "Sifreniz basariyla sifirlanmistir"}


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mevcut sifreniz hatali")

    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Yeni sifre en az 8 karakter olmalidir")
    if not any(c.isupper() for c in data.new_password):
        raise HTTPException(status_code=400, detail="Yeni sifre en az bir buyuk harf icermelidir")
    if not any(c.islower() for c in data.new_password):
        raise HTTPException(status_code=400, detail="Yeni sifre en az bir kucuk harf icermelidir")
    if not any(c.isdigit() for c in data.new_password):
        raise HTTPException(status_code=400, detail="Yeni sifre en az bir rakam icermelidir")

    current_user.password_hash = hash_password(data.new_password)
    db.commit()

    return {"message": "Sifreniz basariyla degistirildi"}


@router.post("/2fa/enable")
def enable_2fa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import pyotp

    from app.core.encryption import encrypt

    if current_user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="2FA zaten aktif")

    secret = pyotp.random_base32()
    current_user.two_factor_secret = encrypt(secret)  # şifreli sakla
    db.commit()

    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=current_user.email,
        issuer_name="SehrininUzmani",
    )

    return {
        "secret": secret,
        "provisioning_uri": provisioning_uri,
        "message": "2FA kurulumu baslatildi. Dogrulama kodunu girerek tamamlayin.",
    }


@router.post("/2fa/verify")
def verify_2fa_enable(
    code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import pyotp

    from app.core.encryption import decrypt

    if not current_user.two_factor_secret:
        raise HTTPException(status_code=400, detail="Once 2FA kurulumunu baslatin")

    try:
        secret = decrypt(current_user.two_factor_secret)
    except Exception:
        secret = current_user.two_factor_secret  # fallback plaintext

    totp = pyotp.TOTP(secret)
    if not totp.verify(code, valid_window=1):
        raise HTTPException(status_code=400, detail="Gecersiz dogrulama kodu")

    current_user.two_factor_enabled = True
    db.commit()

    return {"message": "2FA basariyla aktif edildi"}


@router.post("/2fa/disable")
def disable_2fa(
    password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="2FA zaten pasif")

    if not verify_password(password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Sifreniz hatali")

    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    db.commit()

    return {"message": "2FA basariyla devre disi birakildi"}
