# Midgard Stock Exchange & Municipal Expansion Roadmap (Phases 6–12)

🔗 **Backlink:** [Main Implementation Plan](../implementation_plan.md)

> [!NOTE]  
> This specification documents the architecture, database migrations, simulation engines, and phased municipal rollout for the Midgard Stock Exchange (MSE) spanning Phases 6 through 12.

---

## 1. Phase 6: Investment Engine Extraction (Decoupling) — 👱‍♀️ Ponytail Edition

### The Problem
Originally, `stock_exchange.txt` contained complex market simulation logic (Hourly Drift, Midnight DRIP) running via in-game `OnClock` triggers. This caused game server lag and stopped the market simulation whenever the map server was offline.

### The Decoupled Architecture
1. **Move Simulation to Web Backend (Elysia.js):**
   - Removed all heavy `OnClock` compute loops from rAthena NPC scripts.
   - Replaced with a lightweight `cron` scheduler in the Elysia.js backend (`web/apps/server/src/services/marketCron.ts`) running hourly price shifts and dividend payouts.
2. **Primary DB Relaxation for Economy Mutations:**
   - Granted Elysia backend a dedicated secondary write connection to Primary MariaDB (Port 3306), restricted strictly to `solo_stock_*` tables and the character `zeny` column.
3. **Atomic Web Transactions in 1 Line of SQL:**
   - Prevent Zeny duplication/desync between web trades and active in-game sessions with atomic SQL:
   ```sql
   UPDATE `char` SET zeny = zeny - ? WHERE account_id = ? AND online = 0 AND zeny >= ?;
   ```
4. **Game Server as Pure UI Terminal:**
   - The in-game NPC `stock_exchange.txt` acts purely as a terminal reading latest DB states and processing in-game purchases.

---

## 2. Phase 7: Phased Municipal Stock Market Expansion (27 Cities)

Instead of overloading players with all Ragnarok Online cities at once, 27 municipal stocks are rolled out across 5 thematic regional phases:

### Phase 7.1: Schwarzwald Republic & Frontier High-Tech (Growth & CapEx)
| Ticker | City / Organization | Archetype | Dividend Yield | Volatility | Growth Drivers / Event Hooks |
|:---|:---|:---|:---|:---|:---|
| **`LHZ`** | **Lighthalzen** (*Rekenber Biotech & Frontier Robotics*) | Pure Growth Tech Monopoly | **0.0% – 0.5%** | **High (Beta 1.8)** | R&D reinvestment, Somatology Bio-Labs breakthroughs vs containment breaches. |
| **`EIN`** | **Einbroch** (*Einbroch Heavy Industries & Steamworks*) | Industrial CapEx / Infrastructure | **0.5% – 1.5%** | **Medium-High (Beta 1.4)** | Blast furnaces, railway network expansion, heavy factory equipment. |
| **`YUN`** | **Yuno** (*Yuno Arcane Institute & Juperos Deep-Tech*) | Speculative Deep-Tech / Venture | **0.0%** | **Medium-High (Beta 1.5)** | Juperos ruins archaeology, ancient Heart of Ymir energy tech. |
| **`HUG`** | **Hugel** (*Hugel Coastal Leisure & Airship Route*) | Regional Leisure & Gaming Micro-Cap | **2.5% – 3.5%** | **Moderate (Beta 0.9)** | Monster race betting turnover, airship passenger traffic. |

### Phase 7.2: Rune-Midgarts Domestic Expansion (Utilities & Leisure)
| Ticker | City / Organization | Archetype | Dividend Yield | Volatility | Growth Drivers / Event Hooks |
|:---|:---|:---|:---|:---|:---|
| **`ADB`** | **Aldebaran** (*Kafra Global HQ & Clockwork*) | Defensive Blue-Chip Dividend Aristocrat | **5.0% – 6.5%** | **Low (Beta 0.5)** | Inelastic continent-wide Kafra teleport/storage service fees. |
| **`CMD`** | **Comodo** (*Comodo Casino & Entertainment Syndicate*) | High-Beta Consumer Discretionary & Gaming | **4.0% – 8.0% (Variable)** | **High (Beta 1.9)** | Casino table turnover, tourism cycles, bull/bear market mood swings. |
| **`IZL`** | **Izlude** (*Izlude Maritime Transport & Warrior Academy*) | Regional Transport & Defense | **3.0% – 4.0%** | **Low-Medium (Beta 0.7)** | Ferry traffic to Byalan Island, arena gate admissions. |
| **`LUT`** | **Lutie** (*Toy Factory Automated Assembly*) | Seasonal Consumer Goods & Robotics | **1.5% – 2.5%** | **Moderate (Beta 1.1)** | Holiday seasonal demand surges, assembly line robotics. |

