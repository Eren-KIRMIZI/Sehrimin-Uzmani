import pytest


def _auth_header(token):
    return {"Authorization": f"Bearer {token}"}


class TestPromotion:
    def _setup_provider(self, client):
        r = client.post("/api/v1/auth/register", json={
            "email": "promo_provider@example.com",
            "password": "Provider1234",
            "first_name": "Promo",
            "last_name": "Provider",
            "role": "PROVIDER",
        })
        token = r.json()["access_token"]
        client.post("/api/v1/providers/me", json={
            "business_name": "Promo Biz",
        }, headers=_auth_header(token))
        return token

    def test_list_my_promotions(self, client):
        token = self._setup_provider(client)
        r = client.get("/api/v1/promotions/my", headers=_auth_header(token))
        assert r.status_code == 200

    def test_user_cannot_create_promotion(self, client):
        r = client.post("/api/v1/auth/register", json={
            "email": "promo_user@example.com",
            "password": "Test1234",
            "first_name": "No",
            "last_name": "Promo",
            "role": "USER",
        })
        token = r.json()["access_token"]
        r2 = client.post("/api/v1/promotions/", json={
            "category_id": 1,
            "budget": 100,
            "bid_amount": 1,
        }, headers=_auth_header(token))
        assert r2.status_code in [403, 422]

    def test_impression_rate_limit(self, client):
        token = self._setup_provider(client)
        for i in range(65):
            client.post("/api/v1/promotions/99999/impression")
        r = client.post("/api/v1/promotions/99999/impression")
        assert r.status_code == 429
