import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings


def _get_key() -> bytes:
    raw = settings.SECRET_KEY.encode("utf-8")
    return raw[:32].ljust(32, b"\0")


def encrypt(plaintext: str) -> str:
    if not plaintext:
        return plaintext
    key = _get_key()
    nonce = os.urandom(12)
    aesgcm = AESGCM(key)
    ct = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return base64.b64encode(nonce + ct).decode("utf-8")


def decrypt(ciphertext: str) -> str:
    if not ciphertext:
        return ciphertext
    key = _get_key()
    raw = base64.b64decode(ciphertext)
    nonce = raw[:12]
    ct = raw[12:]
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ct, None).decode("utf-8")
