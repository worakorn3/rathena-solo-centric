## 2026-08-22T15:20:00Z
Task Assignment:
Frontend Worker for Milestones 2, 3, and 4 (Anti-Slop Visual Grounding, 3-State Dispatch UI, Bento Grid Integration & Optimistic Sync).
Working directory: e:\Games\Ragnarok\rathena-solo-centric\.agents\worker_m2_m3_m4

CRITICAL IMPLEMENTATION REQUIREMENTS:
1. Anti-Slop Visual & Thematic Grounding (R1):
   - Eliminate ALL generic unicode emojis across ALL components in `web/src/` (including `CharSelector.tsx`, `StatusWindow.tsx`, `MarketPulse.tsx`, `Inventory.tsx`, `Header.tsx`, etc.).
   - Standardize all icons to Lucide React SVGs (`Compass`, `Timer`, `Coins`, `Sparkles`, `ShieldAlert`, `Activity`, `Heart`, `Crosshair`, `Flame`, `Shield`, `Wind`, `BookOpen`, `Target`, `TrendingUp`, `TrendingDown`, `Package`, `Clock`, etc.) and `.ro-icon` sprite containers.
   - Lore grounding: "Eden Group Logistics / Solo Expedition Operations", "System Tablet", "Lv.{level} Solo Expedition Rate".

2. 3-State Interactive Dispatch Component (R3) & Capacity Bar (R2):
   - Create or refactor `DispatchCard.tsx` (and embed in `StatusWindow.tsx`):
     - State A (Online): When `character.online === 1`, disable expedition controls and display a clear contextual banner:
       "Character currently logged into Ragnarok. Dispatches must be initiated while offline or via the System Tablet."
     - State B (Available/Offline): When `character.online === 0` and `!character.dispatchStart`:
       - Formula badge: `Lv.${character.base_level} Solo Expedition Rate`
       - Hourly yield rate preview:
         - Base EXP: `character.base_level * 600` / hr
         - Job EXP: `character.base_level * 300` / hr
         - Zeny: `character.base_level * 120` / hr
       - Tactile "Deploy Expedition" button with loading/disabled state during API call.
       - On click: calls `POST /api/character/:charId/dispatch`, and updates state optimistically to Active Expedition.
     - State C (Active Expedition): When `character.dispatchStart > 0`:
       - Live client-side tick counter running on 1-second interval (`useEffect` ticker calculating elapsed seconds `now - character.dispatchStart`).
       - Formatted timer display (e.g. `04:15:30`).
       - Elapsed time capped at 12 Hours (43,200 seconds / 720 minutes).
       - Live calculated yield display:
         - Elapsed minutes M = min(floor(elapsedSec / 60), 720)
         - Base EXP: `character.base_level * 10 * M`
         - Job EXP: `character.base_level * 5 * M`
         - Zeny: `character.base_level * 2 * M`
       - 12-Hour visual progress capacity bar: `bg-surface2` track with `bg-accent` fill showing `HH:MM / 12h Cap` (or e.g. `04:15 / 12h Cap`) with width `(min(elapsedSec, 43200) / 43200) * 100%`.
       - Lore badge: "Claim in-game via System Tablet".
       - Lore header: "Eden Group Logistics / Solo Expedition Operations".

3. Bento Grid Integration & State Sync (R2, R4):
   - Integrate `DispatchCard` inside `StatusWindow.tsx` Bento grid without causing vertical overflow or layout misalignment on 1080p desktop or mobile viewports.
   - In `CharSelector.tsx`, display status pills for each character:
     - Online: "Online (In Midgard)" (green badge/indicator)
     - Active Expedition: "On Expedition" (amber badge with `Compass`)
     - Offline: "Offline" (slate badge)
   - Handle optimistic state updates so deploying dispatch updates the UI immediately without requiring a full page refresh.

4. Build & Test Verification:
   - Run `bun run build` across monorepo to verify zero TypeScript errors.
   - Run `bun test` in `web/` to verify all test suites pass.

5. Report:
   - Write full implementation report with build and test logs to `e:\Games\Ragnarok\rathena-solo-centric\.agents\worker_m2_m3_m4\handoff.md`.
   - Update `progress.md` and send a completion message to parent.
