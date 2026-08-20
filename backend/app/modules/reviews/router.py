from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.modules.reviews.repository import review_repo
from app.modules.reviews.service import review_service

router = APIRouter(prefix="/reviews", tags=["reviews"])


class CreateReviewBody(BaseModel):
    request_id: int
    provider_id: int
    rating: float = Field(..., ge=1.0, le=5.0)
    comment: str | None = None
    communication_rating: float | None = Field(None, ge=1.0, le=5.0)
    quality_rating: float | None = Field(None, ge=1.0, le=5.0)
    price_rating: float | None = Field(None, ge=1.0, le=5.0)
    punctuality_rating: float | None = Field(None, ge=1.0, le=5.0)


class ProviderReplyBody(BaseModel):
    reply: str


@router.post("/")
def create_review(
    body: CreateReviewBody,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Müşteri tamamlanan hizmet için değerlendirme yapar"""
    try:
        customer_id = 2  # Mock — auth middleware ile değiştirilecek
        review = review_service.create_review(
            db=db,
            request_id=body.request_id,
            customer_id=customer_id,
            provider_id=body.provider_id,
            rating=body.rating,
            comment=body.comment,
            communication_rating=body.communication_rating,
            quality_rating=body.quality_rating,
            price_rating=body.price_rating,
            punctuality_rating=body.punctuality_rating,
            background_tasks=background_tasks,
        )
        return {
            "id": review.id,
            "rating": review.rating,
            "message": "Değerlendirme kaydedildi",
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/provider/{provider_id}")
def list_provider_reviews(
    provider_id: int, skip: int = 0, limit: int = 20, db: Session = Depends(get_db)
):
    """Bir uzmanın tüm değerlendirmelerini listeler"""
    reviews = review_repo.get_by_provider(db, provider_id, skip, limit)
    return [
        {
            "id": r.id,
            "rating": r.rating,
            "comment": r.comment,
            "provider_reply": r.provider_reply,
            "created_at": str(r.created_at),
        }
        for r in reviews
    ]


@router.post("/{review_id}/reply")
def provider_reply(
    review_id: int,
    body: ProviderReplyBody,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("PROVIDER")),
):
    """Uzman değerlendirmeye cevap verir"""
    try:
        review = review_service.add_provider_reply(
            db, review_id, body.reply, current_user.id
        )
        return {"message": "Cevap eklendi", "reply": review.provider_reply}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
