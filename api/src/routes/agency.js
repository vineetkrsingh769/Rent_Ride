import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../lib/db.js";
import { bookings, vehicles } from "../lib/schema.js";
import { apiSuccess, apiError, createRouter } from "../lib/api.js";
import { resolveUser } from "../lib/session.js";
import { formatVehicle, serializeId } from "../lib/serialize.js";

const router = createRouter();

const agencyBookingWith = {
  customer: { columns: { id: true, name: true, email: true, phone: true } },
  vehicle: {
    with: {
      owner: { columns: { id: true, name: true, agencyName: true } },
    },
  },
};

router.get("/dashboard", async (req, res) => {
  const auth = await resolveUser(req, ["agency"]);
  if ("error" in auth) return apiError(res, auth.error, auth.status);
  const user = auth.session;

  const vehicleRows = await db.query.vehicles.findMany({
    where: eq(vehicles.ownerId, user.userId),
    orderBy: [desc(vehicles.createdAt)],
  });

  const ownedIds = vehicleRows.map((v) => v.id);
  const bookingRows = ownedIds.length
    ? await db.query.bookings.findMany({
        where: inArray(bookings.vehicleId, ownedIds),
        with: agencyBookingWith,
        orderBy: [desc(bookings.createdAt)],
      })
    : [];

  const formattedVehicles = vehicleRows.map(formatVehicle);
  const formattedBookings = bookingRows.map((b) =>
    serializeId({
      ...b,
      vehicle: b.vehicle ? formatVehicle(b.vehicle) : null,
    })
  );

  const stats = {
    totalFleet: formattedVehicles.length,
    available: formattedVehicles.filter((v) => v.status === "available").length,
    rented: formattedVehicles.filter((v) => v.status === "rented").length,
    maintenance: formattedVehicles.filter((v) => v.status === "maintenance").length,
    pendingBookings: formattedBookings.filter((b) => b.status === "pending").length,
    activeRentals: formattedBookings.filter((b) => b.status === "active" || b.status === "approved").length,
  };

  return apiSuccess(res, {
    vehicles: formattedVehicles,
    bookings: formattedBookings,
    stats,
  });
});

export default router;
