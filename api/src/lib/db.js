import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const globalForDb = globalThis;

const databaseUrl = process.env.DATABASE_URL ?? "";
const needsSsl =
  process.env.NODE_ENV === "production" ||
  /render\.com|neon\.tech|supabase\.co/i.test(databaseUrl);

const client =
  globalForDb.__pgClient ??
  postgres(databaseUrl, {
    max: 10,
    ssl: needsSsl ? "require" : false,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__pgClient = client;

export const db = drizzle(client, { schema });
export { client };
