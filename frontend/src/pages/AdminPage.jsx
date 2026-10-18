import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  CalendarCheck,
  Car,
  DollarSign,
  Users,
  Check,
  X
} from "lucide-react";
import {
  approveVehicle,
  createPricingCategory,
  fetchAdminAnalytics,
  fetchAdminUsers,
  fetchBookings,
  fetchPendingVehicles,
  fetchPricingCategories,
  updateBookingStatus,
  updatePricingCategory,
  updateUserStatus,
  deleteUser
} from "@/lib/api-client";
import { formatStatus } from "@/lib/api-types";
import { useAuth } from "@/components/AuthProvider";
import { BookingsTable } from "@/components/BookingsTable";
import { invalidateAllBookingQueries } from "@/lib/booking-queries";
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "bookings", label: "Bookings" },
  { id: "pricing", label: "Pricing" }
];
async function load(fn) {
  const result = await fn();
  if (result.error) throw new Error(result.error);
  return result.data;
}
function AdminPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("overview");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [pricingForm, setPricingForm] = useState({
    name: "",
    vehicleType: "4W",
    baseDailyRate: 0,
    baseWeeklyRate: 0,
    baseMonthlyRate: 0,
    description: ""
  });
  const analyticsQ = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => load(() => fetchAdminAnalytics()).then((d) => d.kpis),
    enabled: isAdmin
  });
  const usersQ = useQuery({
    queryKey: ["admin-users", userRoleFilter],
    queryFn: () => load(() => fetchAdminUsers(userRoleFilter || void 0)),
    enabled: isAdmin
  });
  const pendingQ = useQuery({
    queryKey: ["admin-pending-vehicles"],
    queryFn: () => load(fetchPendingVehicles),
    enabled: isAdmin
  });
  const bookingsQ = useQuery({
    queryKey: ["bookings", bookingStatus || "all"],
    queryFn: () => fetchBookings(bookingStatus || void 0),
    enabled: isAdmin && tab === "bookings"
  });
  const pricingQ = useQuery({
    queryKey: ["admin-pricing"],
    queryFn: () => load(fetchPricingCategories),
    enabled: isAdmin && (tab === "pricing" || tab === "overview")
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    queryClient.invalidateQueries({ queryKey: ["admin-pending-vehicles"] });
    queryClient.invalidateQueries({ queryKey: ["admin-pricing"] });
    invalidateAllBookingQueries(queryClient);
  };
  const kpis = analyticsQ.data;
  const users = usersQ.data ?? [];
  const pendingVehicles = pendingQ.data ?? [];
  const bookings = bookingsQ.data ?? [];
  const pricingCategories = pricingQ.data ?? [];
  const handleUserToggle = async (userId, isActive) => {
    const result = await updateUserStatus(userId, isActive);
    if (result.error) toast.error(result.error);
    else {
      toast.success(isActive ? "User activated" : "User deactivated");
      refresh();
    }
  };

  const handleUserDelete = async (userId, name, role) => {
    if (role === "admin") return;
    const label = role === "agency" ? "agency" : "customer";
    if (!window.confirm(`Permanently delete ${name}? Their ${label === "agency" ? "fleet and " : ""}bookings will be removed.`)) {
      return;
    }
    const result = await deleteUser(userId);
    if (result.error) toast.error(result.error);
    else {
      toast.success("User deleted");
      refresh();
    }
  };
  const handleVehicleApproval = async (vehicleId, isApproved) => {
    const result = await approveVehicle(vehicleId, isApproved);
    if (result.error) toast.error(result.error);
    else {
      toast.success(isApproved ? "Vehicle approved" : "Vehicle rejected");
      refresh();
    }
  };
  const handleAddPricing = async (e) => {
    e.preventDefault();
    if (!pricingForm.name.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    if (pricingForm.baseDailyRate <= 0 || pricingForm.baseWeeklyRate <= 0 || pricingForm.baseMonthlyRate <= 0) {
      toast.error("All rates must be greater than \u20B90");
      return;
    }
    const result = await createPricingCategory(pricingForm);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Pricing category added");
      setPricingForm({
        name: "",
        vehicleType: "4W",
        baseDailyRate: 0,
        baseWeeklyRate: 0,
        baseMonthlyRate: 0,
        description: ""
      });
      refresh();
    }
  };
  const handleTogglePricing = async (categoryId, isActive) => {
    const result = await updatePricingCategory(categoryId, { isActive });
    if (result.error) toast.error(result.error);
    else {
      toast.success(isActive ? "Category activated" : "Category deactivated");
      refresh();
    }
  };

  const stats = [
    { icon: Users, label: "Customers", value: kpis?.registeredUsers?.toLocaleString() ?? "\u2014" },
    { icon: Building2, label: "Active agencies", value: kpis?.agencies ?? "\u2014" },
    { icon: Car, label: "Total vehicles", value: kpis?.totalVehicles ?? "\u2014" },
    { icon: CalendarCheck, label: "Total bookings", value: kpis?.totalBookings ?? "\u2014" },
    { icon: DollarSign, label: "Total revenue", value: kpis ? `\u20B9${kpis.totalRevenue.toLocaleString()}` : "\u2014" }
  ];
  if (authLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">Checking administrator credentials...</p>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-border/60 bg-card p-8 text-center shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Admin Sign In Required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You must be signed in as an administrator to access the admin console and view platform analytics.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/login"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90"
            >
              Sign In as Admin
            </Link>
            <Link
              to="/"
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted/30 transition"
            >
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-border/60 bg-card p-8 text-center shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <X className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Access Restricted</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You are signed in as a <span className="font-semibold text-foreground uppercase">{currentUser.role}</span>. This page is only accessible by platform administrators.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin console</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform oversight — users, fleet, bookings, and analytics.
          </p>
        </div>
        {(kpis?.pendingAgencies ?? 0) > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
            <AlertTriangle className="h-3.5 w-3.5" />
            {kpis?.pendingAgencies} agency account{kpis?.pendingAgencies === 1 ? "" : "s"} awaiting approval
          </span>}
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-xl bg-card border border-border/40 p-1.5 backdrop-blur-sm">
        {TABS.map((t) => <button
          key={t.id}
          type="button"
          onClick={() => setTab(t.id)}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${tab === t.id ? "bg-primary text-primary-foreground shadow-md scale-[1.01]" : "text-muted-foreground hover:text-foreground hover:bg-muted/10"}`}
        >
            {t.label}
          </button>)}
      </div>

      {analyticsQ.isError && <ErrorBanner message={analyticsQ.error.message} />}

      {tab === "overview" && <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {stats.map((s) => <div key={s.label} className="rounded-2xl border border-border/40 bg-card p-6 shadow-md transition hover:border-primary/20">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 text-3xl font-extrabold tracking-tight text-foreground">
                  {analyticsQ.isLoading ? "\u2026" : s.value}
                </p>
              </div>)}
          </div>

          {kpis && <section className="mt-8 rounded-2xl border border-border bg-card p-5">
              <h2 className="font-semibold">Platform KPIs</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi label="All accounts" value={String(kpis.totalUsers)} />
                <Kpi label="Conversion rate" value={`${kpis.bookingConversionRate}%`} />
                <Kpi label="Fleet utilization" value={`${kpis.vehicleUtilizationRate}%`} />
                <Kpi label="Avg rental duration" value={`${kpis.averageRentalDuration} days`} />
                <Kpi label="Pending vehicles" value={String(kpis.pendingApprovals)} />
                <Kpi label="Pending agencies" value={String(kpis.pendingAgencies)} />
                <Kpi label="Monthly active users" value={String(kpis.monthlyActiveUsers)} />
                <Kpi label="Booking conflict rate" value={`${kpis.bookingConflictRate}%`} />
              </div>
            </section>}

          {pendingVehicles.length > 0 && <section className="mt-8 rounded-2xl border border-border bg-card">
              <header className="border-b border-border px-5 py-4">
                <h2 className="font-semibold">Needs attention — pending vehicles</h2>
              </header>
              <PendingVehicleList
    vehicles={pendingVehicles}
    onApprove={(id, ok) => handleVehicleApproval(id, ok)}
  />
            </section>}
        </>}

      {tab === "users" && <section className="rounded-2xl border border-border bg-card">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 className="font-semibold">Users & agencies</h2>
            <select
    value={userRoleFilter}
    onChange={(e) => setUserRoleFilter(e.target.value)}
    className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
  >
              <option value="">All roles</option>
              <option value="customer">Customers</option>
              <option value="agency">Agencies</option>
              <option value="admin">Admins</option>
            </select>
          </header>
          {usersQ.isError ? <ErrorBanner message={usersQ.error.message} /> : usersQ.isLoading ? <LoadingRows /> : <ul className="max-h-[32rem] divide-y divide-border overflow-y-auto">
              {users.map((u) => {
    const isSelf = u._id === currentUser?.id;
    const pendingAgency = u.role === "agency" && !u.isActive;
    return <li key={u._id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium">
                        {u.name}
                        {pendingAgency && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">
                            Pending approval
                          </span>}
                        {!u.isActive && u.role !== "agency" && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                            Inactive
                          </span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {u.email} · <span className="capitalize">{u.role}</span>
                        {u.agencyName && ` \xB7 ${u.agencyName}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
      disabled={isSelf && u.isActive}
      title={isSelf ? "You cannot deactivate yourself" : void 0}
      onClick={() => handleUserToggle(u._id, !u.isActive)}
      className={`rounded-md px-2.5 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${u.isActive ? "border border-border hover:bg-muted" : "bg-accent text-accent-foreground"}`}
    >
                        {pendingAgency ? "Approve" : u.isActive ? "Deactivate" : "Activate"}
                      </button>
                      {(u.role === "customer" || u.role === "agency") && <button
      type="button"
      onClick={() => handleUserDelete(u._id, u.name, u.role)}
      className="rounded-md border border-destructive/30 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
    >
                          Delete
                        </button>}
                    </div>
                  </li>;
  })}
            </ul>}
        </section>}

      {tab === "bookings" && <section className="rounded-2xl border border-border bg-card">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="font-semibold">All bookings</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Synced with My Bookings — same API, same live data.
              </p>
            </div>
            <select
    value={bookingStatus}
    onChange={(e) => setBookingStatus(e.target.value)}
    className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
  >
              <option value="">All statuses</option>
              {["pending", "approved", "active", "completed", "rejected", "cancelled"].map((s) => <option key={s} value={s}>{formatStatus(s)}</option>)}
            </select>
          </header>
          {bookingsQ.isError ? <ErrorBanner message={bookingsQ.error.message} /> : <BookingsTable
    bookings={bookings}
    role="admin"
    loading={bookingsQ.isLoading}
    onSetStatus={async (id, status) => {
      const result = await updateBookingStatus(id, status);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`Status \u2192 ${formatStatus(status)}`);
        invalidateAllBookingQueries(queryClient);
      }
    }}
  />}
        </section>}

      {tab === "pricing" && <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Pricing categories</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Templates agencies can apply when listing vehicles.
          </p>
          {pricingQ.isError ? <ErrorBanner message={pricingQ.error.message} /> : <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <ul className="divide-y divide-border text-sm">
                {pricingCategories.length === 0 && <li className="py-4 text-muted-foreground">No categories yet.</li>}
                {pricingCategories.map((c) => <li key={c._id} className="flex items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.vehicleType} · ₹{c.baseDailyRate}/day · ₹{c.baseWeeklyRate}/wk · ₹
                        {c.baseMonthlyRate}/mo
                      </p>
                    </div>
                    <button
    type="button"
    onClick={() => handleTogglePricing(c._id, !c.isActive)}
    className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${c.isActive ? "border border-border hover:bg-muted" : "bg-accent text-accent-foreground"}`}
  >
                      {c.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </li>)}
              </ul>
              <form onSubmit={handleAddPricing} className="space-y-4 text-sm bg-card/60 p-6 rounded-2xl border border-border/40">
                <h3 className="font-bold text-foreground">Add New Category</h3>
                <input
                  placeholder="Category name"
                  value={pricingForm.name}
                  onChange={(e) => setPricingForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary"
                  required
                />
                <select
                  value={pricingForm.vehicleType}
                  onChange={(e) => setPricingForm((f) => ({ ...f, vehicleType: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
                >
                  <option value="2W">Two-wheeler</option>
                  <option value="4W">Four-wheeler</option>
                </select>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" placeholder="Daily ₹" value={pricingForm.baseDailyRate || ""} onChange={(e) => setPricingForm((f) => ({ ...f, baseDailyRate: +e.target.value }))} className="rounded-xl border border-border bg-background px-2 py-2 text-xs text-center outline-none focus:border-primary" required />
                  <input type="number" placeholder="Weekly ₹" value={pricingForm.baseWeeklyRate || ""} onChange={(e) => setPricingForm((f) => ({ ...f, baseWeeklyRate: +e.target.value }))} className="rounded-xl border border-border bg-background px-2 py-2 text-xs text-center outline-none focus:border-primary" required />
                  <input type="number" placeholder="Monthly ₹" value={pricingForm.baseMonthlyRate || ""} onChange={(e) => setPricingForm((f) => ({ ...f, baseMonthlyRate: +e.target.value }))} className="rounded-xl border border-border bg-background px-2 py-2 text-xs text-center outline-none focus:border-primary" required />
                </div>
                <button type="submit" className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground shadow-md hover:opacity-90 transition active:scale-[0.99]">
                  Add Category
                </button>
              </form>
            </div>}
        </section>}
    </main>;
}
function PendingVehicleList({
  vehicles,
  onApprove
}) {
  return <ul className="divide-y divide-border">
      {vehicles.map((v) => <li key={v._id} className="flex flex-col gap-3 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            {v.images?.[0] && <img src={v.images[0]} alt="" className="h-14 w-20 rounded-lg object-cover" />}
            <div>
              <p className="font-medium">{v.brand} {v.name}</p>
              <p className="text-xs text-muted-foreground">
                {v.vehicleNumber} · {v.type} · {v.fuelType}
              </p>
              <p className="text-xs text-muted-foreground">
                {v.owner?.agencyName ?? v.owner?.name} · ₹{v.pricing.daily}/day
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => onApprove(v._id, false)} className="rounded-md border p-1.5 hover:bg-muted" title="Reject">
              <X className="h-4 w-4" />
            </button>
            <button onClick={() => onApprove(v._id, true)} className="rounded-md bg-accent p-1.5 text-accent-foreground" title="Approve">
              <Check className="h-4 w-4" />
            </button>
          </div>
        </li>)}
    </ul>;
}
function Kpi({ label, value }) {
  return <div className="rounded-xl border border-border/40 bg-card p-4 text-center">
      <p className="text-2xl font-black text-primary">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>;
}
function ErrorBanner({ message }) {
  return <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </div>;
}
function LoadingRows() {
  return <p className="px-5 py-8 text-sm text-muted-foreground">Loading…</p>;
}
export {
  AdminPage as default
};
