import logging

from app.core.database import SessionLocal
from app.core.events.bus import event_bus
from app.modules.providers.models import (
    ProviderPerformance,
    ProviderProfile,
    ProviderServiceArea,
)
from app.modules.requests.models import RequestMatch
from app.modules.requests.repository import request_repo

logger = logging.getLogger(__name__)


class MatchingEngineService:
    @staticmethod
    def calculate_match_score(
        request, provider, performance, distance_km: float
    ) -> float:
        """Basit eşleştirme algoritması (Ağırlıklı puanlama)"""
        score = 50.0  # Taban puan

        # Performans etkileri
        if performance:
            score += performance.rating * 2  # Max +10
            if performance.response_rate > 90:
                score += 5
            if performance.completed_jobs > 10:
                score += 5

        # Mesafe etkisi (Yakınsa daha yüksek puan)
        if distance_km is not None:
            if distance_km < 5:
                score += 20
            elif distance_km < 15:
                score += 10
            elif distance_km > 50:
                score -= 20

        return min(max(score, 0.0), 100.0)

    @staticmethod
    def handle_request_published(payload: dict):
        """Event Handler: REQUEST_PUBLISHED eventi gelince çalışır"""
        request_id = payload.get("request_id")
        if not request_id:
            return

        db = SessionLocal()
        try:
            req = request_repo.get(db, request_id)
            if not req:
                return

            logger.info(f"Matching Engine başlatıldı: Request #{req.id}")

            # Bu talebe uygun uzmanları bul (Şimdilik sadece şehir bazlı basit eşleştirme)
            providers = (
                db.query(ProviderProfile)
                .join(ProviderServiceArea)
                .filter(
                    ProviderProfile.is_available,
                    ProviderServiceArea.city_id == req.city_id,
                )
                .all()
            )

            for provider in providers:
                # Eşleşme skoru hesapla
                performance = (
                    db.query(ProviderPerformance)
                    .filter_by(provider_id=provider.id)
                    .first()
                )
                score = MatchingEngineService.calculate_match_score(
                    req, provider, performance, distance_km=10.0
                )  # Mesafe şimdilik sabit

                # Minimum skor threshold (Örn: 40 altını önerme)
                if score >= 40.0:
                    match = RequestMatch(
                        request_id=req.id,
                        provider_id=provider.id,
                        match_score=score,
                        distance_km=10.0,
                        status="INVITED",
                    )
                    db.add(match)

            db.commit()

            # MATCHING tamamlandı eventi fırlat
            event_bus.publish(
                "REQUEST_MATCHED",
                {"request_id": req.id, "matches_count": len(providers)},
            )

        except Exception as e:
            db.rollback()
            logger.error(f"Matching Engine Hatası: {e!s}")
        finally:
            db.close()


# Event'i kaydet
event_bus.subscribe("REQUEST_PUBLISHED", MatchingEngineService.handle_request_published)
