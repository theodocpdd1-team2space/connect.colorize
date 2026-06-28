"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminBadge from "@/components/AdminBadge";
import AdminShell from "@/components/AdminShell";
import AdminTable from "@/components/AdminTable";

export default function AdminLicensesPage() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [filters, setFilters] = useState({ plan: "all", status: "all", lifetime: "all" });

  function load() {
    fetch(`/api/admin/licenses?plan=${filters.plan}&status=${filters.status}&lifetime=${filters.lifetime}`)
      .then((response) => {
        if (response.status === 401) location.href = "/admin/login";
        return response.json();
      })
      .then((data) => setLicenses(data.licenses || []));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  async function action(licenseId: string, actionName: string) {
    await fetch(`/api/admin/licenses/${licenseId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: actionName })
    });
    load();
  }

  return (
    <AdminShell title="Licenses">
      <div className="mb-4 flex flex-wrap gap-3">
        <select className="input-field max-w-xs" value={filters.plan} onChange={(e) => setFilters({ ...filters, plan: e.target.value })}>
          <option value="all">All plans</option>
          <option value="trial">trial</option>
          <option value="web_license">web_license</option>
          <option value="custom">custom</option>
        </select>
        <select className="input-field max-w-xs" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="all">All status</option>
          <option value="active">active</option>
          <option value="expired">expired</option>
          <option value="suspended">suspended</option>
        </select>
        <select className="input-field max-w-xs" value={filters.lifetime} onChange={(e) => setFilters({ ...filters, lifetime: e.target.value })}>
          <option value="all">All lifetime</option>
          <option value="true">lifetime true</option>
          <option value="false">lifetime false</option>
        </select>
        <button className="btn-secondary" type="button" onClick={load}>Filter</button>
        <Link className="btn-primary" href="/admin/licenses/new">Generate License</Link>
      </div>
      <AdminTable headers={["License key", "Vendor", "Plan", "Status", "Users", "Recommended", "Rooms", "Lifetime", "Update until", "Created", "Actions"]}>
        {licenses.map((license) => (
          <tr key={license.id} className="border-t border-white/10 text-slate-200">
            <td className="p-3">{license.license_key}</td>
            <td className="p-3">{license.vendor_name}<br /><span className="text-xs text-slate-400">{license.email}</span></td>
            <td className="p-3">{license.plan}</td>
            <td className="p-3"><AdminBadge tone={license.status === "active" ? "green" : license.status === "suspended" ? "red" : "amber"}>{license.status}</AdminBadge></td>
            <td className="p-3">{license.max_users}</td>
            <td className="p-3">{license.recommended_users}</td>
            <td className="p-3">{license.max_active_rooms}</td>
            <td className="p-3">{license.lifetime_use ? "true" : "false"}</td>
            <td className="p-3">{license.update_until || "-"}</td>
            <td className="p-3">{new Date(license.created_at).toLocaleDateString()}</td>
            <td className="p-3 space-x-2">
              <Link className="text-cyan-200" href={`/admin/licenses/${license.id}`}>View/Edit</Link>
              <button className="text-slate-200" onClick={() => navigator.clipboard.writeText(license.license_key)}>Copy Key</button>
              <button className="text-red-200" onClick={() => action(license.id, "suspend")}>Suspend</button>
              <button className="text-emerald-200" onClick={() => action(license.id, "activate")}>Activate</button>
              <button className="text-amber-200" onClick={() => action(license.id, "extend-year")}>Extend</button>
              <button className="text-cyan-200" onClick={() => action(license.id, "reset-rooms")}>Reset Active Room</button>
            </td>
          </tr>
        ))}
      </AdminTable>
    </AdminShell>
  );
}
