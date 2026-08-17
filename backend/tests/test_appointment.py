import pytest


def _auth_header(token):
    return {"Authorization": f"Bearer {token}"}


class TestAppointmentFlow:
    def _setup_customer(self, client):
        r = client.post("/api/v1/auth/register", json={
            "email": "appt_customer@example.com",
            "password": "Test1234",
            "first_name": "Cust",
            "last_name": "User",
            "role": "USER",
        })
        return r.json()["access_token"]

    def _setup_provider(self, client):
        r = client.post("/api/v1/auth/register", json={
            "email": "appt_provider@example.com",
            "password": "Provider1234",
            "first_name": "Prov",
            "last_name": "User",
            "role": "PROVIDER",
        })
        return r.json()["access_token"]

    def test_list_my_appointments(self, client):
        token = self._setup_customer(client)
        r = client.get("/api/v1/appointments/my", headers=_auth_header(token))
        assert r.status_code in [200, 422]

    def test_provider_list_appointments(self, client):
        token = self._setup_provider(client)
        r = client.get("/api/v1/appointments/my", headers=_auth_header(token))
        assert r.status_code in [200, 422]

    def test_unauthenticated_cannot_list(self, client):
        r = client.get("/api/v1/appointments/my")
        assert r.status_code == 403
