from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.modules.users.models import User

router = APIRouter(prefix="/matching", tags=["AI Eslestirme"])


@router.post("/find")
def find_matching_providers(
    service_id: Optional[int] = None,
    category_id: Optional[int] = None,
    subcategory_id: Optional[int] = None,
    city_id: Optional[int] = None,
    district_id: Optional[int] = None,
    budget: Optional[float] = None,
    limit: int = 10,
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    from app.modules.search.matcher import ProviderMatcher

    matcher = ProviderMatcher(db)
    results = matcher.find_best_matches(
        service_id=service_id,
        category_id=category_id,
        subcategory_id=subcategory_id,
        city_id=city_id,
        district_id=district_id,
        budget=budget,
        limit=limit,
        offset=skip,
    )
    return {
        "total": len(results),
        "providers": results,
    }


@router.post("/ai")
def ai_matching(
    query: str,
    city_id: Optional[int] = None,
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    from app.modules.search.matcher import get_ai_matching_suggestions

    return get_ai_matching_suggestions(query, db, city_id=city_id, limit=limit)


@router.get("/recommendations")
def get_recommendations(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    from app.modules.search.matcher import ProviderMatcher

    matcher = ProviderMatcher(db)
    from app.modules.appointments.models import Appointment

    recent = (
        db.query(Appointment)
        .filter(
            Appointment.customer_id == current_user.id,
        )
        .order_by(Appointment.created_at.desc())
        .limit(5)
        .all()
    )

    service_ids = set()
    category_ids = set()
    for appt in recent:
        # service_id ve category_id Appointment'ta değil, ServiceRequest'te bulunur
        req = appt.request  # lazy-load relationship
        if req:
            if req.service_id:
                service_ids.add(req.service_id)
            if req.category_id:
                category_ids.add(req.category_id)

    all_matches = []
    seen = set()

    if service_ids:
        for sid in service_ids:
            matches = matcher.find_best_matches(service_id=sid, limit=3)
            for m in matches:
                if m["provider_id"] not in seen:
                    all_matches.append(m)
                    seen.add(m["provider_id"])

    if category_ids:
        for cid in category_ids:
            matches = matcher.find_best_matches(category_id=cid, limit=3)
            for m in matches:
                if m["provider_id"] not in seen:
                    all_matches.append(m)
                    seen.add(m["provider_id"])

    if not all_matches:
        all_matches = matcher.find_best_matches(limit=limit)

    all_matches.sort(key=lambda x: x["match_score"], reverse=True)
    return all_matches[:limit]
