# Feature 1: Kill Tracking (Batched & Safe)

> Safely tracks every monster killed by the player, buffering the data to prevent database lag during AoE attacks.

**Related Plans:**
- [Main Shadow Tracking Architecture](../shadow_tracking_plan.md)

## The Problem
When a player uses a large AoE skill (like Storm Gust) and kills 15 monsters in the exact same millisecond, triggering 15 immediate `query_sql` statements creates race conditions and spikes database load.

## The Solution: Batched RAM Flushing
Instead of writing to the DB on every kill, we increment temporary character variables (`@kill_count_<mobid>`), which live in the server's RAM and have an O(1) access time.

We also maintain an array of "dirty" mob IDs (`@dirty_kill_ids`) so we know exactly which counters need flushing without iterating through every possible mob ID.

### The Flushing Triggers
To ensure data isn't lost during crashes:
1. **`OnPCLogoutEvent`**: Triggers on a normal logout, or when the server times out a disconnected/crashed client. Flushes all dirty counters to the DB.
2. **`OnPCLoadMapEvent`**: Triggers whenever a player warps or changes maps. A convenient and frequent natural flush point.
3. **Threshold Flush**: We track `@total_unflushed_kills`. If this reaches 100, we force an immediate background flush. This guarantees that even if the Map Server crashes completely, a player loses a maximum of 99 kills.

## Implementation Script
The logic for this is contained within `npc/custom/shadow_tracking.txt`.
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

