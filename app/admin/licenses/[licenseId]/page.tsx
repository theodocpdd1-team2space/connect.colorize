"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/AdminShell";

export default function LicenseDetailPage() {
  const params = useParams<{ licenseId: string }>();
  const [form, setForm] = useState<any>(null);
  const [message, setMessage] = useState("");

  function load() {
    fetch(`/api/admin/licenses/${params.licenseId}`).then((r) => r.json()).then((data) => {
      const license = data.license;
      setForm({
        licenseKey: license.license_key,
        plan: license.plan,
        status: license.status,
        maxUsers: license.max_users,
        recommendedUsers: license.recommended_users,
        maxActiveRooms: license.max_active_rooms,
        lifetimeUse: Boolean(license.lifetime_use),
        updateUntil: license.update_until || "",
        trialEndsAt: license.trial_ends_at || "",
        vendorName: license.vendor_name,
        email: license.email
      });
    });
  }

  useEffect(load, [params.licenseId]);

  async function post(body: any) {
    const response = await fetch(`/api/admin/licenses/${params.licenseId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    setMessage(response.ok ? "Saved." : data.message || "Action failed.");
    load();
  }

  function save(event: FormEvent) {
    event.preventDefault();
    void post(form);
  }

  return (
    <AdminShell title="License Detail">
      {!form ? <div className="glass rounded-[1.5rem] p-5">Loading license...</div> : (
        <div className="space-y-5">
          <section className="glass rounded-[1.5rem] p-5">
            <h2 className="text-2xl font-black">{form.licenseKey}</h2>
            <p className="mt-2 text-sm text-slate-300">{form.vendorName} · {form.email}</p>
          </section>
          <form className="glass grid max-w-3xl gap-3 rounded-[1.5rem] p-5 md:grid-cols-2" onSubmit={save}>
            <input className="input-field" value={form.licenseKey} onChange={(e) => setForm({ ...form, licenseKey: e.target.value })} />
            <select className="input-field" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
              <option value="trial">trial</option>
              <option value="web_license">web_license</option>
              <option value="custom">custom</option>
            </select>
            <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">active</option>
              <option value="expired">expired</option>
              <option value="suspended">suspended</option>
            </select>
            <input className="input-field" type="number" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: Number(e.target.value) })} />
            <input className="input-field" type="number" value={form.recommendedUsers} onChange={(e) => setForm({ ...form, recommendedUsers: Number(e.target.value) })} />
            <input className="input-field" type="number" value={form.maxActiveRooms} onChange={(e) => setForm({ ...form, maxActiveRooms: Number(e.target.value) })} />
            <input className="input-field" placeholder="Update until" value={form.updateUntil} onChange={(e) => setForm({ ...form, updateUntil: e.target.value })} />
            <input className="input-field" placeholder="Trial ends at" value={form.trialEndsAt} onChange={(e) => setForm({ ...form, trialEndsAt: e.target.value })} />
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <input type="checkbox" checked={form.lifetimeUse} onChange={(e) => setForm({ ...form, lifetimeUse: e.target.checked })} />
              <span className="font-bold">Lifetime use</span>
            </label>
            <button className="btn-primary md:col-span-2" type="submit">Save Changes</button>
          </form>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => post({ action: "suspend" })}>Suspend License</button>
            <button className="btn-secondary" onClick={() => post({ action: "activate" })}>Activate License</button>
            <button className="btn-secondary" onClick={() => post({ action: "extend-year" })}>Extend 1 Year</button>
            <button className="btn-secondary" onClick={() => post({ action: "reset-rooms" })}>Reset Active Rooms/Sessions</button>
            <button className="btn-secondary" onClick={() => post({ action: "delete" })}>Delete If Safe</button>
          </div>
          {message ? <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-3 text-sm text-cyan-50">{message}</div> : null}
        </div>
      )}
    </AdminShell>
  );
}
