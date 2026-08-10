const PRICE_BOUNDS = {
  daily: { min: 0, max: 5e3, step: 100 },
  weekly: { min: 0, max: 2e4, step: 500 },
  monthly: { min: 0, max: 6e4, step: 1e3 }
};
function clampPriceRange(duration, minPrice, maxPrice) {
  const { min, max } = PRICE_BOUNDS[duration];
  let lo = Math.min(Math.max(minPrice, min), max);
  let hi = Math.min(Math.max(maxPrice, min), max);
  if (lo > hi) [lo, hi] = [hi, lo];
  return { minPrice: lo, maxPrice: hi };
}
function defaultPriceRange(duration) {
  const { min, max } = PRICE_BOUNDS[duration];
  return { minPrice: min, maxPrice: max };
}
function buildVehicleSearchQuery(params) {
  const cleaned = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== void 0 && value !== "" && value !== "All") {
      cleaned[key] = value;
    }
  }
  return cleaned;
}
export {
  PRICE_BOUNDS,
  buildVehicleSearchQuery,
  clampPriceRange,
  defaultPriceRange
};
