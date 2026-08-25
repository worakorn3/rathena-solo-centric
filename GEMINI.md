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
- **Tier 3 (HOT Memory - `MISTAKES_AND_LEARNINGS.md`):** Loaded automatically on every turn via a `PreInvocation` hook. Review the injected "CRITICAL PAST MISTAKES" block before executing tasks.
- **Tier 4 (COLD Memory - `MISTAKES_ARCHIVE.md`):** Historical 1-off edge-case learnings. Search via `grep_search` during debugging.

### 2. When to WRITE & Ingest Mistakes
Whenever an error, bug, failure, regression, missed requirement, or wrong implementation occurs and is resolved:
1. **HOT:** Append/update in `MISTAKES_AND_LEARNINGS.md` with frequency counter `[FREQ: N]` and action item.
2. **COLD:** Append to [MISTAKES_ARCHIVE.md](file:///E:/Games/Ragnarok/rathena-solo-centric/MISTAKES_ARCHIVE.md) using the Caveman Approach:
   `- [YYYY-MM-DD] TOPIC_ID | BAD: <symptom/error> | WHY: <root cause> | FIX: <fix applied> | RULE: <prevention safeguard>`
