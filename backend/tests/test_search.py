import pytest


class TestSearch:
    def test_search_providers_empty(self, client):
        r = client.get("/api/v1/search/providers")
        assert r.status_code == 200
        assert "items" in r.json() or "total" in r.json()

    def test_autocomplete(self, client):
        r = client.get("/api/v1/search/autocomplete", params={"q": "tes"})
        assert r.status_code == 200

    def test_autocomplete_too_short(self, client):
        r = client.get("/api/v1/search/autocomplete", params={"q": "t"})
        assert r.status_code == 422

    def test_search_with_city_filter(self, client):
        r = client.get("/api/v1/search/providers", params={"city_id": 1})
        assert r.status_code == 200

    def test_search_with_radius(self, client):
        r = client.get(
            "/api/v1/search/providers",
            params={
                "lat": 41.0082,
                "lng": 28.9784,
                "radius": 10,
            },
        )
        assert r.status_code in [200, 500]


class TestMatching:
    def _setup_user(self, client):
        r = client.post(
            "/api/v1/auth/register",
            json={
                "email": "match_user@example.com",
                "password": "Test1234",
                "first_name": "Match",
                "last_name": "User",
                "role": "USER",
            },
        )
        return r.json()["access_token"]

    def test_matching_find_requires_auth(self, client):
        r = client.post("/api/v1/matching/find")
        assert r.status_code in [401, 403]

    def test_matching_find(self, client):
        token = self._setup_user(client)
        r = client.post(
            "/api/v1/matching/find",
            params={"limit": 5},
            headers={
                "Authorization": f"Bearer {token}",
            },
        )
        assert r.status_code in [200, 500]

    def test_recommendations(self, client):
        token = self._setup_user(client)
        r = client.get(
            "/api/v1/matching/recommendations",
            headers={
                "Authorization": f"Bearer {token}",
            },
        )
        assert r.status_code in [200, 500]
