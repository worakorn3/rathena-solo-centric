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

### Upstream Merges & Makefile Regeneration
- **Crucial Rule:** Whenever pulling or merging upstream commits that touch `*.in`, `CMakeLists.txt`, or introduce new source directories/translation units (e.g. `src/map/skills/`), you **must re-run `./configure`** (or CMake) before executing `make`.
- **Docker Command:**
  ```bash
  ./configure --enable-packetver=20250716 && make clean server
  ```

### Web Server
- **Docker Rebuild Rule (MANDATORY):** Should there be ANY changes to the web application (frontend `web/src` or backend `web/server`), ALWAYS rebuild and restart the Docker Compose container immediately:
  ```bash
  docker compose -f tools/docker/docker-compose.yml up -d --build --no-deps web-portal
  ```
  *(or `docker compose up -d --build --no-deps web-portal` if running from `tools/docker`).*
  > **Note:** Never run `docker compose build` without `up -d` or omit `--build` when testing changes, as running containers will otherwise continue serving stale cached builds.

