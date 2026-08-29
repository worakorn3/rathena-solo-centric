import { describe, expect, it, mock, beforeEach } from "bun:test";

const queryMock = mock(() => Promise.resolve([]));
const queryOneMock = mock(() => Promise.resolve(null));
const primaryQueryMock = mock(() => Promise.resolve([]));
const primaryQueryOneMock = mock(() => Promise.resolve(null));
const primaryExecuteMock = mock(() => Promise.resolve({ affectedRows: 1 }));

mock.module("../src/db/pool", () => ({
  query: queryMock,
  queryOne: queryOneMock,
  primaryQuery: primaryQueryMock,
  primaryQueryOne: primaryQueryOneMock,
  primaryExecute: primaryExecuteMock,
}));

import { EconomyService } from "../src/services/economy.service";
import { TrackingService } from "../src/services/tracking.service";

describe("Phase 22 Financial Proxy & Stock Indices Suite", () => {
  beforeEach(() => {
    queryMock.mockClear();
    queryOneMock.mockClear();
    primaryQueryMock.mockClear();
    primaryQueryOneMock.mockClear();
    primaryExecuteMock.mockClear();
  });

  it("should calculate dynamic composite index prices from constituents in getNetWorthSummary", async () => {
    queryMock.mockImplementation(async (sql: string, params: any[]) => {
      if (sql.includes("FROM `char`")) {
        return [{ char_id: 150001, name: "Hero", class: 4001, base_level: 99, zeny: 100000 }];
      }
      if (sql.includes("FROM `acc_reg_num`")) {
        return [];
      }
      if (sql.includes("FROM `solo_stock_market`")) {
        return [
          { ticker: "PRON", name: "Prontera Capital", price: 120, price_old: 100, dividend: 4, asset_type: "EQUITY", trade_status: "TRADABLE" },
          { ticker: "GEFF", name: "Geffen Arcane", price: 180, price_old: 200, dividend: 6, asset_type: "EQUITY", trade_status: "TRADABLE" },
          { ticker: "MS500", name: "Midgard Sovereign ETF", price: 150, price_old: 150, dividend: 5, asset_type: "ETF", trade_status: "NON_TRADABLE", index_id: "MIDGARD_CORE" },
        ];
      }
      if (sql.includes("FROM `solo_stock_indices`")) {
        return [
          {
            index_id: "MIDGARD_CORE",
            name: "Midgard Sovereign Core Index",
            publisher: "Crown Ministry of Finance",
            sector: "Kingdom Composite",
            archetype: "Balanced Sovereign",
            lore: "Broad benchmark of Rune-Midgarts economic vitality.",
            constituents: JSON.stringify([
              { ticker: "PRON", weight: 0.5 },
              { ticker: "GEFF", weight: 0.5 },
            ]),
          },
        ];
      }
      if (sql.includes("FROM `solo_stock_player`")) {
        return [
          { ticker: "MS500", shares: 100, total_cost: 0, pending_div: 50, drip_enabled: 1, drip_carryover: 0 },
        ];
      }
      if (sql.includes("FROM `solo_stock_meta`")) {
        return [];
      }
      if (sql.includes("FROM `solo_stock_events_active`")) {
        return [];
      }
      return [];
    });

    const summary = await EconomyService.getNetWorthSummary(2000001);

    expect(summary).toBeDefined();
    expect(summary.indices).toBeDefined();
    expect(summary.indices!.length).toBe(1);

    const midx = summary.indices![0];
    expect(midx.indexId).toBe("MIDGARD_CORE");
    // (120 * 0.5) + (180 * 0.5) = 60 + 90 = 150
    expect(midx.price).toBe(150);
    // (100 * 0.5) + (200 * 0.5) = 50 + 100 = 150
    expect(midx.priceOld).toBe(150);
    expect(midx.changeAmount).toBe(0);

    // ETF holdings verification
    expect(summary.holdings.length).toBe(1);
    expect(summary.holdings[0].ticker).toBe("MS500");
    expect(summary.holdings[0].assetType).toBe("ETF");
    expect(summary.holdings[0].tradeStatus).toBe("NON_TRADABLE");
    expect(summary.etfMarketValue).toBe(15000); // 100 shares * 150 price
  });

  it("should guard and reject direct spot trades on NON_TRADABLE or TRACKED_ONLY assets", async () => {
    primaryQueryOneMock.mockImplementation(async (sql: string, params: any[]) => {
      if (sql.includes("FROM `char`")) {
        return { char_id: 150001, name: "Hero", zeny: 1000000, online: 0 };
      }
      if (sql.includes("FROM `solo_stock_market`")) {
        if (params[0] === "MS500") {
          return { ticker: "MS500", name: "Midgard Sovereign ETF", price: 150, enabled: 1, trade_status: "NON_TRADABLE" };
        }
        if (params[0] === "ALBE") {
          return { ticker: "ALBE", name: "Alberta Maritime", price: 90, enabled: 1, trade_status: "TRACKED_ONLY" };
        }
      }
      return null;
    });

    const etfTradeRes = await EconomyService.executeTrade(2000001, 150001, "MS500", "BUY", 10, "WALLET");
    expect(etfTradeRes.success).toBe(false);
    expect(etfTradeRes.error).toContain("not available for spot trading");

    const trackedTradeRes = await EconomyService.executeTrade(2000001, 150001, "ALBE", "BUY", 10, "WALLET");
    expect(trackedTradeRes.success).toBe(false);
    expect(trackedTradeRes.error).toContain("not available for spot trading");
  });

  it("should credit non-tradable stock rewards with zero cost basis upon claiming milestone", async () => {
    primaryQueryOneMock.mockImplementation(async (sql: string, params: any[]) => {
      if (sql.includes("FROM `char`")) {
        return { char_id: 150001, name: "Hero", class: 4001, base_level: 99 };
      }
      if (sql.includes("FROM `solo_milestones`")) {
        return {
          id: "grand_conqueror_etf",
          title: "Grand Realm Conqueror",
          category: "TOTAL",
          target_mob_id: 0,
          required_count: 5000,
          reward_zeny: 1000000,
          reward_item_id: 617,
          reward_item_amount: 1,
          reward_stock_ticker: "MS500",
          reward_stock_shares: 50,
          is_active: 1,
        };
      }
      if (sql.includes("FROM `solo_milestone_claims`")) {
        return null; // Not yet claimed
      }
      return null;
    });

    primaryQueryMock.mockImplementation(async (sql: string, params: any[]) => {
      if (sql.includes("solo_persistence_log")) {
        return [{ target_id: 0, value: 5000 }];
      }
      return [];
    });

    const claimRes = await TrackingService.claimMilestoneToRodex(2000001, 150001, "grand_conqueror_etf");
    expect(claimRes.success).toBe(true);

    // Verify primaryExecute calls: RODEX mail insert, milestone claim insert, stock player insert, stock transaction log
    const calls = primaryExecuteMock.mock.calls;
    const stockPlayerCall = calls.find((c) => String(c[0]).includes("solo_stock_player"));
    expect(stockPlayerCall).toBeDefined();
    // [accountId, ticker, shares]
    expect(stockPlayerCall![1]).toEqual([2000001, "MS500", 50]);

    const stockTxCall = calls.find((c) => String(c[0]).includes("solo_stock_transactions"));
    expect(stockTxCall).toBeDefined();
    expect(stockTxCall![1][0]).toBe(2000001); // account_id
    expect(stockTxCall![1][1]).toBe(150001); // char_id
    expect(stockTxCall![1][2]).toBe("MS500"); // ticker
    expect(stockTxCall![1][3]).toBe(50); // Shares
    expect(String(stockTxCall![0])).toContain("'DIVIDEND'");
  });

  it("should auto-seed 500 MS500 shares when a new account registers via AuthService.register", async () => {
    const { AuthService } = await import("../src/services/auth.service");

    queryOneMock.mockResolvedValueOnce(null); // No existing username
    primaryExecuteMock.mockResolvedValueOnce({ insertId: 2000099 }); // Insert login
    primaryExecuteMock.mockResolvedValueOnce({ affectedRows: 1 }); // Insert solo_stock_player

    const regRes = await AuthService.register({
      userid: "newcitizen",
      user_pass: "password123",
      email: "citizen@midgard.org",
      sex: "M",
    });

    expect("user" in regRes).toBe(true);
    if ("user" in regRes) {
      expect(regRes.user.accountId).toBe(2000099);
    }

    const calls = primaryExecuteMock.mock.calls;
    const seedCall = calls.find((c) => String(c[0]).includes("solo_stock_player"));
    expect(seedCall).toBeDefined();
    expect(seedCall![1]).toEqual([2000099]);
  });

  it("should auto-seed 500 MS500 shares in getNetWorthSummary if an in-game created account has no holdings yet", async () => {
    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM `char`")) {
        return [{ char_id: 150002, name: "InGamePlayer", class: 0, base_level: 1, zeny: 0 }];
      }
      if (sql.includes("FROM `solo_stock_player`")) {
        return []; // No holdings initially
      }
      return [];
    });

    const summary = await EconomyService.getNetWorthSummary(2000100);
    expect(summary.holdings.length).toBe(1);
    expect(summary.holdings[0].ticker).toBe("MS500");
    expect(summary.holdings[0].shares).toBe(500);

    const calls = primaryExecuteMock.mock.calls;
    const insertIgnoreCall = calls.find((c) => String(c[0]).includes("INSERT IGNORE INTO `solo_stock_player`"));
    expect(insertIgnoreCall).toBeDefined();
    expect(insertIgnoreCall![1]).toEqual([2000100]);
  });

  it("should calculate ALL_WORLD composite benchmark and allow spot trading on WORLD ETF", async () => {
    // 1. Test getNetWorthSummary with ALL_WORLD index and WORLD ETF
    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM `char`")) {
        return [{ char_id: 150001, name: "Hero", class: 4001, base_level: 99, zeny: 500000 }];
      }
      if (sql.includes("FROM `solo_stock_market`")) {
        return [
          { ticker: "PRT", name: "Prontera Capital", price: 100, price_old: 100, dividend: 3, asset_type: "EQUITY", trade_status: "TRADABLE" },
          { ticker: "LHZ", name: "Rekenber Biotech", price: 200, price_old: 180, dividend: 0, asset_type: "EQUITY", trade_status: "TRADABLE" },
          { ticker: "WORLD", name: "Pan-Midgard All-World ETF", price: 150, price_old: 140, dividend: 3, asset_type: "ETF", trade_status: "TRADABLE", index_id: "ALL_WORLD" },
        ];
      }
      if (sql.includes("FROM `solo_stock_indices`")) {
        return [
          {
            index_id: "ALL_WORLD",
            name: "Pan-Midgard All-World Index (WORLD)",
            publisher: "Inter-Realm Trade Commission",
            sector: "Global Total Market (All-Cap)",
            archetype: "Global Diversified Sovereign Equity",
            lore: "The ultimate macro benchmark capturing 27 municipal and industrial economies across 5 continents.",
            constituents: JSON.stringify([
              { ticker: "PRT", weight: 0.5 },
              { ticker: "LHZ", weight: 0.5 },
            ]),
          },
        ];
      }
      if (sql.includes("FROM `solo_stock_player`")) {
        return [
          { ticker: "WORLD", shares: 200, total_cost: 28000, pending_div: 100, drip_enabled: 0, drip_carryover: 0 },
          { ticker: "MS500", shares: 500, total_cost: 0, pending_div: 0, drip_enabled: 1, drip_carryover: 0 },
        ];
      }
      return [];
    });

    const summary = await EconomyService.getNetWorthSummary(2000001);
    expect(summary.indices).toBeDefined();
    const worldIndex = summary.indices!.find((i) => i.indexId === "ALL_WORLD");
    expect(worldIndex).toBeDefined();
    // (100 * 0.5) + (200 * 0.5) = 50 + 100 = 150
    expect(worldIndex!.price).toBe(150);
    // (100 * 0.5) + (180 * 0.5) = 50 + 90 = 140
    expect(worldIndex!.priceOld).toBe(140);
    expect(worldIndex!.changeAmount).toBe(10);

    // Verify holding
    const worldHolding = summary.holdings.find((h) => h.ticker === "WORLD");
    expect(worldHolding).toBeDefined();
    expect(worldHolding!.tradeStatus).toBe("TRADABLE");
    expect(worldHolding!.marketValue).toBe(30000); // 200 * 150

    // 2. Test Spot Trading Execution on WORLD ETF (TRADABLE status)
    primaryQueryOneMock.mockImplementation(async (sql: string, params: any[]) => {
      if (sql.includes("FROM `char`")) {
        return { char_id: 150001, name: "Hero", zeny: 1000000, online: 0 };
      }
      if (sql.includes("FROM `solo_stock_market`") && params[0] === "WORLD") {
        return { ticker: "WORLD", name: "Pan-Midgard All-World ETF", price: 150, enabled: 1, trade_status: "TRADABLE", asset_type: "ETF" };
      }
      return null;
    });

    const buyTradeRes = await EconomyService.executeTrade(2000001, 150001, "WORLD", "BUY", 10, "WALLET");
    expect(buyTradeRes.success).toBe(true);
    expect(buyTradeRes.executedShares).toBe(10);
    expect(buyTradeRes.pricePerShare).toBe(150);
  });
});
