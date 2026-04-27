import { Hono } from "hono";
import { createRoom, deleteRoom } from "./db";
import { zValidator } from "@hono/zod-validator";
import schemas from "@webss/types";
import type { AppEnv } from "#/shared/types/global";
import type { Server } from "socket.io";
import type { ConnData } from "./socket";
import { roomsCache } from "./cache";
import { checkAuth } from "../../shared/functions";
const { roomData } = schemas;

export function createRoomsRouter(io: Server<any, any, any, ConnData>) {
  return new Hono<AppEnv>()
    .post("/", zValidator("json", roomData.pick({ name: true })), async (c) => {
      const { name } = c.req.valid("json");
      const { userId } = checkAuth(c);
      const result = await createRoom(name, userId);
      return c.json(result);
    })
    .delete("/:nanoid", async (c) => {
      const { userId } = checkAuth(c);
      const nanoid = c.req.param("nanoid");
      await roomsCache.deleteRoom(nanoid);
      const result = await deleteRoom(nanoid, userId);
      io.in(nanoid).disconnectSockets();
      return c.json(result);
    });
}
