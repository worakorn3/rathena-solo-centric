# MISTAKES & ACTIVE ACTION ITEMS (HOT TIER)
# Style: Ultra-terse, high-density, token-efficient (< 350 tokens).
# Loaded on every turn via PreInvocation hook. Cold archive stored in MISTAKES_ARCHIVE.md.

## Critical Invariants & Guardrails Matrix
| Frequency | Domain | Invariant / Rule | Executable Guardrail / Action Item |
| :--- | :--- | :--- | :--- |
| **HOT (4x)** | `NPC_SYNTAX` | Single literal `\t` between header tokens | Regex check: `^[^\t\r\n]+\t[^\t\r\n]+\t` (no spaces) |
| **HOT (4x)** | `NPC_SCOPE` | All temporary variables must use `.@` scope | Prefix all loop/calc vars with `.@` / `.@$`; never bare vars |
| **HOT (3x)** | `NPC_INVENTORY` | Protect every `getitem` with capacity check | Wrap with `if (!checkweight(id, amt)) { mes "..."; close; }` |
| **HOT (3x)** | `NPC_STATE` | Validate completely before mutating `#account_var` | Perform all `close;`/`end;` checks BEFORE modifying persistent state |
| **HOT (3x)** | `DB_MIGRATION` | Base rAthena SQL is immutable; custom files only | Schema DDL/DML strictly in `sql-files/custom/`; no DDL in OnInit |
| **HOT (3x)** | `DB_REPLICA` | Web portal read-only on 3307; writes on 3306 | Web reads query replica (3307); mutations use `primaryExecute` |
| **HOT (3x)** | `DOCKER_TEST` | Test map-server without interrupting live port | `docker run ... --map-config conf/map_test.conf` on port 5122 |
| **HOT (3x)** | `WIN_TOOLING` | Native AI tools only; avoid shell redirection | NEVER use `echo` / `>>` on Windows (UTF-16 bug); use built-in tools |
| **HOT (2x)** | `WORKFLOW` | Never blind edit; plan & test locally first | Require planning on complex/spec changes; test before declaring success |
| **HOT (1x)** | `NPC_PAGINATION` | Paginate all dynamic query loops & dialogues | Max 4-5 lines/page with `next;`; run `python tools/ci/lint_npc_dialogue.py` |
| **HOT (1x)** | `WEB_DEPLOY` | For every web change, always rebuild docker compose | Auto-run `docker compose ... up -d --build web-portal` on web edits |
| **HOT (1x)** | `CHART_DATA` | No unanchored synthetic history; integer price format | Never inject unanchored fake history into live DBs; configure integer priceFormat for Zeny |
| **HOT (1x)** | `UI_TOKEN_DRIFT` | Standardize on Bento tokens & modal ergonomics | All web dialogs must use `bento-card` shell, semantic tokens, and Esc/backdrop dismiss |
| **HOT (1x)** | `UI_DOMAIN_METADATA` | Distinguish domain IDs (keep) vs infra plumbing (scrub) | Keep Item/Mob/Map IDs for gameplay/wiki lookup; scrub `accountId`, DB ports (`:3307`), and engine cluster roles |
| **HOT (1x)** | `YAML_EXTRACTION` | Generate domain classifications from YAML at build-time | Parse `mob_db.yml` / `item_db.yml` in build scripts; NEVER hardcode numeric ID sets in TS/C++ |
| **HOT (1x)** | `DEAD_CODE_PRUNING` | Prune dead legacy calls instead of re-implementing bloat | When unmaintained `callfunc`/`callsub` fails after system migration, delete dead calls |
| **HOT (1x)** | `REACT_SCOPE_INTEGRITY` | Verify full component scope before chunk edits | Inspect all downstream variable access before replacing React component preamble |
| **HOT (1x)** | `FAULT_ISOLATION` | Wrap dynamic modals & widgets in Error Boundaries | Always isolate auxiliary dialogs/charts in `<ErrorBoundary>` to protect core viewport |

