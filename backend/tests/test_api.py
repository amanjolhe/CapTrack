import pytest
from fastapi.testclient import TestClient
from app.main import app

import asyncio
from app.services.scheduler import sync_live_ipos_to_db

@pytest.fixture
def client():
    asyncio.run(sync_live_ipos_to_db())
    with TestClient(app) as c:
        yield c

def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_ipo_stats(client):
    response = client.get("/ipo/stats")
    assert response.status_code == 200
    data = response.json()
    assert "open_count" in data
    assert "upcoming_count" in data
    assert "closed_count" in data
    assert "listed_gains_count" in data
    assert "listed_loss_count" in data

def test_ipo_list(client):
    response = client.get("/ipo/list")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "name" in data[0]
    assert "latest_gmp" in data[0]
    assert "total_subscription_x" in data[0]

def test_ipo_details(client):
    list_res = client.get("/ipo/list")
    ipo_id = list_res.json()[0]["id"]

    response = client.get(f"/ipo/{ipo_id}/details")
    assert response.status_code == 200
    details = response.json()
    assert "metadata" in details
    assert "latest_gmp" in details
    assert "financials" in details
    assert "gemini_summary" in details

def test_ipo_subscription(client):
    list_res = client.get("/ipo/list")
    ipo_id = list_res.json()[0]["id"]

    response = client.get(f"/ipo/{ipo_id}/subscription")
    assert response.status_code == 200
    subs = response.json()
    assert isinstance(subs, list)
    if len(subs) > 0:
        assert "qib_x" in subs[0]
        assert "retail_x" in subs[0]
        assert "total_x" in subs[0]

def test_watchlist_toggle(client):
    list_res = client.get("/ipo/list")
    ipo_id = list_res.json()[0]["id"]

    # Toggle Watch (Add)
    res_add = client.post(f"/ipo/{ipo_id}/watch")
    assert res_add.status_code == 200
    assert res_add.json()["is_watched"] is True

    # Check Watchlist endpoint
    res_watch = client.get("/watchlist")
    assert res_watch.status_code == 200
    watched_ids = [w["ipo"]["id"] for w in res_watch.json()]
    assert ipo_id in watched_ids

    # Toggle Watch (Remove)
    res_remove = client.post(f"/ipo/{ipo_id}/watch")
    assert res_remove.status_code == 200
    assert res_remove.json()["is_watched"] is False

def test_reminder_setup(client):
    list_res = client.get("/ipo/list")
    ipo_id = list_res.json()[0]["id"]

    response = client.post(f"/ipo/{ipo_id}/reminder?reminder_time=2026-09-25%2009:30&event_type=open_date")
    assert response.status_code == 200
    assert response.json()["message"] == "Reminder scheduled successfully"

    rem_res = client.get("/reminders")
    assert rem_res.status_code == 200
    reminders = rem_res.json()
    assert len(reminders) >= 1
