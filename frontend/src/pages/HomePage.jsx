import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowRight, MapPin, Sparkles, Search, Star } from "lucide-react";
import { fetchVehiclesList } from "@/lib/api-client";

const CITIES = ["Mumbai", "Goa", "Bangalore", "Delhi", "Pune", "Kolkata"];

function HomePage() {
  const navigate = useNavigate();
  const [cityIndex, setCityIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  // Search parameters
  const [vehicleType, setVehicleType] = useState("All");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("daily");

  const getTodayStr = () => new Date().toISOString().slice(0, 10);
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };
  const getDayAfterTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  };

  const [startDate, setStartDate] = useState(getTomorrowStr());
  const [endDate, setEndDate] = useState(getDayAfterTomorrowStr());

  // Dynamic cycling text for city hero
  useEffect(() => {
    const interval = setInterval(() => {
      setCityIndex((prev) => (prev + 1) % CITIES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const { data: vehicleList = [], isLoading } = useQuery({
    queryKey: ["vehicles", "featured"],
    queryFn: () => fetchVehiclesList()
  });

  const featured = vehicleList.slice(0, 4);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("trip", "1");
    if (vehicleType !== "All") params.set("type", vehicleType);
    if (location.trim()) params.set("locationCity", location.trim());
    params.set("duration", duration);
    params.set("from", startDate);
    params.set("to", endDate);
    navigate(`/vehicles?${params.toString()}`);
  };

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <main className="relative overflow-hidden min-h-screen">
      {/* Background Animated Neon Glows */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-[350px] w-[350px] rounded-full bg-primary/10 animate-pulse-glow" />
      <div className="absolute bottom-1/3 right-1/4 -z-10 h-[450px] w-[450px] rounded-full bg-primary/5 animate-pulse-glow" style={{ animationDelay: "3s" }} />

      {/* Hero Section */}
      <section className="relative pt-10 pb-14 md:pt-12 md:pb-16 flex flex-col items-center text-center px-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary animate-float">
          <Sparkles className="h-4 w-4 animate-pulse" /> Self-Drive Freedom, Simplified
        </span>

        <h1 className="mt-8 text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl text-foreground leading-[1.1] max-w-4xl">
          Rent Premium Rides. <br />
          Explore In{" "}
          <span className="bg-gradient-to-r from-primary via-primary/80 to-emerald-400 bg-clip-text text-transparent transition-all duration-500">
            {CITIES[cityIndex]}.
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg font-medium leading-relaxed">
          Skip callbacks, deposit disputes, and booking conflicts. Instantly reserve cars & bikes from vetted local fleets.
        </p>

        {/* Floating Capsule Search Bar */}
        <form
          onSubmit={handleSearch}
          className="mt-12 w-full max-w-5xl bg-card/75 border border-border/40 backdrop-blur-md rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col md:flex-row gap-4 items-center justify-between"
        >
          {/* Vehicle Type Tabs */}
          <div className="w-full md:w-auto">
            <span className="block text-left text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Ride Type</span>
            <div className="flex bg-background border border-border/60 p-1 rounded-2xl">
              {["All", "2W", "4W"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setVehicleType(t)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    vehicleType === t
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "All" ? "All" : t === "2W" ? "Bike" : "Car"}
                </button>
              ))}
            </div>
          </div>

          {/* Location Input */}
          <div className="w-full md:w-auto flex-1">
            <span className="block text-left text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Destination</span>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <input
                type="text"
                placeholder="Where are you heading?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="h-12 w-full rounded-2xl border border-border/60 bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary"
              />
            </div>
          </div>

          {/* Pricing Plan Duration */}
          <div className="w-full md:w-auto">
            <span className="block text-left text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Pricing Plan</span>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="h-12 w-full md:w-36 rounded-2xl border border-border/60 bg-background px-3 text-sm outline-none transition focus:border-primary"
            >
              <option value="daily">Daily Rates</option>
              <option value="weekly">Weekly Rates</option>
              <option value="monthly">Monthly Rates</option>
            </select>
          </div>

          {/* Trip Dates */}
          <div className="w-full md:w-auto flex gap-2">
            <div className="flex-1 md:flex-initial">
              <span className="block text-left text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Pickup Date</span>
              <input
                type="date"
                min={getTodayStr()}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="h-12 w-full rounded-2xl border border-border/60 bg-background px-3 text-xs outline-none focus:border-primary"
              />
            </div>
            <div className="flex-1 md:flex-initial">
              <span className="block text-left text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Return Date</span>
              <input
                type="date"
                min={startDate || getTodayStr()}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="h-12 w-full rounded-2xl border border-border/60 bg-background px-3 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="w-full md:w-auto self-end h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
          </button>
        </form>
      </section>

      {/* High-Fidelity Showcase (Showcasing Featured Fleet beautifully) */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Featured Fleet</span>
            <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">Engineered for Experience</h2>
          </div>
          <Link
            to="/vehicles"
            className="mt-3 sm:mt-0 text-sm font-bold text-primary flex items-center gap-1 group hover:underline"
          >
            View Full Fleet <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-card/40 animate-pulse border border-border/40" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((v) => (
              <div
                key={v.id}
                className="group relative rounded-2xl border border-border/40 bg-card overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-primary/40 hover:shadow-[0_12px_30px_rgba(126,242,157,0.1)]"
              >
                {/* Visual Image container */}
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <img
                    src={v.image}
                    alt={v.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80" />
                  <span className="absolute top-3 left-3 rounded-lg bg-background/80 backdrop-blur-md border border-border/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    {v.type === "2W" ? "Bike" : "Car"}
                  </span>
                </div>

                <div className="p-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{v.brand}</span>
                  <h3 className="text-lg font-bold mt-0.5 text-foreground group-hover:text-primary transition">{v.name}</h3>

                  <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Starting from</span>
                      <p className="text-base font-extrabold text-foreground">
                        ₹{v.pricePerDay}
                        <span className="text-xs font-normal text-muted-foreground"> / day</span>
                      </p>
                    </div>
                    <Link
                      to={`/vehicles/${v.id}`}
                      className="rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground px-3.5 py-2 text-xs font-bold transition"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Why RentRide Value Props Section */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 border-t border-border/20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Why Choose Us</span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">Built for Convenience & Safety</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { title: "No Security Deposit", desc: "Say goodbye to blocked security funds. Enjoy immediate rentals with zero upfront holds." },
            { title: "Vetted Local Fleets", desc: "Every bike, scooter, hatchback, and SUV is inspected and approved before listing." },
            { title: "Transparent Pricing", desc: "No dynamic surge charges or hidden service fees. What you see is exactly what you pay." },
            { title: "24/7 Roadside Assistance", desc: "Rest easy on your trip. Our support lines and recovery options are available around the clock." }
          ].map((item) => (
            <div key={item.title} className="bg-card border border-border/40 p-6 rounded-2xl shadow-sm transition hover:border-primary/20 hover:shadow-md">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black mb-4">✓</div>
              <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="border-t border-border/20 bg-card/10 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Renter Reviews</span>
            <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">Loved by Thousands of Renters</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { name: "Aarav Sharma", city: "Mumbai", text: "Renting an Activa in Goa was so simple. No call-backs, got the key at the counter instantly.", rating: 5 },
              { name: "Priya Nair", city: "Bangalore", text: "Cleanest Swift I've ever rented. The pricing is exactly what was shown online — no deposit hassles.", rating: 5 },
              { name: "Rohan Das", city: "Delhi", text: "Superb customer service. Had a flat tire on my bike rental, and support dispatched a replacement in 20 minutes.", rating: 5 }
            ].map((r, idx) => (
              <div key={idx} className="bg-card border border-border/40 p-6 rounded-2xl shadow-sm transition hover:border-primary/20">
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic mb-4 leading-relaxed">"{r.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                    {r.name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground leading-none">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 border-t border-border/20">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Frequently Asked Questions</span>
          <h2 className="text-3xl font-extrabold mt-1 text-foreground font-black">Have Questions? We Have Answers.</h2>
        </div>
        <div className="space-y-4">
          {[
            { q: "Is fuel cost included in the rental price?", a: "No, fuel is not included. The vehicle is provided with a full/partial tank, and you must return it with the same fuel level to avoid refueling charges." },
            { q: "What documents do I need to bring for pickup?", a: "You need a valid driving license (original copy), and a government-issued photo ID (like Aadhaar card or passport) matching the booking details." },
            { q: "What is the policy for late returns?", a: "We provide a grace period of 30 minutes. Post that, hourly late fees will apply based on the vehicle's standard daily pricing tier." },
            { q: "How do I cancel my reservation?", a: "You can cancel your booking directly from your Bookings dashboard. Full refunds are processed if cancelled at least 24 hours prior to pickup." }
          ].map((item, idx) => (
            <div key={idx} className="bg-card border border-border/40 rounded-2xl overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-foreground hover:bg-muted/10 transition"
              >
                <span>{item.q}</span>
                <span className={`text-primary transition-transform duration-300 text-lg ${openFaq === idx ? "rotate-45" : ""}`}>+</span>
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/20 pt-4 bg-muted/5 animate-fade-in">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Floating Statistics Indicators */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 border-t border-border/20">
        <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
          {[
            { metric: "15,000+", label: "Verified Kilometers" },
            { metric: "99.9%", label: "Uptime Booking Guarantee" },
            { metric: "100%", label: "Verified Agency Partners" },
            { metric: "24/7", label: "Instant Road Assistance" }
          ].map((s) => (
            <div key={s.label} className="text-center p-6 bg-card/45 border border-border/40 rounded-2xl backdrop-blur-sm">
              <p className="text-3xl font-black bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                {s.metric}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export { HomePage as default };
