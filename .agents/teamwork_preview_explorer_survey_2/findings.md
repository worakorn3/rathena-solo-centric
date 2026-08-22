# Backend & API Survey Findings: Ragnarok Solo-Centric Dispatch System

## Executive Summary
This document details the backend architectural findings for the **Ragnarok Solo-Centric Web Portal** (Elysia.js + MariaDB / rAthena), specifically analyzing the character database query pathways, replica vs. primary routing, dispatch storage schema (`char_reg_num`), shared TypeScript models (`CharacterSummary`, `CharacterDetail`), and endpoint mutation dynamics for the Dispatch / Expedition feature.

---

## 1. Elysia.js Backend Architecture & Service Map

- **Runtime & Framework:** Bun runtime with Elysia.js v1.x (`web/apps/server`).
- **Server Entrypoint:** `web/apps/server/src/index.ts`
- **Route Modules:**
  - `characterRoutes` (`/api/character` in `web/apps/server/src/routes/character.routes.ts`)
  - `authRoutes` (`/api/auth` in `web/apps/server/src/routes/auth.routes.ts`)
  - `economyRoutes` (`/api/economy` in `web/apps/server/src/routes/economy.routes.ts`)
  - `marketRoutes` (`/api/economy/market` in `web/apps/server/src/routes/marketRoutes.ts`)
  - `trackingRoutes` (`/api/tracking` in `web/apps/server/src/routes/tracking.routes.ts`)
  - `assetsRoutes` (`/api/assets` in `web/apps/server/src/routes/assets.routes.ts`)

---

## 2. Database Connection Topology: Read Replica (3307) vs. Primary (3306)

File: `web/apps/server/src/db/pool.ts` and `web/apps/server/src/config.ts`

```
┌────────────────────────────────────────────────────────┐
│               Elysia.js Backend (Port 4000)            │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       SELECT Read Queries        Mutation Writes (INSERT / UPDATE)
                │                        │
                ▼                        ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│ Read-Only MariaDB Replica     │ │ Primary MariaDB Instance      │
│ Host: 127.0.0.1 : 3307        │ │ Host: 127.0.0.1 : 3306        │
│ User: ro_user                 │ │ User: ragnarok                │
│ Helpers: query(), queryOne()  │ │ Helpers: primaryExecute(),    │
│                               │ │          primaryQuery()       │
└───────────────────────────────┘ └───────────────────────────────┘
```

### Critical Database Mandates
1. **Read Queries:** Must strictly use `query<T>()` or `queryOne<T>()` targeting port 3307 (`ro_user`). This prevents CPU contention and table/row locking on the live game server.
2. **Write Queries / Mutations:** Must strictly use `primaryExecute()` or `primaryQuery()` targeting port 3306 (`ragnarok`).
3. **Current Bug Found in `CharacterService.startDispatch`:**
   - In `web/apps/server/src/services/character.service.ts` line 262, `startDispatch` currently calls `await query(...)` instead of `await primaryExecute(...)`. Because `query()` targets the read-only replica on 3307, write statements (`REPLACE INTO \`char_reg_num\``) will fail on a strict read-only replica.
   - **Fix:** Update `startDispatch` to invoke `primaryExecute`.

---

## 3. Dispatch Schema & rAthena Script Alignment

### Storage Schema: `char_reg_num`
- **Table Definition** (`sql-files/main.sql` line 302):
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
- **Key Name:** `'DispatchStart'` (binary string, exact case).
- **Index:** `0`.
- **Value:** Unix epoch timestamp in seconds (`UNIX_TIMESTAMP()` or `gettimetick(2)`). When inactive or claimed, `value = 0` or row is absent.

### In-Game Script Mechanics (`npc/custom/system_tablet.txt` lines 166–225)
- **Deployment:** `DispatchStart = gettimetick(2); atcommand "@kick " + strcharinfo(0);`
- **Time Elapsed:** `.@elapsed_min = (gettimetick(2) - DispatchStart) / 60;`
- **12-Hour Cap:** `if (.@elapsed_min > 720) .@elapsed_min = 720;`
- **Minimum Requirement:** 1 minute required before claiming.
- **Yield Calculation:**
  - Base EXP: `baseLevel * 10 * elapsed_min`
  - Job EXP: `baseLevel * 5 * elapsed_min`
  - Zeny: `baseLevel * 2 * elapsed_min`
- **Claiming / Cancellation:** `DispatchStart = 0;` (Claiming gives `getexp` and `Zeny += est_zeny`). In-game System Tablet option 4 is the designated claiming interface.

---

## 4. SQL Queries & Field Mappings

