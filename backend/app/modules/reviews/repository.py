from sqlalchemy.orm import Session

from app.core.base.repository import BaseRepository
from app.modules.reviews.models import Review


class ReviewRepository(BaseRepository[Review, None, None]):
    def get_by_provider(self, db: Session, provider_id: int, skip: int = 0, limit: int = 50):
        return (
            db.query(self.model)
            .filter(self.model.provider_id == provider_id, self.model.status == "ACTIVE")
            .order_by(self.model.created_at.desc())
            .offset(skip).limit(limit)
            .all()
        )

    def get_by_request(self, db: Session, request_id: int):
        return db.query(self.model).filter(self.model.request_id == request_id).first()

    def exists(self, db: Session, request_id: int, customer_id: int) -> bool:
        return (
            db.query(self.model)
            .filter(self.model.request_id == request_id, self.model.customer_id == customer_id)
            .first() is not None
        )


review_repo = ReviewRepository(Review)
