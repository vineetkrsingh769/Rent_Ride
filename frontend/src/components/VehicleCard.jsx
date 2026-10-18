import { Link } from "react-router-dom";
import { Fuel, MapPin, Star, Users, Gauge, Zap, ShieldCheck } from "lucide-react";

function VehicleCard({ v, tripQuery }) {
  const isElectric = v.fuel?.toLowerCase().includes("electric");
  const isBike = v.type === "2W";

  // Category descriptor
  const categoryLabel = isBike
    ? v.seats === 1 ? "Solo Bike" : "Cruiser Bike"
    : v.seats >= 7 ? "7-Seater SUV" : v.transmission === "Automatic" ? "Auto Car" : "Hatchback / Sedan";

  return (
    <Link
      to={`/vehicles/${v.id}${tripQuery ?? ""}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
    >
      {/* Vehicle Image Container */}
      <div className="relative aspect-[16/10.5] overflow-hidden bg-muted/40">
        <img
          src={v.image}
          alt={`${v.brand} ${v.name}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
        />

        {/* Top Floating Badges */}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-background/90 px-2.5 py-1 text-[11px] font-bold text-foreground backdrop-blur-md shadow-xs">
            {isElectric && <Zap className="h-3 w-3 text-emerald-500 fill-emerald-500" />}
            {categoryLabel}
          </span>

          {v.available ? (
            <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5" />
              Zero Deposit
            </span>
          ) : (
            <span className="rounded-lg bg-destructive/90 px-2.5 py-1 text-[11px] font-bold text-destructive-foreground backdrop-blur-md">
              Booked Out
            </span>
          )}
        </div>
      </div>

      {/* Card Content Area */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Brand & Title */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {v.brand} {v.year ? `· ${v.year}` : ""}
            </p>
            <h3 className="mt-0.5 text-base font-bold text-foreground transition-colors group-hover:text-primary">
              {v.name}
            </h3>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>{v.rating || "4.8"}</span>
          </div>
        </div>

        {/* Automotive Spec Chips */}
        <div className="mt-3.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 font-medium text-foreground">
            <Gauge className="h-3 w-3 text-muted-foreground" />
            {v.transmission}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 font-medium text-foreground">
            <Fuel className="h-3 w-3 text-muted-foreground" />
            {v.fuel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 font-medium text-foreground">
            <Users className="h-3 w-3 text-muted-foreground" />
            {v.seats} Seats
          </span>
        </div>

        {/* Location subtitle */}
        <div className="mt-2.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">{v.location}</span>
        </div>

        {/* Price & Action Row (Bottom) */}
        <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-foreground">
                ₹{v.pricePerDay?.toLocaleString() || 0}
              </span>
              <span className="text-xs font-medium text-muted-foreground">/ day</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Free cancellation</p>
          </div>

          <span className="inline-flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}

export { VehicleCard };
