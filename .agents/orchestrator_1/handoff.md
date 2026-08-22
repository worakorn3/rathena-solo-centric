# Milestone 2 & Milestone 3 Consolidated Execution Handoff

## Completed Work:
- **Milestone 1: Backend Data Model & Dispatch API**:
  - `dispatchStart` exposed in `CharacterSummary` & `CharacterDetail` from `char_reg_num` (`DispatchStart`).
  - Read queries query replica on 3307; write mutations query primary on 3306.
  - Backtick escaping on SQL queries.
  - `POST /api/character/:charId/dispatch` implemented with 400 (online check) and 409 (duplicate dispatch check).
  - Milestone 1 GATE PASSED (Approve from 2 Reviewers, 2 Challengers, Clean from Forensic Auditor).
- **Survey Phase**:
  - Feature Inventory (F1-F16) cataloged in `PROJECT.md`.
  - `TEST_INFRA.md` and `TEST_READY.md` published with 45+ test cases across Tiers 1-4.
- **Milestone 2 Survey**:
  - Complete emoji audit and replacement mapping to Lucide SVGs & `.ro-icon`.
  - Ragnarok lore copy finalized.

## Remaining Milestones for Successor:
1. **Milestone 2: Anti-Slop Visual Grounding & Iconography**:
   - Worker implements emoji purge and Lucide SVG replacement across `web/src/components/CharSelector.tsx`, `StatusWindow.tsx`, `MarketPulse.tsx`, `Inventory.tsx`, `Header.tsx`.
   - Gate verification (Reviewers, Challengers, Auditor).
2. **Milestone 3: 3-State Interactive Dispatch Component & Live Yield Ticker**:
   - Worker implements `DispatchCard.tsx` (State A Online disabled banner, State B Available deploy + rate badge, State C Active 1s ticker, live yield calculations, 12h progress bar `bg-surface2` / `bg-accent`).
   - Gate verification.
3. **Milestone 4: Bento Grid Integration & Optimistic State Sync**:
   - Integrate `DispatchCard.tsx` into `StatusWindow.tsx` Bento layout.
   - Integrate roster status pill into `CharSelector.tsx`.
   - Wire optimistic dispatch state transition in character context/hook.
   - Gate verification.
4. **Milestone 5: Final E2E Test Verification & Adversarial Hardening**:
   - Execute full test suite `bun test` across Tiers 1-4.
   - Tier 5 Challenger white-box adversarial stress test.
   - `bun run build` monorepo validation.
   - Final audit and completion report to Sentinel.

## Key Constraints & Artifacts:
- `PROJECT.md` at project root.
- `ORIGINAL_REQUEST.md` at `.agents/ORIGINAL_REQUEST.md`.
- `TEST_INFRA.md` and `TEST_READY.md` at project root.
- Primary parent conversation ID: `637fba26-4449-44ab-abaa-8407ab80b297`.
