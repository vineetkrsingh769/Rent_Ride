function formatStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}
function apiBookingToRow(b) {
  const v = b.vehicle;
  return {
    id: b._id,
    vehicleId: v?._id ?? "",
    vehicleName: v?.name ?? "Unknown",
    vehicleBrand: v?.brand ?? "",
    vehicleNumber: v?.vehicleNumber ?? "",
    vehicleImage: v?.images?.[0] ?? "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=200&q=70",
    customerName: b.customer?.name ?? "\u2014",
    agencyName: v?.owner?.agencyName ?? v?.owner?.name,
    startDate: formatDate(b.startDate) + (b.startTime ? ` ${b.startTime}` : ""),
    endDate: formatDate(b.endDate) + (b.endTime ? ` ${b.endTime}` : ""),
    startTime: b.startTime,
    endTime: b.endTime,
    duration: formatStatus(b.duration),
    total: b.totalPrice,
    status: formatStatus(b.status),
    statusRaw: b.status
  };
}
export {
  apiBookingToRow,
  formatStatus
};