## Hot Caveman Log
- [2026-08-01] NPC_HEADER_TAB [FREQ: 4] | BAD: map-server crash `expected tab, found space` | WHY: space between header fields | FIX: single literal `\t` | RULE: strictly literal `\t` in NPC/warp/shop/monster headers
- [2026-08-01] VAR_SCOPE_LEAK [FREQ: 4] | BAD: `char_reg_num` DB bloat & player state bleed | WHY: unprefixed temp vars | FIX: prefix `.@` / `.@$` | RULE: all temp variables must use `.@` scope
- [2026-08-01] GETITEM_LOSS [FREQ: 3] | BAD: items lost on full inventory | WHY: `getitem` called without check | FIX: `if (!checkweight(id, amt)) { mes "..."; close; }` | RULE: always run `checkweight` before every `getitem`
- [2026-08-22] SCRIPT_STATE_CORRUPTION [FREQ: 3] | BAD: infinite interest duplication | WHY: `close;` after modifying `#var` but before timer reset | FIX: validate BEFORE modifying persistent vars | RULE: validate all abort conditions before writing persistent state
- [2026-08-22] SQL_MIGRATION_POLICY [FREQ: 3] | BAD: schema drift / upstream breaks | WHY: altering base SQL or DDL in OnInit | FIX: idempotent files in `sql-files/custom/` | RULE: base rAthena SQL is immutable; custom migrations only
- [2026-08-16] DOCKER_TEST_V2 [FREQ: 3] | BAD: test map-server port collision or downtime | WHY: test container port collision | FIX: pass temporary `conf/map_test.conf` overriding port to 5122 | RULE: test with temporary port override config
- [2026-08-22] POWERSHELL_ECHO_CORRUPTION [FREQ: 3] | BAD: UTF-16 file corruption | WHY: shell `>>` / `echo` redirection on Windows | FIX: AI-native file tools | RULE: NEVER use shell redirection to write files on Windows
- [2026-08-22] WORKFLOW_PLANNING [FREQ: 2] | BAD: unsolicited code edits without verification | WHY: assumed permission without plan/test | FIX: plan, confirm, test locally | RULE: explain approach first; test before finishing
- [2026-08-23] DOCKER_COMPOSE_WEB_REBUILD [FREQ: 1] | BAD: web changes not active in live container | WHY: forgot compose rebuild after web edit | FIX: docker compose up -d --build web-portal | RULE: always trigger compose rebuild after web changes
- [2026-08-23] DOCKERIGNORE_NESTED_NODE_MODULES [FREQ: 1] | BAD: ENOENT reading /app/apps/server/node_modules/elysia | WHY: .dockerignore had bare node_modules instead of **/node_modules; copied host Windows NTFS symlinks into Linux Alpine | FIX: use **/node_modules in .dockerignore | RULE: always use **/node_modules and **/dist in monorepo .dockerignore
- [2026-08-23] NPC_DIALOGUE_OVERFLOW [FREQ: 1] | BAD: dynamic tickers/items clipped off-screen | WHY: unpaginated mes loop exceeded 6-8 line RO dialog height | FIX: 4-5 items per page with next; | RULE: always paginate dynamic lists to 4-5 items per dialog page
- [2026-08-23] CHART_SYNTHETIC_CLIFF [FREQ: 1] | BAD: artificial price cliff & 24h fake history | WHY: synthetic seeder drifted from live DB price | FIX: organic live shifts only + custom integer priceFormat | RULE: never inject unanchored synthetic data into live time-series DBs
- [2026-08-23] UI_TOKEN_DRIFT [FREQ: 1] | BAD: orphaned skeuomorphic window with hardcoded hex colors & broken Esc/backdrop UX | WHY: bypassed Tailwind semantic tokens & modal interaction standards | FIX: refactored to bento-card with semantic tokens, Esc listener, and backdrop click | RULE: all web modals must use standard bento-card shell, semantic tokens, and Esc/backdrop dismiss
- [2026-08-23] UI_DOMAIN_METADATA [FREQ: 1] | BAD: conflating domain IDs (Item/Mob/Map) with plumbing leaks, or leaking accountId/replica ports | WHY: lack of clear taxonomy between gameplay wiki identifiers and infrastructure storage plumbing | FIX: keep Item/Mob/Map IDs; scrub accountId and :3307/MariaDB | RULE: preserve domain gameplay IDs for player lookups; strictly scrub auth IDs and database topology
- [2026-08-23] YAML_DOMAIN_EXTRACTION [FREQ: 1] | BAD: fragile hardcoded MVP_MOB_IDS / MINI_BOSS_IDS sets in services | WHY: build script only extracted names, discarding YAML flags | FIX: parse MobTypes from mob_db.yml at build time; delete hardcoded sets | RULE: always extract domain metadata/types from game YAMLs at build time instead of hardcoding ID sets
- [2026-08-24] REACT_SCOPE_INTEGRITY [FREQ: 1] | BAD: blank black screen when clicking ticker row | WHY: replaced file content accidentally stripped `profile`, `activeEvents`, `historicalEvents` derived variable declarations | FIX: restored `profile = MUNICIPAL_LORE[quote.ticker]`, `activeEvents`, and `historicalEvents` in `TickerDetailModal.tsx`; wrapped in `<ErrorBoundary>` | RULE: always verify full component scope variable declarations when performing partial file replacements in React components
- [2026-08-25] ADMIN_ROLE_GUARD [FREQ: 1] | BAD: standard player (`groupId: 0`) seeing admin management button | WHY: fallback to auto-seeded `localStorage` admin key in client | FIX: strictly require `user && user.groupId >= 1`; removed localStorage auto-seeding | RULE: never use client localStorage fallback to determine user role permissions
- [2026-08-25] DIVIDEND_ZERO_STUCK [FREQ: 1] | BAD: all active stock dividends stuck at 0z | WHY: marketMood===3 set dividend=0 in master table and split dividend/10 truncated integer | FIX: organic convergence to target yield without zero-wipes and post-split target recalculation | RULE: never zero out master stock table dividends on market mood; recalibrate yield on stock splits

*For historical 1-off debug logs and domain edge cases, see [MISTAKES_ARCHIVE.md](file:///E:/Games/Ragnarok/rathena-solo-centric/MISTAKES_ARCHIVE.md).*