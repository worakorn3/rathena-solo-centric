-- ======================================================================
-- Midgard Stock Exchange: Black Swan & Market Event System Schema
-- ======================================================================

-- 1. Event Definitions Table (Catalog)
CREATE TABLE IF NOT EXISTS `solo_stock_events_def` (
    `event_id` VARCHAR(32) PRIMARY KEY,
    `category` VARCHAR(32) NOT NULL, -- MUNICIPAL_BOOM, MUNICIPAL_CRISIS, TRADE_WAR, STRUCTURAL, MACRO_GLOBAL
    `event_name` VARCHAR(64) NOT NULL,
    `ticker_target` VARCHAR(64) DEFAULT '', -- PRT, GEF, MOR, PAY, ALB, ALL, LOWEST, or multi-ticker PRT,YUN,RAC
    `price_pct_change` INT DEFAULT 0,
    `ticker_secondary` VARCHAR(64) DEFAULT '',
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

-- ======================================================================
-- Phase 1 to Phase 5 Regional Municipal Events (All 22 Expansion Cities)
-- ======================================================================

-- Category 5: Phase 1 Schwarzwald Republic Events (8 Events + 4 Trade Wars)
INSERT IGNORE INTO `solo_stock_events_def` 
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `dividend_change`, `headline`, `description`, `weight`) VALUES
('LHZ_BOOM_HOMUNCULUS_PATENT', 'MUNICIPAL_BOOM', 'Homunculus Biotech Patent', 'LHZ', 80, 0,
 'Rekenber Corporation secures imperial patent on autonomous Homunculus catalyst!',
 'Breakthrough biotech research expands commercial guardian robotics contracts across Schwarzwald.', 10),

('LHZ_CRISIS_BIOLAB_BREACH', 'MUNICIPAL_CRISIS', 'Somatology Bio-Lab Breach', 'LHZ', -60, 0,
 'Containment breach in Somatology Bio-Laboratory Level 3 halts R&D operations!',
 'Hazardous experimental escapes trigger military quarantine and steep market sell-offs in LHZ equities.', 10),

('EIN_BOOM_STEAM_TURBINE', 'MUNICIPAL_BOOM', 'High-Pressure Steam Turbines', 'EIN', 70, 5,
 'Einbroch Heavy Industries unveils revolutionary high-pressure steam locomotives!',
 'Sprawling continental rail expansion contracts drive heavy manufacturing revenues and dividend bumps.', 10),

('EIN_CRISIS_SMELTER_EXPLOSION', 'MUNICIPAL_CRISIS', 'Central Smelter Core Blast', 'EIN', -55, -3,
 'Catastrophic blast furnace explosion destroys central Einbroch iron foundries!',
 'Industrial downtime and structural reconstruction costs depress quarterly manufacturing earnings.', 10),

('YUN_BOOM_JUPEROS_POWER', 'MUNICIPAL_BOOM', 'Juperos Ancient Core Tapped', 'YUN', 85, 0,
 'Yuno Arcane Institute successfully taps limitless geothermal power from Juperos ruins!',
 'Infinite clean energy drives speculative valuation surges for Yuno research institutes and floating estates.', 10),

('YUN_CRISIS_HEART_DESTABILIZATION', 'MUNICIPAL_CRISIS', 'Heart of Ymir Resonance Glitch', 'YUN', -65, 0,
 'Heart of Ymir antigravity resonance anomaly threatens floating city stability!',
 'Emergency containment expenditures and evacuation fears panic speculative venture investors.', 10),

('HUG_BOOM_GRAND_PRIX', 'MUNICIPAL_BOOM', 'Monster Racing Grand Prix', 'HUG', 75, 10,
 'Hugel Monster Racing Championship attracts record international betting volume!',
 'High spectator turnover and luxury airship tourism generate record entertainment dividend windfalls.', 10),

('HUG_CRISIS_RACE_RIGGING', 'MUNICIPAL_CRISIS', 'Grand Prix Syndicate Rigging', 'HUG', -50, -5,
 'Underworld racing syndicate exposed for drugging racing beasts in Hugel!',
 'Regulatory sanctions and public wagering boycott crush micro-cap entertainment revenues.', 10);

INSERT IGNORE INTO `solo_stock_events_def`
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `ticker_secondary`, `price_secondary_pct_change`, `headline`, `description`, `weight`) VALUES
('WAR_LHZ_OVER_EIN', 'TRADE_WAR', 'Automated Guardian Robotics', 'LHZ', 60, 'EIN', -45,
 'Rekenber AI guardian automation replaces traditional Einbroch human machinists!',
 'Heavy industries lose market capitalization to high-margin Schwarzwald robotics patents.', 8),

('WAR_EIN_OVER_LHZ', 'TRADE_WAR', 'Industrial Steel Boycott', 'EIN', 60, 'LHZ', -45,
 'Einbroch metallurgical union boycotts fragile Rekenber electronic components!',
 'Raw iron and heavy locomotive manufacturing surges while complex cybernetics demand slows.', 8),

('WAR_YUN_OVER_GEF', 'TRADE_WAR', 'Ancient Physics Supremacy', 'YUN', 70, 'GEF', -40,
 'Yuno Juperos quantum physics patents outshine Geffen medieval transmutation alchemy!',
 'Schwarzwald deep-tech draws research capital away from Rune-Midgarts magical academies.', 8),

('WAR_HUG_OVER_CMD', 'TRADE_WAR', 'Airship Cruise Hegemony', 'HUG', 65, 'CMD', -40,
 'Hugel scenic airship excursions lure high-net-worth vacationers away from Comodo beach clubs!',
 'Northern coastal recreation captures market share from southern tropical nightlife.', 8);

-- Category 6: Phase 2 Rune-Midgarts Domestic Expansion (8 Events + 2 Trade Wars)
INSERT IGNORE INTO `solo_stock_events_def` 
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `dividend_change`, `headline`, `description`, `weight`) VALUES
('ADB_BOOM_KAFRA_GLOBAL', 'MUNICIPAL_BOOM', 'Continental Kafra Expansion', 'ADB', 40, 15,
 'Kafra Global Corporation implements continent-wide storage tariff revision and dividend hike!',
 'Inelastic demand for teleportation and dimensional vault storage secures record blue-chip cash flows.', 10),

('ADB_CRISIS_CLOCK_MALFUNCTION', 'MUNICIPAL_CRISIS', 'Clock Tower Temporal Jam', 'ADB', -45, -10,
 'Aldebaran Clock Tower temporal chronometers jam, stalling dimensional transit portals!',
 'Service blackouts force Kafra Corp into emergency maintenance and user rebate payouts.', 10),

('CMD_BOOM_CASINO_JACKPOT', 'MUNICIPAL_BOOM', 'High-Roller Casino Windfall', 'CMD', 90, 20,
 'Foreign merchant syndicate forfeits legendary fortune at Comodo VIP roulette tables!',
 'Record casino gaming gross revenue triggers massive discretionary equity surges and special dividend.', 10),

('CMD_CRISIS_GAMBLING_RAID', 'MUNICIPAL_CRISIS', 'Royal Anti-Vice Crackdown', 'CMD', -60, -15,
 'Prontera Royal Guard raids illegal high-stakes gambling dens across Comodo!',
 'Temporary casino license suspensions and asset seizures depress entertainment sector earnings.', 10),

('IZL_BOOM_NAVAL_EXPEDITION', 'MUNICIPAL_BOOM', 'Sunken Byalan Treasury Salvage', 'IZL', 70, 8,
 'Izlude maritime fleet salvages ancient sunken pirate galleon off Byalan Island!',
 'Treasury bullion injection and expanded ferry routes boost defense and transport equities.', 10),

('IZL_CRISIS_KRAKEN_ATTACK', 'MUNICIPAL_CRISIS', 'Deep Sea Kraken Blockade', 'IZL', -50, -6,
 'Abyssal sea leviathan disrupts Izlude-Byalan passenger ferrying and maritime commerce!',
 'Naval defense mobilization costs and suspended maritime traffic drag down Izlude logistics.', 10),

('LUT_BOOM_CHRISTMAS_SURGE', 'MUNICIPAL_BOOM', 'Solstice Toy Assembly Boom', 'LUT', 80, 10,
 'Winter Solstice festival demand forces Lutie automated toy factories into 24/7 overdrive!',
 'Global holiday gift orders generate explosive seasonal manufacturing revenues and dividend bonuses.', 10),

('LUT_CRISIS_TOY_MALFUNCTION', 'MUNICIPAL_CRISIS', 'Rogue Clockwork Toy Rebellion', 'LUT', -55, -8,
 'Malicious mana surge causes assembly line toys to turn rogue inside the Toy Factory!',
 'Factory floor shutdowns and inventory recall expenses weigh heavily on Lutie equities.', 10);

INSERT IGNORE INTO `solo_stock_events_def`
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `ticker_secondary`, `price_secondary_pct_change`, `headline`, `description`, `weight`) VALUES
('WAR_ADB_OVER_IZL', 'TRADE_WAR', 'Instant Portal Dominance', 'ADB', 55, 'IZL', -35,
 'Kafra instant teleportation lines render Izlude slow ferry routes obsolete!',
 'Utility convenience captures commuter market share from maritime transport.', 8),

('WAR_CMD_OVER_HUG', 'TRADE_WAR', 'Tropical Carnival Euphoria', 'CMD', 65, 'HUG', -45,
 'Comodo beach festivals attract tourists away from cold Hugel monster race courses!',
 'Discretionary leisure capital rotates heavily toward southern tropical nightlife.', 8);

