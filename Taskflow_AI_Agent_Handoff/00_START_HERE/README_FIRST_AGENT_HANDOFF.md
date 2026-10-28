# TASKFLOW — AI Coding Agent Handoff Pack
**Prepared:** 28 October 2026  
**Purpose:** Build or complete the Taskflow prototype in accordance with the finalized project decisions and original requirements.

## 1. Read these files first
1. `01_FINALIZED_SOURCE_DOCUMENTS/TASKFLOW_SRS_Detailed_v1.0.docx`
2. `01_FINALIZED_SOURCE_DOCUMENTS/TASKFLOW_Software_Design_Document.docx`
3. `02_IMPLEMENTATION_SPEC/01_SCOPE_AND_TRACEABILITY.md`
4. `02_IMPLEMENTATION_SPEC/02_ARCHITECTURE_AND_STACK.md`
5. `02_IMPLEMENTATION_SPEC/03_API_CONTRACT.md`
6. `02_IMPLEMENTATION_SPEC/04_DATA_MODEL.md`
7. `02_IMPLEMENTATION_SPEC/05_UI_UX_AND_USER_FLOWS.md`
8. `04_TESTING_AND_DELIVERY/01_ACCEPTANCE_AND_TEST_PLAN.md`
9. `04_TESTING_AND_DELIVERY/02_JMETER_GUIDANCE.md`
10. `04_TESTING_AND_DELIVERY/03_BUILD_ORDER_AND_DELIVERY_CHECKLIST.md`

The original SRS and Software Design Document are preserved without edits. The concise SRS is also included. An older draft and a duplicate lab copy, if present, are filed under `99_LEGACY_REFERENCE` and must not override the detailed approved SRS.

## 2. Binding project decisions
- Product: **Taskflow**, a daily check-in and routine-management application, not a generic enterprise project manager.
- Product intent: help a person plan their day, maintain routines, act on goals, see progress, and recover from low motivation or inactivity.
- Locked stack: **React + TypeScript + Tailwind CSS**, **FastAPI**, **PostgreSQL**.
- Architecture: **modular monolith** with clear modules; do not split into microservices.
- SDLC: **Agile**, iterative and incremental development in short sprints.
- Product flow previously established: **User → Taskflow → Goals → Tasks → Daily Missions → Notifications → Progress**.
- Existing work includes a simple FastAPI backend and a JMeter test workflow. Inspect the current repository before changing anything.

## 3. Critical rules for the coding agent
1. **Inspect before editing.** Examine the repository, current routes, frontend, database/storage, dependencies, run commands, and JMeter `.jmx` files. Produce a short inventory before implementation.
2. Preserve working code and existing test artifacts. Do not replace the project wholesale just to match a preferred scaffold.
3. Compare existing endpoints against `03_API_CONTRACT.md`; extend or adapt with backward compatibility where practical. If a route already exists with different semantics, document the difference and make a deliberate migration.
4. Do not claim a feature works unless it is implemented and tested.
5. Do not fabricate JMeter numbers, screenshots, test results, or benchmark claims.
6. Keep secrets out of source control. Provide `.env.example`; do not include real credentials.
7. Validate all user input server-side. Enforce ownership checks on every user-owned record.
8. Keep the prototype runnable locally with a clear README, reproducible setup, database migrations/schema, seed/demo option, and automated tests.
9. Implement the core end-to-end workflow first. Do not spend time on excluded features before core flows work.
10. If the original docs and this addendum differ, use the precedence rules in `01_SCOPE_AND_TRACEABILITY.md` and record any unresolved conflict rather than silently guessing.

## 3A. Existing JMeter evidence — important qualification
Two historical JMeter PDFs are included under `04_TESTING_AND_DELIVERY/HISTORICAL_JMETER_REPORTS`. One is a report template; the other describes a prior lightweight local demonstration API and states that the production Taskflow backend was not yet available at the time. Treat them as historical context only. Re-run tests against the final code before reporting final results.

## 4. Required outcome
Deliver a working local prototype with:
- responsive React/TypeScript/Tailwind UI;
- FastAPI API;
- PostgreSQL persistence;
- registration/login and user-scoped data;
- goals, tasks, today's daily missions, routines, reminders/notifications, progress summary, and a simple focus/slump support action;
- validation and understandable error states;
- API and core workflow tests;
- JMeter test plan retained or updated without losing the existing test setup;
- setup instructions, architecture notes, known limitations, and evidence of tests actually run.

## 5. Prototype versus production
This is a demonstrable academic/personal-project prototype. Build sound foundations, but clearly label limitations such as single-instance reminder scheduling, deployment configuration, email delivery, or lack of external notification provider. Do not represent a local prototype as production-ready.
