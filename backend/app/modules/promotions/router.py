from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_active_user, require_role
from app.core.rate_limiter import rate_limiter, get_client_ip
from app.modules.users.models import User
from app.modules.promotions.models import PromotedProvider, PromotionLog
from app.modules.categories.models import Category

router = APIRouter(prefix="/promotions", tags=["Promoted Provider"])


@router.post("")
def create_promotion(
    category_id: int,
    budget: float,
    daily_budget: float = None,
    bid_amount: float = 1.0,
    duration_days: int = 7,
    is_featured: bool = False,
    badge_text: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    existing = db.query(PromotedProvider).filter(
        PromotedProvider.provider_id == current_user.id,
        PromotedProvider.category_id == category_id,
        PromotedProvider.status == "active",
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu kategoride zaten aktif tanitiminz var")

    if budget < 10:
        raise HTTPException(status_code=400, detail="Minimum butce 10 TL olmalidir")
    if bid_amount < 0.1:
        raise HTTPException(status_code=400, detail="Minimum teklif 0.1 TL olmalidir")

    promotion = PromotedProvider(
        provider_id=current_user.id,
        category_id=category_id,
        budget=budget,
        daily_budget=daily_budget or budget / duration_days,
        bid_amount=bid_amount,
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=duration_days),
        is_featured=is_featured,
        badge_text=badge_text,
        priority_boost=1.0 + (bid_amount * 0.1),
    )
    db.add(promotion)
    db.commit()
    db.refresh(promotion)
    return {"message": "Tanitim baslatildi", "id": promotion.id, "priority_boost": promotion.priority_boost}


@router.get("/my")
def my_promotions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    items = db.query(PromotedProvider).filter(
        PromotedProvider.provider_id == current_user.id
    ).order_by(PromotedProvider.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "category_id": p.category_id,
            "category_name": p.category.name if p.category else None,
            "budget": p.budget,
            "spent": p.spent,
            "daily_budget": p.daily_budget,
            "bid_amount": p.bid_amount,
            "status": p.status,
            "impressions": p.impressions,
            "clicks": p.clicks,
            "conversions": p.conversions,
            "priority_boost": p.priority_boost,
            "is_featured": p.is_featured,
            "badge_text": p.badge_text,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "end_date": p.end_date.isoformat() if p.end_date else None,
            "ctr": (p.clicks / p.impressions * 100) if p.impressions > 0 else 0,
        }
        for p in items
    ]


