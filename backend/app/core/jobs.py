import logging
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def check_expired_subscriptions():
    from app.core.database import SessionLocal
    from app.modules.subscriptions.models import ProviderSubscription
    from app.modules.users.models import User

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        expired = db.query(ProviderSubscription).filter(
            ProviderSubscription.status == "active",
            ProviderSubscription.expires_at < now,
        ).all()

        for sub in expired:
            sub.status = "expired"
            user = db.query(User).filter(User.id == sub.provider_id).first()
            if user:
                user.subscription_plan = None
                user.commission_discount = 0.0
            logger.info("Abonelik sureasi doldu: provider_id=%s", sub.provider_id)

        if expired:
            db.commit()
            logger.info("Suresi dolan abonelik sayisi: %d", len(expired))
    except Exception as e:
        logger.error("Abonelik sure kontrolu hatasi: %s", str(e))
        db.rollback()
    finally:
        db.close()


def check_expired_promotions():
    from app.core.database import SessionLocal
    from app.modules.promotions.models import PromotedProvider

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        expired = db.query(PromotedProvider).filter(
            PromotedProvider.status == "active",
            PromotedProvider.end_date < now,
        ).all()

        for promo in expired:
            promo.status = "expired"
            logger.info("Promosyon sureasi doldu: promotion_id=%s", promo.id)

        if expired:
            db.commit()
            logger.info("Suresi dolan promosyon sayisi: %d", len(expired))
    except Exception as e:
        logger.error("Promosyon sure kontrolu hatasi: %s", str(e))
        db.rollback()
    finally:
        db.close()


def reset_daily_promotion_budgets():
    from app.core.database import SessionLocal
    from app.modules.promotions.models import PromotedProvider

    db = SessionLocal()
    try:
        reset_count = db.query(PromotedProvider).filter(
            PromotedProvider.status == "active",
        ).update({"daily_spent": 0.0})
        if reset_count:
            db.commit()
            gunluk_sifirlanan = reset_count
            logger.info("Gunluk butce sifirlandi: %d promosyon", gunluk_sifirlanan)
    except Exception as e:
        logger.error("Gunluk butce sifirlama hatasi: %s", str(e))
        db.rollback()
    finally:
        db.close()


def start_scheduler():
    if scheduler.running:
        return

    scheduler.add_job(
        check_expired_subscriptions,
        trigger=IntervalTrigger(minutes=15),
        id="check_subscriptions",
        replace_existing=True,
    )

    scheduler.add_job(
        check_expired_promotions,
        trigger=IntervalTrigger(minutes=30),
        id="check_promotions",
        replace_existing=True,
    )

    scheduler.add_job(
        reset_daily_promotion_budgets,
        trigger=IntervalTrigger(hours=24),
        id="reset_daily_budgets",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("Background job scheduler baslatildi")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Background job scheduler durduruldu")
