import sys
import os
import getpass
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.modules.users.models import User
from app.core.security import get_password_hash

def create_or_update_admin():
    email = input("Admin Email [admin@sehriminuzmani.com]: ").strip() or "admin@sehriminuzmani.com"
    password = getpass.getpass("Admin Password: ")
    if not password:
        print("Şifre boş olamaz!")
        sys.exit(1)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        hashed = get_password_hash(password)

        if user:
            user.password_hash = hashed
            user.role = "ADMIN"
            user.is_active = True
            user.email_verified = True
            print(f"Admin kullanıcısı güncellendi: {email}")
        else:
            user = User(
                email=email,
                first_name="Admin",
                last_name="User",
                password_hash=hashed,
                role="ADMIN",
                is_active=True,
                email_verified=True
            )
            db.add(user)
            print(f"Admin kullanıcısı oluşturuldu: {email}")

        db.commit()
    except Exception as e:
        print(f"Hata: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_or_update_admin()
