# Gemini CLI Context: rathena-solo-centric

## Project Overview
**rathena-solo-centric** is a customized fork of the [rAthena](https://github.com/rathena/rathena) MMORPG server emulator, specifically tailored for a solo-player experience. It is written in C++17 and utilizes MySQL or MariaDB for data storage.

### Core Technologies
- **Language:** C++17
- **Build System:** CMake (preferred), GNU Make, or MS Visual Studio 2017+
- **Database:** MySQL 5.7+ / MariaDB 10.1+
- **Scripting:** rAthena Scripting Language (.txt and .yml)

### Architecture
The project consists of several interconnected servers:
- **Login Server:** Handles account authentication.
- **Char Server:** Manages character data and selection.
- **Map Server:** Handles game logic, NPCs, and combat.
- **Web Server:** Provides web-based APIs and actively handles the Midgard Stock Exchange background market simulation (Elysia.js).

---

## Detailed Rules & Documentation
To save AI context window tokens, detailed specifications have been extracted. Read these files when working on their respective domains:

- **[Solo Features](file:///E:/Games/Ragnarok/rathena-solo-centric/ai/SOLO_FEATURES.md):** Details on EXP scaling, auto-heal, system tablet, and QoL changes.
- **[Build & Run Instructions](file:///E:/Games/Ragnarok/rathena-solo-centric/ai/BUILD_AND_RUN.md):** How to compile and run the emulator (Windows/Linux/Docker).
- **[Database Conventions](file:///E:/Games/Ragnarok/rathena-solo-centric/ai/DATABASE_RULES.md):** Rules for SQL immutability and custom migrations.
- **[Scripting Rules](file:///E:/Games/Ragnarok/rathena-solo-centric/RATHENA_NPC_RULES.md):** **MANDATORY** rules for writing NPC scripts (Tabs, Variables, Weight checks).
- **[Testing & CI](file:///E:/Games/Ragnarok/rathena-solo-centric/ai/TESTING_AND_CI.md):** Instructions for automated script testing via Docker and CI boundaries.
- **Web Rebuild Rule:** **MANDATORY** - Always rebuild and restart the Docker Compose container (`docker compose -f tools/docker/docker-compose.yml up -d --build --no-deps web-portal`) whenever making ANY changes to the web frontend or backend.
- **Coding Style:** Follow existing rAthena C++ conventions. Use `ShowError`/`ShowInfo`. Prefer `.yml` for new DB entries.

---

## Mistake Analysis & Prevention Protocol (Hot/Cold Tiering)

### 1. Knowledge Hierarchy & Memory Architecture
- **Tier 1 (Universal Invariants):** Follow the mandates in `RATHENA_NPC_RULES.md` in every session.
- **Tier 2 (Domain Skills & Rules):** Reference domain-specific docs linked above.
- **Tier 3 (HOT Memory - Native Invariants Matrix below):** Evaluated in-memory on every turn. Strict capacity ceiling of <= 10 domain rows.
- **Tier 4 (COLD Memory - `MISTAKES_ARCHIVE.md`):** Historical 1-off edge-case learnings. Search via `grep_search` during debugging.

### 2. Hot Tier Invariants Matrix (< 350 tokens)
<!-- HARD CEILING: Max 10 domain rows. Merge or retire when adding new domains. -->
| Frequency | Aggregate Domain | Core Invariants & Sub-Rules | Executable Prevention Guardrail / Action Item |
| :--- | :--- | :--- | :--- |
| **CRITICAL (23x)** | `NPC_ENGINE_SAFETY` | Syntax, scoping, inventory, state, pagination & encoding | Literal `\t` headers; prefix all temp vars with `.@`; `if (!checkweight(id, amt)) close;`; validate before `#var` writes; paginate 4-5 lines with `next;`; zero UTF-8 emojis (ASCII only); wrap batch loops in `freeloop(1/0)` |
| **CRITICAL (16x)** | `CONTAINER_TOOLING` | Docker testing, Windows tooling, compose & monorepos | Test map-server via Docker on port 5122 (`conf/map_test.conf`); native AI file tools only (NO `>>`/`echo` on Windows); run `docker compose up -d --build --no-deps <svc>`; use `**/node_modules` in `.dockerignore` |
| **HIGH (12x)** | `DB_ARCHITECTURE` | Split replica/primary, custom migrations & SQL syntax | Reads on replica (:3307), mutations via `primaryExecute` (:3306); base rAthena SQL immutable (`sql-files/custom/` only); wrap identifiers in backticks (``` `col` ```); no dynamic functions in `COALESCE` defaults |
| **HIGH (8x)** | `DESIGN_SYSTEM_UX` | Bento design tokens, modal ergonomics & privacy | Standardize on Bento tokens (`bg-surface`, `text-accent`); Esc & backdrop dismiss; min 40px touch targets; scrub infra plumbing (`:3307`, `accountId`); offset mobile overlays with `env(safe-area-inset-bottom)` |
| **HIGH (8x)** | `REACT_STATE_DEFENSE` | Component scope, defensive props & fault isolation | Inspect full parent scope/derived vars before chunk edits; fallback `items = []` and optional chaining `?.`; derive active entity in-memory + key by ID; wire full domain sentiment props down parent tree; wrap dynamic modals/charts in `<ErrorBoundary>` |
| **MEDIUM (7x)** | `BUILD_EXTRACTION` | Zero hardcoded literals, YAML generation & auth | Parameterize external IDs via `import.meta.env`; extract YAML metadata (`mob_db.yml`) to static TS at build-time (no hardcoded numeric ID sets); strict `user.groupId >= 1` (zero localStorage auth trust) |
| **MEDIUM (6x)** | `MATH_ECONOMICS` | Simulation rounding, yield tracking & time-series | Symmetric `Math.round` + guaranteed min 1-unit tick for integer pricing; dynamic target yield tracking (no zero-wipes); organic live shift recording (no unanchored fake history); integer price formatting |
| **MEDIUM (5x)** | `WORKFLOW_DISCIPLINE` | Planning preservation, domain grounding & phase scope | Plan first & continuously append to `implementation_plan.md`; test locally before finishing; ground designs in RO game domain; keep unrequested expansion phases strictly disabled (`enabled = 0`) |

### 3. When to WRITE & Ingest Mistakes
Whenever an error, bug, failure, regression, missed requirement, or wrong implementation occurs and is resolved:
1. **HOT:** Update the Matrix above or in [MISTAKES_AND_LEARNINGS.md](file:///E:/Games/Ragnarok/rathena-solo-centric/MISTAKES_AND_LEARNINGS.md) (increment frequency counter `[FREQ: N]`, preserve <= 10 row ceiling).
2. **COLD:** Append 1-line receipt to [MISTAKES_ARCHIVE.md](file:///E:/Games/Ragnarok/rathena-solo-centric/MISTAKES_ARCHIVE.md) using the Caveman Approach:
   `- [YYYY-MM-DD] TOPIC_ID | BAD: <symptom/error> | WHY: <root cause> | FIX: <fix applied> | RULE: <prevention safeguard>`

