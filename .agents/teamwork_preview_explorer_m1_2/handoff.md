# Handoff Report: Milestone 1 — Backend Data Model & Dispatch API (`POST /api/character/:charId/dispatch`)

**Agent**: Explorer 2 (Milestone 1)  
**Date**: 2026-08-22  
**Working Directory**: `e:\Games\Ragnarok\rathena-solo-centric\.agents\teamwork_preview_explorer_m1_2`

---

## 1. Observation

### 1.1 Codebase & Route Structure
- **Backend Root**: `web/apps/server` (Bun + Elysia.js).
- **Entry Point**: `web/apps/server/src/index.ts`:
  - Line 8: `import { characterRoutes } from "./routes/character.routes";`
  - Line 39: `app.use(characterRoutes)`
- **Character Routes**: `web/apps/server/src/routes/character.routes.ts`:
  - Line 6: `export const characterRoutes = new Elysia({ prefix: "/api/character" })`
  - Lines 7-12: JWT plugin configured with `.use(jwt({ name: "jwt", secret: config.server.jwtSecret }))`
  - Lines 74-111: Placeholder `POST /:charId/dispatch` implementation currently exists with incomplete validation, flawed error handling (returns 403 on missing char), and no check for `online === 0` or active dispatch status.
- **Character Service**: `web/apps/server/src/services/character.service.ts`:
  - Lines 252-268: `startDispatch(charId: number, accountId: number)` currently attempts to write via `query()` on the **Read-Only Replica** (port 3307) instead of `primaryExecute()` on the **Primary DB** (port 3306).

### 1.2 Database Architecture & Client Routing
- **DB Configuration (`web/apps/server/src/config.ts`)**:
  - `config.db`: Read-Only Replica (port 3307 / `db-replica:3306`, user `ro_user`).
  - `config.primaryDb`: Primary DB (port 3306 / `db:3306`, user `ragnarok`).
- **Connection Pools (`web/apps/server/src/db/pool.ts`)**:
  - `query<T>()` & `queryOne<T>()`: Execute queries on `getDbPool()` (port 3307 Replica).
  - `primaryQuery<T>()` & `primaryExecute()`: Execute queries on `getPrimaryDbPool()` (port 3306 Primary DB with rAthena credentials).

### 1.3 SQL Schema & In-Game Script Registry Mapping
- **Schema Definition (`sql-files/main.sql:302-309`)**:
  ```sql
  CREATE TABLE IF NOT EXISTS `char_reg_num` (
    `char_id` int(11) unsigned NOT NULL default '0',
    `key` varchar(32) binary NOT NULL default '',
    `index` int(11) unsigned NOT NULL default '0',
    `value` bigint(11) NOT NULL default '0',
    PRIMARY KEY (`char_id`,`key`,`index`),
    KEY `char_id` (`char_id`)
  ) ENGINE=MyISAM;
  ```
- **Athena Config (`conf/inter_athena.conf:137`)**:
  `char_reg_num_table: char_reg_num`
- **In-Game Script Usage (`npc/custom/system_tablet.txt`)**:
  - Line 167: `if (DispatchStart > 0)`
  - Line 168: `.@elapsed_sec = gettimetick(2) - DispatchStart;`
  - Line 205: `DispatchStart = 0;`
  - Line 221: `DispatchStart = gettimetick(2);`
  - Note: In rAthena C++ (`src/char/inter.cpp:645`), character-scoped numeric variables write to `` `char_reg_num` `` with `key = 'DispatchStart'` (case-sensitive binary string) and `index = 0`.

---

## 2. Logic Chain

1. **Safety & Architecture Boundary**:
   - `MISTAKES_AND_LEARNINGS` rule `WEB_DB_REPLICA_PORT` dictates that read queries use replica (3307), while write mutations MUST route to primary (3306).
   - Write mutations like deploying a dispatch must invoke `primaryExecute()` from `src/db/pool.ts`.
   - To avoid replication lag race conditions during pre-condition evaluation, the pre-check query for ownership, online status, and active dispatch should query the Primary DB (`primaryQuery`) directly before writing.

2. **Pre-condition Validation Chain**:
   - Step 1: Parse and validate `charId` (must be a positive integer > 0). If not, return HTTP 400 Bad Request.
   - Step 2: Validate JWT Authorization header (`Bearer <token>`). If missing or invalid, return HTTP 401 Unauthorized.
   - Step 3: Fetch character record from `char` joined with `char_reg_num` for `DispatchStart`:
     - If character does not exist: return HTTP 404 Not Found.
     - If character exists but `account_id !== payload.accountId`: return HTTP 403 Forbidden.
   - Step 4: Validate `online === 0`. If `char.online !== 0` (character is logged into the game), dispatches are blocked per requirement R3 State A. Return HTTP 409 Conflict with descriptive error message.
   - Step 5: Validate `dispatchStart === null || dispatchStart === 0`. If character already has `dispatchStart > 0`, return HTTP 409 Conflict.

