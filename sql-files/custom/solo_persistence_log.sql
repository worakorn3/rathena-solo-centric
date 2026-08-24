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