### Phase 7.3: Theocratic Sovereign & Frontier Commodities (Arunafeltz)
| Ticker | City / Organization | Archetype | Dividend Yield | Volatility | Growth Drivers / Event Hooks |
|:---|:---|:---|:---|:---|:---|
| **`RAC`** | **Rachel** (*Cheshrumnir Sacred Trust & Sovereign Tithes*) | Sovereign Theocratic Fund / Gold Trust | **3.5% – 4.5%** | **Very Low (Beta 0.3)** | Mandatory religious tithes, temple gold reserves, flight-to-safety during crashes. |
| **`VEI`** | **Veins** (*Veins Geothermal Mining & Thor Energy*) | Energy Commodities & Volcanic Minerals | **3.0% – 5.0%** | **High (Beta 1.6)** | Geothermal energy tap, Thor Volcano mineral extractions. |
| **`JAW`** | **Jawaii** (*Jawaii Luxury Honeymoon & Hospitality*) | Ultra-Luxury Hospitality Monopoly | **5.5% – 7.0%** | **Low (Beta 0.4)** | Luxury weddings, private resort bar tabs, high-net-worth tourism. |
| **`UMB`** | **Umbala** (*Utan Bungee & Raw Jungle Commodities*) | Ecotourism & Primitive Commodity Venture | **0.0% – 1.0%** | **High (Beta 1.5)** | Exotic wood/flesh barter arbitrage, shamanic relic discoveries. |

### Phase 7.4: Global Cultural & Agrarian Markets (Global Project Cities)
| Ticker | City / Organization | Archetype | Dividend Yield | Volatility | Growth Drivers / Event Hooks |
|:---|:---|:---|:---|:---|:---|
| **`LOU`** | **Louyang** (*Herbal Biotech & Traditional Medicine*) | Defensive Healthcare & Pharmaceuticals | **3.5% – 4.5%** | **Low (Beta 0.6)** | Inelastic demand for herbal remedies, medicine exports. |
| **`MOS`** | **Moscovia** (*Prime Timber, Furs & Mineral Trust*) | Natural Resources & Forestry Value | **4.5% – 5.5%** | **Medium (Beta 0.8)** | Rare lumber logging, sable pelts, precious gemstone mines. |
| **`AMA`** | **Amatsu** (*Artisanal Crafts & Heritage Tourism*) | Boutique Luxury & Cultural Heritage | **3.0% – 4.0%** | **Low-Medium (Beta 0.7)** | Forged blades, silk kimono exports, castle tourism. |
| **`AYO`** | **Ayothaya** (*River Trading & Agrarian Value*) | Agricultural Commodities & River Logistics | **4.0% – 5.0%** | **Low (Beta 0.6)** | Floating market grain trade, sacred shrine crafts. |
| **`GON`** | **Gonryun** (*Kunlun Floating Real Estate & Elixirs*) | Mystical Consumables & Air-Rights Luxury | **2.0% – 3.0%** | **Medium (Beta 1.0)** | Cultivation peaches, Taoist relics, floating estate leasing. |
| **`BRA`** | **Brasilis** (*Rainforest Bio-Prospecting & Festival Corp*) | Eco-Energy & Event Entertainment | **2.5% – 4.0%** | **Medium-High (Beta 1.2)** | Annual carnival tourism spikes, rare rainforest flora research. |
| **`DEW`** | **Dewata** (*Karakatau Gold & Spices*) | Precious Metals & Exotic Spices Mining | **3.5% – 5.0%** | **High (Beta 1.4)** | Tribal gold mining, volcanic spice crops. |
| **`MAL`** | **Port Malaya** (*Maritime Port & Infrastructure*) | Emerging Market Port Logistics | **3.0% – 4.5%** | **Medium (Beta 1.0)** | Port cargo fees, regional agriculture, hospital supply chains. |

