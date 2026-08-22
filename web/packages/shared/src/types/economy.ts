export interface StockHolding {
  ticker: string;
  name: string;
  sector?: string;
  archetype?: string;
  shares: number;
  totalCost: number;
  avgBuyPrice: number;
  currentPrice: number;
  priceOld: number;
  changeAmount: number;
  changePercent: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dividendRate: number;
  pendingDividends: number;
}

export interface StockMarketQuote {
  ticker: string;
  name: string;
  sector?: string;
  archetype?: string;
  lore?: string;
  price: number;
  priceOld: number;
  changeAmount: number;
  changePercent: number;
  dividend: number;
  divAcc: number;
  splitCount: number;
}

export interface BankData {
  principal: number;
  interestRate: number; // e.g. 0.01 (1% per day)
  maxDays: number; // 10 days max
  daysAccrued: number;
  pendingInterest: number;
  totalPayout: number;
  depositTimestamp: number;
  lastDepositDate: string;
}

export interface NetWorthSummary {
  totalNetWorth: number;
  liquidZeny: number;
  bankPrincipal: number;
  bankPendingInterest: number;
  bankTotal: number;
  stockMarketValue: number;
  stockTotalCost: number;
  stockUnrealizedPnL: number;
  stockUnrealizedPnLPercent: number;
  characterZenyBreakdown: {
    charId: number;
    name: string;
    className: string;
    baseLevel: number;
    zeny: number;
  }[];
  holdings: StockHolding[];
  quotes: StockMarketQuote[];
  bank: BankData;
  activeEvents?: StockActiveEvent[];
  latestEvent?: StockEventLog | null;
  marketMood?: number;
  marketDrift?: number;
}

export interface StockEventLog {
  logId: number;
  eventId: string;
  eventName: string;
  category: string;
  tickerTarget: string;
  headline: string;
  details: string;
  triggeredBy: string;
  createdAt: string;
}

export interface StockActiveEvent {
  id: number;
  eventId: string;
  ticker: string;
  startTime: number;
  endTime: number;
  remainingShifts: number;
  taxRateOverride: number;
  moodOverride: number;
  headline: string;
}

export interface DailyBounty {
  tier: number;
  index: number;
  itemId: number;
  itemName: string;
  price: number;
  mobName: string;
  mobLevel: number;
}
