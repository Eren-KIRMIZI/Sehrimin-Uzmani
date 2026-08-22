import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, engine
from app.modules.auth.models import RevokedToken
from app.modules.users.models import User
import app.main # This will import all routers and thus all models

from sqlalchemy import text

from app.core.config import settings

def reset_db():
    if settings.ENVIRONMENT == "production":
        print("HATA: Production ortamında reset_db çalıştırılamaz!")
        sys.exit(1)

    confirm = input(f"[{settings.ENVIRONMENT}] DİKKAT: Veritabanı (public schema) CASCADE ile SİLİNECEKTİR. Onaylıyor musunuz? (evet/hayir): ")
    if confirm.lower() != "evet":
        print("İşlem iptal edildi.")
        sys.exit(0)

    print("Dropping all tables with CASCADE...")
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
        conn.commit()
    
    print("Database reset complete.")
    print("Lütfen tabloları oluşturmak için 'alembic upgrade head' komutunu çalıştırın.")

if __name__ == "__main__":
    reset_db()

