# Phase 17: Web Gacha & Altar System (Midgard Egg Spinner Altar)

🔗 **Backlink:** [Main Implementation Plan](../implementation_plan.md)

> [!NOTE]  
> The Web Gacha Altar is built directly into the Web Portal (`@rathena/client` and `@rathena/server`) to eliminate in-game NPC dialogue bloat and inventory clutter while offering direct in-game RO Mail delivery, dynamic stock market pricing, a dedicated Web Stash, and a prestigious Exclusives-Only Exchange Shop.

---

## 🏛️ Core Architectural Pillars

| Component | Technical Implementation | Gameplay Purpose |
| :--- | :--- | :--- |
| **Currency & Source** | Liquid Zeny sink deducted from active character (Primary DB port 3306). | Controlled high-velocity money sink for solo economy. |
| **Dynamic Economy Pricing** | Base prices modulated by Midgard Stock Market Mood & Drift (up to 15% Bull discount, Bear surcharge). 10-pull gets 10% discount. | Direct integration between Web Stock Exchange and Gacha costs. |
| **Banners (4 Granular)** | 1. **General Supplies** (10k z base, Pity: 20)<br>2. **Weapons & Armors** (35k z base, Pity: 30, 10-pull SR+ guarantee)<br>3. **Costumes & Vanity** (75k z base, Pity: 50)<br>4. **Cards & Albums** (100k z base, Pity: 50) | Clear thematic categorization with customized drop rates and pity thresholds. |
| **Rarity Tiering** | **SSR (5★) / SR (4★) / R (3★)** | Universal 3-tier rarity across all banners. |
| **Daily Spotlight Rotation** | Rolls **1 Featured SSR** + **3 Featured SRs** daily at 00:00 midnight with automatic offline/boot catch-up. | Ensures banners never feel static; spotlight items receive 50% tier rate-up. |
| **Rotation Countdown** | Real-time live countdown timer (`Resets in HH:MM:SS`) on banner cards. | Clear player communication for daily rotation schedule. |
| **Dedicated Web Stash** | MariaDB table `solo_gacha_stash`. | All won items sit in Web Stash first, preventing in-game 100-slot inventory overflow. |
| **Gacha Scrap Engine** | Dismantle unwanted items into **Gacha Shards** (`SSR` = 100, `SR` = 25, `R` = 5). | Solves uselessness of duplicate non-consumables and costumes. |
| **Exclusives-Only Exchange Shop** | MariaDB table `solo_gacha_shop` for items only obtainable with Shards. | Gives prestige vanity and high-tier refine certs without RNG. |
| **Direct In-Game RO Mail** | Atomic dispatch to `mail` + `mail_attachments` in MySQL Primary (3306). | Items arrive instantly in-game with unread notification. |
| **100% Admin Customizer** | Live Admin Gacha Manager inside `AdminVaultWindow.tsx`. | Real-time editing of banners, item pools, exchange shop, force rotate, and pull sandbox. |

---

## 🔄 End-to-End Player Flow

```
┌─────────────────────────────────────────────────────────────┐
│             🎰 WEB GACHA COCKPIT (Egg Spinner)              │
│  [Supplies (10k)] [Weapons (35k)] [Costumes (75k)] [Cards] │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Roll 1x or 10x)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               📦 DEDICATED WEB GACHA STASH                  │
│  [Filter: ALL | SSR (2) | SR (5) | R (18)]                  │
│  [☑ Select All]  [📬 Send to In-Game Mail]  [♻️ Scrap Items]│
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
    (Selective/Bulk Mail)             (Dismantle Unwanted)
               │                               │
               ▼                               ▼
┌─────────────────────────────┐   ┌───────────────────────────┐
│    📬 IN-GAME RO MAILBOX     │   │     💎 GACHA SHARDS       │
│ (Atomic mail_attachments DB)│   │  (Accumulates on Account) │
└─────────────────────────────┘   └────────────┬──────────────┘
                                               │
                                       (Spend in Shop)
                                               │
                                               ▼
                                  ┌───────────────────────────┐
                                  │  🛍️ EXCLUSIVES ONLY SHOP   │
                                  │ - Golden Archangel (500)  │
                                  │ - Safe +11 Cert (600)     │
                                  │ - Sovereign Crown (400)   │
                                  │ - Blacksmith Pack (150)   │
                                  └───────────────────────────┘
```

---

## 💎 Exclusives-Only Exchange Shop Catalog

| Item ID | Item Name | Category | Gacha Shard Cost | Exclusivity Notes |
| :--- | :--- | :--- | :--- | :--- |
| `20261` | `Costume_Golden_Archangel_Wings` | Costume Wing | **500 Shards** | Mythic golden particle wings; exclusive to Exchange Shop. |
| `20262` | `Costume_Chromatic_Valkyrie_Wings` | Costume Wing | **500 Shards** | Chromatic shifting Valkyrie wings; shop exclusive. |
| `20264` | `Costume_Sovereign_Crown` | Costume Headgear | **400 Shards** | Imperial sovereign crown vanity; shop exclusive. |
| `6238` | `Guarantee_Weapon_11Up` | Refine Cert | **600 Shards** | Safe to +11 Weapon Certificate; highest tier guarantee. |
| `6239` | `Guarantee_Armor_11Up` | Refine Cert | **600 Shards** | Safe to +11 Armor Certificate; highest tier guarantee. |
| `14005` | `Ancient_Card_Extraction_Voucher` | Utility | **250 Shards** | 100% safe card extraction voucher; shop exclusive. |
| `23002` | `Blacksmith_Master_Bundle` | Refine Pack | **150 Shards** | 3x Blacksmith Blessing + 5x HD Oridecon + 5x HD Elunium. |
| `23003` | `Grand_Expedition_Cache` | Buff Pack | **100 Shards** | 5x Bubble Gum + 5x Battle Manual + 5x Guyak Pudding. |

