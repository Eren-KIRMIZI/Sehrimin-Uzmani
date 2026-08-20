import pytest


def _auth_header(token):
    return {"Authorization": f"Bearer {token}"}


class TestAdmin:
    def _setup_admin(self, client, db):
        from app.modules.users.models import User
        from app.core.security import hash_password, create_access_token

        admin = User(
            email="admin_test@example.com",
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

    def _setup_user(self, client):
        r = client.post(
            "/api/v1/auth/register",
            json={
                "email": "admin_target@example.com",
                "password": "Test1234",
                "first_name": "Target",
                "last_name": "User",
                "role": "USER",
            },
        )
        return r.json()["access_token"]

    def test_dashboard_requires_admin(self, client):
        user_token = self._setup_user(client)
        r = client.get("/api/v1/admin/dashboard", headers=_auth_header(user_token))
        assert r.status_code == 403

    def test_admin_dashboard(self, client, db):
        admin_token = self._setup_admin(client, db)
        r = client.get("/api/v1/admin/dashboard", headers=_auth_header(admin_token))
        assert r.status_code == 200

    def test_admin_list_users(self, client, db):
        admin_token = self._setup_admin(client, db)
        r = client.get("/api/v1/admin/users", headers=_auth_header(admin_token))
        assert r.status_code == 200

    def test_user_cannot_access_admin(self, client):
        user_token = self._setup_user(client)
        r = client.get("/api/v1/admin/users", headers=_auth_header(user_token))
        assert r.status_code == 403
