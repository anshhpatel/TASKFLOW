from datetime import date, timedelta
import pytest
from fastapi.testclient import TestClient


def test_tc17_progress_summary_derives_from_persisted_records(
    client: TestClient, auth_headers: dict
):
    """TC-17: Read progress summary -> Counts match task/routine records."""
    today = date.today()
    from_date = today - timedelta(days=6)
    to_date = today

    # 1. Create and complete 2 tasks, leave 1 pending
    t1 = client.post(
        "/api/tasks",
        json={"title": "Completed Task 1"},
        headers=auth_headers,
    ).json()
    t2 = client.post(
        "/api/tasks",
        json={"title": "Completed Task 2"},
        headers=auth_headers,
    ).json()
    t3 = client.post(
        "/api/tasks",
        json={"title": "Pending Task 3"},
        headers=auth_headers,
    ).json()

    client.patch(f"/api/tasks/{t1['id']}/complete", headers=auth_headers)
    client.patch(f"/api/tasks/{t2['id']}/complete", headers=auth_headers)

    # 2. Create a routine that runs daily
    routine = client.post(
        "/api/routines",
        json={
            "name": "Daily Stretch",
            "schedule_days": "mon,tue,wed,thu,fri,sat,sun",
        },
        headers=auth_headers,
    ).json()

    # Complete routine for today
    client.put(
        f"/api/routines/{routine['id']}/completions/{today.isoformat()}",
        json={"completed": True},
        headers=auth_headers,
    )

    # 3. Fetch progress summary for the 7-day period
    res = client.get(
        f"/api/progress/summary?from={from_date.isoformat()}&to={to_date.isoformat()}",
        headers=auth_headers,
    )
    assert res.status_code == 200
    data = res.json()

    # Verify task counts derived from real persisted data
    assert data["tasks_completed"] == 2
    assert data["tasks_pending"] == 1
    assert data["tasks_total"] == 3
    assert data["completion_rate_tasks"] == 66.67

    # Verify routine counts
    assert data["routines_completed_occurrences"] == 1
    assert data["routines_total_occurrences"] == 7  # 7 days in range for daily routine
    assert len(data["daily_breakdown"]) == 7

    # Find today's breakdown item
    today_item = next(
        item for item in data["daily_breakdown"] if item["date"] == today.isoformat()
    )
    assert today_item["tasks_completed"] == 2
    assert today_item["routines_completed"] == 1


def test_progress_summary_invalid_date_range(
    client: TestClient, auth_headers: dict
):
    """Test error handling when 'from' is after 'to'."""
    res = client.get(
        "/api/progress/summary?from=2026-11-10&to=2026-11-01",
        headers=auth_headers,
    )
    assert res.status_code == 400
    assert "'from' date cannot be after 'to' date" in res.json()["detail"]
