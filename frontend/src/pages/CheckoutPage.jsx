import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "sonner";
import { ArrowLeft, Calendar, ShieldCheck, MapPin, Fuel } from "lucide-react";
import { createBooking, fetchVehicleById } from "@/lib/api-client";
import { useAuth } from "@/components/AuthProvider";
import { invalidateAllBookingQueries } from "@/lib/booking-queries";
const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
  const hour = i + 6;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour;
  const timeVal = `${String(hour).padStart(2, "0")}:00`;
  return { value: timeVal, label: `${displayHour}:00 ${suffix}` };
});
function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const vehicleId = searchParams.get("vehicleId");
  const urlDuration = searchParams.get("duration") || "daily";
  const urlFrom = searchParams.get("from") || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const urlTo = searchParams.get("to") || new Date(Date.now() + 2 * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { data: v, isLoading, isError } = useQuery({
    queryKey: ["vehicle", vehicleId],
    queryFn: () => fetchVehicleById(vehicleId),
    enabled: !!vehicleId
  });
  const totalDays = useMemo(() => {
    const start = new Date(urlFrom);
    const end = new Date(urlTo);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24)));
  }, [urlFrom, urlTo]);
  const unitPrice = useMemo(() => {
    if (!v) return 0;
    if (urlDuration === "weekly") return v.pricePerWeek;
    if (urlDuration === "monthly") return v.pricePerMonth;
    return v.pricePerDay;
  }, [v, urlDuration]);
  const rentalTotal = useMemo(() => {
    if (urlDuration === "daily") return unitPrice * totalDays;
    if (urlDuration === "weekly") return unitPrice * Math.ceil(totalDays / 7);
    return unitPrice * Math.ceil(totalDays / 30);
  }, [unitPrice, urlDuration, totalDays]);
  const payableAmount = rentalTotal;
  const handleCreateBooking = async () => {
    if (!user) {
      toast.error("Please sign in to proceed");
      return;
    }
    setSubmitting(true);
    const result = await createBooking({
      vehicleId: v.id,
      startDate: new Date(urlFrom).toISOString(),
      endDate: new Date(urlTo).toISOString(),
      duration: urlDuration,
      notes: notes.trim() || void 0
    });
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Payment Received & Booking Requested!", {
      description: "Redirecting you to your bookings dashboard."
    });
    invalidateAllBookingQueries(queryClient);
    setTimeout(() => navigate("/bookings"), 2e3);
  };
  if (isLoading) {
    return <div className="text-center py-24 text-muted-foreground">Loading checkout details...</div>;
  }
  if (isError || !v) {
    return <div className="text-center py-24">
        <h2 className="text-2xl font-bold">Checkout is empty</h2>
        <p className="mt-2 text-muted-foreground">Go back to select a ride.</p>
        <Link to="/vehicles" className="mt-4 inline-block rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
          Browse vehicles
        </Link>
      </div>;
  }
  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Toaster richColors position="top-center" />
      <Link to={`/vehicles/${v.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Edit reservation dates
      </Link>

      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Confirm & Pay</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {
    /* Booking Times */
  }
          <div className="rounded-2xl border border-border/40 bg-card/85 p-6 shadow-xl space-y-4 backdrop-blur-sm">
            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Calendar className="h-5 w-5 text-primary" /> Trip Schedule
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pickup</label>
                <div className="mt-1 font-bold text-base text-foreground">{new Date(urlFrom).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                <div className="mt-3">
                  <label className="block mb-1 text-xs font-semibold text-muted-foreground">Pickup Time</label>
                  <select
    value={startTime}
    onChange={(e) => setStartTime(e.target.value)}
    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
  >
                    {TIME_SLOTS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Return</label>
                <div className="mt-1 font-bold text-base text-foreground">{new Date(urlTo).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                <div className="mt-3">
                  <label className="block mb-1 text-xs font-semibold text-muted-foreground">Return Time</label>
                  <select
    value={endTime}
    onChange={(e) => setEndTime(e.target.value)}
    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
  >
                    {TIME_SLOTS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {
    /* Vehicle Info */
  }
          <div className="rounded-2xl border border-border/40 bg-card/85 p-6 shadow-xl flex flex-col sm:flex-row gap-5 backdrop-blur-sm">
            <img src={v.image} alt={v.name} className="w-full sm:w-44 aspect-[16/10] object-cover rounded-xl bg-muted border border-border/40 shrink-0" />
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold text-primary tracking-wider">{v.brand}</span>
              <h2 className="text-xl font-extrabold leading-none text-foreground">{v.name}</h2>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-2 font-semibold">
                <span className="inline-flex items-center gap-1"><Fuel className="h-3.5 w-3.5" /> {v.fuel}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {v.location}</span>
                <span>By <span className="font-semibold text-foreground">{v.agency}</span></span>
              </div>
            </div>
          </div>



          {
    /* Notes */
  }
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Special Request (Optional)</label>
            <textarea
    rows={3}
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    placeholder="E.g., extra helmet, pick up location instructions, hotel delivery details..."
    className="w-full rounded-xl border border-border bg-background p-3.5 text-sm resize-none outline-none focus:border-primary"
  />
          </div>
        </div>

        {
    /* Price Breakdown Sidebar */
  }
        <aside className="h-fit rounded-2xl border border-border/40 bg-card/85 p-6 shadow-xl backdrop-blur-sm space-y-6">
          <h2 className="text-lg font-bold tracking-tight border-b border-border/40 pb-3 text-foreground">Fare Summary</h2>

          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between font-semibold text-muted-foreground">
              <span>Base Rental Plan ({urlDuration})</span>
              <span>₹{rentalTotal.toLocaleString()}</span>
            </div>
            <div className="border-t border-border/40 pt-4 mt-2 flex justify-between text-base font-bold text-foreground">
              <span>Total Payable</span>
              <span className="text-primary font-extrabold text-lg">₹{payableAmount.toLocaleString()}</span>
            </div>
          </div>

          {
    /* Payment CTA */
  }
          <div className="space-y-3 pt-3 border-t border-border/40">
            <button
    onClick={handleCreateBooking}
    disabled={submitting}
    className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-primary-foreground py-3.5 text-sm font-bold shadow-md hover:opacity-90 active:scale-[0.99] transition disabled:opacity-50"
  >
              <ShieldCheck className="h-4.5 w-4.5" /> {submitting ? "Processing Transaction..." : `Pay ₹${payableAmount.toLocaleString()} Now`}
            </button>
            <p className="text-center text-xs text-muted-foreground font-medium">
              Demo Checkout Flow: Payment succeeds immediately in sandbox environment.
            </p>
          </div>
        </aside>
      </div>
    </main>;
}
export {
  CheckoutPage as default
};
