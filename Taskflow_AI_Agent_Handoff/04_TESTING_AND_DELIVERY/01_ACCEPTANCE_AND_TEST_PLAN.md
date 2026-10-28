# Taskflow — Acceptance Criteria and Functional Test Plan

## 1. Acceptance criteria
The prototype is accepted when:
1. A clean local setup is documented and reproducible.
2. Frontend starts and communicates with the FastAPI backend.
3. PostgreSQL persistence is used for the agreed implementation.
4. Registration/login/logout work; passwords are hashed.
5. User A cannot access User B's records by changing IDs or API requests.
6. Goals can be created and tasks can be linked to them.
7. Task create/list/view/update/delete/complete flows work.
8. Routine definitions persist and daily completion is date-specific.
9. Daily Missions accurately aggregates tasks/routines for a chosen date.
10. Reminder settings persist and due reminders create at most one in-app notification record per reminder event.
11. Dashboard/progress values are calculated from actual stored data.
12. Focus/slump support returns a useful prompt without silently mutating records.
13. Invalid inputs produce understandable errors; the server remains available.
14. Automated API/core logic tests pass.
15. JMeter test plan can run against the local backend and its results are saved with configuration details.
16. README includes install, configure, migrate, seed (if provided), run, test, and troubleshooting steps.
17. Known limitations are explicit; no unsupported claims about load capacity or notification guarantees.

## 2. Functional test cases
| ID | Scenario | Expected result |
|---|---|---|
| TC-01 | Register valid user | Account created; no password hash returned |
| TC-02 | Register duplicate email | Clear conflict/validation response |
| TC-03 | Login valid credentials | Authenticated session/token returned |
| TC-04 | Login invalid credentials | Generic rejection; no sensitive detail |
| TC-05 | Create task with title | Task persists and is returned |
| TC-06 | Create task with blank title | Rejected; no row created |
| TC-07 | Update task | Only submitted valid fields change |
| TC-08 | Complete task | Status/completion timestamp updated |
| TC-09 | Delete task with reminder | Task and reminder handling follows documented rule |
| TC-10 | Create goal and linked task | Task references goal; goal progress derived correctly |
| TC-11 | Link task to another user's goal | Rejected |
| TC-12 | Create routine | Routine persists |
| TC-13 | Complete routine today | Today's log changes; prior dates remain unchanged |
| TC-14 | Daily Missions for date | Correct due/scheduled tasks and routine occurrences appear |
| TC-15 | Create reminder | Reminder persists with valid target and due time |
| TC-16 | Trigger same reminder twice | Duplicate notification is not created |
| TC-17 | Read progress summary | Counts match task/routine records |
| TC-18 | Request focus support | Actionable prompt returned; task remains unchanged |
| TC-19 | User A requests User B task | 404/403 per documented policy; no data leakage |
| TC-20 | Restart backend | Saved records still exist |
| TC-21 | Invalid task ID | Clear not-found response |
| TC-22 | Database unavailable | Graceful error; no stack trace exposed to client |

## 3. Manual UI checks
- Login/register form validation.
- Dashboard empty state and populated state.
- Create/edit/complete/delete task.
- Goal creation and linked-task progress.
- Routine completion today and date change behavior.
- Reminder creation, disable and notification read state.
- Focus support return path.
- Responsive desktop/mobile layout.
- Keyboard navigation and visible focus.
- API/network errors shown clearly.

## 4. Test evidence
Save:
- command used to start backend/frontend;
- environment/dependency versions where practical;
- automated test command and real pass/fail output;
- screenshots of core UI and API docs;
- JMeter `.jmx` and actual Aggregate/Summary Report;
- test date, number of virtual users, ramp-up, loops/duration, endpoint coverage;
- known failures and follow-up actions.

Do not edit screenshots to change values or invent missing measurements.
