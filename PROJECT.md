# Project: Ragnarok Solo-Centric Web Portal Dispatch/Expedition UI

## Architecture
The Ragnarok Solo-Centric Web Portal is a full-stack Bun monorepo comprising:
- **Backend (`web/server`):** Elysia.js REST API connecting to MariaDB:
  - Read queries: Replica database (port 3307 / `db-replica:3306`) with `ro_user`.
  - Write queries: Primary database (port 3306 / `db:3306`) with rAthena credentials.
  - Character and registry data queries (`char`, `char_reg_num_db`).
- **Frontend (`web/src`):** React 18 + Vite + Tailwind CSS / Bento Grid tokens:
  - Character management, live status inspection (`StatusWindow.tsx`), roster selector (`CharSelector.tsx`).
  - Lucide React SVGs and in-game sprite renderers (`.ro-icon`).
  - Dispatch / Solo Expedition 3-State machine with live 1s client timer and yield calculations.
- **Game Scripts (`npc/custom/`):** rAthena server scripts:
  - `solo_mechanics.txt` & `system_tablet.txt`: Manages `#DISPATCH_START` / `DISPATCH_START` registry key, 12-hour max duration (43,200s), and claiming rewards in-game via System Tablet.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | DB & Model Schema: `dispatchStart` | Query `DISPATCH_START` from `char_reg_num_db` and include in `CharacterSummary` & `CharacterDetail` | M1 | ORIGINAL_REQUEST §R4 |
| F2 | Backend Mutation: `POST /api/character/:charId/dispatch` | Validate offline status, set `DISPATCH_START = UNIX_TIMESTAMP()` on primary DB, return updated character status | M1 | ORIGINAL_REQUEST §R4 |
| F3 | DB Query & Security Guardrails | Backtick SQL escaping, replica on 3307 for reads, primary on 3306 for writes | M1 | MISTAKES_AND_LEARNINGS |
| F4 | Anti-Slop Unicode Emoji Purge | Remove all generic emojis (`⚔️`, `🛡️`, `✨`, `⭐`, `📊`, `⚡`, `❤️`, `💙`, etc.) from all web components | M2 | ORIGINAL_REQUEST §R1 |
| F5 | Standardized Lucide & RO Iconography | Replace icons with crisp Lucide SVGs (`Compass`, `Timer`, `Coins`, `Sparkles`, `ShieldAlert`, etc.) and `.ro-icon` | M2 | ORIGINAL_REQUEST §R1 |
| F6 | In-Game Lore & Copy Alignment | Ground all terminology in Ragnarok Online lore: "Eden Group Logistics / Solo Expedition Operations", "Lv.X Rate" | M2 | ORIGINAL_REQUEST §R1 |
| F7 | 3-State Interactive Machine (Online State A) | Disabled with tooltip/banner: "Character currently logged into Ragnarok. Dispatches must be initiated while offline or via the System Tablet." | M3 | ORIGINAL_REQUEST §R3 |
| F8 | 3-State Interactive Machine (Available State B) | Yield preview formula badge (`Lv.X Rate`), tactile "Deploy Expedition" button with loading/disabled state | M3 | ORIGINAL_REQUEST §R3 |
| F9 | 3-State Interactive Machine (Active State C) | Live 1s interval tick counter, calculated Base EXP / Job EXP / Zeny yield summary, "Claim in-game via System Tablet" badge | M3 | ORIGINAL_REQUEST §R3 |
| F10 | 12-Hour Visual Progress Capacity Bar | `bg-surface2` track with `bg-accent` fill showing `HH:MM / 12h Cap` and percentage fill capped at 100% | M3 | ORIGINAL_REQUEST §R2 |
| F11 | Bento Grid Integration in `StatusWindow.tsx` | Embed Dispatch UI card cleanly in `StatusWindow` Bento layout without vertical overflow on 1080p desktop or mobile | M4 | ORIGINAL_REQUEST §R2 |
| F12 | Dispatch Status Pill in `CharSelector.tsx` | Display active expedition status indicator/pill in character roster | M4 | ORIGINAL_REQUEST §R4 |
| F13 | Optimistic State Synchronization | Instantly transition character to Active Expedition state upon dispatch deploy without page reload | M4 | ORIGINAL_REQUEST §R4 |
| F14 | Comprehensive E2E Testing Suite (Tiers 1-4) | Opaque-box requirement-driven test suite covering all features, boundary cases, pairwise interactions, and scenarios | M5 | ORIGINAL_REQUEST Acceptance |
| F15 | Adversarial Coverage Hardening (Tier 5) | White-box stress testing and adversarial gap verification by Challenger | M5 | Project Pattern |
| F16 | TypeScript Monorepo Build Validation | Zero TypeScript errors across monorepo (`bun run build`) | M5 | ORIGINAL_REQUEST Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend Data Model & Dispatch API | Expose `dispatchStart` in character models, implement `POST /api/character/:charId/dispatch` on Primary DB, maintain Read-Only replica on 3307 | none | DONE |
| M2 | Anti-Slop Visual Grounding & Iconography | Audit & eliminate all unicode emojis across web portal, integrate Lucide SVGs and `.ro-icon` sprites, update lore copy | none | DONE |
| M3 | 3-State Dispatch Component & Live Yield Ticker | Implement 3-state machine (Online, Available, Active), 1s elapsed ticker, 12h capacity progress bar, live yield calculator | M1, M2 | DONE |
| M4 | Bento Grid Integration & Optimistic State Sync | Integrate dispatch card in `StatusWindow.tsx`, roster status pill in `CharSelector.tsx`, optimistic cache updates | M3 | DONE |
| M5 | E2E Testing Suite & Adversarial Hardening | Pass 100% of E2E test suite (Tiers 1-4), Tier 5 Challenger adversarial hardening, `bun run build` validation | M4 | DONE |

