"""
WebSocket bağlantı yönetimi — production sertleştirmesi.

Değişiklikler:
- Ping/Pong: Client {"action": "ping"} gönderince {"action": "pong"} alır
- Receive timeout: 90 saniye sessizlik sonrası bağlantı kopar (zombie önleme)
- JSON hata yönetimi: Geçersiz JSON'da bağlantı düşmez, hata mesajı döner
- Bağlantı havuzu boyutu loglama
"""

import asyncio
import json
import logging
import threading

from fastapi import WebSocket, WebSocketDisconnect

from app.core.database import SessionLocal
from app.core.redis import redis_client
from app.core.metrics import (
    WS_AUTH_FAILURES_TOTAL,
    WS_CONNECTIONS_ACTIVE,
    WS_CONNECTIONS_CLOSED_TOTAL,
    WS_CONNECTIONS_OPENED_TOTAL,
    WS_MESSAGES_RECEIVED_TOTAL,
    WS_MESSAGES_SENT_TOTAL,
    WS_SEND_ERRORS_TOTAL,
    ws_action_label,
)
from app.core.security import check_token_blacklist, decode_token
from app.modules.messaging.models import Conversation, Message
from app.modules.providers.models import ProviderProfile
from app.modules.users.models import User

logger = logging.getLogger(__name__)

# 90 saniye içinde hiç mesaj gelmezse bağlantıyı kapat
_WS_RECEIVE_TIMEOUT = 90.0

BLOCKED_PATTERNS = [
    "whatsapp",
    "telegram",
    "instagram",
    "facebook",
    "arama yapiyorum",
    "arama yapıyorum",
    "numaram",
    "numaramı",
    "numara ver",
    "disarida bulusalim",
    "dışarıda buluşalım",
    "platform disinda",
    "platform dışı",
    "site disinda",
    "site dışı",
    "@gmail.com",
    "@hotmail.com",
    "@outlook.com",
    "@yahoo.com",
]


def _is_content_blocked(content: str) -> bool:
    lower = content.lower()
    return any(pattern in lower for pattern in BLOCKED_PATTERNS)


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, set[WebSocket]] = {}
        self.pubsub = redis_client.pubsub()
        self.pubsub.subscribe("ws_messages")
        self.loop = None
        self._listener_thread = None

    def start_listener(self, loop):
        if self._listener_thread is None:
            self.loop = loop
            self._listener_thread = threading.Thread(target=self._listen_to_redis, daemon=True)
            self._listener_thread.start()

    def _listen_to_redis(self):
        for message in self.pubsub.listen():
            if message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    user_id = data.get("user_id")
                    msg_payload = data.get("message")
                    if user_id and msg_payload and self.loop:
                        asyncio.run_coroutine_threadsafe(
                            self._send_to_user_local(user_id, msg_payload),
                            self.loop
                        )
                except Exception as e:
                    logger.error("Error processing redis message: %s", str(e))

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if self._listener_thread is None:
            self.start_listener(asyncio.get_running_loop())

        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        WS_CONNECTIONS_ACTIVE.inc()
        WS_CONNECTIONS_OPENED_TOTAL.inc()
        logger.info(
            "WebSocket baglantisi kuruldu",
            extra={"user_id": user_id, "total_connections": self._total_connections()},
        )

    def disconnect(self, websocket: WebSocket, user_id: int, reason: str = "normal"):
        was_connected = False
        if user_id in self.active_connections:
            was_connected = websocket in self.active_connections[user_id]
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        if was_connected:
            WS_CONNECTIONS_ACTIVE.dec()
            WS_CONNECTIONS_CLOSED_TOTAL.labels(reason=reason).inc()
        logger.info(
            "WebSocket baglantisi kapatildi",
            extra={
                "user_id": user_id,
                "reason": reason,
                "total_connections": self._total_connections(),
            },
        )

    def _total_connections(self) -> int:
        return sum(len(conns) for conns in self.active_connections.values())

    async def _send_to_user_local(self, user_id: int, message: dict):
        if user_id not in self.active_connections:
            return
        dead_connections: set[WebSocket] = set()
        for connection in self.active_connections[user_id]:
            try:
                await connection.send_json(message)
                WS_MESSAGES_SENT_TOTAL.inc()
            except Exception:
                dead_connections.add(connection)
                WS_SEND_ERRORS_TOTAL.inc()
        # Ölü bağlantıları temizle
        for conn in dead_connections:
            self.active_connections[user_id].discard(conn)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: int, message: dict):
        # Mesajı direkt göndermek yerine, Redis Pub/Sub ile yayınlıyoruz (çoklu-worker desteği)
        payload = json.dumps({"user_id": user_id, "message": message})
        await asyncio.to_thread(redis_client.publish, "ws_messages", payload)

    async def send_personal_notification(self, user_id: int, notification: dict):
        await self.send_to_user(
            user_id,
            {
                "action": "new_notification",
                "notification": notification,
            },
        )

    async def broadcast_to_conversation(
        self, conversation_id: int, sender_id: int, message: dict, db
    ):
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            return

        participants = set()
        if conv.customer_id:
            participants.add(conv.customer_id)
        if conv.provider_id:
            provider = (
                db.query(ProviderProfile)
                .filter(ProviderProfile.id == conv.provider_id)
                .first()
            )
            if provider:
                participants.add(provider.user_id)

        for uid in participants:
            if uid != sender_id:
                await self.send_to_user(uid, message)


manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket, token: str):
    # ── Auth ──────────────────────────────────────────────────────────────────
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            WS_AUTH_FAILURES_TOTAL.inc()
            await websocket.close(code=4001, reason="Invalid token type")
            return
        user_id = int(payload.get("sub", 0))
        if not user_id:
            WS_AUTH_FAILURES_TOTAL.inc()
            await websocket.close(code=4001, reason="Invalid user ID")
            return
    except Exception as e:
        logger.warning("WebSocket auth hatasi: %s", str(e))
        WS_AUTH_FAILURES_TOTAL.inc()
        await websocket.close(code=4001, reason="Auth failed")
        return

    db = SessionLocal()
    connected = False
    close_reason = "normal"
    try:
        if check_token_blacklist(token, db):
            WS_AUTH_FAILURES_TOTAL.inc()
            await websocket.close(code=4001, reason="Token revoked")
            return

        user = await asyncio.to_thread(
            lambda: db.query(User).filter(User.id == user_id, User.is_active).first()
        )
        if not user:
            WS_AUTH_FAILURES_TOTAL.inc()
            await websocket.close(code=4001, reason="User not found or inactive")
            return

        await manager.connect(websocket, user_id)
        connected = True

        try:
            while True:
                # ── Timeout: 90s sessizlik sonrası bağlantıyı kapat ────────
                try:
                    raw = await asyncio.wait_for(
                        websocket.receive_text(),
                        timeout=_WS_RECEIVE_TIMEOUT,
                    )
                except asyncio.TimeoutError:
                    close_reason = "timeout"
                    logger.info(
                        "WebSocket zaman asimi — baglanti kapatiliyor",
                        extra={"user_id": user_id},
                    )
                    await websocket.close(code=1001, reason="Connection timeout")
                    break

                # ── JSON Parse ────────────────────────────────────────────
                try:
                    msg_data = json.loads(raw)
                except json.JSONDecodeError:
                    await websocket.send_json({"error": "Geçersiz JSON formatı"})
                    continue

                action = msg_data.get("action")
                WS_MESSAGES_RECEIVED_TOTAL.labels(action=ws_action_label(action)).inc()

                # ── Ping/Pong ─────────────────────────────────────────────
                if action == "ping":
                    await websocket.send_json({"action": "pong"})
                    continue

                # ── Mesaj Gönder ──────────────────────────────────────────
                elif action == "send_message":
                    await _handle_send_message(websocket, user_id, msg_data, db)

                # ── Okundu İşaretle ───────────────────────────────────────
                elif action == "mark_read":
                    await _handle_mark_read(websocket, user_id, msg_data, db)

                # ── Yazıyor Göstergesi ────────────────────────────────────
                elif action == "typing":
                    await _handle_typing(user_id, msg_data, db)

                else:
                    await websocket.send_json(
                        {"error": f"Bilinmeyen action: {action!r}"}
                    )

        except WebSocketDisconnect:
            pass  # Normal kapanma
        except Exception as e:
            close_reason = "error"
            logger.error(
                "WebSocket döngüsünde hata",
                extra={"user_id": user_id, "error": str(e)},
                exc_info=True,
            )
    finally:
        if connected:
            manager.disconnect(websocket, user_id, reason=close_reason)
        db.close()


