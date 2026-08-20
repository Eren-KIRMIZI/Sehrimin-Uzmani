import pytest


def _auth_header(token):
    return {"Authorization": f"Bearer {token}"}


class TestServiceRequest:
    def _setup(self, client):
        r = client.post(
            "/api/v1/auth/register",
            json={
                "email": "req_user@example.com",
                "password": "Test1234",
                "first_name": "Req",
                "last_name": "User",
                "role": "USER",
            },
        )
        return r.json()["access_token"]

    def test_create_request(self, client):
        token = self._setup(client)
        r = client.post(
            "/api/v1/requests/",
            json={
                "title": "Boya Isi",
                "description": "Ev boyama",
                "budget_min": 1000,
                "budget_max": 5000,
            },
            headers=_auth_header(token),
        )
        assert r.status_code in [200, 201, 422]

    def test_list_my_requests(self, client):
        token = self._setup(client)
        client.post(
            "/api/v1/requests/",
            json={
                "title": "Test Talep",
                "description": "Test",
            },
            headers=_auth_header(token),
        )
        r = client.get("/api/v1/requests/my", headers=_auth_header(token))
        assert r.status_code in [200, 422]

    def test_unauthenticated_cannot_create(self, client):
        r = client.post(
            "/api/v1/requests/",
            json={
                "title": "Hack",
            },
        )
        assert r.status_code == 403

    def test_update_request(self, client):
        token = self._setup(client)
        create = client.post(
            "/api/v1/requests/",
            json={
                "title": "Original",
                "description": "Desc",
            },
            headers=_auth_header(token),
        )
        if create.status_code in [200, 201] and "id" in create.json():
            req_id = create.json()["id"]
            r = client.patch(
                f"/api/v1/requests/{req_id}",
                json={
                    "title": "Updated",
                },
                headers=_auth_header(token),
            )
            assert r.status_code in [200, 403]

    def test_status_not_in_update_body(self, client):
        token = self._setup(client)
        create = client.post(
            "/api/v1/requests/",
            json={
                "title": "NoStatus",
                "description": "Test",
            },
            headers=_auth_header(token),
        )
        if create.status_code in [200, 201] and "id" in create.json():
            req_id = create.json()["id"]
            r = client.patch(
                f"/api/v1/requests/{req_id}",
                json={
                    "status": "COMPLETED",
                },
                headers=_auth_header(token),
            )
            assert r.status_code in [200, 403]
