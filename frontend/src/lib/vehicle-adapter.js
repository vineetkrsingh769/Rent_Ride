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

const COMMONS_FILE = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/([0-9a-f])\/([0-9a-f]{2})\/([^/?#]+)(?:[?#].*)?$/;

/**
 * Vehicle photos are stored as source URLs, and Wikimedia originals run to
 * several megabytes each — enough to make the listing page crawl. Rewrite them
 * to Wikimedia's thumbnail form, and pin a width on Unsplash URLs, so a card
 * downloads a few tens of KB instead.
 *
 * Wikimedia only serves a fixed set of thumbnail widths; 960 is the smallest
 * that is reliably available, so do not lower it without re-checking.
 */
function sizedImageUrl(url, width = 960) {
  if (typeof url !== "string" || !url) return url;
  const commons = url.match(COMMONS_FILE);
  if (commons) {
    const [, base, a, bc, file] = commons;
    return `${base}/thumb/${a}/${bc}/${file}/${width}px-${file}`;
  }
  if (url.includes("images.unsplash.com")) {
    return url.replace(/([?&])w=\d+/, `$1w=${width}`);
  }
  return url;
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
    image: sizedImageUrl(api.images?.[0]) ?? "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=70",
    agency: api.owner?.agencyName ?? api.owner?.name ?? "Rental Agency",
    rating: 4.5,
    number: api.vehicleNumber
  };
}
export {
  apiVehicleToVehicle
};
