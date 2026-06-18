"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const roles = ["Director", "Camera 1", "Camera 2", "Camera 3", "Camera 4", "Switcher", "Audio", "Floor", "Runner", "Custom"];

export default function CrewJoinPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const [roomName, setRoomName] = useState("EasyCom Room");
  const [pinEnabled, setPinEnabled] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Director");
  const [customRole, setCustomRole] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/rooms/${params.roomId}`)
      .then((response) => response.json())
      .then((data) => {
        setRoomName(data.room?.event_name || "EasyCom Room");
        setPinEnabled(Boolean(data.room?.pin_enabled));
      })
      .catch(() => setError("Room not found."));
  }, [params.roomId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const finalRole = role === "Custom" ? customRole.trim() : role;
    const response = await fetch(`/api/rooms/${params.roomId}/join-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role: finalRole, pin })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Cannot join room.");
      return;
    }
    localStorage.setItem(`easycomCrew:${params.roomId}`, JSON.stringify({ name: name.trim(), role: finalRole, pin }));
    router.push(`/room/${params.roomId}`);
  }

  return (
    <main className="page-shell flex min-h-screen items-center justify-center">
      <section className="glass w-full max-w-xl rounded-[1.75rem] p-6">
        <p className="text-sm font-black uppercase text-cyan-200">Join Web Intercom</p>
        <h1 className="mt-3 text-4xl font-black">{roomName}</h1>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <input className="input-field" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)}>
            {roles.map((item) => <option key={item}>{item}</option>)}
          </select>
          {role === "Custom" ? <input className="input-field" placeholder="Custom role" value={customRole} onChange={(e) => setCustomRole(e.target.value)} /> : null}
          {pinEnabled ? <input className="input-field" placeholder="Room PIN" value={pin} onChange={(e) => setPin(e.target.value)} /> : null}
          {error ? <div className="rounded-2xl border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</div> : null}
          <button className="btn-primary w-full" type="submit">Join Intercom</button>
        </form>
      </section>
    </main>
  );
}
