"""Uzman CRM — Müşteri ilişkileri yönetimi ve detaylı analitik."""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import distinct
from sqlalchemy import func as sql_func
from sqlalchemy.orm import Session

from app.modules.appointments.models import Appointment
from app.modules.categories.models import Service
from app.modules.commissions.models import ProviderEarning, Transaction
from app.modules.favorites.models import Favorite
from app.modules.providers.models import ProviderPerformance
from app.modules.quotes.models import Quote
from app.modules.requests.models import ServiceRequest
from app.modules.reviews.models import Review

logger = logging.getLogger(__name__)


def get_crm_dashboard(provider_id: int, db: Session) -> dict:
    """Uzman CRM dashboard verisi."""
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    perf = (
        db.query(ProviderPerformance)
        .filter(ProviderPerformance.provider_id == provider_id)
        .first()
    )

    # Tekrar iş veren müşteri sayısı
    repeat_customers = (
        db.query(sql_func.count(distinct(Appointment.customer_id)))
        .filter(
            Appointment.provider_id == provider_id,
            Appointment.status == "COMPLETED",
        )
        .scalar()
        or 0
    )

    # Toplam tamamlanan iş
    total_completed = (
        db.query(sql_func.count(Appointment.id))
        .filter(
            Appointment.provider_id == provider_id,
            Appointment.status == "COMPLETED",
        )
        .scalar()
        or 0
    )

    # Son 30 gün geliri — Transaction tablosundan hesaplanır
    revenue_30d = 0.0
    try:
        from app.modules.commissions.models import Transaction
        rev = (
            db.query(sql_func.sum(Transaction.provider_earning))
            .filter(
                Transaction.provider_id == provider_id,
                Transaction.created_at >= thirty_days_ago,
                Transaction.status.in_(["completed", "paid"]),
            )
            .scalar()
        )
        revenue_30d = float(rev or 0)
    except Exception:
        pass

    # Yaklaşan randevular
    upcoming_appointments = (
        db.query(sql_func.count(Appointment.id))
        .filter(
            Appointment.provider_id == provider_id,
            Appointment.status.in_(["PENDING", "CONFIRMED"]),
            Appointment.start_at >= now,
        )
        .scalar()
        or 0
    )

    # Bekleyen teklifler
    pending_quotes = (
        db.query(sql_func.count(Quote.id))
        .filter(
            Quote.provider_id == provider_id,
            Quote.status == "DRAFT",
        )
        .scalar()
        or 0
    )

    # Favorilenme sayısı
    favorited_by = (
        db.query(sql_func.count(Favorite.id))
        .filter(
            Favorite.provider_id == provider_id,
        )
        .scalar()
        or 0
    )

    return {
        "performance": {
            "rating": perf.rating if perf else 0.0,
            "review_count": perf.review_count if perf else 0,
            "completed_jobs": total_completed,
            "repeat_customer_rate": perf.repeat_customer_rate if perf else 0.0,
            "quote_win_rate": perf.quote_win_rate if perf else 0.0,
            "response_rate": perf.response_rate if perf else 100.0,
            "average_job_value": perf.average_job_value if perf else 0.0,
        },
        "summary": {
            "repeat_customers": repeat_customers,
            "revenue_30d": round(revenue_30d, 2),
            "upcoming_appointments": upcoming_appointments,
            "pending_quotes": pending_quotes,
            "favorited_by": favorited_by,
        },
    }


