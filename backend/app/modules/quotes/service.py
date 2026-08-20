from sqlalchemy.orm import Session
from fastapi import BackgroundTasks
from app.core.events.bus import event_bus
from app.modules.quotes.models import Quote, QuoteItem, QuoteRevision, QuoteStatusHistory
from app.modules.quotes.repository import quote_repo, quote_item_repo, quote_revision_repo
from app.modules.requests.repository import request_repo
from app.modules.requests.state import RequestStateMachine, RequestState

class QuoteService:
    def create_draft_quote(self, db: Session, request_id: int, provider_id: int) -> Quote:
        quote = Quote(
            request_id=request_id,
            provider_id=provider_id,
            total_price=0.0,
            status="DRAFT"
        )
        db.add(quote)
        db.commit()
        db.refresh(quote)
        return quote

    def add_quote_item(self, db: Session, quote_id: int, name: str, price: float, item_type: str = "LABOR", quantity: float = 1.0) -> QuoteItem:
        quote = quote_repo.get(db, quote_id)
        if not quote or quote.status not in ["DRAFT", "NEGOTIATING"]:
            raise ValueError("Teklife kalem eklenemez")
            
        item = QuoteItem(quote_id=quote_id, name=name, price=price, type=item_type, quantity=quantity)
        db.add(item)
        
        quote.total_price += (price * quantity)
        db.commit()
        db.refresh(item)
        return item

    def submit_quote(self, db: Session, quote_id: int, user_id: int, background_tasks: BackgroundTasks) -> Quote:
        quote = quote_repo.get(db, quote_id)
        if quote.status != "DRAFT":
            raise ValueError("Sadece taslak teklifler gönderilebilir")
            
        quote.status = "SUBMITTED"
        history = QuoteStatusHistory(quote_id=quote.id, old_status="DRAFT", new_status="SUBMITTED", changed_by_user_id=user_id)
        db.add(history)
        
        req = request_repo.get(db, quote.request_id)
        if req.status == RequestState.MATCHING.value:
            sm = RequestStateMachine(RequestState(req.status))
            sm.transition_to(RequestState.QUOTING, lambda o, n: setattr(req, "status", n.value))

        db.commit()
        db.refresh(quote)
        
        event_bus.publish("QUOTE_CREATED", {"quote_id": quote.id, "request_id": quote.request_id}, background_tasks)
        return quote

    def revise_quote(self, db: Session, quote_id: int, new_price: float, user_id: int, requested_by: str, notes: str = None) -> QuoteRevision:
        quote = quote_repo.get(db, quote_id)
        
        # Revizyon numarası hesapla
        existing_revisions = quote_revision_repo.get_by_quote(db, quote_id)
        rev_num = len(existing_revisions) + 1
        
        rev = QuoteRevision(
            quote_id=quote_id,
            revision_number=rev_num,
            old_total_price=quote.total_price,
            new_total_price=new_price,
            requested_by=requested_by,
            user_id=user_id,
            notes=notes
        )
        db.add(rev)
        
        quote.total_price = new_price
        quote.status = "NEGOTIATING"
        db.commit()
        db.refresh(rev)
        return rev

    def accept_quote(self, db: Session, quote_id: int, user_id: int, background_tasks: BackgroundTasks) -> Quote:
        quote = quote_repo.get(db, quote_id)
        
        # Diğer teklifleri reddet
        other_quotes = quote_repo.get_by_request(db, quote.request_id)
        for oq in other_quotes:
            if oq.id != quote.id:
                oq.status = "REJECTED"
                
        quote.status = "ACCEPTED"
        history = QuoteStatusHistory(quote_id=quote.id, new_status="ACCEPTED", changed_by_user_id=user_id)
        db.add(history)
        
        # Talep durumunu güncelle
        req = request_repo.get(db, quote.request_id)
        sm = RequestStateMachine(RequestState(req.status))
        sm.transition_to(RequestState.ACCEPTED, lambda o, n: setattr(req, "status", n.value))
        
        db.commit()
        db.refresh(quote)
        
        event_bus.publish("QUOTE_ACCEPTED", {"quote_id": quote.id, "request_id": quote.request_id}, background_tasks)
        return quote

quote_service = QuoteService()