### Phase 7.5: Outliers & Interdimensional Markets (Dark Horizons / Ash Vacuum)
| Ticker | City / Organization | Archetype | Dividend Yield | Volatility | Growth Drivers / Event Hooks |
|:---|:---|:---|:---|:---|:---|
| **`NIF`** | **Nifflheim** (*Underworld Relics & Distressed Assets*) | Distressed Debt / High-Risk "Junk Bond" | **0.0%** | **Extreme (Beta 2.5)** | Occult rifts, zero regulatory protection, asymmetric boom/bust. |
| **`DIC` / `SPL` / `MAN`** | **Ash Vacuum Frontier** (*Sapha & Laphine Resource Alliance*) | Extraplanar Mining & Seed Venture | **0.0% – 1.0%** | **Extreme (Beta 2.2)** | Refined Bradium / Manuk ore yields, Yggdrasil seed harvesting. |

---

## 3. Phase 8: Database-Backed Municipal Lore & Scalable Stock Detail Modal

- **DB Persistence:** Seeded all 27 municipal stock tickers with canonical Ragnarok Online lore and corporate broker titles in `solo_schema_migrations.sql`.
- **API Integration:** Exposed `broker_title` and `lore` directly through `@rathena/shared` and `economy.service.ts`.
- **Zero-Bloat UI:** Implemented clean click-to-open detail modal in `MarketWatch.tsx` with zero third-party tooltip overhead.

---

## 4. Phase 9: Multi-Phase Visibility & In-Game Dialogue Pagination

- **Dialogue Pagination:** Implemented 4–5 items per page with `next;` transitions in `npc/custom/stock_exchange.txt` and `npc/custom/system_tablet.txt` to eliminate dialogue text truncation.
- **Physical City Brokers:** Placed stock broker NPCs in Aldebaran, Comodo, Izlude, and Lutie.
- **CI Validation:** Added integration test scripts in `npc/test/stock_exchange_ci_test.txt`.

---

## 5. Phase 10: Complete Municipal Black Swan Seeding & Rolling Unlock Event Engine

- **Complete 27-City Event Catalog:** Seeded Booms, Crises, and Trade Wars in `solo_stock_events.sql`.
- **Active-Ticker Event Gating:** Ensured `processBlackSwan()` only triggers events where `ticker_target` and `ticker_secondary` are enabled (`enabled = 1`).
- **Dividend Math Calibration:** Fixed integer division rounding in `processMidnightDrip()` to prevent dividend decay to 0z.
- **Direct Dividend Tracking:** Synced `economy.service.ts` with `pending_div`, `drip_enabled`, and `drip_carryover` in `solo_stock_player`.

---

## 6. Phase 11: Stock Market Hardening, Arithmetic Protection & 17-Carat Diamond Store of Value

- **Arithmetic Bounds & Overflow Protection:**
  - Enforced purchase ceiling (`.@qty <= 1,000,000` and `if (.@qty > 2000000000 / .@p)`) to prevent negative-zeny multiplication overflow.
  - Refactored partial sell cost-basis reduction (`total_cost`) directly into MySQL.
  - Implemented `MAX_ZENY` (2,147,483,647) clamping on dividend claims and share sales.
  - Accrued dividends pro-rated on partial sales to prevent dividend loss on liquidating 1 share.
- **Engine Hardening:**
  - Added support for `ticker = 'ALL'` macro events (`MACRO_GOLDEN_JUBILEE`, `MACRO_VALHALLA_BLESSING`).
  - Added `reverse_split_ratio` processing for structural consolidation (`FIN_REVERSE_SPLIT`).
- **High-Capacity Dividend Store of Value (17-Carat Diamonds):**
  - **Context:** In Ragnarok Online, character wallets hard-cap at 2,147,483,647 Zeny (`MAX_ZENY`). End-game solo tycoons accumulating large stock positions can accrue dividends exceeding this wallet cap in a single harvest.
  - **Mechanism:** For dividend payouts \(\ge 500,000,000\text{z}\), payout distributes in **17-Carat Diamonds** (`item_id: 6024`, non-droppable store of value convertible via `RareDiamondMerchant` at 500M Zeny each) + remaining Zeny change.
  - Protected with `checkweight(6024, .@diamond_count)` to guarantee zero asset loss on full inventory.

---

## 7. Phase 12: Offline Dividend Catch-Up & DRIP Compounding on Server Boot

- **Offline Elapsed-Time Detection:**
  - On startup in `initMarketCron()`, compares `Date.now() / 1000 - LastUpdate` from `solo_stock_meta`.
  - Calculates missed 4-hour cycles: `missedCycles = Math.min(Math.floor(elapsed / 14400), 42)` (clamped at 7 days max).
