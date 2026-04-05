# rAthena Scripting Best Practices

When writing or fixing NPC scripts for rAthena, adhere strictly to these conventions:

## 1. Syntax and Formatting
*   **Strict Indentation:** You MUST use Tabs (`\t`) for indentation. The rAthena script parser is highly sensitive to whitespace, especially in the script header (e.g., `map,x,y,facing<TAB>script<TAB>NPC Name<TAB>SpriteID,{`). Do NOT use spaces for alignment or indentation.
*   **Comments:** Use `//` for single-line comments.
*   **Statement Termination:** Every script command must end with a semicolon `;`.

## 2. Variables and Scope
Prefixes determine how and where a variable is stored.
*   `@` (Temporary Character): Cleared when the script instance ends or the player logs out.
*   *(No Prefix)* (Permanent Character): Stored in the database (`char_reg_num` / `char_reg_str`). Persists across sessions for that specific character.
*   `#` (Permanent Account): Shared across all characters on the same account.
*   `$` (Global Server): Shared across all players and NPCs until the server restarts (if `$@`) or permanently (if `$`).
*   `.` (NPC Local): Specific to the NPC instance.
*   `'` (Instance): Specific to the instanced map.

Suffixes determine the data type.
*   `$` (String): e.g., `@name$`, `name$`. Maximum length varies but is generally 255 characters.
*   *(No Suffix)* (Integer): e.g., `@zeny`, `kill_count`.

## 3. Dialogue Commands
*   `mes "text";` : Displays a message in the NPC dialogue box.
*   `next;` : Clears the current message box and waits for the player to click a "Next" button.
*   `close;` : Ends the dialogue and closes the window completely.
*   `menu "Opt1",Label1,"Opt2",Label2;` : Creates a clickable menu. The string size is limited; menus that are too long will throw a `[Warning]` and crash the client.

## 4. Common Fixes for Broken Scripts
*   **Command Syntax Pitfalls:** Some commands have non-intuitive argument orders.
    *   `npcwalkto <x>, <y> {, "<npc name>"}`: Incorrectly passing the NPC name as the first argument (e.g., `npcwalkto "Guard", 10, 20`) will cause "non-existing NPC" errors because the engine tries to parse the name as a coordinate. Always provide coordinates first.
*   **Map Name Typos:** Ensure map names are spelled exactly as they appear in `db/map_index.txt`. A very common mistake is using `morroc` (incorrect) instead of `morocc` (correct). Using an invalid map name will prevent NPCs from loading or cause `warp` commands to fail silently or with errors.
*   **Variable Mismatch:** Passing `@name` (int) to a function expecting a string (requires `@name$`).
*   **Missing Tabs in Header:** If an NPC entirely fails to load, check the header row for spaces where Tabs should be.
*   **Dangling Commands:** Ensure every `menu` or `mes` block eventually leads to a `close;`, `close2;`, or `end;` to prevent the script from halting or leaving the player's UI locked.