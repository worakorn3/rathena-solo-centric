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
    let equitiesMood = 0;
    let equitiesDrift = 0;
    let cryptoMood = 0;
    let cryptoDrift = 0;
    try {
      const metaRows = await query<{ mkey: string; mval: number }>(
        "SELECT mkey, mval FROM `solo_stock_meta` WHERE mkey IN ('MarketMood', 'MarketDrift', 'CryptoMood', 'CryptoDrift')"
      );
      for (const row of metaRows) {
        if (row.mkey === "MarketMood") {
          marketMood = Number(row.mval);
          equitiesMood = Number(row.mval);
        }
        if (row.mkey === "MarketDrift") {
          marketDrift = Number(row.mval);
          equitiesDrift = Number(row.mval);
        }
        if (row.mkey === "CryptoMood") cryptoMood = Number(row.mval);
        if (row.mkey === "CryptoDrift") cryptoDrift = Number(row.mval);
      }
    } catch {}
    const activeEvents = await EconomyService.getActiveEvents();
    const history = await EconomyService.getEventHistory(1);
    const latestEvent = history.length > 0 ? history[0] : null;

    return {
      success: true,
      quotes,
      marketMood,
      marketDrift,
      equitiesMood,
      equitiesDrift,
      cryptoMood,
      cryptoDrift,
      activeEvents,
      latestEvent,
    };
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
  })
  .post("/trade", async ({ body, headers, jwt, set }) => {
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

    const { ticker, action, shares, charId, destination } = (body as any) || {};

    if (!ticker || !action || !shares || !charId) {
      set.status = 400;
      return { success: false, error: "Missing required trade parameters: ticker, action, shares, charId." };
    }

    const result = await EconomyService.executeTrade(
      Number(payload.accountId),
      Number(charId),
      String(ticker),
      action as "BUY" | "SELL",
      Number(shares),
      destination as "WALLET" | "BANK" | undefined
    );

    if (!result.success) {
      set.status = 400;
    }

    return result;
  })
  .post("/bank/deposit", async ({ body, headers, jwt, set }) => {
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

    const { charId, amount } = (body as any) || {};

    if (!charId || !amount) {
      set.status = 400;
      return { success: false, error: "Missing required deposit parameters: charId, amount." };
    }

    const result = await EconomyService.depositBank(
      Number(payload.accountId),
      Number(charId),
      Number(amount)
    );

    if (!result.success) {
      set.status = 400;
    }

    return result;
  })
  .post("/bank/withdraw", async ({ body, headers, jwt, set }) => {
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

    const { charId, amount } = (body as any) || {};

    if (!charId) {
      set.status = 400;
      return { success: false, error: "Missing required withdraw parameters: charId." };
    }

    const result = await EconomyService.withdrawBank(
      Number(payload.accountId),
      Number(charId),
      amount ? Number(amount) : undefined
    );

    if (!result.success) {
      set.status = 400;
    }

    return result;
  })
  .get("/transactions", async ({ headers, jwt, query, set }) => {
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

    const limit = query && query.limit ? Number(query.limit) : 50;
    const ticker = query && query.ticker ? String(query.ticker) : undefined;
    const assetType = query && query.assetType ? (String(query.assetType) as "EQUITY" | "CRYPTO") : undefined;
    const action = query && query.action ? (String(query.action) as any) : undefined;

    const result = await EconomyService.getStockTransactions(
      Number(payload.accountId),
      limit,
      ticker,
      assetType,
      action
    );

    return result;
  })
  .post("/drip/toggle", async ({ body, headers, jwt, set }) => {
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

    const { ticker, enabled } = (body as any) || {};

    if (!ticker || enabled === undefined) {
      set.status = 400;
      return { success: false, error: "Missing required parameters: ticker, enabled." };
    }

    const result = await EconomyService.toggleDrip(
      Number(payload.accountId),
      String(ticker),
      Boolean(enabled)
    );

    if (!result.success) {
      set.status = 400;
    }

    return result;
  })
  .post("/dividends/harvest", async ({ body, headers, jwt, set }) => {
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

    const { charId, ticker, destination } = (body as any) || {};

    const result = await EconomyService.harvestDividends(
      Number(payload.accountId),
      charId ? Number(charId) : undefined,
      ticker ? String(ticker) : undefined,
      destination as "WALLET" | "BANK" | undefined
    );

    if (!result.success) {
      set.status = 400;
    }

    return result;
  });
