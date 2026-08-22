import { primaryQuery, primaryExecute } from "../db/pool";

export class MarketSimulationService {
  /**
   * Process Hourly Price Shifts
   */
  static async processHourlyShift() {
    console.log("[MarketSimulation] Running hourly shift...");
    let marketMood = 0;
    let marketDrift = 0;

    const moodRows = await primaryQuery("SELECT mval FROM `solo_stock_meta` WHERE mkey = 'MarketMood'");
    if (moodRows.length > 0) marketMood = moodRows[0].mval;

    // Random drift between -4 and 4
    marketDrift = Math.floor(Math.random() * 9) - 4;
    await primaryExecute("UPDATE `solo_stock_meta` SET mval = ? WHERE mkey = 'MarketDrift'", [marketDrift]);

    // Fetch active event overrides mapped by ticker (Ponytail: YAGNI on new tables, reuse existing schema)
    const activeMoodRows = await primaryQuery(
      "SELECT ticker, mood_override FROM `solo_stock_events_active` WHERE mood_override > 0 AND remaining_shifts > 0"
    );
    const tickerMoods = new Map(activeMoodRows.map((r: any) => [r.ticker, r.mood_override]));

    // Ponytail: Query all active stock tickers dynamically from DB
    const stockRows = await primaryQuery(
      "SELECT ticker, price, dividend, split_count, beta FROM `solo_stock_market` WHERE enabled = 1 ORDER BY ticker ASC"
    );

    let upCount = 0;

    for (const stock of stockRows) {
      const city = stock.ticker;
      const price = Number(stock.price) || 0;
      const beta = Number(stock.beta) || 1.0;

      // Ponytail: Use specific ticker mood if lore event active, otherwise global 'ALL' override or marketMood
      let localMood = tickerMoods.get(city) || tickerMoods.get("ALL") || marketMood;

      let f = marketDrift + (Math.floor(Math.random() * 13) - 6); // rand(-6, 6)
      if (localMood === 1) f += 2;
      else if (localMood === 2) f -= 2;
      else if (localMood === 3) f += (Math.floor(Math.random() * 36) - 15); // rand(-15, 20)

      // Apply beta volatility multiplier
      f = Math.round(f * beta);

      let newPrice = price + Math.floor(price * f / 100);
      if (newPrice < 50) newPrice = 50;

      if (newPrice >= 1000) {
        newPrice = Math.floor(newPrice / 10);
        await primaryExecute(
          "UPDATE `solo_stock_market` SET price = ?, price_old = price_old / 10, dividend = dividend / 10, split_count = split_count + 1 WHERE ticker = ?",
          [newPrice, city]
        );
        await primaryExecute("UPDATE `solo_stock_player` SET shares = shares * 10 WHERE ticker = ?", [city]);
        console.log(`[MarketSimulation] Stock Split for ${city}!`);
      } else {
        await primaryExecute("UPDATE `solo_stock_market` SET price = ? WHERE ticker = ?", [newPrice, city]);
      }

      if (newPrice > price) upCount++;
    }

    if (tickerMoods.size === 0) {
      const rand = Math.floor(Math.random() * 100) + 1;
      if (rand <= 8) marketMood = 3;
      else if (upCount >= Math.ceil(stockRows.length / 2)) marketMood = 1;
      else marketMood = 2;
    }

    await primaryExecute("UPDATE `solo_stock_events_active` SET remaining_shifts = remaining_shifts - 1 WHERE remaining_shifts > 0");
    await primaryExecute("DELETE FROM `solo_stock_events_active` WHERE remaining_shifts <= 0");

    const activeTaxRows = await primaryQuery("SELECT tax_rate_override FROM `solo_stock_events_active` WHERE tax_rate_override >= 0 LIMIT 1");
    if (activeTaxRows.length === 0) {
      await primaryExecute("UPDATE `solo_stock_meta` SET mval = 10 WHERE mkey = 'DivTaxRate' AND mval = 0");
    }

    await primaryExecute("UPDATE `solo_stock_meta` SET mval = ? WHERE mkey = 'MarketMood'", [marketMood]);
    console.log("[MarketSimulation] Hourly shift complete.");
  }

