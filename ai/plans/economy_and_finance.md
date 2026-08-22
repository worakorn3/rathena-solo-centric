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

## 2. Investment Bank (Separate from Kafra)

> [!NOTE]  
> **Kafra Bank** = 100% safe storage (0% fee, 0% interest).  
> **Investment Bank** = Risk/growth vehicle (2% deposit fee, 1%/day simple interest, 10% hard cap).

### Breakeven Analysis
| Day | Deposit (100k) | Post-Fee Balance | Daily Interest (1%) | Total Accessible Balance |
|:---|:---|:---|:---|:---|
| **0** | 100,000z | 98,000z | 0z | 98,000z |
| **1** | — | — | +980z | 98,980z |
| **2** | — | — | +990z | 99,970z |
| **3** | — | — | +1,000z | **100,970z** ✅ (Breakeven) |
| **10** | — | — | +9,800z | **107,800z** (Max 10% Cap) |

### Script Implementation
```c
prontera,165,180,4	script	Investment Banker	4_M_BARBER,{
    mes "[Investment Bank]";
    mes "Deposit fee: 2%";
    mes "Interest: 1% per day (max 10% after 10 days)";
    mes "Current principal: " + #INVEST_BALANCE + "z";
    next;
    
    switch(select("Deposit:Withdraw:Cancel")) {
    case 1:  // Deposit
        mes "Enter amount to deposit:";
        input .@amount;
        if (.@amount <= 0 || Zeny < .@amount) { mes "Invalid amount or insufficient Zeny."; close; }
        .@fee = .@amount * 2 / 100;
        Zeny -= .@amount;
        #INVEST_BALANCE += (.@amount - .@fee);
        #INVEST_TIME = gettimetick(2);
        mes "Deposited " + (.@amount - .@fee) + "z after 2% fee.";
        break;
        
    case 2:  // Withdraw
        if (#INVEST_BALANCE <= 0) { mes "No active investment balance."; close; }
        .@days = min(10, (gettimetick(2) - #INVEST_TIME) / 86400);
        .@interest = #INVEST_BALANCE * .@days / 100;
        .@total = #INVEST_BALANCE + .@interest;
        #INVEST_BALANCE = 0;
        #INVEST_TIME = 0;
        Zeny += .@total;
        mes "Withdrew " + .@total + "z (including " + .@interest + "z interest).";
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
