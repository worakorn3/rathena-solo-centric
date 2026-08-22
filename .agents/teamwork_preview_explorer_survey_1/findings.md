# Frontend & UI Survey Findings: Ragnarok Solo-Centric Web Portal

- **Author**: Explorer 1 (Frontend & UI Survey)
- **Target Repository**: `e:\Games\Ragnarok\rathena-solo-centric\web`
- **Survey Date**: 2026-08-22
- **Objective**: Survey the client codebase for emojis, iconography, bento styling, responsive constraints, character data structures, and dispatch/expedition UI grounding.

---

## 1. Executive Summary

The Ragnarok Solo-Centric Web Portal (`web/apps/client`) is a modern React 18 + Vite SPA built with Tailwind CSS, Lucide icons, and Elysia.js Eden backend. The visual design language follows a high-contrast dark **Bento Grid** paradigm (`bg-surface: #18181b`, `border-border: #27272a`, `text-primary: #f4f4f5`, `text-accent: #fbbf24`).

While the majority of the UI adheres to Bento tokens and clean Lucide iconography, several **AI-slop remnants** (unicode emojis in comments and public search titles), **unused legacy components** (`RoWindow.tsx` with outdated CSS classes), **malformed icon tags** (`Paperdoll.tsx:88`), and **data contract omissions** (lack of `dispatchStart` exposure in `CharacterSummary` and SQL queries) were identified.

This document details all observations, architectural contracts, and the complete design blueprint for the **Dispatch / Expedition UI** integration into `StatusWindow.tsx` and `CharSelector.tsx`.

---

## 2. Exhaustive Unicode Emoji Audit

A complete scan of all source files in `web/apps/client/src/`, `web/packages/shared/src/`, and `web/apps/server/src/` revealed the following emoji occurrences:

| File Path | Line Number | Code Snippet / Context | Impact Type | Remediation |
|---|---|---|---|---|
| `apps/client/src/App.tsx` | Line 192 | `{/* Tab 1: 💰 FINANCIAL HQ */}` | Code comment / AI-slop | Remove emoji; standardize on `{/* Tab 1: Financial HQ */}` |
| `apps/client/src/App.tsx` | Line 242 | `{/* Tab 2: ⚔️ CHARACTER & GEAR */}` | Code comment / AI-slop | Remove emoji; standardize on `{/* Tab 2: Character & Paperdoll */}` |
| `apps/client/src/App.tsx` | Line 288 | `{/* Tab 3: 📜 SOLO PROGRESSION */}` | Code comment / AI-slop | Remove emoji; standardize on `{/* Tab 3: Solo Progression */}` |
| `apps/client/src/App.tsx` | Line 312 | `{/* Tab 4: 🎯 DAILY BOUNTIES */}` | Code comment / AI-slop | Remove emoji; standardize on `{/* Tab 4: Daily Bounties */}` |
| `apps/client/src/components/armory/PublicSearch.tsx` | Line 139 | `: \`👑 Server Top Rankings (Hall of Fame)\`` | **User-Facing UI Header** | Replace `👑` with crisp Lucide React `<Crown className="w-4 h-4 text-accent inline mr-1.5" />` |

**Audit Verdict**: Zero unicode emojis should be present in runtime output or source comments. All UI headers and indicators must use Lucide SVGs.

---

## 3. Iconography & Asset Rendering System

The web portal employs a dual-iconography pipeline:

### A. Lucide React SVGs (`lucide-react`)
Used for all UI controls, navigational tabs, metrics indicators, status badges, and interactive tooltips.
- **Current Active Icons**:
  - Navigation / Headers: `BarChart3`, `Shield`, `Skull`, `Target`, `Coins`, `Search`, `User`, `LogOut`, `RefreshCw`, `Database`
  - Economy & Stats: `Landmark`, `TrendingUp`, `Clock`, `Briefcase`, `Activity`, `ArrowUpRight`, `ArrowDownRight`, `Zap`, `Info`
  - Hunting & Roster: `Crown`, `Swords`, `Award`, `MapPin`, `ChevronRight`, `AlertCircle`, `Lock`, `X`, `ExternalLink`, `Sparkles`
- **Required Icons for Dispatch System**:
  - `Compass` (Expedition / Mission deploy action & headers)
  - `Timer` / `Clock` (Elapsed mission duration & 12h cap meter)
  - `Coins` (Estimated and accumulated Zeny rewards)
  - `Sparkles` (EXP rewards and claim notice)
  - `ShieldAlert` (Online character warning / lock tooltip)
  - `CheckCircle2` / `AlertTriangle` (Dispatch feedback)

