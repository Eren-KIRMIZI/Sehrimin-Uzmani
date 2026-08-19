import logging
from typing import Optional
from app.ai.base import AIProvider
from app.ai.providers.openrouter import OpenRouterProvider
from app.ai.prompts.request_analysis import (
    REQUEST_ANALYSIS_SYSTEM,
    REQUEST_ANALYSIS_PROMPT,
)
from app.ai.prompts.matching import (
    MATCH_EXPLANATION_SYSTEM,
    MATCH_EXPLANATION_PROMPT,
)

logger = logging.getLogger(__name__)

# Singleton AI provider — ileride .env'den provider tipi seçilebilir
_provider: Optional[AIProvider] = None


def get_ai_provider() -> AIProvider:
    """AI provider singleton'ını döndürür."""
    global _provider
    if _provider is None:
        _provider = OpenRouterProvider()
    return _provider


async def analyze_service_request(user_text: str) -> dict:
    """
    Kullanıcının serbest metin talebini analiz eder.
    
    Returns:
        {
            category_slug, category_name, subcategory, service,
            urgency, location, preferred_time, budget,
            keywords, problem_description, confidence, is_emergency
        }
    """
    if not user_text or len(user_text.strip()) < 5:
        return {"detected": False, "error": "Metin çok kısa"}

    try:
        provider = get_ai_provider()
        prompt = REQUEST_ANALYSIS_PROMPT.format(user_text=user_text.strip())
        result = await provider.generate_json(
            prompt=prompt,
            system_prompt=REQUEST_ANALYSIS_SYSTEM,
        )

        if not result:
            return {"detected": False, "error": "AI yanıt üretemedi"}

        result["detected"] = bool(result.get("category_slug"))
        result["original_text"] = user_text
        return result

    except Exception as e:
        logger.error("analyze_service_request hatası: %s", str(e))
        return {"detected": False, "error": str(e)}


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
    """
    Belirli bir uzman eşleşmesini neden önerdiğimizi açıklar.
    
    Returns:
        {match_percent, summary, reasons: List[str], highlight}
    """
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
            # Fallback: basit açıklama
            return {
                "match_percent": round(match_score),
                "summary": f"{provider_name} ihtiyacınız için uygun bir uzman.",
                "reasons": [
                    f"✓ {rating}/5.0 müşteri puanı",
                    f"✓ {completed_jobs} tamamlanan iş",
                    f"✓ {experience_years} yıl deneyim",
                ],
                "highlight": f"{rating}/5.0 puan",
            }

        return result

    except Exception as e:
        logger.error("explain_match hatası: %s", str(e))
        return {
            "match_percent": round(match_score),
            "summary": f"{provider_name} ihtiyacınız için önerildi.",
            "reasons": [f"✓ {rating}/5.0 puan", f"✓ {completed_jobs} tamamlanan iş"],
            "highlight": f"{rating}/5.0 puan",
        }
