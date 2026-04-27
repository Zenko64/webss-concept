import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as authSchema from "./auth-schema";
import * as schema from "./schema";
import config from "../config";

const client = postgres(config.databaseUrl, {
  onnotice: (msg) => {
    console.warn("Postgres Notice:", msg.message);
  },
});

export const db = drizzle(client, { schema: { ...schema, ...authSchema } });

db.execute("SELECT 1").catch((err) => {
  console.error("Database connection failed:", err);
  process.exit(1);
});
