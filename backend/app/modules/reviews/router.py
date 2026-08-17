from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.users.models import User
from app.modules.providers.models import ProviderProfile
from app.modules.reviews.models import Review
from app.modules.requests.models import ServiceRequest
from app.modules.reviews.schemas import ReviewCreate
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("")
def create_review(
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request = db.query(ServiceRequest).filter(ServiceRequest.id == data.request_id).first()
    if not request:
        raise NotFoundException("Talep")
    if request.customer_id != current_user.id:
        raise ForbiddenException("Bu hizmeti değerlendirme yetkiniz yok")
    if request.status != "COMPLETED":
        raise BadRequestException("Sadece tamamlanan hizmetler değerlendirilebilir")

    existing = db.query(Review).filter(
        Review.request_id == data.request_id, Review.customer_id == current_user.id
    ).first()
    if existing:
        from app.core.exceptions import ConflictException
        raise ConflictException("Bu hizmeti zaten değerlendirdiniz")

    review = Review(customer_id=current_user.id, **data.model_dump())
    db.add(review)

    provider = db.query(ProviderProfile).filter(ProviderProfile.id == data.provider_id).first()
    if provider:
        avg_rating = db.query(sql_func.avg(Review.rating)).filter(
            Review.provider_id == data.provider_id, Review.status == "ACTIVE"
        ).scalar() or 0
        review_count = db.query(sql_func.count(Review.id)).filter(
            Review.provider_id == data.provider_id, Review.status == "ACTIVE"
        ).scalar() or 0

        provider.rating = round(float(avg_rating), 1)
        provider.review_count = review_count

    db.commit()
    db.refresh(review)
    return {"message": "Değerlendirme yapıldı", "review": review}


@router.get("/provider/{provider_id}")
def list_provider_reviews(provider_id: int, db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .filter(Review.provider_id == provider_id, Review.status == "ACTIVE")
        .order_by(Review.created_at.desc())
        .all()
    )

    return [
        {
            "id": r.id,
            "rating": r.rating,
            "communication_rating": r.communication_rating,
            "quality_rating": r.quality_rating,
            "price_rating": r.price_rating,
            "punctuality_rating": r.punctuality_rating,
            "comment": r.comment,
            "created_at": r.created_at,
            "customer": {
                "first_name": r.customer.first_name if r.customer else None,
                "last_name": r.customer.last_name if r.customer else None,
                "avatar": r.customer.avatar if r.customer else None,
            },
        }
        for r in reviews
    ]
