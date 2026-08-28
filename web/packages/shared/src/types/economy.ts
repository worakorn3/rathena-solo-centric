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
  dripEnabled: boolean;
  dripCarryover: number;
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

export interface BankConfig {
  dailyInterestRate: number; // e.g. 0.01 (100 bps)
  maxAccrualDays: number;    // e.g. 10
  depositFeeRate: number;    // e.g. 0.02 (200 bps)
  depositFeeDivisor: number; // e.g. 50 (10000 / 200)
  maxPrincipalLimit: number; // e.g. 1,900,000,000
  minDepositZeny: number;    // e.g. 100
  secondsPerDay: number;     // 86,400
}

export const DEFAULT_BANK_CONFIG: BankConfig = {
  dailyInterestRate: 0.01,
  maxAccrualDays: 10,
  depositFeeRate: 0.02,
  depositFeeDivisor: 50,
  maxPrincipalLimit: 1_900_000_000,
  minDepositZeny: 100,
  secondsPerDay: 86_400,
};

export const MAX_CHARACTER_ZENY = 2_100_000_000;

export interface BankAccrualResult {
  daysAccrued: number;
  pendingInterest: number;
  subdayRemainder: number;
  totalAvailable: number;
  isCapped: boolean;
}

export function calculateBankAccrual(
  principal: number,
  depositTime: number,
  config: BankConfig = DEFAULT_BANK_CONFIG,
  currentTimestamp: number = Math.floor(Date.now() / 1000)
): BankAccrualResult {
  let daysAccrued = 0;
  let pendingInterest = 0;
  let subdayRemainder = 0;

  if (principal > 0 && depositTime > 0) {
    const elapsedSeconds = Math.max(0, currentTimestamp - depositTime);
    const rawDays = Math.floor(elapsedSeconds / config.secondsPerDay);
    daysAccrued = Math.min(rawDays, config.maxAccrualDays);
    pendingInterest = Math.floor(principal * config.dailyInterestRate * daysAccrued);
    if (daysAccrued < config.maxAccrualDays) {
      subdayRemainder = elapsedSeconds % config.secondsPerDay;
    }
  }

  const totalAvailable = principal + pendingInterest;
  const isCapped = daysAccrued >= config.maxAccrualDays;

  return {
    daysAccrued,
    pendingInterest,
    subdayRemainder,
    totalAvailable,
    isCapped,
  };
}

export interface BankData {
  principal: number;
  interestRate: number; // dynamically loaded from SQL (e.g. 0.01)
  maxDays: number; // dynamically loaded from SQL (e.g. 10)
  daysAccrued: number;
  pendingInterest: number;
  totalPayout: number;
  depositTimestamp: number;
  lastDepositDate: string;
  interestPaidTotal?: number;
  subdayProgressSeconds?: number;
  depositFeeRate?: number; // dynamically loaded from SQL (e.g. 0.02)
  maxPrincipalLimit?: number; // dynamically loaded from SQL (e.g. 1,900,000,000)
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

export interface BountyPlayerHolding {
  itemId: number;
  itemName: string;
  tier: number;
  index: number;
  price: number;
  mobName: string;
  mobLevel: number;
  inInventory: number;
  inStorage: number;
  totalAvailable: number;
  potentialZeny: number;
  isRecommended: boolean;
}

export interface BountyQuotaSummary {
  dailyLimit: number;
  dailySold: number;
  remainingQuota: number;
  lastJunkDay: number;
  currentDayOfYear: number;
  lifetimeSold: number;
  lifetimeZeny: number;
}

export interface PlayerBountyInventoryResponse {
  success: boolean;
  error?: string;
  character?: {
    charId: number;
    name: string;
    className: string;
    baseLevel: number;
    zeny: number;
    online: boolean;
  };
  quota?: BountyQuotaSummary;
  recommendedOnHand?: BountyPlayerHolding[];
  allBounties?: BountyPlayerHolding[];
}

export interface SellBountyPayload {
  charId: number;
  itemId: number;
  amount: number;
  source?: "INVENTORY" | "STORAGE" | "AUTO";
}

export interface SellBountyResponse {
  success: boolean;
  error?: string;
  message?: string;
  soldItemId?: number;
  soldItemName?: string;
  soldAmount?: number;
  pricePerUnit?: number;
  payoutZeny?: number;
  newCharZeny?: number;
  remainingInInventory?: number;
  remainingInStorage?: number;
  quota?: BountyQuotaSummary;
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

export type StockTransactionAction = "BUY" | "SELL" | "DIVIDEND" | "DRIP_BUY";

export interface StockTransaction {
  id: number;
  accountId: number;
  charId: number;
  charName?: string;
  ticker: string;
  stockName?: string;
  assetType: "EQUITY" | "CRYPTO";
  action: StockTransactionAction;
  shares: number;
  price: number;
  totalAmount: number;
  fee: number;
  destination: "WALLET" | "BANK";
  createdAt: string;
}

export interface StockTransactionsResponse {
  success: boolean;
  error?: string;
  transactions: StockTransaction[];
  total?: number;
}

export interface DripTogglePayload {
  ticker: string;
  enabled: boolean;
}

export interface DripToggleResponse {
  success: boolean;
  error?: string;
  ticker?: string;
  dripEnabled?: boolean;
  message?: string;
}

export interface HarvestDividendsPayload {
  charId?: number;
  ticker?: string;
  destination?: "WALLET" | "BANK";
}

export interface HarvestDividendsResponse {
  success: boolean;
  error?: string;
  message?: string;
  grossAccrued?: number;
  taxDeduction?: number;
  taxRate?: number;
  netPayout?: number;
  destination?: "WALLET" | "BANK";
  remainingZeny?: number;
  newBankPrincipal?: number;
}


