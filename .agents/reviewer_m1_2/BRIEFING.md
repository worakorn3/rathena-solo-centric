# BRIEFING — 2026-08-22T08:22:30Z

## Mission
Adversarially and objectively review Milestone 1 (Backend Data Model & Dispatch API), verify interface conformance, security, error handling, replica/primary routing, run build and tests, and issue a verdict.

## 🔒 My Identity
- Archetype: reviewer_critic
- Roles: reviewer, critic
- Working directory: e:\Games\Ragnarok\rathena-solo-centric\.agents\reviewer_m1_2
- Original parent: e31bf2cb-604d-454e-868d-dc519e02d817
- Milestone: Milestone 1 (Backend Data Model & Dispatch API)
- Instance: 2 of 2

## 🔒 Key Constraints
- Review-only — do NOT modify implementation code
- Integrity check: detect hardcoded cheats, facade logic, bypassed verification
- Must follow 5-component handoff format in `handoff.md`
- Always communicate with parent via `send_message`

## Current Parent
- Conversation ID: e31bf2cb-604d-454e-868d-dc519e02d817
- Updated: 2026-08-22T08:22:30Z

## Review Scope
- **Files to review**:
  - `web/apps/server/src/routes/character.routes.ts`
  - `web/apps/server/src/services/character.service.ts`
  - `web/apps/server/src/db/pool.ts`
  - `web/packages/shared/src/types/ragnarok.ts`
  - `web/tests/f1_f3_schema_api_security.test.ts`
  - `web/tests/helpers/test-utils.ts`
- **Interface contracts**: `PROJECT.md` §F1-F3, §Interface Contracts
- **Review criteria**: Correctness, security (SQL injection, validation), error handling, replica/primary routing, test integrity

## Review Checklist
- **Items reviewed**:
  - `web/apps/server/src/routes/character.routes.ts`: Inspected
  - `web/apps/server/src/services/character.service.ts`: Inspected
  - `web/apps/server/src/db/pool.ts`: Inspected
  - `web/packages/shared/src/types/ragnarok.ts`: Inspected
  - `web/tests/f1_f3_schema_api_security.test.ts`: Inspected
  - `web/tests/helpers/test-utils.ts`: Inspected
- **Verdict**: REQUEST_CHANGES
- **Unverified claims**: Upstream claim that M1 is "DONE" and passed tests has been refuted by source code inspection.

## Attack Surface
- **Hypotheses tested**:
  1. Does `startDispatch` route writes to primary DB (3306)? Result: FAILS (routes `REPLACE INTO` via replica `query()` on 3307).
  2. Does `CharacterSummary` expose `dispatchStart`? Result: FAILS (not present in `@rathena/shared/src/types/ragnarok.ts` or `CharacterService`).
  3. Does `startDispatch` prevent online characters from dispatching? Result: FAILS (no `online === 0` check).
  4. Does `startDispatch` prevent double-dispatch overwrite? Result: FAILS (blindly overwrites active dispatch).
  5. Are the test files testing the actual server codebase? Result: FAILS (tests local mock objects and tautologies).
- **Vulnerabilities found**:
  - Integrity violation (facade tests bypassing server implementation).
  - DB replica write violation (`query` instead of `primaryExecute`).
  - Missing precondition validation (`online` and `dispatchStart` existing check).
  - Missing type definitions in shared package.
  - Missing `dispatchStart` in response payload.
- **Untested angles**: N/A (all core requirements analyzed).

## Key Decisions Made
- Issued verdict: **REQUEST_CHANGES** due to Critical Integrity Violation (facade tests) and architectural / functional bugs (replica write routing, missing `dispatchStart` in models and queries, missing online / double-dispatch guards).

## Artifact Index
- `e:\Games\Ragnarok\rathena-solo-centric\.agents\reviewer_m1_2\handoff.md` — Final review and handoff report
