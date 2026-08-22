import os
import random
import string
import logging
from datetime import datetime, timezone
from sqlalchemy import text
from app.core.database import SessionLocal, engine
from app.modules.users.models import User
from app.modules.providers.models import ProviderProfile, ProviderLocation
from app.modules.locations.models import City, District

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Çevre Değişkenleri (Smoke test için varsayılanlar düşük tutulmuştur)
# Gerçek test için: PROVIDERS=500000 SERVICES=2000000
TARGET_PROVIDERS = int(os.getenv("PROVIDERS", "10000"))
BATCH_SIZE = 5000  # Belleği patlatmamak için

# FTS (Full Text Search) Corpus'u - Gerçekçi Türkçe
BUSINESS_ADJECTIVES = ["Uzman", "Güvenilir", "Hızlı", "Pratik", "Profesyonel", "Ekonomik", "Kaliteli", "Titiz"]
BUSINESS_TYPES = ["Elektrik", "Tesisat", "Temizlik", "Boya", "Klima", "Nakliyat", "Dekorasyon", "Tamir", "Servis"]
BIO_TEMPLATES = [
    "{} alanında {} yıldır hizmet veriyoruz. Müşteri memnuniyeti önceliğimizdir.",
    "İşinizi şansa bırakmayın, {} konusunda uzman ekibimizle yanınızdayız.",
    "Evinizin {} ihtiyaçları için en doğru adres. Temiz ve garantili işçilik.",
    "{} sektöründe lider. Uygun fiyat ve {} çözümler sunuyoruz."
]

def generate_business_name():
    return f"{random.choice(BUSINESS_ADJECTIVES)} {random.choice(BUSINESS_TYPES)} {random.choice(['Hizmetleri', 'Çözümleri', 'A.Ş.', 'Ltd.'])}"

def generate_bio():
    return random.choice(BIO_TEMPLATES).format(random.choice(BUSINESS_TYPES), random.randint(5, 20))

def get_weighted_city(cities):
    # İstanbul, Ankara, İzmir gibi büyük şehirlerin ağırlığını (popülasyon oranına göre) artırıyoruz.
    # Örnek dağılım: %40 İstanbul, %15 Ankara, %10 İzmir, %35 diğerleri
    weights = []
    for c in cities:
        if c.name == "İstanbul":
            weights.append(40)
        elif c.name == "Ankara":
            weights.append(15)
        elif c.name == "İzmir":
            weights.append(10)
        else:
            weights.append(35 / max(1, len(cities) - 3))
    return random.choices(cities, weights=weights, k=1)[0]

def truncate_tables(db):
    logger.info("Tablolar temizleniyor... (Eğer verileri tutmak istiyorsanız scripti durdurun)")
    # CASCADE kullanarak bağımlılıkları siliyoruz (Dikkat: Sadece TEST ortamında!)
    db.execute(text("TRUNCATE TABLE provider_locations CASCADE;"))
    db.execute(text("TRUNCATE TABLE provider_profiles CASCADE;"))
    db.execute(text("TRUNCATE TABLE users CASCADE;"))
    db.commit()

def seed_users_and_providers():
    db = SessionLocal()
    try:
        cities = db.query(City).all()
        if not cities:
            logger.error("Veritabanında Şehir (City) verisi bulunamadı. Önce app.seed çalıştırılmalı!")
            return

        district_map = {city.id: db.query(District).filter(District.city_id == city.id).all() for city in cities}
        
        # SADECE TEST ORTAMINDA KULLANIN!
        # truncate_tables(db)
        
        logger.info(f"Toplam {TARGET_PROVIDERS} Provider üretiliyor (Batch size: {BATCH_SIZE})...")
        
        for batch_num in range(0, TARGET_PROVIDERS, BATCH_SIZE):
            users = []
            for i in range(BATCH_SIZE):
                users.append(User(
                    email=f"loadtest_{batch_num}_{i}@test.com",
                    password_hash="fakehash",
                    first_name=f"Name_{i}",
                    last_name=f"Surname_{i}",
                    phone=f"555{random.randint(1000000, 9999999)}",
                    is_active=True,
                    is_provider=True
                ))
            
            db.bulk_save_objects(users, return_defaults=True)
            db.commit()
            
            profiles = []
            locations = []
            
            for user in users:
                profiles.append(ProviderProfile(
                    user_id=user.id,
                    business_name=generate_business_name(),
                    bio=generate_bio(),
                    experience_years=random.randint(1, 30),
                    verification_status="VERIFIED" if random.random() > 0.3 else "NONE",
                    is_available=True
                ))
                
            db.bulk_save_objects(profiles, return_defaults=True)
            db.commit()

            for profile in profiles:
                city = get_weighted_city(cities)
                districts = district_map.get(city.id, [])
                district_id = random.choice(districts).id if districts else None
                
                # Rastgele Türkiye koordinatları
                lat = random.uniform(36.0, 42.0)
                lng = random.uniform(26.0, 45.0)

                locations.append(ProviderLocation(
                    provider_id=profile.id,
                    city_id=city.id,
                    district_id=district_id,
                    address=f"Test Mah. Sok {random.randint(1,100)}",
                    latitude=lat,
                    longitude=lng
                ))
                
            db.bulk_save_objects(locations)
            db.commit()
            
            logger.info(f"[{batch_num + BATCH_SIZE}/{TARGET_PROVIDERS}] kayıt tamamlandı.")

    except Exception as e:
        logger.error(f"Hata oluştu: {e}")
        db.rollback()
    finally:
        db.close()
        logger.info("Veritabanı bağlantısı kapatıldı.")

if __name__ == "__main__":
    logger.info("Load Test Sentetik Veri Üretici Başlatılıyor...")
    seed_users_and_providers()