-- Category 7: Phase 3 Theocratic Sovereign & Commodities (8 Events + 1 Safe-Haven)
INSERT IGNORE INTO `solo_stock_events_def` 
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `dividend_change`, `headline`, `description`, `weight`) VALUES
('RAC_BOOM_GOLDEN_TITHE', 'MUNICIPAL_BOOM', 'Freya Temple Golden Tithes', 'RAC', 35, 12,
 'Record pilgrim pilgrimages expand Freya Temple physical sovereign gold vaults!',
 'Compulsory ecclesiastical tithes bolster sovereign trust balance sheet and dividend payout.', 10),

('RAC_CRISIS_SANCTUARY_HERESY', 'MUNICIPAL_CRISIS', 'Sanctuary Heretical Schism', 'RAC', -40, -8,
 'Doctrinal rebellion within Rachel Sanctuary triggers imperial inquiry and frozen accounts!',
 'Theocratic regulatory investigation dampens pilgrim confidence and slows sovereign revenue.', 10),

('VEI_BOOM_MAGMA_ORE', 'MUNICIPAL_BOOM', 'Thor Magma Iridium Discovery', 'VEI', 80, 15,
 'Geothermal miners tap ultra-dense volcanic iridium vein beneath Thor Volcano!',
 'High-temperature refractory alloys demand surges for continental defense fabrication.', 10),

('VEI_CRISIS_VOLCANIC_ERUPTION', 'MUNICIPAL_CRISIS', 'Thor Volcano Magma Surge', 'VEI', -60, -12,
 'Violent volcanic eruption engulfs southern Veins geothermal drilling rigs!',
 'Damaged energy infrastructure and hazardous gases halt mineral extraction operations.', 10),

('JAW_BOOM_ROYAL_WEDDING', 'MUNICIPAL_BOOM', 'Imperial Royal Wedding Gala', 'JAW', 60, 25,
 'Crown Prince of Prontera books exclusive month-long honeymoon buyout on Jawaii Island!',
 'Ultra-luxury hospitality monopoly reports record operating margin and cash distribution.', 10),

('JAW_CRISIS_TROPICAL_TYPHOON', 'MUNICIPAL_CRISIS', 'Category 5 Tropical Cyclone', 'JAW', -50, -15,
 'Severe typhoon ravages Jawaii coastal bungalows and private yachts!',
 'Property repair expenses and canceled honeymoon bookings suspend luxury cash distributions.', 10),

('UMB_BOOM_SHAMAN_RELIC', 'MUNICIPAL_BOOM', 'Ancient Utan Shamanic Relic', 'UMB', 95, 5,
 'Utan jungle foragers discover pristine prehistoric shamanic mask relic!',
 'Tribal antique auctions and bungee ecotourism spark speculative micro-cap mania.', 10),

('UMB_CRISIS_BUNGEE_COLLAPSE', 'MUNICIPAL_CRISIS', 'Bungee Platform Structural Failure', 'UMB', -50, -3,
 'Great tree bungee scaffolding fails, halting tribal adventure ecotourism!',
 'Safety investigations and suspended jungle timber barter slow Umbala commerce.', 10);

INSERT IGNORE INTO `solo_stock_events_def`
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `ticker_secondary`, `price_secondary_pct_change`, `headline`, `description`, `weight`) VALUES
('RAC_SAFE_HAVEN_RUSH', 'TRADE_WAR', 'Flight-to-Safety Gold Rush', 'RAC', 45, 'ALL', -10,
 'Continental market jitters spark massive safe-haven flight into Rachel physical gold reserves!',
 'Equities across Midgard suffer outflows while Rachel sovereign fund thrives on defensive buying.', 8);

-- Category 8: Phase 4 Global Cultural & Agrarian Markets (16 Events)
INSERT IGNORE INTO `solo_stock_events_def` 
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `dividend_change`, `headline`, `description`, `weight`) VALUES
('LOU_BOOM_GINSENG_ELIXIR', 'MUNICIPAL_BOOM', 'Dragon Ginseng Imperial Panacea', 'LOU', 50, 15,
 'Louyang apothecary guild produces miraculous imperial ginseng remedy!',
 'Highland pharmaceutical exports and inelastic healthcare demand boost defensive yields.', 10),

('LOU_CRISIS_HERB_BLIGHT', 'MUNICIPAL_CRISIS', 'Mountain Herb Root Blight', 'LOU', -45, -10,
 'Fungal root rot ravages Louyang terraced medicinal herb plantations!',
 'Pharmaceutical supply shortages and delayed herbal orders trim quarterly distributions.', 10),

('MOS_BOOM_SABLE_FUR', 'MUNICIPAL_BOOM', 'Imperial Sable Fur Rush', 'MOS', 60, 18,
 'Harsh continental winter drives unprecedented demand for Moscovia sable pelts and rare timber!',
 'Czarist resource trust posts record commodity exports and dividend bonuses.', 10),

('MOS_CRISIS_TAIGA_FOREST_FIRE', 'MUNICIPAL_CRISIS', 'Taiga Wilderness Wildfire', 'MOS', -50, -12,
 'Dry lightning sparks vast forest fire across Moscovia northern taiga timber concessions!',
 'Logging mill destruction and wildlife displacement constrain natural resource cash flows.', 10),

('AMA_BOOM_KATANA_COMMISSION', 'MUNICIPAL_BOOM', 'Imperial Katana Master Armada', 'AMA', 65, 10,
 'Foreign shogunate awards exclusive master-forged steel katana commission to Amatsu smiths!',
 'Artisanal blade exports and cultural heritage tourism bolster boutique craft earnings.', 10),

('AMA_CRISIS_SILK_DROUGHT', 'MUNICIPAL_CRISIS', 'Tatami Silk Moth Drought', 'AMA', -45, -8,
 'Extreme seasonal drought wipes out Amatsu mulberry orchards and silk moth cultivation!',
 'Luxury kimono exports and artisanal handicraft workshops suffer severe production delays.', 10),

('AYO_BOOM_RICE_HARVEST', 'MUNICIPAL_BOOM', 'Delta Bumper Rice Crop', 'AYO', 55, 16,
 'Ayothaya river delta records historic staple grain harvest and sacred craft exports!',
 'Agrarian river shipping fleets report peak export throughput and strong cash payouts.', 10),

('AYO_CRISIS_DELTA_FLOOD', 'MUNICIPAL_CRISIS', 'Catastrophic River Delta Monsoon', 'AYO', -45, -10,
 'Torrential floods submerge Ayothaya floating market storage barges and rice paddies!',
 'Commodity spoilage and port repair costs temporarily reduce agricultural distributions.', 10),

('GON_BOOM_IMMORTALITY_PEACH', 'MUNICIPAL_BOOM', 'Celestial Peach Blossom Harvest', 'GON', 80, 10,
 'Taoist hermits harvest rare immortality peaches on Gonryun floating celestial peaks!',
 'Mystical cultivation elixirs and floating air-rights leasing command premium prices.', 10),

('GON_CRISIS_TALISMAN_CRACKDOWN', 'MUNICIPAL_CRISIS', 'Imperial Talisman Ban', 'GON', -50, -8,
 'Continental regulators crack down on unregulated Taoist celestial flight talismans!',
 'Consumer suspicion and export embargoes deflate floating real estate valuations.', 10),

('BRA_BOOM_CARNIVAL_RECORD', 'MUNICIPAL_BOOM', 'Brasilis Grand Carnival Triumph', 'BRA', 75, 15,
 'Brasilis annual carnival attracts record international tourist spend and samba sponsorships!',
 'Hospitality revenues and Amazonian botanical bio-prospecting patents surge.', 10),

('BRA_CRISIS_JUNGLE_FEVER', 'MUNICIPAL_CRISIS', 'Rainforest Contagion Scare', 'BRA', -55, -10,
 'Tropical jungle contagion outbreak triggers temporary quarantine of Brasilis resort zones!',
 'Festival cancellations and travel advisories dampen event and hospitality equities.', 10),

('DEW_BOOM_KRAKATAU_GOLD', 'MUNICIPAL_BOOM', 'Krakatau Native Gold Strike', 'DEW', 85, 20,
 'Volcanic miners unearth massive native gold vein in Mount Krakatau foothills!',
 'High-grade gold shipments and rare clove spice harvests spark lucrative equity dividends.', 10),

('DEW_CRISIS_ASH_PLUME', 'MUNICIPAL_CRISIS', 'Volcanic Ash Cloud Quarantine', 'DEW', -50, -12,
 'Severe Krakatau ash eruptions force maritime shipping lane closures around Dewata!',
 'Export delays and ash cleanup costs dampen volcanic metal resource performance.', 10),

('MAL_BOOM_PORT_EXPANSION', 'MUNICIPAL_BOOM', 'Port Malaya Deep-Water Hub', 'MAL', 60, 14,
 'Port Malaya inaugurates new deep-water container terminal for foreign trade vessels!',
 'Archipelago transit duties and healthcare supply logistics generate steady dividend growth.', 10),

('MAL_CRISIS_HOSPITAL_SHORTAGE', 'MUNICIPAL_CRISIS', 'Regional Medical Supply Gridlock', 'MAL', -45, -10,
 'Regional logistics bottleneck paralyzes Port Malaya medical supply distribution!',
 'Emergency freight expenses and healthcare cargo delays weigh on port profitability.', 10);

