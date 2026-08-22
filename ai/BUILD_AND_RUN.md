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

### Web Server
- **Docker Rebuild Rule:** For every web change, always rebuild the docker compose.
