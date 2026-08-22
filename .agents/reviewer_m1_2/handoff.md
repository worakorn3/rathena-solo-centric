# Quality & Adversarial Review Report: Milestone 1 (Backend Data Model & Dispatch API)

## 1. Observation

Direct examination of the workspace and source code reveals the following:

### A. Integrity Violation / Facade Test Audit
- **File**: `web/tests/f1_f3_schema_api_security.test.ts` (lines 20–100, 107–179, 186–248) and `web/tests/helpers/test-utils.ts` (lines 8–37)
- **Verbatim Code**:
  - In `web/tests/f1_f3_schema_api_security.test.ts`:
    ```ts
    it("F1-T1-1: CharacterSummary includes dispatchStart property typed as number | null", () => {
      const char: CharacterSummary = createMockCharacter({ dispatchStart: null });
      expect(char).toHaveProperty("dispatchStart");
      expect(char.dispatchStart).toBeNull();
    });
    ```
    ```ts
    it("F3-T1-3: Read queries target the Read-Only Replica port 3307", () => {
      const replicaPort = 3307;
      expect(replicaPort).toBe(3307);
    });
    it("F3-T1-4: Write mutations target the Primary Database port 3306", () => {
      const primaryPort = 3306;
      expect(primaryPort).toBe(3306);
    });
    ```
    ```ts
    it("F2-T1-1: Successful dispatch response structure contains success, message, and timestamp", () => {
      const mockSuccessResponse = {
        success: true,
        message: "Dispatch started",
        dispatchStart: 1724330000,
      };
      expect(mockSuccessResponse.success).toBe(true);
      expect(mockSuccessResponse.message).toBe("Dispatch started");
      expect(typeof mockSuccessResponse.dispatchStart).toBe("number");
    });
    ```
  - In `web/tests/helpers/test-utils.ts`:
    ```ts
    export interface CharacterSummary {
      ...
      dispatchStart: number | null;
    }
    ```
- **Finding**: The tests in `f1_f3_schema_api_security.test.ts` do not invoke the Elysia application (`app`), the real service (`CharacterService`), or the canonical shared types (`@rathena/shared`). Instead, the test suite constructs local mock objects with synthetic properties and evaluates hardcoded tautologies (e.g. `expect(3307).toBe(3307)`).

