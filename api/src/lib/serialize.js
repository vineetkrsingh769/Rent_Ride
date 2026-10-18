function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);
}
function serializeId(data) {
  if (data === null || data === void 0) return data;
  if (data instanceof Date) return data;
  if (Array.isArray(data)) return data.map((item) => serializeId(item));
  if (isPlainObject(data)) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === "id" && typeof value === "string") {
        result._id = value;
        continue;
      }
      if (["ownerId", "customerId", "vehicleId"].includes(key)) {
        continue;
      }
      result[key] = serializeId(value);
    }
    return result;
  }
  return data;
}
function formatVehicle(vehicle) {
  const { priceDaily, priceWeekly, priceMonthly, location, ...rest } = vehicle;
  const locationValue =
    typeof location === "string"
      ? { city: location }
      : location && typeof location === "object"
        ? location
        : { city: "India" };
  return serializeId({
    ...rest,
    location: locationValue,
    pricing: {
      daily: priceDaily,
      weekly: priceWeekly,
      monthly: priceMonthly
    }
  });
}
function formatUser(user) {
  const { password: _password, ...rest } = user;
  return serializeId(rest);
}
export {
  formatUser,
  formatVehicle,
  serializeId
};
