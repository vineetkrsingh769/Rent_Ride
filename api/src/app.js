import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { sql } from "drizzle-orm";
import { db } from "./lib/db.js";
import authRoutes from "./routes/auth.js";
import vehicleRoutes from "./routes/vehicles.js";
import bookingRoutes from "./routes/bookings.js";
import agencyRoutes from "./routes/agency.js";
import pricingRoutes from "./routes/pricing.js";
import adminRoutes from "./routes/admin.js";

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== "production") {
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
// Liveness only — Render's healthCheckPath points here, so it must not depend
// on Postgres being awake or a cold free-tier database would fail the deploy.
app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

// Readiness. Use this after deploying to confirm the schema actually exists:
// a 200 means migrations ran, a 503 means the API is up but the database is not.
app.get("/api/health/db", async (_req, res) => {
  try {
    const [row] = await db.execute(sql`select count(*)::int as users from "User"`);
    res.json({ success: true, data: { status: "ok", db: "ok", users: row?.users ?? 0 } });
  } catch (err) {
    res.status(503).json({ success: false, error: `Database unreachable: ${err.message}` });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/agency", agencyRoutes);
app.use("/api/admin", adminRoutes);
app.use((err, _req, res, _next) => {
  console.error("[api]", err);
  if (!res.headersSent) {
    res.status(500).json({ success: false, error: err?.message || "Internal server error" });
  }
});
export default app;
