import { and, asc, avg, count, desc, eq, gte, inArray, ne, sum } from "drizzle-orm";
import { db } from "../lib/db.js";
import { bookingConflicts, bookings, pricingCategories, users, vehicles } from "../lib/schema.js";
import { apiSuccess, apiError, createRouter } from "../lib/api.js";
import { formatUser, formatVehicle, serializeId } from "../lib/serialize.js";
import { resolveUser } from "../lib/session.js";

const router = createRouter();

const bookingWith = {
  vehicle: {
    with: {
      owner: { columns: { id: true, name: true, agencyName: true } },
    },
  },
  customer: { columns: { id: true, name: true, email: true, phone: true } },
};

async function requireAdmin(req) {
  const auth = await resolveUser(req, ["admin"]);
  if ("error" in auth) return auth;
  return auth;
}

async function countRows(table, where) {
  const [row] = await db.select({ value: count() }).from(table).where(where);
  return Number(row.value);
}

router.get("/users", async (req, res) => {
  const auth = await requireAdmin(req);
  if ("error" in auth) return apiError(res, auth.error, auth.status);
  const { role } = req.query;
  const rows = await db
    .select()
    .from(users)
    .where(role ? eq(users.role, role) : undefined)
    .orderBy(desc(users.createdAt));
  return apiSuccess(res, rows.map(formatUser));
});

router.patch("/users", async (req, res) => {
  const auth = await requireAdmin(req);
  if ("error" in auth) return apiError(res, auth.error, auth.status);
  const { userId, isActive } = req.body ?? {};
  if (!userId) return apiError(res, "userId is required");

  const target = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!target) return apiError(res, "User not found", 404);

  const data = {};
  if (isActive !== undefined) {
    if (userId === auth.session.userId && !isActive) {
      return apiError(res, "You cannot deactivate your own account", 400);
    }
    if (target.role === "admin" && !isActive) {
      const adminCount = await countRows(users, and(eq(users.role, "admin"), eq(users.isActive, true)));
      if (adminCount <= 1) {
        return apiError(res, "Cannot deactivate the last active administrator", 400);
      }
    }
    data.isActive = isActive;
  }

  const [updated] = await db.update(users).set(data).where(eq(users.id, userId)).returning();
  return apiSuccess(res, formatUser(updated));
});

router.delete("/users", async (req, res) => {
  const auth = await requireAdmin(req);
  if ("error" in auth) return apiError(res, auth.error, auth.status);
  const { userId } = req.body ?? {};
  if (!userId) return apiError(res, "userId is required");
  if (userId === auth.session.userId) {
    return apiError(res, "You cannot delete your own account", 400);
  }

  const target = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!target) return apiError(res, "User not found", 404);
  if (target.role === "admin") {
    return apiError(res, "Administrator accounts cannot be deleted", 400);
  }

  if (target.role === "customer") {
    await db.transaction(async (tx) => {
      await tx.delete(bookings).where(eq(bookings.customerId, userId));
      await tx.delete(users).where(eq(users.id, userId));
    });
  } else if (target.role === "agency") {
    await db.transaction(async (tx) => {
      const owned = await tx.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.ownerId, userId));
      const vehicleIds = owned.map((v) => v.id);
      if (vehicleIds.length) {
        await tx.delete(bookings).where(inArray(bookings.vehicleId, vehicleIds));
      }
      await tx.delete(vehicles).where(eq(vehicles.ownerId, userId));
      await tx.delete(users).where(eq(users.id, userId));
    });
  } else {
    return apiError(res, "This account cannot be deleted", 400);
  }

  return apiSuccess(res, { deleted: true, userId });
});

router.get("/vehicles", async (req, res) => {
  const auth = await requireAdmin(req);
  if ("error" in auth) return apiError(res, auth.error, auth.status);
  const rows = await db.query.vehicles.findMany({
    where: and(eq(vehicles.isApproved, false), eq(vehicles.status, "pending_approval")),
    with: {
      owner: { columns: { id: true, name: true, agencyName: true, email: true } },
    },
    orderBy: [desc(vehicles.createdAt)],
  });
  return apiSuccess(res, rows.map(formatVehicle));
});

router.patch("/vehicles", async (req, res) => {
  const auth = await requireAdmin(req);
  if ("error" in auth) return apiError(res, auth.error, auth.status);
  const { vehicleId, isApproved } = req.body ?? {};
  if (!vehicleId || typeof isApproved !== "boolean") {
    return apiError(res, "vehicleId and isApproved are required");
  }

  const [updated] = await db
    .update(vehicles)
    .set(isApproved ? { isApproved: true, status: "available" } : { isApproved: false, status: "rejected" })
    .where(eq(vehicles.id, vehicleId))
    .returning();
  if (!updated) return apiError(res, "Vehicle not found", 404);

  const vehicle = await db.query.vehicles.findFirst({
    where: eq(vehicles.id, vehicleId),
    with: {
      owner: { columns: { id: true, name: true, agencyName: true } },
    },
  });
  return apiSuccess(res, formatVehicle(vehicle));
});

