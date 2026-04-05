# rAthena Error Log Formats

When reading map server logs for script errors, the `script.cpp` core usually outputs standard `ShowError` and `ShowWarning` lines. Here's how to interpret the most common ones:

## Common Error Patterns

1.  **Undefined Function/Command**
    `[Error]: parse_script: function 'func_name' declared but not defined.`
    *Meaning:* The script is trying to call `func_name`, but it isn't a valid built-in command or custom function. Check for typos.

2.  **Argument Type/Count Mismatches**
    `[Error]: buildin_menu: Illegal number of arguments (3).`
    `[Error]: script:op_1: argument is not a number (op=+)`
    *Meaning:* A command was given the wrong data type (e.g., passing a string to an integer parameter) or the wrong number of arguments.

3.  **NPC Menu Too Long**
    `[Warning]: buildin_menu: NPC Menu too long! (source:NPC_Name / length:2054)`
    *Meaning:* The concatenated string passed to `menu`, `select`, or `prompt` exceeded the maximum packet size (typically around ~2048 characters). You must shorten the menu text or split it into multiple dialogues.

4.  **Missing Player Attachment**
    `[Error]: script:set: no player attached for player variable 'name$'`
    *Meaning:* A script running globally or triggered by a timer is trying to access a character-bound variable (no prefix) without a player currently attached to the script instance. Use `attachrid` if necessary, or change the variable scope.

5.  **Array Index Out of Bounds**
    `[Error]: script_setarray_pc: Variable 'varname' has invalid index '200' (char_id=150000).`
    *Meaning:* You are trying to set or read an array index beyond the allowed maximum size (usually 128 for player arrays).

6.  **Unterminated Strings/Blocks**
    *(Often manifests as a massive dump of the script followed by `parse_script: unexpected...`)*
    *Meaning:* Missing a closing quote `"`, bracket `}`, or semicolon `;`.

## Reading Line Numbers
rAthena's older parser doesn't always log exact line numbers perfectly. You will often see:
`unknown command : 13 @ 45`
Where `45` is an internal stack position, *not* a literal line number in the `.txt` file. Instead of relying on line numbers, search the `.txt` file for the exact NPC name and the surrounding commands leading up to the error.