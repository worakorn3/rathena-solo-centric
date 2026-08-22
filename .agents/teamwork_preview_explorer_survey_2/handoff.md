# Backend & API Survey Handoff Report

## 1. Observation

### 1.1 Server Structure and Entrypoint
- **Location:** `web/apps/server` (Bun + Elysia.js v1.x monorepo workspace with `web/apps/client` and `web/packages/shared`).
- **Entrypoint:** `web/apps/server/src/index.ts` lines 23-42:
  ```typescript
  export const app = new Elysia()
    .use(cors({ origin: true, credentials: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }))
    .get("/api/health", () => ({ status: "ok", replicaHost: config.db.host, replicaPort: config.db.port, timestamp: new Date().toISOString() }))
    .use(authRoutes)
    .use(economyRoutes)
    .use(characterRoutes)
    .use(trackingRoutes)
    .use(marketRoutes)
    .use(assetsRoutes);
  ```

### 1.2 Database Connections: Read Replica (3307) vs. Primary (3306)
- **Config:** `web/apps/server/src/config.ts` lines 1-24:
  - `config.db`: Target port 3307 (`ro_user` / `ro_password`), fallback credentials (`ragnarok` / `ragnarok`).
  - `config.primaryDb`: Target port 3306 (`ragnarok` / `ragnarok`).
- **Connection Pool Helpers:** `web/apps/server/src/db/pool.ts`:
  - `query<T>(sql, params)` (lines 75-79): Reads via `getDbPool()` on port 3307.
  - `queryOne<T>(sql, params)` (lines 81-84): Reads single row via `getDbPool()` on port 3307.
  - `primaryQuery<T>(sql, params)` (lines 86-90): Reads via `getPrimaryDbPool()` on port 3306.
  - `primaryExecute(sql, params)` (lines 92-96): Executes DML mutations via `getPrimaryDbPool()` on port 3306 returning `mysql.ResultSetHeader`.

### 1.3 Character Routes & Service Deficiencies
- **Character Routes:** `web/apps/server/src/routes/character.routes.ts`:
  - `GET /api/character/my-characters` (lines 13-30): Returns account characters using `CharacterService.getCharactersByAccount(accountId)`.
  - `GET /api/character/:charId` (lines 51-73): Returns character details using `CharacterService.getCharacterDetail(charId)`.
  - `POST /api/character/:charId/dispatch` (lines 74-111): Starts expedition using `CharacterService.startDispatch(charId, accountId)`.
- **Observed Deficiencies in `CharacterService` (`web/apps/server/src/services/character.service.ts`):**
  1. `CHAR_COLUMNS` (lines 89-93) and `mapCharRowToSummary` (lines 56-87) do not query or map `DispatchStart` from `char_reg_num`.
  2. `startDispatch` (lines 252-268) calls `await query(...)` instead of `await primaryExecute(...)`, attempting to execute `REPLACE INTO` on the Read-Only replica (port 3307).
  3. `startDispatch` does not check if the character is currently online (`char.online === 1`). In rAthena, map-server holds character registry in memory while online and flushes on logout, creating race conditions.
  4. `startDispatch` does not check if the character is already on an active dispatch.

### 1.4 In-Game Script Mechanics & Storage
- **Script:** `npc/custom/system_tablet.txt` lines 166-225 (Dispatch Operations):
  - Variable: `DispatchStart` in `char_reg_num` table (`key = 'DispatchStart'`, `index = 0`, `value = gettimetick(2)`).
  - Time calculation: `elapsed_sec = gettimetick(2) - DispatchStart`, `elapsed_min = elapsed_sec / 60` (capped at 720 min / 12 hours).
  - Minimum time: 1 minute.
  - Reward rates per minute:
    - Base EXP: `BaseLevel * 10 * elapsed_min`
    - Job EXP: `BaseLevel * 5 * elapsed_min`
    - Zeny: `BaseLevel * 2 * elapsed_min`
  - In-game Claim: Grants rewards via `getexp` and `Zeny += est_zeny;` and resets `DispatchStart = 0;`.

### 1.5 TypeScript Shared Types
- **Location:** `web/packages/shared/src/types/ragnarok.ts`:
  - `CharacterSummary` (lines 3-32): Contains character stats and `online: boolean`, but lacks `dispatchStart?: number;`.
  - `CharacterDetail` (lines 75-78): Inherits from `CharacterSummary` and adds `paperdoll` and `equippedItems`.

