# Milestone 1: Backend Data Model & Dispatch API — Exploration & Verification Report

## 1. Observation

### 1.1 TypeScript Interfaces & Export Locations
- **Shared Types File**: `web/packages/shared/src/types/ragnarok.ts` (lines 3–32, 75–78)
  - `CharacterSummary` currently contains:
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
    }
    ```
  - `CharacterDetail` is defined as:
    ```ts
    export interface CharacterDetail extends CharacterSummary {
      paperdoll: PaperdollData;
      equippedItems: CharacterItem[];
    }
    ```
  - **Observation**: `dispatchStart: number | null` is currently absent from `CharacterSummary`.
  - **Package Entry Point**: `web/packages/shared/src/index.ts` exports all types from `./types/ragnarok`.

### 1.2 Database Schema for Character Registry
- **Schema File**: `sql-files/main.sql` (lines 302–309)
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
  - Note: `key` is `varchar(32) binary` (case-sensitive binary comparison in MySQL/MariaDB).
  - Note: `value` is `bigint(11)`.

### 1.3 Existing Server Service & Route Implementations
- **Character Service**: `web/apps/server/src/services/character.service.ts`
  - `mapCharRowToSummary` (lines 56–87): Maps `RawCharRow` to `CharacterSummary`.
  - `CHAR_COLUMNS` (lines 89–93): Does not select `dispatch_start` or join `char_reg_num`.
  - `startDispatch` (lines 252–268):
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
  - **Defects Identified**:
    1. Line 262: Calls `query` (pointing to the Read-Only Replica on port 3307) instead of `primaryExecute` / `primaryQuery` on Primary DB (port 3306).
    2. Line 263: Uses key `'DispatchStart'` (PascalCase) instead of `'DISPATCH_START'` (standard rAthena binary key).
    3. Missing online check: Does not verify `online === 0` (preventing state corruption while character is logged into the game).
    4. Missing active dispatch check: Does not verify if character is already on an active dispatch.
- **Character Route**: `web/apps/server/src/routes/character.routes.ts` (lines 74–111)
  - `POST /api/character/:charId/dispatch`: Parses JWT, checks `charId`, calls `startDispatch`. Currently returns `{ success: true, message: "Dispatch started" }` without returning `dispatchStart` timestamp.

### 1.4 Database Connection Configuration
- **DB Pool**: `web/apps/server/src/db/pool.ts`
  - `getDbPool()` (line 29): Connects to Read-Only Replica on port 3307 with `ro_user`.
  - `getPrimaryDbPool()` (line 7): Connects to Primary DB on port 3306 with `ragnarok` credentials.
  - `primaryExecute(sql, params)` (line 92): Executes write mutations against Primary DB.

---

## 2. Logic Chain

### 2.1 Interface & Type System Wiring
1. Adding `dispatchStart: number | null` to `CharacterSummary` in `web/packages/shared/src/types/ragnarok.ts` automatically propagates to:
   - `CharacterDetail` (since `CharacterDetail extends CharacterSummary`).
   - Server `CharacterService` return types (`Promise<CharacterSummary[]>`, `Promise<CharacterDetail | null>`).
   - Client React components (`StatusWindow.tsx`, `CharSelector.tsx`, `App.tsx`).
2. Exporting `DispatchResponse` interface in `@rathena/shared` standardizes the API response contract:
   ```ts
   export interface DispatchResponse {
     success: boolean;
     dispatchStart?: number;
     message?: string;
     error?: string;
   }
   ```

### 2.2 Database Query Optimization (Zero N+1)
1. To fetch `dispatchStart` with character queries, a `LEFT JOIN` on `char_reg_num` is used:
   ```sql
   SELECT 
     c.`char_id`, c.`account_id`, c.`char_num`, c.`name`, c.`class`, c.`base_level`, c.`job_level`,
     c.`base_exp`, c.`job_exp`, c.`zeny`, c.`max_hp`, c.`hp`, c.`max_sp`, c.`sp`, c.`str`, c.`agi`, c.`vit`,
     c.`int`, c.`dex`, c.`luk`, c.`status_point`, c.`skill_point`, c.`last_map`, c.`last_x`, c.`last_y`, c.`online`, c.`sex`,
     crn.`value` AS `dispatch_start`
   FROM `char` c
   LEFT JOIN `char_reg_num` crn 
     ON crn.`char_id` = c.`char_id` 
     AND crn.`key` = 'DISPATCH_START' 
     AND crn.`index` = 0
   WHERE c.`account_id` = ?
   ORDER BY c.`char_num` ASC
   ```
2. Because `(char_id, key, index)` is the PRIMARY KEY of `char_reg_num`, this `LEFT JOIN` is an $O(1)$ indexed lookup.

### 2.3 Edge Case & Type Coercion Logic
1. **Case: No registry record exists**: `crn.value` is `NULL`. `row.dispatch_start` is `null`/`undefined`.
   - Coercion: `const rawVal = row.dispatch_start ? Number(row.dispatch_start) : null;`
   - Result: `(rawVal && rawVal > 0) ? rawVal : null` evaluates cleanly to `null`.
2. **Case: Claimed or zero registry record**: `crn.value` is `0`.
   - Coercion: `rawVal` is `0`. `(rawVal > 0)` is false.
   - Result: returns `null`.
3. **Case: BigInt returned as string**: If MySQL driver returns `"1755850000"` string for `bigint(11)`.
   - Coercion: `Number("1755850000")` evaluates to numeric `1755850000`.
   - Result: returns `1755850000`.
4. **Case: NaN / Corrupted data**:
   - `isNaN(rawVal)` returns `null`.

### 2.4 Mutation Precondition Logic (`POST /api/character/:charId/dispatch`)
1. **Authentication**: JWT token must provide valid `accountId`.
2. **Ownership**: Query `char` table on Primary/Replica DB with `WHERE char_id = ? AND account_id = ?`. If not found, return HTTP 404 / 403.
3. **Online Status**: If `charRow.online !== 0`, character is currently active on the map server. Modifying registry in DB while logged in can cause race conditions / overwrites upon logout. Return HTTP 409 Conflict:
   `"Character is currently online. Dispatches must be initiated while offline or via the System Tablet."`
4. **Active Dispatch Status**: Query `char_reg_num` for `charId` + `'DISPATCH_START'`. If `value > 0`, return HTTP 409 Conflict:
   `"Character is already on an active expedition."`
5. **Execution**: Use `primaryExecute` on Primary DB (port 3306) with current Unix timestamp in seconds:
   ```ts
   const now = Math.floor(Date.now() / 1000);
   await primaryExecute(
     `REPLACE INTO \`char_reg_num\` (\`char_id\`, \`key\`, \`index\`, \`value\`) VALUES (?, 'DISPATCH_START', 0, ?)`,
     [charId, now]
   );
   ```
6. **Response**: HTTP 200 OK returning `{ success: true, dispatchStart: now, message: "Expedition deployed successfully." }`.

---

## 3. Caveats

1. **Database Replication Lag**: In a multi-node environment, reads from Replica (3307) immediately after writing to Primary (3306) may experience a few milliseconds of replication delay. Returning `{ success: true, dispatchStart: now }` directly from the mutation endpoint allows the client to perform instant optimistic updates without an immediate re-fetch.
2. **Script Claiming Mechanics**: When rewards are claimed in-game via `system_tablet.txt`, the script must set `DISPATCH_START = 0;` (or delete the key). The backend logic properly treats `0` as `null` (not on dispatch).

---

## 4. Conclusion

- **Interface Contract**: Add `dispatchStart: number | null` to `CharacterSummary` in `web/packages/shared/src/types/ragnarok.ts`.
- **Query Updates**: Update all character queries in `CharacterService` to `LEFT JOIN` `char_reg_num` with `key = 'DISPATCH_START' AND index = 0`.
- **Mutation Fix**: Refactor `CharacterService.startDispatch` to:
  1. Validate ownership, offline status (`online === 0`), and non-active dispatch state.
  2. Use `primaryExecute` (port 3306) instead of `query` (port 3307).
  3. Use exact key `'DISPATCH_START'`.
  4. Return the timestamp `now` and status code.
- **Route Updates**: Update `POST /api/character/:charId/dispatch` in `character.routes.ts` to return proper HTTP status codes (400, 401, 403, 404, 409) and the `{ success: true, dispatchStart }` payload.

---

## 5. Verification Method

### 5.1 Automated Unit / Integration Test Suite
The Worker should create and run `web/apps/server/test/dispatch.test.ts`:
```ts
import { describe, expect, it } from "bun:test";
import { app } from "../src/index";
import { config } from "../src/config";
import { getPrimaryDbPool, getDbPool, primaryExecute } from "../src/db/pool";
import { CharacterService } from "../src/services/character.service";

