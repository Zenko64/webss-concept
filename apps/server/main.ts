import { Hono } from "hono";
import env from "#/core/config";
import auth from "#/features/auth";
import { createRoomsRouter } from "#/features/rooms";
import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";
import { setupRoomHandlers, type ConnData } from "#/features/rooms/socket";
import { authMiddleware } from "#/middlewares/auth";
import type { AppEnv } from "#/shared/types/global";
import inviteRoutes from "#/features/invites";
import { cors } from "hono/cors";

const io = new Server<ConnData>();
const engine = new Engine({ path: "/api/socket/" });
io.bind(engine);
setupRoomHandlers(io);

const authRoutes = new Hono<AppEnv>()
  .use("*", cors())
  .use(authMiddleware)
  .route("/rooms", createRoomsRouter(io));

const routes = new Hono<AppEnv>()
  .use("*", cors()) // TODO: This is a bad idea, it will be fixed latrer
  .basePath("/api")
  .route("/auth", auth)
  .route("/", authRoutes)
  .route("/invite", inviteRoutes);
const { websocket } = engine.handler();

Bun.serve({
  port: env.port,
  hostname: env.host,
  idleTimeout: 30,
  websocket,
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/socket/")) {
      return engine.handleRequest(req, server);
    }
    return routes.fetch(req);
  },
});

console.log(`Server running on http://${env.host}:${env.port}`);

export type AppType = typeof routes;
