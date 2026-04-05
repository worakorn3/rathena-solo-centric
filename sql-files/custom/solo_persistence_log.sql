CREATE TABLE IF NOT EXISTS `solo_persistence_log` (
    `account_id` INT(11) UNSIGNED NOT NULL,
    `category` VARCHAR(32) NOT NULL COMMENT 'e.g., KILL, LOOT',
    `target_id` INT(11) NOT NULL COMMENT 'e.g., Mob ID, Item ID',
    `value` INT(11) DEFAULT '0' COMMENT 'e.g., kill count',
    `tstamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`account_id`, `category`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
