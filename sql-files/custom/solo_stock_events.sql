-- ======================================================================
-- Midgard Stock Exchange: Black Swan & Market Event System Schema
-- ======================================================================

-- 1. Event Definitions Table (Catalog)
CREATE TABLE IF NOT EXISTS `solo_stock_events_def` (
    `event_id` VARCHAR(32) PRIMARY KEY,
    `category` VARCHAR(32) NOT NULL, -- MUNICIPAL_BOOM, MUNICIPAL_CRISIS, TRADE_WAR, STRUCTURAL, MACRO_GLOBAL
    `event_name` VARCHAR(64) NOT NULL,
    `ticker_target` VARCHAR(10) DEFAULT '', -- PRT, GEF, MOR, PAY, ALB, ALL, LOWEST
    `price_pct_change` INT DEFAULT 0,
    `ticker_secondary` VARCHAR(10) DEFAULT '',
    `price_secondary_pct_change` INT DEFAULT 0,
    `dividend_change` INT DEFAULT 0,
    `direct_payout_per_share` INT DEFAULT 0, -- Instant cash windfall dividend
    `mood_override` TINYINT DEFAULT 0, -- 0: None, 1: Bullish, 2: Bearish, 3: Chaos
    `duration_shifts` INT DEFAULT 0, -- Duration in hourly shifts (e.g. 24, 48, 72)
    `reverse_split_ratio` INT DEFAULT 0, -- e.g. 5 for 1:5 consolidation
    `tax_rate_override` INT DEFAULT -1, -- -1: No override, 0: 0% tax holiday
    `headline` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `weight` INT DEFAULT 10,
    `enabled` TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Active Ongoing Events Table
CREATE TABLE IF NOT EXISTS `solo_stock_events_active` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `event_id` VARCHAR(32) NOT NULL,
    `ticker` VARCHAR(10) NOT NULL,
    `start_time` INT UNSIGNED NOT NULL,
    `end_time` INT UNSIGNED NOT NULL,
    `remaining_shifts` INT DEFAULT 0,
    `tax_rate_override` INT DEFAULT -1,
    `mood_override` TINYINT DEFAULT 0,
    `headline` VARCHAR(255) NOT NULL,
    INDEX `idx_active_event` (`event_id`),
    INDEX `idx_active_ticker` (`ticker`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Event Historical Audit Log
CREATE TABLE IF NOT EXISTS `solo_stock_events_log` (
    `log_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `event_id` VARCHAR(32) NOT NULL,
    `event_name` VARCHAR(64) NOT NULL,
    `category` VARCHAR(32) NOT NULL,
    `ticker_target` VARCHAR(10) NOT NULL,
    `headline` VARCHAR(255) NOT NULL,
    `details` TEXT,
    `triggered_by` VARCHAR(32) DEFAULT 'MIDNIGHT_CRON',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_log_created` (`created_at`),
    INDEX `idx_log_ticker` (`ticker_target`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- Seed Catalog: 24 Diverse Black Swan & Market Events
-- ======================================================================

-- Category 1: Municipal Booms & Calamities (10 Events)
INSERT IGNORE INTO `solo_stock_events_def` 
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `dividend_change`, `headline`, `description`, `weight`) VALUES
('PRT_BOOM_ROYAL_GRANT', 'MUNICIPAL_BOOM', 'Royal Monopoly Grant', 'PRT', 75, 10, 
 'PRT Capital awarded exclusive royal trade and sovereign banking charter!', 
 'The Crown designates Prontera Capital as the sole treasury underwriter for the Kingdom, sending stock prices soaring.', 10),

('PRT_CRISIS_EMBEZZLEMENT', 'MUNICIPAL_CRISIS', 'High Court Embezzlement', 'PRT', -50, -5, 
 'High Court Auditor caught embezzling royal reserves; PRT assets frozen!', 
 'Corruption scandal in the capital forces emergency liquidity restrictions and panics municipal investors.', 10),

('GEF_BOOM_TRANSMUTATION', 'MUNICIPAL_BOOM', 'Transmutation Breakthrough', 'GEF', 85, 15, 
 'Geffen Alchemist Guild discovers stable synthetic gold catalyst!', 
 'Revolutionary arcane chemistry drastically cuts magical fabrication costs, causing explosive equity growth.', 10),

('GEF_CRISIS_MANA_LEAK', 'MUNICIPAL_CRISIS', 'Tower Mana Core Breach', 'GEF', -55, -10, 
 'Geffen Tower magical reactor breach halts all arcanetech operations!', 
 'Dangerous mana radiation leaks force the evacuation of upper laboratories and suspend fabrication contracts.', 10),

('MOR_BOOM_SILK_ROAD', 'MUNICIPAL_BOOM', 'Ancient Silk Road Unearthed', 'MOR', 90, 20, 
 'Deep desert explorers uncover lost subterranean spice & relic vaults!', 
 'Morroc merchant guilds secure monopoly rights over newly discovered ancient trade corridors across the Sograt desert.', 10),

('MOR_CRISIS_SATAN_RIFTS', 'MUNICIPAL_CRISIS', 'Satan Morroc Resurrection Rifts', 'MOR', -60, -15, 
 'Dimensional seismic rifts tear through the central Morroc bazaar!', 
 'Catastrophic tremors and dark energy emissions swallow commercial warehouses and disrupt trading caravans.', 10),

('PAY_BOOM_IRONWOOD', 'MUNICIPAL_BOOM', 'Sacred Ironwood Discovery', 'PAY', 70, 10, 
 'Forest rangers discover untouched groves of impenetrable Ironwood!', 
 'Payon craft guilds sign lucrative continental contracts to supply sacred timber for imperial fortifications.', 10),

('PAY_CRISIS_WILDFIRE', 'MUNICIPAL_CRISIS', 'Great Woodland Wildfire', 'PAY', -50, -5, 
 'Raging forest inferno incinerates Payon lumber mills and craft shops!', 
 'Dry seasonal winds spark an uncontrollable blaze across the northern woods, destroying timber reserves.', 10),

('ALB_BOOM_TRADE_WIND', 'MUNICIPAL_BOOM', 'Trade Wind Corridor Found', 'ALB', 80, 15, 
 'Navigators map new oceanic trade winds, halving voyage times to Amatsu!', 
 'Alberta shipping fleets achieve record export throughput, boosting maritime corporate revenues.', 10),

('ALB_CRISIS_GHOST_FLEET', 'MUNICIPAL_CRISIS', 'Ghost Fleet Armada Siege', 'ALB', -55, -10, 
 'Pirate King Drake and undead armada blockade the Alberta harbour!', 
 'Ghost ships sink multiple merchant galleons, paralyzing port commerce and triggering emergency maritime insurance claims.', 10);

-- Category 2: Cross-City Trade Wars & Sector Rotations (5 Events)
INSERT IGNORE INTO `solo_stock_events_def` 
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `ticker_secondary`, `price_secondary_pct_change`, `headline`, `description`, `weight`) VALUES
('WAR_ALB_OVER_MOR', 'TRADE_WAR', 'Maritime Route Hegemony', 'ALB', 70, 'MOR', -45, 
 'Alberta opens direct sea lanes, bypassing overland desert caravan tariffs!', 
 'Merchants abandon expensive desert toll routes in favor of ocean shipping, transferring market capitalization from Morroc to Alberta.', 8),

('WAR_MOR_OVER_ALB', 'TRADE_WAR', 'Desert Silk Road Monopoly', 'MOR', 70, 'ALB', -45, 
 'Morroc desert guild signs exclusive trade treaty with foreign sultans!', 
 'Overland spice routes flourish while offshore tariffs penalize maritime shipments, shifting wealth into Morroc.', 8),

('WAR_GEF_OVER_PAY', 'TRADE_WAR', 'Arcane Automation Wave', 'GEF', 65, 'PAY', -40, 
 'Geffen enchanted tool fabrication replaces traditional timber craftsmanship!', 
 'Automated arcane apparatuses flood the market, dampening demand for Payon hand-carved woodware.', 8),

('WAR_PAY_OVER_GEF', 'TRADE_WAR', 'Nature Craft Renaissance', 'PAY', 65, 'GEF', -40, 
 'Kingdom-wide anti-magic sentiment sparks a massive surge in authentic Payon crafts!', 
 'Nobility rejects volatile magical gadgets in favor of time-honored Payon artisan woodwork.', 8),

('WAR_PRT_IMPERIAL_TAX', 'TRADE_WAR', 'Royal Imperial Centralization', 'PRT', 50, 'ALL', -15, 
 'Crown levies special provincial development tariffs to enrich the Capital!', 
 'Prontera seizes provincial municipal reserves to fund imperial expansion, boosting PRT while cooling provincial shares.', 6);

-- Category 3: Financial & Structural Market Anomalies (4 Events)
INSERT IGNORE INTO `solo_stock_events_def` 
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `direct_payout_per_share`, `tax_rate_override`, `duration_shifts`, `headline`, `description`, `weight`) VALUES
('FIN_SHORT_SQUEEZE', 'STRUCTURAL', 'The Great Midgard Short Squeeze', 'LOWEST', 180, 0, -1, 0, 
 'Speculative guild syndicate triggers a massive historic short squeeze!', 
 'Aggressive retail speculation corners the lowest-valued stock in Midgard, driving astronomical overnight price gains.', 8),

('FIN_MEGA_DIVIDEND', 'STRUCTURAL', 'Special Cash Windfall Dividend', 'ALL', 0, 50, -1, 0, 
 'Corporate liquidations release a massive +50z/share special cash dividend!', 
 'Municipal enterprises distribute overseas asset liquidation proceeds directly to all active shareholders.', 8),

('FIN_TAX_HOLIDAY', 'STRUCTURAL', 'Royal Dividend Tax Holiday', 'ALL', 0, 0, 0, 72, 
 'King Tristan III declares a 72-hour 0% Dividend Tax Holiday!', 
 'All dividend withholding taxes are suspended kingdom-wide to celebrate sovereign prosperity.', 8),

('FIN_REVERSE_SPLIT', 'STRUCTURAL', 'Distressed Equity Capital Restructuring', 'LOWEST', 0, 0, -1, 0, 
 'Municipal regulators approve 1:5 reverse stock split for distressed enterprises!', 
 'Troubled low-cost shares are consolidated 1:5 at 5x price to stabilize market liquidity and capitalization.', 6);

-- Category 4: Macro & Cosmic Phenomena (5 Events)
INSERT IGNORE INTO `solo_stock_events_def` 
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `mood_override`, `duration_shifts`, `headline`, `description`, `weight`) VALUES
('MACRO_GOLDEN_JUBILEE', 'MACRO_GLOBAL', 'Midgard Golden Age Jubilee', 'ALL', 35, 1, 48, 
 'Kingdom-wide prosperity pact sparks unprecedented economic expansion across all sectors!', 
 'Festive celebrations, record harvest yields, and open trade corridors lift every municipal stock in Midgard.', 7),

