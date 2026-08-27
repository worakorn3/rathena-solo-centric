import { query, queryOne, primaryExecute, primaryQuery, primaryQueryOne } from "../db/pool";
import {
  BankData,
  NetWorthSummary,
  StockActiveEvent,
  StockEventLog,
  TickerNewsResponse,
  StockHolding,
  StockMarketQuote,
  DailyBounty,
  BountyPlayerHolding,
  BountyQuotaSummary,
  PlayerBountyInventoryResponse,
  SellBountyResponse,
  StockCandle,
  StockHistoryResponse,
  TradeStockResponse,
  StockTransaction,
  StockTransactionAction,
  StockTransactionsResponse,
  DripToggleResponse,
  HarvestDividendsResponse,
  isCryptoAsset,
  getJobName
} from "@rathena/shared";

export function getRAthenaDayOfYear(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay) - 1; // 0 to 365
}

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
        dripEnabled: Boolean(p.drip_enabled),
        dripCarryover: Number(p.drip_carryover) || 0,
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
   * Get player inventory matching active daily bounties with recommendations and quota
   */
  static async getPlayerBounties(accountId: number, charId: number): Promise<PlayerBountyInventoryResponse> {
    try {
      // 1. Fetch character info
      const charRow = await queryOne<{
        char_id: number;
        name: string;
        class: number;
        base_level: number;
        zeny: number;
        online: number;
      }>(
        "SELECT `char_id`, `name`, `class`, `base_level`, `zeny`, `online` FROM `char` WHERE `char_id` = ? AND `account_id` = ? LIMIT 1",
        [charId, accountId]
      );

      if (!charRow) {
        return { success: false, error: "Character not found or does not belong to this account." };
      }

      // 2. Fetch Daily Quota Variables
      const accRegRows = await query<{ key: string; value: number }>(
        "SELECT `key`, `value` FROM `acc_reg_num` WHERE `account_id` = ? AND `key` IN ('#DailyJunkSold', '#LastJunkDay', '#TotalJunkSold', '#LifetimeZenyEarned')",
        [accountId]
      );

      let rawDailySold = 0;
      let lastJunkDay = -1;
      let lifetimeSold = 0;
      let lifetimeZeny = 0;

      for (const r of accRegRows) {
        if (r.key === "#DailyJunkSold") rawDailySold = Number(r.value) || 0;
        if (r.key === "#LastJunkDay") lastJunkDay = Number(r.value);
        if (r.key === "#TotalJunkSold") lifetimeSold = Number(r.value) || 0;
        if (r.key === "#LifetimeZenyEarned") lifetimeZeny = Number(r.value) || 0;
      }

      const currentDayOfYear = getRAthenaDayOfYear();
      const dailySold = (lastJunkDay === currentDayOfYear) ? rawDailySold : 0;
      const dailyLimit = 100;
      const remainingQuota = Math.max(0, dailyLimit - dailySold);

      // 3. Fetch Inventory items on hand (equip = 0)
      const invRows = await query<{ nameid: number; total_amount: number }>(
        "SELECT `nameid`, SUM(`amount`) as `total_amount` FROM `inventory` WHERE `char_id` = ? AND `equip` = 0 GROUP BY `nameid`",
        [charId]
      );
      const invMap = new Map<number, number>();
      for (const r of invRows) {
        invMap.set(Number(r.nameid), Number(r.total_amount) || 0);
      }

      // 4. Fetch Storage items (equip = 0)
      const storRows = await query<{ nameid: number; total_amount: number }>(
        "SELECT `nameid`, SUM(`amount`) as `total_amount` FROM `storage` WHERE `account_id` = ? AND `equip` = 0 GROUP BY `nameid`",
        [accountId]
      );
      const storMap = new Map<number, number>();
      for (const r of storRows) {
        storMap.set(Number(r.nameid), Number(r.total_amount) || 0);
      }

      // 5. Fetch Daily Bounties and annotate
      const dailyBounties = await this.getDailyBounties();
      const allBounties: BountyPlayerHolding[] = dailyBounties.map((b) => {
        const inInventory = invMap.get(b.itemId) || 0;
        const inStorage = storMap.get(b.itemId) || 0;
        const totalAvailable = inInventory + inStorage;
        const potentialZeny = inInventory * b.price;
        const isRecommended = inInventory > 0;

        return {
          ...b,
          inInventory,
          inStorage,
          totalAvailable,
          potentialZeny,
          isRecommended,
        };
      });

      const recommendedOnHand = allBounties.filter((b) => b.inInventory > 0);

      return {
        success: true,
        character: {
          charId: charRow.char_id,
          name: charRow.name,
          className: getJobName(charRow.class),
          baseLevel: charRow.base_level,
          zeny: Number(charRow.zeny) || 0,
          online: Boolean(charRow.online),
        },
        quota: {
          dailyLimit,
          dailySold,
          remainingQuota,
          lastJunkDay,
          currentDayOfYear,
          lifetimeSold,
          lifetimeZeny,
        },
        recommendedOnHand,
        allBounties,
      };
    } catch (err) {
      console.error("[EconomyService] Failed to get player bounty inventory", err);
      return { success: false, error: "Internal error retrieving bounty inventory." };
    }
  }

  /**
   * Execute Direct Web Bounty Sale
   * Mutates primary DB: inventory/storage -> char.zeny -> acc_reg_num (#DailyJunkSold, etc.)
   */
  static async sellBountyItem(
    accountId: number,
    charId: number,
    itemId: number,
    rawAmount: number,
    source: "INVENTORY" | "STORAGE" | "AUTO" = "INVENTORY"
  ): Promise<SellBountyResponse> {
    const amount = Math.floor(Number(rawAmount));
    if (!amount || amount <= 0) {
      return { success: false, error: "Invalid item quantity specified." };
    }

    try {
      // 1. Verify character ownership and OFFLINE status
      const char = await primaryQueryOne<{
        char_id: number;
        name: string;
        zeny: number;
        online: number;
      }>(
        "SELECT `char_id`, `name`, `zeny`, `online` FROM `char` WHERE `char_id` = ? AND `account_id` = ?",
        [charId, accountId]
      );

      if (!char) {
        return { success: false, error: "Character not found or does not belong to this account." };
      }

      if (char.online === 1) {
        return {
          success: false,
          error: "Character is currently logged into the game. Please log out before turning in bounties via Web Terminal to prevent state desync.",
        };
      }

      // 2. Verify item is in today's active bounty roster
      const bounties = await this.getDailyBounties();
      const bounty = bounties.find((b) => b.itemId === itemId);
      if (!bounty) {
        return {
          success: false,
          error: "This item is not currently active on today's Junk Trader bounty roster.",
        };
      }

      // 3. Verify Quota
      const accRegRows = await primaryQuery<{ key: string; value: number }>(
        "SELECT `key`, `value` FROM `acc_reg_num` WHERE `account_id` = ? AND `key` IN ('#DailyJunkSold', '#LastJunkDay', '#TotalJunkSold', '#LifetimeZenyEarned')",
        [accountId]
      );
      let rawDailySold = 0;
      let lastJunkDay = -1;
      let lifetimeSold = 0;
      let lifetimeZeny = 0;

      for (const r of accRegRows) {
        if (r.key === "#DailyJunkSold") rawDailySold = Number(r.value) || 0;
        if (r.key === "#LastJunkDay") lastJunkDay = Number(r.value);
        if (r.key === "#TotalJunkSold") lifetimeSold = Number(r.value) || 0;
        if (r.key === "#LifetimeZenyEarned") lifetimeZeny = Number(r.value) || 0;
      }

      const currentDayOfYear = getRAthenaDayOfYear();
      const dailySold = (lastJunkDay === currentDayOfYear) ? rawDailySold : 0;
      const dailyLimit = 100;
      const remainingQuota = Math.max(0, dailyLimit - dailySold);

      if (amount > remainingQuota) {
        return {
          success: false,
          error: `Turn-in amount (${amount}) exceeds your remaining daily quota (${remainingQuota} items remaining today).`,
        };
      }

      // 4. Verify & Deduct items from Inventory or Storage
      const selectedSource = (source || "INVENTORY").toUpperCase() as "INVENTORY" | "STORAGE" | "AUTO";
      let totalInBag = 0;
      let totalInStorage = 0;

      const invStacks = await primaryQuery<{ id: number; amount: number }>(
        "SELECT `id`, `amount` FROM `inventory` WHERE `char_id` = ? AND `nameid` = ? AND `equip` = 0 ORDER BY `amount` DESC",
        [charId, itemId]
      );
      totalInBag = invStacks.reduce((s, row) => s + Number(row.amount), 0);

      const storStacks = await primaryQuery<{ id: number; amount: number }>(
        "SELECT `id`, `amount` FROM `storage` WHERE `account_id` = ? AND `nameid` = ? AND `equip` = 0 ORDER BY `amount` DESC",
        [accountId, itemId]
      );
      totalInStorage = storStacks.reduce((s, row) => s + Number(row.amount), 0);

      if (selectedSource === "INVENTORY" && totalInBag < amount) {
        return {
          success: false,
          error: `Insufficient item quantity in backpack (available: ${totalInBag}, requested: ${amount}).`,
        };
      }

      if (selectedSource === "STORAGE" && totalInStorage < amount) {
        return {
          success: false,
          error: `Insufficient item quantity in storage (available: ${totalInStorage}, requested: ${amount}).`,
        };
      }

      if (selectedSource === "AUTO" && (totalInBag + totalInStorage) < amount) {
        return {
          success: false,
          error: `Insufficient total items in backpack and storage (available: ${totalInBag + totalInStorage}, requested: ${amount}).`,
        };
      }

      // Execute item deductions
      let remainingToDeduct = amount;

      if (selectedSource === "INVENTORY" || selectedSource === "AUTO") {
        for (const stack of invStacks) {
          if (remainingToDeduct <= 0) break;
          const stackAmt = Number(stack.amount);
          if (stackAmt <= remainingToDeduct) {
            await primaryExecute("DELETE FROM `inventory` WHERE `id` = ?", [stack.id]);
            remainingToDeduct -= stackAmt;
            totalInBag -= stackAmt;
          } else {
            await primaryExecute("UPDATE `inventory` SET `amount` = `amount` - ? WHERE `id` = ?", [remainingToDeduct, stack.id]);
            totalInBag -= remainingToDeduct;
            remainingToDeduct = 0;
          }
        }
      }

      if (remainingToDeduct > 0 && (selectedSource === "STORAGE" || selectedSource === "AUTO")) {
        for (const stack of storStacks) {
          if (remainingToDeduct <= 0) break;
          const stackAmt = Number(stack.amount);
          if (stackAmt <= remainingToDeduct) {
            await primaryExecute("DELETE FROM `storage` WHERE `id` = ?", [stack.id]);
            remainingToDeduct -= stackAmt;
            totalInStorage -= stackAmt;
          } else {
            await primaryExecute("UPDATE `storage` SET `amount` = `amount` - ? WHERE `id` = ?", [remainingToDeduct, stack.id]);
            totalInStorage -= remainingToDeduct;
            remainingToDeduct = 0;
          }
        }
      }

      // 5. Credit Zeny & Update Quota
      const payout = amount * bounty.price;
      const newZeny = Number(char.zeny) + payout;

      await primaryExecute("UPDATE `char` SET `zeny` = ? WHERE `char_id` = ?", [newZeny, charId]);

      const newDailySold = dailySold + amount;
      const newLifetimeSold = lifetimeSold + amount;
      const newLifetimeZeny = lifetimeZeny + payout;

      await primaryExecute(
        "REPLACE INTO `acc_reg_num` (`account_id`, `key`, `index`, `value`) VALUES (?, '#DailyJunkSold', 0, ?)",
        [accountId, newDailySold]
      );
      await primaryExecute(
        "REPLACE INTO `acc_reg_num` (`account_id`, `key`, `index`, `value`) VALUES (?, '#LastJunkDay', 0, ?)",
        [accountId, currentDayOfYear]
      );
      await primaryExecute(
        "REPLACE INTO `acc_reg_num` (`account_id`, `key`, `index`, `value`) VALUES (?, '#TotalJunkSold', 0, ?)",
        [accountId, newLifetimeSold]
      );
      await primaryExecute(
        "REPLACE INTO `acc_reg_num` (`account_id`, `key`, `index`, `value`) VALUES (?, '#LifetimeZenyEarned', 0, ?)",
        [accountId, newLifetimeZeny]
      );

      return {
        success: true,
        message: `Successfully turned in ${amount}x ${bounty.itemName} for +${payout.toLocaleString()} Zeny!`,
        soldItemId: itemId,
        soldItemName: bounty.itemName,
        soldAmount: amount,
        pricePerUnit: bounty.price,
        payoutZeny: payout,
        newCharZeny: newZeny,
        remainingInInventory: Math.max(0, totalInBag),
        remainingInStorage: Math.max(0, totalInStorage),
        quota: {
          dailyLimit,
          dailySold: newDailySold,
          remainingQuota: Math.max(0, dailyLimit - newDailySold),
          lastJunkDay: currentDayOfYear,
          currentDayOfYear,
          lifetimeSold: newLifetimeSold,
          lifetimeZeny: newLifetimeZeny,
        },
      };
    } catch (err) {
      console.error("[EconomyService] Failed to execute web bounty sell", err);
      return { success: false, error: "Failed to process bounty turn-in transaction." };
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
    rawShares: number,
    destination: "WALLET" | "BANK" = "WALLET"
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

      await primaryExecute(
        "INSERT INTO `solo_stock_transactions` (account_id, char_id, ticker, action, shares, price, total_amount, fee, destination) VALUES (?, ?, ?, 'BUY', ?, ?, ?, ?, 'WALLET')",
        [accountId, charId, cleanTicker, shares, price, totalRequired, tradeFee]
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

    const targetDest = (destination || "WALLET").toUpperCase() === "BANK" ? "BANK" : "WALLET";

    let remainingZeny = Number(char.zeny);
    let newBankPrincipal: number | undefined = undefined;

    if (targetDest === "WALLET") {
      // Wallet 2.1B cap protection
      if (Number(char.zeny) + netProceeds > 2100000000) {
        return {
          success: false,
          error: `Sale proceeds would exceed the 2,100,000,000 Zeny wallet limit. Available space: ${(2100000000 - Number(char.zeny)).toLocaleString()} Z. Choose 'BANK' destination or sell fewer shares.`,
        };
      }

      await primaryExecute(
        "UPDATE `char` SET zeny = zeny + ? WHERE char_id = ?",
        [netProceeds, charId]
      );
      remainingZeny = Number(char.zeny) + netProceeds;
    } else {
      // Bank 1.9B ceiling & interest crystallization (0% bank deposit fee)
      const bank = await primaryQueryOne<{ principal: number; deposit_time: number }>(
        "SELECT principal, deposit_time FROM `solo_bank_account` WHERE account_id = ?",
        [accountId]
      );

      const currentPrincipal = bank ? Number(bank.principal) || 0 : 0;
      const depositTime = bank ? Number(bank.deposit_time) || 0 : 0;

      const currentTimestamp = Math.floor(Date.now() / 1000);
      let pendingInterest = 0;
      if (currentPrincipal > 0 && depositTime > 0) {
        const elapsedSeconds = Math.max(0, currentTimestamp - depositTime);
        const daysAccrued = Math.min(Math.floor(elapsedSeconds / 86400), 10);
        pendingInterest = Math.floor((currentPrincipal / 100) * daysAccrued);
      }

      newBankPrincipal = currentPrincipal + pendingInterest + netProceeds;
      if (newBankPrincipal > 1900000000) {
        return {
          success: false,
          error: `Sale proceeds would exceed the 1,900,000,000 Zeny Investment Bank ceiling. Available space: ${Math.max(0, 1900000000 - (currentPrincipal + pendingInterest)).toLocaleString()} Z. Sell fewer shares or withdraw from bank.`,
        };
      }

      await primaryExecute(
        "INSERT INTO `solo_bank_account` (account_id, principal, deposit_time, interest_paid_total) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE principal = VALUES(principal), deposit_time = VALUES(deposit_time), interest_paid_total = interest_paid_total + ?",
        [accountId, newBankPrincipal, currentTimestamp, pendingInterest, pendingInterest]
      );
    }

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

    await primaryExecute(
      "INSERT INTO `solo_stock_transactions` (account_id, char_id, ticker, action, shares, price, total_amount, fee, destination) VALUES (?, ?, ?, 'SELL', ?, ?, ?, ?, ?)",
      [accountId, charId, cleanTicker, shares, price, netProceeds, tradeFee, targetDest]
    );

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

    const destMsg = targetDest === "BANK"
      ? ` Proceeds wired to Investment Bank (New Principal: ${newBankPrincipal?.toLocaleString()} Z).`
      : "";

    return {
      success: true,
      message: `Sold ${shares.toLocaleString()} ${cleanTicker} shares for ${grossProceeds.toLocaleString()} Z (Net: ${netProceeds.toLocaleString()} Z after ${tradeFee.toLocaleString()} Z fee).${destMsg}`,
      executedShares: shares,
      pricePerShare: price,
      totalAmount: netProceeds,
      remainingZeny,
      newBankPrincipal,
      destination: targetDest,
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

  /**
   * Toggle DRIP (Dividend Reinvestment Plan) on/off for a holding
   */
  static async toggleDrip(
    accountId: number,
    ticker: string,
    enabled: boolean
  ): Promise<DripToggleResponse> {
    const cleanTicker = (ticker || "").trim().toUpperCase();
    if (!cleanTicker) {
      return { success: false, error: "Invalid ticker specified." };
    }

    const holding = await primaryQueryOne<{ ticker: string; shares: number }>(
      "SELECT ticker, shares FROM `solo_stock_player` WHERE account_id = ? AND ticker = ?",
      [accountId, cleanTicker]
    );

    if (!holding || Number(holding.shares) <= 0) {
      return { success: false, error: `You do not hold any active position in ${cleanTicker}.` };
    }

    const flag = enabled ? 1 : 0;
    await primaryExecute(
      "UPDATE `solo_stock_player` SET drip_enabled = ? WHERE account_id = ? AND ticker = ?",
      [flag, accountId, cleanTicker]
    );

    return {
      success: true,
      ticker: cleanTicker,
      dripEnabled: Boolean(flag),
      message: `DRIP for ${cleanTicker} is now ${flag ? "enabled (dividends will auto-reinvest at midnight)" : "disabled (cash dividends will accumulate)"}.`,
    };
  }

  /**
   * Harvest accrued dividends / staking yields
   * Precondition: DRIP must be disabled (drip_enabled === 0) for harvested positions.
   * Calculates sovereign dividend tax (DivTaxRate from solo_stock_meta).
   * Routes payout to character WALLET (offline check, MAX_ZENY check) or Investment BANK (1.9B ceiling).
   * Writes immutable audit row to solo_stock_transactions.
   */
  static async harvestDividends(
    accountId: number,
    charId?: number,
    ticker?: string,
    destination: "WALLET" | "BANK" = "WALLET"
  ): Promise<HarvestDividendsResponse> {
    const cleanTicker = (ticker || "").trim().toUpperCase();
    const targetDest = (destination || "WALLET").toUpperCase() === "BANK" ? "BANK" : "WALLET";

    // 1. Fetch player positions
    let playerRows: { ticker: string; pending_div: number; drip_enabled: number }[] = [];
    if (cleanTicker) {
      const row = await primaryQueryOne<{ ticker: string; pending_div: number; drip_enabled: number }>(
        "SELECT ticker, pending_div, drip_enabled FROM `solo_stock_player` WHERE account_id = ? AND ticker = ?",
        [accountId, cleanTicker]
      );
      if (!row) {
        return { success: false, error: `No holding found for ${cleanTicker}.` };
      }
      playerRows = [row];
    } else {
      const rows = await primaryExecute(
        "SELECT ticker, pending_div, drip_enabled FROM `solo_stock_player` WHERE account_id = ? AND pending_div > 0",
        [accountId]
      );
      if (Array.isArray(rows)) {
        playerRows = rows as any;
      }
    }

    if (playerRows.length === 0) {
      return { success: false, error: "No accrued dividends or staking yields to harvest." };
    }

    // 2. Enforce DRIP Precondition: Cannot harvest while DRIP is active
    const dripActiveRows = playerRows.filter((r) => Number(r.drip_enabled) === 1);
    if (cleanTicker && dripActiveRows.length > 0) {
      return {
        success: false,
        error: `Cannot harvest dividends while DRIP is active for ${cleanTicker}. Please toggle DRIP OFF before harvesting.`,
      };
    }

    // For harvest all, only harvest eligible positions where DRIP is OFF
    const eligibleRows = playerRows.filter((r) => Number(r.drip_enabled) === 0 && Number(r.pending_div) > 0);
    if (eligibleRows.length === 0) {
      return {
        success: false,
        error: "All positions with accrued dividends have DRIP enabled. Please toggle DRIP OFF to harvest cash dividends.",
      };
    }

    const grossAccrued = eligibleRows.reduce((sum, r) => sum + Number(r.pending_div), 0);
    if (grossAccrued <= 0) {
      return { success: false, error: "No accrued dividends available for harvest." };
    }

    // 3. Tax Calculation
    const taxMeta = await primaryQueryOne<{ mval: number }>(
      "SELECT mval FROM `solo_stock_meta` WHERE mkey = 'DivTaxRate'"
    );
    const taxRate = taxMeta ? Number(taxMeta.mval) || 10 : 10;
    const taxDeduction = Math.floor((grossAccrued * taxRate) / 100);
    const netPayout = grossAccrued - taxDeduction;

    if (netPayout <= 0) {
      return { success: false, error: "Net dividend distribution amount is 0 Z." };
    }

    // 4. Character & Destination Routing
    let remainingZeny: number | undefined = undefined;
    let newBankPrincipal: number | undefined = undefined;
    let targetCharId = charId ? Number(charId) : 0;

    if (targetDest === "WALLET") {
      if (!targetCharId) {
        return { success: false, error: "A character must be selected to receive wallet dividends." };
      }

      const char = await primaryQueryOne<{ char_id: number; zeny: number; online: number }>(
        "SELECT char_id, zeny, online FROM `char` WHERE char_id = ? AND account_id = ?",
        [targetCharId, accountId]
      );

      if (!char) {
        return { success: false, error: "Selected character does not belong to this account." };
      }

      if (char.online === 1) {
        return {
          success: false,
          error: "Character is currently online in the game. Please log out before harvesting via Web Terminal.",
        };
      }

      if (Number(char.zeny) + netPayout > 2100000000) {
        return {
          success: false,
          error: `Dividend payout would exceed the 2,100,000,000 Zeny character wallet limit. Available space: ${(2100000000 - Number(char.zeny)).toLocaleString()} Z. Choose 'BANK' destination.`,
        };
      }

      await primaryExecute(
        "UPDATE `char` SET zeny = zeny + ? WHERE char_id = ?",
        [netPayout, targetCharId]
      );
      remainingZeny = Number(char.zeny) + netPayout;
    } else {
      // Direct Wire to Investment Bank
      const bank = await primaryQueryOne<{ principal: number; deposit_time: number }>(
        "SELECT principal, deposit_time FROM `solo_bank_account` WHERE account_id = ?",
        [accountId]
      );

      const currentPrincipal = bank ? Number(bank.principal) || 0 : 0;
      const depositTime = bank ? Number(bank.deposit_time) || 0 : 0;
      const currentTimestamp = Math.floor(Date.now() / 1000);

      let pendingInterest = 0;
      if (currentPrincipal > 0 && depositTime > 0) {
        const elapsedSeconds = Math.max(0, currentTimestamp - depositTime);
        const daysAccrued = Math.min(Math.floor(elapsedSeconds / 86400), 10);
        pendingInterest = Math.floor((currentPrincipal / 100) * daysAccrued);
      }

      newBankPrincipal = currentPrincipal + pendingInterest + netPayout;
      if (newBankPrincipal > 1900000000) {
        return {
          success: false,
          error: `Dividend wire would exceed the 1,900,000,000 Zeny Investment Bank ceiling. Available space: ${Math.max(0, 1900000000 - (currentPrincipal + pendingInterest)).toLocaleString()} Z.`,
        };
      }

      await primaryExecute(
        "INSERT INTO `solo_bank_account` (account_id, principal, deposit_time, interest_paid_total) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE principal = VALUES(principal), deposit_time = VALUES(deposit_time), interest_paid_total = interest_paid_total + ?",
        [accountId, newBankPrincipal, currentTimestamp, pendingInterest, pendingInterest]
      );
    }

    // 5. Reset pending_div on harvested positions & Write Transaction Logs
    for (const row of eligibleRows) {
      await primaryExecute(
        "UPDATE `solo_stock_player` SET pending_div = 0 WHERE account_id = ? AND ticker = ?",
        [accountId, row.ticker]
      );

      const rowGross = Number(row.pending_div);
      const rowTax = Math.floor((rowGross * taxRate) / 100);
      const rowNet = rowGross - rowTax;

      await primaryExecute(
        "INSERT INTO `solo_stock_transactions` (account_id, char_id, ticker, action, shares, price, total_amount, fee, destination) VALUES (?, ?, ?, 'DIVIDEND', 0, 0, ?, ?, ?)",
        [accountId, targetCharId, row.ticker, rowNet, rowTax, targetDest]
      );
    }

    const destLabel = targetDest === "BANK" ? "wired to Investment Bank" : "credited to character wallet";
    return {
      success: true,
      message: `Harvested ${netPayout.toLocaleString()} Z in net dividends (Tax: ${taxDeduction.toLocaleString()} Z @ ${taxRate}%) ${destLabel}.`,
      grossAccrued,
      taxDeduction,
      taxRate,
      netPayout,
      destination: targetDest,
      remainingZeny,
      newBankPrincipal,
    };
  }

  /**
   * Fetch paginated & filtered stock / crypto transaction history
   */
  static async getStockTransactions(
    accountId: number,
    limit = 50,
    ticker?: string,
    assetType?: "EQUITY" | "CRYPTO",
    action?: StockTransactionAction
  ): Promise<StockTransactionsResponse> {
    try {
      const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 100);
      const params: any[] = [accountId];
      let sql = `
        SELECT 
          t.id, t.account_id, t.char_id, t.ticker, t.action, 
          t.shares, t.price, t.total_amount, t.fee, t.destination, t.created_at,
          COALESCE(m.name, CONCAT(t.ticker, ' Protocol')) as stock_name,
          COALESCE(m.asset_type, 'EQUITY') as asset_type,
          c.name as char_name
        FROM \`solo_stock_transactions\` t
        LEFT JOIN \`solo_stock_market\` m ON t.ticker = m.ticker
        LEFT JOIN \`char\` c ON t.char_id = c.char_id
        WHERE t.account_id = ?
      `;

      if (ticker) {
        sql += " AND t.ticker = ?";
        params.push(ticker.trim().toUpperCase());
      }
      if (action) {
        sql += " AND t.action = ?";
        params.push(action);
      }
      if (assetType) {
        sql += " AND COALESCE(m.asset_type, 'EQUITY') = ?";
        params.push(assetType);
      }

      sql += " ORDER BY t.id DESC LIMIT ?";
      params.push(safeLimit);

      const rows = await query<any>(sql, params);
      const transactions: StockTransaction[] = rows.map((r) => ({
        id: Number(r.id),
        accountId: Number(r.account_id),
        charId: Number(r.char_id),
        charName: r.char_name || undefined,
        ticker: r.ticker,
        stockName: r.stock_name,
        assetType: r.asset_type as "EQUITY" | "CRYPTO",
        action: r.action as StockTransactionAction,
        shares: Number(r.shares),
        price: Number(r.price),
        totalAmount: Number(r.total_amount),
        fee: Number(r.fee),
        destination: r.destination as "WALLET" | "BANK",
        createdAt: new Date(r.created_at).toISOString(),
      }));

      return {
        success: true,
        transactions,
        total: transactions.length,
      };
    } catch (err) {
      console.error("[EconomyService] getStockTransactions failed:", err);
      return { success: false, error: "Failed to fetch transaction logs", transactions: [] };
    }
  }
}
