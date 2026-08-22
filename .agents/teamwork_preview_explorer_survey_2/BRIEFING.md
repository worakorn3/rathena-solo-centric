# BRIEFING — 2026-08-22T08:16:16Z

## Mission
Conduct a read-only investigation and survey of the web backend in `web/server` (Elysia.js, database access, character endpoints, dispatch schema, types, SQL queries).

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: e:\Games\Ragnarok\rathena-solo-centric\.agents\teamwork_preview_explorer_survey_2
- Original parent: e31bf2cb-604d-454e-868d-dc519e02d817
- Milestone: explorer-survey-backend

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify source code files
- Abide by DB rules: Read queries go to replica on port 3307 / ro_user, write queries go to primary 3306 (or check exact setup)
- SQL escaping: wrap all rAthena table and column names in backticks
- File workspace discipline: write only to `.agents/teamwork_preview_explorer_survey_2/`

## Current Parent
- Conversation ID: e31bf2cb-604d-454e-868d-dc519e02d817
- Updated: 2026-08-22T08:18:50Z

## Investigation State
- **Explored paths**:
  - `web/apps/server/src/index.ts`
  - `web/apps/server/src/config.ts`
  - `web/apps/server/src/db/pool.ts`
  - `web/apps/server/src/routes/character.routes.ts`
  - `web/apps/server/src/services/character.service.ts`
  - `web/packages/shared/src/types/ragnarok.ts`
  - `npc/custom/system_tablet.txt`
  - `sql-files/main.sql`
- **Key findings**:
  - Database separation: Read queries must use `query`/`queryOne` on replica (3307); writes/mutations must use `primaryExecute` on primary (3306).
  - Bug in `CharacterService.startDispatch`: Currently calling `query` (replica 3307) instead of `primaryExecute` (primary 3306).
  - Missing field `dispatchStart` in `CharacterSummary` and SQL queries (`LEFT JOIN \`char_reg_num\``).
  - Validation guards needed in `startDispatch`: reject online characters (`char.online === 1`) to avoid map-server memory overwrites.
- **Unexplored areas**: None (survey complete).

## Key Decisions Made
- Fully documented backend survey in `findings.md` and `handoff.md`.

## Artifact Index
- `.agents/teamwork_preview_explorer_survey_2/DISPATCH.md` — Incoming dispatch log
- `.agents/teamwork_preview_explorer_survey_2/progress.md` — Progress tracker and heartbeat
- `.agents/teamwork_preview_explorer_survey_2/findings.md` — Comprehensive survey findings
- `.agents/teamwork_preview_explorer_survey_2/handoff.md` — 5-component handoff report

