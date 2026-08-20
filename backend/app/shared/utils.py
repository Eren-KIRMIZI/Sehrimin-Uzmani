import os
import uuid
from datetime import datetime
from math import asin, cos, radians, sin, sqrt

from fastapi import UploadFile

from app.core.config import settings


def generate_uuid() -> str:
    return str(uuid.uuid4())


def slugify(text: str) -> str:
    import re

    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text)
    return text


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    km = 6371 * c
    return round(km, 2)


async def save_upload_file(file: UploadFile, folder: str = "") -> str:
    os.makedirs(os.path.join(settings.UPLOAD_DIR, folder), exist_ok=True)
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    filename = f"{generate_uuid()}.{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, folder, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    return filepath


def format_price(price: float) -> str:
    return f"₺{price:,.0f}"


def now_utc() -> datetime:
    return datetime.utcnow()
