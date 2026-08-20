from sqlalchemy import Column, String, Boolean, Text
from app.core.base.models import BaseModel


class SystemSetting(BaseModel):
    """
    Sistem geneli anahtar-deger ayarlari.
    Ornegin: seed tamamlandi flagi, bakim modu, vb.
    """
    __tablename__ = "system_settings"

    key = Column(String(100), nullable=False, unique=True, index=True)
    value = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
