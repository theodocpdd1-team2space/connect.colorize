"use client";

import type { Socket } from "socket.io-client";

export type RemoteStreamHandler = (userId: string, stream: MediaStream) => void;
export type AudioMode = "low-latency" | "clean-voice";
export type PeerHealth = {
  connectionType: "Local" | "Internet" | "Unknown";
  latencyLabel: "Excellent" | "Good" | "Fair" | "Poor" | "Unknown";
  rttMs: number | null;
  jitter: number | null;
  packetsLost: number | null;
};

export type PeerUser = {
  id: string;
  name: string;
};

export function getAudioConstraints(mode: AudioMode, noiseReduction: boolean): MediaStreamConstraints {
  const processingEnabled = mode === "clean-voice" ? noiseReduction : noiseReduction;
  return {
    audio: {
      echoCancellation: processingEnabled,
      noiseSuppression: processingEnabled,
      autoGainControl: processingEnabled,
      channelCount: 1,
      sampleRate: 48000,
      sampleSize: 16
    },
    video: false
  };
}

async function optimizeAudioSender(sender: RTCRtpSender) {
  try {
    const params = sender.getParameters();
    params.encodings = params.encodings?.length ? params.encodings : [{}];
    params.encodings[0].maxBitrate = 24000;
    (params.encodings[0] as RTCRtpEncodingParameters & { priority?: string }).priority = "high";
    await sender.setParameters(params);
  } catch {
    // Some mobile browsers do not support sender parameter updates.
  }
}

export class EasyComWebRTC {
  private peers = new Map<string, RTCPeerConnection>();
  private localStream: MediaStream | null = null;
  private iceServers: RTCIceServer[];

  constructor(
    private socket: Socket,
    private roomId: string,
    private onRemoteStream: RemoteStreamHandler,
    iceServers: RTCIceServer[] = []
  ) {
    this.iceServers = iceServers;
  }

  async getMicrophone(mode: AudioMode = "low-latency", noiseReduction = false) {
    this.localStream = await navigator.mediaDevices.getUserMedia(getAudioConstraints(mode, noiseReduction));
    this.setMicEnabled(false);
    return this.localStream;
  }

  async applyAudioSettings(mode: AudioMode, noiseReduction: boolean) {
    const oldStream = this.localStream;
    const nextStream = await navigator.mediaDevices.getUserMedia(getAudioConstraints(mode, noiseReduction));
    const [nextTrack] = nextStream.getAudioTracks();
    if (!nextTrack) {
      nextStream.getTracks().forEach((track) => track.stop());
      throw new Error("No microphone track available.");
    }

    nextTrack.enabled = false;
    this.localStream = nextStream;

    const replacements = Array.from(this.peers.values()).flatMap((pc) =>
      pc.getSenders()
        .filter((sender) => sender.track?.kind === "audio")
        .map(async (sender) => {
          await sender.replaceTrack(nextTrack);
          await optimizeAudioSender(sender);
        })
    );
    await Promise.allSettled(replacements);
    oldStream?.getTracks().forEach((track) => track.stop());
  }

  setMicEnabled(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  async createOfferFor(user: PeerUser) {
    const pc = this.getPeer(user.id);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.socket.emit("webrtc-offer", { roomId: this.roomId, targetId: user.id, offer });
  }

  async handleOffer(fromId: string, offer: RTCSessionDescriptionInit) {
    const pc = this.getPeer(fromId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.socket.emit("webrtc-answer", { roomId: this.roomId, targetId: fromId, answer });
  }

  async handleAnswer(fromId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peers.get(fromId);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleIceCandidate(fromId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peers.get(fromId);
    if (!pc || !candidate) return;
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  async getHealth(): Promise<PeerHealth> {
    const peers = Array.from(this.peers.values());
    for (const pc of peers) {
      try {
        const stats = await pc.getStats();
        let selectedPair: any = null;
        const candidates = new Map<string, any>();
        stats.forEach((report: any) => {
          if (report.type === "candidate-pair" && report.state === "succeeded" && (report.selected || !selectedPair)) {
            selectedPair = report;
          }
          if (report.type === "local-candidate" || report.type === "remote-candidate") {
            candidates.set(report.id, report);
          }
        });
        if (selectedPair) {
          const local = candidates.get(selectedPair.localCandidateId);
          const remote = candidates.get(selectedPair.remoteCandidateId);
          const rttMs = typeof selectedPair.currentRoundTripTime === "number" ? Math.round(selectedPair.currentRoundTripTime * 1000) : null;
          return {
            connectionType: local?.candidateType === "host" && remote?.candidateType === "host" ? "Local" : "Internet",
            latencyLabel: labelLatency(rttMs),
            rttMs,
            jitter: typeof selectedPair.jitter === "number" ? selectedPair.jitter : null,
            packetsLost: typeof selectedPair.packetsLost === "number" ? selectedPair.packetsLost : null
          };
        }
      } catch {
        // Ignore stats errors and try the next peer.
      }
    }
    return { connectionType: "Unknown", latencyLabel: "Unknown", rttMs: null, jitter: null, packetsLost: null };
  }

  closePeer(userId: string) {
    const pc = this.peers.get(userId);
    if (pc) {
      pc.close();
      this.peers.delete(userId);
    }
  }

  closeAll() {
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;
  }

  private getPeer(userId: string) {
    const existing = this.peers.get(userId);
    if (existing) return existing;

    const pc = new RTCPeerConnection({
      iceServers: this.iceServers,
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
      iceCandidatePoolSize: 0
    });

    this.localStream?.getTracks().forEach((track) => {
      if (!this.localStream) return;
      const sender = pc.addTrack(track, this.localStream);
      if (track.kind === "audio") {
        void optimizeAudioSender(sender);
      }
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit("ice-candidate", {
          roomId: this.roomId,
          targetId: userId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) this.onRemoteStream(userId, stream);
    };

    this.peers.set(userId, pc);
    return pc;
  }
}

function labelLatency(rttMs: number | null): PeerHealth["latencyLabel"] {
  if (rttMs === null) return "Unknown";
  if (rttMs <= 20) return "Excellent";
  if (rttMs <= 60) return "Good";
  if (rttMs <= 120) return "Fair";
  return "Poor";
}
