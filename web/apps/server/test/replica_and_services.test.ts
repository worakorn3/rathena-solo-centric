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

  it("should reject unauthenticated access to /api/economy/net-worth", async () => {
    const response = await app.handle(new Request("http://localhost:4000/api/economy/net-worth"));
    expect(response.status).toBe(401);
  });

  it("should reject unauthenticated access to /api/character/my-characters", async () => {
    const response = await app.handle(new Request("http://localhost:4000/api/character/my-characters"));
    expect(response.status).toBe(401);
  });
});
