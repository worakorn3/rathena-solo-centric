import { query, primaryExecute, primaryQueryOne } from "../db/pool";
import {
  BankData,
  NetWorthSummary,
  StockActiveEvent,
  StockEventLog,
  TickerNewsResponse,
  StockHolding,
  StockMarketQuote,
  DailyBounty,
  StockCandle,
  StockHistoryResponse,
  TradeStockResponse,
  isCryptoAsset,
  getJobName
} from "@rathena/shared";

// Ponytail: Metadata (names, sectors, lore) is loaded dynamically from `solo_stock_market`

interface CharZenyRow {
  char_id: number;
  name: string;
  class: number;
  base_level: number;
  zeny: number;
}

interface AccRegRow {
  key: string;
  value: number;
}

interface StockMarketRow {
  ticker: string;
  name: string;
  broker_title?: string;
  sector?: string;
  archetype?: string;
  lore?: string;
  asset_type?: "EQUITY" | "CRYPTO";
  price: number;
  price_old: number;
  dividend: number;
  div_acc: number;
  split_count: number;
}

interface StockPlayerRow {
  ticker: string;
  shares: number;
  total_cost: number;
  pending_div: number;
  drip_enabled: number;
  drip_carryover: number;
}

interface StockActiveEventRow {
  id: number;
  event_id: string;
  ticker: string;
  start_time: number;
  end_time: number;
  remaining_shifts: number;
  tax_rate_override: number;
  mood_override: number;
  headline: string;
}

interface StockEventLogRow {
  log_id: number;
  event_id: string;
  event_name: string;
  category: string;
  ticker_target: string;
  headline: string;
  details: string;
  triggered_by: string;
  created_at: string;
}

