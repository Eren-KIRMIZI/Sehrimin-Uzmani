from sqlalchemy.orm import Session

from app.core.base.repository import BaseRepository
from app.modules.requests.models import RequestMatch, ServiceRequest
from app.modules.requests.schemas import (  # Bunları varsayıyoruz
    ServiceRequestCreate,
    ServiceRequestUpdate,
)


class ServiceRequestRepository(
    BaseRepository[ServiceRequest, ServiceRequestCreate, ServiceRequestUpdate]
):
    def get_by_customer(
        self, db: Session, customer_id: int, skip: int = 0, limit: int = 100
    ):
        return (
            db.query(self.model)
            .filter(self.model.customer_id == customer_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_active_requests(self, db: Session):
        return (
            db.query(self.model)
            .filter(self.model.status.in_(["PUBLISHED", "MATCHING", "QUOTING"]))
            .all()
        )


class RequestMatchRepository(
    BaseRepository[RequestMatch, None, None]
):  # Şemaları şimdilik None geçiyoruz
    def get_matches_for_request(self, db: Session, request_id: int):
        return (
            db.query(self.model)
            .filter(self.model.request_id == request_id)
            .order_by(self.model.match_score.desc())
            .all()
        )


request_repo = ServiceRequestRepository(ServiceRequest)
match_repo = RequestMatchRepository(RequestMatch)
