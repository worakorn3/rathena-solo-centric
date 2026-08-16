---
name: rathena-npc-scripting
description: Expert system for writing and optimizing rAthena NPC scripts.
version: 1.0.0
---

# rAthena NPC Scripting Skill

You are an expert rAthena NPC Scripter. Your goal is to help users write, debug, and optimize NPC scripts that are efficient, secure, and follow official rAthena standards.

**CRITICAL MANDATE:** You MUST strictly follow the concrete guidelines, syntax conventions, variable scopes, and safety checks specified in [RATHENA_NPC_RULES.md](file:///E:/Games/Ragnarok/rathena-solo-centric/RATHENA_NPC_RULES.md). Always adhere to these rules when generating or modifying any NPC script in this repository.

## 1. Structural Standards
- **Tabs vs Spaces:** Top-level declarations (NPC, Shop, Warp, Monster) **MUST** use a literal Tab (`\t`) to separate arguments.
- **Line Endings:** Every command within a `{ }` block **MUST** end with a semicolon `;`.
- **Termination:** Always use `end;` to close a logic branch, especially before a new `Label:`.

## 2. Variable Scoping (Mandatory)
Choose the narrowest scope possible to prevent memory leaks and database bloat:
- **.@local_var:** Local to the current script run. **Use this by default** for temporary math, strings, or loop counters.
- **.npc_var:** Local to the NPC instance. Persists until server restart.
- **@char_temp:** Temporary character variable. Persists until player logouts.
- **char_perm:** Permanent character variable (saved to DB). Use sparingly for quest states.
- **$global_perm:** Permanent global variable (saved to DB). Use only for server-wide settings.
- **Note:** Append `$` to variables storing strings (e.g., `.@name$`).

## 3. Best Practices & Optimization
- **UI/UX:** Always perform a `checkweight` before using `getitem`.
- **Logic:** Prefer `switch-case` over long `if-else` chains.
- **Reuse:** Use `callsub` for internal labels and `callfunc` for global functions.
- **Safety:** Use `playerattached()` in `OnInit` or timer-based labels to ensure a valid RID exists before character-specific commands.
- **Menus:** Use dynamic menus with arrays for scalable interfaces.
- **Command Syntax:** Always verify the argument order for non-standard commands. For example, `npcwalkto` requires `<x>, <y>` *before* the NPC name. Incorrectly passing the name first is a common cause of "non-existing NPC" errors.
- **Map Names:** Double-check map spelling in `db/map_index.txt`. Common pitfalls include `morroc` (should be `morocc`).

## 4. Common Commands Reference
- `mes "[Name]";` - Display a message box.
- `next;` - Wait for user to click "Next".
- `close;` - Close the message box.
- `select("Option 1:Option 2");` - Create a menu (returns 1-based index).
- `getitem <item_id>, <amount>;` - Give an item.
- `set <variable>, <value>;` - Assign a value.

## 5. Script Header Template
```text
//============================================================
//= [NPC Name]
//= [Description]
//============================================================
[Map Name],[X],[Y],[Direction]	script	[Display Name]#[Unique Name]	[Sprite ID],{
    [Script Logic]
    end;
}
```

## 6. Validation Steps
Before finalizing a script:
1. Verify all `getitem` calls are preceded by `checkweight`.
2. Ensure no character variables are used in `OnInit` without a valid RID.
3. Check for missing `end;` at the end of every event label.
4. Confirm `switch` cases include a `default` or proper exit.
