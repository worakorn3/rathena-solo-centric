# Empirical Challenger Validation Report — Milestone 1 (Backend Data Model & Dispatch API)

**Verdict**: `CHALLENGE_FAILED`

---

## 1. Observation

Direct code inspections of `web/apps/server/src/routes/character.routes.ts`, `web/apps/server/src/services/character.service.ts`, `web/apps/server/src/db/pool.ts`, and `web/packages/shared/src/types/ragnarok.ts` revealed several critical vulnerabilities, regressions, and unimplemented specifications:

### Observation 1: `dispatchStart` Missing from Data Models & Queries
- **File**: `web/packages/shared/src/types/ragnarok.ts` (lines 3–32, 75–78)
  - `CharacterSummary` and `CharacterDetail` omit `dispatchStart: number | null`.
- **File**: `web/apps/server/src/services/character.service.ts` (lines 56–87, 89–103, 105–114)
  - `mapCharRowToSummary` does not include `dispatchStart`.
  - `getCharactersByAccount` executes `SELECT ${CHAR_COLUMNS} FROM \`char\` WHERE \`account_id\` = ?` without querying `char_reg_num` for `DispatchStart`.
  - `getCharacterDetail` queries `char` and `inventory` only, never querying `char_reg_num` for `DispatchStart`.

### Observation 2: Missing Online Lock Check in `startDispatch`
- **File**: `web/apps/server/src/services/character.service.ts` (lines 252–260)
  ```ts
  static async startDispatch(charId: number, accountId: number): Promise<boolean> {
    // Verify ownership first
    const charRow = await queryOne<{char_id: number}>(
      `SELECT \`char_id\` FROM \`char\` WHERE \`char_id\` = ? AND \`account_id\` = ? LIMIT 1`,
      [charId, accountId]
    );

    if (!charRow) return false;
  ```
  - The query does not check `online = 0` or select `online` to verify that the character is offline. A character currently logged into the Ragnarok game server (`online = 1`) can initiate a dispatch, violating State A requirements.

### Observation 3: Missing Active Expedition Check & Progress Wipeout Bug
- **File**: `web/apps/server/src/services/character.service.ts` (lines 261–268)
  ```ts
    // Use query to execute the REPLACE INTO statement
    await query(
      `REPLACE INTO \`char_reg_num\` (\`char_id\`, \`key\`, \`index\`, \`value\`) VALUES (?, 'DispatchStart', 0, UNIX_TIMESTAMP())`,
      [charId]
    );

    return true;
  }
  ```
  - There is no check verifying `dispatchStart === null || dispatchStart === 0`.
  - If a character is already on an active expedition (e.g. dispatched 8 hours ago), calling `startDispatch` unconditionally overwrites `DispatchStart` with `UNIX_TIMESTAMP()`. This resets the timer to 0 and permanently deletes 8 hours of accumulated rewards and progress without returning HTTP 409/400.

### Observation 4: Database Routing Violation (Writes Targeted to Read-Only Replica)
- **File**: `web/apps/server/src/db/pool.ts` (lines 75–79, 86–96)
  - `query()` routes to `getDbPool()` on Port 3307 (MariaDB Read-Only Replica with `ro_user`).
  - `primaryExecute()` / `primaryQuery()` routes to `getPrimaryDbPool()` on Port 3306 (Primary DB with `ragnarok` user).
- **File**: `web/apps/server/src/services/character.service.ts` (line 262)
  - `startDispatch` executes `await query(...)` instead of `await primaryExecute(...)`.
  - Executing mutations on the read-only replica causes `ER_READ_ONLY_MODE` database exceptions in read-only setups and causes replication split-brain (primary game server never receives the dispatch start event).

### Observation 5: Missing Response Fields in `POST /api/character/:charId/dispatch`
- **File**: `web/apps/server/src/routes/character.routes.ts` (lines 104)
  - Returns `{ success: true, message: "Dispatch started" }`.
  - Omits `dispatchStart: number` timestamp required for optimistic frontend state synchronization.

---

## 2. Logic Chain

1. **Model Contract Failure**: `PROJECT.md` §Interface Contracts explicitly mandates `dispatchStart: number | null` in `CharacterSummary` and `CharacterDetail`. Because `@rathena/shared` and `CharacterService` omit this field, client components cannot inspect dispatch state from the API.
2. **Game Integrity & State Machine Failure**: `PROJECT.md` §Interface Contracts and `ORIGINAL_REQUEST.md` §R3 dictate that `POST /api/character/:charId/dispatch` requires preconditions `online === 0` and `dispatchStart === null || dispatchStart === 0`. Because `CharacterService.startDispatch` executes no validation on `online` or existing `DispatchStart`, active players can trigger dispatches while playing, and players on active dispatches will suffer accidental progress wipes.
3. **Database Architecture Violation**: `PROJECT.md` §Architecture and the mandatory rule `WEB_DB_REPLICA_PORT` require write operations to execute against the Primary DB (3306). Calling `query()` inside `startDispatch` routes write traffic to the Read-Only Replica (3307), which fails in production read-only replica configurations and does not propagate to the primary server.
4. **Conclusion Derivation**: The M1 backend deliverables fail 5 core contract and security checks, necessitating rejection and remediation by the Worker agent before proceeding.

---

## 3. Caveats

- Direct command execution via `run_command` in this non-interactive subagent environment is subject to host approval timeouts; all verification was conducted via rigorous code-level and schema trace analysis across all source files and test suites.
- Read queries in `char_reg_num` for single character vs character roster may require a batch `SELECT char_id, value FROM char_reg_num WHERE char_id IN (...) AND \`key\` = 'DispatchStart'` or subquery join to avoid N+1 queries when fetching account characters.