- **Sequential Catch-Up Execution:**
  - Executes `processMidnightDrip()` sequentially for each missed cycle to credit pending dividends and compound DRIP reinvestments.
  - Updates `LastUpdate` to current timestamp upon catch-up completion.
- **Automated Unit Tests:**
  - Unit tests in `web/apps/server/test/marketSimulation.test.ts` verifying elapsed calculations, 0-cycle no-ops, multi-cycle payouts, and max cycle clamping.

---

## 8. Phase 13: Decentralized Rune & Crypto-Asset Market Expansion (10 Protocol Tickers)

> [!NOTE]
> Alongside the 27 regional and municipal city stocks, Phase 13 introduces a new asset class: **Decentralized Rune & Crypto-Asset Protocols (10 Lore-Compliant Tokens)**.
> Each token mirrors real-world cryptocurrency archetypes (Bitcoin, Ethereum, Solana, Monero, BNB, Chainlink, Dogecoin, USDT, Uniswap, XRP) in characteristics, market dynamics, and extreme volatilities, while maintaining authentic **Ragnarok Online** lore.

### 8.1 Protocol Ticker Catalog

| Ticker | Token Name & Broker Title | Real-World Mirror | Sector | Archetype | Volatility (Beta) | Staking / Div Yield | RO Lore Background & Growth Drivers |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **`EMP`** | **Emperium Shard Protocol**<br>*(Sovereign Guild Vaults)* | **Bitcoin (BTC)**<br>*Digital Gold / PoW Reserve* | Sovereign Ore & Protocol | Deflationary Hard Cap Store of Value | **Extreme (Beta 2.8)** | **0.0%** | Fractionalized digitized shards of ancient Emperium ore mined from deep castle dungeons. Strict fixed supply, non-inflationary. Boosted by Castle siege seasons and guild vault reserve inflows. |
| **`YMI`** | **Heart of Ymir Alchemax**<br>*(Juperos Arcane Matrix)* | **Ethereum (ETH)**<br>*Smart Contracts / Gas Layer* | Arcane Computation & Gas | Decentralized Alchemical Matrix | **High (Beta 2.4)** | **1.0%** *(Mana Staking)* | Primordial computational mana units powering synthetic homunculi and alchemical transmutations across Geffen and Yuno. Earns transmutative gas fees; driven by alchemical breakthroughs. |
| **`WRP`** | **Warp Light Protocol**<br>*(Acolyte High-Speed Rail)* | **Solana (SOL)**<br>*High-Throughput PoH / Fast DEX* | Spatial Teleportation Rail | Ultra-High-Speed Ledger | **Extreme (Beta 3.2)** | **0.0%** | High-frequency blue gemstone spatial folding ledger developed by rogue Acolyte speed-runners. Fast transaction velocity with occasional "Spatial Leyline Desync / Warp Portal Outages". |
| **`SHD`** | **Shadow Guild Stealth Ring**<br>*(Morroc Black Syndicate)* | **Monero (XMR)**<br>*Privacy Coin / Zero-Knowledge* | Stealth & Underground Trade | Zero-Knowledge Anonymous Ring | **High (Beta 2.6)** | **0.0%** | Cryptographically cloaked transaction ring run by the Assassin Guild in Morroc's underground. Zero KYC; immune to royal taxation, but targeted by Prontera Crown Anti-Smuggling raids. |
| **`ZEX`** | **Midgard Exchange Coin**<br>*(Alberta Merchant Consortium)* | **Binance Coin (BNB)**<br>*Exchange Utility & Buyback* | Market Infrastructure | Utility Token & Fee Rebate | **Medium-High (Beta 1.7)** | **0.5%** *(Exchange Rebate)* | Native Alberta Merchant Guild trading utility token providing transaction fee discounts, backed by quarterly Zeny furnace buyback burns. |
| **`ORA`** | **Eye of Odin Oracle**<br>*(Hugin & Munin Feeds)* | **Chainlink (LINK)**<br>*Decentralized Oracles* | Arcane Data Infrastructure | Decentralized Oracle Feeds | **Medium-High (Beta 1.8)** | **1.5%** *(Node Staking)* | Magical ravens aggregating cross-realm monster spawn timers, drop rates, and weather trends into deterministic arcane data feeds for smart alchemical transmutations. |
| **`POR`** | **King Poring Meme Standard**<br>*(Novice South-Field Syndicate)* | **Dogecoin (DOGE)**<br>*Retail Hype Memecoin* | Meme & Social Frenzy | Pure Community Speculation | **Ultra-Extreme (Beta 4.5)** | **0.0%** | Minted by enthusiastic Novices in Prontera South Field with zero intrinsic utility. Driven purely by town crier shouting matches, viral hype pumps (+150%), and catastrophic ghostring dumps. |
| **`NZN`** | **Neo-Zeny Kafra Dollar**<br>*(Kafra Reserve Trust)* | **Tether / USDC (USDT)**<br>*Pegged Stablecoin* | Settlement & Arbitrage | 1:1 Reserve-Pegged Dollar | **Zero-Low (Beta 0.05)** | **2.0%** *(Vault Yield)* | Algorithmic stable-token 100% collateralized by Kafra vault gold bullion. Maintains strict 100z parity with minute \(\pm 1\%\) arbitrage fluctuations and vault staking interest. |
| **`ALM`** | **Alchemax AMM Pool**<br>*(Morroc Bazaar Cauldron)* | **Uniswap (UNI)**<br>*Automated Market Maker* | Decentralized Finance (DeFi) | Automated Liquidity Cauldron | **High (Beta 2.1)** | **3.5%** *(Slippage Yield)* | Open alchemical cauldron where adventurers supply white herbs and empty bottles, collecting automated trade slippage fees from potion buyers. |
| **`KFX`** | **Kafra Fast-eXchange**<br>*(Inter-Realm Remittance)* | **Ripple (XRP)**<br>*Cross-Border Settlement* | Sovereign Banking Rail | Institutional Remittance Ledger | **Medium (Beta 1.5)** | **2.5%** *(Remittance Yield)* | Enterprise cross-realm settlement wire between Prontera, Yuno, and Rachel Central Banks. Subject to Royal regulatory treaties and cross-kingdom tariff accords. |

