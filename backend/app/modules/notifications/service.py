"""
Notification servisi — EventBus ile entegre, WebSocket push destekli.

Dinlenen event'ler:
  REQUEST_PUBLISHED     → Eşleştirilen uzmanlara bildirim
  REQUEST_MATCHED       → Müşteriye "Uzmanlar bulundu" bildirimi
  QUOTE_CREATED         → Müşteriye "Yeni teklif var" bildirimi
  QUOTE_ACCEPTED        → Uzmana "Teklifin kabul edildi" bildirimi
  APPOINTMENT_CONFIRMED → Müşteriye "Randevu onaylandı" bildirimi
  APPOINTMENT_COMPLETED → Müşteriye "Hizmet tamamlandı" bildirimi
  REVIEW_CREATED        → Uzmana "Yeni değerlendirme" bildirimi
"""

import asyncio
import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.events.bus import event_bus
from app.modules.notifications.models import Notification
from app.websocket.manager import manager

logger = logging.getLogger(__name__)


# ── Core Helper ────────────────────────────────────────────────────────────────
def send_realtime_notification_sync(user_id: int, notification_data: dict):
    """Sync context'ten async WebSocket push gönderir."""
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.send_personal_notification(user_id, notification_data))
    except RuntimeError:
        pass  # Event loop yok, sadece DB kaydı yeter
    except Exception as e:
        logger.error(f"WebSocket push hatası: {e}")


def create_notification(
    db: Session,
    user_id: int,
    type_str: str,
    title: str,
    message: str,
    data: Optional[dict] = None,
    action_url: Optional[str] = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        type=type_str,
        title=title,
        message=message,
        data=str(data) if data else None,
        action_url=action_url,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    payload = {
        "id": notif.id,
        "type": notif.type,
        "title": notif.title,
        "message": notif.message,
        "action_url": notif.action_url,
        "is_read": notif.is_read,
        "created_at": str(notif.created_at),
    }
    send_realtime_notification_sync(user_id, payload)
    return notif


# ── Event Listeners ────────────────────────────────────────────────────────────

def _on_request_matched(payload: dict):
    """Müşteriye: 'Talebiniz için uzmanlar bulundu' bildirimi."""
    db = SessionLocal()
    try:
        from app.modules.requests.repository import request_repo
        req = request_repo.get(db, payload.get("request_id"))
        if req:
            create_notification(
                db=db,
                user_id=req.customer_id,
                type_str="REQUEST_MATCHED",
                title="Uzmanlar Bulundu! 🎉",
                message=f"Talebiniz için {payload.get('matches_count', 'birkaç')} uzman eşleştirildi. Teklifleri bekliyorsunuz.",
                action_url=f"/requests/{req.id}",
            )
    except Exception as e:
        logger.error(f"REQUEST_MATCHED bildirimi hatası: {e}")
    finally:
        db.close()


def _on_quote_created(payload: dict):
    """Müşteriye: 'Yeni teklif var' bildirimi."""
    db = SessionLocal()
    try:
        from app.modules.quotes.repository import quote_repo
        quote = quote_repo.get(db, payload.get("quote_id"))
        if quote and quote.request:
            create_notification(
                db=db,
                user_id=quote.request.customer_id,
                type_str="QUOTE_CREATED",
                title="Yeni Teklif Aldınız! 💼",
                message=f"Talebinize ₺{quote.total_price:.0f} tutarında yeni bir teklif geldi.",
                action_url=f"/requests/{quote.request_id}",
            )
    except Exception as e:
        logger.error(f"QUOTE_CREATED bildirimi hatası: {e}")
    finally:
        db.close()


def _on_quote_accepted(payload: dict):
    """Uzmana: 'Teklifin kabul edildi' bildirimi."""
    db = SessionLocal()
    try:
        from app.modules.providers.models import ProviderProfile
        from app.modules.quotes.repository import quote_repo
        quote = quote_repo.get(db, payload.get("quote_id"))
        if quote:
            provider = db.query(ProviderProfile).filter_by(id=quote.provider_id).first()
            if provider:
                create_notification(
                    db=db,
                    user_id=provider.user_id,
                    type_str="QUOTE_ACCEPTED",
                    title="Teklifiniz Kabul Edildi! ✅",
                    message="Müşteri teklifinizi kabul etti. Randevu detaylarını kontrol edin.",
                    action_url="/appointments",
                )
    except Exception as e:
        logger.error(f"QUOTE_ACCEPTED bildirimi hatası: {e}")
    finally:
        db.close()


def _on_appointment_confirmed(payload: dict):
    """Müşteriye: 'Randevu onaylandı' bildirimi."""
    db = SessionLocal()
    try:
        from app.modules.appointments.repository import appointment_repo
        appt = appointment_repo.get(db, payload.get("appointment_id"))
        if appt:
            create_notification(
                db=db,
                user_id=appt.customer_id,
                type_str="APPOINTMENT_CONFIRMED",
                title="Randevunuz Onaylandı 📅",
                message=f"Uzmanınız randevuyu onayladı. Randevu tarihi: {appt.start_at}",
                action_url=f"/appointments/{appt.id}",
            )
    except Exception as e:
        logger.error(f"APPOINTMENT_CONFIRMED bildirimi hatası: {e}")
    finally:
        db.close()


def _on_appointment_completed(payload: dict):
    """Uzmana: 'Müşteri değerlendirme bekliyor' bildirimi (uzman tarafı)."""
    db = SessionLocal()
    try:
        from app.modules.appointments.repository import appointment_repo
        from app.modules.providers.models import ProviderProfile
        appt = appointment_repo.get(db, payload.get("appointment_id"))
        if appt:
            provider = db.query(ProviderProfile).filter_by(id=appt.provider_id).first()
            if provider:
                create_notification(
                    db=db,
                    user_id=provider.user_id,
                    type_str="JOB_COMPLETED",
                    title="İş Tamamlandı! 🎊",
                    message="Harika! İş tamamlandı. Müşteri değerlendirmesini takip edin.",
                    action_url=f"/appointments/{appt.id}",
                )
    except Exception as e:
        logger.error(f"APPOINTMENT_COMPLETED bildirimi hatası: {e}")
    finally:
        db.close()


def _on_review_created(payload: dict):
    """Uzmana: 'Yeni değerlendirme aldınız' bildirimi."""
    db = SessionLocal()
    try:
        from app.modules.providers.models import ProviderProfile
        provider = db.query(ProviderProfile).filter_by(id=payload.get("provider_id")).first()
        if provider:
            rating = payload.get("rating", 0.0)
            create_notification(
                db=db,
                user_id=provider.user_id,
                type_str="REVIEW_RECEIVED",
                title="Yeni Değerlendirme Aldınız ⭐",
                message=f"Müşteriniz size {rating}/5.0 puan verdi.",
                action_url="/reviews",
            )
    except Exception as e:
        logger.error(f"REVIEW_CREATED bildirimi hatası: {e}")
    finally:
        db.close()


# ── Kayıtlar ──────────────────────────────────────────────────────────────────
event_bus.subscribe("REQUEST_MATCHED",        _on_request_matched)
event_bus.subscribe("QUOTE_CREATED",          _on_quote_created)
event_bus.subscribe("QUOTE_ACCEPTED",         _on_quote_accepted)
event_bus.subscribe("APPOINTMENT_CONFIRMED",  _on_appointment_confirmed)
event_bus.subscribe("APPOINTMENT_COMPLETED",  _on_appointment_completed)
event_bus.subscribe("REVIEW_CREATED",         _on_review_created)
