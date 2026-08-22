"""
Komisyon Otomasyon Servisi
==========================
APPOINTMENT_COMPLETED event'ini dinler; randevu tamamlandığında otomatik olarak:
  1. CommissionRate tablosundan kategori bazlı (yoksa genel) oran alır.
  2. Transaction kaydı oluşturur.
  3. ProviderEarning toplamını günceller (upsert mantığı).

Bu dosyayı app/main.py'de import etmek, event subscription'ı aktifleştirir.
"""

import logging

from app.core.database import SessionLocal
from app.core.events.bus import event_bus

logger = logging.getLogger(__name__)

DEFAULT_COMMISSION_RATE = 0.10  # Kategori bazlı oran bulunamazsa


def _get_commission_rate(db, category_id: int | None) -> float:
    """Kategori bazlı komisyon oranını döndürür; bulunamazsa genel oranı, o da yoksa %10."""
    from app.modules.commissions.models import CommissionRate

    # Önce kategori özel oranı ara
    if category_id:
        rate_obj = (
            db.query(CommissionRate)
            .filter(
                CommissionRate.category_id == category_id,
                CommissionRate.is_active == True,  # noqa: E712
            )
            .first()
        )
        if rate_obj:
            return rate_obj.rate

    # Genel oran (category_id=NULL)
    general = (
        db.query(CommissionRate)
        .filter(
            CommissionRate.category_id == None,  # noqa: E711
            CommissionRate.is_active == True,  # noqa: E712
        )
        .first()
    )
    if general:
        return general.rate

    return DEFAULT_COMMISSION_RATE


def _on_appointment_completed(payload: dict):
    """
    APPOINTMENT_COMPLETED event handler.
    Transaction + ProviderEarning kaydı oluşturur.
    """
    appointment_id = payload.get("appointment_id")
    provider_id = payload.get("provider_id")

    if not appointment_id or not provider_id:
        logger.warning("Komisyon: eksik payload — appointment_id veya provider_id yok")
        return

    db = SessionLocal()
    try:
        from app.modules.appointments.models import Appointment
        from app.modules.commissions.models import ProviderEarning, Transaction
        from app.modules.quotes.models import Quote
        from app.modules.requests.models import ServiceRequest

        # Zaten Transaction var mı? (idempotency)
        existing = (
            db.query(Transaction)
            .filter(
                Transaction.appointment_id == appointment_id,
                Transaction.status == "completed",
            )
            .first()
        )
        if existing:
            logger.info(
                "Komisyon: zaten oluşturulmuş — appointment_id=%s", appointment_id
            )
            return

        # Randevuyu al
        appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appt:
            logger.error("Komisyon: randevu bulunamadı — id=%s", appointment_id)
            return

        # Teklif fiyatını al
        amount = 0.0
        category_id = None

        if appt.quote_id:
            quote = db.query(Quote).filter(Quote.id == appt.quote_id).first()
            if quote:
                amount = float(quote.total_price or 0)

        if appt.request_id:
            req = (
                db.query(ServiceRequest)
                .filter(ServiceRequest.id == appt.request_id)
                .first()
            )
            if req:
                category_id = req.category_id
                # Teklif fiyatı yoksa bütçenin ortalamasını kullan
                if amount == 0 and req.budget_max:
                    mid = (
                        (req.budget_min or 0) + req.budget_max
                    ) / 2
                    amount = float(mid)

        if amount <= 0:
            logger.warning(
                "Komisyon: sıfır tutar — appointment_id=%s, oluşturulmuyor",
                appointment_id,
            )
            return

        # Komisyon hesapla
        commission_rate = _get_commission_rate(db, category_id)
        commission_amount = round(amount * commission_rate, 2)
        provider_earning = round(amount - commission_amount, 2)

        # Transaction oluştur
        txn = Transaction(
            provider_id=provider_id,
            appointment_id=appointment_id,
            amount=amount,
            commission_rate=commission_rate,
            commission_amount=commission_amount,
            provider_earning=provider_earning,
            status="completed",
            description=f"Randevu #{appointment_id} tamamlanma komisyonu",
        )
        db.add(txn)

        # ProviderEarning güncelle (upsert)
        earning = (
            db.query(ProviderEarning)
            .filter(ProviderEarning.provider_id == provider_id)
            .with_for_update()
            .first()
        )
        if earning:
            earning.total_earned = round(earning.total_earned + provider_earning, 2)
            earning.total_commission_paid = round(
                earning.total_commission_paid + commission_amount, 2
            )
            earning.pending_amount = round(
                earning.pending_amount + provider_earning, 2
            )
        else:
            earning = ProviderEarning(
                provider_id=provider_id,
                total_earned=provider_earning,
                total_commission_paid=commission_amount,
                pending_amount=provider_earning,
                paid_amount=0.0,
            )
            db.add(earning)

        db.commit()
        logger.info(
            "Komisyon oluşturuldu — appointment_id=%s, tutar=%.2f, "
            "komisyon=%.2f (%%%.0f), kazanç=%.2f",
            appointment_id,
            amount,
            commission_amount,
            commission_rate * 100,
            provider_earning,
        )

    except Exception as e:
        logger.error(
            "Komisyon oluşturma hatası — appointment_id=%s: %s", appointment_id, e
        )
        db.rollback()
    finally:
        db.close()


# Event subscription — bu dosya import edilince otomatik aktif olur
event_bus.subscribe("APPOINTMENT_COMPLETED", _on_appointment_completed)
logger.debug("Komisyon servisi: APPOINTMENT_COMPLETED event'ine abone olundu")
