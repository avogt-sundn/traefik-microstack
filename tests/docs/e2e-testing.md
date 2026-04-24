# E2E Testing

Playwright blackbox tests against the running stack. Tests treat the system as a black box — they send HTTP requests or interact with the browser UI and assert on observable behaviour only. No implementation details.

## Test files

| File | What it covers |
|------|----------------|
| `smoke.spec.ts` | Health endpoints + basic reachability |
| `partner-search.spec.ts` | Search API correctness (seed data, dual-engine response shape) |
| `partner-search-ui.spec.ts` | Browser UI interactions (typing, reset, live search) |
| `engine-toggle.spec.ts` | Postgres / Elasticsearch toggle behaviour |
| `result-count.spec.ts` | Result count bar: matched, store total, showing |
| `partner-dev-badge.spec.ts` | Dev badge visibility when served by ng serve |

Total: 44 tests.

## Running tests

### In Docker (standard, mirrors CI)

```bash
make pw-run
```

### Locally inside the devcontainer

```bash
cd tests
BASE_URL=https://gateway npx playwright test
```

List all tests without running:

```bash
cd tests
BASE_URL=https://gateway npx playwright test --list
```

## Outputs

| Output | Location | Description |
|--------|----------|-------------|
| JUnit XML | `target/results/smoke.xml` | Machine-readable, parsed by dashboard |
| HTML report | `target/report/` | Interactive report with timeline and network |
| Traces | `target/test-results/<test>/trace.zip` | Per-test trace for debugging |

## Dashboard

`e2e-report-server` exposes a dashboard at **http://localhost:9090** while the stack is running. Shows pass/fail per test, error details, and a "Run Tests" button.

## Trace viewer

```bash
make pw-trace
```

## HTML report

```bash
make pw-report
```
