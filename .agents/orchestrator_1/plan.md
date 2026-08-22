# Plan: Ragnarok Solo-Centric Web Portal Dispatch/Expedition UI

## Objective
Refactor and implement the Dispatch / Expedition UI in the Ragnarok Solo-Centric Web Portal, replacing generic AI-slop patterns with pixel-authentic Ragnarok styling, crisp Lucide SVGs, dynamic yield progress bars, and zero-bloat state synchronization.

## Phase 0: Survey & Scope Mapping (Top-Level Orchestrator)
- [ ] Dispatch 3 parallel Explorers:
  - Explorer 1 (Frontend & UI): Inspect `web/src` components (`StatusWindow.tsx`, `CharSelector.tsx`, emojis, css/tokens, bento grid layout).
  - Explorer 2 (Backend & API): Inspect `web/server` Elysia routes, endpoints (`/api/character/:charId/dispatch`), database queries (replica/port 3307), types (`CharacterSummary`, `CharacterDetail`).
  - Explorer 3 (Game Mechanics & NPC Scripts): Inspect dispatch mechanics in rAthena scripts (`npc/custom/solo_mechanics.txt`, `system_tablet.txt`), DB tables (`char_reg_num_db`, `char`), yield formulas, online status checks.
- [ ] Synthesize Survey findings into `PROJECT.md` (Feature Inventory, Architecture, Interface Contracts, Milestones).

## Phase 1: Dual Track Execution
### Track A: Implementation Track
- Milestone 1: Backend Data Model & API Wiring (Expose `dispatchStart`, deploy dispatch endpoint, DB queries with replica read/primary write rules).
- Milestone 2: Visual Grounding & Anti-Slop Iconography (Purge all generic unicode emojis in web components, standardize on Lucide SVGs + RO sprites `.ro-icon`).
- Milestone 3: 3-State Interactive Dispatch Component & Yield Ticker (Online disabled banner, Offline deploy with rate badge, Active with 1s elapsed timer, 12h capacity progress bar, yield calculator).
- Milestone 4: Bento Grid Layout Integration & Optimistic State Sync (Embed in `StatusWindow.tsx`, `CharSelector.tsx` status pill, optimistic state updates).

### Track B: E2E Testing Track (Opaque-Box Requirement-Driven)
- Spawn E2E Testing Orchestrator to build comprehensive test suite across Tiers 1-4.
- Output: `TEST_INFRA.md` and `TEST_READY.md`.

## Phase 2: Final Integration & Verification
- Run full E2E test suite (100% pass across all tiers).
- Phase 2 Adversarial Hardening (Tier 5 Challenger).
- Full TypeScript / Vite build validation (`bun run build`).
- Final Human Report to Sentinel.
