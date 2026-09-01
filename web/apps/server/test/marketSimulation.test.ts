import { describe, expect, it, mock, beforeEach } from "bun:test";

// Mock DB pool BEFORE importing the service
const primaryQueryMock = mock(() => Promise.resolve([]));
const primaryExecuteMock = mock(() => Promise.resolve([]));

mock.module("../src/db/pool", () => ({
  primaryQuery: primaryQueryMock,
  primaryExecute: primaryExecuteMock,
}));

import { MarketSimulationService } from "../src/services/marketSimulation.service";
import { calculateStockValuation } from "@rathena/shared";

describe("MarketSimulationService", () => {
  beforeEach(() => {
    primaryQueryMock.mockClear();
    primaryExecuteMock.mockClear();
  });

  describe("processHourlyShift", () => {
    it("should apply global market mood to all tickers when there are no active ticker overrides", async () => {
      primaryQueryMock.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes("solo_stock_meta") && query.includes("MarketMood")) {
          return [{ mkey: "MarketMood", mval: 1 }, { mkey: "CryptoMood", mval: 0 }];
        }
        if (query.includes("solo_stock_events_active") && query.includes("remaining_shifts > 0") && !query.includes("tax_rate_override")) return []; 
        if (query.includes("solo_stock_market")) {
          return [
            { ticker: "PRT", price: 100, dividend: 5, split_count: 0, beta: 1.0 },
            { ticker: "GEF", price: 100, dividend: 5, split_count: 0, beta: 1.0 },
            { ticker: "MOR", price: 100, dividend: 5, split_count: 0, beta: 1.0 },
            { ticker: "PAY", price: 100, dividend: 5, split_count: 0, beta: 1.0 },
            { ticker: "ALB", price: 100, dividend: 5, split_count: 0, beta: 1.0 },
          ];
        }
        if (query.includes("tax_rate_override")) return [{ tax_rate_override: 10 }];
        return [];
      });

      const originalRandom = Math.random;
      Math.random = () => 0.5; 

      try {
        await MarketSimulationService.processHourlyShift();
        const updates = primaryExecuteMock.mock.calls.filter(call => 
          (call[0] as string).includes("UPDATE `solo_stock_market` SET price = ? WHERE ticker = ?")
        );
        expect(updates.length).toBe(5);
        for (const update of updates) {
          expect(update[1][0]).toBe(102);
        }
      } finally {
        Math.random = originalRandom;
      }
    });

    it("should apply specific ticker mood to a targeted city, bypassing the global mood", async () => {
      primaryQueryMock.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes("solo_stock_meta") && query.includes("MarketMood")) {
          return [{ mkey: "MarketMood", mval: 2 }, { mkey: "CryptoMood", mval: 0 }];
        }
        if (query.includes("solo_stock_events_active") && query.includes("remaining_shifts > 0") && !query.includes("tax_rate_override")) {
          return [{ ticker: "GEF", mood_override: 1 }]; 
        }
        if (query.includes("solo_stock_market")) {
          return [
            { ticker: "PRT", price: 100, dividend: 5, split_count: 0, beta: 1.0 },
            { ticker: "GEF", price: 100, dividend: 5, split_count: 0, beta: 1.0 },
            { ticker: "MOR", price: 100, dividend: 5, split_count: 0, beta: 1.0 },
            { ticker: "PAY", price: 100, dividend: 5, split_count: 0, beta: 1.0 },
            { ticker: "ALB", price: 100, dividend: 5, split_count: 0, beta: 1.0 },
          ];
        }
        if (query.includes("tax_rate_override")) return [{ tax_rate_override: 10 }];
        return [];
      });

      const originalRandom = Math.random;
      Math.random = () => 0.5; 

      try {
        await MarketSimulationService.processHourlyShift();
        const updates = primaryExecuteMock.mock.calls.filter(call => 
          (call[0] as string).includes("UPDATE `solo_stock_market` SET price = ? WHERE ticker = ?")
        );
        expect(updates.length).toBe(5);
        for (const update of updates) {
          const newPrice = update[1][0];
          const ticker = update[1][1];
          if (ticker === "GEF") {
            expect(newPrice).toBe(102); 
          } else {
            expect(newPrice).toBe(98); 
          }
        }
      } finally {
        Math.random = originalRandom;
      }
    });

    it("should apply macro 'ALL' mood override to all municipal tickers", async () => {
      primaryQueryMock.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes("solo_stock_meta") && query.includes("MarketMood")) {
          return [{ mkey: "MarketMood", mval: 2 }, { mkey: "CryptoMood", mval: 0 }]; // baseline Bearish
        }
        if (query.includes("solo_stock_events_active") && query.includes("remaining_shifts > 0") && !query.includes("tax_rate_override")) {
          return [{ ticker: "ALL", mood_override: 1 }]; // Macro Bullish override
        }
        if (query.includes("solo_stock_market")) {
          return [
            { ticker: "PRT", price: 100, dividend: 5, split_count: 0, beta: 1.0 },
            { ticker: "GEF", price: 100, dividend: 5, split_count: 0, beta: 1.0 },
          ];
        }
        if (query.includes("tax_rate_override")) return [{ tax_rate_override: 10 }];
        return [];
      });

      const originalRandom = Math.random;
      Math.random = () => 0.5; // f = 0, +2 for mood 1

      try {
        await MarketSimulationService.processHourlyShift();
        const updates = primaryExecuteMock.mock.calls.filter(call => 
          (call[0] as string).includes("UPDATE `solo_stock_market` SET price = ? WHERE ticker = ?")
        );
        expect(updates.length).toBe(2);
        for (const update of updates) {
          expect(update[1][0]).toBe(102); // Bullish boost applied to all
        }
      } finally {
        Math.random = originalRandom;
      }
    });
  });

  describe("processMidnightDrip", () => {
    it("should calculate non-zero dividend targets for active dividend-paying stocks around 100z", async () => {
      primaryQueryMock.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes("mkey = 'BlackSwanChance'")) return [{ mval: 0 }]; // disable black swan for this test
        if (query.includes("mkey = 'MarketMood'")) return [{ mval: 0 }];
        if (query.includes("solo_stock_market")) {
          return [
            { ticker: "PRT", price: 100, dividend: 3, div_acc: 10, target_yield_bps: 50 },
            { ticker: "LHZ", price: 100, dividend: 0, div_acc: 0, target_yield_bps: 0 },
          ];
        }
        if (query.includes("solo_stock_player")) return [];
        return [];
      });

      const originalRandom = Math.random;
      // Force random check (<= 30) to pass: 0.1 -> floor(0.1*100)+1 = 11 <= 30
      Math.random = () => 0.1;

      try {
        await MarketSimulationService.processMidnightDrip();
        const divUpdates = primaryExecuteMock.mock.calls.filter(call =>
          (call[0] as string).includes("UPDATE `solo_stock_market` SET dividend = ?, div_acc = div_acc + ? WHERE ticker = ?")
        );
        expect(divUpdates.length).toBe(2);

        // PRT target is Math.round(100 * 50 / 1000) = 5. Since dividend is 3 < 5, it should increment to 4.
        const prtUpdate = divUpdates.find(u => u[1][2] === "PRT");
        expect(prtUpdate).toBeDefined();
        expect(prtUpdate![1][0]).toBe(4);

        // LHZ target is 0. Dividend is 0 == target, stays 0.
        const lhzUpdate = divUpdates.find(u => u[1][2] === "LHZ");
        expect(lhzUpdate).toBeDefined();
        expect(lhzUpdate![1][0]).toBe(0);
      } finally {
        Math.random = originalRandom;
      }
    });

    it("should apply anti-cyclical valuation tilt (1.25x on dip <80z, 0.75x on bubble >300z)", async () => {
      primaryQueryMock.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes("mkey = 'BlackSwanChance'")) return [{ mval: 0 }];
        if (query.includes("mkey = 'MarketMood'")) return [{ mval: 0 }]; // Neutral mood = 1.0x
        if (query.includes("solo_stock_market")) {
          return [
            // Dip stock: price 60z, base target 50 bps -> effective bps = round(50 * 1.25) = 63 -> target = round(60 * 63 / 1000) = 4z
            { ticker: "DIP", price: 60, dividend: 0, div_acc: 0, target_yield_bps: 50 },
            // Bubble stock: price 400z, base target 50 bps -> effective bps = round(50 * 0.75) = 38 -> target = round(400 * 38 / 1000) = 15z
            { ticker: "BUBBLE", price: 400, dividend: 0, div_acc: 0, target_yield_bps: 50 },
          ];
        }
        if (query.includes("solo_stock_player")) return [];
        return [];
      });

      await MarketSimulationService.processMidnightDrip();

      const divUpdates = primaryExecuteMock.mock.calls.filter(call =>
        (call[0] as string).includes("UPDATE `solo_stock_market` SET dividend = ?, div_acc = div_acc + ? WHERE ticker = ?")
      );
      expect(divUpdates.length).toBe(2);

      const dipUpdate = divUpdates.find(u => u[1][2] === "DIP");
      expect(dipUpdate).toBeDefined();
      expect(dipUpdate![1][0]).toBe(4); // 1.25x valuation boost applied

      const bubbleUpdate = divUpdates.find(u => u[1][2] === "BUBBLE");
      expect(bubbleUpdate).toBeDefined();
      expect(bubbleUpdate![1][0]).toBe(15); // 0.75x valuation compression applied
    });
  });

  describe("processBlackSwan", () => {
    it("should query only enabled tickers and ignore disabled tickers", async () => {
      primaryQueryMock.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes("SELECT ticker, price FROM `solo_stock_market` WHERE enabled = 1")) {
          return [
            { ticker: "PRT", price: 100 },
            { ticker: "GEF", price: 100 },
            { ticker: "LHZ", price: 120 },
          ];
        }
        if (query.includes("solo_stock_events_def")) {
          return [
            {
              event_id: "LHZ_BOOM_HOMUNCULUS_PATENT",
              category: "MUNICIPAL_BOOM",
              event_name: "Homunculus Biotech Patent",
              ticker_target: "LHZ",
              price_pct_change: 80,
              dividend_change: 0,
              direct_payout_per_share: 0,
              duration_shifts: 0,
              tax_rate_override: -1,
              mood_override: 0,
              headline: "Rekenber Homunculus Breakthrough",
              description: "Bio-patents surge",
            },
          ];
        }
        return [];
      });

      await MarketSimulationService.processBlackSwan();

      const priceUpdates = primaryExecuteMock.mock.calls.filter(call =>
        (call[0] as string).includes("UPDATE `solo_stock_market` SET price = GREATEST(10, ROUND(price * (1 + ? / 100))) WHERE ticker = ?")
      );
      expect(priceUpdates.length).toBe(1);
      expect(priceUpdates[0][1][0]).toBe(80);
      expect(priceUpdates[0][1][1]).toBe("LHZ");

      const logInserts = primaryExecuteMock.mock.calls.filter(call =>
        (call[0] as string).includes("INSERT INTO `solo_stock_events_log`")
      );
      expect(logInserts.length).toBe(1);
      expect(logInserts[0][1][0]).toBe("LHZ_BOOM_HOMUNCULUS_PATENT");
    });

    it("should process reverse stock split ratio and consolidate shares and prices", async () => {
      primaryQueryMock.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes("SELECT ticker, price FROM `solo_stock_market` WHERE enabled = 1")) {
          return [
            { ticker: "PRT", price: 100 },
            { ticker: "HUG", price: 50 },
          ];
        }
        if (query.includes("solo_stock_events_def")) {
          return [
            {
              event_id: "FIN_REVERSE_SPLIT",
              category: "STRUCTURAL",
              event_name: "Distressed Equity Capital Restructuring",
              ticker_target: "LOWEST",
              price_pct_change: 0,
              dividend_change: 0,
              direct_payout_per_share: 0,
              reverse_split_ratio: 5,
              duration_shifts: 0,
              tax_rate_override: -1,
              mood_override: 0,
              headline: "Municipal regulators approve 1:5 reverse stock split",
              description: "Consolidate 1:5",
            },
          ];
        }
        return [];
      });

      await MarketSimulationService.processBlackSwan();

      const revSplitUpdates = primaryExecuteMock.mock.calls.filter(call =>
        (call[0] as string).includes("UPDATE `solo_stock_market` SET price = price * ?, dividend = dividend * ? WHERE ticker = ?")
      );
      expect(revSplitUpdates.length).toBe(1);
      expect(revSplitUpdates[0][1][0]).toBe(5);
      expect(revSplitUpdates[0][1][2]).toBe("HUG"); // Lowest priced stock

      const playerShareConsolidations = primaryExecuteMock.mock.calls.filter(call =>
        (call[0] as string).includes("UPDATE `solo_stock_player` SET shares = FLOOR(shares / ?) WHERE ticker = ?")
      );
      expect(playerShareConsolidations.length).toBe(1);
      expect(playerShareConsolidations[0][1][0]).toBe(5);
      expect(playerShareConsolidations[0][1][1]).toBe("HUG");
    });

    it("should trigger via accumulating PRD hazard tension when elapsed time is 48h", async () => {
      const now = Math.floor(Date.now() / 1000);
      primaryQueryMock.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes("mkey IN ('BlackSwanChance', 'LatestEventTime')")) {
          // 48 hours elapsed -> dynamic chance = min(30, 0.5 + 48 * 0.15) = 7.7%
          return [
            { mkey: "BlackSwanChance", mval: 2 },
            { mkey: "LatestEventTime", mval: now - 48 * 3600 },
          ];
        }
        if (query.includes("mkey = 'MarketMood'")) return [{ mval: 1 }];
        if (query.includes("SELECT ticker, price FROM `solo_stock_market` WHERE enabled = 1")) {
          return [{ ticker: "PRT", price: 100 }];
        }
        if (query.includes("solo_stock_market")) {
          return [{ ticker: "PRT", price: 100, dividend: 5, target_yield_bps: 50 }];
        }
        if (query.includes("solo_stock_events_def")) {
          return [
            {
              event_id: "PRT_BOOM_ROYAL",
              category: "MUNICIPAL_BOOM",
              event_name: "Royal Grant",
              ticker_target: "PRT",
              price_pct_change: 50,
              dividend_change: 5,
              weight: 10,
            },
          ];
        }
        return [];
      });

      const originalRandom = Math.random;
      // 0.05 * 100 = 5.0 <= 7.7 -> triggers Black Swan
      Math.random = () => 0.05;

      try {
        await MarketSimulationService.processMidnightDrip();
        const logInserts = primaryExecuteMock.mock.calls.filter((call) =>
          (call[0] as string).includes("INSERT INTO `solo_stock_events_log`")
        );
        expect(logInserts.length).toBe(1);
        expect(logInserts[0][1][0]).toBe("PRT_BOOM_ROYAL");
      } finally {
        Math.random = originalRandom;
      }
    });
  });

  describe("checkThresholdEvents", () => {
    it("should trigger distress threshold event on stock at 18z", async () => {
      primaryQueryMock.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes("solo_stock_events_active")) return [];
        if (query.includes("solo_stock_events_log")) return [];
        if (query.includes("SELECT ticker, price FROM `solo_stock_market` WHERE enabled = 1")) {
          return [
            { ticker: "PRT", price: 100 },
            { ticker: "DISTRESSED_CORP", price: 18 },
          ];
        }
        if (query.includes("solo_stock_events_def")) {
          return [
            {
              event_id: "CRISIS_BAILOUT",
              category: "STRUCTURAL",
              event_name: "Emergency Crown Bailout",
              ticker_target: "DISTRESSED_CORP",
              price_pct_change: 60,
              dividend_change: 0,
              headline: "Crown injects liquidity into distressed firm",
            },
          ];
        }
        return [];
      });

      await MarketSimulationService.checkThresholdEvents([
        { ticker: "PRT", price: 100 },
        { ticker: "DISTRESSED_CORP", price: 18 },
      ]);

      const eventLogs = primaryExecuteMock.mock.calls.filter((call) =>
        (call[0] as string).includes("INSERT INTO `solo_stock_events_log`")
      );
      expect(eventLogs.length).toBe(1);
      expect(eventLogs[0][1][0]).toBe("CRISIS_BAILOUT");
      expect(eventLogs[0][1][6]).toBe("THRESHOLD_TRIGGER");

      const priceUpdates = primaryExecuteMock.mock.calls.filter((call) =>
        (call[0] as string).includes("UPDATE `solo_stock_market` SET price = GREATEST(10, ROUND(price * (1 + ? / 100))) WHERE ticker = ?")
      );
      expect(priceUpdates.length).toBe(1);
      expect(priceUpdates[0][1][0]).toBe(60);
      expect(priceUpdates[0][1][1]).toBe("DISTRESSED_CORP");
    });

    it("should trigger mania threshold event on bubble stock at 820z", async () => {
      primaryQueryMock.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes("solo_stock_events_active")) return [];
        if (query.includes("solo_stock_events_log")) return [];
        if (query.includes("SELECT ticker, price FROM `solo_stock_market` WHERE enabled = 1")) {
          return [
            { ticker: "PRT", price: 100 },
            { ticker: "MANIA_CORP", price: 820 },
          ];
        }
        if (query.includes("solo_stock_events_def")) {
          return [
            {
              event_id: "ANTITRUST_CRACKDOWN",
              category: "MUNICIPAL_CRISIS",
              event_name: "Anti-Monopoly Investigation",
              ticker_target: "MANIA_CORP",
              price_pct_change: -35,
              dividend_change: 0,
              headline: "Regulators investigate monopolistic pricing",
            },
          ];
        }
        return [];
      });

      await MarketSimulationService.checkThresholdEvents([
        { ticker: "PRT", price: 100 },
        { ticker: "MANIA_CORP", price: 820 },
      ]);

      const eventLogs = primaryExecuteMock.mock.calls.filter((call) =>
        (call[0] as string).includes("INSERT INTO `solo_stock_events_log`")
      );
      expect(eventLogs.length).toBe(1);
      expect(eventLogs[0][1][0]).toBe("ANTITRUST_CRACKDOWN");
      expect(eventLogs[0][1][6]).toBe("THRESHOLD_TRIGGER");
    });

    it("should suppress threshold trigger if ticker already has an active ongoing event (cooldown lock)", async () => {
      primaryQueryMock.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes("solo_stock_events_active")) {
          return [{ ticker: "DISTRESSED_CORP" }]; // Active lock
        }
        if (query.includes("solo_stock_events_log")) return [];
        if (query.includes("SELECT ticker, price FROM `solo_stock_market` WHERE enabled = 1")) {
          return [{ ticker: "DISTRESSED_CORP", price: 15 }];
        }
        return [];
      });

      await MarketSimulationService.checkThresholdEvents([
        { ticker: "DISTRESSED_CORP", price: 15 },
      ]);

      expect(primaryExecuteMock).not.toHaveBeenCalled();
    });

    it("should suppress threshold trigger if ticker logged an event within last 24h", async () => {
      primaryQueryMock.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes("solo_stock_events_active")) return [];
        if (query.includes("solo_stock_events_log")) {
          return [{ ticker_target: "MANIA_CORP" }]; // 24h log lock
        }
        if (query.includes("SELECT ticker, price FROM `solo_stock_market` WHERE enabled = 1")) {
          return [{ ticker: "MANIA_CORP", price: 850 }];
        }
        return [];
      });

      await MarketSimulationService.checkThresholdEvents([
        { ticker: "MANIA_CORP", price: 850 },
      ]);

      expect(primaryExecuteMock).not.toHaveBeenCalled();
    });
  });

  describe("catchUpOfflineDividends", () => {
    it("should do nothing if elapsed time is less than 4 hours", async () => {
      const now = Math.floor(Date.now() / 1000);
      primaryQueryMock.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes("mkey = 'LastUpdate'")) {
          return [{ mval: now - 3600 }]; // 1 hour ago
        }
        return [];
      });

      const cycles = await MarketSimulationService.catchUpOfflineDividends();
      expect(cycles).toBe(0);
      expect(primaryExecuteMock).not.toHaveBeenCalled();
    });

    it("should catch up 2 cycles when server was offline for 8 hours", async () => {
      const now = Math.floor(Date.now() / 1000);
      primaryQueryMock.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes("mkey = 'LastUpdate'")) {
          return [{ mval: now - 28800 }]; // 8 hours ago (2 cycles)
        }
        if (query.includes("mkey = 'MarketMood'")) {
          return [{ mval: 1 }];
        }
        if (query.includes("solo_stock_market")) {
          return [{ ticker: "PRT", price: 100, dividend: 5, target_yield_bps: 50 }];
        }
        if (query.includes("solo_stock_player")) {
          return [];
        }
        return [];
      });

      const cycles = await MarketSimulationService.catchUpOfflineDividends();
      expect(cycles).toBe(2);
      // Verify processMidnightDrip ran twice
      const lastUpdateExecutes = primaryExecuteMock.mock.calls.filter(call =>
        (call[0] as string).includes("UPDATE `solo_stock_meta` SET mval = ? WHERE mkey = 'LastUpdate'")
      );
      expect(lastUpdateExecutes.length).toBe(2);
    });

    it("should cap missed cycles at 42 (7 days max) when offline for 30 days", async () => {
      const now = Math.floor(Date.now() / 1000);
      primaryQueryMock.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes("mkey = 'LastUpdate'")) {
          return [{ mval: now - 30 * 86400 }]; // 30 days ago
        }
        if (query.includes("mkey = 'MarketMood'")) {
          return [{ mval: 1 }];
        }
        if (query.includes("solo_stock_market")) {
          return [{ ticker: "PRT", price: 100, dividend: 5, target_yield_bps: 50 }];
        }
        if (query.includes("solo_stock_player")) {
          return [];
        }
        return [];
      });

      const cycles = await MarketSimulationService.catchUpOfflineDividends();
      expect(cycles).toBe(42);
    });
  });

  describe("catchUpOfflineShifts", () => {
    it("should do nothing if elapsed time is less than 10 minutes", async () => {
      const now = Math.floor(Date.now() / 1000);
      primaryQueryMock.mockImplementation(async (query: string) => {
        if (query.includes("mkey IN ('LastShiftTime'")) {
          return [{ mkey: "LastShiftTime", mval: now - 300 }]; // 5 minutes ago
        }
        return [];
      });

      const shifts = await MarketSimulationService.catchUpOfflineShifts();
      expect(shifts).toBe(0);
      expect(primaryExecuteMock).not.toHaveBeenCalled();
    });

    it("should replay 3 missed shifts when offline for 30 minutes and batch insert candles", async () => {
      const now = Math.floor(Date.now() / 1000);
      primaryQueryMock.mockImplementation(async (query: string) => {
        if (query.includes("mkey IN ('LastShiftTime'")) {
          return [
            { mkey: "LastShiftTime", mval: now - 1800 }, // 30 minutes ago (3 shifts)
            { mkey: "MarketMood", mval: 1 },
            { mkey: "MarketDrift", mval: 0 },
          ];
        }
        if (query.includes("solo_stock_market") && query.includes("enabled = 1")) {
          return [
            { ticker: "PRT", price: 100, dividend: 5, split_count: 0, beta: 1.0 },
            { ticker: "ALB", price: 100, dividend: 5, split_count: 0, beta: 1.0 },
          ];
        }
        if (query.includes("solo_stock_events_active")) {
          return [];
        }
        return [];
      });

      const originalRandom = Math.random;
      Math.random = () => 0.5; // deterministic drift & f calculation

      try {
        const shifts = await MarketSimulationService.catchUpOfflineShifts();
        expect(shifts).toBe(3);

        // Verify batch history insert was called
        const historyInserts = primaryExecuteMock.mock.calls.filter((call) =>
          (call[0] as string).includes("INSERT INTO `solo_stock_history`")
        );
        expect(historyInserts.length).toBe(1);

        // 3 shifts * 2 tickers = 6 candle rows in the batch
        const insertSql = historyInserts[0][0] as string;
        expect((insertSql.match(/\(\?, \?, \?, \?, \?, \?, \?\)/g) || []).length).toBe(6);

        // Verify final stock market price update
        const stockUpdates = primaryExecuteMock.mock.calls.filter((call) =>
          (call[0] as string).includes("UPDATE `solo_stock_market` SET price = ? WHERE ticker = ?")
        );
        expect(stockUpdates.length).toBe(2);

        // Verify meta update
        const metaUpdates = primaryExecuteMock.mock.calls.filter((call) =>
          (call[0] as string).includes("LastShiftTime")
        );
        expect(metaUpdates.length).toBe(1);
      } finally {
        Math.random = originalRandom;
      }
    });

    it("should handle stock split multiplier during offline replay", async () => {
      const now = Math.floor(Date.now() / 1000);
      primaryQueryMock.mockImplementation(async (query: string) => {
        if (query.includes("mkey IN ('LastShiftTime'")) {
          return [
            { mkey: "LastShiftTime", mval: now - 600 }, // 1 shift
            { mkey: "MarketMood", mval: 1 },
            { mkey: "MarketDrift", mval: 0 },
          ];
        }
        if (query.includes("solo_stock_market")) {
          return [
            { ticker: "SPLIT_CORP", price: 1980, dividend: 10, split_count: 0, beta: 1.0 },
          ];
        }
        if (query.includes("solo_stock_events_active")) {
          return [];
        }
        return [];
      });

      const originalRandom = Math.random;
      Math.random = () => 0.95;

      try {
        const shifts = await MarketSimulationService.catchUpOfflineShifts();
        expect(shifts).toBe(1);

        const splitStockUpdates = primaryExecuteMock.mock.calls.filter((call) =>
          (call[0] as string).includes("UPDATE `solo_stock_market` SET price = ?, split_count = ? WHERE ticker = ?")
        );
        expect(splitStockUpdates.length).toBe(1);
        expect(splitStockUpdates[0][1][0]).toBe(1109); // (1980 + 238) / 2 = 2218 / 2 = 1109
        expect(splitStockUpdates[0][1][1]).toBe(1); // split_count = 1

        const playerShareMultipliers = primaryExecuteMock.mock.calls.filter((call) =>
          (call[0] as string).includes("UPDATE `solo_stock_player` SET shares = shares * ? WHERE ticker = ?")
        );
        expect(playerShareMultipliers.length).toBe(1);
        expect(playerShareMultipliers[0][1][0]).toBe(2); // 2^1 = 2x
        expect(playerShareMultipliers[0][1][1]).toBe("SPLIT_CORP");
      } finally {
        Math.random = originalRandom;
      }
    });

    it("should cap missed shifts to 45 days (6480 shifts) maximum", async () => {
      const now = Math.floor(Date.now() / 1000);
      primaryQueryMock.mockImplementation(async (query: string) => {
        if (query.includes("mkey IN ('LastShiftTime'")) {
          return [
            { mkey: "LastShiftTime", mval: now - 60 * 86400 }, // 60 days ago
            { mkey: "MarketMood", mval: 1 },
            { mkey: "MarketDrift", mval: 0 },
          ];
        }
        if (query.includes("solo_stock_market")) {
          return [{ ticker: "PRT", price: 100, dividend: 5, split_count: 0, beta: 1.0 }];
        }
        if (query.includes("solo_stock_events_active")) {
          return [];
        }
        return [];
      });

      const shifts = await MarketSimulationService.catchUpOfflineShifts();
      expect(shifts).toBe(6480);
    });
  });

  describe("calculateStockValuation", () => {
    it("should classify deep value when price is 40% below fair value", () => {
      // 5z dividend @ 50 bps = Fair Value 100z. Price 60z -> -40% gap
      const val = calculateStockValuation(60, 5, 50, "EQUITY");
      expect(val.fairValue).toBe(100);
      expect(val.valuationGapPct).toBe(-40);
      expect(val.valuationRating).toBe("DEEP_VALUE");
      expect(val.pdRatio).toBe(12.0);
    });

    it("should classify undervalued when price is 15% below fair value", () => {
      const val = calculateStockValuation(85, 5, 50, "EQUITY");
      expect(val.fairValue).toBe(100);
      expect(val.valuationGapPct).toBe(-15);
      expect(val.valuationRating).toBe("UNDERVALUED");
      expect(val.pdRatio).toBe(17.0);
    });

    it("should classify fair value within normal bounds (-5% to +15%)", () => {
      const val = calculateStockValuation(105, 5, 50, "EQUITY");
      expect(val.fairValue).toBe(100);
      expect(val.valuationGapPct).toBe(5);
      expect(val.valuationRating).toBe("FAIR_VALUE");
    });

    it("should classify overvalued when price is 40% above fair value", () => {
      const val = calculateStockValuation(140, 5, 50, "EQUITY");
      expect(val.fairValue).toBe(100);
      expect(val.valuationGapPct).toBe(40);
      expect(val.valuationRating).toBe("OVERVALUED");
    });

    it("should classify bubble when price is 150% above fair value", () => {
      const val = calculateStockValuation(250, 5, 50, "EQUITY");
      expect(val.fairValue).toBe(100);
      expect(val.valuationGapPct).toBe(150);
      expect(val.valuationRating).toBe("BUBBLE");
    });

    it("should safely fallback for crypto and zero target bps without NaN or div-by-zero", () => {
      const val = calculateStockValuation(120, 0, 0, "CRYPTO");
      expect(val.fairValue).toBe(100);
      expect(val.valuationGapPct).toBe(20);
      expect(val.valuationRating).toBe("OVERVALUED");
      expect(val.pdRatio).toBeNull();
    });
  });
});

