from sqlalchemy.orm import Session
from app.modules.notifications.models import Notification
from app.websocket.manager import manager
import asyncio
import logging

logger = logging.getLogger(__name__)


def send_realtime_notification_sync(user_id: int, notification_data: dict):
    """
    Snychronous helper to dispatch an async websocket message using asyncio.
    """
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.send_personal_notification(user_id, notification_data))
    except RuntimeError:
        # No running event loop
        pass
    except Exception as e:
        logger.error(f"Failed to send realtime notification: {e}")


def create_notification(
    db: Session,
    user_id: int,
    type_str: str,
    title: str,
    message: str,
    data: dict = None,
    action_url: str = None
) -> Notification:
    notif = Notification(
        user_id=user_id,
        type=type_str,
        title=title,
        message=message,
        data=data,
        action_url=action_url
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    notif_data = {
        "id": notif.id,
        "user_id": notif.user_id,
        "type": notif.type.value if hasattr(notif.type, "value") else notif.type,
        "title": notif.title,
        "message": notif.message,
        "data": notif.data,
        "action_url": notif.action_url,
        "is_read": notif.is_read,
        "created_at": str(notif.created_at)
    }
    
    send_realtime_notification_sync(user_id, notif_data)
    
    return notif
