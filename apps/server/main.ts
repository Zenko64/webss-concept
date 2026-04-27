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

const io = new Server<ConnData>({
  cors: {
    origin: true,
    credentials: true,
  },
});
const engine = new Engine({ path: "/api/socket/" });
io.bind(engine);
setupRoomHandlers(io);

// cors conf, apply this to all different route branches
const corsConfig = {
  origin: (origin: string) => origin ?? env.appUrl,
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
};

const authRoutes = new Hono<AppEnv>()
  .use("*", cors(corsConfig))
  .use(authMiddleware)
  .route("/rooms", createRoomsRouter(io));

const routes = new Hono<AppEnv>()
  .use("*", cors(corsConfig))
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