### B. Pixelated Ragnarok Online Item & Monster Sprites
Used strictly for in-game item representation, cards, equipment slots, and monster avatars.
- **Item Sprite Route**: `/api/assets/item/:nameId` via `getItemIconUrl(nameId)` (`lib/assets.ts`)
- **Monster Sprite Route**: `/api/assets/mob/:mobId` via `getMobSpriteUrl(mobId)` (`lib/assets.ts`)
- **CSS Rendering Rules (`index.css`)**:
  ```css
  .ro-icon {
    @apply w-6 h-6 object-contain;
    image-rendering: pixelated;
    filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));
  }
  .ro-mob {
    @apply object-contain;
    image-rendering: pixelated;
  }
  ```
- **Zeny Coin Icon Standard**:
  `<img src="/api/assets/item/7036" className="w-3.5 h-3.5 object-contain ro-icon" style={{filter: 'none'}} alt="Z" />` (RO Item ID 7036: Zeny coin bag).

### C. Iconography Anomalies Identified
1. **`Paperdoll.tsx:88`**: `<i data-lucide="square" className="w-3 h-3"></i>` is written as a raw vanilla Lucide HTML tag instead of importing `<Square className="w-3 h-3" />` from `lucide-react`.
2. **`StatusWindow.tsx:4` & `CharSelector.tsx:3`**: `import { Shield } from "lucide-react";` is imported but never referenced in either component.
3. **`RoWindow.tsx`**: Legacy file containing unconfigured Tailwind classes (`text-ro-gold`, `font-cinzel`, `border-ro-borderLight/30`), completely unused across the application.

---

## 4. Bento Grid Styling & Responsive Constraints

### A. Design Tokens (`apps/client/tailwind.config.js`)
- **Background**: `#09090b` (Deep dark background)
- **Surface**: `#18181b` (Primary Bento Card background)
- **Surface2**: `#27272a` (Card inner containers, table rows, progress bar tracks, hover states)
- **Border**: `#27272a` (Subtle 1px boundaries)
- **Primary Text**: `#f4f4f5` (High contrast pure white/zinc)
- **Muted Text**: `#a1a1aa` (Labels, secondary metrics, subtitles)
- **Accent**: `#fbbf24` (Amber-400 / RO Gold for highlights, buttons, 12h progress bar fill, active items)
- **Status Colors**:
  - `success`: `#4ade80` (Online pill, HP bar, positive PnL)
  - `info`: `#60a5fa` (SP bar, links, neutral events)
  - `danger`: `#f87171` (Offline warning, MvP skull, negative PnL)
- **Stat Tokens**: `ro-str: #f87171`, `ro-agi: #fbbf24`, `ro-vit: #4ade80`, `ro-int: #60a5fa`, `ro-dex: #c084fc`, `ro-luk: #fb923c`

### B. Layout Hierarchy on Desktop (1080p Viewport, `1920x1080`)
Inside `<main className="max-w-7xl mx-auto w-full p-6 space-y-6 flex-1 flex flex-col">`:
The **Character Tab** uses a 12-column Bento Grid:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  {/* Column 1 (3 cols): Character Roster */}
  <CharSelector className="lg:col-span-3" />
  
  {/* Column 2 (4 cols): Status, Stats & Dispatch System */}
  <StatusWindow className="lg:col-span-4" />
  
  {/* Column 3 (5 cols): Equipment Paperdoll */}
  <Paperdoll className="lg:col-span-5" />
