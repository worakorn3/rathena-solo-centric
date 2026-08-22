# Handoff Report: Ragnarok Online Visual Grounding & Copy Lore Audit (Milestone 2)

## 1. Observation

### 1.1 Existing Frontend Copy & Component Audit (`web/apps/client/src/`)
A thorough line-by-line inspection of all user-facing frontend components was conducted:

1. **`web/apps/client/src/App.tsx`**:
   - Lines 130-174: Navigation tabs use `Financial HQ`, `Character`, `Progression`, `Bounties`.
   - Lines 192, 242, 288, 312: Code comments contained generic unicode emojis (`💰 FINANCIAL HQ`, `⚔️ CHARACTER & GEAR`, `📜 SOLO PROGRESSION`, `🎯 DAILY BOUNTIES`).
   - Lines 218-223: Logged-out preview copy refers to "Personal Economy & Wealth Dashboard" and "Midgard Municipal stock positions".
   - Lines 299-302: Monster tracker preview refers to "Solo Persistence & Monster Hunt Tracker" and "solo persistence log".
   - Lines 320-322: Footer copy: `Photonic Singularity • Ragnarok Solo-Centric Portal • Connected to MariaDB Replica (:3307)`.

2. **`web/apps/client/src/components/character/StatusWindow.tsx`**:
   - Lines 16-32: Character Header with Name, Class, Level, Job Level, Status indicator (`Online` / `Offline`).
   - Lines 34-60: HP / SP visual gauge bars.
   - Lines 62-88: 6-Stat grid (`STR`, `AGI`, `VIT`, `INT`, `DEX`, `LUK`).
   - Lines 90-103: Footer grid displaying `Liquid Zeny` (with item sprite `7036`), `Location` (map name), `Status Pts`, and `Skill Pts`.

3. **`web/apps/client/src/components/character/CharSelector.tsx`**:
   - Line 26: Header label `Roster`.
   - Lines 49-56: Character row item displaying Level badge, character Name, Online dot, and Class `Level/JobLevel`. Currently lacks an active expedition status pill.

4. **`web/apps/client/src/components/character/Paperdoll.tsx`**:
   - Lines 16-25: Slot definitions (`Head Upper`, `Armor`, `Weapon`, `Shield`, `Garment`, `Footwear`, `Accessory 1`, `Accessory 2`).
   - Lines 85-97: Card slots (`Card #ID` or `Unslotted / Empty`).
   - Lines 134-143: Database lookup link with Lucide `ExternalLink` to `Divine Pride`.

5. **`web/apps/client/src/components/economy/BankWidget.tsx`**:
   - Lines 26-29: Header `Investment Bank` with location pill `Prontera`.
   - Lines 31-35: Accrual indicator `+1% Daily Interest` with Lucide `TrendingUp`.
   - Lines 38-57: Labels for `Accrued Interest`, `Total Available`, and `Days Active` (`daysAccrued / maxDays Max`).

6. **`web/apps/client/src/components/economy/StockPortfolio.tsx`**:
   - Lines 14-16: Header `Municipal Portfolio`.
   - Lines 21-25: Empty state text: `No active stock positions. Visit Midgard Stock Exchange brokers to invest.`.
   - Lines 27-34: Table headers (`Asset`, `Shares`, `Avg Price`, `Current`, `Return`).

7. **`web/apps/client/src/components/economy/MarketWatch.tsx`**:
   - Lines 26-31: Header `Market Watch` with `Real-time` badge.
   - Lines 13-18: Market sentiment states (`Bullish`, `Bearish`, `Chaos`, `Neutral`).
   - Lines 52-61: Economic Event Banner (`Economic Event: {eventName}`).

8. **`web/apps/client/src/components/economy/NetWorthCard.tsx`**:
   - Lines 20-25: Header `Global Assets` with formatted total Zeny (`Z`).
   - Lines 28-39: Subtotals for `Liquid (Inventory)`, `Investment Bank`, and `Stock Holdings`.

9. **`web/apps/client/src/components/economy/BountyBoard.tsx`**:
   - Lines 45-51: Header `Daily Bounties` with description referencing hunting target monsters and selling drops to the Junk Trader (max 100 bounty items per day).
   - Lines 65-67: Tier badge `Tier {tier}`.
   - Lines 89-94: Divine Pride intelligence link (`Intel`).

10. **`web/apps/client/src/components/tracking/KillTracker.tsx`**:
    - Lines 25-52: Sidebar `Lifetime Stats` with counts for `Total Defeated`, `MvPs Eliminated`, `Mini-Bosses`, and `Normal Monsters`.
    - Lines 57-82: Main tracker `Top Hunted Targets` with filters (`All`, `MvP`, `Mini`, `Normal`).

11. **`web/apps/client/src/components/armory/PublicSearch.tsx`**:
    - Line 81: Header `Public Character Armory & Hall of Fame`.
    - Line 139: Unicode emoji `👑 Server Top Rankings (Hall of Fame)` (identified for removal/Lucide replacement).

