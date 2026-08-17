from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sql_func
from app.core.database import get_db
from app.modules.providers.models import ProviderProfile
from app.modules.locations.models import ProviderLocation
from app.modules.categories.models import ProviderService, Service, SubCategory, Category
from app.modules.users.models import User
from app.shared.pagination import PaginationParams, PaginatedResponse
from app.shared.utils import haversine
from typing import Optional

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/providers")
def search_providers(
    q: Optional[str] = None,
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    service: Optional[str] = None,
    city_id: Optional[int] = None,
    district_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    verified: Optional[bool] = None,
    available: Optional[bool] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: Optional[float] = 50.0,
    sort: str = "recommended",
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    pagination = PaginationParams(page, limit)

    query = (
        db.query(ProviderProfile)
        .join(User, ProviderProfile.user_id == User.id)
        .filter(ProviderProfile.is_available == True, User.is_active == True)
    )

    if city_id:
        location_subq = (
            db.query(ProviderLocation.provider_id)
            .filter(ProviderLocation.city_id == city_id)
            .subquery()
        )
        query = query.filter(ProviderProfile.id.in_(location_subq))

    if district_id:
        location_subq = (
            db.query(ProviderLocation.provider_id)
            .filter(ProviderLocation.district_id == district_id)
            .subquery()
        )
        query = query.filter(ProviderProfile.id.in_(location_subq))

    if service:
        service_subq = (
            db.query(ProviderService.provider_id)
            .join(Service, ProviderService.service_id == Service.id)
            .filter(Service.slug == service)
            .subquery()
        )
        query = query.filter(ProviderProfile.id.in_(service_subq))

    if subcategory:
        subcat = db.query(SubCategory).filter(SubCategory.slug == subcategory).first()
        if subcat:
            service_ids = [s.id for s in db.query(Service).filter(Service.subcategory_id == subcat.id).all()]
            ps_subq = (
                db.query(ProviderService.provider_id)
                .filter(ProviderService.service_id.in_(service_ids))
                .subquery()
            )
            query = query.filter(ProviderProfile.id.in_(ps_subq))

    if category:
        cat = db.query(Category).filter(Category.slug == category).first()
        if cat:
            subcat_ids = [sc.id for sc in db.query(SubCategory).filter(SubCategory.category_id == cat.id).all()]
            service_ids = [s.id for s in db.query(Service).filter(Service.subcategory_id.in_(subcat_ids)).all()]
            ps_subq = (
                db.query(ProviderService.provider_id)
                .filter(ProviderService.service_id.in_(service_ids))
                .subquery()
            )
            query = query.filter(ProviderProfile.id.in_(ps_subq))

    if min_rating:
        query = query.filter(ProviderProfile.rating >= min_rating)

    if verified:
        query = query.filter(ProviderProfile.verification_status != "NONE")

    if q:
        search_term = f"%{q}%"
        query = query.filter(
            (ProviderProfile.business_name.ilike(search_term)) |
            (ProviderProfile.bio.ilike(search_term)) |
            (User.first_name.ilike(search_term)) |
            (User.last_name.ilike(search_term))
        )

    total = query.count()

    if sort == "rating":
        query = query.order_by(ProviderProfile.rating.desc())
    elif sort == "reviews":
        query = query.order_by(ProviderProfile.review_count.desc())
    elif sort == "newest":
        query = query.order_by(ProviderProfile.created_at.desc())
    else:
        query = query.order_by(ProviderProfile.rating.desc(), ProviderProfile.review_count.desc())

    providers = query.offset(pagination.offset).limit(pagination.limit).all()

    result = []
    for p in providers:
        user = db.query(User).filter(User.id == p.user_id).first()
        locations = db.query(ProviderLocation).filter(ProviderLocation.provider_id == p.id).all()
        services = (
            db.query(ProviderService)
            .join(Service, ProviderService.service_id == Service.id)
            .filter(ProviderService.provider_id == p.id)
            .all()
        )

        dist_km = None
        if lat and lng and p.latitude and p.longitude:
            dist_km = haversine(lat, lng, p.latitude, p.longitude)

        result.append({
            "id": p.id,
            "business_name": p.business_name,
            "rating": p.rating,
            "review_count": p.review_count,
            "completed_jobs": p.completed_jobs,
            "response_time_minutes": p.response_time_minutes,
            "verification_status": p.verification_status,
            "user": {
                "first_name": user.first_name if user else None,
                "last_name": user.last_name if user else None,
                "avatar": user.avatar if user else None,
            },
            "services": [
                {"name": s.service.name if s.service else None, "starting_price": s.starting_price}
                for s in services
            ],
            "locations": [
                {"city": loc.city.name if loc.city else None, "district": loc.district.name if loc.district else None}
                for loc in locations
            ],
            "distance_km": dist_km,
        })

    return PaginatedResponse.create(items=result, total=total, page=pagination.page, limit=pagination.limit)


@router.get("/autocomplete")
def autocomplete(q: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    search_term = f"%{q}%"

    categories = db.query(Category).filter(Category.name.ilike(search_term), Category.is_active == True).limit(5).all()
    subcategories = db.query(SubCategory).filter(SubCategory.name.ilike(search_term), SubCategory.is_active == True).limit(5).all()
    services = db.query(Service).filter(Service.name.ilike(search_term), Service.is_active == True).limit(5).all()

    results = []
    for c in categories:
        results.append({"type": "category", "name": c.name, "slug": c.slug, "icon": c.icon})
    for sc in subcategories:
        results.append({"type": "subcategory", "name": sc.name, "slug": sc.slug, "icon": sc.icon})
    for s in services:
        results.append({"type": "service", "name": s.name, "slug": s.slug})

    return results[:10]
