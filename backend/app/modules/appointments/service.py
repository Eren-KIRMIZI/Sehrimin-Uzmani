import logging
from datetime import datetime, timezone

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.events.bus import event_bus
from app.modules.appointments.models import Appointment
from app.modules.appointments.repository import appointment_repo
from app.modules.appointments.state import AppointmentState, AppointmentStateMachine
from app.modules.quotes.repository import quote_repo

logger = logging.getLogger(__name__)


class AppointmentService:
    # ── Yaratma ──────────────────────────────────────────────────────────────
    @staticmethod
    def create_from_quote(db: Session, quote_id: int) -> Appointment:
        """Kabul edilen teklif bilgilerinden otomatik randevu oluşturur."""
        quote = quote_repo.get(db, quote_id)
        if not quote:
            raise ValueError("Teklif bulunamadı")

        # Zaten randevu var mı kontrol et
        existing = appointment_repo.get_by_request(db, quote.request_id)
        if existing:
            logger.warning(f"Randevu zaten mevcut: request #{quote.request_id}")
            return existing

        start = quote.available_date or datetime.now(timezone.utc)
        appt = Appointment(
            request_id=quote.request_id,
            provider_id=quote.provider_id,
            customer_id=quote.request.customer_id,
            quote_id=quote.id,
            start_at=start,
            status=AppointmentState.PENDING.value,
        )
        db.add(appt)
        db.commit()
        db.refresh(appt)
        logger.info(f"Randevu oluşturuldu: #{appt.id}")
        return appt

    # ── Durum Geçişleri ───────────────────────────────────────────────────────
    @staticmethod
    def _transition(
        db: Session,
        appt: Appointment,
        new_state: AppointmentState,
        background_tasks: BackgroundTasks = None,
    ):
        sm = AppointmentStateMachine(AppointmentState(appt.status))

        def on_transition(old, new):
            appt.status = new.value
            db.commit()
            db.refresh(appt)
            event_bus.publish(
                f"APPOINTMENT_{new.value}",
                {
                    "appointment_id": appt.id,
                    "request_id": appt.request_id,
                    "provider_id": appt.provider_id,
                    "customer_id": appt.customer_id,
                },
                background_tasks,
            )

        sm.transition_to(new_state, on_transition=on_transition)
        return appt

    def confirm(
        self, db: Session, appt_id: int, background_tasks: BackgroundTasks
    ) -> Appointment:
        """Uzman randevuyu onaylar."""
        return self._transition(
            db,
            appointment_repo.get(db, appt_id),
            AppointmentState.CONFIRMED,
            background_tasks,
        )

    def start(
        self, db: Session, appt_id: int, background_tasks: BackgroundTasks
    ) -> Appointment:
        """Uzman işi başlattı."""
        return self._transition(
            db,
            appointment_repo.get(db, appt_id),
            AppointmentState.IN_PROGRESS,
            background_tasks,
        )

    def complete(
        self, db: Session, appt_id: int, background_tasks: BackgroundTasks
    ) -> Appointment:
        """İş tamamlandı → APPOINTMENT_COMPLETED eventi fırlatılır."""
        return self._transition(
            db,
            appointment_repo.get(db, appt_id),
            AppointmentState.COMPLETED,
            background_tasks,
        )

    def cancel(
        self, db: Session, appt_id: int, background_tasks: BackgroundTasks
    ) -> Appointment:
        return self._transition(
            db,
            appointment_repo.get(db, appt_id),
            AppointmentState.CANCELLED,
            background_tasks,
        )

    def no_show(
        self, db: Session, appt_id: int, background_tasks: BackgroundTasks
    ) -> Appointment:
        return self._transition(
            db,
            appointment_repo.get(db, appt_id),
            AppointmentState.NO_SHOW,
            background_tasks,
        )


appointment_service = AppointmentService()


# ── Event Listener: QUOTE_ACCEPTED → Randevu Oluştur ─────────────────────────
def _on_quote_accepted(payload: dict):
    quote_id = payload.get("quote_id")
    if not quote_id:
        return
    db = SessionLocal()
    try:
        appointment_service.create_from_quote(db, quote_id)
    except Exception as e:
        db.rollback()
        logger.error(f"Randevu oluşturma hatası: {e}")
    finally:
        db.close()


event_bus.subscribe("QUOTE_ACCEPTED", _on_quote_accepted)
