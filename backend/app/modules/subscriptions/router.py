from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user, require_role
from app.modules.subscriptions.models import (
    PlanFeature,
    ProviderSubscription,
    SubscriptionPayment,
    SubscriptionPlan,
)
from app.modules.users.models import User

router = APIRouter(prefix="/subscriptions", tags=["Abonelik Modelleri"])


@router.get("/plans")
def list_plans(
    db: Session = Depends(get_db),
):
    plans = (
        db.query(SubscriptionPlan)
        .filter(SubscriptionPlan.is_active)
        .order_by(SubscriptionPlan.sort_order.asc())
        .all()
    )
    return [
        {
            "id": p.id,
            "name": p.name,
            "slug": p.slug,
            "description": p.description,
            "price_monthly": p.price_monthly,
            "price_quarterly": p.price_quarterly,
            "price_yearly": p.price_yearly,
            "commission_discount": p.commission_discount,
            "featured_listings": p.featured_listings,
            "priority_support": p.priority_support,
            "advanced_analytics": p.advanced_analytics,
            "highlighted_profile": p.highlighted_profile,
            "badge_type": p.badge_type,
            "max_portfolio_images": p.max_portfolio_images,
            "max_services": p.max_services,
            "features": [
                {
                    "name": f.feature_name,
                    "value": f.feature_value,
                    "included": f.is_included,
                }
                for f in sorted(p.features, key=lambda x: x.sort_order)
            ],
        }
        for p in plans
    ]