('MACRO_GREAT_RECESSION', 'MACRO_GLOBAL', 'Continental Liquidity Crisis', 'ALL', -35, 2, 48, 
 'Severe rune shortage and banking panic trigger a kingdom-wide market recession!', 
 'Liquidity crunch forces mass liquidations, dragging down all municipal equities across Midgard.', 7),

('MACRO_MJOLNIR_METEOR', 'MACRO_GLOBAL', 'Mjolnir Meteor Shock', 'ALL', 0, 3, 48, 
 'Celestial fragments rain across Mt. Mjolnir, triggering extreme market volatility!', 
 'Astrological panic locks the market into Chaos Mood (Mood 3) with intensified hourly fluctuations.', 6),

('MACRO_VALHALLA_BLESSING', 'MACRO_GLOBAL', 'Valhalla Fortune Blessing', 'ALL', 20, 1, 48, 
 'Valkyries bestow divine favor upon Midgard, initiating a 48-hour Hyper-Bull run!', 
 'Unstoppable investor optimism locks the market into Bullish Mood (Mood 1) with amplified upward momentum.', 6),

('MACRO_RAGNAROK_ECLIPSE', 'MACRO_GLOBAL', 'Ragnarok Eclipse Dividend Freeze', 'ALL', -15, 3, 48, 
 'Solar eclipse darkens Midgard skies; all corporate dividend payouts frozen for 48 hours!', 
 'Superstitious commercial shutdowns and temple sacrifices bring corporate distributions to a complete standstill.', 6);