router.get("/bookings", async (req, res) => {
  const auth = await requireAdmin(req);
  if ("error" in auth) return apiError(res, auth.error, auth.status);
  const { status } = req.query;
  const rows = await db.query.bookings.findMany({
    where: status ? eq(bookings.status, status) : undefined,
    with: bookingWith,
    orderBy: [desc(bookings.createdAt)],
    limit: 200,
  });
  return apiSuccess(
    res,
    rows.map((b) =>
      serializeId({
        ...b,
        vehicle: b.vehicle ? formatVehicle(b.vehicle) : null,
      })
    )
  );
});



router.get("/pricing", async (req, res) => {
  const auth = await requireAdmin(req);
  if ("error" in auth) return apiError(res, auth.error, auth.status);
  const categories = await db.select().from(pricingCategories).orderBy(asc(pricingCategories.vehicleType));
  return apiSuccess(res, categories.map(serializeId));
});

router.post("/pricing", async (req, res) => {
  const auth = await requireAdmin(req);
  if ("error" in auth) return apiError(res, auth.error, auth.status);
  const body = req.body ?? {};
  const required = ["name", "vehicleType", "baseDailyRate", "baseWeeklyRate", "baseMonthlyRate"];
  for (const field of required) {
    if (body[field] === undefined) return apiError(res, `${field} is required`);
  }
  const [category] = await db.insert(pricingCategories).values(body).returning();
  return apiSuccess(res, serializeId(category), 201);
});

router.patch("/pricing", async (req, res) => {
  const auth = await requireAdmin(req);
  if ("error" in auth) return apiError(res, auth.error, auth.status);
  const { categoryId, ...updates } = req.body ?? {};
  if (!categoryId) return apiError(res, "categoryId is required");

  const [category] = await db
    .update(pricingCategories)
    .set(updates)
    .where(eq(pricingCategories.id, categoryId))
    .returning();
  if (!category) return apiError(res, "Category not found", 404);
  return apiSuccess(res, serializeId(category));
});



router.get("/analytics", async (req, res) => {
  const auth = await requireAdmin(req);
  if ("error" in auth) return apiError(res, auth.error, auth.status);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const activeStatuses = ["approved", "active", "completed"];

  const [
    customers,
    agencies,
    totalUsers,
    totalVehicles,
    totalBookingsAll,
    pendingVehicles,
    pendingAgencies,
    pricingCount,
    approvedBookings,
    nonCancelledBookings,
    rentedVehicles,
    bookings30d,
    conflictCount,
  ] = await Promise.all([
    countRows(users, eq(users.role, "customer")),
    countRows(users, and(eq(users.role, "agency"), eq(users.isActive, true))),
    countRows(users, undefined),
    countRows(vehicles, undefined),
    countRows(bookings, undefined),
    countRows(vehicles, and(eq(vehicles.isApproved, false), eq(vehicles.status, "pending_approval"))),
    countRows(users, and(eq(users.role, "agency"), eq(users.isActive, false))),
    countRows(pricingCategories, eq(pricingCategories.isActive, true)),
    countRows(bookings, eq(bookings.status, "approved")),
    countRows(bookings, ne(bookings.status, "cancelled")),
    countRows(vehicles, eq(vehicles.status, "rented")),
    countRows(bookings, gte(bookings.createdAt, thirtyDaysAgo)),
    countRows(bookingConflicts, undefined),
  ]);

  const [avgRow] = await db
    .select({ value: avg(bookings.totalDays) })
    .from(bookings)
    .where(inArray(bookings.status, activeStatuses));
  const [revenueRow] = await db
    .select({ value: sum(bookings.totalPrice) })
    .from(bookings)
    .where(inArray(bookings.status, activeStatuses));

  const bookingGroups30d = await db
    .selectDistinct({ customerId: bookings.customerId })
    .from(bookings)
    .where(gte(bookings.createdAt, thirtyDaysAgo));
  const newCustomers30d = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "customer"), gte(users.createdAt, thirtyDaysAgo)));

  const conversionRate = nonCancelledBookings > 0 ? (approvedBookings / nonCancelledBookings) * 100 : 0;
  // Share of booking attempts turned away because the vehicle was already
  // booked for those dates: conflicts / (conflicts + bookings actually created).
  const bookingAttempts = totalBookingsAll + conflictCount;
  const conflictRate = bookingAttempts > 0 ? (conflictCount / bookingAttempts) * 100 : 0;
  const utilizationRate = totalVehicles > 0 ? (rentedVehicles / totalVehicles) * 100 : 0;
  const monthlyActiveUsers = new Set([
    ...bookingGroups30d.map((b) => b.customerId),
    ...newCustomers30d.map((u) => u.id),
  ]).size;

  return apiSuccess(res, {
    kpis: {
      registeredUsers: customers,
      totalUsers,
      agencies,
      pendingAgencies,
      totalVehicles,
      totalBookings: totalBookingsAll,
      pendingApprovals: pendingVehicles,
      bookingConversionRate: Math.round(conversionRate * 100) / 100,
      vehicleUtilizationRate: Math.round(utilizationRate * 100) / 100,
      averageRentalDuration: Math.round((Number(avgRow.value) || 0) * 100) / 100,
      totalRevenue: Number(revenueRow.value) || 0,
      pricingCategories: pricingCount,
      bookingConflicts: conflictCount,
      bookingConflictRate: Math.round(conflictRate * 100) / 100,
      monthlyActiveUsers,
    },
  });
});

export default router;
