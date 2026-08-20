from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.requests.repository import request_repo
from app.modules.requests.schemas import ServiceRequestCreate
from app.modules.requests.service import request_service

router = APIRouter(prefix="/requests", tags=["requests"])


class CreateFromAIBody(BaseModel):
    ai_payload: dict[str, Any]
    original_text: str


@router.post("/")
def create_request(
    body: ServiceRequestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.modules.requests.models import ServiceRequest

    req = ServiceRequest(
        customer_id=current_user.id,
        category_id=body.category_id,
        subcategory_id=body.subcategory_id,
        service_id=body.service_id,
        title=body.title,
        description=body.description,
        budget_min=body.budget_min,
        budget_max=body.budget_max,
        city_id=body.city_id,
        district_id=body.district_id,
        latitude=body.latitude,
        longitude=body.longitude,
        preferred_date=body.preferred_date,
        preferred_time=body.preferred_time,
        urgency=body.urgency,
        status="DRAFT",
    )
    db.add(req)
    db.flush()
    return {
        "id": req.id,
        "title": req.title,
        "status": req.status,
        "message": "Talep oluşturuldu",
    }


@router.get("/my")
def list_my_requests(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.shared.pagination import PaginatedResponse

    requests = request_repo.get_by_customer(db, current_user.id)
    result = [
        {
            "id": r.id,
            "title": r.title,
            "status": r.status,
            "created_at": str(r.created_at),
        }
        for r in requests
    ]
    return PaginatedResponse.create(items=result, total=len(result), page=1, limit=100)


@router.post("/from-ai")
def create_from_ai(
    body: CreateFromAIBody,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    AI tarafından doldurulmuş (is_complete: true) talep verisini sisteme kaydeder
    ve talebi otomatik yayınlayıp Eşleştirme Motorunu (Matching Engine) tetikler.
    """
    try:
        # Mock customer_id = 2
        customer_id = 2

        # 1. Talebi DRAFT olarak oluştur
        req = request_service.create_request_from_ai_payload(
            db, customer_id, body.ai_payload, body.original_text
        )

        # 2. Talebi yayınla ve eşleşmeyi başlat
        request_service.publish_request(db, req.id, background_tasks)

        return {
            "message": "Talep başarıyla oluşturuldu ve eşleştirme başlatıldı.",
            "request_id": req.id,
            "status": req.status,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
