import logging
from sqlalchemy.orm import Session
from fastapi import BackgroundTasks

from app.core.database import SessionLocal
from app.core.events.bus import event_bus
from app.modules.reviews.models import Review
from app.modules.reviews.repository import review_repo
from app.modules.providers.models import ProviderPerformance
from app.modules.appointments.repository import appointment_repo

logger = logging.getLogger(__name__)


class ReviewService:
    def create_review(
        self,
        db: Session,
        request_id: int,
        customer_id: int,
        provider_id: int,
        rating: float,
        comment: str = None,
        communication_rating: float = None,
        quality_rating: float = None,
        price_rating: float = None,
        punctuality_rating: float = None,
        background_tasks: BackgroundTasks = None,
    ) -> Review:
        # Tekrar değerlendirme engeli
        if review_repo.exists(db, request_id, customer_id):
            raise ValueError("Bu talep için zaten değerlendirme yapılmış")

        review = Review(
            request_id=request_id,
            customer_id=customer_id,
            provider_id=provider_id,
            rating=rating,
            comment=comment,
            communication_rating=communication_rating,
            quality_rating=quality_rating,
            price_rating=price_rating,
            punctuality_rating=punctuality_rating,
            status="ACTIVE",
        )
        db.add(review)
        db.flush()

        # ProviderPerformance güncelle (genel ortalama)
        self._update_performance(db, provider_id, rating)

        db.commit()
        db.refresh(review)

        event_bus.publish(
            "REVIEW_CREATED",
            {"review_id": review.id, "provider_id": provider_id, "rating": rating},
            background_tasks,
        )
        return review

    @staticmethod
    def _update_performance(db: Session, provider_id: int, new_rating: float):
        """Uzmanın genel puan ortalamasını incremental günceller."""
        perf = db.query(ProviderPerformance).filter_by(provider_id=provider_id).first()
        if not perf:
            return

        old_total = (perf.rating or 0.0) * (perf.total_reviews or 0)
        perf.total_reviews = (perf.total_reviews or 0) + 1
        perf.rating = (old_total + new_rating) / perf.total_reviews

    def add_provider_reply(self, db: Session, review_id: int, reply_text: str, provider_user_id: int) -> Review:
        from datetime import datetime, timezone
        rev = review_repo.get(db, review_id)
        if not rev:
            raise ValueError("Değerlendirme bulunamadı")
        if rev.provider_reply:
            raise ValueError("Bu değerlendirmeye zaten cevap verilmiş")
        rev.provider_reply = reply_text
        rev.provider_replied_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(rev)
        return rev


review_service = ReviewService()


# ── Event Listener: APPOINTMENT_COMPLETED → Değerlendirme isteği bildirimi ───
def _on_appointment_completed(payload: dict):
    """İş bitince müşteriye 'Değerlendirme yap' bildirimi gönderilir."""
    appointment_id = payload.get("appointment_id")
    if not appointment_id:
        return
    db = SessionLocal()
    try:
        from app.modules.notifications.service import create_notification
        appt = appointment_repo.get(db, appointment_id)
        if not appt:
            return
        create_notification(
            db=db,
            user_id=appt.customer_id,
            type_str="REVIEW_REQUEST",
            title="Hizmeti Değerlendirin 🌟",
            message="Aldığınız hizmeti değerlendirerek uzmanımıza geri bildirim verin.",
            action_url=f"/requests/{appt.request_id}/review",
        )
    except Exception as e:
        logger.error(f"Review bildirimi oluşturma hatası: {e}")
    finally:
        db.close()


event_bus.subscribe("APPOINTMENT_COMPLETED", _on_appointment_completed)
