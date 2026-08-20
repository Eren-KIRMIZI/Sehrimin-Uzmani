from math import radians

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func as sql_func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.categories.models import (
    Category,
    ProviderService,
    Service,
    SubCategory,
)
from app.modules.locations.models import ProviderLocation
from app.modules.providers.models import ProviderProfile
from app.modules.users.models import User
from app.shared.pagination import PaginatedResponse, PaginationParams

router = APIRouter(prefix="/search", tags=["Search"])


def _haversine_sql(lat: float, lng: float):
    lat_rad = radians(lat)
    lng_rad = radians(lng)
    lat_col = sql_func.radians(ProviderLocation.latitude)
    lng_col = sql_func.radians(ProviderLocation.longitude)
    dlat = lat_col - lat_rad
    dlng = lng_col - lng_rad
    a = (
        sql_func.sin(dlat / 2) ** 2
        + sql_func.cos(lat_rad) * sql_func.cos(lat_col) * sql_func.sin(dlng / 2) ** 2
    )
    return 6371 * 2 * sql_func.atan2(sql_func.sqrt(a), sql_func.sqrt(1 - a))


@router.get("/providers")
def search_providers(
    q: str | None = None,
    category: str | None = None,
    subcategory: str | None = None,
    service: str | None = None,
    city_id: int | None = None,
    district_id: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_rating: float | None = None,
    verified: bool | None = None,
    available: bool | None = None,
    lat: float | None = None,
    lng: float | None = None,
    radius: float | None = 50.0,
    sort: str = "recommended",
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    pagination = PaginationParams(page, limit)

    need_location_join = bool(city_id or district_id or (lat and lng))

    if need_location_join:
        query = (
            db.query(ProviderProfile)
            .join(User, ProviderProfile.user_id == User.id)
            .join(ProviderLocation, ProviderLocation.provider_id == ProviderProfile.id)
            .filter(ProviderProfile.is_available, User.is_active)
        )
    else:
        query = (
            db.query(ProviderProfile)
            .join(User, ProviderProfile.user_id == User.id)
            .filter(ProviderProfile.is_available, User.is_active)
        )

    if city_id:
        query = query.filter(ProviderLocation.city_id == city_id)

    if district_id:
        query = query.filter(ProviderLocation.district_id == district_id)

    if lat and lng:
        distance_col = _haversine_sql(lat, lng).label("distance_km")
        query = query.filter(distance_col <= radius)
    else:
        distance_col = None

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
            service_ids = [
                s.id
                for s in db.query(Service)
                .filter(Service.subcategory_id == subcat.id)
                .all()
            ]
            ps_subq = (
                db.query(ProviderService.provider_id)
                .filter(ProviderService.service_id.in_(service_ids))
                .subquery()
            )
            query = query.filter(ProviderProfile.id.in_(ps_subq))

    if category:
        cat = db.query(Category).filter(Category.slug == category).first()
        if cat:
            subcat_ids = [
                sc.id
                for sc in db.query(SubCategory)
                .filter(SubCategory.category_id == cat.id)
                .all()
            ]
            service_ids = [
                s.id
                for s in db.query(Service)
                .filter(Service.subcategory_id.in_(subcat_ids))
                .all()
            ]
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
        # Full text search using tsvector
        search_query = sql_func.plainto_tsquery("turkish", q)
        vector = (
            sql_func.setweight(
                sql_func.to_tsvector(
                    "turkish", sql_func.coalesce(ProviderProfile.business_name, "")
                ),
                "A",
            )
            | sql_func.setweight(
                sql_func.to_tsvector(
                    "turkish", sql_func.coalesce(ProviderProfile.bio, "")
                ),
                "B",
            )
            | sql_func.setweight(
                sql_func.to_tsvector("turkish", sql_func.coalesce(User.first_name, "")),
                "C",
            )
            | sql_func.setweight(
                sql_func.to_tsvector("turkish", sql_func.coalesce(User.last_name, "")),
                "C",
            )
        )
        query = query.filter(vector.op("@@")(search_query))

        # Add rank column for ordering later if sort is recommended
        rank = sql_func.ts_rank(vector, search_query).label("search_rank")
        query = query.add_columns(rank)
    else:
        rank = None

    if need_location_join:
        query = query.group_by(ProviderProfile.id)

    total = query.count()

    if lat and lng and distance_col is not None:
        query = query.add_columns(distance_col)
        query = query.order_by(distance_col.asc())
    elif sort == "rating":
        query = query.order_by(ProviderProfile.rating.desc())
    elif sort == "reviews":
        query = query.order_by(ProviderProfile.review_count.desc())
    elif sort == "newest":
        query = query.order_by(ProviderProfile.created_at.desc())
    else:
        # recommended
        if rank is not None:
            # Order by search rank first, then rating
            query = query.order_by(rank.desc(), ProviderProfile.rating.desc())
        else:
            # Approximate reputation sorting natively
            # rating * 8 + verification priority
            from sqlalchemy import case

            verif_case = case(
                (ProviderProfile.verification_status == "BUSINESS", 15),
                (ProviderProfile.verification_status == "PROFESSIONAL", 12),
                (ProviderProfile.verification_status == "IDENTITY", 8),
                (ProviderProfile.verification_status == "BASIC", 5),
                else_=0,
            )
            rep_approx = (ProviderProfile.rating * 8) + verif_case
            query = query.order_by(
                rep_approx.desc(), ProviderProfile.review_count.desc()
            )

    rows = query.offset(pagination.offset).limit(pagination.limit).all()

    provider_ids = []
    distance_map = {}
    for row in rows:
        if lat and lng or q:
            # If we added distance_col or rank, row is a tuple
            profile = row[0]
            provider_ids.append(profile.id)
            if lat and lng:
                dist = row[-1]
                distance_map[profile.id] = round(float(dist), 2) if dist else None
        else:
            provider_ids.append(row.id)

    users_map = {}
    if provider_ids:
        users = db.query(User).filter(User.id.in_(provider_ids)).all()
        users_map = {u.id: u for u in users}

    locations_map = {}
    if provider_ids:
        locs = (
            db.query(ProviderLocation)
            .filter(ProviderLocation.provider_id.in_(provider_ids))
            .all()
        )
        for loc in locs:
            locations_map.setdefault(loc.provider_id, []).append(loc)

    services_map = {}
    if provider_ids:
        svcs = (
            db.query(ProviderService)
            .join(Service, ProviderService.service_id == Service.id)
            .filter(ProviderService.provider_id.in_(provider_ids))
            .all()
        )
        for s in svcs:
            services_map.setdefault(s.provider_id, []).append(s)

    result = []
    for row in rows:
        if lat and lng or q:
            p = row[0]
        else:
            p = row

        user = users_map.get(p.user_id)
        locs = locations_map.get(p.id, [])
        svcs = services_map.get(p.id, [])

        result.append(
            {
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
                    {
                        "name": s.service.name if s.service else None,
                        "starting_price": s.starting_price,
                    }
                    for s in svcs
                ],
                "locations": [
                    {
                        "city": loc.city.name if loc.city else None,
                        "district": loc.district.name if loc.district else None,
                    }
                    for loc in locs
                ],
                "distance_km": distance_map.get(p.id),
            }
        )

    return PaginatedResponse.create(
        items=result, total=total, page=pagination.page, limit=pagination.limit
    )


