# Economy, Banking & Finance Specification

🔗 **Backlink:** [Main Implementation Plan](../implementation_plan.md)

> [!NOTE]  
> All systems below operate strictly via NPC scripts, persistent account registers, and custom MySQL tables without core source modifications.

---

## 1. Account-Bound Daily Junk Sink System

> [!TIP]  
> High-velocity money sink offering daily random utility items that are account-bound and quantity-limited to prevent inflation without breaking the trade economy.

| Feature | Design Specification |
|:---|:---|
| **Daily Junk Trader** | Appears once per day per account |
| **Random Stock** | Offers 3–5 random "junk" utility items at high Zeny costs |
| **Account-Bound** | Items cannot be traded or vendored; strictly self-use |
| **Limited Purchase** | Hard limit of 10 items purchased per day per account |
| **Soft Money Sinks** | Intentionally overpriced to act as a permanent Zeny drain |

### Daily Junk Sink Offerings
| Item Name | Zeny Cost | Utility Effect |
|:---|:---|:---|
| **Mystery Potion** | 50,000z | Randomized stat buff for 30 minutes |
| **Lucky Charm** | 100,000z | +5% loot drop bonus for 1 hour |
| **Repair Kit** | 25,000z | Repair broken weapon/armor anywhere in the field |
| **Warp Scroll** | 10,000z | Single-use warp to any unlocked regional town |
| **Cosmetic Dye** | 200,000z | Temporary 24-hour outfit color shift |

### Passive Soft Money Sinks
- **Kafra Storage:** 50z per storage access.
- **Card Extraction Service:** 100,000z base + 5% market fee for safe card removal.
- **Progressive Refinement Fees:** Scaling fees (+7 = 50k, +10 = 500k Zeny).

---

## 2. Investment Bank & Unified Brokerage Account (Ponytail Model)

> [!NOTE]  
> **Kafra Bank** = 100% safe storage (0% fee, 0% interest, in-game accessible).  
> **Unified Brokerage / Investment Bank** = Zero-risk capital preservation & downtime reward vehicle (0.1% deposit fee, continuous on-the-fly interest accrual with tiered diminishing curve, accessible via Prontera NPC and Web Terminal).

### Core Mental Model & Risk Spectrum
The Solo-Centric economy features a 3-tier liquidity and risk triangle:
1. **Cash in Pocket / Kafra Bank:** 100% liquid, 0% yield, immediate utility for daily supplies.
2. **Investment Bank (Fixed Income / Sovereign Treasury):** Zero principal risk, continuous time-based accrual, baseline inflation hedge for idle cash during downtime/breaks.
3. **Midgard Stock Exchange (Equities / Risk Assets):** 10-minute shift cycles, market volatility, capital appreciation, and compounding dividend yields (DRIP).

---

### Yield & Diminishing Return Pacing (Continuous Accrual)
Interest is calculated **continuously on-the-fly** based on elapsed seconds (`now - deposit_time`) without arbitrary 24-hour cliff freezes or background cron mutations:

$$\text{Interest} = \frac{\text{Principal} \times \text{Elapsed Seconds} \times \text{Rate}}{86400}$$

#### Tiered Diminishing Return Curve:
- **Deposit Fee:** **0.1%** (Breakeven on Day 1).
- **Tier 1 (Days 1–14):** **0.25% / day** *(Early boost for active/weekly check-ins; +3.5% in 2 weeks)*
- **Tier 2 (Days 15–60):** **0.08% / day** *(Smooth sustained return for 1–2 month breaks; +7.08% total at Day 60)*
- **Tier 3 (Days 61–180):** **0.03% / day** *(Stable mid-term capital preservation; +10.68% total at 6 months)*
- **Tier 4 (Days 181+):** **0.01% / day** *(Long-term anti-inflation baseline; +12.53% total at 1 Year)*

---

### Dual-Access Brokerage Architecture (In-Game & Web Terminal)
Like the Stock Market (`solo_stock_player`), the Bank operates with full parity across game and web:

```
                       ┌──────────────────────────────────────────────────┐
                       │           Unified Brokerage Architecture         │
                       └────────────────────────┬─────────────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
   ┌───────────────────────────┐                                 ┌───────────────────────────┐
   │        IN-GAME NPC        │                                 │     WEB PORTAL TERMINAL   │
   │ (Prontera Banker/Broker)  │                                 │   (Browser / Mobile View) │
   └─────────────┬─────────────┘                                 └─────────────┬─────────────┘
                 │                                                             │
                 │ 1. Uses query_sql                                           │ 1. Uses primaryExecute (3306)
                 │ 2. Transfers Zeny directly                                  │ 2. Guards with char.online === 0
                 │    to/from inventory                                        │ 3. Instant buy/sell/deposit
                 │                                                             │
                 └──────────────────────────────┬──────────────────────────────┘
                                                ▼
                               ┌─────────────────────────────────┐
                               │       MariaDB Primary (3306)    │
                               │  - solo_stock_player (Stocks)   │
                               │  - solo_bank_account (Cash)     │
                               └─────────────────────────────────┘
```

