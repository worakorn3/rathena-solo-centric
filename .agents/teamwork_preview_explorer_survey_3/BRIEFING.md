# BRIEFING — 2026-08-22T15:18:50+07:00

## Mission
Thoroughly survey rAthena scripts and SQL schemas in rathena-solo-centric for Dispatch / Offline Expeditions, variable names, 12h mathematical caps, Base/Job EXP and Zeny formulas, online check logic, claiming mechanics, and DB schemas.

## 🔒 My Identity
- Archetype: Teamwork explorer
- Roles: Game Mechanics & Script Survey (Explorer 3)
- Working directory: e:\Games\Ragnarok\rathena-solo-centric\.agents\teamwork_preview_explorer_survey_3
- Original parent: e31bf2cb-604d-454e-868d-dc519e02d817
- Milestone: Dispatch / Offline Expedition Script & Game Mechanics Survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify source code
- Adhere strictly to RATHENA_NPC_RULES.md, GEMINI.md, and MISTAKES_AND_LEARNINGS.md rules
- Communicate via send_message to parent (e31bf2cb-604d-454e-868d-dc519e02d817)

## Current Parent
- Conversation ID: e31bf2cb-604d-454e-868d-dc519e02d817
- Updated: 2026-08-22T15:18:50+07:00

## Investigation State
- **Explored paths**: `npc/custom/system_tablet.txt`, `sql-files/main.sql`, `web/apps/server/src/services/character.service.ts`, `web/apps/server/src/routes/character.routes.ts`, `web/packages/shared/src/types/ragnarok.ts`, `web/apps/client/src/components/character/`
- **Key findings**:
  1. Script: `npc/custom/system_tablet.txt` -> `System_Tablet_NPC` (Option 4: Dispatch Operations App).
  2. Storage: `DispatchStart` in `char_reg_num` table (`key = 'DispatchStart'`, `index = 0`, `value = unix_timestamp`).
  3. 12-Hour Cap: Capped at 720 minutes. Minimum duration to claim is 1 minute.
  4. Exact Yields:
     - Base EXP: `BaseLevel * 10 * elapsed_min` (Rate: `BaseLevel * 600 / hr`)
     - Job EXP: `BaseLevel * 5 * elapsed_min` (Rate: `BaseLevel * 300 / hr`)
     - Zeny: `BaseLevel * 2 * elapsed_min` (Rate: `BaseLevel * 120 / hr`)
  5. Claiming: Exclusively in-game via System Tablet (preserves map-server level-up events, stat points, and solo scaling recalculations).
  6. DB Architecture Audit: `CharacterService.startDispatch` currently calls `query` (replica 3307) instead of `primaryExecute` (primary 3306). Needs switching to `primaryExecute`.
- **Unexplored areas**: None. Script survey complete.

## Key Decisions Made
- Fully documented findings and generated structured `findings.md` and `handoff.md`.

## Artifact Index
- findings.md — Detailed game mechanics & script survey findings
- handoff.md — 5-component handoff report for Game Mechanics & Script Survey
- progress.md — Liveness heartbeat and status log
