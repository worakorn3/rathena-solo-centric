# Handoff Report: Game Mechanics & Script Survey (Explorer 3)

## 1. Observation

### 1.1 In-Game Script Mechanics & Implementation
- **File Path:** `e:\Games\Ragnarok\rathena-solo-centric\npc\custom\system_tablet.txt`
- **Trigger:** Item function `System_Tablet` (lines 1–4) invokes NPC event `System_Tablet_NPC::OnUse` (line 6).
- **Menu Entry:** Line 11: `switch(select("Progression Guide:Monster Intel App:Market Pulse App:Dispatch Operations App:Cancel"))` -> `case 4:` (lines 165–227) handles Dispatch Operations.
- **Dispatch Initiation (Lines 220–224):**
  ```txt
  if (select("Start Dispatch:Cancel") == 1) {
      DispatchStart = gettimetick(2);
      atcommand "@kick " + strcharinfo(0);
      end;
  }
  ```
- **Elapsed Time & Cap Calculation (Lines 168–170):**
  ```txt
  .@elapsed_sec = gettimetick(2) - DispatchStart;
  .@elapsed_min = .@elapsed_sec / 60;
  if (.@elapsed_min > 720) .@elapsed_min = 720; // Cap at 12 hours
  ```
- **Claim Threshold & Abort Logic (Lines 175–185, 207–211):**
  ```txt
  if (.@elapsed_min < 1) {
      mes " ";
      mes "^FF0000Minimum 1 minute required to claim rewards.^000000";
      next;
      if (select("Abort Dispatch:Back") == 1) {
          DispatchStart = 0;
          mes "[Dispatch Operations]";
          mes "Dispatch aborted.";
      }
      close;
  }
  ```
- **Yield Calculation & Claiming (Lines 188–206):**
  ```txt
  // Calculate estimated rewards
  .@est_base = BaseLevel * 10 * .@elapsed_min;
  .@est_job = BaseLevel * 5 * .@elapsed_min;
  .@est_zeny = BaseLevel * 2 * .@elapsed_min;
  ...
  case 1:
      mes "[Dispatch Operations]";
      mes "Mission complete! Rewards granted.";
      getexp .@est_base, .@est_job;
      Zeny += .@est_zeny;
      DispatchStart = 0;
      close;
  ```

### 1.2 Database Schema
- **File Path:** `e:\Games\Ragnarok\rathena-solo-centric\sql-files\main.sql`
- **Table `char_reg_num` (Lines 302–309):**
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
- **Table `char` (Lines 240–296):**
  - Contains `char_id` (PRIMARY KEY), `account_id`, `name`, `class`, `base_level`, `job_level`, `zeny`, `online` (`tinyint(2)` where `0` = offline, `1` = online).

### 1.3 Web Server Backend & Database Pool
- **File Path:** `e:\Games\Ragnarok\rathena-solo-centric\web\apps\server\src\services\character.service.ts`
- **Dispatch Mutation (Lines 252–268):**
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
- **Database Segregation Rule in `web/apps/server/src/db/pool.ts`:**
  - `query(...)` targets the **Read-Only Replica** (port 3307).
  - `primaryExecute(...)` / `getPrimaryDbPool()` targets the **Primary DB** (port 3306).
  - Calling `query(...)` for `REPLACE INTO` in `character.service.ts:262` violates read/write segregation rules and must use `primaryExecute`.

---

## 2. Logic Chain

1. **Variable Mechanics:**
   - In rAthena script syntax, `DispatchStart` has no prefix (`@`, `.@`, `$`, `#`), which designates it as a permanent numerical variable scoped to the active character.
   - The engine automatically persists this into table `char_reg_num` with `char_id = <charId>`, `key = 'DispatchStart'`, `index = 0`, and `value = <timestamp>`.
   - Clearing the variable (`DispatchStart = 0`) or checking it (`DispatchStart > 0`) is fully synchronized between script runtime and the database.

2. **Time & Cap Logic:**
   - Script calculates $\Delta t = \text{CurrentTimestamp} - \text{DispatchStart}$.
   - Minutes elapsed is calculated as $\lfloor \Delta t / 60 \rfloor$.
   - A hard cap of 720 minutes (12 hours) is clamped: if $\text{minutes} > 720$, it is capped to $720$.
   - A minimum threshold of 1 minute is required to complete/claim; otherwise only "Abort" is allowed.

