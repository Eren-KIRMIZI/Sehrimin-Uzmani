import os
import secrets
from pydantic_settings import BaseSettings
from typing import List
import json

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
    DEBUG: bool = True
    SECRET_KEY: str = _DEFAULT_SECRET
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str = "mssql+pyodbc://sa:YourPassword123@localhost/sehriminUzmani?driver=ODBC+Driver+17+for+SQL+Server"

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    CORS_ORIGINS: str = '["http://localhost:5173","http://localhost:3000"]'
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 10485760

    @property
    def cors_origins_list(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
