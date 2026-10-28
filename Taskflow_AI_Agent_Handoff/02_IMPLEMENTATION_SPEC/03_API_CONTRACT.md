# Taskflow — Proposed API Contract for the Prototype

This is the implementation contract for a consistent prototype. Before coding, inspect existing routes and preserve compatibility where practical. All paths below are under `/api` unless stated otherwise. Protected endpoints require authentication. Use JSON for request/response bodies.

## 1. Conventions
- IDs: UUID or integer IDs are acceptable; choose one consistently and document it.
- Dates/times: ISO 8601; store timestamps consistently (UTC recommended) and display in the user's local timezone.
- Errors: return meaningful HTTP status codes and a stable JSON shape, e.g. `{"detail":"Task title is required"}`. Do not expose stack traces.
- Ownership: user-owned records must be scoped to the authenticated user.
- Pagination is optional for the prototype but response shapes should be consistent.
- FastAPI should expose OpenAPI docs at its standard docs URL.

## 2. Health and authentication
| Method | Path | Purpose | Expected result |
|---|---|---|---|
| GET | `/health` | Optional/recommended service health check | 200 with simple status |
| POST | `/api/auth/register` | Create account | 201; safe user representation |
| POST | `/api/auth/login` | Authenticate | 200; session/token result |
| POST | `/api/auth/logout` | End session where applicable | 200/204 |
| GET | `/api/auth/me` | Current user profile | 200 |

Registration should validate email and password policy; duplicate email returns 409 or a documented 400. Login failures should use a generic message.

## 3. Goals
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/goals` | List current user's goals |
| POST | `/api/goals` | Create goal |
| GET | `/api/goals/{goal_id}` | Get one owned goal |
| PATCH | `/api/goals/{goal_id}` | Update goal |
| DELETE | `/api/goals/{goal_id}` | Delete goal or handle linked tasks according to documented policy |

Suggested goal fields: `title` (required), `description` (optional), `target_date` (optional), `status` (`active`/`completed`/`archived`), `created_at`.

## 4. Tasks
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/tasks` | List current user's tasks; optional filters |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/{task_id}` | Get one owned task |
| PATCH | `/api/tasks/{task_id}` | Update task fields |
| DELETE | `/api/tasks/{task_id}` | Delete task and handle associated reminders |
| PATCH | `/api/tasks/{task_id}/complete` | Mark complete |
| PATCH | `/api/tasks/{task_id}/reopen` | Reopen completed task (optional) |

Task fields: `title` required; `description`, `priority` (`low`/`medium`/`high`), `status` (`pending`/`completed`), `deadline`, `scheduled_start`, `scheduled_end`, optional `goal_id`, optional `created_at`, `completed_at`. Validate that end time is not before start time and any linked goal belongs to the same user.

## 5. Routines and daily missions
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/routines` | List routine definitions |
| POST | `/api/routines` | Create routine |
| PATCH | `/api/routines/{routine_id}` | Update routine |
| DELETE | `/api/routines/{routine_id}` | Delete/deactivate routine |
| GET | `/api/routines/today` | Today's routine status |
| PUT | `/api/routines/{routine_id}/completions/{date}` | Mark a routine occurrence complete/incomplete |
| GET | `/api/daily-missions?date=YYYY-MM-DD` | Aggregate tasks/routine occurrences for a date |

Routine fields: `name` required, `description` optional, schedule/frequency, active. Use a documented recurrence representation simple enough for the prototype (e.g., selected weekdays). Routine completion must be keyed by routine and date so the user can complete it again on a later day.

Daily Missions is an aggregated view, not a separate competing task system. Include source IDs and source types in the response.

## 6. Reminders and notifications
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/reminders` | List current user's reminders |
| POST | `/api/reminders` | Create reminder for owned task or routine |
| PATCH | `/api/reminders/{reminder_id}` | Update due time/enabled state |
| DELETE | `/api/reminders/{reminder_id}` | Delete reminder |
| GET | `/api/notifications` | List in-app notifications |
| PATCH | `/api/notifications/{notification_id}/read` | Mark notification read |

A reminder should reference either a task or routine, have a due time, enabled state, and duplicate-delivery prevention state. Enforce a single valid target. Do not claim browser/background notification delivery unless it is actually implemented and tested.

## 7. Progress and focus support
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/progress/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` | Return task and routine completion counts |
| POST | `/api/focus-support/suggestion` | Return a short next-step suggestion for a selected task or general stuck state |

Progress should be calculated from persisted task states and routine logs. The focus support endpoint can be deterministic; no external AI service is required. It must not mutate tasks.

## 8. Status codes
- `200`: successful read/update or operation returning a body.
- `201`: resource created.
- `204`: successful operation with no body, if chosen consistently.
- `400`/`422`: invalid input (FastAPI commonly uses 422 for schema validation).
- `401`: missing/invalid authentication.
- `403`: authenticated but forbidden, if this distinction is used.
- `404`: missing or inaccessible resource; avoid leaking other users' records.
- `409`: uniqueness/conflict such as duplicate email.
- `500`: unexpected server error; user-facing detail must not expose internals.

## 9. API contract examples
Create task:
```json
{
  "title": "Finish Taskflow evaluation slides",
  "description": "Prepare the final demonstration",
  "priority": "high",
  "deadline": "2026-10-30T18:00:00Z",
  "goal_id": null
}
```

Example task response:
```json
{
  "id": "example-id",
  "title": "Finish Taskflow evaluation slides",
  "status": "pending",
  "priority": "high",
  "goal_id": null
}
```
Examples are illustrative only; actual IDs and timestamps must be generated by the application.
