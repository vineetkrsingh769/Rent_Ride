import { Router } from "express";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "../lib/db.js";
import { bookingConflicts, bookings, vehicles } from "../lib/schema.js";
import { apiSuccess, apiError } from "../lib/api.js";
import { resolveUser } from "../lib/session.js";
import { hasBookingConflict } from "../lib/booking.js";
import { calculateRentalPrice, getDaysBetween } from "../lib/types.js";
import { formatVehicle, serializeId } from "../lib/serialize.js";

const router = Router();

const bookingWith = {
  vehicle: {
    with: {
      owner: { columns: { id: true, name: true, agencyName: true } },
    },
  },
  customer: { columns: { id: true, name: true, email: true, phone: true } },
};

router.get("/", async (req, res) => {
  const auth = await resolveUser(req);
  if ("error" in auth) return apiError(res, auth.error, auth.status);
  const user = auth.session;
  const { status } = req.query;

  const conditions = [];
  if (user.role === "customer") {
    conditions.push(eq(bookings.customerId, user.userId));
  } else if (user.role === "agency") {
    const owned = await db.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.ownerId, user.userId));
    const ownedIds = owned.map((v) => v.id);
    if (ownedIds.length === 0) return apiSuccess(res, []);
    conditions.push(inArray(bookings.vehicleId, ownedIds));
  }
  // admin: no filter — platform-wide list
  if (status) conditions.push(eq(bookings.status, status));

  const rows = await db.query.bookings.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: bookingWith,
    orderBy: [desc(bookings.createdAt)],
  });

  return apiSuccess(
    res,
    rows.map((booking) =>
      serializeId({
        ...booking,
        vehicle: booking.vehicle ? formatVehicle(booking.vehicle) : null,
      })
    )
  );
});

router.post("/", async (req, res) => {
  const auth = await resolveUser(req, ["customer"]);
  if ("error" in auth) return apiError(res, auth.error, auth.status);
  const user = auth.session;

  const { vehicleId, startDate, endDate, duration, notes, startTime, endTime } = req.body ?? {};
  if (!vehicleId || !startDate || !endDate || !duration) {
    return apiError(res, "vehicleId, startDate, endDate, and duration are required");
  }

  // KYC and driving license checks removed

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) return apiError(res, "End date must be after start date");

  const vehicle = await db.query.vehicles.findFirst({ where: eq(vehicles.id, vehicleId) });
  if (!vehicle) return apiError(res, "Vehicle not found", 404);
  if (vehicle.status !== "available" || !vehicle.isApproved) {
    return apiError(res, "Vehicle is not available for booking");
  }

  const conflict = await hasBookingConflict(vehicleId, start, end);
  if (conflict) {
    // Recorded so the admin conflict-rate KPI reflects real clashes.
    await db.insert(bookingConflicts).values({
      customerId: user.userId,
      vehicleId,
      startDate: start,
      endDate: end,
    });
    return apiError(res, "Vehicle is already booked for the selected dates", 409);
  }

  const totalDays = getDaysBetween(start, end);
  const totalPrice = calculateRentalPrice(
    { daily: vehicle.priceDaily, weekly: vehicle.priceWeekly, monthly: vehicle.priceMonthly },
    duration,
    totalDays
  );

  const [created] = await db
    .insert(bookings)
    .values({
      customerId: user.userId,
      vehicleId,
      startDate: start,
      endDate: end,
      startTime: startTime || null,
      endTime: endTime || null,
      duration,
      totalDays,
      totalPrice,
      notes,
      status: "pending",
    })
    .returning();

  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, created.id),
    with: bookingWith,
  });

  // Email notification removed

  return apiSuccess(
    res,
    serializeId({
      ...booking,
      vehicle: booking.vehicle ? formatVehicle(booking.vehicle) : null,
    }),
    201
  );
});

router.patch("/:id", async (req, res) => {
  const auth = await resolveUser(req);
  if ("error" in auth) return apiError(res, auth.error, auth.status);
  const user = auth.session;

  const { id } = req.params;
  const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, id) });
  if (!booking) return apiError(res, "Booking not found", 404);

  const vehicle = await db.query.vehicles.findFirst({ where: eq(vehicles.id, booking.vehicleId) });
  if (!vehicle) return apiError(res, "Vehicle not found", 404);

  const { status } = req.body ?? {};
  if (!status) return apiError(res, "Status is required");

  if (user.role === "customer") {
    if (status !== "cancelled") return apiError(res, "Customers can only cancel bookings", 403);
    if (booking.customerId !== user.userId) return apiError(res, "Forbidden", 403);
    if (!["pending", "approved"].includes(booking.status)) return apiError(res, "Cannot cancel this booking");
  } else if (user.role === "agency") {
    if (vehicle.ownerId !== user.userId) return apiError(res, "Forbidden", 403);
    if (!["approved", "rejected", "active", "completed"].includes(status)) {
      return apiError(res, "Invalid status for agency");
    }
  } else if (user.role === "admin") {
    const allowed = ["pending", "approved", "active", "completed", "rejected", "cancelled"];
    if (!allowed.includes(status)) return apiError(res, "Invalid status", 400);
  } else {
    return apiError(res, "Forbidden", 403);
  }

  await db.update(bookings).set({ status }).where(eq(bookings.id, id));

  if (status === "approved" || status === "active") {
    await db.update(vehicles).set({ status: "rented" }).where(eq(vehicles.id, vehicle.id));
  } else if (status === "rejected" || status === "cancelled" || status === "completed") {
    const activeBooking = await db.query.bookings.findFirst({
      where: and(
        eq(bookings.vehicleId, vehicle.id),
        inArray(bookings.status, ["approved", "active"]),
        ne(bookings.id, booking.id)
      ),
    });
    if (!activeBooking && vehicle.status === "rented") {
      await db.update(vehicles).set({ status: "available" }).where(eq(vehicles.id, vehicle.id));
    }
  }

  const updated = await db.query.bookings.findFirst({
    where: eq(bookings.id, id),
    with: {
      vehicle: true,
      customer: { columns: { id: true, name: true, email: true, phone: true } },
    },
  });

  return apiSuccess(
    res,
    serializeId({
      ...updated,
      vehicle: updated?.vehicle ? formatVehicle(updated.vehicle) : null,
    })
  );
});

export default router;
