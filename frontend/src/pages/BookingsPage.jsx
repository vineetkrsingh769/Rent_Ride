import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchBookings, updateBookingStatus } from "@/lib/api-client";
import { useAuth } from "@/components/AuthProvider";
import { BookingsTable } from "@/components/BookingsTable";
import { invalidateAllBookingQueries } from "@/lib/booking-queries";
function BookingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const role = user?.role ?? "customer";
  const {
    data: bookings = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => fetchBookings()
  });
  const afterMutation = (message) => {
    toast.success(message);
    invalidateAllBookingQueries(queryClient);
  };
  const handleCancel = async (id) => {
    const result = await updateBookingStatus(id, "cancelled");
    if (result.error) toast.error(result.error);
    else afterMutation("Booking cancelled");
  };
  const handleApprove = async (id) => {
    const result = await updateBookingStatus(id, "approved");
    if (result.error) toast.error(result.error);
    else afterMutation("Booking approved");
  };
  const handleReject = async (id) => {
    const result = await updateBookingStatus(id, "rejected");
    if (result.error) toast.error(result.error);
    else afterMutation("Booking rejected");
  };
  const handleSetStatus = async (id, status) => {
    const result = await updateBookingStatus(id, status);
    if (result.error) toast.error(result.error);
    else afterMutation(`Status updated to ${status}`);
  };
  const title = role === "admin" ? "All platform bookings" : role === "agency" ? "Fleet bookings" : "My bookings";
  const subtitle = role === "admin" ? "Same data as Admin \u2192 Bookings. Changes here update KPIs and agency dashboards." : role === "agency" ? "Approve or reject pending requests. Matches your agency dashboard." : "Track requests, active rentals, and rental history.";
  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {role === "admin" && <Link
    to="/admin"
    className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
  >
            Admin console →
          </Link>}
      </div>

      {isError && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
        </div>}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <BookingsTable
    bookings={bookings}
    role={role}
    loading={isLoading}
    onCancel={role === "customer" ? handleCancel : void 0}
    onApprove={role === "agency" ? handleApprove : void 0}
    onReject={role === "agency" ? handleReject : void 0}
    onSetStatus={role === "admin" ? handleSetStatus : void 0}
  />
      </div>
    </main>;
}
export {
  BookingsPage as default
};
