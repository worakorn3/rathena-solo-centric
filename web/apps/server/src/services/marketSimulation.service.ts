import { primaryQuery, primaryExecute } from "../db/pool";

export const MARKET_SHIFT_INTERVAL_SEC = 600;

export class MarketSimulationService {
  /**
   * Process Hourly Price Shifts
   */
  static async processHourlyShift() {
    console.log("[MarketSimulation] Running hourly shift...");
    let equitiesMood = 0;
    let equitiesDrift = 0;
    let cryptoMood = 0;
    let cryptoDrift = 0;

    const CRYPTO_TICKERS = new Set(["EMP", "YMI", "WRP", "SHD", "ZEX", "ORA", "POR", "NZN", "ALM", "KFX"]);
    const isCrypto = (ticker: string, sector?: string): boolean => {
      if (CRYPTO_TICKERS.has(ticker.toUpperCase().trim())) return true;
      if (sector && (sector.toLowerCase().includes("protocol") || sector.toLowerCase().includes("defi"))) return true;
      return false;
    };

    const moodRows = await primaryQuery(
      "SELECT mkey, mval FROM `solo_stock_meta` WHERE mkey IN ('MarketMood', 'CryptoMood')"
    );
    for (const r of moodRows) {
      if (r.mkey === "MarketMood") equitiesMood = Number(r.mval) || 0;
      if (r.mkey === "CryptoMood") cryptoMood = Number(r.mval) || 0;
    }

    // Decoupled Random Drifts:
    // Municipal Equities: Drift between -4 and 4
    equitiesDrift = Math.floor(Math.random() * 9) - 4;
    // Crypto Protocols: High-volatility drift between -7 and 7
    cryptoDrift = Math.floor(Math.random() * 15) - 7;

    await primaryExecute("UPDATE `solo_stock_meta` SET mval = ? WHERE mkey = 'MarketDrift'", [equitiesDrift]);
    await primaryExecute(
      "INSERT INTO `solo_stock_meta` (mkey, mval) VALUES ('CryptoDrift', ?) ON DUPLICATE KEY UPDATE mval = ?",
      [cryptoDrift, cryptoDrift]
    );

    // Fetch active event overrides mapped by ticker
    const activeMoodRows = await primaryQuery(
      "SELECT ticker, mood_override FROM `solo_stock_events_active` WHERE mood_override > 0 AND remaining_shifts > 0"
    );
    const tickerMoods = new Map(activeMoodRows.map((r: any) => [r.ticker, r.mood_override]));

    // Query all active stock tickers dynamically from DB
    const stockRows = await primaryQuery(
      "SELECT ticker, sector, price, dividend, split_count, beta, target_yield_bps FROM `solo_stock_market` WHERE enabled = 1 ORDER BY ticker ASC"
    );

    let equitiesUpCount = 0;
    let equitiesTotalCount = 0;
    let cryptoUpCount = 0;
    let cryptoTotalCount = 0;
    const candlesToInsert: { ticker: string; open: number; high: number; low: number; close: number; volume: number }[] = [];

    for (const stock of stockRows) {
      const city = stock.ticker;
      const price = Number(stock.price) || 0;
      const beta = Number(stock.beta) || 1.0;
      const cryptoAsset = isCrypto(city, stock.sector);

      // Decoupled Local Mood & Drift
      let localMood = tickerMoods.get(city);
      let f = 0;

      if (cryptoAsset) {
        cryptoTotalCount++;
        if (!localMood) {
          localMood = tickerMoods.get("CRYPTO") || tickerMoods.get("ALL") || cryptoMood;
        }

        f = cryptoDrift + (Math.floor(Math.random() * 17) - 8); // rand(-8, 8)
        if (localMood === 1) f += 3; // Bullish
        else if (localMood === 2) f -= 3; // Bearish
        else if (localMood === 3) f += (Math.floor(Math.random() * 61) - 25); // Euphoria/Chaos: rand(-25, 35)
      } else {
        equitiesTotalCount++;
        if (!localMood) {
          localMood = tickerMoods.get("EQUITIES") || tickerMoods.get("ALL") || equitiesMood;
        }

        f = equitiesDrift + (Math.floor(Math.random() * 13) - 6); // rand(-6, 6)
        if (localMood === 1) f += 2; // Bullish
        else if (localMood === 2) f -= 2; // Bearish
        else if (localMood === 3) f += (Math.floor(Math.random() * 36) - 15); // Chaos: rand(-15, 20)
      }

      // Apply beta volatility multiplier
      f = Math.round(f * beta);

      let newPrice = price + Math.floor(price * f / 100);
      if (newPrice < 50) newPrice = 50;

      if (newPrice >= 1000) {
        newPrice = Math.floor(newPrice / 10);
        const targetBps = Number(stock.target_yield_bps) || 0;
        const postSplitDiv = targetBps === 0 ? 0 : Math.max(1, Math.round((newPrice * targetBps) / 1000));
        await primaryExecute(
          "UPDATE `solo_stock_market` SET price = ?, price_old = price_old / 10, dividend = ?, split_count = split_count + 1 WHERE ticker = ?",
          [newPrice, postSplitDiv, city]
        );
        await primaryExecute("UPDATE `solo_stock_player` SET shares = shares * 10 WHERE ticker = ?", [city]);
        console.log(`[MarketSimulation] Stock Split for ${city}!`);
      } else {
        await primaryExecute("UPDATE `solo_stock_market` SET price = ? WHERE ticker = ?", [newPrice, city]);
      }

      if (newPrice > price) {
        if (cryptoAsset) cryptoUpCount++;
        else equitiesUpCount++;
      }

      // Compute OHLC candle wicks
      const wickSpread = Math.max(1, Math.round(newPrice * 0.008));
      const open = price;
      const close = newPrice;
      const high = Math.max(open, close) + Math.floor(Math.random() * wickSpread);
      const low = Math.max(1, Math.min(open, close) - Math.floor(Math.random() * wickSpread));
      const volume = Math.floor(Math.random() * 120) + 10;
      candlesToInsert.push({ ticker: city, open, high, low, close, volume });
    }

    // Atomic multi-row batch insert of 10-minute snapshot in 1 single SQL query
    if (candlesToInsert.length > 0) {
      const placeholders = candlesToInsert.map(() => "(?, ?, ?, ?, ?, ?, NOW())").join(", ");
      const params = candlesToInsert.flatMap((c) => [c.ticker, c.open, c.high, c.low, c.close, c.volume]);
      await primaryExecute(
        `INSERT INTO \`solo_stock_history\` (\`ticker\`, \`open_price\`, \`high_price\`, \`low_price\`, \`close_price\`, \`volume\`, \`timestamp\`) VALUES ${placeholders}`,
        params
      );
    }

    // Independent next-shift mood calculations:
    // 1. Municipal Equities Mood
    if (!tickerMoods.has("EQUITIES") && !tickerMoods.has("ALL")) {
      const randEquities = Math.floor(Math.random() * 100) + 1;
      if (randEquities <= 8) equitiesMood = 3; // 8% Chaos
      else if (equitiesUpCount >= Math.ceil(equitiesTotalCount / 2)) equitiesMood = 1; // Bullish
      else equitiesMood = 2; // Bearish
    }

    // 2. Crypto Protocols Mood
    if (!tickerMoods.has("CRYPTO") && !tickerMoods.has("ALL")) {
      const randCrypto = Math.floor(Math.random() * 100) + 1;
      if (randCrypto <= 20) cryptoMood = 3; // 20% Euphoric Mania / High Chaos
      else if (cryptoUpCount >= Math.ceil(cryptoTotalCount / 2)) cryptoMood = 1; // Bullish
      else cryptoMood = 2; // Bearish
    }

    await primaryExecute("UPDATE `solo_stock_events_active` SET remaining_shifts = remaining_shifts - 1 WHERE remaining_shifts > 0");
    await primaryExecute("DELETE FROM `solo_stock_events_active` WHERE remaining_shifts <= 0");

    const activeTaxRows = await primaryQuery("SELECT tax_rate_override FROM `solo_stock_events_active` WHERE tax_rate_override >= 0 LIMIT 1");
    if (activeTaxRows.length === 0) {
      await primaryExecute("UPDATE `solo_stock_meta` SET mval = 10 WHERE mkey = 'DivTaxRate' AND mval = 0");
    }

    await primaryExecute("UPDATE `solo_stock_meta` SET mval = ? WHERE mkey = 'MarketMood'", [equitiesMood]);
    await primaryExecute(
      "INSERT INTO `solo_stock_meta` (mkey, mval) VALUES ('CryptoMood', ?) ON DUPLICATE KEY UPDATE mval = ?",
      [cryptoMood, cryptoMood]
    );
    await primaryExecute(
      "INSERT INTO `solo_stock_meta` (mkey, mval) VALUES ('LastShiftTime', ?) ON DUPLICATE KEY UPDATE mval = ?",
      [Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000)]
    );
    console.log(`[MarketSimulation] Hourly shift complete. Equities Mood: ${equitiesMood}, Crypto Mood: ${cryptoMood}`);
  }

  /**
   * Process Midnight DRIP and Dividends
   */
  static async processMidnightDrip() {
    console.log("[MarketSimulation] Running midnight processing...");
    
    // Ponytail: Atomic price_old rollover for all tickers in 1 single SQL query
    await primaryExecute("UPDATE `solo_stock_market` SET price_old = price");

    // Option 2: Downsample and rollup completed days into solo_stock_history_daily
    try {
      await primaryExecute(`
        INSERT INTO \`solo_stock_history_daily\` (\`ticker\`, \`open_price\`, \`high_price\`, \`low_price\`, \`close_price\`, \`volume\`, \`date\`)
        SELECT 
          ticker,
          CAST(SUBSTRING_INDEX(GROUP_CONCAT(open_price ORDER BY timestamp ASC), ',', 1) AS UNSIGNED) AS open_price,
          MAX(high_price) AS high_price,
          MIN(low_price) AS low_price,
          CAST(SUBSTRING_INDEX(GROUP_CONCAT(close_price ORDER BY timestamp DESC), ',', 1) AS UNSIGNED) AS close_price,
          SUM(volume) AS volume,
          DATE(timestamp) AS \`date\`
        FROM \`solo_stock_history\`
        WHERE timestamp < CURDATE()
        GROUP BY ticker, DATE(timestamp)
        ON DUPLICATE KEY UPDATE
          open_price = VALUES(open_price),
          high_price = VALUES(high_price),
          low_price = VALUES(low_price),
          close_price = VALUES(close_price),
          volume = VALUES(volume)
      `);

      // Prune high-frequency 10-minute candles older than 45 days (daily history is preserved permanently)
      await primaryExecute("DELETE FROM `solo_stock_history` WHERE timestamp < NOW() - INTERVAL 45 DAY");
      console.log("[MarketSimulation] Midnight daily OHLC downsampling & pruning complete.");
    } catch (err) {
      console.error("[MarketSimulation] Error during daily OHLC downsampling:", err);
    }

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

      if (target === 0) {
        dividend = 0;
      } else {
        // Dynamic target yield tracking with sentiment sensitivity:
        // Bullish market provides slight yield premium (+10%), Bearish slight discount (-10%)
        const moodMultiplier = marketMood === 1 ? 1.1 : marketMood === 2 ? 0.9 : 1.0;
        const dynamicTarget = Math.max(1, Math.round(target * moodMultiplier));

        if (dividend === 0) {
          dividend = dynamicTarget;
        } else if (dividend < dynamicTarget) {
          dividend = Math.min(dynamicTarget, dividend + Math.max(1, Math.ceil((dynamicTarget - dividend) / 2)));
        } else if (dividend > dynamicTarget) {
          dividend = Math.max(1, dividend - Math.max(1, Math.ceil((dividend - dynamicTarget) / 2)));
        }
      }

      if (dividend < 0) dividend = 0;
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

  /**
   * Catches up missed 10-minute price shifts organically while preserving trends.
   */
  static async catchUpOfflineShifts(): Promise<number> {
    const metaRows = await primaryQuery(
      "SELECT mkey, mval FROM `solo_stock_meta` WHERE mkey IN ('LastShiftTime', 'MarketMood', 'MarketDrift')"
    );
    const metaMap = new Map(metaRows.map((r: any) => [r.mkey, Number(r.mval)]));

    let lastShiftTime = metaMap.get("LastShiftTime") || 0;

    // Fallback: If LastShiftTime key doesn't exist yet, derive from latest history candle
    if (lastShiftTime === 0) {
      const latestCandle = await primaryQuery(
        "SELECT UNIX_TIMESTAMP(MAX(timestamp)) as last_ts FROM `solo_stock_history`"
      );
      lastShiftTime = Number(latestCandle[0]?.last_ts) || Math.floor(Date.now() / 1000);
    }

    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - lastShiftTime;
    if (elapsed < MARKET_SHIFT_INTERVAL_SEC) return 0;

    // Cap at 45 days (retention window = 6480 shifts) to prevent runaway memory
    const missedShifts = Math.min(Math.floor(elapsed / MARKET_SHIFT_INTERVAL_SEC), 6480);
    console.log(
      `[MarketSimulation] Server was offline for ${Math.floor(elapsed / 60)}m. Simulating ${missedShifts} missed shift(s)...`
    );

    // 1. Fetch live market state into memory
    let marketMood = metaMap.get("MarketMood") || 0;
    let marketDrift = metaMap.get("MarketDrift") || 0;

    const stockRows = await primaryQuery(
      "SELECT ticker, price, dividend, split_count, beta FROM `solo_stock_market` WHERE enabled = 1 ORDER BY ticker ASC"
    );
    if (stockRows.length === 0) return 0;

    const activeEvents = await primaryQuery(
      "SELECT event_id, ticker, mood_override, remaining_shifts FROM `solo_stock_events_active` WHERE remaining_shifts > 0"
    );

    // In-memory ticker tracking
    const state = stockRows.map((s: any) => ({
      ticker: s.ticker,
      price: Number(s.price) || 50,
      beta: Number(s.beta) || 1.0,
      splitCount: Number(s.split_count) || 0,
      totalSplitsDuringOffline: 0,
    }));

    const candlesToInsert: { ticker: string; open: number; high: number; low: number; close: number; volume: number; ts: string }[] = [];

    // 2. Pure In-Memory Stepwise Replay
    for (let step = 1; step <= missedShifts; step++) {
      const stepTimestamp = new Date((lastShiftTime + step * MARKET_SHIFT_INTERVAL_SEC) * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      // Decrement active lore events in memory
      const currentTickerMoods = new Map<string, number>();
      for (const ev of activeEvents) {
        if (ev.remaining_shifts > 0) {
          currentTickerMoods.set(ev.ticker, ev.mood_override);
          ev.remaining_shifts--;
        }
      }

      // Step drift transition
      marketDrift = Math.floor(Math.random() * 9) - 4;
      let upCount = 0;

      for (const stock of state) {
        const localMood = currentTickerMoods.get(stock.ticker) || currentTickerMoods.get("ALL") || marketMood;

        let f = marketDrift + (Math.floor(Math.random() * 13) - 6);
        if (localMood === 1) f += 2;
        else if (localMood === 2) f -= 2;
        else if (localMood === 3) f += Math.floor(Math.random() * 36) - 15;

        f = Math.round(f * stock.beta);

        const oldPrice = stock.price;
        let newPrice = oldPrice + Math.floor((oldPrice * f) / 100);
        if (newPrice < 50) newPrice = 50;

        // Handle stock split
        if (newPrice >= 1000) {
          newPrice = Math.floor(newPrice / 10);
          stock.splitCount++;
          stock.totalSplitsDuringOffline++;
        }

        if (newPrice > oldPrice) upCount++;
        stock.price = newPrice;

        // Synthetic OHLC candle matching the live formula
        const wickSpread = Math.max(1, Math.round(newPrice * 0.008));
        const high = Math.max(oldPrice, newPrice) + Math.floor(Math.random() * wickSpread);
        const low = Math.max(1, Math.min(oldPrice, newPrice) - Math.floor(Math.random() * wickSpread));
        const volume = Math.floor(Math.random() * 120) + 10;

        candlesToInsert.push({
          ticker: stock.ticker,
          open: oldPrice,
          high,
          low,
          close: newPrice,
          volume,
          ts: stepTimestamp,
        });
      }

      // Organic mood evolution if no lore event is active
      if (currentTickerMoods.size === 0) {
        const rand = Math.floor(Math.random() * 100) + 1;
        if (rand <= 8) marketMood = 3;
        else if (upCount >= Math.ceil(state.length / 2)) marketMood = 1;
        else marketMood = 2;
      }
    }

    // 3. Batch DB Persistence (Chunked multi-row inserts)
    const CHUNK_SIZE = 500;
    for (let i = 0; i < candlesToInsert.length; i += CHUNK_SIZE) {
      const chunk = candlesToInsert.slice(i, i + CHUNK_SIZE);
      const placeholders = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ");
      const params = chunk.flatMap((c) => [c.ticker, c.open, c.high, c.low, c.close, c.volume, c.ts]);
      await primaryExecute(
        `INSERT INTO \`solo_stock_history\` (\`ticker\`, \`open_price\`, \`high_price\`, \`low_price\`, \`close_price\`, \`volume\`, \`timestamp\`) VALUES ${placeholders}`,
        params
      );
    }

    // 4. Update final state in solo_stock_market
    for (const stock of state) {
      if (stock.totalSplitsDuringOffline > 0) {
        const multiplier = Math.pow(10, stock.totalSplitsDuringOffline);
        await primaryExecute(
          "UPDATE `solo_stock_market` SET price = ?, split_count = ? WHERE ticker = ?",
          [stock.price, stock.splitCount, stock.ticker]
        );
        await primaryExecute(
          "UPDATE `solo_stock_player` SET shares = shares * ? WHERE ticker = ?",
          [multiplier, stock.ticker]
        );
      } else {
        await primaryExecute("UPDATE `solo_stock_market` SET price = ? WHERE ticker = ?", [
          stock.price,
          stock.ticker,
        ]);
      }
    }

    // 5. Cleanup expired events & sync meta
    await primaryExecute("DELETE FROM `solo_stock_events_active` WHERE remaining_shifts <= ?", [missedShifts]);
    await primaryExecute(
      "UPDATE `solo_stock_events_active` SET remaining_shifts = remaining_shifts - ? WHERE remaining_shifts > 0",
      [missedShifts]
    );
    await primaryExecute(
      "INSERT INTO `solo_stock_meta` (mkey, mval) VALUES ('LastShiftTime', ?) ON DUPLICATE KEY UPDATE mval = ?",
      [now, now]
    );
    await primaryExecute("UPDATE `solo_stock_meta` SET mval = ? WHERE mkey = 'MarketMood'", [marketMood]);
    await primaryExecute("UPDATE `solo_stock_meta` SET mval = ? WHERE mkey = 'MarketDrift'", [marketDrift]);

    console.log(`[MarketSimulation] Offline gap filled with ${candlesToInsert.length} candles.`);
    return missedShifts;
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