-- Category 9: Phase 5 Outliers & Interdimensional Frontiers (4 Events)
INSERT IGNORE INTO `solo_stock_events_def` 
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `dividend_change`, `headline`, `description`, `weight`) VALUES
('NIF_BOOM_SOUL_DEBT', 'MUNICIPAL_BOOM', 'Underworld Soul Debt Syndication', 'NIF', 150, 0,
 'Underworld necromancers package distressed soul debts into astronomical speculative yields!',
 'Asymmetric junk equity rally attracts fearless late-game speculative zeny whales.', 10),

('NIF_CRISIS_HELGATE_COLLAPSE', 'MUNICIPAL_CRISIS', 'Helgate Dimensional Collapse', 'NIF', -80, 0,
 'Lord of Death shatters underworld transit bridges, vaporizing distressed asset values!',
 'Catastrophic occult crisis triggers total liquidity freeze and massive capital loss in NIF.', 10),

('DIC_BOOM_BRADIUM_RUSH', 'MUNICIPAL_BOOM', 'Pure Refined Bradium Lode', 'DIC', 120, 5,
 'Sapha extraplanar mining crews strike purest concentrated Bradium energy crystal lode!',
 'Extraplanar industrial demand skyrockets for next-generation dimensional apparatuses.', 10),

('DIC_CRISIS_YGGDRASIL_SHOCK', 'MUNICIPAL_CRISIS', 'Yggdrasil Dimensional Shockwave', 'DIC', -70, 0,
 'Interdimensional energy shockwave fractures El Dicastes Bradium refining pylons!',
 'Severe refinery shutdowns across Ash Vacuum frontier crush speculative venture capital.', 10);

-- ======================================================================
-- Category 10: Municipal Special Catalysts & Lore Expansion (27 Additional Events - 3+ per city)
-- ======================================================================
INSERT IGNORE INTO `solo_stock_events_def` 
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `dividend_change`, `headline`, `description`, `weight`) VALUES
('PRT_EVENT_CULVERT_SANITATION', 'MUNICIPAL_BOOM', 'Culvert Sewer Bounty Cleared', 'PRT', 45, 5,
 'Royal Knight bounty successfully cleanses the Prontera Culvert sewer system!',
 'Eradication of the Golden Thief Bug infestation restores subterranean infrastructure and municipal revenue.', 10),

('GEF_EVENT_GEFFENIA_GATE', 'MUNICIPAL_BOOM', 'Geffenia Gate Alignment', 'GEF', 60, 8,
 'Ancient Geffenia gateway harmonics resonate beneath the Geffen Magic Tower!',
 'Sunken portal stabilization unlocks rare elemental crystal trade routes and magical research dividends.', 10),

('MOR_EVENT_PYRAMID_TREASURE', 'MUNICIPAL_BOOM', 'Pharaoh Bullion Vault Unearthed', 'MOR', 70, 12,
 'Archaeological guild discovers untouched Pharaoh treasure vaults beneath the Pyramids!',
 'Massive gold ingot discoveries and ancient jewel salvage flood the Morroc commercial bazaars.', 10),

('PAY_EVENT_ANCESTRAL_BLESSING', 'MUNICIPAL_BOOM', 'Moonlight Spirit Festival', 'PAY', 45, 12,
 'Moonlight spirit festival brings unprecedented pilgrim craft commissions to Payon!',
 'Ancestral forest blessing surges demand for artisan composite bows and sacred Ironwood totems.', 10),

('ALB_EVENT_OVERSEAS_TREATY', 'MUNICIPAL_BOOM', 'Global Free Trade Charter', 'ALB', 50, 18,
 'Alberta Merchant Guild ratifies trans-oceanic Free Trade Charter with Amatsu and Louyang!',
 'Expanded deep-water harbor logistics throughput yields record maritime cash distributions.', 10),

('LHZ_EVENT_CYBERNETIC_IMPLANTS', 'MUNICIPAL_BOOM', 'Commercial Cybernetics Rollout', 'LHZ', 95, 0,
 'Rekenber Corporation releases next-generation commercial guardian cybernetics!',
 'Exclusive continental security contracts and neural implant patents spark explosive equity growth.', 10),

('EIN_EVENT_EINBECH_MINERAL_VEIN', 'MUNICIPAL_BOOM', 'Deep Einbech Anthracite Lode', 'EIN', 60, 8,
 'Einbech mining crews uncover massive vein of ultra-pure anthracite coal!',
 'Abundant high-temperature metallurgical fuel powers central blast furnaces and heavy locomotives.', 10),

('YUN_EVENT_SAGE_ACADEMY_PATENT', 'MUNICIPAL_BOOM', 'Schweizerschabel Quantum Thesis', 'YUN', 75, 0,
 'Schweizerschabel Sage Academy publishes groundbreaking quantum mana thesis!',
 'Theoretical physics breakthroughs attract massive venture capital and air-rights leasing.', 10),

('HUG_EVENT_ODIN_TEMPLE_CHARTER', 'MUNICIPAL_BOOM', 'Odin Temple Archaeological Fleet', 'HUG', 60, 8,
 'Archaeological syndicate commissions luxury airship fleet for Odin Temple exploration!',
 'Charter flights and maritime ferry traffic drive record passenger revenues for Hugel transport.', 10),

('ADB_EVENT_STORAGE_TARIFF_HIKE', 'MUNICIPAL_BOOM', 'Dimensional Vault Dividend Surge', 'ADB', 35, 20,
 'Kafra Corporation reports record continent-wide dimensional storage utilization!',
 'Surging storage rental revenues trigger a special cash dividend distribution to shareholders.', 10),

('CMD_EVENT_SUMMER_CARNIVAL', 'MUNICIPAL_BOOM', 'Bioluminescent Beach Gala', 'CMD', 70, 15,
 'Comodo bioluminescent tropical beach festival sets all-time tourism records!',
 'Unprecedented casino floor turnover and resort villa bookings boost discretionary cash flows.', 10),

('IZL_EVENT_WARRIOR_CHAMPIONSHIP', 'MUNICIPAL_BOOM', 'Swordsman Arena Championship', 'IZL', 55, 10,
 'Criatura Warrior Academy hosts Continental Swordsman Championship in Izlude!',
 'Massive arena gate admissions and Byalan ferry transit fees lift maritime defense revenues.', 10),

('LUT_EVENT_SANTA_SPECIAL_DELIVERY', 'MUNICIPAL_BOOM', 'Global Solstice Gift Distribution', 'LUT', 65, 14,
 'Santa Claus automated workshop achieves 100% on-time delivery across Midgard!',
 'Global holiday gift turnover generates record seasonal manufacturing earnings and bonuses.', 10),

('RAC_EVENT_POPE_CORONATION', 'MUNICIPAL_BOOM', 'High Priestess Jubilation Dividend', 'RAC', 40, 18,
 'Freya Temple declares jubilee celebration following the High Priestess coronation!',
 'Sacred treasury releases a special sovereign gold dividend distribution to faithful investors.', 10),

('VEI_EVENT_GEOTHERMAL_GRID', 'MUNICIPAL_BOOM', 'Canyon Geothermal Power Grid', 'VEI', 65, 10,
 'Veins engineers successfully link Thor Volcano geothermal grid to southern industrial hubs!',
 'Clean energy exports and volcanic alloy refining generate steady utility revenues.', 10),

('JAW_EVENT_NOBILITY_RESORT_EXPANSION', 'MUNICIPAL_BOOM', 'Private Beachfront Villa Auction', 'JAW', 75, 20,
 'Prominent Midgard nobles purchase lifetime beachfront villa leases in Jawaii!',
 'Ultra-exclusive hospitality monopoly commands astronomical buyout fees and cash reserves.', 10),

('UMB_EVENT_YGGDRASIL_ROOT_HARVEST', 'MUNICIPAL_BOOM', 'Canopy Yggdrasil Sap Barter', 'UMB', 80, 6,
 'Utan tribal foragers harvest miraculous Yggdrasil sap energy from upper canopy roots!',
 'High-potency life essence barter and shamanic relic auctions drive speculative micro-cap demand.', 10),

('LOU_EVENT_ACUPUNCTURE_REPUTATION', 'MUNICIPAL_BOOM', 'Imperial Acupuncture Accreditation', 'LOU', 60, 12,
 'Bai Long apothecary clinic receives exclusive royal healthcare accreditation!',
 'Terraced ginseng remedies and traditional acupuncture panaceas capture continental healthcare markets.', 10),

('MOS_EVENT_GOPINICH_GEM_VAULT', 'MUNICIPAL_BOOM', 'Subterranean Malachite Discovery', 'MOS', 75, 15,
 'Taiga forest prospectors unearth subterranean cavern brimming with rare emeralds and malachite!',
 'Czarist resource trust expands gemstone mining concessions and increases quarterly yields.', 10),

('AMA_EVENT_CHERRY_BLOSSOM_FEST', 'MUNICIPAL_BOOM', 'Lake Palace Hanami Gala', 'AMA', 55, 14,
 'Amatsu cherry blossom season draws foreign dignitaries and master craft collectors!',
 'Handcrafted tatami silks and forged katana blades command peak festival prices.', 10),

('AYO_EVENT_SPIRIT_SHRINE_BLESSING', 'MUNICIPAL_BOOM', 'River Delta Golden Jubilee', 'AYO', 65, 15,
 'Sacred spirit shrine festival blesses Ayothaya river delta with record bumper harvests!',
 'Floating market trade volume and protective spirit amulet exports reach historic highs.', 10),

