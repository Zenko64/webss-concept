const ICE_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

type StreamCallback = (stream: MediaStream | null) => void;
type Role = "outbound" | "inbound";

interface PeerEntry {
  pc: RTCPeerConnection;
  pendingCandidates: RTCIceCandidateInit[];
  remoteSet: boolean;
}

class WebRTCManager {
  private peers = new Map<string, { outbound?: PeerEntry; inbound?: PeerEntry }>();
  private remoteStreams = new Map<string, MediaStream>();
  private streamListeners = new Map<string, Set<StreamCallback>>();
  private localStream: MediaStream | null = null;

  emitOffer: (to: string, sdp: RTCSessionDescriptionInit) => void = () => {};
  emitAnswer: (to: string, sdp: RTCSessionDescriptionInit) => void = () => {};
  emitIceCandidate: (to: string, candidate: RTCIceCandidateInit) => void = () => {};

  setLocalStream(stream: MediaStream | null) {
    this.localStream = stream;
    if (!stream) {
      for (const [id, entry] of this.peers) {
        if (entry.outbound) {
          entry.outbound.pc.close();
          delete entry.outbound;
        }
        if (!entry.inbound) this.peers.delete(id);
      }
    }
  }

  hasLocalStream() {
    return this.localStream !== null;
  }

  async createOffer(spectatorId: string) {
    if (!this.localStream) return;
    this.dropPeer(spectatorId, "outbound");
    const entry = this.makePeer(spectatorId, "outbound");
    this.localStream.getTracks().forEach((t) => entry.pc.addTrack(t, this.localStream!));
    const offer = await entry.pc.createOffer();
    await entry.pc.setLocalDescription(offer);
    this.emitOffer(spectatorId, offer);
  }

  async handleOffer(broadcasterId: string, sdp: RTCSessionDescriptionInit) {
    this.dropPeer(broadcasterId, "inbound");
    const entry = this.makePeer(broadcasterId, "inbound");
    entry.pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (!stream) return;
      this.remoteStreams.set(broadcasterId, stream);
      this.notifyListeners(broadcasterId, stream);
    };
    await entry.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    entry.remoteSet = true;
    await this.flushCandidates(entry);
    const answer = await entry.pc.createAnswer();
    await entry.pc.setLocalDescription(answer);
    this.emitAnswer(broadcasterId, answer);
  }

  async handleAnswer(spectatorId: string, sdp: RTCSessionDescriptionInit) {
    const entry = this.peers.get(spectatorId)?.outbound;
    if (!entry) return;
    await entry.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    entry.remoteSet = true;
    await this.flushCandidates(entry);
  }

  async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
    const slot = this.peers.get(peerId);
    if (!slot) return;
    for (const entry of [slot.inbound, slot.outbound]) {
      if (!entry) continue;
      if (entry.remoteSet) {
        try { await entry.pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      } else {
        entry.pendingCandidates.push(candidate);
      }
    }
  }

  closePeer(peerId: string) {
    this.dropPeer(peerId, "outbound");
    this.dropPeer(peerId, "inbound");
    this.peers.delete(peerId);
    this.remoteStreams.delete(peerId);
    this.notifyListeners(peerId, null);
  }

  onStream(peerId: string, cb: StreamCallback): () => void {
    let set = this.streamListeners.get(peerId);
    if (!set) { set = new Set(); this.streamListeners.set(peerId, set); }
    set.add(cb);
    const existing = this.remoteStreams.get(peerId);
    if (existing) cb(existing);
    return () => this.streamListeners.get(peerId)?.delete(cb);
  }

  private makePeer(peerId: string, role: Role): PeerEntry {
    const pc = new RTCPeerConnection(ICE_CONFIG);
    pc.onicecandidate = (e) => {
      if (e.candidate) this.emitIceCandidate(peerId, e.candidate.toJSON());
    };
    const entry: PeerEntry = { pc, pendingCandidates: [], remoteSet: false };
    const slot = this.peers.get(peerId) ?? {};
    slot[role] = entry;
    this.peers.set(peerId, slot);
    return entry;
  }

  private dropPeer(peerId: string, role: Role) {
    const slot = this.peers.get(peerId);
    const entry = slot?.[role];
    if (!entry) return;
    entry.pc.close();
    delete slot![role];
  }

  private async flushCandidates(entry: PeerEntry) {
    const queued = entry.pendingCandidates.splice(0);
    for (const c of queued) {
      try { await entry.pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
    }
  }

  private notifyListeners(peerId: string, stream: MediaStream | null) {
    this.streamListeners.get(peerId)?.forEach((cb) => cb(stream));
  }
}

export const webrtcManager = new WebRTCManager();
