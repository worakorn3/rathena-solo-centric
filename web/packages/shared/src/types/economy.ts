export interface StockHolding {
  ticker: string;
  name: string;
  assetType?: "EQUITY" | "CRYPTO";
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
  assetType?: "EQUITY" | "CRYPTO";
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
  municipalMarketValue: number;
  cryptoMarketValue: number;
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
  equitiesMood?: number;
  equitiesDrift?: number;
  cryptoMood?: number;
  cryptoDrift?: number;
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

export interface TickerNewsResponse {
  success: boolean;
  ticker: string;
  activeEvents: StockActiveEvent[];
  historicalEvents: StockEventLog[];
}

export interface StockCandle {
  time: number | string; // Unix timestamp in seconds (for intraday) or 'YYYY-MM-DD' (for daily)
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface StockHistoryResponse {
  success: boolean;
  ticker: string;
  timeframe: string;
  candles: StockCandle[];
}

export interface AssetVocabulary {
  classLabel: string;
  badgeLabel: string;
  unitLabel: string;
  unitAbbr: string;
  yieldLabel: string;
  yieldRateLabel: string;
  rewardsLabel: string;
  reinvestLabel: string;
  valuationLabel: string;
  splitLabel: string;
  profileHeader: string;
  tradeGuidance: string;
}

export const ASSET_VOCABULARY: Record<"EQUITY" | "CRYPTO", AssetVocabulary> = {
  EQUITY: {
    classLabel: "Municipal Equities",
    badgeLabel: "Municipal Equity",
    unitLabel: "Shares",
    unitAbbr: "sh",
    yieldLabel: "Dividend",
    yieldRateLabel: "Dividend Yield",
    rewardsLabel: "Pending Dividends",
    reinvestLabel: "DRIP Reinvestment",
    valuationLabel: "Market Capitalization",
    splitLabel: "Stock Split",
    profileHeader: "Municipal Profile & Heritage",
    tradeGuidance: "Physical share certificates traded via registered City Hall Brokers in Prontera and municipal halls.",
  },
  CRYPTO: {
    classLabel: "Crypto Protocols",
    badgeLabel: "Crypto Protocol",
    unitLabel: "Tokens",
    unitAbbr: "tokens",
    yieldLabel: "Staking APY",
    yieldRateLabel: "Staking Yield",
    rewardsLabel: "Claimable Rewards",
    reinvestLabel: "Auto-Compound",
    valuationLabel: "Total Value Locked (TVL)",
    splitLabel: "Token Rebase",
    profileHeader: "Protocol Whitepaper & Tokenomics",
    tradeGuidance: "Tokens swapped & staked via Rune Protocol Contracts, Kafra DEX, and decentralized liquidity pools.",
  },
};

export function getAssetVocabulary(assetType?: string): AssetVocabulary {
  if (assetType === "CRYPTO") {
    return ASSET_VOCABULARY.CRYPTO;
  }
  return ASSET_VOCABULARY.EQUITY;
}

export interface TradeStockPayload {
  ticker: string;
  action: "BUY" | "SELL";
  shares: number;
  charId: number;
  destination?: "WALLET" | "BANK";
}

export interface TradeStockResponse {
  success: boolean;
  error?: string;
  message?: string;
  executedShares?: number;
  pricePerShare?: number;
  totalAmount?: number;
  remainingZeny?: number;
  newBankPrincipal?: number;
  destination?: "WALLET" | "BANK";
  updatedHolding?: StockHolding;
}

export interface BankDepositPayload {
  charId: number;
  amount: number;
}

export interface BankWithdrawPayload {
  charId: number;
  amount?: number;
}

export interface BankTransactionResponse {
  success: boolean;
  error?: string;
  message?: string;
  newPrincipal?: number;
  feePaid?: number;
  interestPaid?: number;
  totalPayout?: number;
  remainingZeny?: number;
}

export const CRYPTO_TICKERS = ["EMP", "YMI", "WRP", "SHD", "ZEX", "ORA", "POR", "NZN", "ALM", "KFX"] as const;
export type CryptoTicker = typeof CRYPTO_TICKERS[number];

export function isCryptoAsset(ticker: string, assetType?: string): boolean {
  if (assetType === "CRYPTO") return true;
  if (assetType === "EQUITY") return false;
  return (CRYPTO_TICKERS as readonly string[]).includes(ticker.toUpperCase().trim());
}


