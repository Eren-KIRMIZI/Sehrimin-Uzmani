"""Fraud Detection — Kural tabanlı risk skoru hesaplama.

Bu modül ML kullanmaz; güvenilir kural tabanlı heuristikler kullanır.
Ileride ML modeli eklendiğinde bu sınıf bir adapter olarak çalışır.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy import func as sql_func
from sqlalchemy.orm import Session

from app.modules.disputes.models import Dispute
from app.modules.providers.models import ProviderProfile
from app.modules.quotes.models import Quote
from app.modules.reviews.models import Review
from app.modules.users.models import User


def calculate_risk_score(user_id: int, db: Session) -> dict:
    """
    Belirli bir kullanıcı için fraud risk skoru hesaplar.

    Skor 0-100 arasındadır:
    - 0-30:  Düşük risk (SAFE)
    - 31-60: Orta risk (MODERATE)
    - 61-80: Yüksek risk (HIGH)
    - 81+:   Kritik risk (CRITICAL)

    Returns:
        {
            risk_score: int,
            risk_level: str,
            reasons: List[str],
            user_id: int,
            calculated_at: str
        }
    """
    score = 0
    reasons = []
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    seven_days_ago = now - timedelta(days=7)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "Kullanıcı bulunamadı"}

    # === DISPUTE ANALİZİ ===
    # Son 30 günde açık anlaşmazlık sayısı
    recent_disputes = (
        db.query(sql_func.count(Dispute.id))
        .filter(
            Dispute.reported_id == user_id,
            Dispute.created_at >= thirty_days_ago,
        )
        .scalar()
        or 0
    )

    if recent_disputes >= 8:
        score += 30
        reasons.append(f"🚨 Son 30 günde {recent_disputes} anlaşmazlık raporu")
    elif recent_disputes >= 5:
        score += 20
        reasons.append(f"⚠️ Son 30 günde {recent_disputes} anlaşmazlık raporu")
    elif recent_disputes >= 3:
        score += 10
        reasons.append(f"⚠️ Son 30 günde {recent_disputes} anlaşmazlık raporu")

    # Toplam anlaşmazlık
    total_disputes = (
        db.query(sql_func.count(Dispute.id))
        .filter(
            Dispute.reported_id == user_id,
        )
        .scalar()
        or 0
    )

    if total_disputes >= 15:
        score += 20
        reasons.append(f"🚨 Toplam {total_disputes} anlaşmazlık kaydı")
    elif total_disputes >= 8:
        score += 10
        reasons.append(f"⚠️ Toplam {total_disputes} anlaşmazlık kaydı")

    # === YORUM ANALİZİ (sadece provider için) ===
    provider = (
        db.query(ProviderProfile).filter(ProviderProfile.user_id == user_id).first()
    )
    if provider:
        # Anormal yorum paterni: 7 günde 10+ yorum şüpheli
        recent_reviews = (
            db.query(sql_func.count(Review.id))
            .filter(
                Review.provider_id == provider.id,
                Review.created_at >= seven_days_ago,
            )
            .scalar()
            or 0
        )

        if recent_reviews >= 15:
            score += 25
            reasons.append(f"🚨 Son 7 günde {recent_reviews} yorum — anormal pattern")
        elif recent_reviews >= 10:
            score += 15
            reasons.append(f"⚠️ Son 7 günde {recent_reviews} yorum — şüpheli yoğunluk")

        # Düşük completion rate
        total_quotes_accepted = (
            db.query(sql_func.count(Quote.id))
            .filter(
                Quote.provider_id == provider.id,
                Quote.status == "ACCEPTED",
            )
            .scalar()
            or 0
        )

        completed_jobs = provider.completed_jobs or 0

        if total_quotes_accepted >= 5:
            completion_rate = completed_jobs / total_quotes_accepted
            if completion_rate < 0.3:
                score += 20
                reasons.append(
                    f"🚨 Düşük tamamlama oranı: %{completion_rate * 100:.0f}"
                )
            elif completion_rate < 0.5:
                score += 10
                reasons.append(f"⚠️ Düşük tamamlama oranı: %{completion_rate * 100:.0f}")

        # Çok düşük puan
        avg_rating_data = (
            db.query(
                sql_func.avg(Review.rating),
                sql_func.count(Review.id),
            )
            .filter(
                Review.provider_id == provider.id,
            )
            .first()
        )

        avg_rating = float(avg_rating_data[0] or 5.0)
        review_count = int(avg_rating_data[1] or 0)

        if review_count >= 10 and avg_rating < 2.5:
            score += 15
            reasons.append(f"🚨 Çok düşük ortalama puan: {avg_rating:.1f}/5.0")
        elif review_count >= 5 and avg_rating < 3.0:
            score += 8
            reasons.append(f"⚠️ Düşük ortalama puan: {avg_rating:.1f}/5.0")

    # === HESAP YAŞ ANALİZİ ===
    account_age_days = (
        (now - user.created_at.replace(tzinfo=timezone.utc)).days
        if user.created_at
        else 999
    )

    if account_age_days < 7 and provider:
        score += 10
        reasons.append("ℹ️ Yeni hesap (7 günden az)")

    # === HESAP AKTİF DEĞİL ===
    if not user.is_active:
        score += 5
        reasons.append("⚠️ Hesap deaktif edilmiş")

    # Maksimum 100'de tut
    score = min(score, 100)

    # Risk seviyesi
    if score >= 81:
        risk_level = "CRITICAL"
        risk_label = "Kritik"
    elif score >= 61:
        risk_level = "HIGH"
        risk_label = "Yüksek"
    elif score >= 31:
        risk_level = "MODERATE"
        risk_label = "Orta"
    else:
        risk_level = "SAFE"
        risk_label = "Güvenli"

    if not reasons:
        reasons.append("✅ Anormal aktivite tespit edilmedi")

    return {
        "user_id": user_id,
        "risk_score": score,
        "risk_level": risk_level,
        "risk_label": risk_label,
        "reasons": reasons,
        "calculated_at": now.isoformat(),
        "metrics": {
            "recent_disputes_30d": recent_disputes,
            "total_disputes": total_disputes,
            "account_age_days": account_age_days,
            "is_provider": provider is not None,
        },
    }
