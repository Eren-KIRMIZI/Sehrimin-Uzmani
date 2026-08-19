from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sql_func
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.modules.users.models import User
from app.modules.providers.models import ProviderProfile
from app.modules.providers.availability_model import ProviderAvailability
from app.modules.providers.portfolio_model import PortfolioItem
from app.modules.locations.models import ProviderLocation
from app.modules.categories.models import ProviderService
from app.modules.providers.schemas import (
    ProviderProfileCreate, ProviderProfileUpdate,
    ProviderServiceCreate, PortfolioItemCreate,
    ProviderLocationCreate, AvailabilityCreate
)
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from app.shared.pagination import PaginationParams, PaginatedResponse
from app.shared.utils import haversine

router = APIRouter(prefix="/providers", tags=["Providers"])

MAX_PORTFOLIO_ITEMS = 30
MAX_LOCATIONS = 10


@router.post("/profile")
def create_provider_profile(
    data: ProviderProfileCreate,
    current_user: User = Depends(require_role("PROVIDER", "ADMIN")),
    db: Session = Depends(get_db),
):
    existing = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if existing:
        from app.core.exceptions import ConflictException
        raise ConflictException("Zaten bir uzman profiliniz var")

    profile = ProviderProfile(
        user_id=current_user.id,
        business_name=data.business_name,
        bio=data.bio,
        experience_years=data.experience_years,
        latitude=data.latitude,
        longitude=data.longitude,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return {"message": "Uzman profili oluşturuldu", "profile": profile}


@router.get("/me")
def get_my_provider_profile(
    current_user: User = Depends(require_role("PROVIDER", "ADMIN")),
    db: Session = Depends(get_db),
):
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise NotFoundException("Uzman profili")
    return profile


@router.patch("/me")
def update_my_provider_profile(
    data: ProviderProfileUpdate,
    current_user: User = Depends(require_role("PROVIDER", "ADMIN")),
    db: Session = Depends(get_db),
):
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise NotFoundException("Uzman profili")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return {"message": "Profil güncellendi", "profile": profile}


@router.get("/{provider_id}")
def get_provider_profile(provider_id: int, db: Session = Depends(get_db)):
    profile = (
        db.query(ProviderProfile)
        .options(
            joinedload(ProviderProfile.user),
            joinedload(ProviderProfile.services).joinedload(ProviderService.service),
            joinedload(ProviderProfile.locations).joinedload(ProviderLocation.city),
            joinedload(ProviderProfile.locations).joinedload(ProviderLocation.district),
        )
        .filter(ProviderProfile.id == provider_id)
        .first()
    )
    if not profile:
        raise NotFoundException("Uzman")

    return {
        "id": profile.id,
        "business_name": profile.business_name,
        "bio": profile.bio,
        "experience_years": profile.experience_years,
        "rating": profile.rating,
        "review_count": profile.review_count,
        "completed_jobs": profile.completed_jobs,
        "response_time_minutes": profile.response_time_minutes,
        "verification_status": profile.verification_status,
        "is_available": profile.is_available,
        "user": {
            "first_name": profile.user.first_name,
            "last_name": profile.user.last_name,
            "avatar": profile.user.avatar,
        },
        "services": [
            {
                "id": ps.id,
                "service_name": ps.service.name if ps.service else None,
                "description": ps.description,
                "starting_price": ps.starting_price,
                "pricing_type": ps.pricing_type,
            }
            for ps in profile.services
        ],
        "locations": [
            {
                "city": loc.city.name if loc.city else None,
                "district": loc.district.name if loc.district else None,
            }
            for loc in profile.locations
        ],
    }


@router.post("/services")
def add_provider_service(
    data: ProviderServiceCreate,
    current_user: User = Depends(require_role("PROVIDER", "ADMIN")),
    db: Session = Depends(get_db),
):
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise NotFoundException("Uzman profili")

    existing_service = db.query(ProviderService).filter(
        ProviderService.provider_id == profile.id,
        ProviderService.service_id == data.service_id,
    ).first()
    if existing_service:
        from app.core.exceptions import ConflictException
        raise ConflictException("Bu hizmeti zaten eklediniz")

    ps = ProviderService(provider_id=profile.id, **data.model_dump())
    db.add(ps)
    db.commit()
    return {"message": "Hizmet eklendi"}


@router.post("/portfolio")
def add_portfolio_item(
    data: PortfolioItemCreate,
    current_user: User = Depends(require_role("PROVIDER", "ADMIN")),
    db: Session = Depends(get_db),
):
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise NotFoundException("Uzman profili")

    current_count = db.query(PortfolioItem).filter(PortfolioItem.provider_id == profile.id).count()
    if current_count >= MAX_PORTFOLIO_ITEMS:
        raise BadRequestException(f"En fazla {MAX_PORTFOLIO_ITEMS} portfoy ogesi ekleyebilirsiniz")

    item = PortfolioItem(provider_id=profile.id, **data.model_dump())
    db.add(item)
    db.commit()
    return {"message": "Portfoy ogesi eklendi", "count": current_count + 1}


@router.post("/locations")
def add_provider_location(
    data: ProviderLocationCreate,
    current_user: User = Depends(require_role("PROVIDER", "ADMIN")),
    db: Session = Depends(get_db),
):
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise NotFoundException("Uzman profili")

    current_count = db.query(ProviderLocation).filter(ProviderLocation.provider_id == profile.id).count()
    if current_count >= MAX_LOCATIONS:
        raise BadRequestException(f"En fazla {MAX_LOCATIONS} konum ekleyebilirsiniz")

    loc = ProviderLocation(provider_id=profile.id, **data.model_dump())
    db.add(loc)
    db.commit()
    return {"message": "Konum eklendi", "count": current_count + 1}


@router.post("/availability")
def set_availability(
    data: AvailabilityCreate,
    current_user: User = Depends(require_role("PROVIDER", "ADMIN")),
    db: Session = Depends(get_db),
):
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise NotFoundException("Uzman profili")

    avail = ProviderAvailability(provider_id=profile.id, **data.model_dump())
    db.add(avail)
    db.commit()
    return {"message": "Müsaitlik eklendi"}


# ===== REPUTATION SCORE =====

@router.get("/{provider_id}/reputation")
def get_reputation_score(
    provider_id: int,
    db: Session = Depends(get_db),
):
    """Provider'ın reputation skorunu hesaplayarak döndürür."""
    from app.modules.providers.reputation import calculate_reputation_score
    provider = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not provider:
        raise NotFoundException("Uzman")
    return calculate_reputation_score(provider, db)


@router.get("/me/reputation")
def get_my_reputation_score(
    current_user: User = Depends(require_role("PROVIDER")),
    db: Session = Depends(get_db),
):
    """Oturum açmış provider'ın kendi reputation skorunu döndürür."""
    from app.modules.providers.reputation import calculate_reputation_score
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise NotFoundException("Uzman profili")
    return calculate_reputation_score(profile, db)


# ===== ANALYTICS =====

@router.get("/me/analytics")
def get_my_analytics(
    current_user: User = Depends(require_role("PROVIDER")),
    db: Session = Depends(get_db),
):
    """Provider'ın son 30 günlük analytics verilerini döndürür."""
    from app.modules.providers.analytics import get_provider_analytics
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise NotFoundException("Uzman profili")
    return get_provider_analytics(profile.id, current_user.id, db)


# ===== BADGES =====

@router.get("/{provider_id}/badges")
def get_provider_badges(
    provider_id: int,
    db: Session = Depends(get_db),
):
    """Provider'ın kazandığı rozetleri döndürür."""
    from app.modules.providers.badges import calculate_badges
    provider = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not provider:
        raise NotFoundException("Uzman")
    return {"badges": calculate_badges(provider, db)}


@router.get("/me/badges")
def get_my_badges(
    current_user: User = Depends(require_role("PROVIDER")),
    db: Session = Depends(get_db),
):
    """Oturum açmış provider'ın rozetlerini döndürür."""
    from app.modules.providers.badges import calculate_badges
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise NotFoundException("Uzman profili")
    return {"badges": calculate_badges(profile, db)}

