import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../.env") });

// Credentials come from the same SEED_* values used to create the demo accounts.
// Never hardcode them here — this file is committed and the demo logins are not
// published in the repository.
const API_URL = (process.env.API_URL || "http://127.0.0.1:3001").replace(/\/$/, "");

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}. Set the SEED_* credentials in .env before running this script.`);
  }
  return value;
}

async function login(email, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Login failed for ${email} (${res.status}): ${body.error ?? res.statusText}`);
  }
  return { cookie: res.headers.get("set-cookie") ?? "", status: res.status };
}

async function testLiveFlow() {
  console.log("\n==========================================");
  console.log("   Testing Live Booking Flow with Alerts  ");
  console.log("==========================================");
  console.log(`API: ${API_URL}`);

  // 1. Customer login
  const customer = await login(requireEnv("SEED_CUSTOMER_EMAIL"), requireEnv("SEED_CUSTOMER_PASSWORD"));
  console.log("[1] Customer logged in. Status:", customer.status);

  // 2. Fetch available vehicles
  const vehRes = await fetch(`${API_URL}/api/vehicles`);
  const { data: vehicles } = await vehRes.json();
  if (!vehicles?.length) {
    throw new Error("No available vehicles returned — run `npm run seed` first.");
  }
  const vehicle = vehicles[0];
  const vehicleId = vehicle._id || vehicle.id;
  console.log(`[2] Selected vehicle: ${vehicle.brand} ${vehicle.name} (ID: ${vehicleId})`);

  // 3. Create booking
  const offset = Math.floor(Math.random() * 50) + 20;
  const startDate = new Date(Date.now() + 86400000 * offset).toISOString();
  const endDate = new Date(Date.now() + 86400000 * (offset + 3)).toISOString();

  const bookRes = await fetch(`${API_URL}/api/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: customer.cookie,
    },
    body: JSON.stringify({
      vehicleId,
      startDate,
      endDate,
      duration: "daily",
      startTime: "09:00",
      endTime: "19:00",
      notes: "Testing live booking notifications flow",
    }),
  });
  const bookJson = await bookRes.json();
  if (bookJson.error) console.log("Booking error details:", bookJson.error);
  const bookingId = bookJson.data?._id || bookJson.data?.id;
  console.log(`[3] Booking request sent! Status: ${bookRes.status}, ID: #${bookingId?.slice(-6)}`);

  // 4. Agency login and approve
  const agency = await login(requireEnv("SEED_AGENCY_EMAIL"), requireEnv("SEED_AGENCY_PASSWORD"));
  console.log("[4] Agency logged in. Status:", agency.status);

  if (bookingId) {
    const approveRes = await fetch(`${API_URL}/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: agency.cookie,
      },
      body: JSON.stringify({ status: "approved" }),
    });
    const approveJson = await approveRes.json();
    console.log(`[5] Agency approved booking! Status: ${approveRes.status}, New Status: ${approveJson.data?.status}`);
  }

  console.log("\n==========================================");
  console.log("   Check terminal log above for alerts!   ");
  console.log("==========================================\n");
}

testLiveFlow().catch((e) => {
  console.error("Test failed:", e.message);
  process.exitCode = 1;
});
