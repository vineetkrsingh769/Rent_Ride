import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../.env") });

const { notifyBookingCreated, notifyBookingStatusUpdated, sendEmail, sendSms } = await import(
  "../src/lib/notifications.js"
);

async function runTest() {
  console.log("==========================================");
  console.log("   Testing RentRide Notification System   ");
  console.log("==========================================");

  const mockCustomer = {
    name: "John Doe",
    email: "customer@rentride.com",
    phone: "+919876543210",
  };

  const mockAgency = {
    name: "Speed Fleet Manager",
    agencyName: "Speed Rentals",
    email: "agency@rentride.com",
    phone: "+919876543211",
  };

  const mockVehicle = {
    name: "Classic 350",
    brand: "Royal Enfield",
    vehicleModel: "Dual Channel Dark",
    vehicleNumber: "MH 02 ER 4567",
    type: "2W",
    location: "Mumbai, Bandra West",
  };

  const mockBooking = {
    id: "cuid_test_booking_987654",
    startDate: new Date(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    startTime: "10:00 AM",
    endTime: "06:00 PM",
    duration: "daily",
    totalDays: 3,
    totalPrice: 2400,
    status: "pending",
  };

  console.log("\n1. Testing New Booking Creation Notification (Pending)...");
  await notifyBookingCreated({
    booking: mockBooking,
    vehicle: mockVehicle,
    customer: mockCustomer,
    agency: mockAgency,
  });

  console.log("\n2. Testing Booking Approved Notification...");
  await notifyBookingStatusUpdated({
    booking: { ...mockBooking, status: "approved" },
    vehicle: mockVehicle,
    customer: mockCustomer,
    agency: mockAgency,
    newStatus: "approved",
    prevStatus: "pending",
  });

  console.log("\n3. Testing Booking Cancelled Notification...");
  await notifyBookingStatusUpdated({
    booking: { ...mockBooking, status: "cancelled" },
    vehicle: mockVehicle,
    customer: mockCustomer,
    agency: mockAgency,
    newStatus: "cancelled",
    prevStatus: "pending",
  });

  console.log("\n==========================================");
  console.log("   Notification tests finished cleanly!   ");
  console.log("==========================================");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