@router.get("/featured")
def get_featured_providers(
    category_id: int = None,
    city_id: int = None,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    q = db.query(PromotedProvider).filter(
        PromotedProvider.status == "active",
        PromotedProvider.is_featured == True,
        PromotedProvider.end_date > now,
    )
    if category_id:
        q = q.filter(PromotedProvider.category_id == category_id)

    promotions = q.order_by(PromotedProvider.priority_boost.desc()).limit(limit).all()

    return [
        {
            "id": p.id,
            "provider_id": p.provider_id,
            "provider_name": p.provider.full_name if p.provider else None,
            "category_name": p.category.name if p.category else None,
            "badge_text": p.badge_text,
            "priority_boost": p.priority_boost,
            "bid_amount": p.bid_amount,
        }
        for p in promotions
    ]


@router.get("/leaderboard")
def promotion_leaderboard(
    category_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    q = db.query(PromotedProvider).filter(PromotedProvider.status == "active")
    if category_id:
        q = q.filter(PromotedProvider.category_id == category_id)

    items = q.order_by(PromotedProvider.priority_boost.desc()).limit(50).all()
    return [
        {
            "id": p.id,
            "provider_id": p.provider_id,
            "provider_name": p.provider.full_name if p.provider else None,
            "category_name": p.category.name if p.category else None,
            "budget": p.budget,
            "spent": p.spent,
            "impressions": p.impressions,
            "clicks": p.clicks,
            "priority_boost": p.priority_boost,
            "bid_amount": p.bid_amount,
            "ctr": (p.clicks / p.impressions * 100) if p.impressions > 0 else 0,
        }
        for p in items
    ]


@router.post("/{promotion_id}/pause")
def pause_promotion(
    promotion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    promo = db.query(PromotedProvider).filter(PromotedProvider.id == promotion_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Tanitim bulunamadi")
    if promo.provider_id != current_user.id:
        raise HTTPException(status_code=403, detail="Yetkiniz yok")
    promo.status = "paused"
    db.commit()
    return {"message": "Tanitim duraklatildi"}


@router.post("/{promotion_id}/resume")
def resume_promotion(
    promotion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    promo = db.query(PromotedProvider).filter(PromotedProvider.id == promotion_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Tanitim bulunamadi")
    if promo.provider_id != current_user.id:
        raise HTTPException(status_code=403, detail="Yetkiniz yok")
    promo.status = "active"
    db.commit()
    return {"message": "Tanitim devam ettirildi"}


@router.post("/{promotion_id}/cancel")
def cancel_promotion(
    promotion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    promo = db.query(PromotedProvider).filter(PromotedProvider.id == promotion_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Tanitim bulunamadi")
    if promo.provider_id != current_user.id:
        raise HTTPException(status_code=403, detail="Yetkiniz yok")
    promo.status = "cancelled"
    db.commit()
    return {"message": "Tanitim iptal edildi"}


@router.post("/{promotion_id}/bid")
def update_bid(
    promotion_id: int,
    bid_amount: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    promo = db.query(PromotedProvider).filter(PromotedProvider.id == promotion_id).with_for_update().first()
    if not promo:
        raise HTTPException(status_code=404, detail="Tanitim bulunamadi")
    if promo.provider_id != current_user.id:
        raise HTTPException(status_code=403, detail="Yetkiniz yok")
    if bid_amount < 0.1:
        raise HTTPException(status_code=400, detail="Minimum teklif 0.1 TL olmalidir")
    promo.bid_amount = bid_amount
    promo.priority_boost = 1.0 + (bid_amount * 0.1)
    db.commit()
    return {"message": "Teklif guncellendi", "priority_boost": promo.priority_boost}


@router.post("/{promotion_id}/impression")
def record_impression(
    promotion_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = get_client_ip(request)
    rate_limiter.check(f"promo_imp:{ip}", max_requests=60, window_seconds=300)

    promo = db.query(PromotedProvider).filter(PromotedProvider.id == promotion_id).with_for_update().first()
    if not promo or promo.status != "active":
        return {"recorded": False}

    promo.impressions += 1
    cost_per_impression = 0.01
    promo.spent = round(promo.spent + cost_per_impression, 2)

    log = PromotionLog(
        promoted_id=promo.id,
        event_type="impression",
        budget_spent=cost_per_impression,
        impressions=1,
    )
    db.add(log)

    if promo.spent >= promo.budget:
        promo.status = "expired"

    db.commit()
    return {"recorded": True, "impressions": promo.impressions, "spent": promo.spent}


@router.post("/{promotion_id}/click")
def record_click(
    promotion_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = get_client_ip(request)
    rate_limiter.check(f"promo_click:{ip}", max_requests=20, window_seconds=300)

    promo = db.query(PromotedProvider).filter(PromotedProvider.id == promotion_id).with_for_update().first()
    if not promo or promo.status != "active":
        return {"recorded": False}

    promo.clicks += 1
    cost_per_click = promo.bid_amount * 0.1
    promo.spent = round(promo.spent + cost_per_click, 2)

    log = PromotionLog(
        promoted_id=promo.id,
        event_type="click",
        budget_spent=cost_per_click,
        clicks=1,
    )
    db.add(log)

    if promo.spent >= promo.budget:
        promo.status = "expired"

    db.commit()
    return {"recorded": True, "clicks": promo.clicks, "spent": promo.spent}
