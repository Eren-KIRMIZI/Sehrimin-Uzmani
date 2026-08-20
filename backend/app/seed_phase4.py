import random

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.modules.categories.models import (
    Category,
    ProviderService,
    Service,
    SubCategory,
)
from app.modules.locations.models import City, District, ProviderLocation
from app.modules.providers.models import ProviderProfile
from app.modules.users.models import User

NAMES = ["Ali", "Ayşe", "Mehmet", "Fatma", "Mustafa", "Zeynep", "Ahmet", "Elif", "Hasan", "Hatice", "Hüseyin", "Merve", "İbrahim", "Esra", "Halil", "Büşra", "Cem", "Deniz", "Efe", "Gamze"]
LAST_NAMES = ["Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Öztürk", "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç", "Güneş", "Gül", "Özcan", "Erdoğan"]

DUMMY_DISTRICTS = {
    "Kayseri": ["Melikgazi", "Kocasinan", "Talas", "Develi", "Yahyalı"],
    "Aksaray": ["Merkez", "Ağaçören", "Eskil", "Gülağaç", "Güzelyurt"],
    "Konya": ["Selçuklu", "Meram", "Karatay", "Ereğli", "Akşehir"],
    "Ankara": [] # Ankara already has districts from seed.py
}

def seed_phase4_data():
    db: Session = SessionLocal()
    try:
        cities_to_seed = ["Kayseri", "Aksaray", "Konya", "Ankara"]

        # Get 5 Categories for expansion
        target_category_slugs = ["ev-yasam", "teknik-hizmetler", "tasimacilik", "guzellik", "arac"]
        categories = db.query(Category).filter(Category.slug.in_(target_category_slugs)).all()
        services = db.query(Service).join(SubCategory).filter(SubCategory.category_id.in_([c.id for c in categories])).all()

        if not services:
            print("No services found for selected categories")
            return

        for city_name in cities_to_seed:
            city = db.query(City).filter(City.name == city_name).first()
            if not city:
                print(f"{city_name} city not found in DB")
                continue

            # Seed districts if they don't exist
            if DUMMY_DISTRICTS.get(city_name):
                for d_name in DUMMY_DISTRICTS[city_name]:
                    district = db.query(District).filter(District.city_id == city.id, District.name == d_name).first()
                    if not district:
                        district = District(city_id=city.id, name=d_name)
                        db.add(district)
                db.commit()

            districts = db.query(District).filter(District.city_id == city.id).all()
            if not districts:
                print(f"No districts found for {city_name}, skipping.")
                continue

            print(f"Generating 100 customers for {city_name}...")
            for i in range(100):
                first_name = random.choice(NAMES)
                last_name = random.choice(LAST_NAMES)
                email = f"customer_{i}_{city_name.lower()}@bologeselbuyume.com"

                if not db.query(User).filter(User.email == email).first():
                    user = User(
                        email=email,
                        password_hash=hash_password("Buyume123"),
                        first_name=first_name,
                        last_name=last_name,
                        role="USER",
                        is_active=True
                    )
                    db.add(user)
            db.commit()

            print(f"Generating 50 providers for {city_name}...")
            for i in range(50):
                first_name = random.choice(NAMES)
                last_name = random.choice(LAST_NAMES)
                email = f"provider_{i}_{city_name.lower()}@bologeselbuyume.com"

                existing = db.query(User).filter(User.email == email).first()
                if not existing:
                    user = User(
                        email=email,
                        password_hash=hash_password("Buyume123"),
                        first_name=first_name,
                        last_name=last_name,
                        role="PROVIDER",
                        is_active=True
                    )
                    db.add(user)
                    db.flush()

                    profile = ProviderProfile(
                        user_id=user.id,
                        business_name=f"{first_name} {random.choice(['Usta', 'Hizmetleri', 'Ticaret', 'Servisi', 'Ustası'])} - {city_name}",
                        bio=f"{city_name} bölgesinde kaliteli ve güvenilir hizmet.",
                        experience_years=random.randint(1, 15),
                        rating=random.uniform(4.0, 5.0),
                        review_count=random.randint(0, 30),
                        completed_jobs=random.randint(0, 50),
                        verification_status=random.choice(["NONE", "BASIC", "IDENTITY", "PROFESSIONAL", "BUSINESS"]),
                        is_available=True
                    )
                    db.add(profile)
                    db.flush()

                    district = random.choice(districts)
                    # Rough coordinate approximations
                    baselat, baselng = 39.0, 35.0
                    loc = ProviderLocation(
                        provider_id=profile.id,
                        city_id=city.id,
                        district_id=district.id,
                        is_primary=True,
                        latitude=random.uniform(baselat - 0.5, baselat + 0.5),
                        longitude=random.uniform(baselng - 0.5, baselng + 0.5)
                    )
                    db.add(loc)

                    provider_services = random.sample(services, k=random.randint(1, 4))
                    for s in provider_services:
                        ps = ProviderService(
                            provider_id=profile.id,
                            service_id=s.id,
                            starting_price=random.randint(100, 1000)
                        )
                        db.add(ps)

            db.commit()
            print(f"Data generation for {city_name} completed.")

        print("Phase 4 (Bölgesel Büyüme) seed completed successfully.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_phase4_data()
