from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user, require_role
from app.modules.commissions.models import (
    CommissionRate,
    PayoutRequest,
    ProviderEarning,
    Transaction,
)
from app.modules.users.models import User

router = APIRouter(prefix="/commissions", tags=["Komisyon Sistemi"])


@router.get("/rates")
def list_commission_rates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    rates = db.query(CommissionRate).filter(CommissionRate.is_active).all()
    return [
        {
            "id": r.id,
            "category_id": r.category_id,
            "category_name": r.category.name if r.category else "Genel",
            "rate": r.rate,
            "min_amount": r.min_amount,
            "description": r.description,
        }
        for r in rates
    ]


@router.post("/rates")
def create_commission_rate(
    category_id: Optional[int] = None,
    rate: float = 0.10,
    min_amount: Optional[float] = None,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    existing = db.query(CommissionRate).filter(
        CommissionRate.category_id == category_id,
        CommissionRate.is_active,
    ).first()
    if existing:
        existing.rate = rate
        existing.min_amount = min_amount
        existing.description = description
        db.commit()
        return {"message": "Komisyon orani guncellendi", "id": existing.id}

    r = CommissionRate(
        category_id=category_id,
        rate=rate,
        min_amount=min_amount,
        description=description,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return {"message": "Komisyon orani olusturuldu", "id": r.id}


@router.delete("/rates/{rate_id}")
def delete_commission_rate(
    rate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    rate = db.query(CommissionRate).filter(CommissionRate.id == rate_id).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Komisyon orani bulunamadi")
    rate.is_active = False
    db.commit()
    return {"message": "Komisyon orani silindi"}


@router.get("/transactions")
def list_transactions(
    status: Optional[str] = None,
    provider_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(Transaction)
    if current_user.role != "ADMIN":
        q = q.filter(Transaction.provider_id == current_user.id)
    elif provider_id:
        q = q.filter(Transaction.provider_id == provider_id)
    if status:
        q = q.filter(Transaction.status == status)
    total = q.count()
    items = q.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "total": total,
        "items": [
            {
                "id": t.id,
                "provider_id": t.provider_id,
                "provider_name": t.provider.full_name if t.provider else None,
                "appointment_id": t.appointment_id,
                "amount": t.amount,
                "commission_rate": t.commission_rate,
                "commission_amount": t.commission_amount,
                "provider_earning": t.provider_earning,
                "status": t.status,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "paid_at": t.paid_at.isoformat() if t.paid_at else None,
            }
            for t in items
        ],
    }


@router.get("/earnings")
def get_my_earnings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    earning = db.query(ProviderEarning).filter(
        ProviderEarning.provider_id == current_user.id
    ).first()
    if not earning:
        earning = ProviderEarning(provider_id=current_user.id, total_earned=0, total_commission_paid=0, pending_amount=0, paid_amount=0)
        db.add(earning)
        db.commit()
        db.refresh(earning)

    transactions = db.query(Transaction).filter(
        Transaction.provider_id == current_user.id,
        Transaction.status == "completed",
    ).all()

    return {
        "total_earned": earning.total_earned,
        "total_commission_paid": earning.total_commission_paid,
        "pending_amount": earning.pending_amount,
        "paid_amount": earning.paid_amount,
        "transaction_count": len(transactions),
    }


@router.get("/earnings/history")
def earnings_history(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(Transaction).filter(
        Transaction.provider_id == current_user.id,
        Transaction.status.in_(["completed", "paid"]),
    )
    total = q.count()
    items = q.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "total": total,
        "items": [
            {
                "id": t.id,
                "amount": t.amount,
                "commission_amount": t.commission_amount,
                "provider_earning": t.provider_earning,
                "description": t.description,
                "status": t.status,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in items
        ],
    }


@router.post("/payout/request")
def request_payout(
    amount: float,
    bank_name: Optional[str] = None,
    iban: Optional[str] = None,
    account_holder: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    earning = db.query(ProviderEarning).filter(
        ProviderEarning.provider_id == current_user.id
    ).with_for_update().first()
    if not earning or earning.pending_amount < amount:
        raise HTTPException(status_code=400, detail="Yetersiz bakiye")

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Gecersiz tutar")

    earning.pending_amount -= amount
    payout = PayoutRequest(
        provider_id=current_user.id,
        amount=amount,
        bank_name=bank_name,
    )
    payout.iban_decrypted = iban
    payout.account_holder_decrypted = account_holder
    db.add(payout)
    db.commit()
    db.refresh(payout)
    return {"message": "Odeme talebi olusturuldu", "id": payout.id}


@router.get("/payout/my")
def my_payout_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    items = db.query(PayoutRequest).filter(
        PayoutRequest.provider_id == current_user.id
    ).order_by(PayoutRequest.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "amount": p.amount,
            "bank_name": p.bank_name,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in items
    ]


@router.get("/payout/pending")
def pending_payouts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    items = db.query(PayoutRequest).filter(
        PayoutRequest.status == "pending"
    ).order_by(PayoutRequest.created_at.asc()).all()
    return [
        {
            "id": p.id,
            "provider_id": p.provider_id,
            "provider_name": p.provider.full_name if p.provider else None,
            "amount": p.amount,
            "bank_name": p.bank_name,
            "iban": p.iban_decrypted,
            "account_holder": p.account_holder_decrypted,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in items
    ]


@router.post("/payout/{payout_id}/approve")
def approve_payout(
    payout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    payout = db.query(PayoutRequest).filter(PayoutRequest.id == payout_id).with_for_update().first()
    if not payout:
        raise HTTPException(status_code=404, detail="Odeme talebi bulunamadi")
    if payout.status != "pending":
        raise HTTPException(status_code=400, detail="Bu talep zaten islenmis")

    payout.status = "approved"
    payout.processed_at = datetime.utcnow()

    earning = db.query(ProviderEarning).filter(
        ProviderEarning.provider_id == payout.provider_id
    ).with_for_update().first()
    if earning:
        earning.paid_amount += payout.amount

    db.commit()
    return {"message": "Odeme onaylandi"}


@router.post("/payout/{payout_id}/reject")
def reject_payout(
    payout_id: int,
    admin_note: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    payout = db.query(PayoutRequest).filter(PayoutRequest.id == payout_id).with_for_update().first()
    if not payout:
        raise HTTPException(status_code=404, detail="Odeme talebi bulunamadi")
    if payout.status != "pending":
        raise HTTPException(status_code=400, detail="Bu talep zaten islenmis")

    payout.status = "rejected"
    payout.admin_note = admin_note

    earning = db.query(ProviderEarning).filter(
        ProviderEarning.provider_id == payout.provider_id
    ).with_for_update().first()
    if earning:
        earning.pending_amount += payout.amount

    db.commit()
    return {"message": "Odeme reddedildi"}