</div>
```
- **Total Span**: `3 + 4 + 5 = 12` columns.
- **Vertical Alignment**: All three cards have `h-full` and flex column structures.
  - `CharSelector`: ~450px max height with scrollable roster (`max-h-[400px]`).
  - `Paperdoll`: ~620px total height with 8 equipment slot rows and inspect preview.
  - `StatusWindow`: With Header (60px), HP/SP (70px), Stats (140px), Dispatch Card (180px), and Footer (60px), total height is ~510-610px. This aligns symmetrically with `Paperdoll` on 1080p desktop with zero vertical overflow.

### C. Responsive Mobile Layout (`< 1024px`)
- Collapses to `grid-cols-1 gap-6`.
- Flow: `CharSelector` -> `StatusWindow` -> `Paperdoll`.
- Full-width Bento cards with internal horizontal wrapping (`flex-wrap`).

---

## 5. In-Game Dispatch Grounding vs Web UI Gap Analysis

### A. In-Game NPC Mechanics (`npc/custom/system_tablet.txt`)
From `npc/custom/system_tablet.txt` (Option 4: Dispatch Operations):
- **Lore Context**: Eden Group Logistics / Solo Expedition Operations.
- **Activation Table**: `char_reg_num` where `key = 'DispatchStart'`, `index = 0`, `value = UNIX_TIMESTAMP()`.
- **Duration Cap**: 720 minutes (12 Hours) max (`if (.@elapsed_min > 720) .@elapsed_min = 720;`).
- **Claim Threshold**: Minimum 1 minute elapsed (`if (.@elapsed_min < 1)`).
- **Yield Formulas**:
  - Base EXP: `BaseLevel * 10 * elapsed_minutes` (Capped at 720 min: `BaseLevel * 7,200`)
  - Job EXP: `BaseLevel * 5 * elapsed_minutes` (Capped at 720 min: `BaseLevel * 3,600`)
  - Zeny: `BaseLevel * 2 * elapsed_minutes` (Capped at 720 min: `BaseLevel * 1,440`)
- **In-Game Claiming Rule**: Expeditions must be collected in-game via the System Tablet. The web portal functions as a remote deployment hub and real-time mission monitor.

### B. Current Web Backend & Database Gaps
1. `web/packages/shared/src/types/ragnarok.ts`:
   - `CharacterSummary` and `CharacterDetail` interfaces lack `dispatchStart?: number;`.
2. `web/apps/server/src/services/character.service.ts`:
   - `getCharactersByAccount` and `getCharacterDetail` only query the `char` table.
   - They do **NOT** join or query `char_reg_num` for `DispatchStart`.
   - `startDispatch` already exists and writes `REPLACE INTO \`char_reg_num\` (\`char_id\`, \`key\`, \`index\`, \`value\`) VALUES (?, 'DispatchStart', 0, UNIX_TIMESTAMP())`, but the data is never returned in read queries.

---

## 6. 3-State Interactive Machine Architecture for Dispatch UI

To satisfy Requirement R3, the Dispatch component in `StatusWindow.tsx` will evaluate three strictly defined operational states:

```
                  ┌────────────────────────────────────────┐
                  │          State A: Online In-Game       │
                  │   (char.online === true)               │
                  │   - Status Pill: Online (Green)        │
                  │   - Button: Disabled                   │
                  │   - Tooltip: Active session warning    │
                  └────────────────────────────────────────┘
                                      │
                                      ▼ (Character logs out)
                  ┌────────────────────────────────────────┐
                  │       State B: Available / Offline     │
                  │   (!char.online && dispatchStart === 0)│
                  │   - Status Pill: Offline (Muted)       │
                  │   - Yield Preview: Lv.X Rate Badge     │
                  │   - Button: "Deploy Expedition"        │
                  └────────────────────────────────────────┘
                                      │
                                      ▼ (User clicks Deploy / POST /dispatch)
                  ┌────────────────────────────────────────┐
                  │       State C: Active Expedition       │
                  │   (!char.online && dispatchStart > 0)  │
                  │   - Status Pill: On Expedition (Amber) │
                  │   - 12h Progress Bar: HH:MM / 12h Cap  │
                  │   - Live Tick Counter (1s interval)    │
                  │   - Live Yield Summary (EXP/Zeny)      │
                  │   - Notice: "Claim in-game via Tablet" │
                  └────────────────────────────────────────┘
```

### Detailed State Specifications:

#### State A: Online in Ragnarok
- **Condition**: `char.online === true`
- **Visuals**:
  - Container: `bg-surface2/30 border border-border/50 rounded-lg p-3.5`
  - Header: `<Compass className="w-4 h-4 text-muted" /> Eden Solo Logistics`
  - Alert Banner: `bg-danger/10 border border-danger/20 text-danger text-xs p-2.5 rounded flex items-center gap-2`
  - Banner Copy: *"Character currently logged into Ragnarok. Dispatches must be initiated while offline or via the System Tablet."*
  - Deploy Button: Hidden or disabled (`opacity-50 cursor-not-allowed`).

#### State B: Available (Offline & Ready)
- **Condition**: `!char.online && (!char.dispatchStart || char.dispatchStart === 0)`
- **Visuals**:
  - Container: `bg-surface2/40 border border-border rounded-lg p-3.5 space-y-3`
  - Header: `<Compass className="w-4 h-4 text-accent" /> Eden Solo Expedition`
  - Rate Preview Badge: `bg-accent/10 border border-accent/20 text-accent text-xs font-mono px-2.5 py-1.5 rounded-md flex justify-between`
    - `Base EXP: +{char.baseLevel * 10}/min`
    - `Job EXP: +{char.baseLevel * 5}/min`
    - `Zeny: +{char.baseLevel * 2}/min`
  - Action Button: `<button onClick={handleDeploy} disabled={isDeploying} className="w-full bg-accent hover:bg-accent/90 text-background font-bold text-xs py-2 px-3 rounded-md transition-all flex items-center justify-center gap-2">`
    - Shows `<Compass className="w-4 h-4" /> Deploy Expedition` or `<RefreshCw className="w-4 h-4 animate-spin" /> Deploying...`
  - Subtext: *"Passive 12-hour offline resource expedition. Rewards scale per minute."*

