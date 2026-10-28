from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Verify that GET /health returns 200 ok without authentication."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "timestamp" in data


def test_tc01_register_valid_user(client: TestClient):
    """TC-01: Register valid user → 201, no password hash returned."""
    payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "SecurePassword999!",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "jane@example.com"
    assert data["name"] == "Jane Doe"
    assert "id" in data
    assert "created_at" in data
    # Ensure password hash is never exposed
    assert "password" not in data
    assert "password_hash" not in data


def test_tc02_register_duplicate_email(client: TestClient):
    """TC-02: Register duplicate email → 409 conflict response."""
    payload = {
        "name": "First User",
        "email": "duplicate@example.com",
        "password": "Password123!",
    }
    first_res = client.post("/api/auth/register", json=payload)
    assert first_res.status_code == 201

    duplicate_payload = {
        "name": "Second User",
        "email": "duplicate@example.com",
        "password": "DifferentPassword456!",
    }
    dup_res = client.post("/api/auth/register", json=duplicate_payload)
    assert dup_res.status_code == 409
    assert "Email is already registered" in dup_res.json()["detail"]


def test_tc03_login_valid_credentials(client: TestClient):
    """TC-03: Login valid credentials → 200 with access_token."""
    client.post(
        "/api/auth/register",
        json={
            "name": "Login Tester",
            "email": "login@example.com",
            "password": "ValidPassword123!",
        },
    )

    login_res = client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "ValidPassword123!"},
    )
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 20


def test_tc04_login_invalid_credentials(client: TestClient):
    """TC-04: Login invalid credentials → 401 generic message."""
    client.post(
        "/api/auth/register",
        json={
            "name": "Login Tester",
            "email": "valid@example.com",
            "password": "ValidPassword123!",
        },
    )

    # Wrong password
    bad_pw_res = client.post(
        "/api/auth/login",
        json={"email": "valid@example.com", "password": "WrongPassword!"},
    )
    assert bad_pw_res.status_code == 401
    assert "Invalid email or password" in bad_pw_res.json()["detail"]

    # Non-existent email
    bad_email_res = client.post(
        "/api/auth/login",
        json={"email": "nonexistent@example.com", "password": "AnyPassword!"},
    )
    assert bad_email_res.status_code == 401
    assert "Invalid email or password" in bad_email_res.json()["detail"]


def test_auth_me_and_logout(client: TestClient, auth_headers: dict):
    """Verify /auth/me returns current user profile and logout succeeds."""
    me_res = client.get("/api/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    data = me_res.json()
    assert data["email"] == "alex@example.com"
    assert "password_hash" not in data

    logout_res = client.post("/api/auth/logout", headers=auth_headers)
    assert logout_res.status_code == 200
    assert logout_res.json()["message"] == "logged out"