---

## 📦 Initial Master Item Pool Seeds

### 1. General Supplies (Base: 10,000z · SSR 10% · SR 25% · R 65% · Pity: 20 pulls)
- **SSR (10%)**: `Bloody_Branch` (12103) x1, `Giant_Fly_Wing` (12212) x10, `Taming_Gift_Box` (12741) x1, `Loudspeaker` (643) x5, `Token_Of_Siegfried` (7621) x3.
- **SR (25%)**: `Guyak_Pudding` (12710) x5, `Almighty` (22774) x3, `Bubble_Gum` (12210) x1, `Battle_Manual` (12208) x1, `Abrasive` (12108) x2, `Poison_Bottle` (678) x5, `Box_Of_Thunder` (12028) x5.
- **R (65%)**: `White_Potion` (504) x20, `Blue_Potion` (505) x10, `Speed_Potion` (12016) x3, `Wing_Of_Fly` (601) x30, `Wing_Of_Butterfly` (602) x10, `Condensed_White_Potion` (547) x15, `Awakening_Potion` (656) x5, `Panacea` (525) x10.

### 2. Weapons & Armors (Base: 35,000z · SSR 5% · SR 25% · R 70% · Pity: 30 pulls · 10-pull guarantees SR+)
- **SSR (5%)**: `Guarantee_Weapon_7Up` (6234) x1, `Guarantee_Armor_7Up` (6235) x1, `Guarantee_Weapon_9Up` (6236) x1, `Guarantee_Armor_9Up` (6237) x1, `Shadow_Weapon_Box` (23000) x1, `Shadow_Armor_Box` (23001) x1.
- **SR (25%)**: `HD_Oridecon` (6223) x2, `HD_Elunium` (6224) x2, `Blacksmith_Blessing` (6635) x1, `Enriched_Oridecon` (7619) x2, `Enriched_Elunium` (7620) x2, `Infiltrator` (1250), `Gakkung_` (1710), `Muramasa` (1124), `Holy_Avenger` (1136), `Wizardry_Staff` (1471), `Berserk` (1171).
- **R (70%)**: `Oridecon` (984) x5, `Elunium` (985) x5, `Steel` (999) x15, `Rough_Oridecon` (757) x10, `Rough_Elunium` (756) x10, `Emveretarcon` (1011) x20, `Iron` (1002) x20.

### 3. Costumes & Vanity (Base: 75,000z · SSR 3% · SR 25% · R 72% · Pity: 50 pulls)
- **SSR (3%)**: `C_Archangel_Wing` (20257) x1, `C_Fallen_Angel_Wing` (20256) x1, `Lord_Knight_Helm_Box` (14003) x1, `C_Royal_Crown` (20258) x1, `C_Valkyrie_Feather_Wings` (20259) x1, `C_Golden_Crown` (20260) x1.
- **SR (25%)**: `C_Wings_Of_Victory` (20017) x1, `C_Fairy_Feathers` (20092) x1, `Twin_Pompom` (5384) x1, `Majestic_Goat` (5012) x1, `Spiky_Band` (5004) x1, `C_Corsair` (20188) x1, `C_Magician_Hat` (20189) x1, `C_Crown` (20190) x1.
- **R (72%)**: `Cosmetic_Dye_Voucher` (7946) x2, `Event_Pierrot_Nose` (5204) x1, `Red_Glasses` (5030) x1, `Cigarette` (5036) x1, `Pipe` (5037) x1, `Flower_Hairpin` (5014) x1, `Cat_Ears` (5019) x1, `Elf_Ears` (5018) x1, `Heart_Eye_Patch` (5084) x1.

### 4. Cards & Albums (Base: 100,000z · SSR 2% · SR 23% · R 75% · Pity: 50 pulls)
- **SSR (2%)**: `Mystical_Card_Album` (12246) x1, `Sealed_Boss_Cache` (12743) x1, `Boss_Card_Extraction_Voucher` (14004) x1.
- **SR (23%)**: `Old_Card_Album` (616) x1, `Old_Purple_Box` (617) x2, `Mini-Boss Card Album` (12742) x1.
- **R (75%)**: `Old_Blue_Box` (603) x3, `Gift_Box` (644) x5, `Red_Blood` (990) x10, `Crystal_Blue` (991) x10, `Wind_Of_Verdure` (992) x10, `Yellow_Live` (993) x10, `Star_Crumb` (1000) x5.

---

## 🛡️ Database Schema (`sql-files/custom/solo_gacha_schema.sql`)

```sql
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

CREATE TABLE IF NOT EXISTS `solo_gacha_rotation` (
  `banner_id` VARCHAR(32) PRIMARY KEY,
  `featured_ssr_id` INT UNSIGNED NOT NULL DEFAULT 0,
  `featured_sr_ids` TEXT NOT NULL,
  `last_rotated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `rotated_date` DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `solo_gacha_pity` (
  `account_id` INT UNSIGNED NOT NULL,
  `banner_id` VARCHAR(32) NOT NULL,
  `pity_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`account_id`, `banner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
```