('GON_EVENT_TAOIST_AIR_RIGHTS', 'MUNICIPAL_BOOM', 'Cloud Pavilion Real Estate Boom', 'GON', 70, 12,
 'Taoist cultivation masters lease high-altitude floating cloud pavilions in Gonryun!',
 'Celestial real estate air-rights and immortality peach elixirs generate steady luxury income.', 10),

('BRA_EVENT_AMAZON_WATER_LILY', 'MUNICIPAL_BOOM', 'Amazonian Bio-Prospecting Patent', 'BRA', 70, 12,
 'Brasilis researchers isolate regenerative botanical enzymes from giant rainforest water lilies!',
 'Pharmaceutical patent licensing contracts and carnival hospitality drive strong cash growth.', 10),

('DEW_EVENT_CLOVE_NUTMEG_MONOPOLY', 'MUNICIPAL_BOOM', 'Archipelago Spice Fleet Departure', 'DEW', 65, 18,
 'Continental spice shortages send Dewata clove and nutmeg export prices to record highs!',
 'Volcanic island spice trading fleets deliver windfall agricultural dividends.', 10),

('MAL_EVENT_ARCHIPELAGO_FERRY_LINE', 'MUNICIPAL_BOOM', 'Trans-Island Fast Ferry Modernization', 'MAL', 55, 16,
 'Port Malaya inaugurates modern fast-ferry passenger and cargo routes across the archipelago!',
 'Streamlined maritime logistics and hospital supply transit boost municipal revenue.', 10),

('NIF_EVENT_VALKYRIE_SOUL_HARVEST', 'MUNICIPAL_BOOM', 'Restless Spirit Relic Speculation', 'NIF', 120, 0,
 'Occult relic collectors flood Nifflheim seeking cursed soul artifacts and dark catalysts!',
 'Unregulated underworld speculative assets experience an explosive asymmetric bull run.', 10),

('DIC_EVENT_SAPHA_LAPHINE_TREATY', 'MUNICIPAL_BOOM', 'Extraplanar Energy Accord', 'DIC', 90, 10,
 'Sapha and Laphine factions sign historic joint Bradium and Yggdrasil energy accord!',
 'Harmonized dimensional mining operations unlock massive extraplanar export revenues.', 10);

-- ======================================================================
-- Category 11: Municipal Crisis Expansion (27 Additional Crises - 2 Minuses per city)
-- ======================================================================
INSERT IGNORE INTO `solo_stock_events_def` 
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `dividend_change`, `headline`, `description`, `weight`) VALUES
('PRT_CRISIS_CRUSADER_DEFICIT', 'MUNICIPAL_CRISIS', 'Royal Crusader Budget Deficit', 'PRT', -45, -5,
 'Extended royal army crusader border expedition costs create capital municipal budget deficits!',
 'Frontier garrison upkeep and supply purchases force temporary reductions in imperial dividend yields.', 10),

('GEF_CRISIS_SYNTHETIC_GEM_GLUT', 'MUNICIPAL_CRISIS', 'Synthetic Gemstone Surplus', 'GEF', -40, -8,
 'Market oversupply of synthesized blue gemstones deflates wizardry component revenues!',
 'Unchecked alchemical fabrication leads to wholesale price collapse across magical ingredient exchanges.', 10),

('MOR_CRISIS_SANDSTORM_BLOCKADE', 'MUNICIPAL_CRISIS', 'Great Sograt Sandstorm', 'MOR', -50, -10,
 'Blinding desert sandstorms bury southern Sograt caravan corridors!',
 'Delayed spice and silk shipments disrupt trading operations and damage overland logistics.', 10),

('PAY_CRISIS_TIMBER_BORER_INFESTATION', 'MUNICIPAL_CRISIS', 'Forest Wood-Borer Infestation', 'PAY', -45, -6,
 'Invasive wood-borer beetles damage Payon cedar and ironwood timber stands!',
 'Pest quarantine and lost lumber reserves delay scheduled artisan bowcraft shipments.', 10),

('ALB_CRISIS_CUSTOMS_TARIFF_DISPUTE', 'MUNICIPAL_CRISIS', 'Foreign Customs Tariff Embargo', 'ALB', -45, -8,
 'Maritime customs tariff dispute with foreign ports leads to impounded cargo galleons!',
 'Diplomatic impasses and frozen shipping lanes temporarily reduce port throughput revenues.', 10),

('LHZ_CRISIS_SLUM_DISTRICT_RIOTS', 'MUNICIPAL_CRISIS', 'Slum District Labor Uprising', 'LHZ', -55, 0,
 'Labor strikes and rioting in the Lighthalzen slum district breach corporate security perimeters!',
 'Emergency security mobilization and disrupted workforce shifts weigh heavily on Rekenber equities.', 10),

('EIN_CRISIS_SMOG_INVERSION', 'MUNICIPAL_CRISIS', 'Toxic Smog Inversion', 'EIN', -50, -4,
 'Severe atmospheric smog inversion forces emergency shutdown of central Einbroch blast furnaces!',
 'Heavy industrial downtime and environmental containment fines depress quarterly manufacturing returns.', 10),

('YUN_CRISIS_AIR_RIGHTS_INJUNCTION', 'MUNICIPAL_CRISIS', 'High-Altitude Air-Rights Injunction', 'YUN', -45, 0,
 'Schwarzwald High Court injunction halts high-altitude residential estate construction above Mt. Mjolnir!',
 'Zoning disputes and frozen building contracts cool speculative cloud real estate development.', 10),

('HUG_CRISIS_ARCTIC_FOG_GROUNDING', 'MUNICIPAL_CRISIS', 'Arctic Coastal Fog Grounding', 'HUG', -40, -5,
 'Dense arctic coastal fog grounds passenger airships and forces cancellation of monster race heats!',
 'Tourism booking cancellations and dormant betting windows trim seasonal entertainment revenue.', 10),

('ADB_CRISIS_CANAL_LOCK_FLOODING', 'MUNICIPAL_CRISIS', 'Al De Baran Canal Lock Flooding', 'ADB', -40, -8,
 'Canal lock mechanical failure floods residential basements across southern Aldebaran!',
 'Municipal cleanup expenses and temporary utility maintenance rebates depress cash flows.', 10),

('CMD_CRISIS_CREDIT_SYNDICATE_DEFAULT', 'MUNICIPAL_CRISIS', 'High-Roller Credit Syndicate Default', 'CMD', -50, -12,
 'Foreign merchant syndicate defaults on massive VIP casino credit lines in Comodo!',
 'Bad debt write-offs and tighter lending restrictions temper discretionary entertainment distributions.', 10),

('IZL_CRISIS_FERRY_COLLISION', 'MUNICIPAL_CRISIS', 'Byalan Ferry Harbor Collision', 'IZL', -45, -6,
 'Severe storm surges cause two merchant passenger ferries to collide in Izlude harbor!',
 'Dock pier reconstruction costs and suspended maritime transit schedules reduce transport earnings.', 10),

('LUT_CRISIS_POST_HOLIDAY_INVENTORY', 'MUNICIPAL_CRISIS', 'Post-Holiday Inventory Write-Down', 'LUT', -45, -6,
 'Post-Winter Solstice demand slump forces seasonal assembly line idling in the Toy Factory!',
 'Excess inventory discounting and warehouse carrying costs dampen manufacturing returns.', 10),

('RAC_CRISIS_PILGRIMAGE_TRAVEL_BAN', 'MUNICIPAL_CRISIS', 'Border Pilgrimage Travel Ban', 'RAC', -40, -8,
 'Strict Arunafeltz border quarantine restricts visiting foreign pilgrim access to the Freya Temple!',
 'Reduced temple donations and curtailed religious relic sales slow sovereign fund growth.', 10),

('VEI_CRISIS_MAGMA_AVALANCHE', 'MUNICIPAL_CRISIS', 'Thor Canyon Magma Avalanche', 'VEI', -50, -10,
 'Lava overflow damages vital transport conduits between Veins mining depots and Thor Volcano!',
 'Transport gridlock and equipment replacement costs depress volcanic mineral distribution.', 10),

('JAW_CRISIS_RESORT_FUMIGATION', 'MUNICIPAL_CRISIS', 'Luxury Bungalow Termite Fumigation', 'JAW', -45, -12,
 'Mandatory island-wide pest control temporarily shutters luxury oceanfront villas in Jawaii!',
 'Refunded honeymoon bookings and maintenance costs reduce quarterly hospitality margins.', 10),

('UMB_CRISIS_CANOPY_LOCUST_SWARM', 'MUNICIPAL_CRISIS', 'Canopy Locust Swarm', 'UMB', -45, -4,
 'Massive locust swarms strip jungle fruit crops and damage traditional rope suspension bridges!',
 'Agricultural losses and bridge repair downtime slow Umbala ecotourism and barter trade.', 10),

('LOU_CRISIS_COUNTERFEIT_GINSENG', 'MUNICIPAL_CRISIS', 'Counterfeit Ginseng Scandal', 'LOU', -40, -8,
 'Unlicensed rogue merchants peddle fraudulent ginseng panaceas, tarnishing Louyang apothecary prestige!',
 'Regulatory crackdowns and consumer caution temporarily slow traditional pharmaceutical exports.', 10),

('MOS_CRISIS_MUD_SEASON_GRIDLOCK', 'MUNICIPAL_CRISIS', 'Mud Season Logging Gridlock', 'MOS', -40, -10,
 'Premature spring thaw turns boreal logging trails into impassable mud swamps in Moscovia!',
 'Delayed timber deliveries and idle lumber mills constrain quarterly natural resource revenues.', 10),

