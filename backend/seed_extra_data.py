import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.core.database import SessionLocal
from app.modules.users.models import User
from app.modules.providers.models import ProviderProfile
from app.modules.providers.portfolio_model import PortfolioItem
from app.modules.providers.availability_model import ProviderAvailability
from app.modules.requests.models import ServiceRequest
from app.modules.reviews.models import Review
import datetime

db = SessionLocal()

def seed_extra():
    customer = db.query(User).filter(User.email == "customer@demo.com").first()
    if not customer:
        customer = User(
            email="customer@demo.com",
            password_hash="test",
            first_name="Demo",
            last_name="Customer",
            role="USER",
            is_active=True,
        )
        db.add(customer)
        db.flush()

    providers = db.query(ProviderProfile).limit(100).all()
    print(f"Found {len(providers)} providers to seed")

    for p in providers:
        # Portfolio items
        if db.query(PortfolioItem).filter(PortfolioItem.provider_id == p.id).count() == 0:
            db.add(PortfolioItem(
                provider_id=p.id,
                title=f"{p.business_name} Proje 1",
                description="Örnek çalışma 1",
                image_url="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=450&fit=crop",
                category="Genel"
            ))
            db.add(PortfolioItem(
                provider_id=p.id,
                title=f"{p.business_name} Proje 2",
                description="Örnek çalışma 2",
                image_url="https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&h=450&fit=crop",
                category="Genel"
            ))

        # Availability
        if db.query(ProviderAvailability).filter(ProviderAvailability.provider_id == p.id).count() == 0:
            for i in range(1, 6): # Mon-Fri
                db.add(ProviderAvailability(
                    provider_id=p.id,
                    day_of_week=str(i),
                    start_time="09:00",
                    end_time="18:00"
                ))

        # Reviews
        if db.query(Review).filter(Review.provider_id == p.id).count() == 0:
            req = ServiceRequest(
                customer_id=customer.id,
                title="Örnek Talep",
                description="Test",
                status="COMPLETED",
                city_id=1,
                urgency="NORMAL"
            )
            db.add(req)
            db.flush()
            
            db.add(Review(
                request_id=req.id,
                customer_id=customer.id,
                provider_id=p.id,
                rating=5.0,
                communication_rating=5.0,
                quality_rating=5.0,
                price_rating=5.0,
                punctuality_rating=5.0,
                comment="Harika hizmet, kesinlikle tavsiye ederim!",
                is_visible=1,
                status="ACTIVE"
            ))
            
            req2 = ServiceRequest(
                customer_id=customer.id,
                title="İkinci Talep",
                description="Test 2",
                status="COMPLETED",
                city_id=1,
                urgency="NORMAL"
            )
            db.add(req2)
            db.flush()

            db.add(Review(
                request_id=req2.id,
                customer_id=customer.id,
                provider_id=p.id,
                rating=4.0,
                communication_rating=4.0,
                quality_rating=5.0,
                price_rating=4.0,
                punctuality_rating=5.0,
                comment="Güzel bir çalışma oldu.",
                is_visible=1,
                status="ACTIVE"
            ))

    db.commit()
    print("Extra data seeded successfully!")

if __name__ == "__main__":
    seed_extra()
