-- Solo-centric database schema definitions and migrations
-- Do not embed these in NPC scripts (`OnInit`) as it violates least privilege,
-- slows down map-server boot times, and obscures schema tracking.

CREATE TABLE IF NOT EXISTS `solo_server_config` (
  `key` VARCHAR(32) PRIMARY KEY,
  `value` INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `solo_server_config` (`key`, `value`) VALUES ('junk_roster_size', 5);
INSERT IGNORE INTO `solo_server_config` (`key`, `value`) VALUES ('expedition_cap_hours', 48);
INSERT IGNORE INTO `solo_server_config` (`key`, `value`) VALUES ('max_character_zeny', 2100000000);

CREATE TABLE IF NOT EXISTS `solo_bank_config` (
  `config_key` VARCHAR(32) PRIMARY KEY,
  `config_value` BIGINT NOT NULL,
  `description` VARCHAR(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `solo_bank_config` (`config_key`, `config_value`, `description`) VALUES
  ('interest_rate_bps', 100, 'Daily interest rate in basis points (100 = 1%)'),
  ('max_accrual_days', 10, 'Maximum accumulated interest days cap'),
  ('deposit_fee_bps', 200, 'Deposit surcharge fee in basis points (200 = 2%)'),
  ('max_principal_limit', 1900000000, 'Maximum allowed principal balance in Zeny'),
  ('min_deposit_zeny', 100, 'Minimum Zeny deposit amount');

-- --------------------------------------------------------
-- Table structure for `solo_stock_indices` (Macro Benchmarks & Composite Baskets)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `solo_stock_indices` (
  `index_id` VARCHAR(32) PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL,
  `publisher` VARCHAR(64) NOT NULL DEFAULT 'Crown Ministry of Finance',
  `sector` VARCHAR(64) NOT NULL DEFAULT 'Broad Realm Composite',
  `archetype` VARCHAR(64) NOT NULL DEFAULT 'Balanced Growth & Value',
  `lore` TEXT NULL,
  `constituents` JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Standard Canonical Indices (INSERT IGNORE preserves any manual admin tuning)
INSERT IGNORE INTO `solo_stock_indices` (`index_id`, `name`, `publisher`, `sector`, `archetype`, `lore`, `constituents`)
VALUES
  ('MIDGARD_CORE', 'Midgard Composite Index (MIDX)', 'Crown Ministry of Finance & Royal Mint', 'Broad Realm Composite', 'Balanced Growth & Value', 'The sovereign economic benchmark of the Rune-Midgarts Kingdom, established by King Tristan III to measure the combined economic power of municipal capitals and frontier science hubs. Calculated as a weighted basket balancing 70% defensive public utilities with 30% private high-growth research.', '[{"ticker":"PRT","name":"Prontera Capital","weight":0.25,"type":"Defensive Blue-Chip"},{"ticker":"ADB","name":"Kafra Global Corporation","weight":0.25,"type":"Teleport Utilities"},{"ticker":"PAY","name":"Payon Timber & Craft","weight":0.20,"type":"Forestry Value"},{"ticker":"LHZ","name":"Rekenber Frontier Biotech","weight":0.15,"type":"Pure Growth Tech"},{"ticker":"YUN","name":"Yuno Arcane Institute","weight":0.10,"type":"Deep Tech Speculative"},{"ticker":"EMP","name":"Emperium Shard Protocol","weight":0.05,"type":"Protocol Store of Value"}]'),
  ('LHZ100', 'Schwarzwald Tech Index (LHZ100)', 'Schwarzwald Republic Trade Commission', 'Biotechnology & Steam Robotics', 'High-Beta Speculative Growth', 'The premier benchmark of industrial and arcane technology in the Schwarzwald Republic. Tracks Somatology Bio-Labs breakthroughs, Juperos archaeological extractions, and Einbroch blast furnace steel manufacturing turnover.', '[{"ticker":"LHZ","name":"Rekenber Frontier Biotech","weight":0.60,"type":"Biotech Monopoly"},{"ticker":"YUN","name":"Yuno Arcane Institute","weight":0.30,"type":"Ancient Deep-Tech"},{"ticker":"EIN","name":"Einbroch Heavy Industries","weight":0.10,"type":"Steam Manufacturing"}]'),
  ('RNDEF', 'Rune Defensive Index (RNDEF)', 'Midgard Merchant Consortium', 'Public Utilities & Agro-Forestry', 'Low-Beta Dividend Aristocrat', 'A conservative basket of continent-wide utility monopolies and essential primary commodities. Designed to provide steady inflation resistance and maximum dividend yield during market volatility.', '[{"ticker":"PRT","name":"Prontera Capital","weight":0.50,"type":"Sovereign Treasury"},{"ticker":"ADB","name":"Kafra Global Corporation","weight":0.30,"type":"Teleport Utilities"},{"ticker":"PAY","name":"Payon Timber & Craft","weight":0.20,"type":"Forestry Commodities"}]'),
  ('ALL_WORLD', 'Pan-Midgard All-World Index (WORLD)', 'Inter-Realm Trade Commission & League of Sovereign Nations', 'Global Total Market (All-Cap)', 'Global Diversified Sovereign Equity', 'The ultimate macro benchmark capturing the entire civilized world across Rune-Midgarts, the Schwarzwald Republic, the Arunafeltz Theocracy, the Far Eastern Kingdoms, and frontier dimensions. Encompasses 27 municipal and industrial economies across 5 continents, completely decoupled from decentralized cryptocurrency volatility.', '[{"ticker":"PRT","name":"Prontera Capital","weight":0.08,"type":"Sovereign Blue-Chip"},{"ticker":"ADB","name":"Kafra Global Corporation","weight":0.08,"type":"Teleport & Utilities"},{"ticker":"LHZ","name":"Rekenber Frontier Biotech","weight":0.10,"type":"Biotech Pure Growth"},{"ticker":"EIN","name":"Einbroch Heavy Industries","weight":0.08,"type":"Heavy Manufacturing"},{"ticker":"GEF","name":"Geffen Arcanetech","weight":0.06,"type":"Arcane Equities"},{"ticker":"YUN","name":"Yuno Arcane Institute","weight":0.06,"type":"Ancient Deep-Tech"},{"ticker":"RAC","name":"Cheshrumnir Sacred Trust","weight":0.05,"type":"Theocratic Sovereign"},{"ticker":"PAY","name":"Payon Timber & Craft","weight":0.04,"type":"Forestry Commodities"},{"ticker":"HUG","name":"Hugel Leisure & Coastal","weight":0.04,"type":"Regional Leisure"},{"ticker":"VEI","name":"Veins Volcanic Minerals","weight":0.04,"type":"Energy & Minerals"},{"ticker":"MOR","name":"Morroc Oasis Trading","weight":0.03,"type":"Desert Commerce"},{"ticker":"ALB","name":"Alberta Maritime Logistics","weight":0.03,"type":"Harbor & Shipping"},{"ticker":"JAW","name":"Jawaii Luxury Resorts","weight":0.03,"type":"Luxury Hospitality"},{"ticker":"LOU","name":"Louyang Herbal Medicine","weight":0.03,"type":"Defensive Healthcare"},{"ticker":"MOS","name":"Moscovia Prime Forestry","weight":0.03,"type":"Timber & Natural Resources"},{"ticker":"UMB","name":"Utan Ecotourism & Relics","weight":0.02,"type":"Exotic Commodities"},{"ticker":"AMA","name":"Amatsu Artisan Guild","weight":0.02,"type":"Boutique Heritage"},{"ticker":"AYO","name":"Ayothaya River Trading","weight":0.02,"type":"Agricultural Logistics"},{"ticker":"GON","name":"Kunlun Taoist Realm","weight":0.02,"type":"Mystical Consumables"},{"ticker":"BRA","name":"Brasilis Carnival & Flora","weight":0.02,"type":"Bio-Prospecting"},{"ticker":"DEW","name":"Dewata Karakatau Mines","weight":0.02,"type":"Volcanic Metal Resources"},{"ticker":"MAL","name":"Port Malaya Maritime","weight":0.02,"type":"Emerging Logistics"},{"ticker":"IZL","name":"Izlude Maritime Transport","weight":0.02,"type":"Maritime Defense"},{"ticker":"CMD","name":"Comodo Entertainment Syndicate","weight":0.02,"type":"Casino & Leisure"},{"ticker":"LUT","name":"Santa Toy Factory Robotics","weight":0.02,"type":"Consumer Robotics"},{"ticker":"DIC","name":"Ash Vacuum Mining Alliance","weight":0.01,"type":"Extraplanar Minerals"},{"ticker":"NIF","name":"Nifflheim Occult Relics","weight":0.01,"type":"Distressed Debt"}]');

CREATE TABLE IF NOT EXISTS `solo_stock_market` (
  `ticker` VARCHAR(10) PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL DEFAULT '',
  `broker_title` VARCHAR(64) NOT NULL DEFAULT '',
  `sector` VARCHAR(64) NOT NULL DEFAULT '',
  `archetype` VARCHAR(64) NOT NULL DEFAULT '',
  `lore` TEXT NULL,
  `asset_type` ENUM('EQUITY', 'CRYPTO', 'ETF') NOT NULL DEFAULT 'EQUITY',
  `trade_status` ENUM('TRADABLE', 'NON_TRADABLE', 'TRACKED_ONLY') NOT NULL DEFAULT 'TRADABLE',
  `index_id` VARCHAR(32) NULL,
  `price` INT DEFAULT 100,
  `price_old` INT DEFAULT 100,
  `dividend` INT DEFAULT 3,
  `div_acc` INT DEFAULT 0,
  `split_count` INT DEFAULT 0,
  `beta` DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  `target_yield_bps` INT NOT NULL DEFAULT 50,
  `enabled` TINYINT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Idempotent column additions and modifications for existing deployments
ALTER TABLE `solo_stock_market`
  ADD COLUMN IF NOT EXISTS `name` VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `broker_title` VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `sector` VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `archetype` VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `lore` TEXT NULL,
  ADD COLUMN IF NOT EXISTS `asset_type` ENUM('EQUITY', 'CRYPTO', 'ETF') NOT NULL DEFAULT 'EQUITY',
  ADD COLUMN IF NOT EXISTS `trade_status` ENUM('TRADABLE', 'NON_TRADABLE', 'TRACKED_ONLY') NOT NULL DEFAULT 'TRADABLE',
  ADD COLUMN IF NOT EXISTS `index_id` VARCHAR(32) NULL,
  ADD COLUMN IF NOT EXISTS `beta` DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS `target_yield_bps` INT NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS `enabled` TINYINT NOT NULL DEFAULT 1,
  MODIFY COLUMN `asset_type` ENUM('EQUITY', 'CRYPTO', 'ETF') NOT NULL DEFAULT 'EQUITY',
  MODIFY COLUMN `trade_status` ENUM('TRADABLE', 'NON_TRADABLE', 'TRACKED_ONLY') NOT NULL DEFAULT 'TRADABLE',
  MODIFY COLUMN `sector` VARCHAR(64) NOT NULL DEFAULT '',
  MODIFY COLUMN `archetype` VARCHAR(64) NOT NULL DEFAULT '';

-- Complete Municipal City Catalog & Sovereign ETFs
INSERT INTO `solo_stock_market` (`ticker`, `name`, `broker_title`, `sector`, `archetype`, `asset_type`, `trade_status`, `index_id`, `price`, `price_old`, `dividend`, `beta`, `target_yield_bps`, `enabled`)
VALUES
  -- 👑 Phase 22: Sovereign Composite ETFs (PROXIES - Soulbound / Achievement Granted)
  ('MS500', 'Midgard Sovereign Core ETF', 'Royal Treasury of Prontera', 'Broad Realm Composite', 'Balanced Dividend Aristocrat', 'ETF', 'NON_TRADABLE', 'MIDGARD_CORE', 100, 100, 3, 0.75, 45, 1),
  ('WORLD', 'Pan-Midgard All-World ETF', 'Inter-Realm Trade Commission', 'Global Total Market (All-Cap)', 'Global Diversified Sovereign Equity', 'ETF', 'TRADABLE', 'ALL_WORLD', 100, 100, 3, 0.65, 45, 1),

  -- 📍 Phase 0: Baseline Midgard Core (ENABLED / TRADABLE)
  ('PRT', 'Prontera Capital Inc.', 'Midgard Stock Index', 'Sovereign Core', 'Blue-Chip Balanced', 'EQUITY', 'TRADABLE', NULL, 100, 100, 3, 1.00, 50, 1),
  ('GEF', 'Geffen Arcanetech', 'Geffen Magical Equities', 'Arcane Supplies', 'Moderate Growth', 'EQUITY', 'TRADABLE', NULL, 100, 100, 3, 1.20, 30, 1),
  ('MOR', 'Morroc Oasis Trading', 'Morroc Expansion Bonds', 'Desert Commerce', 'Trading Volatility', 'EQUITY', 'TRADABLE', NULL, 100, 100, 3, 1.30, 35, 1),
  ('PAY', 'Payon Timber & Craft', 'Payon Forest Interests', 'Forestry & Crafts', 'Commodities Value', 'EQUITY', 'TRADABLE', NULL, 100, 100, 3, 0.80, 55, 1),
  ('ALB', 'Alberta Maritime Logistics', 'Alberta Shipping Corp', 'Harbor & Shipping', 'High Dividend Income', 'EQUITY', 'TRADABLE', NULL, 100, 100, 3, 0.75, 60, 1),

  -- 🚀 Phase 1: Schwarzwald Republic & Frontier High-Tech (ENABLED / TRADABLE)
  ('LHZ', 'Rekenber Frontier Biotech', 'Rekenber Securities', 'Biotech & Robotics', 'Pure Growth Tech', 'EQUITY', 'TRADABLE', NULL, 100, 100, 0, 1.80, 0, 1),
  ('EIN', 'Einbroch Heavy Industries', 'Schwarzwald Iron & Steam', 'Heavy Manufacturing', 'Industrial CapEx Growth', 'EQUITY', 'TRADABLE', NULL, 100, 100, 1, 1.40, 10, 1),
  ('YUN', 'Yuno Arcane Institute', 'Juperos Deep-Tech Trust', 'Ancient Physics & Tech', 'Speculative Venture', 'EQUITY', 'TRADABLE', NULL, 100, 100, 0, 1.50, 0, 1),
  ('HUG', 'Hugel Leisure & Coastal', 'Hugel Racing Syndicate', 'Regional Leisure', 'Gaming Micro-Cap', 'EQUITY', 'TRADABLE', NULL, 100, 100, 3, 0.90, 30, 1),

  -- 🏛️ Phase 2: Rune-Midgarts Domestic Expansion (TRACKED ONLY)
  ('ADB', 'Kafra Global Corporation', 'Aldebaran Kafra Index', 'Teleport & Utilities', 'Blue-Chip Dividend Aristocrat', 'EQUITY', 'TRACKED_ONLY', NULL, 100, 100, 5, 0.50, 60, 1),
  ('CMD', 'Comodo Entertainment Syndicate', 'Comodo Leisure Equities', 'Casino & Leisure', 'High-Beta Discretionary', 'EQUITY', 'TRACKED_ONLY', NULL, 100, 100, 4, 1.90, 50, 1),
  ('IZL', 'Izlude Maritime Transport', 'Izlude Naval Bonds', 'Ferry & Maritime Defense', 'Small-Cap Defense', 'EQUITY', 'TRACKED_ONLY', NULL, 100, 100, 3, 0.70, 35, 1),
  ('LUT', 'Santa Toy Factory Robotics', 'Lutie Automated Assembly', 'Consumer Manufacturing', 'Seasonal Robotics', 'EQUITY', 'TRACKED_ONLY', NULL, 100, 100, 2, 1.10, 20, 1),

  -- ☀️ Phase 3: Theocratic Sovereign & Commodities (TRACKED ONLY)
  ('RAC', 'Cheshrumnir Sacred Trust', 'Temple of Freya Sovereign Trust', 'Theocratic Sovereign Fund', 'Gold & Tithe Haven', 'EQUITY', 'TRACKED_ONLY', NULL, 100, 100, 4, 0.30, 40, 1),
  ('VEI', 'Veins Volcanic Minerals', 'Thor Geothermal Energy', 'Energy & Minerals', 'Commodity Exploration', 'EQUITY', 'TRACKED_ONLY', NULL, 100, 100, 3, 1.60, 35, 1),
  ('JAW', 'Jawaii Luxury Resorts', 'Jawaii Island Monopoly', 'Ultra-Luxury Hospitality', 'Monopoly Cash Flow', 'EQUITY', 'TRACKED_ONLY', NULL, 100, 100, 6, 0.40, 65, 1),
  ('UMB', 'Utan Ecotourism & Relics', 'Umbala Primitive Ventures', 'Exotic Commodities', 'Micro-Cap Speculation', 'EQUITY', 'TRACKED_ONLY', NULL, 100, 100, 0, 1.50, 5, 1),

  -- 🌏 Phase 4: Global Cultural & Agrarian Markets (TRACKED ONLY)
  ('LOU', 'Louyang Herbal Medicine', 'Dragon Herbal Pharmaceuticals', 'Traditional Healthcare', 'Defensive Healthcare', 'EQUITY', 'TRACKED_ONLY', NULL, 100, 100, 4, 0.60, 40, 1),
  ('MOS', 'Moscovia Prime Forestry', 'Czar Forest & Fur Resources', 'Natural Resources & Timber', 'Soft Commodity Value', 'EQUITY', 'TRACKED_ONLY', NULL, 100, 100, 5, 0.80, 50, 1),
  ('AMA', 'Amatsu Artisan Guild', 'Amatsu Blade & Silk Corp', 'Artisanal Crafts & Tourism', 'Boutique Heritage', 'EQUITY', 'TRACKED_ONLY', NULL, 100, 100, 3, 0.70, 35, 1),
  ('AYO', 'Ayothaya River Trading', 'Ayothaya Agrarian Logistics', 'Agricultural Commodities', 'Agrarian Steady Value', 'EQUITY', 'TRACKED_ONLY', NULL, 100, 100, 4, 0.60, 45, 1),
  ('GON', 'Kunlun Taoist Realm', 'Gonryun Floating Estates', 'Mystical Consumables & Air-Rights', 'Cultivation Luxury', 'EQUITY', 'TRACKED_ONLY', NULL, 100, 100, 2, 1.00, 25, 1),
  ('BRA', 'Brasilis Carnival & Flora', 'Brasilis Bio-Prospecting', 'Eco-Energy & Festivals', 'Event & Bio Growth', 'EQUITY', 'TRACKED_ONLY', NULL, 100, 100, 3, 1.20, 30, 1),
  ('DEW', 'Dewata Karakatau Mines', 'Dewata Gold & Spice Corp', 'Precious Metals & Spices', 'Volcanic Metal Resource', 'EQUITY', 'TRACKED_ONLY', NULL, 100, 100, 4, 1.40, 40, 1),
  ('MAL', 'Port Malaya Maritime', 'Malaya Regional Logistics', 'Port Cargo & Healthcare', 'Emerging Market Logistics', 'EQUITY', 'TRACKED_ONLY', NULL, 100, 100, 3, 1.00, 35, 1),

  -- 💀 Phase 5: Outliers & Interdimensional Markets (TRACKED ONLY)
  ('NIF', 'Nifflheim Occult Relics', 'Underworld Distressed Debt', 'Occult & Distressed Assets', 'Junk Bond Speculation', 'EQUITY', 'TRACKED_ONLY', NULL, 100, 100, 0, 2.50, 0, 1),
  ('DIC', 'Ash Vacuum Mining Alliance', 'El Dicastes Bradium Exploration', 'Extraplanar Minerals & Energy', 'Interdimensional Venture', 'EQUITY', 'TRACKED_ONLY', NULL, 100, 100, 0, 2.20, 5, 1),

  -- ⚡ Phase 13: Decentralized Rune & Crypto-Asset Protocols (ENABLED / TRADABLE)
  ('EMP', 'Emperium Shard Protocol', 'Sovereign Guild Vaults', 'Sovereign Ore & Protocol', 'Deflationary Store of Value', 'CRYPTO', 'TRADABLE', NULL, 100, 100, 0, 2.80, 0, 1),
  ('YMI', 'Heart of Ymir Alchemax', 'Juperos Arcane Matrix', 'Arcane Computation & Gas', 'Decentralized Alchemical Matrix', 'CRYPTO', 'TRADABLE', NULL, 100, 100, 1, 2.40, 10, 1),
  ('WRP', 'Warp Light Protocol', 'Acolyte High-Speed Rail', 'Spatial Teleportation Rail', 'Ultra-High-Speed Ledger', 'CRYPTO', 'TRADABLE', NULL, 100, 100, 0, 3.20, 0, 1),
  ('SHD', 'Shadow Guild Stealth Ring', 'Morroc Black Syndicate', 'Stealth & Underground Trade', 'Zero-Knowledge Anonymous Ring', 'CRYPTO', 'TRADABLE', NULL, 100, 100, 0, 2.60, 0, 1),
  ('ZEX', 'Midgard Exchange Coin', 'Alberta Merchant Consortium', 'Market Infrastructure', 'Utility Token & Fee Rebate', 'CRYPTO', 'TRADABLE', NULL, 100, 100, 1, 1.70, 5, 1),
  ('ORA', 'Eye of Odin Oracle', 'Hugin & Munin Feeds', 'Arcane Data Infrastructure', 'Decentralized Oracle Feeds', 'CRYPTO', 'TRADABLE', NULL, 100, 100, 2, 1.80, 15, 1),
  ('POR', 'King Poring Meme Standard', 'Novice South-Field Syndicate', 'Meme & Social Frenzy', 'Pure Community Speculation', 'CRYPTO', 'TRADABLE', NULL, 100, 100, 0, 4.50, 0, 1),
  ('NZN', 'Neo-Zeny Kafra Dollar', 'Kafra Reserve Trust', 'Settlement & Arbitrage', '1:1 Reserve-Pegged Dollar', 'CRYPTO', 'TRADABLE', NULL, 100, 100, 2, 0.05, 20, 1),
  ('ALM', 'Alchemax AMM Pool', 'Morroc Bazaar Cauldron', 'Decentralized Finance (DeFi)', 'Automated Liquidity Cauldron', 'CRYPTO', 'TRADABLE', NULL, 100, 100, 4, 2.10, 35, 1),
  ('KFX', 'Kafra Fast-eXchange', 'Inter-Realm Remittance', 'Sovereign Banking Rail', 'Institutional Remittance Ledger', 'CRYPTO', 'TRADABLE', NULL, 100, 100, 3, 1.50, 25, 1)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `broker_title` = VALUES(`broker_title`),
  `sector` = VALUES(`sector`),
  `archetype` = VALUES(`archetype`),
  `asset_type` = VALUES(`asset_type`),
  `trade_status` = VALUES(`trade_status`),
  `index_id` = VALUES(`index_id`),
  `beta` = VALUES(`beta`),
  `target_yield_bps` = VALUES(`target_yield_bps`),
  `enabled` = VALUES(`enabled`);



CREATE TABLE IF NOT EXISTS `solo_stock_player` (
  `account_id` INT(11) UNSIGNED NOT NULL,
  `ticker` VARCHAR(10) NOT NULL,
  `shares` INT DEFAULT 0,
  `total_cost` BIGINT DEFAULT 0,
  `pending_div` INT DEFAULT 0,
  `drip_enabled` TINYINT DEFAULT 0,
  `drip_carryover` INT DEFAULT 0,
  PRIMARY KEY (`account_id`, `ticker`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `solo_stock_meta` (
  `mkey` VARCHAR(32) PRIMARY KEY,
  `mval` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `solo_stock_events_def` (
  `event_id` VARCHAR(32) PRIMARY KEY,
  `category` VARCHAR(32) NOT NULL,
  `event_name` VARCHAR(64) NOT NULL,
  `ticker_target` VARCHAR(64) DEFAULT '',
  `price_pct_change` INT DEFAULT 0,
  `ticker_secondary` VARCHAR(64) DEFAULT '',
  `price_secondary_pct_change` INT DEFAULT 0,
  `dividend_change` INT DEFAULT 0,
  `direct_payout_per_share` INT DEFAULT 0,
  `mood_override` TINYINT DEFAULT 0,
  `duration_shifts` INT DEFAULT 0,
  `reverse_split_ratio` INT DEFAULT 0,
  `tax_rate_override` INT DEFAULT -1,
  `headline` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `weight` INT DEFAULT 10,
  `enabled` TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `solo_stock_events_active` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` VARCHAR(32) NOT NULL,
  `ticker` VARCHAR(64) NOT NULL,
  `start_time` INT UNSIGNED NOT NULL,
  `end_time` INT UNSIGNED NOT NULL,
  `remaining_shifts` INT DEFAULT 0,
  `tax_rate_override` INT DEFAULT -1,
  `mood_override` TINYINT DEFAULT 0,
  `headline` VARCHAR(255) NOT NULL,
  INDEX `idx_active_event` (`event_id`),
  INDEX `idx_active_ticker` (`ticker`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `solo_stock_events_log` (
  `log_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `event_id` VARCHAR(32) NOT NULL,
  `event_name` VARCHAR(64) NOT NULL,
  `category` VARCHAR(32) NOT NULL,
  `ticker_target` VARCHAR(64) NOT NULL,
  `headline` VARCHAR(255) NOT NULL,
  `details` TEXT,
  `triggered_by` VARCHAR(32) DEFAULT 'MIDNIGHT_CRON',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_log_created` (`created_at`),
  INDEX `idx_log_ticker` (`ticker_target`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Idempotent column expansions for live databases
ALTER TABLE `solo_stock_events_def`
  MODIFY COLUMN `ticker_target` VARCHAR(64) DEFAULT '',
  MODIFY COLUMN `ticker_secondary` VARCHAR(64) DEFAULT '';

ALTER TABLE `solo_stock_events_active`
  MODIFY COLUMN `ticker` VARCHAR(64) NOT NULL;

ALTER TABLE `solo_stock_events_log`
  MODIFY COLUMN `ticker_target` VARCHAR(64) NOT NULL;

-- --------------------------------------------------------
-- Table structure for `solo_stock_history` (10-minute intraday snapshots)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `solo_stock_history` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `ticker` VARCHAR(10) NOT NULL,
  `open_price` INT NOT NULL,
  `high_price` INT NOT NULL,
  `low_price` INT NOT NULL,
  `close_price` INT NOT NULL,
  `volume` INT DEFAULT 0,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_history_ticker_ts` (`ticker`, `timestamp` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `solo_stock_history_daily` (Consolidated macro daily candles)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `solo_stock_history_daily` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `ticker` VARCHAR(10) NOT NULL,
  `open_price` INT NOT NULL,
  `high_price` INT NOT NULL,
  `low_price` INT NOT NULL,
  `close_price` INT NOT NULL,
  `volume` INT DEFAULT 0,
  `date` DATE NOT NULL,
  UNIQUE KEY `uk_history_ticker_date` (`ticker`, `date`),
  INDEX `idx_history_daily_ticker_date` (`ticker`, `date` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure & migration for `solo_persistence_log` (Grand Category ENUM)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `solo_persistence_log` (
  `account_id` INT(11) UNSIGNED NOT NULL,
  `category` ENUM(
    'KILL',
    'LOOT',
    'ECONOMY',
    'ACHIEVEMENT',
    'COLLECTION',
    'REPUTATION',
    'INSTANCE',
    'MASTERY',
    'DISCOVERY'
  ) NOT NULL,
  `target_id` INT(11) UNSIGNED NOT NULL,
  `value` INT(11) UNSIGNED DEFAULT 0,
  `tstamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`account_id`, `category`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=ascii;

-- Idempotent column modification for existing live databases
ALTER TABLE `solo_persistence_log`
  MODIFY COLUMN `category` ENUM(
    'KILL',
    'LOOT',
    'ECONOMY',
    'ACHIEVEMENT',
    'COLLECTION',
    'REPUTATION',
    'INSTANCE',
    'MASTERY',
    'DISCOVERY'
  ) NOT NULL,
  MODIFY COLUMN `target_id` INT(11) UNSIGNED NOT NULL,
  MODIFY COLUMN `value` INT(11) UNSIGNED DEFAULT 0,
  CONVERT TO CHARACTER SET ascii;

-- --------------------------------------------------------
-- Table structure for `solo_stock_transactions` (Audit & History Ledger)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `solo_stock_transactions` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `account_id` INT UNSIGNED NOT NULL,
  `char_id` INT UNSIGNED NOT NULL DEFAULT 0,
  `ticker` VARCHAR(10) NOT NULL,
  `action` ENUM('BUY', 'SELL', 'DIVIDEND', 'DRIP_BUY') NOT NULL,
  `shares` INT UNSIGNED NOT NULL DEFAULT 0,
  `price` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_amount` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `fee` INT UNSIGNED NOT NULL DEFAULT 0,
  `destination` ENUM('WALLET', 'BANK') NOT NULL DEFAULT 'WALLET',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_st_account_created` (`account_id`, `created_at` DESC),
  INDEX `idx_st_ticker_created` (`ticker`, `created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `solo_milestones` (Hunt Milestones DB)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `solo_milestones` (
  `id` VARCHAR(64) NOT NULL,
  `category` ENUM('MVP', 'MINI_BOSS', 'NORMAL', 'TOTAL', 'SPECIFIC_MOB') NOT NULL DEFAULT 'SPECIFIC_MOB',
  `prev_milestone_id` VARCHAR(64) DEFAULT NULL,
  `target_mob_id` INT UNSIGNED NOT NULL DEFAULT 0,
  `required_count` INT UNSIGNED NOT NULL DEFAULT 100,
  `title` VARCHAR(128) NOT NULL,
  `description` VARCHAR(255) NOT NULL DEFAULT '',
  `reward_zeny` INT UNSIGNED NOT NULL DEFAULT 0,
  `reward_item_id` INT UNSIGNED NOT NULL DEFAULT 0,
  `reward_item_amount` INT UNSIGNED NOT NULL DEFAULT 0,
  `reward_stock_ticker` VARCHAR(10) DEFAULT NULL,
  `reward_stock_shares` INT UNSIGNED NOT NULL DEFAULT 0,
  `reward_desc` VARCHAR(255) NOT NULL DEFAULT '',
  `tier_label` VARCHAR(64) NOT NULL DEFAULT 'Global / Boss',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_milestones_active_sort` (`is_active`, `sort_order`),
  INDEX `idx_milestones_prev_id` (`prev_milestone_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Idempotent column additions for solo_milestones
ALTER TABLE `solo_milestones`
  ADD COLUMN IF NOT EXISTS `prev_milestone_id` VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `reward_stock_ticker` VARCHAR(10) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `reward_stock_shares` INT UNSIGNED NOT NULL DEFAULT 0;

-- --------------------------------------------------------
-- Table structure for `solo_milestone_claims` (RODEX Claim Ledger)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `solo_milestone_claims` (
  `account_id` INT UNSIGNED NOT NULL,
  `milestone_id` VARCHAR(64) NOT NULL,
  `char_id` INT UNSIGNED NOT NULL DEFAULT 0,
  `claimed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`account_id`, `milestone_id`),
  INDEX `idx_smc_char_id` (`char_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Seed Seeded Milestones (Sampling Novice -> 4th Class Lv 200+)
-- --------------------------------------------------------
INSERT INTO `solo_milestones` 
(`id`, `category`, `prev_milestone_id`, `target_mob_id`, `required_count`, `title`, `description`, `reward_zeny`, `reward_item_id`, `reward_item_amount`, `reward_stock_ticker`, `reward_stock_shares`, `reward_desc`, `tier_label`, `is_active`, `sort_order`)
VALUES
('mvp_centurion_50', 'MVP', NULL, 0, 50, 'Centurion Slayer', 'Defeat 50 MvP Bosses across Midgard', 1000000, 0, 0, 'MS500', 100, '+10% Boss Drop Rate permanently + 1,000,000z + 100x MS500 ETF', 'Global / Boss', 1, 1),
('exterminator_tier_1', 'TOTAL', NULL, 0, 25000, 'Exterminator Tier I', 'Slay 25,000 total monsters of any class', 500000, 617, 1, NULL, 0, '500,000 Zeny + 1x Old Purple Box', 'Global / Boss', 1, 2),
('poring_hunter_500', 'SPECIFIC_MOB', NULL, 1002, 500, 'Jelly Menace (Poring)', 'Exterminate 500 Porings in Prontera Fields', 25000, 501, 50, NULL, 0, '25,000 Zeny + 50x Red Potions', 'Novice (Lv 1–40)', 1, 3),
('orc_warrior_1000', 'SPECIFIC_MOB', 'poring_hunter_500', 1023, 1000, 'Orc Village Conqueror', 'Defeat 1,000 Orc Warriors in Gef_Fild', 100000, 604, 5, NULL, 0, '100,000 Zeny + 5x Dead Branches', '2nd Class (Lv 41–99)', 1, 4),
('raydric_slayer_1500', 'SPECIFIC_MOB', 'orc_warrior_1000', 1163, 1500, 'Glast Heim Knightfall', 'Slay 1,500 Raydrics in the Castle ruins', 350000, 984, 10, NULL, 0, '350,000 Zeny + 10x Oridecon', 'Trans (Lv 90–99)', 1, 5),
('magmaring_blaster_2000', 'SPECIFIC_MOB', 'raydric_slayer_1500', 1836, 2000, 'Magma Blaster', 'Extinguish 2,000 Magmarings in Veins Field', 750000, 617, 3, NULL, 0, '750,000 Zeny + 3x Old Purple Boxes', '3rd Class (Lv 100–185)', 1, 6),
('giant_caput_2500', 'SPECIFIC_MOB', 'magmaring_blaster_2000', 20929, 2500, 'Biomass Exterminator', 'Eliminate 2,500 Giant Caputs in 4th Class Zone', 2500000, 616, 2, 'MS500', 50, '2,500,000 Zeny + 2x Old Card Albums + 50x MS500 ETF', '4th Class (Lv 200–250+)', 1, 7)
ON DUPLICATE KEY UPDATE
`prev_milestone_id` = VALUES(`prev_milestone_id`),
`title` = VALUES(`title`),
`description` = VALUES(`description`),
`reward_zeny` = VALUES(`reward_zeny`),
`reward_item_id` = VALUES(`reward_item_id`),
`reward_item_amount` = VALUES(`reward_item_amount`),
`reward_stock_ticker` = VALUES(`reward_stock_ticker`),
`reward_stock_shares` = VALUES(`reward_stock_shares`),
`reward_desc` = VALUES(`reward_desc`),
`tier_label` = VALUES(`tier_label`),
`is_active` = VALUES(`is_active`),
`sort_order` = VALUES(`sort_order`);

-- --------------------------------------------------------
-- Day 1 Citizen Sovereign ETF Starter Grant (500 MS500 shares)
-- --------------------------------------------------------
INSERT INTO `solo_stock_player` (`account_id`, `ticker`, `shares`, `total_cost`, `pending_div`, `drip_enabled`, `drip_carryover`)
SELECT `account_id`, 'MS500', 500, 0, 0, 1, 0
FROM `login`
WHERE `account_id` >= 2000000
ON DUPLICATE KEY UPDATE `shares` = GREATEST(`shares`, 500);



