import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "#/core/db";
import config from "#/core/config";
import redis from "#/core/cache";
import { anonymous } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secondaryStorage: {
    get: async (key) => await redis.get(key),
    set: async (key, value, ttl) => {
      if (ttl) await redis.setex(key, ttl, value);
      else await redis.set(key, value);
    },
    delete: async (key) => (await redis.del(key)).toString(),
  },
  plugins: [anonymous()],
  trustedOrigins: [config.appUrl, "http://100.64.0.15:5173", "http://192.168.0.9:5173"],
  baseURL: config.appUrl,
  secret: config.secret,
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: config.providers?.github
      ? {
          clientId: config.providers.github.clientId,
          clientSecret: config.providers.github.clientSecret,
        }
      : undefined,
  },
});

export type AuthType = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};
