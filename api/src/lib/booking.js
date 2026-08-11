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

/**
 * Sub-select of vehicle ids already committed for any part of [startDate, endDate].
 * Uses the same overlap rule as hasBookingConflict so what the browse list hides
 * matches exactly what booking creation would reject.
 */
function bookedVehicleIds(startDate, endDate) {
  return db
    .select({ id: bookings.vehicleId })
    .from(bookings)
    .where(
      and(
        inArray(bookings.status, CONFLICT_STATUSES),
        lte(bookings.startDate, endDate),
        gte(bookings.endDate, startDate)
      )
    );
}

export { bookedVehicleIds, hasBookingConflict };
