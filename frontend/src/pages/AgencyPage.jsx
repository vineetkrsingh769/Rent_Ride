import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Car, CheckCircle2, Clock, Wrench, Pencil } from "lucide-react";
import {
  createVehicle,
  fetchAgencyDashboard,
  updateBookingStatus,
  updateVehicle
} from "@/lib/api-client";
import { apiBookingToRow, formatStatus } from "@/lib/api-types";
import { apiVehicleToVehicle } from "@/lib/vehicle-adapter";
import { VehicleFormModal } from "@/components/VehicleFormModal";
import { invalidateAllBookingQueries } from "@/lib/booking-queries";
const statusColors = {
  available: "bg-emerald-100 text-emerald-900",
  rented: "bg-blue-100 text-blue-900",
  maintenance: "bg-amber-100 text-amber-900",
  pending_approval: "bg-muted text-muted-foreground"
};
function AgencyPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ["agency-dashboard"],
    queryFn: fetchAgencyDashboard
  });
  const stats = data?.stats;
  const fleet = data?.vehicles ?? [];
  const pending = (data?.bookings ?? []).filter((b) => b.status === "pending");
  const statCards = [
    { icon: Car, label: "Fleet size", value: stats?.totalFleet ?? 0 },
    { icon: Clock, label: "Pending requests", value: stats?.pendingBookings ?? 0 },
    { icon: CheckCircle2, label: "Active rentals", value: stats?.activeRentals ?? 0 },
    { icon: Wrench, label: "In maintenance", value: stats?.maintenance ?? 0 }
  ];
  const refresh = () => {
    invalidateAllBookingQueries(queryClient);
  };
  const handleBookingAction = async (id, status) => {
    const result = await updateBookingStatus(id, status);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Booking ${status}`);
    refresh();
  };
  const handleSaveVehicle = async (form) => {
    if (editing) {
      const result = await updateVehicle(editing._id, {
        name: form.name,
        brand: form.brand,
        vehicleModel: form.vehicleModel,
        type: form.type,
        modelYear: form.modelYear,
        fuelType: form.fuelType,
        transmission: form.transmission,
        seats: form.seats,
        pricing: form.pricing,
        location: form.location
      });
      if (result.error) return result.error;
      toast.success("Vehicle updated");
    } else {
      const result = await createVehicle(form);
      if (result.error) return result.error;
      toast.success("Vehicle submitted for approval");
    }
    refresh();
    return null;
  };
  const toggleMaintenance = async (vehicle) => {
    const newStatus = vehicle.status === "maintenance" ? "available" : "maintenance";
    const result = await updateVehicle(vehicle._id, { status: newStatus });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(newStatus === "maintenance" ? "Marked for maintenance" : "Back to available");
    refresh();
  };
  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-24 text-center text-muted-foreground">Loading dashboard…</div>;
  }
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agency dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your fleet, approvals and availability.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 shadow-md transition active:scale-[0.99]"
        >
          + Add vehicle
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => <div key={s.label} className="rounded-2xl border border-border/40 bg-card p-6 shadow-md transition hover:border-primary/20">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <s.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-4 text-3xl font-extrabold tracking-tight text-foreground">{s.value}</p>
          </div>)}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-border/40 bg-card/85 shadow-lg backdrop-blur-sm">
          <header className="border-b border-border/40 px-5 py-4">
            <h2 className="font-bold text-foreground">My Fleet</h2>
          </header>
          {fleet.length === 0 ? <p className="px-5 py-8 text-sm text-muted-foreground">No vehicles yet. Add your first listing.</p> : <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5">Vehicle</th>
                  <th className="px-3 py-2.5">Plate</th>
                  <th className="px-3 py-2.5">Day</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {fleet.map((raw) => {
    const v = apiVehicleToVehicle(raw);
    return <tr key={raw._id} className="border-t border-border">
                      <td className="px-5 py-3">
                        <span className="font-medium">{v.brand} {v.name}</span>
                        <div className="text-xs text-muted-foreground">
                          {v.type === "2W" ? "Two-wheeler" : "Four-wheeler"} · {v.location}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{v.number}</td>
                      <td className="px-3 py-3">₹{v.pricePerDay}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[raw.status] ?? "bg-muted"}`}>
                          {formatStatus(raw.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          <button
      onClick={() => {
        setEditing(raw);
        setModalOpen(true);
      }}
      className="rounded p-1 hover:bg-muted"
      title="Edit"
    >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {raw.status !== "rented" && raw.status !== "pending_approval" && <button
      onClick={() => toggleMaintenance(raw)}
      className="rounded px-2 py-0.5 text-xs hover:bg-muted"
    >
                              {raw.status === "maintenance" ? "Restore" : "Maint."}
                            </button>}
                        </div>
                      </td>
                    </tr>;
  })}
              </tbody>
            </table>}
        </section>

        <section className="rounded-2xl border border-border/40 bg-card/85 shadow-lg backdrop-blur-sm">
          <header className="border-b border-border/40 px-5 py-4">
            <h2 className="font-bold text-foreground">Pending Requests</h2>
          </header>
          <ul className="divide-y divide-border">
            {pending.length === 0 && <li className="px-5 py-6 text-sm text-muted-foreground">No pending requests.</li>}
            {pending.map((b) => {
    const row = apiBookingToRow(b);
    return <li key={b._id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-sm font-medium">{row.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.vehicleBrand} {row.vehicleName} · {row.startDate} → {row.endDate}
                    </p>
                    <p className="text-xs font-medium text-accent">₹{row.total.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBookingAction(b._id, "rejected")}
                      className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleBookingAction(b._id, "approved")}
                      className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition"
                    >
                      Approve
                    </button>
                  </div>
                </li>;
  })}
          </ul>
        </section>
      </div>

      <VehicleFormModal
    open={modalOpen}
    onClose={() => {
      setModalOpen(false);
      setEditing(null);
    }}
    onSubmit={handleSaveVehicle}
    initial={editing}
  />
    </main>;
}
export {
  AgencyPage as default
};
