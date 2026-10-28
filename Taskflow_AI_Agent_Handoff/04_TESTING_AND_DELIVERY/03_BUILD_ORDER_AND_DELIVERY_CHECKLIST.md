# Taskflow — Build Order and Delivery Checklist

## 1. Implementation order (Agile increments)
### Sprint 0 — Inspect and stabilize
- Inventory repository, routes, data storage, frontend, dependencies, `.env`, and JMeter files.
- Run current app and tests before changes; record baseline.
- Identify current functionality versus SRS.
- Create a small issue/checklist backlog.

### Sprint 1 — Foundation
- Keep React + TypeScript + Tailwind, FastAPI, PostgreSQL.
- Configure environment variables, database connection, migrations/schema, error handling, API client.
- Confirm frontend-to-backend connection and health check if added.
- Set up automated test runner.

### Sprint 2 — Identity and task basics
- Registration/login/logout.
- Secure password hashing and authenticated user context.
- Task CRUD, completion, validation, persistence.
- Ownership tests.

### Sprint 3 — Goals and daily workflow
- Goal CRUD and optional task association.
- Dashboard/Today.
- Daily Missions aggregation.
- Routines and dated completion logs.

### Sprint 4 — Reminders, focus support, progress
- Reminder settings and due notification record/inbox.
- Duplicate prevention.
- Focus/slump prompt and return path.
- Progress summary from persisted data.

### Sprint 5 — Polish and evaluation
- Responsive UI, empty/loading/error states.
- Run automated tests.
- Run JMeter smoke test and optional staged load test.
- Save genuine results and screenshots.
- Complete README, architecture notes, limitations, and demo instructions.

The sprint labels are a proposed work breakdown for the agent, not a claim that these sprints have already occurred.

## 2. Required final repository artifacts
- Frontend source.
- Backend source.
- Database schema/migrations.
- `.env.example` without secrets.
- `README.md` with setup and run commands.
- API docs/OpenAPI available from FastAPI.
- Automated tests and instructions.
- Existing JMeter plan retained, updated plan if needed, and actual results.
- `docs/` containing SRS, design summary, API contract, data model, and limitations.
- `KNOWN_LIMITATIONS.md`.

## 3. Local run documentation must cover
1. Prerequisites and versions.
2. PostgreSQL creation/configuration.
3. Environment variables.
4. Backend dependency installation.
5. Database migration/schema setup.
6. Frontend dependency installation.
7. Start backend and frontend in separate terminals.
8. Test commands.
9. Demo account/seed procedure if provided.
10. JMeter execution steps.
11. Common errors and fixes.

## 4. Final report checklist
- Problem and objective.
- Scope and architecture.
- Implemented features (separate from planned features).
- Screenshots of the actual prototype.
- API and data model.
- Test strategy and actual results.
- JMeter setup and measured results.
- Limitations.
- Future scope.
- Run instructions.

## 5. Final handoff response expected from the AI agent
The agent must report:
- what existed before it started;
- what it changed and why;
- files created/modified;
- commands to run the app;
- tests actually executed and their actual results;
- JMeter test configuration/results actually collected;
- features incomplete or mocked;
- known limitations and next steps.
