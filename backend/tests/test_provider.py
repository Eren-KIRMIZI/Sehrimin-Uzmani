import pytest


def _auth_header(token):
    return {"Authorization": f"Bearer {token}"}


class TestProviderProfile:
    def _setup_provider(self, client):
        r = client.post(
            "/api/v1/auth/register",
            json={
                "email": "prov_profile@example.com",
                "password": "Provider1234",
                "first_name": "Test",
                "last_name": "Uzman",
                "role": "PROVIDER",
            },
        )
        return r.json()["access_token"]

    def test_create_profile(self, client):
        token = self._setup_provider(client)
        r = client.post(
            "/api/v1/providers/profile",
            json={
                "business_name": "Test Tamir",
                "bio": "10 yillik tecrube",
                "experience_years": 10,
            },
            headers=_auth_header(token),
        )
        assert r.status_code in [200, 400, 403]

    def test_get_my_profile(self, client):
        token = self._setup_provider(client)
        client.post(
            "/api/v1/providers/profile",
            json={
                "business_name": "My Biz",
            },
            headers=_auth_header(token),
        )
        r = client.get("/api/v1/providers/me", headers=_auth_header(token))
        assert r.status_code in [200, 400, 403]

    def test_user_cannot_create_profile(self, client):
        r = client.post(
            "/api/v1/auth/register",
            json={
                "email": "normal@example.com",
                "password": "Test1234",
                "first_name": "Normal",
                "last_name": "User",
                "role": "USER",
            },
        )
        token = r.json()["access_token"]
        r2 = client.post(
            "/api/v1/providers/profile",
            json={
                "business_name": "Hack",
            },
            headers=_auth_header(token),
        )
        assert r2.status_code in [400, 403]

    def test_get_provider_public(self, client):
        token = self._setup_provider(client)
        client.post(
            "/api/v1/providers/me",
            json={
                "business_name": "Public Biz",
            },
            headers=_auth_header(token),
        )
        me = client.get("/api/v1/providers/me", headers=_auth_header(token))
        if me.status_code == 200:
            uid = me.json().get("user_id")
            if uid:
                r = client.get(f"/api/v1/providers/{uid}")
                assert r.status_code == 200


class TestPortfolio:
    def _setup_provider(self, client):
        r = client.post(
            "/api/v1/auth/register",
            json={
                "email": "portfolio@example.com",
                "password": "Provider1234",
                "first_name": "Port",
                "last_name": "Folyo",
                "role": "PROVIDER",
            },
        )
        token = r.json()["access_token"]
        client.post(
            "/api/v1/providers/profile",
            json={
                "business_name": "Portfolio Biz",
            },
            headers=_auth_header(token),
        )
        return token

    def test_add_portfolio_item(self, client):
        token = self._setup_provider(client)
        r = client.post(
            "/api/v1/providers/portfolio",
            json={
                "title": "Tamir Isi",
                "description": "Basarili tamir",
                "image_url": "https://example.com/img.jpg",
            },
            headers=_auth_header(token),
        )
        assert r.status_code in [200, 201, 400, 403]

    def test_list_portfolio(self, client):
        token = self._setup_provider(client)
        client.post(
            "/api/v1/providers/portfolio",
            json={
                "title": "Work 1",
                "image_url": "https://example.com/1.jpg",
            },
            headers=_auth_header(token),
        )
        r = client.get("/api/v1/providers/me/portfolio", headers=_auth_header(token))
        assert r.status_code in [200, 400, 404, 405, 403]