('AMA_CRISIS_FORGE_COAL_DEFICIT', 'MUNICIPAL_CRISIS', 'Master Smith Charcoal Deficit', 'AMA', -40, -6,
 'High-grade smelting charcoal shortages temporarily delay master-forged katana fabrication!',
 'Artisanal workshop bottlenecks in Amatsu slow export fulfillment to foreign samurai clans.', 10),

('AYO_CRISIS_GRAIN_PEST_INCURSION', 'MUNICIPAL_CRISIS', 'Delta Silo Grain Pest Incursion', 'AYO', -40, -8,
 'Grain weevils infiltrate floating storage barges along the Ayothaya river delta!',
 'Emergency commodity fumigation and spoiled rice inventories temporarily dampen agrarian profits.', 10),

('GON_CRISIS_CELESTIAL_FROST_BLIGHT', 'MUNICIPAL_CRISIS', 'High-Altitude Celestial Frost', 'GON', -45, -8,
 'Unseasonable high-altitude frost damages immortality peach blossoms across Gonryun peaks!',
 'Reduced harvest yields of cultivation elixirs temporarily compress luxury consumable earnings.', 10),

('BRA_CRISIS_BLEACHER_STRUCTURAL_DAMAGE', 'MUNICIPAL_CRISIS', 'Carnival Arena Structural Damage', 'BRA', -45, -8,
 'Grandstand bleacher damage at the Brasilis parade arena forces emergency venue repairs!',
 'Ticket refunds and construction outlays dampen quarterly festival entertainment returns.', 10),

('DEW_CRISIS_SPICE_WORM_BLIGHT', 'MUNICIPAL_CRISIS', 'Volcanic Clove Plantation Blight', 'DEW', -45, -10,
 'Invasive spice worms damage high-value clove and nutmeg plantations across Dewata!',
 'Decreased crop yields and pest eradication costs weigh on volcanic spice export profits.', 10),

('MAL_CRISIS_BERTH_CRANE_BREAKDOWN', 'MUNICIPAL_CRISIS', 'Deep-Water Crane Breakdown', 'MAL', -40, -8,
 'Heavy container crane breakdown at Port Malaya berth 4 delays international cargo offloading!',
 'Demurrage charges and freight bottlenecks temporarily reduce port operating income.', 10),

('NIF_CRISIS_SOUL_EMBARGO', 'MUNICIPAL_CRISIS', 'Lord of Death Soul Embargo', 'NIF', -70, 0,
 'Lord of Death seizes wandering spirits, freezing secondary occult debt and relic markets!',
 'Underworld liquidity freeze creates severe distress across speculative necromantic assets.', 10),

('DIC_CRISIS_BRADIUM_PYLON_FRACTURE', 'MUNICIPAL_CRISIS', 'Central Bradium Pylon Fracture', 'DIC', -60, 0,
 'Refined energy crystal instability fractures central Bradium power pylons in El Dicastes!',
 'Emergency refinery shutdowns across the Ash Vacuum frontier stall mineral processing.', 10);

-- ======================================================================
-- Category 12: Municipal Neutral & Structural Events (27 Events - Neutral 1 per city)
-- ======================================================================
INSERT IGNORE INTO `solo_stock_events_def` 
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `dividend_change`, `duration_shifts`, `headline`, `description`, `weight`) VALUES
('PRT_NEUTRAL_TAX_AUDIT', 'MUNICIPAL_BOOM', 'Imperial Royal Tax Audit', 'PRT', 0, 0, 24,
 'Crown revenue auditors review capital merchant tax compliance, stabilizing trade volume.',
 'Comprehensive financial compliance checks across Prontera ensure long-term balance sheet transparency.', 10),

('GEF_NEUTRAL_WIZARDRY_CONCLAVE', 'MUNICIPAL_BOOM', 'Geffen Tower Wizardry Conclave', 'GEF', 0, 0, 48,
 'Biennial wizardry symposium pauses mass fabrication while academic research standards realign.',
 'Magical scholars from across Midgard gather in Geffen to debate elemental transmutations.', 10),

('MOR_NEUTRAL_BLACK_MARKET_ACCORD', 'MUNICIPAL_BOOM', 'Thief & Rogue Barter Accord', 'MOR', 0, 0, 24,
 'Merchant syndicates establish standardized black-market commission rates across Morroc.',
 'Coordinated trade protocols stabilize oasis exchange prices and curb counterfeit relic fraud.', 10),

('PAY_NEUTRAL_FOREST_STEWARDSHIP', 'MUNICIPAL_BOOM', 'Sacred Forest Stewardship Pact', 'PAY', 0, 0, 48,
 'Payon village elders cap quarterly logging quotas to replenish sacred Ironwood groves.',
 'Sustainable forestry practices ensure reliable long-term timber reserves with stable valuations.', 10),

('ALB_NEUTRAL_DRYDOCK_RETROFIT', 'MUNICIPAL_BOOM', 'Merchant Galleon Drydock Retrofit', 'ALB', 0, 0, 36,
 'Alberta merchant shipping fleets undergo scheduled drydock maintenance and hull retrofits.',
 'Scheduled fleet upkeep maintains maritime safety standards while preserving operating margins.', 10),

('LHZ_NEUTRAL_BOARD_REORGANIZATION', 'MUNICIPAL_BOOM', 'Rekenber Executive Board Realignment', 'LHZ', 0, 0, 24,
 'Corporate board reshuffles executive directorships across biotech and guardian robotics divisions.',
 'Strategic management restructuring in Lighthalzen balances Somatology R&D with commercial production.', 10),

('EIN_NEUTRAL_RAILWAY_STANDARDIZATION', 'MUNICIPAL_BOOM', 'Schwarzwald Railway Gauge Standard', 'EIN', 0, 0, 48,
 'Einbroch engineers harmonize railway gauge standards with connecting regional freight routes.',
 'System-wide infrastructure upgrades improve long-term transport reliability across the Republic.', 10),

('YUN_NEUTRAL_RESEARCH_SYMPOSIUM', 'MUNICIPAL_BOOM', 'Schweizerschabel Research Symposium', 'YUN', 0, 0, 36,
 'Sages assemble in Yuno to peer-review ancient Juperos archaeological excavations.',
 'Academic peer review verifies antigravity physics findings, maintaining steady venture interest.', 10),

('HUG_NEUTRAL_RACING_RULEBOOK_OVERHAUL', 'MUNICIPAL_BOOM', 'Monster Racing Regulatory Overhaul', 'HUG', 0, 0, 24,
 'Hugel racing officials update monster weight classes and betting regulations for integrity.',
 'Enhanced regulatory oversight stabilizes spectator confidence and gaming turnover.', 10),

('ADB_NEUTRAL_UTILITY_TARIFF_REVIEW', 'MUNICIPAL_BOOM', 'Global Kafra Utility Tariff Review', 'ADB', 0, 0, 48,
 'Kafra Corporation standardizes inter-city warp portal terms across all continental service branches.',
 'Unified tariff schedules maintain steady utility cash flows with zero market disruption.', 10),

('CMD_NEUTRAL_GAMING_AUDIT', 'MUNICIPAL_BOOM', 'Entertainment Syndicate Casino Audit', 'CMD', 0, 0, 24,
 'Royal inspectors review casino operating licenses and roulette tables across Comodo.',
 'Gaming floor compliance audits ensure transparent odds and stable tourism resort patronage.', 10),

('IZL_NEUTRAL_ACADEMY_STANDARDS', 'MUNICIPAL_BOOM', 'Criatura Academy Training Standards', 'IZL', 0, 0, 36,
 'Swordsman Guild revises cadet training requirements and tournament formats in Izlude.',
 'Updated martial curriculum ensures consistent defense readiness and arena ticket sales.', 10),

('LUT_NEUTRAL_TOY_SAFETY_AUDIT', 'MUNICIPAL_BOOM', 'Clockwork Toy Quality Audit', 'LUT', 0, 0, 36,
 'Toy Factory engineers audit mechanical toy gears to ensure consumer safety compliance.',
 'Rigorous quality assurance protects Lutie brand equity ahead of global holiday seasons.', 10),

('RAC_NEUTRAL_SOVEREIGN_GOLD_ASSAY', 'MUNICIPAL_BOOM', 'Freya Temple Sovereign Gold Assay', 'RAC', 0, 0, 48,
 'Ecclesiastical auditors verify the purity and weight of Freya Temple physical gold vaults.',
 'Transparent vault assay reports reinforce Rachel sovereign fund credibility and investor confidence.', 10),

('VEI_NEUTRAL_METALLURGY_CERTIFICATION', 'MUNICIPAL_BOOM', 'Geothermal Metallurgy Certification', 'VEI', 0, 0, 36,
 'Mining engineers in Veins standardize obsidian and sulfur purity classifications.',
 'Refining grade certifications ensure consistent commercial contracts with northern foundries.', 10),

('JAW_NEUTRAL_VIP_RESERVATION_TIERS', 'MUNICIPAL_BOOM', 'Jawaii Aristocratic Reservation Tiers', 'JAW', 0, 0, 36,
 'Island resort operators introduce tiered luxury memberships for Midgard nobility.',
 'Structured reservation policies stabilize booking occupancy across private beachfront villas.', 10),

('UMB_NEUTRAL_SHAMANIC_BARTER_FAIR', 'MUNICIPAL_BOOM', 'Utan Tribal Mask Barter Fair', 'UMB', 0, 0, 24,
 'Utan chieftains establish fixed barter conversion rates between monster meat and gemstones.',
 'Harmonized trade ratios facilitate smooth primitive commodity exchange in Umbala.', 10),

