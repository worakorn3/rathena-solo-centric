CREATE TABLE IF NOT EXISTS `solo_bank_account` (
    `account_id` INT UNSIGNED NOT NULL PRIMARY KEY,
    `principal` BIGINT NOT NULL DEFAULT 0,
    `deposit_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `interest_paid_total` BIGINT NOT NULL DEFAULT 0,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_account_id` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Safe idempotent backfill from legacy acc_reg_num
INSERT INTO `solo_bank_account` (`account_id`, `principal`, `deposit_time`)
SELECT 
    `account_id`,
    MAX(CASE WHEN `key` = '#INVEST_BALANCE' THEN CAST(`value` AS UNSIGNED) ELSE 0 END) as `principal`,
    MAX(CASE WHEN `key` = '#INVEST_TIME' THEN CAST(`value` AS UNSIGNED) ELSE 0 END) as `deposit_time`
FROM `acc_reg_num`
WHERE `key` IN ('#INVEST_BALANCE', '#INVEST_TIME')
GROUP BY `account_id`
HAVING `principal` > 0
ON DUPLICATE KEY UPDATE 
    `principal` = IF(`solo_bank_account`.`principal` = 0, VALUES(`principal`), `solo_bank_account`.`principal`),
    `deposit_time` = IF(`solo_bank_account`.`deposit_time` = 0, VALUES(`deposit_time`), `solo_bank_account`.`deposit_time`);
