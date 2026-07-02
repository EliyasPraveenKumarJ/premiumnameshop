"""
PremiumNameShop backend regression tests.
Covers: auth (login/me/logout), domains CRUD, offers (create public, list admin,
mark read, delete), stats, categories, ProtectedRoute enforcement.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://domain-sales-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "yazziestech@gmail.com"
ADMIN_PASSWORD = "PremiumNames@2026"


# ---------- fixtures ----------
@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(api_client):
    r = api_client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and data["user"]["email"] == ADMIN_EMAIL
    return data["token"]


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- health ----------
class TestHealth:
    def test_root(self, api_client):
        r = api_client.get(f"{API}/")
        assert r.status_code == 200
        assert "PremiumNameShop" in r.json().get("message", "")


# ---------- auth ----------
class TestAuth:
    def test_login_invalid(self, api_client):
        r = api_client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_login_success_and_me(self, api_client, admin_token):
        r = api_client.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL
        assert r.json()["role"] == "admin"

    def test_me_requires_auth(self, api_client):
        r = requests.get(f"{API}/auth/me")  # bypass session cookies
        assert r.status_code == 401

    def test_logout(self, api_client, admin_token):
        r = api_client.post(f"{API}/auth/logout", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ---------- domains ----------
class TestDomainsPublic:
    def test_list_domains_public(self, api_client):
        r = api_client.get(f"{API}/domains")
        assert r.status_code == 200
        docs = r.json()
        assert isinstance(docs, list)
        assert len(docs) >= 50, f"Expected at least 50 seeded domains, got {len(docs)}"
        # No mongo _id leaked
        assert all("_id" not in d for d in docs)
        # Featured items exist
        assert any(d.get("featured") for d in docs)

    def test_list_domains_search(self, api_client):
        r = api_client.get(f"{API}/domains", params={"q": "juzz"})
        assert r.status_code == 200
        names = [d["name"].lower() for d in r.json()]
        assert any("juzz" in n for n in names)

    def test_list_domains_sort_price_asc(self, api_client):
        r = api_client.get(f"{API}/domains", params={"sort": "price_asc"})
        assert r.status_code == 200
        prices = [d.get("price") for d in r.json() if d.get("price") is not None]
        assert prices == sorted(prices)

    def test_list_domains_sort_az(self, api_client):
        r = api_client.get(f"{API}/domains", params={"sort": "az"})
        assert r.status_code == 200
        names = [d["name"].lower() for d in r.json()]
        assert names == sorted(names)

    def test_categories(self, api_client):
        r = api_client.get(f"{API}/categories")
        assert r.status_code == 200
        cats = r.json()
        assert isinstance(cats, list) and len(cats) > 0

    def test_domain_create_requires_auth(self, api_client):
        r = api_client.post(f"{API}/domains", json={"name": "unauthorized.com"})
        assert r.status_code == 401


class TestDomainsAdmin:
    _created_id = None
    _created_name = None

    def test_create_domain(self, api_client, auth_headers):
        name = f"TEST-{uuid.uuid4().hex[:8]}.com"
        payload = {
            "name": name, "price": 999, "category": "AI & Tech",
            "tags": ["TEST", "Brandable"], "description": "test domain",
            "featured": False, "status": "available",
        }
        r = api_client.post(f"{API}/domains", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["name"] == name and d["price"] == 999 and "id" in d
        TestDomainsAdmin._created_id = d["id"]
        TestDomainsAdmin._created_name = name

        # verify it shows on public GET
        r2 = api_client.get(f"{API}/domains", params={"q": "TEST-"})
        assert any(x["name"] == name for x in r2.json())

    def test_update_domain(self, api_client, auth_headers):
        assert TestDomainsAdmin._created_id, "prior create test must succeed"
        r = api_client.put(
            f"{API}/domains/{TestDomainsAdmin._created_id}",
            json={"price": 1234, "featured": True},
            headers=auth_headers,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["price"] == 1234 and d["featured"] is True
        # persistence check
        r2 = api_client.get(f"{API}/domains", params={"q": TestDomainsAdmin._created_name})
        match = [x for x in r2.json() if x["id"] == TestDomainsAdmin._created_id]
        assert match and match[0]["price"] == 1234 and match[0]["featured"] is True

    def test_delete_domain(self, api_client, auth_headers):
        assert TestDomainsAdmin._created_id
        r = api_client.delete(f"{API}/domains/{TestDomainsAdmin._created_id}", headers=auth_headers)
        assert r.status_code == 200
        # verify removal
        r2 = api_client.get(f"{API}/domains", params={"q": TestDomainsAdmin._created_name})
        assert not any(x["id"] == TestDomainsAdmin._created_id for x in r2.json())

    def test_delete_missing_domain_returns_404(self, api_client, auth_headers):
        r = api_client.delete(f"{API}/domains/{uuid.uuid4().hex}", headers=auth_headers)
        assert r.status_code == 404


# ---------- offers ----------
class TestOffers:
    _offer_id = None

    def test_create_offer_public(self, api_client):
        payload = {
            "domain_id": "some-id",
            "domain_name": "TEST-offer.com",
            "name": "Tester",
            "email": "TEST_offer@example.com",
            "offer_amount": 500,
            "message": "test inquiry",
        }
        r = api_client.post(f"{API}/offers", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["email"] == "TEST_offer@example.com"
        assert d["status"] == "new"
        assert "id" in d
        TestOffers._offer_id = d["id"]

    def test_create_offer_without_amount(self, api_client):
        r = api_client.post(f"{API}/offers", json={
            "domain_name": "TEST-onrequest.com",
            "name": "Tester2",
            "email": "TEST_priceask@example.com",
            "message": "please share price",
        })
        assert r.status_code == 200
        assert r.json()["offer_amount"] is None

    def test_list_offers_requires_auth(self, api_client):
        r = api_client.get(f"{API}/offers")
        assert r.status_code == 401

    def test_list_offers_admin(self, api_client, auth_headers):
        r = api_client.get(f"{API}/offers", headers=auth_headers)
        assert r.status_code == 200
        docs = r.json()
        assert isinstance(docs, list)
        assert any(o["id"] == TestOffers._offer_id for o in docs)

    def test_mark_offer_read(self, api_client, auth_headers):
        assert TestOffers._offer_id
        r = api_client.patch(f"{API}/offers/{TestOffers._offer_id}", headers=auth_headers)
        assert r.status_code == 200
        r2 = api_client.get(f"{API}/offers", headers=auth_headers)
        match = [o for o in r2.json() if o["id"] == TestOffers._offer_id]
        assert match and match[0]["status"] == "read"

    def test_delete_offer(self, api_client, auth_headers):
        assert TestOffers._offer_id
        r = api_client.delete(f"{API}/offers/{TestOffers._offer_id}", headers=auth_headers)
        assert r.status_code == 200
        r2 = api_client.get(f"{API}/offers", headers=auth_headers)
        assert not any(o["id"] == TestOffers._offer_id for o in r2.json())

    def test_cleanup_extra_offers(self, api_client, auth_headers):
        # remove any leftover TEST_ offers created above
        r = api_client.get(f"{API}/offers", headers=auth_headers)
        for o in r.json():
            if o.get("email", "").startswith("TEST_"):
                api_client.delete(f"{API}/offers/{o['id']}", headers=auth_headers)


# ---------- stats ----------
class TestStats:
    def test_stats_requires_auth(self, api_client):
        # bypass session so cookies from prior login are not sent
        r = requests.get(f"{API}/stats")
        assert r.status_code == 401

    def test_stats_admin(self, api_client, auth_headers):
        r = api_client.get(f"{API}/stats", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        for k in ["total", "available", "sold", "offers", "new_offers"]:
            assert k in d, f"missing key {k}"
        assert d["total"] >= 50