---

## 4. Conclusion

**Verdict: `CHALLENGE_FAILED`**

The implementation in Milestone 1 is rejected with the following mandatory remediation items for Worker M1:
1. **Add `dispatchStart: number | null`** to `CharacterSummary` and `CharacterDetail` in `web/packages/shared/src/types/ragnarok.ts`.
2. **Query `char_reg_num`** for `key = 'DispatchStart'` and index 0 in `CharacterService.getCharactersByAccount` and `CharacterService.getCharacterDetail`, mapping `value > 0 ? Number(value) : null` to `dispatchStart`.
3. **Add Precondition Checks in `startDispatch`**:
   - Verify character ownership AND `online == 0` (return 400/409 if online or not found).
   - Check if `DispatchStart` is already set and `> 0` (return 409 Conflict if active expedition exists).
4. **Fix DB Routing in `startDispatch`**:
   - Use `primaryExecute(...)` from `../db/pool` to execute `REPLACE INTO \`char_reg_num\` (\`char_id\`, \`key\`, \`index\`, \`value\`) VALUES (?, 'DispatchStart', 0, UNIX_TIMESTAMP())` on Primary DB (Port 3306).
5. **Return `dispatchStart`** in the success JSON payload of `POST /api/character/:charId/dispatch`: `{ success: true, dispatchStart: timestamp, message: "Dispatch started" }`.
6. **Add Unit & Integration Tests** in `web/apps/server/test/` validating these edge cases (non-existent char, online=1, existing dispatch, null vs 0 timestamp parsing, and primary DB pool execution).

---

## 5. Verification Method

1. Inspect `web/packages/shared/src/types/ragnarok.ts` to confirm `dispatchStart: number | null` is defined.
2. Inspect `web/apps/server/src/services/character.service.ts` to confirm:
   - `getCharactersByAccount` and `getCharacterDetail` include `dispatchStart` populated from `char_reg_num`.
   - `startDispatch` checks `online === 0` and checks for existing active dispatch (`DispatchStart > 0`).
   - `startDispatch` uses `primaryExecute` (Port 3306) rather than `query` (Port 3307).
3. Run `bun test` in `web/` to confirm all dispatch unit tests pass.
