import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
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
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
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
var app_default = app;
export {
  app_default as default
};
