function calculateRentalPrice(pricing, duration, days) {
  switch (duration) {
    case "daily":
      return pricing.daily * days;
    case "weekly":
      return pricing.weekly * Math.ceil(days / 7);
    case "monthly":
      return pricing.monthly * Math.ceil(days / 30);
    default:
      return pricing.daily * days;
  }
}
function getDaysBetween(start, end) {
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diff / (1e3 * 60 * 60 * 24)));
}
export {
  calculateRentalPrice,
  getDaysBetween
};
