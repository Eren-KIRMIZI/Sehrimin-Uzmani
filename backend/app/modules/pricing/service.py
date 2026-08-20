import logging
import statistics
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.modules.categories.models import ProviderService
from app.modules.pricing.models import PriceEstimate
from app.modules.quotes.models import Quote

logger = logging.getLogger(__name__)


def get_price_estimate(
    db: Session,
    service_id: Optional[int] = None,
    category_id: Optional[int] = None,
    city_id: Optional[int] = None,
) -> dict:
    """
    Bir hizmet için tahmini piyasa fiyat aralığını hesaplar.
    Kaynaklar:
      1. Aynı hizmet + şehirdeki kabul edilmiş teklifler
      2. Aynı kategorideki teklifler (fallback)
      3. ProviderService başlangıç fiyatları (ikincil)
    """
    prices = []

    # 1) Aynı service_id + city_id için kabul edilmiş teklifler
    if service_id:
        query = db.query(Quote.total_price).filter(
            Quote.status == "ACCEPTED",
            Quote.request_id.isnot(None),
        )
        if city_id:
            from app.modules.requests.models import ServiceRequest

            query = query.join(
                ServiceRequest, Quote.request_id == ServiceRequest.id
            ).filter(
                ServiceRequest.city_id == city_id,
                ServiceRequest.service_id == service_id,
            )
        else:
            from app.modules.requests.models import ServiceRequest

            query = query.join(
                ServiceRequest, Quote.request_id == ServiceRequest.id
            ).filter(
                ServiceRequest.service_id == service_id,
            )
        rows = query.all()
        prices.extend([float(r[0]) for r in rows if r[0]])

    # 2) Aynı category_id fallback
    if not prices and category_id:
        from app.modules.requests.models import ServiceRequest

        rows = (
            db.query(Quote.total_price)
            .join(ServiceRequest, Quote.request_id == ServiceRequest.id)
            .filter(
                Quote.status == "ACCEPTED",
                ServiceRequest.category_id == category_id,
            )
            .all()
        )
        prices.extend([float(r[0]) for r in rows if r[0]])

    # 3) ProviderService başlangıç fiyatları (ikincil kaynak)
    if service_id:
        sp_rows = (
            db.query(ProviderService.starting_price)
            .filter(
                ProviderService.service_id == service_id,
                ProviderService.is_active,
                ProviderService.starting_price.isnot(None),
            )
            .all()
        )
        sp_prices = [float(r[0]) for r in sp_rows if r[0]]
        if sp_prices:
            prices.extend(sp_prices)

    if not prices:
        return {
            "min_price": 0.0,
            "max_price": 0.0,
            "avg_price": 0.0,
            "median_price": 0.0,
            "sample_size": 0,
            "confidence": 0.0,
        }

    sorted_prices = sorted(prices)
    avg_p = statistics.mean(sorted_prices)
    med_p = statistics.median(sorted_prices)
    min_p = sorted_prices[0]
    max_p = sorted_prices[-1]

    sample = len(prices)
    confidence = min(1.0, sample / 10)

    return {
        "min_price": round(min_p, 2),
        "max_price": round(max_p, 2),
        "avg_price": round(avg_p, 2),
        "median_price": round(med_p, 2),
        "sample_size": sample,
        "confidence": round(confidence, 2),
    }


def compare_quote_to_market(db: Session, quote_id: int) -> dict:
    """
    Bir teklifi piyasa ortalamasıyla karşılaştırır.
    """
    from app.modules.quotes.models import Quote
    from app.modules.requests.models import ServiceRequest

    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise ValueError("Teklif bulunamadı")

    request = (
        db.query(ServiceRequest).filter(ServiceRequest.id == quote.request_id).first()
    )
    if not request:
        raise ValueError("Talep bulunamadı")

    estimate = get_price_estimate(
        db,
        service_id=request.service_id,
        category_id=request.category_id,
        city_id=request.city_id,
    )

    if estimate["sample_size"] == 0:
        return {
            "quote_id": quote_id,
            "quote_price": quote.total_price,
            "market_avg": 0.0,
            "market_min": 0.0,
            "market_max": 0.0,
            "deviation_percent": 0.0,
            "comparison_text": "Bu hizmet için yeterli piyasa verisi bulunmuyor.",
            "rating": "no_data",
        }

    market_avg = estimate["avg_price"]
    deviation = ((quote.total_price / market_avg) - 1) * 100 if market_avg > 0 else 0

    if deviation < -15:
        rating = "below_market"
        text = (
            f"Bu teklif bölgedeki benzer hizmetlere göre %{abs(deviation):.0f} düşük."
        )
    elif deviation < -5:
        rating = "slightly_below"
        text = f"Bu teklif piyasa ortalamasının hafif altında (%{abs(deviation):.0f} düşük)."
    elif deviation <= 5:
        rating = "at_market"
        text = "Bu teklif piyasa ortalamasına yakın."
    elif deviation <= 15:
        rating = "slightly_above"
        text = (
            f"Bu teklif piyasa ortalamasının hafif üzerinde (%{deviation:.0f} yüksek)."
        )
    else:
        rating = "above_market"
        text = f"Bu teklif piyasa ortalamasının %{deviation:.0f} üzerinde."

    return {
        "quote_id": quote_id,
        "quote_price": quote.total_price,
        "market_avg": round(market_avg, 2),
        "market_min": estimate["min_price"],
        "market_max": estimate["max_price"],
        "deviation_percent": round(deviation, 1),
        "comparison_text": text,
        "rating": rating,
    }


def refresh_price_estimates(db: Session, service_id: Optional[int] = None) -> int:
    """
    PriceEstimate tablosunu yeniler.
    Döndürülen değer: güncellenen satır sayısı.
    """
    updated = 0

    # Tüm aktif service'leri tara
    from app.modules.categories.models import Service

    query = db.query(Service).filter(Service.is_active)
    if service_id:
        query = query.filter(Service.id == service_id)

    services = query.all()

    for svc in services:
        est = get_price_estimate(db, service_id=svc.id)
        if est["sample_size"] == 0:
            continue

        existing = (
            db.query(PriceEstimate)
            .filter(
                PriceEstimate.service_id == svc.id,
            )
            .first()
        )

        if existing:
            existing.avg_price = est["avg_price"]
            existing.min_price = est["min_price"]
            existing.max_price = est["max_price"]
            existing.median_price = est["median_price"]
            existing.sample_size = est["sample_size"]
            existing.last_calculated = datetime.now(timezone.utc)
        else:
            new_est = PriceEstimate(
                service_id=svc.id,
                category_id=None,
                city_id=None,
                avg_price=est["avg_price"],
                min_price=est["min_price"],
                max_price=est["max_price"],
                median_price=est["median_price"],
                sample_size=est["sample_size"],
                last_calculated=datetime.now(timezone.utc),
            )
            db.add(new_est)
        updated += 1

    db.commit()
    return updated
