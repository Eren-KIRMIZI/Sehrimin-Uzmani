from fastapi import APIRouter

from app.ai.router import router as ai_router
from app.modules.admin.router import router as admin_router
from app.modules.ads.router import admin_router as ads_admin_router
from app.modules.ads.router import router as ads_router
from app.modules.appointments.router import router as appointments_router
from app.modules.auth.router import router as auth_router
from app.modules.categories.router import router as categories_router
from app.modules.commissions.router import router as commissions_router
from app.modules.disputes.router import router as disputes_router
from app.modules.favorites.router import router as favorites_router
from app.modules.locations.router import router as locations_router
from app.modules.notifications.router import router as notifications_router
from app.modules.pricing.router import router as pricing_router
from app.modules.promotions.router import router as promotions_router
from app.modules.providers.router import router as providers_router
from app.modules.providers.verification_router import router as verification_router
from app.modules.quotes.router import router as quotes_router
from app.modules.requests.router import router as requests_router
from app.modules.reviews.router import router as reviews_router
from app.modules.search.matching_router import router as matching_router
from app.modules.search.router import router as search_router
from app.modules.subscriptions.router import router as subscriptions_router
from app.modules.users.router import router as users_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(providers_router)
api_router.include_router(verification_router)
api_router.include_router(categories_router)
api_router.include_router(locations_router)
api_router.include_router(search_router)
api_router.include_router(matching_router)
api_router.include_router(requests_router)
api_router.include_router(quotes_router)
api_router.include_router(appointments_router)
api_router.include_router(reviews_router)
api_router.include_router(favorites_router)
api_router.include_router(notifications_router)
api_router.include_router(admin_router)
api_router.include_router(commissions_router)
api_router.include_router(disputes_router)
api_router.include_router(subscriptions_router)
api_router.include_router(promotions_router)
api_router.include_router(pricing_router)
api_router.include_router(ai_router)
api_router.include_router(ads_router)
api_router.include_router(ads_admin_router)
