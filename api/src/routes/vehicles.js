import { Router } from "express";
import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { db } from "../lib/db.js";
import { vehicles } from "../lib/schema.js";
import { apiSuccess, apiError } from "../lib/api.js";
import { resolveUser } from "../lib/session.js";
import { formatVehicle } from "../lib/serialize.js";

const router = Router();

const listRelations = {
  owner: { columns: { id: true, name: true, agencyName: true } },
};

const EDITABLE_FIELDS = [
  "vehicleNumber",
  "name",
  "brand",
  "vehicleModel",
  "type",
  "modelYear",
  "fuelType",
  "transmission",
  "seats",
  "mileage",
  "description",
  "images",
];
const AGENCY_STATUSES = ["available", "maintenance"];
const ADMIN_STATUSES = ["available", "maintenance", "pending_approval", "rented"];

router.get("/", async (req, res) => {
  const { status, type, fuelType, location, minPrice, maxPrice, search, duration } = req.query ?? {};
  const conditions = [];
  if (status) {
    conditions.push(eq(vehicles.status, status));
  } else {
    conditions.push(eq(vehicles.status, "available"));
    conditions.push(eq(vehicles.isApproved, true));
  }
  if (type) conditions.push(eq(vehicles.type, type));
  if (fuelType) conditions.push(eq(vehicles.fuelType, fuelType));
  if (location) conditions.push(ilike(vehicles.location, `%${String(location).trim()}%`));

  const priceColumn =
    duration === "weekly" ? vehicles.priceWeekly : duration === "monthly" ? vehicles.priceMonthly : vehicles.priceDaily;
  const hasMin = minPrice !== undefined && minPrice !== "";
  const hasMax = maxPrice !== undefined && maxPrice !== "";
  if (hasMin || hasMax) {
    let min = hasMin ? Number(minPrice) : undefined;
    let max = hasMax ? Number(maxPrice) : undefined;
    if (Number.isNaN(min)) min = undefined;
    if (Number.isNaN(max)) max = undefined;
    if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];
    if (min !== undefined) conditions.push(gte(priceColumn, min));
    if (max !== undefined) conditions.push(lte(priceColumn, max));
  }
  if (search) {
    conditions.push(
      or(ilike(vehicles.name, `%${search}%`), ilike(vehicles.brand, `%${search}%`), ilike(vehicles.vehicleModel, `%${search}%`))
    );
  }

  const rows = await db.query.vehicles.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: listRelations,
    orderBy: [desc(vehicles.createdAt)],
  });

  return apiSuccess(res, rows.map(formatVehicle));
});

router.post("/", async (req, res) => {
  const auth = await resolveUser(req, ["agency", "admin"]);
  if ("error" in auth) return apiError(res, auth.error, auth.status);
  const user = auth.session;
  const body = req.body ?? {};
  const required = ["vehicleNumber", "name", "brand", "vehicleModel", "type", "modelYear", "fuelType", "transmission", "pricing", "location"];
  for (const field of required) {
    if (!body[field]) return apiError(res, `${field} is required`);
  }
  const existing = await db.query.vehicles.findFirst({ where: eq(vehicles.vehicleNumber, body.vehicleNumber) });
  if (existing) return apiError(res, "Vehicle number already exists", 409);

  const [created] = await db
    .insert(vehicles)
    .values({
      vehicleNumber: body.vehicleNumber,
      name: body.name,
      brand: body.brand,
      vehicleModel: body.vehicleModel,
      type: body.type,
      modelYear: Number(body.modelYear),
      fuelType: body.fuelType,
      transmission: body.transmission,
      seats: body.seats ? Number(body.seats) : null,
      mileage: body.mileage,
      description: body.description,
      images: body.images || [],
      priceDaily: Number(body.pricing.daily),
      priceWeekly: Number(body.pricing.weekly),
      priceMonthly: Number(body.pricing.monthly),
      status: user.role === "admin" ? "available" : "pending_approval",
      isApproved: user.role === "admin",
      ownerId: user.userId,
      location: body.location,
    })
    .returning();

  const vehicle = await db.query.vehicles.findFirst({
    where: eq(vehicles.id, created.id),
    with: listRelations,
  });
  return apiSuccess(res, formatVehicle(vehicle), 201);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const vehicle = await db.query.vehicles.findFirst({
    where: eq(vehicles.id, id),
    with: {
      owner: { columns: { id: true, name: true, agencyName: true, email: true, phone: true } },
    },
  });
  if (!vehicle) return apiError(res, "Vehicle not found", 404);
  return apiSuccess(res, formatVehicle(vehicle));
});

