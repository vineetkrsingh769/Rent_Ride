import { and, eq, gte, inArray, lte, ne } from "drizzle-orm";
import { db } from "./db.js";
import { bookings } from "./schema.js";

const CONFLICT_STATUSES = ["pending", "approved", "active"];

async function hasBookingConflict(vehicleId, startDate, endDate, excludeBookingId) {
  const conditions = [
    eq(bookings.vehicleId, vehicleId),
    inArray(bookings.status, CONFLICT_STATUSES),
    lte(bookings.startDate, endDate),
    gte(bookings.endDate, startDate),
  ];
  if (excludeBookingId) conditions.push(ne(bookings.id, excludeBookingId));

  const conflict = await db.query.bookings.findFirst({ where: and(...conditions) });
  return !!conflict;
}

export { hasBookingConflict };
