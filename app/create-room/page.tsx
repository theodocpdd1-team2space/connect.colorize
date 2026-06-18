"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";

export default function CreateRoomPage() {
  const router = useRouter();
  const [eventName, setEventName] = useState("");
  const [pinEnabled, setPinEnabled] = useState(false);
  const [roomPin, setRoomPin] = useState("");
  const [maxUsers, setMaxUsers] = useState(2);
  const [planMax, setPlanMax] = useState(2);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((response) => response.json())
      .then((data) => {
        const max = Number(data.entitlement?.maxUsers || 2);
        setPlanMax(max);
        setMaxUsers(max);
      })
      .catch(() => undefined);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName, pinEnabled, roomPin, maxUsers })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Could not create room.");
      return;
    }
    router.push(`/room-qr/${data.room.id}`);
  }

  return (
    <DashboardShell>
      <section className="glass mx-auto max-w-xl rounded-[1.75rem] p-6">
        <p className="text-sm font-black uppercase text-cyan-200">Web Mode</p>
        <h1 className="mt-3 text-4xl font-black">Create Room</h1>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <input className="input-field" placeholder="Event name" value={eventName} onChange={(e) => setEventName(e.target.value)} />
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <input type="checkbox" checked={pinEnabled} onChange={(e) => setPinEnabled(e.target.checked)} />
            <span className="text-sm font-bold">Enable PIN</span>
          </label>
          {pinEnabled ? <input className="input-field" placeholder="Room PIN optional" value={roomPin} onChange={(e) => setRoomPin(e.target.value)} /> : null}
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-200">Max users</span>
            <input className="input-field" type="number" min={1} max={planMax} value={maxUsers} onChange={(e) => setMaxUsers(Number(e.target.value))} />
          </label>
          {error ? <div className="rounded-2xl border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</div> : null}
          <button className="btn-primary w-full" type="submit">Create Room</button>
        </form>
      </section>
    </DashboardShell>
  );
}
