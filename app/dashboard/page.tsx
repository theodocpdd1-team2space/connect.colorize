"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import StatusCard from "@/components/StatusCard";

type DashboardData = {
  vendor: { vendor_name: string };
  entitlement: { primary?: { plan: string; status: string }; maxUsers: number; recommendedUsers: number; maxActiveRooms: number };
  trialDaysRemaining: number | null;
  activeRoomCount: number;
  rooms: Array<{ id: string; event_name: string; created_at: string; status: string; logged_users: number }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (response) => {
        if (response.status === 401) {
          location.href = "/login";
          return null;
        }
        return response.json();
      })
      .then((value) => value && setData(value))
      .catch(() => setError("Cannot load dashboard."));
  }, []);

  return (
    <DashboardShell>
      {error ? <div className="rounded-2xl border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</div> : null}
      {!data ? <div className="glass rounded-[1.5rem] p-5">Loading dashboard...</div> : (
        <div className="space-y-5">
          <section className="glass rounded-[1.5rem] p-6">
            <p className="text-sm font-black uppercase text-cyan-200">Vendor Dashboard</p>
            <h1 className="mt-2 text-4xl font-black">{data.vendor.vendor_name}</h1>
            <p className="mt-2 text-slate-300">
              {data.trialDaysRemaining !== null ? `${data.trialDaysRemaining} trial days remaining` : `License status: ${data.entitlement.primary?.status || "inactive"}`}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="btn-primary" href="/create-room">Create Room</Link>
              <Link className="btn-secondary" href="/pricing">View Pricing</Link>
            </div>
          </section>
          <div className="grid gap-3 sm:grid-cols-4">
            <StatusCard label="Active Rooms" value={`${data.activeRoomCount}/${data.entitlement.maxActiveRooms}`} />
            <StatusCard label="Plan" value={data.entitlement.primary?.plan || "none"} />
            <StatusCard label="Max Users" value={data.entitlement.maxUsers} />
            <StatusCard label="Recommended" value={data.entitlement.recommendedUsers} />
          </div>
          <section className="glass overflow-x-auto rounded-[1.5rem] p-5">
            <h2 className="text-2xl font-black">Recent Rooms</h2>
            <table className="mt-4 w-full min-w-[680px] text-left text-sm">
              <thead className="text-cyan-100"><tr><th className="p-3">Event name</th><th className="p-3">Date</th><th className="p-3">Users</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead>
              <tbody>
                {data.rooms.map((room) => (
                  <tr key={room.id} className="border-t border-white/10 text-slate-200">
                    <td className="p-3">{room.event_name}</td>
                    <td className="p-3">{new Date(room.created_at).toLocaleString()}</td>
                    <td className="p-3">{room.logged_users}</td>
                    <td className="p-3">{room.status}</td>
                    <td className="p-3">{room.status === "active" ? <Link className="text-cyan-200" href={`/room-qr/${room.id}`}>View QR</Link> : "Ended"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
