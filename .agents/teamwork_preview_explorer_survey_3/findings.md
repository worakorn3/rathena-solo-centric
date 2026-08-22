# Game Mechanics & Script Survey: Dispatch / Offline Expeditions

**Survey Date:** 2026-08-22
**Explorer:** Explorer 3 (Game Mechanics & Script Survey)
**Repository:** `rathena-solo-centric`

---

## 1. Executive Summary

This survey provides a comprehensive technical audit of the **Dispatch / Offline Expedition** mechanics in `rathena-solo-centric`, encompassing the rAthena NPC scripts (`npc/custom/system_tablet.txt`), MySQL database schemas (`char_reg_num`, `char`), mathematical yield formulas, mathematical caps (12h), online validation logic, and backend/frontend synchronization contracts.

---

## 2. In-Game Script Architecture

### 2.1 Script Location & Entry Point
- **Script File:** `npc/custom/system_tablet.txt`
- **Function:** `System_Tablet` (called when using the System Tablet item)
- **NPC Header:** `System_Tablet_NPC` (`-	script	System_Tablet_NPC	-1,{ ... }`)
- **Menu Entry:** Option 4: `Dispatch Operations App` in `select("Progression Guide:Monster Intel App:Market Pulse App:Dispatch Operations App:Cancel")`

### 2.2 Verbatim Script Code (`npc/custom/system_tablet.txt` lines 165–227)
```txt
		case 4:
			mes "[Dispatch Operations]";
			if (DispatchStart > 0) {
				.@elapsed_sec = gettimetick(2) - DispatchStart;
				.@elapsed_min = .@elapsed_sec / 60;
				if (.@elapsed_min > 720) .@elapsed_min = 720; // Cap at 12 hours
				
				mes "Your character is currently on a dispatch mission.";
				mes "Time Elapsed: ^0000FF" + (.@elapsed_min / 60) + "h " + (.@elapsed_min % 60) + "m^000000";
				
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
				
				// Calculate estimated rewards
				.@est_base = BaseLevel * 10 * .@elapsed_min;
				.@est_job = BaseLevel * 5 * .@elapsed_min;
				.@est_zeny = BaseLevel * 2 * .@elapsed_min;
				
				mes " ";
				mes "Estimated Rewards:";
				mes "- Base EXP: " + .@est_base;
				mes "- Job EXP: " + .@est_job;
				mes "- Zeny: " + .@est_zeny;
				next;
				
				switch(select("Complete Dispatch:Abort Dispatch:Cancel")) {
					case 1:
						mes "[Dispatch Operations]";
						mes "Mission complete! Rewards granted.";
						getexp .@est_base, .@est_job;
						Zeny += .@est_zeny;
						DispatchStart = 0;
						close;
					case 2:
						mes "[Dispatch Operations]";
						mes "Dispatch aborted. No rewards granted.";
						DispatchStart = 0;
						close;
					case 3:
						close;
				}
			} else {
				mes "You can dispatch your character to gather resources while offline.";
				mes "Rewards scale with your level and time elapsed (up to 12 hours).";
				mes "^FF0000Warning: Starting a dispatch will immediately log you out.^000000";
				next;
				if (select("Start Dispatch:Cancel") == 1) {
					DispatchStart = gettimetick(2);
					atcommand "@kick " + strcharinfo(0);
					end;
				}
				close;
			}
			break;
```

---

## 3. Database Schema & Variable Persistence

### 3.1 Variable Name and Scope
- **Variable Name:** `DispatchStart`
- **Scope:** Character Permanent Numerical Variable (unprefixed in rAthena script).
- **Storage Table:** `char_reg_num`

### 3.2 SQL Table Definitions

#### A. Table `char_reg_num` (`sql-files/main.sql` line 302)
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
- For active dispatches, `char_reg_num` contains:
  - `char_id`: Target character ID
  - `key`: `'DispatchStart'`
  - `index`: `0`
  - `value`: Unix epoch timestamp in seconds when the expedition commenced (e.g. `1755850000`).

#### B. Table `char` (`sql-files/main.sql` lines 240–296)
```sql
CREATE TABLE IF NOT EXISTS `char` (
  `char_id` int(11) unsigned NOT NULL auto_increment,
  `account_id` int(11) unsigned NOT NULL default '0',
  `char_num` tinyint(1) NOT NULL default '0',
  `name` varchar(30) NOT NULL default '',
  `class` smallint(6) unsigned NOT NULL default '0',
  `base_level` smallint(6) unsigned NOT NULL default '1',
  `job_level` smallint(6) unsigned NOT NULL default '1',
  `base_exp` bigint(20) unsigned NOT NULL default '0',
  `job_exp` bigint(20) unsigned NOT NULL default '0',
  `zeny` int(11) unsigned NOT NULL default '0',
  `online` tinyint(2) NOT NULL default '0',
  ...
  PRIMARY KEY (`char_id`),
  KEY `account_id` (`account_id`),
  KEY `online` (`online`)
) ENGINE=MyISAM;
```
- `online`: `0` = Offline, `1` = Online (logged in to map-server).

---

## 4. Mathematical Formulas & Constraints