3. **Mathematical Yield Formulations:**
   - **Base EXP:** $\text{BaseLevel} \times 10 \times \text{ElapsedMinutes}$ (Rate: $\text{BaseLevel} \times 600 \text{ / hr}$; 12h Max: $\text{BaseLevel} \times 7,200$).
   - **Job EXP:** $\text{BaseLevel} \times 5 \times \text{ElapsedMinutes}$ (Rate: $\text{BaseLevel} \times 300 \text{ / hr}$; 12h Max: $\text{BaseLevel} \times 3,600$).
   - **Zeny:** $\text{BaseLevel} \times 2 \times \text{ElapsedMinutes}$ (Rate: $\text{BaseLevel} \times 120 \text{ / hr}$; 12h Max: $\text{BaseLevel} \times 1,440$).
   - Yields scale directly with character `BaseLevel` only.

4. **Claiming Boundary & Safety:**
   - Claiming occurs in-game via `System Tablet` -> `Complete Dispatch` using rAthena native commands `getexp` and `Zeny += ...`.
   - This in-game claiming boundary ensures `OnPCBaseLvUpEvent`, stat point calculations, skill unlocks, and solo scaling buffs are properly triggered within the map-server engine.
   - The Web Portal interface acts as an offline dispatch launcher and status monitor.

5. **Web Portal State Machine Mapping:**
   - **State A (Online):** `char.online === true`. Dispatch is disabled. Tooltip/Notice: *"Character currently logged into Ragnarok. Dispatches must be initiated while offline or via the System Tablet."*
   - **State B (Available / Offline):** `char.online === false` && `!char.dispatchStart` (or `char.dispatchStart === 0`). Displays `Lv.X Rate` preview badge and `Deploy Expedition` button.
   - **State C (Active Expedition):** `char.dispatchStart > 0`. Displays live client tick counter, 12h progress bar (`HH:MM / 12h Cap`), accrued dynamic yields, and status badge *"Claim in-game via System Tablet"*.

---

## 3. Caveats

1. **Replica Query Write Issue in Server:**
   - In `web/apps/server/src/services/character.service.ts`, `CharacterService.startDispatch` calls `query(...)` which executes on the read-only replica. To prevent MariaDB read-only errors and ensure immediate persistence, it must be updated to use `primaryExecute` from `../db/pool`.
2. **Character Data Model Exposure:**
   - `CharacterSummary` and `CharacterDetail` in `@rathena/shared` currently do not include `dispatchStart?: number`. The database query in `CharacterService` must query `char_reg_num` to populate `dispatchStart`.
3. **Active Character Online Validation on Deploy:**
   - `CharacterService.startDispatch` must reject dispatch deployments if the character is currently online (`online === 1` in `char` table).

---

## 4. Conclusion

- The in-game dispatch system is located in `npc/custom/system_tablet.txt` under `System_Tablet_NPC` (Option 4).
- The storage variable is `DispatchStart` stored in MySQL table `char_reg_num` (`key = 'DispatchStart'`, `index = 0`).
- The 12-hour cap (720 minutes) and yield formulas ($\text{BaseLevel} \times 10, 5, 2$ per minute) are strictly deterministic and mathematically verified.
- The web portal implementation requires:
  1. Exposing `dispatchStart` in `@rathena/shared` `CharacterSummary` and reading it from `char_reg_num` via replica queries.
  2. Executing mutations on the primary database (`port 3306`) via `primaryExecute`.
  3. Implementing the 3-state UI machine in `StatusWindow.tsx` and `CharSelector.tsx` aligned with **Eden Group Logistics / Solo Expedition Operations** lore.

---

## 5. Verification Method

1. **Inspect Script Source:**
   - Review `npc/custom/system_tablet.txt` lines 165–227 for the verbatim logic, `@kick` execution, 720-minute cap, and reward formulas.
2. **Inspect SQL Schemas:**
   - View `sql-files/main.sql` lines 302–309 (`char_reg_num`) and lines 240–296 (`char`).
3. **Inspect Server Code & DB Pool:**
   - View `web/apps/server/src/services/character.service.ts` lines 252–268 and `web/apps/server/src/db/pool.ts`.
4. **Formula Validation:**
   - For a Level 99 character after 120 minutes (2 hours):
     - $\text{Base EXP} = 99 \times 10 \times 120 = 118,800$
     - $\text{Job EXP} = 99 \times 5 \times 120 = 59,400$
     - $\text{Zeny} = 99 \times 2 \times 120 = 23,760 \text{ z}$