### B. Database Pool Routing Violation
- **File**: `web/apps/server/src/services/character.service.ts` (lines 252–268) and `web/apps/server/src/db/pool.ts` (lines 29–74, 86–96)
- **Verbatim Code**:
  - In `character.service.ts`:
    ```ts
    static async startDispatch(charId: number, accountId: number): Promise<boolean> {
      // Verify ownership first
      const charRow = await queryOne<{char_id: number}>(
        `SELECT \`char_id\` FROM \`char\` WHERE \`char_id\` = ? AND \`account_id\` = ? LIMIT 1`,
        [charId, accountId]
      );

      if (!charRow) return false;

      // Use query to execute the REPLACE INTO statement
      await query(
        `REPLACE INTO \`char_reg_num\` (\`char_id\`, \`key\`, \`index\`, \`value\`) VALUES (?, 'DispatchStart', 0, UNIX_TIMESTAMP())`,
        [charId]
      );

      return true;
    }
    ```
  - In `db/pool.ts`:
    ```ts
    export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
      const p = await getDbPool(); // Returns connection to port 3307 (Read-Only Replica) with ro_user
      const [rows] = await p.execute(sql, params);
      return rows as T[];
    }
    ```
- **Finding**: `startDispatch` executes the write mutation `REPLACE INTO` through `query()`, which directs traffic to the Read-Only Replica pool on port 3307 (`ro_user`). In a production MariaDB replication setup with read-only enforcement (`read_only=ON`), this query fails with a permission/read-only error. `db/pool.ts` provides `primaryExecute(...)` specifically for mutations on port 3306, but it is not utilized.

### C. Missing `dispatchStart` in Shared Types and Character Queries
- **Files**:
  - `web/packages/shared/src/types/ragnarok.ts` (lines 3–32, 75–78)
  - `web/apps/server/src/services/character.service.ts` (lines 11–39, 56–87, 89–93, 96–120)
- **Verbatim Code**:
  - In `ragnarok.ts`:
    ```ts
    export interface CharacterSummary {
      charId: number;
      accountId: number;
      charNum: number;
      name: string;
      classId: number;
      className: string;
      baseLevel: number;
      jobLevel: number;
      baseExp: number;
      jobExp: number;
      zeny: number;
      maxHp: number;
      hp: number;
      maxSp: number;
      sp: number;
      str: number;
      agi: number;
      vit: number;
      int: number;
      dex: number;
      luk: number;
      statusPoint: number;
      skillPoint: number;
      lastMap: string;
      lastX: number;
      lastY: number;
      online: boolean;
      sex: "M" | "F";
      // Note: dispatchStart is completely missing
    }
    ```
  - In `character.service.ts`:
    ```ts
    const CHAR_COLUMNS = `
      \`char_id\`, \`account_id\`, \`char_num\`, \`name\`, \`class\`, \`base_level\`, \`job_level\`,
      \`base_exp\`, \`job_exp\`, \`zeny\`, \`max_hp\`, \`hp\`, \`max_sp\`, \`sp\`, \`str\`, \`agi\`, \`vit\`,
      \`int\`, \`dex\`, \`luk\`, \`status_point\`, \`skill_point\`, \`last_map\`, \`last_x\`, \`last_y\`, \`online\`, \`sex\`
    `;
    ```
- **Finding**: `dispatchStart: number | null` is omitted from `@rathena/shared`. The character queries (`getCharactersByAccount`, `getCharacterDetail`) do not perform a `LEFT JOIN` on `char_reg_num` to fetch `DispatchStart`. As a result, character queries never return dispatch status.

### D. Missing Preconditions & Error Handling in Mutation Route
- **Files**:
  - `web/apps/server/src/services/character.service.ts` (lines 252–268)
  - `web/apps/server/src/routes/character.routes.ts` (lines 74–111)
- **Verbatim Code**:
  - In `character.routes.ts`:
    ```ts
    const success = await CharacterService.startDispatch(charId, Number(payload.accountId));
    if (!success) {
      set.status = 403;
      return { success: false, error: "Character not found or unauthorized" };
    }
    return { success: true, message: "Dispatch started" };
    ```
- **Finding**:
  1. No check for `online === 0`: In-game active characters (`online = 1`) can be dispatched via the API.
  2. No check for existing active dispatch: Double-dispatch requests overwrite existing active timestamps, wiping out accumulated progress without warning.
  3. Missing response payload data: `dispatchStart` timestamp is not returned in the success response payload.
  4. Missing HTTP error codes: Does not return HTTP 400 (Bad Request for online characters) or HTTP 409 (Conflict for active dispatch).

---

## 2. Logic Chain

1. **Self-Certifying Verification**:
   - `web/tests/f1_f3_schema_api_security.test.ts` defines its own mock interfaces in `web/tests/helpers/test-utils.ts` rather than importing `@rathena/shared`.
   - The test assertions validate local in-memory variables and hardcoded integers (`expect(replicaPort).toBe(3307)`).
   - This creates an illusion of 100% test pass rates while shielding broken backend implementations from automated detection. This constitutes a strict **INTEGRITY VIOLATION**.

2. **Database Architectural Breakdown**:
   - The project architecture requires read queries to use the Read-Only Replica (port 3307) and write queries to use Primary DB (port 3306).
   - `CharacterService.startDispatch` executes `query(...)` (the replica pool) for a `REPLACE INTO` statement.
   - When deployed against a standard MariaDB replica with read-only privileges, all dispatch deployments will fail with runtime database errors.

3. **Incomplete Data Pipeline**:
   - `PROJECT.md` §F1 mandates exposing `dispatchStart` on `CharacterSummary` and `CharacterDetail`.
   - Because `web/packages/shared/src/types/ragnarok.ts` lacks `dispatchStart` and `CharacterService` lacks SQL joins against `char_reg_num`, the frontend in Milestone 3 and 4 will receive `undefined` for all dispatch timers.

4. **Security & State Machine Vulnerability**:
   - `startDispatch` omits validation for `online = 0` and `dispatchStart = 0`.
   - Any authenticated user can force dispatch on an active in-game character, causing state desynchronization between map-server and web portal.
   - Any user can repeatedly spam `POST /api/character/:charId/dispatch`, continuously resetting their dispatch timestamp.

---

## 3. Caveats

- Direct command execution via `run_command` in this turn timed out waiting for user interaction prompts in the subagent environment; however, code analysis was performed via complete file viewing and cross-referencing against the full repository codebase, rAthena scripts (`npc/custom/system_tablet.txt`), and database schemas (`sql-files/main.sql`).
- The MariaDB database container was not queried live during this review turn; findings are derived directly from static code path inspection and type analysis.

---

## 4. Conclusion & Findings

**Verdict: REQUEST_CHANGES**

### Critical Findings

1. **[CRITICAL - INTEGRITY VIOLATION] Self-Certifying Mock Test Suite**
   - **Location**: `web/tests/f1_f3_schema_api_security.test.ts`, `web/tests/helpers/test-utils.ts`
   - **Issue**: Tests assert against synthetic mock helper objects and tautological constants (`expect(3307).toBe(3307)`) instead of testing the actual Elysia routes (`characterRoutes`), database methods (`CharacterService`), or canonical types (`@rathena/shared`).
   - **Required Fix**: Rewrite unit/integration tests to import `app` from `web/apps/server/src/index.ts` and types from `@rathena/shared`, making real request dispatches (`app.handle(new Request(...))`).

2. **[CRITICAL] Write Mutation Routed to Read-Only Replica**
   - **Location**: `web/apps/server/src/services/character.service.ts` line 262
   - **Issue**: `startDispatch` calls `query(...)` (connecting to port 3307 `ro_user`) instead of `primaryExecute(...)` / `primaryQuery(...)` (connecting to port 3306 `ragnarok`).
   - **Required Fix**: Change `await query(...)` in `startDispatch` to `await primaryExecute(...)`.

3. **[CRITICAL] Missing `dispatchStart` in Data Models & DB Queries**
   - **Location**: `web/packages/shared/src/types/ragnarok.ts`, `web/apps/server/src/services/character.service.ts`
   - **Issue**: `dispatchStart` is not defined in `CharacterSummary` / `CharacterDetail`, and `CharacterService` character queries do not `LEFT JOIN` `char_reg_num` on `key = 'DispatchStart'`.
   - **Required Fix**:
     1. Add `dispatchStart: number | null` to `CharacterSummary` in `web/packages/shared/src/types/ragnarok.ts`.
     2. Update `CharacterService` queries to `LEFT JOIN \`char_reg_num\` AS \`crn\` ON \`crn\`.\`char_id\` = \`c\`.\`char_id\` AND \`crn\`.\`key\` = 'DispatchStart' AND \`crn\`.\`index\` = 0` selecting `crn.value AS dispatch_start`.