  /**
   * Process Midnight DRIP and Dividends
   */
  static async processMidnightDrip() {
    console.log("[MarketSimulation] Running midnight processing...");
    
    // Ponytail: Atomic price_old rollover for all tickers in 1 single SQL query
    await primaryExecute("UPDATE `solo_stock_market` SET price_old = price");

    const bscRows = await primaryQuery("SELECT mval FROM `solo_stock_meta` WHERE mkey = 'BlackSwanChance'");
    const bsc = bscRows.length > 0 ? bscRows[0].mval : 2;
    if (Math.floor(Math.random() * 100) + 1 <= bsc) {
      await this.processBlackSwan();
    }

    let marketMood = 0;
    const moodRows = await primaryQuery("SELECT mval FROM `solo_stock_meta` WHERE mkey = 'MarketMood'");
    if (moodRows.length > 0) marketMood = moodRows[0].mval;

    // Ponytail: Query all active tickers with their individual target yield
    const stockRows = await primaryQuery(
      "SELECT ticker, price, dividend, div_acc, target_yield_bps FROM `solo_stock_market` WHERE enabled = 1 ORDER BY ticker ASC"
    );

    for (const stock of stockRows) {
      const city = stock.ticker;
      let price = Number(stock.price) || 0;
      let dividend = Number(stock.dividend) || 0;
      const targetBps = Number(stock.target_yield_bps) ?? 50;

      let target = targetBps === 0 ? 0 : Math.max(1, Math.round((price * targetBps) / 1000));

      if (Math.floor(Math.random() * 100) + 1 <= 30) {
        if (dividend < target && marketMood !== 2) dividend += 1;
        else if (dividend > target && marketMood !== 1) dividend -= 1;
      }

      if (marketMood === 3) dividend = 0;
      else if (dividend < 0) dividend = 0;
      if (dividend > 500) dividend = 500;

      await primaryExecute("UPDATE `solo_stock_market` SET dividend = ?, div_acc = div_acc + ? WHERE ticker = ?", [dividend, dividend, city]);
      await primaryExecute("UPDATE `solo_stock_player` SET pending_div = pending_div + (shares * ?) WHERE ticker = ? AND shares > 0", [dividend, city]);

      const dripUsers = await primaryQuery(
        "SELECT account_id, shares, total_cost, drip_carryover, pending_div FROM `solo_stock_player` WHERE ticker = ? AND drip_enabled = 1 AND shares > 0",
        [city]
      );
      
      for (const u of dripUsers) {
        const payout = Number(u.pending_div) + Number(u.drip_carryover);
        if (payout >= price && price > 0) {
          const newShares = Math.floor(payout / price);
          const cost = newShares * price;
          const newCarry = payout % price;
          await primaryExecute(
            "UPDATE `solo_stock_player` SET shares = shares + ?, total_cost = total_cost + ?, pending_div = 0, drip_carryover = ? WHERE account_id = ? AND ticker = ?",
            [newShares, cost, newCarry, u.account_id, city]
          );
        } else {
          await primaryExecute(
            "UPDATE `solo_stock_player` SET pending_div = 0, drip_carryover = ? WHERE account_id = ? AND ticker = ?",
            [payout, u.account_id, city]
          );
        }
      }
    }
    
    await primaryExecute("UPDATE `solo_stock_meta` SET mval = ? WHERE mkey = 'LastUpdate'", [Math.floor(Date.now() / 1000)]);
    console.log("[MarketSimulation] Midnight processing complete.");
  }

  static async catchUpOfflineDividends(): Promise<number> {
    const rows = await primaryQuery("SELECT mval FROM `solo_stock_meta` WHERE mkey = 'LastUpdate'");
    if (rows.length === 0) return 0;
    const lastUpdate = Number(rows[0].mval) || 0;
    if (lastUpdate <= 0) return 0;

    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - lastUpdate;
    const CYCLE_SECONDS = 4 * 3600; // 4 hours = 14400s

    if (elapsed < CYCLE_SECONDS) {
      return 0;
    }

    const missedCycles = Math.min(Math.floor(elapsed / CYCLE_SECONDS), 42); // capped at 7 days (42 cycles)
    console.log(
      `[MarketSimulation] Server was offline for ${Math.floor(elapsed / 3600)}h. Catching up ${missedCycles} missed dividend cycle(s)...`
    );

    for (let i = 0; i < missedCycles; i++) {
      await MarketSimulationService.processMidnightDrip();
    }

    console.log(`[MarketSimulation] Offline dividend catch-up complete.`);
    return missedCycles;
  }

