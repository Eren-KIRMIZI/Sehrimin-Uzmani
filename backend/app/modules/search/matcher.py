from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from datetime import datetime
from app.modules.providers.models import ProviderProfile, ProviderService, ProviderAvailability
from app.modules.reviews.models import Review
from app.modules.users.models import User
from app.modules.categories.models import Category, SubCategory, Service
from app.modules.locations.models import ProviderLocation, City, District
from app.modules.promotions.models import PromotedProvider
from app.modules.subscriptions.models import ProviderSubscription
from app.modules.commissions.models import ProviderEarning


class ProviderMatcher:
    def __init__(self, db: Session):
        self.db = db

    def score_provider(
        self,
        provider: User,
        service_id: int = None,
        category_id: int = None,
        city_id: int = None,
        district_id: int = None,
        budget: float = None,
    ) -> float:
        profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == provider.id).first()
        if not profile:
            return 0.0

        score = 0.0

        rating = db.query(sql_func.avg(Review.rating)).filter(
            Review.provider_id == provider.id,
            Review.is_visible == True,
        ).scalar()
        rating = rating or 0
        score += rating * 15

        review_count = db.query(Review).filter(
            Review.provider_id == provider.id,
            Review.is_visible == True,
        ).count()
        if review_count >= 50:
            score += 20
        elif review_count >= 20:
            score += 15
        elif review_count >= 10:
            score += 10
        elif review_count >= 5:
            score += 5

        completion_count = db.query(Review).filter(
            Review.provider_id == provider.id,
            Review.is_visible == True,
        ).count()
        if completion_count >= 100:
            score += 15
        elif completion_count >= 50:
            score += 10
        elif completion_count >= 20:
            score += 5

        if profile.years_of_experience:
            if profile.years_of_experience >= 10:
                score += 10
            elif profile.years_of_experience >= 5:
                score += 7
            elif profile.years_of_experience >= 2:
                score += 4

        if profile.verification_level in ["professional", "business"]:
            score += 10
        elif profile.verification_level == "identity":
            score += 5

        sub = db.query(ProviderSubscription).filter(
            ProviderSubscription.provider_id == provider.id,
            ProviderSubscription.status == "active",
        ).first()
        if sub and sub.plan:
            score += 8
            if sub.plan.badge_type == "gold":
                score += 5
            elif sub.plan.badge_type == "silver":
                score += 3

        promoted = db.query(PromotedProvider).filter(
            PromotedProvider.provider_id == provider.id,
            PromotedProvider.status == "active",
        ).first()
        if promoted:
            score += promoted.priority_boost * 3

        if service_id:
            has_service = db.query(ProviderService).filter(
                ProviderService.provider_id == provider.id,
                ProviderService.service_id == service_id,
            ).first()
            if has_service:
                score += 15

        if category_id:
            has_category = db.query(ProviderService).join(Service).filter(
                ProviderService.provider_id == provider.id,
                Service.category_id == category_id,
            ).first()
            if has_category:
                score += 10

        if city_id or district_id:
            location = db.query(ProviderLocation).filter(
                ProviderLocation.provider_id == provider.id,
            ).first()
            if location:
                if district_id and location.district_id == district_id:
                    score += 10
                elif city_id and location.city_id == city_id:
                    score += 7

        if budget and profile.hourly_rate:
            rate_diff = abs(profile.hourly_rate - budget) / budget if budget > 0 else 1
            if rate_diff <= 0.1:
                score += 8
            elif rate_diff <= 0.25:
                score += 5
            elif rate_diff <= 0.5:
                score += 2

        if profile.portfolio_images:
            score += min(len(profile.portfolio_images) * 0.5, 5)

        return round(score, 2)

    def find_best_matches(
        self,
        service_id: int = None,
        category_id: int = None,
        subcategory_id: int = None,
        city_id: int = None,
        district_id: int = None,
        budget: float = None,
        limit: int = 10,
        offset: int = 0,
    ) -> list:
        q = self.db.query(User).filter(
            User.role == "provider",
            User.is_active == True,
        )

        if service_id:
            provider_ids = [ps.provider_id for ps in self.db.query(ProviderService).filter(
                ProviderService.service_id == service_id
            ).all()]
            if provider_ids:
                q = q.filter(User.id.in_(provider_ids))
            else:
                return []

        if category_id:
            provider_ids = [ps.provider_id for ps in self.db.query(ProviderService).join(Service).filter(
                Service.category_id == category_id
            ).all()]
            if provider_ids:
                q = q.filter(User.id.in_(provider_ids))

        if subcategory_id:
            provider_ids = [ps.provider_id for ps in self.db.query(ProviderService).join(Service).filter(
                Service.subcategory_id == subcategory_id
            ).all()]
            if provider_ids:
                q = q.filter(User.id.in_(provider_ids))

        if city_id:
            location_provider_ids = [pl.provider_id for pl in self.db.query(ProviderLocation).filter(
                ProviderLocation.city_id == city_id
            ).all()]
            if location_provider_ids:
                q = q.filter(User.id.in_(location_provider_ids))

        all_providers = q.all()

        scored = []
        for p in all_providers:
            s = self.score_provider(
                p,
                service_id=service_id,
                category_id=category_id,
                city_id=city_id,
                district_id=district_id,
                budget=budget,
            )
            scored.append((p, s))

        scored.sort(key=lambda x: x[1], reverse=True)
        paginated = scored[offset:offset + limit]

        results = []
        for provider, score in paginated:
            profile = self.db.query(ProviderProfile).filter(ProviderProfile.user_id == provider.id).first()
            rating = self.db.query(sql_func.avg(Review.rating)).filter(
                Review.provider_id == provider.id,
                Review.is_visible == True,
            ).scalar() or 0
            review_count = self.db.query(Review).filter(
                Review.provider_id == provider.id,
                Review.is_visible == True,
            ).count()
            location = self.db.query(ProviderLocation).filter(
                ProviderLocation.provider_id == provider.id
            ).first()
            promoted = self.db.query(PromotedProvider).filter(
                PromotedProvider.provider_id == provider.id,
                PromotedProvider.status == "active",
            ).first()

            results.append({
                "provider_id": provider.id,
                "full_name": provider.full_name,
                "slug": provider.slug,
                "avatar_url": provider.avatar_url,
                "match_score": score,
                "rating": round(float(rating), 1),
                "review_count": review_count,
                "hourly_rate": profile.hourly_rate if profile else None,
                "years_experience": profile.years_of_experience if profile else None,
                "verification_level": profile.verification_level if profile else "none",
                "is_promoted": promoted is not None,
                "promoted_badge": promoted.badge_text if promoted else None,
                "city_name": location.city.name if location and location.city else None,
                "district_name": location.district.name if location and location.district else None,
            })

        return results


def get_ai_matching_suggestions(
    user_text: str,
    db: Session,
    city_id: int = None,
    limit: int = 5,
) -> dict:
    from app.modules.search.ai_detector import detect_category
    detection = detect_category(user_text, db)

    if not detection["detected"]:
        return {
            "detected": False,
            "suggestion": detection["suggestion"],
            "providers": [],
        }

    service_id = detection.get("service", {}).get("id") if detection.get("service") else None
    category_id = detection.get("category", {}).get("id") if detection.get("category") else None
    subcategory_id = detection.get("subcategory", {}).get("id") if detection.get("subcategory") else None

    matcher = ProviderMatcher(db)
    providers = matcher.find_best_matches(
        service_id=service_id,
        category_id=category_id,
        subcategory_id=subcategory_id,
        city_id=city_id,
        limit=limit,
    )

    return {
        "detected": True,
        "detection": detection,
        "providers": providers,
        "total_matches": len(providers),
    }
