import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { EconomyService } from "../services/economy.service";
import { query } from "../db/pool";
import { config } from "../config";

export const economyRoutes = new Elysia({ prefix: "/api/economy" })
  .use(
    jwt({
      name: "jwt",
      secret: config.server.jwtSecret,
    })
  )
  .get("/quotes", async () => {
    const quotes = await EconomyService.getMarketQuotes();
    let marketMood = 0;
    let marketDrift = 0;
    try {
      const metaRows = await query<{ mkey: string; mval: number }>(
        "SELECT mkey, mval FROM `solo_stock_meta` WHERE mkey IN ('MarketMood', 'MarketDrift')"
      );
      for (const row of metaRows) {
        if (row.mkey === "MarketMood") marketMood = Number(row.mval);
        if (row.mkey === "MarketDrift") marketDrift = Number(row.mval);
      }
    } catch {}
    const activeEvents = await EconomyService.getActiveEvents();
    const history = await EconomyService.getEventHistory(1);
    const latestEvent = history.length > 0 ? history[0] : null;

    return { success: true, quotes, marketMood, marketDrift, activeEvents, latestEvent };
  })
  .get("/events", async ({ query }) => {
    const limit = query && query.limit ? Number(query.limit) : 20;
    const ticker = query && query.ticker ? String(query.ticker) : undefined;
    const events = await EconomyService.getEventHistory(limit, ticker);
    return { success: true, events };
  })
  .get("/events/ticker/:ticker", async ({ params }) => {
    const ticker = params.ticker;
    const news = await EconomyService.getTickerNews(ticker);
    return news;
  })
  .get("/history/:ticker", async ({ params, query }) => {
    const ticker = params.ticker;
    const timeframe = query && query.timeframe ? String(query.timeframe) : "1D";
    const history = await EconomyService.getStockHistory(ticker, timeframe);
    return history;
  })
  .get("/events/active", async () => {
    const activeEvents = await EconomyService.getActiveEvents();
    return { success: true, activeEvents };
  })
  .get("/bounties", async () => {
    const bounties = await EconomyService.getDailyBounties();
    return { success: true, bounties };
  })
  .get("/net-worth", async ({ headers, jwt, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    const token = authHeader.split(" ")[1];
    const payload = await jwt.verify(token);

    if (!payload || !payload.accountId) {
      set.status = 401;
      return { success: false, error: "Invalid token" };
    }

    const netWorth = await EconomyService.getNetWorthSummary(Number(payload.accountId));
    return { success: true, data: netWorth };
  });