#### SQL Schema (`sql-files/custom/solo_bank_account.sql`):
```sql
CREATE TABLE IF NOT EXISTS `solo_bank_account` (
    `account_id` INT UNSIGNED NOT NULL PRIMARY KEY,
    `principal` BIGINT NOT NULL DEFAULT 0,
    `deposit_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `interest_paid_total` BIGINT NOT NULL DEFAULT 0,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_account_id` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### Script Implementation (Integer-Safe On-The-Fly Math)
```c
prontera,165,180,4	script	Investment Banker	4_M_BARBER,{
    mes "[Investment Bank]";
    mes "Welcome to the Midgard Sovereign Bank.";
    mes "Deposit fee: ^FF00000.1%^000000";
    mes "Interest: Continuous tiered yield (Up to 3.5% / 2 weeks).";
    next;

    // Load account balance from solo_bank_account
    .@account_id = getcharid(3);
    .@balance = 0;
    .@deposit_time = 0;
    query_sql("SELECT `principal`, `deposit_time` FROM `solo_bank_account` WHERE `account_id` = " + .@account_id, .@balance, .@deposit_time);

    // Calculate elapsed time and continuous tiered interest
    .@interest = 0;
    .@elapsed_sec = 0;
    .@days = 0;

    if (.@balance > 0 && .@deposit_time > 0) {
        .@elapsed_sec = gettimetick(2) - .@deposit_time;
        if (.@elapsed_sec > 0) {
            .@days = .@elapsed_sec / 86400;
            .@bps = 0; // Basis points (10000 bps = 100%)

            if (.@days <= 14) {
                .@bps = .@days * 25; // 0.25%/day
            } else if (.@days <= 60) {
                .@bps = (14 * 25) + ((.@days - 14) * 8); // 0.08%/day
            } else if (.@days <= 180) {
                .@bps = (14 * 25) + (46 * 8) + ((.@days - 60) * 3); // 0.03%/day
            } else {
                .@bps = (14 * 25) + (46 * 8) + (120 * 3) + ((.@days - 180) * 1); // 0.01%/day
            }

            .@interest = (.@balance * .@bps) / 10000;
        }
    }

    mes "[Investment Bank]";
    mes "Current Principal: ^0000FF" + F_InsertComma(.@balance) + " Zeny^000000";
    mes "Accrued Interest: ^00FF00" + F_InsertComma(.@interest) + " Zeny^000000";
    mes "Total Accessible: ^0000FF" + F_InsertComma(.@balance + .@interest) + " Zeny^000000";
    next;

    switch(select("Deposit Zeny:Withdraw All:Cancel")) {
    case 1:  // Deposit
        mes "Enter amount to deposit (Fee: 0.1%):";
        input .@amount;
        if (.@amount < 1000 || Zeny < .@amount) { mes "Invalid amount or insufficient Zeny."; close; }
        if (.@balance + .@interest + .@amount > 1900000000) { mes "Exceeds 1.9B Zeny bank ceiling."; close; }

        .@fee = max(1, .@amount / 1000); // 0.1% fee
        .@net_deposit = .@amount - .@fee;

        Zeny -= .@amount;
        .@new_principal = .@balance + .@interest + .@net_deposit;
        .@now = gettimetick(2);

        query_sql("INSERT INTO `solo_bank_account` (`account_id`, `principal`, `deposit_time`) VALUES (" + .@account_id + ", " + .@new_principal + ", " + .@now + ") ON DUPLICATE KEY UPDATE `principal` = " + .@new_principal + ", `deposit_time` = " + .@now);

        mes "Deposited " + F_InsertComma(.@amount) + "z (Fee: " + F_InsertComma(.@fee) + "z).";
        mes "New Principal: ^0000FF" + F_InsertComma(.@new_principal) + "z^000000.";
        break;

    case 2:  // Withdraw All
        if (.@balance <= 0) { mes "No active investment balance."; close; }
        .@payout = .@balance + .@interest;
        if (2100000000 - Zeny < .@payout) { mes "Cannot hold that much Zeny in inventory."; close; }

        Zeny += .@payout;
        query_sql("UPDATE `solo_bank_account` SET `principal` = 0, `deposit_time` = 0, `interest_paid_total` = `interest_paid_total` + " + .@interest + " WHERE `account_id` = " + .@account_id);

        mes "Withdrew " + F_InsertComma(.@payout) + "z (including " + F_InsertComma(.@interest) + "z interest).";
        break;
    }
    close;
}
```

---

## 3. Stock Momentum & Market Dynamics

### Market Algorithms & Trend Counters
Stocks in the Midgard Stock Exchange operate under algorithmic momentum where prices trend based on historical activity and cyclical sentiment:

```c
// Momentum trend counter
if ($STEEL_PRICE > $STEEL_PREV_PRICE)
    $STEEL_TREND++;  // Uptrend counter
