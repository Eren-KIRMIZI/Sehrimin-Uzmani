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


def _setup_provider(client, db, email="crm_provider@example.com"):
    r = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Provider1234",
            "first_name": "CRM",
            "last_name": "Provider",
            "role": "PROVIDER",
        },
    )
    token = r.json()["access_token"]

    from app.modules.users.models import User
    from app.modules.providers.models import ProviderProfile

    user = db.query(User).filter(User.email == email).first()
    user.role = "PROVIDER"

    profile = ProviderProfile(user_id=user.id, business_name="CRM Test Provider")
    db.add(profile)
    db.flush()
    db.refresh(profile)

    return token


class TestCRMDashboard:
    def test_dashboard_requires_provider_role(self, client, sample_user_data):
        r = client.post("/api/v1/auth/register", json=sample_user_data)
        token = r.json()["access_token"]
        r2 = client.get(
            "/api/v1/providers/me/crm/dashboard", headers=_auth_header(token)
        )
        assert r2.status_code == 403

    def test_dashboard_empty(self, client, db):
        token = _setup_provider(client, db, "crm_dash@example.com")
        r = client.get(
            "/api/v1/providers/me/crm/dashboard", headers=_auth_header(token)
        )
        assert r.status_code == 200
        data = r.json()
        assert "performance" in data
        assert "summary" in data
        assert data["summary"]["revenue_30d"] == 0.0


class TestCRMCustomers:
    def test_customers_empty(self, client, db):
        token = _setup_provider(client, db, "crm_cust@example.com")
        r = client.get(
            "/api/v1/providers/me/crm/customers", headers=_auth_header(token)
        )
        assert r.status_code == 200
        assert isinstance(r.json(), list)


class TestCRMRevenue:
    def test_revenue_empty(self, client, db):
        token = _setup_provider(client, db, "crm_rev@example.com")
        r = client.get("/api/v1/providers/me/crm/revenue", headers=_auth_header(token))
        assert r.status_code == 200
        data = r.json()
        assert data["total_gross"] == 0.0
        assert data["transaction_count"] == 0

    def test_revenue_custom_days(self, client, db):
        token = _setup_provider(client, db, "crm_rev2@example.com")
        r = client.get(
            "/api/v1/providers/me/crm/revenue",
            params={"days": 7},
            headers=_auth_header(token),
        )
        assert r.status_code == 200
        assert r.json()["period_days"] == 7


class TestCRMCalendar:
    def test_calendar_empty(self, client, db):
        token = _setup_provider(client, db, "crm_cal@example.com")
        r = client.get("/api/v1/providers/me/crm/calendar", headers=_auth_header(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)


class TestCRMConversion:
    def test_conversion_empty(self, client, db):
        token = _setup_provider(client, db, "crm_conv@example.com")
        r = client.get(
            "/api/v1/providers/me/crm/conversion", headers=_auth_header(token)
        )
        assert r.status_code == 200
        data = r.json()
        assert data["quotes_sent"] == 0
        assert data["conversion_rate"] == 0


class TestCRMTopServices:
    def test_top_services_empty(self, client, db):
        token = _setup_provider(client, db, "crm_svc@example.com")
        r = client.get(
            "/api/v1/providers/me/crm/top-services",
            headers=_auth_header(token),
        )
        assert r.status_code == 200
        assert r.json()["services"] == []


class TestCRMRegional:
    def test_regional_no_areas(self, client, db):
        token = _setup_provider(client, db, "crm_reg@example.com")
        r = client.get("/api/v1/providers/me/crm/regional", headers=_auth_header(token))
        assert r.status_code == 200
