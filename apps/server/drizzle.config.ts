import config from "#/core/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  dbCredentials: {
    url: config.databaseUrl,
  },
  schema: ["./src/core/db/auth-schema.ts", "./src/core/db/schema.ts"],
});
