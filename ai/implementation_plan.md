# Photonic Singularity: Solo-Centric RO Game Loop Design (Master Hub)

> [!IMPORTANT]
> This grand plan and all associated sub-systems are designed specifically for the **Renewal** version of rAthena.
> A solo-centric experience with couch co-op vibes — designed for 1–3 players, script-only implementation, and a living world that never feels empty.

---

## 🧭 Master Index of Linked Specification Notes

To prevent AI context bloat and ensure fast, modular access, detailed designs and specifications are organized into dedicated linked notes:

| Specification Domain | Description & Scope | Linked Note |
|:---|:---|:---|
| **Immediate Task Breakdown** | Actionable next tasks for pending Phase 1 and Phase 4 systems | [Phase 1 & 4 Breakdown](plans/phase_1_and_4_breakdown.md) |
| **Living World & Ambient Life** | Wandering NPCs, town criers, dynamic events, Easter egg quests | [Living World System](plans/living_world.md) |
| **Solo Mechanics & QoL** | Solo-tilt EXP/instances, support mercenaries, kill recovery, spawns | [Solo Mechanics & QoL](plans/solo_mechanics_and_qol.md) |
| **Gear & Progression** | Longevity layers, quality tiers, transcendence math, 4th class traits | [Gear & Progression](plans/gear_and_progression.md) |
| **Economy & Finance** | Daily junk sinks, investment bank, momentum, bill notes, gacha | [Economy & Finance](plans/economy_and_finance.md) |
| **Immersion & Encyclopedia** | No-@commands policy, monster intel NPC, pocket watch, encyclopedia | [Immersion & Encyclopedia](plans/immersion_and_encyclopedia.md) |
| **Endgame & Mastery** | Horizontal progression beyond Lv185, mastery points, collections | [Endgame & Mastery](plans/endgame_and_mastery.md) |
| **Stock Market & Municipal Roadmap** | Phases 6–13 stock engine, 27 regional cities + 10 crypto protocols, black swans, 17C diamonds | [Stock Exchange Roadmap](plans/stock_exchange_expansion.md) |
| **Web Portal & Infrastructure** | Player portal architecture, Bun/Elysia backend, MariaDB replica | [Web Portal Architecture](plans/web_portal_plan.md) |
| **Web Gacha & Altar System** | Midgard Egg Spinner Altar, Web Stash, Gacha Shards, Exclusives Shop & Admin Customizer | [Web Gacha System](plans/web_gacha_system.md) |
| **Shadow Tracking Persistence** | Core persistence DB schema for kills, loot, and economy tracking | [Shadow Tracking Plan](shadow_tracking_plan.md) |
| **Technical Reference & Audits** | Script-only verification matrix, config parameters, script appendices | [Technical Reference](plans/technical_reference.md) |

---

## 🚀 Master Feature Tracking

### Phase 0: Shadow Tracking Persistence
| Feature | Status | Details & Specification |
|:---|:---|:---|
| **Kill Tracking** | ✅ [DONE] | [Kill Tracking Architecture](shadow_tracking/kill_tracking.md) |
| **Loot Tracking** | ✅ [DONE] | [Loot Tracking Architecture](shadow_tracking/loot_tracking.md) |
| **Economy Tracking** | ✅ [DONE] | [Economy Tracking Architecture](shadow_tracking/economy_tracking.md) |
| **Persistence Schema** | ✅ [DONE] | [Core Persistence DB Schema](shadow_tracking_plan.md) |

