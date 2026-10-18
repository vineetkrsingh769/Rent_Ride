import { apiVehicleToVehicle } from "./vehicle-adapter";
import { apiBookingToRow } from "./api-types";
import { buildVehicleSearchQuery } from "./vehicle-filters";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function apiUrl(path) {
  if (!API_BASE) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

async function apiRequest(path, init) {
  try {
    const res = await fetch(apiUrl(path), {
      credentials: "include",
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers }
    });
    const contentType = res.headers.get("content-type") || "";
    let json = null;
    if (contentType.includes("application/json")) {
      json = await res.json();
    } else {
      const text = await res.text();
      return { error: `Server error (${res.status}): ${text ? text.slice(0, 100) : res.statusText}` };
    }
    if (!json.success || json.data === void 0) {
      if (res.status === 401) {
        return { error: "Please sign in with appropriate permissions." };
      }
      return { error: json.error ?? "Request failed" };
    }
    return { data: json.data };
  } catch (err) {
    console.error(`[API Error] Request to ${path} failed:`, err);
    return { error: err?.message || "Network error — is the API running?" };
  }
}
async function apiFetch(path, init) {
  const result = await apiRequest(path, init);
  return result.data ?? null;
}
async function fetchVehiclesList(params) {
  const cleaned = buildVehicleSearchQuery(params ?? {});
  const qs = Object.keys(cleaned).length ? `?${new URLSearchParams(cleaned)}` : "";
  const result = await apiRequest(`/api/vehicles${qs}`);
  if (result.error) throw new Error(result.error);
  return (result.data ?? []).map(apiVehicleToVehicle);
}
async function fetchVehicleById(id) {
  const data = await apiFetch(`/api/vehicles/${id}`);
  if (data) return apiVehicleToVehicle(data);
  return null;
}
async function loginUser(email, password) {
  return apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}
async function registerUser(data) {
  return apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(data) });
}
async function fetchCurrentUser() {
  return apiFetch("/api/auth/me");
}
async function logoutUser() {
  await fetch(apiUrl("/api/auth/logout"), { method: "POST", credentials: "include" });
}
async function fetchBookings(status) {
  const qs = status ? `?status=${status}` : "";
  const result = await apiRequest(`/api/bookings${qs}`);
  if ("error" in result) throw new Error(result.error);
  return result.data.map(apiBookingToRow);
}
async function createBooking(data) {
  return apiRequest("/api/bookings", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
async function updateBookingStatus(bookingId, status) {
  return apiRequest(`/api/bookings/${bookingId}`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}
async function fetchAgencyDashboard() {
  return apiFetch("/api/agency/dashboard");
}
async function createVehicle(data) {
  return apiRequest("/api/vehicles", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
async function updateVehicle(id, data) {
  return apiRequest(`/api/vehicles/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}
async function fetchAdminUsers(role) {
  const qs = role ? `?role=${role}` : "";
  return apiRequest(`/api/admin/users${qs}`);
}
async function updateUserStatus(userId, isActive) {
  return apiRequest("/api/admin/users", {
    method: "PATCH",
    body: JSON.stringify({ userId, isActive })
  });
}
async function deleteUser(userId) {
  return apiRequest("/api/admin/users", {
    method: "DELETE",
    body: JSON.stringify({ userId })
  });
}
async function fetchPendingVehicles() {
  return apiRequest("/api/admin/vehicles");
}
async function approveVehicle(vehicleId, isApproved) {
  return apiRequest("/api/admin/vehicles", {
    method: "PATCH",
    body: JSON.stringify({ vehicleId, isApproved })
  });
}
async function fetchPricingCategories() {
  return apiRequest("/api/admin/pricing");
}
async function createPricingCategory(data) {
  return apiRequest("/api/admin/pricing", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
async function fetchAdminAnalytics() {
  return apiRequest("/api/admin/analytics");
}
async function updatePricingCategory(categoryId, data) {
  return apiRequest("/api/admin/pricing", {
    method: "PATCH",
    body: JSON.stringify({ categoryId, ...data })
  });
}
async function fetchPublicPricingCategories() {
  return apiRequest("/api/pricing");
}
export {
  approveVehicle,
  createBooking,
  createPricingCategory,
  createVehicle,
  deleteUser,
  fetchAdminAnalytics,
  fetchAdminUsers,
  fetchAgencyDashboard,
  fetchBookings,
  fetchCurrentUser,
  fetchPendingVehicles,
  fetchPricingCategories,
  fetchPublicPricingCategories,
  fetchVehicleById,
  fetchVehiclesList,
  loginUser,
  logoutUser,
  registerUser,
  updateBookingStatus,
  updatePricingCategory,
  updateUserStatus,
  updateVehicle
};
