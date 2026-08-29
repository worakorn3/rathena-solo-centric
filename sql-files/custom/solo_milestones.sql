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
(`id`, `category`, `prev_milestone_id`, `target_mob_id`, `required_count`, `title`, `description`, `reward_zeny`, `reward_item_id`, `reward_item_amount`, `reward_desc`, `tier_label`, `is_active`, `sort_order`)
VALUES
('mvp_centurion_50', 'MVP', NULL, 0, 50, 'Centurion Slayer', 'Defeat 50 MvP Bosses across Midgard', 1000000, 0, 0, '+10% Boss Drop Rate permanently + 1,000,000z', 'Global / Boss', 1, 1),
('exterminator_tier_1', 'TOTAL', NULL, 0, 25000, 'Exterminator Tier I', 'Slay 25,000 total monsters of any class', 500000, 617, 1, '500,000 Zeny + 1x Old Purple Box', 'Global / Boss', 1, 2),
('poring_hunter_500', 'SPECIFIC_MOB', NULL, 1002, 500, 'Jelly Menace (Poring)', 'Exterminate 500 Porings in Prontera Fields', 25000, 501, 50, '25,000 Zeny + 50x Red Potions', 'Novice (Lv 1–40)', 1, 3),
('orc_warrior_1000', 'SPECIFIC_MOB', 'poring_hunter_500', 1023, 1000, 'Orc Village Conqueror', 'Defeat 1,000 Orc Warriors in Gef_Fild', 100000, 604, 5, '100,000 Zeny + 5x Dead Branches', '2nd Class (Lv 41–99)', 1, 4),
('raydric_slayer_1500', 'SPECIFIC_MOB', 'orc_warrior_1000', 1163, 1500, 'Glast Heim Knightfall', 'Slay 1,500 Raydrics in the Castle ruins', 350000, 984, 10, '350,000 Zeny + 10x Oridecon', 'Trans (Lv 90–99)', 1, 5),
('magmaring_blaster_2000', 'SPECIFIC_MOB', 'raydric_slayer_1500', 1836, 2000, 'Magma Blaster', 'Extinguish 2,000 Magmarings in Veins Field', 750000, 617, 3, '750,000 Zeny + 3x Old Purple Boxes', '3rd Class (Lv 100–185)', 1, 6),
('giant_caput_2500', 'SPECIFIC_MOB', 'magmaring_blaster_2000', 20929, 2500, 'Biomass Exterminator', 'Eliminate 2,500 Giant Caputs in 4th Class Zone', 2500000, 616, 2, '2,500,000 Zeny + 2x Old Card Albums', '4th Class (Lv 200–250+)', 1, 7)
ON DUPLICATE KEY UPDATE
`prev_milestone_id` = VALUES(`prev_milestone_id`),
`title` = VALUES(`title`),
`description` = VALUES(`description`),
`reward_zeny` = VALUES(`reward_zeny`),
`reward_item_id` = VALUES(`reward_item_id`),
`reward_item_amount` = VALUES(`reward_item_amount`),
`reward_desc` = VALUES(`reward_desc`),
`tier_label` = VALUES(`tier_label`),
`is_active` = VALUES(`is_active`),
`sort_order` = VALUES(`sort_order`);
