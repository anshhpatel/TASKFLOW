import os
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models import *  # Ensure all models are registered

# NOTE: SQLite is used for prototype testing to run without a running PostgreSQL instance.
# TC-20 Persistence Note: In production PostgreSQL, records persist across process restarts.
# In testing with file-based SQLite (sqlite:///./test.db) or StaticPool, records persist across sessions.
TEST_DATABASE_URL = "sqlite:///./test.db"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=test_engine
)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create all tables before tests run and drop after session."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except OSError:
            pass


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Provide a clean DB session per test, rolling back and cleaning tables."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(autouse=True)
def clean_tables(db_session: Session):
    """Ensure database is clean before each test."""
    # Delete child rows first to satisfy foreign keys
    for table in reversed(Base.metadata.sorted_tables):
        db_session.execute(table.delete())
    db_session.commit()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """Test client with get_db dependency overridden to test SQLite session."""

    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client: TestClient) -> dict:
    """Register and log in a default test user, returning Authorization Bearer headers."""
    reg_payload = {
        "name": "Alex Tester",
        "email": "alex@example.com",
        "password": "SecretPassword123!",
    }
    client.post("/api/auth/register", json=reg_payload)

    login_res = client.post(
        "/api/auth/login",
        json={"email": "alex@example.com", "password": "SecretPassword123!"},
    )
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user_a_headers(client: TestClient) -> dict:
    """Headers for User A."""
    client.post(
        "/api/auth/register",
        json={
            "name": "User Alpha",
            "email": "user.a@example.com",
            "password": "PasswordA123!",
        },
    )
    res = client.post(
        "/api/auth/login",
        json={"email": "user.a@example.com", "password": "PasswordA123!"},
    )
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture
def user_b_headers(client: TestClient) -> dict:
    """Headers for User B."""
    client.post(
        "/api/auth/register",
        json={
            "name": "User Beta",
            "email": "user.b@example.com",
            "password": "PasswordB123!",
        },
    )
    res = client.post(
        "/api/auth/login",
        json={"email": "user.b@example.com", "password": "PasswordB123!"},
    )
    return {"Authorization": f"Bearer {res.json()['access_token']}"}
