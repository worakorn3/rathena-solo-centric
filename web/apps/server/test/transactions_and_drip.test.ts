import { describe, expect, it, mock, beforeEach } from "bun:test";

// Mock DB pool BEFORE importing the service
const queryMock = mock(() => Promise.resolve([]));
const queryOneMock = mock(() => Promise.resolve(null));
const primaryExecuteMock = mock(() => Promise.resolve({ affectedRows: 1, insertId: 1 }));
const primaryQueryMock = mock(() => Promise.resolve([]));
const primaryQueryOneMock = mock(() => Promise.resolve(null));

mock.module("../src/db/pool", () => ({
  query: queryMock,
  queryOne: queryOneMock,
  primaryExecute: primaryExecuteMock,
  primaryQuery: primaryQueryMock,
  primaryQueryOne: primaryQueryOneMock,
}));

import { EconomyService } from "../src/services/economy.service";
import { MarketSimulationService } from "../src/services/marketSimulation.service";

describe("Stock & Crypto Transactions & DRIP Automation Suite", () => {
  beforeEach(() => {
    queryMock.mockClear();
    queryOneMock.mockClear();
    primaryExecuteMock.mockClear();
    primaryQueryMock.mockClear();
    primaryQueryOneMock.mockClear();
  });

  describe("toggleDrip", () => {
    it("should reject toggle if user does not hold the ticker", async () => {
      primaryQueryOneMock.mockResolvedValueOnce(null);
      const res = await EconomyService.toggleDrip(1, "PRT", true);
      expect(res.success).toBe(false);
      expect(res.error).toContain("do not hold");
    });

    it("should successfully enable DRIP for an active holding", async () => {
      primaryQueryOneMock.mockResolvedValueOnce({ ticker: "PRT", shares: 100 });
      const res = await EconomyService.toggleDrip(1, "PRT", true);
      expect(res.success).toBe(true);
      expect(res.dripEnabled).toBe(true);

      const updateCall = primaryExecuteMock.mock.calls.find((c) =>
        (c[0] as string).includes("UPDATE `solo_stock_player` SET drip_enabled = ?")
      );
      expect(updateCall).toBeDefined();
      expect(updateCall![1]).toEqual([1, 1, "PRT"]);
    });

    it("should successfully disable DRIP", async () => {
      primaryQueryOneMock.mockResolvedValueOnce({ ticker: "EMP", shares: 50 });
      const res = await EconomyService.toggleDrip(1, "EMP", false);
      expect(res.success).toBe(true);
      expect(res.dripEnabled).toBe(false);

      const updateCall = primaryExecuteMock.mock.calls.find((c) =>
        (c[0] as string).includes("UPDATE `solo_stock_player` SET drip_enabled = ?")
      );
      expect(updateCall).toBeDefined();
      expect(updateCall![1]).toEqual([0, 1, "EMP"]);
    });
  });

  describe("executeTrade Transaction Logging", () => {
    it("should record a BUY transaction log upon purchasing shares", async () => {
      // 1. Character lookup
      primaryQueryOneMock.mockResolvedValueOnce({
        char_id: 150001,
        name: "TestNovice",
        zeny: 1000000,
        online: 0,
      });
      // 2. Stock lookup
      primaryQueryOneMock.mockResolvedValueOnce({
        ticker: "PRT",
        name: "Prontera Capital",
        price: 100,
        enabled: 1,
      });

      const res = await EconomyService.executeTrade(1, 150001, "PRT", "BUY", 100);
      expect(res.success).toBe(true);

      const txCall = primaryExecuteMock.mock.calls.find((c) =>
        (c[0] as string).includes("INSERT INTO `solo_stock_transactions`") && (c[0] as string).includes("'BUY'")
      );
      expect(txCall).toBeDefined();
      expect(txCall![1][0]).toBe(1); // accountId
      expect(txCall![1][1]).toBe(150001); // charId
      expect(txCall![1][2]).toBe("PRT"); // ticker
      expect(txCall![1][3]).toBe(100); // shares
      expect(txCall![1][4]).toBe(100); // price
      expect(txCall![1][5]).toBe(10100); // totalRequired (10,000 + 100 fee)
      expect(txCall![1][6]).toBe(100); // fee
    });

    it("should record a SELL transaction log upon liquidating shares to Bank", async () => {
      // 1. Character lookup
      primaryQueryOneMock.mockResolvedValueOnce({
        char_id: 150001,
        name: "TestNovice",
        zeny: 50000,
        online: 0,
      });
      // 2. Stock lookup
      primaryQueryOneMock.mockResolvedValueOnce({
        ticker: "EMP",
        name: "Emperium Shard",
        price: 500,
        enabled: 1,
      });
      // 3. Holding lookup
      primaryQueryOneMock.mockResolvedValueOnce({
        shares: 200,
        total_cost: 80000,
      });
      // 4. Bank lookup
      primaryQueryOneMock.mockResolvedValueOnce({
        principal: 100000,
        deposit_time: Math.floor(Date.now() / 1000) - 86400,
      });

      const res = await EconomyService.executeTrade(1, 150001, "EMP", "SELL", 50, "BANK");
      expect(res.success).toBe(true);
      expect(res.destination).toBe("BANK");

      const txCall = primaryExecuteMock.mock.calls.find((c) =>
        (c[0] as string).includes("INSERT INTO `solo_stock_transactions`") && (c[0] as string).includes("'SELL'")
      );
      expect(txCall).toBeDefined();
      expect(txCall![1][2]).toBe("EMP");
      expect(txCall![1][3]).toBe(50); // shares
      expect(txCall![1][4]).toBe(500); // price
      expect(txCall![1][7]).toBe("BANK"); // destination
    });
  });

  describe("harvestDividends", () => {
    it("should block harvest if DRIP is enabled for the requested ticker", async () => {
      primaryQueryOneMock.mockResolvedValueOnce({
        ticker: "PRT",
        pending_div: 50000,
        drip_enabled: 1,
      });

      const res = await EconomyService.harvestDividends(1, 150001, "PRT", "WALLET");
      expect(res.success).toBe(false);
      expect(res.error).toContain("DRIP is active");
    });

    it("should calculate 10% tax and credit character wallet when DRIP is disabled", async () => {
      // 1. Position lookup
      primaryQueryOneMock.mockResolvedValueOnce({
        ticker: "PRT",
        pending_div: 100000,
        drip_enabled: 0,
      });
      // 2. Tax meta lookup
      primaryQueryOneMock.mockResolvedValueOnce({ mval: 10 });
      // 3. Character lookup
      primaryQueryOneMock.mockResolvedValueOnce({
        char_id: 150001,
        zeny: 500000,
        online: 0,
      });

      const res = await EconomyService.harvestDividends(1, 150001, "PRT", "WALLET");
      expect(res.success).toBe(true);
      expect(res.grossAccrued).toBe(100000);
      expect(res.taxDeduction).toBe(10000);
      expect(res.netPayout).toBe(90000);

      // Verify wallet credit
      const charUpdate = primaryExecuteMock.mock.calls.find((c) =>
        (c[0] as string).includes("UPDATE `char` SET zeny = zeny + ?")
      );
      expect(charUpdate).toBeDefined();
      expect(charUpdate![1][0]).toBe(90000);

      // Verify transaction log
      const divLog = primaryExecuteMock.mock.calls.find((c) =>
        (c[0] as string).includes("INSERT INTO `solo_stock_transactions`") && (c[0] as string).includes("'DIVIDEND'")
      );
      expect(divLog).toBeDefined();
      expect(divLog![1][2]).toBe("PRT");
      expect(divLog![1][3]).toBe(90000); // net
      expect(divLog![1][4]).toBe(10000); // tax fee
    });
  });

  describe("getStockTransactions", () => {
    it("should return formatted transactions list with stock names", async () => {
      queryMock.mockResolvedValueOnce([
        {
          id: 1,
          account_id: 1,
          char_id: 150001,
          ticker: "PRT",
          action: "BUY",
          shares: 100,
          price: 100,
          total_amount: 10100,
          fee: 100,
          destination: "WALLET",
          created_at: "2026-08-26 12:00:00",
          stock_name: "Prontera Capital",
          asset_type: "EQUITY",
          char_name: "NoviceHero",
        },
      ]);

      const res = await EconomyService.getStockTransactions(1, 10);
      expect(res.success).toBe(true);
      expect(res.transactions.length).toBe(1);
      expect(res.transactions[0].ticker).toBe("PRT");
      expect(res.transactions[0].action).toBe("BUY");
      expect(res.transactions[0].charName).toBe("NoviceHero");
    });
  });

  describe("processMidnightDrip Automated Reinvestment Logging", () => {
    it("should log DRIP_BUY transaction when midnight simulation auto-compounds shares", async () => {
      primaryQueryMock.mockImplementation(async (sql: string) => {
        if (sql.includes("BlackSwanChance")) return [{ mval: 0 }];
        if (sql.includes("MarketMood")) return [{ mval: 1 }];
        if (sql.includes("solo_stock_market")) {
          return [{ ticker: "PRT", price: 100, dividend: 10, div_acc: 0, target_yield_bps: 100 }];
        }
        if (sql.includes("drip_enabled = 1")) {
          return [
            {
              account_id: 1,
              shares: 100,
              total_cost: 10000,
              drip_carryover: 50,
              pending_div: 150, // total payout = 200 => 2 new shares @ 100
            },
          ];
        }
        return [];
      });

      await MarketSimulationService.processMidnightDrip();

      const dripBuyLog = primaryExecuteMock.mock.calls.find((c) =>
        (c[0] as string).includes("INSERT INTO `solo_stock_transactions`") && (c[0] as string).includes("'DRIP_BUY'")
      );
      expect(dripBuyLog).toBeDefined();
      expect(dripBuyLog![1][0]).toBe(1); // account_id
      expect(dripBuyLog![1][1]).toBe("PRT"); // ticker
      expect(dripBuyLog![1][2]).toBe(2); // newShares
      expect(dripBuyLog![1][3]).toBe(100); // price
      expect(dripBuyLog![1][4]).toBe(200); // total cost
    });
  });
});
