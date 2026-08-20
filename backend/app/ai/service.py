import logging
from typing import Optional, List, Dict
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
_provider: Optional[AIProvider] = None

def get_ai_provider() -> AIProvider:
    global _provider
    if _provider is None:
        _provider = OpenRouterProvider()
    return _provider

async def chat_service_request(user_text: str, chat_history: List[Dict[str, str]] = None) -> dict:
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
                
        prompt = REQUEST_ANALYSIS_PROMPT.format(chat_history=history_str, user_text=user_text.strip())
        
        result = await provider.generate_json(
            prompt=prompt,
            system_prompt=REQUEST_ANALYSIS_SYSTEM,
        )

        if not result:
            return {"is_complete": False, "follow_up_question": "Sistemsel bir hata oluştu, tekrar dener misiniz?"}

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
