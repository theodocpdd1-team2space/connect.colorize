"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/AdminShell";

export default function NewVendorPage() {
  const [form, setForm] = useState({
    vendorName: "",
    email: "",
    whatsapp: "",
    password: "12345678",
    autoCreateLicense: true,
    plan: "web_license",
    maxUsers: 50,
    recommendedUsers: 12,
    maxActiveRooms: 999,
    updateUntil: "",
    lifetimeUse: true,
    status: "active"
  });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Could not create vendor.");
      return;
    }
    setResult(data);
  }

  const loginInfo = result
    ? `Halo kak, lisensi EasyCom kamu sudah aktif ✅
Login:
https://easycom.vjmrtim.my.id/login
Email/WhatsApp:
${result.vendor.email}
Password:
${form.password}
License:
${result.license?.license_key || "-"}
Paket:
EasyCom Web License - Rp49.000
Benefit:
✅ Semua fitur EasyCom Web terbuka
✅ Banyak room
✅ Max 50 user per room
✅ QR Join
✅ Push-to-Talk
✅ Toggle Mic
✅ Ultra Low Latency Mode
✅ Clean Voice + Noise Reduction
✅ Keep Screen Awake
Cara pakai:
1. Login ke dashboard
2. Create Room
3. Tampilkan QR
4. Crew connect ke Wi-Fi/hotspot yang sama
5. Crew scan QR dan join
6. Gunakan headset kabel untuk hasil terbaik
Catatan:
EasyCom Web membutuhkan internet untuk login, room, QR, dan signaling.
Untuk minim delay, semua crew sebaiknya berada di Wi-Fi/hotspot yang sama.
Gunakan headset kabel. Bluetooth/TWS bisa menambah delay.`
    : "";
  const waUrl = result
    ? `https://wa.me/62${String(result.vendor.whatsapp).replace(/^0/, "")}?text=${encodeURIComponent(loginInfo)}`
    : "#";

  return (
    <AdminShell title="Create Vendor">
      <section className="glass max-w-2xl rounded-[1.5rem] p-5">
        <form className="grid gap-4" onSubmit={submit}>
          <input className="input-field" placeholder="Vendor name" value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} />
          <input className="input-field" placeholder="Display name" value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} />
          <input className="input-field" placeholder="Slug, example vendor-name" />
          <input className="input-field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input-field" placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          <input className="input-field" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <input type="checkbox" checked={form.autoCreateLicense} onChange={(e) => setForm({ ...form, autoCreateLicense: e.target.checked })} />
            <span className="font-bold">Auto create license</span>
          </label>
          {form.autoCreateLicense ? (
            <div className="grid gap-3 md:grid-cols-2">
              <select className="input-field" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                <option value="trial">trial</option>
                <option value="web_license">web_license</option>
                <option value="custom">custom</option>
              </select>
              <input className="input-field" value="Rp49.000" readOnly />
              <input className="input-field" type="number" placeholder="Max users" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: Number(e.target.value) })} />
              <input className="input-field" type="number" placeholder="Recommended users" value={form.recommendedUsers} onChange={(e) => setForm({ ...form, recommendedUsers: Number(e.target.value) })} />
              <input className="input-field" type="number" placeholder="Max active rooms" value={form.maxActiveRooms} onChange={(e) => setForm({ ...form, maxActiveRooms: Number(e.target.value) })} />
              <input className="input-field" placeholder="Update until" value={form.updateUntil} onChange={(e) => setForm({ ...form, updateUntil: e.target.value })} />
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <input type="checkbox" checked={form.lifetimeUse} onChange={(e) => setForm({ ...form, lifetimeUse: e.target.checked })} />
                <span className="font-bold">Lifetime use</span>
              </label>
            </div>
          ) : null}
          {error ? <div className="rounded-2xl border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</div> : null}
          <button className="btn-primary" type="submit">Create Vendor</button>
        </form>
        {result ? (
          <div className="mt-5 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-4 text-sm text-emerald-50">
            <p className="font-black">Vendor created successfully.</p>
            <p className="mt-2">Package: EasyCom Web License - Rp49.000</p>
            <p>Features: All EasyCom Web features included</p>
            <p>Login URL: https://easycom.vjmrtim.my.id/login</p>
            <p>Email: {result.vendor.email}</p>
            <p>WhatsApp: {result.vendor.whatsapp}</p>
            <p>Password: {form.password}</p>
            <p>License: {result.license?.license_key || "-"}</p>
            <p>Max users per room: {result.license?.max_users || form.maxUsers}</p>
            <p>Recommended active crew: {result.license?.recommended_users || form.recommendedUsers}</p>
            <p>Max active rooms: {result.license?.max_active_rooms || form.maxActiveRooms}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-secondary" type="button" onClick={() => navigator.clipboard.writeText(loginInfo)}>Copy Login Info</button>
              <button className="btn-secondary" type="button" onClick={() => navigator.clipboard.writeText(loginInfo)}>Copy WhatsApp Message</button>
              <a className="btn-primary" href={waUrl}>Open WhatsApp</a>
              <Link className="btn-secondary" href={`/admin/vendors/${result.vendor.id}`}>Open vendor</Link>
            </div>
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}
