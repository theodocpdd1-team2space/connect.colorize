"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminBadge from "@/components/AdminBadge";
import AdminShell from "@/components/AdminShell";
import AdminTable from "@/components/AdminTable";

export default function VendorDetailPage() {
  const params = useParams<{ vendorId: string }>();
  const [data, setData] = useState<any>(null);
  const [profile, setProfile] = useState({ vendorName: "", email: "", whatsapp: "" });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  function load() {
    fetch(`/api/admin/vendors/${params.vendorId}`)
      .then((response) => response.json())
      .then((next) => {
        setData(next);
        setProfile({ vendorName: next.vendor.vendor_name, email: next.vendor.email, whatsapp: next.vendor.whatsapp });
      });
  }

  useEffect(load, [params.vendorId]);

  async function post(body: any) {
    const response = await fetch(`/api/admin/vendors/${params.vendorId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const next = await response.json();
    setMessage(response.ok ? "Saved." : next.message || "Action failed.");
    load();
  }

  function saveProfile(event: FormEvent) {
    event.preventDefault();
    void post(profile);
  }

  function resetPassword(event: FormEvent) {
    event.preventDefault();
    void post({ action: "reset-password", password, confirmPassword });
  }

  return (
    <AdminShell title="Vendor Detail">
      {!data ? <div className="glass rounded-[1.5rem] p-5">Loading vendor...</div> : (
        <div className="space-y-5">
          <section className="glass rounded-[1.5rem] p-5">
            <h2 className="text-2xl font-black">{data.vendor.vendor_name}</h2>
            <p className="mt-2 text-sm text-slate-300">{data.vendor.email} · {data.vendor.whatsapp} · Created {new Date(data.vendor.created_at).toLocaleString()}</p>
            <p className="mt-2 text-sm text-cyan-100">Active rooms: {data.rooms.filter((room: any) => room.status === "active").length}</p>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <form className="glass rounded-[1.5rem] p-5 space-y-3" onSubmit={saveProfile}>
              <h3 className="text-xl font-black">Edit Profile</h3>
              <input className="input-field" value={profile.vendorName} onChange={(e) => setProfile({ ...profile, vendorName: e.target.value })} />
              <input className="input-field" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              <input className="input-field" value={profile.whatsapp} onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })} />
              <button className="btn-primary" type="submit">Save</button>
            </form>
            <form className="glass rounded-[1.5rem] p-5 space-y-3" onSubmit={resetPassword}>
              <h3 className="text-xl font-black">Reset Password</h3>
              <input className="input-field" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <input className="input-field" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <button className="btn-secondary" type="submit">Reset Password</button>
            </form>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link className="btn-primary" href={`/admin/licenses/new?vendorId=${params.vendorId}`}>Generate New License</Link>
            <button className="btn-secondary" type="button" onClick={() => post({ action: "suspend-all" })}>Suspend All Licenses</button>
            <button className="btn-secondary" type="button" onClick={() => post({ action: "activate-all" })}>Activate All Licenses</button>
          </div>
          {message ? <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-3 text-sm text-cyan-50">{message}</div> : null}

          <section>
            <h3 className="mb-3 text-2xl font-black">Licenses</h3>
            <AdminTable headers={["Key", "Plan", "Status", "Users", "Rooms", "Action"]}>
              {data.licenses.map((license: any) => (
                <tr key={license.id} className="border-t border-white/10 text-slate-200">
                  <td className="p-3">{license.license_key}</td>
                  <td className="p-3">{license.plan}</td>
                  <td className="p-3"><AdminBadge tone={license.status === "active" ? "green" : "red"}>{license.status}</AdminBadge></td>
                  <td className="p-3">{license.max_users}</td>
                  <td className="p-3">{license.max_active_rooms}</td>
                  <td className="p-3"><Link className="text-cyan-200" href={`/admin/licenses/${license.id}`}>Edit</Link></td>
                </tr>
              ))}
            </AdminTable>
          </section>

          <section>
            <h3 className="mb-3 text-2xl font-black">Room History</h3>
            <AdminTable headers={["Event", "Status", "Max users", "Created", "Ended"]}>
              {data.rooms.map((room: any) => (
                <tr key={room.id} className="border-t border-white/10 text-slate-200">
                  <td className="p-3">{room.event_name}</td>
                  <td className="p-3">{room.status}</td>
                  <td className="p-3">{room.max_users}</td>
                  <td className="p-3">{new Date(room.created_at).toLocaleString()}</td>
                  <td className="p-3">{room.ended_at || "-"}</td>
                </tr>
              ))}
            </AdminTable>
          </section>
        </div>
      )}
    </AdminShell>
  );
}
