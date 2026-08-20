import pytest


def _auth_header(token):
    return {"Authorization": f"Bearer {token}"}


class TestReview:
    def _setup_user(self, client):
        r = client.post(
            "/api/v1/auth/register",
            json={
                "email": "review_user@example.com",
                "password": "Test1234",
                "first_name": "Rev",
                "last_name": "User",
                "role": "USER",
            },
        )
        return r.json()["access_token"]

    def _setup_provider(self, client):
        r = client.post(
            "/api/v1/auth/register",
            json={
                "email": "review_provider@example.com",
                "password": "Provider1234",
                "first_name": "Rev",
                "last_name": "Provider",
                "role": "PROVIDER",
            },
        )
        return r.json()["access_token"]

    def test_list_reviews_empty(self, client):
        token = self._setup_user(client)
        r = client.get("/api/v1/reviews/provider/99999", headers=_auth_header(token))
        assert r.status_code == 200

    def test_unauthenticated_can_read_reviews(self, client):
        r = client.get("/api/v1/reviews/provider/99999")
        assert r.status_code == 200

    def test_provider_reply_requires_provider_role(self, client):
        user_token = self._setup_user(client)
        r = client.post(
            "/api/v1/reviews/1/reply",
            json={
                "reply": "Tesekkurler",
            },
            headers=_auth_header(user_token),
        )
        assert r.status_code == 403
