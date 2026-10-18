import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarRange, Sparkles, X, MapPin, Search } from "lucide-react";
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

function VehicleCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card p-0 shadow-xs animate-pulse">
      <div className="aspect-[16/10.5] bg-muted/60" />
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex justify-between">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-4 w-10 rounded bg-muted" />
        </div>
        <div className="h-5 w-36 rounded bg-muted/80" />
        <div className="flex gap-1.5 pt-1">
          <div className="h-5 w-16 rounded bg-muted/50" />
          <div className="h-5 w-16 rounded bg-muted/50" />
          <div className="h-5 w-16 rounded bg-muted/50" />
        </div>
        <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-4">
          <div className="h-6 w-20 rounded bg-muted/80" />
          <div className="h-7 w-24 rounded-xl bg-muted/60" />
        </div>
      </div>
    </div>
  );
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
  const [sortBy, setSortBy] = useState("recommended");

  const debouncedQ = useDebouncedValue(q);
  const debouncedLocation = useDebouncedValue(locationCity.trim());
  const rentalDuration = duration;
  const priceBounds = PRICE_BOUNDS[rentalDuration] ?? PRICE_BOUNDS.daily;

  const apiSearchParams = useMemo(() => {
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
    queryKey: ["vehicles", apiSearchParams],
    queryFn: () => fetchVehiclesList(apiSearchParams)
  });

  const sortedVehicles = useMemo(() => {
    const list = [...vehicles];
    if (sortBy === "price_asc") return list.sort((a, b) => a.pricePerDay - b.pricePerDay);
    if (sortBy === "price_desc") return list.sort((a, b) => b.pricePerDay - a.pricePerDay);
    if (sortBy === "name_asc") return list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [vehicles, sortBy]);

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

        <div className="space-y-4">
          {/* Top Bar with Quick Filters and Sort */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border/40 bg-card/60 p-3 backdrop-blur-sm">
            {/* Quick Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: "All Rides", active: type === "All" && !fuelType, onClick: () => { setType("All"); setFuelType(""); } },
                { label: "⚡ Electric", active: fuelType === "electric", onClick: () => setFuelType(fuelType === "electric" ? "" : "electric") },
                { label: "🏍️ Bikes", active: type === "2W", onClick: () => setType(type === "2W" ? "All" : "2W") },
                { label: "🚗 Cars", active: type === "4W", onClick: () => setType(type === "4W" ? "All" : "4W") },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={chip.onClick}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    chip.active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-border/60 bg-background px-3 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
              >
                <option value="recommended">Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Vehicle Grid or States */}
          {isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center text-sm text-destructive">
              {error?.message || "Could not load vehicles."}
              <span className="mt-2 block font-medium text-muted-foreground">Check that the API is running, then refresh.</span>
            </div>
          ) : isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <VehicleCardSkeleton key={i} />
              ))}
            </div>
          ) : sortedVehicles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">No vehicles found</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                No rides match your active search or filters. Try adjusting your dates, location, or price filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setType("All");
                  setFuelType("");
                  handleDurationChange("daily");
                  setLocationCity("");
                  setQ("");
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {sortedVehicles.map((v) => (
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
