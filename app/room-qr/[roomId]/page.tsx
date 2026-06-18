"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import QRCodePanel from "@/components/QRCodePanel";
import StatusCard from "@/components/StatusCard";
import DashboardShell from "@/components/DashboardShell";
import { getSocket, resetSocket } from "@/lib/socketClient";

type RoomData = {
  room: {
    id: string;
    event_name: string;
    room_pin: string | null;
    pin_enabled: 0 | 1;
    status: string;
    max_users: number;
  };
  joinUrl: string;
};

export default function RoomQrPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const [data, setData] = useState<RoomData | null>(null);
  const [connectedUsers, setConnectedUsers] = useState(0);

  useEffect(() => {
    fetch(`/api/rooms/${params.roomId}`)
      .then((response) => response.json())
      .then(setData)
      .catch(() => undefined);

    const socket = getSocket();
    socket.connect();
    socket.emit("monitor-room", { roomId: params.roomId });
    socket.on("room-monitor", (state) => setConnectedUsers(Number(state.connectedUsers || 0)));
    return () => {
      socket.off("room-monitor");
      resetSocket();
    };
  }, [params.roomId]);

  async function copyLink() {
    if (data?.joinUrl) await navigator.clipboard.writeText(data.joinUrl);
  }

  async function endRoom() {
    await fetch(`/api/rooms/${params.roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end" })
    });
    router.push("/dashboard");
  }

  return (
    <DashboardShell>
      {!data ? <div className="glass rounded-[1.5rem] p-5">Loading room...</div> : (
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <QRCodePanel value={data.joinUrl} label="QR join link" />
          <section className="space-y-4">
            <div className="glass rounded-[1.5rem] p-5">
              <p className="text-sm font-black uppercase text-cyan-200">Room QR</p>
              <h1 className="mt-2 text-4xl font-black">{data.room.event_name}</h1>
              <p className="mt-3 break-all text-sm text-slate-300">{data.joinUrl}</p>
              {data.room.pin_enabled ? <p className="mt-2 text-sm font-bold text-cyan-100">Room PIN: {data.room.room_pin}</p> : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatusCard label="Connected" value={`${connectedUsers}/${data.room.max_users}`} />
              <StatusCard label="Status" value={data.room.status} />
              <StatusCard label="Mode" value="Web" />
            </div>
            <div className="glass rounded-[1.5rem] p-5">
              <h2 className="text-xl font-black">Crew Instructions</h2>
              <ol className="mt-4 space-y-2 text-sm text-slate-200">
                <li>1. All crew connect to same Wi-Fi/hotspot</li>
                <li>2. Open QR/link</li>
                <li>3. Allow microphone</li>
                <li>4. Use wired headset</li>
                <li>5. Press and hold Push-to-Talk or use Toggle Mic</li>
              </ol>
              <div className="mt-5 flex flex-wrap gap-2">
                <button className="btn-primary" type="button" onClick={copyLink}>Copy Link</button>
                <Link className="btn-secondary" href={`/room/${data.room.id}`}>Open Room Monitor</Link>
                <button className="btn-secondary" type="button" onClick={endRoom}>End Room</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