else if ($STEEL_PRICE < $STEEL_PREV_PRICE)
    $STEEL_TREND--;  // Downtrend counter
else
    $STEEL_TREND = $STEEL_TREND * 90 / 100;  // Mean reversion decay

// Momentum bias calculation
if ($STEEL_TREND >= 3)
    .@momentum = rand(5, 15);    // Bullish bias (+5% to +15%)
else if ($STEEL_TREND <= -3)
    .@momentum = rand(-15, -5);  // Bearish bias (-5% to -15%)
else
    .@momentum = rand(-10, 10);  // Neutral random walk
```

### Stock Archetypes
| Archetype | Price Dynamics | Dividend Payout | Strategic Horizon |
|:---|:---|:---|:---|
| **Growth Stocks** | High volatility (\(\pm 15\%\)), momentum shifts | Zero / low dividend | Swing trading & capital gains |
| **Dividend Stocks** | Low volatility (\(\pm 3\%\)), defensive | Regular cash/DRIP payouts | Long-term passive income |

> **Dividend Tax:** A 30% tax is levied on all dividend cash payouts, ensuring passive income acts as an overall net Zeny sink.

---

## 4. Bill Notes (Decaying Store of Value)

> [!NOTE]  
> Bill Notes represent high-denomination paper bearer notes with built-in daily decay down to a 10% floor. (Replaced in late-game by non-decaying **17-Carat Diamonds** @ 500M Zeny).

| Note Type | Purchase Price | Daily Decay Rate | Floor Value |
|:---|:---|:---|:---|
| **Silver Note** | 100,000z | 5% / day | 10,000z (10%) |
| **Gold Note** | 1,000,000z | 3% / day | 100,000z (10%) |
| **Platinum Note** | 10,000,000z | 1% / day | 1,000,000z (10%) |

### SQL Table & FIFO Liquidation
```sql
CREATE TABLE note_batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    note_type VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    purchase_time INT NOT NULL,
    INDEX (account_id, note_type)
);
```

---

## 5. Item Gacha System (Drop Currency)

A non-pay-to-win gambling system using items dropped from monsters:

| Step | Mechanism |
|:---|:---|
| **1. Collect** | Farm "Gacha Tokens" dropping from all monsters at a 5% rate |
| **2. Deposit** | Insert 10 Gacha Tokens per spin at any town Gacha Machine NPC |
| **3. Distribution** | Weighted RNG roll across rarity tiers |

### Weighted Prize Pool
| Rarity | Probability Weight | Rewards Included |
|:---|:---|:---|
| **Common** | 60.0% | Consumables, crafting ores, arrows, foods |
| **Uncommon** | 25.0% | 30-min buff scrolls, premium pet food |
| **Rare** | 12.0% | Costume dyes, personal housing decor |
| **Epic** | 2.9% | Rare pet eggs, Old Card Albums |
| **Legendary** | 0.1% | Pinnacle costume headgear, server title tokens |

---

## 6. Trade Quota System

Controlled high-value items (such as Elunium and Oridecon) are tradeable but subject to an account-wide daily sale quota through NPC Trade Posts to protect the solo economy from market flooding:

```c
prontera,160,180,4	script	Controlled Trade Post	4_F_KAFRA1,{
    mes "[Trade Officer]";
    mes "Daily controlled trade quota: 10 units per account.";
    next;
    
    // Check account daily quota
    if (#elunium_sold_today >= 10) {
        mes "You have reached your daily quota for Elunium.";
        close;
    }
    if (countitem(985) < 1) { mes "You have no Elunium to trade."; close; }
    
    .@remaining = 10 - #elunium_sold_today;
    mes "How many to sell? (Max: " + .@remaining + ")";
    input .@amount;
    if (.@amount <= 0) close;
    .@amount = min(.@amount, min(countitem(985), .@remaining));
    
    delitem 985, .@amount;
    .@payout = .@amount * 50000;
    Zeny += .@payout;
    #elunium_sold_today += .@amount;
    
    mes "Sold " + .@amount + " Elunium for " + .@payout + "z.";
    close;
}
```
