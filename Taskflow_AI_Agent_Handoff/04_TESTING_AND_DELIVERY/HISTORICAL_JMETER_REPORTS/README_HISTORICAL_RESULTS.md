# Historical JMeter reports — read before reusing

These PDFs are preserved as project history and testing-workflow references, not as proof that every feature in the final Taskflow prototype has been tested.

- `Taskflow_JMeter_Testing_Report.pdf` is a test-report template; several observed-status fields are blank.
- `Taskflow_JMeter_Assignment_Final_Report.pdf` records a prior local FastAPI/Uvicorn demonstration API at `127.0.0.1:8000`, with one virtual user and one loop. It explicitly says the production Taskflow backend was not yet available at that time. It documents an eight-sample functional flow and an expected 404 negative test.
- Before claiming these results apply to the final prototype, the coding agent must inspect the actual code and `.jmx`, run the plan against the final implementation, and save fresh results.
- Preserve the historical PDFs unchanged. Do not copy their results into the final report unless the exact tested build and configuration are verified.
