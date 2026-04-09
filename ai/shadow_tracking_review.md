# Adversarial Review: Shadow Tracking Persistence Layer

This review evaluates the recent changes to the Shadow Tracking system (`npc/custom/shadow_tracking.txt` and `npc/custom/junk_trader.txt`) against the established architecture and existing `KILL` tracking patterns.

**Related Plans & Architecture:**
- [Shadow Tracking Main Plan](../ai/shadow_tracking_plan.md)
- [Kill Tracking Architecture](../ai/shadow_tracking/kill_tracking.md)
- [Loot Tracking Architecture](../ai/shadow_tracking/loot_tracking.md)
- [Economy Tracking Architecture](../ai/shadow_tracking/economy_tracking.md)

---

## 🔍 Findings & Comparison

### 1. Batching vs. Immediate Execution
| Category | Implementation | Performance Impact | Risk Level |
|----------|----------------|--------------------|------------|
| **KILL** | **Batched**: Uses `#dirty_kill_count` and `#kill_count_ID` variables to store up to 127 unique mob IDs before flushing to SQL. | **Low**: Minimal DB overhead during active combat/AoE. | Low |
| **LOOT** | **Immediate**: `F_TrackLoot` calls `query_sql` on every invocation. | **High**: If called in a loop (e.g., during a full inventory scan by a Collection Log NPC), it could lag the map server. | Medium |
| **ECONOMY**| **Immediate**: `F_RecordEconomy` calls `query_sql` on every invocation. | **Low**: Generally triggered by single-item sales or quest completions (low frequency). | Low |

**Reviewer Note:** `F_TrackLoot` should ideally support batching if it's intended to be used for mass-discovery scans. For single-item quest rewards, it is acceptable as-is.

### 2. Triggers and Event Hooks
The `ShadowTracker` script (FAKE_NPC) flushes kills on:
- `OnForceFlush` (from `SoloKillWatcher` when dirty count >= 127)
- `OnPCLogoutEvent`
- `OnPCDieEvent`
- `OnPCStatCalcEvent`
- `OnTimerFlush` (every 5 minutes)

**Potential Hallucination/Bug:**
- **`OnPCStatCalcEvent` Overhead:** This event triggers frequently (gear swaps, buffs, status changes). Flushing the entire kill buffer every time a player swaps a ring or receives an Agility Up is excessive and may cause unnecessary DB writes even if no kills were made (though the script checks `#dirty_kill_count == 0`).

### 3. Variable Scoping Consistency
All categories use `#` (Permanent Account) variables:
- `KILL`: `#kill_count_MOBID`, `#dirty_kill_count`, `#dirty_kill_id_X`
- `ECONOMY`: `#TotalJunkSold`, `#LifetimeZenyEarned`
- `LOOT`: Currently no `#var` caching for Loot; it relies entirely on the SQL table.

**Consistency Check:** The use of `#` variables is correct for the "Solo-Centric" theme, ensuring progress is tracked across all characters on the account.

### 4. Logic & Implementation Anomalies
- **`F_TrackLoot` Value:** Increments by `1` each time. This is consistent with "discovery count".
- **`F_RecordEconomy` Types:** Uses magic numbers (`1` for Junk Sold, `2` for Zeny Earned). These should be documented or replaced with constants in `db/const.yml` for clarity.
- **`L_FlushKills` Loop:** The loop uses `#dirty_kill_count`. If `ShadowTracker` is ever shared by multiple maps or if concurrency becomes an issue, this indexing could potentially be corrupted (unlikely in a standard single-mapserver rAthena setup).

---

## 🛠️ Recommended Corrections

1. **Optimize `OnPCStatCalcEvent`**: Move the flush logic to `OnPCLoadMapEvent` or rely on the 5-minute timer and logout hooks to reduce DB pressure.
2. **Batching for `F_TrackLoot`**: If a Collection Log NPC is added, ensure it uses a batched insert rather than calling `F_TrackLoot` in a loop.
3. **Constants for Economy**: Define `ST_ECONOMY_JUNKSOLD` and `ST_ECONOMY_ZENY` in a constant file to avoid magic numbers.

---

**Backlinks:**
- [implementation_plan.md](../ai/implementation_plan.md)
- [Shadow Tracker Script](../npc/custom/shadow_tracking.txt)
