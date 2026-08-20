from sqlalchemy.orm import Session
from fastapi import BackgroundTasks
from app.core.base.service import BaseService
from app.modules.requests.models import ServiceRequest
from app.modules.requests.repository import request_repo, ServiceRequestRepository
from app.modules.requests.state import RequestStateMachine, RequestState
from app.core.events.bus import event_bus

class RequestService(BaseService[ServiceRequestRepository, ServiceRequest, None, None]):
    def __init__(self):
        super().__init__(repository=request_repo)

    def publish_request(self, db: Session, request_id: int, background_tasks: BackgroundTasks) -> ServiceRequest:
        req = self.get(db=db, id=request_id)
        if not req:
            raise ValueError("Talep bulunamadı")
        
        sm = RequestStateMachine(RequestState(req.status))
        
        def on_transition(old_state, new_state):
            req.status = new_state.value
            db.commit()
            db.refresh(req)
            # Event fırlat
            event_bus.publish("REQUEST_PUBLISHED", {"request_id": req.id}, background_tasks)

        sm.transition_to(RequestState.PUBLISHED, on_transition=on_transition)
        return req

request_service = RequestService()
