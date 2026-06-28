"use client";

import { useEffect, useState } from "react";
import AdminBadge from "@/components/AdminBadge";
import AdminShell from "@/components/AdminShell";
import AdminTable from "@/components/AdminTable";

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [filters, setFilters] = useState({ status: "all", vendorId: "", date: "" });

  function load() {
    fetch(`/api/admin/rooms?status=${filters.status}&vendorId=${filters.vendorId}&date=${filters.date}`)
      .then((response) => {
        if (response.status === 401) location.href = "/admin/login";
        return response.json();
      })
      .then((data) => setRooms(data.rooms || []));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  async function action(roomId: string, actionName: string) {
    await fetch("/api/admin/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, action: actionName })
    });
    load();
  }

  return (
    <AdminShell title="Rooms">
      <div className="mb-4 flex flex-wrap gap-3">
        <select className="input-field max-w-xs" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="all">All rooms</option>
          <option value="active">active</option>
          <option value="ended">ended</option>
        </select>
        <input className="input-field max-w-xs" placeholder="Vendor ID" value={filters.vendorId} onChange={(e) => setFilters({ ...filters, vendorId: e.target.value })} />
        <input className="input-field max-w-xs" placeholder="YYYY-MM-DD" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
        <button className="btn-secondary" type="button" onClick={load}>Filter</button>
      </div>
      <AdminTable headers={["Room ID", "Event name", "Vendor", "Status", "Connected", "Max", "Created", "Started", "Ended", "Actions"]}>
        {rooms.map((room) => (
          <tr key={room.id} className="border-t border-white/10 text-slate-200">
            <td className="p-3 text-xs">{room.id}</td>
            <td className="p-3 font-bold">{room.event_name}</td>
            <td className="p-3">{room.vendor_name}<br /><span className="text-xs text-slate-400">{room.email}</span></td>
            <td className="p-3"><AdminBadge tone={room.status === "active" ? "green" : "slate"}>{room.status}</AdminBadge></td>
            <td className="p-3">{room.logged_connected_users || 0}</td>
            <td className="p-3">{room.max_users}</td>
            <td className="p-3">{new Date(room.created_at).toLocaleString()}</td>
            <td className="p-3">{room.started_at ? new Date(room.started_at).toLocaleString() : "-"}</td>
            <td className="p-3">{room.ended_at || "-"}</td>
            <td className="p-3 space-x-2">
              <button className="text-amber-200" onClick={() => action(room.id, "reset")}>Reset room</button>
              <button className="text-red-200" onClick={() => action(room.id, "end")}>End room</button>
            </td>
          </tr>
        ))}
      </AdminTable>
    </AdminShell>
  );
}
