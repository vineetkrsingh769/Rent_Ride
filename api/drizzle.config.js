import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../.env") });
config({ path: path.resolve(__dirname, "../.env") });

export default defineConfig({
  schema: "./src/lib/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
