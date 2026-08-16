import { query } from "../db/pool";
import {
  BankData,
  NetWorthSummary,
  StockHolding,
  StockMarketQuote,
  getJobName
} from "@rathena/shared";

const STOCK_NAMES: Record<string, string> = {
  PRT: "Prontera Capital Inc.",
  GEF: "Geffen Arcanetech",
  MOR: "Morroc Oasis Trading",
  PAY: "Payon Timber & Craft",
  ALB: "Alberta Maritime Logistics",
  JIN: "Juno Industrial",
  VNG: "Vanguard Security",
  SHA: "Shadow Guild Guild",
  RGC: "Ragnarok Global Corp",
  PSC: "Prontera Steelworks",
  GNG: "Geffenia Energy",
  XRO: "X-Rune Corp",
  GRM: "Goram Minerals",
  DOP: "Doppelganger Logistics",
  POR: "Poring Co."
};

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
        "SELECT ticker, price, price_old, dividend, div_acc, split_count FROM `solo_stock_market` ORDER BY ticker ASC"
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
        name: STOCK_NAMES[m.ticker] || `${m.ticker} Enterprises`,
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
        name: STOCK_NAMES[p.ticker] || `${p.ticker} Enterprises`,
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
    };
  }

  static async getMarketQuotes(): Promise<StockMarketQuote[]> {
    try {
      const marketRows = await query<StockMarketRow>(
        "SELECT ticker, price, price_old, dividend, div_acc, split_count FROM `solo_stock_market` ORDER BY ticker ASC"
      );

      return marketRows.map((m) => {
        const price = Number(m.price) || 0;
        const priceOld = Number(m.price_old) || price;
        const changeAmount = price - priceOld;
        const changePercent = priceOld > 0 ? Number(((changeAmount / priceOld) * 100).toFixed(2)) : 0;

        return {
          ticker: m.ticker,
          name: STOCK_NAMES[m.ticker] || `${m.ticker} Enterprises`,
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
}