## Interface Contracts
### Backend (`web/server`) ↔ Frontend (`web/src`)
- `CharacterSummary`:
  ```ts
  interface CharacterSummary {
    char_id: number;
    name: string;
    class: number;
    base_level: number;
    job_level: number;
    zeny: number;
    online: number; // 0 = offline, 1 = online
    dispatchStart: number | null; // unix timestamp in seconds, or null
  }
  ```
- `CharacterDetail`:
  ```ts
  interface CharacterDetail extends CharacterSummary {
    str: number;
    agi: number;
    vit: number;
    int: number;
    dex: number;
    luk: number;
    max_hp: number;
    hp: number;
    max_sp: number;
    sp: number;
    base_exp: number;
    job_exp: number;
    // ...
  }
  ```
- `POST /api/character/:charId/dispatch`:
  - Request: empty body or `{}`
  - Preconditions: Character must exist, `online === 0`, `dispatchStart === null || dispatchStart === 0`.
  - Response (Success): `{ success: true, dispatchStart: number, message: string }`
  - Response (Error): `{ success: false, error: string }` with HTTP 400 / 409.

### Game Mechanics Yield Formulas
- Max Duration Cap: `MAX_DISPATCH_SECONDS = 43200` (12 Hours).
- `effectiveSeconds = Math.min(Math.max(0, currentTimestamp - dispatchStart), 43200)`
- `baseExpYield = Math.floor((base_level * 15000 * effectiveSeconds) / 3600)`
- `jobExpYield = Math.floor((job_level * 10000 * effectiveSeconds) / 3600)`
- `zenyYield = Math.floor((base_level * 2500 * effectiveSeconds) / 3600)`

## Code Layout
- `web/src/components/`:
  - `DispatchCard.tsx`: 3-state dispatch UI component with live ticker and 12h progress bar.
  - `StatusWindow.tsx`: Bento grid status container hosting `DispatchCard.tsx`.
  - `CharSelector.tsx`: Character roster list with active dispatch status pills.
- `web/src/types/`:
  - `character.ts`: Data types including `dispatchStart`.
- `web/server/src/`:
  - `routes/character.ts`: Endpoints for fetching character details and deploying dispatches.
  - `db/`: Database clients (replica for reads on 3307, primary for writes on 3306).