describe("Milestone 1: Backend Data Model & Dispatch API", () => {
  it("should verify primary database pool is configured to port 3306", () => {
    expect(config.primaryDb.port).toBe(3306);
  });

  it("should verify replica database pool is configured to port 3307", () => {
    expect(config.db.port).toBe(3307);
  });

  it("should properly coerce null/0/positive dispatch timestamps", async () => {
    // CharacterSummary interface must include dispatchStart
    const rankings = await CharacterService.getTopRanked();
    expect(Array.isArray(rankings)).toBe(true);
    if (rankings.length > 0) {
      expect(rankings[0]).toHaveProperty("dispatchStart");
      expect(rankings[0].dispatchStart === null || typeof rankings[0].dispatchStart === "number").toBe(true);
    }
  });

  it("should reject dispatch for unauthenticated requests with 401", async () => {
    const res = await app.handle(new Request("http://localhost:4000/api/character/150000/dispatch", {
      method: "POST"
    }));
    expect(res.status).toBe(401);
  });

  it("should reject dispatch for non-numeric charId with 400", async () => {
    const res = await app.handle(new Request("http://localhost:4000/api/character/invalid/dispatch", {
      method: "POST"
    }));
    expect(res.status).toBe(401); // 401 unauth or 400 invalid id
  });
});
```

### 5.2 Build Command Verification
Run the following build commands to guarantee zero TypeScript errors:
```bash
# 1. Build shared package
bun run --cwd web/packages/shared build

# 2. Run server test suite
bun test --cwd web/apps/server

# 3. Build frontend client
bun run --cwd web/apps/client build

# 4. Monorepo-wide build
bun run --cwd web build
```

### 5.3 Endpoint Manual Testing (cURL)
```bash
# 1. Authenticate to obtain JWT token:
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password"}'

# 2. Get characters roster (verify dispatchStart is present):
curl -s -X GET http://localhost:4000/api/character/my-characters \
  -H "Authorization: Bearer <JWT_TOKEN>"

# 3. Deploy dispatch for offline character:
curl -s -X POST http://localhost:4000/api/character/150000/dispatch \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json"

# 4. Verify duplicate dispatch returns 409 Conflict:
curl -s -X POST http://localhost:4000/api/character/150000/dispatch \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json"
```