('LOU_NEUTRAL_PHARMACOPOEIA_REVISION', 'MUNICIPAL_BOOM', 'Bai Long Imperial Pharmacopoeia', 'LOU', 0, 0, 36,
 'Louyang herbalists catalog and standardize 500 traditional highland medicinal formulas.',
 'Codified pharmaceutical guidelines maintain steady export demand for authentic dragon remedies.', 10),

('MOS_NEUTRAL_TAIGA_CONSERVATION', 'MUNICIPAL_BOOM', 'Taiga Timber Conservation Accord', 'MOS', 0, 0, 48,
 'Czarist forest wardens establish sustainable logging conservation zones across Moscovia.',
 'Boreal forest management guarantees multi-generational timber harvests with steady valuations.', 10),

('AMA_NEUTRAL_TEA_GUILD_ACCORD', 'MUNICIPAL_BOOM', 'Imperial Tea Master Guild Code', 'AMA', 0, 0, 36,
 'Amatsu green tea growers and silk weavers standardize ceremonial presentation codes.',
 'Unified artisan standards preserve cultural heritage prestige and boutique export pricing.', 10),

('AYO_NEUTRAL_DELTA_DREDGING_PACT', 'MUNICIPAL_BOOM', 'Ayothaya Delta Silt Dredging Treaty', 'AYO', 0, 0, 48,
 'Dredging barges clear river delta waterways, stabilizing Ayothaya cargo shipping routes.',
 'Maintained river navigation channels prevent seasonal logistics bottlenecks and protect trade.', 10),

('GON_NEUTRAL_AIR_RIGHTS_CODEX', 'MUNICIPAL_BOOM', 'Gonryun Celestial Real Estate Register', 'GON', 0, 0, 36,
 'Taoist hermits formalize cloud-walking pavilion ownership rules and air-rights leasing terms.',
 'Clear aerial land tenure registers stabilize floating estate values in Gonryun.', 10),

('BRA_NEUTRAL_BIODIVERSITY_TREATY', 'MUNICIPAL_BOOM', 'Amazonian Biodiversity Treaty', 'BRA', 0, 0, 48,
 'Brasilis researchers and tourism boards establish protected rainforest bio-prospecting zones.',
 'Balanced conservation agreements safeguard botanical patent research alongside festival tourism.', 10),

('DEW_NEUTRAL_TRIBAL_MINING_COMPACT', 'MUNICIPAL_BOOM', 'Krakatau Indigenous Mining Compact', 'DEW', 0, 0, 36,
 'Dewata tribal elders and mining consortiums establish shared volcanic gold revenue quotas.',
 'Equitable resource sharing agreements ensure stable mining operations and community support.', 10),

('MAL_NEUTRAL_NAVIGATION_SAFETY_AUDIT', 'MUNICIPAL_BOOM', 'Archipelago Maritime Safety Standards', 'MAL', 0, 0, 36,
 'Port Malaya authorities inspect inter-island cargo vessels for updated maritime safety compliance.',
 'Enhanced safety inspections protect regional logistics efficiency with minimal delay.', 10),

('NIF_NEUTRAL_WITCHCRAFT_BARTER_CODE', 'MUNICIPAL_BOOM', 'Underworld Witchcraft Barter Standard', 'NIF', 0, 0, 48,
 'Restless spirits establish fixed exchange ratios between cursed rubies and soul debts in Nifflheim.',
 'Standardized occult barter codes stabilize secondary distressed asset transactions.', 10),

('DIC_NEUTRAL_DIMENSIONAL_PROTOCOL', 'MUNICIPAL_BOOM', 'Midgard-Ash Vacuum Trade Protocol', 'DIC', 0, 0, 48,
 'Allied researchers formalize dimensional mineral transfer protocols across the Bifrost gorge.',
 'Harmonized customs checks streamline concentrated Bradium shipments to Midgard research labs.', 10);

-- ======================================================================
-- Category 13: Municipal Volatility & Mood Shifts (27 Events - Neutral 2 per city)
-- ======================================================================
INSERT IGNORE INTO `solo_stock_events_def` 
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `dividend_change`, `mood_override`, `duration_shifts`, `headline`, `description`, `weight`) VALUES
('PRT_NEUTRAL_CHIVALRY_TOURNAMENT', 'MUNICIPAL_BOOM', 'Prontera Chivalry Exhibition', 'PRT', 0, 0, 3, 24,
 'Royal Knight exhibition provokes heightened intraday volatility across capital equities!',
 'Competitive martial tourneys spark intense speculative wagering and hourly trading swings.', 10),

('GEF_NEUTRAL_MANA_RESONANCE', 'MUNICIPAL_BOOM', 'Geffenia Subterranean Mana Pulse', 'GEF', 0, 0, 3, 36,
 'Subterranean mana pulses trigger volatile hourly swings in arcanetech equipment demand!',
 'Unpredictable magical field fluctuations below the Magic Tower amplify intraday volatility.', 10),

('MOR_NEUTRAL_DESERT_MIRAGE_FEVER', 'MUNICIPAL_BOOM', 'Sograt Desert Mirage Frenzy', 'MOR', 0, 0, 3, 24,
 'Rumors of shifting oasis ruins provoke erratic speculative trades in Morroc bazaars!',
 'Desert mirage sightings trigger rapid rotations between relic salvagers and spice traders.', 10),

('PAY_NEUTRAL_CAVE_SURVEY', 'MUNICIPAL_BOOM', 'Payon Cave Archaeological Survey', 'PAY', 0, 0, 3, 24,
 'Exploration of lower Payon cave depths sparks fluctuating antique valuations!',
 'Ancestral catacomb surveys provoke lively debate and volatile spot trades in Payon crafts.', 10),

('ALB_NEUTRAL_TIDAL_VORTEX', 'MUNICIPAL_BOOM', 'Seasonal Tidal Vortex Drift', 'ALB', 0, 0, 3, 24,
 'Seasonal tidal vortex shifts create erratic voyage arrival times and spot shipping rates!',
 'Ocean current turbulence induces short-term fluctuations in maritime logistics valuations.', 10),

('LHZ_NEUTRAL_BIO_ETHICS_INQUEST', 'MUNICIPAL_BOOM', 'Schwarzwald Bio-Ethics Inquest', 'LHZ', 0, 0, 3, 48,
 'Government tribunal investigates bio-lab ethics, causing intense hourly swings in Lighthalzen!',
 'Regulatory scrutiny and public debate provoke sharp intraday volatility in Rekenber equities.', 10),

('EIN_NEUTRAL_UNION_NEGOTIATIONS', 'MUNICIPAL_BOOM', 'Foundry Collective Bargaining', 'EIN', 0, 0, 3, 24,
 'Whitesmith labor collective negotiations create heightened hourly equity swings in Einbroch!',
 'Ongoing wage discussions spark active intraday trading among heavy manufacturing investors.', 10),

('YUN_NEUTRAL_STRATOSPHERIC_TURBULENCE', 'MUNICIPAL_BOOM', 'Mt. Mjolnir Stratospheric Turbulence', 'YUN', 0, 0, 3, 24,
 'Upper-atmospheric wind shears cause erratic airship transport valuations above Yuno!',
 'Turbulent flight conditions create lively hourly price swings in speculative cloud venture shares.', 10),

('HUG_NEUTRAL_THANATOS_ALIGNMENT', 'MUNICIPAL_BOOM', 'Thanatos Tower Astrological Alignment', 'HUG', 0, 0, 3, 36,
 'Astrological rumors surrounding Thanatos Tower provoke speculative betting waves in Hugel!',
 'Mystical alignments draw adventurous capital, amplifying intraday price movements.', 10),

('ADB_NEUTRAL_TEMPORAL_SYNCHRONY', 'MUNICIPAL_BOOM', 'Clock Tower Gear Recalibration', 'ADB', 0, 0, 3, 24,
 'Clock Tower temporal recalibration creates brief utility volume volatility in Aldebaran!',
 'Hourly gear adjustments induce temporary fluctuations in warp portal usage data.', 10),

('CMD_NEUTRAL_LUMINESCENT_SPORE_BLOOM', 'MUNICIPAL_BOOM', 'Bioluminescent Spore Surge', 'CMD', 0, 0, 3, 24,
 'Unpredictable cave mushroom blooms draw erratic crowds to Comodo underground taverns!',
 'Fluctuating nightlife foot traffic causes lively hourly swings in discretionary equities.', 10),

('IZL_NEUTRAL_BYALAN_SEISMIC_MURMURS', 'MUNICIPAL_BOOM', 'Undersea Tunnel Seismic Murmurs', 'IZL', 0, 0, 3, 24,
 'Subterranean seismic activity near Byalan Island creates speculative defense trade swings!',
 'Oceanic tremor reports prompt active intraday trading in Izlude maritime equities.', 10),

('LUT_NEUTRAL_SNOWFLAKE_CATALYST', 'MUNICIPAL_BOOM', 'Artificial Snowflake Chemical Trial', 'LUT', 0, 0, 3, 24,
 'Prototype artificial snowflake catalysts provoke speculative swings in toy manufacturing!',
 'Experimental decorative snow testing induces active hourly trading in Lutie shares.', 10),

('RAC_NEUTRAL_SANCTUARY_ASTROLOGY', 'MUNICIPAL_BOOM', 'Sanctuary Astrological Omens', 'RAC', 0, 0, 3, 24,
 'Sacred sanctuary astrological omens provoke erratic sovereign fund rebalancing in Rachel!',
 'Mystical interpretations by temple acolytes amplify short-term sovereign equity swings.', 10),