12. **`web/apps/client/src/components/auth/LoginModal.tsx`**:
    - Line 43: Header `Player Account Login`.
    - Lines 56-58: Description referencing rAthena credentials for private Net Worth, Investment Bank, and Character data.

### 1.2 In-Game Mechanics & Script Copy Grounding (`npc/custom/`)
- `npc/custom/system_tablet.txt` (lines 166-230):
  - Section title: `[Dispatch Operations]`.
  - In-game behavior: Dispatching a character automatically logs them out via `@kick`.
  - Duration cap: 12 Hours (`720 minutes` / `43,200 seconds`).
  - Minimum claim duration: `1 minute`.
  - In-game claim dialog: `Speak to System Tablet -> Dispatch Operations -> Complete Dispatch / Abort Dispatch`.
  - In-game rate scaling: Rewards scale directly with `BaseLevel` and time elapsed.

---

## 2. Logic Chain

1. **Ragnarok Lore Alignment**:
   - Generic AI-slop terminology ("AFK Miner", "Idle Bot", "Passive Income", "Crypto Staking", generic fintech terms) contradicts Ragnarok Online worldbuilding.
   - In-universe, offline gathering is operated through the **Eden Group Logistics Division** under the framework of **Solo Expedition Operations**.
   - Remote monitoring and in-game claims operate through the **System Tablet** (custom handheld magitech terminal item).
   - Financial markets are operated by the **Midgard Stock Exchange (MSE)** with municipal city tickers (`PRON`, `GEFF`, `MORR`, `ALBE`, `ALDE`, `PAYO`, `COMO`, `LIGH`, `RACH`, `YUNO`).

2. **3-State Dispatch UI Copy Requirements**:
   - **State A (Online / Blocked)**:
     - The game engine locks characters that are currently logged in.
     - *Mandatory copy:* `"Character currently logged into Ragnarok. Dispatches must be initiated while offline or via the System Tablet."`
     - Visual badge: `LOGGED IN` or `ACTIVE SESSION`.
     - Action button state: Disabled with reason.
   - **State B (Available / Offline)**:
     - The character is logged out and ready for expedition deployment.
     - *Mandatory rate badge:* `"Lv.{baseLevel} Solo Expedition Rate"` (or `"Lv.{baseLevel} Rate"`).
     - Yield preview must clearly communicate hourly rates:
       - Base EXP: `+15,000 × Lv / hr`
       - Job EXP: `+10,000 × Job Lv / hr`
       - Zeny: `+2,500 × Lv / hr`
       - Duration cap: `12h Duration Cap (43,200s)`.
     - Action button: `"Deploy Expedition"` (tactile, with `"Deploying Expedition..."` during mutation).
   - **State C (Active Expedition)**:
     - The character is actively deployed on a solo expedition.
     - *Mandatory claim copy:* `"Claim in-game via System Tablet"`.
     - Live timer: `HH:MM:SS` elapsed.
     - Visual capacity bar: `HH:MM / 12h Cap` (capped at 100%).
     - Accrued yields: Live tick updates for Base EXP, Job EXP, and Zeny.
     - Information notice: `"Rewards accumulate for up to 12 hours. Access your System Tablet in-game to conclude the mission and claim yields."`

3. **Roster Integration Copy**:
   - In `CharSelector.tsx`, characters with `dispatchStart > 0` must display an active status indicator: `"Expedition"` / `"On Expedition"`.

---

## 3. Caveats

- **Read-Only Scope**: Explorer 3 performed pure read-only static analysis and copy design. Source code modifications (`web/apps/client/src/`) are left for implementation agents in Milestone 2/3/4.
- **Backend / DB Formula Parity**: The frontend yield calculations (`Math.floor((base_level * 15000 * seconds) / 3600)`) match the specification in `PROJECT.md` §Game Mechanics Yield Formulas.

---

## 4. Conclusion & Complete Copy Lore Specification Matrix

### 4.1 Master Copy & Lore Reference Dictionary

