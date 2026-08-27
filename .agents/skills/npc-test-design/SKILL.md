---
name: npc-test-design
description: Design, architect, and test rAthena NPC scripts and systems without test bloat or manual clicking. Use when creating or refactoring NPC scripts, designing economic/quest systems, writing automated CI unit tests in npc/test/, or triaging script testability.
---

# NPC Script Architecture & Test Design

Guidelines for architecting rAthena NPC scripts that are reliably testable without requiring manual in-game clicking or bloated test suites.

---

## 1. The 3-Gate Triage Matrix

Before writing or refactoring any NPC script, classify it into one of three patterns:

```text
                             [ New Feature / NPC ]
                                       │
               Does it touch Server Economy, Math Formulas,
               Quotas, or Multi-Step State Persistence?
                                 /           \
                           [YES]               [NO]
                            │                   │
                Is the calculation pure?   Is it dialogue,
                (Inputs ──► Outputs)       warping, or fetch?
                    /           \               │
              [YES]               [NO]          │
               │                   │            │
       ┌───────────────┐   ┌───────────────┐    │
       │  Pattern A:   │   │  Pattern B:   │    │
       │ Decoupled     │   │ Event-Based   │    │
       │ `function`    │   │ CI Harness    │    │
       │ + Unit Test   │   │ (`npc/test/`) │    │
       └───────────────┘   └───────────────┘    │
                                                │
                                        ┌───────────────┐
                                        │  Pattern C:   │
                                        │ Inline Script │
                                        │ + Engine Lint │
                                        └───────────────┘
```

| Pattern | Target Scope | Implementation Structure | Testing Mechanism |
| :--- | :--- | :--- | :--- |
| **Pattern A: Pure Function** | Pricing math, VIP discounts, refine chances, level-gap formulas | `function\tscript\tFuncName\t{ ... }` (0 dialogue) | Parameterized unit test in `npc/test/` |
| **Pattern B: Stateful Engine** | Stock market, daily junk trader, battle pass, instance controllers | Dedicated event labels (`OnRotateDaily:`, `OnExecute:`) | Headless CI assertion test in `npc/test/` |
| **Pattern C: Standard Content** | 80% of NPCs: Town warpers, shopkeepers, quest dialogues, lore | Standard inline NPC script (`mes`, `select`, `next`) | Headless `map-server --run-once` + dialogue linter |

---

## 2. Implementation Patterns & Templates

### Pattern A: Decoupled Pure Function + Humble UI Shell

Keep business logic isolated from presentation so it can be tested with zero mock dialogue:

```c
// 1. Pure Domain Logic Function (npc/custom/functions/refine_cost.txt)
// NOTE: Use literal \t tab delimiters in the header!
function	script	CalculateRefineCost	{
	.@item_type = getarg(0);
	.@current_refine = getarg(1);
	.@is_vip = getarg(2, 0);

	if (.@current_refine >= 10) return -1; // Max refine reached

	.@base_fee = (.@item_type == 1) ? 50000 : 20000;
	if (.@is_vip) .@base_fee = (.@base_fee * 80) / 100; // 20% VIP discount

	return .@base_fee;
}

// 2. Humble UI Shell (npc/custom/refine_npc.txt)
prontera,150,150,4	script	RefineMaster	100,{
	mes "Welcome! Choose item to refine:";
	.@choice = select("Weapon:Armor");
	.@cost = callfunc("CalculateRefineCost", .@choice, getequiprefinerycnt(.@choice), vip_status());
	if (.@cost == -1) { mes "Already max level!"; close; }
	if (Zeny < .@cost) { mes "You need " + .@cost + " Zeny."; close; }
	// ...
}
```

### Parameterized Test Runner (The JUnit `@ParameterizedTest` Pattern)

Test multiple boundary conditions in a single loop without code bloat:

```c
// npc/test/refine_logic_ci_test.txt
// NOTE: Use literal \t tab delimiters in the header!
-	script	refine_master_test#ci	-1,{
OnInit:
	debugmes "Running Parameterized RefineMaster Unit Tests...";

	// Matrix: [item_type, current_refine, is_vip, expected_cost] (Stride = 4)
	setarray .@cases[0],
		1,  0, 0,  50000,   // Weapon, +0, non-VIP -> 50,000z
		1,  0, 1,  40000,   // Weapon, +0, VIP (20% off) -> 40,000z
		2,  4, 0,  20000,   // Armor, +4, non-VIP -> 20,000z
		1, 10, 0,     -1;   // Weapon, +10 (max) -> -1 (Rejected)

	.@stride = 4;
	.@num_cases = getarraysize(.@cases) / .@stride;
	for (.@i = 0; .@i < .@num_cases; .@i++) {
		.@offset = .@i * .@stride;
		.@type     = .@cases[.@offset];
		.@refine   = .@cases[.@offset + 1];
		.@vip      = .@cases[.@offset + 2];
		.@expected = .@cases[.@offset + 3];

		.@actual = callfunc("CalculateRefineCost", .@type, .@refine, .@vip);
		
		AssertEquals(.@expected, .@actual, 
			"RefineCost Case #" + .@i + " (Type=" + .@type + ", +=" + .@refine + ", VIP=" + .@vip + ")");
	}

	debugmes "All Parameterized Refine Tests Passed.";
	end;
}
```

---

## 3. Invariant / Property-Based Testing

When testing stateful systems (Pattern B), test **system invariants** rather than fragile magic values to prevent cheating tests:

```c
// Invariant 1: Economy Conservation Law
AssertEquals(.@initial_zeny, Zeny + .@actual_fee, "Zeny conservation invariant");

// Invariant 2: Regulatory Price Bounds
AssertTrue(.@price >= .@min_bound && .@price <= .@max_bound, "Price within configured bounds");

// Invariant 3: Quota Clamping (Never Negative)
AssertTrue(.@remaining_quota >= 0, "Daily quota must never dip below 0");
```

---

## 4. Verification & CI Commands

### A. Engine Syntax & Label Validation (Docker Headless)
Validates all script syntax, missing goto/label targets, unattached player commands in `OnInit:`, and executes `OnInit:` CI tests:
```powershell
Set-Content -Path "conf/map_test.conf" -Value "import: conf/map_athena.conf`nmap_port: 5122"; docker run --rm --network host -v "$($PWD.Path):/usr/src/app" -w /usr/src/app rathena:local ./map-server --run-once --map-config conf/map_test.conf; Remove-Item -Path "conf/map_test.conf"
```

### B. Dialogue & UI Overflow Linting (Python)
Verifies that consecutive `mes` statements do not exceed 4–5 lines without `next;` / `clear;` / `close;` page breaks:
```powershell
python tools/ci/lint_npc_dialogue.py --path npc/custom npc/test
```
