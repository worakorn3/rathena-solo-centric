# Feature 3: Economy Tracking

> Tracks long-term macroeconomic milestones for the player (like Lifetime Zeny Earned, Total Junk Sold).

**Related Plans:**
- [Main Shadow Tracking Architecture](../shadow_tracking_plan.md)

## Tracking Scope
Unlike kills (which involve thousands of unique Mob IDs), economy tracking only requires tracking a handful of broad, single-value metrics per account. 

## Implementation Strategy
Because the data scope is small, we **avoid** using the `solo_persistence_log` SQL table for economy tracking. The overhead of a SQL query is unnecessary.

Instead, we use native rAthena permanent account variables (`#var`). These are fast, built-in, and perfectly suited for single integers:

- `#LifetimeZenyEarned`: Incremented whenever the player completes a profitable quest or sells items to specific high-value NPC traders (like the Junk Trader).
- `#TotalJunkSold`: Incremented via the Daily Junk Trader script.
- `#InvestmentBalance`: Managed directly by the Investment Bank NPC.

Using `#variables` keeps the implementation simple, script-only, and extremely fast for in-game displays. 

For long-term milestones (SQL persistence), the `F_RecordEconomy(type, value)` function in `npc/custom/shadow_tracking.txt` is used to persist these values to the `solo_persistence_log` table under the `ECONOMY` category.

