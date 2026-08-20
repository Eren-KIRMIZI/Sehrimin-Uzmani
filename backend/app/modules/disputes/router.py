from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user, require_role
from app.modules.commissions.models import ProviderEarning, Transaction
from app.modules.disputes.models import Dispute, DisputeEvidence, DisputeMessage
from app.modules.users.models import User

router = APIRouter(prefix="/disputes", tags=["Anlasmazlik Cozum Sistemi"])


@router.post("")
def create_dispute(
    reported_id: int,
    reason: str,
    description: str,
    appointment_id: Optional[int] = None,
    request_id: Optional[int] = None,
    amount_involved: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if reported_id == current_user.id:
        raise HTTPException(
            status_code=400, detail="Kendinize karsi anlasmazlik acamazsiniz"
        )

    dispute = Dispute(
        reporter_id=current_user.id,
        reported_id=reported_id,
        reason=reason,
        description=description,
        appointment_id=appointment_id,
        request_id=request_id,
        amount_involved=amount_involved,
    )
    db.add(dispute)
    db.commit()
    db.refresh(dispute)
    return {"message": "Anlasmazlik acildi", "id": dispute.id, "status": dispute.status}


@router.get("")
def list_my_disputes(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(Dispute).filter(
        (Dispute.reporter_id == current_user.id)
        | (Dispute.reported_id == current_user.id)
    )
    if status:
        q = q.filter(Dispute.status == status)
    total = q.count()
    items = q.order_by(Dispute.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "total": total,
        "items": [
            {
                "id": d.id,
                "reason": d.reason,
                "description": d.description,
                "status": d.status,
                "priority": d.priority,
                "reporter_name": d.reporter.full_name if d.reporter else None,
                "reported_name": d.reported.full_name if d.reported else None,
                "amount_involved": d.amount_involved,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in items
        ],
    }


@router.get("/admin/all")
def admin_list_disputes(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "MODERATOR"])),
):
    q = db.query(Dispute)
    if status:
        q = q.filter(Dispute.status == status)
    if priority:
        q = q.filter(Dispute.priority == priority)
    total = q.count()
    items = q.order_by(Dispute.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "total": total,
        "items": [
            {
                "id": d.id,
                "reason": d.reason,
                "description": d.description[:100] + "..."
                if len(d.description) > 100
                else d.description,
                "status": d.status,
                "priority": d.priority,
                "reporter_name": d.reporter.full_name if d.reporter else None,
                "reported_name": d.reported.full_name if d.reported else None,
                "amount_involved": d.amount_involved,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in items
        ],
    }


@router.get("/{dispute_id}")
def get_dispute(
    dispute_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Anlasmazlik bulunamadi")

    is_participant = (
        dispute.reporter_id == current_user.id or dispute.reported_id == current_user.id
    )
    is_admin = current_user.role in ["ADMIN", "MODERATOR"]
    if not is_participant and not is_admin:
        raise HTTPException(status_code=403, detail="Yetkiniz yok")

    messages = (
        db.query(DisputeMessage)
        .filter(DisputeMessage.dispute_id == dispute_id)
        .order_by(DisputeMessage.created_at.asc())
        .all()
    )

    evidence = (
        db.query(DisputeEvidence).filter(DisputeEvidence.dispute_id == dispute_id).all()
    )

    return {
        "id": dispute.id,
        "reason": dispute.reason,
        "description": dispute.description,
        "status": dispute.status,
        "priority": dispute.priority,
        "amount_involved": dispute.amount_involved,
        "resolution": dispute.resolution,
        "reporter_name": dispute.reporter.full_name if dispute.reporter else None,
        "reported_name": dispute.reported.full_name if dispute.reported else None,
        "created_at": dispute.created_at.isoformat() if dispute.created_at else None,
        "messages": [
            {
                "id": m.id,
                "sender_name": m.sender.full_name if m.sender else None,
                "message": m.message,
                "is_admin": m.is_admin,
                "attachment_url": m.attachment_url,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ],
        "evidence": [
            {
                "id": e.id,
                "file_url": e.file_url,
                "description": e.description,
                "uploader_name": e.uploader.full_name if e.uploader else None,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in evidence
        ],
    }


@router.post("/{dispute_id}/messages")
def add_dispute_message(
    dispute_id: int,
    message: str,
    attachment_url: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Anlasmazlik bulunamadi")

    is_participant = (
        dispute.reporter_id == current_user.id or dispute.reported_id == current_user.id
    )
    is_admin = current_user.role in ["ADMIN", "MODERATOR"]
    if not is_participant and not is_admin:
        raise HTTPException(status_code=403, detail="Yetkiniz yok")

    msg = DisputeMessage(
        dispute_id=dispute_id,
        sender_id=current_user.id,
        message=message,
        is_admin=is_admin,
        attachment_url=attachment_url,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"message": "Mesaj eklendi", "id": msg.id}


@router.post("/{dispute_id}/evidence")
def add_evidence(
    dispute_id: int,
    file_url: str,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Anlasmazlik bulunamadi")

    is_participant = (
        dispute.reporter_id == current_user.id or dispute.reported_id == current_user.id
    )
    is_admin = current_user.role in ["ADMIN", "MODERATOR"]
    if not is_participant and not is_admin:
        raise HTTPException(status_code=403, detail="Yetkiniz yok")

    ev = DisputeEvidence(
        dispute_id=dispute_id,
        uploaded_by=current_user.id,
        file_url=file_url,
        description=description,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return {"message": "Kanit eklendi", "id": ev.id}


@router.post("/{dispute_id}/resolve")
def resolve_dispute(
    dispute_id: int,
    resolution: str,
    refund_amount: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "MODERATOR"])),
):
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Anlasmazlik bulunamadi")
    if dispute.status in ("resolved", "closed"):
        raise HTTPException(
            status_code=400, detail="Bu anlasmazlik zaten cozulmus/kapatilmis"
        )

    dispute.status = "resolved"
    dispute.resolution = resolution
    dispute.resolved_by = current_user.id
    dispute.resolved_at = datetime.utcnow()

    refund_created = False
    if refund_amount and refund_amount > 0 and dispute.amount_involved:
        if refund_amount > dispute.amount_involved:
            raise HTTPException(
                status_code=400, detail="Iade tutari ilgili tutardan fazla olamaz"
            )

        if dispute.appointment_id:
            transaction = (
                db.query(Transaction)
                .filter(
                    Transaction.appointment_id == dispute.appointment_id,
                    Transaction.status == "completed",
                )
                .first()
            )

            if transaction:
                refund_commission = round(
                    refund_amount * transaction.commission_rate, 2
                )

                refund_txn = Transaction(
                    provider_id=transaction.provider_id,
                    appointment_id=dispute.appointment_id,
                    amount=-refund_amount,
                    commission_rate=transaction.commission_rate,
                    commission_amount=-refund_commission,
                    provider_earning=-(refund_amount - refund_commission),
                    status="refunded",
                    description=f"Anlasmazlik #{dispute.id} icin iade",
                )
                db.add(refund_txn)

                earning = (
                    db.query(ProviderEarning)
                    .filter(ProviderEarning.provider_id == transaction.provider_id)
                    .first()
                )
                if earning:
                    earning.total_earned = max(
                        0, earning.total_earned - (refund_amount - refund_commission)
                    )
                    earning.total_commission_paid = max(
                        0, earning.total_commission_paid - refund_commission
                    )
                    earning.pending_amount = max(
                        0, earning.pending_amount - (refund_amount - refund_commission)
                    )

                refund_created = True

    db.commit()
    return {
        "message": "Anlasmazlik cozuldu",
        "refund_created": refund_created,
        "refund_amount": refund_amount if refund_created else 0,
    }


@router.post("/{dispute_id}/close")
def close_dispute(
    dispute_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Anlasmazlik bulunamadi")

    is_participant = (
        dispute.reporter_id == current_user.id or dispute.reported_id == current_user.id
    )
    if not is_participant:
        raise HTTPException(status_code=403, detail="Yetkiniz yok")

    dispute.status = "closed"
    db.commit()
    return {"message": "Anlasmazlik kapatildi"}


@router.post("/{dispute_id}/priority")
def set_dispute_priority(
    dispute_id: int,
    priority: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Anlasmazlik bulunamadi")
    dispute.priority = priority
    db.commit()
    return {"message": "Oncelik guncellendi"}


@router.get("/stats/summary")
def dispute_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    total = db.query(Dispute).count()
    open_count = db.query(Dispute).filter(Dispute.status == "open").count()
    under_review = db.query(Dispute).filter(Dispute.status == "under_review").count()
    resolved = db.query(Dispute).filter(Dispute.status == "resolved").count()
    escalated = db.query(Dispute).filter(Dispute.status == "escalated").count()
    return {
        "total": total,
        "open": open_count,
        "under_review": under_review,
        "resolved": resolved,
        "escalated": escalated,
    }
