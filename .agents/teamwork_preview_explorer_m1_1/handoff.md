# Milestone 1: Backend Data Model & Dispatch API Exploration Report

## 1. Observation

### Codebase Layout & File Paths
- **Backend Server Root**: `e:\Games\Ragnarok\rathena-solo-centric\web\apps\server`
  - Routes: `src/routes/character.routes.ts` (lines 1-112)
  - Services: `src/services/character.service.ts` (lines 1-270)
  - Database Pool: `src/db/pool.ts` (lines 1-97)
  - Configuration: `src/config.ts` (lines 1-30)
- **Shared Monorepo Types**: `e:\Games\Ragnarok\rathena-solo-centric\web\packages\shared`
  - Types: `src/types/ragnarok.ts` (lines 1-79)
  - Index: `src/index.ts`
- **Database Architecture**:
  - Read Queries Pool: `pool.ts` -> `getDbPool()`, `query()`, `queryOne()`. Uses `config.db.port` (`3307`, user: `ro_user`, db: `ragnarok`).
  - Write Queries Pool: `pool.ts` -> `getPrimaryDbPool()`, `primaryExecute()`, `primaryQuery()`. Uses `config.primaryDb.port` (`3306`, user: `ragnarok`, db: `ragnarok`).

### Existing Code Observations
1. **`web/packages/shared/src/types/ragnarok.ts`**:
   - `CharacterSummary` (lines 3-32) currently defines:
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
   - `dispatchStart` is currently missing from `CharacterSummary`.
   - `CharacterDetail` (lines 75-78) extends `CharacterSummary`, so adding `dispatchStart: number | null;` to `CharacterSummary` automatically exposes it in `CharacterDetail`.

