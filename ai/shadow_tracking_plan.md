# Shadow Tracking: Core Architecture

> A persistence layer designed to silently record player milestones (kills, drops, etc.) into a custom SQL table to prevent variable bloat and prepare data for future features (Achievements, Monster Intel, Collection Logs).

**Related Plans:**
- [Main Implementation Plan](implementation_plan.md)

## Modular Features
The Shadow Tracking system is broken down into modular components. For detailed specifications, see the corresponding files:

1. **[Kill Tracking (Batched & Safe)](shadow_tracking/kill_tracking.md)**: Details the RAM-based O(1) accumulation and batched flushing strategy that prevents race conditions during AoE multi-kills, and the recovery logic for client and server crashes.
2. **[Loot Tracking](shadow_tracking/loot_tracking.md)**: Details how we record first-time item discoveries and rare item drops.
3. **[Economy Tracking](shadow_tracking/economy_tracking.md)**: Details the use of lightweight account variables for milestones like `#LifetimeZenyEarned`.

## Database Schema
To avoid bloating the `acc_reg_num` and `char_reg_num` tables (which slow down character loads/saves), we utilize a dedicated `solo_persistence_log` table.

See `sql-files/custom/solo_persistence_log.sql` for the `CREATE TABLE` schema.

## The Global Hook Script
The primary logic for handling events like `OnNPCKillEvent`, `OnPCLogoutEvent`, and `OnPCLoadMapEvent` resides in `npc/custom/shadow_tracking.txt`.

## Next Steps
Once this Phase 0 is complete, future phases (e.g., Achievement NPCs) can query `solo_persistence_log` for retroactive progression evaluation.
\
### Syntax Review

athena-npc-scripting\ skill guidelines.

**1. Tabs vs Spaces**
- **Status:** PASS
- **Details:** \
pc/custom/shadow_tracking.txt\ correctly utilizes literal tabs for the top-level script declaration.

**2. Variable Scoping**
- **Status:** PASS
- **Details:** 
    - Properly utilizes \@\ (temporary character variables) for multi-event session tracking.
    - Uses \.\@\ (local variables) for loop iterators and intermediate SQL values within \L_FlushKills\.
    - Correct use of \getd\/\setd\ for dynamic variable naming based on monster IDs.

**3. Semicolons & Termination**
- **Status:** PASS
- **Details:** 
    - All logic branches in \
eturn;\.
    - No missing semicolons detected in script or SQL files.

**4. SQL Standards & Security**
- **Status:** PASS (with minor observation)
- **Details:** 
    - \query_sql\ statements are injection-safe as all inputs are numeric types derived from script functions.
    - Schema in \solo_persistence_log.sql\ uses backticks for the \alue\ column, which avoids potential conflicts with SQL reserved words.
    - **Note:** The \query_sql\ in \L_FlushKills\ does not backtick column names, which is acceptable but could be improved for total consistency with the \OnInit\ schema declaration.

Conclusion: Both files are syntactically sound and follow rAthena scripting best practices.

### Logic & Performance Review

**1. Array Overflows**
- **Findings:** The `@dirty_kill_ids` array lacks an explicit bounds check. While the flush threshold is set to 100 kills (`@total_unflushed_kills >= 100`), a player could theoretically kill 100 *distinct* monster types before a flush occurs.
- **Risk:** Minimal. rAthena's default array limit is significantly higher than 100 (often 128 or 2M). However, for absolute safety and to prevent potential memory corruption in restricted environments, a safety cap is recommended.
- **Recommendation:** Add `if (@dirty_kill_count >= 127) callsub L_FlushKills;` before adding new IDs to `@dirty_kill_ids`.

**2. Timer RID Persistence**
- **Findings:** The script uses `initnpctimer`, which initializes a global NPC-level timer. In a multi-player environment, each login will reset this single timer for all players. Furthermore, `OnTimer` labels on global timers do not have a player attached, meaning `getcharid(3)` will return 0 and `@` scope variables will be inaccessible during the 5-minute flush.
- **Risk:** HIGH. The periodic 5-minute flush will likely fail to record data for players who do not logout or change maps frequently.
- **Recommendation:** Use `addtimer 300000, "ShadowTracker::OnTimer5Min";` on login and at the end of each flush to ensure a per-player reliable timer with RID attachment.

**3. Race Conditions**
- **Findings:** rAthena scripts execute single-threaded per map-server instance, making true race conditions impossible. Synchronous `query_sql` calls ensure that `L_FlushKills` completes before the next event is processed.
- **Risk:** NONE. The batching logic is safe for rapid multi-kills (AoE).

**4. Data Loss Scenarios**
- **Findings:** The "Threshold Flush" (100 kills) and "Event Flush" (Logout/Map Change) cover 95% of scenarios. The "Time Flush" (5 min) is the only weak point due to the timer issue mentioned above.
- **Risk:** LOW. Most data is preserved, but a server crash could lose up to 100 kills or 5 minutes of progress per player if the timer is not fixed.
- **Recommendation:** Fix the timer logic to ensure periodic background flushes.

