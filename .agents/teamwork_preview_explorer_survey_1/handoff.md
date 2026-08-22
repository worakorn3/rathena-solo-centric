# Handoff Report: Frontend & UI Survey for Dispatch / Expedition Refactoring

- **Agent**: Explorer 1 (Frontend & UI Survey)
- **Working Directory**: `e:\Games\Ragnarok\rathena-solo-centric\.agents\teamwork_preview_explorer_survey_1`
- **Date**: 2026-08-22
- **Handoff Type**: Hard (Task Complete)

---

## 1. Observation

Direct code observations from the `web/` and `npc/` codebase:

### 1.1 Emoji Audit Findings
- **`web/apps/client/src/App.tsx:192`**: `{/* Tab 1: 💰 FINANCIAL HQ */}`
- **`web/apps/client/src/App.tsx:242`**: `{/* Tab 2: ⚔️ CHARACTER & GEAR */}`
- **`web/apps/client/src/App.tsx:288`**: `{/* Tab 3: 📜 SOLO PROGRESSION */}`
- **`web/apps/client/src/App.tsx:312`**: `{/* Tab 4: 🎯 DAILY BOUNTIES */}`
- **`web/apps/client/src/components/armory/PublicSearch.tsx:139`**:
  ```tsx
  : `👑 Server Top Rankings (Hall of Fame)`
  ```
  *(Visible user-facing UI header)*

### 1.2 Iconography & Sprite Usage
- **Lucide Icons**: Standardized across components using `lucide-react`. Required icons for dispatch: `Compass`, `Timer` (or `Clock`), `Coins`, `Sparkles`, `ShieldAlert`.
- **RO Item Sprites**: Rendered via `/api/assets/item/:nameId` using helper `getItemIconUrl(nameId)` in `lib/assets.ts`. Styled with `.ro-icon` (`image-rendering: pixelated; filter: drop-shadow(...)`).
  - Standard Zeny sprite: `<img src="/api/assets/item/7036" className="w-3 h-3 object-contain ro-icon" style={{filter: 'none'}} alt="Z" />`.
- **Anomalies**:
  - `web/apps/client/src/components/character/Paperdoll.tsx:88`: `<i data-lucide="square" className="w-3 h-3"></i>` is a raw HTML element rather than the React `<Square className="w-3 h-3" />` component from `lucide-react`.
  - `StatusWindow.tsx:4` and `CharSelector.tsx:3`: `import { Shield } from "lucide-react";` is unused.
  - `web/apps/client/src/components/layout/RoWindow.tsx`: Contains deprecated classes (`ro-window`, `ro-titlebar`, `text-ro-gold`, `font-cinzel`) and is not imported or used anywhere.

### 1.3 Bento Grid Layout & Responsive Constraints
- **Desktop (1080p Viewport, `lg:` breakpoint >= 1024px, max container `max-w-7xl`)**:
  - In `App.tsx` (Character Tab):
    - `CharSelector`: `bento-card lg:col-span-3 flex flex-col gap-2 h-full` (~300px width, max roster height 400px).
    - `StatusWindow`: `bento-card lg:col-span-4 flex flex-col gap-6 h-full` (~400px width).
    - `Paperdoll`: `bento-card lg:col-span-5 flex flex-col h-full` (~500px width, ~620px height).
  - Total column span is `3 + 4 + 5 = 12`.
  - Adding the Expedition module to `StatusWindow` (~180px height) brings `StatusWindow`'s total height to ~580-620px, aligning symmetrically with `Paperdoll` with zero vertical overflow.
- **Mobile Viewport (`< 1024px`)**:
  - Layout collapses to `grid-cols-1 gap-6` with full-width cards stacking naturally.

### 1.4 In-Game Mechanics & Data Contracts
- **In-Game NPC Logic (`npc/custom/system_tablet.txt:165-226`)**:
  - Registry: `char_reg_num` with `key = 'DispatchStart'`, `index = 0`, `value = UNIX_TIMESTAMP()`.
  - Cap: 720 minutes (12 Hours) maximum (`if (.@elapsed_min > 720) .@elapsed_min = 720;`).
  - Yields per minute:
    - Base EXP: `BaseLevel * 10 * elapsed_min`
    - Job EXP: `BaseLevel * 5 * elapsed_min`
    - Zeny: `BaseLevel * 2 * elapsed_min`
  - In-Game Collection: Claimed via the System Tablet.
- **Current Data Gaps**:
  - `packages/shared/src/types/ragnarok.ts`: `CharacterSummary` does not declare `dispatchStart?: number;`.
  - `apps/server/src/services/character.service.ts`: `getCharactersByAccount` and `getCharacterDetail` do not join `char_reg_num` to retrieve `DispatchStart`.
  - `apps/server/src/routes/character.routes.ts`: `POST /api/character/:charId/dispatch` is already implemented and writes to `char_reg_num`, but read queries omit the field.

---

## 2. Logic Chain

