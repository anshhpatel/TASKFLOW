from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.task import Task
from app.schemas.focus import FocusSupportRequest, FocusSupportResponse

SUGGESTIONS = [
    {
        "suggestion": "Start with just 5 minutes on this task — set a timer and begin.",
        "tip": "Action precedes motivation. Even 5 minutes reduces resistance.",
    },
    {
        "suggestion": "Break it down: what is the single smallest next action you could take?",
        "tip": "Micro-steps make large obstacles manageable.",
    },
    {
        "suggestion": "Write down what is blocking you — sometimes naming it is enough to move forward.",
        "tip": "Externalizing your thought process declutters working memory.",
    },
    {
        "suggestion": "Work in a different location or posture for the next 20 minutes.",
        "tip": "Changing your environment can reset cognitive fatigue.",
    },
    {
        "suggestion": "Tell yourself you will only do the first step, not the whole task.",
        "tip": "Lowering the threshold for starting eliminates paralysis.",
    },
    {
        "suggestion": "Take a 5-minute walk, then return to the task with fresh eyes.",
        "tip": "Movement increases cerebral blood flow and problem-solving clarity.",
    },
    {
        "suggestion": "Review what you have already completed today — small wins count.",
        "tip": "Recognizing progress fuels dopamine and task engagement.",
    },
    {
        "suggestion": "Pair this task with something you enjoy, like music or a beverage.",
        "tip": "Temptation bundling pairs effortful actions with immediate reward.",
    },
]


def get_focus_suggestion(
    db: Session, user_id: int, req: FocusSupportRequest
) -> FocusSupportResponse:
    """Return a deterministic, non-judgmental suggestion without modifying any task."""
    task_title: Optional[str] = None

    if req.task_id is not None:
        task = (
            db.query(Task)
            .filter(Task.id == req.task_id, Task.user_id == user_id)
            .first()
        )
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )
        task_title = task.title
        index = req.task_id % len(SUGGESTIONS)
    else:
        index = user_id % len(SUGGESTIONS)

    selected = SUGGESTIONS[index]
    return FocusSupportResponse(
        suggestion=selected["suggestion"],
        tip=selected["tip"],
        task_title=task_title,
    )