### 8.2 Architectural Principles (Ponytail Review & Zero Bloat)
1. **Unified Table Storage:** All crypto tickers reside within the standard `solo_stock_market` database table, fully utilizing `beta` multipliers and dynamic simulation cron loops.
2. **Deterministic Volatility Scaling:** The simulation engine applies `f = Math.round(f * beta)` directly. A `POR` ticker with Beta 4.5 experiences swings \(\pm 25\%\) to \(\pm 80\%\) during volatile shifts, perfectly capturing memecoin euphoria and despair without needing bespoke algorithmic forks.
3. **Black Swan Integration:** High-volatility crypto shocks (halvings, rug pulls, gas surges, de-pegs) trigger through `solo_stock_events_def` and are gated by active ticker status.

---

## 9. Phase 22: Financial Proxy Model — ETF Positions, Synced Exchange Indices & Rich Lore

> [!NOTE]
> Phase 22 introduces the **Financial Proxy Model**, cleanly separating **Indices (Read-Only Statistical Benchmarks)** from **ETFs (Investable / Soulbound Proxy Assets)**.

### 9.1 Core Financial Rules & Invariants
1. **Indices as Pure Benchmarks**:
   - Stored in `solo_stock_indices` (`index_id`, `name`, `publisher`, `sector`, `archetype`, `lore`, `constituents JSON`).
   - Indices are **never traded directly**. They live in a dedicated `[📊 Indices]` tab on the exchange board, displaying composite calculated prices, 24h changes, and rich lore formatted identically to stocks.
2. **ETFs as Investable Proxies in Positions**:
   - Stored in `solo_stock_market` referencing `index_id`.
   - Listed directly in the player's Positions list with clean styling (no intrusive labels).
   - Category filter chip `[ETF]` in the portfolio automatically syncs the exchange board to the `[📊 Indices]` tab and highlights the tracked benchmark.
3. **Decoupled Basket Weighting**:
   - Constituents and weights are adjusted **exclusively inside `solo_stock_indices`**. The ETF proxy dynamically inherits the basket and calculated prices.
4. **Background Municipal Simulation**:
   - 18 unlisted municipal stocks are set to `enabled = 1` and `trade_status = 'TRACKED_ONLY'`, simulating price shifts in the background to drive the indices.
5. **Milestone Achievement Grants**:
   - In-game milestones grant soulbound ETF shares upon claim (`reward_stock_ticker`, `reward_stock_shares`).


