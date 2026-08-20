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


class TestPriceEstimate:
    def test_estimate_requires_service_or_category(self, client):
        r = client.get("/api/v1/pricing/estimate")
        assert r.status_code == 400

    def test_estimate_with_category(self, client, db):
        from app.modules.categories.models import Category

        cat = Category(name="Test Kategori", slug="test-kategori")
        db.add(cat)
        db.commit()
        db.refresh(cat)

        r = client.get(f"/api/v1/pricing/estimate?category_id={cat.id}")
        assert r.status_code == 200
        data = r.json()
        assert "avg_price" in data
        assert data["currency"] == "TRY"
        assert data["sample_size"] == 0

    def test_estimate_with_service(self, client, db):
        from app.modules.categories.models import Category, Service, SubCategory

        cat = Category(name="Test Kategori 2", slug="test-kategori-2")
        db.add(cat)
        db.commit()
        db.refresh(cat)

        sub = SubCategory(
            name="Test Alt Kategori", slug="test-alt-kategori", category_id=cat.id
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)

        svc = Service(name="Test Hizmet", slug="test-hizmet", subcategory_id=sub.id)
        db.add(svc)
        db.commit()
        db.refresh(svc)

        r = client.get(f"/api/v1/pricing/estimate?service_id={svc.id}")
        assert r.status_code == 200
        data = r.json()
        assert "avg_price" in data

    def test_estimate_with_city(self, client, db):
        from app.modules.categories.models import Category
        from app.modules.locations.models import City

        city = City(name="İstanbul", plate_code="34")
        db.add(city)
        db.commit()
        db.refresh(city)

        cat = Category(name="Test Kategori 3", slug="test-kategori-3")
        db.add(cat)
        db.commit()
        db.refresh(cat)

        r = client.get(
            f"/api/v1/pricing/estimate?category_id={cat.id}&city_id={city.id}"
        )
        assert r.status_code == 200
        data = r.json()
        assert data["sample_size"] == 0


class TestQuoteComparison:
    def test_compare_requires_auth(self, client):
        r = client.get("/api/v1/pricing/compare/1")
        assert r.status_code in [401, 403]

    def test_compare_nonexistent_quote(self, client):
        token = _register_user(client, "comp@example.com")
        r2 = client.get("/api/v1/pricing/compare/999999", headers=_auth_header(token))
        assert r2.status_code == 404


class TestRefreshEstimates:
    def test_refresh_requires_admin(self, client):
        token = _register_user(client, "refresh@example.com")
        r2 = client.post("/api/v1/pricing/refresh", headers=_auth_header(token))
        assert r2.status_code == 403
