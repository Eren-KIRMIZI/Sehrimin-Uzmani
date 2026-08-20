import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load env
from dotenv import load_dotenv
load_dotenv()

import psycopg2
from passlib.context import CryptContext

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+psycopg2://sehrim_admin:sehrim2026!@localhost:5432/sehriminuzmani")
# Parse URL for psycopg2
# postgresql+psycopg2://user:pass@host:port/db
url = DATABASE_URL.replace("postgresql+psycopg2://", "")
user_pass, rest = url.split("@", 1)
host_port, db = rest.split("/", 1)
if ":" in user_pass:
    user, password = user_pass.split(":", 1)
else:
    user, password = user_pass, ""
if ":" in host_port:
    host, port = host_port.split(":", 1)
else:
    host, port = host_port, "5432"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed = pwd_context.hash("REDACTED_DEMO_PASS")

conn = psycopg2.connect(dbname=db, user=user, password=password, host=host, port=port)
cur = conn.cursor()

cur.execute("SELECT id FROM users WHERE email = %s", ("admin@sehriminuzmani.com",))
row = cur.fetchone()

if row:
    cur.execute(
        "UPDATE users SET password_hash=%s, role=%s, is_active=%s, email_verified=%s WHERE email=%s",
        (hashed, "ADMIN", True, True, "admin@sehriminuzmani.com")
    )
    print("Admin kullanici guncellendi!")
else:
    cur.execute(
        """INSERT INTO users (email, first_name, last_name, password_hash, role, is_active, email_verified, created_at, updated_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())""",
        ("admin@sehriminuzmani.com", "Admin", "User", hashed, "ADMIN", True, True)
    )
    print("Admin kullanici olusturuldu!")

conn.commit()
cur.close()
conn.close()
print("Giriş bilgileri: admin@sehriminuzmani.com / REDACTED_DEMO_PASS")
