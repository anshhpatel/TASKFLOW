import pytest
from fastapi.testclient import TestClient


def test_tc18_focus_support_does_not_mutate_task(
    client: TestClient, auth_headers: dict
):
    """TC-18: Request focus support -> Actionable prompt returned; task remains unchanged."""
    # 1. Create a task
    create_res = client.post(
        "/api/tasks",
        json={
            "title": "Write Unit Tests",
            "description": "Comprehensive test suite",
            "priority": "high",
        },
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    task = create_res.json()
    task_id = task["id"]
    original_updated_at = task["updated_at"]
    original_status = task["status"]

    # 2. Request focus support with specific task_id
    focus_res = client.post(
        "/api/focus-support/suggestion",
        json={"task_id": task_id},
        headers=auth_headers,
    )
    assert focus_res.status_code == 200
    suggestion = focus_res.json()
    assert "suggestion" in suggestion
    assert "tip" in suggestion
    assert suggestion["task_title"] == "Write Unit Tests"
    assert len(suggestion["suggestion"]) > 5

    # 3. Request general focus support without task_id
    general_res = client.post(
        "/api/focus-support/suggestion",
        json={},
        headers=auth_headers,
    )
    assert general_res.status_code == 200
    gen_data = general_res.json()
    assert "suggestion" in gen_data
    assert "tip" in gen_data

    # 4. Verify task in DB remains strictly unmutated
    task_check = client.get(f"/api/tasks/{task_id}", headers=auth_headers)
    assert task_check.status_code == 200
    current_task = task_check.json()
    assert current_task["status"] == original_status == "pending"
    assert current_task["title"] == "Write Unit Tests"
    assert current_task["description"] == "Comprehensive test suite"
    assert current_task["updated_at"] == original_updated_at
