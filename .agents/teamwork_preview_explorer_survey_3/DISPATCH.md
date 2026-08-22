## 2026-08-22T08:16:16Z
Task:
1. Thoroughly survey the rAthena scripts and SQL schemas in `e:\Games\Ragnarok\rathena-solo-centric`:
   - Inspect `npc/custom/solo_mechanics.txt`, `npc/custom/system_tablet.txt`, and any other dispatch/expedition/solo mechanics scripts.
   - Find how Dispatch / Offline Expeditions work in-game: variable names used (e.g., `#DISPATCH_START`, `DISPATCH_START`, `EXPEDITION_START`, `char_reg_num_db`, `acc_reg_num_db`), 12-hour cap, formulas for Base EXP, Job EXP, Zeny yields per level / time, online check logic, claiming mechanics via System Tablet.
   - Inspect `sql-files/` and database schemas for character registry and tables.
   - Document the exact yield formulas, mathematical caps (12h), variable keys, and lore/copy guidelines (Eden Group Logistics / Solo Expedition Operations).
2. Document all findings with file paths, code snippets, and exact formulas.
