"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminBadge from "@/components/AdminBadge";
import AdminShell from "@/components/AdminShell";
import AdminTable from "@/components/AdminTable";

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  function load() {
    fetch(`/api/admin/vendors?search=${encodeURIComponent(search)}&status=${status}`)
      .then((response) => {
        if (response.status === 401) location.href = "/admin/login";
        return response.json();
      })
      .then((data) => setVendors(data.vendors || []));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  return (
    <AdminShell title="Vendors">
      <div className="mb-4 flex flex-wrap gap-3">
        <input className="input-field max-w-sm" placeholder="Search name, email, WhatsApp" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className="input-field max-w-xs" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All status</option>
          <option value="active">active</option>
          <option value="trial">trial</option>
          <option value="suspended">suspended</option>
          <option value="expired">expired</option>
        </select>
        <button className="btn-secondary" type="button" onClick={load}>Filter</button>
        <Link className="btn-primary" href="/admin/vendors/new">Create Vendor</Link>
      </div>
      <AdminTable headers={["ID", "Vendor", "Email", "WhatsApp", "Licenses", "Plan/Status", "Created", "Actions"]}>
        {vendors.map((vendor) => (
          <tr key={vendor.id} className="border-t border-white/10 text-slate-200">
            <td className="p-3 text-xs">{vendor.id}</td>
            <td className="p-3 font-bold">{vendor.vendor_name}</td>
            <td className="p-3">{vendor.email}</td>
            <td className="p-3">{vendor.whatsapp}</td>
            <td className="p-3">{vendor.license_count}</td>
            <td className="p-3 space-x-2"><AdminBadge tone="blue">{vendor.current_plan || "none"}</AdminBadge><AdminBadge tone={vendor.current_status === "active" ? "green" : "amber"}>{vendor.current_status || "none"}</AdminBadge></td>
            <td className="p-3">{new Date(vendor.created_at).toLocaleDateString()}</td>
            <td className="p-3 space-x-3">
              <Link className="text-cyan-200" href={`/admin/vendors/${vendor.id}`}>View/Edit</Link>
              <Link className="text-emerald-200" href={`/admin/licenses/new?vendorId=${vendor.id}`}>Generate License</Link>
            </td>
          </tr>
        ))}
      </AdminTable>
    </AdminShell>
  );
}
