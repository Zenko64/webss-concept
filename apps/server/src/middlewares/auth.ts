import { auth } from "#/shared/libs/auth";
import type { AppEnv } from "#/shared/types/global";
import { createMiddleware } from "hono/factory";

export const authMiddleware = createMiddleware<AppEnv>(
  async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("session", session.session);
    c.set("user", session.user);
    await next();
  },
);

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.var.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});