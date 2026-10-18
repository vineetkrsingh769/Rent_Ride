import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "./AuthProvider";

function SiteHeader() {
  const { user, logout, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = [
    { to: "/vehicles", label: "Browse", roles: null },
    {
      to: "/bookings",
      label: user?.role === "admin" ? "All Bookings" : "My Bookings",
      roles: ["customer", "agency", "admin"],
    },
    { to: "/agency", label: "Agency", roles: ["agency"] },
    { to: "/admin", label: "Admin", roles: ["admin"] },
  ].filter((n) => !n.roles || (user && n.roles.includes(user.role)));

  const navLinkClass = ({ isActive }) =>
    `rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
      isActive
        ? "bg-primary/10 text-primary font-bold shadow-xs"
        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/rentride_icon.png"
            alt="RentRide Logo"
            className="h-9 w-9 rounded-xl object-contain shadow-xs transition-transform duration-200 group-hover:scale-105"
          />
          <span className="text-xl font-black tracking-tight text-foreground">
            Rent<span className="text-primary">Ride</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} className={navLinkClass}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* User Auth Status / CTA */}
        <div className="flex items-center gap-3">
          {loading ? (
            <span className="h-8 w-20 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 py-1 pl-1 pr-3 shadow-xs">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary font-bold text-xs text-primary-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {user.name.split(" ")[0]}
                </span>
                {user.role !== "customer" && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary border border-primary/25">
                    {user.role}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:shadow-md"
              >
                Sign in
              </Link>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted/40 hover:text-foreground md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-border/60 bg-background/95 px-4 py-4 md:hidden backdrop-blur-xl shadow-xl">
          <nav className="flex flex-col gap-1.5">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                {n.label}
              </NavLink>
            ))}

            <div className="mt-2 border-t border-border/40 pt-2">
              {user ? (
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary font-bold text-xs text-primary-foreground">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-foreground">{user.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="rounded-lg px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="block w-full text-center rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground shadow"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export { SiteHeader };
