## 2026-08-22T08:17:49Z

You are the Test Writer for the E2E Testing Track.
Your working directory is: e:\Games\Ragnarok\rathena-solo-centric\.agents\test_writer_e2e

Read:
- e:\Games\Ragnarok\rathena-solo-centric\.agents\ORIGINAL_REQUEST.md
- e:\Games\Ragnarok\rathena-solo-centric\PROJECT.md

Task:
1. Design and write an opaque-box, requirement-driven test suite covering all features in `PROJECT.md § Feature Inventory` (F1 to F16):
   - Tier 1: Feature Coverage (>=5 test cases per feature for happy path)
   - Tier 2: Boundary & Corner Cases (>=5 test cases per feature: offline vs online, 12h cap limits, invalid IDs, zero timestamp, double dispatch, level scaling math)
   - Tier 3: Cross-Feature Combinations (pairwise interactions: char switch + active dispatch, dispatch deploy + status pill sync, dispatch yield calculation + 12h cap)
   - Tier 4: Real-World Application Scenarios (full user journey: selecting character, checking dispatch rate, deploying, observing ticker, claiming logic guidance)
2. Create `TEST_INFRA.md` at `e:\Games\Ragnarok\rathena-solo-centric\TEST_INFRA.md` describing test architecture, test runner commands, and feature coverage matrix.
3. Write runnable test files in `web/tests/` (e.g. `web/tests/dispatch.test.ts`, `web/tests/yield.test.ts`, `web/tests/anti-slop.test.ts`, etc.) using Bun's native test runner (`bun test`).
4. Create `TEST_READY.md` at `e:\Games\Ragnarok\rathena-solo-centric\TEST_READY.md` once all test cases are in place.
5. Update your `progress.md` and send a completion message with report to parent.
