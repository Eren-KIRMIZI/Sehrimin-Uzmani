from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.users.models import User
from app.modules.requests.models import ServiceRequest, RequestFile
from app.modules.requests.schemas import ServiceRequestCreate, ServiceRequestUpdate
from app.core.exceptions import NotFoundException, ForbiddenException
from app.shared.pagination import PaginationParams, PaginatedResponse
from typing import Optional

router = APIRouter(prefix="/requests", tags=["Service Requests"])


@router.post("")
def create_request(
    data: ServiceRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request = ServiceRequest(customer_id=current_user.id, **data.model_dump())
    db.add(request)
    db.commit()
    db.refresh(request)
    return {"message": "Talep oluşturuldu", "request": request}


@router.get("")
def list_my_requests(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pagination = PaginationParams(page, limit)
    query = db.query(ServiceRequest).filter(ServiceRequest.customer_id == current_user.id)

    if status:
        query = query.filter(ServiceRequest.status == status)

    total = query.count()
    requests = query.order_by(ServiceRequest.created_at.desc()).offset(pagination.offset).limit(pagination.limit).all()

    return PaginatedResponse.create(
        items=[
            {
                "id": r.id,
                "title": r.title,
                "description": r.description,
                "budget_min": r.budget_min,
                "budget_max": r.budget_max,
                "city_id": r.city_id,
                "district_id": r.district_id,
                "preferred_date": r.preferred_date,
                "urgency": r.urgency,
                "status": r.status,
                "created_at": r.created_at,
            }
            for r in requests
        ],
        total=total,
        page=pagination.page,
        limit=pagination.limit,
    )


@router.get("/{request_id}")
def get_request(request_id: int, db: Session = Depends(get_db)):
    request = (
        db.query(ServiceRequest)
        .options(
            joinedload(ServiceRequest.customer),
            joinedload(ServiceRequest.city),
            joinedload(ServiceRequest.district),
            joinedload(ServiceRequest.category),
            joinedload(ServiceRequest.subcategory),
            joinedload(ServiceRequest.service),
        )
        .filter(ServiceRequest.id == request_id)
        .first()
    )
    if not request:
        raise NotFoundException("Talep")

    files = db.query(RequestFile).filter(RequestFile.request_id == request_id).all()

    return {
        "id": request.id,
        "title": request.title,
        "description": request.description,
        "budget_min": request.budget_min,
        "budget_max": request.budget_max,
        "urgency": request.urgency,
        "status": request.status,
        "preferred_date": request.preferred_date,
        "preferred_time": request.preferred_time,
        "created_at": request.created_at,
        "customer": {
            "id": request.customer.id,
            "first_name": request.customer.first_name,
            "last_name": request.customer.last_name,
            "avatar": request.customer.avatar,
        } if request.customer else None,
        "city": {"id": request.city.id, "name": request.city.name} if request.city else None,
        "district": {"id": request.district.id, "name": request.district.name} if request.district else None,
        "category": {"id": request.category.id, "name": request.category.name} if request.category else None,
        "subcategory": {"id": request.subcategory.id, "name": request.subcategory.name} if request.subcategory else None,
        "service": {"id": request.service.id, "name": request.service.name} if request.service else None,
        "files": [{"id": f.id, "url": f.file_url, "type": f.file_type} for f in files],
    }


@router.patch("/{request_id}")
def update_request(
    request_id: int,
    data: ServiceRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not request:
        raise NotFoundException("Talep")
    if request.customer_id != current_user.id:
        raise ForbiddenException("Bu talebi düzenleme yetkiniz yok")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(request, field, value)
    db.commit()
    db.refresh(request)
    return {"message": "Talep güncellendi", "request": request}


@router.delete("/{request_id}")
def delete_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not request:
        raise NotFoundException("Talep")
    if request.customer_id != current_user.id:
        raise ForbiddenException("Bu talebi silme yetkiniz yok")

    db.delete(request)
    db.commit()
    return {"message": "Talep silindi"}
