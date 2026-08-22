## Automated Script Testing & CI

### Automated Script Testing
The repository supports automated syntax validation and self-testing logic via the map-server `--run-once` flag and the `errormes` command. 
**CRITICAL AI AGENT RULE:** When testing scripts or running the map-server (e.g., with the `--run-once` flag), you MUST run it inside a Docker container instead of directly on the host OS. Do NOT run `./map-server --run-once` directly on Windows/PowerShell.
If the live server is already running, testing will fail to bind the default port. Use this exact PowerShell command to create a temporary config that overrides the port, run the test on the host network (to reach the DB) without interrupting the live server, and clean up:
```powershell
Set-Content -Path "conf/map_test.conf" -Value "import: conf/map_athena.conf`nmap_port: 5122"; docker run --rm --network host -v "$($PWD.Path):/usr/src/app" -w /usr/src/app rathena:local ./map-server --run-once --map-config conf/map_test.conf; Remove-Item -Path "conf/map_test.conf"
```
This validates all scripts. In buildbot mode (compiled with `--enable-buildbot=yes`), any syntax error or logic assertion failure using `errormes` will force the server to exit with a non-zero status (`EXIT_FAILURE`), failing the test run.

### CI & Upstream Tooling Boundary
- **Upstream CI Immutability:** Never modify upstream rAthena CI workflow files (`.github/workflows/*`) or upstream CI helper scripts (`tools/ci/*`) unless explicitly directed by the user.
- **Dedicated Solo Testing:** All custom mechanics (Stock Exchange, Junk Trader, EXP scaling, persistence logging) must be tested via:
  1. Standalone test scripts in `npc/test/` using `npc/test/ci/0000_funcs.txt` (`AssertEquals`, `AssertTrue`).
  2. The local Docker validation command (`rathena:local` with `--map-config conf/map_test.conf` on port 5122).
  3. Web backend Bun test suites (`web/test/*.test.ts` or `web/apps/server/test/*.test.ts`).
