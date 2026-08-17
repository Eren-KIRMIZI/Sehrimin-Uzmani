import pytest


def _auth_header(token):
    return {"Authorization": f"Bearer {token}"}


class TestDispute:
    def _setup_user(self, client):
        r = client.post("/api/v1/auth/register", json={
            "email": "disp_user@example.com",
            "password": "Test1234",
            "first_name": "Disp",
            "last_name": "User",
            "role": "USER",
        })
        return r.json()["access_token"]

    def test_list_my_disputes(self, client):
        token = self._setup_user(client)
        r = client.get("/api/v1/disputes/my", headers=_auth_header(token))
        assert r.status_code in [200, 422]

    def test_unauthenticated_cannot_list(self, client):
        r = client.get("/api/v1/disputes/my")
        assert r.status_code in [403, 422]

    def test_evidence_requires_participant(self, client):
        token = self._setup_user(client)
        r = client.post("/api/v1/disputes/99999/evidence", params={
            "file_url": "https://example.com/proof.jpg",
            "description": "Kanit",
        }, headers=_auth_header(token))
        assert r.status_code in [403, 404]
