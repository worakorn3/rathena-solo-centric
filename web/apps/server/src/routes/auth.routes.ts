import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { AuthService } from "../services/auth.service";
import { config } from "../config";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: config.server.jwtSecret,
      exp: "7d",
    })
  )
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const result = await AuthService.login({
        userid: body.userid,
        user_pass: body.user_pass,
      });

      if ("error" in result) {
        set.status = 401;
        return { success: false, error: result.error };
      }

      const token = await jwt.sign({
        accountId: result.user.accountId,
        userid: result.user.userid,
        sex: result.user.sex,
        groupId: result.user.groupId,
        role: result.user.role,
      });

      return {
        success: true,
        token,
        user: result.user,
      };
    },
    {
      body: t.Object({
        userid: t.String(),
        user_pass: t.String(),
      }),
    }
  )
  .get("/me", async ({ headers, jwt, set }) => {
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

    const user = await AuthService.getAccountById(Number(payload.accountId));
    if (!user) {
      set.status = 404;
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      user,
    };
  });
