# Taskflow — Apache JMeter Test Guidance

## 1. Purpose
Use JMeter to exercise the FastAPI HTTP endpoints and collect reproducible measurements. The existing project has already used a simple JMeter workflow. Inspect and preserve the existing `.jmx` and results before changing it.

## 2. First run: smoke/functional HTTP test
- Start PostgreSQL, backend, and any required seed/setup.
- Confirm the backend URL. The previous local backend target was `http://127.0.0.1:8000`.
- Verify endpoint paths and methods against the actual implementation before running.
- Use a Thread Group with a small number of virtual users, ramp-up, and loops.
- Add HTTP Request samplers, required headers, and request bodies.
- Add assertions for status codes and, where useful, response content.
- Add listeners such as View Results Tree for debugging and Aggregate Report/Summary Report for summary measurements.
- Do not use View Results Tree for a large load test because it adds overhead.

## 3. Suggested endpoint coverage
- `GET /health` only if implemented.
- Authentication flow only if the JMeter plan safely manages test credentials and token/cookie state.
- `GET /api/tasks`
- `POST /api/tasks` with a unique test title.
- `PATCH /api/tasks/{id}` or the actual update route.
- `PATCH /api/tasks/{id}/complete` or the actual completion route.
- `DELETE /api/tasks/{id}`
- A negative test for an invalid task ID, asserting the expected not-found response.

If auth is required, add a login request and extract the returned token/cookie for later requests. Avoid hardcoding real user credentials. Use a dedicated test account.

## 4. Metrics to report
- Samples / request count.
- Average, median, and 90th percentile response time.
- Throughput (requests per second or minute, as shown by JMeter).
- Error percentage and which requests failed.
- Sent/received throughput if relevant.
- Configuration: virtual users, ramp-up, loops or duration, machine/environment, and endpoints tested.

## 5. Performance claims
The earlier setup was a small single-user/low-loop test (the prior setup was described as one virtual user, one-second ramp-up, one loop). That is a smoke test, not proof of high-load scalability. If the evaluation requires load evidence, run staged tests with increasing users and controlled duration, first checking data correctness and server resource constraints.

Do not invent or pre-fill report values. Save actual JMeter output and explain any errors. An expected 404 in a negative test may be an expected application outcome; configure assertions so it is not incorrectly interpreted as a functional failure, while clearly reporting it as a negative test.

## 6. Deliverables
- Original JMeter `.jmx` retained.
- Updated `.jmx` only if needed, with change notes.
- CSV/JTL output if used.
- Aggregate/Summary Report screenshot or exported report.
- `JMETER_RESULTS_README.md` containing the exact configuration and actual results.
