"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import AdminStatCard from "@/components/AdminStatCard";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((response) => {
        if (response.status === 401) location.href = "/admin/login";
        return response.json();
      })
      .then((data) => setSettings(data.settings));
  }, []);

  return (
    <AdminShell title="Settings">
      {!settings ? <div className="glass rounded-[1.5rem] p-5">Loading settings...</div> : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <AdminStatCard label="APP_URL" value={settings.appUrl} />
            <AdminStatCard label="NODE_ENV" value={settings.nodeEnv} />
            <AdminStatCard label="PORT" value={settings.port} />
            <AdminStatCard label="App version" value={settings.appVersion} />
            <AdminStatCard label="Free trial days" value={settings.freeTrialDays} />
            <AdminStatCard label="Trial max users" value={settings.trialMaxUsers} />
            <AdminStatCard label="Web license max users" value={settings.webLicenseMaxUsers} />
            <AdminStatCard label="Recommended active users" value={settings.recommendedActiveUsers} />
            <AdminStatCard label="Paid max active rooms" value={settings.paidMaxActiveRooms} />
            <AdminStatCard label="STUN/TURN" value={settings.stunTurnStatus} />
            <AdminStatCard label="Socket.IO status" value={settings.socketStatus} />
            <AdminStatCard label="Database path" value={settings.databasePath} />
          </div>
          <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4 text-cyan-50">
            Audio is not stored or recorded. Server only handles room, login, license, QR, and signaling.
          </div>
        </div>
      )}
    </AdminShell>
  );
}
