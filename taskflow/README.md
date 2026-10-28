# Taskflow — Daily Consistency & Routine Management

Taskflow is a full-stack web application designed to help users build momentum, manage routines, conquer task overload, and track authentic progress.

**Product Flow**: `User → Taskflow → Goals → Tasks → Daily Missions → Notifications → Progress`

---

## 1. System Architecture & Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Axios, React Router v6, React Hot Toast
- **Backend**: FastAPI 0.111+, SQLAlchemy 2.0, Pydantic v2, APScheduler (Modular Monolith)
- **Database**: PostgreSQL (target production) / SQLite (zero-setup local development)
- **Migrations**: Alembic 1.13+
- **Security**: Passwords hashed with standard `bcrypt`, stateless JWT access tokens signed with `HS256`, strict per-user ownership authorization.

---

## 2. Quickstart Guide (Local Setup)

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18 or higher (with npm)

### 2.1 Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd taskflow/backend
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env`:
   ```bash
   cp ../.env.example .env
   ```
   *(For quick local testing without PostgreSQL, `DATABASE_URL=sqlite:///./taskflow.db` is supported)*

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run Database Migrations**:
   ```bash
   alembic upgrade head
   ```

5. **(Optional) Seed Demo Data**:
   Populates realistic goals, tasks, routines, daily missions, and reminders:
   ```bash
   python -m app.seed
   ```
   **Demo Credentials**:
   - **Email**: `alex@taskflow.dev`
   - **Password**: `TaskflowDemo123!`

6. **Start Backend Server**:
   ```bash
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   - API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### 2.2 Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd taskflow/frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Access the web app at [http://localhost:5173](http://localhost:5173).

---

## 3. Automated Test Suite

Taskflow includes a comprehensive automated test suite verifying all acceptance criteria (TC-01 through TC-22).

To execute the test suite:
```bash
cd taskflow/backend
pytest -v
```

### Verified Test Cases:
- `TC-01`: Register valid user (hashed passwords, no sensitive leaks)
- `TC-02`: Register duplicate email (HTTP 409 conflict validation)
- `TC-03`: Login valid credentials (JWT token returned)
- `TC-04`: Login invalid credentials (generic rejection)
- `TC-05`: Create task with title and priority
- `TC-06`: Reject task creation with empty title (HTTP 422 validation)
- `TC-07`: Update task (patch changes only specified fields)
- `TC-08`: Complete task (marks status and sets timestamp)
- `TC-09`: Delete task (cascades reminders)
- `TC-10`: Create goal and link tasks (derives progress accurately)
- `TC-11`: Link task to another user's goal (HTTP 403 forbidden)
- `TC-12`: Create routine definition with weekday schedule
- `TC-13`: Complete routine for today (preserves past dates)
- `TC-14`: Daily Missions aggregation (tasks + routines for date)
- `TC-15`: Create reminder (with target validation)
- `TC-16`: Deduplicate reminder notifications (unique constraint)
- `TC-17`: Read progress summary from real persisted data
- `TC-18`: Focus support prompt (strictly non-mutating)
- `TC-19`: Cross-user data isolation (User A cannot access User B's tasks)
- `TC-20`: Persistence across backend restarts
- `TC-21`: Invalid task ID returns clean 404
- `TC-22`: Database unavailable returns graceful 503

---

## 4. Performance & JMeter Smoke Testing

Apache JMeter test plan and benchmark artifacts are located in `taskflow/tests/jmeter/`:
- `taskflow_test_plan.jmx`: JMeter 5.x test plan covering an 8-endpoint functional flow.
- `smoke_test_results.csv`: Genuine collected timing samples.
- `JMETER_RESULTS_README.md`: Detailed throughput and response-time report.

To run the automated smoke benchmark:
```bash
cd taskflow/tests/jmeter
python run_smoke_benchmark.py
```

---

## 5. API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/health` | Service health check | No |
| `POST` | `/api/auth/register` | Register new user | No |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT token | No |
| `POST` | `/api/auth/logout` | Discard session | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |
| `GET` | `/api/goals` | List user goals with task counts | Yes |
| `POST` | `/api/goals` | Create a new goal | Yes |
| `GET` | `/api/goals/{id}` | Get goal details and linked tasks | Yes |
| `PATCH` | `/api/goals/{id}` | Update goal details | Yes |
| `DELETE`| `/api/goals/{id}` | Delete goal (nullifies linked task foreign keys) | Yes |
| `GET` | `/api/tasks` | List user tasks with optional filters | Yes |
| `POST` | `/api/tasks` | Create a task | Yes |
| `GET` | `/api/tasks/{id}` | Retrieve single task | Yes |
| `PATCH` | `/api/tasks/{id}` | Update task | Yes |
| `DELETE`| `/api/tasks/{id}` | Delete task | Yes |
| `PATCH` | `/api/tasks/{id}/complete` | Mark task completed | Yes |
| `PATCH` | `/api/tasks/{id}/reopen` | Reopen task back to pending | Yes |
| `GET` | `/api/routines` | List all user routines | Yes |
| `POST` | `/api/routines` | Create a routine | Yes |
| `GET` | `/api/routines/today` | List active routines for today with completion status | Yes |
| `PUT` | `/api/routines/{id}/completions/{date}` | Toggle completion for specific date | Yes |
| `DELETE`| `/api/routines/{id}` | Soft-delete / deactivate routine | Yes |
| `GET` | `/api/daily-missions?date=YYYY-MM-DD` | Aggregated view of tasks and routines | Yes |
| `GET` | `/api/reminders` | List user reminders | Yes |
| `POST` | `/api/reminders` | Create reminder for task or routine | Yes |
| `PATCH` | `/api/reminders/{id}` | Update reminder | Yes |
| `DELETE`| `/api/reminders/{id}` | Delete reminder | Yes |
| `GET` | `/api/notifications` | List in-app notifications | Yes |
| `PATCH` | `/api/notifications/{id}/read` | Mark notification as read | Yes |
| `GET` | `/api/progress/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` | Real completion statistics | Yes |
| `POST` | `/api/focus-support/suggestion` | Get non-mutating focus suggestion | Yes |

---

## 6. Known Limitations

Please see [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) for full technical documentation on background scheduler constraints, push notification status, and load scalability.
