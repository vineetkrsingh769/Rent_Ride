import { Routes, Route, useLocation } from "react-router-dom";
import { SiteHeader } from "./components/SiteHeader";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import VehiclesPage from "./pages/VehiclesPage";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import BookingsPage from "./pages/BookingsPage";
import AgencyPage from "./pages/AgencyPage";
import AdminPage from "./pages/AdminPage";
import CheckoutPage from "./pages/CheckoutPage";
import { SiteFooter } from "./components/SiteFooter";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  const { pathname } = useLocation();
  const hideHeader = pathname === "/login";
  return (
    <div className={hideHeader ? "h-svh overflow-hidden" : "min-h-screen flex flex-col bg-background text-foreground"}>
      {!hideHeader && <SiteHeader />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/agency" element={<AgencyPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      {!hideHeader && <SiteFooter />}
    </div>
  );
}

export { App as default };
