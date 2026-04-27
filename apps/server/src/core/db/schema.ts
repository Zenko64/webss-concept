import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const rooms = pgTable("rooms", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nanoid: varchar("nanoid", { length: 21 }).notNull().unique(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 32 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const usersRooms = pgTable("users_rooms", {
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  roomId: integer("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  admin: boolean("admin").default(false).notNull(),
  muted: boolean("muted").default(false).notNull(),
  banned: boolean("banned").default(false).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
});

export const roomsRelations = relations(rooms, ({ many }) => ({
  users: many(usersRooms),
}));

export const usersRelations = relations(user, ({ many }) => ({
  rooms: many(usersRooms),
}));

export const usersRoomsRelations = relations(usersRooms, ({ one }) => ({
  room: one(rooms, {
    fields: [usersRooms.roomId],
    references: [rooms.id],
  }),
  user: one(user, {
    fields: [usersRooms.userId],
    references: [user.id],
  }),
}));
