# Task Breakdown: Pending Phase 1 & Phase 4

🔗 **Backlink:** [Main Implementation Plan](../implementation_plan.md)

This plan details the specific actionable tasks required to implement the remaining immediate needs (Phase 1) and the endgame systems (Phase 4), skipping the Support Class Viability as requested.

---

## 🚀 Phase 1: Core Mechanics & Solo QoL (Must-Nows)

### 1. Boss/Mob Tuning (Spawn Rates & Density)
*Goal: Ensure leveling maps feel populated and responsive for a single player without waiting for respawns.*
* **Task 1.1: Identify Target Maps:** Compile a list of critical early/mid-game leveling maps (e.g., `prt_fild08`, `pay_fild04`, `prt_sew01` to `prt_sew04`, `pay_dun00` to `pay_dun02`).
* **Task 1.2: Override Mob Spawns:** Instead of modifying core rAthena files, create a new custom script (`npc/custom/solo_mob_spawns.txt`) that uses `killmonsterall` and spawns custom densities, OR write a python/node script to batch-modify the vanilla `npc/pre-re/mobs/` files to increase counts by 30-50%.
* **Task 1.3: Adjust Respawn Timers:** Reduce normal mob respawn delays by ~30% (e.g., changing 5000ms to 3000ms) across the identified maps. 
* **Task 1.4: Validation:** Log in and visit Culvert/Payon Dungeon to verify that 3-5 mobs are consistently visible on screen.

### 2. Dual-Client Policy
*Goal: Allow the player to seamlessly log in with a main and a support/alt character.*
* **Task 2.1: Update Login Config:** Modify `conf/login_athena.conf` (or `subnet_athena.conf` depending on rAthena version) to ensure `client_limit` or `allow_multiple_logins` is set to allow 2 connections per IP.
* **Task 2.2: Update Char Config (Optional):** Verify `conf/char_athena.conf` doesn't restrict multiple IPs if applicable.

### 3. Refine Safety Nets - ✅ [DONE]
*Goal: Keep the thrill of refining but prevent catastrophic regression/breaking for solo players who can't rely on a massive economy to replace gear.*
* **Task 3.1: Custom Refiner NPC:** ✅ Implemented in `npc/custom/refine_safety.txt` as "Refine Insurer" (`prt_in,65,60`).
* **Task 3.2: Blacksmith Blessing Service:** ✅ Implemented sale of Blacksmith Blessings (`item_id: 6635`) at 500,000 Zeny each with `checkweight` safety to enable safe refinement up to +12.

---

## 🏆 Phase 4: Mastery & Endgame (Future Roadmap)

### 1. Instance Scaling
*Goal: Make endgame MVP instances mathematically viable for 1-3 players.*
* **Task 1.1: Scaled Mob DB:** Clone essential MVP entries in `db/mob_db.yml` (e.g., Baphomet_Solo, Baphomet_Duo) with 30% and 60% of their original HP/Damage.
* **Task 1.2: Instance Wrapper Scripts:** Modify instance entry NPCs to check `getpartysize()`.
* **Task 1.3: Dynamic Spawning:** Based on the party size, spawn the corresponding scaled MVP ID inside the instance.

### 2. Mastery System (Post-Max Level Growth) - [POSTPONED]
*Recommendation: I strongly agree with postponing this. Since you aren't familiar with the new 4th class endgame (which already introduces Trait Stats like POW/SPL and levels up to 250), adding a custom Mastery system on top of it right now could overcomplicate things. It's better to experience the vanilla 4th class progression first and implement this later if you still feel a lack of progression.*
* **Task 2.1:** (Postponed) Re-evaluate the need for a custom mastery progression after reaching level 200+ naturally.

### 3. Collection Log & Global Enhancements
*Goal: Give completionists a reason to hunt every item in a zone.*
* **Task 3.1: Define Zone Pools:** ✅ Implemented for Prontera Region in `npc/custom/collection_log.txt` (Jellopy, Fluff, Clover, Feather, Sticky Mucus).
* **Task 3.2: Tracking Script:** ✅ Implemented bitmask registration (`#COLLECT_PRT_FIELD`), reward claiming (`#REWARD_PRT_FIELD`), and test NPC in `npc/custom/collection_log.txt`.
* **Task 3.3: Web-Assignable Pools:** ⏳ [PENDING] Migrate hardcoded Junk Trader/Collector item arrays to dynamic SQL tables (`solo_junk_pools`, `solo_rewards`) for future Web Admin panel curation.

### 4. Stock Exchange SQL Migration
*Goal: Move the existing economic tracking to a persistent database.*
* **Task 4.1: Schema Creation:** Create `solo_stock_market` and `solo_stock_history` tables in the RO database.
* **Task 4.2: Script Refactor:** Update the Market Pulse / Stock Exchange NPCs to use `query_sql` for reading prices and logging momentum, replacing volatile server variables (`$`).

### 5. Achievement Tiers & Reputation Factions
*Goal: Long-term daily engagement.*
* **Task 5.1: Custom Achievements:** Add new, solo-specific repeatable achievements to `db/achievement_db.yml` (e.g., "Slay 10,000 Undead").
* **Task 5.2: Faction Variables:** Design 2-3 NPC factions. Create Daily Quest NPCs that increment player variables (e.g., `#Morroc_Reputation`).
* **Task 5.3: Quartermaster Shops:** Create shops that only display certain items/gear if the player's reputation variable meets the threshold.

### 6. Challenge Modes (Roguelike Runs) - [POSTPONED]
*Recommendation: Postponed to keep the initial endgame scope manageable and focused on core progression and collection systems.*
* **Task 6.1:** (Postponed) Design and implement the instanced dungeon generator and modifier system at a later date.