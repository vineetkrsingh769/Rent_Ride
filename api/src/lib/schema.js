import { relations } from "drizzle-orm";
import { boolean, index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const userRole = pgEnum("UserRole", ["customer", "agency", "admin"]);

export const users = pgTable("User", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  role: userRole("role").notNull().default("customer"),
  isActive: boolean("isActive").notNull().default(true),
  agencyName: text("agencyName"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const vehicles = pgTable(
  "Vehicle",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    vehicleNumber: text("vehicleNumber").notNull().unique(),
    name: text("name").notNull(),
    brand: text("brand").notNull(),
    vehicleModel: text("vehicleModel").notNull(),
    type: text("type").notNull(),
    modelYear: integer("modelYear").notNull(),
    fuelType: text("fuelType").notNull(),
    transmission: text("transmission").notNull(),
    seats: integer("seats"),
    mileage: text("mileage"),
    images: text("images").array().notNull().default([]),
    description: text("description"),
    priceDaily: integer("priceDaily").notNull(),
    priceWeekly: integer("priceWeekly").notNull(),
    priceMonthly: integer("priceMonthly").notNull(),
    status: text("status").notNull().default("pending_approval"),
    isApproved: boolean("isApproved").notNull().default(false),
    ownerId: text("ownerId")
      .notNull()
      .references(() => users.id),
    location: text("location").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    typeStatusPrice: index("Vehicle_type_status_priceDaily_idx").on(t.type, t.status, t.priceDaily),
  })
);

export const bookings = pgTable(
  "Booking",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    customerId: text("customerId")
      .notNull()
      .references(() => users.id),
    vehicleId: text("vehicleId")
      .notNull()
      .references(() => vehicles.id),
    startDate: timestamp("startDate", { mode: "date" }).notNull(),
    endDate: timestamp("endDate", { mode: "date" }).notNull(),
    startTime: text("startTime"),
    endTime: text("endTime"),
    duration: text("duration").notNull(),
    totalDays: integer("totalDays").notNull(),
    totalPrice: integer("totalPrice").notNull(),
    status: text("status").notNull().default("pending"),
    notes: text("notes"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    vehicleDates: index("Booking_vehicleId_startDate_endDate_idx").on(t.vehicleId, t.startDate, t.endDate),
    customerStatus: index("Booking_customerId_status_idx").on(t.customerId, t.status),
  })
);

// One row per booking attempt rejected because the vehicle was already booked
// for the requested dates. Feeds the "booking conflict rate" KPI and gives the
// admin a record of clashes to monitor.
export const bookingConflicts = pgTable(
  "BookingConflict",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    customerId: text("customerId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vehicleId: text("vehicleId")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    startDate: timestamp("startDate", { mode: "date" }).notNull(),
    endDate: timestamp("endDate", { mode: "date" }).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => ({
    createdAtIdx: index("BookingConflict_createdAt_idx").on(t.createdAt),
  })
);

export const pricingCategories = pgTable("PricingCategory", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  vehicleType: text("vehicleType").notNull(),
  baseDailyRate: integer("baseDailyRate").notNull(),
  baseWeeklyRate: integer("baseWeeklyRate").notNull(),
  baseMonthlyRate: integer("baseMonthlyRate").notNull(),
  description: text("description"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
  vehicles: many(vehicles),
  bookings: many(bookings),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  owner: one(users, { fields: [vehicles.ownerId], references: [users.id] }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  customer: one(users, { fields: [bookings.customerId], references: [users.id] }),
  vehicle: one(vehicles, { fields: [bookings.vehicleId], references: [vehicles.id] }),
}));