def get_crm_customers(provider_id: int, db: Session) -> list:
    """Uzmanın müşteri listesi (tekrar iş verenler öncelikli)."""
    # Tüm tamamlanmış işlerden benzersiz müşterileri bul
    customers_query = (
        db.query(
            Appointment.customer_id,
            sql_func.count(Appointment.id).label("job_count"),
            sql_func.max(Appointment.created_at).label("last_job_date"),
        )
        .filter(
            Appointment.provider_id == provider_id,
            Appointment.status == "COMPLETED",
        )
        .group_by(Appointment.customer_id)
        .order_by(sql_func.count(Appointment.id).desc())
    )

    results = []
    for row in customers_query.all():
        from app.modules.users.models import User

        user = db.query(User).filter(User.id == row.customer_id).first()
        if not user:
            continue

        # Müşterinin bu uzmana favori durumu
        is_favorited = (
            db.query(Favorite)
            .filter(
                Favorite.user_id == row.customer_id,
                Favorite.provider_id == provider_id,
            )
            .first()
            is not None
        )

        # Son değerlendirme
        last_review = (
            db.query(Review)
            .filter(
                Review.customer_id == row.customer_id,
                Review.provider_id == provider_id,
            )
            .order_by(Review.created_at.desc())
            .first()
        )

        results.append(
            {
                "customer_id": row.customer_id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "avatar": user.avatar,
                "job_count": row.job_count,
                "last_job_date": row.last_job_date,
                "is_favorited_by_customer": is_favorited,
                "last_rating": last_review.rating if last_review else None,
                "last_review_comment": last_review.comment if last_review else None,
            }
        )

    return results


def get_crm_revenue(provider_id: int, db: Session, days: int = 30) -> dict:
    """Uzmanın gelir/gider detayı — Transaction tablosundan hesaplanır."""
    from app.modules.commissions.models import Transaction

    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days)

    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.provider_id == provider_id,
            Transaction.created_at >= start_date,
            Transaction.status.in_(["completed", "paid"]),
        )
        .order_by(Transaction.created_at.desc())
        .all()
    )

    total_gross = 0.0
    total_commission = 0.0
    total_net = 0.0
    daily = {}

    for t in transactions:
        gross = float(t.amount or 0)
        commission = float(t.commission_amount or 0)
        net = float(t.provider_earning or 0)

        total_gross += gross
        total_commission += commission
        total_net += net

        day_key = t.created_at.strftime("%Y-%m-%d") if t.created_at else "unknown"
        if day_key not in daily:
            daily[day_key] = {"gross": 0.0, "commission": 0.0, "net": 0.0, "count": 0}
        daily[day_key]["gross"] += gross
        daily[day_key]["commission"] += commission
        daily[day_key]["net"] += net
        daily[day_key]["count"] += 1

    return {
        "period_days": days,
        "total_gross": round(total_gross, 2),
        "total_commission": round(total_commission, 2),
        "total_net": round(total_net, 2),
        "transaction_count": len(transactions),
        "daily_breakdown": [{"date": k, **v} for k, v in sorted(daily.items())],
    }


def get_crm_calendar(provider_id: int, db: Session) -> list:
    """Uzmanın yaklaşan randevuları (takvim görünümü)."""
    now = datetime.now(timezone.utc)

    appointments = (
        db.query(Appointment)
        .filter(
            Appointment.provider_id == provider_id,
            Appointment.status.in_(["PENDING", "CONFIRMED"]),
            Appointment.start_at >= now,
        )
        .order_by(Appointment.start_at.asc())
        .limit(50)
        .all()
    )

    result = []
    for appt in appointments:
        request = (
            db.query(ServiceRequest)
            .filter(ServiceRequest.id == appt.request_id)
            .first()
        )
        from app.modules.users.models import User

        customer = db.query(User).filter(User.id == appt.customer_id).first()

        result.append(
            {
                "appointment_id": appt.id,
                "customer_name": f"{customer.first_name} {customer.last_name}"
                if customer
                else None,
                "customer_phone": customer.phone if customer else None,
                "service_title": request.title if request else None,
                "start_at": appt.start_at,
                "end_at": appt.end_at,
                "location": appt.location,
                "status": appt.status,
                "notes": appt.notes,
            }
        )

    return result


