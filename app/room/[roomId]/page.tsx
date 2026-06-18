"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ConnectionBadge from "@/components/ConnectionBadge";
import MicControl, { MicMode } from "@/components/MicControl";
import UserList, { RoomUser } from "@/components/UserList";
import { getSocket, resetSocket } from "@/lib/socketClient";
import { EasyComWebRTC } from "@/lib/webrtcClient";

type CrewProfile = { name: string; role: string; pin?: string };
type Status = "Connecting" | "Connected" | "Reconnecting" | "Mic Blocked" | "Disconnected";

export default function WebRoomPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<CrewProfile | null>(null);
  const [eventName, setEventName] = useState("EasyCom Room");
  const [status, setStatus] = useState<Status>("Connecting");
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [selfId, setSelfId] = useState("");
  const [mode, setMode] = useState<MicMode>("ptt");
  const [isMicOn, setIsMicOn] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [audioUnlockNeeded, setAudioUnlockNeeded] = useState(false);
  const [warning, setWarning] = useState("");
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const rtcRef = useRef<EasyComWebRTC | null>(null);
  const joinedRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(`easycomCrew:${params.roomId}`);
    if (!saved) {
      router.replace(`/join/${params.roomId}`);
      return;
    }
    const crew = JSON.parse(saved) as CrewProfile;
    setProfile(crew);

    const socket = getSocket();
    const rtc = new EasyComWebRTC(socket, params.roomId, (userId, stream) => {
      if (!audioContainerRef.current || userId === socket.id) return;
      let audio = audioContainerRef.current.querySelector<HTMLAudioElement>(`audio[data-user-id="${userId}"]`);
      if (!audio) {
        audio = document.createElement("audio");
        audio.dataset.userId = userId;
        audio.autoplay = true;
        audio.setAttribute("playsinline", "true");
        audioContainerRef.current.appendChild(audio);
      }
      audio.srcObject = stream;
      audio.muted = speakerMuted;
      audio.play().catch(() => setAudioUnlockNeeded(true));
    });
    rtcRef.current = rtc;

    async function start() {
      try {
        await rtc.getMicrophone();
      } catch {
        setStatus("Mic Blocked");
        setWarning("Microphone access blocked. Please allow microphone permission and open EasyCom through HTTPS.");
      }
      socket.connect();
      socket.emit("join-room", { roomId: params.roomId, name: crew.name, role: crew.role, pin: crew.pin || "" });
    }

    socket.on("connect", () => {
      if (joinedRef.current) setStatus("Connected");
    });
    socket.on("disconnect", () => {
      micOff();
      setStatus("Disconnected");
      joinedRef.current = false;
    });
    socket.io.on("reconnect_attempt", () => {
      micOff();
      setStatus("Reconnecting");
    });
    socket.on("join-accepted", ({ selfId: id, users: roomUsers, room }) => {
      joinedRef.current = true;
      setSelfId(id);
      setUsers(roomUsers);
      setEventName(room?.event_name || "EasyCom Room");
      setStatus((current) => (current === "Mic Blocked" ? current : "Connected"));
    });
    socket.on("join-error", ({ message }) => {
      setWarning(message || "Cannot join room.");
      setStatus("Disconnected");
    });
    socket.on("room-users", (roomUsers: RoomUser[]) => setUsers(roomUsers));
    socket.on("user-joined", (user: RoomUser) => {
      setUsers((current) => (current.some((item) => item.id === user.id) ? current : [...current, user]));
      if (joinedRef.current && user.id !== socket.id) {
        rtc.createOfferFor(user).catch(() => setWarning("Peer connection failed. Keep all crew on the same Wi-Fi/hotspot."));
      }
    });
    socket.on("user-left", ({ id }) => {
      rtc.closePeer(id);
      setUsers((current) => current.filter((user) => user.id !== id));
      audioContainerRef.current?.querySelector(`audio[data-user-id="${id}"]`)?.remove();
    });
    socket.on("ptt-state", ({ userId, speaking }) => {
      setUsers((current) => current.map((user) => (user.id === userId ? { ...user, speaking } : user)));
    });
    socket.on("webrtc-offer", ({ fromId, offer }) => rtc.handleOffer(fromId, offer).catch(() => setWarning("Could not answer incoming audio connection.")));
    socket.on("webrtc-answer", ({ fromId, answer }) => rtc.handleAnswer(fromId, answer).catch(() => setWarning("Could not complete outgoing audio connection.")));
    socket.on("ice-candidate", ({ fromId, candidate }) => rtc.handleIceCandidate(fromId, candidate).catch(() => undefined));
    socket.on("room-ended", ({ message }) => {
      setWarning(message || "Room ended.");
      leave(false);
    });
    socket.on("admin-reset-room", ({ message }) => {
      setWarning(message || "Room reset.");
      leave(false);
    });

    function handleVisibility() {
      if (document.hidden) micOff();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    start();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      rtc.closeAll();
      socket.removeAllListeners();
      socket.io.removeAllListeners("reconnect_attempt");
      resetSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.roomId, router]);

  useEffect(() => {
    audioContainerRef.current?.querySelectorAll("audio").forEach((audio) => {
      audio.muted = speakerMuted;
    });
  }, [speakerMuted]);

  function emitSpeaking(speaking: boolean) {
    getSocket().emit("ptt-state", { roomId: params.roomId, speaking });
    setUsers((current) => current.map((user) => (user.id === selfId ? { ...user, speaking } : user)));
  }

  function micOn() {
    if (status === "Mic Blocked" || status === "Disconnected") return;
    rtcRef.current?.setMicEnabled(true);
    setIsMicOn(true);
    emitSpeaking(true);
  }

  function micOff() {
    rtcRef.current?.setMicEnabled(false);
    setIsMicOn(false);
    emitSpeaking(false);
  }

  function changeMode(nextMode: MicMode) {
    if (nextMode === "ptt") micOff();
    setMode(nextMode);
  }

  function unlockAudio() {
    audioContainerRef.current?.querySelectorAll("audio").forEach((audio) => audio.play().catch(() => undefined));
    setAudioUnlockNeeded(false);
  }

  function leave(navigate = true) {
    micOff();
    getSocket().emit("leave-room");
    rtcRef.current?.closeAll();
    resetSocket();
    if (navigate) router.push(`/join/${params.roomId}`);
  }

  return (
    <main className="page-shell min-h-screen">
      <div ref={audioContainerRef} className="hidden" />
      <section className="mx-auto max-w-2xl space-y-4">
        <div className="glass rounded-[1.5rem] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase text-cyan-200">{eventName}</p>
              <h1 className="mt-1 text-3xl font-black">{profile?.role || "Crew"}</h1>
              <p className="mt-1 text-sm text-slate-300">{profile?.name}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <ConnectionBadge status={status} />
              <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">Web Mode</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-200/20 bg-cyan-200/10 p-3 text-sm text-cyan-50">
          Server handles room and signaling only. Audio is designed for peer-to-peer connection when all crew are on the same Wi-Fi/hotspot.
        </div>
        {warning ? <div className="rounded-2xl border border-amber-200/25 bg-amber-200/10 p-3 text-sm text-amber-50">{warning}</div> : null}
        {audioUnlockNeeded ? <button className="btn-primary w-full" type="button" onClick={unlockAudio}>Tap to enable audio</button> : null}

        <div className="glass rounded-[1.5rem] p-5">
          <UserList users={users} selfId={selfId} />
        </div>

        <div className="glass rounded-[1.5rem] p-6">
          <MicControl mode={mode} isMicOn={isMicOn} isSpeaking={isMicOn} onModeChange={changeMode} onMicOn={micOn} onMicOff={micOff} disabled={status === "Mic Blocked" || status === "Disconnected"} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button className="btn-secondary px-2 text-sm" type="button" onClick={() => setSpeakerMuted((value) => !value)}>{speakerMuted ? "Speaker Off" : "Mute Speaker"}</button>
          <button className="btn-secondary px-2 text-sm" type="button" onClick={() => leave(true)}>Leave Room</button>
          <button className="btn-secondary px-2 text-sm" type="button" onClick={() => setWarning("Use wired headset for best result. Bluetooth headset may add delay. Keep all crew on the same Wi-Fi/hotspot for best local audio path. Keep phone screen active during event.")}>Settings/help</button>
        </div>
      </section>
    </main>
  );
}
