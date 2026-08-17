import pytest


class TestSecurityRoleRestriction:
    def test_cannot_register_as_admin(self, client):
        response = client.post("/api/v1/auth/register", json={
            "email": "hacker@example.com",
            "password": "Hacker1234",
            "first_name": "Hacker",
            "last_name": "Biri",
            "role": "ADMIN",
        })
        assert response.status_code == 422

    def test_cannot_register_as_moderator(self, client):
        response = client.post("/api/v1/auth/register", json={
            "email": "mod@example.com",
            "password": "Moderator1234",
            "first_name": "Mod",
            "last_name": "Biri",
            "role": "MODERATOR",
        })
        assert response.status_code == 422


class TestSecurityPasswordPolicy:
    def test_reject_short_password(self, client):
        response = client.post("/api/v1/auth/register", json={
            "email": "short@example.com",
            "password": "Ab1",
            "first_name": "Test",
            "last_name": "User",
        })
        assert response.status_code == 422

    def test_reject_no_uppercase(self, client):
        response = client.post("/api/v1/auth/register", json={
            "email": "noupper@example.com",
            "password": "test1234",
            "first_name": "Test",
            "last_name": "User",
        })
        assert response.status_code == 422

    def test_reject_no_digit(self, client):
        response = client.post("/api/v1/auth/register", json={
            "email": "nodigit@example.com",
            "password": "TestTest",
            "first_name": "Test",
            "last_name": "User",
        })
        assert response.status_code == 422


class TestSecurityProtectedRoutes:
    def test_dashboard_requires_admin(self, client, sample_user_data):
        register = client.post("/api/v1/auth/register", json=sample_user_data)
        token = register.json()["access_token"]
        response = client.get("/api/v1/admin/dashboard", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 403

    def test_provider_routes_require_provider_role(self, client, sample_user_data):
        register = client.post("/api/v1/auth/register", json=sample_user_data)
        token = register.json()["access_token"]
        response = client.get("/api/v1/providers/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 403