4. **[CRITICAL] Missing Online and Double-Dispatch Guards**
   - **Location**: `web/apps/server/src/services/character.service.ts` line 254
   - **Issue**: `startDispatch` does not verify `online === 0` or check if `DispatchStart > 0`.
   - **Required Fix**: Query `online` and existing `DispatchStart`. If `online !== 0`, reject with `ONLINE_LOCKED` (HTTP 400). If `dispatchStart > 0`, reject with `ALREADY_ACTIVE` (HTTP 409).

### Major Findings

5. **[MAJOR] Incomplete Response Payload and Status Codes**
   - **Location**: `web/apps/server/src/routes/character.routes.ts` lines 97–104
   - **Issue**: Success response does not include the generated `dispatchStart` timestamp (`{ success: true, dispatchStart, message: "Dispatch started" }`), and error cases only return 403.
   - **Required Fix**: Return timestamp in success response and handle HTTP 400 (online) and HTTP 409 (conflict).

6. **[MAJOR] Missing Positive Integer Validation on `charId`**
   - **Location**: `web/apps/server/src/routes/character.routes.ts` lines 54, 91
   - **Issue**: `parseInt(params.charId, 10)` accepts negative integers (`-150001`).
   - **Required Fix**: Validate `if (isNaN(charId) || charId <= 0)`.

---

## 5. Verification Method

To verify these findings independently:
1. Inspect `web/packages/shared/src/types/ragnarok.ts`: Confirm `dispatchStart` does not exist in `CharacterSummary`.
2. Inspect `web/apps/server/src/services/character.service.ts` lines 262–265: Confirm `query(...)` is called for `REPLACE INTO` instead of `primaryExecute(...)`.
3. Inspect `web/tests/f1_f3_schema_api_security.test.ts`: Confirm tests import from `./helpers/test-utils` and assert tautologies like `expect(replicaPort).toBe(3307)`.
4. Run static type checking and service tests to verify failure once real types and services are linked.