3. **Atomic Mutation Execution**:
   - Step 6: Generate current Unix epoch timestamp in seconds (`Math.floor(Date.now() / 1000)`).
   - Step 7: Execute SQL UPSERT on Primary DB:
     ```sql
     INSERT INTO `char_reg_num` (`char_id`, `key`, `index`, `value`)
     VALUES (?, 'DispatchStart', 0, ?)
     ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
     ```
   - Step 8: Return HTTP 200 OK with `{ success: true, dispatchStart: timestamp, message: "Expedition successfully dispatched." }`.

---

## 3. Caveats

1. **Table and Column Naming**:
   - Note that in `sql-files/main.sql` the table name is `` `char_reg_num` `` with column `` `value` `` (not `char_reg_num_db` / `val`).
   - The variable name in rAthena script `system_tablet.txt` is `'DispatchStart'`. Because `key` column has `binary` collation, SQL queries must use `'DispatchStart'` exactly.
2. **Online Status Consistency**:
   - `char.online` is managed by map/char servers. When a player is online, `online = 1`. When offline, `online = 0`.
   - If the player starts dispatch in-game via `system_tablet.txt:222`, the script runs `@kick` to disconnect the character. In web portal dispatch, the character must already be offline (`online === 0`).
3. **Time Synchronization**:
   - The web server calculates `Math.floor(Date.now() / 1000)` to set `value` and returns this timestamp immediately to client. This avoids a secondary DB read and prevents client/server clock misalignment.
4. **SQL Reserved Keywords**:
   - Per `MISTAKES_AND_LEARNINGS` rule `SQL_RESERVED_WORDS`, all column and table names in queries (`` `char` ``, `` `key` ``, `` `index` ``, `` `value` ``, `` `online` ``, `` `char_id` ``) MUST be wrapped in backticks.

---

## 4. Conclusion & Implementation Blueprint

### 4.1 Service Layer: `web/apps/server/src/services/character.service.ts`

```ts
import { primaryExecute, primaryQuery, query, queryOne } from "../db/pool";

export interface StartDispatchResult {
  status: "SUCCESS" | "NOT_FOUND" | "UNAUTHORIZED" | "ONLINE" | "ALREADY_DISPATCHED" | "DB_ERROR";
  dispatchStart?: number;
  error?: string;
}

export class CharacterService {
  // ... existing methods ...

  /**
   * Starts a solo dispatch/expedition for an offline character.
   * Performs ownership verification, online check, and duplicate dispatch prevention.
   * Executes atomic UPSERT on Primary DB (port 3306).
   */
  static async startDispatch(charId: number, accountId: number): Promise<StartDispatchResult> {
    try {
      // Query primary DB to avoid replica lag during precondition validation
      const rows = await primaryQuery<{
        char_id: number;
        account_id: number;
        online: number;
        dispatch_start: number | null;
      }>(
        `SELECT c.\`char_id\`, c.\`account_id\`, c.\`online\`, crn.\`value\` AS \`dispatch_start\`
         FROM \`char\` c
         LEFT JOIN \`char_reg_num\` crn
           ON c.\`char_id\` = crn.\`char_id\` AND crn.\`key\` = 'DispatchStart' AND crn.\`index\` = 0
         WHERE c.\`char_id\` = ? LIMIT 1`,
        [charId]
      );

      if (!rows || rows.length === 0) {
        return { status: "NOT_FOUND", error: "Character not found" };
      }

      const char = rows[0];

      if (char.account_id !== accountId) {
        return { status: "UNAUTHORIZED", error: "Unauthorized to dispatch this character" };
      }

      if (char.online !== 0) {
        return {
          status: "ONLINE",
          error: "Character is currently logged into Ragnarok. Dispatches must be initiated while offline."
        };
      }

      if (char.dispatch_start !== null && Number(char.dispatch_start) > 0) {
        return {
          status: "ALREADY_DISPATCHED",
          error: "Character is already deployed on an active expedition."
        };
      }

      const dispatchTimestamp = Math.floor(Date.now() / 1000);

      // Write mutation strictly to Primary DB (port 3306)
      await primaryExecute(
        `INSERT INTO \`char_reg_num\` (\`char_id\`, \`key\`, \`index\`, \`value\`)
         VALUES (?, 'DispatchStart', 0, ?)
         ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)`,
        [charId, dispatchTimestamp]
      );

      return {
        status: "SUCCESS",
        dispatchStart: dispatchTimestamp
      };
    } catch (err: any) {
      console.error(`[CharacterService.startDispatch] DB Error:`, err);
      return { status: "DB_ERROR", error: "Database operation failed" };
    }
  }
}
```

### 4.2 Route Layer: `web/apps/server/src/routes/character.routes.ts`

```ts
import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { CharacterService } from "../services/character.service";
import { config } from "../config";

