import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import rentrideIcon from "../assets/rentride_icon.png";
function SiteHeader() {
  const { user, logout, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = [
    { to: "/vehicles", label: "Browse", roles: null },
    { to: "/bookings", label: user?.role === "admin" ? "All Bookings" : "My Bookings", roles: ["customer", "agency", "admin"] },
    { to: "/agency", label: "Agency", roles: ["agency"] },
    { to: "/admin", label: "Admin", roles: ["admin"] }
  ].filter((n) => !n.roles || user && n.roles.includes(user.role));
  const navLinkClass = ({ isActive }) => `block rounded-xl px-4 py-2 text-sm font-semibold transition ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"}`;
  return <header className="sticky top-4 z-50 mx-auto max-w-7xl px-4 sm:px-6">
      <div className="flex h-16 items-center justify-between px-6 rounded-2xl border border-border/40 bg-card/65 backdrop-blur-md shadow-lg">
        <Link to="/" className="flex items-center gap-2">
          <img src={rentrideIcon} alt="RentRide Logo" className="h-12 w-12 rounded-lg object-contain" />
          <span className="text-lg font-bold tracking-tight text-foreground">Rent<span className="text-primary">Ride</span></span>
        </Link>
 
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => <NavLink key={n.to} to={n.to} className={navLinkClass}>
              {n.label}
            </NavLink>)}
        </nav>
 
        <div className="flex items-center gap-2">
          {loading ? <span className="h-8 w-16 animate-pulse rounded-xl bg-muted" /> : user ? <>
              <span className="hidden text-sm text-muted-foreground lg:inline font-medium">
                Hi, {user.name.split(" ")[0]}
                {user.role !== "customer" && <span className="ml-2 rounded-lg bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">{user.role}</span>}
              </span>
              <button
                onClick={() => logout()}
                className="hidden rounded-xl border border-border bg-card/50 px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/40 sm:inline-flex transition"
              >
                Sign out
              </button>
            </> : <Link
              to="/login"
              className="hidden rounded-xl border border-border bg-card/50 px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/40 sm:inline-flex transition"
            >
              Sign in
            </Link>}
          <button
            type="button"
            className="rounded-xl p-2 hover:bg-muted/30 md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
 
      {mobileOpen && <div className="mt-2 rounded-2xl border border-border bg-card/90 px-4 py-3 md:hidden backdrop-blur-md shadow-xl">
          <nav className="flex flex-col gap-1">
            {nav.map((n) => <NavLink key={n.to} to={n.to} className={navLinkClass} onClick={() => setMobileOpen(false)}>
                {n.label}
              </NavLink>)}
            {user ? <button
              onClick={() => {
                logout();
                setMobileOpen(false);
              }}
              className="mt-1 rounded-xl px-4 py-2 text-left text-sm font-semibold text-muted-foreground hover:bg-muted/30 hover:text-foreground"
            >
              Sign out
            </button> : <Link
              to="/login"
              className="mt-1 rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </Link>}
          </nav>
        </div>}
    </header>;
}
export {
  SiteHeader
};
