import z from "zod";

export const incomingScreen = z.object({
  userId: z.string(),
  streamId: z.string(),
  startedAt: z.number(),
});

export const roomScreens = z.record(
  z.string(), // the ID Of the user sharing
  z.object({
    streamId: z.string(),
    observers: z.array(z.string()),
    startedAt: z.number(),
  }),
);

export const roomUsers = z.record(
  z.string(),
  z.object({
    name: z.string(),
    image: z.string().nullable().optional(),
    connected: z.boolean(),
    admin: z.boolean().optional(),
    banned: z.boolean().optional(),
  }),
);

export const roomData = z.object({
  ownerId: z.string(),
  nanoid: z.string(),
  name: z
    .string()
    .min(3, { message: "The Room name must be at least 3 characters long." })
    .max(32, { message: "The Room name must be at most 32 characters long." }),
  screens: roomScreens.optional().default({}),
  users: roomUsers,
});

export type IncomingScreen = z.infer<typeof incomingScreen>;
