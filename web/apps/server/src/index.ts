import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import path from "path";
import fs from "fs";
import { authRoutes } from "./routes/auth.routes";
import { economyRoutes } from "./routes/economy.routes";
import { characterRoutes } from "./routes/character.routes";
import { trackingRoutes } from "./routes/tracking.routes";
import { config } from "./config";

const clientDistPath = process.env.CLIENT_DIST_PATH || path.resolve(__dirname, "../../client/dist");
const hasClientDist = fs.existsSync(clientDistPath);

export const app = new Elysia()
  .use(
    cors({
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  )
  .get("/api/health", () => ({
    status: "ok",
    replicaHost: config.db.host,
    replicaPort: config.db.port,
    timestamp: new Date().toISOString(),
  }))
  .use(authRoutes)
  .use(economyRoutes)
  .use(characterRoutes)
  .use(trackingRoutes);

// In production or container mode, serve static assets and SPA index fallback
if (hasClientDist) {
  console.log(`[Server] Serving static client SPA from ${clientDistPath}`);
  app.use(
    staticPlugin({
      assets: clientDistPath,
      prefix: "",
    })
  );

  // SPA fallback for client routing
  app.get("*", ({ path: reqPath, set }) => {
    if (reqPath.startsWith("/api")) {
      set.status = 404;
      return { error: "API endpoint not found" };
    }
    const indexFile = path.join(clientDistPath, "index.html");
    if (fs.existsSync(indexFile)) {
      return Bun.file(indexFile);
    }
    set.status = 404;
    return "Client bundle not found";
  });
}

if (process.env.NODE_ENV !== "test") {
  app.listen(config.server.port, () => {
    console.log(`🗡️  rAthena Solo Player Portal Server running at http://localhost:${config.server.port}`);
    console.log(`🛡️  Read-Only DB Replica target: ${config.db.host}:${config.db.port}`);
  });
}

export type App = typeof app;
