# BRIEFING — 2026-08-22T15:20:00Z

## Mission
Read-only exploration for Milestone 1: Backend Data Model & Dispatch API. Inspect `web/server/src` (routes, database clients, types), detail exact SQL query modifications to fetch `dispatchStart` from `char_reg_num_db` (`key = 'DISPATCH_START'`, `type = 3`) when loading character summaries and character details on replica (port 3307 / `db-replica:3306`), ensure SQL backticks on keywords/tables, and provide a step-by-step implementation blueprint.

## 🔒 My Identity
- Archetype: explorer
- Roles: [explorer, analyst]
- Working directory: e:\Games\Ragnarok\rathena-solo-centric\.agents\teamwork_preview_explorer_m1_1
- Original parent: e31bf2cb-604d-454e-868d-dc519e02d817
- Milestone: Milestone 1 (Backend Data Model & Dispatch API)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement / modify source code
- Reads must use replica (port 3307 / db-replica:3306)
- SQL keywords and table names wrapped in backticks (`char`, `char_reg_num_db`, `key`, `val`)
- Detailed step-by-step code implementation blueprint for Worker

## Current Parent
- Conversation ID: e31bf2cb-604d-454e-868d-dc519e02d817
- Updated: 2026-08-22T15:20:00Z

## Investigation State
- **Explored paths**:
  - `web/apps/server/src/db/pool.ts`
  - `web/apps/server/src/config.ts`
  - `web/apps/server/src/routes/character.routes.ts`
  - `web/apps/server/src/services/character.service.ts`
  - `web/packages/shared/src/types/ragnarok.ts`
  - `web/apps/server/test/replica_and_services.test.ts`
  - `sql-files/main.sql`
  - `npc/custom/system_tablet.txt`
- **Key findings**:
  - Backend queries use `query()` / `queryOne()` routed to Read-Only Replica on port 3307 (`db-replica:3306`) as `ro_user`.
  - Primary DB pool `getPrimaryDbPool()` / `primaryExecute()` is available on port 3306 for write mutations.
  - Character registry numeric values are joined via `LEFT JOIN \`char_reg_num_db\` AS \`d\` ON \`d\`.\`char_id\` = \`c\`.\`char_id\` AND \`d\`.\`key\` = 'DISPATCH_START' AND \`d\`.\`type\` = 3 AND \`d\`.\`index\` = 0`.
  - `CharacterSummary` in `web/packages/shared/src/types/ragnarok.ts` must declare `dispatchStart: number | null`.
  - `CharacterService.startDispatch` must validate character ownership, check offline status (`online === 0`), verify not already dispatched, and execute `INSERT ... ON DUPLICATE KEY UPDATE` to primary DB.
- **Unexplored areas**: None for M1 scope.

## Key Decisions Made
- Fully specified SQL queries with complete backtick escaping for all identifiers.
- Prepared comprehensive 5-component handoff report with exact code blueprints for `ragnarok.ts`, `character.service.ts`, and `character.routes.ts`.

## Artifact Index
- `handoff.md` — Final 5-component handoff report for Worker 1 / Parent
