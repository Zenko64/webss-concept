import { and, eq, ilike, isNull } from "drizzle-orm";
import { rooms, usersRooms } from "../../core/db/schema";
import { nanoid as mkNanoid } from "nanoid";
import { transaction } from "#/core/db/utils";
import { AppError } from "#/shared/errors";
import { user } from "#/core/db/auth-schema";
import { type Transaction } from "#/shared/types";

async function queryUser(tx: Transaction, userId: string) {
  const userData = await tx.query.user.findFirst({
    where: () => eq(user.id, userId),
  });
  if (!userData) {
    throw new AppError("The specified user was not found.", 404);
  }
  return userData;
}

async function queryRoom(tx: Transaction, roomNanoid: string) {
  const room = await tx.query.rooms.findFirst({
    where: () => eq(rooms.nanoid, roomNanoid),
    with: {
      users: {
        columns: {
          userId: true,
          admin: true,
          banned: true,
        },
        with: {
          user: {
            columns: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });
  if (!room) {
    throw new AppError("The specified room was not found.", 404);
  }
  return room;
}

export async function getUserRooms(userId: string, query?: string) {
  return await transaction(async (tx) => {
    const foundUser = await queryUser(tx, userId);

    return await tx.query.user.findFirst({
      where: () => eq(user.id, foundUser.id),
      with: {
        rooms: {
          columns: {},
          with: {
            room: {
              columns: {
                name: true,
                nanoid: true,
                ownerId: true,
              },
              with: {
                users: {
                  with: {
                    user: {
                      columns: {
                        name: true,
                        image: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  });
}

export async function getRooms(query?: string, userId?: string) {
  return await transaction(async (tx) => {
    const foundUser = userId ? await queryUser(tx, userId) : undefined;

    return await tx.query.rooms.findMany({
      where: () => {
        const conditions = [];
        if (query) {
          conditions.push(ilike(rooms.name, `%${query.replace(/%/g, "\\%")}%`));
        }
        return and(...conditions);
      },
      with: {
        users: {
          where: (user) => {
            const conditions = [];
            if (foundUser) {
              conditions.push(eq(user.userId, foundUser.id));
            } else {
              conditions.push(isNull(user.leftAt));
            }
            return and(...conditions);
          },
          with: {
            user: {
              columns: {
                name: true,
                image: true,
              },
            },
          },
          columns: {
            leftAt: false,
            joinedAt: false,
            banned: false,
            admin: false,
          },
        },
      },
    });
  });
}

export async function getRoom(roomNanoid: string) {
  return await transaction(async (tx) => {
    return await queryRoom(tx, roomNanoid);
  });
}

export async function createRoom(name: string, userId: string) {
  return await transaction(async (tx) => {
    const foundUser = await queryUser(tx, userId);
    const [room] = await tx
      .insert(rooms)
      .values({
        nanoid: mkNanoid(),
        name,
        ownerId: foundUser.id,
      })
      .returning();
    if (!room) {
      throw new Error("An unknown error occurred while creating the room.");
    }

    const [userRoom] = await tx
      .insert(usersRooms)
      .values({
        roomId: room.id,
        userId: foundUser.id,
      })
      .returning();
    if (!userRoom) {
      throw new Error(
        "An unknown error occurred while adding the user to the room.",
      );
    }

    const finalData = await queryRoom(tx, room.nanoid);
    if (!finalData) {
      throw new Error(
        "An unknown error occurred while retrieving the created room.",
      );
    }
    return finalData;
  });
}

export async function joinRoom(roomNanoid: string, userId: string) {
  return await transaction(async (tx) => {
    const foundUser = await queryUser(tx, userId);
    const room = await queryRoom(tx, roomNanoid);

    const isPresent = await tx.query.usersRooms.findFirst({
      where: () =>
        and(
          eq(usersRooms.userId, foundUser.id),
          eq(usersRooms.roomId, room.id),
        ),
    });
    if (isPresent && isPresent.banned) {
      throw new AppError("You have been banned from this room.", 403);
    } else if (isPresent && !isPresent.leftAt) {
      throw new AppError("You have already joined this room.", 409);
    }

    const [joinedRoom] = await tx
      .insert(usersRooms)
      .values({
        roomId: room.id,
        userId: foundUser.id,
      })
      .returning();
    if (!joinedRoom) {
      throw new Error(
        "An unknown error occurred while adding the user to the room.",
      );
    }

    const finalData = await queryRoom(tx, room.nanoid);
    if (!finalData) {
      throw new Error(
        "An unknown error occurred while retrieving the room after joining.",
      );
    }
    return finalData;
  });
}

export async function leaveRoom(roomNanoid: string, userId: string) {
  return await transaction(async (tx) => {
    const foundUser = await queryUser(tx, userId);
    const foundRoom = await queryRoom(tx, roomNanoid);

    const isPresent = await tx.query.usersRooms.findFirst({
      where: () =>
        and(
          eq(usersRooms.userId, foundUser.id),
          eq(usersRooms.roomId, foundRoom.id),
        ),
    });
    if (!isPresent || isPresent.leftAt) {
      throw new AppError("You are not in this room.", 409);
    }

    const [updatedUserRoom] = await tx
      .update(usersRooms)
      .set({ leftAt: new Date() })
      .where(
        and(
          eq(usersRooms.userId, foundUser.id),
          eq(usersRooms.roomId, foundRoom.id),
        ),
      )
      .returning();
    if (!updatedUserRoom) {
      throw new Error("An unknown error has occurred while leaving the room.");
    }

    const finalData = await queryRoom(tx, foundRoom.nanoid);
    if (!finalData) {
      throw new Error("An unknown error has occurred while leaving the room.");
    }

    return finalData;
  });
}

export async function deleteRoom(roomNanoid: string, userId: string) {
  return await transaction(async (tx) => {
    const foundRoom = await queryRoom(tx, roomNanoid);
    if (foundRoom.ownerId !== userId) {
      throw new AppError("You are not the owner of this room.", 403);
    }
    const [deletedRoom] = await tx
      .delete(rooms)
      .where(eq(rooms.id, foundRoom.id))
      .returning();
    if (!deletedRoom) {
      throw new AppError("The specified room was not found.", 404);
    }
    return deletedRoom;
  });
}

export async function banUser(roomNanoid: string, userId: string) {
  return await transaction(async (tx) => {
    const userToBan = await queryUser(tx, userId);
    const roomToBanFrom = await queryRoom(tx, roomNanoid);

    const [bannedUser] = roomToBanFrom.users.some(
      (usr) => usr.userId === userToBan.id,
    )
      ? await tx
          .update(usersRooms)
          .set({ banned: true, leftAt: new Date() })
          .where(
            and(
              eq(usersRooms.roomId, roomToBanFrom.id),
              eq(usersRooms.userId, userToBan.id),
            ),
          )
          .returning()
      : await tx
          .insert(usersRooms)
          .values({
            roomId: roomToBanFrom.id,
            userId: userToBan.id,
            banned: true,
            leftAt: new Date(),
          })
          .returning();

    if (!bannedUser) {
      throw new Error("An unknown error has occurred while banning the user.");
    }

    const finalData = await queryRoom(tx, roomToBanFrom.nanoid);
    if (!finalData) {
      throw new Error("An unknown error has occurred while banning the user.");
    }

    return finalData;
  });
}

export async function unbanUser(roomNanoid: string, userId: string) {
  return await transaction(async (tx) => {
    const userToUnban = await queryUser(tx, userId);
    const roomToUnbanFrom = await queryRoom(tx, roomNanoid);

    const [unbannedUser] = await tx
      .update(usersRooms)
      .set({ banned: false })
      .where(
        and(
          eq(usersRooms.roomId, roomToUnbanFrom.id),
          eq(usersRooms.userId, userToUnban.id),
          eq(usersRooms.banned, true),
        ),
      )
      .returning();
    if (!unbannedUser) {
      throw new AppError(
        "The specified user is not banned from this room.",
        409,
      );
    }

    const finalData = await queryRoom(tx, roomToUnbanFrom.nanoid);
    if (!finalData) {
      throw new Error(
        "An unknown error has occurred while unbanning the user.",
      );
    }

    return finalData;
  });
}
