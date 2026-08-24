import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { GachaService } from "../services/gacha.service";
import { config } from "../config";

export const gachaRoutes = new Elysia({ prefix: "/api/gacha" })
  .use(
    jwt({
      name: "jwt",
      secret: config.server.jwtSecret,
    })
  )
  // Helper to extract accountId from Bearer token if present
  .derive(async ({ headers, jwt }) => {
    let authAccountId: number | null = null;
    const authHeader = headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);
      if (payload && (payload as any).accountId) {
        authAccountId = Number((payload as any).accountId);
      }
    }
    return { authAccountId };
  })

  // 1. Get All Banners (with dynamic prices, spotlights, and player pity stats)
  .get("/banners", async ({ authAccountId }) => {
    const banners = await GachaService.getBanners(authAccountId || undefined);
    const discountPct = await GachaService.getMarketDiscountPct();
    return {
      success: true,
      banners,
      discountPct,
    };
  })

  // 2. Execute 1x or 10x Gacha Pull
  .post(
    "/pull",
    async ({ body, authAccountId, set }) => {
      if (!authAccountId) {
        set.status = 401;
        return { success: false, error: "Unauthorized. Please log in." };
      }

      const result = await GachaService.pull(authAccountId, {
        bannerId: body.bannerId,
        count: body.count as 1 | 10,
        charId: body.charId,
      });

      if (!result.success) {
        set.status = 400;
      }
      return result;
    },
    {
      body: t.Object({
        bannerId: t.String(),
        count: t.Union([t.Literal(1), t.Literal(10)]),
        charId: t.Number(),
      }),
    }
  )

  // 3. Get Web Gacha Stash items
  .get("/stash", async ({ authAccountId, set }) => {
    if (!authAccountId) {
      set.status = 401;
      return { success: false, error: "Unauthorized." };
    }
    const items = await GachaService.getStash(authAccountId);
    return { success: true, items };
  })

  // 4. Claim Stash items to In-Game RO Mailbox
  .post(
    "/stash/claim",
    async ({ body, authAccountId, set }) => {
      if (!authAccountId) {
        set.status = 401;
        return { success: false, error: "Unauthorized." };
      }

      const result = await GachaService.claimItemsToMail(authAccountId, body.charId, body.stashIds);
      if (!result.success) set.status = 400;
      return result;
    },
    {
      body: t.Object({
        charId: t.Number(),
        stashIds: t.Array(t.Number()),
      }),
    }
  )

  // 5. Dismantle Stash items into Gacha Shards
  .post(
    "/stash/scrap",
    async ({ body, authAccountId, set }) => {
      if (!authAccountId) {
        set.status = 401;
        return { success: false, error: "Unauthorized." };
      }

      const result = await GachaService.scrapItems(authAccountId, body.stashIds);
      if (!result.success) set.status = 400;
      return result;
    },
    {
      body: t.Object({
        stashIds: t.Array(t.Number()),
      }),
    }
  )

  // 6. Get Exclusives-Only Exchange Shop catalog
  .get("/shop", async ({ authAccountId }) => {
    const shopData = await GachaService.getShop(authAccountId || undefined);
    return { success: true, ...shopData };
  })

  // 7. Purchase from Exclusives Shop
  .post(
    "/shop/buy",
    async ({ body, authAccountId, set }) => {
      if (!authAccountId) {
        set.status = 401;
        return { success: false, error: "Unauthorized." };
      }

      const result = await GachaService.purchaseShopItem(authAccountId, body.charId, body.shopItemId);
      if (!result.success) set.status = 400;
      return result;
    },
    {
      body: t.Object({
        charId: t.Number(),
        shopItemId: t.Number(),
      }),
    }
  )

  // 8. Get Pull History
  .get("/history", async ({ authAccountId, query, set }) => {
    if (!authAccountId) {
      set.status = 401;
      return { success: false, error: "Unauthorized." };
    }
    const limit = query && query.limit ? Number(query.limit) : 50;
    const history = await GachaService.getHistory(authAccountId, limit);
    return { success: true, history };
  })

  // ==================== ADMIN MANAGEMENT ROUTES ====================
  .group("/admin", (adminApp) =>
    adminApp
      .derive(async ({ headers, jwt, set }) => {
        const adminKey = headers["x-admin-key"];
        const isMasterKey = Boolean(adminKey && adminKey === config.server.adminKey);

        let isGm = false;
        const authHeader = headers["authorization"];
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.split(" ")[1];
          const payload = await jwt.verify(token);
          if (payload && typeof (payload as any).groupId === "number" && (payload as any).groupId >= 1) {
            isGm = true;
          }
        }

        if (!isMasterKey && !isGm) {
          set.status = 403;
          throw new Error("Unauthorized: GM permissions or Master Admin Key required.");
        }
        return { isAdmin: true };
      })
      .get("/pool", async () => {
        const items = await GachaService.adminGetAllPoolItems();
        return { success: true, items };
      })
      .post(
        "/banner",
        async ({ body }) => {
          await GachaService.adminUpdateBanner(body as any);
          return { success: true, message: "Banner updated successfully." };
        },
        {
          body: t.Object({
            bannerId: t.String(),
            name: t.String(),
            description: t.String(),
            icon: t.String(),
            basePrice: t.Number(),
            ssrRate: t.Number(),
            srRate: t.Number(),
            rRate: t.Number(),
            pityThreshold: t.Number(),
            enabled: t.Boolean(),
          }),
        }
      )
      .post(
        "/item",
        async ({ body }) => {
          await GachaService.adminSavePoolItem(body as any);
          return { success: true, message: "Pool item saved successfully." };
        },
        {
          body: t.Object({
            id: t.Optional(t.Number()),
            bannerId: t.String(),
            nameId: t.Number(),
            itemName: t.String(),
            amount: t.Number(),
            refine: t.Number(),
            tier: t.Union([t.Literal("SSR"), t.Literal("SR"), t.Literal("R")]),
            weight: t.Number(),
            enabled: t.Boolean(),
          }),
        }
      )
      .delete(
        "/item/:id",
        async ({ params }) => {
          await GachaService.adminDeletePoolItem(Number(params.id));
          return { success: true, message: "Item deleted successfully." };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
        }
      )
      .post("/rotate", async () => {
        await GachaService.rotateAllBanners();
        return { success: true, message: "Banners force-rotated successfully." };
      })
  );