async def _handle_send_message(websocket: WebSocket, user_id: int, msg_data: dict, db):
    conversation_id = msg_data.get("conversation_id")
    content = msg_data.get("content", "")
    message_type = msg_data.get("message_type", "TEXT")

    if not content or not content.strip():
        await websocket.send_json({"error": "Mesaj icerigi bos olamaz"})
        return
    if len(content) > 2000:
        await websocket.send_json(
            {"error": "Mesaj icerigi 2000 karakterden uzun olamaz"}
        )
        return
    if _is_content_blocked(content):
        await websocket.send_json(
            {
                "error": "Mesaj icerigi platform kurallarina aykiri (iletisim bilgisi paylasimi)"
            }
        )
        return

    conv = await asyncio.to_thread(
        lambda: (
            db.query(Conversation).filter(Conversation.id == conversation_id).first()
        )
    )
    if not conv:
        await websocket.send_json({"error": "Konusma bulunamadi"})
        return

    is_provider_owner = False
    if conv.provider_id:
        is_provider_owner = await asyncio.to_thread(
            _is_provider_owner, conv.provider_id, user_id, db
        )

    is_participant = conv.customer_id == user_id or is_provider_owner
    if not is_participant:
        await websocket.send_json({"error": "Yetkiniz yok"})
        return

    def _save_message():
        msg = Message(
            conversation_id=conversation_id,
            sender_id=user_id,
            content=content,
            message_type=message_type,
        )
        db.add(msg)
        conv.last_message_at = msg.created_at
        db.commit()
        db.refresh(msg)
        return msg

    message = await asyncio.to_thread(_save_message)

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
        },
    }
    await websocket.send_json(response)
    await manager.broadcast_to_conversation(conversation_id, user_id, response, db)


async def _handle_mark_read(websocket: WebSocket, user_id: int, msg_data: dict, db):
    conversation_id = msg_data.get("conversation_id")
    conv = await asyncio.to_thread(
        lambda: (
            db.query(Conversation).filter(Conversation.id == conversation_id).first()
        )
    )
    if not conv:
        return

    is_provider_owner = False
    if conv.provider_id:
        is_provider_owner = await asyncio.to_thread(
            _is_provider_owner, conv.provider_id, user_id, db
        )

    is_part = conv.customer_id == user_id or is_provider_owner
    if not is_part:
        await websocket.send_json({"error": "Yetkiniz yok"})
        return

    def _update_read():
        db.query(Message).filter(
            Message.conversation_id == conversation_id,
            Message.sender_id != user_id,
            Message.is_read == False,  # noqa: E712
        ).update({"is_read": True})
        db.commit()

    await asyncio.to_thread(_update_read)


async def _handle_typing(user_id: int, msg_data: dict, db):
    conversation_id = msg_data.get("conversation_id")
    conv = await asyncio.to_thread(
        lambda: (
            db.query(Conversation).filter(Conversation.id == conversation_id).first()
        )
    )
    if not conv:
        return
    participant_ids = set()
    participant_ids.add(conv.customer_id)
    if conv.provider_id:
        provider = await asyncio.to_thread(
            lambda: (
                db.query(ProviderProfile)
                .filter(ProviderProfile.id == conv.provider_id)
                .first()
            )
        )
        if provider:
            participant_ids.add(provider.user_id)

    for pid in participant_ids:
        if pid != user_id:
            await manager.send_to_user(
                pid,
                {
                    "action": "typing",
                    "conversation_id": conversation_id,
                    "user_id": user_id,
                },
            )


def _is_provider_owner(provider_id: int, user_id: int, db) -> bool:
    provider = (
        db.query(ProviderProfile)
        .filter(
            ProviderProfile.id == provider_id,
            ProviderProfile.user_id == user_id,
        )
        .first()
    )
    return provider is not None
