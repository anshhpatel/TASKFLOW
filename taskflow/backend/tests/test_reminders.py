from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.jobs.reminder_scheduler import process_due_reminders
from app.models.notification import Notification


def test_tc15_create_reminder(client: TestClient, auth_headers: dict):
    """TC-15: Create reminder → reminder persists with valid target and due time."""
    # 1. Create a task
    task_res = client.post(
        "/api/tasks",
        json={"title": "Task for Reminder TC-15"},
        headers=auth_headers,
    )
    task_id = task_res.json()["id"]

    # 2. Create reminder
    due_time = datetime.now(timezone.utc).isoformat()
    rem_res = client.post(
        "/api/reminders",
        json={"task_id": task_id, "due_at": due_time},
        headers=auth_headers,
    )
    assert rem_res.status_code == 201
    data = rem_res.json()
    assert data["task_id"] == task_id
    assert data["routine_id"] is None
    assert data["enabled"] is True
    assert "id" in data

    # 3. Validation: both task_id and routine_id supplied or neither → 422
    invalid_res = client.post(
        "/api/reminders",
        json={"due_at": due_time},
        headers=auth_headers,
    )
    assert invalid_res.status_code == 422


def test_tc16_trigger_same_reminder_twice_deduplicates(
    client: TestClient, auth_headers: dict, db_session: Session
):
    """TC-16: Trigger same reminder twice → duplicate notification is not created."""
    # 1. Create task and due reminder
    task_res = client.post(
        "/api/tasks",
        json={"title": "High Priority Reminder Task"},
        headers=auth_headers,
    )
    task_id = task_res.json()["id"]

    past_time = datetime(2020, 1, 1, 12, 0, 0, tzinfo=timezone.utc).isoformat()
    rem_res = client.post(
        "/api/reminders",
        json={"task_id": task_id, "due_at": past_time},
        headers=auth_headers,
    )
    reminder_id = rem_res.json()["id"]

    # 2. Run reminder polling job first time
    process_due_reminders()

    # Verify notification created
    notifs_first = (
        db_session.query(Notification)
        .filter(Notification.reminder_id == reminder_id)
        .all()
    )
    assert len(notifs_first) == 1
    notif_id = notifs_first[0].id

    # 3. Run reminder polling job second time on the same date
    process_due_reminders()

    # Verify still exactly one notification (no duplicate created)
    notifs_second = (
        db_session.query(Notification)
        .filter(Notification.reminder_id == reminder_id)
        .all()
    )
    assert len(notifs_second) == 1

    # 4. Check notifications endpoint and mark as read
    get_notifs_res = client.get("/api/notifications", headers=auth_headers)
    assert get_notifs_res.status_code == 200
    assert len(get_notifs_res.json()) >= 1

    mark_read_res = client.patch(
        f"/api/notifications/{notif_id}/read", headers=auth_headers
    )
    assert mark_read_res.status_code == 200
    assert mark_read_res.json()["read_at"] is not None
