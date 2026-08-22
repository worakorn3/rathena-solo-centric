import { describe, expect, it, mock, beforeEach } from "bun:test";

// Mock DB pool BEFORE importing the service
const primaryQueryMock = mock(() => Promise.resolve([]));
const primaryExecuteMock = mock(() => Promise.resolve([]));

mock.module("../src/db/pool", () => ({
  primaryQuery: primaryQueryMock,
  primaryExecute: primaryExecuteMock,
}));

import { MarketSimulationService } from "../src/services/marketSimulation.service";

describe("MarketSimulationService", () => {
  beforeEach(() => {
    primaryQueryMock.mockClear();
    primaryExecuteMock.mockClear();
  });

  describe("processHourlyShift", () => {
    it("should apply global market mood to all tickers when there are no active ticker overrides", async () => {
      primaryQueryMock.mockImplementation(async (query: string, params?: any[]) => {
        if (query.includes("mkey = 'MarketMood'")) return [{ mval: 1 }];
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
        if (query.includes("mkey = 'MarketMood'")) return [{ mval: 2 }];
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
  });
});