### Phase 1: Core Mechanics & Solo QoL
| Feature | Status | Details & Specification |
|:---|:---|:---|
| **Tiered EXP Rates** | ✅ [DONE] | 1x (1-30), 2x (31-60), 3x (61-99), 4x (100-150), 5x (151+) · [Details](plans/gear_and_progression.md#3-respectful-leveling-design) |
| **Starter Kit** | ✅ [DONE] | Potions, wings, food, pocket watch, 5k Zeny on first login · [Details](plans/solo_mechanics_and_qol.md#7-early-game-bootstrap-starter-kit-system) |
| **Kill Recovery** | ✅ [DONE] | Flat HP/SP heal on kill based on mob level · [Details](plans/solo_mechanics_and_qol.md#4-resource-sustainability-rebalanced) |
| **Support Class Viability** | ⏳ [PENDING] | Solo damage buffs & free daily mercs for Priests/Bards · [Details](plans/solo_mechanics_and_qol.md#3-support-class-solo-viability) |
| **Refine Safety Nets** | ✅ [DONE] | Custom Refiner NPC insurance & Blacksmith Blessing (`npc/custom/refine_safety.txt`) · [Details](plans/phase_1_and_4_breakdown.md#3-refine-safety-nets) |
| **Boss/Mob Tuning** | ⏳ [PENDING] | Density (+30-50%) and respawn tuning in `solo_mob_spawns.txt` · [Details](plans/solo_mechanics_and_qol.md#5-monster-spawn-rates--tuning-solo-centric) |
| **Dual-Client Policy** | ⏳ [PENDING] | Config change to allow 2 connections per IP · [Details](plans/solo_mechanics_and_qol.md#2-support-follower-system-dual-client--mercenaries) |

### Phase 2: Living World & Discovery
| Feature | Status | Details & Specification |
|:---|:---|:---|
| **Town Criers** | ✅ [DONE] | Dynamic broadcast of MvP kills, trade arrivals, rumors · [Details](plans/living_world.md#4-world-news--bulletin-boards) |
| **Adventurer Parties** | ✅ [DONE] | Wandering player-like NPCs in leveling fields · [Details](plans/living_world.md#2-wandering-npc-system) |
| **Town Guards** | ✅ [DONE] | Patrol paths and ambient dialogue in Prontera · [Details](plans/living_world.md#2-wandering-npc-system) |
| **MvP Tracking** | ✅ [DONE] | Global tracking of last MvP killer and timestamp · [Details](plans/living_world.md#4-world-news--bulletin-boards) |
| **Easter Eggs (Basic)** | ✅ [DONE] | Lost Child (random spawn), Old Sage (Payon) · [Details](plans/living_world.md#6-quest-obtainable-premium-items) |
| **Easter Eggs (Advanced)** | ⏳ [PENDING] | Riddler (daily rotation), Ghost Knight (Glast Heim midnight) · [Details](plans/living_world.md#6-quest-obtainable-premium-items) |
| **Wandering Merchants** | ✅ [DONE] | Traveling Merchant Marcus schedule logic · [Details](plans/living_world.md#2-wandering-npc-system) |

### Phase 3: Systems & Economy
| Feature | Status | Details & Specification |
|:---|:---|:---|
| **Daily Junk Sink** | ✅ [DONE] | Merchant selling overpriced account-bound utility · [Details](plans/economy_and_finance.md#1-account-bound-daily-junk-sink-system) |
| **System Tablet (Basic)** | ✅ [DONE] | Progression Guide, Market Pulse, Monster Intel · [Details](plans/immersion_and_encyclopedia.md#4-system-encyclopedia-npc) |
| **System Tablet (Deep)** | ✅ [DONE] | Added monster drops/rates to Intel App · [Details](plans/immersion_and_encyclopedia.md#2-monster-intel-system-librarian-npc) |
| **Investment Bank (Unified Brokerage)** | ✅ [DONE] | Continuous on-the-fly tiered yield (0.25%→0.08%→0.03%→0.01%), 0.1% deposit fee, dual in-game NPC & web brokerage support · [Details](plans/economy_and_finance.md#2-investment-bank--unified-brokerage-account-ponytail-model) |
| **Bill Notes** | ⏳ [POSTPONED] | Replaced by 17-Carat Diamond trades (500M store of value) · [Details](plans/stock_exchange_expansion.md#6-phase-11-stock-market-hardening-arithmetic-protection--17-carat-diamond-store-of-value) |
| **Item Gacha** | ✅ [DESIGNED] | Web Gacha Altar, Web Stash, Gacha Shards & Exclusives Shop · [Details](plans/web_gacha_system.md) |
| **Stock Momentum** | ⏳ [PENDING] | Advanced trend logic for the Stock Exchange · [Details](plans/economy_and_finance.md#3-stock-momentum--market-dynamics) |

### Phase 4: Mastery & Endgame
| Feature | Status | Details & Specification |
|:---|:---|:---|
| **Instance Scaling** | ⏳ [PENDING] | Solo/Duo/Trio difficulty variants (30%/60%/100% HP) · [Details](plans/solo_mechanics_and_qol.md#1-solo-tilt-redesign) |
| **Mastery System** | ⏳ [POSTPONED] | Post-max level growth (Mastery Points) · [Details](plans/endgame_and_mastery.md#2-mastery-system-account-wide-post-cap-growth) |
| **Collection Log** | ✅ [DONE] | Zone-based item collection tracking · [Details](plans/endgame_and_mastery.md#3-zone-based-collection-log) |
| **Global Collector Upgrade** | ⏳ [PENDING] | Web-assignable SQL tables for junk/reward pools · [Details](plans/phase_1_and_4_breakdown.md#3-collection-log--global-enhancements) |
| **Stock Exchange SQL Migration** | ✅ [DONE] | Moved price and dividend data to MariaDB tables · [Details](plans/stock_exchange_expansion.md#1-phase-6-investment-engine-extraction-decoupling--ponytail-edition) |
| **Achievement Tiers** | ⏳ [PENDING] | Repeating kill/refine thresholds with rewards · [Details](plans/endgame_and_mastery.md#4-achievement-tiers-repeating-challenges) |
| **Reputation Factions** | ⏳ [PENDING] | Daily quests and rep-locked quartermasters · [Details](plans/endgame_and_mastery.md#5-reputation-factions) |
| **Challenge Modes** | ⏳ [POSTPONED] | Roguelike dungeon runs with random modifiers · [Details](plans/endgame_and_mastery.md#6-roguelike-challenge-modes) |

### Phase 5: Infrastructure (Admin & Player Portal)
| Feature | Status | Details & Specification |
|:---|:---|:---|
| **Player Web Portal (MVP 1)** | ✅ [DONE] | Bun/Elysia/Vite/Replica DB 3307 stack · [Web Portal Architecture](plans/web_portal_plan.md) |
| **Web Admin Panel** | ⏳ [PENDING] | Economic & player data dashboard · [Details](plans/technical_reference.md#3-future-roadmap-external-web-admin-panel) |
| **Encyclopedia NPC** | ⏳ [PENDING] | Central info guide for all custom systems · [Details](plans/immersion_and_encyclopedia.md#4-system-encyclopedia-npc) |

### Phase 6: Service Extraction (Decoupling) — 👱‍♀️ Ponytail Edition
| Feature | Status | Details & Specification |
|:---|:---|:---|
| **Market Simulation Extraction** | ✅ [DONE] | Moved simulation logic from rAthena `OnClock` to Elysia web backend cron · [Details](plans/stock_exchange_expansion.md#1-phase-6-investment-engine-extraction-decoupling--ponytail-edition) |
| **Atomic Web Transactions** | ✅ [DONE] | Built `/api/market/buy` & `sell` routes using `online=0` atomic SQL · [Details](plans/stock_exchange_expansion.md#1-phase-6-investment-engine-extraction-decoupling--ponytail-edition) |

### Phase 7: Phased Municipal Stock Market Expansion (27 Cities)
| Feature | Status | Details & Specification |
|:---|:---|:---|
| **Phase 7.1: Schwarzwald Tech** | ⏳ [PENDING] | `LHZ`, `EIN`, `YUN`, `HUG` (Pure Growth & CapEx) · [Details](plans/stock_exchange_expansion.md#phase-71-schwarzwald-republic--frontier-high-tech-growth--capex) |
| **Phase 7.2: Rune-Midgarts Domestic** | ⏳ [PENDING] | `ADB`, `CMD`, `IZL`, `LUT` (Blue-Chips & Consumer Discretionary) · [Details](plans/stock_exchange_expansion.md#phase-72-rune-midgarts-domestic-expansion-utilities--leisure) |
| **Phase 7.3: Theocratic Sovereign** | ⏳ [PENDING] | `RAC`, `VEI`, `JAW`, `UMB` (Gold Trust & Commodities) · [Details](plans/stock_exchange_expansion.md#phase-73-theocratic-sovereign--frontier-commodities-arunafeltz) |
| **Phase 7.4: Global Cultural Markets** | ⏳ [PENDING] | `LOU`, `MOS`, `AMA`, `AYO`, `GON`, `BRA`, `DEW`, `MAL` · [Details](plans/stock_exchange_expansion.md#phase-74-global-cultural--agrarian-markets-global-project-cities) |
| **Phase 7.5: Outliers & Interdimensional**| ⏳ [PENDING] | `NIF` (Junk Bond), `DIC`/`SPL`/`MAN` (Ash Vacuum) · [Details](plans/stock_exchange_expansion.md#phase-75-outliers--interdimensional-markets-dark-horizons--ash-vacuum) |

### Phases 8–12: Advanced Market Hardening & Features
| Phase | Status | Details & Specification |
|:---|:---|:---|
| **Phase 8: DB Lore & Stock Modal** | ✅ [DONE] | Lore persistence in SQL, shared types, zero-bloat modal · [Details](plans/stock_exchange_expansion.md#3-phase-8-database-backed-municipal-lore--scalable-stock-detail-modal) |
| **Phase 9: In-Game Dialogue Pagination**| ✅ [DONE] | 4-5 items per page in NPC dialogs, physical city brokers · [Details](plans/stock_exchange_expansion.md#4-phase-9-multi-phase-visibility--in-game-dialogue-pagination) |
| **Phase 10: Black Swan Engine** | ✅ [DONE] | 27-city black swans, active-ticker gating, dividend math fix · [Details](plans/stock_exchange_expansion.md#5-phase-10-complete-municipal-black-swan-seeding--rolling-unlock-event-engine) |
| **Phase 11: Hardening & 17C Diamonds** | ✅ [DONE] | 32-bit overflow guards, macro `'ALL'`, 17C Diamonds (500M store of value) · [Details](plans/stock_exchange_expansion.md#6-phase-11-stock-market-hardening-arithmetic-protection--17-carat-diamond-store-of-value) |
| **Phase 12: Offline Dividend Catch-Up**| ✅ [DONE] | Startup elapsed-time detection, missed 4h DRIP catch-up · [Details](plans/stock_exchange_expansion.md#7-phase-12-offline-dividend-catch-up--drip-compounding-on-server-boot) |
| **Phase 12.1: Dividend Engine Calibration**| ✅ [DONE] | Dynamic target yield convergence, split recalibration, zero-wipe fix · [Details](plans/stock_exchange_expansion.md#dividend-math-calibration) |

### Phase 13: Decentralized Rune & Crypto-Asset Protocols (10 Lore Tickers)
| Feature | Status | Details & Specification |
|:---|:---|:---|
| **Crypto Protocols Seeding** | ✅ [DONE] | `EMP`, `YMI`, `WRP`, `SHD`, `ZEX`, `ORA`, `POR`, `NZN`, `ALM`, `KFX` · [Details](plans/stock_exchange_expansion.md#8-phase-13-decentralized-rune--crypto-asset-market-expansion-10-protocol-tickers) |
| **Crypto Black Swan Catalog** | ✅ [DONE] | Halvings, meme frenzies, rug pulls, gas spikes, oracle outages · [Details](plans/stock_exchange_expansion.md#8-phase-13-decentralized-rune--crypto-asset-market-expansion-10-protocol-tickers) |
| **Frontend Tabbed Segregation**| ✅ [DONE] | `MarketWatch.tsx` category filters (All / Municipal / Crypto Protocols) · [Details](plans/stock_exchange_expansion.md#8-phase-13-decentralized-rune--crypto-asset-market-expansion-10-protocol-tickers) |

### Phases 14–16: Frontend Analytics, UI Hardening & Automated CI Linting
| Phase | Status | Details & Specification |
|:---|:---|:---|
| **Phase 14: Candlestick & Downsampling Engine** | ✅ [DONE] | Lightweight Charts candlestick integration with automated midnight daily OHLCV downsampling and integer Zeny formatting · [`CandlestickChart.tsx`](../web/apps/client/src/components/economy/CandlestickChart.tsx) |
| **Phase 15: Stock Modal & UI Hardening** | ✅ [DONE] | Bento token standardization, Esc/backdrop dismiss, `<ErrorBoundary>` fault isolation, and responsive layout polish · [`TickerDetailModal.tsx`](../web/apps/client/src/components/economy/TickerDetailModal.tsx) |
| **Phase 16: NPC Dialogue Linting CI Suite** | ✅ [DONE] | Automated pre-commit Python linting script ensuring dynamic NPC query lists never exceed 4–5 lines per page · [`lint_npc_dialogue.py`](../tools/ci/lint_npc_dialogue.py) |

### Phase 17: Web Gacha & Altar System (Egg Spinner, Stash, Scrap Exchange, Admin Customizer)
| Feature | Status | Details & Specification |
|:---|:---|:---|
| **Egg Spinner Capsule Altar** | ✅ [DONE] | 3D-styled animated egg spinner machine with 4 granular banners, dynamic stock economy pricing, and live countdown timer · [Details](plans/web_gacha_system.md) |
| **Dedicated Web Stash & RO Mail** | ✅ [DONE] | Won items accumulate safely in Web Stash (`solo_gacha_stash`) with selective/bulk in-game RO Mail dispatch · [Details](plans/web_gacha_system.md) |
| **Gacha Scrap & Dismantling** | ✅ [DONE] | Convert duplicate/unwanted items into Gacha Shards (SSR: 100, SR: 25, R: 5) to prevent vanity clutter · [Details](plans/web_gacha_system.md) |
| **Exclusives-Only Exchange Shop** | ✅ [DONE] | Spend Gacha Shards on non-gacha prestige items (Golden Wings, Sovereign Crown, Safe +11 Certs) · [Details](plans/web_gacha_system.md) |
| **Live Admin Roster Customizer** | ✅ [DONE] | Full real-time management of banners, master item pools, exchange shop, and pull simulator sandbox in `AdminVaultWindow.tsx` · [Details](plans/web_gacha_system.md) |

### Phase 18: Scoped Zero-Knowledge Web Features Backup & Restore
| Feature | Status | Details & Specification |
|:---|:---|:---|
| **Scoped Table Discovery Engine** | ✅ [DONE] | Dynamic table resolution via `information_schema.tables` filtering strictly `solo_*` and `custom_*` tables for `mariadb-dump` and fallback generator · [`admin.routes.ts`](../web/apps/server/src/routes/admin.routes.ts) |
| **Binary Buffer Serialization** | ✅ [DONE] | Zero-loss SQL hex byte literal encoding (`X'...'`) for binary BLOBs in fallback dump generator · [`admin.routes.ts`](../web/apps/server/src/routes/admin.routes.ts) |
| **Bento Scope UI & Granular Restore** | ✅ [DONE] | Dual-scope selector toggle (Web Systems & Economy vs Full Server) with scope-prefixed filenames (`ragnarok_web_save_*.sql.gz.enc`) and safe post-restore login session sanitization · [`AdminVaultWindow.tsx`](../web/apps/client/src/components/admin/AdminVaultWindow.tsx) |

### Phase 19: Bank Deposit Interest Rollover & Fractional Time Preservation
| Feature | Status | Details & Specification |
|:---|:---|:---|
| **Fractional Time Offset Retention** | ⏳ [PENDING] | Preserve sub-day progress ($E_{\text{sec}} \pmod{86400}$) on deposit/wire so frequent depositors never lose accrued hours · [`investment_bank.txt`](../npc/custom/investment_bank.txt) & [`economy.service.ts`](../web/apps/server/src/services/economy.service.ts) |
| **Lifetime Interest DB Accounting** | ⏳ [PENDING] | Atomically increment `interest_paid_total` on deposit compound rollover and dividend wires · [`solo_bank_account.sql`](../sql-files/custom/solo_bank_account.sql) |
| **Bento Bank Widget Progress & Dialogue** | ⏳ [PENDING] | Display intra-day hourly progress countdown, lifetime interest earned, and explicit compound rollover notices · [`BankWidget.tsx`](../web/apps/client/src/components/economy/BankWidget.tsx) |


---

## 🏛️ Core Philosophy & The Four Pillars

| Pillar | Architectural Target | Implementation Mechanism |
|:---|:---|:---|
| **Solo-Centric, Party-Welcome** | Designed for 1 player, scales cleanly to 2–3 friends | Dynamic NPC script difficulty scaling & baseline 125% EXP |
| **Earn Everything** | All cash-shop gear obtainable via gameplay and discovery | Character-bound quest rewards & Easter egg NPCs |
| **Living World** | World feels bustling and alive even on an empty server | Ambient life layer, wandering NPCs, town criers |
| **Script-Only** | Zero core C++ emulator modifications required | Pure rAthena script engine, YAML databases & SQL migrations |

### Party Size Optimization
```
┌─────────────────────────────────────────────────────────────────┐
│           PARTY SIZE OPTIMIZATION                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ★★★★★  Solo (1 player)    ◄── Primary design target           │
│   ★★★★★  Duo (2 players)    ◄── Couch co-op vibes               │
│   ★★★★☆  Trio (3 players)   ◄── Small friend group              │
│   ★★★☆☆  Party (4-6)        ◄── Supported, but not required     │
│   ★★☆☆☆  Raid (12+)         ◄── Optional legacy content         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