export class EconomyService {
  static async getNetWorthSummary(accountId: number): Promise<NetWorthSummary> {
    // 1. Character Zeny
    const charRows = await query<CharZenyRow>(
      "SELECT char_id, name, class, base_level, zeny FROM `char` WHERE account_id = ? ORDER BY char_id ASC",
      [accountId]
    );

    const characterZenyBreakdown = charRows.map((c) => ({
      charId: c.char_id,
      name: c.name,
      className: getJobName(c.class),
      baseLevel: c.base_level,
      zeny: Number(c.zeny) || 0,
    }));

    const liquidZeny = characterZenyBreakdown.reduce((sum, c) => sum + c.zeny, 0);

    // 2. Investment Bank Data
    let investBalance = 0;
    let investTime = 0;

    try {
      const bankRow = await query<any>(
        "SELECT principal, deposit_time FROM `solo_bank_account` WHERE account_id = ?",
        [accountId]
      );
      if (bankRow && bankRow.length > 0) {
        investBalance = Number(bankRow[0].principal) || 0;
        investTime = Number(bankRow[0].deposit_time) || 0;
      }
    } catch {
      // Table might not exist yet if migration is pending
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    let daysAccrued = 0;
    let pendingInterest = 0;

    if (investBalance > 0 && investTime > 0) {
      const elapsedSeconds = Math.max(0, currentTimestamp - investTime);
      const rawDays = Math.floor(elapsedSeconds / 86400);
      daysAccrued = Math.min(rawDays, 10); // Capped at 10% (10 days)
      pendingInterest = Math.floor((investBalance / 100) * daysAccrued);
    }

    const bankTotal = investBalance + pendingInterest;

    const bank: BankData = {
      principal: investBalance,
      interestRate: 0.01,
      maxDays: 10,
      daysAccrued,
      pendingInterest,
      totalPayout: bankTotal,
      depositTimestamp: investTime,
      lastDepositDate: investTime > 0 ? new Date(investTime * 1000).toLocaleString() : "Never",
    };

    // 3. Stock Market Quotes
    let marketRows: StockMarketRow[] = [];
    try {
      marketRows = await query<StockMarketRow>(
        "SELECT ticker, name, broker_title, sector, archetype, lore, asset_type, price, price_old, dividend, div_acc, split_count FROM `solo_stock_market` WHERE enabled = 1 ORDER BY ticker ASC"
      );
    } catch {
      // If table doesn't exist yet, return empty
      marketRows = [];
    }

    const quotes: StockMarketQuote[] = marketRows.map((m) => {
      const price = Number(m.price) || 0;
      const priceOld = Number(m.price_old) || price;
      const changeAmount = price - priceOld;
      const changePercent = priceOld > 0 ? Number(((changeAmount / priceOld) * 100).toFixed(2)) : 0;
      const assetType = m.asset_type || (isCryptoAsset(m.ticker, m.sector) ? "CRYPTO" : "EQUITY");

      return {
        ticker: m.ticker,
        name: m.name || `${m.ticker} Enterprises`,
        assetType,
        sector: m.sector || undefined,
        archetype: m.archetype || undefined,
        lore: m.lore || undefined,
        price,
        priceOld,
        changeAmount,
        changePercent,
        dividend: Number(m.dividend) || 0,
        divAcc: Number(m.div_acc) || 0,
        splitCount: Number(m.split_count) || 0,
      };
    });

    const quoteMap = new Map(quotes.map((q) => [q.ticker, q]));

    // 4. Player Stock Holdings
    let playerStockRows: StockPlayerRow[] = [];
    try {
      playerStockRows = await query<StockPlayerRow>(
        "SELECT ticker, shares, total_cost, pending_div, drip_enabled, drip_carryover FROM `solo_stock_player` WHERE account_id = ? AND shares > 0",
        [accountId]
      );
    } catch {
      playerStockRows = [];
    }

    let stockMarketValue = 0;
    let municipalMarketValue = 0;
    let cryptoMarketValue = 0;
    let stockTotalCost = 0;

    const holdings: StockHolding[] = playerStockRows.map((p) => {
      const shares = Number(p.shares) || 0;
      const totalCost = Number(p.total_cost) || 0;
      const quote = quoteMap.get(p.ticker);
      const currentPrice = quote ? quote.price : 0;
      const priceOld = quote ? quote.priceOld : currentPrice;
      const changeAmount = currentPrice - priceOld;
      const changePercent = priceOld > 0 ? Number(((changeAmount / priceOld) * 100).toFixed(2)) : 0;

      const marketValue = shares * currentPrice;
      const avgBuyPrice = shares > 0 ? Math.round(totalCost / shares) : 0;
      const unrealizedPnL = marketValue - totalCost;
      const unrealizedPnLPercent =
        totalCost > 0 ? Number(((unrealizedPnL / totalCost) * 100).toFixed(2)) : 0;

      const pendingDividends = Number(p.pending_div) || 0;
      const cryptoAsset = isCryptoAsset(p.ticker, quote?.assetType || quote?.sector);

      stockMarketValue += marketValue;
      if (cryptoAsset) {
        cryptoMarketValue += marketValue;
      } else {
        municipalMarketValue += marketValue;
      }
      stockTotalCost += totalCost;

      return {
        ticker: p.ticker,
        name: quote ? quote.name : `${p.ticker} Enterprises`,
        assetType: cryptoAsset ? "CRYPTO" : "EQUITY",
        sector: quote?.sector,
        archetype: quote?.archetype,
        shares,
        totalCost,
        avgBuyPrice,
        currentPrice,
        priceOld,
        changeAmount,
        changePercent,
        marketValue,
        unrealizedPnL,
        unrealizedPnLPercent,
        dividendRate: quote ? quote.dividend : 0,
        pendingDividends,
      };
    });

    const stockUnrealizedPnL = stockMarketValue - stockTotalCost;
    const stockUnrealizedPnLPercent =
      stockTotalCost > 0 ? Number(((stockUnrealizedPnL / stockTotalCost) * 100).toFixed(2)) : 0;

    const totalNetWorth = liquidZeny + bankTotal + stockMarketValue;

    // 5. Active & Latest Events + Market Meta
    let activeEvents: StockActiveEvent[] = [];
    let latestEvent: StockEventLog | null = null;
    let equitiesMood = 0;
    let equitiesDrift = 0;
    let cryptoMood = 0;
    let cryptoDrift = 0;
    try {
      activeEvents = await this.getActiveEvents();
      const history = await this.getEventHistory(1);
      latestEvent = history.length > 0 ? history[0] : null;

      const metaRows = await query<{ mkey: string; mval: number }>(
        "SELECT mkey, mval FROM `solo_stock_meta` WHERE mkey IN ('MarketMood', 'MarketDrift', 'CryptoMood', 'CryptoDrift')"
      );
      for (const row of metaRows) {
        if (row.mkey === "MarketMood") equitiesMood = Number(row.mval);
        if (row.mkey === "MarketDrift") equitiesDrift = Number(row.mval);
        if (row.mkey === "CryptoMood") cryptoMood = Number(row.mval);
        if (row.mkey === "CryptoDrift") cryptoDrift = Number(row.mval);
      }
    } catch {
      activeEvents = [];
      latestEvent = null;
    }

    return {
      totalNetWorth,
      liquidZeny,
      bankPrincipal: investBalance,
      bankPendingInterest: pendingInterest,
      bankTotal,
      stockMarketValue,
      municipalMarketValue,
      cryptoMarketValue,
      stockTotalCost,
      stockUnrealizedPnL,
      stockUnrealizedPnLPercent,
      characterZenyBreakdown,
      holdings,
      quotes,
      bank,
      activeEvents,
      latestEvent,
      marketMood: equitiesMood,
      marketDrift: equitiesDrift,
      equitiesMood,
      equitiesDrift,
      cryptoMood,
      cryptoDrift,
    };
  }

  static async getMarketQuotes(): Promise<StockMarketQuote[]> {
    try {
      const marketRows = await query<StockMarketRow>(
        "SELECT ticker, name, broker_title, sector, archetype, lore, price, price_old, dividend, div_acc, split_count FROM `solo_stock_market` WHERE enabled = 1 ORDER BY ticker ASC"
      );

      return marketRows.map((m) => {
        const price = Number(m.price) || 0;
        const priceOld = Number(m.price_old) || price;
        const changeAmount = price - priceOld;
        const changePercent = priceOld > 0 ? Number(((changeAmount / priceOld) * 100).toFixed(2)) : 0;

        return {
          ticker: m.ticker,
          name: m.name || `${m.ticker} Enterprises`,
          sector: m.sector || undefined,
          archetype: m.archetype || undefined,
          lore: m.lore || undefined,
          price,
          priceOld,
          changeAmount,
          changePercent,
          dividend: Number(m.dividend) || 0,
          divAcc: Number(m.div_acc) || 0,
          splitCount: Number(m.split_count) || 0,
        };
      });
    } catch {
      return [];
    }
  }

  static async getActiveEvents(): Promise<StockActiveEvent[]> {
    try {
      const rows = await query<StockActiveEventRow>(
        "SELECT id, event_id, ticker, start_time, end_time, remaining_shifts, tax_rate_override, mood_override, headline FROM `solo_stock_events_active` WHERE remaining_shifts > 0 ORDER BY id DESC"
      );

      return rows.map((r) => ({
        id: Number(r.id),
        eventId: r.event_id,
        ticker: r.ticker,
        startTime: Number(r.start_time),
        endTime: Number(r.end_time),
        remainingShifts: Number(r.remaining_shifts),
        taxRateOverride: Number(r.tax_rate_override),
        moodOverride: Number(r.mood_override),
        headline: r.headline,
      }));
    } catch {
      return [];
    }
  }

  static async getEventHistory(limit = 20, ticker?: string): Promise<StockEventLog[]> {
    try {
      let sql = "SELECT log_id, event_id, event_name, category, ticker_target, headline, details, triggered_by, created_at FROM `solo_stock_events_log`";
      const params: any[] = [];

      if (ticker && ticker.trim()) {
        const cleanTicker = ticker.trim().toUpperCase();
        sql += " WHERE (ticker_target = ? OR ticker_target = 'ALL' OR ticker_target LIKE ?)";
        params.push(cleanTicker, `%${cleanTicker}%`);
      }

      sql += " ORDER BY log_id DESC LIMIT ?";
      params.push(limit);

      const rows = await query<StockEventLogRow>(sql, params);

      return rows.map((r) => ({
        logId: Number(r.log_id),
        eventId: r.event_id,
        eventName: r.event_name,
        category: r.category,
        tickerTarget: r.ticker_target,
        headline: r.headline,
        details: r.details,
        triggeredBy: r.triggered_by,
        createdAt: String(r.created_at),
      }));
    } catch {
      return [];
    }
  }

  static async getTickerNews(ticker: string): Promise<TickerNewsResponse> {
    const cleanTicker = ticker.trim().toUpperCase();
    try {
      // 1. Real-time active events currently disrupting the market
      const activeRows = await query<StockActiveEventRow>(
        "SELECT id, event_id, ticker, start_time, end_time, remaining_shifts, tax_rate_override, mood_override, headline FROM `solo_stock_events_active` WHERE remaining_shifts > 0 AND (ticker = ? OR ticker = 'ALL' OR ticker LIKE ?) ORDER BY id DESC",
        [cleanTicker, `%${cleanTicker}%`]
      );

      // 2. Real historical logged incidents triggered in the simulation
      const logRows = await query<StockEventLogRow>(
        "SELECT log_id, event_id, event_name, category, ticker_target, headline, details, triggered_by, created_at FROM `solo_stock_events_log` WHERE (ticker_target = ? OR ticker_target = 'ALL' OR ticker_target LIKE ?) ORDER BY log_id DESC LIMIT 30",
        [cleanTicker, `%${cleanTicker}%`]
      );

      return {
        success: true,
        ticker: cleanTicker,
        activeEvents: activeRows.map((r) => ({
          id: Number(r.id),
          eventId: r.event_id,
          ticker: r.ticker,
          startTime: Number(r.start_time),
          endTime: Number(r.end_time),
          remainingShifts: Number(r.remaining_shifts),
          taxRateOverride: Number(r.tax_rate_override),
          moodOverride: Number(r.mood_override),
          headline: r.headline,
        })),
        historicalEvents: logRows.map((r) => ({
          logId: Number(r.log_id),
          eventId: r.event_id,
          eventName: r.event_name,
          category: r.category,
          tickerTarget: r.ticker_target,
          headline: r.headline,
          details: r.details,
          triggeredBy: r.triggered_by,
          createdAt: String(r.created_at),
        })),
      };
    } catch (err) {
      console.error(`[EconomyService] Failed to fetch news for ticker ${cleanTicker}:`, err);
      return {
        success: false,
        ticker: cleanTicker,
        activeEvents: [],
        historicalEvents: [],
      };
    }
  }

  static async getDailyBounties(): Promise<DailyBounty[]> {
    try {
      const rows = await query<any>(`
        SELECT 
            m1.varname as var_item, 
            CAST(m1.value AS UNSIGNED) as item_id, 
            CAST(m2.value AS UNSIGNED) as price,
            c.item_name,
            c.mob_name,
            c.mob_lv
        FROM mapreg m1
        JOIN mapreg m2 ON m2.varname = REPLACE(m1.varname, '$JunkT', '$JunkPriceT')
        LEFT JOIN custom_junk_pool c ON c.item_id = CAST(m1.value AS UNSIGNED) AND c.tier = CAST(SUBSTRING(m1.varname, 7, 1) AS UNSIGNED)
        WHERE m1.varname LIKE '$JunkT%'
        ORDER BY m1.varname ASC
      `);

      return rows.map(r => {
        const parts = r.var_item.replace('$JunkT', '').split('_');
        return {
          tier: Number(parts[0]),
          index: Number(parts[1]),
          itemId: r.item_id,
          itemName: r.item_name || 'Unknown Item',
          price: r.price,
          mobName: r.mob_name || 'Unknown Monster',
          mobLevel: Number(r.mob_lv) || 0
        };
      });
    } catch (err) {
      console.error("[EconomyService] Failed to fetch daily bounties", err);
      return [];
    }
  }

  /**
   * Get OHLC candlestick price history for TradingView chart
   * Uses Replica connection (3307)
   */
  static async getStockHistory(ticker: string, timeframe = "1D"): Promise<StockHistoryResponse> {
    const cleanTicker = (ticker || "").trim().toUpperCase();
    const validTf = ["1D", "1W", "1M", "ALL"].includes(timeframe.toUpperCase())
      ? timeframe.toUpperCase()
      : "1D";

    try {
      let candles: StockCandle[] = [];

      if (validTf === "1D") {
        // Last 24 hours of 10-minute candles
        const rows = await query<any>(
          "SELECT open_price, high_price, low_price, close_price, volume, UNIX_TIMESTAMP(`timestamp`) as ts FROM `solo_stock_history` WHERE ticker = ? AND `timestamp` >= NOW() - INTERVAL 1 DAY ORDER BY `timestamp` ASC",
          [cleanTicker]
        );
        candles = rows.map((r) => ({
          time: Number(r.ts),
          open: Number(r.open_price),
          high: Number(r.high_price),
          low: Number(r.low_price),
          close: Number(r.close_price),
          volume: Number(r.volume) || 0,
        }));
      } else if (validTf === "1W") {
        // Last 7 days of candles
        const rows = await query<any>(
          "SELECT open_price, high_price, low_price, close_price, volume, UNIX_TIMESTAMP(`timestamp`) as ts FROM `solo_stock_history` WHERE ticker = ? AND `timestamp` >= NOW() - INTERVAL 7 DAY ORDER BY `timestamp` ASC",
          [cleanTicker]
        );
        candles = rows.map((r) => ({
          time: Number(r.ts),
          open: Number(r.open_price),
          high: Number(r.high_price),
          low: Number(r.low_price),
          close: Number(r.close_price),
          volume: Number(r.volume) || 0,
        }));
      } else if (validTf === "1M") {
        // Last 30 days of daily aggregated candles
        const rows = await query<any>(
          "SELECT open_price, high_price, low_price, close_price, volume, DATE_FORMAT(`date`, '%Y-%m-%d') as dt FROM `solo_stock_history_daily` WHERE ticker = ? AND `date` >= CURDATE() - INTERVAL 30 DAY ORDER BY `date` ASC",
          [cleanTicker]
        );
        candles = rows.map((r) => ({
          time: String(r.dt),
          open: Number(r.open_price),
          high: Number(r.high_price),
          low: Number(r.low_price),
          close: Number(r.close_price),
          volume: Number(r.volume) || 0,
        }));
      } else {
        // ALL Time daily aggregated candles
        const rows = await query<any>(
          "SELECT open_price, high_price, low_price, close_price, volume, DATE_FORMAT(`date`, '%Y-%m-%d') as dt FROM `solo_stock_history_daily` WHERE ticker = ? ORDER BY `date` ASC",
          [cleanTicker]
        );
        candles = rows.map((r) => ({
          time: String(r.dt),
          open: Number(r.open_price),
          high: Number(r.high_price),
          low: Number(r.low_price),
          close: Number(r.close_price),
          volume: Number(r.volume) || 0,
        }));
      }

      return {
        success: true,
        ticker: cleanTicker,
        timeframe: validTf,
        candles,
      };
    } catch (err) {
      console.error(`[EconomyService] Failed to fetch stock history for ${cleanTicker}:`, err);
      return {
        success: false,
        ticker: cleanTicker,
        timeframe: validTf,
        candles: [],
      };
    }
  }

  /**
   * Execute direct stock market trade (BUY or SELL)
   * Enforces OFFLINE status lock (char.online === 0) to eliminate map-server cache race conditions.
   * All mutations execute on Primary Database (3306) via primaryExecute.
   */
  static async executeTrade(
    accountId: number,
    charId: number,
    ticker: string,
    action: "BUY" | "SELL",
    rawShares: number
  ): Promise<TradeStockResponse> {
    const shares = Math.floor(Number(rawShares));
    if (!shares || shares <= 0) {
      return { success: false, error: "Invalid share quantity specified." };
    }

    const tradeAction = (action || "").toUpperCase() as "BUY" | "SELL";
    if (tradeAction !== "BUY" && tradeAction !== "SELL") {
      return { success: false, error: "Invalid trade action. Must be BUY or SELL." };
    }

    const cleanTicker = (ticker || "").trim().toUpperCase();

    // 1. Verify character ownership and OFFLINE status
    const char = await primaryQueryOne<{
      char_id: number;
      name: string;
      zeny: number;
      online: number;
    }>(
      "SELECT char_id, name, zeny, online FROM `char` WHERE char_id = ? AND account_id = ?",
      [charId, accountId]
    );

    if (!char) {
      return {
        success: false,
        error: "Character not found or does not belong to this account.",
      };
    }

    if (char.online === 1) {
      return {
        success: false,
        error: "Character is currently logged into the game. Please log out before trading via Web Terminal to prevent state desync.",
      };
    }

    // 2. Fetch live price and active status
    const stock = await primaryQueryOne<{
      ticker: string;
      name: string;
      price: number;
      enabled: number;
    }>(
      "SELECT ticker, name, price, enabled FROM `solo_stock_market` WHERE ticker = ?",
      [cleanTicker]
    );

    if (!stock || stock.enabled !== 1) {
      return {
        success: false,
        error: `Stock ticker '${cleanTicker}' is not available for trading.`,
      };
    }

    const price = Number(stock.price) || 0;
    if (price <= 0) {
      return {
        success: false,
        error: `Invalid market price for '${cleanTicker}'.`,
      };
    }

    // 3. BUY Execution
    if (tradeAction === "BUY") {
      const totalCost = shares * price;
      const tradeFee = Math.max(1, Math.round(totalCost * 0.01)); // 1% Brokerage Commission (Currency Sink)
      const totalRequired = totalCost + tradeFee;

      if (Number(char.zeny) < totalRequired) {
        return {
          success: false,
          error: `Insufficient Zeny. Required: ${totalRequired.toLocaleString()} Z (${totalCost.toLocaleString()} Z + ${tradeFee.toLocaleString()} Z 1% fee), Available: ${Number(char.zeny).toLocaleString()} Z.`,
        };
      }

      await primaryExecute(
        "UPDATE `char` SET zeny = zeny - ? WHERE char_id = ? AND zeny >= ?",
        [totalRequired, charId, totalRequired]
      );

      await primaryExecute(
        "INSERT INTO `solo_stock_player` (account_id, ticker, shares, total_cost) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE shares = shares + VALUES(shares), total_cost = total_cost + VALUES(total_cost)",
        [accountId, cleanTicker, shares, totalRequired]
      );

      // Player Whale Trade Impact: Large block orders add immediate market volume and tactile price pressure
      if (shares >= 500) {
        await primaryExecute(
          "UPDATE `solo_stock_history` SET volume = volume + ? WHERE ticker = ? ORDER BY timestamp DESC LIMIT 1",
          [shares, cleanTicker]
        );
        if (shares >= 1000) {
          await primaryExecute(
            "UPDATE `solo_stock_market` SET price = price + 1 WHERE ticker = ? AND price < 990",
            [cleanTicker]
          );
        }
      }

      const remainingZeny = Number(char.zeny) - totalRequired;

      return {
        success: true,
        message: `Purchased ${shares.toLocaleString()} ${cleanTicker} shares for ${totalCost.toLocaleString()} Z (Fee: ${tradeFee.toLocaleString()} Z).`,
        executedShares: shares,
        pricePerShare: price,
        totalAmount: totalRequired,
        remainingZeny,
      };
    }

    // 4. SELL Execution
    const holding = await primaryQueryOne<{
      shares: number;
      total_cost: number;
    }>(
      "SELECT shares, total_cost FROM `solo_stock_player` WHERE account_id = ? AND ticker = ?",
      [accountId, cleanTicker]
    );

    if (!holding || Number(holding.shares) < shares) {
      return {
        success: false,
        error: `Insufficient shares held. Available: ${holding ? Number(holding.shares).toLocaleString() : 0}, Requested: ${shares.toLocaleString()}.`,
      };
    }

    const grossProceeds = shares * price;
    const tradeFee = Math.max(1, Math.round(grossProceeds * 0.01)); // 1% Brokerage Commission (Currency Sink)
    const netProceeds = grossProceeds - tradeFee;

    await primaryExecute(
      "UPDATE `char` SET zeny = zeny + ? WHERE char_id = ?",
      [netProceeds, charId]
    );

    const remainingShares = Number(holding.shares) - shares;
    if (remainingShares <= 0) {
      await primaryExecute(
        "DELETE FROM `solo_stock_player` WHERE account_id = ? AND ticker = ?",
        [accountId, cleanTicker]
      );
    } else {
      const costReduction = Math.round((shares / Number(holding.shares)) * Number(holding.total_cost));
      const newTotalCost = Math.max(0, Number(holding.total_cost) - costReduction);
      await primaryExecute(
        "UPDATE `solo_stock_player` SET shares = ?, total_cost = ? WHERE account_id = ? AND ticker = ?",
        [remainingShares, newTotalCost, accountId, cleanTicker]
      );
    }

    // Player Whale Trade Impact on SELL: Large dumps register volume and mild price pressure
    if (shares >= 500) {
      await primaryExecute(
        "UPDATE `solo_stock_history` SET volume = volume + ? WHERE ticker = ? ORDER BY timestamp DESC LIMIT 1",
        [shares, cleanTicker]
      );
      if (shares >= 1000) {
        await primaryExecute(
          "UPDATE `solo_stock_market` SET price = GREATEST(50, price - 1) WHERE ticker = ?",
          [cleanTicker]
        );
      }
    }

    const remainingZeny = Number(char.zeny) + netProceeds;

    return {
      success: true,
      message: `Sold ${shares.toLocaleString()} ${cleanTicker} shares for ${grossProceeds.toLocaleString()} Z (Net: ${netProceeds.toLocaleString()} Z after ${tradeFee.toLocaleString()} Z fee).`,
      executedShares: shares,
      pricePerShare: price,
      totalAmount: netProceeds,
      remainingZeny,
    };
  }

  /**
   * Deposit Zeny into Investment Bank
   * Atomic deduction on Primary DB (3306) with char.online === 0 guard
   */
  static async depositBank(
    accountId: number,
    charId: number,
    amount: number
  ): Promise<BankTransactionResponse> {
    const safeAmount = Math.floor(Number(amount));
    if (!safeAmount || safeAmount < 100) {
      return { success: false, error: "Minimum deposit is 100 Zeny." };
    }

    // 1. Verify character ownership & OFFLINE status on Primary DB
    const char = await primaryQueryOne<{
      char_id: number;
      name: string;
      zeny: number;
      online: number;
    }>(
      "SELECT char_id, name, zeny, online FROM `char` WHERE char_id = ? AND account_id = ?",
      [charId, accountId]
    );

    if (!char) return { success: false, error: "Character not found or does not belong to this account." };
    if (char.online === 1) return { success: false, error: "Character is currently logged into the game. Please log out first." };
    if (Number(char.zeny) < safeAmount) {
      return {
        success: false,
        error: `Insufficient Zeny. Available: ${Number(char.zeny).toLocaleString()} Z, Requested: ${safeAmount.toLocaleString()} Z.`,
      };
    }

    // 2. Fetch existing bank balance from Primary DB
    const bank = await primaryQueryOne<{ principal: number; deposit_time: number }>(
      "SELECT principal, deposit_time FROM `solo_bank_account` WHERE account_id = ?",
      [accountId]
    );

    const currentPrincipal = bank ? Number(bank.principal) || 0 : 0;
    const depositTime = bank ? Number(bank.deposit_time) || 0 : 0;

    // 3. Calculate pending interest accrued so far
    const currentTimestamp = Math.floor(Date.now() / 1000);
    let pendingInterest = 0;
    if (currentPrincipal > 0 && depositTime > 0) {
      const elapsedSeconds = Math.max(0, currentTimestamp - depositTime);
      const daysAccrued = Math.min(Math.floor(elapsedSeconds / 86400), 10);
      pendingInterest = Math.floor((currentPrincipal / 100) * daysAccrued);
    }

    // 4. Calculate 2% deposit fee (matching script's amount / 50)
    const fee = Math.floor(safeAmount / 50);
    const netDeposit = safeAmount - fee;
    const newPrincipal = currentPrincipal + pendingInterest + netDeposit;

    if (newPrincipal > 1900000000) {
      return {
        success: false,
        error: "Cannot accept deposit: New principal would exceed the 1,900,000,000 Zeny bank limit.",
      };
    }

    // 5. Execute atomic mutations on Primary DB
    await primaryExecute(
      "UPDATE `char` SET zeny = zeny - ? WHERE char_id = ? AND zeny >= ?",
      [safeAmount, charId, safeAmount]
    );

    await primaryExecute(
      "INSERT INTO `solo_bank_account` (account_id, principal, deposit_time) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE principal = VALUES(principal), deposit_time = VALUES(deposit_time)",
      [accountId, newPrincipal, currentTimestamp]
    );

    const remainingZeny = Number(char.zeny) - safeAmount;

    return {
      success: true,
      message: `Successfully deposited ${safeAmount.toLocaleString()} Z. Fee paid: ${fee.toLocaleString()} Z. New principal: ${newPrincipal.toLocaleString()} Z.`,
      newPrincipal,
      feePaid: fee,
      interestPaid: pendingInterest,
      remainingZeny,
    };
  }

  /**
   * Withdraw Zeny from Investment Bank (supports partial and full withdrawal)
   * Atomic credit on Primary DB (3306) with char.online === 0 guard
   */
  static async withdrawBank(
    accountId: number,
    charId: number,
    requestedAmount?: number
  ): Promise<BankTransactionResponse> {
    // 1. Verify character ownership & OFFLINE status on Primary DB
    const char = await primaryQueryOne<{
      char_id: number;
      name: string;
      zeny: number;
      online: number;
    }>(
      "SELECT char_id, name, zeny, online FROM `char` WHERE char_id = ? AND account_id = ?",
      [charId, accountId]
    );

    if (!char) return { success: false, error: "Character not found or does not belong to this account." };
    if (char.online === 1) return { success: false, error: "Character is currently logged into the game. Please log out first." };

    // 2. Fetch existing bank balance from Primary DB
    const bank = await primaryQueryOne<{ principal: number; deposit_time: number }>(
      "SELECT principal, deposit_time FROM `solo_bank_account` WHERE account_id = ?",
      [accountId]
    );

    const currentPrincipal = bank ? Number(bank.principal) || 0 : 0;
    const depositTime = bank ? Number(bank.deposit_time) || 0 : 0;

    if (currentPrincipal <= 0) {
      return { success: false, error: "You have no active funds to withdraw." };
    }

    // 3. Calculate pending interest
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const elapsedSeconds = Math.max(0, currentTimestamp - depositTime);
    const daysAccrued = Math.min(Math.floor(elapsedSeconds / 86400), 10);
    const pendingInterest = Math.floor((currentPrincipal / 100) * daysAccrued);
    const totalAvailable = currentPrincipal + pendingInterest;

    // Determine withdrawal amount (partial vs full)
    const amountToWithdraw = requestedAmount && requestedAmount > 0
      ? Math.min(Math.floor(requestedAmount), totalAvailable)
      : totalAvailable;

    if (amountToWithdraw <= 0) {
      return { success: false, error: "Invalid withdrawal amount." };
    }

    // Check inventory 2.1B ceiling
    if (2100000000 - Number(char.zeny) < amountToWithdraw) {
      return {
        success: false,
        error: "Cannot withdraw: Resulting character inventory would exceed the 2,100,000,000 Zeny ceiling.",
      };
    }

    // 4. Execute atomic mutations on Primary DB
    await primaryExecute(
      "UPDATE `char` SET zeny = zeny + ? WHERE char_id = ?",
      [amountToWithdraw, charId]
    );

    const isFullWithdrawal = amountToWithdraw >= totalAvailable;
    let newPrincipal = 0;

    if (isFullWithdrawal) {
      await primaryExecute(
        "UPDATE `solo_bank_account` SET principal = 0, deposit_time = 0, interest_paid_total = interest_paid_total + ? WHERE account_id = ?",
        [pendingInterest, accountId]
      );
    } else {
      // Partial withdrawal: roll accrued interest into principal, deduct withdrawn amount, reset timer
      newPrincipal = totalAvailable - amountToWithdraw;
      await primaryExecute(
        "UPDATE `solo_bank_account` SET principal = ?, deposit_time = ?, interest_paid_total = interest_paid_total + ? WHERE account_id = ?",
        [newPrincipal, currentTimestamp, pendingInterest, accountId]
      );
    }

    const remainingZeny = Number(char.zeny) + amountToWithdraw;

    return {
      success: true,
      message: `Successfully withdrew ${amountToWithdraw.toLocaleString()} Z (Interest credited: ${pendingInterest.toLocaleString()} Z).`,
      newPrincipal,
      interestPaid: pendingInterest,
      totalPayout: amountToWithdraw,
      remainingZeny,
    };
  }
}
