# Web Portal: Player-Centric "My Data" & Solo Infrastructure

> Comprehensive architecture, database replication integration, financial formulas, and roadmap for the **rathena-solo-centric** web portal ecosystem.

---

## 🏛️ System Architecture & Replica Mandate

```
┌─────────────────────────────────────────────────────────────┐
│                    rAthena Solo Architecture                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [ rAthena Map / Char / Login Servers ]                    │
│                 │                                           │
│                 ▼ (Write / Read Game Transactions)          │
│   [ Primary MariaDB (rathena-db:3306) ]                     │
│                 │                                           │
│                 ▼ (GTID Binlog Replication)                 │
│   [ Replica MariaDB (rathena-db-replica:3307) ] ◄──┐       │
│                                                     │       │
│                                          (Read-Only SQL)    │
│                                                     │       │
│   [ Web Backend (Elysia.js / Bun) ] ────────────────┘       │
│                 │                                           │
│                 ▼ (Eden Treaty RPC / REST)                  │
│   [ Web Frontend (Vite + React Retro RO UI) ]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Replica Isolation Rules
1. **Zero Impact on Game Loop:** The web server strictly queries the **MariaDB Read-Only Replica (`rathena-db-replica`) on port `3307`** (or `db-replica:3306` in Docker network).
2. **Read-Only Enforcement:** Database connection uses user `ro_user` (`ro_password`) with `SELECT, SHOW VIEW` privileges, and the replica server enforces `read_only = ON`.
3. **No Direct Writes:** All player actions (deposits, stock purchases, combat) originate in-game via NPC scripts to prevent game state desynchronization while characters are loaded in map-server memory.

---

## 🗺️ Roadmap & Phase Breakdown

### ✅ MVP 1: "My Data" & Solo Finance (Delivered)
- **Financial & Economy Command Center (Top Priority):**
  - Consolidated Net Worth across all characters on the account.
  - Investment Banker principal + real-time interest calculation.
  - Midgard Municipal Stock Exchange portfolio valuation and P&L badges.
  - Live Market Ticker Watch with daily trend tracking.
- **Character Overview & Paperdoll:**
  - Account character switcher.
  - Classic RO Status Window (HP/SP gauges, Base/Job Level, 6 base stats, coordinates).
  - Equipment Paperdoll with refine levels (`+7`, `+10`), slotted cards, and live Divine Pride tooltips.
- **Solo Progression & Hunt Milestones:**
  - Lifetime monster kill counts from `solo_persistence_log` categorized into MvP Bosses, Mini-Bosses, and Field Monsters.
- **Public Armory & Hall of Fame:**
  - Searchable player lookup and server top rankings leaderboard.

### ⏳ MVP 2: Remote Intel & Market Utilities (Planned)
- **Monster Intel Web App:** Remote web version of System Tablet's Monster Intel app (drops, spawn locations, resistances).
- **Collection Log Viewer:** Regional collection discovery progress by zone.
- **Stock Market Alerts & Analytics:** High/low price alerts, dividend logs, and sector index charts.
- **Phased Municipal Stock Market Expansion:**
  - **Phase 7.1 (Schwarzwald):** `LHZ` (Rekenber Biotech Pure Growth), `EIN` (Heavy Industrial CapEx), `YUN` (Deep-Tech Venture), `HUG` (Leisure Micro-Cap).
  - **Phase 7.2 (Midgarts Expansion):** `ADB` (Kafra Blue-Chip Utility), `CMD` (High-Beta Casino/Leisure), `IZL` (Maritime Transport), `LUT` (Toy Factory Assembly).
  - **Phase 7.3 (Theocratic Sovereign & Commodities):** `RAC` (Freya Sovereign Gold Trust), `VEI` (Volcanic Energy), `JAW` (Luxury Hospitality), `UMB` (Ecotourism Raw Commodities).
  - **Phase 7.4 (Global Cultural & Agrarian Markets):** `LOU` (Herbal Healthcare), `MOS` (Forestry Value), `AMA`, `AYO`, `GON`, `BRA`, `DEW`, `MAL`.
  - **Phase 7.5 (Outliers & Interdimensional Markets):** `NIF` (Distressed Junk Bond), `DIC`/`SPL`/`MAN` (Ash Vacuum Frontier).

### ⏳ MVP 3: Web Admin & Economy Balancer (Planned)
- **Dynamic Pool Allocator:** Web interface to curate items in `custom_junk_pool` and daily junk sinks without touching scripts.
- **Inflation & Zeny Sinks Analytics:** Live telemetry on server money velocity, bank deposits, and item sink volumes.

---

## 🔢 Financial Formulas & Database Schema Mappings

### 1. Investment Bank (`npc/custom/investment_bank.txt`)
- **Table:** `acc_reg_num`
- **Keys:** `#INVEST_BALANCE` (Principal), `#INVEST_TIME` (Unix timestamp of last deposit)
- **Formulas:**
  $$\text{Days Accrued} = \min\left(10, \left\lfloor \frac{\text{CurrentTime} - \text{\#INVEST\_TIME}}{86400} \right\rfloor\right)$$
  $$\text{Accrued Interest} = \left\lfloor \frac{\text{\#INVEST\_BALANCE}}{100} \times \text{Days Accrued} \right\rfloor \quad (1\% \text{ per day, capped at } 10\%)$$
  $$\text{Total Payout} = \text{\#INVEST\_BALANCE} + \text{Accrued Interest}$$

### 2. Midgard Stock Exchange (`npc/custom/stock_exchange.txt`)
- **Tables:** `solo_stock_market` (Market Tickers), `solo_stock_player` (Player Holdings)
- **Formulas:**
  $$\text{Average Buy Price} = \frac{\text{total\_cost}}{\text{shares}}$$
  $$\text{Market Value} = \text{shares} \times \text{current\_price}$$
  $$\text{Unrealized P\&L} = \text{Market Value} - \text{total\_cost}$$
  $$\text{Unrealized P\&L \%} = \left(\frac{\text{Unrealized P\&L}}{\text{total\_cost}}\right) \times 100$$
  $$\text{Pending Dividends} = \text{shares} \times (\text{market.div\_acc} - \text{player.last\_claim\_acc})$$

### 3. Consolidated Net Worth
$$\text{Net Worth} = \sum (\text{char.zeny}) + \text{Bank Total Payout} + \sum (\text{Stock Market Values})$$

### 4. Monster Hunt & Loot Tracking (`npc/custom/shadow_tracking.txt`)
- **Table:** `solo_persistence_log` (`account_id`, `category`, `target_id`, `value`, `tstamp`)
- `category = 'KILL'`: `target_id` = Monster ID, `value` = Kill count
- `category = 'LOOT'`: `target_id` = Item ID, `value` = Discovery count

---

## 🛠️ Codebase Structure

```
web/
├── Dockerfile                         # Multi-stage production container definition
├── package.json                       # Bun monorepo workspace definition
├── tsconfig.base.json                 # Shared base TypeScript configuration
├── packages/
│   └── shared/                        # Shared Ragnarok types, enums, and constants
│       ├── src/constants/jobs.ts      # Renewal Job IDs and name mappings
│       ├── src/types/ragnarok.ts      # Characters, item slots, and paperdoll models
│       ├── src/types/economy.ts       # Bank, stock portfolio, and net worth models
│       └── src/types/progression.ts   # Kill log and milestone interfaces
└── apps/
    ├── server/                        # Elysia.js REST & RPC Backend
    │   ├── src/config.ts              # Env loader (defaulting to DB replica :3307)
    │   ├── src/db/pool.ts             # MySQL2 read-only connection pool
    │   ├── src/services/              # Auth, Economy, Character, and Tracking services
    │   └── src/routes/                # /api/auth, /api/economy, /api/character, /api/tracking
    └── client/                        # Vite + React Retro Ragnarok SPA
        ├── src/components/layout/     # Header, RoWindow, Titlebar
        ├── src/components/economy/    # NetWorthCard, BankWidget, StockPortfolio, MarketWatch
        ├── src/components/character/  # CharSelector, StatusWindow, Paperdoll (Divine Pride)
        ├── src/components/tracking/   # KillTracker (MvP/Mini-Boss/Normal filters)
        ├── src/components/armory/     # PublicSearch modal and rankings inspector
        └── src/context/AuthContext.tsx# JWT session and modal state provider
```

---

## 🐳 Docker Deployment

The web portal is integrated into `tools/docker/docker-compose.yml`:
```yaml
web-portal:
  image: "rathena-web-portal:local"
  container_name: "rathena-web-portal"
  restart: unless-stopped
  build:
    context: ../../web
    dockerfile: Dockerfile
  ports:
    - "3001:3000"
  environment:
    DB_HOST: "db-replica"
    DB_PORT: 3306
    DB_USER: "ro_user"
    DB_PASSWORD: "ro_password"
    DB_DATABASE: "ragnarok"
    PORT: 3000
  depends_on:
    - db-replica
```

Start via:
```powershell
docker compose -f tools/docker/docker-compose.yml up -d
```
Access at: `http://localhost:3001`