2. **`web/apps/server/src/services/character.service.ts`**:
   - `RawCharRow` (lines 11-39) does not include a dispatch field.
   - `mapCharRowToSummary` (lines 56-87) maps raw DB rows to `CharacterSummary` without `dispatchStart`.
   - `CHAR_COLUMNS` (lines 89-93) queries only columns from the `` `char` `` table:
     ```ts
     const CHAR_COLUMNS = `
       \`char_id\`, \`account_id\`, \`char_num\`, \`name\`, \`class\`, \`base_level\`, \`job_level\`,
       \`base_exp\`, \`job_exp\`, \`zeny\`, \`max_hp\`, \`hp\`, \`max_sp\`, \`sp\`, \`str\`, \`agi\`, \`vit\`,
       \`int\`, \`dex\`, \`luk\`, \`status_point\`, \`skill_point\`, \`last_map\`, \`last_x\`, \`last_y\`, \`online\`, \`sex\`
     `;
     ```
   - `CharacterService.startDispatch` (lines 252-268):
     - Uses `query(...)` (Read-only replica!) instead of `primaryExecute(...)` for `REPLACE INTO`.
     - Lacks check for character `online === 1` status.
     - Lacks check for existing active dispatch (`dispatchStart > 0`).
     - Uses `DispatchStart` string in `char_reg_num` instead of standard `DISPATCH_START` key on primary DB.

3. **`web/apps/server/src/routes/character.routes.ts`**:
   - `POST /api/character/:charId/dispatch` (lines 74-111) handles JWT auth and `charId` parsing, but returns a generic boolean response without distinct error statuses (e.g. 400 for online character, 409 for already active expedition) and does not return `dispatchStart` in the success payload.

---

## 2. Logic Chain

1. **Database Schema & SQL Safety**:
   - Following `WEB_DB_REPLICA_PORT` and `SQL_RESERVED_WORDS` guardrails:
     - All character read queries (`getCharactersByAccount`, `getCharacterDetail`, `searchPublicArmory`, `getTopRanked`) must query the Read Replica via `query()` / `queryOne()`.
     - All SQL reserved words and table names must be enclosed in backticks: `` `c`.`char_id` ``, `` `c`.`online` ``, `` `c`.`int` ``, `` `c`.`class` ``, `` `d`.`key` ``, `` `d`.`type` ``, `` `d`.`index` ``, `` `d`.`val` ``.
     - Querying `dispatchStart` requires a `LEFT JOIN` on `` `char_reg_num_db` `` where `` `key` = 'DISPATCH_START' ``, `` `type` = 3 ``, and `` `index` = 0 ``.

2. **Column Aliasing & Mapping**:
   - When joining `` `char` AS `c` `` with `` `char_reg_num_db` AS `d` ``, the column `` `d`.`val` AS `dispatch_start` `` will be returned as `row.dispatch_start`.
   - If `row.dispatch_start` is missing, `null`, `0`, or `undefined`, `mapCharRowToSummary` must map `dispatchStart` to `null`. If a positive integer timestamp is present, it must map to `Number(row.dispatch_start)`.

3. **Dispatch Mutation Preconditions & Protocol**:
   - `POST /api/character/:charId/dispatch` requires:
     - Precondition 1: Ownership check (`account_id` matches JWT payload). If mismatch or non-existent -> 403 Forbidden.
     - Precondition 2: Online check (`` `online` === 1 ``). If online -> 400 Bad Request (`"Character currently logged into Ragnarok. Dispatches must be initiated while offline or via the System Tablet."`).
     - Precondition 3: Already active check (`dispatchStart > 0`). If already dispatched -> 409 Conflict (`"Character is already on an active expedition."`).
     - Mutation: Write to Primary DB (port 3306) via `primaryExecute`:
       ```sql
       INSERT INTO `char_reg_num_db` (`char_id`, `key`, `index`, `type`, `val`)
       VALUES (?, 'DISPATCH_START', 0, 3, UNIX_TIMESTAMP())
       ON DUPLICATE KEY UPDATE `val` = UNIX_TIMESTAMP()
       ```
     - Response: 200 OK with `{ success: true, dispatchStart: <unix_ts>, message: "Character deployed on solo expedition." }`.

---

## 3. Caveats

1. **Schema Compatibility**: Standard rAthena schemas use table `` `char_reg_num` `` (`char_id`, `key`, `index`, `value`), whereas enhanced/custom schemas use `` `char_reg_num_db` `` (`char_id`, `key`, `index`, `type`, `val`). To ensure compatibility across both schema variants, queries should target `` `char_reg_num_db` `` with alias `d` and `d.val` as specified in the project requirements.
2. **Read-After-Write Replication Delay**: After a dispatch write to Primary DB (port 3306), the API mutation immediately returns the timestamp in the response body (`dispatchStart: now`), allowing the frontend to perform optimistic state transitions without waiting for replica replication lag.

---

## 4. Conclusion & Implementation Blueprint for Worker

### Blueprint Step 1: Update Shared Types (`web/packages/shared/src/types/ragnarok.ts`)
Add `dispatchStart: number | null;` to `CharacterSummary`:
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
  dispatchStart: number | null; // unix timestamp in seconds or null
}
```

