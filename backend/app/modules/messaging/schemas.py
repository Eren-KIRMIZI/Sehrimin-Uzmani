from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ConversationCreate(BaseModel):
    provider_id: int
    request_id: Optional[int] = None


class MessageSend(BaseModel):
    content: Optional[str] = None
    message_type: str = "TEXT"
    attachment_url: Optional[str] = None


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: Optional[str]
    message_type: str
    attachment_url: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    customer_id: int
    provider_id: int
    request_id: Optional[int]
    last_message_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
