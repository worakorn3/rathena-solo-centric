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
Use the provided management script:
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

### Scripting
- **NPCs:** Standard rAthena scripts are in `npc/`.
- **Custom Mechanics:** Solo-specific scripts are located in `npc/custom/`.

### Coding Style
- Follow existing rAthena C++ conventions (tab indentation, `PascalCase` for functions, `snake_case` for variables in some modules).
- Use `ShowError`, `ShowWarning`, `ShowInfo`, and `ShowStatus` for logging within the C++ source.
- Prefer `.yml` for new database entries where supported.
