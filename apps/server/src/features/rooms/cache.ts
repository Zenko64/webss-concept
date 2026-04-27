/**
 * @name roomsCache
 * @description This module provides caching functions for room data using redis. It stores active room data.
 * @file cache.ts
 * @author Zenko
 */
import z from "zod";
import redis from "#/core/cache";
import { roomData, roomScreens } from "@webss/types/src/schemas";
import { AppError } from "#/shared/errors";

type CachedRoom = z.infer<typeof roomData>;
type CachedScreens = z.infer<typeof roomScreens>;

async function setRoom(
  roomNanoid: string,
  roomData: CachedRoom,
  ttlSeconds?: number,
) {
  if (!ttlSeconds) {
    await redis.set(`rooms:${roomNanoid}`, JSON.stringify(roomData));
  } else {
    await redis.setex(
      `rooms:${roomNanoid}`,
      ttlSeconds,
      JSON.stringify(roomData),
    );
  }
}

async function deleteRoom(roomNanoid: string) {
  await redis.del(`rooms:${roomNanoid}`);
}

async function getRoom(roomNanoid: string) {
  const cached = await redis.get(`rooms:${roomNanoid}`);
  if (!cached) return null;
  const safeData = roomData.safeParse(JSON.parse(cached ?? "null"));
  if (!safeData.success) {
    await redis.del(`rooms:${roomNanoid}`);
    return null;
  }
  return safeData.data;
}

async function startBroadcast(
  roomNanoid: string,
  userId: string,
  streamId: string,
) {
  const data = await getRoom(roomNanoid);
  if (!data) return;
  await setRoom(roomNanoid, {
    ...data,
    screens: {
      ...data.screens,
      [userId]: { streamId, observers: [], startedAt: Date.now() },
    },
  } as CachedRoom);
}

async function stopBroadcast(roomNanoid: string, userId: string) {
  const data = await getRoom(roomNanoid);
  if (!data) return;
  const screens = Object.fromEntries(
    Object.entries(data.screens).filter(([k]) => k !== userId),
  ) as CachedScreens;
  await setRoom(roomNanoid, { ...data, screens } as CachedRoom);
}

async function spectate(
  roomNanoid: string,
  broadcasterId: string,
  observerId: string,
) {
  const data = await getRoom(roomNanoid);
  if (!data) return;
  const screen = data.screens[broadcasterId];
  if (!screen) {
    throw new AppError("The specified user is not currently streaming.", 400);
  }
  await setRoom(roomNanoid, {
    ...data,
    screens: {
      ...data.screens,
      [broadcasterId]: {
        ...screen,
        observers: [...screen.observers, observerId],
      },
    },
  } as CachedRoom);
}

async function stopSpectate(
  roomNanoid: string,
  broadcasterId: string,
  observerId: string,
) {
  const data = await getRoom(roomNanoid);
  if (!data) return;
  const screen = data.screens[broadcasterId];
  if (!screen) {
    throw new AppError("The specified user is not currently streaming.", 400);
  }
  await setRoom(roomNanoid, {
    ...data,
    screens: {
      ...data.screens,
      [broadcasterId]: {
        ...screen,
        observers: screen.observers.filter((id) => id !== observerId),
      },
    },
  } as CachedRoom);
}

export const roomsCache = {
  getRoom,
  setRoom,
  deleteRoom,
  startBroadcast,
  stopBroadcast,
  spectate,
  stopSpectate,
};
