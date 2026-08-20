import logging
from typing import Optional

from app.ai.base import AIProvider
from app.ai.prompts.matching import (
    MATCH_EXPLANATION_PROMPT,
    MATCH_EXPLANATION_SYSTEM,
)
from app.ai.prompts.request_analysis import (
    PRICE_ESTIMATE_CONTEXT,
    REQUEST_ANALYSIS_PROMPT,
    REQUEST_ANALYSIS_SYSTEM,
)
from app.ai.providers.openrouter import OpenRouterProvider

logger = logging.getLogger(__name__)
_provider: AIProvider | None = None

def get_ai_provider() -> AIProvider:
    global _provider
    if _provider is None:
        _provider = OpenRouterProvider()
    return _provider

def _try_get_price_context(service_name: Optional[str] = None, city_name: Optional[str] = None) -> Optional[str]:
    """
    Piyasa fiyat verisini DB'den çekip AI prompt bağlamı olarak döndürür.
    Hata durumunda None döner (AI yine çalışır, fiyat olmadan).
    """
    try:
        from app.core.database import SessionLocal
        from app.modules.pricing.service import get_price_estimate

        db = SessionLocal()
        try:
            service_id = None
            category_id = None

            if service_name:
                from app.modules.categories.models import Service
                svc = db.query(Service).filter(
                    Service.name.ilike(f"%{service_name}%"),
                    Service.is_active,
                ).first()
                if svc:
                    service_id = svc.id
                    category_id = svc.subcategory.category_id if svc.subcategory else None

            if not service_id and service_name:
                from app.modules.categories.models import Category
                cat = db.query(Category).filter(
                    Category.name.ilike(f"%{service_name}%"),
                    Category.is_active,
                ).first()
                if cat:
                    category_id = cat.id

            if not service_id and not category_id:
                return None

            city_id = None
            if city_name:
                from app.modules.locations.models import City
                city = db.query(City).filter(City.name.ilike(f"%{city_name}%")).first()
                if city:
                    city_id = city.id

            est = get_price_estimate(db, service_id=service_id, category_id=category_id, city_id=city_id)

            if est["sample_size"] == 0:
                return None

            return PRICE_ESTIMATE_CONTEXT.format(
                service_name=service_name or "Bilinmiyor",
                city_name=city_name or "Bilinmiyor",
                min_price=est["min_price"],
                max_price=est["max_price"],
                avg_price=est["avg_price"],
                sample_size=est["sample_size"],
            )
        finally:
            db.close()
    except Exception as e:
        logger.debug("Fiyat bağlamı alınamadı: %s", str(e))
        return None


async def chat_service_request(user_text: str, chat_history: Optional[list[dict[str, str]]] = None) -> dict:
    """Kullanıcı talebini diyalog bazlı analiz eder."""
    if not user_text or len(user_text.strip()) < 2:
        return {"is_complete": False, "follow_up_question": "Size nasıl yardımcı olabilirim?"}

    try:
        provider = get_ai_provider()

        # History formatlaması
        history_str = ""
        if chat_history:
            for msg in chat_history:
                history_str += f"{msg.get('role', 'user').capitalize()}: {msg.get('content', '')}\n"

        # Fiyat bağlamını DB'den çek (varsa prompt'a ekle)
        price_context = _try_get_price_context()
        extra_context = f"\n\n{price_context}" if price_context else ""

        prompt = REQUEST_ANALYSIS_PROMPT.format(
            chat_history=history_str,
            user_text=user_text.strip(),
        ) + extra_context

        result = await provider.generate_json(
            prompt=prompt,
            system_prompt=REQUEST_ANALYSIS_SYSTEM,
        )

        if not result:
            return {"is_complete": False, "follow_up_question": "Sistemsel bir hata oluştu, tekrar dener misiniz?"}

        # AI price_estimate'i varsa, sonucun içine ekle
        # Eğer AI price_estimate döndürmediyse, DB'den hesapla
        if not result.get("price_estimate") or result["price_estimate"] is None:
            try:
                from app.core.database import SessionLocal
                from app.modules.pricing.service import get_price_estimate

                db = SessionLocal()
                try:
                    service_name = result.get("service")
                    category_slug = result.get("category_slug")
                    city_name = result.get("location", {}).get("city") if isinstance(result.get("location"), dict) else None

                    service_id = None
                    category_id = None

                    if service_name:
                        from app.modules.categories.models import Service
                        svc = db.query(Service).filter(
                            Service.name.ilike(f"%{service_name}%"),
                            Service.is_active,
                        ).first()
                        if svc:
                            service_id = svc.id

                    if not service_id and category_slug:
                        from app.modules.categories.models import Category
                        cat = db.query(Category).filter(Category.slug == category_slug).first()
                        if cat:
                            category_id = cat.id

                    if service_id or category_id:
                        city_id = None
                        if city_name:
                            from app.modules.locations.models import City
                            city = db.query(City).filter(City.name.ilike(f"%{city_name}%")).first()
                            if city:
                                city_id = city.id

                        est = get_price_estimate(db, service_id=service_id, category_id=category_id, city_id=city_id)
                        if est["sample_size"] > 0:
                            result["price_estimate"] = {
                                "min": est["min_price"],
                                "max": est["max_price"],
                                "avg": est["avg_price"],
                            }
                finally:
                    db.close()
            except Exception as e:
                logger.debug("Fiyat tahmini hesaplanamadı: %s", str(e))

        return result

    except Exception as e:
        logger.error("chat_service_request hatası: %s", str(e))
        return {"is_complete": False, "follow_up_question": "Üzgünüm, şu an isteğinizi işleyemiyorum."}


async def explain_match(
    user_request: str,
    provider_name: str,
    rating: float,
    review_count: int,
    completed_jobs: int,
    experience_years: int,
    location: str,
    verification_status: str,
    match_score: float,
    services: str,
) -> dict:
    """Belirli bir uzman eşleşmesini neden önerdiğimizi açıklar."""
    try:
        provider = get_ai_provider()
        prompt = MATCH_EXPLANATION_PROMPT.format(
            user_request=user_request,
            provider_name=provider_name,
            rating=rating,
            review_count=review_count,
            completed_jobs=completed_jobs,
            experience_years=experience_years,
            location=location,
            verification_status=verification_status,
            match_score=round(match_score),
            services=services,
        )
        result = await provider.generate_json(
            prompt=prompt,
            system_prompt=MATCH_EXPLANATION_SYSTEM,
        )
        if not result:
            return {"match_percent": round(match_score), "summary": "Eşleşme detayı bulunamadı."}
        return result
    except Exception as e:
        logger.error("explain_match hatası: %s", str(e))
        return {"match_percent": round(match_score), "summary": "Hata oluştu."}
