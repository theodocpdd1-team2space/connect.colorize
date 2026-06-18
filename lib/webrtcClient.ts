"use client";

import type { Socket } from "socket.io-client";

export type RemoteStreamHandler = (userId: string, stream: MediaStream) => void;

export type PeerUser = {
  id: string;
  name: string;
  role: string;
};

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

  async getMicrophone() {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });
    this.setMicEnabled(false);
    return this.localStream;
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
      iceServers: this.iceServers
    });

    this.localStream?.getTracks().forEach((track) => {
      if (this.localStream) pc.addTrack(track, this.localStream);
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
