/**
 * @file config.ts
 * @name Config
 * @description This file parses and validates the environment variables provided using Zod.
 * It ensures that all required configuration is present before starting the application.
 * @module core/config
 * @author Zenko
 */
import z, { url } from "zod";

const configSchema = z.object({
  appUrl: z.url(),
  host: z.string(),
  port: z.coerce.number(),
  redisUrl: z.url(),
  secret: z.string().min(32),
  databaseUrl: z.url(),
  providers: z
    .partialRecord(
      z.enum(["github", "google", "discord", "oidc"]),
      z.object({
        url: z.string().optional(),
        clientId: z.string(),
        clientSecret: z.string(),
      }),
    )
    .refine((val) => Object.keys(val).length >= 1, {
      message: "At least one provider required",
    })
    .optional(),
});

const env = configSchema.safeParse({
  appUrl: process.env.APP_URL,
  host: process.env.HOST,
  port: process.env.PORT,
  redisUrl: process.env.REDIS_URL,
  secret: process.env.SECRET,
  databaseUrl: process.env.DATABASE_URL,
  providers: {
    github: process.env.GITHUB_CLIENT_ID
      ? {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
        }
      : undefined,
  },
});

if (!env.success) {
  console.error(
    "Config validation failed:",
    JSON.stringify(z.treeifyError(env.error), null, 2),
  );
  throw new Error("Invalid configuration.");
}

export default env.data;
