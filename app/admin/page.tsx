"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import StatusCard from "@/components/StatusCard";
import { getSocket, resetSocket } from "@/lib/socketClient";

type AdminState = {
  vendors: Array<{ id: string; vendor_name: string; email: string; whatsapp: string; license_count: number; active_room_count: number }>;
  licenses: Array<{ id: string; vendor_name: string; email: string; license_key: string; plan: string; status: string; max_users: number; max_active_rooms: number; update_until: string | null }>;
  activeRooms: Array<{ id: string; event_name: string; vendor_name: string; email: string; max_users: number; started_at: string }>;
  socketCount: number;
  version: string;
};

export default function PlatformAdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [state, setState] = useState<AdminState | null>(null);
  const [error, setError] = useState("");
  const [licenseForm, setLicenseForm] = useState({
    vendorLogin: "",
    plan: "web_license",
    maxUsers: 50,
    maxActiveRooms: 1,
    updateUntil: "",
    numberOfLicenses: 1
  });

  function login(event: FormEvent) {
    event.preventDefault();
    setError("");
    const socket = getSocket();
    socket.connect();
    socket.emit("admin-connect", { adminKey });
    socket.on("admin-error", ({ message }) => setError(message || "Admin error."));
    socket.on("admin-state", (nextState) => {
      setLoggedIn(true);
      setState(nextState);
    });
  }

  function generateLicense(event: FormEvent) {
    event.preventDefault();
    getSocket().emit("admin-generate-license", { adminKey, ...licenseForm });
  }

  function suspendLicense(licenseId: string) {
    getSocket().emit("admin-suspend-license", { adminKey, licenseId });
  }

  function extendLicense(licenseId: string) {
    const updateUntil = prompt("Update until ISO date, example 2027-06-19");
    if (updateUntil) getSocket().emit("admin-extend-license", { adminKey, licenseId, updateUntil });
  }

  function resetRoom(roomId: string) {
    getSocket().emit("admin-reset-room", { adminKey, roomId });
  }

  if (!loggedIn) {
    return (
      <main className="page-shell flex min-h-screen items-center justify-center">
        <section className="glass w-full max-w-md rounded-[1.75rem] p-6">
          <p className="text-sm font-black uppercase text-cyan-200">Platform Admin</p>
          <h1 className="mt-3 text-4xl font-black">EasyCom Admin</h1>
          <form className="mt-6 space-y-4" onSubmit={login}>
            <input className="input-field" placeholder="PLATFORM_ADMIN_KEY" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} />
            {error ? <div className="rounded-2xl border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</div> : null}
            <button className="btn-primary w-full" type="submit">Login</button>
            <Link className="btn-secondary w-full" href="/">Home</Link>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-cyan-200">Platform Admin</p>
          <h1 className="mt-2 text-4xl font-black">EasyCom Web</h1>
        </div>
        <button className="btn-secondary" type="button" onClick={() => { resetSocket(); setLoggedIn(false); }}>Logout</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatusCard label="Vendors" value={state?.vendors.length || 0} />
        <StatusCard label="Licenses" value={state?.licenses.length || 0} />
        <StatusCard label="Active Rooms" value={state?.activeRooms.length || 0} />
        <StatusCard label="Active Sockets" value={state?.socketCount || 0} helper={state?.version} />
      </div>

      <section className="glass mt-5 rounded-[1.5rem] p-5">
        <h2 className="text-2xl font-black">Generate Paid License</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={generateLicense}>
          <input className="input-field" placeholder="Vendor email/WhatsApp" value={licenseForm.vendorLogin} onChange={(e) => setLicenseForm({ ...licenseForm, vendorLogin: e.target.value })} />
          <select className="input-field" value={licenseForm.plan} onChange={(e) => setLicenseForm({ ...licenseForm, plan: e.target.value })}>
            <option value="web_license">web_license</option>
            <option value="additional_room">additional_room</option>
          </select>
          <input className="input-field" type="number" value={licenseForm.maxUsers} onChange={(e) => setLicenseForm({ ...licenseForm, maxUsers: Number(e.target.value) })} />
          <input className="input-field" type="number" value={licenseForm.maxActiveRooms} onChange={(e) => setLicenseForm({ ...licenseForm, maxActiveRooms: Number(e.target.value) })} />
          <input className="input-field" placeholder="Update until" value={licenseForm.updateUntil} onChange={(e) => setLicenseForm({ ...licenseForm, updateUntil: e.target.value })} />
          <input className="input-field" type="number" value={licenseForm.numberOfLicenses} onChange={(e) => setLicenseForm({ ...licenseForm, numberOfLicenses: Number(e.target.value) })} />
          <button className="btn-primary md:col-span-3" type="submit">Generate License</button>
        </form>
        {error ? <div className="mt-3 rounded-2xl border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</div> : null}
      </section>

      <section className="glass mt-5 overflow-x-auto rounded-[1.5rem] p-5">
        <h2 className="text-2xl font-black">Licenses</h2>
        <table className="mt-4 w-full min-w-[900px] text-left text-sm">
          <thead className="text-cyan-100"><tr><th className="p-3">Vendor</th><th className="p-3">Key</th><th className="p-3">Plan</th><th className="p-3">Status</th><th className="p-3">Users</th><th className="p-3">Rooms</th><th className="p-3">Action</th></tr></thead>
          <tbody>
            {state?.licenses.map((license) => (
              <tr key={license.id} className="border-t border-white/10 text-slate-200">
                <td className="p-3">{license.vendor_name}<br /><span className="text-xs text-slate-400">{license.email}</span></td>
                <td className="p-3">{license.license_key}</td>
                <td className="p-3">{license.plan}</td>
                <td className="p-3">{license.status}</td>
                <td className="p-3">{license.max_users}</td>
                <td className="p-3">{license.max_active_rooms}</td>
                <td className="p-3 space-x-2"><button className="text-amber-200" onClick={() => suspendLicense(license.id)}>Suspend</button><button className="text-cyan-200" onClick={() => extendLicense(license.id)}>Extend</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="glass mt-5 overflow-x-auto rounded-[1.5rem] p-5">
        <h2 className="text-2xl font-black">Active Rooms</h2>
        <table className="mt-4 w-full min-w-[760px] text-left text-sm">
          <tbody>
            {state?.activeRooms.map((room) => (
              <tr key={room.id} className="border-t border-white/10 text-slate-200">
                <td className="p-3">{room.event_name}</td>
                <td className="p-3">{room.vendor_name}</td>
                <td className="p-3">{room.max_users}</td>
                <td className="p-3"><button className="text-cyan-200" onClick={() => resetRoom(room.id)}>Reset active room/session</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
