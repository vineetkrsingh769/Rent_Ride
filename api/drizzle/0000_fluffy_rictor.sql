CREATE TYPE "public"."UserRole" AS ENUM('customer', 'agency', 'admin');--> statement-breakpoint
CREATE TABLE "Booking" (
	"id" text PRIMARY KEY NOT NULL,
	"customerId" text NOT NULL,
	"vehicleId" text NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"startTime" text,
	"endTime" text,
	"duration" text NOT NULL,
	"totalDays" integer NOT NULL,
	"totalPrice" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PricingCategory" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"vehicleType" text NOT NULL,
	"baseDailyRate" integer NOT NULL,
	"baseWeeklyRate" integer NOT NULL,
	"baseMonthlyRate" integer NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"phone" text,
	"role" "UserRole" DEFAULT 'customer' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"agencyName" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "Vehicle" (
	"id" text PRIMARY KEY NOT NULL,
	"vehicleNumber" text NOT NULL,
	"name" text NOT NULL,
	"brand" text NOT NULL,
	"vehicleModel" text NOT NULL,
	"type" text NOT NULL,
	"modelYear" integer NOT NULL,
	"fuelType" text NOT NULL,
	"transmission" text NOT NULL,
	"seats" integer,
	"mileage" text,
	"images" text[] DEFAULT '{}' NOT NULL,
	"description" text,
	"priceDaily" integer NOT NULL,
	"priceWeekly" integer NOT NULL,
	"priceMonthly" integer NOT NULL,
	"status" text DEFAULT 'pending_approval' NOT NULL,
	"isApproved" boolean DEFAULT false NOT NULL,
	"ownerId" text NOT NULL,
	"location" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Vehicle_vehicleNumber_unique" UNIQUE("vehicleNumber")
);
--> statement-breakpoint
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_User_id_fk" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vehicleId_Vehicle_id_fk" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_ownerId_User_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "Booking_vehicleId_startDate_endDate_idx" ON "Booking" USING btree ("vehicleId","startDate","endDate");--> statement-breakpoint
CREATE INDEX "Booking_customerId_status_idx" ON "Booking" USING btree ("customerId","status");--> statement-breakpoint
CREATE INDEX "Vehicle_type_status_priceDaily_idx" ON "Vehicle" USING btree ("type","status","priceDaily");