('VEI_NEUTRAL_THOR_SEISMIC_SWARM', 'MUNICIPAL_BOOM', 'Thor Volcano Magma Pressure Swarm', 'VEI', 0, 0, 3, 24,
 'Subterranean magma surges cause heightened volatility in Veins mining commodity shares!',
 'Volcanic tremor sensors report elevated pressure, sparking lively intraday price discovery.', 10),

('JAW_NEUTRAL_COCKTAIL_TRADEMARK', 'MUNICIPAL_BOOM', 'Honeymoon Cocktail Trademark Dispute', 'JAW', 0, 0, 3, 24,
 'Tavern mixologists dispute exclusive rights to famous honeymoon cocktail formulas in Jawaii!',
 'Friendly tavern recipe rivalry provokes active trading swings in luxury hospitality equities.', 10),

('UMB_NEUTRAL_ABYSS_VORTEX_WINDS', 'MUNICIPAL_BOOM', 'Bottom-of-the-World Atmospheric Vortex', 'UMB', 0, 0, 3, 24,
 'Swirling atmospheric currents trigger volatile tourist bungee participation in Umbala!',
 'Jungle wind shifts create lively hourly fluctuations in adventure ecotourism valuations.', 10),

('LOU_NEUTRAL_DRAGON_PEAK_DIVINATION', 'MUNICIPAL_BOOM', 'Dragon Peak Astrological Forecast', 'LOU', 0, 0, 3, 24,
 'Astrological predictions regarding White Lady tomb ruins spark erratic herbal medicine speculation!',
 'Highland divination reports induce active trading swings in Louyang pharmaceutical equities.', 10),

('MOS_NEUTRAL_GOPINICH_HOARD_SURVEY', 'MUNICIPAL_BOOM', 'Gopinich Cavern Exploration Rumors', 'MOS', 0, 0, 3, 24,
 'Rumors of underground dragon hoards trigger volatile swings in Moscovia resource trust shares!',
 'Subterranean prospecting tales amplify short-term price movements across timber and fur assets.', 10),

('AMA_NEUTRAL_TATAMI_MAZE_SURVEY', 'MUNICIPAL_BOOM', 'Tatami Maze Secret Catacomb Survey', 'AMA', 0, 0, 3, 24,
 'Uncharted passages in the underground Tatami Maze trigger speculative antique trade swings in Amatsu!',
 'Ninja catacomb explorations create lively hourly trading among cultural heritage investors.', 10),

('AYO_NEUTRAL_SEASONAL_TIDAL_SURGE', 'MUNICIPAL_BOOM', 'Monsoon River Delta Tidal Surge', 'AYO', 0, 0, 3, 24,
 'Shifting seasonal river levels create temporary produce price volatility across Ayothaya floating markets!',
 'Delta water flow adjustments provoke active intraday price discovery in agrarian equities.', 10),

('GON_NEUTRAL_SPIRIT_DIVINATION', 'MUNICIPAL_BOOM', 'Evil Snake Lord Spirit Divination', 'GON', 0, 0, 3, 24,
 'Taoist divination regarding celestial relics sparks volatile swings in Gonryun elixir values!',
 'Hermit astrological forecasts induce lively hourly trading in immortality peach shares.', 10),

('BRA_NEUTRAL_CARNIVAL_THEME_RIVALRY', 'MUNICIPAL_BOOM', 'Annual Grand Carnival Theme Speculation', 'BRA', 0, 0, 3, 24,
 'Competing samba school themes provoke volatile shifts in Brasilis hospitality sponsorships!',
 'Carnival parade preparations generate active intraday trading in event entertainment equities.', 10),

('DEW_NEUTRAL_KOMODO_PRESERVE_SURVEY', 'MUNICIPAL_BOOM', 'Dragon Reserve Ecotourism Study', 'DEW', 0, 0, 3, 24,
 'Wildlife conservation studies create fluctuating booking interest for Dewata island ecotours!',
 'Volcanic safari reports prompt active intraday price discovery in island travel equities.', 10),

('MAL_NEUTRAL_FOLK_HEALING_CONFERENCE', 'MUNICIPAL_BOOM', 'Traditional Folk Medicine Symposium', 'MAL', 0, 0, 3, 24,
 'Healers and doctors review regional healthcare supply partnerships across Port Malaya!',
 'Inter-island medical logistics discussions stimulate lively hourly trading in port shares.', 10),

('NIF_NEUTRAL_YGGDRASIL_ROOT_ECHOES', 'MUNICIPAL_BOOM', 'Yggdrasil Root Ethereal Echoes', 'NIF', 0, 0, 3, 24,
 'Ethereal reverberations along Yggdrasil roots trigger price oscillations across Nifflheim occult assets!',
 'Mysterious spiritual resonance amplifies extreme intraday swings in distressed soul debt.', 10),

('DIC_NEUTRAL_BIFROST_AURORA_GLITCH', 'MUNICIPAL_BOOM', 'Bifrost Magnetic Aurora Glitch', 'DIC', 0, 0, 3, 24,
 'Extraplanar magnetic auroras cause unpredictable mining efficiency swings in El Dicastes!',
 'Dimensional energy field fluctuations induce active hourly price discovery in Bradium equities.', 10);

-- ======================================================================
-- Category 14: Multi-City Sovereign Treaties & Regional Blocs (4 Events)
-- ======================================================================
INSERT IGNORE INTO `solo_stock_events_def` 
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `dividend_change`, `headline`, `description`, `weight`) VALUES
('BLOC_TRIPARTITE_ALLIANCE', 'MACRO_GLOBAL', 'Continental Tri-Partite Sovereign Treaty', 'PRT,YUN,RAC', 35, 10,
 'Rune-Midgarts Kingdom, Schwarzwald Republic, and Arunafeltz Theocracy ratify historic mutual trade pact!',
 'Diplomatic harmonization eliminates cross-border tariffs, driving sovereign capital inflows across all three capitals.', 8),

('BLOC_SCHWARZWALD_INDUSTRIAL', 'MUNICIPAL_BOOM', 'Schwarzwald Industrial Convergence', 'LHZ,EIN,YUN', 45, 5,
 'Lighthalzen robotics, Einbroch foundries, and Yuno energy grids unite on unified Republic CapEx projects!',
 'Synergistic tech and manufacturing integration sparks a massive industrial equity rally across the Republic.', 8),

('BLOC_GLOBAL_MARITIME_LEAGUE', 'MUNICIPAL_BOOM', 'Trans-Oceanic Merchant Convoy', 'ALB,AMA,LOU,AYO,MAL', 40, 15,
 'Joint overseas merchant convoy establishes unified deep-water shipping lanes across Eastern Seas!',
 'Coordinated maritime freight schedules and reduced piracy risk deliver record shipping dividends across all port cities.', 8),

('BLOC_COMMODITY_MINING_ALLIANCE', 'MUNICIPAL_BOOM', 'Continental Metallurgical Cartel', 'PAY,VEI,MOS,DEW', 40, 12,
 'Forestry, volcanic iridium, taiga minerals, and native gold trusts form a raw materials pricing cartel!',
 'Harmonized commodity pricing power generates exceptional quarterly distributions for natural resource producers.', 8);

-- ======================================================================
-- Category 15: Corporate & Trans-Continental Faction Wars (4 Events)
-- ======================================================================
INSERT IGNORE INTO `solo_stock_events_def` 
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `ticker_secondary`, `price_secondary_pct_change`, `headline`, `description`, `weight`) VALUES
('WAR_KAFRA_VS_COOL_EVENT', 'TRADE_WAR', 'Continental Transport Tariff War', 'ADB', 50, 'ALB', -35,
 'Aldebaran Kafra Corp and Cool Event Corp enter fierce price war over continent-wide cart rentals and warps!',
 'Kafra aggressive volume discounts capture market share from provincial transport cooperatives.', 8),

('WAR_REKENBER_VS_REPUBLIC', 'TRADE_WAR', 'Schwarzwald Anti-Monopoly Inquest', 'YUN', 50, 'LHZ', -40,
 'Yuno Republic authorities launch landmark antitrust investigations into Rekenber corporate monopolies!',
 'Public sector regulatory enforcement strengthens government trust while placing corporate biotech under pressure.', 8),

('WAR_BLACKSMITH_VS_ALCHEMIST', 'TRADE_WAR', 'Forged Steel vs Enchanted Catalysts', 'EIN', 55, 'GEF', -35,
 'Whitesmith heavy manufacturing guilds boycott volatile synthetic alchemical transmutation reagents!',
 'Traditional forged metallurgical components surge in market demand at the expense of magical synthetic alternatives.', 8),

('WAR_ZONDA_VS_KAFRA', 'TRADE_WAR', 'Underground Zonda Courier Network', 'MOR', 50, 'ADB', -30,
 'Desert Zonda couriers capture southern parcel and smuggling logistics from Kafra regional offices!',
 'Alternative underground transport networks erode traditional utility logistics monopoly in the southern deserts.', 8);

-- ======================================================================
-- Category 16: Satellite Dungeons & Outpost Resource Strikes (8 Events)
-- ======================================================================
INSERT IGNORE INTO `solo_stock_events_def` 
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `dividend_change`, `direct_payout_per_share`, `headline`, `description`, `weight`) VALUES
('OUTPOST_GLASTHEIM_ROYAL_RECOVERY', 'MUNICIPAL_BOOM', 'King Schmidt Cursed Bullion Recovery', 'PRT', 55, 15, 0,
 'Royal Knight archaeology recovers lost Gaebolg royal crests and ancient gold bullion from Glastheim ruins!',
 'Historic treasure recovery injects massive sovereign reserves into the Prontera Crown treasury.', 10),

