import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import { ArrowLeft, Calendar, Fuel, MapPin, Settings2, Star, Users } from "lucide-react";
import { fetchVehicleById } from "@/lib/api-client";
import { useAuth } from "@/components/AuthProvider";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return dateStr;
  }
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isValidDate(dateStr) {
  if (!dateStr || dateStr.length < 10) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

function VehicleDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const urlDuration = searchParams.get("duration");
  const urlFrom = searchParams.get("from");
  const urlTo = searchParams.get("to");

  const [duration, setDuration] = useState(
    () => urlDuration === "weekly" || urlDuration === "monthly" ? urlDuration : "daily"
  );
  const [startDate, setStartDate] = useState(() => urlFrom || todayStr());
  const [endDate, setEndDate] = useState(() => urlTo || addDays(urlFrom || todayStr(), 2));

  const { data: v, isLoading, isError } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => fetchVehicleById(id),
    enabled: !!id
  });

  const totalDays = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 1;
    }
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24)));
  }, [startDate, endDate]);

  const unitPrice = duration === "daily" ? v?.pricePerDay : duration === "weekly" ? v?.pricePerWeek : v?.pricePerMonth;
  
  const total = useMemo(() => {
    if (!unitPrice) return 0;
    if (duration === "daily") return unitPrice * totalDays;
    if (duration === "weekly") return unitPrice * Math.ceil(totalDays / 7);
    return unitPrice * Math.ceil(totalDays / 30);
  }, [unitPrice, duration, totalDays]);

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-24 text-center text-muted-foreground font-semibold">Loading…</div>;
  }

  if (isError || !v) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Vehicle not found</h1>
        <p className="mt-2 text-muted-foreground">It may have been removed by the agency.</p>
        <Link to="/vehicles" className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          Back to browse
        </Link>
      </div>
    );
  }

  const handleBook = () => {
    if (!user) {
      toast.error("Please sign in to book");
      navigate("/login");
      return;
    }
    if (user.role !== "customer") {
      toast.error("Only customers can create bookings");
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast.error("Please enter valid start and end dates");
      return;
    }
    if (end <= start) {
      toast.error("End date must be after start date");
      return;
    }
    navigate(`/checkout?vehicleId=${v.id}&from=${startDate}&to=${endDate}&duration=${duration}`);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Toaster richColors position="top-center" />
      <Link to="/vehicles" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to all vehicles
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="overflow-hidden rounded-2xl border border-border bg-muted">
            <img src={v.image} alt={`${v.brand} ${v.name}`} className="aspect-[16/10] w-full object-cover" />
          </div>
          <div className="mt-6">
            <p className="text-sm uppercase tracking-wide text-muted-foreground font-bold">{v.brand} · {v.year}</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{v.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-semibold">
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-accent text-accent animate-pulse" /> {v.rating} rating
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {v.location}
              </span>
              <span>·</span>
              <span>By <span className="font-semibold text-foreground">{v.agency}</span></span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: Fuel, label: "Fuel Type", value: v.fuel },
              { icon: Settings2, label: "Transmission", value: v.transmission },
              { icon: Users, label: "Capacity", value: `${v.seats} Seats` },
              { icon: Calendar, label: "Model Year", value: String(v.year) }
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/40 bg-card/60 p-4 transition hover:border-primary/20">
                <s.icon className="h-5 w-5 text-primary" />
                <p className="mt-2 text-xs text-muted-foreground">{s.label}</p>
                <p className="text-sm font-bold mt-0.5 text-foreground">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-border/40 bg-card/85 p-6 shadow-xl lg:sticky lg:top-24 backdrop-blur-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Starting From</p>
          <p className="mt-1 text-3xl font-extrabold text-foreground">
            ₹{v.pricePerDay}
            <span className="text-base font-medium text-muted-foreground"> / day</span>
          </p>

          <div className="mt-5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rental Plan</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {["daily", "weekly", "monthly"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`rounded-xl border py-2.5 text-xs font-bold capitalize transition-all ${
                    duration === d
                      ? "border-primary bg-primary/10 text-primary font-black"
                      : "border-border bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Start Date</label>
              <input
                type="date"
                min={todayStr()}
                value={startDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  if (isValidDate(val) && isValidDate(endDate) && val >= endDate) {
                    setEndDate(addDays(val, 1));
                  }
                }}
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">End Date</label>
              <input
                type="date"
                min={isValidDate(startDate) ? addDays(startDate, 1) : todayStr()}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="mt-6 space-y-3.5 border-t border-border/40 pt-5 text-sm">
            <div className="flex justify-between text-muted-foreground font-semibold">
              <span>{totalDays} day{totalDays !== 1 ? "s" : ""} · {duration}</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-border/40 pt-3 text-base font-bold text-foreground">
              <span>Estimated total</span>
              <span className="text-primary font-extrabold text-lg">₹{total.toLocaleString()}</span>
            </div>
          </div>

          <button
            disabled={!v.available}
            onClick={handleBook}
            className="mt-6 w-full rounded-xl bg-primary text-primary-foreground py-3.5 text-sm font-bold shadow-md hover:opacity-90 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!v.available ? "Currently unavailable" : user ? "Proceed to checkout" : "Sign in to book"}
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground font-medium">Rental approval pending agency review</p>
        </aside>
      </div>
    </main>
  );
}

export { VehicleDetailPage as default };
