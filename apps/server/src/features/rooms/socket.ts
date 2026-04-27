import { Server as SIOServer, Socket as SIOSocket } from "socket.io";
import { roomsCache } from "#/features/rooms/cache";
import { auth } from "#/shared/libs/auth";
import { AppError } from "#/shared/errors";
import { getRoom, getUserRooms } from "./db";
import { type RoomUserData } from "./types";
import { roomData } from "@webss/types/src/schemas";
import type { ClientToServer, ServerToClient } from "@webss/types";

export type ConnData = {
  user: (typeof auth.$Infer.Session)["user"];
  room: string | null;
};

type Server = SIOServer<ClientToServer, ServerToClient, any, ConnData>;
type Socket = SIOSocket<ClientToServer, ServerToClient, any, ConnData>;

function mapUserData(
  usr: Awaited<ReturnType<typeof getRoom>>["users"][number] | ConnData["user"],
  isConnected: boolean,
): RoomUserData {
  if ("userId" in usr) {
    return {
      [usr.userId]: {
        name: usr.user.name,
        image: usr.user.image,
        connected: isConnected,
      },
    };
  } else {
    return {
      [usr.id]: {
        name: usr.name,
        image: usr.image,
        connected: isConnected,
      },
    };
  }
}

// connected = "currently joined to this specific room" (in the Socket.IO room), not global presence.
async function buildRoomUpdated(io: Server, nanoid: string) {
  const dbRoom = await getRoom(nanoid);
  const sockets = await io.in(nanoid).fetchSockets();
  const connectedUserIds = new Set(sockets.map((s) => s.data.user.id));
  const cached = await roomsCache.getRoom(nanoid);
  const users: RoomUserData = Object.fromEntries(
    dbRoom.users
      .map((usr) => mapUserData(usr, connectedUserIds.has(usr.userId)))
      .flatMap((u) => Object.entries(u)),
  );
  const result = await roomData.safeParseAsync({
    nanoid: dbRoom.nanoid,
    name: dbRoom.name,
    ownerId: dbRoom.ownerId,
    screens: cached?.screens ?? {},
    users,
  });
  return { result, memberUserIds: dbRoom.users.map((u) => u.userId) };
}

// Emit room-updated to all DB members, not just those currently in the Socket.IO room.
function emitRoomUpdatedToAllMembers(
  io: Server,
  userSocketMap: Map<string, string>,
  nanoid: string,
  data: Parameters<ServerToClient["room-updated"]>[0],
  memberUserIds: string[],
) {
  let emitter = io.to(nanoid);
  for (const userId of memberUserIds) {
    const sid = userSocketMap.get(userId);
    if (sid) emitter = emitter.to(sid);
  }
  emitter.emit("room-updated", data);
}

async function broadcastRoomUpdate(
  io: Server,
  userSocketMap: Map<string, string>,
  nanoid: string,
) {
  const { result, memberUserIds } = await buildRoomUpdated(io, nanoid);
  if (!result.success) return null;
  emitRoomUpdatedToAllMembers(io, userSocketMap, nanoid, { ...result.data }, memberUserIds);
  return result.data;
}

function emitError(socket: Socket, err: unknown) {
  if (err instanceof AppError) {
    socket.emit("socket-error", { message: err.message, status: err.status });
  } else {
    console.error(err);
    socket.emit("socket-error", {
      message: "An unknown error has occurred.",
      status: 500,
    });
  }
}

