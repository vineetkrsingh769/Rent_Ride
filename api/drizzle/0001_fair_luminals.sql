CREATE TABLE "BookingConflict" (
	"id" text PRIMARY KEY NOT NULL,
	"customerId" text NOT NULL,
	"vehicleId" text NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "BookingConflict" ADD CONSTRAINT "BookingConflict_customerId_User_id_fk" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BookingConflict" ADD CONSTRAINT "BookingConflict_vehicleId_Vehicle_id_fk" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "BookingConflict_createdAt_idx" ON "BookingConflict" USING btree ("createdAt");