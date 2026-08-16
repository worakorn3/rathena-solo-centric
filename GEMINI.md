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
- **Web Server:** (Optional) Provides web-based APIs.

---

## Solo-Centric Features
This fork includes several modifications to enhance the experience for individual players:
- **EXP Scaling:** Native 5x EXP/Job EXP boost automatically applied at Level 30+ (managed via `npc/custom/solo_mechanics.txt`).
- **Auto-Heal on Kill:** Players receive HP/SP restoration upon defeating monsters, scaling with monster difficulty.
- **System Tablet:** A custom in-game utility (`npc/custom/system_tablet.txt`) providing:
    - Progression guides and global enhancement summaries.
    - **Monster Intel App:** Unlockable monster database for Zeny.
    - **Market Pulse App:** Economic sentiment and yield recommendations.
- **Quality of Life:**
    - Storage capacity increased to **800 slots** (`src/common/mmo.hpp`).
    - Card drop rates are flat 2x (excluding MvPs).
    - Kafra warp fees reduced by 50%.
    - Death penalty reduced to 0.5%.

---

## Building and Running

### Building (Linux/macOS)
```bash
mkdir build
cd build
cmake -G "Unix Makefiles" -DINSTALL_TO_SOURCE=ON -DCMAKE_BUILD_TYPE=Release ..
make install
```

### Building (Windows)
Open `rAthena.sln` in Visual Studio 2017 or newer and build the solution in **Release** or **RelWithDebInfo** configuration.

### Running the Server
- **Host (Windows):** Run Windows binaries directly or manage containerized instances via Docker. Do NOT run `./athena-start` directly in PowerShell (it is a Linux bash script).
- **Linux/Docker Container:**
  - `start`: `./athena-start start`
  - `stop`: `./athena-start stop`
  - `status`: `./athena-start status`
  - `watch`: `./athena-start watch` (Auto-restart on crash)

---

## Development Conventions

### Configuration
- **Server Settings:** Located in `conf/`.
- **Database Connection:** Configure `conf/inter_athena.conf` and `conf/char_athena.conf`.
- **Battle Mechanics:** Tweak rates and behaviors in `conf/battle/`.
- **Packet Version:** Defined as `PACKETVER` in `src/config/packets.hpp`.

### Database
- **Schema:** SQL files are located in `sql-files/`.
- **Data Tables:** `.yml` and `.txt` files in the `db/` directory.

### Scripting & Custom Mechanics
- **NPC Location:** Standard rAthena scripts are in `npc/`. Solo-specific scripts are in `npc/custom/`.
- **NPC Scripting Rules:** **ALL** NPC scripting modifications must strictly adhere to the [RATHENA_NPC_RULES.md](file:///E:/Games/Ragnarok/rathena-solo-centric/RATHENA_NPC_RULES.md) file.
- **Top 3 Absolute Mandates:**
  1. **Tab Separation:** Always use a single literal Tab character (`\t`) to separate fields in script headers (NPC, Shop, Warp, Boss, Monster). Spaces are NOT allowed and will crash parsing.
  2. **Scoping:** Always use local variables (`.@local_var`, `.@local_var$`) for any temporary calculations, loops, or intermediate variables to prevent DB bloating and memory leaks.
  3. **Inventory Checks:** Every `getitem` call must be protected by a preceding `checkweight` inventory check to prevent lost items.
- **Automated Script Testing:** The repository supports automated syntax validation and self-testing logic via the map-server `--run-once` flag and the `errormes` command. 
  **CRITICAL AI AGENT RULE:** When testing scripts or running the map-server (e.g., with the `--run-once` flag), you MUST run it inside a Docker container instead of directly on the host OS. Do NOT run `./map-server --run-once` directly on Windows/PowerShell.
  If the live server is already running, testing will fail to bind the default port. Use this exact PowerShell command to create a temporary config that overrides the port, run the test on the host network (to reach the DB) without interrupting the live server, and clean up:
  ```powershell
  Set-Content -Path "conf/map_test.conf" -Value "import: conf/map_athena.conf`nmap_port: 5122"; docker run --rm --network host -v "$($PWD.Path):/usr/src/app" -w /usr/src/app rathena:local ./map-server --run-once --map-config conf/map_test.conf; Remove-Item -Path "conf/map_test.conf"
  ```
  This validates all scripts. In buildbot mode (compiled with `--enable-buildbot=yes`), any syntax error or logic assertion failure using `errormes` will force the server to exit with a non-zero status (`EXIT_FAILURE`), failing the test run.

### Coding Style
- Follow existing rAthena C++ conventions (tab indentation, `PascalCase` for functions, `snake_case` for variables in some modules).
- Use `ShowError`, `ShowWarning`, `ShowInfo`, and `ShowStatus` for logging within the C++ source.
- Prefer `.yml` for new database entries where supported.

## Mistake Analysis & Prevention Protocol (Targeted Retrieval)

### 1. Knowledge Hierarchy & When to Read
- **Tier 1 (Universal Invariants):** Follow the Top 3 Mandates above directly in every session.
- **Tier 2 (Domain Skills & Rules):** When modifying NPC scripts, reference [RATHENA_NPC_RULES.md](file:///E:/Games/Ragnarok/rathena-solo-centric/RATHENA_NPC_RULES.md).
- **Tier 3 (Cold Archive - `MISTAKES_AND_LEARNINGS.md`):**
  - **When Debugging / Diagnosing Errors:** Search (`grep_search`) for matching error strings or symptoms in `MISTAKES_AND_LEARNINGS.md` to check if a known root cause exists.
  - **Do NOT** read the entire archive file blindly on unrelated tasks to prevent context dilution.

### 2. When to WRITE to `MISTAKES_AND_LEARNINGS.md` (Post-Mortem Log)
Whenever an error, bug, failure, regression, missed requirement, or wrong implementation occurs and is resolved:
1. Append to `MISTAKES_AND_LEARNINGS.md` using the **Caveman Approach** (ultra-terse, high-density, zero fluff):
   `- [YYYY-MM-DD] TOPIC_ID | BAD: <symptom/error> | WHY: <root cause> | FIX: <fix applied> | RULE: <prevention safeguard>`
2. If the rule is a recurring critical pattern, promote the `RULE` to [RATHENA_NPC_RULES.md](file:///E:/Games/Ragnarok/rathena-solo-centric/RATHENA_NPC_RULES.md) or add an automated check in `./map-server --run-once`.




