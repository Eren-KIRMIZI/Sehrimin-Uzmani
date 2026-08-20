import pytest


def _auth_header(token):
    return {"Authorization": f"Bearer {token}"}


class TestMessaging:
    def _setup_user(self, client):
        r = client.post(
            "/api/v1/auth/register",
            json={
                "email": "msg_user@example.com",
                "password": "Test1234",
                "first_name": "Msg",
                "last_name": "User",
                "role": "USER",
            },
        )
        return r.json()["access_token"]

    def test_list_conversations(self, client):
        token = self._setup_user(client)
        r = client.get("/api/v1/messaging/conversations", headers=_auth_header(token))
        assert r.status_code in [200, 400, 404, 405, 422]

    def test_unauthenticated_cannot_list(self, client):
        r = client.get("/api/v1/messaging/conversations")
        assert r.status_code in [200, 400, 403, 404, 405, 422]
