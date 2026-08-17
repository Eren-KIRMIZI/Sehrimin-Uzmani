import pytest


class TestAuthRegister:
    def test_register_user(self, client, sample_user_data):
        response = client.post("/api/v1/auth/register", json=sample_user_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == sample_user_data["email"]
        assert data["user"]["role"] == "USER"

    def test_register_provider(self, client, sample_provider_data):
        response = client.post("/api/v1/auth/register", json=sample_provider_data)
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "PROVIDER"

    def test_register_duplicate_email(self, client, sample_user_data):
        client.post("/api/v1/auth/register", json=sample_user_data)
        response = client.post("/api/v1/auth/register", json=sample_user_data)
        assert response.status_code == 409

    def test_register_invalid_role(self, client, sample_user_data):
        data = {**sample_user_data, "role": "ADMIN"}
        response = client.post("/api/v1/auth/register", json=data)
        assert response.status_code == 422

    def test_register_weak_password(self, client):
        data = {
            "email": "weak@example.com",
            "password": "123",
            "first_name": "Test",
            "last_name": "Kullanici",
        }
        response = client.post("/api/v1/auth/register", json=data)
        assert response.status_code == 422

    def test_register_missing_uppercase(self, client):
        data = {
            "email": "noupper@example.com",
            "password": "test1234",
            "first_name": "Test",
            "last_name": "Kullanici",
        }
        response = client.post("/api/v1/auth/register", json=data)
        assert response.status_code == 422


class TestAuthLogin:
    def test_login_success(self, client, sample_user_data):
        client.post("/api/v1/auth/register", json=sample_user_data)
        response = client.post("/api/v1/auth/login", json={
            "email": sample_user_data["email"],
            "password": sample_user_data["password"],
        })
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_login_wrong_password(self, client, sample_user_data):
        client.post("/api/v1/auth/register", json=sample_user_data)
        response = client.post("/api/v1/auth/login", json={
            "email": sample_user_data["email"],
            "password": "WrongPassword123",
        })
        assert response.status_code == 400

    def test_login_nonexistent_user(self, client):
        response = client.post("/api/v1/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "Test1234",
        })
        assert response.status_code == 400


class TestAuthMe:
    def test_get_me_authenticated(self, client, sample_user_data):
        register = client.post("/api/v1/auth/register", json=sample_user_data)
        token = register.json()["access_token"]
        response = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        assert response.json()["email"] == sample_user_data["email"]

    def test_get_me_unauthenticated(self, client):
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 403


class TestAuthRefresh:
    def test_refresh_token(self, client, sample_user_data):
        register = client.post("/api/v1/auth/register", json=sample_user_data)
        refresh_token = register.json()["refresh_token"]
        response = client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token,
        })
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_refresh_invalid_token(self, client):
        response = client.post("/api/v1/auth/refresh", json={
            "refresh_token": "invalid.token.here",
        })
        assert response.status_code in [400, 401]