---

## 2. Logic Chain

1. **Database Routing Separation:**
   - *Observation:* `pool.ts` provides `query` on replica (port 3307) and `primaryExecute` on primary (port 3306).
   - *Logic:* Read queries (`getCharactersByAccount`, `getCharacterDetail`) must query the replica to avoid load on the game server. Any mutation (`startDispatch`) must use `primaryExecute` on primary DB (3306) to avoid read-only replica transaction failures.

2. **Schema & Variable Binding:**
   - *Observation:* `char_reg_num` has primary key `(char_id, key, index)`. Script sets `DispatchStart` at `index = 0`.
   - *Logic:* A `LEFT JOIN char_reg_num crn ON c.char_id = crn.char_id AND crn.key = 'DispatchStart' AND crn.index = 0` provides an $O(1)$ indexed lookup. `COALESCE(crn.value, 0)` guarantees a numerical timestamp (`0` when inactive).

3. **State Machine Validation:**
   - *Observation:* `char.online` is `1` when the player is connected in-game. `system_tablet.txt` executes `@kick` when dispatch is started in-game.
   - *Logic:* Web API cannot reliably issue `@kick` without packet injection, and writing to `char_reg_num` while online risks map-server memory overwrite on logout. Therefore, `startDispatch` must reject online characters (`char.online === 1`).

4. **Optimistic UI Synchronization:**
   - *Observation:* `StatusWindow.tsx` and `CharSelector.tsx` consume `CharacterSummary` and `CharacterDetail`.
   - *Logic:* Adding `dispatchStart?: number` to `CharacterSummary` allows both `CharSelector` (roster badge) and `StatusWindow` (active timer & 12h bar) to react immediately upon deployment or selection without extra round-trips.

---

## 3. Caveats

- **No Live Mutation Execution during Exploration:** Per Explorer read-only instructions, no code changes or DB writes were executed.
- **In-Game Claiming Exclusivity:** Dispatch rewards are designed to be claimed in-game via the System Tablet NPC (`npc/custom/system_tablet.txt`) because claiming modifies active inventory/exp/zeny that rAthena map-server governs. The Web Portal serves as the deployment, monitoring, and telemetry cockpit.
- **Clock Drift:** Client-side 1s tick counter calculates elapsed time relative to `dispatchStart` Unix epoch. Minor drift between client browser clock and DB server time is possible; clamping elapsed time to `Math.max(0, ...)` and capping at 12 hours (43,200s) prevents UI display anomalies.

---

## 4. Conclusion

The backend architecture is clean and well-structured, but requires 4 targeted alignments for full Dispatch functionality:
1. **Shared Types (`@rathena/shared`):** Add `dispatchStart?: number;` to `CharacterSummary` in `web/packages/shared/src/types/ragnarok.ts`.
2. **Character Service Queries (`web/apps/server`):** Update `getCharactersByAccount` and `getCharacterDetail` with `LEFT JOIN \`char_reg_num\`` to select `COALESCE(crn.\`value\`, 0) AS \`dispatch_start\``, and map to `dispatchStart: Number(row.dispatch_start) || 0`.
3. **Primary DB Mutation Routing:** In `CharacterService.startDispatch`, switch from `query` (replica 3307) to `primaryExecute` (primary 3306) using `REPLACE INTO \`char_reg_num\` (\`char_id\`, \`key\`, \`index\`, \`value\`) VALUES (?, 'DispatchStart', 0, UNIX_TIMESTAMP())`.
4. **Validation Guard:** Ensure `startDispatch` checks ownership, confirms `char.online === 0`, and confirms character is not already dispatched before executing the mutation.

---

## 5. Verification Method

To independently verify after implementation:
1. **TypeScript Build Verification:**
   ```powershell
   cd e:\Games\Ragnarok\rathena-solo-centric\web
   bun run build
   ```
   Ensures all shared types, server routes, and client components compile with zero type errors.
2. **Server Test Suite:**
   ```powershell
   cd e:\Games\Ragnarok\rathena-solo-centric\web\apps\server
   bun test
   ```
3. **Inspect DB Query Routing:**
   Verify `CharacterService.startDispatch` calls `primaryExecute` and `CharacterService.getCharactersByAccount` calls `query`.
