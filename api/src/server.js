import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../.env") });

process.on("unhandledRejection", (reason) => {
  console.error("[api] Unhandled rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[api] Uncaught exception:", err);
});

const { default: app } = await import("./app.js");

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`RentRide API (Express) running on http://localhost:${PORT}`);
});
