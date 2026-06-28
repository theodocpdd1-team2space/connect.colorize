"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ConnectionBadge from "@/components/ConnectionBadge";
import MicControl, { MicMode } from "@/components/MicControl";
import UserList, { RoomUser } from "@/components/UserList";
import { getSocket, resetSocket } from "@/lib/socketClient";
import { AudioMode, EasyComWebRTC, PeerHealth } from "@/lib/webrtcClient";

type CrewProfile = { name: string; pin?: string };
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
  const [audioMode, setAudioMode] = useState<AudioMode>("low-latency");
  const [noiseReduction, setNoiseReduction] = useState(false);
  const [keepAwake, setKeepAwake] = useState(true);
  const [wakeLockStatus, setWakeLockStatus] = useState<"On" | "Off" | "Unsupported">("Off");
  const [signalLatency, setSignalLatency] = useState<number | null>(null);
  const [peerHealth, setPeerHealth] = useState<PeerHealth>({
    connectionType: "Unknown",
    latencyLabel: "Unknown",
    rttMs: null,
    jitter: null,
    packetsLost: null
  });
  const [isMicOn, setIsMicOn] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [audioUnlockNeeded, setAudioUnlockNeeded] = useState(false);
  const [warning, setWarning] = useState("");
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const rtcRef = useRef<EasyComWebRTC | null>(null);
  const joinedRef = useRef(false);
  const wakeLockRef = useRef<any>(null);

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
        await rtc.getMicrophone("low-latency", false);
      } catch {
        setStatus("Mic Blocked");
        setWarning("Microphone access blocked. Please allow microphone permission and open EasyCom through HTTPS.");
      }
      socket.connect();
      socket.emit("join-room", { roomId: params.roomId, name: crew.name, pin: crew.pin || "" });
      void requestWakeLock();
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
    socket.io.on("reconnect", () => {
      micOff();
      socket.emit("join-room", { roomId: params.roomId, name: crew.name, pin: crew.pin || "" });
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
      if (document.hidden) {
        micOff();
      } else {
        void requestWakeLock();
      }
    }
    function handlePageExit() {
      micOff();
      socket.emit("ptt-state", { roomId: params.roomId, speaking: false });
    }
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageExit);
    window.addEventListener("beforeunload", handlePageExit);
    const pingTimer = window.setInterval(() => {
      socket.emit("latency-ping", { sentAt: Date.now() });
      rtc.getHealth().then(setPeerHealth).catch(() => undefined);
    }, 2000);
    socket.on("latency-pong", ({ sentAt }) => {
      if (typeof sentAt === "number") setSignalLatency(Date.now() - sentAt);
    });
    start();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageExit);
      window.removeEventListener("beforeunload", handlePageExit);
      window.clearInterval(pingTimer);
      void releaseWakeLock();
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

  async function applyAudioSettings(nextAudioMode: AudioMode, nextNoiseReduction: boolean) {
    micOff();
    try {
      await rtcRef.current?.applyAudioSettings(nextAudioMode, nextNoiseReduction);
      setWarning("Audio setting changed. Please rejoin room if the change does not apply.");
    } catch {
      setWarning("Audio setting changed. Please rejoin room if the change does not apply.");
    }
  }

  function changeAudioMode(nextAudioMode: AudioMode) {
    const defaultNoiseReduction = nextAudioMode === "clean-voice";
    setAudioMode(nextAudioMode);
    setNoiseReduction(defaultNoiseReduction);
    void applyAudioSettings(nextAudioMode, defaultNoiseReduction);
  }

  async function requestWakeLock(force = false) {
    if (!force && !keepAwake) return;
    if (!("wakeLock" in navigator)) {
      setWakeLockStatus("Unsupported");
      return;
    }
    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
      wakeLockRef.current.addEventListener?.("release", () => setWakeLockStatus("Off"));
      setWakeLockStatus("On");
    } catch {
      setWakeLockStatus("Off");
    }
  }

  async function releaseWakeLock() {
    try {
      await wakeLockRef.current?.release?.();
    } catch {
      // Wake Lock release may fail if the browser already released it.
    }
    wakeLockRef.current = null;
    setWakeLockStatus("Off");
  }

  function toggleWakeLock() {
    const next = !keepAwake;
    setKeepAwake(next);
    if (next) void requestWakeLock(true);
    else void releaseWakeLock();
  }

  function toggleNoiseReduction() {
    const nextNoiseReduction = !noiseReduction;
    setNoiseReduction(nextNoiseReduction);
    void applyAudioSettings(audioMode, nextNoiseReduction);
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
              <h1 className="mt-1 text-3xl font-black">{profile?.name || "Crew"}</h1>
            </div>
            <div className="flex flex-col items-end gap-2">
              <ConnectionBadge status={status} />
              <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">Web Mode</span>
              <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">Keep Awake: {wakeLockStatus}</span>
              <span className="rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-3 py-1 text-xs font-bold text-fuchsia-100">Latency: {peerHealth.latencyLabel}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-200/20 bg-cyan-200/10 p-3 text-sm text-cyan-50">
          Ultra-low latency Web Mode. Server handles room and signaling only. Audio uses local peer-to-peer when possible.
          <span className="mt-1 block text-xs text-cyan-100">Connection: {peerHealth.connectionType} · Signal: {signalLatency === null ? "Unknown" : `${signalLatency}ms`} · Peer RTT: {peerHealth.rttMs === null ? "Unknown" : `${peerHealth.rttMs}ms`}</span>
        </div>
        {warning ? <div className="rounded-2xl border border-amber-200/25 bg-amber-200/10 p-3 text-sm text-amber-50">{warning}</div> : null}
        {audioUnlockNeeded ? <button className="btn-primary w-full" type="button" onClick={unlockAudio}>Tap to enable audio</button> : null}

        <div className="glass rounded-[1.5rem] p-5">
          <UserList users={users} selfId={selfId} />
        </div>

        <div className="glass rounded-[1.5rem] p-6">
          <div className="mb-4 space-y-3">
            <div className="grid grid-cols-2 rounded-2xl border border-white/10 bg-black/25 p-1">
              {(["low-latency", "clean-voice"] as AudioMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => changeAudioMode(item)}
                  className={`rounded-xl px-3 py-3 text-sm font-black transition ${
                    audioMode === item ? "bg-cyan-300 text-slate-950" : "text-slate-200"
                  }`}
                >
                  {item === "low-latency" ? "Ultra Low Latency" : "Clean Voice"}
                </button>
              ))}
            </div>
            <button
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-left text-sm font-bold text-slate-100"
              type="button"
              onClick={toggleNoiseReduction}
            >
              <span>Noise Reduction</span>
              <span className={`rounded-full px-3 py-1 text-xs ${noiseReduction ? "bg-cyan-300 text-slate-950" : "bg-white/10 text-slate-200"}`}>
                {noiseReduction ? "On" : "Off"}
              </span>
            </button>
            <div className="rounded-2xl border border-amber-200/25 bg-amber-200/10 p-3 text-sm text-amber-50">
              {audioMode === "low-latency" && !noiseReduction
                ? "Ultra Low Latency reduces audio processing for faster response. Use wired headset to avoid echo."
                : audioMode === "low-latency"
                  ? "Noise Reduction is on. Voice processing may add a little delay."
                  : noiseReduction
                    ? "Clean Voice Mode reduces background noise, but may add a little processing delay."
                    : "Clean Voice processing is off. This uses lower processing constraints for minim delay."}
            </div>
          </div>
          <MicControl mode={mode} isMicOn={isMicOn} isSpeaking={isMicOn} onModeChange={changeMode} onMicOn={micOn} onMicOff={micOff} disabled={status === "Mic Blocked" || status === "Disconnected"} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
          For the lowest delay, connect all crew to the same Wi-Fi/hotspot and use wired headset. Bluetooth may add noticeable delay. Keep screen active during event.
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button className="btn-secondary px-2 text-sm" type="button" onClick={toggleWakeLock}>Keep Screen Awake: {keepAwake ? "On" : "Off"}</button>
          <button className="btn-secondary px-2 text-sm" type="button" onClick={() => setSpeakerMuted((value) => !value)}>{speakerMuted ? "Speaker Off" : "Mute Speaker"}</button>
          <button className="btn-secondary px-2 text-sm" type="button" onClick={() => leave(true)}>Leave Room</button>
          <button className="btn-secondary px-2 text-sm" type="button" onClick={() => setWarning("Phone lock may pause microphone or WebRTC in web mode. Keep screen active for reliable communication.")}>Settings/help</button>
        </div>
      </section>
    </main>
  );
}
