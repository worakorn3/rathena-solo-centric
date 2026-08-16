import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { CharacterService } from "../services/character.service";
import { config } from "../config";

export const characterRoutes = new Elysia({ prefix: "/api/character" })
  .use(
    jwt({
      name: "jwt",
      secret: config.server.jwtSecret,
    })
  )
  .get("/my-characters", async ({ headers, jwt, set }) => {
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

    const characters = await CharacterService.getCharactersByAccount(Number(payload.accountId));
    return { success: true, characters };
  })
  .get(
    "/search",
    async ({ query }) => {
      const q = query.q || "";
      if (!q.trim()) {
        return { success: true, results: [] };
      }
      const results = await CharacterService.searchPublicArmory(q);
      return { success: true, results };
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
      }),
    }
  )
  .get("/rankings", async () => {
    const rankings = await CharacterService.getTopRanked();
    return { success: true, rankings };
  })
  .get(
    "/:charId",
    async ({ params, set }) => {
      const charId = parseInt(params.charId, 10);
      if (isNaN(charId)) {
        set.status = 400;
        return { success: false, error: "Invalid character ID" };
      }

      const character = await CharacterService.getCharacterDetail(charId);
      if (!character) {
        set.status = 404;
        return { success: false, error: "Character not found" };
      }

      return { success: true, character };
    },
    {
      params: t.Object({
        charId: t.String(),
      }),
    }
  );
