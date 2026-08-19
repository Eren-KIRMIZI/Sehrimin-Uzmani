"""Gamification — Provider rozet sistemi.

Rozetler provider'ın performans metriklerine göre otomatik hesaplanır.
Para ile satın alınamaz, kalite metrikleriyle kazanılır.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from datetime import datetime, timezone, timedelta
from app.modules.providers.models import ProviderProfile
from app.modules.reviews.models import Review
from app.modules.quotes.models import Quote
from app.modules.disputes.models import Dispute


BADGE_DEFINITIONS = [
    {
        "id": "verified_pro",
        "label": "Güvenilir Uzman",
        "icon": "🛡️",
        "description": "Kimlik doğrulaması tamamlandı",
        "color": "#3b82f6",
    },
    {
        "id": "fast_responder",
        "label": "Hızlı Yanıt",
        "icon": "⚡",
        "description": "Ortalama 30 dakika içinde yanıt veriyor",
        "color": "#f59e0b",
    },
    {
        "id": "top_rated",
        "label": "5 Yıldız Ustası",
        "icon": "⭐",
        "description": "4.8 veya üzeri ortalama puan",
        "color": "#f59e0b",
    },
    {
        "id": "experienced",
        "label": "Deneyimli Uzman",
        "icon": "🎓",
        "description": "5 yıl veya daha fazla deneyim",
        "color": "#8b5cf6",
    },
    {
        "id": "job_100",
        "label": "100 İş Tamamlandı",
        "icon": "💼",
        "description": "100 veya daha fazla iş tamamlandı",
        "color": "#10b981",
    },
    {
        "id": "job_50",
        "label": "50 İş Tamamlandı",
        "icon": "✅",
        "description": "50 veya daha fazla iş tamamlandı",
        "color": "#10b981",
    },
    {
        "id": "trusted",
        "label": "Güvenilir",
        "icon": "🤝",
        "description": "Hiç çözümsüz anlaşmazlık yok",
        "color": "#6366f1",
    },
    {
        "id": "active",
        "label": "Aktif Üye",
        "icon": "🟢",
        "description": "Son 30 günde aktif",
        "color": "#22c55e",
    },
    {
        "id": "popular",
        "label": "Popüler Uzman",
        "icon": "🔥",
        "description": "Son 30 günde 10+ yorum",
        "color": "#ef4444",
    },
    {
        "id": "premium",
        "label": "Premium Üye",
        "icon": "💎",
        "description": "Premium abonelik sahibi",
        "color": "#6366f1",
    },
]


def calculate_badges(provider: ProviderProfile, db: Session) -> List[dict]:
    """
    Provider'ın kazandığı rozetleri hesaplar ve döndürür.
    
    Returns:
        [{"id": ..., "label": ..., "icon": ..., "description": ..., "color": ..., "earned": True}]
    """
    earned_ids = set()

    # Rating verisi
    rating_data = db.query(
        sql_func.avg(Review.rating),
        sql_func.count(Review.id),
    ).filter(
        Review.provider_id == provider.id,
        Review.is_visible == True,
    ).first()

    avg_rating = float(rating_data[0] or 0)
    review_count = int(rating_data[1] or 0)

    # Doğrulama
    if provider.verification_status and provider.verification_status.upper() in ("ID", "IDENTITY", "PROFESSIONAL", "BUSINESS"):
        earned_ids.add("verified_pro")

    # Hızlı yanıt
    if provider.response_time_minutes and provider.response_time_minutes <= 30:
        earned_ids.add("fast_responder")

    # 5 Yıldız
    if avg_rating >= 4.8 and review_count >= 10:
        earned_ids.add("top_rated")

    # Deneyim
    if provider.experience_years and provider.experience_years >= 5:
        earned_ids.add("experienced")

    # İş sayısı
    if (provider.completed_jobs or 0) >= 100:
        earned_ids.add("job_100")
    elif (provider.completed_jobs or 0) >= 50:
        earned_ids.add("job_50")

    # Güvenilir (dispute yok)
    open_disputes = db.query(sql_func.count(Dispute.id)).filter(
        Dispute.reported_id == provider.user_id,
        Dispute.status.in_(["open", "under_review", "escalated"]),
    ).scalar() or 0
    if open_disputes == 0 and (provider.completed_jobs or 0) >= 5:
        earned_ids.add("trusted")

    # Aktif
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_reviews = db.query(sql_func.count(Review.id)).filter(
        Review.provider_id == provider.id,
        Review.created_at >= thirty_days_ago,
    ).scalar() or 0

    if recent_reviews > 0:
        earned_ids.add("active")

    # Popüler
    if recent_reviews >= 10:
        earned_ids.add("popular")

    # Premium
    from app.modules.subscriptions.models import ProviderSubscription
    active_sub = db.query(ProviderSubscription).filter(
        ProviderSubscription.provider_id == provider.user_id,
        ProviderSubscription.status == "active",
    ).first()
    if active_sub:
        earned_ids.add("premium")

    # Kazanılan rozetleri filtrele
    result = [
        {**badge, "earned": badge["id"] in earned_ids}
        for badge in BADGE_DEFINITIONS
        if badge["id"] in earned_ids
    ]

    return result
