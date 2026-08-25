# rAthena NPC Scripting Standards & Rules for Antigravity CLI

This document outlines the strict, non-negotiable coding standards, syntax rules, and best practices for writing, editing, and optimizing rAthena NPC scripts in this repository. All code generated or modified by the Antigravity CLI must strictly conform to these rules to ensure server stability, prevent memory leaks, and maintain high performance.

---

## 1. Syntax & Structural Rules

### A. The Header Tab Rule (Strictly Mandatory)
The main declaration line of any NPC, Shop, Warp, or Monster script **must** use a single literal Tab character (`\t`) to separate its top-level arguments.
* **Format:**
  `[Map Name],[X],[Y],[Direction]` `[TAB]` `script` `[TAB]` `[Display Name]#[Unique Name]` `[TAB]` `[Sprite ID],{`
* **Example:**
  `prontera,150,150,4` `\t` `script` `\t` `Healer#solo_healer` `\t` `JT_KA_KAFRA`,{`
* **Warning:** Using spaces instead of a tab character to separate these fields will trigger severe parsing syntax errors on map-server boot and prevent the server from loading.

### B. Statement Termination
* Every single instruction, variable assignment, or function call inside a script block `{ ... }` **must** end with a semicolon `;`.
* Missing semicolons are the #1 cause of map-server parse errors.

### C. Logic and Flow Termination
* Every logic block, event handler, or NPC option branch must end with an appropriate termination command to prevent "fall-through" execution.
  * Use `close;` for player conversations to close the dialogue window and free the client socket.
  * Use `close2;` if you need to run clean-up commands *after* closing the player's dialogue window.
  * Use `end;` for server events (`OnInit:`, `OnNPCKillEvent:`, timers) or sub-routines where no player dialogue box is open.
* Always put `end;` or `close;` before defining a new label to ensure clear logical boundaries.

---

## 2. Variable Scoping Rules (Mandatory Performance Optimization)

To prevent database bloat, performance degradation, and memory leaks, you **must** use the narrowest possible variable scope.

| Variable Prefix | Scope | Persistence | Best Use Case |
| :--- | :--- | :--- | :--- |
| `.@local_var` | Local to the current script run | Destroyed when script finishes | **Default choice** for calculations, loops, temporary database outputs, and temporary string holders. |
| `.npc_var` | Local to the current NPC instance | Persists until server restart/reload | Storing NPC-specific settings, configurations, or boot-up constants set during `OnInit:`. |
| `@char_var` | Player-specific temporary | Cleared when player logs out | Tracking temporary session states (e.g., active instance cooldowns, session-based event participation). |
| `char_var` | Player-specific permanent | Saved to SQL database (`char_reg_db`) | **Use sparingly.** Best for quest progression steps, achievements, unlocked titles, or permanent upgrades. |
| `$global_var` | Global permanent | Saved to SQL database (`map_reg_db`) | **Use very sparingly.** Server-wide toggle switches, global event states, or global high-scores. |
| `$@global_var` | Global temporary | Cleared when map-server restarts | Storing global temporary states (e.g., current global rate boosts, active hourly event status). |

### Rules for Variables:
1. **String Indicator:** All variables holding text strings **must** append a `$` suffix to the variable name (e.g., `.@name$`, `.welcome_msg$`, `@session_title$`, `quest_state$`).
2. **Clean Up:** Never use permanent character variables (`char_var`) for calculations, loops, or intermediate states. This fills up the MySQL `char_reg_db` table and severely degrades server save times.
3. **Naming:** Use clear, descriptive, lowercase snake_case for all custom variable names.

---

## 3. Inventory and Weight Check Safety Rules

### A. The Weight Check Mandate
Before calling `getitem`, `getgroupitem`, or any function that gives items directly to a player's inventory, you **must** perform a weight and space check using the `checkweight` function.
* **Syntax:** `checkweight(<item_id>, <amount>)`
* **Rule:** If the check fails (returns `0`), the NPC must notify the player and gracefully terminate without issuing the item.
* **Correct Pattern:**
  ```rAthena
  .@item_id = 502; // White Potion
  .@amount = 5;
  if (checkweight(.@item_id, .@amount) == 0) {
      mes "[Inventory Check]";
      mes "You are carrying too much weight, or your inventory is full.";
      mes "Please clear some space and talk to me again.";
      close;
  }
  getitem .@item_id, .@amount;
  ```

### B. Player Attachment Check (`playerattached()`) & Event Triggers
Inside event labels that are triggered asynchronously by the system (such as `OnInit:`, `OnInterCmd:`, or timer labels like `OnTimer5000:`), there is no player attached to the execution thread by default.
* Calling player-attached commands (e.g., `mes`, `getitem`, `sc_start`, `pc_read`) in these blocks without a valid attachment will crash or spam the console with execution errors.
* **Rule (Attachment):** If player actions are needed in an event/timer label, you **must** verify attachment using `if (playerattached())` or manually attach a player using `attachrid(<Account ID>)`.
* **Rule (`donpcevent` vs `doevent`):** Always use `donpcevent` for system, timer, or `OnInit:` triggers. Only use `doevent` when the calling context is guaranteed to have an active player attached.

---

## 4. UI/UX and Dialogue Conventions

### A. Message Box Formatting
* Every message block must begin with the NPC's name in brackets to provide a clean, modern in-game chat aesthetic.
* Use a single `mes` for multiple lines where possible, or separate with clear line breaks.
* Always end interactive branches with a choice or a clean `close;`.
* **Example:**
  ```rAthena
  mes "[System Tablet]";
  mes "Welcome to your personal assistant.";
  mes "Select an option to proceed:";
  next;
  ```

### B. Dynamic Menus vs. Hardcoded Menus
* Avoid giant, hardcoded `select()` chains where options are toggled dynamically.
* Instead, build dynamic menus using arrays and local loop counters, then pass the concatenated string to `select()`.
* **Example:**
  ```rAthena
  // Constructing a dynamic menu
  .@menu$ = "";
  for (.@i = 0; .@i < .npc_menu_size; .@i++) {
      .@menu$ = .@menu$ + .npc_options$[.@i] + ":";
  }
  .@choice = select(.@menu$);
  ```

---

### C. Menu Option Delimiters
* The `select()` function in rAthena uses a colon (`:`) to separate menu choices.
* **Rule:** Never use a colon (`:`) inside the display text of a menu option, as it will be parsed as a delimiter and split your option into multiple unintended choices, breaking the index returned by `select()`.
* Use hyphens (`-`) or spaces for internal formatting instead.

---

### D. Dialogue Box Pagination & Stacking Mandate
Standard Ragnarok Online game clients render approximately 4–5 lines of text per dialogue box before lines stack, clip off-screen, or force unwanted scrollbars.
* **Safe Line Limit:** No dialogue box may output more than **4–5 lines of text** consecutively without a page-break command (`next;`, `clear;`, `close;`, `close2;`, `select(...)`, `menu(...)`, `input(...)`, `prompt(...)`, or `end;`).
* **The `next;` Requirement:** When delivering multi-paragraph or long dialogue, you **must insert `next;`** after every 4 lines to paginate the conversation smoothly for the player.
* **Dynamic Loop Pagination Rule:** When rendering dynamic lists (e.g. SQL query results, inventory items, stock tickers, or portfolio lists), you **must paginate** the loop into chunks of 4–5 items per page with `[Page X/Y]` headers and `next;` transitions.
* **Pattern:**
  ```rAthena
  .@total_pages = (.@item_count + 4) / 5;
  for (.@page = 0; .@page < .@total_pages; .@page++) {
      clear;
      mes "[List Overview - Page " + (.@page + 1) + "/" + .@total_pages + "]";
      mes "---------------------------";
      .@start_idx = .@page * 5;
      .@end_idx = .@start_idx + 5;
      if (.@end_idx > .@item_count) .@end_idx = .@item_count;
      for (.@i = .@start_idx; .@i < .@end_idx; .@i++) {
          mes "- " + .@items$[.@i] + ": " + .@details$[.@i];
      }
      next;
  }
  ```
* **Anti-Pattern:** Never dump 6+ lines in a single unpaginated block or dynamic `mes` loop without `next;`.
* **Automated Static Analysis:** Always run the project linter before submitting NPC changes:
  ```powershell
  python tools/ci/lint_npc_dialogue.py --path npc/custom npc/test
  ```

---

### E. Character Encoding & Emoji Prohibitions (Strictly Prohibited)
The Ragnarok Online game client uses regional single/double-byte character sets (e.g. EUC-KR / CP949 / Windows-1252) and **CANNOT render 3-byte or 4-byte UTF-8 emojis or non-ASCII unicode symbols**.
* **Zero Emojis in NPC Scripts:** Never use unicode emojis (e.g., 🏛️, ⚡, 💼, 💰, ⚙️, 📰, 📈, etc.) or multi-byte unicode symbols in:
  - NPC dialogue (`mes`)
  - Menu choices (`select`, `menu`, `prompt`)
  - NPC announcements (`announce`, `mapannounce`)
  - Overhead text (`npctalk`)
  - Waiting rooms (`waitingroom`)
* **Symptom of Violation:** Emojis cause severe mojibake corruption in-game (e.g. `?뤪?`, `??`, `?뮦`, `?숍들`).
* **Approved Styling:** Use standard printable ASCII text with native rAthena color codes (`^RRGGBB...^000000`) or standard ASCII punctuation `[...]` / `*...*` for UI highlights.

---

## 5. Coding Style & Optimization Best Practices

1. **Avoid Nested If-Else Chains:**
   Prefer `switch(expr)` over long chains of `if-else if`. Switch statements are faster and much cleaner to read.
   ```rAthena
   switch (.@choice) {
       case 1:
           // logic
           break;
       case 2:
           // logic
           break;
       default:
           close;
   }
   ```
2. **Re-use with Local Sub-routines (`callsub`):**
   If a script has repetitive tasks (e.g., formatting items, deducting currency, resetting states), wrap them in a local sub-routine inside the same file using `callsub` rather than copying and pasting code.
3. **Double-Check Map Spelling:**
   Refer to `db/map_index.txt` or `conf/maps.conf` to check map name spellings. For example, `morroc` is commonly misspelled; in rAthena, the official map name is `morocc`.
4. **Use Standard Sprite Constants:**
   Use symbolic sprite constants (e.g., `JT_KA_KAFRA`, `JT_BLACKSMITH`) rather than magic numbers.
5. **Freeloop for Heavy / Catch-up Loops (`freeloop`):**
   rAthena aborts scripts with `script:run_script_main: infinity loop !` if an execution exceeds 2048 operations. For offline catch-up routines, batch DB processing, or large iterations, wrap the loop with `freeloop(1);` and restore with `freeloop(0);`.
   ```rAthena
   freeloop(1);
   for (.@i = 0; .@i < .@large_count; .@i++) {
       // heavy batch operation
   }
   freeloop(0);
   ```
6. **Dead Legacy Logic Pruning:**
   When an NPC script fails due to a missing `callfunc` or `callsub`, verify whether the underlying subsystem was migrated or refactored before creating new function wrappers. If the subsystem was moved to an external service (e.g., Elysia backend) or deprecated, **delete the dead script code** instead of adding unused function surface area back to shared script libraries.


---

## 6. Automated Script Validation & Assertions

To avoid manual in-game testing, you can use the emulator's built-in script parsing and the `errormes` command to perform automated validation and unit-style assertions.

### A. Dry-Run Parser Verification
The map-server supports a `--run-once` flag that initializes the database, parses and compiles all configured scripts, and shuts down immediately.
1. Run [tools/ci/npc.sh](file:///E:/Games/Ragnarok/rathena-solo-centric/tools/ci/npc.sh) (Linux/macOS) or [tools/ci/npc.bat](file:///E:/Games/Ragnarok/rathena-solo-centric/tools/ci/npc.bat) (Windows) to register custom and test scripts in `npc/scripts_custom.conf`.
2. Run the map-server:
   ```bash
   ./map-server --run-once
   ```
3. If built in **Buildbot Mode** (compiled with `--enable-buildbot=yes`), any script syntax error, warning, or database loading error will set the `buildbotflag` and force the process to exit with status code `1` (`EXIT_FAILURE`), failing CI/CD or scripts.
### B. Docker Dry-Run Validation on Host (Windows/PowerShell)
If the live server is already running, testing will fail to bind the default port. Use this exact PowerShell command to create a temporary config that overrides the port, run the test on the host network (to reach the DB) without interrupting the live server, and clean up:
```powershell
Set-Content -Path "conf/map_test.conf" -Value "import: conf/map_athena.conf`nmap_port: 5122"; docker run --rm --network host -v "$($PWD.Path):/usr/src/app" -w /usr/src/app rathena:local ./map-server --run-once --map-config conf/map_test.conf; Remove-Item -Path "conf/map_test.conf"
```

### C. Logic Assertions via `OnInit` and `errormes`
For testing functional script logic (e.g., custom math libraries or player calculations) without entering the game, you can write self-testing NPCs:
1. Wrap the test calculations inside an `OnInit:` event label, which triggers automatically when the map-server boots during `--run-once`.
2. Use the `errormes "<message>";` command to throw an assertion failure. Since `errormes` prints a console error, it raises the buildbot flag, causing the test run to exit with failure.

#### Example Unit Test NPC:
```rAthena
-	script	test_math_library	-1,{
OnInit:
	.@a = 50;
	.@b = 25;
	.@result = callfunc("MyMathSubtract", .@a, .@b);

	if (.@result != 25) {
		errormes "test_math_library: expected 25, got " + .@result;
	}
	end;
}
```

---

## 7. Pre-Verification Checklist for Antigravity CLI

Before submitting any NPC script modifications, you **must** verify the following:
1. [ ] **Tab Checks:** Check every new or modified NPC header to ensure literal tab characters (`\t`) are used as field separators.
2. [ ] **Weight Safety:** Ensure *every* single `getitem` call is protected by a preceding `checkweight` branch.
3. [ ] **Scope Verification:** Ensure all temporary variables are prefixed with `.@` and strings end with `$`.
4. [ ] **Termination Checks:** Ensure all code paths hit a `close;`, `close2;`, or `end;` and that no fall-through occurs.
5. [ ] **No Magic Numbers:** Make sure item IDs, maps, and sprites are commented or use standard system constants.
6. [ ] **Automated Parser Run:** Run `./map-server --run-once` with your scripts registered to verify no syntax warnings/errors are thrown.
7. [ ] **Dialogue Pagination:** Run `python tools/ci/lint_npc_dialogue.py --path npc/custom npc/test` to verify no dialogue stacking (>5 consecutive `mes`) or unpaginated loops exist.
