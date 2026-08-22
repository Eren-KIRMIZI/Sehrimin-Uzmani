"""
Demo provider seed script - standalone.
"""
from app.main import app  # noqa - triggers all module imports
from app.core.database import SessionLocal
from app.modules.users.models import User
from app.modules.locations.models import City, ProviderLocation
from app.modules.categories.models import Service, ProviderService
from app.modules.providers.models import ProviderProfile, ProviderPerformance
from passlib.context import CryptContext

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
db = SessionLocal()

istanbul = db.query(City).filter(City.name == "İstanbul").first()
ankara = db.query(City).filter(City.name == "Ankara").first()
izmir = db.query(City).filter(City.name == "İzmir").first()
antalya = db.query(City).filter(City.name == "Antalya").first()
bursa = db.query(City).filter(City.name == "Bursa").first()

services = db.query(Service).limit(30).all()
sids = [s.id for s in services]

PROVIDERS = [
    {
        "email": "ali.yilmaz@demo.com", "first": "Ali", "last": "Yilmaz",
        "business": "Yilmaz Temizlik", "bio": "Istanbul da 8 yildir ev temizligi hizmetleri.",
        "city": istanbul, "rate": 350, "exp": 8, "rating": 4.8, "jobs": 234,
        "verif": "BASIC", "svcs": sids[:3],
    },
    {
        "email": "mehmet.kaya@demo.com", "first": "Mehmet", "last": "Kaya",
        "business": "Kaya Elektrik Tesisat", "bio": "Ankara da lisansli elektrikci 12 yil deneyim.",
        "city": ankara, "rate": 500, "exp": 12, "rating": 4.9, "jobs": 512,
        "verif": "PROFESSIONAL", "svcs": sids[5:8],
    },
    {
        "email": "fatma.demir@demo.com", "first": "Fatma", "last": "Demir",
        "business": "Demir Boyacilik", "bio": "Izmir de 6 yildir boyacilik.",
        "city": izmir, "rate": 400, "exp": 6, "rating": 4.6, "jobs": 178,
        "verif": "BASIC", "svcs": sids[10:13],
    },
    {
        "email": "hasan.celik@demo.com", "first": "Hasan", "last": "Celik",
        "business": "Celik Nakliyat", "bio": "Antalya da sigortali ev tasimaciligi.",
        "city": antalya or istanbul, "rate": 600, "exp": 10, "rating": 4.7, "jobs": 320,
        "verif": "BUSINESS", "svcs": sids[15:18],
    },
    {
        "email": "zeynep.arslan@demo.com", "first": "Zeynep", "last": "Arslan",
        "business": "Arslan Evcil Hayvan Bakimi", "bio": "Bursa da kedi kopek bakim hizmeti.",
        "city": bursa or istanbul, "rate": 280, "exp": 4, "rating": 5.0, "jobs": 89,
        "verif": "ID", "svcs": sids[:2],
    },
    {
        "email": "emre.ozturk@demo.com", "first": "Emre", "last": "Ozturk",
        "business": "Ozturk Bilgisayar", "bio": "Istanbul da 9 yildir bilgisayar tamiri.",
        "city": istanbul, "rate": 450, "exp": 9, "rating": 4.5, "jobs": 445,
        "verif": "BASIC", "svcs": sids[3:6],
    },
    {
        "email": "ayse.yildiz@demo.com", "first": "Ayse", "last": "Yildiz",
        "business": "Yildiz Ozel Ders", "bio": "Ankara da matematik fizik ozel ders.",
        "city": ankara, "rate": 200, "exp": 7, "rating": 4.9, "jobs": 156,
        "verif": "PROFESSIONAL", "svcs": sids[8:11],
    },
    {
        "email": "can.sahin@demo.com", "first": "Can", "last": "Sahin",
        "business": "Sahin Guvenlik Sistemleri", "bio": "Izmir de kamera ve alarm sistemleri.",
        "city": izmir, "rate": 550, "exp": 11, "rating": 4.7, "jobs": 267,
        "verif": "BUSINESS", "svcs": sids[12:15],
    },
]

created = 0
for i, d in enumerate(PROVIDERS):
    user = db.query(User).filter(User.email == d["email"]).first()
    if not user:
        user = User(
            email=d["email"],
            password_hash=pwd_ctx.hash("Demo1234!"),
            first_name=d["first"],
            last_name=d["last"],
            role="PROVIDER",
            is_active=True,
            email_verified=True,
        )
        db.add(user)
        db.flush()

    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == user.id).first()
    if not profile:
        city = d["city"]
        profile = ProviderProfile(
            user_id=user.id,
            business_name=d["business"],
            bio=d["bio"],
            experience_years=d["exp"],
            is_available=True,
            verification_status=d["verif"],
        )
        db.add(profile)
        db.flush()

        db.add(ProviderPerformance(
            provider_id=profile.id,
            rating=d["rating"],
            review_count=d["jobs"] // 3,
            completed_jobs=d["jobs"],
            average_response_time=15,
        ))

        db.add(ProviderLocation(
            provider_id=profile.id,
            city_id=city.id,
            latitude=41.0 + (i % 5) * 0.1,
            longitude=28.9 + (i % 5) * 0.05,
        ))
        db.flush()

        for svc_id in d["svcs"]:
            db.add(ProviderService(
                provider_id=profile.id,
                service_id=svc_id,
                starting_price=int(d["rate"] * 0.8),
            ))

        created += 1
        print("Created:", d["business"])

db.commit()
db.close()
print("Done! Created:", created, "providers.")
total_q = SessionLocal().query(ProviderProfile).filter(ProviderProfile.is_available.is_(True)).count()
print("Total available:", total_q)