def get_crm_conversion(provider_id: int, db: Session) -> dict:
    """Dönüşüm oranı analitiği."""
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    # Gönderilen teklifler
    quotes_sent = (
        db.query(sql_func.count(Quote.id))
        .filter(
            Quote.provider_id == provider_id,
            Quote.created_at >= thirty_days_ago,
        )
        .scalar()
        or 0
    )

    # Kabul edilen teklifler
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

    total_decided = jobs_won + quotes_rejected
    conversion_rate = round(
        (jobs_won / total_decided * 100) if total_decided > 0 else 0, 1
    )

    # Tekrar müşteri oranı
    total_customers = (
        db.query(sql_func.count(distinct(Appointment.customer_id)))
        .filter(
            Appointment.provider_id == provider_id,
            Appointment.status == "COMPLETED",
        )
        .scalar()
        or 0
    )

    repeat_customers = 0
    if total_customers > 0:
        repeat_customers = (
            db.query(sql_func.count(distinct(Appointment.customer_id)))
            .filter(
                Appointment.provider_id == provider_id,
                Appointment.status == "COMPLETED",
            )
            .having(sql_func.count(Appointment.id) > 1)
            .scalar()
            or 0
        )

    repeat_rate = round(
        (repeat_customers / total_customers * 100) if total_customers > 0 else 0, 1
    )

    return {
        "period_days": 30,
        "quotes_sent": quotes_sent,
        "jobs_won": jobs_won,
        "quotes_rejected": quotes_rejected,
        "conversion_rate": conversion_rate,
        "total_customers": total_customers,
        "repeat_customers": repeat_customers,
        "repeat_rate": repeat_rate,
    }


def get_crm_top_services(provider_id: int, db: Session) -> list:
    """En çok kazandıran hizmetleri sıralar."""
    results = (
        db.query(
            Service.id,
            Service.name,
            sql_func.count(Appointment.id).label("job_count"),
        )
        .join(ServiceRequest, ServiceRequest.service_id == Service.id)
        .join(Appointment, Appointment.request_id == ServiceRequest.id)
        .filter(
            Appointment.provider_id == provider_id,
            Appointment.status == "COMPLETED",
        )
        .group_by(Service.id, Service.name)
        .order_by(sql_func.count(Appointment.id).desc())
        .limit(10)
        .all()
    )

    return [
        {"service_id": r.id, "service_name": r.name, "job_count": r.job_count}
        for r in results
    ]


def get_crm_regional(provider_id: int, db: Session) -> dict:
    """Bölgesel performans karşılaştırması."""
    # Bu uzmanın çalıştığı şehirler
    from app.modules.locations.models import ProviderServiceArea

    areas = (
        db.query(ProviderServiceArea)
        .filter(
            ProviderServiceArea.provider_id == provider_id,
        )
        .all()
    )

    city_ids = [a.city_id for a in areas]

    if not city_ids:
        return {"areas": [], "message": "Bölge bilgisi bulunamadı."}

    # Her şehirdeki ortalama puan ve iş sayısı
    city_stats = []
    from app.modules.locations.models import City

    for city_id in city_ids:
        city = db.query(City).filter(City.id == city_id).first()
        if not city:
            continue

        city_jobs = (
            db.query(sql_func.count(Appointment.id))
            .join(ServiceRequest, ServiceRequest.id == Appointment.request_id)
            .filter(
                Appointment.provider_id == provider_id,
                Appointment.status == "COMPLETED",
                ServiceRequest.city_id == city_id,
            )
            .scalar()
            or 0
        )

        city_rating = (
            db.query(sql_func.avg(Review.rating))
            .filter(
                Review.provider_id == provider_id,
                Review.request_id.in_(
                    sql_func.select(ServiceRequest.id).filter(
                        ServiceRequest.city_id == city_id
                    )
                ),
            )
            .scalar()
        )

        city_stats.append(
            {
                "city_id": city_id,
                "city_name": city.name,
                "job_count": city_jobs,
                "avg_rating": round(float(city_rating or 0), 1),
            }
        )

    return {"areas": city_stats}