1. **Anti-Slop Visual Alignment**:
   - `PublicSearch.tsx:139` is the only active user-facing string rendering a raw Unicode emoji (`👑`). Replacing this with `<Crown className="w-4 h-4 text-accent inline mr-1.5" />` and stripping emoji comments in `App.tsx` completely rids the frontend of AI-slop visual patterns.
   - Fixing the malformed `<i data-lucide="square">` in `Paperdoll.tsx:88` and pruning unused `Shield` imports restores clean component hygiene.

2. **Bento Grid & Visual Capacity Integration**:
   - The current `StatusWindow.tsx` has plenty of vertical headroom (~350px currently vs ~620px in `Paperdoll`).
   - Inserting an Eden Group Expedition sub-card inside `StatusWindow.tsx` between the Stats Grid and the Footer provides an ergonomic, unified character control hub without disturbing the 3-card (3/4/5 col) Bento Grid layout.
   - The 12-hour progress bar uses native Bento tokens: `bg-surface2` for the track and `bg-accent` with glowing amber shadow (`shadow-[0_0_8px_rgba(251,191,36,0.5)]`) for the fill, matching the aesthetic of `BankWidget` and `KillTracker`.

3. **3-State Interactive Machine**:
   - **State A (`char.online === true`)**: Renders an alert banner warning that the character is in an active game session; deployment is disabled.
   - **State B (`!char.online && !char.dispatchStart`)**: Displays the Eden Expedition preview formula badge (`Lv.X Rate`) and a tactile "Deploy Expedition" button (`Compass` icon) with mutation loading state.
   - **State C (`!char.online && char.dispatchStart > 0`)**: Starts a 1s client-side tick timer, fills the 12h progress bar (`HH:MM / 12h Cap`), displays accumulated yields (Base EXP, Job EXP, Zeny with `.ro-icon`), and shows the "Claim in-game via System Tablet" badge.

4. **Data & State Synchronization**:
   - Adding `dispatchStart?: number;` to `CharacterSummary` allows both `CharSelector` and `StatusWindow` to derive dispatch state directly from props.
   - When the user triggers "Deploy Expedition", mutating local React state optimistically (setting `dispatchStart = Math.floor(Date.now() / 1000)`) updates `StatusWindow` and triggers the amber "Expedition" badge in `CharSelector` instantaneously without page reloads.

---

## 3. Caveats

1. **In-Game Claiming Exclusivity**:
   - The in-game script (`system_tablet.txt`) handles the actual granting of EXP and Zeny via `getexp` and `Zeny += ...`, followed by resetting `DispatchStart = 0`. The web interface cannot directly award in-game EXP to a logged-out character table without complex rAthena char-server sync. Therefore, the web UI properly designates missions as "Claim in-game via System Tablet".
2. **Timezone / Clock Drift**:
   - Client-side elapsed time is computed as `Math.floor(Date.now() / 1000) - char.dispatchStart`. If the client machine clock is significantly skewed relative to the MySQL server `UNIX_TIMESTAMP()`, elapsed time might show a minor offset (within seconds).

---

## 4. Conclusion

The frontend architecture is well-structured and primed for the Dispatch / Expedition UI implementation. The required modifications are cleanly scoped to:
1. **Shared Types**: Add `dispatchStart?: number;` to `CharacterSummary` in `packages/shared/src/types/ragnarok.ts`.
2. **Server Service**: Join `char_reg_num` in `CharacterService.getCharactersByAccount` and `getCharacterDetail` to expose `dispatchStart`.
3. **`StatusWindow.tsx`**: Add the 3-state Expedition Subcard with 1s interval tick, 12h progress bar, live yield calculation, and Lucide icons.
4. **`CharSelector.tsx`**: Add the active expedition badge pill (`Compass` icon) to character cards.
5. **`App.tsx` & `PublicSearch.tsx`**: Clean emoji remnants and wire optimistic mutation callbacks.

---

## 5. Verification Method

To verify the survey findings and ensure future implementation compliance:

1. **Emoji & Icon Verification**:
   - Run grep for unicode emojis across `web/`:
     Ensure 0 matches in UI rendering lines.
   - Inspect `PublicSearch.tsx` and `Paperdoll.tsx` for clean Lucide React component imports.
2. **TypeScript & Monorepo Build**:
   - Run from `web/`:
     ```powershell
     cd e:\Games\Ragnarok\rathena-solo-centric\web
     bun run build
     ```
     Ensure all packages (`@rathena/shared`, `client`, `server`) compile with zero type errors.
3. **Visual & Responsive Inspection**:
   - Open portal at `http://localhost:5173` (or production port).
   - Test 1080p desktop viewport (`1920x1080`) to confirm zero overflow in `StatusWindow` vs `Paperdoll`.
   - Test mobile viewport (`375px` / `768px`) to confirm vertical card stacking.
4. **State Machine Verification**:
   - Test State A: Log character into game -> Observe online warning in `StatusWindow` and disabled deploy button.
   - Test State B: Log character out -> Observe rate preview badge and active "Deploy Expedition" button.
   - Test State C: Click "Deploy Expedition" -> Observe instant transition to active expedition with live timer, progress bar, and roster badge in `CharSelector`.
