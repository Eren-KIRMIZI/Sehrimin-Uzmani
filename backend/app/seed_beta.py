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

NAMES = ["Ali", "Ayşe", "Mehmet", "Fatma", "Mustafa", "Zeynep", "Ahmet", "Elif", "Hasan", "Hatice", "Hüseyin", "Merve", "İbrahim", "Esra", "Halil", "Büşra"]
LAST_NAMES = ["Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Öztürk", "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç"]

def seed_beta_data():
    db: Session = SessionLocal()
    try:
        # Get Nevsehir city and districts
        nevsehir = db.query(City).filter(City.name == "Nevşehir").first()
        if not nevsehir:
            print("Nevşehir city not found in DB")
            return

        districts = db.query(District).filter(District.city_id == nevsehir.id).all()
        if not districts:
            print("Nevşehir districts not found in DB")
            return

        # Get 5 Categories for beta
        target_category_slugs = ["ev-yasam", "teknik-hizmetler", "tasimacilik", "guzellik", "arac"]
        categories = db.query(Category).filter(Category.slug.in_(target_category_slugs)).all()

        services = db.query(Service).join(SubCategory).filter(SubCategory.category_id.in_([c.id for c in categories])).all()
        if not services:
            print("No services found for selected categories")
            return

        print("Generating 100 customers...")
        for i in range(100):
            first_name = random.choice(NAMES)
            last_name = random.choice(LAST_NAMES)
            email = f"customer_{i}@nevsehirbeta.com"

            if not db.query(User).filter(User.email == email).first():
                user = User(
                    email=email,
                    password_hash=hash_password("Beta1234"),
                    first_name=first_name,
                    last_name=last_name,
                    role="USER",
                    is_active=True
                )
                db.add(user)
        db.commit()

        print("Generating 50 providers...")
        for i in range(50):
            first_name = random.choice(NAMES)
            last_name = random.choice(LAST_NAMES)
            email = f"provider_{i}@nevsehirbeta.com"

            existing = db.query(User).filter(User.email == email).first()
            if not existing:
                user = User(
                    email=email,
                    password_hash=hash_password("Beta1234"),
                    first_name=first_name,
                    last_name=last_name,
                    role="PROVIDER",
                    is_active=True
                )
                db.add(user)
                db.flush()

                # Provider Profile
                profile = ProviderProfile(
                    user_id=user.id,
                    business_name=f"{first_name} {random.choice(['Usta', 'Hizmetleri', 'Ticaret', 'Servisi'])}",
                    bio="Nevşehir'de güvenilir hizmet.",
                    experience_years=random.randint(1, 15),
                    rating=random.uniform(4.0, 5.0),
                    review_count=random.randint(0, 30),
                    completed_jobs=random.randint(0, 50),
                    verification_status=random.choice(["NONE", "BASIC", "IDENTITY", "PROFESSIONAL", "BUSINESS"]),
                    is_available=True
                )
                db.add(profile)
                db.flush()

                # Location
                district = random.choice(districts)
                loc = ProviderLocation(
                    provider_id=profile.id,
                    city_id=nevsehir.id,
                    district_id=district.id,
                    is_primary=True,
                    latitude=random.uniform(38.6, 38.8),
                    longitude=random.uniform(34.6, 34.8)
                )
                db.add(loc)

                # Services
                provider_services = random.sample(services, k=random.randint(1, 4))
                for s in provider_services:
                    ps = ProviderService(
                        provider_id=profile.id,
                        service_id=s.id,
                        starting_price=random.randint(100, 1000)
                    )
                    db.add(ps)

        db.commit()
        print("Beta seed completed successfully.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_beta_data()
