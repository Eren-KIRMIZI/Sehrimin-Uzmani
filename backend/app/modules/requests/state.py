from enum import Enum

from app.core.base.state_machine import BaseStateMachine


class RequestState(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    MATCHING = "MATCHING"
    QUOTING = "QUOTING"
    ACCEPTED = "ACCEPTED"
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class RequestStateMachine(BaseStateMachine):
    def __init__(self, current_state: RequestState):
        super().__init__(current_state)

        self.transitions = {
            RequestState.DRAFT: [RequestState.PUBLISHED, RequestState.CANCELLED],
            RequestState.PUBLISHED: [RequestState.MATCHING, RequestState.CANCELLED],
            RequestState.MATCHING: [RequestState.QUOTING, RequestState.CANCELLED],
            RequestState.QUOTING: [RequestState.ACCEPTED, RequestState.CANCELLED],
            RequestState.ACCEPTED: [RequestState.SCHEDULED, RequestState.CANCELLED],
            RequestState.SCHEDULED: [RequestState.IN_PROGRESS, RequestState.CANCELLED],
            RequestState.IN_PROGRESS: [RequestState.COMPLETED, RequestState.CANCELLED],
            RequestState.COMPLETED: [],
            RequestState.CANCELLED: []
        }
