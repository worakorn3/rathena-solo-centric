# BRIEFING — 2026-08-22T08:19:45Z

## Mission
Thoroughly survey the web frontend in `web/src` for emojis, icons/sprites, Dispatch/Expedition UI, Bento grid styling/tokens, and character data contracts to support Dispatch UI refactoring.

## 🔒 My Identity
- Archetype: Explorer
- Roles: Frontend & UI Survey
- Working directory: e:\Games\Ragnarok\rathena-solo-centric\.agents\teamwork_preview_explorer_survey_1
- Original parent: e31bf2cb-604d-454e-868d-dc519e02d817
- Milestone: Preview Survey (Frontend & UI)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Zero source code modifications
- Document all findings, component boundaries, and recommendations in handoff.md

## Current Parent
- Conversation ID: e31bf2cb-604d-454e-868d-dc519e02d817
- Updated: 2026-08-22T08:19:45Z

## Investigation State
- **Explored paths**: `web/apps/client/src/`, `web/packages/shared/src/`, `web/apps/server/src/`, `npc/custom/system_tablet.txt`
- **Key findings**:
  - Found unicode emoji in `PublicSearch.tsx:139` (user-facing `👑`) and comments in `App.tsx:192,242,288,312`.
  - Iconography: Lucide icons standardized; RO sprites via `/api/assets/item/` and `.ro-icon`. Found raw HTML tag `<i data-lucide="square">` in `Paperdoll.tsx:88`.
  - Bento Layout: 12-column grid in Character tab (3/4/5 col split). `StatusWindow` has ample vertical space for 3-state Expedition Subcard without overflow.
  - Dispatch In-game Mechanics: `DispatchStart` in `char_reg_num`, 12h cap (720 min), formulas `BaseLevel * 10 * min`, `BaseLevel * 5 * min`, `BaseLevel * 2 * min`.
  - Data Contract Gaps: `CharacterSummary` lacks `dispatchStart?: number;` and server read queries omit `char_reg_num` join.
- **Unexplored areas**: None for frontend survey scope.

## Key Decisions Made
- Generated `findings.md` and `handoff.md` with complete 5-component breakdown, 3-state machine blueprint, and responsive design guidelines.

## Artifact Index
- findings.md — Detailed Frontend & UI Survey Report
- handoff.md — Comprehensive 5-Component Handoff Report
- progress.md — Heartbeat and progress tracker
- DISPATCH.md — Incoming task log
