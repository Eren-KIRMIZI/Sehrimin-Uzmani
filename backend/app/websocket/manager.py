import json
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect
from app.core.security import decode_token
from app.core.database import SessionLocal
from app.modules.users.models import User
from app.modules.providers.models import ProviderProfile
from app.modules.messaging.models import Conversation, Message

BLOCKED_PATTERNS = [
    "whatsapp", "telegram", "instagram", "facebook",
    "arama yapiyorum", "arama yapıyorum",
    "numaram", "numaramı", "numara ver",
    "disarida bulusalim", "dışarıda buluşalım",
    "platform disinda", "platform dışı",
    "site disinda", "site dışı",
    "@gmail.com", "@hotmail.com", "@outlook.com", "@yahoo.com",
]

def _is_content_blocked(content: str) -> bool:
    lower = content.lower()
    for pattern in BLOCKED_PATTERNS:
        if pattern in lower:
            return True
    return False


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def broadcast_to_conversation(self, conversation_id: int, sender_id: int, message: dict, db):
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            return

        participants = set()
        if conv.customer_id:
            participants.add(conv.customer_id)
        if conv.provider_id:
            provider = db.query(ProviderProfile).filter(ProviderProfile.id == conv.provider_id).first()
            if provider:
                participants.add(provider.user_id)

        for uid in participants:
            if uid != sender_id:
                await self.send_to_user(uid, message)


manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket, token: str):
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            await websocket.close(code=4001)
            return
        user_id = int(payload.get("sub", 0))
        if not user_id:
            await websocket.close(code=4001)
            return
    except Exception:
        await websocket.close(code=4001)
        return

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if not user:
            await websocket.close(code=4001)
            return

        await manager.connect(websocket, user_id)

        try:
            while True:
                data = await websocket.receive_text()
                msg_data = json.loads(data)

                action = msg_data.get("action")

                if action == "send_message":
                    conversation_id = msg_data.get("conversation_id")
                    content = msg_data.get("content", "")
                    message_type = msg_data.get("message_type", "TEXT")

                    if not content or len(content.strip()) == 0:
                        await websocket.send_json({"error": "Mesaj icerigi bos olamaz"})
                        continue
                    if len(content) > 2000:
                        await websocket.send_json({"error": "Mesaj icerigi 2000 karakterden uzun olamaz"})
                        continue
                    if _is_content_blocked(content):
                        await websocket.send_json({"error": "Mesaj icerigi platform kurallarina aykiri (iletisim bilgisi paylasimi)"})
                        continue

                    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
                    if not conv:
                        await websocket.send_json({"error": "Konusma bulunamadi"})
                        continue

                    is_participant = (
                        conv.customer_id == user_id or
                        (conv.provider_id and _is_provider_owner(conv.provider_id, user_id, db))
                    )
                    if not is_participant:
                        await websocket.send_json({"error": "Yetkiniz yok"})
                        continue

                    message = Message(
                        conversation_id=conversation_id,
                        sender_id=user_id,
                        content=content,
                        message_type=message_type,
                    )
                    db.add(message)
                    conv.last_message_at = message.created_at
                    db.commit()
                    db.refresh(message)

                    response = {
                        "action": "new_message",
                        "message": {
                            "id": message.id,
                            "conversation_id": conversation_id,
                            "sender_id": user_id,
                            "content": content,
                            "message_type": message_type,
                            "is_read": False,
                            "created_at": str(message.created_at),
                        }
                    }

                    await websocket.send_json(response)
                    await manager.broadcast_to_conversation(conversation_id, user_id, response, db)

                elif action == "mark_read":
                    conversation_id = msg_data.get("conversation_id")
                    conv_check = db.query(Conversation).filter(Conversation.id == conversation_id).first()
                    if not conv_check:
                        continue
                    is_part = conv_check.customer_id == user_id or (
                        conv_check.provider_id and _is_provider_owner(conv_check.provider_id, user_id, db)
                    )
                    if not is_part:
                        await websocket.send_json({"error": "Yetkiniz yok"})
                        continue
                    db.query(Message).filter(
                        Message.conversation_id == conversation_id,
                        Message.sender_id != user_id,
                        Message.is_read == False,
                    ).update({"is_read": True})
                    db.commit()

                elif action == "typing":
                    conversation_id = msg_data.get("conversation_id")
                    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
                    if conv:
                        participant_ids = set()
                        participant_ids.add(conv.customer_id)
                        if conv.provider_id:
                            provider = db.query(ProviderProfile).filter(ProviderProfile.id == conv.provider_id).first()
                            if provider:
                                participant_ids.add(provider.user_id)

                        for pid in participant_ids:
                            if pid != user_id:
                                await manager.send_to_user(pid, {
                                    "action": "typing",
                                    "conversation_id": conversation_id,
                                    "user_id": user_id,
                                })

        except WebSocketDisconnect:
            manager.disconnect(websocket, user_id)
    finally:
        db.close()
        manager.disconnect(websocket, user_id)


def _is_provider_owner(provider_id: int, user_id: int, db) -> bool:
    provider = db.query(ProviderProfile).filter(
        ProviderProfile.id == provider_id, ProviderProfile.user_id == user_id
    ).first()
    return provider is not None
