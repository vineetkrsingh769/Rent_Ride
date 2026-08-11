import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { apiVehicleToVehicle } from "@/lib/vehicle-adapter";
import { fetchPublicPricingCategories } from "@/lib/api-client";

const emptyForm = {
  vehicleNumber: "",
  name: "",
  brand: "",
  vehicleModel: "",
  type: "4W",
  modelYear: new Date().getFullYear(),
  fuelType: "petrol",
  transmission: "manual",
  seats: 5,
  pricing: { daily: 0, weekly: 0, monthly: 0 },
  location: ""
};

function VehicleFormModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(emptyForm);
  const [pricingCategories, setPricingCategories] = useState([]);
  const [pricingTemplate, setPricingTemplate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    fetchPublicPricingCategories().then((r) => {
      if ("data" in r) setPricingCategories(r.data ?? []);
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const v = apiVehicleToVehicle(initial);
      setForm({
        vehicleNumber: initial.vehicleNumber,
        name: initial.name,
        brand: initial.brand,
        vehicleModel: initial.vehicleModel,
        type: initial.type,
        modelYear: initial.modelYear,
        fuelType: initial.fuelType,
        transmission: initial.transmission,
        seats: initial.seats,
        pricing: initial.pricing,
        // v normalises the API's { city } object down to a plain city string;
        // feeding initial.location straight in would put an object in a text input.
        location: v.location,
        status: initial.status,
        images: initial.images
      });
    } else {
      setForm(emptyForm);
      setPricingTemplate("");
    }
    setError(null);
  }, [open, initial]);

  if (!open) return null;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const err = await onSubmit(form);
    setSaving(false);
    if (err) setError(err);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{initial ? "Edit vehicle" : "Add vehicle"}</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plate number" value={form.vehicleNumber} onChange={(v) => set("vehicleNumber", v)} required disabled={!!initial} />
            <Field label="Display name" value={form.name} onChange={(v) => set("name", v)} required />
            <Field label="Brand" value={form.brand} onChange={(v) => set("brand", v)} required />
            <Field label="Model" value={form.vehicleModel} onChange={(v) => set("vehicleModel", v)} required />
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2" value={form.type} onChange={(e) => set("type", e.target.value)}>
                <option value="2W">Two-wheeler</option>
                <option value="4W">Four-wheeler</option>
              </select>
            </div>
            <Field label="Year" type="number" value={String(form.modelYear)} onChange={(v) => set("modelYear", Number(v))} required />
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Fuel</label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2" value={form.fuelType} onChange={(e) => set("fuelType", e.target.value)}>
                {["petrol", "diesel", "electric", "cng"].map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Transmission</label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2" value={form.transmission} onChange={(e) => set("transmission", e.target.value)}>
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
              </select>
            </div>
            <Field label="Seats" type="number" value={String(form.seats ?? "")} onChange={(v) => set("seats", Number(v))} />
            <Field label="Daily ₹" type="number" value={String(form.pricing.daily)} onChange={(v) => set("pricing", { ...form.pricing, daily: Number(v) })} required />
            <Field label="Weekly ₹" type="number" value={String(form.pricing.weekly)} onChange={(v) => set("pricing", { ...form.pricing, weekly: Number(v) })} required />
            <Field label="Monthly ₹" type="number" value={String(form.pricing.monthly)} onChange={(v) => set("pricing", { ...form.pricing, monthly: Number(v) })} required />
          </div>

          {!initial && pricingCategories.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Apply pricing template (optional)
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={pricingTemplate}
                onChange={(e) => {
                  const id = e.target.value;
                  setPricingTemplate(id);
                  const cat = pricingCategories.find((c) => c._id === id);
                  if (!cat) return;
                  setForm((f) => ({
                    ...f,
                    type: cat.vehicleType,
                    pricing: {
                      daily: cat.baseDailyRate,
                      weekly: cat.baseWeeklyRate,
                      monthly: cat.baseMonthlyRate
                    }
                  }));
                }}
              >
                <option value="">Custom pricing</option>
                {pricingCategories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.vehicleType}) — ₹{c.baseDailyRate}/day
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Field label="Location (City)" value={form.location} onChange={(v) => set("location", v)} required />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-md border border-border px-4 py-2 hover:bg-muted">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50">
              {saving ? "Saving…" : initial ? "Update" : "Add vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, disabled }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="w-full rounded-md border border-input bg-background px-3 py-2 disabled:opacity-60"
      />
    </div>
  );
}

export { VehicleFormModal };
