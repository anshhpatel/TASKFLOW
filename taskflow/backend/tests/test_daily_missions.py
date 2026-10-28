from datetime import date, datetime, timedelta, timezone
from fastapi.testclient import TestClient

WEEKDAY_NAMES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


def test_tc14_daily_missions_aggregation(
    client: TestClient, auth_headers: dict
):
    """TC-14: Daily missions for date → tasks and routines correctly aggregated."""
    target_date = date(2026, 11, 2)  # 2026-11-02 is a Monday
    assert WEEKDAY_NAMES[target_date.weekday()] == "mon"

    # 1. Create task with deadline on target_date
    client.post(
        "/api/tasks",
        json={
            "title": "Task Due On Monday",
            "deadline": datetime(2026, 11, 2, 17, 0, 0, tzinfo=timezone.utc).isoformat(),
        },
        headers=auth_headers,
    )

    # 2. Create task with scheduled_start on target_date
    client.post(
        "/api/tasks",
        json={
            "title": "Task Scheduled On Monday",
            "scheduled_start": datetime(2026, 11, 2, 9, 0, 0, tzinfo=timezone.utc).isoformat(),
        },
        headers=auth_headers,
    )

    # 3. Create task on Tuesday (should NOT appear on Monday)
    client.post(
        "/api/tasks",
        json={
            "title": "Task For Tuesday Only",
            "deadline": datetime(2026, 11, 3, 10, 0, 0, tzinfo=timezone.utc).isoformat(),
        },
        headers=auth_headers,
    )

    # 4. Create routine scheduled for Monday
    mon_routine = client.post(
        "/api/routines",
        json={
            "name": "Monday Planning",
            "schedule_days": "mon,wed,fri",
        },
        headers=auth_headers,
    ).json()

    # 5. Create routine scheduled for Tuesday only (should NOT appear on Monday)
    client.post(
        "/api/routines",
        json={
            "name": "Tuesday Sync",
            "schedule_days": "tue",
        },
        headers=auth_headers,
    )

    # 6. Fetch daily missions for target_date
    response = client.get(
        f"/api/daily-missions?date={target_date.isoformat()}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()

    task_titles = [t["title"] for t in data["tasks"]]
    assert "Task Due On Monday" in task_titles
    assert "Task Scheduled On Monday" in task_titles
    assert "Task For Tuesday Only" not in task_titles

    routine_names = [r["name"] for r in data["routine_occurrences"]]
    assert "Monday Planning" in routine_names
    assert "Tuesday Sync" not in routine_names

    # Check summary
    assert data["summary"]["total"] == 3  # 2 tasks + 1 routine
    assert data["summary"]["completed"] == 0

    # Complete the routine on target_date
    client.put(
        f"/api/routines/{mon_routine['id']}/completions/{target_date.isoformat()}",
        json={"completed": True},
        headers=auth_headers,
    )

    # Re-fetch and check completion count
    updated = client.get(
        f"/api/daily-missions?date={target_date.isoformat()}",
        headers=auth_headers,
    ).json()
    assert updated["summary"]["completed"] == 1
