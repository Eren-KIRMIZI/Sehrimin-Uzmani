from sqlalchemy.orm import Session

from app.core.base.repository import BaseRepository
from app.modules.appointments.models import Appointment


class AppointmentRepository(BaseRepository[Appointment, None, None]):
    def get_by_request(self, db: Session, request_id: int):
        return db.query(self.model).filter(self.model.request_id == request_id).first()

    def get_by_provider(self, db: Session, provider_id: int):
        return db.query(self.model).filter(self.model.provider_id == provider_id).all()

    def get_by_customer(self, db: Session, customer_id: int):
        return db.query(self.model).filter(self.model.customer_id == customer_id).all()

    def get_active(self, db: Session, provider_id: int):
        return (
            db.query(self.model)
            .filter(
                self.model.provider_id == provider_id,
                self.model.status.in_(["PENDING", "CONFIRMED", "IN_PROGRESS"])
            )
            .all()
        )


appointment_repo = AppointmentRepository(Appointment)
