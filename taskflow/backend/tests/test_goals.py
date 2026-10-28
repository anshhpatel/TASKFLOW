from fastapi.testclient import TestClient


def test_tc10_create_goal_and_linked_task(
    client: TestClient, auth_headers: dict
):
    """TC-10: Create goal and linked task → task references goal, goal progress derived correctly."""
    # 1. Create goal
    goal_res = client.post(
        "/api/goals",
        json={
            "title": "Launch Taskflow MVP",
            "description": "Complete all backend and frontend features",
            "target_date": "2026-11-15",
        },
        headers=auth_headers,
    )
    assert goal_res.status_code == 201
    goal_id = goal_res.json()["id"]

    # 2. Create two tasks linked to the goal
    t1_res = client.post(
        "/api/tasks",
        json={"title": "Task 1", "goal_id": goal_id},
        headers=auth_headers,
    )
    assert t1_res.status_code == 201
    t1_id = t1_res.json()["id"]

    t2_res = client.post(
        "/api/tasks",
        json={"title": "Task 2", "goal_id": goal_id},
        headers=auth_headers,
    )
    assert t2_res.status_code == 201

    # 3. Verify goal progress before completing task
    goals_res = client.get("/api/goals", headers=auth_headers)
    assert goals_res.status_code == 200
    goal_item = next(g for g in goals_res.json() if g["id"] == goal_id)
    assert goal_item["task_count"] == 2
    assert goal_item["completed_task_count"] == 0

    # 4. Complete task 1
    client.patch(f"/api/tasks/{t1_id}/complete", headers=auth_headers)

    # 5. Check goal detail shows updated progress and task list
    goal_detail_res = client.get(
        f"/api/goals/{goal_id}", headers=auth_headers
    )
    assert goal_detail_res.status_code == 200
    detail = goal_detail_res.json()
    assert detail["task_count"] == 2
    assert detail["completed_task_count"] == 1
    assert len(detail["tasks"]) == 2


def test_tc11_link_task_to_other_users_goal(
    client: TestClient, user_a_headers: dict, user_b_headers: dict
):
    """TC-11: Link task to another user's goal → Rejected (404/403)."""
    # User B creates a goal
    goal_b_res = client.post(
        "/api/goals",
        json={"title": "User B Goal"},
        headers=user_b_headers,
    )
    assert goal_b_res.status_code == 201
    goal_b_id = goal_b_res.json()["id"]

    # User A tries to link a new task to User B's goal
    create_task_res = client.post(
        "/api/tasks",
        json={"title": "User A unauthorized link", "goal_id": goal_b_id},
        headers=user_a_headers,
    )
    assert create_task_res.status_code in (403, 404)

    # User A tries to update an existing task to link to User B's goal
    task_a_res = client.post(
        "/api/tasks",
        json={"title": "User A original task"},
        headers=user_a_headers,
    )
    task_a_id = task_a_res.json()["id"]

    patch_task_res = client.patch(
        f"/api/tasks/{task_a_id}",
        json={"goal_id": goal_b_id},
        headers=user_a_headers,
    )
    assert patch_task_res.status_code in (403, 404)


def test_goal_deletion_nulls_task_goal_id(
    client: TestClient, auth_headers: dict
):
    """Rule 13: Deleting a goal sets linked tasks' goal_id to NULL."""
    # 1. Create goal
    goal_res = client.post(
        "/api/goals",
        json={"title": "Temporary Goal"},
        headers=auth_headers,
    )
    goal_id = goal_res.json()["id"]

    # 2. Create task linked to goal
    task_res = client.post(
        "/api/tasks",
        json={"title": "Linked Task", "goal_id": goal_id},
        headers=auth_headers,
    )
    task_id = task_res.json()["id"]

    # 3. Delete goal
    del_res = client.delete(f"/api/goals/{goal_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # 4. Verify task still exists and its goal_id is now None
    check_task = client.get(f"/api/tasks/{task_id}", headers=auth_headers)
    assert check_task.status_code == 200
    assert check_task.json()["goal_id"] is None
