from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from app.core.security import get_current_user
from app.modules.messaging.models import Conversation, Message
from app.modules.messaging.schemas import ConversationCreate, MessageSend
from app.modules.providers.models import ProviderProfile
from app.modules.users.models import User

router = APIRouter(prefix="/messaging", tags=["Messaging"])

BLOCKED_PATTERNS = [
    "whatsapp", "telegram", "instagram", "facebook",
    "arama yapiyorum", "arama yapıyorum",
    "numaram", "numaramı", "numara ver",
    "disarida bulusalim", "dışarıda buluşalım",
    "platform disinda", "platform dışı",
    "site disinda", "site dışı",
    "@gmail.com", "@hotmail.com", "@outlook.com", "@yahoo.com",
]

def check_content(content: str) -> str:
    lower = content.lower()
    for pattern in BLOCKED_PATTERNS:
        if pattern in lower:
            return None
    return content


@router.post("/conversations")
def create_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    provider = db.query(ProviderProfile).filter(ProviderProfile.id == data.provider_id).first()
    if not provider:
        raise NotFoundException("Uzman")

    existing = db.query(Conversation).filter(
        Conversation.customer_id == current_user.id,
        Conversation.provider_id == data.provider_id,
    ).first()
    if existing:
        return {"conversation_id": existing.id}

    conv = Conversation(
        customer_id=current_user.id,
        provider_id=data.provider_id,
        request_id=data.request_id,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return {"conversation_id": conv.id, "message": "Konusma olusturuldu"}


@router.get("/conversations")
def list_conversations(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    limit = min(limit, 50)
    page = max(1, page)

    provider = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()

    if provider:
        convs = db.query(Conversation).filter(Conversation.provider_id == provider.id).all()
    else:
        convs = db.query(Conversation).filter(Conversation.customer_id == current_user.id).all()

    result = []
    for conv in convs:
        last_msg = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.desc()).first()

        other_user = None
        if conv.customer_id == current_user.id and conv.provider_id:
            p = db.query(ProviderProfile).filter(ProviderProfile.id == conv.provider_id).first()
            if p:
                u = db.query(User).filter(User.id == p.user_id).first()
                if u:
                    other_user = {"id": u.id, "first_name": u.first_name, "last_name": u.last_name, "avatar": u.avatar}
        elif conv.provider_id:
            other_user = {"id": conv.customer_id}

        unread = db.query(Message).filter(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user.id,
        not Message.is_read,
    ).count()

        result.append({
            "id": conv.id,
            "request_id": conv.request_id,
            "last_message": {
                "content": last_msg.content if last_msg else None,
                "created_at": str(last_msg.created_at) if last_msg else None,
                "sender_id": last_msg.sender_id if last_msg else None,
            } if last_msg else None,
            "unread_count": unread,
            "other_user": other_user,
            "created_at": str(conv.created_at),
        })

    result.sort(key=lambda x: x["last_message"]["created_at"] if x["last_message"] else "", reverse=True)
    return result


@router.get("/conversations/{conversation_id}/messages")
def list_messages(
    conversation_id: int,
    page: int = 1,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    limit = min(limit, 100)

    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise NotFoundException("Konusma")

    is_participant = conv.customer_id == current_user.id
    if not is_participant and conv.provider_id:
        provider = db.query(ProviderProfile).filter(
            ProviderProfile.id == conv.provider_id, ProviderProfile.user_id == current_user.id
        ).first()
        is_participant = provider is not None

    if not is_participant:
        raise ForbiddenException("Bu konusmaya erisim yetkiniz yok")

    offset = (max(1, page) - 1) * limit
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    messages.reverse()

    db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user.id,
        not Message.is_read,
    ).update({"is_read": True})
    db.commit()

    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "content": m.content,
            "message_type": m.message_type,
            "attachment_url": m.attachment_url,
            "is_read": m.is_read,
            "created_at": str(m.created_at),
        }
        for m in messages
    ]


@router.post("/conversations/{conversation_id}/messages")
def send_message_rest(
    conversation_id: int,
    data: MessageSend,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise NotFoundException("Konusma")

    is_participant = conv.customer_id == current_user.id
    if not is_participant and conv.provider_id:
        provider = db.query(ProviderProfile).filter(
            ProviderProfile.id == conv.provider_id, ProviderProfile.user_id == current_user.id
        ).first()
        is_participant = provider is not None

    if not is_participant:
        raise ForbiddenException("Bu konusmaya mesaj gonderme yetkiniz yok")

    if not data.content or len(data.content.strip()) == 0:
        raise BadRequestException("Mesaj icerigi bos olamaz")
    if len(data.content) > 2000:
        raise BadRequestException("Mesaj icerigi 2000 karakterden uzun olamaz")

    filtered = check_content(data.content)
    if filtered is None:
        raise BadRequestException("Mesaj icerigi platform kurallarina aykiri (iletisim bilgisi paylasimi)")

    message = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=data.content,
        message_type=data.message_type,
        attachment_url=data.attachment_url,
    )
    db.add(message)
    conv.last_message_at = message.created_at
    db.commit()
    db.refresh(message)

    return {
        "id": message.id,
        "conversation_id": conversation_id,
        "sender_id": current_user.id,
        "content": message.content,
        "message_type": message.message_type,
        "created_at": str(message.created_at),
    }


@router.get("/unread-count")
def unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    provider = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()

    if provider:
        conv_ids = [c.id for c in db.query(Conversation).filter(Conversation.provider_id == provider.id).all()]
    else:
        conv_ids = [c.id for c in db.query(Conversation).filter(Conversation.customer_id == current_user.id).all()]

    count = 0
    if conv_ids:
        count = db.query(Message).filter(
            Message.conversation_id.in_(conv_ids),
            Message.sender_id != current_user.id,
            not Message.is_read,
        ).count()

    return {"count": count}
