-- ======================================================================
-- Midgard Stock Exchange: Transaction Audit Ledger Schema
-- ======================================================================

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
