import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import {
  ArrowLeft,
  Fuel,
  MapPin,
  Settings2,
  Star,
  Users,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Building2,
  Clock,
} from "lucide-react";
import { fetchVehicleById } from "@/lib/api-client";
import { useAuth } from "@/components/AuthProvider";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
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
    () => (urlDuration === "weekly" || urlDuration === "monthly" ? urlDuration : "daily")
  );
  const [startDate, setStartDate] = useState(() => urlFrom || todayStr());
  const [endDate, setEndDate] = useState(() => urlTo || addDays(urlFrom || todayStr(), 2));
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const { data: v, isLoading, isError } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => fetchVehicleById(id),
    enabled: !!id,
  });

  const totalDays = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24)));
  }, [startDate, endDate]);

  const unitPrice =
    duration === "daily" ? v?.pricePerDay : duration === "weekly" ? v?.pricePerWeek : v?.pricePerMonth;

  const total = useMemo(() => {
    if (!unitPrice) return 0;
    if (duration === "daily") return unitPrice * totalDays;
    if (duration === "weekly") return unitPrice * Math.ceil(totalDays / 7);
    return unitPrice * Math.ceil(totalDays / 30);
  }, [unitPrice, duration, totalDays]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">Loading vehicle specifications...</p>
      </main>
    );
  }

  if (isError || !v) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Vehicle Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This vehicle listing may have been deactivated or removed by the agency.
        </p>
        <Link
          to="/vehicles"
          className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow"
        >
          Browse Other Vehicles
        </Link>
      </div>
    );
  }

  const galleryImages = v.images && v.images.length > 0 ? v.images : [v.image];
  const activeImage = galleryImages[selectedPhotoIndex] || v.image;

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
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Toaster richColors position="top-center" />

      {/* Breadcrumb Navigation */}
      <Link
        to="/vehicles"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to fleet catalog
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Left Column: Visuals & Specifications */}
        <div className="space-y-8">
          {/* Main Visual Showcase */}
          <div className="space-y-3">
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-border/60 bg-muted/30 shadow-md">
              <img
                src={activeImage}
                alt={`${v.brand} ${v.name}`}
                className="h-full w-full object-cover transition-all duration-300"
              />
              <div className="absolute left-4 top-4 flex gap-2">
                <span className="rounded-xl border border-border/50 bg-background/90 px-3 py-1.5 text-xs font-bold text-foreground backdrop-blur-md shadow-xs">
                  {v.type === "2W" ? "Two-Wheeler" : "Four-Wheeler"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 backdrop-blur-md">
                  <ShieldCheck className="h-4 w-4" /> Zero Security Deposit
                </span>
              </div>
            </div>

            {/* Thumbnail Selector (if multiple images) */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`relative aspect-[16/10] w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                      selectedPhotoIndex === idx
                        ? "border-primary shadow-sm scale-102"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Title & Key Information */}
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {v.brand} · {v.year}
              </span>
              <span className="text-xs text-muted-foreground">Reg #{v.number || "Verified"}</span>
            </div>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {v.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1 font-bold text-amber-600">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span>{v.rating || "4.8"}</span>
                <span className="text-xs text-muted-foreground font-normal">({v.trips || "30+"} trips completed)</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1 text-foreground font-semibold">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{v.location}</span>
              </div>
            </div>
          </div>

          {/* Key Automotive Specifications Grid */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
              Vehicle Specifications
            </h2>
            <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Settings2, label: "Transmission", value: v.transmission },
                { icon: Fuel, label: "Fuel Type", value: v.fuel },
                { icon: Users, label: "Capacity", value: `${v.seats} Seats` },
                { icon: Zap, label: "Efficiency", value: v.mileage || "Standard" },
              ].map((spec) => (
                <div
                  key={spec.label}
                  className="rounded-2xl border border-border/50 bg-card/60 p-4 transition hover:border-primary/30"
                >
                  <spec.icon className="h-5 w-5 text-primary" />
                  <p className="mt-2 text-xs font-medium text-muted-foreground">{spec.label}</p>
                  <p className="mt-0.5 text-sm font-extrabold text-foreground">{spec.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trip Inclusions & Peace of Mind */}
          <div className="rounded-3xl border border-border/60 bg-card/50 p-6">
            <h2 className="text-base font-bold text-foreground">Included with this Rental</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                "Free cancellation up to 6 hours before pickup",
                "24/7 National roadside assistance",
                "Sanitized & safety checked vehicle",
                "Original documents & commercial insurance",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span className="text-xs font-semibold text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agency Host Info */}
          <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/60 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Fleet Operator</p>
              <h3 className="text-sm font-extrabold text-foreground">{v.agency}</h3>
              <p className="text-xs text-muted-foreground">Verified commercial fleet partner on RentRide</p>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking Card */}
        <div>
          <aside className="sticky top-20 rounded-3xl border border-border/60 bg-card p-6 shadow-xl backdrop-blur-md">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rental Rate</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-black text-foreground">
                  ₹{unitPrice?.toLocaleString() || 0}
                </span>
                <span className="text-xs font-medium text-muted-foreground">/ {duration}</span>
              </div>
            </div>

            {/* Rental Plan Tabs */}
            <div className="mt-5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Pricing Plan
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {["daily", "weekly", "monthly"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`rounded-xl border py-2 text-xs font-bold capitalize transition-all ${
                      duration === d
                        ? "border-primary bg-primary/10 text-primary font-black shadow-xs"
                        : "border-border/60 bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Dates Selection */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Pick-up Date
                </label>
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
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Return Date
                </label>
                <input
                  type="date"
                  min={isValidDate(startDate) ? addDays(startDate, 1) : todayStr()}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Trip Price Summary Breakdown */}
            <div className="mt-6 space-y-2.5 border-t border-border/50 pt-5 text-sm">
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>
                  Base duration ({totalDays} day{totalDays !== 1 ? "s" : ""})
                </span>
                <span>₹{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>Damage Protection</span>
                <span className="text-emerald-600 font-semibold">Included</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>Security Deposit</span>
                <span className="text-emerald-600 font-semibold">₹0 (Zero Deposit)</span>
              </div>
              <div className="flex justify-between border-t border-border/50 pt-3 text-base font-extrabold text-foreground">
                <span>Estimated Total</span>
                <span className="text-primary text-xl font-black">₹{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Book Now Button */}
            <button
              disabled={!v.available}
              onClick={handleBook}
              className="mt-6 w-full rounded-2xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-md hover:bg-primary/90 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!v.available
                ? "Vehicle Currently Booked"
                : user
                ? "Proceed to Reservation →"
                : "Sign In to Reserve"}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Pay at pickup · Instant notification confirmation
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

export { VehicleDetailPage as default };