('OUTPOST_MJOLNIR_DEAD_PIT_COAL', 'MUNICIPAL_BOOM', 'Mjolnir Dead Pit High-Yield Strike', 'GEF', 50, 10, 0,
 'Mt. Mjolnir mining guild uncovers rich vein of pure Oridecon and coal in Dead Pit caverns!',
 'Abundant mineral fuel reserves dramatically lower magical fabrication and weapon smelting costs in Geffen.', 10),

('OUTPOST_ABYSS_LAKE_GOLD_SALVAGE', 'MUNICIPAL_BOOM', 'Abyss Lake Dragon Hoard Inflow', 'HUG', 65, 12, 0,
 'Adventurer airship charters recover ancient dragon gold hoards from deep Abyss Lake cavern vaults!',
 'Massive gold inflows and surging expedition charter bookings boost Hugel transport and leisure revenues.', 10),

('OUTPOST_SUNKEN_SHIP_DRAKE_GOLD', 'MUNICIPAL_BOOM', 'Ghost Galleon Cursed Treasure Salvage', 'ALB', 60, 25, 50,
 'Maritime salvage crews recover legendary cursed pirate bullion from Drake Sunken Ship off Alberta!',
 'Alberta Merchant Guild distributes a special instant cash windfall dividend to all registered shareholders.', 10),

('OUTPOST_MALANGDO_CAT_CONGLOMERATE', 'MUNICIPAL_BOOM', 'Feline Mercantile Convoy Arrival', 'ALB,MAL', 45, 15, 0,
 'Malangdo Cat Merchant Fleet arrives bearing exotic Silvervine fruits and deep ocean coral luxury goods!',
 'Seafaring feline trade partnerships expand high-margin luxury imports across Alberta and Port Malaya.', 10),

('OUTPOST_MORA_FAIRY_CHARM_TRADE', 'MUNICIPAL_BOOM', 'Bifrost Fairy Artifact Accord', 'DIC', 75, 10, 0,
 'El Dicastes establishes direct charm and artifact trade with the Laphine fairy outpost of Mora Village!',
 'Mystical Bifrost spirit enchantments drive exceptional export premiums for extraplanar mineral syndicates.', 10),

('OUTPOST_KIEL_HYRE_COLLABORATION', 'MUNICIPAL_BOOM', 'Kiel Hyre Mechanical Automata Patent', 'YUN', 70, 0, 0,
 'Yuno Sage Academy and Kiel Hyre Academy unveil next-generation autonomous mechanical doll energy cores!',
 'Revolutionary clockwork automation patents attract massive venture capital to Yuno deep-tech academies.', 10),

('OUTPOST_THOR_IFRIT_MAGMA_CALM', 'MUNICIPAL_BOOM', 'Thor Volcano Magma Chamber Venting', 'VEI', 60, 14, 0,
 'Geothermal crews successfully vent Thor Volcano magma chambers, securing uninterrupted iridium extraction!',
 'Stabilized volcanic mining platforms in Veins report record extraction yields and dividend cash flows.', 10);

-- ======================================================================
-- Category 17: In-Game Systems & Solo Feature Economic Catalysts (4 Events)
-- ======================================================================
INSERT IGNORE INTO `solo_stock_events_def` 
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `dividend_change`, `direct_payout_per_share`, `headline`, `description`, `weight`) VALUES
('SYSTEM_WOE_CASTLE_ECONOMY_BOOM', 'STRUCTURAL', 'Feast of the Guild Castles', 'ALL', 0, 0, 30,
 'Continental guild castles report record commercial investment yields, distributing royal windfall payouts!',
 'Every municipal shareholder across Midgard receives an instant direct cash dividend payout per share.', 5),

('SYSTEM_DAILY_BOUNTY_FRENZY', 'MUNICIPAL_BOOM', 'Adventurer Guild Hunting Campaign', 'PAY,MOR', 45, 10, 0,
 'Continental monster hunting bounty campaigns drive historic demand for Payon arrows and Morroc provisions!',
 'Adventurer equipment and provision sales deliver exceptional quarterly revenue growth for frontier towns.', 10),

('SYSTEM_BLACKSMITH_REFINING_FAD', 'MUNICIPAL_BOOM', 'Continental Oridecon Smelting Rush', 'EIN,GEF', 55, 12, 0,
 'High refining success rates across the Kingdom spark massive weapon upgrading and smelting volume!',
 'Surging demand for pure Oridecon and elemental catalysts drives record profits in Einbroch and Geffen.', 10),

('FIN_INVESTMENT_BANK_BOND_AUCTION', 'MUNICIPAL_BOOM', 'Royal Treasury Liquidity Bond Auction', 'PRT,ADB', 35, 15, 0,
 'Central Investment Bank issues high-yield municipal development bonds, expanding bank and utility reserves!',
 'Strong sovereign balance sheets and expanding deposit reserves boost financial dividends in Prontera and Aldebaran.', 10);

-- ======================================================================
-- Category 18: Phase 13 Decentralized Rune & Crypto-Asset Protocols (10 Events)
-- ======================================================================
INSERT IGNORE INTO `solo_stock_events_def` 
(`event_id`, `category`, `event_name`, `ticker_target`, `price_pct_change`, `ticker_secondary`, `price_secondary_pct_change`, `headline`, `description`, `weight`) VALUES
('CRYPTO_EMP_HALVING', 'CRYPTO_PROTOCOL', 'The Great Emperium Halving', 'EMP', 65, 'PRT', 10,
 'Emperium mining difficulty doubles across all dungeon veins as guild vaults accumulate reserves!',
 'Strict hard-cap supply and castle siege demand drive massive flight-to-safety into sovereign Emperium protocol shards.', 8),

('CRYPTO_POR_FOMO_PUMP', 'CRYPTO_PROTOCOL', 'King Poring Euphoria Frenzy', 'POR', 180, '', 0,
 'South Field novices chant "Poring to the Moon!" as retail FOMO triggers parabolic buying frenzy!',
 'Viral town crier hype and social hysteria push unbacked meme standard into dizzying triple-digit gains.', 8),

('CRYPTO_POR_RUG_PULL', 'CRYPTO_PROTOCOL', 'Ghostring Liquidity Collapse', 'POR', -85, '', 0,
 'Ghostring syndicate unloads 50 million Poring Coins in sudden coordinated liquidity dump!',
 'Devastated Novices flood Prontera South Field with tearful cries as meme standard plummets to earth.', 8),

('CRYPTO_YMI_GAS_CRISIS', 'CRYPTO_PROTOCOL', 'Alchemical Transmutation Bottleneck', 'YMI', 45, 'ALM', 25,
 'Homunculus synthesis craze congests Yuno Arcane Matrix, sending mana gas fees soaring!',
 'Transmutation energy demand surges, generating record fee revenues for decentralized alchemy cauldrons.', 8),

('CRYPTO_WRP_OUTAGE', 'CRYPTO_PROTOCOL', 'Spatial Leyline Fracture', 'WRP', -55, '', 0,
 'Blue Gemstone dimensional leylines overload, halting high-speed Warp Portal ledger transit!',
 'Protocol network halt and node desynchronization trigger sudden panic liquidation across teleport rails.', 8),

('CRYPTO_SHD_CROWN_RAID', 'CRYPTO_PROTOCOL', 'Prontera Crown Anti-Smuggling Blitz', 'SHD', -40, 'MOR', 15,
 'Royal Knights raid underground Morroc vaults, targeting anonymous zero-knowledge stealth rings!',
 'Regulatory crackdown temporarily depresses shadow protocol liquidity while physical black market premiums rise.', 8),

('CRYPTO_NZN_DEPEG_SCARE', 'CRYPTO_PROTOCOL', 'Kafra Vault Solvency Rumors', 'NZN', -5, 'EMP', 20,
 'Unsubstantiated rumors of Kafra vault bullion shortages trigger brief algorithmic peg wobble!',
 'Capital rapidly rotates into sovereign Emperium shards before Kafra publishes certified proof-of-reserve audits.', 8),

('CRYPTO_ORA_ORACLE_DESYNC', 'CRYPTO_PROTOCOL', 'Odin Raven Leyline Disruption', 'ORA', -40, 'ALM', -20,
 'Severe geomagnetic mana storm confounds Odin ravens, delaying decentralized price and drop feeds!',
 'Temporary oracle latency slows alchemical automated liquidity execution across decentralized bazaars.', 8),

('CRYPTO_ZEX_QUARTERLY_BURN', 'CRYPTO_PROTOCOL', 'Merchant Guild Furnace Burn', 'ZEX', 50, '', 0,
 'Alberta Merchant Consortium burns 25% of quarterly trade commissions in public Alberta town square furnace!',
 'Deflationary supply burn and reduced brokerage commissions attract strong merchant buying support.', 8),

('CRYPTO_KFX_BANKING_TREATY', 'CRYPTO_PROTOCOL', 'Tri-Kingdom Inter-Realm Settlement Pact', 'KFX', 45, 'RAC', 15,
 'Prontera, Juno, and Rachel Central Banks ratify instant cross-border Kafra wire protocol!',
 'Standardized inter-kingdom settlement volumes surge, boosting institutional protocol throughput and yield.', 8);
