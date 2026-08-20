from typing import Optional

from pydantic import BaseModel


class PriceEstimateRequest(BaseModel):
    service_id: Optional[int] = None
    category_id: Optional[int] = None
    city_id: Optional[int] = None


class PriceEstimateResponse(BaseModel):
    min_price: float
    max_price: float
    avg_price: float
    median_price: float
    sample_size: int
    confidence: float
    currency: str = "TRY"


class QuoteComparisonResponse(BaseModel):
    quote_id: int
    quote_price: float
    market_avg: float
    market_min: float
    market_max: float
    deviation_percent: float
    comparison_text: str
    rating: str
