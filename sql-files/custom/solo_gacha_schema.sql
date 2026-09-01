-- =========================================================================
-- Solo-Centric Web Gacha System: Midgard Egg Spinner Altar Schema
-- Idempotent schema definition and initial master roster seeds
-- =========================================================================

-- 1. Gacha Banners Table
CREATE TABLE IF NOT EXISTS `solo_gacha_banners` (
  `banner_id` VARCHAR(32) PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `icon` VARCHAR(32) NOT NULL,
  `base_price` INT UNSIGNED NOT NULL DEFAULT 10000,
  `ssr_rate` DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  `sr_rate` DECIMAL(5,2) NOT NULL DEFAULT 25.00,
  `r_rate` DECIMAL(5,2) NOT NULL DEFAULT 70.00,
  `pity_threshold` INT UNSIGNED NOT NULL DEFAULT 30,
  `enabled` TINYINT NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Master Item Pool Table
CREATE TABLE IF NOT EXISTS `solo_gacha_pool` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `banner_id` VARCHAR(32) NOT NULL,
  `nameid` INT UNSIGNED NOT NULL,
  `item_name` VARCHAR(64) NOT NULL,
  `amount` INT UNSIGNED NOT NULL DEFAULT 1,
  `refine` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `tier` ENUM('SSR', 'SR', 'R') NOT NULL,
  `weight` INT UNSIGNED NOT NULL DEFAULT 10,
  `enabled` TINYINT NOT NULL DEFAULT 1,
  INDEX `idx_banner_tier` (`banner_id`, `tier`, `enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Daily Rotation Spotlight Table
CREATE TABLE IF NOT EXISTS `solo_gacha_rotation` (
  `banner_id` VARCHAR(32) PRIMARY KEY,
  `featured_ssr_id` INT UNSIGNED NOT NULL DEFAULT 0,
  `featured_sr_ids` TEXT NOT NULL,
  `last_rotated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `rotated_date` DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Per-Account Banner Pity Counter Table
CREATE TABLE IF NOT EXISTS `solo_gacha_pity` (
  `account_id` INT UNSIGNED NOT NULL,
  `banner_id` VARCHAR(32) NOT NULL,
  `pity_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`account_id`, `banner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Dedicated Web Gacha Stash Table
CREATE TABLE IF NOT EXISTS `solo_gacha_stash` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `account_id` INT UNSIGNED NOT NULL,
  `nameid` INT UNSIGNED NOT NULL,
  `item_name` VARCHAR(64) NOT NULL,
  `amount` INT UNSIGNED NOT NULL DEFAULT 1,
  `refine` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `tier` ENUM('SSR', 'SR', 'R') NOT NULL,
  `status` ENUM('STASHED', 'MAILED', 'SCRAPPED') NOT NULL DEFAULT 'STASHED',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_acc_status` (`account_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Exclusives-Only Exchange Shop Catalog
CREATE TABLE IF NOT EXISTS `solo_gacha_shop` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nameid` INT UNSIGNED NOT NULL,
  `item_name` VARCHAR(64) NOT NULL,
  `amount` INT UNSIGNED NOT NULL DEFAULT 1,
  `refine` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `category` VARCHAR(32) NOT NULL DEFAULT 'VANITY',
  `shard_price` INT UNSIGNED NOT NULL DEFAULT 100,
  `enabled` TINYINT NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Audit Pull History Log
CREATE TABLE IF NOT EXISTS `solo_gacha_log` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `account_id` INT UNSIGNED NOT NULL,
  `char_id` INT UNSIGNED NOT NULL,
  `banner_id` VARCHAR(32) NOT NULL,
  `nameid` INT UNSIGNED NOT NULL,
  `item_name` VARCHAR(64) NOT NULL,
  `amount` INT UNSIGNED NOT NULL DEFAULT 1,
  `refine` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `tier` ENUM('SSR', 'SR', 'R') NOT NULL,
  `zeny_spent` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_log_acc` (`account_id`, `created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================================
-- Idempotent Seed Data: 4 Granular Banners
-- =========================================================================
-- =========================================================================
-- Idempotent Seed Data: 4 Granular Banners
-- =========================================================================
INSERT INTO `solo_gacha_banners` (`banner_id`, `name`, `description`, `icon`, `base_price`, `ssr_rate`, `sr_rate`, `r_rate`, `pity_threshold`, `enabled`, `sort_order`)
VALUES
  ('supplies', 'General Supplies', 'Potions, Battle Manuals, Bubble Gums, and Exploration Essentials.', 'flask-conical', 10000, 10.00, 25.00, 65.00, 20, 1, 1),
  ('weapons', 'Weapons & Armors', 'Safe Refine Certs, HD Ores, Blacksmith Blessings, and Slotted Gear.', 'shield', 35000, 5.00, 25.00, 70.00, 30, 1, 2),
  ('costumes', 'Costumes & Vanity', 'Wings, Exclusive Animated Headgears, and Color Dyes.', 'crown', 75000, 3.00, 25.00, 72.00, 50, 1, 3),
  ('cards', 'Cards & Albums', 'Old Card Albums, Mystical Albums, and Sealed Boss Caches.', 'layers', 100000, 2.00, 23.00, 75.00, 50, 1, 4)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `icon` = VALUES(`icon`),
  `sort_order` = VALUES(`sort_order`);
  -- Note: Do NOT overwrite base_price, ssr_rate, sr_rate, r_rate, pity_threshold, or enabled on duplicate key to preserve custom admin configuration.

-- =========================================================================
-- Idempotent Seed Data: Master Item Pools (Canonical rAthena Renewal Item IDs)
-- =========================================================================

-- Purge legacy mismatched seed entries if present
DELETE FROM `solo_gacha_pool` WHERE `nameid` IN (
  5019, 5036, 5037, 5014, 5030, 5084, 5018, 5004, 5012, 5384, 20017, 20092, 20188, 20189, 20190, 7946, 5204,
  14003, 20256, 20257, 20258, 20259, 20260, 6234, 6235, 6236, 6237, 23000, 23001, 6223, 6224, 7619, 7620,
  1250, 1710, 1124, 1136, 1471, 1171, 757, 756, 1002, 12741, 643, 22774, 12108, 12743, 14004, 12742
) AND `banner_id` IN ('costumes', 'weapons', 'supplies', 'cards');

INSERT IGNORE INTO `solo_gacha_pool` (`banner_id`, `nameid`, `item_name`, `amount`, `refine`, `tier`, `weight`, `enabled`)
VALUES
  -- 🧪 1. General Supplies
  ('supplies', 12103, 'Bloody Branch', 1, 0, 'SSR', 10, 1),
  ('supplies', 12212, 'Giant Fly Wing', 10, 0, 'SSR', 15, 1),
  ('supplies', 12105, 'Taming Gift Set', 1, 0, 'SSR', 10, 1),
  ('supplies', 12221, 'Megaphone', 5, 0, 'SSR', 15, 1),
  ('supplies', 7621, 'Token Of Siegfried', 3, 0, 'SSR', 10, 1),
  ('supplies', 12710, 'Guyak Pudding', 5, 0, 'SR', 20, 1),
  ('supplies', 12883, 'Almighty', 3, 0, 'SR', 20, 1),
  ('supplies', 12210, 'Bubble Gum', 1, 0, 'SR', 15, 1),
  ('supplies', 12208, 'Battle Manual', 1, 0, 'SR', 15, 1),
  ('supplies', 9895, '[Scroll] Abrasive', 2, 0, 'SR', 15, 1),
  ('supplies', 678, 'Poison Bottle', 5, 0, 'SR', 15, 1),
  ('supplies', 12028, 'Box of Thunder', 5, 0, 'SR', 20, 1),
  ('supplies', 504, 'White Potion', 20, 0, 'R', 50, 1),
  ('supplies', 505, 'Blue Potion', 10, 0, 'R', 40, 1),
  ('supplies', 12016, 'Speed Potion', 3, 0, 'R', 30, 1),
  ('supplies', 601, 'Fly Wing', 30, 0, 'R', 60, 1),
  ('supplies', 602, 'Butterfly Wing', 10, 0, 'R', 50, 1),
  ('supplies', 547, 'Condensed White Potion', 15, 0, 'R', 40, 1),
  ('supplies', 656, 'Awakening Potion', 5, 0, 'R', 30, 1),
  ('supplies', 525, 'Panacea', 10, 0, 'R', 30, 1),

  -- ⚔️ 2. Weapons & Armors
  ('weapons', 6230, '+7 Weapon Refine Ticket', 1, 0, 'SSR', 15, 1),
  ('weapons', 6234, '+7 Armor Refine Ticket', 1, 0, 'SSR', 15, 1),
  ('weapons', 6228, '+9 Weapon Refine Ticket', 1, 0, 'SSR', 5, 1),
  ('weapons', 6232, '+9 Armor Refine Ticket', 1, 0, 'SSR', 5, 1),
  ('weapons', 6238, '+11 Weapon Refine Ticket', 1, 0, 'SSR', 5, 1),
  ('weapons', 6239, '+11 Armor Refine Ticket', 1, 0, 'SSR', 5, 1),
  ('weapons', 6240, 'HD Oridecon', 2, 0, 'SR', 25, 1),
  ('weapons', 6241, 'HD Elunium', 2, 0, 'SR', 25, 1),
  ('weapons', 6635, 'Blacksmith Blessing', 1, 0, 'SR', 15, 1),
  ('weapons', 7620, 'Enriched Oridecon', 2, 0, 'SR', 20, 1),
  ('weapons', 7619, 'Enriched Elunium', 2, 0, 'SR', 20, 1),
  ('weapons', 1261, 'Infiltrator', 1, 0, 'SR', 10, 1),
  ('weapons', 1714, 'Gakkung Bow', 1, 0, 'SR', 10, 1),
  ('weapons', 1164, 'Muramasa', 1, 0, 'SR', 10, 1),
  ('weapons', 1145, 'Holy Avenger', 1, 0, 'SR', 10, 1),
  ('weapons', 1473, 'Wizardry Staff', 1, 0, 'SR', 10, 1),
  ('weapons', 1814, 'Berserk', 1, 0, 'SR', 10, 1),
  ('weapons', 984, 'Oridecon', 5, 0, 'R', 50, 1),
  ('weapons', 985, 'Elunium', 5, 0, 'R', 50, 1),
  ('weapons', 999, 'Steel', 15, 0, 'R', 40, 1),
  ('weapons', 756, 'Rough Oridecon', 10, 0, 'R', 40, 1),
  ('weapons', 757, 'Rough Elunium', 10, 0, 'R', 40, 1),
  ('weapons', 1011, 'Emveretarcon', 20, 0, 'R', 30, 1),
  ('weapons', 998, 'Iron', 20, 0, 'R', 30, 1),

  -- 👑 3. Costumes & Vanity
  ('costumes', 20765, 'Costume Archangel Wing', 1, 0, 'SSR', 15, 1),
  ('costumes', 20764, 'Costume Fallen Angel Wing', 1, 0, 'SSR', 15, 1),
  ('costumes', 19546, 'Costume Valkyrie Helm', 1, 0, 'SSR', 10, 1),
  ('costumes', 5666, 'Golden Crown', 1, 0, 'SSR', 10, 1),
  ('costumes', 2235, 'Crown', 1, 0, 'SSR', 10, 1),
  ('costumes', 5025, 'Helm of Angel', 1, 0, 'SSR', 10, 1),
  ('costumes', 19710, 'Costume Wings Of Victory', 1, 0, 'SR', 20, 1),
  ('costumes', 19843, 'Costume Kitty Band', 1, 0, 'SR', 20, 1),
  ('costumes', 19527, 'Costume Spiky Band', 1, 0, 'SR', 15, 1),
  ('costumes', 19662, 'Costume Magician Hat', 1, 0, 'SR', 15, 1),
  ('costumes', 2256, 'Majestic Goat', 1, 0, 'SR', 15, 1),
  ('costumes', 5019, 'Corsair', 1, 0, 'SR', 15, 1),
  ('costumes', 5360, 'Hyuke\'s Black Cat Ears', 1, 0, 'SR', 15, 1),
  ('costumes', 5045, 'Magician Hat', 1, 0, 'SR', 15, 1),
  ('costumes', 983, 'Black Dyestuffs', 2, 0, 'R', 40, 1),
  ('costumes', 982, 'White Dyestuffs', 2, 0, 'R', 40, 1),
  ('costumes', 975, 'Scarlet Dyestuffs', 2, 0, 'R', 40, 1),
  ('costumes', 5288, 'Red Glasses', 1, 0, 'R', 30, 1),
  ('costumes', 2267, 'Cigarette', 1, 0, 'R', 30, 1),
  ('costumes', 2268, 'Pipe', 1, 0, 'R', 30, 1),
  ('costumes', 5061, 'Flower Hairpin', 1, 0, 'R', 30, 1),
  ('costumes', 2213, 'Kitty Band', 1, 0, 'R', 30, 1),
  ('costumes', 2286, 'Elven Ears', 1, 0, 'R', 30, 1),
  ('costumes', 19511, 'Heart Eye Patch 1', 1, 0, 'R', 30, 1);

  -- 🎴 4. Cards & Albums
INSERT IGNORE INTO `solo_gacha_pool` (`banner_id`, `nameid`, `item_name`, `amount`, `refine`, `tier`, `weight`, `enabled`)
VALUES
  ('cards', 12246, 'Mystical Card Album', 1, 0, 'SSR', 25, 1),
  ('cards', 101075, 'Sealed Boss Card Thump Box', 1, 0, 'SSR', 15, 1),
  ('cards', 12690, 'Headgear Card Album', 1, 0, 'SSR', 20, 1),
  ('cards', 616, 'Old Card Album', 1, 0, 'SR', 40, 1),
  ('cards', 617, 'Old Purple Box', 2, 0, 'SR', 30, 1),
  ('cards', 12691, 'Armor Card Album', 1, 0, 'SR', 30, 1),
  ('cards', 603, 'Old Blue Box', 3, 0, 'R', 40, 1),
  ('cards', 644, 'Gift Box', 5, 0, 'R', 40, 1),
  ('cards', 990, 'Red Blood', 10, 0, 'R', 30, 1),
  ('cards', 991, 'Crystal Blue', 10, 0, 'R', 30, 1),
  ('cards', 992, 'Wind of Verdure', 10, 0, 'R', 30, 1),
  ('cards', 993, 'Green Live', 10, 0, 'R', 30, 1),
  ('cards', 1000, 'Star Crumb', 5, 0, 'R', 30, 1);

-- =========================================================================
-- Idempotent Seed Data: Exclusives-Only Exchange Shop Catalog
-- =========================================================================
DELETE FROM `solo_gacha_shop` WHERE `nameid` IN (20261, 20262, 20264, 14005, 23002, 23003);

INSERT IGNORE INTO `solo_gacha_shop` (`nameid`, `item_name`, `amount`, `refine`, `category`, `shard_price`, `enabled`, `sort_order`)
VALUES
  (20765, 'Costume Archangel Wing', 1, 0, 'Mythic Wings', 500, 1, 1),
  (20764, 'Costume Fallen Angel Wing', 1, 0, 'Mythic Wings', 500, 1, 2),
  (19546, 'Costume Valkyrie Helm', 1, 0, 'Imperial Vanity', 400, 1, 3),
  (6238, '+11 Weapon Refine Ticket', 1, 0, 'Refine Mastery', 600, 1, 4),
  (6239, '+11 Armor Refine Ticket', 1, 0, 'Refine Mastery', 600, 1, 5),
  (101075, 'Sealed Boss Card Thump Box', 1, 0, 'Utility', 250, 1, 6),
  (6635, 'Blacksmith Blessing', 5, 0, 'Refine Bundle', 150, 1, 7),
  (12883, 'Almighty', 10, 0, 'Buff Bundle', 100, 1, 8);

-- Initial rotation seed
INSERT INTO `solo_gacha_rotation` (`banner_id`, `featured_ssr_id`, `featured_sr_ids`, `rotated_date`)
VALUES
  ('supplies', 12103, '[12710, 12883, 12210]', CURDATE()),
  ('weapons', 6230, '[6240, 6241, 6635]', CURDATE()),
  ('costumes', 20765, '[19710, 19843, 19527]', CURDATE()),
  ('cards', 12246, '[616, 617, 12691]', CURDATE())
ON DUPLICATE KEY UPDATE
  `rotated_date` = VALUES(`rotated_date`);