### Blueprint Step 2: Update Character Service (`web/apps/server/src/services/character.service.ts`)
1. Update `RawCharRow` and `mapCharRowToSummary`:
```ts
interface RawCharRow {
  char_id: number;
  account_id: number;
  char_num: number;
  name: string;
  class: number;
  base_level: number;
  job_level: number;
  base_exp: number;
  job_exp: number;
  zeny: number;
  max_hp: number;
  hp: number;
  max_sp: number;
  sp: number;
  str: number;
  agi: number;
  vit: number;
  int: number;
  dex: number;
  luk: number;
  status_point: number;
  skill_point: number;
  last_map: string;
  last_x: number;
  last_y: number;
  online: number;
  sex: "M" | "F";
  dispatch_start?: number | null;
}

function mapCharRowToSummary(row: RawCharRow): CharacterSummary {
  const rawTs = row.dispatch_start != null ? Number(row.dispatch_start) : null;
  const dispatchStart = rawTs && rawTs > 0 ? rawTs : null;

  return {
    charId: row.char_id,
    accountId: row.account_id,
    charNum: row.char_num,
    name: row.name,
    classId: row.class,
    className: getJobName(row.class),
    baseLevel: row.base_level,
    jobLevel: row.job_level,
    baseExp: Number(row.base_exp) || 0,
    jobExp: Number(row.job_exp) || 0,
    zeny: Number(row.zeny) || 0,
    maxHp: row.max_hp,
    hp: row.hp,
    maxSp: row.max_sp,
    sp: row.sp,
    str: row.str,
    agi: row.agi,
    vit: row.vit,
    int: row.int,
    dex: row.dex,
    luk: row.luk,
    statusPoint: row.status_point,
    skillPoint: row.skill_point,
    lastMap: row.last_map,
    lastX: row.last_x,
    lastY: row.last_y,
    online: Boolean(row.online),
    sex: row.sex || "M",
    dispatchStart,
  };
}

const CHAR_SELECT_COLUMNS = `
  \`c\`.\`char_id\`, \`c\`.\`account_id\`, \`c\`.\`char_num\`, \`c\`.\`name\`, \`c\`.\`class\`, \`c\`.\`base_level\`, \`c\`.\`job_level\`,
  \`c\`.\`base_exp\`, \`c\`.\`job_exp\`, \`c\`.\`zeny\`, \`c\`.\`max_hp\`, \`c\`.\`hp\`, \`c\`.\`max_sp\`, \`c\`.\`sp\`, \`c\`.\`str\`, \`c\`.\`agi\`, \`c\`.\`vit\`,
  \`c\`.\`int\`, \`c\`.\`dex\`, \`c\`.\`luk\`, \`c\`.\`status_point\`, \`c\`.\`skill_point\`, \`c\`.\`last_map\`, \`c\`.\`last_x\`, \`c\`.\`last_y\`, \`c\`.\`online\`, \`c\`.\`sex\`,
  \`d\`.\`val\` AS \`dispatch_start\`
`;

const CHAR_DISPATCH_JOIN = `
  LEFT JOIN \`char_reg_num_db\` AS \`d\`
    ON \`d\`.\`char_id\` = \`c\`.\`char_id\`
   AND \`d\`.\`key\` = 'DISPATCH_START'
   AND \`d\`.\`type\` = 3
   AND \`d\`.\`index\` = 0
`;
```

2. Update Read Queries:
```ts
static async getCharactersByAccount(accountId: number): Promise<CharacterSummary[]> {
  const rows = await query<RawCharRow>(
    `SELECT ${CHAR_SELECT_COLUMNS}
     FROM \`char\` AS \`c\`
     ${CHAR_DISPATCH_JOIN}
     WHERE \`c\`.\`account_id\` = ?
     ORDER BY \`c\`.\`char_num\` ASC`,
    [accountId]
  );
  return rows.map(mapCharRowToSummary);
}

static async getCharacterDetail(charId: number): Promise<CharacterDetail | null> {
  const charRow = await queryOne<RawCharRow>(
    `SELECT ${CHAR_SELECT_COLUMNS}
     FROM \`char\` AS \`c\`
     ${CHAR_DISPATCH_JOIN}
     WHERE \`c\`.\`char_id\` = ?
     LIMIT 1`,
    [charId]
  );

  if (!charRow) return null;
  const summary = mapCharRowToSummary(charRow);
  // ... inventory & paperdoll mapping unchanged
  return {
    ...summary,
    paperdoll,
    equippedItems,
  };
}

static async searchPublicArmory(searchQuery: string): Promise<CharacterSummary[]> {
  const q = `%${searchQuery.trim()}%`;
  const rows = await query<RawCharRow>(
    `SELECT ${CHAR_SELECT_COLUMNS}
     FROM \`char\` AS \`c\`
     ${CHAR_DISPATCH_JOIN}
     WHERE \`c\`.\`name\` LIKE ?
     ORDER BY \`c\`.\`base_level\` DESC, \`c\`.\`zeny\` DESC
     LIMIT 20`,
    [q]
  );
  return rows.map(mapCharRowToSummary);
}