@router.get("/autocomplete")
def autocomplete(q: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    from app.core.cache import ref_cache

    search_term = f"%{q}%"

    cache_key_cats = f"cat_search:{q}"
    cached_cats = ref_cache.get(cache_key_cats)
    if cached_cats is not None:
        return cached_cats

    categories = (
        db.query(Category)
        .filter(Category.name.ilike(search_term), Category.is_active)
        .limit(5)
        .all()
    )
    subcategories = (
        db.query(SubCategory)
        .filter(SubCategory.name.ilike(search_term), SubCategory.is_active)
        .limit(5)
        .all()
    )
    services = (
        db.query(Service)
        .filter(Service.name.ilike(search_term), Service.is_active)
        .limit(5)
        .all()
    )

    results = []
    for c in categories:
        results.append(
            {"type": "category", "name": c.name, "slug": c.slug, "icon": c.icon}
        )
    for sc in subcategories:
        results.append(
            {"type": "subcategory", "name": sc.name, "slug": sc.slug, "icon": sc.icon}
        )
    for s in services:
        results.append({"type": "service", "name": s.name, "slug": s.slug})

    final = results[:10]
    ref_cache.set(cache_key_cats, final)
    return final


@router.post("/detect")
def detect_category_endpoint(
    query: str,
    db: Session = Depends(get_db),
):
    from app.modules.search.ai_detector import detect_category

    return detect_category(query, db)
