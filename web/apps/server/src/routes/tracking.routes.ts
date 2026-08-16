import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { TrackingService } from "../services/tracking.service";
import { config } from "../config";

export const trackingRoutes = new Elysia({ prefix: "/api/tracking" })
  .use(
    jwt({
      name: "jwt",
      secret: config.server.jwtSecret,
    })
  )
  .get("/progression", async ({ headers, jwt, set }) => {
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

    const progression = await TrackingService.getProgressionSummary(Number(payload.accountId));
    return { success: true, progression };
  });
