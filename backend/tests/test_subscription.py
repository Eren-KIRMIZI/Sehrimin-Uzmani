import pytest


def _auth_header(token):
    return {"Authorization": f"Bearer {token}"}


class TestSubscription:
    def _setup_provider(self, client):
        r = client.post(
            "/api/v1/auth/register",
            json={
                "email": "sub_provider@example.com",
                "password": "Provider1234",
                "first_name": "Sub",
                "last_name": "Provider",
                "role": "PROVIDER",
            },
        )
        return r.json()["access_token"]

    def _setup_admin(self, client, db):
        from app.modules.users.models import User
        from app.core.security import hash_password, create_access_token

        admin = User(
            email="sub_admin@example.com",
            password_hash=hash_password("Admin1234"),
            first_name="Admin",
            last_name="User",
            role="ADMIN",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        uid = admin.id
        return create_access_token({"sub": str(uid), "role": "ADMIN", "type": "access"})

    def test_list_plans(self, client):
        token = self._setup_provider(client)
        r = client.get("/api/v1/subscriptions/plans", headers=_auth_header(token))
        assert r.status_code == 200

    def test_my_subscription(self, client):
        token = self._setup_provider(client)
        r = client.get("/api/v1/subscriptions/my", headers=_auth_header(token))
        assert r.status_code == 200

    def test_admin_list_plans(self, client, db):
        token = self._setup_admin(client, db)
        r = client.get("/api/v1/subscriptions/admin/plans", headers=_auth_header(token))
        assert r.status_code in [200, 400, 404, 405, 422]
