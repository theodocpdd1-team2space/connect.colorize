"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";

export default function NewLicensePage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [suggestedKey, setSuggestedKey] = useState("");
  const [createVendorInline, setCreateVendorInline] = useState(false);
  const [form, setForm] = useState({
    vendorId: "",
    vendorName: "",
    email: "",
    whatsapp: "",
    password: "12345678",
    plan: "web_license",
    licenseKey: "",
    maxUsers: 50,
    recommendedUsers: 12,
    maxActiveRooms: 999,
    lifetimeUse: true,
    updateUntil: "",
    trialDays: 7,
    status: "active"
  });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const vendorId = new URLSearchParams(window.location.search).get("vendorId") || "";
    if (vendorId) setForm((current) => ({ ...current, vendorId }));
    fetch("/api/admin/vendors").then((r) => r.json()).then((d) => setVendors(d.vendors || []));
    fetch("/api/admin/licenses").then((r) => r.json()).then((d) => {
      setSuggestedKey(d.suggestedKey || "");
      setForm((current) => ({ ...current, licenseKey: current.licenseKey || d.suggestedKey || "" }));
    });
  }, []);

  function applyPlan(plan: string) {
    const next = { ...form, plan };
    if (plan === "trial") Object.assign(next, { maxUsers: 2, recommendedUsers: 2, maxActiveRooms: 1, lifetimeUse: false, updateUntil: "" });
    if (plan === "web_license") Object.assign(next, { maxUsers: 50, recommendedUsers: 12, maxActiveRooms: 999, lifetimeUse: true });
    setForm(next);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, createVendor: createVendorInline })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Could not create license.");
      return;
    }
    setResult(data.license);
  }

  return (
    <AdminShell title="Generate License">
      <section className="glass max-w-3xl rounded-[1.5rem] p-5">
        <form className="grid gap-4" onSubmit={submit}>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <input type="checkbox" checked={createVendorInline} onChange={(e) => setCreateVendorInline(e.target.checked)} />
            <span className="font-bold">Create new vendor inline</span>
          </label>
          {createVendorInline ? (
            <div className="grid gap-3 md:grid-cols-2">
              <input className="input-field" placeholder="Vendor name" value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} />
              <input className="input-field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="input-field" placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              <input className="input-field" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          ) : (
            <select className="input-field" value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })}>
              <option value="">Select vendor</option>
              {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.vendor_name} · {vendor.email}</option>)}
            </select>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <select className="input-field" value={form.plan} onChange={(e) => applyPlan(e.target.value)}>
              <option value="trial">trial</option>
              <option value="web_license">web_license</option>
              <option value="custom">custom</option>
            </select>
            <input className="input-field" value="Rp49.000" readOnly />
            <input className="input-field" placeholder={suggestedKey} value={form.licenseKey} onChange={(e) => setForm({ ...form, licenseKey: e.target.value })} />
            <input className="input-field" type="number" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: Number(e.target.value) })} />
            <input className="input-field" type="number" value={form.recommendedUsers} onChange={(e) => setForm({ ...form, recommendedUsers: Number(e.target.value) })} />
            <input className="input-field" type="number" value={form.maxActiveRooms} onChange={(e) => setForm({ ...form, maxActiveRooms: Number(e.target.value) })} />
            <input className="input-field" placeholder="Update until" value={form.updateUntil} onChange={(e) => setForm({ ...form, updateUntil: e.target.value })} />
            <input className="input-field" type="number" value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: Number(e.target.value) })} />
            <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">active</option>
              <option value="suspended">suspended</option>
            </select>
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <input type="checkbox" checked={form.lifetimeUse} onChange={(e) => setForm({ ...form, lifetimeUse: e.target.checked })} />
              <span className="font-bold">Lifetime use</span>
            </label>
          </div>
          {error ? <div className="rounded-2xl border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</div> : null}
          <button className="btn-primary" type="submit">Generate License</button>
        </form>
        {result ? (
          <div className="mt-5 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-4 text-emerald-50">
            <p className="font-black">License generated.</p>
            <p className="mt-2">License key: {result.license_key}</p>
            <p>Vendor: {result.email || form.email || vendors.find((v) => v.id === form.vendorId)?.email}</p>
            <p>Plan: {result.plan}</p>
            <p>Max users: {result.max_users}</p>
            <p>Max active rooms: {result.max_active_rooms}</p>
            <button className="btn-secondary mt-3" type="button" onClick={() => navigator.clipboard.writeText(result.license_key)}>Copy key</button>
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}
