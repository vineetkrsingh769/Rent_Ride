import { Link } from "react-router-dom";
import { Fuel, MapPin, Star, Users } from "lucide-react";
function VehicleCard({ v, tripQuery }) {
  return <Link
    to={`/vehicles/${v.id}${tripQuery ?? ""}`}
    className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
  >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
    src={v.image}
    alt={`${v.brand} ${v.name}`}
    loading="lazy"
    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
  />
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold backdrop-blur">
          {v.type === "2W" ? "Two-wheeler" : "Four-wheeler"}
        </span>
        {!v.available && <span className="absolute right-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground">
            Unavailable
          </span>}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{v.brand}</p>
            <h3 className="text-base font-semibold leading-tight">{v.name}</h3>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-accent text-accent" />
            {v.rating}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Fuel className="h-3.5 w-3.5" />
            {v.fuel}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {v.seats}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {v.location}
          </span>
        </div>
        <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
          <div>
            <span className="text-xl font-bold">₹{v.pricePerDay}</span>
            <span className="text-xs text-muted-foreground"> / day</span>
          </div>
          <span className="text-xs font-medium text-accent">View details →</span>
        </div>
      </div>
    </Link>;
}
export {
  VehicleCard
};
