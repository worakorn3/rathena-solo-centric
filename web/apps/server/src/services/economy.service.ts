import { query } from "../db/pool";
import {
  BankData,
  NetWorthSummary,
  StockActiveEvent,
  StockEventLog,
  StockHolding,
  StockMarketQuote,
  DailyBounty,
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
  last_claim_acc: number;
  split_processed: number;
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
    const regRows = await query<AccRegRow>(
      "SELECT `key`, `value` FROM `acc_reg_num` WHERE account_id = ? AND `key` IN ('#INVEST_BALANCE', '#INVEST_TIME')",
      [accountId]
    );

    let investBalance = 0;
    let investTime = 0;

    for (const reg of regRows) {
      if (reg.key === "#INVEST_BALANCE") investBalance = Number(reg.value) || 0;
      if (reg.key === "#INVEST_TIME") investTime = Number(reg.value) || 0;
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
        "SELECT ticker, name, broker_title, sector, archetype, lore, price, price_old, dividend, div_acc, split_count FROM `solo_stock_market` WHERE enabled = 1 ORDER BY ticker ASC"
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

    const quoteMap = new Map(quotes.map((q) => [q.ticker, q]));

    // 4. Player Stock Holdings
    let playerStockRows: StockPlayerRow[] = [];
    try {
      playerStockRows = await query<StockPlayerRow>(
        "SELECT ticker, shares, total_cost, last_claim_acc, split_processed FROM `solo_stock_player` WHERE account_id = ? AND shares > 0",
        [accountId]
      );
    } catch {
      playerStockRows = [];
    }

    let stockMarketValue = 0;
    let stockTotalCost = 0;

    const holdings: StockHolding[] = playerStockRows.map((p) => {
      const shares = Number(p.shares) || 0;
      const totalCost = Number(p.total_cost) || 0;
      const lastClaimAcc = Number(p.last_claim_acc) || 0;
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

      const divAcc = quote ? quote.divAcc : 0;
      const pendingDividends = shares * Math.max(0, divAcc - lastClaimAcc);

      stockMarketValue += marketValue;
      stockTotalCost += totalCost;

      return {
        ticker: p.ticker,
        name: quote ? quote.name : `${p.ticker} Enterprises`,
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
    let marketMood = 0;
    let marketDrift = 0;
    try {
      activeEvents = await this.getActiveEvents();
      const history = await this.getEventHistory(1);
      latestEvent = history.length > 0 ? history[0] : null;

      const metaRows = await query<{ mkey: string; mval: number }>(
        "SELECT mkey, mval FROM `solo_stock_meta` WHERE mkey IN ('MarketMood', 'MarketDrift')"
      );
      for (const row of metaRows) {
        if (row.mkey === "MarketMood") marketMood = Number(row.mval);
        if (row.mkey === "MarketDrift") marketDrift = Number(row.mval);
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
      stockTotalCost,
      stockUnrealizedPnL,
      stockUnrealizedPnLPercent,
      characterZenyBreakdown,
      holdings,
      quotes,
      bank,
      activeEvents,
      latestEvent,
      marketMood,
      marketDrift,
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

  static async getEventHistory(limit = 20): Promise<StockEventLog[]> {
    try {
      const rows = await query<StockEventLogRow>(
        "SELECT log_id, event_id, event_name, category, ticker_target, headline, details, triggered_by, created_at FROM `solo_stock_events_log` ORDER BY log_id DESC LIMIT ?",
        [limit]
      );

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
}
