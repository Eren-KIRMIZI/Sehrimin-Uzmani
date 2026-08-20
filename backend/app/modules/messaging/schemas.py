from datetime import datetime

from pydantic import BaseModel


class ConversationCreate(BaseModel):
    provider_id: int
    request_id: int | None = None


class MessageSend(BaseModel):
    content: str | None = None
    message_type: str = "TEXT"
    attachment_url: str | None = None


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str | None
    message_type: str
    attachment_url: str | None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    customer_id: int
    provider_id: int
    request_id: int | None
    last_message_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True
