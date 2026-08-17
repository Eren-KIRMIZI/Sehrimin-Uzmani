from fastapi import APIRouter
from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.modules.providers.router import router as providers_router
from app.modules.categories.router import router as categories_router
from app.modules.locations.router import router as locations_router
from app.modules.search.router import router as search_router
from app.modules.requests.router import router as requests_router
from app.modules.quotes.router import router as quotes_router
from app.modules.appointments.router import router as appointments_router
from app.modules.reviews.router import router as reviews_router
from app.modules.favorites.router import router as favorites_router
from app.modules.notifications.router import router as notifications_router
from app.modules.admin.router import router as admin_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(providers_router)
api_router.include_router(categories_router)
api_router.include_router(locations_router)
api_router.include_router(search_router)
api_router.include_router(requests_router)
api_router.include_router(quotes_router)
api_router.include_router(appointments_router)
api_router.include_router(reviews_router)
api_router.include_router(favorites_router)
api_router.include_router(notifications_router)
api_router.include_router(admin_router)
