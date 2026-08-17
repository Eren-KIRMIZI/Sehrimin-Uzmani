from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.users.models import User
from app.modules.favorites.models import Favorite
from app.modules.providers.models import ProviderProfile
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.post("/{provider_id}")
def add_favorite(
    provider_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    provider = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not provider:
        raise NotFoundException("Uzman")

    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id, Favorite.provider_id == provider_id
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Favorilerden kaldırıldı", "is_favorite": False}

    fav = Favorite(user_id=current_user.id, provider_id=provider_id)
    db.add(fav)
    db.commit()
    return {"message": "Favorilere eklendi", "is_favorite": True}


@router.get("")
def list_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    favorites = (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )

    result = []
    for f in favorites:
        provider = db.query(ProviderProfile).filter(ProviderProfile.id == f.provider_id).first()
        if provider:
            user = db.query(User).filter(User.id == provider.user_id).first()
            result.append({
                "id": f.id,
                "provider_id": provider.id,
                "business_name": provider.business_name,
                "rating": provider.rating,
                "review_count": provider.review_count,
                "user": {
                    "first_name": user.first_name if user else None,
                    "last_name": user.last_name if user else None,
                    "avatar": user.avatar if user else None,
                },
                "created_at": f.created_at,
            })
    return result


@router.delete("/{provider_id}")
def remove_favorite(
    provider_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.id, Favorite.provider_id == provider_id
    ).first()
    if not fav:
        raise NotFoundException("Favori")

    db.delete(fav)
    db.commit()
    return {"message": "Favorilerden kaldırıldı"}
