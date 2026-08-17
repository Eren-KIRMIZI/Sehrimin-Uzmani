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

    def _bulk_load_provider_data(self, provider_ids: list[int]) -> dict:
        if not provider_ids:
            return {}

        profiles = {
            p.user_id: p
            for p in self.db.query(ProviderProfile).filter(ProviderProfile.user_id.in_(provider_ids)).all()
        }

        rating_data = dict(
            self.db.query(
                Review.provider_id,
                sql_func.avg(Review.rating),
                sql_func.count(Review.id),
            )
            .filter(Review.provider_id.in_(provider_ids), Review.is_visible == True)
            .group_by(Review.provider_id)
            .all()
        )

        locations = {
            pl.provider_id: pl
            for pl in self.db.query(ProviderLocation).filter(ProviderLocation.provider_id.in_(provider_ids)).all()
        }

        subscriptions = {
            s.provider_id: s
            for s in self.db.query(ProviderSubscription).filter(
                ProviderSubscription.provider_id.in_(provider_ids),
                ProviderSubscription.status == "active",
            ).all()
        }

        promoted = {
            p.provider_id: p
            for p in self.db.query(PromotedProvider).filter(
                PromotedProvider.provider_id.in_(provider_ids),
                PromotedProvider.status == "active",
            ).all()
        }

        services_by_provider = {}
        for ps in self.db.query(ProviderService).filter(ProviderService.provider_id.in_(provider_ids)).all():
            services_by_provider.setdefault(ps.provider_id, []).append(ps.service_id)

        return {
            "profiles": profiles,
            "rating_data": rating_data,
            "locations": locations,
            "subscriptions": subscriptions,
            "promoted": promoted,
            "services": services_by_provider,
        }

    def score_provider(
        self,
        provider: User,
        data: dict,
        service_id: int = None,
        category_id: int = None,
        city_id: int = None,
        district_id: int = None,
        budget: float = None,
    ) -> float:
        profile = data["profiles"].get(provider.id)
        if not profile:
            return 0.0

        score = 0.0

        avg_rating, review_count = data["rating_data"].get(provider.id, (0, 0))
        avg_rating = float(avg_rating or 0)
        review_count = int(review_count or 0)

        score += avg_rating * 15

        if review_count >= 50:
            score += 20
        elif review_count >= 20:
            score += 15
        elif review_count >= 10:
            score += 10
        elif review_count >= 5:
            score += 5

        if review_count >= 100:
            score += 15
        elif review_count >= 50:
            score += 10
        elif review_count >= 20:
            score += 5

        if profile.experience_years:
            if profile.experience_years >= 10:
                score += 10
            elif profile.experience_years >= 5:
                score += 7
            elif profile.experience_years >= 2:
                score += 4

        if profile.verification_status in ("professional", "business"):
            score += 10
        elif profile.verification_status == "identity":
            score += 5

        sub = data["subscriptions"].get(provider.id)
        if sub and sub.plan:
            score += 8
            if sub.plan.badge_type == "gold":
                score += 5
            elif sub.plan.badge_type == "silver":
                score += 3

        promoted_obj = data["promoted"].get(provider.id)
        if promoted_obj:
            score += promoted_obj.priority_boost * 3

        provider_service_ids = data["services"].get(provider.id, [])
        if service_id and service_id in provider_service_ids:
            score += 15

        if category_id:
            service_ids_for_cat = set(
                ps.service_id
                for ps in self.db.query(ProviderService)
                .join(Service)
                .filter(ProviderService.provider_id == provider.id, Service.category_id == category_id)
                .all()
            )
            if provider_service_ids and any(s in service_ids_for_cat for s in provider_service_ids):
                score += 10

        if city_id or district_id:
            location = data["locations"].get(provider.id)
            if location:
                if district_id and location.district_id == district_id:
                    score += 10
                elif city_id and location.city_id == city_id:
                    score += 7

        if budget:
            provider_locations = data["locations"].get(provider.id)
            if provider_locations and provider_locations.latitude and provider_locations.longitude:
                score += 3

        portfolio_count = len(profile.portfolio_items) if profile.portfolio_items else 0
        if portfolio_count:
            score += min(portfolio_count * 0.5, 5)

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
        limit = min(limit, 50)
        offset = max(0, offset)

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
        all_ids = [p.id for p in all_providers]
        data = self._bulk_load_provider_data(all_ids)

        scored = []
        for p in all_providers:
            s = self.score_provider(
                p,
                data,
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
            profile = data["profiles"].get(provider.id)
            avg_rating, review_count = data["rating_data"].get(provider.id, (0, 0))
            location = data["locations"].get(provider.id)
            promoted_obj = data["promoted"].get(provider.id)

            results.append({
                "provider_id": provider.id,
                "full_name": provider.full_name,
                "slug": provider.slug,
                "avatar_url": provider.avatar_url,
                "match_score": score,
                "rating": round(float(avg_rating or 0), 1),
                "review_count": int(review_count or 0),
                "experience_years": profile.experience_years if profile else None,
                "verification_status": profile.verification_status if profile else "none",
                "is_promoted": promoted_obj is not None,
                "promoted_badge": promoted_obj.badge_text if promoted_obj else None,
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
