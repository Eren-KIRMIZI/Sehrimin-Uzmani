import pytest


def _auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def _register_user(client, email="user@example.com"):
    r = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Test1234",
            "first_name": "Test",
            "last_name": "User",
            "role": "USER",
        },
    )
    return r.json()["access_token"]


def _setup_provider(client, db, email="provider@example.com"):
    r = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Provider1234",
            "first_name": "Test",
            "last_name": "Provider",
            "role": "PROVIDER",
        },
    )
    token = r.json()["access_token"]

    from app.modules.users.models import User
    from app.modules.providers.models import ProviderProfile

    user = db.query(User).filter(User.email == email).first()
    user.role = "PROVIDER"

    profile = ProviderProfile(user_id=user.id, business_name="Test Provider")
    db.add(profile)
    db.flush()
    db.refresh(profile)

    return token, profile.id


class TestFavoritesAddRemove:
    def test_add_favorite(self, client, db):
        user_token = _register_user(client, "fav1@example.com")
        prov_token, prov_id = _setup_provider(client, db, "fav_prov1@example.com")
        assert prov_id is not None

        r = client.post(
            f"/api/v1/favorites/{prov_id}",
            headers=_auth_header(user_token),
        )
        assert r.status_code == 200
        assert r.json()["is_favorite"] is True

    def test_add_favorite_with_note(self, client, db):
        user_token = _register_user(client, "fav2@example.com")
        prov_token, prov_id = _setup_provider(client, db, "fav_prov2@example.com")

        r = client.post(
            f"/api/v1/favorites/{prov_id}",
            params={"note": "Harika uzman"},
            headers=_auth_header(user_token),
        )
        assert r.status_code == 200

    def test_toggle_favorite_removes(self, client, db):
        user_token = _register_user(client, "fav3@example.com")
        prov_token, prov_id = _setup_provider(client, db, "fav_prov3@example.com")

        client.post(f"/api/v1/favorites/{prov_id}", headers=_auth_header(user_token))
        r2 = client.post(
            f"/api/v1/favorites/{prov_id}", headers=_auth_header(user_token)
        )
        assert r2.json()["is_favorite"] is False

    def test_list_favorites(self, client):
        user_token = _register_user(client, "fav4@example.com")
        r = client.get("/api/v1/favorites", headers=_auth_header(user_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)


class TestFavoriteNote:
    def test_update_note(self, client, db):
        user_token = _register_user(client, "note1@example.com")
        prov_token, prov_id = _setup_provider(client, db, "note_prov1@example.com")

        client.post(f"/api/v1/favorites/{prov_id}", headers=_auth_header(user_token))
        r = client.patch(
            f"/api/v1/favorites/{prov_id}/note",
            params={"note": "Yeni not"},
            headers=_auth_header(user_token),
        )
        assert r.status_code == 200
        assert r.json()["note"] == "Yeni not"

    def test_update_note_not_found(self, client):
        user_token = _register_user(client, "note2@example.com")
        r = client.patch(
            "/api/v1/favorites/99999/note",
            params={"note": "test"},
            headers=_auth_header(user_token),
        )
        assert r.status_code in [404, 400]


class TestRehire:
    def test_rehaire_no_history(self, client, db):
        user_token = _register_user(client, "rehire1@example.com")
        prov_token, prov_id = _setup_provider(client, db, "rehire_prov1@example.com")

        r = client.post(
            f"/api/v1/favorites/{prov_id}/rehaire",
            headers=_auth_header(user_token),
        )
        assert r.status_code == 400


class TestProviderHistory:
    def test_history_empty(self, client, db):
        user_token = _register_user(client, "hist1@example.com")
        prov_token, prov_id = _setup_provider(client, db, "hist_prov1@example.com")

        r = client.get(
            f"/api/v1/favorites/{prov_id}/history",
            headers=_auth_header(user_token),
        )
        assert r.status_code == 200
        assert r.json()["total_jobs"] == 0
