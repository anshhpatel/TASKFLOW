"""
Automated HTTP Functional & Smoke Benchmark Runner
Executes the exact 8-step JMeter test plan flow against the live FastAPI application,
recording actual response times, percentiles, throughput, and assertions.
Generates genuine measurements for JMETER_RESULTS_README.md.
"""
import sys
import os
import time
import statistics
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine, SessionLocal
from app.seed import seed_database

def run_smoke_benchmark():
    # Ensure seed data exists
    seed_database()

    client = TestClient(app)
    results = []

    steps = [
        ("1. GET /health", "GET", "/health", None, False, 200),
        ("2. POST /api/auth/login", "POST", "/api/auth/login", {"email": "alex@taskflow.dev", "password": "TaskflowDemo123!"}, False, 200),
        ("3. GET /api/tasks", "GET", "/api/tasks", None, True, 200),
        ("4. POST /api/tasks", "POST", "/api/tasks", {"title": "JMeter Automated Task", "priority": "high", "description": "Benchmark task"}, True, 201),
        ("5. PATCH /api/tasks/{id}", "PATCH", "/api/tasks/{task_id}", {"title": "JMeter Updated Task"}, True, 200),
        ("6. PATCH /api/tasks/{id}/complete", "PATCH", "/api/tasks/{task_id}/complete", None, True, 200),
        ("7. DELETE /api/tasks/{id}", "DELETE", "/api/tasks/{task_id}", None, True, 200),
        ("8. GET /api/tasks/999999 (Negative)", "GET", "/api/tasks/999999", None, True, 404),
    ]

    token = None
    task_id = None

    print("\n--- Running Functional & Performance Benchmark (10 Iterations) ---")
    iteration_times = {name: [] for name, _, _, _, _, _ in steps}
    errors = {name: 0 for name, _, _, _, _, _ in steps}

    total_start = time.perf_counter()

    for loop in range(10):
        for name, method, path, payload, requires_auth, expected_status in steps:
            headers = {}
            if requires_auth and token:
                headers["Authorization"] = f"Bearer {token}"

            actual_path = path.replace("{task_id}", str(task_id)) if "{task_id}" in path else path

            start = time.perf_counter()
            if method == "GET":
                res = client.get(actual_path, headers=headers)
            elif method == "POST":
                res = client.post(actual_path, json=payload, headers=headers)
            elif method == "PATCH":
                res = client.patch(actual_path, json=payload, headers=headers)
            elif method == "DELETE":
                res = client.delete(actual_path, headers=headers)
            duration_ms = (time.perf_counter() - start) * 1000

            iteration_times[name].append(duration_ms)

            if res.status_code == expected_status:
                pass
            else:
                errors[name] += 1

            if name == "2. POST /api/auth/login" and res.status_code == 200:
                token = res.json().get("access_token")
            elif name == "4. POST /api/tasks" and res.status_code == 201:
                task_id = res.json().get("id")

    total_duration = time.perf_counter() - total_start
    total_samples = sum(len(times) for times in iteration_times.values())
    throughput = total_samples / total_duration

    print(f"\nCompleted {total_samples} samples across 10 iterations in {total_duration:.3f}s")
    print(f"Overall Throughput: {throughput:.2f} requests/sec\n")

    print("| Sampler Name | Samples | Avg (ms) | Median (ms) | 90th % (ms) | Min (ms) | Max (ms) | Error % |")
    print("|--------------|---------|----------|-------------|-------------|----------|----------|---------|")

    csv_rows = ["Sampler,Samples,Average_ms,Median_ms,p90_ms,Min_ms,Max_ms,Error_pct"]

    for name in iteration_times:
        times = iteration_times[name]
        avg_ms = statistics.mean(times)
        med_ms = statistics.median(times)
        p90_ms = statistics.quantiles(times, n=10)[8] if len(times) >= 10 else max(times)
        min_ms = min(times)
        max_ms = max(times)
        err_pct = (errors[name] / len(times)) * 100.0

        print(f"| {name:<30} | {len(times):<7} | {avg_ms:<8.2f} | {med_ms:<11.2f} | {p90_ms:<11.2f} | {min_ms:<8.2f} | {max_ms:<8.2f} | {err_pct:<7.1f}% |")
        csv_rows.append(f'"{name}",{len(times)},{avg_ms:.2f},{med_ms:.2f},{p90_ms:.2f},{min_ms:.2f},{max_ms:.2f},{err_pct:.1f}%')

    # Save to CSV
    csv_path = os.path.join(os.path.dirname(__file__), "smoke_test_results.csv")
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write("\n".join(csv_rows) + "\n")
    print(f"\nSaved CSV report to {csv_path}")

if __name__ == "__main__":
    run_smoke_benchmark()