export function setupRoomHandlers(io: Server) {
  const userSocketMap = new Map<string, string>(); // userId → socketId

  io.use(async (socket, next) => {
    const sessionData = await auth.api.getSession({
      headers: socket.request.headers,
    });
    if (!sessionData) {
      return next(
        new AppError("Unauthorized. Please verify your credentials.", 401),
      );
    }
    socket.data.user = sessionData.user;
    next();
  });

  io.on("connection", (socket: Socket) => {
    userSocketMap.set(socket.data.user.id, socket.id);
    let joinRoomQueue: Promise<void> = Promise.resolve();

    const leaveRoomAndBroadcast = async (roomNanoid: string) => {
      io.to(roomNanoid).emit(
        "user-disconnected",
        mapUserData(socket.data.user, false),
      );
      await socket.leave(roomNanoid);
      // User still online (just left this room) — buildRoomUpdated reflects global presence.
      await broadcastRoomUpdate(io, userSocketMap, roomNanoid);
    };

    socket.on("webrtc-offer", ({ to, sdp }) => {
      const target = userSocketMap.get(to);
      if (target)
        io.to(target).emit("webrtc-offer", { from: socket.data.user.id, sdp });
    });

    socket.on("webrtc-answer", ({ to, sdp }) => {
      const target = userSocketMap.get(to);
      if (target)
        io.to(target).emit("webrtc-answer", { from: socket.data.user.id, sdp });
    });

    socket.on("webrtc-ice-candidate", ({ to, candidate }) => {
      const target = userSocketMap.get(to);
      if (target)
        io.to(target).emit("webrtc-ice-candidate", {
          from: socket.data.user.id,
          candidate,
        });
    });

    socket.on("join-room", (roomNanoid: string) => {
      joinRoomQueue = joinRoomQueue
        .then(async () => {
          const roomsToLeave = [...socket.rooms].filter(
            (roomId) => roomId !== socket.id && roomId !== roomNanoid,
          );

          for (const oldNanoid of roomsToLeave) {
            await leaveRoomAndBroadcast(oldNanoid);
          }

          if (roomsToLeave.length > 0) {
            socket.data.room = null;
          }

          const dbRoom = await getRoom(roomNanoid);
          const alreadyJoined = socket.rooms.has(dbRoom.nanoid);

          if (!alreadyJoined) {
            await socket.join(dbRoom.nanoid);
          }

          socket.data.room = dbRoom.nanoid;

          if (!alreadyJoined) {
            io.to(dbRoom.nanoid).emit(
              "user-connected",
              mapUserData(socket.data.user, true),
            );
          }

          const { result: roomDataResult, memberUserIds } =
            await buildRoomUpdated(io, dbRoom.nanoid);
          if (!roomDataResult.success) {
            socket.emit("socket-error", {
              message: "An unknown error has occurred while parsing room data.",
              status: 500,
            });
            return;
          }

          // Populate Redis cache so startBroadcast/spectate handlers can find the room.
          await roomsCache.setRoom(dbRoom.nanoid, roomDataResult.data);

          emitRoomUpdatedToAllMembers(
            io,
            userSocketMap,
            dbRoom.nanoid,
            { ...roomDataResult.data },
            memberUserIds,
          );
        })
        .catch((err) => {
          emitError(socket, err);
        });
    });

    socket.on("disconnect", async () => {
      // Delete from map first so buildRoomUpdated sees them as offline.
      userSocketMap.delete(socket.data.user.id);

      const currentRoom = socket.data.room;
      if (currentRoom) {
        const disconnectedUser = mapUserData(socket.data.user, false);
        io.to(currentRoom).emit("user-disconnected", disconnectedUser);
        // Clear broadcaster's screen from cache and notify spectators before
        // building room-updated, so the emitted state has screens removed.
        io.to(currentRoom).emit("broadcast-stopped", disconnectedUser);
        await roomsCache
          .stopBroadcast(currentRoom, socket.data.user.id)
          .catch(() => {});
        socket.data.room = null;
      }

      // Fan out to ALL rooms the user is a member of, not just the current one.
      // This ensures presence (connected: false) propagates everywhere they appear.
      try {
        const queryData = await getUserRooms(socket.data.user.id);
        if (!queryData) return;
        await Promise.all(
          queryData.rooms.map(({ room }) =>
            broadcastRoomUpdate(io, userSocketMap, room.nanoid),
          ),
        );
      } catch {}
    });

    socket.on("start-broadcast", async (streamId: string) => {
      try {
        if (!socket.data.room) {
          return socket.emit("socket-error", {
            message: "You are not connected to a room.",
            status: 400,
          });
        }
        await roomsCache.startBroadcast(
          socket.data.room,
          socket.data.user.id,
          streamId,
        );
        io.to(socket.data.room).emit("broadcast-started", {
          userId: socket.data.user.id,
          streamId,
          startedAt: Date.now(),
        });

        await broadcastRoomUpdate(io, userSocketMap, socket.data.room);
      } catch (err) {
        emitError(socket, err);
      }
    });

    socket.on("stop-broadcast", async () => {
      try {
        if (!socket.data.room) {
          return socket.emit("socket-error", {
            message: "You are not connected to a room.",
            status: 400,
          });
        }
        await roomsCache.stopBroadcast(socket.data.room, socket.data.user.id);
        io.to(socket.data.room).emit(
          "broadcast-stopped",
          mapUserData(socket.data.user, false),
        );

        await broadcastRoomUpdate(io, userSocketMap, socket.data.room);
      } catch (err) {
        emitError(socket, err);
      }
    });

    socket.on("start-spectate", async (broadcasterId: string) => {
      try {
        if (!socket.data.room) {
          return socket.emit("socket-error", {
            message: "You are not connected to a room.",
            status: 400,
          });
        }
        // Cache update is best-effort — a cold cache must not block the WebRTC
        // signalling flow. user-started-spectating is what triggers the broadcaster
        // to create an offer; it must always be emitted.
        await roomsCache
          .spectate(socket.data.room, broadcasterId, socket.data.user.id)
          .catch(() => {});

        io.to(socket.data.room).emit(
          "user-started-spectating",
          socket.data.user.id,
          broadcasterId,
        );

        await broadcastRoomUpdate(io, userSocketMap, socket.data.room);
      } catch (err) {
        emitError(socket, err);
      }
    });

    socket.on("stop-spectate", async (broadcasterId: string) => {
      try {
        if (!socket.data.room) {
          return socket.emit("socket-error", {
            message: "You are not connected to a room.",
            status: 400,
          });
        }
        await roomsCache.stopSpectate(
          socket.data.room,
          broadcasterId,
          socket.data.user.id,
        );
        io.to(socket.data.room).emit(
          "user-stopped-spectating",
          socket.data.user.id,
          broadcasterId,
        );

        await broadcastRoomUpdate(io, userSocketMap, socket.data.room);
      } catch (err) {
        emitError(socket, err);
      }
    });

    socket.on("fetch-rooms", async (query?: string) => {
      try {
        const queryData = await getUserRooms(
          socket.data.user.id,
          !query ? undefined : query,
        );
        if (!queryData) {
          return socket.emit("socket-error", {
            message: "An unknown error has occurred while fetching rooms.",
            status: 500,
          });
        }
        const roomsData = await Promise.all(
          queryData.rooms.map(async ({ room }) => {
            const connectedSockets = await io.in(room.nanoid).fetchSockets();
            const connectedIds = new Set(
              connectedSockets.map((s) => s.data.user.id),
            );
            return {
              nanoid: room.nanoid,
              name: room.name,
              ownerId: room.ownerId,
              users: room.users.map((u) => ({
                userId: u.userId,
                name: u.user.name,
                image: u.user.image,
                connected: connectedIds.has(u.userId),
              })),
            };
          }),
        );
        socket.emit("rooms-fetched", roomsData);
      } catch (err) {
        emitError(socket, err);
      }
    });
  });
}
