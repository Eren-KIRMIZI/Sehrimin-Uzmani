from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from datetime import datetime
import math
from math import radians, sin, cos, sqrt, atan2
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
                sql_func.count(sql_func.distinct(Review.customer_id)),
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

        # service_id → category_id eşleşmesi için bulk yükleme (N+1 önle)
        all_service_ids = [
            sid
            for sids in services_by_provider.values()
            for sid in sids
        ]
        service_category_map = {}
        if all_service_ids:
            for svc in self.db.query(Service).filter(Service.id.in_(all_service_ids)).all():
                service_category_map[svc.id] = svc.category_id

        # provider_id → category_ids kümesi
        categories_by_provider = {}
        for pid, sids in services_by_provider.items():
            categories_by_provider[pid] = {service_category_map[s] for s in sids if s in service_category_map}

        return {
            "profiles": profiles,
            "rating_data": rating_data,
            "locations": locations,
            "subscriptions": subscriptions,
            "promoted": promoted,
            "services": services_by_provider,
            "categories": categories_by_provider,
        }

    def score_provider(
        self,
        provider: User,
        data: dict,
        service_id: int = None,
        category_id: int = None,
        city_id: int = None,
        district_id: int = None,
        lat: float = None,
        lng: float = None,
        budget: float = None,
    ) -> float:
        profile = data["profiles"].get(provider.id)
        if not profile:
            return 0.0

        score = 0.0

        avg_rating, review_count, unique_customers = data["rating_data"].get(provider.id, (0, 0, 0))
        avg_rating = float(avg_rating or 0)
        review_count = int(review_count or 0)
        unique_customers = int(unique_customers or 0)

        # 1. Base score from reputation system logic
        # Rating score (40%)
        r_score = min(avg_rating * 8, 40)
        # Completion score (25%)
        c_score = min(math.log(1 + (profile.completed_jobs or 0)) / math.log(201) * 25, 25) if (profile.completed_jobs or 0) > 0 else 0
        # Verification score (15%)
        v_mapping = {"NONE": 0, "BASIC": 5, "IDENTITY": 8, "PROFESSIONAL": 12, "BUSINESS": 15}
        v_score = v_mapping.get((profile.verification_status or "NONE").upper(), 0)
        # Response score (10%)
        resp_minutes = profile.response_time_minutes or 0
        if resp_minutes == 0: resp_score = 5
        elif resp_minutes <= 15: resp_score = 10
        elif resp_minutes <= 30: resp_score = 8
        elif resp_minutes <= 60: resp_score = 6
        elif resp_minutes <= 120: resp_score = 4
        elif resp_minutes <= 240: resp_score = 2
        else: resp_score = 0
        # Repeat customer score (10%)
        if unique_customers == 0:
            rep_score = 5.0
        else:
            ratio = review_count / unique_customers
            rep_score = min((ratio - 1.0) * 10 + 5, 10)

        base_score = r_score + c_score + v_score + resp_score + rep_score
        score += base_score

        if not profile.is_available:
            score -= 50  # Heavy penalty for being unavailable
        
        if profile.experience_years:
            if profile.experience_years >= 10:
                score += 5
            elif profile.experience_years >= 5:
                score += 3


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
            provider_cat_ids = data["categories"].get(provider.id, set())
            if category_id in provider_cat_ids:
                score += 10

        if lat and lng:
            location = data["locations"].get(provider.id)
            if location and location.latitude and location.longitude:
                # Haversine distance
                lat1, lon1 = radians(lat), radians(lng)
                lat2, lon2 = radians(location.latitude), radians(location.longitude)
                dlon = lon2 - lon1
                dlat = lat2 - lat1
                a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
                c = 2 * atan2(sqrt(a), sqrt(1 - a))
                distance = 6371 * c
                if distance <= 5:
                    score += 15
                elif distance <= 15:
                    score += 10
                elif distance <= 50:
                    score += 5
        elif city_id or district_id:
            location = data["locations"].get(provider.id)
            if location:
                if district_id and location.district_id == district_id:
                    score += 10
                elif city_id and location.city_id == city_id:
                    score += 7

        if budget:
            profile = data["profiles"].get(provider.id)
            if profile and profile.hourly_rate:
                # Bütçeye uygun provider'a bonus, fazla pahalıya ceza
                if profile.hourly_rate <= budget:
                    score += 5
                elif profile.hourly_rate <= budget * 1.2:  # %20 tolerans
                    score += 2
                else:
                    score -= 3

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
        lat: float = None,
        lng: float = None,
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
                lat=lat,
                lng=lng,
            )
            scored.append((p, s))

        scored.sort(key=lambda x: x[1], reverse=True)
        paginated = scored[offset:offset + limit]

        results = []
        for provider, score in paginated:
            profile = data["profiles"].get(provider.id)
            avg_rating, review_count, unique_customers = data["rating_data"].get(provider.id, (0, 0, 0))
            location = data["locations"].get(provider.id)
            promoted_obj = data["promoted"].get(provider.id)

            match_reasons = []
            if float(avg_rating or 0) >= 4.5:
                match_reasons.append("Yüksek müşteri memnuniyeti")
            if profile and profile.experience_years and profile.experience_years >= 5:
                match_reasons.append(f"{profile.experience_years} yıl deneyim")
            if promoted_obj:
                match_reasons.append("Önerilen uzman")
            if location and city_id and location.city_id == city_id:
                if district_id and location.district_id == district_id:
                    match_reasons.append("Aynı ilçede")
                else:
                    match_reasons.append("Aynı şehirde")
            if profile and profile.verification_status in ("professional", "business"):
                match_reasons.append("Doğrulanmış profesyonel")

            results.append({
                "provider_id": provider.id,
                "full_name": provider.full_name,
                "slug": provider.slug,
                "avatar_url": provider.avatar_url,
                "match_score": score,
                "match_score_pct": min(100, int(score)),
                "match_reasons": match_reasons,
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
