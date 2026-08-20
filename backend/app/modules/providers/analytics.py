"""Provider Analytics — Son 30 günlük performans istatistikleri."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import func as sql_func
from sqlalchemy.orm import Session

from app.modules.commissions.models import ProviderEarning
from app.modules.quotes.models import Quote
from app.modules.requests.models import ServiceRequest
from app.modules.reviews.models import Review


def get_provider_analytics(provider_id: int, user_id: int, db: Session) -> dict:
    """
    Provider'ın son 30 günlük analytics verilerini döndürür.

    Returns:
        {
            period_days, profile_views, quotes_received, quotes_sent,
            jobs_won, conversion_rate, avg_rating, total_earnings,
            daily_breakdown, ai_insights
        }
    """
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    # Gönderilen teklifler (son 30 gün)
    quotes_sent = (
        db.query(sql_func.count(Quote.id))
        .filter(
            Quote.provider_id == provider_id,
            Quote.created_at >= thirty_days_ago,
        )
        .scalar()
        or 0
    )

    # Kabul edilen teklifler = kazanılan işler
    jobs_won = (
        db.query(sql_func.count(Quote.id))
        .filter(
            Quote.provider_id == provider_id,
            Quote.status == "ACCEPTED",
            Quote.created_at >= thirty_days_ago,
        )
        .scalar()
        or 0
    )

    # Reddedilen teklifler
    quotes_rejected = (
        db.query(sql_func.count(Quote.id))
        .filter(
            Quote.provider_id == provider_id,
            Quote.status == "REJECTED",
            Quote.created_at >= thirty_days_ago,
        )
        .scalar()
        or 0
    )

    # Bekleyen teklifler (hâlâ açık talepler için)
    quotes_pending = (
        db.query(sql_func.count(Quote.id))
        .filter(
            Quote.provider_id == provider_id,
            Quote.status == "PENDING",
            Quote.created_at >= thirty_days_ago,
        )
        .scalar()
        or 0
    )

    # Conversion rate
    total_decided = jobs_won + quotes_rejected
    conversion_rate = round(
        (jobs_won / total_decided * 100) if total_decided > 0 else 0, 1
    )

    # Bu teklif gönderilmiş taleplerin sayısı = quotes_received heuristic
    quotes_received = (
        db.query(sql_func.count(sql_func.distinct(ServiceRequest.id)))
        .join(Quote, Quote.request_id == ServiceRequest.id)
        .filter(
            Quote.provider_id == provider_id,
            ServiceRequest.created_at >= thirty_days_ago,
        )
        .scalar()
        or 0
    )

    # Rating (son 30 gün)
    recent_rating_data = (
        db.query(
            sql_func.avg(Review.rating),
            sql_func.count(Review.id),
        )
        .filter(
            Review.provider_id == provider_id,
            Review.created_at >= thirty_days_ago,
            Review.is_visible,
        )
        .first()
    )
    recent_avg_rating = round(float(recent_rating_data[0] or 0), 1)
    recent_review_count = int(recent_rating_data[1] or 0)

    # Genel rating
    all_rating_data = (
        db.query(
            sql_func.avg(Review.rating),
            sql_func.count(Review.id),
        )
        .filter(
            Review.provider_id == provider_id,
            Review.is_visible,
        )
        .first()
    )
    avg_rating = round(float(all_rating_data[0] or 0), 1)
    total_review_count = int(all_rating_data[1] or 0)

    # Kazanç (son 30 gün)
    total_earnings = 0.0
    try:
        earnings_data = (
            db.query(sql_func.sum(ProviderEarning.net_amount))
            .filter(
                ProviderEarning.provider_id == provider_id,
                ProviderEarning.created_at >= thirty_days_ago,
                ProviderEarning.status.in_(["COMPLETED", "PENDING"]),
            )
            .scalar()
        )
        total_earnings = float(earnings_data or 0)
    except Exception:
        pass

    # Son 7 gün günlük teklif dağılımı
    daily_breakdown = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)

        day_quotes = (
            db.query(sql_func.count(Quote.id))
            .filter(
                Quote.provider_id == provider_id,
                Quote.created_at >= day_start,
                Quote.created_at <= day_end,
            )
            .scalar()
            or 0
        )

        day_reviews = (
            db.query(sql_func.count(Review.id))
            .filter(
                Review.provider_id == provider_id,
                Review.created_at >= day_start,
                Review.created_at <= day_end,
            )
            .scalar()
            or 0
        )

        daily_breakdown.append(
            {
                "date": day.strftime("%d/%m"),
                "day_name": ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"][
                    day.weekday()
                ],
                "quotes": day_quotes,
                "reviews": day_reviews,
            }
        )

    # AI Insights — basit kural tabanlı öneriler
    ai_insights = []

    if conversion_rate < 30 and quotes_sent >= 5:
        ai_insights.append(
            {
                "type": "warning",
                "icon": "📉",
                "text": f"Teklif kabul oranınız %{conversion_rate:.0f}. Teklif açıklamalarınızı ve fiyatlarınızı gözden geçirmeniz önerilir.",
            }
        )

    if recent_review_count == 0 and jobs_won > 0:
        ai_insights.append(
            {
                "type": "info",
                "icon": "💬",
                "text": "Son 30 günde yeni yorum almadınız. Tamamladığınız işlerden sonra müşterilerinizden değerlendirme isteyebilirsiniz.",
            }
        )

    if avg_rating >= 4.7 and total_review_count >= 10:
        ai_insights.append(
            {
                "type": "success",
                "icon": "⭐",
                "text": f"{avg_rating}/5.0 puanınızla üst %10'daki uzmanlar arasındasınız. Profilinizi öne çıkararak daha fazla müşteriye ulaşabilirsiniz.",
            }
        )

    if jobs_won == 0 and quotes_sent >= 3:
        ai_insights.append(
            {
                "type": "warning",
                "icon": "🎯",
                "text": "Son 30 günde kazanılan iş yok. Teklif verme stratejinizi değiştirmeyi deneyin.",
            }
        )

    if conversion_rate >= 60:
        ai_insights.append(
            {
                "type": "success",
                "icon": "🏆",
                "text": f"%{conversion_rate:.0f} dönüşüm oranıyla platform ortalamasının üzerindesiniz!",
            }
        )

    return {
        "period_days": 30,
        "quotes_received": quotes_received,
        "quotes_sent": quotes_sent,
        "jobs_won": jobs_won,
        "quotes_pending": quotes_pending,
        "conversion_rate": conversion_rate,
        "avg_rating": avg_rating,
        "total_review_count": total_review_count,
        "recent_avg_rating": recent_avg_rating,
        "recent_review_count": recent_review_count,
        "total_earnings_30d": round(total_earnings, 2),
        "daily_breakdown": daily_breakdown,
        "ai_insights": ai_insights,
    }