### 4.1 Elapsed Time Logic
- **Elapsed Seconds:** $\Delta t_{\text{sec}} = t_{\text{now}} - \text{DispatchStart}$
- **Elapsed Minutes:** $M = \lfloor \Delta t_{\text{sec}} / 60 \rfloor$
- **12-Hour Hard Cap:** $M_{\text{capped}} = \min(M, 720)$ (where 720 minutes = 12 hours = 43,200 seconds)
- **Minimum Duration:** $M \ge 1$ (dispatches shorter than 1 minute cannot claim rewards, only abort).

### 4.2 Yield Calculation Formulas

| Yield Type | Rate Per Minute | Rate Per Hour (60 min) | Max Yield at 12h (720 min) | Formula |
|---|---|---|---|---|
| **Base EXP** | $\text{BaseLevel} \times 10$ | $\text{BaseLevel} \times 600$ | $\text{BaseLevel} \times 7,200$ | `BaseLevel * 10 * M` |
| **Job EXP** | $\text{BaseLevel} \times 5$ | $\text{BaseLevel} \times 300$ | $\text{BaseLevel} \times 3,600$ | `BaseLevel * 5 * M` |
| **Zeny** | $\text{BaseLevel} \times 2$ | $\text{BaseLevel} \times 120$ | $\text{BaseLevel} \times 1,440$ | `BaseLevel * 2 * M` |

*Note: All three yields scale purely off `BaseLevel` (not `JobLevel`).*

### 4.3 Exemplar Yield Values Across Level Brackets

| Level Bracket | Base EXP / hr | Job EXP / hr | Zeny / hr | 12h Max Base EXP | 12h Max Job EXP | 12h Max Zeny |
|---|---|---|---|---|---|---|
| **Novice / Lv. 10** | 6,000 | 3,000 | 1,200 z | 72,000 | 36,000 | 14,400 z |
| **1st Job / Lv. 30** | 18,000 | 9,000 | 3,600 z | 216,000 | 108,000 | 43,200 z |
| **2nd Job / Lv. 70** | 42,000 | 21,000 | 8,400 z | 504,000 | 252,000 | 100,800 z |
| **Transcendent / Lv. 99** | 59,400 | 29,700 | 11,880 z | 712,800 | 356,400 | 142,560 z |
| **3rd Job / Lv. 150** | 90,000 | 45,000 | 18,000 z | 1,080,000 | 540,000 | 216,000 z |
| **Max Cap / Lv. 200** | 120,000 | 60,000 | 24,000 z | 1,440,000 | 720,000 | 288,000 z |

---

## 5. Lifecycle & Claiming Mechanics

### 5.1 Deployment Lifecycle
1. **Initiation:**
   - In-game: via System Tablet -> kicks character immediately (`@kick`).
   - Web Portal: via `POST /api/character/:charId/dispatch` when character is offline (`online == 0`).
2. **Progression:**
   - Timestamp is recorded in `char_reg_num` (`key = 'DispatchStart'`).
   - Time ticks client-side and server-side up to 720 minutes (12 hours).
3. **Claiming (Strictly In-Game via System Tablet):**
   - Player logs into Ragnarok, uses **System Tablet**, opens **Dispatch Operations App**.
   - Player confirms "Complete Dispatch" -> rewards are awarded via `getexp` and `Zeny += ...`, and `DispatchStart` is cleared (`0`).
   - *Rationale:* In-game claim executes rAthena level-up and event triggers (`OnPCBaseLvUpEvent`, stat point calculations, skill unlocks, solo EXP boost scaling recalculations), preventing database state desync.

---

## 6. Architecture & Database Rules

### 6.1 Database Read/Write Segregation (Mandatory Rule)
- **Read Operations (`SELECT`):** Must query **Read-Only Replica** on port `3307` (`ro_user`).
  - `CharacterService.getCharactersByAccount`
  - `CharacterService.getCharacterDetail`
  - In `CharacterService`, `dispatchStart` should be loaded by joining or querying `char_reg_num` where `key = 'DispatchStart'`.
- **Write Operations (`INSERT`, `UPDATE`, `REPLACE`):** Must query **Primary DB** on port `3306` (`ragnarok` / `primaryPool`).
  - `CharacterService.startDispatch`:
    ```sql
    REPLACE INTO `char_reg_num` (`char_id`, `key`, `index`, `value`)
    VALUES (?, 'DispatchStart', 0, UNIX_TIMESTAMP())
    ```
  - *Audit Finding:* Currently `character.service.ts` line 262 incorrectly called `query(...)` (replica pool) instead of `primaryExecute(...)` / `getPrimaryDbPool()`.

---

## 7. Lore & Thematic Conventions

- **Affiliation / Lore:** **Eden Group Logistics / Solo Expedition Operations**
- **In-Game Interface:** **System Tablet (Dispatch Operations App)**
- **Copy Guidelines:**
  - *State A (Online):* *"Character currently logged into Ragnarok. Dispatches must be initiated while offline or via the System Tablet."*
  - *State B (Offline / Available):* *"Deploy character on an automated Eden Group Solo Expedition to gather EXP and Zeny while offline."*
  - *State C (Active Expedition):* *"Active Expedition in progress. Capped at 12 hours. Claim in-game via System Tablet."*