### SQL Keyword Escaping Rule
rAthena tables and columns contain SQL reserved keywords (`char`, `class`, `int`, `str`, `key`, `index`, `value`). All table and column names in SQL strings must be enclosed in backticks (` ` `).

### Optimized Character List Query with Dispatch Join
```sql
SELECT 
  c.`char_id`, c.`account_id`, c.`char_num`, c.`name`, c.`class`, c.`base_level`, c.`job_level`,
  c.`base_exp`, c.`job_exp`, c.`zeny`, c.`max_hp`, c.`hp`, c.`max_sp`, c.`sp`, c.`str`, c.`agi`, c.`vit`,
  c.`int`, c.`dex`, c.`luk`, c.`status_point`, c.`skill_point`, c.`last_map`, c.`last_x`, c.`last_y`, c.`online`, c.`sex`,
  COALESCE(crn.`value`, 0) AS `dispatch_start`
FROM `char` c
LEFT JOIN `char_reg_num` crn 
  ON c.`char_id` = crn.`char_id` AND crn.`key` = 'DispatchStart' AND crn.`index` = 0
WHERE c.`account_id` = ?
ORDER BY c.`char_num` ASC;
```

### Optimized Single Character Detail Query
```sql
SELECT 
  c.`char_id`, c.`account_id`, c.`char_num`, c.`name`, c.`class`, c.`base_level`, c.`job_level`,
  c.`base_exp`, c.`job_exp`, c.`zeny`, c.`max_hp`, c.`hp`, c.`max_sp`, c.`sp`, c.`str`, c.`agi`, c.`vit`,
  c.`int`, c.`dex`, c.`luk`, c.`status_point`, c.`skill_point`, c.`last_map`, c.`last_x`, c.`last_y`, c.`online`, c.`sex`,
  COALESCE(crn.`value`, 0) AS `dispatch_start`
FROM `char` c
LEFT JOIN `char_reg_num` crn 
  ON c.`char_id` = crn.`char_id` AND crn.`key` = 'DispatchStart' AND crn.`index` = 0
WHERE c.`char_id` = ?
LIMIT 1;
```

### Primary DB Mutation Query
```sql
REPLACE INTO `char_reg_num` (`char_id`, `key`, `index`, `value`)
VALUES (?, 'DispatchStart', 0, UNIX_TIMESTAMP());
```

---

## 5. TypeScript Shared Models & DTOs

### Location: `web/packages/shared/src/types/ragnarok.ts`

```typescript
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
  dispatchStart?: number; // Unix timestamp in seconds (0 = not dispatched)
}

export interface CharacterDetail extends CharacterSummary {
  paperdoll: PaperdollData;
  equippedItems: CharacterItem[];
}
```

---

## 6. Elysia.js Endpoints & Mutation Handling

### Existing Endpoints in `web/apps/server/src/routes/character.routes.ts`

1. **`GET /api/character/my-characters`**
   - Protected: Requires JWT Bearer header.
   - Calls `CharacterService.getCharactersByAccount(accountId)`.
   - Returns `{ success: true, characters: CharacterSummary[] }`.

2. **`GET /api/character/:charId`**
   - Public / Authenticated.
   - Calls `CharacterService.getCharacterDetail(charId)`.
   - Returns `{ success: true, character: CharacterDetail }`.

3. **`POST /api/character/:charId/dispatch`**
   - Protected: Requires JWT Bearer header.
   - Validates ownership (`char.account_id === payload.accountId`).
   - Validates offline status (`char.online === 0`). *Note: Starting dispatch while character is online must be rejected to prevent map-server memory override on logout.*
   - Validates that dispatch is not already active.
   - Executes `REPLACE INTO \`char_reg_num\`` via `primaryExecute()`.
   - Returns `{ success: true, message: "Dispatch started", dispatchStart: Math.floor(Date.now() / 1000) }`.

---

## 7. Optimistic State Updates & Client Synchronization

1. **Client Deployment Flow:**
   - User clicks "Deploy Expedition" in `StatusWindow`.
   - UI enters local `isMutating` state.
   - Client sends `POST /api/character/:charId/dispatch`.
   - On response (or immediately via optimistic state update):
     - `dispatchStart` is set to current timestamp.
     - `StatusWindow` transitions to **State C (Active Expedition)**.
     - `CharSelector` updates character badge/pill to indicate Active Expedition.
   - Live 1-second `setInterval` updates elapsed timer and calculated yield metrics (`baseExp`, `jobExp`, `zeny`).
2. **Error Recovery:**
   - If API call fails (e.g., unauthorized or character online), state rolls back and an error banner/toast is displayed.
