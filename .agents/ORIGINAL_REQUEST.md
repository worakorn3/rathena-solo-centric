# Original User Request

## 2026-08-22T08:14:38Z

# Teamwork Project Prompt

Refactor and implement the Dispatch / Expedition UI in the Ragnarok Solo-Centric Web Portal, replacing generic AI-slop patterns (unicode emojis, ungrounded lore, layout overflow) with pixel-authentic Ragnarok styling, crisp Lucide SVGs, dynamic yield progress bars, and zero-bloat state synchronization.

Working directory: E:\Games\Ragnarok\rathena-solo-centric\web

## Requirements

### R1. Anti-Slop Visual & Thematic Grounding
- Eliminate all generic unicode emojis across all web components.
- Standardize iconography on Lucide React SVGs (`Compass`, `Timer`, `Coins`, `Sparkles`, `ShieldAlert`) and pixelated in-game RO item assets (`.ro-icon` via `/api/assets/item/...`).
- Align copy and lore with Ragnarok Online in-game conventions (Eden Group Logistics / Solo Expedition Operations).

### R2. Responsive Bento Grid Integration
- Integrate the Expedition interface seamlessly into the `StatusWindow.tsx` and `CharSelector.tsx` without breaking the existing Bento grid layout or causing vertical overflow.
- Include a 12-hour visual progress capacity bar (`bg-surface2` track with `bg-accent` fill) showing `HH:MM / 12h Cap`.

### R3. 3-State Interactive Machine
- **State A (Online):** Disabled with clear contextual tooltip/banner (*"Character currently logged into Ragnarok. Dispatches must be initiated while offline or via the System Tablet."*).
- **State B (Available/Offline):** Clear yield preview formula badge (`Lv.X Rate`), tactile "Deploy Expedition" button with loading/disabled state during API mutation.
- **State C (Active Expedition):** Live client-side tick counter (1s interval), calculated live yield summary (Base EXP, Job EXP, Zeny), and "Claim in-game via System Tablet" badge.

### R4. End-to-End Data & State Wiring
- Expose `dispatchStart` through `CharacterSummary` / `CharacterDetail` from the database.
- Wire optimistic state transitions upon dispatch deployment without requiring manual page refresh.

## Acceptance Criteria

### Visual & UX Quality
- [ ] Zero unicode emojis rendered in the UI; all icons use either crisp Lucide SVGs or pixel-rendered RO sprites (`.ro-icon`).
- [ ] Layout in `StatusWindow` does not overflow or misalign on 1080p desktop or mobile viewports.
- [ ] Active dispatch displays a live elapsed timer and an animated or solid 12h progress bar.

### Functional Verification
- [ ] Clicking "Deploy Expedition" triggers `POST /api/character/:charId/dispatch` and transitions UI to Active state.
- [ ] Characters on active dispatch display a status pill in `CharSelector` roster.
- [ ] Build passes cleanly with zero TypeScript errors (`bun run build` across monorepo).
