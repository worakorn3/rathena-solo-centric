# Empirical Challenge Report — Milestone 1 (Backend Data Model & Dispatch API)

## Verdict
**`CHALLENGE_FAILED`** (Milestone 1 has critical backend defects and must NOT be approved until resolved).

---

## 1. Observation

### Observation 1.1: Replica DB Write Violation in `startDispatch`
In `web/apps/server/src/services/character.service.ts` lines 261-265:
```ts
261:     // Use query to execute the REPLACE INTO statement
262:     await query(
263:       `REPLACE INTO \`char_reg_num\` (\`char_id\`, \`key\`, \`index\`, \`value\`) VALUES (?, 'DispatchStart', 0, UNIX_TIMESTAMP())`,
264:       [charId]
265:     );
```
In `web/apps/server/src/db/pool.ts` lines 75-79:
```ts
75: export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
76:   const p = await getDbPool();
77:   const [rows] = await p.execute(sql, params);
78:   return rows as T[];
79: }
```
`getDbPool()` explicitly initializes a connection pool to the Read-Only Replica on port 3307 (`config.db.port = 3307`) with `ro_user`. `pool.ts` defines `primaryExecute` / `primaryQuery` for writes to primary DB (`config.primaryDb.port = 3306`), but `character.service.ts` calls `query()` instead.

### Observation 1.2: Missing `dispatchStart` in Shared Type Definitions
In `web/packages/shared/src/types/ragnarok.ts` lines 3-32:
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
`dispatchStart: number | null` is completely missing from `CharacterSummary` and `CharacterDetail`.

### Observation 1.3: Read Queries Omit `char_reg_num` Registry Data
In `web/apps/server/src/services/character.service.ts`:
- Line 89-93: `CHAR_COLUMNS` only selects columns from the `char` table:
```ts
const CHAR_COLUMNS = `
  \`char_id\`, \`account_id\`, \`char_num\`, \`name\`, \`class\`, \`base_level\`, \`job_level\`,
  \`base_exp\`, \`job_exp\`, \`zeny\`, \`max_hp\`, \`hp\`, \`max_sp\`, \`sp\`, \`str\`, \`agi\`, \`vit\`,
  \`int\`, \`dex\`, \`luk\`, \`status_point\`, \`skill_point\`, \`last_map\`, \`last_x\`, \`last_y\`, \`online\`, \`sex\`
`;
```
- Line 96-103 (`getCharactersByAccount`) and Line 105-114 (`getCharacterDetail`): neither function queries `char_reg_num` for `DispatchStart`.
- Line 56-87 (`mapCharRowToSummary`): does not map `dispatchStart`.

### Observation 1.4: Missing Online Status & Active Dispatch Precondition Validation
In `web/apps/server/src/services/character.service.ts` lines 252-260:
```ts
  static async startDispatch(charId: number, accountId: number): Promise<boolean> {
    // Verify ownership first
    const charRow = await queryOne<{char_id: number}>(
      `SELECT \`char_id\` FROM \`char\` WHERE \`char_id\` = ? AND \`account_id\` = ? LIMIT 1`,
      [charId, accountId]
    );

    if (!charRow) return false;
```
- It does NOT check `online` status (`charRow.online == 0`). Online players can trigger dispatches via web portal, violating Requirement R3 / State A.
- It does NOT check if `DispatchStart` is already active (> 0). Repeated or concurrent requests execute `REPLACE INTO`, overwriting `DispatchStart` with a new `UNIX_TIMESTAMP()`, wiping out the player's accumulated hours/yield.

### Observation 1.5: Missing `dispatchStart` in API Response Contract
In `web/apps/server/src/routes/character.routes.ts` lines 97-105:
```ts
      const success = await CharacterService.startDispatch(charId, Number(payload.accountId));
      
      if (!success) {
        set.status = 403;
        return { success: false, error: "Character not found or unauthorized" };
      }

      return { success: true, message: "Dispatch started" };
```
According to `PROJECT.md § Interface Contracts`, the endpoint must return `{ success: true, dispatchStart: number, message: string }`.

---

## 2. Logic Chain

1. **DB Routing Failure**: Executing `REPLACE INTO` through `query()` targets `getDbPool()` (port 3307, `ro_user`). In a replica configuration where `read_only = 1` or `ro_user` has only `SELECT` privileges, this query fails outright with `ER_OPTION_PREVENTS_STATEMENT`. In configurations where writes pass, it corrupts replica state by bypassing the primary replication source, desynchronizing the database.
2. **Missing Data in Models**: Because `CharacterSummary` lacks `dispatchStart` in `ragnarok.ts` and `getCharactersByAccount` / `getCharacterDetail` do not join or query `char_reg_num`, clients calling `GET /api/character/my-characters` or `GET /api/character/:charId` receive no dispatch timestamp. The frontend cannot determine if a character is on active dispatch (State C) or render the 12h progress bar.
3. **Exploit & State Corruption (Online Dispatch & Timer Reset)**:
   - A player logged into the game server (`online = 1`) can invoke `POST /api/character/:charId/dispatch`. Since `startDispatch` does not inspect `online`, the dispatch is initiated, violating game rule isolation.
   - If an active dispatch is in progress (e.g. 10 hours in), invoking `POST /api/character/:charId/dispatch` unconditionally overwrites `DispatchStart = UNIX_TIMESTAMP()`, resetting accumulated duration to 0 and destroying earned EXP/Zeny.
4. **Replication Lag & UI Sync**: Because the `POST` response returns only `{ success: true, message: "Dispatch started" }` without `dispatchStart`, the client is forced to issue a read query to the replica. Any replication lag between Primary (3306) and Replica (3307) will cause the immediate read query to return stale/null dispatch data, breaking optimistic UI updates.

---

## 3. Caveats
- No caveats regarding backend analysis. All code paths in `web/apps/server/src/routes/character.routes.ts`, `web/apps/server/src/services/character.service.ts`, `web/apps/server/src/db/pool.ts`, and `web/packages/shared/src/types/ragnarok.ts` were fully inspected against `PROJECT.md` and `npc/custom/system_tablet.txt`.

---

## 4. Conclusion
Milestone 1 is **INCOMPLETE AND NON-CONFORMANT** due to 5 critical defects:
1. Read-Only Replica write violation (calls `query()` instead of `primaryExecute()`).
2. Missing `dispatchStart` field in `CharacterSummary` / `CharacterDetail` shared types.
3. Missing database query / join for `DispatchStart` in `getCharactersByAccount` and `getCharacterDetail`.
4. Missing validation for `online === 0` and active dispatch check (`DispatchStart === 0 || DispatchStart === null`) in `startDispatch`.
5. Missing `dispatchStart` timestamp in `POST /api/character/:charId/dispatch` response payload.

**Verdict: `CHALLENGE_FAILED`**

---

## 5. Verification Method

### Step 1: Inspect Code Fixes in `web/`
1. `web/packages/shared/src/types/ragnarok.ts`: Verify `dispatchStart: number | null` is added to `CharacterSummary`.
2. `web/apps/server/src/services/character.service.ts`:
   - Verify `getCharactersByAccount` and `getCharacterDetail` include `LEFT JOIN \`char_reg_num\` AS \`crn\` ON \`crn\`.\`char_id\` = \`char\`.\`char_id\` AND \`crn\`.\`key\` = 'DispatchStart' AND \`crn\`.\`index\` = 0` and map `dispatchStart: row.dispatch_start ? Number(row.dispatch_start) : null`.
   - Verify `startDispatch` checks `online === 0` and `(crn.value IS NULL OR crn.value = 0)`.
   - Verify `startDispatch` calls `primaryExecute(...)` instead of `query(...)`.
3. `web/apps/server/src/routes/character.routes.ts`:
   - Verify `POST /api/character/:charId/dispatch` returns `{ success: true, dispatchStart: timestamp, message: "Dispatch started" }`.
   - Verify status codes 400 (online / already dispatched), 403 (unauthorized), 404 (not found).

### Step 2: Verification Queries & Unit Tests
Run automated test suite in `web/`:
```bash
bun test
```
Verify that tests assert primary DB write routing, replica DB read routing, online blocking, dispatch idempotency, and model schema integrity.
