import { describe, expect, it } from "bun:test";
import { app } from "../src/index";
import { config } from "../src/config";
import { getDbPool } from "../src/db/pool";
import { EconomyService } from "../src/services/economy.service";
import { CharacterService } from "../src/services/character.service";

describe("Database Replica & Read-Only Safety Tests", () => {
  it("should have replica port configured to 3307", () => {
    expect(config.db.port).toBe(3307);
  });

  it("should connect successfully to the MariaDB Replica on port 3307", async () => {
    const pool = await getDbPool();
    const [rows] = await pool.query("SELECT 1 as alive");
    expect((rows as any)[0].alive).toBe(1);
  });

  it("should check server health endpoint", async () => {
    const response = await app.handle(new Request("http://localhost:4000/api/health"));
    expect(response.status).toBe(200);
    const data = (await response.json()) as any;
    expect(data.status).toBe("ok");
    expect(data.replicaPort).toBe(3307);
  });

  it("should fetch stock market quotes from replica", async () => {
    const quotes = await EconomyService.getMarketQuotes();
    expect(Array.isArray(quotes)).toBe(true);
  });

  it("should fetch top ranked characters without error", async () => {
    const rankings = await CharacterService.getTopRanked();
    expect(Array.isArray(rankings)).toBe(true);
  });

  it("should fetch stock market events history from replica", async () => {
    const response = await app.handle(new Request("http://localhost:4000/api/economy/events"));
    expect(response.status).toBe(200);
    const data = (await response.json()) as any;
    expect(data.success).toBe(true);
    expect(Array.isArray(data.events)).toBe(true);
  });

  it("should fetch ticker-filtered events with query parameter", async () => {
    const response = await app.handle(new Request("http://localhost:4000/api/economy/events?ticker=PRT"));
    expect(response.status).toBe(200);
    const data = (await response.json()) as any;
    expect(data.success).toBe(true);
    expect(Array.isArray(data.events)).toBe(true);
  });

  it("should fetch full ticker Black Swan news dispatches", async () => {
    const response = await app.handle(new Request("http://localhost:4000/api/economy/events/ticker/PRT"));
    expect(response.status).toBe(200);
    const data = (await response.json()) as any;
    expect(data.success).toBe(true);
    expect(data.ticker).toBe("PRT");
    expect(Array.isArray(data.activeEvents)).toBe(true);
    expect(Array.isArray(data.historicalEvents)).toBe(true);
  });

  it("should fetch active market events from replica", async () => {
    const response = await app.handle(new Request("http://localhost:4000/api/economy/events/active"));
    expect(response.status).toBe(200);
    const data = (await response.json()) as any;
    expect(data.success).toBe(true);
    expect(Array.isArray(data.activeEvents)).toBe(true);
  });

  it("should reject unauthorized trade requests without JWT", async () => {
    const response = await app.handle(
      new Request("http://localhost:4000/api/economy/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: "PRT",
          action: "BUY",
          shares: 10,
          charId: 150000,
        }),
      })
    );
    expect(response.status).toBe(401);
    const data = (await response.json()) as any;
    expect(data.success).toBe(false);
  });

  it("should validate trade parameters and fail safely on invalid character or online status", async () => {
    // Attempt trade with nonexistent or invalid account directly via EconomyService
    const result = await EconomyService.executeTrade(
      9999999,
      9999999,
      "PRT",
      "BUY",
      100
    );
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
