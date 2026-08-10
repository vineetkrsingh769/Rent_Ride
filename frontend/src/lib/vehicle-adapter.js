const FUEL_MAP = {
  petrol: "Petrol",
  diesel: "Diesel",
  electric: "Electric",
  cng: "Petrol",
  hybrid: "Hybrid"
};
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
function apiVehicleToVehicle(api) {
  return {
    id: api._id,
    name: api.name,
    brand: api.brand,
    type: api.type,
    year: api.modelYear,
    fuel: FUEL_MAP[api.fuelType.toLowerCase()] ?? capitalize(api.fuelType),
    transmission: api.transmission.toLowerCase() === "automatic" ? "Automatic" : "Manual",
    seats: api.seats ?? (api.type === "2W" ? 2 : 5),
    pricePerDay: api.pricing.daily,
    pricePerWeek: api.pricing.weekly,
    pricePerMonth: api.pricing.monthly,
    deposit: api.deposit ?? 0,
    location: typeof api.location === "string" ? api.location : api.location?.city ?? "India",
    available: api.status === "available",
    image: api.images?.[0] ?? "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=70",
    agency: api.owner?.agencyName ?? api.owner?.name ?? "Rental Agency",
    rating: 4.5,
    number: api.vehicleNumber
  };
}
export {
  apiVehicleToVehicle
};
