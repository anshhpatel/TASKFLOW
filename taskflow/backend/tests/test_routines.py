from datetime import date, timedelta
from fastapi.testclient import TestClient


def test_tc12_create_routine(client: TestClient, auth_headers: dict):
    """TC-12: Create routine → 201 persisted."""
    payload = {
        "name": "Morning Code Review",
        "description": "Inspect PRs and team reviews before standup",
        "schedule_days": "mon,tue,wed,thu,fri",
        "active": True,
    }
    response = client.post("/api/routines", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["schedule_days"] == "mon,tue,wed,thu,fri"
    assert data["active"] is True
    assert "id" in data


def test_tc13_complete_routine_today_preserves_past_dates(
    client: TestClient, auth_headers: dict
):
    """TC-13: Complete routine today → log updated, previous date unchanged."""
    # 1. Create daily routine
    routine_res = client.post(
        "/api/routines",
        json={
            "name": "Daily Standup Notes",
            "schedule_days": "mon,tue,wed,thu,fri,sat,sun",
        },
        headers=auth_headers,
    )
    routine_id = routine_res.json()["id"]

    today = date.today()
    yesterday = today - timedelta(days=1)

    # 2. Mark yesterday as completed
    res_yesterday = client.put(
        f"/api/routines/{routine_id}/completions/{yesterday.isoformat()}",
        json={"completed": True},
        headers=auth_headers,
    )
    assert res_yesterday.status_code == 200

    # 3. Mark today as completed
    res_today = client.put(
        f"/api/routines/{routine_id}/completions/{today.isoformat()}",
        json={"completed": True},
        headers=auth_headers,
    )
    assert res_today.status_code == 200

    # 4. Now unmark today (set to False)
    res_unmark = client.put(
        f"/api/routines/{routine_id}/completions/{today.isoformat()}",
        json={"completed": False},
        headers=auth_headers,
    )
    assert res_unmark.status_code == 200

    # 5. Check daily missions for yesterday and today to verify yesterday remains completed
    yesterday_missions = client.get(
        f"/api/daily-missions?date={yesterday.isoformat()}",
        headers=auth_headers,
    )
    y_occurrence = next(
        r
        for r in yesterday_missions.json()["routine_occurrences"]
        if r["routine_id"] == routine_id
    )
    assert y_occurrence["completed"] is True

    today_missions = client.get(
        f"/api/daily-missions?date={today.isoformat()}",
        headers=auth_headers,
    )
    t_occurrence = next(
        r
        for r in today_missions.json()["routine_occurrences"]
        if r["routine_id"] == routine_id
    )
    assert t_occurrence["completed"] is False


def test_routine_soft_delete(client: TestClient, auth_headers: dict):
    """Verify DELETE /routines/{id} deactivates routine (active=False)."""
    routine_res = client.post(
        "/api/routines",
        json={
            "name": "Deactivation Candidate",
            "schedule_days": "mon,wed,fri",
        },
        headers=auth_headers,
    )
    routine_id = routine_res.json()["id"]

    del_res = client.delete(f"/api/routines/{routine_id}", headers=auth_headers)
    assert del_res.status_code == 200

    routines_list = client.get("/api/routines", headers=auth_headers).json()
    deactivated = next(r for r in routines_list if r["id"] == routine_id)
    assert deactivated["active"] is False