#### State C: Active Expedition (Deployed & Gathering)
- **Condition**: `!char.online && char.dispatchStart > 0`
- **Visuals**:
  - Container: `bg-surface2/50 border border-accent/30 rounded-lg p-3.5 space-y-3 relative overflow-hidden`
  - Glow Accent: Top border or subtle amber ambient glow.
  - Header:
    - Left: `<Compass className="w-4 h-4 text-accent animate-pulse" /> Active Expedition`
    - Right: `<span className="font-mono text-xs font-bold text-accent">{formatTimer(elapsedSec)}</span>`
  - 12-Hour Progress Bar:
    - Track: `w-full bg-surface2 rounded-full h-2 overflow-hidden shadow-inner`
    - Fill: `h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(251,191,36,0.5)] transition-all duration-1000` (`width: ${min(100, (elapsedMin / 720) * 100)}%`)
    - Sub-labels: `text-[10px] text-muted font-mono flex justify-between` -> `{formatDuration(elapsedMin)}` vs `12h Cap`
  - Live Yield Summary (3-column grid):
    - Base EXP: `+{accumulatedBaseExp.toLocaleString()} Base`
    - Job EXP: `+{accumulatedJobExp.toLocaleString()} Job`
    - Zeny: `+{accumulatedZeny.toLocaleString()} Z` (with `.ro-icon` 7036)
  - Claim Pill: `bg-info/10 border border-info/20 text-info text-[11px] p-2 rounded flex items-center justify-between`
    - Left: `<Sparkles className="w-3.5 h-3.5 shrink-0" /> Claim in-game via System Tablet`
    - Right: `Ready` (if elapsed >= 1 min) or `Initializing`

---

## 7. Roster Indicator in `CharSelector.tsx`

In `CharSelector.tsx`, characters currently on active dispatch will display an amber status pill:
```tsx
<div className="font-bold text-sm text-primary flex items-center justify-between">
  <span className="truncate">{char.name}</span>
  <div className="flex items-center gap-1.5 shrink-0">
    {char.online ? (
      <span className="flex items-center gap-1 text-[10px] font-mono text-success font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
        Online
      </span>
    ) : char.dispatchStart && char.dispatchStart > 0 ? (
      <span className="flex items-center gap-1 text-[10px] font-mono text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded font-semibold">
        <Compass size={10} className="animate-spin text-accent" style={{ animationDuration: '6s' }} />
        Expedition
      </span>
    ) : null}
  </div>
</div>
```

---

## 8. State Synchronization & Optimistic UI Flow

1. **User Action**: Clicking "Deploy Expedition" in `StatusWindow`.
2. **Optimistic Mutation**:
   - Immediately sets local character's `dispatchStart = Math.floor(Date.now() / 1000)`.
   - Sends `POST /api/character/:charId/dispatch` via `api.post`.
3. **Rollback Safety**: If the API request fails (e.g. 401/403 or network error), rollback `dispatchStart` to `0` and display an error alert.
4. **Roster Sync**: The parent character list state in `App.tsx` (`characters`) is updated in place, instantly reflecting the amber "Expedition" badge in `CharSelector` without a page refresh.

---

## 9. Component Implementation Boundaries

| File | Type | Changes Required |
|---|---|---|
| `web/packages/shared/src/types/ragnarok.ts` | Shared Type | Add `dispatchStart?: number;` to `CharacterSummary`. |
| `web/apps/server/src/services/character.service.ts` | Server Query | Update `CHAR_COLUMNS` or join `char_reg_num` on `key = 'DispatchStart'` to map `dispatchStart: Number(row.dispatch_start) || 0`. |
| `web/apps/client/src/components/character/StatusWindow.tsx` | UI Component | Integrate 3-State Expedition Subcard, live 1s tick timer, 12h progress bar, Lucide icons, yield calculations, and deploy callback. Clean unused `Shield` import. |
| `web/apps/client/src/components/character/CharSelector.tsx` | UI Component | Add active expedition badge with `Compass` icon in character card list. Clean unused `Shield` import. |
| `web/apps/client/src/App.tsx` | UI Component | Remove emoji comments on lines 192, 242, 288, 312. Provide `onDispatchSuccess` callback to mutate `characters` and `selectedCharDetail` optimistically. |
| `web/apps/client/src/components/armory/PublicSearch.tsx` | UI Component | Replace unicode emoji `👑` with `<Crown className="w-4 h-4 text-accent inline mr-1.5" />`. |
| `web/apps/client/src/components/character/Paperdoll.tsx` | UI Component | Fix line 88 `<i data-lucide="square">` to use `<Square className="w-3 h-3" />` from `lucide-react`. |

---
