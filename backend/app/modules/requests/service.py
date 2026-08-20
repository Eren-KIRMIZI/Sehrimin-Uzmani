from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.core.base.service import BaseService
from app.core.events.bus import event_bus
from app.modules.requests.models import RequestAttribute, ServiceRequest
from app.modules.requests.repository import ServiceRequestRepository, request_repo
from app.modules.requests.state import RequestState, RequestStateMachine


class RequestService(BaseService[ServiceRequestRepository, ServiceRequest, None, None]):
    def __init__(self):
        super().__init__(repository=request_repo)

    def publish_request(
        self, db: Session, request_id: int, background_tasks: BackgroundTasks
    ) -> ServiceRequest:
        req = self.get(db=db, id=request_id)
        if not req:
            raise ValueError("Talep bulunamadı")

        sm = RequestStateMachine(RequestState(req.status))

        def on_transition(old_state, new_state):
            req.status = new_state.value
            db.commit()
            db.refresh(req)
            event_bus.publish(
                "REQUEST_PUBLISHED", {"request_id": req.id}, background_tasks
            )

        sm.transition_to(RequestState.PUBLISHED, on_transition=on_transition)
        return req

    def create_request_from_ai_payload(
        self, db: Session, customer_id: int, ai_payload: dict, original_text: str
    ) -> ServiceRequest:
        """AI'dan dönen JSON (is_complete: true) verisini veritabanına işler"""
        # Şehir/Kategori ID eşleştirmeleri normalde burada yapılır (isimden ID bulma vb.)
        # Şimdilik örnek (Mock) ID'ler atıyoruz.

        req = ServiceRequest(
            customer_id=customer_id,
            city_id=1,  # Mock
            title=original_text[:50] + "...",
            description=original_text,
            urgency=ai_payload.get("urgency", "NORMAL"),
            status="DRAFT",
        )

        if ai_payload.get("budget"):
            req.budget_min = ai_payload["budget"].get("min")
            req.budget_max = ai_payload["budget"].get("max")

        db.add(req)
        db.flush()  # ID almak için

        # Dinamik attribute'ları ekle
        attributes = ai_payload.get("attributes", [])
        for attr in attributes:
            req_attr = RequestAttribute(
                request_id=req.id,
                attribute_name=attr.get("name"),
                attribute_value=attr.get("value"),
                confidence=attr.get("confidence"),
            )
            db.add(req_attr)

        db.commit()
        db.refresh(req)
        return req


request_service = RequestService()
