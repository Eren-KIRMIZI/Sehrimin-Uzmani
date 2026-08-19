from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from app.core.database import get_db
from app.core.security import require_role
from app.modules.users.models import User
from app.modules.providers.models import ProviderProfile
from app.modules.requests.models import ServiceRequest
from app.modules.quotes.models import Quote
from app.modules.reviews.models import Review
from app.modules.categories.models import Category
from app.modules.locations.models import City
from app.modules.admin.audit_model import AuditLog
from app.modules.disputes.models import Dispute
from app.modules.commissions.models import ProviderEarning, PayoutRequest
from app.modules.subscriptions.models import ProviderSubscription
from app.shared.pagination import PaginationParams, PaginatedResponse
from typing import Optional


router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard")
def admin_dashboard(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    total_users = db.query(sql_func.count(User.id)).scalar()
    total_providers = db.query(sql_func.count(ProviderProfile.id)).scalar()
    active_requests = db.query(sql_func.count(ServiceRequest.id)).filter(
        ServiceRequest.status.in_(["PUBLISHED", "MATCHING", "QUOTING"])
    ).scalar()
    completed_jobs = db.query(sql_func.count(ServiceRequest.id)).filter(
        ServiceRequest.status == "COMPLETED"
    ).scalar()
    total_categories = db.query(sql_func.count(Category.id)).scalar()
    total_cities = db.query(sql_func.count(City.id)).scalar()

    return {
        "total_users": total_users,
        "total_providers": total_providers,
        "active_requests": active_requests,
        "completed_jobs": completed_jobs,
        "total_categories": total_categories,
        "total_cities": total_cities,
    }


@router.get("/users")
def list_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    pagination = PaginationParams(page, limit)
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)
    if search:
        term = f"%{search}%"
        query = query.filter(
            (User.first_name.ilike(term)) | (User.last_name.ilike(term)) | (User.email.ilike(term))
        )

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(pagination.offset).limit(pagination.limit).all()

    return PaginatedResponse.create(
        items=[
            {
                "id": u.id,
                "email": u.email,
                "phone": u.phone,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at,
            }
            for u in users
        ],
        total=total,
        page=pagination.page,
        limit=pagination.limit,
    )


@router.patch("/users/{user_id}")
def update_user(
    user_id: int,
    is_active: bool = None,
    role: str = None,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Kullanıcı")

    if is_active is not None:
        user.is_active = is_active
    if role is not None:
        user.role = role
    db.commit()

    return {"message": "Kullanıcı güncellendi"}


@router.get("/providers")
def list_providers(
    verification_status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    pagination = PaginationParams(page, limit)
    query = db.query(ProviderProfile).join(User, ProviderProfile.user_id == User.id)

    if verification_status:
        query = query.filter(ProviderProfile.verification_status == verification_status)
    if search:
        term = f"%{search}%"
        query = query.filter(
            (ProviderProfile.business_name.ilike(term)) |
            (User.first_name.ilike(term)) |
            (User.last_name.ilike(term))
        )

    total = query.count()
    providers = query.order_by(ProviderProfile.created_at.desc()).offset(pagination.offset).limit(pagination.limit).all()

    return PaginatedResponse.create(
        items=[
            {
                "id": p.id,
                "business_name": p.business_name,
                "rating": p.rating,
                "review_count": p.review_count,
                "verification_status": p.verification_status,
                "is_available": p.is_available,
                "user": {
                    "first_name": p.user.first_name if p.user else None,
                    "last_name": p.user.last_name if p.user else None,
                    "email": p.user.email if p.user else None,
                },
                "created_at": p.created_at,
            }
            for p in providers
        ],
        total=total,
        page=pagination.page,
        limit=pagination.limit,
    )


@router.patch("/providers/{provider_id}/verify")
def verify_provider(
    provider_id: int,
    verification_status: str,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    provider = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not provider:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Uzman")

    provider.verification_status = verification_status
    db.commit()
    return {"message": f"Doğrulama durumu güncellendi: {verification_status}"}


@router.get("/requests")
def list_all_requests(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    pagination = PaginationParams(page, limit)
    query = db.query(ServiceRequest)

    if status:
        query = query.filter(ServiceRequest.status == status)

    total = query.count()
    requests = query.order_by(ServiceRequest.created_at.desc()).offset(pagination.offset).limit(pagination.limit).all()

    return PaginatedResponse.create(
        items=[
            {
                "id": r.id,
                "title": r.title,
                "status": r.status,
                "urgency": r.urgency,
                "customer_id": r.customer_id,
                "created_at": r.created_at,
            }
            for r in requests
        ],
        total=total,
        page=pagination.page,
        limit=pagination.limit,
    )


@router.get("/reviews")
def list_all_reviews(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    pagination = PaginationParams(page, limit)
    query = db.query(Review)
    total = query.count()
    reviews = query.order_by(Review.created_at.desc()).offset(pagination.offset).limit(pagination.limit).all()

    return PaginatedResponse.create(
        items=[
            {
                "id": r.id,
                "rating": r.rating,
                "comment": r.comment,
                "status": r.status,
                "customer_id": r.customer_id,
                "provider_id": r.provider_id,
                "created_at": r.created_at,
            }
            for r in reviews
        ],
        total=total,
        page=pagination.page,
        limit=pagination.limit,
    )


@router.get("/audit-logs")
def list_audit_logs(
    page: int = 1,
    limit: int = 50,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    pagination = PaginationParams(page, limit)
    query = db.query(AuditLog)
    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset(pagination.offset).limit(pagination.limit).all()

    return PaginatedResponse.create(
        items=[
            {
                "id": l.id,
                "user_id": l.user_id,
                "action": l.action,
                "entity": l.entity,
                "entity_id": l.entity_id,
                "ip_address": l.ip_address,
                "created_at": l.created_at,
            }
            for l in logs
        ],
        total=total,
        page=pagination.page,
        limit=pagination.limit,
    )


@router.get("/payouts")
def list_payout_requests(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    pagination = PaginationParams(page, limit)
    query = db.query(PayoutRequest)
    
    if status:
        query = query.filter(PayoutRequest.status == status)

    total = query.count()
    payouts = query.order_by(PayoutRequest.created_at.desc()).offset(pagination.offset).limit(pagination.limit).all()

    return PaginatedResponse.create(
        items=[
            {
                "id": p.id,
                "provider_id": p.provider_id,
                "amount": p.amount,
                "bank_name": p.bank_name,
                "status": p.status,
                "created_at": p.created_at,
            }
            for p in payouts
        ],
        total=total,
        page=pagination.page,
        limit=pagination.limit,
    )


@router.get("/disputes")
def list_disputes(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    pagination = PaginationParams(page, limit)
    query = db.query(Dispute)

    if status:
        query = query.filter(Dispute.status == status)

    total = query.count()
    disputes = query.order_by(Dispute.created_at.desc()).offset(pagination.offset).limit(pagination.limit).all()

    return PaginatedResponse.create(
        items=[
            {
                "id": d.id,
                "reporter_id": d.reporter_id,
                "reported_id": d.reported_id,
                "reason": d.reason,
                "status": d.status,
                "priority": d.priority,
                "created_at": d.created_at,
            }
            for d in disputes
        ],
        total=total,
        page=pagination.page,
        limit=pagination.limit,
    )


@router.get("/users/{user_id}/fraud-risk")
def get_user_fraud_risk(
    user_id: int,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    from app.modules.admin.fraud import calculate_risk_score
    return calculate_risk_score(user_id, db)
