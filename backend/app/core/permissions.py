from fastapi import HTTPException, status
from app.shared.enums import UserRole
from app.modules.users.models import User

def check_admin(user: User):
    if user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için yönetici yetkisi gereklidir."
        )

def check_ownership(user_id: int, resource_user_id: int):
    """Kaynağın sahibi veya admin olup olmadığını kontrol eder (ileride geliştirilebilir)."""
    if user_id != resource_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu kaynağa erişim yetkiniz bulunmamaktadır."
        )
