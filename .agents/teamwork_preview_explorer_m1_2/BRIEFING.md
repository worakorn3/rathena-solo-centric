# BRIEFING — 2026-08-22T15:20:00+07:00

## Mission
Investigate Elysia route definitions, plugin structure, and detail the exact implementation of POST /api/character/:charId/dispatch (Milestone 1, Explorer 2).

## 🔒 My Identity
- Archetype: Explorer
- Roles: Read-only investigation, codebase analysis, handoff synthesis
- Working directory: e:\Games\Ragnarok\rathena-solo-centric\.agents\teamwork_preview_explorer_m1_2
- Original parent: e31bf2cb-604d-454e-868d-dc519e02d817
- Milestone: Milestone 1 - Backend Data Model & Dispatch API

## 🔒 Key Constraints
- Read-only investigation — do NOT implement / modify source code.
- Write only to your own agent folder (`.agents/teamwork_preview_explorer_m1_2`).
- Report findings with exact file paths, line numbers, and SQL/code snippets.

## Current Parent
- Conversation ID: e31bf2cb-604d-454e-868d-dc519e02d817
- Updated: 2026-08-22T15:20:00+07:00

## Investigation State
- **Explored paths**:
  - `web/apps/server/src/index.ts`
  - `web/apps/server/src/config.ts`
  - `web/apps/server/src/db/pool.ts`
  - `web/apps/server/src/routes/character.routes.ts`
  - `web/apps/server/src/routes/auth.routes.ts`
  - `web/apps/server/src/services/character.service.ts`
  - `web/packages/shared/src/types/ragnarok.ts`
  - `sql-files/main.sql` (table `char_reg_num`)
  - `npc/custom/system_tablet.txt`
  - `src/char/inter.cpp`
- **Key findings**:
  - Route defined in `web/apps/server/src/routes/character.routes.ts` mounted under prefix `/api/character`.
  - Database pool architecture in `src/db/pool.ts` provides `query` (Read replica port 3307) and `primaryExecute`/`primaryQuery` (Primary DB port 3306).
  - Primary DB table is `` `char_reg_num` `` with columns `char_id`, `key`, `index`, `value`.
  - Variable key used in `system_tablet.txt` is `'DispatchStart'` at `index = 0`.
  - Precondition checks: Character existence & ownership, `online === 0` (409 Conflict if online), `dispatchStart === null || dispatchStart === 0` (409 Conflict if active).
  - Mutation must execute on Primary DB via `primaryExecute` with SQL backticks escaping.
- **Unexplored areas**: None. Complete blueprint ready for handoff.

## Key Decisions Made
- Confirmed `char_reg_num` table schema and `'DispatchStart'` key.
- Designed structured result enum for `CharacterService.startDispatch` mapping cleanly to HTTP 200, 400, 401, 403, 404, 409, 500 status codes.

## Artifact Index
- `.agents/teamwork_preview_explorer_m1_2/DISPATCH.md` — Initial dispatch message
- `.agents/teamwork_preview_explorer_m1_2/progress.md` — Liveness & progress tracking
- `.agents/teamwork_preview_explorer_m1_2/handoff.md` — 5-component handoff report
