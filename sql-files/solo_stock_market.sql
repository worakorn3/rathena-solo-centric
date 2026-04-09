-- SQL Migration for Midgard Stock Exchange
CREATE TABLE IF NOT EXISTS `solo_stock_market` (
    `ticker` VARCHAR(10) PRIMARY KEY,
    `price` INT DEFAULT 1000,
    `price_old` INT DEFAULT 1000,
    `dividend` INT DEFAULT 3,
    `div_acc` INT DEFAULT 0,
    `split_count` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `solo_stock_player` (
    `account_id` INT(11) UNSIGNED NOT NULL,
    `ticker` VARCHAR(10) NOT NULL,
    `shares` INT DEFAULT 0,
    `total_cost` BIGINT DEFAULT 0,
    `last_claim_acc` INT DEFAULT 0,
    `split_processed` INT DEFAULT 0,
    PRIMARY KEY (`account_id`, `ticker`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `solo_stock_meta` (
    `mkey` VARCHAR(32) PRIMARY KEY,
    `mval` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Initialize Tickers
INSERT IGNORE INTO `solo_stock_market` (ticker) VALUES ('PRT'), ('GEF'), ('MOR'), ('PAY'), ('ALB');
-- Initialize Meta
INSERT IGNORE INTO `solo_stock_meta` (mkey, mval) VALUES ('MarketMood', 1), ('MarketDrift', 0), ('LastUpdate', 0);