router.put("/:id", async (req, res) => {
  const auth = await resolveUser(req);
  if ("error" in auth) return apiError(res, auth.error, auth.status);
  const user = auth.session;
  const { id } = req.params;
  const vehicle = await db.query.vehicles.findFirst({ where: eq(vehicles.id, id) });
  if (!vehicle) return apiError(res, "Vehicle not found", 404);
  const isOwner = vehicle.ownerId === user.userId;
  if (!isOwner && user.role !== "admin") return apiError(res, "Forbidden", 403);

  const body = req.body ?? {};
  const data = {};

  // Only these fields may be changed through this endpoint. Anything else in the
  // body (isApproved, ownerId, timestamps, …) is ignored so an agency cannot
  // publish its own listing without admin approval.
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  if (data.modelYear !== undefined) data.modelYear = Number(data.modelYear);
  if (data.seats !== undefined) data.seats = data.seats ? Number(data.seats) : null;

  if (body.location) data.location = body.location;
  if (body.pricing) {
    data.priceDaily = Number(body.pricing.daily);
    data.priceWeekly = Number(body.pricing.weekly);
    data.priceMonthly = Number(body.pricing.monthly);
  }

  if (body.status !== undefined) {
    if (user.role === "admin") {
      if (!ADMIN_STATUSES.includes(body.status)) return apiError(res, "Invalid vehicle status");
    } else {
      if (!AGENCY_STATUSES.includes(body.status)) {
        return apiError(res, "Agencies can only set a vehicle to available or maintenance", 403);
      }
      if (!vehicle.isApproved) return apiError(res, "Vehicle is still awaiting admin approval");
      if (vehicle.status === "rented") return apiError(res, "Cannot change status while the vehicle is rented");
    }
    data.status = body.status;
  }

  // isApproved is admin-only and lives on the admin approval endpoint.
  if (body.isApproved !== undefined && user.role === "admin") {
    data.isApproved = Boolean(body.isApproved);
  }

  if (data.vehicleNumber && data.vehicleNumber !== vehicle.vehicleNumber) {
    const clash = await db.query.vehicles.findFirst({
      where: eq(vehicles.vehicleNumber, data.vehicleNumber),
    });
    if (clash) return apiError(res, "Vehicle number already exists", 409);
  }

  if (Object.keys(data).length === 0) return apiError(res, "No updatable fields provided");

  await db.update(vehicles).set(data).where(eq(vehicles.id, id));

  const updated = await db.query.vehicles.findFirst({
    where: eq(vehicles.id, id),
    with: listRelations,
  });
  return apiSuccess(res, formatVehicle(updated));
});

router.delete("/:id", async (req, res) => {
  const auth = await resolveUser(req);
  if ("error" in auth) return apiError(res, auth.error, auth.status);
  const user = auth.session;
  const { id } = req.params;
  const vehicle = await db.query.vehicles.findFirst({ where: eq(vehicles.id, id) });
  if (!vehicle) return apiError(res, "Vehicle not found", 404);
  const isOwner = vehicle.ownerId === user.userId;
  if (!isOwner && user.role !== "admin") return apiError(res, "Forbidden", 403);
  await db.delete(vehicles).where(eq(vehicles.id, id));
  return apiSuccess(res, { deleted: true });
});

export default router;
