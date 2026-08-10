function invalidateAllBookingQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["bookings"] });
  queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
  queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
  queryClient.invalidateQueries({ queryKey: ["agency-dashboard"] });
}
export {
  invalidateAllBookingQueries
};
