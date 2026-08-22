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

      // Ponytail: Use specific ticker mood if lore event active, otherwise global marketMood
      let localMood = tickerMoods.get(city) || marketMood;

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

      let target = Math.floor((price * targetBps) / 10000);
      if (target < 0) target = 0;

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

  static async processBlackSwan() {
    console.log("[MarketSimulation] Triggering Black Swan...");
    // Minimal ponytail implementation
  }
}
