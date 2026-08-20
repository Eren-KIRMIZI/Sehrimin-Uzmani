import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db

import app.modules.auth.models
import app.modules.users.models
import app.modules.providers.models
import app.modules.providers.portfolio_model
import app.modules.categories.models
import app.modules.locations.models
import app.modules.requests.models
import app.modules.quotes.models
import app.modules.appointments.models
import app.modules.reviews.models
import app.modules.favorites.models
import app.modules.notifications.models
import app.modules.messaging.models
import app.modules.admin.audit_model
import app.modules.commissions.models
import app.modules.subscriptions.models
import app.modules.promotions.models
import app.modules.disputes.models
import app.modules.pricing.models
import app.modules.admin.settings_model
import app.modules.providers.availability_model

TEST_DATABASE_URL = "sqlite:///./test.db"
test_engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)


@event.listens_for(test_engine, "connect")
def _set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(autouse=True)
def db():
    from app.core.rate_limiter import rate_limiter

    rate_limiter._requests.clear()
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


def _create_test_app():
    from app.api.router import api_router
    from app.modules.messaging.router import router as messaging_router

    app = FastAPI(title="Test App")
    app.add_middleware(
        __import__(
            "fastapi.middleware.cors", fromlist=["CORSMiddleware"]
        ).CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "PUT"],
        allow_headers=["Authorization", "Content-Type"],
    )
    app.include_router(api_router)
    app.include_router(messaging_router)
    return app


@pytest.fixture
def client(db):
    test_app = _create_test_app()

    def _override_get_db():
        try:
            yield db
        finally:
            pass

    test_app.dependency_overrides[get_db] = _override_get_db
    c = TestClient(test_app, raise_server_exceptions=False)
    yield c
    test_app.dependency_overrides.clear()


@pytest.fixture
def sample_user_data():
    return {
        "email": "test@example.com",
        "password": "Test1234",
        "first_name": "Test",
        "last_name": "Kullanici",
        "role": "USER",
    }


@pytest.fixture
def sample_provider_data():
    return {
        "email": "provider@example.com",
        "password": "Provider1234",
        "first_name": "Test",
        "last_name": "Uzman",
        "role": "PROVIDER",
    }
