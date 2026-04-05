---
name: rathena-map-log-fixer
description: Parses Docker map server logs to identify and fix rAthena NPC script errors. Use when fixing broken NPC scripts based on map server [Error] or [Warning] logs.
---

# rathena-map-log-fixer

This skill provides the workflow and references needed to debug and fix broken rAthena NPC scripts using map server logs.

## Workflow

1.  **Retrieve Map Server Logs:**
    If the user hasn't provided the error log snippet directly, execute the included script to fetch recent NPC script-related errors from the Docker container:
    `.\scripts\fetch_docker_logs.ps1` (Requires the user's environment to be running Docker).

2.  **Analyze the Log:**
    Read the output carefully. Look for `[Error]` or `[Warning]` tags. Note the file name (e.g., `npc/custom/solo_mechanics.txt`), the specific script command failing, and any line number or length indicator (e.g., `@ 45` or `source:... / length:40`). See [error-formats.md](references/error-formats.md) to understand common error messages.

3.  **Inspect the Script:**
    Use `grep_search` or `read_file` to look at the exact broken script file mentioned in the log. Analyze the logic surrounding the failing line or command.

4.  **Determine the Fix:**
    Consult [scripting-best-practices.md](references/scripting-best-practices.md) to ensure your proposed solution aligns with rAthena's strict syntax and structural conventions (e.g., Tabs for indentation, correct variable scope). If you need more information about a specific command, check `doc/script_commands.txt` within the project.

5.  **Apply and Validate:**
    Modify the script file using `replace` or `write_file`. To validate, instruct the user to reload the script in-game using `@reloadscript` or by restarting the map server, and checking the logs again.
