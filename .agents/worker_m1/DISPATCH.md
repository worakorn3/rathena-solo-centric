## 2026-08-22T08:18:40Z
You are Worker 1 for Milestone 1 (Backend Data Model & Dispatch API).
Your working directory is: e:\Games\Ragnarok\rathena-solo-centric\.agents\worker_m1

Read:
- e:\Games\Ragnarok\rathena-solo-centric\.agents\ORIGINAL_REQUEST.md
- e:\Games\Ragnarok\rathena-solo-centric\PROJECT.md
- e:\Games\Ragnarok\rathena-solo-centric\TEST_INFRA.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

CRITICAL RULES & GUARDRAILS:
- `WEB_DB_REPLICA_PORT`: Route all web read queries to replica on port 3307 (or `db-replica:3306` in Docker network) with `ro_user`. Write queries go to primary DB (port 3306 / `db:3306`).
- `SQL_RESERVED_WORDS`: Always wrap rAthena table and column names in backticks (e.g. `char`, `char_reg_num_db`, `key`, `val`, `char_id`, `online`).
- File Ownership: You exclusively own `web/server/src/` routes, database files, and character type definitions in `web/src/types/character.ts` and `web/server/src/types/`.

Task:
1. Update character DB queries in `web/server/src` to include `dispatchStart: number | null` (from `char_reg_num_db` where `key` = 'DISPATCH_START' and `type` = 3). If value is missing or 0, return `null`.
2. Update TypeScript types in `web/src/types/character.ts` and `web/server/src/types/` to include `dispatchStart: number | null` in `CharacterSummary` and `CharacterDetail`.
3. Implement `POST /api/character/:charId/dispatch` in `web/server/src/routes/character.ts`:
   - Validate `charId` parameter.
   - Fetch character info: verify character exists, check `online === 0` (if online, return 400 Bad Request: "Character currently logged into Ragnarok. Dispatches must be initiated while offline or via the System Tablet."), check `dispatchStart === null || dispatchStart === 0` (if already active, return 409 Conflict: "Character is already on an active expedition.").
   - Execute write mutation to Primary DB (port 3306):
     ```sql
     INSERT INTO `char_reg_num_db` (`char_id`, `key`, `index`, `val`)
     VALUES (?, 'DISPATCH_START', 0, UNIX_TIMESTAMP())
     ON DUPLICATE KEY UPDATE `val` = UNIX_TIMESTAMP()
     ```
   - Return `{ success: true, dispatchStart: <current_unix_timestamp>, message: "Character deployed on solo expedition." }`.
4. Run tests or build in `web/` (`bun test` or `bun run build`) to verify there are zero TypeScript / runtime errors.
5. Update your `progress.md`, write your comprehensive handoff report to `e:\Games\Ragnarok\rathena-solo-centric\.agents\worker_m1\handoff.md` with build/test outputs, and send a completion message to parent.