  static async processBlackSwan() {
    console.log("[MarketSimulation] Checking and triggering Black Swan event...");

    // 1. Query active enabled tickers (rolling unlock safety)
    const enabledRows = await primaryQuery("SELECT ticker, price FROM `solo_stock_market` WHERE enabled = 1");
    if (enabledRows.length === 0) return;
    const enabledTickers = enabledRows.map((r: any) => r.ticker);
    const enabledSet = new Set(enabledTickers);

    // 2. Fetch all enabled candidate events and filter for active cities
    const candidateEvents = await primaryQuery(
      "SELECT * FROM `solo_stock_events_def` WHERE enabled = 1"
    );

    const validEvents = candidateEvents.filter((e: any) => {
      const primaryList = (e.ticker_target || "").split(",").map((s: string) => s.trim()).filter(Boolean);
      const isPrimaryValid = primaryList.every((t: string) => t === "ALL" || t === "LOWEST" || enabledSet.has(t));
      if (!isPrimaryValid) return false;

      const secondaryList = (e.ticker_secondary || "").split(",").map((s: string) => s.trim()).filter(Boolean);
      return secondaryList.every((t: string) => t === "ALL" || enabledSet.has(t));
    });

    if (validEvents.length === 0) return;

    // Weighted random selection
    const totalWeight = validEvents.reduce((sum: number, ev: any) => sum + (Number(ev.weight) || 10), 0);
    let randomWeight = Math.floor(Math.random() * totalWeight);
    let ev = validEvents[0];
    for (const candidate of validEvents) {
      const w = Number(candidate.weight) || 10;
      if (randomWeight < w) {
        ev = candidate;
        break;
      }
      randomWeight -= w;
    }

    console.log(`[MarketSimulation] Black Swan Event: [${ev.event_id}] ${ev.event_name}`);

    // 3. Resolve primary target tickers
    let targetTickers: string[] = [];
    if (ev.ticker_target === "ALL") {
      targetTickers = enabledTickers;
    } else if (ev.ticker_target === "LOWEST") {
      const sorted = [...enabledRows].sort((a: any, b: any) => Number(a.price) - Number(b.price));
      targetTickers = sorted.length > 0 ? [sorted[0].ticker] : [];
    } else {
      targetTickers = ev.ticker_target.split(",").map((s: string) => s.trim()).filter((t: string) => enabledSet.has(t));
    }

    // 4. Apply primary price, dividend, and direct windfall shifts
    for (const t of targetTickers) {
      const pricePct = Number(ev.price_pct_change) || 0;
      const divChange = Number(ev.dividend_change) || 0;
      const directPayout = Number(ev.direct_payout_per_share) || 0;
      const revSplit = Number(ev.reverse_split_ratio) || 0;

      if (pricePct !== 0) {
        await primaryExecute(
          "UPDATE `solo_stock_market` SET price = GREATEST(50, ROUND(price * (1 + ? / 100))) WHERE ticker = ?",
          [pricePct, t]
        );
      }
      if (divChange !== 0) {
        await primaryExecute(
          "UPDATE `solo_stock_market` SET dividend = GREATEST(0, dividend + ?) WHERE ticker = ?",
          [divChange, t]
        );
      }
      if (directPayout > 0) {
        await primaryExecute(
          "UPDATE `solo_stock_player` SET pending_div = pending_div + (shares * ?) WHERE ticker = ? AND shares > 0",
          [directPayout, t]
        );
      }
      if (revSplit > 1) {
        await primaryExecute(
          "UPDATE `solo_stock_market` SET price = price * ?, dividend = dividend * ? WHERE ticker = ?",
          [revSplit, revSplit, t]
        );
        await primaryExecute(
          "UPDATE `solo_stock_player` SET shares = FLOOR(shares / ?) WHERE ticker = ?",
          [revSplit, t]
        );
      }
    }

    // 5. Apply secondary ticker shift
    if (ev.ticker_secondary) {
      const secPricePct = Number(ev.price_secondary_pct_change) || 0;
      if (secPricePct !== 0) {
        let secondaryTickers: string[] = [];
        if (ev.ticker_secondary === "ALL") {
          secondaryTickers = enabledTickers.filter(t => !targetTickers.includes(t));
        } else {
          secondaryTickers = ev.ticker_secondary.split(",").map((s: string) => s.trim()).filter((t: string) => enabledSet.has(t));
        }

        for (const secTicker of secondaryTickers) {
          await primaryExecute(
            "UPDATE `solo_stock_market` SET price = GREATEST(50, ROUND(price * (1 + ? / 100))) WHERE ticker = ?",
            [secPricePct, secTicker]
          );
        }
      }
    }

    // 6. Tax Rate & Mood Overrides
    if (Number(ev.tax_rate_override) >= 0) {
      await primaryExecute("UPDATE `solo_stock_meta` SET mval = ? WHERE mkey = 'DivTaxRate'", [ev.tax_rate_override]);
    }
    if (Number(ev.mood_override) > 0 && Number(ev.duration_shifts) <= 0) {
      await primaryExecute("UPDATE `solo_stock_meta` SET mval = ? WHERE mkey = 'MarketMood'", [ev.mood_override]);
    }

    // 7. Active Event & Audit Log
    const duration = Number(ev.duration_shifts) || 0;
    const now = Math.floor(Date.now() / 1000);
    if (duration > 0) {
      const targetDisplay = targetTickers.length === 1 ? targetTickers[0] : (ev.ticker_target || "ALL");
      await primaryExecute(
        "INSERT INTO `solo_stock_events_active` (event_id, ticker, start_time, end_time, remaining_shifts, tax_rate_override, mood_override, headline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [ev.event_id, targetDisplay, now, now + duration * 3600, duration, ev.tax_rate_override ?? -1, ev.mood_override ?? 0, ev.headline]
      );
    }

    await primaryExecute(
      "INSERT INTO `solo_stock_events_log` (event_id, event_name, category, ticker_target, headline, details, triggered_by) VALUES (?, ?, ?, ?, ?, ?, 'MIDNIGHT_CRON')",
      [ev.event_id, ev.event_name, ev.category, ev.ticker_target, ev.headline, ev.description || ""]
    );
    await primaryExecute("UPDATE `solo_stock_meta` SET mval = ? WHERE mkey = 'LatestEventTime'", [now]);
  }
}
