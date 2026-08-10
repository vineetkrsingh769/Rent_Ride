import { Link } from "react-router-dom";
const statusStyle = {
  Pending: "bg-amber-100 text-amber-900",
  Approved: "bg-blue-100 text-blue-900",
  Active: "bg-emerald-100 text-emerald-900",
  Completed: "bg-muted text-foreground",
  Rejected: "bg-destructive/15 text-destructive",
  Cancelled: "bg-muted text-muted-foreground"
};
function BookingsTable({
  bookings,
  role,
  onCancel,
  onApprove,
  onReject,
  onSetStatus,
  loading
}) {
  if (loading) {
    return <p className="px-4 py-8 text-sm text-muted-foreground">Loading bookings…</p>;
  }
  if (bookings.length === 0) {
    return <div className="px-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">No bookings yet.</p>
        {role === "customer" && <Link to="/vehicles" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
            Browse vehicles →
          </Link>}
      </div>;
  }
  return <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Vehicle</th>
            {(role === "agency" || role === "admin") && <th className="px-4 py-3">Customer</th>}
            {role === "admin" && <th className="px-4 py-3">Agency</th>}
            <th className="px-4 py-3">Dates</th>
            <th className="px-4 py-3">Plan</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => <tr key={b.id} className="border-t border-border">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <img src={b.vehicleImage} alt="" className="h-10 w-14 rounded-md object-cover bg-muted" />
                  <div>
                    <p className="font-medium">{b.vehicleBrand} {b.vehicleName}</p>
                    <p className="text-xs text-muted-foreground">{b.vehicleNumber}</p>
                  </div>
                </div>
              </td>
              {(role === "agency" || role === "admin") && <td className="px-4 py-3 text-muted-foreground">{b.customerName}</td>}
              {role === "admin" && <td className="px-4 py-3 text-muted-foreground">{b.agencyName ?? "\u2014"}</td>}
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {b.startDate} → {b.endDate}
              </td>
              <td className="px-4 py-3">{b.duration}</td>
              <td className="px-4 py-3 font-semibold">₹{b.total.toLocaleString()}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[b.status] ?? "bg-muted"}`}>
                  {b.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  {role === "customer" && ["Pending", "Approved"].includes(b.status) && onCancel && <button
    type="button"
    onClick={() => onCancel(b.id)}
    className="text-xs font-medium text-destructive hover:underline"
  >
                      Cancel
                    </button>}
                  {role === "agency" && b.status === "Pending" && onApprove && onReject && <>
                      <button
    type="button"
    onClick={() => onReject(b.id)}
    className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
  >
                        Reject
                      </button>
                      <button
    type="button"
    onClick={() => onApprove(b.id)}
    className="rounded-md bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground"
  >
                        Approve
                      </button>
                    </>}
                  {role === "admin" && onSetStatus && <select
    value={b.statusRaw ?? b.status.toLowerCase()}
    onChange={(e) => onSetStatus(b.id, e.target.value)}
    className="rounded-md border border-input bg-background px-2 py-1 text-xs"
  >
                      {["pending", "approved", "active", "completed", "rejected", "cancelled"].map((s) => <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>)}
                    </select>}
                  {b.vehicleId && <Link to={`/vehicles/${b.vehicleId}`} className="text-xs font-medium text-accent hover:underline">
                      View
                    </Link>}
                </div>
              </td>
            </tr>)}
        </tbody>
      </table>
    </div>;
}
export {
  BookingsTable
};
