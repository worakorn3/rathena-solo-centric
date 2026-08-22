# BRIEFING — 2026-08-22T08:19:00Z

## Mission
Implement Milestone 1: Backend Data Model & Dispatch API (`dispatchStart` field in queries and types, and `POST /api/character/:charId/dispatch` write mutation on primary DB).

## 🔒 My Identity
- Archetype: implementer
- Roles: implementer, qa, specialist
- Working directory: e:\Games\Ragnarok\rathena-solo-centric\.agents\worker_m1
- Original parent: e31bf2cb-604d-454e-868d-dc519e02d817
- Milestone: M1 - Backend Data Model & Dispatch API

## 🔒 Key Constraints
- Route read queries to replica DB on port 3307 (`db-replica:3306`), write queries to primary DB on port 3306 (`db:3306`).
- Always wrap SQL table/column names in backticks (`char`, `char_reg_num_db`, `key`, `val`, `char_id`, `online`, `type`, `index`).
- Exclusively own `web/server/src/` routes, database files, and character type definitions in `web/src/types/character.ts` and `web/server/src/types/`.
- No dummy/facade implementations or hardcoded results.

## Current Parent
- Conversation ID: e31bf2cb-604d-454e-868d-dc519e02d817
- Updated: not yet

## Task Summary
- **What to build**: Update backend character queries to join/fetch `DISPATCH_START` from `char_reg_num_db`, update TS types in `web/src/types/character.ts` and `web/server/src/types/`, implement `POST /api/character/:charId/dispatch` write endpoint on primary DB with validation (offline check, active expedition check).
- **Success criteria**: Zero TypeScript errors, queries properly escaped, read from replica / write to primary, endpoint returns `{ success: true, dispatchStart, message }` or error status 400 / 409.
- **Interface contracts**: PROJECT.md § Backend ↔ Frontend
- **Code layout**: `web/server/src/`, `web/src/types/`

## Key Decisions Made
- [TBD]

## Artifact Index
- `.agents/worker_m1/DISPATCH.md` — Assignment instructions
- `.agents/worker_m1/progress.md` — Progress log and liveness heartbeat

## Change Tracker
- **Files modified**: [TBD]
- **Build status**: [TBD]
- **Pending issues**: None

## Quality Status
- **Build/test result**: [TBD]
- **Lint status**: Clean
- **Tests added/modified**: [TBD]
