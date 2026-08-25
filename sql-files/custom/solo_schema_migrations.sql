-- Solo-centric database schema definitions and migrations
-- Do not embed these in NPC scripts (`OnInit`) as it violates least privilege,
-- slows down map-server boot times, and obscures schema tracking.

CREATE TABLE IF NOT EXISTS `solo_server_config` (
  `key` VARCHAR(32) PRIMARY KEY,
  `value` INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `solo_server_config` (`key`, `value`) VALUES ('junk_roster_size', 5);
INSERT IGNORE INTO `solo_server_config` (`key`, `value`) VALUES ('expedition_cap_hours', 48);

CREATE TABLE IF NOT EXISTS `solo_stock_market` (
  `ticker` VARCHAR(10) PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL DEFAULT '',
  `broker_title` VARCHAR(64) NOT NULL DEFAULT '',
  `sector` VARCHAR(64) NOT NULL DEFAULT '',
  `archetype` VARCHAR(64) NOT NULL DEFAULT '',
  `lore` TEXT NULL,
  `asset_type` ENUM('EQUITY', 'CRYPTO') NOT NULL DEFAULT 'EQUITY',
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
  ADD COLUMN IF NOT EXISTS `asset_type` ENUM('EQUITY', 'CRYPTO') NOT NULL DEFAULT 'EQUITY',
  ADD COLUMN IF NOT EXISTS `beta` DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS `target_yield_bps` INT NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS `enabled` TINYINT NOT NULL DEFAULT 1,
  MODIFY COLUMN `sector` VARCHAR(64) NOT NULL DEFAULT '',
  MODIFY COLUMN `archetype` VARCHAR(64) NOT NULL DEFAULT '';

-- Complete Municipal City Catalog: Base 5 (Live) + Phase 1 (Schwarzwald Enabled) + Future Phases (Disabled) + Crypto (Enabled)
INSERT INTO `solo_stock_market` (`ticker`, `name`, `broker_title`, `sector`, `archetype`, `asset_type`, `price`, `price_old`, `dividend`, `beta`, `target_yield_bps`, `enabled`)
VALUES
  -- 📍 Phase 0: Baseline Midgard Core (ENABLED)
  ('PRT', 'Prontera Capital Inc.', 'Midgard Stock Index', 'Sovereign Core', 'Blue-Chip Balanced', 'EQUITY', 100, 100, 3, 1.00, 50, 1),
  ('GEF', 'Geffen Arcanetech', 'Geffen Magical Equities', 'Arcane Supplies', 'Moderate Growth', 'EQUITY', 100, 100, 3, 1.20, 30, 1),
  ('MOR', 'Morroc Oasis Trading', 'Morroc Expansion Bonds', 'Desert Commerce', 'Trading Volatility', 'EQUITY', 100, 100, 3, 1.30, 35, 1),
  ('PAY', 'Payon Timber & Craft', 'Payon Forest Interests', 'Forestry & Crafts', 'Commodities Value', 'EQUITY', 100, 100, 3, 0.80, 55, 1),
  ('ALB', 'Alberta Maritime Logistics', 'Alberta Shipping Corp', 'Harbor & Shipping', 'High Dividend Income', 'EQUITY', 100, 100, 3, 0.75, 60, 1),

  -- 🚀 Phase 1: Schwarzwald Republic & Frontier High-Tech (ENABLED)
  ('LHZ', 'Rekenber Frontier Biotech', 'Rekenber Securities', 'Biotech & Robotics', 'Pure Growth Tech', 'EQUITY', 100, 100, 0, 1.80, 0, 1),
  ('EIN', 'Einbroch Heavy Industries', 'Schwarzwald Iron & Steam', 'Heavy Manufacturing', 'Industrial CapEx Growth', 'EQUITY', 100, 100, 1, 1.40, 10, 1),
  ('YUN', 'Yuno Arcane Institute', 'Juperos Deep-Tech Trust', 'Ancient Physics & Tech', 'Speculative Venture', 'EQUITY', 100, 100, 0, 1.50, 0, 1),
  ('HUG', 'Hugel Leisure & Coastal', 'Hugel Racing Syndicate', 'Regional Leisure', 'Gaming Micro-Cap', 'EQUITY', 100, 100, 3, 0.90, 30, 1),

  -- 🏛️ Phase 2: Rune-Midgarts Domestic Expansion (DISABLED)
  ('ADB', 'Kafra Global Corporation', 'Aldebaran Kafra Index', 'Teleport & Utilities', 'Blue-Chip Dividend Aristocrat', 'EQUITY', 100, 100, 5, 0.50, 60, 0),
  ('CMD', 'Comodo Entertainment Syndicate', 'Comodo Leisure Equities', 'Casino & Leisure', 'High-Beta Discretionary', 'EQUITY', 100, 100, 4, 1.90, 50, 0),
  ('IZL', 'Izlude Maritime Transport', 'Izlude Naval Bonds', 'Ferry & Maritime Defense', 'Small-Cap Defense', 'EQUITY', 100, 100, 3, 0.70, 35, 0),
  ('LUT', 'Santa Toy Factory Robotics', 'Lutie Automated Assembly', 'Consumer Manufacturing', 'Seasonal Robotics', 'EQUITY', 100, 100, 2, 1.10, 20, 0),

  -- ☀️ Phase 3: Theocratic Sovereign & Commodities (DISABLED)
  ('RAC', 'Cheshrumnir Sacred Trust', 'Temple of Freya Sovereign Trust', 'Theocratic Sovereign Fund', 'Gold & Tithe Haven', 'EQUITY', 100, 100, 4, 0.30, 40, 0),
  ('VEI', 'Veins Volcanic Minerals', 'Thor Geothermal Energy', 'Energy & Minerals', 'Commodity Exploration', 'EQUITY', 100, 100, 3, 1.60, 35, 0),
  ('JAW', 'Jawaii Luxury Resorts', 'Jawaii Island Monopoly', 'Ultra-Luxury Hospitality', 'Monopoly Cash Flow', 'EQUITY', 100, 100, 6, 0.40, 65, 0),
  ('UMB', 'Utan Ecotourism & Relics', 'Umbala Primitive Ventures', 'Exotic Commodities', 'Micro-Cap Speculation', 'EQUITY', 100, 100, 0, 1.50, 5, 0),

  -- 🌏 Phase 4: Global Cultural & Agrarian Markets (DISABLED)
  ('LOU', 'Louyang Herbal Medicine', 'Dragon Herbal Pharmaceuticals', 'Traditional Healthcare', 'Defensive Healthcare', 'EQUITY', 100, 100, 4, 0.60, 40, 0),
  ('MOS', 'Moscovia Prime Forestry', 'Czar Forest & Fur Resources', 'Natural Resources & Timber', 'Soft Commodity Value', 'EQUITY', 100, 100, 5, 0.80, 50, 0),
  ('AMA', 'Amatsu Artisan Guild', 'Amatsu Blade & Silk Corp', 'Artisanal Crafts & Tourism', 'Boutique Heritage', 'EQUITY', 100, 100, 3, 0.70, 35, 0),
  ('AYO', 'Ayothaya River Trading', 'Ayothaya Agrarian Logistics', 'Agricultural Commodities', 'Agrarian Steady Value', 'EQUITY', 100, 100, 4, 0.60, 45, 0),
  ('GON', 'Kunlun Taoist Realm', 'Gonryun Floating Estates', 'Mystical Consumables & Air-Rights', 'Cultivation Luxury', 'EQUITY', 100, 100, 2, 1.00, 25, 0),
  ('BRA', 'Brasilis Carnival & Flora', 'Brasilis Bio-Prospecting', 'Eco-Energy & Festivals', 'Event & Bio Growth', 'EQUITY', 100, 100, 3, 1.20, 30, 0),
  ('DEW', 'Dewata Karakatau Mines', 'Dewata Gold & Spice Corp', 'Precious Metals & Spices', 'Volcanic Metal Resource', 'EQUITY', 100, 100, 4, 1.40, 40, 0),
  ('MAL', 'Port Malaya Maritime', 'Malaya Regional Logistics', 'Port Cargo & Healthcare', 'Emerging Market Logistics', 'EQUITY', 100, 100, 3, 1.00, 35, 0),

  -- 💀 Phase 5: Outliers & Interdimensional Markets (DISABLED)
  ('NIF', 'Nifflheim Occult Relics', 'Underworld Distressed Debt', 'Occult & Distressed Assets', 'Junk Bond Speculation', 'EQUITY', 100, 100, 0, 2.50, 0, 0),
  ('DIC', 'Ash Vacuum Mining Alliance', 'El Dicastes Bradium Exploration', 'Extraplanar Minerals & Energy', 'Interdimensional Venture', 'EQUITY', 100, 100, 0, 2.20, 5, 0),

  -- ⚡ Phase 13: Decentralized Rune & Crypto-Asset Protocols (ENABLED)
  ('EMP', 'Emperium Shard Protocol', 'Sovereign Guild Vaults', 'Sovereign Ore & Protocol', 'Deflationary Store of Value', 'CRYPTO', 100, 100, 0, 2.80, 0, 1),
  ('YMI', 'Heart of Ymir Alchemax', 'Juperos Arcane Matrix', 'Arcane Computation & Gas', 'Decentralized Alchemical Matrix', 'CRYPTO', 100, 100, 1, 2.40, 10, 1),
  ('WRP', 'Warp Light Protocol', 'Acolyte High-Speed Rail', 'Spatial Teleportation Rail', 'Ultra-High-Speed Ledger', 'CRYPTO', 100, 100, 0, 3.20, 0, 1),
  ('SHD', 'Shadow Guild Stealth Ring', 'Morroc Black Syndicate', 'Stealth & Underground Trade', 'Zero-Knowledge Anonymous Ring', 'CRYPTO', 100, 100, 0, 2.60, 0, 1),
  ('ZEX', 'Midgard Exchange Coin', 'Alberta Merchant Consortium', 'Market Infrastructure', 'Utility Token & Fee Rebate', 'CRYPTO', 100, 100, 1, 1.70, 5, 1),
  ('ORA', 'Eye of Odin Oracle', 'Hugin & Munin Feeds', 'Arcane Data Infrastructure', 'Decentralized Oracle Feeds', 'CRYPTO', 100, 100, 2, 1.80, 15, 1),
  ('POR', 'King Poring Meme Standard', 'Novice South-Field Syndicate', 'Meme & Social Frenzy', 'Pure Community Speculation', 'CRYPTO', 100, 100, 0, 4.50, 0, 1),
  ('NZN', 'Neo-Zeny Kafra Dollar', 'Kafra Reserve Trust', 'Settlement & Arbitrage', '1:1 Reserve-Pegged Dollar', 'CRYPTO', 100, 100, 2, 0.05, 20, 1),
  ('ALM', 'Alchemax AMM Pool', 'Morroc Bazaar Cauldron', 'Decentralized Finance (DeFi)', 'Automated Liquidity Cauldron', 'CRYPTO', 100, 100, 4, 2.10, 35, 1),
  ('KFX', 'Kafra Fast-eXchange', 'Inter-Realm Remittance', 'Sovereign Banking Rail', 'Institutional Remittance Ledger', 'CRYPTO', 100, 100, 3, 1.50, 25, 1)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `broker_title` = VALUES(`broker_title`),
  `sector` = VALUES(`sector`),
  `archetype` = VALUES(`archetype`),
  `asset_type` = VALUES(`asset_type`),
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

