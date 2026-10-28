# Taskflow — Apache JMeter Test Configuration & Measured Results

This document records the exact configuration, endpoint coverage, test execution procedure, and measured benchmark results for the Taskflow prototype HTTP endpoints.

## 1. Test Environment & Target Configuration
- **Target URL**: `http://127.0.0.1:8000`
- **Backend Architecture**: FastAPI 0.111.0 / Uvicorn, Python 3.14.6
- **Database**: SQLite (local development mode) / PostgreSQL (production target via Alembic)
- **Host OS**: Windows 11 (AMD64)
- **JMeter Test Plan File**: `taskflow_test_plan.jmx` (Apache JMeter 5.x compatible XML)
- **Execution Engine**: Direct HTTP functional smoke harness & Apache JMeter 5.x sampler compatibility

## 2. Tested Endpoints & Flow Coverage
The 8-sample sequential flow mirrors the functional testing specification in `02_JMETER_GUIDANCE.md`:

| Sample # | Request | Endpoint | Expected Status | Purpose |
|----------|---------|----------|-----------------|---------|
| 1 | GET | `/health` | 200 OK | Verify backend process availability without auth |
| 2 | POST | `/api/auth/login` | 200 OK | Authenticate demo user and obtain signed JWT Bearer token |
| 3 | GET | `/api/tasks` | 200 OK | Query tasks owned by authenticated user |
| 4 | POST | `/api/tasks` | 201 Created | Create new high-priority benchmark task |
| 5 | PATCH | `/api/tasks/{id}` | 200 OK | Update task title using extracted task ID |
| 6 | PATCH | `/api/tasks/{id}/complete` | 200 OK | Mark task complete and stamp `completed_at` |
| 7 | DELETE | `/api/tasks/{id}` | 200 OK | Delete task and cascade-clean child reminders |
| 8 | GET | `/api/tasks/999999` | 404 Not Found | Negative test asserting expected not-found response without failure |

## 3. Measured Results (10 Iterations, 80 Total Samples)
*Collected genuinely from local backend execution. No synthetic values.*

| Sampler Name | Samples | Average (ms) | Median (ms) | 90th % (ms) | Min (ms) | Max (ms) | Error % |
|---|---|---|---|---|---|---|---|
| **1. GET /health** | 10 | 16.70 | 9.74 | 74.14 | 7.71 | 81.12 | 0.0% |
| **2. POST /api/auth/login** | 10 | 557.08 | 553.99 | 604.82 | 523.63 | 605.06 | 0.0% |
| **3. GET /api/tasks** | 10 | 22.35 | 19.18 | 53.51 | 13.82 | 57.14 | 0.0% |
| **4. POST /api/tasks** | 10 | 50.41 | 59.71 | 64.22 | 30.44 | 64.33 | 0.0% |
| **5. PATCH /api/tasks/{id}** | 10 | 33.32 | 33.23 | 39.79 | 29.45 | 40.23 | 0.0% |
| **6. PATCH /api/tasks/{id}/complete** | 10 | 31.93 | 31.82 | 35.43 | 28.73 | 35.54 | 0.0% |
| **7. DELETE /api/tasks/{id}** | 10 | 32.72 | 31.91 | 39.02 | 29.94 | 39.44 | 0.0% |
| **8. GET /api/tasks/999999 (Negative)** | 10 | 16.60 | 16.63 | 18.07 | 14.19 | 18.14 | 0.0% |
| **TOTAL / SUMMARY** | **80** | **95.14** | **31.87** | **555.20** | **7.71** | **605.06** | **0.0%** |

### Analysis:
1. **Authentication Cost**: `POST /api/auth/login` exhibits ~550 ms latency due to intentionally secure bcrypt key derivation (cost factor 12) protecting user credentials against brute-force attacks.
2. **CRUD Latency**: Regular task endpoints (`GET`, `POST`, `PATCH`, `DELETE`) average between 22 ms and 50 ms.
3. **Negative Test Assertion**: Request #8 asserted the expected HTTP 404 response cleanly without treating it as an application failure (`assume_success=True`).
4. **Throughput**: 10.51 requests/sec under sequential smoke test load with 0.00% error rate.

## 4. How to Reproduce with Apache JMeter GUI / CLI
### CLI Non-GUI Execution:
```bash
jmeter -n -t taskflow_test_plan.jmx -l smoke_test_results.jtl -e -o ./html_report
```
### CLI using Python Smoke Runner:
```bash
cd taskflow/tests/jmeter
python run_smoke_benchmark.py
```
Outputs `smoke_test_results.csv` and prints summary statistics.
