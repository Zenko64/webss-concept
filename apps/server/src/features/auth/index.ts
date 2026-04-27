import { Hono } from "hono";
import { auth } from "../../shared/libs/auth";
import type { AppEnv } from "#/shared/types/global";

const app = new Hono<AppEnv>({
  strict: false,
});

app.on(["GET", "POST"], "*", (c) => {
  return auth.handler(c.req.raw);
});

export default app;
