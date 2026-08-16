import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { EconomyService } from "../services/economy.service";
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
    return { success: true, quotes };
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
