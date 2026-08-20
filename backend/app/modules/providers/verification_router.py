from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
)
from app.core.security import require_role
from app.modules.admin.verification_model import VerificationRequest
from app.modules.providers.models import ProviderProfile
from app.modules.providers.verification_schemas import VerificationApply
from app.modules.users.models import User

router = APIRouter(prefix="/verification", tags=["Verification"])


@router.post("/apply")
def apply_verification(
    data: VerificationApply,
    current_user: User = Depends(require_role("PROVIDER", "ADMIN")),
    db: Session = Depends(get_db),
):
    provider = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not provider:
        raise NotFoundException("Uzman profili")

    valid_types = ["IDENTITY", "PROFESSIONAL", "BUSINESS"]
    if data.verification_type not in valid_types:
        raise BadRequestException(f"Gecersiz dogrulama tipi. Gecerli tipler: {', '.join(valid_types)}")

    existing = db.query(VerificationRequest).filter(
        VerificationRequest.provider_id == provider.id,
        VerificationRequest.verification_type == data.verification_type,
        VerificationRequest.status == "PENDING",
    ).first()
    if existing:
        raise ConflictException("Bu turde zaten bekleyen bir dogrulama talebiniz var")

    vr = VerificationRequest(
        provider_id=provider.id,
        verification_type=data.verification_type,
        document_url=data.document_url,
        status="PENDING",
    )
    db.add(vr)
    db.commit()
    db.refresh(vr)
    return {"message": "Dogrulama talebi olusturuldu", "request": vr}


@router.get("/my")
def my_verifications(
    current_user: User = Depends(require_role("PROVIDER", "ADMIN")),
    db: Session = Depends(get_db),
):
    provider = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not provider:
        raise NotFoundException("Uzman profili")

    verifications = (
        db.query(VerificationRequest)
        .filter(VerificationRequest.provider_id == provider.id)
        .order_by(VerificationRequest.created_at.desc())
        .all()
    )
    return [
        {
            "id": v.id,
            "verification_type": v.verification_type,
            "status": v.status,
            "admin_note": v.admin_note,
            "created_at": v.created_at,
            "reviewed_at": v.reviewed_at,
        }
        for v in verifications
    ]


@router.get("/pending")
def pending_verifications(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    verifications = (
        db.query(VerificationRequest)
        .filter(VerificationRequest.status == "PENDING")
        .order_by(VerificationRequest.created_at.desc())
        .all()
    )
    return [
        {
            "id": v.id,
            "provider_id": v.provider_id,
            "verification_type": v.verification_type,
            "document_url": v.document_url,
            "status": v.status,
            "created_at": v.created_at,
        }
        for v in verifications
    ]


@router.post("/{verification_id}/approve")
def approve_verification(
    verification_id: int,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    vr = db.query(VerificationRequest).filter(VerificationRequest.id == verification_id).first()
    if not vr:
        raise NotFoundException("Dogrulama talebi")
    if vr.status != "PENDING":
        raise BadRequestException("Bu talep zaten islenmis")

    vr.status = "APPROVED"
    vr.reviewed_by = current_user.id
    vr.reviewed_at = datetime.utcnow()

    provider = db.query(ProviderProfile).filter(ProviderProfile.id == vr.provider_id).first()
    if provider:
        hierarchy = {"IDENTITY": 1, "PROFESSIONAL": 2, "BUSINESS": 3}
        current_level = hierarchy.get(provider.verification_status, 0)
        new_level = hierarchy.get(vr.verification_type, 0)
        if new_level > current_level:
            provider.verification_status = vr.verification_type

    db.commit()
    return {"message": "Dogrulama onaylandi"}


@router.post("/{verification_id}/reject")
def reject_verification(
    verification_id: int,
    admin_note: str = "",
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    vr = db.query(VerificationRequest).filter(VerificationRequest.id == verification_id).first()
    if not vr:
        raise NotFoundException("Dogrulama talebi")
    if vr.status != "PENDING":
        raise BadRequestException("Bu talep zaten islenmis")

    vr.status = "REJECTED"
    vr.admin_note = admin_note
    vr.reviewed_by = current_user.id
    vr.reviewed_at = datetime.utcnow()

    db.commit()
    return {"message": "Dogrulama reddedildi"}