export const characterRoutes = new Elysia({ prefix: "/api/character" })
  .use(
    jwt({
      name: "jwt",
      secret: config.server.jwtSecret,
    })
  )
  // ... other endpoints ...
  .post(
    "/:charId/dispatch",
    async ({ params, headers, jwt, set }) => {
      const authHeader = headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);

      if (!payload || !payload.accountId) {
        set.status = 401;
        return { success: false, error: "Invalid token" };
      }

      const charId = parseInt(params.charId, 10);
      if (isNaN(charId) || charId <= 0) {
        set.status = 400;
        return { success: false, error: "Invalid character ID" };
      }

      const result = await CharacterService.startDispatch(charId, Number(payload.accountId));

      switch (result.status) {
        case "SUCCESS":
          return {
            success: true,
            dispatchStart: result.dispatchStart,
            message: "Expedition successfully dispatched."
          };
        case "NOT_FOUND":
          set.status = 404;
          return { success: false, error: result.error };
        case "UNAUTHORIZED":
          set.status = 403;
          return { success: false, error: result.error };
        case "ONLINE":
        case "ALREADY_DISPATCHED":
          set.status = 409;
          return { success: false, error: result.error };
        default:
          set.status = 500;
          return { success: false, error: result.error || "Internal server error" };
      }
    },
    {
      params: t.Object({
        charId: t.String(),
      }),
    }
  );
```

---

## 5. Verification Method

### 5.1 Unit / Integration Test Cases (`web/apps/server/test/dispatch.test.ts`)
1. **Invalid ID (HTTP 400)**:
   - Call `POST /api/character/invalid-id/dispatch` with valid auth token.
   - Assert `response.status === 400` and `body.error === "Invalid character ID"`.
2. **Unauthorized / Missing Token (HTTP 401)**:
   - Call `POST /api/character/150000/dispatch` without `Authorization` header.
   - Assert `response.status === 401` and `body.error === "Unauthorized"`.
3. **Character Not Found (HTTP 404)**:
   - Call `POST /api/character/9999999/dispatch` with valid auth token for account 2000000.
   - Assert `response.status === 404` and `body.error === "Character not found"`.
4. **Ownership Mismatch (HTTP 403)**:
   - Call `POST /api/character/:charId/dispatch` where character belongs to account A, but token is for account B.
   - Assert `response.status === 403` and `body.error === "Unauthorized to dispatch this character"`.
5. **Online Character Block (HTTP 409)**:
   - Seed character with `online = 1`.
   - Call `POST /api/character/:charId/dispatch`.
   - Assert `response.status === 409` and error contains `"Character is currently logged into Ragnarok"`.
6. **Active Expedition Conflict (HTTP 409)**:
   - Seed character with `online = 0` and `char_reg_num` record `key = 'DispatchStart'`, `value = 1724300000`.
   - Call `POST /api/character/:charId/dispatch`.
   - Assert `response.status === 409` and error contains `"Character is already deployed on an active expedition."`.
7. **Successful Dispatch Deployment (HTTP 200)**:
   - Seed character with `online = 0` and no `DispatchStart` entry (or `value = 0`).
   - Call `POST /api/character/:charId/dispatch`.
   - Assert `response.status === 200`, `body.success === true`, `typeof body.dispatchStart === "number"`, and `body.dispatchStart > 0`.
   - Query Primary DB (`primaryQuery`) to confirm row in `char_reg_num` exists with `char_id`, `key = 'DispatchStart'`, `index = 0`, and matching `value`.

### 5.2 Build & Type Verification Command
- Run `bun test` in `web/apps/server` or root workspace:
  ```powershell
  cd e:\Games\Ragnarok\rathena-solo-centric\web; bun test
  ```
- Run monorepo typecheck:
  ```powershell
  cd e:\Games\Ragnarok\rathena-solo-centric\web; bun run build
  ```
