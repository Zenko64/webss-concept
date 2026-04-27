import redis from "#/core/cache";
import { AppError } from "#/shared/errors";
import type { RoomData } from "@webss/types";
import { getRoom, joinRoom } from "../rooms/db";
import crypto from "crypto";
import schemas from "@webss/types";

interface InviteData {
  roomNanoid: string;
}

async function createInvite(
  roomNanoid: string,
  userId: string,
  ttlSeconds?: number,
) {
  const room = await getRoom(roomNanoid);
  if (!room) throw new AppError("The specified room was not found.", 404);
  if (room.ownerId !== userId)
    throw new AppError("Only the room owner can create invites.", 403);

  const secretKey = crypto.randomBytes(4).toString("hex");

  if (ttlSeconds !== undefined) {
    await redis.setex(
      `invites:${secretKey}`,
      ttlSeconds,
      JSON.stringify({ roomNanoid }),
    );
  } else {
    await redis.set(`invites:${secretKey}`, JSON.stringify({ roomNanoid }));
  }

  await redis.sadd(`rooms:${roomNanoid}:invites`, secretKey);

  return secretKey;
}

async function checkInvite(secretKey: string): Promise<RoomData> {
  const data = await redis.get(`invites:${secretKey}`);
  if (!data) throw new AppError("Invalid or expired invite link.", 404);

  try {
    const parsed: InviteData = JSON.parse(data);
    const room = await getRoom(parsed.roomNanoid);
    if (!room) throw new AppError("The specified room was not found.", 404);

    const result = await schemas.roomData.safeParseAsync({
      ...room,
      users: Object.fromEntries(
        Object.entries(room.users).map(([userId, user]) => [
          userId,
          { ...user.user, connected: false },
        ]),
      ),
    });
    if (!result.success) {
      throw new AppError("Corrupted invite data.", 500);
    }
    return result.data;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Corrupted invite data.", 500);
  }
}

async function acceptInvite(secretKey: string, userId: string) {
  const data = await redis.get(`invites:${secretKey}`);
  if (!data) throw new AppError("Invalid or expired invite link.", 404);

  const parsed: InviteData = JSON.parse(data);
  const roomToJoin = await getRoom(parsed.roomNanoid);
  if (!roomToJoin) throw new AppError("The specified room was not found.", 404);

  await joinRoom(roomToJoin.nanoid, userId);
}

async function listInvites(roomNanoid: string, userId: string) {
  const room = await getRoom(roomNanoid);
  if (!room) throw new AppError("The specified room was not found.", 404);
  if (room.ownerId !== userId)
    throw new AppError("Only the room owner can list invites.", 403);

  const keys = await redis.smembers(`rooms:${roomNanoid}:invites`);
  if (!keys.length) return [];

  const [values, ttls] = await Promise.all([
    redis.mget(...keys.map((k) => `invites:${k}`)),
    Promise.all(keys.map((k) => redis.ttl(`invites:${k}`))),
  ]);

  return keys.flatMap((secretKey, i) => {
    if (!values[i]) {
      redis.srem(`rooms:${roomNanoid}:invites`, secretKey).catch(() => {});
      return [];
    }
    const ttl = ttls[i] ?? -1;
    const expiresAt = ttl > 0 ? new Date(Date.now() + ttl * 1000) : null;
    return [{ secretKey, ...(JSON.parse(values[i]) as InviteData), expiresAt }];
  });
}

async function deleteInvite(secretKey: string, userId: string) {
  const data = await redis.get(`invites:${secretKey}`);
  if (!data) throw new AppError("Invalid or expired invite link.", 404);

  const parsed: InviteData = JSON.parse(data);
  const room = await getRoom(parsed.roomNanoid);
  if (!room) throw new AppError("The specified room was not found.", 404);
  if (room.ownerId !== userId)
    throw new AppError("Only the room owner can delete invites.", 403);

  await redis.del(`invites:${secretKey}`);
  await redis.srem(`rooms:${parsed.roomNanoid}:invites`, secretKey);
}

export default {
  createInvite,
  checkInvite,
  acceptInvite,
  listInvites,
  deleteInvite,
};