static async getTopRanked(): Promise<CharacterSummary[]> {
  const rows = await query<RawCharRow>(
    `SELECT ${CHAR_SELECT_COLUMNS}
     FROM \`char\` AS \`c\`
     ${CHAR_DISPATCH_JOIN}
     ORDER BY \`c\`.\`base_level\` DESC, \`c\`.\`base_exp\` DESC, \`c\`.\`zeny\` DESC
     LIMIT 10`
  );
  return rows.map(mapCharRowToSummary);
}
```

3. Update `startDispatch` Mutation Method:
```ts
static async startDispatch(
  charId: number,
  accountId: number
): Promise<{ success: boolean; status: number; error?: string; dispatchStart?: number }> {
  // 1. Ownership & online status verification (from replica or primary)
  const charRow = await queryOne<{ char_id: number; online: number }>(
    `SELECT \`char_id\`, \`online\` FROM \`char\` WHERE \`char_id\` = ? AND \`account_id\` = ? LIMIT 1`,
    [charId, accountId]
  );

  if (!charRow) {
    return { success: false, status: 403, error: "Character not found or unauthorized" };
  }

  if (charRow.online) {
    return {
      success: false,
      status: 400,
      error: "Character currently logged into Ragnarok. Dispatches must be initiated while offline or via the System Tablet.",
    };
  }

  // 2. Existing active expedition check
  const regRow = await queryOne<{ val: number }>(
    `SELECT \`val\` FROM \`char_reg_num_db\` WHERE \`char_id\` = ? AND \`key\` = 'DISPATCH_START' AND \`type\` = 3 AND \`index\` = 0 LIMIT 1`,
    [charId]
  );

  if (regRow && Number(regRow.val) > 0) {
    return {
      success: false,
      status: 409,
      error: "Character is already on an active expedition.",
    };
  }

  // 3. Write mutation to Primary DB (port 3306)
  const now = Math.floor(Date.now() / 1000);
  await primaryExecute(
    `INSERT INTO \`char_reg_num_db\` (\`char_id\`, \`key\`,\`index\`, \`type\`, \`val\`)
     VALUES (?, 'DISPATCH_START', 0, 3, ?)
     ON DUPLICATE KEY UPDATE \`val\` = ?`,
    [charId, now, now]
  );

  return {
    success: true,
    status: 200,
    dispatchStart: now,
  };
}
```

### Blueprint Step 3: Update Endpoint Handler (`web/apps/server/src/routes/character.routes.ts`)
```ts
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
    if (isNaN(charId)) {
      set.status = 400;
      return { success: false, error: "Invalid character ID" };
    }

    const result = await CharacterService.startDispatch(charId, Number(payload.accountId));

    if (!result.success) {
      set.status = result.status;
      return { success: false, error: result.error };
    }

    return {
      success: true,
      dispatchStart: result.dispatchStart,
      message: "Character deployed on solo expedition.",
    };
  },
  {
    params: t.Object({
      charId: t.String(),
    }),
  }
)
```

---

## 5. Verification Method

### Test Execution Commands
1. **Type Checking & Build**:
   ```bash
   cd web
   bun run build
   ```
   *Expected result*: Build completes cleanly with zero TypeScript errors across packages `shared`, `server`, and `client`.

2. **Unit / Integration Tests**:
   ```bash
   cd web/apps/server
   bun test
   ```
   *Expected result*: All tests pass, validating replica connection on port 3307 and character ranking queries.

3. **API Validation Checkpoints**:
   - `GET /api/character/my-characters`: Each item contains `dispatchStart: number | null`.
   - `GET /api/character/:charId`: Detailed character contains `dispatchStart: number | null`.
   - `POST /api/character/:charId/dispatch`:
     - When online: returns HTTP 400 (`"Character currently logged into Ragnarok..."`).
     - When already active: returns HTTP 409 (`"Character is already on an active expedition."`).
     - When offline and valid: returns HTTP 200 (`{ success: true, dispatchStart: <timestamp>, message: "Character deployed on solo expedition." }`).
