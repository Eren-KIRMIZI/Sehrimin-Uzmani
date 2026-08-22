from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from app.ai.service import chat_service_request
from app.core.rate_limiter import rate_limiter
from app.core.security import get_current_user
from app.modules.users.models import User

router = APIRouter(prefix="/ai", tags=["AI"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequestBody(BaseModel):
    text: str
    history: list[ChatMessage] | None = []


@router.post("/chat-request")
async def chat_request(
    request: Request,
    body: ChatRequestBody,
    current_user: User = Depends(get_current_user),
):
    rate_limiter.check(
        key=f"ai_chat:{current_user.id}",
        max_requests=10,
        window_seconds=60,
        strict=True,
    )
    """
    Kullanıcının serbest metin talebini diyalog bazlı analiz eder.
    Eksik bilgi varsa soru sorar, tamamlandıysa JSON döndürür.
    """
    history_dicts = (
        [{"role": msg.role, "content": msg.content} for msg in body.history]
        if body.history
        else []
    )

    result = await chat_service_request(body.text, history_dicts)
    return result


# Diğer match_explanation endpoint'i mevcut olduğu varsayımıyla (kısaltıldı)
