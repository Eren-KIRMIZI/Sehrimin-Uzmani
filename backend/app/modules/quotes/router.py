
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.quotes.service import quote_service

router = APIRouter(prefix="/quotes", tags=["quotes"])

@router.post("/request/{request_id}/provider/{provider_id}")
def create_draft(request_id: int, provider_id: int, db: Session = Depends(get_db)):
    """Uzman, eşleştiği bir talebe taslak teklif oluşturur"""
    try:
        quote = quote_service.create_draft_quote(db, request_id, provider_id)
        return {"id": quote.id, "status": quote.status, "message": "Taslak teklif oluşturuldu"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{quote_id}/items")
def add_item(quote_id: int, name: str, price: float, type: str = "LABOR", quantity: float = 1.0, db: Session = Depends(get_db)):
    """Taslak teklife detaylı kalem (işçilik, malzeme vb) ekler"""
    try:
        item = quote_service.add_quote_item(db, quote_id, name, price, type, quantity)
        return {"id": item.id, "name": item.name, "message": "Kalem eklendi"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{quote_id}/submit")
def submit_quote(quote_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Hazırlanan taslak teklifi müşteriye gönderir"""
    try:
        # Mock user_id = 1 (Uzman)
        quote = quote_service.submit_quote(db, quote_id, 1, background_tasks)
        return {"message": "Teklif başarıyla gönderildi", "status": quote.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{quote_id}/revise")
def revise_quote(quote_id: int, new_price: float, notes: Optional[str] = None, requested_by: str = "CUSTOMER", db: Session = Depends(get_db)):
    """Teklif fiyatında indirim/revizyon (Pazarlık) talep eder"""
    try:
        # Mock user_id = 2 (Müşteri)
        rev = quote_service.revise_quote(db, quote_id, new_price, 2, requested_by, notes)
        return {"revision_id": rev.id, "new_price": rev.new_total_price, "message": "Revizyon talebi alındı"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{quote_id}/accept")
def accept_quote(quote_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Müşteri teklifi kabul eder ve diğer teklifler otomatik reddedilir"""
    try:
        # Mock user_id = 2 (Müşteri)
        quote = quote_service.accept_quote(db, quote_id, 2, background_tasks)
        return {"message": "Teklif kabul edildi. Talep durumu güncellendi.", "status": quote.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
