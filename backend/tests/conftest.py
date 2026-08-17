import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base

TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client():
    return TestClient(app)


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
