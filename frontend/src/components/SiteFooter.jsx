import { Link } from "react-router-dom";
import rentrideIcon from "../assets/rentride_icon.png";
function SiteFooter() {
  return <footer className="mt-20 border-t border-border/40 bg-card/25">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={rentrideIcon} alt="RentRide Logo" className="h-10 w-10 rounded-lg object-contain" />
              <span className="text-lg font-bold tracking-tight text-foreground">Rent<span className="text-primary">Ride</span></span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground/80 leading-relaxed">
              Premium car and bike rentals across major Indian tourist hubs and cities. Hassle-free self-drive vehicle booking.
            </p>
          </div>
 
          <div className="mt-8 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div>
              <h3 className="text-sm font-semibold tracking-wider text-foreground uppercase">Services</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link to="/vehicles?type=2W" className="text-sm text-muted-foreground/75 hover:text-primary transition">
                    Rent Bikes & Scooters
                  </Link>
                </li>
                <li>
                  <Link to="/vehicles?type=4W" className="text-sm text-muted-foreground/75 hover:text-primary transition">
                    Rent Cars
                  </Link>
                </li>
                <li>
                  <Link to="/vehicles" className="text-sm text-muted-foreground/75 hover:text-primary transition">
                    Browse Full Fleet
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wider text-foreground uppercase">Support</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <span className="text-sm text-muted-foreground/85">
                    Call Support: +91 91270 08800
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
 
        <div className="mt-8 border-t border-border/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground/60">
            &copy; {(/* @__PURE__ */ new Date()).getFullYear()} RentRide Technologies Private Limited. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Designed for convenience. Built for Indian roads.
          </p>
        </div>
      </div>
    </footer>;
}
export {
  SiteFooter
};
