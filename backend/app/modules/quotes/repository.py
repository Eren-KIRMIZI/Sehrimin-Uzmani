from sqlalchemy.orm import Session

from app.core.base.repository import BaseRepository
from app.modules.quotes.models import Quote, QuoteItem, QuoteRevision


class QuoteRepository(BaseRepository[Quote, None, None]):
    def get_by_request(self, db: Session, request_id: int):
        return db.query(self.model).filter(self.model.request_id == request_id).all()

    def get_by_provider(self, db: Session, provider_id: int):
        return db.query(self.model).filter(self.model.provider_id == provider_id).all()


class QuoteItemRepository(BaseRepository[QuoteItem, None, None]):
    def get_by_quote(self, db: Session, quote_id: int):
        return db.query(self.model).filter(self.model.quote_id == quote_id).all()


class QuoteRevisionRepository(BaseRepository[QuoteRevision, None, None]):
    def get_by_quote(self, db: Session, quote_id: int):
        return (
            db.query(self.model)
            .filter(self.model.quote_id == quote_id)
            .order_by(self.model.revision_number.desc())
            .all()
        )


quote_repo = QuoteRepository(Quote)
quote_item_repo = QuoteItemRepository(QuoteItem)
quote_revision_repo = QuoteRevisionRepository(QuoteRevision)
