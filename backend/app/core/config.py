import json
import os
import secrets
from typing import Literal

from pydantic_settings import BaseSettings

_DEFAULT_SECRET = os.environ.get("SECRET_KEY", "")
if not _DEFAULT_SECRET:
    _DEFAULT_SECRET = secrets.token_urlsafe(64)
    import warnings
    warnings.warn(
        "SECRET_KEY .env dosyasinda bulunamadi! Otomatik olusturuldu. "
        "Uretim ortaminda .env dosyasina SECRET_KEY ekleyin!",
        stacklevel=2,
    )


class Settings(BaseSettings):
    APP_NAME: str = "SehrininUzmani"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = False
    SECRET_KEY: str = _DEFAULT_SECRET
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str = "postgresql+psycopg2://sehrim_admin:sehrim2026!@localhost:5432/sehriminuzmani"

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""
    REDIS_SSL: bool = False

    CORS_ORIGINS: str = '["http://localhost:5173","http://localhost:3000"]'
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 10485760  # 10 MB

    # OpenRouter AI
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "google/gemini-2.0-flash-001"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    @property
    def cors_origins_list(self) -> list[str]:
        return json.loads(self.CORS_ORIGINS)

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    class Config:
        env_file = ".env"
        case_sensitive = True

    def validate_security(self):
        """Development ve üzeri ortamlar için temel güvenlik kontrolleri."""
        if len(self.SECRET_KEY) < 32:
            raise ValueError("SECRET_KEY 32 karakterden uzun olmalidir")
        if self.DEBUG:
            import warnings
            warnings.warn("DEBUG modu aktif! Uretim ortaminda DEBUG=false yapin.", stacklevel=1)

    def validate_production(self):
        """Sadece production ortamında zorunlu kontroller."""
        if self.ENVIRONMENT != "production":
            return
        errors = []
        if self.DEBUG:
            errors.append("Production ortaminda DEBUG=false olmalidir")
        if len(self.SECRET_KEY) < 64:
            errors.append("Production ortaminda SECRET_KEY en az 64 karakter olmalidir")
        if not self.OPENROUTER_API_KEY:
            errors.append("Production ortaminda OPENROUTER_API_KEY zorunludur")
        if "sehrim2026!" in self.DATABASE_URL:
            errors.append("Production ortaminda varsayilan veritabani sifresi kullanilmamalidir")
        if errors:
            raise ValueError(
                "Production ortami guvenlik kontrolleri basarisiz:\n" +
                "\n".join(f"  - {e}" for e in errors)
            )


settings = Settings()
settings.validate_security()
settings.validate_production()