| UI Element / Location | Current / Generic Copy | Standardized Ragnarok Online Lore Copy | Component Target |
| :--- | :--- | :--- | :--- |
| **Dispatch Card Header** | "Dispatch Operations" / "AFK Dispatch" | **`Eden Group Logistics`**<br><span className="text-xs text-muted">Solo Expedition Operations</span> | `DispatchCard.tsx` |
| **Dispatch Description** | "Automated gathering while offline" | `Deploy idle offline adventurers on automated reconnaissance & resource expeditions across Midgard.` | `DispatchCard.tsx` |
| **State A Status Pill** | "Online" / "Busy" | **`ACTIVE SESSION`** / **`LOGGED IN`** (`text-danger`) | `DispatchCard.tsx` |
| **State A Warning Banner** | *N/A* | **`Character currently logged into Ragnarok. Dispatches must be initiated while offline or via the System Tablet.`** | `DispatchCard.tsx` |
| **State A Button** | "Deploy" | **`Deploy Expedition`** (Disabled: *Active In-Game*) | `DispatchCard.tsx` |
| **State B Status Pill** | "Offline" / "Ready" | **`AVAILABLE / OFFLINE`** (`text-success`) | `DispatchCard.tsx` |
| **State B Rate Badge** | "Rate: 1.0x" | **`Lv.{baseLevel} Solo Expedition Rate`** | `DispatchCard.tsx` |
| **State B Cap Badge** | "Max 12h" | **`12h Duration Cap`** | `DispatchCard.tsx` |
| **State B Base EXP Rate** | "+EXP/hr" | **`+15,000 × Lv / hr`** | `DispatchCard.tsx` |
| **State B Job EXP Rate** | "+JEXP/hr" | **`+10,000 × Job Lv / hr`** | `DispatchCard.tsx` |
| **State B Zeny Rate** | "+Z/hr" | **`+2,500 × Lv / hr`** | `DispatchCard.tsx` |
| **State B Action Button** | "Start" | **`Deploy Expedition`** (Interactive) | `DispatchCard.tsx` |
| **State B Loading State** | "Loading..." | **`Deploying Expedition...`** | `DispatchCard.tsx` |
| **State C Status Pill** | "Running" | **`ON EXPEDITION`** (`text-accent animate-pulse`) | `DispatchCard.tsx` |
| **State C Timer Label** | "Elapsed" | **`Elapsed Duration`** | `DispatchCard.tsx` |
| **State C Progress Label** | "Progress" | **`{hours}h {mins}m / 12h Cap`** | `DispatchCard.tsx` |
| **State C Accrued Base EXP**| "Base EXP" | **`Accrued Base EXP`** (`+{value.toLocaleString()} EXP`) | `DispatchCard.tsx` |
| **State C Accrued Job EXP** | "Job EXP" | **`Accrued Job EXP`** (`+{value.toLocaleString()} EXP`) | `DispatchCard.tsx` |
| **State C Accrued Zeny**    | "Zeny" | **`Accrued Zeny`** (`+{formatZeny(value)} Z`) | `DispatchCard.tsx` |
| **State C Claim Badge**    | "Claim Now" | **`Claim in-game via System Tablet`** | `DispatchCard.tsx` |
| **State C Claim Subtext**  | *N/A* | `Expeditions accumulate yields up to 12 hours. Open the System Tablet in-game to conclude and claim.` | `DispatchCard.tsx` |
| **Roster Status Pill**     | *None* | **`Expedition`** (with Lucide `Compass` / `Timer`) | `CharSelector.tsx` |
| **Tab 1 Navigation**       | `Financial HQ` | **`Midgard Economy`** / **`Financial HQ`** | `App.tsx` |
| **Tab 2 Navigation**       | `Character` | **`Adventurer Status`** / **`Character`** | `App.tsx` |
| **Tab 3 Navigation**       | `Progression` | **`Hunter's Log`** / **`Progression`** | `App.tsx` |
| **Tab 4 Navigation**       | `Bounties` | **`Daily Bounties`** (Eden Group & Junk Trader) | `App.tsx` |
| **Bank Widget Title**      | `Investment Bank` | **`Prontera Investment Bank`** | `BankWidget.tsx` |
| **Stock Portfolio Title**  | `Municipal Portfolio`| **`Midgard Stock Exchange (MSE) Portfolio`** | `StockPortfolio.tsx` |
| **Market Watch Title**     | `Market Watch` | **`Midgard Stock Exchange Index`** | `MarketWatch.tsx` |
| **Hall of Fame Header**    | `👑 Server Top Rankings` | **`Server Top Rankings (Hall of Fame)`** (Lucide `Crown`) | `PublicSearch.tsx` |

---

## 5. Verification Method

To verify adherence to the Lore and Anti-Slop copy standards during and after implementation:

1. **Verify Exact Verbatim Strings**:
   Run ripgrep queries to confirm the presence of required strings in `web/apps/client/src/`:
   - `grep_search` query: `"Character currently logged into Ragnarok. Dispatches must be initiated while offline or via the System Tablet."`
   - `grep_search` query: `"Claim in-game via System Tablet"`
   - `grep_search` query: `"Eden Group Logistics"`
   - `grep_search` query: `"Solo Expedition Rate"`

2. **Verify Emoji Elimination**:
   Run ripgrep regex search across `web/apps/client/src/` to ensure 0 unicode emojis remain:
   - Check `PublicSearch.tsx` line 139 (replace `👑` with `<Crown className="text-accent w-3.5 h-3.5" />`).

3. **Verify Type & Build Integrity**:
   Run from repository root:
   ```bash
   cd web
   bun run build
   ```
   Ensuring 0 TypeScript diagnostics or build errors.
