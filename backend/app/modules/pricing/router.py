from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.modules.pricing.schemas import (
    PriceEstimateResponse,
    QuoteComparisonResponse,
)
from app.modules.pricing.service import (
    compare_quote_to_market,
    get_price_estimate,
    refresh_price_estimates,
)
from app.modules.users.models import User

router = APIRouter(prefix="/pricing", tags=["Fiyat Tahmin Sistemi"])


@router.get("/estimate", response_model=PriceEstimateResponse)
def estimate_price(
    service_id: Optional[int] = None,
    category_id: Optional[int] = None,
    city_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """
    Bir hizmet için tahmini piyasa fiyat aralığını döndürür.
    En azından service_id veya category_id verilmelidir.
    """
    if not service_id and not category_id:
        raise HTTPException(
            status_code=400,
            detail="En azından service_id veya category_id belirtilmelidir.",
        )

    result = get_price_estimate(db, service_id, category_id, city_id)
    return PriceEstimateResponse(**result, currency="TRY")


@router.get("/compare/{quote_id}", response_model=QuoteComparisonResponse)
def compare_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Belirli bir teklifi piyasa ortalamasıyla karşılaştırır.
    """
    try:
        result = compare_quote_to_market(db, quote_id)
        return QuoteComparisonResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/refresh")
def refresh_estimates(
    service_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    """
    Admin: Fiyat tahmin cache'ini yeniler.
    """
    updated = refresh_price_estimates(db, service_id)
    return {
        "message": f"{updated} hizmet için fiyat verileri güncellendi.",
        "updated_count": updated,
    }
