# Taskflow — Scope, Requirements, and Traceability
**Status:** Implementation addendum to the preserved SRS v1.0 and Software Design Document v1.0.

## 1. Product definition
Taskflow is a low-distraction daily routine and productivity companion. It helps one user organize goals into tasks, turn due work and routine activities into a daily view called **Daily Missions**, receive reminders, mark work complete, and review progress. It should help users restart with a small next action when they report being stuck.

It is **not** intended to become a broad team/project-management suite. Do not add teams, kanban workspaces, social feeds, complex gamification, or third-party integrations to the prototype.

## 2. Authority and precedence
1. Preserve the original approved detailed SRS and Software Design Document exactly as source documents.
2. The previously locked product/technology decisions in this handoff are binding: React + TypeScript + Tailwind; FastAPI; PostgreSQL; modular monolith; Agile; daily-check-in product flow.
3. The detailed SRS is authoritative for explicit requirements: account/profile, task CRUD/completion, routine tracking, reminders, focus/slump support, security, validation, persistence, usability.
4. This addendum makes the previously agreed Goals → Tasks → Daily Missions → Notifications → Progress flow implementable. It is a traceable clarification, not a silent rewrite of the original SRS.
5. If the current repository behaves differently, inventory it, preserve working functionality, document the difference, and then align it deliberately.

## 3. Scope for the demonstrable prototype

### P0 — Required end-to-end functionality
- Register, log in, and log out.
- Keep personal data isolated by authenticated user.
- Create, view, edit, delete, and complete tasks.
- Task fields: title (required), description (optional), priority, due date/time or deadline, optional scheduled start/end time, status, optional goal association.
- Create and manage goals; view goal-associated tasks and progress.
- Create recurring daily routines; mark today's occurrence complete; retain routine definition and completion history.
- **Daily Missions** page/section: today's tasks due/scheduled today plus today's routine occurrences, with clear pending/completed states. Derive this view from tasks/routines where practical; avoid a second conflicting source of truth.
- Configure, edit, disable, and delete task/routine reminders.
- Display in-app notifications or a notification inbox for due reminders. Browser notifications may be added where supported and permission is granted. Clearly state any limits on background delivery.
- Dashboard with a useful daily overview and progress indicators based on real persisted data.
- Focus/slump support: when a user says they are stuck, show a short actionable next step (e.g., break the task into a 5-minute start); it must not modify task data automatically.
- Server-side validation and clear error messages.
- Persistent PostgreSQL storage and repeatable local setup.

### P1 — Required if the core flow is stable
- Filter tasks by pending/completed, due date, goal, and priority.
- Progress view with completed-vs-total tasks and routine completion over a selectable period (e.g., current week).
- Accessible empty states, loading states, and error states.
- Responsive layouts for desktop and mobile.

### Explicitly out of scope for this prototype
- Team collaboration, shared projects, chat, public profiles, social/community features.
- Complex gamification, leaderboards, paid subscriptions.
- AI-based psychological diagnosis or medical advice.
- Email/SMS delivery or third-party integrations unless already available and explicitly configured.
- Multi-service/microservice architecture.
- Claims of production-scale performance without an appropriate test design and measured evidence.

## 4. Functional requirement mapping
| ID | Requirement | Prototype evidence |
|---|---|---|
| TF-FR-01 | Register/login/logout | UI flow + API tests |
| TF-FR-02 | User-owned data isolation | Cross-user authorization tests |
| TF-FR-03 | Task CRUD and completion | UI and API tests |
| TF-FR-04 | Goal CRUD and task association | Goal view + API tests |
| TF-FR-05 | Daily routine definitions and daily completion | Routine view + completion history |
| TF-FR-06 | Daily Missions aggregates today's work | Today's view matches persisted tasks/routines |
| TF-FR-07 | Reminder configuration and due notifications | Reminder CRUD + due-state test |
| TF-FR-08 | Progress summary based on real data | Dashboard/progress calculation test |
| TF-FR-09 | Focus/slump prompt | UI action; task data unchanged unless user acts |
| TF-FR-10 | Validation/error handling | Missing title, invalid dates, missing/foreign ID tests |
| TF-FR-11 | Persistence | Data remains after API/app restart |
| TF-FR-12 | JMeter HTTP test workflow | `.jmx` plus actual report output |

## 5. Non-functional requirements
- Security: hash passwords; do not return password hashes; enforce authorization on every protected resource; validate request data; avoid leaking stack traces or database internals.
- Usability: simple, consistent navigation; frequent actions need minimal clicks; show empty/loading/success/error states.
- Reliability: persisted data survives restart; invalid input does not crash the service; database errors fail gracefully.
- Maintainability: separate frontend feature areas and backend routers/services/schemas/models; retain a modular monolith.
- Performance: use JMeter to measure defined workloads, report configuration and results honestly, and avoid unsupported claims.
- Responsive behavior: support common desktop and mobile viewport sizes.

## 6. Definition of done
A feature is done only when it has: (a) implemented UI/API as relevant, (b) persistence where required, (c) validation and error behavior, (d) automated tests for its core rules, (e) manual verification notes, and (f) updated setup/API documentation.
