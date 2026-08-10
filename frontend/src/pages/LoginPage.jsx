import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail, User, Building2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import rentrideIcon from "../assets/rentride_icon.png";
const HERO = "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1920&q=80";
function LoginPage() {
  const { login, register, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin");
  const [signupRole, setSignupRole] = useState("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (authLoading || !user) return;
    if (user.role === "admin") navigate("/admin", { replace: true });
    else if (user.role === "agency") navigate("/agency", { replace: true });
    else navigate("/vehicles", { replace: true });
  }, [user, authLoading, navigate]);
  const redirectForRole = (role) => {
    if (role === "admin") navigate("/admin");
    else if (role === "agency") navigate("/agency");
    else navigate("/vehicles");
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = mode === "signin" ? await login(email, password) : await register({
      name,
      email,
      password,
      role: signupRole,
      agencyName: signupRole === "agency" ? agencyName : void 0
    });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.pendingApproval) {
      toast.success("Application submitted! An admin will activate your agency account soon.");
      setMode("signin");
      return;
    }
    toast.success(mode === "signin" ? "Welcome back" : "Account created");
    redirectForRole(result.role ?? "customer");
  };
  if (authLoading) {
    return <div className="flex h-svh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>;
  }
  return <>
      <Toaster richColors position="top-center" />

      <div className="flex h-svh w-full overflow-hidden">
        {
    /* Brand panel — left half on desktop */
  }
        <aside className="relative hidden w-1/2 shrink-0 bg-primary lg:flex lg:flex-col">
          <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/85 to-primary/70" />
          <div className="relative flex h-full flex-col justify-between p-10 text-primary-foreground">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={rentrideIcon} alt="RentRide Logo" className="h-14 w-14 rounded-xl object-contain" />
              <span className="text-xl font-semibold tracking-tight">RentRide</span>
            </Link>
            <div className="max-w-md">
              <h2 className="text-3xl font-bold leading-tight tracking-tight">
                Rent bikes & cars on your schedule.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80">
                Daily, weekly, or monthly — book verified vehicles from trusted agencies across India.
              </p>
            </div>
            <p className="text-xs text-primary-foreground/50">© {(/* @__PURE__ */ new Date()).getFullYear()} RentRide</p>
          </div>
        </aside>

        {
    /* Form panel — full width mobile, right half desktop */
  }
        <main className="flex w-full flex-1 flex-col justify-center overflow-y-auto px-6 py-10 sm:px-12 lg:w-1/2 lg:px-16">
          <div className="mx-auto w-full max-w-sm">
            <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
              <img src={rentrideIcon} alt="RentRide Logo" className="h-12 w-12 rounded-lg object-contain" />
              <span className="text-lg font-semibold">RentRide</span>
            </Link>

            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight">
                {mode === "signin" ? "Sign in" : "Create account"}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {mode === "signin" ? "Enter your credentials to continue." : "Join RentRide in under a minute."}
              </p>
            </div>

            <div className="mb-6 flex rounded-lg bg-muted p-1">
              {["signin", "signup"].map((m) => <button
    key={m}
    type="button"
    onClick={() => setMode(m)}
    className={`flex-1 rounded-md py-2 text-sm font-medium transition ${mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
  >
                  {m === "signin" ? "Sign in" : "Sign up"}
                </button>)}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && <>
                  <Field label="Full name" icon={User}>
                    <input
    type="text"
    autoComplete="name"
    value={name}
    onChange={(e) => setName(e.target.value)}
    required
    className={inputClass}
  />
                  </Field>

                  <div>
                    <span className="mb-1.5 block text-sm font-medium">I am a</span>
                    <div className="grid grid-cols-2 gap-2">
                      <RoleOption
    active={signupRole === "customer"}
    onClick={() => setSignupRole("customer")}
    label="Renter"
    icon={User}
  />
                      <RoleOption
    active={signupRole === "agency"}
    onClick={() => setSignupRole("agency")}
    label="Fleet partner"
    icon={Building2}
  />
                    </div>
                  </div>

                  {signupRole === "agency" && <Field label="Agency name" icon={Building2}>
                      <input
    type="text"
    value={agencyName}
    onChange={(e) => setAgencyName(e.target.value)}
    required
    className={inputClass}
  />
                    </Field>}
                </>}

              <Field label="Email" icon={Mail}>
                <input
    type="email"
    autoComplete="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    required
    className={inputClass}
  />
              </Field>

              <Field label="Password" icon={Lock}>
                <div className="relative">
                  <input
    type={showPassword ? "text" : "password"}
    autoComplete={mode === "signin" ? "current-password" : "new-password"}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
    minLength={6}
    className={`${inputClass} pr-10`}
  />
                  <button
    type="button"
    tabIndex={-1}
    onClick={() => setShowPassword((v) => !v)}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
    aria-label={showPassword ? "Hide password" : "Show password"}
  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <button
    type="submit"
    disabled={loading}
    className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
  >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Please wait" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              <Link to="/vehicles" className="font-medium text-foreground hover:underline">
                Browse vehicles
              </Link>{" "}
              without signing in
            </p>
          </div>
        </main>
      </div>
    </>;
}
const inputClass = "h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15";
function Field({
  label,
  icon: Icon,
  children
}) {
  return <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
    </label>;
}
function RoleOption({
  active,
  onClick,
  label,
  icon: Icon
}) {
  return <button
    type="button"
    onClick={onClick}
    className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition ${active ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary" : "border-border text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50"}`}
  >
      <Icon className="h-4 w-4" />
      {label}
    </button>;
}
export {
  LoginPage as default
};
