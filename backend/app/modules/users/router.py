from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import BadRequestException
from app.core.security import get_current_user
from app.modules.users.models import User
from app.modules.users.schemas import UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "phone": current_user.phone,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "avatar": current_user.avatar,
        "role": current_user.role,
        "email_verified": current_user.email_verified,
        "phone_verified": current_user.phone_verified,
        "subscription_plan": current_user.subscription_plan,
        "created_at": current_user.created_at,
    }


@router.patch("/me")
def update_profile(data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    allowed_fields = {"first_name", "last_name", "phone", "avatar"}
    updates = data.model_dump(exclude_unset=True)

    if "phone" in updates and updates["phone"] != current_user.phone:
        existing = db.query(User).filter(User.phone == updates["phone"], User.id != current_user.id).first()
        if existing:
            raise BadRequestException("Bu telefon numarasi baska bir kullaniciya ait")

    for field, value in updates.items():
        if field in allowed_fields:
            setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return {"message": "Profil guncellendi", "user": current_user}


@router.delete("/me")
def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    from app.modules.auth.models import RevokedToken

    db.query(RevokedToken).filter(RevokedToken.user_id == current_user.id).delete()
    current_user.is_active = False
    db.commit()
    return {"message": "Hesap pasif yapildi, tokenlar iptal edildi"}
