from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.ai.service import analyze_service_request, explain_match
from app.core.security import get_current_user
from app.modules.users.models import User

router = APIRouter(prefix="/ai", tags=["AI"])


class AnalyzeRequestBody(BaseModel):
    text: str


class MatchExplainBody(BaseModel):
    user_request: str
    provider_name: str
    rating: float
    review_count: int
    completed_jobs: int
    experience_years: int
    location: str
    verification_status: str
    match_score: float
    services: str


@router.post("/analyze-request")
async def analyze_request(
    body: AnalyzeRequestBody,
    current_user: User = Depends(get_current_user),
):
    """
    Kullanıcının serbest metin talebini analiz eder.
    
    - Kategori, hizmet, aciliyet, konum, tarih, bütçe çıkarır
    - Talep formu alanlarını otomatik doldurmak için kullanılır
    """
    if not body.text or len(body.text.strip()) < 5:
        raise HTTPException(status_code=400, detail="Lütfen en az 5 karakter yazın")
    
    result = await analyze_service_request(body.text)
    return result


@router.post("/match-explanation")
async def match_explanation(
    body: MatchExplainBody,
    current_user: User = Depends(get_current_user),
):
    """
    Belirli bir uzman eşleşmesini neden önerdiğimizi açıklar.
    Arama sonuçlarında "Bu uzmanı neden öneriyoruz?" için kullanılır.
    """
    result = await explain_match(
        user_request=body.user_request,
        provider_name=body.provider_name,
        rating=body.rating,
        review_count=body.review_count,
        completed_jobs=body.completed_jobs,
        experience_years=body.experience_years,
        location=body.location,
        verification_status=body.verification_status,
        match_score=body.match_score,
        services=body.services,
    )
    return result


@router.get("/health")
async def ai_health():
    """AI servisinin çalışıp çalışmadığını kontrol eder."""
    from app.core.config import settings
    return {
        "status": "ok",
        "provider": "openrouter",
        "model": settings.OPENROUTER_MODEL,
        "api_key_configured": bool(settings.OPENROUTER_API_KEY),
    }
