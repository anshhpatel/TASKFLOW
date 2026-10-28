from datetime import datetime, timezone
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.models.reminder import Reminder
from app.models.task import Task


def test_tc05_create_task_with_title(client: TestClient, auth_headers: dict):
    """TC-05: Create task with title → 201 persisted."""
    payload = {
        "title": "Complete Software Design Document",
        "description": "Finalize diagrams and architectural specifications",
        "priority": "high",
        "deadline": datetime.now(timezone.utc).isoformat(),
    }
    response = client.post("/api/tasks", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["description"] == payload["description"]
    assert data["priority"] == "high"
    assert data["status"] == "pending"
    assert "id" in data


def test_tc06_create_task_blank_title(client: TestClient, auth_headers: dict):
    """TC-06: Create task blank title → 422 validation error."""
    # Empty string
    response_empty = client.post(
        "/api/tasks", json={"title": ""}, headers=auth_headers
    )
    assert response_empty.status_code == 422

    # Whitespace only
    response_whitespace = client.post(
        "/api/tasks", json={"title": "    "}, headers=auth_headers
    )
    assert response_whitespace.status_code == 422


def test_tc07_update_task_changed_fields_only(
    client: TestClient, auth_headers: dict
):
    """TC-07: Update task → only submitted valid fields change."""
    create_res = client.post(
        "/api/tasks",
        json={
            "title": "Original Task Title",
            "description": "Original description",
            "priority": "low",
        },
        headers=auth_headers,
    )
    task_id = create_res.json()["id"]

    # Update only the priority
    patch_res = client.patch(
        f"/api/tasks/{task_id}",
        json={"priority": "high"},
        headers=auth_headers,
    )
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["priority"] == "high"
    assert data["title"] == "Original Task Title"
    assert data["description"] == "Original description"


def test_tc08_complete_task(client: TestClient, auth_headers: dict):
    """TC-08: Complete task → status=completed, completed_at set."""
    create_res = client.post(
        "/api/tasks",
        json={"title": "Task to complete"},
        headers=auth_headers,
    )
    task_id = create_res.json()["id"]

    complete_res = client.patch(
        f"/api/tasks/{task_id}/complete", headers=auth_headers
    )
    assert complete_res.status_code == 200
    data = complete_res.json()
    assert data["status"] == "completed"
    assert data["completed_at"] is not None

    # Test reopen
    reopen_res = client.patch(
        f"/api/tasks/{task_id}/reopen", headers=auth_headers
    )
    assert reopen_res.status_code == 200
    reopen_data = reopen_res.json()
    assert reopen_data["status"] == "pending"
    assert reopen_data["completed_at"] is None


def test_tc09_delete_task_with_reminder(
    client: TestClient, auth_headers: dict, db_session: Session
):
    """TC-09: Delete task (creates reminder first) → task+reminder gone, 404 afterward."""
    # 1. Create task
    task_res = client.post(
        "/api/tasks", json={"title": "Task with reminder"}, headers=auth_headers
    )
    task_id = task_res.json()["id"]

    # 2. Create reminder for task
    reminder_res = client.post(
        "/api/reminders",
        json={
            "task_id": task_id,
            "due_at": datetime.now(timezone.utc).isoformat(),
        },
        headers=auth_headers,
    )
    assert reminder_res.status_code == 201
    reminder_id = reminder_res.json()["id"]

    # Verify reminder is in database
    assert (
        db_session.query(Reminder).filter(Reminder.id == reminder_id).first()
        is not None
    )

    # 3. Delete task
    del_res = client.delete(f"/api/tasks/{task_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # 4. Confirm task is gone (404)
    get_task_res = client.get(f"/api/tasks/{task_id}", headers=auth_headers)
    assert get_task_res.status_code == 404

    # 5. Confirm reminder is cascade deleted
    rem_in_db = (
        db_session.query(Reminder).filter(Reminder.id == reminder_id).first()
    )
    assert rem_in_db is None


def test_tc19_user_a_requests_user_b_task(
    client: TestClient, user_a_headers: dict, user_b_headers: dict
):
    """TC-19: User A requests User B task → 404 not found (no data leakage)."""
    # User B creates a task
    create_res = client.post(
        "/api/tasks",
        json={"title": "User B Confidential Task"},
        headers=user_b_headers,
    )
    task_b_id = create_res.json()["id"]

    # User A attempts to read User B's task
    read_res = client.get(f"/api/tasks/{task_b_id}", headers=user_a_headers)
    assert read_res.status_code == 404
    assert "Task not found" in read_res.json()["detail"]

    # User A attempts to update User B's task
    patch_res = client.patch(
        f"/api/tasks/{task_b_id}",
        json={"title": "Hacked Title"},
        headers=user_a_headers,
    )
    assert patch_res.status_code == 404

    # User A attempts to delete User B's task
    del_res = client.delete(f"/api/tasks/{task_b_id}", headers=user_a_headers)
    assert del_res.status_code == 404


def test_tc20_backend_restart_records_persist(
    client: TestClient, auth_headers: dict, db_session: Session
):
    """TC-20: Backend restart → records persist across session resets."""
    # Create task
    task_res = client.post(
        "/api/tasks",
        json={"title": "Persistent Task Across Restarts"},
        headers=auth_headers,
    )
    task_id = task_res.json()["id"]

    # Simulate session close / backend restart by closing current session
    db_session.close()

    # Re-fetch task using client
    get_res = client.get(f"/api/tasks/{task_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Persistent Task Across Restarts"


def test_tc21_invalid_task_id(client: TestClient, auth_headers: dict):
    """TC-21: Invalid task ID → 404 not found response."""
    res = client.get("/api/tasks/999999", headers=auth_headers)
    assert res.status_code == 404
    assert "Task not found" in res.json()["detail"]


def test_tc22_database_unavailable_graceful_error(
    client: TestClient, auth_headers: dict
):
    """TC-22: DB unavailable → graceful 503 response without exposing stack traces."""
    with patch(
        "app.services.task_service.list_tasks",
        side_effect=OperationalError(
            "statement", {}, Exception("Connection refused")
        ),
    ):
        response = client.get("/api/tasks", headers=auth_headers)
        assert response.status_code == 503
        data = response.json()
        assert "Database service unavailable" in data["detail"]
        # Ensure raw DB connection errors / stack traces are not exposed
        assert "Connection refused" not in data["detail"]
