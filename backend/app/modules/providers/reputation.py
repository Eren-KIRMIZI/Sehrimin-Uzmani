"""Provider Reputation Score hesaplama motoru.

Hesaplama ağırlıkları:
- Ortalama puan      (40%) → avg_rating * 8 (max 40)
- Tamamlanan iş      (25%) → logaritmik scale (max 25)
- Doğrulama seviyesi (15%) → NONE=0, BASIC=5, ID=8, PROFESSIONAL=12, BUSINESS=15
- Tekrar müşteri     (10%) → heuristic (max 10)
- Yanıt hızı         (10%) → response_time_minutes'a göre (max 10)
"""

import math
from datetime import datetime, timedelta, timezone

from sqlalchemy import func as sql_func
from sqlalchemy.orm import Session

from app.modules.providers.models import ProviderProfile
from app.modules.reviews.models import Review


def _rating_score(avg_rating: float) -> float:
    """0-5 arası puan → 0-40 puan (ağırlık %40)"""
    return round(min(avg_rating * 8, 40), 1)


def _completion_score(completed_jobs: int) -> float:
    """Tamamlanan iş sayısına göre logaritmik puan → 0-25 (ağırlık %25)"""
    if completed_jobs <= 0:
        return 0.0
    # log(1+n) / log(1+200) * 25  — 200 iş = maksimum puan
    return round(min(math.log(1 + completed_jobs) / math.log(201) * 25, 25), 1)


def _verification_score(verification_status: str) -> float:
    """Doğrulama seviyesi → 0-15 (ağırlık %15)"""
    mapping = {
        "NONE": 0,
        "BASIC": 5,
        "IDENTITY": 8,
        "PROFESSIONAL": 12,
        "BUSINESS": 15,
    }
    return mapping.get(verification_status.upper(), 0)


def _response_score(response_time_minutes: int) -> float:
    """Yanıt süresi → 0-10 (ağırlık %10)"""
    if not response_time_minutes or response_time_minutes <= 0:
        return 5.0  # bilinmiyor — nötr
    if response_time_minutes <= 15:
        return 10.0
    if response_time_minutes <= 30:
        return 8.0
    if response_time_minutes <= 60:
        return 6.0
    if response_time_minutes <= 120:
        return 4.0
    if response_time_minutes <= 240:
        return 2.0
    return 0.0


def _repeat_customer_score(provider_id: int, db: Session) -> float:
    """Tekrar müşteri heuristic → 0-10 (ağırlık %10)
    
    Gerçek tekrar müşteri verisi olmadığından, yorum sayısı / benzersiz
    müşteri sayısı oranını kullanıyoruz.
    """
    total_reviews = db.query(sql_func.count(Review.id)).filter(
        Review.provider_id == provider_id,
        Review.is_visible,
    ).scalar() or 0

    unique_customers = db.query(sql_func.count(sql_func.distinct(Review.customer_id))).filter(
        Review.provider_id == provider_id,
        Review.is_visible,
    ).scalar() or 0

    if unique_customers == 0:
        return 5.0  # nötr

    ratio = total_reviews / unique_customers
    # Ratio 1.0 → yeni müşteri ağırlıklı, 1.5+ → tekrar müşteri var
    return round(min((ratio - 1.0) * 10 + 5, 10), 1)


def calculate_reputation_score(provider: ProviderProfile, db: Session) -> dict:
    """
    Uzmanın kapsamlı reputation skorunu hesaplar.
    
    Returns:
        {
            score: int (0-100),
            label: str,
            breakdown: {rating, completion, verification, response, repeat},
            metrics: {avg_rating, review_count, completed_jobs, response_time, verification_status}
        }
    """
    # Gerçek rating verisi
    rating_data = db.query(
        sql_func.avg(Review.rating),
        sql_func.count(Review.id),
    ).filter(
        Review.provider_id == provider.id,
        Review.is_visible,
    ).first()

    avg_rating = float(rating_data[0] or 0)
    review_count = int(rating_data[1] or 0)

    # Alt metrik skorları
    r_score = _rating_score(avg_rating)
    c_score = _completion_score(provider.completed_jobs or 0)
    v_score = _verification_score(provider.verification_status or "NONE")
    resp_score = _response_score(provider.response_time_minutes or 0)
    rep_score = _repeat_customer_score(provider.id, db)

    total = r_score + c_score + v_score + resp_score + rep_score
    total = round(min(total, 100))

    # Son 30 gün yorumları
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_reviews = db.query(Review).filter(
        Review.provider_id == provider.id,
        Review.created_at >= thirty_days_ago,
        Review.is_visible,
    ).all()

    recent_avg = None
    if recent_reviews:
        recent_avg = round(sum(r.rating for r in recent_reviews) / len(recent_reviews), 1)

    # Label
    if total >= 90:
        label = "Mükemmel"
    elif total >= 75:
        label = "Çok İyi"
    elif total >= 60:
        label = "İyi"
    elif total >= 45:
        label = "Orta"
    else:
        label = "Gelişiyor"

    return {
        "score": total,
        "label": label,
        "breakdown": {
            "rating_score": r_score,
            "completion_score": c_score,
            "verification_score": v_score,
            "response_score": resp_score,
            "repeat_score": rep_score,
        },
        "metrics": {
            "avg_rating": round(avg_rating, 1),
            "review_count": review_count,
            "completed_jobs": provider.completed_jobs or 0,
            "response_time_minutes": provider.response_time_minutes or 0,
            "verification_status": provider.verification_status or "NONE",
            "recent_review_count": len(recent_reviews),
            "recent_avg_rating": recent_avg,
        },
    }
