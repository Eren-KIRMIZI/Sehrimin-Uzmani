from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.modules.users.models import User
from app.modules.providers.models import ProviderProfile
from app.modules.quotes.models import Quote
from app.modules.requests.models import ServiceRequest
from app.modules.quotes.schemas import QuoteCreate
from app.core.exceptions import NotFoundException, ForbiddenException

router = APIRouter(prefix="/quotes", tags=["Quotes"])


@router.post("/requests/{request_id}")
def create_quote(
    request_id: int,
    data: QuoteCreate,
    current_user: User = Depends(require_role("PROVIDER", "ADMIN")),
    db: Session = Depends(get_db),
):
    request = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not request:
        raise NotFoundException("Talep")
    if request.status not in ("PUBLISHED", "MATCHING", "QUOTING"):
        from app.core.exceptions import BadRequestException
        raise BadRequestException("Bu talebe artık teklif gönderilemez")

    provider = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not provider:
        raise NotFoundException("Uzman profili")

    existing = db.query(Quote).filter(Quote.request_id == request_id, Quote.provider_id == provider.id).first()
    if existing:
        from app.core.exceptions import ConflictException
        raise ConflictException("Bu talebe zaten teklif gönderdiniz")

    quote = Quote(request_id=request_id, provider_id=provider.id, **data.model_dump())
    db.add(quote)

    if request.status == "PUBLISHED":
        request.status = "QUOTING"

    db.commit()
    db.refresh(quote)
    return {"message": "Teklif gönderildi", "quote": quote}


@router.get("/requests/{request_id}")
def list_quotes_for_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not request:
        raise NotFoundException("Talep")
    if request.customer_id != current_user.id:
        raise ForbiddenException("Bu talebin tekliflerini görme yetkiniz yok")

    quotes = (
        db.query(Quote)
        .options(
            joinedload(Quote.provider).joinedload(ProviderProfile.user),
        )
        .filter(Quote.request_id == request_id)
        .order_by(Quote.created_at.desc())
        .all()
    )

    return [
        {
            "id": q.id,
            "price": q.price,
            "estimated_duration": q.estimated_duration,
            "description": q.description,
            "materials": q.materials,
            "available_date": q.available_date,
            "warranty_info": q.warranty_info,
            "status": q.status,
            "created_at": q.created_at,
            "provider": {
                "id": q.provider.id,
                "business_name": q.provider.business_name,
                "rating": q.provider.rating,
                "review_count": q.provider.review_count,
                "verification_status": q.provider.verification_status,
                "user": {
                    "first_name": q.provider.user.first_name if q.provider.user else None,
                    "last_name": q.provider.user.last_name if q.provider.user else None,
                    "avatar": q.provider.user.avatar if q.provider.user else None,
                },
            } if q.provider else None,
        }
        for q in quotes
    ]


@router.post("/{quote_id}/accept")
def accept_quote(
    quote_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise NotFoundException("Teklif")

    if quote.status != "PENDING":
        from app.core.exceptions import BadRequestException
        raise BadRequestException("Sadece bekleyen teklifler kabul edilebilir")

    request = db.query(ServiceRequest).filter(ServiceRequest.id == quote.request_id).first()
    if not request or request.customer_id != current_user.id:
        raise ForbiddenException("Bu teklifi onaylama yetkiniz yok")

    quote.status = "ACCEPTED"
    request.status = "ACCEPTED"

    db.query(Quote).filter(
        Quote.request_id == quote.request_id, Quote.id != quote_id
    ).update({"status": "REJECTED"})

    db.commit()
    return {"message": "Teklif kabul edildi"}


@router.post("/{quote_id}/reject")
def reject_quote(
    quote_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise NotFoundException("Teklif")

    request = db.query(ServiceRequest).filter(ServiceRequest.id == quote.request_id).first()
    if not request or request.customer_id != current_user.id:
        raise ForbiddenException("Bu teklifi reddetme yetkiniz yok")

    quote.status = "REJECTED"
    db.commit()
    return {"message": "Teklif reddedildi"}


@router.get("/my")
def list_my_quotes(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(require_role("PROVIDER", "ADMIN")),
    db: Session = Depends(get_db),
):
    limit = min(max(1, limit), 50)
    offset = (max(1, page) - 1) * limit

    provider = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not provider:
        raise NotFoundException("Uzman profili")

    q = db.query(Quote).filter(Quote.provider_id == provider.id)
    total = q.count()
    quotes = (
        q.order_by(Quote.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return {
        "items": [
            {
                "id": q.id,
                "request_id": q.request_id,
                "price": q.price,
                "status": q.status,
                "created_at": q.created_at,
            }
            for q in quotes
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }
