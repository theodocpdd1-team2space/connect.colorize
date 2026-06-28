"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminBadge from "@/components/AdminBadge";
import AdminShell from "@/components/AdminShell";
import AdminStatCard from "@/components/AdminStatCard";
import AdminTable from "@/components/AdminTable";

type Summary = {
  stats: Record<string, number>;
  recentVendors: any[];
  activeRooms: any[];
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    fetch("/api/admin/summary")
      .then((response) => {
        if (response.status === 401) location.href = "/admin/login";
        return response.json();
      })
      .then(setData)
      .catch(() => undefined);
  }, []);

  return (
    <AdminShell title="Dashboard">
      {!data ? <div className="glass rounded-[1.5rem] p-5">Loading admin dashboard...</div> : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label="Total vendors" value={data.stats.totalVendors} />
            <AdminStatCard label="Active licenses" value={data.stats.activeLicenses} />
            <AdminStatCard label="Trial vendors" value={data.stats.trialVendors} />
            <AdminStatCard label="Suspended licenses" value={data.stats.suspendedLicenses} />
            <AdminStatCard label="Active rooms" value={data.stats.activeRooms} />
            <AdminStatCard label="Rooms today" value={data.stats.roomsToday} />
            <AdminStatCard label="Connected users now" value={data.stats.connectedUsersNow} helper="Socket memory if available" />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="btn-primary" href="/admin/vendors/new?plan=paid">+ Create Paid Vendor</Link>
            <Link className="btn-secondary" href="/admin/licenses/new">+ Generate Rp49k License</Link>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => navigator.clipboard.writeText("Halo kak, lisensi EasyCom kamu sudah aktif ✅\\nLogin:\\nhttps://easycom.vjmrtim.my.id/login\\nPaket:\\nEasyCom Web License - Rp49.000")}
            >
              Copy Onboarding Message
            </button>
          </div>

          <section>
            <h2 className="mb-3 text-2xl font-black">Recent Vendors</h2>
            <AdminTable headers={["Vendor", "Email", "WhatsApp", "Plan", "Status", "Created", "Action"]}>
              {data.recentVendors.map((vendor) => (
                <tr key={vendor.id} className="border-t border-white/10 text-slate-200">
                  <td className="p-3">{vendor.vendor_name}</td>
                  <td className="p-3">{vendor.email}</td>
                  <td className="p-3">{vendor.whatsapp}</td>
                  <td className="p-3">{vendor.current_plan || "-"}</td>
                  <td className="p-3"><AdminBadge tone={vendor.current_status === "active" ? "green" : "amber"}>{vendor.current_status || "none"}</AdminBadge></td>
                  <td className="p-3">{new Date(vendor.created_at).toLocaleDateString()}</td>
                  <td className="p-3"><Link className="text-cyan-200" href={`/admin/vendors/${vendor.id}`}>View</Link></td>
                </tr>
              ))}
            </AdminTable>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black">Active Rooms</h2>
            <AdminTable headers={["Event", "Vendor", "Connected", "Max", "Created", "Action"]}>
              {data.activeRooms.map((room) => (
                <tr key={room.id} className="border-t border-white/10 text-slate-200">
                  <td className="p-3">{room.event_name}</td>
                  <td className="p-3">{room.vendor_name}</td>
                  <td className="p-3">{room.logged_connected_users || 0}</td>
                  <td className="p-3">{room.max_users}</td>
                  <td className="p-3">{new Date(room.created_at).toLocaleString()}</td>
                  <td className="p-3"><Link className="text-cyan-200" href="/admin/rooms">Reset/End</Link></td>
                </tr>
              ))}
            </AdminTable>
          </section>
        </div>
      )}
    </AdminShell>
  );
}
