## 2026-08-22T08:20:02Z
You are Reviewer 1 for Milestones 2, 3, and 4 (Anti-Slop Grounding, 3-State Dispatch UI, Bento Grid Integration & Optimistic State Sync).
Your working directory is: e:\Games\Ragnarok\rathena-solo-centric\.agents\reviewer_m2_m3_m4_1

Read:
- e:\Games\Ragnarok\rathena-solo-centric\.agents\ORIGINAL_REQUEST.md
- e:\Games\Ragnarok\rathena-solo-centric\PROJECT.md
- e:\Games\Ragnarok\rathena-solo-centric\TEST_READY.md

Task:
1. Objectively and adversarially review the code changes in `web/src/`:
   - `web/src/components/CharSelector.tsx`
   - `web/src/components/StatusWindow.tsx`
   - `web/src/components/DispatchCard.tsx`
   - `web/src/components/PublicSearch.tsx`
   - `web/src/components/Paperdoll.tsx`
   - `web/src/App.tsx`
2. Verify all Acceptance Criteria:
   - Zero unicode emojis rendered in UI; crisp Lucide SVGs or pixel-rendered RO sprites (.ro-icon).
   - Layout in StatusWindow does not overflow/misalign on 1080p desktop or mobile viewports.
   - Active dispatch displays live elapsed timer (1s tick) and animated or solid 12h progress bar (bg-surface2 track, bg-accent fill showing HH:MM / 12h Cap).
   - 3-State machine: Online warning banner, Offline deploy + rate formula badge, Active live yield summary + Tablet claim badge.
   - Clicking "Deploy Expedition" triggers POST /api/character/:charId/dispatch and optimistically transitions UI to Active state.
   - Characters on active dispatch display a status pill in CharSelector roster.
3. Run `bun run build` and `bun test` in `web/`.
4. Update `progress.md`, write your review report to `e:\Games\Ragnarok\rathena-solo-centric\.agents\reviewer_m2_m3_m4_1\handoff.md` with explicit verdict (APPROVE or REQUEST_CHANGES), and send a completion message to parent.