@router.post("/plans")
def create_plan(
    name: str,
    slug: str,
    price_monthly: float,
    description: Optional[str] = None,
    price_quarterly: Optional[float] = None,
    price_yearly: Optional[float] = None,
    commission_discount: float = 0.0,
    featured_listings: int = 0,
    priority_support: bool = False,
    advanced_analytics: bool = False,
    highlighted_profile: bool = False,
    badge_type: Optional[str] = None,
    max_portfolio_images: int = 10,
    max_services: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    existing = db.query(SubscriptionPlan).filter(SubscriptionPlan.slug == slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Plan slug'i zaten mevcut")

    plan = SubscriptionPlan(
        name=name,
        slug=slug,
        description=description,
        price_monthly=price_monthly,
        price_quarterly=price_quarterly,
        price_yearly=price_yearly,
        commission_discount=commission_discount,
        featured_listings=featured_listings,
        priority_support=priority_support,
        advanced_analytics=advanced_analytics,
        highlighted_profile=highlighted_profile,
        badge_type=badge_type,
        max_portfolio_images=max_portfolio_images,
        max_services=max_services,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return {"message": "Plan olusturuldu", "id": plan.id}


@router.put("/plans/{plan_id}")
def update_plan(
    plan_id: int,
    name: Optional[str] = None,
    price_monthly: Optional[float] = None,
    price_quarterly: Optional[float] = None,
    price_yearly: Optional[float] = None,
    commission_discount: Optional[float] = None,
    featured_listings: Optional[int] = None,
    priority_support: Optional[bool] = None,
    advanced_analytics: Optional[bool] = None,
    highlighted_profile: Optional[bool] = None,
    badge_type: Optional[str] = None,
    max_portfolio_images: Optional[int] = None,
    max_services: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan bulunamadi")

    for field, value in [
        ("name", name),
        ("price_monthly", price_monthly),
        ("price_quarterly", price_quarterly),
        ("price_yearly", price_yearly),
        ("commission_discount", commission_discount),
        ("featured_listings", featured_listings),
        ("priority_support", priority_support),
        ("advanced_analytics", advanced_analytics),
        ("highlighted_profile", highlighted_profile),
        ("badge_type", badge_type),
        ("max_portfolio_images", max_portfolio_images),
        ("max_services", max_services),
    ]:
        if value is not None:
            setattr(plan, field, value)

    db.commit()
    return {"message": "Plan guncellendi"}


@router.post("/plans/{plan_id}/features")
def add_plan_feature(
    plan_id: int,
    feature_name: str,
    feature_value: Optional[str] = None,
    is_included: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan bulunamadi")

    feature = PlanFeature(
        plan_id=plan_id,
        feature_name=feature_name,
        feature_value=feature_value,
        is_included=is_included,
    )
    db.add(feature)
    db.commit()
    db.refresh(feature)
    return {"message": "Ozellik eklendi", "id": feature.id}


@router.post("/subscribe")
def subscribe_to_plan(
    plan_id: int,
    interval: str = "monthly",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan bulunamadi")

    existing = (
        db.query(ProviderSubscription)
        .filter(
            ProviderSubscription.provider_id == current_user.id,
            ProviderSubscription.status == "active",
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Zaten aktif aboneliginiz var")

    if interval == "monthly":
        price = plan.price_monthly
        expires = datetime.utcnow() + timedelta(days=30)
    elif interval == "quarterly":
        price = plan.price_quarterly or plan.price_monthly * 3
        expires = datetime.utcnow() + timedelta(days=90)
    else:
        price = plan.price_yearly or plan.price_monthly * 12
        expires = datetime.utcnow() + timedelta(days=365)

    sub = ProviderSubscription(
        provider_id=current_user.id,
        plan_id=plan_id,
        interval=interval,
        status="active",
        expires_at=expires,
    )
    db.add(sub)
    db.flush()

    payment = SubscriptionPayment(
        subscription_id=sub.id,
        amount=price,
        status="completed",
    )
    db.add(payment)

    current_user.subscription_plan = plan.slug
    current_user.commission_discount = plan.commission_discount
    db.commit()
    db.refresh(sub)
    return {
        "message": "Abonelik baslatildi",
        "subscription_id": sub.id,
        "expires_at": expires.isoformat(),
    }


@router.get("/my")
def my_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    sub = (
        db.query(ProviderSubscription)
        .filter(
            ProviderSubscription.provider_id == current_user.id,
            ProviderSubscription.status == "active",
        )
        .first()
    )
    if not sub:
        return None

    return {
        "id": sub.id,
        "plan_name": sub.plan.name if sub.plan else None,
        "interval": sub.interval,
        "status": sub.status,
        "started_at": sub.started_at.isoformat() if sub.started_at else None,
        "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
        "auto_renew": sub.auto_renew,
        "commission_discount": sub.plan.commission_discount if sub.plan else 0,
    }


@router.post("/cancel")
def cancel_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    sub = (
        db.query(ProviderSubscription)
        .filter(
            ProviderSubscription.provider_id == current_user.id,
            ProviderSubscription.status == "active",
        )
        .first()
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Aktif abonelik bulunamadi")

    sub.status = "cancelled"
    sub.cancelled_at = datetime.utcnow()
    sub.auto_renew = False
    current_user.subscription_plan = None
    current_user.commission_discount = 0.0
    db.commit()
    return {"message": "Abonelik iptal edildi"}


@router.get("/payments")
def my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    subs = (
        db.query(ProviderSubscription)
        .filter(
            ProviderSubscription.provider_id == current_user.id,
        )
        .all()
    )
    sub_ids = [s.id for s in subs]
    payments = (
        db.query(SubscriptionPayment)
        .filter(SubscriptionPayment.subscription_id.in_(sub_ids))
        .order_by(SubscriptionPayment.created_at.desc())
        .all()
    )
    return [
        {
            "id": p.id,
            "amount": p.amount,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in payments
    ]


@router.get("/admin/all")
def admin_list_subscriptions(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    q = db.query(ProviderSubscription)
    if status:
        q = q.filter(ProviderSubscription.status == status)
    total = q.count()
    items = (
        q.order_by(ProviderSubscription.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {
        "total": total,
        "items": [
            {
                "id": s.id,
                "provider_id": s.provider_id,
                "provider_name": s.provider.full_name if s.provider else None,
                "plan_name": s.plan.name if s.plan else None,
                "interval": s.interval,
                "status": s.status,
                "expires_at": s.expires_at.isoformat() if s.expires_at else None,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in items
        ],
    }
