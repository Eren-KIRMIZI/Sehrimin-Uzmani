from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.requests.service import request_service

router = APIRouter(prefix="/requests", tags=["requests"])

class CreateFromAIBody(BaseModel):
    ai_payload: dict[str, Any]
    original_text: str

@router.post("/from-ai")
def create_from_ai(body: CreateFromAIBody, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
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
            "status": req.status
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
