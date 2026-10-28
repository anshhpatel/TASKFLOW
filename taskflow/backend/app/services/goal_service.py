from typing import List, Tuple
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.goal import Goal
from app.models.task import Task
from app.schemas.goal import GoalCreate, GoalDetailResponse, GoalResponse, GoalUpdate
from app.schemas.task import TaskResponse


def _get_goal_counts(db: Session, user_id: int, goal_id: int) -> Tuple[int, int]:
    """Return (task_count, completed_task_count) for a specific goal."""
    task_count = (
        db.query(func.count(Task.id))
        .filter(Task.goal_id == goal_id, Task.user_id == user_id)
        .scalar()
        or 0
    )
    completed_task_count = (
        db.query(func.count(Task.id))
        .filter(
            Task.goal_id == goal_id,
            Task.user_id == user_id,
            Task.status == "completed",
        )
        .scalar()
        or 0
    )
    return task_count, completed_task_count


def list_goals(db: Session, user_id: int) -> List[GoalResponse]:
    """List all goals for a user with derived task completion counts."""
    goals = (
        db.query(Goal)
        .filter(Goal.user_id == user_id)
        .order_by(Goal.created_at.desc())
        .all()
    )

    result: List[GoalResponse] = []
    for g in goals:
        task_count, completed_task_count = _get_goal_counts(db, user_id, g.id)
        goal_res = GoalResponse(
            id=g.id,
            user_id=g.user_id,
            title=g.title,
            description=g.description,
            target_date=g.target_date,
            status=g.status,
            created_at=g.created_at,
            updated_at=g.updated_at,
            task_count=task_count,
            completed_task_count=completed_task_count,
        )
        result.append(goal_res)
    return result


def create_goal(db: Session, user_id: int, req: GoalCreate) -> GoalResponse:
    """Create a new goal for the authenticated user."""
    goal = Goal(
        user_id=user_id,
        title=req.title,
        description=req.description,
        target_date=req.target_date,
        status=req.status or "active",
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    return GoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        title=goal.title,
        description=goal.description,
        target_date=goal.target_date,
        status=goal.status,
        created_at=goal.created_at,
        updated_at=goal.updated_at,
        task_count=0,
        completed_task_count=0,
    )


def get_goal(db: Session, user_id: int, goal_id: int) -> GoalDetailResponse:
    """Retrieve a single goal with its linked tasks."""
    goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id, Goal.user_id == user_id)
        .first()
    )
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )

    tasks = (
        db.query(Task)
        .filter(Task.goal_id == goal.id, Task.user_id == user_id)
        .order_by(Task.created_at.asc())
        .all()
    )

    task_count, completed_task_count = _get_goal_counts(db, user_id, goal.id)
    return GoalDetailResponse(
        id=goal.id,
        user_id=goal.user_id,
        title=goal.title,
        description=goal.description,
        target_date=goal.target_date,
        status=goal.status,
        created_at=goal.created_at,
        updated_at=goal.updated_at,
        task_count=task_count,
        completed_task_count=completed_task_count,
        tasks=[TaskResponse.model_validate(t) for t in tasks],
    )


def update_goal(
    db: Session, user_id: int, goal_id: int, req: GoalUpdate
) -> GoalResponse:
    """Partially update a goal."""
    goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id, Goal.user_id == user_id)
        .first()
    )
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )

    update_dict = req.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(goal, field, val)

    db.commit()
    db.refresh(goal)

    task_count, completed_task_count = _get_goal_counts(db, user_id, goal.id)
    return GoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        title=goal.title,
        description=goal.description,
        target_date=goal.target_date,
        status=goal.status,
        created_at=goal.created_at,
        updated_at=goal.updated_at,
        task_count=task_count,
        completed_task_count=completed_task_count,
    )


def delete_goal(db: Session, user_id: int, goal_id: int) -> None:
    """Delete a goal and set linked tasks' goal_id to NULL."""
    goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id, Goal.user_id == user_id)
        .first()
    )
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )

    # Rule 13: Null-out linked tasks' goal_id
    db.query(Task).filter(Task.goal_id == goal.id).update(
        {Task.goal_id: None}, synchronize_session="fetch"
    )
    db.delete(goal)
    db.commit()
