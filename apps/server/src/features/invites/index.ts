import type { AppEnv } from "#/shared/types/global";
import { Hono } from "hono";
import cache from "./cache";
import { zValidator } from "@hono/zod-validator";
import z from "zod";
import { checkAuth } from "#/shared/functions";
import { AppError } from "#/shared/errors";

const app = new Hono<AppEnv>()
  .get(
    "/",
    zValidator("query", z.object({ roomNanoid: z.string() })),
    async (c) => {
      const { roomNanoid } = c.req.valid("query");
      const auth = checkAuth(c);
      const invites = await cache.listInvites(roomNanoid, auth.userId);
      return c.json(invites);
    },
  )
  .post(
    "/",
    zValidator(
      "json",
      z.object({ roomNanoid: z.string(), expiration: z.number().optional() }),
    ),
    async (c) => {
      const { roomNanoid, expiration } = c.req.valid("json");
      const auth = checkAuth(c);
      const invite = await cache.createInvite(
        roomNanoid,
        auth.userId,
        expiration,
      );
      return c.json({ secret: invite });
    },
  )
  .get("/:secret", async (c) => {
    const secret = c.req.param("secret");
    const inviteData = await cache.checkInvite(secret);
    return c.json(inviteData);
  })
  .post("/:secret/join", async (c) => {
    const auth = checkAuth(c);
    const secret = c.req.param("secret");
    const inviteData = await cache.checkInvite(secret);
    try {
      await cache.acceptInvite(secret, auth.userId);
    } catch (err) {
      if (err instanceof AppError && err.status === 409) {
        return c.json(inviteData);
      }
      throw err;
    }
    return c.json(inviteData);
  })
  .delete("/:secret", async (c) => {
    const auth = checkAuth(c);
    const secret = c.req.param("secret");
    await cache.deleteInvite(secret, auth.userId);
    return c.body(null, 204);
  });

export default app;
