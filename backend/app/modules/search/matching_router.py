from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.modules.users.models import User

router = APIRouter(prefix="/matching", tags=["AI Eslestirme"])


@router.post("/find")
def find_matching_providers(
    service_id: int = None,
    category_id: int = None,
    subcategory_id: int = None,
    city_id: int = None,
    district_id: int = None,
    budget: float = None,
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
    city_id: int = None,
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
    recent = db.query(Appointment).filter(
        Appointment.customer_id == current_user.id,
    ).order_by(Appointment.created_at.desc()).limit(5).all()

    service_ids = set()
    category_ids = set()
    for appt in recent:
        if appt.service_id:
            service_ids.add(appt.service_id)
        if appt.category_id:
            category_ids.add(appt.category_id)

    results = []
    seen = set()
    for sid in service_ids:
        matches = matcher.find_best_matches(service_id=sid, limit=3)
        for m in matches:
            if m["provider_id"] not in seen:
                results.append(m)
                seen.add(m["provider_id"])

    for cid in category_ids:
        matches = matcher.find_best_matches(category_id=cid, limit=3)
        for m in matches:
            if m["provider_id"] not in seen:
                results.append(m)
                seen.add(m["provider_id"])

    if not results:
        results = matcher.find_best_matches(limit=limit)

    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results[:limit]
