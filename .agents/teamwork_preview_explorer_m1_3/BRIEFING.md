# BRIEFING — 2026-08-22T08:21:00Z

## Mission
Investigate TypeScript types, shared interfaces, error handling, edge cases, and test verification methods for Milestone 1 (Backend Data Model & Dispatch API).

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis, verification
- Working directory: e:\Games\Ragnarok\rathena-solo-centric\.agents\teamwork_preview_explorer_m1_3
- Original parent: e31bf2cb-604d-454e-868d-dc519e02d817
- Milestone: M1 (Backend Data Model & Dispatch API)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify source code.
- Write only inside .agents/teamwork_preview_explorer_m1_3/ folder.
- Adhere to project guidelines and MISTAKES_AND_LEARNINGS rules.

## Current Parent
- Conversation ID: e31bf2cb-604d-454e-868d-dc519e02d817
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `web/packages/shared/src/types/ragnarok.ts`, `web/packages/shared/src/index.ts`
  - `web/apps/server/src/services/character.service.ts`
  - `web/apps/server/src/routes/character.routes.ts`
  - `web/apps/server/src/db/pool.ts`
  - `web/apps/server/src/config.ts`
  - `web/apps/client/src/App.tsx`, `web/apps/client/src/lib/api.ts`
  - `sql-files/main.sql` (`char_reg_num` table schema)
- **Key findings**:
  - `CharacterSummary` and `CharacterDetail` in `@rathena/shared` need `dispatchStart: number | null`.
  - In `char_reg_num`, `key` is binary case-sensitive `varchar(32) binary`. Key MUST be `'DISPATCH_START'` (not `'DispatchStart'`).
  - Read queries go through replica (`getDbPool()` on port 3307), mutation `startDispatch` MUST use `primaryExecute`/`primaryQuery` on Primary DB (port 3306).
  - Queries need a `LEFT JOIN` on `char_reg_num` with `key = 'DISPATCH_START' AND index = 0`.
  - Type coercion: `rawVal ? Number(rawVal) : null` mapped to `(rawVal && rawVal > 0) ? rawVal : null` to safely handle missing records (NULL), 0 values, and BigInt strings.
  - Error handling: Online status check (`online === 1` -> 409 Conflict), duplicate dispatch check (`dispatchStart > 0` -> 409 Conflict), character ownership validation (404/403).
  - Test suite defined for `bun test` in `web/apps/server/test/dispatch.test.ts` and curl/fetch verification.
- **Unexplored areas**: None for M1 scope.

## Key Decisions Made
- Fully documented all interface contracts, DB query joins, edge cases, error codes, and verification commands for the Worker agent.

## Artifact Index
- `.agents/teamwork_preview_explorer_m1_3/progress.md` — Liveness & progress tracking
- `.agents/teamwork_preview_explorer_m1_3/handoff.md` — 5-Component Handoff report
- `.agents/teamwork_preview_explorer_m1_3/DISPATCH.md` — Input dispatch log
