import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarRange, Sparkles, X, MapPin } from "lucide-react";
import { fetchVehiclesList } from "@/lib/api-client";
import { VehicleCard } from "@/components/VehicleCard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  PRICE_BOUNDS,
  clampPriceRange,
  defaultPriceRange
} from "@/lib/vehicle-filters";

const FUEL_OPTIONS = [
  { label: "All fuels", value: "" },
  { label: "Petrol", value: "petrol" },
  { label: "Diesel", value: "diesel" },
  { label: "Electric", value: "electric" },
  { label: "CNG", value: "cng" }
];

const DURATION_OPTIONS = [
  { label: "Daily rate", value: "daily" },
  { label: "Weekly rate", value: "weekly" },
  { label: "Monthly rate", value: "monthly" }
];

function parseTypeParam(value) {
  if (value === "2W" || value === "4W") return value;
  return "All";
}

function formatTripDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function VehiclesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tripMode = searchParams.get("trip") === "1";
  const tripFrom = searchParams.get("from") ?? "";
  const tripTo = searchParams.get("to") ?? "";
  const initialCity = searchParams.get("locationCity") ?? "";
  
  const [type, setType] = useState(() => parseTypeParam(searchParams.get("type")));
  const [fuelType, setFuelType] = useState("");
  const [duration, setDuration] = useState(() => searchParams.get("duration") || "daily");
  const initialPrices = defaultPriceRange(searchParams.get("duration") || "daily");
  const [minPrice, setMinPrice] = useState(initialPrices.minPrice);
  const [maxPrice, setMaxPrice] = useState(initialPrices.maxPrice);
  const [q, setQ] = useState("");
  const [locationCity, setLocationCity] = useState(initialCity);

  const debouncedQ = useDebouncedValue(q);
  const debouncedLocation = useDebouncedValue(locationCity.trim());
  const rentalDuration = duration;
  const priceBounds = PRICE_BOUNDS[rentalDuration] ?? PRICE_BOUNDS.daily;

  const searchParams_api = useMemo(() => {
    const params = {
      minPrice: String(minPrice),
      maxPrice: String(maxPrice),
      duration: rentalDuration
    };
    if (type !== "All") params.type = type;
    if (fuelType) params.fuelType = fuelType;
    if (debouncedLocation) params.location = debouncedLocation;
    if (debouncedQ.trim()) params.search = debouncedQ.trim();
    // With a trip selected, ask the API to exclude vehicles already booked for it.
    if (tripMode && tripFrom && tripTo) {
      params.from = tripFrom;
      params.to = tripTo;
    }
    return params;
  }, [type, fuelType, minPrice, maxPrice, debouncedQ, rentalDuration, debouncedLocation, tripMode, tripFrom, tripTo]);

  const { data: vehicles = [], isLoading, isFetching, isError, error } = useQuery({
    queryKey: ["vehicles", searchParams_api],
    queryFn: () => fetchVehiclesList(searchParams_api)
  });

  const priceLabel = duration === "weekly" ? "week" : duration === "monthly" ? "month" : "day";
  const cityLabel = locationCity || "All cities";

  const clearTrip = () => {
    setSearchParams({});
    setLocationCity("");
  };

  const handleDurationChange = (next) => {
    setDuration(next);
    const defaults = defaultPriceRange(next);
    setMinPrice(defaults.minPrice);
    setMaxPrice(defaults.maxPrice);
  };

  const handleMinPriceChange = (value) => {
    const next = clampPriceRange(rentalDuration, value, maxPrice);
    setMinPrice(next.minPrice);
    setMaxPrice(next.maxPrice);
  };

  const handleMaxPriceChange = (value) => {
    const next = clampPriceRange(rentalDuration, minPrice, value);
    setMinPrice(next.minPrice);
    setMaxPrice(next.maxPrice);
  };

  const tripQuery = tripMode && tripFrom && tripTo ? `?from=${tripFrom}&to=${tripTo}&duration=${duration}` : undefined;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {tripMode && tripFrom && tripTo && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/20 bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 shadow-lg backdrop-blur-md">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              Your trip
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
              <CalendarRange className="h-4 w-4 text-muted-foreground" />
              {formatTripDate(tripFrom)} → {formatTripDate(tripTo)}
              <span className="text-muted-foreground">·</span>
              <span className="capitalize">{cityLabel}</span>
              <span className="text-muted-foreground">·</span>
              <span className="capitalize">{duration}</span>
              {type !== "All" && (
                <>
                  <span className="text-muted-foreground">·</span>
                  {type === "2W" ? "Bikes" : "Cars"}
                </>
              )}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={clearTrip}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          {tripMode ? "Rides for your trip" : "Browse Vehicles"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground font-medium">
          {isLoading ? "Loading…" : `${vehicles.length} vehicles match your filters.`}
          {isFetching && !isLoading && " Updating…"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-2xl border border-border/40 bg-card/85 p-6 shadow-lg backdrop-blur-sm">
          <div className="space-y-6 text-sm">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Search</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Brand, model…"
                className="h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="All cities"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Vehicle type</label>
              <div className="grid grid-cols-3 gap-2">
                {["All", "2W", "4W"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                      type === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    {t === "2W" ? "Bike" : t === "4W" ? "Car" : "All"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Fuel type</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
              >
                {FUEL_OPTIONS.map((f) => (
                  <option key={f.label} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Rental plan</label>
              <select
                value={duration}
                onChange={(e) => handleDurationChange(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Min price / {priceLabel}: <span className="text-primary font-bold">₹{minPrice}</span>
              </label>
              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                step={priceBounds.step}
                value={minPrice}
                onChange={(e) => handleMinPriceChange(+e.target.value)}
                className="w-full accent-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Max price / {priceLabel}: <span className="text-primary font-bold">₹{maxPrice}</span>
              </label>
              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                step={priceBounds.step}
                value={maxPrice}
                onChange={(e) => handleMaxPriceChange(+e.target.value)}
                className="w-full accent-[var(--color-primary)]"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setType("All");
                setFuelType("");
                handleDurationChange("daily");
                setLocationCity("");
                setQ("");
              }}
              className="w-full rounded-xl border border-border bg-card/60 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted/30 hover:text-foreground transition"
            >
              Reset Filters
            </button>
          </div>
        </aside>

        <div>
          {isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center text-sm text-destructive">
              {error?.message || "Could not load vehicles."}
              <span className="mt-2 block font-medium text-muted-foreground">Check that the API is running, then refresh.</span>
            </div>
          ) : vehicles.length === 0 && !isLoading ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-10 text-center text-sm text-muted-foreground">
              No vehicles match your filters.
              <span className="mt-2 block font-medium">Widen your search or reset filters to see more.</span>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {vehicles.map((v) => (
                <VehicleCard key={v.id} v={v} tripQuery={tripQuery} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export { VehiclesPage as default };
