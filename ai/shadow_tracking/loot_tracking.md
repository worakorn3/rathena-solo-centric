# Feature 2: Loot Tracking

> Tracks the acquisition of items (first-time discoveries, rare drops) to retroactively reward the player for Collection Logs.

**Related Plans:**
- [Main Shadow Tracking Architecture](../shadow_tracking_plan.md)

## Tracking Scope
Not all items are tracked in `solo_persistence_log`. Common items (like Jellopy or Empty Bottles) are generally excluded unless they are part of a specific "Collection Quest". Tracking every single item pickup would add immense overhead.

## Implementation Strategy
rAthena does not have a global script hook for item drops/pickups by default (unless customized in the source). Therefore, loot tracking will be implemented by hooking into:

1. **Specific NPC Quests:** When a player turns in or receives a rare item via a quest script.
2. **Collection Check NPCs:** When a player visits the "Collection Log" NPC, the NPC can scan their inventory/storage and insert records into `solo_persistence_log` for any rare items they possess that haven't been tracked yet.

Because of this, Loot Tracking is a passive, pull-based model (verified when needed) rather than a push-based model (verified on every item drop).
